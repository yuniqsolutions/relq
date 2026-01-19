import * as fs from 'fs';
import * as path from 'path';
import { colors, fatal, warning } from "../utils/spinner.js";
import { isInitialized, loadSnapshot, saveSnapshot, } from "../utils/repo-manager.js";
export async function resolveCommand(context) {
    const { flags, args, projectRoot } = context;
    console.log('');
    if (!isInitialized(projectRoot)) {
        fatal('not a relq repository (or any parent directories): .relq', `Run ${colors.cyan('relq init')} to initialize.`);
    }
    const mergeStatePath = path.join(projectRoot, '.relq', 'MERGE_STATE');
    if (!fs.existsSync(mergeStatePath)) {
        console.log('No conflicts to resolve');
        console.log('');
        return;
    }
    const mergeState = JSON.parse(fs.readFileSync(mergeStatePath, 'utf-8'));
    if (mergeState.conflicts.length === 0) {
        fs.unlinkSync(mergeStatePath);
        console.log('All conflicts resolved');
        console.log('');
        return;
    }
    const allTheirs = flags['all-theirs'] === true;
    const allOurs = flags['all-ours'] === true;
    const theirs = flags['theirs'] === true;
    const ours = flags['ours'] === true;
    const objectName = args[0];
    if (allTheirs) {
        console.log(`Resolving ${mergeState.conflicts.length} conflict(s) with --all-theirs`);
        console.log('');
        saveSnapshot(mergeState.remoteSnapshot, projectRoot);
        fs.unlinkSync(mergeStatePath);
        console.log('Applied remote versions for all conflicts');
        console.log('');
        console.log(`hint: run 'relq commit -m "Merge remote changes"' to complete`);
        console.log('');
        return;
    }
    if (allOurs) {
        console.log(`Resolving ${mergeState.conflicts.length} conflict(s) with --all-ours`);
        console.log('');
        fs.unlinkSync(mergeStatePath);
        console.log('Kept local versions for all conflicts');
        console.log('');
        console.log(`hint: run 'relq commit -m "Keep local changes"' to complete`);
        console.log('');
        return;
    }
    if ((theirs || ours) && objectName) {
        const conflict = mergeState.conflicts.find(c => c.objectName === objectName ||
            `${c.parentName}.${c.objectName}` === objectName);
        if (!conflict) {
            console.log(`${colors.red('error:')} No conflict found for '${objectName}'`);
            console.log('');
            console.log('Conflicts:');
            for (const c of mergeState.conflicts) {
                const name = c.parentName ? `${c.parentName}.${c.objectName}` : c.objectName;
                console.log(`   ${c.objectType}: ${name}`);
            }
            console.log('');
            return;
        }
        const localSnapshot = loadSnapshot(projectRoot);
        if (!localSnapshot) {
            console.log(`${colors.red('error:')} No local snapshot found`);
            return;
        }
        if (theirs) {
            applyResolution(localSnapshot, conflict, mergeState.remoteSnapshot, 'theirs');
            saveSnapshot(localSnapshot, projectRoot);
        }
        mergeState.conflicts = mergeState.conflicts.filter(c => c !== conflict);
        if (mergeState.conflicts.length === 0) {
            fs.unlinkSync(mergeStatePath);
            console.log('All conflicts resolved');
        }
        else {
            fs.writeFileSync(mergeStatePath, JSON.stringify(mergeState, null, 2));
            console.log(`Resolved: ${conflict.objectType} ${objectName}`);
            console.log(`${mergeState.conflicts.length} conflict(s) remaining`);
        }
        console.log('');
        return;
    }
    warning(`You have ${mergeState.conflicts.length} unresolved conflict(s):`);
    console.log('');
    for (const conflict of mergeState.conflicts) {
        const name = conflict.parentName
            ? `${conflict.parentName}.${conflict.objectName}`
            : conflict.objectName;
        console.log(`   ${colors.red('conflict:')} ${conflict.objectType.toLowerCase()} ${colors.bold(name)}`);
        console.log(`     ${colors.muted(conflict.description)}`);
    }
    console.log('');
    console.log('To resolve:');
    console.log(`  ${colors.cyan('relq resolve --theirs <name>')}  Take remote version`);
    console.log(`  ${colors.cyan('relq resolve --ours <name>')}    Keep local version`);
    console.log(`  ${colors.cyan('relq resolve --all-theirs')}     Take all remote`);
    console.log(`  ${colors.cyan('relq resolve --all-ours')}       Keep all local`);
    console.log('');
}
function applyResolution(local, conflict, remote, resolution) {
    if (resolution !== 'theirs')
        return;
    switch (conflict.objectType) {
        case 'TABLE': {
            const remoteTable = remote.tables.find(t => t.name === conflict.objectName);
            const localIdx = local.tables.findIndex(t => t.name === conflict.objectName);
            if (remoteTable) {
                if (localIdx >= 0) {
                    local.tables[localIdx] = remoteTable;
                }
                else {
                    local.tables.push(remoteTable);
                }
            }
            break;
        }
        case 'COLUMN': {
            const [tableName, colName] = conflict.objectName.includes('.')
                ? conflict.objectName.split('.')
                : [conflict.parentName, conflict.objectName];
            const remoteTable = remote.tables.find(t => t.name === tableName);
            const localTable = local.tables.find(t => t.name === tableName);
            if (remoteTable && localTable) {
                const remoteCol = remoteTable.columns.find(c => c.name === colName);
                const localIdx = localTable.columns.findIndex(c => c.name === colName);
                if (remoteCol) {
                    if (localIdx >= 0) {
                        localTable.columns[localIdx] = remoteCol;
                    }
                    else {
                        localTable.columns.push(remoteCol);
                    }
                }
            }
            break;
        }
        case 'ENUM': {
            const remoteEnum = remote.enums.find(e => e.name === conflict.objectName);
            const localIdx = local.enums.findIndex(e => e.name === conflict.objectName);
            if (remoteEnum) {
                if (localIdx >= 0) {
                    local.enums[localIdx] = remoteEnum;
                }
                else {
                    local.enums.push(remoteEnum);
                }
            }
            break;
        }
    }
}
export default resolveCommand;
