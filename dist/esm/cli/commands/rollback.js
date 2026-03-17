import { defineCommand } from 'citty';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as p from '@clack/prompts';
import { buildContext } from "../utils/context.js";
import { colors } from "../utils/colors.js";
import { fatal, warning, formatError } from "../utils/ui.js";
import { formatDuration } from "../utils/format.js";
import { requireValidConfig } from "../utils/config-loader.js";
import { getConnectionDescription } from "../utils/env-loader.js";
import { createDatabaseClient } from "../utils/database-client.js";
import { detectDialect } from "../utils/dialect-router.js";
import { getQuoteChar, getParamPlaceholder, parseMigration, } from "../utils/migration-helpers.js";
export default defineCommand({
    meta: { name: 'rollback', description: 'Revert applied migrations or push operations' },
    args: {
        step: { type: 'string', description: 'Rollback n entries (default: 1)' },
        to: { type: 'string', description: 'Rollback to specific migration (exclusive)' },
        'dry-run': { type: 'boolean', description: 'Show what would be reverted' },
        preview: { type: 'boolean', description: 'Alias for --dry-run' },
        force: { type: 'boolean', description: 'Rollback without confirmation' },
        yes: { type: 'boolean', alias: 'y', description: 'Skip confirmation' },
    },
    async run({ args }) {
        const { config } = await buildContext();
        console.log('');
        await requireValidConfig(config, { calledFrom: 'rollback' });
        const connection = config.connection;
        const force = args.force === true;
        const dryRun = args['dry-run'] === true || args.preview === true;
        const skipPrompt = args.yes === true;
        const stepCount = args.step ? parseInt(args.step, 10) : 1;
        const toMigration = args.to;
        const migrationsDir = config.migrations?.directory || './migrations';
        const tableName = config.migrations?.tableName || '_relq_migrations';
        const dialect = detectDialect(config);
        const quote = await getQuoteChar(dialect);
        const spin = p.spinner();
        const startTime = Date.now();
        try {
            spin.start(`Connecting to ${getConnectionDescription(connection)}...`);
            const dbClient = await createDatabaseClient(config);
            spin.stop(`Connected to ${colors.cyan(getConnectionDescription(connection))}`);
            try {
                const appliedResult = await dbClient.query(`SELECT name, sql_down, source FROM ${quote}${tableName}${quote} ORDER BY id DESC;`);
                const appliedRows = appliedResult.rows;
                if (appliedRows.length === 0) {
                    console.log('');
                    console.log('Nothing to rollback.');
                    console.log('');
                    return;
                }
                let toRollback;
                if (toMigration) {
                    const targetIdx = appliedRows.findIndex(m => m.name.includes(toMigration));
                    if (targetIdx === -1) {
                        fatal(`Entry not found in applied list: ${toMigration}`);
                    }
                    toRollback = appliedRows.slice(0, targetIdx);
                }
                else {
                    toRollback = appliedRows.slice(0, stepCount);
                }
                if (toRollback.length === 0) {
                    console.log('');
                    console.log('Nothing to rollback — already at target.');
                    console.log('');
                    return;
                }
                const rollbackPlan = [];
                for (const row of toRollback) {
                    if (row.source === 'push' && row.sql_down) {
                        rollbackPlan.push({ name: row.name, down: row.sql_down, source: 'push' });
                    }
                    else {
                        const filePath = path.join(migrationsDir, row.name);
                        if (!fs.existsSync(filePath)) {
                            warning(`Migration file not found: ${row.name}`);
                            warning('Rollback may be incomplete — manual intervention required.');
                            continue;
                        }
                        const content = fs.readFileSync(filePath, 'utf-8');
                        const { down } = parseMigration(content);
                        if (!down) {
                            warning(`No DOWN section in ${row.name} — skipping`);
                            continue;
                        }
                        rollbackPlan.push({ name: row.name, down, source: 'migrate' });
                    }
                }
                if (rollbackPlan.length === 0) {
                    warning('No rollback SQL found.');
                    console.log('');
                    return;
                }
                console.log('');
                console.log(`${colors.bold('Entries to rollback')} (${rollbackPlan.length}):`);
                for (const item of rollbackPlan) {
                    const tag = item.source === 'push' ? colors.muted('(push)') : colors.muted('(migrate)');
                    console.log(`   ${colors.red('↩')} ${item.name} ${tag}`);
                }
                console.log('');
                if (dryRun) {
                    console.log(`${colors.yellow('Preview')} — rollback SQL:`);
                    console.log('');
                    for (const item of rollbackPlan) {
                        console.log(`   ${colors.muted(`-- ${item.name}`)}`);
                        const preview = item.down.substring(0, 200);
                        console.log(`   ${preview}${item.down.length > 200 ? '...' : ''}`);
                        console.log('');
                    }
                    console.log(`${colors.muted('Remove')} ${colors.cyan('--dry-run')} ${colors.muted('to execute rollback.')}`);
                    console.log('');
                    return;
                }
                if (!force && !skipPrompt) {
                    warning('This will modify your database!');
                    console.log('');
                    const proceed = await p.confirm({
                        message: `Rollback ${rollbackPlan.length} entry/entries?`,
                        initialValue: false,
                    });
                    if (p.isCancel(proceed) || !proceed) {
                        fatal('Operation cancelled by user');
                    }
                    console.log('');
                }
                let rolledBack = 0;
                for (const item of rollbackPlan) {
                    spin.start(`Rolling back ${item.name}...`);
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
                            ? (sql, params) => tx.query(sql, params)
                            : (sql, params) => dbClient.query(sql, params);
                        const statements = item.down.split(';').map(s => s.trim()).filter(s => s.length > 0);
                        for (const stmt of statements) {
                            await executeQuery(stmt);
                        }
                        const placeholder = await getParamPlaceholder(dialect);
                        await executeQuery(`DELETE FROM ${quote}${tableName}${quote} WHERE name = ${placeholder}`, [item.name]);
                        if (tx)
                            await tx.commit();
                        spin.stop(`Rolled back ${item.name}`);
                        rolledBack++;
                    }
                    catch (error) {
                        if (tx) {
                            try {
                                await tx.rollback();
                            }
                            catch { }
                        }
                        spin.error(`Failed: ${item.name}`);
                        let errorMsg = `${colors.red('SQL Error:')} ${error?.message || String(error)}\n`;
                        if (rolledBack > 0) {
                            errorMsg += `\n${colors.yellow(`${rolledBack} entry/entries rolled back before the failure.`)}`;
                        }
                        errorMsg += `\n${colors.muted('Transaction rolled back for this entry.')}`;
                        throw new Error(errorMsg);
                    }
                }
                const duration = Date.now() - startTime;
                console.log('');
                console.log(`Rolled back ${colors.green(String(rolledBack))} entry/entries in ${formatDuration(duration)}`);
                console.log('');
            }
            finally {
                await dbClient.close();
            }
        }
        catch (err) {
            spin.error('Rollback failed');
            fatal(formatError(err));
        }
    },
});
