import { defineCommand } from 'citty';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as p from '@clack/prompts';
import { buildContext } from "../utils/context.js";
import { colors } from "../utils/colors.js";
import { fatal, warning, formatError } from "../utils/ui.js";
import { formatDuration, formatSize } from "../utils/format.js";
import { requireValidConfig } from "../utils/config-loader.js";
import { getConnectionDescription } from "../utils/env-loader.js";
import { createDatabaseClient } from "../utils/database-client.js";
import { splitStatements } from "../utils/migration-helpers.js";
export default defineCommand({
    meta: { name: 'seed', description: 'Seed database with data' },
    args: {
        file: { type: 'string', description: 'Seed from a specific file' },
        'dry-run': { type: 'boolean', description: 'Show seed SQL without executing' },
        force: { type: 'boolean', description: 'Seed without confirmation' },
        yes: { type: 'boolean', alias: 'y', description: 'Skip confirmation' },
    },
    async run({ args }) {
        const { config } = await buildContext();
        console.log('');
        await requireValidConfig(config, { calledFrom: 'seed' });
        const connection = config.connection;
        const dryRun = args['dry-run'] === true;
        const force = args.force === true;
        const skipPrompt = args.yes === true;
        const specificFile = args.file;
        const seedDir = './seeds';
        const spin = p.spinner();
        const startTime = Date.now();
        try {
            let seedFiles;
            if (specificFile) {
                if (!fs.existsSync(specificFile)) {
                    fatal(`Seed file not found: ${specificFile}`);
                }
                seedFiles = [path.resolve(specificFile)];
            }
            else {
                if (!fs.existsSync(seedDir)) {
                    console.log('No seeds directory found.');
                    console.log(`${colors.muted('Create')} ${colors.cyan(seedDir + '/')} ${colors.muted('with .sql files to seed.')}`);
                    console.log('');
                    return;
                }
                seedFiles = fs.readdirSync(seedDir)
                    .filter(f => f.endsWith('.sql'))
                    .sort()
                    .map(f => path.join(seedDir, f));
                if (seedFiles.length === 0) {
                    console.log('No seed files found.');
                    console.log(`${colors.muted('Add .sql files to')} ${colors.cyan(seedDir + '/')} ${colors.muted('to seed.')}`);
                    console.log('');
                    return;
                }
            }
            console.log(`${colors.bold('Seed files')} (${seedFiles.length}):`);
            for (const file of seedFiles) {
                const size = fs.statSync(file).size;
                console.log(`   ${colors.cyan('•')} ${path.basename(file)} ${colors.muted(`(${formatSize(size)})`)}`);
            }
            console.log('');
            if (!force && !skipPrompt && !dryRun) {
                const proceed = await p.confirm({
                    message: `Seed database with ${seedFiles.length} file(s)?`,
                    initialValue: true,
                });
                if (p.isCancel(proceed) || !proceed) {
                    fatal('Operation cancelled by user');
                }
                console.log('');
            }
            spin.start(`Connecting to ${getConnectionDescription(connection)}...`);
            const dbClient = await createDatabaseClient(config);
            spin.stop(`Connected to ${colors.cyan(getConnectionDescription(connection))}`);
            try {
                let totalStatements = 0;
                for (const file of seedFiles) {
                    const content = fs.readFileSync(file, 'utf-8').trim();
                    if (!content) {
                        warning(`Skipping empty file: ${path.basename(file)}`);
                        continue;
                    }
                    const statements = splitStatements(content)
                        .filter(s => !s.startsWith('--'));
                    if (statements.length === 0) {
                        warning(`No SQL statements in ${path.basename(file)}`);
                        continue;
                    }
                    if (dryRun) {
                        console.log('');
                        console.log(`${colors.yellow('Would execute:')} ${path.basename(file)} (${statements.length} statements)`);
                        for (const stmt of statements.slice(0, 3)) {
                            const preview = stmt.substring(0, 120);
                            console.log(`   ${colors.muted(preview)}${stmt.length > 120 ? '...' : ''}`);
                        }
                        if (statements.length > 3) {
                            console.log(`   ${colors.muted(`... and ${statements.length - 3} more`)}`);
                        }
                        totalStatements += statements.length;
                        continue;
                    }
                    spin.start(`Seeding from ${path.basename(file)}...`);
                    let tx = null;
                    try {
                        try {
                            tx = await dbClient.beginTransaction();
                        }
                        catch (txError) {
                            if (!txError.message?.includes('not supported'))
                                throw txError;
                        }
                        const executeQuery = tx
                            ? (sql) => tx.query(sql)
                            : (sql) => dbClient.query(sql);
                        let statementsRun = 0;
                        for (const stmt of statements) {
                            try {
                                await executeQuery(stmt);
                                statementsRun++;
                            }
                            catch (stmtError) {
                                const err = new Error(stmtError.message);
                                err.failedStatement = stmt;
                                err.statementIndex = statementsRun + 1;
                                err.file = path.basename(file);
                                throw err;
                            }
                        }
                        if (tx)
                            await tx.commit();
                        spin.stop(`Seeded from ${path.basename(file)} (${statementsRun} statements)`);
                        totalStatements += statementsRun;
                    }
                    catch (error) {
                        if (tx) {
                            try {
                                await tx.rollback();
                            }
                            catch { }
                        }
                        spin.error(`Failed: ${path.basename(file)}`);
                        let errorMsg = `${colors.red('SQL Error:')} ${error?.message || String(error)}\n`;
                        if (error.failedStatement) {
                            errorMsg += `\n${colors.yellow('Failed Statement:')} ${error.failedStatement.substring(0, 200)}\n`;
                        }
                        if (error.statementIndex) {
                            errorMsg += `${colors.yellow('Statement #:')} ${error.statementIndex}\n`;
                        }
                        errorMsg += `\n${colors.muted('Transaction rolled back for this file.')}`;
                        throw new Error(errorMsg);
                    }
                }
                const duration = Date.now() - startTime;
                console.log('');
                if (dryRun) {
                    console.log(`${colors.yellow('Dry run')} — ${totalStatements} statement(s) across ${seedFiles.length} file(s) would be executed.`);
                    console.log(`${colors.muted('Remove')} ${colors.cyan('--dry-run')} ${colors.muted('to execute.')}`);
                }
                else {
                    console.log(`Seeded ${colors.green(String(totalStatements))} statement(s) in ${formatDuration(duration)}`);
                }
                console.log('');
            }
            finally {
                await dbClient.close();
            }
        }
        catch (err) {
            spin.error('Seed failed');
            fatal(formatError(err));
        }
    },
});
