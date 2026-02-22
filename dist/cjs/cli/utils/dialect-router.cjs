"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectDialect = detectDialect;
exports.detectDialectFromUrl = detectDialectFromUrl;
exports.detectDialectFromHost = detectDialectFromHost;
exports.getBuilderImportPath = getBuilderImportPath;
exports.getAdapterForConfig = getAdapterForConfig;
exports.getAdapterByName = getAdapterByName;
exports.introspectDatabase = introspectDatabase;
exports.validateSchema = validateSchema;
exports.testConnection = testConnection;
exports.getDatabaseVersion = getDatabaseVersion;
exports.listTables = listTables;
exports.listSchemas = listSchemas;
exports.generateCreateTable = generateCreateTable;
exports.generateCreateIndex = generateCreateIndex;
exports.generateAlterTable = generateAlterTable;
exports.generateDropTable = generateDropTable;
exports.mapTypeToFriendly = mapTypeToFriendly;
exports.getTypeScriptType = getTypeScriptType;
exports.quoteIdentifier = quoteIdentifier;
exports.escapeString = escapeString;
exports.getDialectFamilyForConfig = getDialectFamilyForConfig;
exports.supportsFeature = supportsFeature;
exports.getFeatures = getFeatures;
const types_1 = require("../../config/types.cjs");
const registry_1 = require("../adapters/registry.cjs");
function detectDialect(config) {
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
function detectDialectFromUrl(url) {
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
function detectDialectFromHost(host) {
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
function getBuilderImportPath(dialect) {
    return BUILDER_IMPORT_PATHS[dialect] ?? 'relq/pg-builder';
}
async function getAdapterForConfig(config) {
    const dialect = detectDialect(config);
    return (0, registry_1.getAdapter)(dialect);
}
async function getAdapterByName(dialect) {
    return (0, registry_1.getAdapter)(dialect);
}
async function introspectDatabase(config, options) {
    const adapter = await getAdapterForConfig(config);
    return adapter.introspect(config.connection, options);
}
async function validateSchema(config, schema) {
    const adapter = await getAdapterForConfig(config);
    return adapter.validate(schema);
}
async function testConnection(config) {
    const adapter = await getAdapterForConfig(config);
    return adapter.testConnection(config.connection);
}
async function getDatabaseVersion(config) {
    const adapter = await getAdapterForConfig(config);
    return adapter.getDatabaseVersion(config.connection);
}
async function listTables(config, schema) {
    const adapter = await getAdapterForConfig(config);
    return adapter.listTables(config.connection, schema);
}
async function listSchemas(config) {
    const adapter = await getAdapterForConfig(config);
    return adapter.listSchemas(config.connection);
}
async function generateCreateTable(config, table, options) {
    const adapter = await getAdapterForConfig(config);
    return adapter.generateCreateTable(table, options);
}
async function generateCreateIndex(config, index, options) {
    const adapter = await getAdapterForConfig(config);
    return adapter.generateCreateIndex(index, options);
}
async function generateAlterTable(config, from, to, options) {
    const adapter = await getAdapterForConfig(config);
    return adapter.generateAlterTable(from, to, options);
}
async function generateDropTable(config, tableName, options) {
    const adapter = await getAdapterForConfig(config);
    return adapter.generateDropTable(tableName, options);
}
async function mapTypeToFriendly(config, internalType) {
    const adapter = await getAdapterForConfig(config);
    return adapter.mapTypeToFriendly(internalType);
}
async function getTypeScriptType(config, sqlType) {
    const adapter = await getAdapterForConfig(config);
    return adapter.getTypeScriptType(sqlType);
}
async function quoteIdentifier(config, identifier) {
    const adapter = await getAdapterForConfig(config);
    return adapter.quoteIdentifier(identifier);
}
async function escapeString(config, value) {
    const adapter = await getAdapterForConfig(config);
    return adapter.escapeString(value);
}
function getDialectFamilyForConfig(config) {
    const dialect = detectDialect(config);
    return (0, types_1.getDialectFamily)(dialect);
}
async function supportsFeature(config, feature) {
    const adapter = await getAdapterForConfig(config);
    return adapter.features[feature] === true;
}
async function getFeatures(config) {
    const adapter = await getAdapterForConfig(config);
    return adapter.features;
}
