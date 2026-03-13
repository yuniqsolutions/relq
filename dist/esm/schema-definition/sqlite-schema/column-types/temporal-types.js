import { createSQLiteColumnWithName } from "./column-builder.js";
export function timestamp(columnName) {
    const col = createSQLiteColumnWithName('TEXT', columnName);
    col.$mode = 'timestamp';
    return col;
}
export function date(columnName) {
    const col = createSQLiteColumnWithName('TEXT', columnName);
    col.$mode = 'date';
    return col;
}
export function time(columnName) {
    const col = createSQLiteColumnWithName('TEXT', columnName);
    col.$mode = 'time';
    return col;
}
export function unixTimestamp(columnName) {
    const col = createSQLiteColumnWithName('INTEGER', columnName);
    col.$mode = 'timestamp';
    return col;
}
export function unixTimestampMs(columnName) {
    const col = createSQLiteColumnWithName('INTEGER', columnName);
    col.$mode = 'timestamp_ms';
    return col;
}
