"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expressionBuilder = exports.sqlFunctions = void 0;
exports.createExpressionBuilder = createExpressionBuilder;
const sql_expr_core_1 = require("./sql-expr-core.cjs");
exports.sqlFunctions = {
    lower: (col) => (0, sql_expr_core_1.expr)(`LOWER(${(0, sql_expr_core_1.toSql)(col)})`),
    upper: (col) => (0, sql_expr_core_1.expr)(`UPPER(${(0, sql_expr_core_1.toSql)(col)})`),
    trim: (col) => (0, sql_expr_core_1.expr)(`TRIM(${(0, sql_expr_core_1.toSql)(col)})`),
    ltrim: (col) => (0, sql_expr_core_1.expr)(`LTRIM(${(0, sql_expr_core_1.toSql)(col)})`),
    rtrim: (col) => (0, sql_expr_core_1.expr)(`RTRIM(${(0, sql_expr_core_1.toSql)(col)})`),
    length: (col) => (0, sql_expr_core_1.expr)(`LENGTH(${(0, sql_expr_core_1.toSql)(col)})`),
    substring: (col, start, length) => length !== undefined
        ? (0, sql_expr_core_1.expr)(`SUBSTRING(${(0, sql_expr_core_1.toSql)(col)} FROM ${start} FOR ${length})`)
        : (0, sql_expr_core_1.expr)(`SUBSTRING(${(0, sql_expr_core_1.toSql)(col)} FROM ${start})`),
    concat: (...args) => (0, sql_expr_core_1.expr)(`CONCAT(${args.map(sql_expr_core_1.toSql).join(', ')})`),
    replace: (col, from, to) => (0, sql_expr_core_1.expr)(`REPLACE(${(0, sql_expr_core_1.toSql)(col)}, '${from}', '${to}')`),
    left: (col, n) => (0, sql_expr_core_1.expr)(`LEFT(${(0, sql_expr_core_1.toSql)(col)}, ${n})`),
    right: (col, n) => (0, sql_expr_core_1.expr)(`RIGHT(${(0, sql_expr_core_1.toSql)(col)}, ${n})`),
    lpad: (col, length, fill = ' ') => (0, sql_expr_core_1.expr)(`LPAD(${(0, sql_expr_core_1.toSql)(col)}, ${length}, '${fill.replace(/'/g, "''")}')`),
    rpad: (col, length, fill = ' ') => (0, sql_expr_core_1.expr)(`RPAD(${(0, sql_expr_core_1.toSql)(col)}, ${length}, '${fill.replace(/'/g, "''")}')`),
    repeat: (col, times) => (0, sql_expr_core_1.expr)(`REPEAT(${(0, sql_expr_core_1.toSql)(col)}, ${times})`),
    reverse: (col) => (0, sql_expr_core_1.expr)(`REVERSE(${(0, sql_expr_core_1.toSql)(col)})`),
    position: (col, substring) => (0, sql_expr_core_1.expr)(`POSITION('${substring.replace(/'/g, "''")}' IN ${(0, sql_expr_core_1.toSql)(col)})`),
    overlay: (col, start, length, replacement) => (0, sql_expr_core_1.expr)(`OVERLAY(${(0, sql_expr_core_1.toSql)(col)} PLACING '${replacement.replace(/'/g, "''")}' FROM ${start} FOR ${length})`),
    regexpReplace: (col, pattern, replacement, flags) => flags
        ? (0, sql_expr_core_1.expr)(`REGEXP_REPLACE(${(0, sql_expr_core_1.toSql)(col)}, '${pattern.replace(/'/g, "''")}', '${replacement.replace(/'/g, "''")}', '${flags}')`)
        : (0, sql_expr_core_1.expr)(`REGEXP_REPLACE(${(0, sql_expr_core_1.toSql)(col)}, '${pattern.replace(/'/g, "''")}', '${replacement.replace(/'/g, "''")}')`),
    abs: (col) => (0, sql_expr_core_1.expr)(`ABS(${(0, sql_expr_core_1.toSql)(col)})`),
    ceil: (col) => (0, sql_expr_core_1.expr)(`CEIL(${(0, sql_expr_core_1.toSql)(col)})`),
    floor: (col) => (0, sql_expr_core_1.expr)(`FLOOR(${(0, sql_expr_core_1.toSql)(col)})`),
    round: (col, decimals) => decimals !== undefined
        ? (0, sql_expr_core_1.expr)(`ROUND(${(0, sql_expr_core_1.toSql)(col)}, ${decimals})`)
        : (0, sql_expr_core_1.expr)(`ROUND(${(0, sql_expr_core_1.toSql)(col)})`),
    trunc: (col, decimals) => decimals !== undefined
        ? (0, sql_expr_core_1.expr)(`TRUNC(${(0, sql_expr_core_1.toSql)(col)}, ${decimals})`)
        : (0, sql_expr_core_1.expr)(`TRUNC(${(0, sql_expr_core_1.toSql)(col)})`),
    mod: (col, divisor) => (0, sql_expr_core_1.expr)(`MOD(${(0, sql_expr_core_1.toSql)(col)}, ${divisor})`),
    power: (col, exp) => (0, sql_expr_core_1.expr)(`POWER(${(0, sql_expr_core_1.toSql)(col)}, ${exp})`),
    sqrt: (col) => (0, sql_expr_core_1.expr)(`SQRT(${(0, sql_expr_core_1.toSql)(col)})`),
    log: (base, col) => (0, sql_expr_core_1.expr)(`LOG(${base}, ${(0, sql_expr_core_1.toSql)(col)})`),
    ln: (col) => (0, sql_expr_core_1.expr)(`LN(${(0, sql_expr_core_1.toSql)(col)})`),
    exp: (col) => (0, sql_expr_core_1.expr)(`EXP(${(0, sql_expr_core_1.toSql)(col)})`),
    sign: (col) => (0, sql_expr_core_1.expr)(`SIGN(${(0, sql_expr_core_1.toSql)(col)})`),
    now: () => (0, sql_expr_core_1.expr)('NOW()'),
    currentDate: () => (0, sql_expr_core_1.expr)('CURRENT_DATE'),
    currentTime: () => (0, sql_expr_core_1.expr)('CURRENT_TIME'),
    currentTimestamp: () => (0, sql_expr_core_1.expr)('CURRENT_TIMESTAMP'),
    extract: (field, col) => (0, sql_expr_core_1.expr)(`EXTRACT(${field.toUpperCase()} FROM ${(0, sql_expr_core_1.toSql)(col)})`),
    datePart: (field, col) => (0, sql_expr_core_1.expr)(`DATE_PART('${field}', ${(0, sql_expr_core_1.toSql)(col)})`),
    age: (col, col2) => col2
        ? (0, sql_expr_core_1.expr)(`AGE(${(0, sql_expr_core_1.toSql)(col)}, ${(0, sql_expr_core_1.toSql)(col2)})`)
        : (0, sql_expr_core_1.expr)(`AGE(${(0, sql_expr_core_1.toSql)(col)})`),
    dateTrunc: (field, col) => (0, sql_expr_core_1.expr)(`DATE_TRUNC('${field}', ${(0, sql_expr_core_1.toSql)(col)})`),
    toChar: (col, format) => (0, sql_expr_core_1.expr)(`TO_CHAR(${(0, sql_expr_core_1.toSql)(col)}, '${format.replace(/'/g, "''")}')`),
    toTimestamp: (text, format) => (0, sql_expr_core_1.expr)(`TO_TIMESTAMP(${(0, sql_expr_core_1.toSql)(text)}, '${format.replace(/'/g, "''")}')`),
    toDate: (text, format) => (0, sql_expr_core_1.expr)(`TO_DATE(${(0, sql_expr_core_1.toSql)(text)}, '${format.replace(/'/g, "''")}')`),
    makeDate: (year, month, day) => (0, sql_expr_core_1.expr)(`MAKE_DATE(${(0, sql_expr_core_1.toSql)(year)}, ${(0, sql_expr_core_1.toSql)(month)}, ${(0, sql_expr_core_1.toSql)(day)})`),
    makeTimestamp: (year, month, day, hour, minute, second) => (0, sql_expr_core_1.expr)(`MAKE_TIMESTAMP(${(0, sql_expr_core_1.toSql)(year)}, ${(0, sql_expr_core_1.toSql)(month)}, ${(0, sql_expr_core_1.toSql)(day)}, ${(0, sql_expr_core_1.toSql)(hour)}, ${(0, sql_expr_core_1.toSql)(minute)}, ${(0, sql_expr_core_1.toSql)(second)})`),
    dateBin: (stride, source, origin) => origin
        ? (0, sql_expr_core_1.expr)(`DATE_BIN('${stride}', ${(0, sql_expr_core_1.toSql)(source)}, ${(0, sql_expr_core_1.toSql)(origin)})`)
        : (0, sql_expr_core_1.expr)(`DATE_BIN('${stride}', ${(0, sql_expr_core_1.toSql)(source)}, TIMESTAMP '2001-01-01')`),
    cast: (col, type) => (0, sql_expr_core_1.expr)(`CAST(${(0, sql_expr_core_1.toSql)(col)} AS ${type})`),
    asText: (col) => (0, sql_expr_core_1.expr)(`(${(0, sql_expr_core_1.toSql)(col)})::TEXT`),
    asInteger: (col) => (0, sql_expr_core_1.expr)(`(${(0, sql_expr_core_1.toSql)(col)})::INTEGER`),
    asNumeric: (col) => (0, sql_expr_core_1.expr)(`(${(0, sql_expr_core_1.toSql)(col)})::NUMERIC`),
    asTimestamp: (col) => (0, sql_expr_core_1.expr)(`(${(0, sql_expr_core_1.toSql)(col)})::TIMESTAMP`),
    asDate: (col) => (0, sql_expr_core_1.expr)(`(${(0, sql_expr_core_1.toSql)(col)})::DATE`),
    coalesce: (...args) => (0, sql_expr_core_1.expr)(`COALESCE(${args.map(sql_expr_core_1.toSql).join(', ')})`),
    nullif: (col, value) => (0, sql_expr_core_1.expr)(`NULLIF(${(0, sql_expr_core_1.toSql)(col)}, ${(0, sql_expr_core_1.toSql)(value)})`),
    ifNull: (col, defaultValue) => (0, sql_expr_core_1.expr)(`COALESCE(${(0, sql_expr_core_1.toSql)(col)}, ${(0, sql_expr_core_1.toSql)(defaultValue)})`),
    jsonExtract: (col, path) => (0, sql_expr_core_1.expr)(`${(0, sql_expr_core_1.toSql)(col)}->'${path}'`),
    jsonExtractText: (col, path) => (0, sql_expr_core_1.expr)(`${(0, sql_expr_core_1.toSql)(col)}->>'${path}'`),
    jsonbExtract: (col, path) => (0, sql_expr_core_1.expr)(`${(0, sql_expr_core_1.toSql)(col)}->'${path}'`),
    jsonbExtractText: (col, path) => (0, sql_expr_core_1.expr)(`${(0, sql_expr_core_1.toSql)(col)}->>'${path}'`),
    jsonbBuildObject: (pairs) => {
        const parts = [];
        for (const [key, value] of Object.entries(pairs)) {
            parts.push(`'${key.replace(/'/g, "''")}', ${(0, sql_expr_core_1.toSql)(value)}`);
        }
        return (0, sql_expr_core_1.expr)(`JSONB_BUILD_OBJECT(${parts.join(', ')})`);
    },
    jsonbBuildArray: (...values) => (0, sql_expr_core_1.expr)(`JSONB_BUILD_ARRAY(${values.map(v => (0, sql_expr_core_1.toSql)(v)).join(', ')})`),
    jsonbStripNulls: (col) => (0, sql_expr_core_1.expr)(`JSONB_STRIP_NULLS(${(0, sql_expr_core_1.toSql)(col)})`),
    jsonbTypeof: (col) => (0, sql_expr_core_1.expr)(`JSONB_TYPEOF(${(0, sql_expr_core_1.toSql)(col)})`),
    arrayLength: (col, dim = 1) => (0, sql_expr_core_1.expr)(`ARRAY_LENGTH(${(0, sql_expr_core_1.toSql)(col)}, ${dim})`),
    unnest: (col) => (0, sql_expr_core_1.expr)(`UNNEST(${(0, sql_expr_core_1.toSql)(col)})`),
    arrayAgg: (col) => (0, sql_expr_core_1.expr)(`ARRAY_AGG(${(0, sql_expr_core_1.toSql)(col)})`),
    arrayCat: (arr1, arr2) => (0, sql_expr_core_1.expr)(`ARRAY_CAT(${(0, sql_expr_core_1.toSql)(arr1)}, ${(0, sql_expr_core_1.toSql)(arr2)})`),
    arrayPosition: (col, element) => (0, sql_expr_core_1.expr)(`ARRAY_POSITION(${(0, sql_expr_core_1.toSql)(col)}, ${(0, sql_expr_core_1.toSql)(element)})`),
    arrayReplace: (col, oldElement, newElement) => (0, sql_expr_core_1.expr)(`ARRAY_REPLACE(${(0, sql_expr_core_1.toSql)(col)}, ${(0, sql_expr_core_1.toSql)(oldElement)}, ${(0, sql_expr_core_1.toSql)(newElement)})`),
    arrayFill: (value, dimensions) => (0, sql_expr_core_1.expr)(`ARRAY_FILL(${(0, sql_expr_core_1.toSql)(value)}, ARRAY[${dimensions.join(', ')}])`),
    toTsvector: (config, col) => (0, sql_expr_core_1.expr)(`TO_TSVECTOR('${config}', ${(0, sql_expr_core_1.toSql)(col)})`),
    toTsquery: (config, query) => (0, sql_expr_core_1.expr)(`TO_TSQUERY('${config}', '${query}')`),
    similarity: (col1, col2) => (0, sql_expr_core_1.expr)(`SIMILARITY(${(0, sql_expr_core_1.toSql)(col1)}, ${(0, sql_expr_core_1.toSql)(col2)})`),
    genRandomUuid: () => (0, sql_expr_core_1.expr)('GEN_RANDOM_UUID()'),
    add: (col, value) => (0, sql_expr_core_1.expr)(`(${(0, sql_expr_core_1.toSql)(col)} + ${(0, sql_expr_core_1.toSql)(value)})`),
    subtract: (col, value) => (0, sql_expr_core_1.expr)(`(${(0, sql_expr_core_1.toSql)(col)} - ${(0, sql_expr_core_1.toSql)(value)})`),
    multiply: (col, value) => (0, sql_expr_core_1.expr)(`(${(0, sql_expr_core_1.toSql)(col)} * ${(0, sql_expr_core_1.toSql)(value)})`),
    divide: (col, value) => (0, sql_expr_core_1.expr)(`(${(0, sql_expr_core_1.toSql)(col)} / ${(0, sql_expr_core_1.toSql)(value)})`),
    raw: (sql) => (0, sql_expr_core_1.expr)(sql),
};
function createExpressionBuilder() {
    return {
        ...exports.sqlFunctions,
        col: (name) => (0, sql_expr_core_1.colRef)(name),
    };
}
exports.expressionBuilder = createExpressionBuilder();
