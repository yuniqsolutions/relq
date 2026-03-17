import { createDsqlMessage } from "./errors.js";
const BLOCKED_LANGUAGES = {
    plpgsql: 'DSQL-FN-001',
    plpython3u: 'DSQL-FN-002',
    plpythonu: 'DSQL-FN-002',
    plpython2u: 'DSQL-FN-002',
    plperl: 'DSQL-FN-003',
    plperlu: 'DSQL-FN-003',
    pltcl: 'DSQL-FN-004',
    pltclu: 'DSQL-FN-004',
    c: 'DSQL-FN-005',
};
export function validateDsqlFunction(input) {
    const messages = [];
    const location = { functionName: input.name };
    if (input.isDoBlock) {
        messages.push(createDsqlMessage('DSQL-FN-007', location));
        return messages;
    }
    if (input.language) {
        const lang = input.language.toLowerCase().trim();
        const errorCode = BLOCKED_LANGUAGES[lang];
        if (errorCode) {
            messages.push(createDsqlMessage(errorCode, location));
        }
    }
    if (input.isProcedure && input.language) {
        const lang = input.language.toLowerCase().trim();
        if (lang !== 'sql') {
            messages.push(createDsqlMessage('DSQL-FN-006', location));
        }
    }
    if (input.returnsTrigger) {
        messages.push(createDsqlMessage('DSQL-TRIG-003', location));
    }
    return messages;
}
export function validateDsqlFunctions(functions) {
    const messages = [];
    for (const fn of functions) {
        messages.push(...validateDsqlFunction(fn));
    }
    return messages;
}
export function isDsqlLanguageSupported(language) {
    return language.toLowerCase().trim() === 'sql';
}
export const DSQL_BLOCKED_LANGUAGES = [
    'plpgsql',
    'plpython3u',
    'plpythonu',
    'plpython2u',
    'plperl',
    'plperlu',
    'pltcl',
    'pltclu',
    'c',
];
