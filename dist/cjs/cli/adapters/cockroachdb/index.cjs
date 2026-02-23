"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.COCKROACHDB_FEATURES = exports.CockroachDBAdapter = void 0;
const features_1 = require("./features.cjs");
const validator_1 = require("./validator.cjs");
const introspect_1 = require("./introspect.cjs");
const sql_generator_1 = require("./sql-generator.cjs");
const type_map_1 = require("./type-map.cjs");
class CockroachDBAdapter {
    dialect = 'cockroachdb';
    family = 'postgres';
    displayName = 'CockroachDB';
    features = features_1.COCKROACHDB_FEATURES;
    defaultPort = 26257;
    defaultUser = 'root';
    quoteChar = '"';
    async testConnection(connection) {
        const config = connection;
        try {
            const { Pool } = await Promise.resolve().then(() => __importStar(require('pg')));
            const { buildPoolConfig } = await Promise.resolve().then(() => __importStar(require("../../../config/config.cjs")));
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
        const { Pool } = await Promise.resolve().then(() => __importStar(require('pg')));
        const { buildPoolConfig } = await Promise.resolve().then(() => __importStar(require("../../../config/config.cjs")));
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
        return (0, introspect_1.introspectCockroachDB)(config, options);
    }
    async introspectTable(connection, tableName, schema) {
        const config = connection;
        return (0, introspect_1.introspectTable)(config, tableName, schema);
    }
    async listTables(connection, schema) {
        const config = connection;
        return (0, introspect_1.listTables)(config, schema);
    }
    async listSchemas(connection) {
        const config = connection;
        return (0, introspect_1.listSchemas)(config);
    }
    validate(schema) {
        return (0, validator_1.validateSchemaForCockroachDB)(schema);
    }
    validateTable(table) {
        return (0, validator_1.validateTableForCockroachDB)(table);
    }
    isTypeSupported(sqlType) {
        return (0, validator_1.isTypeSupported)(sqlType);
    }
    getAlternative(feature) {
        return (0, validator_1.getAlternativeType)(feature) !== feature
            ? (0, validator_1.getAlternativeType)(feature)
            : undefined;
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
        return (0, validator_1.validateSqlForCockroachDB)(sql);
    }
    mapTypeToFriendly(internalType) {
        return (0, type_map_1.mapTypeToFriendly)(internalType);
    }
    mapTypeToInternal(friendlyType) {
        return (0, type_map_1.mapTypeToInternal)(friendlyType);
    }
    getTypeScriptType(sqlType) {
        return (0, type_map_1.getTypeScriptType)(sqlType);
    }
}
exports.CockroachDBAdapter = CockroachDBAdapter;
var features_2 = require("./features.cjs");
Object.defineProperty(exports, "COCKROACHDB_FEATURES", { enumerable: true, get: function () { return features_2.COCKROACHDB_FEATURES; } });
