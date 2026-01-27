import { initCommand } from "./commands/init.js";
import { pullCommand } from "./commands/pull.js";
import { pushCommand } from "./commands/push.js";
import { generateCommand } from "./commands/generate.js";
import { introspectCommand } from "./commands/introspect.js";
import { syncCommand } from "./commands/sync.js";
import { statusCommand } from "./commands/status.js";
import { diffCommand } from "./commands/diff.js";
import { logCommand, showCommand } from "./commands/log.js";
import { rollbackCommand } from "./commands/rollback.js";
import { commitCommand } from "./commands/commit.js";
import { fetchCommand } from "./commands/fetch.js";
import { addCommand } from "./commands/add.js";
import { importCommand } from "./commands/import.js";
import { exportCommand } from "./commands/export.js";
import { resolveCommand } from "./commands/resolve.js";
import { resetCommand } from "./commands/reset.js";
import { stashCommand } from "./commands/stash.js";
import { branchCommand } from "./commands/branch.js";
import { mergeCommand } from "./commands/merge.js";
import { tagCommand } from "./commands/tag.js";
import { cherryPickCommand } from "./commands/cherry-pick.js";
import { remoteCommand } from "./commands/remote.js";
import { validateCommand } from "./commands/validate.js";
import { schemaAstCommand } from "./commands/schema-ast.js";
import * as fs from 'fs';
import * as path from 'path';
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
            const { loadConfigWithEnv, findConfigFileRecursive } = await import("./utils/config-loader.js");
            const { findProjectRoot } = await import("./utils/project-root.js");
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
            const hasConnection = config.connection?.host || config.connection?.url || config.connection?.aws?.hostname;
            if (requiresDbConnection(command, flags) && !hasConnection) {
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
                await initCommand(context);
                break;
            case 'status':
                await statusCommand(context);
                break;
            case 'diff':
                await diffCommand(context);
                break;
            case 'pull':
                await pullCommand(context);
                break;
            case 'commit':
                await commitCommand(context);
                break;
            case 'add':
                await addCommand(context);
                break;
            case 'generate':
                await generateCommand(context);
                break;
            case 'push':
                await pushCommand(context);
                break;
            case 'history':
            case 'log':
                await logCommand(context);
                break;
            case 'show':
                await showCommand(context);
                break;
            case 'fetch':
                await fetchCommand(context);
                break;
            case 'rollback':
            case 'revert':
                await rollbackCommand(context);
                break;
            case 'resolve':
                await resolveCommand(context);
                break;
            case 'reset':
                await resetCommand(context);
                break;
            case 'stash':
                await stashCommand(context);
                break;
            case 'branch':
                await branchCommand(context);
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
                await mergeCommand(context);
                break;
            case 'tag':
                await tagCommand(context);
                break;
            case 'cherry-pick':
                await cherryPickCommand(context);
                break;
            case 'remote':
                await remoteCommand(context);
                break;
            case 'introspect':
                await introspectCommand(context);
                break;
            case 'validate':
                await validateCommand(context);
                break;
            case 'schema:ast':
            case 'ast':
                await schemaAstCommand(context);
                break;
            case 'sync':
                await syncCommand(context);
                break;
            case 'import':
                await importCommand(args[0], {
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
                await exportCommand(context);
                break;
            case 'migrate':
                console.log('Note: "migrate" is deprecated, use "push" instead.\n');
                await pushCommand(context);
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
export { main };
const fromDev = process.argv.filter(arg => arg.endsWith('index.ts')).length > 0;
if (fromDev) {
    main().catch(console.error);
}
