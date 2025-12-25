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
    if (typeof val === 'number')
        return String(val);
    if (typeof val === 'string')
        return `'${val.replace(/'/g, "''")}'`;
    return val.$sql;
}
export const sqlFunctions = {
    lower: (col) => expr(`LOWER(${toSql(col)})`),
    upper: (col) => expr(`UPPER(${toSql(col)})`),
    trim: (col) => expr(`TRIM(${toSql(col)})`),
    ltrim: (col) => expr(`LTRIM(${toSql(col)})`),
    rtrim: (col) => expr(`RTRIM(${toSql(col)})`),
    length: (col) => expr(`LENGTH(${toSql(col)})`),
    substring: (col, start, length) => length !== undefined
        ? expr(`SUBSTRING(${toSql(col)} FROM ${start} FOR ${length})`)
        : expr(`SUBSTRING(${toSql(col)} FROM ${start})`),
    concat: (...args) => expr(`CONCAT(${args.map(toSql).join(', ')})`),
    replace: (col, from, to) => expr(`REPLACE(${toSql(col)}, '${from}', '${to}')`),
    left: (col, n) => expr(`LEFT(${toSql(col)}, ${n})`),
    right: (col, n) => expr(`RIGHT(${toSql(col)}, ${n})`),
    abs: (col) => expr(`ABS(${toSql(col)})`),
    ceil: (col) => expr(`CEIL(${toSql(col)})`),
    floor: (col) => expr(`FLOOR(${toSql(col)})`),
    round: (col, decimals) => decimals !== undefined
        ? expr(`ROUND(${toSql(col)}, ${decimals})`)
        : expr(`ROUND(${toSql(col)})`),
    trunc: (col, decimals) => decimals !== undefined
        ? expr(`TRUNC(${toSql(col)}, ${decimals})`)
        : expr(`TRUNC(${toSql(col)})`),
    mod: (col, divisor) => expr(`MOD(${toSql(col)}, ${divisor})`),
    power: (col, exp) => expr(`POWER(${toSql(col)}, ${exp})`),
    sqrt: (col) => expr(`SQRT(${toSql(col)})`),
    now: () => expr('NOW()'),
    currentDate: () => expr('CURRENT_DATE'),
    currentTime: () => expr('CURRENT_TIME'),
    currentTimestamp: () => expr('CURRENT_TIMESTAMP'),
    extract: (field, col) => expr(`EXTRACT(${field.toUpperCase()} FROM ${toSql(col)})`),
    datePart: (field, col) => expr(`DATE_PART('${field}', ${toSql(col)})`),
    age: (col, col2) => col2
        ? expr(`AGE(${toSql(col)}, ${toSql(col2)})`)
        : expr(`AGE(${toSql(col)})`),
    dateTrunc: (field, col) => expr(`DATE_TRUNC('${field}', ${toSql(col)})`),
    cast: (col, type) => expr(`CAST(${toSql(col)} AS ${type})`),
    asText: (col) => expr(`(${toSql(col)})::TEXT`),
    asInteger: (col) => expr(`(${toSql(col)})::INTEGER`),
    asNumeric: (col) => expr(`(${toSql(col)})::NUMERIC`),
    asTimestamp: (col) => expr(`(${toSql(col)})::TIMESTAMP`),
    asDate: (col) => expr(`(${toSql(col)})::DATE`),
    coalesce: (...args) => expr(`COALESCE(${args.map(toSql).join(', ')})`),
    nullif: (col, value) => expr(`NULLIF(${toSql(col)}, ${toSql(value)})`),
    ifNull: (col, defaultValue) => expr(`COALESCE(${toSql(col)}, ${toSql(defaultValue)})`),
    jsonExtract: (col, path) => expr(`${toSql(col)}->'${path}'`),
    jsonExtractText: (col, path) => expr(`${toSql(col)}->>'${path}'`),
    jsonbExtract: (col, path) => expr(`${toSql(col)}->'${path}'`),
    jsonbExtractText: (col, path) => expr(`${toSql(col)}->>'${path}'`),
    arrayLength: (col, dim = 1) => expr(`ARRAY_LENGTH(${toSql(col)}, ${dim})`),
    unnest: (col) => expr(`UNNEST(${toSql(col)})`),
    arrayAgg: (col) => expr(`ARRAY_AGG(${toSql(col)})`),
    toTsvector: (config, col) => expr(`TO_TSVECTOR('${config}', ${toSql(col)})`),
    toTsquery: (config, query) => expr(`TO_TSQUERY('${config}', '${query}')`),
    similarity: (col1, col2) => expr(`SIMILARITY(${toSql(col1)}, ${toSql(col2)})`),
    genRandomUuid: () => expr('GEN_RANDOM_UUID()'),
    add: (col, value) => expr(`(${toSql(col)} + ${toSql(value)})`),
    subtract: (col, value) => expr(`(${toSql(col)} - ${toSql(value)})`),
    multiply: (col, value) => expr(`(${toSql(col)} * ${toSql(value)})`),
    divide: (col, value) => expr(`(${toSql(col)} / ${toSql(value)})`),
    raw: (sql) => expr(sql),
};
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
    };
}
export function getSql(expr) {
    return expr.$sql;
}
export function createExpressionBuilder() {
    return {
        ...sqlFunctions,
        col: (name) => colRef(name),
    };
}
export const expressionBuilder = createExpressionBuilder();
