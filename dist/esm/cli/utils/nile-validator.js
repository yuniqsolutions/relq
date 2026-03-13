export const NILE_BUILTIN_TABLES = ['tenants', 'users', 'tenant_users'];
export const NILE_PREINSTALLED_EXTENSIONS = [
    'pgvector',
    'postgis',
    'uuid-ossp',
    'pg_trgm',
    'btree_gist',
    'btree_gin',
];
export const UNSUPPORTED_SQL = {
    CREATE_FUNCTION: {
        pattern: /\bCREATE\s+(OR\s+REPLACE\s+)?FUNCTION\b/i,
        alternative: 'Move function logic to application code or serverless functions',
        message: 'User-defined functions not supported in Nile',
    },
    CREATE_PROCEDURE: {
        pattern: /\bCREATE\s+(OR\s+REPLACE\s+)?PROCEDURE\b/i,
        alternative: 'Move procedure logic to application code',
        message: 'Stored procedures not supported in Nile',
    },
    DROP_FUNCTION: {
        pattern: /\bDROP\s+FUNCTION\b/i,
        alternative: 'N/A - functions not supported',
        message: 'User-defined functions not supported in Nile',
    },
    DROP_PROCEDURE: {
        pattern: /\bDROP\s+PROCEDURE\b/i,
        alternative: 'N/A - procedures not supported',
        message: 'Stored procedures not supported in Nile',
    },
    CREATE_TRIGGER: {
        pattern: /\bCREATE\s+(OR\s+REPLACE\s+)?TRIGGER\b/i,
        alternative: 'Move trigger logic to application code or use webhooks',
        message: 'Triggers not supported in Nile',
    },
    DROP_TRIGGER: {
        pattern: /\bDROP\s+TRIGGER\b/i,
        alternative: 'N/A - triggers not supported',
        message: 'Triggers not supported in Nile',
    },
    PLPGSQL: {
        pattern: /\bLANGUAGE\s+plpgsql\b/i,
        alternative: 'Move logic to application code',
        message: 'PL/pgSQL not supported in Nile - no UDFs allowed',
    },
    PLPYTHON: {
        pattern: /\bLANGUAGE\s+plpython/i,
        alternative: 'Use serverless functions (AWS Lambda, Vercel, etc.)',
        message: 'PL/Python not supported',
    },
    PLPERL: {
        pattern: /\bLANGUAGE\s+plperl/i,
        alternative: 'Use serverless functions',
        message: 'PL/Perl not supported',
    },
    LANGUAGE_SQL: {
        pattern: /\bLANGUAGE\s+SQL\b/i,
        alternative: 'Move logic to application code - no UDFs in Nile',
        message: 'SQL functions not supported in Nile - no UDFs allowed',
    },
    DO_BLOCK: {
        pattern: /\bDO\s+\$\$/i,
        alternative: 'Execute statements separately',
        message: 'DO $$ anonymous blocks not supported in Nile',
    },
    CREATE_POLICY: {
        pattern: /\bCREATE\s+POLICY\b/i,
        alternative: 'Use Nile\'s built-in tenant isolation (tenant_id column)',
        message: 'RLS policies not supported - use Nile tenant isolation instead',
    },
    DROP_POLICY: {
        pattern: /\bDROP\s+POLICY\b/i,
        alternative: 'N/A - use Nile tenant isolation',
        message: 'RLS policies not supported',
    },
    ALTER_POLICY: {
        pattern: /\bALTER\s+POLICY\b/i,
        alternative: 'N/A - use Nile tenant isolation',
        message: 'RLS policies not supported',
    },
    CREATE_USER: {
        pattern: /\bCREATE\s+USER\b/i,
        alternative: 'Use Nile Console or SDK for user management',
        message: 'CREATE USER not supported - use Nile Console',
    },
    CREATE_ROLE: {
        pattern: /\bCREATE\s+ROLE\b/i,
        alternative: 'Use Nile Console for role management',
        message: 'CREATE ROLE not supported - use Nile Console',
    },
    CREATE_DATABASE: {
        pattern: /\bCREATE\s+DATABASE\b/i,
        alternative: 'Use Nile Console to create databases',
        message: 'CREATE DATABASE not supported - use Nile Console',
    },
    CREATE_EXTENSION: {
        pattern: /\bCREATE\s+EXTENSION\b/i,
        alternative: 'Skip - extensions are pre-installed in Nile. Just use the functions directly.',
        message: 'CREATE EXTENSION not needed - extensions are pre-installed',
        isWarning: true,
    },
    LISTEN: {
        pattern: /\bLISTEN\b/i,
        alternative: 'Use webhooks or application-layer pub/sub (Pusher, Ably, etc.)',
        message: 'LISTEN not supported in serverless Nile',
    },
    NOTIFY: {
        pattern: /\bNOTIFY\b/i,
        alternative: 'Use webhooks or application-layer pub/sub',
        message: 'NOTIFY not supported in serverless Nile',
    },
    TABLESPACE: {
        pattern: /\bTABLESPACE\b/i,
        alternative: 'Not needed - Nile handles storage automatically',
        message: 'Tablespaces not supported',
        isWarning: true,
    },
};
export const TENANT_WARNINGS = {
    SERIAL_TENANT: {
        pattern: /\bSERIAL\b/i,
        alternative: 'Use UUID DEFAULT gen_random_uuid() for tenant-aware tables',
        message: 'SERIAL not available on tenant-aware tables - sequences are shared-table only',
    },
    BIGSERIAL_TENANT: {
        pattern: /\bBIGSERIAL\b/i,
        alternative: 'Use UUID DEFAULT gen_random_uuid() for tenant-aware tables',
        message: 'BIGSERIAL not available on tenant-aware tables',
    },
    SMALLSERIAL_TENANT: {
        pattern: /\bSMALLSERIAL\b/i,
        alternative: 'Use UUID DEFAULT gen_random_uuid() for tenant-aware tables',
        message: 'SMALLSERIAL not available on tenant-aware tables',
    },
};
export function classifyTable(tableName, columns) {
    const hasTenantId = columns.some(col => col.name.toLowerCase() === 'tenant_id' &&
        col.type.toLowerCase().includes('uuid'));
    return hasTenantId ? 'tenant' : 'shared';
}
export function validateSqlForNile(sql, location) {
    const errors = [];
    for (const [name, config] of Object.entries(UNSUPPORTED_SQL)) {
        if (config.pattern.test(sql)) {
            const match = sql.match(config.pattern);
            let category = 'SYNTAX';
            if (name.includes('TRIGGER'))
                category = 'TRIGGER';
            else if (name.includes('FUNCTION') || name.includes('PROCEDURE') || name.includes('LANGUAGE') || name.includes('DO_BLOCK'))
                category = 'FUNCTION';
            else if (name.includes('POLICY'))
                category = 'TENANT';
            else if (name.includes('USER') || name.includes('ROLE') || name.includes('DATABASE'))
                category = 'DDL';
            else if (name.includes('EXTENSION'))
                category = 'EXTENSION';
            else if (name.includes('LISTEN') || name.includes('NOTIFY'))
                category = 'DML';
            if (config.isWarning)
                continue;
            errors.push({
                category,
                feature: name,
                detected: match?.[0] || name,
                location,
                message: config.message,
                alternative: config.alternative,
                docsUrl: 'https://thenile.dev/docs',
            });
        }
    }
    return errors;
}
export function validateSchemaForNile(schema) {
    const errors = [];
    const warnings = [];
    const tableClassification = new Map();
    if (schema.tables) {
        for (const table of schema.tables) {
            if (table.columns) {
                const classification = classifyTable(table.name, table.columns);
                tableClassification.set(table.name, classification);
            }
        }
    }
    if (schema.triggers && schema.triggers.length > 0) {
        for (const trigger of schema.triggers) {
            errors.push({
                category: 'TRIGGER',
                feature: 'TRIGGER',
                detected: trigger.name,
                location: trigger.table ? `trigger:${trigger.name} on ${trigger.table}` : `trigger:${trigger.name}`,
                message: 'Triggers not supported in Nile',
                alternative: 'Move trigger logic to application code or use webhooks',
                docsUrl: 'https://thenile.dev/docs',
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
                message: 'User-defined functions not supported in Nile',
                alternative: 'Move function logic to application code or serverless functions',
                docsUrl: 'https://thenile.dev/docs',
            });
        }
    }
    if (schema.extensions && schema.extensions.length > 0) {
        for (const ext of schema.extensions) {
            const isPreinstalled = NILE_PREINSTALLED_EXTENSIONS.some(preinstalled => preinstalled.toLowerCase() === ext.toLowerCase());
            if (isPreinstalled) {
                warnings.push({
                    category: 'EXTENSION',
                    feature: 'EXTENSION',
                    detected: ext,
                    location: `extension:${ext}`,
                    message: `CREATE EXTENSION "${ext}" not needed - pre-installed in Nile`,
                    alternative: 'Remove CREATE EXTENSION - just use the functions/types directly',
                });
            }
            else {
                errors.push({
                    category: 'EXTENSION',
                    feature: 'EXTENSION',
                    detected: ext,
                    location: `extension:${ext}`,
                    message: `Extension "${ext}" not available in Nile`,
                    alternative: 'Check Nile documentation for available extensions or use alternative approach',
                });
            }
        }
    }
    if (schema.tables) {
        for (const table of schema.tables) {
            if (NILE_BUILTIN_TABLES.includes(table.name.toLowerCase())) {
                warnings.push({
                    category: 'TENANT',
                    feature: 'BUILTIN_TABLE',
                    detected: table.name,
                    location: `table:${table.name}`,
                    message: `Table "${table.name}" is a Nile built-in table - cannot CREATE/DROP`,
                    alternative: 'Only ALTER TABLE to add extension columns',
                });
                continue;
            }
            const tableType = tableClassification.get(table.name);
            if (tableType === 'tenant' && table.columns) {
                const tenantIdCol = table.columns.find(c => c.name.toLowerCase() === 'tenant_id');
                if (tenantIdCol && !tenantIdCol.type.toLowerCase().includes('uuid')) {
                    errors.push({
                        category: 'TENANT',
                        feature: 'TENANT_ID_TYPE',
                        detected: tenantIdCol.type,
                        location: `${table.name}.tenant_id`,
                        message: 'tenant_id must be UUID type',
                        alternative: 'Change tenant_id column type to UUID',
                    });
                }
                const pk = table.constraints?.find(c => c.type === 'PRIMARY KEY');
                if (pk && pk.columns && !pk.columns.some(col => col.toLowerCase() === 'tenant_id')) {
                    errors.push({
                        category: 'TENANT',
                        feature: 'TENANT_ID_IN_PK',
                        detected: `PRIMARY KEY (${pk.columns.join(', ')})`,
                        location: `table:${table.name}`,
                        message: `tenant_id must be part of PRIMARY KEY for tenant-aware table "${table.name}"`,
                        alternative: `Change to: PRIMARY KEY (tenant_id, ${pk.columns.join(', ')})`,
                    });
                }
                for (const col of table.columns) {
                    const colTypeLower = col.type.toLowerCase();
                    if (colTypeLower.includes('serial')) {
                        warnings.push({
                            category: 'SEQUENCE',
                            feature: 'SERIAL_ON_TENANT',
                            detected: col.type,
                            location: `${table.name}.${col.name}`,
                            message: `${col.type.toUpperCase()} on tenant-aware table - sequences not available`,
                            alternative: 'Use UUID DEFAULT gen_random_uuid() instead',
                        });
                    }
                }
                if (table.constraints) {
                    for (const constraint of table.constraints) {
                        if (constraint.type === 'FOREIGN KEY' && constraint.references) {
                            const refTableType = tableClassification.get(constraint.references.table);
                            if (refTableType === 'shared') {
                                errors.push({
                                    category: 'CONSTRAINT',
                                    feature: 'CROSS_TYPE_FK',
                                    detected: `FK to ${constraint.references.table}`,
                                    location: `table:${table.name}`,
                                    message: `FK from tenant table "${table.name}" to shared table "${constraint.references.table}" not supported`,
                                    alternative: 'Remove FK and implement referential integrity in application code, or make both tables the same type',
                                    docsUrl: 'https://thenile.dev/docs/tenant-virtualization',
                                });
                            }
                        }
                    }
                }
            }
            if (tableType === 'shared' && table.constraints) {
                for (const constraint of table.constraints) {
                    if (constraint.type === 'FOREIGN KEY' && constraint.references) {
                        const refTableType = tableClassification.get(constraint.references.table);
                        if (refTableType === 'tenant') {
                            errors.push({
                                category: 'CONSTRAINT',
                                feature: 'CROSS_TYPE_FK',
                                detected: `FK to ${constraint.references.table}`,
                                location: `table:${table.name}`,
                                message: `FK from shared table "${table.name}" to tenant table "${constraint.references.table}" not supported`,
                                alternative: 'Remove FK and implement referential integrity in application code',
                            });
                        }
                    }
                }
            }
        }
    }
    warnings.push({
        category: 'TRANSACTION',
        feature: 'TRANSACTION_RULES',
        detected: 'Transaction handling',
        message: 'Nile transaction rules: Cannot write to 2+ tenants or mix tenant+shared writes in same transaction',
        alternative: 'Keep transactions within single tenant context or use separate transactions',
        docsUrl: 'https://thenile.dev/docs/tenant-virtualization#transactions',
    });
    return {
        valid: errors.length === 0,
        errors,
        warnings,
        tableClassification,
    };
}
export function validateTenantIdInConstraint(tableName, constraintType, columns, isTenantTable) {
    if (!isTenantTable)
        return null;
    if (constraintType === 'PRIMARY KEY' || constraintType === 'UNIQUE') {
        const hasTenantId = columns.some(col => col.toLowerCase() === 'tenant_id');
        if (!hasTenantId) {
            return {
                category: 'TENANT',
                feature: 'TENANT_ID_IN_CONSTRAINT',
                detected: `${constraintType} (${columns.join(', ')})`,
                location: `table:${tableName}`,
                message: `${constraintType} should include tenant_id for tenant-aware table`,
                alternative: `Add tenant_id: ${constraintType} (tenant_id, ${columns.join(', ')})`,
            };
        }
    }
    return null;
}
export function formatNileErrors(result) {
    const lines = [];
    if (result.tableClassification && result.tableClassification.size > 0) {
        lines.push('\x1b[36mTable Classification:\x1b[0m\n');
        for (const [table, type] of result.tableClassification) {
            const icon = type === 'tenant' ? '🏠' : '🌐';
            const label = type === 'tenant' ? 'tenant-aware' : 'shared';
            lines.push(`  ${icon} ${table}: ${label}`);
        }
        lines.push('');
    }
    if (result.errors.length > 0) {
        lines.push('\x1b[31m✗ Nile Compatibility Errors:\x1b[0m\n');
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
        lines.push('\x1b[33m⚠ Nile Compatibility Warnings:\x1b[0m\n');
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
export function hasNileIncompatibilities(sql) {
    for (const [, config] of Object.entries(UNSUPPORTED_SQL)) {
        if (!config.isWarning && config.pattern.test(sql))
            return true;
    }
    return false;
}
export function filterSqlForNile(sql) {
    const skipped = [];
    const errors = [];
    let filtered = sql;
    const extensionPattern = /CREATE\s+EXTENSION\s+(IF\s+NOT\s+EXISTS\s+)?[\w"']+\s*;?/gi;
    const extensionMatches = sql.match(extensionPattern);
    if (extensionMatches) {
        for (const match of extensionMatches) {
            skipped.push(`Skipped: ${match.trim()} (pre-installed in Nile)`);
        }
        filtered = filtered.replace(extensionPattern, '-- Skipped: Extension pre-installed in Nile');
    }
    if (/CREATE\s+(OR\s+REPLACE\s+)?TRIGGER/i.test(sql)) {
        errors.push('Triggers are not supported in Nile');
    }
    if (/CREATE\s+(OR\s+REPLACE\s+)?FUNCTION/i.test(sql)) {
        errors.push('User-defined functions are not supported in Nile');
    }
    if (/CREATE\s+(OR\s+REPLACE\s+)?PROCEDURE/i.test(sql)) {
        errors.push('Stored procedures are not supported in Nile');
    }
    if (/DO\s+\$\$/i.test(sql)) {
        errors.push('DO $$ blocks are not supported in Nile');
    }
    if (/CREATE\s+POLICY/i.test(sql)) {
        errors.push('Row-Level Security policies are not supported in Nile (use Nile tenant isolation)');
    }
    return { filtered, skipped, errors };
}
