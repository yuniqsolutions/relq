import * as fs from 'fs';
import * as path from 'path';
import { isInitialized, getStagedChanges, getUnstagedChanges, getHead, loadCommit, } from "./repo-manager.js";
export { colors, createSpinner, fatal, error, warning, hint, success, confirm, select, formatBytes, formatDuration, progressBar, requireInit, } from "./cli-utils.js";
import { colors, error, hint, fatal } from "./cli-utils.js";
export function info(message) {
    console.log(message);
}
export function getWorkingTreeStatus(projectRoot = process.cwd()) {
    const initialized = isInitialized(projectRoot);
    const head = initialized ? getHead(projectRoot) : null;
    const headCommit = head ? loadCommit(head, projectRoot) : null;
    const staged = initialized ? getStagedChanges(projectRoot) : [];
    const unstaged = initialized ? getUnstagedChanges(projectRoot) : [];
    return {
        isInitialized: initialized,
        hasHead: !!head,
        headHash: head,
        headMessage: headCommit?.message || null,
        stagedChanges: staged,
        unstagedChanges: unstaged,
        isClean: staged.length === 0 && unstaged.length === 0,
        hasUncommittedChanges: staged.length > 0,
        hasUnstagedChanges: unstaged.length > 0,
    };
}
export function requireRepository(projectRoot = process.cwd()) {
    if (!isInitialized(projectRoot)) {
        fatal('not a relq repository (or any of the parent directories): .relq');
    }
}
export function requireCleanWorkingTree(projectRoot = process.cwd(), operation = 'operation') {
    const status = getWorkingTreeStatus(projectRoot);
    if (status.isClean) {
        return { clean: true };
    }
    const lines = [];
    if (status.hasUnstagedChanges && status.hasUncommittedChanges) {
        lines.push(`Your local changes would be overwritten by ${operation}.`);
        lines.push(`Please commit your changes or stash them before you ${operation}.`);
    }
    else if (status.hasUncommittedChanges) {
        lines.push(`You have uncommitted changes.`);
        lines.push(`Please commit your changes before you ${operation}.`);
    }
    else {
        lines.push(`You have unstaged changes.`);
        lines.push(`Please stage and commit your changes before you ${operation}.`);
    }
    return { clean: false, message: lines.join('\n') };
}
export function printDirtyWorkingTreeError(status, operation) {
    console.log('');
    if (status.hasUnstagedChanges && status.hasUncommittedChanges) {
        error(`Your local changes would be overwritten by ${operation}.`);
        hint(`Commit your changes or stash them before you ${operation}.`);
    }
    else if (status.hasUncommittedChanges) {
        error(`You have uncommitted changes.`);
        hint(`Please commit your changes before you ${operation}.`);
    }
    else {
        error(`You have unstaged changes.`);
        hint(`Please stage and commit your changes before you ${operation}.`);
    }
    console.log('');
    if (status.hasUncommittedChanges) {
        console.log(`Changes to be committed:`);
        console.log(`  ${colors.gray('(use "relq restore --staged <file>..." to unstage)')}`);
        console.log('');
        for (const change of status.stagedChanges.slice(0, 10)) {
            const prefix = change.type === 'CREATE' ? 'new' : change.type === 'DROP' ? 'deleted' : 'modified';
            const color = change.type === 'CREATE' ? colors.green : change.type === 'DROP' ? colors.red : colors.yellow;
            console.log(`\t${color(`${prefix}:`.padEnd(12))}${change.objectName}`);
        }
        if (status.stagedChanges.length > 10) {
            console.log(`\t${colors.gray(`... and ${status.stagedChanges.length - 10} more`)}`);
        }
        console.log('');
    }
    if (status.hasUnstagedChanges) {
        console.log(`Changes not staged for commit:`);
        console.log(`  ${colors.gray('(use "relq add <file>..." to update what will be committed)')}`);
        console.log(`  ${colors.gray('(use "relq restore <file>..." to discard changes in working directory)')}`);
        console.log('');
        for (const change of status.unstagedChanges.slice(0, 10)) {
            const prefix = change.type === 'CREATE' ? 'new' : change.type === 'DROP' ? 'deleted' : 'modified';
            const color = change.type === 'CREATE' ? colors.green : change.type === 'DROP' ? colors.red : colors.yellow;
            console.log(`\t${color(`${prefix}:`.padEnd(12))}${change.objectName}`);
        }
        if (status.unstagedChanges.length > 10) {
            console.log(`\t${colors.gray(`... and ${status.unstagedChanges.length - 10} more`)}`);
        }
        console.log('');
    }
    console.log('Aborting.');
}
export function detectConflicts(localChanges, incomingChanges) {
    const conflicts = [];
    const localByKey = new Map();
    for (const change of localChanges) {
        const key = `${change.objectType}:${change.parentName || ''}:${change.objectName}`;
        localByKey.set(key, change);
    }
    const incomingByKey = new Map();
    for (const change of incomingChanges) {
        const key = `${change.objectType}:${change.parentName || ''}:${change.objectName}`;
        incomingByKey.set(key, change);
    }
    for (const [key, localChange] of localByKey) {
        const incomingChange = incomingByKey.get(key);
        if (incomingChange) {
            conflicts.push({
                objectType: localChange.objectType,
                objectName: localChange.objectName,
                localChange,
                incomingChange,
            });
        }
    }
    return {
        hasConflicts: conflicts.length > 0,
        conflicts,
    };
}
export function printConflictError(conflictInfo, operation) {
    console.log('');
    error(`Automatic ${operation} failed; fix conflicts and then commit the result.`);
    console.log('');
    console.log(`CONFLICT (content): Merge conflict in schema`);
    console.log('');
    for (const conflict of conflictInfo.conflicts.slice(0, 10)) {
        console.log(`  ${colors.red('both modified:')}   ${conflict.objectType.toLowerCase()} ${conflict.objectName}`);
    }
    if (conflictInfo.conflicts.length > 10) {
        console.log(`  ${colors.gray(`... and ${conflictInfo.conflicts.length - 10} more conflicts`)}`);
    }
    console.log('');
    hint(`Fix conflicts manually and use:`);
    hint(`  relq add .          - to mark resolution`);
    hint(`  relq commit         - to complete the ${operation}`);
    console.log('');
    hint(`Or abort the ${operation} with:`);
    hint(`  relq ${operation} --abort`);
    console.log('');
}
export function checkUncommittedChanges(projectRoot = process.cwd()) {
    const status = getWorkingTreeStatus(projectRoot);
    if (status.isClean) {
        return { status: 'clean' };
    }
    if (status.hasUnstagedChanges) {
        return { status: 'needs_staging', changes: status.unstagedChanges };
    }
    if (status.hasUncommittedChanges) {
        return { status: 'needs_commit', changes: status.stagedChanges };
    }
    return { status: 'clean' };
}
export function printMergeStrategyHelp() {
    console.log('');
    console.log('Resolution options:');
    console.log(`  ${colors.cyan('--theirs')}   Accept all incoming changes (overwrite local)`);
    console.log(`  ${colors.cyan('--ours')}     Keep all local changes (reject incoming)`);
    console.log(`  ${colors.cyan('--force')}    Force operation, overwrite local changes`);
    console.log(`  ${colors.cyan('--abort')}    Abort and restore previous state`);
    console.log('');
}
export function validatePostgresSQL(content) {
    const errors = [];
    const warnings = [];
    if (!content.trim()) {
        errors.push('SQL file is empty');
        return { valid: false, errors, warnings };
    }
    const hasValidStatements = /\b(CREATE|ALTER|DROP|INSERT|UPDATE|DELETE|SELECT|GRANT|REVOKE|COMMENT)\b/i.test(content);
    if (!hasValidStatements) {
        errors.push('No valid SQL statements found');
    }
    let contentForQuoteCheck = content;
    contentForQuoteCheck = contentForQuoteCheck.replace(/--[^\n]*/g, '');
    contentForQuoteCheck = contentForQuoteCheck.replace(/\/\*[\s\S]*?\*\//g, '');
    contentForQuoteCheck = contentForQuoteCheck.replace(/\$([a-zA-Z_]*)\$[\s\S]*?\$\1\$/g, '');
    const openParens = (contentForQuoteCheck.match(/\(/g) || []).length;
    const closeParens = (contentForQuoteCheck.match(/\)/g) || []).length;
    if (Math.abs(openParens - closeParens) > 5) {
        errors.push(`Significantly unbalanced parentheses: ${openParens} opening, ${closeParens} closing`);
    }
    const hasPostgresPatterns = (/\bSERIAL\b/i.test(content) ||
        /\bTEXT\b/i.test(content) ||
        /\bJSONB?\b/i.test(content) ||
        /\bUUID\b/i.test(content) ||
        /\bTIMESTAMPTZ\b/i.test(content) ||
        /\bBOOLEAN\b/i.test(content) ||
        /\bCREATE\s+TABLE\b/i.test(content) ||
        /\bCREATE\s+TYPE\b/i.test(content) ||
        /\bCREATE\s+EXTENSION\b/i.test(content));
    if (!hasPostgresPatterns) {
        warnings.push('No PostgreSQL-specific syntax detected. Ensure this is a PostgreSQL schema.');
    }
    if (/\bDROP\s+DATABASE\b/i.test(content)) {
        warnings.push('Found DROP DATABASE statement - this may be dangerous');
    }
    if (/\bTRUNCATE\b/i.test(content)) {
        warnings.push('Found TRUNCATE statement - this will delete data');
    }
    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
}
export function readSQLFile(filePath) {
    const absolutePath = path.resolve(filePath);
    if (!fs.existsSync(absolutePath)) {
        return { error: `pathspec '${filePath}' did not match any files` };
    }
    const stat = fs.statSync(absolutePath);
    if (stat.isDirectory()) {
        return { error: `'${filePath}' is a directory, not a file` };
    }
    const content = fs.readFileSync(absolutePath, 'utf-8');
    const validation = validatePostgresSQL(content);
    return { content, validation };
}
