import { createNileMessage } from "./errors.js";
export function validateNilePrimaryKey(input) {
    if (input.tableType !== 'tenant') {
        return [];
    }
    const messages = [];
    const { tableName, pkColumns } = input;
    if (pkColumns.length === 0) {
        messages.push(createNileMessage('NILE-PK-004', { tableName }));
        return messages;
    }
    if (pkColumns.length === 1 && pkColumns[0] !== 'tenant_id') {
        messages.push(createNileMessage('NILE-PK-003', { tableName }));
        return messages;
    }
    if (!pkColumns.includes('tenant_id')) {
        messages.push(createNileMessage('NILE-PK-001', { tableName }));
        return messages;
    }
    if (pkColumns[0] !== 'tenant_id') {
        messages.push(createNileMessage('NILE-PK-002', { tableName }));
    }
    return messages;
}
export function validateNilePrimaryKeys(inputs) {
    const messages = [];
    for (const input of inputs) {
        messages.push(...validateNilePrimaryKey(input));
    }
    return messages;
}
