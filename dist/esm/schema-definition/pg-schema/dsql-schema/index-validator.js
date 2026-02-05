import { createDsqlMessage } from "./errors.js";
import { DSQL_TABLE_LIMITS, DSQL_NON_INDEXABLE_TYPES, DSQL_BLOCKED_INDEX_METHODS } from "./limits.js";
export function validateDsqlIndex(input, tableName, tableIndexCount) {
    const messages = [];
    const location = { tableName, indexName: input.name };
    if (input.method) {
        const method = input.method.toLowerCase().trim();
        if (DSQL_BLOCKED_INDEX_METHODS.has(method)) {
            const codeMap = {
                gin: 'DSQL-IDX-001',
                gist: 'DSQL-IDX-002',
                spgist: 'DSQL-IDX-003',
                brin: 'DSQL-IDX-004',
                hash: 'DSQL-IDX-005',
            };
            const code = codeMap[method] ?? 'DSQL-IDX-001';
            messages.push(createDsqlMessage(code, location));
        }
    }
    if (input.concurrently) {
        messages.push(createDsqlMessage('DSQL-IDX-006', location));
    }
    if (input.operatorClass) {
        messages.push(createDsqlMessage('DSQL-IDX-007', location));
    }
    if (tableIndexCount !== undefined && tableIndexCount > DSQL_TABLE_LIMITS.MAX_INDEXES) {
        messages.push(createDsqlMessage('DSQL-IDX-LIMIT-001', location));
    }
    if (input.columns && input.columns.length > DSQL_TABLE_LIMITS.MAX_INDEX_COLUMNS) {
        messages.push(createDsqlMessage('DSQL-IDX-LIMIT-002', location));
    }
    if (input.columnTypes) {
        for (const colType of input.columnTypes) {
            const normalized = colType.toLowerCase().trim();
            if (DSQL_NON_INDEXABLE_TYPES.has(normalized)) {
                const codeMap = {
                    bytea: 'DSQL-IDX-LIMIT-003',
                    interval: 'DSQL-IDX-LIMIT-004',
                    timetz: 'DSQL-IDX-LIMIT-005',
                };
                const code = codeMap[normalized];
                if (code) {
                    messages.push(createDsqlMessage(code, location));
                }
            }
            if (normalized === 'time with time zone') {
                messages.push(createDsqlMessage('DSQL-IDX-LIMIT-005', location));
            }
        }
    }
    return messages;
}
export function validateDsqlIndexes(indexes, tableName) {
    const messages = [];
    if (indexes.length > DSQL_TABLE_LIMITS.MAX_INDEXES) {
        messages.push(createDsqlMessage('DSQL-IDX-LIMIT-001', { tableName }));
    }
    for (const idx of indexes) {
        messages.push(...validateDsqlIndex(idx, tableName));
    }
    return messages;
}
export function isDsqlIndexMethodSupported(method) {
    return method.toLowerCase().trim() === 'btree';
}
