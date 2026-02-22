"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sqliteTable = sqliteTable;
const sql_generation_1 = require("./sql-generation.cjs");
const ast_generation_1 = require("./ast-generation.cjs");
function sqliteTable(name, columns, options) {
    if (options?.withoutRowid) {
        const hasInlinePK = Object.values(columns).some((col) => col.$primaryKey === true);
        const hasCompositePK = options.primaryKey && options.primaryKey.length > 0;
        if (!hasInlinePK && !hasCompositePK) {
            throw new Error(`[sqliteTable] WITHOUT ROWID table "${name}" must have an explicit PRIMARY KEY.`);
        }
    }
    for (const [colName, colConfig] of Object.entries(columns)) {
        const col = colConfig;
        if (col.$autoincrement) {
            const sqlType = (col.$sqlType || (typeof col.$type === 'string' ? col.$type : '') || '').toUpperCase();
            if (sqlType !== 'INTEGER' || !col.$primaryKey) {
                throw new Error(`[sqliteTable] AUTOINCREMENT on column "${colName}" in table "${name}" ` +
                    `requires INTEGER PRIMARY KEY. Got type "${sqlType}", primaryKey=${col.$primaryKey}.`);
            }
            if (options?.withoutRowid) {
                throw new Error(`[sqliteTable] AUTOINCREMENT on column "${colName}" in table "${name}" ` +
                    `is incompatible with WITHOUT ROWID tables.`);
            }
        }
    }
    const definition = {
        $name: name,
        $columns: columns,
        $primaryKey: options?.primaryKey,
        $uniqueConstraints: options?.uniqueConstraints,
        $checkConstraints: options?.checkConstraints,
        $foreignKeys: options?.foreignKeys,
        $indexes: options?.indexes,
        $strict: options?.strict,
        $withoutRowid: options?.withoutRowid,
        $temporary: options?.temporary,
        $ifNotExists: options?.ifNotExists,
        $trackingId: options?.$trackingId,
        $comment: options?.comment,
        $inferSelect: {},
        $inferInsert: {},
        toSQL() {
            return (0, sql_generation_1.generateSQLiteCreateTableSQL)(this);
        },
        toCreateIndexSQL() {
            return (0, sql_generation_1.generateSQLiteIndexSQL)(this);
        },
        toAST() {
            return (0, ast_generation_1.sqliteTableToAST)(this);
        },
    };
    return definition;
}
