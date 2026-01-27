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
exports.syncCommand = syncCommand;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const config_loader_1 = require("../utils/config-loader.cjs");
const env_loader_1 = require("../utils/env-loader.cjs");
const cli_utils_1 = require("../utils/cli-utils.cjs");
const repo_manager_1 = require("../utils/repo-manager.cjs");
const pull_1 = require("./pull.cjs");
async function syncCommand(context) {
    const { config, flags } = context;
    if (!config) {
        (0, cli_utils_1.fatal)('No configuration found', `Run ${cli_utils_1.colors.cyan('relq init')} to create one.`);
    }
    await (0, config_loader_1.requireValidConfig)(config, { calledFrom: 'sync' });
    const connection = config.connection;
    const { projectRoot } = context;
    console.log('');
    if (!(0, repo_manager_1.isInitialized)(projectRoot)) {
        console.log(`${cli_utils_1.colors.yellow('Initializing')} .relq repository...`);
        (0, repo_manager_1.initRepository)(projectRoot);
        console.log(`${cli_utils_1.colors.green('✓')} Repository initialized`);
        console.log('');
    }
    const spinner = (0, cli_utils_1.createSpinner)();
    try {
        console.log(`Syncing with ${cli_utils_1.colors.cyan((0, env_loader_1.getConnectionDescription)(connection))}...`);
        console.log('');
        await (0, pull_1.pullCommand)(context);
        await (0, repo_manager_1.ensureRemoteTable)(connection);
        const remoteCommits = await (0, repo_manager_1.fetchRemoteCommits)(connection, 100);
        const remoteHashes = new Set(remoteCommits.map(c => c.hash));
        const localCommitsAfter = (0, repo_manager_1.getAllCommits)(projectRoot);
        const toPush = localCommitsAfter.filter(c => {
            if (remoteHashes.has(c.hash))
                return false;
            const syncStatus = (0, repo_manager_1.isCommitSyncedWith)(c, connection);
            if (syncStatus.synced)
                return false;
            return true;
        });
        if (toPush.length === 0) {
            (0, cli_utils_1.success)('Sync complete - up to date');
            console.log('');
            return;
        }
        console.log(`Pushing ${toPush.length} local commit(s)...`);
        console.log('');
        const commitsToProcess = [...toPush].reverse();
        spinner.start('Applying schema changes...');
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
            let sqlExecuted = 0;
            let statementsRun = 0;
            for (const commit of commitsToProcess) {
                const commitPath = path.join(projectRoot, '.relq', 'commits', `${commit.hash}.json`);
                if (fs.existsSync(commitPath)) {
                    const enhancedCommit = JSON.parse(fs.readFileSync(commitPath, 'utf-8'));
                    if (enhancedCommit.sql && enhancedCommit.sql.trim()) {
                        const statements = enhancedCommit.sql
                            .split(';')
                            .map(s => s.trim())
                            .filter(s => s.length > 0);
                        for (const stmt of statements) {
                            try {
                                await client.query(stmt);
                                statementsRun++;
                            }
                            catch (stmtError) {
                                const err = new Error(stmtError.message);
                                err.failedStatement = stmt;
                                err.commitHash = commit.hash;
                                err.commitMessage = commit.message;
                                throw err;
                            }
                        }
                        sqlExecuted++;
                    }
                }
            }
            await client.query('COMMIT');
            if (statementsRun > 0) {
                spinner.succeed(`Applied ${statementsRun} statement(s) from ${sqlExecuted} commit(s)`);
            }
            else {
                spinner.succeed('No SQL changes to apply');
            }
            for (const commit of commitsToProcess) {
                await (0, repo_manager_1.markCommitAsApplied)(connection, commit.hash);
            }
        }
        catch (error) {
            try {
                await client.query('ROLLBACK');
            }
            catch {
            }
            const dbError = error?.message || String(error);
            let errorMsg = `${cli_utils_1.colors.red('SQL Error:')} ${dbError}\n`;
            if (error.failedStatement) {
                errorMsg += `\n${cli_utils_1.colors.yellow('Failed Statement:')}\n`;
                errorMsg += `  ${error.failedStatement}\n`;
            }
            if (error.commitHash) {
                errorMsg += `\n${cli_utils_1.colors.yellow('In Commit:')} ${(0, repo_manager_1.shortHash)(error.commitHash)}`;
                if (error.commitMessage) {
                    errorMsg += ` - ${error.commitMessage}`;
                }
                errorMsg += `\n`;
            }
            errorMsg += `\n${cli_utils_1.colors.muted('All changes rolled back. No commits pushed.')}\n`;
            spinner.fail('SQL execution failed');
            throw new Error(errorMsg);
        }
        finally {
            await client.end();
        }
        spinner.start(`Pushing ${toPush.length} commit(s)...`);
        for (const commit of commitsToProcess) {
            await (0, repo_manager_1.pushCommit)(connection, commit, projectRoot);
            (0, repo_manager_1.markCommitAsPushed)(commit.hash, connection, projectRoot);
        }
        spinner.succeed(`Pushed ${toPush.length} commit(s) to ${(0, repo_manager_1.getConnectionLabel)(connection)}`);
        console.log('');
        console.log('Pushed commits:');
        for (const commit of commitsToProcess.slice(0, 5)) {
            console.log(`  ${cli_utils_1.colors.yellow((0, repo_manager_1.shortHash)(commit.hash))} ${commit.message}`);
        }
        if (commitsToProcess.length > 5) {
            console.log(`  ${cli_utils_1.colors.muted(`... and ${commitsToProcess.length - 5} more`)}`);
        }
        console.log('');
        (0, cli_utils_1.success)(`Sync complete - pushed ${toPush.length} commit(s)`);
    }
    catch (err) {
        spinner.fail('Sync failed');
        (0, cli_utils_1.fatal)(err instanceof Error ? err.message : String(err));
    }
    console.log('');
}
