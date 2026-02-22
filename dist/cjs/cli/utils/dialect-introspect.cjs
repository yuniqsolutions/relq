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
exports.dialectIntrospect = dialectIntrospect;
exports.introspectFromConnection = introspectFromConnection;
exports.dialectListTables = dialectListTables;
exports.dialectListSchemas = dialectListSchemas;
exports.dialectTestConnection = dialectTestConnection;
exports.dialectGetVersion = dialectGetVersion;
const types_1 = require("../../config/types.cjs");
const dialect_router_1 = require("./dialect-router.cjs");
async function dialectIntrospect(config, options) {
    if (!config.connection) {
        throw new Error('No database connection configured');
    }
    const dialect = (0, dialect_router_1.detectDialect)(config);
    if ((0, types_1.isPostgresFamily)(dialect)) {
        let pgSchema;
        switch (dialect) {
            case 'postgres': {
                const { introspectPostgres } = await Promise.resolve().then(() => __importStar(require("./postgres/introspect.cjs")));
                pgSchema = await introspectPostgres(config.connection, {
                    includeFunctions: options?.includeFunctions,
                    includeTriggers: options?.includeTriggers,
                    onProgress: options?.onProgress,
                    onDetailedProgress: options?.onDetailedProgress,
                });
                break;
            }
            case 'cockroachdb': {
                const { introspectCockroachDB } = await Promise.resolve().then(() => __importStar(require("./cockroachdb/introspect.cjs")));
                pgSchema = await introspectCockroachDB(config.connection, {
                    includeFunctions: options?.includeFunctions,
                    includeTriggers: options?.includeTriggers,
                    onProgress: options?.onProgress,
                    onDetailedProgress: options?.onDetailedProgress,
                });
                break;
            }
            case 'nile': {
                const { introspectNile } = await Promise.resolve().then(() => __importStar(require("./nile/introspect.cjs")));
                pgSchema = await introspectNile(config.connection, {
                    includeFunctions: options?.includeFunctions,
                    includeTriggers: options?.includeTriggers,
                    onProgress: options?.onProgress,
                    onDetailedProgress: options?.onDetailedProgress,
                });
                break;
            }
            case 'dsql': {
                const { introspectDsql } = await Promise.resolve().then(() => __importStar(require("./dsql/introspect.cjs")));
                pgSchema = await introspectDsql(config.connection, {
                    onProgress: options?.onProgress,
                    onDetailedProgress: options?.onDetailedProgress,
                });
                break;
            }
            default: {
                const { introspectPostgres } = await Promise.resolve().then(() => __importStar(require("./postgres/introspect.cjs")));
                pgSchema = await introspectPostgres(config.connection, {
                    includeFunctions: options?.includeFunctions,
                    includeTriggers: options?.includeTriggers,
                    onProgress: options?.onProgress,
                    onDetailedProgress: options?.onDetailedProgress,
                });
                break;
            }
        }
        return pgSchema;
    }
    const adapter = await (0, dialect_router_1.getAdapterForConfig)(config);
    return adapter.introspect(config.connection, {
        includeFunctions: options?.includeFunctions,
        includeTriggers: options?.includeTriggers,
        excludePatterns: options?.excludePatterns,
    });
}
async function introspectFromConnection(connection, dialect, options) {
    return dialectIntrospect({ connection, dialect }, options);
}
async function dialectListTables(config, schema) {
    const adapter = await (0, dialect_router_1.getAdapterForConfig)(config);
    return adapter.listTables(config.connection, schema);
}
async function dialectListSchemas(config) {
    const adapter = await (0, dialect_router_1.getAdapterForConfig)(config);
    return adapter.listSchemas(config.connection);
}
async function dialectTestConnection(config) {
    const adapter = await (0, dialect_router_1.getAdapterForConfig)(config);
    return adapter.testConnection(config.connection);
}
async function dialectGetVersion(config) {
    const adapter = await (0, dialect_router_1.getAdapterForConfig)(config);
    return adapter.getDatabaseVersion(config.connection);
}
