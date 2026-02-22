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
exports.introspectNile = introspectNile;
exports.introspectTable = introspectTable;
exports.listTables = listTables;
exports.listSchemas = listSchemas;
function parsePgArray(val) {
    if (Array.isArray(val))
        return val;
    if (typeof val === 'string') {
        const trimmed = val.replace(/^\{|\}$/g, '');
        return trimmed ? trimmed.split(',') : [];
    }
    return [];
}
async function introspectNile(connection, options) {
    const { Pool } = await Promise.resolve().then(() => __importStar(require('pg')));
    const { buildPoolConfig } = await Promise.resolve().then(() => __importStar(require("../../../config/config.cjs")));
    const poolConfig = await buildPoolConfig({
        url: connection.url,
        host: connection.host,
        port: connection.port,
        database: connection.database,
        user: connection.user,
        password: connection.password,
        ssl: connection.ssl,
    });
    const pool = new Pool({ ...poolConfig, max: 1 });
    try {
        options?.onProgress?.('connecting', connection.database);
        const dbResult = await pool.query('SELECT current_database()');
        const database = dbResult.rows[0]?.current_database || connection.database || 'postgres';
        const versionResult = await pool.query('SHOW server_version');
        const version = versionResult.rows[0]?.server_version;
        options?.onProgress?.('fetching_tables');
        const tables = await introspectTables(pool, options);
        options?.onProgress?.('fetching_indexes');
        const indexes = await introspectIndexes(pool);
        options?.onProgress?.('fetching_constraints');
        const constraints = await introspectConstraints(pool);
        options?.onProgress?.('fetching_enums');
        const enums = await introspectEnums(pool);
        options?.onProgress?.('fetching_domains');
        const domains = await introspectDomains(pool);
        options?.onProgress?.('fetching_sequences');
        const sequences = await introspectSequences(pool);
        options?.onProgress?.('fetching_composite_types');
        const compositeTypes = await introspectCompositeTypes(pool);
        let functions;
        if (options?.includeFunctions) {
            options?.onProgress?.('fetching_functions');
            functions = await introspectFunctions(pool);
        }
        let triggers;
        if (options?.includeTriggers) {
            options?.onProgress?.('fetching_triggers');
            triggers = await introspectTriggers(pool);
        }
        const schemasResult = await pool.query(`
            SELECT nspname FROM pg_namespace
            WHERE nspname NOT LIKE 'pg_%'
              AND nspname != 'information_schema'
            ORDER BY nspname
        `);
        const schemas = schemasResult.rows.map(r => r.nspname);
        options?.onProgress?.('complete');
        return {
            database,
            tables,
            indexes,
            constraints,
            enums,
            domains,
            sequences,
            compositeTypes,
            functions,
            triggers,
            schemas,
            version,
        };
    }
    finally {
        await pool.end();
    }
}
async function introspectTable(connection, tableName, schema = 'public') {
    const { Pool } = await Promise.resolve().then(() => __importStar(require('pg')));
    const { buildPoolConfig } = await Promise.resolve().then(() => __importStar(require("../../../config/config.cjs")));
    const poolConfig = await buildPoolConfig({
        url: connection.url,
        host: connection.host,
        port: connection.port,
        database: connection.database,
        user: connection.user,
        password: connection.password,
        ssl: connection.ssl,
    });
    const pool = new Pool({ ...poolConfig, max: 1 });
    try {
        const existsResult = await pool.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables
                WHERE table_schema = $1 AND table_name = $2
            ) as exists
        `, [schema, tableName]);
        if (!existsResult.rows[0]?.exists) {
            return null;
        }
        const columns = await getTableColumns(pool, schema, tableName);
        const tableResult = await pool.query(`
            SELECT
                c.relname as name,
                n.nspname as schema,
                CASE c.relkind
                    WHEN 'r' THEN 'table'
                    WHEN 'v' THEN 'view'
                    WHEN 'm' THEN 'materialized_view'
                    WHEN 'f' THEN 'foreign_table'
                    ELSE 'table'
                END as type,
                obj_description(c.oid) as comment,
                c.relpersistence = 'u' as is_unlogged,
                c.relpersistence = 't' as is_temporary,
                pg_catalog.pg_get_userbyid(c.relowner) as owner
            FROM pg_class c
            JOIN pg_namespace n ON c.relnamespace = n.oid
            WHERE n.nspname = $1 AND c.relname = $2
        `, [schema, tableName]);
        if (tableResult.rows.length === 0) {
            return null;
        }
        const row = tableResult.rows[0];
        return {
            name: row.name,
            schema: row.schema,
            type: row.type,
            columns,
            comment: row.comment,
            isUnlogged: row.is_unlogged,
            isTemporary: row.is_temporary,
            owner: row.owner,
        };
    }
    finally {
        await pool.end();
    }
}
async function listTables(connection, schema = 'public') {
    const { Pool } = await Promise.resolve().then(() => __importStar(require('pg')));
    const { buildPoolConfig } = await Promise.resolve().then(() => __importStar(require("../../../config/config.cjs")));
    const poolConfig = await buildPoolConfig({
        url: connection.url,
        host: connection.host,
        port: connection.port,
        database: connection.database,
        user: connection.user,
        password: connection.password,
        ssl: connection.ssl,
    });
    const pool = new Pool({ ...poolConfig, max: 1 });
    try {
        const result = await pool.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = $1
              AND table_type = 'BASE TABLE'
            ORDER BY table_name
        `, [schema]);
        return result.rows.map(r => r.table_name);
    }
    finally {
        await pool.end();
    }
}
async function listSchemas(connection) {
    const { Pool } = await Promise.resolve().then(() => __importStar(require('pg')));
    const { buildPoolConfig } = await Promise.resolve().then(() => __importStar(require("../../../config/config.cjs")));
    const poolConfig = await buildPoolConfig({
        url: connection.url,
        host: connection.host,
        port: connection.port,
        database: connection.database,
        user: connection.user,
        password: connection.password,
        ssl: connection.ssl,
    });
    const pool = new Pool({ ...poolConfig, max: 1 });
    try {
        const result = await pool.query(`
            SELECT nspname
            FROM pg_namespace
            WHERE nspname NOT LIKE 'pg_%'
              AND nspname != 'information_schema'
            ORDER BY nspname
        `);
        return result.rows.map(r => r.nspname);
    }
    finally {
        await pool.end();
    }
}
async function introspectTables(pool, options) {
    const schemaFilter = options?.schemas?.length
        ? `AND n.nspname = ANY($1)`
        : `AND n.nspname NOT LIKE 'pg_%' AND n.nspname != 'information_schema'`;
    const params = options?.schemas?.length ? [options.schemas] : [];
    const tablesResult = await pool.query(`
        SELECT
            c.relname as name,
            n.nspname as schema,
            CASE c.relkind
                WHEN 'r' THEN 'table'
                WHEN 'v' THEN 'view'
                WHEN 'm' THEN 'materialized_view'
                WHEN 'f' THEN 'foreign_table'
                ELSE 'table'
            END as type,
            obj_description(c.oid) as comment,
            c.relpersistence = 'u' as is_unlogged,
            c.relpersistence = 't' as is_temporary,
            pg_catalog.pg_get_userbyid(c.relowner) as owner
        FROM pg_class c
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE c.relkind IN ('r', 'v', 'm', 'f', 'p')
        ${schemaFilter}
        ORDER BY n.nspname, c.relname
    `, params);
    const columnsResult = await pool.query(`
        SELECT
            a.attrelid::regclass::text as table_full_name,
            a.attname as name,
            pg_catalog.format_type(a.atttypid, a.atttypmod) as type,
            t.typname as base_type,
            NOT a.attnotnull as nullable,
            pg_catalog.pg_get_expr(d.adbin, d.adrelid) as default_value,
            a.attnum as ordinal_position,
            col_description(a.attrelid, a.attnum) as comment,
            a.attidentity != '' as is_identity,
            CASE
                WHEN t.typname IN ('int2', 'int4', 'int8') AND
                     pg_catalog.pg_get_expr(d.adbin, d.adrelid) LIKE 'nextval%'
                THEN true
                ELSE false
            END as is_auto_increment,
            a.attgenerated != '' as is_generated,
            CASE WHEN a.attgenerated != '' THEN
                pg_catalog.pg_get_expr(d.adbin, d.adrelid)
            END as generated_expression,
            CASE WHEN t.typcategory = 'A' THEN 1 ELSE 0 END as array_dimensions,
            CASE WHEN t.typtype = 'e' THEN
                (SELECT array_agg(e.enumlabel ORDER BY e.enumsortorder)
                 FROM pg_enum e WHERE e.enumtypid = t.oid)
            END as enum_values
        FROM pg_attribute a
        JOIN pg_class c ON a.attrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        JOIN pg_type t ON a.atttypid = t.oid
        LEFT JOIN pg_attrdef d ON a.attrelid = d.adrelid AND a.attnum = d.adnum
        WHERE a.attnum > 0
          AND NOT a.attisdropped
          AND c.relkind IN ('r', 'v', 'm', 'f', 'p')
          ${schemaFilter.replace('$1', '$' + (params.length + 1))}
        ORDER BY a.attrelid, a.attnum
    `, params);
    const columnsByTable = new Map();
    for (const row of columnsResult.rows) {
        const tableKey = row.table_full_name;
        if (!columnsByTable.has(tableKey)) {
            columnsByTable.set(tableKey, []);
        }
        columnsByTable.get(tableKey).push({
            name: row.name,
            type: row.type,
            baseType: row.base_type,
            nullable: row.nullable,
            defaultValue: row.default_value,
            ordinalPosition: row.ordinal_position,
            comment: row.comment,
            isAutoIncrement: row.is_auto_increment,
            isGenerated: row.is_generated,
            generatedExpression: row.generated_expression,
            arrayDimensions: row.array_dimensions,
            enumValues: row.enum_values,
        });
    }
    const tables = [];
    for (const row of tablesResult.rows) {
        const tableKey = `"${row.schema}"."${row.name}"`;
        const columns = columnsByTable.get(tableKey) || [];
        tables.push({
            name: row.name,
            schema: row.schema,
            type: row.type,
            columns,
            comment: row.comment,
            isUnlogged: row.is_unlogged,
            isTemporary: row.is_temporary,
            owner: row.owner,
        });
    }
    return tables;
}
async function getTableColumns(pool, schema, tableName) {
    const result = await pool.query(`
        SELECT
            a.attname as name,
            pg_catalog.format_type(a.atttypid, a.atttypmod) as type,
            t.typname as base_type,
            NOT a.attnotnull as nullable,
            pg_catalog.pg_get_expr(d.adbin, d.adrelid) as default_value,
            a.attnum as ordinal_position,
            col_description(a.attrelid, a.attnum) as comment,
            a.attidentity != '' as is_identity,
            CASE
                WHEN t.typname IN ('int2', 'int4', 'int8') AND
                     pg_catalog.pg_get_expr(d.adbin, d.adrelid) LIKE 'nextval%'
                THEN true
                ELSE false
            END as is_auto_increment,
            a.attgenerated != '' as is_generated,
            CASE WHEN t.typcategory = 'A' THEN 1 ELSE 0 END as array_dimensions
        FROM pg_attribute a
        JOIN pg_class c ON a.attrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        JOIN pg_type t ON a.atttypid = t.oid
        LEFT JOIN pg_attrdef d ON a.attrelid = d.adrelid AND a.attnum = d.adnum
        WHERE n.nspname = $1
          AND c.relname = $2
          AND a.attnum > 0
          AND NOT a.attisdropped
        ORDER BY a.attnum
    `, [schema, tableName]);
    return result.rows.map((row) => ({
        name: row.name,
        type: row.type,
        baseType: row.base_type,
        nullable: row.nullable,
        defaultValue: row.default_value,
        ordinalPosition: row.ordinal_position,
        comment: row.comment,
        isAutoIncrement: row.is_auto_increment,
        isGenerated: row.is_generated,
        arrayDimensions: row.array_dimensions,
    }));
}
async function introspectIndexes(pool) {
    const result = await pool.query(`
        SELECT
            i.relname as name,
            t.relname as table_name,
            n.nspname as schema,
            am.amname as type,
            ix.indisunique as is_unique,
            ix.indisprimary as is_primary,
            pg_catalog.pg_get_indexdef(i.oid) as definition,
            pg_catalog.pg_get_expr(ix.indpred, ix.indrelid) as predicate
        FROM pg_index ix
        JOIN pg_class i ON ix.indexrelid = i.oid
        JOIN pg_class t ON ix.indrelid = t.oid
        JOIN pg_namespace n ON t.relnamespace = n.oid
        JOIN pg_am am ON i.relam = am.oid
        WHERE n.nspname NOT LIKE 'pg_%'
          AND n.nspname != 'information_schema'
        ORDER BY n.nspname, t.relname, i.relname
    `);
    return result.rows.map((row) => ({
        name: row.name,
        tableName: row.table_name,
        schema: row.schema,
        type: row.type,
        isUnique: row.is_unique,
        isPrimary: row.is_primary,
        predicate: row.predicate,
        columns: parseIndexColumns(row.definition),
    }));
}
function parseIndexColumns(definition) {
    const match = definition.match(/\(([^)]+)\)/);
    if (!match)
        return [];
    const columnPart = match[1];
    const columns = columnPart.split(',').map(col => {
        const trimmed = col.trim();
        const parts = trimmed.split(/\s+/);
        return {
            name: parts[0].replace(/"/g, ''),
            direction: (parts.includes('DESC') ? 'DESC' : 'ASC'),
            nulls: (parts.includes('NULLS') && parts.includes('FIRST') ? 'FIRST' : 'LAST'),
        };
    });
    return columns;
}
async function introspectConstraints(pool) {
    const result = await pool.query(`
        SELECT
            con.conname as name,
            t.relname as table_name,
            n.nspname as schema,
            CASE con.contype
                WHEN 'p' THEN 'PRIMARY KEY'
                WHEN 'f' THEN 'FOREIGN KEY'
                WHEN 'u' THEN 'UNIQUE'
                WHEN 'c' THEN 'CHECK'
                WHEN 'x' THEN 'EXCLUDE'
            END as type,
            pg_catalog.pg_get_constraintdef(con.oid) as definition,
            array_agg(a.attname ORDER BY array_position(con.conkey, a.attnum)) as columns,
            ft.relname as referenced_table,
            fn.nspname as referenced_schema,
            con.confupdtype as on_update,
            con.confdeltype as on_delete,
            con.condeferrable as deferrable,
            con.condeferred as initially_deferred
        FROM pg_constraint con
        JOIN pg_class t ON con.conrelid = t.oid
        JOIN pg_namespace n ON t.relnamespace = n.oid
        LEFT JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(con.conkey)
        LEFT JOIN pg_class ft ON con.confrelid = ft.oid
        LEFT JOIN pg_namespace fn ON ft.relnamespace = fn.oid
        WHERE n.nspname NOT LIKE 'pg_%'
          AND n.nspname != 'information_schema'
        GROUP BY con.oid, con.conname, t.relname, n.nspname, con.contype,
                 ft.relname, fn.nspname, con.confupdtype, con.confdeltype,
                 con.condeferrable, con.condeferred
        ORDER BY n.nspname, t.relname, con.conname
    `);
    return result.rows.map((row) => ({
        name: row.name,
        tableName: row.table_name,
        schema: row.schema,
        type: row.type,
        columns: row.columns || [],
        referencedTable: row.referenced_table,
        referencedSchema: row.referenced_schema,
        onUpdate: mapReferentialAction(row.on_update),
        onDelete: mapReferentialAction(row.on_delete),
        deferrable: row.deferrable,
        initiallyDeferred: row.initially_deferred,
    }));
}
function mapReferentialAction(code) {
    switch (code) {
        case 'a': return 'NO ACTION';
        case 'r': return 'RESTRICT';
        case 'c': return 'CASCADE';
        case 'n': return 'SET NULL';
        case 'd': return 'SET DEFAULT';
        default: return undefined;
    }
}
async function introspectEnums(pool) {
    const result = await pool.query(`
        SELECT
            t.typname as name,
            n.nspname as schema,
            array_agg(e.enumlabel ORDER BY e.enumsortorder) as values,
            obj_description(t.oid) as comment
        FROM pg_type t
        JOIN pg_namespace n ON t.typnamespace = n.oid
        JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE n.nspname NOT LIKE 'pg_%'
          AND n.nspname != 'information_schema'
        GROUP BY t.oid, t.typname, n.nspname
        ORDER BY n.nspname, t.typname
    `);
    return result.rows.map((row) => ({
        name: row.name,
        schema: row.schema,
        values: row.values,
        comment: row.comment,
    }));
}
async function introspectFunctions(pool) {
    const result = await pool.query(`
        SELECT
            p.proname as name,
            n.nspname as schema,
            pg_catalog.pg_get_function_arguments(p.oid) as arguments,
            pg_catalog.pg_get_function_result(p.oid) as return_type,
            l.lanname as language,
            p.prosrc as definition,
            CASE p.provolatile
                WHEN 'i' THEN 'IMMUTABLE'
                WHEN 's' THEN 'STABLE'
                ELSE 'VOLATILE'
            END as volatility,
            p.prosecdef as security_definer,
            obj_description(p.oid) as comment
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        JOIN pg_language l ON p.prolang = l.oid
        WHERE n.nspname NOT LIKE 'pg_%'
          AND n.nspname != 'information_schema'
          AND p.prokind = 'f'
        ORDER BY n.nspname, p.proname
    `);
    return result.rows.map((row) => ({
        name: row.name,
        schema: row.schema,
        arguments: row.arguments,
        returnType: row.return_type,
        language: row.language,
        definition: row.definition,
        volatility: row.volatility,
        securityDefiner: row.security_definer,
        comment: row.comment,
    }));
}
async function introspectTriggers(pool) {
    const result = await pool.query(`
        SELECT
            t.tgname as name,
            c.relname as table_name,
            n.nspname as schema,
            CASE
                WHEN t.tgtype & 2 = 2 THEN 'BEFORE'
                WHEN t.tgtype & 64 = 64 THEN 'INSTEAD OF'
                ELSE 'AFTER'
            END as timing,
            CASE
                WHEN t.tgtype & 1 = 1 THEN 'ROW'
                ELSE 'STATEMENT'
            END as for_each,
            p.proname as function_name,
            t.tgenabled != 'D' as enabled,
            array_remove(array[
                CASE WHEN t.tgtype & 4 = 4 THEN 'INSERT' END,
                CASE WHEN t.tgtype & 8 = 8 THEN 'DELETE' END,
                CASE WHEN t.tgtype & 16 = 16 THEN 'UPDATE' END,
                CASE WHEN t.tgtype & 32 = 32 THEN 'TRUNCATE' END
            ], NULL) as events
        FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        JOIN pg_proc p ON t.tgfoid = p.oid
        WHERE NOT t.tgisinternal
          AND n.nspname NOT LIKE 'pg_%'
          AND n.nspname != 'information_schema'
        ORDER BY n.nspname, c.relname, t.tgname
    `);
    return result.rows.map((row) => ({
        name: row.name,
        tableName: row.table_name,
        schema: row.schema,
        timing: row.timing,
        events: row.events,
        forEach: row.for_each,
        functionName: row.function_name,
        enabled: row.enabled,
    }));
}
async function introspectDomains(pool) {
    const result = await pool.query(`
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
    return result.rows.map((row) => ({
        name: row.name,
        baseType: row.base_type,
        isNotNull: row.is_not_null,
        defaultValue: row.default_value,
        checkExpression: row.check_expression,
    }));
}
async function introspectSequences(pool) {
    const result = await pool.query(`
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
    return result.rows.map((row) => ({
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
async function introspectCompositeTypes(pool) {
    const result = await pool.query(`
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
    return result.rows.map((row) => {
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
