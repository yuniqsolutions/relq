"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.diffSchemas = diffSchemas;
exports.formatDiff = formatDiff;
exports.formatSummary = formatSummary;
exports.formatCategorizedSummary = formatCategorizedSummary;
exports.filterDiff = filterDiff;
exports.hasDestructiveChanges = hasDestructiveChanges;
exports.stripDestructiveChanges = stripDestructiveChanges;
exports.getDestructiveTables = getDestructiveTables;
exports.compareSchemas = compareSchemas;
const colors_1 = require("./colors.cjs");
function normalizedToColumnInfo(col) {
    return {
        name: col.name,
        dataType: col.type,
        isNullable: col.nullable,
        defaultValue: col.defaultValue ?? null,
        isPrimaryKey: col.isPrimaryKey,
        isUnique: col.isUnique,
        maxLength: col.length ?? null,
        precision: null,
        scale: null,
        comment: col.comment,
    };
}
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
function diffSchemas(local, remote) {
    const tables = diffTables(local.tables, remote.tables);
    const extensions = diffExtensions(local.extensions, remote.extensions);
    const summary = calculateSummary(tables, extensions);
    const hasChanges = summary.tablesAdded > 0 || summary.tablesRemoved > 0 ||
        summary.tablesModified > 0 || extensions.length > 0;
    return { tables, extensions, summary, hasChanges };
}
function diffTables(local, remote) {
    const diffs = [];
    const localMap = new Map(local.map(t => [t.name, t]));
    const remoteMap = new Map(remote.map(t => [t.name, t]));
    const toConstraintInfo = (c) => ({
        name: c.name,
        type: (c.type || 'CHECK'),
        columns: [],
        definition: c.definition || '',
        trackingId: c.trackingId,
    });
    const toIndexInfo = (i) => ({
        name: i.name,
        columns: i.columns,
        isUnique: i.unique,
        isPrimary: false,
        type: i.type || 'btree',
        trackingId: i.trackingId,
    });
    for (const [name, remoteTable] of remoteMap) {
        if (!localMap.has(name)) {
            diffs.push({
                name,
                type: 'added',
                columns: remoteTable.columns.map(c => ({
                    name: c.name,
                    type: 'added',
                    after: normalizedToColumnInfo(c),
                })),
                indexes: remoteTable.indexes.map(i => ({
                    name: i.name,
                    type: 'added',
                    after: toIndexInfo(i),
                })),
                constraints: remoteTable.constraints.map(c => ({
                    name: c.name,
                    type: 'added',
                    after: toConstraintInfo(c),
                })),
            });
        }
    }
    for (const [name, localTable] of localMap) {
        if (!remoteMap.has(name)) {
            diffs.push({
                name,
                type: 'removed',
                columns: localTable.columns.map(c => ({
                    name: c.name,
                    type: 'removed',
                    before: normalizedToColumnInfo(c),
                })),
                indexes: localTable.indexes.map(i => ({
                    name: i.name,
                    type: 'removed',
                    before: toIndexInfo(i),
                })),
                constraints: localTable.constraints.map(c => ({
                    name: c.name,
                    type: 'removed',
                    before: toConstraintInfo(c),
                })),
            });
        }
    }
    for (const [name, localTable] of localMap) {
        const remoteTable = remoteMap.get(name);
        if (remoteTable) {
            const columnDiffs = diffColumns(localTable.columns, remoteTable.columns);
            const indexDiffs = diffIndexes(localTable.indexes, remoteTable.indexes);
            const constraintDiffs = diffConstraints(localTable.constraints, remoteTable.constraints);
            if (columnDiffs.length > 0 || indexDiffs.length > 0 || constraintDiffs.length > 0) {
                diffs.push({
                    name,
                    type: 'modified',
                    columns: columnDiffs,
                    indexes: indexDiffs,
                    constraints: constraintDiffs,
                });
            }
        }
    }
    return diffs.sort((a, b) => a.name.localeCompare(b.name));
}
function diffColumns(local, remote) {
    const diffs = [];
    const localMap = new Map(local.map(c => [c.name, c]));
    const remoteMap = new Map(remote.map(c => [c.name, c]));
    for (const [name, remoteCol] of remoteMap) {
        if (!localMap.has(name)) {
            diffs.push({ name, type: 'added', after: normalizedToColumnInfo(remoteCol) });
        }
    }
    for (const [name, localCol] of localMap) {
        if (!remoteMap.has(name)) {
            diffs.push({ name, type: 'removed', before: normalizedToColumnInfo(localCol) });
        }
    }
    for (const [name, localCol] of localMap) {
        const remoteCol = remoteMap.get(name);
        if (remoteCol) {
            const changes = compareColumns(localCol, remoteCol);
            if (changes.length > 0) {
                diffs.push({ name, type: 'modified', changes });
            }
        }
    }
    return diffs;
}
function compareColumns(local, remote) {
    const changes = [];
    const localType = normalizeType(local.type);
    const remoteType = normalizeType(remote.type);
    if (localType !== remoteType) {
        changes.push({ field: 'type', from: local.type, to: remote.type });
    }
    if (local.nullable !== remote.nullable) {
        changes.push({ field: 'nullable', from: local.nullable, to: remote.nullable });
    }
    if (local.length !== remote.length && (local.length || remote.length)) {
        changes.push({ field: 'length', from: local.length, to: remote.length });
    }
    if (local.isPrimaryKey !== remote.isPrimaryKey) {
        changes.push({ field: 'primaryKey', from: local.isPrimaryKey, to: remote.isPrimaryKey });
    }
    if (local.isUnique !== remote.isUnique) {
        changes.push({ field: 'unique', from: local.isUnique, to: remote.isUnique });
    }
    if ((local.comment || undefined) !== (remote.comment || undefined)) {
        changes.push({ field: 'comment', from: local.comment, to: remote.comment });
    }
    return changes;
}
function diffIndexes(local, remote) {
    const diffs = [];
    const localMap = new Map(local.map(i => [i.name, i]));
    const remoteMap = new Map(remote.map(i => [i.name, i]));
    const toIdxInfo = (i) => ({
        name: i.name,
        columns: i.columns,
        isUnique: i.unique,
        isPrimary: false,
        type: i.type || 'btree',
        trackingId: i.trackingId,
    });
    for (const [name, idx] of remoteMap) {
        if (!localMap.has(name)) {
            diffs.push({ name, type: 'added', after: toIdxInfo(idx) });
        }
    }
    for (const [name, idx] of localMap) {
        if (!remoteMap.has(name)) {
            diffs.push({ name, type: 'removed', before: toIdxInfo(idx) });
        }
    }
    return diffs;
}
function diffConstraints(local, remote) {
    const diffs = [];
    const toConstraintInfo = (c) => ({
        name: c.name,
        type: (c.type || 'CHECK'),
        columns: [],
        definition: c.definition || '',
        trackingId: c.trackingId,
    });
    const matchedLocal = new Set();
    const matchedRemote = new Set();
    for (let ri = 0; ri < remote.length; ri++) {
        if (matchedRemote.has(ri))
            continue;
        const rc = remote[ri];
        if (!rc.trackingId)
            continue;
        for (let li = 0; li < local.length; li++) {
            if (matchedLocal.has(li))
                continue;
            const lc = local[li];
            if (lc.trackingId && lc.trackingId === rc.trackingId) {
                matchedLocal.add(li);
                matchedRemote.add(ri);
                break;
            }
        }
    }
    for (let ri = 0; ri < remote.length; ri++) {
        if (matchedRemote.has(ri))
            continue;
        const rc = remote[ri];
        if (!rc.name)
            continue;
        for (let li = 0; li < local.length; li++) {
            if (matchedLocal.has(li))
                continue;
            const lc = local[li];
            if (lc.name && lc.name === rc.name) {
                matchedLocal.add(li);
                matchedRemote.add(ri);
                break;
            }
        }
    }
    const semanticSig = (c) => {
        const def = c.definition || '';
        const type = (c.type || '').toUpperCase();
        if (type === 'PRIMARY KEY' || type === 'UNIQUE') {
            const colMatch = def.match(/\(([^)]+)\)/);
            if (colMatch) {
                const cols = colMatch[1].replace(/"/g, '').split(',').map(s => s.trim().toLowerCase()).sort().join(',');
                return `${type}:${cols}`;
            }
        }
        if (type === 'FOREIGN KEY') {
            const fkMatch = def.match(/FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s+"?(\w+)"?/i);
            if (fkMatch) {
                const srcCols = fkMatch[1].replace(/"/g, '').split(',').map(s => s.trim().toLowerCase()).sort().join(',');
                const targetTable = fkMatch[2].toLowerCase();
                return `FK:${srcCols}→${targetTable}`;
            }
        }
        return null;
    };
    for (let ri = 0; ri < remote.length; ri++) {
        if (matchedRemote.has(ri))
            continue;
        const rSig = semanticSig(remote[ri]);
        if (!rSig)
            continue;
        for (let li = 0; li < local.length; li++) {
            if (matchedLocal.has(li))
                continue;
            const lSig = semanticSig(local[li]);
            if (lSig && lSig === rSig) {
                matchedLocal.add(li);
                matchedRemote.add(ri);
                break;
            }
        }
    }
    const unmatchedLocalChecks = local
        .map((c, i) => ({ c, i }))
        .filter(({ c, i }) => !matchedLocal.has(i) && (c.type || '').toUpperCase() === 'CHECK');
    const unmatchedRemoteChecks = remote
        .map((c, i) => ({ c, i }))
        .filter(({ c, i }) => !matchedRemote.has(i) && (c.type || '').toUpperCase() === 'CHECK');
    for (const { c: rc, i: ri } of unmatchedRemoteChecks) {
        if (matchedRemote.has(ri))
            continue;
        if (!rc.name)
            continue;
        for (const { c: lc, i: li } of unmatchedLocalChecks) {
            if (matchedLocal.has(li))
                continue;
            if (lc.name && (lc.name === rc.name ||
                (lc.name.endsWith('_check') && rc.name.endsWith('_check') &&
                    lc.name.split('_').slice(-2).join('_') === rc.name.split('_').slice(-2).join('_')))) {
                matchedLocal.add(li);
                matchedRemote.add(ri);
                break;
            }
        }
    }
    for (let ri = 0; ri < remote.length; ri++) {
        if (!matchedRemote.has(ri)) {
            const c = remote[ri];
            diffs.push({ name: c.name || c.definition || 'unnamed', type: 'added', after: toConstraintInfo(c) });
        }
    }
    for (let li = 0; li < local.length; li++) {
        if (!matchedLocal.has(li)) {
            const c = local[li];
            diffs.push({ name: c.name || c.definition || 'unnamed', type: 'removed', before: toConstraintInfo(c) });
        }
    }
    return diffs;
}
function diffExtensions(local, remote) {
    const diffs = [];
    const localSet = new Set(local);
    const remoteSet = new Set(remote);
    for (const ext of remoteSet) {
        if (!localSet.has(ext)) {
            diffs.push({ name: ext, type: 'added' });
        }
    }
    for (const ext of localSet) {
        if (!remoteSet.has(ext)) {
            diffs.push({ name: ext, type: 'removed' });
        }
    }
    return diffs;
}
function calculateSummary(tables, _extensions) {
    let tablesAdded = 0, tablesRemoved = 0, tablesModified = 0;
    let columnsAdded = 0, columnsRemoved = 0, columnsModified = 0;
    let indexesAdded = 0, indexesRemoved = 0;
    for (const table of tables) {
        if (table.type === 'added')
            tablesAdded++;
        else if (table.type === 'removed')
            tablesRemoved++;
        else if (table.type === 'modified')
            tablesModified++;
        for (const col of table.columns || []) {
            if (col.type === 'added')
                columnsAdded++;
            else if (col.type === 'removed')
                columnsRemoved++;
            else if (col.type === 'modified')
                columnsModified++;
        }
        for (const idx of table.indexes || []) {
            if (idx.type === 'added')
                indexesAdded++;
            else if (idx.type === 'removed')
                indexesRemoved++;
        }
    }
    return {
        tablesAdded, tablesRemoved, tablesModified,
        columnsAdded, columnsRemoved, columnsModified,
        indexesAdded, indexesRemoved,
    };
}
function formatDiff(diff) {
    const lines = [];
    if (!diff.hasChanges) {
        lines.push(colors_1.colors.green('✓ No changes detected'));
        return lines.join('\n');
    }
    const { summary } = diff;
    const parts = [];
    if (summary.tablesAdded > 0)
        parts.push(colors_1.colors.green(`+${summary.tablesAdded} tables`));
    if (summary.tablesRemoved > 0)
        parts.push(colors_1.colors.red(`-${summary.tablesRemoved} tables`));
    if (summary.tablesModified > 0)
        parts.push(colors_1.colors.yellow(`~${summary.tablesModified} tables`));
    lines.push(`Changes: ${parts.join(', ') || 'none'}`);
    lines.push('');
    for (const table of diff.tables) {
        const icon = table.type === 'added' ? colors_1.colors.green('+') :
            table.type === 'removed' ? colors_1.colors.red('-') :
                colors_1.colors.yellow('~');
        lines.push(`${icon} ${colors_1.colors.bold(table.name)}`);
        for (const col of table.columns || []) {
            const colIcon = col.type === 'added' ? colors_1.colors.green('  +') :
                col.type === 'removed' ? colors_1.colors.red('  -') :
                    colors_1.colors.yellow('  ~');
            if (col.changes && col.changes.length > 0) {
                const changeStr = col.changes.map(c => `${c.field}: ${c.from} → ${c.to}`).join(', ');
                lines.push(`${colIcon} ${col.name} (${colors_1.colors.muted(changeStr)})`);
            }
            else {
                lines.push(`${colIcon} ${col.name}`);
            }
        }
        for (const idx of table.indexes || []) {
            const idxIcon = idx.type === 'added' ? colors_1.colors.green('  +') :
                colors_1.colors.red('  -');
            lines.push(`${idxIcon} index: ${idx.name}`);
        }
        for (const con of table.constraints || []) {
            const conIcon = con.type === 'added' ? colors_1.colors.green('  +') :
                colors_1.colors.red('  -');
            lines.push(`${conIcon} constraint: ${con.name}`);
        }
    }
    for (const ext of diff.extensions) {
        const icon = ext.type === 'added' ? colors_1.colors.green('+') : colors_1.colors.red('-');
        lines.push(`${icon} extension: ${ext.name}`);
    }
    return lines.join('\n');
}
function formatSummary(diff) {
    const { summary } = diff;
    if (!diff.hasChanges) {
        return colors_1.colors.green('No changes');
    }
    const parts = [];
    const tablesTotal = summary.tablesAdded + summary.tablesRemoved + summary.tablesModified;
    const columnsTotal = summary.columnsAdded + summary.columnsRemoved + summary.columnsModified;
    const indexesTotal = summary.indexesAdded + summary.indexesRemoved;
    if (tablesTotal > 0) {
        const detail = [];
        if (summary.tablesAdded)
            detail.push(`+${summary.tablesAdded}`);
        if (summary.tablesRemoved)
            detail.push(`-${summary.tablesRemoved}`);
        if (summary.tablesModified)
            detail.push(`~${summary.tablesModified}`);
        parts.push(`${tablesTotal} tables (${detail.join(', ')})`);
    }
    if (columnsTotal > 0) {
        const detail = [];
        if (summary.columnsAdded)
            detail.push(`+${summary.columnsAdded}`);
        if (summary.columnsRemoved)
            detail.push(`-${summary.columnsRemoved}`);
        if (summary.columnsModified)
            detail.push(`~${summary.columnsModified}`);
        parts.push(`${columnsTotal} columns (${detail.join(', ')})`);
    }
    if (indexesTotal > 0) {
        const detail = [];
        if (summary.indexesAdded)
            detail.push(`+${summary.indexesAdded}`);
        if (summary.indexesRemoved)
            detail.push(`-${summary.indexesRemoved}`);
        parts.push(`${indexesTotal} indexes (${detail.join(', ')})`);
    }
    return parts.join(', ');
}
function formatCategorizedSummary(diff) {
    let tablesAdded = 0, tablesRemoved = 0, tablesModified = 0;
    let colsAdded = 0, colsRemoved = 0, colsModified = 0;
    let idxAdded = 0, idxRemoved = 0;
    let fkAdded = 0, fkRemoved = 0;
    let uniqueAdded = 0, uniqueRemoved = 0;
    let pkAdded = 0, pkRemoved = 0;
    let checkAdded = 0, checkRemoved = 0;
    let extAdded = 0, extRemoved = 0;
    let commentsAdded = 0, commentsRemoved = 0, commentsModified = 0;
    for (const table of diff.tables) {
        if (table.type === 'added')
            tablesAdded++;
        else if (table.type === 'removed')
            tablesRemoved++;
        else if (table.type === 'modified')
            tablesModified++;
        for (const col of table.columns || []) {
            if (col.type === 'added') {
                colsAdded++;
                if (col.after?.comment)
                    commentsAdded++;
            }
            else if (col.type === 'removed') {
                colsRemoved++;
                if (col.before?.comment)
                    commentsRemoved++;
            }
            else if (col.type === 'modified') {
                colsModified++;
                for (const change of col.changes || []) {
                    if (change.field === 'comment') {
                        if (change.from && change.to)
                            commentsModified++;
                        else if (change.to)
                            commentsAdded++;
                        else if (change.from)
                            commentsRemoved++;
                    }
                }
            }
        }
        for (const idx of table.indexes || []) {
            if (idx.type === 'added')
                idxAdded++;
            else if (idx.type === 'removed')
                idxRemoved++;
        }
        for (const con of table.constraints || []) {
            const before = con.before;
            const after = con.after;
            const conType = (before?.type || after?.type || '').toUpperCase();
            let category = 'OTHER';
            if (conType) {
                category = conType;
            }
            else {
                const name = (con.name || '').toLowerCase();
                if (name.includes('pkey') || name.includes('primary'))
                    category = 'PRIMARY KEY';
                else if (name.includes('fkey') || name.includes('foreign'))
                    category = 'FOREIGN KEY';
                else if (name.includes('_check'))
                    category = 'CHECK';
                else if (name.includes('_key') || name.includes('unique'))
                    category = 'UNIQUE';
            }
            if (category === 'FOREIGN KEY') {
                if (con.type === 'added')
                    fkAdded++;
                else if (con.type === 'removed')
                    fkRemoved++;
            }
            else if (category === 'UNIQUE') {
                if (con.type === 'added')
                    uniqueAdded++;
                else if (con.type === 'removed')
                    uniqueRemoved++;
            }
            else if (category === 'PRIMARY KEY') {
                if (con.type === 'added')
                    pkAdded++;
                else if (con.type === 'removed')
                    pkRemoved++;
            }
            else if (category === 'CHECK') {
                if (con.type === 'added')
                    checkAdded++;
                else if (con.type === 'removed')
                    checkRemoved++;
            }
            else {
                if (con.type === 'added')
                    checkAdded++;
                else if (con.type === 'removed')
                    checkRemoved++;
            }
        }
    }
    for (const ext of diff.extensions) {
        if (ext.type === 'added')
            extAdded++;
        else if (ext.type === 'removed')
            extRemoved++;
    }
    const lines = [];
    const fmt = (label, added, removed, modified = 0) => {
        const parts = [];
        if (added)
            parts.push(colors_1.colors.green(`${added} added`));
        if (modified)
            parts.push(colors_1.colors.yellow(`${modified} modified`));
        if (removed)
            parts.push(colors_1.colors.red(`${removed} removed`));
        if (parts.length > 0) {
            lines.push(`   ${colors_1.colors.muted(label + ':')} ${parts.join(', ')}`);
        }
    };
    fmt('tables', tablesAdded, tablesRemoved, tablesModified);
    fmt('columns', colsAdded, colsRemoved, colsModified);
    fmt('indexes', idxAdded, idxRemoved);
    fmt('primary keys', pkAdded, pkRemoved);
    fmt('unique constraints', uniqueAdded, uniqueRemoved);
    fmt('foreign keys', fkAdded, fkRemoved);
    fmt('check constraints', checkAdded, checkRemoved);
    fmt('comments', commentsAdded, commentsRemoved, commentsModified);
    fmt('extensions', extAdded, extRemoved);
    return lines;
}
function filterDiff(diff, ignorePatterns) {
    const patterns = ignorePatterns.map(p => {
        const regexStr = p.replace(/\*/g, '.*').replace(/\?/g, '.');
        return new RegExp(`^${regexStr}$`, 'i');
    });
    const matchesPattern = (name) => patterns.some(p => p.test(name));
    const tables = diff.tables.filter(t => !matchesPattern(t.name));
    const summary = calculateSummary(tables, diff.extensions);
    const hasChanges = tables.length > 0 || diff.extensions.length > 0;
    return {
        ...diff,
        tables,
        summary,
        hasChanges,
    };
}
function hasDestructiveChanges(diff) {
    if (diff.summary.tablesRemoved > 0 || diff.summary.columnsRemoved > 0) {
        return true;
    }
    return false;
}
function stripDestructiveChanges(diff) {
    const safeTables = diff.tables
        .filter(t => t.type !== 'removed')
        .map(t => {
        if (t.type !== 'modified')
            return t;
        const safeColumns = t.columns?.filter(c => c.type !== 'removed');
        return {
            ...t,
            columns: safeColumns,
        };
    })
        .filter(t => {
        if (t.type !== 'modified')
            return true;
        return (t.columns?.length || 0) > 0 || (t.indexes?.length || 0) > 0 || (t.constraints?.length || 0) > 0;
    });
    let columnsRemoved = 0;
    let tablesRemoved = 0;
    for (const t of diff.tables) {
        if (t.type === 'removed')
            tablesRemoved++;
        if (t.columns)
            columnsRemoved += t.columns.filter(c => c.type === 'removed').length;
    }
    return {
        ...diff,
        tables: safeTables,
        hasChanges: safeTables.length > 0 || diff.extensions.length > 0,
        summary: {
            ...diff.summary,
            tablesRemoved: 0,
            columnsRemoved: 0,
            tablesModified: safeTables.filter(t => t.type === 'modified').length,
        },
    };
}
function getDestructiveTables(diff) {
    const tables = [];
    for (const table of diff.tables) {
        if (table.type === 'removed') {
            tables.push(table.name);
        }
        else if (table.columns?.some(c => c.type === 'removed')) {
            tables.push(table.name);
        }
    }
    return tables;
}
function compareSchemas(oldSchema, newSchema) {
    const result = {
        added: {
            tables: [],
            columns: [],
            indexes: [],
            enums: [],
            domains: [],
            compositeTypes: [],
            sequences: [],
            views: [],
            functions: [],
            triggers: [],
            extensions: [],
        },
        removed: {
            tables: [],
            columns: [],
            indexes: [],
            enums: [],
            domains: [],
            compositeTypes: [],
            sequences: [],
            views: [],
            functions: [],
            triggers: [],
            extensions: [],
        },
        renamed: {
            tables: [],
            columns: [],
            indexes: [],
            enums: [],
            sequences: [],
            functions: [],
        },
        modified: {
            tables: [],
            columns: [],
            indexes: [],
            enums: [],
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
    compareByTrackingId(oldSchema.functions, newSchema.functions, (item) => item.name, (item) => item.trackingId, (item) => result.added.functions.push(item), (item) => result.removed.functions.push(item), (from, to, trackingId) => result.renamed.functions.push({ from, to, trackingId }));
    compareByName(oldSchema.views, newSchema.views, (item) => item.name, (item) => result.added.views.push(item), (item) => result.removed.views.push(item));
    compareByName(oldSchema.triggers, newSchema.triggers, (item) => item.name, (item) => result.added.triggers.push(item), (item) => result.removed.triggers.push(item));
    compareByName(oldSchema.domains, newSchema.domains, (item) => item.name, (item) => result.added.domains.push(item), (item) => result.removed.domains.push(item));
    compareByName(oldSchema.compositeTypes, newSchema.compositeTypes, (item) => item.name, (item) => result.added.compositeTypes.push(item), (item) => result.removed.compositeTypes.push(item));
    result.hasChanges =
        result.added.tables.length > 0 ||
            result.added.columns.length > 0 ||
            result.added.indexes.length > 0 ||
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
            result.renamed.enums.length > 0 ||
            result.renamed.sequences.length > 0 ||
            result.renamed.functions.length > 0 ||
            result.modified.tables.length > 0 ||
            result.modified.columns.length > 0 ||
            result.modified.indexes.length > 0 ||
            result.modified.enums.length > 0;
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
        }
    }
    for (const [name, newTable] of newByName) {
        if (processedNew.has(name))
            continue;
        const oldTable = oldByName.get(name);
        if (oldTable) {
            processedOld.add(name);
            compareTableColumns(oldTable, newTable, name, result);
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
    if (!defaultsEqual(oldCol.defaultValue, newCol.defaultValue)) {
        changes.push({ field: 'default', from: oldCol.defaultValue, to: newCol.defaultValue });
    }
    const oldLength = oldCol.typeParams?.length;
    const newLength = newCol.typeParams?.length;
    if (oldLength !== newLength) {
        changes.push({ field: 'length', from: oldLength, to: newLength });
    }
    const oldPrecision = oldCol.typeParams?.precision;
    const newPrecision = newCol.typeParams?.precision;
    if (oldPrecision !== newPrecision) {
        changes.push({ field: 'precision', from: oldPrecision, to: newPrecision });
    }
    const oldScale = oldCol.typeParams?.scale;
    const newScale = newCol.typeParams?.scale;
    if (oldScale !== newScale) {
        changes.push({ field: 'scale', from: oldScale, to: newScale });
    }
    return changes;
}
function defaultsEqual(a, b) {
    if (a === b)
        return true;
    if (a == null && b == null)
        return true;
    if (a == null || b == null)
        return false;
    return normalizeDefault(a) === normalizeDefault(b);
}
function normalizeDefault(val) {
    let v = val.trim();
    v = v.replace(/::[\w\s]+(\[\])?$/i, '');
    const upper = v.toUpperCase();
    if (upper === 'NOW()' || upper === 'CURRENT_TIMESTAMP' || upper === 'CURRENT_TIMESTAMP()') {
        return 'CURRENT_TIMESTAMP';
    }
    return v;
}
function compareTableIndexes(oldTable, newTable, tableName, result) {
    const oldByName = new Map(oldTable.indexes.map(i => [i.name, i]));
    const newByName = new Map(newTable.indexes.map(i => [i.name, i]));
    const oldByTrackingId = new Map();
    const newByTrackingId = new Map();
    for (const i of oldTable.indexes) {
        if (i.trackingId)
            oldByTrackingId.set(i.trackingId, i);
    }
    for (const i of newTable.indexes) {
        if (i.trackingId)
            newByTrackingId.set(i.trackingId, i);
    }
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
    if (oldIdx.columns.join(',') !== newIdx.columns.join(',')) {
        changes.push(`columns: ${oldIdx.columns.join(',')} → ${newIdx.columns.join(',')}`);
    }
    if ((oldIdx.whereClause || '') !== (newIdx.whereClause || '')) {
        changes.push(`where: changed`);
    }
    if ((oldIdx.includeColumns || []).join(',') !== (newIdx.includeColumns || []).join(',')) {
        changes.push(`include: changed`);
    }
    return changes;
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
