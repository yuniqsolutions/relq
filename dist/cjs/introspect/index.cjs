"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseSqlToDefineTable = parseSqlToDefineTable;
exports.generateCode = generateCode;
exports.introspect = introspect;
function mapTypeToCode(sqlType) {
    const type = sqlType.toUpperCase().trim();
    if (type === 'SERIAL')
        return 'serial()';
    if (type === 'SMALLSERIAL')
        return 'smallserial()';
    if (type === 'BIGSERIAL')
        return 'bigserial()';
    if (type === 'SMALLINT' || type === 'INT2')
        return 'smallint()';
    if (type === 'INTEGER' || type === 'INT' || type === 'INT4')
        return 'integer()';
    if (type === 'BIGINT' || type === 'INT8')
        return 'bigint()';
    if (type === 'REAL' || type === 'FLOAT4')
        return 'real()';
    if (type === 'DOUBLE PRECISION' || type === 'FLOAT8')
        return 'doublePrecision()';
    const numericMatch = type.match(/^NUMERIC\((\d+)(?:,\s*(\d+))?\)$/);
    if (numericMatch) {
        return numericMatch[2]
            ? `numeric(${numericMatch[1]}, ${numericMatch[2]})`
            : `numeric(${numericMatch[1]})`;
    }
    if (type === 'NUMERIC' || type === 'DECIMAL')
        return 'numeric()';
    const varcharMatch = type.match(/^VARCHAR\((\d+)\)$/);
    if (varcharMatch)
        return `varchar(${varcharMatch[1]})`;
    if (type === 'VARCHAR')
        return 'varchar()';
    const charMatch = type.match(/^CHAR\((\d+)\)$/);
    if (charMatch)
        return `char(${charMatch[1]})`;
    if (type === 'CHAR')
        return 'char()';
    if (type === 'TEXT')
        return 'text()';
    if (type === 'BOOLEAN' || type === 'BOOL')
        return 'boolean()';
    if (type === 'DATE')
        return 'date()';
    if (type === 'TIME')
        return 'time()';
    if (type === 'TIMETZ' || type === 'TIME WITH TIME ZONE')
        return 'timetz()';
    if (type === 'TIMESTAMP')
        return 'timestamp()';
    if (type === 'TIMESTAMPTZ' || type === 'TIMESTAMP WITH TIME ZONE')
        return 'timestamptz()';
    if (type === 'INTERVAL')
        return 'interval()';
    if (type === 'UUID')
        return 'uuid()';
    if (type === 'JSON')
        return 'json()';
    if (type === 'JSONB')
        return 'jsonb()';
    if (type === 'BYTEA')
        return 'bytea()';
    const arrayMatch = type.match(/^(.+)\[\]$/);
    if (arrayMatch) {
        const baseType = mapTypeToCode(arrayMatch[1]);
        return `${baseType.slice(0, -1)}.array()`;
    }
    const vectorMatch = type.match(/^VECTOR\((\d+)\)$/);
    if (vectorMatch)
        return `vector(${vectorMatch[1]})`;
    if (type === 'VECTOR')
        return 'vector()';
    if (type.startsWith('GEOMETRY'))
        return 'geometry()';
    if (type.startsWith('GEOGRAPHY'))
        return 'geography()';
    if (type === 'INET')
        return 'inet()';
    if (type === 'CIDR')
        return 'cidr()';
    if (type === 'MACADDR')
        return 'macaddr()';
    if (type === 'TSVECTOR')
        return 'tsvector()';
    if (type === 'TSQUERY')
        return 'tsquery()';
    return `sql\`${sqlType.toLowerCase()}\``;
}
function parseCreateTable(sql) {
    const tableMatch = sql.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["']?(\w+)["']?\s*\(([\s\S]+)\)/i);
    if (!tableMatch)
        return null;
    const tableName = tableMatch[1];
    const columnsStr = tableMatch[2];
    const columns = [];
    const tableConstraints = [];
    const parts = [];
    let depth = 0;
    let current = '';
    for (const char of columnsStr) {
        if (char === '(')
            depth++;
        else if (char === ')')
            depth--;
        else if (char === ',' && depth === 0) {
            parts.push(current.trim());
            current = '';
            continue;
        }
        current += char;
    }
    if (current.trim())
        parts.push(current.trim());
    const primaryKeyColumns = new Set();
    const uniqueColumns = new Set();
    const foreignKeys = new Map();
    for (const part of parts) {
        const trimmed = part.trim();
        const pkMatch = trimmed.match(/^PRIMARY\s+KEY\s*\(([^)]+)\)/i);
        if (pkMatch) {
            const cols = pkMatch[1].split(',').map(c => c.trim().replace(/["']/g, ''));
            cols.forEach(c => primaryKeyColumns.add(c));
            continue;
        }
        const uqMatch = trimmed.match(/^UNIQUE\s*\(([^)]+)\)/i);
        if (uqMatch) {
            const cols = uqMatch[1].split(',').map(c => c.trim().replace(/["']/g, ''));
            cols.forEach(c => uniqueColumns.add(c));
            continue;
        }
        const fkMatch = trimmed.match(/^FOREIGN\s+KEY\s*\((\w+)\)\s*REFERENCES\s+["']?(\w+)["']?\s*\((\w+)\)/i);
        if (fkMatch) {
            foreignKeys.set(fkMatch[1], { table: fkMatch[2], column: fkMatch[3] });
            continue;
        }
    }
    for (const part of parts) {
        const trimmed = part.trim();
        if (/^(PRIMARY\s+KEY|UNIQUE|FOREIGN\s+KEY|CHECK|CONSTRAINT)/i.test(trimmed)) {
            continue;
        }
        const colMatch = trimmed.match(/^["']?(\w+)["']?\s+(\w+(?:\([^)]*\))?(?:\[\])?)/i);
        if (!colMatch)
            continue;
        const name = colMatch[1];
        const dataType = colMatch[2].toUpperCase();
        const rest = trimmed.slice(colMatch[0].length).trim();
        const isPrimaryKey = primaryKeyColumns.has(name) || /PRIMARY\s+KEY/i.test(rest);
        const isUnique = uniqueColumns.has(name) || /UNIQUE/i.test(rest);
        const isNullable = !/NOT\s+NULL/i.test(rest) && !isPrimaryKey;
        let references = foreignKeys.get(name) || null;
        const refMatch = rest.match(/REFERENCES\s+["']?(\w+)["']?\s*\((\w+)\)/i);
        if (refMatch) {
            references = { table: refMatch[1], column: refMatch[2] };
        }
        let defaultValue = null;
        const defaultMatch = rest.match(/DEFAULT\s+(.+?)(?:\s+(?:NOT\s+NULL|UNIQUE|PRIMARY|REFERENCES|CHECK)|$)/i);
        if (defaultMatch) {
            let val = defaultMatch[1].trim();
            if (val.endsWith(','))
                val = val.slice(0, -1);
            defaultValue = val;
        }
        if (isPrimaryKey && primaryKeyColumns.size === 0) {
            primaryKeyColumns.add(name);
        }
        columns.push({
            name,
            dataType,
            typeCode: mapTypeToCode(dataType),
            isNullable,
            isPrimaryKey,
            isUnique,
            defaultValue,
            references,
        });
    }
    return {
        name: tableName,
        columns,
        indexes: [],
    };
}
function parseSqlToDefineTable(sql) {
    const tables = [];
    const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["']?(\w+)["']?\s*\([^;]+\);?/gi;
    let match;
    while ((match = createTableRegex.exec(sql)) !== null) {
        const parsed = parseCreateTable(match[0]);
        if (parsed) {
            tables.push(parsed);
        }
    }
    return tables;
}
function generateCode(tables, importPath) {
    const parts = [
        `import { defineTable, serial, integer, bigint, varchar, text, boolean, uuid, jsonb, json, timestamp, timestamptz, date, numeric, vector } from '${importPath}';`,
        '',
    ];
    for (const table of tables) {
        const columns = table.columns.map(col => {
            const mods = [col.typeCode];
            if (col.isPrimaryKey)
                mods.push('.primaryKey()');
            if (!col.isNullable && !col.isPrimaryKey)
                mods.push('.notNull()');
            if (col.isUnique && !col.isPrimaryKey)
                mods.push('.unique()');
            if (col.references)
                mods.push(`.references('${col.references.table}', '${col.references.column}')`);
            if (col.defaultValue)
                mods.push(`.default(${col.defaultValue})`);
            return `    ${col.name}: ${mods.join('')},`;
        });
        parts.push(`export const ${table.name} = defineTable('${table.name}', {`);
        parts.push(...columns);
        parts.push('});');
        parts.push('');
    }
    return parts.join('\n');
}
async function introspect(sql, importPath) {
    const tables = parseSqlToDefineTable(sql);
    return generateCode(tables, importPath);
}
