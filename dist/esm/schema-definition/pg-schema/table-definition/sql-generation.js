import format from "../../../utils/pg-format.js";
export function validateTableForDialect(table, dialect, strict) {
    const { validateSchemaForDialect, formatValidationReport } = require('../validate-schema');
    const result = validateSchemaForDialect({ tables: { [table.$name]: table } }, { dialect });
    if (result.errors.length > 0 || result.warnings.length > 0) {
        const report = formatValidationReport(result);
        if (strict && result.errors.length > 0) {
            throw new Error(`Table '${table.$name}' is not compatible with ${dialect}:\n${report}`);
        }
        else if (result.errors.length > 0 || result.warnings.length > 0) {
            console.warn(`[Relq] Dialect validation warnings for table '${table.$name}' (${dialect}):\n${report}`);
        }
    }
}
export { normalizeIndexDef } from "./index-builder.js";
export function generateCreateTableSQL(def) {
    const tableName = def.$schema
        ? `${format.ident(def.$schema)}.${format.ident(def.$name)}`
        : format.ident(def.$name);
    const temporaryClause = def.$temporary ? 'TEMPORARY ' : '';
    const unloggedClause = def.$unlogged ? 'UNLOGGED ' : '';
    const ifNotExistsClause = def.$ifNotExists ? 'IF NOT EXISTS ' : '';
    const parts = [`CREATE ${temporaryClause}${unloggedClause}TABLE ${ifNotExistsClause}${tableName} (`];
    const columnDefs = [];
    const constraints = [];
    for (const [colName, colConfig] of Object.entries(def.$columns)) {
        columnDefs.push(generateColumnSQL(colName, colConfig));
        if (colConfig.$check) {
            constraints.push(`CHECK (${colConfig.$check})`);
        }
    }
    if (def.$primaryKey && def.$primaryKey.length > 0) {
        const pkCols = def.$primaryKey.map(c => format.ident(c)).join(', ');
        constraints.push(`PRIMARY KEY (${pkCols})`);
    }
    if (def.$uniqueConstraints) {
        for (const uc of def.$uniqueConstraints) {
            const cols = uc.columns.map(c => format.ident(c)).join(', ');
            if (uc.name) {
                constraints.push(`CONSTRAINT ${format.ident(uc.name)} UNIQUE (${cols})`);
            }
            else {
                constraints.push(`UNIQUE (${cols})`);
            }
        }
    }
    if (def.$checkConstraints) {
        for (const cc of def.$checkConstraints) {
            if (cc.name) {
                constraints.push(`CONSTRAINT ${format.ident(cc.name)} CHECK (${cc.expression})`);
            }
            else {
                constraints.push(`CHECK (${cc.expression})`);
            }
        }
    }
    if (def.$constraints) {
        for (const c of def.$constraints) {
            const cols = c.$columns.map(col => format.ident(col)).join(', ');
            constraints.push(`CONSTRAINT ${format.ident(c.$name)} ${c.$type} (${cols})`);
        }
    }
    if (def.$foreignKeys) {
        for (const fk of def.$foreignKeys) {
            const cols = fk.columns.map(c => format.ident(c)).join(', ');
            const refCols = fk.references.columns.map(c => format.ident(c)).join(', ');
            let fkDef = `FOREIGN KEY (${cols}) REFERENCES ${format.ident(fk.references.table)} (${refCols})`;
            if (fk.onDelete) {
                fkDef += ` ON DELETE ${fk.onDelete}`;
            }
            if (fk.onUpdate) {
                fkDef += ` ON UPDATE ${fk.onUpdate}`;
            }
            if (fk.notValid) {
                fkDef += ' NOT VALID';
            }
            if (fk.name) {
                constraints.push(`CONSTRAINT ${format.ident(fk.name)} ${fkDef}`);
            }
            else {
                constraints.push(fkDef);
            }
        }
    }
    parts.push([...columnDefs, ...constraints].join(',\n  '));
    parts.push(')');
    if (def.$inherits && def.$inherits.length > 0) {
        parts.push(`INHERITS (${def.$inherits.map(t => format.ident(t)).join(', ')})`);
    }
    if (def.$partitionBy) {
        const col = format.ident(def.$partitionBy.$column);
        parts.push(`PARTITION BY ${def.$partitionBy.$type} (${col})`);
    }
    if (def.$withOptions && Object.keys(def.$withOptions).length > 0) {
        const opts = Object.entries(def.$withOptions)
            .map(([k, v]) => `${k} = ${v}`)
            .join(', ');
        parts.push(`WITH (${opts})`);
    }
    if (def.$tablespace) {
        parts.push(`TABLESPACE ${format.ident(def.$tablespace)}`);
    }
    return parts.join(' ');
}
export function generateColumnSQL(name, config) {
    const actualName = config.$columnName || name;
    const parts = [format.ident(actualName)];
    let typeName = config.$sqlType || (typeof config.$type === 'string' ? config.$type : 'TEXT');
    if (config.$array) {
        const dims = config.$dimensions ?? 1;
        typeName += '[]'.repeat(dims);
    }
    parts.push(typeName);
    if (config.$nullable === false) {
        parts.push('NOT NULL');
    }
    if (config.$primaryKey) {
        parts.push('PRIMARY KEY');
    }
    if (config.$unique) {
        parts.push('UNIQUE');
    }
    if (config.$default !== undefined) {
        const defaultVal = typeof config.$default === 'function'
            ? config.$default()
            : config.$default;
        if (typeof defaultVal === 'object' && defaultVal !== null && '$isDefault' in defaultVal && '$sql' in defaultVal) {
            const sqlValue = defaultVal.$sql;
            if (sqlValue === "'{}'" && config.$array) {
                parts.push(`DEFAULT '{}'::${typeName}`);
            }
            else {
                parts.push(`DEFAULT ${sqlValue}`);
            }
        }
        else if (typeof defaultVal === 'symbol') {
            const symDesc = defaultVal.description || String(defaultVal);
            if (symDesc.includes('emptyObject')) {
                parts.push(`DEFAULT '{}'::jsonb`);
            }
            else if (symDesc.includes('emptyArray')) {
                if (config.$array) {
                    parts.push(`DEFAULT '{}'::${typeName}`);
                }
                else {
                    parts.push(`DEFAULT '[]'::jsonb`);
                }
            }
        }
        else if (Array.isArray(defaultVal)) {
            parts.push(`DEFAULT '${JSON.stringify(defaultVal)}'::jsonb`);
        }
        else if (typeof defaultVal === 'object' && defaultVal !== null) {
            parts.push(`DEFAULT '${JSON.stringify(defaultVal)}'::jsonb`);
        }
        else if (typeof defaultVal === 'string' && (defaultVal.includes('(') ||
            defaultVal.toUpperCase() === 'NOW()' ||
            defaultVal.toUpperCase() === 'CURRENT_TIMESTAMP' ||
            defaultVal.toUpperCase() === 'CURRENT_DATE' ||
            defaultVal.toUpperCase() === 'CURRENT_TIME' ||
            defaultVal.toUpperCase().startsWith('GEN_RANDOM_UUID') ||
            defaultVal.toUpperCase() === 'TRUE' ||
            defaultVal.toUpperCase() === 'FALSE' ||
            defaultVal.toUpperCase() === 'NULL')) {
            parts.push(`DEFAULT ${defaultVal}`);
        }
        else if (typeof defaultVal === 'boolean') {
            parts.push(`DEFAULT ${defaultVal ? 'TRUE' : 'FALSE'}`);
        }
        else if (typeof defaultVal === 'number') {
            parts.push(`DEFAULT ${defaultVal}`);
        }
        else if (defaultVal === null) {
            parts.push('DEFAULT NULL');
        }
        else {
            parts.push(`DEFAULT ${format('%L', String(defaultVal))}`);
        }
    }
    if (config.$references) {
        parts.push(`REFERENCES ${format.ident(config.$references.table)}(${format.ident(config.$references.column)})`);
        if (config.$references.onDelete) {
            parts.push(`ON DELETE ${config.$references.onDelete}`);
        }
        if (config.$references.onUpdate) {
            parts.push(`ON UPDATE ${config.$references.onUpdate}`);
        }
    }
    if (config.$generated) {
        const stored = config.$generated.stored !== false ? 'STORED' : '';
        parts.push(`GENERATED ALWAYS AS (${config.$generated.expression}) ${stored}`.trim());
    }
    return parts.join(' ');
}
export function generateIndexSQL(def) {
    if (!def.$indexes)
        return [];
    const tableName = def.$schema
        ? `${format.ident(def.$schema)}.${format.ident(def.$name)}`
        : format.ident(def.$name);
    return def.$indexes.map(idx => {
        const indexName = idx.name ?? `idx_${def.$name}_${idx.columns.join('_')}`;
        const colExprs = idx.columns.map(c => {
            let expr = format.ident(c);
            if (idx.order) {
                expr += ` ${idx.order.toUpperCase()}`;
            }
            if (idx.nulls) {
                expr += ` NULLS ${idx.nulls.toUpperCase()}`;
            }
            return expr;
        });
        let sql = 'CREATE';
        if (idx.unique) {
            sql += ' UNIQUE';
        }
        sql += ' INDEX';
        if (idx.ifNotExists) {
            sql += ' IF NOT EXISTS';
        }
        sql += ` ${format.ident(indexName)} ON`;
        if (idx.tableOnly) {
            sql += ' ONLY';
        }
        sql += ` ${tableName}`;
        if (idx.using) {
            sql += ` USING ${idx.using}`;
        }
        sql += ` (${colExprs.join(', ')})`;
        if (idx.include && idx.include.length > 0) {
            sql += ` INCLUDE (${idx.include.map(c => format.ident(c)).join(', ')})`;
        }
        if (idx.with) {
            const withParts = [];
            if (idx.with.fillfactor !== undefined) {
                withParts.push(`fillfactor = ${idx.with.fillfactor}`);
            }
            if (idx.with.fastupdate !== undefined) {
                withParts.push(`fastupdate = ${idx.with.fastupdate ? 'on' : 'off'}`);
            }
            if (idx.with.ginPendingListLimit !== undefined) {
                withParts.push(`gin_pending_list_limit = ${idx.with.ginPendingListLimit}`);
            }
            if (idx.with.pagesPerRange !== undefined) {
                withParts.push(`pages_per_range = ${idx.with.pagesPerRange}`);
            }
            if (idx.with.autosummarize !== undefined) {
                withParts.push(`autosummarize = ${idx.with.autosummarize ? 'on' : 'off'}`);
            }
            if (idx.with.buffering !== undefined) {
                withParts.push(`buffering = ${idx.with.buffering}`);
            }
            if (withParts.length > 0) {
                sql += ` WITH (${withParts.join(', ')})`;
            }
        }
        if (idx.tablespace) {
            sql += ` TABLESPACE ${format.ident(idx.tablespace)}`;
        }
        if (idx.where) {
            sql += ` WHERE ${idx.where}`;
        }
        return sql;
    });
}
