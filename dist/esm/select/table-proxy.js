export function isColumnRef(value) {
    return (typeof value === 'object' &&
        value !== null &&
        '$table' in value &&
        '$alias' in value &&
        '$column' in value &&
        '$sqlColumn' in value);
}
export function createTableProxy(tableName, alias, tableSchema) {
    return new Proxy({}, {
        get(_, prop) {
            if (typeof prop === 'symbol') {
                return undefined;
            }
            const columns = tableSchema?.$columns || tableSchema;
            const columnDef = columns?.[prop];
            let sqlColumn;
            if (columnDef) {
                sqlColumn = columnDef.$sqlName || columnDef.$name || camelToSnake(prop);
            }
            else {
                sqlColumn = camelToSnake(prop);
            }
            return {
                $table: tableName,
                $alias: alias,
                $column: prop,
                $sqlColumn: sqlColumn,
                $type: undefined
            };
        },
        has(_, prop) {
            if (typeof prop === 'symbol')
                return false;
            const columns = tableSchema?.$columns || tableSchema;
            return columns ? prop in columns : true;
        },
        ownKeys(_) {
            const columns = tableSchema?.$columns || tableSchema;
            return columns ? Object.keys(columns) : [];
        },
        getOwnPropertyDescriptor(_, prop) {
            if (typeof prop === 'symbol')
                return undefined;
            const columns = tableSchema?.$columns || tableSchema;
            if (columns && prop in columns) {
                const columnDef = columns[prop];
                const sqlColumn = columnDef?.$sqlName || columnDef?.$name || camelToSnake(prop);
                return {
                    enumerable: true,
                    configurable: true,
                    value: {
                        $table: tableName,
                        $alias: alias,
                        $column: prop,
                        $sqlColumn: sqlColumn,
                        $type: undefined
                    }
                };
            }
            return undefined;
        }
    });
}
export function createJoinCallbackParams(leftTableKey, leftAlias, leftTableDef, rightTableKey, rightAlias, rightTableDef) {
    const leftTableName = leftTableDef?.$name || leftTableKey;
    const rightTableName = rightTableDef?.$name || rightTableKey;
    return {
        leftProxy: createTableProxy(leftTableName, leftAlias, leftTableDef),
        rightProxy: createTableProxy(rightTableName, rightAlias, rightTableDef),
        leftTableName,
        rightTableName
    };
}
function camelToSnake(str) {
    return str
        .replace(/([A-Z])/g, '_$1')
        .toLowerCase()
        .replace(/^_/, '');
}
export function columnRefToSQL(ref) {
    return `"${ref.$alias}"."${ref.$sqlColumn}"`;
}
export function columnRefToSQLUnqualified(ref) {
    return `"${ref.$sqlColumn}"`;
}
export function columnRefsEqual(a, b) {
    return a.$table === b.$table &&
        a.$alias === b.$alias &&
        a.$sqlColumn === b.$sqlColumn;
}
