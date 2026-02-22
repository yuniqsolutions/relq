import { buildPoolConfig } from "../../config/config.js";
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
export async function getPool(config) {
    const resolvedConfig = await buildPoolConfig(config);
    const key = getPoolKey(resolvedConfig);
    let entry = pools.get(key);
    if (entry) {
        entry.refCount++;
        entry.lastUsed = Date.now();
        return entry.pool;
    }
    const { Pool } = await import('pg');
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
export async function releasePool(config) {
    const resolvedConfig = await buildPoolConfig(config);
    const key = getPoolKey(resolvedConfig);
    const entry = pools.get(key);
    if (entry && entry.refCount > 0) {
        entry.refCount--;
        entry.lastUsed = Date.now();
    }
}
export async function withPool(config, fn) {
    const pool = await getPool(config);
    try {
        return await fn(pool);
    }
    finally {
        await releasePool(config);
    }
}
export async function withClient(config, fn) {
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
export async function withTransaction(config, fn) {
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
export async function closeAllPools() {
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
export function getActivePoolCount() {
    return pools.size;
}
