import * as fs from 'fs';
import { colors, fatal, warning } from "../utils/spinner.js";
import { loadRelqignore, isIgnored, } from "../utils/relqignore.js";
import { loadConfig } from "../../config/config.js";
import * as path from 'path';
import { isInitialized, loadSnapshot, getUnstagedChanges, getStagedChanges, stageChanges, detectFileChanges, addUnstagedChanges, clearUnstagedChanges, } from "../utils/repo-manager.js";
import { getChangeDisplayName } from "../utils/change-tracker.js";
import { compareSchemas } from "../utils/schema-comparator.js";
function parseSchemaFileForComparison(schemaPath) {
    if (!fs.existsSync(schemaPath)) {
        return null;
    }
    const content = fs.readFileSync(schemaPath, 'utf-8');
    const tables = [];
    const tableStartRegex = /defineTable\s*\(\s*['"]([^'"]+)['"],\s*\{/g;
    let tableStartMatch;
    while ((tableStartMatch = tableStartRegex.exec(content)) !== null) {
        const tableName = tableStartMatch[1];
        const startIdx = tableStartMatch.index + tableStartMatch[0].length;
        let braceCount = 1;
        let endIdx = startIdx;
        while (braceCount > 0 && endIdx < content.length) {
            const char = content[endIdx];
            if (char === '{')
                braceCount++;
            else if (char === '}')
                braceCount--;
            endIdx++;
        }
        const columnsBlock = content.substring(startIdx, endIdx - 1);
        let optionsBlock = '';
        const afterColumns = content.substring(endIdx);
        const optionsMatch = afterColumns.match(/^\s*,\s*\{/);
        if (optionsMatch) {
            const optStart = endIdx + optionsMatch[0].length;
            braceCount = 1;
            let optEnd = optStart;
            while (braceCount > 0 && optEnd < content.length) {
                const char = content[optEnd];
                if (char === '{')
                    braceCount++;
                else if (char === '}')
                    braceCount--;
                optEnd++;
            }
            optionsBlock = content.substring(optStart, optEnd - 1);
        }
        const columns = [];
        const constraints = [];
        const tsToDbNameMap = new Map();
        const lines = columnsBlock.split('\n');
        let currentColDef = '';
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*'))
                continue;
            currentColDef += ' ' + trimmed;
            if (trimmed.endsWith(',') || trimmed.endsWith(')')) {
                const colDef = currentColDef.trim();
                currentColDef = '';
                const typePattern = 'varchar|text|uuid|integer|bigint|boolean|timestamp|date|jsonb|json|numeric|serial|bigserial|smallserial|tsvector|smallint|real|doublePrecision|char|inet|cidr|macaddr|macaddr8|interval|time|point|line|lseg|box|path|polygon|circle|bytea|bit|varbit|money|xml|oid';
                const colMatch = colDef.match(new RegExp(`^(\\w+):\\s*(${typePattern})`));
                if (!colMatch)
                    continue;
                const tsName = colMatch[1];
                const type = colMatch[2];
                const explicitNameMatch = colDef.match(new RegExp(`${type}\\s*\\(['\"]([^'"]+)['\"]`));
                const dbColName = explicitNameMatch ? explicitNameMatch[1] : tsName;
                tsToDbNameMap.set(tsName, dbColName);
                let defaultValue = null;
                const isJsonbColumn = type === 'jsonb' || type === 'json';
                const isArrayColumn = colDef.includes('.array()');
                const bigintMatch = colDef.match(/\.default\(\s*BigInt\(\s*(-?\d+)\s*\)\s*\)/);
                if (bigintMatch) {
                    defaultValue = bigintMatch[1];
                }
                const funcDefaultMatch = !defaultValue && colDef.match(/\.default\(\s*(genRandomUuid|now|currentDate|currentTimestamp|emptyArray|emptyObject)\s*\(\s*\)\s*\)/);
                if (funcDefaultMatch) {
                    const funcName = funcDefaultMatch[1];
                    if (funcName === 'emptyArray') {
                        defaultValue = isJsonbColumn ? "'[]'::jsonb" : "'{}'::text[]";
                    }
                    else if (funcName === 'emptyObject') {
                        defaultValue = "'{}'::jsonb";
                    }
                    else {
                        const funcToSql = {
                            'genRandomUuid': 'gen_random_uuid()',
                            'now': 'now()',
                            'currentDate': 'CURRENT_DATE',
                            'currentTimestamp': 'CURRENT_TIMESTAMP',
                        };
                        defaultValue = funcToSql[funcName] || `${funcName}()`;
                    }
                }
                else {
                    const strDefaultMatch = colDef.match(/\.default\(\s*(['"])([^'"]*)\1\s*\)/);
                    if (strDefaultMatch) {
                        defaultValue = strDefaultMatch[2];
                    }
                    else {
                        const boolDefaultMatch = colDef.match(/\.default\(\s*(true|false)\s*\)/);
                        if (boolDefaultMatch) {
                            defaultValue = boolDefaultMatch[1];
                        }
                        else {
                            const numDefaultMatch = colDef.match(/\.default\(\s*(-?\d+(?:\.\d+)?)\s*\)/);
                            if (numDefaultMatch) {
                                defaultValue = numDefaultMatch[1];
                            }
                            else {
                                const jsonObjMatch = colDef.match(/\.default\(\s*(\{[^}]+\})\s*\)/);
                                if (jsonObjMatch) {
                                    defaultValue = `'${jsonObjMatch[1]}'::jsonb`;
                                }
                                else {
                                    const arrayLiteralMatch = colDef.match(/\.default\(\s*(\[[^\]]+\])\s*\)/);
                                    if (arrayLiteralMatch) {
                                        const arrayStr = arrayLiteralMatch[1];
                                        defaultValue = `'${arrayStr}'::jsonb`;
                                    }
                                }
                            }
                        }
                    }
                }
                if (colDef.includes('.check(')) {
                    const checkValuesMatch = colDef.match(/\.check\(([^)]+)\)/);
                    if (checkValuesMatch) {
                        const valuesStr = checkValuesMatch[1];
                        const values = valuesStr.match(/['"]([^'"]+)['"]/g)?.map(v => v.replace(/['"]/g, '')) || [];
                        if (values.length > 0) {
                            const constraintName = `${tableName}_${dbColName}_check`;
                            constraints.push({
                                name: constraintName,
                                type: 'CHECK',
                                columns: [dbColName],
                                definition: '',
                            });
                        }
                    }
                }
                let comment = null;
                const commentMatch = colDef.match(/\.comment\(\s*(['"])([^'"]*)\1\s*\)/);
                if (commentMatch) {
                    comment = commentMatch[2];
                }
                if (colDef.includes('.identity()')) {
                    defaultValue = defaultValue || 'GENERATED BY DEFAULT AS IDENTITY';
                }
                const isArray = colDef.includes('.array()');
                columns.push({
                    name: dbColName,
                    dataType: isArray ? `${type}[]` : type,
                    isNullable: !colDef.includes('.notNull()') && !colDef.includes('.primaryKey()'),
                    defaultValue,
                    isPrimaryKey: colDef.includes('.primaryKey()'),
                    isUnique: colDef.includes('.unique()'),
                    maxLength: null,
                    precision: null,
                    scale: null,
                    references: null,
                    comment,
                });
            }
        }
        const indexes = [];
        const indexRegex = /index\s*\(\s*['"]([^'"]+)['"]\s*\)\.on\(([^)]+)\)/g;
        let idxMatch;
        while ((idxMatch = indexRegex.exec(optionsBlock)) !== null) {
            const indexName = idxMatch[1];
            const indexCols = idxMatch[2].split(',').map(c => {
                const tsColName = c.trim().replace(/table\.\s*/, '');
                return tsToDbNameMap.get(tsColName) || tsColName;
            });
            const isUnique = optionsBlock.includes(`index('${indexName}')`) &&
                optionsBlock.substring(optionsBlock.indexOf(`index('${indexName}')`)).split('\n')[0].includes('.unique()');
            indexes.push({
                name: indexName,
                columns: indexCols,
                isUnique: isUnique,
                isPrimary: false,
                type: 'btree',
                definition: '',
                whereClause: null,
                expression: null,
            });
        }
        const checkRegexLegacy = /check\s*\(\s*['"]([^'"]+)['"]\s*,\s*sql`([^`]+)`\s*\)/g;
        let tableCheckMatch;
        while ((tableCheckMatch = checkRegexLegacy.exec(optionsBlock)) !== null) {
            constraints.push({
                name: tableCheckMatch[1],
                type: 'CHECK',
                columns: [],
                definition: tableCheckMatch[2].trim(),
            });
        }
        const checkRegexNew = /check\.constraint\s*\(\s*['"]([^'"]+)['"]/g;
        let newCheckMatch;
        while ((newCheckMatch = checkRegexNew.exec(optionsBlock)) !== null) {
            const constraintName = newCheckMatch[1];
            if (!constraints.some(c => c.name === constraintName)) {
                constraints.push({
                    name: constraintName,
                    type: 'CHECK',
                    columns: [],
                    definition: '',
                });
            }
        }
        const checkConstraintsBlockMatch = optionsBlock.match(/checkConstraints:\s*\([^)]+\)\s*=>\s*\[([^\]]+)\]/s);
        if (checkConstraintsBlockMatch) {
            const checkBlock = checkConstraintsBlockMatch[1];
            const constraintNameMatches = checkBlock.matchAll(/check\.constraint\s*\(\s*['"]([^'"]+)['"]/g);
            for (const match of constraintNameMatches) {
                const constraintName = match[1];
                if (!constraints.some(c => c.name === constraintName)) {
                    constraints.push({
                        name: constraintName,
                        type: 'CHECK',
                        columns: [],
                        definition: '',
                    });
                }
            }
        }
        let partitionType;
        let partitionKey;
        const partitionByMatch = optionsBlock.match(/partitionBy:\s*\([^)]+\)\s*=>\s*\w+\.(list|range|hash)\(([^)]+)\)/i);
        if (partitionByMatch) {
            partitionType = partitionByMatch[1].toUpperCase();
            const tsPartitionKey = partitionByMatch[2].replace(/table\./, '').trim();
            const dbPartitionKey = tsToDbNameMap.get(tsPartitionKey) || tsPartitionKey;
            partitionKey = [dbPartitionKey];
        }
        tables.push({
            name: tableName,
            schema: 'public',
            columns,
            indexes,
            constraints,
            rowCount: 0,
            isPartitioned: !!partitionType,
            partitionType,
            partitionKey,
        });
    }
    const enums = [];
    const enumRegex = /defineEnum\s*\(\s*['"]([^'"]+)['"]\s*,\s*\[([^\]]+)\]/g;
    let enumMatch;
    while ((enumMatch = enumRegex.exec(content)) !== null) {
        const enumName = enumMatch[1];
        const valuesStr = enumMatch[2];
        const values = valuesStr.match(/['"]([^'"]+)['"]/g)?.map(v => v.replace(/['"]/g, '')) || [];
        enums.push({ name: enumName, values });
    }
    const extensions = [];
    const singleExtMatch = content.match(/pgExtensions\s*\(\s*['"]([^'"]+)['"]\s*\)/);
    if (singleExtMatch) {
        extensions.push(singleExtMatch[1]);
    }
    else {
        const arrayExtMatch = content.match(/pgExtensions\s*\(\s*\[([^\]]+)\]/);
        if (arrayExtMatch) {
            const extList = arrayExtMatch[1].match(/['"]([^'"]+)['"]/g);
            if (extList) {
                extList.forEach(e => extensions.push(e.replace(/['"]/g, '')));
            }
        }
    }
    return {
        tables,
        enums,
        domains: [],
        compositeTypes: [],
        sequences: [],
        collations: [],
        functions: [],
        triggers: [],
        policies: [],
        partitions: [],
        foreignServers: [],
        foreignTables: [],
        extensions,
    };
}
function snapshotToDatabaseSchema(snapshot) {
    const tables = (snapshot.tables || []).map(t => ({
        name: t.name,
        schema: t.schema || 'public',
        columns: (t.columns || []).map(c => ({
            name: c.name,
            dataType: c.type || 'text',
            isNullable: c.nullable !== false,
            defaultValue: c.default || null,
            isPrimaryKey: c.primaryKey || false,
            isUnique: c.unique || false,
            maxLength: null,
            precision: null,
            scale: null,
            references: null,
            comment: c.comment || null,
        })),
        indexes: (t.indexes || []).map(i => ({
            name: i.name,
            columns: Array.isArray(i.columns) ? i.columns : [i.columns],
            isUnique: i.unique || false,
            isPrimary: false,
            type: i.type || 'btree',
            definition: i.definition || '',
            whereClause: i.whereClause || null,
            expression: null,
        })),
        constraints: (t.constraints || []).map(c => ({
            name: c.name,
            type: c.type,
            columns: c.columns || [],
            definition: c.definition || '',
        })),
        rowCount: 0,
        isPartitioned: t.isPartitioned || false,
        partitionType: t.partitionType,
        partitionKey: t.partitionKey ? (Array.isArray(t.partitionKey) ? t.partitionKey : [t.partitionKey]) : undefined,
    }));
    return {
        tables,
        enums: (snapshot.enums || []).map(e => ({ name: e.name, values: e.values })),
        domains: [],
        compositeTypes: [],
        sequences: [],
        collations: [],
        functions: [],
        triggers: [],
        policies: [],
        partitions: [],
        foreignServers: [],
        foreignTables: [],
        extensions: (snapshot.extensions || []).map(e => typeof e === 'string' ? e : e.name),
    };
}
export async function addCommand(context) {
    const { args, projectRoot } = context;
    console.log('');
    if (!isInitialized(projectRoot)) {
        fatal('not a relq repository (or any parent directories): .relq', `Run ${colors.cyan('relq init')} to initialize.`);
    }
    const ignorePatterns = loadRelqignore(projectRoot);
    const config = await loadConfig();
    const schemaPathRaw = typeof config.schema === 'string' ? config.schema : './db/schema.ts';
    const schemaPath = path.resolve(projectRoot, schemaPathRaw);
    const fileChange = detectFileChanges(schemaPath, projectRoot);
    if (fileChange) {
        const currentSchema = parseSchemaFileForComparison(schemaPath);
        const snapshot = loadSnapshot(projectRoot);
        if (currentSchema && snapshot) {
            const snapshotAsDbSchema = snapshotToDatabaseSchema(snapshot);
            const schemaChanges = compareSchemas(snapshotAsDbSchema, currentSchema);
            if (schemaChanges.length > 0) {
                clearUnstagedChanges(projectRoot);
                addUnstagedChanges(schemaChanges, projectRoot);
            }
            else {
                const existingUnstaged = getUnstagedChanges(projectRoot);
                const hasFileChange = existingUnstaged.some(c => c.objectType === 'SCHEMA_FILE');
                if (!hasFileChange) {
                    addUnstagedChanges([fileChange], projectRoot);
                }
            }
        }
    }
    const allUnstaged = getUnstagedChanges(projectRoot);
    const staged = getStagedChanges(projectRoot);
    const unstaged = allUnstaged.filter(change => {
        const objectType = change.objectType;
        const result = isIgnored(objectType, change.objectName, change.parentName || null, ignorePatterns);
        if (result.ignored) {
            return false;
        }
        if (['FUNCTION', 'PROCEDURE'].includes(change.objectType) && !config.includeFunctions) {
            return false;
        }
        if (change.objectType === 'TRIGGER' && !config.includeTriggers) {
            return false;
        }
        if (['VIEW', 'MATERIALIZED_VIEW'].includes(change.objectType) && !config.includeViews) {
            return false;
        }
        if (change.objectType === 'FOREIGN_TABLE' && !config.includeFDW) {
            return false;
        }
        return true;
    });
    const filteredCount = allUnstaged.length - unstaged.length;
    if (unstaged.length === 0) {
        if (staged.length > 0) {
            console.log('All changes are already staged');
            console.log(`${colors.muted(`${staged.length} change(s) ready to commit`)}`);
            console.log('');
            console.log(`hint: run 'relq commit -m "message"' to commit`);
        }
        else if (filteredCount > 0) {
            console.log('No stageable changes');
            console.log(`${colors.muted(`${filteredCount} change(s) filtered by .relqignore or config`)}`);
        }
        else {
            console.log('No changes to stage');
            console.log(`hint: run 'relq pull' or 'relq import' to detect changes`);
        }
        console.log('');
        return;
    }
    const patterns = args.length > 0 ? args : ['.'];
    const stagedNow = stageChanges(patterns, projectRoot);
    if (stagedNow.length === 0) {
        warning(`No changes matched the pattern(s): ${patterns.join(', ')}`);
        console.log('');
        return;
    }
    console.log(`Staged ${stagedNow.length} change(s):`);
    console.log('');
    for (const change of stagedNow) {
        const display = getChangeDisplayName(change);
        const color = change.type === 'CREATE' ? colors.green :
            change.type === 'DROP' ? colors.red :
                colors.yellow;
        console.log(`   ${color(display)}`);
    }
    console.log('');
    const remainingUnstaged = getUnstagedChanges(projectRoot);
    if (remainingUnstaged.length > 0) {
        console.log(`${colors.muted(`${remainingUnstaged.length} change(s) still unstaged`)}`);
        console.log('');
    }
    console.log(`hint: run 'relq commit -m "message"' to commit`);
    console.log('');
}
export function getRelatedChanges(tableName, changes) {
    return changes.filter(c => {
        if (c.objectName === tableName)
            return true;
        if (c.parentName === tableName)
            return true;
        const data = c.after;
        if (data?.tableName === tableName)
            return true;
        return false;
    });
}
export default addCommand;
