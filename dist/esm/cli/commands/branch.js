import * as fs from 'fs';
import * as path from 'path';
import { colors, fatal } from "../utils/spinner.js";
import { isInitialized, getHead } from "../utils/repo-manager.js";
function loadBranchState(projectRoot) {
    const branchPath = path.join(projectRoot, '.relq', 'branches.json');
    if (fs.existsSync(branchPath)) {
        return JSON.parse(fs.readFileSync(branchPath, 'utf-8'));
    }
    const head = getHead(projectRoot);
    return {
        current: 'main',
        branches: { main: head || '' }
    };
}
function saveBranchState(state, projectRoot) {
    const branchPath = path.join(projectRoot, '.relq', 'branches.json');
    fs.writeFileSync(branchPath, JSON.stringify(state, null, 2));
}
export async function branchCommand(context) {
    const { args, flags, projectRoot } = context;
    console.log('');
    if (!isInitialized(projectRoot)) {
        fatal('not a relq repository (or any parent directories): .relq', `Run ${colors.cyan('relq init')} to initialize.`);
    }
    const state = loadBranchState(projectRoot);
    const deleteFlag = flags['d'] === true || flags['delete'] === true;
    const renameFlag = flags['m'] === true || flags['move'] === true;
    if (deleteFlag) {
        const branchName = args[0];
        if (!branchName) {
            fatal('Please specify branch name', `Usage: ${colors.cyan('relq branch -d <name>')}`);
        }
        if (branchName === state.current) {
            fatal(`Cannot delete the branch '${branchName}' which you are currently on`);
        }
        if (!state.branches[branchName]) {
            fatal(`Branch '${branchName}' not found`, `Use ${colors.cyan('relq branch')} to list available branches.`);
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
            fatal('Missing arguments', `Usage: ${colors.cyan('relq branch -m <old> <new>')}`);
        }
        if (!state.branches[oldName]) {
            fatal(`Branch '${oldName}' not found`, `Use ${colors.cyan('relq branch')} to list available branches.`);
        }
        if (state.branches[newName]) {
            fatal(`A branch named '${newName}' already exists`);
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
            fatal(`A branch named '${branchName}' already exists`);
        }
        const head = getHead(projectRoot);
        if (!head) {
            fatal('No commits yet', `Run ${colors.cyan('relq pull')} or ${colors.cyan('relq import')} first.`);
        }
        state.branches[branchName] = head;
        saveBranchState(state, projectRoot);
        console.log(`Created branch '${branchName}'`);
        console.log('');
        return;
    }
    const branches = Object.keys(state.branches).sort();
    if (branches.length === 0) {
        console.log(`${colors.muted('No branches.')}`);
        return;
    }
    for (const name of branches) {
        const isCurrent = name === state.current;
        const prefix = isCurrent ? colors.green('* ') : '  ';
        const branchName = isCurrent ? colors.green(name) : name;
        console.log(`${prefix}${branchName}`);
    }
    console.log('');
}
export default branchCommand;
