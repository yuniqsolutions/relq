"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createIndexTableRefs = void 0;
exports.createColumnRefs = createColumnRefs;
exports.createGeneratedTableRefs = createGeneratedTableRefs;
exports.createGeneratedAsFactory = createGeneratedAsFactory;
const column_types_1 = require("../column-types/index.cjs");
function createColumnRefs(columns) {
    const refs = {};
    for (const key of Object.keys(columns)) {
        const col = columns[key];
        const colName = col.$columnName || key;
        refs[key] = colName;
    }
    return refs;
}
var index_builder_1 = require("./index-builder.cjs");
Object.defineProperty(exports, "createIndexTableRefs", { enumerable: true, get: function () { return index_builder_1.createIndexTableRefs; } });
function createGeneratedTableRefs(columns) {
    const refs = {};
    for (const key of Object.keys(columns)) {
        const col = columns[key];
        const colName = col.$columnName || key;
        const expr = (0, column_types_1.createFluentGenExpr)(`"${colName}"`);
        expr.__columnName = colName;
        refs[key] = expr;
    }
    return refs;
}
function createGeneratedAsFactory() {
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
