import { createDsqlMessage } from "./errors.js";
import { DSQL_DATABASE_LIMITS, DSQL_TABLE_LIMITS } from "./limits.js";
export function validateDsqlTable(input) {
    const messages = [];
    const location = { tableName: input.name };
    if (input.temporary) {
        messages.push(createDsqlMessage('DSQL-TBL-001', location));
    }
    if (input.unlogged) {
        messages.push(createDsqlMessage('DSQL-TBL-002', location));
    }
    if (input.inherits) {
        messages.push(createDsqlMessage('DSQL-TBL-003', location));
    }
    if (input.tablespace) {
        messages.push(createDsqlMessage('DSQL-TBL-004', location));
    }
    if (input.partitionBy) {
        messages.push(createDsqlMessage('DSQL-TBL-005', location));
    }
    if (input.withStorageParams) {
        messages.push(createDsqlMessage('DSQL-TBL-006', location));
    }
    if (input.onCommit) {
        messages.push(createDsqlMessage('DSQL-TBL-007', location));
    }
    if (input.columnCount !== undefined && input.columnCount > DSQL_TABLE_LIMITS.MAX_COLUMNS) {
        messages.push(createDsqlMessage('DSQL-DB-004', location));
    }
    return messages;
}
export function validateDsqlTableCount(tableCount) {
    const messages = [];
    if (tableCount > DSQL_DATABASE_LIMITS.MAX_TABLES) {
        messages.push(createDsqlMessage('DSQL-DB-003'));
    }
    return messages;
}
export function validateDsqlSchemaCount(schemaCount) {
    const messages = [];
    if (schemaCount > DSQL_DATABASE_LIMITS.MAX_SCHEMAS) {
        messages.push(createDsqlMessage('DSQL-DB-002'));
    }
    return messages;
}
export const DSQL_BLOCKED_TABLE_FEATURES = [
    'TEMPORARY',
    'UNLOGGED',
    'INHERITS',
    'TABLESPACE',
    'PARTITION BY',
    'ON COMMIT',
];
