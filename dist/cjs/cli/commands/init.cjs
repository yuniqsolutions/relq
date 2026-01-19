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
exports.initCommand = initCommand;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const readline = __importStar(require("readline"));
const env_loader_1 = require("../utils/env-loader.cjs");
const repo_manager_1 = require("../utils/repo-manager.cjs");
const relqignore_1 = require("../utils/relqignore.cjs");
const cli_utils_1 = require("../utils/cli-utils.cjs");
function ask(rl, question, defaultValue) {
    const suffix = defaultValue ? ` ${cli_utils_1.colors.muted(`[${defaultValue}]`)}` : '';
    return new Promise((resolve) => {
        rl.question(`${question}${suffix}: `, (answer) => {
            resolve(answer.trim() || defaultValue || '');
        });
    });
}
function askYesNo(rl, question, defaultYes = true) {
    const suffix = defaultYes ? cli_utils_1.colors.muted('[Y/n]') : cli_utils_1.colors.muted('[y/N]');
    return new Promise((resolve) => {
        rl.question(`${question} ${suffix}: `, (answer) => {
            const a = answer.trim().toLowerCase();
            if (!a)
                resolve(defaultYes);
            else
                resolve(a === 'y' || a === 'yes');
        });
    });
}
function detectSchemaPath() {
    const cwd = process.cwd();
    if (fs.existsSync(path.join(cwd, 'src'))) {
        return './src/db/schema.ts';
    }
    if (fs.existsSync(path.join(cwd, 'app'))) {
        return './app/db/schema.ts';
    }
    if (fs.existsSync(path.join(cwd, 'db'))) {
        return './db/schema.ts';
    }
    if (fs.existsSync(path.join(cwd, 'lib'))) {
        return './lib/db/schema.ts';
    }
    return './src/db/schema.ts';
}
function checkEnvVars() {
    const vars = {
        DATABASE_HOST: process.env.DATABASE_HOST,
        DATABASE_PORT: process.env.DATABASE_PORT,
        DATABASE_NAME: process.env.DATABASE_NAME,
        DATABASE_USER: process.env.DATABASE_USER,
        DATABASE_PASSWORD: process.env.DATABASE_PASSWORD,
        DATABASE_REGION: process.env.DATABASE_REGION,
        AWS_DATABASE_HOST: process.env.AWS_DATABASE_HOST,
        AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
        AWS_DATABASE_USER: process.env.AWS_DATABASE_USER,
        AWS_DATABASE_NAME: process.env.AWS_DATABASE_NAME,
        AWS_DATABASE_PORT: process.env.AWS_DATABASE_PORT,
        AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
        RELQ_PG_CONN_URL: process.env.RELQ_PG_CONN_URL,
    };
    const hasConnUrl = !!vars.RELQ_PG_CONN_URL;
    const hasIndividual = !!(vars.DATABASE_HOST && vars.DATABASE_NAME && vars.DATABASE_USER && vars.DATABASE_PASSWORD);
    const hasAws = !!(vars.AWS_ACCESS_KEY_ID && vars.AWS_SECRET_ACCESS_KEY && vars.DATABASE_REGION && vars.AWS_DATABASE_NAME && vars.AWS_DATABASE_HOST);
    return {
        found: hasConnUrl || hasIndividual || hasAws,
        hasConnUrl,
        hasIndividual,
        hasAws,
        vars,
    };
}
async function askConnectionType(rl, options) {
    const choices = [];
    if (options.hasConnUrl) {
        choices.push({ key: String(choices.length + 1), label: 'Connection URL (RELQ_PG_CONN_URL)', value: 'url' });
    }
    if (options.hasIndividual) {
        choices.push({ key: String(choices.length + 1), label: 'Individual Config (DATABASE_HOST, DATABASE_NAME, ...)', value: 'individual' });
    }
    if (options.hasAws) {
        choices.push({ key: String(choices.length + 1), label: 'AWS DSQL (AWS_ACCESS_KEY_ID, DATABASE_REGION, ...)', value: 'aws' });
    }
    if (choices.length === 1) {
        return choices[0].value;
    }
    console.log('Multiple connection options found:');
    console.log('');
    for (const choice of choices) {
        console.log(`   ${cli_utils_1.colors.cyan(choice.key)}. ${choice.label}`);
    }
    console.log('');
    const answer = await ask(rl, `Which connection type? [${choices.map(c => c.key).join('/')}]`, '1');
    const selected = choices.find(c => c.key === answer);
    return selected?.value ?? choices[0].value;
}
function generateConfig(options) {
    let connectionBlock;
    if (options.useEnv) {
        if (options.connectionType === 'url') {
            connectionBlock = `    connection: {
        url: process.env.RELQ_PG_CONN_URL,
    },`;
        }
        else if (options.connectionType === 'aws') {
            connectionBlock = `    connection: {
        database: process.env.AWS_DATABASE_NAME,
        aws: {
            hostname: process.env.AWS_DATABASE_HOST!,
            region: process.env.DATABASE_REGION!,
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            user: process.env.AWS_DATABASE_USER || 'admin',
            port: parseInt(process.env.AWS_DATABASE_PORT || '5432'),
        },
    },`;
        }
        else {
            connectionBlock = `    connection: {
        host: process.env.DATABASE_HOST,
        port: parseInt(process.env.DATABASE_PORT || '5432'),
        database: process.env.DATABASE_NAME,
        user: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
    },`;
        }
    }
    else {
        connectionBlock = `    connection: {
        host: '${options.host}',
        port: ${options.port},
        database: '${options.database}',
        user: '${options.user}',
        password: '${options.password}',
    },`;
    }
    return `import { defineConfig } from 'relq/config';

export default defineConfig({
${connectionBlock}

    // Author for commits (required)
    author: '${options.author}',

    // Schema file path
    schema: '${options.schemaPath}',

    // What to track
    generate: {
        includeFunctions: ${options.includeFunctions},
        includeTriggers: ${options.includeTriggers},
        includeRLS: false,
        camelCase: true,
    },

    // Migrations
    migrations: {
        directory: './migrations',
        tableName: '_relq_migrations',
    },

    // Sync settings
    sync: {
        commitLimit: 1000,
    },
});
`;
}
async function initCommand(context) {
    const cwd = process.cwd();
    const spinner = (0, cli_utils_1.createSpinner)();
    console.log('');
    const { findConfigFileRecursive } = await Promise.resolve().then(() => __importStar(require("../utils/config-loader.cjs")));
    const { findProjectRoot } = await Promise.resolve().then(() => __importStar(require("../utils/project-root.cjs")));
    const existingConfig = findConfigFileRecursive(cwd);
    let projectRoot = cwd;
    let existingConfigValues = null;
    if (existingConfig) {
        projectRoot = existingConfig.directory;
        try {
            const { loadConfig } = await Promise.resolve().then(() => __importStar(require("../../config/config.cjs")));
            existingConfigValues = await loadConfig(existingConfig.path);
        }
        catch {
        }
        if (existingConfig.directory !== cwd) {
            (0, cli_utils_1.hint)(`Found relq.config.ts in: ${cli_utils_1.colors.cyan(existingConfig.directory)}`);
            console.log(`   Initializing at project root...`);
            console.log('');
        }
    }
    else {
        const packageRoot = findProjectRoot(cwd);
        if (packageRoot && packageRoot !== cwd) {
            projectRoot = packageRoot;
            (0, cli_utils_1.hint)(`Found package.json in: ${cli_utils_1.colors.cyan(packageRoot)}`);
            console.log(`   Initializing at project root...`);
            console.log('');
        }
    }
    if (existingConfig && existingConfig.directory === projectRoot) {
        const relqFolderExists = (0, repo_manager_1.isInitialized)(projectRoot);
        if (relqFolderExists) {
            console.log(`${cli_utils_1.colors.green('Relq is already initialized.')}`);
            console.log('');
            console.log(`   ${cli_utils_1.colors.dim('-')} relq.config.ts`);
            console.log(`   ${cli_utils_1.colors.dim('-')} .relq/ folder`);
            console.log('');
            (0, cli_utils_1.hint)(`Use ${cli_utils_1.colors.cyan('relq status')} to see current state`);
            (0, cli_utils_1.hint)(`Use ${cli_utils_1.colors.cyan('relq pull')} to sync with database`);
            return;
        }
        else {
            (0, cli_utils_1.warning)('Found relq.config.ts but .relq/ folder is missing');
            (0, cli_utils_1.hint)('This could mean the setup was incomplete');
            console.log('');
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout,
            });
            try {
                const upgrade = await askYesNo(rl, `Complete setup using existing config?`, true);
                if (upgrade) {
                    const missingFields = [];
                    if (!existingConfigValues?.author || existingConfigValues.author === 'Developer <dev@example.com>') {
                        missingFields.push('author');
                    }
                    if (!existingConfigValues?.schema) {
                        missingFields.push('schema');
                    }
                    if (!existingConfigValues?.connection?.host && !existingConfigValues?.connection?.url) {
                        const hasEnvConnection = process.env.DATABASE_HOST || process.env.RELQ_PG_CONN_URL;
                        if (!hasEnvConnection) {
                            missingFields.push('connection');
                        }
                    }
                    if (missingFields.length > 0) {
                        console.log('');
                        (0, cli_utils_1.warning)('Your config is missing required fields:');
                        for (const field of missingFields) {
                            console.log(`   ${cli_utils_1.colors.dim('-')} ${field}`);
                        }
                        console.log('');
                        console.log(`${cli_utils_1.colors.dim("Let's fill in the missing fields:")}`);
                        console.log('');
                        let authorValue = existingConfigValues?.author;
                        let schemaValue = existingConfigValues?.schema;
                        if (missingFields.includes('author')) {
                            authorValue = await ask(rl, 'Author (Name <email>)', 'Developer <dev@example.com>');
                        }
                        if (missingFields.includes('schema')) {
                            schemaValue = await ask(rl, 'Schema file path', detectSchemaPath());
                        }
                        if (missingFields.includes('connection')) {
                            console.log('');
                            console.log('Connection not configured.');
                            console.log('   Set DATABASE_* environment variables in .env');
                            console.log('   or update relq.config.ts with connection details.');
                            rl.close();
                            return;
                        }
                        if (authorValue || schemaValue) {
                            console.log('');
                            spinner.start('Updating relq.config.ts...');
                            const configContent = fs.readFileSync(existingConfig.path, 'utf-8');
                            let updatedContent = configContent;
                            if (missingFields.includes('author') && authorValue) {
                                if (updatedContent.includes('connection:')) {
                                    updatedContent = updatedContent.replace(/(connection:\s*\{[^}]+\},?)/, `$1\n\n    // Author for commits (required)\n    author: '${authorValue}',`);
                                }
                            }
                            if (missingFields.includes('schema') && schemaValue) {
                                if (updatedContent.includes('author:')) {
                                    updatedContent = updatedContent.replace(/(author:\s*['"][^'"]+['"],?)/, `$1\n\n    // Schema file path\n    schema: '${schemaValue}',`);
                                }
                            }
                            fs.writeFileSync(existingConfig.path, updatedContent, 'utf-8');
                            spinner.succeed('Updated relq.config.ts');
                            existingConfigValues = { ...existingConfigValues, author: authorValue, schema: schemaValue };
                        }
                    }
                    rl.close();
                    console.log('');
                    console.log('Completing setup...');
                    console.log('');
                    (0, repo_manager_1.initRepository)(projectRoot);
                    console.log('   Created .relq/ folder');
                    (0, relqignore_1.createDefaultRelqignore)(projectRoot);
                    console.log('   Created .relqignore');
                    const gitignorePath = path.join(projectRoot, '.gitignore');
                    if (fs.existsSync(gitignorePath)) {
                        const gitignore = fs.readFileSync(gitignorePath, 'utf-8');
                        if (!gitignore.includes('.relq')) {
                            fs.appendFileSync(gitignorePath, '\n# Relq local state\n.relq/\n');
                            console.log('   Added .relq/ to .gitignore');
                        }
                    }
                    if (existingConfigValues?.connection) {
                        spinner.start('Creating _relq_commits table...');
                        try {
                            await (0, repo_manager_1.ensureRemoteTable)(existingConfigValues.connection);
                            spinner.succeed('Created _relq_commits table');
                        }
                        catch (error) {
                            spinner.fail('Could not create table (check connection)');
                        }
                    }
                    console.log('');
                    console.log('Setup complete!');
                    console.log('');
                    const calledFrom = context.flags['called-from'];
                    if (calledFrom) {
                        console.log(`Continuing with ${calledFrom}...`);
                    }
                    else {
                        console.log('Run "relq pull" to sync with database.');
                    }
                    return;
                }
                rl.close();
                console.log('');
                console.log(`${cli_utils_1.colors.muted('Cancelled.')}`);
                return;
            }
            catch {
                rl.close();
                return;
            }
        }
    }
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    try {
        console.log('Checking for database connection...');
        console.log('');
        const envCheck = checkEnvVars();
        let useEnv = false;
        let connectionType = 'individual';
        let host = 'localhost';
        let port = '5432';
        let database = '';
        let user = 'postgres';
        let password = '';
        if (envCheck.found) {
            console.log('Found database connection options:');
            console.log('');
            if (envCheck.hasConnUrl) {
                console.log(`   ${cli_utils_1.colors.cyan('Connection URL')}`);
                console.log(`      RELQ_PG_CONN_URL: ${envCheck.vars.RELQ_PG_CONN_URL?.substring(0, 40)}...`);
            }
            if (envCheck.hasIndividual) {
                console.log(`   ${cli_utils_1.colors.cyan('Individual Config')}`);
                if (envCheck.vars.DATABASE_HOST)
                    console.log(`      DATABASE_HOST: ${envCheck.vars.DATABASE_HOST}`);
                if (envCheck.vars.DATABASE_NAME)
                    console.log(`      DATABASE_NAME: ${envCheck.vars.DATABASE_NAME}`);
                if (envCheck.vars.DATABASE_USER)
                    console.log(`      DATABASE_USER: ${envCheck.vars.DATABASE_USER}`);
                if (envCheck.vars.DATABASE_PASSWORD)
                    console.log('      DATABASE_PASSWORD: ***');
            }
            if (envCheck.hasAws) {
                console.log(`   ${cli_utils_1.colors.cyan('AWS DSQL')}`);
                if (envCheck.vars.AWS_DATABASE_HOST)
                    console.log(`      AWS_DATABASE_HOST: ${envCheck.vars.AWS_DATABASE_HOST}`);
                if (envCheck.vars.DATABASE_REGION)
                    console.log(`      DATABASE_REGION: ${envCheck.vars.DATABASE_REGION}`);
                if (envCheck.vars.AWS_DATABASE_NAME)
                    console.log(`      AWS_DATABASE_NAME: ${envCheck.vars.AWS_DATABASE_NAME}`);
                if (envCheck.vars.AWS_ACCESS_KEY_ID)
                    console.log(`      AWS_ACCESS_KEY_ID: ${envCheck.vars.AWS_ACCESS_KEY_ID?.substring(0, 8)}...`);
                console.log('      AWS_SECRET_ACCESS_KEY: ***');
            }
            console.log('');
            const optionCount = [envCheck.hasConnUrl, envCheck.hasIndividual, envCheck.hasAws].filter(Boolean).length;
            if (optionCount > 1) {
                connectionType = await askConnectionType(rl, envCheck);
                console.log('');
                useEnv = await askYesNo(rl, `Use ${connectionType === 'aws' ? 'AWS DSQL' : connectionType === 'url' ? 'Connection URL' : 'Individual Config'} from environment?`, true);
            }
            else {
                connectionType = envCheck.hasConnUrl ? 'url' : envCheck.hasAws ? 'aws' : 'individual';
                useEnv = await askYesNo(rl, 'Use these environment variables?', true);
            }
            console.log('');
        }
        if (!useEnv) {
            console.log('Database Connection');
            console.log('');
            host = await ask(rl, '  Host', 'localhost');
            port = await ask(rl, '  Port', '5432');
            database = await ask(rl, '  Database');
            user = await ask(rl, '  User', 'postgres');
            password = await ask(rl, '  Password');
            console.log('');
        }
        const detectedPath = detectSchemaPath();
        console.log('Schema Configuration');
        console.log('');
        const schemaPath = await ask(rl, '  Schema file path', detectedPath);
        console.log('');
        console.log('Author (for commit history)');
        console.log('');
        const author = await ask(rl, '  Name <email>', 'Developer <dev@example.com>');
        console.log('');
        console.log('Features to track');
        console.log('');
        const includeFunctions = await askYesNo(rl, '  Include functions?', false);
        const includeTriggers = await askYesNo(rl, '  Include triggers?', false);
        console.log('');
        rl.close();
        console.log('Creating files...');
        console.log('');
        const configPath = path.join(cwd, 'relq.config.ts');
        if (!fs.existsSync(configPath)) {
            const configContent = generateConfig({
                useEnv,
                connectionType,
                host,
                port,
                database,
                user,
                password,
                schemaPath,
                author,
                includeFunctions,
                includeTriggers,
            });
            fs.writeFileSync(configPath, configContent, 'utf-8');
            console.log('   Created relq.config.ts');
        }
        else {
            console.log('   relq.config.ts already exists');
        }
        (0, repo_manager_1.initRepository)(cwd);
        console.log('   Created .relq/ folder');
        (0, relqignore_1.createDefaultRelqignore)(cwd);
        console.log('   Created .relqignore');
        const schemaDir = path.dirname(schemaPath);
        if (!fs.existsSync(schemaDir)) {
            fs.mkdirSync(schemaDir, { recursive: true });
            console.log(`   Created ${schemaDir}/`);
        }
        const gitignorePath = path.join(cwd, '.gitignore');
        if (fs.existsSync(gitignorePath)) {
            const gitignore = fs.readFileSync(gitignorePath, 'utf-8');
            if (!gitignore.includes('.relq')) {
                fs.appendFileSync(gitignorePath, '\n# Relq local state\n.relq/\n');
                console.log('   Added .relq/ to .gitignore');
            }
        }
        console.log('');
        spinner.start('Connecting to database...');
        try {
            const envConfig = (0, env_loader_1.loadEnvConfig)();
            const connection = useEnv && envConfig ? envConfig : {
                host,
                port: parseInt(port),
                database,
                user,
                password,
            };
            await (0, repo_manager_1.ensureRemoteTable)(connection);
            spinner.succeed('Created _relq_commits table');
        }
        catch (error) {
            spinner.fail('Could not connect to database');
            (0, cli_utils_1.hint)("run 'relq pull' after fixing connection");
        }
        console.log('');
        console.log('Relq initialized successfully!');
        console.log('');
        console.log('Next steps:');
        console.log("  1. Review 'relq.config.ts'");
        console.log("  2. Run 'relq pull' to sync with database");
        console.log("  3. Run 'relq status' to see current state");
        console.log('');
    }
    catch (error) {
        rl.close();
        (0, cli_utils_1.fatal)('Initialization failed', error instanceof Error ? error.message : String(error));
    }
}
