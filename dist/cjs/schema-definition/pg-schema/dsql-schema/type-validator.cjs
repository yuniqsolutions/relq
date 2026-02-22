"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateDsqlColumnType = validateDsqlColumnType;
exports.validateDsqlColumnTypes = validateDsqlColumnTypes;
exports.checkDsqlTypeSupport = checkDsqlTypeSupport;
exports.getDsqlAlternative = getDsqlAlternative;
exports.getDsqlBlockedTypes = getDsqlBlockedTypes;
const errors_1 = require("./errors.cjs");
const type_mappings_1 = require("./type-mappings.cjs");
const limits_1 = require("./limits.cjs");
function validateDsqlColumnType(sqlType, tableName, columnName) {
    const messages = [];
    const location = { tableName, columnName };
    if (/\[\s*\]/.test(sqlType) || /\bARRAY\b/i.test(sqlType)) {
        messages.push((0, errors_1.createDsqlMessage)('DSQL-TYPE-014', location));
        return messages;
    }
    const mapping = (0, type_mappings_1.getDsqlTypeMapping)(sqlType);
    if (!mapping) {
        return [];
    }
    if (mapping.status === 'unsupported' && mapping.errorCode) {
        messages.push((0, errors_1.createDsqlMessage)(mapping.errorCode, location));
        return messages;
    }
    messages.push(...validateTypeLimits(sqlType, tableName, columnName));
    return messages;
}
function validateDsqlColumnTypes(columns) {
    const messages = [];
    for (const col of columns) {
        messages.push(...validateDsqlColumnType(col.sqlType, col.tableName, col.columnName));
    }
    return messages;
}
function checkDsqlTypeSupport(sqlType) {
    if (/\[\s*\]/.test(sqlType) || /\bARRAY\b/i.test(sqlType)) {
        return {
            supported: false,
            status: 'unsupported',
            alternative: 'text() — store as JSON array string, or normalize into separate table',
            errorCode: 'DSQL-TYPE-014',
        };
    }
    const mapping = (0, type_mappings_1.getDsqlTypeMapping)(sqlType);
    if (!mapping) {
        return { supported: true, status: 'unknown' };
    }
    return {
        supported: mapping.status === 'supported',
        status: mapping.status,
        alternative: mapping.alternative,
        note: mapping.note,
        errorCode: mapping.errorCode,
    };
}
function getDsqlAlternative(sqlType) {
    const mapping = (0, type_mappings_1.getDsqlTypeMapping)(sqlType);
    if (!mapping || mapping.status === 'supported') {
        return null;
    }
    return mapping.alternative ?? null;
}
function getDsqlBlockedTypes() {
    const blocked = [];
    const seen = new Set();
    for (const mapping of Object.values(type_mappings_1.DSQL_TYPE_MAP)) {
        if (mapping.status === 'unsupported' && !seen.has(mapping.pgType)) {
            seen.add(mapping.pgType);
            blocked.push(mapping.pgType);
        }
    }
    return blocked;
}
function validateTypeLimits(sqlType, tableName, columnName) {
    const messages = [];
    const location = { tableName, columnName };
    const upper = sqlType.toUpperCase().trim();
    const varcharMatch = upper.match(/^(?:VARCHAR|CHARACTER\s+VARYING)\s*\(\s*(\d+)\s*\)/);
    if (varcharMatch) {
        const len = parseInt(varcharMatch[1], 10);
        if (len > limits_1.DSQL_TYPE_LIMITS.MAX_VARCHAR_LENGTH) {
            messages.push((0, errors_1.createDsqlMessage)('DSQL-LIMIT-001', location));
        }
    }
    const charMatch = upper.match(/^(?:CHAR|CHARACTER|BPCHAR)\s*\(\s*(\d+)\s*\)/);
    if (charMatch) {
        const len = parseInt(charMatch[1], 10);
        if (len > limits_1.DSQL_TYPE_LIMITS.MAX_CHAR_LENGTH) {
            messages.push((0, errors_1.createDsqlMessage)('DSQL-LIMIT-002', location));
        }
    }
    const numericMatch = upper.match(/^(?:NUMERIC|DECIMAL)\s*\(\s*(\d+)\s*(?:,\s*(\d+))?\s*\)/);
    if (numericMatch) {
        const precision = parseInt(numericMatch[1], 10);
        const scale = numericMatch[2] ? parseInt(numericMatch[2], 10) : undefined;
        if (precision > limits_1.DSQL_TYPE_LIMITS.MAX_NUMERIC_PRECISION) {
            messages.push((0, errors_1.createDsqlMessage)('DSQL-LIMIT-003', location));
        }
        if (scale !== undefined && scale > limits_1.DSQL_TYPE_LIMITS.MAX_NUMERIC_SCALE) {
            messages.push((0, errors_1.createDsqlMessage)('DSQL-LIMIT-004', location));
        }
    }
    return messages;
}
