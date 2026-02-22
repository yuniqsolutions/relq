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
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const p = __importStar(require("@clack/prompts"));
const citty_1 = require("citty");
const sql_parser_1 = require("../utils/sql-parser.cjs");
const ast_codegen_1 = require("../utils/ast-codegen.cjs");
const ast_transformer_1 = require("../utils/ast-transformer.cjs");
const config_1 = require("../../config/config.cjs");
const dialect_router_1 = require("../utils/dialect-router.cjs");
const database_client_1 = require("../utils/database-client.cjs");
const dialect_validator_1 = require("../utils/dialect-validator.cjs");
const repo_manager_1 = require("../utils/repo-manager.cjs");
const config_loader_1 = require("../utils/config-loader.cjs");
const relqignore_1 = require("../utils/relqignore.cjs");
const context_1 = require("../utils/context.cjs");
const colors_1 = require("../utils/colors.cjs");
const ui_1 = require("../utils/ui.cjs");
const format_1 = require("../utils/format.cjs");
async function runImport(sqlFilePath, options, projectRoot, config) {
    const { includeFunctions = false, includeTriggers = false, force = false, dryRun = false, toDb = false } = options;
    const spin = p.spinner();
    const builderImportPath = (0, dialect_router_1.getBuilderImportPath)((0, dialect_router_1.detectDialect)(config));
    console.log('');
    if (!sqlFilePath) {
        (0, ui_1.fatal)('No SQL file specified', 'Usage: relq import <sql-file>');
        return;
    }
    if (toDb && (!config || !config.connection)) {
        (0, ui_1.fatal)('No database connection configured', 'The --db/--live flag requires a database connection.\n' +
            'Run "relq init" to configure a database connection first.');
        return;
    }
    const absoluteSqlPath = path.resolve(sqlFilePath);
    if (!fs.existsSync(absoluteSqlPath)) {
        (0, ui_1.fatal)(`File not found: ${absoluteSqlPath}`);
    }
    const sqlContent = fs.readFileSync(absoluteSqlPath, 'utf-8');
    if (!sqlContent.trim()) {
        (0, ui_1.fatal)('SQL file is empty');
    }
    console.log(`Importing ${colors_1.colors.cyan(path.basename(sqlFilePath))} ${colors_1.colors.muted(`(${(0, format_1.formatBytes)(sqlContent.length)})`)}`);
    console.log('');
    if (!(0, repo_manager_1.isInitialized)(projectRoot)) {
        (0, repo_manager_1.initRepository)(projectRoot);
        console.log(`Initialized .relq repository`);
        console.log('');
    }
    spin.start('Parsing SQL schema');
    const parsedSchema = await (0, ast_transformer_1.parseSQL)(sqlContent);
    const functions = includeFunctions ? (0, sql_parser_1.parseFunctions)(sqlContent) : [];
    const triggers = includeTriggers ? (0, sql_parser_1.parseTriggers)(sqlContent) : [];
    const comments = (0, sql_parser_1.parseComments)(sqlContent);
    spin.stop(`Parsed ${parsedSchema.tables.length} tables, ${parsedSchema.enums.length} enums, ${parsedSchema.extensions.length} extensions`);
    const importConfig = await (0, config_1.loadConfig)();
    if (importConfig?.connection) {
        const detectedDialect = (0, dialect_router_1.detectDialect)(importConfig);
        if ((0, dialect_validator_1.isValidDialect)(detectedDialect) && detectedDialect !== 'postgres') {
            const dialect = detectedDialect;
            const sqlValidation = (0, dialect_validator_1.validateForDialect)(sqlContent, dialect, { location: 'import SQL' });
            const schemaValidation = (0, dialect_validator_1.validateSchemaForDialect)({
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
                console.log((0, dialect_validator_1.formatDialectErrors)(combinedResult));
                (0, ui_1.fatal)(`Imported SQL contains ${dialect.toUpperCase()} incompatibilities`, 'Fix the issues above before importing.');
            }
            if (allWarnings.length > 0) {
                console.log('');
                console.log((0, dialect_validator_1.formatDialectErrors)({ valid: true, dialect, errors: [], warnings: allWarnings }));
            }
        }
    }
    if (parsedSchema.tables.length > 0) {
        console.log('');
        console.log(`${colors_1.colors.bold('Tables:')}`);
        for (const table of parsedSchema.tables.slice(0, 10)) {
            const partInfo = table.isPartitioned ? ` ${colors_1.colors.muted('(partitioned)')}` : '';
            console.log(`  ${colors_1.colors.green('+')} ${table.name} ${colors_1.colors.muted(`(${table.columns.length} columns)`)}${partInfo}`);
        }
        if (parsedSchema.tables.length > 10) {
            console.log(`  ${colors_1.colors.muted(`... and ${parsedSchema.tables.length - 10} more`)}`);
        }
    }
    if (parsedSchema.enums.length > 0) {
        console.log('');
        console.log(`${colors_1.colors.bold('Types:')}`);
        for (const e of parsedSchema.enums.slice(0, 5)) {
            console.log(`  ${colors_1.colors.yellow('+')} ${e.name} ${colors_1.colors.muted(`(${e.values.length} values)`)}`);
        }
        if (parsedSchema.enums.length > 5) {
            console.log(`  ${colors_1.colors.muted(`... and ${parsedSchema.enums.length - 5} more`)}`);
        }
    }
    console.log('');
    const ignorePatterns = (0, relqignore_1.loadRelqignore)(projectRoot);
    let ignoredCount = 0;
    const filteredTables = parsedSchema.tables.filter(table => {
        if ((0, relqignore_1.isTableIgnored)(table.name, ignorePatterns).ignored) {
            ignoredCount++;
            return false;
        }
        return true;
    }).map(table => ({
        ...table,
        columns: table.columns.filter(col => {
            if ((0, relqignore_1.isColumnIgnored)(table.name, col.name, ignorePatterns).ignored) {
                ignoredCount++;
                return false;
            }
            return true;
        }),
        indexes: table.indexes.filter(idx => {
            if ((0, relqignore_1.isIndexIgnored)(table.name, idx.name, ignorePatterns).ignored) {
                ignoredCount++;
                return false;
            }
            return true;
        }),
        constraints: table.constraints.filter(con => {
            if ((0, relqignore_1.isConstraintIgnored)(table.name, con.name, ignorePatterns).ignored) {
                ignoredCount++;
                return false;
            }
            return true;
        }),
    }));
    const filteredEnums = parsedSchema.enums.filter(e => { if ((0, relqignore_1.isEnumIgnored)(e.name, ignorePatterns).ignored) {
        ignoredCount++;
        return false;
    } return true; });
    const filteredDomains = parsedSchema.domains.filter(d => { if ((0, relqignore_1.isDomainIgnored)(d.name, ignorePatterns).ignored) {
        ignoredCount++;
        return false;
    } return true; });
    const filteredSequences = parsedSchema.sequences.filter(s => { if ((0, relqignore_1.isSequenceIgnored)(s.name, ignorePatterns).ignored) {
        ignoredCount++;
        return false;
    } return true; });
    const filteredFunctions = functions.filter(f => { if ((0, relqignore_1.isFunctionIgnored)(f.name, ignorePatterns).ignored) {
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
    const dependencyErrors = (0, relqignore_1.validateIgnoreDependencies)({
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
        (0, ui_1.fatal)('Dependency validation failed', `${errorMessages}\n\nEither un-ignore the type or add the column to .relqignore`);
        return;
    }
    const incomingSchema = convertToNormalizedSchema(filteredSchema, filteredFunctions, triggers);
    const existingSnapshot = (0, repo_manager_1.loadSnapshot)(projectRoot);
    let mergedSchema;
    if (existingSnapshot && !force) {
        spin.start('Detecting changes');
        mergedSchema = mergeSchemas(existingSnapshot, incomingSchema);
        spin.stop('Done');
    }
    else {
        mergedSchema = incomingSchema;
        if (!existingSnapshot) {
            console.log(`${colors_1.colors.cyan('First import')} - creating initial snapshot`);
        }
    }
    spin.start('Generating TypeScript schema');
    const astSchema = (0, ast_transformer_1.normalizedToParsedSchema)({
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
    (0, ast_codegen_1.assignTrackingIds)(astSchema);
    const finalTypescriptContent = (0, ast_codegen_1.generateTypeScriptFromAST)(astSchema, {
        camelCase: true,
        importPath: builderImportPath,
        includeFunctions: false,
        includeTriggers: false,
    });
    spin.stop('Generated TypeScript schema');
    if (dryRun) {
        console.log('');
        console.log(`${colors_1.colors.yellow('Dry run')} - no files written`);
        console.log('');
        const dryRunOutputPath = options.output || (0, config_loader_1.getSchemaPath)(config);
        const dryRunAbsPath = path.resolve(projectRoot, dryRunOutputPath);
        console.log(`Would write:`);
        console.log(`  ${colors_1.colors.cyan(dryRunAbsPath)} ${colors_1.colors.muted(`(${(0, format_1.formatBytes)(finalTypescriptContent.length)})`)}`);
        console.log(`  ${colors_1.colors.cyan(path.join(projectRoot, '.relq/snapshot.json'))}`);
        console.log('');
        return;
    }
    const outputPath = options.output || (0, config_loader_1.getSchemaPath)(config);
    const absoluteOutputPath = path.resolve(projectRoot, outputPath);
    const outputDir = path.dirname(absoluteOutputPath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(absoluteOutputPath, finalTypescriptContent, 'utf-8');
    console.log(`Written ${colors_1.colors.cyan(absoluteOutputPath)} ${colors_1.colors.muted(`(${(0, format_1.formatBytes)(finalTypescriptContent.length)})`)}`);
    if (includeFunctions && astSchema.functions.length > 0) {
        const schemaBaseName = path.basename(absoluteOutputPath, '.ts');
        const functionsPath = path.join(outputDir, `${schemaBaseName}.functions.ts`);
        const functionsCode = (0, ast_codegen_1.generateFunctionsFile)(astSchema, {
            camelCase: true,
            importPath: builderImportPath,
            schemaImportPath: `./${schemaBaseName}`,
        });
        if (functionsCode) {
            fs.writeFileSync(functionsPath, functionsCode, 'utf-8');
            console.log(`Written ${colors_1.colors.cyan(functionsPath)} ${colors_1.colors.muted(`(${(0, format_1.formatBytes)(functionsCode.length)})`)}`);
        }
    }
    if (includeTriggers && astSchema.triggers.length > 0) {
        const schemaBaseName = path.basename(absoluteOutputPath, '.ts');
        const triggersPath = path.join(outputDir, `${schemaBaseName}.triggers.ts`);
        const triggersCode = (0, ast_codegen_1.generateTriggersFile)(astSchema, {
            camelCase: true,
            importPath: builderImportPath,
            schemaImportPath: `./${schemaBaseName}`,
            functionsImportPath: `./${schemaBaseName}.functions`,
        });
        if (triggersCode) {
            fs.writeFileSync(triggersPath, triggersCode, 'utf-8');
            console.log(`Written ${colors_1.colors.cyan(triggersPath)} ${colors_1.colors.muted(`(${(0, format_1.formatBytes)(triggersCode.length)})`)}`);
        }
    }
    (0, repo_manager_1.saveSnapshot)(mergedSchema, projectRoot);
    if (toDb && config?.connection) {
        await executeSqlToDatabase(sqlContent, config, dryRun);
    }
    console.log('');
    console.log('Import successful.');
    if (toDb) {
        console.log(`SQL executed to ${(0, dialect_router_1.detectDialect)(config)} database.`);
    }
    console.log('');
}
async function executeSqlToDatabase(sqlContent, config, dryRun) {
    const spin = p.spinner();
    const dialect = (0, dialect_router_1.detectDialect)(config);
    console.log('');
    if ((0, dialect_validator_1.isValidDialect)(dialect) && dialect !== 'postgres') {
        const validDialect = dialect;
        if ((0, dialect_validator_1.hasDialectIncompatibilities)(sqlContent, validDialect)) {
            const validation = (0, dialect_validator_1.validateForDialect)(sqlContent, validDialect, { location: 'SQL execution' });
            if (!validation.valid) {
                console.log('');
                console.log((0, dialect_validator_1.formatDialectErrors)(validation, { showTransform: true }));
                (0, ui_1.fatal)(`SQL is not compatible with ${validDialect.toUpperCase()}`);
            }
            if (validation.warnings.length > 0) {
                console.log((0, dialect_validator_1.formatDialectErrors)({ valid: true, dialect: validDialect, errors: [], warnings: validation.warnings }));
            }
        }
    }
    if (dryRun) {
        console.log(`${colors_1.colors.yellow('Dry run')} - SQL will not be executed`);
        return;
    }
    spin.start(`Executing SQL to ${dialect} database...`);
    const dbClient = await (0, database_client_1.createDatabaseClient)(config);
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
        let errorMsg = `${colors_1.colors.red('SQL Error:')} ${error.message}\n`;
        if (error.failedStatement) {
            errorMsg += `\n${colors_1.colors.yellow('Failed Statement:')}\n  ${error.failedStatement}\n`;
        }
        (0, ui_1.fatal)('Failed to execute SQL to database', errorMsg);
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
exports.default = (0, citty_1.defineCommand)({
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
        const { config, projectRoot } = await (0, context_1.buildContext)({ requireConfig: false });
        const sqlFilePath = args.file;
        if (!sqlFilePath) {
            (0, ui_1.fatal)('No SQL file specified', 'Usage: relq import <sql-file>');
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
