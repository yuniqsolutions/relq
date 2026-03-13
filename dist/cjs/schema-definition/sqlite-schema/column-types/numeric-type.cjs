"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uuid = exports.numericAffinity = void 0;
exports.boolean = boolean;
exports.json = json;
exports.jsonb = jsonb;
const column_builder_1 = require("./column-builder.cjs");
const numericAffinity = (columnName) => (0, column_builder_1.createSQLiteColumnWithName)('NUMERIC', columnName);
exports.numericAffinity = numericAffinity;
function boolean(columnName) {
    const col = (0, column_builder_1.createSQLiteColumnWithName)('INTEGER', columnName);
    col.$mode = 'boolean';
    return col;
}
const uuid = (columnName) => (0, column_builder_1.createSQLiteColumnWithName)('TEXT', columnName);
exports.uuid = uuid;
function json(columnName) {
    const col = (0, column_builder_1.createSQLiteColumnWithName)('TEXT', columnName);
    col.$mode = 'json';
    return col;
}
function jsonb(columnName) {
    const col = (0, column_builder_1.createSQLiteColumnWithName)('BLOB', columnName);
    col.$mode = 'json';
    return col;
}
