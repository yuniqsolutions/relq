import { createDsqlMessage } from "./errors.js";
export function validateDsqlSequence(input) {
    return [createDsqlMessage('DSQL-SEQ-001', { functionName: input.name })];
}
export function validateDsqlSequences(sequences) {
    const messages = [];
    for (const seq of sequences) {
        messages.push(...validateDsqlSequence(seq));
    }
    return messages;
}
export function validateDsqlSequenceExpression(expression, tableName, columnName) {
    const messages = [];
    const location = { tableName, columnName };
    const lower = expression.toLowerCase();
    if (/\bnextval\s*\(/.test(lower)) {
        messages.push(createDsqlMessage('DSQL-SEQ-002', location));
    }
    if (/\bcurrval\s*\(/.test(lower)) {
        messages.push(createDsqlMessage('DSQL-SEQ-003', location));
    }
    if (/\bsetval\s*\(/.test(lower)) {
        messages.push(createDsqlMessage('DSQL-SEQ-004', location));
    }
    if (/\blastval\s*\(/.test(lower)) {
        messages.push(createDsqlMessage('DSQL-SEQ-005', location));
    }
    return messages;
}
export const DSQL_BLOCKED_SEQUENCE_FUNCTIONS = [
    'nextval',
    'currval',
    'setval',
    'lastval',
];
