import * as fs from 'fs';
import * as path from 'path';
import { colors, createSpinner, fatal } from "../utils/cli-utils.js";
import { isInitialized, getHead, loadCommit, loadSnapshot, saveSnapshot, createCommit, shortHash, } from "../utils/repo-manager.js";
function loadBranchState(projectRoot) {
    const branchPath = path.join(projectRoot, '.relq', 'branches.json');
    if (fs.existsSync(branchPath)) {
        return JSON.parse(fs.readFileSync(branchPath, 'utf-8'));
    }
    const head = require('../utils/repo-manager').getHead(projectRoot);
    return { current: 'main', branches: { main: head || '' } };
}
function saveBranchState(state, projectRoot) {
    const branchPath = path.join(projectRoot, '.relq', 'branches.json');
    fs.writeFileSync(branchPath, JSON.stringify(state, null, 2));
}
export async function mergeCommand(context) {
    const { config, args, flags, projectRoot } = context;
    console.log('');
    if (!isInitialized(projectRoot)) {
        fatal('not a relq repository (or any parent directories): .relq', `Run ${colors.cyan('relq init')} to initialize.`);
    }
    const branchName = args[0];
    const abort = flags['abort'] === true;
    const mergeStatePath = path.join(projectRoot, '.relq', 'MERGE_STATE');
    if (abort) {
        if (fs.existsSync(mergeStatePath)) {
            fs.unlinkSync(mergeStatePath);
            console.log('Merge aborted');
            console.log('');
            return;
        }
        else {
            fatal('There is no merge to abort (MERGE_STATE missing)');
        }
    }
    if (fs.existsSync(mergeStatePath)) {
        const mergeState = JSON.parse(fs.readFileSync(mergeStatePath, 'utf-8'));
        fatal(`Merge in progress from '${mergeState.fromBranch}'`, `Use ${colors.cyan('relq resolve')} to resolve conflicts\nOr ${colors.cyan('relq merge --abort')} to cancel`);
    }
    if (!branchName) {
        fatal('Please specify a branch to merge', `Usage: ${colors.cyan('relq merge <branch>')}`);
    }
    const state = loadBranchState(projectRoot);
    if (!state.branches[branchName]) {
        fatal(`Branch not found: ${branchName}`, `Use ${colors.cyan('relq branch')} to list available branches.`);
    }
    if (branchName === state.current) {
        fatal('Cannot merge branch into itself');
    }
    const spinner = createSpinner();
    spinner.start(`Merging '${branchName}' into '${state.current}'...`);
    try {
        const currentHash = getHead(projectRoot);
        const incomingHash = state.branches[branchName];
        if (!currentHash || !incomingHash) {
            spinner.stop();
            fatal('No commits to merge', `Run ${colors.cyan('relq pull')} first.`);
        }
        if (currentHash === incomingHash) {
            spinner.succeed('Already up to date');
            console.log('');
            return;
        }
        const currentCommit = loadCommit(currentHash, projectRoot);
        const incomingCommit = loadCommit(incomingHash, projectRoot);
        if (!currentCommit || !incomingCommit) {
            spinner.stop();
            fatal('Cannot load commit data - repository may be corrupt');
        }
        const currentSnapshot = loadSnapshot(projectRoot) || currentCommit.schema;
        const incomingSnapshot = incomingCommit.schema;
        if (!currentSnapshot || !incomingSnapshot) {
            spinner.stop();
            fatal('No snapshot data - repository may be corrupt');
        }
        const conflicts = detectMergeConflicts(currentSnapshot, incomingSnapshot);
        if (conflicts.length > 0) {
            const mergeState = {
                fromBranch: branchName,
                toBranch: state.current,
                conflicts,
                incomingSnapshot,
                createdAt: new Date().toISOString(),
            };
            fs.writeFileSync(mergeStatePath, JSON.stringify(mergeState, null, 2));
            spinner.fail(`${conflicts.length} conflict(s) detected`);
            console.log('');
            for (const c of conflicts.slice(0, 5)) {
                const name = c.parentName ? `${c.parentName}.${c.objectName}` : c.objectName;
                console.log(`   ${colors.red('conflict:')} ${c.objectType.toLowerCase()} ${name}`);
            }
            if (conflicts.length > 5) {
                console.log(`   ${colors.muted(`... and ${conflicts.length - 5} more`)}`);
            }
            fatal(`Automatic merge failed; fix conflicts and then commit`, `Use ${colors.cyan('relq resolve --all-theirs')} to accept incoming\nOr ${colors.cyan('relq merge --abort')} to cancel`);
        }
        const mergedSnapshot = mergeSnapshots(currentSnapshot, incomingSnapshot);
        saveSnapshot(mergedSnapshot, projectRoot);
        const author = config?.author || 'Relq CLI';
        const message = `Merge branch '${branchName}' into ${state.current}`;
        const commit = createCommit(mergedSnapshot, author, message, projectRoot);
        spinner.succeed(`Merged '${branchName}' into '${state.current}'`);
        console.log(`   ${colors.yellow(shortHash(commit.hash))} ${message}`);
        console.log('');
    }
    catch (err) {
        spinner.fail('Merge failed');
        fatal(err instanceof Error ? err.message : String(err));
    }
}
function detectMergeConflicts(current, incoming) {
    const conflicts = [];
    for (const currentTable of current.tables) {
        const incomingTable = incoming.tables.find(t => t.name === currentTable.name);
        if (!incomingTable)
            continue;
        for (const currentCol of currentTable.columns) {
            const incomingCol = incomingTable.columns.find(c => c.name === currentCol.name);
            if (!incomingCol)
                continue;
            if (currentCol.type !== incomingCol.type) {
                conflicts.push({
                    objectType: 'COLUMN',
                    objectName: currentCol.name,
                    parentName: currentTable.name,
                    currentValue: currentCol.type,
                    incomingValue: incomingCol.type,
                    description: `Type differs: ${currentCol.type} vs ${incomingCol.type}`,
                });
            }
        }
    }
    for (const currentEnum of current.enums) {
        const incomingEnum = incoming.enums.find(e => e.name === currentEnum.name);
        if (!incomingEnum)
            continue;
        const currentVals = JSON.stringify(currentEnum.values.sort());
        const incomingVals = JSON.stringify(incomingEnum.values.sort());
        if (currentVals !== incomingVals) {
            conflicts.push({
                objectType: 'ENUM',
                objectName: currentEnum.name,
                currentValue: currentEnum.values,
                incomingValue: incomingEnum.values,
                description: 'Values differ',
            });
        }
    }
    return conflicts;
}
function mergeSnapshots(current, incoming) {
    const result = JSON.parse(JSON.stringify(current));
    for (const table of incoming.tables) {
        if (!result.tables.find(t => t.name === table.name)) {
            result.tables.push(table);
        }
    }
    for (const e of incoming.enums) {
        if (!result.enums.find(x => x.name === e.name)) {
            result.enums.push(e);
        }
    }
    for (const d of incoming.domains) {
        if (!result.domains.find(x => x.name === d.name)) {
            result.domains.push(d);
        }
    }
    return result;
}
export default mergeCommand;
