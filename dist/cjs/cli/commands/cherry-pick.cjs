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
exports.cherryPickCommand = cherryPickCommand;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const spinner_1 = require("../utils/spinner.cjs");
const repo_manager_1 = require("../utils/repo-manager.cjs");
async function cherryPickCommand(context) {
    const { config, args, flags, projectRoot } = context;
    console.log('');
    if (!(0, repo_manager_1.isInitialized)(projectRoot)) {
        console.log(`${spinner_1.colors.red('fatal:')} not a relq repository`);
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
        console.log(`${spinner_1.colors.red('error:')} Cherry-pick in progress from ${(0, repo_manager_1.shortHash)(state.fromCommit)}`);
        console.log('');
        console.log(`${spinner_1.colors.muted('Use')} ${spinner_1.colors.cyan('relq resolve')} ${spinner_1.colors.muted('to resolve conflicts')}`);
        console.log(`${spinner_1.colors.muted('Or')} ${spinner_1.colors.cyan('relq cherry-pick --abort')} ${spinner_1.colors.muted('to cancel')}`);
        console.log('');
        return;
    }
    const ref = args[0];
    if (!ref) {
        console.log(`${spinner_1.colors.red('error:')} Please specify a commit`);
        console.log('');
        console.log(`Usage: ${spinner_1.colors.cyan('relq cherry-pick <commit>')}`);
        console.log('');
        return;
    }
    const spinner = (0, spinner_1.createSpinner)();
    spinner.start(`Cherry-picking ${(0, repo_manager_1.shortHash)(ref)}...`);
    try {
        const hash = (0, repo_manager_1.resolveRef)(ref, projectRoot);
        if (!hash) {
            spinner.fail(`Commit not found: ${ref}`);
            return;
        }
        const targetCommit = (0, repo_manager_1.loadCommit)(hash, projectRoot);
        const parentCommit = (0, repo_manager_1.loadParentCommit)(hash, projectRoot);
        if (!targetCommit) {
            spinner.fail('Cannot load commit');
            return;
        }
        if (!parentCommit) {
            spinner.fail('Cannot cherry-pick first commit (no parent)');
            return;
        }
        const diff = calculateCommitDiff(parentCommit.schema, targetCommit.schema);
        const currentSnapshot = (0, repo_manager_1.loadSnapshot)(projectRoot);
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
                console.log(`   ${spinner_1.colors.red('conflict:')} ${c.objectType.toLowerCase()} ${name}`);
                console.log(`      ${spinner_1.colors.muted(c.description)}`);
            }
            if (conflicts.length > 5) {
                console.log(`   ${spinner_1.colors.muted(`... and ${conflicts.length - 5} more`)}`);
            }
            console.log('');
            console.log(`${spinner_1.colors.muted('Use')} ${spinner_1.colors.cyan('relq resolve --theirs')} ${spinner_1.colors.muted('to resolve')}`);
            console.log(`${spinner_1.colors.muted('Or')} ${spinner_1.colors.cyan('relq cherry-pick --abort')} ${spinner_1.colors.muted('to cancel')}`);
            console.log('');
            return;
        }
        const newSnapshot = applyCommitDiff(currentSnapshot, diff);
        (0, repo_manager_1.saveSnapshot)(newSnapshot, projectRoot);
        const author = config?.author || 'Relq CLI';
        const message = `Cherry-picked ${(0, repo_manager_1.shortHash)(hash)}: ${targetCommit.message}`;
        const commit = (0, repo_manager_1.createCommit)(newSnapshot, author, message, projectRoot);
        spinner.succeed(`Cherry-picked ${spinner_1.colors.yellow((0, repo_manager_1.shortHash)(hash))}`);
        console.log(`   ${spinner_1.colors.cyan(commit.message)}`);
        console.log('');
    }
    catch (error) {
        spinner.fail('Cherry-pick failed');
        console.error(spinner_1.colors.red(`Error: ${error instanceof Error ? error.message : error}`));
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
exports.default = cherryPickCommand;
