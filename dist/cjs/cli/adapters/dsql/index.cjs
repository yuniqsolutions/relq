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
exports.DSQL_TRANSACTION_LIMITS = exports.DSQL_FEATURES = exports.DsqlAdapter = void 0;
const features_1 = require("./features.cjs");
const validator_1 = require("./validator.cjs");
const introspect_1 = require("./introspect.cjs");
const sql_generator_1 = require("./sql-generator.cjs");
const type_map_1 = require("./type-map.cjs");
class DsqlAdapter {
    dialect = 'dsql';
    family = 'postgres';
    displayName = 'AWS Aurora DSQL';
    features = features_1.DSQL_FEATURES;
    defaultPort = 5432;
    defaultUser = 'admin';
    quoteChar = '"';
    getTransactionLimits() {
        return features_1.DSQL_TRANSACTION_LIMITS;
    }
    async testConnection(connection) {
        const pgConfig = connection;
        try {
            const { Pool } = await Promise.resolve().then(() => __importStar(require('pg')));
            const { buildPoolConfig } = await Promise.resolve().then(() => __importStar(require("../../../config/config.cjs")));
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
        return (0, introspect_1.introspectDsql)(pgConfig, options);
    }
    async introspectTable(connection, tableName, schema) {
        const pgConfig = connection;
        return (0, introspect_1.introspectTable)(pgConfig, tableName, schema);
    }
    async listTables(connection, schema) {
        const pgConfig = connection;
        return (0, introspect_1.listTables)(pgConfig, schema);
    }
    async listSchemas(connection) {
        const pgConfig = connection;
        return (0, introspect_1.listSchemas)(pgConfig);
    }
    validate(schema) {
        return (0, validator_1.validateSchemaForDsql)(schema);
    }
    validateTable(table) {
        const issues = (0, validator_1.validateTableForDsql)(table);
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
        return (0, validator_1.validateSqlForDsql)(sql);
    }
    isTypeSupported(type) {
        return (0, validator_1.isTypeSupported)(type);
    }
    getAlternative(feature) {
        return (0, validator_1.getAlternative)(feature);
    }
    getAlternativeType(type) {
        return (0, validator_1.getAlternativeType)(type);
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
        return (0, type_map_1.mapTypeToFriendly)(internalType);
    }
    mapTypeToInternal(friendlyType) {
        return (0, type_map_1.mapTypeToInternal)(friendlyType);
    }
    getTypeScriptType(sqlType) {
        return (0, type_map_1.getTypeScriptType)(sqlType);
    }
}
exports.DsqlAdapter = DsqlAdapter;
var features_2 = require("./features.cjs");
Object.defineProperty(exports, "DSQL_FEATURES", { enumerable: true, get: function () { return features_2.DSQL_FEATURES; } });
Object.defineProperty(exports, "DSQL_TRANSACTION_LIMITS", { enumerable: true, get: function () { return features_2.DSQL_TRANSACTION_LIMITS; } });
