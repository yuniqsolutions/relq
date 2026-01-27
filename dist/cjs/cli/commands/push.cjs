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
exports.pushCommand = pushCommand;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const config_1 = require("../../config/config.cjs");
const config_loader_1 = require("../utils/config-loader.cjs");
const dsql_validator_1 = require("../utils/dsql-validator.cjs");
const env_loader_1 = require("../utils/env-loader.cjs");
const cli_utils_1 = require("../utils/cli-utils.cjs");
const fast_introspect_1 = require("../utils/fast-introspect.cjs");
const relqignore_1 = require("../utils/relqignore.cjs");
const repo_manager_1 = require("../utils/repo-manager.cjs");
const types_manager_1 = require("../utils/types-manager.cjs");
const config_loader_2 = require("../utils/config-loader.cjs");
async function pushCommand(context) {
    const { config, flags } = context;
    if (!config) {
        (0, cli_utils_1.fatal)('No configuration found', `Run ${cli_utils_1.colors.cyan('relq init')} to create one.`);
    }
    await (0, config_loader_1.requireValidConfig)(config, { calledFrom: 'push' });
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
    if (!(0, repo_manager_1.isInitialized)(projectRoot)) {
        (0, cli_utils_1.fatal)('not a relq repository (or any parent directories): .relq', `Run ${cli_utils_1.colors.cyan('relq init')} to initialize.`);
    }
    const localHead = (0, repo_manager_1.getHead)(projectRoot);
    if (!localHead) {
        (0, cli_utils_1.fatal)('no commits to push', `Run ${cli_utils_1.colors.cyan('relq commit -m "message"')} to create a commit.`);
    }
    const spinner = (0, cli_utils_1.createSpinner)();
    try {
        spinner.start('Connecting to remote...');
        await (0, repo_manager_1.ensureRemoteTable)(connection);
        spinner.succeed(`Connected to ${cli_utils_1.colors.cyan((0, env_loader_1.getConnectionDescription)(connection))}`);
        spinner.start('Checking remote commits...');
        const remoteCommits = await (0, repo_manager_1.fetchRemoteCommits)(connection, 100);
        const remoteHead = remoteCommits.length > 0 ? remoteCommits[0].hash : null;
        const localCommits = (0, repo_manager_1.getAllCommits)(projectRoot);
        const remoteHashes = new Set(remoteCommits.map(c => c.hash));
        const localHashes = new Set(localCommits.map(c => c.hash));
        const toPush = localCommits.filter(c => {
            if (remoteHashes.has(c.hash))
                return false;
            const syncStatus = (0, repo_manager_1.isCommitSyncedWith)(c, connection);
            if (syncStatus.synced) {
                return false;
            }
            return true;
        });
        const remoteMissing = remoteCommits.filter(c => !localHashes.has(c.hash));
        spinner.succeed('Checked remote commits');
        spinner.start('Introspecting remote database...');
        const remoteDb = await (0, fast_introspect_1.fastIntrospectDatabase)(connection, undefined, {
            includeFunctions,
            includeTriggers,
        });
        spinner.succeed(`Found ${remoteDb.tables.length} tables in remote`);
        const localSnapshot = (0, repo_manager_1.loadSnapshot)(projectRoot);
        if (!localSnapshot) {
            spinner.stop();
            (0, cli_utils_1.fatal)('No local snapshot found', `Run ${cli_utils_1.colors.cyan('relq pull')} or ${cli_utils_1.colors.cyan('relq import')} first.`);
        }
        const ignorePatterns = (0, relqignore_1.loadRelqignore)(projectRoot);
        const analysis = analyzeSync(localSnapshot, remoteDb, ignorePatterns, { includeFunctions, includeTriggers, includeViews });
        const hasRemoteAhead = remoteMissing.length > 0;
        const hasObjectsToDrop = analysis.objectsToDrop.length > 0;
        const hasSchemaDrift = analysis.schemaDrift.length > 0;
        if (hasRemoteAhead && !force) {
            spinner.stop();
            console.log('');
            for (const commit of remoteMissing.slice(0, 3)) {
                console.log(`   ${cli_utils_1.colors.yellow((0, repo_manager_1.shortHash)(commit.hash))} ${commit.message}`);
            }
            if (remoteMissing.length > 3) {
                console.log(`   ${cli_utils_1.colors.muted(`... and ${remoteMissing.length - 3} more`)}`);
            }
            (0, cli_utils_1.fatal)(`Remote has ${remoteMissing.length} commit(s) you don't have locally`, `Run ${cli_utils_1.colors.cyan('relq pull')} to integrate remote changes.\nUse ${cli_utils_1.colors.cyan('relq push --force')} to override (may cause data loss).`);
        }
        if (hasObjectsToDrop) {
            console.log('');
            (0, cli_utils_1.warning)(`Remote has ${analysis.objectsToDrop.length} object(s) not in your local schema:`);
            console.log('');
            for (const obj of analysis.objectsToDrop.slice(0, 10)) {
                console.log(`   ${cli_utils_1.colors.red('DROP')} ${obj.type.toLowerCase()}: ${obj.name}`);
            }
            if (analysis.objectsToDrop.length > 10) {
                console.log(`   ${cli_utils_1.colors.muted(`... and ${analysis.objectsToDrop.length - 10} more`)}`);
            }
            console.log('');
            if (!force) {
                (0, cli_utils_1.fatal)('Cannot push - remote has objects not in your history', `Run ${cli_utils_1.colors.cyan('relq pull')} first to sync your local schema.\nUse ${cli_utils_1.colors.cyan('relq push --force')} to DROP these objects from remote.`);
            }
            const dependencyErrors = checkDropDependencies(analysis.objectsToDrop, remoteDb, ignorePatterns);
            if (dependencyErrors.length > 0) {
                console.log('');
                for (const err of dependencyErrors) {
                    console.log(`   ${err}`);
                }
                (0, cli_utils_1.fatal)('Cannot drop objects due to dependencies', `These objects are used by non-ignored objects in your schema.\nEither add them to .relqignore or import them with ${cli_utils_1.colors.cyan('relq pull')}`);
            }
            if (!skipPrompt && !dryRun) {
                (0, cli_utils_1.warning)('This will DROP data from your database!');
                console.log('');
                const confirmed = await (0, cli_utils_1.confirm)(`Drop ${analysis.objectsToDrop.length} object(s) from remote?`, false);
                if (!confirmed) {
                    (0, cli_utils_1.fatal)('Operation cancelled by user');
                }
            }
        }
        const schemaPath = (0, config_loader_2.getSchemaPath)(config);
        const typesFilePath = (0, types_manager_1.getTypesFilePath)(schemaPath);
        let typesSynced = false;
        if (fs.existsSync(schemaPath)) {
            spinner.start('Validating types configuration...');
            const validationErrors = await (0, types_manager_1.validateTypesConfiguration)(schemaPath, typesFilePath);
            if (validationErrors.length > 0) {
                spinner.fail('Types validation failed');
                console.log('');
                for (const err of validationErrors) {
                    console.log(`${cli_utils_1.colors.red('error:')} ${err.message}`);
                    if (err.details && err.details.length > 0) {
                        for (const detail of err.details) {
                            console.log(`   ${cli_utils_1.colors.muted('→')} ${detail}`);
                        }
                    }
                    if (err.hint) {
                        console.log(`   ${cli_utils_1.colors.cyan('hint:')} ${err.hint}`);
                    }
                    console.log('');
                }
                (0, cli_utils_1.fatal)('Types configuration is invalid', `Fix the issues above and try again.\nTypes must be defined in ${cli_utils_1.colors.cyan(path.basename(typesFilePath))} to enable database syncing.`);
            }
            spinner.succeed('Types configuration valid');
        }
        if (fs.existsSync(typesFilePath) && !dryRun) {
            spinner.start('Syncing TypeScript types...');
            const typesResult = await (0, types_manager_1.syncTypesToDb)(connection, typesFilePath, schemaPath);
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
        const pushedButNotApplied = await (0, repo_manager_1.getPushedButNotAppliedCommits)(connection, [...localHashes]);
        if (pushedButNotApplied.length > 0 && !metadataOnly && !dryRun) {
            spinner.start(`Recovering ${pushedButNotApplied.length} commit(s) with pending SQL...`);
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
                    await (0, repo_manager_1.markCommitAsApplied)(connection, hash);
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
        console.log(`Pushing to ${cli_utils_1.colors.cyan((0, env_loader_1.getConnectionDescription)(connection))}`);
        console.log('');
        if (toPush.length > 0) {
            console.log(`${cli_utils_1.colors.cyan('Commits:')} ${toPush.length}`);
            for (const commit of toPush.slice(0, 5)) {
                console.log(`   ${cli_utils_1.colors.yellow((0, repo_manager_1.shortHash)(commit.hash))} ${commit.message}`);
            }
            if (toPush.length > 5) {
                console.log(`   ${cli_utils_1.colors.muted(`... and ${toPush.length - 5} more`)}`);
            }
            console.log('');
        }
        if (dryRun) {
            console.log(`${cli_utils_1.colors.yellow('Dry run')} - showing changes that would be applied`);
            console.log('');
            if (hasObjectsToDrop && force) {
                console.log(`${cli_utils_1.colors.red('DROP statements:')}`);
                for (const obj of analysis.objectsToDrop.slice(0, 5)) {
                    console.log(`   ${generateDropSQL(obj)}`);
                }
                if (analysis.objectsToDrop.length > 5) {
                    console.log(`   ${cli_utils_1.colors.muted(`... and ${analysis.objectsToDrop.length - 5} more`)}`);
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
                        console.log(`${cli_utils_1.colors.cyan(`Commit ${(0, repo_manager_1.shortHash)(commit.hash)}:`)} ${commit.message}`);
                        for (const stmt of statements.slice(0, 3)) {
                            console.log(`   ${stmt.trim().substring(0, 80)}${stmt.trim().length > 80 ? '...' : ''};`);
                        }
                        if (statements.length > 3) {
                            console.log(`   ${cli_utils_1.colors.muted(`... and ${statements.length - 3} more statements`)}`);
                        }
                        console.log('');
                    }
                }
            }
            if (totalStatements === 0 && !hasObjectsToDrop) {
                console.log(`${cli_utils_1.colors.muted('No SQL changes to apply')}`);
            }
            else {
                console.log(`${cli_utils_1.colors.muted('Total:')} ${totalStatements + (hasObjectsToDrop ? analysis.objectsToDrop.length : 0)} statements`);
            }
            console.log('');
            console.log(`${cli_utils_1.colors.muted('Remove')} ${cli_utils_1.colors.cyan('--dry-run')} ${cli_utils_1.colors.muted('to execute these changes.')}`);
            console.log('');
            return;
        }
        if ((0, config_1.isAwsDsqlConfig)(connection) && !metadataOnly && !dryRun && toPush.length > 0) {
            const allSqlErrors = [];
            for (const commit of toPush) {
                const commitPath = path.join(projectRoot, '.relq', 'commits', `${commit.hash}.json`);
                if (fs.existsSync(commitPath)) {
                    const enhancedCommit = JSON.parse(fs.readFileSync(commitPath, 'utf-8'));
                    if (enhancedCommit.sql && enhancedCommit.sql.trim()) {
                        const errors = (0, dsql_validator_1.validateSqlForDsql)(enhancedCommit.sql, `commit:${(0, repo_manager_1.shortHash)(commit.hash)}`);
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
                console.log((0, dsql_validator_1.formatDsqlErrors)(dsqlResult));
                (0, cli_utils_1.fatal)('Push SQL contains DSQL incompatibilities', 'Fix the issues above before pushing to AWS DSQL.');
            }
        }
        let sqlApplied = false;
        let commitsToProcess = [];
        if (!metadataOnly && !dryRun && (toPush.length > 0 || (hasObjectsToDrop && force))) {
            commitsToProcess = [...toPush].reverse();
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
                    await (0, repo_manager_1.markCommitAsApplied)(connection, commit.hash);
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
                        const updatedSchema = await (0, fast_introspect_1.fastIntrospectDatabase)(connection, undefined, {
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
                if (error.statementIndex) {
                    errorMsg += `${cli_utils_1.colors.yellow('Statement #:')} ${error.statementIndex}\n`;
                }
                errorMsg += `\n${cli_utils_1.colors.muted('All changes rolled back. No commits pushed.')}\n`;
                errorMsg += `\n${cli_utils_1.colors.cyan('To fix:')} Run ${cli_utils_1.colors.yellow('relq reset --hard HEAD~1')} then ${cli_utils_1.colors.yellow('relq pull')} to resync`;
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
                    await (0, repo_manager_1.pushCommit)(connection, commit, projectRoot);
                    (0, repo_manager_1.markCommitAsPushed)(commit.hash, connection, projectRoot);
                }
                spinner.succeed(`Pushed ${toPush.length} commit(s) to ${(0, repo_manager_1.getConnectionLabel)(connection)}`);
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
            const { saveFileHash, hashFileContent } = await Promise.resolve().then(() => __importStar(require("../utils/repo-manager.cjs")));
            const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
            saveFileHash(hashFileContent(schemaContent), projectRoot);
        }
        const oldHash = remoteHead ? (0, repo_manager_1.shortHash)(remoteHead) : '(none)';
        const newHash = (0, repo_manager_1.shortHash)(localHead);
        console.log(`   ${oldHash}..${newHash}  ${cli_utils_1.colors.muted('main -> main')}`);
        if (hasObjectsToDrop && force && !metadataOnly && !dryRun) {
            console.log('');
            (0, cli_utils_1.warning)(`Dropped ${analysis.objectsToDrop.length} object(s) from remote`);
        }
        if (metadataOnly) {
            console.log('');
            console.log(`${cli_utils_1.colors.muted('Metadata only - SQL not executed. Remove')} ${cli_utils_1.colors.cyan('--metadata-only')} ${cli_utils_1.colors.muted('to apply changes.')}`);
        }
        console.log('');
    }
    catch (err) {
        spinner.fail('Push failed');
        (0, cli_utils_1.fatal)(err instanceof Error ? err.message : String(err));
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
        if ((0, relqignore_1.isTableIgnored)(table.name, patterns).ignored)
            continue;
        if (!localTables.has(table.name)) {
            objectsToDrop.push({ type: 'TABLE', name: table.name });
        }
    }
    for (const enumType of remote.enums) {
        if ((0, relqignore_1.isEnumIgnored)(enumType.name, patterns).ignored)
            continue;
        if (!localEnums.has(enumType.name)) {
            objectsToDrop.push({ type: 'ENUM', name: enumType.name });
        }
    }
    for (const domain of remote.domains) {
        if ((0, relqignore_1.isDomainIgnored)(domain.name, patterns).ignored)
            continue;
        if (!localDomains.has(domain.name)) {
            objectsToDrop.push({ type: 'DOMAIN', name: domain.name });
        }
    }
    if (options.includeFunctions) {
        for (const func of remote.functions || []) {
            if ((0, relqignore_1.isFunctionIgnored)(func.name, patterns).ignored)
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
        if ((0, relqignore_1.isTableIgnored)(table.name, patterns).ignored)
            continue;
        for (const col of table.columns) {
            if ((0, relqignore_1.isColumnIgnored)(table.name, col.name, patterns).ignored)
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
exports.default = pushCommand;
