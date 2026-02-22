"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFluentGenExpr = exports.SQL_BRAND = exports.EMPTY_ARRAY = exports.EMPTY_OBJECT = exports.index = exports.raw = exports.sql = exports.emptyArray = exports.emptyObject = exports.currentDate = exports.currentTimestamp = exports.now = exports.genRandomUuid = exports.generateCompositeTypeSQL = exports.pgComposite = exports.generateDomainSQL = exports.pgDomain = exports.customType = exports.uuid = exports.bool = exports.boolean = exports.interval = exports.timeWithTimeZone = exports.timetz = exports.time = exports.date = exports.timestampWithTimeZone = exports.timestamptz = exports.timestamp = exports.bytea = exports.text = exports.character = exports.char = exports.characterVarying = exports.varchar = exports.float8 = exports.doublePrecision = exports.float4 = exports.real = exports.numeric = exports.decimal = exports.epoch = exports.int8 = exports.bigint = exports.int2 = exports.smallint = exports.int4 = exports.int = exports.integer = exports.DIALECT = void 0;
exports.DSQL_ALL_RULES = exports.DSQL_MISC_RULES = exports.DSQL_TXN_RULES = exports.DSQL_DB_RULES = exports.DSQL_SEQ_RULES = exports.DSQL_EXT_RULES = exports.DSQL_VIEW_RULES = exports.DSQL_TRIG_RULES = exports.DSQL_FN_RULES = exports.DSQL_TBL_RULES = exports.DSQL_IDX_LIMIT_RULES = exports.DSQL_IDX_RULES = exports.DSQL_CONS_RULES = exports.DSQL_MOD_ERRORS = exports.DSQL_LIMIT_WARNINGS = exports.DSQL_TYPE_ERRORS = exports.createFunction = exports.formatValidationReport = exports.getSchemaUnsupportedFeatures = exports.isColumnTypeSupported = exports.validateTableForDialect = exports.validateSchemaForDialect = exports.DIALECT_FEATURES = exports.getPortableFeatureSet = exports.compareDialectFeatures = exports.getUnsupportedFeatures = exports.isFeatureSupported = exports.getSupportedIndexMethods = exports.isIndexMethodSupported = exports.validateColumnTypes = exports.validateColumnType = exports.getDialectFeatures = exports.DEFAULT = exports.viewToSQL = exports.pgView = exports.isFunctionConfig = exports.dropFunctionSQL = exports.generateFunctionSQL = exports.pgFunction = exports.addEnumValueSQL = exports.dropEnumSQL = exports.generateEnumSQL = exports.pgEnum = exports.pgRelations = exports.createGeneratedExprBuilder = exports.createWhereBuilder = exports.getSql = exports.pgExtensions = exports.sqlFunctions = exports.defineTable = void 0;
exports.DSQL_UNSUPPORTED_FEATURES = exports.DSQL_BLOCKED_MISC_FEATURES = exports.validateDsqlColumnModifier = exports.validateDsqlExtensions = exports.validateDsqlMiscSql = exports.validateDsqlViews = exports.validateDsqlViewCount = exports.validateDsqlView = exports.DSQL_BLOCKED_SEQUENCE_FUNCTIONS = exports.validateDsqlSequenceExpression = exports.validateDsqlSequences = exports.validateDsqlSequence = exports.validateDsqlTriggers = exports.validateDsqlTrigger = exports.DSQL_BLOCKED_LANGUAGES = exports.isDsqlLanguageSupported = exports.validateDsqlFunctions = exports.validateDsqlFunction = exports.DSQL_BLOCKED_TABLE_FEATURES = exports.validateDsqlSchemaCount = exports.validateDsqlTableCount = exports.validateDsqlTable = exports.isDsqlIndexMethodSupported = exports.validateDsqlIndexes = exports.validateDsqlIndex = exports.DSQL_CONSTRAINT_RULES = exports.validateDsqlConstraints = exports.validateDsqlConstraint = exports.getDsqlBlockedTypes = exports.getDsqlAlternative = exports.checkDsqlTypeSupport = exports.validateDsqlColumnTypes = exports.validateDsqlColumnType = exports.getDsqlUnsupportedTypesByCategory = exports.isDsqlTypeSupported = exports.getDsqlTypeMapping = exports.DSQL_TYPE_MAP = exports.DSQL_BLOCKED_INDEX_METHODS = exports.DSQL_SUPPORTED_INDEX_METHODS = exports.DSQL_NON_INDEXABLE_TYPES = exports.DSQL_TRANSACTION_LIMITS = exports.DSQL_CONNECTION_LIMITS = exports.DSQL_TYPE_LIMITS = exports.DSQL_TABLE_LIMITS = exports.DSQL_DATABASE_LIMITS = exports.formatDsqlValidationResult = exports.formatDsqlMessage = exports.createDsqlMessage = exports.lookupDsqlRule = exports.createDsqlValidationResult = void 0;
exports.validateForDSQL = validateForDSQL;
exports.DIALECT = 'dsql';
var column_types_1 = require("./schema-definition/pg-schema/column-types/index.cjs");
Object.defineProperty(exports, "integer", { enumerable: true, get: function () { return column_types_1.integer; } });
Object.defineProperty(exports, "int", { enumerable: true, get: function () { return column_types_1.int; } });
Object.defineProperty(exports, "int4", { enumerable: true, get: function () { return column_types_1.int4; } });
Object.defineProperty(exports, "smallint", { enumerable: true, get: function () { return column_types_1.smallint; } });
Object.defineProperty(exports, "int2", { enumerable: true, get: function () { return column_types_1.int2; } });
Object.defineProperty(exports, "bigint", { enumerable: true, get: function () { return column_types_1.bigint; } });
Object.defineProperty(exports, "int8", { enumerable: true, get: function () { return column_types_1.int8; } });
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
Object.defineProperty(exports, "uuid", { enumerable: true, get: function () { return column_types_6.uuid; } });
var column_types_7 = require("./schema-definition/pg-schema/column-types/index.cjs");
Object.defineProperty(exports, "customType", { enumerable: true, get: function () { return column_types_7.customType; } });
Object.defineProperty(exports, "pgDomain", { enumerable: true, get: function () { return column_types_7.pgDomain; } });
Object.defineProperty(exports, "generateDomainSQL", { enumerable: true, get: function () { return column_types_7.generateDomainSQL; } });
Object.defineProperty(exports, "pgComposite", { enumerable: true, get: function () { return column_types_7.pgComposite; } });
Object.defineProperty(exports, "generateCompositeTypeSQL", { enumerable: true, get: function () { return column_types_7.generateCompositeTypeSQL; } });
var column_types_8 = require("./schema-definition/pg-schema/column-types/index.cjs");
Object.defineProperty(exports, "genRandomUuid", { enumerable: true, get: function () { return column_types_8.genRandomUuid; } });
Object.defineProperty(exports, "now", { enumerable: true, get: function () { return column_types_8.now; } });
Object.defineProperty(exports, "currentTimestamp", { enumerable: true, get: function () { return column_types_8.currentTimestamp; } });
Object.defineProperty(exports, "currentDate", { enumerable: true, get: function () { return column_types_8.currentDate; } });
Object.defineProperty(exports, "emptyObject", { enumerable: true, get: function () { return column_types_8.emptyObject; } });
Object.defineProperty(exports, "emptyArray", { enumerable: true, get: function () { return column_types_8.emptyArray; } });
Object.defineProperty(exports, "sql", { enumerable: true, get: function () { return column_types_8.sql; } });
Object.defineProperty(exports, "raw", { enumerable: true, get: function () { return column_types_8.raw; } });
var column_types_9 = require("./schema-definition/pg-schema/column-types/index.cjs");
Object.defineProperty(exports, "index", { enumerable: true, get: function () { return column_types_9.index; } });
var column_types_10 = require("./schema-definition/pg-schema/column-types/index.cjs");
Object.defineProperty(exports, "EMPTY_OBJECT", { enumerable: true, get: function () { return column_types_10.EMPTY_OBJECT; } });
Object.defineProperty(exports, "EMPTY_ARRAY", { enumerable: true, get: function () { return column_types_10.EMPTY_ARRAY; } });
Object.defineProperty(exports, "SQL_BRAND", { enumerable: true, get: function () { return column_types_10.SQL_BRAND; } });
var column_types_11 = require("./schema-definition/pg-schema/column-types/index.cjs");
Object.defineProperty(exports, "createFluentGenExpr", { enumerable: true, get: function () { return column_types_11.createFluentGenExpr; } });
var table_definition_1 = require("./schema-definition/pg-schema/table-definition/index.cjs");
Object.defineProperty(exports, "defineTable", { enumerable: true, get: function () { return table_definition_1.defineTable; } });
var sql_expressions_1 = require("./schema-definition/pg-schema/sql-expressions/index.cjs");
Object.defineProperty(exports, "sqlFunctions", { enumerable: true, get: function () { return sql_expressions_1.sqlFunctions; } });
Object.defineProperty(exports, "pgExtensions", { enumerable: true, get: function () { return sql_expressions_1.pgExtensions; } });
Object.defineProperty(exports, "getSql", { enumerable: true, get: function () { return sql_expressions_1.getSql; } });
Object.defineProperty(exports, "createWhereBuilder", { enumerable: true, get: function () { return sql_expressions_1.createWhereBuilder; } });
Object.defineProperty(exports, "createGeneratedExprBuilder", { enumerable: true, get: function () { return sql_expressions_1.createGeneratedExprBuilder; } });
var pg_relations_1 = require("./schema-definition/pg-schema/pg-relations/index.cjs");
Object.defineProperty(exports, "pgRelations", { enumerable: true, get: function () { return pg_relations_1.pgRelations; } });
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
var pg_view_1 = require("./schema-definition/pg-schema/pg-view.cjs");
Object.defineProperty(exports, "pgView", { enumerable: true, get: function () { return pg_view_1.pgView; } });
Object.defineProperty(exports, "viewToSQL", { enumerable: true, get: function () { return pg_view_1.viewToSQL; } });
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
Object.defineProperty(exports, "DIALECT_FEATURES", { enumerable: true, get: function () { return dialect_support_1.DIALECT_FEATURES; } });
var validate_schema_1 = require("./schema-definition/pg-schema/validate-schema/index.cjs");
Object.defineProperty(exports, "validateSchemaForDialect", { enumerable: true, get: function () { return validate_schema_1.validateSchemaForDialect; } });
Object.defineProperty(exports, "validateTableForDialect", { enumerable: true, get: function () { return validate_schema_1.validateTableForDialect; } });
Object.defineProperty(exports, "isColumnTypeSupported", { enumerable: true, get: function () { return validate_schema_1.isColumnTypeSupported; } });
Object.defineProperty(exports, "getSchemaUnsupportedFeatures", { enumerable: true, get: function () { return validate_schema_1.getSchemaUnsupportedFeatures; } });
Object.defineProperty(exports, "formatValidationReport", { enumerable: true, get: function () { return validate_schema_1.formatValidationReport; } });
var ddl_1 = require("./ddl/index.cjs");
Object.defineProperty(exports, "createFunction", { enumerable: true, get: function () { return ddl_1.createFunction; } });
var errors_1 = require("./schema-definition/pg-schema/dsql-schema/errors.cjs");
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
Object.defineProperty(exports, "DSQL_ALL_RULES", { enumerable: true, get: function () { return errors_1.DSQL_ALL_RULES; } });
Object.defineProperty(exports, "createDsqlValidationResult", { enumerable: true, get: function () { return errors_1.createDsqlValidationResult; } });
Object.defineProperty(exports, "lookupDsqlRule", { enumerable: true, get: function () { return errors_1.lookupDsqlRule; } });
Object.defineProperty(exports, "createDsqlMessage", { enumerable: true, get: function () { return errors_1.createDsqlMessage; } });
Object.defineProperty(exports, "formatDsqlMessage", { enumerable: true, get: function () { return errors_1.formatDsqlMessage; } });
Object.defineProperty(exports, "formatDsqlValidationResult", { enumerable: true, get: function () { return errors_1.formatDsqlValidationResult; } });
var limits_1 = require("./schema-definition/pg-schema/dsql-schema/limits.cjs");
Object.defineProperty(exports, "DSQL_DATABASE_LIMITS", { enumerable: true, get: function () { return limits_1.DSQL_DATABASE_LIMITS; } });
Object.defineProperty(exports, "DSQL_TABLE_LIMITS", { enumerable: true, get: function () { return limits_1.DSQL_TABLE_LIMITS; } });
Object.defineProperty(exports, "DSQL_TYPE_LIMITS", { enumerable: true, get: function () { return limits_1.DSQL_TYPE_LIMITS; } });
Object.defineProperty(exports, "DSQL_CONNECTION_LIMITS", { enumerable: true, get: function () { return limits_1.DSQL_CONNECTION_LIMITS; } });
Object.defineProperty(exports, "DSQL_TRANSACTION_LIMITS", { enumerable: true, get: function () { return limits_1.DSQL_TRANSACTION_LIMITS; } });
Object.defineProperty(exports, "DSQL_NON_INDEXABLE_TYPES", { enumerable: true, get: function () { return limits_1.DSQL_NON_INDEXABLE_TYPES; } });
Object.defineProperty(exports, "DSQL_SUPPORTED_INDEX_METHODS", { enumerable: true, get: function () { return limits_1.DSQL_SUPPORTED_INDEX_METHODS; } });
Object.defineProperty(exports, "DSQL_BLOCKED_INDEX_METHODS", { enumerable: true, get: function () { return limits_1.DSQL_BLOCKED_INDEX_METHODS; } });
var type_mappings_1 = require("./schema-definition/pg-schema/dsql-schema/type-mappings.cjs");
Object.defineProperty(exports, "DSQL_TYPE_MAP", { enumerable: true, get: function () { return type_mappings_1.DSQL_TYPE_MAP; } });
Object.defineProperty(exports, "getDsqlTypeMapping", { enumerable: true, get: function () { return type_mappings_1.getDsqlTypeMapping; } });
Object.defineProperty(exports, "isDsqlTypeSupported", { enumerable: true, get: function () { return type_mappings_1.isDsqlTypeSupported; } });
Object.defineProperty(exports, "getDsqlUnsupportedTypesByCategory", { enumerable: true, get: function () { return type_mappings_1.getDsqlUnsupportedTypesByCategory; } });
var type_validator_1 = require("./schema-definition/pg-schema/dsql-schema/type-validator.cjs");
Object.defineProperty(exports, "validateDsqlColumnType", { enumerable: true, get: function () { return type_validator_1.validateDsqlColumnType; } });
Object.defineProperty(exports, "validateDsqlColumnTypes", { enumerable: true, get: function () { return type_validator_1.validateDsqlColumnTypes; } });
Object.defineProperty(exports, "checkDsqlTypeSupport", { enumerable: true, get: function () { return type_validator_1.checkDsqlTypeSupport; } });
Object.defineProperty(exports, "getDsqlAlternative", { enumerable: true, get: function () { return type_validator_1.getDsqlAlternative; } });
Object.defineProperty(exports, "getDsqlBlockedTypes", { enumerable: true, get: function () { return type_validator_1.getDsqlBlockedTypes; } });
var constraint_validator_1 = require("./schema-definition/pg-schema/dsql-schema/constraint-validator.cjs");
Object.defineProperty(exports, "validateDsqlConstraint", { enumerable: true, get: function () { return constraint_validator_1.validateDsqlConstraint; } });
Object.defineProperty(exports, "validateDsqlConstraints", { enumerable: true, get: function () { return constraint_validator_1.validateDsqlConstraints; } });
Object.defineProperty(exports, "DSQL_CONSTRAINT_RULES", { enumerable: true, get: function () { return constraint_validator_1.DSQL_CONSTRAINT_RULES; } });
var index_validator_1 = require("./schema-definition/pg-schema/dsql-schema/index-validator.cjs");
Object.defineProperty(exports, "validateDsqlIndex", { enumerable: true, get: function () { return index_validator_1.validateDsqlIndex; } });
Object.defineProperty(exports, "validateDsqlIndexes", { enumerable: true, get: function () { return index_validator_1.validateDsqlIndexes; } });
Object.defineProperty(exports, "isDsqlIndexMethodSupported", { enumerable: true, get: function () { return index_validator_1.isDsqlIndexMethodSupported; } });
var table_validator_1 = require("./schema-definition/pg-schema/dsql-schema/table-validator.cjs");
Object.defineProperty(exports, "validateDsqlTable", { enumerable: true, get: function () { return table_validator_1.validateDsqlTable; } });
Object.defineProperty(exports, "validateDsqlTableCount", { enumerable: true, get: function () { return table_validator_1.validateDsqlTableCount; } });
Object.defineProperty(exports, "validateDsqlSchemaCount", { enumerable: true, get: function () { return table_validator_1.validateDsqlSchemaCount; } });
Object.defineProperty(exports, "DSQL_BLOCKED_TABLE_FEATURES", { enumerable: true, get: function () { return table_validator_1.DSQL_BLOCKED_TABLE_FEATURES; } });
var function_validator_1 = require("./schema-definition/pg-schema/dsql-schema/function-validator.cjs");
Object.defineProperty(exports, "validateDsqlFunction", { enumerable: true, get: function () { return function_validator_1.validateDsqlFunction; } });
Object.defineProperty(exports, "validateDsqlFunctions", { enumerable: true, get: function () { return function_validator_1.validateDsqlFunctions; } });
Object.defineProperty(exports, "isDsqlLanguageSupported", { enumerable: true, get: function () { return function_validator_1.isDsqlLanguageSupported; } });
Object.defineProperty(exports, "DSQL_BLOCKED_LANGUAGES", { enumerable: true, get: function () { return function_validator_1.DSQL_BLOCKED_LANGUAGES; } });
var trigger_validator_1 = require("./schema-definition/pg-schema/dsql-schema/trigger-validator.cjs");
Object.defineProperty(exports, "validateDsqlTrigger", { enumerable: true, get: function () { return trigger_validator_1.validateDsqlTrigger; } });
Object.defineProperty(exports, "validateDsqlTriggers", { enumerable: true, get: function () { return trigger_validator_1.validateDsqlTriggers; } });
var sequence_validator_1 = require("./schema-definition/pg-schema/dsql-schema/sequence-validator.cjs");
Object.defineProperty(exports, "validateDsqlSequence", { enumerable: true, get: function () { return sequence_validator_1.validateDsqlSequence; } });
Object.defineProperty(exports, "validateDsqlSequences", { enumerable: true, get: function () { return sequence_validator_1.validateDsqlSequences; } });
Object.defineProperty(exports, "validateDsqlSequenceExpression", { enumerable: true, get: function () { return sequence_validator_1.validateDsqlSequenceExpression; } });
Object.defineProperty(exports, "DSQL_BLOCKED_SEQUENCE_FUNCTIONS", { enumerable: true, get: function () { return sequence_validator_1.DSQL_BLOCKED_SEQUENCE_FUNCTIONS; } });
var view_validator_1 = require("./schema-definition/pg-schema/dsql-schema/view-validator.cjs");
Object.defineProperty(exports, "validateDsqlView", { enumerable: true, get: function () { return view_validator_1.validateDsqlView; } });
Object.defineProperty(exports, "validateDsqlViewCount", { enumerable: true, get: function () { return view_validator_1.validateDsqlViewCount; } });
Object.defineProperty(exports, "validateDsqlViews", { enumerable: true, get: function () { return view_validator_1.validateDsqlViews; } });
var misc_validator_1 = require("./schema-definition/pg-schema/dsql-schema/misc-validator.cjs");
Object.defineProperty(exports, "validateDsqlMiscSql", { enumerable: true, get: function () { return misc_validator_1.validateDsqlMiscSql; } });
Object.defineProperty(exports, "validateDsqlExtensions", { enumerable: true, get: function () { return misc_validator_1.validateDsqlExtensions; } });
Object.defineProperty(exports, "validateDsqlColumnModifier", { enumerable: true, get: function () { return misc_validator_1.validateDsqlColumnModifier; } });
Object.defineProperty(exports, "DSQL_BLOCKED_MISC_FEATURES", { enumerable: true, get: function () { return misc_validator_1.DSQL_BLOCKED_MISC_FEATURES; } });
const validate_schema_2 = require("./schema-definition/pg-schema/validate-schema/index.cjs");
function validateForDSQL(schema) {
    return (0, validate_schema_2.validateSchemaForDialect)(schema, { dialect: 'dsql' });
}
exports.DSQL_UNSUPPORTED_FEATURES = {
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
