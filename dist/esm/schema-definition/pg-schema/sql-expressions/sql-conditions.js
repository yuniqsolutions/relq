import { expr, colRef, toSql } from "./sql-expr-core.js";
import { sqlFunctions } from "./sql-functions.js";
function whereCondition(sql) {
    const cond = {
        $sql: sql,
        $expr: true,
        and(other) {
            return whereCondition(`(${this.$sql}) AND (${other.$sql})`);
        },
        or(other) {
            return whereCondition(`(${this.$sql}) OR (${other.$sql})`);
        },
    };
    return cond;
}
export function createWhereBuilder(columnMap) {
    const getColName = (col) => columnMap[col] || String(col);
    const formatValue = (val) => {
        if (val === null)
            return 'NULL';
        if (typeof val === 'number')
            return String(val);
        if (typeof val === 'boolean')
            return val ? 'TRUE' : 'FALSE';
        if (val instanceof Date)
            return `'${val.toISOString()}'`;
        return `'${String(val).replace(/'/g, "''")}'`;
    };
    return {
        eq: (col, value) => whereCondition(`"${getColName(col)}" = ${formatValue(value)}`),
        neq: (col, value) => whereCondition(`"${getColName(col)}" != ${formatValue(value)}`),
        gt: (col, value) => whereCondition(`"${getColName(col)}" > ${formatValue(value)}`),
        gte: (col, value) => whereCondition(`"${getColName(col)}" >= ${formatValue(value)}`),
        lt: (col, value) => whereCondition(`"${getColName(col)}" < ${formatValue(value)}`),
        lte: (col, value) => whereCondition(`"${getColName(col)}" <= ${formatValue(value)}`),
        isNull: (col) => whereCondition(`"${getColName(col)}" IS NULL`),
        isNotNull: (col) => whereCondition(`"${getColName(col)}" IS NOT NULL`),
        like: (col, pattern) => whereCondition(`"${getColName(col)}" LIKE '${pattern}'`),
        ilike: (col, pattern) => whereCondition(`"${getColName(col)}" ILIKE '${pattern}'`),
        in: (col, values) => whereCondition(`"${getColName(col)}" IN (${values.map(formatValue).join(', ')})`),
        notIn: (col, values) => whereCondition(`"${getColName(col)}" NOT IN (${values.map(formatValue).join(', ')})`),
        isTrue: (col) => whereCondition(`"${getColName(col)}" IS TRUE`),
        isFalse: (col) => whereCondition(`"${getColName(col)}" IS FALSE`),
        between: (col, min, max) => whereCondition(`"${getColName(col)}" BETWEEN ${formatValue(min)} AND ${formatValue(max)}`),
        raw: (sql) => whereCondition(sql),
        expr: (expression, op, value) => {
            if (op === 'IS NULL' || op === 'IS NOT NULL') {
                return whereCondition(`${expression.$sql} ${op}`);
            }
            return whereCondition(`${expression.$sql} ${op} ${formatValue(value)}`);
        },
    };
}
export function createGeneratedExprBuilder(columnMap) {
    return {
        col: (name) => colRef(columnMap[name] || String(name)),
        fn: sqlFunctions,
        add: (a, b) => expr(`(${toSql(a)} + ${toSql(b)})`),
        subtract: (a, b) => expr(`(${toSql(a)} - ${toSql(b)})`),
        multiply: (a, b) => expr(`(${toSql(a)} * ${toSql(b)})`),
        divide: (a, b) => expr(`(${toSql(a)} / ${toSql(b)})`),
        concat: (...parts) => expr(parts.map(p => {
            if (typeof p === 'string')
                return `'${p.replace(/'/g, "''")}'`;
            return toSql(p);
        }).join(' || ')),
    };
}
export function createTableColumnRefs(columns) {
    const refs = {};
    for (const key of Object.keys(columns)) {
        const col = columns[key];
        const colName = col.$columnName || String(key);
        refs[key] = colRef(colName);
    }
    return refs;
}
export function pgExtensions(...extensions) {
    return {
        extensions,
        toSQL() {
            return extensions.map(ext => `CREATE EXTENSION IF NOT EXISTS "${ext}";`);
        },
        toAST() {
            return [...extensions];
        },
    };
}
