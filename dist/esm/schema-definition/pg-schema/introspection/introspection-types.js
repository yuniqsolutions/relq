import { RelqQueryError } from "../../../errors/relq-errors.js";
export const SQL_TYPE_MAP = {
    'INTEGER': 'integer()',
    'INT': 'integer()',
    'INT4': 'integer()',
    'SMALLINT': 'smallint()',
    'INT2': 'smallint()',
    'BIGINT': 'bigint()',
    'INT8': 'bigint()',
    'SERIAL': 'serial()',
    'SERIAL4': 'serial()',
    'SMALLSERIAL': 'smallserial()',
    'SERIAL2': 'smallserial()',
    'BIGSERIAL': 'bigserial()',
    'SERIAL8': 'bigserial()',
    'REAL': 'real()',
    'FLOAT4': 'real()',
    'DOUBLE PRECISION': 'doublePrecision()',
    'FLOAT8': 'doublePrecision()',
    'MONEY': 'money()',
    'TEXT': 'text()',
    'BYTEA': 'bytea()',
    'BOOLEAN': 'boolean()',
    'BOOL': 'boolean()',
    'DATE': 'date()',
    'POINT': 'point()',
    'LINE': 'line()',
    'LSEG': 'lseg()',
    'BOX': 'box()',
    'PATH': 'path()',
    'POLYGON': 'polygon()',
    'CIRCLE': 'circle()',
    'CIDR': 'cidr()',
    'INET': 'inet()',
    'MACADDR': 'macaddr()',
    'MACADDR8': 'macaddr8()',
    'TSVECTOR': 'tsvector()',
    'TSQUERY': 'tsquery()',
    'UUID': 'uuid()',
    'XML': 'xml()',
    'JSON': 'json()',
    'JSONB': 'jsonb()',
    'INT4RANGE': 'int4range()',
    'INT8RANGE': 'int8range()',
    'NUMRANGE': 'numrange()',
    'TSRANGE': 'tsrange()',
    'TSTZRANGE': 'tstzrange()',
    'DATERANGE': 'daterange()',
    'INT4MULTIRANGE': 'int4multirange()',
    'INT8MULTIRANGE': 'int8multirange()',
    'NUMMULTIRANGE': 'nummultirange()',
    'TSMULTIRANGE': 'tsmultirange()',
    'TSTZMULTIRANGE': 'tstzmultirange()',
    'DATEMULTIRANGE': 'datemultirange()',
    'OID': 'oid()',
    'REGCLASS': 'regclass()',
    'REGPROC': 'regproc()',
    'REGTYPE': 'regtype()',
    'PG_LSN': 'pgLsn()',
    'PG_SNAPSHOT': 'pgSnapshot()',
};
export function stripQuotes(str) {
    if ((str.startsWith('"') && str.endsWith('"')) ||
        (str.startsWith("'") && str.endsWith("'"))) {
        return str.slice(1, -1);
    }
    return str;
}
export function parseIdentifier(token) {
    return stripQuotes(token).toLowerCase();
}
export { RelqQueryError };
