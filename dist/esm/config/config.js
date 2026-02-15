import process from 'node:process';
import { join, dirname, parse, basename } from 'node:path';
import { existsSync, statSync } from 'node:fs';
import { createJiti } from 'jiti';
import { getAwsDsqlToken } from "../utils/aws-dsql.js";
export function isAwsDsqlConfig(config) {
    return !!config.aws?.hostname && !!config.aws?.region;
}
export async function buildPoolConfig(connection) {
    const awsConfig = connection.aws;
    if (isAwsDsqlConfig(connection)) {
        try {
            const token = await getAwsDsqlToken(awsConfig);
            return {
                host: awsConfig.hostname,
                port: awsConfig.port ?? connection.port ?? 5432,
                database: connection.database,
                user: awsConfig.user ?? connection.user ?? 'admin',
                password: token,
                ssl: awsConfig.ssl ?? true,
            };
        }
        catch (error) {
            if (connection.host || connection.url) {
                console.warn('AWS DSQL token generation failed, falling back to standard connection');
            }
            else {
                throw error;
            }
        }
    }
    return {
        host: connection.host,
        port: connection.port || 5432,
        database: connection.database,
        user: connection.user,
        password: connection.password,
        connectionString: connection.url,
        ssl: connection.ssl,
    };
}
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
        studio: {
            theme: 'github-dark',
            port: 3000,
            openBrowser: true,
            ...config.studio,
        },
    };
}
export async function loadConfig(startPath) {
    const result = findConfigFile(startPath);
    if (!result) {
        return {};
    }
    try {
        const jiti = createJiti(result.projectRoot, {
            interopDefault: true,
        });
        const module = (await jiti.import(result.configPath));
        if (module && module?.default) {
            return module.default;
        }
        if (module && typeof module === 'object' && Object.keys(module).length > 0) {
            return module;
        }
        return {};
    }
    catch (err) {
        console.error('Error loading config:', err);
        return {};
    }
}
function findConfigFile(startPath) {
    if (startPath) {
        try {
            const stats = statSync(startPath);
            if (stats.isFile() && basename(startPath).startsWith('relq.config.')) {
                return { configPath: startPath, projectRoot: dirname(startPath) };
            }
        }
        catch {
        }
    }
    let currentDir = startPath || process.cwd();
    try {
        const stats = statSync(currentDir);
        if (stats.isFile()) {
            currentDir = dirname(currentDir);
        }
    }
    catch {
    }
    const { root } = parse(currentDir);
    while (currentDir !== root) {
        const configPath = join(currentDir, 'relq.config.ts');
        const packagePath = join(currentDir, 'package.json');
        const hasConfig = existsSync(configPath);
        const hasPackage = existsSync(packagePath);
        if (hasConfig) {
            return { configPath, projectRoot: currentDir };
        }
        if (hasPackage && !hasConfig) {
            return null;
        }
        currentDir = dirname(currentDir);
    }
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
    if (config.includeTriggers && !config.includeFunctions) {
        errors.push('Triggers require functions to be enabled. Set includeFunctions: true in your config.');
    }
    return { valid: errors.length === 0, errors };
}
