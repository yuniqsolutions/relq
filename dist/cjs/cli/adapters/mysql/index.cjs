"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MYSQL_FEATURES = exports.MySQLAdapter = void 0;
const features_1 = require("./features.cjs");
const introspect_1 = require("./introspect.cjs");
const sql_generator_1 = require("./sql-generator.cjs");
class MySQLAdapter {
    dialect = 'mysql';
    family = 'mysql';
    displayName = 'MySQL';
    features = features_1.MYSQL_FEATURES;
    defaultPort = 3306;
    defaultUser = 'root';
    quoteChar = '`';
    async testConnection(connection) {
        try {
            const mysql2 = await this.loadMySQLDriver();
            const config = this.buildConnectionConfig(connection);
            const conn = await mysql2.createConnection(config);
            await conn.query('SELECT 1');
            await conn.end();
            return true;
        }
        catch (error) {
            return false;
        }
    }
    async getDatabaseVersion(connection) {
        const mysql2 = await this.loadMySQLDriver();
        const config = this.buildConnectionConfig(connection);
        const conn = await mysql2.createConnection(config);
        try {
            const [rows] = await conn.query('SELECT VERSION() as version');
            return rows[0]?.version || 'unknown';
        }
        finally {
            await conn.end();
        }
    }
    async introspect(connection, options) {
        const mysql2 = await this.loadMySQLDriver();
        const mysqlConfig = connection;
        const config = this.buildConnectionConfig(mysqlConfig);
        const conn = await mysql2.createConnection(config);
        try {
            const executeQuery = async (sql, params) => {
                const [rows] = await conn.query(sql, params);
                return rows;
            };
            const databaseName = mysqlConfig.database || config.database || 'mysql';
            return await (0, introspect_1.introspectMySQL)(executeQuery, databaseName, options);
        }
        finally {
            await conn.end();
        }
    }
    async introspectTable(connection, tableName, schema) {
        const dbSchema = await this.introspect(connection);
        return dbSchema.tables.find(t => t.name === tableName) || null;
    }
    async listTables(connection, schema) {
        const mysql2 = await this.loadMySQLDriver();
        const config = this.buildConnectionConfig(connection);
        const conn = await mysql2.createConnection(config);
        try {
            const [rows] = await conn.query(`
                SELECT TABLE_NAME as name
                FROM information_schema.TABLES
                WHERE TABLE_SCHEMA = DATABASE()
                    AND TABLE_TYPE = 'BASE TABLE'
                ORDER BY TABLE_NAME
            `);
            return rows.map((r) => r.name);
        }
        finally {
            await conn.end();
        }
    }
    async listSchemas(connection) {
        const mysql2 = await this.loadMySQLDriver();
        const config = this.buildConnectionConfig(connection);
        const conn = await mysql2.createConnection(config);
        try {
            const [rows] = await conn.query(`
                SELECT SCHEMA_NAME as name
                FROM information_schema.SCHEMATA
                WHERE SCHEMA_NAME NOT IN ('information_schema', 'mysql', 'performance_schema', 'sys')
                ORDER BY SCHEMA_NAME
            `);
            return rows.map((r) => r.name);
        }
        finally {
            await conn.end();
        }
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
                    severity: 'error',
                    category: 'DATA_TYPE',
                    feature: 'array',
                    location: `${table.name}.${column.name}`,
                    message: 'Array types are not supported in MySQL',
                    alternative: 'Use JSON type instead',
                });
            }
            if (type === 'uuid') {
                issues.push({
                    severity: 'warning',
                    category: 'DATA_TYPE',
                    feature: 'uuid',
                    location: `${table.name}.${column.name}`,
                    message: 'UUID type not native in MySQL',
                    alternative: 'Use CHAR(36) or BINARY(16)',
                });
            }
            if (type === 'jsonb') {
                issues.push({
                    severity: 'warning',
                    category: 'DATA_TYPE',
                    feature: 'jsonb',
                    location: `${table.name}.${column.name}`,
                    message: 'JSONB type not available in MySQL',
                    alternative: 'Use JSON type',
                });
            }
        }
        return issues;
    }
    isTypeSupported(sqlType) {
        const type = sqlType.toLowerCase();
        const unsupported = ['jsonb', 'uuid', 'interval', 'tsvector', 'tsquery', 'inet', 'cidr'];
        return !unsupported.some(t => type === t);
    }
    getAlternative(feature) {
        const alternatives = {
            'array': 'Use JSON type',
            'uuid': 'Use CHAR(36) or BINARY(16)',
            'jsonb': 'Use JSON type',
            'interval': 'Use VARCHAR or separate columns',
            'tsvector': 'Use FULLTEXT index',
            'tsquery': 'Use FULLTEXT search',
            'returning': 'Use LAST_INSERT_ID() or separate SELECT',
            'distinct_on': 'Use GROUP BY with ORDER BY',
            'sequences': 'Use AUTO_INCREMENT',
        };
        return alternatives[feature.toLowerCase()];
    }
    generateCreateTable(table, options) {
        return (0, sql_generator_1.generateCreateTable)(table, options);
    }
    generateCreateIndex(index, options) {
        return (0, sql_generator_1.generateCreateIndex)(index, options);
    }
    generateAlterTable(from, to, options) {
        return (0, sql_generator_1.generateAlterTable)(from, to, options);
    }
    generateDropTable(tableName, options) {
        return (0, sql_generator_1.generateDropTable)(tableName, options);
    }
    quoteIdentifier(identifier) {
        return (0, sql_generator_1.quoteIdentifier)(identifier);
    }
    escapeString(value) {
        return (0, sql_generator_1.escapeString)(value);
    }
    mapTypeToFriendly(internalType) {
        const type = internalType.toLowerCase();
        return features_1.MYSQL_TO_POSTGRES_TYPE_MAP[type] || internalType;
    }
    mapTypeToInternal(friendlyType) {
        const type = friendlyType.toLowerCase();
        return features_1.POSTGRES_TO_MYSQL_TYPE_MAP[type] || friendlyType;
    }
    getTypeScriptType(sqlType) {
        const type = sqlType.toLowerCase();
        if (type.includes('int') || type === 'decimal' || type === 'numeric' ||
            type === 'float' || type === 'double' || type === 'real') {
            return 'number';
        }
        if (type === 'boolean' || type === 'tinyint(1)') {
            return 'boolean';
        }
        if (type === 'json') {
            return 'unknown';
        }
        if (type.includes('date') || type.includes('time')) {
            return 'Date';
        }
        if (type === 'blob' || type.includes('binary')) {
            return 'Buffer';
        }
        return 'string';
    }
    getParamPlaceholder(_index) {
        return '?';
    }
    getMigrationTableDDL(tableName) {
        return `CREATE TABLE IF NOT EXISTS ${this.quoteIdentifier(tableName)} (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    hash VARCHAR(255) NOT NULL,
    batch INT NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    execution_time_ms INT,
    metadata JSON
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;
    }
    validateSql(_sql, _context) {
        return {
            valid: true,
            issues: [],
            summary: { errors: 0, warnings: 0, info: 0 },
        };
    }
    async loadMySQLDriver() {
        try {
            const moduleName = 'mysql2/promise';
            const mysql2 = await eval(`import('${moduleName}')`);
            return mysql2;
        }
        catch (error) {
            throw new Error('MySQL driver not found. Install it with:\n' +
                '  npm install mysql2\n' +
                '  # or\n' +
                '  bun add mysql2');
        }
    }
    buildConnectionConfig(config) {
        if (config.url) {
            return { uri: config.url };
        }
        return {
            host: config.host || 'localhost',
            port: config.port || 3306,
            database: config.database,
            user: config.user,
            password: config.password,
            ssl: config.ssl,
        };
    }
}
exports.MySQLAdapter = MySQLAdapter;
var features_2 = require("./features.cjs");
Object.defineProperty(exports, "MYSQL_FEATURES", { enumerable: true, get: function () { return features_2.MYSQL_FEATURES; } });
