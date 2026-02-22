"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.timestamp = timestamp;
exports.date = date;
exports.time = time;
exports.unixTimestamp = unixTimestamp;
exports.unixTimestampMs = unixTimestampMs;
const column_builder_1 = require("./column-builder.cjs");
function timestamp(columnName) {
    const col = (0, column_builder_1.createSQLiteColumnWithName)('TEXT', columnName);
    col.$mode = 'timestamp';
    return col;
}
function date(columnName) {
    const col = (0, column_builder_1.createSQLiteColumnWithName)('TEXT', columnName);
    col.$mode = 'date';
    return col;
}
function time(columnName) {
    const col = (0, column_builder_1.createSQLiteColumnWithName)('TEXT', columnName);
    col.$mode = 'time';
    return col;
}
function unixTimestamp(columnName) {
    const col = (0, column_builder_1.createSQLiteColumnWithName)('INTEGER', columnName);
    col.$mode = 'timestamp';
    return col;
}
function unixTimestampMs(columnName) {
    const col = (0, column_builder_1.createSQLiteColumnWithName)('INTEGER', columnName);
    col.$mode = 'timestamp_ms';
    return col;
}
