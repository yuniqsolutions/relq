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
    meta: { name: 'migrate', description: 'Apply pending migrations' },
    args: {
        'dry-run': { type: 'boolean', description: 'Show without executing' },
        force: { type: 'boolean', description: 'Apply without confirmation' },
        yes: { type: 'boolean', alias: 'y', description: 'Skip confirmation' },
        step: { type: 'string', description: 'Apply n migrations' },
        to: { type: 'string', description: 'Migrate up to name' },
    },
    async run({ args }) {
        const { config } = await (0, context_1.buildContext)();
        console.log('');
        await (0, config_loader_1.requireValidConfig)(config, { calledFrom: 'migrate' });
        const connection = config.connection;
        const dryRun = args['dry-run'] === true;
        const force = args.force === true;
        const skipPrompt = args.yes === true;
        const stepLimit = args.step ? parseInt(args.step, 10) : 0;
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
                const ddl = await (0, migration_helpers_1.getMigrationTableDDL)(config, tableName);
                await dbClient.query(ddl);
                const appliedResult = await dbClient.query(`SELECT name FROM ${quote}${tableName}${quote} ORDER BY id;`);
                const appliedMigrations = new Set(appliedResult.rows.map((r) => r.name));
                if (!fs.existsSync(migrationsDir)) {
                    console.log('');
                    console.log('No migrations directory found.');
                    console.log(`${colors_1.colors.muted('Run')} ${colors_1.colors.cyan('relq generate')} ${colors_1.colors.muted('to create a migration.')}`);
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
                        (0, ui_1.fatal)(`Migration not found: ${toMigration}`);
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
                console.log(`${colors_1.colors.bold('Pending migrations')} (${pending.length}):`);
                for (const file of pending) {
                    console.log(`   ${colors_1.colors.cyan('•')} ${file}`);
                }
                console.log('');
                if (!force && !skipPrompt && !dryRun) {
                    const proceed = await p.confirm({
                        message: 'Apply these migrations?',
                        initialValue: true,
                    });
                    if (p.isCancel(proceed) || !proceed) {
                        (0, ui_1.fatal)('Operation cancelled by user');
                    }
                    console.log('');
                }
                let applied = 0;
                for (const file of pending) {
                    const filePath = path.join(migrationsDir, file);
                    const content = fs.readFileSync(filePath, 'utf-8');
                    const { up } = (0, migration_helpers_1.parseMigration)(content);
                    if (!up) {
                        (0, ui_1.warning)(`Skipping ${file} (no UP section)`);
                        continue;
                    }
                    if (dryRun) {
                        console.log(`${colors_1.colors.yellow('Would apply:')} ${file}`);
                        const preview = up.substring(0, 200);
                        console.log(`   ${colors_1.colors.muted(preview)}${up.length > 200 ? '...' : ''}`);
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
                        const statements = (0, migration_helpers_1.splitStatements)(up);
                        for (const stmt of statements) {
                            await executeQuery(stmt);
                        }
                        const p1 = await (0, migration_helpers_1.getParamPlaceholder)(dialect, 1);
                        const p2 = await (0, migration_helpers_1.getParamPlaceholder)(dialect, 2);
                        const p3 = await (0, migration_helpers_1.getParamPlaceholder)(dialect, 3);
                        const p4 = await (0, migration_helpers_1.getParamPlaceholder)(dialect, 4);
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
                    console.log(`${colors_1.colors.yellow('Dry run')} — ${applied} migration(s) would be applied.`);
                    console.log(`${colors_1.colors.muted('Remove')} ${colors_1.colors.cyan('--dry-run')} ${colors_1.colors.muted('to apply.')}`);
                }
                else {
                    console.log(`Applied ${colors_1.colors.green(String(applied))} migration(s) in ${(0, format_1.formatDuration)(duration)}`);
                }
                console.log('');
            }
            finally {
                await dbClient.close();
            }
        }
        catch (error) {
            spin.error('Migration failed');
            (0, ui_1.fatal)((0, ui_1.formatError)(error));
        }
    },
});
