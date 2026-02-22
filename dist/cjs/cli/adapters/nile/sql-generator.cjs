"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCreateTable = generateCreateTable;
exports.generateCreateIndex = generateCreateIndex;
exports.generateAlterTable = generateAlterTable;
exports.generateDropTable = generateDropTable;
exports.quoteIdentifier = quoteIdentifier;
exports.escapeString = escapeString;
function generateCreateTable(table, options) {
    const lines = [];
    const tableName = formatTableName(table, options);
    const createPrefix = options?.ifNotExists
        ? 'CREATE TABLE IF NOT EXISTS'
        : 'CREATE TABLE';
    lines.push(`${createPrefix} ${tableName} (`);
    const columnDefs = table.columns.map((col, i) => {
        const isLast = i === table.columns.length - 1;
        const suffix = isLast ? '' : ',';
        return `    ${generateColumnDef(col)}${suffix}`;
    });
    lines.push(...columnDefs);
    lines.push(');');
    if (options?.includeComments) {
        if (table.comment) {
            lines.push('');
            lines.push(`COMMENT ON TABLE ${tableName} IS ${escapeString(table.comment)};`);
        }
        for (const col of table.columns) {
            if (col.comment) {
                lines.push(`COMMENT ON COLUMN ${tableName}.${quoteIdentifier(col.name)} IS ${escapeString(col.comment)};`);
            }
        }
    }
    const sql = options?.prettyPrint
        ? lines.join('\n')
        : lines.join(' ').replace(/\s+/g, ' ');
    return {
        sql,
        type: 'CREATE',
        destructive: false,
        affects: [tableName],
    };
}
function generateColumnDef(column) {
    const parts = [quoteIdentifier(column.name)];
    parts.push(column.type);
    if (!column.nullable) {
        parts.push('NOT NULL');
    }
    if (column.defaultValue && !column.isGenerated) {
        parts.push('DEFAULT');
        parts.push(column.defaultValue);
    }
    if (column.isGenerated && column.generatedExpression) {
        parts.push('GENERATED ALWAYS AS');
        parts.push(`(${column.generatedExpression})`);
        parts.push('STORED');
    }
    return parts.join(' ');
}
function generateCreateIndex(index, options) {
    const parts = ['CREATE'];
    if (index.isUnique) {
        parts.push('UNIQUE');
    }
    parts.push('INDEX');
    if (options?.ifNotExists) {
        parts.push('IF NOT EXISTS');
    }
    parts.push(quoteIdentifier(index.name));
    parts.push('ON');
    parts.push(formatIndexTableName(index, options));
    if (index.type && index.type.toLowerCase() !== 'btree') {
        parts.push('USING');
        parts.push(index.type);
    }
    const columnDefs = index.columns.map(col => {
        let def = col.isExpression ? col.name : quoteIdentifier(col.name);
        if (col.direction === 'DESC') {
            def += ' DESC';
        }
        if (col.nulls === 'FIRST') {
            def += ' NULLS FIRST';
        }
        else if (col.nulls === 'LAST' && col.direction === 'DESC') {
            def += ' NULLS LAST';
        }
        return def;
    });
    parts.push(`(${columnDefs.join(', ')})`);
    if (index.includeColumns && index.includeColumns.length > 0) {
        parts.push('INCLUDE');
        parts.push(`(${index.includeColumns.map(quoteIdentifier).join(', ')})`);
    }
    if (index.predicate) {
        parts.push('WHERE');
        parts.push(index.predicate);
    }
    const sql = parts.join(' ') + ';';
    return {
        sql,
        type: 'CREATE',
        destructive: false,
        affects: [`${index.schema}.${index.tableName}`, index.name],
    };
}
function generateAlterTable(from, to, options) {
    const statements = [];
    const tableName = formatTableName(to, options);
    const fromColNames = new Set(from.columns.map(c => c.name));
    const toColNames = new Set(to.columns.map(c => c.name));
    for (const col of to.columns) {
        if (!fromColNames.has(col.name)) {
            statements.push({
                sql: `ALTER TABLE ${tableName} ADD COLUMN ${generateColumnDef(col)};`,
                type: 'ALTER',
                destructive: false,
                affects: [tableName],
            });
        }
    }
    for (const col of from.columns) {
        if (!toColNames.has(col.name)) {
            const cascade = options?.cascade ? ' CASCADE' : '';
            statements.push({
                sql: `ALTER TABLE ${tableName} DROP COLUMN ${quoteIdentifier(col.name)}${cascade};`,
                type: 'ALTER',
                destructive: true,
                affects: [tableName],
            });
        }
    }
    for (const toCol of to.columns) {
        const fromCol = from.columns.find(c => c.name === toCol.name);
        if (fromCol) {
            const alterStatements = generateColumnAlterations(tableName, fromCol, toCol);
            statements.push(...alterStatements);
        }
    }
    return statements;
}
function generateColumnAlterations(tableName, from, to) {
    const statements = [];
    const colName = quoteIdentifier(to.name);
    if (from.type !== to.type) {
        statements.push({
            sql: `ALTER TABLE ${tableName} ALTER COLUMN ${colName} TYPE ${to.type};`,
            type: 'ALTER',
            destructive: true,
            affects: [tableName],
        });
    }
    if (from.nullable !== to.nullable) {
        if (to.nullable) {
            statements.push({
                sql: `ALTER TABLE ${tableName} ALTER COLUMN ${colName} DROP NOT NULL;`,
                type: 'ALTER',
                destructive: false,
                affects: [tableName],
            });
        }
        else {
            statements.push({
                sql: `ALTER TABLE ${tableName} ALTER COLUMN ${colName} SET NOT NULL;`,
                type: 'ALTER',
                destructive: true,
                affects: [tableName],
            });
        }
    }
    if (from.defaultValue !== to.defaultValue) {
        if (to.defaultValue) {
            statements.push({
                sql: `ALTER TABLE ${tableName} ALTER COLUMN ${colName} SET DEFAULT ${to.defaultValue};`,
                type: 'ALTER',
                destructive: false,
                affects: [tableName],
            });
        }
        else {
            statements.push({
                sql: `ALTER TABLE ${tableName} ALTER COLUMN ${colName} DROP DEFAULT;`,
                type: 'ALTER',
                destructive: false,
                affects: [tableName],
            });
        }
    }
    return statements;
}
function generateDropTable(tableName, options) {
    const parts = ['DROP TABLE'];
    if (options?.ifExists) {
        parts.push('IF EXISTS');
    }
    parts.push(quoteIdentifier(tableName));
    if (options?.cascade) {
        parts.push('CASCADE');
    }
    const sql = parts.join(' ') + ';';
    return {
        sql,
        type: 'DROP',
        destructive: true,
        affects: [tableName],
    };
}
function quoteIdentifier(identifier) {
    if (/[^a-z0-9_]/.test(identifier) || isReservedWord(identifier)) {
        return `"${identifier.replace(/"/g, '""')}"`;
    }
    return identifier;
}
function escapeString(value) {
    return `'${value.replace(/'/g, "''")}'`;
}
function formatTableName(table, options) {
    if (options?.qualifiedNames !== false && table.schema && table.schema !== 'public') {
        return `${quoteIdentifier(table.schema)}.${quoteIdentifier(table.name)}`;
    }
    return quoteIdentifier(table.name);
}
function formatIndexTableName(index, options) {
    if (options?.qualifiedNames !== false && index.schema && index.schema !== 'public') {
        return `${quoteIdentifier(index.schema)}.${quoteIdentifier(index.tableName)}`;
    }
    return quoteIdentifier(index.tableName);
}
function isReservedWord(word) {
    const reserved = new Set([
        'all', 'analyse', 'analyze', 'and', 'any', 'array', 'as', 'asc',
        'asymmetric', 'authorization', 'between', 'binary', 'both', 'case',
        'cast', 'check', 'collate', 'column', 'constraint', 'create', 'cross',
        'current_date', 'current_role', 'current_time', 'current_timestamp',
        'current_user', 'default', 'deferrable', 'desc', 'distinct', 'do',
        'else', 'end', 'except', 'false', 'fetch', 'for', 'foreign', 'from',
        'full', 'grant', 'group', 'having', 'in', 'initially', 'inner',
        'intersect', 'into', 'is', 'isnull', 'join', 'lateral', 'leading',
        'left', 'like', 'limit', 'localtime', 'localtimestamp', 'natural',
        'not', 'notnull', 'null', 'offset', 'on', 'only', 'or', 'order',
        'outer', 'overlaps', 'placing', 'primary', 'references', 'returning',
        'right', 'select', 'session_user', 'similar', 'some', 'symmetric',
        'table', 'then', 'to', 'trailing', 'true', 'union', 'unique', 'user',
        'using', 'variadic', 'verbose', 'when', 'where', 'window', 'with',
    ]);
    return reserved.has(word.toLowerCase());
}
