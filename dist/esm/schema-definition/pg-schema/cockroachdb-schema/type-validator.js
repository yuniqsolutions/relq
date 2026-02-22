import { createMessage } from "./errors.js";
import { getTypeMapping, CRDB_TYPE_MAP } from "./type-mappings.js";
export function validateColumnType(sqlType, tableName, columnName) {
    const mapping = getTypeMapping(sqlType);
    if (!mapping) {
        return [];
    }
    const location = { tableName, columnName };
    switch (mapping.status) {
        case 'supported':
            return [];
        case 'behavioral-difference':
            if (mapping.errorCode) {
                return [createMessage(mapping.errorCode, location)];
            }
            return [];
        case 'warning':
            if (mapping.errorCode) {
                return [createMessage(mapping.errorCode, location)];
            }
            return [];
        case 'unsupported':
            if (mapping.errorCode) {
                return [createMessage(mapping.errorCode, location)];
            }
            return [{
                    code: 'CRDB_E_UNKNOWN_TYPE',
                    severity: 'error',
                    message: `${sqlType} is not supported in CockroachDB.`,
                    alternative: mapping.alternative,
                    category: mapping.category,
                    tableName,
                    columnName,
                }];
        default:
            return [];
    }
}
export function validateColumnTypes(columns) {
    const messages = [];
    for (const col of columns) {
        messages.push(...validateColumnType(col.sqlType, col.tableName, col.columnName));
    }
    return messages;
}
export function checkTypeSupport(sqlType) {
    const mapping = getTypeMapping(sqlType);
    if (!mapping) {
        return { supported: true, status: 'unknown' };
    }
    return {
        supported: mapping.status !== 'unsupported',
        status: mapping.status,
        alternative: mapping.alternative,
        note: mapping.note,
        errorCode: mapping.errorCode,
    };
}
export function getAlternative(sqlType) {
    const mapping = getTypeMapping(sqlType);
    if (!mapping || mapping.status === 'supported') {
        return null;
    }
    return mapping.alternative ?? null;
}
export function getBlockedTypes() {
    const blocked = [];
    const seen = new Set();
    for (const mapping of Object.values(getTypeMappingTable())) {
        if (mapping.status === 'unsupported' && !seen.has(mapping.pgType)) {
            seen.add(mapping.pgType);
            blocked.push(mapping.pgType);
        }
    }
    return blocked;
}
export function getWarningTypes() {
    const warnings = [];
    const seen = new Set();
    for (const mapping of Object.values(getTypeMappingTable())) {
        if ((mapping.status === 'warning' || mapping.status === 'behavioral-difference') && !seen.has(mapping.pgType)) {
            seen.add(mapping.pgType);
            warnings.push(mapping.pgType);
        }
    }
    return warnings;
}
function getTypeMappingTable() {
    return CRDB_TYPE_MAP;
}
