"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET_SHARED_TABLES_SQL = exports.GET_TENANT_SCOPED_TABLES_SQL = exports.CHECK_TENANT_CONTEXT_SQL = exports.LIST_TENANTS_SQL = void 0;
exports.generateSetTenantSql = generateSetTenantSql;
exports.generateClearTenantSql = generateClearTenantSql;
exports.generateGetTenantSql = generateGetTenantSql;
exports.isValidUuid = isValidUuid;
exports.isTenantScopedTable = isTenantScopedTable;
exports.isSharedTable = isSharedTable;
function generateSetTenantSql(tenantId) {
    if (!isValidUuid(tenantId)) {
        throw new Error(`Invalid tenant ID format: ${tenantId}. Must be a valid UUID.`);
    }
    const escapedId = tenantId.replace(/'/g, "''");
    return `SET nile.tenant_id = '${escapedId}'`;
}
function generateClearTenantSql() {
    return 'RESET nile.tenant_id';
}
function generateGetTenantSql() {
    return 'SHOW nile.tenant_id';
}
function isValidUuid(value) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
}
function isTenantScopedTable(tableName, columns) {
    return columns.some(col => col.name === 'tenant_id' &&
        (col.type.toLowerCase().includes('uuid') ||
            col.type.toLowerCase().includes('text')));
}
function isSharedTable(tableName, columns) {
    return !isTenantScopedTable(tableName, columns);
}
exports.LIST_TENANTS_SQL = `
SELECT
    id,
    name,
    created_at,
    metadata
FROM tenants
ORDER BY created_at DESC
`;
exports.CHECK_TENANT_CONTEXT_SQL = `
SELECT current_setting('nile.tenant_id', true) AS tenant_id
`;
exports.GET_TENANT_SCOPED_TABLES_SQL = `
SELECT DISTINCT
    tc.table_schema,
    tc.table_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND ccu.table_name = 'tenants'
    AND tc.table_schema NOT IN ('pg_catalog', 'information_schema', 'nile')
ORDER BY tc.table_schema, tc.table_name
`;
exports.GET_SHARED_TABLES_SQL = `
SELECT
    table_schema,
    table_name
FROM information_schema.tables t
WHERE table_schema NOT IN ('pg_catalog', 'information_schema', 'nile')
    AND table_type = 'BASE TABLE'
    AND NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
            AND ccu.table_name = 'tenants'
            AND tc.table_schema = t.table_schema
            AND tc.table_name = t.table_name
    )
ORDER BY table_schema, table_name
`;
