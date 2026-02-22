import { defineCommand } from 'citty';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as p from '@clack/prompts';
import { buildContext } from "../utils/context.js";
import { colors } from "../utils/colors.js";
import { fatal, formatError } from "../utils/ui.js";
import { formatBytes } from "../utils/format.js";
import { dialectIntrospect } from "../utils/dialect-introspect.js";
import { isInitialized, loadSnapshot, } from "../utils/repo-manager.js";
import { generateFullSchemaSQL } from "../utils/sql-generator.js";
import { loadRelqignore, isTableIgnored, isColumnIgnored, isIndexIgnored, isConstraintIgnored, isEnumIgnored, isDomainIgnored, isSequenceIgnored, isCompositeTypeIgnored, isFunctionIgnored, } from "../utils/relqignore.js";
import { getConnectionDescription } from "../utils/env-loader.js";
async function exportFromSnapshot(projectRoot, absoluteOutputPath, options, config) {
    const spin = p.spinner();
    if (!isInitialized(projectRoot)) {
        fatal('not a relq repository', `Run ${colors.cyan('relq init')} first, or use ${colors.cyan('relq pull')} to sync.`);
    }
    spin.start('Loading snapshot');
    const snapshot = loadSnapshot(projectRoot);
    if (!snapshot) {
        spin.error('No snapshot found');
        console.log('');
        console.log(`${colors.muted('Run')} ${colors.cyan('relq pull')} ${colors.muted('to sync with database first.')}`);
        return;
    }
    spin.stop('Loaded snapshot');
    const ignorePatterns = loadRelqignore(projectRoot);
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
    console.log(colors.cyan('Schema Summary:'));
    console.log(`  ${colors.green('•')} Tables: ${schema.tables.length}`);
    console.log(`  ${colors.green('•')} Enums: ${schema.enums.length}`);
    if (schema.domains.length > 0)
        console.log(`  ${colors.green('•')} Domains: ${schema.domains.length}`);
    if (schema.compositeTypes.length > 0)
        console.log(`  ${colors.green('•')} Composite Types: ${schema.compositeTypes.length}`);
    if ((schema.sequences?.length || 0) > 0)
        console.log(`  ${colors.green('•')} Sequences: ${schema.sequences?.length}`);
    if (schema.extensions.length > 0)
        console.log(`  ${colors.green('•')} Extensions: ${schema.extensions.length}`);
    if ((filteredSnapshot.functions?.length || 0) > 0)
        console.log(`  ${colors.green('•')} Functions: ${filteredSnapshot.functions.length}`);
    if ((filteredSnapshot.triggers?.length || 0) > 0)
        console.log(`  ${colors.green('•')} Triggers: ${filteredSnapshot.triggers.length}`);
    if (ignoredCount > 0)
        console.log(`  ${colors.muted(`${ignoredCount} object(s) filtered by .relqignore`)}`);
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
    console.log(`  Source: ${colors.muted('snapshot (local)')}`);
    console.log(`  Output: ${colors.muted(options.output || '')} ${colors.muted(`(${formatBytes(sqlContent.length)})`)}`);
    console.log('');
}
async function exportFromDatabase(config, absoluteOutputPath, options) {
    const spin = p.spinner();
    if (!config || !config.connection) {
        fatal('No database connection configured');
    }
    try {
        spin.start(`Introspecting ${getConnectionDescription(config.connection)}...`);
        const schema = await dialectIntrospect(config, {
            includeFunctions: options.includeFunctions,
            includeTriggers: options.includeTriggers,
        });
        spin.stop(`Introspected ${schema.tables.length} tables, ${schema.enums?.length || 0} enums`);
        console.log('');
        console.log(colors.cyan('Schema Summary:'));
        console.log(`  ${colors.green('•')} Tables: ${schema.tables.length}`);
        console.log(`  ${colors.green('•')} Enums: ${schema.enums.length}`);
        if (schema.domains.length > 0)
            console.log(`  ${colors.green('•')} Domains: ${schema.domains.length}`);
        if (schema.compositeTypes.length > 0)
            console.log(`  ${colors.green('•')} Composite Types: ${schema.compositeTypes.length}`);
        if (schema.extensions.length > 0)
            console.log(`  ${colors.green('•')} Extensions: ${schema.extensions.length}`);
        if (options.includeFunctions)
            console.log(`  ${colors.green('•')} Functions: ${schema.functions.length}`);
        if (options.includeTriggers)
            console.log(`  ${colors.green('•')} Triggers: ${schema.triggers.length}`);
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
        console.log(`  Source: ${colors.muted('database (live)')}`);
        console.log(`  Output: ${colors.muted(options.output || '')} ${colors.muted(`(${formatBytes(sqlContent.length)})`)}`);
        console.log('');
    }
    catch (error) {
        spin.error('Export failed');
        fatal(formatError(error));
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
export default defineCommand({
    meta: { name: 'export', description: 'Export schema to SQL file' },
    args: {
        output: { type: 'string', alias: 'o', description: 'Output file path' },
        db: { type: 'boolean', description: 'Export from live database' },
        'include-functions': { type: 'boolean', description: 'Include functions' },
        'include-triggers': { type: 'boolean', description: 'Include triggers' },
    },
    async run({ args }) {
        const { config, projectRoot } = await buildContext();
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
