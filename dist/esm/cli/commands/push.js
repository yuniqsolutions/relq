import { defineCommand } from 'citty';
import * as path from 'node:path';
import * as fs from 'node:fs';
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
import { loadSnapshot, saveSnapshot } from "../utils/snapshot-manager.js";
import { loadSchemaFile } from "../utils/schema-loader.js";
import { compareSchemas } from "../utils/schema-diff.js";
import { generateTimestampedName, generateMigrationFromComparison, generateMigrationNameFromComparison, formatMigrationStatements } from "../utils/migration-generator.js";
import { getMigrationTableDDL } from "../utils/migration-helpers.js";
import { introspectedToParsedSchema } from "../utils/ast-transformer.js";
import { validateTrackingIds, formatTrackingIdIssues } from "../utils/tracking-id-validator.js";
import { validateSourceTrackingIds } from "../utils/source-id-validator.js";
import { syncTypesToDb, getTypesFilePath } from "../utils/types-manager.js";
function formatColumnProps(col) {
    const parts = [];
    const rawType = col.isArray ? `${col.type}[]` : col.type;
    const length = col.typeParams?.length;
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
function formatConstraintProps(con) {
    const parts = [];
    parts.push(colors.yellow(con.type));
    if (con.type === 'CHECK' && con.expression) {
        const expr = con.expression.length > 40 ? con.expression.substring(0, 37) + '...' : con.expression;
        parts.push(colors.muted(`(${expr})`));
    }
    else if (con.type === 'FOREIGN KEY' && con.references) {
        parts.push(colors.muted(`→ ${con.references.table}(${con.references.columns.join(', ')})`));
        if (con.references.onDelete && con.references.onDelete !== 'NO ACTION') {
            parts.push(colors.muted(`ON DELETE ${con.references.onDelete}`));
        }
    }
    else if (con.columns.length > 0 && con.type !== 'CHECK') {
        parts.push(colors.muted(`(${con.columns.join(', ')})`));
    }
    return parts.join(' ');
}
function formatIndexProps(idx) {
    const parts = [];
    if (idx.isUnique)
        parts.push(colors.yellow('UNIQUE'));
    if (idx.method && idx.method !== 'btree')
        parts.push(colors.cyan(idx.method.toUpperCase()));
    parts.push(colors.muted(`(${idx.columns.join(', ')})`));
    if (idx.whereClause) {
        const where = idx.whereClause.length > 30 ? idx.whereClause.substring(0, 27) + '...' : idx.whereClause;
        parts.push(colors.muted(`WHERE ${where}`));
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
export async function runPush(config, projectRoot, opts = {}) {
    const { force = false, dryRun = false, full = false, skipPrompt = false } = opts;
    const connection = config.connection;
    const includeFunctions = config.includeFunctions ?? false;
    const includeTriggers = config.includeTriggers ?? false;
    const includePolicies = config.includePolicies ?? false;
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
        const schemaSource = fs.readFileSync(schemaPath, 'utf-8');
        const sourceIdIssues = validateSourceTrackingIds(schemaPath, schemaSource);
        if (sourceIdIssues.length > 0) {
            spin.stop('Schema validation failed');
            console.log('');
            console.log(formatTrackingIdIssues(sourceIdIssues));
            console.log('');
            fatal('Push aborted — resolve tracking ID issues first.');
        }
        const { schema: desiredSchema, ast: desiredAST } = await loadSchemaFile(schemaPathRaw, projectRoot, config);
        spin.stop(`Schema: ${colors.cyan(String(desiredSchema.tables.length))} table(s) loaded`);
        const trackingIssues = validateTrackingIds(desiredAST);
        const trackingErrors = trackingIssues.filter(i => i.severity === 'error');
        if (trackingErrors.length > 0) {
            console.log('');
            console.log(formatTrackingIdIssues(trackingErrors));
            console.log('');
            fatal('Push aborted — resolve tracking ID issues first.');
        }
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
        const dbParsedSchema = await introspectedToParsedSchema(dbSchema);
        const snapshot = loadSnapshot(snapshotPath);
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
        const comparison = compareSchemas(dbParsedSchema, desiredASTCopy);
        applyIgnorePatterns(comparison, ignorePatterns.map(pat => pat.raw));
        comparison.hasChanges = checkHasChanges(comparison);
        spin.stop('Diff computed');
        if (!comparison.hasChanges) {
            const typesFilePath = getTypesFilePath(schemaPath);
            try {
                spin.start('Syncing types to database...');
                const typesSync = await syncTypesToDb(connection, typesFilePath, schemaPath);
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
        console.log(`${colors.bold('Changes to push:')}`);
        const renamedFromNames = new Set(comparison.renamed.tables.map(r => r.from));
        const renamedToNames = new Set(comparison.renamed.tables.map(r => r.to));
        for (const rename of comparison.renamed.tables) {
            console.log(`  ${colors.cyan('→')} ${colors.bold(rename.from)} → ${colors.bold(rename.to)} ${colors.muted('(rename)')}`);
            for (const mod of comparison.modified.columns.filter(c => c.table === rename.to)) {
                const details = mod.changes.map(c => `${c.field}: ${c.from} → ${c.to}`).join(', ');
                console.log(`      ${colors.yellow('~')} ${mod.column} ${details ? colors.muted(`(${details})`) : ''}`);
            }
            for (const add of comparison.added.columns.filter(c => c.table === rename.to)) {
                console.log(`      ${colors.green('+')} ${add.column.name}`);
            }
            for (const rem of comparison.removed.columns.filter(c => c.table === rename.to)) {
                console.log(`      ${colors.red('-')} ${rem.column.name}`);
            }
            for (const ren of comparison.renamed.columns.filter(c => c.table === rename.to)) {
                console.log(`      ${colors.cyan('→')} ${ren.from} → ${ren.to} ${colors.muted('(rename column)')}`);
            }
        }
        for (const rename of comparison.renamed.columns) {
            if (renamedToNames.has(rename.table))
                continue;
            console.log(`  ${colors.cyan('→')} ${colors.bold(rename.table)}.${rename.from} → ${rename.to} ${colors.muted('(rename column)')}`);
        }
        for (const rename of comparison.renamed.indexes) {
            console.log(`  ${colors.cyan('→')} index ${rename.from} → ${rename.to} ${colors.muted('(rename index)')}`);
        }
        for (const rename of comparison.renamed.constraints) {
            if (renamedToNames.has(rename.table))
                continue;
            console.log(`  ${colors.cyan('→')} ${colors.bold(rename.table)} constraint ${rename.from} → ${rename.to} ${colors.muted('(rename)')}`);
        }
        for (const table of comparison.added.tables) {
            if (renamedToNames.has(table.name))
                continue;
            console.log(`  ${colors.green('+')} ${colors.bold(table.name)} ${colors.muted('(new table)')}`);
            for (const col of table.columns) {
                console.log(`      ${colors.green('+')} ${col.name} ${formatColumnProps(col)}`);
            }
            for (const con of table.constraints) {
                if (con.type === 'PRIMARY KEY')
                    continue;
                console.log(`      ${colors.green('+')} ${con.name} ${formatConstraintProps(con)}`);
            }
            for (const idx of table.indexes) {
                console.log(`      ${colors.green('+')} ${idx.name} ${colors.muted('INDEX')} ${formatIndexProps(idx)}`);
            }
        }
        for (const table of comparison.removed.tables) {
            if (renamedFromNames.has(table.name))
                continue;
            console.log(`  ${colors.red('-')} ${colors.bold(table.name)} ${colors.muted('(drop table)')}`);
            for (const col of table.columns) {
                console.log(`      ${colors.red('-')} ${col.name} ${formatColumnProps(col)}`);
            }
            for (const con of table.constraints) {
                if (con.type === 'PRIMARY KEY')
                    continue;
                console.log(`      ${colors.red('-')} ${con.name} ${formatConstraintProps(con)}`);
            }
            for (const idx of table.indexes) {
                console.log(`      ${colors.red('-')} ${idx.name} ${colors.muted('INDEX')} ${formatIndexProps(idx)}`);
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
            console.log(`  ${colors.yellow('~')} ${colors.bold(tableName)}`);
            for (const add of comparison.added.columns.filter(c => c.table === tableName)) {
                console.log(`      ${colors.green('+')} ${add.column.name} ${formatColumnProps(add.column)}`);
            }
            for (const rem of comparison.removed.columns.filter(c => c.table === tableName)) {
                console.log(`      ${colors.red('-')} ${rem.column.name}`);
            }
            for (const mod of comparison.modified.columns.filter(c => c.table === tableName)) {
                const details = mod.changes.map(c => `${c.field}: ${c.from} → ${c.to}`).join(', ');
                console.log(`      ${colors.yellow('~')} ${mod.column} ${details ? colors.muted(`(${details})`) : ''}`);
            }
            for (const ren of comparison.renamed.columns.filter(c => c.table === tableName)) {
                if (renamedToNames.has(tableName))
                    continue;
                console.log(`      ${colors.cyan('→')} ${ren.from} → ${ren.to} ${colors.muted('(rename column)')}`);
            }
            for (const add of comparison.added.indexes.filter(i => i.table === tableName)) {
                console.log(`      ${colors.green('+')} index ${add.index.name}`);
            }
            for (const rem of comparison.removed.indexes.filter(i => i.table === tableName)) {
                console.log(`      ${colors.red('-')} index ${rem.index.name}`);
            }
            for (const mod of comparison.modified.indexes.filter(i => i.table === tableName)) {
                console.log(`      ${colors.yellow('~')} index ${mod.newIndex.name} ${colors.muted(`(${mod.changes.join(', ')})`)}`);
            }
            for (const add of comparison.added.constraints.filter(c => c.table === tableName)) {
                console.log(`      ${colors.green('+')} constraint ${add.constraint.name}`);
            }
            for (const rem of comparison.removed.constraints.filter(c => c.table === tableName)) {
                console.log(`      ${colors.red('-')} constraint ${rem.constraint.name}`);
            }
            for (const mod of comparison.modified.constraints.filter(c => c.table === tableName)) {
                console.log(`      ${colors.yellow('~')} constraint ${mod.newConstraint.name} ${colors.muted(`(${mod.changes.join(', ')})`)}`);
            }
        }
        for (const e of comparison.added.enums) {
            console.log(`  ${colors.green('+')} ${colors.bold(e.name)} ${colors.muted('(new enum)')}`);
        }
        for (const e of comparison.removed.enums) {
            console.log(`  ${colors.red('-')} ${colors.bold(e.name)} ${colors.muted('(drop enum)')}`);
        }
        for (const e of comparison.modified.enums) {
            const added = e.changes.added.length > 0 ? `+${e.changes.added.join(',')}` : '';
            const removed = e.changes.removed.length > 0 ? `-${e.changes.removed.join(',')}` : '';
            console.log(`  ${colors.yellow('~')} ${colors.bold(e.name)} ${colors.muted(`(enum: ${[added, removed].filter(Boolean).join(' ')})`)}`);
        }
        for (const d of comparison.added.domains) {
            console.log(`  ${colors.green('+')} ${colors.bold(d.name)} ${colors.muted('(new domain)')}`);
        }
        for (const d of comparison.removed.domains) {
            console.log(`  ${colors.red('-')} ${colors.bold(d.name)} ${colors.muted('(drop domain)')}`);
        }
        for (const d of comparison.modified.domains) {
            console.log(`  ${colors.yellow('~')} ${colors.bold(d.name)} ${colors.muted(`(domain: ${d.changes.join(', ')})`)}`);
        }
        for (const s of comparison.added.sequences) {
            console.log(`  ${colors.green('+')} ${colors.bold(s.name)} ${colors.muted('(new sequence)')}`);
        }
        for (const s of comparison.removed.sequences) {
            console.log(`  ${colors.red('-')} ${colors.bold(s.name)} ${colors.muted('(drop sequence)')}`);
        }
        for (const s of comparison.modified.sequences) {
            console.log(`  ${colors.yellow('~')} ${colors.bold(s.name)} ${colors.muted(`(sequence: ${s.changes.join(', ')})`)}`);
        }
        for (const ct of comparison.added.compositeTypes) {
            console.log(`  ${colors.green('+')} ${colors.bold(ct.name)} ${colors.muted('(new type)')}`);
        }
        for (const ct of comparison.removed.compositeTypes) {
            console.log(`  ${colors.red('-')} ${colors.bold(ct.name)} ${colors.muted('(drop type)')}`);
        }
        for (const ct of comparison.modified.compositeTypes) {
            console.log(`  ${colors.yellow('~')} ${colors.bold(ct.name)} ${colors.muted(`(type: ${ct.changes.join(', ')})`)}`);
        }
        for (const v of comparison.added.views) {
            console.log(`  ${colors.green('+')} ${colors.bold(v.name)} ${colors.muted('(new view)')}`);
        }
        for (const v of comparison.removed.views) {
            console.log(`  ${colors.red('-')} ${colors.bold(v.name)} ${colors.muted('(drop view)')}`);
        }
        for (const v of comparison.modified.views) {
            console.log(`  ${colors.yellow('~')} ${colors.bold(v.name)} ${colors.muted(`(view: ${v.changes.join(', ')})`)}`);
        }
        for (const f of comparison.added.functions) {
            console.log(`  ${colors.green('+')} ${colors.bold(f.name)} ${colors.muted('(new function)')}`);
        }
        for (const f of comparison.removed.functions) {
            console.log(`  ${colors.red('-')} ${colors.bold(f.name)} ${colors.muted('(drop function)')}`);
        }
        for (const f of comparison.modified.functions) {
            console.log(`  ${colors.yellow('~')} ${colors.bold(f.name)} ${colors.muted(`(function: ${f.changes.join(', ')})`)}`);
        }
        for (const t of comparison.added.triggers) {
            console.log(`  ${colors.green('+')} ${colors.bold(t.name)} ${colors.muted('(new trigger)')}`);
        }
        for (const t of comparison.removed.triggers) {
            console.log(`  ${colors.red('-')} ${colors.bold(t.name)} ${colors.muted('(drop trigger)')}`);
        }
        for (const t of comparison.modified.triggers) {
            console.log(`  ${colors.yellow('~')} ${colors.bold(t.name)} ${colors.muted(`(trigger: ${t.changes.join(', ')})`)}`);
        }
        for (const ext of comparison.added.extensions) {
            console.log(`  ${colors.green('+')} ${colors.bold(ext)} ${colors.muted('(new extension)')}`);
        }
        for (const ext of comparison.removed.extensions) {
            console.log(`  ${colors.red('-')} ${colors.bold(ext)} ${colors.muted('(drop extension)')}`);
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
                warning('Destructive changes detected:');
                for (const item of destructiveItems) {
                    console.log(`   ${colors.red('-')} ${item}`);
                }
                console.log('');
                if (!force && !skipPrompt) {
                    const proceed = await p.confirm({
                        message: 'Include destructive changes?',
                        initialValue: false,
                    });
                    if (p.isCancel(proceed)) {
                        fatal('Operation cancelled by user');
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
        const fullMigration = generateMigrationFromComparison(comparison, { includeDown: true });
        const migrationName = generateMigrationNameFromComparison(comparison);
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
                tParts.push(colors.green(`${tablesAdded} added`));
            if (tableRenames)
                tParts.push(colors.cyan(`${tableRenames} renamed`));
            if (tablesModified)
                tParts.push(colors.yellow(`${tablesModified} modified`));
            if (tablesRemoved)
                tParts.push(colors.red(`${tablesRemoved} removed`));
            summaryLines.push(`   ${colors.muted('tables:')} ${tParts.join(', ')}`);
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
                cParts.push(colors.green(`${colsAdded} added`));
            if (colRenames)
                cParts.push(colors.cyan(`${colRenames} renamed`));
            if (colsModified)
                cParts.push(colors.yellow(`${colsModified} modified`));
            if (colsRemoved)
                cParts.push(colors.red(`${colsRemoved} removed`));
            summaryLines.push(`   ${colors.muted('columns:')} ${cParts.join(', ')}`);
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
                iParts.push(colors.green(`${idxAdded} added`));
            if (idxRenames)
                iParts.push(colors.cyan(`${idxRenames} renamed`));
            if (idxModified)
                iParts.push(colors.yellow(`${idxModified} modified`));
            if (idxRemoved)
                iParts.push(colors.red(`${idxRemoved} removed`));
            summaryLines.push(`   ${colors.muted('indexes:')} ${iParts.join(', ')}`);
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
                conParts.push(colors.green(`${conAdded} added`));
            if (conRenames)
                conParts.push(colors.cyan(`${conRenames} renamed`));
            if (conModified)
                conParts.push(colors.yellow(`${conModified} modified`));
            if (conRemoved)
                conParts.push(colors.red(`${conRemoved} removed`));
            summaryLines.push(`   ${colors.muted('constraints:')} ${conParts.join(', ')}`);
        }
        const enumsAdded = comparison.added.enums.length;
        const enumsRemoved = comparison.removed.enums.length;
        const enumsModified = comparison.modified.enums.length;
        const enumsRenamed = comparison.renamed.enums.length;
        if (enumsAdded || enumsRemoved || enumsModified || enumsRenamed) {
            const eParts = [];
            if (enumsAdded)
                eParts.push(colors.green(`${enumsAdded} added`));
            if (enumsRenamed)
                eParts.push(colors.cyan(`${enumsRenamed} renamed`));
            if (enumsModified)
                eParts.push(colors.yellow(`${enumsModified} modified`));
            if (enumsRemoved)
                eParts.push(colors.red(`${enumsRemoved} removed`));
            summaryLines.push(`   ${colors.muted('enums:')} ${eParts.join(', ')}`);
        }
        if (comparison.added.domains.length || comparison.removed.domains.length || comparison.modified.domains.length) {
            const dParts = [];
            if (comparison.added.domains.length)
                dParts.push(colors.green(`${comparison.added.domains.length} added`));
            if (comparison.modified.domains.length)
                dParts.push(colors.yellow(`${comparison.modified.domains.length} modified`));
            if (comparison.removed.domains.length)
                dParts.push(colors.red(`${comparison.removed.domains.length} removed`));
            summaryLines.push(`   ${colors.muted('domains:')} ${dParts.join(', ')}`);
        }
        if (comparison.added.sequences.length || comparison.removed.sequences.length || comparison.modified.sequences.length) {
            const sParts = [];
            if (comparison.added.sequences.length)
                sParts.push(colors.green(`${comparison.added.sequences.length} added`));
            if (comparison.modified.sequences.length)
                sParts.push(colors.yellow(`${comparison.modified.sequences.length} modified`));
            if (comparison.removed.sequences.length)
                sParts.push(colors.red(`${comparison.removed.sequences.length} removed`));
            summaryLines.push(`   ${colors.muted('sequences:')} ${sParts.join(', ')}`);
        }
        if (comparison.added.compositeTypes.length || comparison.removed.compositeTypes.length || comparison.modified.compositeTypes.length) {
            const ctParts = [];
            if (comparison.added.compositeTypes.length)
                ctParts.push(colors.green(`${comparison.added.compositeTypes.length} added`));
            if (comparison.modified.compositeTypes.length)
                ctParts.push(colors.yellow(`${comparison.modified.compositeTypes.length} modified`));
            if (comparison.removed.compositeTypes.length)
                ctParts.push(colors.red(`${comparison.removed.compositeTypes.length} removed`));
            summaryLines.push(`   ${colors.muted('types:')} ${ctParts.join(', ')}`);
        }
        if (comparison.added.views.length || comparison.removed.views.length || comparison.modified.views.length) {
            const vParts = [];
            if (comparison.added.views.length)
                vParts.push(colors.green(`${comparison.added.views.length} added`));
            if (comparison.modified.views.length)
                vParts.push(colors.yellow(`${comparison.modified.views.length} modified`));
            if (comparison.removed.views.length)
                vParts.push(colors.red(`${comparison.removed.views.length} removed`));
            summaryLines.push(`   ${colors.muted('views:')} ${vParts.join(', ')}`);
        }
        if (comparison.added.functions.length || comparison.removed.functions.length || comparison.modified.functions.length) {
            const fParts = [];
            if (comparison.added.functions.length)
                fParts.push(colors.green(`${comparison.added.functions.length} added`));
            if (comparison.modified.functions.length)
                fParts.push(colors.yellow(`${comparison.modified.functions.length} modified`));
            if (comparison.removed.functions.length)
                fParts.push(colors.red(`${comparison.removed.functions.length} removed`));
            summaryLines.push(`   ${colors.muted('functions:')} ${fParts.join(', ')}`);
        }
        if (comparison.added.triggers.length || comparison.removed.triggers.length || comparison.modified.triggers.length) {
            const trParts = [];
            if (comparison.added.triggers.length)
                trParts.push(colors.green(`${comparison.added.triggers.length} added`));
            if (comparison.modified.triggers.length)
                trParts.push(colors.yellow(`${comparison.modified.triggers.length} modified`));
            if (comparison.removed.triggers.length)
                trParts.push(colors.red(`${comparison.removed.triggers.length} removed`));
            summaryLines.push(`   ${colors.muted('triggers:')} ${trParts.join(', ')}`);
        }
        if (comparison.added.extensions.length || comparison.removed.extensions.length) {
            const exParts = [];
            if (comparison.added.extensions.length)
                exParts.push(colors.green(`${comparison.added.extensions.length} added`));
            if (comparison.removed.extensions.length)
                exParts.push(colors.red(`${comparison.removed.extensions.length} removed`));
            summaryLines.push(`   ${colors.muted('extensions:')} ${exParts.join(', ')}`);
        }
        if (summaryLines.length > 0) {
            for (const line of summaryLines)
                console.log(line);
            console.log('');
        }
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
            const formattedUp = formatMigrationStatements(upStatements);
            for (const line of formattedUp) {
                console.log(line);
            }
            if (downStatements.length > 0) {
                console.log('');
                if (full) {
                    console.log(`${colors.yellow('Rollback')} - SQL to revert:`);
                    console.log('');
                    const formattedDown = formatMigrationStatements(downStatements);
                    for (const line of formattedDown) {
                        console.log(line);
                    }
                }
                else {
                    console.log(`${colors.muted(`Rollback: ${downStatements.length} revert statement(s) will be saved`)}`);
                    console.log(`${colors.muted('Use')} ${colors.cyan('--full')} ${colors.muted('to include rollback SQL.')}`);
                }
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
                const tableDDL = await getMigrationTableDDL(config, tableName);
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
                const hash = generateTimestampedName(migrationName);
                await execClient.query(`INSERT INTO "${tableName}" (name, filename, hash, batch, sql_up, sql_down, source) ` +
                    `VALUES ($1, $2, $3, 0, $4, $5, 'push')`, [migrationName, '', hash, upSQL, downSQL]);
                spin.stop(`Applied ${statementsRun} statement(s) — restore point saved`);
            }
            catch (recordError) {
                spin.stop(`Applied ${statementsRun} statement(s)`);
                warning(`Failed to save restore point: ${recordError?.message || String(recordError)}`);
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
            if (tx) {
                errorMsg += `\n${colors.muted('All changes rolled back.')}\n`;
            }
            else {
                errorMsg += `\n${colors.yellow('Warning:')} ${statementsRun} statement(s) were already applied (no transaction support).\n`;
            }
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
        const typesFilePath = getTypesFilePath(schemaPath);
        try {
            spin.start('Syncing types to database...');
            const typesSync = await syncTypesToDb(connection, typesFilePath, schemaPath);
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
        console.log(`Push completed in ${formatDuration(duration)}`);
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
                finalParts.push(colors.green(`${totalAdded} added`));
            if (totalRenamed > 0)
                finalParts.push(colors.cyan(`${totalRenamed} renamed`));
            if (totalModified > 0)
                finalParts.push(colors.yellow(`${totalModified} modified`));
            if (totalRemoved > 0)
                finalParts.push(colors.red(`${totalRemoved} removed`));
        }
        else {
            finalParts.push('no changes');
        }
        console.log(`   ${finalParts.join(', ')}`);
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
        full: { type: 'boolean', description: 'Show all statements in dry run (including rollback)' },
        yes: { type: 'boolean', alias: 'y', description: 'Skip confirmation' },
    },
    async run({ args }) {
        const { config, projectRoot } = await buildContext();
        await requireValidConfig(config, { calledFrom: 'push' });
        await runPush(config, projectRoot, {
            force: args.force === true,
            dryRun: args['dry-run'] === true,
            full: args.full === true,
            skipPrompt: args.yes === true,
        });
    },
});
