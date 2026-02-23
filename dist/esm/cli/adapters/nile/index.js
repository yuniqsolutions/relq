import { NILE_FEATURES } from "./features.js";
import { validateSchemaForNile, validateSqlForNile, getAlternative, isTypeSupported } from "./validator.js";
import { introspectNile, introspectTable, listTables, listSchemas } from "./introspect.js";
import { generateCreateTable, generateCreateIndex, generateAlterTable, generateDropTable } from "./sql-generator.js";
import { mapTypeToFriendly, mapTypeToInternal, getTypeScriptType } from "./type-map.js";
import { generateSetTenantSql, generateClearTenantSql, generateGetTenantSql, isValidUuid, } from "./tenant-context.js";
export class NileAdapter {
    dialect = 'nile';
    family = 'postgres';
    displayName = 'Nile';
    features = NILE_FEATURES;
    defaultPort = 5432;
    defaultUser = 'postgres';
    quoteChar = '"';
    tenantContext = {};
    async testConnection(connection) {
        const config = connection;
        try {
            const { Pool } = await import('pg');
            const { buildPoolConfig } = await import("../../../config/config.js");
            const poolConfig = await buildPoolConfig({
                url: config.url,
                host: config.host,
                port: config.port,
                database: config.database,
                user: config.user,
                password: config.password,
                ssl: config.ssl,
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
        });
        const pool = new Pool({ ...poolConfig, max: 1 });
        try {
            const result = await pool.query('SHOW server_version');
            const version = result.rows[0]?.server_version || 'unknown';
            return `Nile (PostgreSQL ${version})`;
        }
        finally {
            await pool.end();
        }
    }
    async introspect(connection, options) {
        const config = connection;
        return introspectNile(config, options);
    }
    async introspectTable(connection, tableName, schema) {
        const config = connection;
        return introspectTable(config, tableName, schema);
    }
    async listTables(connection, schema) {
        const config = connection;
        return listTables(config, schema);
    }
    async listSchemas(connection) {
        const config = connection;
        return listSchemas(config);
    }
    validate(schema) {
        return validateSchemaForNile(schema);
    }
    validateTable(table) {
        const minimalSchema = {
            database: '',
            tables: [table],
            indexes: [],
            constraints: [],
        };
        return validateSchemaForNile(minimalSchema);
    }
    isTypeSupported(type) {
        return isTypeSupported(type);
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
    validateSql(sql, _context) {
        return validateSqlForNile(sql);
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
    setTenant(tenantId) {
        if (!isValidUuid(tenantId)) {
            throw new Error(`Invalid tenant ID: ${tenantId}. Must be a valid UUID.`);
        }
        this.tenantContext.tenantId = tenantId;
        this.tenantContext.isGlobalOperation = false;
    }
    clearTenant() {
        this.tenantContext.tenantId = undefined;
        this.tenantContext.isGlobalOperation = false;
    }
    getCurrentTenant() {
        return this.tenantContext.tenantId;
    }
    hasTenantContext() {
        return this.tenantContext.tenantId !== undefined;
    }
    setGlobalOperation() {
        this.tenantContext.isGlobalOperation = true;
    }
    async listTenants(connection) {
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
        });
        const pool = new Pool({ ...poolConfig, max: 1 });
        try {
            const result = await pool.query(`
                SELECT
                    id,
                    name,
                    created_at as "createdAt"
                FROM tenants
                ORDER BY created_at DESC
            `);
            return result.rows.map((row) => ({
                id: row.id,
                name: row.name,
                createdAt: row.createdAt,
            }));
        }
        finally {
            await pool.end();
        }
    }
    getSetTenantSql(tenantId) {
        return generateSetTenantSql(tenantId);
    }
    getClearTenantSql() {
        return generateClearTenantSql();
    }
    getCheckTenantSql() {
        return generateGetTenantSql();
    }
}
export { NILE_FEATURES } from "./features.js";
