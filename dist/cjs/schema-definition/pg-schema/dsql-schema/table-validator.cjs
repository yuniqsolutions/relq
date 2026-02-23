"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DSQL_BLOCKED_TABLE_FEATURES = void 0;
exports.validateDsqlTable = validateDsqlTable;
exports.validateDsqlTableCount = validateDsqlTableCount;
exports.validateDsqlSchemaCount = validateDsqlSchemaCount;
const errors_1 = require("./errors.cjs");
const limits_1 = require("./limits.cjs");
function validateDsqlTable(input) {
    const messages = [];
    const location = { tableName: input.name };
    if (input.temporary) {
        messages.push((0, errors_1.createDsqlMessage)('DSQL-TBL-001', location));
    }
    if (input.unlogged) {
        messages.push((0, errors_1.createDsqlMessage)('DSQL-TBL-002', location));
    }
    if (input.inherits) {
        messages.push((0, errors_1.createDsqlMessage)('DSQL-TBL-003', location));
    }
    if (input.tablespace) {
        messages.push((0, errors_1.createDsqlMessage)('DSQL-TBL-004', location));
    }
    if (input.partitionBy) {
        messages.push((0, errors_1.createDsqlMessage)('DSQL-TBL-005', location));
    }
    if (input.withStorageParams) {
        messages.push((0, errors_1.createDsqlMessage)('DSQL-TBL-006', location));
    }
    if (input.onCommit) {
        messages.push((0, errors_1.createDsqlMessage)('DSQL-TBL-007', location));
    }
    if (input.columnCount !== undefined && input.columnCount > limits_1.DSQL_TABLE_LIMITS.MAX_COLUMNS) {
        messages.push((0, errors_1.createDsqlMessage)('DSQL-DB-004', location));
    }
    return messages;
}
function validateDsqlTableCount(tableCount) {
    const messages = [];
    if (tableCount > limits_1.DSQL_DATABASE_LIMITS.MAX_TABLES) {
        messages.push((0, errors_1.createDsqlMessage)('DSQL-DB-003'));
    }
    return messages;
}
function validateDsqlSchemaCount(schemaCount) {
    const messages = [];
    if (schemaCount > limits_1.DSQL_DATABASE_LIMITS.MAX_SCHEMAS) {
        messages.push((0, errors_1.createDsqlMessage)('DSQL-DB-002'));
    }
    return messages;
}
exports.DSQL_BLOCKED_TABLE_FEATURES = [
    'TEMPORARY',
    'UNLOGGED',
    'INHERITS',
    'TABLESPACE',
    'PARTITION BY',
    'ON COMMIT',
];
