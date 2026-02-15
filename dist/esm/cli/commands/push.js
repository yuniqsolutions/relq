import { defineCommand } from 'citty';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as p from '@clack/prompts';
import { buildContext } from "../utils/context.js";
import { colors } from "../utils/colors.js";
import { fatal, warning, formatError } from "../utils/ui.js";
import { formatDuration } from "../utils/format.js";
import { requireValidConfig, getSchemaPath } from "../utils/config-loader.js";
import { dialectIntrospect } from "../utils/dialect-introspect.js";
import { createDatabaseClient } from "../utils/database-client.js";
import { getConnectionDescription } from "../utils/env-loader.js";
import { detectDialect } from "../utils/dialect-router.js";
import { validateForDialect, formatDialectErrors } from "../utils/dialect-validator.js";
import { validateSchemaFile, formatValidationErrors } from "../utils/schema-validator.js";
import { loadRelqignore } from "../utils/relqignore.js";
import { isInitialized } from "../utils/repo-manager.js";
import { saveSnapshot } from "../utils/snapshot-manager.js";
import { loadSchemaFile } from "../utils/schema-loader.js";
import { diffSchemas, filterDiff, hasDestructiveChanges, getDestructiveTables } from "../utils/schema-diff.js";
import { normalizeSchema } from "../utils/schema-hash.js";
import { generateMigrationFile, generateMigrationName, generateTimestampedName } from "../utils/migration-generator.js";
import { getMigrationTableDDL } from "../utils/migration-helpers.js";
import { introspectedToParsedSchema } from "../utils/ast-transformer.js";
import { generateTypeScriptFromAST, assignTrackingIds, mergeTrackingIdsFromParsed } from "../utils/ast-codegen.js";
import { schemaToAST } from "../utils/schema-to-ast.js";
function formatColumnProps(col) {
    if (!col)
        return '';
    const parts = [];
    const rawType = col.dataType ?? col.type ?? '';
    const length = col.maxLength;
    const typeStr = length ? `${rawType}(${length})` : rawType;
    if (typeStr)
        parts.push(colors.cyan(typeStr));
    if (col.isPrimaryKey)
        parts.push(colors.yellow('PRIMARY KEY'));
    if (col.isUnique && !col.isPrimaryKey)
        parts.push(colors.yellow('UNIQUE'));
    if (col.isNullable === false && !col.isPrimaryKey)
        parts.push(colors.muted('NOT NULL'));
    if (col.defaultValue) {
        const val = String(col.defaultValue);
        const display = val.length > 20 ? val.substring(0, 17) + '...' : val;
        parts.push(colors.muted(`DEFAULT ${display}`));
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
export async function runPush(config, projectRoot, opts = {}) {
    const { force = false, dryRun = false, skipPrompt = false } = opts;
    const connection = config.connection;
    const includeFunctions = config.includeFunctions ?? false;
    const includeTriggers = config.includeTriggers ?? false;
    const spin = p.spinner();
    const startTime = Date.now();
    console.log('');
    if (!isInitialized(projectRoot)) {
        fatal('not a relq repository', `Run ${colors.cyan('relq init')} to initialize.`);
    }
    const ignorePatterns = loadRelqignore(projectRoot);
    try {
        const schemaPathRaw = getSchemaPath(config);
        const schemaPath = path.resolve(projectRoot, schemaPathRaw);
        spin.start('Loading schema file...');
        const validation = validateSchemaFile(schemaPath);
        if (!validation.valid) {
            spin.stop(`Schema validation failed`);
            console.log('');
            console.log(formatValidationErrors(validation));
            fatal('Fix schema errors before pushing');
        }
        const { schema: desiredSchema } = await loadSchemaFile(schemaPathRaw, projectRoot);
        spin.stop(`Schema: ${colors.cyan(String(desiredSchema.tables.length))} table(s) loaded`);
        const snapshotPath = config.sync?.snapshot || '.relq/snapshot.json';
        spin.start('Connecting to database...');
        const testClient = await createDatabaseClient(config);
        try {
            await testClient.query('SELECT 1');
        }
        finally {
            await testClient.close();
        }
        spin.stop(`Connected to ${colors.cyan(getConnectionDescription(connection))}`);
        spin.start('Introspecting database...');
        const dbSchema = await dialectIntrospect(config, {
            includeFunctions,
            includeTriggers,
        });
        spin.stop(`Database: ${colors.cyan(String(dbSchema.tables.length))} table(s) found`);
        spin.start('Computing diff...');
        const diff = diffSchemas(normalizeSchema(dbSchema), normalizeSchema(desiredSchema));
        const filteredDiff = filterDiff(diff, ignorePatterns.map(pat => pat.raw));
        spin.stop('Diff computed');
        if (!filteredDiff.hasChanges) {
            console.log('');
            console.log('Everything up-to-date');
            console.log('');
            return;
        }
        console.log('');
        console.log(`${colors.bold('Changes to push:')}`);
        for (const table of filteredDiff.tables) {
            if (table.type === 'added') {
                console.log(`  ${colors.green('+')} ${colors.bold(table.name)} ${colors.muted('(new table)')}`);
                for (const col of table.columns || []) {
                    console.log(`      ${colors.green('+')} ${col.name} ${formatColumnProps(col.after)}`);
                }
            }
            else if (table.type === 'removed') {
                console.log(`  ${colors.red('-')} ${colors.bold(table.name)} ${colors.muted('(drop table)')}`);
            }
            else if (table.type === 'modified') {
                console.log(`  ${colors.yellow('~')} ${colors.bold(table.name)}`);
                for (const col of table.columns || []) {
                    if (col.type === 'added') {
                        console.log(`      ${colors.green('+')} ${col.name} ${formatColumnProps(col.after)}`);
                    }
                    else if (col.type === 'removed') {
                        console.log(`      ${colors.red('-')} ${col.name}`);
                    }
                    else if (col.type === 'modified') {
                        const details = (col.changes || []).map(c => `${c.field}: ${c.from} → ${c.to}`).join(', ');
                        console.log(`      ${colors.yellow('~')} ${col.name} ${details ? colors.muted(`(${details})`) : ''}`);
                    }
                }
                for (const idx of table.indexes || []) {
                    const prefix = idx.type === 'added' ? colors.green('+') : idx.type === 'removed' ? colors.red('-') : colors.yellow('~');
                    console.log(`      ${prefix} index ${idx.name}`);
                }
                for (const con of table.constraints || []) {
                    const prefix = con.type === 'added' ? colors.green('+') : con.type === 'removed' ? colors.red('-') : colors.yellow('~');
                    console.log(`      ${prefix} constraint ${con.name}`);
                }
            }
        }
        console.log('');
        if (hasDestructiveChanges(filteredDiff)) {
            const tables = getDestructiveTables(filteredDiff);
            warning('Destructive changes detected:');
            for (const t of tables) {
                console.log(`   ${colors.red('-')} ${t}`);
            }
            console.log('');
            if (!force && !skipPrompt) {
                const proceed = await p.confirm({
                    message: 'Include destructive changes?',
                    initialValue: false,
                });
                if (p.isCancel(proceed) || !proceed) {
                    fatal('Operation cancelled by user');
                }
            }
        }
        spin.start('Generating SQL...');
        const migrationName = generateMigrationName(filteredDiff);
        const migration = generateMigrationFile(filteredDiff, migrationName, {
            includeDown: true,
            includeComments: false,
        });
        const upStatements = migration.upSQL;
        spin.stop(`Generated ${upStatements.length} statement(s)`);
        const dialect = detectDialect(config);
        if (dialect !== 'postgres' && upStatements.length > 0) {
            const upSQL = upStatements.join('\n');
            const dialectResult = validateForDialect(upSQL, dialect, { location: 'push' });
            if (!dialectResult.valid) {
                console.log('');
                console.log(formatDialectErrors(dialectResult));
                fatal(`SQL contains dialect incompatibilities`);
            }
        }
        if (dryRun) {
            console.log(`${colors.yellow('Dry run')} - SQL that would be executed:`);
            console.log('');
            for (const stmt of upStatements.slice(0, 15)) {
                console.log(`   ${stmt.substring(0, 120)}${stmt.length > 120 ? '...' : ''}`);
            }
            if (upStatements.length > 15) {
                console.log(`   ${colors.muted(`... and ${upStatements.length - 15} more statements`)}`);
            }
            if (migration.downSQL.length > 0) {
                console.log('');
                console.log(`${colors.muted(`Rollback: ${migration.downSQL.length} revert statement(s) will be saved`)}`);
            }
            console.log('');
            console.log(`${colors.muted('Remove')} ${colors.cyan('--dry-run')} ${colors.muted('to execute.')}`);
            console.log('');
            return;
        }
        if (!skipPrompt && !force) {
            const proceed = await p.confirm({
                message: 'Push these changes to database?',
                initialValue: true,
            });
            if (p.isCancel(proceed) || !proceed) {
                fatal('Operation cancelled by user');
            }
            console.log('');
        }
        spin.start('Applying schema changes...');
        const execClient = await createDatabaseClient(config);
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
                const tableDDL = await getMigrationTableDDL(config, tableName);
                await execClient.query(tableDDL);
                for (const col of ['sql_up TEXT', 'sql_down TEXT', "source TEXT DEFAULT 'push'"]) {
                    try {
                        await execClient.query(`ALTER TABLE "${tableName}" ADD COLUMN ${col}`);
                    }
                    catch { }
                }
                const upSQL = upStatements.join(';\n');
                const downSQL = migration.downSQL.join(';\n');
                const hash = generateTimestampedName(migrationName);
                await execClient.query(`INSERT INTO "${tableName}" (name, filename, hash, batch, sql_up, sql_down, source) ` +
                    `VALUES ($1, $2, $3, 0, $4, $5, 'push')`, [migrationName, '', hash, upSQL, downSQL]);
                spin.stop(`Applied ${statementsRun} statement(s) — rollback saved`);
            }
            catch (recordError) {
                warning(`Schema applied but failed to save rollback point: ${recordError?.message || String(recordError)}`);
            }
        }
        catch (error) {
            if (tx) {
                try {
                    await tx.rollback();
                }
                catch { }
            }
            let errorMsg = `${colors.red('SQL Error:')} ${error?.message || String(error)}\n`;
            if (error.failedStatement) {
                errorMsg += `\n${colors.yellow('Failed Statement:')}\n`;
                errorMsg += `  ${error.failedStatement.substring(0, 200)}\n`;
            }
            if (error.statementIndex) {
                errorMsg += `${colors.yellow('Statement #:')} ${error.statementIndex}\n`;
            }
            errorMsg += `\n${colors.muted('All changes rolled back.')}\n`;
            spin.error('SQL execution failed');
            throw new Error(errorMsg);
        }
        finally {
            await execClient.close();
        }
        spin.start('Updating snapshot...');
        const updatedSchema = await dialectIntrospect(config, {
            includeFunctions,
            includeTriggers,
        });
        mergeTrackingIds(updatedSchema, desiredSchema);
        saveSnapshot(updatedSchema, snapshotPath, connection.database);
        spin.stop('Snapshot updated');
        spin.start('Syncing schema from database...');
        try {
            const liveSchema = await dialectIntrospect(config, {
                includeFunctions,
                includeTriggers,
            });
            const parsedSchema = await introspectedToParsedSchema(liveSchema);
            try {
                const { createJiti } = await import('jiti');
                const jiti = createJiti(projectRoot, { interopDefault: true });
                const existingModule = await jiti.import(schemaPath);
                const existingAst = schemaToAST(existingModule);
                mergeTrackingIdsFromParsed(parsedSchema, existingAst);
            }
            catch { }
            assignTrackingIds(parsedSchema);
            const builderImportPath = `relq/${detectDialect(config)}-builder`;
            const typescript = generateTypeScriptFromAST(parsedSchema, {
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
            warning(`Could not sync schema: ${syncErr instanceof Error ? syncErr.message : String(syncErr)}`);
        }
        const duration = Date.now() - startTime;
        console.log('');
        console.log(`Push completed in ${formatDuration(duration)}`);
        const s = filteredDiff.summary;
        console.log(`   ${colors.green(`${s.tablesAdded + s.columnsAdded} added`)}, ${colors.yellow(`${s.tablesModified + s.columnsModified} modified`)}, ${colors.red(`${s.tablesRemoved + s.columnsRemoved} removed`)}`);
        console.log('');
    }
    catch (err) {
        spin.error('Push failed');
        fatal(formatError(err));
    }
}
export default defineCommand({
    meta: { name: 'push', description: 'Push schema changes to database' },
    args: {
        force: { type: 'boolean', description: 'Force push without confirmation' },
        'dry-run': { type: 'boolean', description: 'Show SQL without executing' },
        yes: { type: 'boolean', alias: 'y', description: 'Skip confirmation' },
    },
    async run({ args }) {
        const { config, projectRoot } = await buildContext();
        await requireValidConfig(config, { calledFrom: 'push' });
        await runPush(config, projectRoot, {
            force: args.force === true,
            dryRun: args['dry-run'] === true,
            skipPrompt: args.yes === true,
        });
    },
});
