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
exports.rollbackCommand = rollbackCommand;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const config_loader_1 = require("../utils/config-loader.cjs");
const env_loader_1 = require("../utils/env-loader.cjs");
const cli_utils_1 = require("../utils/cli-utils.cjs");
const repo_manager_1 = require("../utils/repo-manager.cjs");
const schema_diff_1 = require("../utils/schema-diff.cjs");
const migration_generator_1 = require("../utils/migration-generator.cjs");
async function rollbackCommand(context) {
    const { config, args, flags } = context;
    if (!config) {
        (0, cli_utils_1.fatal)('No configuration found', `Run ${cli_utils_1.colors.cyan('relq init')} to create one.`);
    }
    await (0, config_loader_1.requireValidConfig)(config, { calledFrom: 'rollback' });
    const connection = config.connection;
    const { projectRoot } = context;
    const preview = flags['preview'] === true || flags['dry-run'] === true;
    const skipPrompt = flags['yes'] === true || flags['y'] === true;
    console.log('');
    if (!(0, repo_manager_1.isInitialized)(projectRoot)) {
        (0, cli_utils_1.fatal)('not a relq repository (or any parent directories): .relq', `Run ${cli_utils_1.colors.cyan('relq init')} to initialize.`);
    }
    const localHead = (0, repo_manager_1.getHead)(projectRoot);
    if (!localHead) {
        (0, cli_utils_1.fatal)('no commits to rollback', 'Repository has no commits.');
    }
    const targetRef = args[0] || 'HEAD~1';
    const target = resolveTarget(projectRoot, targetRef, localHead);
    if (!target) {
        (0, cli_utils_1.fatal)(`invalid rollback target: ${targetRef}`, 'Use a commit hash or HEAD~N notation.');
    }
    if (target.commitsToRollback.length === 0) {
        console.log('Nothing to rollback - already at target commit.');
        console.log('');
        return;
    }
    const spinner = (0, cli_utils_1.createSpinner)();
    try {
        console.log(`Rolling back to ${cli_utils_1.colors.yellow((0, repo_manager_1.shortHash)(target.hash))}`);
        console.log(`${cli_utils_1.colors.muted(target.message)}`);
        console.log('');
        console.log(`${cli_utils_1.colors.red('Commits to rollback:')} ${target.commitsToRollback.length}`);
        for (const commit of target.commitsToRollback.slice(0, 5)) {
            console.log(`   ${cli_utils_1.colors.red('↩')} ${(0, repo_manager_1.shortHash)(commit.hash)} ${commit.message}`);
        }
        if (target.commitsToRollback.length > 5) {
            console.log(`   ${cli_utils_1.colors.muted(`... and ${target.commitsToRollback.length - 5} more`)}`);
        }
        console.log('');
        const currentCommitPath = path.join(projectRoot, '.relq', 'commits', `${localHead}.json`);
        const targetCommitPath = path.join(projectRoot, '.relq', 'commits', `${target.hash}.json`);
        if (!fs.existsSync(currentCommitPath)) {
            (0, cli_utils_1.fatal)(`current commit not found: ${localHead}`);
        }
        if (!fs.existsSync(targetCommitPath)) {
            (0, cli_utils_1.fatal)(`target commit not found: ${target.hash}`);
        }
        const currentCommit = JSON.parse(fs.readFileSync(currentCommitPath, 'utf-8'));
        const targetCommit = JSON.parse(fs.readFileSync(targetCommitPath, 'utf-8'));
        let rollbackSQL = [];
        if (currentCommit.schemaAST && targetCommit.schemaAST) {
            const comparison = (0, schema_diff_1.compareSchemas)(currentCommit.schemaAST, targetCommit.schemaAST);
            const migration = (0, migration_generator_1.generateMigrationFromComparison)(comparison);
            rollbackSQL = migration.down;
        }
        else {
            (0, cli_utils_1.warning)('No schema AST found - using commit SQL reversal (may be incomplete)');
            console.log('');
            for (const commit of target.commitsToRollback) {
                const commitPath = path.join(projectRoot, '.relq', 'commits', `${commit.hash}.json`);
                if (fs.existsSync(commitPath)) {
                    const enhancedCommit = JSON.parse(fs.readFileSync(commitPath, 'utf-8'));
                    if (enhancedCommit.downSQL) {
                        rollbackSQL.push(enhancedCommit.downSQL);
                    }
                }
            }
        }
        if (rollbackSQL.length === 0) {
            (0, cli_utils_1.warning)('No rollback SQL generated - manual intervention may be required');
            console.log('');
        }
        if (preview) {
            console.log(`${cli_utils_1.colors.yellow('Preview')} - showing rollback SQL`);
            console.log('');
            if (rollbackSQL.length > 0) {
                for (const sql of rollbackSQL.slice(0, 10)) {
                    console.log(`   ${sql.substring(0, 100)}${sql.length > 100 ? '...' : ''}`);
                }
                if (rollbackSQL.length > 10) {
                    console.log(`   ${cli_utils_1.colors.muted(`... and ${rollbackSQL.length - 10} more statements`)}`);
                }
            }
            else {
                console.log(`   ${cli_utils_1.colors.muted('(no SQL statements)')}`);
            }
            console.log('');
            console.log(`${cli_utils_1.colors.muted('Remove')} ${cli_utils_1.colors.cyan('--preview')} ${cli_utils_1.colors.muted('to execute rollback.')}`);
            console.log('');
            return;
        }
        if (!skipPrompt) {
            (0, cli_utils_1.warning)('This will modify your database!');
            console.log('');
            const confirmed = await (0, cli_utils_1.confirm)(`Rollback ${target.commitsToRollback.length} commit(s)?`, false);
            if (!confirmed) {
                (0, cli_utils_1.fatal)('Rollback cancelled by user');
            }
        }
        spinner.start('Connecting to remote...');
        await (0, repo_manager_1.ensureRemoteTable)(connection);
        spinner.succeed(`Connected to ${cli_utils_1.colors.cyan((0, env_loader_1.getConnectionDescription)(connection))}`);
        if (rollbackSQL.length > 0) {
            spinner.start('Executing rollback...');
            const pg = await Promise.resolve().then(() => __importStar(require("../../addon/pg/index.cjs")));
            const client = new pg.Client({
                host: connection.host,
                port: connection.port,
                database: connection.database,
                user: connection.user,
                password: connection.password,
            });
            try {
                await client.connect();
                await client.query('BEGIN');
                let statementsRun = 0;
                for (const sql of rollbackSQL) {
                    if (sql.trim()) {
                        await client.query(sql);
                        statementsRun++;
                    }
                }
                await client.query('COMMIT');
                spinner.succeed(`Executed ${statementsRun} rollback statement(s)`);
            }
            catch (error) {
                try {
                    await client.query('ROLLBACK');
                    spinner.fail('Rollback failed - transaction rolled back');
                }
                catch {
                    spinner.fail('Rollback failed');
                }
                throw error;
            }
            finally {
                await client.end();
            }
        }
        spinner.start('Updating commit status...');
        for (const commit of target.commitsToRollback) {
            await (0, repo_manager_1.markCommitAsRolledBack)(connection, commit.hash);
        }
        spinner.succeed('Marked commits as rolled back');
        const headPath = path.join(projectRoot, '.relq', 'HEAD');
        fs.writeFileSync(headPath, target.hash);
        if (targetCommit.schema) {
            const snapshotPath = path.join(projectRoot, '.relq', 'snapshot.json');
            fs.writeFileSync(snapshotPath, JSON.stringify(targetCommit.schema, null, 2));
        }
        console.log('');
        console.log(`${cli_utils_1.colors.green('Rollback complete')}`);
        console.log(`   ${(0, repo_manager_1.shortHash)(localHead)} → ${(0, repo_manager_1.shortHash)(target.hash)}`);
        console.log('');
    }
    catch (err) {
        spinner.fail('Rollback failed');
        (0, cli_utils_1.fatal)(err instanceof Error ? err.message : String(err));
    }
}
function resolveTarget(projectRoot, ref, currentHead) {
    const commits = (0, repo_manager_1.getAllCommits)(projectRoot);
    const commitsByHash = new Map(commits.map(c => [c.hash, c]));
    if (ref.startsWith('HEAD~')) {
        const n = parseInt(ref.slice(5), 10);
        if (isNaN(n) || n < 1)
            return null;
        let current = currentHead;
        const commitsToRollback = [];
        for (let i = 0; i < n; i++) {
            const commitPath = path.join(projectRoot, '.relq', 'commits', `${current}.json`);
            if (!fs.existsSync(commitPath))
                return null;
            const commit = JSON.parse(fs.readFileSync(commitPath, 'utf-8'));
            commitsToRollback.push(commit);
            if (!commit.parentHash) {
                if (i < n - 1) {
                    return null;
                }
                return {
                    hash: commit.hash,
                    message: '(initial state)',
                    commitsToRollback: commitsToRollback.slice(0, -1),
                };
            }
            current = commit.parentHash;
        }
        const targetPath = path.join(projectRoot, '.relq', 'commits', `${current}.json`);
        if (!fs.existsSync(targetPath))
            return null;
        const targetCommit = JSON.parse(fs.readFileSync(targetPath, 'utf-8'));
        return {
            hash: current,
            message: targetCommit.message,
            commitsToRollback,
        };
    }
    const normalizedRef = ref.length < 40 ? commits.find(c => c.hash.startsWith(ref))?.hash : ref;
    if (!normalizedRef || !commitsByHash.has(normalizedRef)) {
        return null;
    }
    const commitsToRollback = [];
    let current = currentHead;
    while (current && current !== normalizedRef) {
        const commitPath = path.join(projectRoot, '.relq', 'commits', `${current}.json`);
        if (!fs.existsSync(commitPath))
            break;
        const commit = JSON.parse(fs.readFileSync(commitPath, 'utf-8'));
        commitsToRollback.push(commit);
        current = commit.parentHash || '';
    }
    if (current !== normalizedRef) {
        return null;
    }
    const targetCommit = commitsByHash.get(normalizedRef);
    return {
        hash: normalizedRef,
        message: targetCommit?.message || '',
        commitsToRollback,
    };
}
exports.default = rollbackCommand;
