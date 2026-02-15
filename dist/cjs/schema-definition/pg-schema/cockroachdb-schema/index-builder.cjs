"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUPPORTED_INDEX_METHODS = exports.BLOCKED_INDEX_METHODS = void 0;
exports.validateIndex = validateIndex;
exports.validateHashSharded = validateHashSharded;
exports.transformIncludeToStoring = transformIncludeToStoring;
exports.generateHashShardedSQL = generateHashShardedSQL;
exports.isCrdbIndexMethodSupported = isCrdbIndexMethodSupported;
const errors_1 = require("./errors.cjs");
function validateIndex(index, tableName) {
    const messages = [];
    const location = { tableName, indexName: index.name };
    if (index.method?.toLowerCase() === 'spgist') {
        messages.push((0, errors_1.createMessage)('CRDB_E200', location));
    }
    if (index.method?.toLowerCase() === 'brin') {
        messages.push((0, errors_1.createMessage)('CRDB_E201', location));
    }
    if (index.operatorClass) {
        const opLower = index.operatorClass.toLowerCase();
        if (opLower === 'tsvector_ops') {
            messages.push((0, errors_1.createMessage)('CRDB_E202', location));
        }
        else if (opLower === 'range_ops') {
            messages.push((0, errors_1.createMessage)('CRDB_E203', location));
        }
    }
    if (index.concurrently) {
        messages.push((0, errors_1.createMessage)('CRDB_W040', location));
    }
    if (index.missingNullsSpec) {
        messages.push((0, errors_1.createMessage)('CRDB_W011', location));
    }
    if (index.hashSharded) {
        messages.push(...validateHashSharded(index.hashSharded, location));
    }
    return messages;
}
function validateHashSharded(config, location) {
    const messages = [];
    if (config.bucketCount !== undefined) {
        if (config.bucketCount < 2) {
            messages.push((0, errors_1.createMessage)('CRDB_E720', location));
        }
        if (config.bucketCount > 256) {
            messages.push((0, errors_1.createMessage)('CRDB_W721', location));
        }
    }
    return messages;
}
function transformIncludeToStoring(includeColumns) {
    if (includeColumns.length === 0)
        return '';
    return `STORING (${includeColumns.join(', ')})`;
}
function generateHashShardedSQL(config) {
    if (config.bucketCount !== undefined) {
        return `USING HASH WITH (bucket_count = ${config.bucketCount})`;
    }
    return 'USING HASH';
}
function isCrdbIndexMethodSupported(method) {
    const supported = new Set(['btree', 'hash', 'gin', 'gist', 'inverted']);
    return supported.has(method.toLowerCase());
}
exports.BLOCKED_INDEX_METHODS = ['spgist', 'brin'];
exports.SUPPORTED_INDEX_METHODS = ['btree', 'hash', 'gin', 'gist', 'inverted'];
