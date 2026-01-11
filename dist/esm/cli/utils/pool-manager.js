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
    const key = getPoolKey(config);
    let entry = pools.get(key);
    if (entry) {
        entry.refCount++;
        entry.lastUsed = Date.now();
        return entry.pool;
    }
    const { Pool } = await import("../../addon/pg/index.js");
    const pool = new Pool({
        host: config.host,
        port: config.port || 5432,
        database: config.database,
        user: config.user,
        password: config.password,
        connectionString: config.url,
        ssl: config.ssl,
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
export function releasePool(config) {
    const key = getPoolKey(config);
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
        releasePool(config);
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
        releasePool(config);
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
    await Promise.all(closePromises);
}
export function getActivePoolCount() {
    return pools.size;
}
