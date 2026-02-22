export const DIALECT = 'dsql';
export { integer, int, int4, smallint, int2, bigint, int8, epoch, decimal, numeric, real, float4, doublePrecision, float8, } from "./schema-definition/pg-schema/column-types/index.js";
export { varchar, characterVarying, char, character, text, } from "./schema-definition/pg-schema/column-types/index.js";
export { bytea, } from "./schema-definition/pg-schema/column-types/index.js";
export { timestamp, timestamptz, timestampWithTimeZone, date, time, timetz, timeWithTimeZone, interval, } from "./schema-definition/pg-schema/column-types/index.js";
export { boolean, bool, } from "./schema-definition/pg-schema/column-types/index.js";
export { uuid, } from "./schema-definition/pg-schema/column-types/index.js";
export { customType, pgDomain, generateDomainSQL, pgComposite, generateCompositeTypeSQL, } from "./schema-definition/pg-schema/column-types/index.js";
export { genRandomUuid, now, currentTimestamp, currentDate, emptyObject, emptyArray, sql, raw, } from "./schema-definition/pg-schema/column-types/index.js";
export { index, } from "./schema-definition/pg-schema/column-types/index.js";
export { EMPTY_OBJECT, EMPTY_ARRAY, SQL_BRAND, } from "./schema-definition/pg-schema/column-types/index.js";
export { createFluentGenExpr, } from "./schema-definition/pg-schema/column-types/index.js";
export { defineTable } from "./schema-definition/pg-schema/table-definition/index.js";
export { sqlFunctions, pgExtensions, getSql, createWhereBuilder, createGeneratedExprBuilder, } from "./schema-definition/pg-schema/sql-expressions/index.js";
export { pgRelations, } from "./schema-definition/pg-schema/pg-relations/index.js";
export { pgEnum, generateEnumSQL, dropEnumSQL, addEnumValueSQL, } from "./schema-definition/pg-schema/pg-enum.js";
export { pgFunction, generateFunctionSQL, dropFunctionSQL, isFunctionConfig, } from "./schema-definition/pg-schema/pg-function.js";
export { pgView, viewToSQL, } from "./schema-definition/pg-schema/pg-view.js";
export { DEFAULT } from "./schema-definition/pg-schema/defaults.js";
export { getDialectFeatures, validateColumnType, validateColumnTypes, isIndexMethodSupported, getSupportedIndexMethods, isFeatureSupported, getUnsupportedFeatures, compareDialectFeatures, getPortableFeatureSet, DIALECT_FEATURES, } from "./schema-definition/pg-schema/dialect-support/index.js";
export { validateSchemaForDialect, validateTableForDialect, isColumnTypeSupported, getSchemaUnsupportedFeatures, formatValidationReport, } from "./schema-definition/pg-schema/validate-schema/index.js";
export { createFunction } from "./ddl/index.js";
export { DSQL_TYPE_ERRORS, DSQL_LIMIT_WARNINGS, DSQL_MOD_ERRORS, DSQL_CONS_RULES, DSQL_IDX_RULES, DSQL_IDX_LIMIT_RULES, DSQL_TBL_RULES, DSQL_FN_RULES, DSQL_TRIG_RULES, DSQL_VIEW_RULES, DSQL_EXT_RULES, DSQL_SEQ_RULES, DSQL_DB_RULES, DSQL_TXN_RULES, DSQL_MISC_RULES, DSQL_ALL_RULES, createDsqlValidationResult, lookupDsqlRule, createDsqlMessage, formatDsqlMessage, formatDsqlValidationResult, } from "./schema-definition/pg-schema/dsql-schema/errors.js";
export { DSQL_DATABASE_LIMITS, DSQL_TABLE_LIMITS, DSQL_TYPE_LIMITS, DSQL_CONNECTION_LIMITS, DSQL_TRANSACTION_LIMITS, DSQL_NON_INDEXABLE_TYPES, DSQL_SUPPORTED_INDEX_METHODS, DSQL_BLOCKED_INDEX_METHODS, } from "./schema-definition/pg-schema/dsql-schema/limits.js";
export { DSQL_TYPE_MAP, getDsqlTypeMapping, isDsqlTypeSupported, getDsqlUnsupportedTypesByCategory, } from "./schema-definition/pg-schema/dsql-schema/type-mappings.js";
export { validateDsqlColumnType, validateDsqlColumnTypes, checkDsqlTypeSupport, getDsqlAlternative, getDsqlBlockedTypes, } from "./schema-definition/pg-schema/dsql-schema/type-validator.js";
export { validateDsqlConstraint, validateDsqlConstraints, DSQL_CONSTRAINT_RULES, } from "./schema-definition/pg-schema/dsql-schema/constraint-validator.js";
export { validateDsqlIndex, validateDsqlIndexes, isDsqlIndexMethodSupported, } from "./schema-definition/pg-schema/dsql-schema/index-validator.js";
export { validateDsqlTable, validateDsqlTableCount, validateDsqlSchemaCount, DSQL_BLOCKED_TABLE_FEATURES, } from "./schema-definition/pg-schema/dsql-schema/table-validator.js";
export { validateDsqlFunction, validateDsqlFunctions, isDsqlLanguageSupported, DSQL_BLOCKED_LANGUAGES, } from "./schema-definition/pg-schema/dsql-schema/function-validator.js";
export { validateDsqlTrigger, validateDsqlTriggers, } from "./schema-definition/pg-schema/dsql-schema/trigger-validator.js";
export { validateDsqlSequence, validateDsqlSequences, validateDsqlSequenceExpression, DSQL_BLOCKED_SEQUENCE_FUNCTIONS, } from "./schema-definition/pg-schema/dsql-schema/sequence-validator.js";
export { validateDsqlView, validateDsqlViewCount, validateDsqlViews, } from "./schema-definition/pg-schema/dsql-schema/view-validator.js";
export { validateDsqlMiscSql, validateDsqlExtensions, validateDsqlColumnModifier, DSQL_BLOCKED_MISC_FEATURES, } from "./schema-definition/pg-schema/dsql-schema/misc-validator.js";
import { validateSchemaForDialect as _validateSchemaForDialect } from "./schema-definition/pg-schema/validate-schema/index.js";
export function validateForDSQL(schema) {
    return _validateSchemaForDialect(schema, { dialect: 'dsql' });
}
export const DSQL_UNSUPPORTED_FEATURES = {
    columnTypes: [
        'SERIAL', 'BIGSERIAL', 'SMALLSERIAL',
        'JSON', 'JSONB',
        'XML',
        'MONEY',
        'POINT', 'LINE', 'LSEG', 'BOX', 'PATH', 'POLYGON', 'CIRCLE',
        'INT4RANGE', 'INT8RANGE', 'NUMRANGE', 'TSRANGE', 'TSTZRANGE', 'DATERANGE',
        'INT4MULTIRANGE', 'INT8MULTIRANGE', 'NUMMULTIRANGE', 'TSMULTIRANGE', 'TSTZMULTIRANGE', 'DATEMULTIRANGE',
        'BIT', 'BIT VARYING', 'VARBIT',
        'INET', 'CIDR', 'MACADDR', 'MACADDR8',
        'TSVECTOR', 'TSQUERY',
        'OID', 'REGCLASS', 'REGPROC', 'REGTYPE',
        'PG_LSN', 'PG_SNAPSHOT',
        'ARRAY (as column type)',
    ],
    indexMethods: ['gin', 'gist', 'spgist', 'brin', 'hash'],
    schemaFeatures: [
        'triggers',
        'sequences',
        'materializedViews',
        'partitioning',
        'extensions',
        'plpgsql',
        'temporaryTables',
        'unloggedTables',
        'tableInheritance',
        'listenNotify',
        'advisoryLocks',
        'deferrableConstraints',
        'exclusionConstraints',
    ],
    nonIndexableTypes: ['bytea', 'interval', 'timetz'],
    alternatives: {
        SERIAL: 'uuid().default(genRandomUuid())',
        JSON: 'text() — cast with col::jsonb at query time',
        JSONB: 'text() — cast with col::jsonb at query time',
        XML: 'text()',
        MONEY: 'numeric(19, 4)',
        INET: 'varchar(45)',
        CIDR: 'text()',
        MACADDR: 'varchar(17)',
        BIT: 'bytea() or text()',
        TSVECTOR: 'text() + external search service',
        POINT: 'Two numeric columns',
        INT4RANGE: 'Two integer columns (lower, upper)',
    },
};
