import * as fs from 'fs';
import * as path from 'path';
import { parseFunctions, parseTriggers, parseComments } from "../utils/sql-parser.js";
import { generateTypeScriptFromAST, assignTrackingIds, generateFunctionsFile, generateTriggersFile } from "../utils/ast-codegen.js";
import { parseSQL, normalizedToParsedSchema } from "../utils/ast-transformer.js";
import { saveSnapshot, loadSnapshot, isInitialized, initRepository, stageChanges, addUnstagedChanges } from "../utils/repo-manager.js";
import { compareSchemas } from "../utils/schema-comparator.js";
import { getChangeDisplayName } from "../utils/change-tracker.js";
import { getSchemaPath, loadConfigWithEnv } from "../utils/config-loader.js";
import { loadRelqignore, validateIgnoreDependencies, isTableIgnored, isColumnIgnored, isIndexIgnored, isConstraintIgnored, isEnumIgnored, isDomainIgnored, isSequenceIgnored, isFunctionIgnored, } from "../utils/relqignore.js";
import { colors, fatal, warning, hint, getWorkingTreeStatus, printDirtyWorkingTreeError, printMergeStrategyHelp, readSQLFile, createSpinner, formatBytes, } from "../utils/git-utils.js";
export async function importCommand(sqlFilePath, options = {}, projectRoot = process.cwd()) {
    const { includeFunctions = false, includeTriggers = false, force = false, dryRun = false } = options;
    const spinner = createSpinner();
    const config = await loadConfigWithEnv();
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
    const parsedSchema = await parseSQL(sqlContent);
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
        compositeTypes: parsedSchema.compositeTypes || [],
        sequences: filteredSequences,
        views: parsedSchema.views,
        functions: parsedSchema.functions,
        triggers: parsedSchema.triggers,
        extensions: parsedSchema.extensions,
    };
    if (ignoredCount > 0) {
        console.log(`${ignoredCount} object(s) ignored by .relqignore`);
    }
    const dependencyErrors = validateIgnoreDependencies({
        tables: filteredTables.map(t => ({
            name: t.name,
            columns: t.columns.map(c => ({
                name: c.name,
                type: c.type,
                default: c.defaultValue,
            })),
        })),
        enums: parsedSchema.enums,
        domains: parsedSchema.domains,
        sequences: parsedSchema.sequences,
        compositeTypes: [],
    }, ignorePatterns);
    if (dependencyErrors.length > 0) {
        spinner.stop();
        const errorMessages = dependencyErrors.map(e => e.message).join('\n  ');
        fatal('Dependency validation failed', `${errorMessages}\n\nEither un-ignore the type or add the column to .relqignore`);
        return;
    }
    spinner.start('Generating TypeScript schema');
    const outputPath = options.output || getSchemaPath(config);
    const absoluteOutputPath = path.resolve(projectRoot, outputPath);
    const schemaExists = fs.existsSync(absoluteOutputPath);
    if (schemaExists && (includeFunctions || includeTriggers)) {
        const existingContent = fs.readFileSync(absoluteOutputPath, 'utf-8');
        const hasPgFunction = /\bpgFunction\s*\(/.test(existingContent);
        const hasPgTrigger = /\bpgTrigger\s*\(/.test(existingContent);
        if (hasPgFunction || hasPgTrigger) {
            spinner.stop();
            const items = [];
            if (hasPgFunction)
                items.push('pgFunction');
            if (hasPgTrigger)
                items.push('pgTrigger');
            const schemaBaseName = path.basename(absoluteOutputPath, '.ts');
            fatal(`Existing schema contains ${items.join(' and ')} definitions`, `Functions and triggers should be in separate files:\n` +
                `  ${colors.cyan(`${schemaBaseName}.functions.ts`)} - for functions\n` +
                `  ${colors.cyan(`${schemaBaseName}.triggers.ts`)} - for triggers\n\n` +
                `To migrate:\n` +
                `  1. Move pgFunction definitions to ${schemaBaseName}.functions.ts\n` +
                `  2. Move pgTrigger definitions to ${schemaBaseName}.triggers.ts\n` +
                `  3. Run ${colors.cyan('relq import')} again\n\n` +
                `Or use ${colors.cyan('relq import --force')} to overwrite and regenerate all files.`);
        }
    }
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
        changes = await compareSchemas(beforeSchema, afterSchema);
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
    const astSchema = normalizedToParsedSchema({
        tables: mergedSchema.tables.map(t => ({
            name: t.name,
            schema: t.schema,
            columns: t.columns.map(c => ({
                name: c.name,
                type: c.type,
                nullable: c.nullable,
                default: c.default,
                primaryKey: c.primaryKey,
                unique: c.unique,
                check: c.check,
                checkName: c.checkName,
                references: c.references,
                comment: c.comment,
                isGenerated: c.isGenerated,
                generatedExpression: c.generationExpression,
                generatedExpressionAst: c.generatedExpressionAst,
            })),
            indexes: t.indexes.map(i => ({
                name: i.name,
                columns: i.columns,
                unique: i.unique,
                type: i.type,
                definition: i.definition,
                whereClause: i.whereClause,
                whereClauseAst: i.whereClauseAst,
            })),
            constraints: t.constraints?.map(c => ({
                name: c.name,
                type: c.type,
                columns: c.columns,
                definition: c.definition,
                references: c.references,
            })),
            isPartitioned: t.isPartitioned,
            partitionType: t.partitionType,
            partitionKey: t.partitionKey,
            comment: t.comment,
        })),
        enums: mergedSchema.enums.map(e => ({
            name: e.name,
            schema: e.schema,
            values: e.values,
        })),
        domains: mergedSchema.domains?.map(d => ({
            name: d.name,
            baseType: d.baseType,
            notNull: d.notNull,
            default: d.default ?? undefined,
            check: d.check ?? undefined,
            checkName: d.checkName,
        })),
        sequences: mergedSchema.sequences?.map(s => ({
            name: s.name,
            start: s.start,
            increment: s.increment,
            minValue: s.minValue,
            maxValue: s.maxValue,
            cache: s.cache,
            cycle: s.cycle,
        })),
        extensions: mergedSchema.extensions?.map(e => e.name),
        functions: includeFunctions ? mergedSchema.functions?.map(f => ({
            name: f.name,
            schema: f.schema,
            args: f.args || [],
            returnType: f.returnType,
            language: f.language,
            body: f.body,
            volatility: f.volatility,
            isStrict: f.isStrict,
            securityDefiner: f.securityDefiner,
        })) : [],
        triggers: includeTriggers ? mergedSchema.triggers?.map(t => ({
            name: t.name,
            table: t.table,
            timing: t.timing,
            events: t.events,
            level: t.level,
            functionName: t.functionName,
            when: t.when,
        })) : [],
    });
    assignTrackingIds(astSchema);
    const finalTypescriptContent = generateTypeScriptFromAST(astSchema, {
        camelCase: true,
        includeFunctions: false,
        includeTriggers: false,
    });
    if (dryRun) {
        console.log('');
        console.log(`${colors.yellow('Dry run mode')} - no files written`);
        console.log('');
        console.log('Would write:');
        const dryRunOutputPath = options.output || getSchemaPath(config);
        const dryRunAbsPath = path.resolve(projectRoot, dryRunOutputPath);
        console.log(`  ${colors.cyan(dryRunAbsPath)} ${colors.gray(`(${formatBytes(finalTypescriptContent.length)})`)}`);
        console.log(`  ${colors.cyan(path.join(projectRoot, '.relq/snapshot.json'))}`);
        if (changes.length > 0) {
            console.log(`  Stage ${changes.length} change(s)`);
        }
        console.log('');
        return;
    }
    const outputDir = path.dirname(absoluteOutputPath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(absoluteOutputPath, finalTypescriptContent, 'utf-8');
    console.log(`Written ${colors.cyan(absoluteOutputPath)} ${colors.gray(`(${formatBytes(finalTypescriptContent.length)})`)}`);
    if (includeFunctions && astSchema.functions.length > 0) {
        const schemaBaseName = path.basename(absoluteOutputPath, '.ts');
        const functionsPath = path.join(outputDir, `${schemaBaseName}.functions.ts`);
        const functionsCode = generateFunctionsFile(astSchema, {
            camelCase: true,
            importPath: 'relq/schema-builder',
            schemaImportPath: `./${schemaBaseName}`,
        });
        if (functionsCode) {
            fs.writeFileSync(functionsPath, functionsCode, 'utf-8');
            console.log(`Written ${colors.cyan(functionsPath)} ${colors.gray(`(${formatBytes(functionsCode.length)})`)}`);
        }
    }
    if (includeTriggers && astSchema.triggers.length > 0) {
        const schemaBaseName = path.basename(absoluteOutputPath, '.ts');
        const triggersPath = path.join(outputDir, `${schemaBaseName}.triggers.ts`);
        const triggersCode = generateTriggersFile(astSchema, {
            camelCase: true,
            importPath: 'relq/schema-builder',
            schemaImportPath: `./${schemaBaseName}`,
            functionsImportPath: `./${schemaBaseName}.functions`,
        });
        if (triggersCode) {
            fs.writeFileSync(triggersPath, triggersCode, 'utf-8');
            console.log(`Written ${colors.cyan(triggersPath)} ${colors.gray(`(${formatBytes(triggersCode.length)})`)}`);
        }
    }
    applyTrackingIdsToSnapshot(finalTypescriptContent, mergedSchema);
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
            schema: t.schema || 'public',
            comment: tableComments.get(t.name) || null,
            columns: t.columns
                .filter(c => {
                if (!c.type) {
                    console.warn(`Warning: Skipping column ${t.name}.${c.name} (no type)`);
                    return false;
                }
                return true;
            })
                .map(c => ({
                name: c.name,
                dataType: c.type,
                udtName: c.type,
                isNullable: c.isNullable,
                defaultValue: c.defaultValue ?? null,
                isPrimaryKey: c.isPrimaryKey,
                isUnique: c.isUnique,
                maxLength: c.typeParams?.length ?? null,
                precision: c.typeParams?.precision ?? null,
                scale: c.typeParams?.scale ?? null,
                references: c.references ? `${c.references.table}.${c.references.column}` : null,
                comment: columnComments.get(`${t.name}.${c.name}`) || c.comment || null,
                isGenerated: c.isGenerated || false,
                generationExpression: c.generatedExpression || null,
            })),
            indexes: t.indexes.map(idx => ({
                name: idx.name,
                columns: idx.columns,
                isUnique: idx.isUnique,
                isPrimary: false,
                type: idx.method || 'btree',
                definition: idx.expressions?.join(', ') || idx.columns.join(', '),
                whereClause: idx.whereClause,
                whereClauseAst: idx.whereClauseAst,
                expression: idx.expressions?.[0],
                comment: indexComments.get(idx.name) || null,
            })),
            constraints: t.constraints.map(c => ({
                name: c.name,
                type: c.type,
                columns: c.columns,
                definition: c.expression || c.columns.join(', '),
            })),
            rowCount: 0,
            isPartitioned: t.isPartitioned,
            partitionType: t.partitionType,
            partitionKey: t.partitionKey,
        })),
        enums: parsed.enums.map(e => ({
            name: e.name,
            values: e.values,
        })),
        domains: parsed.domains.map(d => ({
            name: d.name,
            baseType: d.baseType,
            isNotNull: d.notNull || false,
            defaultValue: d.defaultValue || null,
            checkExpression: d.checkExpression || null,
            check: d.checkExpression,
            default: d.defaultValue,
            notNull: d.notNull,
        })),
        compositeTypes: [],
        sequences: parsed.sequences.map(s => ({
            name: s.name,
            dataType: 'bigint',
            start: s.startValue,
            increment: s.increment,
            minValue: s.minValue,
            maxValue: s.maxValue,
            cache: s.cache,
            cycle: s.cycle,
            ownedBy: s.ownedBy ? `${s.ownedBy.table}.${s.ownedBy.column}` : undefined,
        })),
        collations: [],
        extensions: parsed.extensions,
        partitions: [],
        functions: functions.map(f => ({
            ...f,
            comment: functionComments.get(f.name) || undefined,
        })),
        triggers: triggers.map(t => ({
            ...t,
            comment: triggerComments.get(`${t.name}.${t.tableName}`) || undefined,
        })),
        policies: [],
        foreignServers: [],
        foreignTables: [],
    };
}
function convertToNormalizedSchema(parsed, functions = [], triggers = []) {
    const regularViews = parsed.views.filter(v => !v.isMaterialized);
    const materializedViews = parsed.views.filter(v => v.isMaterialized);
    return {
        extensions: parsed.extensions.map(ext => ({ name: ext })),
        enums: parsed.enums.map(e => ({
            name: e.name,
            schema: e.schema || 'public',
            values: e.values,
        })),
        domains: parsed.domains.map(d => ({
            name: d.name,
            schema: d.schema || 'public',
            baseType: d.baseType,
            notNull: d.notNull || false,
            default: d.defaultValue || null,
            check: d.checkExpression || null,
        })),
        compositeTypes: [],
        sequences: parsed.sequences.map(s => ({
            name: s.name,
            schema: s.schema || 'public',
            dataType: 'bigint',
            startValue: s.startValue || 1,
            increment: s.increment || 1,
            minValue: s.minValue || null,
            maxValue: s.maxValue || null,
            cache: s.cache || 1,
            cycle: s.cycle || false,
            ownedBy: s.ownedBy ? `${s.ownedBy.table}.${s.ownedBy.column}` : null,
        })),
        collations: [],
        tables: parsed.tables.map(t => {
            return {
                name: t.name,
                schema: t.schema || 'public',
                columns: t.columns.map(c => {
                    const col = {
                        name: c.name,
                        tsName: toCamelCase(c.name),
                        type: c.type,
                        nullable: c.isNullable,
                        default: c.defaultValue,
                        primaryKey: c.isPrimaryKey,
                        unique: c.isUnique,
                        isGenerated: c.isGenerated,
                        generationExpression: c.generatedExpression,
                        generatedExpressionAst: c.generatedExpressionAst,
                    };
                    return col;
                }),
                indexes: t.indexes.map(idx => ({
                    name: idx.name,
                    columns: idx.columns,
                    unique: idx.isUnique,
                    type: idx.method || 'btree',
                    definition: idx.expressions?.join(', ') || idx.columns.join(', '),
                    whereClause: idx.whereClause,
                    whereClauseAst: idx.whereClauseAst,
                    expression: idx.expressions?.[0],
                })),
                constraints: t.constraints.map(c => {
                    const base = {
                        name: c.name,
                        type: c.type,
                        definition: c.expression || c.columns.join(', '),
                        columns: c.columns,
                    };
                    if (c.type === 'FOREIGN KEY' && c.references) {
                        base.referencedTable = c.references.table;
                        base.referencedColumns = c.references.columns;
                        if (c.references.onDelete)
                            base.onDelete = c.references.onDelete;
                        if (c.references.onUpdate)
                            base.onUpdate = c.references.onUpdate;
                        if (c.references.match)
                            base.matchType = c.references.match;
                        if (c.references.deferrable)
                            base.deferrable = c.references.deferrable;
                        if (c.references.initiallyDeferred)
                            base.initiallyDeferred = c.references.initiallyDeferred;
                    }
                    if (c.type === 'CHECK' && c.expression) {
                        base.checkExpression = c.expression;
                    }
                    return base;
                }),
                isPartitioned: t.isPartitioned,
                partitionType: t.partitionType,
                partitionKey: t.partitionKey,
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
            forEach: (t.forEach || 'ROW'),
            functionName: t.functionName || '',
        })),
        views: regularViews.map(v => ({
            name: v.name,
            schema: v.schema || 'public',
            definition: v.definition,
        })),
        materializedViews: materializedViews.map(mv => ({
            name: mv.name,
            schema: mv.schema || 'public',
            definition: mv.definition,
            withData: true,
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
            forEach: (t.forEach || 'ROW'),
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
                whereClauseAst: i.whereClauseAst,
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
            forEach: (t.forEach || 'ROW'),
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
function applyTrackingIdsToSnapshot(typescript, snapshot) {
    for (const table of snapshot.tables) {
        const tablePattern = new RegExp(`defineTable\\s*\\(\\s*['"]${table.name}['"]\\s*,\\s*\\{[^}]+\\}\\s*,\\s*\\{[^}]*\\$trackingId:\\s*['"]([^'"]+)['"]`, 's');
        const tableMatch = typescript.match(tablePattern);
        if (tableMatch) {
            table.trackingId = tableMatch[1];
        }
        for (const col of table.columns) {
            const colPattern = new RegExp(`(?:${col.tsName}|${col.name}):\\s*\\w+\\([^)]*\\)[^\\n]*\\.\\\$id\\(['"]([^'"]+)['"]\\)`);
            const colMatch = typescript.match(colPattern);
            if (colMatch) {
                col.trackingId = colMatch[1];
            }
        }
        for (const idx of table.indexes) {
            const idxPattern = new RegExp(`index\\s*\\(\\s*['"]${idx.name}['"]\\s*\\)[^\\n]*\\.\\\$id\\(['"]([^'"]+)['"]\\)`);
            const idxMatch = typescript.match(idxPattern);
            if (idxMatch) {
                idx.trackingId = idxMatch[1];
            }
        }
    }
}
export default importCommand;
