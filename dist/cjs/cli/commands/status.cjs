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
exports.statusCommand = statusCommand;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const env_loader_1 = require("../utils/env-loader.cjs");
const spinner_1 = require("../utils/spinner.cjs");
const relqignore_1 = require("../utils/relqignore.cjs");
const repo_manager_1 = require("../utils/repo-manager.cjs");
async function statusCommand(context) {
    const { config, flags, projectRoot } = context;
    const connection = config?.connection;
    console.log('');
    if (!(0, repo_manager_1.isInitialized)(projectRoot)) {
        (0, spinner_1.fatal)('not a relq repository (or any parent directories): .relq', `Run ${spinner_1.colors.cyan('relq init')} to initialize.`);
    }
    const head = (0, repo_manager_1.getHead)(projectRoot);
    const staged = (0, repo_manager_1.getStagedChanges)(projectRoot);
    const unstaged = (0, repo_manager_1.getUnstagedChanges)(projectRoot);
    if (head) {
        const headCommit = (0, repo_manager_1.loadCommit)(head, projectRoot);
        console.log(`On commit ${spinner_1.colors.yellow((0, repo_manager_1.shortHash)(head))}`);
        if (headCommit) {
            console.log(`${spinner_1.colors.muted(`"${headCommit.message}"`)}`);
        }
    }
    else {
        console.log(`${spinner_1.colors.muted('No commits yet')}`);
    }
    if (connection) {
        console.log(`Database: ${spinner_1.colors.cyan((0, env_loader_1.getConnectionDescription)(connection))}`);
    }
    console.log('');
    if (staged.length > 0) {
        console.log(`${spinner_1.colors.green('Changes to be committed:')}`);
        console.log(`  ${spinner_1.colors.muted('(use "relq restore --staged <name>..." to unstage)')}`);
        console.log('');
        displayChanges(staged, '        ');
        console.log('');
    }
    if (unstaged.length > 0) {
        console.log(`${spinner_1.colors.red('Changes not staged for commit:')}`);
        console.log(`  ${spinner_1.colors.muted('(use "relq add <name>..." to stage)')}`);
        console.log(`  ${spinner_1.colors.muted('(use "relq restore <name>..." to discard)')}`);
        console.log('');
        displayChanges(unstaged, '      ');
        console.log('');
    }
    const ignorePatterns = (0, relqignore_1.loadRelqignore)(projectRoot);
    const relqignorePath = path.join(projectRoot, '.relqignore');
    if (ignorePatterns.length > 0 && fs.existsSync(relqignorePath)) {
        const userPatterns = ignorePatterns.filter(p => !p.raw.startsWith('_relq_') &&
            !p.raw.startsWith('pg_') &&
            !p.raw.startsWith('_temp_') &&
            !p.raw.startsWith('tmp_'));
        if (userPatterns.length > 0) {
            console.log(`${spinner_1.colors.muted(`${userPatterns.length} pattern(s) active from .relqignore`)}`);
            console.log('');
        }
    }
    if (staged.length === 0 && unstaged.length === 0) {
        console.log(`${spinner_1.colors.green('nothing to commit, working tree clean')}`);
        console.log('');
        console.log(`${spinner_1.colors.muted('Run')} ${spinner_1.colors.cyan('relq pull')} ${spinner_1.colors.muted('to sync with database.')}`);
        console.log(`${spinner_1.colors.muted('Run')} ${spinner_1.colors.cyan('relq import <file>')} ${spinner_1.colors.muted('to import SQL schema.')}`);
    }
    else {
        if (staged.length > 0 && unstaged.length === 0) {
            console.log(`${spinner_1.colors.muted('Run')} ${spinner_1.colors.cyan('relq commit -m "message"')} ${spinner_1.colors.muted('to commit.')}`);
        }
        else if (unstaged.length > 0) {
            console.log(`${spinner_1.colors.muted('Run')} ${spinner_1.colors.cyan('relq add .')} ${spinner_1.colors.muted('to stage all changes.')}`);
        }
    }
    console.log('');
}
function displayChanges(changes, indent = '') {
    const byType = new Map();
    for (const change of changes) {
        const key = change.objectType;
        if (!byType.has(key)) {
            byType.set(key, []);
        }
        byType.get(key).push(change);
    }
    const order = ['TABLE', 'COLUMN', 'INDEX', 'CONSTRAINT', 'PRIMARY_KEY', 'FOREIGN_KEY', 'CHECK', 'EXCLUSION', 'EXTENSION', 'ENUM', 'DOMAIN', 'FUNCTION', 'TRIGGER', 'VIEW'];
    const sorted = [...byType.entries()].sort((a, b) => {
        const aIdx = order.indexOf(a[0]);
        const bIdx = order.indexOf(b[0]);
        return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
    });
    for (const [type, typeChanges] of sorted) {
        for (const change of typeChanges) {
            const color = change.type === 'CREATE' ? spinner_1.colors.green :
                change.type === 'DROP' ? spinner_1.colors.red :
                    spinner_1.colors.yellow;
            const typeLabel = getTypeLabel(change.type, change.objectType);
            const objectName = change.parentName
                ? `${change.parentName}.${change.objectName}`
                : change.objectName;
            console.log(`${indent}${color(typeLabel.padEnd(16))} ${objectName}`);
        }
    }
}
function getTypeLabel(changeType, objectType) {
    const objectName = objectType.toLowerCase().replace(/_/g, ' ');
    switch (changeType) {
        case 'CREATE':
            return `new ${objectName}:`;
        case 'DROP':
            return `deleted:`;
        case 'ALTER':
            return `modified:`;
        case 'RENAME':
            return `renamed:`;
        default:
            return `${changeType.toLowerCase()}:`;
    }
}
exports.default = statusCommand;
