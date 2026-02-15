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
const citty_1 = require("citty");
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const p = __importStar(require("@clack/prompts"));
const context_1 = require("../utils/context.cjs");
const colors_1 = require("../utils/colors.cjs");
const ui_1 = require("../utils/ui.cjs");
const format_1 = require("../utils/format.cjs");
const config_loader_1 = require("../utils/config-loader.cjs");
const env_loader_1 = require("../utils/env-loader.cjs");
const database_client_1 = require("../utils/database-client.cjs");
const dialect_router_1 = require("../utils/dialect-router.cjs");
const migration_helpers_1 = require("../utils/migration-helpers.cjs");
exports.default = (0, citty_1.defineCommand)({
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
        const { config } = await (0, context_1.buildContext)();
        console.log('');
        await (0, config_loader_1.requireValidConfig)(config, { calledFrom: 'rollback' });
        const connection = config.connection;
        const force = args.force === true;
        const dryRun = args['dry-run'] === true || args.preview === true;
        const skipPrompt = args.yes === true;
        const stepCount = args.step ? parseInt(args.step, 10) : 1;
        const toMigration = args.to;
        const migrationsDir = config.migrations?.directory || './migrations';
        const tableName = config.migrations?.tableName || '_relq_migrations';
        const dialect = (0, dialect_router_1.detectDialect)(config);
        const quote = await (0, migration_helpers_1.getQuoteChar)(dialect);
        const spin = p.spinner();
        const startTime = Date.now();
        try {
            spin.start(`Connecting to ${(0, env_loader_1.getConnectionDescription)(connection)}...`);
            const dbClient = await (0, database_client_1.createDatabaseClient)(config);
            spin.stop(`Connected to ${colors_1.colors.cyan((0, env_loader_1.getConnectionDescription)(connection))}`);
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
                        (0, ui_1.fatal)(`Entry not found in applied list: ${toMigration}`);
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
                            (0, ui_1.warning)(`Migration file not found: ${row.name}`);
                            (0, ui_1.warning)('Rollback may be incomplete — manual intervention required.');
                            continue;
                        }
                        const content = fs.readFileSync(filePath, 'utf-8');
                        const { down } = (0, migration_helpers_1.parseMigration)(content);
                        if (!down) {
                            (0, ui_1.warning)(`No DOWN section in ${row.name} — skipping`);
                            continue;
                        }
                        rollbackPlan.push({ name: row.name, down, source: 'migrate' });
                    }
                }
                if (rollbackPlan.length === 0) {
                    (0, ui_1.warning)('No rollback SQL found.');
                    console.log('');
                    return;
                }
                console.log('');
                console.log(`${colors_1.colors.bold('Entries to rollback')} (${rollbackPlan.length}):`);
                for (const item of rollbackPlan) {
                    const tag = item.source === 'push' ? colors_1.colors.muted('(push)') : colors_1.colors.muted('(migrate)');
                    console.log(`   ${colors_1.colors.red('↩')} ${item.name} ${tag}`);
                }
                console.log('');
                if (dryRun) {
                    console.log(`${colors_1.colors.yellow('Preview')} — rollback SQL:`);
                    console.log('');
                    for (const item of rollbackPlan) {
                        console.log(`   ${colors_1.colors.muted(`-- ${item.name}`)}`);
                        const preview = item.down.substring(0, 200);
                        console.log(`   ${preview}${item.down.length > 200 ? '...' : ''}`);
                        console.log('');
                    }
                    console.log(`${colors_1.colors.muted('Remove')} ${colors_1.colors.cyan('--dry-run')} ${colors_1.colors.muted('to execute rollback.')}`);
                    console.log('');
                    return;
                }
                if (!force && !skipPrompt) {
                    (0, ui_1.warning)('This will modify your database!');
                    console.log('');
                    const proceed = await p.confirm({
                        message: `Rollback ${rollbackPlan.length} entry/entries?`,
                        initialValue: false,
                    });
                    if (p.isCancel(proceed) || !proceed) {
                        (0, ui_1.fatal)('Operation cancelled by user');
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
                        const placeholder = await (0, migration_helpers_1.getParamPlaceholder)(dialect);
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
                        let errorMsg = `${colors_1.colors.red('SQL Error:')} ${error?.message || String(error)}\n`;
                        if (rolledBack > 0) {
                            errorMsg += `\n${colors_1.colors.yellow(`${rolledBack} entry/entries rolled back before the failure.`)}`;
                        }
                        errorMsg += `\n${colors_1.colors.muted('Transaction rolled back for this entry.')}`;
                        throw new Error(errorMsg);
                    }
                }
                const duration = Date.now() - startTime;
                console.log('');
                console.log(`Rolled back ${colors_1.colors.green(String(rolledBack))} entry/entries in ${(0, format_1.formatDuration)(duration)}`);
                console.log('');
            }
            finally {
                await dbClient.close();
            }
        }
        catch (err) {
            spin.error('Rollback failed');
            (0, ui_1.fatal)((0, ui_1.formatError)(err));
        }
    },
});
