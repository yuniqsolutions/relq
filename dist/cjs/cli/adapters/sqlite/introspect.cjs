"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.introspectSQLite = introspectSQLite;
exports.listTables = listTables;
exports.getSQLiteVersion = getSQLiteVersion;
const features_1 = require("./features.cjs");
async function introspectSQLite(executeQuery, databaseName, options) {
    const schema = {
        database: databaseName,
        tables: [],
        indexes: [],
        constraints: [],
    };
    const tableRows = await executeQuery(`
        SELECT name, type, sql
        FROM sqlite_master
        WHERE type IN ('table', 'view')
            AND name NOT LIKE 'sqlite_%'
        ORDER BY name
    `);
    for (const row of tableRows) {
        if (row.type === 'view' && !options?.includeViews) {
            continue;
        }
        const columnRows = await executeQuery(`PRAGMA table_info('${row.name}')`);
        const columns = columnRows.map((col) => mapColumnInfo(col, row.sql));
        const tableInfo = {
            name: row.name,
            schema: 'main',
            type: row.type === 'view' ? 'view' : 'table',
            columns,
        };
        schema.tables.push(tableInfo);
        const indexListRows = await executeQuery(`PRAGMA index_list('${row.name}')`);
        for (const indexRow of indexListRows) {
            if (indexRow.origin === 'pk' || indexRow.origin === 'u') {
                continue;
            }
            const indexInfoRows = await executeQuery(`PRAGMA index_info('${indexRow.name}')`);
            const indexColumns = indexInfoRows.map((col) => ({
                name: col.name,
                direction: 'ASC',
                nulls: 'LAST',
            }));
            schema.indexes.push({
                name: indexRow.name,
                tableName: row.name,
                schema: 'main',
                columns: indexColumns,
                isUnique: indexRow.unique === 1,
                isPrimary: false,
                type: 'btree',
            });
        }
        const fkRows = await executeQuery(`PRAGMA foreign_key_list('${row.name}')`);
        const fkMap = new Map();
        for (const fk of fkRows) {
            if (!fkMap.has(fk.id)) {
                fkMap.set(fk.id, {
                    name: `fk_${row.name}_${fk.id}`,
                    tableName: row.name,
                    schema: 'main',
                    type: 'FOREIGN KEY',
                    columns: [],
                    referencedTable: fk.table,
                    referencedColumns: [],
                    onDelete: mapReferentialAction(fk.on_delete),
                    onUpdate: mapReferentialAction(fk.on_update),
                });
            }
            const constraint = fkMap.get(fk.id);
            constraint.columns.push(fk.from);
            constraint.referencedColumns.push(fk.to);
        }
        schema.constraints.push(...fkMap.values());
    }
    if (options?.includeTriggers) {
        const triggerRows = await executeQuery(`
            SELECT name, tbl_name, sql
            FROM sqlite_master
            WHERE type = 'trigger'
            ORDER BY name
        `);
        schema.triggers = triggerRows.map((t) => parseTrigger(t));
    }
    return schema;
}
function mapColumnInfo(row, tableSql) {
    const isAutoIncrement = row.pk === 1 &&
        row.type.toLowerCase() === 'integer' &&
        tableSql?.toLowerCase().includes('autoincrement');
    const isGenerated = tableSql?.toLowerCase().includes(`${row.name.toLowerCase()} generated`) ||
        tableSql?.toLowerCase().includes(`${row.name.toLowerCase()} as (`);
    return {
        name: row.name,
        type: row.type || 'TEXT',
        baseType: getTypeAffinity(row.type),
        nullable: row.notnull === 0 && row.pk === 0,
        defaultValue: row.dflt_value || undefined,
        defaultIsExpression: row.dflt_value?.includes('(') || false,
        isPrimaryKey: row.pk > 0,
        isAutoIncrement,
        isGenerated,
        ordinalPosition: row.cid + 1,
    };
}
function getTypeAffinity(type) {
    if (!type)
        return 'BLOB';
    const lowerType = type.toLowerCase();
    if (features_1.SQLITE_TYPE_AFFINITY[lowerType]) {
        return features_1.SQLITE_TYPE_AFFINITY[lowerType];
    }
    if (lowerType.includes('int'))
        return 'INTEGER';
    if (lowerType.includes('char') || lowerType.includes('clob') || lowerType.includes('text'))
        return 'TEXT';
    if (lowerType.includes('blob') || lowerType === '')
        return 'BLOB';
    if (lowerType.includes('real') || lowerType.includes('floa') || lowerType.includes('doub'))
        return 'REAL';
    return 'NUMERIC';
}
function mapReferentialAction(action) {
    const mapping = {
        'CASCADE': 'CASCADE',
        'SET NULL': 'SET NULL',
        'SET DEFAULT': 'SET DEFAULT',
        'RESTRICT': 'RESTRICT',
        'NO ACTION': 'NO ACTION',
    };
    return mapping[action];
}
function parseTrigger(row) {
    const sql = row.sql.toUpperCase();
    let timing = 'AFTER';
    if (sql.includes('BEFORE'))
        timing = 'BEFORE';
    else if (sql.includes('INSTEAD OF'))
        timing = 'INSTEAD OF';
    const events = [];
    if (sql.includes('INSERT'))
        events.push('INSERT');
    if (sql.includes('UPDATE'))
        events.push('UPDATE');
    if (sql.includes('DELETE'))
        events.push('DELETE');
    const forEach = sql.includes('FOR EACH ROW') ? 'ROW' : 'STATEMENT';
    return {
        name: row.name,
        tableName: row.tbl_name,
        schema: 'main',
        timing,
        events: events.length > 0 ? events : ['INSERT'],
        forEach,
        functionName: row.name,
    };
}
async function listTables(executeQuery) {
    const rows = await executeQuery(`
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
            AND name NOT LIKE 'sqlite_%'
        ORDER BY name
    `);
    return rows.map((r) => r.name);
}
async function getSQLiteVersion(executeQuery) {
    const rows = await executeQuery('SELECT sqlite_version() as version');
    return rows[0]?.version || 'unknown';
}
