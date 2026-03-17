"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareSchemas = compareSchemas;
const TYPE_ALIASES = {
    'int': 'integer',
    'int2': 'smallint',
    'int4': 'integer',
    'int8': 'bigint',
    'integer': 'integer',
    'smallint': 'smallint',
    'bigint': 'bigint',
    'serial': 'serial',
    'serial2': 'smallserial',
    'serial4': 'serial',
    'serial8': 'bigserial',
    'smallserial': 'smallserial',
    'bigserial': 'bigserial',
    'float': 'double precision',
    'float4': 'real',
    'float8': 'double precision',
    'real': 'real',
    'double precision': 'double precision',
    'decimal': 'numeric',
    'numeric': 'numeric',
    'bool': 'boolean',
    'boolean': 'boolean',
    'char': 'character',
    'character': 'character',
    'bpchar': 'character',
    'varchar': 'character varying',
    'character varying': 'character varying',
    'text': 'text',
    'name': 'name',
    'citext': 'citext',
    'timestamp': 'timestamp without time zone',
    'timestamp without time zone': 'timestamp without time zone',
    'timestamptz': 'timestamp with time zone',
    'timestamp with time zone': 'timestamp with time zone',
    'date': 'date',
    'time': 'time without time zone',
    'time without time zone': 'time without time zone',
    'timetz': 'time with time zone',
    'time with time zone': 'time with time zone',
    'interval': 'interval',
    'abstime': 'abstime',
    'reltime': 'reltime',
    'tinterval': 'tinterval',
    'bytea': 'bytea',
    'bit': 'bit',
    'varbit': 'bit varying',
    'bit varying': 'bit varying',
    'uuid': 'uuid',
    'json': 'json',
    'jsonb': 'jsonb',
    'jsonpath': 'jsonpath',
    'xml': 'xml',
    'money': 'money',
    'inet': 'inet',
    'cidr': 'cidr',
    'macaddr': 'macaddr',
    'macaddr8': 'macaddr8',
    'point': 'point',
    'line': 'line',
    'lseg': 'lseg',
    'box': 'box',
    'path': 'path',
    'polygon': 'polygon',
    'circle': 'circle',
    'int4range': 'int4range',
    'int8range': 'int8range',
    'numrange': 'numrange',
    'tsrange': 'tsrange',
    'tstzrange': 'tstzrange',
    'daterange': 'daterange',
    'int4multirange': 'int4multirange',
    'int8multirange': 'int8multirange',
    'nummultirange': 'nummultirange',
    'tsmultirange': 'tsmultirange',
    'tstzmultirange': 'tstzmultirange',
    'datemultirange': 'datemultirange',
    'tsvector': 'tsvector',
    'tsquery': 'tsquery',
    'gtsvector': 'gtsvector',
    'oid': 'oid',
    'regclass': 'regclass',
    'regcollation': 'regcollation',
    'regconfig': 'regconfig',
    'regdictionary': 'regdictionary',
    'regnamespace': 'regnamespace',
    'regoper': 'regoper',
    'regoperator': 'regoperator',
    'regproc': 'regproc',
    'regprocedure': 'regprocedure',
    'regrole': 'regrole',
    'regtype': 'regtype',
    'xid': 'xid',
    'xid8': 'xid8',
    'cid': 'cid',
    'tid': 'tid',
    'aclitem': 'aclitem',
    'smgr': 'smgr',
    'unknown': 'unknown',
    'internal': 'internal',
    'opaque': 'opaque',
    'anyelement': 'anyelement',
    'anyarray': 'anyarray',
    'anynonarray': 'anynonarray',
    'anyenum': 'anyenum',
    'anyrange': 'anyrange',
    'anymultirange': 'anymultirange',
    'anycompatible': 'anycompatible',
    'anycompatiblearray': 'anycompatiblearray',
    'anycompatiblenonarray': 'anycompatiblenonarray',
    'anycompatiblerange': 'anycompatiblerange',
    'anycompatiblemultirange': 'anycompatiblemultirange',
    'cstring': 'cstring',
    'record': 'record',
    'trigger': 'trigger',
    'event_trigger': 'event_trigger',
    'pg_lsn': 'pg_lsn',
    'pg_snapshot': 'pg_snapshot',
    'txid_snapshot': 'txid_snapshot',
    'fdw_handler': 'fdw_handler',
    'index_am_handler': 'index_am_handler',
    'tsm_handler': 'tsm_handler',
    'table_am_handler': 'table_am_handler',
    'language_handler': 'language_handler',
    'void': 'void',
    'refcursor': 'refcursor',
    '_int2': 'smallint[]',
    '_int4': 'integer[]',
    '_int8': 'bigint[]',
    '_float4': 'real[]',
    '_float8': 'double precision[]',
    '_numeric': 'numeric[]',
    '_bool': 'boolean[]',
    '_text': 'text[]',
    '_varchar': 'character varying[]',
    '_bpchar': 'character[]',
    '_char': 'character[]',
    '_name': 'name[]',
    '_bytea': 'bytea[]',
    '_bit': 'bit[]',
    '_varbit': 'bit varying[]',
    '_uuid': 'uuid[]',
    '_json': 'json[]',
    '_jsonb': 'jsonb[]',
    '_xml': 'xml[]',
    '_money': 'money[]',
    '_timestamp': 'timestamp without time zone[]',
    '_timestamptz': 'timestamp with time zone[]',
    '_date': 'date[]',
    '_time': 'time without time zone[]',
    '_timetz': 'time with time zone[]',
    '_interval': 'interval[]',
    '_inet': 'inet[]',
    '_cidr': 'cidr[]',
    '_macaddr': 'macaddr[]',
    '_macaddr8': 'macaddr8[]',
    '_point': 'point[]',
    '_line': 'line[]',
    '_lseg': 'lseg[]',
    '_box': 'box[]',
    '_path': 'path[]',
    '_polygon': 'polygon[]',
    '_circle': 'circle[]',
    '_int4range': 'int4range[]',
    '_int8range': 'int8range[]',
    '_numrange': 'numrange[]',
    '_tsrange': 'tsrange[]',
    '_tstzrange': 'tstzrange[]',
    '_daterange': 'daterange[]',
    '_tsvector': 'tsvector[]',
    '_tsquery': 'tsquery[]',
    '_oid': 'oid[]',
    '_regclass': 'regclass[]',
    '_regtype': 'regtype[]',
    '_regproc': 'regproc[]',
    '_xid': 'xid[]',
    '_cid': 'cid[]',
    '_tid': 'tid[]',
    '_aclitem': 'aclitem[]',
    '_cstring': 'cstring[]',
    '_record': 'record[]',
    '_pg_lsn': 'pg_lsn[]',
    '_txid_snapshot': 'txid_snapshot[]',
    '_refcursor': 'refcursor[]',
    '_citext': 'citext[]',
};
function normalizeType(type) {
    if (!type)
        return type;
    let normalized = type.toLowerCase().trim();
    if (TYPE_ALIASES[normalized]) {
        return TYPE_ALIASES[normalized];
    }
    normalized = normalized.replace(' without time zone', '');
    if (TYPE_ALIASES[normalized]) {
        return TYPE_ALIASES[normalized];
    }
    return normalized;
}
function compareSchemas(oldSchema, newSchema) {
    const result = {
        added: {
            tables: [],
            columns: [],
            indexes: [],
            constraints: [],
            enums: [],
            domains: [],
            compositeTypes: [],
            sequences: [],
            views: [],
            functions: [],
            triggers: [],
            policies: [],
            extensions: [],
        },
        removed: {
            tables: [],
            columns: [],
            indexes: [],
            constraints: [],
            enums: [],
            domains: [],
            compositeTypes: [],
            sequences: [],
            views: [],
            functions: [],
            triggers: [],
            policies: [],
            extensions: [],
        },
        renamed: {
            tables: [],
            columns: [],
            indexes: [],
            constraints: [],
            enums: [],
            sequences: [],
            functions: [],
        },
        modified: {
            tables: [],
            columns: [],
            indexes: [],
            constraints: [],
            enums: [],
            sequences: [],
            functions: [],
            views: [],
            triggers: [],
            domains: [],
            compositeTypes: [],
        },
        hasChanges: false,
    };
    compareTables(oldSchema.tables, newSchema.tables, result);
    compareEnums(oldSchema.enums, newSchema.enums, result);
    const oldExtensions = new Set(oldSchema.extensions);
    const newExtensions = new Set(newSchema.extensions);
    for (const ext of newExtensions) {
        if (!oldExtensions.has(ext)) {
            result.added.extensions.push(ext);
        }
    }
    for (const ext of oldExtensions) {
        if (!newExtensions.has(ext)) {
            result.removed.extensions.push(ext);
        }
    }
    compareByTrackingId(oldSchema.sequences, newSchema.sequences, (item) => item.name, (item) => item.trackingId, (item) => result.added.sequences.push(item), (item) => result.removed.sequences.push(item), (from, to, trackingId) => result.renamed.sequences.push({ from, to, trackingId }));
    compareSequenceProperties(oldSchema.sequences, newSchema.sequences, result);
    compareByTrackingId(oldSchema.functions, newSchema.functions, (item) => item.name, (item) => item.trackingId, (item) => result.added.functions.push(item), (item) => result.removed.functions.push(item), (from, to, trackingId) => {
        const oldFunc = oldSchema.functions.find(f => f.name === from && f.trackingId === trackingId);
        const argTypes = oldFunc ? oldFunc.args.map(a => a.type) : undefined;
        result.renamed.functions.push({ from, to, trackingId, argTypes });
    });
    compareFunctionProperties(oldSchema.functions, newSchema.functions, result);
    compareByName(oldSchema.views, newSchema.views, (item) => item.name, (item) => result.added.views.push(item), (item) => result.removed.views.push(item));
    compareViewProperties(oldSchema.views, newSchema.views, result);
    compareByName(oldSchema.triggers, newSchema.triggers, (item) => item.name, (item) => result.added.triggers.push(item), (item) => result.removed.triggers.push(item));
    compareTriggerProperties(oldSchema.triggers, newSchema.triggers, result);
    compareByName(oldSchema.domains, newSchema.domains, (item) => item.name, (item) => result.added.domains.push(item), (item) => result.removed.domains.push(item));
    compareDomainProperties(oldSchema.domains, newSchema.domains, result);
    compareByName(oldSchema.compositeTypes, newSchema.compositeTypes, (item) => item.name, (item) => result.added.compositeTypes.push(item), (item) => result.removed.compositeTypes.push(item));
    compareCompositeTypeProperties(oldSchema.compositeTypes, newSchema.compositeTypes, result);
    result.hasChanges =
        result.added.tables.length > 0 ||
            result.added.columns.length > 0 ||
            result.added.indexes.length > 0 ||
            result.added.constraints.length > 0 ||
            result.added.enums.length > 0 ||
            result.added.extensions.length > 0 ||
            result.added.sequences.length > 0 ||
            result.added.functions.length > 0 ||
            result.added.views.length > 0 ||
            result.added.triggers.length > 0 ||
            result.added.domains.length > 0 ||
            result.added.compositeTypes.length > 0 ||
            result.removed.tables.length > 0 ||
            result.removed.columns.length > 0 ||
            result.removed.indexes.length > 0 ||
            result.removed.constraints.length > 0 ||
            result.removed.enums.length > 0 ||
            result.removed.extensions.length > 0 ||
            result.removed.sequences.length > 0 ||
            result.removed.functions.length > 0 ||
            result.removed.views.length > 0 ||
            result.removed.triggers.length > 0 ||
            result.removed.domains.length > 0 ||
            result.removed.compositeTypes.length > 0 ||
            result.renamed.tables.length > 0 ||
            result.renamed.columns.length > 0 ||
            result.renamed.indexes.length > 0 ||
            result.renamed.constraints.length > 0 ||
            result.renamed.enums.length > 0 ||
            result.renamed.sequences.length > 0 ||
            result.renamed.functions.length > 0 ||
            result.modified.tables.length > 0 ||
            result.modified.columns.length > 0 ||
            result.modified.indexes.length > 0 ||
            result.modified.constraints.length > 0 ||
            result.modified.enums.length > 0 ||
            result.modified.sequences.length > 0 ||
            result.modified.functions.length > 0 ||
            result.modified.views.length > 0 ||
            result.modified.triggers.length > 0 ||
            result.modified.domains.length > 0 ||
            result.modified.compositeTypes.length > 0;
    return result;
}
function compareTables(oldTables, newTables, result) {
    const oldByName = new Map(oldTables.map(t => [t.name, t]));
    const newByName = new Map(newTables.map(t => [t.name, t]));
    const oldByTrackingId = new Map();
    const newByTrackingId = new Map();
    for (const t of oldTables) {
        if (t.trackingId)
            oldByTrackingId.set(t.trackingId, t);
    }
    for (const t of newTables) {
        if (t.trackingId)
            newByTrackingId.set(t.trackingId, t);
    }
    const processedOld = new Set();
    const processedNew = new Set();
    for (const [trackingId, oldTable] of oldByTrackingId) {
        const newTable = newByTrackingId.get(trackingId);
        if (newTable && newTable.name !== oldTable.name) {
            result.renamed.tables.push({
                from: oldTable.name,
                to: newTable.name,
                trackingId,
            });
            processedOld.add(oldTable.name);
            processedNew.add(newTable.name);
            compareTableColumns(oldTable, newTable, newTable.name, result);
            compareTableProperties(oldTable, newTable, newTable.name, result);
        }
    }
    for (const [name, newTable] of newByName) {
        if (processedNew.has(name))
            continue;
        const oldTable = oldByName.get(name);
        if (oldTable) {
            processedOld.add(name);
            compareTableColumns(oldTable, newTable, name, result);
            compareTableProperties(oldTable, newTable, name, result);
        }
        else {
            result.added.tables.push(newTable);
        }
    }
    for (const [name, oldTable] of oldByName) {
        if (processedOld.has(name))
            continue;
        if (!newByName.has(name)) {
            result.removed.tables.push(oldTable);
        }
    }
}
function compareTableProperties(oldTable, newTable, tableName, result) {
    const changes = [];
    if ((oldTable.comment || '') !== (newTable.comment || '')) {
        changes.push('comment');
    }
    if ((oldTable.schema || 'public') !== (newTable.schema || 'public')) {
        changes.push('schema');
    }
    if (oldTable.isPartitioned !== newTable.isPartitioned) {
        changes.push('partitioning');
    }
    else if (oldTable.isPartitioned && newTable.isPartitioned) {
        if (oldTable.partitionType !== newTable.partitionType) {
            changes.push('partitionType');
        }
        const oldKey = (oldTable.partitionKey || []).join(',');
        const newKey = (newTable.partitionKey || []).join(',');
        if (oldKey !== newKey) {
            changes.push('partitionKey');
        }
    }
    const oldInherits = (oldTable.inherits || []).sort().join(',');
    const newInherits = (newTable.inherits || []).sort().join(',');
    if (oldInherits !== newInherits) {
        changes.push('inherits');
    }
    if (changes.length > 0) {
        result.modified.tables.push({ name: tableName, changes, oldTable, newTable });
    }
}
function compareTableColumns(oldTable, newTable, tableName, result) {
    const oldByName = new Map(oldTable.columns.map(c => [c.name, c]));
    const newByName = new Map(newTable.columns.map(c => [c.name, c]));
    const oldByTrackingId = new Map();
    const newByTrackingId = new Map();
    for (const c of oldTable.columns) {
        if (c.trackingId)
            oldByTrackingId.set(c.trackingId, c);
    }
    for (const c of newTable.columns) {
        if (c.trackingId)
            newByTrackingId.set(c.trackingId, c);
    }
    const processedOld = new Set();
    const processedNew = new Set();
    for (const [trackingId, oldCol] of oldByTrackingId) {
        const newCol = newByTrackingId.get(trackingId);
        if (newCol && newCol.name !== oldCol.name) {
            result.renamed.columns.push({
                table: tableName,
                from: oldCol.name,
                to: newCol.name,
                trackingId,
            });
            processedOld.add(oldCol.name);
            processedNew.add(newCol.name);
            const changes = compareColumnProperties(oldCol, newCol);
            if (changes.length > 0) {
                result.modified.columns.push({
                    table: tableName,
                    column: newCol.name,
                    columnType: newCol.type,
                    changes,
                });
            }
        }
    }
    for (const [name, newCol] of newByName) {
        if (processedNew.has(name))
            continue;
        const oldCol = oldByName.get(name);
        if (oldCol) {
            processedOld.add(name);
            const changes = compareColumnProperties(oldCol, newCol);
            if (changes.length > 0) {
                result.modified.columns.push({
                    table: tableName,
                    column: name,
                    columnType: newCol.type,
                    changes,
                });
            }
        }
        else {
            result.added.columns.push({ table: tableName, column: newCol });
        }
    }
    for (const [name, oldCol] of oldByName) {
        if (processedOld.has(name))
            continue;
        if (!newByName.has(name)) {
            result.removed.columns.push({ table: tableName, column: oldCol });
        }
    }
    compareTableIndexes(oldTable, newTable, tableName, result);
    compareTableConstraints(oldTable, newTable, tableName, result);
}
const IMPLICIT_PRECISION = {
    'integer': 32,
    'bigint': 64,
    'smallint': 16,
    'real': 24,
    'double precision': 53,
    'serial': 32,
    'bigserial': 64,
    'smallserial': 16,
    'boolean': 1,
    'money': 64,
    'oid': 32,
};
function normalizePrecision(type, precision) {
    if (precision == null)
        return undefined;
    const canonical = normalizeType(type);
    const implicit = IMPLICIT_PRECISION[canonical];
    if (implicit != null && precision === implicit)
        return undefined;
    return precision;
}
function compareColumnProperties(oldCol, newCol) {
    const changes = [];
    const oldType = normalizeType(oldCol.type);
    const newType = normalizeType(newCol.type);
    if (oldType !== newType) {
        changes.push({ field: 'type', from: oldCol.type, to: newCol.type });
    }
    if (oldCol.isNullable !== newCol.isNullable) {
        changes.push({ field: 'nullable', from: oldCol.isNullable, to: newCol.isNullable });
    }
    if (oldCol.isPrimaryKey !== newCol.isPrimaryKey) {
        changes.push({ field: 'primaryKey', from: oldCol.isPrimaryKey, to: newCol.isPrimaryKey });
    }
    if (oldCol.isUnique !== newCol.isUnique) {
        changes.push({ field: 'unique', from: oldCol.isUnique, to: newCol.isUnique });
    }
    if (!defaultsEqual(oldCol.defaultValue, newCol.defaultValue, oldType)) {
        changes.push({ field: 'default', from: oldCol.defaultValue, to: newCol.defaultValue });
    }
    const oldLength = oldCol.typeParams?.length;
    const newLength = newCol.typeParams?.length;
    if (oldLength !== newLength) {
        changes.push({ field: 'length', from: oldLength, to: newLength });
    }
    const resolvedType = oldType || newType;
    const oldPrecision = normalizePrecision(resolvedType, oldCol.typeParams?.precision);
    const newPrecision = normalizePrecision(resolvedType, newCol.typeParams?.precision);
    if (oldPrecision !== newPrecision) {
        changes.push({ field: 'precision', from: oldPrecision, to: newPrecision });
    }
    const oldScale = oldPrecision != null ? (oldCol.typeParams?.scale ?? undefined) : undefined;
    const newScale = newPrecision != null ? (newCol.typeParams?.scale ?? undefined) : undefined;
    if (oldScale !== newScale) {
        changes.push({ field: 'scale', from: oldScale, to: newScale });
    }
    return changes;
}
function defaultsEqual(a, b, colType) {
    if (a === b)
        return true;
    if (a == null && b == null)
        return true;
    if (a == null || b == null)
        return false;
    return normalizeDefault(a, colType) === normalizeDefault(b, colType);
}
function normalizeDefault(val, colType) {
    let v = val.trim();
    while (v.startsWith('(') && v.endsWith(')')) {
        const inner = v.slice(1, -1);
        let depth = 0;
        let balanced = true;
        for (const ch of inner) {
            if (ch === '(')
                depth++;
            if (ch === ')')
                depth--;
            if (depth < 0) {
                balanced = false;
                break;
            }
        }
        if (balanced && depth === 0)
            v = inner;
        else
            break;
    }
    const castMatch = v.match(/^'([^']*)'::[\w\s".\[\]]+$/i);
    if (castMatch) {
        v = `'${castMatch[1]}'`;
    }
    const upper = v.toUpperCase();
    if (upper === 'NOW()' || upper === 'CURRENT_TIMESTAMP' || upper === 'CURRENT_TIMESTAMP()') {
        return 'CURRENT_TIMESTAMP';
    }
    if (/^md5\(\(?gen_random_uuid\(\)\)?::text\)$/i.test(v)) {
        return 'MD5_RANDOM_UUID';
    }
    if (/^-?\d+\.?\d*$/.test(v)) {
        const num = parseFloat(v);
        if (!isNaN(num)) {
            v = String(num);
        }
    }
    if (v.startsWith("'") && v.endsWith("'")) {
        v = v.slice(1, -1);
    }
    const lv = v.toLowerCase();
    if (lv === '[]' || lv === "'[]'" || lv === "array[]" || /^array\[\]::.*$/i.test(v)) {
        return 'EMPTY_ARRAY';
    }
    if (lv === '{}' || lv === "'{}'") {
        const normCol = (colType || '').toLowerCase().trim();
        if (normCol.endsWith('[]') || normCol === 'array') {
            return 'EMPTY_ARRAY';
        }
        return 'EMPTY_OBJECT';
    }
    return v;
}
function compareTableIndexes(oldTable, newTable, tableName, result) {
    const oldByName = new Map(oldTable.indexes.map(i => [i.name, i]));
    const newByName = new Map(newTable.indexes.map(i => [i.name, i]));
    const oldByTrackingId = new Map();
    const newByTrackingId = new Map();
    const oldDupTrackingIds = new Set();
    const newDupTrackingIds = new Set();
    for (const i of oldTable.indexes) {
        if (i.trackingId) {
            if (oldByTrackingId.has(i.trackingId))
                oldDupTrackingIds.add(i.trackingId);
            else
                oldByTrackingId.set(i.trackingId, i);
        }
    }
    for (const i of newTable.indexes) {
        if (i.trackingId) {
            if (newByTrackingId.has(i.trackingId))
                newDupTrackingIds.add(i.trackingId);
            else
                newByTrackingId.set(i.trackingId, i);
        }
    }
    for (const dup of oldDupTrackingIds)
        oldByTrackingId.delete(dup);
    for (const dup of newDupTrackingIds)
        newByTrackingId.delete(dup);
    const processedOld = new Set();
    const processedNew = new Set();
    for (const [trackingId, oldIdx] of oldByTrackingId) {
        const newIdx = newByTrackingId.get(trackingId);
        if (!newIdx)
            continue;
        if (newIdx.name !== oldIdx.name) {
            result.renamed.indexes.push({
                table: tableName,
                from: oldIdx.name,
                to: newIdx.name,
                trackingId,
            });
        }
        const changes = compareIndexProperties(oldIdx, newIdx);
        if (changes.length > 0) {
            result.modified.indexes.push({ table: tableName, oldIndex: oldIdx, newIndex: newIdx, changes });
        }
        processedOld.add(oldIdx.name);
        processedNew.add(newIdx.name);
    }
    for (const [name, newIdx] of newByName) {
        if (processedNew.has(name))
            continue;
        const oldIdx = oldByName.get(name);
        if (oldIdx) {
            const changes = compareIndexProperties(oldIdx, newIdx);
            if (changes.length > 0) {
                result.modified.indexes.push({ table: tableName, oldIndex: oldIdx, newIndex: newIdx, changes });
            }
            processedOld.add(name);
        }
        else {
            result.added.indexes.push({ table: tableName, index: newIdx });
        }
    }
    for (const [name, oldIdx] of oldByName) {
        if (processedOld.has(name))
            continue;
        if (!newByName.has(name)) {
            result.removed.indexes.push({ table: tableName, index: oldIdx });
        }
    }
}
function compareIndexProperties(oldIdx, newIdx) {
    const changes = [];
    if (oldIdx.isUnique !== newIdx.isUnique) {
        changes.push(`unique: ${oldIdx.isUnique} → ${newIdx.isUnique}`);
    }
    if ((oldIdx.method || 'btree') !== (newIdx.method || 'btree')) {
        changes.push(`method: ${oldIdx.method || 'btree'} → ${newIdx.method || 'btree'}`);
    }
    const oldCols = normalizeIdxCols(oldIdx.columns).join(',');
    const newCols = normalizeIdxCols(newIdx.columns).join(',');
    if (oldCols !== newCols) {
        changes.push(`columns: ${oldCols} → ${newCols}`);
    }
    if ((oldIdx.whereClause || '') !== (newIdx.whereClause || '')) {
        changes.push(`where: changed`);
    }
    if ((oldIdx.includeColumns || []).join(',') !== (newIdx.includeColumns || []).join(',')) {
        changes.push(`include: changed`);
    }
    return changes;
}
function normalizeIdxCols(cols) {
    const result = [];
    for (const c of cols) {
        const s = c.trim();
        if (s.startsWith('{') && s.endsWith('}')) {
            result.push(...s.slice(1, -1).split(',').map(x => x.trim()).filter(Boolean));
        }
        else if (s) {
            result.push(s);
        }
    }
    return result;
}
function compareTableConstraints(oldTable, newTable, tableName, result) {
    const oldByName = new Map(oldTable.constraints.map(c => [c.name, c]));
    const newByName = new Map(newTable.constraints.map(c => [c.name, c]));
    const oldByTrackingId = new Map();
    const newByTrackingId = new Map();
    const oldDupConTrackingIds = new Set();
    const newDupConTrackingIds = new Set();
    for (const c of oldTable.constraints) {
        if (c.trackingId) {
            if (oldByTrackingId.has(c.trackingId))
                oldDupConTrackingIds.add(c.trackingId);
            else
                oldByTrackingId.set(c.trackingId, c);
        }
    }
    for (const c of newTable.constraints) {
        if (c.trackingId) {
            if (newByTrackingId.has(c.trackingId))
                newDupConTrackingIds.add(c.trackingId);
            else
                newByTrackingId.set(c.trackingId, c);
        }
    }
    for (const dup of oldDupConTrackingIds)
        oldByTrackingId.delete(dup);
    for (const dup of newDupConTrackingIds)
        newByTrackingId.delete(dup);
    const processedOld = new Set();
    const processedNew = new Set();
    for (const [trackingId, oldCon] of oldByTrackingId) {
        const newCon = newByTrackingId.get(trackingId);
        if (!newCon)
            continue;
        const wasRenamed = newCon.name !== oldCon.name;
        if (wasRenamed) {
            result.renamed.constraints.push({
                table: tableName,
                from: oldCon.name,
                to: newCon.name,
                trackingId,
            });
        }
        if (!wasRenamed) {
            const changes = compareConstraintProperties(oldCon, newCon);
            if (changes.length > 0) {
                result.modified.constraints.push({ table: tableName, oldConstraint: oldCon, newConstraint: newCon, changes });
            }
        }
        processedOld.add(oldCon.name);
        processedNew.add(newCon.name);
    }
    for (const [name, newCon] of newByName) {
        if (processedNew.has(name))
            continue;
        const oldCon = oldByName.get(name);
        if (oldCon) {
            const changes = compareConstraintProperties(oldCon, newCon);
            if (changes.length > 0) {
                result.modified.constraints.push({ table: tableName, oldConstraint: oldCon, newConstraint: newCon, changes });
            }
            processedOld.add(name);
            processedNew.add(name);
        }
    }
    const unmatchedOld = [...oldByName.entries()].filter(([n]) => !processedOld.has(n));
    const unmatchedNew = [...newByName.entries()].filter(([n]) => !processedNew.has(n));
    for (const [newName, newCon] of unmatchedNew) {
        const sig = constraintSignature(newCon);
        if (!sig)
            continue;
        const match = unmatchedOld.find(([, c]) => constraintSignature(c) === sig && !processedOld.has(c.name));
        if (match) {
            const [oldName, oldCon] = match;
            const wasRenamed = oldName !== newName;
            if (wasRenamed) {
                result.renamed.constraints.push({
                    table: tableName,
                    from: oldName,
                    to: newName,
                    trackingId: oldCon.trackingId || '',
                });
            }
            if (!wasRenamed) {
                const changes = compareConstraintProperties(oldCon, newCon);
                if (changes.length > 0) {
                    result.modified.constraints.push({ table: tableName, oldConstraint: oldCon, newConstraint: newCon, changes });
                }
            }
            processedOld.add(oldName);
            processedNew.add(newName);
        }
    }
    for (const [name, newCon] of newByName) {
        if (!processedNew.has(name)) {
            result.added.constraints.push({ table: tableName, constraint: newCon });
        }
    }
    for (const [name, oldCon] of oldByName) {
        if (!processedOld.has(name)) {
            result.removed.constraints.push({ table: tableName, constraint: oldCon });
        }
    }
}
function constraintSignature(con) {
    const cols = con.columns.sort().join(',');
    if (con.type === 'PRIMARY KEY')
        return `PK:${cols}`;
    if (con.type === 'UNIQUE')
        return `UNIQUE:${cols}`;
    if (con.type === 'FOREIGN KEY' && con.references) {
        return `FK:${cols}→${con.references.table}`;
    }
    return null;
}
function compareConstraintProperties(oldCon, newCon) {
    const changes = [];
    if (oldCon.type !== newCon.type) {
        changes.push(`type: ${oldCon.type} → ${newCon.type}`);
    }
    if (oldCon.type !== 'CHECK' && newCon.type !== 'CHECK') {
        const oldCols = oldCon.columns.filter(Boolean).sort().join(',');
        const newCols = newCon.columns.filter(Boolean).sort().join(',');
        if (oldCols !== newCols) {
            changes.push(`columns: ${oldCols} → ${newCols}`);
        }
    }
    if (oldCon.references && newCon.references) {
        if (oldCon.references.table !== newCon.references.table) {
            changes.push(`references: ${oldCon.references.table} → ${newCon.references.table}`);
        }
        if (oldCon.references.columns.join(',') !== newCon.references.columns.join(',')) {
            changes.push(`ref columns: ${oldCon.references.columns.join(',')} → ${newCon.references.columns.join(',')}`);
        }
        if ((oldCon.references.onDelete || 'NO ACTION') !== (newCon.references.onDelete || 'NO ACTION')) {
            changes.push(`onDelete: ${oldCon.references.onDelete || 'NO ACTION'} → ${newCon.references.onDelete || 'NO ACTION'}`);
        }
        if ((oldCon.references.onUpdate || 'NO ACTION') !== (newCon.references.onUpdate || 'NO ACTION')) {
            changes.push(`onUpdate: ${oldCon.references.onUpdate || 'NO ACTION'} → ${newCon.references.onUpdate || 'NO ACTION'}`);
        }
    }
    else if (oldCon.references !== newCon.references) {
        changes.push(`references: changed`);
    }
    if (!checkExpressionsEqual(oldCon.expression, newCon.expression)) {
        changes.push(`check: changed`);
    }
    return changes;
}
function checkExpressionsEqual(a, b) {
    if (a === b)
        return true;
    if (!a && !b)
        return true;
    if (!a || !b)
        return false;
    return normalizeCheckExpression(a) === normalizeCheckExpression(b);
}
function normalizeCheckExpression(expr) {
    let v = expr.trim();
    v = v.toLowerCase();
    v = stripOuterParens(v);
    v = v.replace(/\s+/g, ' ').trim();
    let prev = '';
    while (prev !== v) {
        prev = v;
        v = v.replace(/\)::\w+(\s+\w+)*(\[\])?/g, ')');
        v = v.replace(/'([^']*)'::\w+(\s+\w+)*/g, "'$1'");
    }
    v = v.replace(/"(\w+)"/g, '$1');
    v = v.replace(/\((\w+)\)/g, '$1');
    v = v.replace(/\s+/g, ' ').trim();
    v = v.replace(/(\w+)\s*=\s*any\s*\(\s*\(?array\s*\[([^\]]*)\]\)?\s*\)/gi, (_match, col, vals) => `${col} in (${vals.trim()})`);
    v = v.replace(/(\w+)\s*<>\s*all\s*\(\s*\(?array\s*\[([^\]]*)\]\)?\s*\)/gi, (_match, col, vals) => `${col} not in (${vals.trim()})`);
    v = stripOuterParens(v);
    v = v.replace(/\s+/g, ' ').trim();
    return v;
}
function stripOuterParens(expr) {
    let v = expr;
    while (v.startsWith('(') && v.endsWith(')')) {
        const inner = v.slice(1, -1);
        let depth = 0;
        let balanced = true;
        for (const ch of inner) {
            if (ch === '(')
                depth++;
            if (ch === ')')
                depth--;
            if (depth < 0) {
                balanced = false;
                break;
            }
        }
        if (balanced && depth === 0)
            v = inner;
        else
            break;
    }
    return v;
}
function compareEnums(oldEnums, newEnums, result) {
    const oldByName = new Map(oldEnums.map(e => [e.name, e]));
    const newByName = new Map(newEnums.map(e => [e.name, e]));
    const oldByTrackingId = new Map();
    const newByTrackingId = new Map();
    for (const e of oldEnums) {
        if (e.trackingId)
            oldByTrackingId.set(e.trackingId, e);
    }
    for (const e of newEnums) {
        if (e.trackingId)
            newByTrackingId.set(e.trackingId, e);
    }
    const processedOld = new Set();
    const processedNew = new Set();
    for (const [trackingId, oldEnum] of oldByTrackingId) {
        const newEnum = newByTrackingId.get(trackingId);
        if (newEnum && newEnum.name !== oldEnum.name) {
            result.renamed.enums.push({
                from: oldEnum.name,
                to: newEnum.name,
                trackingId,
            });
            processedOld.add(oldEnum.name);
            processedNew.add(newEnum.name);
            const added = newEnum.values.filter(v => !oldEnum.values.includes(v));
            const removed = oldEnum.values.filter(v => !newEnum.values.includes(v));
            if (added.length > 0 || removed.length > 0) {
                result.modified.enums.push({
                    name: newEnum.name,
                    changes: { added, removed },
                });
            }
        }
    }
    for (const [name, newEnum] of newByName) {
        if (processedNew.has(name))
            continue;
        const oldEnum = oldByName.get(name);
        if (oldEnum) {
            processedOld.add(name);
            const added = newEnum.values.filter(v => !oldEnum.values.includes(v));
            const removed = oldEnum.values.filter(v => !newEnum.values.includes(v));
            if (added.length > 0 || removed.length > 0) {
                result.modified.enums.push({
                    name,
                    changes: { added, removed },
                });
            }
        }
        else {
            result.added.enums.push(newEnum);
        }
    }
    for (const [name, oldEnum] of oldByName) {
        if (processedOld.has(name))
            continue;
        if (!newByName.has(name)) {
            result.removed.enums.push(oldEnum);
        }
    }
}
function isSeqDefaultLimit(val, kind) {
    if (val === undefined)
        return true;
    if (kind === 'max') {
        return val > Number.MAX_SAFE_INTEGER || val === 2147483647;
    }
    if (kind === 'min') {
        return val === 1 || val < -Number.MAX_SAFE_INTEGER;
    }
    return false;
}
function compareSequenceProperties(oldSeqs, newSeqs, result) {
    const oldByName = new Map(oldSeqs.map(s => [s.name, s]));
    const renamedFrom = new Set(result.renamed.sequences.map(r => r.from));
    const renamedTo = new Set(result.renamed.sequences.map(r => r.to));
    for (const newSeq of newSeqs) {
        if (renamedTo.has(newSeq.name))
            continue;
        const oldSeq = oldByName.get(newSeq.name);
        if (!oldSeq || renamedFrom.has(oldSeq.name))
            continue;
        const changes = [];
        if (oldSeq.startValue !== newSeq.startValue)
            changes.push('startValue');
        if (oldSeq.increment !== newSeq.increment)
            changes.push('increment');
        const oldMinDefault = isSeqDefaultLimit(oldSeq.minValue, 'min');
        const newMinDefault = isSeqDefaultLimit(newSeq.minValue, 'min');
        if (!(oldMinDefault && newMinDefault) && oldSeq.minValue !== newSeq.minValue) {
            changes.push('minValue');
        }
        const oldMaxDefault = isSeqDefaultLimit(oldSeq.maxValue, 'max');
        const newMaxDefault = isSeqDefaultLimit(newSeq.maxValue, 'max');
        if (!(oldMaxDefault && newMaxDefault) && oldSeq.maxValue !== newSeq.maxValue) {
            changes.push('maxValue');
        }
        if (oldSeq.cache !== newSeq.cache)
            changes.push('cache');
        if (oldSeq.cycle !== newSeq.cycle)
            changes.push('cycle');
        const oldOwned = oldSeq.ownedBy ? `${oldSeq.ownedBy.table}.${oldSeq.ownedBy.column}` : '';
        const newOwned = newSeq.ownedBy ? `${newSeq.ownedBy.table}.${newSeq.ownedBy.column}` : '';
        if (oldOwned !== newOwned)
            changes.push('ownedBy');
        if (changes.length > 0) {
            result.modified.sequences.push({ name: newSeq.name, oldSequence: oldSeq, newSequence: newSeq, changes });
        }
    }
}
function compareFunctionProperties(oldFuncs, newFuncs, result) {
    const oldByName = new Map(oldFuncs.map(f => [f.name, f]));
    const renamedFrom = new Set(result.renamed.functions.map(r => r.from));
    const renamedTo = new Set(result.renamed.functions.map(r => r.to));
    for (const newFunc of newFuncs) {
        if (renamedTo.has(newFunc.name))
            continue;
        const oldFunc = oldByName.get(newFunc.name);
        if (!oldFunc || renamedFrom.has(oldFunc.name))
            continue;
        const changes = [];
        if (oldFunc.returnType !== newFunc.returnType)
            changes.push('returnType');
        if (oldFunc.language !== newFunc.language)
            changes.push('language');
        if (normalizeBody(oldFunc.body) !== normalizeBody(newFunc.body))
            changes.push('body');
        if ((oldFunc.volatility || 'VOLATILE') !== (newFunc.volatility || 'VOLATILE'))
            changes.push('volatility');
        if (oldFunc.isStrict !== newFunc.isStrict)
            changes.push('isStrict');
        if (oldFunc.securityDefiner !== newFunc.securityDefiner)
            changes.push('securityDefiner');
        const oldArgs = oldFunc.args.map(a => `${a.mode || 'IN'} ${a.type}`).join(',');
        const newArgs = newFunc.args.map(a => `${a.mode || 'IN'} ${a.type}`).join(',');
        if (oldArgs !== newArgs)
            changes.push('args');
        if (changes.length > 0) {
            result.modified.functions.push({ name: newFunc.name, oldFunction: oldFunc, newFunction: newFunc, changes });
        }
    }
}
function normalizeBody(body) {
    return body.trim().replace(/;\s*$/, '').replace(/\s+/g, ' ');
}
function compareViewProperties(oldViews, newViews, result) {
    const oldByName = new Map(oldViews.map(v => [v.name, v]));
    for (const newView of newViews) {
        const oldView = oldByName.get(newView.name);
        if (!oldView)
            continue;
        const changes = [];
        const oldDef = oldView.definition.trim().replace(/\s+/g, ' ').toLowerCase();
        const newDef = newView.definition.trim().replace(/\s+/g, ' ').toLowerCase();
        if (oldDef !== newDef)
            changes.push('definition');
        if (oldView.isMaterialized !== newView.isMaterialized)
            changes.push('isMaterialized');
        if (changes.length > 0) {
            result.modified.views.push({ name: newView.name, oldView, newView, changes });
        }
    }
}
function compareTriggerProperties(oldTriggers, newTriggers, result) {
    const oldByName = new Map(oldTriggers.map(t => [t.name, t]));
    for (const newTrig of newTriggers) {
        const oldTrig = oldByName.get(newTrig.name);
        if (!oldTrig)
            continue;
        const changes = [];
        if (oldTrig.timing !== newTrig.timing)
            changes.push('timing');
        if (oldTrig.events.sort().join(',') !== newTrig.events.sort().join(','))
            changes.push('events');
        if (oldTrig.forEach !== newTrig.forEach)
            changes.push('forEach');
        if (oldTrig.functionName !== newTrig.functionName)
            changes.push('functionName');
        if (oldTrig.table !== newTrig.table)
            changes.push('table');
        if ((oldTrig.whenClause || '') !== (newTrig.whenClause || ''))
            changes.push('whenClause');
        if (oldTrig.isConstraint !== newTrig.isConstraint)
            changes.push('isConstraint');
        if (changes.length > 0) {
            result.modified.triggers.push({ name: newTrig.name, oldTrigger: oldTrig, newTrigger: newTrig, changes });
        }
    }
}
function compareDomainProperties(oldDomains, newDomains, result) {
    const oldByName = new Map(oldDomains.map(d => [d.name, d]));
    for (const newDom of newDomains) {
        const oldDom = oldByName.get(newDom.name);
        if (!oldDom)
            continue;
        const changes = [];
        if (normalizeType(oldDom.baseType) !== normalizeType(newDom.baseType))
            changes.push('baseType');
        if (oldDom.notNull !== newDom.notNull)
            changes.push('notNull');
        if ((oldDom.defaultValue || '') !== (newDom.defaultValue || ''))
            changes.push('defaultValue');
        if (!checkExpressionsEqual(oldDom.checkExpression, newDom.checkExpression))
            changes.push('checkExpression');
        if (changes.length > 0) {
            result.modified.domains.push({ name: newDom.name, oldDomain: oldDom, newDomain: newDom, changes });
        }
    }
}
function compareCompositeTypeProperties(oldTypes, newTypes, result) {
    const oldByName = new Map(oldTypes.map(t => [t.name, t]));
    for (const newType of newTypes) {
        const oldType = oldByName.get(newType.name);
        if (!oldType)
            continue;
        const changes = [];
        const oldAttrs = oldType.attributes.map(a => `${a.name}:${normalizeType(a.type)}`).join(',');
        const newAttrs = newType.attributes.map(a => `${a.name}:${normalizeType(a.type)}`).join(',');
        if (oldAttrs !== newAttrs)
            changes.push('attributes');
        if (changes.length > 0) {
            result.modified.compositeTypes.push({ name: newType.name, oldType, newType, changes });
        }
    }
}
function compareByTrackingId(oldItems, newItems, getName, getTrackingId, onAdd, onRemove, onRename) {
    const oldByName = new Map(oldItems.map(item => [getName(item), item]));
    const newByName = new Map(newItems.map(item => [getName(item), item]));
    const oldByTrackingId = new Map();
    const newByTrackingId = new Map();
    for (const item of oldItems) {
        const tid = getTrackingId(item);
        if (tid)
            oldByTrackingId.set(tid, item);
    }
    for (const item of newItems) {
        const tid = getTrackingId(item);
        if (tid)
            newByTrackingId.set(tid, item);
    }
    const processedOld = new Set();
    const processedNew = new Set();
    for (const [trackingId, oldItem] of oldByTrackingId) {
        const newItem = newByTrackingId.get(trackingId);
        if (newItem && getName(newItem) !== getName(oldItem)) {
            onRename(getName(oldItem), getName(newItem), trackingId);
            processedOld.add(getName(oldItem));
            processedNew.add(getName(newItem));
        }
    }
    for (const [name, item] of newByName) {
        if (processedNew.has(name))
            continue;
        if (!oldByName.has(name)) {
            onAdd(item);
        }
    }
    for (const [name, item] of oldByName) {
        if (processedOld.has(name))
            continue;
        if (!newByName.has(name)) {
            onRemove(item);
        }
    }
}
function compareByName(oldItems, newItems, getName, onAdd, onRemove) {
    const oldNames = new Set(oldItems.map(getName));
    const newNames = new Set(newItems.map(getName));
    for (const item of newItems) {
        if (!oldNames.has(getName(item))) {
            onAdd(item);
        }
    }
    for (const item of oldItems) {
        if (!newNames.has(getName(item))) {
            onRemove(item);
        }
    }
}
