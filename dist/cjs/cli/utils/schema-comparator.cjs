"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareSchemas = compareSchemas;
exports.compareExtensions = compareExtensions;
exports.compareEnums = compareEnums;
exports.compareDomains = compareDomains;
exports.compareTables = compareTables;
const change_tracker_1 = require("./change-tracker.cjs");
function arraysEqual(a, b) {
    if (a.length !== b.length)
        return false;
    return a.every((val, idx) => val === b[idx]);
}
function compareSchemas(before, after) {
    const changes = [];
    changes.push(...compareExtensions(before.extensions || [], after.extensions || []));
    changes.push(...compareEnums(before.enums || [], after.enums || []));
    changes.push(...compareDomains(before.domains || [], after.domains || []));
    changes.push(...compareCompositeTypes(before.compositeTypes || [], after.compositeTypes || []));
    changes.push(...compareSequences(before.sequences || [], after.sequences || []));
    changes.push(...compareTables(before.tables, after.tables));
    changes.push(...compareViews(before.views || [], after.views || []));
    changes.push(...compareFunctions(before.functions || [], after.functions || []));
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
function compareTables(before, after) {
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
            changes.push(...compareConstraints(beforeTable.constraints || [], table.constraints || [], name));
            changes.push(...compareTableComments(beforeTable, table, name));
            changes.push(...compareColumnComments(beforeTable.columns, table.columns, name));
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
    const beforeMap = new Map(before.map(c => [c.name, c]));
    const afterMap = new Map(after.map(c => [c.name, c]));
    for (const [name, col] of afterMap) {
        if (!beforeMap.has(name)) {
            changes.push((0, change_tracker_1.createChange)('CREATE', 'COLUMN', name, null, columnToChangeData(col), tableName));
        }
        else {
            const beforeCol = beforeMap.get(name);
            if (hasColumnChanged(beforeCol, col)) {
                changes.push((0, change_tracker_1.createChange)('ALTER', 'COLUMN', name, columnToChangeData(beforeCol), columnToChangeData(col), tableName));
            }
        }
    }
    for (const [name, col] of beforeMap) {
        if (!afterMap.has(name)) {
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
function hasColumnChanged(before, after) {
    return (normalizeDataType(before.dataType) !== normalizeDataType(after.dataType) ||
        before.isNullable !== after.isNullable ||
        normalizeDefault(before.defaultValue) !== normalizeDefault(after.defaultValue) ||
        before.isPrimaryKey !== after.isPrimaryKey ||
        before.isUnique !== after.isUnique);
}
function compareIndexes(before, after, tableName) {
    const changes = [];
    const beforeMap = new Map(before.map(i => [i.name, i]));
    const afterMap = new Map(after.map(i => [i.name, i]));
    for (const [name, idx] of afterMap) {
        if (!beforeMap.has(name) && !idx.isPrimary) {
            changes.push((0, change_tracker_1.createChange)('CREATE', 'INDEX', name, null, {
                name: idx.name,
                tableName,
                columns: Array.isArray(idx.columns) ? idx.columns : [idx.columns],
                isUnique: idx.isUnique,
                type: idx.type,
            }));
        }
    }
    for (const [name, idx] of beforeMap) {
        if (!afterMap.has(name) && !idx.isPrimary) {
            changes.push((0, change_tracker_1.createChange)('DROP', 'INDEX', name, {
                name: idx.name,
                tableName,
                columns: idx.columns,
            }, null));
        }
    }
    return changes;
}
function compareConstraints(before, after, tableName) {
    const changes = [];
    const beforeChecks = before.filter(c => c.type?.toUpperCase() === 'CHECK');
    const afterChecks = after.filter(c => c.type?.toUpperCase() === 'CHECK');
    const beforeOther = before.filter(c => c.type?.toUpperCase() !== 'CHECK');
    const afterOther = after.filter(c => c.type?.toUpperCase() !== 'CHECK');
    const beforeOtherMap = new Map(beforeOther.map(c => [c.name, c]));
    const afterOtherMap = new Map(afterOther.map(c => [c.name, c]));
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
        const enumMatch = definition.match(/\((\w+)\)::text\s*=\s*ANY/i);
        if (enumMatch)
            return enumMatch[1].toLowerCase();
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
            matchedBefore.add(beforeChecksByCol.get(col).name);
            matchedAfter.add(afterCon.name);
        }
    }
    for (const c of afterChecks) {
        if (!matchedAfter.has(c.name)) {
            changes.push((0, change_tracker_1.createChange)('CREATE', 'CHECK', c.name, null, {
                name: c.name,
                definition: c.definition,
            }, tableName));
        }
    }
    for (const c of beforeChecks) {
        if (!matchedBefore.has(c.name)) {
            changes.push((0, change_tracker_1.createChange)('DROP', 'CHECK', c.name, {
                name: c.name,
                definition: c.definition,
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
function compareFunctions(before, after) {
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
    const beforeMap = new Map(before.map(t => [t.name, t]));
    const afterMap = new Map(after.map(t => [t.name, t]));
    for (const [name, trigger] of afterMap) {
        if (!beforeMap.has(name)) {
            changes.push((0, change_tracker_1.createChange)('CREATE', 'TRIGGER', name, null, trigger, trigger.tableName));
        }
    }
    for (const [name, trigger] of beforeMap) {
        if (!afterMap.has(name)) {
            changes.push((0, change_tracker_1.createChange)('DROP', 'TRIGGER', name, trigger, null, trigger.tableName));
        }
    }
    return changes;
}
