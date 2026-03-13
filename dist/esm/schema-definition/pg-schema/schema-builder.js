import { defineTable } from "./table-definition/index.js";
function tableInput(name, columns, options) {
    return {
        $tableName: name,
        $columns: columns,
        $options: options,
    };
}
export const t = {
    table: tableInput,
};
function createTableProxy(name, columns, tableDef) {
    const proxy = {
        $name: name,
        $def: tableDef,
    };
    for (const [colKey, colDef] of Object.entries(columns)) {
        const config = colDef.$config || colDef;
        const sqlName = config.$sqlName || config.$columnName || colKey;
        const colType = config.$sqlType || (typeof config.$type === 'string' ? config.$type : undefined) || 'unknown';
        proxy[colKey] = {
            $table: name,
            $column: sqlName,
            $type: colType,
        };
    }
    return proxy;
}
export function createSchema(tables) {
    const schema = {};
    for (const [key, tableInput] of Object.entries(tables)) {
        const { $tableName, $columns, $options } = tableInput;
        const tableDef = defineTable($tableName, $columns, $options);
        const proxy = createTableProxy($tableName, $columns, tableDef);
        schema[key] = proxy;
    }
    return schema;
}
