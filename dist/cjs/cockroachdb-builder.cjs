"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customType = exports.jsonb = exports.json = exports.uuid = exports.tsquery = exports.tsvector = exports.varbit = exports.bitVarying = exports.bit = exports.macaddr8 = exports.macaddr = exports.cidr = exports.inet = exports.bool = exports.boolean = exports.interval = exports.timeWithTimeZone = exports.timetz = exports.time = exports.date = exports.timestampWithTimeZone = exports.timestamptz = exports.timestamp = exports.bytea = exports.text = exports.character = exports.char = exports.characterVarying = exports.varchar = exports.float8 = exports.doublePrecision = exports.float4 = exports.real = exports.numeric = exports.decimal = exports.epoch = exports.serial8 = exports.bigserial = exports.serial2 = exports.smallserial = exports.serial4 = exports.serial = exports.int8 = exports.bigint = exports.int2 = exports.smallint = exports.int4 = exports.int = exports.integer = exports.DIALECT = void 0;
exports.pgView = exports.isSequenceConfig = exports.dropSequenceSQL = exports.generateSequenceSQL = exports.pgSequence = exports.isFunctionConfig = exports.dropFunctionSQL = exports.generateFunctionSQL = exports.pgFunction = exports.addEnumValueSQL = exports.dropEnumSQL = exports.generateEnumSQL = exports.pgEnum = exports.matchCodeToString = exports.stringToActionCode = exports.actionCodeToString = exports.generateReferencesSQL = exports.defineSchema = exports.defineRelations = exports.pgRelations = exports.introspectMultiple = exports.introspectSQL = exports.generateSchemaCode = exports.parseCreateTable = exports.createExpressionBuilder = exports.expressionBuilder = exports.createTableColumnRefs = exports.createGeneratedExprBuilder = exports.createWhereBuilder = exports.getSql = exports.pgExtensions = exports.sqlFunctions = exports.defineTable = exports.createFluentGenExpr = exports.SQL_BRAND = exports.EMPTY_ARRAY = exports.EMPTY_OBJECT = exports.index = exports.raw = exports.sql = exports.emptyArray = exports.emptyObject = exports.currentDate = exports.currentTimestamp = exports.now = exports.genRandomUuid = exports.generateCompositeTypeSQL = exports.pgComposite = exports.generateDomainSQL = exports.pgDomain = void 0;
exports.validateCrdbTriggers = exports.validateCrdbTrigger = exports.BLOCKED_CONSTRAINT_FEATURES = exports.isConstraintTypeSupported = exports.validateCrdbConstraints = exports.validateCrdbConstraint = exports.getWarningTypes = exports.getBlockedTypes = exports.getCrdbAlternative = exports.checkTypeSupport = exports.validateCrdbColumnTypes = exports.validateCrdbColumnType = exports.getTypesWithDifferences = exports.getUnsupportedTypesByCategory = exports.isCrdbTypeSupported = exports.getCrdbTypeMapping = exports.CRDB_TYPE_MAP = exports.createCrdbValidationResult = exports.formatCrdbValidationResult = exports.formatCrdbMessage = exports.createCrdbMessage = exports.lookupErrorCode = exports.CRDB_INFO = exports.CRDB_WARNINGS = exports.CRDB_ERRORS = exports.UNSUPPORTED_FEATURES = exports.createFunction = exports.formatValidationReport = exports.getSchemaUnsupportedFeatures = exports.isColumnTypeSupported = exports.validateTableForDialect = exports.validateSchemaForDialect = exports.DIALECT_FEATURES = exports.COCKROACHDB_FEATURES = exports.getPortableFeatureSet = exports.compareDialectFeatures = exports.getUnsupportedFeatures = exports.isFeatureSupported = exports.getSupportedIndexMethods = exports.isIndexMethodSupported = exports.validateColumnTypes = exports.validateColumnType = exports.getDialectFeatures = exports.DEFAULT = exports.generateChildPartitionSQL = exports.generatePartitionBySQL = exports.partitionStrategyFactory = exports.materializedViewToSQL = exports.viewToSQL = exports.pgMaterializedView = void 0;
exports.validateTTL = exports.generateRemoveTTL = exports.generateAlterTableTTL = exports.generateTTLStorageParams = exports.validateZoneConfig = exports.generateDatabaseZoneSQL = exports.generateIndexZoneSQL = exports.generateTableZoneSQL = exports.validateDatabaseConfig = exports.validateLocality = exports.generateDatabaseConfigSQL = exports.generateLocalitySQL = exports.SUPPORTED_INDEX_METHODS = exports.BLOCKED_INDEX_METHODS = exports.isCrdbIndexMethodSupported = exports.generateHashShardedSQL = exports.transformIncludeToStoring = exports.validateHashSharded = exports.validateCrdbIndex = exports.BLOCKED_PLPGSQL_CONSTRUCTS = exports.scanFunctionBody = exports.validateCrdbFunctions = exports.validateCrdbFunction = exports.BLOCKED_TRIGGER_FEATURES = void 0;
exports.validateForCockroachDB = validateForCockroachDB;
exports.isSupportedType = isSupportedType;
exports.DIALECT = 'cockroachdb';
var column_types_1 = require("./schema-definition/pg-schema/column-types/index.cjs");
Object.defineProperty(exports, "integer", { enumerable: true, get: function () { return column_types_1.integer; } });
Object.defineProperty(exports, "int", { enumerable: true, get: function () { return column_types_1.int; } });
Object.defineProperty(exports, "int4", { enumerable: true, get: function () { return column_types_1.int4; } });
Object.defineProperty(exports, "smallint", { enumerable: true, get: function () { return column_types_1.smallint; } });
Object.defineProperty(exports, "int2", { enumerable: true, get: function () { return column_types_1.int2; } });
Object.defineProperty(exports, "bigint", { enumerable: true, get: function () { return column_types_1.bigint; } });
Object.defineProperty(exports, "int8", { enumerable: true, get: function () { return column_types_1.int8; } });
Object.defineProperty(exports, "serial", { enumerable: true, get: function () { return column_types_1.serial; } });
Object.defineProperty(exports, "serial4", { enumerable: true, get: function () { return column_types_1.serial4; } });
Object.defineProperty(exports, "smallserial", { enumerable: true, get: function () { return column_types_1.smallserial; } });
Object.defineProperty(exports, "serial2", { enumerable: true, get: function () { return column_types_1.serial2; } });
Object.defineProperty(exports, "bigserial", { enumerable: true, get: function () { return column_types_1.bigserial; } });
Object.defineProperty(exports, "serial8", { enumerable: true, get: function () { return column_types_1.serial8; } });
Object.defineProperty(exports, "epoch", { enumerable: true, get: function () { return column_types_1.epoch; } });
Object.defineProperty(exports, "decimal", { enumerable: true, get: function () { return column_types_1.decimal; } });
Object.defineProperty(exports, "numeric", { enumerable: true, get: function () { return column_types_1.numeric; } });
Object.defineProperty(exports, "real", { enumerable: true, get: function () { return column_types_1.real; } });
Object.defineProperty(exports, "float4", { enumerable: true, get: function () { return column_types_1.float4; } });
Object.defineProperty(exports, "doublePrecision", { enumerable: true, get: function () { return column_types_1.doublePrecision; } });
Object.defineProperty(exports, "float8", { enumerable: true, get: function () { return column_types_1.float8; } });
var column_types_2 = require("./schema-definition/pg-schema/column-types/index.cjs");
Object.defineProperty(exports, "varchar", { enumerable: true, get: function () { return column_types_2.varchar; } });
Object.defineProperty(exports, "characterVarying", { enumerable: true, get: function () { return column_types_2.characterVarying; } });
Object.defineProperty(exports, "char", { enumerable: true, get: function () { return column_types_2.char; } });
Object.defineProperty(exports, "character", { enumerable: true, get: function () { return column_types_2.character; } });
Object.defineProperty(exports, "text", { enumerable: true, get: function () { return column_types_2.text; } });
var column_types_3 = require("./schema-definition/pg-schema/column-types/index.cjs");
Object.defineProperty(exports, "bytea", { enumerable: true, get: function () { return column_types_3.bytea; } });
var column_types_4 = require("./schema-definition/pg-schema/column-types/index.cjs");
Object.defineProperty(exports, "timestamp", { enumerable: true, get: function () { return column_types_4.timestamp; } });
Object.defineProperty(exports, "timestamptz", { enumerable: true, get: function () { return column_types_4.timestamptz; } });
Object.defineProperty(exports, "timestampWithTimeZone", { enumerable: true, get: function () { return column_types_4.timestampWithTimeZone; } });
Object.defineProperty(exports, "date", { enumerable: true, get: function () { return column_types_4.date; } });
Object.defineProperty(exports, "time", { enumerable: true, get: function () { return column_types_4.time; } });
Object.defineProperty(exports, "timetz", { enumerable: true, get: function () { return column_types_4.timetz; } });
Object.defineProperty(exports, "timeWithTimeZone", { enumerable: true, get: function () { return column_types_4.timeWithTimeZone; } });
Object.defineProperty(exports, "interval", { enumerable: true, get: function () { return column_types_4.interval; } });
var column_types_5 = require("./schema-definition/pg-schema/column-types/index.cjs");
Object.defineProperty(exports, "boolean", { enumerable: true, get: function () { return column_types_5.boolean; } });
Object.defineProperty(exports, "bool", { enumerable: true, get: function () { return column_types_5.bool; } });
var column_types_6 = require("./schema-definition/pg-schema/column-types/index.cjs");
Object.defineProperty(exports, "inet", { enumerable: true, get: function () { return column_types_6.inet; } });
Object.defineProperty(exports, "cidr", { enumerable: true, get: function () { return column_types_6.cidr; } });
Object.defineProperty(exports, "macaddr", { enumerable: true, get: function () { return column_types_6.macaddr; } });
Object.defineProperty(exports, "macaddr8", { enumerable: true, get: function () { return column_types_6.macaddr8; } });
var column_types_7 = require("./schema-definition/pg-schema/column-types/index.cjs");
Object.defineProperty(exports, "bit", { enumerable: true, get: function () { return column_types_7.bit; } });
Object.defineProperty(exports, "bitVarying", { enumerable: true, get: function () { return column_types_7.bitVarying; } });
Object.defineProperty(exports, "varbit", { enumerable: true, get: function () { return column_types_7.varbit; } });
var column_types_8 = require("./schema-definition/pg-schema/column-types/index.cjs");
Object.defineProperty(exports, "tsvector", { enumerable: true, get: function () { return column_types_8.tsvector; } });
Object.defineProperty(exports, "tsquery", { enumerable: true, get: function () { return column_types_8.tsquery; } });
var column_types_9 = require("./schema-definition/pg-schema/column-types/index.cjs");
Object.defineProperty(exports, "uuid", { enumerable: true, get: function () { return column_types_9.uuid; } });
var column_types_10 = require("./schema-definition/pg-schema/column-types/index.cjs");
Object.defineProperty(exports, "json", { enumerable: true, get: function () { return column_types_10.json; } });
Object.defineProperty(exports, "jsonb", { enumerable: true, get: function () { return column_types_10.jsonb; } });
var column_types_11 = require("./schema-definition/pg-schema/column-types/index.cjs");
Object.defineProperty(exports, "customType", { enumerable: true, get: function () { return column_types_11.customType; } });
Object.defineProperty(exports, "pgDomain", { enumerable: true, get: function () { return column_types_11.pgDomain; } });
Object.defineProperty(exports, "generateDomainSQL", { enumerable: true, get: function () { return column_types_11.generateDomainSQL; } });
Object.defineProperty(exports, "pgComposite", { enumerable: true, get: function () { return column_types_11.pgComposite; } });
Object.defineProperty(exports, "generateCompositeTypeSQL", { enumerable: true, get: function () { return column_types_11.generateCompositeTypeSQL; } });
var column_types_12 = require("./schema-definition/pg-schema/column-types/index.cjs");
Object.defineProperty(exports, "genRandomUuid", { enumerable: true, get: function () { return column_types_12.genRandomUuid; } });
Object.defineProperty(exports, "now", { enumerable: true, get: function () { return column_types_12.now; } });
Object.defineProperty(exports, "currentTimestamp", { enumerable: true, get: function () { return column_types_12.currentTimestamp; } });
Object.defineProperty(exports, "currentDate", { enumerable: true, get: function () { return column_types_12.currentDate; } });
Object.defineProperty(exports, "emptyObject", { enumerable: true, get: function () { return column_types_12.emptyObject; } });
Object.defineProperty(exports, "emptyArray", { enumerable: true, get: function () { return column_types_12.emptyArray; } });
Object.defineProperty(exports, "sql", { enumerable: true, get: function () { return column_types_12.sql; } });
Object.defineProperty(exports, "raw", { enumerable: true, get: function () { return column_types_12.raw; } });
var column_types_13 = require("./schema-definition/pg-schema/column-types/index.cjs");
Object.defineProperty(exports, "index", { enumerable: true, get: function () { return column_types_13.index; } });
var column_types_14 = require("./schema-definition/pg-schema/column-types/index.cjs");
Object.defineProperty(exports, "EMPTY_OBJECT", { enumerable: true, get: function () { return column_types_14.EMPTY_OBJECT; } });
Object.defineProperty(exports, "EMPTY_ARRAY", { enumerable: true, get: function () { return column_types_14.EMPTY_ARRAY; } });
Object.defineProperty(exports, "SQL_BRAND", { enumerable: true, get: function () { return column_types_14.SQL_BRAND; } });
var column_types_15 = require("./schema-definition/pg-schema/column-types/index.cjs");
Object.defineProperty(exports, "createFluentGenExpr", { enumerable: true, get: function () { return column_types_15.createFluentGenExpr; } });
var table_definition_1 = require("./schema-definition/pg-schema/table-definition/index.cjs");
Object.defineProperty(exports, "defineTable", { enumerable: true, get: function () { return table_definition_1.defineTable; } });
var sql_expressions_1 = require("./schema-definition/pg-schema/sql-expressions/index.cjs");
Object.defineProperty(exports, "sqlFunctions", { enumerable: true, get: function () { return sql_expressions_1.sqlFunctions; } });
Object.defineProperty(exports, "pgExtensions", { enumerable: true, get: function () { return sql_expressions_1.pgExtensions; } });
Object.defineProperty(exports, "getSql", { enumerable: true, get: function () { return sql_expressions_1.getSql; } });
Object.defineProperty(exports, "createWhereBuilder", { enumerable: true, get: function () { return sql_expressions_1.createWhereBuilder; } });
Object.defineProperty(exports, "createGeneratedExprBuilder", { enumerable: true, get: function () { return sql_expressions_1.createGeneratedExprBuilder; } });
Object.defineProperty(exports, "createTableColumnRefs", { enumerable: true, get: function () { return sql_expressions_1.createTableColumnRefs; } });
Object.defineProperty(exports, "expressionBuilder", { enumerable: true, get: function () { return sql_expressions_1.expressionBuilder; } });
Object.defineProperty(exports, "createExpressionBuilder", { enumerable: true, get: function () { return sql_expressions_1.createExpressionBuilder; } });
var introspection_1 = require("./schema-definition/pg-schema/introspection/index.cjs");
Object.defineProperty(exports, "parseCreateTable", { enumerable: true, get: function () { return introspection_1.parseCreateTable; } });
Object.defineProperty(exports, "generateSchemaCode", { enumerable: true, get: function () { return introspection_1.generateSchemaCode; } });
Object.defineProperty(exports, "introspectSQL", { enumerable: true, get: function () { return introspection_1.introspectSQL; } });
Object.defineProperty(exports, "introspectMultiple", { enumerable: true, get: function () { return introspection_1.introspectMultiple; } });
var pg_relations_1 = require("./schema-definition/pg-schema/pg-relations/index.cjs");
Object.defineProperty(exports, "pgRelations", { enumerable: true, get: function () { return pg_relations_1.pgRelations; } });
Object.defineProperty(exports, "defineRelations", { enumerable: true, get: function () { return pg_relations_1.defineRelations; } });
Object.defineProperty(exports, "defineSchema", { enumerable: true, get: function () { return pg_relations_1.defineSchema; } });
Object.defineProperty(exports, "generateReferencesSQL", { enumerable: true, get: function () { return pg_relations_1.generateReferencesSQL; } });
Object.defineProperty(exports, "actionCodeToString", { enumerable: true, get: function () { return pg_relations_1.actionCodeToString; } });
Object.defineProperty(exports, "stringToActionCode", { enumerable: true, get: function () { return pg_relations_1.stringToActionCode; } });
Object.defineProperty(exports, "matchCodeToString", { enumerable: true, get: function () { return pg_relations_1.matchCodeToString; } });
var pg_enum_1 = require("./schema-definition/pg-schema/pg-enum.cjs");
Object.defineProperty(exports, "pgEnum", { enumerable: true, get: function () { return pg_enum_1.pgEnum; } });
Object.defineProperty(exports, "generateEnumSQL", { enumerable: true, get: function () { return pg_enum_1.generateEnumSQL; } });
Object.defineProperty(exports, "dropEnumSQL", { enumerable: true, get: function () { return pg_enum_1.dropEnumSQL; } });
Object.defineProperty(exports, "addEnumValueSQL", { enumerable: true, get: function () { return pg_enum_1.addEnumValueSQL; } });
var pg_function_1 = require("./schema-definition/pg-schema/pg-function.cjs");
Object.defineProperty(exports, "pgFunction", { enumerable: true, get: function () { return pg_function_1.pgFunction; } });
Object.defineProperty(exports, "generateFunctionSQL", { enumerable: true, get: function () { return pg_function_1.generateFunctionSQL; } });
Object.defineProperty(exports, "dropFunctionSQL", { enumerable: true, get: function () { return pg_function_1.dropFunctionSQL; } });
Object.defineProperty(exports, "isFunctionConfig", { enumerable: true, get: function () { return pg_function_1.isFunctionConfig; } });
var pg_sequence_1 = require("./schema-definition/pg-schema/pg-sequence.cjs");
Object.defineProperty(exports, "pgSequence", { enumerable: true, get: function () { return pg_sequence_1.pgSequence; } });
Object.defineProperty(exports, "generateSequenceSQL", { enumerable: true, get: function () { return pg_sequence_1.generateSequenceSQL; } });
Object.defineProperty(exports, "dropSequenceSQL", { enumerable: true, get: function () { return pg_sequence_1.dropSequenceSQL; } });
Object.defineProperty(exports, "isSequenceConfig", { enumerable: true, get: function () { return pg_sequence_1.isSequenceConfig; } });
var pg_view_1 = require("./schema-definition/pg-schema/pg-view.cjs");
Object.defineProperty(exports, "pgView", { enumerable: true, get: function () { return pg_view_1.pgView; } });
Object.defineProperty(exports, "pgMaterializedView", { enumerable: true, get: function () { return pg_view_1.pgMaterializedView; } });
Object.defineProperty(exports, "viewToSQL", { enumerable: true, get: function () { return pg_view_1.viewToSQL; } });
Object.defineProperty(exports, "materializedViewToSQL", { enumerable: true, get: function () { return pg_view_1.materializedViewToSQL; } });
var partitions_1 = require("./schema-definition/pg-schema/partitions.cjs");
Object.defineProperty(exports, "partitionStrategyFactory", { enumerable: true, get: function () { return partitions_1.partitionStrategyFactory; } });
Object.defineProperty(exports, "generatePartitionBySQL", { enumerable: true, get: function () { return partitions_1.generatePartitionBySQL; } });
Object.defineProperty(exports, "generateChildPartitionSQL", { enumerable: true, get: function () { return partitions_1.generateChildPartitionSQL; } });
var defaults_1 = require("./schema-definition/pg-schema/defaults.cjs");
Object.defineProperty(exports, "DEFAULT", { enumerable: true, get: function () { return defaults_1.DEFAULT; } });
var dialect_support_1 = require("./schema-definition/pg-schema/dialect-support/index.cjs");
Object.defineProperty(exports, "getDialectFeatures", { enumerable: true, get: function () { return dialect_support_1.getDialectFeatures; } });
Object.defineProperty(exports, "validateColumnType", { enumerable: true, get: function () { return dialect_support_1.validateColumnType; } });
Object.defineProperty(exports, "validateColumnTypes", { enumerable: true, get: function () { return dialect_support_1.validateColumnTypes; } });
Object.defineProperty(exports, "isIndexMethodSupported", { enumerable: true, get: function () { return dialect_support_1.isIndexMethodSupported; } });
Object.defineProperty(exports, "getSupportedIndexMethods", { enumerable: true, get: function () { return dialect_support_1.getSupportedIndexMethods; } });
Object.defineProperty(exports, "isFeatureSupported", { enumerable: true, get: function () { return dialect_support_1.isFeatureSupported; } });
Object.defineProperty(exports, "getUnsupportedFeatures", { enumerable: true, get: function () { return dialect_support_1.getUnsupportedFeatures; } });
Object.defineProperty(exports, "compareDialectFeatures", { enumerable: true, get: function () { return dialect_support_1.compareDialectFeatures; } });
Object.defineProperty(exports, "getPortableFeatureSet", { enumerable: true, get: function () { return dialect_support_1.getPortableFeatureSet; } });
Object.defineProperty(exports, "COCKROACHDB_FEATURES", { enumerable: true, get: function () { return dialect_support_1.COCKROACHDB_FEATURES; } });
Object.defineProperty(exports, "DIALECT_FEATURES", { enumerable: true, get: function () { return dialect_support_1.DIALECT_FEATURES; } });
var validate_schema_1 = require("./schema-definition/pg-schema/validate-schema/index.cjs");
Object.defineProperty(exports, "validateSchemaForDialect", { enumerable: true, get: function () { return validate_schema_1.validateSchemaForDialect; } });
Object.defineProperty(exports, "validateTableForDialect", { enumerable: true, get: function () { return validate_schema_1.validateTableForDialect; } });
Object.defineProperty(exports, "isColumnTypeSupported", { enumerable: true, get: function () { return validate_schema_1.isColumnTypeSupported; } });
Object.defineProperty(exports, "getSchemaUnsupportedFeatures", { enumerable: true, get: function () { return validate_schema_1.getSchemaUnsupportedFeatures; } });
Object.defineProperty(exports, "formatValidationReport", { enumerable: true, get: function () { return validate_schema_1.formatValidationReport; } });
var ddl_1 = require("./ddl/index.cjs");
Object.defineProperty(exports, "createFunction", { enumerable: true, get: function () { return ddl_1.createFunction; } });
const dialect_support_2 = require("./schema-definition/pg-schema/dialect-support/index.cjs");
const validate_schema_2 = require("./schema-definition/pg-schema/validate-schema/index.cjs");
function validateForCockroachDB(schema) {
    return (0, validate_schema_2.validateSchemaForDialect)(schema, { dialect: 'cockroachdb' });
}
function isSupportedType(sqlType) {
    return (0, dialect_support_2.validateColumnType)(sqlType, 'cockroachdb');
}
exports.UNSUPPORTED_FEATURES = {
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
var errors_1 = require("./schema-definition/pg-schema/cockroachdb-schema/errors.cjs");
Object.defineProperty(exports, "CRDB_ERRORS", { enumerable: true, get: function () { return errors_1.CRDB_ERRORS; } });
Object.defineProperty(exports, "CRDB_WARNINGS", { enumerable: true, get: function () { return errors_1.CRDB_WARNINGS; } });
Object.defineProperty(exports, "CRDB_INFO", { enumerable: true, get: function () { return errors_1.CRDB_INFO; } });
Object.defineProperty(exports, "lookupErrorCode", { enumerable: true, get: function () { return errors_1.lookupErrorCode; } });
Object.defineProperty(exports, "createCrdbMessage", { enumerable: true, get: function () { return errors_1.createMessage; } });
Object.defineProperty(exports, "formatCrdbMessage", { enumerable: true, get: function () { return errors_1.formatMessage; } });
Object.defineProperty(exports, "formatCrdbValidationResult", { enumerable: true, get: function () { return errors_1.formatValidationResult; } });
Object.defineProperty(exports, "createCrdbValidationResult", { enumerable: true, get: function () { return errors_1.createValidationResult; } });
var type_mappings_1 = require("./schema-definition/pg-schema/cockroachdb-schema/type-mappings.cjs");
Object.defineProperty(exports, "CRDB_TYPE_MAP", { enumerable: true, get: function () { return type_mappings_1.CRDB_TYPE_MAP; } });
Object.defineProperty(exports, "getCrdbTypeMapping", { enumerable: true, get: function () { return type_mappings_1.getTypeMapping; } });
Object.defineProperty(exports, "isCrdbTypeSupported", { enumerable: true, get: function () { return type_mappings_1.isTypeSupported; } });
Object.defineProperty(exports, "getUnsupportedTypesByCategory", { enumerable: true, get: function () { return type_mappings_1.getUnsupportedTypesByCategory; } });
Object.defineProperty(exports, "getTypesWithDifferences", { enumerable: true, get: function () { return type_mappings_1.getTypesWithDifferences; } });
var type_validator_1 = require("./schema-definition/pg-schema/cockroachdb-schema/type-validator.cjs");
Object.defineProperty(exports, "validateCrdbColumnType", { enumerable: true, get: function () { return type_validator_1.validateColumnType; } });
Object.defineProperty(exports, "validateCrdbColumnTypes", { enumerable: true, get: function () { return type_validator_1.validateColumnTypes; } });
Object.defineProperty(exports, "checkTypeSupport", { enumerable: true, get: function () { return type_validator_1.checkTypeSupport; } });
Object.defineProperty(exports, "getCrdbAlternative", { enumerable: true, get: function () { return type_validator_1.getAlternative; } });
Object.defineProperty(exports, "getBlockedTypes", { enumerable: true, get: function () { return type_validator_1.getBlockedTypes; } });
Object.defineProperty(exports, "getWarningTypes", { enumerable: true, get: function () { return type_validator_1.getWarningTypes; } });
var constraint_validator_1 = require("./schema-definition/pg-schema/cockroachdb-schema/constraint-validator.cjs");
Object.defineProperty(exports, "validateCrdbConstraint", { enumerable: true, get: function () { return constraint_validator_1.validateConstraint; } });
Object.defineProperty(exports, "validateCrdbConstraints", { enumerable: true, get: function () { return constraint_validator_1.validateConstraints; } });
Object.defineProperty(exports, "isConstraintTypeSupported", { enumerable: true, get: function () { return constraint_validator_1.isConstraintTypeSupported; } });
Object.defineProperty(exports, "BLOCKED_CONSTRAINT_FEATURES", { enumerable: true, get: function () { return constraint_validator_1.BLOCKED_CONSTRAINT_FEATURES; } });
var trigger_validator_1 = require("./schema-definition/pg-schema/cockroachdb-schema/trigger-validator.cjs");
Object.defineProperty(exports, "validateCrdbTrigger", { enumerable: true, get: function () { return trigger_validator_1.validateTrigger; } });
Object.defineProperty(exports, "validateCrdbTriggers", { enumerable: true, get: function () { return trigger_validator_1.validateTriggers; } });
Object.defineProperty(exports, "BLOCKED_TRIGGER_FEATURES", { enumerable: true, get: function () { return trigger_validator_1.BLOCKED_TRIGGER_FEATURES; } });
var function_validator_1 = require("./schema-definition/pg-schema/cockroachdb-schema/function-validator.cjs");
Object.defineProperty(exports, "validateCrdbFunction", { enumerable: true, get: function () { return function_validator_1.validateFunction; } });
Object.defineProperty(exports, "validateCrdbFunctions", { enumerable: true, get: function () { return function_validator_1.validateFunctions; } });
Object.defineProperty(exports, "scanFunctionBody", { enumerable: true, get: function () { return function_validator_1.scanFunctionBody; } });
Object.defineProperty(exports, "BLOCKED_PLPGSQL_CONSTRUCTS", { enumerable: true, get: function () { return function_validator_1.BLOCKED_PLPGSQL_CONSTRUCTS; } });
var index_builder_1 = require("./schema-definition/pg-schema/cockroachdb-schema/index-builder.cjs");
Object.defineProperty(exports, "validateCrdbIndex", { enumerable: true, get: function () { return index_builder_1.validateIndex; } });
Object.defineProperty(exports, "validateHashSharded", { enumerable: true, get: function () { return index_builder_1.validateHashSharded; } });
Object.defineProperty(exports, "transformIncludeToStoring", { enumerable: true, get: function () { return index_builder_1.transformIncludeToStoring; } });
Object.defineProperty(exports, "generateHashShardedSQL", { enumerable: true, get: function () { return index_builder_1.generateHashShardedSQL; } });
Object.defineProperty(exports, "isCrdbIndexMethodSupported", { enumerable: true, get: function () { return index_builder_1.isCrdbIndexMethodSupported; } });
Object.defineProperty(exports, "BLOCKED_INDEX_METHODS", { enumerable: true, get: function () { return index_builder_1.BLOCKED_INDEX_METHODS; } });
Object.defineProperty(exports, "SUPPORTED_INDEX_METHODS", { enumerable: true, get: function () { return index_builder_1.SUPPORTED_INDEX_METHODS; } });
var locality_1 = require("./schema-definition/pg-schema/cockroachdb-schema/locality.cjs");
Object.defineProperty(exports, "generateLocalitySQL", { enumerable: true, get: function () { return locality_1.generateLocalitySQL; } });
Object.defineProperty(exports, "generateDatabaseConfigSQL", { enumerable: true, get: function () { return locality_1.generateDatabaseConfigSQL; } });
Object.defineProperty(exports, "validateLocality", { enumerable: true, get: function () { return locality_1.validateLocality; } });
Object.defineProperty(exports, "validateDatabaseConfig", { enumerable: true, get: function () { return locality_1.validateDatabaseConfig; } });
var zone_config_1 = require("./schema-definition/pg-schema/cockroachdb-schema/zone-config.cjs");
Object.defineProperty(exports, "generateTableZoneSQL", { enumerable: true, get: function () { return zone_config_1.generateTableZoneSQL; } });
Object.defineProperty(exports, "generateIndexZoneSQL", { enumerable: true, get: function () { return zone_config_1.generateIndexZoneSQL; } });
Object.defineProperty(exports, "generateDatabaseZoneSQL", { enumerable: true, get: function () { return zone_config_1.generateDatabaseZoneSQL; } });
Object.defineProperty(exports, "validateZoneConfig", { enumerable: true, get: function () { return zone_config_1.validateZoneConfig; } });
var ttl_1 = require("./schema-definition/pg-schema/cockroachdb-schema/ttl.cjs");
Object.defineProperty(exports, "generateTTLStorageParams", { enumerable: true, get: function () { return ttl_1.generateTTLStorageParams; } });
Object.defineProperty(exports, "generateAlterTableTTL", { enumerable: true, get: function () { return ttl_1.generateAlterTableTTL; } });
Object.defineProperty(exports, "generateRemoveTTL", { enumerable: true, get: function () { return ttl_1.generateRemoveTTL; } });
Object.defineProperty(exports, "validateTTL", { enumerable: true, get: function () { return ttl_1.validateTTL; } });
