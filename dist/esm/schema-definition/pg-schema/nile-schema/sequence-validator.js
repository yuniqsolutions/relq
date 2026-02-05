export function validateNileSequence(input) {
    const messages = [];
    if (input.tableType === 'tenant') {
        messages.push({
            code: 'NILE-SEQ-001',
            severity: 'error',
            message: `Sequence "${input.sequenceName}" is associated with tenant table "${input.ownedByTable}". Sequences are only available for shared tables in Nile.`,
            alternative: 'Use UUID with gen_random_uuid() for tenant table primary keys',
            category: 'sequence',
            tableName: input.ownedByTable,
            columnName: input.ownedByColumn,
        });
    }
    if (!input.tableType || !input.ownedByTable) {
        messages.push({
            code: 'NILE-SEQ-002',
            severity: 'warning',
            message: `Standalone sequence "${input.sequenceName}" can only be used by shared tables.`,
            alternative: 'Ensure this sequence is only referenced by shared (non-tenant) tables',
            category: 'sequence',
        });
    }
    if (input.tableType === 'shared') {
        messages.push({
            code: 'NILE-SEQ-003',
            severity: 'info',
            message: `Sequence "${input.sequenceName}" on shared table "${input.ownedByTable}" is supported.`,
            alternative: 'No action required. Sequences work on shared tables.',
            category: 'sequence',
            tableName: input.ownedByTable,
            columnName: input.ownedByColumn,
        });
    }
    if (input.ownedByTable && input.tableType === 'tenant') {
        messages.push({
            code: 'NILE-SEQ-004',
            severity: 'error',
            message: `Sequence "${input.sequenceName}" cannot be owned by tenant table column "${input.ownedByTable}.${input.ownedByColumn}".`,
            alternative: 'Remove OWNED BY or change ownership to a shared table column',
            category: 'sequence',
            tableName: input.ownedByTable,
            columnName: input.ownedByColumn,
        });
    }
    return messages;
}
export function validateNileSequences(inputs) {
    const messages = [];
    for (const input of inputs) {
        messages.push(...validateNileSequence(input));
    }
    return messages;
}
export function validateNileSequenceExpression(expression, tableType) {
    const messages = [];
    if (tableType !== 'tenant') {
        return messages;
    }
    const sequenceFunctionPattern = /\b(nextval|currval|setval)\s*\(/i;
    if (sequenceFunctionPattern.test(expression)) {
        messages.push({
            code: 'NILE-CT-003',
            severity: 'error',
            message: `DEFAULT expression "${expression}" uses a sequence function which is not available on tenant-aware tables in Nile.`,
            alternative: 'Use gen_random_uuid() or a static default instead of sequence functions for tenant tables',
            category: 'column-type',
        });
    }
    return messages;
}
