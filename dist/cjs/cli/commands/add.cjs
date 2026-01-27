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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addCommand = addCommand;
exports.getRelatedChanges = getRelatedChanges;
const fs = __importStar(require("fs"));
const strip_comments_1 = __importDefault(require("strip-comments"));
const spinner_1 = require("../utils/spinner.cjs");
const relqignore_1 = require("../utils/relqignore.cjs");
const config_1 = require("../../config/config.cjs");
const dsql_validator_1 = require("../utils/dsql-validator.cjs");
const path = __importStar(require("path"));
const repo_manager_1 = require("../utils/repo-manager.cjs");
const change_tracker_1 = require("../utils/change-tracker.cjs");
const schema_comparator_1 = require("../utils/schema-comparator.cjs");
const config_loader_1 = require("../utils/config-loader.cjs");
function parseSchemaFileForComparison(schemaPath) {
    if (!fs.existsSync(schemaPath)) {
        return null;
    }
    const rawContent = fs.readFileSync(schemaPath, 'utf-8');
    const content = (0, strip_comments_1.default)(rawContent);
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
        let pendingJsDocComment = null;
        for (const line of lines) {
            const trimmed = line.trim();
            const jsDocMatch = trimmed.match(/^\/\*\*\s*(.*?)\s*\*\/$/);
            if (jsDocMatch) {
                pendingJsDocComment = jsDocMatch[1];
                continue;
            }
            if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*'))
                continue;
            currentColDef += ' ' + trimmed;
            if (trimmed.endsWith(',') || trimmed.endsWith(')')) {
                const colDef = currentColDef.trim();
                currentColDef = '';
                const typePattern = 'varchar|text|uuid|integer|bigint|boolean|timestamptz|timestamp|date|jsonb|json|numeric|serial|bigserial|smallserial|tsvector|smallint|real|doublePrecision|char|inet|cidr|macaddr|macaddr8|interval|timetz|time|point|line|lseg|box|path|polygon|circle|bytea|bit|varbit|money|xml|oid|enumType|domainType';
                const colMatch = colDef.match(new RegExp(`^(\\w+):\\s*(${typePattern})`));
                if (!colMatch)
                    continue;
                const tsName = colMatch[1];
                const type = colMatch[2];
                const explicitNameMatch = colDef.match(new RegExp(`${type}(?:<[^>]+>)?\\s*\\(['\"]([^'"]+)['\"]`));
                const dbColName = explicitNameMatch ? explicitNameMatch[1] : tsName;
                tsToDbNameMap.set(tsName, dbColName);
                let defaultValue = null;
                const isJsonbColumn = type === 'jsonb' || type === 'json';
                const isArrayColumn = colDef.includes('.array()');
                const bigintMatch = colDef.match(/\.default\(\s*BigInt\(\s*(-?\d+)\s*\)\s*\)/);
                if (bigintMatch) {
                    defaultValue = bigintMatch[1];
                }
                const bigintLiteralMatch = !defaultValue && colDef.match(/\.default\(\s*(-?\d+)n\s*\)/);
                if (bigintLiteralMatch) {
                    defaultValue = bigintLiteralMatch[1];
                }
                const funcDefaultMatch = !defaultValue && colDef.match(/\.default\(\s*(?:DEFAULT\.)?(genRandomUuid|now|currentDate|currentTimestamp|emptyArray|emptyObject|emptyJsonb)\s*\(\s*\)\s*\)/);
                if (funcDefaultMatch) {
                    const funcName = funcDefaultMatch[1];
                    if (funcName === 'emptyArray') {
                        defaultValue = isJsonbColumn ? "'[]'::jsonb" : "'{}'::text[]";
                    }
                    else if (funcName === 'emptyObject' || funcName === 'emptyJsonb') {
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
                        defaultValue = `'${strDefaultMatch[2]}'`;
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
                    const checkMatch = colDef.match(/\.check\(\s*['"]([^'"]+)['"]\s*,\s*\[([^\]]+)\]\s*\)/);
                    if (checkMatch) {
                        const constraintName = checkMatch[1];
                        const valuesStr = checkMatch[2];
                        const values = valuesStr.match(/['"]([^'"]+)['"]/g)?.map(v => v.replace(/['"]/g, '')) || [];
                        if (values.length > 0) {
                            const valuesQuoted = values.map(v => `'${v}'`).join(', ');
                            const definition = `CHECK ("${dbColName}" IN (${valuesQuoted}))`;
                            constraints.push({
                                name: constraintName,
                                type: 'CHECK',
                                columns: [dbColName],
                                definition,
                            });
                        }
                    }
                }
                let comment = null;
                const commentMatch = colDef.match(/\.comment\(\s*(['"])([^'"]*)\1\s*\)/);
                if (commentMatch) {
                    comment = commentMatch[2];
                }
                else if (pendingJsDocComment) {
                    comment = pendingJsDocComment;
                }
                pendingJsDocComment = null;
                if (colDef.includes('.identity()')) {
                    defaultValue = defaultValue || 'GENERATED BY DEFAULT AS IDENTITY';
                }
                let trackingId = undefined;
                const trackingIdMatch = colDef.match(/\.\$id\(\s*['"]([^'"]+)['"]\s*\)/);
                if (trackingIdMatch) {
                    trackingId = trackingIdMatch[1];
                }
                const hasArrayModifier = colDef.includes('.array()');
                const hasEmptyArrayDefault = colDef.includes('emptyArray()');
                const isJsonbType = type === 'jsonb' || type === 'json';
                const isArray = hasArrayModifier || (hasEmptyArrayDefault && !isJsonbType);
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
                    trackingId,
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
            const indexStart = optionsBlock.indexOf(`index('${indexName}')`);
            const indexLine = indexStart >= 0 ? optionsBlock.substring(indexStart).split('\n')[0] : '';
            const isUnique = indexLine.includes('.unique()');
            const commentMatch = indexLine.match(/\.comment\(\s*(['"])([^'"]*)\1\s*\)/);
            const comment = commentMatch ? commentMatch[2] : null;
            const trackingIdMatch = indexLine.match(/\.\$id\(\s*(['"])([^'"]+)\1\s*\)/);
            const trackingId = trackingIdMatch ? trackingIdMatch[2] : undefined;
            indexes.push({
                name: indexName,
                columns: indexCols,
                isUnique: isUnique,
                isPrimary: false,
                type: 'btree',
                definition: '',
                whereClause: null,
                expression: null,
                comment,
                trackingId,
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
        const checkRegexNew = /check\.constraint\s*\(\s*['"]([^'"]+)['"]\s*,\s*(?:sql`([^`]*)`|([^)]+\)))/g;
        let newCheckMatch;
        while ((newCheckMatch = checkRegexNew.exec(optionsBlock)) !== null) {
            const constraintName = newCheckMatch[1];
            const expression = (newCheckMatch[2] || newCheckMatch[3] || '').trim();
            if (!constraints.some(c => c.name === constraintName)) {
                constraints.push({
                    name: constraintName,
                    type: 'CHECK',
                    columns: [],
                    definition: expression ? `CHECK (${expression})` : '',
                });
            }
        }
        const checkConstraintsBlockMatch = optionsBlock.match(/checkConstraints:\s*\([^)]+\)\s*=>\s*\[([^\]]+)\]/s);
        if (checkConstraintsBlockMatch) {
            const checkBlock = checkConstraintsBlockMatch[1];
            const constraintMatches = checkBlock.matchAll(/check\.constraint\s*\(\s*['"]([^'"]+)['"]\s*,\s*(?:sql`([^`]*)`|([^)]+\)))/g);
            for (const match of constraintMatches) {
                const constraintName = match[1];
                const expression = (match[2] || match[3] || '').trim();
                if (!constraints.some(c => c.name === constraintName)) {
                    constraints.push({
                        name: constraintName,
                        type: 'CHECK',
                        columns: [],
                        definition: expression ? `CHECK (${expression})` : '',
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
        const pkColumns = columns.filter(c => c.isPrimaryKey).map(c => c.name);
        if (pkColumns.length > 0) {
            const pkName = `${tableName}_pkey`;
            if (!constraints.some(c => c.type === 'PRIMARY KEY')) {
                constraints.push({
                    name: pkName,
                    type: 'PRIMARY KEY',
                    columns: pkColumns,
                    definition: '',
                });
            }
        }
        for (const col of columns) {
            if (col.isUnique && !col.isPrimaryKey) {
                const uniqueName = `${tableName}_${col.name}_key`;
                if (!constraints.some(c => c.name === uniqueName)) {
                    constraints.push({
                        name: uniqueName,
                        type: 'UNIQUE',
                        columns: [col.name],
                        definition: '',
                    });
                }
                col.isUnique = false;
            }
        }
        const uniqueConstraintRegex = /constraint\.unique\s*\(\s*\{\s*name:\s*['"]([^'"]+)['"]\s*,\s*columns:\s*\[([^\]]+)\]/g;
        let uniqueMatch;
        while ((uniqueMatch = uniqueConstraintRegex.exec(optionsBlock)) !== null) {
            const constraintName = uniqueMatch[1];
            const colsStr = uniqueMatch[2];
            const uniqueCols = colsStr.split(',').map(c => {
                const tsColName = c.trim().replace(/table\.\s*/, '');
                return tsToDbNameMap.get(tsColName) || tsColName;
            });
            if (!constraints.some(c => c.name === constraintName)) {
                constraints.push({
                    name: constraintName,
                    type: 'UNIQUE',
                    columns: uniqueCols,
                    definition: '',
                });
            }
        }
        const pkConstraintRegex = /constraint\.primaryKey\s*\(\s*\{\s*name:\s*['"]([^'"]+)['"]\s*,\s*columns:\s*\[([^\]]+)\]/g;
        let pkMatch;
        while ((pkMatch = pkConstraintRegex.exec(optionsBlock)) !== null) {
            const constraintName = pkMatch[1];
            const colsStr = pkMatch[2];
            const pkCols = colsStr.split(',').map(c => {
                const tsColName = c.trim().replace(/table\.\s*/, '');
                return tsToDbNameMap.get(tsColName) || tsColName;
            });
            const existingPkIdx = constraints.findIndex(c => c.type === 'PRIMARY KEY');
            if (existingPkIdx >= 0) {
                constraints[existingPkIdx] = {
                    name: constraintName,
                    type: 'PRIMARY KEY',
                    columns: pkCols,
                    definition: '',
                };
            }
            else {
                constraints.push({
                    name: constraintName,
                    type: 'PRIMARY KEY',
                    columns: pkCols,
                    definition: '',
                });
            }
            for (const dbColName of pkCols) {
                const col = columns.find(c => c.name === dbColName);
                if (col) {
                    col.isPrimaryKey = true;
                }
            }
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
    const toSnakeCase = (str) => {
        return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    };
    const pgRelationsStart = content.indexOf('pgRelations(');
    let relationsBlock = '';
    if (pgRelationsStart !== -1) {
        const arrowStart = content.indexOf('=> ({', pgRelationsStart);
        if (arrowStart !== -1) {
            const blockStart = arrowStart + 5;
            let depth = 1;
            let i = blockStart;
            while (i < content.length && depth > 0) {
                if (content[i] === '{')
                    depth++;
                else if (content[i] === '}')
                    depth--;
                i++;
            }
            relationsBlock = content.slice(blockStart, i - 1);
        }
    }
    if (relationsBlock) {
        const tableEntryRegex = /(\w+):\s*tables\.\1\s*\(\s*\([^)]*\)\s*=>\s*\[/g;
        let tableMatch;
        while ((tableMatch = tableEntryRegex.exec(relationsBlock)) !== null) {
            const tableTsName = tableMatch[1];
            const tableDbName = toSnakeCase(tableTsName);
            const entryStart = tableMatch.index + tableMatch[0].length;
            let depth = 1;
            let j = entryStart;
            while (j < relationsBlock.length && depth > 0) {
                if (relationsBlock[j] === '[')
                    depth++;
                else if (relationsBlock[j] === ']')
                    depth--;
                j++;
            }
            const tableRelationsContent = relationsBlock.slice(entryStart, j - 1);
            const table = tables.find(t => t.name === tableDbName);
            if (!table)
                continue;
            const fkRegex = /r\.referenceTo\.(\w+)\s*\(\s*\w*\s*=>\s*\(\{([^}]*(?:\{[^}]*\}[^}]*)*)\}\)/g;
            let fkMatch;
            while ((fkMatch = fkRegex.exec(tableRelationsContent)) !== null) {
                const refTableTsName = fkMatch[1];
                const fkOptionsStr = fkMatch[2];
                const refTableDbName = toSnakeCase(refTableTsName);
                const singleColMatch = fkOptionsStr.match(/columns:\s*['"](\w+)['"]/);
                const compositeColMatch = fkOptionsStr.match(/columns:\s*\[([^\]]+)\]/);
                let sourceColumns = [];
                let isComposite = false;
                if (compositeColMatch) {
                    isComposite = true;
                    const colsStr = compositeColMatch[1];
                    const colMatches = colsStr.matchAll(/['"](\w+)['"]/g);
                    for (const m of colMatches) {
                        sourceColumns.push(toSnakeCase(m[1]));
                    }
                }
                else if (singleColMatch) {
                    sourceColumns = [toSnakeCase(singleColMatch[1])];
                }
                else {
                    continue;
                }
                let refColumns;
                const singleRefMatch = fkOptionsStr.match(/references:\s*t\.(\w+)(?![.\[])/);
                const compositeRefMatch = fkOptionsStr.match(/references:\s*\[([^\]]+)\]/);
                if (compositeRefMatch) {
                    refColumns = [];
                    const refsStr = compositeRefMatch[1];
                    const refMatches = refsStr.matchAll(/t\.(\w+)/g);
                    for (const m of refMatches) {
                        refColumns.push(toSnakeCase(m[1]));
                    }
                }
                else if (singleRefMatch) {
                    refColumns = [toSnakeCase(singleRefMatch[1])];
                }
                const nameMatch = fkOptionsStr.match(/name:\s*['"]([^'"]+)['"]/);
                const onDeleteMatch = fkOptionsStr.match(/onDelete:\s*['"]([^'"]+)['"]/);
                const onUpdateMatch = fkOptionsStr.match(/onUpdate:\s*['"]([^'"]+)['"]/);
                const matchMatch = fkOptionsStr.match(/match:\s*['"]([^'"]+)['"]/);
                const deferrableMatch = fkOptionsStr.match(/deferrable:\s*(true|false)/);
                const initiallyDeferredMatch = fkOptionsStr.match(/initiallyDeferred:\s*(true|false)/);
                const onDelete = onDeleteMatch ? onDeleteMatch[1] : undefined;
                const onUpdate = onUpdateMatch ? onUpdateMatch[1] : undefined;
                const match = matchMatch ? matchMatch[1] : undefined;
                const deferrable = deferrableMatch ? deferrableMatch[1] === 'true' : undefined;
                const initiallyDeferred = initiallyDeferredMatch ? initiallyDeferredMatch[1] === 'true' : undefined;
                if (isComposite) {
                    const fkName = nameMatch
                        ? nameMatch[1]
                        : `${tableDbName}_${sourceColumns.join('_')}_fkey`;
                    const colsQuoted = sourceColumns.map(c => `"${c}"`).join(', ');
                    let definition = `FOREIGN KEY (${colsQuoted}) REFERENCES "${refTableDbName}"`;
                    if (refColumns && refColumns.length > 0) {
                        definition += `(${refColumns.map(c => `"${c}"`).join(', ')})`;
                    }
                    if (onDelete)
                        definition += ` ON DELETE ${onDelete.toUpperCase()}`;
                    if (onUpdate)
                        definition += ` ON UPDATE ${onUpdate.toUpperCase()}`;
                    if (match)
                        definition += ` MATCH ${match.toUpperCase()}`;
                    if (deferrable) {
                        definition += ' DEFERRABLE';
                        if (initiallyDeferred)
                            definition += ' INITIALLY DEFERRED';
                    }
                    const alreadyExists = table.constraints.some(c => c.name === fkName ||
                        (c.type === 'FOREIGN KEY' && c.columns?.join(',') === sourceColumns.join(',')));
                    if (!alreadyExists) {
                        table.constraints.push({
                            name: fkName,
                            type: 'FOREIGN KEY',
                            columns: sourceColumns,
                            definition,
                        });
                    }
                }
                else {
                    const colDbName = sourceColumns[0];
                    const fkName = nameMatch
                        ? nameMatch[1]
                        : `${tableDbName}_${colDbName}_fkey`;
                    const column = table.columns.find((c) => c.name === colDbName);
                    if (column && !column.references) {
                        column.references = {
                            table: refTableDbName,
                            column: refColumns?.[0] || '',
                            onDelete,
                            onUpdate,
                        };
                    }
                    const alreadyExists = table.constraints.some(c => c.name === fkName ||
                        (c.type === 'FOREIGN KEY' && c.columns?.join(',') === sourceColumns.join(',')));
                    if (!alreadyExists) {
                        table.constraints.push({
                            name: fkName,
                            type: 'FOREIGN KEY',
                            columns: sourceColumns,
                            definition: '',
                        });
                    }
                }
            }
        }
    }
    const schemaDir = path.dirname(schemaPath);
    const schemaBaseName = path.basename(schemaPath, '.ts');
    const functionsPath = path.join(schemaDir, `${schemaBaseName}.functions.ts`);
    const triggersPath = path.join(schemaDir, `${schemaBaseName}.triggers.ts`);
    const functions = parseFunctionsFile(functionsPath);
    const triggers = parseTriggersFile(triggersPath);
    return {
        tables,
        enums,
        domains: [],
        compositeTypes: [],
        sequences: [],
        collations: [],
        functions,
        triggers,
        policies: [],
        partitions: [],
        foreignServers: [],
        foreignTables: [],
        extensions,
    };
}
function parseFunctionsFile(filePath) {
    if (!fs.existsSync(filePath)) {
        return [];
    }
    const rawContent = fs.readFileSync(filePath, 'utf-8');
    const content = (0, strip_comments_1.default)(rawContent);
    const functions = [];
    const funcPattern = /pgFunction\s*\(\s*['"]([^'"]+)['"]\s*,\s*\{/g;
    let funcMatch;
    while ((funcMatch = funcPattern.exec(content)) !== null) {
        const funcName = funcMatch[1];
        const startIdx = funcMatch.index + funcMatch[0].length;
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
        const optionsBlock = content.substring(startIdx, endIdx - 1);
        const returnsMatch = optionsBlock.match(/returns:\s*['"]([^'"]+)['"]/);
        const returnType = returnsMatch ? returnsMatch[1] : 'void';
        const languageMatch = optionsBlock.match(/language:\s*['"]([^'"]+)['"]/);
        const language = languageMatch ? languageMatch[1] : 'plpgsql';
        const volatilityMatch = optionsBlock.match(/volatility:\s*['"]([^'"]+)['"]/);
        const volatility = volatilityMatch ? volatilityMatch[1] : 'VOLATILE';
        const argsMatch = optionsBlock.match(/args:\s*\[([^\]]*)\]/s);
        const argTypes = [];
        if (argsMatch) {
            const argsBlock = argsMatch[1];
            const typeMatches = argsBlock.matchAll(/type:\s*['"]([^'"]+)['"]/g);
            for (const m of typeMatches) {
                argTypes.push(m[1]);
            }
        }
        const bodyMatch = optionsBlock.match(/body:\s*`([^`]*)`/s) || optionsBlock.match(/raw:\s*`([^`]*)`/s);
        const definition = bodyMatch ? bodyMatch[1].trim() : '';
        functions.push({
            name: funcName,
            schema: 'public',
            returnType,
            argTypes,
            language,
            definition,
            isAggregate: false,
            volatility,
        });
    }
    return functions;
}
function parseTriggersFile(filePath) {
    if (!fs.existsSync(filePath)) {
        return [];
    }
    const rawContent = fs.readFileSync(filePath, 'utf-8');
    const content = (0, strip_comments_1.default)(rawContent);
    const triggers = [];
    const trigPattern = /pgTrigger\s*\(\s*['"]([^'"]+)['"]\s*,\s*\{/g;
    let trigMatch;
    while ((trigMatch = trigPattern.exec(content)) !== null) {
        const trigName = trigMatch[1];
        const startIdx = trigMatch.index + trigMatch[0].length;
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
        const optionsBlock = content.substring(startIdx, endIdx - 1);
        let tableName = '';
        const onSchemaMatch = optionsBlock.match(/on:\s*schema\.(\w+)/);
        const onStringMatch = optionsBlock.match(/on:\s*['"]([^'"]+)['"]/);
        if (onSchemaMatch) {
            tableName = onSchemaMatch[1].replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        }
        else if (onStringMatch) {
            tableName = onStringMatch[1];
        }
        let timing = 'BEFORE';
        let event = 'UPDATE';
        const beforeMatch = optionsBlock.match(/before:\s*['"]?(\w+)['"]?/);
        const afterMatch = optionsBlock.match(/after:\s*['"]?(\w+)['"]?/);
        const insteadOfMatch = optionsBlock.match(/insteadOf:\s*['"]?(\w+)['"]?/);
        if (beforeMatch) {
            timing = 'BEFORE';
            event = beforeMatch[1].toUpperCase();
        }
        else if (afterMatch) {
            timing = 'AFTER';
            event = afterMatch[1].toUpperCase();
        }
        else if (insteadOfMatch) {
            timing = 'INSTEAD OF';
            event = insteadOfMatch[1].toUpperCase();
        }
        const forEachMatch = optionsBlock.match(/forEach:\s*['"]?(\w+)['"]?/);
        const forEach = forEachMatch && forEachMatch[1].toUpperCase() === 'STATEMENT' ? 'STATEMENT' : 'ROW';
        let functionName = '';
        const execFuncMatch = optionsBlock.match(/execute:\s*functions\.(\w+)/);
        const execStringMatch = optionsBlock.match(/execute:\s*['"]([^'"]+)['"]/);
        if (execFuncMatch) {
            functionName = execFuncMatch[1].replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        }
        else if (execStringMatch) {
            functionName = execStringMatch[1];
        }
        triggers.push({
            name: trigName,
            tableName,
            event,
            timing,
            forEach,
            functionName,
            definition: '',
            isEnabled: true,
        });
    }
    return triggers;
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
            trackingId: c.trackingId,
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
            trackingId: i.trackingId,
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
    const functions = (snapshot.functions || []).map(f => ({
        name: f.name,
        schema: f.schema || 'public',
        returnType: f.returnType,
        argTypes: f.argTypes || [],
        language: f.language,
        definition: f.body || '',
        isAggregate: false,
        volatility: f.volatility || 'VOLATILE',
    }));
    const triggers = (snapshot.triggers || []).map(t => ({
        name: t.name,
        tableName: t.table,
        event: t.events?.[0] || 'UPDATE',
        timing: t.timing,
        forEach: t.forEach || 'ROW',
        functionName: t.functionName,
        definition: '',
        isEnabled: true,
    }));
    return {
        tables,
        enums: (snapshot.enums || []).map(e => ({ name: e.name, values: e.values })),
        domains: [],
        compositeTypes: [],
        sequences: [],
        collations: [],
        functions,
        triggers,
        policies: [],
        partitions: [],
        foreignServers: [],
        foreignTables: [],
        extensions: (snapshot.extensions || []).map(e => typeof e === 'string' ? e : e.name),
    };
}
let trackingIdCounter = 0;
function generateTrackingId(prefix) {
    trackingIdCounter++;
    const base = (Date.now().toString(36) + trackingIdCounter.toString(36)).slice(-5);
    return prefix + base.padStart(5, '0');
}
function injectTrackingIds(schemaPath) {
    if (!fs.existsSync(schemaPath)) {
        return 0;
    }
    let content = fs.readFileSync(schemaPath, 'utf-8');
    let injectedCount = 0;
    const columnLineRegex = /^(\s*)(\w+):\s*(varchar|text|uuid|integer|bigint|boolean|timestamptz|timestamp|date|jsonb|json|numeric|serial|bigserial|smallserial|tsvector|smallint|real|doublePrecision|char|inet|cidr|macaddr|macaddr8|interval|timetz|time|point|line|lseg|box|path|polygon|circle|bytea|bit|varbit|money|xml|oid|enumType|domainType)\s*\([^)]*\)([^,\n]*)(,?)$/gm;
    content = content.replace(columnLineRegex, (match, indent, colName, type, modifiers, comma) => {
        if (modifiers.includes('.$id(')) {
            return match;
        }
        const commentMatch = modifiers.match(/^(.*)(\.\s*comment\s*\([^)]+\))$/);
        if (commentMatch) {
            const beforeComment = commentMatch[1];
            const comment = commentMatch[2];
            const trackingId = generateTrackingId('c');
            injectedCount++;
            return `${indent}${colName}: ${type}(${match.split('(')[1].split(')')[0]})${beforeComment}.$id('${trackingId}')${comment}${comma}`;
        }
        const trackingId = generateTrackingId('c');
        injectedCount++;
        return `${indent}${colName}: ${type}(${match.split('(')[1].split(')')[0]})${modifiers}.$id('${trackingId}')${comma}`;
    });
    const indexLineRegex = /^(\s*)(index\s*\(\s*['"][^'"]+['"]\s*\)\s*\.on\s*\([^)]+\)[^,\n]*)(,?)$/gm;
    content = content.replace(indexLineRegex, (match, indent, indexDef, comma) => {
        if (indexDef.includes('.$id(')) {
            return match;
        }
        const commentMatch = indexDef.match(/^(.*)(\.\s*comment\s*\([^)]+\))$/);
        if (commentMatch) {
            const beforeComment = commentMatch[1];
            const comment = commentMatch[2];
            const trackingId = generateTrackingId('i');
            injectedCount++;
            return `${indent}${beforeComment}.$id('${trackingId}')${comment}${comma}`;
        }
        const trackingId = generateTrackingId('i');
        injectedCount++;
        return `${indent}${indexDef}.$id('${trackingId}')${comma}`;
    });
    if (injectedCount > 0) {
        fs.writeFileSync(schemaPath, content, 'utf-8');
    }
    return injectedCount;
}
async function addCommand(context) {
    const { args, projectRoot } = context;
    console.log('');
    if (!(0, repo_manager_1.isInitialized)(projectRoot)) {
        (0, spinner_1.fatal)('not a relq repository (or any parent directories): .relq', `Run ${spinner_1.colors.cyan('relq init')} to initialize.`);
    }
    const ignorePatterns = (0, relqignore_1.loadRelqignore)(projectRoot);
    const config = await (0, config_1.loadConfig)();
    const schemaPathRaw = (0, config_loader_1.getSchemaPath)(config);
    const schemaPath = path.resolve(projectRoot, schemaPathRaw);
    const { requireValidSchema } = await Promise.resolve().then(() => __importStar(require("../utils/config-loader.cjs")));
    await requireValidSchema(schemaPath, context.flags);
    const injectedCount = injectTrackingIds(schemaPath);
    if (injectedCount > 0) {
        console.log(spinner_1.colors.muted(`Injected ${injectedCount} tracking ID(s) into schema.ts`));
    }
    const fileChange = (0, repo_manager_1.detectFileChanges)(schemaPath, projectRoot);
    if (fileChange) {
        const currentSchema = parseSchemaFileForComparison(schemaPath);
        const snapshot = (0, repo_manager_1.loadSnapshot)(projectRoot);
        if (config?.connection && (0, config_1.isAwsDsqlConfig)(config.connection) && currentSchema) {
            const dsqlValidation = (0, dsql_validator_1.validateSchemaForDsql)({
                tables: currentSchema.tables.map(t => ({
                    name: t.name,
                    columns: t.columns.map(c => ({
                        name: c.name,
                        type: c.dataType,
                        references: c.references ? { table: c.references.table } : undefined,
                    })),
                })),
                functions: currentSchema.functions?.map(f => ({
                    name: f.name,
                    language: f.language,
                    body: f.definition,
                })),
                triggers: currentSchema.triggers?.map(t => ({ name: t.name })),
                sequences: currentSchema.sequences?.map(s => ({ name: s.name })),
                extensions: currentSchema.extensions,
            });
            if (!dsqlValidation.valid) {
                console.log('');
                console.log((0, dsql_validator_1.formatDsqlErrors)(dsqlValidation));
                (0, spinner_1.fatal)('Schema contains DSQL incompatibilities', 'Fix the issues above before staging changes.');
            }
            if (dsqlValidation.warnings.length > 0) {
                console.log((0, dsql_validator_1.formatDsqlErrors)({ valid: true, errors: [], warnings: dsqlValidation.warnings }));
            }
        }
        if (currentSchema && snapshot) {
            const snapshotAsDbSchema = snapshotToDatabaseSchema(snapshot);
            const schemaChanges = await (0, schema_comparator_1.compareSchemas)(snapshotAsDbSchema, currentSchema);
            (0, repo_manager_1.cleanupStagedChanges)(schemaChanges, projectRoot);
            if (schemaChanges.length > 0) {
                (0, repo_manager_1.clearUnstagedChanges)(projectRoot);
                (0, repo_manager_1.addUnstagedChanges)(schemaChanges, projectRoot);
            }
            else {
                (0, repo_manager_1.clearUnstagedChanges)(projectRoot);
            }
        }
    }
    const allUnstaged = (0, repo_manager_1.getUnstagedChanges)(projectRoot);
    const staged = (0, repo_manager_1.getStagedChanges)(projectRoot);
    const unstaged = allUnstaged.filter(change => {
        const objectType = change.objectType;
        const result = (0, relqignore_1.isIgnored)(objectType, change.objectName, change.parentName || null, ignorePatterns);
        if (result.ignored) {
            return false;
        }
        if (['FUNCTION', 'PROCEDURE'].includes(change.objectType) && !config?.includeFunctions) {
            return false;
        }
        if (change.objectType === 'TRIGGER' && !config?.includeTriggers) {
            return false;
        }
        if (['VIEW', 'MATERIALIZED_VIEW'].includes(change.objectType) && !config?.includeViews) {
            return false;
        }
        if (change.objectType === 'FOREIGN_TABLE' && !config?.includeFDW) {
            return false;
        }
        return true;
    });
    const filteredCount = allUnstaged.length - unstaged.length;
    if (unstaged.length === 0) {
        if (staged.length > 0) {
            console.log('All changes are already staged');
            console.log(`${spinner_1.colors.muted(`${staged.length} change(s) ready to commit`)}`);
            console.log('');
            console.log(`hint: run 'relq commit -m "message"' to commit`);
        }
        else if (filteredCount > 0) {
            console.log('No stageable changes');
            console.log(`${spinner_1.colors.muted(`${filteredCount} change(s) filtered by .relqignore or config`)}`);
        }
        else {
            console.log('No changes to stage');
            console.log(`hint: run 'relq pull' or 'relq import' to detect changes`);
        }
        console.log('');
        return;
    }
    const patterns = args.length > 0 ? args : ['.'];
    const stagedNow = (0, repo_manager_1.stageChanges)(patterns, projectRoot);
    if (stagedNow.length === 0) {
        (0, spinner_1.warning)(`No changes matched the pattern(s): ${patterns.join(', ')}`);
        console.log('');
        return;
    }
    let totalCount = stagedNow.length;
    for (const change of stagedNow) {
        if (change.type === 'CREATE' && change.objectType === 'TABLE') {
            const tableData = change.after;
            if (tableData?.columns) {
                for (const col of tableData.columns) {
                    if (col.references?.table)
                        totalCount++;
                }
            }
            if (tableData?.constraints) {
                for (const con of tableData.constraints) {
                    if (con.definition && con.definition.startsWith('CHECK'))
                        totalCount++;
                }
            }
        }
    }
    console.log(`Staged ${totalCount} change(s):`);
    console.log('');
    for (const change of stagedNow) {
        const display = (0, change_tracker_1.getChangeDisplayName)(change);
        const color = change.type === 'CREATE' ? spinner_1.colors.green :
            change.type === 'DROP' ? spinner_1.colors.red :
                spinner_1.colors.yellow;
        console.log(`   ${color(display)}`);
        if (change.type === 'CREATE' && change.objectType === 'TABLE') {
            const tableData = change.after;
            if (tableData?.columns) {
                for (const col of tableData.columns) {
                    if (col.references?.table) {
                        let fkDisplay = `+ FK ${tableData.name}.${col.name} → ${col.references.table}`;
                        if (col.references.onDelete)
                            fkDisplay += ` ON DELETE ${col.references.onDelete.toUpperCase()}`;
                        console.log(`   ${spinner_1.colors.green(fkDisplay)}`);
                    }
                }
            }
            if (tableData?.constraints) {
                for (const con of tableData.constraints) {
                    if (con.definition && con.definition.startsWith('CHECK')) {
                        console.log(`   ${spinner_1.colors.green(`+ CHECK ${con.name} on ${tableData.name}`)}`);
                    }
                }
            }
        }
    }
    console.log('');
    const remainingUnstaged = (0, repo_manager_1.getUnstagedChanges)(projectRoot);
    if (remainingUnstaged.length > 0) {
        console.log(`${spinner_1.colors.muted(`${remainingUnstaged.length} change(s) still unstaged`)}`);
        console.log('');
    }
    console.log(`hint: run 'relq commit -m "message"' to commit`);
    console.log('');
}
function getRelatedChanges(tableName, changes) {
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
exports.default = addCommand;
