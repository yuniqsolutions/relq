import { createSQLiteColumnWithName } from "../column-types/column-builder.js";
function createVectorColumn(vectorType, dimensions, columnName) {
    const sqlType = `${vectorType}(${dimensions})`;
    const col = createSQLiteColumnWithName(sqlType, columnName);
    col.$mode = 'vector';
    col.$dimensions = dimensions;
    col.$vectorType = vectorType;
    return col;
}
export function vectorF32(dimensions, columnName) {
    return createVectorColumn('F32_BLOB', dimensions, columnName);
}
export function vectorF64(dimensions, columnName) {
    return createVectorColumn('F64_BLOB', dimensions, columnName);
}
export function vectorF16(dimensions, columnName) {
    return createVectorColumn('F16_BLOB', dimensions, columnName);
}
export function vectorBF16(dimensions, columnName) {
    return createVectorColumn('FLOATB16', dimensions, columnName);
}
export function vectorF8(dimensions, columnName) {
    return createVectorColumn('FLOAT8', dimensions, columnName);
}
export function vectorBinary(dimensions, columnName) {
    return createVectorColumn('FLOAT1BIT', dimensions, columnName);
}
