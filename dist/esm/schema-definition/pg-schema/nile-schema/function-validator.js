export const NILE_BLOCKED_FUNCTION_KINDS = new Set([
    'function',
    'procedure',
    'trigger',
    'do_block',
]);
export const NILE_BLOCKED_LANGUAGES = new Set([
    'plpgsql',
    'plpython3u',
    'plperl',
    'pltcl',
    'c',
]);
export function validateNileFunction(input) {
    const messages = [];
    const alternative = 'Move logic to application code';
    if (input.kind === 'trigger') {
        messages.push({
            code: 'NILE-TF-001',
            severity: 'error',
            message: `Trigger "${input.name}" on table "${input.tableName}" cannot be created on Nile. Triggers are not supported.`,
            alternative,
            category: 'trigger-function',
            tableName: input.tableName,
            functionName: input.name,
        });
    }
    if (input.kind === 'function') {
        messages.push({
            code: 'NILE-TF-002',
            severity: 'error',
            message: `Function "${input.name}" cannot be created on Nile. User-defined functions are not supported.`,
            alternative,
            category: 'trigger-function',
            functionName: input.name,
        });
    }
    if (input.kind === 'procedure') {
        messages.push({
            code: 'NILE-TF-003',
            severity: 'error',
            message: `Procedure "${input.name}" cannot be created on Nile. Stored procedures are not supported.`,
            alternative,
            category: 'trigger-function',
            functionName: input.name,
        });
    }
    if (input.kind === 'do_block') {
        messages.push({
            code: 'NILE-TF-004',
            severity: 'error',
            message: 'Anonymous code block (DO $$) is not supported on Nile. Execute statements separately.',
            alternative,
            category: 'trigger-function',
            functionName: input.name,
        });
    }
    const normalizedLang = input.language?.toLowerCase().trim();
    if (normalizedLang === 'plpgsql' &&
        input.kind !== 'trigger' &&
        input.kind !== 'do_block') {
        messages.push({
            code: 'NILE-TF-005',
            severity: 'error',
            message: 'PL/pgSQL is not available on Nile.',
            alternative,
            category: 'trigger-function',
            functionName: input.name,
        });
    }
    return messages;
}
export function validateNileFunctions(inputs) {
    const messages = [];
    for (const input of inputs) {
        messages.push(...validateNileFunction(input));
    }
    return messages;
}
