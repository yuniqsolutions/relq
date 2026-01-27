import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { colors, createSpinner, fatal, warning } from "../utils/cli-utils.js";
import { isInitialized, getHead, setHead, loadCommit, saveSnapshot, shortHash, getAllCommits, } from "../utils/repo-manager.js";
export async function resetCommand(context) {
    const { flags, args, projectRoot } = context;
    console.log('');
    if (!isInitialized(projectRoot)) {
        fatal('not a relq repository (or any parent directories): .relq', `Run ${colors.cyan('relq init')} to initialize.`);
    }
    const hard = flags['hard'] === true;
    const soft = flags['soft'] === true;
    const target = args[0];
    if (!target) {
        fatal('Please specify a target', `Usage:\n  ${colors.cyan('relq reset --hard HEAD~1')}   Reset to previous commit\n  ${colors.cyan('relq reset --hard <hash>')}   Reset to specific commit`);
    }
    if (!hard && !soft) {
        fatal('Please specify --hard or --soft', `  ${colors.cyan('--hard')}  Discard all changes (DANGEROUS)\n  ${colors.cyan('--soft')}  Keep changes unstaged`);
    }
    const currentHead = getHead(projectRoot);
    if (!currentHead) {
        fatal('No commits yet', `Run ${colors.cyan('relq pull')} or ${colors.cyan('relq import')} first.`);
    }
    const allCommits = getAllCommits(projectRoot);
    let targetHash = null;
    if (target.startsWith('HEAD~')) {
        const n = parseInt(target.slice(5)) || 1;
        const headIndex = allCommits.findIndex(c => c.hash === currentHead);
        if (headIndex >= 0 && headIndex + n < allCommits.length) {
            targetHash = allCommits[headIndex + n].hash;
        }
    }
    else if (target === 'HEAD') {
        targetHash = currentHead;
    }
    else {
        const match = allCommits.find(c => c.hash.startsWith(target));
        if (match) {
            targetHash = match.hash;
        }
    }
    if (!targetHash) {
        const availableList = allCommits.slice(0, 5).map(c => `  ${colors.yellow(shortHash(c.hash))} ${c.message}`).join('\n');
        fatal(`Cannot find commit: ${target}`, `Available commits:\n${availableList}`);
    }
    const targetCommit = loadCommit(targetHash, projectRoot);
    if (!targetCommit) {
        fatal(`Cannot load commit: ${targetHash}`);
    }
    if (hard) {
        warning('This will discard all local changes!');
        console.log('');
        console.log(`Reset to: ${colors.yellow(shortHash(targetHash))} ${targetCommit.message}`);
        console.log('');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        const confirmed = await new Promise((resolve) => {
            rl.question(`Continue? [y/N] `, (answer) => {
                rl.close();
                resolve(answer.trim().toLowerCase() === 'y');
            });
        });
        if (!confirmed) {
            console.log(`${colors.muted('Cancelled.')}`);
            console.log('');
            return;
        }
    }
    const spinner = createSpinner();
    try {
        spinner.start(`Resetting to ${shortHash(targetHash)}...`);
        const commitPath = path.join(projectRoot, '.relq', 'commits', `${targetHash}.json`);
        if (!fs.existsSync(commitPath)) {
            spinner.stop();
            fatal('Cannot find commit data - repository may be corrupt');
        }
        const commitData = JSON.parse(fs.readFileSync(commitPath, 'utf-8'));
        const targetSnapshot = (commitData.snapshot || commitData.schema);
        if (!targetSnapshot) {
            spinner.stop();
            fatal('Commit has no snapshot data - repository may be corrupt');
        }
        if (hard) {
            saveSnapshot(targetSnapshot, projectRoot);
            setHead(targetHash, projectRoot);
            const commitsDir = path.join(projectRoot, '.relq', 'commits');
            const headIndex = allCommits.findIndex(c => c.hash === currentHead);
            const targetIndex = allCommits.findIndex(c => c.hash === targetHash);
            if (headIndex >= 0 && targetIndex > headIndex) {
                for (let i = headIndex; i < targetIndex; i++) {
                    const commitToDelete = allCommits[i];
                    const commitFile = path.join(commitsDir, `${commitToDelete.hash}.json`);
                    if (fs.existsSync(commitFile)) {
                        fs.unlinkSync(commitFile);
                    }
                }
            }
            const stagedPath = path.join(projectRoot, '.relq', 'staged.json');
            const unstagedPath = path.join(projectRoot, '.relq', 'unstaged.json');
            if (fs.existsSync(stagedPath))
                fs.unlinkSync(stagedPath);
            if (fs.existsSync(unstagedPath))
                fs.unlinkSync(unstagedPath);
            const mergeStatePath = path.join(projectRoot, '.relq', 'MERGE_STATE');
            if (fs.existsSync(mergeStatePath))
                fs.unlinkSync(mergeStatePath);
            const fileHashPath = path.join(projectRoot, '.relq', 'file_hash');
            if (fs.existsSync(fileHashPath))
                fs.unlinkSync(fileHashPath);
        }
        spinner.succeed(`Reset to ${colors.yellow(shortHash(targetHash))}`);
        console.log('');
        console.log(`HEAD is now at ${colors.yellow(shortHash(targetHash))} ${targetCommit.message}`);
        console.log('');
        if (soft) {
            console.log(`${colors.muted('Changes are unstaged. Use')} ${colors.cyan('relq status')} ${colors.muted('to see.')}`);
        }
    }
    catch (err) {
        spinner.fail('Reset failed');
        fatal(err instanceof Error ? err.message : String(err));
    }
}
export default resetCommand;
