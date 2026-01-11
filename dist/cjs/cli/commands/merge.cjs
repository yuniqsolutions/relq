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
exports.mergeCommand = mergeCommand;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const cli_utils_1 = require("../utils/cli-utils.cjs");
const repo_manager_1 = require("../utils/repo-manager.cjs");
function loadBranchState(projectRoot) {
    const branchPath = path.join(projectRoot, '.relq', 'branches.json');
    if (fs.existsSync(branchPath)) {
        return JSON.parse(fs.readFileSync(branchPath, 'utf-8'));
    }
    const head = require("../utils/repo-manager.cjs").getHead(projectRoot);
    return { current: 'main', branches: { main: head || '' } };
}
function saveBranchState(state, projectRoot) {
    const branchPath = path.join(projectRoot, '.relq', 'branches.json');
    fs.writeFileSync(branchPath, JSON.stringify(state, null, 2));
}
async function mergeCommand(context) {
    const { config, args, flags, projectRoot } = context;
    console.log('');
    if (!(0, repo_manager_1.isInitialized)(projectRoot)) {
        (0, cli_utils_1.fatal)('not a relq repository (or any parent directories): .relq', `Run ${cli_utils_1.colors.cyan('relq init')} to initialize.`);
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
            (0, cli_utils_1.fatal)('There is no merge to abort (MERGE_STATE missing)');
        }
    }
    if (fs.existsSync(mergeStatePath)) {
        const mergeState = JSON.parse(fs.readFileSync(mergeStatePath, 'utf-8'));
        (0, cli_utils_1.fatal)(`Merge in progress from '${mergeState.fromBranch}'`, `Use ${cli_utils_1.colors.cyan('relq resolve')} to resolve conflicts\nOr ${cli_utils_1.colors.cyan('relq merge --abort')} to cancel`);
    }
    if (!branchName) {
        (0, cli_utils_1.fatal)('Please specify a branch to merge', `Usage: ${cli_utils_1.colors.cyan('relq merge <branch>')}`);
    }
    const state = loadBranchState(projectRoot);
    if (!state.branches[branchName]) {
        (0, cli_utils_1.fatal)(`Branch not found: ${branchName}`, `Use ${cli_utils_1.colors.cyan('relq branch')} to list available branches.`);
    }
    if (branchName === state.current) {
        (0, cli_utils_1.fatal)('Cannot merge branch into itself');
    }
    const spinner = (0, cli_utils_1.createSpinner)();
    spinner.start(`Merging '${branchName}' into '${state.current}'...`);
    try {
        const currentHash = (0, repo_manager_1.getHead)(projectRoot);
        const incomingHash = state.branches[branchName];
        if (!currentHash || !incomingHash) {
            spinner.stop();
            (0, cli_utils_1.fatal)('No commits to merge', `Run ${cli_utils_1.colors.cyan('relq pull')} first.`);
        }
        if (currentHash === incomingHash) {
            spinner.succeed('Already up to date');
            console.log('');
            return;
        }
        const currentCommit = (0, repo_manager_1.loadCommit)(currentHash, projectRoot);
        const incomingCommit = (0, repo_manager_1.loadCommit)(incomingHash, projectRoot);
        if (!currentCommit || !incomingCommit) {
            spinner.stop();
            (0, cli_utils_1.fatal)('Cannot load commit data - repository may be corrupt');
        }
        const currentSnapshot = (0, repo_manager_1.loadSnapshot)(projectRoot) || currentCommit.schema;
        const incomingSnapshot = incomingCommit.schema;
        if (!currentSnapshot || !incomingSnapshot) {
            spinner.stop();
            (0, cli_utils_1.fatal)('No snapshot data - repository may be corrupt');
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
                console.log(`   ${cli_utils_1.colors.red('conflict:')} ${c.objectType.toLowerCase()} ${name}`);
            }
            if (conflicts.length > 5) {
                console.log(`   ${cli_utils_1.colors.muted(`... and ${conflicts.length - 5} more`)}`);
            }
            (0, cli_utils_1.fatal)(`Automatic merge failed; fix conflicts and then commit`, `Use ${cli_utils_1.colors.cyan('relq resolve --all-theirs')} to accept incoming\nOr ${cli_utils_1.colors.cyan('relq merge --abort')} to cancel`);
        }
        const mergedSnapshot = mergeSnapshots(currentSnapshot, incomingSnapshot);
        (0, repo_manager_1.saveSnapshot)(mergedSnapshot, projectRoot);
        const author = config?.author || 'Relq CLI';
        const message = `Merge branch '${branchName}' into ${state.current}`;
        const commit = (0, repo_manager_1.createCommit)(mergedSnapshot, author, message, projectRoot);
        spinner.succeed(`Merged '${branchName}' into '${state.current}'`);
        console.log(`   ${cli_utils_1.colors.yellow((0, repo_manager_1.shortHash)(commit.hash))} ${message}`);
        console.log('');
    }
    catch (err) {
        spinner.fail('Merge failed');
        (0, cli_utils_1.fatal)(err instanceof Error ? err.message : String(err));
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
exports.default = mergeCommand;
