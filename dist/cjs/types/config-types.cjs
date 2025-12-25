"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPoolingEnabled = isPoolingEnabled;
exports.toPoolConfig = toPoolConfig;
const pool_defaults_1 = require("../utils/pool-defaults.cjs");
function isPoolingEnabled(config) {
    return config.pooling !== false;
}
function toPoolConfig(config) {
    const smartDefaults = config.disableSmartDefaults
        ? { min: 0, max: 10, idleTimeoutMillis: 30000, connectionTimeoutMillis: 0 }
        : (0, pool_defaults_1.mergeWithDefaults)(config.pool);
    const poolConfig = {
        host: config.host || 'localhost',
        port: config.port || 5432,
        database: config.database,
        user: config.user,
        password: config.password,
        min: config.pool?.min ?? smartDefaults.min,
        max: config.pool?.max ?? smartDefaults.max,
        idleTimeoutMillis: config.pool?.idleTimeoutMillis ?? smartDefaults.idleTimeoutMillis,
        connectionTimeoutMillis: config.pool?.connectionTimeoutMillis ?? smartDefaults.connectionTimeoutMillis,
        application_name: config.pool?.application_name,
        ssl: config.pool?.ssl,
        allowExitOnIdle: true
    };
    if (config.connectionString) {
        return {
            connectionString: config.connectionString,
            min: poolConfig.min,
            max: poolConfig.max,
            idleTimeoutMillis: poolConfig.idleTimeoutMillis,
            connectionTimeoutMillis: poolConfig.connectionTimeoutMillis,
            application_name: poolConfig.application_name,
            ssl: poolConfig.ssl,
            allowExitOnIdle: true
        };
    }
    return poolConfig;
}
