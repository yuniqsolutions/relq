import * as fs from 'node:fs';
export function generateMigration(diff, options = {}) {
    const { includeDown = true } = options;
    const up = [];
    const down = [];
    for (const table of diff.tables.filter(t => t.type === 'removed')) {
        up.push(...generateDropTable(table));
        if (includeDown) {
            const columns = (table.columns || [])
                .filter(c => c.before)
                .map(c => c.before);
            if (columns.length > 0) {
                down.unshift(...generateCreateTable({ name: table.name, columns }));
            }
        }
    }
    const deferredFKsByTable = new Map();
    for (const table of diff.tables.filter(t => t.type === 'added')) {
        const columns = (table.columns || [])
            .filter(c => c.after)
            .map(c => c.after);
        const allConstraints = (table.constraints || [])
            .filter(c => c.after)
            .map(c => c.after);
        const inlineConstraints = allConstraints.filter(c => c.type !== 'FOREIGN KEY');
        const fkConstraints = allConstraints.filter(c => c.type === 'FOREIGN KEY');
        const indexes = (table.indexes || [])
            .filter(i => i.after)
            .map(i => i.after);
        if (columns.length > 0) {
            up.push(...generateCreateTable({ name: table.name, columns, constraints: inlineConstraints, indexes }));
        }
        if (fkConstraints.length > 0) {
            const group = deferredFKsByTable.get(table.name) || { up: [], down: [] };
            for (const fk of fkConstraints) {
                group.up.push(`ALTER TABLE "${table.name}" ADD CONSTRAINT "${fk.name}" ${fk.definition};`);
                if (includeDown) {
                    group.down.push(`ALTER TABLE "${table.name}" DROP CONSTRAINT IF EXISTS "${fk.name}";`);
                }
            }
            deferredFKsByTable.set(table.name, group);
        }
        if (includeDown) {
            down.unshift(`DROP TABLE IF EXISTS "${table.name}" CASCADE;`);
        }
    }
    const modifiedTables = diff.tables.filter(t => t.type === 'modified');
    for (const table of modifiedTables) {
        up.push(`-- ==================================================================`);
        up.push(`--  ALTER TABLE: ${table.name}`);
        up.push(`-- ==================================================================`);
        up.push('');
        const { upSQL, downSQL } = generateAlterTable(table, includeDown);
        up.push(...upSQL);
        up.push('');
        up.push('');
        down.unshift(...downSQL);
    }
    if (deferredFKsByTable.size > 0) {
        up.push(`-- ==================================================================`);
        up.push(`--  FOREIGN KEY CONSTRAINTS`);
        up.push(`-- ==================================================================`);
        for (const [tableName, group] of deferredFKsByTable) {
            up.push('');
            up.push(`-- Foreign keys for ${tableName}`);
            up.push(...group.up);
            if (includeDown) {
                down.unshift(...group.down);
            }
        }
        up.push('');
        up.push('');
    }
    up.splice(-2);
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
        if (column.comment) {
            up.push(`COMMENT ON COLUMN "${table}"."${column.name}" IS '${column.comment.replace(/'/g, "''")}';`);
        }
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
    for (const { table, oldIndex, newIndex } of comparison.modified.indexes) {
        up.push(`DROP INDEX IF EXISTS "${oldIndex.name}";`);
        up.push(generateCreateIndexFromParsed(table, newIndex));
        if (includeDown) {
            down.unshift(`DROP INDEX IF EXISTS "${newIndex.name}";`);
            down.unshift(generateCreateIndexFromParsed(table, oldIndex));
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
            case 'length': {
                const newLen = change.to;
                const oldLen = change.from;
                const newFullType = newLen ? `VARCHAR(${newLen})` : 'VARCHAR';
                const oldFullType = oldLen ? `VARCHAR(${oldLen})` : 'VARCHAR';
                upSQL.push(`ALTER TABLE "${tableName}" ALTER COLUMN "${columnName}" TYPE ${newFullType};`);
                downSQL.push(`ALTER TABLE "${tableName}" ALTER COLUMN "${columnName}" TYPE ${oldFullType};`);
                break;
            }
            case 'unique': {
                const constraintName = `${tableName}_${columnName}_key`;
                if (change.to === true) {
                    upSQL.push(`ALTER TABLE "${tableName}" ADD CONSTRAINT "${constraintName}" UNIQUE ("${columnName}");`);
                    downSQL.push(`ALTER TABLE "${tableName}" DROP CONSTRAINT IF EXISTS "${constraintName}";`);
                }
                else {
                    upSQL.push(`ALTER TABLE "${tableName}" DROP CONSTRAINT IF EXISTS "${constraintName}";`);
                    downSQL.push(`ALTER TABLE "${tableName}" ADD CONSTRAINT "${constraintName}" UNIQUE ("${columnName}");`);
                }
                break;
            }
            case 'primaryKey': {
                const pkName = `${tableName}_pkey`;
                if (change.to === true) {
                    upSQL.push(`ALTER TABLE "${tableName}" ADD CONSTRAINT "${pkName}" PRIMARY KEY ("${columnName}");`);
                    downSQL.push(`ALTER TABLE "${tableName}" DROP CONSTRAINT IF EXISTS "${pkName}";`);
                }
                else {
                    upSQL.push(`ALTER TABLE "${tableName}" DROP CONSTRAINT IF EXISTS "${pkName}";`);
                    downSQL.push(`ALTER TABLE "${tableName}" ADD CONSTRAINT "${pkName}" PRIMARY KEY ("${columnName}");`);
                }
                break;
            }
            case 'precision':
            case 'scale': {
                if (change.field === 'precision') {
                    const newPrec = change.to;
                    const scaleChange = changes.find(c => c.field === 'scale');
                    const newScale = scaleChange ? scaleChange.to : undefined;
                    const oldPrec = change.from;
                    const oldScale = scaleChange ? scaleChange.from : undefined;
                    const newFullType = newPrec != null
                        ? (newScale != null ? `NUMERIC(${newPrec}, ${newScale})` : `NUMERIC(${newPrec})`)
                        : 'NUMERIC';
                    const oldFullType = oldPrec != null
                        ? (oldScale != null ? `NUMERIC(${oldPrec}, ${oldScale})` : `NUMERIC(${oldPrec})`)
                        : 'NUMERIC';
                    upSQL.push(`ALTER TABLE "${tableName}" ALTER COLUMN "${columnName}" TYPE ${newFullType};`);
                    downSQL.push(`ALTER TABLE "${tableName}" ALTER COLUMN "${columnName}" TYPE ${oldFullType};`);
                }
                break;
            }
        }
    }
    return { upSQL, downSQL };
}
function generateCreateTableFromParsed(table) {
    const sql = [];
    const columnDefs = [];
    const constraintDefs = [];
    for (const col of table.columns) {
        columnDefs.push(`    ${generateParsedColumnDef(col)}`);
    }
    for (const con of table.constraints) {
        if (con.type === 'FOREIGN KEY')
            continue;
        if (con.type === 'PRIMARY KEY' && con.columns.length === 1 &&
            table.columns.some(c => c.isPrimaryKey && c.name === con.columns[0]))
            continue;
        if (con.type === 'UNIQUE' && con.columns.length === 1 &&
            table.columns.some(c => c.isUnique && c.name === con.columns[0]))
            continue;
        constraintDefs.push(`    CONSTRAINT "${con.name}" ${buildParsedConstraintDef(con)}`);
    }
    const allDefs = [...columnDefs, ...constraintDefs];
    let createSQL = `CREATE TABLE "${table.name}" (\n${allDefs.join(',\n')}\n)`;
    if (table.isPartitioned && table.partitionType && table.partitionKey?.length) {
        createSQL += ` PARTITION BY ${table.partitionType} (${table.partitionKey.join(', ')})`;
    }
    sql.push(createSQL + ';');
    for (const col of table.columns) {
        if (col.comment) {
            sql.push(`COMMENT ON COLUMN "${table.name}"."${col.name}" IS '${col.comment.replace(/'/g, "''")}';`);
        }
    }
    for (const idx of table.indexes) {
        const isPKIndex = table.columns.some(c => c.isPrimaryKey && idx.columns.includes(c.name) && idx.columns.length === 1);
        if (!isPKIndex) {
            sql.push(generateCreateIndexFromParsed(table.name, idx));
        }
    }
    sql.push('');
    sql.push('');
    return sql;
}
function buildParsedConstraintDef(con) {
    const cols = con.columns.map(c => `"${c}"`).join(', ');
    switch (con.type) {
        case 'PRIMARY KEY':
            return `PRIMARY KEY (${cols})`;
        case 'UNIQUE':
            return `UNIQUE (${cols})`;
        case 'CHECK':
            return `CHECK (${con.expression || ''})`;
        case 'FOREIGN KEY': {
            let def = `FOREIGN KEY (${cols})`;
            if (con.references) {
                const refCols = con.references.columns.map(c => `"${c}"`).join(', ');
                def += ` REFERENCES "${con.references.table}" (${refCols})`;
                if (con.references.onDelete)
                    def += ` ON DELETE ${con.references.onDelete}`;
                if (con.references.onUpdate)
                    def += ` ON UPDATE ${con.references.onUpdate}`;
            }
            return def;
        }
        default:
            return con.expression || '';
    }
}
function generateParsedColumnDef(col) {
    let typeName = col.type;
    if (col.typeParams?.length != null) {
        typeName = `${typeName}(${col.typeParams.length})`;
    }
    else if (col.typeParams?.precision != null) {
        typeName = col.typeParams.scale != null
            ? `${typeName}(${col.typeParams.precision}, ${col.typeParams.scale})`
            : `${typeName}(${col.typeParams.precision})`;
    }
    if (col.isArray) {
        typeName = `${typeName}[]`;
    }
    const parts = [`"${col.name}"`, typeName];
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
    sql.push(`-- ==================================================================`);
    sql.push(`--  TABLE: ${table.name}`);
    sql.push(`-- ==================================================================`);
    sql.push('');
    const columnDefs = [];
    const constraintDefs = [];
    const maxNameLen = Math.max(...table.columns.map(c => {
        const quotedName = needsQuote(c.name) ? `"${c.name}"` : c.name;
        return quotedName.length;
    }));
    const padWidth = Math.max(maxNameLen + 4, 28);
    for (const col of table.columns) {
        columnDefs.push(`    ${generateColumnDefinitionAligned(col, padWidth)}`);
    }
    const hasPKColumn = table.columns.some(c => c.isPrimaryKey);
    for (const con of table.constraints || []) {
        if (con.type === 'PRIMARY KEY' && hasPKColumn)
            continue;
        if (con.type === 'UNIQUE') {
            const uniqueMatch = con.definition?.match(/^UNIQUE\s*\("([^"]+)"\)$/);
            if (uniqueMatch && table.columns.some(c => c.isUnique && c.name === uniqueMatch[1]))
                continue;
        }
        constraintDefs.push(`    CONSTRAINT "${con.name}" ${con.definition}`);
    }
    const allDefs = [...columnDefs, ...constraintDefs];
    let createSQL = `CREATE TABLE "${table.name}" (\n${allDefs.join(',\n')}\n)`;
    if (table.isPartitioned && table.partitionType && table.partitionKey?.length) {
        createSQL += ` PARTITION BY ${table.partitionType} (${table.partitionKey.join(', ')})`;
    }
    sql.push(createSQL + ';');
    const indexes = (table.indexes || []).filter(idx => !idx.isPrimary);
    if (indexes.length > 0) {
        sql.push('');
        sql.push(`-- Indexes for ${table.name}`);
        for (const idx of indexes) {
            sql.push(generateCreateIndex(table.name, idx));
        }
    }
    const commentCols = table.columns.filter(c => c.comment);
    if (commentCols.length > 0) {
        sql.push('');
        sql.push(`-- Comments for ${table.name}`);
        for (const col of commentCols) {
            sql.push(`COMMENT ON COLUMN "${table.name}"."${col.name}" IS '${col.comment.replace(/'/g, "''")}';`);
        }
    }
    sql.push('');
    sql.push('');
    return sql;
}
function generateDropTable(table) {
    return [`DROP TABLE IF EXISTS "${table.name}" CASCADE;`];
}
function generateAlterTable(table, includeDown) {
    const columnSQL = [];
    const downSQL = [];
    const tableName = table.name;
    for (const col of table.columns || []) {
        const { up, down } = generateColumnChange(tableName, col);
        columnSQL.push(...up);
        if (includeDown)
            downSQL.unshift(...down);
    }
    const ddlStatements = columnSQL.filter(s => !s.startsWith('COMMENT ON'));
    const commentStatements = columnSQL.filter(s => s.startsWith('COMMENT ON'));
    const upSQL = [...ddlStatements];
    const indexChanges = table.indexes || [];
    if (indexChanges.length > 0) {
        upSQL.push('');
        upSQL.push(`-- Indexes for ${tableName}`);
        for (const idx of indexChanges) {
            const { up, down } = generateIndexChange(tableName, idx);
            upSQL.push(...up);
            if (includeDown)
                downSQL.unshift(...down);
        }
    }
    if (commentStatements.length > 0) {
        upSQL.push('');
        upSQL.push(`-- Comments for ${tableName}`);
        upSQL.push(...commentStatements);
    }
    const constraintChanges = table.constraints || [];
    if (constraintChanges.length > 0) {
        upSQL.push('');
        upSQL.push(`-- Constraints for ${tableName}`);
        for (const con of constraintChanges) {
            const { up, down } = generateConstraintChange(tableName, con);
            upSQL.push(...up);
            if (includeDown)
                downSQL.unshift(...down);
        }
    }
    return { upSQL, downSQL };
}
const PG_RESERVED = new Set([
    'action', 'comment', 'data', 'date', 'domain', 'key', 'language', 'locked',
    'method', 'name', 'order', 'password', 'read', 'schema', 'type', 'valid',
    'value', 'version', 'interval',
]);
function needsQuote(name) {
    return PG_RESERVED.has(name.toLowerCase()) || /[A-Z\s-]/.test(name);
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
function generateColumnDefinitionAligned(col, padWidth) {
    const quotedName = `"${col.name}"`;
    const paddedName = quotedName.padEnd(padWidth);
    const typeParts = [mapDataType(col)];
    if (col.isPrimaryKey) {
        typeParts.push('PRIMARY KEY');
    }
    if (!col.isNullable && !col.isPrimaryKey) {
        typeParts.push('NOT NULL');
    }
    if (col.isUnique && !col.isPrimaryKey) {
        typeParts.push('UNIQUE');
    }
    if (col.defaultValue) {
        typeParts.push(`DEFAULT ${col.defaultValue}`);
    }
    if (col.references) {
        typeParts.push(`REFERENCES "${col.references.table}"("${col.references.column}")`);
    }
    return `${paddedName} ${typeParts.join(' ')}`;
}
function generateColumnChange(tableName, col) {
    const up = [];
    const down = [];
    if (col.type === 'added' && col.after) {
        up.push(`ALTER TABLE "${tableName}" ADD COLUMN ${generateColumnDefinition(col.after)};`);
        if (col.after.comment) {
            up.push(`COMMENT ON COLUMN "${tableName}"."${col.name}" IS '${col.after.comment.replace(/'/g, "''")}';`);
        }
        down.push(`ALTER TABLE "${tableName}" DROP COLUMN IF EXISTS "${col.name}";`);
    }
    if (col.type === 'removed' && col.before) {
        up.push(`ALTER TABLE "${tableName}" DROP COLUMN IF EXISTS "${col.name}";`);
        down.push(`ALTER TABLE "${tableName}" ADD COLUMN ${generateColumnDefinition(col.before)};`);
        if (col.before.comment) {
            down.push(`COMMENT ON COLUMN "${tableName}"."${col.name}" IS '${col.before.comment.replace(/'/g, "''")}';`);
        }
    }
    if (col.type === 'modified' && col.changes && col.changes.length > 0) {
        for (const change of col.changes) {
            switch (change.field) {
                case 'type': {
                    const newType = String(change.to);
                    const oldType = String(change.from);
                    up.push(`ALTER TABLE "${tableName}" ALTER COLUMN "${col.name}" TYPE ${newType} USING "${col.name}"::${newType};`);
                    down.push(`ALTER TABLE "${tableName}" ALTER COLUMN "${col.name}" TYPE ${oldType} USING "${col.name}"::${oldType};`);
                    break;
                }
                case 'nullable': {
                    if (String(change.to) === 'true') {
                        up.push(`ALTER TABLE "${tableName}" ALTER COLUMN "${col.name}" DROP NOT NULL;`);
                        down.push(`ALTER TABLE "${tableName}" ALTER COLUMN "${col.name}" SET NOT NULL;`);
                    }
                    else {
                        up.push(`ALTER TABLE "${tableName}" ALTER COLUMN "${col.name}" SET NOT NULL;`);
                        down.push(`ALTER TABLE "${tableName}" ALTER COLUMN "${col.name}" DROP NOT NULL;`);
                    }
                    break;
                }
                case 'default': {
                    const toVal = change.to != null ? String(change.to) : '';
                    const fromVal = change.from != null ? String(change.from) : '';
                    if (toVal) {
                        up.push(`ALTER TABLE "${tableName}" ALTER COLUMN "${col.name}" SET DEFAULT ${toVal};`);
                    }
                    else {
                        up.push(`ALTER TABLE "${tableName}" ALTER COLUMN "${col.name}" DROP DEFAULT;`);
                    }
                    if (fromVal) {
                        down.push(`ALTER TABLE "${tableName}" ALTER COLUMN "${col.name}" SET DEFAULT ${fromVal};`);
                    }
                    else {
                        down.push(`ALTER TABLE "${tableName}" ALTER COLUMN "${col.name}" DROP DEFAULT;`);
                    }
                    break;
                }
                case 'length': {
                    const colType = col.after?.dataType ?? col.before?.dataType ?? 'VARCHAR';
                    const baseType = colType.toUpperCase().replace(/\(.*\)/, '');
                    const newLen = change.to;
                    const oldLen = change.from;
                    const newFullType = newLen ? `${baseType}(${newLen})` : baseType;
                    const oldFullType = oldLen ? `${baseType}(${oldLen})` : baseType;
                    up.push(`ALTER TABLE "${tableName}" ALTER COLUMN "${col.name}" TYPE ${newFullType};`);
                    down.push(`ALTER TABLE "${tableName}" ALTER COLUMN "${col.name}" TYPE ${oldFullType};`);
                    break;
                }
                case 'unique': {
                    const constraintName = `${tableName}_${col.name}_key`;
                    if (change.to === true) {
                        up.push(`ALTER TABLE "${tableName}" ADD CONSTRAINT "${constraintName}" UNIQUE ("${col.name}");`);
                        down.push(`ALTER TABLE "${tableName}" DROP CONSTRAINT IF EXISTS "${constraintName}";`);
                    }
                    else {
                        up.push(`ALTER TABLE "${tableName}" DROP CONSTRAINT IF EXISTS "${constraintName}";`);
                        down.push(`ALTER TABLE "${tableName}" ADD CONSTRAINT "${constraintName}" UNIQUE ("${col.name}");`);
                    }
                    break;
                }
                case 'primaryKey': {
                    const pkName = `${tableName}_pkey`;
                    if (change.to === true) {
                        up.push(`ALTER TABLE "${tableName}" ADD CONSTRAINT "${pkName}" PRIMARY KEY ("${col.name}");`);
                        down.push(`ALTER TABLE "${tableName}" DROP CONSTRAINT IF EXISTS "${pkName}";`);
                    }
                    else {
                        up.push(`ALTER TABLE "${tableName}" DROP CONSTRAINT IF EXISTS "${pkName}";`);
                        down.push(`ALTER TABLE "${tableName}" ADD CONSTRAINT "${pkName}" PRIMARY KEY ("${col.name}");`);
                    }
                    break;
                }
                case 'comment': {
                    const newComment = change.to != null ? String(change.to) : null;
                    const oldComment = change.from != null ? String(change.from) : null;
                    if (newComment) {
                        up.push(`COMMENT ON COLUMN "${tableName}"."${col.name}" IS '${newComment.replace(/'/g, "''")}';`);
                    }
                    else {
                        up.push(`COMMENT ON COLUMN "${tableName}"."${col.name}" IS NULL;`);
                    }
                    if (oldComment) {
                        down.push(`COMMENT ON COLUMN "${tableName}"."${col.name}" IS '${oldComment.replace(/'/g, "''")}';`);
                    }
                    else {
                        down.push(`COMMENT ON COLUMN "${tableName}"."${col.name}" IS NULL;`);
                    }
                    break;
                }
            }
        }
    }
    return { up, down };
}
function generateCreateIndex(tableName, idx) {
    const unique = idx.isUnique ? 'UNIQUE ' : '';
    const cols = Array.isArray(idx.columns) ? idx.columns : [idx.columns];
    const colList = cols.map(c => `"${c}"`).join(', ');
    const normalizedType = (idx.type || 'btree').toLowerCase();
    const using = normalizedType !== 'btree' ? ` USING ${idx.type}` : '';
    return `CREATE ${unique}INDEX IF NOT EXISTS "${idx.name}" ON "${tableName}"${using} (${colList});`;
}
function generateIndexChange(tableName, idx) {
    const up = [];
    const down = [];
    if (idx.type === 'added' && idx.after) {
        up.push(generateCreateIndex(tableName, idx.after));
        down.push(`DROP INDEX IF EXISTS "${idx.name}";`);
    }
    if (idx.type === 'removed' && idx.before) {
        up.push(`DROP INDEX IF EXISTS "${idx.name}";`);
        down.push(generateCreateIndex(tableName, idx.before));
    }
    return { up, down };
}
function generateConstraintChange(tableName, con) {
    const up = [];
    const down = [];
    if (con.type === 'added' && con.after) {
        up.push(`ALTER TABLE "${tableName}" ADD CONSTRAINT "${con.name}" ${con.after.definition};`);
        down.push(`ALTER TABLE "${tableName}" DROP CONSTRAINT IF EXISTS "${con.name}";`);
    }
    if (con.type === 'removed' && con.before) {
        up.push(`ALTER TABLE "${tableName}" DROP CONSTRAINT IF EXISTS "${con.name}";`);
        down.push(`ALTER TABLE "${tableName}" ADD CONSTRAINT "${con.name}" ${con.before.definition};`);
    }
    return { up, down };
}
function mapDataType(col) {
    let type = (col.dataType ?? col.type ?? '').toUpperCase();
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
    const sanitized = name.replace(/\s+/g, '_').toLowerCase();
    const maxNameLen = 200;
    const truncated = sanitized.length > maxNameLen ? sanitized.slice(0, maxNameLen) : sanitized;
    return `${timestamp}_${truncated}`;
}
export function generateMigrationName(diff) {
    const parts = [];
    const added = diff.tables.filter(t => t.type === 'added');
    const removed = diff.tables.filter(t => t.type === 'removed');
    const modified = diff.tables.filter(t => t.type === 'modified');
    if (added.length === 0 && removed.length === 0 && modified.length === 1) {
        const table = modified[0];
        const cols = table.columns || [];
        if (cols.length === 1) {
            const col = cols[0];
            const verb = col.type === 'added' ? 'add' : col.type === 'removed' ? 'drop' : 'modify';
            return `${verb}_${col.name}_in_${table.name}`;
        }
    }
    for (const t of added.slice(0, 2)) {
        parts.push(`add_${t.name}`);
    }
    for (const t of removed.slice(0, 2)) {
        parts.push(`drop_${t.name}`);
    }
    for (const t of modified.slice(0, 2)) {
        parts.push(`modify_${t.name}`);
    }
    if (parts.length === 0) {
        return 'schema_update';
    }
    const totalTruncated = (added.length + removed.length + modified.length) - parts.length;
    if (totalTruncated > 0) {
        parts.push(`and_${totalTruncated}_more`);
    }
    return parts.join('_');
}
export function generateMigrationNameFromComparison(comparison) {
    const parts = [];
    for (const t of comparison.added.tables.slice(0, 2)) {
        parts.push(`add_${t.name}`);
    }
    for (const t of comparison.removed.tables.slice(0, 2)) {
        parts.push(`drop_${t.name}`);
    }
    for (const r of comparison.renamed.tables.slice(0, 2)) {
        parts.push(`rename_${r.from}_to_${r.to}`);
    }
    for (const e of comparison.added.enums.slice(0, 2)) {
        parts.push(`add_enum_${e.name}`);
    }
    for (const e of comparison.removed.enums.slice(0, 2)) {
        parts.push(`drop_enum_${e.name}`);
    }
    for (const d of comparison.added.domains.slice(0, 1)) {
        parts.push(`add_domain_${d.name}`);
    }
    for (const d of comparison.removed.domains.slice(0, 1)) {
        parts.push(`drop_domain_${d.name}`);
    }
    for (const s of comparison.added.sequences.slice(0, 1)) {
        parts.push(`add_seq_${s.name}`);
    }
    for (const s of comparison.removed.sequences.slice(0, 1)) {
        parts.push(`drop_seq_${s.name}`);
    }
    for (const f of comparison.added.functions.slice(0, 1)) {
        parts.push(`add_fn_${f.name}`);
    }
    for (const f of comparison.removed.functions.slice(0, 1)) {
        parts.push(`drop_fn_${f.name}`);
    }
    for (const v of comparison.added.views.slice(0, 1)) {
        parts.push(`add_view_${v.name}`);
    }
    for (const t of comparison.added.triggers.slice(0, 1)) {
        parts.push(`add_trigger_${t.name}`);
    }
    if (parts.length === 0) {
        const addedCols = comparison.added.columns.slice(0, 2);
        const removedCols = comparison.removed.columns.slice(0, 2);
        for (const c of addedCols) {
            parts.push(`add_${c.column.name}_to_${c.table}`);
        }
        for (const c of removedCols) {
            parts.push(`drop_${c.column.name}_from_${c.table}`);
        }
    }
    if (parts.length === 0 && comparison.modified) {
        const modifiedTables = comparison.modified.tables || [];
        for (const t of modifiedTables.slice(0, 2)) {
            parts.push(`modify_${t.name}`);
        }
    }
    if (parts.length === 0) {
        return 'schema_update';
    }
    const name = parts.join('_');
    return name.length > 120 ? name.slice(0, 120) : name;
}
