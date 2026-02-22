import { getDialectFamily } from "../../config/types.js";
import { getAdapter } from "../adapters/registry.js";
export function detectDialect(config) {
    if (config.dialect) {
        return config.dialect;
    }
    const connection = config.connection;
    if (!connection) {
        return 'postgres';
    }
    const url = connection.url || connection.connectionString || '';
    if (url) {
        if (url.toLowerCase().includes('dsql.amazonaws.com')) {
            return 'dsql';
        }
        return detectDialectFromUrl(url);
    }
    const host = connection.host || '';
    if (host.toLowerCase().includes('dsql.amazonaws.com')) {
        return 'dsql';
    }
    const awsConfig = connection.aws;
    if (awsConfig?.hostname && awsConfig?.region) {
        return 'dsql';
    }
    return detectDialectFromHost(host);
}
export function detectDialectFromUrl(url) {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.startsWith('postgres://') || lowerUrl.startsWith('postgresql://')) {
        if (lowerUrl.includes('.nile.tech') || lowerUrl.includes('niledb.')) {
            return 'nile';
        }
        if (lowerUrl.includes('.cockroachlabs.') || lowerUrl.includes('cockroachdb')) {
            return 'cockroachdb';
        }
        return 'postgres';
    }
    if (lowerUrl.startsWith('mysql://')) {
        if (lowerUrl.includes('.psdb.') || lowerUrl.includes('planetscale')) {
            return 'planetscale';
        }
        if (lowerUrl.includes('mariadb')) {
            return 'mariadb';
        }
        return 'mysql';
    }
    if (lowerUrl.startsWith('mariadb://')) {
        return 'mariadb';
    }
    if (lowerUrl.startsWith('sqlite://') || lowerUrl.startsWith('file:') || lowerUrl.endsWith('.sqlite') || lowerUrl.endsWith('.db')) {
        return 'sqlite';
    }
    if (lowerUrl.startsWith('libsql://') || lowerUrl.includes('.turso.io')) {
        return 'turso';
    }
    if (lowerUrl.includes('.xata.sh') || lowerUrl.includes('xata.io')) {
        return 'xata';
    }
    return 'postgres';
}
export function detectDialectFromHost(host) {
    const lowerHost = host.toLowerCase();
    if (lowerHost.includes('.nile.tech') || lowerHost.includes('niledb.')) {
        return 'nile';
    }
    if (lowerHost.includes('.cockroachlabs.') || lowerHost.includes('cockroachdb')) {
        return 'cockroachdb';
    }
    if (lowerHost.includes('.dsql.') || lowerHost.includes('aurora-dsql')) {
        return 'dsql';
    }
    if (lowerHost.includes('.psdb.') || lowerHost.includes('planetscale')) {
        return 'planetscale';
    }
    if (lowerHost.includes('.xata.sh')) {
        return 'xata';
    }
    if (lowerHost.includes('.turso.io')) {
        return 'turso';
    }
    return 'postgres';
}
const BUILDER_IMPORT_PATHS = {
    postgres: 'relq/pg-builder',
    cockroachdb: 'relq/cockroachdb-builder',
    nile: 'relq/nile-builder',
    dsql: 'relq/dsql-builder',
    sqlite: 'relq/sqlite-builder',
    turso: 'relq/turso-builder',
    mysql: 'relq/pg-builder',
    mariadb: 'relq/pg-builder',
    planetscale: 'relq/pg-builder',
    xata: 'relq/pg-builder',
};
export function getBuilderImportPath(dialect) {
    return BUILDER_IMPORT_PATHS[dialect] ?? 'relq/pg-builder';
}
export async function getAdapterForConfig(config) {
    const dialect = detectDialect(config);
    return getAdapter(dialect);
}
export async function getAdapterByName(dialect) {
    return getAdapter(dialect);
}
export async function introspectDatabase(config, options) {
    const adapter = await getAdapterForConfig(config);
    return adapter.introspect(config.connection, options);
}
export async function validateSchema(config, schema) {
    const adapter = await getAdapterForConfig(config);
    return adapter.validate(schema);
}
export async function testConnection(config) {
    const adapter = await getAdapterForConfig(config);
    return adapter.testConnection(config.connection);
}
export async function getDatabaseVersion(config) {
    const adapter = await getAdapterForConfig(config);
    return adapter.getDatabaseVersion(config.connection);
}
export async function listTables(config, schema) {
    const adapter = await getAdapterForConfig(config);
    return adapter.listTables(config.connection, schema);
}
export async function listSchemas(config) {
    const adapter = await getAdapterForConfig(config);
    return adapter.listSchemas(config.connection);
}
export async function generateCreateTable(config, table, options) {
    const adapter = await getAdapterForConfig(config);
    return adapter.generateCreateTable(table, options);
}
export async function generateCreateIndex(config, index, options) {
    const adapter = await getAdapterForConfig(config);
    return adapter.generateCreateIndex(index, options);
}
export async function generateAlterTable(config, from, to, options) {
    const adapter = await getAdapterForConfig(config);
    return adapter.generateAlterTable(from, to, options);
}
export async function generateDropTable(config, tableName, options) {
    const adapter = await getAdapterForConfig(config);
    return adapter.generateDropTable(tableName, options);
}
export async function mapTypeToFriendly(config, internalType) {
    const adapter = await getAdapterForConfig(config);
    return adapter.mapTypeToFriendly(internalType);
}
export async function getTypeScriptType(config, sqlType) {
    const adapter = await getAdapterForConfig(config);
    return adapter.getTypeScriptType(sqlType);
}
export async function quoteIdentifier(config, identifier) {
    const adapter = await getAdapterForConfig(config);
    return adapter.quoteIdentifier(identifier);
}
export async function escapeString(config, value) {
    const adapter = await getAdapterForConfig(config);
    return adapter.escapeString(value);
}
export function getDialectFamilyForConfig(config) {
    const dialect = detectDialect(config);
    return getDialectFamily(dialect);
}
export async function supportsFeature(config, feature) {
    const adapter = await getAdapterForConfig(config);
    return adapter.features[feature] === true;
}
export async function getFeatures(config) {
    const adapter = await getAdapterForConfig(config);
    return adapter.features;
}
