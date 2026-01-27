import * as fs from 'fs';
import * as path from 'path';
import { isAwsDsqlConfig } from "../../config/config.js";
import { requireValidConfig } from "../utils/config-loader.js";
import { validateSqlForDsql, formatDsqlErrors } from "../utils/dsql-validator.js";
import { getConnectionDescription } from "../utils/env-loader.js";
import { colors, createSpinner, fatal, confirm, warning } from "../utils/cli-utils.js";
import { fastIntrospectDatabase } from "../utils/fast-introspect.js";
import { loadRelqignore, isTableIgnored, isColumnIgnored, isEnumIgnored, isDomainIgnored, isFunctionIgnored, } from "../utils/relqignore.js";
import { isInitialized, getHead, shortHash, fetchRemoteCommits, pushCommit, ensureRemoteTable, getAllCommits, loadSnapshot, isCommitSyncedWith, markCommitAsPushed, markCommitAsApplied, getConnectionLabel, getPushedButNotAppliedCommits, } from "../utils/repo-manager.js";
import { syncTypesToDb, getTypesFilePath, validateTypesConfiguration } from "../utils/types-manager.js";
import { getSchemaPath } from "../utils/config-loader.js";
export async function pushCommand(context) {
    const { config, flags } = context;
    if (!config) {
        fatal('No configuration found', `Run ${colors.cyan('relq init')} to create one.`);
    }
    await requireValidConfig(config, { calledFrom: 'push' });
    const connection = config.connection;
    const { projectRoot } = context;
    const force = flags['force'] === true;
    const dryRun = flags['dry-run'] === true;
    const metadataOnly = flags['metadata-only'] === true;
    const noVerify = flags['no-verify'] === true;
    const skipPrompt = flags['yes'] === true || flags['y'] === true;
    const includeFunctions = config.includeFunctions ?? false;
    const includeTriggers = config.includeTriggers ?? false;
    const includeViews = config.includeViews ?? false;
    console.log('');
    if (!isInitialized(projectRoot)) {
        fatal('not a relq repository (or any parent directories): .relq', `Run ${colors.cyan('relq init')} to initialize.`);
    }
    const localHead = getHead(projectRoot);
    if (!localHead) {
        fatal('no commits to push', `Run ${colors.cyan('relq commit -m "message"')} to create a commit.`);
    }
    const spinner = createSpinner();
    try {
        spinner.start('Connecting to remote...');
        await ensureRemoteTable(connection);
        spinner.succeed(`Connected to ${colors.cyan(getConnectionDescription(connection))}`);
        spinner.start('Checking remote commits...');
        const remoteCommits = await fetchRemoteCommits(connection, 100);
        const remoteHead = remoteCommits.length > 0 ? remoteCommits[0].hash : null;
        const localCommits = getAllCommits(projectRoot);
        const remoteHashes = new Set(remoteCommits.map(c => c.hash));
        const localHashes = new Set(localCommits.map(c => c.hash));
        const toPush = localCommits.filter(c => {
            if (remoteHashes.has(c.hash))
                return false;
            const syncStatus = isCommitSyncedWith(c, connection);
            if (syncStatus.synced) {
                return false;
            }
            return true;
        });
        const remoteMissing = remoteCommits.filter(c => !localHashes.has(c.hash));
        spinner.succeed('Checked remote commits');
        spinner.start('Introspecting remote database...');
        const remoteDb = await fastIntrospectDatabase(connection, undefined, {
            includeFunctions,
            includeTriggers,
        });
        spinner.succeed(`Found ${remoteDb.tables.length} tables in remote`);
        const localSnapshot = loadSnapshot(projectRoot);
        if (!localSnapshot) {
            spinner.stop();
            fatal('No local snapshot found', `Run ${colors.cyan('relq pull')} or ${colors.cyan('relq import')} first.`);
        }
        const ignorePatterns = loadRelqignore(projectRoot);
        const analysis = analyzeSync(localSnapshot, remoteDb, ignorePatterns, { includeFunctions, includeTriggers, includeViews });
        const hasRemoteAhead = remoteMissing.length > 0;
        const hasObjectsToDrop = analysis.objectsToDrop.length > 0;
        const hasSchemaDrift = analysis.schemaDrift.length > 0;
        if (hasRemoteAhead && !force) {
            spinner.stop();
            console.log('');
            for (const commit of remoteMissing.slice(0, 3)) {
                console.log(`   ${colors.yellow(shortHash(commit.hash))} ${commit.message}`);
            }
            if (remoteMissing.length > 3) {
                console.log(`   ${colors.muted(`... and ${remoteMissing.length - 3} more`)}`);
            }
            fatal(`Remote has ${remoteMissing.length} commit(s) you don't have locally`, `Run ${colors.cyan('relq pull')} to integrate remote changes.\nUse ${colors.cyan('relq push --force')} to override (may cause data loss).`);
        }
        if (hasObjectsToDrop) {
            console.log('');
            warning(`Remote has ${analysis.objectsToDrop.length} object(s) not in your local schema:`);
            console.log('');
            for (const obj of analysis.objectsToDrop.slice(0, 10)) {
                console.log(`   ${colors.red('DROP')} ${obj.type.toLowerCase()}: ${obj.name}`);
            }
            if (analysis.objectsToDrop.length > 10) {
                console.log(`   ${colors.muted(`... and ${analysis.objectsToDrop.length - 10} more`)}`);
            }
            console.log('');
            if (!force) {
                fatal('Cannot push - remote has objects not in your history', `Run ${colors.cyan('relq pull')} first to sync your local schema.\nUse ${colors.cyan('relq push --force')} to DROP these objects from remote.`);
            }
            const dependencyErrors = checkDropDependencies(analysis.objectsToDrop, remoteDb, ignorePatterns);
            if (dependencyErrors.length > 0) {
                console.log('');
                for (const err of dependencyErrors) {
                    console.log(`   ${err}`);
                }
                fatal('Cannot drop objects due to dependencies', `These objects are used by non-ignored objects in your schema.\nEither add them to .relqignore or import them with ${colors.cyan('relq pull')}`);
            }
            if (!skipPrompt && !dryRun) {
                warning('This will DROP data from your database!');
                console.log('');
                const confirmed = await confirm(`Drop ${analysis.objectsToDrop.length} object(s) from remote?`, false);
                if (!confirmed) {
                    fatal('Operation cancelled by user');
                }
            }
        }
        const schemaPath = getSchemaPath(config);
        const typesFilePath = getTypesFilePath(schemaPath);
        let typesSynced = false;
        if (fs.existsSync(schemaPath)) {
            spinner.start('Validating types configuration...');
            const validationErrors = await validateTypesConfiguration(schemaPath, typesFilePath);
            if (validationErrors.length > 0) {
                spinner.fail('Types validation failed');
                console.log('');
                for (const err of validationErrors) {
                    console.log(`${colors.red('error:')} ${err.message}`);
                    if (err.details && err.details.length > 0) {
                        for (const detail of err.details) {
                            console.log(`   ${colors.muted('→')} ${detail}`);
                        }
                    }
                    if (err.hint) {
                        console.log(`   ${colors.cyan('hint:')} ${err.hint}`);
                    }
                    console.log('');
                }
                fatal('Types configuration is invalid', `Fix the issues above and try again.\nTypes must be defined in ${colors.cyan(path.basename(typesFilePath))} to enable database syncing.`);
            }
            spinner.succeed('Types configuration valid');
        }
        if (fs.existsSync(typesFilePath) && !dryRun) {
            spinner.start('Syncing TypeScript types...');
            const typesResult = await syncTypesToDb(connection, typesFilePath, schemaPath);
            const totalChanges = typesResult.added.length + typesResult.updated.length + typesResult.removed.length;
            if (totalChanges > 0) {
                const parts = [];
                if (typesResult.added.length > 0)
                    parts.push(`${typesResult.added.length} added`);
                if (typesResult.updated.length > 0)
                    parts.push(`${typesResult.updated.length} updated`);
                if (typesResult.removed.length > 0)
                    parts.push(`${typesResult.removed.length} removed`);
                spinner.succeed(`Synced types: ${parts.join(', ')}`);
                typesSynced = true;
            }
            else {
                spinner.succeed('Types in sync');
            }
        }
        const pushedButNotApplied = await getPushedButNotAppliedCommits(connection, [...localHashes]);
        if (pushedButNotApplied.length > 0 && !metadataOnly && !dryRun) {
            spinner.start(`Recovering ${pushedButNotApplied.length} commit(s) with pending SQL...`);
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
                for (const hash of pushedButNotApplied) {
                    const commitPath = path.join(projectRoot, '.relq', 'commits', `${hash}.json`);
                    if (fs.existsSync(commitPath)) {
                        const enhancedCommit = JSON.parse(fs.readFileSync(commitPath, 'utf-8'));
                        if (enhancedCommit.sql && enhancedCommit.sql.trim()) {
                            await client.query(enhancedCommit.sql);
                            sqlExecuted++;
                        }
                    }
                }
                await client.query('COMMIT');
                spinner.succeed(`Applied pending SQL from ${sqlExecuted} commit(s)`);
                for (const hash of pushedButNotApplied) {
                    await markCommitAsApplied(connection, hash);
                }
            }
            catch (error) {
                try {
                    await client.query('ROLLBACK');
                    spinner.fail('SQL recovery failed - rolled back');
                }
                catch {
                    spinner.fail('SQL recovery failed');
                }
                throw error;
            }
            finally {
                await client.end();
            }
        }
        if (toPush.length === 0 && !hasObjectsToDrop && pushedButNotApplied.length === 0) {
            if (!typesSynced) {
                console.log('Everything up-to-date');
            }
            console.log('');
            return;
        }
        console.log('');
        console.log(`Pushing to ${colors.cyan(getConnectionDescription(connection))}`);
        console.log('');
        if (toPush.length > 0) {
            console.log(`${colors.cyan('Commits:')} ${toPush.length}`);
            for (const commit of toPush.slice(0, 5)) {
                console.log(`   ${colors.yellow(shortHash(commit.hash))} ${commit.message}`);
            }
            if (toPush.length > 5) {
                console.log(`   ${colors.muted(`... and ${toPush.length - 5} more`)}`);
            }
            console.log('');
        }
        if (dryRun) {
            console.log(`${colors.yellow('Dry run')} - showing changes that would be applied`);
            console.log('');
            if (hasObjectsToDrop && force) {
                console.log(`${colors.red('DROP statements:')}`);
                for (const obj of analysis.objectsToDrop.slice(0, 5)) {
                    console.log(`   ${generateDropSQL(obj)}`);
                }
                if (analysis.objectsToDrop.length > 5) {
                    console.log(`   ${colors.muted(`... and ${analysis.objectsToDrop.length - 5} more`)}`);
                }
                console.log('');
            }
            const commitsToProcess = [...toPush].reverse();
            let totalStatements = 0;
            for (const commit of commitsToProcess) {
                const commitPath = path.join(projectRoot, '.relq', 'commits', `${commit.hash}.json`);
                if (fs.existsSync(commitPath)) {
                    const enhancedCommit = JSON.parse(fs.readFileSync(commitPath, 'utf-8'));
                    if (enhancedCommit.sql && enhancedCommit.sql.trim()) {
                        const statements = enhancedCommit.sql.split(';').filter(s => s.trim());
                        totalStatements += statements.length;
                        console.log(`${colors.cyan(`Commit ${shortHash(commit.hash)}:`)} ${commit.message}`);
                        for (const stmt of statements.slice(0, 3)) {
                            console.log(`   ${stmt.trim().substring(0, 80)}${stmt.trim().length > 80 ? '...' : ''};`);
                        }
                        if (statements.length > 3) {
                            console.log(`   ${colors.muted(`... and ${statements.length - 3} more statements`)}`);
                        }
                        console.log('');
                    }
                }
            }
            if (totalStatements === 0 && !hasObjectsToDrop) {
                console.log(`${colors.muted('No SQL changes to apply')}`);
            }
            else {
                console.log(`${colors.muted('Total:')} ${totalStatements + (hasObjectsToDrop ? analysis.objectsToDrop.length : 0)} statements`);
            }
            console.log('');
            console.log(`${colors.muted('Remove')} ${colors.cyan('--dry-run')} ${colors.muted('to execute these changes.')}`);
            console.log('');
            return;
        }
        if (isAwsDsqlConfig(connection) && !metadataOnly && !dryRun && toPush.length > 0) {
            const allSqlErrors = [];
            for (const commit of toPush) {
                const commitPath = path.join(projectRoot, '.relq', 'commits', `${commit.hash}.json`);
                if (fs.existsSync(commitPath)) {
                    const enhancedCommit = JSON.parse(fs.readFileSync(commitPath, 'utf-8'));
                    if (enhancedCommit.sql && enhancedCommit.sql.trim()) {
                        const errors = validateSqlForDsql(enhancedCommit.sql, `commit:${shortHash(commit.hash)}`);
                        allSqlErrors.push(...errors);
                    }
                }
            }
            if (allSqlErrors.length > 0) {
                const dsqlResult = {
                    valid: false,
                    errors: allSqlErrors,
                    warnings: [],
                };
                console.log('');
                console.log(formatDsqlErrors(dsqlResult));
                fatal('Push SQL contains DSQL incompatibilities', 'Fix the issues above before pushing to AWS DSQL.');
            }
        }
        let sqlApplied = false;
        let commitsToProcess = [];
        if (!metadataOnly && !dryRun && (toPush.length > 0 || (hasObjectsToDrop && force))) {
            commitsToProcess = [...toPush].reverse();
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
                if (hasObjectsToDrop && force) {
                    for (const obj of analysis.objectsToDrop) {
                        const dropSQL = generateDropSQL(obj);
                        if (dropSQL) {
                            await client.query(dropSQL);
                            statementsRun++;
                        }
                    }
                }
                let statementIndex = 0;
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
                                statementIndex++;
                                try {
                                    await client.query(stmt);
                                    statementsRun++;
                                }
                                catch (stmtError) {
                                    const err = new Error(stmtError.message);
                                    err.failedStatement = stmt;
                                    err.commitHash = commit.hash;
                                    err.commitMessage = commit.message;
                                    err.statementIndex = statementIndex;
                                    throw err;
                                }
                            }
                            sqlExecuted++;
                        }
                    }
                }
                await client.query('COMMIT');
                spinner.succeed(`Applied ${statementsRun} statement(s) from ${sqlExecuted} commit(s)`);
                sqlApplied = true;
                for (const commit of commitsToProcess) {
                    await markCommitAsApplied(connection, commit.hash);
                }
                let hasRenameOperations = false;
                for (const commit of commitsToProcess) {
                    const commitPath = path.join(projectRoot, '.relq', 'commits', `${commit.hash}.json`);
                    if (fs.existsSync(commitPath)) {
                        const enhancedCommit = JSON.parse(fs.readFileSync(commitPath, 'utf-8'));
                        if (enhancedCommit.changes?.some((c) => c.type === 'RENAME')) {
                            hasRenameOperations = true;
                            break;
                        }
                    }
                }
                if (hasRenameOperations) {
                    spinner.start('Updating snapshot after RENAME...');
                    try {
                        const updatedSchema = await fastIntrospectDatabase(connection, undefined, {
                            includeFunctions,
                            includeTriggers,
                        });
                        const snapshotPath = path.join(projectRoot, '.relq', 'snapshot.json');
                        fs.writeFileSync(snapshotPath, JSON.stringify(updatedSchema, null, 2));
                        spinner.succeed('Snapshot updated with renamed objects');
                    }
                    catch (e) {
                        spinner.warn('Could not update snapshot after RENAME - run "relq pull" manually');
                    }
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
                if (error.statementIndex) {
                    errorMsg += `${colors.yellow('Statement #:')} ${error.statementIndex}\n`;
                }
                errorMsg += `\n${colors.muted('All changes rolled back. No commits pushed.')}\n`;
                errorMsg += `\n${colors.cyan('To fix:')} Run ${colors.yellow('relq reset --hard HEAD~1')} then ${colors.yellow('relq pull')} to resync`;
                spinner.fail('SQL execution failed');
                throw new Error(errorMsg);
            }
            finally {
                await client.end();
            }
        }
        if (toPush.length > 0) {
            if (sqlApplied || metadataOnly || dryRun) {
                spinner.start(`Pushing ${toPush.length} commit(s)...`);
                for (const commit of commitsToProcess.length > 0 ? commitsToProcess : [...toPush].reverse()) {
                    await pushCommit(connection, commit, projectRoot);
                    markCommitAsPushed(commit.hash, connection, projectRoot);
                }
                spinner.succeed(`Pushed ${toPush.length} commit(s) to ${getConnectionLabel(connection)}`);
            }
        }
        if (sqlApplied && !dryRun) {
            const latestCommitPath = path.join(projectRoot, '.relq', 'commits', `${localHead}.json`);
            if (fs.existsSync(latestCommitPath)) {
                const latestCommit = JSON.parse(fs.readFileSync(latestCommitPath, 'utf-8'));
                const newSnapshot = latestCommit.schema || latestCommit.snapshot;
                if (newSnapshot) {
                    const snapshotPath = path.join(projectRoot, '.relq', 'snapshot.json');
                    fs.writeFileSync(snapshotPath, JSON.stringify(newSnapshot, null, 2));
                }
            }
            const { saveFileHash, hashFileContent } = await import("../utils/repo-manager.js");
            const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
            saveFileHash(hashFileContent(schemaContent), projectRoot);
        }
        const oldHash = remoteHead ? shortHash(remoteHead) : '(none)';
        const newHash = shortHash(localHead);
        console.log(`   ${oldHash}..${newHash}  ${colors.muted('main -> main')}`);
        if (hasObjectsToDrop && force && !metadataOnly && !dryRun) {
            console.log('');
            warning(`Dropped ${analysis.objectsToDrop.length} object(s) from remote`);
        }
        if (metadataOnly) {
            console.log('');
            console.log(`${colors.muted('Metadata only - SQL not executed. Remove')} ${colors.cyan('--metadata-only')} ${colors.muted('to apply changes.')}`);
        }
        console.log('');
    }
    catch (err) {
        spinner.fail('Push failed');
        fatal(err instanceof Error ? err.message : String(err));
    }
}
function analyzeSync(local, remote, patterns, options) {
    const objectsToDrop = [];
    const schemaDrift = [];
    const localTables = new Set(local.tables.map(t => t.name));
    const localEnums = new Set(local.enums.map(e => e.name));
    const localDomains = new Set(local.domains.map(d => d.name));
    const localSequences = new Set(local.sequences.map(s => s.name));
    const localFunctions = new Set((local.functions || []).map(f => f.name));
    const localViews = new Set((local.views || []).map(v => v.name));
    const localMViews = new Set((local.materializedViews || []).map(v => v.name));
    for (const table of remote.tables) {
        if (isTableIgnored(table.name, patterns).ignored)
            continue;
        if (!localTables.has(table.name)) {
            objectsToDrop.push({ type: 'TABLE', name: table.name });
        }
    }
    for (const enumType of remote.enums) {
        if (isEnumIgnored(enumType.name, patterns).ignored)
            continue;
        if (!localEnums.has(enumType.name)) {
            objectsToDrop.push({ type: 'ENUM', name: enumType.name });
        }
    }
    for (const domain of remote.domains) {
        if (isDomainIgnored(domain.name, patterns).ignored)
            continue;
        if (!localDomains.has(domain.name)) {
            objectsToDrop.push({ type: 'DOMAIN', name: domain.name });
        }
    }
    if (options.includeFunctions) {
        for (const func of remote.functions || []) {
            if (isFunctionIgnored(func.name, patterns).ignored)
                continue;
            if (!localFunctions.has(func.name)) {
                objectsToDrop.push({ type: 'FUNCTION', name: func.name });
            }
        }
    }
    return {
        toPush: [],
        objectsToDrop,
        schemaDrift,
        remoteAhead: false,
    };
}
function checkDropDependencies(objectsToDrop, remoteDb, patterns) {
    const errors = [];
    const droppingTables = new Set(objectsToDrop.filter(o => o.type === 'TABLE').map(o => o.name));
    const droppingEnums = new Set(objectsToDrop.filter(o => o.type === 'ENUM').map(o => o.name));
    const droppingDomains = new Set(objectsToDrop.filter(o => o.type === 'DOMAIN').map(o => o.name));
    const droppingSequences = new Set(objectsToDrop.filter(o => o.type === 'SEQUENCE').map(o => o.name));
    for (const table of remoteDb.tables) {
        if (droppingTables.has(table.name))
            continue;
        if (isTableIgnored(table.name, patterns).ignored)
            continue;
        for (const col of table.columns) {
            if (isColumnIgnored(table.name, col.name, patterns).ignored)
                continue;
            const colType = (col.dataType || '').toLowerCase();
            for (const enumName of droppingEnums) {
                if (colType.includes(enumName.toLowerCase())) {
                    errors.push(`Cannot drop ENUM "${enumName}" - used by column "${table.name}.${col.name}"`);
                }
            }
            for (const domainName of droppingDomains) {
                if (colType.includes(domainName.toLowerCase())) {
                    errors.push(`Cannot drop DOMAIN "${domainName}" - used by column "${table.name}.${col.name}"`);
                }
            }
        }
    }
    return errors;
}
function generateDropSQL(obj) {
    switch (obj.type) {
        case 'TABLE':
            return `DROP TABLE IF EXISTS "${obj.name}" CASCADE;`;
        case 'ENUM':
            return `DROP TYPE IF EXISTS "${obj.name}" CASCADE;`;
        case 'DOMAIN':
            return `DROP DOMAIN IF EXISTS "${obj.name}" CASCADE;`;
        case 'FUNCTION':
            return `DROP FUNCTION IF EXISTS "${obj.name}" CASCADE;`;
        case 'VIEW':
            return `DROP VIEW IF EXISTS "${obj.name}" CASCADE;`;
        case 'MATERIALIZED_VIEW':
            return `DROP MATERIALIZED VIEW IF EXISTS "${obj.name}" CASCADE;`;
        case 'SEQUENCE':
            return `DROP SEQUENCE IF EXISTS "${obj.name}" CASCADE;`;
        default:
            return '';
    }
}
export default pushCommand;
