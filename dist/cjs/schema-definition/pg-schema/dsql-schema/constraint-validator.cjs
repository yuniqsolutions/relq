"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DSQL_CONSTRAINT_RULES = void 0;
exports.validateDsqlConstraint = validateDsqlConstraint;
exports.validateDsqlConstraints = validateDsqlConstraints;
const errors_1 = require("./errors.cjs");
function validateDsqlConstraint(input, tableName) {
    const messages = [];
    const location = { tableName };
    const upperType = input.type.toUpperCase().trim();
    if (upperType === 'EXCLUSION' || upperType === 'EXCLUDE') {
        messages.push((0, errors_1.createDsqlMessage)('DSQL-CONS-005', location));
    }
    if (input.deferrable || input.initiallyDeferred) {
        messages.push((0, errors_1.createDsqlMessage)('DSQL-CONS-006', location));
    }
    if (upperType === 'FOREIGN KEY' || upperType === 'FOREIGN_KEY') {
        messages.push((0, errors_1.createDsqlMessage)('DSQL-CONS-001', location));
    }
    if (input.isInlineReference) {
        messages.push((0, errors_1.createDsqlMessage)('DSQL-CONS-002', location));
    }
    if (input.onDelete && input.onDelete.toUpperCase() !== 'NO ACTION') {
        messages.push((0, errors_1.createDsqlMessage)('DSQL-CONS-003', location));
    }
    if (input.onUpdate && input.onUpdate.toUpperCase() !== 'NO ACTION') {
        messages.push((0, errors_1.createDsqlMessage)('DSQL-CONS-004', location));
    }
    if (input.matchType && input.matchType.toUpperCase() !== 'SIMPLE') {
        messages.push((0, errors_1.createDsqlMessage)('DSQL-CONS-007', location));
    }
    return messages;
}
function validateDsqlConstraints(constraints, tableName) {
    const messages = [];
    for (const c of constraints) {
        messages.push(...validateDsqlConstraint(c, tableName));
    }
    return messages;
}
exports.DSQL_CONSTRAINT_RULES = {
    BLOCKED: ['EXCLUSION', 'DEFERRABLE', 'INITIALLY DEFERRED'],
    WARNINGS: ['FOREIGN KEY', 'REFERENCES', 'ON DELETE CASCADE', 'ON UPDATE CASCADE', 'MATCH FULL', 'MATCH PARTIAL'],
};
