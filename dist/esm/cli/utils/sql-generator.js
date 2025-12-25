const RESERVED_WORDS = new Set([
    'user', 'order', 'check', 'table', 'index', 'column', 'constraint',
    'primary', 'foreign', 'key', 'references', 'unique', 'default',
    'null', 'not', 'and', 'or', 'in', 'like', 'between', 'case',
    'when', 'then', 'else', 'end', 'select', 'from', 'where', 'group',
    'having', 'order', 'by', 'limit', 'offset', 'join', 'left', 'right',
    'inner', 'outer', 'cross', 'on', 'as', 'into', 'values', 'insert',
    'update', 'delete', 'create', 'alter', 'drop', 'grant', 'revoke',
    'all', 'any', 'some', 'exists', 'true', 'false', 'boolean', 'int',
    'integer', 'text', 'varchar', 'char', 'timestamp', 'date', 'time',
    'interval', 'numeric', 'decimal', 'real', 'float', 'double', 'serial',
    'bigserial', 'smallserial', 'uuid', 'json', 'jsonb', 'array', 'type',
    'enum', 'domain', 'function', 'trigger', 'procedure', 'view', 'sequence',
    'schema', 'database', 'role', 'grant', 'privileges', 'public', 'admin',
    'analyze', 'using', 'cast', 'collate', 'returning', 'with', 'recursive',
    'abort', 'access', 'action', 'add', 'after', 'aggregate', 'also',
    'always', 'analyse', 'assertion', 'assignment', 'asymmetric', 'at',
    'attribute', 'authorization', 'backward', 'before', 'begin', 'both',
    'cache', 'called', 'cascade', 'cascaded', 'catalog', 'chain',
    'characteristics', 'checkpoint', 'class', 'close', 'cluster',
    'comment', 'comments', 'commit', 'committed', 'concurrently',
    'configuration', 'connection', 'constraints', 'content', 'continue',
    'conversion', 'copy', 'cost', 'current', 'current_catalog',
    'current_date', 'current_role', 'current_schema', 'current_time',
    'current_timestamp', 'current_user', 'cursor', 'cycle', 'data',
    'day', 'deallocate', 'declare', 'defaults', 'deferrable', 'deferred',
    'definer', 'delimiter', 'delimiters', 'depends', 'desc', 'detach',
    'dictionary', 'disable', 'discard', 'distinct', 'document', 'each',
    'enable', 'encoding', 'encrypted', 'escape', 'event', 'except',
    'exclude', 'excluding', 'exclusive', 'execute', 'explain', 'expression',
    'extension', 'external', 'extract', 'fetch', 'filter', 'first',
    'following', 'force', 'forward', 'freeze', 'full', 'generated',
    'global', 'granted', 'greatest', 'handler', 'header', 'hold',
    'hour', 'identity', 'if', 'ilike', 'immediate', 'immutable', 'implicit',
    'import', 'include', 'including', 'increment', 'indexes', 'inherit',
    'inherits', 'initially', 'inline', 'input', 'insensitive', 'instead',
    'invoker', 'is', 'isnull', 'isolation', 'label', 'language', 'large',
    'last', 'lateral', 'lc_collate', 'lc_ctype', 'leading', 'leakproof',
    'least', 'level', 'listen', 'load', 'local', 'localtime',
    'localtimestamp', 'location', 'lock', 'locked', 'logged', 'mapping',
    'match', 'materialized', 'maxvalue', 'method', 'minute', 'minvalue',
    'mode', 'month', 'move', 'name', 'names', 'national', 'natural',
    'nchar', 'new', 'next', 'no', 'none', 'normalize', 'nothing',
    'notify', 'notnull', 'nowait', 'nullif', 'nulls', 'object', 'of',
    'off', 'oids', 'old', 'only', 'operator', 'option', 'options',
    'ordinality', 'others', 'out', 'over', 'overlaps', 'overlay',
    'overriding', 'owned', 'owner', 'parallel', 'parser', 'partial',
    'partition', 'passing', 'password', 'placing', 'plans', 'policy',
    'position', 'preceding', 'prepare', 'prepared', 'preserve', 'prior',
    'privileges', 'procedural', 'program', 'publication', 'quote',
    'range', 'read', 'reassign', 'recheck', 'refresh', 'reindex',
    'relative', 'release', 'rename', 'repeatable', 'replace', 'replica',
    'reset', 'restart', 'restrict', 'result', 'return', 'returns',
    'rollback', 'rollup', 'routine', 'row', 'rows', 'rule', 'savepoint',
    'scroll', 'search', 'second', 'security', 'serializable', 'server',
    'session', 'session_user', 'set', 'setof', 'sets', 'share', 'show',
    'similar', 'simple', 'skip', 'snapshot', 'sql', 'stable', 'standalone',
    'start', 'statement', 'statistics', 'stdin', 'stdout', 'storage',
    'stored', 'strict', 'strip', 'subscription', 'substring', 'support',
    'symmetric', 'sysid', 'system', 'tables', 'tablespace', 'temp',
    'template', 'temporary', 'ties', 'trailing', 'transaction',
    'transform', 'treat', 'trim', 'truncate', 'trusted', 'types',
    'uescape', 'unbounded', 'uncommitted', 'unencrypted', 'union',
    'unknown', 'unlisten', 'unlogged', 'until', 'vacuum', 'valid',
    'validate', 'validator', 'value', 'varying', 'verbose', 'version',
    'volatile', 'whitespace', 'window', 'within', 'without', 'work',
    'wrapper', 'write', 'xml', 'xmlattributes', 'xmlconcat', 'xmlelement',
    'xmlexists', 'xmlforest', 'xmlnamespaces', 'xmlparse', 'xmlpi',
    'xmlroot', 'xmlserialize', 'xmltable', 'year', 'yes', 'zone',
]);
export function quoteIdentifier(name) {
    const lowerName = name.toLowerCase();
    if (RESERVED_WORDS.has(lowerName)) {
        return `"${name}"`;
    }
    if (name !== lowerName || /^[0-9]/.test(name)) {
        return `"${name}"`;
    }
    if (!/^[a-z_][a-z0-9_]*$/.test(name)) {
        return `"${name}"`;
    }
    return name;
}
function quoteColumnRef(name) {
    const lowerName = name.toLowerCase();
    if (RESERVED_WORDS.has(lowerName)) {
        return `"${name}"`;
    }
    if (!/^[a-z_][a-z0-9_]*$/.test(name)) {
        return `"${name}"`;
    }
    return name;
}
export function generateExtensionSQL(extensionName) {
    const quotedName = extensionName.includes('-') ? `"${extensionName}"` : extensionName;
    return `CREATE EXTENSION IF NOT EXISTS ${quotedName};`;
}
export function generateEnumSQL(enumInfo) {
    const quotedName = quoteIdentifier(enumInfo.name);
    const quotedValues = enumInfo.values.map(v => `'${v.replace(/'/g, "''")}'`).join(', ');
    return `CREATE TYPE ${quotedName} AS ENUM (${quotedValues});`;
}
export function generateDomainSQL(domain) {
    const parts = [];
    parts.push(`CREATE DOMAIN ${quoteIdentifier(domain.name)} AS ${domain.baseType}`);
    if (domain.defaultValue) {
        parts.push(`DEFAULT ${domain.defaultValue}`);
    }
    if (domain.isNotNull) {
        parts.push('NOT NULL');
    }
    if (domain.checkExpression) {
        const check = domain.checkExpression.trim();
        if (check.startsWith('(') && check.endsWith(')')) {
            parts.push(`CHECK ${check}`);
        }
        else {
            parts.push(`CHECK (${check})`);
        }
    }
    return parts.join('\n    ') + ';';
}
export function generateCompositeTypeSQL(compositeType) {
    const lines = [];
    lines.push(`CREATE TYPE ${quoteIdentifier(compositeType.name)} AS (`);
    const attrLines = compositeType.attributes.map((attr, idx) => {
        const isLast = idx === compositeType.attributes.length - 1;
        return `    ${quoteIdentifier(attr.name).padEnd(20)} ${attr.type}${isLast ? '' : ','}`;
    });
    lines.push(...attrLines);
    lines.push(');');
    return lines.join('\n');
}
export function generateSequenceSQL(seq) {
    const parts = [];
    parts.push(`CREATE SEQUENCE ${quoteIdentifier(seq.name)}`);
    if (seq.dataType && seq.dataType !== 'bigint') {
        parts.push(`AS ${seq.dataType}`);
    }
    if (seq.start !== undefined && seq.start !== 1) {
        parts.push(`START ${seq.start}`);
    }
    if (seq.increment !== undefined && seq.increment !== 1) {
        parts.push(`INCREMENT ${seq.increment}`);
    }
    if (seq.minValue !== undefined && seq.minValue !== null) {
        parts.push(`MINVALUE ${seq.minValue}`);
    }
    else if (seq.minValue === null) {
        parts.push('NO MINVALUE');
    }
    if (seq.maxValue !== undefined && seq.maxValue !== null) {
        parts.push(`MAXVALUE ${seq.maxValue}`);
    }
    else if (seq.maxValue === null) {
        parts.push('NO MAXVALUE');
    }
    if (seq.cache !== undefined && seq.cache !== 1) {
        parts.push(`CACHE ${seq.cache}`);
    }
    if (seq.cycle) {
        parts.push('CYCLE');
    }
    if (seq.ownedBy) {
        parts.push(`OWNED BY ${seq.ownedBy}`);
    }
    return parts.join(' ') + ';';
}
export function generateTableSQL(table, options = {}) {
    const { includeConstraints = true } = options;
    const lines = [];
    lines.push(`CREATE TABLE ${quoteIdentifier(table.name)} (`);
    const columnLines = [];
    for (const col of table.columns) {
        columnLines.push(generateColumnSQL(col));
    }
    if (includeConstraints && table.constraints) {
        for (const constraint of table.constraints) {
            const constraintSQL = generateInlineConstraintSQL(constraint);
            if (constraintSQL) {
                columnLines.push(constraintSQL);
            }
        }
    }
    lines.push(columnLines.map((l, i) => {
        const isLast = i === columnLines.length - 1;
        return `    ${l}${isLast ? '' : ','}`;
    }).join('\n'));
    if (table.isPartitioned && table.partitionType && table.partitionKey) {
        lines.push(`) PARTITION BY ${table.partitionType.toUpperCase()} (${table.partitionKey});`);
    }
    else {
        lines.push(');');
    }
    return lines.join('\n');
}
function generateColumnSQL(col) {
    const parts = [];
    parts.push(`${quoteIdentifier(col.name).padEnd(28)}${col.dataType}`);
    if (col.dataType.endsWith('[]')) {
    }
    if (col.isGenerated && col.generationExpression) {
        parts.push(`GENERATED ALWAYS AS (${col.generationExpression}) STORED`);
        return parts.join(' ');
    }
    if (col.identityGeneration) {
        parts.push(`GENERATED ${col.identityGeneration} AS IDENTITY`);
    }
    if (!col.isNullable && !col.isPrimaryKey && !col.identityGeneration) {
        parts.push('NOT NULL');
    }
    if (col.defaultValue !== null && col.defaultValue !== undefined && !col.isGenerated) {
        parts.push(`DEFAULT ${col.defaultValue}`);
    }
    if (col.isUnique && !col.isPrimaryKey) {
        parts.push('UNIQUE');
    }
    if (col.references) {
        const ref = col.references;
        let refStr = `REFERENCES ${quoteIdentifier(ref.table)}(${quoteIdentifier(ref.column)})`;
        if (ref.onDelete && ref.onDelete !== 'NO ACTION') {
            refStr += ` ON DELETE ${ref.onDelete}`;
        }
        if (ref.onUpdate && ref.onUpdate !== 'NO ACTION') {
            refStr += ` ON UPDATE ${ref.onUpdate}`;
        }
        parts.push(refStr);
    }
    if (col.check) {
        parts.push(`CHECK (${col.check})`);
    }
    return parts.join(' ');
}
function generateInlineConstraintSQL(constraint) {
    if (constraint.definition) {
        const def = constraint.definition.trim();
        if (def.toUpperCase().startsWith('CONSTRAINT')) {
            return def;
        }
        if (constraint.name) {
            return `CONSTRAINT ${quoteIdentifier(constraint.name)} ${def}`;
        }
        return def;
    }
    const parts = [];
    if (constraint.name) {
        parts.push(`CONSTRAINT ${quoteIdentifier(constraint.name)}`);
    }
    switch (constraint.type) {
        case 'PRIMARY KEY':
            if (constraint.columns && constraint.columns.length > 0) {
                parts.push(`PRIMARY KEY (${constraint.columns.map(c => quoteIdentifier(c)).join(', ')})`);
            }
            else {
                return null;
            }
            break;
        case 'UNIQUE':
            if (constraint.columns && constraint.columns.length > 0) {
                parts.push(`UNIQUE (${constraint.columns.map(c => quoteIdentifier(c)).join(', ')})`);
            }
            else {
                return null;
            }
            break;
        case 'FOREIGN KEY':
            if (constraint.columns && constraint.referencedTable && constraint.referencedColumns) {
                parts.push(`FOREIGN KEY (${constraint.columns.map(c => quoteIdentifier(c)).join(', ')})`);
                parts.push(`REFERENCES ${quoteIdentifier(constraint.referencedTable)}(${constraint.referencedColumns.map(c => quoteIdentifier(c)).join(', ')})`);
            }
            else {
                return null;
            }
            break;
        case 'CHECK':
            if (constraint.checkExpression) {
                parts.push(`CHECK (${constraint.checkExpression})`);
            }
            else {
                return null;
            }
            break;
        case 'EXCLUDE':
            return null;
        default:
            return null;
    }
    return parts.join(' ');
}
export function generatePartitionSQL(partition) {
    const parts = [];
    parts.push(`CREATE TABLE ${quoteIdentifier(partition.name)} PARTITION OF ${quoteIdentifier(partition.parentTable)}`);
    if (partition.partitionBound) {
        const bound = partition.partitionBound.trim();
        if (bound.toUpperCase().startsWith('FOR VALUES') || bound.toUpperCase() === 'DEFAULT') {
            parts.push(bound);
        }
        else {
            parts.push(`FOR VALUES ${bound}`);
        }
    }
    return parts.join(' ') + ';';
}
export function generateIndexSQL(index, tableName) {
    if (index.definition) {
        let def = index.definition.trim();
        if (!def.endsWith(';')) {
            def += ';';
        }
        return def;
    }
    const parts = [];
    parts.push('CREATE');
    if (index.isUnique) {
        parts.push('UNIQUE');
    }
    parts.push('INDEX');
    parts.push(quoteIdentifier(index.name));
    parts.push('ON');
    parts.push(quoteIdentifier(tableName));
    if (index.type && index.type.toLowerCase() !== 'btree') {
        parts.push(`USING ${index.type.toUpperCase()}`);
    }
    if (index.expression) {
        parts.push(`(${index.expression})`);
    }
    else if (index.columns && Array.isArray(index.columns) && index.columns.length > 0) {
        const cols = index.columns.map(c => quoteColumnRef(c)).join(', ');
        parts.push(`(${cols})`);
    }
    if (index.whereClause) {
        parts.push(`WHERE ${index.whereClause}`);
    }
    return parts.join(' ') + ';';
}
export function generateAlterTableConstraintSQL(tableName, constraint) {
    const constraintDef = generateInlineConstraintSQL(constraint);
    if (!constraintDef) {
        return '';
    }
    return `ALTER TABLE ${quoteIdentifier(tableName)} ADD ${constraintDef};`;
}
export function generateFunctionSQL(func) {
    if (func.definition) {
        let def = func.definition.trim();
        if (!def.endsWith(';')) {
            def += ';';
        }
        return def;
    }
    const parts = [];
    parts.push(`CREATE OR REPLACE FUNCTION ${quoteIdentifier(func.name)}(`);
    if (func.argTypes && func.argTypes.length > 0) {
        parts.push(func.argTypes.join(', '));
    }
    parts.push(')');
    if (func.returnType) {
        parts.push(`RETURNS ${func.returnType}`);
    }
    if (func.language) {
        parts.push(`LANGUAGE ${func.language}`);
    }
    if (func.volatility) {
        parts.push(func.volatility.toUpperCase());
    }
    parts.push('AS $$ /* body not available */ $$;');
    return parts.join('\n');
}
export function generateTriggerSQL(trigger) {
    if (trigger.definition) {
        let def = trigger.definition.trim();
        if (!def.endsWith(';')) {
            def += ';';
        }
        return def;
    }
    const parts = [];
    parts.push('CREATE TRIGGER');
    parts.push(quoteIdentifier(trigger.name));
    if (trigger.timing) {
        parts.push(trigger.timing.toUpperCase());
    }
    if (trigger.event) {
        parts.push(trigger.event.toUpperCase());
    }
    parts.push('ON');
    parts.push(quoteIdentifier(trigger.tableName));
    parts.push('FOR EACH ROW');
    parts.push('EXECUTE FUNCTION');
    parts.push(`${quoteIdentifier(trigger.functionName)}()`);
    return parts.join(' ') + ';';
}
export function generateCommentSQL(comment) {
    const quotedComment = comment.comment.replace(/'/g, "''");
    switch (comment.objectType.toUpperCase()) {
        case 'TABLE':
            return `COMMENT ON TABLE ${quoteIdentifier(comment.objectName)} IS '${quotedComment}';`;
        case 'COLUMN':
            return `COMMENT ON COLUMN ${quoteIdentifier(comment.objectName)}.${quoteIdentifier(comment.subObjectName || '')} IS '${quotedComment}';`;
        case 'INDEX':
            return `COMMENT ON INDEX ${quoteIdentifier(comment.objectName)} IS '${quotedComment}';`;
        case 'FUNCTION':
        case 'PROCEDURE':
            return `COMMENT ON FUNCTION ${quoteIdentifier(comment.objectName)} IS '${quotedComment}';`;
        case 'TRIGGER':
            return `COMMENT ON TRIGGER ${quoteIdentifier(comment.objectName)} ON ${quoteIdentifier(comment.subObjectName || '')} IS '${quotedComment}';`;
        case 'SEQUENCE':
            return `COMMENT ON SEQUENCE ${quoteIdentifier(comment.objectName)} IS '${quotedComment}';`;
        case 'TYPE':
            return `COMMENT ON TYPE ${quoteIdentifier(comment.objectName)} IS '${quotedComment}';`;
        case 'DOMAIN':
            return `COMMENT ON DOMAIN ${quoteIdentifier(comment.objectName)} IS '${quotedComment}';`;
        default:
            return `COMMENT ON ${comment.objectType.toUpperCase()} ${quoteIdentifier(comment.objectName)} IS '${quotedComment}';`;
    }
}
export function generateFullSchemaSQL(schema, options = {}) {
    const { includeExtensions = true, includeEnums = true, includeDomains = true, includeCompositeTypes = true, includeSequences = true, includeTables = true, includePartitions = true, includeIndexes = true, includeConstraints = true, includeFunctions = true, includeTriggers = true, headerComment, } = options;
    const sections = [];
    if (headerComment) {
        sections.push(`-- ${headerComment}\n`);
    }
    if (includeExtensions && schema.extensions && schema.extensions.length > 0) {
        sections.push('-- Extensions');
        for (const ext of schema.extensions) {
            sections.push(generateExtensionSQL(ext));
        }
        sections.push('');
    }
    if (includeEnums && schema.enums && schema.enums.length > 0) {
        sections.push('-- Enums');
        for (const enumInfo of schema.enums) {
            sections.push(generateEnumSQL(enumInfo));
        }
        sections.push('');
    }
    if (includeDomains && schema.domains && schema.domains.length > 0) {
        sections.push('-- Domains');
        for (const domain of schema.domains) {
            sections.push(generateDomainSQL(domain));
        }
        sections.push('');
    }
    if (includeCompositeTypes && schema.compositeTypes && schema.compositeTypes.length > 0) {
        sections.push('-- Composite Types');
        for (const type of schema.compositeTypes) {
            sections.push(generateCompositeTypeSQL(type));
        }
        sections.push('');
    }
    if (includeSequences && schema.sequences && schema.sequences.length > 0) {
        sections.push('-- Sequences');
        for (const seq of schema.sequences) {
            sections.push(generateSequenceSQL(seq));
        }
        sections.push('');
    }
    if (includeTables && schema.tables && schema.tables.length > 0) {
        sections.push('-- Tables');
        for (const table of schema.tables) {
            sections.push(generateTableSQL(table, { includeConstraints }));
            sections.push('');
        }
    }
    if (includePartitions && schema.partitions && schema.partitions.length > 0) {
        sections.push('-- Partitions');
        for (const partition of schema.partitions) {
            sections.push(generatePartitionSQL(partition));
        }
        sections.push('');
    }
    if (includeIndexes && schema.tables) {
        const indexLines = [];
        for (const table of schema.tables) {
            if (table.indexes && table.indexes.length > 0) {
                for (const index of table.indexes) {
                    if (!index.isPrimary) {
                        indexLines.push(generateIndexSQL(index, table.name));
                    }
                }
            }
        }
        if (indexLines.length > 0) {
            sections.push('-- Indexes');
            sections.push(indexLines.join('\n'));
            sections.push('');
        }
    }
    if (includeFunctions && schema.functions && schema.functions.length > 0) {
        sections.push('-- Functions');
        for (const func of schema.functions) {
            sections.push(generateFunctionSQL(func));
            sections.push('');
        }
    }
    if (includeTriggers && schema.triggers && schema.triggers.length > 0) {
        sections.push('-- Triggers');
        for (const trigger of schema.triggers) {
            sections.push(generateTriggerSQL(trigger));
        }
        sections.push('');
    }
    return sections.join('\n').trim() + '\n';
}
