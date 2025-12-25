import * as fs from 'fs';
import * as path from 'path';
import { parseSqlFile, parseFunctions, parseTriggers, parseComments } from "../utils/sql-parser.js";
import { generateTypeScript } from "../utils/type-generator.js";
import { saveSnapshot, loadSnapshot, isInitialized, initRepository, stageChanges, addUnstagedChanges } from "../utils/repo-manager.js";
import { compareSchemas } from "../utils/schema-comparator.js";
import { getChangeDisplayName } from "../utils/change-tracker.js";
import { loadRelqignore, validateIgnoreDependencies, isTableIgnored, isColumnIgnored, isIndexIgnored, isConstraintIgnored, isEnumIgnored, isDomainIgnored, isSequenceIgnored, isCompositeTypeIgnored, isFunctionIgnored, } from "../utils/relqignore.js";
import { colors, fatal, warning, hint, getWorkingTreeStatus, printDirtyWorkingTreeError, printMergeStrategyHelp, readSQLFile, createSpinner, formatBytes, } from "../utils/git-utils.js";
export async function importCommand(sqlFilePath, options = {}, projectRoot = process.cwd()) {
    const { includeFunctions = false, includeTriggers = false, force = false, dryRun = false } = options;
    const spinner = createSpinner();
    console.log('');
    if (!sqlFilePath) {
        fatal('No SQL file specified', 'usage: relq import <sql-file> [options]\n\n' +
            'Options:\n' +
            '    --output <path>       Output schema file path\n' +
            '    --force               Force import, overwrite local changes\n' +
            '    --dry-run             Preview changes without applying\n' +
            '    --theirs              Accept all incoming changes\n' +
            '    --ours                Keep all local changes (reject incoming)\n' +
            '    --abort               Abort the import operation\n' +
            '    --include-functions   Include functions in import\n' +
            '    --include-triggers    Include triggers in import');
        return;
    }
    if (options.abort) {
        console.log('Aborting import...');
        hint('Working tree has been restored.');
        process.exit(0);
    }
    let mergeStrategy = 'merge';
    if (options.theirs || force) {
        mergeStrategy = 'theirs';
    }
    else if (options.ours) {
        mergeStrategy = 'ours';
    }
    const sqlResult = readSQLFile(sqlFilePath);
    if ('error' in sqlResult) {
        fatal(sqlResult.error);
    }
    const { content: sqlContent, validation } = sqlResult;
    for (const warn of validation.warnings) {
        warning(warn);
    }
    if (!validation.valid) {
        fatal('Invalid PostgreSQL SQL file', validation.errors.join('\n  - '));
        return;
    }
    console.log(`Importing ${colors.cyan(path.basename(sqlFilePath))} ${colors.gray(`(${formatBytes(sqlContent.length)})`)}`);
    console.log('');
    if (!isInitialized(projectRoot)) {
        initRepository(projectRoot);
        console.log(`Initialized empty Relq repository in ${colors.cyan('.relq/')}`);
        console.log('');
    }
    if (mergeStrategy === 'merge') {
        const status = getWorkingTreeStatus(projectRoot);
        if (!status.isClean) {
            printDirtyWorkingTreeError(status, 'import');
            console.log('');
            printMergeStrategyHelp();
            fatal('Working tree is not clean', 'Commit or stash your changes before importing.');
            return;
        }
    }
    spinner.start('Parsing SQL schema');
    const parsedSchema = parseSqlFile(sqlContent);
    const functions = includeFunctions ? parseFunctions(sqlContent) : [];
    const triggers = includeTriggers ? parseTriggers(sqlContent) : [];
    const comments = parseComments(sqlContent);
    spinner.succeed(`Parsed ${parsedSchema.tables.length} tables, ${parsedSchema.enums.length} enums, ${parsedSchema.extensions.length} extensions`);
    if (parsedSchema.tables.length > 0) {
        console.log('');
        console.log(`${colors.bold('Tables:')}`);
        for (const table of parsedSchema.tables.slice(0, 10)) {
            const partInfo = table.isPartitioned ? ` ${colors.gray('(partitioned)')}` : '';
            console.log(`  ${colors.green('+')} ${table.name} ${colors.gray(`(${table.columns.length} columns)`)}${partInfo}`);
        }
        if (parsedSchema.tables.length > 10) {
            console.log(`  ${colors.gray(`... and ${parsedSchema.tables.length - 10} more`)}`);
        }
    }
    if (parsedSchema.enums.length > 0) {
        console.log('');
        console.log(`${colors.bold('Types:')}`);
        for (const e of parsedSchema.enums.slice(0, 5)) {
            console.log(`  ${colors.yellow('+')} ${e.name} ${colors.gray(`(${e.values.length} values)`)}`);
        }
        if (parsedSchema.enums.length > 5) {
            console.log(`  ${colors.gray(`... and ${parsedSchema.enums.length - 5} more`)}`);
        }
    }
    if (parsedSchema.domains.length > 0) {
        console.log('');
        console.log(`${colors.bold('Domains:')}`);
        for (const d of parsedSchema.domains.slice(0, 5)) {
            console.log(`  ${colors.magenta('+')} ${d.name} ${colors.gray(`(${d.baseType})`)}`);
        }
        if (parsedSchema.domains.length > 5) {
            console.log(`  ${colors.gray(`... and ${parsedSchema.domains.length - 5} more`)}`);
        }
    }
    console.log('');
    const ignorePatterns = loadRelqignore(projectRoot);
    let ignoredCount = 0;
    const filteredTables = parsedSchema.tables.filter(table => {
        if (isTableIgnored(table.name, ignorePatterns).ignored) {
            ignoredCount++;
            return false;
        }
        return true;
    }).map(table => {
        const filteredColumns = table.columns.filter(col => {
            if (isColumnIgnored(table.name, col.name, ignorePatterns).ignored) {
                ignoredCount++;
                return false;
            }
            return true;
        });
        const filteredIndexes = table.indexes.filter(idx => {
            if (isIndexIgnored(table.name, idx.name, ignorePatterns).ignored) {
                ignoredCount++;
                return false;
            }
            return true;
        });
        const filteredConstraints = table.constraints.filter(con => {
            if (isConstraintIgnored(table.name, con.name, ignorePatterns).ignored) {
                ignoredCount++;
                return false;
            }
            return true;
        });
        return {
            ...table,
            columns: filteredColumns,
            indexes: filteredIndexes,
            constraints: filteredConstraints,
        };
    });
    const filteredEnums = parsedSchema.enums.filter(e => {
        if (isEnumIgnored(e.name, ignorePatterns).ignored) {
            ignoredCount++;
            return false;
        }
        return true;
    });
    const filteredDomains = parsedSchema.domains.filter(d => {
        if (isDomainIgnored(d.name, ignorePatterns).ignored) {
            ignoredCount++;
            return false;
        }
        return true;
    });
    const filteredCompositeTypes = parsedSchema.compositeTypes.filter(c => {
        if (isCompositeTypeIgnored(c.name, ignorePatterns).ignored) {
            ignoredCount++;
            return false;
        }
        return true;
    });
    const filteredSequences = parsedSchema.sequences.filter(s => {
        if (isSequenceIgnored(s.name, ignorePatterns).ignored) {
            ignoredCount++;
            return false;
        }
        return true;
    });
    const filteredFunctions = functions.filter(f => {
        if (isFunctionIgnored(f.name, ignorePatterns).ignored) {
            ignoredCount++;
            return false;
        }
        return true;
    });
    const filteredSchema = {
        tables: filteredTables,
        enums: filteredEnums,
        domains: filteredDomains,
        compositeTypes: filteredCompositeTypes,
        sequences: filteredSequences,
        collations: parsedSchema.collations,
        foreignTables: parsedSchema.foreignTables,
        views: parsedSchema.views,
        materializedViews: parsedSchema.materializedViews,
        foreignServers: parsedSchema.foreignServers,
        extensions: parsedSchema.extensions,
        partitions: parsedSchema.partitions,
    };
    if (ignoredCount > 0) {
        console.log(`${ignoredCount} object(s) ignored by .relqignore`);
    }
    const dependencyErrors = validateIgnoreDependencies({
        tables: filteredTables.map(t => ({
            name: t.name,
            columns: t.columns.map(c => ({
                name: c.name,
                type: c.dataType,
                default: c.defaultValue,
            })),
        })),
        enums: parsedSchema.enums,
        domains: parsedSchema.domains,
        sequences: parsedSchema.sequences,
        compositeTypes: parsedSchema.compositeTypes,
    }, ignorePatterns);
    if (dependencyErrors.length > 0) {
        spinner.stop();
        const errorMessages = dependencyErrors.map(e => e.message).join('\n  ');
        fatal('Dependency validation failed', `${errorMessages}\n\nEither un-ignore the type or add the column to .relqignore`);
        return;
    }
    spinner.start('Generating TypeScript schema');
    const dbSchema = convertToDbSchema(filteredSchema, filteredFunctions, triggers, comments);
    const typescriptContent = generateTypeScript(dbSchema, {
        camelCase: true,
        includeFunctions,
        includeTriggers,
    });
    spinner.succeed('Generated TypeScript schema');
    const incomingSchema = convertToNormalizedSchema(filteredSchema, filteredFunctions, triggers);
    const existingSnapshot = loadSnapshot(projectRoot);
    const replaceAll = options.theirs === true;
    let mergedSchema;
    let changes = [];
    if (existingSnapshot) {
        spinner.start('Detecting changes');
        mergedSchema = mergeSchemas(existingSnapshot, incomingSchema, replaceAll);
        const beforeSchema = snapshotToDbSchema(existingSnapshot);
        const afterSchema = snapshotToDbSchema(mergedSchema);
        changes = compareSchemas(beforeSchema, afterSchema);
        spinner.stop();
        if (changes.length > 0) {
            console.log('');
            console.log(`${colors.bold('Changes detected:')}${replaceAll ? colors.yellow(' (--theirs: full replacement)') : ''}`);
            console.log('');
            const creates = changes.filter(c => c.type === 'CREATE');
            const alters = changes.filter(c => c.type === 'ALTER');
            const drops = changes.filter(c => c.type === 'DROP');
            if (creates.length > 0) {
                for (const change of creates.slice(0, 10)) {
                    console.log(`\t${colors.green(getChangeDisplayName(change))}`);
                }
                if (creates.length > 10) {
                    console.log(`\t${colors.gray(`... and ${creates.length - 10} more additions`)}`);
                }
            }
            if (alters.length > 0) {
                for (const change of alters.slice(0, 10)) {
                    console.log(`\t${colors.yellow(getChangeDisplayName(change))}`);
                }
                if (alters.length > 10) {
                    console.log(`\t${colors.gray(`... and ${alters.length - 10} more modifications`)}`);
                }
            }
            if (drops.length > 0) {
                if (replaceAll) {
                    for (const change of drops.slice(0, 10)) {
                        console.log(`\t${colors.red(getChangeDisplayName(change))}`);
                    }
                    if (drops.length > 10) {
                        console.log(`\t${colors.gray(`... and ${drops.length - 10} more deletions`)}`);
                    }
                }
                else {
                    console.log('');
                    console.log(`${drops.length} object(s) only in existing schema (preserved)`);
                }
            }
            console.log('');
            console.log(` ${changes.length} change(s) detected`);
        }
        else {
            console.log('');
            console.log(`${colors.green('Already up to date.')} No changes detected.`);
        }
    }
    else {
        mergedSchema = incomingSchema;
        changes = [];
        console.log(`${colors.cyan('First import')} - creating initial snapshot`);
    }
    const mergedDbSchema = snapshotToDbSchemaForGeneration(mergedSchema);
    const finalTypescriptContent = generateTypeScript(mergedDbSchema, {
        camelCase: true,
        includeFunctions,
        includeTriggers,
    });
    if (dryRun) {
        console.log('');
        console.log(`${colors.yellow('Dry run mode')} - no files written`);
        console.log('');
        console.log('Would write:');
        const dryRunOutputPath = options.output || './db/schema.ts';
        const dryRunAbsPath = path.resolve(projectRoot, dryRunOutputPath);
        console.log(`  ${colors.cyan(dryRunAbsPath)} ${colors.gray(`(${formatBytes(finalTypescriptContent.length)})`)}`);
        console.log(`  ${colors.cyan(path.join(projectRoot, '.relq/snapshot.json'))}`);
        if (changes.length > 0) {
            console.log(`  Stage ${changes.length} change(s)`);
        }
        console.log('');
        return;
    }
    const outputPath = options.output || './db/schema.ts';
    const absoluteOutputPath = path.resolve(projectRoot, outputPath);
    const outputDir = path.dirname(absoluteOutputPath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(absoluteOutputPath, finalTypescriptContent, 'utf-8');
    console.log(`Written ${colors.cyan(absoluteOutputPath)} ${colors.gray(`(${formatBytes(finalTypescriptContent.length)})`)}`);
    saveSnapshot(mergedSchema, projectRoot);
    if (changes.length > 0) {
        addUnstagedChanges(changes, projectRoot);
        stageChanges(['.'], projectRoot);
        console.log('');
        console.log(`${changes.length} change(s) staged for commit`);
    }
    console.log('');
    console.log('Import successful.');
    console.log('');
    if (changes.length > 0) {
        hint("run 'relq status' to see staged changes");
        hint("run 'relq commit -m <message>' to commit");
    }
    else {
        hint("run 'relq status' to see current state");
    }
    console.log('');
}
function toCamelCase(str) {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}
function convertToDbSchema(parsed, functions = [], triggers = [], comments = []) {
    const tableComments = new Map();
    const columnComments = new Map();
    const indexComments = new Map();
    const functionComments = new Map();
    const triggerComments = new Map();
    for (const c of comments) {
        if (c.objectType === 'TABLE') {
            tableComments.set(c.objectName, c.comment);
        }
        else if (c.objectType === 'COLUMN' && c.subObjectName) {
            columnComments.set(`${c.objectName}.${c.subObjectName}`, c.comment);
        }
        else if (c.objectType === 'INDEX') {
            indexComments.set(c.objectName, c.comment);
        }
        else if (c.objectType === 'FUNCTION' || c.objectType === 'PROCEDURE') {
            functionComments.set(c.objectName, c.comment);
        }
        else if (c.objectType === 'TRIGGER' && c.subObjectName) {
            triggerComments.set(`${c.objectName}.${c.subObjectName}`, c.comment);
        }
    }
    return {
        tables: parsed.tables.map(t => ({
            name: t.name,
            schema: t.schema,
            comment: tableComments.get(t.name) || null,
            columns: t.columns.map(c => ({
                name: c.name,
                dataType: c.dataType,
                udtName: c.dataType,
                isNullable: c.isNullable,
                defaultValue: c.defaultValue,
                isPrimaryKey: c.isPrimaryKey,
                isUnique: c.isUnique,
                maxLength: c.maxLength,
                precision: c.precision,
                scale: c.scale,
                references: c.references ? `${c.references.table}.${c.references.column}` : null,
                comment: columnComments.get(`${t.name}.${c.name}`) || c.comment || null,
                isGenerated: c.isGenerated || false,
                generationExpression: c.generationExpression || null,
            })),
            indexes: t.indexes.map(idx => ({
                name: idx.name,
                columns: idx.columns,
                isUnique: idx.isUnique,
                isPrimary: idx.isPrimary,
                type: idx.type,
                definition: idx.definition,
                whereClause: idx.whereClause,
                expression: idx.expression,
                comment: indexComments.get(idx.name) || null,
            })),
            constraints: t.constraints,
            rowCount: 0,
            isPartitioned: t.isPartitioned,
            partitionType: t.partitionType,
            partitionKey: t.partitionKey,
        })),
        enums: parsed.enums.map(e => ({
            name: e.name,
            values: e.values,
        })),
        domains: parsed.domains?.map((d) => ({
            name: d.name,
            baseType: d.baseType,
            isNotNull: d.notNull || false,
            defaultValue: d.default || null,
            checkExpression: d.check || null,
            check: d.check,
            default: d.default,
            notNull: d.notNull,
        })) || [],
        compositeTypes: parsed.compositeTypes?.map((c) => ({
            name: c.name,
            attributes: c.attributes || [],
        })) || [],
        sequences: parsed.sequences?.map((s) => ({
            name: s.name,
            dataType: s.dataType,
            start: s.start,
            increment: s.increment,
            minValue: s.minValue,
            maxValue: s.maxValue,
            cache: s.cache,
            cycle: s.cycle,
            ownedBy: s.ownedBy,
        })) || [],
        collations: [],
        extensions: parsed.extensions,
        partitions: parsed.partitions,
        functions: functions.map(f => ({
            ...f,
            comment: functionComments.get(f.name) || null,
        })),
        triggers: triggers.map(t => ({
            ...t,
            comment: triggerComments.get(`${t.name}.${t.tableName}`) || null,
        })),
        policies: [],
        foreignServers: [],
        foreignTables: [],
    };
}
function convertToNormalizedSchema(parsed, functions = [], triggers = []) {
    return {
        extensions: parsed.extensions.map(ext => ({ name: ext })),
        enums: parsed.enums.map(e => ({
            name: e.name,
            schema: 'public',
            values: e.values,
        })),
        domains: parsed.domains.map(d => ({
            name: d.name,
            schema: 'public',
            baseType: d.baseType,
            notNull: d.notNull || false,
            default: d.default || null,
            check: d.check || null,
        })),
        compositeTypes: parsed.compositeTypes.map(c => ({
            name: c.name,
            schema: 'public',
            attributes: c.attributes,
        })),
        sequences: parsed.sequences.map(s => ({
            name: s.name,
            schema: 'public',
            dataType: 'bigint',
            startValue: s.start || 1,
            increment: s.increment || 1,
            minValue: s.minValue || null,
            maxValue: s.maxValue || null,
            cache: 1,
            cycle: false,
            ownedBy: null,
        })),
        collations: [],
        tables: parsed.tables.map(t => {
            const childPartitions = parsed.partitions.filter(p => p.parentTable === t.name);
            return {
                name: t.name,
                schema: t.schema,
                columns: t.columns.map(c => ({
                    name: c.name,
                    tsName: toCamelCase(c.name),
                    type: c.dataType,
                    nullable: c.isNullable,
                    default: c.defaultValue,
                    primaryKey: c.isPrimaryKey,
                    unique: c.isUnique,
                    identity: c.identityGeneration ? {
                        type: c.identityGeneration,
                    } : undefined,
                    isGenerated: c.isGenerated,
                    generationExpression: c.generationExpression,
                })),
                indexes: t.indexes.map(idx => ({
                    name: idx.name,
                    columns: idx.columns,
                    unique: idx.isUnique,
                    type: idx.type || 'btree',
                    definition: idx.definition,
                    whereClause: idx.whereClause,
                    expression: idx.expression,
                })),
                constraints: t.constraints.map(c => ({
                    name: c.name,
                    type: c.type,
                    definition: c.definition,
                })),
                isPartitioned: t.isPartitioned,
                partitionType: t.partitionType,
                partitionKey: t.partitionKey,
                partitions: childPartitions.length > 0 ? childPartitions.map(p => ({
                    name: p.name,
                    bound: p.partitionBound || '',
                })) : undefined,
            };
        }),
        functions: functions.map(f => ({
            name: f.name,
            returnType: f.returnType,
            argTypes: f.argTypes,
            language: f.language,
        })),
        triggers: triggers.map(t => ({
            name: t.name,
            table: t.tableName,
            events: [t.event],
            timing: t.timing,
            forEach: 'STATEMENT',
            functionName: t.functionName || '',
        })),
        views: parsed.views.map(v => ({
            name: v.name,
            schema: v.schema || 'public',
            definition: v.definition,
        })),
        materializedViews: parsed.materializedViews.map(mv => ({
            name: mv.name,
            schema: mv.schema || 'public',
            definition: mv.definition,
            withData: mv.withData ?? true,
        })),
    };
}
function snapshotToDbSchema(snapshot) {
    return ({
        tables: snapshot.tables.map(t => ({
            name: t.name,
            schema: t.schema || 'public',
            columns: t.columns.map(c => ({
                name: c.name,
                dataType: c.type,
                isNullable: c.nullable,
                defaultValue: c.default ?? null,
                isPrimaryKey: c.primaryKey || false,
                isUnique: c.unique || false,
                maxLength: null,
                precision: null,
                scale: null,
                isArray: false,
                references: null,
                comment: undefined,
            })),
            indexes: t.indexes.map(i => ({
                name: i.name,
                columns: Array.isArray(i.columns) ? i.columns : [i.columns],
                isUnique: i.unique || false,
                isPrimary: false,
                type: i.type || 'btree',
            })),
            constraints: t.constraints?.map(c => ({
                name: c.name,
                type: c.type,
                definition: c.definition,
                columns: [],
            })) || [],
            isPartitioned: t.isPartitioned || false,
            rowCount: 0,
        })),
        enums: snapshot.enums?.map(e => ({
            name: e.name,
            values: e.values,
        })) || [],
        domains: snapshot.domains?.map(d => ({
            name: d.name,
            baseType: d.baseType,
            isNotNull: d.notNull || false,
            defaultValue: d.default || null,
            checkExpression: d.check || null,
        })) || [],
        compositeTypes: snapshot.compositeTypes?.map(c => ({
            name: c.name,
            attributes: c.attributes || [],
        })) || [],
        extensions: (snapshot.extensions || []).map(e => typeof e === 'string' ? e : e.name),
        functions: snapshot.functions?.map(f => ({
            name: f.name,
            schema: 'public',
            returnType: f.returnType,
            argTypes: f.argTypes || [],
            language: f.language,
            definition: '',
            isAggregate: false,
            volatility: 'VOLATILE',
        })) || [],
        triggers: snapshot.triggers?.map(t => ({
            name: t.name,
            tableName: t.table,
            timing: t.timing,
            event: t.events?.[0] || '',
            functionName: t.functionName || '',
            definition: '',
            isEnabled: t.isEnabled ?? true,
        })) || [],
        partitions: [],
        policies: [],
        foreignServers: [],
        foreignTables: [],
        sequences: [],
    });
}
function snapshotToDbSchemaForGeneration(snapshot) {
    return {
        tables: snapshot.tables.map(t => ({
            name: t.name,
            schema: t.schema || 'public',
            comment: null,
            columns: t.columns.map(c => ({
                name: c.name,
                dataType: c.type,
                udtName: c.type,
                isNullable: c.nullable,
                defaultValue: c.default ?? null,
                isPrimaryKey: c.primaryKey || false,
                isUnique: c.unique || false,
                maxLength: null,
                precision: null,
                scale: null,
                references: null,
                comment: null,
                isGenerated: c.isGenerated || false,
                generationExpression: c.generationExpression || null,
                identityGeneration: c.identity?.type || null,
            })),
            indexes: t.indexes.map(i => ({
                name: i.name,
                columns: Array.isArray(i.columns) ? i.columns : [i.columns],
                isUnique: i.unique || false,
                isPrimary: false,
                type: i.type || 'btree',
                definition: i.definition,
                whereClause: i.whereClause,
                comment: null,
            })),
            constraints: t.constraints?.map(c => ({
                name: c.name,
                type: c.type,
                columns: [],
                definition: c.definition,
            })) || [],
            rowCount: 0,
            isPartitioned: t.isPartitioned || false,
            partitionType: t.partitionType,
            partitionKey: t.partitionKey ? [t.partitionKey].flat() : undefined,
        })),
        enums: snapshot.enums?.map(e => ({
            name: e.name,
            values: e.values,
        })) || [],
        domains: snapshot.domains?.map(d => ({
            name: d.name,
            baseType: d.baseType,
            isNotNull: d.notNull || false,
            defaultValue: d.default || null,
            checkExpression: d.check || null,
            check: d.check,
            default: d.default,
            notNull: d.notNull,
        })) || [],
        compositeTypes: snapshot.compositeTypes?.map(c => ({
            name: c.name,
            attributes: c.attributes || [],
        })) || [],
        sequences: snapshot.sequences?.map(s => ({
            name: s.name,
            dataType: s.dataType,
            start: s.startValue,
            increment: s.increment,
            minValue: s.minValue,
            maxValue: s.maxValue,
            cache: s.cache,
            cycle: s.cycle,
            ownedBy: s.ownedBy ?? undefined,
        })) || [],
        collations: [],
        extensions: (snapshot.extensions || []).map(e => typeof e === 'string' ? e : e.name),
        partitions: [],
        functions: snapshot.functions?.map(f => ({
            name: f.name,
            schema: 'public',
            returnType: f.returnType,
            argTypes: f.argTypes || [],
            language: f.language,
            definition: '',
            isAggregate: false,
            volatility: 'VOLATILE',
        })) || [],
        triggers: snapshot.triggers?.map(t => ({
            name: t.name,
            tableName: t.table,
            timing: t.timing,
            event: t.events?.[0] || '',
            functionName: t.functionName || '',
            definition: '',
            isEnabled: t.isEnabled ?? true,
        })) || [],
        policies: [],
        foreignServers: [],
        foreignTables: [],
    };
}
function mergeSchemas(existing, incoming, replaceAll = false) {
    if (replaceAll) {
        return incoming;
    }
    function mergeByName(existingArr, incomingArr) {
        const incomingMap = new Map(incomingArr.map(item => [item.name, item]));
        const resultMap = new Map();
        for (const item of existingArr) {
            resultMap.set(item.name, item);
        }
        for (const item of incomingArr) {
            resultMap.set(item.name, item);
        }
        return Array.from(resultMap.values());
    }
    return {
        extensions: mergeByName(existing.extensions || [], incoming.extensions || []),
        enums: mergeByName(existing.enums || [], incoming.enums || []),
        domains: mergeByName(existing.domains || [], incoming.domains || []),
        compositeTypes: mergeByName(existing.compositeTypes || [], incoming.compositeTypes || []),
        sequences: mergeByName(existing.sequences || [], incoming.sequences || []),
        collations: mergeByName(existing.collations || [], incoming.collations || []),
        tables: mergeByName(existing.tables || [], incoming.tables || []),
        functions: mergeByName(existing.functions || [], incoming.functions || []),
        triggers: mergeByName(existing.triggers || [], incoming.triggers || []),
        views: mergeByName(existing.views || [], incoming.views || []),
        materializedViews: mergeByName(existing.materializedViews || [], incoming.materializedViews || []),
        foreignTables: mergeByName(existing.foreignTables || [], incoming.foreignTables || []),
    };
}
export default importCommand;
