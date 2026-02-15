"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NILE_TYPE_MAP = void 0;
exports.getNileTypeMapping = getNileTypeMapping;
exports.isNileTypeSupported = isNileTypeSupported;
exports.getNileContextDependentTypes = getNileContextDependentTypes;
exports.NILE_TYPE_MAP = {
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
    'numeric': { pgType: 'NUMERIC', status: 'supported', category: 'numeric' },
    'decimal': { pgType: 'NUMERIC', status: 'supported', category: 'numeric' },
    'money': { pgType: 'MONEY', status: 'supported', category: 'numeric' },
    'serial': {
        pgType: 'SERIAL',
        status: 'context-dependent',
        errorCode: 'NILE-CT-001',
        alternative: 'uuid().default(DEFAULT.genRandomUuid())',
        category: 'numeric',
        note: 'Sequences cannot be partitioned across tenant boundaries. Blocked on tenant tables, allowed on shared tables.',
        tenantTableStatus: 'blocked',
        sharedTableStatus: 'supported',
    },
    'serial4': {
        pgType: 'SERIAL',
        status: 'context-dependent',
        errorCode: 'NILE-CT-001',
        alternative: 'uuid().default(DEFAULT.genRandomUuid())',
        category: 'numeric',
        note: 'Alias for SERIAL. Blocked on tenant tables, allowed on shared tables.',
        tenantTableStatus: 'blocked',
        sharedTableStatus: 'supported',
    },
    'bigserial': {
        pgType: 'BIGSERIAL',
        status: 'context-dependent',
        errorCode: 'NILE-CT-001',
        alternative: 'uuid().default(DEFAULT.genRandomUuid())',
        category: 'numeric',
        note: 'Sequences cannot be partitioned across tenant boundaries. Blocked on tenant tables, allowed on shared tables.',
        tenantTableStatus: 'blocked',
        sharedTableStatus: 'supported',
    },
    'serial8': {
        pgType: 'BIGSERIAL',
        status: 'context-dependent',
        errorCode: 'NILE-CT-001',
        alternative: 'uuid().default(DEFAULT.genRandomUuid())',
        category: 'numeric',
        note: 'Alias for BIGSERIAL. Blocked on tenant tables, allowed on shared tables.',
        tenantTableStatus: 'blocked',
        sharedTableStatus: 'supported',
    },
    'smallserial': {
        pgType: 'SMALLSERIAL',
        status: 'context-dependent',
        errorCode: 'NILE-CT-001',
        alternative: 'uuid().default(DEFAULT.genRandomUuid())',
        category: 'numeric',
        note: 'Sequences cannot be partitioned across tenant boundaries. Blocked on tenant tables, allowed on shared tables.',
        tenantTableStatus: 'blocked',
        sharedTableStatus: 'supported',
    },
    'serial2': {
        pgType: 'SMALLSERIAL',
        status: 'context-dependent',
        errorCode: 'NILE-CT-001',
        alternative: 'uuid().default(DEFAULT.genRandomUuid())',
        category: 'numeric',
        note: 'Alias for SMALLSERIAL. Blocked on tenant tables, allowed on shared tables.',
        tenantTableStatus: 'blocked',
        sharedTableStatus: 'supported',
    },
    'character varying': { pgType: 'VARCHAR', status: 'supported', category: 'character' },
    'varchar': { pgType: 'VARCHAR', status: 'supported', category: 'character' },
    'character': { pgType: 'CHAR', status: 'supported', category: 'character' },
    'char': { pgType: 'CHAR', status: 'supported', category: 'character' },
    'bpchar': { pgType: 'BPCHAR', status: 'supported', category: 'character' },
    'text': { pgType: 'TEXT', status: 'supported', category: 'character' },
    'bytea': { pgType: 'BYTEA', status: 'supported', category: 'binary' },
    'date': { pgType: 'DATE', status: 'supported', category: 'datetime' },
    'time': { pgType: 'TIME', status: 'supported', category: 'datetime' },
    'time without time zone': { pgType: 'TIME', status: 'supported', category: 'datetime' },
    'timetz': { pgType: 'TIMETZ', status: 'supported', category: 'datetime' },
    'time with time zone': { pgType: 'TIMETZ', status: 'supported', category: 'datetime' },
    'timestamp': { pgType: 'TIMESTAMP', status: 'supported', category: 'datetime' },
    'timestamp without time zone': { pgType: 'TIMESTAMP', status: 'supported', category: 'datetime' },
    'timestamptz': { pgType: 'TIMESTAMPTZ', status: 'supported', category: 'datetime' },
    'timestamp with time zone': { pgType: 'TIMESTAMPTZ', status: 'supported', category: 'datetime' },
    'interval': { pgType: 'INTERVAL', status: 'supported', category: 'datetime' },
    'boolean': { pgType: 'BOOLEAN', status: 'supported', category: 'boolean' },
    'bool': { pgType: 'BOOLEAN', status: 'supported', category: 'boolean' },
    'uuid': {
        pgType: 'UUID',
        status: 'supported',
        category: 'uuid',
        note: 'Recommended for primary keys with gen_random_uuid(). Natively supported on all table types.',
    },
    'json': { pgType: 'JSON', status: 'supported', category: 'json' },
    'jsonb': {
        pgType: 'JSONB',
        status: 'supported',
        category: 'json',
        note: 'Fully supported including GIN indexes, containment operators, and path queries.',
    },
    'xml': { pgType: 'XML', status: 'supported', category: 'xml' },
    'point': { pgType: 'POINT', status: 'supported', category: 'geometric' },
    'line': { pgType: 'LINE', status: 'supported', category: 'geometric' },
    'lseg': { pgType: 'LSEG', status: 'supported', category: 'geometric' },
    'box': { pgType: 'BOX', status: 'supported', category: 'geometric' },
    'path': { pgType: 'PATH', status: 'supported', category: 'geometric' },
    'polygon': { pgType: 'POLYGON', status: 'supported', category: 'geometric' },
    'circle': { pgType: 'CIRCLE', status: 'supported', category: 'geometric' },
    'inet': { pgType: 'INET', status: 'supported', category: 'network' },
    'cidr': { pgType: 'CIDR', status: 'supported', category: 'network' },
    'macaddr': { pgType: 'MACADDR', status: 'supported', category: 'network' },
    'macaddr8': { pgType: 'MACADDR8', status: 'supported', category: 'network' },
    'bit': { pgType: 'BIT', status: 'supported', category: 'bit-string' },
    'bit varying': { pgType: 'BIT VARYING', status: 'supported', category: 'bit-string' },
    'varbit': { pgType: 'BIT VARYING', status: 'supported', category: 'bit-string' },
    'tsvector': { pgType: 'TSVECTOR', status: 'supported', category: 'text-search' },
    'tsquery': { pgType: 'TSQUERY', status: 'supported', category: 'text-search' },
    'int4range': { pgType: 'INT4RANGE', status: 'supported', category: 'range' },
    'int8range': { pgType: 'INT8RANGE', status: 'supported', category: 'range' },
    'numrange': { pgType: 'NUMRANGE', status: 'supported', category: 'range' },
    'tsrange': { pgType: 'TSRANGE', status: 'supported', category: 'range' },
    'tstzrange': { pgType: 'TSTZRANGE', status: 'supported', category: 'range' },
    'daterange': { pgType: 'DATERANGE', status: 'supported', category: 'range' },
    'int4multirange': { pgType: 'INT4MULTIRANGE', status: 'supported', category: 'multirange' },
    'int8multirange': { pgType: 'INT8MULTIRANGE', status: 'supported', category: 'multirange' },
    'nummultirange': { pgType: 'NUMMULTIRANGE', status: 'supported', category: 'multirange' },
    'tsmultirange': { pgType: 'TSMULTIRANGE', status: 'supported', category: 'multirange' },
    'tstzmultirange': { pgType: 'TSTZMULTIRANGE', status: 'supported', category: 'multirange' },
    'datemultirange': { pgType: 'DATEMULTIRANGE', status: 'supported', category: 'multirange' },
    'oid': { pgType: 'OID', status: 'supported', category: 'oid' },
    'regclass': { pgType: 'REGCLASS', status: 'supported', category: 'oid' },
    'regproc': { pgType: 'REGPROC', status: 'supported', category: 'oid' },
    'regtype': { pgType: 'REGTYPE', status: 'supported', category: 'oid' },
    'regprocedure': { pgType: 'REGPROCEDURE', status: 'supported', category: 'oid' },
    'regoper': { pgType: 'REGOPER', status: 'supported', category: 'oid' },
    'regoperator': { pgType: 'REGOPERATOR', status: 'supported', category: 'oid' },
    'regrole': { pgType: 'REGROLE', status: 'supported', category: 'oid' },
    'regnamespace': { pgType: 'REGNAMESPACE', status: 'supported', category: 'oid' },
    'regconfig': { pgType: 'REGCONFIG', status: 'supported', category: 'oid' },
    'regdictionary': { pgType: 'REGDICTIONARY', status: 'supported', category: 'oid' },
    'pg_lsn': { pgType: 'PG_LSN', status: 'supported', category: 'internal' },
    'pg_snapshot': { pgType: 'PG_SNAPSHOT', status: 'supported', category: 'internal' },
};
function getNileTypeMapping(sqlType) {
    const normalized = sqlType
        .toLowerCase()
        .replace(/\s*\(.*\)/, '')
        .replace(/\s*\[\s*\]/, '')
        .trim();
    return exports.NILE_TYPE_MAP[normalized];
}
function isNileTypeSupported(sqlType, tableType) {
    const mapping = getNileTypeMapping(sqlType);
    if (!mapping)
        return true;
    if (mapping.status === 'unsupported')
        return false;
    if (mapping.status === 'supported')
        return true;
    if (mapping.status === 'context-dependent' && tableType) {
        if (tableType === 'tenant') {
            return mapping.tenantTableStatus !== 'blocked';
        }
        if (tableType === 'shared') {
            return mapping.sharedTableStatus !== 'blocked';
        }
    }
    return true;
}
function getNileContextDependentTypes() {
    const result = [];
    const seen = new Set();
    for (const mapping of Object.values(exports.NILE_TYPE_MAP)) {
        if (mapping.status === 'context-dependent' && !seen.has(mapping.pgType)) {
            seen.add(mapping.pgType);
            result.push(mapping);
        }
    }
    return result;
}
