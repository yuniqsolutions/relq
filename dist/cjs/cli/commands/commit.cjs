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
exports.commitCommand = commitCommand;
const crypto = __importStar(require("crypto"));
const cli_utils_1 = require("../utils/cli-utils.cjs");
const repo_manager_1 = require("../utils/repo-manager.cjs");
const config_1 = require("../../config/config.cjs");
const change_tracker_1 = require("../utils/change-tracker.cjs");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
async function commitCommand(context) {
    const { config, flags, args, projectRoot } = context;
    const author = config?.author || 'Developer <dev@example.com>';
    console.log('');
    if (!(0, repo_manager_1.isInitialized)(projectRoot)) {
        (0, cli_utils_1.fatal)('not a relq repository (or any parent directories): .relq', "run 'relq init' to initialize");
    }
    const staged = (0, repo_manager_1.getStagedChanges)(projectRoot);
    if (staged.length === 0) {
        console.log('nothing to commit, working tree clean');
        const unstaged = (0, repo_manager_1.getUnstagedChanges)(projectRoot);
        if (unstaged.length > 0) {
            console.log(`${unstaged.length} unstaged change(s).`);
            (0, cli_utils_1.hint)("run 'relq add .' to stage all changes");
        }
        else {
            (0, cli_utils_1.hint)("run 'relq add <table>' to stage changes");
        }
        return;
    }
    let message = flags['m'] || flags['message'];
    if (!message) {
        if (args.length > 0) {
            message = args.join(' ');
        }
        else {
            (0, cli_utils_1.fatal)('commit message required', "usage: relq commit -m '<message>'");
        }
    }
    const sortedChanges = (0, change_tracker_1.sortChangesByDependency)(staged);
    const sql = (0, change_tracker_1.generateCombinedSQL)(sortedChanges);
    const creates = staged.filter(c => c.type === 'CREATE').length;
    const alters = staged.filter(c => c.type === 'ALTER').length;
    const drops = staged.filter(c => c.type === 'DROP').length;
    const parentHash = (0, repo_manager_1.getHead)(projectRoot);
    const hashInput = JSON.stringify({
        changes: staged.map(c => c.id),
        message,
        timestamp: new Date().toISOString(),
        parent: parentHash,
    });
    const hash = crypto.createHash('sha1').update(hashInput).digest('hex');
    const commit = {
        hash,
        parentHash,
        author,
        message,
        timestamp: new Date().toISOString(),
        changes: sortedChanges,
        sql,
        snapshotHash: hash.substring(0, 12),
        stats: {
            creates,
            alters,
            drops,
            total: staged.length,
        },
    };
    const commitsDir = path.join(projectRoot, '.relq', 'commits');
    if (!fs.existsSync(commitsDir)) {
        fs.mkdirSync(commitsDir, { recursive: true });
    }
    fs.writeFileSync(path.join(commitsDir, `${hash}.json`), JSON.stringify(commit, null, 2), 'utf-8');
    fs.writeFileSync(path.join(projectRoot, '.relq', 'HEAD'), hash, 'utf-8');
    const workingPath = path.join(projectRoot, '.relq', 'working.json');
    const unstaged = (0, repo_manager_1.getUnstagedChanges)(projectRoot).filter(c => c.objectType !== 'SCHEMA_FILE');
    if (unstaged.length > 0) {
        fs.writeFileSync(workingPath, JSON.stringify({
            timestamp: new Date().toISOString(),
            staged: [],
            unstaged,
        }, null, 2), 'utf-8');
    }
    else {
        if (fs.existsSync(workingPath)) {
            fs.unlinkSync(workingPath);
        }
    }
    const commitConfig = await (0, config_1.loadConfig)();
    const schemaPathRaw = typeof commitConfig.schema === 'string' ? commitConfig.schema : './db/schema.ts';
    const schemaFilePath = path.resolve(projectRoot, schemaPathRaw);
    if (fs.existsSync(schemaFilePath)) {
        const currentContent = fs.readFileSync(schemaFilePath, 'utf-8');
        const currentHash = (0, repo_manager_1.hashFileContent)(currentContent);
        (0, repo_manager_1.saveFileHash)(currentHash, projectRoot);
    }
    console.log(`[${(0, repo_manager_1.shortHash)(hash)}] ${message}`);
    console.log(` ${creates} create(s), ${alters} alter(s), ${drops} drop(s)`);
    console.log('');
    (0, cli_utils_1.hint)("run 'relq push' to apply changes to database");
    (0, cli_utils_1.hint)("run 'relq export' to export as SQL file");
    console.log('');
}
exports.default = commitCommand;
