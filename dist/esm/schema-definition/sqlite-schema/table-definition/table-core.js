import { generateSQLiteCreateTableSQL, generateSQLiteIndexSQL } from "./sql-generation.js";
import { sqliteTableToAST } from "./ast-generation.js";
export function sqliteTable(name, columns, options) {
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
            return generateSQLiteCreateTableSQL(this);
        },
        toCreateIndexSQL() {
            return generateSQLiteIndexSQL(this);
        },
        toAST() {
            return sqliteTableToAST(this);
        },
    };
    return definition;
}
