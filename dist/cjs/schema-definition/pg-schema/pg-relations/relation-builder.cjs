"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReferenceToBuilder = createReferenceToBuilder;
exports.createFullBuilder = createFullBuilder;
function createColumnRef(tableName, columnName, schemaKey) {
    return {
        $table: tableName,
        $column: columnName,
        $schemaKey: schemaKey,
    };
}
function createTargetColumnRefs(table) {
    const refs = {};
    const actualTableName = table.$name;
    for (const colName of Object.keys(table.$columns)) {
        const colDef = table.$columns[colName];
        const config = colDef?.$config || colDef;
        const actualColName = config?.$sqlName || config?.$columnName || colDef?.$sqlName || colDef?.$columnName || colName;
        refs[colName] = createColumnRef(actualTableName, actualColName, colName);
    }
    return refs;
}
function createReferenceToBuilder(schema, currentTableKey) {
    return new Proxy({}, {
        get(_, targetTableKey) {
            const targetTable = schema[targetTableKey];
            if (!targetTable) {
                throw new Error(`Unknown table: ${targetTableKey}`);
            }
            return (callback) => {
                const targetColRefs = createTargetColumnRefs(targetTable);
                const options = callback(targetColRefs);
                const currentTable = schema[currentTableKey];
                const currentTableName = currentTable?.$name || currentTableKey;
                if (!options.columns) {
                    throw new Error(`FK to '${targetTableKey}' requires 'columns' field. ` +
                        `Use: columns: 'columnName' or columns: ['col1', 'col2']`);
                }
                const columnsArray = Array.isArray(options.columns) ? options.columns : [options.columns];
                const isComposite = columnsArray.length > 1;
                const toSqlColumnName = (tsColName) => {
                    const colDef = currentTable.$columns?.[tsColName];
                    if (colDef) {
                        const config = colDef.$config || colDef;
                        return config.$sqlName || config.$columnName || colDef.$sqlName || colDef.$columnName || tsColName;
                    }
                    return tsColName;
                };
                const sqlColumns = columnsArray.map(toSqlColumnName);
                if (isComposite && !options.references) {
                    throw new Error(`Composite FK (${columnsArray.length} columns) requires 'references' array. ` +
                        `Example: references: [t.col1, t.col2]`);
                }
                let referencesArray;
                if (options.references) {
                    const refs = Array.isArray(options.references) ? options.references : [options.references];
                    if (isComposite && refs.length !== columnsArray.length) {
                        throw new Error(`FK column count mismatch: ${columnsArray.length} source columns but ${refs.length} reference columns. ` +
                            `PostgreSQL requires matching counts.`);
                    }
                    if (!isComposite && Array.isArray(options.references)) {
                        throw new Error(`Single-column FK cannot have array references. ` +
                            `Use: references: t.columnName (not [t.columnName])`);
                    }
                    referencesArray = refs.map((r) => ({
                        table: r.$table,
                        column: r.$column,
                    }));
                }
                if (options.match === 'FULL' && !isComposite) {
                    throw new Error(`MATCH FULL is only valid for composite FK (2+ columns)`);
                }
                return {
                    $type: 'foreignKey',
                    $targetTable: targetTable.$name,
                    $columns: sqlColumns.map(col => ({
                        table: currentTableName,
                        column: col,
                    })),
                    $references: referencesArray,
                    $onDelete: options.onDelete,
                    $onUpdate: options.onUpdate,
                    $match: options.match,
                    $name: options.name,
                    $deferrable: options.deferrable,
                    $initiallyDeferred: options.initiallyDeferred,
                    $trackingId: options.trackingId,
                    $comment: options.comment,
                };
            };
        },
    });
}
function createFullBuilder(schema, currentTableKey) {
    return {
        referenceTo: createReferenceToBuilder(schema, currentTableKey),
    };
}
