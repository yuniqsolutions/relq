"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.numeric = exports.doublePrecision = exports.double = exports.float = void 0;
exports.real = real;
exports.decimal = decimal;
const column_builder_1 = require("./column-builder.cjs");
function real(columnName) {
    return (0, column_builder_1.createSQLiteColumnWithName)('REAL', columnName);
}
exports.float = real;
exports.double = real;
exports.doublePrecision = real;
function decimal(columnNameOrPrecision, scaleOrOptions) {
    let columnName;
    let precision;
    let scale;
    if (typeof columnNameOrPrecision === 'string') {
        columnName = columnNameOrPrecision;
        if (scaleOrOptions && typeof scaleOrOptions === 'object') {
            precision = scaleOrOptions.precision;
            scale = scaleOrOptions.scale;
        }
    }
    else if (typeof columnNameOrPrecision === 'number') {
        precision = columnNameOrPrecision;
        if (typeof scaleOrOptions === 'number') {
            scale = scaleOrOptions;
        }
    }
    const col = (0, column_builder_1.createSQLiteColumnWithName)('REAL', columnName);
    if (precision !== undefined) {
        col.$precision = precision;
    }
    if (scale !== undefined) {
        col.$scale = scale;
    }
    return col;
}
exports.numeric = decimal;
