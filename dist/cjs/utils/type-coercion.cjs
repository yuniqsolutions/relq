"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deserializeValue = deserializeValue;
exports.deserializeRow = deserializeRow;
exports.deserializeRows = deserializeRows;
exports.serializeValue = serializeValue;
exports.serializeRow = serializeRow;
exports.extractSchemaColumns = extractSchemaColumns;
const BIGINT_TYPES = new Set(['BIGINT', 'INT8', 'BIGSERIAL', 'SERIAL8']);
const DATE_TYPES = new Set(['TIMESTAMP', 'TIMESTAMPTZ', 'DATE', 'TIME', 'TIMETZ']);
const JSON_TYPES = new Set(['JSON', 'JSONB']);
function deserializeValue(value, pgType) {
    if (value === null || value === undefined) {
        return value;
    }
    const upperType = pgType.toUpperCase();
    if (BIGINT_TYPES.has(upperType)) {
        if (typeof value === 'string') {
            return BigInt(value);
        }
        if (typeof value === 'number') {
            return BigInt(value);
        }
        return value;
    }
    if (DATE_TYPES.has(upperType) || upperType.startsWith('TIMESTAMP')) {
        if (value instanceof Date) {
            return value;
        }
        if (typeof value === 'string' || typeof value === 'number') {
            return new Date(value);
        }
        return value;
    }
    if (JSON_TYPES.has(upperType)) {
        if (typeof value === 'string') {
            try {
                return JSON.parse(value);
            }
            catch {
                return value;
            }
        }
        return value;
    }
    if (upperType === 'BOOLEAN' || upperType === 'BOOL') {
        if (typeof value === 'string') {
            return value.toLowerCase() === 'true' || value === 't' || value === '1';
        }
        return Boolean(value);
    }
    return value;
}
function deserializeRow(row, schema) {
    const result = {};
    const columnMap = new Map();
    for (const [key, config] of Object.entries(schema)) {
        const dbColumnName = config.$columnName || key;
        const sqlType = config.$sqlType || (typeof config.$type === 'string' ? config.$type : 'TEXT');
        columnMap.set(dbColumnName, { key, type: sqlType });
    }
    for (const [dbColumn, value] of Object.entries(row)) {
        const mapping = columnMap.get(dbColumn);
        if (mapping) {
            result[mapping.key] = deserializeValue(value, mapping.type);
        }
        else {
            result[dbColumn] = value;
        }
    }
    return result;
}
function deserializeRows(rows, schema) {
    return rows.map(row => deserializeRow(row, schema));
}
function serializeValue(value, pgType) {
    if (value === null || value === undefined) {
        return value;
    }
    const upperType = pgType.toUpperCase();
    if (BIGINT_TYPES.has(upperType)) {
        if (typeof value === 'bigint') {
            return value.toString();
        }
        return value;
    }
    if (DATE_TYPES.has(upperType) || upperType.startsWith('TIMESTAMP')) {
        if (value instanceof Date) {
            return value.toISOString();
        }
        return value;
    }
    if (JSON_TYPES.has(upperType)) {
        if (typeof value === 'object' && value !== null) {
            return JSON.stringify(value);
        }
        return value;
    }
    return value;
}
function serializeRow(row, schema) {
    const result = {};
    for (const [key, value] of Object.entries(row)) {
        const config = schema[key];
        if (config) {
            const sqlType = config.$sqlType || (typeof config.$type === 'string' ? config.$type : 'TEXT');
            result[key] = serializeValue(value, sqlType);
        }
        else {
            result[key] = value;
        }
    }
    return result;
}
function extractSchemaColumns(tableDefinition) {
    if (tableDefinition && tableDefinition.$columns) {
        return tableDefinition.$columns;
    }
    return null;
}
