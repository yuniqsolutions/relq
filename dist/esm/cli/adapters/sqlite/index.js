import { SQLITE_FEATURES, POSTGRES_TO_SQLITE_TYPE_MAP } from "./features.js";
import { introspectSQLite, listTables, getSQLiteVersion } from "./introspect.js";
import { generateCreateTable, generateCreateIndex, generateAlterTable, generateDropTable, quoteIdentifier, escapeString } from "./sql-generator.js";
export class SQLiteAdapter {
    dialect = 'sqlite';
    family = 'sqlite';
    displayName = 'SQLite';
    features = SQLITE_FEATURES;
    defaultPort = 0;
    defaultUser = '';
    quoteChar = '"';
    async testConnection(connection) {
        try {
            const db = await this.openDatabase(connection);
            db.close();
            return true;
        }
        catch (error) {
            return false;
        }
    }
    async getDatabaseVersion(connection) {
        const db = await this.openDatabase(connection);
        try {
            const executeQuery = async (sql) => {
                return db.prepare(sql).all();
            };
            return await getSQLiteVersion(executeQuery);
        }
        finally {
            db.close();
        }
    }
    async introspect(connection, options) {
        const db = await this.openDatabase(connection);
        try {
            const executeQuery = async (sql, params) => {
                if (params && params.length > 0) {
                    return db.prepare(sql).all(...params);
                }
                return db.prepare(sql).all();
            };
            const config = connection;
            const databaseName = config.filename || ':memory:';
            return await introspectSQLite(executeQuery, databaseName, options);
        }
        finally {
            db.close();
        }
    }
    async introspectTable(connection, tableName, schema) {
        const dbSchema = await this.introspect(connection);
        return dbSchema.tables.find(t => t.name === tableName) || null;
    }
    async listTables(connection, schema) {
        const db = await this.openDatabase(connection);
        try {
            const executeQuery = async (sql) => {
                return db.prepare(sql).all();
            };
            return await listTables(executeQuery);
        }
        finally {
            db.close();
        }
    }
    async listSchemas(connection) {
        return ['main'];
    }
    validate(schema) {
        const issues = [];
        for (const table of schema.tables) {
            issues.push(...this.validateTableInternal(table));
        }
        const errors = issues.filter(i => i.severity === 'error').length;
        const warnings = issues.filter(i => i.severity === 'warning').length;
        const info = issues.filter(i => i.severity === 'info').length;
        return {
            valid: errors === 0,
            issues,
            summary: { errors, warnings, info },
        };
    }
    validateTable(table) {
        const issues = this.validateTableInternal(table);
        const errors = issues.filter(i => i.severity === 'error').length;
        const warnings = issues.filter(i => i.severity === 'warning').length;
        const info = issues.filter(i => i.severity === 'info').length;
        return {
            valid: errors === 0,
            issues,
            summary: { errors, warnings, info },
        };
    }
    validateTableInternal(table) {
        const issues = [];
        for (const column of table.columns) {
            const type = column.type.toLowerCase();
            if (type.includes('[]') || type === 'array') {
                issues.push({
                    severity: 'warning',
                    category: 'DATA_TYPE',
                    feature: 'array',
                    location: `${table.name}.${column.name}`,
                    message: 'Array types not native in SQLite',
                    alternative: 'Use TEXT to store as JSON',
                });
            }
            if (type === 'jsonb') {
                issues.push({
                    severity: 'warning',
                    category: 'DATA_TYPE',
                    feature: 'jsonb',
                    location: `${table.name}.${column.name}`,
                    message: 'JSONB type not available in SQLite',
                    alternative: 'Use TEXT with JSON functions',
                });
            }
            if (type === 'uuid') {
                issues.push({
                    severity: 'info',
                    category: 'DATA_TYPE',
                    feature: 'uuid',
                    location: `${table.name}.${column.name}`,
                    message: 'UUID type not native in SQLite',
                    alternative: 'Use TEXT to store UUIDs',
                });
            }
            if (type.includes('timestamp') && type.includes('tz')) {
                issues.push({
                    severity: 'warning',
                    category: 'DATA_TYPE',
                    feature: 'timestamptz',
                    location: `${table.name}.${column.name}`,
                    message: 'Timezone-aware timestamps not native in SQLite',
                    alternative: 'Store as TEXT in ISO 8601 format',
                });
            }
        }
        return issues;
    }
    isTypeSupported(sqlType) {
        return true;
    }
    getAlternative(feature) {
        const alternatives = {
            'array': 'Use TEXT to store as JSON',
            'jsonb': 'Use TEXT with JSON functions',
            'uuid': 'Use TEXT',
            'timestamptz': 'Use TEXT in ISO 8601 format',
            'sequences': 'Use INTEGER PRIMARY KEY AUTOINCREMENT',
            'schemas': 'Use attached databases',
            'enum': 'Use TEXT with CHECK constraint',
            'materialized_view': 'Use regular table with manual refresh',
        };
        return alternatives[feature.toLowerCase()];
    }
    generateCreateTable(table, options) {
        return generateCreateTable(table, options);
    }
    generateCreateIndex(index, options) {
        return generateCreateIndex(index, options);
    }
    generateAlterTable(from, to, options) {
        return generateAlterTable(from, to, options);
    }
    generateDropTable(tableName, options) {
        return generateDropTable(tableName, options);
    }
    quoteIdentifier(identifier) {
        return quoteIdentifier(identifier);
    }
    escapeString(value) {
        return escapeString(value);
    }
    mapTypeToFriendly(internalType) {
        return internalType;
    }
    mapTypeToInternal(friendlyType) {
        const type = friendlyType.toLowerCase();
        return POSTGRES_TO_SQLITE_TYPE_MAP[type] || friendlyType;
    }
    getTypeScriptType(sqlType) {
        const type = sqlType.toLowerCase();
        if (type === 'integer' || type === 'real' || type === 'numeric') {
            return 'number';
        }
        if (type === 'blob') {
            return 'Buffer';
        }
        return 'string';
    }
    getParamPlaceholder(_index) {
        return '?';
    }
    getMigrationTableDDL(tableName) {
        return `CREATE TABLE IF NOT EXISTS ${this.quoteIdentifier(tableName)} (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    filename TEXT NOT NULL,
    hash TEXT NOT NULL,
    batch INTEGER NOT NULL,
    applied_at TEXT DEFAULT (datetime('now')),
    execution_time_ms INTEGER,
    metadata TEXT
);`;
    }
    validateSql(_sql, _context) {
        return {
            valid: true,
            issues: [],
            summary: { errors: 0, warnings: 0, info: 0 },
        };
    }
    async openDatabase(config) {
        try {
            const moduleName = 'better-sqlite3';
            const Database = (await eval(`import('${moduleName}')`)).default;
            const filename = config.memory ? ':memory:' : (config.filename || ':memory:');
            const db = new Database(filename, {
                readonly: config.readonly,
            });
            if (config.wal) {
                db.pragma('journal_mode = WAL');
            }
            return db;
        }
        catch (error) {
        }
        if (typeof Bun !== 'undefined') {
            try {
                const { Database } = await import('bun:sqlite');
                const filename = config.memory ? ':memory:' : (config.filename || ':memory:');
                return new Database(filename);
            }
            catch (error) {
            }
        }
        throw new Error('SQLite driver not found. Install one of:\n' +
            '  npm install better-sqlite3\n' +
            '  # or run with Bun for native support');
    }
}
export { SQLITE_FEATURES } from "./features.js";
