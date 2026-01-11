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
        const actualColName = colDef.$sqlName || colName;
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
                        return colDef.$sqlName || tsColName;
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
                    $deferrable: options.deferrable,
                    $initiallyDeferred: options.initiallyDeferred,
                    $trackingId: options.trackingId,
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
export function pgRelations(schema, builder) {
    const tables = {};
    for (const tableKey of Object.keys(schema)) {
        tables[tableKey] = (defineRelations) => {
            const fullBuilder = createFullBuilder(schema, tableKey);
            return defineRelations(fullBuilder);
        };
    }
    return builder(tables);
}
export function defineRelations(schema, relationDefs) {
    const result = {};
    for (const [tableKey, defFn] of Object.entries(relationDefs)) {
        if (typeof defFn === 'function') {
            const fullBuilder = createFullBuilder(schema, tableKey);
            result[tableKey] = defFn(fullBuilder);
        }
    }
    return result;
}
export function defineSchema(schema) {
    return schema;
}
export function actionCodeToString(code) {
    switch (code) {
        case 'a': return 'NO ACTION';
        case 'r': return 'RESTRICT';
        case 'c': return 'CASCADE';
        case 'n': return 'SET NULL';
        case 'd': return 'SET DEFAULT';
        default: return 'NO ACTION';
    }
}
export function stringToActionCode(action) {
    switch (action) {
        case 'NO ACTION': return 'a';
        case 'RESTRICT': return 'r';
        case 'CASCADE': return 'c';
        case 'SET NULL': return 'n';
        case 'SET DEFAULT': return 'd';
        default: return 'a';
    }
}
export function matchCodeToString(code) {
    switch (code) {
        case 'f': return 'FULL';
        case 's':
        default: return 'SIMPLE';
    }
}
export function generateReferencesSQL(relation, columnName, columnType = 'uuid') {
    const parts = [`${columnName} ${columnType}`];
    if (relation.$references && relation.$references.length > 0) {
        const refCols = relation.$references.map(r => r.column).join(', ');
        parts.push(`REFERENCES ${relation.$targetTable}(${refCols})`);
    }
    else {
        parts.push(`REFERENCES ${relation.$targetTable}`);
    }
    if (relation.$onDelete && relation.$onDelete !== 'NO ACTION') {
        parts.push(`ON DELETE ${relation.$onDelete}`);
    }
    if (relation.$onUpdate && relation.$onUpdate !== 'NO ACTION') {
        parts.push(`ON UPDATE ${relation.$onUpdate}`);
    }
    if (relation.$match && relation.$match !== 'SIMPLE') {
        parts.push(`MATCH ${relation.$match}`);
    }
    if (relation.$deferrable) {
        parts.push('DEFERRABLE');
        if (relation.$initiallyDeferred) {
            parts.push('INITIALLY DEFERRED');
        }
    }
    return parts.join(' ');
}
