"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.blob = blob;
exports.bytea = bytea;
const column_builder_1 = require("./column-builder.cjs");
function blob(columnName) {
    return (0, column_builder_1.createSQLiteColumnWithName)('BLOB', columnName);
}
function bytea(columnName) {
    return (0, column_builder_1.createSQLiteColumnWithName)('BLOB', columnName);
}
