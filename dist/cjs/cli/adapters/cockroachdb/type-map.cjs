"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapTypeToFriendly = mapTypeToFriendly;
exports.mapTypeToInternal = mapTypeToInternal;
exports.getTypeScriptType = getTypeScriptType;
exports.isNumericType = isNumericType;
exports.isStringType = isStringType;
exports.isDateTimeType = isDateTimeType;
exports.isJsonType = isJsonType;
exports.isArrayType = isArrayType;
exports.getArrayBaseType = getArrayBaseType;
exports.getDefaultValueTs = getDefaultValueTs;
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
function mapTypeToFriendly(internalType) {
    const lower = internalType.toLowerCase();
    return INTERNAL_TO_FRIENDLY[lower] || internalType;
}
function mapTypeToInternal(friendlyType) {
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
    'boolean': 'boolean',
    'bool': 'boolean',
    'text': 'string',
    'varchar': 'string',
    'character varying': 'string',
    'char': 'string',
    'character': 'string',
    'bpchar': 'string',
    'name': 'string',
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
    'bit': 'string',
    'bit varying': 'string',
    'varbit': 'string',
    'oid': 'number',
    'regclass': 'string',
    'regproc': 'string',
    'regtype': 'string',
};
function getTypeScriptType(sqlType) {
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
function isNumericType(sqlType) {
    const numericTypes = [
        'smallint', 'int2', 'integer', 'int', 'int4', 'bigint', 'int8',
        'real', 'float4', 'double precision', 'float8', 'float',
        'numeric', 'decimal',
        'serial', 'smallserial', 'bigserial',
    ];
    return numericTypes.includes(sqlType.toLowerCase());
}
function isStringType(sqlType) {
    const base = sqlType.toLowerCase().replace(/\([^)]*\)/g, '');
    const stringTypes = [
        'text', 'varchar', 'character varying', 'char', 'character', 'bpchar',
        'name', 'uuid',
    ];
    return stringTypes.includes(base);
}
function isDateTimeType(sqlType) {
    const dateTypes = [
        'date', 'time', 'timetz', 'time with time zone', 'time without time zone',
        'timestamp', 'timestamptz', 'timestamp with time zone', 'timestamp without time zone',
        'interval',
    ];
    return dateTypes.includes(sqlType.toLowerCase());
}
function isJsonType(sqlType) {
    const lower = sqlType.toLowerCase();
    return lower === 'json' || lower === 'jsonb';
}
function isArrayType(sqlType) {
    const lower = sqlType.toLowerCase();
    return lower.endsWith('[]') || lower.includes(' array');
}
function getArrayBaseType(sqlType) {
    const lower = sqlType.toLowerCase();
    if (lower.endsWith('[]')) {
        return lower.slice(0, -2);
    }
    if (lower.includes(' array')) {
        return lower.replace(' array', '');
    }
    return sqlType;
}
function getDefaultValueTs(defaultValue, sqlType) {
    if (!defaultValue)
        return undefined;
    const lower = defaultValue.toLowerCase();
    if (lower === 'null')
        return 'null';
    if (lower === 'true')
        return 'true';
    if (lower === 'false')
        return 'false';
    if (lower.includes('gen_random_uuid') || lower.includes('uuid_generate')) {
        return undefined;
    }
    if (lower.includes('unique_rowid')) {
        return undefined;
    }
    if (lower.includes('now()') || lower.includes('current_timestamp')) {
        return undefined;
    }
    if (/^-?\d+(\.\d+)?$/.test(defaultValue)) {
        return defaultValue;
    }
    if (/^'[^']*'(::[\w\s]+)?$/.test(defaultValue)) {
        const match = defaultValue.match(/^'([^']*)'/);
        return JSON.stringify(match[1]);
    }
    if (lower === "'{}'") {
        return '[]';
    }
    if (lower === "'{}'::jsonb" || lower === "'{}'::json") {
        return '{}';
    }
    return undefined;
}
