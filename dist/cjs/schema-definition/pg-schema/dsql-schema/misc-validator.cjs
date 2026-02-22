"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DSQL_BLOCKED_MISC_FEATURES = void 0;
exports.validateDsqlMiscSql = validateDsqlMiscSql;
exports.validateDsqlExtensions = validateDsqlExtensions;
exports.validateDsqlColumnModifier = validateDsqlColumnModifier;
const errors_1 = require("./errors.cjs");
const MISC_PATTERNS = [
    { pattern: /\bLISTEN\b/i, code: 'DSQL-MISC-001' },
    { pattern: /\bNOTIFY\b/i, code: 'DSQL-MISC-002' },
    { pattern: /\bpg_notify\s*\(/i, code: 'DSQL-MISC-002' },
    { pattern: /\bpg_advisory_lock/i, code: 'DSQL-MISC-003' },
    { pattern: /\bpg_advisory_xact_lock/i, code: 'DSQL-MISC-003' },
    { pattern: /\bpg_try_advisory_lock/i, code: 'DSQL-MISC-003' },
    { pattern: /\bTRUNCATE\b/i, code: 'DSQL-MISC-004' },
    { pattern: /\bCREATE\s+(OR\s+REPLACE\s+)?RULE\b/i, code: 'DSQL-MISC-005' },
    { pattern: /\bVACUUM\b/i, code: 'DSQL-MISC-006' },
    { pattern: /\bANALYZE\b/i, code: 'DSQL-MISC-006' },
    { pattern: /\bREINDEX\b/i, code: 'DSQL-MISC-006' },
];
const EXTENSION_PATTERNS = [
    { pattern: /\bCREATE\s+EXTENSION\b/i, code: 'DSQL-EXT-001' },
    { pattern: /\b(?:geometry|geography)\s*\(/i, code: 'DSQL-EXT-002' },
    { pattern: /\bST_\w+\s*\(/i, code: 'DSQL-EXT-002' },
    { pattern: /\bvector\s*\(\s*\d+\s*\)/i, code: 'DSQL-EXT-003' },
    { pattern: /\bhalfvec\s*\(/i, code: 'DSQL-EXT-003' },
    { pattern: /\bsimilarity\s*\(/i, code: 'DSQL-EXT-004' },
    { pattern: /\bword_similarity\s*\(/i, code: 'DSQL-EXT-004' },
    { pattern: /\bshow_trgm\s*\(/i, code: 'DSQL-EXT-004' },
];
function validateDsqlMiscSql(sql, tableName) {
    const messages = [];
    const location = { tableName };
    const seen = new Set();
    for (const { pattern, code } of MISC_PATTERNS) {
        if (pattern.test(sql) && !seen.has(code)) {
            seen.add(code);
            messages.push((0, errors_1.createDsqlMessage)(code, location));
        }
    }
    for (const { pattern, code } of EXTENSION_PATTERNS) {
        if (pattern.test(sql) && !seen.has(code)) {
            seen.add(code);
            messages.push((0, errors_1.createDsqlMessage)(code, location));
        }
    }
    return messages;
}
function validateDsqlExtensions(extensionNames) {
    const messages = [];
    for (const ext of extensionNames) {
        const msg = (0, errors_1.createDsqlMessage)('DSQL-EXT-001');
        msg.message = `Extension "${ext}" is not supported in DSQL. No extensions are available.`;
        messages.push(msg);
    }
    return messages;
}
function validateDsqlColumnModifier(input) {
    const messages = [];
    const location = { tableName: input.tableName, columnName: input.columnName };
    if (input.generatedAsIdentity) {
        messages.push((0, errors_1.createDsqlMessage)('DSQL-MOD-001', location));
    }
    if (input.defaultNextval) {
        messages.push((0, errors_1.createDsqlMessage)('DSQL-MOD-002', location));
    }
    if (input.collation && input.collation !== 'C' && input.collation !== '"C"') {
        messages.push((0, errors_1.createDsqlMessage)('DSQL-MOD-003', location));
    }
    return messages;
}
exports.DSQL_BLOCKED_MISC_FEATURES = [
    'LISTEN',
    'NOTIFY',
    'pg_advisory_lock',
    'TRUNCATE',
    'CREATE RULE',
    'VACUUM',
    'ANALYZE',
    'REINDEX',
    'CREATE EXTENSION',
];
