"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateNilePrimaryKey = validateNilePrimaryKey;
exports.validateNilePrimaryKeys = validateNilePrimaryKeys;
const errors_1 = require("./errors.cjs");
function validateNilePrimaryKey(input) {
    if (input.tableType !== 'tenant') {
        return [];
    }
    const messages = [];
    const { tableName, pkColumns } = input;
    if (pkColumns.length === 0) {
        messages.push((0, errors_1.createNileMessage)('NILE-PK-004', { tableName }));
        return messages;
    }
    if (pkColumns.length === 1 && pkColumns[0] !== 'tenant_id') {
        messages.push((0, errors_1.createNileMessage)('NILE-PK-003', { tableName }));
        return messages;
    }
    if (!pkColumns.includes('tenant_id')) {
        messages.push((0, errors_1.createNileMessage)('NILE-PK-001', { tableName }));
        return messages;
    }
    if (pkColumns[0] !== 'tenant_id') {
        messages.push((0, errors_1.createNileMessage)('NILE-PK-002', { tableName }));
    }
    return messages;
}
function validateNilePrimaryKeys(inputs) {
    const messages = [];
    for (const input of inputs) {
        messages.push(...validateNilePrimaryKey(input));
    }
    return messages;
}
