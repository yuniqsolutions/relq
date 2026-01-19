import * as fs from 'fs';
import * as path from 'path';
import { colors, fatal } from "../utils/spinner.js";
import { isInitialized, getStagedChanges, getUnstagedChanges, } from "../utils/repo-manager.js";
export async function stashCommand(context) {
    const { args, flags, projectRoot } = context;
    const subcommand = args[0] || 'push';
    console.log('');
    if (!isInitialized(projectRoot)) {
        fatal('not a relq repository (or any parent directories): .relq', `Run ${colors.cyan('relq init')} to initialize.`);
    }
    const stashDir = path.join(projectRoot, '.relq', 'stash');
    switch (subcommand) {
        case 'push':
        case 'save':
            await stashPush(projectRoot, stashDir, flags['m'] || 'WIP');
            break;
        case 'pop':
            await stashPop(projectRoot, stashDir);
            break;
        case 'list':
            await stashList(stashDir);
            break;
        case 'drop':
            await stashDrop(stashDir);
            break;
        default:
            await stashPush(projectRoot, stashDir, subcommand);
    }
}
async function stashPush(projectRoot, stashDir, message) {
    const staged = getStagedChanges(projectRoot);
    const unstaged = getUnstagedChanges(projectRoot);
    if (staged.length === 0 && unstaged.length === 0) {
        console.log(`${colors.muted('No changes to stash.')}`);
        console.log('');
        return;
    }
    if (!fs.existsSync(stashDir)) {
        fs.mkdirSync(stashDir, { recursive: true });
    }
    const stashFiles = fs.readdirSync(stashDir).filter(f => f.endsWith('.json'));
    const stashIdx = stashFiles.length;
    const stash = {
        message,
        timestamp: new Date().toISOString(),
        staged,
        unstaged,
    };
    fs.writeFileSync(path.join(stashDir, `stash-${stashIdx}.json`), JSON.stringify(stash, null, 2));
    const stagedPath = path.join(projectRoot, '.relq', 'staged.json');
    const unstagedPath = path.join(projectRoot, '.relq', 'unstaged.json');
    if (fs.existsSync(stagedPath))
        fs.writeFileSync(stagedPath, '[]');
    if (fs.existsSync(unstagedPath))
        fs.writeFileSync(unstagedPath, '[]');
    console.log('Saved working directory');
    console.log(`   stash@{${stashIdx}}: ${message}`);
    console.log('');
}
async function stashPop(projectRoot, stashDir) {
    if (!fs.existsSync(stashDir)) {
        console.log(`${colors.muted('No stashes found.')}`);
        return;
    }
    const stashFiles = fs.readdirSync(stashDir).filter(f => f.endsWith('.json')).sort().reverse();
    if (stashFiles.length === 0) {
        console.log(`${colors.muted('No stashes found.')}`);
        return;
    }
    const stashPath = path.join(stashDir, stashFiles[0]);
    const stash = JSON.parse(fs.readFileSync(stashPath, 'utf-8'));
    const stagedPath = path.join(projectRoot, '.relq', 'staged.json');
    const unstagedPath = path.join(projectRoot, '.relq', 'unstaged.json');
    if (stash.staged.length > 0) {
        fs.writeFileSync(stagedPath, JSON.stringify(stash.staged, null, 2));
    }
    if (stash.unstaged.length > 0) {
        fs.writeFileSync(unstagedPath, JSON.stringify(stash.unstaged, null, 2));
    }
    fs.unlinkSync(stashPath);
    console.log('Applied stash and dropped');
    console.log(`   ${stash.message}`);
    console.log('');
}
async function stashList(stashDir) {
    if (!fs.existsSync(stashDir)) {
        console.log(`${colors.muted('No stashes.')}`);
        return;
    }
    const stashFiles = fs.readdirSync(stashDir).filter(f => f.endsWith('.json')).sort();
    if (stashFiles.length === 0) {
        console.log(`${colors.muted('No stashes.')}`);
        return;
    }
    for (let i = 0; i < stashFiles.length; i++) {
        const stash = JSON.parse(fs.readFileSync(path.join(stashDir, stashFiles[i]), 'utf-8'));
        console.log(`stash@{${i}}: ${stash.message} (${stash.staged.length + stash.unstaged.length} changes)`);
    }
    console.log('');
}
async function stashDrop(stashDir) {
    if (!fs.existsSync(stashDir)) {
        console.log(`${colors.muted('No stashes.')}`);
        return;
    }
    const stashFiles = fs.readdirSync(stashDir).filter(f => f.endsWith('.json')).sort().reverse();
    if (stashFiles.length === 0) {
        console.log(`${colors.muted('No stashes.')}`);
        return;
    }
    fs.unlinkSync(path.join(stashDir, stashFiles[0]));
    console.log('Dropped stash');
    console.log('');
}
export default stashCommand;
