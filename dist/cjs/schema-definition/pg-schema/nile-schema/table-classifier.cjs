"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NILE_BUILTIN_TABLE_NAMES = void 0;
exports.classifyNileTable = classifyNileTable;
exports.classifyNileTables = classifyNileTables;
exports.isNileBuiltinTable = isNileBuiltinTable;
exports.isNileTenantTable = isNileTenantTable;
exports.validateNileTableClassification = validateNileTableClassification;
exports.NILE_BUILTIN_TABLE_NAMES = new Set([
    'tenants',
    'users',
    'tenant_users',
]);
const TENANT_ID_COLUMN = 'tenant_id';
const TENANT_ID_REQUIRED_TYPE = 'uuid';
function classifyNileTable(table) {
    const lowerName = table.name.toLowerCase();
    const lowerColumns = table.columns.map(c => c.toLowerCase());
    const hasTenantId = lowerColumns.includes(TENANT_ID_COLUMN);
    if (exports.NILE_BUILTIN_TABLE_NAMES.has(lowerName)) {
        return {
            tableName: table.name,
            tableType: 'builtin',
            hasTenantId,
        };
    }
    if (hasTenantId) {
        const result = {
            tableName: table.name,
            tableType: 'tenant',
            hasTenantId: true,
        };
        if (table.columnTypes) {
            const tenantIdType = findColumnValue(table.columnTypes, TENANT_ID_COLUMN);
            if (tenantIdType !== undefined) {
                result.tenantIdIsUuid = tenantIdType.toLowerCase() === TENANT_ID_REQUIRED_TYPE;
            }
        }
        if (table.columnNullable) {
            const tenantIdNullable = findColumnValue(table.columnNullable, TENANT_ID_COLUMN);
            if (tenantIdNullable !== undefined) {
                result.tenantIdIsNotNull = !tenantIdNullable;
            }
        }
        return result;
    }
    return {
        tableName: table.name,
        tableType: 'shared',
        hasTenantId: false,
    };
}
function classifyNileTables(tables) {
    const result = new Map();
    for (const table of tables) {
        const classification = classifyNileTable(table);
        result.set(table.name, classification);
    }
    return result;
}
function isNileBuiltinTable(tableName) {
    return exports.NILE_BUILTIN_TABLE_NAMES.has(tableName.toLowerCase());
}
function isNileTenantTable(table) {
    return table.columns.some(c => c.toLowerCase() === TENANT_ID_COLUMN);
}
function validateNileTableClassification(table) {
    const messages = [];
    const classification = classifyNileTable(table);
    if (classification.tableType !== 'tenant') {
        return messages;
    }
    messages.push({
        code: 'NILE-TC-001',
        severity: 'info',
        message: `Table '${table.name}' detected as tenant-aware (contains tenant_id column).`,
        category: 'table-classification',
        tableName: table.name,
        columnName: TENANT_ID_COLUMN,
    });
    if (classification.tenantIdIsUuid === false) {
        const actualType = findColumnValue(table.columnTypes ?? {}, TENANT_ID_COLUMN);
        messages.push({
            code: 'NILE-TC-002',
            severity: 'error',
            message: `Table '${table.name}': tenant_id column must be UUID type, but found '${actualType ?? 'unknown'}'.`,
            alternative: `Change tenant_id column type to uuid().notNull()`,
            category: 'table-classification',
            tableName: table.name,
            columnName: TENANT_ID_COLUMN,
        });
    }
    if (classification.tenantIdIsNotNull === false) {
        messages.push({
            code: 'NILE-TC-003',
            severity: 'error',
            message: `Table '${table.name}': tenant_id column must be NOT NULL, but it is nullable.`,
            alternative: `Add .notNull() to the tenant_id column definition`,
            category: 'table-classification',
            tableName: table.name,
            columnName: TENANT_ID_COLUMN,
        });
    }
    return messages;
}
function findColumnValue(record, key) {
    const lowerKey = key.toLowerCase();
    for (const [k, v] of Object.entries(record)) {
        if (k.toLowerCase() === lowerKey) {
            return v;
        }
    }
    return undefined;
}
