import * as fs from 'fs';
import * as path from 'path';
import { colors, createSpinner } from "../utils/spinner.js";
import { isInitialized, loadCommit, loadParentCommit, loadSnapshot, saveSnapshot, createCommit, shortHash, resolveRef, } from "../utils/repo-manager.js";
export async function cherryPickCommand(context) {
    const { config, args, flags, projectRoot } = context;
    console.log('');
    if (!isInitialized(projectRoot)) {
        console.log(`${colors.red('fatal:')} not a relq repository`);
        return;
    }
    const abort = flags['abort'] === true;
    const cherryPickStatePath = path.join(projectRoot, '.relq', 'CHERRY_PICK_STATE');
    if (abort) {
        if (fs.existsSync(cherryPickStatePath)) {
            fs.unlinkSync(cherryPickStatePath);
            console.log('Cherry-pick aborted');
        }
        else {
            console.log('No cherry-pick in progress.');
        }
        console.log('');
        return;
    }
    if (fs.existsSync(cherryPickStatePath)) {
        const state = JSON.parse(fs.readFileSync(cherryPickStatePath, 'utf-8'));
        console.log(`${colors.red('error:')} Cherry-pick in progress from ${shortHash(state.fromCommit)}`);
        console.log('');
        console.log(`${colors.muted('Use')} ${colors.cyan('relq resolve')} ${colors.muted('to resolve conflicts')}`);
        console.log(`${colors.muted('Or')} ${colors.cyan('relq cherry-pick --abort')} ${colors.muted('to cancel')}`);
        console.log('');
        return;
    }
    const ref = args[0];
    if (!ref) {
        console.log(`${colors.red('error:')} Please specify a commit`);
        console.log('');
        console.log(`Usage: ${colors.cyan('relq cherry-pick <commit>')}`);
        console.log('');
        return;
    }
    const spinner = createSpinner();
    spinner.start(`Cherry-picking ${shortHash(ref)}...`);
    try {
        const hash = resolveRef(ref, projectRoot);
        if (!hash) {
            spinner.fail(`Commit not found: ${ref}`);
            return;
        }
        const targetCommit = loadCommit(hash, projectRoot);
        const parentCommit = loadParentCommit(hash, projectRoot);
        if (!targetCommit) {
            spinner.fail('Cannot load commit');
            return;
        }
        if (!parentCommit) {
            spinner.fail('Cannot cherry-pick first commit (no parent)');
            return;
        }
        const diff = calculateCommitDiff(parentCommit.schema, targetCommit.schema);
        const currentSnapshot = loadSnapshot(projectRoot);
        if (!currentSnapshot) {
            spinner.fail('No snapshot found');
            return;
        }
        const conflicts = detectCherryPickConflicts(currentSnapshot, diff);
        if (conflicts.length > 0) {
            const state = {
                fromCommit: hash,
                originalMessage: targetCommit.message,
                conflicts,
                diff,
                createdAt: new Date().toISOString(),
            };
            fs.writeFileSync(cherryPickStatePath, JSON.stringify(state, null, 2));
            spinner.fail(`${conflicts.length} conflict(s) detected`);
            console.log('');
            for (const c of conflicts.slice(0, 5)) {
                const name = c.parentName ? `${c.parentName}.${c.objectName}` : c.objectName;
                console.log(`   ${colors.red('conflict:')} ${c.objectType.toLowerCase()} ${name}`);
                console.log(`      ${colors.muted(c.description)}`);
            }
            if (conflicts.length > 5) {
                console.log(`   ${colors.muted(`... and ${conflicts.length - 5} more`)}`);
            }
            console.log('');
            console.log(`${colors.muted('Use')} ${colors.cyan('relq resolve --theirs')} ${colors.muted('to resolve')}`);
            console.log(`${colors.muted('Or')} ${colors.cyan('relq cherry-pick --abort')} ${colors.muted('to cancel')}`);
            console.log('');
            return;
        }
        const newSnapshot = applyCommitDiff(currentSnapshot, diff);
        saveSnapshot(newSnapshot, projectRoot);
        const author = config?.author || 'Relq CLI';
        const message = `Cherry-picked ${shortHash(hash)}: ${targetCommit.message}`;
        const commit = createCommit(newSnapshot, author, message, projectRoot);
        spinner.succeed(`Cherry-picked ${colors.yellow(shortHash(hash))}`);
        console.log(`   ${colors.cyan(commit.message)}`);
        console.log('');
    }
    catch (error) {
        spinner.fail('Cherry-pick failed');
        console.error(colors.red(`Error: ${error instanceof Error ? error.message : error}`));
    }
}
function calculateCommitDiff(parent, target) {
    const diff = {
        tablesAdded: [],
        tablesRemoved: [],
        tablesModified: [],
        enumsAdded: [],
        enumsRemoved: [],
        columnsAdded: [],
        columnsRemoved: [],
    };
    const parentTables = new Map(parent.tables.map(t => [t.name, t]));
    const targetTables = new Map(target.tables.map(t => [t.name, t]));
    for (const [name, table] of targetTables) {
        if (!parentTables.has(name)) {
            diff.tablesAdded.push(table);
        }
    }
    for (const [name] of parentTables) {
        if (!targetTables.has(name)) {
            diff.tablesRemoved.push(name);
        }
    }
    for (const [name, targetTable] of targetTables) {
        const parentTable = parentTables.get(name);
        if (!parentTable)
            continue;
        const parentCols = new Map(parentTable.columns.map(c => [c.name, c]));
        const targetCols = new Map(targetTable.columns.map(c => [c.name, c]));
        const changes = { columnsAdded: [], columnsRemoved: [] };
        for (const [colName, col] of targetCols) {
            if (!parentCols.has(colName)) {
                changes.columnsAdded.push(col);
            }
        }
        for (const [colName] of parentCols) {
            if (!targetCols.has(colName)) {
                changes.columnsRemoved.push(colName);
            }
        }
        if (changes.columnsAdded.length > 0 || changes.columnsRemoved.length > 0) {
            diff.tablesModified.push({ name, changes });
        }
    }
    const parentEnums = new Set(parent.enums.map(e => e.name));
    const targetEnums = new Map(target.enums.map(e => [e.name, e]));
    for (const [name, e] of targetEnums) {
        if (!parentEnums.has(name)) {
            diff.enumsAdded.push(e);
        }
    }
    for (const name of parentEnums) {
        if (!targetEnums.has(name)) {
            diff.enumsRemoved.push(name);
        }
    }
    return diff;
}
function detectCherryPickConflicts(current, diff) {
    const conflicts = [];
    for (const table of diff.tablesAdded) {
        if (current.tables.find(t => t.name === table.name)) {
            conflicts.push({
                objectType: 'TABLE',
                objectName: table.name,
                currentValue: 'exists',
                incomingValue: 'add',
                description: 'Table already exists in current snapshot',
            });
        }
    }
    for (const tableName of diff.tablesRemoved) {
        if (!current.tables.find(t => t.name === tableName)) {
            conflicts.push({
                objectType: 'TABLE',
                objectName: tableName,
                currentValue: 'missing',
                incomingValue: 'remove',
                description: 'Table does not exist in current snapshot',
            });
        }
    }
    for (const mod of diff.tablesModified) {
        const currentTable = current.tables.find(t => t.name === mod.name);
        if (!currentTable) {
            conflicts.push({
                objectType: 'TABLE',
                objectName: mod.name,
                currentValue: 'missing',
                incomingValue: 'modify',
                description: 'Table does not exist in current snapshot',
            });
            continue;
        }
        for (const col of mod.changes.columnsAdded) {
            if (currentTable.columns.find(c => c.name === col.name)) {
                conflicts.push({
                    objectType: 'COLUMN',
                    objectName: col.name,
                    parentName: mod.name,
                    currentValue: 'exists',
                    incomingValue: 'add',
                    description: 'Column already exists',
                });
            }
        }
    }
    for (const e of diff.enumsAdded) {
        if (current.enums.find(en => en.name === e.name)) {
            conflicts.push({
                objectType: 'ENUM',
                objectName: e.name,
                currentValue: 'exists',
                incomingValue: 'add',
                description: 'Enum already exists',
            });
        }
    }
    return conflicts;
}
function applyCommitDiff(snapshot, diff) {
    const result = JSON.parse(JSON.stringify(snapshot));
    for (const table of diff.tablesAdded) {
        result.tables.push(table);
    }
    result.tables = result.tables.filter(t => !diff.tablesRemoved.includes(t.name));
    for (const mod of diff.tablesModified) {
        const table = result.tables.find(t => t.name === mod.name);
        if (!table)
            continue;
        for (const col of mod.changes.columnsAdded) {
            table.columns.push(col);
        }
        table.columns = table.columns.filter(c => !mod.changes.columnsRemoved.includes(c.name));
    }
    for (const e of diff.enumsAdded) {
        result.enums.push(e);
    }
    result.enums = result.enums.filter(e => !diff.enumsRemoved.includes(e.name));
    return result;
}
export default cherryPickCommand;
