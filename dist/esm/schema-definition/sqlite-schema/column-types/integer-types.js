import { createSQLiteColumnWithName } from "./column-builder.js";
export function integer(columnName) {
    return createSQLiteColumnWithName('INTEGER', columnName);
}
export const int = integer;
export const int2 = integer;
export function bigint(columnName) {
    const col = createSQLiteColumnWithName('INTEGER', columnName);
    col.$mode = 'bigint';
    return col;
}
