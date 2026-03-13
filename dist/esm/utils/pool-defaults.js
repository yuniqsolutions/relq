import { detectEnvironment } from "./environment-detection.js";
export function getSmartPoolDefaults() {
    const env = detectEnvironment();
    const baseConfig = {
        min: 0,
        idleTimeoutMillis: 10000,
        connectionTimeoutMillis: 10000,
    };
    if (env.type === 'serverless' || env.type === 'edge') {
        return {
            ...baseConfig,
            max: 1,
            idleTimeoutMillis: 1000,
            recommendation: `${env.type === 'serverless' ? 'Serverless' : 'Edge'} environment detected (${env.provider}).\n` +
                '   Pool: min: 0, max: 1 (single lazy connection per invocation)'
        };
    }
    return {
        ...baseConfig,
        max: 10,
        idleTimeoutMillis: 30000,
        recommendation: 'Traditional server environment.\n' +
            '   Pool: min: 0, max: 10 (connections created on demand, scale under load)'
    };
}
export function validatePoolConfig(config, env) {
    const warnings = [];
    const errors = [];
    const min = config.min ?? 0;
    const max = config.max ?? 10;
    if (env.type === 'edge' && max > 1) {
        warnings.push(`⚠️  Running in ${env.provider} (edge) with pool max: ${max}.\n` +
            '   Edge runtimes have short-lived connections.\n' +
            '   \n' +
            '   Recommended: pool: { min: 0, max: 1 }');
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
