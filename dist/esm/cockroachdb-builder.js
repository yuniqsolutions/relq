export const DIALECT = 'cockroachdb';
export { integer, int, int4, smallint, int2, bigint, int8, serial, serial4, smallserial, serial2, bigserial, serial8, epoch, decimal, numeric, real, float4, doublePrecision, float8, } from "./schema-definition/pg-schema/column-types/index.js";
export { varchar, characterVarying, char, character, text, } from "./schema-definition/pg-schema/column-types/index.js";
export { bytea, } from "./schema-definition/pg-schema/column-types/index.js";
export { timestamp, timestamptz, timestampWithTimeZone, date, time, timetz, timeWithTimeZone, interval, } from "./schema-definition/pg-schema/column-types/index.js";
export { boolean, bool, } from "./schema-definition/pg-schema/column-types/index.js";
export { inet, cidr, macaddr, macaddr8, } from "./schema-definition/pg-schema/column-types/index.js";
export { bit, bitVarying, varbit, } from "./schema-definition/pg-schema/column-types/index.js";
export { tsvector, tsquery, } from "./schema-definition/pg-schema/column-types/index.js";
export { uuid, } from "./schema-definition/pg-schema/column-types/index.js";
export { json, jsonb, } from "./schema-definition/pg-schema/column-types/index.js";
export { customType, pgDomain, generateDomainSQL, pgComposite, generateCompositeTypeSQL, } from "./schema-definition/pg-schema/column-types/index.js";
export { genRandomUuid, now, currentTimestamp, currentDate, emptyObject, emptyArray, sql, raw, } from "./schema-definition/pg-schema/column-types/index.js";
export { index, } from "./schema-definition/pg-schema/column-types/index.js";
export { EMPTY_OBJECT, EMPTY_ARRAY, SQL_BRAND, } from "./schema-definition/pg-schema/column-types/index.js";
export { createFluentGenExpr, } from "./schema-definition/pg-schema/column-types/index.js";
export { defineTable } from "./schema-definition/pg-schema/table-definition/index.js";
export { sqlFunctions, pgExtensions, getSql, createWhereBuilder, createGeneratedExprBuilder, createTableColumnRefs, expressionBuilder, createExpressionBuilder, } from "./schema-definition/pg-schema/sql-expressions/index.js";
export { parseCreateTable, generateSchemaCode, introspectSQL, introspectMultiple, } from "./schema-definition/pg-schema/introspection/index.js";
export { pgRelations, defineRelations, defineSchema, generateReferencesSQL, actionCodeToString, stringToActionCode, matchCodeToString, } from "./schema-definition/pg-schema/pg-relations/index.js";
export { pgEnum, generateEnumSQL, dropEnumSQL, addEnumValueSQL, } from "./schema-definition/pg-schema/pg-enum.js";
export { pgFunction, generateFunctionSQL, dropFunctionSQL, isFunctionConfig, } from "./schema-definition/pg-schema/pg-function.js";
export { pgSequence, generateSequenceSQL, dropSequenceSQL, isSequenceConfig, } from "./schema-definition/pg-schema/pg-sequence.js";
export { pgView, pgMaterializedView, viewToSQL, materializedViewToSQL, } from "./schema-definition/pg-schema/pg-view.js";
export { partitionStrategyFactory, generatePartitionBySQL, generateChildPartitionSQL, } from "./schema-definition/pg-schema/partitions.js";
export { DEFAULT } from "./schema-definition/pg-schema/defaults.js";
export { getDialectFeatures, validateColumnType, validateColumnTypes, isIndexMethodSupported, getSupportedIndexMethods, isFeatureSupported, getUnsupportedFeatures, compareDialectFeatures, getPortableFeatureSet, COCKROACHDB_FEATURES, DIALECT_FEATURES, } from "./schema-definition/pg-schema/dialect-support/index.js";
export { validateSchemaForDialect, validateTableForDialect, isColumnTypeSupported, getSchemaUnsupportedFeatures, formatValidationReport, } from "./schema-definition/pg-schema/validate-schema/index.js";
export { createFunction } from "./ddl/index.js";
import { validateColumnType as _validateColumnType } from "./schema-definition/pg-schema/dialect-support/index.js";
import { validateSchemaForDialect as _validateSchemaForDialect } from "./schema-definition/pg-schema/validate-schema/index.js";
export function validateForCockroachDB(schema) {
    return _validateSchemaForDialect(schema, { dialect: 'cockroachdb' });
}
export function isSupportedType(sqlType) {
    return _validateColumnType(sqlType, 'cockroachdb');
}
export const UNSUPPORTED_FEATURES = {
    columnTypes: [
        'MONEY',
        'XML',
        'POINT', 'LINE', 'LSEG', 'BOX', 'PATH', 'POLYGON', 'CIRCLE',
        'INT4RANGE', 'INT8RANGE', 'NUMRANGE', 'TSRANGE', 'TSTZRANGE', 'DATERANGE',
        'INT4MULTIRANGE', 'INT8MULTIRANGE', 'NUMMULTIRANGE', 'TSMULTIRANGE', 'TSTZMULTIRANGE', 'DATEMULTIRANGE',
        'OID', 'REGCLASS', 'REGPROC', 'REGTYPE', 'REGNAMESPACE', 'REGROLE',
        'PG_LSN', 'PG_SNAPSHOT',
        'VECTOR', 'HALFVEC', 'SPARSEVEC',
        'GEOMETRY', 'GEOGRAPHY',
        'CITEXT', 'LTREE', 'LQUERY', 'LTXTQUERY', 'HSTORE', 'CUBE', 'SEMVER',
    ],
    indexMethods: ['gist', 'spgist', 'brin'],
    schemaFeatures: [
        'triggers',
        'deferrableForeignKeys',
        'tableInheritance',
        'listenNotify',
    ],
    alternatives: {
        MONEY: 'Use decimal(19, 4) for monetary values',
        XML: 'Use text() to store XML data',
        POINT: 'Use jsonb() to store geometric data as GeoJSON',
        VECTOR: 'Use jsonb() or text() to store embeddings (no native vector similarity search)',
        GEOMETRY: 'CockroachDB has native spatial types with different syntax',
        CITEXT: 'Use text() with LOWER() in queries or case-insensitive collation',
        LTREE: 'Use text() with application-level path handling',
        HSTORE: 'Use jsonb() instead',
        CUBE: 'Use jsonb() or array of float8',
    },
};
export { CRDB_ERRORS, CRDB_WARNINGS, CRDB_INFO, lookupErrorCode, createMessage as createCrdbMessage, formatMessage as formatCrdbMessage, formatValidationResult as formatCrdbValidationResult, createValidationResult as createCrdbValidationResult, } from "./schema-definition/pg-schema/cockroachdb-schema/errors.js";
export { CRDB_TYPE_MAP, getTypeMapping as getCrdbTypeMapping, isTypeSupported as isCrdbTypeSupported, getUnsupportedTypesByCategory, getTypesWithDifferences, } from "./schema-definition/pg-schema/cockroachdb-schema/type-mappings.js";
export { validateColumnType as validateCrdbColumnType, validateColumnTypes as validateCrdbColumnTypes, checkTypeSupport, getAlternative as getCrdbAlternative, getBlockedTypes, getWarningTypes, } from "./schema-definition/pg-schema/cockroachdb-schema/type-validator.js";
export { validateConstraint as validateCrdbConstraint, validateConstraints as validateCrdbConstraints, isConstraintTypeSupported, BLOCKED_CONSTRAINT_FEATURES, } from "./schema-definition/pg-schema/cockroachdb-schema/constraint-validator.js";
export { validateTrigger as validateCrdbTrigger, validateTriggers as validateCrdbTriggers, BLOCKED_TRIGGER_FEATURES, } from "./schema-definition/pg-schema/cockroachdb-schema/trigger-validator.js";
export { validateFunction as validateCrdbFunction, validateFunctions as validateCrdbFunctions, scanFunctionBody, BLOCKED_PLPGSQL_CONSTRUCTS, } from "./schema-definition/pg-schema/cockroachdb-schema/function-validator.js";
export { validateIndex as validateCrdbIndex, validateHashSharded, transformIncludeToStoring, generateHashShardedSQL, isCrdbIndexMethodSupported, BLOCKED_INDEX_METHODS, SUPPORTED_INDEX_METHODS, } from "./schema-definition/pg-schema/cockroachdb-schema/index-builder.js";
export { generateLocalitySQL, generateDatabaseConfigSQL, validateLocality, validateDatabaseConfig, } from "./schema-definition/pg-schema/cockroachdb-schema/locality.js";
export { generateTableZoneSQL, generateIndexZoneSQL, generateDatabaseZoneSQL, validateZoneConfig, } from "./schema-definition/pg-schema/cockroachdb-schema/zone-config.js";
export { generateTTLStorageParams, generateAlterTableTTL, generateRemoveTTL, validateTTL, } from "./schema-definition/pg-schema/cockroachdb-schema/ttl.js";
