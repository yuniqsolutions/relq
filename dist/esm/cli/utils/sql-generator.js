const RESERVED_WORDS = new Set([
    'order', 'check', 'table', 'index', 'column', 'constraint',
    'primary', 'foreign', 'key', 'references', 'unique', 'default',
    'null', 'not', 'and', 'or', 'in', 'like', 'between', 'case',
    'when', 'then', 'else', 'end', 'select', 'from', 'where', 'group',
    'having', 'by', 'limit', 'offset', 'join', 'left', 'right',
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
    'partition', 'passing', 'placing', 'plans', 'policy',
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
function parseFKDefinition(definition) {
    if (!definition)
        return null;
    const constraintNameMatch = definition.match(/^CONSTRAINT\s+"?([^"]+)"?\s+/i);
    const constraintName = constraintNameMatch?.[1];
    const fkPart = constraintName
        ? definition.substring(constraintNameMatch[0].length)
        : definition;
    const fkMatch = fkPart.match(/FOREIGN\s+KEY\s*\(\s*([^)]+)\s*\)\s*REFERENCES\s+"?([^"\s(]+)"?\s*(?:\(\s*([^)]+)\s*\))?/i);
    if (!fkMatch)
        return null;
    const parseColumnList = (str) => {
        return str.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
    };
    const columns = parseColumnList(fkMatch[1]);
    const referencedTable = fkMatch[2].replace(/^"|"$/g, '');
    const referencedColumns = fkMatch[3] ? parseColumnList(fkMatch[3]) : ['id'];
    const onDeleteMatch = definition.match(/ON\s+DELETE\s+(CASCADE|SET\s+NULL|SET\s+DEFAULT|RESTRICT|NO\s+ACTION)/i);
    const onUpdateMatch = definition.match(/ON\s+UPDATE\s+(CASCADE|SET\s+NULL|SET\s+DEFAULT|RESTRICT|NO\s+ACTION)/i);
    return {
        constraintName,
        columns,
        referencedTable,
        referencedColumns,
        onDelete: onDeleteMatch?.[1]?.toUpperCase().replace(/\s+/g, ' '),
        onUpdate: onUpdateMatch?.[1]?.toUpperCase().replace(/\s+/g, ' '),
    };
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
const PG_TYPE_MAP = {
    'int2': 'smallint',
    'int4': 'integer',
    'int8': 'bigint',
    'float4': 'real',
    'float8': 'double precision',
    'bool': 'boolean',
    'timestamptz': 'timestamp with time zone',
    'timetz': 'time with time zone',
    'bpchar': 'character',
    'varbit': 'bit varying',
};
function normalizePgType(pgType) {
    if (pgType.startsWith('_')) {
        const baseType = pgType.slice(1);
        const friendlyBase = PG_TYPE_MAP[baseType] || baseType;
        return `${friendlyBase}[]`;
    }
    return PG_TYPE_MAP[pgType] || pgType;
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
    const { includeConstraints = true, ifNotExists = false } = options;
    const lines = [];
    const ifNotExistsClause = ifNotExists ? 'IF NOT EXISTS ' : '';
    lines.push(`-- DEBUG: generateTableSQL running for ${table.name}`);
    lines.push(`CREATE TABLE ${ifNotExistsClause}${quoteIdentifier(table.name)} (`);
    let singleColumnPkName = null;
    let pkConstraintIndex = -1;
    const compositeUniqueColumns = new Set();
    const inlineFKs = new Map();
    const skipFKIndices = new Set();
    if (table.constraints) {
        const pkIndex = table.constraints.findIndex(c => c.type === 'PRIMARY KEY');
        if (pkIndex !== -1) {
            const pkConstraint = table.constraints[pkIndex];
            pkConstraintIndex = pkIndex;
            if (pkConstraint.columns && pkConstraint.columns.length === 1) {
                singleColumnPkName = pkConstraint.columns[0];
            }
            else if (pkConstraint.definition) {
                const match = pkConstraint.definition.match(/PRIMARY\s+KEY\s*\(\s*"?([^",\s)]+)"?\s*\)/i);
                if (match && !pkConstraint.definition.includes(',')) {
                    singleColumnPkName = match[1];
                }
            }
        }
        for (const constraint of table.constraints) {
            if (constraint.type === 'UNIQUE') {
                let cols = [];
                if (constraint.columns && constraint.columns.length > 0) {
                    if (Array.isArray(constraint.columns)) {
                        cols = constraint.columns;
                    }
                    else if (typeof constraint.columns === 'string') {
                        const str = constraint.columns;
                        if (str.startsWith('{') && str.endsWith('}')) {
                            cols = str.slice(1, -1).split(',').map(c => c.trim().replace(/^"|"$/g, ''));
                        }
                    }
                }
                else if (constraint.definition) {
                    const match = constraint.definition.match(/UNIQUE\s*\(([^)]+)\)/i);
                    if (match) {
                        cols = match[1].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
                    }
                }
                if (cols.length > 1) {
                    for (const col of cols) {
                        compositeUniqueColumns.add(col);
                    }
                }
            }
        }
        table.constraints.forEach((constraint, index) => {
            if (constraint.type === 'FOREIGN KEY') {
                let fkColumns = constraint.columns;
                let refTable = constraint.referencedTable || constraint.references?.table;
                let refColumns = constraint.referencedColumns || constraint.references?.columns;
                let onDelete = constraint.onDelete || constraint.references?.onDelete;
                let onUpdate = constraint.onUpdate || constraint.references?.onUpdate;
                let constraintName = constraint.name;
                if (!refTable && constraint.definition) {
                    const parsed = parseFKDefinition(constraint.definition);
                    if (parsed) {
                        fkColumns = parsed.columns;
                        refTable = parsed.referencedTable;
                        refColumns = parsed.referencedColumns;
                        onDelete = parsed.onDelete;
                        onUpdate = parsed.onUpdate;
                        if (!constraintName) {
                            constraintName = parsed.constraintName;
                        }
                    }
                }
                const isSingleColumn = fkColumns && fkColumns.length === 1;
                let hasExplicitName = false;
                if (constraintName && fkColumns && fkColumns.length > 0) {
                    const colName = fkColumns[0];
                    const expectedAutoName = `${table.name}_${colName}_fkey`;
                    hasExplicitName = constraintName.toLowerCase() !== expectedAutoName.toLowerCase();
                }
                if (isSingleColumn && refTable) {
                    const colName = fkColumns[0];
                    inlineFKs.set(colName, {
                        table: refTable,
                        column: refColumns?.[0],
                        onDelete: onDelete,
                        onUpdate: onUpdate,
                        constraintName: hasExplicitName ? constraintName : undefined,
                    });
                    skipFKIndices.add(index);
                }
            }
        });
    }
    const columnLines = [];
    for (const col of table.columns) {
        const isInlinePk = singleColumnPkName === col.name;
        const skipInlineUnique = compositeUniqueColumns.has(col.name);
        const inlineFKInfo = inlineFKs.get(col.name);
        columnLines.push(generateColumnSQL(col, { inlinePrimaryKey: isInlinePk, skipInlineUnique, inlineForeignKey: inlineFKInfo }));
    }
    if (includeConstraints && table.constraints) {
        for (let i = 0; i < table.constraints.length; i++) {
            const constraint = table.constraints[i];
            if (constraint.type === 'PRIMARY KEY' && singleColumnPkName) {
                continue;
            }
            if (constraint.type === 'FOREIGN KEY' && skipFKIndices.has(i)) {
                continue;
            }
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
function generateColumnSQL(col, options = {}) {
    const { inlinePrimaryKey = false, skipInlineUnique = false, inlineForeignKey } = options;
    const parts = [];
    let normalizedType = normalizePgType(col.dataType);
    const baseType = normalizedType.replace('[]', '').toLowerCase();
    if ((baseType === 'varchar' || baseType === 'character varying') && col.maxLength) {
        normalizedType = `varchar(${col.maxLength})${normalizedType.endsWith('[]') ? '[]' : ''}`;
    }
    else if ((baseType === 'char' || baseType === 'character' || baseType === 'bpchar') && col.maxLength) {
        normalizedType = `char(${col.maxLength})${normalizedType.endsWith('[]') ? '[]' : ''}`;
    }
    else if (baseType === 'numeric' && col.precision) {
        const precisionStr = col.scale ? `${col.precision},${col.scale}` : `${col.precision}`;
        normalizedType = `numeric(${precisionStr})${normalizedType.endsWith('[]') ? '[]' : ''}`;
    }
    parts.push(`${quoteIdentifier(col.name).padEnd(28)}${normalizedType}`);
    if (col.dataType.endsWith('[]')) {
    }
    if (col.isGenerated && col.generationExpression) {
        parts.push(`GENERATED ALWAYS AS (${col.generationExpression}) STORED`);
        return parts.join(' ');
    }
    if (col.identityGeneration) {
        parts.push(`GENERATED ${col.identityGeneration} AS IDENTITY`);
    }
    if (!col.isNullable && !col.identityGeneration && !inlinePrimaryKey) {
        parts.push('NOT NULL');
    }
    if (col.defaultValue !== null && col.defaultValue !== undefined && !col.isGenerated) {
        parts.push(`DEFAULT ${col.defaultValue}`);
    }
    if (inlinePrimaryKey) {
        parts.push('PRIMARY KEY');
    }
    if (col.isUnique && !col.isPrimaryKey && !inlinePrimaryKey && !skipInlineUnique) {
        parts.push('UNIQUE');
    }
    if (inlineForeignKey) {
        let refPart = '';
        if (inlineForeignKey.constraintName) {
            refPart += `CONSTRAINT ${quoteIdentifier(inlineForeignKey.constraintName)} `;
        }
        refPart += `REFERENCES ${quoteIdentifier(inlineForeignKey.table)}`;
        if (inlineForeignKey.column && inlineForeignKey.column.toLowerCase() !== 'id') {
            refPart += `(${quoteIdentifier(inlineForeignKey.column)})`;
        }
        if (inlineForeignKey.onDelete && inlineForeignKey.onDelete !== 'NO ACTION') {
            refPart += ` ON DELETE ${inlineForeignKey.onDelete}`;
        }
        if (inlineForeignKey.onUpdate && inlineForeignKey.onUpdate !== 'NO ACTION') {
            refPart += ` ON UPDATE ${inlineForeignKey.onUpdate}`;
        }
        parts.push(refPart);
    }
    if (col.check) {
        parts.push(`CHECK (${col.check})`);
    }
    return parts.join(' ');
}
function unquoteIdentifiers(sql) {
    return sql.replace(/"([a-z_][a-z0-9_]*)"/g, (match, identifier) => {
        if (RESERVED_WORDS.has(identifier.toLowerCase())) {
            return match;
        }
        return identifier;
    });
}
function generateInlineConstraintSQL(constraint) {
    if (constraint.definition) {
        let def = constraint.definition.trim();
        def = unquoteIdentifiers(def);
        if (constraint.type === 'PRIMARY KEY') {
            const pkMatch = def.match(/PRIMARY\s+KEY\s*\([^)]+\)/i);
            if (pkMatch) {
                return pkMatch[0];
            }
        }
        if (def.toUpperCase().startsWith('CONSTRAINT')) {
            return def;
        }
        if (constraint.name && constraint.type !== 'PRIMARY KEY') {
            return `CONSTRAINT ${quoteIdentifier(constraint.name)} ${def}`;
        }
        return def;
    }
    const parts = [];
    if (constraint.name && constraint.type !== 'PRIMARY KEY') {
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
            const refTable = constraint.referencedTable || constraint.references?.table;
            const refColumns = constraint.referencedColumns || constraint.references?.columns;
            const onDelete = constraint.onDelete || constraint.references?.onDelete;
            const onUpdate = constraint.onUpdate || constraint.references?.onUpdate;
            if (constraint.columns && refTable && refColumns) {
                parts.push(`FOREIGN KEY (${constraint.columns.map(c => quoteIdentifier(c)).join(', ')})`);
                let refPart = `REFERENCES ${quoteIdentifier(refTable)}(${refColumns.map((c) => quoteIdentifier(c)).join(', ')})`;
                if (onDelete && onDelete !== 'NO ACTION') {
                    refPart += ` ON DELETE ${onDelete}`;
                }
                if (onUpdate && onUpdate !== 'NO ACTION') {
                    refPart += ` ON UPDATE ${onUpdate}`;
                }
                parts.push(refPart);
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
export function generateIndexSQL(index, tableName, options = {}) {
    const parts = [];
    parts.push('CREATE');
    if (index.isUnique) {
        parts.push('UNIQUE');
    }
    parts.push('INDEX');
    if (options.ifNotExists) {
        parts.push('IF NOT EXISTS');
    }
    parts.push(quoteIdentifier(index.name));
    parts.push('ON');
    if (options.tableOnly) {
        parts.push('ONLY');
    }
    if (options.includeSchema && options.schema) {
        parts.push(`${quoteIdentifier(options.schema)}.${quoteIdentifier(tableName)}`);
    }
    else {
        parts.push(quoteIdentifier(tableName));
    }
    if (index.type && index.type.toLowerCase() !== 'btree') {
        parts.push(`USING ${index.type.toLowerCase()}`);
    }
    let columnSpec = null;
    if (index.definition) {
        const defMatch = index.definition.match(/\bON\s+(?:ONLY\s+)?[^\s(]+\s+(?:USING\s+\w+\s+)?\(([^)]+)\)/i);
        if (defMatch) {
            columnSpec = defMatch[1].trim();
        }
    }
    if (columnSpec) {
        parts.push(`(${columnSpec})`);
    }
    else if (index.expression) {
        parts.push(`(${index.expression})`);
    }
    else if (index.columns) {
        let columnsArray;
        if (Array.isArray(index.columns)) {
            columnsArray = index.columns;
        }
        else if (typeof index.columns === 'string') {
            const str = index.columns;
            if (str.startsWith('{') && str.endsWith('}')) {
                columnsArray = str.slice(1, -1).split(',').map(c => c.trim().replace(/^"|"$/g, ''));
            }
            else {
                columnsArray = [str];
            }
        }
        else {
            columnsArray = [];
        }
        if (columnsArray.length > 0) {
            const cols = columnsArray.map(c => quoteColumnRef(c)).join(', ');
            parts.push(`(${cols})`);
        }
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
    const { includeExtensions = true, includeEnums = true, includeDomains = true, includeCompositeTypes = true, includeSequences = true, includeTables = true, includePartitions = true, includeIndexes = true, includeConstraints = true, includeFunctions = true, includeTriggers = true, includeComments = true, headerComment, ifNotExists = false, } = options;
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
        const partitionsByParent = new Map();
        if (includePartitions && schema.partitions) {
            for (const partition of schema.partitions) {
                const parent = partition.parentTable;
                if (!partitionsByParent.has(parent)) {
                    partitionsByParent.set(parent, []);
                }
                partitionsByParent.get(parent).push(partition);
            }
        }
        for (const table of schema.tables) {
            const tableSection = [];
            tableSection.push('-- ==================================================================');
            tableSection.push(`--  TABLE: ${table.name}`);
            tableSection.push('-- ==================================================================');
            tableSection.push('');
            tableSection.push('-- Table');
            tableSection.push(generateTableSQL(table, { includeConstraints, ifNotExists }));
            const tablePartitions = partitionsByParent.get(table.name);
            if (tablePartitions && tablePartitions.length > 0) {
                tableSection.push('');
                tableSection.push(`-- Partitions for ${table.name}`);
                for (const partition of tablePartitions) {
                    tableSection.push(generatePartitionSQL(partition));
                }
            }
            if (includeIndexes && table.indexes && table.indexes.length > 0) {
                const uniqueConstraintNames = new Set((table.constraints || [])
                    .filter(c => c.type === 'UNIQUE')
                    .map(c => c.name));
                const indexLines = [];
                for (const index of table.indexes) {
                    if (index.isPrimary)
                        continue;
                    if (index.isUnique && uniqueConstraintNames.has(index.name))
                        continue;
                    if (index.isUnique && (index.name.endsWith('_key') ||
                        index.name.startsWith('unique_') ||
                        uniqueConstraintNames.has(index.name.replace(/_key$/, ''))))
                        continue;
                    indexLines.push(generateIndexSQL(index, table.name, { ifNotExists }));
                }
                if (indexLines.length > 0) {
                    tableSection.push('');
                    tableSection.push(`-- Indexes for ${table.name}`);
                    tableSection.push(indexLines.join('\n'));
                }
            }
            if (includeComments) {
                const commentLines = [];
                if (table.comment) {
                    commentLines.push(generateCommentSQL({
                        objectType: 'table',
                        objectName: table.name,
                        comment: table.comment,
                    }));
                }
                if (table.columns) {
                    for (const col of table.columns) {
                        if (col.comment) {
                            commentLines.push(generateCommentSQL({
                                objectType: 'column',
                                objectName: table.name,
                                subObjectName: col.name,
                                comment: col.comment,
                            }));
                        }
                    }
                }
                if (table.indexes) {
                    for (const idx of table.indexes) {
                        if (idx.comment) {
                            commentLines.push(generateCommentSQL({
                                objectType: 'index',
                                objectName: idx.name,
                                comment: idx.comment,
                            }));
                        }
                    }
                }
                if (commentLines.length > 0) {
                    tableSection.push('');
                    tableSection.push(`-- Comments for ${table.name}`);
                    tableSection.push(commentLines.join('\n'));
                }
            }
            sections.push(tableSection.join('\n'));
            sections.push('');
            sections.push('');
            sections.push('');
        }
    }
    if (includeFunctions && schema.functions && schema.functions.length > 0) {
        sections.push('-- ==================================================================');
        sections.push('--  FUNCTIONS');
        sections.push('-- ==================================================================');
        sections.push('');
        for (const func of schema.functions) {
            sections.push(generateFunctionSQL(func));
            sections.push('');
        }
    }
    if (includeTriggers && schema.triggers && schema.triggers.length > 0) {
        sections.push('-- ==================================================================');
        sections.push('--  TRIGGERS');
        sections.push('-- ==================================================================');
        sections.push('');
        for (const trigger of schema.triggers) {
            sections.push(generateTriggerSQL(trigger));
        }
        sections.push('');
    }
    return sections.join('\n').trim() + '\n';
}
