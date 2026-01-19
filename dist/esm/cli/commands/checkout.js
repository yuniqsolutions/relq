import * as fs from 'fs';
import * as path from 'path';
import { fatal, error, hint } from "../utils/cli-utils.js";
import { isInitialized, getHead, setHead, loadCommit, saveSnapshot, getStagedChanges, getUnstagedChanges, } from "../utils/repo-manager.js";
function loadBranchState(projectRoot) {
    const branchPath = path.join(projectRoot, '.relq', 'branches.json');
    if (fs.existsSync(branchPath)) {
        return JSON.parse(fs.readFileSync(branchPath, 'utf-8'));
    }
    const head = getHead(projectRoot);
    return { current: 'main', branches: { main: head || '' } };
}
function saveBranchState(state, projectRoot) {
    const branchPath = path.join(projectRoot, '.relq', 'branches.json');
    fs.writeFileSync(branchPath, JSON.stringify(state, null, 2));
}
export async function checkoutCommand(context) {
    const { args, flags, projectRoot } = context;
    console.log('');
    if (!isInitialized(projectRoot)) {
        fatal('not a relq repository (or any parent directories): .relq', "run 'relq init' to initialize");
    }
    const createBranch = flags['b'] === true;
    const branchName = args[0];
    if (!branchName) {
        error('please specify a branch');
        console.log("usage: relq checkout <branch>");
        console.log("       relq checkout -b <new-branch>");
        return;
    }
    const staged = getStagedChanges(projectRoot);
    const unstaged = getUnstagedChanges(projectRoot);
    if (staged.length > 0 || unstaged.length > 0) {
        error('you have uncommitted changes');
        hint("run 'relq commit -m <message>' to commit");
        hint("run 'relq stash' to stash changes");
        return;
    }
    const state = loadBranchState(projectRoot);
    if (createBranch) {
        if (state.branches[branchName]) {
            fatal(`branch '${branchName}' already exists`);
        }
        const head = getHead(projectRoot);
        if (!head) {
            fatal('no commits yet', "run 'relq pull' or 'relq import' first");
        }
        state.branches[branchName] = head;
        state.current = branchName;
        saveBranchState(state, projectRoot);
        console.log(`Switched to a new branch '${branchName}'`);
        return;
    }
    if (!state.branches[branchName]) {
        error(`pathspec '${branchName}' did not match any branch known to relq`);
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
    const currentHead = getHead(projectRoot);
    if (currentHead) {
        state.branches[state.current] = currentHead;
    }
    const targetHash = state.branches[branchName];
    const targetCommit = loadCommit(targetHash, projectRoot);
    if (!targetCommit) {
        fatal('cannot find commit for branch');
    }
    if (targetCommit.schema) {
        saveSnapshot(targetCommit.schema, projectRoot);
    }
    setHead(targetHash, projectRoot);
    state.current = branchName;
    saveBranchState(state, projectRoot);
    console.log(`Switched to branch '${branchName}'`);
    console.log('');
}
export default checkoutCommand;
