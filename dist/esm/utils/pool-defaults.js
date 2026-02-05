import { detectEnvironment } from "./environment-detection.js";
export function getSmartPoolDefaults() {
    const env = detectEnvironment();
    const baseConfig = {
        min: 0,
        idleTimeoutMillis: 10000,
        connectionTimeoutMillis: 10000,
        pool: false
    };
    if (env.type === 'serverless') {
        return {
            ...baseConfig,
            max: 1,
            idleTimeoutMillis: 1000,
            recommendation: `Serverless environment detected (${env.provider}).\n` +
                '   Using single connection mode (recommended).\n' +
                '   If pooling enabled: min: 0, max: 1'
        };
    }
    if (env.type === 'edge') {
        return {
            ...baseConfig,
            max: 0,
            recommendation: 'Edge runtime detected. PostgreSQL connections not supported.\n' +
                '   Use query builder only: relq("table").select().toString()'
        };
    }
    return {
        ...baseConfig,
        max: 10,
        idleTimeoutMillis: 30000,
        recommendation: 'Traditional server environment.\n' +
            '   Pooling disabled by default (single client).\n' +
            '   To enable pooling: new Relq(schema, { pool: true, ... })'
    };
}
export function validatePoolConfig(config, env) {
    const warnings = [];
    const errors = [];
    const min = config.min ?? 0;
    const max = config.max ?? 10;
    if (env.type === 'edge') {
        errors.push('❌ Edge runtime detected (Cloudflare Workers/Deno Deploy).\n' +
            '   PostgreSQL connections are not supported in edge runtimes.\n' +
            '   \n' +
            '   Options:\n' +
            '   1. Use query builder only: relq("table").select().toString()\n' +
            '   2. Use HTTP-based database (Supabase, Neon, Xata)\n' +
            '   3. Deploy to traditional Node.js runtime');
        return { valid: false, warnings, errors };
    }
    if (min > max) {
        warnings.push(`⚠️  Pool min (${min}) is greater than max (${max}).\n` +
            `   This is invalid. Min will be clamped to max (${max}).`);
    }
    if (env.type === 'serverless' && max > 1) {
        warnings.push(`⚠️  Running in ${env.provider} with pool max: ${max}.\n` +
            '   Each serverless function will create up to ' + max + ' connections.\n' +
            '   With many concurrent functions, this can exhaust PostgreSQL connections.\n' +
            '   \n' +
            '   Recommended: pool: { min: 0, max: 1 }\n' +
            '   \n' +
            '   If you need connection pooling in serverless:\n' +
            '   - Use PgBouncer or connection pooler\n' +
            '   - Use Supabase (built-in pooling)\n' +
            '   - Use Neon serverless driver');
    }
    if (env.type === 'traditional' && min > 5) {
        warnings.push(`⚠️  Pool min set to ${min}. This keeps ${min} connections always open.\n` +
            '   High min values waste resources when traffic is low.\n' +
            '   \n' +
            '   Recommended: min: 0 (connections created on demand)\n' +
            '   Pool will scale up to max: ' + max + ' under load automatically.');
    }
    if (max > 20) {
        warnings.push(`⚠️  Pool max set to ${max}. This is very high.\n` +
            '   PostgreSQL connection limit is typically 100-200.\n' +
            '   Multiple app instances × max connections can exhaust the database.\n' +
            '   \n' +
            '   Recommended: max: 10-20 per app instance');
    }
    return {
        valid: errors.length === 0,
        warnings,
        errors
    };
}
export function mergeWithDefaults(userConfig) {
    const defaults = getSmartPoolDefaults();
    return {
        min: userConfig?.min ?? defaults.min,
        max: userConfig?.max ?? defaults.max,
        idleTimeoutMillis: userConfig?.idleTimeoutMillis ?? defaults.idleTimeoutMillis,
        connectionTimeoutMillis: userConfig?.connectionTimeoutMillis ?? defaults.connectionTimeoutMillis,
        recommendation: defaults.recommendation
    };
}
export function formatPoolConfig(config) {
    return `{ min: ${config.min}, max: ${config.max}, idleTimeout: ${config.idleTimeoutMillis}ms }`;
}
