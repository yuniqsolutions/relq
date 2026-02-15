"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateDsqlIndex = validateDsqlIndex;
exports.validateDsqlIndexes = validateDsqlIndexes;
exports.isDsqlIndexMethodSupported = isDsqlIndexMethodSupported;
const errors_1 = require("./errors.cjs");
const limits_1 = require("./limits.cjs");
function validateDsqlIndex(input, tableName, tableIndexCount) {
    const messages = [];
    const location = { tableName, indexName: input.name };
    if (input.method) {
        const method = input.method.toLowerCase().trim();
        if (limits_1.DSQL_BLOCKED_INDEX_METHODS.has(method)) {
            const codeMap = {
                gin: 'DSQL-IDX-001',
                gist: 'DSQL-IDX-002',
                spgist: 'DSQL-IDX-003',
                brin: 'DSQL-IDX-004',
                hash: 'DSQL-IDX-005',
            };
            const code = codeMap[method] ?? 'DSQL-IDX-001';
            messages.push((0, errors_1.createDsqlMessage)(code, location));
        }
    }
    if (input.concurrently) {
        messages.push((0, errors_1.createDsqlMessage)('DSQL-IDX-006', location));
    }
    if (input.operatorClass) {
        messages.push((0, errors_1.createDsqlMessage)('DSQL-IDX-007', location));
    }
    if (tableIndexCount !== undefined && tableIndexCount > limits_1.DSQL_TABLE_LIMITS.MAX_INDEXES) {
        messages.push((0, errors_1.createDsqlMessage)('DSQL-IDX-LIMIT-001', location));
    }
    if (input.columns && input.columns.length > limits_1.DSQL_TABLE_LIMITS.MAX_INDEX_COLUMNS) {
        messages.push((0, errors_1.createDsqlMessage)('DSQL-IDX-LIMIT-002', location));
    }
    if (input.columnTypes) {
        for (const colType of input.columnTypes) {
            const normalized = colType.toLowerCase().trim();
            if (limits_1.DSQL_NON_INDEXABLE_TYPES.has(normalized)) {
                const codeMap = {
                    bytea: 'DSQL-IDX-LIMIT-003',
                    interval: 'DSQL-IDX-LIMIT-004',
                    timetz: 'DSQL-IDX-LIMIT-005',
                };
                const code = codeMap[normalized];
                if (code) {
                    messages.push((0, errors_1.createDsqlMessage)(code, location));
                }
            }
            if (normalized === 'time with time zone') {
                messages.push((0, errors_1.createDsqlMessage)('DSQL-IDX-LIMIT-005', location));
            }
        }
    }
    return messages;
}
function validateDsqlIndexes(indexes, tableName) {
    const messages = [];
    if (indexes.length > limits_1.DSQL_TABLE_LIMITS.MAX_INDEXES) {
        messages.push((0, errors_1.createDsqlMessage)('DSQL-IDX-LIMIT-001', { tableName }));
    }
    for (const idx of indexes) {
        messages.push(...validateDsqlIndex(idx, tableName));
    }
    return messages;
}
function isDsqlIndexMethodSupported(method) {
    return method.toLowerCase().trim() === 'btree';
}
