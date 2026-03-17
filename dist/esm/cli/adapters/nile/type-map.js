const INTERNAL_TO_FRIENDLY = {
    'int2': 'smallint',
    'int4': 'integer',
    'int8': 'bigint',
    'float4': 'real',
    'float8': 'double precision',
    'bool': 'boolean',
    'timestamptz': 'timestamp with time zone',
    'timetz': 'time with time zone',
    'varchar': 'character varying',
    'bpchar': 'character',
    'varbit': 'bit varying',
};
const FRIENDLY_TO_INTERNAL = {
    'smallint': 'int2',
    'integer': 'int4',
    'int': 'int4',
    'bigint': 'int8',
    'real': 'float4',
    'double precision': 'float8',
    'boolean': 'bool',
    'timestamp with time zone': 'timestamptz',
    'time with time zone': 'timetz',
    'character varying': 'varchar',
    'character': 'bpchar',
    'bit varying': 'varbit',
};
export function mapTypeToFriendly(internalType) {
    const lower = internalType.toLowerCase();
    return INTERNAL_TO_FRIENDLY[lower] || internalType;
}
export function mapTypeToInternal(friendlyType) {
    const lower = friendlyType.toLowerCase();
    return FRIENDLY_TO_INTERNAL[lower] || friendlyType;
}
const SQL_TO_TYPESCRIPT = {
    'smallint': 'number',
    'int2': 'number',
    'integer': 'number',
    'int': 'number',
    'int4': 'number',
    'bigint': 'string',
    'int8': 'string',
    'serial': 'number',
    'smallserial': 'number',
    'bigserial': 'string',
    'real': 'number',
    'float4': 'number',
    'double precision': 'number',
    'float8': 'number',
    'float': 'number',
    'numeric': 'string',
    'decimal': 'string',
    'money': 'string',
    'boolean': 'boolean',
    'bool': 'boolean',
    'text': 'string',
    'varchar': 'string',
    'character varying': 'string',
    'char': 'string',
    'character': 'string',
    'bpchar': 'string',
    'name': 'string',
    'citext': 'string',
    'bytea': 'Buffer',
    'date': 'string',
    'time': 'string',
    'time with time zone': 'string',
    'timetz': 'string',
    'time without time zone': 'string',
    'timestamp': 'Date',
    'timestamp with time zone': 'Date',
    'timestamptz': 'Date',
    'timestamp without time zone': 'Date',
    'interval': 'string',
    'uuid': 'string',
    'json': 'unknown',
    'jsonb': 'unknown',
    'inet': 'string',
    'cidr': 'string',
    'macaddr': 'string',
    'macaddr8': 'string',
    'point': '{ x: number; y: number }',
    'line': 'string',
    'lseg': 'string',
    'box': 'string',
    'path': 'string',
    'polygon': 'string',
    'circle': 'string',
    'tsvector': 'string',
    'tsquery': 'string',
    'bit': 'string',
    'bit varying': 'string',
    'varbit': 'string',
    'xml': 'string',
    'int4range': 'string',
    'int8range': 'string',
    'numrange': 'string',
    'tsrange': 'string',
    'tstzrange': 'string',
    'daterange': 'string',
    'oid': 'number',
    'regclass': 'string',
    'regproc': 'string',
    'regtype': 'string',
    'vector': 'number[]',
};
export function getTypeScriptType(sqlType) {
    let normalized = sqlType.toLowerCase().trim();
    if (normalized.endsWith('[]')) {
        const baseType = normalized.slice(0, -2);
        const tsType = getTypeScriptType(baseType);
        return `${tsType}[]`;
    }
    if (normalized.includes(' array')) {
        const baseType = normalized.replace(' array', '');
        const tsType = getTypeScriptType(baseType);
        return `${tsType}[]`;
    }
    const withoutModifiers = normalized.replace(/\([^)]*\)/g, '');
    if (SQL_TO_TYPESCRIPT[withoutModifiers]) {
        return SQL_TO_TYPESCRIPT[withoutModifiers];
    }
    if (/^[a-z_]+$/.test(normalized) && !SQL_TO_TYPESCRIPT[normalized]) {
        return 'string';
    }
    return 'unknown';
}
