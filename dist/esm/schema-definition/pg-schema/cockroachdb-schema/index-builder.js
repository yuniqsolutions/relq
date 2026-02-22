import { createMessage } from "./errors.js";
export function validateIndex(index, tableName) {
    const messages = [];
    const location = { tableName, indexName: index.name };
    if (index.method?.toLowerCase() === 'spgist') {
        messages.push(createMessage('CRDB_E200', location));
    }
    if (index.method?.toLowerCase() === 'brin') {
        messages.push(createMessage('CRDB_E201', location));
    }
    if (index.operatorClass) {
        const opLower = index.operatorClass.toLowerCase();
        if (opLower === 'tsvector_ops') {
            messages.push(createMessage('CRDB_E202', location));
        }
        else if (opLower === 'range_ops') {
            messages.push(createMessage('CRDB_E203', location));
        }
    }
    if (index.concurrently) {
        messages.push(createMessage('CRDB_W040', location));
    }
    if (index.missingNullsSpec) {
        messages.push(createMessage('CRDB_W011', location));
    }
    if (index.hashSharded) {
        messages.push(...validateHashSharded(index.hashSharded, location));
    }
    return messages;
}
export function validateHashSharded(config, location) {
    const messages = [];
    if (config.bucketCount !== undefined) {
        if (config.bucketCount < 2) {
            messages.push(createMessage('CRDB_E720', location));
        }
        if (config.bucketCount > 256) {
            messages.push(createMessage('CRDB_W721', location));
        }
    }
    return messages;
}
export function transformIncludeToStoring(includeColumns) {
    if (includeColumns.length === 0)
        return '';
    return `STORING (${includeColumns.join(', ')})`;
}
export function generateHashShardedSQL(config) {
    if (config.bucketCount !== undefined) {
        return `USING HASH WITH (bucket_count = ${config.bucketCount})`;
    }
    return 'USING HASH';
}
export function isCrdbIndexMethodSupported(method) {
    const supported = new Set(['btree', 'hash', 'gin', 'gist', 'inverted']);
    return supported.has(method.toLowerCase());
}
export const BLOCKED_INDEX_METHODS = ['spgist', 'brin'];
export const SUPPORTED_INDEX_METHODS = ['btree', 'hash', 'gin', 'gist', 'inverted'];
