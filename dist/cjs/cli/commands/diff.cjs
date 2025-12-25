"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.diffCommand = diffCommand;
const config_loader_1 = require("../utils/config-loader.cjs");
const fast_introspect_1 = require("../utils/fast-introspect.cjs");
const env_loader_1 = require("../utils/env-loader.cjs");
const cli_utils_1 = require("../utils/cli-utils.cjs");
const repo_manager_1 = require("../utils/repo-manager.cjs");
const change_tracker_1 = require("../utils/change-tracker.cjs");
async function diffCommand(context) {
    const { config, args, flags, projectRoot } = context;
    console.log('');
    if (!(0, repo_manager_1.isInitialized)(projectRoot)) {
        (0, cli_utils_1.fatal)('not a relq repository (or any parent directories): .relq', `Run ${cli_utils_1.colors.cyan('relq init')} to initialize.`);
    }
    const showSQL = flags['sql'] === true;
    const staged = flags['staged'] === true;
    const target = args[0];
    if (staged) {
        await showStagedDiff(projectRoot, showSQL);
        return;
    }
    if (target === 'remote/live' || target === 'remote' || target === 'live' || target === 'origin') {
        if (!config) {
            (0, cli_utils_1.fatal)('No configuration found', `Run ${cli_utils_1.colors.cyan('relq init')} to create one.`);
        }
        await (0, config_loader_1.requireValidConfig)(config, { calledFrom: 'diff' });
        await showOriginDiff(config, projectRoot, showSQL);
        return;
    }
    await showUnstagedDiff(projectRoot, showSQL);
}
function getSymbol(change) {
    if (change.type === 'CREATE')
        return cli_utils_1.colors.green('+');
    if (change.type === 'DROP')
        return cli_utils_1.colors.red('-');
    return cli_utils_1.colors.yellow('~');
}
async function showUnstagedDiff(projectRoot, showSQL) {
    const unstaged = (0, repo_manager_1.getUnstagedChanges)(projectRoot);
    if (unstaged.length === 0) {
        console.log(`${cli_utils_1.colors.green('No unstaged changes.')}`);
        console.log(`${cli_utils_1.colors.muted('Use')} ${cli_utils_1.colors.cyan('relq diff remote/live')} ${cli_utils_1.colors.muted('to compare with remote.')}`);
        console.log('');
        return;
    }
    console.log(`${cli_utils_1.colors.bold('Unstaged changes:')}`);
    console.log('');
    const sorted = (0, change_tracker_1.sortChangesByDependency)(unstaged);
    for (const change of sorted) {
        console.log(`   ${getSymbol(change)} ${change.objectType.toLowerCase()}: ${(0, change_tracker_1.getChangeDisplayName)(change)}`);
    }
    if (showSQL) {
        console.log('');
        console.log(`${cli_utils_1.colors.bold('SQL:')}`);
        for (const change of sorted) {
            const sql = (0, change_tracker_1.generateChangeSQL)(change);
            if (sql)
                console.log(`${cli_utils_1.colors.cyan(sql)}`);
        }
    }
    console.log('');
    console.log(`${cli_utils_1.colors.muted('Use')} ${cli_utils_1.colors.cyan('relq add .')} ${cli_utils_1.colors.muted('to stage all.')}`);
    console.log('');
}
async function showStagedDiff(projectRoot, showSQL) {
    const staged = (0, repo_manager_1.getStagedChanges)(projectRoot);
    if (staged.length === 0) {
        console.log(`${cli_utils_1.colors.green('No staged changes.')}`);
        console.log(`${cli_utils_1.colors.muted('Use')} ${cli_utils_1.colors.cyan('relq add .')} ${cli_utils_1.colors.muted('to stage changes.')}`);
        console.log('');
        return;
    }
    console.log(`${cli_utils_1.colors.bold('Staged changes:')}`);
    console.log('');
    const sorted = (0, change_tracker_1.sortChangesByDependency)(staged);
    for (const change of sorted) {
        console.log(`   ${getSymbol(change)} ${change.objectType.toLowerCase()}: ${(0, change_tracker_1.getChangeDisplayName)(change)}`);
    }
    if (showSQL) {
        console.log('');
        console.log(`${cli_utils_1.colors.bold('SQL:')}`);
        for (const change of sorted) {
            const sql = (0, change_tracker_1.generateChangeSQL)(change);
            if (sql)
                console.log(`${cli_utils_1.colors.cyan(sql)}`);
        }
    }
    console.log('');
    console.log(`${cli_utils_1.colors.muted('Use')} ${cli_utils_1.colors.cyan('relq commit -m "message"')} ${cli_utils_1.colors.muted('to commit.')}`);
    console.log('');
}
async function showOriginDiff(config, projectRoot, showSQL) {
    const connection = config.connection;
    const spinner = (0, cli_utils_1.createSpinner)();
    const snapshot = (0, repo_manager_1.loadSnapshot)(projectRoot);
    if (!snapshot) {
        console.log(`${cli_utils_1.colors.yellow('No local snapshot.')}`);
        console.log(`${cli_utils_1.colors.muted('Run')} ${cli_utils_1.colors.cyan('relq pull')} ${cli_utils_1.colors.muted('first.')}`);
        console.log('');
        return;
    }
    spinner.start(`Connecting to ${(0, env_loader_1.getConnectionDescription)(connection)}...`);
    const remoteDb = await (0, fast_introspect_1.fastIntrospectDatabase)(connection, undefined, {
        includeFunctions: config.includeFunctions ?? false,
        includeTriggers: config.includeTriggers ?? false,
    });
    spinner.succeed(`Connected`);
    const diffs = compareSchemas(snapshot, remoteDb);
    if (diffs.length === 0) {
        console.log('');
        console.log('Local and remote are in sync.');
        console.log('');
        return;
    }
    console.log('');
    console.log(`${cli_utils_1.colors.bold('Differences:')}`);
    console.log('');
    for (const d of diffs.slice(0, 20)) {
        const sym = d.type === 'added' ? cli_utils_1.colors.green('+') : d.type === 'removed' ? cli_utils_1.colors.red('-') : cli_utils_1.colors.yellow('~');
        console.log(`   ${sym} ${d.description}`);
    }
    if (diffs.length > 20) {
        console.log(`   ${cli_utils_1.colors.muted(`... and ${diffs.length - 20} more`)}`);
    }
    console.log('');
    console.log(`${cli_utils_1.colors.muted('Use')} ${cli_utils_1.colors.cyan('relq pull')} ${cli_utils_1.colors.muted('to sync local with remote.')}`);
    console.log('');
}
function compareSchemas(local, remote) {
    const diffs = [];
    const localTableNames = local.tables.map(t => t.name);
    const remoteTableNames = (remote.tables || []).map((t) => t.name);
    for (const name of remoteTableNames) {
        if (!localTableNames.includes(name)) {
            diffs.push({ type: 'added', description: `table: ${name}` });
        }
    }
    for (const name of localTableNames) {
        if (!remoteTableNames.includes(name)) {
            diffs.push({ type: 'removed', description: `table: ${name}` });
        }
    }
    const localEnumNames = local.enums.map(e => e.name);
    const remoteEnumNames = (remote.enums || []).map((e) => e.name);
    for (const name of remoteEnumNames) {
        if (!localEnumNames.includes(name)) {
            diffs.push({ type: 'added', description: `enum: ${name}` });
        }
    }
    for (const name of localEnumNames) {
        if (!remoteEnumNames.includes(name)) {
            diffs.push({ type: 'removed', description: `enum: ${name}` });
        }
    }
    return diffs;
}
exports.default = diffCommand;
