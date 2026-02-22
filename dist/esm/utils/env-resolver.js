import process from 'node:process';
import { RelqConfigError } from "../errors/relq-errors.js";
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
let envLoaded = false;
function parseEnvFile(content) {
    const result = {};
    for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#'))
            continue;
        const eqIndex = trimmed.indexOf('=');
        if (eqIndex === -1)
            continue;
        const key = trimmed.slice(0, eqIndex).trim();
        let value = trimmed.slice(eqIndex + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        value = value.replace(/\\n/g, '\n').replace(/\\r/g, '\r');
        result[key] = value;
    }
    return result;
}
function findEnvFile(startDir) {
    let currentDir = resolve(startDir);
    let prevDir = '';
    while (currentDir !== prevDir) {
        const envPath = join(currentDir, '.env');
        if (existsSync(envPath)) {
            return envPath;
        }
        const pkgPath = join(currentDir, 'package.json');
        if (existsSync(pkgPath)) {
            return null;
        }
        prevDir = currentDir;
        currentDir = dirname(currentDir);
    }
    return null;
}
export function loadEnvFile(path) {
    if (typeof process === 'undefined' || !process.env) {
        return {};
    }
    try {
        const envPath = path ?? findEnvFile(process.cwd());
        if (!envPath)
            return {};
        const content = readFileSync(envPath, 'utf-8');
        const vars = parseEnvFile(content);
        for (const [key, value] of Object.entries(vars)) {
            if (process.env[key] === undefined) {
                process.env[key] = value;
            }
        }
        return vars;
    }
    catch {
        return {};
    }
}
function ensureEnvLoaded() {
    if (envLoaded)
        return;
    envLoaded = true;
    loadEnvFile();
}
ensureEnvLoaded();
function getEnv(key) {
    if (typeof process === 'undefined' || !process.env) {
        return undefined;
    }
    ensureEnvLoaded();
    return process.env[key];
}
function getEnvNumber(key) {
    const val = getEnv(key);
    if (val === undefined)
        return undefined;
    const num = parseInt(val, 10);
    return isNaN(num) ? undefined : num;
}
function getEnvBoolean(key) {
    const val = getEnv(key);
    if (val === undefined)
        return undefined;
    return val === 'true' || val === '1';
}
export function resolvePgEnv() {
    const result = {};
    const databaseUrl = getEnv('DATABASE_URL');
    if (databaseUrl) {
        result.connectionString = databaseUrl;
    }
    result.host = getEnv('DATABASE_HOST') ?? getEnv('PGHOST');
    result.port = getEnvNumber('DATABASE_PORT') ?? getEnvNumber('PGPORT');
    result.user = getEnv('DATABASE_USER') ?? getEnv('PGUSER');
    result.password = getEnv('DATABASE_PASSWORD') ?? getEnv('PGPASSWORD');
    result.database = getEnv('DATABASE_NAME') ?? getEnv('PGDATABASE');
    const sslMode = getEnv('DATABASE_SSL') ?? getEnv('PGSSLMODE');
    if (sslMode) {
        result.ssl = sslMode !== 'disable' && sslMode !== 'false' && sslMode !== '0';
    }
    return result;
}
export function resolveAwsEnv() {
    return {
        accessKeyId: getEnv('AWS_ACCESS_KEY_ID'),
        secretAccessKey: getEnv('AWS_SECRET_ACCESS_KEY'),
        hostname: getEnv('AWS_DATABASE_HOST'),
        region: getEnv('AWS_REGION') ?? getEnv('AWS_DEFAULT_REGION'),
        database: getEnv('AWS_DATABASE_NAME') ?? 'postgres'
    };
}
export function hasPgEnvConfig(env) {
    if (env.connectionString)
        return true;
    return !!(env.host || env.database);
}
export function hasAwsEnvConfig(env) {
    return !!(env.hostname && env.region);
}
function hasUserPgConfig(config) {
    if (config.connectionString)
        return true;
    if (config.host || config.database)
        return true;
    return false;
}
function hasUserAwsConfig(config) {
    const aws = config.aws;
    if (!aws)
        return false;
    return !!(aws.hostname && aws.region);
}
export function validateEnvConfig(dialect, config = {}) {
    switch (dialect) {
        case 'postgres':
        case 'nile':
        case 'cockroachdb': {
            if (hasUserPgConfig(config))
                return;
            const env = resolvePgEnv();
            if (hasPgEnvConfig(env))
                return;
            throw new RelqConfigError(`Missing database configuration for "${dialect}".\n\n` +
                `Provide connection options or set environment variables:\n` +
                `  DATABASE_URL=postgresql://user:pass@host:5432/dbname\n` +
                `  or: DATABASE_HOST, DATABASE_USER, DATABASE_PASSWORD, DATABASE_NAME\n` +
                `  or: PGHOST, PGUSER, PGPASSWORD, PGDATABASE`, { field: 'config' });
        }
        case 'awsdsql': {
            if (hasUserAwsConfig(config))
                return;
            const env = resolveAwsEnv();
            if (hasAwsEnvConfig(env))
                return;
            const missing = [];
            if (!env.hostname)
                missing.push('AWS_DATABASE_HOST');
            if (!env.region)
                missing.push('AWS_REGION');
            throw new RelqConfigError(`Missing AWS DSQL configuration.\n\n` +
                `Provide aws config or set environment variables:\n` +
                `  AWS_DATABASE_HOST=cluster.dsql.us-east-1.on.aws\n` +
                `  AWS_REGION=us-east-1\n` +
                `  AWS_ACCESS_KEY_ID=AKIA...\n` +
                `  AWS_SECRET_ACCESS_KEY=...\n\n` +
                `Missing: ${missing.join(', ')}`, { field: 'config' });
        }
        default:
            break;
    }
}
export function mergeWithPgEnv(config) {
    const env = resolvePgEnv();
    return {
        ...env,
        ...config,
        connectionString: config.connectionString ?? env.connectionString
    };
}
export function mergeWithAwsEnv(config) {
    const env = resolveAwsEnv();
    const awsConfig = config.aws;
    if (awsConfig) {
        return {
            ...config,
            aws: {
                hostname: env.hostname,
                region: env.region,
                accessKeyId: env.accessKeyId,
                secretAccessKey: env.secretAccessKey,
                ...awsConfig
            }
        };
    }
    if (hasAwsEnvConfig(env)) {
        return {
            ...config,
            database: config.database ?? env.database,
            aws: {
                hostname: env.hostname,
                region: env.region,
                accessKeyId: env.accessKeyId,
                secretAccessKey: env.secretAccessKey
            }
        };
    }
    return config;
}
