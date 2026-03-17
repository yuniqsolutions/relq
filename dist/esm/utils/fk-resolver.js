export class ForeignKeyResolutionError extends Error {
    fromTable;
    toTable;
    constructor(fromTable, toTable, message) {
        super(message || `No foreign key relationship found between "${fromTable}" and "${toTable}"`);
        this.fromTable = fromTable;
        this.toTable = toTable;
        this.name = 'ForeignKeyResolutionError';
    }
}
function isArrayFormat(tableRelations) {
    return Array.isArray(tableRelations);
}
function* iterateForeignKeys(tableRelations) {
    if (!tableRelations)
        return;
    if (isArrayFormat(tableRelations)) {
        for (const relationDef of tableRelations) {
            if (relationDef.$type === 'foreignKey' && relationDef.$columns?.length > 0) {
                const columnKey = relationDef.$columns[0].column;
                yield [columnKey, relationDef];
            }
        }
    }
    else {
        for (const [columnKey, relationDef] of Object.entries(tableRelations)) {
            yield [columnKey, relationDef];
        }
    }
}
export function resolveForeignKey(relations, schema, fromTableKey, toTableKey) {
    if (!relations) {
        return null;
    }
    const fromTableDef = schema[fromTableKey];
    const toTableDef = schema[toTableKey];
    if (!fromTableDef || !toTableDef) {
        return null;
    }
    const fromTableName = fromTableDef.$name || fromTableKey;
    const toTableName = toTableDef.$name || toTableKey;
    const fromTableRelations = relations[fromTableKey];
    if (fromTableRelations) {
        for (const [columnKey, relationDef] of Object.entries(fromTableRelations)) {
            if (relationDef.$type === 'foreignKey' && relationDef.$targetTable === toTableName) {
                const fromColumn = getSourceColumnName(fromTableDef, columnKey, relationDef);
                const toColumn = getTargetColumnName(relationDef, toTableDef);
                return {
                    fromTable: fromTableName,
                    fromColumn,
                    toTable: toTableName,
                    toColumn,
                    direction: 'forward'
                };
            }
        }
    }
    const toTableRelations = relations[toTableKey];
    if (toTableRelations) {
        for (const [columnKey, relationDef] of Object.entries(toTableRelations)) {
            if (relationDef.$type === 'foreignKey' && relationDef.$targetTable === fromTableName) {
                const toColumn = getSourceColumnName(toTableDef, columnKey, relationDef);
                const fromColumn = getTargetColumnName(relationDef, fromTableDef);
                return {
                    fromTable: fromTableName,
                    fromColumn,
                    toTable: toTableName,
                    toColumn,
                    direction: 'reverse'
                };
            }
        }
    }
    return null;
}
export function resolveForeignKeyOrThrow(relations, schema, fromTableKey, toTableKey) {
    const result = resolveForeignKey(relations, schema, fromTableKey, toTableKey);
    if (!result) {
        const availableRelations = getAvailableRelations(relations, fromTableKey);
        let message = `No foreign key relationship found between "${fromTableKey}" and "${toTableKey}".`;
        if (availableRelations.length > 0) {
            message += ` Available relations from "${fromTableKey}": ${availableRelations.join(', ')}.`;
        }
        else {
            message += ` No relations defined for "${fromTableKey}".`;
        }
        message += ' Use an explicit join condition instead.';
        throw new ForeignKeyResolutionError(fromTableKey, toTableKey, message);
    }
    return result;
}
export function getAvailableRelations(relations, tableKey) {
    if (!relations) {
        return [];
    }
    const tableRelations = relations[tableKey];
    if (!tableRelations) {
        return [];
    }
    return Object.entries(tableRelations)
        .filter(([_, def]) => def.$type === 'foreignKey')
        .map(([key, def]) => `${key} → ${def.$targetTable}`);
}
export function getAllForeignKeys(relations, schema, tableKey) {
    if (!relations) {
        return [];
    }
    const results = [];
    const tableDef = schema[tableKey];
    if (!tableDef) {
        return [];
    }
    const tableName = tableDef.$name || tableKey;
    const tableRelations = relations[tableKey];
    if (tableRelations) {
        for (const [columnKey, relationDef] of Object.entries(tableRelations)) {
            if (relationDef.$type === 'foreignKey') {
                const targetTableKey = findTableKeyByName(schema, relationDef.$targetTable);
                const targetTableDef = targetTableKey ? schema[targetTableKey] : null;
                results.push({
                    fromTable: tableName,
                    fromColumn: getSourceColumnName(tableDef, columnKey, relationDef),
                    toTable: relationDef.$targetTable,
                    toColumn: getTargetColumnName(relationDef, targetTableDef),
                    direction: 'forward'
                });
            }
        }
    }
    for (const [otherTableKey, otherRelations] of Object.entries(relations)) {
        if (otherTableKey === tableKey)
            continue;
        for (const [columnKey, relationDef] of Object.entries(otherRelations)) {
            if (relationDef.$type === 'foreignKey' && relationDef.$targetTable === tableName) {
                const otherTableDef = schema[otherTableKey];
                results.push({
                    fromTable: tableName,
                    fromColumn: getTargetColumnName(relationDef, tableDef),
                    toTable: otherTableDef?.$name || otherTableKey,
                    toColumn: getSourceColumnName(otherTableDef, columnKey, relationDef),
                    direction: 'reverse'
                });
            }
        }
    }
    return results;
}
function getSourceColumnName(tableDef, columnKey, relationDef) {
    const colKey = (relationDef.$columns && relationDef.$columns.length > 0)
        ? relationDef.$columns[0].column
        : columnKey;
    if (tableDef && tableDef.$columns && tableDef.$columns[colKey]) {
        const colDef = tableDef.$columns[colKey];
        return colDef.$columnName || colKey;
    }
    return camelToSnake(colKey);
}
function getTargetColumnName(relationDef, targetTableDef) {
    const colKey = (relationDef.$references && relationDef.$references.length > 0)
        ? relationDef.$references[0].column
        : 'id';
    if (targetTableDef && targetTableDef.$columns && targetTableDef.$columns[colKey]) {
        const colDef = targetTableDef.$columns[colKey];
        return colDef.$columnName || colKey;
    }
    return colKey;
}
function findTableKeyByName(schema, tableName) {
    for (const [key, def] of Object.entries(schema)) {
        if (def.$name === tableName || key === tableName) {
            return key;
        }
    }
    return null;
}
function camelToSnake(str) {
    return str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
}
