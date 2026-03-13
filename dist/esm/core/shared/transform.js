export function deserializeRow(row, columnTypes, coercion) {
    const result = {};
    for (const [key, value] of Object.entries(row)) {
        const dbType = columnTypes.get(key);
        result[key] = dbType ? coercion.deserializeValue(value, dbType) : value;
    }
    return result;
}
export function serializeRow(row, columnTypes, coercion) {
    const result = {};
    for (const [key, value] of Object.entries(row)) {
        const dbType = columnTypes.get(key);
        result[key] = dbType ? coercion.serializeValue(value, dbType) : value;
    }
    return result;
}
export function buildColumnTypeMap(tableDef) {
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
