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
const dialect_introspect_1 = require("../utils/dialect-introspect.cjs");
const repo_manager_1 = require("../utils/repo-manager.cjs");
const sql_generator_1 = require("../utils/sql-generator.cjs");
const relqignore_1 = require("../utils/relqignore.cjs");
const env_loader_1 = require("../utils/env-loader.cjs");
async function exportFromSnapshot(projectRoot, absoluteOutputPath, options, config) {
    const spin = p.spinner();
    if (!(0, repo_manager_1.isInitialized)(projectRoot)) {
        (0, ui_1.fatal)('not a relq repository', `Run ${colors_1.colors.cyan('relq init')} first, or use ${colors_1.colors.cyan('relq pull')} to sync.`);
    }
    spin.start('Loading snapshot');
    const snapshot = (0, repo_manager_1.loadSnapshot)(projectRoot);
    if (!snapshot) {
        spin.error('No snapshot found');
        console.log('');
        console.log(`${colors_1.colors.muted('Run')} ${colors_1.colors.cyan('relq pull')} ${colors_1.colors.muted('to sync with database first.')}`);
        return;
    }
    spin.stop('Loaded snapshot');
    const ignorePatterns = (0, relqignore_1.loadRelqignore)(projectRoot);
    const cfg = config || {};
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
    console.log(colors_1.colors.cyan('Schema Summary:'));
    console.log(`  ${colors_1.colors.green('•')} Tables: ${schema.tables.length}`);
    console.log(`  ${colors_1.colors.green('•')} Enums: ${schema.enums.length}`);
    if (schema.domains.length > 0)
        console.log(`  ${colors_1.colors.green('•')} Domains: ${schema.domains.length}`);
    if (schema.compositeTypes.length > 0)
        console.log(`  ${colors_1.colors.green('•')} Composite Types: ${schema.compositeTypes.length}`);
    if ((schema.sequences?.length || 0) > 0)
        console.log(`  ${colors_1.colors.green('•')} Sequences: ${schema.sequences?.length}`);
    if (schema.extensions.length > 0)
        console.log(`  ${colors_1.colors.green('•')} Extensions: ${schema.extensions.length}`);
    if ((filteredSnapshot.functions?.length || 0) > 0)
        console.log(`  ${colors_1.colors.green('•')} Functions: ${filteredSnapshot.functions.length}`);
    if ((filteredSnapshot.triggers?.length || 0) > 0)
        console.log(`  ${colors_1.colors.green('•')} Triggers: ${filteredSnapshot.triggers.length}`);
    if (ignoredCount > 0)
        console.log(`  ${colors_1.colors.muted(`${ignoredCount} object(s) filtered by .relqignore`)}`);
    spin.start('Generating SQL');
    const sqlContent = generateFullSQL(schema, options);
    spin.stop('Generated SQL');
    const outputDir = path.dirname(absoluteOutputPath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(absoluteOutputPath, sqlContent, 'utf-8');
    console.log('');
    console.log(`Export completed`);
    console.log(`  Source: ${colors_1.colors.muted('snapshot (local)')}`);
    console.log(`  Output: ${colors_1.colors.muted(options.output || '')} ${colors_1.colors.muted(`(${(0, format_1.formatBytes)(sqlContent.length)})`)}`);
    console.log('');
}
async function exportFromDatabase(config, absoluteOutputPath, options) {
    const spin = p.spinner();
    if (!config || !config.connection) {
        (0, ui_1.fatal)('No database connection configured');
    }
    try {
        spin.start(`Introspecting ${(0, env_loader_1.getConnectionDescription)(config.connection)}...`);
        const schema = await (0, dialect_introspect_1.dialectIntrospect)(config, {
            includeFunctions: options.includeFunctions,
            includeTriggers: options.includeTriggers,
        });
        spin.stop(`Introspected ${schema.tables.length} tables, ${schema.enums?.length || 0} enums`);
        console.log('');
        console.log(colors_1.colors.cyan('Schema Summary:'));
        console.log(`  ${colors_1.colors.green('•')} Tables: ${schema.tables.length}`);
        console.log(`  ${colors_1.colors.green('•')} Enums: ${schema.enums.length}`);
        if (schema.domains.length > 0)
            console.log(`  ${colors_1.colors.green('•')} Domains: ${schema.domains.length}`);
        if (schema.compositeTypes.length > 0)
            console.log(`  ${colors_1.colors.green('•')} Composite Types: ${schema.compositeTypes.length}`);
        if (schema.extensions.length > 0)
            console.log(`  ${colors_1.colors.green('•')} Extensions: ${schema.extensions.length}`);
        if (options.includeFunctions)
            console.log(`  ${colors_1.colors.green('•')} Functions: ${schema.functions.length}`);
        if (options.includeTriggers)
            console.log(`  ${colors_1.colors.green('•')} Triggers: ${schema.triggers.length}`);
        spin.start('Generating SQL');
        const sqlContent = generateFullSQL(schema, options);
        spin.stop('Generated SQL');
        const outputDir = path.dirname(absoluteOutputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        fs.writeFileSync(absoluteOutputPath, sqlContent, 'utf-8');
        console.log('');
        console.log(`Export completed`);
        console.log(`  Source: ${colors_1.colors.muted('database (live)')}`);
        console.log(`  Output: ${colors_1.colors.muted(options.output || '')} ${colors_1.colors.muted(`(${(0, format_1.formatBytes)(sqlContent.length)})`)}`);
        console.log('');
    }
    catch (error) {
        spin.error('Export failed');
        (0, ui_1.fatal)((0, ui_1.formatError)(error));
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
        enums: normalized.enums.map(e => ({ name: e.name, values: e.values })),
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
        partitions: normalized.tables.flatMap(t => (t.partitions || []).map(part => ({
            name: part.name,
            parentTable: t.name,
            partitionBound: part.bound || '',
            partitionType: (part.boundType || t.partitionType || 'LIST'),
            partitionKey: t.partitionKey || [],
        }))),
        policies: [],
        foreignServers: [],
        foreignTables: [],
    };
}
function generateFullSQL(schema, options) {
    const header = `-- Database Schema Export\n-- Generated: ${new Date().toISOString()}\n-- Relq CLI`;
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
    const filteredTriggers = options.includeTriggers ? schema.triggers || [] : [];
    const filteredViews = options.includeViews ? schema.views || [] : [];
    const filteredMaterializedViews = options.includeViews ? schema.materializedViews || [] : [];
    const filteredForeignTables = options.includeFDW ? schema.foreignTables || [] : [];
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
exports.default = (0, citty_1.defineCommand)({
    meta: { name: 'export', description: 'Export schema to SQL file' },
    args: {
        output: { type: 'string', alias: 'o', description: 'Output file path' },
        db: { type: 'boolean', description: 'Export from live database' },
        'include-functions': { type: 'boolean', description: 'Include functions' },
        'include-triggers': { type: 'boolean', description: 'Include triggers' },
    },
    async run({ args }) {
        const { config, projectRoot } = await (0, context_1.buildContext)();
        const outputPath = args.output || './schema-export.sql';
        const absoluteOutputPath = path.resolve(outputPath);
        const options = {
            output: outputPath,
            includeFunctions: args['include-functions'] === true,
            includeTriggers: args['include-triggers'] === true,
            fromDb: args.db === true,
        };
        console.log('');
        if (options.fromDb) {
            return exportFromDatabase(config, absoluteOutputPath, options);
        }
        return exportFromSnapshot(projectRoot, absoluteOutputPath, options, config);
    },
});
