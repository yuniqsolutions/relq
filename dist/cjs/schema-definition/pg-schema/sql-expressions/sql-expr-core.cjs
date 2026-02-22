"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expr = expr;
exports.orderedColRef = orderedColRef;
exports.colRef = colRef;
exports.toSql = toSql;
exports.getSql = getSql;
function expr(sql) {
    return { $sql: sql, $expr: true };
}
function orderedColRef(name, sql) {
    return {
        $sql: sql,
        $expr: true,
        $column: name,
        nullsLast() {
            return expr(`${this.$sql} NULLS LAST`);
        },
        nullsFirst() {
            return expr(`${this.$sql} NULLS FIRST`);
        },
    };
}
function colRef(name) {
    return {
        $sql: `"${name}"`,
        $expr: true,
        $column: name,
        desc() {
            return orderedColRef(name, `"${name}" DESC`);
        },
        asc() {
            return orderedColRef(name, `"${name}" ASC`);
        },
    };
}
function toSql(val) {
    if (val === null)
        return 'NULL';
    if (typeof val === 'boolean')
        return val ? 'TRUE' : 'FALSE';
    if (typeof val === 'number')
        return String(val);
    if (typeof val === 'string')
        return `'${val.replace(/'/g, "''")}'`;
    return val.$sql;
}
function getSql(expression) {
    return expression.$sql;
}
