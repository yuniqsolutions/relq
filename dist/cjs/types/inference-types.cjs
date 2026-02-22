"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isColumnAlias = isColumnAlias;
exports.isAggregateColumn = isAggregateColumn;
exports.getColumnName = getColumnName;
exports.getResultKey = getResultKey;
function isColumnAlias(col) {
    return Array.isArray(col) && col.length === 2;
}
function isAggregateColumn(col) {
    return /^[a-z_]+\(/i.test(col);
}
function getColumnName(col) {
    return isColumnAlias(col) ? col[0] : col;
}
function getResultKey(col) {
    return isColumnAlias(col) ? col[1] : col;
}
