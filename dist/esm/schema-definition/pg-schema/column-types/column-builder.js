import { createCaseBuilder, chainableExpr, formatGenValue } from "./expression-builder.js";
const generatedFnMethods = {
    lower: (col) => chainableExpr(`LOWER(${col.$sql})`),
    upper: (col) => chainableExpr(`UPPER(${col.$sql})`),
    trim: (col) => chainableExpr(`TRIM(${col.$sql})`),
    ltrim: (col) => chainableExpr(`LTRIM(${col.$sql})`),
    rtrim: (col) => chainableExpr(`RTRIM(${col.$sql})`),
    length: (col) => chainableExpr(`LENGTH(${col.$sql})`),
    substring: (col, start, length) => length !== undefined
        ? chainableExpr(`SUBSTRING(${col.$sql} FROM ${start} FOR ${length})`)
        : chainableExpr(`SUBSTRING(${col.$sql} FROM ${start})`),
    concat: (...args) => chainableExpr(`CONCAT(${args.map(formatGenValue).join(', ')})`),
    replace: (col, from, to) => chainableExpr(`REPLACE(${col.$sql}, '${from}', '${to}')`),
    left: (col, n) => chainableExpr(`LEFT(${col.$sql}, ${n})`),
    right: (col, n) => chainableExpr(`RIGHT(${col.$sql}, ${n})`),
    abs: (col) => chainableExpr(`ABS(${col.$sql})`),
    ceil: (col) => chainableExpr(`CEIL(${col.$sql})`),
    floor: (col) => chainableExpr(`FLOOR(${col.$sql})`),
    round: (col, decimals) => decimals !== undefined
        ? chainableExpr(`ROUND(${col.$sql}, ${decimals})`)
        : chainableExpr(`ROUND(${col.$sql})`),
    trunc: (col, decimals) => decimals !== undefined
        ? chainableExpr(`TRUNC(${col.$sql}, ${decimals})`)
        : chainableExpr(`TRUNC(${col.$sql})`),
    sign: (col) => chainableExpr(`SIGN(${col.$sql})`),
    power: (col, exponent) => chainableExpr(`POWER(${col.$sql}, ${exponent})`),
    sqrt: (col) => chainableExpr(`SQRT(${col.$sql})`),
    exp: (col) => chainableExpr(`EXP(${col.$sql})`),
    ln: (col) => chainableExpr(`LN(${col.$sql})`),
    log: (col, base) => base !== undefined
        ? chainableExpr(`LOG(${base}, ${col.$sql})`)
        : chainableExpr(`LOG(${col.$sql})`),
    greatest: (...args) => chainableExpr(`GREATEST(${args.map(formatGenValue).join(', ')})`),
    least: (...args) => chainableExpr(`LEAST(${args.map(formatGenValue).join(', ')})`),
    add: (a, b) => chainableExpr(`(${formatGenValue(a)} + ${formatGenValue(b)})`),
    subtract: (a, b) => chainableExpr(`(${formatGenValue(a)} - ${formatGenValue(b)})`),
    multiply: (a, b) => chainableExpr(`(${formatGenValue(a)} * ${formatGenValue(b)})`),
    divide: (a, b) => chainableExpr(`(${formatGenValue(a)} / ${formatGenValue(b)})`),
    mod: (a, b) => chainableExpr(`(${formatGenValue(a)} % ${formatGenValue(b)})`),
    asText: (col) => chainableExpr(`(${col.$sql})::TEXT`),
    asInteger: (col) => chainableExpr(`(${col.$sql})::INTEGER`),
    asNumeric: (col) => chainableExpr(`(${col.$sql})::NUMERIC`),
    asBoolean: (col) => chainableExpr(`(${col.$sql})::BOOLEAN`),
    asDate: (col) => chainableExpr(`(${col.$sql})::DATE`),
    asTimestamp: (col) => chainableExpr(`(${col.$sql})::TIMESTAMP`),
    coalesce: (...args) => chainableExpr(`COALESCE(${args.map(formatGenValue).join(', ')})`),
    nullif: (col, value) => chainableExpr(`NULLIF(${col.$sql}, ${formatGenValue(value)})`),
    ifNull: (col, defaultValue) => chainableExpr(`COALESCE(${col.$sql}, ${formatGenValue(defaultValue)})`),
    case: () => createCaseBuilder(),
    jsonExtract: (col, path) => chainableExpr(`${col.$sql}->'${path}'`),
    jsonExtractText: (col, path) => chainableExpr(`${col.$sql}->>'${path}'`),
    jsonbExtract: (col, path) => chainableExpr(`${col.$sql}->'${path}'`),
    jsonbExtractText: (col, path) => chainableExpr(`${col.$sql}->>'${path}'`),
    jsonArrayLength: (col) => chainableExpr(`JSONB_ARRAY_LENGTH(${col.$sql})`),
    extract: (field, col) => chainableExpr(`EXTRACT(${field.toUpperCase()} FROM ${col.$sql})`),
    datePart: (field, col) => chainableExpr(`DATE_PART('${field}', ${col.$sql})`),
    age: (col1, col2) => chainableExpr(`AGE(${col1.$sql}, ${col2.$sql})`),
    toTsvector: (config, col) => chainableExpr(`TO_TSVECTOR('${config}', ${col.$sql})`),
    similarity: (col1, col2) => chainableExpr(`SIMILARITY(${col1.$sql}, ${formatGenValue(col2)})`),
    point: (x, y) => chainableExpr(`POINT(${formatGenValue(x)}, ${formatGenValue(y)})`),
    arrayLength: (col, dim = 1) => chainableExpr(`ARRAY_LENGTH(${col.$sql}, ${dim})`),
    arrayPosition: (arr, elem) => chainableExpr(`ARRAY_POSITION(${arr.$sql}, ${formatGenValue(elem)})`),
    md5: (col) => chainableExpr(`MD5(${col.$sql})`),
    sha256: (col) => chainableExpr(`ENCODE(SHA256(${col.$sql}::BYTEA), 'hex')`),
    col: (name, alias) => chainableExpr(alias ? `"${alias}"."${name}"` : `"${name}"`),
    cast: (value, typeName) => chainableExpr(`(${formatGenValue(value)})::${typeName}`),
    func: (name, ...args) => chainableExpr(`${name.toUpperCase()}(${args.map(formatGenValue).join(', ')})`),
    sql: (expression) => chainableExpr(expression),
    raw: (expression) => chainableExpr(expression),
    op: (left, operator, right) => chainableExpr(`(${formatGenValue(left)} ${operator} ${formatGenValue(right)})`),
    setweight: (tsvector, weight) => chainableExpr(`SETWEIGHT(${tsvector.$sql}, '${weight}')`),
    setWeight: (tsvector, weight) => chainableExpr(`SETWEIGHT(${tsvector.$sql}, '${weight}')`),
    asVarchar: (col) => chainableExpr(`(${col.$sql})::VARCHAR`),
    textConcat: (left, right) => chainableExpr(`(${formatGenValue(left)} || ${formatGenValue(right)})`),
    tsMatch: (left, right) => chainableExpr(`(${left.$sql} @@ ${right.$sql})`),
    compare: (left, op, right) => chainableExpr(`(${formatGenValue(left)} ${op} ${formatGenValue(right)})`),
    regex: (value, op, pattern) => chainableExpr(`(${value.$sql} ${op} ${formatGenValue(pattern)})`),
    and: (...args) => chainableExpr(`(${args.map(a => a.$sql).join(' AND ')})`),
    or: (...args) => chainableExpr(`(${args.map(a => a.$sql).join(' OR ')})`),
    not: (arg) => chainableExpr(`(NOT ${arg.$sql})`),
    isNull: (col) => chainableExpr(`(${col.$sql} IS NULL)`),
    isNotNull: (col) => chainableExpr(`(${col.$sql} IS NOT NULL)`),
};
export const generatedFn = new Proxy(function (col) {
    return chainableExpr(col.$sql);
}, {
    get(target, prop) {
        if (prop in generatedFnMethods) {
            return generatedFnMethods[prop];
        }
        return Reflect.get(target, prop);
    }
});
export function createColumn(type) {
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
export function createColumnWithName(type, columnName) {
    const col = createColumn(type);
    if (columnName) {
        col.$columnName = columnName;
    }
    return col;
}
