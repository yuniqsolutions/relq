export function expr(sql) {
    return { $sql: sql, $expr: true };
}
export function orderedColRef(name, sql) {
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
export function colRef(name) {
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
export function toSql(val) {
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
export function getSql(expression) {
    return expression.$sql;
}
