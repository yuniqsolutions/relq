import { getDialectFamily } from "../../config/types.js";
const registry = new Map();
let defaultsRegistered = false;
export function registerAdapter(dialect, factory, lazy = true) {
    const entry = {
        factory,
        lazy,
    };
    if (!lazy) {
        const result = factory();
        if (result instanceof Promise) {
            throw new Error(`Non-lazy registration for '${dialect}' requires a synchronous factory. ` +
                `Use lazy=true for async factories.`);
        }
        entry.instance = result;
    }
    registry.set(dialect, entry);
}
function registerDefaultAdapters() {
    if (defaultsRegistered)
        return;
    defaultsRegistered = true;
    registerAdapter('postgres', async () => {
        const { PostgresAdapter } = await import("./postgres/index.js");
        return new PostgresAdapter();
    });
    registerAdapter('cockroachdb', async () => {
        const { CockroachDBAdapter } = await import("./cockroachdb/index.js");
        return new CockroachDBAdapter();
    });
    registerAdapter('nile', async () => {
        const { NileAdapter } = await import("./nile/index.js");
        return new NileAdapter();
    });
    registerAdapter('dsql', async () => {
        const { DsqlAdapter } = await import("./dsql/index.js");
        return new DsqlAdapter();
    });
    registerAdapter('sqlite', async () => {
        const { SQLiteAdapter } = await import("./sqlite/index.js");
        return new SQLiteAdapter();
    });
    registerAdapter('turso', async () => {
        const { TursoAdapter } = await import("./sqlite/turso.js");
        return new TursoAdapter();
    });
    registerAdapter('mysql', async () => {
        const { MySQLAdapter } = await import("./mysql/index.js");
        return new MySQLAdapter();
    });
    registerAdapter('mariadb', async () => {
        const { MariaDBAdapter } = await import("./mysql/mariadb.js");
        return new MariaDBAdapter();
    });
    registerAdapter('planetscale', async () => {
        const { PlanetScaleAdapter } = await import("./mysql/planetscale.js");
        return new PlanetScaleAdapter();
    });
    registerAdapter('xata', async () => {
        const { XataAdapter } = await import("./xata/index.js");
        return new XataAdapter();
    });
}
export async function getAdapter(dialect) {
    registerDefaultAdapters();
    const entry = registry.get(dialect);
    if (!entry) {
        throw new Error(`No adapter registered for dialect '${dialect}'. ` +
            `Available dialects: ${getAvailableDialects().join(', ')}`);
    }
    if (entry.instance) {
        return entry.instance;
    }
    const factoryResult = entry.factory();
    const instance = factoryResult instanceof Promise
        ? await factoryResult
        : factoryResult;
    entry.instance = instance;
    return instance;
}
export function getAdapterSync(dialect) {
    registerDefaultAdapters();
    const entry = registry.get(dialect);
    return entry?.instance;
}
export function hasAdapter(dialect) {
    registerDefaultAdapters();
    return registry.has(dialect);
}
export function isAdapterLoaded(dialect) {
    const entry = registry.get(dialect);
    return !!entry?.instance;
}
export function getAvailableDialects() {
    registerDefaultAdapters();
    return Array.from(registry.keys());
}
export function getLoadedDialects() {
    return Array.from(registry.entries())
        .filter(([_, entry]) => !!entry.instance)
        .map(([dialect]) => dialect);
}
export async function preloadAdapters(dialects) {
    const results = await Promise.allSettled(dialects.map(dialect => getAdapter(dialect)));
    const failures = results.filter((r) => r.status === 'rejected');
    if (failures.length > 0) {
        const messages = failures.map(f => f.reason?.message || String(f.reason)).join('; ');
        throw new Error(`Failed to load ${failures.length} adapter(s): ${messages}`);
    }
}
export async function preloadFamily(family) {
    registerDefaultAdapters();
    const familyDialects = Array.from(registry.keys())
        .filter(dialect => getDialectFamily(dialect) === family);
    await preloadAdapters(familyDialects);
}
export function clearAdapterCache(dialect) {
    if (dialect) {
        const entry = registry.get(dialect);
        if (entry) {
            entry.instance = undefined;
        }
    }
    else {
        for (const entry of registry.values()) {
            entry.instance = undefined;
        }
    }
}
export function unregisterAdapter(dialect) {
    return registry.delete(dialect);
}
export function resetRegistry() {
    registry.clear();
    defaultsRegistered = false;
}
export async function getAdapterInfo() {
    registerDefaultAdapters();
    const info = [];
    for (const [dialect, entry] of registry.entries()) {
        const family = getDialectFamily(dialect);
        const loaded = !!entry.instance;
        let displayName;
        if (loaded && entry.instance) {
            displayName = entry.instance.displayName;
        }
        info.push({
            dialect,
            family,
            loaded,
            displayName,
        });
    }
    return info;
}
