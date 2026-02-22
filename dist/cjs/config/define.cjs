"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defineConfig = defineConfig;
exports.isDialect = isDialect;
exports.getDialect = getDialect;
const types_1 = require("./types.cjs");
const DEFAULT_POOL_CONFIG = {
    min: 0,
    max: 10,
    idleTimeoutMs: 30000,
    connectionTimeoutMs: 5000,
    acquireTimeoutMs: 60000,
};
const DEFAULT_LOGGING_CONFIG = {
    queries: false,
    parameters: false,
    timing: false,
    errors: true,
    level: 'error',
};
const DEFAULT_SYNC_CONFIG = {
    snapshot: '.relq/snapshot.json',
    backupDir: '.relq/backups',
    autoGenerate: true,
    autoPush: false,
    ignore: ['__relq_*', '_temp_*'],
};
const DEFAULT_STUDIO_CONFIG = {
    theme: 'github-dark',
    port: 3000,
    openBrowser: true,
};
function defineConfig(config) {
    return {
        ...config,
        dialect: config.dialect || types_1.DEFAULT_DIALECT,
        pool: {
            ...DEFAULT_POOL_CONFIG,
            ...config.pool,
        },
        logging: {
            ...DEFAULT_LOGGING_CONFIG,
            ...config.logging,
        },
        sync: {
            ...DEFAULT_SYNC_CONFIG,
            ...config.sync,
        },
        studio: {
            ...DEFAULT_STUDIO_CONFIG,
            ...config.studio,
        },
    };
}
function isDialect(config, dialect) {
    return (config.dialect || 'postgres') === dialect;
}
function getDialect(config) {
    return config.dialect || types_1.DEFAULT_DIALECT;
}
