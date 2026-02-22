import { DSQL_FEATURES, DSQL_TRANSACTION_LIMITS } from "./features.js";
import { validateSchemaForDsql, validateSqlForDsql, validateTableForDsql, getAlternative, getAlternativeType, isTypeSupported, } from "./validator.js";
import { introspectDsql, introspectTable as introspectDsqlTable, listTables as listDsqlTables, listSchemas as listDsqlSchemas, } from "./introspect.js";
import { generateCreateTable as generateDsqlCreateTable, generateCreateIndex as generateDsqlCreateIndex, generateAlterTable as generateDsqlAlterTable, generateDropTable as generateDsqlDropTable, quoteIdentifier as dsqlQuoteIdentifier, escapeString as dsqlEscapeString, } from "./sql-generator.js";
import { mapTypeToFriendly as dsqlMapTypeToFriendly, mapTypeToInternal as dsqlMapTypeToInternal, getTypeScriptType as dsqlGetTypeScriptType, } from "./type-map.js";
export class DsqlAdapter {
    dialect = 'dsql';
    family = 'postgres';
    displayName = 'AWS Aurora DSQL';
    features = DSQL_FEATURES;
    defaultPort = 5432;
    defaultUser = 'admin';
    quoteChar = '"';
    getTransactionLimits() {
        return DSQL_TRANSACTION_LIMITS;
    }
    async testConnection(connection) {
        const pgConfig = connection;
        try {
            const { Pool } = await import('pg');
            const { buildPoolConfig } = await import("../../../config/config.js");
            const poolConfig = await buildPoolConfig({
                url: pgConfig.url,
                host: pgConfig.host,
                port: pgConfig.port,
                database: pgConfig.database,
                user: pgConfig.user,
                password: pgConfig.password,
                ssl: pgConfig.ssl,
                aws: pgConfig.aws,
            });
            const pool = new Pool({ ...poolConfig, max: 1 });
            try {
                const client = await pool.connect();
                await client.query('SELECT 1');
                client.release();
                return true;
            }
            finally {
                await pool.end();
            }
        }
        catch (error) {
            return false;
        }
    }
    async getDatabaseVersion(connection) {
        const { Pool } = await import('pg');
        const { buildPoolConfig } = await import("../../../config/config.js");
        const config = connection;
        const poolConfig = await buildPoolConfig({
            url: config.url,
            host: config.host,
            port: config.port,
            database: config.database,
            user: config.user,
            password: config.password,
            ssl: config.ssl,
            aws: config.aws,
        });
        const pool = new Pool({ ...poolConfig, max: 1 });
        try {
            const result = await pool.query('SHOW server_version');
            const version = result.rows[0]?.server_version || 'unknown';
            return `Aurora DSQL (PostgreSQL ${version})`;
        }
        finally {
            await pool.end();
        }
    }
    async introspect(connection, options) {
        const pgConfig = connection;
        return introspectDsql(pgConfig, options);
    }
    async introspectTable(connection, tableName, schema) {
        const pgConfig = connection;
        return introspectDsqlTable(pgConfig, tableName, schema);
    }
    async listTables(connection, schema) {
        const pgConfig = connection;
        return listDsqlTables(pgConfig, schema);
    }
    async listSchemas(connection) {
        const pgConfig = connection;
        return listDsqlSchemas(pgConfig);
    }
    validate(schema) {
        return validateSchemaForDsql(schema);
    }
    validateTable(table) {
        const issues = validateTableForDsql(table);
        const errors = issues.filter(i => i.severity === 'error').length;
        const warnings = issues.filter(i => i.severity === 'warning').length;
        const info = issues.filter(i => i.severity === 'info').length;
        return {
            valid: errors === 0,
            issues,
            summary: { errors, warnings, info },
        };
    }
    validateSql(sql, _context) {
        return validateSqlForDsql(sql);
    }
    isTypeSupported(type) {
        return isTypeSupported(type);
    }
    getAlternative(feature) {
        return getAlternative(feature);
    }
    getAlternativeType(type) {
        return getAlternativeType(type);
    }
    generateCreateTable(table, options) {
        return generateDsqlCreateTable(table, options);
    }
    generateCreateIndex(index, options) {
        return generateDsqlCreateIndex(index, options);
    }
    generateAlterTable(from, to, options) {
        return generateDsqlAlterTable(from, to, options);
    }
    generateDropTable(tableName, options) {
        return generateDsqlDropTable(tableName, options);
    }
    quoteIdentifier(identifier) {
        return dsqlQuoteIdentifier(identifier);
    }
    escapeString(value) {
        return dsqlEscapeString(value);
    }
    getParamPlaceholder(index) {
        return `$${index}`;
    }
    getMigrationTableDDL(tableName) {
        return `CREATE TABLE IF NOT EXISTS ${this.quoteIdentifier(tableName)} (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    hash VARCHAR(255) NOT NULL,
    batch INTEGER NOT NULL,
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    execution_time_ms INTEGER,
    metadata TEXT,
    sql_up TEXT,
    sql_down TEXT,
    source TEXT DEFAULT 'push'
);`;
    }
    mapTypeToFriendly(internalType) {
        return dsqlMapTypeToFriendly(internalType);
    }
    mapTypeToInternal(friendlyType) {
        return dsqlMapTypeToInternal(friendlyType);
    }
    getTypeScriptType(sqlType) {
        return dsqlGetTypeScriptType(sqlType);
    }
}
export { DSQL_FEATURES, DSQL_TRANSACTION_LIMITS } from "./features.js";
