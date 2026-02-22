import { buildPoolConfig } from "../../../config/config.js";
function parsePgArray(val) {
    if (Array.isArray(val))
        return val;
    if (typeof val === 'string') {
        const trimmed = val.replace(/^\{|\}$/g, '');
        return trimmed ? trimmed.split(',') : [];
    }
    return [];
}
function mapInternalType(internalType) {
    const typeMap = {
        'int2': 'smallint',
        'int4': 'integer',
        'int8': 'bigint',
        'float4': 'real',
        'float8': 'double precision',
        'bool': 'boolean',
        'timestamptz': 'timestamp with time zone',
        'timetz': 'time with time zone',
        'varchar': 'character varying',
        'bpchar': 'character',
        'varbit': 'bit varying',
    };
    return typeMap[internalType] || internalType;
}
function parseArrayColumn(raw) {
    if (Array.isArray(raw))
        return raw;
    if (typeof raw === 'string')
        return raw.replace(/^\{|\}$/g, '').split(',').filter(Boolean);
    return [];
}
export async function introspectDsql(connection, options) {
    const { onProgress, onDetailedProgress, } = options || {};
    const { Pool } = await import('pg');
    onProgress?.('connecting', connection.database);
    const poolConfig = await buildPoolConfig(connection);
    const pool = new Pool(poolConfig);
    try {
        onProgress?.('fetching_tables');
        onDetailedProgress?.({ step: 'tables', count: 0, status: 'fetching' });
        const tablesResult = await pool.query(`
            SELECT
                c.relname as table_name,
                n.nspname as table_schema,
                c.reltuples::bigint as row_count,
                obj_description(c.oid, 'pg_class') as table_comment
            FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = 'public'
                AND c.relkind = 'r'
            ORDER BY c.relname;
        `);
        onDetailedProgress?.({ step: 'tables', count: tablesResult.rows.length, status: 'done' });
        onProgress?.('fetching_columns');
        onDetailedProgress?.({ step: 'columns', count: 0, status: 'fetching' });
        const columnsResult = await pool.query(`
            SELECT
                c.table_name,
                c.column_name,
                c.data_type,
                c.udt_name,
                c.is_nullable = 'YES' as is_nullable,
                c.column_default,
                c.character_maximum_length,
                c.numeric_precision,
                c.numeric_scale,
                c.is_generated = 'ALWAYS' as is_generated,
                c.generation_expression,
                col_description(pgc.oid, c.ordinal_position::int) as column_comment
            FROM information_schema.columns c
            JOIN pg_class pgc ON pgc.relname = c.table_name
            JOIN pg_namespace pgn ON pgn.oid = pgc.relnamespace AND pgn.nspname = c.table_schema
            WHERE c.table_schema = 'public'
            ORDER BY c.table_name, c.ordinal_position;
        `);
        onDetailedProgress?.({ step: 'columns', count: columnsResult.rows.length, status: 'done' });
        onDetailedProgress?.({ step: 'constraints', count: 0, status: 'fetching' });
        const constraintsResult = await pool.query(`
            SELECT
                tc.table_name,
                tc.constraint_name,
                tc.constraint_type,
                (
                    SELECT array_agg(kcu.column_name ORDER BY kcu.ordinal_position)
                    FROM information_schema.key_column_usage kcu
                    WHERE kcu.constraint_name = tc.constraint_name
                      AND kcu.table_schema = tc.table_schema
                      AND kcu.table_name = tc.table_name
                ) as columns,
                ccu.table_name as referenced_table,
                (
                    SELECT array_agg(a.attname ORDER BY array_position(con.confkey, a.attnum))
                    FROM pg_constraint con
                    JOIN pg_class rel ON con.conrelid = rel.oid
                    JOIN pg_namespace nsp ON rel.relnamespace = nsp.oid
                    JOIN pg_attribute a ON a.attrelid = con.confrelid AND a.attnum = ANY(con.confkey)
                    WHERE con.conname = tc.constraint_name
                      AND nsp.nspname = tc.table_schema
                      AND rel.relname = tc.table_name
                ) as referenced_columns,
                rc.update_rule as on_update,
                rc.delete_rule as on_delete
            FROM information_schema.table_constraints tc
            LEFT JOIN information_schema.constraint_column_usage ccu
                ON tc.constraint_name = ccu.constraint_name AND tc.constraint_type = 'FOREIGN KEY'
            LEFT JOIN information_schema.referential_constraints rc
                ON tc.constraint_name = rc.constraint_name AND tc.table_schema = rc.constraint_schema
            WHERE tc.table_schema = 'public'
            GROUP BY tc.table_schema, tc.table_name, tc.constraint_name,
                     tc.constraint_type, ccu.table_name, rc.update_rule, rc.delete_rule;
        `);
        onDetailedProgress?.({ step: 'constraints', count: constraintsResult.rows.length, status: 'done' });
        onDetailedProgress?.({ step: 'indexes', count: 0, status: 'fetching' });
        const indexesResult = await pool.query(`
            SELECT
                t.relname as table_name,
                i.relname as index_name,
                am.amname as index_type,
                ix.indisunique as is_unique,
                ix.indisprimary as is_primary,
                pg_get_indexdef(ix.indexrelid) as index_definition,
                pg_get_expr(ix.indpred, ix.indrelid) as where_clause,
                pg_get_expr(ix.indexprs, ix.indrelid) as expression,
                obj_description(i.oid, 'pg_class') as index_comment,
                array_agg(a.attname ORDER BY array_position(ix.indkey, a.attnum))
                    FILTER (WHERE a.attnum > 0) as columns
            FROM pg_index ix
            JOIN pg_class t ON t.oid = ix.indrelid
            JOIN pg_class i ON i.oid = ix.indexrelid
            JOIN pg_namespace n ON n.oid = t.relnamespace
            JOIN pg_am am ON am.oid = i.relam
            LEFT JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
            WHERE n.nspname = 'public'
                AND NOT ix.indisprimary
            GROUP BY t.relname, i.relname, i.oid, am.amname,
                     ix.indisunique, ix.indisprimary, ix.indexrelid,
                     ix.indpred, ix.indexprs, ix.indrelid;
        `);
        onDetailedProgress?.({ step: 'indexes', count: indexesResult.rows.length, status: 'done' });
        onDetailedProgress?.({ step: 'checks', count: 0, status: 'fetching' });
        const checksResult = await pool.query(`
            SELECT
                c.relname as table_name,
                con.conname as constraint_name,
                pg_get_constraintdef(con.oid) as definition
            FROM pg_constraint con
            JOIN pg_class c ON c.oid = con.conrelid
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = 'public' AND con.contype = 'c';
        `);
        onDetailedProgress?.({ step: 'checks', count: checksResult.rows.length, status: 'done' });
        onProgress?.('fetching_enums');
        onDetailedProgress?.({ step: 'enums', count: 0, status: 'fetching' });
        const enumsResult = await pool.query(`
            SELECT
                t.typname as enum_name,
                n.nspname as enum_schema,
                array_agg(e.enumlabel ORDER BY e.enumsortorder) as enum_values
            FROM pg_type t
            JOIN pg_enum e ON t.oid = e.enumtypid
            JOIN pg_namespace n ON t.typnamespace = n.oid
            WHERE n.nspname = 'public'
            GROUP BY t.typname, n.nspname
            ORDER BY t.typname;
        `);
        onDetailedProgress?.({ step: 'enums', count: enumsResult.rows.length, status: 'done' });
        const enums = enumsResult.rows.map(row => ({
            name: row.enum_name,
            schema: row.enum_schema,
            values: Array.isArray(row.enum_values) ? row.enum_values : typeof row.enum_values === 'string' ? row.enum_values.replace(/^\{|\}$/g, '').split(',').filter(Boolean) : [],
        }));
        onProgress?.('fetching_domains');
        onDetailedProgress?.({ step: 'domains', count: 0, status: 'fetching' });
        const domainsResult = await pool.query(`
            SELECT
                t.typname as name,
                n.nspname as schema,
                pg_catalog.format_type(t.typbasetype, t.typtypmod) as base_type,
                t.typnotnull as is_not_null,
                pg_catalog.pg_get_expr(t.typdefaultbin, 0) as default_value,
                (SELECT pg_catalog.pg_get_constraintdef(c.oid)
                 FROM pg_constraint c
                 WHERE c.contypid = t.oid
                 LIMIT 1) as check_expression
            FROM pg_type t
            JOIN pg_namespace n ON t.typnamespace = n.oid
            WHERE t.typtype = 'd'
              AND n.nspname NOT LIKE 'pg_%'
              AND n.nspname != 'information_schema'
            ORDER BY n.nspname, t.typname
        `);
        onDetailedProgress?.({ step: 'domains', count: domainsResult.rows.length, status: 'done' });
        const domains = domainsResult.rows.map(row => ({
            name: row.name,
            baseType: row.base_type,
            isNotNull: row.is_not_null,
            defaultValue: row.default_value,
            checkExpression: row.check_expression,
        }));
        onProgress?.('fetching_sequences');
        onDetailedProgress?.({ step: 'sequences', count: 0, status: 'fetching' });
        let sequences = [];
        try {
            const sequencesResult = await pool.query(`
                SELECT
                    c.relname as name,
                    n.nspname as schema,
                    s.seqtypid::regtype::text as data_type,
                    s.seqstart::text as start_value,
                    s.seqincrement::text as increment,
                    s.seqmin::text as min_value,
                    s.seqmax::text as max_value,
                    s.seqcache::text as cache,
                    s.seqcycle as cycle,
                    d_table.relname as owned_by_table,
                    a.attname as owned_by_column
                FROM pg_sequence s
                JOIN pg_class c ON s.seqrelid = c.oid
                JOIN pg_namespace n ON c.relnamespace = n.oid
                LEFT JOIN pg_depend dep ON dep.objid = c.oid
                    AND dep.classid = 'pg_class'::regclass
                    AND dep.deptype = 'a'
                LEFT JOIN pg_class d_table ON dep.refobjid = d_table.oid
                    AND d_table.relkind = 'r'
                LEFT JOIN pg_attribute a ON a.attrelid = dep.refobjid
                    AND a.attnum = dep.refobjsubid
                WHERE n.nspname NOT LIKE 'pg_%'
                  AND n.nspname != 'information_schema'
                  AND NOT EXISTS (
                      SELECT 1 FROM pg_depend di
                      WHERE di.objid = c.oid
                        AND di.classid = 'pg_class'::regclass
                        AND di.deptype = 'i'
                  )
                ORDER BY n.nspname, c.relname
            `);
            sequences = sequencesResult.rows.map((row) => ({
                name: row.name,
                dataType: row.data_type,
                start: row.start_value ? Number(row.start_value) : undefined,
                increment: row.increment ? Number(row.increment) : undefined,
                minValue: row.min_value ? Number(row.min_value) : undefined,
                maxValue: row.max_value ? Number(row.max_value) : undefined,
                cache: row.cache ? Number(row.cache) : undefined,
                cycle: row.cycle,
                ownedBy: row.owned_by_table && row.owned_by_column
                    ? `${row.owned_by_table}.${row.owned_by_column}`
                    : undefined,
            }));
        }
        catch {
        }
        onDetailedProgress?.({ step: 'sequences', count: sequences.length, status: 'done' });
        onProgress?.('fetching_composite_types');
        onDetailedProgress?.({ step: 'composite_types', count: 0, status: 'fetching' });
        let compositeTypes = [];
        try {
            const compositeTypesResult = await pool.query(`
                SELECT
                    t.typname as name,
                    n.nspname as schema,
                    array_agg(a.attname ORDER BY a.attnum) as attribute_names,
                    array_agg(pg_catalog.format_type(a.atttypid, a.atttypmod) ORDER BY a.attnum) as attribute_types
                FROM pg_type t
                JOIN pg_namespace n ON t.typnamespace = n.oid
                JOIN pg_attribute a ON a.attrelid = t.typrelid
                    AND a.attnum > 0
                    AND NOT a.attisdropped
                WHERE t.typtype = 'c'
                  AND n.nspname NOT LIKE 'pg_%'
                  AND n.nspname != 'information_schema'
                  AND NOT EXISTS (
                      SELECT 1 FROM pg_class c
                      WHERE c.reltype = t.oid
                        AND c.relkind IN ('r', 'v', 'm', 'f', 'p')
                  )
                GROUP BY t.oid, t.typname, n.nspname
                ORDER BY n.nspname, t.typname
            `);
            compositeTypes = compositeTypesResult.rows.map(row => {
                const names = parsePgArray(row.attribute_names);
                const types = parsePgArray(row.attribute_types);
                return {
                    name: row.name,
                    attributes: names.map((attrName, i) => ({
                        name: attrName,
                        type: types[i] || 'unknown',
                    })),
                };
            });
        }
        catch {
        }
        onDetailedProgress?.({ step: 'composite_types', count: compositeTypes.length, status: 'done' });
        onProgress?.('processing');
        const columnsByTable = new Map();
        const constraintsByTable = new Map();
        const indexesByTable = new Map();
        const checksByTable = new Map();
        for (const col of columnsResult.rows) {
            if (!columnsByTable.has(col.table_name)) {
                columnsByTable.set(col.table_name, []);
            }
            let dataType = col.data_type;
            if (dataType === 'USER-DEFINED' && col.udt_name) {
                dataType = col.udt_name;
            }
            else if (col.udt_name) {
                dataType = col.udt_name;
            }
            columnsByTable.get(col.table_name).push({
                name: col.column_name,
                dataType,
                isNullable: col.is_nullable,
                defaultValue: col.column_default,
                isPrimaryKey: false,
                isUnique: false,
                maxLength: col.character_maximum_length,
                precision: col.numeric_precision,
                scale: col.numeric_scale,
                references: null,
                comment: col.column_comment,
                isGenerated: col.is_generated || false,
                generationExpression: col.generation_expression || null,
                identityGeneration: null,
            });
        }
        for (const con of constraintsResult.rows) {
            if (!constraintsByTable.has(con.table_name)) {
                constraintsByTable.set(con.table_name, new Map());
            }
            const constraintColumns = parseArrayColumn(con.columns);
            constraintsByTable.get(con.table_name).set(con.constraint_name, {
                type: con.constraint_type,
                columns: constraintColumns,
                referenced_table: con.referenced_table,
                referenced_columns: con.referenced_columns,
                on_delete: con.on_delete,
                on_update: con.on_update,
            });
            const columns = columnsByTable.get(con.table_name);
            if (columns) {
                for (const rawColName of constraintColumns) {
                    if (!rawColName)
                        continue;
                    const normalizedColName = rawColName.replace(/^"|"$/g, '').toLowerCase();
                    const col = columns.find(c => c.name.toLowerCase() === normalizedColName);
                    if (col && con.constraint_type === 'PRIMARY KEY') {
                        col.isPrimaryKey = true;
                    }
                }
            }
        }
        for (const idx of indexesResult.rows) {
            const tableConstraints = constraintsByTable.get(idx.table_name);
            if (tableConstraints?.has(idx.index_name)) {
                const con = tableConstraints.get(idx.index_name);
                if (con?.type === 'UNIQUE' || con?.type === 'PRIMARY KEY')
                    continue;
            }
            if (!indexesByTable.has(idx.table_name)) {
                indexesByTable.set(idx.table_name, []);
            }
            indexesByTable.get(idx.table_name).push({
                name: idx.index_name,
                columns: idx.columns || [],
                isUnique: idx.is_unique,
                isPrimary: idx.is_primary,
                type: idx.index_type,
                definition: idx.index_definition || undefined,
                whereClause: idx.where_clause || null,
                expression: idx.expression || null,
                comment: idx.index_comment || null,
            });
        }
        for (const chk of checksResult.rows) {
            if (!checksByTable.has(chk.table_name)) {
                checksByTable.set(chk.table_name, []);
            }
            checksByTable.get(chk.table_name).push({
                name: chk.constraint_name,
                type: 'CHECK',
                columns: [],
                definition: chk.definition,
            });
        }
        const tables = [];
        for (const row of tablesResult.rows) {
            const tableName = row.table_name;
            if (tableName.startsWith('_relq') || tableName.startsWith('_kuery'))
                continue;
            const allConstraints = [...(checksByTable.get(tableName) || [])];
            const tableConstraints = constraintsByTable.get(tableName);
            if (tableConstraints) {
                for (const [conName, con] of tableConstraints) {
                    const cols = parseArrayColumn(con.columns);
                    if (cols.length === 0)
                        continue;
                    const colList = cols.map(c => `"${c}"`).join(', ');
                    if (con.type === 'PRIMARY KEY') {
                        allConstraints.push({
                            name: conName, type: 'PRIMARY KEY', columns: cols,
                            definition: `PRIMARY KEY (${colList})`,
                        });
                    }
                    else if (con.type === 'UNIQUE') {
                        allConstraints.push({
                            name: conName, type: 'UNIQUE', columns: cols,
                            definition: `UNIQUE (${colList})`,
                        });
                    }
                    else if (con.type === 'FOREIGN KEY') {
                        const refCols = parseArrayColumn(con.referenced_columns);
                        const refColList = refCols.map(c => `"${c}"`).join(', ');
                        let definition = `FOREIGN KEY (${colList}) REFERENCES "${con.referenced_table}" (${refColList})`;
                        if (con.on_delete && con.on_delete !== 'NO ACTION')
                            definition += ` ON DELETE ${con.on_delete}`;
                        if (con.on_update && con.on_update !== 'NO ACTION')
                            definition += ` ON UPDATE ${con.on_update}`;
                        allConstraints.push({
                            name: conName, type: 'FOREIGN KEY', columns: cols, definition,
                        });
                    }
                }
            }
            tables.push({
                name: tableName,
                schema: row.table_schema,
                columns: columnsByTable.get(tableName) || [],
                indexes: indexesByTable.get(tableName) || [],
                constraints: allConstraints,
                rowCount: parseInt(row.row_count) || 0,
                isPartitioned: false,
                comment: row.table_comment || null,
            });
        }
        onProgress?.('fetching_collations');
        onDetailedProgress?.({ step: 'collations', count: 0, status: 'fetching' });
        const collationsResult = await pool.query(`
            SELECT
                c.collname as name,
                n.nspname as schema,
                c.collprovider as provider,
                c.collcollate as lc_collate,
                c.collctype as lc_ctype,
                c.collisdeterministic as deterministic
            FROM pg_collation c
            JOIN pg_namespace n ON c.collnamespace = n.oid
            WHERE n.nspname = 'public'
            ORDER BY c.collname;
        `);
        const collations = collationsResult.rows.map(c => ({
            name: c.name,
            schema: c.schema,
            provider: c.provider === 'i' ? 'icu' : c.provider === 'c' ? 'libc' : 'default',
            lcCollate: c.lc_collate,
            lcCtype: c.lc_ctype,
            deterministic: c.deterministic,
        }));
        onDetailedProgress?.({ step: 'collations', count: collations.length, status: 'done' });
        onDetailedProgress?.({ step: 'partitions', count: 0, status: 'done' });
        onDetailedProgress?.({ step: 'extensions', count: 0, status: 'done' });
        onDetailedProgress?.({ step: 'functions', count: 0, status: 'done' });
        onDetailedProgress?.({ step: 'triggers', count: 0, status: 'done' });
        onDetailedProgress?.({ step: 'foreign_servers', count: 0, status: 'done' });
        onDetailedProgress?.({ step: 'foreign_tables', count: 0, status: 'done' });
        onProgress?.('complete');
        return {
            tables,
            enums,
            domains,
            compositeTypes,
            sequences,
            collations,
            functions: [],
            triggers: [],
            policies: [],
            partitions: [],
            foreignServers: [],
            foreignTables: [],
            extensions: [],
        };
    }
    finally {
        await pool.end();
    }
}
