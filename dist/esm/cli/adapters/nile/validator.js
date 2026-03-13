import { NILE_UNSUPPORTED_OPERATIONS, NILE_RESERVED_TABLES, NILE_RESERVED_SCHEMAS, } from "./features.js";
export function validateSchemaForNile(schema) {
    const issues = [];
    for (const table of schema.tables) {
        issues.push(...validateTableForNile(table));
    }
    if (schema.triggers) {
        for (const trigger of schema.triggers) {
            if (trigger.functionName) {
                issues.push({
                    severity: 'info',
                    category: 'TRIGGER',
                    feature: 'trigger',
                    location: `${trigger.schema}.${trigger.tableName}.${trigger.name}`,
                    message: `Trigger '${trigger.name}' should not use LISTEN/NOTIFY in Nile`,
                    alternative: 'Use webhooks or polling for real-time notifications',
                });
            }
        }
    }
    if (schema.functions) {
        for (const func of schema.functions) {
            if (func.definition) {
                const funcIssues = validateFunctionForNile(func.definition, `${func.schema}.${func.name}`);
                issues.push(...funcIssues);
            }
        }
    }
    const errors = issues.filter(i => i.severity === 'error').length;
    const warnings = issues.filter(i => i.severity === 'warning').length;
    const info = issues.filter(i => i.severity === 'info').length;
    return {
        valid: errors === 0,
        issues,
        summary: { errors, warnings, info },
    };
}
export function validateTableForNile(table) {
    const issues = [];
    const location = `${table.schema}.${table.name}`;
    if (NILE_RESERVED_TABLES.includes(table.name.toLowerCase())) {
        issues.push({
            severity: 'error',
            category: 'CONSTRAINT',
            feature: 'reserved_table',
            location,
            message: `Table '${table.name}' uses a reserved Nile table name`,
            alternative: `Choose a different table name. '${table.name}' is managed by Nile.`,
        });
    }
    if (NILE_RESERVED_SCHEMAS.includes(table.schema.toLowerCase())) {
        issues.push({
            severity: 'error',
            category: 'CONSTRAINT',
            feature: 'reserved_schema',
            location,
            message: `Schema '${table.schema}' is reserved by Nile`,
            alternative: 'Use a different schema name, such as \'public\' or a custom schema.',
        });
    }
    const hasTenantId = table.columns.some(col => col.name === 'tenant_id');
    if (!hasTenantId && !isLikelySharedTable(table.name)) {
        issues.push({
            severity: 'warning',
            category: 'FEATURE',
            feature: 'tenant_isolation',
            location,
            message: `Table '${table.name}' does not have a tenant_id column`,
            alternative: 'Add tenant_id column with FK to tenants.id for tenant isolation, or mark as shared table.',
        });
    }
    if (hasTenantId) {
        const tenantIdCol = table.columns.find(col => col.name === 'tenant_id');
        if (tenantIdCol) {
            const type = tenantIdCol.type.toLowerCase();
            if (!type.includes('uuid')) {
                issues.push({
                    severity: 'warning',
                    category: 'DATA_TYPE',
                    feature: 'tenant_id_type',
                    location: `${location}.tenant_id`,
                    message: `tenant_id column should be UUID type, found '${tenantIdCol.type}'`,
                    alternative: 'Use UUID type for tenant_id to match Nile\'s tenants table',
                });
            }
        }
    }
    if (table.type === 'foreign_table') {
        issues.push({
            severity: 'error',
            category: 'FEATURE',
            feature: 'foreign_tables',
            location,
            message: 'Foreign tables are not supported in Nile',
            alternative: 'Use regular tables or views with appropriate data synchronization',
        });
    }
    return issues;
}
export function validateSqlForNile(sql) {
    const issues = [];
    const upperSql = sql.toUpperCase();
    for (const operation of NILE_UNSUPPORTED_OPERATIONS) {
        if (upperSql.includes(operation)) {
            const alternative = getAlternativeForOperation(operation);
            issues.push({
                severity: 'error',
                category: 'FEATURE',
                feature: operation.toLowerCase().replace(' ', '_'),
                message: `${operation} is not supported in Nile`,
                alternative,
            });
        }
    }
    if (upperSql.includes('PG_NOTIFY')) {
        issues.push({
            severity: 'error',
            category: 'FUNCTION',
            feature: 'pg_notify',
            message: 'pg_notify() function is not supported in Nile',
            alternative: 'Use webhooks or external message queues for notifications',
        });
    }
    if (upperSql.includes('CREATE PUBLICATION') || upperSql.includes('CREATE SUBSCRIPTION')) {
        issues.push({
            severity: 'error',
            category: 'FEATURE',
            feature: 'logical_replication',
            message: 'Logical replication is not supported in Nile',
            alternative: 'Use Nile\'s built-in replication or export/import for data sync',
        });
    }
    const errors = issues.filter(i => i.severity === 'error').length;
    const warnings = issues.filter(i => i.severity === 'warning').length;
    const info = issues.filter(i => i.severity === 'info').length;
    return {
        valid: errors === 0,
        issues,
        summary: { errors, warnings, info },
    };
}
function validateFunctionForNile(definition, location) {
    const issues = [];
    const upperDef = definition.toUpperCase();
    if (upperDef.includes('LISTEN') || upperDef.includes('NOTIFY')) {
        issues.push({
            severity: 'error',
            category: 'FUNCTION',
            feature: 'listen_notify',
            location,
            message: 'Function uses LISTEN/NOTIFY which is not supported in Nile',
            alternative: 'Use webhooks or external message queues for notifications',
        });
    }
    if (upperDef.includes('PG_NOTIFY')) {
        issues.push({
            severity: 'error',
            category: 'FUNCTION',
            feature: 'pg_notify',
            location,
            message: 'Function uses pg_notify() which is not supported in Nile',
            alternative: 'Use webhooks or external message queues for notifications',
        });
    }
    return issues;
}
function isLikelySharedTable(tableName) {
    const sharedPatterns = [
        'config',
        'settings',
        'lookup',
        'reference',
        'static',
        'global',
        'shared',
        'system',
        'metadata',
    ];
    const lowerName = tableName.toLowerCase();
    return sharedPatterns.some(pattern => lowerName.includes(pattern));
}
function getAlternativeForOperation(operation) {
    const alternatives = {
        'LISTEN': 'Use webhooks or polling for real-time updates',
        'NOTIFY': 'Use webhooks or external message queues (e.g., Redis, SQS)',
        'CREATE PUBLICATION': 'Use Nile\'s built-in data replication features',
        'CREATE SUBSCRIPTION': 'Use Nile\'s built-in data replication features',
        'ALTER SYSTEM': 'Database configuration is managed by Nile',
    };
    return alternatives[operation] || 'This operation is not available in Nile';
}
export function isTypeSupported(type) {
    return true;
}
export function getAlternative(feature) {
    const alternatives = {
        'listen': 'Use webhooks or polling',
        'notify': 'Use webhooks or external message queues',
        'pg_notify': 'Use webhooks or external message queues',
        'logical_replication': 'Use Nile\'s built-in replication',
        'foreign_data_wrapper': 'Use regular tables with data sync',
        'foreign_tables': 'Use regular tables with data sync',
    };
    return alternatives[feature.toLowerCase()];
}
