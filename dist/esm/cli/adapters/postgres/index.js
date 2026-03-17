import { POSTGRES_FEATURES } from "./features.js";
import { introspectPostgres, introspectTable, listTables, listSchemas } from "./introspect.js";
import { generateCreateTable, generateCreateIndex, generateAlterTable, generateDropTable } from "./sql-generator.js";
import { validateSchema, validateTable, isTypeSupported, getAlternative } from "./validator.js";
import { mapTypeToFriendly, mapTypeToInternal, getTypeScriptType } from "./type-map.js";
export class PostgresAdapter {
    dialect = 'postgres';
    family = 'postgres';
    displayName = 'PostgreSQL';
    features = POSTGRES_FEATURES;
    defaultPort = 5432;
    defaultUser = 'postgres';
    quoteChar = '"';
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
        const pgConfig = connection;
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
            const result = await pool.query('SHOW server_version');
            return result.rows[0]?.server_version || 'unknown';
        }
        finally {
            await pool.end();
        }
    }
    async introspect(connection, options) {
        const pgConfig = connection;
        return introspectPostgres(pgConfig, options);
    }
    async introspectTable(connection, tableName, schema) {
        const pgConfig = connection;
        return introspectTable(pgConfig, tableName, schema);
    }
    async listTables(connection, schema) {
        const pgConfig = connection;
        return listTables(pgConfig, schema);
    }
    async listSchemas(connection) {
        const pgConfig = connection;
        return listSchemas(pgConfig);
    }
    validate(schema) {
        return validateSchema(schema, this.features);
    }
    validateTable(table) {
        return validateTable(table, this.features);
    }
    isTypeSupported(sqlType) {
        return isTypeSupported(sqlType, this.features);
    }
    getAlternative(feature) {
        return getAlternative(feature);
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
        return `"${identifier.replace(/"/g, '""')}"`;
    }
    escapeString(value) {
        return `'${value.replace(/'/g, "''")}'`;
    }
    getParamPlaceholder(index) {
        return `$${index}`;
    }
    getMigrationTableDDL(tableName) {
        return `CREATE TABLE IF NOT EXISTS ${this.quoteIdentifier(tableName)} (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    hash VARCHAR(255) NOT NULL,
    batch INTEGER NOT NULL,
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    execution_time_ms INTEGER,
    metadata JSONB
);`;
    }
    validateSql(_sql, _context) {
        return {
            valid: true,
            issues: [],
            summary: { errors: 0, warnings: 0, info: 0 },
        };
    }
    mapTypeToFriendly(internalType) {
        return mapTypeToFriendly(internalType);
    }
    mapTypeToInternal(friendlyType) {
        return mapTypeToInternal(friendlyType);
    }
    getTypeScriptType(sqlType) {
        return getTypeScriptType(sqlType);
    }
}
export { POSTGRES_FEATURES } from "./features.js";
