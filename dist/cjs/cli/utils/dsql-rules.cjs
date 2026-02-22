"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DSQL_ERROR_CODES = exports.DSQL_LIMITS = exports.BLOCKED_CONSTRAINT_TYPES = exports.BLOCKED_TABLE_FEATURES = exports.ALLOWED_INDEX_METHODS = exports.DSQL_TYPE_ALTERNATIVES = exports.UNSUPPORTED_COLUMN_TYPES = exports.formatDsqlTransformChanges = exports.needsDsqlTransformation = exports.transformSqlStatementsForDsql = exports.transformSqlForDsql = exports.isDsqlTypeSupported = exports.getDsqlTypeMapping = exports.DSQL_TYPE_MAP = exports.DSQL_BLOCKED_INDEX_METHODS = exports.DSQL_SUPPORTED_INDEX_METHODS = exports.DSQL_NON_INDEXABLE_TYPES = exports.DSQL_TRANSACTION_LIMITS = exports.DSQL_CONNECTION_LIMITS = exports.DSQL_TYPE_LIMITS = exports.DSQL_TABLE_LIMITS = exports.DSQL_DATABASE_LIMITS = exports.createDsqlValidationResult = exports.formatDsqlValidationResult = exports.formatDsqlMessage = exports.lookupDsqlRule = exports.createDsqlMessage = exports.DSQL_MISC_RULES = exports.DSQL_TXN_RULES = exports.DSQL_DB_RULES = exports.DSQL_SEQ_RULES = exports.DSQL_EXT_RULES = exports.DSQL_VIEW_RULES = exports.DSQL_TRIG_RULES = exports.DSQL_FN_RULES = exports.DSQL_TBL_RULES = exports.DSQL_IDX_LIMIT_RULES = exports.DSQL_IDX_RULES = exports.DSQL_CONS_RULES = exports.DSQL_MOD_ERRORS = exports.DSQL_LIMIT_WARNINGS = exports.DSQL_TYPE_ERRORS = exports.DSQL_ALL_RULES = void 0;
var errors_1 = require("../../schema-definition/pg-schema/dsql-schema/errors.cjs");
Object.defineProperty(exports, "DSQL_ALL_RULES", { enumerable: true, get: function () { return errors_1.DSQL_ALL_RULES; } });
Object.defineProperty(exports, "DSQL_TYPE_ERRORS", { enumerable: true, get: function () { return errors_1.DSQL_TYPE_ERRORS; } });
Object.defineProperty(exports, "DSQL_LIMIT_WARNINGS", { enumerable: true, get: function () { return errors_1.DSQL_LIMIT_WARNINGS; } });
Object.defineProperty(exports, "DSQL_MOD_ERRORS", { enumerable: true, get: function () { return errors_1.DSQL_MOD_ERRORS; } });
Object.defineProperty(exports, "DSQL_CONS_RULES", { enumerable: true, get: function () { return errors_1.DSQL_CONS_RULES; } });
Object.defineProperty(exports, "DSQL_IDX_RULES", { enumerable: true, get: function () { return errors_1.DSQL_IDX_RULES; } });
Object.defineProperty(exports, "DSQL_IDX_LIMIT_RULES", { enumerable: true, get: function () { return errors_1.DSQL_IDX_LIMIT_RULES; } });
Object.defineProperty(exports, "DSQL_TBL_RULES", { enumerable: true, get: function () { return errors_1.DSQL_TBL_RULES; } });
Object.defineProperty(exports, "DSQL_FN_RULES", { enumerable: true, get: function () { return errors_1.DSQL_FN_RULES; } });
Object.defineProperty(exports, "DSQL_TRIG_RULES", { enumerable: true, get: function () { return errors_1.DSQL_TRIG_RULES; } });
Object.defineProperty(exports, "DSQL_VIEW_RULES", { enumerable: true, get: function () { return errors_1.DSQL_VIEW_RULES; } });
Object.defineProperty(exports, "DSQL_EXT_RULES", { enumerable: true, get: function () { return errors_1.DSQL_EXT_RULES; } });
Object.defineProperty(exports, "DSQL_SEQ_RULES", { enumerable: true, get: function () { return errors_1.DSQL_SEQ_RULES; } });
Object.defineProperty(exports, "DSQL_DB_RULES", { enumerable: true, get: function () { return errors_1.DSQL_DB_RULES; } });
Object.defineProperty(exports, "DSQL_TXN_RULES", { enumerable: true, get: function () { return errors_1.DSQL_TXN_RULES; } });
Object.defineProperty(exports, "DSQL_MISC_RULES", { enumerable: true, get: function () { return errors_1.DSQL_MISC_RULES; } });
Object.defineProperty(exports, "createDsqlMessage", { enumerable: true, get: function () { return errors_1.createDsqlMessage; } });
Object.defineProperty(exports, "lookupDsqlRule", { enumerable: true, get: function () { return errors_1.lookupDsqlRule; } });
Object.defineProperty(exports, "formatDsqlMessage", { enumerable: true, get: function () { return errors_1.formatDsqlMessage; } });
Object.defineProperty(exports, "formatDsqlValidationResult", { enumerable: true, get: function () { return errors_1.formatDsqlValidationResult; } });
Object.defineProperty(exports, "createDsqlValidationResult", { enumerable: true, get: function () { return errors_1.createDsqlValidationResult; } });
var limits_1 = require("../../schema-definition/pg-schema/dsql-schema/limits.cjs");
Object.defineProperty(exports, "DSQL_DATABASE_LIMITS", { enumerable: true, get: function () { return limits_1.DSQL_DATABASE_LIMITS; } });
Object.defineProperty(exports, "DSQL_TABLE_LIMITS", { enumerable: true, get: function () { return limits_1.DSQL_TABLE_LIMITS; } });
Object.defineProperty(exports, "DSQL_TYPE_LIMITS", { enumerable: true, get: function () { return limits_1.DSQL_TYPE_LIMITS; } });
Object.defineProperty(exports, "DSQL_CONNECTION_LIMITS", { enumerable: true, get: function () { return limits_1.DSQL_CONNECTION_LIMITS; } });
Object.defineProperty(exports, "DSQL_TRANSACTION_LIMITS", { enumerable: true, get: function () { return limits_1.DSQL_TRANSACTION_LIMITS; } });
Object.defineProperty(exports, "DSQL_NON_INDEXABLE_TYPES", { enumerable: true, get: function () { return limits_1.DSQL_NON_INDEXABLE_TYPES; } });
Object.defineProperty(exports, "DSQL_SUPPORTED_INDEX_METHODS", { enumerable: true, get: function () { return limits_1.DSQL_SUPPORTED_INDEX_METHODS; } });
Object.defineProperty(exports, "DSQL_BLOCKED_INDEX_METHODS", { enumerable: true, get: function () { return limits_1.DSQL_BLOCKED_INDEX_METHODS; } });
var type_mappings_1 = require("../../schema-definition/pg-schema/dsql-schema/type-mappings.cjs");
Object.defineProperty(exports, "DSQL_TYPE_MAP", { enumerable: true, get: function () { return type_mappings_1.DSQL_TYPE_MAP; } });
Object.defineProperty(exports, "getDsqlTypeMapping", { enumerable: true, get: function () { return type_mappings_1.getDsqlTypeMapping; } });
Object.defineProperty(exports, "isDsqlTypeSupported", { enumerable: true, get: function () { return type_mappings_1.isDsqlTypeSupported; } });
var sql_generator_1 = require("../../schema-definition/pg-schema/dsql-schema/sql-generator.cjs");
Object.defineProperty(exports, "transformSqlForDsql", { enumerable: true, get: function () { return sql_generator_1.transformSqlForDsql; } });
Object.defineProperty(exports, "transformSqlStatementsForDsql", { enumerable: true, get: function () { return sql_generator_1.transformSqlStatementsForDsql; } });
Object.defineProperty(exports, "needsDsqlTransformation", { enumerable: true, get: function () { return sql_generator_1.needsDsqlTransformation; } });
Object.defineProperty(exports, "formatDsqlTransformChanges", { enumerable: true, get: function () { return sql_generator_1.formatDsqlTransformChanges; } });
exports.UNSUPPORTED_COLUMN_TYPES = new Set([
    'serial', 'serial4', 'bigserial', 'serial8', 'smallserial', 'serial2',
    'json', 'jsonb',
    'xml',
    'money',
    'point', 'line', 'lseg', 'box', 'path', 'polygon', 'circle',
    'int4range', 'int8range', 'numrange', 'tsrange', 'tstzrange', 'daterange',
    'int4multirange', 'int8multirange', 'nummultirange',
    'tsmultirange', 'tstzmultirange', 'datemultirange',
    'bit', 'bit varying', 'varbit',
    'inet', 'cidr', 'macaddr', 'macaddr8',
    'tsvector', 'tsquery',
    'oid', 'regclass', 'regproc', 'regtype',
    'regprocedure', 'regoper', 'regoperator',
    'regrole', 'regnamespace', 'regconfig', 'regdictionary',
    'pg_lsn', 'pg_snapshot',
]);
exports.DSQL_TYPE_ALTERNATIVES = {
    serial: 'uuid DEFAULT gen_random_uuid()',
    serial4: 'uuid DEFAULT gen_random_uuid()',
    bigserial: 'uuid DEFAULT gen_random_uuid()',
    serial8: 'uuid DEFAULT gen_random_uuid()',
    smallserial: 'uuid DEFAULT gen_random_uuid()',
    serial2: 'uuid DEFAULT gen_random_uuid()',
    json: 'text',
    jsonb: 'text',
    xml: 'text',
    money: 'numeric(19,4)',
    point: 'text or two numeric columns',
    line: 'text or separate columns',
    lseg: 'text or separate columns',
    box: 'text or four numeric columns',
    path: 'text',
    polygon: 'text',
    circle: 'text or three numeric columns (x, y, radius)',
    int4range: 'two integer columns (lower, upper)',
    int8range: 'two bigint columns (lower, upper)',
    numrange: 'two numeric columns (lower, upper)',
    tsrange: 'two timestamp columns (lower, upper)',
    tstzrange: 'two timestamptz columns (lower, upper)',
    daterange: 'two date columns (lower, upper)',
    int4multirange: 'junction table',
    int8multirange: 'junction table',
    nummultirange: 'junction table',
    tsmultirange: 'junction table',
    tstzmultirange: 'junction table',
    datemultirange: 'junction table',
    bit: 'bytea or text',
    'bit varying': 'bytea or text',
    varbit: 'bytea or text',
    inet: 'varchar(45)',
    cidr: 'text',
    macaddr: 'varchar(17)',
    macaddr8: 'varchar(23)',
    tsvector: 'text',
    tsquery: 'text',
    oid: 'integer',
    regclass: 'text',
    regproc: 'text',
    regtype: 'text',
    regprocedure: 'text',
    regoper: 'text',
    regoperator: 'text',
    regrole: 'text',
    regnamespace: 'text',
    regconfig: 'text',
    regdictionary: 'text',
    pg_lsn: 'no direct alternative',
    pg_snapshot: 'no direct alternative',
};
exports.ALLOWED_INDEX_METHODS = new Set(['btree']);
exports.BLOCKED_TABLE_FEATURES = new Set([
    'temporary',
    'unlogged',
    'inherits',
    'tablespace',
    'partition_by',
    'on_commit',
]);
exports.BLOCKED_CONSTRAINT_TYPES = new Set([
    'foreign_key',
    'exclusion',
    'deferrable',
]);
exports.DSQL_LIMITS = {
    MAX_DATABASES: 1,
    MAX_SCHEMAS: 10,
    MAX_TABLES: 1_000,
    MAX_VIEWS: 5_000,
    MAX_COLUMNS_PER_TABLE: 255,
    MAX_INDEXES_PER_TABLE: 24,
    MAX_COLUMNS_PER_INDEX: 8,
    MAX_ROW_SIZE_BYTES: 2 * 1024 * 1024,
    MAX_PK_COMBINED_SIZE_BYTES: 1024,
    MAX_INDEX_COMBINED_SIZE_BYTES: 1024,
    MAX_VIEW_DEFINITION_BYTES: 2 * 1024 * 1024,
    MAX_VARCHAR_LENGTH: 65_535,
    MAX_CHAR_LENGTH: 4_096,
    MAX_NUMERIC_PRECISION: 38,
    MAX_NUMERIC_SCALE: 37,
    MAX_TEXT_SIZE_BYTES: 1024 * 1024,
    MAX_BYTEA_SIZE_BYTES: 1024 * 1024,
    MAX_MUTATED_ROWS_PER_TRANSACTION: 3_000,
    MAX_TRANSACTION_DURATION_SECONDS: 300,
    MAX_DDL_PER_TRANSACTION: 1,
    MAX_TRANSACTION_DATA_SIZE_BYTES: 10 * 1024 * 1024,
    ISOLATION_LEVEL: 'REPEATABLE READ',
    MAX_CONNECTIONS: 10_000,
    CONNECTION_RATE_PER_SECOND: 100,
    CONNECTION_BURST: 1_000,
    CONNECTION_TIMEOUT_MINUTES: 60,
    MAX_TOKEN_LIFETIME_SECONDS: 604_800,
    MAX_QUERY_MEMORY_BYTES: 128 * 1024 * 1024,
};
exports.DSQL_ERROR_CODES = {
    SERIALIZATION_FAILURE: '40001',
    DISK_FULL: '53100',
    OUT_OF_MEMORY: '53200',
    TOO_MANY_CONNECTIONS: '53300',
    CONNECTION_RATE_LIMIT: '53400',
    DATABASE_LIMIT: '54000',
    PROGRAM_LIMIT: '54011',
};
