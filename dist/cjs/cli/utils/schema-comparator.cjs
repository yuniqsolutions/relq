"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareSchemas = compareSchemas;
exports.compareExtensions = compareExtensions;
exports.compareEnums = compareEnums;
exports.compareDomains = compareDomains;
exports.compareTables = compareTables;
const change_tracker_1 = require("./change-tracker.cjs");
const pg_parser_1 = require("./pg-parser.cjs");
function arraysEqual(a, b) {
    if (a.length !== b.length)
        return false;
    return a.every((val, idx) => val === b[idx]);
}
async function compareSchemas(before, after) {
    const changes = [];
    changes.push(...compareExtensions(before.extensions || [], after.extensions || []));
    changes.push(...compareEnums(before.enums || [], after.enums || []));
    changes.push(...compareDomains(before.domains || [], after.domains || []));
    changes.push(...compareCompositeTypes(before.compositeTypes || [], after.compositeTypes || []));
    changes.push(...compareSequences(before.sequences || [], after.sequences || []));
    changes.push(...await compareTables(before.tables, after.tables));
    changes.push(...compareViews(before.views || [], after.views || []));
    changes.push(...await compareFunctions(before.functions || [], after.functions || []));
    changes.push(...compareTriggers(before.triggers || [], after.triggers || []));
    return changes;
}
function compareExtensions(before, after) {
    const changes = [];
    const beforeSet = new Set(before);
    const afterSet = new Set(after);
    for (const ext of afterSet) {
        if (!beforeSet.has(ext)) {
            changes.push((0, change_tracker_1.createChange)('CREATE', 'EXTENSION', ext, null, { name: ext }));
        }
    }
    for (const ext of beforeSet) {
        if (!afterSet.has(ext)) {
            changes.push((0, change_tracker_1.createChange)('DROP', 'EXTENSION', ext, { name: ext }, null));
        }
    }
    return changes;
}
function compareEnums(before, after) {
    const changes = [];
    const beforeMap = new Map(before.map(e => [e.name, e]));
    const afterMap = new Map(after.map(e => [e.name, e]));
    for (const [name, enumDef] of afterMap) {
        if (!beforeMap.has(name)) {
            changes.push((0, change_tracker_1.createChange)('CREATE', 'ENUM', name, null, enumDef));
        }
        else {
            const beforeEnum = beforeMap.get(name);
            const beforeValues = new Set(beforeEnum.values);
            for (let i = 0; i < enumDef.values.length; i++) {
                const value = enumDef.values[i];
                if (!beforeValues.has(value)) {
                    const afterValue = i > 0 ? enumDef.values[i - 1] : undefined;
                    changes.push((0, change_tracker_1.createChange)('CREATE', 'ENUM_VALUE', value, null, {
                        enumName: name,
                        value,
                        after: afterValue,
                    }, name));
                }
            }
        }
    }
    for (const [name, enumDef] of beforeMap) {
        if (!afterMap.has(name)) {
            changes.push((0, change_tracker_1.createChange)('DROP', 'ENUM', name, enumDef, null));
        }
    }
    return changes;
}
function compareDomains(before, after) {
    const changes = [];
    const beforeMap = new Map(before.map(d => [d.name, d]));
    const afterMap = new Map(after.map(d => [d.name, d]));
    for (const [name, domain] of afterMap) {
        if (!beforeMap.has(name)) {
            changes.push((0, change_tracker_1.createChange)('CREATE', 'DOMAIN', name, null, {
                name: domain.name,
                baseType: domain.baseType,
                notNull: domain.isNotNull,
                default: domain.defaultValue,
                check: domain.checkExpression,
            }));
        }
    }
    for (const [name, domain] of beforeMap) {
        if (!afterMap.has(name)) {
            changes.push((0, change_tracker_1.createChange)('DROP', 'DOMAIN', name, domain, null));
        }
    }
    for (const [name, afterDomain] of afterMap) {
        const beforeDomain = beforeMap.get(name);
        if (!beforeDomain)
            continue;
        const baseTypeChanged = beforeDomain.baseType !== afterDomain.baseType;
        const notNullChanged = (beforeDomain.isNotNull || false) !== (afterDomain.isNotNull || false);
        const defaultChanged = (beforeDomain.defaultValue || null) !== (afterDomain.defaultValue || null);
        const checkChanged = (beforeDomain.checkExpression || null) !== (afterDomain.checkExpression || null);
        if (baseTypeChanged || notNullChanged || defaultChanged || checkChanged) {
            changes.push((0, change_tracker_1.createChange)('ALTER', 'DOMAIN', name, {
                name: beforeDomain.name,
                baseType: beforeDomain.baseType,
                notNull: beforeDomain.isNotNull,
                default: beforeDomain.defaultValue,
                check: beforeDomain.checkExpression,
            }, {
                name: afterDomain.name,
                baseType: afterDomain.baseType,
                notNull: afterDomain.isNotNull,
                default: afterDomain.defaultValue,
                check: afterDomain.checkExpression,
            }));
        }
    }
    return changes;
}
function compareCompositeTypes(before, after) {
    const changes = [];
    const beforeMap = new Map(before.map(t => [t.name, t]));
    const afterMap = new Map(after.map(t => [t.name, t]));
    for (const [name, typeDef] of afterMap) {
        if (!beforeMap.has(name)) {
            changes.push((0, change_tracker_1.createChange)('CREATE', 'COMPOSITE_TYPE', name, null, typeDef));
        }
    }
    for (const [name, typeDef] of beforeMap) {
        if (!afterMap.has(name)) {
            changes.push((0, change_tracker_1.createChange)('DROP', 'COMPOSITE_TYPE', name, typeDef, null));
        }
    }
    return changes;
}
function compareSequences(before, after) {
    const changes = [];
    const beforeMap = new Map(before.map(s => [s.name, s]));
    const afterMap = new Map(after.map(s => [s.name, s]));
    for (const [name, seq] of afterMap) {
        if (!beforeMap.has(name)) {
            changes.push((0, change_tracker_1.createChange)('CREATE', 'SEQUENCE', name, null, seq));
        }
        else {
            const beforeSeq = beforeMap.get(name);
            if (hasSequenceChanged(beforeSeq, seq)) {
                changes.push((0, change_tracker_1.createChange)('ALTER', 'SEQUENCE', name, beforeSeq, seq));
            }
        }
    }
    for (const [name, seq] of beforeMap) {
        if (!afterMap.has(name)) {
            changes.push((0, change_tracker_1.createChange)('DROP', 'SEQUENCE', name, seq, null));
        }
    }
    return changes;
}
function hasSequenceChanged(before, after) {
    return (before.dataType !== after.dataType ||
        before.start !== after.start ||
        before.increment !== after.increment ||
        before.minValue !== after.minValue ||
        before.maxValue !== after.maxValue ||
        before.cache !== after.cache ||
        before.cycle !== after.cycle ||
        before.ownedBy !== after.ownedBy);
}
async function compareTables(before, after) {
    const changes = [];
    const beforeMap = new Map(before.map(t => [t.name, t]));
    const afterMap = new Map(after.map(t => [t.name, t]));
    for (const [name, table] of afterMap) {
        if (!beforeMap.has(name)) {
            changes.push((0, change_tracker_1.createChange)('CREATE', 'TABLE', name, null, tableToChangeData(table)));
            const tableIndexes = table.indexes || [];
            for (const idx of tableIndexes) {
                if (!idx.isPrimary) {
                    changes.push((0, change_tracker_1.createChange)('CREATE', 'INDEX', idx.name, null, {
                        name: idx.name,
                        tableName: name,
                        columns: Array.isArray(idx.columns) ? idx.columns : [idx.columns],
                        isUnique: idx.isUnique,
                        type: idx.type,
                    }));
                }
            }
            if (table.isPartitioned && table.partitionType && table.partitionKey) {
                changes.push((0, change_tracker_1.createChange)('CREATE', 'PARTITION', name, null, {
                    tableName: name,
                    type: table.partitionType,
                    key: table.partitionKey,
                }));
                const childPartitions = table.childPartitions || [];
                for (const cp of childPartitions) {
                    changes.push((0, change_tracker_1.createChange)('CREATE', 'PARTITION_CHILD', cp.name, null, {
                        name: cp.name,
                        parentTable: name,
                        bound: cp.partitionBound,
                    }, name));
                }
            }
            if (table.comment) {
                changes.push((0, change_tracker_1.createChange)('CREATE', 'TABLE_COMMENT', name, null, {
                    tableName: name,
                    comment: table.comment,
                }, name));
            }
            for (const col of table.columns) {
                if (col.comment) {
                    changes.push((0, change_tracker_1.createChange)('CREATE', 'COLUMN_COMMENT', col.name, null, {
                        tableName: name,
                        columnName: col.name,
                        comment: col.comment,
                    }, name));
                }
            }
        }
        else {
            const beforeTable = beforeMap.get(name);
            changes.push(...compareColumns(beforeTable.columns, table.columns, name));
            changes.push(...compareIndexes(beforeTable.indexes || [], table.indexes || [], name));
            changes.push(...await compareConstraints(beforeTable.constraints || [], table.constraints || [], name));
            changes.push(...compareTableComments(beforeTable, table, name));
            changes.push(...compareColumnComments(beforeTable.columns, table.columns, name));
            changes.push(...compareIndexComments(beforeTable.indexes || [], table.indexes || [], name));
            changes.push(...comparePartitions(beforeTable, table, name));
        }
    }
    for (const [name, table] of beforeMap) {
        if (!afterMap.has(name)) {
            changes.push((0, change_tracker_1.createChange)('DROP', 'TABLE', name, tableToChangeData(table), null));
        }
    }
    return changes;
}
function tableToChangeData(table) {
    return {
        name: table.name,
        columns: table.columns.map(c => ({
            name: c.name,
            dataType: c.dataType,
            isNullable: c.isNullable,
            defaultValue: c.defaultValue,
            isPrimaryKey: c.isPrimaryKey,
            isUnique: c.isUnique,
            references: c.references,
        })),
        constraints: table.constraints?.map(con => ({
            name: con.name,
            definition: con.definition,
        })),
        isPartitioned: table.isPartitioned,
        partitionType: table.partitionType,
        partitionKey: table.partitionKey,
    };
}
function compareColumns(before, after, tableName) {
    const changes = [];
    const beforeByName = new Map(before.map(c => [c.name, c]));
    const afterByName = new Map(after.map(c => [c.name, c]));
    const beforeByTrackingId = new Map(before.filter(c => c.trackingId).map(c => [c.trackingId, c]));
    const afterByTrackingId = new Map(after.filter(c => c.trackingId).map(c => [c.trackingId, c]));
    const processedBefore = new Set();
    const processedAfter = new Set();
    for (const [trackingId, afterCol] of afterByTrackingId) {
        const beforeCol = beforeByTrackingId.get(trackingId);
        if (beforeCol && beforeCol.name !== afterCol.name) {
            changes.push((0, change_tracker_1.createChange)('RENAME', 'COLUMN', afterCol.name, columnToChangeData(beforeCol), columnToChangeData(afterCol), tableName));
            processedBefore.add(beforeCol.name);
            processedAfter.add(afterCol.name);
        }
        else if (beforeCol && beforeCol.name === afterCol.name) {
            if (hasColumnChanged(beforeCol, afterCol)) {
                changes.push((0, change_tracker_1.createChange)('ALTER', 'COLUMN', afterCol.name, columnToChangeData(beforeCol), columnToChangeData(afterCol), tableName));
            }
            processedBefore.add(beforeCol.name);
            processedAfter.add(afterCol.name);
        }
    }
    for (const [name, col] of afterByName) {
        if (processedAfter.has(name))
            continue;
        if (!beforeByName.has(name)) {
            changes.push((0, change_tracker_1.createChange)('CREATE', 'COLUMN', name, null, columnToChangeData(col), tableName));
        }
        else {
            const beforeCol = beforeByName.get(name);
            if (!processedBefore.has(name) && hasColumnChanged(beforeCol, col)) {
                changes.push((0, change_tracker_1.createChange)('ALTER', 'COLUMN', name, columnToChangeData(beforeCol), columnToChangeData(col), tableName));
            }
            processedBefore.add(name);
        }
        processedAfter.add(name);
    }
    for (const [name, col] of beforeByName) {
        if (processedBefore.has(name))
            continue;
        if (!afterByName.has(name)) {
            changes.push((0, change_tracker_1.createChange)('DROP', 'COLUMN', name, columnToChangeData(col), null, tableName));
        }
    }
    return changes;
}
function columnToChangeData(col) {
    return {
        name: col.name,
        dataType: col.dataType,
        isNullable: col.isNullable,
        defaultValue: col.defaultValue,
        isPrimaryKey: col.isPrimaryKey,
        isUnique: col.isUnique,
        maxLength: col.maxLength,
        precision: col.precision,
        scale: col.scale,
        trackingId: col.trackingId,
    };
}
function normalizeDataType(type) {
    if (!type)
        return '';
    let normalized = type.toLowerCase().trim();
    const typeMap = {
        'int4': 'integer',
        'int8': 'bigint',
        'int2': 'smallint',
        'float4': 'real',
        'float8': 'double precision',
        'bool': 'boolean',
        'timestamptz': 'timestamp',
        'timetz': 'time',
        '_text': 'text[]',
        '_int4': 'integer[]',
        '_int8': 'bigint[]',
        '_varchar': 'varchar[]',
        '_uuid': 'uuid[]',
        '_bool': 'boolean[]',
        '_jsonb': 'jsonb[]',
        'character varying': 'varchar',
        'character': 'char',
        'double precision': 'doubleprecision',
    };
    if (normalized.startsWith('_') && !typeMap[normalized]) {
        return normalized.substring(1) + '[]';
    }
    return typeMap[normalized] || normalized;
}
function normalizeDefault(value) {
    if (value == null)
        return null;
    let normalized = value.trim().toLowerCase();
    normalized = normalized.replace(/array\[\]::([\w\[\]]+)/gi, "'empty_array'");
    normalized = normalized.replace(/::\w+(?:\s+\w+)?(?:\[\])?/g, '');
    normalized = normalized.replace(/^array\[\]$/i, "'empty_array'");
    normalized = normalized.replace(/now\s*\(\s*\)/g, 'now()');
    normalized = normalized.replace(/gen_random_uuid\s*\(\s*\)/g, 'gen_random_uuid()');
    normalized = normalized.replace(/current_date/g, 'current_date');
    normalized = normalized.replace(/current_timestamp/g, 'current_timestamp');
    normalized = normalized.replace(/'\[\]'/g, "'empty_array'");
    normalized = normalized.replace(/'\{\}'/g, "'empty_array'");
    normalized = normalized.replace(/:\s+/g, ':');
    normalized = normalized.replace(/,\s+/g, ',');
    normalized = normalized.replace(/\[\s+/g, '[');
    normalized = normalized.replace(/\s+\]/g, ']');
    normalized = normalized.replace(/\{\s+/g, '{');
    normalized = normalized.replace(/\s+\}/g, '}');
    if (normalized === 'true' || normalized === "'t'" || normalized === 't')
        normalized = 'true';
    if (normalized === 'false' || normalized === "'f'" || normalized === 'f')
        normalized = 'false';
    normalized = normalized.replace(/^'([^']*)'$/, '$1');
    return normalized || null;
}
function normalizeCheckDefinition(definition) {
    if (!definition)
        return '';
    const arrayMatch = definition.match(/ARRAY\[([^\]]+)\]/i);
    if (arrayMatch) {
        const valuesStr = arrayMatch[1];
        const values = valuesStr.match(/'([^']+)'/g)?.map(v => v.replace(/'/g, '').toLowerCase()) || [];
        return values.sort().join(',');
    }
    const inMatch = definition.match(/IN\s*\(([^)]+)\)/i);
    if (inMatch) {
        const valuesStr = inMatch[1];
        const values = valuesStr.match(/'([^']+)'/g)?.map(v => v.replace(/'/g, '').toLowerCase()) || [];
        return values.sort().join(',');
    }
    return definition.toLowerCase().replace(/\s+/g, ' ').trim();
}
async function checkDefinitionsEqual(def1, def2) {
    if (!def1 && !def2)
        return true;
    if (!def1 || !def2)
        return false;
    const astResult = await (0, pg_parser_1.compareCheckConstraints)(def1, def2);
    if (astResult) {
        return true;
    }
    return normalizeCheckDefinition(def1) === normalizeCheckDefinition(def2);
}
function hasColumnChanged(before, after) {
    return (normalizeDataType(before.dataType) !== normalizeDataType(after.dataType) ||
        before.isNullable !== after.isNullable ||
        normalizeDefault(before.defaultValue) !== normalizeDefault(after.defaultValue) ||
        before.isPrimaryKey !== after.isPrimaryKey ||
        before.isUnique !== after.isUnique);
}
function compareIndexes(before, after, tableName) {
    const changes = [];
    const beforeByName = new Map(before.map(i => [i.name, i]));
    const afterByName = new Map(after.map(i => [i.name, i]));
    const beforeByTrackingId = new Map(before.filter(i => i.trackingId).map(i => [i.trackingId, i]));
    const afterByTrackingId = new Map(after.filter(i => i.trackingId).map(i => [i.trackingId, i]));
    const processedBefore = new Set();
    const processedAfter = new Set();
    for (const [trackingId, afterIdx] of afterByTrackingId) {
        const beforeIdx = beforeByTrackingId.get(trackingId);
        if (beforeIdx && beforeIdx.name !== afterIdx.name && !beforeIdx.isPrimary && !afterIdx.isPrimary) {
            changes.push((0, change_tracker_1.createChange)('RENAME', 'INDEX', afterIdx.name, { name: beforeIdx.name, tableName, columns: beforeIdx.columns }, { name: afterIdx.name, tableName, columns: afterIdx.columns, isUnique: afterIdx.isUnique, type: afterIdx.type }));
            processedBefore.add(beforeIdx.name);
            processedAfter.add(afterIdx.name);
        }
        else if (beforeIdx && beforeIdx.name === afterIdx.name) {
            processedBefore.add(beforeIdx.name);
            processedAfter.add(afterIdx.name);
        }
    }
    for (const [name, idx] of afterByName) {
        if (processedAfter.has(name) || idx.isPrimary)
            continue;
        if (!beforeByName.has(name)) {
            changes.push((0, change_tracker_1.createChange)('CREATE', 'INDEX', name, null, {
                name: idx.name,
                tableName,
                columns: Array.isArray(idx.columns) ? idx.columns : [idx.columns],
                isUnique: idx.isUnique,
                type: idx.type,
            }));
        }
        processedAfter.add(name);
    }
    for (const [name, idx] of beforeByName) {
        if (processedBefore.has(name) || idx.isPrimary)
            continue;
        if (!afterByName.has(name)) {
            changes.push((0, change_tracker_1.createChange)('DROP', 'INDEX', name, {
                name: idx.name,
                tableName,
                columns: idx.columns,
            }, null));
        }
    }
    return changes;
}
async function compareConstraints(before, after, tableName) {
    const changes = [];
    const beforeChecks = before.filter(c => c.type?.toUpperCase() === 'CHECK');
    const afterChecks = after.filter(c => c.type?.toUpperCase() === 'CHECK');
    const beforeOther = before.filter(c => c.type?.toUpperCase() !== 'CHECK');
    const afterOther = after.filter(c => c.type?.toUpperCase() !== 'CHECK');
    const isSingleColumnUniqueConstraint = (con) => {
        if (con.type?.toUpperCase() === 'UNIQUE' && con.columns?.length === 1) {
            return true;
        }
        if (con.definition) {
            const def = con.definition.trim().toUpperCase();
            if (def.startsWith('UNIQUE') && !con.definition.includes(',')) {
                return true;
            }
        }
        return false;
    };
    const beforeOtherFiltered = beforeOther.filter(c => !isSingleColumnUniqueConstraint(c));
    const afterOtherFiltered = afterOther.filter(c => !isSingleColumnUniqueConstraint(c));
    const beforeOtherMap = new Map(beforeOtherFiltered.map(c => [c.name, c]));
    const afterOtherMap = new Map(afterOtherFiltered.map(c => [c.name, c]));
    for (const [name, con] of afterOtherMap) {
        if (!beforeOtherMap.has(name)) {
            const objectType = constraintTypeToObjectType(con.type);
            changes.push((0, change_tracker_1.createChange)('CREATE', objectType, name, null, {
                name: con.name,
                definition: con.definition,
            }, tableName));
        }
    }
    for (const [name, con] of beforeOtherMap) {
        if (!afterOtherMap.has(name)) {
            const objectType = constraintTypeToObjectType(con.type);
            changes.push((0, change_tracker_1.createChange)('DROP', objectType, name, {
                name: con.name,
                definition: con.definition,
            }, null, tableName));
        }
    }
    const extractColumnFromCheckDef = (definition) => {
        const astResult = (0, pg_parser_1.extractColumnFromCheck)(definition);
        if (astResult)
            return astResult;
        const enumMatch = definition.match(/\((\w+)\)::text\s*=\s*ANY/i);
        if (enumMatch)
            return enumMatch[1].toLowerCase();
        const inMatch = definition.match(/["\(](\w+)["]\s+IN\s*\(/i);
        if (inMatch)
            return inMatch[1].toLowerCase();
        const compMatch = definition.match(/\(\(?(\w+)\s*(?:>=?|<=?|<>|!=|=)/i);
        if (compMatch)
            return compMatch[1].toLowerCase();
        return null;
    };
    const extractColumnFromCheckName = (name, tableName) => {
        const lower = name.toLowerCase();
        const tablePrefix = tableName.toLowerCase() + '_';
        let colPart = lower.startsWith(tablePrefix) ? lower.slice(tablePrefix.length) : lower;
        if (colPart.startsWith('check_'))
            colPart = colPart.slice(6);
        if (colPart.endsWith('_check'))
            colPart = colPart.slice(0, -6);
        return colPart;
    };
    const beforeChecksByCol = new Map();
    const afterChecksByCol = new Map();
    for (const c of beforeChecks) {
        const col = extractColumnFromCheckDef(c.definition) || extractColumnFromCheckName(c.name, tableName);
        beforeChecksByCol.set(col, c);
    }
    for (const c of afterChecks) {
        const col = extractColumnFromCheckDef(c.definition) || extractColumnFromCheckName(c.name, tableName);
        afterChecksByCol.set(col, c);
    }
    const matchedBefore = new Set();
    const matchedAfter = new Set();
    for (const [col, afterCon] of afterChecksByCol) {
        if (beforeChecksByCol.has(col)) {
            const beforeCon = beforeChecksByCol.get(col);
            matchedBefore.add(beforeCon.name);
            matchedAfter.add(afterCon.name);
            if (!afterCon.definition || afterCon.definition === '') {
                continue;
            }
            if (!await checkDefinitionsEqual(beforeCon.definition, afterCon.definition)) {
                changes.push((0, change_tracker_1.createChange)('ALTER', 'CHECK', afterCon.name, {
                    name: beforeCon.name,
                    definition: beforeCon.definition,
                    columnName: col,
                }, {
                    name: afterCon.name,
                    definition: afterCon.definition,
                    columnName: col,
                }, tableName));
            }
        }
    }
    for (const c of afterChecks) {
        if (!matchedAfter.has(c.name)) {
            const col = extractColumnFromCheckDef(c.definition) || extractColumnFromCheckName(c.name, tableName);
            changes.push((0, change_tracker_1.createChange)('CREATE', 'CHECK', c.name, null, {
                name: c.name,
                definition: c.definition,
                columnName: col,
            }, tableName));
        }
    }
    for (const c of beforeChecks) {
        if (!matchedBefore.has(c.name)) {
            const col = extractColumnFromCheckDef(c.definition) || extractColumnFromCheckName(c.name, tableName);
            changes.push((0, change_tracker_1.createChange)('DROP', 'CHECK', c.name, {
                name: c.name,
                definition: c.definition,
                columnName: col,
            }, null, tableName));
        }
    }
    return changes;
}
function constraintTypeToObjectType(type) {
    const upper = type.toUpperCase();
    if (upper.includes('PRIMARY'))
        return 'PRIMARY_KEY';
    if (upper.includes('FOREIGN'))
        return 'FOREIGN_KEY';
    if (upper.includes('CHECK'))
        return 'CHECK';
    if (upper.includes('EXCLUDE'))
        return 'EXCLUSION';
    return 'CONSTRAINT';
}
function compareTableComments(before, after, tableName) {
    const changes = [];
    const beforeComment = before.comment;
    const afterComment = after.comment;
    if (afterComment && !beforeComment) {
        changes.push((0, change_tracker_1.createChange)('CREATE', 'TABLE_COMMENT', tableName, null, {
            tableName,
            comment: afterComment,
        }, tableName));
    }
    else if (!afterComment && beforeComment) {
        changes.push((0, change_tracker_1.createChange)('DROP', 'TABLE_COMMENT', tableName, {
            tableName,
            comment: beforeComment,
        }, null, tableName));
    }
    else if (afterComment && beforeComment && afterComment !== beforeComment) {
        changes.push((0, change_tracker_1.createChange)('ALTER', 'TABLE_COMMENT', tableName, {
            tableName,
            comment: beforeComment,
        }, {
            tableName,
            comment: afterComment,
        }, tableName));
    }
    return changes;
}
function compareColumnComments(before, after, tableName) {
    const changes = [];
    const beforeMap = new Map(before.map(c => [c.name, c]));
    const afterMap = new Map(after.map(c => [c.name, c]));
    for (const [name, col] of afterMap) {
        const afterComment = col.comment;
        const beforeCol = beforeMap.get(name);
        const beforeComment = beforeCol ? beforeCol.comment : undefined;
        if (afterComment && !beforeComment) {
            changes.push((0, change_tracker_1.createChange)('CREATE', 'COLUMN_COMMENT', name, null, {
                tableName,
                columnName: name,
                comment: afterComment,
            }, tableName));
        }
        else if (!afterComment && beforeComment) {
            changes.push((0, change_tracker_1.createChange)('DROP', 'COLUMN_COMMENT', name, {
                tableName,
                columnName: name,
                comment: beforeComment,
            }, null, tableName));
        }
        else if (afterComment && beforeComment && afterComment !== beforeComment) {
            changes.push((0, change_tracker_1.createChange)('ALTER', 'COLUMN_COMMENT', name, {
                tableName,
                columnName: name,
                comment: beforeComment,
            }, {
                tableName,
                columnName: name,
                comment: afterComment,
            }, tableName));
        }
    }
    return changes;
}
function compareIndexComments(before, after, tableName) {
    const changes = [];
    const beforeMap = new Map(before.map(i => [i.name, i]));
    const afterMap = new Map(after.map(i => [i.name, i]));
    for (const [name, afterIdx] of afterMap) {
        const beforeIdx = beforeMap.get(name);
        const afterComment = afterIdx.comment || null;
        const beforeComment = beforeIdx ? beforeIdx.comment || null : null;
        if (afterComment && !beforeComment) {
            changes.push((0, change_tracker_1.createChange)('CREATE', 'INDEX_COMMENT', name, null, {
                tableName,
                indexName: name,
                comment: afterComment,
            }, tableName));
        }
        else if (!afterComment && beforeComment) {
            changes.push((0, change_tracker_1.createChange)('DROP', 'INDEX_COMMENT', name, {
                tableName,
                indexName: name,
                comment: beforeComment,
            }, null, tableName));
        }
        else if (afterComment && beforeComment && afterComment !== beforeComment) {
            changes.push((0, change_tracker_1.createChange)('ALTER', 'INDEX_COMMENT', name, {
                tableName,
                indexName: name,
                comment: beforeComment,
            }, {
                tableName,
                indexName: name,
                comment: afterComment,
            }, tableName));
        }
    }
    return changes;
}
function comparePartitions(before, after, tableName) {
    const changes = [];
    const beforePartitioned = before.isPartitioned;
    const afterPartitioned = after.isPartitioned;
    if (afterPartitioned && !beforePartitioned) {
        changes.push((0, change_tracker_1.createChange)('CREATE', 'PARTITION', tableName, null, {
            tableName,
            type: after.partitionType,
            key: after.partitionKey,
        }));
    }
    else if (!afterPartitioned && beforePartitioned) {
        changes.push((0, change_tracker_1.createChange)('DROP', 'PARTITION', tableName, {
            tableName,
            type: before.partitionType,
            key: before.partitionKey,
        }, null));
    }
    else if (afterPartitioned && beforePartitioned) {
        const keysMatch = arraysEqual(before.partitionKey || [], after.partitionKey || []);
        if (before.partitionType !== after.partitionType || !keysMatch) {
            changes.push((0, change_tracker_1.createChange)('ALTER', 'PARTITION', tableName, {
                tableName,
                type: before.partitionType,
                key: before.partitionKey,
            }, {
                tableName,
                type: after.partitionType,
                key: after.partitionKey,
            }));
        }
    }
    return changes;
}
function compareViews(before, after) {
    const changes = [];
    const beforeMap = new Map(before.map(v => [v.name, v]));
    const afterMap = new Map(after.map(v => [v.name, v]));
    for (const [name, view] of afterMap) {
        if (!beforeMap.has(name)) {
            changes.push((0, change_tracker_1.createChange)('CREATE', 'VIEW', name, null, view));
        }
        else {
            const beforeView = beforeMap.get(name);
            if (beforeView.definition !== view.definition) {
                changes.push((0, change_tracker_1.createChange)('ALTER', 'VIEW', name, beforeView, view));
            }
        }
    }
    for (const [name, view] of beforeMap) {
        if (!afterMap.has(name)) {
            changes.push((0, change_tracker_1.createChange)('DROP', 'VIEW', name, view, null));
        }
    }
    return changes;
}
async function compareFunctions(before, after) {
    const changes = [];
    const beforeMap = new Map(before.map(f => [f.name, f]));
    const afterMap = new Map(after.map(f => [f.name, f]));
    for (const [name, func] of afterMap) {
        if (!beforeMap.has(name)) {
            changes.push((0, change_tracker_1.createChange)('CREATE', 'FUNCTION', name, null, {
                name: func.name,
                returns: func.returnType,
                language: func.language,
                body: func.definition || '',
            }));
        }
        else {
            const beforeFunc = beforeMap.get(name);
            if (!beforeFunc.definition) {
                continue;
            }
            const bodiesMatch = await (0, pg_parser_1.compareFunctionBodies)(beforeFunc.definition, func.definition || '');
            if (!bodiesMatch || beforeFunc.returnType !== func.returnType) {
                changes.push((0, change_tracker_1.createChange)('ALTER', 'FUNCTION', name, {
                    name: beforeFunc.name,
                    returns: beforeFunc.returnType,
                    language: beforeFunc.language,
                    body: beforeFunc.definition || '',
                }, {
                    name: func.name,
                    returns: func.returnType,
                    language: func.language,
                    body: func.definition || '',
                }));
            }
        }
    }
    for (const [name, func] of beforeMap) {
        if (!afterMap.has(name)) {
            changes.push((0, change_tracker_1.createChange)('DROP', 'FUNCTION', name, func, null));
        }
    }
    return changes;
}
function compareTriggers(before, after) {
    const changes = [];
    const beforeMap = new Map(before.map(t => [`${t.tableName}.${t.name}`, t]));
    const afterMap = new Map(after.map(t => [`${t.tableName}.${t.name}`, t]));
    for (const [key, trigger] of afterMap) {
        if (!beforeMap.has(key)) {
            changes.push((0, change_tracker_1.createChange)('CREATE', 'TRIGGER', trigger.name, null, trigger, trigger.tableName));
        }
        else {
            const beforeTrigger = beforeMap.get(key);
            if (beforeTrigger.timing !== trigger.timing ||
                beforeTrigger.event !== trigger.event ||
                beforeTrigger.functionName !== trigger.functionName) {
                changes.push((0, change_tracker_1.createChange)('DROP', 'TRIGGER', trigger.name, beforeTrigger, null, beforeTrigger.tableName));
                changes.push((0, change_tracker_1.createChange)('CREATE', 'TRIGGER', trigger.name, null, trigger, trigger.tableName));
            }
        }
    }
    for (const [key, trigger] of beforeMap) {
        if (!afterMap.has(key)) {
            changes.push((0, change_tracker_1.createChange)('DROP', 'TRIGGER', trigger.name, trigger, null, trigger.tableName));
        }
    }
    return changes;
}
