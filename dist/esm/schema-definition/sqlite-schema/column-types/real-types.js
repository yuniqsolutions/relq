import { createSQLiteColumnWithName } from "./column-builder.js";
export function real(columnName) {
    return createSQLiteColumnWithName('REAL', columnName);
}
export const float = real;
export const double = real;
export const doublePrecision = real;
export function decimal(columnNameOrPrecision, scaleOrOptions) {
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
    const col = createSQLiteColumnWithName('REAL', columnName);
    if (precision !== undefined) {
        col.$precision = precision;
    }
    if (scale !== undefined) {
        col.$scale = scale;
    }
    return col;
}
export const numeric = decimal;
