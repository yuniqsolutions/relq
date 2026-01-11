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
exports.checkoutCommand = checkoutCommand;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const cli_utils_1 = require("../utils/cli-utils.cjs");
const repo_manager_1 = require("../utils/repo-manager.cjs");
function loadBranchState(projectRoot) {
    const branchPath = path.join(projectRoot, '.relq', 'branches.json');
    if (fs.existsSync(branchPath)) {
        return JSON.parse(fs.readFileSync(branchPath, 'utf-8'));
    }
    const head = (0, repo_manager_1.getHead)(projectRoot);
    return { current: 'main', branches: { main: head || '' } };
}
function saveBranchState(state, projectRoot) {
    const branchPath = path.join(projectRoot, '.relq', 'branches.json');
    fs.writeFileSync(branchPath, JSON.stringify(state, null, 2));
}
async function checkoutCommand(context) {
    const { args, flags, projectRoot } = context;
    console.log('');
    if (!(0, repo_manager_1.isInitialized)(projectRoot)) {
        (0, cli_utils_1.fatal)('not a relq repository (or any parent directories): .relq', "run 'relq init' to initialize");
    }
    const createBranch = flags['b'] === true;
    const branchName = args[0];
    if (!branchName) {
        (0, cli_utils_1.error)('please specify a branch');
        console.log("usage: relq checkout <branch>");
        console.log("       relq checkout -b <new-branch>");
        return;
    }
    const staged = (0, repo_manager_1.getStagedChanges)(projectRoot);
    const unstaged = (0, repo_manager_1.getUnstagedChanges)(projectRoot);
    if (staged.length > 0 || unstaged.length > 0) {
        (0, cli_utils_1.error)('you have uncommitted changes');
        (0, cli_utils_1.hint)("run 'relq commit -m <message>' to commit");
        (0, cli_utils_1.hint)("run 'relq stash' to stash changes");
        return;
    }
    const state = loadBranchState(projectRoot);
    if (createBranch) {
        if (state.branches[branchName]) {
            (0, cli_utils_1.fatal)(`branch '${branchName}' already exists`);
        }
        const head = (0, repo_manager_1.getHead)(projectRoot);
        if (!head) {
            (0, cli_utils_1.fatal)('no commits yet', "run 'relq pull' or 'relq import' first");
        }
        state.branches[branchName] = head;
        state.current = branchName;
        saveBranchState(state, projectRoot);
        console.log(`Switched to a new branch '${branchName}'`);
        return;
    }
    if (!state.branches[branchName]) {
        (0, cli_utils_1.error)(`pathspec '${branchName}' did not match any branch known to relq`);
        console.log('Available branches:');
        for (const name of Object.keys(state.branches)) {
            console.log(`  ${name}`);
        }
        return;
    }
    if (state.current === branchName) {
        console.log(`Already on '${branchName}'`);
        console.log('');
        return;
    }
    const currentHead = (0, repo_manager_1.getHead)(projectRoot);
    if (currentHead) {
        state.branches[state.current] = currentHead;
    }
    const targetHash = state.branches[branchName];
    const targetCommit = (0, repo_manager_1.loadCommit)(targetHash, projectRoot);
    if (!targetCommit) {
        (0, cli_utils_1.fatal)('cannot find commit for branch');
    }
    if (targetCommit.schema) {
        (0, repo_manager_1.saveSnapshot)(targetCommit.schema, projectRoot);
    }
    (0, repo_manager_1.setHead)(targetHash, projectRoot);
    state.current = branchName;
    saveBranchState(state, projectRoot);
    console.log(`Switched to branch '${branchName}'`);
    console.log('');
}
exports.default = checkoutCommand;
