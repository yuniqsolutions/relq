const TRANSFORM_RULES = [
    {
        ruleCode: 'DSQL-TYPE-001',
        pattern: /\bBIGSERIAL\b/gi,
        replace: 'UUID DEFAULT gen_random_uuid()',
        description: 'Replace BIGSERIAL with UUID + gen_random_uuid()',
    },
    {
        ruleCode: 'DSQL-TYPE-001',
        pattern: /\bSMALLSERIAL\b/gi,
        replace: 'UUID DEFAULT gen_random_uuid()',
        description: 'Replace SMALLSERIAL with UUID + gen_random_uuid()',
    },
    {
        ruleCode: 'DSQL-TYPE-001',
        pattern: /\bSERIAL\b/gi,
        replace: 'UUID DEFAULT gen_random_uuid()',
        description: 'Replace SERIAL with UUID + gen_random_uuid()',
    },
    {
        ruleCode: 'DSQL-MOD-001',
        pattern: /\bGENERATED\s+(ALWAYS|BY\s+DEFAULT)\s+AS\s+IDENTITY(\s*\([^)]*\))?/gi,
        replace: 'DEFAULT gen_random_uuid()',
        description: 'Replace GENERATED AS IDENTITY with gen_random_uuid() default',
    },
    {
        ruleCode: 'DSQL-TYPE-002',
        pattern: /\bJSONB\b/gi,
        replace: 'TEXT',
        description: 'Replace JSONB column type with TEXT',
    },
    {
        ruleCode: 'DSQL-TYPE-002',
        pattern: /\bJSON\b(?!\s*_)/gi,
        replace: 'TEXT',
        description: 'Replace JSON column type with TEXT',
    },
    {
        ruleCode: 'DSQL-TYPE-003',
        pattern: /\bXML\b/gi,
        replace: 'TEXT',
        description: 'Replace XML column type with TEXT',
    },
    {
        ruleCode: 'DSQL-TYPE-004',
        pattern: /\bMONEY\b/gi,
        replace: 'NUMERIC(19,4)',
        description: 'Replace MONEY type with NUMERIC(19,4)',
    },
    {
        ruleCode: 'DSQL-TBL-001',
        pattern: /\bCREATE\s+(GLOBAL\s+|LOCAL\s+)?TEMP(?:ORARY)?\s+TABLE\b/gi,
        replace: 'CREATE TABLE',
        description: 'Strip TEMPORARY from CREATE TABLE',
    },
    {
        ruleCode: 'DSQL-TBL-002',
        pattern: /\bCREATE\s+UNLOGGED\s+TABLE\b/gi,
        replace: 'CREATE TABLE',
        description: 'Strip UNLOGGED from CREATE TABLE',
    },
    {
        ruleCode: 'DSQL-TBL-005',
        pattern: /\bPARTITION\s+BY\s+(RANGE|LIST|HASH)\s*\([^)]*\)/gi,
        replace: '/* DSQL: PARTITION BY removed — automatic distribution */',
        description: 'Strip PARTITION BY clause',
    },
    {
        ruleCode: 'DSQL-TBL-003',
        pattern: /\bINHERITS\s*\([^)]*\)/gi,
        replace: '/* DSQL: INHERITS removed — not supported */',
        description: 'Strip INHERITS clause',
    },
    {
        ruleCode: 'DSQL-TBL-004',
        pattern: /\bTABLESPACE\s+\w+/gi,
        replace: '/* DSQL: TABLESPACE removed */',
        description: 'Strip TABLESPACE specification',
    },
    {
        ruleCode: 'DSQL-TBL-006',
        pattern: /\bWITH\s*\(\s*(?:fillfactor|autovacuum_enabled|toast\.\w+|parallel_workers)\s*=\s*[^)]*\)/gi,
        replace: '/* DSQL: storage parameters removed */',
        description: 'Strip WITH (storage_parameters)',
    },
    {
        ruleCode: 'DSQL-TBL-007',
        pattern: /\bON\s+COMMIT\s+(PRESERVE\s+ROWS|DELETE\s+ROWS|DROP)\b/gi,
        replace: '/* DSQL: ON COMMIT removed */',
        description: 'Strip ON COMMIT clause',
    },
    {
        ruleCode: 'DSQL-CONS-006',
        pattern: /\bINITIALLY\s+(DEFERRED|IMMEDIATE)\b/gi,
        replace: '',
        description: 'Strip INITIALLY DEFERRED/IMMEDIATE',
    },
    {
        ruleCode: 'DSQL-CONS-006',
        pattern: /\bNOT\s+DEFERRABLE\b/gi,
        replace: '',
        description: 'Strip NOT DEFERRABLE',
    },
    {
        ruleCode: 'DSQL-CONS-006',
        pattern: /\bDEFERRABLE\b/gi,
        replace: '',
        description: 'Strip DEFERRABLE',
    },
    {
        ruleCode: 'DSQL-CONS-001',
        pattern: /,?\s*(?:CONSTRAINT\s+\w+\s+)?FOREIGN\s+KEY\s*\([^)]*\)\s*REFERENCES\s+\w+(?:\s*\([^)]*\))?(?:\s+(?:ON\s+(?:DELETE|UPDATE)\s+(?:CASCADE|SET\s+NULL|SET\s+DEFAULT|RESTRICT|NO\s+ACTION)\s*)+)?(?:\s+MATCH\s+(?:FULL|PARTIAL|SIMPLE))?\s*(?:DEFERRABLE)?(?:\s+INITIALLY\s+(?:DEFERRED|IMMEDIATE))?/gi,
        replace: '\n    /* DSQL: FOREIGN KEY constraint removed — not enforced */',
        description: 'Strip FOREIGN KEY constraint (table-level)',
    },
    {
        ruleCode: 'DSQL-CONS-002',
        pattern: /\bREFERENCES\s+\w+(?:\s*\([^)]*\))?(?:\s+(?:ON\s+(?:DELETE|UPDATE)\s+(?:CASCADE|SET\s+NULL|SET\s+DEFAULT|RESTRICT|NO\s+ACTION)\s*)+)?(?:\s+MATCH\s+(?:FULL|PARTIAL|SIMPLE))?/gi,
        replace: '/* DSQL: REFERENCES removed */',
        description: 'Strip column-level REFERENCES clause',
    },
    {
        ruleCode: 'DSQL-IDX-006',
        pattern: /\bCREATE\s+(UNIQUE\s+)?INDEX\s+CONCURRENTLY\b/gi,
        replace: (_match, unique) => `CREATE ${unique || ''}INDEX`.replace(/\s{2,}/g, ' '),
        description: 'Strip CONCURRENTLY from CREATE INDEX',
    },
    {
        ruleCode: 'DSQL-IDX-001',
        pattern: /\bUSING\s+(?:gin|gist|spgist|brin|hash)\b/gi,
        replace: 'USING btree /* DSQL: original method replaced with btree */',
        description: 'Replace non-B-tree index method with btree',
    },
];
export function transformSqlForDsql(sql) {
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
        .replace(/,\s*\)/g, '\n)')
        .replace(/\(\s*,/g, '(')
        .replace(/  +/g, ' ')
        .trim();
    return {
        sql: cleaned,
        changes,
        modified: changes.length > 0,
    };
}
export function transformSqlStatementsForDsql(sqlStatements) {
    const statements = sqlStatements
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);
    const allChanges = [];
    const transformed = [];
    for (const stmt of statements) {
        const result = transformSqlForDsql(stmt);
        transformed.push(result.sql);
        allChanges.push(...result.changes);
    }
    return {
        sql: transformed.join(';\n\n') + (transformed.length > 0 ? ';' : ''),
        changes: allChanges,
        modified: allChanges.length > 0,
    };
}
export function needsDsqlTransformation(sql) {
    for (const rule of TRANSFORM_RULES) {
        if (rule.pattern.test(sql)) {
            rule.pattern.lastIndex = 0;
            return true;
        }
    }
    return false;
}
export function formatDsqlTransformChanges(changes) {
    if (changes.length === 0)
        return 'No DSQL transformations needed.';
    const lines = [`DSQL Transformations (${changes.length}):`];
    for (const change of changes) {
        lines.push(`  [${change.ruleCode}] ${change.description}`);
        if (change.original) {
            lines.push(`    - ${change.original}`);
            lines.push(`    + ${change.replacement || '(removed)'}`);
        }
    }
    return lines.join('\n');
}
