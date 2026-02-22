import { createSQLiteColumnWithName } from "./column-builder.js";
export function blob(columnName) {
    return createSQLiteColumnWithName('BLOB', columnName);
}
export function bytea(columnName) {
    return createSQLiteColumnWithName('BLOB', columnName);
}
