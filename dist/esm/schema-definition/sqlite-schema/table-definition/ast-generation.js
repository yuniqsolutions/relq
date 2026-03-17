function extractDefaultValue(col) {
    const val = col.$default;
    if (val === undefined || val === null)
        return undefined;
    if (typeof val === 'object' && '$sql' in val && '$isDefault' in val) {
        return val.$sql;
    }
    if (typeof val === 'string')
        return val;
    if (typeof val === 'number' || typeof val === 'bigint')
        return String(val);
    if (typeof val === 'boolean')
        return val ? '1' : '0';
    return undefined;
}
function resolveColumnType(col) {
    const base = col.$sqlType || (typeof col.$type === 'string' ? col.$type : null) || 'TEXT';
    if (col.$length !== undefined) {
        return `${base}(${col.$length})`;
    }
    if (col.$precision !== undefined) {
        return col.$scale !== undefined
            ? `${base}(${col.$precision},${col.$scale})`
            : `${base}(${col.$precision})`;
    }
    return base;
}
function sqliteColumnToAST(col, tsKey) {
    const sqlName = col.$columnName || tsKey;
    return {
        name: sqlName,
        tsName: tsKey,
        type: resolveColumnType(col),
        typeParams: buildTypeParams(col),
        isNullable: col.$nullable !== false && !col.$primaryKey,
        isPrimaryKey: col.$primaryKey === true,
        isUnique: col.$unique === true,
        hasDefault: col.$default !== undefined,
        defaultValue: extractDefaultValue(col),
        isGenerated: col.$generated !== undefined,
        generatedExpression: col.$generated?.expression,
        checkConstraint: col.$check
            ? { name: col.$checkName || '', expression: col.$check }
            : undefined,
        references: col.$references
            ? {
                table: col.$references.table,
                column: col.$references.column,
                onDelete: col.$references.onDelete,
                onUpdate: col.$references.onUpdate,
            }
            : undefined,
        isArray: false,
        comment: col.$comment,
        trackingId: col.$trackingId,
    };
}
function buildTypeParams(col) {
    if (col.$length !== undefined) {
        return { length: col.$length };
    }
    if (col.$precision !== undefined) {
        return {
            precision: col.$precision,
            scale: col.$scale,
        };
    }
    return undefined;
}
function sqliteIndexToAST(idx) {
    const hasExpressions = idx.columns.some(c => !!c.expression);
    return {
        name: idx.name,
        columns: idx.columns.map(c => c.name),
        isUnique: idx.unique === true,
        method: 'BTREE',
        whereClause: idx.where,
        isExpression: hasExpressions,
        expressions: hasExpressions
            ? idx.columns.filter(c => c.expression).map(c => c.expression)
            : undefined,
    };
}
function sqliteForeignKeyToAST(fk, tableName) {
    return {
        name: fk.name || `${tableName}_${fk.columns.join('_')}_fkey`,
        type: 'FOREIGN KEY',
        columns: fk.columns,
        references: {
            table: fk.references.table,
            columns: fk.references.columns,
            onDelete: fk.onDelete,
            onUpdate: fk.onUpdate,
            deferrable: fk.deferrable,
            initiallyDeferred: fk.initiallyDeferred,
        },
    };
}
export function sqliteTableToAST(config) {
    const columns = [];
    const constraints = [];
    for (const [key, colDef] of Object.entries(config.$columns)) {
        const col = colDef;
        columns.push(sqliteColumnToAST(col, key));
        if (col.$check && col.$checkName) {
            constraints.push({
                name: col.$checkName,
                type: 'CHECK',
                columns: [key],
                expression: col.$check,
                trackingId: col.$trackingId || `${config.$name}_${key}_check`,
            });
        }
    }
    const indexes = [];
    if (config.$indexes) {
        for (const idx of config.$indexes) {
            indexes.push(sqliteIndexToAST(idx));
        }
    }
    if (config.$primaryKey && config.$primaryKey.length > 0) {
        constraints.push({
            name: `${config.$name}_pkey`,
            type: 'PRIMARY KEY',
            columns: config.$primaryKey,
            trackingId: `${config.$name}_pkey`,
        });
    }
    if (config.$uniqueConstraints) {
        for (const uc of config.$uniqueConstraints) {
            constraints.push({
                name: uc.name || `${config.$name}_${uc.columns.join('_')}_key`,
                type: 'UNIQUE',
                columns: uc.columns,
                trackingId: uc.name || `${config.$name}_${uc.columns.join('_')}_key`,
            });
        }
    }
    if (config.$checkConstraints) {
        for (const cc of config.$checkConstraints) {
            constraints.push({
                name: cc.name || `${config.$name}_check`,
                type: 'CHECK',
                columns: [],
                expression: cc.expression,
                trackingId: cc.name || `${config.$name}_check`,
            });
        }
    }
    if (config.$foreignKeys) {
        for (const fk of config.$foreignKeys) {
            constraints.push(sqliteForeignKeyToAST(fk, config.$name));
        }
    }
    let comment = config.$comment;
    const meta = [];
    if (config.$strict)
        meta.push('STRICT');
    if (config.$withoutRowid)
        meta.push('WITHOUT ROWID');
    if (config.$temporary)
        meta.push('TEMPORARY');
    if (meta.length > 0) {
        const metaStr = `[sqlite:${meta.join(',')}]`;
        comment = comment ? `${comment} ${metaStr}` : metaStr;
    }
    return {
        name: config.$name,
        schema: 'main',
        columns,
        constraints,
        indexes,
        isPartitioned: false,
        comment,
        trackingId: config.$trackingId,
    };
}
