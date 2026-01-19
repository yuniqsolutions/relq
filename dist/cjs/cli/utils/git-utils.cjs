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
exports.requireInit = exports.progressBar = exports.formatDuration = exports.formatBytes = exports.select = exports.success = exports.hint = exports.warning = exports.error = exports.fatal = exports.createSpinner = exports.colors = void 0;
exports.info = info;
exports.getWorkingTreeStatus = getWorkingTreeStatus;
exports.requireRepository = requireRepository;
exports.requireCleanWorkingTree = requireCleanWorkingTree;
exports.printDirtyWorkingTreeError = printDirtyWorkingTreeError;
exports.detectConflicts = detectConflicts;
exports.printConflictError = printConflictError;
exports.checkUncommittedChanges = checkUncommittedChanges;
exports.printMergeStrategyHelp = printMergeStrategyHelp;
exports.validatePostgresSQL = validatePostgresSQL;
exports.readSQLFile = readSQLFile;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const repo_manager_1 = require("./repo-manager.cjs");
var cli_utils_1 = require("./cli-utils.cjs");
Object.defineProperty(exports, "colors", { enumerable: true, get: function () { return cli_utils_1.colors; } });
Object.defineProperty(exports, "createSpinner", { enumerable: true, get: function () { return cli_utils_1.createSpinner; } });
Object.defineProperty(exports, "fatal", { enumerable: true, get: function () { return cli_utils_1.fatal; } });
Object.defineProperty(exports, "error", { enumerable: true, get: function () { return cli_utils_1.error; } });
Object.defineProperty(exports, "warning", { enumerable: true, get: function () { return cli_utils_1.warning; } });
Object.defineProperty(exports, "hint", { enumerable: true, get: function () { return cli_utils_1.hint; } });
Object.defineProperty(exports, "success", { enumerable: true, get: function () { return cli_utils_1.success; } });
Object.defineProperty(exports, "confirm", { enumerable: true, get: function () { return cli_utils_1.confirm; } });
Object.defineProperty(exports, "select", { enumerable: true, get: function () { return cli_utils_1.select; } });
Object.defineProperty(exports, "formatBytes", { enumerable: true, get: function () { return cli_utils_1.formatBytes; } });
Object.defineProperty(exports, "formatDuration", { enumerable: true, get: function () { return cli_utils_1.formatDuration; } });
Object.defineProperty(exports, "progressBar", { enumerable: true, get: function () { return cli_utils_1.progressBar; } });
Object.defineProperty(exports, "requireInit", { enumerable: true, get: function () { return cli_utils_1.requireInit; } });
const cli_utils_2 = require("./cli-utils.cjs");
function info(message) {
    console.log(message);
}
function getWorkingTreeStatus(projectRoot = process.cwd()) {
    const initialized = (0, repo_manager_1.isInitialized)(projectRoot);
    const head = initialized ? (0, repo_manager_1.getHead)(projectRoot) : null;
    const headCommit = head ? (0, repo_manager_1.loadCommit)(head, projectRoot) : null;
    const staged = initialized ? (0, repo_manager_1.getStagedChanges)(projectRoot) : [];
    const unstaged = initialized ? (0, repo_manager_1.getUnstagedChanges)(projectRoot) : [];
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
function requireRepository(projectRoot = process.cwd()) {
    if (!(0, repo_manager_1.isInitialized)(projectRoot)) {
        (0, cli_utils_2.fatal)('not a relq repository (or any of the parent directories): .relq');
    }
}
function requireCleanWorkingTree(projectRoot = process.cwd(), operation = 'operation') {
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
function printDirtyWorkingTreeError(status, operation) {
    console.log('');
    if (status.hasUnstagedChanges && status.hasUncommittedChanges) {
        (0, cli_utils_2.error)(`Your local changes would be overwritten by ${operation}.`);
        (0, cli_utils_2.hint)(`Commit your changes or stash them before you ${operation}.`);
    }
    else if (status.hasUncommittedChanges) {
        (0, cli_utils_2.error)(`You have uncommitted changes.`);
        (0, cli_utils_2.hint)(`Please commit your changes before you ${operation}.`);
    }
    else {
        (0, cli_utils_2.error)(`You have unstaged changes.`);
        (0, cli_utils_2.hint)(`Please stage and commit your changes before you ${operation}.`);
    }
    console.log('');
    if (status.hasUncommittedChanges) {
        console.log(`Changes to be committed:`);
        console.log(`  ${cli_utils_2.colors.gray('(use "relq restore --staged <file>..." to unstage)')}`);
        console.log('');
        for (const change of status.stagedChanges.slice(0, 10)) {
            const prefix = change.type === 'CREATE' ? 'new' : change.type === 'DROP' ? 'deleted' : 'modified';
            const color = change.type === 'CREATE' ? cli_utils_2.colors.green : change.type === 'DROP' ? cli_utils_2.colors.red : cli_utils_2.colors.yellow;
            console.log(`\t${color(`${prefix}:`.padEnd(12))}${change.objectName}`);
        }
        if (status.stagedChanges.length > 10) {
            console.log(`\t${cli_utils_2.colors.gray(`... and ${status.stagedChanges.length - 10} more`)}`);
        }
        console.log('');
    }
    if (status.hasUnstagedChanges) {
        console.log(`Changes not staged for commit:`);
        console.log(`  ${cli_utils_2.colors.gray('(use "relq add <file>..." to update what will be committed)')}`);
        console.log(`  ${cli_utils_2.colors.gray('(use "relq restore <file>..." to discard changes in working directory)')}`);
        console.log('');
        for (const change of status.unstagedChanges.slice(0, 10)) {
            const prefix = change.type === 'CREATE' ? 'new' : change.type === 'DROP' ? 'deleted' : 'modified';
            const color = change.type === 'CREATE' ? cli_utils_2.colors.green : change.type === 'DROP' ? cli_utils_2.colors.red : cli_utils_2.colors.yellow;
            console.log(`\t${color(`${prefix}:`.padEnd(12))}${change.objectName}`);
        }
        if (status.unstagedChanges.length > 10) {
            console.log(`\t${cli_utils_2.colors.gray(`... and ${status.unstagedChanges.length - 10} more`)}`);
        }
        console.log('');
    }
    console.log('Aborting.');
}
function detectConflicts(localChanges, incomingChanges) {
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
function printConflictError(conflictInfo, operation) {
    console.log('');
    (0, cli_utils_2.error)(`Automatic ${operation} failed; fix conflicts and then commit the result.`);
    console.log('');
    console.log(`CONFLICT (content): Merge conflict in schema`);
    console.log('');
    for (const conflict of conflictInfo.conflicts.slice(0, 10)) {
        console.log(`  ${cli_utils_2.colors.red('both modified:')}   ${conflict.objectType.toLowerCase()} ${conflict.objectName}`);
    }
    if (conflictInfo.conflicts.length > 10) {
        console.log(`  ${cli_utils_2.colors.gray(`... and ${conflictInfo.conflicts.length - 10} more conflicts`)}`);
    }
    console.log('');
    (0, cli_utils_2.hint)(`Fix conflicts manually and use:`);
    (0, cli_utils_2.hint)(`  relq add .          - to mark resolution`);
    (0, cli_utils_2.hint)(`  relq commit         - to complete the ${operation}`);
    console.log('');
    (0, cli_utils_2.hint)(`Or abort the ${operation} with:`);
    (0, cli_utils_2.hint)(`  relq ${operation} --abort`);
    console.log('');
}
function checkUncommittedChanges(projectRoot = process.cwd()) {
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
function printMergeStrategyHelp() {
    console.log('');
    console.log('Resolution options:');
    console.log(`  ${cli_utils_2.colors.cyan('--theirs')}   Accept all incoming changes (overwrite local)`);
    console.log(`  ${cli_utils_2.colors.cyan('--ours')}     Keep all local changes (reject incoming)`);
    console.log(`  ${cli_utils_2.colors.cyan('--force')}    Force operation, overwrite local changes`);
    console.log(`  ${cli_utils_2.colors.cyan('--abort')}    Abort and restore previous state`);
    console.log('');
}
function validatePostgresSQL(content) {
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
function readSQLFile(filePath) {
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
