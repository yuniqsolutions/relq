import * as fs from 'fs';
import * as path from 'path';
import { requireValidConfig } from "../utils/config-loader.js";
import { getConnectionDescription } from "../utils/env-loader.js";
import { colors, createSpinner, fatal, success } from "../utils/cli-utils.js";
import { isInitialized, initRepository, shortHash, fetchRemoteCommits, pushCommit, ensureRemoteTable, getAllCommits, markCommitAsApplied, markCommitAsPushed, getConnectionLabel, isCommitSyncedWith, } from "../utils/repo-manager.js";
import { pullCommand } from "./pull.js";
export async function syncCommand(context) {
    const { config, flags } = context;
    if (!config) {
        fatal('No configuration found', `Run ${colors.cyan('relq init')} to create one.`);
    }
    await requireValidConfig(config, { calledFrom: 'sync' });
    const connection = config.connection;
    const { projectRoot } = context;
    console.log('');
    if (!isInitialized(projectRoot)) {
        console.log(`${colors.yellow('Initializing')} .relq repository...`);
        initRepository(projectRoot);
        console.log(`${colors.green('✓')} Repository initialized`);
        console.log('');
    }
    const spinner = createSpinner();
    try {
        console.log(`Syncing with ${colors.cyan(getConnectionDescription(connection))}...`);
        console.log('');
        await pullCommand(context);
        await ensureRemoteTable(connection);
        const remoteCommits = await fetchRemoteCommits(connection, 100);
        const remoteHashes = new Set(remoteCommits.map(c => c.hash));
        const localCommitsAfter = getAllCommits(projectRoot);
        const toPush = localCommitsAfter.filter(c => {
            if (remoteHashes.has(c.hash))
                return false;
            const syncStatus = isCommitSyncedWith(c, connection);
            if (syncStatus.synced)
                return false;
            return true;
        });
        if (toPush.length === 0) {
            success('Sync complete - up to date');
            console.log('');
            return;
        }
        console.log(`Pushing ${toPush.length} local commit(s)...`);
        console.log('');
        const commitsToProcess = [...toPush].reverse();
        spinner.start('Applying schema changes...');
        const pg = await import("../../addon/pg/index.js");
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
                await markCommitAsApplied(connection, commit.hash);
            }
        }
        catch (error) {
            try {
                await client.query('ROLLBACK');
            }
            catch {
            }
            const dbError = error?.message || String(error);
            let errorMsg = `${colors.red('SQL Error:')} ${dbError}\n`;
            if (error.failedStatement) {
                errorMsg += `\n${colors.yellow('Failed Statement:')}\n`;
                errorMsg += `  ${error.failedStatement}\n`;
            }
            if (error.commitHash) {
                errorMsg += `\n${colors.yellow('In Commit:')} ${shortHash(error.commitHash)}`;
                if (error.commitMessage) {
                    errorMsg += ` - ${error.commitMessage}`;
                }
                errorMsg += `\n`;
            }
            errorMsg += `\n${colors.muted('All changes rolled back. No commits pushed.')}\n`;
            spinner.fail('SQL execution failed');
            throw new Error(errorMsg);
        }
        finally {
            await client.end();
        }
        spinner.start(`Pushing ${toPush.length} commit(s)...`);
        for (const commit of commitsToProcess) {
            await pushCommit(connection, commit, projectRoot);
            markCommitAsPushed(commit.hash, connection, projectRoot);
        }
        spinner.succeed(`Pushed ${toPush.length} commit(s) to ${getConnectionLabel(connection)}`);
        console.log('');
        console.log('Pushed commits:');
        for (const commit of commitsToProcess.slice(0, 5)) {
            console.log(`  ${colors.yellow(shortHash(commit.hash))} ${commit.message}`);
        }
        if (commitsToProcess.length > 5) {
            console.log(`  ${colors.muted(`... and ${commitsToProcess.length - 5} more`)}`);
        }
        console.log('');
        success(`Sync complete - pushed ${toPush.length} commit(s)`);
    }
    catch (err) {
        spinner.fail('Sync failed');
        fatal(err instanceof Error ? err.message : String(err));
    }
    console.log('');
}
