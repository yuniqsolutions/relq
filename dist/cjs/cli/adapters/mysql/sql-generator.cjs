"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCreateTable = generateCreateTable;
exports.generateCreateIndex = generateCreateIndex;
exports.generateAlterTable = generateAlterTable;
exports.generateDropTable = generateDropTable;
exports.quoteIdentifier = quoteIdentifier;
exports.escapeString = escapeString;
const features_1 = require("./features.cjs");
function generateCreateTable(table, options) {
    const lines = [];
    const tableName = formatTableName(table.name, options);
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
    const pkColumns = table.columns.filter(c => c.isPrimaryKey);
    if (pkColumns.length > 0) {
        const pkNames = pkColumns.map(c => quoteIdentifier(c.name)).join(', ');
        lines.push(`    PRIMARY KEY (${pkNames})`);
    }
    lines.push(') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;');
    if (options?.includeComments && table.comment) {
        lines.push('');
        lines.push(`ALTER TABLE ${tableName} COMMENT = ${escapeString(table.comment)};`);
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
    parts.push(mapToMySQLType(column.type));
    if (!column.nullable) {
        parts.push('NOT NULL');
    }
    if (column.isAutoIncrement) {
        parts.push('AUTO_INCREMENT');
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
    if (column.comment) {
        parts.push('COMMENT');
        parts.push(escapeString(column.comment));
    }
    return parts.join(' ');
}
function generateCreateIndex(index, options) {
    const parts = ['CREATE'];
    if (index.isUnique) {
        parts.push('UNIQUE');
    }
    parts.push('INDEX');
    parts.push(quoteIdentifier(index.name));
    parts.push('ON');
    parts.push(formatTableName(index.tableName, options));
    const columnDefs = index.columns.map(col => {
        let def = col.isExpression ? col.name : quoteIdentifier(col.name);
        if (col.direction === 'DESC') {
            def += ' DESC';
        }
        return def;
    });
    parts.push(`(${columnDefs.join(', ')})`);
    if (index.type && index.type.toLowerCase() !== 'btree') {
        parts.push('USING');
        parts.push(index.type.toUpperCase());
    }
    const sql = parts.join(' ') + ';';
    return {
        sql,
        type: 'CREATE',
        destructive: false,
        affects: [index.tableName, index.name],
    };
}
function generateAlterTable(from, to, options) {
    const statements = [];
    const tableName = formatTableName(to.name, options);
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
            statements.push({
                sql: `ALTER TABLE ${tableName} DROP COLUMN ${quoteIdentifier(col.name)};`,
                type: 'ALTER',
                destructive: true,
                affects: [tableName],
            });
        }
    }
    for (const toCol of to.columns) {
        const fromCol = from.columns.find(c => c.name === toCol.name);
        if (fromCol) {
            const alterStatements = generateColumnModifications(tableName, fromCol, toCol);
            statements.push(...alterStatements);
        }
    }
    return statements;
}
function generateColumnModifications(tableName, from, to) {
    const statements = [];
    const typeChanged = from.type !== to.type;
    const nullableChanged = from.nullable !== to.nullable;
    const defaultChanged = from.defaultValue !== to.defaultValue;
    if (typeChanged || nullableChanged || defaultChanged) {
        statements.push({
            sql: `ALTER TABLE ${tableName} MODIFY COLUMN ${generateColumnDef(to)};`,
            type: 'ALTER',
            destructive: typeChanged,
            affects: [tableName],
        });
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
    if (features_1.MYSQL_RESERVED_WORDS.has(identifier.toLowerCase()) ||
        /[^a-z0-9_]/i.test(identifier)) {
        return `\`${identifier.replace(/`/g, '``')}\``;
    }
    return identifier;
}
function escapeString(value) {
    return `'${value.replace(/'/g, "''").replace(/\\/g, '\\\\')}'`;
}
function formatTableName(name, options) {
    return quoteIdentifier(name);
}
function mapToMySQLType(pgType) {
    const type = pgType.toLowerCase();
    const mappings = {
        'serial': 'INT AUTO_INCREMENT',
        'bigserial': 'BIGINT AUTO_INCREMENT',
        'smallserial': 'SMALLINT AUTO_INCREMENT',
        'boolean': 'TINYINT(1)',
        'bool': 'TINYINT(1)',
        'bytea': 'BLOB',
        'timestamptz': 'DATETIME',
        'timestamp with time zone': 'DATETIME',
        'timetz': 'TIME',
        'time with time zone': 'TIME',
        'uuid': 'CHAR(36)',
        'jsonb': 'JSON',
        'inet': 'VARCHAR(45)',
        'cidr': 'VARCHAR(45)',
        'macaddr': 'VARCHAR(17)',
        'double precision': 'DOUBLE',
        'real': 'FLOAT',
    };
    if (mappings[type]) {
        return mappings[type];
    }
    if (type.startsWith('character varying')) {
        return type.replace('character varying', 'VARCHAR');
    }
    if (type.includes('[]')) {
        return 'JSON';
    }
    return pgType.toUpperCase();
}
