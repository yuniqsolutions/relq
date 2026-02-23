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
exports.getPool = getPool;
exports.releasePool = releasePool;
exports.withPool = withPool;
exports.withClient = withClient;
exports.withTransaction = withTransaction;
exports.closeAllPools = closeAllPools;
exports.getActivePoolCount = getActivePoolCount;
const config_1 = require("../../config/config.cjs");
const pools = new Map();
const IDLE_TIMEOUT = 30000;
let cleanupInterval = null;
function getPoolKey(config) {
    if (config.url) {
        return config.url;
    }
    return `${config.host || 'localhost'}:${config.port || 5432}/${config.database}@${config.user}`;
}
function startCleanupInterval() {
    if (cleanupInterval)
        return;
    cleanupInterval = setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of pools.entries()) {
            if (entry.refCount === 0 && now - entry.lastUsed > IDLE_TIMEOUT) {
                entry.pool.end().catch(() => { });
                pools.delete(key);
            }
        }
        if (pools.size === 0 && cleanupInterval) {
            clearInterval(cleanupInterval);
            cleanupInterval = null;
        }
    }, IDLE_TIMEOUT);
    cleanupInterval.unref();
}
async function getPool(config) {
    const resolvedConfig = await (0, config_1.buildPoolConfig)(config);
    const key = getPoolKey(resolvedConfig);
    let entry = pools.get(key);
    if (entry) {
        entry.refCount++;
        entry.lastUsed = Date.now();
        return entry.pool;
    }
    const { Pool } = await Promise.resolve().then(() => __importStar(require('pg')));
    const pool = new Pool({
        ...resolvedConfig,
        max: config.max || 10,
        idleTimeoutMillis: config.idleTimeoutMillis || 10000,
        connectionTimeoutMillis: config.connectionTimeoutMillis || 5000,
    });
    entry = {
        pool,
        refCount: 1,
        lastUsed: Date.now(),
    };
    pools.set(key, entry);
    startCleanupInterval();
    return pool;
}
async function releasePool(config) {
    const resolvedConfig = await (0, config_1.buildPoolConfig)(config);
    const key = getPoolKey(resolvedConfig);
    const entry = pools.get(key);
    if (entry && entry.refCount > 0) {
        entry.refCount--;
        entry.lastUsed = Date.now();
    }
}
async function withPool(config, fn) {
    const pool = await getPool(config);
    try {
        return await fn(pool);
    }
    finally {
        await releasePool(config);
    }
}
async function withClient(config, fn) {
    const pool = await getPool(config);
    const client = await pool.connect();
    try {
        return await fn(client);
    }
    finally {
        client.release();
        await releasePool(config);
    }
}
async function withTransaction(config, fn) {
    return withClient(config, async (client) => {
        await client.query('BEGIN');
        try {
            const result = await fn(client);
            await client.query('COMMIT');
            return result;
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
    });
}
async function closeAllPools() {
    if (cleanupInterval) {
        clearInterval(cleanupInterval);
        cleanupInterval = null;
    }
    const closePromises = [];
    for (const [key, entry] of pools.entries()) {
        closePromises.push(entry.pool.end());
        pools.delete(key);
    }
    const results = await Promise.allSettled(closePromises);
    const failures = results.filter((r) => r.status === 'rejected');
    if (failures.length > 0) {
        console.warn(`Warning: ${failures.length} pool(s) failed to close gracefully`);
    }
}
function getActivePoolCount() {
    return pools.size;
}
