"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TRANSACTION_NOTES = exports.UNSUPPORTED_SQL = exports.UNSUPPORTED_DATA_TYPES = void 0;
exports.validateSqlForCrdb = validateSqlForCrdb;
exports.validateSchemaForCrdb = validateSchemaForCrdb;
exports.formatCrdbErrors = formatCrdbErrors;
exports.hasCrdbIncompatibilities = hasCrdbIncompatibilities;
exports.UNSUPPORTED_DATA_TYPES = {
    MONEY: {
        pattern: /\bMONEY\b/i,
        alternative: 'Use DECIMAL(precision, scale) for monetary values',
        message: 'MONEY type not supported in CockroachDB',
    },
    XML: {
        pattern: /\bXML\b/i,
        alternative: 'Store XML as TEXT or JSONB',
        message: 'XML type not supported in CockroachDB',
    },
    POINT: {
        pattern: /\bPOINT\b(?!\s*\()/i,
        alternative: 'Use GEOMETRY type from PostGIS extension or store as two FLOAT columns',
        message: 'Native POINT type not supported - use PostGIS GEOMETRY or separate columns',
    },
    LINE: {
        pattern: /\bLINE\b/i,
        alternative: 'Use PostGIS GEOMETRY or store as TEXT',
        message: 'Native LINE type not supported',
    },
    LSEG: {
        pattern: /\bLSEG\b/i,
        alternative: 'Use PostGIS GEOMETRY or store as TEXT',
        message: 'Native LSEG type not supported',
    },
    BOX: {
        pattern: /\bBOX\b/i,
        alternative: 'Use PostGIS GEOMETRY or four FLOAT columns',
        message: 'Native BOX type not supported',
    },
    PATH: {
        pattern: /\bPATH\b/i,
        alternative: 'Use PostGIS GEOMETRY or store as TEXT/JSONB',
        message: 'Native PATH type not supported',
    },
    POLYGON: {
        pattern: /\bPOLYGON\b(?!\s*\()/i,
        alternative: 'Use PostGIS GEOMETRY or store as TEXT/JSONB',
        message: 'Native POLYGON type not supported - use PostGIS GEOMETRY',
    },
    CIRCLE: {
        pattern: /\bCIRCLE\b/i,
        alternative: 'Use PostGIS GEOMETRY or three FLOAT columns (x, y, radius)',
        message: 'Native CIRCLE type not supported',
    },
    INT4RANGE: {
        pattern: /\bINT4RANGE\b/i,
        alternative: 'Use two INTEGER columns (range_start, range_end)',
        message: 'Range type INT4RANGE not supported in CockroachDB',
    },
    INT8RANGE: {
        pattern: /\bINT8RANGE\b/i,
        alternative: 'Use two BIGINT columns (range_start, range_end)',
        message: 'Range type INT8RANGE not supported in CockroachDB',
    },
    NUMRANGE: {
        pattern: /\bNUMRANGE\b/i,
        alternative: 'Use two DECIMAL columns (range_start, range_end)',
        message: 'Range type NUMRANGE not supported in CockroachDB',
    },
    TSRANGE: {
        pattern: /\bTSRANGE\b/i,
        alternative: 'Use two TIMESTAMP columns (range_start, range_end)',
        message: 'Range type TSRANGE not supported in CockroachDB',
    },
    TSTZRANGE: {
        pattern: /\bTSTZRANGE\b/i,
        alternative: 'Use two TIMESTAMPTZ columns (range_start, range_end)',
        message: 'Range type TSTZRANGE not supported in CockroachDB',
    },
    DATERANGE: {
        pattern: /\bDATERANGE\b/i,
        alternative: 'Use two DATE columns (range_start, range_end)',
        message: 'Range type DATERANGE not supported in CockroachDB',
    },
    TSVECTOR: {
        pattern: /\bTSVECTOR\b/i,
        alternative: 'Use full-text search service (Elasticsearch, Typesense) or TEXT with trigram index',
        message: 'TSVECTOR type not supported - full-text search not available natively',
    },
    TSQUERY: {
        pattern: /\bTSQUERY\b/i,
        alternative: 'Implement search logic in application layer',
        message: 'TSQUERY type not supported - full-text search not available natively',
    },
    OID: {
        pattern: /\bOID\b/i,
        alternative: 'Use INTEGER or BIGINT',
        message: 'OID type not fully supported in CockroachDB',
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
    CIDR: {
        pattern: /\bCIDR\b/i,
        alternative: 'Use INET (supported) or TEXT',
        message: 'CIDR type has limited support - consider INET or TEXT',
    },
    MACADDR: {
        pattern: /\bMACADDR\b/i,
        alternative: 'Use TEXT or VARCHAR(17)',
        message: 'MACADDR type not supported',
    },
    MACADDR8: {
        pattern: /\bMACADDR8\b/i,
        alternative: 'Use TEXT or VARCHAR(23)',
        message: 'MACADDR8 type not supported',
    },
};
exports.UNSUPPORTED_SQL = {
    CREATE_TRIGGER: {
        pattern: /\bCREATE\s+(OR\s+REPLACE\s+)?TRIGGER\b/i,
        alternative: 'CockroachDB has limited trigger support. Use changefeeds, application logic, or check feature availability.',
        message: 'Triggers have limited support in CockroachDB',
        isWarning: true,
    },
    UPDATE_OF_COLUMNS: {
        pattern: /\bUPDATE\s+OF\s+\w+/i,
        alternative: 'Use UPDATE trigger without column specification, handle column logic in function',
        message: 'UPDATE OF <columns> not supported in triggers - use UPDATE without column list',
    },
    TRUNCATE_TRIGGER: {
        pattern: /\bFOR\s+TRUNCATE\b|\bAFTER\s+TRUNCATE\b|\bBEFORE\s+TRUNCATE\b/i,
        alternative: 'Use DELETE trigger or application-level TRUNCATE handling',
        message: 'TRUNCATE event not supported in triggers',
    },
    CREATE_DOMAIN: {
        pattern: /\bCREATE\s+DOMAIN\b/i,
        alternative: 'Use CHECK constraints on columns directly',
        message: 'CREATE DOMAIN not supported in CockroachDB',
    },
    CREATE_TYPE_AS: {
        pattern: /\bCREATE\s+TYPE\s+\w+\s+AS\s*\(/i,
        alternative: 'Use JSONB or separate columns for composite data',
        message: 'Composite types (CREATE TYPE AS) not supported',
    },
    EXCLUSION: {
        pattern: /\bEXCLUDE\s+(USING|WITH)/i,
        alternative: 'Implement exclusion logic in application layer or use CHECK constraints',
        message: 'EXCLUSION constraints not supported in CockroachDB',
    },
    DEFERRABLE: {
        pattern: /\bDEFERRABLE\b/i,
        alternative: 'Remove DEFERRABLE - constraints are always immediate in CockroachDB',
        message: 'DEFERRABLE constraints not supported - constraints are always immediate',
    },
    INITIALLY_DEFERRED: {
        pattern: /\bINITIALLY\s+DEFERRED\b/i,
        alternative: 'Remove INITIALLY DEFERRED - constraints are always immediate',
        message: 'INITIALLY DEFERRED not supported',
    },
    PLPGSQL_TYPE: {
        pattern: /%TYPE\b/i,
        alternative: 'Use explicit type declaration instead of %TYPE',
        message: '%TYPE not supported in PL/pgSQL - use explicit types',
    },
    PLPGSQL_ROWTYPE: {
        pattern: /%ROWTYPE\b/i,
        alternative: 'Use RECORD type or explicit column declarations',
        message: '%ROWTYPE not supported in PL/pgSQL',
    },
    PLPGSQL_PERFORM: {
        pattern: /\bPERFORM\b/i,
        alternative: 'Use SELECT INTO a variable (SELECT ... INTO _unused)',
        message: 'PERFORM not supported in PL/pgSQL - use SELECT INTO',
    },
    PLPGSQL_GET_DIAGNOSTICS: {
        pattern: /\bGET\s+(STACKED\s+)?DIAGNOSTICS\b/i,
        alternative: 'Use explicit error handling with SQLSTATE',
        message: 'GET DIAGNOSTICS not fully supported in PL/pgSQL',
    },
    PLPGSQL_FOREACH: {
        pattern: /\bFOREACH\b/i,
        alternative: 'Use regular FOR loop with UNNEST() function',
        message: 'FOREACH not supported in PL/pgSQL - use FOR with UNNEST()',
    },
    LISTEN: {
        pattern: /\bLISTEN\b/i,
        alternative: 'Use CockroachDB Changefeeds for change data capture',
        message: 'LISTEN not supported - use Changefeeds',
    },
    NOTIFY: {
        pattern: /\bNOTIFY\b/i,
        alternative: 'Use CockroachDB Changefeeds or external message queue',
        message: 'NOTIFY not supported - use Changefeeds',
    },
    ADVISORY_LOCK: {
        pattern: /\bpg_advisory_lock/i,
        alternative: 'Use optimistic concurrency (SELECT FOR UPDATE) or external locking',
        message: 'Advisory locks not supported - use SELECT FOR UPDATE or external locks',
    },
    TRY_ADVISORY_LOCK: {
        pattern: /\bpg_try_advisory_lock/i,
        alternative: 'Use optimistic concurrency or external locking service',
        message: 'Advisory locks not supported',
    },
    SPGIST_INDEX: {
        pattern: /\bUSING\s+SPGIST\b/i,
        alternative: 'Use GiST or GIN index instead',
        message: 'SP-GiST indexes not supported - use GiST or GIN',
    },
    BRIN_INDEX: {
        pattern: /\bUSING\s+BRIN\b/i,
        alternative: 'CockroachDB uses automatic zone configuration for similar optimization',
        message: 'BRIN indexes not supported - CockroachDB handles this differently',
    },
    TABLESPACE: {
        pattern: /\bTABLESPACE\b/i,
        alternative: 'Use CockroachDB locality/zone configuration instead',
        message: 'Tablespaces not supported - use zone configurations',
        isWarning: true,
    },
    TO_TSVECTOR: {
        pattern: /\bto_tsvector\s*\(/i,
        alternative: 'Use external search service or trigram similarity (pg_trgm)',
        message: 'Full-text search (to_tsvector) not supported',
    },
    TO_TSQUERY: {
        pattern: /\bto_tsquery\s*\(/i,
        alternative: 'Use external search service',
        message: 'Full-text search (to_tsquery) not supported',
    },
    PLAINTO_TSQUERY: {
        pattern: /\bplainto_tsquery\s*\(/i,
        alternative: 'Use external search service',
        message: 'Full-text search not supported',
    },
    ALTER_SYSTEM: {
        pattern: /\bALTER\s+SYSTEM\b/i,
        alternative: 'Use SET CLUSTER SETTING for CockroachDB configuration',
        message: 'ALTER SYSTEM not supported - use SET CLUSTER SETTING',
    },
    REFRESH_CONCURRENTLY: {
        pattern: /\bREFRESH\s+MATERIALIZED\s+VIEW\s+CONCURRENTLY\b/i,
        alternative: 'Use REFRESH MATERIALIZED VIEW without CONCURRENTLY',
        message: 'REFRESH MATERIALIZED VIEW CONCURRENTLY not supported',
    },
    VACUUM: {
        pattern: /\bVACUUM\b/i,
        alternative: 'Not needed - CockroachDB has automatic garbage collection',
        message: 'VACUUM not supported - CockroachDB handles this automatically',
        isWarning: true,
    },
    CLUSTER: {
        pattern: /\bCLUSTER\b/i,
        alternative: 'Not needed - CockroachDB handles data distribution automatically',
        message: 'CLUSTER command not supported',
        isWarning: true,
    },
};
exports.TRANSACTION_NOTES = {
    RETRY_REQUIRED: 'CockroachDB may require transaction retries (error 40001). Implement retry logic.',
    SERIALIZABLE_DEFAULT: 'CockroachDB uses SERIALIZABLE isolation by default (strongest)',
    DDL_IN_TRANSACTION: 'DDL can run in transactions but may require SERIALIZABLE isolation',
};
function validateSqlForCrdb(sql, location) {
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
                docsUrl: 'https://www.cockroachlabs.com/docs/stable/postgresql-compatibility#data-types',
            });
        }
    }
    for (const [name, config] of Object.entries(exports.UNSUPPORTED_SQL)) {
        if (config.pattern.test(sql)) {
            const match = sql.match(config.pattern);
            let category = 'SYNTAX';
            if (name.includes('TRIGGER') || name.includes('TRUNCATE_TRIGGER') || name.includes('UPDATE_OF'))
                category = 'TRIGGER';
            else if (name.includes('DOMAIN') || name.includes('TYPE_AS'))
                category = 'DDL';
            else if (name.includes('EXCLUSION') || name.includes('DEFERRABLE'))
                category = 'CONSTRAINT';
            else if (name.includes('PLPGSQL'))
                category = 'PLPGSQL';
            else if (name.includes('LISTEN') || name.includes('NOTIFY') || name.includes('ADVISORY'))
                category = 'DML';
            else if (name.includes('INDEX') || name.includes('SPGIST') || name.includes('BRIN'))
                category = 'INDEX';
            else if (name.includes('VACUUM') || name.includes('CLUSTER'))
                category = 'DML';
            errors.push({
                category,
                feature: name,
                detected: match?.[0] || name,
                location,
                message: config.message,
                alternative: config.alternative,
                docsUrl: 'https://www.cockroachlabs.com/docs/stable/postgresql-compatibility',
            });
        }
    }
    return errors;
}
function validateSchemaForCrdb(schema) {
    const errors = [];
    const warnings = [];
    if (schema.domains && schema.domains.length > 0) {
        for (const domain of schema.domains) {
            errors.push({
                category: 'DDL',
                feature: 'DOMAIN',
                detected: domain.name,
                location: `domain:${domain.name}`,
                message: 'CREATE DOMAIN not supported in CockroachDB',
                alternative: 'Use CHECK constraints directly on columns instead',
                docsUrl: 'https://www.cockroachlabs.com/docs/stable/postgresql-compatibility',
            });
        }
    }
    if (schema.compositeTypes && schema.compositeTypes.length > 0) {
        for (const ct of schema.compositeTypes) {
            errors.push({
                category: 'DDL',
                feature: 'COMPOSITE_TYPE',
                detected: ct.name,
                location: `type:${ct.name}`,
                message: 'Composite types (CREATE TYPE AS) not supported in CockroachDB',
                alternative: 'Use JSONB or separate columns for composite data',
                docsUrl: 'https://www.cockroachlabs.com/docs/stable/postgresql-compatibility',
            });
        }
    }
    if (schema.triggers && schema.triggers.length > 0) {
        for (const trigger of schema.triggers) {
            warnings.push({
                category: 'TRIGGER',
                feature: 'TRIGGER',
                detected: trigger.name,
                location: `trigger:${trigger.name}`,
                message: 'Triggers have limited support in CockroachDB - verify compatibility',
                alternative: 'Consider using Changefeeds for change data capture',
                docsUrl: 'https://www.cockroachlabs.com/docs/stable/triggers',
            });
            if (trigger.columns && trigger.columns.length > 0) {
                errors.push({
                    category: 'TRIGGER',
                    feature: 'UPDATE_OF_COLUMNS',
                    detected: `UPDATE OF ${trigger.columns.join(', ')}`,
                    location: `trigger:${trigger.name}`,
                    message: 'UPDATE OF <columns> not supported in triggers',
                    alternative: 'Use UPDATE trigger without column specification',
                });
            }
            if (trigger.event?.toUpperCase() === 'TRUNCATE') {
                errors.push({
                    category: 'TRIGGER',
                    feature: 'TRUNCATE_EVENT',
                    detected: 'TRUNCATE',
                    location: `trigger:${trigger.name}`,
                    message: 'TRUNCATE event not supported in triggers',
                    alternative: 'Use DELETE trigger or application-level handling',
                });
            }
        }
    }
    if (schema.functions) {
        for (const func of schema.functions) {
            if (func.language?.toLowerCase() === 'plpgsql' && func.body) {
                const bodyErrors = validateSqlForCrdb(func.body, `function:${func.name}`);
                for (const err of bodyErrors) {
                    if (err.category === 'PLPGSQL') {
                        errors.push(err);
                    }
                    else {
                        warnings.push(err);
                    }
                }
            }
        }
    }
    if (schema.tables) {
        for (const table of schema.tables) {
            if (table.columns) {
                for (const col of table.columns) {
                    const typeErrors = validateSqlForCrdb(col.type, `${table.name}.${col.name}`);
                    errors.push(...typeErrors);
                }
            }
        }
    }
    warnings.push({
        category: 'TRANSACTION',
        feature: 'RETRY_LOGIC',
        detected: 'Transaction handling',
        message: exports.TRANSACTION_NOTES.RETRY_REQUIRED,
        alternative: 'Wrap transactions in retry loop catching error code 40001',
        docsUrl: 'https://www.cockroachlabs.com/docs/stable/transaction-retry-error-reference',
    });
    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
}
function formatCrdbErrors(result) {
    const lines = [];
    if (result.errors.length > 0) {
        lines.push('\x1b[31m✗ CockroachDB Compatibility Errors:\x1b[0m\n');
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
        lines.push('\x1b[33m⚠ CockroachDB Compatibility Warnings:\x1b[0m\n');
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
function hasCrdbIncompatibilities(sql) {
    for (const config of Object.values(exports.UNSUPPORTED_DATA_TYPES)) {
        if (config.pattern.test(sql))
            return true;
    }
    for (const [, config] of Object.entries(exports.UNSUPPORTED_SQL)) {
        if (!config.isWarning && config.pattern.test(sql))
            return true;
    }
    return false;
}
