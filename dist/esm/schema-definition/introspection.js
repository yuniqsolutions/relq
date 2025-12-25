import { RelqQueryError } from "../errors/relq-errors.js";
const SQL_TYPE_MAP = {
    'INTEGER': 'integer()',
    'INT': 'integer()',
    'INT4': 'integer()',
    'SMALLINT': 'smallint()',
    'INT2': 'smallint()',
    'BIGINT': 'bigint()',
    'INT8': 'bigint()',
    'SERIAL': 'serial()',
    'SERIAL4': 'serial()',
    'SMALLSERIAL': 'smallserial()',
    'SERIAL2': 'smallserial()',
    'BIGSERIAL': 'bigserial()',
    'SERIAL8': 'bigserial()',
    'REAL': 'real()',
    'FLOAT4': 'real()',
    'DOUBLE PRECISION': 'doublePrecision()',
    'FLOAT8': 'doublePrecision()',
    'MONEY': 'money()',
    'TEXT': 'text()',
    'BYTEA': 'bytea()',
    'BOOLEAN': 'boolean()',
    'BOOL': 'boolean()',
    'DATE': 'date()',
    'POINT': 'point()',
    'LINE': 'line()',
    'LSEG': 'lseg()',
    'BOX': 'box()',
    'PATH': 'path()',
    'POLYGON': 'polygon()',
    'CIRCLE': 'circle()',
    'CIDR': 'cidr()',
    'INET': 'inet()',
    'MACADDR': 'macaddr()',
    'MACADDR8': 'macaddr8()',
    'TSVECTOR': 'tsvector()',
    'TSQUERY': 'tsquery()',
    'UUID': 'uuid()',
    'XML': 'xml()',
    'JSON': 'json()',
    'JSONB': 'jsonb()',
    'INT4RANGE': 'int4range()',
    'INT8RANGE': 'int8range()',
    'NUMRANGE': 'numrange()',
    'TSRANGE': 'tsrange()',
    'TSTZRANGE': 'tstzrange()',
    'DATERANGE': 'daterange()',
    'INT4MULTIRANGE': 'int4multirange()',
    'INT8MULTIRANGE': 'int8multirange()',
    'NUMMULTIRANGE': 'nummultirange()',
    'TSMULTIRANGE': 'tsmultirange()',
    'TSTZMULTIRANGE': 'tstzmultirange()',
    'DATEMULTIRANGE': 'datemultirange()',
    'OID': 'oid()',
    'REGCLASS': 'regclass()',
    'REGPROC': 'regproc()',
    'REGTYPE': 'regtype()',
    'PG_LSN': 'pgLsn()',
    'PG_SNAPSHOT': 'pgSnapshot()',
};
function stripQuotes(str) {
    if ((str.startsWith('"') && str.endsWith('"')) ||
        (str.startsWith("'") && str.endsWith("'"))) {
        return str.slice(1, -1);
    }
    return str;
}
function parseIdentifier(token) {
    return stripQuotes(token).toLowerCase();
}
function tokenize(sql) {
    const tokens = [];
    let current = '';
    let inString = false;
    let stringChar = '';
    let parenDepth = 0;
    let i = 0;
    while (i < sql.length) {
        const char = sql[i];
        if (inString) {
            current += char;
            if (char === stringChar && sql[i + 1] !== stringChar) {
                inString = false;
            }
            else if (char === stringChar && sql[i + 1] === stringChar) {
                current += sql[i + 1];
                i++;
            }
        }
        else if (char === "'" || char === '"') {
            inString = true;
            stringChar = char;
            current += char;
        }
        else if (char === '(') {
            if (parenDepth === 0 && current.trim()) {
                tokens.push(current.trim());
                current = '';
            }
            parenDepth++;
            current += char;
        }
        else if (char === ')') {
            current += char;
            parenDepth--;
            if (parenDepth === 0) {
                tokens.push(current.trim());
                current = '';
            }
        }
        else if (char === ',' && parenDepth <= 1) {
            if (current.trim()) {
                tokens.push(current.trim());
            }
            current = '';
        }
        else if (/\s/.test(char) && parenDepth === 0) {
            if (current.trim()) {
                tokens.push(current.trim());
                current = '';
            }
        }
        else {
            current += char;
        }
        i++;
    }
    if (current.trim()) {
        tokens.push(current.trim());
    }
    return tokens;
}
function parseType(typeStr) {
    let cleanType = typeStr.toUpperCase().trim();
    let isArray = false;
    let dimensions = 0;
    const arrayMatch = cleanType.match(/^(.+?)((?:\[\])+)$/);
    if (arrayMatch) {
        cleanType = arrayMatch[1];
        dimensions = arrayMatch[2].length / 2;
        isArray = true;
    }
    if (SQL_TYPE_MAP[cleanType]) {
        return { type: cleanType, tsCode: SQL_TYPE_MAP[cleanType], isArray, dimensions };
    }
    const varcharMatch = cleanType.match(/^(?:VARCHAR|CHARACTER VARYING)(?:\((\d+)\))?$/);
    if (varcharMatch) {
        const len = varcharMatch[1];
        return { type: cleanType, tsCode: len ? `varchar(${len})` : 'varchar()', isArray, dimensions };
    }
    const charMatch = cleanType.match(/^(?:CHAR|CHARACTER)(?:\((\d+)\))?$/);
    if (charMatch) {
        const len = charMatch[1];
        return { type: cleanType, tsCode: len ? `char(${len})` : 'char()', isArray, dimensions };
    }
    const numericMatch = cleanType.match(/^(?:NUMERIC|DECIMAL)(?:\((\d+)(?:,\s*(\d+))?\))?$/);
    if (numericMatch) {
        const precision = numericMatch[1];
        const scale = numericMatch[2];
        if (precision && scale) {
            return { type: cleanType, tsCode: `decimal(${precision}, ${scale})`, isArray, dimensions };
        }
        else if (precision) {
            return { type: cleanType, tsCode: `decimal(${precision})`, isArray, dimensions };
        }
        return { type: cleanType, tsCode: 'decimal()', isArray, dimensions };
    }
    const timestampMatch = cleanType.match(/^TIMESTAMP(?:\((\d+)\))?(?:\s+WITH(?:OUT)?\s+TIME\s+ZONE)?$/);
    if (timestampMatch) {
        const precision = timestampMatch[1];
        if (cleanType.includes('WITH TIME ZONE')) {
            return { type: cleanType, tsCode: precision ? `timestamptz(${precision})` : 'timestamptz()', isArray, dimensions };
        }
        return { type: cleanType, tsCode: precision ? `timestamp(${precision})` : 'timestamp()', isArray, dimensions };
    }
    const timeMatch = cleanType.match(/^TIME(?:\((\d+)\))?(?:\s+WITH(?:OUT)?\s+TIME\s+ZONE)?$/);
    if (timeMatch) {
        const precision = timeMatch[1];
        if (cleanType.includes('WITH TIME ZONE')) {
            return { type: cleanType, tsCode: precision ? `timetz(${precision})` : 'timetz()', isArray, dimensions };
        }
        return { type: cleanType, tsCode: precision ? `time(${precision})` : 'time()', isArray, dimensions };
    }
    const intervalMatch = cleanType.match(/^INTERVAL(?:\s+(.+))?$/);
    if (intervalMatch) {
        const fields = intervalMatch[1];
        return { type: cleanType, tsCode: fields ? `interval('${fields}')` : 'interval()', isArray, dimensions };
    }
    const bitMatch = cleanType.match(/^BIT(?:\s+VARYING)?(?:\((\d+)\))?$/);
    if (bitMatch) {
        const len = bitMatch[1];
        if (cleanType.includes('VARYING')) {
            return { type: cleanType, tsCode: len ? `bitVarying(${len})` : 'bitVarying()', isArray, dimensions };
        }
        return { type: cleanType, tsCode: len ? `bit(${len})` : 'bit()', isArray, dimensions };
    }
    return { type: cleanType, tsCode: `customType('${cleanType.toLowerCase()}')`, isArray, dimensions };
}
function parseColumnDefinition(columnDef) {
    const parts = columnDef.trim().split(/\s+/);
    if (parts.length < 2)
        return null;
    const name = parseIdentifier(parts[0]);
    let typeEndIndex = 1;
    let typeStr = parts[1].toUpperCase();
    if (typeStr === 'CHARACTER' && parts[2]?.toUpperCase() === 'VARYING') {
        typeStr = 'CHARACTER VARYING';
        typeEndIndex = 2;
        if (parts[3]?.startsWith('(')) {
            typeStr += parts[3];
            typeEndIndex = 3;
        }
    }
    else if (typeStr === 'DOUBLE' && parts[2]?.toUpperCase() === 'PRECISION') {
        typeStr = 'DOUBLE PRECISION';
        typeEndIndex = 2;
    }
    else if (typeStr === 'BIT' && parts[2]?.toUpperCase() === 'VARYING') {
        typeStr = 'BIT VARYING';
        typeEndIndex = 2;
        if (parts[3]?.startsWith('(')) {
            typeStr += parts[3];
            typeEndIndex = 3;
        }
    }
    else if ((typeStr === 'TIMESTAMP' || typeStr === 'TIME') && parts[2]?.toUpperCase() === 'WITH') {
        typeStr += ` WITH ${parts[3]} ${parts[4]}`;
        typeEndIndex = 4;
    }
    else if ((typeStr === 'TIMESTAMP' || typeStr === 'TIME') && parts[2]?.toUpperCase() === 'WITHOUT') {
        typeStr += ` WITHOUT ${parts[3]} ${parts[4]}`;
        typeEndIndex = 4;
    }
    const { tsCode, isArray, dimensions } = parseType(typeStr);
    const column = {
        name,
        type: tsCode,
        nullable: true,
        primaryKey: false,
        unique: false,
        array: isArray,
        arrayDimensions: dimensions,
    };
    const restParts = parts.slice(typeEndIndex + 1).join(' ').toUpperCase();
    if (restParts.includes('NOT NULL')) {
        column.nullable = false;
    }
    if (restParts.includes('PRIMARY KEY')) {
        column.primaryKey = true;
        column.nullable = false;
    }
    if (/\bUNIQUE\b/.test(restParts)) {
        column.unique = true;
    }
    const defaultMatch = columnDef.match(/DEFAULT\s+(.+?)(?:\s+(?:NOT\s+NULL|NULL|PRIMARY\s+KEY|UNIQUE|REFERENCES|CHECK|GENERATED|CONSTRAINT|$))/i);
    if (defaultMatch) {
        column.default = defaultMatch[1].trim();
    }
    const referencesMatch = columnDef.match(/REFERENCES\s+(\w+)(?:\s*\((\w+)\))?(?:\s+ON\s+DELETE\s+(\w+(?:\s+\w+)?))?(?:\s+ON\s+UPDATE\s+(\w+(?:\s+\w+)?))?/i);
    if (referencesMatch) {
        column.references = {
            table: referencesMatch[1].toLowerCase(),
            column: referencesMatch[2]?.toLowerCase() || 'id',
        };
        if (referencesMatch[3]) {
            column.references.onDelete = referencesMatch[3].toUpperCase();
        }
        if (referencesMatch[4]) {
            column.references.onUpdate = referencesMatch[4].toUpperCase();
        }
    }
    const checkMatch = columnDef.match(/CHECK\s*\((.+?)\)(?:\s|$)/i);
    if (checkMatch) {
        column.check = checkMatch[1];
    }
    const generatedMatch = columnDef.match(/GENERATED\s+ALWAYS\s+AS\s*\((.+?)\)\s*(STORED)?/i);
    if (generatedMatch) {
        column.generated = {
            expression: generatedMatch[1],
            stored: !!generatedMatch[2],
        };
    }
    return column;
}
function parseTableConstraint(constraintDef) {
    const upper = constraintDef.toUpperCase();
    let name;
    const constraintNameMatch = constraintDef.match(/CONSTRAINT\s+(\w+)\s+/i);
    if (constraintNameMatch) {
        name = constraintNameMatch[1].toLowerCase();
    }
    const pkMatch = constraintDef.match(/PRIMARY\s+KEY\s*\(([^)]+)\)/i);
    if (pkMatch) {
        const columns = pkMatch[1].split(',').map(c => parseIdentifier(c.trim()));
        return { type: 'primary_key', name, columns };
    }
    const uniqueMatch = constraintDef.match(/UNIQUE\s*\(([^)]+)\)/i);
    if (uniqueMatch) {
        const columns = uniqueMatch[1].split(',').map(c => parseIdentifier(c.trim()));
        return { type: 'unique', name, columns };
    }
    const checkMatch = constraintDef.match(/CHECK\s*\((.+)\)/i);
    if (checkMatch && !upper.includes('FOREIGN KEY')) {
        return { type: 'check', name, expression: checkMatch[1] };
    }
    const fkMatch = constraintDef.match(/FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s+(\w+)\s*\(([^)]+)\)(?:\s+ON\s+DELETE\s+(\w+(?:\s+\w+)?))?(?:\s+ON\s+UPDATE\s+(\w+(?:\s+\w+)?))?/i);
    if (fkMatch) {
        const columns = fkMatch[1].split(',').map(c => parseIdentifier(c.trim()));
        const refTable = fkMatch[2].toLowerCase();
        const refColumns = fkMatch[3].split(',').map(c => parseIdentifier(c.trim()));
        return {
            type: 'foreign_key',
            name,
            columns,
            references: { table: refTable, columns: refColumns },
            onDelete: fkMatch[4]?.toUpperCase(),
            onUpdate: fkMatch[5]?.toUpperCase(),
        };
    }
    return null;
}
export function parseCreateTable(sql) {
    const cleanSql = sql.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').trim();
    const tableMatch = cleanSql.match(/CREATE\s+(?:TEMP(?:ORARY)?\s+)?TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:(\w+)\.)?(\w+)/i);
    if (!tableMatch) {
        throw new RelqQueryError('Invalid CREATE TABLE statement', { hint: 'SQL must start with CREATE TABLE' });
    }
    const schema = tableMatch[1]?.toLowerCase();
    const tableName = tableMatch[2].toLowerCase();
    const bodyMatch = cleanSql.match(/\((.+)\)\s*(?:INHERITS|PARTITION|WITH|TABLESPACE|;|$)/is);
    if (!bodyMatch) {
        throw new RelqQueryError('Could not parse table body', { hint: 'Ensure table definition includes column list in parentheses' });
    }
    const bodyContent = bodyMatch[1];
    const definitions = splitTableBody(bodyContent);
    const table = {
        name: tableName,
        schema,
        columns: [],
        uniqueConstraints: [],
        checkConstraints: [],
        foreignKeys: [],
    };
    for (const def of definitions) {
        const trimmedDef = def.trim();
        if (!trimmedDef)
            continue;
        const upperDef = trimmedDef.toUpperCase();
        if (upperDef.startsWith('PRIMARY KEY') ||
            upperDef.startsWith('UNIQUE') ||
            upperDef.startsWith('CHECK') ||
            upperDef.startsWith('FOREIGN KEY') ||
            upperDef.startsWith('CONSTRAINT')) {
            const constraint = parseTableConstraint(trimmedDef);
            if (constraint) {
                switch (constraint.type) {
                    case 'primary_key':
                        table.primaryKey = constraint.columns;
                        break;
                    case 'unique':
                        table.uniqueConstraints.push({
                            columns: constraint.columns,
                            name: constraint.name,
                        });
                        break;
                    case 'check':
                        table.checkConstraints.push({
                            expression: constraint.expression,
                            name: constraint.name,
                        });
                        break;
                    case 'foreign_key':
                        table.foreignKeys.push({
                            columns: constraint.columns,
                            references: constraint.references,
                            onDelete: constraint.onDelete,
                            onUpdate: constraint.onUpdate,
                            name: constraint.name,
                        });
                        break;
                }
            }
        }
        else {
            const column = parseColumnDefinition(trimmedDef);
            if (column) {
                table.columns.push(column);
                if (column.primaryKey && !table.primaryKey) {
                    table.primaryKey = [column.name];
                }
            }
        }
    }
    return table;
}
function splitTableBody(body) {
    const results = [];
    let current = '';
    let parenDepth = 0;
    let inString = false;
    let stringChar = '';
    for (let i = 0; i < body.length; i++) {
        const char = body[i];
        if (inString) {
            current += char;
            if (char === stringChar && body[i + 1] !== stringChar) {
                inString = false;
            }
            else if (char === stringChar && body[i + 1] === stringChar) {
                current += body[i + 1];
                i++;
            }
        }
        else if (char === "'" || char === '"') {
            inString = true;
            stringChar = char;
            current += char;
        }
        else if (char === '(') {
            parenDepth++;
            current += char;
        }
        else if (char === ')') {
            parenDepth--;
            current += char;
        }
        else if (char === ',' && parenDepth === 0) {
            if (current.trim()) {
                results.push(current.trim());
            }
            current = '';
        }
        else {
            current += char;
        }
    }
    if (current.trim()) {
        results.push(current.trim());
    }
    return results;
}
export function generateSchemaCode(table, options) {
    const exportName = options?.exportName || toPascalCase(table.name);
    const lines = [];
    lines.push("import { defineTable } from 'relq/schema-builder';");
    lines.push("import {");
    const usedTypes = new Set();
    for (const col of table.columns) {
        const typeFunc = col.type.match(/^(\w+)/)?.[1];
        if (typeFunc) {
            usedTypes.add(typeFunc);
        }
    }
    lines.push(`  ${Array.from(usedTypes).join(', ')}`);
    lines.push("} from 'relq/schema-builder';");
    lines.push('');
    lines.push(`export const ${exportName} = defineTable('${table.name}', {`);
    for (const col of table.columns) {
        let colDef = `  ${col.name}: ${col.type}`;
        const modifiers = [];
        if (col.array) {
            modifiers.push(col.arrayDimensions > 1 ? `.array(${col.arrayDimensions})` : '.array()');
        }
        if (!col.nullable) {
            modifiers.push('.notNull()');
        }
        if (col.primaryKey) {
            modifiers.push('.primaryKey()');
        }
        if (col.unique) {
            modifiers.push('.unique()');
        }
        if (col.default !== undefined) {
            const defaultVal = formatDefaultValue(col.default);
            modifiers.push(`.default(${defaultVal})`);
        }
        if (col.references) {
            let refCall = `.references('${col.references.table}', '${col.references.column}'`;
            if (col.references.onDelete || col.references.onUpdate) {
                const opts = [];
                if (col.references.onDelete) {
                    opts.push(`onDelete: '${col.references.onDelete}'`);
                }
                if (col.references.onUpdate) {
                    opts.push(`onUpdate: '${col.references.onUpdate}'`);
                }
                refCall += `, { ${opts.join(', ')} }`;
            }
            refCall += ')';
            modifiers.push(refCall);
        }
        if (col.check) {
            modifiers.push(`.check('${escapeString(col.check)}')`);
        }
        if (col.generated) {
            modifiers.push(`.generatedAs('${escapeString(col.generated.expression)}', ${col.generated.stored})`);
        }
        colDef += modifiers.join('');
        colDef += ',';
        lines.push(colDef);
    }
    lines.push('}');
    const hasOptions = table.schema || table.primaryKey ||
        table.uniqueConstraints.length > 0 ||
        table.checkConstraints.length > 0 ||
        table.foreignKeys.length > 0;
    if (hasOptions) {
        lines[lines.length - 1] = '}, {';
        if (table.schema) {
            lines.push(`  schema: '${table.schema}',`);
        }
        if (table.primaryKey && table.primaryKey.length > 0) {
            const hasInlineKey = table.columns.some(c => c.primaryKey);
            if (!hasInlineKey) {
                lines.push(`  primaryKey: [${table.primaryKey.map(k => `'${k}'`).join(', ')}],`);
            }
        }
        if (table.uniqueConstraints.length > 0) {
            lines.push('  uniqueConstraints: [');
            for (const uc of table.uniqueConstraints) {
                const cols = uc.columns.map(c => `'${c}'`).join(', ');
                if (uc.name) {
                    lines.push(`    { columns: [${cols}], name: '${uc.name}' },`);
                }
                else {
                    lines.push(`    { columns: [${cols}] },`);
                }
            }
            lines.push('  ],');
        }
        if (table.checkConstraints.length > 0) {
            lines.push('  checkConstraints: [');
            for (const cc of table.checkConstraints) {
                if (cc.name) {
                    lines.push(`    { expression: '${escapeString(cc.expression)}', name: '${cc.name}' },`);
                }
                else {
                    lines.push(`    { expression: '${escapeString(cc.expression)}' },`);
                }
            }
            lines.push('  ],');
        }
        if (table.foreignKeys.length > 0) {
            lines.push('  foreignKeys: [');
            for (const fk of table.foreignKeys) {
                const cols = fk.columns.map(c => `'${c}'`).join(', ');
                const refCols = fk.references.columns.map(c => `'${c}'`).join(', ');
                let fkDef = `    { columns: [${cols}], references: { table: '${fk.references.table}', columns: [${refCols}] }`;
                if (fk.onDelete) {
                    fkDef += `, onDelete: '${fk.onDelete}'`;
                }
                if (fk.onUpdate) {
                    fkDef += `, onUpdate: '${fk.onUpdate}'`;
                }
                if (fk.name) {
                    fkDef += `, name: '${fk.name}'`;
                }
                fkDef += ' },';
                lines.push(fkDef);
            }
            lines.push('  ],');
        }
        lines.push('});');
    }
    else {
        lines[lines.length - 1] = '});';
    }
    return lines.join('\n');
}
function toPascalCase(str) {
    return str
        .split(/[_-]/)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join('');
}
function escapeString(str) {
    return str.replace(/'/g, "\\'").replace(/\\/g, '\\\\');
}
function formatDefaultValue(value) {
    const upper = value.toUpperCase().trim();
    if (upper === 'NOW()' || upper === 'CURRENT_TIMESTAMP' ||
        upper === 'CURRENT_DATE' || upper === 'CURRENT_TIME') {
        return `'${upper}'`;
    }
    if (upper.startsWith('GEN_RANDOM_UUID')) {
        return `'${upper}'`;
    }
    if (upper === 'TRUE' || upper === 'FALSE') {
        return upper.toLowerCase();
    }
    if (upper === 'NULL') {
        return 'null';
    }
    if (/^-?\d+(\.\d+)?$/.test(value)) {
        return value;
    }
    if (value.includes('(')) {
        return `'${value}'`;
    }
    return `'${escapeString(value)}'`;
}
export function introspectSQL(sql) {
    const parsed = parseCreateTable(sql);
    const code = generateSchemaCode(parsed);
    return { parsed, code };
}
export function introspectMultiple(sql) {
    const statements = sql
        .split(/;\s*(?=CREATE\s+TABLE)/i)
        .filter(s => s.trim())
        .map(s => s.trim() + (s.trim().endsWith(';') ? '' : ';'));
    return statements.map(stmt => introspectSQL(stmt));
}
