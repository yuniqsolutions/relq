import { createDsqlMessage } from "./errors.js";
import { getDsqlTypeMapping, DSQL_TYPE_MAP } from "./type-mappings.js";
import { DSQL_TYPE_LIMITS } from "./limits.js";
export function validateDsqlColumnType(sqlType, tableName, columnName) {
    const messages = [];
    const location = { tableName, columnName };
    if (/\[\s*\]/.test(sqlType) || /\bARRAY\b/i.test(sqlType)) {
        messages.push(createDsqlMessage('DSQL-TYPE-014', location));
        return messages;
    }
    const mapping = getDsqlTypeMapping(sqlType);
    if (!mapping) {
        return [];
    }
    if (mapping.status === 'unsupported' && mapping.errorCode) {
        messages.push(createDsqlMessage(mapping.errorCode, location));
        return messages;
    }
    messages.push(...validateTypeLimits(sqlType, tableName, columnName));
    return messages;
}
export function validateDsqlColumnTypes(columns) {
    const messages = [];
    for (const col of columns) {
        messages.push(...validateDsqlColumnType(col.sqlType, col.tableName, col.columnName));
    }
    return messages;
}
export function checkDsqlTypeSupport(sqlType) {
    if (/\[\s*\]/.test(sqlType) || /\bARRAY\b/i.test(sqlType)) {
        return {
            supported: false,
            status: 'unsupported',
            alternative: 'text() — store as JSON array string, or normalize into separate table',
            errorCode: 'DSQL-TYPE-014',
        };
    }
    const mapping = getDsqlTypeMapping(sqlType);
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
export function getDsqlAlternative(sqlType) {
    const mapping = getDsqlTypeMapping(sqlType);
    if (!mapping || mapping.status === 'supported') {
        return null;
    }
    return mapping.alternative ?? null;
}
export function getDsqlBlockedTypes() {
    const blocked = [];
    const seen = new Set();
    for (const mapping of Object.values(DSQL_TYPE_MAP)) {
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
        if (len > DSQL_TYPE_LIMITS.MAX_VARCHAR_LENGTH) {
            messages.push(createDsqlMessage('DSQL-LIMIT-001', location));
        }
    }
    const charMatch = upper.match(/^(?:CHAR|CHARACTER|BPCHAR)\s*\(\s*(\d+)\s*\)/);
    if (charMatch) {
        const len = parseInt(charMatch[1], 10);
        if (len > DSQL_TYPE_LIMITS.MAX_CHAR_LENGTH) {
            messages.push(createDsqlMessage('DSQL-LIMIT-002', location));
        }
    }
    const numericMatch = upper.match(/^(?:NUMERIC|DECIMAL)\s*\(\s*(\d+)\s*(?:,\s*(\d+))?\s*\)/);
    if (numericMatch) {
        const precision = parseInt(numericMatch[1], 10);
        const scale = numericMatch[2] ? parseInt(numericMatch[2], 10) : undefined;
        if (precision > DSQL_TYPE_LIMITS.MAX_NUMERIC_PRECISION) {
            messages.push(createDsqlMessage('DSQL-LIMIT-003', location));
        }
        if (scale !== undefined && scale > DSQL_TYPE_LIMITS.MAX_NUMERIC_SCALE) {
            messages.push(createDsqlMessage('DSQL-LIMIT-004', location));
        }
    }
    return messages;
}
