export function generateMigration(diff, options = {}) {
    const { includeDown = true } = options;
    const up = [];
    const down = [];
    for (const table of diff.tables.filter(t => t.action === 'remove')) {
        up.push(...generateDropTable(table));
        if (includeDown && table.before) {
            down.unshift(...generateCreateTable(table.before));
        }
    }
    for (const table of diff.tables.filter(t => t.action === 'add')) {
        if (table.after) {
            up.push(...generateCreateTable(table.after));
            if (includeDown) {
                down.unshift(`DROP TABLE IF EXISTS "${table.name}" CASCADE;`);
            }
        }
    }
    for (const table of diff.tables.filter(t => t.action === 'modify')) {
        const { upSQL, downSQL } = generateAlterTable(table, includeDown);
        up.push(...upSQL);
        down.unshift(...downSQL);
    }
    return { up, down };
}
export function generateMigrationFile(diff, name, options = {}) {
    const { message, includeComments = true } = options;
    const { up, down } = generateMigration(diff, options);
    const lines = [];
    lines.push(`-- Migration: ${name}`);
    if (message) {
        lines.push(`-- ${message}`);
    }
    lines.push(`-- Generated: ${new Date().toISOString()}`);
    lines.push('');
    lines.push('-- UP');
    if (up.length === 0) {
        lines.push('-- No changes');
    }
    else {
        if (includeComments) {
            lines.push(`-- ${diff.summary.tablesAdded} tables added, ${diff.summary.tablesRemoved} removed, ${diff.summary.tablesModified} modified`);
        }
        lines.push('');
        lines.push(...up);
    }
    lines.push('');
    lines.push('-- DOWN');
    if (down.length === 0) {
        lines.push('-- No rollback');
    }
    else {
        lines.push('');
        lines.push(...down);
    }
    return {
        name,
        content: lines.join('\n'),
        upSQL: up,
        downSQL: down,
    };
}
function generateCreateTable(table) {
    const sql = [];
    const columnDefs = [];
    const constraintDefs = [];
    for (const col of table.columns) {
        columnDefs.push(`    ${generateColumnDefinition(col)}`);
    }
    const hasPKColumn = table.columns.some(c => c.isPrimaryKey);
    for (const con of table.constraints || []) {
        if (con.type === 'PRIMARY KEY' && hasPKColumn)
            continue;
        constraintDefs.push(`    CONSTRAINT "${con.name}" ${con.definition}`);
    }
    const allDefs = [...columnDefs, ...constraintDefs];
    let createSQL = `CREATE TABLE "${table.name}" (\n${allDefs.join(',\n')}\n)`;
    if (table.isPartitioned && table.partitionType && table.partitionKey?.length) {
        createSQL += ` PARTITION BY ${table.partitionType} (${table.partitionKey.join(', ')})`;
    }
    sql.push(createSQL + ';');
    for (const idx of table.indexes || []) {
        if (idx.isPrimary)
            continue;
        sql.push(generateCreateIndex(table.name, idx));
    }
    return sql;
}
function generateDropTable(table) {
    return [`DROP TABLE IF EXISTS "${table.name}" CASCADE;`];
}
function generateAlterTable(table, includeDown) {
    const upSQL = [];
    const downSQL = [];
    const tableName = table.name;
    for (const col of table.columns || []) {
        const { up, down } = generateColumnChange(tableName, col);
        upSQL.push(...up);
        if (includeDown)
            downSQL.unshift(...down);
    }
    for (const idx of table.indexes || []) {
        const { up, down } = generateIndexChange(tableName, idx);
        upSQL.push(...up);
        if (includeDown)
            downSQL.unshift(...down);
    }
    for (const con of table.constraints || []) {
        const { up, down } = generateConstraintChange(tableName, con);
        upSQL.push(...up);
        if (includeDown)
            downSQL.unshift(...down);
    }
    return { upSQL, downSQL };
}
function generateColumnDefinition(col) {
    const parts = [`"${col.name}"`, mapDataType(col)];
    if (col.isPrimaryKey) {
        parts.push('PRIMARY KEY');
    }
    if (!col.isNullable && !col.isPrimaryKey) {
        parts.push('NOT NULL');
    }
    if (col.isUnique && !col.isPrimaryKey) {
        parts.push('UNIQUE');
    }
    if (col.defaultValue) {
        parts.push(`DEFAULT ${col.defaultValue}`);
    }
    if (col.references) {
        parts.push(`REFERENCES "${col.references.table}"("${col.references.column}")`);
    }
    return parts.join(' ');
}
function generateColumnChange(tableName, col) {
    const up = [];
    const down = [];
    if (col.action === 'add' && col.after) {
        up.push(`ALTER TABLE "${tableName}" ADD COLUMN ${generateColumnDefinition(col.after)};`);
        down.push(`ALTER TABLE "${tableName}" DROP COLUMN IF EXISTS "${col.name}";`);
    }
    if (col.action === 'remove' && col.before) {
        up.push(`ALTER TABLE "${tableName}" DROP COLUMN IF EXISTS "${col.name}";`);
        down.push(`ALTER TABLE "${tableName}" ADD COLUMN ${generateColumnDefinition(col.before)};`);
    }
    if (col.action === 'modify' && col.changesV2 && col.before && col.after) {
        if (col.changesV2.type) {
            const newType = mapDataType(col.after);
            up.push(`ALTER TABLE "${tableName}" ALTER COLUMN "${col.name}" TYPE ${newType} USING "${col.name}"::${newType};`);
            down.push(`ALTER TABLE "${tableName}" ALTER COLUMN "${col.name}" TYPE ${mapDataType(col.before)} USING "${col.name}"::${mapDataType(col.before)};`);
        }
        if (col.changesV2.nullable) {
            if (col.changesV2.nullable.to) {
                up.push(`ALTER TABLE "${tableName}" ALTER COLUMN "${col.name}" DROP NOT NULL;`);
                down.push(`ALTER TABLE "${tableName}" ALTER COLUMN "${col.name}" SET NOT NULL;`);
            }
            else {
                up.push(`ALTER TABLE "${tableName}" ALTER COLUMN "${col.name}" SET NOT NULL;`);
                down.push(`ALTER TABLE "${tableName}" ALTER COLUMN "${col.name}" DROP NOT NULL;`);
            }
        }
        if (col.changesV2.default) {
            if (col.changesV2.default.to) {
                up.push(`ALTER TABLE "${tableName}" ALTER COLUMN "${col.name}" SET DEFAULT ${col.changesV2.default.to};`);
            }
            else {
                up.push(`ALTER TABLE "${tableName}" ALTER COLUMN "${col.name}" DROP DEFAULT;`);
            }
            if (col.changesV2.default.from) {
                down.push(`ALTER TABLE "${tableName}" ALTER COLUMN "${col.name}" SET DEFAULT ${col.changesV2.default.from};`);
            }
            else {
                down.push(`ALTER TABLE "${tableName}" ALTER COLUMN "${col.name}" DROP DEFAULT;`);
            }
        }
    }
    return { up, down };
}
function generateCreateIndex(tableName, idx) {
    const unique = idx.isUnique ? 'UNIQUE ' : '';
    const cols = Array.isArray(idx.columns) ? idx.columns : [idx.columns];
    const colList = cols.map(c => `"${c}"`).join(', ');
    const using = idx.type && idx.type !== 'btree' ? ` USING ${idx.type}` : '';
    return `CREATE ${unique}INDEX IF NOT EXISTS "${idx.name}" ON "${tableName}"${using} (${colList});`;
}
function generateIndexChange(tableName, idx) {
    const up = [];
    const down = [];
    if (idx.action === 'add' && idx.after) {
        up.push(generateCreateIndex(tableName, idx.after));
        down.push(`DROP INDEX IF EXISTS "${idx.name}";`);
    }
    if (idx.action === 'remove' && idx.before) {
        up.push(`DROP INDEX IF EXISTS "${idx.name}";`);
        down.push(generateCreateIndex(tableName, idx.before));
    }
    return { up, down };
}
function generateConstraintChange(tableName, con) {
    const up = [];
    const down = [];
    if (con.action === 'add' && con.after) {
        up.push(`ALTER TABLE "${tableName}" ADD CONSTRAINT "${con.name}" ${con.after.definition};`);
        down.push(`ALTER TABLE "${tableName}" DROP CONSTRAINT IF EXISTS "${con.name}";`);
    }
    if (con.action === 'remove' && con.before) {
        up.push(`ALTER TABLE "${tableName}" DROP CONSTRAINT IF EXISTS "${con.name}";`);
        down.push(`ALTER TABLE "${tableName}" ADD CONSTRAINT "${con.name}" ${con.before.definition};`);
    }
    return { up, down };
}
function mapDataType(col) {
    let type = col.dataType.toUpperCase();
    if ((type === 'VARCHAR' || type === 'CHARACTER VARYING') && col.maxLength) {
        return `VARCHAR(${col.maxLength})`;
    }
    if ((type === 'CHAR' || type === 'CHARACTER' || type === 'BPCHAR') && col.maxLength) {
        return `CHAR(${col.maxLength})`;
    }
    if ((type === 'NUMERIC' || type === 'DECIMAL') && col.precision) {
        if (col.scale) {
            return `NUMERIC(${col.precision}, ${col.scale})`;
        }
        return `NUMERIC(${col.precision})`;
    }
    const typeMap = {
        'INT4': 'INTEGER',
        'INT8': 'BIGINT',
        'INT2': 'SMALLINT',
        'FLOAT4': 'REAL',
        'FLOAT8': 'DOUBLE PRECISION',
        'BOOL': 'BOOLEAN',
        'TIMESTAMPTZ': 'TIMESTAMP WITH TIME ZONE',
        'TIMETZ': 'TIME WITH TIME ZONE',
    };
    return typeMap[type] || type;
}
export function getNextMigrationNumber(migrationsDir) {
    const fs = require('fs');
    if (!fs.existsSync(migrationsDir)) {
        return '001';
    }
    const files = fs.readdirSync(migrationsDir)
        .filter((f) => f.endsWith('.sql'))
        .sort();
    if (files.length === 0) {
        return '001';
    }
    const lastFile = files[files.length - 1];
    const match = lastFile.match(/^(\d+)/);
    if (match) {
        const num = parseInt(match[1]) + 1;
        return num.toString().padStart(3, '0');
    }
    return '001';
}
export function generateTimestampedName(name) {
    const now = new Date();
    const timestamp = now.toISOString()
        .replace(/[-:T]/g, '')
        .slice(0, 14);
    return `${timestamp}_${name.replace(/\s+/g, '_').toLowerCase()}`;
}
