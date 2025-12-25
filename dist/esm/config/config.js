export function defineConfig(config) {
    return {
        ...config,
        pool: {
            min: 2,
            max: 10,
            idleTimeoutMs: 30000,
            connectionTimeoutMs: 5000,
            ...config.pool,
        },
        logging: {
            queries: false,
            parameters: false,
            timing: false,
            errors: true,
            level: 'error',
            ...config.logging,
        },
        cache: {
            enabled: false,
            strategy: 'lru',
            maxSize: 1000,
            ttl: 60000,
            ...config.cache,
        },
        conventions: {
            timestamps: {
                createdAt: 'created_at',
                updatedAt: 'updated_at',
                deletedAt: false,
            },
            softDelete: false,
            primaryKey: 'id',
            ...config.conventions,
        },
    };
}
export function loadConfig(path) {
    const configPath = path || findConfigFile();
    if (!configPath) {
        return Promise.resolve(defineConfig({}));
    }
    return import(configPath).then(module => {
        if (module.default) {
            return module.default;
        }
        return defineConfig({});
    }).catch(() => {
        return defineConfig({});
    });
}
function findConfigFile() {
    return null;
}
export function parseConnectionUrl(url) {
    try {
        const parsed = new URL(url);
        return {
            url,
            host: parsed.hostname,
            port: parsed.port ? parseInt(parsed.port, 10) : 5432,
            database: parsed.pathname.slice(1),
            user: parsed.username,
            password: parsed.password,
            ssl: parsed.searchParams.get('sslmode') || undefined,
        };
    }
    catch {
        return { url };
    }
}
export function mergeConfigs(...configs) {
    let result = {};
    for (const config of configs) {
        result = {
            ...result,
            ...config,
            connection: config.connection !== undefined
                ? { ...result.connection, ...config.connection }
                : result.connection,
            schema: config.schema !== undefined
                ? (typeof config.schema === 'string'
                    ? config.schema
                    : (typeof result.schema === 'object'
                        ? { ...result.schema, ...config.schema }
                        : config.schema))
                : result.schema,
            migrations: config.migrations !== undefined
                ? { ...result.migrations, ...config.migrations }
                : result.migrations,
            typeGeneration: config.typeGeneration !== undefined
                ? { ...result.typeGeneration, ...config.typeGeneration }
                : result.typeGeneration,
            logging: config.logging !== undefined
                ? { ...result.logging, ...config.logging }
                : result.logging,
            cache: config.cache !== undefined
                ? { ...result.cache, ...config.cache }
                : result.cache,
            pool: config.pool !== undefined
                ? { ...result.pool, ...config.pool }
                : result.pool,
            conventions: config.conventions !== undefined
                ? {
                    ...result.conventions,
                    ...config.conventions,
                    timestamps: config.conventions?.timestamps !== undefined
                        ? { ...result.conventions?.timestamps, ...config.conventions.timestamps }
                        : result.conventions?.timestamps,
                }
                : result.conventions,
            plugins: config.plugins !== undefined
                ? [...(result.plugins || []), ...config.plugins]
                : result.plugins,
        };
    }
    return defineConfig(result);
}
export function validateConfig(config) {
    const errors = [];
    if (config.connection) {
        if (!config.connection.url && !config.connection.host) {
            errors.push('Connection requires either url or host');
        }
    }
    if (config.migrations) {
        if (!config.migrations.directory) {
            errors.push('Migrations require a directory');
        }
    }
    if (config.typeGeneration) {
        if (!config.typeGeneration.output) {
            errors.push('Type generation requires an output path');
        }
    }
    if (config.pool) {
        if (config.pool.min !== undefined && config.pool.max !== undefined) {
            if (config.pool.min > config.pool.max) {
                errors.push('Pool min cannot be greater than max');
            }
        }
        if (config.pool.min !== undefined && config.pool.min < 0) {
            errors.push('Pool min must be non-negative');
        }
        if (config.pool.max !== undefined && config.pool.max < 1) {
            errors.push('Pool max must be at least 1');
        }
    }
    return { valid: errors.length === 0, errors };
}
