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
exports.stashCommand = stashCommand;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const spinner_1 = require("../utils/spinner.cjs");
const repo_manager_1 = require("../utils/repo-manager.cjs");
async function stashCommand(context) {
    const { args, flags, projectRoot } = context;
    const subcommand = args[0] || 'push';
    console.log('');
    if (!(0, repo_manager_1.isInitialized)(projectRoot)) {
        (0, spinner_1.fatal)('not a relq repository (or any parent directories): .relq', `Run ${spinner_1.colors.cyan('relq init')} to initialize.`);
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
    const staged = (0, repo_manager_1.getStagedChanges)(projectRoot);
    const unstaged = (0, repo_manager_1.getUnstagedChanges)(projectRoot);
    if (staged.length === 0 && unstaged.length === 0) {
        console.log(`${spinner_1.colors.muted('No changes to stash.')}`);
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
        console.log(`${spinner_1.colors.muted('No stashes found.')}`);
        return;
    }
    const stashFiles = fs.readdirSync(stashDir).filter(f => f.endsWith('.json')).sort().reverse();
    if (stashFiles.length === 0) {
        console.log(`${spinner_1.colors.muted('No stashes found.')}`);
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
        console.log(`${spinner_1.colors.muted('No stashes.')}`);
        return;
    }
    const stashFiles = fs.readdirSync(stashDir).filter(f => f.endsWith('.json')).sort();
    if (stashFiles.length === 0) {
        console.log(`${spinner_1.colors.muted('No stashes.')}`);
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
        console.log(`${spinner_1.colors.muted('No stashes.')}`);
        return;
    }
    const stashFiles = fs.readdirSync(stashDir).filter(f => f.endsWith('.json')).sort().reverse();
    if (stashFiles.length === 0) {
        console.log(`${spinner_1.colors.muted('No stashes.')}`);
        return;
    }
    fs.unlinkSync(path.join(stashDir, stashFiles[0]));
    console.log('Dropped stash');
    console.log('');
}
exports.default = stashCommand;
