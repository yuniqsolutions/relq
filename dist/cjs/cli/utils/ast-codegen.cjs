"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetTrackingIdCounter = resetTrackingIdCounter;
exports.assignTrackingIds = assignTrackingIds;
exports.mergeTrackingIdsFromParsed = mergeTrackingIdsFromParsed;
exports.copyTrackingIdsToNormalized = copyTrackingIdsToNormalized;
exports.generateTypeScriptFromAST = generateTypeScriptFromAST;
exports.generateFunctionsFile = generateFunctionsFile;
exports.generateTriggersFile = generateTriggersFile;
const utils_1 = require("./ast/codegen/utils.cjs");
const sql_formatter_1 = require("sql-formatter");
const builder_1 = require("./ast/codegen/builder.cjs");
const type_map_1 = require("./ast/codegen/type-map.cjs");
const defaults_1 = require("./ast/codegen/defaults.cjs");
const constraints_1 = require("./ast/codegen/constraints.cjs");
const pg_parser_1 = require("./pg-parser.cjs");
const VALID_INDEX_METHODS = new Set(['BTREE', 'HASH', 'GIN', 'GIST', 'BRIN', 'SPGIST']);
let needsDefaultImport = false;
let needsSqlImport = false;
let trackingIdCounter = 0;
function generateTrackingId(prefix) {
    trackingIdCounter++;
    const base = (Date.now().toString(36) + trackingIdCounter.toString(36)).slice(-5);
    return prefix + base.padStart(5, '0');
}
function formatGeneratedExpr(expr, indent) {
    if (expr.length <= 100)
        return expr;
    const indentStr = ' '.repeat(indent);
    const breakMethods = ['setWeight', 'toTsvector', 'concat'];
    let result = '';
    let i = 0;
    let depth = 0;
    while (i < expr.length) {
        const char = expr[i];
        if (char === '(')
            depth++;
        else if (char === ')')
            depth--;
        if (char === '.' && depth === 0 && i > 0) {
            for (const method of breakMethods) {
                if (expr.substring(i + 1, i + 1 + method.length + 1).startsWith(method + '(')) {
                    let parenDepth = 0;
                    let j = i + 1 + method.length;
                    while (j < expr.length) {
                        if (expr[j] === '(')
                            parenDepth++;
                        else if (expr[j] === ')') {
                            parenDepth--;
                            if (parenDepth === 0) {
                                result += expr.substring(i, j + 1);
                                i = j + 1;
                                if (i < expr.length && expr[i] === '.') {
                                    result += '\n' + indentStr;
                                }
                                break;
                            }
                        }
                        j++;
                    }
                    break;
                }
            }
        }
        if (i < expr.length) {
            result += expr[i];
            i++;
        }
    }
    return result || expr;
}
function resetTrackingIdCounter() {
    trackingIdCounter = 0;
}
function assignTrackingIds(schema) {
    for (const table of schema.tables) {
        if (!table.trackingId) {
            table.trackingId = generateTrackingId('t');
        }
        for (const col of table.columns) {
            if (!col.trackingId) {
                col.trackingId = generateTrackingId('c');
            }
        }
        for (const idx of table.indexes) {
            if (!idx.trackingId) {
                idx.trackingId = generateTrackingId('i');
            }
        }
        for (const con of table.constraints) {
            if (!con.trackingId) {
                con.trackingId = generateTrackingId('k');
            }
        }
    }
    for (const e of schema.enums) {
        if (!e.trackingId) {
            e.trackingId = generateTrackingId('e');
        }
    }
    for (const f of schema.functions) {
        if (!f.trackingId) {
            f.trackingId = generateTrackingId('f');
        }
    }
    for (const s of schema.sequences) {
        if (!s.trackingId) {
            s.trackingId = generateTrackingId('s');
        }
    }
    for (const v of schema.views) {
        if (!v.trackingId) {
            v.trackingId = generateTrackingId('v');
        }
    }
    for (const d of schema.domains) {
        if (!d.trackingId) {
            d.trackingId = generateTrackingId('d');
        }
    }
    for (const ct of schema.compositeTypes) {
        if (!ct.trackingId) {
            ct.trackingId = generateTrackingId('p');
        }
    }
    for (const tr of schema.triggers) {
        if (!tr.trackingId) {
            tr.trackingId = generateTrackingId('r');
        }
    }
    return schema;
}
function mergeTrackingIdsFromParsed(target, source) {
    const sourceTableMap = new Map(source.tables.map(t => [t.name, t]));
    for (const table of target.tables) {
        const sourceTable = sourceTableMap.get(table.name);
        if (!sourceTable)
            continue;
        if (sourceTable.trackingId && !table.trackingId) {
            table.trackingId = sourceTable.trackingId;
        }
        const sourceColMap = new Map(sourceTable.columns.map(c => [c.name, c]));
        for (const col of table.columns) {
            const sourceCol = sourceColMap.get(col.name);
            if (sourceCol?.trackingId && !col.trackingId) {
                col.trackingId = sourceCol.trackingId;
            }
        }
        const sourceIdxMap = new Map(sourceTable.indexes.map(i => [i.name, i]));
        for (const idx of table.indexes) {
            const sourceIdx = sourceIdxMap.get(idx.name);
            if (sourceIdx?.trackingId && !idx.trackingId) {
                idx.trackingId = sourceIdx.trackingId;
            }
        }
    }
    const sourceEnumMap = new Map(source.enums.map(e => [e.name, e]));
    for (const e of target.enums) {
        const sourceEnum = sourceEnumMap.get(e.name);
        if (sourceEnum?.trackingId && !e.trackingId) {
            e.trackingId = sourceEnum.trackingId;
        }
    }
    const sourceFuncMap = new Map(source.functions.map(f => [f.name, f]));
    for (const f of target.functions) {
        const sourceFunc = sourceFuncMap.get(f.name);
        if (sourceFunc?.trackingId && !f.trackingId) {
            f.trackingId = sourceFunc.trackingId;
        }
    }
    const sourceSeqMap = new Map(source.sequences.map(s => [s.name, s]));
    for (const s of target.sequences) {
        const sourceSeq = sourceSeqMap.get(s.name);
        if (sourceSeq?.trackingId && !s.trackingId) {
            s.trackingId = sourceSeq.trackingId;
        }
    }
    const sourceViewMap = new Map(source.views.map(v => [v.name, v]));
    for (const v of target.views) {
        const sourceView = sourceViewMap.get(v.name);
        if (sourceView?.trackingId && !v.trackingId) {
            v.trackingId = sourceView.trackingId;
        }
    }
    const sourceDomainMap = new Map(source.domains.map(d => [d.name, d]));
    for (const d of target.domains) {
        const sourceDomain = sourceDomainMap.get(d.name);
        if (sourceDomain?.trackingId && !d.trackingId) {
            d.trackingId = sourceDomain.trackingId;
        }
    }
    const sourceTriggerMap = new Map(source.triggers.map(t => [t.name, t]));
    for (const t of target.triggers) {
        const sourceTrigger = sourceTriggerMap.get(t.name);
        if (sourceTrigger?.trackingId && !t.trackingId) {
            t.trackingId = sourceTrigger.trackingId;
        }
    }
}
function copyTrackingIdsToNormalized(parsedSchema, normalizedSchema) {
    const tableMap = new Map();
    for (const table of parsedSchema.tables) {
        const columnMap = new Map();
        for (const col of table.columns) {
            if (col.trackingId) {
                columnMap.set(col.name, col.trackingId);
            }
        }
        const indexMap = new Map();
        for (const idx of table.indexes) {
            if (idx.trackingId) {
                indexMap.set(idx.name, idx.trackingId);
            }
        }
        tableMap.set(table.name, {
            trackingId: table.trackingId,
            columns: columnMap,
            indexes: indexMap,
        });
    }
    for (const table of normalizedSchema.tables) {
        const parsed = tableMap.get(table.name);
        if (!parsed)
            continue;
        if (parsed.trackingId) {
            table.trackingId = parsed.trackingId;
        }
        for (const col of table.columns) {
            const colTrackingId = parsed.columns.get(col.name);
            if (colTrackingId) {
                col.trackingId = colTrackingId;
            }
        }
        for (const idx of table.indexes) {
            const idxTrackingId = parsed.indexes.get(idx.name);
            if (idxTrackingId) {
                idx.trackingId = idxTrackingId;
            }
        }
    }
}
function getExplicitFKName(constraintName, tableName, columnName) {
    if (!constraintName)
        return undefined;
    const expectedAutoName = `${tableName}_${columnName}_fkey`;
    if (constraintName.toLowerCase() === expectedAutoName.toLowerCase()) {
        return undefined;
    }
    return constraintName;
}
function generateColumnCode(col, useCamelCase, enumNames, domainNames, checkOverride, genericTypeName) {
    const colName = useCamelCase ? (0, utils_1.toCamelCase)(col.name) : col.name;
    const commentSuffix = col.comment ? `.comment('${(0, utils_1.escapeString)(col.comment)}')` : '';
    let line;
    const normalizedType = col.type.toLowerCase();
    if (enumNames.has(normalizedType) || enumNames.has(col.type)) {
        const enumName = `${(0, utils_1.toCamelCase)(col.type)}Enum`;
        if (useCamelCase && colName !== col.name) {
            line = `    ${colName}: ${enumName}('${col.name}')`;
        }
        else {
            line = `    ${colName}: ${enumName}()`;
        }
    }
    else if (domainNames.has(normalizedType) || domainNames.has(col.type)) {
        const domainName = `${(0, utils_1.toCamelCase)(col.type)}Domain`;
        if (useCamelCase && colName !== col.name) {
            line = `    ${colName}: ${domainName}('${col.name}')`;
        }
        else {
            line = `    ${colName}: ${domainName}()`;
        }
    }
    else {
        let typeBuilder;
        const isJsonType = normalizedType === 'json' || normalizedType === 'jsonb';
        const genericSuffix = isJsonType && genericTypeName ? `<${genericTypeName}>` : '';
        if (useCamelCase && colName !== col.name) {
            const builderInfo = (0, type_map_1.getColumnBuilderWithInfo)(col.type, col.typeParams);
            typeBuilder = `${builderInfo.builderName}${genericSuffix}('${col.name}')`;
            if (builderInfo.length != null) {
                typeBuilder += `.length(${builderInfo.length})`;
            }
        }
        else {
            typeBuilder = (0, type_map_1.getColumnBuilder)(col.type, col.typeParams);
            if (genericSuffix) {
                typeBuilder = typeBuilder.replace(/(\w+)\(/, `$1${genericSuffix}(`);
            }
        }
        if (col.isArray) {
            typeBuilder = `${typeBuilder}.array()`;
        }
        line = `    ${colName}: ${typeBuilder}`;
    }
    if (col.isPrimaryKey) {
        line += '.primaryKey()';
    }
    if (col.isUnique && !col.isPrimaryKey) {
        line += '.unique()';
    }
    if (checkOverride) {
        const valuesStr = checkOverride.values.map(v => `'${(0, utils_1.escapeString)(v)}'`).join(', ');
        line += `.check('${checkOverride.name}', [${valuesStr}])`;
    }
    else if (col.checkConstraint) {
        const enumValues = (0, constraints_1.extractEnumValues)(col.checkConstraint.expression);
        if (enumValues && enumValues.length > 0) {
            const valuesStr = enumValues.map(v => `'${(0, utils_1.escapeString)(v)}'`).join(', ');
            line += `.check('${col.checkConstraint.name}', [${valuesStr}])`;
        }
    }
    if (col.hasDefault && col.defaultValue) {
        const defaultVal = (0, defaults_1.formatDefaultValue)(col.defaultValue, col.type);
        line += `.default(${defaultVal})`;
    }
    if (!col.isNullable && !col.isPrimaryKey) {
        line += '.notNull()';
    }
    const trackingId = col.trackingId || generateTrackingId('c');
    line += `.$id('${trackingId}')`;
    return line + commentSuffix;
}
function generateIndexCode(index, useCamelCase) {
    const cols = index.columns.map(c => {
        if (index.isExpression || c.includes('(') || c.includes(' ')) {
            return `'${c}'`;
        }
        return `table.${useCamelCase ? (0, utils_1.toCamelCase)(c) : c}`;
    }).join(', ');
    let line = `        index('${index.name}').on(${cols})`;
    if (index.isUnique) {
        line += '.unique()';
    }
    if (index.method && index.method.toUpperCase() !== 'BTREE') {
        const method = index.method.toUpperCase();
        if (VALID_INDEX_METHODS.has(method)) {
            line += `.using('${method}')`;
        }
    }
    if (index.opclass) {
        line += `.opclass('${index.opclass}')`;
    }
    if (index.whereClauseAst) {
        try {
            const whereExpr = (0, builder_1.astToBuilder)(index.whereClauseAst, {
                prefix: 'table',
                useCamelCase,
                useTableRef: true
            });
            line += `.where(${whereExpr})`;
        }
        catch {
            needsSqlImport = true;
            line += `.where(sql\`${(0, utils_1.escapeString)(index.whereClause || '')}\`)`;
        }
    }
    else if (index.whereClause) {
        const typedWhere = convertWhereClauseToTyped(index.whereClause, useCamelCase);
        if (typedWhere.startsWith('sql`')) {
            needsSqlImport = true;
        }
        line += `.where(${typedWhere})`;
    }
    if (index.includeColumns && index.includeColumns.length > 0) {
        const includeCols = index.includeColumns.map(c => `table.${useCamelCase ? (0, utils_1.toCamelCase)(c) : c}`).join(', ');
        line += `.include(${includeCols})`;
    }
    const trackingId = index.trackingId || generateTrackingId('i');
    line += `.$id('${trackingId}')`;
    if (index.comment) {
        line += `.comment('${(0, utils_1.escapeString)(index.comment)}')`;
    }
    return line;
}
function convertWhereClauseToTyped(whereClause, useCamelCase) {
    const trimmed = whereClause.trim();
    let expr = trimmed;
    while (expr.startsWith('(') && expr.endsWith(')')) {
        const inner = expr.slice(1, -1);
        if ((0, utils_1.isBalanced)(inner)) {
            expr = inner;
        }
        else {
            break;
        }
    }
    const boolMatch = expr.match(/^(\w+)\s*=\s*(true|false)$/i);
    if (boolMatch) {
        const colName = useCamelCase ? (0, utils_1.toCamelCase)(boolMatch[1]) : boolMatch[1];
        const value = boolMatch[2].toLowerCase();
        return `table.${colName}.eq(${value})`;
    }
    const numMatch = expr.match(/^(\w+)\s*=\s*(-?\d+(?:\.\d+)?)$/i);
    if (numMatch) {
        const colName = useCamelCase ? (0, utils_1.toCamelCase)(numMatch[1]) : numMatch[1];
        return `table.${colName}.eq(${numMatch[2]})`;
    }
    const strMatch = expr.match(/^(\w+)\s*=\s*'([^']*)'$/i);
    if (strMatch) {
        const colName = useCamelCase ? (0, utils_1.toCamelCase)(strMatch[1]) : strMatch[1];
        return `table.${colName}.eq('${strMatch[2]}')`;
    }
    const isNullMatch = expr.match(/^(\w+)\s+IS\s+NULL$/i);
    if (isNullMatch) {
        const colName = useCamelCase ? (0, utils_1.toCamelCase)(isNullMatch[1]) : isNullMatch[1];
        return `table.${colName}.isNull()`;
    }
    const isNotNullMatch = expr.match(/^(\w+)\s+IS\s+NOT\s+NULL$/i);
    if (isNotNullMatch) {
        const colName = useCamelCase ? (0, utils_1.toCamelCase)(isNotNullMatch[1]) : isNotNullMatch[1];
        return `table.${colName}.isNotNull()`;
    }
    const andMatch = expr.match(/^\((.+?)\)\s+AND\s+\((.+)\)$/i);
    if (andMatch) {
        const typed1 = convertWhereClauseToTyped(`(${andMatch[1]})`, useCamelCase);
        const typed2 = convertWhereClauseToTyped(`(${andMatch[2]})`, useCamelCase);
        if (!typed1.startsWith('sql`') && !typed2.startsWith('sql`')) {
            return `${typed1}.and(${typed2})`;
        }
    }
    const orMatch = expr.match(/^\((.+?)\)\s+OR\s+\((.+)\)$/i);
    if (orMatch) {
        const typed1 = convertWhereClauseToTyped(`(${orMatch[1]})`, useCamelCase);
        const typed2 = convertWhereClauseToTyped(`(${orMatch[2]})`, useCamelCase);
        if (!typed1.startsWith('sql`') && !typed2.startsWith('sql`')) {
            return `${typed1}.or(${typed2})`;
        }
    }
    return `sql\`${(0, utils_1.escapeString)(whereClause)}\``;
}
function parsePartitionValues(valuesStr) {
    const values = [];
    let current = '';
    let depth = 0;
    let inString = false;
    let stringChar = '';
    for (let i = 0; i < valuesStr.length; i++) {
        const char = valuesStr[i];
        if (!inString && (char === "'" || char === '"')) {
            inString = true;
            stringChar = char;
            current += char;
        }
        else if (inString && char === stringChar) {
            if (i + 1 < valuesStr.length && valuesStr[i + 1] === stringChar) {
                current += char + valuesStr[i + 1];
                i++;
            }
            else {
                inString = false;
                current += char;
            }
        }
        else if (!inString && char === '(') {
            depth++;
            current += char;
        }
        else if (!inString && char === ')') {
            depth--;
            current += char;
        }
        else if (!inString && char === ',' && depth === 0) {
            if (current.trim()) {
                values.push(current.trim());
            }
            current = '';
        }
        else {
            current += char;
        }
    }
    if (current.trim()) {
        values.push(current.trim());
    }
    return values;
}
function formatPartitionValue(value) {
    const trimmed = value.trim();
    if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
        const inner = trimmed.slice(1, -1);
        const parts = parsePartitionValues(inner);
        return `[${parts.join(', ')}]`;
    }
    const upper = trimmed.toUpperCase();
    if (upper === 'MINVALUE')
        return "'MINVALUE'";
    if (upper === 'MAXVALUE')
        return "'MAXVALUE'";
    return trimmed;
}
function generatePartitionCode(child, partitionType, useCamelCase) {
    const childName = child.name;
    const bound = child.partitionBound || '';
    const partType = partitionType.toUpperCase();
    if (bound.toUpperCase().includes('DEFAULT')) {
        return `        partition('${childName}').default()`;
    }
    if (partType === 'LIST') {
        const inMatch = bound.match(/FOR VALUES IN\s*\((.+)\)/i);
        if (inMatch) {
            const valuesStr = inMatch[1].trim();
            const values = parsePartitionValues(valuesStr);
            const formattedValues = values.map(formatPartitionValue).join(', ');
            return `        partition('${childName}').in([${formattedValues}])`;
        }
    }
    else if (partType === 'RANGE') {
        const rangeMatch = bound.match(/FOR VALUES FROM\s*\((.+?)\)\s*TO\s*\((.+?)\)$/i);
        if (rangeMatch) {
            const fromRaw = rangeMatch[1].trim();
            const toRaw = rangeMatch[2].trim();
            let fromVal;
            if (fromRaw.toUpperCase() === 'MINVALUE') {
                fromVal = "'MINVALUE'";
            }
            else if (fromRaw.includes(',')) {
                const fromParts = parsePartitionValues(fromRaw);
                fromVal = `[${fromParts.map(formatPartitionValue).join(', ')}]`;
            }
            else {
                fromVal = formatPartitionValue(fromRaw);
            }
            let toVal;
            if (toRaw.toUpperCase() === 'MAXVALUE') {
                toVal = "'MAXVALUE'";
            }
            else if (toRaw.includes(',')) {
                const toParts = parsePartitionValues(toRaw);
                toVal = `[${toParts.map(formatPartitionValue).join(', ')}]`;
            }
            else {
                toVal = formatPartitionValue(toRaw);
            }
            return `        partition('${childName}').from(${fromVal}).to(${toVal})`;
        }
    }
    else if (partType === 'HASH') {
        const hashMatch = bound.match(/FOR VALUES WITH\s*\(MODULUS\s*(\d+),\s*REMAINDER\s*(\d+)\)/i);
        if (hashMatch) {
            const remainder = hashMatch[2];
            return `        partition('${childName}').remainder(${remainder})`;
        }
    }
    needsSqlImport = true;
    return `        partition('${childName}').in([sql\`${(0, utils_1.escapeString)(bound)}\`])`;
}
function generateTableCode(table, useCamelCase, enumNames, domainNames, columnTypeMap = {}) {
    const tableName = useCamelCase ? (0, utils_1.toCamelCase)(table.name) : table.name;
    const parts = [];
    const tableComment = table.comment ? `    comment: '${(0, utils_1.escapeString)(table.comment)}'` : null;
    const columnChecks = new Map();
    for (const c of table.constraints) {
        if (c.type === 'CHECK' && c.expression) {
            const extractedCol = (0, pg_parser_1.extractColumnFromCheck)(c.expression);
            if (extractedCol) {
                const matchingCol = table.columns.find(col => col.name.toLowerCase() === extractedCol);
                if (matchingCol) {
                    const values = (0, constraints_1.extractEnumValues)(c.expression);
                    if (values && values.length > 0) {
                        columnChecks.set(matchingCol.name, { name: c.name, values });
                    }
                }
            }
        }
    }
    const singleColPkColumns = new Set();
    for (const c of table.constraints) {
        if (c.type === 'PRIMARY KEY' && c.columns.length === 1) {
            const normalizedCol = useCamelCase ? (0, utils_1.toCamelCase)(c.columns[0]) : c.columns[0];
            singleColPkColumns.add(normalizedCol);
        }
    }
    const compositeColPkColumns = new Set();
    for (const c of table.constraints) {
        if (c.type === 'PRIMARY KEY' && c.columns.length > 1) {
            for (const col of c.columns) {
                const normalizedCol = useCamelCase ? (0, utils_1.toCamelCase)(col) : col;
                compositeColPkColumns.add(normalizedCol);
            }
        }
    }
    const uniqueColumns = new Set();
    for (const c of table.constraints) {
        if (c.type === 'UNIQUE' && c.columns.length === 1) {
            const normalizedCol = useCamelCase ? (0, utils_1.toCamelCase)(c.columns[0]) : c.columns[0];
            uniqueColumns.add(normalizedCol);
        }
    }
    const updatedColumns = table.columns.map(col => {
        const normalizedColName = useCamelCase ? (0, utils_1.toCamelCase)(col.name) : col.name;
        const isSingleColPk = singleColPkColumns.has(col.name) || singleColPkColumns.has(normalizedColName);
        const isCompositePkMember = compositeColPkColumns.has(col.name) || compositeColPkColumns.has(normalizedColName);
        return {
            ...col,
            isPrimaryKey: isSingleColPk && !isCompositePkMember,
            isUnique: col.isUnique || uniqueColumns.has(col.name) || uniqueColumns.has(normalizedColName),
        };
    });
    const columnLines = updatedColumns.map(col => {
        const columnKey = `${table.name}.${col.name}`;
        const genericTypeName = columnTypeMap[columnKey];
        return generateColumnCode(col, useCamelCase, enumNames, domainNames, columnChecks.get(col.name), genericTypeName);
    });
    const optionParts = [];
    if (table.isPartitioned && table.partitionType && table.partitionKey?.length) {
        const partCol = useCamelCase ? (0, utils_1.toCamelCase)(table.partitionKey[0]) : table.partitionKey[0];
        const partType = table.partitionType.toLowerCase();
        if (partType === 'hash') {
            optionParts.push(`    partitionBy: (table, p) => p.hash(table.${partCol}, 4)`);
        }
        else {
            optionParts.push(`    partitionBy: (table, p) => p.${partType}(table.${partCol})`);
        }
        if (table.childPartitions && table.childPartitions.length > 0) {
            const partitionLines = table.childPartitions.map(child => {
                return generatePartitionCode(child, table.partitionType, useCamelCase);
            });
            optionParts.push(`    partitions: (partition) => [\n${partitionLines.join(',\n')},\n    ]`);
        }
    }
    const compositePKs = table.constraints.filter(c => c.type === 'PRIMARY KEY' && c.columns.length > 1);
    const compositeUniques = table.constraints.filter(c => c.type === 'UNIQUE' && c.columns.length > 1);
    const excludeConstraints = table.constraints.filter(c => c.type === 'EXCLUDE');
    if (compositePKs.length > 0 || compositeUniques.length > 0 || excludeConstraints.length > 0) {
        const constraintLines = (0, constraints_1.generateConstraintCode)([...compositePKs, ...compositeUniques, ...excludeConstraints], useCamelCase);
        if (constraintLines.length > 0) {
            optionParts.push(`    constraints: (table, constraint) => [\n${constraintLines.join(',\n')},\n    ]`);
        }
    }
    const checkConstraintsOption = (0, constraints_1.generateCheckConstraintsOption)(table.constraints, useCamelCase);
    if (checkConstraintsOption) {
        optionParts.push(checkConstraintsOption);
    }
    const generatedCols = table.columns.filter(col => col.isGenerated && col.generatedExpression);
    if (generatedCols.length > 0) {
        const generatedLines = [];
        for (const col of generatedCols) {
            const colName = useCamelCase ? (0, utils_1.toCamelCase)(col.name) : col.name;
            const ast = col.generatedExpressionAst;
            if (ast) {
                try {
                    const builderExpr = (0, builder_1.astToBuilder)(ast, {
                        prefix: 't',
                        useCamelCase,
                        useTableRef: true,
                        chainable: true,
                    });
                    const formattedExpr = formatGeneratedExpr(builderExpr, 16);
                    generatedLines.push(`        As.on(t.${colName}).as(${formattedExpr})`);
                }
                catch (err) {
                    throw new Error(`Failed to generate typed expression for generated column "${col.name}": ${err instanceof Error ? err.message : String(err)}\n` +
                        `SQL expression: ${col.generatedExpression}\n` +
                        `Hint: Add missing function to KNOWN_BUILDER_FUNCTIONS in src/cli/utils/ast/codegen/builder.ts`);
                }
            }
            else {
                throw new Error(`Missing generatedExpressionAst for column "${col.name}". ` +
                    `The SQL expression "${col.generatedExpression}" cannot be converted to typed builder.`);
            }
        }
        if (generatedLines.length > 0) {
            optionParts.push(`    generatedAs: (t, As) => [\n${generatedLines.join(',\n')},\n    ]`);
        }
    }
    if (table.indexes.length > 0) {
        const indexLines = table.indexes.map(idx => generateIndexCode(idx, useCamelCase));
        optionParts.push(`    indexes: (table, index) => [\n${indexLines.join(',\n')},\n    ]`);
    }
    if (tableComment) {
        optionParts.push(tableComment);
    }
    const tableTrackingId = table.trackingId || generateTrackingId('t');
    optionParts.push(`    $trackingId: '${tableTrackingId}'`);
    let tableCode;
    if (optionParts.length > 0) {
        tableCode = `export const ${tableName} = defineTable('${table.name}', {\n${columnLines.join(',\n')},\n}, {\n${optionParts.join(',\n')},\n})`;
    }
    else {
        tableCode = `export const ${tableName} = defineTable('${table.name}', {\n${columnLines.join(',\n')},\n})`;
    }
    parts.push(tableCode);
    return parts.join('\n');
}
function generateEnumCode(enumDef, useCamelCase) {
    const baseName = useCamelCase ? (0, utils_1.toCamelCase)(enumDef.name) : enumDef.name;
    const enumName = `${baseName}Enum`;
    const values = Array.isArray(enumDef.values) ? enumDef.values : typeof enumDef.values === 'string' ? enumDef.values.replace(/^\{|\}$/g, '').split(',').filter(Boolean) : [];
    const valuesStr = values.map(v => `'${(0, utils_1.escapeString)(v)}'`).join(', ');
    const trackingId = enumDef.trackingId || generateTrackingId('e');
    return `export const ${enumName} = pgEnum('${enumDef.name}', [${valuesStr}]).$id('${trackingId}')`;
}
function generateDomainCode(domain, useCamelCase) {
    const baseName = useCamelCase ? (0, utils_1.toCamelCase)(domain.name) : domain.name;
    const domainName = `${baseName}Domain`;
    const baseType = (0, type_map_1.getColumnBuilder)(domain.baseType);
    let line = `export const ${domainName} = pgDomain('${domain.name}', ${baseType})`;
    if (domain.notNull) {
        line += '.notNull()';
    }
    if (domain.defaultValue) {
        line += `.default(${(0, defaults_1.formatDefaultValue)(domain.defaultValue)})`;
    }
    if (domain.checkExpression) {
        line += `.check('${(0, utils_1.escapeString)(domain.checkExpression)}')`;
    }
    const trackingId = domain.trackingId || generateTrackingId('d');
    line += `.$id('${trackingId}')`;
    return line;
}
function generateExtensionsCode(extensions) {
    if (extensions.length === 0)
        return '';
    const extList = extensions.map(e => `'${(0, utils_1.escapeString)(e)}'`).join(', ');
    return `export const extensions = pgExtensions(${extList})`;
}
function generateSequenceCode(seq, useCamelCase) {
    const seqName = useCamelCase ? (0, utils_1.toCamelCase)(seq.name) : seq.name;
    const opts = [];
    if (seq.startValue !== undefined)
        opts.push(`start: ${seq.startValue}`);
    if (seq.increment !== undefined)
        opts.push(`increment: ${seq.increment}`);
    if (seq.minValue !== undefined)
        opts.push(`minValue: ${seq.minValue}`);
    if (seq.maxValue !== undefined)
        opts.push(`maxValue: ${seq.maxValue}`);
    if (seq.cache !== undefined)
        opts.push(`cache: ${seq.cache}`);
    if (seq.cycle)
        opts.push(`cycle: true`);
    if (seq.ownedBy)
        opts.push(`ownedBy: '${seq.ownedBy.table}.${seq.ownedBy.column}'`);
    const trackingId = seq.trackingId || generateTrackingId('s');
    opts.push(`trackingId: '${trackingId}'`);
    const optsStr = opts.length > 0 ? `, { ${opts.join(', ')} }` : '';
    return `export const ${seqName} = pgSequence('${seq.name}'${optsStr})`;
}
function generateFunctionCode(func, useCamelCase, varNameOverride) {
    const funcName = varNameOverride || (useCamelCase ? (0, utils_1.toCamelCase)(func.name) : func.name);
    const parts = [];
    parts.push(`export const ${funcName} = pgFunction('${func.name}', {`);
    if (func.args.length > 0) {
        const argsStr = func.args.map((arg, index) => {
            const argParts = [];
            const argName = arg.name || `$${index + 1}`;
            argParts.push(`name: '${argName}'`);
            argParts.push(`type: '${arg.type}'`);
            if (arg.mode && arg.mode !== 'IN')
                argParts.push(`mode: '${arg.mode}'`);
            if (arg.default)
                argParts.push(`default: '${(0, utils_1.escapeString)(arg.default)}'`);
            return `{ ${argParts.join(', ')} }`;
        }).join(', ');
        parts.push(`    args: [${argsStr}],`);
    }
    parts.push(`    returns: '${func.returnType}',`);
    parts.push(`    language: '${func.language}',`);
    let formattedBody = func.body;
    const lang = func.language?.toLowerCase();
    if (func.body && (lang === 'plpgsql' || lang === 'sql')) {
        try {
            formattedBody = (0, sql_formatter_1.format)(func.body, {
                language: 'postgresql',
                tabWidth: 4,
                keywordCase: 'upper',
            });
        }
        catch {
            formattedBody = func.body;
        }
    }
    const trimmedBodyUpper = formattedBody.trim().toUpperCase();
    const useRaw = trimmedBodyUpper.startsWith('DECLARE') ||
        (trimmedBodyUpper.includes('DECLARE') && trimmedBodyUpper.indexOf('DECLARE') < trimmedBodyUpper.indexOf('BEGIN'));
    let finalBody = formattedBody;
    if (!useRaw && lang === 'plpgsql') {
        const trimmed = formattedBody.trim();
        const upperTrimmed = trimmed.toUpperCase();
        if (upperTrimmed.startsWith('BEGIN') && upperTrimmed.endsWith('END;')) {
            let inner = trimmed.slice(5);
            inner = inner.slice(0, -4);
            finalBody = inner.trim();
        }
    }
    const escapedBody = finalBody.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
    const indentedBody = escapedBody
        .split('\n')
        .map(line => '        ' + line)
        .join('\n');
    const bodyKey = useRaw ? 'raw' : 'body';
    parts.push(`    ${bodyKey}: \`\n${indentedBody}\n    \`,`);
    if (func.volatility)
        parts.push(`    volatility: '${func.volatility}',`);
    if (func.isStrict)
        parts.push(`    strict: true,`);
    if (func.securityDefiner)
        parts.push(`    securityDefiner: true,`);
    if (func.comment) {
        const escapedComment = func.comment.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/'/g, "\\'");
        parts.push(`    comment: '${escapedComment}',`);
    }
    parts.push(`})`);
    if (func.trackingId) {
        parts[parts.length - 1] = parts[parts.length - 1].replace('})', `}).$id('${func.trackingId}')`);
    }
    return parts.join('\n');
}
function generateViewCode(view, useCamelCase) {
    const viewName = useCamelCase ? (0, utils_1.toCamelCase)(view.name) : view.name;
    const funcName = view.isMaterialized ? 'pgMaterializedView' : 'pgView';
    const escapedDef = view.definition.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
    const trackingId = view.trackingId || generateTrackingId('v');
    return `export const ${viewName} = ${funcName}('${view.name}', \`${escapedDef}\`).$id('${trackingId}')`;
}
function generateTriggerCode(trigger, useCamelCase, functionNames) {
    const triggerName = useCamelCase ? (0, utils_1.toCamelCase)(trigger.name) : trigger.name;
    const tableName = useCamelCase ? (0, utils_1.toCamelCase)(trigger.table) : trigger.table;
    const parts = [];
    parts.push(`export const ${triggerName} = pgTrigger('${trigger.name}', {`);
    parts.push(`    on: ${tableName},`);
    parts.push(`    timing: '${trigger.timing}',`);
    parts.push(`    events: [${trigger.events.map(e => `'${e}'`).join(', ')}],`);
    parts.push(`    forEach: '${trigger.forEach}',`);
    const funcVarName = useCamelCase ? (0, utils_1.toCamelCase)(trigger.functionName) : trigger.functionName;
    if (functionNames.has(trigger.functionName)) {
        parts.push(`    execute: ${funcVarName},`);
    }
    else {
        parts.push(`    execute: '${trigger.functionName}',`);
    }
    if (trigger.whenClause)
        parts.push(`    when: '${(0, utils_1.escapeString)(trigger.whenClause)}',`);
    if (trigger.isConstraint)
        parts.push(`    constraint: true,`);
    if (trigger.deferrable)
        parts.push(`    deferrable: true,`);
    if (trigger.initiallyDeferred)
        parts.push(`    initiallyDeferred: true,`);
    if (trigger.comment) {
        const escapedComment = trigger.comment.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/'/g, "\\'");
        parts.push(`    comment: '${escapedComment}',`);
    }
    parts.push(`})`);
    if (trigger.trackingId) {
        parts[parts.length - 1] = parts[parts.length - 1].replace('})', `}).$id('${trigger.trackingId}')`);
    }
    return parts.join('\n');
}
function generateTypeScriptFromAST(schema, options) {
    const { camelCase = true, importPath, includeEnums = true, includeDomains = true, includeTables = true, includeFunctions = true, includeTriggers = true, columnTypeMap = {}, typesImportPath, } = options;
    const parts = [];
    parts.push('/**');
    parts.push(' * Auto-generated by Relq CLI (AST-based)');
    parts.push(` * Generated at: ${new Date().toISOString()}`);
    parts.push(' * DO NOT EDIT - changes will be overwritten');
    parts.push(' */');
    parts.push('');
    needsDefaultImport = false;
    needsSqlImport = false;
    (0, defaults_1.resetDefaultImportFlags)();
    (0, constraints_1.resetSqlImportFlag)();
    const needsPgExtensions = schema.extensions.length > 0;
    const needsPgSequence = schema.sequences.length > 0;
    const needsPgFunction = includeFunctions && schema.functions.length > 0;
    const needsPgTrigger = includeTriggers && schema.triggers.length > 0;
    const needsPgEnum = includeEnums && schema.enums.length > 0;
    const needsPgView = options.includeViews !== false && schema.views.filter(v => !v.isMaterialized).length > 0;
    const needsPgMaterializedView = options.includeViews !== false && schema.views.filter(v => v.isMaterialized).length > 0;
    const enumNames = new Set(schema.enums.map(e => e.name.toLowerCase()));
    const domainNames = new Set(schema.domains.map(d => d.name.toLowerCase()));
    const tableCodeParts = [];
    const usedColumnTypes = new Set();
    const sortedTables = [...schema.tables].sort((a, b) => {
        if (a.partitionOf)
            return 1;
        if (b.partitionOf)
            return -1;
        return a.name.localeCompare(b.name);
    });
    for (const table of sortedTables) {
        if (table.partitionOf)
            continue;
        const code = generateTableCode(table, camelCase, enumNames, domainNames, columnTypeMap);
        tableCodeParts.push(code);
        for (const col of table.columns) {
            if (enumNames.has(col.type.toLowerCase())) {
            }
            else if (domainNames.has(col.type.toLowerCase())) {
            }
            else {
                const builder = (0, type_map_1.getColumnBuilder)(col.type, col.typeParams);
                const typeName = builder.split('(')[0];
                if (typeName) {
                    usedColumnTypes.add(typeName);
                }
            }
        }
    }
    const needsRelations = schema.tables.some(table => !table.partitionOf && (table.constraints.some(c => c.type === 'FOREIGN KEY' && c.references) ||
        table.columns.some(c => c.references)));
    const imports = ['defineTable'];
    if (needsPgEnum)
        imports.push('pgEnum');
    if (includeDomains && schema.domains.length > 0)
        imports.push('pgDomain');
    if (needsPgExtensions)
        imports.push('pgExtensions');
    if (needsPgSequence)
        imports.push('pgSequence');
    if (needsPgView)
        imports.push('pgView');
    if (needsPgMaterializedView)
        imports.push('pgMaterializedView');
    if (needsPgFunction)
        imports.push('pgFunction');
    if (needsPgTrigger)
        imports.push('pgTrigger');
    const finalNeedsDefaultImport = needsDefaultImport || (0, defaults_1.getDefaultImportNeeded)();
    const finalNeedsSqlImport = needsSqlImport || (0, constraints_1.getSqlImportNeeded)() || (0, defaults_1.getDefaultSqlImportNeeded)();
    if (finalNeedsDefaultImport)
        imports.push('DEFAULT');
    if (finalNeedsSqlImport)
        imports.push('sql');
    if (needsRelations)
        imports.push('pgRelations');
    for (const type of usedColumnTypes) {
        if (!imports.includes(type))
            imports.push(type);
    }
    parts.push(`import {`);
    parts.push(`    ${imports.join(',\n    ')},`);
    parts.push(`    type RelqDatabaseSchema,`);
    parts.push(`} from '${importPath}';`);
    const usedTypeNames = new Set(Object.values(columnTypeMap));
    if (usedTypeNames.size > 0 && typesImportPath) {
        const typeNames = Array.from(usedTypeNames).sort();
        parts.push(`import type { ${typeNames.join(', ')} } from '${typesImportPath}';`);
    }
    parts.push('');
    if (needsPgExtensions) {
        parts.push('// =============================================================================');
        parts.push('// EXTENSIONS');
        parts.push('// =============================================================================');
        parts.push('');
        parts.push(generateExtensionsCode(schema.extensions));
        parts.push('');
    }
    if (needsPgEnum) {
        parts.push('// =============================================================================');
        parts.push('// ENUMS');
        parts.push('// =============================================================================');
        parts.push('');
        for (const enumDef of schema.enums) {
            parts.push(generateEnumCode(enumDef, camelCase));
        }
        parts.push('');
    }
    if (includeDomains && schema.domains.length > 0) {
        parts.push('// =============================================================================');
        parts.push('// DOMAINS');
        parts.push('// =============================================================================');
        parts.push('');
        for (const domain of schema.domains) {
            parts.push(generateDomainCode(domain, camelCase));
        }
        parts.push('');
    }
    if (needsPgSequence) {
        parts.push('// =============================================================================');
        parts.push('// SEQUENCES');
        parts.push('// =============================================================================');
        parts.push('');
        for (const seq of schema.sequences) {
            parts.push(generateSequenceCode(seq, camelCase));
        }
        parts.push('');
    }
    if (includeTables && schema.tables.length > 0) {
        parts.push('// =============================================================================');
        parts.push('// TABLES');
        parts.push('// =============================================================================');
        parts.push('');
        const sortedTables = [...schema.tables].sort((a, b) => {
            if (a.partitionOf)
                return 1;
            if (b.partitionOf)
                return -1;
            return a.name.localeCompare(b.name);
        });
        for (const table of sortedTables) {
            if (table.partitionOf)
                continue;
            parts.push(generateTableCode(table, camelCase, enumNames, domainNames, columnTypeMap));
            parts.push('');
        }
    }
    if ((needsPgView || needsPgMaterializedView) && schema.views.length > 0) {
        parts.push('// =============================================================================');
        parts.push('// VIEWS');
        parts.push('// =============================================================================');
        parts.push('');
        for (const view of schema.views) {
            parts.push(generateViewCode(view, camelCase));
            parts.push('');
        }
    }
    if (needsPgFunction) {
        parts.push('// =============================================================================');
        parts.push('// FUNCTIONS');
        parts.push('// =============================================================================');
        parts.push('');
        for (const func of schema.functions) {
            parts.push(generateFunctionCode(func, camelCase));
            parts.push('');
        }
    }
    if (needsPgTrigger) {
        parts.push('// =============================================================================');
        parts.push('// TRIGGERS');
        parts.push('// =============================================================================');
        parts.push('');
        const functionNames = new Set(schema.functions.map(f => f.name));
        for (const trigger of schema.triggers) {
            parts.push(generateTriggerCode(trigger, camelCase, functionNames));
            parts.push('');
        }
    }
    parts.push('// =============================================================================');
    parts.push('// SCHEMA EXPORT');
    parts.push('// =============================================================================');
    parts.push('');
    const tableNames = schema.tables
        .filter(t => !t.partitionOf)
        .map(t => camelCase ? (0, utils_1.toCamelCase)(t.name) : t.name)
        .sort();
    parts.push('export const schema = {');
    for (const name of tableNames) {
        parts.push(`    ${name},`);
    }
    parts.push('} as const;');
    parts.push('');
    parts.push('export type DatabaseSchema = RelqDatabaseSchema<typeof schema>;');
    parts.push('');
    const relationsCode = generateRelationsCode(schema, camelCase);
    if (relationsCode) {
        parts.push('// =============================================================================');
        parts.push('// RELATIONS');
        parts.push('// =============================================================================');
        parts.push('');
        parts.push(relationsCode);
        parts.push('');
    }
    return parts.join('\n');
}
function generateRelationsCode(schema, camelCase) {
    const foreignKeys = [];
    for (const table of schema.tables) {
        if (table.partitionOf)
            continue;
        for (const column of table.columns) {
            if (column.references) {
                foreignKeys.push({
                    fromTable: table.name,
                    fromColumn: column.name,
                    toTable: column.references.table,
                    toColumn: column.references.column,
                    onDelete: column.references.onDelete,
                    onUpdate: column.references.onUpdate,
                    match: column.references.match,
                    deferrable: column.references.deferrable,
                    initiallyDeferred: column.references.initiallyDeferred,
                });
            }
        }
        for (const constraint of table.constraints) {
            if (constraint.type === 'FOREIGN KEY' && constraint.references) {
                if (constraint.columns.length === 1 && constraint.references.columns.length === 1) {
                    const alreadyExists = foreignKeys.some(fk => fk.fromTable === table.name &&
                        fk.fromColumn === constraint.columns[0] &&
                        fk.toTable === constraint.references.table);
                    if (!alreadyExists) {
                        foreignKeys.push({
                            fromTable: table.name,
                            fromColumn: constraint.columns[0],
                            toTable: constraint.references.table,
                            toColumn: constraint.references.columns[0],
                            constraintName: getExplicitFKName(constraint.name, table.name, constraint.columns[0]),
                            onDelete: constraint.references.onDelete,
                            onUpdate: constraint.references.onUpdate,
                            match: constraint.references.match,
                            deferrable: constraint.references.deferrable,
                            initiallyDeferred: constraint.references.initiallyDeferred,
                        });
                    }
                }
                else if (constraint.columns.length > 1) {
                    foreignKeys.push({
                        fromTable: table.name,
                        fromColumn: constraint.columns[0],
                        toTable: constraint.references.table,
                        toColumn: constraint.references.columns[0],
                        constraintName: getExplicitFKName(constraint.name, table.name, constraint.columns[0]),
                        onDelete: constraint.references.onDelete,
                        onUpdate: constraint.references.onUpdate,
                        match: constraint.references.match,
                        deferrable: constraint.references.deferrable,
                        initiallyDeferred: constraint.references.initiallyDeferred,
                        isComposite: true,
                        fromColumns: constraint.columns,
                        toColumns: constraint.references.columns,
                    });
                }
            }
        }
    }
    if (foreignKeys.length === 0) {
        return null;
    }
    const relationsByTable = new Map();
    const usedRelationNames = new Map();
    for (const fk of foreignKeys) {
        const fromTableName = camelCase ? (0, utils_1.toCamelCase)(fk.fromTable) : fk.fromTable;
        const toTableName = camelCase ? (0, utils_1.toCamelCase)(fk.toTable) : fk.toTable;
        const fromColName = camelCase ? (0, utils_1.toCamelCase)(fk.fromColumn) : fk.fromColumn;
        const toColName = camelCase ? (0, utils_1.toCamelCase)(fk.toColumn) : fk.toColumn;
        const relationName = fromColName;
        if (!usedRelationNames.has(fromTableName)) {
            usedRelationNames.set(fromTableName, new Set());
        }
        const usedNames = usedRelationNames.get(fromTableName);
        let finalRelationName = relationName;
        let suffix = 1;
        while (usedNames.has(finalRelationName)) {
            finalRelationName = `${relationName}${suffix}`;
            suffix++;
        }
        usedNames.add(finalRelationName);
        const options = [];
        if (fk.isComposite && fk.fromColumns && fk.toColumns) {
            const fromCols = fk.fromColumns.map(c => `'${camelCase ? (0, utils_1.toCamelCase)(c) : c}'`).join(', ');
            const toCols = fk.toColumns.map(c => `t.${camelCase ? (0, utils_1.toCamelCase)(c) : c}`).join(', ');
            options.push(`columns: [${fromCols}]`);
            options.push(`references: [${toCols}]`);
            if (fk.constraintName) {
                options.push(`name: '${fk.constraintName}'`);
            }
            if (fk.onDelete && fk.onDelete !== 'NO ACTION') {
                options.push(`onDelete: '${fk.onDelete}'`);
            }
            if (fk.onUpdate && fk.onUpdate !== 'NO ACTION') {
                options.push(`onUpdate: '${fk.onUpdate}'`);
            }
            if (fk.match && fk.match !== 'SIMPLE') {
                options.push(`match: '${fk.match}'`);
            }
            if (fk.deferrable) {
                options.push(`deferrable: true`);
            }
            if (fk.initiallyDeferred) {
                options.push(`initiallyDeferred: true`);
            }
        }
        else {
            options.push(`columns: '${fromColName}'`);
            if (fk.constraintName) {
                options.push(`name: '${fk.constraintName}'`);
            }
            const isValidColumn = fk.toColumn &&
                fk.toColumn.length > 0 &&
                /^[a-zA-Z_]/.test(fk.toColumn) &&
                fk.toColumn.toLowerCase() !== 'id';
            if (isValidColumn) {
                options.push(`references: t.${toColName}`);
            }
            if (fk.onDelete && fk.onDelete !== 'NO ACTION') {
                options.push(`onDelete: '${fk.onDelete}'`);
            }
            if (fk.onUpdate && fk.onUpdate !== 'NO ACTION') {
                options.push(`onUpdate: '${fk.onUpdate}'`);
            }
            if (fk.match && fk.match !== 'SIMPLE') {
                options.push(`match: '${fk.match}'`);
            }
            if (fk.deferrable) {
                options.push(`deferrable: true`);
            }
            if (fk.initiallyDeferred) {
                options.push(`initiallyDeferred: true`);
            }
        }
        const trackingId = generateTrackingId('f');
        options.push(`trackingId: '${trackingId}'`);
        const sqlComment = generateFKSQLComment(fk, camelCase);
        if (sqlComment) {
            options.push(`comment: '${(0, utils_1.escapeString)(sqlComment)}'`);
        }
        const optionsStr = options.join(',\n            ');
        const code = `r.referenceTo.${toTableName}(t => ({
            ${optionsStr},
        }))`;
        if (!relationsByTable.has(fromTableName)) {
            relationsByTable.set(fromTableName, []);
        }
        relationsByTable.get(fromTableName).push({ relationName: finalRelationName, code });
    }
    const lines = [];
    const tableNames = new Set(schema.tables.map(t => camelCase ? (0, utils_1.toCamelCase)(t.name) : t.name));
    let relationsExportName = 'relations';
    if (tableNames.has('relations')) {
        if (!tableNames.has('dbRelations')) {
            relationsExportName = 'dbRelations';
        }
        else if (!tableNames.has('fdbRelations')) {
            relationsExportName = 'fdbRelations';
        }
        else {
            relationsExportName = '_relqRelations';
        }
    }
    lines.push(`export const ${relationsExportName} = pgRelations(schema, (tables) => ({`);
    const sortedTables = [...relationsByTable.keys()].sort();
    for (const tableName of sortedTables) {
        const tableRelations = relationsByTable.get(tableName);
        lines.push(`    ${tableName}: tables.${tableName}((r) => [`);
        for (const rel of tableRelations) {
            lines.push(`        ${rel.code},`);
        }
        lines.push('    ]),');
    }
    lines.push('}));');
    return lines.join('\n');
}
function generateFKSQLComment(fk, _camelCase) {
    const parts = [];
    const isValidCol = (col) => col && col.length > 0 && /^[a-zA-Z_]/.test(col);
    if (fk.isComposite && fk.fromColumns) {
        const validToCols = fk.toColumns?.filter(isValidCol);
        if (validToCols && validToCols.length > 0) {
            parts.push(`(${fk.fromColumns.join(', ')}) → ${fk.toTable}(${validToCols.join(', ')})`);
        }
        else {
            parts.push(`(${fk.fromColumns.join(', ')}) → ${fk.toTable}`);
        }
    }
    else {
        const targetCol = isValidCol(fk.toColumn) && fk.toColumn.toLowerCase() !== 'id'
            ? `(${fk.toColumn})`
            : '';
        parts.push(`→ ${fk.toTable}${targetCol}`);
    }
    if (fk.onDelete && fk.onDelete !== 'NO ACTION') {
        parts.push(`ON DELETE ${fk.onDelete}`);
    }
    if (fk.onUpdate && fk.onUpdate !== 'NO ACTION') {
        parts.push(`ON UPDATE ${fk.onUpdate}`);
    }
    if (fk.match && fk.match !== 'SIMPLE') {
        parts.push(`MATCH ${fk.match}`);
    }
    if (fk.deferrable) {
        parts.push(fk.initiallyDeferred ? 'DEFERRABLE INITIALLY DEFERRED' : 'DEFERRABLE');
    }
    return parts.join(' | ');
}
function resolveFunctionVarName(func, usedNames, useCamelCase) {
    const baseName = useCamelCase ? (0, utils_1.toCamelCase)(func.name) : func.name;
    const count = usedNames.get(baseName) || 0;
    usedNames.set(baseName, count + 1);
    if (count === 0) {
        return baseName;
    }
    return `${baseName}_${count + 1}`;
}
function generateFunctionsFile(schema, options) {
    const { camelCase = true, importPath, schemaImportPath = './schema', } = options;
    if (schema.functions.length === 0) {
        return null;
    }
    const parts = [];
    parts.push('/**');
    parts.push(' * Auto-generated by Relq CLI');
    parts.push(` * Generated at: ${new Date().toISOString()}`);
    parts.push(' * DO NOT EDIT - changes will be overwritten');
    parts.push(' */');
    parts.push('');
    parts.push(`import { pgFunction } from '${importPath}';`);
    void schemaImportPath;
    parts.push('');
    const usedNames = new Map();
    const functionVarNames = [];
    parts.push('// =============================================================================');
    parts.push('// FUNCTIONS');
    parts.push('// =============================================================================');
    parts.push('');
    for (const func of schema.functions) {
        const varName = resolveFunctionVarName(func, usedNames, camelCase);
        functionVarNames.push(varName);
        parts.push(generateFunctionCode(func, camelCase, varName));
        parts.push('');
    }
    parts.push('// =============================================================================');
    parts.push('// EXPORTS');
    parts.push('// =============================================================================');
    parts.push('');
    parts.push('export const functions = {');
    for (const name of functionVarNames) {
        parts.push(`    ${name},`);
    }
    parts.push('} as const;');
    parts.push('');
    return parts.join('\n');
}
function generateTriggersFile(schema, options) {
    const { camelCase = true, importPath, schemaImportPath = './schema', functionsImportPath = './schema.functions', } = options;
    if (schema.triggers.length === 0) {
        return null;
    }
    const parts = [];
    parts.push('/**');
    parts.push(' * Auto-generated by Relq CLI');
    parts.push(` * Generated at: ${new Date().toISOString()}`);
    parts.push(' * DO NOT EDIT - changes will be overwritten');
    parts.push(' */');
    parts.push('');
    parts.push(`import { pgTrigger } from '${importPath}';`);
    parts.push(`import { schema } from '${schemaImportPath}';`);
    if (schema.functions.length > 0) {
        parts.push(`import { functions } from '${functionsImportPath}';`);
    }
    parts.push('');
    const functionNames = new Set();
    const usedFuncNames = new Map();
    for (const func of schema.functions) {
        const varName = resolveFunctionVarName(func, usedFuncNames, camelCase);
        functionNames.add(varName);
    }
    parts.push('// =============================================================================');
    parts.push('// TRIGGERS');
    parts.push('// =============================================================================');
    parts.push('');
    const triggerVarNames = [];
    for (const trigger of schema.triggers) {
        const triggerName = camelCase ? (0, utils_1.toCamelCase)(trigger.name) : trigger.name;
        const tableName = camelCase ? (0, utils_1.toCamelCase)(trigger.table) : trigger.table;
        triggerVarNames.push(triggerName);
        parts.push(`export const ${triggerName} = pgTrigger('${trigger.name}', {`);
        parts.push(`    on: schema.${tableName},`);
        const events = trigger.events.length === 1
            ? `'${trigger.events[0]}'`
            : `[${trigger.events.map(e => `'${e}'`).join(', ')}]`;
        if (trigger.timing === 'BEFORE') {
            parts.push(`    before: ${events},`);
        }
        else if (trigger.timing === 'AFTER') {
            parts.push(`    after: ${events},`);
        }
        else if (trigger.timing === 'INSTEAD OF') {
            parts.push(`    insteadOf: ${events},`);
        }
        parts.push(`    forEach: '${trigger.forEach || 'ROW'}',`);
        const funcVarName = camelCase ? (0, utils_1.toCamelCase)(trigger.functionName) : trigger.functionName;
        if (functionNames.has(funcVarName)) {
            parts.push(`    execute: functions.${funcVarName},`);
        }
        else {
            parts.push(`    execute: '${trigger.functionName}',`);
        }
        if (trigger.whenClause)
            parts.push(`    when: '${(0, utils_1.escapeString)(trigger.whenClause)}',`);
        if (trigger.isConstraint)
            parts.push(`    constraint: true,`);
        if (trigger.deferrable)
            parts.push(`    deferrable: true,`);
        if (trigger.initiallyDeferred)
            parts.push(`    initially: 'DEFERRED',`);
        let closing = '})';
        if (trigger.comment) {
            const escapedComment = trigger.comment.replace(/'/g, "\\'");
            closing += `.$comment('${escapedComment}')`;
        }
        if (trigger.trackingId) {
            closing += `.$id('${trigger.trackingId}')`;
        }
        closing += ';';
        parts.push(closing);
        parts.push('');
    }
    parts.push('// =============================================================================');
    parts.push('// EXPORTS');
    parts.push('// =============================================================================');
    parts.push('');
    parts.push('export const triggers = {');
    for (const name of triggerVarNames) {
        parts.push(`    ${name},`);
    }
    parts.push('} as const;');
    parts.push('');
    return parts.join('\n');
}
