"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateLegacyConfig = migrateLegacyConfig;
exports.validateAndMigrateConfig = validateAndMigrateConfig;
exports.isLegacyConfig = isLegacyConfig;
exports.getMigrationInstructions = getMigrationInstructions;
function migrateLegacyConfig(config) {
    if (!config || typeof config !== 'object') {
        return { dialect: 'postgres' };
    }
    const input = config;
    const warnings = [];
    if (input.connection || input.dialect) {
        if (input.connection?.aws && isLegacyAwsConfig(input.connection.aws)) {
            return {
                ...input,
                dialect: input.dialect || 'dsql',
            };
        }
        return input;
    }
    const connectionFields = [
        'host', 'port', 'database', 'user', 'password', 'url', 'ssl', 'aws'
    ];
    const hasRootConnectionFields = connectionFields.some(field => field in input && input[field] !== undefined);
    if (hasRootConnectionFields) {
        warnings.push('Relq config uses deprecated root-level connection fields. ' +
            'Please move them inside a `connection` object.');
        const connection = {};
        const migrated = {};
        for (const [key, value] of Object.entries(input)) {
            if (connectionFields.includes(key) && value !== undefined) {
                connection[key] = value;
            }
            else {
                migrated[key] = value;
            }
        }
        if (input.aws && isLegacyAwsConfig(input.aws)) {
            warnings.push('Legacy AWS DSQL config detected. ' +
                'Please use `dialect: "dsql"` with `connection.aws` instead.');
            migrated.dialect = 'dsql';
            connection.aws = migrateLegacyAwsConfig(input.aws);
        }
        else {
            migrated.dialect = 'postgres';
        }
        migrated.connection = connection;
        if (warnings.length > 0) {
            logDeprecationWarnings(warnings);
        }
        return migrated;
    }
    return input;
}
function isLegacyAwsConfig(aws) {
    return aws && typeof aws === 'object' && aws.hostname && aws.region;
}
function migrateLegacyAwsConfig(legacy) {
    return {
        hostname: legacy.hostname,
        region: legacy.region,
        accessKeyId: legacy.accessKeyId,
        secretAccessKey: legacy.secretAccessKey,
        user: legacy.user,
        tokenExpiresIn: legacy.tokenExpiresIn,
        useDefaultCredentials: legacy.useDefaultCredentials,
    };
}
function logDeprecationWarnings(warnings) {
    const prefix = '\x1b[33m[Relq Deprecation]\x1b[0m';
    for (const warning of warnings) {
        console.warn(`${prefix} ${warning}`);
    }
    console.warn(`${prefix} See migration guide: https://relq.dev/docs/migration/config-v1`);
}
function validateAndMigrateConfig(config, migrate = true) {
    const errors = [];
    const warnings = [];
    const migratedConfig = migrate ? migrateLegacyConfig(config) : config;
    if (!migratedConfig) {
        errors.push('Configuration is required');
        return { valid: false, errors, warnings };
    }
    const dialect = migratedConfig.dialect || 'postgres';
    if (dialect !== 'sqlite' && dialect !== 'turso') {
        const conn = migratedConfig.connection;
        if (!conn?.url && !conn?.host && !conn?.aws) {
            if (!process.env.DATABASE_URL && !process.env.PGHOST) {
                warnings.push('No connection configuration found. ' +
                    'Either set connection options or DATABASE_URL environment variable.');
            }
        }
    }
    if (migratedConfig.pool) {
        const pool = migratedConfig.pool;
        if (pool.min !== undefined && pool.max !== undefined) {
            if (pool.min > pool.max) {
                errors.push('Pool min cannot be greater than max');
            }
        }
        if (pool.min !== undefined && pool.min < 0) {
            errors.push('Pool min must be non-negative');
        }
        if (pool.max !== undefined && pool.max < 1) {
            errors.push('Pool max must be at least 1');
        }
    }
    if (migratedConfig.migrations && !migratedConfig.migrations.directory) {
        warnings.push('Migrations directory not specified. Using default: ./migrations');
    }
    if (migratedConfig.studio?.port) {
        const port = migratedConfig.studio.port;
        if (port < 1 || port > 65535) {
            errors.push('Studio port must be between 1 and 65535');
        }
    }
    return {
        valid: errors.length === 0,
        errors,
        warnings,
        migratedConfig,
    };
}
function isLegacyConfig(config) {
    if (!config || typeof config !== 'object') {
        return false;
    }
    const input = config;
    const legacyFields = ['host', 'port', 'database', 'user', 'password', 'url'];
    return legacyFields.some(field => field in input && !('connection' in input));
}
function getMigrationInstructions(config) {
    if (!isLegacyConfig(config)) {
        return 'Configuration is already in the current format.';
    }
    const input = config;
    const lines = [
        '// Migrate your relq.config.ts to the new format:',
        '',
        'import { defineConfig } from "relq/config";',
        '',
        'export default defineConfig({',
    ];
    let dialect = 'postgres';
    if (input.aws?.hostname) {
        dialect = 'dsql';
        lines.push(`    dialect: '${dialect}',`);
    }
    lines.push('    connection: {');
    const connectionFields = ['host', 'port', 'database', 'user', 'password', 'url', 'ssl'];
    for (const field of connectionFields) {
        if (input[field] !== undefined) {
            const value = typeof input[field] === 'string'
                ? `'${input[field]}'`
                : input[field];
            lines.push(`        ${field}: ${value},`);
        }
    }
    if (input.aws) {
        lines.push('        aws: {');
        for (const [key, value] of Object.entries(input.aws)) {
            const formattedValue = typeof value === 'string' ? `'${value}'` : value;
            lines.push(`            ${key}: ${formattedValue},`);
        }
        lines.push('        },');
    }
    lines.push('    },');
    const skipFields = ['host', 'port', 'database', 'user', 'password', 'url', 'ssl', 'aws'];
    for (const [key, value] of Object.entries(input)) {
        if (!skipFields.includes(key) && value !== undefined) {
            lines.push(`    ${key}: ${JSON.stringify(value, null, 8).replace(/\n/g, '\n    ')},`);
        }
    }
    lines.push('});');
    return lines.join('\n');
}
