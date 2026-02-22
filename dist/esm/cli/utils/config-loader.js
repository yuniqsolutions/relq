import { loadConfig as baseLoadConfig } from "../../config/config.js";
import { fatal } from "./ui.js";
import { loadEnvConfig } from "./env-loader.js";
import * as fs from 'node:fs';
import * as path from 'node:path';
const CONFIG_FILENAMES = [
    'relq.config.ts',
    'relq.config.mjs',
];
export function findConfigFile(cwd = process.cwd()) {
    for (const filename of CONFIG_FILENAMES) {
        const filepath = path.join(cwd, filename);
        if (fs.existsSync(filepath)) {
            return filepath;
        }
    }
    return null;
}
export function findConfigFileRecursive(startDir = process.cwd()) {
    let currentDir = path.resolve(startDir);
    const root = path.parse(currentDir).root;
    while (currentDir !== root) {
        const found = findConfigFile(currentDir);
        if (found) {
            return { path: found, directory: currentDir };
        }
        currentDir = path.dirname(currentDir);
    }
    return null;
}
export function configExists(cwd = process.cwd()) {
    return findConfigFile(cwd) !== null;
}
export async function loadConfigWithEnv(configPath) {
    let config;
    if (configPath) {
        config = await baseLoadConfig(configPath);
    }
    else {
        const foundPath = findConfigFile();
        if (foundPath) {
            config = await baseLoadConfig(foundPath);
        }
        else {
            config = {};
        }
    }
    const hasConnection = config.connection?.host || config.connection?.url || config.connection?.aws?.hostname;
    if (!hasConnection) {
        const envConfig = loadEnvConfig();
        if (envConfig) {
            config = {
                ...config,
                connection: {
                    ...config.connection,
                    ...envConfig,
                },
            };
        }
    }
    return config;
}
export function validateConfig(config) {
    const errors = [];
    const hasConnection = config.connection?.host || config.connection?.url || config.connection?.aws?.hostname;
    if (!hasConnection) {
        errors.push('No database connection configured. Set connection in relq.config.ts or use DATABASE_* env vars.');
    }
    const hasSchemaPath = typeof config.schema === 'string' && config.schema.length > 0;
    const hasSchemaDir = typeof config.schema === 'object' && config.schema?.directory;
    const hasTypeGenOutput = config.typeGeneration?.output;
    const hasGenerateOutDir = config.generate?.outDir;
    if (!hasSchemaPath && !hasSchemaDir && !hasTypeGenOutput && !hasGenerateOutDir) {
        errors.push('No schema output path configured. Set schema, generate.outDir, or typeGeneration.output in relq.config.ts.');
    }
    return errors;
}
export function getSchemaPath(config) {
    if (!config) {
        return fatal('Configuration is required', 'Schema path must be defined in relq.config.ts');
    }
    if (typeof config.schema === 'string' && config.schema.length > 0) {
        return config.schema;
    }
    if (typeof config.schema === 'object' && config.schema?.directory) {
        return `${config.schema.directory}/schema.ts`;
    }
    if (config.generate?.outDir) {
        return `${config.generate.outDir}/schema.ts`;
    }
    if (config.typeGeneration?.output) {
        return config.typeGeneration.output;
    }
    return fatal('Schema path not configured', "Add schema: './path/to/schema.ts' to relq.config.ts");
}
export async function requireValidConfig(config, options) {
    const errors = validateConfig(config);
    if (errors.length === 0)
        return;
    const colors = {
        red: (s) => `\x1b[31m${s}\x1b[0m`,
        yellow: (s) => `\x1b[33m${s}\x1b[0m`,
        cyan: (s) => `\x1b[36m${s}\x1b[0m`,
        bold: (s) => `\x1b[1m${s}\x1b[0m`,
    };
    const isInteractive = process.stdin.isTTY && process.stdout.isTTY;
    if (options?.autoComplete !== false && isInteractive) {
        console.error('');
        console.error(colors.yellow('Configuration incomplete.'));
        console.error(`Run ${colors.cyan('relq init')} to set up your project.`);
        console.error('');
        process.exit(1);
    }
    console.error('');
    console.error(colors.red('error:') + ' Configuration errors:');
    for (const error of errors) {
        console.error(`   ${colors.yellow('•')} ${error}`);
    }
    console.error('');
    console.error(colors.yellow('hint:') + ` Run ${colors.cyan('relq init')} to create a configuration file or check your config settings.`);
    console.error('');
    process.exit(1);
}
export async function requireValidSchema(schemaPath, flags = {}) {
    if (flags['skip-validation'] === true) {
        return true;
    }
    const { validateSchemaFile, formatValidationErrors } = await import("./schema-validator.js");
    const result = validateSchemaFile(schemaPath);
    if (result.valid) {
        return true;
    }
    const colors = {
        red: (s) => `\x1b[31m${s}\x1b[0m`,
        yellow: (s) => `\x1b[33m${s}\x1b[0m`,
        cyan: (s) => `\x1b[36m${s}\x1b[0m`,
    };
    console.error('');
    console.error(colors.red('error:') + ` Schema has ${result.errors.length} syntax error(s)`);
    console.error('');
    console.error(formatValidationErrors(result));
    console.error(colors.yellow('hint:') + ` Fix the errors above, or use ${colors.cyan('--skip-validation')} to bypass`);
    console.error('');
    process.exit(1);
}
