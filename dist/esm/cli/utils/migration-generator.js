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
export function generateMigrationFromComparison(comparison, options = {}) {
    const { includeDown = true } = options;
    const up = [];
    const down = [];
    for (const rename of comparison.renamed.enums) {
        up.push(`ALTER TYPE "${rename.from}" RENAME TO "${rename.to}";`);
        if (includeDown) {
            down.unshift(`ALTER TYPE "${rename.to}" RENAME TO "${rename.from}";`);
        }
    }
    for (const rename of comparison.renamed.sequences) {
        up.push(`ALTER SEQUENCE "${rename.from}" RENAME TO "${rename.to}";`);
        if (includeDown) {
            down.unshift(`ALTER SEQUENCE "${rename.to}" RENAME TO "${rename.from}";`);
        }
    }
    for (const rename of comparison.renamed.tables) {
        up.push(`ALTER TABLE "${rename.from}" RENAME TO "${rename.to}";`);
        if (includeDown) {
            down.unshift(`ALTER TABLE "${rename.to}" RENAME TO "${rename.from}";`);
        }
    }
    for (const rename of comparison.renamed.columns) {
        up.push(`ALTER TABLE "${rename.table}" RENAME COLUMN "${rename.from}" TO "${rename.to}";`);
        if (includeDown) {
            down.unshift(`ALTER TABLE "${rename.table}" RENAME COLUMN "${rename.to}" TO "${rename.from}";`);
        }
    }
    for (const rename of comparison.renamed.indexes) {
        up.push(`ALTER INDEX "${rename.from}" RENAME TO "${rename.to}";`);
        if (includeDown) {
            down.unshift(`ALTER INDEX "${rename.to}" RENAME TO "${rename.from}";`);
        }
    }
    for (const rename of comparison.renamed.functions) {
        up.push(`ALTER FUNCTION "${rename.from}" RENAME TO "${rename.to}";`);
        if (includeDown) {
            down.unshift(`ALTER FUNCTION "${rename.to}" RENAME TO "${rename.from}";`);
        }
    }
    for (const enumMod of comparison.modified.enums) {
        for (const value of enumMod.changes.added) {
            up.push(`ALTER TYPE "${enumMod.name}" ADD VALUE IF NOT EXISTS '${value}';`);
        }
        if (enumMod.changes.removed.length > 0 && includeDown) {
            down.unshift(`-- Warning: Cannot remove enum values in PostgreSQL: ${enumMod.changes.removed.join(', ')}`);
        }
    }
    for (const colMod of comparison.modified.columns) {
        const { upSQL, downSQL } = generateColumnModification(colMod.table, colMod.column, colMod.changes);
        up.push(...upSQL);
        if (includeDown)
            down.unshift(...downSQL);
    }
    for (const ext of comparison.added.extensions) {
        up.push(`CREATE EXTENSION IF NOT EXISTS "${ext}";`);
        if (includeDown) {
            down.unshift(`DROP EXTENSION IF EXISTS "${ext}";`);
        }
    }
    for (const enumDef of comparison.added.enums) {
        const values = enumDef.values.map(v => `'${v}'`).join(', ');
        up.push(`CREATE TYPE "${enumDef.name}" AS ENUM (${values});`);
        if (includeDown) {
            down.unshift(`DROP TYPE IF EXISTS "${enumDef.name}";`);
        }
    }
    for (const domain of comparison.added.domains) {
        let domainSQL = `CREATE DOMAIN "${domain.name}" AS ${domain.baseType}`;
        if (domain.notNull)
            domainSQL += ' NOT NULL';
        if (domain.defaultValue)
            domainSQL += ` DEFAULT ${domain.defaultValue}`;
        if (domain.checkExpression) {
            const checkName = domain.checkName ? `CONSTRAINT "${domain.checkName}" ` : '';
            domainSQL += ` ${checkName}CHECK (${domain.checkExpression})`;
        }
        up.push(domainSQL + ';');
        if (includeDown) {
            down.unshift(`DROP DOMAIN IF EXISTS "${domain.name}";`);
        }
    }
    for (const seq of comparison.added.sequences) {
        const parts = [`CREATE SEQUENCE "${seq.name}"`];
        if (seq.startValue !== undefined)
            parts.push(`START WITH ${seq.startValue}`);
        if (seq.increment !== undefined)
            parts.push(`INCREMENT BY ${seq.increment}`);
        if (seq.minValue !== undefined)
            parts.push(`MINVALUE ${seq.minValue}`);
        if (seq.maxValue !== undefined)
            parts.push(`MAXVALUE ${seq.maxValue}`);
        if (seq.cache !== undefined)
            parts.push(`CACHE ${seq.cache}`);
        if (seq.cycle)
            parts.push('CYCLE');
        up.push(parts.join(' ') + ';');
        if (includeDown) {
            down.unshift(`DROP SEQUENCE IF EXISTS "${seq.name}";`);
        }
    }
    for (const table of comparison.added.tables) {
        up.push(...generateCreateTableFromParsed(table));
        if (includeDown) {
            down.unshift(`DROP TABLE IF EXISTS "${table.name}" CASCADE;`);
        }
    }
    for (const { table, column } of comparison.added.columns) {
        up.push(`ALTER TABLE "${table}" ADD COLUMN ${generateParsedColumnDef(column)};`);
        if (includeDown) {
            down.unshift(`ALTER TABLE "${table}" DROP COLUMN IF EXISTS "${column.name}";`);
        }
    }
    for (const { table, index } of comparison.added.indexes) {
        up.push(generateCreateIndexFromParsed(table, index));
        if (includeDown) {
            down.unshift(`DROP INDEX IF EXISTS "${index.name}";`);
        }
    }
    for (const view of comparison.added.views) {
        const materialized = view.isMaterialized ? 'MATERIALIZED ' : '';
        up.push(`CREATE ${materialized}VIEW "${view.name}" AS ${view.definition};`);
        if (includeDown) {
            down.unshift(`DROP ${materialized}VIEW IF EXISTS "${view.name}";`);
        }
    }
    for (const func of comparison.added.functions) {
        const argsStr = func.args.map(a => `${a.name || ''} ${a.type}`.trim()).join(', ');
        const volatility = func.volatility || 'VOLATILE';
        up.push(`CREATE OR REPLACE FUNCTION "${func.name}"(${argsStr}) RETURNS ${func.returnType} LANGUAGE ${func.language} ${volatility} AS $$ ${func.body} $$;`);
        if (includeDown) {
            down.unshift(`DROP FUNCTION IF EXISTS "${func.name}"(${func.args.map(a => a.type).join(', ')});`);
        }
    }
    for (const trigger of comparison.added.triggers) {
        const events = trigger.events.join(' OR ');
        const forEach = trigger.forEach || 'ROW';
        up.push(`CREATE TRIGGER "${trigger.name}" ${trigger.timing} ${events} ON "${trigger.table}" FOR EACH ${forEach} EXECUTE FUNCTION ${trigger.functionName}();`);
        if (includeDown) {
            down.unshift(`DROP TRIGGER IF EXISTS "${trigger.name}" ON "${trigger.table}";`);
        }
    }
    for (const trigger of comparison.removed.triggers) {
        up.push(`DROP TRIGGER IF EXISTS "${trigger.name}" ON "${trigger.table}";`);
        if (includeDown) {
            const events = trigger.events.join(' OR ');
            const forEach = trigger.forEach || 'ROW';
            down.unshift(`CREATE TRIGGER "${trigger.name}" ${trigger.timing} ${events} ON "${trigger.table}" FOR EACH ${forEach} EXECUTE FUNCTION ${trigger.functionName}();`);
        }
    }
    for (const func of comparison.removed.functions) {
        const argTypes = func.args.map(a => a.type).join(', ');
        up.push(`DROP FUNCTION IF EXISTS "${func.name}"(${argTypes});`);
        if (includeDown) {
            const argsStr = func.args.map(a => `${a.name || ''} ${a.type}`.trim()).join(', ');
            const volatility = func.volatility || 'VOLATILE';
            down.unshift(`CREATE OR REPLACE FUNCTION "${func.name}"(${argsStr}) RETURNS ${func.returnType} LANGUAGE ${func.language} ${volatility} AS $$ ${func.body} $$;`);
        }
    }
    for (const view of comparison.removed.views) {
        const materialized = view.isMaterialized ? 'MATERIALIZED ' : '';
        up.push(`DROP ${materialized}VIEW IF EXISTS "${view.name}";`);
        if (includeDown) {
            down.unshift(`CREATE ${materialized}VIEW "${view.name}" AS ${view.definition};`);
        }
    }
    for (const { index } of comparison.removed.indexes) {
        up.push(`DROP INDEX IF EXISTS "${index.name}";`);
    }
    for (const { table, column } of comparison.removed.columns) {
        up.push(`ALTER TABLE "${table}" DROP COLUMN IF EXISTS "${column.name}";`);
        if (includeDown) {
            down.unshift(`ALTER TABLE "${table}" ADD COLUMN ${generateParsedColumnDef(column)};`);
        }
    }
    for (const table of comparison.removed.tables) {
        up.push(`DROP TABLE IF EXISTS "${table.name}" CASCADE;`);
        if (includeDown) {
            down.unshift(...generateCreateTableFromParsed(table));
        }
    }
    for (const seq of comparison.removed.sequences) {
        up.push(`DROP SEQUENCE IF EXISTS "${seq.name}";`);
        if (includeDown) {
            const parts = [`CREATE SEQUENCE "${seq.name}"`];
            if (seq.startValue !== undefined)
                parts.push(`START WITH ${seq.startValue}`);
            if (seq.increment !== undefined)
                parts.push(`INCREMENT BY ${seq.increment}`);
            if (seq.minValue !== undefined)
                parts.push(`MINVALUE ${seq.minValue}`);
            if (seq.maxValue !== undefined)
                parts.push(`MAXVALUE ${seq.maxValue}`);
            if (seq.cache !== undefined)
                parts.push(`CACHE ${seq.cache}`);
            if (seq.cycle)
                parts.push('CYCLE');
            down.unshift(parts.join(' ') + ';');
        }
    }
    for (const domain of comparison.removed.domains) {
        up.push(`DROP DOMAIN IF EXISTS "${domain.name}";`);
        if (includeDown) {
            let domainSQL = `CREATE DOMAIN "${domain.name}" AS ${domain.baseType}`;
            if (domain.notNull)
                domainSQL += ' NOT NULL';
            if (domain.defaultValue)
                domainSQL += ` DEFAULT ${domain.defaultValue}`;
            if (domain.checkExpression) {
                const checkName = domain.checkName ? `CONSTRAINT "${domain.checkName}" ` : '';
                domainSQL += ` ${checkName}CHECK (${domain.checkExpression})`;
            }
            down.unshift(domainSQL + ';');
        }
    }
    for (const enumDef of comparison.removed.enums) {
        up.push(`DROP TYPE IF EXISTS "${enumDef.name}";`);
        if (includeDown) {
            const values = enumDef.values.map(v => `'${v}'`).join(', ');
            down.unshift(`CREATE TYPE "${enumDef.name}" AS ENUM (${values});`);
        }
    }
    for (const ext of comparison.removed.extensions) {
        up.push(`DROP EXTENSION IF EXISTS "${ext}";`);
        if (includeDown) {
            down.unshift(`CREATE EXTENSION IF NOT EXISTS "${ext}";`);
        }
    }
    return { up, down };
}
function generateColumnModification(tableName, columnName, changes) {
    const upSQL = [];
    const downSQL = [];
    for (const change of changes) {
        switch (change.field) {
            case 'type':
                upSQL.push(`ALTER TABLE "${tableName}" ALTER COLUMN "${columnName}" TYPE ${change.to} USING "${columnName}"::${change.to};`);
                downSQL.push(`ALTER TABLE "${tableName}" ALTER COLUMN "${columnName}" TYPE ${change.from} USING "${columnName}"::${change.from};`);
                break;
            case 'nullable':
                if (change.to) {
                    upSQL.push(`ALTER TABLE "${tableName}" ALTER COLUMN "${columnName}" DROP NOT NULL;`);
                    downSQL.push(`ALTER TABLE "${tableName}" ALTER COLUMN "${columnName}" SET NOT NULL;`);
                }
                else {
                    upSQL.push(`ALTER TABLE "${tableName}" ALTER COLUMN "${columnName}" SET NOT NULL;`);
                    downSQL.push(`ALTER TABLE "${tableName}" ALTER COLUMN "${columnName}" DROP NOT NULL;`);
                }
                break;
            case 'default':
                if (change.to !== undefined && change.to !== null) {
                    upSQL.push(`ALTER TABLE "${tableName}" ALTER COLUMN "${columnName}" SET DEFAULT ${change.to};`);
                }
                else {
                    upSQL.push(`ALTER TABLE "${tableName}" ALTER COLUMN "${columnName}" DROP DEFAULT;`);
                }
                if (change.from !== undefined && change.from !== null) {
                    downSQL.push(`ALTER TABLE "${tableName}" ALTER COLUMN "${columnName}" SET DEFAULT ${change.from};`);
                }
                else {
                    downSQL.push(`ALTER TABLE "${tableName}" ALTER COLUMN "${columnName}" DROP DEFAULT;`);
                }
                break;
        }
    }
    return { upSQL, downSQL };
}
function generateCreateTableFromParsed(table) {
    const sql = [];
    const columnDefs = [];
    for (const col of table.columns) {
        columnDefs.push(`    ${generateParsedColumnDef(col)}`);
    }
    let createSQL = `CREATE TABLE "${table.name}" (\n${columnDefs.join(',\n')}\n)`;
    if (table.isPartitioned && table.partitionType && table.partitionKey?.length) {
        createSQL += ` PARTITION BY ${table.partitionType} (${table.partitionKey.join(', ')})`;
    }
    sql.push(createSQL + ';');
    for (const idx of table.indexes) {
        const isPKIndex = table.columns.some(c => c.isPrimaryKey && idx.columns.includes(c.name) && idx.columns.length === 1);
        if (!isPKIndex) {
            sql.push(generateCreateIndexFromParsed(table.name, idx));
        }
    }
    return sql;
}
function generateParsedColumnDef(col) {
    const parts = [`"${col.name}"`, col.type];
    if (col.isPrimaryKey) {
        parts.push('PRIMARY KEY');
    }
    if (!col.isNullable && !col.isPrimaryKey) {
        parts.push('NOT NULL');
    }
    if (col.isUnique && !col.isPrimaryKey) {
        parts.push('UNIQUE');
    }
    if (col.defaultValue !== undefined) {
        parts.push(`DEFAULT ${col.defaultValue}`);
    }
    if (col.references) {
        parts.push(`REFERENCES "${col.references.table}"("${col.references.column}")`);
        if (col.references.onDelete) {
            parts.push(`ON DELETE ${col.references.onDelete}`);
        }
        if (col.references.onUpdate) {
            parts.push(`ON UPDATE ${col.references.onUpdate}`);
        }
    }
    return parts.join(' ');
}
function generateCreateIndexFromParsed(tableName, idx) {
    const unique = idx.isUnique ? 'UNIQUE ' : '';
    const colList = idx.columns.map(c => `"${c}"`).join(', ');
    const using = idx.method && idx.method !== 'btree' ? ` USING ${idx.method}` : '';
    const where = idx.whereClause ? ` WHERE ${idx.whereClause}` : '';
    return `CREATE ${unique}INDEX IF NOT EXISTS "${idx.name}" ON "${tableName}"${using} (${colList})${where};`;
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
