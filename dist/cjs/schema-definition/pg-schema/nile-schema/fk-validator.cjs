"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateNileForeignKey = validateNileForeignKey;
exports.validateNileForeignKeys = validateNileForeignKeys;
const CASCADE_PATTERN = /^(CASCADE|SET\s+NULL)$/i;
function validateNileForeignKey(input) {
    const messages = [];
    if (input.sourceTableType === 'builtin' || input.targetTableType === 'builtin') {
        return messages;
    }
    if (input.sourceTableType === 'tenant' && input.targetTableType === 'shared') {
        messages.push({
            code: 'NILE-FK-001',
            severity: 'error',
            message: `Foreign key from tenant table "${input.sourceTable}" to shared table "${input.targetTable}" is not supported in Nile.`,
            alternative: 'Remove the FK and enforce referential integrity in application code, or make both tables the same type',
            category: 'foreign-key',
            tableName: input.sourceTable,
            constraintName: input.constraintName,
            docsUrl: 'https://www.thenile.dev/docs/postgres/postgres-compatibility',
        });
        return messages;
    }
    if (input.sourceTableType === 'shared' && input.targetTableType === 'tenant') {
        messages.push({
            code: 'NILE-FK-002',
            severity: 'error',
            message: `Foreign key from shared table "${input.sourceTable}" to tenant table "${input.targetTable}" is not supported in Nile.`,
            alternative: 'Remove the FK and enforce referential integrity in application code, or make both tables the same type',
            category: 'foreign-key',
            tableName: input.sourceTable,
            constraintName: input.constraintName,
            docsUrl: 'https://www.thenile.dev/docs/postgres/postgres-compatibility',
        });
        return messages;
    }
    if (input.sourceTableType === 'tenant' && input.targetTableType === 'tenant') {
        const sourceHasTenantId = input.sourceColumns.includes('tenant_id');
        const targetHasTenantId = input.targetColumns.includes('tenant_id');
        if (!sourceHasTenantId || !targetHasTenantId) {
            messages.push({
                code: 'NILE-FK-003',
                severity: 'error',
                message: `Foreign key between tenant tables "${input.sourceTable}" and "${input.targetTable}" must include tenant_id on both sides.`,
                alternative: `FOREIGN KEY (tenant_id, ...) REFERENCES ${input.targetTable}(tenant_id, ...)`,
                category: 'foreign-key',
                tableName: input.sourceTable,
                constraintName: input.constraintName,
                docsUrl: 'https://www.thenile.dev/docs/tenant-virtualization',
            });
        }
        const hasCascadeAction = (input.onDelete != null && CASCADE_PATTERN.test(input.onDelete)) ||
            (input.onUpdate != null && CASCADE_PATTERN.test(input.onUpdate));
        if (hasCascadeAction) {
            messages.push({
                code: 'NILE-FK-004',
                severity: 'warning',
                message: `FK cascade on "${input.sourceTable}" is tenant-scoped. Cascade will only affect rows belonging to the same tenant.`,
                alternative: 'No action required, but be aware that CASCADE only operates within tenant boundaries',
                category: 'foreign-key',
                tableName: input.sourceTable,
                constraintName: input.constraintName,
                docsUrl: 'https://www.thenile.dev/docs/tenant-virtualization',
            });
        }
    }
    return messages;
}
function validateNileForeignKeys(inputs) {
    const messages = [];
    for (const input of inputs) {
        messages.push(...validateNileForeignKey(input));
    }
    return messages;
}
