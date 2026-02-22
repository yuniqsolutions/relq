"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BLOCKED_CONSTRAINT_FEATURES = void 0;
exports.validateConstraint = validateConstraint;
exports.validateConstraints = validateConstraints;
exports.isConstraintTypeSupported = isConstraintTypeSupported;
const errors_1 = require("./errors.cjs");
function validateConstraint(constraint, tableName) {
    const messages = [];
    const location = { tableName };
    if (constraint.type === 'exclusion') {
        messages.push((0, errors_1.createMessage)('CRDB_E100', location));
    }
    if (constraint.deferrable) {
        messages.push((0, errors_1.createMessage)('CRDB_E101', location));
    }
    if (constraint.initiallyDeferred) {
        messages.push((0, errors_1.createMessage)('CRDB_E102', location));
    }
    if (constraint.matchType === 'partial') {
        messages.push((0, errors_1.createMessage)('CRDB_E103', location));
    }
    if (constraint.notEnforced) {
        messages.push((0, errors_1.createMessage)('CRDB_E104', location));
    }
    return messages;
}
function validateConstraints(constraints) {
    const messages = [];
    for (const { constraint, tableName } of constraints) {
        messages.push(...validateConstraint(constraint, tableName));
    }
    return messages;
}
function isConstraintTypeSupported(constraintType) {
    return constraintType !== 'exclusion';
}
exports.BLOCKED_CONSTRAINT_FEATURES = [
    'EXCLUSION constraints',
    'DEFERRABLE modifier',
    'INITIALLY DEFERRED modifier',
    'MATCH PARTIAL (FK)',
    'NOT ENFORCED (PG 17+)',
];
