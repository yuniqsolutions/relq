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
exports.runPush = runPush;
const citty_1 = require("citty");
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const p = __importStar(require("@clack/prompts"));
const context_1 = require("../utils/context.cjs");
const colors_1 = require("../utils/colors.cjs");
const ui_1 = require("../utils/ui.cjs");
const format_1 = require("../utils/format.cjs");
const config_loader_1 = require("../utils/config-loader.cjs");
const dialect_introspect_1 = require("../utils/dialect-introspect.cjs");
const database_client_1 = require("../utils/database-client.cjs");
const env_loader_1 = require("../utils/env-loader.cjs");
const dialect_router_1 = require("../utils/dialect-router.cjs");
const dialect_validator_1 = require("../utils/dialect-validator.cjs");
const schema_validator_1 = require("../utils/schema-validator.cjs");
const relqignore_1 = require("../utils/relqignore.cjs");
const repo_manager_1 = require("../utils/repo-manager.cjs");
const snapshot_manager_1 = require("../utils/snapshot-manager.cjs");
const schema_loader_1 = require("../utils/schema-loader.cjs");
const schema_diff_1 = require("../utils/schema-diff.cjs");
const schema_hash_1 = require("../utils/schema-hash.cjs");
const migration_generator_1 = require("../utils/migration-generator.cjs");
const migration_helpers_1 = require("../utils/migration-helpers.cjs");
const ast_transformer_1 = require("../utils/ast-transformer.cjs");
const ast_codegen_1 = require("../utils/ast-codegen.cjs");
const schema_to_ast_1 = require("../utils/schema-to-ast.cjs");
function formatColumnProps(col) {
    if (!col)
        return '';
    const parts = [];
    const rawType = col.dataType ?? col.type ?? '';
    const length = col.maxLength;
    const typeStr = length ? `${rawType}(${length})` : rawType;
    if (typeStr)
        parts.push(colors_1.colors.cyan(typeStr));
    if (col.isPrimaryKey)
        parts.push(colors_1.colors.yellow('PRIMARY KEY'));
    if (col.isUnique && !col.isPrimaryKey)
        parts.push(colors_1.colors.yellow('UNIQUE'));
    if (col.isNullable === false && !col.isPrimaryKey)
        parts.push(colors_1.colors.muted('NOT NULL'));
    if (col.defaultValue) {
        const val = String(col.defaultValue);
        const display = val.length > 20 ? val.substring(0, 17) + '...' : val;
        parts.push(colors_1.colors.muted(`DEFAULT ${display}`));
    }
    return parts.join(' ');
}
function mergeTrackingIds(introspected, desired) {
    const desiredTableMap = new Map(desired.tables.map(t => [t.name, t]));
    for (const table of introspected.tables) {
        const desiredTable = desiredTableMap.get(table.name);
        if (!desiredTable)
            continue;
        if (desiredTable.trackingId) {
            table.trackingId = desiredTable.trackingId;
        }
        const desiredColMap = new Map(desiredTable.columns.map(c => [c.name, c]));
        for (const col of table.columns) {
            const desiredCol = desiredColMap.get(col.name);
            if (desiredCol?.trackingId) {
                col.trackingId = desiredCol.trackingId;
            }
        }
        const desiredIdxMap = new Map((desiredTable.indexes || []).map(i => [i.name, i]));
        for (const idx of table.indexes || []) {
            const desiredIdx = desiredIdxMap.get(idx.name);
            if (desiredIdx?.trackingId) {
                idx.trackingId = desiredIdx.trackingId;
            }
        }
        const desiredConMap = new Map((desiredTable.constraints || []).map(c => [c.name, c]));
        for (const con of table.constraints || []) {
            const desiredCon = desiredConMap.get(con.name);
            if (desiredCon?.trackingId) {
                con.trackingId = desiredCon.trackingId;
            }
        }
    }
    return introspected;
}
async function runPush(config, projectRoot, opts = {}) {
    const { force = false, dryRun = false, skipPrompt = false } = opts;
    const connection = config.connection;
    const includeFunctions = config.includeFunctions ?? false;
    const includeTriggers = config.includeTriggers ?? false;
    const spin = p.spinner();
    const startTime = Date.now();
    console.log('');
    if (!(0, repo_manager_1.isInitialized)(projectRoot)) {
        (0, ui_1.fatal)('not a relq repository', `Run ${colors_1.colors.cyan('relq init')} to initialize.`);
    }
    const ignorePatterns = (0, relqignore_1.loadRelqignore)(projectRoot);
    try {
        const schemaPathRaw = (0, config_loader_1.getSchemaPath)(config);
        const schemaPath = path.resolve(projectRoot, schemaPathRaw);
        spin.start('Loading schema file...');
        const validation = (0, schema_validator_1.validateSchemaFile)(schemaPath);
        if (!validation.valid) {
            spin.stop(`Schema validation failed`);
            console.log('');
            console.log((0, schema_validator_1.formatValidationErrors)(validation));
            (0, ui_1.fatal)('Fix schema errors before pushing');
        }
        const { schema: desiredSchema } = await (0, schema_loader_1.loadSchemaFile)(schemaPathRaw, projectRoot);
        spin.stop(`Schema: ${colors_1.colors.cyan(String(desiredSchema.tables.length))} table(s) loaded`);
        const snapshotPath = config.sync?.snapshot || '.relq/snapshot.json';
        spin.start('Connecting to database...');
        const testClient = await (0, database_client_1.createDatabaseClient)(config);
        try {
            await testClient.query('SELECT 1');
        }
        finally {
            await testClient.close();
        }
        spin.stop(`Connected to ${colors_1.colors.cyan((0, env_loader_1.getConnectionDescription)(connection))}`);
        spin.start('Introspecting database...');
        const dbSchema = await (0, dialect_introspect_1.dialectIntrospect)(config, {
            includeFunctions,
            includeTriggers,
        });
        spin.stop(`Database: ${colors_1.colors.cyan(String(dbSchema.tables.length))} table(s) found`);
        spin.start('Computing diff...');
        const diff = (0, schema_diff_1.diffSchemas)((0, schema_hash_1.normalizeSchema)(dbSchema), (0, schema_hash_1.normalizeSchema)(desiredSchema));
        const filteredDiff = (0, schema_diff_1.filterDiff)(diff, ignorePatterns.map(pat => pat.raw));
        spin.stop('Diff computed');
        if (!filteredDiff.hasChanges) {
            console.log('');
            console.log('Everything up-to-date');
            console.log('');
            return;
        }
        console.log('');
        console.log(`${colors_1.colors.bold('Changes to push:')}`);
        for (const table of filteredDiff.tables) {
            if (table.type === 'added') {
                console.log(`  ${colors_1.colors.green('+')} ${colors_1.colors.bold(table.name)} ${colors_1.colors.muted('(new table)')}`);
                for (const col of table.columns || []) {
                    console.log(`      ${colors_1.colors.green('+')} ${col.name} ${formatColumnProps(col.after)}`);
                }
            }
            else if (table.type === 'removed') {
                console.log(`  ${colors_1.colors.red('-')} ${colors_1.colors.bold(table.name)} ${colors_1.colors.muted('(drop table)')}`);
            }
            else if (table.type === 'modified') {
                console.log(`  ${colors_1.colors.yellow('~')} ${colors_1.colors.bold(table.name)}`);
                for (const col of table.columns || []) {
                    if (col.type === 'added') {
                        console.log(`      ${colors_1.colors.green('+')} ${col.name} ${formatColumnProps(col.after)}`);
                    }
                    else if (col.type === 'removed') {
                        console.log(`      ${colors_1.colors.red('-')} ${col.name}`);
                    }
                    else if (col.type === 'modified') {
                        const details = (col.changes || []).map(c => `${c.field}: ${c.from} → ${c.to}`).join(', ');
                        console.log(`      ${colors_1.colors.yellow('~')} ${col.name} ${details ? colors_1.colors.muted(`(${details})`) : ''}`);
                    }
                }
                for (const idx of table.indexes || []) {
                    const prefix = idx.type === 'added' ? colors_1.colors.green('+') : idx.type === 'removed' ? colors_1.colors.red('-') : colors_1.colors.yellow('~');
                    console.log(`      ${prefix} index ${idx.name}`);
                }
                for (const con of table.constraints || []) {
                    const prefix = con.type === 'added' ? colors_1.colors.green('+') : con.type === 'removed' ? colors_1.colors.red('-') : colors_1.colors.yellow('~');
                    console.log(`      ${prefix} constraint ${con.name}`);
                }
            }
        }
        console.log('');
        if ((0, schema_diff_1.hasDestructiveChanges)(filteredDiff)) {
            const tables = (0, schema_diff_1.getDestructiveTables)(filteredDiff);
            (0, ui_1.warning)('Destructive changes detected:');
            for (const t of tables) {
                console.log(`   ${colors_1.colors.red('-')} ${t}`);
            }
            console.log('');
            if (!force && !skipPrompt) {
                const proceed = await p.confirm({
                    message: 'Include destructive changes?',
                    initialValue: false,
                });
                if (p.isCancel(proceed) || !proceed) {
                    (0, ui_1.fatal)('Operation cancelled by user');
                }
            }
        }
        spin.start('Generating SQL...');
        const migrationName = (0, migration_generator_1.generateMigrationName)(filteredDiff);
        const migration = (0, migration_generator_1.generateMigrationFile)(filteredDiff, migrationName, {
            includeDown: true,
            includeComments: false,
        });
        const upStatements = migration.upSQL;
        spin.stop(`Generated ${upStatements.length} statement(s)`);
        const dialect = (0, dialect_router_1.detectDialect)(config);
        if (dialect !== 'postgres' && upStatements.length > 0) {
            const upSQL = upStatements.join('\n');
            const dialectResult = (0, dialect_validator_1.validateForDialect)(upSQL, dialect, { location: 'push' });
            if (!dialectResult.valid) {
                console.log('');
                console.log((0, dialect_validator_1.formatDialectErrors)(dialectResult));
                (0, ui_1.fatal)(`SQL contains dialect incompatibilities`);
            }
        }
        if (dryRun) {
            console.log(`${colors_1.colors.yellow('Dry run')} - SQL that would be executed:`);
            console.log('');
            for (const stmt of upStatements.slice(0, 15)) {
                console.log(`   ${stmt.substring(0, 120)}${stmt.length > 120 ? '...' : ''}`);
            }
            if (upStatements.length > 15) {
                console.log(`   ${colors_1.colors.muted(`... and ${upStatements.length - 15} more statements`)}`);
            }
            if (migration.downSQL.length > 0) {
                console.log('');
                console.log(`${colors_1.colors.muted(`Rollback: ${migration.downSQL.length} revert statement(s) will be saved`)}`);
            }
            console.log('');
            console.log(`${colors_1.colors.muted('Remove')} ${colors_1.colors.cyan('--dry-run')} ${colors_1.colors.muted('to execute.')}`);
            console.log('');
            return;
        }
        if (!skipPrompt && !force) {
            const proceed = await p.confirm({
                message: 'Push these changes to database?',
                initialValue: true,
            });
            if (p.isCancel(proceed) || !proceed) {
                (0, ui_1.fatal)('Operation cancelled by user');
            }
            console.log('');
        }
        spin.start('Applying schema changes...');
        const execClient = await (0, database_client_1.createDatabaseClient)(config);
        let tx = null;
        try {
            try {
                tx = await execClient.beginTransaction();
            }
            catch (txError) {
                if (!txError.message?.includes('not supported'))
                    throw txError;
            }
            const executeQuery = tx
                ? (sql) => tx.query(sql)
                : (sql) => execClient.query(sql);
            let statementsRun = 0;
            for (const stmt of upStatements) {
                try {
                    await executeQuery(stmt);
                    statementsRun++;
                }
                catch (stmtError) {
                    const err = new Error(stmtError.message);
                    err.failedStatement = stmt;
                    err.statementIndex = statementsRun + 1;
                    throw err;
                }
            }
            if (tx)
                await tx.commit();
            spin.stop(`Applied ${statementsRun} statement(s)`);
            try {
                const tableName = config.migrations?.tableName || '_relq_migrations';
                const tableDDL = await (0, migration_helpers_1.getMigrationTableDDL)(config, tableName);
                await execClient.query(tableDDL);
                for (const col of ['sql_up TEXT', 'sql_down TEXT', "source TEXT DEFAULT 'push'"]) {
                    try {
                        await execClient.query(`ALTER TABLE "${tableName}" ADD COLUMN ${col}`);
                    }
                    catch { }
                }
                const upSQL = upStatements.join(';\n');
                const downSQL = migration.downSQL.join(';\n');
                const hash = (0, migration_generator_1.generateTimestampedName)(migrationName);
                await execClient.query(`INSERT INTO "${tableName}" (name, filename, hash, batch, sql_up, sql_down, source) ` +
                    `VALUES ($1, $2, $3, 0, $4, $5, 'push')`, [migrationName, '', hash, upSQL, downSQL]);
                spin.stop(`Applied ${statementsRun} statement(s) — rollback saved`);
            }
            catch (recordError) {
                (0, ui_1.warning)(`Schema applied but failed to save rollback point: ${recordError?.message || String(recordError)}`);
            }
        }
        catch (error) {
            if (tx) {
                try {
                    await tx.rollback();
                }
                catch { }
            }
            let errorMsg = `${colors_1.colors.red('SQL Error:')} ${error?.message || String(error)}\n`;
            if (error.failedStatement) {
                errorMsg += `\n${colors_1.colors.yellow('Failed Statement:')}\n`;
                errorMsg += `  ${error.failedStatement.substring(0, 200)}\n`;
            }
            if (error.statementIndex) {
                errorMsg += `${colors_1.colors.yellow('Statement #:')} ${error.statementIndex}\n`;
            }
            errorMsg += `\n${colors_1.colors.muted('All changes rolled back.')}\n`;
            spin.error('SQL execution failed');
            throw new Error(errorMsg);
        }
        finally {
            await execClient.close();
        }
        spin.start('Updating snapshot...');
        const updatedSchema = await (0, dialect_introspect_1.dialectIntrospect)(config, {
            includeFunctions,
            includeTriggers,
        });
        mergeTrackingIds(updatedSchema, desiredSchema);
        (0, snapshot_manager_1.saveSnapshot)(updatedSchema, snapshotPath, connection.database);
        spin.stop('Snapshot updated');
        spin.start('Syncing schema from database...');
        try {
            const liveSchema = await (0, dialect_introspect_1.dialectIntrospect)(config, {
                includeFunctions,
                includeTriggers,
            });
            const parsedSchema = await (0, ast_transformer_1.introspectedToParsedSchema)(liveSchema);
            try {
                const { createJiti } = await Promise.resolve().then(() => __importStar(require('jiti')));
                const jiti = createJiti(projectRoot, { interopDefault: true });
                const existingModule = await jiti.import(schemaPath);
                const existingAst = (0, schema_to_ast_1.schemaToAST)(existingModule);
                (0, ast_codegen_1.mergeTrackingIdsFromParsed)(parsedSchema, existingAst);
            }
            catch { }
            (0, ast_codegen_1.assignTrackingIds)(parsedSchema);
            const builderImportPath = `relq/${(0, dialect_router_1.detectDialect)(config)}-builder`;
            const typescript = (0, ast_codegen_1.generateTypeScriptFromAST)(parsedSchema, {
                camelCase: config.generate?.camelCase ?? true,
                importPath: builderImportPath,
                includeFunctions: false,
                includeTriggers: false,
                includeEnums: parsedSchema.enums.length > 0,
                includeDomains: parsedSchema.domains.length > 0,
            });
            fs.writeFileSync(schemaPath, typescript, 'utf-8');
            spin.stop('Schema synced');
        }
        catch (syncErr) {
            spin.stop('');
            (0, ui_1.warning)(`Could not sync schema: ${syncErr instanceof Error ? syncErr.message : String(syncErr)}`);
        }
        const duration = Date.now() - startTime;
        console.log('');
        console.log(`Push completed in ${(0, format_1.formatDuration)(duration)}`);
        const s = filteredDiff.summary;
        console.log(`   ${colors_1.colors.green(`${s.tablesAdded + s.columnsAdded} added`)}, ${colors_1.colors.yellow(`${s.tablesModified + s.columnsModified} modified`)}, ${colors_1.colors.red(`${s.tablesRemoved + s.columnsRemoved} removed`)}`);
        console.log('');
    }
    catch (err) {
        spin.error('Push failed');
        (0, ui_1.fatal)((0, ui_1.formatError)(err));
    }
}
exports.default = (0, citty_1.defineCommand)({
    meta: { name: 'push', description: 'Push schema changes to database' },
    args: {
        force: { type: 'boolean', description: 'Force push without confirmation' },
        'dry-run': { type: 'boolean', description: 'Show SQL without executing' },
        yes: { type: 'boolean', alias: 'y', description: 'Skip confirmation' },
    },
    async run({ args }) {
        const { config, projectRoot } = await (0, context_1.buildContext)();
        await (0, config_loader_1.requireValidConfig)(config, { calledFrom: 'push' });
        await runPush(config, projectRoot, {
            force: args.force === true,
            dryRun: args['dry-run'] === true,
            skipPrompt: args.yes === true,
        });
    },
});
