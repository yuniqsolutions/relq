export const DSQL_TYPE_MAP = {
    'smallint': { pgType: 'SMALLINT', status: 'supported', category: 'numeric' },
    'int2': { pgType: 'SMALLINT', status: 'supported', category: 'numeric' },
    'integer': { pgType: 'INTEGER', status: 'supported', category: 'numeric' },
    'int': { pgType: 'INTEGER', status: 'supported', category: 'numeric' },
    'int4': { pgType: 'INTEGER', status: 'supported', category: 'numeric' },
    'bigint': { pgType: 'BIGINT', status: 'supported', category: 'numeric' },
    'int8': { pgType: 'BIGINT', status: 'supported', category: 'numeric' },
    'real': { pgType: 'REAL', status: 'supported', category: 'numeric' },
    'float4': { pgType: 'REAL', status: 'supported', category: 'numeric' },
    'double precision': { pgType: 'DOUBLE PRECISION', status: 'supported', category: 'numeric' },
    'float8': { pgType: 'DOUBLE PRECISION', status: 'supported', category: 'numeric' },
    'numeric': {
        pgType: 'NUMERIC', status: 'supported', category: 'numeric',
        note: 'Max precision: 38 (PG: 1000), max scale: 37 (PG: 16383)',
    },
    'decimal': {
        pgType: 'NUMERIC', status: 'supported', category: 'numeric',
        note: 'Max precision: 38, max scale: 37',
    },
    'serial': { pgType: 'SERIAL', status: 'unsupported', errorCode: 'DSQL-TYPE-001', alternative: 'uuid().default(DEFAULT.genRandomUuid())', category: 'numeric' },
    'serial4': { pgType: 'SERIAL', status: 'unsupported', errorCode: 'DSQL-TYPE-001', alternative: 'uuid().default(DEFAULT.genRandomUuid())', category: 'numeric' },
    'bigserial': { pgType: 'BIGSERIAL', status: 'unsupported', errorCode: 'DSQL-TYPE-001', alternative: 'uuid().default(DEFAULT.genRandomUuid())', category: 'numeric' },
    'serial8': { pgType: 'BIGSERIAL', status: 'unsupported', errorCode: 'DSQL-TYPE-001', alternative: 'uuid().default(DEFAULT.genRandomUuid())', category: 'numeric' },
    'smallserial': { pgType: 'SMALLSERIAL', status: 'unsupported', errorCode: 'DSQL-TYPE-001', alternative: 'uuid().default(DEFAULT.genRandomUuid())', category: 'numeric' },
    'serial2': { pgType: 'SMALLSERIAL', status: 'unsupported', errorCode: 'DSQL-TYPE-001', alternative: 'uuid().default(DEFAULT.genRandomUuid())', category: 'numeric' },
    'money': { pgType: 'MONEY', status: 'unsupported', errorCode: 'DSQL-TYPE-004', alternative: 'numeric({ precision: 19, scale: 4 })', category: 'monetary' },
    'character varying': {
        pgType: 'VARCHAR', status: 'supported', category: 'character',
        note: 'Max length: 65,535 bytes (PG: 10,485,760)',
    },
    'varchar': {
        pgType: 'VARCHAR', status: 'supported', category: 'character',
        note: 'Max length: 65,535 bytes',
    },
    'character': {
        pgType: 'CHAR', status: 'supported', category: 'character',
        note: 'Max length: 4,096 bytes (PG: 10,485,760)',
    },
    'char': {
        pgType: 'CHAR', status: 'supported', category: 'character',
        note: 'Max length: 4,096 bytes',
    },
    'bpchar': {
        pgType: 'BPCHAR', status: 'supported', category: 'character',
        note: 'Max length: 4,096 bytes',
    },
    'text': {
        pgType: 'TEXT', status: 'supported', category: 'character',
        note: 'Max size: 1 MiB (PG: ~1 GB). C collation only.',
    },
    'bytea': {
        pgType: 'BYTEA', status: 'supported', category: 'binary',
        note: 'Max 1 MiB. NOT indexable in DSQL.',
    },
    'date': { pgType: 'DATE', status: 'supported', category: 'datetime' },
    'time': { pgType: 'TIME', status: 'supported', category: 'datetime' },
    'time without time zone': { pgType: 'TIME', status: 'supported', category: 'datetime' },
    'timetz': {
        pgType: 'TIMETZ', status: 'supported', category: 'datetime',
        note: 'NOT indexable in DSQL.',
    },
    'time with time zone': {
        pgType: 'TIMETZ', status: 'supported', category: 'datetime',
        note: 'NOT indexable in DSQL.',
    },
    'timestamp': { pgType: 'TIMESTAMP', status: 'supported', category: 'datetime' },
    'timestamp without time zone': { pgType: 'TIMESTAMP', status: 'supported', category: 'datetime' },
    'timestamptz': { pgType: 'TIMESTAMPTZ', status: 'supported', category: 'datetime' },
    'timestamp with time zone': { pgType: 'TIMESTAMPTZ', status: 'supported', category: 'datetime' },
    'interval': {
        pgType: 'INTERVAL', status: 'supported', category: 'datetime',
        note: 'NOT indexable in DSQL.',
    },
    'boolean': { pgType: 'BOOLEAN', status: 'supported', category: 'boolean' },
    'bool': { pgType: 'BOOLEAN', status: 'supported', category: 'boolean' },
    'uuid': {
        pgType: 'UUID', status: 'supported', category: 'uuid',
        note: 'Recommended for primary keys with gen_random_uuid().',
    },
    'json': { pgType: 'JSON', status: 'unsupported', errorCode: 'DSQL-TYPE-002', alternative: 'text() — cast with col::jsonb at query time', category: 'json' },
    'jsonb': { pgType: 'JSONB', status: 'unsupported', errorCode: 'DSQL-TYPE-002', alternative: 'text() — cast with col::jsonb at query time', category: 'json' },
    'xml': { pgType: 'XML', status: 'unsupported', errorCode: 'DSQL-TYPE-003', alternative: 'text()', category: 'xml' },
    'point': { pgType: 'POINT', status: 'unsupported', errorCode: 'DSQL-TYPE-005', alternative: 'Two numeric columns (x, y)', category: 'geometric' },
    'line': { pgType: 'LINE', status: 'unsupported', errorCode: 'DSQL-TYPE-005', alternative: 'text() or separate columns', category: 'geometric' },
    'lseg': { pgType: 'LSEG', status: 'unsupported', errorCode: 'DSQL-TYPE-005', alternative: 'text() or separate columns', category: 'geometric' },
    'box': { pgType: 'BOX', status: 'unsupported', errorCode: 'DSQL-TYPE-005', alternative: 'Four numeric columns', category: 'geometric' },
    'path': { pgType: 'PATH', status: 'unsupported', errorCode: 'DSQL-TYPE-005', alternative: 'text()', category: 'geometric' },
    'polygon': { pgType: 'POLYGON', status: 'unsupported', errorCode: 'DSQL-TYPE-005', alternative: 'text()', category: 'geometric' },
    'circle': { pgType: 'CIRCLE', status: 'unsupported', errorCode: 'DSQL-TYPE-005', alternative: 'Three numeric columns (x, y, radius)', category: 'geometric' },
    'inet': { pgType: 'INET', status: 'unsupported', errorCode: 'DSQL-TYPE-010', alternative: 'varchar(45)', category: 'network', note: 'Runtime-only: usable in expressions but not as column type' },
    'cidr': { pgType: 'CIDR', status: 'unsupported', errorCode: 'DSQL-TYPE-009', alternative: 'text() or varchar()', category: 'network' },
    'macaddr': { pgType: 'MACADDR', status: 'unsupported', errorCode: 'DSQL-TYPE-009', alternative: 'varchar(17)', category: 'network' },
    'macaddr8': { pgType: 'MACADDR8', status: 'unsupported', errorCode: 'DSQL-TYPE-009', alternative: 'varchar(23)', category: 'network' },
    'bit': { pgType: 'BIT', status: 'unsupported', errorCode: 'DSQL-TYPE-008', alternative: 'bytea() or text()', category: 'bit-string' },
    'bit varying': { pgType: 'BIT VARYING', status: 'unsupported', errorCode: 'DSQL-TYPE-008', alternative: 'bytea() or text()', category: 'bit-string' },
    'varbit': { pgType: 'BIT VARYING', status: 'unsupported', errorCode: 'DSQL-TYPE-008', alternative: 'bytea() or text()', category: 'bit-string' },
    'tsvector': { pgType: 'TSVECTOR', status: 'unsupported', errorCode: 'DSQL-TYPE-011', alternative: 'text()', category: 'text-search' },
    'tsquery': { pgType: 'TSQUERY', status: 'unsupported', errorCode: 'DSQL-TYPE-011', alternative: 'text()', category: 'text-search' },
    'int4range': { pgType: 'INT4RANGE', status: 'unsupported', errorCode: 'DSQL-TYPE-006', alternative: 'Two integer columns (lower, upper)', category: 'range' },
    'int8range': { pgType: 'INT8RANGE', status: 'unsupported', errorCode: 'DSQL-TYPE-006', alternative: 'Two bigint columns (lower, upper)', category: 'range' },
    'numrange': { pgType: 'NUMRANGE', status: 'unsupported', errorCode: 'DSQL-TYPE-006', alternative: 'Two numeric columns (lower, upper)', category: 'range' },
    'tsrange': { pgType: 'TSRANGE', status: 'unsupported', errorCode: 'DSQL-TYPE-006', alternative: 'Two timestamp columns (lower, upper)', category: 'range' },
    'tstzrange': { pgType: 'TSTZRANGE', status: 'unsupported', errorCode: 'DSQL-TYPE-006', alternative: 'Two timestamptz columns (lower, upper)', category: 'range' },
    'daterange': { pgType: 'DATERANGE', status: 'unsupported', errorCode: 'DSQL-TYPE-006', alternative: 'Two date columns (lower, upper)', category: 'range' },
    'int4multirange': { pgType: 'INT4MULTIRANGE', status: 'unsupported', errorCode: 'DSQL-TYPE-007', alternative: 'Junction table', category: 'multirange' },
    'int8multirange': { pgType: 'INT8MULTIRANGE', status: 'unsupported', errorCode: 'DSQL-TYPE-007', alternative: 'Junction table', category: 'multirange' },
    'nummultirange': { pgType: 'NUMMULTIRANGE', status: 'unsupported', errorCode: 'DSQL-TYPE-007', alternative: 'Junction table', category: 'multirange' },
    'tsmultirange': { pgType: 'TSMULTIRANGE', status: 'unsupported', errorCode: 'DSQL-TYPE-007', alternative: 'Junction table', category: 'multirange' },
    'tstzmultirange': { pgType: 'TSTZMULTIRANGE', status: 'unsupported', errorCode: 'DSQL-TYPE-007', alternative: 'Junction table', category: 'multirange' },
    'datemultirange': { pgType: 'DATEMULTIRANGE', status: 'unsupported', errorCode: 'DSQL-TYPE-007', alternative: 'Junction table', category: 'multirange' },
    'oid': { pgType: 'OID', status: 'unsupported', errorCode: 'DSQL-TYPE-012', alternative: 'integer()', category: 'oid' },
    'regclass': { pgType: 'REGCLASS', status: 'unsupported', errorCode: 'DSQL-TYPE-012', alternative: 'text()', category: 'oid' },
    'regproc': { pgType: 'REGPROC', status: 'unsupported', errorCode: 'DSQL-TYPE-012', alternative: 'text()', category: 'oid' },
    'regtype': { pgType: 'REGTYPE', status: 'unsupported', errorCode: 'DSQL-TYPE-012', alternative: 'text()', category: 'oid' },
    'regprocedure': { pgType: 'REGPROCEDURE', status: 'unsupported', errorCode: 'DSQL-TYPE-012', alternative: 'text()', category: 'oid' },
    'regoper': { pgType: 'REGOPER', status: 'unsupported', errorCode: 'DSQL-TYPE-012', alternative: 'text()', category: 'oid' },
    'regoperator': { pgType: 'REGOPERATOR', status: 'unsupported', errorCode: 'DSQL-TYPE-012', alternative: 'text()', category: 'oid' },
    'regrole': { pgType: 'REGROLE', status: 'unsupported', errorCode: 'DSQL-TYPE-012', alternative: 'text()', category: 'oid' },
    'regnamespace': { pgType: 'REGNAMESPACE', status: 'unsupported', errorCode: 'DSQL-TYPE-012', alternative: 'text()', category: 'oid' },
    'regconfig': { pgType: 'REGCONFIG', status: 'unsupported', errorCode: 'DSQL-TYPE-012', alternative: 'text()', category: 'oid' },
    'regdictionary': { pgType: 'REGDICTIONARY', status: 'unsupported', errorCode: 'DSQL-TYPE-012', alternative: 'text()', category: 'oid' },
    'pg_lsn': { pgType: 'PG_LSN', status: 'unsupported', errorCode: 'DSQL-TYPE-013', alternative: 'No direct alternative', category: 'internal' },
    'pg_snapshot': { pgType: 'PG_SNAPSHOT', status: 'unsupported', errorCode: 'DSQL-TYPE-013', alternative: 'No direct alternative', category: 'internal' },
};
export function getDsqlTypeMapping(sqlType) {
    const normalized = sqlType
        .toLowerCase()
        .replace(/\s*\(.*\)/, '')
        .replace(/\s*\[\s*\]/, '')
        .trim();
    return DSQL_TYPE_MAP[normalized];
}
export function isDsqlTypeSupported(sqlType) {
    const mapping = getDsqlTypeMapping(sqlType);
    if (!mapping)
        return true;
    return mapping.status === 'supported';
}
export function getDsqlUnsupportedTypesByCategory() {
    const groups = {};
    const seen = new Set();
    for (const mapping of Object.values(DSQL_TYPE_MAP)) {
        if (mapping.status === 'unsupported' && !seen.has(mapping.pgType)) {
            seen.add(mapping.pgType);
            const cat = mapping.category;
            if (!groups[cat])
                groups[cat] = [];
            groups[cat].push(mapping);
        }
    }
    return groups;
}
