"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DSQL_BLOCKED_SEQUENCE_FUNCTIONS = void 0;
exports.validateDsqlSequence = validateDsqlSequence;
exports.validateDsqlSequences = validateDsqlSequences;
exports.validateDsqlSequenceExpression = validateDsqlSequenceExpression;
const errors_1 = require("./errors.cjs");
function validateDsqlSequence(input) {
    return [(0, errors_1.createDsqlMessage)('DSQL-SEQ-001', { functionName: input.name })];
}
function validateDsqlSequences(sequences) {
    const messages = [];
    for (const seq of sequences) {
        messages.push(...validateDsqlSequence(seq));
    }
    return messages;
}
function validateDsqlSequenceExpression(expression, tableName, columnName) {
    const messages = [];
    const location = { tableName, columnName };
    const lower = expression.toLowerCase();
    if (/\bnextval\s*\(/.test(lower)) {
        messages.push((0, errors_1.createDsqlMessage)('DSQL-SEQ-002', location));
    }
    if (/\bcurrval\s*\(/.test(lower)) {
        messages.push((0, errors_1.createDsqlMessage)('DSQL-SEQ-003', location));
    }
    if (/\bsetval\s*\(/.test(lower)) {
        messages.push((0, errors_1.createDsqlMessage)('DSQL-SEQ-004', location));
    }
    if (/\blastval\s*\(/.test(lower)) {
        messages.push((0, errors_1.createDsqlMessage)('DSQL-SEQ-005', location));
    }
    return messages;
}
exports.DSQL_BLOCKED_SEQUENCE_FUNCTIONS = [
    'nextval',
    'currval',
    'setval',
    'lastval',
];
