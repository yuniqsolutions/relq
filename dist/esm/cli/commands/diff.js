import { requireValidConfig } from "../utils/config-loader.js";
import { fastIntrospectDatabase } from "../utils/fast-introspect.js";
import { getConnectionDescription } from "../utils/env-loader.js";
import { colors, createSpinner, fatal } from "../utils/cli-utils.js";
import { isInitialized, loadSnapshot, getStagedChanges, getUnstagedChanges, } from "../utils/repo-manager.js";
import { getChangeDisplayName, generateChangeSQL, sortChangesByDependency } from "../utils/change-tracker.js";
export async function diffCommand(context) {
    const { config, args, flags, projectRoot } = context;
    console.log('');
    if (!isInitialized(projectRoot)) {
        fatal('not a relq repository (or any parent directories): .relq', `Run ${colors.cyan('relq init')} to initialize.`);
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
            fatal('No configuration found', `Run ${colors.cyan('relq init')} to create one.`);
        }
        await requireValidConfig(config, { calledFrom: 'diff' });
        await showOriginDiff(config, projectRoot, showSQL);
        return;
    }
    await showUnstagedDiff(projectRoot, showSQL);
}
function getSymbol(change) {
    if (change.type === 'CREATE')
        return colors.green('+');
    if (change.type === 'DROP')
        return colors.red('-');
    return colors.yellow('~');
}
async function showUnstagedDiff(projectRoot, showSQL) {
    const unstaged = getUnstagedChanges(projectRoot);
    if (unstaged.length === 0) {
        console.log(`${colors.green('No unstaged changes.')}`);
        console.log(`${colors.muted('Use')} ${colors.cyan('relq diff remote/live')} ${colors.muted('to compare with remote.')}`);
        console.log('');
        return;
    }
    console.log(`${colors.bold('Unstaged changes:')}`);
    console.log('');
    const sorted = sortChangesByDependency(unstaged);
    for (const change of sorted) {
        console.log(`   ${getSymbol(change)} ${change.objectType.toLowerCase()}: ${getChangeDisplayName(change)}`);
    }
    if (showSQL) {
        console.log('');
        console.log(`${colors.bold('SQL:')}`);
        for (const change of sorted) {
            const sql = generateChangeSQL(change);
            if (sql)
                console.log(`${colors.cyan(sql)}`);
        }
    }
    console.log('');
    console.log(`${colors.muted('Use')} ${colors.cyan('relq add .')} ${colors.muted('to stage all.')}`);
    console.log('');
}
async function showStagedDiff(projectRoot, showSQL) {
    const staged = getStagedChanges(projectRoot);
    if (staged.length === 0) {
        console.log(`${colors.green('No staged changes.')}`);
        console.log(`${colors.muted('Use')} ${colors.cyan('relq add .')} ${colors.muted('to stage changes.')}`);
        console.log('');
        return;
    }
    console.log(`${colors.bold('Staged changes:')}`);
    console.log('');
    const sorted = sortChangesByDependency(staged);
    for (const change of sorted) {
        console.log(`   ${getSymbol(change)} ${change.objectType.toLowerCase()}: ${getChangeDisplayName(change)}`);
    }
    if (showSQL) {
        console.log('');
        console.log(`${colors.bold('SQL:')}`);
        for (const change of sorted) {
            const sql = generateChangeSQL(change);
            if (sql)
                console.log(`${colors.cyan(sql)}`);
        }
    }
    console.log('');
    console.log(`${colors.muted('Use')} ${colors.cyan('relq commit -m "message"')} ${colors.muted('to commit.')}`);
    console.log('');
}
async function showOriginDiff(config, projectRoot, showSQL) {
    const connection = config.connection;
    const spinner = createSpinner();
    const snapshot = loadSnapshot(projectRoot);
    if (!snapshot) {
        console.log(`${colors.yellow('No local snapshot.')}`);
        console.log(`${colors.muted('Run')} ${colors.cyan('relq pull')} ${colors.muted('first.')}`);
        console.log('');
        return;
    }
    spinner.start(`Connecting to ${getConnectionDescription(connection)}...`);
    const remoteDb = await fastIntrospectDatabase(connection, undefined, {
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
    console.log(`${colors.bold('Differences:')}`);
    console.log('');
    for (const d of diffs.slice(0, 20)) {
        const sym = d.type === 'added' ? colors.green('+') : d.type === 'removed' ? colors.red('-') : colors.yellow('~');
        console.log(`   ${sym} ${d.description}`);
    }
    if (diffs.length > 20) {
        console.log(`   ${colors.muted(`... and ${diffs.length - 20} more`)}`);
    }
    console.log('');
    console.log(`${colors.muted('Use')} ${colors.cyan('relq pull')} ${colors.muted('to sync local with remote.')}`);
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
export default diffCommand;
