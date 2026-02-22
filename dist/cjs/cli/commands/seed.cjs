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
const migration_helpers_1 = require("../utils/migration-helpers.cjs");
exports.default = (0, citty_1.defineCommand)({
    meta: { name: 'seed', description: 'Seed database with data' },
    args: {
        file: { type: 'string', description: 'Seed from a specific file' },
        'dry-run': { type: 'boolean', description: 'Show seed SQL without executing' },
        force: { type: 'boolean', description: 'Seed without confirmation' },
        yes: { type: 'boolean', alias: 'y', description: 'Skip confirmation' },
    },
    async run({ args }) {
        const { config } = await (0, context_1.buildContext)();
        console.log('');
        await (0, config_loader_1.requireValidConfig)(config, { calledFrom: 'seed' });
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
                    (0, ui_1.fatal)(`Seed file not found: ${specificFile}`);
                }
                seedFiles = [path.resolve(specificFile)];
            }
            else {
                if (!fs.existsSync(seedDir)) {
                    console.log('No seeds directory found.');
                    console.log(`${colors_1.colors.muted('Create')} ${colors_1.colors.cyan(seedDir + '/')} ${colors_1.colors.muted('with .sql files to seed.')}`);
                    console.log('');
                    return;
                }
                seedFiles = fs.readdirSync(seedDir)
                    .filter(f => f.endsWith('.sql'))
                    .sort()
                    .map(f => path.join(seedDir, f));
                if (seedFiles.length === 0) {
                    console.log('No seed files found.');
                    console.log(`${colors_1.colors.muted('Add .sql files to')} ${colors_1.colors.cyan(seedDir + '/')} ${colors_1.colors.muted('to seed.')}`);
                    console.log('');
                    return;
                }
            }
            console.log(`${colors_1.colors.bold('Seed files')} (${seedFiles.length}):`);
            for (const file of seedFiles) {
                const size = fs.statSync(file).size;
                console.log(`   ${colors_1.colors.cyan('•')} ${path.basename(file)} ${colors_1.colors.muted(`(${(0, format_1.formatSize)(size)})`)}`);
            }
            console.log('');
            if (!force && !skipPrompt && !dryRun) {
                const proceed = await p.confirm({
                    message: `Seed database with ${seedFiles.length} file(s)?`,
                    initialValue: true,
                });
                if (p.isCancel(proceed) || !proceed) {
                    (0, ui_1.fatal)('Operation cancelled by user');
                }
                console.log('');
            }
            spin.start(`Connecting to ${(0, env_loader_1.getConnectionDescription)(connection)}...`);
            const dbClient = await (0, database_client_1.createDatabaseClient)(config);
            spin.stop(`Connected to ${colors_1.colors.cyan((0, env_loader_1.getConnectionDescription)(connection))}`);
            try {
                let totalStatements = 0;
                for (const file of seedFiles) {
                    const content = fs.readFileSync(file, 'utf-8').trim();
                    if (!content) {
                        (0, ui_1.warning)(`Skipping empty file: ${path.basename(file)}`);
                        continue;
                    }
                    const statements = (0, migration_helpers_1.splitStatements)(content)
                        .filter(s => !s.startsWith('--'));
                    if (statements.length === 0) {
                        (0, ui_1.warning)(`No SQL statements in ${path.basename(file)}`);
                        continue;
                    }
                    if (dryRun) {
                        console.log('');
                        console.log(`${colors_1.colors.yellow('Would execute:')} ${path.basename(file)} (${statements.length} statements)`);
                        for (const stmt of statements.slice(0, 3)) {
                            const preview = stmt.substring(0, 120);
                            console.log(`   ${colors_1.colors.muted(preview)}${stmt.length > 120 ? '...' : ''}`);
                        }
                        if (statements.length > 3) {
                            console.log(`   ${colors_1.colors.muted(`... and ${statements.length - 3} more`)}`);
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
                        let errorMsg = `${colors_1.colors.red('SQL Error:')} ${error?.message || String(error)}\n`;
                        if (error.failedStatement) {
                            errorMsg += `\n${colors_1.colors.yellow('Failed Statement:')} ${error.failedStatement.substring(0, 200)}\n`;
                        }
                        if (error.statementIndex) {
                            errorMsg += `${colors_1.colors.yellow('Statement #:')} ${error.statementIndex}\n`;
                        }
                        errorMsg += `\n${colors_1.colors.muted('Transaction rolled back for this file.')}`;
                        throw new Error(errorMsg);
                    }
                }
                const duration = Date.now() - startTime;
                console.log('');
                if (dryRun) {
                    console.log(`${colors_1.colors.yellow('Dry run')} — ${totalStatements} statement(s) across ${seedFiles.length} file(s) would be executed.`);
                    console.log(`${colors_1.colors.muted('Remove')} ${colors_1.colors.cyan('--dry-run')} ${colors_1.colors.muted('to execute.')}`);
                }
                else {
                    console.log(`Seeded ${colors_1.colors.green(String(totalStatements))} statement(s) in ${(0, format_1.formatDuration)(duration)}`);
                }
                console.log('');
            }
            finally {
                await dbClient.close();
            }
        }
        catch (err) {
            spin.error('Seed failed');
            (0, ui_1.fatal)((0, ui_1.formatError)(err));
        }
    },
});
