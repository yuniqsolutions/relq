"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.fastIntrospectDatabase = fastIntrospectDatabase;
function parseOptionsArray(options) {
    if (!options)
        return {};
    const result = {};
    for (const opt of options) {
        const eqIdx = opt.indexOf('=');
        if (eqIdx > 0) {
            result[opt.substring(0, eqIdx)] = opt.substring(eqIdx + 1);
        }
    }
    return result;
}
async function fastIntrospectDatabase(connection, onProgress, options) {
    const { includeFunctions = false, includeTriggers = false } = options || {};
    const { Pool } = await Promise.resolve().then(() => __importStar(require("../../addon/pg/index.cjs")));
    onProgress?.('connecting', connection.database);
    const pool = new Pool({
        host: connection.host,
        port: connection.port || 5432,
        database: connection.database,
        user: connection.user,
        password: connection.password,
        connectionString: connection.url,
        ssl: connection.ssl,
    });
    try {
        onProgress?.('fetching_tables');
        const tablesResult = await pool.query(`
            SELECT 
                c.relname as table_name,
                n.nspname as table_schema,
                c.reltuples::bigint as row_count,
                c.relispartition as is_partition,
                c.relkind = 'p' as is_partitioned,
                CASE 
                    WHEN pt.partstrat = 'l' THEN 'LIST'
                    WHEN pt.partstrat = 'r' THEN 'RANGE'
                    WHEN pt.partstrat = 'h' THEN 'HASH'
                END as partition_type,
                -- Get partition key columns
                (
                    SELECT array_agg(a.attname ORDER BY array_position(pt.partattrs, a.attnum))
                    FROM pg_attribute a
                    WHERE a.attrelid = c.oid 
                      AND a.attnum = ANY(pt.partattrs)
                ) as partition_key
            FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            LEFT JOIN pg_partitioned_table pt ON pt.partrelid = c.oid
            WHERE n.nspname = 'public'
                AND c.relkind IN ('r', 'p')  -- Regular and partitioned tables
                AND NOT c.relispartition
            ORDER BY c.relname;
        `);
        onProgress?.('fetching_columns');
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
                c.identity_generation,
                col_description(pgc.oid, c.ordinal_position::int) as column_comment
            FROM information_schema.columns c
            JOIN pg_class pgc ON pgc.relname = c.table_name
            JOIN pg_namespace pgn ON pgn.oid = pgc.relnamespace AND pgn.nspname = c.table_schema
            WHERE c.table_schema = 'public'
            ORDER BY c.table_name, c.ordinal_position;
        `);
        const constraintsResult = await pool.query(`
            SELECT
                tc.table_name,
                tc.constraint_name,
                tc.constraint_type,
                array_agg(DISTINCT kcu.column_name ORDER BY kcu.column_name) as columns,
                ccu.table_name as referenced_table,
                array_agg(DISTINCT ccu.column_name) as referenced_columns,
                rc.update_rule as on_update,
                rc.delete_rule as on_delete
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
                ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
            LEFT JOIN information_schema.constraint_column_usage ccu
                ON tc.constraint_name = ccu.constraint_name AND tc.constraint_type = 'FOREIGN KEY'
            LEFT JOIN information_schema.referential_constraints rc
                ON tc.constraint_name = rc.constraint_name AND tc.table_schema = rc.constraint_schema
            WHERE tc.table_schema = 'public'
            GROUP BY tc.table_name, tc.constraint_name, tc.constraint_type, ccu.table_name, rc.update_rule, rc.delete_rule;
        `);
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
                array_agg(a.attname ORDER BY array_position(ix.indkey, a.attnum)) FILTER (WHERE a.attnum > 0) as columns
            FROM pg_index ix
            JOIN pg_class t ON t.oid = ix.indrelid
            JOIN pg_class i ON i.oid = ix.indexrelid
            JOIN pg_namespace n ON n.oid = t.relnamespace
            JOIN pg_am am ON am.oid = i.relam
            LEFT JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
            WHERE n.nspname = 'public'
                AND NOT ix.indisprimary
            GROUP BY t.relname, i.relname, am.amname, ix.indisunique, ix.indisprimary, ix.indexrelid, ix.indpred, ix.indexprs, ix.indrelid;
        `);
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
        onProgress?.('fetching_enums');
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
        const enums = enumsResult.rows.map(row => ({
            name: row.enum_name,
            schema: row.enum_schema,
            values: row.enum_values || [],
        }));
        onProgress?.('processing');
        const columnsByTable = new Map();
        const constraintsByTable = new Map();
        const indexesByTable = new Map();
        const checksByTable = new Map();
        for (const col of columnsResult.rows) {
            if (!columnsByTable.has(col.table_name)) {
                columnsByTable.set(col.table_name, []);
            }
            columnsByTable.get(col.table_name).push({
                name: col.column_name,
                dataType: col.udt_name || col.data_type,
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
                identityGeneration: col.identity_generation || null,
            });
        }
        for (const con of constraintsResult.rows) {
            if (!constraintsByTable.has(con.table_name)) {
                constraintsByTable.set(con.table_name, new Map());
            }
            constraintsByTable.get(con.table_name).set(con.constraint_name, {
                type: con.constraint_type,
                columns: con.columns,
            });
            const columns = columnsByTable.get(con.table_name);
            if (columns) {
                for (const colName of con.columns) {
                    const col = columns.find(c => c.name === colName);
                    if (col) {
                        if (con.constraint_type === 'PRIMARY KEY')
                            col.isPrimaryKey = true;
                        if (con.constraint_type === 'UNIQUE')
                            col.isUnique = true;
                        if (con.constraint_type === 'FOREIGN KEY' && con.referenced_table) {
                            col.references = {
                                table: con.referenced_table,
                                column: con.referenced_columns?.[0] || 'id',
                                onDelete: con.on_delete || 'NO ACTION',
                                onUpdate: con.on_update || 'NO ACTION',
                            };
                        }
                    }
                }
            }
        }
        for (const idx of indexesResult.rows) {
            if (!indexesByTable.has(idx.table_name)) {
                indexesByTable.set(idx.table_name, []);
            }
            const opClassMatches = idx.index_definition?.match(/\b([a-z_]+_ops)\b/gi) ?? [];
            const operatorClasses = Array.from(new Set(opClassMatches));
            indexesByTable.get(idx.table_name).push({
                name: idx.index_name,
                columns: idx.columns || [],
                isUnique: idx.is_unique,
                isPrimary: idx.is_primary,
                type: idx.index_type,
                definition: idx.index_definition || undefined,
                whereClause: idx.where_clause || null,
                expression: idx.expression || null,
                operatorClasses: operatorClasses.length > 0 ? operatorClasses : undefined,
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
            tables.push({
                name: tableName,
                schema: row.table_schema,
                columns: columnsByTable.get(tableName) || [],
                indexes: indexesByTable.get(tableName) || [],
                constraints: checksByTable.get(tableName) || [],
                rowCount: parseInt(row.row_count) || 0,
                isPartitioned: row.is_partitioned || false,
                partitionType: row.partition_type,
                partitionKey: row.partition_key || [],
            });
        }
        onProgress?.('fetching_partitions');
        const partitionsResult = await pool.query(`
            SELECT 
                child.relname as partition_name,
                parent.relname as parent_table,
                pg_get_expr(child.relpartbound, child.oid) as partition_bound
            FROM pg_class child
            JOIN pg_inherits inh ON child.oid = inh.inhrelid
            JOIN pg_class parent ON inh.inhparent = parent.oid
            JOIN pg_namespace n ON n.oid = child.relnamespace
            WHERE n.nspname = 'public'
                AND child.relispartition = true
            ORDER BY parent.relname, child.relname;
        `);
        const partitions = partitionsResult.rows.map(row => ({
            name: row.partition_name,
            parentTable: row.parent_table,
            partitionBound: row.partition_bound,
            partitionType: 'LIST',
            partitionKey: [],
        }));
        const partitionsByParent = new Map();
        for (const partition of partitions) {
            if (!partitionsByParent.has(partition.parentTable)) {
                partitionsByParent.set(partition.parentTable, []);
            }
            partitionsByParent.get(partition.parentTable).push(partition);
        }
        for (const table of tables) {
            if (table.isPartitioned) {
                table.childPartitions = partitionsByParent.get(table.name) || [];
            }
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
                    p.provolatile as volatility
                FROM pg_proc p
                JOIN pg_namespace n ON p.pronamespace = n.oid
                JOIN pg_language l ON p.prolang = l.oid
                WHERE n.nspname = 'public'
                    AND p.prokind IN ('f', 'a')
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
            }));
        }
        let triggers = [];
        if (includeTriggers) {
            onProgress?.('fetching_triggers');
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
                    p.proname as function_name,
                    pg_get_triggerdef(t.oid) as definition,
                    t.tgenabled != 'D' as is_enabled
                FROM pg_trigger t
                JOIN pg_class c ON t.tgrelid = c.oid
                JOIN pg_namespace n ON c.relnamespace = n.oid
                JOIN pg_proc p ON t.tgfoid = p.oid
                WHERE n.nspname = 'public'
                    AND NOT t.tgisinternal
                ORDER BY c.relname, t.tgname;
            `);
            triggers = triggersResult.rows.map(t => ({
                name: t.name,
                tableName: t.table_name,
                timing: t.timing,
                event: t.event,
                functionName: t.function_name,
                definition: t.definition || '',
                isEnabled: t.is_enabled,
            }));
        }
        onProgress?.('fetching_collations');
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
        onProgress?.('fetching_foreign_servers');
        const foreignServersResult = await pool.query(`
            SELECT 
                s.srvname as name,
                f.fdwname as fdw,
                s.srvoptions as options
            FROM pg_foreign_server s
            JOIN pg_foreign_data_wrapper f ON s.srvfdw = f.oid
            ORDER BY s.srvname;
        `);
        const foreignServers = foreignServersResult.rows.map(s => ({
            name: s.name,
            foreignDataWrapper: s.fdw,
            options: parseOptionsArray(s.options),
        }));
        onProgress?.('fetching_foreign_tables');
        const foreignTablesResult = await pool.query(`
            SELECT 
                c.relname as name,
                n.nspname as schema,
                s.srvname as server_name,
                ft.ftoptions as options
            FROM pg_foreign_table ft
            JOIN pg_class c ON ft.ftrelid = c.oid
            JOIN pg_namespace n ON c.relnamespace = n.oid
            JOIN pg_foreign_server s ON ft.ftserver = s.oid
            WHERE n.nspname = 'public'
            ORDER BY c.relname;
        `);
        const foreignTableNames = foreignTablesResult.rows.map(t => t.name);
        let foreignTableColumns = new Map();
        if (foreignTableNames.length > 0) {
            const ftColsResult = await pool.query(`
                SELECT 
                    c.relname as table_name,
                    a.attname as column_name,
                    pg_catalog.format_type(a.atttypid, a.atttypmod) as data_type
                FROM pg_attribute a
                JOIN pg_class c ON a.attrelid = c.oid
                JOIN pg_namespace n ON c.relnamespace = n.oid
                WHERE n.nspname = 'public'
                    AND c.relname = ANY($1)
                    AND a.attnum > 0
                    AND NOT a.attisdropped
                ORDER BY c.relname, a.attnum;
            `, [foreignTableNames]);
            for (const row of ftColsResult.rows) {
                const cols = foreignTableColumns.get(row.table_name) || [];
                cols.push({ name: row.column_name, type: row.data_type });
                foreignTableColumns.set(row.table_name, cols);
            }
        }
        const foreignTables = foreignTablesResult.rows.map(t => ({
            name: t.name,
            schema: t.schema,
            serverName: t.server_name,
            columns: (foreignTableColumns.get(t.name) || []).map((c, i) => ({
                name: c.name,
                dataType: c.type,
                isNullable: true,
                defaultValue: null,
                isPrimaryKey: false,
                isUnique: false,
                ordinalPosition: i + 1,
                maxLength: null,
                precision: null,
                scale: null,
                references: null,
            })),
            options: parseOptionsArray(t.options),
        }));
        onProgress?.('complete');
        return {
            tables,
            enums,
            domains: [],
            compositeTypes: [],
            sequences: [],
            collations,
            functions,
            triggers,
            policies: [],
            partitions,
            foreignServers,
            foreignTables,
            extensions,
        };
    }
    finally {
        await pool.end();
    }
}
