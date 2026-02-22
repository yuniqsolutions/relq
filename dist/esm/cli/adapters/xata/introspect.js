import { XATA_TO_POSTGRES_TYPE_MAP, XATA_RESERVED_COLUMNS, XATA_INTERNAL_TABLES, } from "./features.js";
export async function introspectXata(fetchSchema, databaseName, options) {
    const schema = await fetchSchema();
    const tables = [];
    const constraints = [];
    const indexes = [];
    const excludePatterns = options?.excludePatterns || [];
    for (const table of schema.tables) {
        if (XATA_INTERNAL_TABLES.includes(table.name)) {
            continue;
        }
        const isExcluded = excludePatterns.some(pattern => {
            if (pattern.includes('*')) {
                const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
                return regex.test(table.name);
            }
            return pattern === table.name;
        });
        if (isExcluded) {
            continue;
        }
        const tableInfo = convertXataTable(table);
        tables.push(tableInfo);
        const tableConstraints = extractConstraints(table);
        constraints.push(...tableConstraints);
        const tableIndexes = extractIndexes(table);
        indexes.push(...tableIndexes);
    }
    return {
        database: databaseName,
        tables,
        constraints,
        indexes,
        enums: [],
        triggers: [],
        functions: [],
    };
}
function convertXataTable(table) {
    const columns = [];
    columns.push({
        name: 'id',
        type: 'text',
        baseType: 'text',
        nullable: false,
        isPrimaryKey: true,
        isGenerated: true,
        generatedExpression: 'Xata auto-generated',
        ordinalPosition: 1,
    });
    let position = 2;
    for (const col of table.columns) {
        if (XATA_RESERVED_COLUMNS.includes(col.name)) {
            continue;
        }
        const columnInfo = convertXataColumn(col, table.name, position);
        columns.push(columnInfo);
        position++;
    }
    columns.push({
        name: 'xata',
        type: 'jsonb',
        baseType: 'jsonb',
        nullable: false,
        isGenerated: true,
        generatedExpression: 'Xata metadata (version, createdAt, updatedAt)',
        comment: 'Xata internal metadata',
        ordinalPosition: position,
    });
    return {
        name: table.name,
        schema: 'public',
        type: 'table',
        columns,
        comment: undefined,
    };
}
function convertXataColumn(col, tableName, position) {
    let type = XATA_TO_POSTGRES_TYPE_MAP[col.type] || col.type;
    let baseType = type;
    if (col.type === 'vector' && col.vector?.dimension) {
        type = `vector(${col.vector.dimension})`;
        baseType = 'vector';
    }
    if (col.type === 'file' || col.type === 'file[]') {
        type = 'jsonb';
        baseType = 'jsonb';
    }
    const columnInfo = {
        name: col.name,
        type,
        baseType,
        nullable: !col.notNull,
        defaultValue: col.defaultValue !== undefined
            ? formatDefaultValue(col.defaultValue, col.type)
            : undefined,
        ordinalPosition: position,
    };
    if (col.type === 'link' && col.link?.table) {
        columnInfo.comment = `Link to ${col.link.table}`;
    }
    return columnInfo;
}
function formatDefaultValue(value, type) {
    if (value === null)
        return 'NULL';
    if (typeof value === 'string')
        return `'${value.replace(/'/g, "''")}'`;
    if (typeof value === 'boolean')
        return value ? 'true' : 'false';
    if (typeof value === 'number')
        return String(value);
    if (typeof value === 'object')
        return `'${JSON.stringify(value)}'`;
    return String(value);
}
function extractConstraints(table) {
    const constraints = [];
    constraints.push({
        name: `${table.name}_pkey`,
        tableName: table.name,
        schema: 'public',
        type: 'PRIMARY KEY',
        columns: ['id'],
    });
    for (const col of table.columns) {
        if (col.unique) {
            constraints.push({
                name: `${table.name}_${col.name}_key`,
                tableName: table.name,
                schema: 'public',
                type: 'UNIQUE',
                columns: [col.name],
            });
        }
        if (col.type === 'link' && col.link?.table) {
            constraints.push({
                name: `${table.name}_${col.name}_fkey`,
                tableName: table.name,
                schema: 'public',
                type: 'FOREIGN KEY',
                columns: [col.name],
                referencedTable: col.link.table,
                referencedSchema: 'public',
                referencedColumns: ['id'],
            });
        }
    }
    return constraints;
}
function createIndexColumn(name) {
    return {
        name,
        direction: 'ASC',
        nulls: 'LAST',
    };
}
function extractIndexes(table) {
    const indexes = [];
    indexes.push({
        name: `${table.name}_pkey_idx`,
        tableName: table.name,
        schema: 'public',
        columns: [createIndexColumn('id')],
        isUnique: true,
        isPrimary: true,
        type: 'btree',
    });
    for (const col of table.columns) {
        if (col.unique) {
            indexes.push({
                name: `${table.name}_${col.name}_unique_idx`,
                tableName: table.name,
                schema: 'public',
                columns: [createIndexColumn(col.name)],
                isUnique: true,
                isPrimary: false,
                type: 'btree',
            });
        }
        if (col.type === 'link') {
            indexes.push({
                name: `${table.name}_${col.name}_link_idx`,
                tableName: table.name,
                schema: 'public',
                columns: [createIndexColumn(col.name)],
                isUnique: false,
                isPrimary: false,
                type: 'btree',
            });
        }
        if (col.type === 'string' || col.type === 'text') {
            indexes.push({
                name: `${table.name}_${col.name}_fts_idx`,
                tableName: table.name,
                schema: 'public',
                columns: [createIndexColumn(col.name)],
                isUnique: false,
                isPrimary: false,
                type: 'gin',
            });
        }
        if (col.type === 'vector') {
            indexes.push({
                name: `${table.name}_${col.name}_vector_idx`,
                tableName: table.name,
                schema: 'public',
                columns: [createIndexColumn(col.name)],
                isUnique: false,
                isPrimary: false,
                type: 'hnsw',
            });
        }
    }
    return indexes;
}
