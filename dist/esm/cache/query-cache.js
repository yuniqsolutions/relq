export class QueryCache {
    cache = new Map();
    options;
    stats = { hits: 0, misses: 0, evictions: 0 };
    constructor(options = {}) {
        this.options = {
            strategy: options.strategy ?? 'lru',
            maxSize: options.maxSize ?? 100 * 1024 * 1024,
            maxItems: options.maxItems ?? 1000,
            ttl: options.ttl ?? 60000,
            onEvict: options.onEvict ?? (() => { }),
            keyGenerator: options.keyGenerator ?? this.defaultKeyGenerator
        };
    }
    defaultKeyGenerator(query, params) {
        const normalized = query.replace(/\s+/g, ' ').trim().toLowerCase();
        const paramStr = params ? JSON.stringify(params) : '';
        return `${normalized}::${paramStr}`;
    }
    generateKey(query, params) {
        return this.options.keyGenerator(query, params);
    }
    get(key) {
        const entry = this.cache.get(key);
        if (!entry) {
            this.stats.misses++;
            return undefined;
        }
        if (this.options.strategy === 'ttl' || this.options.strategy === 'lru') {
            const now = Date.now();
            if (this.options.ttl > 0 && now - entry.createdAt > this.options.ttl) {
                this.delete(key);
                this.stats.misses++;
                return undefined;
            }
        }
        entry.accessedAt = Date.now();
        entry.accessCount++;
        this.stats.hits++;
        if (this.options.strategy === 'lru') {
            this.cache.delete(key);
            this.cache.set(key, entry);
        }
        return entry.value;
    }
    set(key, value) {
        const size = this.estimateSize(value);
        this.evictIfNeeded(size);
        const entry = {
            value,
            createdAt: Date.now(),
            accessedAt: Date.now(),
            accessCount: 1,
            size
        };
        this.cache.set(key, entry);
    }
    has(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return false;
        if (this.options.strategy === 'ttl' || this.options.strategy === 'lru') {
            const now = Date.now();
            if (this.options.ttl > 0 && now - entry.createdAt > this.options.ttl) {
                this.delete(key);
                return false;
            }
        }
        return true;
    }
    delete(key) {
        const entry = this.cache.get(key);
        if (entry) {
            this.options.onEvict(key, entry);
            this.stats.evictions++;
            return this.cache.delete(key);
        }
        return false;
    }
    clear() {
        this.cache.forEach((entry, key) => {
            this.options.onEvict(key, entry);
        });
        this.cache.clear();
        this.stats.evictions = 0;
    }
    invalidateByPattern(pattern) {
        let count = 0;
        const keysToDelete = [];
        this.cache.forEach((_, key) => {
            if (pattern.test(key)) {
                keysToDelete.push(key);
            }
        });
        keysToDelete.forEach(key => {
            this.delete(key);
            count++;
        });
        return count;
    }
    invalidateByTable(tableName) {
        const pattern = new RegExp(`\\b${tableName.toLowerCase()}\\b`, 'i');
        return this.invalidateByPattern(pattern);
    }
    getStats() {
        const totalSize = Array.from(this.cache.values()).reduce((sum, e) => sum + e.size, 0);
        const total = this.stats.hits + this.stats.misses;
        return {
            hits: this.stats.hits,
            misses: this.stats.misses,
            evictions: this.stats.evictions,
            size: totalSize,
            itemCount: this.cache.size,
            hitRate: total > 0 ? this.stats.hits / total : 0
        };
    }
    resetStats() {
        this.stats = { hits: 0, misses: 0, evictions: 0 };
    }
    keys() {
        return Array.from(this.cache.keys());
    }
    values() {
        return Array.from(this.cache.values()).map(e => e.value);
    }
    entries() {
        return Array.from(this.cache.entries());
    }
    evictIfNeeded(incomingSize) {
        if (this.options.strategy === 'none')
            return;
        while (this.cache.size >= this.options.maxItems) {
            this.evictOne();
        }
        if (this.options.strategy === 'size') {
            const currentSize = Array.from(this.cache.values()).reduce((sum, e) => sum + e.size, 0);
            while (currentSize + incomingSize > this.options.maxSize && this.cache.size > 0) {
                this.evictOne();
            }
        }
    }
    evictOne() {
        if (this.cache.size === 0)
            return;
        let keyToEvict;
        let entryToEvict;
        switch (this.options.strategy) {
            case 'lru':
                keyToEvict = this.cache.keys().next().value;
                break;
            case 'ttl':
                let oldestTime = Infinity;
                this.cache.forEach((entry, key) => {
                    if (entry.createdAt < oldestTime) {
                        oldestTime = entry.createdAt;
                        keyToEvict = key;
                        entryToEvict = entry;
                    }
                });
                break;
            case 'size':
                let largestSize = -1;
                this.cache.forEach((entry, key) => {
                    if (entry.size > largestSize) {
                        largestSize = entry.size;
                        keyToEvict = key;
                        entryToEvict = entry;
                    }
                });
                break;
            default:
                keyToEvict = this.cache.keys().next().value;
        }
        if (keyToEvict) {
            this.delete(keyToEvict);
        }
    }
    estimateSize(value) {
        if (value === null || value === undefined)
            return 8;
        if (typeof value === 'boolean')
            return 4;
        if (typeof value === 'number')
            return 8;
        if (typeof value === 'string')
            return value.length * 2;
        if (Array.isArray(value)) {
            return value.reduce((sum, item) => sum + this.estimateSize(item), 16);
        }
        if (typeof value === 'object') {
            return JSON.stringify(value).length * 2;
        }
        return 64;
    }
}
export class CacheKeyBuilder {
    parts = [];
    table(name) {
        this.parts.push(`t:${name}`);
        return this;
    }
    operation(op) {
        this.parts.push(`o:${op}`);
        return this;
    }
    columns(...cols) {
        if (cols.length > 0) {
            this.parts.push(`c:${cols.sort().join(',')}`);
        }
        return this;
    }
    where(condition) {
        this.parts.push(`w:${condition}`);
        return this;
    }
    orderBy(order) {
        this.parts.push(`ob:${order}`);
        return this;
    }
    limit(n) {
        this.parts.push(`l:${n}`);
        return this;
    }
    offset(n) {
        this.parts.push(`of:${n}`);
        return this;
    }
    params(...values) {
        if (values.length > 0) {
            this.parts.push(`p:${JSON.stringify(values)}`);
        }
        return this;
    }
    custom(key, value) {
        this.parts.push(`${key}:${value}`);
        return this;
    }
    build() {
        return this.parts.join('|');
    }
    static from(query, params) {
        const normalized = query.replace(/\s+/g, ' ').trim();
        const hash = this.simpleHash(normalized + (params ? JSON.stringify(params) : ''));
        return `q:${hash}`;
    }
    static simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }
}
export function createQueryCacheMiddleware(options) {
    const { cache, keyPrefix = '', invalidateOn = [] } = options;
    return {
        beforeQuery: (query, params) => {
            const key = keyPrefix + CacheKeyBuilder.from(query, params);
            const cached = cache.get(key);
            if (cached !== undefined) {
                return { cached: true, value: cached, key };
            }
            return { cached: false, key };
        },
        afterQuery: (key, result) => {
            cache.set(key, result);
        },
        afterMutation: (tableName) => {
            cache.invalidateByTable(tableName);
            invalidateOn.forEach(pattern => {
                if (pattern.includes(tableName)) {
                    cache.invalidateByPattern(new RegExp(pattern, 'i'));
                }
            });
        }
    };
}
export function withCache(cache, key, fn, ttl) {
    const cached = cache.get(key);
    if (cached !== undefined) {
        return cached;
    }
    const result = fn();
    if (result instanceof Promise) {
        return result.then(value => {
            cache.set(key, value);
            return value;
        });
    }
    cache.set(key, result);
    return result;
}
export function createTableCache(tableName, options = {}) {
    const cache = new QueryCache({
        ...options,
        keyGenerator: (query, params) => {
            return `${tableName}::${query.replace(/\s+/g, ' ').trim()}::${params ? JSON.stringify(params) : ''}`;
        }
    });
    return Object.assign(cache, { table: tableName });
}
