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
exports.pullCommand = pullCommand;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const config_loader_1 = require("../utils/config-loader.cjs");
const fast_introspect_1 = require("../utils/fast-introspect.cjs");
const type_generator_1 = require("../utils/type-generator.cjs");
const env_loader_1 = require("../utils/env-loader.cjs");
const cli_utils_1 = require("../utils/cli-utils.cjs");
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
async function pullCommand(context) {
    const { config, flags, projectRoot } = context;
    if (!config) {
        (0, cli_utils_1.fatal)('No configuration found', `Run ${cli_utils_1.colors.cyan('relq init')} to create one.`);
    }
    await (0, config_loader_1.requireValidConfig)(config, { calledFrom: 'pull' });
    const connection = config.connection;
    const force = flags['force'] === true;
    const merge = flags['merge'] === true;
    const noCommit = flags['no-commit'] === true;
    const dryRun = flags['dry-run'] === true;
    const author = config.author || 'Relq CLI';
    const schemaPathRaw = typeof config.schema === 'string' ? config.schema : './db/schema.ts';
    const schemaPath = path.resolve(projectRoot, schemaPathRaw);
    const includeFunctions = config.generate?.includeFunctions ?? false;
    const includeTriggers = config.generate?.includeTriggers ?? false;
    const spinner = (0, cli_utils_1.createSpinner)();
    const startTime = Date.now();
    console.log('');
    if (!(0, repo_manager_1.isInitialized)(projectRoot)) {
        (0, repo_manager_1.initRepository)(projectRoot);
        console.log('Initialized .relq folder');
    }
    const stagedChanges = (0, repo_manager_1.getStagedChanges)(projectRoot);
    const unstagedChanges = (0, repo_manager_1.getUnstagedChanges)(projectRoot);
    const hasLocalChanges = stagedChanges.length > 0 || unstagedChanges.length > 0;
    let stashedSchemaContent = null;
    const schemaFileExists = fs.existsSync(schemaPath);
    if (hasLocalChanges) {
        if (force) {
            (0, repo_manager_1.clearWorkingState)(projectRoot);
        }
        else if (merge) {
            if (schemaFileExists) {
                stashedSchemaContent = fs.readFileSync(schemaPath, 'utf-8');
            }
            (0, repo_manager_1.clearWorkingState)(projectRoot);
            console.log(`Stashed local file content for restore after pull`);
        }
        else {
            const hasUnstaged = unstagedChanges.length > 0;
            const hasStaged = stagedChanges.length > 0;
            console.log('');
            if (hasStaged) {
                console.log(`  ${cli_utils_1.colors.green('Staged (uncommitted):')} ${stagedChanges.length} change(s)`);
            }
            if (hasUnstaged) {
                console.log(`  ${cli_utils_1.colors.red('Unstaged:')} ${unstagedChanges.length} change(s)`);
            }
            let errorMsg = 'You have uncommitted changes';
            if (hasUnstaged && hasStaged) {
                errorMsg = 'You have uncommitted and unstaged changes';
            }
            else if (hasUnstaged) {
                errorMsg = 'You have unstaged changes';
            }
            const hint = `Commit first: ${cli_utils_1.colors.cyan('relq add . && relq commit -m "message"')}\nOr merge:    ${cli_utils_1.colors.cyan('relq pull --merge')} (preserve local edits)\nOr force:    ${cli_utils_1.colors.cyan('relq pull --force')} (discard & pull)`;
            (0, cli_utils_1.fatal)(errorMsg, hint);
        }
    }
    try {
        spinner.start('Connecting to database...');
        await (0, repo_manager_1.ensureRemoteTable)(connection);
        spinner.succeed(`Connected to ${cli_utils_1.colors.cyan((0, env_loader_1.getConnectionDescription)(connection))}`);
        spinner.start('Fetching remote commits...');
        const remoteCommits = await (0, repo_manager_1.fetchRemoteCommits)(connection, 100);
        const remoteHead = remoteCommits.length > 0 ? remoteCommits[0].hash : null;
        if (remoteHead) {
            (0, repo_manager_1.setFetchHead)(remoteHead, projectRoot);
        }
        spinner.succeed(`Fetched ${remoteCommits.length} remote commits`);
        spinner.start('Introspecting database...');
        const dbSchema = await (0, fast_introspect_1.fastIntrospectDatabase)(connection, undefined, {
            includeFunctions,
            includeTriggers,
        });
        spinner.succeed(`Found ${dbSchema.tables.length} tables`);
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
                })),
                indexes: t.indexes.map(i => ({
                    name: i.name,
                    columns: i.columns,
                    unique: i.isUnique,
                    type: i.type,
                })),
                constraints: t.constraints.map(c => ({
                    name: c.name,
                    type: c.type,
                    definition: c.definition,
                })),
                isPartitioned: t.isPartitioned,
                partitionType: t.partitionType,
                partitionKey: normalizePartitionKey(t.partitionKey),
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
        console.log('');
        const mergeStatePath = path.join(projectRoot, '.relq', 'MERGE_STATE');
        if (fs.existsSync(mergeStatePath) && !force) {
            (0, cli_utils_1.fatal)('You have unresolved merge conflicts', `Use ${cli_utils_1.colors.cyan('relq resolve')} to see and resolve conflicts\nOr use ${cli_utils_1.colors.cyan('relq pull --force')} to overwrite local`);
        }
        if (schemaExists && localSnapshot && !force) {
            const localTables = new Set(localSnapshot.tables.map(t => t.name));
            const remoteTables = new Set(currentSchema.tables.map(t => t.name));
            const added = [...remoteTables].filter(t => !localTables.has(t));
            const removed = [...localTables].filter(t => !remoteTables.has(t));
            const conflicts = detectObjectConflicts(localSnapshot, currentSchema);
            if (conflicts.length > 0 && !force) {
                const mergeState = {
                    conflicts,
                    remoteSnapshot: currentSchema,
                    createdAt: new Date().toISOString(),
                };
                fs.writeFileSync(mergeStatePath, JSON.stringify(mergeState, null, 2));
                console.log('');
                console.log(`Both local and remote have modified the same objects:`);
                console.log('');
                for (const c of conflicts.slice(0, 10)) {
                    const name = c.parentName ? `${c.parentName}.${c.objectName}` : c.objectName;
                    console.log(`   ${cli_utils_1.colors.red('conflict:')} ${c.objectType.toLowerCase()} ${cli_utils_1.colors.bold(name)}`);
                    console.log(`     ${cli_utils_1.colors.muted(c.description)}`);
                }
                if (conflicts.length > 10) {
                    console.log(`   ${cli_utils_1.colors.muted(`... and ${conflicts.length - 10} more`)}`);
                }
                (0, cli_utils_1.fatal)('Automatic merge failed; fix conflicts and then commit', `${cli_utils_1.colors.cyan('relq resolve --theirs <name>')}  Take remote version\n${cli_utils_1.colors.cyan('relq resolve --all-theirs')}     Take all remote\n${cli_utils_1.colors.cyan('relq pull --force')}             Force overwrite local`);
            }
            if (added.length === 0 && removed.length === 0) {
                console.log('Already up to date with remote');
                console.log('');
                return;
            }
            console.log(`${cli_utils_1.colors.yellow('Remote has changes:')}`);
            if (added.length > 0) {
                console.log(`   ${cli_utils_1.colors.green(`+${added.length}`)} tables added`);
            }
            if (removed.length > 0) {
                console.log(`   ${cli_utils_1.colors.red(`-${removed.length}`)} tables removed`);
            }
            console.log('');
            if (!dryRun) {
                const proceed = await (0, cli_utils_1.confirm)(`${cli_utils_1.colors.bold('Pull these changes?')}`, true);
                if (!proceed) {
                    (0, cli_utils_1.fatal)('Operation cancelled by user');
                }
                console.log('');
            }
        }
        else if (schemaExists && !force) {
            (0, cli_utils_1.warning)('Local schema exists but not tracked');
            console.log('');
            console.log(`   ${cli_utils_1.colors.cyan(schemaPath)}`);
            console.log('');
            if (!dryRun) {
                const proceed = await (0, cli_utils_1.confirm)(`${cli_utils_1.colors.bold('Overwrite local schema?')}`, false);
                if (!proceed) {
                    (0, cli_utils_1.fatal)('Operation cancelled by user', `Run ${cli_utils_1.colors.cyan('relq status')} to see current state.`);
                }
                console.log('');
            }
        }
        else if (!schemaExists) {
            console.log('First pull - creating schema');
            console.log('');
            const indexCount = filteredTables.reduce((sum, t) => sum + (t.indexes?.filter(i => !i.isPrimary).length || 0), 0);
            const partitionCount = filteredTables.filter(t => t.isPartitioned).length;
            const tableCommentCount = filteredTables.filter(t => t.comment).length;
            const columnCommentCount = filteredTables.reduce((sum, t) => sum + t.columns.filter(c => c.comment).length, 0);
            console.log('Schema Summary:');
            console.log(`   ${cli_utils_1.colors.green(String(filteredTables.length))} tables`);
            if (indexCount > 0)
                console.log(`   ${cli_utils_1.colors.green(String(indexCount))} indexes`);
            if (partitionCount > 0)
                console.log(`   ${cli_utils_1.colors.green(String(partitionCount))} partitioned tables`);
            if (tableCommentCount > 0)
                console.log(`   ${cli_utils_1.colors.green(String(tableCommentCount))} table comments`);
            if (columnCommentCount > 0)
                console.log(`   ${cli_utils_1.colors.green(String(columnCommentCount))} column comments`);
            if (dbSchema.extensions.length > 0)
                console.log(`   ${cli_utils_1.colors.green(String(dbSchema.extensions.length))} extensions`);
            console.log('');
        }
        if (dryRun) {
            console.log('Dry run - no files written');
            console.log('');
            return;
        }
        spinner.start('Generating TypeScript schema...');
        const typescript = (0, type_generator_1.generateTypeScript)(dbSchema, {
            includeDefineTables: true,
            includeSchema: true,
            includeIndexes: true,
            includeFunctions,
            includeTriggers,
            camelCase: config.generate?.camelCase ?? true,
        });
        spinner.succeed('Generated TypeScript schema');
        const schemaDir = path.dirname(schemaPath);
        if (!fs.existsSync(schemaDir)) {
            fs.mkdirSync(schemaDir, { recursive: true });
        }
        spinner.start('Writing schema file...');
        fs.writeFileSync(schemaPath, typescript, 'utf-8');
        const fileSize = Buffer.byteLength(typescript, 'utf8');
        spinner.succeed(`Written ${cli_utils_1.colors.cyan(schemaPath)} ${cli_utils_1.colors.muted(`(${(0, cli_utils_1.formatBytes)(fileSize)})`)}`);
        const fileHash = (0, repo_manager_1.hashFileContent)(typescript);
        (0, repo_manager_1.saveFileHash)(fileHash, projectRoot);
        const oldSnapshot = (0, repo_manager_1.loadSnapshot)(projectRoot);
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
            triggers: oldSnapshot.triggers || [],
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
        const schemaChanges = (0, schema_comparator_1.compareSchemas)(beforeSchema, afterSchema);
        (0, repo_manager_1.saveSnapshot)(currentSchema, projectRoot);
        const duration = Date.now() - startTime;
        if (noCommit) {
            if (schemaChanges.length > 0) {
                (0, repo_manager_1.addUnstagedChanges)(schemaChanges, projectRoot);
                spinner.succeed(`Detected ${schemaChanges.length} schema change(s)`);
            }
            console.log('');
            console.log(`Pull completed in ${(0, cli_utils_1.formatDuration)(duration)}`);
            if (schemaChanges.length > 0) {
                console.log('');
                console.log(`${cli_utils_1.colors.green(String(schemaChanges.length))} change(s) ready to stage`);
                console.log(`hint: run ${cli_utils_1.colors.cyan("'relq add .'")} to stage all changes`);
            }
            else {
                console.log('Already up to date');
            }
        }
        else {
            const connectionDesc = (0, env_loader_1.getConnectionDescription)(connection);
            const commitMessage = `pull: sync from ${connectionDesc}`;
            const commit = (0, repo_manager_1.createCommit)(currentSchema, author, commitMessage, projectRoot);
            (0, repo_manager_1.clearWorkingState)(projectRoot);
            console.log('');
            console.log(`Pull completed in ${(0, cli_utils_1.formatDuration)(duration)}`);
            console.log('');
            console.log(`${cli_utils_1.colors.yellow('→')} ${(0, repo_manager_1.shortHash)(commit.hash)} ${commitMessage}`);
            console.log(`  ${cli_utils_1.colors.green(String(commit.stats.tables))} tables, ${cli_utils_1.colors.green(String(commit.stats.columns))} columns`);
            if (stashedSchemaContent) {
                fs.writeFileSync(schemaPath, stashedSchemaContent, 'utf-8');
                console.log('');
                console.log(`${cli_utils_1.colors.yellow('Restored')} local schema file content`);
                console.log(`hint: run ${cli_utils_1.colors.cyan("'relq add .'")} to detect changes against the new snapshot`);
            }
        }
        console.log('');
    }
    catch (err) {
        spinner.fail('Pull failed');
        (0, cli_utils_1.fatal)(err instanceof Error ? err.message : String(err));
    }
}
function detectObjectConflicts(local, remote) {
    const conflicts = [];
    for (const localTable of local.tables) {
        const remoteTable = remote.tables.find(t => t.name === localTable.name);
        if (!remoteTable)
            continue;
        for (const localCol of localTable.columns) {
            const remoteCol = remoteTable.columns.find(c => c.name === localCol.name);
            if (!remoteCol)
                continue;
            if (localCol.type !== remoteCol.type) {
                conflicts.push({
                    objectType: 'COLUMN',
                    objectName: localCol.name,
                    parentName: localTable.name,
                    localValue: localCol.type,
                    remoteValue: remoteCol.type,
                    description: `Type changed: ${localCol.type} → ${remoteCol.type}`,
                });
            }
            else if (localCol.nullable !== remoteCol.nullable) {
                conflicts.push({
                    objectType: 'COLUMN',
                    objectName: localCol.name,
                    parentName: localTable.name,
                    localValue: localCol.nullable,
                    remoteValue: remoteCol.nullable,
                    description: `Nullable changed: ${localCol.nullable} → ${remoteCol.nullable}`,
                });
            }
            else if (String(localCol.default || '') !== String(remoteCol.default || '')) {
                if (localCol.default && remoteCol.default && localCol.default !== remoteCol.default) {
                    conflicts.push({
                        objectType: 'COLUMN',
                        objectName: localCol.name,
                        parentName: localTable.name,
                        localValue: localCol.default,
                        remoteValue: remoteCol.default,
                        description: `Default changed`,
                    });
                }
            }
        }
    }
    for (const localEnum of local.enums) {
        const remoteEnum = remote.enums.find(e => e.name === localEnum.name);
        if (!remoteEnum)
            continue;
        const localVals = JSON.stringify(localEnum.values.sort());
        const remoteVals = JSON.stringify(remoteEnum.values.sort());
        if (localVals !== remoteVals) {
            conflicts.push({
                objectType: 'ENUM',
                objectName: localEnum.name,
                localValue: localEnum.values,
                remoteValue: remoteEnum.values,
                description: `Values differ`,
            });
        }
    }
    return conflicts;
}
