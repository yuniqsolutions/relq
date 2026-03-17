import { serializeValue, deserializeValue } from "../../utils/type-coercion.js";
export function buildColumnMappings(schema, mappings, debugLog) {
    if (!schema || typeof schema !== 'object')
        return;
    const tables = schema.tables || schema;
    for (const [tableName, tableDef] of Object.entries(tables)) {
        if (!tableDef || typeof tableDef !== 'object')
            continue;
        const columns = tableDef.$columns;
        if (!columns || typeof columns !== 'object')
            continue;
        const propToDb = new Map();
        const dbToProp = new Map();
        const propToType = new Map();
        const propToCheckValues = new Map();
        const propToValidate = new Map();
        const propToFields = new Map();
        for (const [propName, colDef] of Object.entries(columns)) {
            const dbColName = colDef?.$columnName ?? propName;
            const colType = colDef?.$sqlType || (typeof colDef?.$type === 'string' ? colDef.$type : undefined) || 'TEXT';
            propToDb.set(propName, dbColName);
            dbToProp.set(dbColName, propName);
            propToType.set(propName, colType);
            if (debugLog) {
                debugLog(`buildColumnMappings: ${tableName}.${propName} -> type=${colType}, $validate=${!!colDef?.$validate}, $fields=${!!colDef?.$fields}, $checkValues=${!!colDef?.$checkValues}`);
            }
            if (colDef?.$checkValues && Array.isArray(colDef.$checkValues)) {
                propToCheckValues.set(propName, colDef.$checkValues);
            }
            if (colDef?.$validate && typeof colDef.$validate === 'function') {
                propToValidate.set(propName, colDef.$validate);
            }
            if (colDef?.$fields && typeof colDef.$fields === 'object') {
                propToFields.set(propName, colDef.$fields);
            }
        }
        const dbTableName = tableDef.$name ?? tableName;
        mappings.set(dbTableName, {
            propToDb,
            dbToProp,
            propToType,
            propToCheckValues,
            propToValidate,
            propToFields
        });
    }
}
export function transformToDbColumns(tableName, data, mappings) {
    const mapping = mappings.get(tableName);
    if (!mapping)
        return data;
    const result = {};
    for (const [key, value] of Object.entries(data)) {
        const dbColName = mapping.propToDb.get(key) ?? key;
        const colType = mapping.propToType.get(key);
        if (colType && typeof colType === 'string') {
            result[dbColName] = serializeValue(value, colType);
        }
        else {
            result[dbColName] = value;
        }
    }
    return result;
}
export function transformFromDbColumns(tableName, data, mappings) {
    const mapping = mappings.get(tableName);
    if (!mapping)
        return data;
    const result = {};
    for (const [key, value] of Object.entries(data)) {
        const propName = mapping.dbToProp.get(key) ?? key;
        const colType = mapping.propToType.get(propName);
        if (colType && typeof colType === 'string') {
            result[propName] = deserializeValue(value, colType);
        }
        else {
            result[propName] = value;
        }
    }
    return result;
}
export function transformResultsFromDb(tableName, rows, mappings) {
    const mapping = mappings.get(tableName);
    if (!mapping)
        return rows;
    return rows.map(row => transformFromDbColumns(tableName, row, mappings));
}
export function hasColumnMapping(mappings) {
    return mappings.size > 0;
}
