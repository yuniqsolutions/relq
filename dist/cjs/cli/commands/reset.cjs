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
exports.resetCommand = resetCommand;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const readline = __importStar(require("readline"));
const cli_utils_1 = require("../utils/cli-utils.cjs");
const repo_manager_1 = require("../utils/repo-manager.cjs");
async function resetCommand(context) {
    const { flags, args, projectRoot } = context;
    console.log('');
    if (!(0, repo_manager_1.isInitialized)(projectRoot)) {
        (0, cli_utils_1.fatal)('not a relq repository (or any parent directories): .relq', `Run ${cli_utils_1.colors.cyan('relq init')} to initialize.`);
    }
    const hard = flags['hard'] === true;
    const soft = flags['soft'] === true;
    const target = args[0];
    if (!target) {
        (0, cli_utils_1.fatal)('Please specify a target', `Usage:\n  ${cli_utils_1.colors.cyan('relq reset --hard HEAD~1')}   Reset to previous commit\n  ${cli_utils_1.colors.cyan('relq reset --hard <hash>')}   Reset to specific commit`);
    }
    if (!hard && !soft) {
        (0, cli_utils_1.fatal)('Please specify --hard or --soft', `  ${cli_utils_1.colors.cyan('--hard')}  Discard all changes (DANGEROUS)\n  ${cli_utils_1.colors.cyan('--soft')}  Keep changes unstaged`);
    }
    const currentHead = (0, repo_manager_1.getHead)(projectRoot);
    if (!currentHead) {
        (0, cli_utils_1.fatal)('No commits yet', `Run ${cli_utils_1.colors.cyan('relq pull')} or ${cli_utils_1.colors.cyan('relq import')} first.`);
    }
    const allCommits = (0, repo_manager_1.getAllCommits)(projectRoot);
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
        const availableList = allCommits.slice(0, 5).map(c => `  ${cli_utils_1.colors.yellow((0, repo_manager_1.shortHash)(c.hash))} ${c.message}`).join('\n');
        (0, cli_utils_1.fatal)(`Cannot find commit: ${target}`, `Available commits:\n${availableList}`);
    }
    const targetCommit = (0, repo_manager_1.loadCommit)(targetHash, projectRoot);
    if (!targetCommit) {
        (0, cli_utils_1.fatal)(`Cannot load commit: ${targetHash}`);
    }
    if (hard) {
        (0, cli_utils_1.warning)('This will discard all local changes!');
        console.log('');
        console.log(`Reset to: ${cli_utils_1.colors.yellow((0, repo_manager_1.shortHash)(targetHash))} ${targetCommit.message}`);
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
            console.log(`${cli_utils_1.colors.muted('Cancelled.')}`);
            console.log('');
            return;
        }
    }
    const spinner = (0, cli_utils_1.createSpinner)();
    try {
        spinner.start(`Resetting to ${(0, repo_manager_1.shortHash)(targetHash)}...`);
        const commitPath = path.join(projectRoot, '.relq', 'commits', `${targetHash}.json`);
        if (!fs.existsSync(commitPath)) {
            spinner.stop();
            (0, cli_utils_1.fatal)('Cannot find commit data - repository may be corrupt');
        }
        const commitData = JSON.parse(fs.readFileSync(commitPath, 'utf-8'));
        const targetSnapshot = (commitData.snapshot || commitData.schema);
        if (!targetSnapshot) {
            spinner.stop();
            (0, cli_utils_1.fatal)('Commit has no snapshot data - repository may be corrupt');
        }
        if (hard) {
            (0, repo_manager_1.saveSnapshot)(targetSnapshot, projectRoot);
            (0, repo_manager_1.setHead)(targetHash, projectRoot);
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
        spinner.succeed(`Reset to ${cli_utils_1.colors.yellow((0, repo_manager_1.shortHash)(targetHash))}`);
        console.log('');
        console.log(`HEAD is now at ${cli_utils_1.colors.yellow((0, repo_manager_1.shortHash)(targetHash))} ${targetCommit.message}`);
        console.log('');
        if (soft) {
            console.log(`${cli_utils_1.colors.muted('Changes are unstaged. Use')} ${cli_utils_1.colors.cyan('relq status')} ${cli_utils_1.colors.muted('to see.')}`);
        }
    }
    catch (err) {
        spinner.fail('Reset failed');
        (0, cli_utils_1.fatal)(err instanceof Error ? err.message : String(err));
    }
}
exports.default = resetCommand;
