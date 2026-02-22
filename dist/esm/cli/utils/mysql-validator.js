export const PG_TO_MYSQL_TRANSFORMS = {
    SERIAL: {
        pattern: /\bSERIAL\b/gi,
        transform: 'INT AUTO_INCREMENT',
        message: 'Transform SERIAL to INT AUTO_INCREMENT',
    },
    BIGSERIAL: {
        pattern: /\bBIGSERIAL\b/gi,
        transform: 'BIGINT AUTO_INCREMENT',
        message: 'Transform BIGSERIAL to BIGINT AUTO_INCREMENT',
    },
    SMALLSERIAL: {
        pattern: /\bSMALLSERIAL\b/gi,
        transform: 'SMALLINT AUTO_INCREMENT',
        message: 'Transform SMALLSERIAL to SMALLINT AUTO_INCREMENT',
    },
    BOOLEAN: {
        pattern: /\bBOOLEAN\b/gi,
        transform: 'TINYINT(1)',
        message: 'Transform BOOLEAN to TINYINT(1)',
    },
    BYTEA: {
        pattern: /\bBYTEA\b/gi,
        transform: 'BLOB',
        message: 'Transform BYTEA to BLOB',
    },
    TIMESTAMPTZ: {
        pattern: /\bTIMESTAMPTZ\b/gi,
        transform: 'TIMESTAMP',
        message: 'Transform TIMESTAMPTZ to TIMESTAMP (store UTC, handle timezone in app)',
    },
    UUID: {
        pattern: /\bUUID\b/gi,
        transform: 'CHAR(36)',
        message: 'Transform UUID to CHAR(36) (or BINARY(16) for efficiency)',
    },
    DOUBLE_QUOTES: {
        pattern: /"(\w+)"/g,
        transform: '`$1`',
        message: 'Transform double-quoted identifiers to backticks',
    },
};
export const UNSUPPORTED_DATA_TYPES = {
    ARRAY_TYPE: {
        pattern: /\[\s*\]|\bARRAY\s*\[/i,
        alternative: 'Use JSON column to store arrays, or normalize into separate table',
        message: 'Array types not supported in MySQL - use JSON or separate table',
    },
    INT4RANGE: {
        pattern: /\bINT4RANGE\b/i,
        alternative: 'Use two INT columns (range_start, range_end)',
        message: 'Range types not supported in MySQL',
    },
    INT8RANGE: {
        pattern: /\bINT8RANGE\b/i,
        alternative: 'Use two BIGINT columns (range_start, range_end)',
        message: 'Range types not supported in MySQL',
    },
    NUMRANGE: {
        pattern: /\bNUMRANGE\b/i,
        alternative: 'Use two DECIMAL columns (range_start, range_end)',
        message: 'Range types not supported in MySQL',
    },
    TSRANGE: {
        pattern: /\bTSRANGE\b/i,
        alternative: 'Use two DATETIME columns (range_start, range_end)',
        message: 'Range types not supported in MySQL',
    },
    TSTZRANGE: {
        pattern: /\bTSTZRANGE\b/i,
        alternative: 'Use two TIMESTAMP columns (range_start, range_end)',
        message: 'Range types not supported in MySQL',
    },
    DATERANGE: {
        pattern: /\bDATERANGE\b/i,
        alternative: 'Use two DATE columns (range_start, range_end)',
        message: 'Range types not supported in MySQL',
    },
    JSONB: {
        pattern: /\bJSONB\b/i,
        alternative: 'Use JSON (MySQL has JSON but not JSONB binary format)',
        message: 'JSONB not available - use JSON (slightly different performance characteristics)',
    },
    TSVECTOR: {
        pattern: /\bTSVECTOR\b/i,
        alternative: 'Use FULLTEXT index on TEXT/VARCHAR columns',
        message: 'TSVECTOR not supported - use MySQL FULLTEXT indexes',
    },
    TSQUERY: {
        pattern: /\bTSQUERY\b/i,
        alternative: 'Use MATCH() AGAINST() syntax with FULLTEXT index',
        message: 'TSQUERY not supported - use FULLTEXT search syntax',
    },
    POINT_PG: {
        pattern: /\bPOINT\b(?!\s*\()/i,
        alternative: 'Use MySQL POINT (different syntax) or two DOUBLE columns',
        message: 'PostgreSQL POINT type - MySQL has POINT but with different syntax',
    },
    LINE: {
        pattern: /\bLINE\b/i,
        alternative: 'Use LINESTRING geometry type or TEXT',
        message: 'LINE type not available - use LINESTRING or TEXT',
    },
    LSEG: {
        pattern: /\bLSEG\b/i,
        alternative: 'Store as TEXT or four DOUBLE columns',
        message: 'LSEG type not available in MySQL',
    },
    PATH: {
        pattern: /\bPATH\b/i,
        alternative: 'Use LINESTRING/MULTILINESTRING or TEXT',
        message: 'PATH type not available - use MySQL spatial types',
    },
    CIRCLE: {
        pattern: /\bCIRCLE\b/i,
        alternative: 'Store as three DOUBLE columns (x, y, radius) or GEOMETRY',
        message: 'CIRCLE type not available in MySQL',
    },
    BOX: {
        pattern: /\bBOX\b/i,
        alternative: 'Use POLYGON geometry or four DOUBLE columns',
        message: 'BOX type not available - use POLYGON or separate columns',
    },
    INET: {
        pattern: /\bINET\b/i,
        alternative: 'Use VARCHAR(45) for IPv4/IPv6 or VARBINARY(16) for binary storage',
        message: 'INET type not supported - use VARCHAR or VARBINARY',
    },
    CIDR: {
        pattern: /\bCIDR\b/i,
        alternative: 'Use VARCHAR(45) to store CIDR notation',
        message: 'CIDR type not supported - use VARCHAR',
    },
    MACADDR: {
        pattern: /\bMACADDR\b/i,
        alternative: 'Use CHAR(17) for MAC address storage',
        message: 'MACADDR type not supported - use CHAR(17)',
    },
    MACADDR8: {
        pattern: /\bMACADDR8\b/i,
        alternative: 'Use CHAR(23) for MAC address storage',
        message: 'MACADDR8 type not supported - use CHAR(23)',
    },
    MONEY: {
        pattern: /\bMONEY\b/i,
        alternative: 'Use DECIMAL(19,4) for monetary values',
        message: 'MONEY type not supported - use DECIMAL',
    },
    BIT_VARYING: {
        pattern: /\bBIT\s+VARYING\b/i,
        alternative: 'Use BIT(n) with fixed length or VARBINARY',
        message: 'BIT VARYING not supported - use BIT or VARBINARY',
    },
    VARBIT: {
        pattern: /\bVARBIT\b/i,
        alternative: 'Use BIT(n) or VARBINARY',
        message: 'VARBIT not supported - use BIT or VARBINARY',
    },
    XML: {
        pattern: /\bXML\b/i,
        alternative: 'Store XML as TEXT or use JSON',
        message: 'XML type not supported - use TEXT or JSON',
    },
    OID: {
        pattern: /\bOID\b/i,
        alternative: 'Use INT UNSIGNED or BIGINT UNSIGNED',
        message: 'OID type not supported',
    },
    REGPROC: {
        pattern: /\bREGPROC\b/i,
        alternative: 'Use VARCHAR to store function names',
        message: 'REGPROC type not supported',
    },
    REGCLASS: {
        pattern: /\bREGCLASS\b/i,
        alternative: 'Use VARCHAR to store table names',
        message: 'REGCLASS type not supported',
    },
};
export const UNSUPPORTED_SQL = {
    CREATE_SEQUENCE: {
        pattern: /\bCREATE\s+SEQUENCE\b/i,
        alternative: 'Use AUTO_INCREMENT column instead',
        message: 'CREATE SEQUENCE not supported in MySQL - use AUTO_INCREMENT',
        dialects: ['mysql', 'planetscale'],
    },
    IDENTITY: {
        pattern: /\bGENERATED\s+(ALWAYS|BY\s+DEFAULT)\s+AS\s+IDENTITY\b/i,
        alternative: 'Use AUTO_INCREMENT instead of IDENTITY',
        message: 'IDENTITY not supported - use AUTO_INCREMENT',
    },
    DOLLAR_QUOTE: {
        pattern: /\$\$[\s\S]*?\$\$/,
        alternative: 'Use single quotes with proper escaping',
        message: 'Dollar-quoted strings not supported in MySQL',
    },
    RETURNING: {
        pattern: /\bRETURNING\b/i,
        alternative: 'Use LAST_INSERT_ID() after INSERT or separate SELECT',
        message: 'RETURNING clause not fully supported - use LAST_INSERT_ID() or separate query',
        isWarning: true,
    },
    LISTEN: {
        pattern: /\bLISTEN\b/i,
        alternative: 'Use polling or external message queue (Redis, RabbitMQ)',
        message: 'LISTEN not supported in MySQL',
    },
    NOTIFY: {
        pattern: /\bNOTIFY\b/i,
        alternative: 'Use external message queue or trigger with application notification',
        message: 'NOTIFY not supported in MySQL',
    },
    CREATE_EXTENSION: {
        pattern: /\bCREATE\s+EXTENSION\b/i,
        alternative: 'MySQL uses plugins, not extensions. Check MySQL documentation.',
        message: 'CREATE EXTENSION not applicable to MySQL',
    },
    EXCLUSION: {
        pattern: /\bEXCLUDE\s+(USING|WITH)/i,
        alternative: 'Implement exclusion logic in application layer or use triggers',
        message: 'EXCLUSION constraints not supported in MySQL',
    },
    DEFERRABLE: {
        pattern: /\bDEFERRABLE\b/i,
        alternative: 'Remove DEFERRABLE - MySQL constraints are immediate',
        message: 'DEFERRABLE constraints not supported',
    },
    GIST_INDEX: {
        pattern: /\bUSING\s+GIST\b/i,
        alternative: 'Use SPATIAL index for geometry or BTREE for other cases',
        message: 'GiST indexes not supported - use SPATIAL or BTREE',
    },
    GIN_INDEX: {
        pattern: /\bUSING\s+GIN\b/i,
        alternative: 'Use FULLTEXT for text search or regular BTREE index',
        message: 'GIN indexes not supported - use FULLTEXT or BTREE',
    },
    SPGIST_INDEX: {
        pattern: /\bUSING\s+SPGIST\b/i,
        alternative: 'Use BTREE or SPATIAL index',
        message: 'SP-GiST indexes not supported',
    },
    BRIN_INDEX: {
        pattern: /\bUSING\s+BRIN\b/i,
        alternative: 'Use partitioning for similar optimization',
        message: 'BRIN indexes not supported',
    },
    PG_ADVISORY_LOCK: {
        pattern: /\bpg_advisory_lock/i,
        alternative: 'Use GET_LOCK() and RELEASE_LOCK() functions',
        message: 'pg_advisory_lock not available - use GET_LOCK()',
    },
    PLPGSQL: {
        pattern: /\bLANGUAGE\s+plpgsql\b/i,
        alternative: 'Convert to MySQL stored procedure syntax (BEGIN...END)',
        message: 'PL/pgSQL not supported - use MySQL procedure syntax',
    },
    DO_BLOCK: {
        pattern: /\bDO\s+\$\$/i,
        alternative: 'Create a stored procedure or execute statements separately',
        message: 'DO blocks not supported in MySQL',
    },
    TRUNCATE_RESTART: {
        pattern: /\bTRUNCATE\b.*\bRESTART\s+IDENTITY\b/i,
        alternative: 'Use TRUNCATE TABLE (auto-resets AUTO_INCREMENT in InnoDB)',
        message: 'RESTART IDENTITY syntax not needed - MySQL TRUNCATE resets AUTO_INCREMENT',
        isWarning: true,
    },
    NOW_FUNCTION: {
        pattern: /\bNOW\s*\(\s*\)/i,
        alternative: 'NOW() works in MySQL - no change needed',
        message: 'NOW() is supported in MySQL',
        isWarning: true,
    },
    GEN_RANDOM_UUID: {
        pattern: /\bgen_random_uuid\s*\(\s*\)/i,
        alternative: 'Use UUID() function in MySQL',
        message: 'gen_random_uuid() not available - use UUID()',
    },
};
export const PLANETSCALE_UNSUPPORTED = {
    FOREIGN_KEY: {
        pattern: /\bFOREIGN\s+KEY\b/i,
        alternative: 'Implement referential integrity in application layer',
        message: 'Foreign keys not supported in PlanetScale (Vitess limitation)',
    },
    REFERENCES: {
        pattern: /\bREFERENCES\s+\w+/i,
        alternative: 'Remove REFERENCES - implement in application layer',
        message: 'Foreign key references not enforced in PlanetScale',
    },
    UNIQUE_MULTI_COLUMN: {
        pattern: /\bUNIQUE\s*\([^)]+,\s*[^)]+\)/i,
        alternative: 'Consider sharding implications for multi-column unique constraints',
        message: 'Multi-column UNIQUE may not work as expected across shards',
    },
};
export function validateSqlForMySQL(sql, dialect = 'mysql', location) {
    const errors = [];
    for (const [name, config] of Object.entries(UNSUPPORTED_DATA_TYPES)) {
        if (config.dialects && !config.dialects.includes(dialect))
            continue;
        if (config.pattern.test(sql)) {
            const match = sql.match(config.pattern);
            errors.push({
                category: 'DATA_TYPE',
                feature: name,
                detected: match?.[0] || name,
                location,
                message: config.message,
                alternative: config.alternative,
                dialects: config.dialects,
                docsUrl: 'https://dev.mysql.com/doc/refman/8.0/en/data-types.html',
            });
        }
    }
    for (const [name, config] of Object.entries(UNSUPPORTED_SQL)) {
        if (config.dialects && !config.dialects.includes(dialect))
            continue;
        if (config.isWarning)
            continue;
        if (config.pattern.test(sql)) {
            const match = sql.match(config.pattern);
            let category = 'SYNTAX';
            if (name.includes('SEQUENCE') || name.includes('IDENTITY'))
                category = 'SEQUENCE';
            else if (name.includes('INDEX') || name.includes('GIST') || name.includes('GIN'))
                category = 'INDEX';
            else if (name.includes('TRIGGER'))
                category = 'TRIGGER';
            else if (name.includes('CONSTRAINT') || name.includes('DEFERRABLE') || name.includes('EXCLUSION'))
                category = 'CONSTRAINT';
            else if (name.includes('PLPGSQL') || name.includes('DO_BLOCK'))
                category = 'FUNCTION';
            errors.push({
                category,
                feature: name,
                detected: match?.[0] || name,
                location,
                message: config.message,
                alternative: config.alternative,
                dialects: config.dialects,
            });
        }
    }
    if (dialect === 'planetscale') {
        for (const [name, config] of Object.entries(PLANETSCALE_UNSUPPORTED)) {
            if (config.pattern.test(sql)) {
                const match = sql.match(config.pattern);
                errors.push({
                    category: 'PLANETSCALE',
                    feature: name,
                    detected: match?.[0] || name,
                    location,
                    message: config.message,
                    alternative: config.alternative,
                    dialects: ['planetscale'],
                    docsUrl: 'https://planetscale.com/docs/learn/operating-without-foreign-key-constraints',
                });
            }
        }
    }
    return errors;
}
export function validateSchemaForMySQL(schema, dialect = 'mysql') {
    const errors = [];
    const warnings = [];
    if ((dialect === 'mysql' || dialect === 'planetscale') && schema.sequences && schema.sequences.length > 0) {
        for (const seq of schema.sequences) {
            errors.push({
                category: 'SEQUENCE',
                feature: 'SEQUENCE',
                detected: seq.name,
                location: `sequence:${seq.name}`,
                message: 'Sequences not supported in MySQL - use AUTO_INCREMENT',
                alternative: 'Remove sequence and use AUTO_INCREMENT on the column',
                dialects: ['mysql', 'planetscale'],
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
                message: `PostgreSQL extension "${ext}" not applicable - MySQL uses plugins`,
                alternative: 'Check MySQL plugin documentation for equivalent functionality',
            });
        }
    }
    if (schema.functions) {
        for (const func of schema.functions) {
            if (func.language?.toLowerCase() === 'plpgsql') {
                errors.push({
                    category: 'FUNCTION',
                    feature: 'PLPGSQL',
                    detected: func.name,
                    location: `function:${func.name}`,
                    message: 'PL/pgSQL functions must be converted to MySQL syntax',
                    alternative: 'Convert to MySQL stored procedure (BEGIN...END, DECLARE, etc.)',
                    docsUrl: 'https://dev.mysql.com/doc/refman/8.0/en/create-procedure.html',
                });
            }
            if (func.body) {
                const bodyErrors = validateSqlForMySQL(func.body, dialect, `function:${func.name}`);
                errors.push(...bodyErrors);
            }
        }
    }
    if (schema.tables) {
        for (const table of schema.tables) {
            if (table.columns) {
                for (const col of table.columns) {
                    const typeErrors = validateSqlForMySQL(col.type, dialect, `${table.name}.${col.name}`);
                    errors.push(...typeErrors);
                    if (dialect === 'planetscale' && col.references) {
                        warnings.push({
                            category: 'PLANETSCALE',
                            feature: 'FOREIGN_KEY_COLUMN',
                            detected: `${col.name} -> ${col.references.table}`,
                            location: `${table.name}.${col.name}`,
                            message: 'Foreign key references not enforced in PlanetScale',
                            alternative: 'Implement referential integrity in application layer',
                            dialects: ['planetscale'],
                        });
                    }
                }
            }
            if (table.constraints) {
                for (const constraint of table.constraints) {
                    if (dialect === 'planetscale' && constraint.type === 'FOREIGN KEY') {
                        errors.push({
                            category: 'PLANETSCALE',
                            feature: 'FOREIGN_KEY_CONSTRAINT',
                            detected: constraint.references?.table || 'unknown',
                            location: `table:${table.name}`,
                            message: 'Foreign key constraints not supported in PlanetScale',
                            alternative: 'Remove FOREIGN KEY constraint - implement in application',
                            dialects: ['planetscale'],
                        });
                    }
                }
            }
        }
    }
    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
}
export function transformPgToMySQL(sql) {
    let result = sql;
    const transforms = [];
    for (const [name, config] of Object.entries(PG_TO_MYSQL_TRANSFORMS)) {
        if (config.pattern.test(result)) {
            result = result.replace(config.pattern, config.transform);
            transforms.push(`${name}: ${config.message}`);
        }
    }
    return { sql: result, transforms };
}
export function formatMySQLErrors(result, dialect = 'mysql') {
    const lines = [];
    const dialectName = dialect === 'planetscale' ? 'PlanetScale' : dialect === 'mariadb' ? 'MariaDB' : 'MySQL';
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
export function hasMySQLIncompatibilities(sql, dialect = 'mysql') {
    for (const [, config] of Object.entries(UNSUPPORTED_DATA_TYPES)) {
        if (config.dialects && !config.dialects.includes(dialect))
            continue;
        if (config.pattern.test(sql))
            return true;
    }
    for (const [, config] of Object.entries(UNSUPPORTED_SQL)) {
        if (config.dialects && !config.dialects.includes(dialect))
            continue;
        if (config.isWarning)
            continue;
        if (config.pattern.test(sql))
            return true;
    }
    if (dialect === 'planetscale') {
        for (const [, config] of Object.entries(PLANETSCALE_UNSUPPORTED)) {
            if (config.pattern.test(sql))
                return true;
        }
    }
    return false;
}
