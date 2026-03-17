"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DSQL_BLOCKED_LANGUAGES = void 0;
exports.validateDsqlFunction = validateDsqlFunction;
exports.validateDsqlFunctions = validateDsqlFunctions;
exports.isDsqlLanguageSupported = isDsqlLanguageSupported;
const errors_1 = require("./errors.cjs");
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
function validateDsqlFunction(input) {
    const messages = [];
    const location = { functionName: input.name };
    if (input.isDoBlock) {
        messages.push((0, errors_1.createDsqlMessage)('DSQL-FN-007', location));
        return messages;
    }
    if (input.language) {
        const lang = input.language.toLowerCase().trim();
        const errorCode = BLOCKED_LANGUAGES[lang];
        if (errorCode) {
            messages.push((0, errors_1.createDsqlMessage)(errorCode, location));
        }
    }
    if (input.isProcedure && input.language) {
        const lang = input.language.toLowerCase().trim();
        if (lang !== 'sql') {
            messages.push((0, errors_1.createDsqlMessage)('DSQL-FN-006', location));
        }
    }
    if (input.returnsTrigger) {
        messages.push((0, errors_1.createDsqlMessage)('DSQL-TRIG-003', location));
    }
    return messages;
}
function validateDsqlFunctions(functions) {
    const messages = [];
    for (const fn of functions) {
        messages.push(...validateDsqlFunction(fn));
    }
    return messages;
}
function isDsqlLanguageSupported(language) {
    return language.toLowerCase().trim() === 'sql';
}
exports.DSQL_BLOCKED_LANGUAGES = [
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
