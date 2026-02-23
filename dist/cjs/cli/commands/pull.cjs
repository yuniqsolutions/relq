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
exports.runPull = runPull;
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const citty_1 = require("citty");
const p = __importStar(require("@clack/prompts"));
const context_1 = require("../utils/context.cjs");
const colors_1 = require("../utils/colors.cjs");
const ui_1 = require("../utils/ui.cjs");
const format_1 = require("../utils/format.cjs");
const config_loader_1 = require("../utils/config-loader.cjs");
const dialect_introspect_1 = require("../utils/dialect-introspect.cjs");
const dialect_router_1 = require("../utils/dialect-router.cjs");
const ast_transformer_1 = require("../utils/ast-transformer.cjs");
const ast_codegen_1 = require("../utils/ast-codegen.cjs");
const schema_to_ast_1 = require("../utils/schema-to-ast.cjs");
const types_manager_1 = require("../utils/types-manager.cjs");
const env_loader_1 = require("../utils/env-loader.cjs");
const dialect_validator_1 = require("../utils/dialect-validator.cjs");
const relqignore_1 = require("../utils/relqignore.cjs");
const repo_manager_1 = require("../utils/repo-manager.cjs");
const schema_comparator_1 = require("../utils/schema-comparator.cjs");
function toCamelCase(str) {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}
function normalizePartitionKey(partitionKey) {
    if (!partitionKey)
        return undefined;
    if (Array.isArray(partitionKey)) {
        return partitionKey;
    }
    if (typeof partitionKey === 'string') {
        return partitionKey
            .replace(/^\{|\}$/g, '')
            .split(',')
            .map(k => k.trim())
            .filter(Boolean);
    }
    return undefined;
}
function parseSchemaFileForSnapshot(schemaPath) {
    if (!fs.existsSync(schemaPath)) {
        return null;
    }
    const content = fs.readFileSync(schemaPath, 'utf-8');
    const tables = [];
    const tableRegex = /defineTable\s*\(\s*['"]([^'"]+)['"],\s*\{([\s\S]*?)\}(?:\s*,\s*\{([\s\S]*?)\})?\s*\)/g;
    let tableMatch;
    while ((tableMatch = tableRegex.exec(content)) !== null) {
        const tableName = tableMatch[1];
        const columnsBlock = tableMatch[2];
        const optionsBlock = tableMatch[3] || '';
        const columns = [];
        const typePattern = 'varchar|text|uuid|integer|bigint|boolean|timestamp|date|jsonb|json|numeric|serial|bigserial|smallserial|tsvector|smallint|real|doublePrecision|char|inet|cidr|macaddr|macaddr8|interval|time|point|line|lseg|box|path|polygon|circle|bytea|bit|varbit|money|xml|oid';
        const columnRegex = new RegExp(`^\\s*(\\w+):\\s*(${typePattern})(?:\\([^)]*\\))?((?:\\.[a-zA-Z]+\\([^)]*\\))*)`, 'gm');
        let colMatch;
        while ((colMatch = columnRegex.exec(columnsBlock)) !== null) {
            const tsName = colMatch[1];
            const type = colMatch[2];
            const modifiers = colMatch[3] || '';
            const explicitNameMatch = columnsBlock.match(new RegExp(`${tsName}:\\s*${type}\\s*\\(['\"]([^'"]+)['\"]`));
            const dbColName = explicitNameMatch ? explicitNameMatch[1] : tsName;
            columns.push({
                name: dbColName,
                tsName: tsName,
                type: modifiers.includes('.array()') ? `${type}[]` : type,
                nullable: !modifiers.includes('.notNull()') && !modifiers.includes('.primaryKey()'),
                default: null,
                primaryKey: modifiers.includes('.primaryKey()'),
                unique: modifiers.includes('.unique()'),
            });
        }
        const indexes = [];
        const indexRegex = /index\s*\(\s*['"]([^'"]+)['"]\s*\)\.on\(([^)]+)\)/g;
        let idxMatch;
        while ((idxMatch = indexRegex.exec(optionsBlock)) !== null) {
            const indexName = idxMatch[1];
            const indexCols = idxMatch[2].split(',').map(c => c.trim().replace(/table\.\s*/, ''));
            const isUnique = optionsBlock.includes(`index('${indexName}')`) &&
                optionsBlock.substring(optionsBlock.indexOf(`index('${indexName}')`)).split('\n')[0].includes('.unique()');
            indexes.push({
                name: indexName,
                columns: indexCols,
                unique: isUnique,
                type: 'btree',
            });
        }
        const hasPartition = optionsBlock.includes('partitionBy');
        let partitionType;
        let partitionKey = [];
        let partitions = [];
        if (hasPartition) {
            const partitionByMatch = optionsBlock.match(/partitionBy:\s*\([^)]+\)\s*=>\s*\w+\.(list|range|hash)\(([^)]+)\)/i);
            if (partitionByMatch) {
                partitionType = partitionByMatch[1].toUpperCase();
                const colMatch = partitionByMatch[2].match(/table\.(\w+)/);
                if (colMatch) {
                    partitionKey = [colMatch[1]];
                }
            }
            const partitionsMatch = optionsBlock.match(/partitions:\s*\(partition\)\s*=>\s*\[([\s\S]*?)\]/);
            if (partitionsMatch) {
                const partitionsBlock = partitionsMatch[1];
                const partitionRegex = /partition\s*\(\s*['"]([^'"]+)['"]\s*\)\.([^,\n]+)/g;
                let pMatch;
                while ((pMatch = partitionRegex.exec(partitionsBlock)) !== null) {
                    partitions.push({
                        name: pMatch[1],
                        bound: pMatch[2].trim(),
                    });
                }
            }
        }
        tables.push({
            name: tableName,
            schema: 'public',
            columns,
            indexes,
            constraints: [],
            ...(hasPartition && {
                isPartitioned: true,
                partitionType,
                partitionKey,
                partitions,
            }),
        });
    }
    const enums = [];
    const enumRegex = /pgEnum\s*\(\s*['"]([^'"]+)['"]]/g;
    let enumMatch;
    while ((enumMatch = enumRegex.exec(content)) !== null) {
        enums.push(enumMatch[1]);
    }
    return {
        tables,
        enums: [],
        domains: [],
        compositeTypes: [],
        sequences: [],
        collations: [],
        functions: [],
        triggers: [],
        extensions: [],
    };
}
async function runPull(config, projectRoot, opts = {}) {
    const { force = false, dryRun = false, skipPrompt = false } = opts;
    await (0, config_loader_1.requireValidConfig)(config, { calledFrom: 'pull' });
    const connection = config.connection;
    const schemaPathRaw = (0, config_loader_1.getSchemaPath)(config);
    const schemaPath = path.resolve(projectRoot, schemaPathRaw);
    const includeFunctions = config.includeFunctions ?? true;
    const includeTriggers = config.includeTriggers ?? true;
    const dialect = (0, dialect_router_1.detectDialect)(config);
    const builderImportPath = (0, dialect_router_1.getBuilderImportPath)(dialect);
    const spin = p.spinner();
    const startTime = Date.now();
    console.log('');
    if (!(0, repo_manager_1.isInitialized)(projectRoot)) {
        (0, repo_manager_1.initRepository)(projectRoot);
        console.log('Initialized .relq folder');
    }
    const schemaFileExists = fs.existsSync(schemaPath);
    try {
        spin.start('Connecting to database...');
        const { createDatabaseClient } = await Promise.resolve().then(() => __importStar(require("../utils/database-client.cjs")));
        const testClient = await createDatabaseClient(config);
        try {
            await testClient.query('SELECT 1');
        }
        finally {
            await testClient.close();
        }
        spin.stop(`Connected to ${colors_1.colors.cyan((0, env_loader_1.getConnectionDescription)(connection))}`);
        console.log('');
        const adapter = await (0, dialect_router_1.getAdapterByName)(dialect);
        const features = adapter.features;
        const introspectionSteps = [
            { key: 'tables', label: 'tables', supported: true },
            { key: 'columns', label: 'columns', supported: true },
            { key: 'constraints', label: 'constraints', supported: true },
            { key: 'indexes', label: 'indexes', supported: true },
            { key: 'checks', label: 'checks', supported: true },
            { key: 'enums', label: 'enums', supported: features.supportsEnums },
            { key: 'partitions', label: 'partitions', supported: features.supportsTablePartitioning },
            { key: 'extensions', label: 'extensions', supported: true },
            { key: 'functions', label: 'functions', supported: includeFunctions && features.supportsStoredProcedures },
            { key: 'triggers', label: 'triggers', supported: includeTriggers && features.supportsTriggers },
            { key: 'collations', label: 'collations', supported: true },
            { key: 'foreign_servers', label: 'foreign servers', supported: features.supportsForeignTables },
            { key: 'foreign_tables', label: 'foreign tables', supported: features.supportsForeignTables },
            { key: 'types', label: 'types', supported: features.supportsCompositeTypes },
        ];
        const isTTY = process.stdout.isTTY;
        const totalLines = introspectionSteps.length;
        for (const step of introspectionSteps) {
            if (!step.supported) {
                console.log(`  ${colors_1.colors.dim('[-]')} ${colors_1.colors.dim(colors_1.colors.strikethrough(`      ${step.label}`))}`);
            }
            else {
                console.log(`  ${colors_1.colors.yellow('[~]')} ${colors_1.colors.dim(`      ${step.label} waiting`)}`);
            }
        }
        const progressCounts = new Map();
        function updateStepLine(stepKey, count) {
            if (!isTTY)
                return;
            const idx = introspectionSteps.findIndex(s => s.key === stepKey);
            if (idx === -1 || !introspectionSteps[idx].supported)
                return;
            const linesUp = totalLines - idx;
            const countStr = String(count).padStart(5);
            const step = introspectionSteps[idx];
            let line;
            if (count > 0) {
                line = `  ${colors_1.colors.green('[+]')} ${colors_1.colors.green(countStr)} ${step.label} fetched`;
            }
            else {
                line = `  ${colors_1.colors.dim('[·]')} ${colors_1.colors.dim(`${countStr} ${step.label} fetched`)}`;
            }
            process.stdout.write(`\x1b[${linesUp}A\r\x1b[K${line}\x1b[${linesUp}B\r`);
        }
        const dbSchema = await (0, dialect_introspect_1.dialectIntrospect)(config, {
            includeFunctions,
            includeTriggers,
            onDetailedProgress: (update) => {
                if (update.status === 'done') {
                    progressCounts.set(update.step, update.count);
                    updateStepLine(update.step, update.count);
                }
            },
        });
        const typesForProgress = await (0, types_manager_1.getTypesFromDb)(connection);
        progressCounts.set('types', typesForProgress.length);
        updateStepLine('types', typesForProgress.length);
        const ignorePatterns = (0, relqignore_1.loadRelqignore)(projectRoot);
        const filteredTables = dbSchema.tables
            .filter(t => !(0, relqignore_1.isTableIgnored)(t.name, ignorePatterns).ignored)
            .map(t => ({
            ...t,
            columns: t.columns.filter(c => !(0, relqignore_1.isColumnIgnored)(t.name, c.name, ignorePatterns).ignored),
            indexes: t.indexes.filter(i => !(0, relqignore_1.isIndexIgnored)(t.name, i.name, ignorePatterns).ignored),
            constraints: t.constraints.filter(c => !(0, relqignore_1.isConstraintIgnored)(t.name, c.name, ignorePatterns).ignored),
        }));
        const filteredEnums = dbSchema.enums.filter(e => !(0, relqignore_1.isEnumIgnored)(e.name, ignorePatterns).ignored);
        const filteredDomains = dbSchema.domains.filter(d => !(0, relqignore_1.isDomainIgnored)(d.name, ignorePatterns).ignored);
        const filteredCompositeTypes = dbSchema.compositeTypes.filter(c => !(0, relqignore_1.isCompositeTypeIgnored)(c.name, ignorePatterns).ignored);
        const filteredFunctions = includeFunctions
            ? dbSchema.functions.filter(f => !(0, relqignore_1.isFunctionIgnored)(f.name, ignorePatterns).ignored)
            : [];
        const filteredTriggers = includeTriggers
            ? dbSchema.triggers
            : [];
        const filteredCounts = {
            tables: filteredTables.length,
            columns: filteredTables.reduce((sum, t) => sum + t.columns.length, 0),
            constraints: filteredTables.reduce((sum, t) => sum + t.constraints.length, 0),
            indexes: filteredTables.reduce((sum, t) => sum + t.indexes.length, 0),
            checks: filteredTables.reduce((sum, t) => sum + t.constraints.filter(c => c.type === 'CHECK' || c.type === 'c').length, 0),
            enums: filteredEnums.length,
            partitions: filteredTables.filter(t => t.isPartitioned).length,
            extensions: progressCounts.get('extensions') ?? 0,
            functions: filteredFunctions.length,
            triggers: filteredTriggers.length,
            collations: progressCounts.get('collations') ?? 0,
            foreign_servers: progressCounts.get('foreign_servers') ?? 0,
            foreign_tables: progressCounts.get('foreign_tables') ?? 0,
            types: filteredCompositeTypes.length,
        };
        for (const step of introspectionSteps) {
            if (step.supported && filteredCounts[step.key] !== undefined) {
                updateStepLine(step.key, filteredCounts[step.key]);
            }
        }
        if (!isTTY) {
            console.log('');
            for (const step of introspectionSteps) {
                if (!step.supported) {
                    console.log(`  ${colors_1.colors.dim('[-]')} ${colors_1.colors.dim(colors_1.colors.strikethrough(`      ${step.label}`))}`);
                }
                else {
                    const count = filteredCounts[step.key] ?? 0;
                    const countStr = String(count).padStart(5);
                    if (count > 0) {
                        console.log(`  ${colors_1.colors.green('[+]')} ${colors_1.colors.green(countStr)} ${step.label} fetched`);
                    }
                    else {
                        console.log(`  ${colors_1.colors.dim('[·]')} ${colors_1.colors.dim(`${countStr} ${step.label} fetched`)}`);
                    }
                }
            }
        }
        console.log('');
        const localHead = (0, repo_manager_1.getHead)(projectRoot);
        const localSnapshot = (0, repo_manager_1.loadSnapshot)(projectRoot);
        const schemaExists = fs.existsSync(schemaPath);
        const currentSchema = {
            tables: filteredTables.map(t => ({
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
                    maxLength: c.maxLength ?? null,
                    precision: c.precision ?? null,
                    scale: c.scale ?? null,
                    comment: c.comment || undefined,
                    isGenerated: c.isGenerated || false,
                    generationExpression: c.generationExpression ?? null,
                })),
                indexes: t.indexes.map(i => ({
                    name: i.name,
                    columns: i.columns,
                    unique: i.isUnique,
                    type: i.type,
                    definition: i.definition || undefined,
                    whereClause: i.whereClause || undefined,
                    comment: i.comment || undefined,
                })),
                constraints: t.constraints.map(c => ({
                    name: c.name,
                    type: c.type,
                    definition: c.definition,
                })),
                isPartitioned: t.isPartitioned,
                partitionType: t.partitionType,
                partitionKey: normalizePartitionKey(t.partitionKey),
                comment: t.comment || undefined,
                partitions: t.childPartitions?.map((p) => ({
                    name: p.name,
                    bound: p.partitionBound || '',
                    boundType: p.partitionType,
                })) || undefined,
            })),
            enums: filteredEnums.map(e => ({
                name: e.name,
                schema: 'public',
                values: e.values,
            })),
            domains: filteredDomains.map(d => ({
                name: d.name,
                schema: 'public',
                baseType: d.baseType,
                notNull: d.isNotNull || false,
                default: d.defaultValue || null,
                check: d.checkExpression || null,
            })),
            compositeTypes: filteredCompositeTypes.map(c => ({
                name: c.name,
                schema: 'public',
                attributes: c.attributes,
            })),
            sequences: [],
            collations: [],
            functions: filteredFunctions.map(f => ({
                name: f.name,
                returnType: f.returnType,
                argTypes: f.argTypes,
                language: f.language,
            })),
            triggers: filteredTriggers.map(t => ({
                name: t.name,
                table: t.tableName,
                events: [t.event],
                timing: t.timing,
                forEach: 'STATEMENT',
                functionName: t.functionName || '',
            })),
            extensions: dbSchema.extensions.map(ext => ({ name: ext })),
        };
        if (dialect !== 'postgres') {
            const dialectValidation = (0, dialect_validator_1.validateSchemaForDialect)({
                tables: filteredTables.map(t => ({
                    name: t.name,
                    columns: t.columns.map(c => ({
                        name: c.name,
                        type: c.dataType,
                        references: c.references ? { table: String(c.references).split('.')[0] } : undefined,
                    })),
                })),
                functions: filteredFunctions.map(f => ({
                    name: f.name,
                    language: f.language,
                    body: f.definition,
                })),
                triggers: filteredTriggers.map(t => ({ name: t.name })),
                sequences: [],
                extensions: dbSchema.extensions,
            }, dialect);
            if (dialectValidation.warnings.length > 0 || dialectValidation.errors.length > 0) {
                console.log('');
                console.log((0, dialect_validator_1.formatDialectErrors)(dialectValidation));
            }
        }
        console.log('');
        if (schemaExists && localSnapshot && !force) {
            const snapshotTables = Object.values(localSnapshot.tables || {});
            const localForCompare = {
                extensions: Array.isArray(localSnapshot.extensions)
                    ? localSnapshot.extensions
                    : [],
                enums: localSnapshot.enums || [],
                domains: (localSnapshot.domains || []).map((d) => ({
                    name: d.name,
                    baseType: d.baseType,
                    isNotNull: d.isNotNull ?? d.notNull,
                    defaultValue: d.defaultValue ?? d.default,
                    checkExpression: d.checkExpression ?? d.check,
                })),
                compositeTypes: localSnapshot.compositeTypes || [],
                sequences: localSnapshot.sequences || [],
                tables: snapshotTables.map(t => ({
                    name: t.name,
                    schema: t.schema,
                    columns: Object.values(t.columns || {}).map((c) => ({
                        name: c.name,
                        dataType: c.dataType ?? c.type,
                        isNullable: c.isNullable ?? c.nullable ?? false,
                        defaultValue: c.defaultValue ?? c.default ?? null,
                        isPrimaryKey: c.isPrimaryKey ?? c.primaryKey ?? false,
                        isUnique: c.isUnique ?? c.unique ?? false,
                        maxLength: c.maxLength ?? null,
                        precision: c.precision ?? null,
                        scale: c.scale ?? null,
                        comment: c.comment,
                    })),
                    indexes: Object.values(t.indexes || {}).map((i) => ({
                        name: i.name,
                        columns: i.columns,
                        isUnique: i.isUnique ?? i.unique ?? false,
                        type: i.type,
                        comment: i.comment,
                    })),
                    constraints: Object.values(t.constraints || {}),
                    isPartitioned: t.isPartitioned,
                    partitionType: t.partitionType,
                    partitionKey: t.partitionKey,
                    comment: t.comment,
                })),
                functions: localSnapshot.functions || [],
                triggers: (localSnapshot.triggers || []).map((t) => ({
                    name: t.name,
                    tableName: t.tableName ?? t.table,
                    event: t.event ?? t.events?.[0] ?? 'UPDATE',
                    timing: t.timing,
                    forEach: t.forEach || 'STATEMENT',
                    functionName: t.functionName,
                    definition: t.definition || '',
                    isEnabled: true,
                })),
            };
            const remoteForCompare = {
                extensions: dbSchema.extensions || [],
                enums: filteredEnums || [],
                domains: filteredDomains?.map(d => ({
                    name: d.name,
                    baseType: d.baseType,
                    isNotNull: d.isNotNull,
                    defaultValue: d.defaultValue,
                    checkExpression: d.checkExpression,
                })) || [],
                compositeTypes: filteredCompositeTypes || [],
                sequences: [],
                tables: filteredTables.map(t => ({
                    name: t.name,
                    schema: t.schema,
                    columns: t.columns.map(c => ({
                        name: c.name,
                        dataType: c.dataType,
                        isNullable: c.isNullable,
                        defaultValue: c.defaultValue,
                        isPrimaryKey: c.isPrimaryKey,
                        isUnique: c.isUnique,
                        comment: c.comment,
                    })),
                    indexes: t.indexes.map(i => ({
                        name: i.name,
                        columns: i.columns,
                        isUnique: i.isUnique,
                        type: i.type,
                        comment: i.comment,
                    })),
                    constraints: t.constraints || [],
                    isPartitioned: t.isPartitioned,
                    partitionType: t.partitionType,
                    partitionKey: t.partitionKey,
                    comment: t.comment,
                })),
                functions: filteredFunctions || [],
                triggers: filteredTriggers || [],
            };
            const allChanges = await (0, schema_comparator_1.compareSchemas)(localForCompare, remoteForCompare);
            const changeDisplays = [];
            for (const change of allChanges) {
                const objType = change.objectType;
                const changeType = change.type;
                let action;
                if (changeType === 'CREATE')
                    action = 'added';
                else if (changeType === 'DROP')
                    action = 'removed';
                else
                    action = 'modified';
                let type;
                let name;
                if (objType === 'TABLE') {
                    type = 'table';
                    name = change.objectName;
                }
                else if (objType === 'COLUMN') {
                    type = 'column';
                    name = change.parentName ? `${change.parentName}.${change.objectName}` : change.objectName;
                }
                else if (objType === 'INDEX') {
                    type = 'index';
                    name = change.parentName ? `${change.parentName}:${change.objectName}` : change.objectName;
                }
                else if (objType === 'COLUMN_COMMENT') {
                    type = 'column comment';
                    const colName = change.after?.columnName || change.before?.columnName || change.objectName;
                    const tblName = change.after?.tableName || change.before?.tableName || change.parentName;
                    name = tblName ? `${tblName}.${colName}` : colName;
                }
                else if (objType === 'TABLE_COMMENT') {
                    type = 'table comment';
                    name = change.after?.tableName || change.before?.tableName || change.objectName;
                }
                else if (objType === 'INDEX_COMMENT') {
                    type = 'index comment';
                    const idxName = change.after?.indexName || change.before?.indexName || change.objectName;
                    const tblName = change.after?.tableName || change.before?.tableName || change.parentName;
                    name = tblName ? `${tblName}:${idxName}` : idxName;
                }
                else if (objType === 'CONSTRAINT' || objType === 'FOREIGN_KEY' || objType === 'PRIMARY_KEY' || objType === 'CHECK') {
                    type = objType.toLowerCase().replace(/_/g, ' ');
                    name = change.parentName ? `${change.parentName}::${change.objectName}` : change.objectName;
                }
                else if (objType === 'ENUM') {
                    type = 'enum';
                    name = change.objectName;
                }
                else if (objType === 'DOMAIN') {
                    type = 'domain';
                    name = change.objectName;
                }
                else if (objType === 'FUNCTION') {
                    type = 'function';
                    name = change.objectName;
                }
                else if (objType === 'TRIGGER') {
                    type = 'trigger';
                    name = change.objectName;
                }
                else {
                    type = objType.toLowerCase().replace(/_/g, ' ');
                    name = change.objectName;
                }
                changeDisplays.push({ action, type, name });
            }
            if (allChanges.length === 0) {
                let hasSynced = false;
                const typesFilePath = (0, types_manager_1.getTypesFilePath)(schemaPath);
                const typesResult = await (0, types_manager_1.syncTypesFromDb)(connection, typesFilePath);
                if (typesResult.generated && typesResult.typesCount > 0) {
                    console.log(`Synced ${typesResult.typesCount} type(s) from remote`);
                    hasSynced = true;
                }
                if (typesForProgress.length > 0 && fs.existsSync(schemaPath)) {
                    const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
                    const schemaBaseName = path.basename(schemaPath, '.ts');
                    const typesImportPattern = new RegExp(`from\\s+['"]\\./${schemaBaseName}\\.types['"]`);
                    const hasTypesImport = typesImportPattern.test(schemaContent);
                    const typesWithUsages = typesForProgress.filter(t => t.usages && t.usages.length > 0);
                    if (typesWithUsages.length > 0 && !hasTypesImport) {
                        spin.start(`Applying ${typesWithUsages.length} type(s) to schema...`);
                        const columnTypeMap = {};
                        for (const typeDef of typesForProgress) {
                            if (typeDef.usages) {
                                for (const usage of typeDef.usages) {
                                    columnTypeMap[usage] = typeDef.name;
                                }
                            }
                        }
                        const parsedSchema = await (0, ast_transformer_1.introspectedToParsedSchema)(dbSchema);
                        try {
                            const existingModule = await Promise.resolve(`${schemaPath}`).then(s => __importStar(require(s)));
                            const existingAst = (0, schema_to_ast_1.schemaToAST)(existingModule);
                            (0, ast_codegen_1.mergeTrackingIdsFromParsed)(parsedSchema, existingAst);
                        }
                        catch { }
                        (0, ast_codegen_1.assignTrackingIds)(parsedSchema);
                        const typesImportPath = `./${schemaBaseName}.types`;
                        const typescript = (0, ast_codegen_1.generateTypeScriptFromAST)(parsedSchema, {
                            camelCase: config.generate?.camelCase ?? true,
                            importPath: builderImportPath,
                            includeFunctions: false,
                            includeTriggers: false,
                            columnTypeMap,
                            typesImportPath,
                        });
                        fs.writeFileSync(schemaPath, typescript, 'utf-8');
                        spin.stop(`Updated ${colors_1.colors.cyan(schemaPath)} with type annotations`);
                        hasSynced = true;
                    }
                }
                if (!hasSynced) {
                    console.log('Already up to date with remote');
                }
                console.log('');
                return;
            }
            console.log(`${colors_1.colors.yellow('Remote has changes:')}`);
            for (const chg of changeDisplays.slice(0, 15)) {
                let colorFn = colors_1.colors.cyan;
                let prefix = '~';
                if (chg.action === 'added') {
                    colorFn = colors_1.colors.green;
                    prefix = '+';
                }
                else if (chg.action === 'removed') {
                    colorFn = colors_1.colors.red;
                    prefix = '-';
                }
                console.log(`   ${colorFn(prefix)} ${chg.type}: ${colors_1.colors.bold(chg.name)}`);
            }
            if (changeDisplays.length > 15) {
                console.log(`   ${colors_1.colors.muted(`... and ${changeDisplays.length - 15} more`)}`);
            }
            console.log('');
            if (!dryRun && !skipPrompt) {
                console.log(`${colors_1.colors.green('Auto-merging')} (no conflicts detected)`);
                console.log('');
            }
        }
        else if (schemaExists && !force) {
            (0, ui_1.warning)('Local schema exists but no snapshot found');
            console.log('');
            console.log(`   ${colors_1.colors.cyan(schemaPath)}`);
            console.log('');
            if (!dryRun && !skipPrompt) {
                const proceed = await p.confirm({ message: 'Overwrite local schema with database version?', initialValue: true });
                if (p.isCancel(proceed) || !proceed) {
                    (0, repo_manager_1.saveSnapshot)(currentSchema, projectRoot);
                    console.log('');
                    console.log(`Snapshot synced from database (local schema preserved)`);
                    console.log(`hint: run ${colors_1.colors.cyan("'relq diff'")} to see differences`);
                    console.log('');
                    return;
                }
                console.log('');
            }
        }
        else if (!schemaExists) {
            console.log(colors_1.colors.bold('Creating schema') + colors_1.colors.dim(' (first pull)'));
            console.log('');
            const tableCount = filteredTables.length;
            const columnCount = filteredTables.reduce((sum, t) => sum + t.columns.length, 0);
            const indexCount = filteredTables.reduce((sum, t) => sum + (t.indexes?.filter(i => !i.isPrimary).length || 0), 0);
            const partitionedCount = filteredTables.filter(t => t.isPartitioned).length;
            const childPartitionCount = filteredTables.reduce((sum, t) => sum + (t.childPartitions?.length || 0), 0);
            const tableCommentCount = filteredTables.filter(t => t.comment).length;
            const columnCommentCount = filteredTables.reduce((sum, t) => sum + t.columns.filter(c => c.comment).length, 0);
            const indexCommentCount = filteredTables.reduce((sum, t) => sum + t.indexes.filter(i => i.comment).length, 0);
            const summaryItems = [];
            summaryItems.push({ count: tableCount, label: 'tables' });
            summaryItems.push({ count: columnCount, label: 'columns' });
            if (indexCount > 0)
                summaryItems.push({ count: indexCount, label: 'indexes' });
            if (partitionedCount > 0) {
                const partLabel = childPartitionCount > 0
                    ? `partitioned (${childPartitionCount} child partitions)`
                    : 'partitioned';
                summaryItems.push({ count: partitionedCount, label: partLabel });
            }
            if (tableCommentCount > 0 || columnCommentCount > 0 || indexCommentCount > 0) {
                const commentParts = [];
                if (tableCommentCount > 0)
                    commentParts.push(`${tableCommentCount} table`);
                if (columnCommentCount > 0)
                    commentParts.push(`${columnCommentCount} column`);
                if (indexCommentCount > 0)
                    commentParts.push(`${indexCommentCount} index`);
                summaryItems.push({ count: tableCommentCount + columnCommentCount + indexCommentCount, label: `comments (${commentParts.join(', ')})` });
            }
            if (dbSchema.extensions.length > 0)
                summaryItems.push({ count: dbSchema.extensions.length, label: 'extensions' });
            for (const item of summaryItems) {
                const countStr = String(item.count).padStart(4);
                console.log(`${colors_1.colors.green('[+]')} ${colors_1.colors.green(countStr)} ${item.label}`);
            }
            console.log('');
        }
        if (dryRun) {
            console.log('Dry run - no files written');
            console.log('');
            return;
        }
        if (schemaExists && (includeFunctions || includeTriggers)) {
            const existingContent = fs.readFileSync(schemaPath, 'utf-8');
            const hasPgFunction = /\bpgFunction\s*\(/.test(existingContent);
            const hasPgTrigger = /\bpgTrigger\s*\(/.test(existingContent);
            if (hasPgFunction || hasPgTrigger) {
                const items = [];
                if (hasPgFunction)
                    items.push('pgFunction');
                if (hasPgTrigger)
                    items.push('pgTrigger');
                const schemaBaseName = path.basename(schemaPath, '.ts');
                (0, ui_1.fatal)(`Existing schema contains ${items.join(' and ')} definitions`, `Functions and triggers should be in separate files:\n` +
                    `  ${colors_1.colors.cyan(`${schemaBaseName}.functions.ts`)} - for functions\n` +
                    `  ${colors_1.colors.cyan(`${schemaBaseName}.triggers.ts`)} - for triggers\n\n` +
                    `To migrate:\n` +
                    `  1. Move pgFunction definitions to ${schemaBaseName}.functions.ts\n` +
                    `  2. Move pgTrigger definitions to ${schemaBaseName}.triggers.ts\n` +
                    `  3. Run ${colors_1.colors.cyan('relq pull')} again\n\n` +
                    `Or use ${colors_1.colors.cyan('relq pull --force')} to overwrite and regenerate all files.`);
            }
        }
        spin.start('Generating TypeScript schema...');
        const parsedSchema = await (0, ast_transformer_1.introspectedToParsedSchema)(dbSchema);
        if (schemaFileExists) {
            try {
                const existingModule = await Promise.resolve(`${schemaPath}`).then(s => __importStar(require(s)));
                const existingAst = (0, schema_to_ast_1.schemaToAST)(existingModule);
                (0, ast_codegen_1.mergeTrackingIdsFromParsed)(parsedSchema, existingAst);
            }
            catch { }
        }
        (0, ast_codegen_1.assignTrackingIds)(parsedSchema);
        const columnTypeMap = {};
        for (const typeDef of typesForProgress) {
            if (typeDef.usages) {
                for (const usage of typeDef.usages) {
                    columnTypeMap[usage] = typeDef.name;
                }
            }
        }
        const schemaBaseName = path.basename(schemaPath, '.ts');
        const typesImportPath = `./${schemaBaseName}.types`;
        const typescript = (0, ast_codegen_1.generateTypeScriptFromAST)(parsedSchema, {
            camelCase: config.generate?.camelCase ?? true,
            importPath: builderImportPath,
            includeFunctions: false,
            includeTriggers: false,
            columnTypeMap,
            typesImportPath,
        });
        spin.stop('Generated TypeScript schema');
        const schemaDir = path.dirname(schemaPath);
        if (!fs.existsSync(schemaDir)) {
            fs.mkdirSync(schemaDir, { recursive: true });
        }
        spin.start('Writing schema file...');
        fs.writeFileSync(schemaPath, typescript, 'utf-8');
        const fileSize = Buffer.byteLength(typescript, 'utf8');
        spin.stop(`Written ${colors_1.colors.cyan(schemaPath)} ${colors_1.colors.muted(`(${(0, format_1.formatBytes)(fileSize)})`)}`);
        const fileHash = (0, repo_manager_1.hashFileContent)(typescript);
        (0, repo_manager_1.saveFileHash)(fileHash, projectRoot);
        if (includeFunctions && parsedSchema.functions.length > 0) {
            const schemaBaseName = path.basename(schemaPath, '.ts');
            const functionsPath = path.join(schemaDir, `${schemaBaseName}.functions.ts`);
            const functionsCode = (0, ast_codegen_1.generateFunctionsFile)(parsedSchema, {
                camelCase: config.generate?.camelCase ?? true,
                importPath: builderImportPath,
                schemaImportPath: `./${schemaBaseName}`,
            });
            if (functionsCode) {
                fs.writeFileSync(functionsPath, functionsCode, 'utf-8');
                const funcFileSize = Buffer.byteLength(functionsCode, 'utf8');
                spin.start('Writing functions file...');
                spin.stop(`Written ${colors_1.colors.cyan(functionsPath)} ${colors_1.colors.muted(`(${(0, format_1.formatBytes)(funcFileSize)})`)}`);
            }
        }
        if (includeTriggers && parsedSchema.triggers.length > 0) {
            const schemaBaseName = path.basename(schemaPath, '.ts');
            const triggersPath = path.join(schemaDir, `${schemaBaseName}.triggers.ts`);
            const triggersCode = (0, ast_codegen_1.generateTriggersFile)(parsedSchema, {
                camelCase: config.generate?.camelCase ?? true,
                importPath: builderImportPath,
                schemaImportPath: `./${schemaBaseName}`,
                functionsImportPath: `./${schemaBaseName}.functions`,
            });
            if (triggersCode) {
                fs.writeFileSync(triggersPath, triggersCode, 'utf-8');
                const trigFileSize = Buffer.byteLength(triggersCode, 'utf8');
                spin.start('Writing triggers file...');
                spin.stop(`Written ${colors_1.colors.cyan(triggersPath)} ${colors_1.colors.muted(`(${(0, format_1.formatBytes)(trigFileSize)})`)}`);
            }
        }
        const typesFilePath = (0, types_manager_1.getTypesFilePath)(schemaPath);
        const typesResult = await (0, types_manager_1.syncTypesFromDb)(connection, typesFilePath);
        if (typesResult.generated) {
            const typesFileSize = fs.existsSync(typesFilePath) ? fs.statSync(typesFilePath).size : 0;
            if (typesResult.typesCount > 0) {
                spin.start('Writing types file...');
                spin.stop(`Written ${colors_1.colors.cyan(typesFilePath)} ${colors_1.colors.muted(`(${typesResult.typesCount} types, ${(0, format_1.formatBytes)(typesFileSize)})`)}`);
            }
            else {
                spin.start('Writing types file...');
                spin.stop(`Created ${colors_1.colors.cyan(typesFilePath)} ${colors_1.colors.muted('(empty template)')}`);
            }
        }
        const oldSnapshot = (0, repo_manager_1.loadSnapshot)(projectRoot);
        const hadPreviousSnapshot = oldSnapshot !== null;
        const beforeSchema = oldSnapshot ? {
            extensions: oldSnapshot.extensions?.map(e => e.name) || [],
            enums: oldSnapshot.enums || [],
            domains: oldSnapshot.domains?.map(d => ({
                name: d.name,
                baseType: d.baseType,
                isNotNull: d.notNull,
                defaultValue: d.default,
                checkExpression: d.check,
            })) || [],
            compositeTypes: oldSnapshot.compositeTypes || [],
            sequences: oldSnapshot.sequences || [],
            tables: oldSnapshot.tables.map(t => ({
                name: t.name,
                schema: t.schema,
                columns: t.columns.map(c => ({
                    name: c.name,
                    dataType: c.type,
                    isNullable: c.nullable,
                    defaultValue: c.default,
                    isPrimaryKey: c.primaryKey,
                    isUnique: c.unique,
                    comment: c.comment,
                })),
                indexes: t.indexes.map(i => ({
                    name: i.name,
                    columns: i.columns,
                    isUnique: i.unique,
                    type: i.type,
                })),
                constraints: t.constraints || [],
                isPartitioned: t.isPartitioned,
                partitionType: t.partitionType,
                partitionKey: t.partitionKey,
                comment: t.comment,
            })),
            functions: oldSnapshot.functions || [],
            triggers: (oldSnapshot.triggers || []).map(t => ({
                name: t.name,
                tableName: t.table,
                event: t.events?.[0] || 'UPDATE',
                timing: t.timing,
                forEach: t.forEach || 'STATEMENT',
                functionName: t.functionName,
                definition: '',
                isEnabled: true,
            })),
        } : {
            extensions: [],
            enums: [],
            domains: [],
            compositeTypes: [],
            sequences: [],
            tables: [],
            functions: [],
            triggers: [],
        };
        const afterSchema = {
            extensions: dbSchema.extensions || [],
            enums: filteredEnums || [],
            domains: filteredDomains?.map(d => ({
                name: d.name,
                baseType: d.baseType,
                isNotNull: d.isNotNull,
                defaultValue: d.defaultValue,
                checkExpression: d.checkExpression,
            })) || [],
            compositeTypes: filteredCompositeTypes || [],
            sequences: [],
            tables: filteredTables.map(t => ({
                name: t.name,
                schema: t.schema,
                columns: t.columns.map(c => ({
                    name: c.name,
                    dataType: c.dataType,
                    isNullable: c.isNullable,
                    defaultValue: c.defaultValue,
                    isPrimaryKey: c.isPrimaryKey,
                    isUnique: c.isUnique,
                    comment: c.comment,
                })),
                indexes: t.indexes.map(i => ({
                    name: i.name,
                    columns: i.columns,
                    isUnique: i.isUnique,
                    type: i.type,
                })),
                constraints: t.constraints || [],
                isPartitioned: t.isPartitioned,
                partitionType: t.partitionType,
                partitionKey: t.partitionKey,
                childPartitions: t.childPartitions,
                comment: t.comment,
            })),
            functions: filteredFunctions || [],
            triggers: filteredTriggers || [],
        };
        const schemaChanges = await (0, schema_comparator_1.compareSchemas)(beforeSchema, afterSchema);
        (0, ast_codegen_1.copyTrackingIdsToNormalized)(parsedSchema, currentSchema);
        (0, repo_manager_1.saveSnapshot)(currentSchema, projectRoot);
        const duration = Date.now() - startTime;
        console.log('');
        console.log(`Pull completed in ${(0, format_1.formatDuration)(duration)}`);
        if (hadPreviousSnapshot && schemaChanges.length > 0) {
            console.log('');
            console.log(`${colors_1.colors.green(String(schemaChanges.length))} change(s) synced from database`);
            console.log(`hint: run ${colors_1.colors.cyan("'relq diff'")} to review changes`);
            console.log(`hint: run ${colors_1.colors.cyan("'relq push'")} to push local changes to database`);
        }
        else if (!hadPreviousSnapshot) {
            console.log('Schema synced from database');
        }
        else {
            console.log('Already up to date');
        }
        console.log('');
    }
    catch (err) {
        spin.error('Pull failed');
        (0, ui_1.fatal)((0, ui_1.formatError)(err));
    }
}
exports.default = (0, citty_1.defineCommand)({
    meta: { name: 'pull', description: 'Pull schema from database' },
    args: {
        force: { type: 'boolean', description: 'Overwrite without prompting' },
        'dry-run': { type: 'boolean', description: 'Show changes without writing' },
        yes: { type: 'boolean', alias: 'y', description: 'Accept all changes' },
    },
    async run({ args }) {
        const { config, projectRoot } = await (0, context_1.buildContext)();
        await (0, config_loader_1.requireValidConfig)(config, { calledFrom: 'pull' });
        await runPull(config, projectRoot, {
            force: args.force === true,
            dryRun: args['dry-run'] === true,
            skipPrompt: args.yes === true,
        });
    },
});
