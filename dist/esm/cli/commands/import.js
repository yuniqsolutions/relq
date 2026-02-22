import * as fs from 'node:fs';
import * as path from 'node:path';
import * as p from '@clack/prompts';
import { defineCommand } from 'citty';
import { parseFunctions, parseTriggers, parseComments } from "../utils/sql-parser.js";
import { generateTypeScriptFromAST, assignTrackingIds, generateFunctionsFile, generateTriggersFile } from "../utils/ast-codegen.js";
import { parseSQL, normalizedToParsedSchema } from "../utils/ast-transformer.js";
import { loadConfig } from "../../config/config.js";
import { detectDialect, getBuilderImportPath } from "../utils/dialect-router.js";
import { createDatabaseClient } from "../utils/database-client.js";
import { validateForDialect, validateSchemaForDialect, formatDialectErrors, hasDialectIncompatibilities, isValidDialect, } from "../utils/dialect-validator.js";
import { saveSnapshot, loadSnapshot, isInitialized, initRepository, } from "../utils/repo-manager.js";
import { getSchemaPath } from "../utils/config-loader.js";
import { loadRelqignore, validateIgnoreDependencies, isTableIgnored, isColumnIgnored, isIndexIgnored, isConstraintIgnored, isEnumIgnored, isDomainIgnored, isSequenceIgnored, isFunctionIgnored, } from "../utils/relqignore.js";
import { buildContext } from "../utils/context.js";
import { colors } from "../utils/colors.js";
import { fatal } from "../utils/ui.js";
import { formatBytes } from "../utils/format.js";
async function runImport(sqlFilePath, options, projectRoot, config) {
    const { includeFunctions = false, includeTriggers = false, force = false, dryRun = false, toDb = false } = options;
    const spin = p.spinner();
    const builderImportPath = getBuilderImportPath(detectDialect(config));
    console.log('');
    if (!sqlFilePath) {
        fatal('No SQL file specified', 'Usage: relq import <sql-file>');
        return;
    }
    if (toDb && (!config || !config.connection)) {
        fatal('No database connection configured', 'The --db/--live flag requires a database connection.\n' +
            'Run "relq init" to configure a database connection first.');
        return;
    }
    const absoluteSqlPath = path.resolve(sqlFilePath);
    if (!fs.existsSync(absoluteSqlPath)) {
        fatal(`File not found: ${absoluteSqlPath}`);
    }
    const sqlContent = fs.readFileSync(absoluteSqlPath, 'utf-8');
    if (!sqlContent.trim()) {
        fatal('SQL file is empty');
    }
    console.log(`Importing ${colors.cyan(path.basename(sqlFilePath))} ${colors.muted(`(${formatBytes(sqlContent.length)})`)}`);
    console.log('');
    if (!isInitialized(projectRoot)) {
        initRepository(projectRoot);
        console.log(`Initialized .relq repository`);
        console.log('');
    }
    spin.start('Parsing SQL schema');
    const parsedSchema = await parseSQL(sqlContent);
    const functions = includeFunctions ? parseFunctions(sqlContent) : [];
    const triggers = includeTriggers ? parseTriggers(sqlContent) : [];
    const comments = parseComments(sqlContent);
    spin.stop(`Parsed ${parsedSchema.tables.length} tables, ${parsedSchema.enums.length} enums, ${parsedSchema.extensions.length} extensions`);
    const importConfig = await loadConfig();
    if (importConfig?.connection) {
        const detectedDialect = detectDialect(importConfig);
        if (isValidDialect(detectedDialect) && detectedDialect !== 'postgres') {
            const dialect = detectedDialect;
            const sqlValidation = validateForDialect(sqlContent, dialect, { location: 'import SQL' });
            const schemaValidation = validateSchemaForDialect({
                tables: parsedSchema.tables.map(t => ({
                    name: t.name,
                    columns: t.columns.map(c => ({
                        name: c.name,
                        type: c.type,
                        references: c.references ? { table: c.references.table } : undefined,
                        primaryKey: c.isPrimaryKey,
                        nullable: c.isNullable,
                        default: c.defaultValue,
                    })),
                    primaryKey: t.columns.filter(c => c.isPrimaryKey).map(c => c.name),
                    indexes: t.indexes.map(i => ({ name: i.name, type: i.method, columns: i.columns })),
                    constraints: t.constraints.map(c => ({ name: c.name, type: c.type, definition: c.expression || '' })),
                })),
                functions: functions.map(f => ({ name: f.name, language: f.language, body: f.definition })),
                triggers: triggers.map(t => ({ name: t.name, table: t.tableName, timing: t.timing, event: t.event })),
                sequences: parsedSchema.sequences?.map(s => ({ name: s.name })) || [],
                extensions: parsedSchema.extensions || [],
            }, dialect);
            const allErrors = [...sqlValidation.errors, ...schemaValidation.errors];
            const allWarnings = [...sqlValidation.warnings, ...schemaValidation.warnings];
            if (allErrors.length > 0) {
                const combinedResult = {
                    valid: false,
                    dialect,
                    errors: allErrors,
                    warnings: allWarnings,
                };
                console.log('');
                console.log(formatDialectErrors(combinedResult));
                fatal(`Imported SQL contains ${dialect.toUpperCase()} incompatibilities`, 'Fix the issues above before importing.');
            }
            if (allWarnings.length > 0) {
                console.log('');
                console.log(formatDialectErrors({ valid: true, dialect, errors: [], warnings: allWarnings }));
            }
        }
    }
    if (parsedSchema.tables.length > 0) {
        console.log('');
        console.log(`${colors.bold('Tables:')}`);
        for (const table of parsedSchema.tables.slice(0, 10)) {
            const partInfo = table.isPartitioned ? ` ${colors.muted('(partitioned)')}` : '';
            console.log(`  ${colors.green('+')} ${table.name} ${colors.muted(`(${table.columns.length} columns)`)}${partInfo}`);
        }
        if (parsedSchema.tables.length > 10) {
            console.log(`  ${colors.muted(`... and ${parsedSchema.tables.length - 10} more`)}`);
        }
    }
    if (parsedSchema.enums.length > 0) {
        console.log('');
        console.log(`${colors.bold('Types:')}`);
        for (const e of parsedSchema.enums.slice(0, 5)) {
            console.log(`  ${colors.yellow('+')} ${e.name} ${colors.muted(`(${e.values.length} values)`)}`);
        }
        if (parsedSchema.enums.length > 5) {
            console.log(`  ${colors.muted(`... and ${parsedSchema.enums.length - 5} more`)}`);
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
    }).map(table => ({
        ...table,
        columns: table.columns.filter(col => {
            if (isColumnIgnored(table.name, col.name, ignorePatterns).ignored) {
                ignoredCount++;
                return false;
            }
            return true;
        }),
        indexes: table.indexes.filter(idx => {
            if (isIndexIgnored(table.name, idx.name, ignorePatterns).ignored) {
                ignoredCount++;
                return false;
            }
            return true;
        }),
        constraints: table.constraints.filter(con => {
            if (isConstraintIgnored(table.name, con.name, ignorePatterns).ignored) {
                ignoredCount++;
                return false;
            }
            return true;
        }),
    }));
    const filteredEnums = parsedSchema.enums.filter(e => { if (isEnumIgnored(e.name, ignorePatterns).ignored) {
        ignoredCount++;
        return false;
    } return true; });
    const filteredDomains = parsedSchema.domains.filter(d => { if (isDomainIgnored(d.name, ignorePatterns).ignored) {
        ignoredCount++;
        return false;
    } return true; });
    const filteredSequences = parsedSchema.sequences.filter(s => { if (isSequenceIgnored(s.name, ignorePatterns).ignored) {
        ignoredCount++;
        return false;
    } return true; });
    const filteredFunctions = functions.filter(f => { if (isFunctionIgnored(f.name, ignorePatterns).ignored) {
        ignoredCount++;
        return false;
    } return true; });
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
            columns: t.columns.map(c => ({ name: c.name, type: c.type, default: c.defaultValue })),
        })),
        enums: parsedSchema.enums,
        domains: parsedSchema.domains,
        sequences: parsedSchema.sequences,
        compositeTypes: [],
    }, ignorePatterns);
    if (dependencyErrors.length > 0) {
        spin.stop('Done');
        const errorMessages = dependencyErrors.map(e => e.message).join('\n  ');
        fatal('Dependency validation failed', `${errorMessages}\n\nEither un-ignore the type or add the column to .relqignore`);
        return;
    }
    const incomingSchema = convertToNormalizedSchema(filteredSchema, filteredFunctions, triggers);
    const existingSnapshot = loadSnapshot(projectRoot);
    let mergedSchema;
    if (existingSnapshot && !force) {
        spin.start('Detecting changes');
        mergedSchema = mergeSchemas(existingSnapshot, incomingSchema);
        spin.stop('Done');
    }
    else {
        mergedSchema = incomingSchema;
        if (!existingSnapshot) {
            console.log(`${colors.cyan('First import')} - creating initial snapshot`);
        }
    }
    spin.start('Generating TypeScript schema');
    const astSchema = normalizedToParsedSchema({
        tables: mergedSchema.tables.map(t => ({
            name: t.name,
            schema: t.schema,
            columns: t.columns.map(c => ({
                name: c.name, type: c.type, nullable: c.nullable, default: c.default,
                primaryKey: c.primaryKey, unique: c.unique, check: c.check,
                checkName: c.checkName, references: c.references,
                comment: c.comment, isGenerated: c.isGenerated,
                generatedExpression: c.generationExpression,
                generatedExpressionAst: c.generatedExpressionAst,
            })),
            indexes: t.indexes.map(i => ({
                name: i.name, columns: i.columns, unique: i.unique, type: i.type,
                definition: i.definition, whereClause: i.whereClause,
                whereClauseAst: i.whereClauseAst,
            })),
            constraints: t.constraints?.map(c => ({
                name: c.name, type: c.type, columns: c.columns,
                definition: c.definition, references: c.references,
            })),
            isPartitioned: t.isPartitioned, partitionType: t.partitionType,
            partitionKey: t.partitionKey, comment: t.comment,
        })),
        enums: mergedSchema.enums.map(e => ({ name: e.name, schema: e.schema, values: e.values })),
        domains: mergedSchema.domains?.map(d => ({
            name: d.name, baseType: d.baseType, notNull: d.notNull,
            default: d.default ?? undefined, check: d.check ?? undefined,
            checkName: d.checkName,
        })),
        sequences: mergedSchema.sequences?.map(s => ({
            name: s.name, start: s.start, increment: s.increment,
            minValue: s.minValue, maxValue: s.maxValue,
            cache: s.cache, cycle: s.cycle,
        })),
        extensions: mergedSchema.extensions?.map(e => e.name),
        functions: includeFunctions ? mergedSchema.functions?.map(f => ({
            name: f.name, schema: f.schema, args: f.args || [],
            returnType: f.returnType, language: f.language, body: f.body,
            volatility: f.volatility, isStrict: f.isStrict, securityDefiner: f.securityDefiner,
        })) : [],
        triggers: includeTriggers ? mergedSchema.triggers?.map(t => ({
            name: t.name, table: t.table, timing: t.timing, events: t.events,
            level: t.level, functionName: t.functionName, when: t.when,
        })) : [],
    });
    assignTrackingIds(astSchema);
    const finalTypescriptContent = generateTypeScriptFromAST(astSchema, {
        camelCase: true,
        importPath: builderImportPath,
        includeFunctions: false,
        includeTriggers: false,
    });
    spin.stop('Generated TypeScript schema');
    if (dryRun) {
        console.log('');
        console.log(`${colors.yellow('Dry run')} - no files written`);
        console.log('');
        const dryRunOutputPath = options.output || getSchemaPath(config);
        const dryRunAbsPath = path.resolve(projectRoot, dryRunOutputPath);
        console.log(`Would write:`);
        console.log(`  ${colors.cyan(dryRunAbsPath)} ${colors.muted(`(${formatBytes(finalTypescriptContent.length)})`)}`);
        console.log(`  ${colors.cyan(path.join(projectRoot, '.relq/snapshot.json'))}`);
        console.log('');
        return;
    }
    const outputPath = options.output || getSchemaPath(config);
    const absoluteOutputPath = path.resolve(projectRoot, outputPath);
    const outputDir = path.dirname(absoluteOutputPath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(absoluteOutputPath, finalTypescriptContent, 'utf-8');
    console.log(`Written ${colors.cyan(absoluteOutputPath)} ${colors.muted(`(${formatBytes(finalTypescriptContent.length)})`)}`);
    if (includeFunctions && astSchema.functions.length > 0) {
        const schemaBaseName = path.basename(absoluteOutputPath, '.ts');
        const functionsPath = path.join(outputDir, `${schemaBaseName}.functions.ts`);
        const functionsCode = generateFunctionsFile(astSchema, {
            camelCase: true,
            importPath: builderImportPath,
            schemaImportPath: `./${schemaBaseName}`,
        });
        if (functionsCode) {
            fs.writeFileSync(functionsPath, functionsCode, 'utf-8');
            console.log(`Written ${colors.cyan(functionsPath)} ${colors.muted(`(${formatBytes(functionsCode.length)})`)}`);
        }
    }
    if (includeTriggers && astSchema.triggers.length > 0) {
        const schemaBaseName = path.basename(absoluteOutputPath, '.ts');
        const triggersPath = path.join(outputDir, `${schemaBaseName}.triggers.ts`);
        const triggersCode = generateTriggersFile(astSchema, {
            camelCase: true,
            importPath: builderImportPath,
            schemaImportPath: `./${schemaBaseName}`,
            functionsImportPath: `./${schemaBaseName}.functions`,
        });
        if (triggersCode) {
            fs.writeFileSync(triggersPath, triggersCode, 'utf-8');
            console.log(`Written ${colors.cyan(triggersPath)} ${colors.muted(`(${formatBytes(triggersCode.length)})`)}`);
        }
    }
    saveSnapshot(mergedSchema, projectRoot);
    if (toDb && config?.connection) {
        await executeSqlToDatabase(sqlContent, config, dryRun);
    }
    console.log('');
    console.log('Import successful.');
    if (toDb) {
        console.log(`SQL executed to ${detectDialect(config)} database.`);
    }
    console.log('');
}
async function executeSqlToDatabase(sqlContent, config, dryRun) {
    const spin = p.spinner();
    const dialect = detectDialect(config);
    console.log('');
    if (isValidDialect(dialect) && dialect !== 'postgres') {
        const validDialect = dialect;
        if (hasDialectIncompatibilities(sqlContent, validDialect)) {
            const validation = validateForDialect(sqlContent, validDialect, { location: 'SQL execution' });
            if (!validation.valid) {
                console.log('');
                console.log(formatDialectErrors(validation, { showTransform: true }));
                fatal(`SQL is not compatible with ${validDialect.toUpperCase()}`);
            }
            if (validation.warnings.length > 0) {
                console.log(formatDialectErrors({ valid: true, dialect: validDialect, errors: [], warnings: validation.warnings }));
            }
        }
    }
    if (dryRun) {
        console.log(`${colors.yellow('Dry run')} - SQL will not be executed`);
        return;
    }
    spin.start(`Executing SQL to ${dialect} database...`);
    const dbClient = await createDatabaseClient(config);
    let tx = null;
    try {
        try {
            tx = await dbClient.beginTransaction();
        }
        catch (txError) {
            if (!txError.message?.includes('not supported'))
                throw txError;
        }
        const executeQuery = tx
            ? (sql) => tx.query(sql)
            : (sql) => dbClient.query(sql);
        const statements = splitSqlStatements(sqlContent);
        let statementsRun = 0;
        for (const stmt of statements) {
            if (stmt.trim()) {
                try {
                    await executeQuery(stmt);
                    statementsRun++;
                }
                catch (stmtError) {
                    const err = new Error(stmtError.message);
                    err.failedStatement = stmt.substring(0, 200) + (stmt.length > 200 ? '...' : '');
                    throw err;
                }
            }
        }
        if (tx)
            await tx.commit();
        spin.stop(`Executed ${statementsRun} SQL statement(s) to ${dialect} database`);
    }
    catch (error) {
        if (tx) {
            try {
                await tx.rollback();
            }
            catch { }
        }
        spin.stop('SQL execution failed');
        let errorMsg = `${colors.red('SQL Error:')} ${error.message}\n`;
        if (error.failedStatement) {
            errorMsg += `\n${colors.yellow('Failed Statement:')}\n  ${error.failedStatement}\n`;
        }
        fatal('Failed to execute SQL to database', errorMsg);
    }
    finally {
        await dbClient.close();
    }
}
function splitSqlStatements(sql) {
    const statements = [];
    let current = '';
    let inDollarQuote = false;
    let dollarTag = '';
    for (const line of sql.split('\n')) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('--'))
            continue;
        if (!inDollarQuote) {
            const dollarMatch = line.match(/\$([a-zA-Z_]*)\$/);
            if (dollarMatch) {
                inDollarQuote = true;
                dollarTag = dollarMatch[0];
            }
        }
        else {
            if (line.includes(dollarTag)) {
                inDollarQuote = false;
                dollarTag = '';
            }
        }
        current += line + '\n';
        if (!inDollarQuote && trimmedLine.endsWith(';')) {
            const stmt = current.trim();
            if (stmt && stmt !== ';')
                statements.push(stmt);
            current = '';
        }
    }
    const remaining = current.trim();
    if (remaining && remaining !== ';')
        statements.push(remaining);
    return statements;
}
function toCamelCase(str) {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}
function convertToNormalizedSchema(parsed, functions = [], triggers = []) {
    const regularViews = parsed.views.filter(v => !v.isMaterialized);
    const materializedViews = parsed.views.filter(v => v.isMaterialized);
    return {
        extensions: parsed.extensions.map(ext => ({ name: ext })),
        enums: parsed.enums.map(e => ({ name: e.name, schema: e.schema || 'public', values: e.values })),
        domains: parsed.domains.map(d => ({
            name: d.name, schema: d.schema || 'public', baseType: d.baseType,
            notNull: d.notNull || false, default: d.defaultValue || null, check: d.checkExpression || null,
        })),
        compositeTypes: [],
        sequences: parsed.sequences.map(s => ({
            name: s.name, schema: s.schema || 'public', dataType: 'bigint',
            startValue: s.startValue || 1, increment: s.increment || 1,
            minValue: s.minValue || null, maxValue: s.maxValue || null,
            cache: s.cache || 1, cycle: s.cycle || false,
            ownedBy: s.ownedBy ? `${s.ownedBy.table}.${s.ownedBy.column}` : null,
        })),
        collations: [],
        tables: parsed.tables.map(t => ({
            name: t.name, schema: t.schema || 'public',
            columns: t.columns.map(c => {
                const col = {
                    name: c.name, tsName: toCamelCase(c.name), type: c.type,
                    nullable: c.isNullable, default: c.defaultValue, primaryKey: c.isPrimaryKey,
                    unique: c.isUnique, isGenerated: c.isGenerated,
                    generationExpression: c.generatedExpression,
                    generatedExpressionAst: c.generatedExpressionAst,
                };
                return col;
            }),
            indexes: t.indexes.map(idx => ({
                name: idx.name, columns: idx.columns, unique: idx.isUnique,
                type: idx.method || 'btree',
                definition: idx.expressions?.join(', ') || idx.columns.join(', '),
                whereClause: idx.whereClause, whereClauseAst: idx.whereClauseAst,
                expression: idx.expressions?.[0],
            })),
            constraints: t.constraints.map(c => {
                const base = {
                    name: c.name, type: c.type,
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
                }
                if (c.type === 'CHECK' && c.expression)
                    base.checkExpression = c.expression;
                return base;
            }),
            isPartitioned: t.isPartitioned, partitionType: t.partitionType, partitionKey: t.partitionKey,
        })),
        functions: functions.map(f => ({
            name: f.name, returnType: f.returnType, argTypes: f.argTypes, language: f.language,
        })),
        triggers: triggers.map(t => ({
            name: t.name, table: t.tableName, events: [t.event],
            timing: t.timing,
            forEach: (t.forEach || 'ROW'),
            functionName: t.functionName || '',
        })),
        views: regularViews.map(v => ({ name: v.name, schema: v.schema || 'public', definition: v.definition })),
        materializedViews: materializedViews.map(mv => ({ name: mv.name, schema: mv.schema || 'public', definition: mv.definition, withData: true })),
    };
}
function mergeSchemas(existing, incoming) {
    function mergeByName(existingArr, incomingArr) {
        const resultMap = new Map();
        for (const item of existingArr)
            resultMap.set(item.name, item);
        for (const item of incomingArr)
            resultMap.set(item.name, item);
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
export default defineCommand({
    meta: { name: 'import', description: 'Import SQL file into schema' },
    args: {
        file: { type: 'positional', description: 'SQL file to import', required: true },
        output: { type: 'string', description: 'Output schema file path' },
        db: { type: 'boolean', description: 'Execute SQL against database' },
        live: { type: 'boolean', description: 'Alias for --db' },
        force: { type: 'boolean', description: 'Overwrite existing schema' },
        'dry-run': { type: 'boolean', description: 'Preview changes' },
        'include-functions': { type: 'boolean', description: 'Include functions' },
        'include-triggers': { type: 'boolean', description: 'Include triggers' },
    },
    async run({ args }) {
        const { config, projectRoot } = await buildContext({ requireConfig: false });
        const sqlFilePath = args.file;
        if (!sqlFilePath) {
            fatal('No SQL file specified', 'Usage: relq import <sql-file>');
        }
        await runImport(sqlFilePath, {
            output: args.output,
            includeFunctions: args['include-functions'] === true,
            includeTriggers: args['include-triggers'] === true,
            force: args.force === true,
            dryRun: args['dry-run'] === true,
            toDb: args.db === true || args.live === true,
        }, projectRoot, config);
    },
});
