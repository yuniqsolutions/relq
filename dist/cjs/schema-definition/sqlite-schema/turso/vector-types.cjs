"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vectorF32 = vectorF32;
exports.vectorF64 = vectorF64;
exports.vectorF16 = vectorF16;
exports.vectorBF16 = vectorBF16;
exports.vectorF8 = vectorF8;
exports.vectorBinary = vectorBinary;
const column_builder_1 = require("../column-types/column-builder.cjs");
function createVectorColumn(vectorType, dimensions, columnName) {
    const sqlType = `${vectorType}(${dimensions})`;
    const col = (0, column_builder_1.createSQLiteColumnWithName)(sqlType, columnName);
    col.$mode = 'vector';
    col.$dimensions = dimensions;
    col.$vectorType = vectorType;
    return col;
}
function vectorF32(dimensions, columnName) {
    return createVectorColumn('F32_BLOB', dimensions, columnName);
}
function vectorF64(dimensions, columnName) {
    return createVectorColumn('F64_BLOB', dimensions, columnName);
}
function vectorF16(dimensions, columnName) {
    return createVectorColumn('F16_BLOB', dimensions, columnName);
}
function vectorBF16(dimensions, columnName) {
    return createVectorColumn('FLOATB16', dimensions, columnName);
}
function vectorF8(dimensions, columnName) {
    return createVectorColumn('FLOAT8', dimensions, columnName);
}
function vectorBinary(dimensions, columnName) {
    return createVectorColumn('FLOAT1BIT', dimensions, columnName);
}
