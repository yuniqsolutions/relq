import { createMessage } from "./errors.js";
export function validateConstraint(constraint, tableName) {
    const messages = [];
    const location = { tableName };
    if (constraint.type === 'exclusion') {
        messages.push(createMessage('CRDB_E100', location));
    }
    if (constraint.deferrable) {
        messages.push(createMessage('CRDB_E101', location));
    }
    if (constraint.initiallyDeferred) {
        messages.push(createMessage('CRDB_E102', location));
    }
    if (constraint.matchType === 'partial') {
        messages.push(createMessage('CRDB_E103', location));
    }
    if (constraint.notEnforced) {
        messages.push(createMessage('CRDB_E104', location));
    }
    return messages;
}
export function validateConstraints(constraints) {
    const messages = [];
    for (const { constraint, tableName } of constraints) {
        messages.push(...validateConstraint(constraint, tableName));
    }
    return messages;
}
export function isConstraintTypeSupported(constraintType) {
    return constraintType !== 'exclusion';
}
export const BLOCKED_CONSTRAINT_FEATURES = [
    'EXCLUSION constraints',
    'DEFERRABLE modifier',
    'INITIALLY DEFERRED modifier',
    'MATCH PARTIAL (FK)',
    'NOT ENFORCED (PG 17+)',
];
