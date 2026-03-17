"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateColumnType = validateColumnType;
exports.validateColumnTypes = validateColumnTypes;
exports.checkTypeSupport = checkTypeSupport;
exports.getAlternative = getAlternative;
exports.getBlockedTypes = getBlockedTypes;
exports.getWarningTypes = getWarningTypes;
const errors_1 = require("./errors.cjs");
const type_mappings_1 = require("./type-mappings.cjs");
function validateColumnType(sqlType, tableName, columnName) {
    const mapping = (0, type_mappings_1.getTypeMapping)(sqlType);
    if (!mapping) {
        return [];
    }
    const location = { tableName, columnName };
    switch (mapping.status) {
        case 'supported':
            return [];
        case 'behavioral-difference':
            if (mapping.errorCode) {
                return [(0, errors_1.createMessage)(mapping.errorCode, location)];
            }
            return [];
        case 'warning':
            if (mapping.errorCode) {
                return [(0, errors_1.createMessage)(mapping.errorCode, location)];
            }
            return [];
        case 'unsupported':
            if (mapping.errorCode) {
                return [(0, errors_1.createMessage)(mapping.errorCode, location)];
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
function validateColumnTypes(columns) {
    const messages = [];
    for (const col of columns) {
        messages.push(...validateColumnType(col.sqlType, col.tableName, col.columnName));
    }
    return messages;
}
function checkTypeSupport(sqlType) {
    const mapping = (0, type_mappings_1.getTypeMapping)(sqlType);
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
function getAlternative(sqlType) {
    const mapping = (0, type_mappings_1.getTypeMapping)(sqlType);
    if (!mapping || mapping.status === 'supported') {
        return null;
    }
    return mapping.alternative ?? null;
}
function getBlockedTypes() {
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
function getWarningTypes() {
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
    return type_mappings_1.CRDB_TYPE_MAP;
}
