"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateNileConstraint = validateNileConstraint;
exports.validateNileConstraints = validateNileConstraints;
exports.isNileConstraintTenantScoped = isNileConstraintTenantScoped;
const errors_1 = require("./errors.cjs");
function validateNileConstraint(input) {
    const messages = [];
    const location = {
        tableName: input.tableName,
        constraintName: input.constraintName,
    };
    if (input.tableType === 'builtin') {
        return messages;
    }
    if (input.tableType === 'shared') {
        messages.push({
            ...(0, errors_1.createNileMessage)('NILE-CON-004', location),
            message: `${input.constraintType.toUpperCase()} constraint on shared table "${input.tableName}" has no tenant-scoping requirements.`,
        });
        return messages;
    }
    const hasTenantId = input.columns.includes('tenant_id');
    if (input.constraintType === 'unique') {
        if (!hasTenantId) {
            const colList = input.columns.join(', ');
            messages.push({
                ...(0, errors_1.createNileMessage)('NILE-CON-001', location),
                message: `UNIQUE constraint${input.constraintName ? ` "${input.constraintName}"` : ''} on tenant table "${input.tableName}" (${colList}) does not include tenant_id. Uniqueness will be enforced across all tenants.`,
                alternative: `UNIQUE(tenant_id, ${colList})`,
            });
            return messages;
        }
        if (input.columns[0] !== 'tenant_id') {
            messages.push({
                ...(0, errors_1.createNileMessage)('NILE-CON-002', location),
                message: `UNIQUE constraint${input.constraintName ? ` "${input.constraintName}"` : ''} on tenant table "${input.tableName}" has tenant_id but not as the first column. Reorder for optimal index performance.`,
            });
        }
    }
    if (input.constraintType === 'exclusion') {
        if (!hasTenantId) {
            messages.push({
                ...(0, errors_1.createNileMessage)('NILE-CON-003', location),
                message: `EXCLUSION constraint${input.constraintName ? ` "${input.constraintName}"` : ''} on tenant table "${input.tableName}" does not include tenant_id. Exclusion will span across tenants.`,
                alternative: 'Add tenant_id WITH = to the EXCLUSION constraint',
            });
        }
    }
    return messages;
}
function validateNileConstraints(inputs) {
    const messages = [];
    for (const input of inputs) {
        messages.push(...validateNileConstraint(input));
    }
    return messages;
}
function isNileConstraintTenantScoped(constraintType, tableType) {
    return tableType === 'tenant' && (constraintType === 'unique' || constraintType === 'exclusion');
}
