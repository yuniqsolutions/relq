import { createFluentGenExpr } from "../column-types/index.js";
export function createColumnRefs(columns) {
    const refs = {};
    for (const key of Object.keys(columns)) {
        const col = columns[key];
        const colName = col.$columnName || key;
        refs[key] = colName;
    }
    return refs;
}
export { createIndexTableRefs } from "./index-builder.js";
export function createGeneratedTableRefs(columns) {
    const refs = {};
    for (const key of Object.keys(columns)) {
        const col = columns[key];
        const colName = col.$columnName || key;
        const expr = createFluentGenExpr(`"${colName}"`);
        expr.__columnName = colName;
        refs[key] = expr;
    }
    return refs;
}
export function createGeneratedAsFactory() {
    return {
        on(column) {
            const columnName = column.__columnName;
            return {
                as(expression) {
                    return {
                        $column: columnName,
                        $expression: expression.$sql,
                        $stored: true,
                    };
                },
            };
        },
    };
}
