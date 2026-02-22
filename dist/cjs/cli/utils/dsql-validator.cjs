"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TRANSACTION_LIMITS = exports.UNSUPPORTED_SQL = exports.UNSUPPORTED_DATA_TYPES = void 0;
exports.validateSqlForDsql = validateSqlForDsql;
exports.validateSchemaForDsql = validateSchemaForDsql;
exports.formatDsqlErrors = formatDsqlErrors;
exports.hasDsqlIncompatibilities = hasDsqlIncompatibilities;
exports.UNSUPPORTED_DATA_TYPES = {
    SERIAL: {
        pattern: /\bSERIAL\b/i,
        alternative: 'UUID PRIMARY KEY DEFAULT gen_random_uuid()',
        message: 'SERIAL type not supported - sequences cause contention in distributed systems',
    },
    BIGSERIAL: {
        pattern: /\bBIGSERIAL\b/i,
        alternative: 'UUID PRIMARY KEY DEFAULT gen_random_uuid()',
        message: 'BIGSERIAL type not supported - sequences cause contention in distributed systems',
    },
    SMALLSERIAL: {
        pattern: /\bSMALLSERIAL\b/i,
        alternative: 'UUID PRIMARY KEY DEFAULT gen_random_uuid()',
        message: 'SMALLSERIAL type not supported - sequences cause contention in distributed systems',
    },
    JSONB_COLUMN: {
        pattern: /\bJSONB\b/i,
        alternative: 'TEXT (store JSON as text, cast during queries: data::jsonb)',
        message: 'JSONB not supported as column type - only as runtime query type',
    },
    JSON_COLUMN: {
        pattern: /\bJSON\b(?!\s*_)/i,
        alternative: 'TEXT (store JSON as text, cast during queries: data::json)',
        message: 'JSON not supported as column type - only as runtime query type',
    },
    XML: {
        pattern: /\bXML\b/i,
        alternative: 'TEXT (store XML as text)',
        message: 'XML type not supported',
    },
    POINT: {
        pattern: /\bPOINT\b/i,
        alternative: 'Store as two NUMERIC columns (x, y) or TEXT',
        message: 'Geometric POINT type not supported',
    },
    LINE: {
        pattern: /\bLINE\b/i,
        alternative: 'Store as TEXT or separate columns',
        message: 'Geometric LINE type not supported',
    },
    LSEG: {
        pattern: /\bLSEG\b/i,
        alternative: 'Store as TEXT or separate columns',
        message: 'Geometric LSEG type not supported',
    },
    BOX: {
        pattern: /\bBOX\b/i,
        alternative: 'Store as TEXT or four NUMERIC columns',
        message: 'Geometric BOX type not supported',
    },
    PATH: {
        pattern: /\bPATH\b/i,
        alternative: 'Store as TEXT',
        message: 'Geometric PATH type not supported',
    },
    POLYGON: {
        pattern: /\bPOLYGON\b/i,
        alternative: 'Store as TEXT',
        message: 'Geometric POLYGON type not supported',
    },
    CIRCLE: {
        pattern: /\bCIRCLE\b/i,
        alternative: 'Store as TEXT or three NUMERIC columns (x, y, radius)',
        message: 'Geometric CIRCLE type not supported',
    },
    INT4RANGE: {
        pattern: /\bINT4RANGE\b/i,
        alternative: 'Use two INTEGER columns (range_start, range_end)',
        message: 'Range type INT4RANGE not supported',
    },
    INT8RANGE: {
        pattern: /\bINT8RANGE\b/i,
        alternative: 'Use two BIGINT columns (range_start, range_end)',
        message: 'Range type INT8RANGE not supported',
    },
    NUMRANGE: {
        pattern: /\bNUMRANGE\b/i,
        alternative: 'Use two NUMERIC columns (range_start, range_end)',
        message: 'Range type NUMRANGE not supported',
    },
    TSRANGE: {
        pattern: /\bTSRANGE\b/i,
        alternative: 'Use two TIMESTAMP columns (range_start, range_end)',
        message: 'Range type TSRANGE not supported',
    },
    TSTZRANGE: {
        pattern: /\bTSTZRANGE\b/i,
        alternative: 'Use two TIMESTAMPTZ columns (range_start, range_end)',
        message: 'Range type TSTZRANGE not supported',
    },
    DATERANGE: {
        pattern: /\bDATERANGE\b/i,
        alternative: 'Use two DATE columns (range_start, range_end)',
        message: 'Range type DATERANGE not supported',
    },
    BIT: {
        pattern: /\bBIT\s*\(/i,
        alternative: 'Use BYTEA or TEXT',
        message: 'BIT string type not supported',
    },
    VARBIT: {
        pattern: /\bVARBIT\b/i,
        alternative: 'Use BYTEA or TEXT',
        message: 'BIT VARYING type not supported',
    },
    BIT_VARYING: {
        pattern: /\bBIT\s+VARYING\b/i,
        alternative: 'Use BYTEA or TEXT',
        message: 'BIT VARYING type not supported',
    },
    CIDR: {
        pattern: /\bCIDR\b/i,
        alternative: 'Use TEXT or VARCHAR to store network addresses',
        message: 'CIDR type not supported as column type',
    },
    MACADDR: {
        pattern: /\bMACADDR\b/i,
        alternative: 'Use TEXT or VARCHAR(17)',
        message: 'MACADDR type not supported as column type',
    },
    MACADDR8: {
        pattern: /\bMACADDR8\b/i,
        alternative: 'Use TEXT or VARCHAR(23)',
        message: 'MACADDR8 type not supported as column type',
    },
    ARRAY_TYPE: {
        pattern: /\[\s*\]|\bARRAY\s*\[/i,
        alternative: 'Use TEXT to store array as JSON string, or normalize into separate table',
        message: 'Array types not supported as column types - only as runtime query types',
    },
    MONEY: {
        pattern: /\bMONEY\b/i,
        alternative: 'Use NUMERIC(precision, scale) for monetary values',
        message: 'MONEY type not recommended - use NUMERIC for precision',
    },
    OID: {
        pattern: /\bOID\b/i,
        alternative: 'Use INTEGER or BIGINT',
        message: 'OID type not supported',
    },
    REGPROC: {
        pattern: /\bREGPROC\b/i,
        alternative: 'Use TEXT to store function names',
        message: 'REGPROC type not supported',
    },
    REGCLASS: {
        pattern: /\bREGCLASS\b/i,
        alternative: 'Use TEXT to store table names',
        message: 'REGCLASS type not supported',
    },
    REGTYPE: {
        pattern: /\bREGTYPE\b/i,
        alternative: 'Use TEXT to store type names',
        message: 'REGTYPE type not supported',
    },
    TSVECTOR: {
        pattern: /\bTSVECTOR\b/i,
        alternative: 'Use TEXT and implement search in application layer',
        message: 'TSVECTOR type not supported - full-text search not available',
    },
    TSQUERY: {
        pattern: /\bTSQUERY\b/i,
        alternative: 'Implement search logic in application layer',
        message: 'TSQUERY type not supported - full-text search not available',
    },
    INT4MULTIRANGE: {
        pattern: /\bINT4MULTIRANGE\b/i,
        alternative: 'Use junction table with bound columns',
        message: 'Multirange type INT4MULTIRANGE not supported',
    },
    INT8MULTIRANGE: {
        pattern: /\bINT8MULTIRANGE\b/i,
        alternative: 'Use junction table with bound columns',
        message: 'Multirange type INT8MULTIRANGE not supported',
    },
    NUMMULTIRANGE: {
        pattern: /\bNUMMULTIRANGE\b/i,
        alternative: 'Use junction table with bound columns',
        message: 'Multirange type NUMMULTIRANGE not supported',
    },
    TSMULTIRANGE: {
        pattern: /\bTSMULTIRANGE\b/i,
        alternative: 'Use junction table with bound columns',
        message: 'Multirange type TSMULTIRANGE not supported',
    },
    TSTZMULTIRANGE: {
        pattern: /\bTSTZMULTIRANGE\b/i,
        alternative: 'Use junction table with bound columns',
        message: 'Multirange type TSTZMULTIRANGE not supported',
    },
    DATEMULTIRANGE: {
        pattern: /\bDATEMULTIRANGE\b/i,
        alternative: 'Use junction table with bound columns',
        message: 'Multirange type DATEMULTIRANGE not supported',
    },
    REGPROCEDURE: {
        pattern: /\bREGPROCEDURE\b/i,
        alternative: 'Use TEXT to store procedure signatures',
        message: 'REGPROCEDURE type not supported',
    },
    REGOPER: {
        pattern: /\bREGOPER\b/i,
        alternative: 'Use TEXT to store operator names',
        message: 'REGOPER type not supported',
    },
    REGOPERATOR: {
        pattern: /\bREGOPERATOR\b/i,
        alternative: 'Use TEXT to store operator signatures',
        message: 'REGOPERATOR type not supported',
    },
    REGROLE: {
        pattern: /\bREGROLE\b/i,
        alternative: 'Use TEXT to store role names',
        message: 'REGROLE type not supported',
    },
    REGNAMESPACE: {
        pattern: /\bREGNAMESPACE\b/i,
        alternative: 'Use TEXT to store schema names',
        message: 'REGNAMESPACE type not supported',
    },
    REGCONFIG: {
        pattern: /\bREGCONFIG\b/i,
        alternative: 'Use TEXT',
        message: 'REGCONFIG type not supported',
    },
    REGDICTIONARY: {
        pattern: /\bREGDICTIONARY\b/i,
        alternative: 'Use TEXT',
        message: 'REGDICTIONARY type not supported',
    },
    PG_LSN: {
        pattern: /\bPG_LSN\b/i,
        alternative: 'No direct alternative',
        message: 'PG_LSN type not supported',
    },
    PG_SNAPSHOT: {
        pattern: /\bPG_SNAPSHOT\b/i,
        alternative: 'No direct alternative',
        message: 'PG_SNAPSHOT type not supported',
    },
    INET: {
        pattern: /\bINET\b/i,
        alternative: 'Use VARCHAR(45) for both IPv4 and IPv6',
        message: 'INET not supported as column type - runtime-only',
    },
};
exports.UNSUPPORTED_SQL = {
    CREATE_TRIGGER: {
        pattern: /\bCREATE\s+(OR\s+REPLACE\s+)?TRIGGER\b/i,
        alternative: 'Move trigger logic to application code or AWS Lambda/EventBridge',
        message: 'Triggers not supported in DSQL',
    },
    DROP_TRIGGER: {
        pattern: /\bDROP\s+TRIGGER\b/i,
        alternative: 'N/A - triggers not supported',
        message: 'Triggers not supported in DSQL',
    },
    PLPGSQL: {
        pattern: /\bLANGUAGE\s+plpgsql\b/i,
        alternative: 'Use LANGUAGE SQL functions or move logic to application/Lambda',
        message: 'PL/pgSQL not supported - only SQL language functions allowed',
    },
    PLPYTHON: {
        pattern: /\bLANGUAGE\s+plpython/i,
        alternative: 'Use AWS Lambda for Python logic',
        message: 'PL/Python not supported',
    },
    PLPERL: {
        pattern: /\bLANGUAGE\s+plperl/i,
        alternative: 'Use AWS Lambda',
        message: 'PL/Perl not supported',
    },
    DO_BLOCK: {
        pattern: /\bDO\s+\$\$/i,
        alternative: 'Execute statements separately or use SQL functions',
        message: 'DO $$ blocks not supported - no anonymous code blocks',
    },
    CREATE_SEQUENCE: {
        pattern: /\bCREATE\s+SEQUENCE\b/i,
        alternative: 'Use UUID with gen_random_uuid() instead of sequences',
        message: 'Sequences not recommended - cause contention in distributed systems',
    },
    NEXTVAL: {
        pattern: /\bNEXTVAL\s*\(/i,
        alternative: 'Use gen_random_uuid() for unique IDs',
        message: 'NEXTVAL not recommended - sequences cause contention',
    },
    CURRVAL: {
        pattern: /\bCURRVAL\s*\(/i,
        alternative: 'Use UUID instead of sequences',
        message: 'CURRVAL not recommended - sequences cause contention',
    },
    SETVAL: {
        pattern: /\bSETVAL\s*\(/i,
        alternative: 'N/A - use UUID instead of sequences',
        message: 'SETVAL not supported - sequences not recommended',
    },
    TRUNCATE: {
        pattern: /\bTRUNCATE\b/i,
        alternative: 'Use DELETE FROM table_name (or DROP TABLE + CREATE TABLE)',
        message: 'TRUNCATE not supported',
    },
    TEMP_TABLE: {
        pattern: /\bCREATE\s+(GLOBAL\s+|LOCAL\s+)?TEMP(ORARY)?\s+TABLE\b/i,
        alternative: 'Use CTEs (WITH clause) or regular tables with session-specific names',
        message: 'Temporary tables not supported',
    },
    VACUUM: {
        pattern: /\bVACUUM\b/i,
        alternative: 'Not needed - DSQL automatically manages storage',
        message: 'VACUUM not supported - automatic storage management',
    },
    ALTER_SYSTEM: {
        pattern: /\bALTER\s+SYSTEM\b/i,
        alternative: 'Not needed - DSQL is fully managed',
        message: 'ALTER SYSTEM not supported - system is fully managed',
    },
    TABLESPACE: {
        pattern: /\bTABLESPACE\b/i,
        alternative: 'Not needed - DSQL manages storage automatically',
        message: 'Tablespaces not supported - automatic storage management',
    },
    CREATE_DATABASE: {
        pattern: /\bCREATE\s+DATABASE\b/i,
        alternative: 'Use separate clusters or schemas within the single postgres database',
        message: 'CREATE DATABASE not supported - only one database per cluster',
    },
    IDENTITY: {
        pattern: /\bGENERATED\s+(ALWAYS|BY\s+DEFAULT)\s+AS\s+IDENTITY\b/i,
        alternative: 'Use UUID PRIMARY KEY DEFAULT gen_random_uuid()',
        message: 'IDENTITY constraint not supported',
    },
    REFERENCES: {
        pattern: /\bREFERENCES\s+\w+/i,
        alternative: 'Implement referential integrity in application layer (JOINs still work)',
        message: 'Foreign key constraints not enforced - relationships work but not validated',
    },
    FOREIGN_KEY: {
        pattern: /\bFOREIGN\s+KEY\b/i,
        alternative: 'Implement referential integrity in application layer',
        message: 'Foreign key constraints not enforced',
    },
    ON_DELETE_CASCADE: {
        pattern: /\bON\s+DELETE\s+CASCADE\b/i,
        alternative: 'Implement cascade logic in application layer',
        message: 'CASCADE not enforced - implement in application',
    },
    ON_UPDATE_CASCADE: {
        pattern: /\bON\s+UPDATE\s+CASCADE\b/i,
        alternative: 'Implement cascade logic in application layer',
        message: 'CASCADE not enforced - implement in application',
    },
    PARTITION_BY: {
        pattern: /\bPARTITION\s+BY\b/i,
        alternative: 'Remove - DSQL automatically partitions data',
        message: 'Manual partitioning not supported - automatic partitioning',
    },
    LISTEN: {
        pattern: /\bLISTEN\b/i,
        alternative: 'Use AWS SNS, SQS, or EventBridge for notifications',
        message: 'LISTEN not supported',
    },
    NOTIFY: {
        pattern: /\bNOTIFY\b/i,
        alternative: 'Use AWS SNS, SQS, or EventBridge for notifications',
        message: 'NOTIFY not supported',
    },
    CREATE_EXTENSION: {
        pattern: /\bCREATE\s+EXTENSION\b/i,
        alternative: 'Extensions not supported - use built-in functions only',
        message: 'Extensions not supported in DSQL',
    },
    CREATE_RULE: {
        pattern: /\bCREATE\s+(OR\s+REPLACE\s+)?RULE\b/i,
        alternative: 'Implement rule logic in application layer or views',
        message: 'Rules not supported',
    },
    WITH_HOLD: {
        pattern: /\bWITH\s+HOLD\b/i,
        alternative: 'Use application-side pagination',
        message: 'WITH HOLD cursors not supported',
    },
    ADVISORY_LOCK: {
        pattern: /\bpg_advisory_lock/i,
        alternative: 'Use optimistic concurrency or external locking (DynamoDB, Redis)',
        message: 'Advisory locks not supported - use optimistic concurrency',
    },
    TO_TSVECTOR: {
        pattern: /\bto_tsvector\s*\(/i,
        alternative: 'Use external search service (OpenSearch, Elasticsearch)',
        message: 'Full-text search functions not supported',
    },
    TO_TSQUERY: {
        pattern: /\bto_tsquery\s*\(/i,
        alternative: 'Use external search service',
        message: 'Full-text search functions not supported',
    },
    GIN_INDEX: {
        pattern: /\bUSING\s+gin\b/i,
        alternative: 'Use B-tree index (USING btree)',
        message: 'GIN indexes not supported - only B-tree allowed',
    },
    GIST_INDEX: {
        pattern: /\bUSING\s+gist\b/i,
        alternative: 'Use B-tree index (USING btree)',
        message: 'GiST indexes not supported - only B-tree allowed',
    },
    SPGIST_INDEX: {
        pattern: /\bUSING\s+spgist\b/i,
        alternative: 'Use B-tree index (USING btree)',
        message: 'SP-GiST indexes not supported - only B-tree allowed',
    },
    BRIN_INDEX: {
        pattern: /\bUSING\s+brin\b/i,
        alternative: 'Use B-tree index (USING btree)',
        message: 'BRIN indexes not supported - only B-tree allowed',
    },
    HASH_INDEX: {
        pattern: /\bUSING\s+hash\b/i,
        alternative: 'Use B-tree index (USING btree)',
        message: 'Hash indexes not supported - only B-tree allowed',
    },
    CREATE_MATERIALIZED_VIEW: {
        pattern: /\bCREATE\s+MATERIALIZED\s+VIEW\b/i,
        alternative: 'Use regular views or cache results in application layer',
        message: 'Materialized views not supported',
    },
    REFRESH_MATERIALIZED_VIEW: {
        pattern: /\bREFRESH\s+MATERIALIZED\s+VIEW\b/i,
        alternative: 'N/A - materialized views not supported',
        message: 'REFRESH MATERIALIZED VIEW not supported',
    },
    EXCLUSION_CONSTRAINT: {
        pattern: /\bEXCLUDE\s+(USING\s+\w+\s*)?\(/i,
        alternative: 'Implement exclusion logic in application layer',
        message: 'EXCLUSION constraints not supported',
    },
    DEFERRABLE_CONSTRAINT: {
        pattern: /\bDEFERRABLE\b/i,
        alternative: 'Remove — all constraints are immediate in DSQL',
        message: 'DEFERRABLE constraints not supported',
    },
    UNLOGGED_TABLE: {
        pattern: /\bCREATE\s+UNLOGGED\s+TABLE\b/i,
        alternative: 'Use regular tables — DSQL manages durability',
        message: 'UNLOGGED tables not supported',
    },
    TABLE_INHERITS: {
        pattern: /\bINHERITS\s*\(/i,
        alternative: 'Use separate tables with shared column definitions',
        message: 'Table inheritance (INHERITS) not supported',
    },
    INDEX_CONCURRENTLY: {
        pattern: /\b(?:CREATE|DROP)\s+(?:UNIQUE\s+)?INDEX\s+CONCURRENTLY\b/i,
        alternative: 'Remove CONCURRENTLY — DSQL manages index creation',
        message: 'CONCURRENTLY not supported for index operations',
    },
    CREATE_PROCEDURE: {
        pattern: /\bCREATE\s+(OR\s+REPLACE\s+)?PROCEDURE\b/i,
        alternative: 'Use SQL-language functions or application logic',
        message: 'Procedures may not work if using non-SQL language',
    },
    LASTVAL: {
        pattern: /\bLASTVAL\s*\(/i,
        alternative: 'Use RETURNING clause',
        message: 'LASTVAL not supported - sequences not available',
    },
    CREATE_COLLATION: {
        pattern: /\bCREATE\s+COLLATION\b/i,
        alternative: 'Only C collation supported in DSQL',
        message: 'Custom collations not supported',
    },
};
exports.TRANSACTION_LIMITS = {
    MAX_ROWS_PER_TRANSACTION: 3000,
    CONNECTION_TIMEOUT_HOURS: 1,
    MAX_DDL_PER_TRANSACTION: 1,
    ISOLATION_LEVEL: 'REPEATABLE READ',
};
function validateSqlForDsql(sql, location) {
    const errors = [];
    for (const [name, config] of Object.entries(exports.UNSUPPORTED_DATA_TYPES)) {
        if (config.pattern.test(sql)) {
            const match = sql.match(config.pattern);
            errors.push({
                category: 'DATA_TYPE',
                feature: name,
                detected: match?.[0] || name,
                location,
                message: config.message,
                alternative: config.alternative,
                docsUrl: 'https://docs.aws.amazon.com/aurora-dsql/latest/userguide/working-with-postgresql-compatibility-supported-data-types.html',
            });
        }
    }
    for (const [name, config] of Object.entries(exports.UNSUPPORTED_SQL)) {
        if (config.pattern.test(sql)) {
            const match = sql.match(config.pattern);
            let category = 'SYNTAX';
            if (name.includes('TRIGGER'))
                category = 'TRIGGER';
            else if (name.includes('SEQUENCE') || name.includes('NEXTVAL') || name.includes('SERIAL'))
                category = 'SEQUENCE';
            else if (name.includes('FOREIGN') || name.includes('REFERENCES') || name.includes('CASCADE'))
                category = 'CONSTRAINT';
            else if (name.includes('CREATE') || name.includes('DROP') || name.includes('ALTER'))
                category = 'DDL';
            else if (name.includes('TRUNCATE') || name.includes('VACUUM'))
                category = 'DML';
            else if (name.includes('PL') || name.includes('LANGUAGE') || name.includes('DO_BLOCK'))
                category = 'FUNCTION';
            else if (name.includes('INDEX'))
                category = 'INDEX';
            errors.push({
                category,
                feature: name,
                detected: match?.[0] || name,
                location,
                message: config.message,
                alternative: config.alternative,
                docsUrl: 'https://docs.aws.amazon.com/aurora-dsql/latest/userguide/working-with-postgresql-compatibility-unsupported-features.html',
            });
        }
    }
    return errors;
}
function validateSchemaForDsql(schema) {
    const errors = [];
    const warnings = [];
    if (schema.triggers && schema.triggers.length > 0) {
        for (const trigger of schema.triggers) {
            errors.push({
                category: 'TRIGGER',
                feature: 'TRIGGER',
                detected: trigger.name,
                location: `trigger:${trigger.name}`,
                message: 'Triggers not supported in DSQL',
                alternative: 'Move trigger logic to application code or AWS Lambda/EventBridge',
                docsUrl: 'https://docs.aws.amazon.com/aurora-dsql/latest/userguide/working-with-postgresql-compatibility-unsupported-features.html',
            });
        }
    }
    if (schema.sequences && schema.sequences.length > 0) {
        for (const seq of schema.sequences) {
            warnings.push({
                category: 'SEQUENCE',
                feature: 'SEQUENCE',
                detected: seq.name,
                location: `sequence:${seq.name}`,
                message: 'Sequences cause contention in distributed systems',
                alternative: 'Use UUID with gen_random_uuid() instead',
            });
        }
    }
    if (schema.extensions && schema.extensions.length > 0) {
        for (const ext of schema.extensions) {
            errors.push({
                category: 'DDL',
                feature: 'EXTENSION',
                detected: ext,
                location: `extension:${ext}`,
                message: `Extension "${ext}" not supported`,
                alternative: 'Use built-in functions only',
            });
        }
    }
    if (schema.functions) {
        for (const func of schema.functions) {
            if (func.language && func.language.toLowerCase() !== 'sql') {
                errors.push({
                    category: 'FUNCTION',
                    feature: 'PROCEDURAL_LANGUAGE',
                    detected: func.language,
                    location: `function:${func.name}`,
                    message: `Language "${func.language}" not supported - only SQL allowed`,
                    alternative: 'Use LANGUAGE SQL or move logic to application/Lambda',
                });
            }
            if (func.body) {
                const bodyErrors = validateSqlForDsql(func.body, `function:${func.name}`);
                errors.push(...bodyErrors);
            }
        }
    }
    if (schema.tables) {
        for (const table of schema.tables) {
            if (table.columns) {
                for (const col of table.columns) {
                    const typeErrors = validateSqlForDsql(col.type, `${table.name}.${col.name}`);
                    errors.push(...typeErrors);
                    if (col.references) {
                        warnings.push({
                            category: 'CONSTRAINT',
                            feature: 'FOREIGN_KEY',
                            detected: `${col.name} -> ${col.references.table}`,
                            location: `${table.name}.${col.name}`,
                            message: 'Foreign key constraints not enforced',
                            alternative: 'Implement referential integrity in application layer (JOINs still work)',
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
function formatDsqlErrors(result) {
    const lines = [];
    if (result.errors.length > 0) {
        lines.push('\x1b[31m✗ DSQL Compatibility Errors:\x1b[0m\n');
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
        lines.push('\x1b[33m⚠ DSQL Compatibility Warnings:\x1b[0m\n');
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
function hasDsqlIncompatibilities(sql) {
    for (const config of Object.values(exports.UNSUPPORTED_DATA_TYPES)) {
        if (config.pattern.test(sql))
            return true;
    }
    for (const config of Object.values(exports.UNSUPPORTED_SQL)) {
        if (config.pattern.test(sql))
            return true;
    }
    return false;
}
