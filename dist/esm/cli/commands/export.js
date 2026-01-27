import * as fs from 'fs';
import * as path from 'path';
import { introspectDatabase } from "../utils/schema-introspect.js";
import { createSpinner, colors, warning } from "../utils/spinner.js";
import { isInitialized, getStagedChanges, getUnstagedChanges, loadSnapshot, } from "../utils/repo-manager.js";
import { generateCombinedSQL, sortChangesByDependency, getChangeDisplayName, } from "../utils/change-tracker.js";
import { generateFullSchemaSQL } from "../utils/sql-generator.js";
import { loadRelqignore, isTableIgnored, isColumnIgnored, isIndexIgnored, isConstraintIgnored, isEnumIgnored, isDomainIgnored, isSequenceIgnored, isCompositeTypeIgnored, isFunctionIgnored, } from "../utils/relqignore.js";
export async function exportCommand(context) {
    const spinner = createSpinner();
    const { args, flags, projectRoot } = context;
    const changesOnly = Boolean(flags['changes']);
    const stagedOnly = Boolean(flags['staged']);
    const fromDb = Boolean(flags['db']);
    if (changesOnly || stagedOnly) {
        return exportChanges(projectRoot, flags, args, stagedOnly);
    }
    const outputPath = flags.output || args[0] || './schema-export.sql';
    const absoluteOutputPath = path.resolve(outputPath);
    const options = {
        output: outputPath,
        includeData: Boolean(flags['include-data']),
        includeFunctions: Boolean(flags['include-functions']),
        includeTriggers: Boolean(flags['include-triggers']),
        fromDb,
    };
    if (fromDb) {
        return exportFromDatabase(context, absoluteOutputPath, options);
    }
    return exportFromSnapshot(projectRoot, absoluteOutputPath, options, context.config ?? undefined);
}
async function exportFromSnapshot(projectRoot, absoluteOutputPath, options, config) {
    const spinner = createSpinner();
    if (!isInitialized(projectRoot)) {
        console.log(`${colors.red('error:')} relq not initialized`);
        console.log('');
        console.log(`${colors.muted('Run')} ${colors.cyan('relq init')} ${colors.muted('first, or use')} ${colors.cyan('relq import')} ${colors.muted('to import a schema.')}`);
        return;
    }
    spinner.start('Loading snapshot');
    const snapshot = loadSnapshot(projectRoot);
    if (!snapshot) {
        spinner.fail('No snapshot found');
        console.log('');
        console.log(`${colors.muted('Run')} ${colors.cyan('relq import <file.sql>')} ${colors.muted('to import a schema first.')}`);
        return;
    }
    spinner.succeed('Loaded snapshot');
    const cfg = config || {};
    const ignorePatterns = loadRelqignore(projectRoot);
    const filteredSnapshot = filterNormalizedSchema(snapshot, ignorePatterns, {
        includeFunctions: cfg.includeFunctions ?? options.includeFunctions ?? true,
        includeTriggers: cfg.includeTriggers ?? options.includeTriggers ?? true,
        includeViews: cfg.includeViews ?? false,
        includeFDW: cfg.includeFDW ?? false,
    });
    const schema = normalizedToDbSchema(filteredSnapshot);
    const ignoredCount = (snapshot.tables.length - filteredSnapshot.tables.length) +
        (snapshot.enums.length - filteredSnapshot.enums.length) +
        ((snapshot.functions?.length || 0) - (filteredSnapshot.functions?.length || 0));
    console.log('');
    console.log(colors.cyan('Schema Summary:'));
    console.log(`  ${colors.green('•')} Tables: ${schema.tables.length}`);
    console.log(`  ${colors.green('•')} Enums: ${schema.enums.length}`);
    console.log(`  ${colors.green('•')} Domains: ${schema.domains.length}`);
    console.log(`  ${colors.green('•')} Composite Types: ${schema.compositeTypes.length}`);
    console.log(`  ${colors.green('•')} Sequences: ${schema.sequences?.length || 0}`);
    console.log(`  ${colors.green('•')} Extensions: ${schema.extensions.length}`);
    if (filteredSnapshot.functions?.length) {
        console.log(`  ${colors.green('•')} Functions: ${filteredSnapshot.functions.length}`);
    }
    if (filteredSnapshot.triggers?.length) {
        console.log(`  ${colors.green('•')} Triggers: ${filteredSnapshot.triggers.length}`);
    }
    if (ignoredCount > 0) {
        console.log(`  ${colors.muted(`${ignoredCount} object(s) filtered by .relqignore`)}`);
    }
    spinner.start('Generating SQL statements');
    const exportOptions = {
        ...options,
        includeFunctions: cfg.includeFunctions ?? options.includeFunctions ?? true,
        includeTriggers: cfg.includeTriggers ?? options.includeTriggers ?? true,
    };
    const sqlContent = generateFullSQL(schema, exportOptions);
    spinner.succeed('Generated SQL statements');
    const outputDir = path.dirname(absoluteOutputPath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(absoluteOutputPath, sqlContent, 'utf-8');
    spinner.succeed(`Written ${options.output} (${(sqlContent.length / 1024).toFixed(1)} KB)`);
    console.log('');
    console.log('Export completed');
    console.log(`  Source: ${colors.muted('snapshot (local)')}`);
    console.log(`  Output: ${colors.muted(options.output || '')}`);
}
async function exportFromDatabase(context, absoluteOutputPath, options) {
    const spinner = createSpinner();
    if (!context.config || !context.config.connection) {
        console.error(colors.red('Error: No database connection configured'));
        return;
    }
    try {
        spinner.start('Introspecting database schema');
        const schema = await introspectDatabase(context.config.connection, undefined, {
            includeFunctions: options.includeFunctions,
            includeTriggers: options.includeTriggers,
        });
        spinner.succeed(`Introspected ${schema.tables.length} tables, ${schema.enums.length} enums`);
        console.log('');
        console.log(colors.cyan('Schema Summary:'));
        console.log(`  ${colors.green('•')} Tables: ${schema.tables.length}`);
        console.log(`  ${colors.green('•')} Enums: ${schema.enums.length}`);
        console.log(`  ${colors.green('•')} Domains: ${schema.domains.length}`);
        console.log(`  ${colors.green('•')} Composite Types: ${schema.compositeTypes.length}`);
        console.log(`  ${colors.green('•')} Extensions: ${schema.extensions.length}`);
        if (options.includeFunctions) {
            console.log(`  ${colors.green('•')} Functions: ${schema.functions.length}`);
        }
        if (options.includeTriggers) {
            console.log(`  ${colors.green('•')} Triggers: ${schema.triggers.length}`);
        }
        spinner.start('Generating SQL statements');
        const sqlContent = generateFullSQL(schema, options);
        spinner.succeed('Generated SQL statements');
        const outputDir = path.dirname(absoluteOutputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        fs.writeFileSync(absoluteOutputPath, sqlContent, 'utf-8');
        spinner.succeed(`Written ${options.output} (${(sqlContent.length / 1024).toFixed(1)} KB)`);
        console.log('');
        console.log('Export completed');
        console.log(`  Source: ${colors.muted('database (live)')}`);
        console.log(`  Output: ${colors.muted(options.output || '')}`);
    }
    catch (error) {
        spinner.fail('Export failed');
        throw error;
    }
}
function normalizedToDbSchema(normalized) {
    return {
        tables: normalized.tables.map(t => ({
            name: t.name,
            schema: t.schema,
            columns: t.columns.map(c => ({
                name: c.name,
                dataType: c.type,
                isNullable: c.nullable,
                defaultValue: c.default,
                isPrimaryKey: c.primaryKey,
                isUnique: c.unique,
                maxLength: c.maxLength ?? null,
                precision: c.precision ?? null,
                scale: c.scale ?? null,
                check: c.check ?? undefined,
                comment: c.comment ?? undefined,
                isGenerated: c.isGenerated || false,
                generationExpression: c.generationExpression ?? null,
                identityGeneration: c.identity?.type ?? null,
            })),
            indexes: t.indexes.map(i => ({
                name: i.name,
                columns: i.columns,
                isUnique: i.unique,
                isPrimary: i.isPrimary || false,
                type: i.type || 'btree',
                definition: i.definition,
                whereClause: i.whereClause ?? null,
                expression: i.columnDefs?.find(cd => cd.expression)?.expression ?? null,
                comment: i.comment ?? null,
            })),
            constraints: t.constraints.map(c => ({
                name: c.name,
                type: c.type,
                columns: c.columns || [],
                definition: c.definition || '',
                referencedTable: c.referencedTable,
                referencedColumns: c.referencedColumns,
                checkExpression: c.checkExpression,
            })),
            rowCount: 0,
            isPartitioned: t.isPartitioned || t.partitionType !== undefined,
            partitionType: t.partitionType,
            partitionKey: t.partitionKey,
            comment: t.comment ?? null,
        })),
        enums: normalized.enums.map(e => ({
            name: e.name,
            values: e.values,
        })),
        domains: normalized.domains.map(d => ({
            name: d.name,
            baseType: d.baseType,
            isNotNull: d.notNull,
            defaultValue: d.default,
            checkExpression: d.check,
        })),
        compositeTypes: normalized.compositeTypes.map(c => ({
            name: c.name,
            attributes: c.attributes,
        })),
        sequences: normalized.sequences.map(s => ({
            name: s.name,
            dataType: s.dataType,
            start: s.startValue,
            increment: s.increment,
            minValue: s.minValue,
            maxValue: s.maxValue,
            cache: s.cache,
            cycle: s.cycle,
            ownedBy: s.ownedBy || undefined,
        })),
        collations: [],
        extensions: normalized.extensions.map(e => e.name),
        functions: (normalized.functions || []).map(f => ({
            name: f.name,
            schema: f.schema || 'public',
            returnType: f.returnType,
            argTypes: f.argTypes || [],
            language: f.language,
            definition: f.body || '',
            isAggregate: false,
            volatility: f.volatility || 'VOLATILE',
        })),
        triggers: (normalized.triggers || []).map(t => ({
            name: t.name,
            tableName: t.table,
            event: t.events.join(' OR '),
            timing: t.timing,
            forEach: t.forEach || 'ROW',
            functionName: t.functionName,
            definition: '',
            isEnabled: t.isEnabled !== false,
        })),
        partitions: normalized.tables.flatMap(t => (t.partitions || []).map(p => ({
            name: p.name,
            parentTable: t.name,
            partitionBound: p.bound || '',
            partitionType: (p.boundType || t.partitionType || 'LIST'),
            partitionKey: t.partitionKey || [],
        }))),
        policies: [],
        foreignServers: [],
        foreignTables: [],
    };
}
async function exportChanges(projectRoot, flags, args, stagedOnly) {
    console.log('');
    if (!isInitialized(projectRoot)) {
        console.log(`${colors.red('error:')} relq not initialized`);
        console.log('');
        console.log(`${colors.muted('Run')} ${colors.cyan('relq init')} ${colors.muted('first.')}`);
        return;
    }
    let changes;
    let modeLabel;
    if (stagedOnly) {
        changes = getStagedChanges(projectRoot);
        modeLabel = 'staged';
    }
    else {
        const staged = getStagedChanges(projectRoot);
        const unstaged = getUnstagedChanges(projectRoot);
        changes = [...staged, ...unstaged];
        modeLabel = 'uncommitted';
    }
    if (changes.length === 0) {
        warning(`No ${modeLabel} changes to export`);
        console.log('');
        if (stagedOnly) {
            console.log(`${colors.muted('Run')} ${colors.cyan('relq add .')} ${colors.muted('to stage changes.')}`);
        }
        else {
            console.log(`${colors.muted('Run')} ${colors.cyan('relq pull')} ${colors.muted('or')} ${colors.cyan('relq import')} ${colors.muted('to detect changes.')}`);
        }
        return;
    }
    const outputPath = flags.output || args[0] || `./${modeLabel}-changes.sql`;
    const absoluteOutputPath = path.resolve(outputPath);
    console.log(`${colors.cyan(`Exporting ${modeLabel} changes:`)} ${changes.length}`);
    console.log('');
    for (const change of changes) {
        const display = getChangeDisplayName(change);
        const color = change.type === 'CREATE' ? colors.green :
            change.type === 'DROP' ? colors.red :
                colors.yellow;
        console.log(`   ${color(display)}`);
    }
    console.log('');
    const sortedChanges = sortChangesByDependency(changes);
    const sqlContent = generateCombinedSQL(sortedChanges);
    const outputDir = path.dirname(absoluteOutputPath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(absoluteOutputPath, sqlContent, 'utf-8');
    console.log(`Exported ${changes.length} ${modeLabel} change(s) to ${outputPath}`);
    console.log(`${colors.muted(`${(sqlContent.length / 1024).toFixed(1)} KB`)}`);
    console.log('');
}
function generateFullSQL(schema, options) {
    const header = `-- PostgreSQL Database Schema Export\n-- Generated: ${new Date().toISOString()}\n-- Relq CLI`;
    return generateFullSchemaSQL(schema, {
        includeExtensions: true,
        includeEnums: true,
        includeDomains: true,
        includeCompositeTypes: true,
        includeSequences: true,
        includeTables: true,
        includePartitions: true,
        includeIndexes: true,
        includeConstraints: true,
        includeFunctions: options.includeFunctions,
        includeTriggers: options.includeTriggers,
        headerComment: header,
    });
}
function filterNormalizedSchema(schema, patterns, options) {
    const filteredTables = schema.tables
        .filter(table => !isTableIgnored(table.name, patterns).ignored)
        .map(table => ({
        ...table,
        columns: table.columns.filter(col => !isColumnIgnored(table.name, col.name, patterns).ignored),
        indexes: table.indexes.filter(idx => !isIndexIgnored(table.name, idx.name, patterns).ignored),
        constraints: table.constraints?.filter(con => !isConstraintIgnored(table.name, con.name, patterns).ignored) || [],
    }));
    const filteredEnums = schema.enums.filter(e => !isEnumIgnored(e.name, patterns).ignored);
    const filteredDomains = schema.domains.filter(d => !isDomainIgnored(d.name, patterns).ignored);
    const filteredCompositeTypes = schema.compositeTypes.filter(c => !isCompositeTypeIgnored(c.name, patterns).ignored);
    const filteredSequences = schema.sequences.filter(s => !isSequenceIgnored(s.name, patterns).ignored);
    const filteredFunctions = options.includeFunctions
        ? (schema.functions || []).filter(f => !isFunctionIgnored(f.name, patterns).ignored)
        : [];
    const filteredTriggers = options.includeTriggers
        ? schema.triggers || []
        : [];
    const filteredViews = options.includeViews
        ? schema.views || []
        : [];
    const filteredMaterializedViews = options.includeViews
        ? schema.materializedViews || []
        : [];
    const filteredForeignTables = options.includeFDW
        ? schema.foreignTables || []
        : [];
    return {
        extensions: schema.extensions,
        enums: filteredEnums,
        domains: filteredDomains,
        compositeTypes: filteredCompositeTypes,
        sequences: filteredSequences,
        collations: schema.collations,
        tables: filteredTables,
        functions: filteredFunctions,
        triggers: filteredTriggers,
        views: filteredViews,
        materializedViews: filteredMaterializedViews,
        foreignTables: filteredForeignTables,
    };
}
export default exportCommand;
