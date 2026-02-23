import { createSQLiteColumnWithName } from "./column-builder.js";
export const numericAffinity = (columnName) => createSQLiteColumnWithName('NUMERIC', columnName);
export function boolean(columnName) {
    const col = createSQLiteColumnWithName('INTEGER', columnName);
    col.$mode = 'boolean';
    return col;
}
export const uuid = (columnName) => createSQLiteColumnWithName('TEXT', columnName);
export function json(columnName) {
    const col = createSQLiteColumnWithName('TEXT', columnName);
    col.$mode = 'json';
    return col;
}
export function jsonb(columnName) {
    const col = createSQLiteColumnWithName('BLOB', columnName);
    col.$mode = 'json';
    return col;
}
