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
exports.branchCommand = branchCommand;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const spinner_1 = require("../utils/spinner.cjs");
const repo_manager_1 = require("../utils/repo-manager.cjs");
function loadBranchState(projectRoot) {
    const branchPath = path.join(projectRoot, '.relq', 'branches.json');
    if (fs.existsSync(branchPath)) {
        return JSON.parse(fs.readFileSync(branchPath, 'utf-8'));
    }
    const head = (0, repo_manager_1.getHead)(projectRoot);
    return {
        current: 'main',
        branches: { main: head || '' }
    };
}
function saveBranchState(state, projectRoot) {
    const branchPath = path.join(projectRoot, '.relq', 'branches.json');
    fs.writeFileSync(branchPath, JSON.stringify(state, null, 2));
}
async function branchCommand(context) {
    const { args, flags, projectRoot } = context;
    console.log('');
    if (!(0, repo_manager_1.isInitialized)(projectRoot)) {
        (0, spinner_1.fatal)('not a relq repository (or any parent directories): .relq', `Run ${spinner_1.colors.cyan('relq init')} to initialize.`);
    }
    const state = loadBranchState(projectRoot);
    const deleteFlag = flags['d'] === true || flags['delete'] === true;
    const renameFlag = flags['m'] === true || flags['move'] === true;
    if (deleteFlag) {
        const branchName = args[0];
        if (!branchName) {
            (0, spinner_1.fatal)('Please specify branch name', `Usage: ${spinner_1.colors.cyan('relq branch -d <name>')}`);
        }
        if (branchName === state.current) {
            (0, spinner_1.fatal)(`Cannot delete the branch '${branchName}' which you are currently on`);
        }
        if (!state.branches[branchName]) {
            (0, spinner_1.fatal)(`Branch '${branchName}' not found`, `Use ${spinner_1.colors.cyan('relq branch')} to list available branches.`);
        }
        delete state.branches[branchName];
        saveBranchState(state, projectRoot);
        console.log(`Deleted branch '${branchName}'`);
        console.log('');
        return;
    }
    if (renameFlag) {
        const oldName = args[0];
        const newName = args[1];
        if (!oldName || !newName) {
            (0, spinner_1.fatal)('Missing arguments', `Usage: ${spinner_1.colors.cyan('relq branch -m <old> <new>')}`);
        }
        if (!state.branches[oldName]) {
            (0, spinner_1.fatal)(`Branch '${oldName}' not found`, `Use ${spinner_1.colors.cyan('relq branch')} to list available branches.`);
        }
        if (state.branches[newName]) {
            (0, spinner_1.fatal)(`A branch named '${newName}' already exists`);
        }
        state.branches[newName] = state.branches[oldName];
        delete state.branches[oldName];
        if (state.current === oldName)
            state.current = newName;
        saveBranchState(state, projectRoot);
        console.log(`Renamed '${oldName}' to '${newName}'`);
        console.log('');
        return;
    }
    if (args[0]) {
        const branchName = args[0];
        if (state.branches[branchName]) {
            (0, spinner_1.fatal)(`A branch named '${branchName}' already exists`);
        }
        const head = (0, repo_manager_1.getHead)(projectRoot);
        if (!head) {
            (0, spinner_1.fatal)('No commits yet', `Run ${spinner_1.colors.cyan('relq pull')} or ${spinner_1.colors.cyan('relq import')} first.`);
        }
        state.branches[branchName] = head;
        saveBranchState(state, projectRoot);
        console.log(`Created branch '${branchName}'`);
        console.log('');
        return;
    }
    const branches = Object.keys(state.branches).sort();
    if (branches.length === 0) {
        console.log(`${spinner_1.colors.muted('No branches.')}`);
        return;
    }
    for (const name of branches) {
        const isCurrent = name === state.current;
        const prefix = isCurrent ? spinner_1.colors.green('* ') : '  ';
        const branchName = isCurrent ? spinner_1.colors.green(name) : name;
        console.log(`${prefix}${branchName}`);
    }
    console.log('');
}
exports.default = branchCommand;
