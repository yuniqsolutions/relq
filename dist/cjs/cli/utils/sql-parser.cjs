"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseSqlFile = parseSqlFile;
exports.parseFunctions = parseFunctions;
exports.parseTriggers = parseTriggers;
exports.parseProcedures = parseProcedures;
exports.parseComments = parseComments;
function parseSqlFile(sqlContent) {
    const tables = [];
    const enums = [];
    const domains = [];
    const compositeTypes = [];
    const sequences = [];
    const collations = [];
    const foreignTables = [];
    const views = [];
    const materializedViews = [];
    const foreignServers = [];
    const extensions = [];
    const partitions = [];
    const cleanedSql = removeComments(sqlContent);
    parseExtensions(cleanedSql, extensions);
    parseEnums(cleanedSql, enums);
    parseDomains(cleanedSql, domains);
    parseCompositeTypes(cleanedSql, compositeTypes);
    parseSequences(cleanedSql, sequences);
    parseCollations(cleanedSql, collations);
    parseTables(cleanedSql, tables, partitions, enums, domains);
    parseIndexes(cleanedSql, tables);
    parseForeignTables(cleanedSql, foreignTables);
    parseViews(cleanedSql, views);
    parseMaterializedViews(cleanedSql, materializedViews);
    parseForeignServers(cleanedSql, foreignServers);
    return {
        tables, enums, domains, compositeTypes, sequences, collations,
        foreignTables, views, materializedViews, foreignServers,
        extensions, partitions
    };
}
function removeComments(sql) {
    let result = sql.replace(/\/\*[\s\S]*?\*\//g, '');
    result = result.replace(/--[^\n]*/g, '');
    return result;
}
function parseExtensions(sql, extensions) {
    const regex = /CREATE\s+EXTENSION\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:"([^"]+)"|'([^']+)'|([a-zA-Z_][a-zA-Z0-9_-]*))/gi;
    let match;
    while ((match = regex.exec(sql)) !== null) {
        const extName = match[1] || match[2] || match[3];
        if (extName && !extensions.includes(extName)) {
            extensions.push(extName);
        }
    }
}
function parseEnums(sql, enums) {
    const regex = /CREATE\s+TYPE\s+(\w+)\s+AS\s+ENUM\s*\(\s*([\s\S]*?)\s*\)/gi;
    let match;
    while ((match = regex.exec(sql)) !== null) {
        const name = match[1];
        const valuesStr = match[2];
        const values = valuesStr.match(/'([^']+)'/g)?.map(v => v.replace(/'/g, '')) || [];
        enums.push({ name, values });
    }
}
function parseDomains(sql, domains) {
    const regex = /CREATE\s+DOMAIN\s+(\w+)\s+AS\s+(\w+(?:\([^)]+\))?)([\s\S]*?);/gi;
    let match;
    while ((match = regex.exec(sql)) !== null) {
        const name = match[1];
        const baseType = match[2];
        const modifiers = match[3] || '';
        let check;
        const checkMatch = modifiers.match(/CHECK\s*\(\s*([\s\S]*?)\s*\)(?:\s*;|\s*$|\s+(?:DEFAULT|NOT\s+NULL))/i);
        if (checkMatch) {
            check = checkMatch[1].trim();
        }
        else {
            const simpleCheck = modifiers.match(/CHECK\s*\(\s*([\s\S]+?)\s*\)\s*$/i);
            if (simpleCheck) {
                check = simpleCheck[1].trim();
            }
        }
        let defaultValue;
        const defaultMatch = modifiers.match(/DEFAULT\s+([^;\s]+(?:\([^)]*\))?)/i);
        if (defaultMatch) {
            defaultValue = defaultMatch[1].trim();
        }
        const notNull = /NOT\s+NULL/i.test(modifiers);
        domains.push({
            name,
            baseType,
            check,
            default: defaultValue,
            notNull: notNull || undefined,
        });
    }
}
function parseCompositeTypes(sql, compositeTypes) {
    const regex = /CREATE\s+TYPE\s+(\w+)\s+AS\s*\(/gi;
    let match;
    while ((match = regex.exec(sql)) !== null) {
        const name = match[1];
        const startIdx = match.index + match[0].length;
        let depth = 1;
        let endIdx = startIdx;
        for (let i = startIdx; i < sql.length && depth > 0; i++) {
            if (sql[i] === '(')
                depth++;
            else if (sql[i] === ')')
                depth--;
            if (depth === 0)
                endIdx = i;
        }
        if (endIdx > startIdx) {
            const body = sql.substring(startIdx, endIdx);
            const attributes = parseCompositeTypeBody(body);
            if (attributes.length > 0) {
                compositeTypes.push({ name, attributes });
            }
        }
    }
}
function parseCompositeTypeBody(body) {
    const attributes = [];
    const lines = splitByComma(body);
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed)
            continue;
        const attrMatch = trimmed.match(/^(?:"([^"]+)"|(\w+))\s+(.+)$/);
        if (attrMatch) {
            attributes.push({
                name: attrMatch[1] || attrMatch[2],
                type: attrMatch[3].trim().replace(/,\s*$/, ''),
            });
        }
    }
    return attributes;
}
function parseSequences(sql, sequences) {
    const regex = /CREATE\s+SEQUENCE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)([\s\S]*?);/gi;
    let match;
    while ((match = regex.exec(sql)) !== null) {
        const name = match[1];
        const options = match[2] || '';
        const seq = { name };
        const asMatch = options.match(/\bAS\s+(SMALLINT|INTEGER|BIGINT)/i);
        if (asMatch) {
            seq.dataType = asMatch[1].toLowerCase();
        }
        const startMatch = options.match(/START\s+(?:WITH\s+)?(\d+)/i);
        if (startMatch) {
            seq.start = parseInt(startMatch[1], 10);
        }
        const incrementMatch = options.match(/INCREMENT\s+(?:BY\s+)?(\d+)/i);
        if (incrementMatch) {
            seq.increment = parseInt(incrementMatch[1], 10);
        }
        const minMatch = options.match(/MINVALUE\s+(\d+)/i);
        if (minMatch) {
            seq.minValue = parseInt(minMatch[1], 10);
        }
        const maxMatch = options.match(/MAXVALUE\s+(\d+)/i);
        if (maxMatch) {
            seq.maxValue = parseInt(maxMatch[1], 10);
        }
        const cacheMatch = options.match(/CACHE\s+(\d+)/i);
        if (cacheMatch) {
            seq.cache = parseInt(cacheMatch[1], 10);
        }
        if (/\bCYCLE\b/i.test(options) && !/\bNO\s+CYCLE\b/i.test(options)) {
            seq.cycle = true;
        }
        else if (/\bNO\s+CYCLE\b/i.test(options)) {
            seq.cycle = false;
        }
        const ownedMatch = options.match(/OWNED\s+BY\s+(\w+\.\w+)/i);
        if (ownedMatch) {
            seq.ownedBy = ownedMatch[1];
        }
        sequences.push(seq);
    }
}
function parseCollations(sql, collations) {
    const regex = /CREATE\s+COLLATION\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:(\w+)\.)?(\w+)\s*\(([^)]+)\)/gi;
    let match;
    while ((match = regex.exec(sql)) !== null) {
        const schema = match[1] || 'public';
        const name = match[2];
        const optionsStr = match[3];
        const collation = { name, schema };
        const localeMatch = optionsStr.match(/LOCALE\s*=\s*'([^']+)'/i);
        if (localeMatch) {
            collation.locale = localeMatch[1];
        }
        const providerMatch = optionsStr.match(/PROVIDER\s*=\s*(\w+)/i);
        if (providerMatch) {
            collation.provider = providerMatch[1].toLowerCase();
        }
        const lcCollateMatch = optionsStr.match(/LC_COLLATE\s*=\s*'([^']+)'/i);
        if (lcCollateMatch) {
            collation.lcCollate = lcCollateMatch[1];
        }
        const lcCtypeMatch = optionsStr.match(/LC_CTYPE\s*=\s*'([^']+)'/i);
        if (lcCtypeMatch) {
            collation.lcCtype = lcCtypeMatch[1];
        }
        const deterministicMatch = optionsStr.match(/DETERMINISTIC\s*=\s*(TRUE|FALSE)/i);
        if (deterministicMatch) {
            collation.deterministic = deterministicMatch[1].toUpperCase() === 'TRUE';
        }
        collations.push(collation);
    }
}
function parseForeignTables(sql, foreignTables) {
    const regex = /CREATE\s+FOREIGN\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:(\w+)\.)?(\w+)\s*\(/gi;
    let match;
    while ((match = regex.exec(sql)) !== null) {
        const schema = match[1] || 'public';
        const name = match[2];
        const startIdx = match.index + match[0].length;
        const columnsBody = extractBalancedParens(sql, startIdx);
        if (!columnsBody)
            continue;
        const afterColumns = sql.substring(startIdx + columnsBody.length + 1, startIdx + columnsBody.length + 500);
        const serverMatch = afterColumns.match(/SERVER\s+(\w+)/i);
        if (!serverMatch)
            continue;
        const serverName = serverMatch[1];
        const columns = [];
        const columnParts = splitByComma(columnsBody);
        for (const part of columnParts) {
            const trimmed = part.trim();
            if (!trimmed)
                continue;
            const colMatch = trimmed.match(/^(\w+)\s+(\w+(?:\([^)]+\))?)\s*(.*)/i);
            if (colMatch) {
                const colName = colMatch[1];
                const colType = colMatch[2];
                const modifiers = colMatch[3] || '';
                columns.push({
                    name: colName,
                    type: colType,
                    nullable: !modifiers.toUpperCase().includes('NOT NULL'),
                });
            }
        }
        const optionsMatch = afterColumns.match(/OPTIONS\s*\(([^)]+)\)/i);
        let options;
        if (optionsMatch) {
            options = {};
            const optPairs = optionsMatch[1].split(',');
            for (const pair of optPairs) {
                const kv = pair.trim().match(/(\w+)\s+'([^']+)'/);
                if (kv) {
                    options[kv[1]] = kv[2];
                }
            }
        }
        foreignTables.push({ name, schema, serverName, columns, options });
    }
}
function parseTables(sql, tables, partitions, enums, domains) {
    const partitionOfRegex = /CREATE\s+TABLE\s+(\w+)\s+PARTITION\s+OF\s+(\w+)\s+(?:FOR\s+VALUES\s+([\s\S]*?)|DEFAULT)\s*(?:;|$)/gi;
    let partMatch;
    while ((partMatch = partitionOfRegex.exec(sql)) !== null) {
        const childName = partMatch[1];
        const parentTable = partMatch[2];
        const boundClause = partMatch[3] ? partMatch[3].trim().replace(/;$/, '') : 'DEFAULT';
        partitions.push({
            name: childName,
            parentTable,
            partitionType: detectPartitionType(boundClause),
            partitionKey: [],
            partitionBound: boundClause,
        });
    }
    const createTablePrefix = /CREATE\s+(?:UNLOGGED\s+)?TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)\s*\(/gi;
    let createMatch;
    while ((createMatch = createTablePrefix.exec(sql)) !== null) {
        const tableName = createMatch[1];
        const startIndex = createMatch.index + createMatch[0].length;
        const precedingText = sql.substring(createMatch.index, startIndex + 20);
        if (/PARTITION\s+OF/i.test(precedingText)) {
            continue;
        }
        const tableBody = extractBalancedParens(sql, startIndex);
        if (!tableBody)
            continue;
        const afterTableIdx = startIndex + tableBody.length + 1;
        const afterTableText = sql.substring(afterTableIdx, afterTableIdx + 100);
        const partitionMatch = afterTableText.match(/^\s*(PARTITION\s+BY\s+(RANGE|LIST|HASH)\s*\(([^)]+)\))/i);
        let isPartitioned = false;
        let partitionType;
        let partitionKey;
        if (partitionMatch) {
            isPartitioned = true;
            partitionType = partitionMatch[2].toUpperCase();
            partitionKey = partitionMatch[3].split(',').map(k => k.trim().replace(/[()]/g, ''));
        }
        const { columns, constraints, primaryKey } = parseTableBody(tableBody, enums, domains);
        const childPartitions = partitions.filter(p => p.parentTable === tableName);
        tables.push({
            name: tableName,
            schema: 'public',
            columns,
            indexes: [],
            constraints,
            rowCount: 0,
            isPartitioned,
            partitionType,
            partitionKey,
            childPartitions: childPartitions.length > 0 ? childPartitions : undefined,
        });
    }
}
function extractBalancedParens(str, startIndex) {
    let depth = 1;
    let current = '';
    let inQuote = false;
    let quoteChar = '';
    for (let i = startIndex; i < str.length && depth > 0; i++) {
        const char = str[i];
        if ((char === "'" || char === '"') && !inQuote) {
            inQuote = true;
            quoteChar = char;
        }
        else if (char === quoteChar && inQuote) {
            if (i + 1 < str.length && str[i + 1] === quoteChar) {
                current += char;
                i++;
                current += str[i];
                continue;
            }
            inQuote = false;
        }
        if (!inQuote) {
            if (char === '(')
                depth++;
            else if (char === ')') {
                depth--;
                if (depth === 0) {
                    return current;
                }
            }
        }
        current += char;
    }
    return depth === 0 ? current : null;
}
function detectPartitionType(boundClause) {
    if (boundClause.toUpperCase().includes('IN ('))
        return 'LIST';
    if (boundClause.toUpperCase().includes('FROM ('))
        return 'RANGE';
    if (boundClause.toUpperCase().includes('MODULUS'))
        return 'HASH';
    return 'LIST';
}
function parsePartitionClause(clause) {
    const match = clause.match(/PARTITION\s+BY\s+(RANGE|LIST|HASH)\s*\(\s*([^)]+)\s*\)/i);
    if (!match) {
        return { type: 'LIST', keys: [] };
    }
    const type = match[1].toUpperCase();
    const keysStr = match[2];
    const keys = keysStr.split(',').map(k => k.trim().replace(/[()]/g, ''));
    return { type, keys };
}
function parseTableBody(body, enums, domains) {
    const columns = [];
    const constraints = [];
    const primaryKey = [];
    const parts = splitByComma(body);
    for (const part of parts) {
        const trimmed = part.trim();
        if (!trimmed)
            continue;
        const upper = trimmed.toUpperCase();
        const isConstraint = upper.startsWith('CONSTRAINT ') ||
            /^PRIMARY\s+KEY\s*\(/i.test(trimmed) ||
            /^FOREIGN\s+KEY\s*\(/i.test(trimmed) ||
            /^UNIQUE\s*\(/i.test(trimmed) ||
            /^CHECK\s*\(/i.test(trimmed) ||
            /^EXCLUDE\s+(?:USING\s+|ON\s+|\()/i.test(trimmed);
        if (isConstraint) {
            const constraint = parseConstraint(trimmed);
            if (constraint) {
                constraints.push(constraint);
                if (constraint.type === 'PRIMARY KEY' && constraint.columns) {
                    primaryKey.push(...constraint.columns);
                }
            }
        }
        else {
            const column = parseColumnDef(trimmed, enums, domains);
            if (column) {
                columns.push(column);
                const inlineCheckMatch = trimmed.match(/\bCHECK\s*\(/i);
                if (inlineCheckMatch && inlineCheckMatch.index !== undefined) {
                    const checkStart = inlineCheckMatch.index;
                    const afterCheck = trimmed.substring(checkStart + 'CHECK'.length).trim();
                    if (afterCheck.startsWith('(')) {
                        const checkExpr = extractBalancedParens(afterCheck, 1);
                        if (checkExpr) {
                            constraints.push({
                                name: `check_${column.name}`,
                                type: 'CHECK',
                                columns: [column.name],
                                definition: `CHECK (${checkExpr})`,
                            });
                        }
                    }
                }
            }
        }
    }
    for (const pkCol of primaryKey) {
        const col = columns.find(c => c.name.toLowerCase() === pkCol.toLowerCase());
        if (col) {
            col.isPrimaryKey = true;
        }
    }
    return { columns, constraints, primaryKey };
}
function splitByComma(str) {
    const parts = [];
    let current = '';
    let depth = 0;
    let inQuote = false;
    let quoteChar = '';
    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        if ((char === "'" || char === '"') && !inQuote) {
            inQuote = true;
            quoteChar = char;
        }
        else if (char === quoteChar && inQuote) {
            inQuote = false;
        }
        if (!inQuote) {
            if (char === '(' || char === '[')
                depth++;
            else if (char === ')' || char === ']')
                depth--;
            else if (char === ',' && depth === 0) {
                parts.push(current.trim());
                current = '';
                continue;
            }
        }
        current += char;
    }
    if (current.trim()) {
        parts.push(current.trim());
    }
    return parts;
}
function parseColumnDef(def, enums, domains) {
    const match = def.match(/^(?:"([^"]+)"|(\w+))\s+(.+)$/is);
    if (!match)
        return null;
    const name = match[1] || match[2];
    const rest = match[3];
    const typeMatch = rest.match(/^([A-Za-z_][\w]*(?:\s+(?:VARYING|PRECISION|WITHOUT|WITH|TIME|ZONE))*(?:\s*\([^)]+\))?(?:\s*\[\])?)/i);
    if (!typeMatch)
        return null;
    let dataType = typeMatch[1].trim();
    const modifiers = rest.substring(typeMatch[0].length);
    const isNullable = !modifiers.toUpperCase().includes('NOT NULL');
    const isPrimaryKey = modifiers.toUpperCase().includes('PRIMARY KEY');
    const isUnique = modifiers.toUpperCase().includes('UNIQUE');
    let defaultValue = null;
    const defaultIdx = modifiers.toUpperCase().indexOf('DEFAULT');
    if (defaultIdx !== -1) {
        const afterDefault = modifiers.substring(defaultIdx + 7).trim();
        let end = 0;
        let depth = 0;
        let inQuote = false;
        let quoteChar = '';
        for (let i = 0; i < afterDefault.length; i++) {
            const ch = afterDefault[i];
            if (!inQuote) {
                if (ch === "'" || ch === '"') {
                    inQuote = true;
                    quoteChar = ch;
                }
                else if (ch === '(' || ch === '[') {
                    depth++;
                }
                else if (ch === ')' || ch === ']') {
                    depth--;
                }
                else if (depth === 0 && (ch === ',' || /\s/.test(ch))) {
                    if (i > 0) {
                        end = i;
                        break;
                    }
                }
            }
            else if (ch === quoteChar && afterDefault[i - 1] !== '\\') {
                inQuote = false;
            }
            end = i + 1;
        }
        if (end > 0) {
            defaultValue = afterDefault.substring(0, end).trim();
            if (defaultValue.endsWith(',')) {
                defaultValue = defaultValue.slice(0, -1).trim();
            }
        }
    }
    let identityGeneration = null;
    const identityMatch = modifiers.match(/GENERATED\s+(ALWAYS|BY\s+DEFAULT)\s+AS\s+IDENTITY/i);
    if (identityMatch) {
        identityGeneration = identityMatch[1].toUpperCase().replace(/\s+/g, ' ');
    }
    const isGenerated = !identityGeneration && /GENERATED\s+ALWAYS\s+AS\s*\(/i.test(modifiers);
    let generationExpression = null;
    if (isGenerated) {
        const genStartMatch = modifiers.match(/GENERATED\s+ALWAYS\s+AS\s*\(/i);
        if (genStartMatch && genStartMatch.index !== undefined) {
            const startIdx = genStartMatch.index + genStartMatch[0].length;
            let depth = 1;
            let endIdx = startIdx;
            for (let i = startIdx; i < modifiers.length && depth > 0; i++) {
                if (modifiers[i] === '(')
                    depth++;
                else if (modifiers[i] === ')')
                    depth--;
                if (depth === 0)
                    endIdx = i;
            }
            if (endIdx > startIdx) {
                generationExpression = modifiers.substring(startIdx, endIdx).trim();
            }
        }
    }
    let references = null;
    const refMatch = modifiers.match(/REFERENCES\s+(\w+)(?:\s*\(\s*(\w+)\s*\))?/i);
    if (refMatch) {
        references = {
            table: refMatch[1],
            column: refMatch[2] || 'id',
        };
        const onDeleteMatch = modifiers.match(/ON\s+DELETE\s+(CASCADE|SET\s+NULL|SET\s+DEFAULT|RESTRICT|NO\s+ACTION)/i);
        if (onDeleteMatch) {
            references.onDelete = onDeleteMatch[1].toUpperCase().replace(/\s+/g, ' ');
        }
        const onUpdateMatch = modifiers.match(/ON\s+UPDATE\s+(CASCADE|SET\s+NULL|SET\s+DEFAULT|RESTRICT|NO\s+ACTION)/i);
        if (onUpdateMatch) {
            references.onUpdate = onUpdateMatch[1].toUpperCase().replace(/\s+/g, ' ');
        }
    }
    return {
        name,
        dataType: normalizeDataType(dataType),
        isNullable: isNullable && !isPrimaryKey && !identityGeneration,
        defaultValue: (isGenerated || identityGeneration) ? null : defaultValue,
        isPrimaryKey,
        isUnique,
        maxLength: extractMaxLength(dataType),
        precision: null,
        scale: null,
        references,
        comment: undefined,
        isGenerated,
        generationExpression,
        identityGeneration,
    };
}
function normalizeDataType(type) {
    const lower = type.toLowerCase().trim();
    if (lower.endsWith('[]')) {
        return normalizeDataType(lower.slice(0, -2)) + '[]';
    }
    const paramMatch = lower.match(/^([a-z_][a-z0-9_\s]*?)(?:\s*\(([^)]+)\))?$/i);
    if (!paramMatch)
        return lower;
    const baseType = paramMatch[1].trim();
    const params = paramMatch[2];
    const mappings = {
        'character varying': 'varchar',
        'character': 'char',
        'timestamp without time zone': 'timestamp',
        'timestamp with time zone': 'timestamptz',
        'time without time zone': 'time',
        'time with time zone': 'timetz',
        'double precision': 'float8',
        'real': 'float4',
        'int': 'int4',
        'integer': 'int4',
        'bigint': 'int8',
        'smallint': 'int2',
        'boolean': 'bool',
        'bytea': 'bytea',
        'serial': 'serial',
        'bigserial': 'bigserial',
        'smallserial': 'smallserial',
        'text': 'text',
        'uuid': 'uuid',
        'json': 'json',
        'jsonb': 'jsonb',
        'numeric': 'numeric',
        'decimal': 'numeric',
        'varchar': 'varchar',
        'char': 'char',
        'date': 'date',
        'time': 'time',
        'timetz': 'timetz',
        'timestamp': 'timestamp',
        'timestamptz': 'timestamptz',
        'interval': 'interval',
        'inet': 'inet',
        'cidr': 'cidr',
        'macaddr': 'macaddr',
        'tsvector': 'tsvector',
        'tsquery': 'tsquery',
        'vector': 'vector',
    };
    const normalized = mappings[baseType] || baseType;
    if (params) {
        return `${normalized}(${params})`;
    }
    return normalized;
}
function extractMaxLength(type) {
    const match = type.match(/\((\d+)\)/);
    return match ? parseInt(match[1], 10) : null;
}
function parseConstraint(def) {
    const upper = def.toUpperCase();
    const namedMatch = def.match(/CONSTRAINT\s+(?:"([^"]+)"|(\w+))\s+(.+)/is);
    const constraintDef = namedMatch ? namedMatch[3] : def;
    const constraintName = namedMatch ? (namedMatch[1] || namedMatch[2]) : '';
    const constraintUpper = constraintDef.toUpperCase();
    if (constraintUpper.startsWith('PRIMARY KEY')) {
        const colsMatch = constraintDef.match(/PRIMARY\s+KEY\s*\(\s*([^)]+)\s*\)/i);
        const columns = colsMatch ? colsMatch[1].split(',').map(c => c.trim()) : [];
        return {
            name: constraintName || 'pk',
            type: 'PRIMARY KEY',
            columns,
            definition: def,
        };
    }
    if (constraintUpper.startsWith('UNIQUE')) {
        const colsMatch = constraintDef.match(/UNIQUE\s*\(\s*([^)]+)\s*\)/i);
        const columns = colsMatch ? colsMatch[1].split(',').map(c => c.trim()) : [];
        return {
            name: constraintName || 'unique',
            type: 'UNIQUE',
            columns,
            definition: def,
        };
    }
    if (constraintUpper.startsWith('CHECK') || constraintUpper.includes('CHECK')) {
        return {
            name: constraintName || 'check',
            type: 'CHECK',
            columns: [],
            definition: def,
        };
    }
    if (constraintUpper.startsWith('FOREIGN KEY') || constraintUpper.includes('REFERENCES')) {
        return {
            name: constraintName || 'fk',
            type: 'FOREIGN KEY',
            columns: [],
            definition: def,
        };
    }
    if (constraintUpper.startsWith('EXCLUDE')) {
        return {
            name: constraintName || 'exclude',
            type: 'EXCLUDE',
            columns: [],
            definition: def,
        };
    }
    return null;
}
function parseIndexes(sql, tables) {
    const indexRegex = /CREATE\s+(UNIQUE\s+)?INDEX\s+(?:CONCURRENTLY\s+)?(?:IF\s+NOT\s+EXISTS\s+)?(\w+)\s+ON\s+(?:ONLY\s+)?(\w+)(?:\s+USING\s+(\w+))?\s*\(/gi;
    let match;
    while ((match = indexRegex.exec(sql)) !== null) {
        const isUnique = !!match[1];
        const indexName = match[2];
        const tableName = match[3];
        const indexType = match[4] || 'btree';
        const startIdx = match.index + match[0].length;
        const indexContent = extractBalancedParensForIndex(sql, startIdx);
        if (!indexContent)
            continue;
        const afterColumns = sql.substring(startIdx + indexContent.length + 1, startIdx + indexContent.length + 500);
        const whereMatch = afterColumns.match(/^\s*WHERE\s+(.+?)(?:;|$)/i);
        const whereClause = whereMatch ? whereMatch[1].trim().replace(/;$/, '') : null;
        const { columns, expression } = parseIndexColumns(indexContent);
        const endIdx = whereMatch
            ? startIdx + indexContent.length + 1 + whereMatch[0].length
            : startIdx + indexContent.length + 1;
        const fullDefinition = sql.substring(match.index, endIdx).trim().replace(/;$/, '');
        const table = tables.find(t => t.name.toLowerCase() === tableName.toLowerCase());
        if (table) {
            table.indexes.push({
                name: indexName,
                columns,
                isUnique,
                isPrimary: false,
                type: indexType,
                definition: fullDefinition,
                whereClause,
                expression: expression || undefined,
            });
        }
    }
}
function extractBalancedParensForIndex(str, startIndex) {
    let depth = 1;
    let current = '';
    for (let i = startIndex; i < str.length && depth > 0; i++) {
        const char = str[i];
        if (char === '(')
            depth++;
        else if (char === ')') {
            depth--;
            if (depth === 0)
                return current;
        }
        current += char;
    }
    return depth === 0 ? current : null;
}
function parseIndexColumns(content) {
    const columns = [];
    const operatorClasses = [];
    let hasExpression = false;
    const knownOpClasses = new Set([
        'gin_trgm_ops', 'gist_trgm_ops',
        'jsonb_ops', 'jsonb_path_ops',
        'array_ops', 'tsvector_ops',
        'inet_ops', 'range_ops',
        'bpchar_pattern_ops', 'text_pattern_ops', 'varchar_pattern_ops',
    ]);
    const parts = splitByComma(content);
    for (const part of parts) {
        const trimmed = part.trim();
        let cleaned = trimmed.replace(/\s+(ASC|DESC|NULLS\s+(FIRST|LAST))$/gi, '').trim();
        const opClassMatch = cleaned.match(/\s+([a-z_][a-z0-9_]*_ops)\s*$/i);
        if (opClassMatch && knownOpClasses.has(opClassMatch[1].toLowerCase())) {
            operatorClasses.push(opClassMatch[1]);
            cleaned = cleaned.replace(/\s+[a-z_][a-z0-9_]*_ops\s*$/i, '').trim();
        }
        if (/^[a-z_][a-z0-9_]*$/i.test(cleaned)) {
            columns.push(cleaned);
        }
        else {
            hasExpression = true;
            const colMatches = cleaned.match(/\b([a-z_][a-z0-9_]*)\b(?=\s*[,):]|$)/gi);
            if (colMatches) {
                const sqlFunctions = new Set(['lower', 'upper', 'coalesce', 'concat', 'trim', 'to_tsvector',
                    'to_tsquery', 'substring', 'length', 'position', 'replace', 'now', 'current_timestamp',
                    'array', 'nullif', 'greatest', 'least', 'text', 'varchar', 'int', 'integer', 'boolean']);
                for (const col of colMatches) {
                    if (!sqlFunctions.has(col.toLowerCase()) && !columns.includes(col)) {
                        columns.push(col);
                    }
                }
            }
        }
    }
    return {
        columns,
        expression: hasExpression ? content : null,
        operatorClasses,
    };
}
function parseFunctions(sql) {
    const functions = [];
    const funcStartRegex = /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(\w+)\s*\(/gi;
    let startMatch;
    while ((startMatch = funcStartRegex.exec(sql)) !== null) {
        const name = startMatch[1];
        const argsStartIdx = startMatch.index + startMatch[0].length;
        const argsBody = extractBalancedParens(sql, argsStartIdx);
        if (argsBody === null)
            continue;
        const afterArgsIdx = argsStartIdx + argsBody.length + 1;
        const afterArgsPreview = sql.substring(afterArgsIdx, afterArgsIdx + 500);
        const afterArgsFull = sql.substring(afterArgsIdx);
        const returnsMatch = afterArgsPreview.match(/^\s*RETURNS\s+((?:SETOF\s+)?(?:TABLE\s*\([^)]+\)|\w+(?:\s+(?:ZONE|PRECISION|VARYING|WITH(?:OUT)?|TIME))*(?:\s*\[\])?))/i);
        let returnType = 'void';
        if (returnsMatch) {
            returnType = returnsMatch[1].trim();
        }
        const bodyDelimMatch = afterArgsFull.match(/(\$\w*\$)/);
        if (!bodyDelimMatch)
            continue;
        const bodyDelim = bodyDelimMatch[1];
        const bodyStartRelative = afterArgsFull.indexOf(bodyDelim) + bodyDelim.length;
        const bodyEndRelative = afterArgsFull.indexOf(bodyDelim, bodyStartRelative);
        if (bodyEndRelative === -1)
            continue;
        const beforeBody = afterArgsFull.substring(0, bodyStartRelative);
        const afterBody = afterArgsFull.substring(bodyEndRelative, bodyEndRelative + 100);
        const langMatchBefore = beforeBody.match(/LANGUAGE\s+(\w+)/i);
        const langMatchAfter = afterBody.match(/LANGUAGE\s+(\w+)/i);
        const language = langMatchBefore ? langMatchBefore[1] :
            langMatchAfter ? langMatchAfter[1] : 'plpgsql';
        const argTypes = [];
        const argParts = splitByComma(argsBody);
        for (const arg of argParts) {
            const trimmedArg = arg.trim();
            if (!trimmedArg)
                continue;
            if (/^\s*OUT\s+/i.test(trimmedArg) || /^\s*INOUT\s+/i.test(trimmedArg)) {
                continue;
            }
            let argStr = trimmedArg.replace(/^\s*IN\s+/i, '').replace(/^\s*VARIADIC\s+/i, 'VARIADIC ');
            const defaultIdx = argStr.toUpperCase().indexOf(' DEFAULT ');
            if (defaultIdx !== -1) {
                argStr = argStr.substring(0, defaultIdx);
            }
            const parts = argStr.trim().split(/\s+/);
            if (parts.length >= 2) {
                argTypes.push(parts.slice(1).join(' '));
            }
            else if (parts.length === 1 && parts[0]) {
                argTypes.push(parts[0]);
            }
        }
        const fullDefEndIdx = afterArgsIdx + bodyEndRelative + bodyDelim.length;
        const definition = sql.substring(startMatch.index, fullDefEndIdx);
        functions.push({
            name,
            schema: 'public',
            returnType,
            argTypes,
            language,
            definition,
            isAggregate: false,
            volatility: 'VOLATILE',
        });
    }
    return functions;
}
function parseTriggers(sql) {
    const triggers = [];
    const sqlNoComments = sql.replace(/--[^\n]*$/gm, '');
    const triggerRegex = /CREATE\s+(?:OR\s+REPLACE\s+)?(?:CONSTRAINT\s+)?TRIGGER\s+(\w+)([\s\S]*?)EXECUTE\s+(?:FUNCTION|PROCEDURE)\s+(\w+)\s*\([^)]*\)/gi;
    let match;
    while ((match = triggerRegex.exec(sqlNoComments)) !== null) {
        const name = match[1];
        const body = match[2];
        const functionName = match[3];
        const timingMatch = body.match(/\b(BEFORE|AFTER|INSTEAD\s+OF)\b/i);
        const timing = timingMatch ? timingMatch[1].replace(/\s+/g, ' ').toUpperCase() : 'AFTER';
        const eventsMatch = body.match(/(?:BEFORE|AFTER|INSTEAD\s+OF)\s+((?:INSERT|UPDATE|DELETE|TRUNCATE)(?:\s+OR\s+(?:INSERT|UPDATE|DELETE|TRUNCATE))*)/i);
        let events = [];
        if (eventsMatch) {
            events = eventsMatch[1].split(/\s+OR\s+/i).map(e => e.trim().toUpperCase());
        }
        const updateOfMatch = body.match(/UPDATE\s+OF\s+([\w\s,]+?)(?:\s+ON\s+|\s+OR\s+)/i);
        let updateColumns;
        if (updateOfMatch) {
            updateColumns = updateOfMatch[1].split(',').map(c => c.trim());
        }
        const tableMatch = body.match(/\bON\s+(\w+)/i);
        const tableName = tableMatch ? tableMatch[1] : '';
        const forEachMatch = body.match(/FOR\s+EACH\s+(ROW|STATEMENT)/i);
        const forEach = forEachMatch
            ? forEachMatch[1].toUpperCase()
            : 'ROW';
        const whenMatch = body.match(/WHEN\s*\((.+?)\)\s*(?:EXECUTE|$)/is);
        const condition = whenMatch ? whenMatch[1].trim() : undefined;
        const refOldMatch = body.match(/REFERENCING\s+.*?OLD\s+TABLE\s+AS\s+(\w+)/i);
        const refNewMatch = body.match(/REFERENCING\s+.*?NEW\s+TABLE\s+AS\s+(\w+)/i);
        const referencingOld = refOldMatch ? refOldMatch[1] : undefined;
        const referencingNew = refNewMatch ? refNewMatch[1] : undefined;
        const isConstraint = /CREATE\s+(?:OR\s+REPLACE\s+)?CONSTRAINT\s+TRIGGER/i.test(match[0]);
        const isDeferrable = /\bDEFERRABLE\b/i.test(body);
        const isInitiallyDeferred = /\bINITIALLY\s+DEFERRED\b/i.test(body);
        if (tableName) {
            triggers.push({
                name,
                tableName,
                timing,
                event: events[0] || 'INSERT',
                forEach,
                functionName,
                definition: match[0],
                isEnabled: true,
            });
        }
    }
    return triggers;
}
function parseProcedures(sql) {
    const procedures = [];
    const procRegex = /CREATE\s+(?:OR\s+REPLACE\s+)?PROCEDURE\s+(\w+)\s*\(([^)]*)\)\s+(?:LANGUAGE\s+(\w+)\s+)?(?:AS\s+)?(?:\$\w*\$|\$\$)([\s\S]*?)(?:\$\w*\$|\$\$)/gi;
    let match;
    while ((match = procRegex.exec(sql)) !== null) {
        const name = match[1];
        const argsStr = match[2];
        const language = match[3] || 'plpgsql';
        const argTypes = argsStr.split(',')
            .map(arg => arg.trim())
            .filter(Boolean)
            .map(arg => {
            const parts = arg.split(/\s+/);
            return parts.length > 1 ? parts.slice(1).join(' ') : parts[0];
        });
        procedures.push({
            name,
            schema: 'public',
            returnType: 'void',
            argTypes,
            language,
            definition: match[0],
            isAggregate: false,
            volatility: 'VOLATILE',
        });
    }
    return procedures;
}
function parseComments(sql) {
    const comments = [];
    const tableCommentRegex = /COMMENT\s+ON\s+TABLE\s+(?:(?:\w+)\.)?(\w+)\s+IS\s+'((?:[^']|'')*?)'\s*;/gi;
    let match;
    while ((match = tableCommentRegex.exec(sql)) !== null) {
        comments.push({
            objectType: 'TABLE',
            objectName: match[1],
            comment: match[2].replace(/''/g, "'"),
        });
    }
    const columnCommentRegex = /COMMENT\s+ON\s+COLUMN\s+(?:(?:\w+)\.)?(\w+)\.(\w+)\s+IS\s+'((?:[^']|'')*?)'\s*;/gi;
    while ((match = columnCommentRegex.exec(sql)) !== null) {
        comments.push({
            objectType: 'COLUMN',
            objectName: match[1],
            subObjectName: match[2],
            comment: match[3].replace(/''/g, "'"),
        });
    }
    const indexCommentRegex = /COMMENT\s+ON\s+INDEX\s+(?:(?:\w+)\.)?(\w+)\s+IS\s+'((?:[^']|'')*?)'\s*;/gi;
    while ((match = indexCommentRegex.exec(sql)) !== null) {
        comments.push({
            objectType: 'INDEX',
            objectName: match[1],
            comment: match[2].replace(/''/g, "'"),
        });
    }
    const functionCommentRegex = /COMMENT\s+ON\s+FUNCTION\s+(?:(?:\w+)\.)?(\w+)(?:\s*\([^)]*\))?\s+IS\s+'((?:[^']|'')*?)'\s*;/gi;
    while ((match = functionCommentRegex.exec(sql)) !== null) {
        comments.push({
            objectType: 'FUNCTION',
            objectName: match[1],
            comment: match[2].replace(/''/g, "'"),
        });
    }
    const procedureCommentRegex = /COMMENT\s+ON\s+PROCEDURE\s+(?:(?:\w+)\.)?(\w+)(?:\s*\([^)]*\))?\s+IS\s+'((?:[^']|'')*?)'\s*;/gi;
    while ((match = procedureCommentRegex.exec(sql)) !== null) {
        comments.push({
            objectType: 'PROCEDURE',
            objectName: match[1],
            comment: match[2].replace(/''/g, "'"),
        });
    }
    const triggerCommentRegex = /COMMENT\s+ON\s+TRIGGER\s+(\w+)\s+ON\s+(?:(?:\w+)\.)?(\w+)\s+IS\s+'((?:[^']|'')*?)'\s*;/gi;
    while ((match = triggerCommentRegex.exec(sql)) !== null) {
        comments.push({
            objectType: 'TRIGGER',
            objectName: match[1],
            subObjectName: match[2],
            comment: match[3].replace(/''/g, "'"),
        });
    }
    const constraintCommentRegex = /COMMENT\s+ON\s+CONSTRAINT\s+(\w+)\s+ON\s+(?:(?:\w+)\.)?(\w+)\s+IS\s+'((?:[^']|'')*?)'\s*;/gi;
    while ((match = constraintCommentRegex.exec(sql)) !== null) {
        comments.push({
            objectType: 'CONSTRAINT',
            objectName: match[1],
            subObjectName: match[2],
            comment: match[3].replace(/''/g, "'"),
        });
    }
    const sequenceCommentRegex = /COMMENT\s+ON\s+SEQUENCE\s+(?:(?:\w+)\.)?(\w+)\s+IS\s+'((?:[^']|'')*?)'\s*;/gi;
    while ((match = sequenceCommentRegex.exec(sql)) !== null) {
        comments.push({
            objectType: 'SEQUENCE',
            objectName: match[1],
            comment: match[2].replace(/''/g, "'"),
        });
    }
    const domainCommentRegex = /COMMENT\s+ON\s+DOMAIN\s+(?:(?:\w+)\.)?(\w+)\s+IS\s+'((?:[^']|'')*?)'\s*;/gi;
    while ((match = domainCommentRegex.exec(sql)) !== null) {
        comments.push({
            objectType: 'DOMAIN',
            objectName: match[1],
            comment: match[2].replace(/''/g, "'"),
        });
    }
    const typeCommentRegex = /COMMENT\s+ON\s+TYPE\s+(?:(?:\w+)\.)?(\w+)\s+IS\s+'((?:[^']|'')*?)'\s*;/gi;
    while ((match = typeCommentRegex.exec(sql)) !== null) {
        comments.push({
            objectType: 'TYPE',
            objectName: match[1],
            comment: match[2].replace(/''/g, "'"),
        });
    }
    return comments;
}
function parseViews(sql, views) {
    const viewRegex = /CREATE\s+(?:OR\s+REPLACE\s+)?VIEW\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:(?:"?(\w+)"?\.)?"?(\w+)"?)\s*(?:\(([^)]+)\))?\s+AS\s+([\s\S]+?)(?:;|\s+WITH\s+(?:CASCADED|LOCAL)\s+CHECK\s+OPTION\s*;)/gi;
    let match;
    while ((match = viewRegex.exec(sql)) !== null) {
        const schema = match[1] || 'public';
        const name = match[2];
        const columnsStr = match[3];
        const definition = match[4].trim();
        const columns = columnsStr
            ? columnsStr.split(',').map(c => c.trim().replace(/"/g, ''))
            : undefined;
        views.push({
            name,
            schema,
            definition,
            columns,
        });
    }
    const simpleViewRegex = /CREATE\s+(?:OR\s+REPLACE\s+)?VIEW\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:(?:"?(\w+)"?\.)?"?(\w+)"?)\s*AS\s+(SELECT[\s\S]+?);/gi;
    while ((match = simpleViewRegex.exec(sql)) !== null) {
        const schema = match[1] || 'public';
        const name = match[2];
        const definition = match[3].trim();
        if (views.some(v => v.name === name))
            continue;
        views.push({
            name,
            schema,
            definition,
        });
    }
}
function parseMaterializedViews(sql, materializedViews) {
    const mviewRegex = /CREATE\s+MATERIALIZED\s+VIEW\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:(?:"?(\w+)"?\.)?"?(\w+)"?)\s*(?:\(([^)]+)\))?\s+AS\s+([\s\S]+?)(?:WITH\s+(NO\s+)?DATA\s*)?;/gi;
    let match;
    while ((match = mviewRegex.exec(sql)) !== null) {
        const schema = match[1] || 'public';
        const name = match[2];
        const columnsStr = match[3];
        const definition = match[4].trim();
        const withNoData = match[5] !== undefined;
        const columns = columnsStr
            ? columnsStr.split(',').map(c => c.trim().replace(/"/g, ''))
            : undefined;
        materializedViews.push({
            name,
            schema,
            definition,
            columns,
            withData: !withNoData,
        });
    }
}
function parseForeignServers(sql, foreignServers) {
    const serverRegex = /CREATE\s+SERVER\s+(?:IF\s+NOT\s+EXISTS\s+)?"?(\w+)"?\s+FOREIGN\s+DATA\s+WRAPPER\s+"?(\w+)"?\s*(?:OPTIONS\s*\(([^)]+)\))?;/gi;
    let match;
    while ((match = serverRegex.exec(sql)) !== null) {
        const name = match[1];
        const fdwName = match[2];
        const optionsStr = match[3];
        const options = {};
        if (optionsStr) {
            const optParts = optionsStr.split(',');
            for (const part of optParts) {
                const optMatch = part.trim().match(/(\w+)\s+'([^']+)'/);
                if (optMatch) {
                    options[optMatch[1]] = optMatch[2];
                }
            }
        }
        foreignServers.push({
            name,
            fdwName,
            options: Object.keys(options).length > 0 ? options : undefined,
        });
    }
}
exports.default = parseSqlFile;
