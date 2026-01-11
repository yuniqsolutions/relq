import * as fs from 'fs';
import * as path from 'path';
import { requireValidConfig } from "../utils/config-loader.js";
import { getConnectionDescription } from "../utils/env-loader.js";
import { colors, createSpinner, fatal, confirm, warning } from "../utils/cli-utils.js";
import { isInitialized, getHead, getAllCommits, shortHash, ensureRemoteTable, markCommitAsRolledBack, } from "../utils/repo-manager.js";
import { compareSchemas } from "../utils/schema-diff.js";
import { generateMigrationFromComparison } from "../utils/migration-generator.js";
export async function rollbackCommand(context) {
    const { config, args, flags } = context;
    if (!config) {
        fatal('No configuration found', `Run ${colors.cyan('relq init')} to create one.`);
    }
    await requireValidConfig(config, { calledFrom: 'rollback' });
    const connection = config.connection;
    const { projectRoot } = context;
    const preview = flags['preview'] === true || flags['dry-run'] === true;
    const skipPrompt = flags['yes'] === true || flags['y'] === true;
    console.log('');
    if (!isInitialized(projectRoot)) {
        fatal('not a relq repository (or any parent directories): .relq', `Run ${colors.cyan('relq init')} to initialize.`);
    }
    const localHead = getHead(projectRoot);
    if (!localHead) {
        fatal('no commits to rollback', 'Repository has no commits.');
    }
    const targetRef = args[0] || 'HEAD~1';
    const target = resolveTarget(projectRoot, targetRef, localHead);
    if (!target) {
        fatal(`invalid rollback target: ${targetRef}`, 'Use a commit hash or HEAD~N notation.');
    }
    if (target.commitsToRollback.length === 0) {
        console.log('Nothing to rollback - already at target commit.');
        console.log('');
        return;
    }
    const spinner = createSpinner();
    try {
        console.log(`Rolling back to ${colors.yellow(shortHash(target.hash))}`);
        console.log(`${colors.muted(target.message)}`);
        console.log('');
        console.log(`${colors.red('Commits to rollback:')} ${target.commitsToRollback.length}`);
        for (const commit of target.commitsToRollback.slice(0, 5)) {
            console.log(`   ${colors.red('↩')} ${shortHash(commit.hash)} ${commit.message}`);
        }
        if (target.commitsToRollback.length > 5) {
            console.log(`   ${colors.muted(`... and ${target.commitsToRollback.length - 5} more`)}`);
        }
        console.log('');
        const currentCommitPath = path.join(projectRoot, '.relq', 'commits', `${localHead}.json`);
        const targetCommitPath = path.join(projectRoot, '.relq', 'commits', `${target.hash}.json`);
        if (!fs.existsSync(currentCommitPath)) {
            fatal(`current commit not found: ${localHead}`);
        }
        if (!fs.existsSync(targetCommitPath)) {
            fatal(`target commit not found: ${target.hash}`);
        }
        const currentCommit = JSON.parse(fs.readFileSync(currentCommitPath, 'utf-8'));
        const targetCommit = JSON.parse(fs.readFileSync(targetCommitPath, 'utf-8'));
        let rollbackSQL = [];
        if (currentCommit.schemaAST && targetCommit.schemaAST) {
            const comparison = compareSchemas(currentCommit.schemaAST, targetCommit.schemaAST);
            const migration = generateMigrationFromComparison(comparison);
            rollbackSQL = migration.down;
        }
        else {
            warning('No schema AST found - using commit SQL reversal (may be incomplete)');
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
            warning('No rollback SQL generated - manual intervention may be required');
            console.log('');
        }
        if (preview) {
            console.log(`${colors.yellow('Preview')} - showing rollback SQL`);
            console.log('');
            if (rollbackSQL.length > 0) {
                for (const sql of rollbackSQL.slice(0, 10)) {
                    console.log(`   ${sql.substring(0, 100)}${sql.length > 100 ? '...' : ''}`);
                }
                if (rollbackSQL.length > 10) {
                    console.log(`   ${colors.muted(`... and ${rollbackSQL.length - 10} more statements`)}`);
                }
            }
            else {
                console.log(`   ${colors.muted('(no SQL statements)')}`);
            }
            console.log('');
            console.log(`${colors.muted('Remove')} ${colors.cyan('--preview')} ${colors.muted('to execute rollback.')}`);
            console.log('');
            return;
        }
        if (!skipPrompt) {
            warning('This will modify your database!');
            console.log('');
            const confirmed = await confirm(`Rollback ${target.commitsToRollback.length} commit(s)?`, false);
            if (!confirmed) {
                fatal('Rollback cancelled by user');
            }
        }
        spinner.start('Connecting to remote...');
        await ensureRemoteTable(connection);
        spinner.succeed(`Connected to ${colors.cyan(getConnectionDescription(connection))}`);
        if (rollbackSQL.length > 0) {
            spinner.start('Executing rollback...');
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
            await markCommitAsRolledBack(connection, commit.hash);
        }
        spinner.succeed('Marked commits as rolled back');
        const headPath = path.join(projectRoot, '.relq', 'HEAD');
        fs.writeFileSync(headPath, target.hash);
        if (targetCommit.schema) {
            const snapshotPath = path.join(projectRoot, '.relq', 'snapshot.json');
            fs.writeFileSync(snapshotPath, JSON.stringify(targetCommit.schema, null, 2));
        }
        console.log('');
        console.log(`${colors.green('Rollback complete')}`);
        console.log(`   ${shortHash(localHead)} → ${shortHash(target.hash)}`);
        console.log('');
    }
    catch (err) {
        spinner.fail('Rollback failed');
        fatal(err instanceof Error ? err.message : String(err));
    }
}
function resolveTarget(projectRoot, ref, currentHead) {
    const commits = getAllCommits(projectRoot);
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
export default rollbackCommand;
