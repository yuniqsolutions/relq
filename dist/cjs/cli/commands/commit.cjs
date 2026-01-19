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
const config_loader_1 = require("../utils/config-loader.cjs");
const change_tracker_1 = require("../utils/change-tracker.cjs");
const commit_manager_1 = require("../utils/commit-manager.cjs");
const schema_to_ast_1 = require("../utils/schema-to-ast.cjs");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const jiti_1 = require("jiti");
async function commitCommand(context) {
    const { config, flags, args, projectRoot } = context;
    const author = config?.author || 'Developer <dev@example.com>';
    console.log('');
    if (!(0, repo_manager_1.isInitialized)(projectRoot)) {
        (0, cli_utils_1.fatal)('not a relq repository (or any parent directories): .relq', "run 'relq init' to initialize");
    }
    const schemaPath = path.resolve(projectRoot, (0, config_loader_1.getSchemaPath)(config ?? undefined));
    const { requireValidSchema } = await Promise.resolve().then(() => __importStar(require("../utils/config-loader.cjs")));
    await requireValidSchema(schemaPath, flags);
    if (flags['from-schema']) {
        return commitFromSchema(context, schemaPath, author);
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
    const downSQL = (0, change_tracker_1.generateDownSQL)(sortedChanges);
    const snapshot = (0, repo_manager_1.loadSnapshot)(projectRoot);
    const creates = staged.filter(c => c.type === 'CREATE').length;
    const alters = staged.filter(c => c.type === 'ALTER').length;
    const drops = staged.filter(c => c.type === 'DROP').length;
    const renames = staged.filter(c => c.type === 'RENAME').length;
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
        downSQL,
        schema: snapshot,
        snapshotHash: hash.substring(0, 12),
        stats: {
            creates,
            alters,
            drops,
            renames,
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
    const schemaPathRaw = (0, config_loader_1.getSchemaPath)(commitConfig);
    const schemaFilePath = path.resolve(projectRoot, schemaPathRaw);
    if (fs.existsSync(schemaFilePath)) {
        const currentContent = fs.readFileSync(schemaFilePath, 'utf-8');
        const currentHash = (0, repo_manager_1.hashFileContent)(currentContent);
        (0, repo_manager_1.saveFileHash)(currentHash, projectRoot);
    }
    console.log(`[${(0, repo_manager_1.shortHash)(hash)}] ${message}`);
    const statsParts = [];
    if (creates > 0)
        statsParts.push(`${creates} create(s)`);
    if (alters > 0)
        statsParts.push(`${alters} alter(s)`);
    if (drops > 0)
        statsParts.push(`${drops} drop(s)`);
    if (renames > 0)
        statsParts.push(`${renames} rename(s)`);
    console.log(` ${statsParts.length > 0 ? statsParts.join(', ') : 'no changes'}`);
    console.log('');
    (0, cli_utils_1.hint)("run 'relq push' to apply changes to database");
    (0, cli_utils_1.hint)("run 'relq export' to export as SQL file");
    console.log('');
}
async function commitFromSchema(context, schemaPath, author) {
    const { config, flags, args, projectRoot } = context;
    const spinner = (0, cli_utils_1.createSpinner)();
    let message = flags['m'] || flags['message'];
    if (!message) {
        if (args.length > 0) {
            message = args.join(' ');
        }
        else {
            (0, cli_utils_1.fatal)('commit message required', "usage: relq commit --from-schema -m '<message>'");
        }
    }
    spinner.start('Loading schema file');
    let schemaModule;
    try {
        const jiti = (0, jiti_1.createJiti)(path.dirname(schemaPath), { interopDefault: true });
        const module = await jiti.import(schemaPath);
        if (module && module.default && typeof module.default === 'object') {
            schemaModule = module.default;
        }
        else if (module && typeof module === 'object') {
            schemaModule = module;
        }
        else {
            throw new Error('Schema file must export an object with table/enum definitions');
        }
        spinner.succeed('Loaded schema file');
    }
    catch (err) {
        spinner.fail('Failed to load schema');
        (0, cli_utils_1.fatal)(`Could not load schema: ${err instanceof Error ? err.message : String(err)}`);
    }
    spinner.start('Converting schema to AST');
    const ast = (0, schema_to_ast_1.schemaToAST)(schemaModule);
    spinner.succeed('Converted schema to AST');
    const schemaHash = (0, commit_manager_1.generateASTHash)(ast);
    spinner.start('Creating commit');
    try {
        const commit = (0, commit_manager_1.createCommitFromSchema)(schemaModule, author, message, config?.commitLimit ?? 1000, projectRoot);
        spinner.succeed('Created commit');
        const tableCount = ast.tables.length;
        const enumCount = ast.enums.length;
        const functionCount = ast.functions.length;
        const viewCount = ast.views.length;
        const triggerCount = ast.triggers.length;
        console.log('');
        console.log(`[${(0, repo_manager_1.shortHash)(commit.hash)}] ${message}`);
        const statsParts = [];
        if (tableCount > 0)
            statsParts.push(`${tableCount} table(s)`);
        if (enumCount > 0)
            statsParts.push(`${enumCount} enum(s)`);
        if (functionCount > 0)
            statsParts.push(`${functionCount} function(s)`);
        if (viewCount > 0)
            statsParts.push(`${viewCount} view(s)`);
        if (triggerCount > 0)
            statsParts.push(`${triggerCount} trigger(s)`);
        console.log(` ${statsParts.length > 0 ? statsParts.join(', ') : 'empty schema'}`);
        console.log('');
        console.log(cli_utils_1.colors.muted(`Schema hash: ${schemaHash.substring(0, 12)}`));
        console.log('');
        (0, cli_utils_1.hint)("run 'relq push' to apply changes to database");
        (0, cli_utils_1.hint)("run 'relq log' to view commit history");
    }
    catch (err) {
        spinner.fail('Failed to create commit');
        (0, cli_utils_1.fatal)(`Could not create commit: ${err instanceof Error ? err.message : String(err)}`);
    }
}
exports.default = commitCommand;
