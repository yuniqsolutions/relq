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
exports.findConfigFile = findConfigFile;
exports.findConfigFileRecursive = findConfigFileRecursive;
exports.configExists = configExists;
exports.loadConfigWithEnv = loadConfigWithEnv;
exports.validateConfig = validateConfig;
exports.getSchemaPath = getSchemaPath;
exports.requireValidConfig = requireValidConfig;
exports.requireValidSchema = requireValidSchema;
const config_1 = require("../../config/config.cjs");
const ui_1 = require("./ui.cjs");
const env_loader_1 = require("./env-loader.cjs");
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const CONFIG_FILENAMES = [
    'relq.config.ts',
    'relq.config.mjs',
];
function findConfigFile(cwd = process.cwd()) {
    for (const filename of CONFIG_FILENAMES) {
        const filepath = path.join(cwd, filename);
        if (fs.existsSync(filepath)) {
            return filepath;
        }
    }
    return null;
}
function findConfigFileRecursive(startDir = process.cwd()) {
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
function configExists(cwd = process.cwd()) {
    return findConfigFile(cwd) !== null;
}
async function loadConfigWithEnv(configPath) {
    let config;
    if (configPath) {
        config = await (0, config_1.loadConfig)(configPath);
    }
    else {
        const foundPath = findConfigFile();
        if (foundPath) {
            config = await (0, config_1.loadConfig)(foundPath);
        }
        else {
            config = {};
        }
    }
    const hasConnection = config.connection?.host || config.connection?.url || config.connection?.aws?.hostname;
    if (!hasConnection) {
        const envConfig = (0, env_loader_1.loadEnvConfig)();
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
function validateConfig(config) {
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
function getSchemaPath(config) {
    if (!config) {
        return (0, ui_1.fatal)('Configuration is required', 'Schema path must be defined in relq.config.ts');
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
    return (0, ui_1.fatal)('Schema path not configured', "Add schema: './path/to/schema.ts' to relq.config.ts");
}
async function requireValidConfig(config, options) {
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
async function requireValidSchema(schemaPath, flags = {}) {
    if (flags['skip-validation'] === true) {
        return true;
    }
    const { validateSchemaFile, formatValidationErrors } = await Promise.resolve().then(() => __importStar(require("./schema-validator.cjs")));
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
