"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deserializeRow = deserializeRow;
exports.serializeRow = serializeRow;
exports.buildColumnTypeMap = buildColumnTypeMap;
function deserializeRow(row, columnTypes, coercion) {
    const result = {};
    for (const [key, value] of Object.entries(row)) {
        const dbType = columnTypes.get(key);
        result[key] = dbType ? coercion.deserializeValue(value, dbType) : value;
    }
    return result;
}
function serializeRow(row, columnTypes, coercion) {
    const result = {};
    for (const [key, value] of Object.entries(row)) {
        const dbType = columnTypes.get(key);
        result[key] = dbType ? coercion.serializeValue(value, dbType) : value;
    }
    return result;
}
function buildColumnTypeMap(tableDef) {
    const typeMap = new Map();
    const columns = tableDef.$columns || tableDef;
    for (const [key, colDef] of Object.entries(columns)) {
        if (colDef && typeof colDef === 'object') {
            const col = colDef;
            const sqlType = col.$sqlType || (typeof col.$type === 'string' ? col.$type : undefined);
            if (sqlType) {
                typeMap.set(key, sqlType);
            }
        }
    }
    return typeMap;
}
