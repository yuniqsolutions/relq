"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.quoteSQLiteIdentifier = quoteSQLiteIdentifier;
exports.generateSQLiteCreateTableSQL = generateSQLiteCreateTableSQL;
exports.generateSQLiteIndexSQL = generateSQLiteIndexSQL;
function quoteSQLiteIdentifier(name) {
    return `"${name.replace(/"/g, '""')}"`;
}
function formatDefault(col) {
    const val = col.$default;
    if (val === undefined || val === null)
        return '';
    if (typeof val === 'object' && '$sql' in val && '$isDefault' in val) {
        return ` DEFAULT ${val.$sql}`;
    }
    if (typeof val === 'string') {
        if (/^CURRENT_(TIMESTAMP|DATE|TIME)$/i.test(val)) {
            return ` DEFAULT ${val}`;
        }
        if (val.startsWith('(') && val.endsWith(')')) {
            return ` DEFAULT ${val}`;
        }
        return ` DEFAULT '${val.replace(/'/g, "''")}'`;
    }
    if (typeof val === 'number' || typeof val === 'bigint') {
        return ` DEFAULT ${val}`;
    }
    if (typeof val === 'boolean') {
        return ` DEFAULT ${val ? 1 : 0}`;
    }
    return '';
}
function generateColumnSQL(name, col) {
    const parts = [quoteSQLiteIdentifier(col.$columnName || name)];
    parts.push(col.$sqlType || (typeof col.$type === 'string' ? col.$type : null) || 'TEXT');
    if (col.$primaryKey) {
        parts.push('PRIMARY KEY');
        if (col.$autoincrement) {
            parts.push('AUTOINCREMENT');
        }
    }
    if (col.$nullable === false && !col.$primaryKey) {
        parts.push('NOT NULL');
    }
    if (col.$unique) {
        parts.push('UNIQUE');
    }
    const defaultClause = formatDefault(col);
    if (defaultClause) {
        parts.push(defaultClause.trim());
    }
    if (col.$check) {
        if (col.$checkValues && col.$checkName) {
            const colRef = quoteSQLiteIdentifier(col.$columnName || name);
            const vals = col.$checkValues.map(v => `'${v.replace(/'/g, "''")}'`).join(', ');
            parts.push(`CHECK (${colRef} IN (${vals}))`);
        }
        else {
            parts.push(`CHECK (${col.$check})`);
        }
    }
    if (col.$collate) {
        parts.push(`COLLATE ${col.$collate}`);
    }
    if (col.$references) {
        const ref = col.$references;
        let fkClause = `REFERENCES ${quoteSQLiteIdentifier(ref.table)}(${quoteSQLiteIdentifier(ref.column)})`;
        if (ref.onDelete)
            fkClause += ` ON DELETE ${ref.onDelete}`;
        if (ref.onUpdate)
            fkClause += ` ON UPDATE ${ref.onUpdate}`;
        parts.push(fkClause);
    }
    if (col.$generated) {
        const strategy = col.$generated.stored ? 'STORED' : 'VIRTUAL';
        parts.push(`GENERATED ALWAYS AS (${col.$generated.expression}) ${strategy}`);
    }
    return parts.join(' ');
}
function generateTableConstraints(config) {
    const constraints = [];
    if (config.$primaryKey && config.$primaryKey.length > 0) {
        const cols = config.$primaryKey.map(quoteSQLiteIdentifier).join(', ');
        constraints.push(`PRIMARY KEY (${cols})`);
    }
    if (config.$uniqueConstraints) {
        for (const uc of config.$uniqueConstraints) {
            const cols = uc.columns.map(quoteSQLiteIdentifier).join(', ');
            const name = uc.name ? `CONSTRAINT ${quoteSQLiteIdentifier(uc.name)} ` : '';
            constraints.push(`${name}UNIQUE (${cols})`);
        }
    }
    if (config.$checkConstraints) {
        for (const cc of config.$checkConstraints) {
            const name = cc.name ? `CONSTRAINT ${quoteSQLiteIdentifier(cc.name)} ` : '';
            constraints.push(`${name}CHECK (${cc.expression})`);
        }
    }
    if (config.$foreignKeys) {
        for (const fk of config.$foreignKeys) {
            constraints.push(generateForeignKeyClause(fk));
        }
    }
    return constraints;
}
function generateForeignKeyClause(fk) {
    const localCols = fk.columns.map(quoteSQLiteIdentifier).join(', ');
    const refCols = fk.references.columns.map(quoteSQLiteIdentifier).join(', ');
    let clause = `FOREIGN KEY (${localCols}) REFERENCES ${quoteSQLiteIdentifier(fk.references.table)}(${refCols})`;
    if (fk.onDelete)
        clause += ` ON DELETE ${fk.onDelete}`;
    if (fk.onUpdate)
        clause += ` ON UPDATE ${fk.onUpdate}`;
    if (fk.deferrable) {
        clause += fk.initiallyDeferred
            ? ' DEFERRABLE INITIALLY DEFERRED'
            : ' DEFERRABLE INITIALLY IMMEDIATE';
    }
    return clause;
}
function generateSQLiteCreateTableSQL(config) {
    const parts = [];
    let header = 'CREATE';
    if (config.$temporary)
        header += ' TEMP';
    header += ' TABLE';
    if (config.$ifNotExists)
        header += ' IF NOT EXISTS';
    header += ` ${quoteSQLiteIdentifier(config.$name)}`;
    parts.push(header);
    const columnDefs = [];
    for (const [name, col] of Object.entries(config.$columns)) {
        columnDefs.push(`  ${generateColumnSQL(name, col)}`);
    }
    const constraints = generateTableConstraints(config);
    for (const c of constraints) {
        columnDefs.push(`  ${c}`);
    }
    parts.push(`(\n${columnDefs.join(',\n')}\n)`);
    const modifiers = [];
    if (config.$strict)
        modifiers.push('STRICT');
    if (config.$withoutRowid)
        modifiers.push('WITHOUT ROWID');
    if (modifiers.length > 0) {
        parts.push(modifiers.join(', '));
    }
    return parts.join(' ') + ';';
}
function generateSQLiteIndexSQL(config) {
    if (!config.$indexes || config.$indexes.length === 0)
        return [];
    return config.$indexes.map(idx => generateSingleIndexSQL(config.$name, idx));
}
function generateSingleIndexSQL(tableName, idx) {
    let sql = 'CREATE';
    if (idx.unique)
        sql += ' UNIQUE';
    sql += ' INDEX';
    if (idx.ifNotExists)
        sql += ' IF NOT EXISTS';
    sql += ` ${quoteSQLiteIdentifier(idx.name)}`;
    sql += ` ON ${quoteSQLiteIdentifier(tableName)}`;
    const cols = idx.columns.map(col => {
        if (col.expression) {
            return col.direction ? `${col.expression} ${col.direction}` : col.expression;
        }
        const name = quoteSQLiteIdentifier(col.name);
        return col.direction ? `${name} ${col.direction}` : name;
    });
    sql += ` (${cols.join(', ')})`;
    if (idx.where) {
        sql += ` WHERE ${idx.where}`;
    }
    return sql + ';';
}
