import * as crypto from 'crypto';
export function normalizeSchema(schema) {
    const userTables = schema.tables.filter(t => !t.name.startsWith('_relq') &&
        !t.name.startsWith('relq_'));
    const tables = userTables
        .map(normalizeTable)
        .sort((a, b) => a.name.localeCompare(b.name));
    const extensions = [...schema.extensions].sort();
    return { tables, extensions };
}
function normalizeTable(table) {
    const columns = table.columns
        .map(normalizeColumn)
        .sort((a, b) => a.name.localeCompare(b.name));
    const indexes = (table.indexes || [])
        .map(normalizeIndex)
        .sort((a, b) => a.name.localeCompare(b.name));
    const constraints = (table.constraints || [])
        .map(normalizeConstraint)
        .sort((a, b) => a.name.localeCompare(b.name));
    return {
        name: table.name,
        columns,
        indexes,
        constraints,
        isPartitioned: table.isPartitioned,
        partitionType: table.partitionType,
        partitionKey: table.partitionKey ? [...table.partitionKey] : undefined,
    };
}
function normalizeColumn(col) {
    return {
        name: col.name,
        type: col.dataType.toUpperCase(),
        nullable: col.isNullable,
        defaultValue: col.defaultValue || undefined,
        isPrimaryKey: col.isPrimaryKey,
        isUnique: col.isUnique,
        length: col.maxLength || undefined,
    };
}
function normalizeIndex(idx) {
    return {
        name: idx.name,
        columns: [...idx.columns].sort(),
        unique: idx.isUnique,
        type: idx.type?.toUpperCase(),
    };
}
function normalizeConstraint(con) {
    return {
        name: con.name,
        type: con.type.toUpperCase(),
        definition: con.definition || undefined,
    };
}
export function generateSchemaHash(schema) {
    const normalized = normalizeSchema(schema);
    const json = JSON.stringify(normalized, null, 0);
    return crypto
        .createHash('sha1')
        .update(json, 'utf8')
        .digest('hex');
}
export function generateShortHash(schema) {
    return generateSchemaHash(schema).substring(0, 7);
}
export function schemasMatch(schema1, schema2) {
    return generateSchemaHash(schema1) === generateSchemaHash(schema2);
}
