import * as fs from 'fs';
import * as path from 'path';
import { requireValidConfig, getSchemaPath } from "../utils/config-loader.js";
import { fastIntrospectDatabase } from "../utils/fast-introspect.js";
import { introspectedToParsedSchema } from "../utils/ast-transformer.js";
import { generateTypeScriptFromAST, assignTrackingIds, copyTrackingIdsToNormalized, generateFunctionsFile, generateTriggersFile } from "../utils/ast-codegen.js";
import { syncTypesFromDb, getTypesFilePath, getTypesFromDb } from "../utils/types-manager.js";
import { getConnectionDescription } from "../utils/env-loader.js";
import { createSpinner, colors, formatBytes, formatDuration, fatal, confirm, warning, createMultiProgress, select } from "../utils/cli-utils.js";
import { loadRelqignore, isTableIgnored, isColumnIgnored, isIndexIgnored, isConstraintIgnored, isEnumIgnored, isDomainIgnored, isCompositeTypeIgnored, isFunctionIgnored, } from "../utils/relqignore.js";
import { isInitialized, initRepository, getHead, saveCommit, saveSnapshot, loadSnapshot, createCommit, shortHash, fetchRemoteCommits, ensureRemoteTable, setFetchHead, addUnstagedChanges, getStagedChanges, getUnstagedChanges, clearWorkingState, hashFileContent, saveFileHash, markCommitAsPulled, getAllCommits, } from "../utils/repo-manager.js";
import { compareSchemas } from "../utils/schema-comparator.js";
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
export async function pullCommand(context) {
    const { config, flags, projectRoot } = context;
    if (!config) {
        fatal('No configuration found', `Run ${colors.cyan('relq init')} to create one.`);
    }
    await requireValidConfig(config, { calledFrom: 'pull' });
    const connection = config.connection;
    const force = flags['force'] === true;
    const merge = flags['merge'] === true;
    const autoCommit = flags['commit'] === true;
    const dryRun = flags['dry-run'] === true;
    const theirs = flags['theirs'] === true;
    const ours = flags['ours'] === true;
    const author = config.author || 'Relq CLI';
    if (theirs && ours) {
        fatal('Cannot use both --theirs and --ours', 'Choose one conflict resolution strategy.');
    }
    const schemaPathRaw = getSchemaPath(config);
    const schemaPath = path.resolve(projectRoot, schemaPathRaw);
    const includeFunctions = config.includeFunctions ?? true;
    const includeTriggers = config.includeTriggers ?? true;
    const spinner = createSpinner();
    const startTime = Date.now();
    console.log('');
    if (!isInitialized(projectRoot)) {
        initRepository(projectRoot);
        console.log('Initialized .relq folder');
    }
    const stagedChanges = getStagedChanges(projectRoot);
    const unstagedChanges = getUnstagedChanges(projectRoot);
    const hasLocalChanges = stagedChanges.length > 0 || unstagedChanges.length > 0;
    let stashedSchemaContent = null;
    const schemaFileExists = fs.existsSync(schemaPath);
    if (hasLocalChanges) {
        if (force) {
            clearWorkingState(projectRoot);
        }
        else if (merge) {
            if (schemaFileExists) {
                stashedSchemaContent = fs.readFileSync(schemaPath, 'utf-8');
            }
            clearWorkingState(projectRoot);
            console.log(`Stashed local file content for restore after pull`);
        }
        else {
            const hasUnstaged = unstagedChanges.length > 0;
            const hasStaged = stagedChanges.length > 0;
            console.log('');
            if (hasStaged) {
                console.log(`  ${colors.green('Staged (uncommitted):')} ${stagedChanges.length} change(s)`);
            }
            if (hasUnstaged) {
                console.log(`  ${colors.red('Unstaged:')} ${unstagedChanges.length} change(s)`);
            }
            let errorMsg = 'You have uncommitted changes';
            if (hasUnstaged && hasStaged) {
                errorMsg = 'You have uncommitted and unstaged changes';
            }
            else if (hasUnstaged) {
                errorMsg = 'You have unstaged changes';
            }
            const hint = `Commit first: ${colors.cyan('relq add . && relq commit -m "message"')}\nOr merge:    ${colors.cyan('relq pull --merge')} (preserve local edits)\nOr force:    ${colors.cyan('relq pull --force')} (discard & pull)`;
            fatal(errorMsg, hint);
        }
    }
    try {
        spinner.start('Connecting to database...');
        await ensureRemoteTable(connection);
        spinner.succeed(`Connected to ${colors.cyan(getConnectionDescription(connection))}`);
        spinner.start('Fetching remote commits...');
        const remoteCommits = await fetchRemoteCommits(connection, 100);
        const remoteHead = remoteCommits.length > 0 ? remoteCommits[0].hash : null;
        if (remoteHead) {
            setFetchHead(remoteHead, projectRoot);
        }
        spinner.succeed(`Fetched ${remoteCommits.length} remote commits`);
        console.log('');
        console.log(colors.bold('Introspecting database...'));
        console.log('');
        const progress = createMultiProgress();
        const progressItems = [
            { id: 'tables', label: 'tables', status: 'pending', count: 0 },
            { id: 'columns', label: 'columns', status: 'pending', count: 0 },
            { id: 'constraints', label: 'constraints', status: 'pending', count: 0 },
            { id: 'indexes', label: 'indexes', status: 'pending', count: 0 },
            { id: 'checks', label: 'checks', status: 'pending', count: 0 },
            { id: 'enums', label: 'enums', status: 'pending', count: 0 },
            { id: 'partitions', label: 'partitions', status: 'pending', count: 0 },
            { id: 'extensions', label: 'extensions', status: 'pending', count: 0 },
            ...(includeFunctions ? [{ id: 'functions', label: 'functions', status: 'pending', count: 0 }] : []),
            ...(includeTriggers ? [{ id: 'triggers', label: 'triggers', status: 'pending', count: 0 }] : []),
            { id: 'collations', label: 'collations', status: 'pending', count: 0 },
            { id: 'foreign_servers', label: 'foreign servers', status: 'pending', count: 0 },
            { id: 'foreign_tables', label: 'foreign tables', status: 'pending', count: 0 },
            { id: 'types', label: 'types', status: 'pending', count: 0 },
        ];
        progress.setItems(progressItems);
        progress.start();
        const dbSchema = await fastIntrospectDatabase(connection, undefined, {
            includeFunctions,
            includeTriggers,
            onDetailedProgress: (update) => {
                progress.updateItem(update.step, { status: update.status, count: update.count });
            },
        });
        progress.updateItem('types', { status: 'fetching', count: 0 });
        const typesForProgress = await getTypesFromDb(connection);
        progress.updateItem('types', { status: 'done', count: typesForProgress.length });
        progress.complete();
        console.log('');
        const ignorePatterns = loadRelqignore(projectRoot);
        const filteredTables = dbSchema.tables
            .filter(t => !isTableIgnored(t.name, ignorePatterns).ignored)
            .map(t => ({
            ...t,
            columns: t.columns.filter(c => !isColumnIgnored(t.name, c.name, ignorePatterns).ignored),
            indexes: t.indexes.filter(i => !isIndexIgnored(t.name, i.name, ignorePatterns).ignored),
            constraints: t.constraints.filter(c => !isConstraintIgnored(t.name, c.name, ignorePatterns).ignored),
        }));
        const filteredEnums = dbSchema.enums.filter(e => !isEnumIgnored(e.name, ignorePatterns).ignored);
        const filteredDomains = dbSchema.domains.filter(d => !isDomainIgnored(d.name, ignorePatterns).ignored);
        const filteredCompositeTypes = dbSchema.compositeTypes.filter(c => !isCompositeTypeIgnored(c.name, ignorePatterns).ignored);
        const filteredFunctions = includeFunctions
            ? dbSchema.functions.filter(f => !isFunctionIgnored(f.name, ignorePatterns).ignored)
            : [];
        const filteredTriggers = includeTriggers
            ? dbSchema.triggers
            : [];
        const localHead = getHead(projectRoot);
        const localSnapshot = loadSnapshot(projectRoot);
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
        console.log('');
        const mergeStatePath = path.join(projectRoot, '.relq', 'MERGE_STATE');
        if (fs.existsSync(mergeStatePath) && !force) {
            fatal('You have unresolved merge conflicts', `Use ${colors.cyan('relq resolve')} to see and resolve conflicts\nOr use ${colors.cyan('relq pull --force')} to overwrite local`);
        }
        if (schemaExists && localSnapshot && !force) {
            const localForCompare = {
                extensions: localSnapshot.extensions?.map(e => e.name) || [],
                enums: localSnapshot.enums || [],
                domains: localSnapshot.domains?.map(d => ({
                    name: d.name,
                    baseType: d.baseType,
                    isNotNull: d.notNull,
                    defaultValue: d.default,
                    checkExpression: d.check,
                })) || [],
                compositeTypes: localSnapshot.compositeTypes || [],
                sequences: localSnapshot.sequences || [],
                tables: localSnapshot.tables.map(t => ({
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
                        comment: i.comment,
                    })),
                    constraints: t.constraints || [],
                    isPartitioned: t.isPartitioned,
                    partitionType: t.partitionType,
                    partitionKey: t.partitionKey,
                    comment: t.comment,
                })),
                functions: localSnapshot.functions || [],
                triggers: localSnapshot.triggers || [],
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
            const allChanges = await compareSchemas(localForCompare, remoteForCompare);
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
                    console.log(`   ${colors.red('conflict:')} ${c.objectType.toLowerCase()} ${colors.bold(name)}`);
                    console.log(`     ${colors.muted(c.description)}`);
                }
                if (conflicts.length > 10) {
                    console.log(`   ${colors.muted(`... and ${conflicts.length - 10} more`)}`);
                }
                fatal('Automatic merge failed; fix conflicts and then commit', `${colors.cyan('relq resolve --theirs <name>')}  Take remote version\n${colors.cyan('relq resolve --all-theirs')}     Take all remote\n${colors.cyan('relq pull --force')}             Force overwrite local`);
            }
            if (allChanges.length === 0) {
                const localCommits = getAllCommits(projectRoot);
                const localHashes = new Set(localCommits.map(c => c.hash));
                const missingCommits = remoteCommits.filter(c => !localHashes.has(c.hash));
                let hasSynced = false;
                if (missingCommits.length > 0) {
                    for (const commit of missingCommits.reverse()) {
                        saveCommit(commit, projectRoot);
                    }
                    console.log(`Synced ${missingCommits.length} commit(s) from remote`);
                    hasSynced = true;
                }
                const typesFilePath = getTypesFilePath(schemaPath);
                const typesResult = await syncTypesFromDb(connection, typesFilePath);
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
                        spinner.start(`Applying ${typesWithUsages.length} type(s) to schema...`);
                        const columnTypeMap = {};
                        for (const typeDef of typesForProgress) {
                            if (typeDef.usages) {
                                for (const usage of typeDef.usages) {
                                    columnTypeMap[usage] = typeDef.name;
                                }
                            }
                        }
                        const parsedSchema = await introspectedToParsedSchema(dbSchema);
                        assignTrackingIds(parsedSchema);
                        const typesImportPath = `./${schemaBaseName}.types`;
                        const typescript = generateTypeScriptFromAST(parsedSchema, {
                            camelCase: config.generate?.camelCase ?? true,
                            importPath: 'relq/schema-builder',
                            includeFunctions: false,
                            includeTriggers: false,
                            columnTypeMap,
                            typesImportPath,
                        });
                        fs.writeFileSync(schemaPath, typescript, 'utf-8');
                        spinner.succeed(`Updated ${colors.cyan(schemaPath)} with type annotations`);
                        hasSynced = true;
                    }
                }
                if (!hasSynced) {
                    console.log('Already up to date with remote');
                }
                console.log('');
                return;
            }
            console.log(`${colors.yellow('Remote has changes:')}`);
            for (const chg of changeDisplays.slice(0, 15)) {
                let colorFn = colors.cyan;
                let prefix = '~';
                if (chg.action === 'added') {
                    colorFn = colors.green;
                    prefix = '+';
                }
                else if (chg.action === 'removed') {
                    colorFn = colors.red;
                    prefix = '-';
                }
                console.log(`   ${colorFn(prefix)} ${chg.type}: ${colors.bold(chg.name)}`);
            }
            if (changeDisplays.length > 15) {
                console.log(`   ${colors.muted(`... and ${changeDisplays.length - 15} more`)}`);
            }
            console.log('');
            const noAutoMerge = flags['no-auto-merge'] === true;
            if (!dryRun && noAutoMerge) {
                const proceed = await confirm(`${colors.bold('Pull these changes?')}`, true);
                if (!proceed) {
                    fatal('Operation cancelled by user');
                }
                console.log('');
            }
            else if (!dryRun) {
                console.log(`${colors.green('Auto-merging')} (no conflicts detected)`);
                console.log('');
            }
        }
        else if (schemaExists && !force) {
            warning('Local schema exists but not tracked');
            console.log('');
            console.log(`   ${colors.cyan(schemaPath)}`);
            console.log('');
            if (!dryRun) {
                if (theirs) {
                    console.log(`${colors.green('Using --theirs:')} Overwriting local schema with database version`);
                    console.log('');
                }
                else if (ours) {
                    console.log(`${colors.yellow('Using --ours:')} Keeping local schema, syncing snapshot from database`);
                    console.log('');
                    saveSnapshot(currentSchema, projectRoot);
                    console.log(`Snapshot synced from database`);
                    console.log('');
                    console.log(`hint: run ${colors.cyan("'relq add .'")} to detect differences between local schema and database`);
                    console.log('');
                    return;
                }
                else {
                    console.log('How would you like to handle this?');
                    console.log('');
                    console.log(`  ${colors.cyan('--theirs')}  Use database version (overwrite local schema)`);
                    console.log(`  ${colors.cyan('--ours')}    Keep local schema (sync snapshot only)`);
                    console.log('');
                    const choiceIndex = await select('Choose resolution strategy:', [
                        'Use database version (--theirs)',
                        'Keep local schema (--ours)',
                        'Cancel',
                    ]);
                    if (choiceIndex === 2) {
                        fatal('Operation cancelled by user', `Run ${colors.cyan('relq status')} to see current state.`);
                    }
                    else if (choiceIndex === 1) {
                        saveSnapshot(currentSchema, projectRoot);
                        console.log('');
                        console.log(`Snapshot synced from database`);
                        console.log(`hint: run ${colors.cyan("'relq add .'")} to detect differences between local schema and database`);
                        console.log('');
                        return;
                    }
                    console.log('');
                }
            }
        }
        else if (!schemaExists) {
            console.log(colors.bold('Creating schema') + colors.dim(' (first pull)'));
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
                console.log(`${colors.green('[+]')} ${colors.green(countStr)} ${item.label}`);
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
                fatal(`Existing schema contains ${items.join(' and ')} definitions`, `Functions and triggers should be in separate files:\n` +
                    `  ${colors.cyan(`${schemaBaseName}.functions.ts`)} - for functions\n` +
                    `  ${colors.cyan(`${schemaBaseName}.triggers.ts`)} - for triggers\n\n` +
                    `To migrate:\n` +
                    `  1. Move pgFunction definitions to ${schemaBaseName}.functions.ts\n` +
                    `  2. Move pgTrigger definitions to ${schemaBaseName}.triggers.ts\n` +
                    `  3. Run ${colors.cyan('relq pull')} again\n\n` +
                    `Or use ${colors.cyan('relq pull --force')} to overwrite and regenerate all files.`);
            }
        }
        spinner.start('Generating TypeScript schema...');
        const parsedSchema = await introspectedToParsedSchema(dbSchema);
        assignTrackingIds(parsedSchema);
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
        const typescript = generateTypeScriptFromAST(parsedSchema, {
            camelCase: config.generate?.camelCase ?? true,
            importPath: 'relq/schema-builder',
            includeFunctions: false,
            includeTriggers: false,
            columnTypeMap,
            typesImportPath,
        });
        spinner.succeed('Generated TypeScript schema');
        const schemaDir = path.dirname(schemaPath);
        if (!fs.existsSync(schemaDir)) {
            fs.mkdirSync(schemaDir, { recursive: true });
        }
        spinner.start('Writing schema file...');
        fs.writeFileSync(schemaPath, typescript, 'utf-8');
        const fileSize = Buffer.byteLength(typescript, 'utf8');
        spinner.succeed(`Written ${colors.cyan(schemaPath)} ${colors.muted(`(${formatBytes(fileSize)})`)}`);
        const fileHash = hashFileContent(typescript);
        saveFileHash(fileHash, projectRoot);
        if (includeFunctions && parsedSchema.functions.length > 0) {
            const schemaBaseName = path.basename(schemaPath, '.ts');
            const functionsPath = path.join(schemaDir, `${schemaBaseName}.functions.ts`);
            const functionsCode = generateFunctionsFile(parsedSchema, {
                camelCase: config.generate?.camelCase ?? true,
                importPath: 'relq/schema-builder',
                schemaImportPath: `./${schemaBaseName}`,
            });
            if (functionsCode) {
                fs.writeFileSync(functionsPath, functionsCode, 'utf-8');
                const funcFileSize = Buffer.byteLength(functionsCode, 'utf8');
                spinner.succeed(`Written ${colors.cyan(functionsPath)} ${colors.muted(`(${formatBytes(funcFileSize)})`)}`);
            }
        }
        if (includeTriggers && parsedSchema.triggers.length > 0) {
            const schemaBaseName = path.basename(schemaPath, '.ts');
            const triggersPath = path.join(schemaDir, `${schemaBaseName}.triggers.ts`);
            const triggersCode = generateTriggersFile(parsedSchema, {
                camelCase: config.generate?.camelCase ?? true,
                importPath: 'relq/schema-builder',
                schemaImportPath: `./${schemaBaseName}`,
                functionsImportPath: `./${schemaBaseName}.functions`,
            });
            if (triggersCode) {
                fs.writeFileSync(triggersPath, triggersCode, 'utf-8');
                const trigFileSize = Buffer.byteLength(triggersCode, 'utf8');
                spinner.succeed(`Written ${colors.cyan(triggersPath)} ${colors.muted(`(${formatBytes(trigFileSize)})`)}`);
            }
        }
        const typesFilePath = getTypesFilePath(schemaPath);
        const typesResult = await syncTypesFromDb(connection, typesFilePath);
        if (typesResult.generated) {
            const typesFileSize = fs.existsSync(typesFilePath) ? fs.statSync(typesFilePath).size : 0;
            if (typesResult.typesCount > 0) {
                spinner.succeed(`Written ${colors.cyan(typesFilePath)} ${colors.muted(`(${typesResult.typesCount} types, ${formatBytes(typesFileSize)})`)}`);
            }
            else {
                spinner.succeed(`Created ${colors.cyan(typesFilePath)} ${colors.muted('(empty template)')}`);
            }
        }
        const oldSnapshot = loadSnapshot(projectRoot);
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
        const schemaChanges = await compareSchemas(beforeSchema, afterSchema);
        copyTrackingIdsToNormalized(parsedSchema, currentSchema);
        saveSnapshot(currentSchema, projectRoot);
        const duration = Date.now() - startTime;
        if (!autoCommit) {
            if (hadPreviousSnapshot && schemaChanges.length > 0) {
                addUnstagedChanges(schemaChanges, projectRoot);
                spinner.succeed(`Detected ${schemaChanges.length} schema change(s)`);
            }
            console.log('');
            console.log(`Pull completed in ${formatDuration(duration)}`);
            if (hadPreviousSnapshot && schemaChanges.length > 0) {
                console.log('');
                console.log(`${colors.green(String(schemaChanges.length))} change(s) ready to stage`);
                console.log(`hint: run ${colors.cyan("'relq add .'")} to stage all changes`);
            }
            else if (!hadPreviousSnapshot) {
                console.log('Schema synced from database');
            }
            else {
                console.log('Already up to date');
            }
        }
        else {
            const connectionDesc = getConnectionDescription(connection);
            const commitMessage = `pull: sync from ${connectionDesc}`;
            const commit = createCommit(currentSchema, author, commitMessage, projectRoot);
            markCommitAsPulled(commit.hash, connection, projectRoot);
            clearWorkingState(projectRoot);
            console.log('');
            console.log(`Pull completed in ${formatDuration(duration)}`);
            console.log('');
            console.log(`${colors.yellow('→')} ${shortHash(commit.hash)} ${commitMessage}`);
            console.log(`  ${colors.green(String(commit.stats.tables))} tables, ${colors.green(String(commit.stats.columns))} columns`);
            if (stashedSchemaContent) {
                fs.writeFileSync(schemaPath, stashedSchemaContent, 'utf-8');
                console.log('');
                console.log(`${colors.yellow('Restored')} local schema file content`);
                console.log(`hint: run ${colors.cyan("'relq add .'")} to detect changes against the new snapshot`);
            }
        }
        console.log('');
    }
    catch (err) {
        spinner.fail('Pull failed');
        fatal(err instanceof Error ? err.message : String(err));
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
