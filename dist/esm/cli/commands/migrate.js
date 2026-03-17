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
import { getQuoteChar, getParamPlaceholder, getMigrationTableDDL, parseMigration, splitStatements, } from "../utils/migration-helpers.js";
export default defineCommand({
    meta: { name: 'migrate', description: 'Apply pending migrations' },
    args: {
        'dry-run': { type: 'boolean', description: 'Show without executing' },
        force: { type: 'boolean', description: 'Apply without confirmation' },
        yes: { type: 'boolean', alias: 'y', description: 'Skip confirmation' },
        step: { type: 'string', description: 'Apply n migrations' },
        to: { type: 'string', description: 'Migrate up to name' },
    },
    async run({ args }) {
        const { config } = await buildContext();
        console.log('');
        await requireValidConfig(config, { calledFrom: 'migrate' });
        const connection = config.connection;
        const dryRun = args['dry-run'] === true;
        const force = args.force === true;
        const skipPrompt = args.yes === true;
        const stepLimit = args.step ? parseInt(args.step, 10) : 0;
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
                const ddl = await getMigrationTableDDL(config, tableName);
                await dbClient.query(ddl);
                const appliedResult = await dbClient.query(`SELECT name FROM ${quote}${tableName}${quote} ORDER BY id;`);
                const appliedMigrations = new Set(appliedResult.rows.map((r) => r.name));
                if (!fs.existsSync(migrationsDir)) {
                    console.log('');
                    console.log('No migrations directory found.');
                    console.log(`${colors.muted('Run')} ${colors.cyan('relq generate')} ${colors.muted('to create a migration.')}`);
                    console.log('');
                    return;
                }
                const migrationFiles = fs.readdirSync(migrationsDir)
                    .filter(f => f.endsWith('.sql'))
                    .sort();
                let pending = migrationFiles.filter(f => !appliedMigrations.has(f));
                if (toMigration) {
                    const idx = pending.findIndex(f => f.includes(toMigration));
                    if (idx === -1) {
                        fatal(`Migration not found: ${toMigration}`);
                    }
                    pending = pending.slice(0, idx + 1);
                }
                if (stepLimit > 0) {
                    pending = pending.slice(0, stepLimit);
                }
                if (pending.length === 0) {
                    console.log('');
                    console.log('No pending migrations.');
                    console.log('');
                    return;
                }
                console.log('');
                console.log(`${colors.bold('Pending migrations')} (${pending.length}):`);
                for (const file of pending) {
                    console.log(`   ${colors.cyan('•')} ${file}`);
                }
                console.log('');
                if (!force && !skipPrompt && !dryRun) {
                    const proceed = await p.confirm({
                        message: 'Apply these migrations?',
                        initialValue: true,
                    });
                    if (p.isCancel(proceed) || !proceed) {
                        fatal('Operation cancelled by user');
                    }
                    console.log('');
                }
                let applied = 0;
                for (const file of pending) {
                    const filePath = path.join(migrationsDir, file);
                    const content = fs.readFileSync(filePath, 'utf-8');
                    const { up } = parseMigration(content);
                    if (!up) {
                        warning(`Skipping ${file} (no UP section)`);
                        continue;
                    }
                    if (dryRun) {
                        console.log(`${colors.yellow('Would apply:')} ${file}`);
                        const preview = up.substring(0, 200);
                        console.log(`   ${colors.muted(preview)}${up.length > 200 ? '...' : ''}`);
                        console.log('');
                        applied++;
                        continue;
                    }
                    spin.start(`Applying ${file}...`);
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
                        const statements = splitStatements(up);
                        for (const stmt of statements) {
                            await executeQuery(stmt);
                        }
                        const p1 = await getParamPlaceholder(dialect, 1);
                        const p2 = await getParamPlaceholder(dialect, 2);
                        const p3 = await getParamPlaceholder(dialect, 3);
                        const p4 = await getParamPlaceholder(dialect, 4);
                        await executeQuery(`INSERT INTO ${quote}${tableName}${quote} (name, filename, hash, batch) VALUES (${p1}, ${p2}, ${p3}, ${p4})`, [file.replace(/\.sql$/, ''), file, file, applied + 1]);
                        if (tx)
                            await tx.commit();
                        spin.stop(`Applied ${file}`);
                        applied++;
                    }
                    catch (error) {
                        if (tx) {
                            try {
                                await tx.rollback();
                            }
                            catch { }
                        }
                        spin.error(`Failed: ${file}`);
                        throw error;
                    }
                }
                const duration = Date.now() - startTime;
                console.log('');
                if (dryRun) {
                    console.log(`${colors.yellow('Dry run')} — ${applied} migration(s) would be applied.`);
                    console.log(`${colors.muted('Remove')} ${colors.cyan('--dry-run')} ${colors.muted('to apply.')}`);
                }
                else {
                    console.log(`Applied ${colors.green(String(applied))} migration(s) in ${formatDuration(duration)}`);
                }
                console.log('');
            }
            finally {
                await dbClient.close();
            }
        }
        catch (error) {
            spin.error('Migration failed');
            fatal(formatError(error));
        }
    },
});
