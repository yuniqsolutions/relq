import { SQLITE_ALTER_TABLE_SUPPORT, POSTGRES_TO_SQLITE_TYPE_MAP } from "./features.js";
export function generateCreateTable(table, options) {
    const lines = [];
    const tableName = quoteIdentifier(table.name);
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
    parts.push(mapToSQLiteType(column.type));
    if (column.isPrimaryKey && column.isAutoIncrement) {
        parts.push('PRIMARY KEY AUTOINCREMENT');
    }
    else if (column.isPrimaryKey) {
        parts.push('PRIMARY KEY');
    }
    if (!column.nullable && !column.isPrimaryKey) {
        parts.push('NOT NULL');
    }
    if (column.defaultValue && !column.isGenerated && !column.isAutoIncrement) {
        parts.push('DEFAULT');
        if (column.defaultIsExpression) {
            parts.push(`(${column.defaultValue})`);
        }
        else {
            parts.push(column.defaultValue);
        }
    }
    if (column.isGenerated && column.generatedExpression) {
        parts.push('GENERATED ALWAYS AS');
        parts.push(`(${column.generatedExpression})`);
        parts.push('STORED');
    }
    return parts.join(' ');
}
export function generateCreateIndex(index, options) {
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
    parts.push(quoteIdentifier(index.tableName));
    const columnDefs = index.columns.map(col => {
        let def = col.isExpression ? col.name : quoteIdentifier(col.name);
        if (col.direction === 'DESC') {
            def += ' DESC';
        }
        return def;
    });
    parts.push(`(${columnDefs.join(', ')})`);
    if (index.predicate) {
        parts.push('WHERE');
        parts.push(index.predicate);
    }
    const sql = parts.join(' ') + ';';
    return {
        sql,
        type: 'CREATE',
        destructive: false,
        affects: [index.tableName, index.name],
    };
}
export function generateAlterTable(from, to, options) {
    const statements = [];
    const tableName = quoteIdentifier(to.name);
    const fromColNames = new Set(from.columns.map(c => c.name));
    const toColNames = new Set(to.columns.map(c => c.name));
    let needsRecreation = false;
    const simpleChanges = [];
    for (const col of to.columns) {
        if (!fromColNames.has(col.name)) {
            if (canAddColumn(col)) {
                simpleChanges.push({
                    sql: `ALTER TABLE ${tableName} ADD COLUMN ${generateColumnDef(col)};`,
                    type: 'ALTER',
                    destructive: false,
                    affects: [tableName],
                });
            }
            else {
                needsRecreation = true;
            }
        }
    }
    for (const col of from.columns) {
        if (!toColNames.has(col.name)) {
            if (SQLITE_ALTER_TABLE_SUPPORT.dropColumn) {
                simpleChanges.push({
                    sql: `ALTER TABLE ${tableName} DROP COLUMN ${quoteIdentifier(col.name)};`,
                    type: 'ALTER',
                    destructive: true,
                    affects: [tableName],
                });
            }
            else {
                needsRecreation = true;
            }
        }
    }
    for (const toCol of to.columns) {
        const fromCol = from.columns.find(c => c.name === toCol.name);
        if (fromCol) {
            if (hasColumnChanges(fromCol, toCol)) {
                needsRecreation = true;
            }
        }
    }
    if (needsRecreation) {
        return [generateTableRecreation(from, to, options)];
    }
    return simpleChanges;
}
function canAddColumn(column) {
    if (column.isPrimaryKey)
        return false;
    if (column.isAutoIncrement)
        return false;
    if (!column.nullable && !column.defaultValue)
        return false;
    return true;
}
function hasColumnChanges(from, to) {
    return (from.type !== to.type ||
        from.nullable !== to.nullable ||
        from.defaultValue !== to.defaultValue ||
        from.isGenerated !== to.isGenerated);
}
function generateTableRecreation(from, to, options) {
    const tableName = quoteIdentifier(to.name);
    const tempName = quoteIdentifier(`_${to.name}_new`);
    const fromColNames = new Set(from.columns.map(c => c.name));
    const commonColumns = to.columns
        .filter(c => fromColNames.has(c.name) && !c.isGenerated)
        .map(c => quoteIdentifier(c.name))
        .join(', ');
    const lines = [
        '-- Begin table recreation',
        'PRAGMA foreign_keys=OFF;',
        'BEGIN TRANSACTION;',
        '',
        `-- Create new table structure`,
        generateCreateTable({ ...to, name: `_${to.name}_new` }, options).sql,
        '',
        '-- Copy data to new table',
        `INSERT INTO ${tempName} (${commonColumns})`,
        `SELECT ${commonColumns} FROM ${tableName};`,
        '',
        '-- Drop old table',
        `DROP TABLE ${tableName};`,
        '',
        '-- Rename new table',
        `ALTER TABLE ${tempName} RENAME TO ${tableName};`,
        '',
        'COMMIT;',
        'PRAGMA foreign_keys=ON;',
    ];
    return {
        sql: lines.join('\n'),
        type: 'ALTER',
        destructive: true,
        affects: [to.name],
    };
}
export function generateDropTable(tableName, options) {
    const parts = ['DROP TABLE'];
    if (options?.ifExists) {
        parts.push('IF EXISTS');
    }
    parts.push(quoteIdentifier(tableName));
    const sql = parts.join(' ') + ';';
    return {
        sql,
        type: 'DROP',
        destructive: true,
        affects: [tableName],
    };
}
export function quoteIdentifier(identifier) {
    if (/[^a-z0-9_]/i.test(identifier) || isReservedWord(identifier)) {
        return `"${identifier.replace(/"/g, '""')}"`;
    }
    return identifier;
}
export function escapeString(value) {
    return `'${value.replace(/'/g, "''")}'`;
}
function mapToSQLiteType(pgType) {
    const type = pgType.toLowerCase();
    if (POSTGRES_TO_SQLITE_TYPE_MAP[type]) {
        return POSTGRES_TO_SQLITE_TYPE_MAP[type];
    }
    if (type.startsWith('varchar') || type.startsWith('character varying')) {
        return 'TEXT';
    }
    if (type.includes('[]')) {
        return 'TEXT';
    }
    return 'TEXT';
}
function isReservedWord(word) {
    const reserved = new Set([
        'abort', 'action', 'add', 'after', 'all', 'alter', 'always', 'analyze',
        'and', 'as', 'asc', 'attach', 'autoincrement', 'before', 'begin',
        'between', 'by', 'cascade', 'case', 'cast', 'check', 'collate',
        'column', 'commit', 'conflict', 'constraint', 'create', 'cross',
        'current', 'current_date', 'current_time', 'current_timestamp',
        'database', 'default', 'deferrable', 'deferred', 'delete', 'desc',
        'detach', 'distinct', 'do', 'drop', 'each', 'else', 'end', 'escape',
        'except', 'exclude', 'exclusive', 'exists', 'explain', 'fail', 'filter',
        'first', 'following', 'for', 'foreign', 'from', 'full', 'generated',
        'glob', 'group', 'groups', 'having', 'if', 'ignore', 'immediate', 'in',
        'index', 'indexed', 'initially', 'inner', 'insert', 'instead',
        'intersect', 'into', 'is', 'isnull', 'join', 'key', 'last', 'left',
        'like', 'limit', 'match', 'materialized', 'natural', 'no', 'not',
        'nothing', 'notnull', 'null', 'nulls', 'of', 'offset', 'on', 'or',
        'order', 'others', 'outer', 'over', 'partition', 'plan', 'pragma',
        'preceding', 'primary', 'query', 'raise', 'range', 'recursive',
        'references', 'regexp', 'reindex', 'release', 'rename', 'replace',
        'restrict', 'returning', 'right', 'rollback', 'row', 'rows', 'savepoint',
        'select', 'set', 'table', 'temp', 'temporary', 'then', 'ties', 'to',
        'transaction', 'trigger', 'unbounded', 'union', 'unique', 'update',
        'using', 'vacuum', 'values', 'view', 'virtual', 'when', 'where',
        'window', 'with', 'without',
    ]);
    return reserved.has(word.toLowerCase());
}
