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
const fs = __importStar(require("node:fs"));
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
const migration_generator_1 = require("../utils/migration-generator.cjs");
const migration_helpers_1 = require("../utils/migration-helpers.cjs");
const ast_transformer_1 = require("../utils/ast-transformer.cjs");
const tracking_id_validator_1 = require("../utils/tracking-id-validator.cjs");
const source_id_validator_1 = require("../utils/source-id-validator.cjs");
const types_manager_1 = require("../utils/types-manager.cjs");
function formatColumnProps(col) {
    const parts = [];
    const rawType = col.isArray ? `${col.type}[]` : col.type;
    const length = col.typeParams?.length;
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
function formatConstraintProps(con) {
    const parts = [];
    parts.push(colors_1.colors.yellow(con.type));
    if (con.type === 'CHECK' && con.expression) {
        const expr = con.expression.length > 40 ? con.expression.substring(0, 37) + '...' : con.expression;
        parts.push(colors_1.colors.muted(`(${expr})`));
    }
    else if (con.type === 'FOREIGN KEY' && con.references) {
        parts.push(colors_1.colors.muted(`→ ${con.references.table}(${con.references.columns.join(', ')})`));
        if (con.references.onDelete && con.references.onDelete !== 'NO ACTION') {
            parts.push(colors_1.colors.muted(`ON DELETE ${con.references.onDelete}`));
        }
    }
    else if (con.columns.length > 0 && con.type !== 'CHECK') {
        parts.push(colors_1.colors.muted(`(${con.columns.join(', ')})`));
    }
    return parts.join(' ');
}
function formatIndexProps(idx) {
    const parts = [];
    if (idx.isUnique)
        parts.push(colors_1.colors.yellow('UNIQUE'));
    if (idx.method && idx.method !== 'btree')
        parts.push(colors_1.colors.cyan(idx.method.toUpperCase()));
    parts.push(colors_1.colors.muted(`(${idx.columns.join(', ')})`));
    if (idx.whereClause) {
        const where = idx.whereClause.length > 30 ? idx.whereClause.substring(0, 27) + '...' : idx.whereClause;
        parts.push(colors_1.colors.muted(`WHERE ${where}`));
    }
    return parts.join(' ');
}
function applyIgnorePatterns(comparison, patterns) {
    if (patterns.length === 0)
        return;
    const shouldIgnore = (name) => {
        return patterns.some(pattern => {
            if (pattern.includes('*')) {
                const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
                return regex.test(name);
            }
            return name === pattern;
        });
    };
    comparison.added.tables = comparison.added.tables.filter(t => !shouldIgnore(t.name));
    comparison.removed.tables = comparison.removed.tables.filter(t => !shouldIgnore(t.name));
    comparison.modified.tables = comparison.modified.tables.filter(t => !shouldIgnore(t.name));
    comparison.renamed.tables = comparison.renamed.tables.filter(t => !shouldIgnore(t.from) && !shouldIgnore(t.to));
    comparison.added.columns = comparison.added.columns.filter(c => !shouldIgnore(c.table));
    comparison.removed.columns = comparison.removed.columns.filter(c => !shouldIgnore(c.table));
    comparison.modified.columns = comparison.modified.columns.filter(c => !shouldIgnore(c.table));
    comparison.renamed.columns = comparison.renamed.columns.filter(c => !shouldIgnore(c.table));
    comparison.added.indexes = comparison.added.indexes.filter(i => !shouldIgnore(i.table));
    comparison.removed.indexes = comparison.removed.indexes.filter(i => !shouldIgnore(i.table));
    comparison.modified.indexes = comparison.modified.indexes.filter(i => !shouldIgnore(i.table));
    comparison.renamed.indexes = comparison.renamed.indexes.filter(i => !shouldIgnore(i.table));
    comparison.added.constraints = comparison.added.constraints.filter(c => !shouldIgnore(c.table));
    comparison.removed.constraints = comparison.removed.constraints.filter(c => !shouldIgnore(c.table));
    comparison.modified.constraints = comparison.modified.constraints.filter(c => !shouldIgnore(c.table));
    comparison.renamed.constraints = comparison.renamed.constraints.filter(c => !shouldIgnore(c.table));
}
function hasDestructiveChanges(comparison) {
    return comparison.removed.tables.length > 0
        || comparison.removed.columns.length > 0
        || comparison.removed.enums.length > 0
        || comparison.removed.domains.length > 0
        || comparison.removed.sequences.length > 0
        || comparison.removed.compositeTypes.length > 0
        || comparison.removed.views.length > 0
        || comparison.removed.functions.length > 0
        || comparison.removed.triggers.length > 0;
}
function getDestructiveItems(comparison, renamedFromNames) {
    const items = [];
    for (const t of comparison.removed.tables) {
        if (!renamedFromNames.has(t.name))
            items.push(t.name);
    }
    for (const c of comparison.removed.columns) {
        if (!renamedFromNames.has(c.table))
            items.push(`${c.table}.${c.column.name}`);
    }
    for (const e of comparison.removed.enums)
        items.push(`enum ${e.name}`);
    for (const d of comparison.removed.domains)
        items.push(`domain ${d.name}`);
    for (const s of comparison.removed.sequences)
        items.push(`sequence ${s.name}`);
    for (const ct of comparison.removed.compositeTypes)
        items.push(`type ${ct.name}`);
    for (const v of comparison.removed.views)
        items.push(`view ${v.name}`);
    for (const f of comparison.removed.functions)
        items.push(`function ${f.name}`);
    for (const tr of comparison.removed.triggers)
        items.push(`trigger ${tr.name}`);
    return items;
}
function stripDestructiveChanges(comparison) {
    comparison.removed.tables = [];
    comparison.removed.columns = [];
    comparison.removed.enums = [];
    comparison.removed.domains = [];
    comparison.removed.sequences = [];
    comparison.removed.compositeTypes = [];
    comparison.removed.views = [];
    comparison.removed.functions = [];
    comparison.removed.triggers = [];
    comparison.hasChanges = checkHasChanges(comparison);
}
function checkHasChanges(c) {
    return c.added.tables.length > 0 || c.added.columns.length > 0
        || c.added.indexes.length > 0 || c.added.constraints.length > 0
        || c.added.enums.length > 0 || c.added.extensions.length > 0
        || c.added.sequences.length > 0 || c.added.functions.length > 0
        || c.added.views.length > 0 || c.added.triggers.length > 0
        || c.added.domains.length > 0 || c.added.compositeTypes.length > 0
        || c.removed.tables.length > 0 || c.removed.columns.length > 0
        || c.removed.indexes.length > 0 || c.removed.constraints.length > 0
        || c.removed.enums.length > 0 || c.removed.extensions.length > 0
        || c.removed.sequences.length > 0 || c.removed.functions.length > 0
        || c.removed.views.length > 0 || c.removed.triggers.length > 0
        || c.removed.domains.length > 0 || c.removed.compositeTypes.length > 0
        || c.renamed.tables.length > 0 || c.renamed.columns.length > 0
        || c.renamed.indexes.length > 0 || c.renamed.constraints.length > 0
        || c.renamed.enums.length > 0 || c.renamed.sequences.length > 0
        || c.renamed.functions.length > 0
        || c.modified.tables.length > 0 || c.modified.columns.length > 0
        || c.modified.indexes.length > 0 || c.modified.constraints.length > 0
        || c.modified.enums.length > 0 || c.modified.sequences.length > 0
        || c.modified.functions.length > 0 || c.modified.views.length > 0
        || c.modified.triggers.length > 0 || c.modified.domains.length > 0
        || c.modified.compositeTypes.length > 0;
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
    const includePolicies = config.includePolicies ?? false;
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
        const schemaSource = fs.readFileSync(schemaPath, 'utf-8');
        const sourceIdIssues = (0, source_id_validator_1.validateSourceTrackingIds)(schemaPath, schemaSource);
        if (sourceIdIssues.length > 0) {
            spin.stop('Schema validation failed');
            console.log('');
            console.log((0, tracking_id_validator_1.formatTrackingIdIssues)(sourceIdIssues));
            console.log('');
            (0, ui_1.fatal)('Push aborted — resolve tracking ID issues first.');
        }
        const { schema: desiredSchema, ast: desiredAST } = await (0, schema_loader_1.loadSchemaFile)(schemaPathRaw, projectRoot, config);
        spin.stop(`Schema: ${colors_1.colors.cyan(String(desiredSchema.tables.length))} table(s) loaded`);
        const trackingIssues = (0, tracking_id_validator_1.validateTrackingIds)(desiredAST);
        const trackingErrors = trackingIssues.filter(i => i.severity === 'error');
        if (trackingErrors.length > 0) {
            console.log('');
            console.log((0, tracking_id_validator_1.formatTrackingIdIssues)(trackingErrors));
            console.log('');
            (0, ui_1.fatal)('Push aborted — resolve tracking ID issues first.');
        }
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
        if (!includePolicies || desiredASTCopy.policies.length === 0) {
            dbParsedSchema.policies = [];
            desiredASTCopy.policies = [];
        }
        if (desiredASTCopy.sequences.length === 0) {
            dbParsedSchema.sequences = [];
        }
        const comparison = (0, schema_diff_1.compareSchemas)(dbParsedSchema, desiredASTCopy);
        applyIgnorePatterns(comparison, ignorePatterns.map(pat => pat.raw));
        comparison.hasChanges = checkHasChanges(comparison);
        spin.stop('Diff computed');
        if (!comparison.hasChanges) {
            const typesFilePath = (0, types_manager_1.getTypesFilePath)(schemaPath);
            try {
                spin.start('Syncing types to database...');
                const typesSync = await (0, types_manager_1.syncTypesToDb)(connection, typesFilePath, schemaPath);
                if (typesSync.added.length > 0 || typesSync.updated.length > 0 || typesSync.removed.length > 0) {
                    const parts = [];
                    if (typesSync.added.length > 0)
                        parts.push(`${typesSync.added.length} added`);
                    if (typesSync.updated.length > 0)
                        parts.push(`${typesSync.updated.length} updated`);
                    if (typesSync.removed.length > 0)
                        parts.push(`${typesSync.removed.length} removed`);
                    spin.stop(`Types synced: ${parts.join(', ')}`);
                    console.log('');
                    console.log(`Schema up-to-date. Synced types: ${parts.join(', ')}`);
                    console.log('');
                    return;
                }
                spin.stop('Types up-to-date');
            }
            catch {
                spin.stop('Types sync skipped');
            }
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
            for (const mod of comparison.modified.columns.filter(c => c.table === rename.to)) {
                const details = mod.changes.map(c => `${c.field}: ${c.from} → ${c.to}`).join(', ');
                console.log(`      ${colors_1.colors.yellow('~')} ${mod.column} ${details ? colors_1.colors.muted(`(${details})`) : ''}`);
            }
            for (const add of comparison.added.columns.filter(c => c.table === rename.to)) {
                console.log(`      ${colors_1.colors.green('+')} ${add.column.name}`);
            }
            for (const rem of comparison.removed.columns.filter(c => c.table === rename.to)) {
                console.log(`      ${colors_1.colors.red('-')} ${rem.column.name}`);
            }
            for (const ren of comparison.renamed.columns.filter(c => c.table === rename.to)) {
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
        for (const rename of comparison.renamed.constraints) {
            if (renamedToNames.has(rename.table))
                continue;
            console.log(`  ${colors_1.colors.cyan('→')} ${colors_1.colors.bold(rename.table)} constraint ${rename.from} → ${rename.to} ${colors_1.colors.muted('(rename)')}`);
        }
        for (const table of comparison.added.tables) {
            if (renamedToNames.has(table.name))
                continue;
            console.log(`  ${colors_1.colors.green('+')} ${colors_1.colors.bold(table.name)} ${colors_1.colors.muted('(new table)')}`);
            for (const col of table.columns) {
                console.log(`      ${colors_1.colors.green('+')} ${col.name} ${formatColumnProps(col)}`);
            }
            for (const con of table.constraints) {
                if (con.type === 'PRIMARY KEY')
                    continue;
                console.log(`      ${colors_1.colors.green('+')} ${con.name} ${formatConstraintProps(con)}`);
            }
            for (const idx of table.indexes) {
                console.log(`      ${colors_1.colors.green('+')} ${idx.name} ${colors_1.colors.muted('INDEX')} ${formatIndexProps(idx)}`);
            }
        }
        for (const table of comparison.removed.tables) {
            if (renamedFromNames.has(table.name))
                continue;
            console.log(`  ${colors_1.colors.red('-')} ${colors_1.colors.bold(table.name)} ${colors_1.colors.muted('(drop table)')}`);
            for (const col of table.columns) {
                console.log(`      ${colors_1.colors.red('-')} ${col.name} ${formatColumnProps(col)}`);
            }
            for (const con of table.constraints) {
                if (con.type === 'PRIMARY KEY')
                    continue;
                console.log(`      ${colors_1.colors.red('-')} ${con.name} ${formatConstraintProps(con)}`);
            }
            for (const idx of table.indexes) {
                console.log(`      ${colors_1.colors.red('-')} ${idx.name} ${colors_1.colors.muted('INDEX')} ${formatIndexProps(idx)}`);
            }
        }
        const modifiedTableNames = new Set();
        for (const c of comparison.added.columns)
            modifiedTableNames.add(c.table);
        for (const c of comparison.removed.columns)
            modifiedTableNames.add(c.table);
        for (const c of comparison.modified.columns)
            modifiedTableNames.add(c.table);
        for (const i of comparison.added.indexes)
            modifiedTableNames.add(i.table);
        for (const i of comparison.removed.indexes)
            modifiedTableNames.add(i.table);
        for (const i of comparison.modified.indexes)
            modifiedTableNames.add(i.table);
        for (const c of comparison.added.constraints)
            modifiedTableNames.add(c.table);
        for (const c of comparison.removed.constraints)
            modifiedTableNames.add(c.table);
        for (const c of comparison.modified.constraints)
            modifiedTableNames.add(c.table);
        for (const tableName of modifiedTableNames) {
            if (renamedFromNames.has(tableName) || renamedToNames.has(tableName))
                continue;
            if (comparison.added.tables.some(t => t.name === tableName))
                continue;
            if (comparison.removed.tables.some(t => t.name === tableName))
                continue;
            console.log(`  ${colors_1.colors.yellow('~')} ${colors_1.colors.bold(tableName)}`);
            for (const add of comparison.added.columns.filter(c => c.table === tableName)) {
                console.log(`      ${colors_1.colors.green('+')} ${add.column.name} ${formatColumnProps(add.column)}`);
            }
            for (const rem of comparison.removed.columns.filter(c => c.table === tableName)) {
                console.log(`      ${colors_1.colors.red('-')} ${rem.column.name}`);
            }
            for (const mod of comparison.modified.columns.filter(c => c.table === tableName)) {
                const details = mod.changes.map(c => `${c.field}: ${c.from} → ${c.to}`).join(', ');
                console.log(`      ${colors_1.colors.yellow('~')} ${mod.column} ${details ? colors_1.colors.muted(`(${details})`) : ''}`);
            }
            for (const ren of comparison.renamed.columns.filter(c => c.table === tableName)) {
                if (renamedToNames.has(tableName))
                    continue;
                console.log(`      ${colors_1.colors.cyan('→')} ${ren.from} → ${ren.to} ${colors_1.colors.muted('(rename column)')}`);
            }
            for (const add of comparison.added.indexes.filter(i => i.table === tableName)) {
                console.log(`      ${colors_1.colors.green('+')} index ${add.index.name}`);
            }
            for (const rem of comparison.removed.indexes.filter(i => i.table === tableName)) {
                console.log(`      ${colors_1.colors.red('-')} index ${rem.index.name}`);
            }
            for (const mod of comparison.modified.indexes.filter(i => i.table === tableName)) {
                console.log(`      ${colors_1.colors.yellow('~')} index ${mod.newIndex.name} ${colors_1.colors.muted(`(${mod.changes.join(', ')})`)}`);
            }
            for (const add of comparison.added.constraints.filter(c => c.table === tableName)) {
                console.log(`      ${colors_1.colors.green('+')} constraint ${add.constraint.name}`);
            }
            for (const rem of comparison.removed.constraints.filter(c => c.table === tableName)) {
                console.log(`      ${colors_1.colors.red('-')} constraint ${rem.constraint.name}`);
            }
            for (const mod of comparison.modified.constraints.filter(c => c.table === tableName)) {
                console.log(`      ${colors_1.colors.yellow('~')} constraint ${mod.newConstraint.name} ${colors_1.colors.muted(`(${mod.changes.join(', ')})`)}`);
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
        for (const d of comparison.modified.domains) {
            console.log(`  ${colors_1.colors.yellow('~')} ${colors_1.colors.bold(d.name)} ${colors_1.colors.muted(`(domain: ${d.changes.join(', ')})`)}`);
        }
        for (const s of comparison.added.sequences) {
            console.log(`  ${colors_1.colors.green('+')} ${colors_1.colors.bold(s.name)} ${colors_1.colors.muted('(new sequence)')}`);
        }
        for (const s of comparison.removed.sequences) {
            console.log(`  ${colors_1.colors.red('-')} ${colors_1.colors.bold(s.name)} ${colors_1.colors.muted('(drop sequence)')}`);
        }
        for (const s of comparison.modified.sequences) {
            console.log(`  ${colors_1.colors.yellow('~')} ${colors_1.colors.bold(s.name)} ${colors_1.colors.muted(`(sequence: ${s.changes.join(', ')})`)}`);
        }
        for (const ct of comparison.added.compositeTypes) {
            console.log(`  ${colors_1.colors.green('+')} ${colors_1.colors.bold(ct.name)} ${colors_1.colors.muted('(new type)')}`);
        }
        for (const ct of comparison.removed.compositeTypes) {
            console.log(`  ${colors_1.colors.red('-')} ${colors_1.colors.bold(ct.name)} ${colors_1.colors.muted('(drop type)')}`);
        }
        for (const ct of comparison.modified.compositeTypes) {
            console.log(`  ${colors_1.colors.yellow('~')} ${colors_1.colors.bold(ct.name)} ${colors_1.colors.muted(`(type: ${ct.changes.join(', ')})`)}`);
        }
        for (const v of comparison.added.views) {
            console.log(`  ${colors_1.colors.green('+')} ${colors_1.colors.bold(v.name)} ${colors_1.colors.muted('(new view)')}`);
        }
        for (const v of comparison.removed.views) {
            console.log(`  ${colors_1.colors.red('-')} ${colors_1.colors.bold(v.name)} ${colors_1.colors.muted('(drop view)')}`);
        }
        for (const v of comparison.modified.views) {
            console.log(`  ${colors_1.colors.yellow('~')} ${colors_1.colors.bold(v.name)} ${colors_1.colors.muted(`(view: ${v.changes.join(', ')})`)}`);
        }
        for (const f of comparison.added.functions) {
            console.log(`  ${colors_1.colors.green('+')} ${colors_1.colors.bold(f.name)} ${colors_1.colors.muted('(new function)')}`);
        }
        for (const f of comparison.removed.functions) {
            console.log(`  ${colors_1.colors.red('-')} ${colors_1.colors.bold(f.name)} ${colors_1.colors.muted('(drop function)')}`);
        }
        for (const f of comparison.modified.functions) {
            console.log(`  ${colors_1.colors.yellow('~')} ${colors_1.colors.bold(f.name)} ${colors_1.colors.muted(`(function: ${f.changes.join(', ')})`)}`);
        }
        for (const t of comparison.added.triggers) {
            console.log(`  ${colors_1.colors.green('+')} ${colors_1.colors.bold(t.name)} ${colors_1.colors.muted('(new trigger)')}`);
        }
        for (const t of comparison.removed.triggers) {
            console.log(`  ${colors_1.colors.red('-')} ${colors_1.colors.bold(t.name)} ${colors_1.colors.muted('(drop trigger)')}`);
        }
        for (const t of comparison.modified.triggers) {
            console.log(`  ${colors_1.colors.yellow('~')} ${colors_1.colors.bold(t.name)} ${colors_1.colors.muted(`(trigger: ${t.changes.join(', ')})`)}`);
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
        if (hasDestructiveChanges(comparison) || hasNonTableDestructive) {
            const destructiveItems = getDestructiveItems(comparison, renamedFromNames);
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
                        stripDestructiveChanges(comparison);
                        if (!comparison.hasChanges) {
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
        const summaryLines = [];
        const addedTables = comparison.added.tables.filter(t => !renamedToNames.has(t.name));
        const removedTables = comparison.removed.tables.filter(t => !renamedFromNames.has(t.name));
        const tablesAdded = addedTables.length;
        const tablesRemoved = removedTables.length;
        const tablesModified = comparison.modified.tables.length;
        const tableRenames = comparison.renamed.tables.length;
        if (tablesAdded || tablesRemoved || tablesModified || tableRenames) {
            const tParts = [];
            if (tablesAdded)
                tParts.push(colors_1.colors.green(`${tablesAdded} added`));
            if (tableRenames)
                tParts.push(colors_1.colors.cyan(`${tableRenames} renamed`));
            if (tablesModified)
                tParts.push(colors_1.colors.yellow(`${tablesModified} modified`));
            if (tablesRemoved)
                tParts.push(colors_1.colors.red(`${tablesRemoved} removed`));
            summaryLines.push(`   ${colors_1.colors.muted('tables:')} ${tParts.join(', ')}`);
        }
        const newTableCols = addedTables.reduce((n, t) => n + t.columns.length, 0);
        const droppedTableCols = removedTables.reduce((n, t) => n + t.columns.length, 0);
        const colsAdded = comparison.added.columns.length + newTableCols;
        const colsRemoved = comparison.removed.columns.length + droppedTableCols;
        const colsModified = comparison.modified.columns.length;
        const colRenames = comparison.renamed.columns.length;
        if (colsAdded || colsRemoved || colsModified || colRenames) {
            const cParts = [];
            if (colsAdded)
                cParts.push(colors_1.colors.green(`${colsAdded} added`));
            if (colRenames)
                cParts.push(colors_1.colors.cyan(`${colRenames} renamed`));
            if (colsModified)
                cParts.push(colors_1.colors.yellow(`${colsModified} modified`));
            if (colsRemoved)
                cParts.push(colors_1.colors.red(`${colsRemoved} removed`));
            summaryLines.push(`   ${colors_1.colors.muted('columns:')} ${cParts.join(', ')}`);
        }
        const newTableIdx = addedTables.reduce((n, t) => n + t.indexes.length, 0);
        const droppedTableIdx = removedTables.reduce((n, t) => n + t.indexes.length, 0);
        const idxAdded = comparison.added.indexes.length + newTableIdx;
        const idxRemoved = comparison.removed.indexes.length + droppedTableIdx;
        const idxModified = comparison.modified.indexes.length;
        const idxRenames = comparison.renamed.indexes.length;
        if (idxAdded || idxRemoved || idxModified || idxRenames) {
            const iParts = [];
            if (idxAdded)
                iParts.push(colors_1.colors.green(`${idxAdded} added`));
            if (idxRenames)
                iParts.push(colors_1.colors.cyan(`${idxRenames} renamed`));
            if (idxModified)
                iParts.push(colors_1.colors.yellow(`${idxModified} modified`));
            if (idxRemoved)
                iParts.push(colors_1.colors.red(`${idxRemoved} removed`));
            summaryLines.push(`   ${colors_1.colors.muted('indexes:')} ${iParts.join(', ')}`);
        }
        const newTableCon = addedTables.reduce((n, t) => n + t.constraints.filter(c => c.type !== 'PRIMARY KEY').length, 0);
        const droppedTableCon = removedTables.reduce((n, t) => n + t.constraints.filter(c => c.type !== 'PRIMARY KEY').length, 0);
        const conAdded = comparison.added.constraints.length + newTableCon;
        const conRemoved = comparison.removed.constraints.length + droppedTableCon;
        const conModified = comparison.modified.constraints.length;
        const conRenames = comparison.renamed.constraints.length;
        if (conAdded || conRemoved || conModified || conRenames) {
            const conParts = [];
            if (conAdded)
                conParts.push(colors_1.colors.green(`${conAdded} added`));
            if (conRenames)
                conParts.push(colors_1.colors.cyan(`${conRenames} renamed`));
            if (conModified)
                conParts.push(colors_1.colors.yellow(`${conModified} modified`));
            if (conRemoved)
                conParts.push(colors_1.colors.red(`${conRemoved} removed`));
            summaryLines.push(`   ${colors_1.colors.muted('constraints:')} ${conParts.join(', ')}`);
        }
        const enumsAdded = comparison.added.enums.length;
        const enumsRemoved = comparison.removed.enums.length;
        const enumsModified = comparison.modified.enums.length;
        const enumsRenamed = comparison.renamed.enums.length;
        if (enumsAdded || enumsRemoved || enumsModified || enumsRenamed) {
            const eParts = [];
            if (enumsAdded)
                eParts.push(colors_1.colors.green(`${enumsAdded} added`));
            if (enumsRenamed)
                eParts.push(colors_1.colors.cyan(`${enumsRenamed} renamed`));
            if (enumsModified)
                eParts.push(colors_1.colors.yellow(`${enumsModified} modified`));
            if (enumsRemoved)
                eParts.push(colors_1.colors.red(`${enumsRemoved} removed`));
            summaryLines.push(`   ${colors_1.colors.muted('enums:')} ${eParts.join(', ')}`);
        }
        if (comparison.added.domains.length || comparison.removed.domains.length || comparison.modified.domains.length) {
            const dParts = [];
            if (comparison.added.domains.length)
                dParts.push(colors_1.colors.green(`${comparison.added.domains.length} added`));
            if (comparison.modified.domains.length)
                dParts.push(colors_1.colors.yellow(`${comparison.modified.domains.length} modified`));
            if (comparison.removed.domains.length)
                dParts.push(colors_1.colors.red(`${comparison.removed.domains.length} removed`));
            summaryLines.push(`   ${colors_1.colors.muted('domains:')} ${dParts.join(', ')}`);
        }
        if (comparison.added.sequences.length || comparison.removed.sequences.length || comparison.modified.sequences.length) {
            const sParts = [];
            if (comparison.added.sequences.length)
                sParts.push(colors_1.colors.green(`${comparison.added.sequences.length} added`));
            if (comparison.modified.sequences.length)
                sParts.push(colors_1.colors.yellow(`${comparison.modified.sequences.length} modified`));
            if (comparison.removed.sequences.length)
                sParts.push(colors_1.colors.red(`${comparison.removed.sequences.length} removed`));
            summaryLines.push(`   ${colors_1.colors.muted('sequences:')} ${sParts.join(', ')}`);
        }
        if (comparison.added.compositeTypes.length || comparison.removed.compositeTypes.length || comparison.modified.compositeTypes.length) {
            const ctParts = [];
            if (comparison.added.compositeTypes.length)
                ctParts.push(colors_1.colors.green(`${comparison.added.compositeTypes.length} added`));
            if (comparison.modified.compositeTypes.length)
                ctParts.push(colors_1.colors.yellow(`${comparison.modified.compositeTypes.length} modified`));
            if (comparison.removed.compositeTypes.length)
                ctParts.push(colors_1.colors.red(`${comparison.removed.compositeTypes.length} removed`));
            summaryLines.push(`   ${colors_1.colors.muted('types:')} ${ctParts.join(', ')}`);
        }
        if (comparison.added.views.length || comparison.removed.views.length || comparison.modified.views.length) {
            const vParts = [];
            if (comparison.added.views.length)
                vParts.push(colors_1.colors.green(`${comparison.added.views.length} added`));
            if (comparison.modified.views.length)
                vParts.push(colors_1.colors.yellow(`${comparison.modified.views.length} modified`));
            if (comparison.removed.views.length)
                vParts.push(colors_1.colors.red(`${comparison.removed.views.length} removed`));
            summaryLines.push(`   ${colors_1.colors.muted('views:')} ${vParts.join(', ')}`);
        }
        if (comparison.added.functions.length || comparison.removed.functions.length || comparison.modified.functions.length) {
            const fParts = [];
            if (comparison.added.functions.length)
                fParts.push(colors_1.colors.green(`${comparison.added.functions.length} added`));
            if (comparison.modified.functions.length)
                fParts.push(colors_1.colors.yellow(`${comparison.modified.functions.length} modified`));
            if (comparison.removed.functions.length)
                fParts.push(colors_1.colors.red(`${comparison.removed.functions.length} removed`));
            summaryLines.push(`   ${colors_1.colors.muted('functions:')} ${fParts.join(', ')}`);
        }
        if (comparison.added.triggers.length || comparison.removed.triggers.length || comparison.modified.triggers.length) {
            const trParts = [];
            if (comparison.added.triggers.length)
                trParts.push(colors_1.colors.green(`${comparison.added.triggers.length} added`));
            if (comparison.modified.triggers.length)
                trParts.push(colors_1.colors.yellow(`${comparison.modified.triggers.length} modified`));
            if (comparison.removed.triggers.length)
                trParts.push(colors_1.colors.red(`${comparison.removed.triggers.length} removed`));
            summaryLines.push(`   ${colors_1.colors.muted('triggers:')} ${trParts.join(', ')}`);
        }
        if (comparison.added.extensions.length || comparison.removed.extensions.length) {
            const exParts = [];
            if (comparison.added.extensions.length)
                exParts.push(colors_1.colors.green(`${comparison.added.extensions.length} added`));
            if (comparison.removed.extensions.length)
                exParts.push(colors_1.colors.red(`${comparison.removed.extensions.length} removed`));
            summaryLines.push(`   ${colors_1.colors.muted('extensions:')} ${exParts.join(', ')}`);
        }
        if (summaryLines.length > 0) {
            for (const line of summaryLines)
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
            const formattedUp = (0, migration_generator_1.formatMigrationStatements)(upStatements);
            for (const line of formattedUp) {
                console.log(line);
            }
            if (downStatements.length > 0) {
                console.log('');
                if (full) {
                    console.log(`${colors_1.colors.yellow('Rollback')} - SQL to revert:`);
                    console.log('');
                    const formattedDown = (0, migration_generator_1.formatMigrationStatements)(downStatements);
                    for (const line of formattedDown) {
                        console.log(line);
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
            spin.start('Syncing types to database...');
            const typesSync = await (0, types_manager_1.syncTypesToDb)(connection, typesFilePath, schemaPath);
            if (typesSync.added.length > 0 || typesSync.updated.length > 0 || typesSync.removed.length > 0) {
                const parts = [];
                if (typesSync.added.length > 0)
                    parts.push(`${typesSync.added.length} added`);
                if (typesSync.updated.length > 0)
                    parts.push(`${typesSync.updated.length} updated`);
                if (typesSync.removed.length > 0)
                    parts.push(`${typesSync.removed.length} removed`);
                spin.stop(`Types synced: ${parts.join(', ')}`);
            }
            else {
                spin.stop('Types up-to-date');
            }
        }
        catch {
            spin.stop('Types sync skipped');
        }
        const duration = Date.now() - startTime;
        console.log('');
        console.log(`Push completed in ${(0, format_1.formatDuration)(duration)}`);
        const totalAdded = tablesAdded + colsAdded + idxAdded + conAdded
            + enumsAdded + comparison.added.domains.length
            + comparison.added.sequences.length + comparison.added.compositeTypes.length
            + comparison.added.views.length + comparison.added.functions.length
            + comparison.added.triggers.length + comparison.added.extensions.length;
        const totalRenamed = tableRenames + colRenames + idxRenames + conRenames
            + enumsRenamed + comparison.renamed.sequences.length
            + comparison.renamed.functions.length;
        const totalModified = tablesModified + colsModified + idxModified + conModified
            + enumsModified;
        const totalRemoved = tablesRemoved + colsRemoved + idxRemoved + conRemoved
            + enumsRemoved + comparison.removed.domains.length
            + comparison.removed.sequences.length + comparison.removed.compositeTypes.length
            + comparison.removed.views.length + comparison.removed.functions.length
            + comparison.removed.triggers.length + comparison.removed.extensions.length;
        const finalParts = [];
        if (totalAdded > 0 || totalModified > 0 || totalRemoved > 0 || totalRenamed > 0) {
            if (totalAdded > 0)
                finalParts.push(colors_1.colors.green(`${totalAdded} added`));
            if (totalRenamed > 0)
                finalParts.push(colors_1.colors.cyan(`${totalRenamed} renamed`));
            if (totalModified > 0)
                finalParts.push(colors_1.colors.yellow(`${totalModified} modified`));
            if (totalRemoved > 0)
                finalParts.push(colors_1.colors.red(`${totalRemoved} removed`));
        }
        else {
            finalParts.push('no changes');
        }
        console.log(`   ${finalParts.join(', ')}`);
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
