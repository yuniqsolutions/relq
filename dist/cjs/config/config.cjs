"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAwsDsqlConfig = isAwsDsqlConfig;
exports.buildPoolConfig = buildPoolConfig;
exports.defineConfig = defineConfig;
exports.loadConfig = loadConfig;
exports.parseConnectionUrl = parseConnectionUrl;
exports.mergeConfigs = mergeConfigs;
exports.validateConfig = validateConfig;
const node_process_1 = __importDefault(require("node:process"));
const node_path_1 = require("node:path");
const node_fs_1 = require("node:fs");
const jiti_1 = require("jiti");
const aws_dsql_1 = require("../utils/aws-dsql.cjs");
function isAwsDsqlConfig(config) {
    return !!config.aws?.hostname && !!config.aws?.region;
}
async function buildPoolConfig(connection) {
    const awsConfig = connection.aws;
    if (isAwsDsqlConfig(connection)) {
        try {
            const token = await (0, aws_dsql_1.getAwsDsqlToken)(awsConfig);
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
function defineConfig(config) {
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
async function loadConfig(startPath) {
    const result = findConfigFile(startPath);
    if (!result) {
        return {};
    }
    try {
        const jiti = (0, jiti_1.createJiti)(result.projectRoot, {
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
            const stats = (0, node_fs_1.statSync)(startPath);
            if (stats.isFile() && (0, node_path_1.basename)(startPath).startsWith('relq.config.')) {
                return { configPath: startPath, projectRoot: (0, node_path_1.dirname)(startPath) };
            }
        }
        catch {
        }
    }
    let currentDir = startPath || node_process_1.default.cwd();
    try {
        const stats = (0, node_fs_1.statSync)(currentDir);
        if (stats.isFile()) {
            currentDir = (0, node_path_1.dirname)(currentDir);
        }
    }
    catch {
    }
    const { root } = (0, node_path_1.parse)(currentDir);
    while (currentDir !== root) {
        const configPath = (0, node_path_1.join)(currentDir, 'relq.config.ts');
        const packagePath = (0, node_path_1.join)(currentDir, 'package.json');
        const hasConfig = (0, node_fs_1.existsSync)(configPath);
        const hasPackage = (0, node_fs_1.existsSync)(packagePath);
        if (hasConfig) {
            return { configPath, projectRoot: currentDir };
        }
        if (hasPackage && !hasConfig) {
            return null;
        }
        currentDir = (0, node_path_1.dirname)(currentDir);
    }
    return null;
}
function parseConnectionUrl(url) {
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
function mergeConfigs(...configs) {
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
function validateConfig(config) {
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
