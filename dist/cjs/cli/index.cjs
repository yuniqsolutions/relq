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
exports.main = main;
const init_1 = require("./commands/init.cjs");
const pull_1 = require("./commands/pull.cjs");
const push_1 = require("./commands/push.cjs");
const generate_1 = require("./commands/generate.cjs");
const introspect_1 = require("./commands/introspect.cjs");
const sync_1 = require("./commands/sync.cjs");
const status_1 = require("./commands/status.cjs");
const diff_1 = require("./commands/diff.cjs");
const log_1 = require("./commands/log.cjs");
const rollback_1 = require("./commands/rollback.cjs");
const commit_1 = require("./commands/commit.cjs");
const fetch_1 = require("./commands/fetch.cjs");
const add_1 = require("./commands/add.cjs");
const import_1 = require("./commands/import.cjs");
const export_1 = require("./commands/export.cjs");
const resolve_1 = require("./commands/resolve.cjs");
const reset_1 = require("./commands/reset.cjs");
const stash_1 = require("./commands/stash.cjs");
const branch_1 = require("./commands/branch.cjs");
const merge_1 = require("./commands/merge.cjs");
const tag_1 = require("./commands/tag.cjs");
const cherry_pick_1 = require("./commands/cherry-pick.cjs");
const remote_1 = require("./commands/remote.cjs");
const validate_1 = require("./commands/validate.cjs");
const schema_ast_1 = require("./commands/schema-ast.cjs");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function loadEnvFile() {
    let currentDir = process.cwd();
    const root = path.parse(currentDir).root;
    while (currentDir !== root) {
        const envPath = path.join(currentDir, '.env');
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf-8');
            for (const line of envContent.split('\n')) {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith('#'))
                    continue;
                const match = trimmed.match(/^([^=]+)=(.*)$/);
                if (match) {
                    const key = match[1].trim();
                    const value = match[2].trim().replace(/^["']|["']$/g, '');
                    if (!process.env[key]) {
                        process.env[key] = value;
                    }
                }
            }
            return;
        }
        currentDir = path.dirname(currentDir);
    }
}
loadEnvFile();
const VERSION = '1.1.0';
function parseArgs(argv) {
    const args = [];
    const flags = {};
    let command = '';
    const booleanFlags = new Set([
        'hard', 'soft', 'force', 'yes', 'y', 'dry-run', 'verbose', 'quiet', 'q',
        'help', 'h', 'version', 'v', 'all', 'a', 'cached', 'staged', 'no-verify',
        'metadata-only', 'skip-prompt', 'interactive', 'i'
    ]);
    for (let i = 2; i < argv.length; i++) {
        const arg = argv[i];
        if (arg.startsWith('--')) {
            const eqIndex = arg.indexOf('=');
            if (eqIndex > -1) {
                flags[arg.slice(2, eqIndex)] = arg.slice(eqIndex + 1);
            }
            else {
                const flagName = arg.slice(2);
                if (booleanFlags.has(flagName)) {
                    flags[flagName] = true;
                }
                else {
                    const nextArg = argv[i + 1];
                    if (nextArg && !nextArg.startsWith('-')) {
                        flags[flagName] = nextArg;
                        i++;
                    }
                    else {
                        flags[flagName] = true;
                    }
                }
            }
        }
        else if (arg.startsWith('-') && arg.length === 2) {
            const flag = arg.slice(1);
            if (booleanFlags.has(flag)) {
                flags[flag] = true;
            }
            else {
                const nextArg = argv[i + 1];
                if (nextArg && !nextArg.startsWith('-')) {
                    flags[flag] = nextArg;
                    i++;
                }
                else {
                    flags[flag] = true;
                }
            }
        }
        else if (arg.startsWith('-') && arg.length > 2) {
            const combined = arg.slice(1);
            const nextArg = argv[i + 1];
            if (nextArg && !nextArg.startsWith('-')) {
                flags[combined] = nextArg;
                i++;
            }
            else {
                for (const char of combined) {
                    flags[char] = true;
                }
            }
        }
        else if (!command) {
            command = arg;
        }
        else {
            args.push(arg);
        }
    }
    return { command, args, flags };
}
function printHelp() {
    console.log(`
Relq CLI v${VERSION} - Database Schema Version Control

Usage: relq <command> [options]

Schema Commands:
  init                Initialize relq for your project
  status [--check]    Show current schema state
  add <table>|.       Stage changes for commit
  commit -m "msg"     Record schema snapshot
  log [--oneline]     Show commit history

Sync Commands:
  fetch               Download remote commits
  pull [--force]      Pull schema from database
  push [--dry-run]    Push commits to database
  sync                Pull + push in one command

Other Commands:
  validate            Check schema for errors
  diff [--sql]        Show schema differences
  generate            Generate TypeScript types
  introspect          Parse database schema
  import <sql-file>   Import SQL file to schema
  export [file]       Export schema to SQL file
  schema:ast [file]   Convert schema to AST (JSON)

Options:
  --help, -h          Show this help
  --version, -v       Show version
  --config <path>     Config file path
  --dry-run           Preview changes
  --force             Skip confirmations
  --force             Skip confirmation prompts

Examples:
  relq status
  relq diff --sql
  relq generate -m "add users table"
  relq push
  relq rollback 2
  relq sync

Environment Variables:
  DATABASE_CONNECTION_STRING    Full connection URL
  DATABASE_HOST/PORT/NAME       Individual connection parts
  DATABASE_USER/PASSWORD        Credentials
`);
}
function printVersion() {
    console.log(`relq v${VERSION}`);
}
function requiresConfig(command) {
    return !['init', 'introspect', 'import', 'help', 'version', 'validate'].includes(command);
}
function requiresDbConnection(command, flags) {
    const alwaysNeedDb = ['pull', 'push', 'fetch', 'introspect'];
    if (alwaysNeedDb.includes(command))
        return true;
    if (command === 'export' && flags['db'])
        return true;
    return false;
}
async function main() {
    const { command, args, flags } = parseArgs(process.argv);
    if (flags.help || flags.h || command === 'help') {
        printHelp();
        process.exit(0);
    }
    if (flags.version || flags.v || command === 'version') {
        printVersion();
        process.exit(0);
    }
    if (!command) {
        console.error('Error: No command provided\n');
        printHelp();
        process.exit(1);
    }
    let config = null;
    let resolvedProjectRoot = process.cwd();
    if (requiresConfig(command)) {
        const configPath = flags.config;
        try {
            const { loadConfigWithEnv, findConfigFileRecursive } = await Promise.resolve().then(() => __importStar(require("./utils/config-loader.cjs")));
            const { findProjectRoot } = await Promise.resolve().then(() => __importStar(require("./utils/project-root.cjs")));
            const configResult = configPath ? { path: configPath, directory: path.dirname(path.resolve(configPath)) } : findConfigFileRecursive();
            if (!configResult) {
                const projectRoot = findProjectRoot();
                if (!projectRoot) {
                    const colors = {
                        red: (s) => `\x1b[31m${s}\x1b[0m`,
                        yellow: (s) => `\x1b[33m${s}\x1b[0m`,
                        cyan: (s) => `\x1b[36m${s}\x1b[0m`,
                    };
                    console.error('');
                    console.error(colors.red('fatal:') + ' not a relq project (or any of the parent directories)');
                    console.error('');
                    console.error(colors.yellow('hint:') + ` Run ${colors.cyan('relq init')} in your project directory to initialize relq.`);
                    console.error('');
                    process.exit(128);
                }
            }
            resolvedProjectRoot = configResult?.directory || findProjectRoot() || process.cwd();
            const foundConfig = configResult?.path;
            if (!foundConfig) {
                const colors = {
                    red: (s) => `\x1b[31m${s}\x1b[0m`,
                    yellow: (s) => `\x1b[33m${s}\x1b[0m`,
                    cyan: (s) => `\x1b[36m${s}\x1b[0m`,
                };
                console.error('');
                console.error(colors.red('error:') + ' relq.config.ts not found');
                console.error('');
                console.error(colors.yellow('hint:') + ` Run ${colors.cyan('relq init')} to create one or use ${colors.cyan('--config')} to specify a path.`);
                console.error('');
                process.exit(1);
            }
            config = await loadConfigWithEnv(foundConfig);
            if (requiresDbConnection(command, flags) && !config.connection?.host && !config.connection?.url) {
                const colors = {
                    red: (s) => `\x1b[31m${s}\x1b[0m`,
                    yellow: (s) => `\x1b[33m${s}\x1b[0m`,
                    cyan: (s) => `\x1b[36m${s}\x1b[0m`,
                };
                console.error('');
                console.error(colors.red('error:') + ' No database connection configured');
                console.error('');
                console.error(colors.yellow('hint:') + ` Run ${colors.cyan('relq init')} or set DATABASE_* environment variables.`);
                console.error('');
                process.exit(1);
            }
        }
        catch (error) {
            console.error('Error loading config:', error instanceof Error ? error.message : error);
            process.exit(1);
        }
    }
    const context = { config, args, flags, projectRoot: resolvedProjectRoot };
    try {
        switch (command) {
            case 'init':
                await (0, init_1.initCommand)(context);
                break;
            case 'status':
                await (0, status_1.statusCommand)(context);
                break;
            case 'diff':
                await (0, diff_1.diffCommand)(context);
                break;
            case 'pull':
                await (0, pull_1.pullCommand)(context);
                break;
            case 'commit':
                await (0, commit_1.commitCommand)(context);
                break;
            case 'add':
                await (0, add_1.addCommand)(context);
                break;
            case 'generate':
                await (0, generate_1.generateCommand)(context);
                break;
            case 'push':
                await (0, push_1.pushCommand)(context);
                break;
            case 'history':
            case 'log':
                await (0, log_1.logCommand)(context);
                break;
            case 'show':
                await (0, log_1.showCommand)(context);
                break;
            case 'fetch':
                await (0, fetch_1.fetchCommand)(context);
                break;
            case 'rollback':
            case 'revert':
                await (0, rollback_1.rollbackCommand)(context);
                break;
            case 'resolve':
                await (0, resolve_1.resolveCommand)(context);
                break;
            case 'reset':
                await (0, reset_1.resetCommand)(context);
                break;
            case 'stash':
                await (0, stash_1.stashCommand)(context);
                break;
            case 'branch':
                await (0, branch_1.branchCommand)(context);
                break;
            case 'checkout':
            case 'switch':
                console.log('');
                console.log('⚠️  Branch switching is currently disabled.');
                console.log('');
                console.log('This feature will be available when Relq Postgres Native is officially launched.');
                console.log('For now, work on a single branch and use merge to combine schemas.');
                console.log('');
                break;
            case 'merge':
                await (0, merge_1.mergeCommand)(context);
                break;
            case 'tag':
                await (0, tag_1.tagCommand)(context);
                break;
            case 'cherry-pick':
                await (0, cherry_pick_1.cherryPickCommand)(context);
                break;
            case 'remote':
                await (0, remote_1.remoteCommand)(context);
                break;
            case 'introspect':
                await (0, introspect_1.introspectCommand)(context);
                break;
            case 'validate':
                await (0, validate_1.validateCommand)(context);
                break;
            case 'schema:ast':
            case 'ast':
                await (0, schema_ast_1.schemaAstCommand)(context);
                break;
            case 'sync':
                await (0, sync_1.syncCommand)(context);
                break;
            case 'import':
                await (0, import_1.importCommand)(args[0], {
                    output: flags.output,
                    includeFunctions: Boolean(flags['include-functions']),
                    includeTriggers: Boolean(flags['include-triggers']),
                    force: Boolean(flags.force),
                    dryRun: Boolean(flags['dry-run']),
                    theirs: Boolean(flags.theirs),
                    ours: Boolean(flags.ours),
                    abort: Boolean(flags.abort),
                }, resolvedProjectRoot);
                break;
            case 'export':
                await (0, export_1.exportCommand)(context);
                break;
            case 'migrate':
                console.log('Note: "migrate" is deprecated, use "push" instead.\n');
                await (0, push_1.pushCommand)(context);
                break;
            default:
                console.error(`Error: Unknown command "${command}"\n`);
                printHelp();
                process.exit(1);
        }
    }
    catch (error) {
        console.error('Error:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
}
const fromDev = process.argv.filter(arg => arg.endsWith('index.ts')).length > 0;
if (fromDev) {
    main().catch(console.error);
}
