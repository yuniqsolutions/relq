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
exports.registerAdapter = registerAdapter;
exports.getAdapter = getAdapter;
exports.getAdapterSync = getAdapterSync;
exports.hasAdapter = hasAdapter;
exports.isAdapterLoaded = isAdapterLoaded;
exports.getAvailableDialects = getAvailableDialects;
exports.getLoadedDialects = getLoadedDialects;
exports.preloadAdapters = preloadAdapters;
exports.preloadFamily = preloadFamily;
exports.clearAdapterCache = clearAdapterCache;
exports.unregisterAdapter = unregisterAdapter;
exports.resetRegistry = resetRegistry;
exports.getAdapterInfo = getAdapterInfo;
const types_1 = require("../../config/types.cjs");
const registry = new Map();
let defaultsRegistered = false;
function registerAdapter(dialect, factory, lazy = true) {
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
        const { PostgresAdapter } = await Promise.resolve().then(() => __importStar(require("./postgres/index.cjs")));
        return new PostgresAdapter();
    });
    registerAdapter('cockroachdb', async () => {
        const { CockroachDBAdapter } = await Promise.resolve().then(() => __importStar(require("./cockroachdb/index.cjs")));
        return new CockroachDBAdapter();
    });
    registerAdapter('nile', async () => {
        const { NileAdapter } = await Promise.resolve().then(() => __importStar(require("./nile/index.cjs")));
        return new NileAdapter();
    });
    registerAdapter('dsql', async () => {
        const { DsqlAdapter } = await Promise.resolve().then(() => __importStar(require("./dsql/index.cjs")));
        return new DsqlAdapter();
    });
    registerAdapter('sqlite', async () => {
        const { SQLiteAdapter } = await Promise.resolve().then(() => __importStar(require("./sqlite/index.cjs")));
        return new SQLiteAdapter();
    });
    registerAdapter('turso', async () => {
        const { TursoAdapter } = await Promise.resolve().then(() => __importStar(require("./sqlite/turso.cjs")));
        return new TursoAdapter();
    });
    registerAdapter('mysql', async () => {
        const { MySQLAdapter } = await Promise.resolve().then(() => __importStar(require("./mysql/index.cjs")));
        return new MySQLAdapter();
    });
    registerAdapter('mariadb', async () => {
        const { MariaDBAdapter } = await Promise.resolve().then(() => __importStar(require("./mysql/mariadb.cjs")));
        return new MariaDBAdapter();
    });
    registerAdapter('planetscale', async () => {
        const { PlanetScaleAdapter } = await Promise.resolve().then(() => __importStar(require("./mysql/planetscale.cjs")));
        return new PlanetScaleAdapter();
    });
    registerAdapter('xata', async () => {
        const { XataAdapter } = await Promise.resolve().then(() => __importStar(require("./xata/index.cjs")));
        return new XataAdapter();
    });
}
async function getAdapter(dialect) {
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
function getAdapterSync(dialect) {
    registerDefaultAdapters();
    const entry = registry.get(dialect);
    return entry?.instance;
}
function hasAdapter(dialect) {
    registerDefaultAdapters();
    return registry.has(dialect);
}
function isAdapterLoaded(dialect) {
    const entry = registry.get(dialect);
    return !!entry?.instance;
}
function getAvailableDialects() {
    registerDefaultAdapters();
    return Array.from(registry.keys());
}
function getLoadedDialects() {
    return Array.from(registry.entries())
        .filter(([_, entry]) => !!entry.instance)
        .map(([dialect]) => dialect);
}
async function preloadAdapters(dialects) {
    const results = await Promise.allSettled(dialects.map(dialect => getAdapter(dialect)));
    const failures = results.filter((r) => r.status === 'rejected');
    if (failures.length > 0) {
        const messages = failures.map(f => f.reason?.message || String(f.reason)).join('; ');
        throw new Error(`Failed to load ${failures.length} adapter(s): ${messages}`);
    }
}
async function preloadFamily(family) {
    registerDefaultAdapters();
    const familyDialects = Array.from(registry.keys())
        .filter(dialect => (0, types_1.getDialectFamily)(dialect) === family);
    await preloadAdapters(familyDialects);
}
function clearAdapterCache(dialect) {
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
function unregisterAdapter(dialect) {
    return registry.delete(dialect);
}
function resetRegistry() {
    registry.clear();
    defaultsRegistered = false;
}
async function getAdapterInfo() {
    registerDefaultAdapters();
    const info = [];
    for (const [dialect, entry] of registry.entries()) {
        const family = (0, types_1.getDialectFamily)(dialect);
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
