import * as fs from 'fs';
import * as path from 'path';
import { getConnectionDescription } from "../utils/env-loader.js";
import { colors, fatal } from "../utils/spinner.js";
import { loadRelqignore, } from "../utils/relqignore.js";
import { isInitialized, getHead, loadCommit, shortHash, getStagedChanges, getUnstagedChanges, } from "../utils/repo-manager.js";
export async function statusCommand(context) {
    const { config, flags, projectRoot } = context;
    const connection = config?.connection;
    console.log('');
    if (!isInitialized(projectRoot)) {
        fatal('not a relq repository (or any parent directories): .relq', `Run ${colors.cyan('relq init')} to initialize.`);
    }
    const head = getHead(projectRoot);
    const staged = getStagedChanges(projectRoot);
    const unstaged = getUnstagedChanges(projectRoot);
    if (head) {
        const headCommit = loadCommit(head, projectRoot);
        console.log(`On commit ${colors.yellow(shortHash(head))}`);
        if (headCommit) {
            console.log(`${colors.muted(`"${headCommit.message}"`)}`);
        }
    }
    else {
        console.log(`${colors.muted('No commits yet')}`);
    }
    if (connection) {
        console.log(`Database: ${colors.cyan(getConnectionDescription(connection))}`);
    }
    console.log('');
    if (staged.length > 0) {
        console.log(`${colors.green('Changes to be committed:')}`);
        console.log(`  ${colors.muted('(use "relq restore --staged <name>..." to unstage)')}`);
        console.log('');
        displayChanges(staged, '        ');
        console.log('');
    }
    if (unstaged.length > 0) {
        console.log(`${colors.red('Changes not staged for commit:')}`);
        console.log(`  ${colors.muted('(use "relq add <name>..." to stage)')}`);
        console.log(`  ${colors.muted('(use "relq restore <name>..." to discard)')}`);
        console.log('');
        displayChanges(unstaged, '      ');
        console.log('');
    }
    const ignorePatterns = loadRelqignore(projectRoot);
    const relqignorePath = path.join(projectRoot, '.relqignore');
    if (ignorePatterns.length > 0 && fs.existsSync(relqignorePath)) {
        const userPatterns = ignorePatterns.filter(p => !p.raw.startsWith('_relq_') &&
            !p.raw.startsWith('pg_') &&
            !p.raw.startsWith('_temp_') &&
            !p.raw.startsWith('tmp_'));
        if (userPatterns.length > 0) {
            console.log(`${colors.muted(`${userPatterns.length} pattern(s) active from .relqignore`)}`);
            console.log('');
        }
    }
    if (staged.length === 0 && unstaged.length === 0) {
        console.log(`${colors.green('nothing to commit, working tree clean')}`);
        console.log('');
        console.log(`${colors.muted('Run')} ${colors.cyan('relq pull')} ${colors.muted('to sync with database.')}`);
        console.log(`${colors.muted('Run')} ${colors.cyan('relq import <file>')} ${colors.muted('to import SQL schema.')}`);
    }
    else {
        if (staged.length > 0 && unstaged.length === 0) {
            console.log(`${colors.muted('Run')} ${colors.cyan('relq commit -m "message"')} ${colors.muted('to commit.')}`);
        }
        else if (unstaged.length > 0) {
            console.log(`${colors.muted('Run')} ${colors.cyan('relq add .')} ${colors.muted('to stage all changes.')}`);
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
            const color = change.type === 'CREATE' ? colors.green :
                change.type === 'DROP' ? colors.red :
                    colors.yellow;
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
export default statusCommand;
