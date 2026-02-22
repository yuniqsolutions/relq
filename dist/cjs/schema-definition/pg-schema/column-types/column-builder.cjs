"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatedFn = void 0;
exports.createColumn = createColumn;
exports.createColumnWithName = createColumnWithName;
const expression_builder_1 = require("./expression-builder.cjs");
const generatedFnMethods = {
    lower: (col) => (0, expression_builder_1.chainableExpr)(`LOWER(${col.$sql})`),
    upper: (col) => (0, expression_builder_1.chainableExpr)(`UPPER(${col.$sql})`),
    trim: (col) => (0, expression_builder_1.chainableExpr)(`TRIM(${col.$sql})`),
    ltrim: (col) => (0, expression_builder_1.chainableExpr)(`LTRIM(${col.$sql})`),
    rtrim: (col) => (0, expression_builder_1.chainableExpr)(`RTRIM(${col.$sql})`),
    length: (col) => (0, expression_builder_1.chainableExpr)(`LENGTH(${col.$sql})`),
    substring: (col, start, length) => length !== undefined
        ? (0, expression_builder_1.chainableExpr)(`SUBSTRING(${col.$sql} FROM ${start} FOR ${length})`)
        : (0, expression_builder_1.chainableExpr)(`SUBSTRING(${col.$sql} FROM ${start})`),
    concat: (...args) => (0, expression_builder_1.chainableExpr)(`CONCAT(${args.map(expression_builder_1.formatGenValue).join(', ')})`),
    replace: (col, from, to) => (0, expression_builder_1.chainableExpr)(`REPLACE(${col.$sql}, '${from}', '${to}')`),
    left: (col, n) => (0, expression_builder_1.chainableExpr)(`LEFT(${col.$sql}, ${n})`),
    right: (col, n) => (0, expression_builder_1.chainableExpr)(`RIGHT(${col.$sql}, ${n})`),
    abs: (col) => (0, expression_builder_1.chainableExpr)(`ABS(${col.$sql})`),
    ceil: (col) => (0, expression_builder_1.chainableExpr)(`CEIL(${col.$sql})`),
    floor: (col) => (0, expression_builder_1.chainableExpr)(`FLOOR(${col.$sql})`),
    round: (col, decimals) => decimals !== undefined
        ? (0, expression_builder_1.chainableExpr)(`ROUND(${col.$sql}, ${decimals})`)
        : (0, expression_builder_1.chainableExpr)(`ROUND(${col.$sql})`),
    trunc: (col, decimals) => decimals !== undefined
        ? (0, expression_builder_1.chainableExpr)(`TRUNC(${col.$sql}, ${decimals})`)
        : (0, expression_builder_1.chainableExpr)(`TRUNC(${col.$sql})`),
    sign: (col) => (0, expression_builder_1.chainableExpr)(`SIGN(${col.$sql})`),
    power: (col, exponent) => (0, expression_builder_1.chainableExpr)(`POWER(${col.$sql}, ${exponent})`),
    sqrt: (col) => (0, expression_builder_1.chainableExpr)(`SQRT(${col.$sql})`),
    exp: (col) => (0, expression_builder_1.chainableExpr)(`EXP(${col.$sql})`),
    ln: (col) => (0, expression_builder_1.chainableExpr)(`LN(${col.$sql})`),
    log: (col, base) => base !== undefined
        ? (0, expression_builder_1.chainableExpr)(`LOG(${base}, ${col.$sql})`)
        : (0, expression_builder_1.chainableExpr)(`LOG(${col.$sql})`),
    greatest: (...args) => (0, expression_builder_1.chainableExpr)(`GREATEST(${args.map(expression_builder_1.formatGenValue).join(', ')})`),
    least: (...args) => (0, expression_builder_1.chainableExpr)(`LEAST(${args.map(expression_builder_1.formatGenValue).join(', ')})`),
    add: (a, b) => (0, expression_builder_1.chainableExpr)(`(${(0, expression_builder_1.formatGenValue)(a)} + ${(0, expression_builder_1.formatGenValue)(b)})`),
    subtract: (a, b) => (0, expression_builder_1.chainableExpr)(`(${(0, expression_builder_1.formatGenValue)(a)} - ${(0, expression_builder_1.formatGenValue)(b)})`),
    multiply: (a, b) => (0, expression_builder_1.chainableExpr)(`(${(0, expression_builder_1.formatGenValue)(a)} * ${(0, expression_builder_1.formatGenValue)(b)})`),
    divide: (a, b) => (0, expression_builder_1.chainableExpr)(`(${(0, expression_builder_1.formatGenValue)(a)} / ${(0, expression_builder_1.formatGenValue)(b)})`),
    mod: (a, b) => (0, expression_builder_1.chainableExpr)(`(${(0, expression_builder_1.formatGenValue)(a)} % ${(0, expression_builder_1.formatGenValue)(b)})`),
    asText: (col) => (0, expression_builder_1.chainableExpr)(`(${col.$sql})::TEXT`),
    asInteger: (col) => (0, expression_builder_1.chainableExpr)(`(${col.$sql})::INTEGER`),
    asNumeric: (col) => (0, expression_builder_1.chainableExpr)(`(${col.$sql})::NUMERIC`),
    asBoolean: (col) => (0, expression_builder_1.chainableExpr)(`(${col.$sql})::BOOLEAN`),
    asDate: (col) => (0, expression_builder_1.chainableExpr)(`(${col.$sql})::DATE`),
    asTimestamp: (col) => (0, expression_builder_1.chainableExpr)(`(${col.$sql})::TIMESTAMP`),
    coalesce: (...args) => (0, expression_builder_1.chainableExpr)(`COALESCE(${args.map(expression_builder_1.formatGenValue).join(', ')})`),
    nullif: (col, value) => (0, expression_builder_1.chainableExpr)(`NULLIF(${col.$sql}, ${(0, expression_builder_1.formatGenValue)(value)})`),
    ifNull: (col, defaultValue) => (0, expression_builder_1.chainableExpr)(`COALESCE(${col.$sql}, ${(0, expression_builder_1.formatGenValue)(defaultValue)})`),
    case: () => (0, expression_builder_1.createCaseBuilder)(),
    jsonExtract: (col, path) => (0, expression_builder_1.chainableExpr)(`${col.$sql}->'${path}'`),
    jsonExtractText: (col, path) => (0, expression_builder_1.chainableExpr)(`${col.$sql}->>'${path}'`),
    jsonbExtract: (col, path) => (0, expression_builder_1.chainableExpr)(`${col.$sql}->'${path}'`),
    jsonbExtractText: (col, path) => (0, expression_builder_1.chainableExpr)(`${col.$sql}->>'${path}'`),
    jsonArrayLength: (col) => (0, expression_builder_1.chainableExpr)(`JSONB_ARRAY_LENGTH(${col.$sql})`),
    extract: (field, col) => (0, expression_builder_1.chainableExpr)(`EXTRACT(${field.toUpperCase()} FROM ${col.$sql})`),
    datePart: (field, col) => (0, expression_builder_1.chainableExpr)(`DATE_PART('${field}', ${col.$sql})`),
    age: (col1, col2) => (0, expression_builder_1.chainableExpr)(`AGE(${col1.$sql}, ${col2.$sql})`),
    toTsvector: (config, col) => (0, expression_builder_1.chainableExpr)(`TO_TSVECTOR('${config}', ${col.$sql})`),
    similarity: (col1, col2) => (0, expression_builder_1.chainableExpr)(`SIMILARITY(${col1.$sql}, ${(0, expression_builder_1.formatGenValue)(col2)})`),
    point: (x, y) => (0, expression_builder_1.chainableExpr)(`POINT(${(0, expression_builder_1.formatGenValue)(x)}, ${(0, expression_builder_1.formatGenValue)(y)})`),
    arrayLength: (col, dim = 1) => (0, expression_builder_1.chainableExpr)(`ARRAY_LENGTH(${col.$sql}, ${dim})`),
    arrayPosition: (arr, elem) => (0, expression_builder_1.chainableExpr)(`ARRAY_POSITION(${arr.$sql}, ${(0, expression_builder_1.formatGenValue)(elem)})`),
    md5: (col) => (0, expression_builder_1.chainableExpr)(`MD5(${col.$sql})`),
    sha256: (col) => (0, expression_builder_1.chainableExpr)(`ENCODE(SHA256(${col.$sql}::BYTEA), 'hex')`),
    col: (name, alias) => (0, expression_builder_1.chainableExpr)(alias ? `"${alias}"."${name}"` : `"${name}"`),
    cast: (value, typeName) => (0, expression_builder_1.chainableExpr)(`(${(0, expression_builder_1.formatGenValue)(value)})::${typeName}`),
    func: (name, ...args) => (0, expression_builder_1.chainableExpr)(`${name.toUpperCase()}(${args.map(expression_builder_1.formatGenValue).join(', ')})`),
    sql: (expression) => (0, expression_builder_1.chainableExpr)(expression),
    raw: (expression) => (0, expression_builder_1.chainableExpr)(expression),
    op: (left, operator, right) => (0, expression_builder_1.chainableExpr)(`(${(0, expression_builder_1.formatGenValue)(left)} ${operator} ${(0, expression_builder_1.formatGenValue)(right)})`),
    setweight: (tsvector, weight) => (0, expression_builder_1.chainableExpr)(`SETWEIGHT(${tsvector.$sql}, '${weight}')`),
    setWeight: (tsvector, weight) => (0, expression_builder_1.chainableExpr)(`SETWEIGHT(${tsvector.$sql}, '${weight}')`),
    asVarchar: (col) => (0, expression_builder_1.chainableExpr)(`(${col.$sql})::VARCHAR`),
    textConcat: (left, right) => (0, expression_builder_1.chainableExpr)(`(${(0, expression_builder_1.formatGenValue)(left)} || ${(0, expression_builder_1.formatGenValue)(right)})`),
    tsMatch: (left, right) => (0, expression_builder_1.chainableExpr)(`(${left.$sql} @@ ${right.$sql})`),
    compare: (left, op, right) => (0, expression_builder_1.chainableExpr)(`(${(0, expression_builder_1.formatGenValue)(left)} ${op} ${(0, expression_builder_1.formatGenValue)(right)})`),
    regex: (value, op, pattern) => (0, expression_builder_1.chainableExpr)(`(${value.$sql} ${op} ${(0, expression_builder_1.formatGenValue)(pattern)})`),
    and: (...args) => (0, expression_builder_1.chainableExpr)(`(${args.map(a => a.$sql).join(' AND ')})`),
    or: (...args) => (0, expression_builder_1.chainableExpr)(`(${args.map(a => a.$sql).join(' OR ')})`),
    not: (arg) => (0, expression_builder_1.chainableExpr)(`(NOT ${arg.$sql})`),
    isNull: (col) => (0, expression_builder_1.chainableExpr)(`(${col.$sql} IS NULL)`),
    isNotNull: (col) => (0, expression_builder_1.chainableExpr)(`(${col.$sql} IS NOT NULL)`),
};
exports.generatedFn = new Proxy(function (col) {
    return (0, expression_builder_1.chainableExpr)(col.$sql);
}, {
    get(target, prop) {
        if (prop in generatedFnMethods) {
            return generatedFnMethods[prop];
        }
        return Reflect.get(target, prop);
    }
});
function createColumn(type) {
    const config = { $type: type };
    const builder = {
        ...config,
        $sqlType: type,
        notNull() {
            config.$nullable = false;
            return Object.assign(this, { $nullable: false });
        },
        nullable() {
            config.$nullable = true;
            return Object.assign(this, { $nullable: true });
        },
        default(value) {
            config.$default = value;
            return Object.assign(this, { $default: value });
        },
        primaryKey() {
            config.$primaryKey = true;
            return Object.assign(this, { $primaryKey: true });
        },
        unique() {
            config.$unique = true;
            return Object.assign(this, { $unique: true });
        },
        references(table, column, options) {
            config.$references = { table, column, ...options };
            return Object.assign(this, { $references: config.$references });
        },
        check(name, values) {
            const expression = `${name} IN ('${values.join("', '")}')`;
            config.$checkName = name;
            config.$checkValues = values;
            config.$check = expression;
            return Object.assign(this, { $check: expression, $checkName: name, $checkValues: values });
        },
        checkNot(name, values) {
            const expression = `${name} NOT IN ('${values.join("', '")}')`;
            config.$checkNotName = name;
            config.$checkNotValues = values;
            config.$checkNot = expression;
            return Object.assign(this, { $checkNot: expression, $checkNotName: name, $checkNotValues: values });
        },
        array(dimensions = 1) {
            config.$array = true;
            config.$dimensions = dimensions;
            return Object.assign(this, { $array: true, $dimensions: dimensions });
        },
        $type() {
            return this;
        },
        length(len) {
            config.$length = len;
            const baseType = config.$type.replace(/\(\d+\)/, '');
            config.$type = `${baseType}(${len})`;
            return Object.assign(this, { $length: len, $type: config.$type, $sqlType: config.$type });
        },
        precision(p) {
            config.$precision = p;
            const base = config.$type.replace(/\([\d,\s]+\)/, '');
            config.$type = config.$scale !== undefined
                ? `${base}(${p}, ${config.$scale})`
                : `${base}(${p})`;
            return Object.assign(this, { $precision: p, $type: config.$type, $sqlType: config.$type });
        },
        scale(s) {
            config.$scale = s;
            const base = config.$type.replace(/\([\d,\s]+\)/, '');
            config.$type = config.$precision !== undefined
                ? `${base}(${config.$precision}, ${s})`
                : `${base}(38, ${s})`;
            return Object.assign(this, { $scale: s, $type: config.$type, $sqlType: config.$type });
        },
        withTimezone() {
            config.$withTimezone = true;
            if (config.$type === 'TIMESTAMP') {
                config.$type = 'TIMESTAMPTZ';
            }
            else if (config.$type === 'TIME') {
                config.$type = 'TIMETZ';
            }
            return Object.assign(this, { $withTimezone: true, $type: config.$type, $sqlType: config.$type });
        },
        dimensions(d) {
            config.$dimensions = d;
            config.$type = `VECTOR(${d})`;
            return Object.assign(this, { $dimensions: d, $type: config.$type, $sqlType: config.$type });
        },
        comment(text) {
            config.$comment = text;
            return Object.assign(this, { $comment: text });
        },
        $id(trackingId) {
            config.$trackingId = trackingId;
            return Object.assign(this, { $trackingId: trackingId });
        },
        generatedAlwaysAsIdentity(options) {
            config.$identity = { always: true, options };
            return Object.assign(this, { $identity: { always: true, options } });
        },
        generatedByDefaultAsIdentity(options) {
            config.$identity = { always: false, options };
            return Object.assign(this, { $identity: { always: false, options } });
        },
        collate(collation) {
            config.$collate = collation;
            return Object.assign(this, { $collate: collation });
        }
    };
    return builder;
}
function createColumnWithName(type, columnName) {
    const col = createColumn(type);
    if (columnName) {
        col.$columnName = columnName;
    }
    return col;
}
