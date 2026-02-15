export const SQLITE_TYPE_AFFINITY = {
    INTEGER: /INT|INTEGER|TINYINT|SMALLINT|MEDIUMINT|BIGINT|INT2|INT8/i,
    TEXT: /CHAR|VARCHAR|VARYING\s+CHARACTER|NCHAR|NATIVE\s+CHARACTER|NVARCHAR|TEXT|CLOB/i,
    BLOB: /BLOB/i,
    REAL: /REAL|DOUBLE|DOUBLE\s+PRECISION|FLOAT/i,
    NUMERIC: /NUMERIC|DECIMAL|BOOLEAN|DATE|DATETIME/i,
};
export const PG_TO_SQLITE_TRANSFORMS = {
    SERIAL: {
        pattern: /\bSERIAL\s+PRIMARY\s+KEY\b/gi,
        transform: 'INTEGER PRIMARY KEY AUTOINCREMENT',
        message: 'Transform SERIAL PRIMARY KEY to INTEGER PRIMARY KEY AUTOINCREMENT',
    },
    SERIAL_STANDALONE: {
        pattern: /\bSERIAL\b(?!\s+PRIMARY)/gi,
        transform: 'INTEGER',
        message: 'Transform SERIAL to INTEGER (use AUTOINCREMENT with PRIMARY KEY)',
    },
    BIGSERIAL: {
        pattern: /\bBIGSERIAL\b/gi,
        transform: 'INTEGER',
        message: 'Transform BIGSERIAL to INTEGER (SQLite uses 64-bit integers)',
    },
    SMALLSERIAL: {
        pattern: /\bSMALLSERIAL\b/gi,
        transform: 'INTEGER',
        message: 'Transform SMALLSERIAL to INTEGER',
    },
    BOOLEAN: {
        pattern: /\bBOOLEAN\b/gi,
        transform: 'INTEGER',
        message: 'Transform BOOLEAN to INTEGER (use 0/1)',
    },
    BYTEA: {
        pattern: /\bBYTEA\b/gi,
        transform: 'BLOB',
        message: 'Transform BYTEA to BLOB',
    },
    TIMESTAMP: {
        pattern: /\bTIMESTAMP(\s*\([^)]*\))?\b/gi,
        transform: 'TEXT',
        message: 'Transform TIMESTAMP to TEXT (store as ISO 8601 string)',
    },
    TIMESTAMPTZ: {
        pattern: /\bTIMESTAMPTZ\b/gi,
        transform: 'TEXT',
        message: 'Transform TIMESTAMPTZ to TEXT (store as ISO 8601 with timezone)',
    },
    DATE: {
        pattern: /\bDATE\b/gi,
        transform: 'TEXT',
        message: 'Transform DATE to TEXT (store as YYYY-MM-DD)',
    },
    TIME: {
        pattern: /\bTIME(\s*\([^)]*\))?\b/gi,
        transform: 'TEXT',
        message: 'Transform TIME to TEXT (store as HH:MM:SS)',
    },
    INTERVAL: {
        pattern: /\bINTERVAL\b/gi,
        transform: 'TEXT',
        message: 'Transform INTERVAL to TEXT or INTEGER (seconds)',
    },
    UUID: {
        pattern: /\bUUID\b/gi,
        transform: 'TEXT',
        message: 'Transform UUID to TEXT (store as string)',
    },
    VARCHAR: {
        pattern: /\bVARCHAR\s*\(\s*\d+\s*\)/gi,
        transform: 'TEXT',
        message: 'Transform VARCHAR(n) to TEXT (SQLite ignores length)',
    },
    NUMERIC: {
        pattern: /\b(NUMERIC|DECIMAL)\s*\([^)]+\)/gi,
        transform: 'REAL',
        message: 'Transform NUMERIC/DECIMAL to REAL (or TEXT for precision)',
    },
    JSONB: {
        pattern: /\bJSONB\b/gi,
        transform: 'TEXT',
        message: 'Transform JSONB to TEXT (use json() for extraction)',
    },
    JSON_TYPE: {
        pattern: /\bJSON\b/gi,
        transform: 'TEXT',
        message: 'Transform JSON to TEXT (use json() for extraction)',
    },
    DOUBLE_QUOTES: {
        pattern: /"(\w+)"/g,
        transform: '"$1"',
        message: 'Double-quoted identifiers work in SQLite',
    },
};
export const UNSUPPORTED_DATA_TYPES = {
    ARRAY_TYPE: {
        pattern: /\[\s*\]|\bARRAY\s*\[/i,
        alternative: 'Store as JSON text or use separate table with foreign key',
        message: 'Array types not supported in SQLite - use JSON or separate table',
    },
    INT4RANGE: {
        pattern: /\bINT4RANGE\b/i,
        alternative: 'Use two INTEGER columns (range_start, range_end)',
        message: 'Range types not supported in SQLite',
    },
    INT8RANGE: {
        pattern: /\bINT8RANGE\b/i,
        alternative: 'Use two INTEGER columns (range_start, range_end)',
        message: 'Range types not supported in SQLite',
    },
    NUMRANGE: {
        pattern: /\bNUMRANGE\b/i,
        alternative: 'Use two REAL columns (range_start, range_end)',
        message: 'Range types not supported in SQLite',
    },
    TSRANGE: {
        pattern: /\bTSRANGE\b/i,
        alternative: 'Use two TEXT columns with ISO timestamps',
        message: 'Range types not supported in SQLite',
    },
    TSTZRANGE: {
        pattern: /\bTSTZRANGE\b/i,
        alternative: 'Use two TEXT columns with ISO timestamps',
        message: 'Range types not supported in SQLite',
    },
    DATERANGE: {
        pattern: /\bDATERANGE\b/i,
        alternative: 'Use two TEXT columns with YYYY-MM-DD format',
        message: 'Range types not supported in SQLite',
    },
    TSVECTOR: {
        pattern: /\bTSVECTOR\b/i,
        alternative: 'Use FTS5 virtual table for full-text search',
        message: 'TSVECTOR not supported - use SQLite FTS5',
    },
    TSQUERY: {
        pattern: /\bTSQUERY\b/i,
        alternative: 'Use FTS5 MATCH syntax',
        message: 'TSQUERY not supported - use FTS5',
    },
    POINT: {
        pattern: /\bPOINT\b/i,
        alternative: 'Use two REAL columns (x, y) or TEXT with WKT format',
        message: 'Geometric POINT type not supported',
    },
    LINE: {
        pattern: /\bLINE\b/i,
        alternative: 'Store as TEXT with WKT format or use Spatialite',
        message: 'Geometric LINE type not supported',
    },
    LSEG: {
        pattern: /\bLSEG\b/i,
        alternative: 'Store as TEXT or four REAL columns',
        message: 'LSEG type not supported',
    },
    BOX: {
        pattern: /\bBOX\b/i,
        alternative: 'Store as TEXT or four REAL columns',
        message: 'BOX type not supported',
    },
    PATH: {
        pattern: /\bPATH\b/i,
        alternative: 'Store as TEXT with coordinates',
        message: 'PATH type not supported',
    },
    POLYGON: {
        pattern: /\bPOLYGON\b/i,
        alternative: 'Store as TEXT with WKT format or use Spatialite',
        message: 'POLYGON type not supported natively',
    },
    CIRCLE: {
        pattern: /\bCIRCLE\b/i,
        alternative: 'Store as three REAL columns (x, y, radius)',
        message: 'CIRCLE type not supported',
    },
    INET: {
        pattern: /\bINET\b/i,
        alternative: 'Use TEXT to store IP addresses',
        message: 'INET type not supported',
    },
    CIDR: {
        pattern: /\bCIDR\b/i,
        alternative: 'Use TEXT to store CIDR notation',
        message: 'CIDR type not supported',
    },
    MACADDR: {
        pattern: /\bMACADDR\b/i,
        alternative: 'Use TEXT to store MAC addresses',
        message: 'MACADDR type not supported',
    },
    MACADDR8: {
        pattern: /\bMACADDR8\b/i,
        alternative: 'Use TEXT to store MAC addresses',
        message: 'MACADDR8 type not supported',
    },
    MONEY: {
        pattern: /\bMONEY\b/i,
        alternative: 'Use INTEGER (cents) or TEXT for monetary values',
        message: 'MONEY type not supported - use INTEGER for cents',
    },
    XML: {
        pattern: /\bXML\b/i,
        alternative: 'Store as TEXT',
        message: 'XML type not supported',
    },
    OID: {
        pattern: /\bOID\b/i,
        alternative: 'Use INTEGER',
        message: 'OID type not supported',
    },
    REGPROC: {
        pattern: /\bREGPROC\b/i,
        alternative: 'Use TEXT',
        message: 'REGPROC type not supported',
    },
    REGCLASS: {
        pattern: /\bREGCLASS\b/i,
        alternative: 'Use TEXT',
        message: 'REGCLASS type not supported',
    },
    REGTYPE: {
        pattern: /\bREGTYPE\b/i,
        alternative: 'Use TEXT',
        message: 'REGTYPE type not supported',
    },
    BIT: {
        pattern: /\bBIT\s*\(/i,
        alternative: 'Use INTEGER or BLOB',
        message: 'BIT type not supported - use INTEGER or BLOB',
    },
    VARBIT: {
        pattern: /\bVARBIT\b/i,
        alternative: 'Use BLOB',
        message: 'VARBIT not supported - use BLOB',
    },
    BIT_VARYING: {
        pattern: /\bBIT\s+VARYING\b/i,
        alternative: 'Use BLOB',
        message: 'BIT VARYING not supported - use BLOB',
    },
};
export const UNSUPPORTED_SQL = {
    CREATE_SEQUENCE: {
        pattern: /\bCREATE\s+SEQUENCE\b/i,
        alternative: 'Use INTEGER PRIMARY KEY AUTOINCREMENT',
        message: 'Sequences not supported - use AUTOINCREMENT',
    },
    IDENTITY: {
        pattern: /\bGENERATED\s+(ALWAYS|BY\s+DEFAULT)\s+AS\s+IDENTITY\b/i,
        alternative: 'Use INTEGER PRIMARY KEY AUTOINCREMENT',
        message: 'IDENTITY not supported - use AUTOINCREMENT',
    },
    CREATE_FUNCTION: {
        pattern: /\bCREATE\s+(OR\s+REPLACE\s+)?FUNCTION\b/i,
        alternative: 'Move logic to application code',
        message: 'Stored functions not supported in SQLite',
    },
    CREATE_PROCEDURE: {
        pattern: /\bCREATE\s+(OR\s+REPLACE\s+)?PROCEDURE\b/i,
        alternative: 'Move logic to application code',
        message: 'Stored procedures not supported in SQLite',
    },
    PLPGSQL: {
        pattern: /\bLANGUAGE\s+plpgsql\b/i,
        alternative: 'Implement logic in application code',
        message: 'PL/pgSQL not supported',
    },
    DO_BLOCK: {
        pattern: /\bDO\s+\$\$/i,
        alternative: 'Execute statements separately',
        message: 'DO blocks not supported',
    },
    DOLLAR_QUOTE: {
        pattern: /\$\$[\s\S]*?\$\$/,
        alternative: 'Use single quotes with escaping',
        message: 'Dollar-quoted strings not supported',
    },
    LISTEN: {
        pattern: /\bLISTEN\b/i,
        alternative: 'Use file system notifications or polling',
        message: 'LISTEN not supported',
    },
    NOTIFY: {
        pattern: /\bNOTIFY\b/i,
        alternative: 'Use file system notifications or polling',
        message: 'NOTIFY not supported',
    },
    CREATE_EXTENSION: {
        pattern: /\bCREATE\s+EXTENSION\b/i,
        alternative: 'SQLite uses loadable extensions - different mechanism',
        message: 'CREATE EXTENSION not applicable',
        isWarning: true,
    },
    EXCLUSION: {
        pattern: /\bEXCLUDE\s+(USING|WITH)/i,
        alternative: 'Implement in application layer or use trigger',
        message: 'EXCLUSION constraints not supported',
    },
    DEFERRABLE: {
        pattern: /\bDEFERRABLE\b/i,
        alternative: 'SQLite has DEFERRABLE for FK only, limited support',
        message: 'DEFERRABLE constraints have limited support',
        isWarning: true,
    },
    GIST_INDEX: {
        pattern: /\bUSING\s+GIST\b/i,
        alternative: 'Use regular B-tree index or R*Tree for spatial',
        message: 'GiST indexes not supported - use B-tree or R*Tree',
    },
    GIN_INDEX: {
        pattern: /\bUSING\s+GIN\b/i,
        alternative: 'Use FTS5 for text search or regular index',
        message: 'GIN indexes not supported - use FTS5 for text',
    },
    SPGIST_INDEX: {
        pattern: /\bUSING\s+SPGIST\b/i,
        alternative: 'Use B-tree or R*Tree',
        message: 'SP-GiST indexes not supported',
    },
    BRIN_INDEX: {
        pattern: /\bUSING\s+BRIN\b/i,
        alternative: 'Use B-tree index',
        message: 'BRIN indexes not supported',
    },
    HASH_INDEX: {
        pattern: /\bUSING\s+HASH\b/i,
        alternative: 'Use B-tree index (SQLite only has B-tree)',
        message: 'Hash indexes not supported - SQLite uses B-tree',
    },
    RETURNING: {
        pattern: /\bRETURNING\b/i,
        alternative: 'RETURNING is supported in SQLite 3.35.0+ - check your version',
        message: 'RETURNING requires SQLite 3.35.0+',
        isWarning: true,
    },
    TRUNCATE: {
        pattern: /\bTRUNCATE\b/i,
        alternative: 'Use DELETE FROM table_name (no TRUNCATE in SQLite)',
        message: 'TRUNCATE not supported - use DELETE FROM',
    },
    ALTER_DROP_COLUMN: {
        pattern: /\bALTER\s+TABLE\s+\w+\s+DROP\s+COLUMN\b/i,
        alternative: 'DROP COLUMN supported in SQLite 3.35.0+. For older versions, recreate table.',
        message: 'DROP COLUMN requires SQLite 3.35.0+',
        isWarning: true,
    },
    ALTER_RENAME_COLUMN: {
        pattern: /\bALTER\s+TABLE\s+\w+\s+RENAME\s+COLUMN\b/i,
        alternative: 'RENAME COLUMN supported in SQLite 3.25.0+',
        message: 'RENAME COLUMN requires SQLite 3.25.0+',
        isWarning: true,
    },
    GEN_RANDOM_UUID: {
        pattern: /\bgen_random_uuid\s*\(\s*\)/i,
        alternative: 'Use hex(randomblob(16)) or application-generated UUID',
        message: 'gen_random_uuid() not available',
    },
    NOW_FUNCTION: {
        pattern: /\bNOW\s*\(\s*\)/i,
        alternative: "Use datetime('now') or strftime()",
        message: "NOW() not available - use datetime('now')",
    },
    CURRENT_TIMESTAMP_TZ: {
        pattern: /\bCURRENT_TIMESTAMP\s+AT\s+TIME\s+ZONE\b/i,
        alternative: "Use datetime('now', 'localtime') or handle timezone in app",
        message: 'Timezone operations not supported natively',
    },
};
export function validateSqlForSQLite(sql, dialect = 'sqlite', location) {
    const errors = [];
    for (const [name, config] of Object.entries(UNSUPPORTED_DATA_TYPES)) {
        if (config.pattern.test(sql)) {
            const match = sql.match(config.pattern);
            errors.push({
                category: 'DATA_TYPE',
                feature: name,
                detected: match?.[0] || name,
                location,
                message: config.message,
                alternative: config.alternative,
                docsUrl: 'https://sqlite.org/datatype3.html',
            });
        }
    }
    for (const [name, config] of Object.entries(UNSUPPORTED_SQL)) {
        if (config.isWarning)
            continue;
        if (config.pattern.test(sql)) {
            const match = sql.match(config.pattern);
            let category = 'SYNTAX';
            if (name.includes('SEQUENCE') || name.includes('IDENTITY'))
                category = 'DDL';
            else if (name.includes('INDEX') || name.includes('GIST') || name.includes('GIN'))
                category = 'INDEX';
            else if (name.includes('FUNCTION') || name.includes('PROCEDURE') || name.includes('PLPGSQL'))
                category = 'FUNCTION';
            else if (name.includes('CONSTRAINT') || name.includes('DEFERRABLE') || name.includes('EXCLUSION'))
                category = 'CONSTRAINT';
            else if (name.includes('TRIGGER'))
                category = 'TRIGGER';
            else if (name.includes('ALTER'))
                category = 'DDL';
            errors.push({
                category,
                feature: name,
                detected: match?.[0] || name,
                location,
                message: config.message,
                alternative: config.alternative,
                docsUrl: 'https://sqlite.org/lang.html',
            });
        }
    }
    return errors;
}
export function getSQLiteWarnings(sql, location) {
    const warnings = [];
    for (const [name, config] of Object.entries(UNSUPPORTED_SQL)) {
        if (!config.isWarning)
            continue;
        if (config.pattern.test(sql)) {
            const match = sql.match(config.pattern);
            warnings.push({
                category: 'SYNTAX',
                feature: name,
                detected: match?.[0] || name,
                location,
                message: config.message,
                alternative: config.alternative,
            });
        }
    }
    return warnings;
}
export function validateSchemaForSQLite(schema, dialect = 'sqlite') {
    const errors = [];
    const warnings = [];
    if (schema.sequences && schema.sequences.length > 0) {
        for (const seq of schema.sequences) {
            errors.push({
                category: 'DDL',
                feature: 'SEQUENCE',
                detected: seq.name,
                location: `sequence:${seq.name}`,
                message: 'Sequences not supported in SQLite',
                alternative: 'Use INTEGER PRIMARY KEY AUTOINCREMENT instead',
            });
        }
    }
    if (schema.functions && schema.functions.length > 0) {
        for (const func of schema.functions) {
            errors.push({
                category: 'FUNCTION',
                feature: 'FUNCTION',
                detected: func.name,
                location: `function:${func.name}`,
                message: 'Stored functions not supported in SQLite',
                alternative: 'Move function logic to application code',
            });
        }
    }
    if (schema.extensions && schema.extensions.length > 0) {
        for (const ext of schema.extensions) {
            warnings.push({
                category: 'DDL',
                feature: 'EXTENSION',
                detected: ext,
                location: `extension:${ext}`,
                message: 'PostgreSQL extensions not applicable to SQLite',
                alternative: 'Check for equivalent SQLite loadable extension',
            });
        }
    }
    if (schema.tables) {
        for (const table of schema.tables) {
            if (table.columns) {
                for (const col of table.columns) {
                    const typeErrors = validateSqlForSQLite(col.type, dialect, `${table.name}.${col.name}`);
                    errors.push(...typeErrors);
                }
            }
        }
    }
    warnings.push({
        category: 'SYNTAX',
        feature: 'TYPE_AFFINITY',
        detected: 'Schema types',
        message: 'SQLite uses type affinity - types are suggestions, not enforced',
        alternative: 'Add CHECK constraints if strict type enforcement is needed',
        docsUrl: 'https://sqlite.org/datatype3.html',
    });
    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
}
export function transformPgToSQLite(sql) {
    let result = sql;
    const transforms = [];
    for (const [name, config] of Object.entries(PG_TO_SQLITE_TRANSFORMS)) {
        if (config.pattern.test(result)) {
            result = result.replace(config.pattern, config.transform);
            transforms.push(`${name}: ${config.message}`);
        }
    }
    return { sql: result, transforms };
}
export function formatSQLiteErrors(result, dialect = 'sqlite') {
    const lines = [];
    const dialectName = dialect === 'turso' ? 'Turso (SQLite)' : 'SQLite';
    if (result.errors.length > 0) {
        lines.push(`\x1b[31m✗ ${dialectName} Compatibility Errors:\x1b[0m\n`);
        for (const err of result.errors) {
            lines.push(`  \x1b[31m•\x1b[0m ${err.message}`);
            if (err.location) {
                lines.push(`    Location: ${err.location}`);
            }
            lines.push(`    Detected: ${err.detected}`);
            lines.push(`    \x1b[33mAlternative:\x1b[0m ${err.alternative}`);
            if (err.docsUrl) {
                lines.push(`    \x1b[36mDocs:\x1b[0m ${err.docsUrl}`);
            }
            lines.push('');
        }
    }
    if (result.warnings.length > 0) {
        lines.push(`\x1b[33m⚠ ${dialectName} Compatibility Warnings:\x1b[0m\n`);
        for (const warn of result.warnings) {
            lines.push(`  \x1b[33m•\x1b[0m ${warn.message}`);
            if (warn.location) {
                lines.push(`    Location: ${warn.location}`);
            }
            lines.push(`    \x1b[33mAlternative:\x1b[0m ${warn.alternative}`);
            lines.push('');
        }
    }
    return lines.join('\n');
}
export function hasSQLiteIncompatibilities(sql) {
    for (const config of Object.values(UNSUPPORTED_DATA_TYPES)) {
        if (config.pattern.test(sql))
            return true;
    }
    for (const [, config] of Object.entries(UNSUPPORTED_SQL)) {
        if (config.isWarning)
            continue;
        if (config.pattern.test(sql))
            return true;
    }
    return false;
}
