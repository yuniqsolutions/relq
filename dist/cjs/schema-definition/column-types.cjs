"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.json = exports.xml = exports.uuid = exports.tsquery = exports.tsvector = exports.varbit = exports.bitVarying = exports.bit = exports.macaddr8 = exports.macaddr = exports.inet = exports.cidr = exports.circle = exports.polygon = exports.path = exports.box = exports.lseg = exports.line = exports.point = exports.bool = exports.boolean = exports.timeWithTimeZone = exports.date = exports.timestampWithTimeZone = exports.bytea = exports.text = exports.character = exports.characterVarying = exports.money = exports.float8 = exports.doublePrecision = exports.float4 = exports.real = exports.numeric = exports.decimal = exports.serial8 = exports.bigserial = exports.serial2 = exports.smallserial = exports.serial4 = exports.serial = exports.int8 = exports.bigint = exports.int2 = exports.smallint = exports.int4 = exports.int = exports.integer = exports.EMPTY_ARRAY = exports.EMPTY_OBJECT = void 0;
exports.index = exports.raw = exports.emptyArray = exports.emptyObject = exports.currentDate = exports.currentTimestamp = exports.now = exports.uuidV4 = exports.genRandomUuid = exports.compositeType = exports.enumType = exports.customType = exports.box3d = exports.box2d = exports.geoPoint = exports.geography = exports.geometry = exports.semver = exports.cube = exports.hstore = exports.ltxtquery = exports.lquery = exports.ltree = exports.citext = exports.pgSnapshot = exports.pgLsn = exports.regtype = exports.regproc = exports.regclass = exports.oid = exports.datemultirange = exports.tstzmultirange = exports.tsmultirange = exports.nummultirange = exports.int8multirange = exports.int4multirange = exports.daterange = exports.tstzrange = exports.tsrange = exports.numrange = exports.int8range = exports.int4range = exports.jsonb = void 0;
exports.varchar = varchar;
exports.char = char;
exports.timestamp = timestamp;
exports.timestamptz = timestamptz;
exports.time = time;
exports.timetz = timetz;
exports.interval = interval;
exports.pgDomain = pgDomain;
exports.generateDomainSQL = generateDomainSQL;
exports.pgComposite = pgComposite;
exports.generateCompositeTypeSQL = generateCompositeTypeSQL;
exports.sql = sql;
exports.EMPTY_OBJECT = Symbol.for('relq:emptyObject');
exports.EMPTY_ARRAY = Symbol.for('relq:emptyArray');
function formatGenValue(val) {
    if (val === null)
        return 'NULL';
    if (typeof val === 'number')
        return String(val);
    if (typeof val === 'string')
        return `'${val.replace(/'/g, "''")}'`;
    return val.$sql;
}
function chainableExpr(sql) {
    const expr = {
        $sql: sql,
        $expr: true,
        add(value) { return chainableExpr(`(${this.$sql} + ${formatGenValue(value)})`); },
        plus(value) { return this.add(value); },
        subtract(value) { return chainableExpr(`(${this.$sql} - ${formatGenValue(value)})`); },
        minus(value) { return this.subtract(value); },
        multiply(value) { return chainableExpr(`(${this.$sql} * ${formatGenValue(value)})`); },
        times(value) { return this.multiply(value); },
        divide(value) { return chainableExpr(`(${this.$sql} / ${formatGenValue(value)})`); },
        dividedBy(value) { return this.divide(value); },
        mod(value) { return chainableExpr(`(${this.$sql} % ${formatGenValue(value)})`); },
        concat(...args) {
            const allParts = [this.$sql, ...args.map(formatGenValue)];
            return chainableExpr(`CONCAT(${allParts.join(', ')})`);
        },
    };
    return expr;
}
function createCaseBuilder() {
    const whens = [];
    let elseResult = null;
    const builder = {
        when(condition, result) {
            const condSql = typeof condition === 'string' ? condition : condition.$sql;
            whens.push({ condition: condSql, result: formatGenValue(result) });
            return builder;
        },
        else(result) {
            elseResult = formatGenValue(result);
            return this.end();
        },
        end() {
            let sql = 'CASE';
            for (const w of whens) {
                sql += ` WHEN ${w.condition} THEN ${w.result}`;
            }
            if (elseResult !== null) {
                sql += ` ELSE ${elseResult}`;
            }
            sql += ' END';
            return chainableExpr(sql);
        },
    };
    return builder;
}
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
};
const generatedFn = new Proxy(function (col) {
    return chainableExpr(col.$sql);
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
        check(...values) {
            if (values.length === 1 && /[<>=!()&|+\-*/ ]/.test(values[0])) {
                config.$check = values[0];
                return Object.assign(this, { $check: values[0] });
            }
            const expression = `IN ('${values.join("', '")}')`;
            config.$checkValues = values;
            config.$check = expression;
            return Object.assign(this, { $check: expression, $checkValues: values });
        },
        checkNot(...values) {
            const expression = `NOT IN ('${values.join("', '")}')`;
            config.$checkNotValues = values;
            config.$checkNot = expression;
            return Object.assign(this, { $checkNot: expression, $checkNotValues: values });
        },
        generatedAs(expression, stored = true) {
            config.$generated = { expression, stored };
            return Object.assign(this, { $generated: config.$generated });
        },
        generatedAlwaysAs(callback, options) {
            const tableProxy = new Proxy({}, {
                get(_target, prop) {
                    return chainableExpr(`"${prop}"`);
                }
            });
            const result = callback(tableProxy, generatedFn);
            const stored = options?.stored !== false;
            config.$generated = { expression: result.$sql, stored };
            return Object.assign(this, { $generated: config.$generated });
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
            return Object.assign(this, { $length: len, $type: config.$type });
        },
        precision(p) {
            config.$precision = p;
            const base = config.$type.replace(/\([\d,\s]+\)/, '');
            config.$type = config.$scale !== undefined
                ? `${base}(${p}, ${config.$scale})`
                : `${base}(${p})`;
            return Object.assign(this, { $precision: p, $type: config.$type });
        },
        scale(s) {
            config.$scale = s;
            const base = config.$type.replace(/\([\d,\s]+\)/, '');
            config.$type = config.$precision !== undefined
                ? `${base}(${config.$precision}, ${s})`
                : `${base}(38, ${s})`;
            return Object.assign(this, { $scale: s, $type: config.$type });
        },
        withTimezone() {
            config.$withTimezone = true;
            if (config.$type === 'TIMESTAMP') {
                config.$type = 'TIMESTAMPTZ';
            }
            else if (config.$type === 'TIME') {
                config.$type = 'TIMETZ';
            }
            return Object.assign(this, { $withTimezone: true, $type: config.$type });
        },
        dimensions(d) {
            config.$dimensions = d;
            config.$type = `VECTOR(${d})`;
            return Object.assign(this, { $dimensions: d, $type: config.$type });
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
const integer = (columnName) => createColumnWithName('INTEGER', columnName);
exports.integer = integer;
exports.int = exports.integer;
exports.int4 = exports.integer;
const smallint = (columnName) => createColumnWithName('SMALLINT', columnName);
exports.smallint = smallint;
exports.int2 = exports.smallint;
const bigint = (columnName) => createColumnWithName('BIGINT', columnName);
exports.bigint = bigint;
exports.int8 = exports.bigint;
const serial = (columnName) => createColumnWithName('SERIAL', columnName);
exports.serial = serial;
exports.serial4 = exports.serial;
const smallserial = (columnName) => createColumnWithName('SMALLSERIAL', columnName);
exports.smallserial = smallserial;
exports.serial2 = exports.smallserial;
const bigserial = (columnName) => createColumnWithName('BIGSERIAL', columnName);
exports.bigserial = bigserial;
exports.serial8 = exports.bigserial;
const decimal = (columnNameOrOpts, scale) => {
    if (typeof columnNameOrOpts === 'string' && !columnNameOrOpts.includes('.')) {
        return createColumnWithName('DECIMAL', columnNameOrOpts);
    }
    if (typeof columnNameOrOpts === 'number') {
        const type = scale !== undefined
            ? `DECIMAL(${columnNameOrOpts}, ${scale})`
            : `DECIMAL(${columnNameOrOpts})`;
        return createColumn(type);
    }
    if (columnNameOrOpts && typeof columnNameOrOpts === 'object') {
        const type = columnNameOrOpts.precision !== undefined
            ? columnNameOrOpts.scale !== undefined
                ? `DECIMAL(${columnNameOrOpts.precision}, ${columnNameOrOpts.scale})`
                : `DECIMAL(${columnNameOrOpts.precision})`
            : 'DECIMAL';
        return createColumn(type);
    }
    return createColumn('DECIMAL');
};
exports.decimal = decimal;
exports.numeric = exports.decimal;
const real = (columnName) => createColumnWithName('REAL', columnName);
exports.real = real;
exports.float4 = exports.real;
const doublePrecision = (columnName) => createColumnWithName('DOUBLE PRECISION', columnName);
exports.doublePrecision = doublePrecision;
exports.float8 = exports.doublePrecision;
const money = (columnName) => createColumnWithName('MONEY', columnName);
exports.money = money;
function varchar(arg1, arg2) {
    if (arg1 === undefined) {
        return createColumn('VARCHAR');
    }
    if (typeof arg1 === 'number') {
        return createColumn(`VARCHAR(${arg1})`);
    }
    if (typeof arg1 === 'object') {
        const length = arg1.length;
        return createColumn(length ? `VARCHAR(${length})` : 'VARCHAR');
    }
    const length = arg2?.length;
    const col = createColumn(length ? `VARCHAR(${length})` : 'VARCHAR');
    col.$columnName = arg1;
    return col;
}
exports.characterVarying = varchar;
function char(arg1, arg2) {
    if (arg1 === undefined) {
        return createColumn('CHAR(1)');
    }
    if (typeof arg1 === 'number') {
        return createColumn(`CHAR(${arg1})`);
    }
    if (typeof arg1 === 'object') {
        const length = arg1.length ?? 1;
        return createColumn(`CHAR(${length})`);
    }
    const length = arg2?.length ?? 1;
    const col = createColumn(`CHAR(${length})`);
    col.$columnName = arg1;
    return col;
}
exports.character = char;
const text = (columnName) => createColumnWithName('TEXT', columnName);
exports.text = text;
const bytea = (columnName) => createColumnWithName('BYTEA', columnName);
exports.bytea = bytea;
function timestamp(arg1, arg2) {
    if (typeof arg1 === 'string') {
        const opts = arg2;
        const base = opts?.withTimezone ? 'TIMESTAMPTZ' : 'TIMESTAMP';
        const type = opts?.precision !== undefined ? `${base}(${opts.precision})` : base;
        const col = createColumn(type);
        col.$columnName = arg1;
        return col;
    }
    if (typeof arg1 === 'number') {
        return createColumn(`TIMESTAMP(${arg1})`);
    }
    if (arg1 && typeof arg1 === 'object') {
        const base = arg1.withTimezone ? 'TIMESTAMPTZ' : 'TIMESTAMP';
        if (arg1.precision !== undefined) {
            return createColumn(`${base}(${arg1.precision})`);
        }
        return createColumn(base);
    }
    return createColumn('TIMESTAMP');
}
function timestamptz(arg1, arg2) {
    if (typeof arg1 === 'string') {
        const opts = arg2;
        const type = opts?.precision !== undefined ? `TIMESTAMPTZ(${opts.precision})` : 'TIMESTAMPTZ';
        const col = createColumn(type);
        col.$columnName = arg1;
        return col;
    }
    if (typeof arg1 === 'number') {
        return createColumn(`TIMESTAMPTZ(${arg1})`);
    }
    if (arg1 && typeof arg1 === 'object' && arg1.precision !== undefined) {
        return createColumn(`TIMESTAMPTZ(${arg1.precision})`);
    }
    return createColumn('TIMESTAMPTZ');
}
exports.timestampWithTimeZone = timestamptz;
const date = (columnName) => createColumnWithName('DATE', columnName);
exports.date = date;
function time(arg1, arg2) {
    if (typeof arg1 === 'string') {
        const opts = arg2;
        const base = opts?.withTimezone ? 'TIMETZ' : 'TIME';
        const type = opts?.precision !== undefined ? `${base}(${opts.precision})` : base;
        return createColumnWithName(type, arg1);
    }
    if (arg1 && typeof arg1 === 'object') {
        const base = arg1.withTimezone ? 'TIMETZ' : 'TIME';
        if (arg1.precision !== undefined) {
            return createColumn(`${base}(${arg1.precision})`);
        }
        return createColumn(base);
    }
    return createColumn('TIME');
}
function timetz(arg1, arg2) {
    if (typeof arg1 === 'string') {
        const opts = arg2;
        const type = opts?.precision !== undefined ? `TIMETZ(${opts.precision})` : 'TIMETZ';
        return createColumnWithName(type, arg1);
    }
    if (arg1 && typeof arg1 === 'object' && arg1.precision !== undefined) {
        return createColumn(`TIMETZ(${arg1.precision})`);
    }
    return createColumn('TIMETZ');
}
exports.timeWithTimeZone = timetz;
function interval(arg1, arg2) {
    if (arg1 && !arg1.includes(' ') && arg2 !== undefined) {
        const type = arg2 ? `INTERVAL ${arg2}` : 'INTERVAL';
        return createColumnWithName(type, arg1);
    }
    if (arg1 && !arg1.includes(' ') && arg2 === undefined) {
        const validFields = ['YEAR', 'MONTH', 'DAY', 'HOUR', 'MINUTE', 'SECOND'];
        const isField = validFields.some(f => arg1.toUpperCase().startsWith(f));
        if (isField) {
            return createColumn(`INTERVAL ${arg1}`);
        }
        return createColumnWithName('INTERVAL', arg1);
    }
    if (arg1) {
        return createColumn(`INTERVAL ${arg1}`);
    }
    return createColumn('INTERVAL');
}
const boolean = (columnName) => createColumnWithName('BOOLEAN', columnName);
exports.boolean = boolean;
exports.bool = exports.boolean;
const point = (columnName) => createColumnWithName('POINT', columnName);
exports.point = point;
const line = (columnName) => createColumnWithName('LINE', columnName);
exports.line = line;
const lseg = (columnName) => createColumnWithName('LSEG', columnName);
exports.lseg = lseg;
const box = (columnName) => createColumnWithName('BOX', columnName);
exports.box = box;
const path = (columnName) => createColumnWithName('PATH', columnName);
exports.path = path;
const polygon = (columnName) => createColumnWithName('POLYGON', columnName);
exports.polygon = polygon;
const circle = (columnName) => createColumnWithName('CIRCLE', columnName);
exports.circle = circle;
const cidr = (columnName) => createColumnWithName('CIDR', columnName);
exports.cidr = cidr;
const inet = (columnName) => createColumnWithName('INET', columnName);
exports.inet = inet;
const macaddr = (columnName) => createColumnWithName('MACADDR', columnName);
exports.macaddr = macaddr;
const macaddr8 = (columnName) => createColumnWithName('MACADDR8', columnName);
exports.macaddr8 = macaddr8;
const bit = (length) => createColumn(length ? `BIT(${length})` : 'BIT(1)');
exports.bit = bit;
const bitVarying = (length) => createColumn(length ? `BIT VARYING(${length})` : 'BIT VARYING');
exports.bitVarying = bitVarying;
exports.varbit = exports.bitVarying;
const tsvector = (columnName) => createColumnWithName('TSVECTOR', columnName);
exports.tsvector = tsvector;
const tsquery = (columnName) => createColumnWithName('TSQUERY', columnName);
exports.tsquery = tsquery;
const uuid = (columnName) => createColumnWithName('UUID', columnName);
exports.uuid = uuid;
const xml = (columnName) => createColumnWithName('XML', columnName);
exports.xml = xml;
const json = (columnName) => createColumnWithName('JSON', columnName);
exports.json = json;
const jsonb = (columnName) => createColumnWithName('JSONB', columnName);
exports.jsonb = jsonb;
const int4range = () => createColumn('INT4RANGE');
exports.int4range = int4range;
const int8range = () => createColumn('INT8RANGE');
exports.int8range = int8range;
const numrange = () => createColumn('NUMRANGE');
exports.numrange = numrange;
const tsrange = () => createColumn('TSRANGE');
exports.tsrange = tsrange;
const tstzrange = () => createColumn('TSTZRANGE');
exports.tstzrange = tstzrange;
const daterange = () => createColumn('DATERANGE');
exports.daterange = daterange;
const int4multirange = () => createColumn('INT4MULTIRANGE');
exports.int4multirange = int4multirange;
const int8multirange = () => createColumn('INT8MULTIRANGE');
exports.int8multirange = int8multirange;
const nummultirange = () => createColumn('NUMMULTIRANGE');
exports.nummultirange = nummultirange;
const tsmultirange = () => createColumn('TSMULTIRANGE');
exports.tsmultirange = tsmultirange;
const tstzmultirange = () => createColumn('TSTZMULTIRANGE');
exports.tstzmultirange = tstzmultirange;
const datemultirange = () => createColumn('DATEMULTIRANGE');
exports.datemultirange = datemultirange;
const oid = () => createColumn('OID');
exports.oid = oid;
const regclass = () => createColumn('REGCLASS');
exports.regclass = regclass;
const regproc = () => createColumn('REGPROC');
exports.regproc = regproc;
const regtype = () => createColumn('REGTYPE');
exports.regtype = regtype;
const pgLsn = () => createColumn('PG_LSN');
exports.pgLsn = pgLsn;
const pgSnapshot = () => createColumn('PG_SNAPSHOT');
exports.pgSnapshot = pgSnapshot;
const citext = (columnName) => createColumnWithName('CITEXT', columnName);
exports.citext = citext;
const ltree = (columnName) => createColumnWithName('LTREE', columnName);
exports.ltree = ltree;
const lquery = (columnName) => createColumnWithName('LQUERY', columnName);
exports.lquery = lquery;
const ltxtquery = (columnName) => createColumnWithName('LTXTQUERY', columnName);
exports.ltxtquery = ltxtquery;
const hstore = (columnName) => createColumnWithName('HSTORE', columnName);
exports.hstore = hstore;
const cube = (columnName) => createColumnWithName('CUBE', columnName);
exports.cube = cube;
const semver = (columnName) => createColumnWithName('SEMVER', columnName);
exports.semver = semver;
const geometry = (columnName, srid, geometryType) => {
    let typeName = 'GEOMETRY';
    if (geometryType && srid) {
        typeName = `GEOMETRY(${geometryType}, ${srid})`;
    }
    else if (geometryType) {
        typeName = `GEOMETRY(${geometryType})`;
    }
    else if (srid) {
        typeName = `GEOMETRY(GEOMETRY, ${srid})`;
    }
    return createColumnWithName(typeName, columnName);
};
exports.geometry = geometry;
const geography = (columnName, srid = 4326, geometryType) => {
    let typeName = 'GEOGRAPHY';
    if (geometryType) {
        typeName = `GEOGRAPHY(${geometryType}, ${srid})`;
    }
    else {
        typeName = `GEOGRAPHY(GEOMETRY, ${srid})`;
    }
    return createColumnWithName(typeName, columnName);
};
exports.geography = geography;
const geoPoint = (columnName, srid = 4326) => {
    return createColumnWithName(`GEOMETRY(POINT, ${srid})`, columnName);
};
exports.geoPoint = geoPoint;
const box2d = (columnName) => createColumnWithName('BOX2D', columnName);
exports.box2d = box2d;
const box3d = (columnName) => createColumnWithName('BOX3D', columnName);
exports.box3d = box3d;
function createDomainCheckCondition(sql, validate, name) {
    return {
        $sql: sql,
        $name: name,
        $validate: validate,
        and(other) {
            return createDomainCheckCondition(`(${this.$sql}) AND (${other.$sql})`, (val) => this.$validate(val) && other.$validate(val), this.$name || other.$name);
        },
        or(other) {
            return createDomainCheckCondition(`(${this.$sql}) OR (${other.$sql})`, (val) => this.$validate(val) || other.$validate(val), this.$name || other.$name);
        },
        as(constraintName) {
            return createDomainCheckCondition(this.$sql, this.$validate, constraintName);
        },
    };
}
function formatDomainValue(val) {
    if (val === null)
        return 'NULL';
    if (typeof val === 'number')
        return String(val);
    if (typeof val === 'boolean')
        return val ? 'TRUE' : 'FALSE';
    if (typeof val === 'string')
        return `'${val.replace(/'/g, "''")}'`;
    return String(val);
}
function createDomainValueExpr() {
    return {
        eq(value) {
            return createDomainCheckCondition(`VALUE = ${formatDomainValue(value)}`, (val) => val === value);
        },
        neq(value) {
            return createDomainCheckCondition(`VALUE <> ${formatDomainValue(value)}`, (val) => val !== value);
        },
        gt(value) {
            return createDomainCheckCondition(`VALUE > ${formatDomainValue(value)}`, (val) => val > value);
        },
        gte(value) {
            return createDomainCheckCondition(`VALUE >= ${formatDomainValue(value)}`, (val) => val >= value);
        },
        lt(value) {
            return createDomainCheckCondition(`VALUE < ${formatDomainValue(value)}`, (val) => val < value);
        },
        lte(value) {
            return createDomainCheckCondition(`VALUE <= ${formatDomainValue(value)}`, (val) => val <= value);
        },
        between(min, max) {
            return createDomainCheckCondition(`${formatDomainValue(min)} AND ${formatDomainValue(max)}`, (val) => val >= min && val <= max);
        },
        in(values) {
            const formatted = values.map(formatDomainValue).join(', ');
            return createDomainCheckCondition(`VALUE IN (${formatted})`, (val) => values.includes(val));
        },
        notIn(values) {
            const formatted = values.map(formatDomainValue).join(', ');
            return createDomainCheckCondition(`VALUE NOT IN (${formatted})`, (val) => !values.includes(val));
        },
        isNull() {
            return createDomainCheckCondition(`VALUE IS NULL`, (val) => val === null);
        },
        isNotNull() {
            return createDomainCheckCondition(`VALUE IS NOT NULL`, (val) => val !== null);
        },
        like(pattern) {
            try {
                const regex = new RegExp('^' + pattern.replace(/%/g, '.*').replace(/_/g, '.') + '$');
                return createDomainCheckCondition(`VALUE LIKE ${formatDomainValue(pattern)}`, (val) => typeof val === 'string' && regex.test(val));
            }
            catch (e) {
                throw new Error(`[Relq] Invalid LIKE pattern in domain: "${pattern}". ${e instanceof Error ? e.message : String(e)}`);
            }
        },
        notLike(pattern) {
            try {
                const regex = new RegExp('^' + pattern.replace(/%/g, '.*').replace(/_/g, '.') + '$');
                return createDomainCheckCondition(`VALUE NOT LIKE ${formatDomainValue(pattern)}`, (val) => typeof val === 'string' && !regex.test(val));
            }
            catch (e) {
                throw new Error(`[Relq] Invalid NOT LIKE pattern in domain: "${pattern}". ${e instanceof Error ? e.message : String(e)}`);
            }
        },
        ilike(pattern) {
            try {
                const regex = new RegExp('^' + pattern.replace(/%/g, '.*').replace(/_/g, '.') + '$', 'i');
                return createDomainCheckCondition(`VALUE ILIKE ${formatDomainValue(pattern)}`, (val) => typeof val === 'string' && regex.test(val));
            }
            catch (e) {
                throw new Error(`[Relq] Invalid ILIKE pattern in domain: "${pattern}". ${e instanceof Error ? e.message : String(e)}`);
            }
        },
        notIlike(pattern) {
            try {
                const regex = new RegExp('^' + pattern.replace(/%/g, '.*').replace(/_/g, '.') + '$', 'i');
                return createDomainCheckCondition(`VALUE NOT ILIKE ${formatDomainValue(pattern)}`, (val) => typeof val === 'string' && !regex.test(val));
            }
            catch (e) {
                throw new Error(`[Relq] Invalid NOT ILIKE pattern in domain: "${pattern}". ${e instanceof Error ? e.message : String(e)}`);
            }
        },
        matches(regex) {
            try {
                const re = new RegExp(regex, 'i');
                return createDomainCheckCondition(`VALUE ~* ${formatDomainValue(regex)}`, (val) => typeof val === 'string' && re.test(val));
            }
            catch (e) {
                throw new Error(`[Relq] Invalid regex pattern in domain matches(): "${regex}". Tip: Use double backslashes (\\\\d instead of \\d) in string literals. ${e instanceof Error ? e.message : String(e)}`);
            }
        },
        matchesCaseSensitive(regex) {
            try {
                const re = new RegExp(regex);
                return createDomainCheckCondition(`VALUE ~ ${formatDomainValue(regex)}`, (val) => typeof val === 'string' && re.test(val));
            }
            catch (e) {
                throw new Error(`[Relq] Invalid regex pattern in domain matchesCaseSensitive(): "${regex}". Tip: Use double backslashes (\\\\d instead of \\d) in string literals. ${e instanceof Error ? e.message : String(e)}`);
            }
        },
        lengthGt(n) {
            return createDomainCheckCondition(`LENGTH(VALUE) > ${n}`, (val) => typeof val === 'string' && val.length > n);
        },
        lengthGte(n) {
            return createDomainCheckCondition(`LENGTH(VALUE) >= ${n}`, (val) => typeof val === 'string' && val.length >= n);
        },
        lengthLt(n) {
            return createDomainCheckCondition(`LENGTH(VALUE) < ${n}`, (val) => typeof val === 'string' && val.length < n);
        },
        lengthLte(n) {
            return createDomainCheckCondition(`LENGTH(VALUE) <= ${n}`, (val) => typeof val === 'string' && val.length <= n);
        },
        lengthEq(n) {
            return createDomainCheckCondition(`LENGTH(VALUE) = ${n}`, (val) => typeof val === 'string' && val.length === n);
        },
    };
}
function pgDomain(name, baseType, checks) {
    const config = baseType.$config;
    const baseTypeStr = config?.$type || 'TEXT';
    const constraints = [];
    let validateFn;
    if (checks) {
        const valueExpr = createDomainValueExpr();
        const conditions = checks(valueExpr);
        for (const cond of conditions) {
            if (cond.$name) {
                constraints.push(`CONSTRAINT ${cond.$name} CHECK (${cond.$sql})`);
            }
            else {
                constraints.push(`CHECK (${cond.$sql})`);
            }
            const currentValidate = cond.$validate;
            if (!validateFn) {
                validateFn = currentValidate;
            }
            else {
                const prev = validateFn;
                validateFn = (val) => prev(val) && currentValidate(val);
            }
        }
    }
    const notNull = config?.$nullable === false;
    const defaultValue = config?.$default;
    const domainFn = (columnName) => {
        const col = createColumnWithName(name, columnName);
        if (validateFn) {
            col.$validate = validateFn;
        }
        return col;
    };
    Object.assign(domainFn, {
        $domainName: name,
        $baseType: baseTypeStr,
        $constraints: constraints.length > 0 ? constraints : undefined,
        $domainDefault: defaultValue,
        $notNull: notNull,
        $columnBuilder: baseType,
        $validate: validateFn,
    });
    return domainFn;
}
function generateDomainSQL(domain) {
    let sql = `CREATE DOMAIN "${domain.$domainName}" AS ${domain.$baseType}`;
    if (domain.$collation) {
        sql += ` COLLATE "${domain.$collation}"`;
    }
    if (domain.$domainDefault !== undefined) {
        sql += ` DEFAULT ${typeof domain.$domainDefault === 'string' ? `'${domain.$domainDefault}'` : domain.$domainDefault}`;
    }
    if (domain.$constraints) {
        sql += ' ' + domain.$constraints.join(' ');
    }
    return sql + ';';
}
function pgComposite(name, fields) {
    const compositeFn = (columnName) => {
        const col = createColumnWithName(name, columnName);
        col.$fields = fields;
        return col;
    };
    Object.assign(compositeFn, {
        $typeName: name,
        $fields: fields,
        $inferType: {},
    });
    return compositeFn;
}
function generateCompositeTypeSQL(composite) {
    const fieldDefs = [];
    for (const [fieldName, fieldConfig] of Object.entries(composite.$fields)) {
        const config = fieldConfig;
        let fieldDef = `"${fieldName}" ${config.$type}`;
        if (config.$nullable === false) {
            fieldDef += ' NOT NULL';
        }
        fieldDefs.push(fieldDef);
    }
    return `CREATE TYPE "${composite.$typeName}" AS (\n  ${fieldDefs.join(',\n  ')}\n);`;
}
const customType = (typeName, columnName) => createColumnWithName(typeName, columnName);
exports.customType = customType;
const enumType = (name, values, columnName) => {
    const col = createColumnWithName(name, columnName);
    col.$enumValues = values;
    return col;
};
exports.enumType = enumType;
const compositeType = (typeName, columnName) => createColumnWithName(typeName, columnName);
exports.compositeType = compositeType;
function sqlExpr(sql) {
    const branded = Object.create(null);
    Object.defineProperty(branded, '$sql', { value: sql, enumerable: false });
    return branded;
}
const genRandomUuid = () => sqlExpr('gen_random_uuid()');
exports.genRandomUuid = genRandomUuid;
const uuidV4 = () => sqlExpr('uuid_generate_v4()');
exports.uuidV4 = uuidV4;
const now = () => sqlExpr('NOW()');
exports.now = now;
const currentTimestamp = () => sqlExpr('CURRENT_TIMESTAMP');
exports.currentTimestamp = currentTimestamp;
const currentDate = () => sqlExpr('CURRENT_DATE');
exports.currentDate = currentDate;
const emptyObject = () => sqlExpr("'{}'");
exports.emptyObject = emptyObject;
const emptyArray = () => sqlExpr("'[]'");
exports.emptyArray = emptyArray;
function sql(strings, ...values) {
    let result = strings[0];
    for (let i = 0; i < values.length; i++) {
        result += String(values[i]) + strings[i + 1];
    }
    return sqlExpr(result);
}
const raw = (expression) => sqlExpr(expression);
exports.raw = raw;
const index = (name) => ({
    name,
    on: (...columns) => ({
        name,
        columns,
        unique() { return { name, columns, unique: true, isUnique: true }; },
        using(method) {
            return { name, columns, using: method, method };
        },
    }),
});
exports.index = index;
