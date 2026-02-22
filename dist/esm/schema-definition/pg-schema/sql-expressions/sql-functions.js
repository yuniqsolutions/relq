import { expr, colRef, toSql } from "./sql-expr-core.js";
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
    lpad: (col, length, fill = ' ') => expr(`LPAD(${toSql(col)}, ${length}, '${fill.replace(/'/g, "''")}')`),
    rpad: (col, length, fill = ' ') => expr(`RPAD(${toSql(col)}, ${length}, '${fill.replace(/'/g, "''")}')`),
    repeat: (col, times) => expr(`REPEAT(${toSql(col)}, ${times})`),
    reverse: (col) => expr(`REVERSE(${toSql(col)})`),
    position: (col, substring) => expr(`POSITION('${substring.replace(/'/g, "''")}' IN ${toSql(col)})`),
    overlay: (col, start, length, replacement) => expr(`OVERLAY(${toSql(col)} PLACING '${replacement.replace(/'/g, "''")}' FROM ${start} FOR ${length})`),
    regexpReplace: (col, pattern, replacement, flags) => flags
        ? expr(`REGEXP_REPLACE(${toSql(col)}, '${pattern.replace(/'/g, "''")}', '${replacement.replace(/'/g, "''")}', '${flags}')`)
        : expr(`REGEXP_REPLACE(${toSql(col)}, '${pattern.replace(/'/g, "''")}', '${replacement.replace(/'/g, "''")}')`),
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
    log: (base, col) => expr(`LOG(${base}, ${toSql(col)})`),
    ln: (col) => expr(`LN(${toSql(col)})`),
    exp: (col) => expr(`EXP(${toSql(col)})`),
    sign: (col) => expr(`SIGN(${toSql(col)})`),
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
    toChar: (col, format) => expr(`TO_CHAR(${toSql(col)}, '${format.replace(/'/g, "''")}')`),
    toTimestamp: (text, format) => expr(`TO_TIMESTAMP(${toSql(text)}, '${format.replace(/'/g, "''")}')`),
    toDate: (text, format) => expr(`TO_DATE(${toSql(text)}, '${format.replace(/'/g, "''")}')`),
    makeDate: (year, month, day) => expr(`MAKE_DATE(${toSql(year)}, ${toSql(month)}, ${toSql(day)})`),
    makeTimestamp: (year, month, day, hour, minute, second) => expr(`MAKE_TIMESTAMP(${toSql(year)}, ${toSql(month)}, ${toSql(day)}, ${toSql(hour)}, ${toSql(minute)}, ${toSql(second)})`),
    dateBin: (stride, source, origin) => origin
        ? expr(`DATE_BIN('${stride}', ${toSql(source)}, ${toSql(origin)})`)
        : expr(`DATE_BIN('${stride}', ${toSql(source)}, TIMESTAMP '2001-01-01')`),
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
    jsonbBuildObject: (pairs) => {
        const parts = [];
        for (const [key, value] of Object.entries(pairs)) {
            parts.push(`'${key.replace(/'/g, "''")}', ${toSql(value)}`);
        }
        return expr(`JSONB_BUILD_OBJECT(${parts.join(', ')})`);
    },
    jsonbBuildArray: (...values) => expr(`JSONB_BUILD_ARRAY(${values.map(v => toSql(v)).join(', ')})`),
    jsonbStripNulls: (col) => expr(`JSONB_STRIP_NULLS(${toSql(col)})`),
    jsonbTypeof: (col) => expr(`JSONB_TYPEOF(${toSql(col)})`),
    arrayLength: (col, dim = 1) => expr(`ARRAY_LENGTH(${toSql(col)}, ${dim})`),
    unnest: (col) => expr(`UNNEST(${toSql(col)})`),
    arrayAgg: (col) => expr(`ARRAY_AGG(${toSql(col)})`),
    arrayCat: (arr1, arr2) => expr(`ARRAY_CAT(${toSql(arr1)}, ${toSql(arr2)})`),
    arrayPosition: (col, element) => expr(`ARRAY_POSITION(${toSql(col)}, ${toSql(element)})`),
    arrayReplace: (col, oldElement, newElement) => expr(`ARRAY_REPLACE(${toSql(col)}, ${toSql(oldElement)}, ${toSql(newElement)})`),
    arrayFill: (value, dimensions) => expr(`ARRAY_FILL(${toSql(value)}, ARRAY[${dimensions.join(', ')}])`),
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
export function createExpressionBuilder() {
    return {
        ...sqlFunctions,
        col: (name) => colRef(name),
    };
}
export const expressionBuilder = createExpressionBuilder();
