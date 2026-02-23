"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenize = tokenize;
exports.parseType = parseType;
exports.parseColumnDefinition = parseColumnDefinition;
exports.parseTableConstraint = parseTableConstraint;
exports.parseCreateTable = parseCreateTable;
exports.splitTableBody = splitTableBody;
const introspection_types_1 = require("./introspection-types.cjs");
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
    if (introspection_types_1.SQL_TYPE_MAP[cleanType]) {
        return { type: cleanType, tsCode: introspection_types_1.SQL_TYPE_MAP[cleanType], isArray, dimensions };
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
    const name = (0, introspection_types_1.parseIdentifier)(parts[0]);
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
        const columns = pkMatch[1].split(',').map(c => (0, introspection_types_1.parseIdentifier)(c.trim()));
        return { type: 'primary_key', name, columns };
    }
    const uniqueMatch = constraintDef.match(/UNIQUE\s*\(([^)]+)\)/i);
    if (uniqueMatch) {
        const columns = uniqueMatch[1].split(',').map(c => (0, introspection_types_1.parseIdentifier)(c.trim()));
        return { type: 'unique', name, columns };
    }
    const checkMatch = constraintDef.match(/CHECK\s*\((.+)\)/i);
    if (checkMatch && !upper.includes('FOREIGN KEY')) {
        return { type: 'check', name, expression: checkMatch[1] };
    }
    const fkMatch = constraintDef.match(/FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s+(\w+)\s*\(([^)]+)\)(?:\s+ON\s+DELETE\s+(\w+(?:\s+\w+)?))?(?:\s+ON\s+UPDATE\s+(\w+(?:\s+\w+)?))?/i);
    if (fkMatch) {
        const columns = fkMatch[1].split(',').map(c => (0, introspection_types_1.parseIdentifier)(c.trim()));
        const refTable = fkMatch[2].toLowerCase();
        const refColumns = fkMatch[3].split(',').map(c => (0, introspection_types_1.parseIdentifier)(c.trim()));
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
function parseCreateTable(sql) {
    const cleanSql = sql.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').trim();
    const tableMatch = cleanSql.match(/CREATE\s+(?:TEMP(?:ORARY)?\s+)?TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:(\w+)\.)?(\w+)/i);
    if (!tableMatch) {
        throw new introspection_types_1.RelqQueryError('Invalid CREATE TABLE statement', { hint: 'SQL must start with CREATE TABLE' });
    }
    const schema = tableMatch[1]?.toLowerCase();
    const tableName = tableMatch[2].toLowerCase();
    const bodyMatch = cleanSql.match(/\((.+)\)\s*(?:INHERITS|PARTITION|WITH|TABLESPACE|;|$)/is);
    if (!bodyMatch) {
        throw new introspection_types_1.RelqQueryError('Could not parse table body', { hint: 'Ensure table definition includes column list in parentheses' });
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
