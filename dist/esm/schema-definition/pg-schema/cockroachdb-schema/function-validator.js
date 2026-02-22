import { createMessage } from "./errors.js";
const BLOCKED_CONSTRUCTS = [
    {
        code: 'CRDB_E600',
        pattern: /\b\w+\s*%TYPE\b/i,
        description: '%TYPE variable declaration',
    },
    {
        code: 'CRDB_E601',
        pattern: /\b\w+\s*%ROWTYPE\b/i,
        description: '%ROWTYPE variable declaration',
    },
    {
        code: 'CRDB_E602',
        pattern: /\$\d+/,
        description: 'Ordinal parameters ($1, $2, ...)',
    },
    {
        code: 'CRDB_E603',
        pattern: /\bPERFORM\b/i,
        description: 'PERFORM statement',
    },
    {
        code: 'CRDB_E604',
        pattern: /\bEXECUTE\b[^;]*\bINTO\b/i,
        description: 'EXECUTE ... INTO',
    },
    {
        code: 'CRDB_E605',
        pattern: /\bGET\s+DIAGNOSTICS\b/i,
        description: 'GET DIAGNOSTICS',
    },
    {
        code: 'CRDB_E606',
        pattern: /\bCASE\b[^;]*\bWHEN\b[^;]*\bTHEN\b/i,
        description: 'CASE statement (PL/pgSQL control flow)',
    },
    {
        code: 'CRDB_E607',
        pattern: /\bRETURN\s+QUERY\b/i,
        description: 'RETURN QUERY',
    },
    {
        code: 'CRDB_E608',
        pattern: /\bBEGIN\b[\s\S]*?\bBEGIN\b/i,
        description: 'Nested BEGIN/EXCEPTION blocks',
    },
    {
        code: 'CRDB_E609',
        pattern: /\bFOR\s+\w+\s+IN\s+(?:SELECT|EXECUTE)\b/i,
        description: 'FOR loop over query',
    },
];
export function validateFunction(fn) {
    const messages = [];
    const location = { functionName: fn.name };
    if (fn.language?.toLowerCase() === 'plpgsql') {
        messages.push(createMessage('CRDB_I600', location));
    }
    if (fn.body && fn.language?.toLowerCase() === 'plpgsql') {
        for (const construct of BLOCKED_CONSTRUCTS) {
            if (construct.pattern.test(fn.body)) {
                messages.push(createMessage(construct.code, location));
            }
        }
    }
    return messages;
}
export function validateFunctions(functions) {
    const messages = [];
    for (const fn of functions) {
        messages.push(...validateFunction(fn));
    }
    return messages;
}
export function scanFunctionBody(body, functionName) {
    const messages = [];
    const location = { functionName };
    for (const construct of BLOCKED_CONSTRUCTS) {
        if (construct.pattern.test(body)) {
            messages.push(createMessage(construct.code, location));
        }
    }
    return messages;
}
export const BLOCKED_PLPGSQL_CONSTRUCTS = [
    '%TYPE variable declaration',
    '%ROWTYPE variable declaration',
    'Ordinal parameters ($1, $2, ...)',
    'PERFORM statement',
    'EXECUTE ... INTO',
    'GET DIAGNOSTICS',
    'CASE statement (PL/pgSQL control flow)',
    'RETURN QUERY',
    'Nested BEGIN/EXCEPTION blocks',
    'FOR/FOREACH loops over queries',
];
