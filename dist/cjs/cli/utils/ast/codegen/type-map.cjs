"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TYPE_MAP = void 0;
exports.getColumnBuilder = getColumnBuilder;
exports.getColumnBuilderWithInfo = getColumnBuilderWithInfo;
exports.TYPE_MAP = {
    'int2': 'smallint',
    'int4': 'integer',
    'int8': 'bigint',
    'smallint': 'smallint',
    'integer': 'integer',
    'bigint': 'bigint',
    'serial': 'serial',
    'smallserial': 'smallserial',
    'bigserial': 'bigserial',
    'float4': 'real',
    'float8': 'doublePrecision',
    'real': 'real',
    'double precision': 'doublePrecision',
    'numeric': 'numeric',
    'decimal': 'numeric',
    'money': 'money',
    'text': 'text',
    'varchar': 'varchar',
    'character varying': 'varchar',
    'char': 'char',
    'character': 'char',
    'bpchar': 'char',
    'citext': 'citext',
    'name': 'name',
    'bytea': 'bytea',
    'bool': 'boolean',
    'boolean': 'boolean',
    'date': 'date',
    'time': 'time',
    'timetz': 'timetz',
    'timestamp': 'timestamp',
    'timestamptz': 'timestamptz',
    'interval': 'interval',
    'uuid': 'uuid',
    'json': 'json',
    'jsonb': 'jsonb',
    'inet': 'inet',
    'cidr': 'cidr',
    'macaddr': 'macaddr',
    'macaddr8': 'macaddr8',
    'point': 'point',
    'line': 'line',
    'lseg': 'lseg',
    'box': 'box',
    'path': 'path',
    'polygon': 'polygon',
    'circle': 'circle',
    'int4range': 'int4range',
    'int8range': 'int8range',
    'numrange': 'numrange',
    'tsrange': 'tsrange',
    'tstzrange': 'tstzrange',
    'daterange': 'daterange',
    'tsvector': 'tsvector',
    'tsquery': 'tsquery',
    'xml': 'xml',
    'bit': 'bit',
    'varbit': 'varbit',
    'ltree': 'ltree',
    'cube': 'cube',
    'hstore': 'hstore',
};
function getColumnBuilder(type, params) {
    const result = getColumnBuilderWithInfo(type, params);
    if (result.length != null) {
        return `${result.builderName}(${result.length})`;
    }
    return result.builder;
}
function getColumnBuilderWithInfo(type, params) {
    const normalizedType = type.toLowerCase().trim();
    const builderName = exports.TYPE_MAP[normalizedType] || 'text';
    let builder = `${builderName}()`;
    let length;
    if (params) {
        if ((builderName === 'varchar' || builderName === 'char') && params.length) {
            length = params.length;
        }
        else if (builderName === 'numeric' && params.precision != null) {
            if (params.scale != null && params.scale > 0) {
                builder = `numeric(${params.precision}, ${params.scale})`;
            }
            else {
                builder = `numeric(${params.precision})`;
            }
        }
        else if (builderName === 'bit' && params.length) {
            builder = `bit(${params.length})`;
        }
        else if (builderName === 'varbit' && params.length) {
            builder = `varbit(${params.length})`;
        }
        else if (builderName === 'time' && params.precision != null) {
            builder = `time(${params.precision})`;
        }
        else if (builderName === 'timetz' && params.precision != null) {
            builder = `timetz(${params.precision})`;
        }
        else if (builderName === 'timestamp' && params.precision != null) {
            builder = `timestamp(${params.precision})`;
        }
        else if (builderName === 'timestamptz' && params.precision != null) {
            builder = `timestamptz(${params.precision})`;
        }
        else if (builderName === 'interval' && params.precision != null) {
            builder = `interval(${params.precision})`;
        }
    }
    return { builder, builderName, length };
}
