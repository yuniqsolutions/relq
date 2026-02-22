"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformSqlForNile = transformSqlForNile;
exports.transformSqlStatementsForNile = transformSqlStatementsForNile;
exports.needsNileTransformation = needsNileTransformation;
exports.formatNileTransformChanges = formatNileTransformChanges;
const TRANSFORM_RULES = [
    {
        ruleCode: 'NILE-TF-001',
        pattern: /CREATE\s+(OR\s+REPLACE\s+)?(CONSTRAINT\s+)?TRIGGER\s+\w+[\s\S]*?(?:;|$)/gi,
        replace: '/* Nile: TRIGGER removed — not supported */',
        description: 'Strip CREATE TRIGGER statement',
    },
    {
        ruleCode: 'NILE-TF-001',
        pattern: /DROP\s+TRIGGER\s+(IF\s+EXISTS\s+)?\w+\s+ON\s+\w+[\s\S]*?(?:;|$)/gi,
        replace: '/* Nile: DROP TRIGGER removed — triggers not supported */',
        description: 'Strip DROP TRIGGER statement',
    },
    {
        ruleCode: 'NILE-TF-002',
        pattern: /CREATE\s+(OR\s+REPLACE\s+)?FUNCTION\s+[\s\S]*?(?:LANGUAGE\s+\w+[\s\S]*?)?(?:;|$)/gi,
        replace: '/* Nile: FUNCTION removed — user-defined functions not supported */',
        description: 'Strip CREATE FUNCTION statement',
    },
    {
        ruleCode: 'NILE-TF-003',
        pattern: /CREATE\s+(OR\s+REPLACE\s+)?PROCEDURE\s+[\s\S]*?(?:LANGUAGE\s+\w+[\s\S]*?)?(?:;|$)/gi,
        replace: '/* Nile: PROCEDURE removed — stored procedures not supported */',
        description: 'Strip CREATE PROCEDURE statement',
    },
    {
        ruleCode: 'NILE-TF-002',
        pattern: /DROP\s+FUNCTION\s+(IF\s+EXISTS\s+)?[\w.]+(?:\s*\([^)]*\))?[\s\S]*?(?:;|$)/gi,
        replace: '/* Nile: DROP FUNCTION removed — functions not supported */',
        description: 'Strip DROP FUNCTION statement',
    },
    {
        ruleCode: 'NILE-TF-003',
        pattern: /DROP\s+PROCEDURE\s+(IF\s+EXISTS\s+)?[\w.]+(?:\s*\([^)]*\))?[\s\S]*?(?:;|$)/gi,
        replace: '/* Nile: DROP PROCEDURE removed — procedures not supported */',
        description: 'Strip DROP PROCEDURE statement',
    },
    {
        ruleCode: 'NILE-TF-004',
        pattern: /DO\s+\$\$[\s\S]*?\$\$(?:\s+LANGUAGE\s+\w+)?/gi,
        replace: '/* Nile: DO $$ block removed — anonymous code blocks not supported */',
        description: 'Strip DO $$ anonymous code block',
    },
    {
        ruleCode: 'NILE-ADM-004',
        pattern: /CREATE\s+POLICY\s+[\s\S]*?(?:;|$)/gi,
        replace: '/* Nile: CREATE POLICY removed — use SET nile.tenant_id for tenant isolation */',
        description: 'Strip CREATE POLICY (RLS replaced by tenant isolation)',
    },
    {
        ruleCode: 'NILE-ADM-004',
        pattern: /ALTER\s+TABLE\s+\S+\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/gi,
        replace: '/* Nile: ENABLE ROW LEVEL SECURITY removed — use SET nile.tenant_id */',
        description: 'Strip ENABLE ROW LEVEL SECURITY',
    },
    {
        ruleCode: 'NILE-ADM-004',
        pattern: /ALTER\s+TABLE\s+\S+\s+FORCE\s+ROW\s+LEVEL\s+SECURITY/gi,
        replace: '/* Nile: FORCE ROW LEVEL SECURITY removed — use SET nile.tenant_id */',
        description: 'Strip FORCE ROW LEVEL SECURITY',
    },
    {
        ruleCode: 'NILE-ADM-004',
        pattern: /DROP\s+POLICY\s+(IF\s+EXISTS\s+)?\w+\s+ON\s+\w+/gi,
        replace: '/* Nile: DROP POLICY removed — RLS not supported */',
        description: 'Strip DROP POLICY',
    },
    {
        ruleCode: 'NILE-ADM-001',
        pattern: /CREATE\s+(USER|ROLE)\s+[\s\S]*?(?:;|$)/gi,
        replace: '/* Nile: CREATE USER/ROLE removed — manage via Nile Console */',
        description: 'Strip CREATE USER/ROLE statement',
    },
    {
        ruleCode: 'NILE-ADM-001',
        pattern: /DROP\s+(USER|ROLE)\s+(IF\s+EXISTS\s+)?[\s\S]*?(?:;|$)/gi,
        replace: '/* Nile: DROP USER/ROLE removed — manage via Nile Console */',
        description: 'Strip DROP USER/ROLE statement',
    },
    {
        ruleCode: 'NILE-ADM-001',
        pattern: /ALTER\s+(USER|ROLE)\s+[\s\S]*?(?:;|$)/gi,
        replace: '/* Nile: ALTER USER/ROLE removed — manage via Nile Console */',
        description: 'Strip ALTER USER/ROLE statement',
    },
    {
        ruleCode: 'NILE-ADM-002',
        pattern: /CREATE\s+DATABASE\s+[\s\S]*?(?:;|$)/gi,
        replace: '/* Nile: CREATE DATABASE removed — manage via Nile Console */',
        description: 'Strip CREATE DATABASE statement',
    },
    {
        ruleCode: 'NILE-ADM-003',
        pattern: /\bGRANT\s+[\s\S]*?(?:;|$)/gi,
        replace: '/* Nile: GRANT removed — manage permissions via Nile Console */',
        description: 'Strip GRANT statement',
    },
    {
        ruleCode: 'NILE-ADM-003',
        pattern: /\bREVOKE\s+[\s\S]*?(?:;|$)/gi,
        replace: '/* Nile: REVOKE removed — manage permissions via Nile Console */',
        description: 'Strip REVOKE statement',
    },
    {
        ruleCode: 'NILE-EXT-001',
        pattern: /CREATE\s+EXTENSION\s+(IF\s+NOT\s+EXISTS\s+)?[\w"]+(?:\s+(?:SCHEMA|VERSION|CASCADE)[\s\S]*?)?(?:;|$)/gi,
        replace: '/* Nile: CREATE EXTENSION skipped — pre-installed */',
        description: 'Skip CREATE EXTENSION (pre-installed on Nile)',
    },
    {
        ruleCode: 'NILE-EXT-002',
        pattern: /DROP\s+EXTENSION\s+(IF\s+EXISTS\s+)?[\w"]+(?:\s+(?:CASCADE|RESTRICT))?/gi,
        replace: '/* Nile: DROP EXTENSION skipped — pre-installed extensions cannot be removed */',
        description: 'Skip DROP EXTENSION (cannot remove pre-installed)',
    },
];
function transformSqlForNile(sql) {
    const changes = [];
    let current = sql;
    for (const rule of TRANSFORM_RULES) {
        const before = current;
        if (typeof rule.replace === 'string') {
            current = current.replace(rule.pattern, rule.replace);
        }
        else {
            current = current.replace(rule.pattern, rule.replace);
        }
        if (current !== before) {
            const match = before.match(rule.pattern);
            changes.push({
                ruleCode: rule.ruleCode,
                description: rule.description,
                original: match?.[0] ?? '',
                replacement: typeof rule.replace === 'string' ? rule.replace : '(dynamic)',
            });
        }
    }
    const cleaned = current
        .replace(/\n\s*\n\s*\n/g, '\n\n')
        .replace(/  +/g, ' ')
        .trim();
    return {
        sql: cleaned,
        changes,
        modified: changes.length > 0,
    };
}
function transformSqlStatementsForNile(sqlStatements) {
    const statements = sqlStatements
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);
    const allChanges = [];
    const transformed = [];
    for (const stmt of statements) {
        const result = transformSqlForNile(stmt);
        transformed.push(result.sql);
        allChanges.push(...result.changes);
    }
    return {
        sql: transformed.join(';\n\n') + (transformed.length > 0 ? ';' : ''),
        changes: allChanges,
        modified: allChanges.length > 0,
    };
}
function needsNileTransformation(sql) {
    for (const rule of TRANSFORM_RULES) {
        if (rule.pattern.test(sql)) {
            rule.pattern.lastIndex = 0;
            return true;
        }
    }
    return false;
}
function formatNileTransformChanges(changes) {
    if (changes.length === 0)
        return 'No Nile transformations needed.';
    const lines = [`Nile Transformations (${changes.length}):`];
    for (const change of changes) {
        lines.push(`  [${change.ruleCode}] ${change.description}`);
        if (change.original) {
            lines.push(`    - ${change.original}`);
            lines.push(`    + ${change.replacement || '(removed)'}`);
        }
    }
    return lines.join('\n');
}
