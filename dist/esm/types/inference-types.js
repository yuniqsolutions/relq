export function isColumnAlias(col) {
    return Array.isArray(col) && col.length === 2;
}
export function isAggregateColumn(col) {
    return /^[a-z_]+\(/i.test(col);
}
export function getColumnName(col) {
    return isColumnAlias(col) ? col[0] : col;
}
export function getResultKey(col) {
    return isColumnAlias(col) ? col[1] : col;
}
