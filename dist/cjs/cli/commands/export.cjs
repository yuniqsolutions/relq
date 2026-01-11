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
exports.exportCommand = exportCommand;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const schema_introspect_1 = require("../utils/schema-introspect.cjs");
const spinner_1 = require("../utils/spinner.cjs");
const repo_manager_1 = require("../utils/repo-manager.cjs");
const change_tracker_1 = require("../utils/change-tracker.cjs");
const sql_generator_1 = require("../utils/sql-generator.cjs");
const relqignore_1 = require("../utils/relqignore.cjs");
async function exportCommand(context) {
    const spinner = (0, spinner_1.createSpinner)();
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
    const spinner = (0, spinner_1.createSpinner)();
    if (!(0, repo_manager_1.isInitialized)(projectRoot)) {
        console.log(`${spinner_1.colors.red('error:')} relq not initialized`);
        console.log('');
        console.log(`${spinner_1.colors.muted('Run')} ${spinner_1.colors.cyan('relq init')} ${spinner_1.colors.muted('first, or use')} ${spinner_1.colors.cyan('relq import')} ${spinner_1.colors.muted('to import a schema.')}`);
        return;
    }
    spinner.start('Loading snapshot');
    const snapshot = (0, repo_manager_1.loadSnapshot)(projectRoot);
    if (!snapshot) {
        spinner.fail('No snapshot found');
        console.log('');
        console.log(`${spinner_1.colors.muted('Run')} ${spinner_1.colors.cyan('relq import <file.sql>')} ${spinner_1.colors.muted('to import a schema first.')}`);
        return;
    }
    spinner.succeed('Loaded snapshot');
    const cfg = config || {};
    const ignorePatterns = (0, relqignore_1.loadRelqignore)(projectRoot);
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
    console.log(spinner_1.colors.cyan('Schema Summary:'));
    console.log(`  ${spinner_1.colors.green('•')} Tables: ${schema.tables.length}`);
    console.log(`  ${spinner_1.colors.green('•')} Enums: ${schema.enums.length}`);
    console.log(`  ${spinner_1.colors.green('•')} Domains: ${schema.domains.length}`);
    console.log(`  ${spinner_1.colors.green('•')} Composite Types: ${schema.compositeTypes.length}`);
    console.log(`  ${spinner_1.colors.green('•')} Sequences: ${schema.sequences?.length || 0}`);
    console.log(`  ${spinner_1.colors.green('•')} Extensions: ${schema.extensions.length}`);
    if (filteredSnapshot.functions?.length) {
        console.log(`  ${spinner_1.colors.green('•')} Functions: ${filteredSnapshot.functions.length}`);
    }
    if (filteredSnapshot.triggers?.length) {
        console.log(`  ${spinner_1.colors.green('•')} Triggers: ${filteredSnapshot.triggers.length}`);
    }
    if (ignoredCount > 0) {
        console.log(`  ${spinner_1.colors.muted(`${ignoredCount} object(s) filtered by .relqignore`)}`);
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
    console.log(`  Source: ${spinner_1.colors.muted('snapshot (local)')}`);
    console.log(`  Output: ${spinner_1.colors.muted(options.output || '')}`);
}
async function exportFromDatabase(context, absoluteOutputPath, options) {
    const spinner = (0, spinner_1.createSpinner)();
    if (!context.config || !context.config.connection) {
        console.error(spinner_1.colors.red('Error: No database connection configured'));
        return;
    }
    try {
        spinner.start('Introspecting database schema');
        const schema = await (0, schema_introspect_1.introspectDatabase)(context.config.connection, undefined, {
            includeFunctions: options.includeFunctions,
            includeTriggers: options.includeTriggers,
        });
        spinner.succeed(`Introspected ${schema.tables.length} tables, ${schema.enums.length} enums`);
        console.log('');
        console.log(spinner_1.colors.cyan('Schema Summary:'));
        console.log(`  ${spinner_1.colors.green('•')} Tables: ${schema.tables.length}`);
        console.log(`  ${spinner_1.colors.green('•')} Enums: ${schema.enums.length}`);
        console.log(`  ${spinner_1.colors.green('•')} Domains: ${schema.domains.length}`);
        console.log(`  ${spinner_1.colors.green('•')} Composite Types: ${schema.compositeTypes.length}`);
        console.log(`  ${spinner_1.colors.green('•')} Extensions: ${schema.extensions.length}`);
        if (options.includeFunctions) {
            console.log(`  ${spinner_1.colors.green('•')} Functions: ${schema.functions.length}`);
        }
        if (options.includeTriggers) {
            console.log(`  ${spinner_1.colors.green('•')} Triggers: ${schema.triggers.length}`);
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
        console.log(`  Source: ${spinner_1.colors.muted('database (live)')}`);
        console.log(`  Output: ${spinner_1.colors.muted(options.output || '')}`);
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
    if (!(0, repo_manager_1.isInitialized)(projectRoot)) {
        console.log(`${spinner_1.colors.red('error:')} relq not initialized`);
        console.log('');
        console.log(`${spinner_1.colors.muted('Run')} ${spinner_1.colors.cyan('relq init')} ${spinner_1.colors.muted('first.')}`);
        return;
    }
    let changes;
    let modeLabel;
    if (stagedOnly) {
        changes = (0, repo_manager_1.getStagedChanges)(projectRoot);
        modeLabel = 'staged';
    }
    else {
        const staged = (0, repo_manager_1.getStagedChanges)(projectRoot);
        const unstaged = (0, repo_manager_1.getUnstagedChanges)(projectRoot);
        changes = [...staged, ...unstaged];
        modeLabel = 'uncommitted';
    }
    if (changes.length === 0) {
        (0, spinner_1.warning)(`No ${modeLabel} changes to export`);
        console.log('');
        if (stagedOnly) {
            console.log(`${spinner_1.colors.muted('Run')} ${spinner_1.colors.cyan('relq add .')} ${spinner_1.colors.muted('to stage changes.')}`);
        }
        else {
            console.log(`${spinner_1.colors.muted('Run')} ${spinner_1.colors.cyan('relq pull')} ${spinner_1.colors.muted('or')} ${spinner_1.colors.cyan('relq import')} ${spinner_1.colors.muted('to detect changes.')}`);
        }
        return;
    }
    const outputPath = flags.output || args[0] || `./${modeLabel}-changes.sql`;
    const absoluteOutputPath = path.resolve(outputPath);
    console.log(`${spinner_1.colors.cyan(`Exporting ${modeLabel} changes:`)} ${changes.length}`);
    console.log('');
    for (const change of changes) {
        const display = (0, change_tracker_1.getChangeDisplayName)(change);
        const color = change.type === 'CREATE' ? spinner_1.colors.green :
            change.type === 'DROP' ? spinner_1.colors.red :
                spinner_1.colors.yellow;
        console.log(`   ${color(display)}`);
    }
    console.log('');
    const sortedChanges = (0, change_tracker_1.sortChangesByDependency)(changes);
    const sqlContent = (0, change_tracker_1.generateCombinedSQL)(sortedChanges);
    const outputDir = path.dirname(absoluteOutputPath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(absoluteOutputPath, sqlContent, 'utf-8');
    console.log(`Exported ${changes.length} ${modeLabel} change(s) to ${outputPath}`);
    console.log(`${spinner_1.colors.muted(`${(sqlContent.length / 1024).toFixed(1)} KB`)}`);
    console.log('');
}
function generateFullSQL(schema, options) {
    const header = `-- PostgreSQL Database Schema Export\n-- Generated: ${new Date().toISOString()}\n-- Relq CLI`;
    return (0, sql_generator_1.generateFullSchemaSQL)(schema, {
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
        .filter(table => !(0, relqignore_1.isTableIgnored)(table.name, patterns).ignored)
        .map(table => ({
        ...table,
        columns: table.columns.filter(col => !(0, relqignore_1.isColumnIgnored)(table.name, col.name, patterns).ignored),
        indexes: table.indexes.filter(idx => !(0, relqignore_1.isIndexIgnored)(table.name, idx.name, patterns).ignored),
        constraints: table.constraints?.filter(con => !(0, relqignore_1.isConstraintIgnored)(table.name, con.name, patterns).ignored) || [],
    }));
    const filteredEnums = schema.enums.filter(e => !(0, relqignore_1.isEnumIgnored)(e.name, patterns).ignored);
    const filteredDomains = schema.domains.filter(d => !(0, relqignore_1.isDomainIgnored)(d.name, patterns).ignored);
    const filteredCompositeTypes = schema.compositeTypes.filter(c => !(0, relqignore_1.isCompositeTypeIgnored)(c.name, patterns).ignored);
    const filteredSequences = schema.sequences.filter(s => !(0, relqignore_1.isSequenceIgnored)(s.name, patterns).ignored);
    const filteredFunctions = options.includeFunctions
        ? (schema.functions || []).filter(f => !(0, relqignore_1.isFunctionIgnored)(f.name, patterns).ignored)
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
exports.default = exportCommand;
