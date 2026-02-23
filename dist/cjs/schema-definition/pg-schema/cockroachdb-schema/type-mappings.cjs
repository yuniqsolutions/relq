"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CRDB_TYPE_MAP = void 0;
exports.getTypeMapping = getTypeMapping;
exports.isTypeSupported = isTypeSupported;
exports.getUnsupportedTypesByCategory = getUnsupportedTypesByCategory;
exports.getTypesWithDifferences = getTypesWithDifferences;
exports.CRDB_TYPE_MAP = {
    integer: { pgType: 'INTEGER', status: 'supported', category: 'Numeric' },
    int: { pgType: 'INT', status: 'supported', category: 'Numeric' },
    int4: { pgType: 'INT4', status: 'supported', category: 'Numeric' },
    smallint: { pgType: 'SMALLINT', status: 'supported', category: 'Numeric' },
    int2: { pgType: 'INT2', status: 'supported', category: 'Numeric' },
    bigint: { pgType: 'BIGINT', status: 'supported', category: 'Numeric' },
    int8: { pgType: 'INT8', status: 'supported', category: 'Numeric' },
    decimal: { pgType: 'DECIMAL', status: 'supported', category: 'Numeric' },
    numeric: { pgType: 'NUMERIC', status: 'supported', category: 'Numeric' },
    real: { pgType: 'REAL', status: 'behavioral-difference', category: 'Numeric', errorCode: 'CRDB_W020', note: 'Overflow returns Infinity instead of error' },
    float4: { pgType: 'FLOAT4', status: 'behavioral-difference', category: 'Numeric', errorCode: 'CRDB_W020', note: 'Overflow returns Infinity instead of error' },
    'double precision': { pgType: 'DOUBLE PRECISION', status: 'behavioral-difference', category: 'Numeric', errorCode: 'CRDB_W020', note: 'Overflow returns Infinity instead of error' },
    float8: { pgType: 'FLOAT8', status: 'behavioral-difference', category: 'Numeric', errorCode: 'CRDB_W020', note: 'Overflow returns Infinity instead of error' },
    serial: { pgType: 'SERIAL', status: 'warning', category: 'Numeric', errorCode: 'CRDB_W001', alternative: 'uuid().default(sql`gen_random_uuid()`)', note: 'Uses unique_rowid() not sequences' },
    serial4: { pgType: 'SERIAL4', status: 'warning', category: 'Numeric', errorCode: 'CRDB_W001', alternative: 'uuid().default(sql`gen_random_uuid()`)', note: 'Uses unique_rowid() not sequences' },
    smallserial: { pgType: 'SMALLSERIAL', status: 'warning', category: 'Numeric', errorCode: 'CRDB_W002', alternative: 'uuid().default(sql`gen_random_uuid()`)', note: 'Uses unique_rowid() not sequences' },
    serial2: { pgType: 'SERIAL2', status: 'warning', category: 'Numeric', errorCode: 'CRDB_W002', alternative: 'uuid().default(sql`gen_random_uuid()`)', note: 'Uses unique_rowid() not sequences' },
    bigserial: { pgType: 'BIGSERIAL', status: 'warning', category: 'Numeric', errorCode: 'CRDB_W003', alternative: 'uuid().default(sql`gen_random_uuid()`)', note: 'Uses unique_rowid() not sequences' },
    serial8: { pgType: 'SERIAL8', status: 'warning', category: 'Numeric', errorCode: 'CRDB_W003', alternative: 'uuid().default(sql`gen_random_uuid()`)', note: 'Uses unique_rowid() not sequences' },
    money: { pgType: 'MONEY', status: 'unsupported', category: 'Numeric', errorCode: 'CRDB_E001', alternative: 'numeric({ precision: 19, scale: 4 })' },
    varchar: { pgType: 'VARCHAR', status: 'supported', category: 'Character' },
    'character varying': { pgType: 'CHARACTER VARYING', status: 'supported', category: 'Character' },
    char: { pgType: 'CHAR', status: 'supported', category: 'Character' },
    character: { pgType: 'CHARACTER', status: 'supported', category: 'Character' },
    text: { pgType: 'TEXT', status: 'supported', category: 'Character' },
    string: { pgType: 'STRING', status: 'supported', category: 'Character', note: 'CockroachDB alias for TEXT' },
    bytea: { pgType: 'BYTEA', status: 'supported', category: 'Binary', note: 'Also BYTES alias; ~1MB practical limit' },
    bytes: { pgType: 'BYTES', status: 'supported', category: 'Binary', note: 'CockroachDB alias for BYTEA' },
    timestamp: { pgType: 'TIMESTAMP', status: 'supported', category: 'DateTime' },
    timestamptz: { pgType: 'TIMESTAMPTZ', status: 'supported', category: 'DateTime' },
    'timestamp with time zone': { pgType: 'TIMESTAMP WITH TIME ZONE', status: 'supported', category: 'DateTime' },
    'timestamp without time zone': { pgType: 'TIMESTAMP WITHOUT TIME ZONE', status: 'supported', category: 'DateTime' },
    date: { pgType: 'DATE', status: 'supported', category: 'DateTime' },
    time: { pgType: 'TIME', status: 'supported', category: 'DateTime' },
    timetz: { pgType: 'TIMETZ', status: 'supported', category: 'DateTime' },
    'time with time zone': { pgType: 'TIME WITH TIME ZONE', status: 'supported', category: 'DateTime' },
    'time without time zone': { pgType: 'TIME WITHOUT TIME ZONE', status: 'supported', category: 'DateTime' },
    interval: { pgType: 'INTERVAL', status: 'supported', category: 'DateTime' },
    boolean: { pgType: 'BOOLEAN', status: 'supported', category: 'Boolean' },
    bool: { pgType: 'BOOL', status: 'supported', category: 'Boolean' },
    uuid: { pgType: 'UUID', status: 'supported', category: 'UUID', note: 'Recommended for distributed PKs' },
    json: { pgType: 'JSON', status: 'supported', category: 'JSON' },
    jsonb: { pgType: 'JSONB', status: 'supported', category: 'JSON' },
    inet: { pgType: 'INET', status: 'supported', category: 'Network' },
    cidr: { pgType: 'CIDR', status: 'unsupported', category: 'Network', errorCode: 'CRDB_E010', alternative: 'text() or varchar()' },
    macaddr: { pgType: 'MACADDR', status: 'unsupported', category: 'Network', errorCode: 'CRDB_E011', alternative: 'varchar({ length: 17 })' },
    macaddr8: { pgType: 'MACADDR8', status: 'unsupported', category: 'Network', errorCode: 'CRDB_E012', alternative: 'varchar({ length: 23 })' },
    bit: { pgType: 'BIT', status: 'supported', category: 'BitString' },
    'bit varying': { pgType: 'BIT VARYING', status: 'supported', category: 'BitString' },
    varbit: { pgType: 'VARBIT', status: 'supported', category: 'BitString' },
    point: { pgType: 'POINT', status: 'unsupported', category: 'Geometric', errorCode: 'CRDB_E003', alternative: 'GEOMETRY(Point, 4326) or jsonb()' },
    line: { pgType: 'LINE', status: 'unsupported', category: 'Geometric', errorCode: 'CRDB_E004', alternative: 'GEOMETRY(LineString, 4326)' },
    lseg: { pgType: 'LSEG', status: 'unsupported', category: 'Geometric', errorCode: 'CRDB_E005', alternative: 'GEOMETRY(LineString, 4326)' },
    box: { pgType: 'BOX', status: 'unsupported', category: 'Geometric', errorCode: 'CRDB_E006', alternative: 'GEOMETRY(Polygon, 4326)' },
    path: { pgType: 'PATH', status: 'unsupported', category: 'Geometric', errorCode: 'CRDB_E007', alternative: 'GEOMETRY(LineString, 4326)' },
    polygon: { pgType: 'POLYGON', status: 'unsupported', category: 'Geometric', errorCode: 'CRDB_E008', alternative: 'GEOMETRY(Polygon, 4326)' },
    circle: { pgType: 'CIRCLE', status: 'unsupported', category: 'Geometric', errorCode: 'CRDB_E009', alternative: 'GEOMETRY(Point, 4326) + radius column' },
    int4range: { pgType: 'INT4RANGE', status: 'unsupported', category: 'Range', errorCode: 'CRDB_E013', alternative: 'Two integer() columns (lower, upper)' },
    int8range: { pgType: 'INT8RANGE', status: 'unsupported', category: 'Range', errorCode: 'CRDB_E014', alternative: 'Two bigint() columns (lower, upper)' },
    numrange: { pgType: 'NUMRANGE', status: 'unsupported', category: 'Range', errorCode: 'CRDB_E015', alternative: 'Two numeric() columns (lower, upper)' },
    tsrange: { pgType: 'TSRANGE', status: 'unsupported', category: 'Range', errorCode: 'CRDB_E016', alternative: 'Two timestamp() columns (lower, upper)' },
    tstzrange: { pgType: 'TSTZRANGE', status: 'unsupported', category: 'Range', errorCode: 'CRDB_E017', alternative: 'Two timestamptz() columns (lower, upper)' },
    daterange: { pgType: 'DATERANGE', status: 'unsupported', category: 'Range', errorCode: 'CRDB_E018', alternative: 'Two date() columns (lower, upper)' },
    int4multirange: { pgType: 'INT4MULTIRANGE', status: 'unsupported', category: 'Multirange', errorCode: 'CRDB_E019', alternative: 'Multiple rows or JSONB array' },
    int8multirange: { pgType: 'INT8MULTIRANGE', status: 'unsupported', category: 'Multirange', errorCode: 'CRDB_E020', alternative: 'Multiple rows or JSONB array' },
    nummultirange: { pgType: 'NUMMULTIRANGE', status: 'unsupported', category: 'Multirange', errorCode: 'CRDB_E021', alternative: 'Multiple rows or JSONB array' },
    tsmultirange: { pgType: 'TSMULTIRANGE', status: 'unsupported', category: 'Multirange', errorCode: 'CRDB_E022', alternative: 'Multiple rows or JSONB array' },
    tstzmultirange: { pgType: 'TSTZMULTIRANGE', status: 'unsupported', category: 'Multirange', errorCode: 'CRDB_E023', alternative: 'Multiple rows or JSONB array' },
    datemultirange: { pgType: 'DATEMULTIRANGE', status: 'unsupported', category: 'Multirange', errorCode: 'CRDB_E024', alternative: 'Multiple rows or JSONB array' },
    tsvector: { pgType: 'TSVECTOR', status: 'unsupported', category: 'TextSearch', errorCode: 'CRDB_E025', alternative: 'Inverted indexes on text or JSONB' },
    tsquery: { pgType: 'TSQUERY', status: 'unsupported', category: 'TextSearch', errorCode: 'CRDB_E026', alternative: 'Application-layer search' },
    xml: { pgType: 'XML', status: 'unsupported', category: 'Document', errorCode: 'CRDB_E002', alternative: 'text()' },
    oid: { pgType: 'OID', status: 'unsupported', category: 'Internal', errorCode: 'CRDB_E027', alternative: 'integer() or bigint()' },
    regclass: { pgType: 'REGCLASS', status: 'unsupported', category: 'Internal', errorCode: 'CRDB_E028', alternative: 'text()' },
    regproc: { pgType: 'REGPROC', status: 'unsupported', category: 'Internal', errorCode: 'CRDB_E029', alternative: 'text()' },
    regtype: { pgType: 'REGTYPE', status: 'unsupported', category: 'Internal', errorCode: 'CRDB_E030', alternative: 'text()' },
    regnamespace: { pgType: 'REGNAMESPACE', status: 'unsupported', category: 'Internal', errorCode: 'CRDB_E030', alternative: 'text()' },
    regrole: { pgType: 'REGROLE', status: 'unsupported', category: 'Internal', errorCode: 'CRDB_E030', alternative: 'text()' },
    pg_lsn: { pgType: 'PG_LSN', status: 'unsupported', category: 'Internal', errorCode: 'CRDB_E031', alternative: 'Not applicable in CockroachDB' },
    pg_snapshot: { pgType: 'PG_SNAPSHOT', status: 'unsupported', category: 'Internal', errorCode: 'CRDB_E032', alternative: 'Not applicable in CockroachDB' },
    vector: { pgType: 'VECTOR', status: 'unsupported', category: 'Extension', alternative: 'Use C-SPANN vector index on CockroachDB v25.2+' },
    halfvec: { pgType: 'HALFVEC', status: 'unsupported', category: 'Extension', alternative: 'Use C-SPANN vector index on CockroachDB v25.2+' },
    sparsevec: { pgType: 'SPARSEVEC', status: 'unsupported', category: 'Extension', alternative: 'Use C-SPANN vector index on CockroachDB v25.2+' },
    geometry: { pgType: 'GEOMETRY', status: 'supported', category: 'Spatial', note: 'CockroachDB has built-in spatial (no extension needed)' },
    geography: { pgType: 'GEOGRAPHY', status: 'supported', category: 'Spatial', note: 'CockroachDB has built-in spatial (no extension needed)' },
    citext: { pgType: 'CITEXT', status: 'unsupported', category: 'Extension', alternative: 'text() with LOWER() or case-insensitive collation' },
    ltree: { pgType: 'LTREE', status: 'unsupported', category: 'Extension', alternative: 'text() with application-level path handling' },
    lquery: { pgType: 'LQUERY', status: 'unsupported', category: 'Extension', alternative: 'text()' },
    ltxtquery: { pgType: 'LTXTQUERY', status: 'unsupported', category: 'Extension', alternative: 'text()' },
    hstore: { pgType: 'HSTORE', status: 'unsupported', category: 'Extension', alternative: 'jsonb()' },
    cube: { pgType: 'CUBE', status: 'unsupported', category: 'Extension', alternative: 'jsonb() or float8 array' },
    semver: { pgType: 'SEMVER', status: 'unsupported', category: 'Extension', alternative: 'text() with application-level parsing' },
};
function getTypeMapping(sqlType) {
    const normalized = sqlType.toLowerCase().trim();
    if (exports.CRDB_TYPE_MAP[normalized]) {
        return exports.CRDB_TYPE_MAP[normalized];
    }
    const baseType = normalized.replace(/\(.*\)$/, '').trim();
    if (exports.CRDB_TYPE_MAP[baseType]) {
        return exports.CRDB_TYPE_MAP[baseType];
    }
    const nonArray = baseType.replace(/\[\]$/, '').trim();
    if (exports.CRDB_TYPE_MAP[nonArray]) {
        return exports.CRDB_TYPE_MAP[nonArray];
    }
    return undefined;
}
function isTypeSupported(sqlType) {
    const mapping = getTypeMapping(sqlType);
    if (!mapping)
        return true;
    return mapping.status !== 'unsupported';
}
function getUnsupportedTypesByCategory() {
    const result = new Map();
    for (const mapping of Object.values(exports.CRDB_TYPE_MAP)) {
        if (mapping.status === 'unsupported') {
            const existing = result.get(mapping.category) ?? [];
            existing.push(mapping);
            result.set(mapping.category, existing);
        }
    }
    return result;
}
function getTypesWithDifferences() {
    return Object.values(exports.CRDB_TYPE_MAP).filter(m => m.status === 'behavioral-difference' || m.status === 'warning');
}
