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
const types_manager_1 = require("../utils/types-manager.cjs");
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
    const desiredFuncMap = new Map((desired.functions || []).map(f => [f.name, f]));
    for (const func of introspected.functions || []) {
        const desiredFunc = desiredFuncMap.get(func.name);
        if (desiredFunc?.trackingId) {
            func.trackingId = desiredFunc.trackingId;
        }
    }
    const desiredTrigMap = new Map((desired.triggers || []).map(t => [t.name, t]));
    for (const trig of introspected.triggers || []) {
        const desiredTrig = desiredTrigMap.get(trig.name);
        if (desiredTrig?.trackingId) {
            trig.trackingId = desiredTrig.trackingId;
        }
    }
    return introspected;
}
async function runPush(config, projectRoot, opts = {}) {
    const { force = false, dryRun = false, full = false, skipPrompt = false } = opts;
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
        const { schema: desiredSchema, ast: desiredAST } = await (0, schema_loader_1.loadSchemaFile)(schemaPathRaw, projectRoot);
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
        let filteredDiff = (0, schema_diff_1.filterDiff)(diff, ignorePatterns.map(pat => pat.raw));
        const dbParsedSchema = await (0, ast_transformer_1.introspectedToParsedSchema)(dbSchema);
        const snapshot = (0, snapshot_manager_1.loadSnapshot)(snapshotPath);
        if (snapshot) {
            const snapTables = Object.values(snapshot.tables || {});
            for (const dbTable of dbParsedSchema.tables) {
                const snapTable = snapTables.find(s => s.name === dbTable.name);
                if (!snapTable)
                    continue;
                if (snapTable.trackingId)
                    dbTable.trackingId = snapTable.trackingId;
                const snapCols = Object.values(snapTable.columns || {});
                for (const dbCol of dbTable.columns) {
                    const snapCol = snapCols.find(s => s.name === dbCol.name);
                    if (snapCol?.trackingId)
                        dbCol.trackingId = snapCol.trackingId;
                }
                const snapIdxs = Object.values(snapTable.indexes || {});
                for (const dbIdx of dbTable.indexes) {
                    const snapIdx = snapIdxs.find(s => s.name === dbIdx.name);
                    if (snapIdx?.trackingId)
                        dbIdx.trackingId = snapIdx.trackingId;
                }
                const snapCons = Object.values(snapTable.constraints || {});
                for (const dbCon of dbTable.constraints) {
                    const snapCon = snapCons.find(s => s.name === dbCon.name);
                    if (snapCon?.trackingId)
                        dbCon.trackingId = snapCon.trackingId;
                }
            }
        }
        const desiredASTCopy = { ...desiredAST };
        if (!includeFunctions || desiredASTCopy.functions.length === 0) {
            dbParsedSchema.functions = [];
            desiredASTCopy.functions = [];
        }
        if (!includeTriggers || desiredASTCopy.triggers.length === 0) {
            dbParsedSchema.triggers = [];
            desiredASTCopy.triggers = [];
        }
        if (desiredASTCopy.sequences.length === 0) {
            dbParsedSchema.sequences = [];
        }
        const comparison = (0, schema_diff_1.compareSchemas)(dbParsedSchema, desiredASTCopy);
        spin.stop('Diff computed');
        if (!comparison.hasChanges && !filteredDiff.hasChanges) {
            console.log('');
            console.log('Everything up-to-date');
            console.log('');
            return;
        }
        console.log('');
        console.log(`${colors_1.colors.bold('Changes to push:')}`);
        const renamedFromNames = new Set(comparison.renamed.tables.map(r => r.from));
        const renamedToNames = new Set(comparison.renamed.tables.map(r => r.to));
        for (const rename of comparison.renamed.tables) {
            console.log(`  ${colors_1.colors.cyan('→')} ${colors_1.colors.bold(rename.from)} → ${colors_1.colors.bold(rename.to)} ${colors_1.colors.muted('(rename)')}`);
            const colMods = comparison.modified.columns.filter(c => c.table === rename.to);
            for (const mod of colMods) {
                const details = mod.changes.map(c => `${c.field}: ${c.from} → ${c.to}`).join(', ');
                console.log(`      ${colors_1.colors.yellow('~')} ${mod.column} ${details ? colors_1.colors.muted(`(${details})`) : ''}`);
            }
            const colAdds = comparison.added.columns.filter(c => c.table === rename.to);
            for (const add of colAdds) {
                console.log(`      ${colors_1.colors.green('+')} ${add.column.name}`);
            }
            const colRemoves = comparison.removed.columns.filter(c => c.table === rename.to);
            for (const rem of colRemoves) {
                console.log(`      ${colors_1.colors.red('-')} ${rem.column.name}`);
            }
            const colRenames = comparison.renamed.columns.filter(c => c.table === rename.to);
            for (const ren of colRenames) {
                console.log(`      ${colors_1.colors.cyan('→')} ${ren.from} → ${ren.to} ${colors_1.colors.muted('(rename column)')}`);
            }
        }
        for (const rename of comparison.renamed.columns) {
            if (renamedToNames.has(rename.table))
                continue;
            console.log(`  ${colors_1.colors.cyan('→')} ${colors_1.colors.bold(rename.table)}.${rename.from} → ${rename.to} ${colors_1.colors.muted('(rename column)')}`);
        }
        for (const rename of comparison.renamed.indexes) {
            console.log(`  ${colors_1.colors.cyan('→')} index ${rename.from} → ${rename.to} ${colors_1.colors.muted('(rename index)')}`);
        }
        const modifiedIndexesByTable = new Map();
        for (const idx of comparison.modified.indexes) {
            const list = modifiedIndexesByTable.get(idx.table) || [];
            list.push(idx);
            modifiedIndexesByTable.set(idx.table, list);
        }
        const shownModifiedIndexTables = new Set();
        for (const table of filteredDiff.tables) {
            if (renamedFromNames.has(table.name) || renamedToNames.has(table.name))
                continue;
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
                const tableModifiedIndexes = modifiedIndexesByTable.get(table.name);
                if (tableModifiedIndexes) {
                    for (const midx of tableModifiedIndexes) {
                        console.log(`      ${colors_1.colors.yellow('~')} index ${midx.newIndex.name} ${colors_1.colors.muted(`(${midx.changes.join(', ')})`)}`);
                    }
                    shownModifiedIndexTables.add(table.name);
                }
                for (const con of table.constraints || []) {
                    const prefix = con.type === 'added' ? colors_1.colors.green('+') : con.type === 'removed' ? colors_1.colors.red('-') : colors_1.colors.yellow('~');
                    console.log(`      ${prefix} constraint ${con.name}`);
                }
            }
        }
        for (const [tableName, indexes] of modifiedIndexesByTable) {
            if (shownModifiedIndexTables.has(tableName))
                continue;
            if (renamedFromNames.has(tableName) || renamedToNames.has(tableName))
                continue;
            console.log(`  ${colors_1.colors.yellow('~')} ${colors_1.colors.bold(tableName)}`);
            for (const midx of indexes) {
                console.log(`      ${colors_1.colors.yellow('~')} index ${midx.newIndex.name} ${colors_1.colors.muted(`(${midx.changes.join(', ')})`)}`);
            }
        }
        for (const e of comparison.added.enums) {
            console.log(`  ${colors_1.colors.green('+')} ${colors_1.colors.bold(e.name)} ${colors_1.colors.muted('(new enum)')}`);
        }
        for (const e of comparison.removed.enums) {
            console.log(`  ${colors_1.colors.red('-')} ${colors_1.colors.bold(e.name)} ${colors_1.colors.muted('(drop enum)')}`);
        }
        for (const e of comparison.modified.enums) {
            const added = e.changes.added.length > 0 ? `+${e.changes.added.join(',')}` : '';
            const removed = e.changes.removed.length > 0 ? `-${e.changes.removed.join(',')}` : '';
            console.log(`  ${colors_1.colors.yellow('~')} ${colors_1.colors.bold(e.name)} ${colors_1.colors.muted(`(enum: ${[added, removed].filter(Boolean).join(' ')})`)}`);
        }
        for (const d of comparison.added.domains) {
            console.log(`  ${colors_1.colors.green('+')} ${colors_1.colors.bold(d.name)} ${colors_1.colors.muted('(new domain)')}`);
        }
        for (const d of comparison.removed.domains) {
            console.log(`  ${colors_1.colors.red('-')} ${colors_1.colors.bold(d.name)} ${colors_1.colors.muted('(drop domain)')}`);
        }
        for (const s of comparison.added.sequences) {
            console.log(`  ${colors_1.colors.green('+')} ${colors_1.colors.bold(s.name)} ${colors_1.colors.muted('(new sequence)')}`);
        }
        for (const s of comparison.removed.sequences) {
            console.log(`  ${colors_1.colors.red('-')} ${colors_1.colors.bold(s.name)} ${colors_1.colors.muted('(drop sequence)')}`);
        }
        for (const ct of comparison.added.compositeTypes) {
            console.log(`  ${colors_1.colors.green('+')} ${colors_1.colors.bold(ct.name)} ${colors_1.colors.muted('(new type)')}`);
        }
        for (const ct of comparison.removed.compositeTypes) {
            console.log(`  ${colors_1.colors.red('-')} ${colors_1.colors.bold(ct.name)} ${colors_1.colors.muted('(drop type)')}`);
        }
        for (const v of comparison.added.views) {
            console.log(`  ${colors_1.colors.green('+')} ${colors_1.colors.bold(v.name)} ${colors_1.colors.muted('(new view)')}`);
        }
        for (const v of comparison.removed.views) {
            console.log(`  ${colors_1.colors.red('-')} ${colors_1.colors.bold(v.name)} ${colors_1.colors.muted('(drop view)')}`);
        }
        for (const f of comparison.added.functions) {
            console.log(`  ${colors_1.colors.green('+')} ${colors_1.colors.bold(f.name)} ${colors_1.colors.muted('(new function)')}`);
        }
        for (const f of comparison.removed.functions) {
            console.log(`  ${colors_1.colors.red('-')} ${colors_1.colors.bold(f.name)} ${colors_1.colors.muted('(drop function)')}`);
        }
        for (const t of comparison.added.triggers) {
            console.log(`  ${colors_1.colors.green('+')} ${colors_1.colors.bold(t.name)} ${colors_1.colors.muted('(new trigger)')}`);
        }
        for (const t of comparison.removed.triggers) {
            console.log(`  ${colors_1.colors.red('-')} ${colors_1.colors.bold(t.name)} ${colors_1.colors.muted('(drop trigger)')}`);
        }
        for (const ext of comparison.added.extensions) {
            console.log(`  ${colors_1.colors.green('+')} ${colors_1.colors.bold(ext)} ${colors_1.colors.muted('(new extension)')}`);
        }
        for (const ext of comparison.removed.extensions) {
            console.log(`  ${colors_1.colors.red('-')} ${colors_1.colors.bold(ext)} ${colors_1.colors.muted('(drop extension)')}`);
        }
        console.log('');
        const hasNonTableDestructive = comparison.removed.enums.length > 0
            || comparison.removed.domains.length > 0
            || comparison.removed.sequences.length > 0
            || comparison.removed.compositeTypes.length > 0
            || comparison.removed.views.length > 0
            || comparison.removed.functions.length > 0
            || comparison.removed.triggers.length > 0;
        if ((0, schema_diff_1.hasDestructiveChanges)(filteredDiff) || hasNonTableDestructive) {
            const destructiveItems = [];
            for (const t of (0, schema_diff_1.getDestructiveTables)(filteredDiff)) {
                if (renamedFromNames.has(t) || renamedToNames.has(t))
                    continue;
                destructiveItems.push(t);
            }
            for (const e of comparison.removed.enums)
                destructiveItems.push(`enum ${e.name}`);
            for (const d of comparison.removed.domains)
                destructiveItems.push(`domain ${d.name}`);
            for (const s of comparison.removed.sequences)
                destructiveItems.push(`sequence ${s.name}`);
            for (const ct of comparison.removed.compositeTypes)
                destructiveItems.push(`type ${ct.name}`);
            for (const v of comparison.removed.views)
                destructiveItems.push(`view ${v.name}`);
            for (const f of comparison.removed.functions)
                destructiveItems.push(`function ${f.name}`);
            for (const tr of comparison.removed.triggers)
                destructiveItems.push(`trigger ${tr.name}`);
            if (destructiveItems.length > 0) {
                (0, ui_1.warning)('Destructive changes detected:');
                for (const item of destructiveItems) {
                    console.log(`   ${colors_1.colors.red('-')} ${item}`);
                }
                console.log('');
                if (!force && !skipPrompt) {
                    const proceed = await p.confirm({
                        message: 'Include destructive changes?',
                        initialValue: false,
                    });
                    if (p.isCancel(proceed)) {
                        (0, ui_1.fatal)('Operation cancelled by user');
                    }
                    if (!proceed) {
                        filteredDiff = (0, schema_diff_1.stripDestructiveChanges)(filteredDiff);
                        comparison.removed.enums = [];
                        comparison.removed.domains = [];
                        comparison.removed.sequences = [];
                        comparison.removed.compositeTypes = [];
                        comparison.removed.views = [];
                        comparison.removed.functions = [];
                        comparison.removed.triggers = [];
                        if (!filteredDiff.hasChanges && !comparison.hasChanges) {
                            p.log.info('No non-destructive changes to push.');
                            process.exit(0);
                        }
                        p.log.info('Destructive changes excluded. Continuing with safe changes only.');
                    }
                }
            }
        }
        spin.start('Generating SQL...');
        const fullMigration = (0, migration_generator_1.generateMigrationFromComparison)(comparison, { includeDown: true });
        const migrationName = (0, migration_generator_1.generateMigrationNameFromComparison)(comparison);
        const upStatements = fullMigration.up.filter(s => s.trim());
        const downStatements = fullMigration.down.filter(s => s.trim());
        const sqlStatementCount = upStatements.length;
        spin.stop(`Generated ${sqlStatementCount} statement(s)`);
        const summaryDiff = renamedFromNames.size > 0 || renamedToNames.size > 0
            ? { ...filteredDiff, tables: filteredDiff.tables.filter(t => !renamedFromNames.has(t.name) && !renamedToNames.has(t.name)) }
            : filteredDiff;
        const summaryLines = (0, schema_diff_1.formatCategorizedSummary)(summaryDiff);
        const tableRenames = comparison.renamed.tables.length;
        const colRenames = comparison.renamed.columns.length;
        const idxRenames = comparison.renamed.indexes.length;
        const renameParts = [];
        if (tableRenames > 0)
            renameParts.push(`   ${colors_1.colors.muted('tables:')} ${colors_1.colors.cyan(`${tableRenames} renamed`)}`);
        if (colRenames > 0)
            renameParts.push(`   ${colors_1.colors.muted('columns:')} ${colors_1.colors.cyan(`${colRenames} renamed`)}`);
        if (idxRenames > 0)
            renameParts.push(`   ${colors_1.colors.muted('indexes:')} ${colors_1.colors.cyan(`${idxRenames} renamed`)}`);
        const renColAdded = comparison.added.columns.filter(c => renamedToNames.has(c.table)).length;
        const renColModified = comparison.modified.columns.filter(c => renamedToNames.has(c.table)).length;
        const renColRemoved = comparison.removed.columns.filter(c => renamedToNames.has(c.table)).length;
        const renamedTableColTotal = renColAdded + renColModified + renColRemoved;
        if (renamedTableColTotal > 0) {
            let regColsAdded = 0, regColsRemoved = 0, regColsModified = 0;
            for (const t of summaryDiff.tables) {
                for (const col of t.columns || []) {
                    if (col.type === 'added')
                        regColsAdded++;
                    else if (col.type === 'removed')
                        regColsRemoved++;
                    else if (col.type === 'modified')
                        regColsModified++;
                }
            }
            const totalColsAdded = regColsAdded + renColAdded;
            const totalColsModified = regColsModified + renColModified;
            const totalColsRemoved = regColsRemoved + renColRemoved;
            const colParts = [];
            if (totalColsAdded)
                colParts.push(colors_1.colors.green(`${totalColsAdded} added`));
            if (totalColsModified)
                colParts.push(colors_1.colors.yellow(`${totalColsModified} modified`));
            if (totalColsRemoved)
                colParts.push(colors_1.colors.red(`${totalColsRemoved} removed`));
            if (colParts.length > 0) {
                const colLine = `   ${colors_1.colors.muted('columns:')} ${colParts.join(', ')} ${colors_1.colors.muted(`(${renamedTableColTotal} in renamed tables)`)}`;
                const colLineIdx = summaryLines.findIndex(l => l.includes('columns:'));
                if (colLineIdx >= 0) {
                    summaryLines[colLineIdx] = colLine;
                }
                else {
                    summaryLines.push(colLine);
                }
            }
        }
        const modifiedIdxCount = comparison.modified.indexes.length;
        if (modifiedIdxCount > 0) {
            let regIdxAdded = 0, regIdxRemoved = 0;
            for (const t of summaryDiff.tables) {
                for (const idx of t.indexes || []) {
                    if (idx.type === 'added')
                        regIdxAdded++;
                    else if (idx.type === 'removed')
                        regIdxRemoved++;
                }
            }
            const idxParts = [];
            if (regIdxAdded)
                idxParts.push(colors_1.colors.green(`${regIdxAdded} added`));
            if (modifiedIdxCount)
                idxParts.push(colors_1.colors.yellow(`${modifiedIdxCount} modified`));
            if (regIdxRemoved)
                idxParts.push(colors_1.colors.red(`${regIdxRemoved} removed`));
            if (idxParts.length > 0) {
                const idxLine = `   ${colors_1.colors.muted('indexes:')} ${idxParts.join(', ')}`;
                const idxLineIdx = summaryLines.findIndex(l => l.includes('indexes:'));
                if (idxLineIdx >= 0) {
                    summaryLines[idxLineIdx] = idxLine;
                }
                else {
                    summaryLines.push(idxLine);
                }
            }
        }
        const allSummaryLines = [...renameParts, ...summaryLines];
        if (allSummaryLines.length > 0) {
            for (const line of allSummaryLines)
                console.log(line);
            console.log('');
        }
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
            for (const stmt of upStatements) {
                console.log(stmt);
            }
            if (downStatements.length > 0) {
                console.log('');
                if (full) {
                    console.log(`${colors_1.colors.yellow('Rollback')} - SQL to revert:`);
                    console.log('');
                    for (const stmt of downStatements) {
                        console.log(stmt);
                    }
                }
                else {
                    console.log(`${colors_1.colors.muted(`Rollback: ${downStatements.length} revert statement(s) will be saved`)}`);
                    console.log(`${colors_1.colors.muted('Use')} ${colors_1.colors.cyan('--full')} ${colors_1.colors.muted('to include rollback SQL.')}`);
                }
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
        let statementsRun = 0;
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
                try {
                    await execClient.query(`ALTER TABLE "${tableName}" ALTER COLUMN hash TYPE VARCHAR(255)`);
                }
                catch { }
                const upSQL = upStatements.join(';\n');
                const downSQL = downStatements.join(';\n');
                const hash = (0, migration_generator_1.generateTimestampedName)(migrationName);
                await execClient.query(`INSERT INTO "${tableName}" (name, filename, hash, batch, sql_up, sql_down, source) ` +
                    `VALUES ($1, $2, $3, 0, $4, $5, 'push')`, [migrationName, '', hash, upSQL, downSQL]);
                spin.stop(`Applied ${statementsRun} statement(s) — restore point saved`);
            }
            catch (recordError) {
                spin.stop(`Applied ${statementsRun} statement(s)`);
                (0, ui_1.warning)(`Failed to save restore point: ${recordError?.message || String(recordError)}`);
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
            if (tx) {
                errorMsg += `\n${colors_1.colors.muted('All changes rolled back.')}\n`;
            }
            else {
                errorMsg += `\n${colors_1.colors.yellow('Warning:')} ${statementsRun} statement(s) were already applied (no transaction support).\n`;
            }
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
        const typesFilePath = (0, types_manager_1.getTypesFilePath)(schemaPath);
        try {
            await (0, types_manager_1.syncTypesToDb)(connection, typesFilePath, schemaPath);
        }
        catch {
        }
        const duration = Date.now() - startTime;
        console.log('');
        console.log(`Push completed in ${(0, format_1.formatDuration)(duration)}`);
        let sTablesAdded = 0, sTablesRemoved = 0, sTablesModified = 0;
        let sColsAdded = 0, sColsRemoved = 0, sColsModified = 0;
        let sIdxAdded = 0, sIdxRemoved = 0;
        for (const t of summaryDiff.tables) {
            if (t.type === 'added')
                sTablesAdded++;
            else if (t.type === 'removed')
                sTablesRemoved++;
            else if (t.type === 'modified')
                sTablesModified++;
            for (const col of t.columns || []) {
                if (col.type === 'added')
                    sColsAdded++;
                else if (col.type === 'removed')
                    sColsRemoved++;
                else if (col.type === 'modified')
                    sColsModified++;
            }
            for (const idx of t.indexes || []) {
                if (idx.type === 'added')
                    sIdxAdded++;
                else if (idx.type === 'removed')
                    sIdxRemoved++;
            }
        }
        const ddlAdded = comparison.added.enums.length + comparison.added.domains.length
            + comparison.added.sequences.length + comparison.added.compositeTypes.length
            + comparison.added.views.length + comparison.added.functions.length
            + comparison.added.triggers.length + comparison.added.extensions.length;
        const ddlRemoved = comparison.removed.enums.length + comparison.removed.domains.length
            + comparison.removed.sequences.length + comparison.removed.compositeTypes.length
            + comparison.removed.views.length + comparison.removed.functions.length
            + comparison.removed.triggers.length + comparison.removed.extensions.length;
        const sIdxModified = comparison.modified.indexes.length;
        const ddlModified = comparison.modified.enums.length;
        const totalRenamed = comparison.renamed.tables.length + comparison.renamed.columns.length
            + comparison.renamed.indexes.length + comparison.renamed.enums.length
            + comparison.renamed.sequences.length + comparison.renamed.functions.length;
        const totalAdded = sTablesAdded + sColsAdded + sIdxAdded + ddlAdded + renColAdded;
        const totalModified = sTablesModified + sColsModified + sIdxModified + ddlModified + renColModified;
        const totalRemoved = sTablesRemoved + sColsRemoved + sIdxRemoved + ddlRemoved + renColRemoved;
        const parts = [];
        if (totalAdded > 0 || totalModified > 0 || totalRemoved > 0 || totalRenamed > 0) {
            if (totalAdded > 0)
                parts.push(colors_1.colors.green(`${totalAdded} added`));
            if (totalRenamed > 0)
                parts.push(colors_1.colors.cyan(`${totalRenamed} renamed`));
            if (totalModified > 0)
                parts.push(colors_1.colors.yellow(`${totalModified} modified`));
            if (totalRemoved > 0)
                parts.push(colors_1.colors.red(`${totalRemoved} removed`));
        }
        else {
            parts.push('no changes');
        }
        console.log(`   ${parts.join(', ')}`);
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
        full: { type: 'boolean', description: 'Show all statements in dry run (including rollback)' },
        yes: { type: 'boolean', alias: 'y', description: 'Skip confirmation' },
    },
    async run({ args }) {
        const { config, projectRoot } = await (0, context_1.buildContext)();
        await (0, config_loader_1.requireValidConfig)(config, { calledFrom: 'push' });
        await runPush(config, projectRoot, {
            force: args.force === true,
            dryRun: args['dry-run'] === true,
            full: args.full === true,
            skipPrompt: args.yes === true,
        });
    },
});
