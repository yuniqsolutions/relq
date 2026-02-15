import { NILE_BUILTIN_TABLE_NAMES } from "./table-classifier.js";
export const NILE_BLOCKED_ADMIN_PATTERNS = [
    { pattern: /CREATE\s+(OR\s+REPLACE\s+)?TRIGGER/i, code: 'NILE-TF-001', message: 'Triggers are not supported on Nile' },
    { pattern: /CREATE\s+(OR\s+REPLACE\s+)?FUNCTION/i, code: 'NILE-TF-002', message: 'User-defined functions are not supported on Nile' },
    { pattern: /CREATE\s+(OR\s+REPLACE\s+)?PROCEDURE/i, code: 'NILE-TF-003', message: 'Stored procedures are not supported on Nile' },
    { pattern: /DO\s+\$\$/i, code: 'NILE-TF-004', message: 'Anonymous code blocks (DO $$) are not supported on Nile' },
    { pattern: /LANGUAGE\s+plpgsql/i, code: 'NILE-TF-005', message: 'PL/pgSQL is not available on Nile' },
    { pattern: /CREATE\s+(USER|ROLE)\b/i, code: 'NILE-ADM-001', message: 'User/role management must be done through Nile Console' },
    { pattern: /CREATE\s+DATABASE\b/i, code: 'NILE-ADM-002', message: 'Database creation must be done through Nile Console' },
    { pattern: /\bGRANT\s+/i, code: 'NILE-ADM-003', message: 'Permission management must be done through Nile Console' },
    { pattern: /\bREVOKE\s+/i, code: 'NILE-ADM-003', message: 'Permission management must be done through Nile Console' },
    { pattern: /CREATE\s+POLICY\b/i, code: 'NILE-ADM-004', message: 'Row-Level Security is not supported on Nile. Use SET nile.tenant_id for tenant isolation' },
    { pattern: /ALTER\s+TABLE\s+\S+\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i, code: 'NILE-ADM-004', message: 'Row-Level Security is not supported on Nile. Use SET nile.tenant_id for tenant isolation' },
];
export const NILE_BLOCKED_MISC_FEATURES = new Set([
    'trigger',
    'function',
    'procedure',
    'do_block',
    'plpgsql',
    'create_user',
    'create_role',
    'create_database',
    'grant',
    'revoke',
    'rls',
    'create_policy',
]);
export function validateNileBuiltinTable(input) {
    const messages = [];
    const normalizedName = input.tableName.toLowerCase().trim();
    if (!NILE_BUILTIN_TABLE_NAMES.has(normalizedName)) {
        return messages;
    }
    if (input.operation === 'create') {
        messages.push({
            code: 'NILE-BT-001',
            severity: 'error',
            message: `Table "${input.tableName}" is a Nile built-in table and already exists. Use ALTER TABLE to add extension columns.`,
            alternative: 'Use ALTER TABLE to add custom columns to the built-in table',
            category: 'built-in-table',
            tableName: input.tableName,
        });
    }
    if (input.operation === 'drop') {
        messages.push({
            code: 'NILE-BT-002',
            severity: 'error',
            message: `Table "${input.tableName}" is a Nile built-in table and cannot be dropped.`,
            alternative: 'Remove the DROP TABLE statement for this built-in table',
            category: 'built-in-table',
            tableName: input.tableName,
        });
    }
    if (input.operation === 'alter' && input.isBuiltinColumn) {
        messages.push({
            code: 'NILE-BT-003',
            severity: 'warning',
            message: `Only user-added extension columns can be modified on built-in table "${input.tableName}". Column "${input.columnName}" is a built-in column.`,
            alternative: 'Ensure you are only modifying columns you added, not built-in columns',
            category: 'built-in-table',
            tableName: input.tableName,
            columnName: input.columnName,
        });
    }
    if (input.columnName?.toLowerCase() === 'tenant_id' &&
        input.operation === 'alter') {
        messages.push({
            code: 'NILE-BT-004',
            severity: 'error',
            message: `Cannot drop or rename tenant_id column on table "${input.tableName}". It is required for tenant isolation in Nile.`,
            alternative: 'Keep the tenant_id column as-is. It is managed by Nile.',
            category: 'built-in-table',
            tableName: input.tableName,
            columnName: 'tenant_id',
        });
    }
    return messages;
}
export function validateNileTenantIdProtection(tableName, operation) {
    const verb = operation === 'drop' ? 'drop' : 'rename';
    return [
        {
            code: 'NILE-BT-004',
            severity: 'error',
            message: `Cannot ${verb} tenant_id column on table "${tableName}". It is required for tenant isolation in Nile.`,
            alternative: 'Keep the tenant_id column as-is. It is managed by Nile.',
            category: 'built-in-table',
            tableName,
            columnName: 'tenant_id',
        },
    ];
}
export function validateNileExtensions(sql) {
    const messages = [];
    if (/CREATE\s+EXTENSION/i.test(sql)) {
        messages.push({
            code: 'NILE-EXT-001',
            severity: 'info',
            message: 'CREATE EXTENSION skipped -- extensions are pre-installed in Nile.',
            alternative: 'Remove CREATE EXTENSION statements. Use extension types and functions directly.',
            category: 'extension',
        });
    }
    if (/DROP\s+EXTENSION/i.test(sql)) {
        messages.push({
            code: 'NILE-EXT-002',
            severity: 'warning',
            message: 'DROP EXTENSION skipped. Pre-installed extensions cannot be removed in Nile.',
            alternative: 'Remove DROP EXTENSION statements.',
            category: 'extension',
        });
    }
    return messages;
}
export function validateNileMiscSql(sql) {
    const messages = [];
    const seenCodes = new Set();
    for (const entry of NILE_BLOCKED_ADMIN_PATTERNS) {
        if (entry.pattern.test(sql) && !seenCodes.has(entry.code)) {
            seenCodes.add(entry.code);
            messages.push({
                code: entry.code,
                severity: 'error',
                message: entry.message,
                alternative: 'Move logic to application code or use Nile Console for admin operations',
                category: 'admin',
            });
        }
    }
    if (/CREATE\s+EXTENSION/i.test(sql) && !seenCodes.has('NILE-EXT-001')) {
        seenCodes.add('NILE-EXT-001');
        messages.push({
            code: 'NILE-EXT-001',
            severity: 'info',
            message: 'CREATE EXTENSION skipped -- extensions are pre-installed in Nile.',
            alternative: 'Remove CREATE EXTENSION statements. Use extension types and functions directly.',
            category: 'extension',
        });
    }
    if (/DROP\s+EXTENSION/i.test(sql) && !seenCodes.has('NILE-EXT-002')) {
        seenCodes.add('NILE-EXT-002');
        messages.push({
            code: 'NILE-EXT-002',
            severity: 'warning',
            message: 'DROP EXTENSION skipped. Pre-installed extensions cannot be removed in Nile.',
            alternative: 'Remove DROP EXTENSION statements.',
            category: 'extension',
        });
    }
    return messages;
}
export function validateNileTransactionConcerns(hasTenantTableWrites, hasSharedTableWrites) {
    const messages = [];
    if (hasTenantTableWrites) {
        messages.push({
            code: 'NILE-TX-001',
            severity: 'warning',
            message: 'Writes to tenant tables must be within a single tenant context at runtime.',
            alternative: 'Set nile.tenant_id before writing to tenant tables: SET nile.tenant_id = :tenantId',
            category: 'transaction',
        });
    }
    if (hasTenantTableWrites && hasSharedTableWrites) {
        messages.push({
            code: 'NILE-TX-002',
            severity: 'warning',
            message: 'Nile does not support writing to both tenant and shared tables in the same transaction.',
            alternative: 'Split tenant and shared table writes into separate transactions',
            category: 'transaction',
        });
    }
    messages.push({
        code: 'NILE-TX-003',
        severity: 'info',
        message: 'DDL changes will be applied to all tenants atomically via pg_karnak.',
        alternative: 'No action required. Schema changes propagate automatically.',
        category: 'transaction',
    });
    return messages;
}
