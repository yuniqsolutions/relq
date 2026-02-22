import { buildPoolConfig } from "../../config/config.js";
function mapInternalToFriendlyType(internalType) {
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
export async function introspectDatabase(connection, onProgress, options) {
    const { includeFunctions = false, includeTriggers = false } = options || {};
    const { Pool } = await import('pg');
    onProgress?.('connecting', connection.database);
    const poolConfig = await buildPoolConfig(connection);
    const pool = new Pool(poolConfig);
    try {
        onProgress?.('fetching_tables');
        const tablesResult = await pool.query(`
            SELECT 
                t.table_name,
                t.table_schema,
                (SELECT reltuples::bigint FROM pg_class WHERE relname = t.table_name) as row_count,
                obj_description((quote_ident(t.table_schema) || '.' || quote_ident(t.table_name))::regclass, 'pg_class') as table_comment
            FROM information_schema.tables t
            WHERE t.table_schema = 'public'
                AND t.table_type = 'BASE TABLE'
            ORDER BY t.table_name;
        `);
        const tables = [];
        const partitionNamesResult = await pool.query(`
            SELECT c.relname as name
            FROM pg_class c
            JOIN pg_namespace n ON c.relnamespace = n.oid
            WHERE n.nspname = 'public' AND c.relispartition = true;
        `);
        const partitionTableNames = new Set(partitionNamesResult.rows.map((r) => r.name));
        const nonPartitionTables = tablesResult.rows.filter((r) => !partitionTableNames.has(r.table_name) && !r.table_name.startsWith('_relq') && !r.table_name.startsWith('_kuery'));
        const totalTables = nonPartitionTables.length;
        let tableIndex = 0;
        for (let i = 0; i < tablesResult.rows.length; i++) {
            const row = tablesResult.rows[i];
            const tableName = row.table_name;
            const tableSchema = row.table_schema;
            const rowCount = parseInt(row.row_count) || 0;
            const isInternal = tableName.startsWith('_relq') || tableName.startsWith('_kuery');
            if (isInternal) {
                continue;
            }
            const isPartition = partitionTableNames.has(tableName);
            if (!isPartition) {
                tableIndex++;
                onProgress?.('parsing_table', `${tableName} (${tableIndex}/${totalTables})`);
            }
            const columnsResult = await pool.query(`
                SELECT 
                    c.column_name,
                    c.data_type,
                    c.udt_name,
                    c.is_nullable,
                    c.column_default,
                    c.character_maximum_length,
                    c.numeric_precision,
                    c.numeric_scale,
                    COALESCE(pk.is_pk, false) as is_primary_key,
                    COALESCE(uq.is_unique, false) as is_unique,
                    fk.foreign_table,
                    fk.foreign_column,
                    col_description(pgc.oid, c.ordinal_position::int) as column_comment
                FROM information_schema.columns c
                JOIN pg_class pgc ON pgc.relname = c.table_name
                JOIN pg_namespace pgn ON pgn.oid = pgc.relnamespace AND pgn.nspname = c.table_schema
                LEFT JOIN (
                    SELECT kcu.column_name, true as is_pk
                    FROM information_schema.table_constraints tc
                    JOIN information_schema.key_column_usage kcu 
                        ON tc.constraint_name = kcu.constraint_name
                    WHERE tc.table_name = $1 AND tc.constraint_type = 'PRIMARY KEY'
                ) pk ON pk.column_name = c.column_name
                LEFT JOIN (
                    -- Only mark as unique if column is the ONLY column in the unique constraint
                    -- (not part of a composite unique constraint)
                    SELECT kcu.column_name, true as is_unique
                    FROM information_schema.table_constraints tc
                    JOIN information_schema.key_column_usage kcu 
                        ON tc.constraint_name = kcu.constraint_name
                    WHERE tc.table_name = $1 AND tc.constraint_type = 'UNIQUE'
                    AND (
                        SELECT COUNT(*) FROM information_schema.key_column_usage kcu2
                        WHERE kcu2.constraint_name = tc.constraint_name
                    ) = 1
                ) uq ON uq.column_name = c.column_name
                LEFT JOIN (
                    SELECT 
                        kcu.column_name,
                        ccu.table_name as foreign_table,
                        ccu.column_name as foreign_column
                    FROM information_schema.table_constraints tc
                    JOIN information_schema.key_column_usage kcu 
                        ON tc.constraint_name = kcu.constraint_name
                    JOIN information_schema.constraint_column_usage ccu 
                        ON tc.constraint_name = ccu.constraint_name
                    WHERE tc.table_name = $1 AND tc.constraint_type = 'FOREIGN KEY'
                ) fk ON fk.column_name = c.column_name
                WHERE c.table_name = $1 AND c.table_schema = $2
                ORDER BY c.ordinal_position;
            `, [tableName, tableSchema]);
            const columns = columnsResult.rows.map(col => {
                let dataType = col.data_type;
                if (dataType === 'ARRAY' && col.udt_name) {
                    const baseType = col.udt_name.startsWith('_') ? col.udt_name.slice(1) : col.udt_name;
                    const friendlyBase = mapInternalToFriendlyType(baseType);
                    dataType = `${friendlyBase}[]`;
                }
                else if (dataType === 'USER-DEFINED' && col.udt_name) {
                    dataType = col.udt_name;
                }
                return {
                    name: col.column_name,
                    dataType,
                    isNullable: col.is_nullable === 'YES',
                    defaultValue: col.column_default,
                    isPrimaryKey: col.is_primary_key,
                    isUnique: col.is_unique,
                    maxLength: col.character_maximum_length,
                    precision: col.numeric_precision,
                    scale: col.numeric_scale,
                    references: col.foreign_table ? {
                        table: col.foreign_table,
                        column: col.foreign_column,
                    } : null,
                    comment: col.column_comment || undefined,
                };
            });
            const indexesResult = await pool.query(`
                SELECT 
                    i.relname as index_name,
                    array_agg(a.attname ORDER BY k.n) as columns,
                    ix.indisunique as is_unique,
                    ix.indisprimary as is_primary,
                    am.amname as index_type,
                    obj_description(i.oid, 'pg_class') as index_comment
                FROM pg_index ix
                JOIN pg_class t ON t.oid = ix.indrelid
                JOIN pg_class i ON i.oid = ix.indexrelid
                JOIN pg_am am ON am.oid = i.relam
                JOIN LATERAL unnest(ix.indkey) WITH ORDINALITY AS k(attnum, n) ON true
                JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = k.attnum
                WHERE t.relname = $1
                GROUP BY i.relname, i.oid, ix.indisunique, ix.indisprimary, am.amname
                ORDER BY i.relname;
            `, [tableName]);
            const indexes = indexesResult.rows.map(idx => ({
                name: idx.index_name,
                columns: idx.columns,
                isUnique: idx.is_unique,
                isPrimary: idx.is_primary,
                type: idx.index_type,
                comment: idx.index_comment || null,
            }));
            const constraintsResult = await pool.query(`
                SELECT 
                    con.conname as name,
                    CASE con.contype 
                        WHEN 'p' THEN 'PRIMARY KEY'
                        WHEN 'f' THEN 'FOREIGN KEY'
                        WHEN 'u' THEN 'UNIQUE'
                        WHEN 'c' THEN 'CHECK'
                        WHEN 'x' THEN 'EXCLUDE'
                    END as type,
                    array_agg(a.attname ORDER BY u.attposition) as columns,
                    pg_get_constraintdef(con.oid) as definition,
                    conf.relname as referenced_table
                FROM pg_constraint con
                JOIN pg_class c ON c.oid = con.conrelid
                JOIN pg_namespace n ON n.oid = c.relnamespace
                LEFT JOIN pg_class conf ON conf.oid = con.confrelid
                LEFT JOIN unnest(con.conkey) WITH ORDINALITY u(attnum, attposition) ON true
                LEFT JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = u.attnum
                WHERE c.relname = $1 AND n.nspname = 'public'
                GROUP BY con.oid, con.conname, con.contype, conf.relname
                ORDER BY con.conname;
            `, [tableName]);
            const constraints = constraintsResult.rows.map(c => ({
                name: c.name,
                type: c.type,
                columns: c.columns || [],
                definition: c.definition || '',
                referencedTable: c.referenced_table,
            }));
            const partitionCheckResult = await pool.query(`
                SELECT 
                    c.relkind = 'p' as is_partitioned,
                    CASE pt.partstrat 
                        WHEN 'r' THEN 'RANGE'
                        WHEN 'l' THEN 'LIST'
                        WHEN 'h' THEN 'HASH'
                    END as partition_type,
                    array_agg(a.attname) as partition_key
                FROM pg_class c
                JOIN pg_namespace n ON n.oid = c.relnamespace
                LEFT JOIN pg_partitioned_table pt ON pt.partrelid = c.oid
                LEFT JOIN unnest(pt.partattrs) WITH ORDINALITY pk(attnum, ord) ON true
                LEFT JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = pk.attnum
                WHERE c.relname = $1 AND n.nspname = 'public'
                GROUP BY c.relkind, pt.partstrat;
            `, [tableName]);
            const partitionInfo = partitionCheckResult.rows[0] || {};
            let partitionKey;
            if (partitionInfo.partition_key) {
                partitionKey = Array.isArray(partitionInfo.partition_key)
                    ? partitionInfo.partition_key.filter(Boolean)
                    : typeof partitionInfo.partition_key === 'string'
                        ? [partitionInfo.partition_key]
                        : undefined;
            }
            tables.push({
                name: tableName,
                schema: tableSchema,
                columns,
                indexes,
                constraints,
                rowCount,
                isPartitioned: partitionInfo.is_partitioned || false,
                partitionType: partitionInfo.partition_type,
                partitionKey,
                comment: row.table_comment || null,
            });
        }
        onProgress?.('fetching_extensions');
        const extensionsResult = await pool.query(`
            SELECT extname FROM pg_extension WHERE extname != 'plpgsql';
        `);
        const extensions = extensionsResult.rows.map(r => r.extname);
        let functions = [];
        if (includeFunctions) {
            onProgress?.('fetching_functions');
            const functionsResult = await pool.query(`
                SELECT
                    p.proname as name,
                    n.nspname as schema,
                    pg_get_function_result(p.oid) as return_type,
                    pg_get_function_arguments(p.oid) as arg_types,
                    l.lanname as language,
                    pg_get_functiondef(p.oid) as definition,
                    p.prokind = 'a' as is_aggregate,
                    p.provolatile as volatility,
                    obj_description(p.oid, 'pg_proc') as comment
                FROM pg_proc p
                JOIN pg_namespace n ON p.pronamespace = n.oid
                JOIN pg_language l ON p.prolang = l.oid
                WHERE n.nspname = 'public'
                    AND p.prokind IN ('f', 'a')
                    -- Exclude functions that belong to extensions (e.g., pgcrypto, uuid-ossp)
                    AND NOT EXISTS (
                        SELECT 1 FROM pg_depend d
                        JOIN pg_extension e ON d.refobjid = e.oid
                        WHERE d.objid = p.oid
                        AND d.deptype = 'e'
                    )
                    -- Exclude C language functions (typically extension functions)
                    AND l.lanname != 'c'
                    -- Exclude internal language functions
                    AND l.lanname != 'internal'
                ORDER BY p.proname;
            `);
            functions = functionsResult.rows.map(f => ({
                name: f.name,
                schema: f.schema,
                returnType: f.return_type,
                argTypes: f.arg_types ? f.arg_types.split(', ') : [],
                language: f.language,
                definition: f.definition || '',
                isAggregate: f.is_aggregate || false,
                volatility: f.volatility === 'i' ? 'IMMUTABLE' : f.volatility === 's' ? 'STABLE' : 'VOLATILE',
                comment: f.comment || undefined,
            }));
        }
        let triggers = [];
        if (includeTriggers) {
            const triggersResult = await pool.query(`
                SELECT
                    t.tgname as name,
                    c.relname as table_name,
                    CASE
                        WHEN t.tgtype & 2 > 0 THEN 'BEFORE'
                        WHEN t.tgtype & 64 > 0 THEN 'INSTEAD OF'
                        ELSE 'AFTER'
                    END as timing,
                    CASE
                        WHEN t.tgtype & 4 > 0 THEN 'INSERT'
                        WHEN t.tgtype & 8 > 0 THEN 'DELETE'
                        WHEN t.tgtype & 16 > 0 THEN 'UPDATE'
                        ELSE 'UNKNOWN'
                    END as event,
                    CASE
                        WHEN t.tgtype & 1 > 0 THEN 'ROW'
                        ELSE 'STATEMENT'
                    END as for_each,
                    p.proname as function_name,
                    pg_get_triggerdef(t.oid) as definition,
                    t.tgenabled != 'D' as is_enabled,
                    obj_description(t.oid, 'pg_trigger') as comment
                FROM pg_trigger t
                JOIN pg_class c ON t.tgrelid = c.oid
                JOIN pg_namespace n ON c.relnamespace = n.oid
                JOIN pg_proc p ON t.tgfoid = p.oid
                WHERE n.nspname = 'public'
                    AND NOT t.tgisinternal
                    -- Exclude triggers on partition child tables (only show on parent)
                    AND NOT EXISTS (
                        SELECT 1 FROM pg_inherits i
                        WHERE i.inhrelid = c.oid
                    )
                ORDER BY c.relname, t.tgname;
            `);
            triggers = triggersResult.rows.map(t => ({
                name: t.name,
                tableName: t.table_name,
                timing: t.timing,
                event: t.event,
                forEach: t.for_each,
                functionName: t.function_name,
                definition: t.definition || '',
                isEnabled: t.is_enabled,
                comment: t.comment || undefined,
            }));
        }
        const policiesResult = await pool.query(`
            SELECT 
                pol.polname as name,
                c.relname as table_name,
                CASE pol.polcmd 
                    WHEN '*' THEN 'ALL'
                    WHEN 'r' THEN 'SELECT'
                    WHEN 'a' THEN 'INSERT'
                    WHEN 'w' THEN 'UPDATE'
                    WHEN 'd' THEN 'DELETE'
                END as command,
                array_agg(r.rolname) as roles,
                pg_get_expr(pol.polqual, pol.polrelid) as using_expr,
                pg_get_expr(pol.polwithcheck, pol.polrelid) as with_check
            FROM pg_policy pol
            JOIN pg_class c ON pol.polrelid = c.oid
            JOIN pg_namespace n ON c.relnamespace = n.oid
            LEFT JOIN unnest(pol.polroles) WITH ORDINALITY pr(oid, ord) ON true
            LEFT JOIN pg_roles r ON r.oid = pr.oid
            WHERE n.nspname = 'public'
            GROUP BY pol.polname, c.relname, pol.polcmd, pol.polqual, pol.polwithcheck, pol.polrelid
            ORDER BY c.relname, pol.polname;
        `);
        const policies = policiesResult.rows.map(p => ({
            name: p.name,
            tableName: p.table_name,
            command: p.command,
            roles: p.roles?.filter(Boolean) || [],
            using: p.using_expr,
            withCheck: p.with_check,
        }));
        const partitionsResult = await pool.query(`
            SELECT 
                c.relname as name,
                parent.relname as parent_table,
                CASE pt.partstrat 
                    WHEN 'r' THEN 'RANGE'
                    WHEN 'l' THEN 'LIST'
                    WHEN 'h' THEN 'HASH'
                END as partition_type,
                pg_get_expr(c.relpartbound, c.oid) as partition_bound
            FROM pg_class c
            JOIN pg_inherits i ON c.oid = i.inhrelid
            JOIN pg_class parent ON parent.oid = i.inhparent
            JOIN pg_namespace n ON c.relnamespace = n.oid
            LEFT JOIN pg_partitioned_table pt ON pt.partrelid = parent.oid
            WHERE n.nspname = 'public'
                AND c.relispartition
            ORDER BY parent.relname, c.relname;
        `);
        const partitions = partitionsResult.rows.map(p => ({
            name: p.name,
            parentTable: p.parent_table,
            partitionType: p.partition_type || 'RANGE',
            partitionKey: [],
            partitionBound: p.partition_bound || '',
        }));
        const foreignServersResult = await pool.query(`
            SELECT 
                s.srvname as name,
                f.fdwname as foreign_data_wrapper,
                s.srvoptions as options
            FROM pg_foreign_server s
            JOIN pg_foreign_data_wrapper f ON f.oid = s.srvfdw
            ORDER BY s.srvname;
        `);
        const foreignServers = foreignServersResult.rows.map(s => ({
            name: s.name,
            foreignDataWrapper: s.foreign_data_wrapper,
            options: parseOptions(s.options),
        }));
        const foreignTablesResult = await pool.query(`
            SELECT 
                c.relname as name,
                n.nspname as schema,
                s.srvname as server_name,
                ft.ftoptions as options
            FROM pg_foreign_table ft
            JOIN pg_class c ON c.oid = ft.ftrelid
            JOIN pg_namespace n ON n.oid = c.relnamespace
            JOIN pg_foreign_server s ON s.oid = ft.ftserver
            WHERE n.nspname = 'public'
            ORDER BY c.relname;
        `);
        const foreignTables = foreignTablesResult.rows.map(t => ({
            name: t.name,
            schema: t.schema,
            serverName: t.server_name,
            columns: [],
            options: parseOptions(t.options),
        }));
        return {
            tables,
            enums: [],
            domains: [],
            compositeTypes: [],
            sequences: [],
            collations: [],
            functions,
            triggers,
            policies,
            partitions,
            foreignServers,
            foreignTables,
            extensions
        };
    }
    finally {
        await pool.end();
    }
}
function parseOptions(options) {
    if (!options)
        return {};
    const result = {};
    for (const opt of options) {
        const [key, value] = opt.split('=');
        if (key)
            result[key] = value || '';
    }
    return result;
}
export async function tableHasData(connection, tableName) {
    const { Pool } = await import('pg');
    const poolConfig = await buildPoolConfig(connection);
    const pool = new Pool(poolConfig);
    try {
        const result = await pool.query(`SELECT EXISTS(SELECT 1 FROM "${tableName}" LIMIT 1) as has_data`);
        return result.rows[0]?.has_data || false;
    }
    catch {
        return false;
    }
    finally {
        await pool.end();
    }
}
