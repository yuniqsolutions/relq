import { COCKROACHDB_FEATURES } from "./features.js";
import { validateSchemaForCockroachDB, validateTableForCockroachDB, validateSqlForCockroachDB, getAlternativeType, isTypeSupported } from "./validator.js";
import { introspectCockroachDB, introspectTable as introspectSingleTable, listTables as listTablesImpl, listSchemas as listSchemasImpl } from "./introspect.js";
import { generateCreateTable as genCreateTable, generateCreateIndex as genCreateIndex, generateAlterTable as genAlterTable, generateDropTable as genDropTable } from "./sql-generator.js";
import { mapTypeToFriendly as mapFriendly, mapTypeToInternal as mapInternal, getTypeScriptType as getTsType } from "./type-map.js";
export class CockroachDBAdapter {
    dialect = 'cockroachdb';
    family = 'postgres';
    displayName = 'CockroachDB';
    features = COCKROACHDB_FEATURES;
    defaultPort = 26257;
    defaultUser = 'root';
    quoteChar = '"';
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
                aws: config.aws,
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
            const result = await pool.query('SELECT version()');
            const version = result.rows[0]?.version || '';
            const match = version.match(/CockroachDB\s+\w+\s+(v[\d.]+)/i);
            return match ? match[1] : version;
        }
        finally {
            await pool.end();
        }
    }
    async introspect(connection, options) {
        const config = connection;
        return introspectCockroachDB(config, options);
    }
    async introspectTable(connection, tableName, schema) {
        const config = connection;
        return introspectSingleTable(config, tableName, schema);
    }
    async listTables(connection, schema) {
        const config = connection;
        return listTablesImpl(config, schema);
    }
    async listSchemas(connection) {
        const config = connection;
        return listSchemasImpl(config);
    }
    validate(schema) {
        return validateSchemaForCockroachDB(schema);
    }
    validateTable(table) {
        return validateTableForCockroachDB(table);
    }
    isTypeSupported(sqlType) {
        return isTypeSupported(sqlType);
    }
    getAlternative(feature) {
        return getAlternativeType(feature) !== feature
            ? getAlternativeType(feature)
            : undefined;
    }
    generateCreateTable(table, options) {
        return genCreateTable(table, options);
    }
    generateCreateIndex(index, options) {
        return genCreateIndex(index, options);
    }
    generateAlterTable(from, to, options) {
        return genAlterTable(from, to, options);
    }
    generateDropTable(tableName, options) {
        return genDropTable(tableName, options);
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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
        return validateSqlForCockroachDB(sql);
    }
    mapTypeToFriendly(internalType) {
        return mapFriendly(internalType);
    }
    mapTypeToInternal(friendlyType) {
        return mapInternal(friendlyType);
    }
    getTypeScriptType(sqlType) {
        return getTsType(sqlType);
    }
}
export { COCKROACHDB_FEATURES } from "./features.js";
