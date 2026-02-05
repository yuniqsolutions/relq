"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.text = text;
exports.varchar = varchar;
exports.char = char;
const column_builder_1 = require("./column-builder.cjs");
function text(columnName) {
    return (0, column_builder_1.createSQLiteColumnWithName)('TEXT', columnName);
}
function varchar(arg1, arg2) {
    let columnName;
    let length;
    if (arg1 === undefined) {
    }
    else if (typeof arg1 === 'number') {
        length = arg1;
    }
    else {
        columnName = arg1;
        if (arg2 !== undefined)
            length = arg2;
    }
    const col = (0, column_builder_1.createSQLiteColumnWithName)('TEXT', columnName);
    if (length !== undefined) {
        col.$length = length;
    }
    return col;
}
function char(arg1, arg2) {
    let columnName;
    let length;
    if (arg1 === undefined) {
        length = 1;
    }
    else if (typeof arg1 === 'number') {
        length = arg1;
    }
    else {
        columnName = arg1;
        length = arg2 ?? 1;
    }
    const col = (0, column_builder_1.createSQLiteColumnWithName)('TEXT', columnName);
    col.$length = length;
    return col;
}
