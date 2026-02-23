"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPoolingEnabled = isPoolingEnabled;
exports.toPoolConfig = toPoolConfig;
exports.isAwsDsqlConfig = isAwsDsqlConfig;
const pool_defaults_1 = require("../utils/pool-defaults.cjs");
function isPoolingEnabled(config) {
    return config.pooling !== false;
}
function toPoolConfig(config) {
    const smartDefaults = config.disableSmartDefaults
        ? { min: 0, max: 10, idleTimeoutMillis: 30000, connectionTimeoutMillis: 0 }
        : (0, pool_defaults_1.mergeWithDefaults)(config.pool);
    const isAws = !!config.aws;
    const host = isAws ? config.aws.hostname : (config.host || 'localhost');
    const port = config.aws?.port ?? config.port ?? 5432;
    const user = config.aws?.user ?? config.user ?? (isAws ? 'admin' : undefined);
    const ssl = isAws ? (config.aws.ssl ?? true) : config.ssl;
    const poolConfig = {
        host,
        port,
        database: config.database,
        user,
        password: config.password,
        min: config.pool?.min ?? smartDefaults.min,
        max: config.pool?.max ?? smartDefaults.max,
        idleTimeoutMillis: config.pool?.idleTimeoutMillis ?? smartDefaults.idleTimeoutMillis,
        connectionTimeoutMillis: config.pool?.connectionTimeoutMillis ?? smartDefaults.connectionTimeoutMillis,
        application_name: config.pool?.application_name,
        ssl: config.pool?.ssl ?? ssl,
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
function isAwsDsqlConfig(config) {
    return !!config.aws?.hostname && !!config.aws?.region;
}
