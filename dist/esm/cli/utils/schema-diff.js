import { colors } from "./spinner.js";
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
export function diffSchemas(local, remote) {
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
    for (const [name, remoteTable] of remoteMap) {
        if (!localMap.has(name)) {
            diffs.push({
                name,
                type: 'added',
                columns: remoteTable.columns.map(c => ({ name: c.name, type: 'added' })),
                indexes: remoteTable.indexes.map(i => ({ name: i.name, type: 'added' })),
            });
        }
    }
    for (const [name, localTable] of localMap) {
        if (!remoteMap.has(name)) {
            diffs.push({
                name,
                type: 'removed',
                columns: localTable.columns.map(c => ({ name: c.name, type: 'removed' })),
                indexes: localTable.indexes.map(i => ({ name: i.name, type: 'removed' })),
            });
        }
    }
    for (const [name, localTable] of localMap) {
        const remoteTable = remoteMap.get(name);
        if (remoteTable) {
            const columnDiffs = diffColumns(localTable.columns, remoteTable.columns);
            const indexDiffs = diffIndexes(localTable.indexes, remoteTable.indexes);
            if (columnDiffs.length > 0 || indexDiffs.length > 0) {
                diffs.push({
                    name,
                    type: 'modified',
                    columns: columnDiffs,
                    indexes: indexDiffs,
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
    for (const [name] of remoteMap) {
        if (!localMap.has(name)) {
            diffs.push({ name, type: 'added' });
        }
    }
    for (const [name] of localMap) {
        if (!remoteMap.has(name)) {
            diffs.push({ name, type: 'removed' });
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
    return changes;
}
function diffIndexes(local, remote) {
    const diffs = [];
    const localMap = new Map(local.map(i => [i.name, i]));
    const remoteMap = new Map(remote.map(i => [i.name, i]));
    for (const [name] of remoteMap) {
        if (!localMap.has(name)) {
            diffs.push({ name, type: 'added' });
        }
    }
    for (const [name] of localMap) {
        if (!remoteMap.has(name)) {
            diffs.push({ name, type: 'removed' });
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
export function formatDiff(diff) {
    const lines = [];
    if (!diff.hasChanges) {
        lines.push(colors.green('✓ No changes detected'));
        return lines.join('\n');
    }
    const { summary } = diff;
    const parts = [];
    if (summary.tablesAdded > 0)
        parts.push(colors.green(`+${summary.tablesAdded} tables`));
    if (summary.tablesRemoved > 0)
        parts.push(colors.red(`-${summary.tablesRemoved} tables`));
    if (summary.tablesModified > 0)
        parts.push(colors.yellow(`~${summary.tablesModified} tables`));
    lines.push(`Changes: ${parts.join(', ') || 'none'}`);
    lines.push('');
    for (const table of diff.tables) {
        const icon = table.type === 'added' ? colors.green('+') :
            table.type === 'removed' ? colors.red('-') :
                colors.yellow('~');
        lines.push(`${icon} ${colors.bold(table.name)}`);
        for (const col of table.columns || []) {
            const colIcon = col.type === 'added' ? colors.green('  +') :
                col.type === 'removed' ? colors.red('  -') :
                    colors.yellow('  ~');
            if (col.changes && col.changes.length > 0) {
                const changeStr = col.changes.map(c => `${c.field}: ${c.from} → ${c.to}`).join(', ');
                lines.push(`${colIcon} ${col.name} (${colors.muted(changeStr)})`);
            }
            else {
                lines.push(`${colIcon} ${col.name}`);
            }
        }
        for (const idx of table.indexes || []) {
            const idxIcon = idx.type === 'added' ? colors.green('  +') :
                colors.red('  -');
            lines.push(`${idxIcon} index: ${idx.name}`);
        }
    }
    for (const ext of diff.extensions) {
        const icon = ext.type === 'added' ? colors.green('+') : colors.red('-');
        lines.push(`${icon} extension: ${ext.name}`);
    }
    return lines.join('\n');
}
export function formatSummary(diff) {
    const { summary } = diff;
    if (!diff.hasChanges) {
        return colors.green('No changes');
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
export function filterDiff(diff, ignorePatterns) {
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
export function hasDestructiveChanges(diff) {
    if (diff.summary.tablesRemoved > 0 || diff.summary.columnsRemoved > 0) {
        return true;
    }
    return false;
}
export function getDestructiveTables(diff) {
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
