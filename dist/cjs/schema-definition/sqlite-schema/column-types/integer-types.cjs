"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.int2 = exports.int = void 0;
exports.integer = integer;
exports.bigint = bigint;
const column_builder_1 = require("./column-builder.cjs");
function integer(columnName) {
    return (0, column_builder_1.createSQLiteColumnWithName)('INTEGER', columnName);
}
exports.int = integer;
exports.int2 = integer;
function bigint(columnName) {
    const col = (0, column_builder_1.createSQLiteColumnWithName)('INTEGER', columnName);
    col.$mode = 'bigint';
    return col;
}
