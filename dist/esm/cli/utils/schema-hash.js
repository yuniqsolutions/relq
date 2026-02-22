import * as crypto from 'node:crypto';
export function normalizeSchema(schema) {
    const userTables = schema.tables.filter(t => !t.name.startsWith('_relq') &&
        !t.name.startsWith('relq_'));
    const tables = userTables.map(normalizeTable);
    const extensions = [...schema.extensions];
    return { tables, extensions };
}
function normalizeTable(table) {
    const columns = table.columns.map(normalizeColumn);
    const indexes = (table.indexes || []).map(normalizeIndex);
    const constraints = (table.constraints || []).map(normalizeConstraint);
    return {
        name: table.name,
        columns,
        indexes,
        constraints,
        isPartitioned: table.isPartitioned,
        partitionType: table.partitionType,
        partitionKey: table.partitionKey ? [...table.partitionKey] : undefined,
        trackingId: table.trackingId,
    };
}
const TYPE_ALIASES = {
    'CHARACTER VARYING': 'VARCHAR',
    'CHARACTER': 'CHAR',
    'INT': 'INTEGER',
    'INT4': 'INTEGER',
    'INT8': 'BIGINT',
    'INT2': 'SMALLINT',
    'FLOAT4': 'REAL',
    'FLOAT8': 'DOUBLE PRECISION',
    'DECIMAL': 'NUMERIC',
    'BOOL': 'BOOLEAN',
    'TIMESTAMP WITHOUT TIME ZONE': 'TIMESTAMP',
    'TIMESTAMP WITH TIME ZONE': 'TIMESTAMPTZ',
    'TIME WITHOUT TIME ZONE': 'TIME',
    'TIME WITH TIME ZONE': 'TIMETZ',
    'BIT VARYING': 'VARBIT',
};
function normalizeColumn(col) {
    const c = col;
    const rawType = (col.dataType ?? c.type ?? '').toUpperCase();
    let baseType = rawType;
    let extractedLength;
    const typeWithParams = rawType.match(/^(.+?)\((\d+)\)$/);
    if (typeWithParams) {
        baseType = typeWithParams[1].trim();
        extractedLength = parseInt(typeWithParams[2], 10);
    }
    const canonicalType = TYPE_ALIASES[baseType] ?? baseType;
    const explicitLength = col.maxLength ?? c.maxLength ?? undefined;
    return {
        name: col.name,
        type: canonicalType,
        nullable: col.isNullable ?? c.nullable ?? false,
        defaultValue: col.defaultValue || undefined,
        isPrimaryKey: col.isPrimaryKey ?? false,
        isUnique: col.isUnique ?? false,
        length: explicitLength ?? extractedLength,
        comment: col.comment ?? c.comment ?? undefined,
        trackingId: col.trackingId ?? c.trackingId,
    };
}
function normalizeIndex(idx) {
    return {
        name: idx.name,
        columns: [...idx.columns].sort(),
        unique: idx.isUnique,
        type: idx.type?.toUpperCase(),
        trackingId: idx.trackingId,
    };
}
function normalizeConstraint(con) {
    return {
        name: con.name,
        type: con.type.toUpperCase(),
        definition: con.definition || undefined,
        trackingId: con.trackingId,
    };
}
export function generateSchemaHash(schema) {
    const normalized = normalizeSchema(schema);
    const sorted = {
        tables: [...normalized.tables]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(t => ({
            ...t,
            columns: [...t.columns].sort((a, b) => a.name.localeCompare(b.name)),
            indexes: [...t.indexes].sort((a, b) => a.name.localeCompare(b.name)),
            constraints: [...t.constraints].sort((a, b) => a.name.localeCompare(b.name)),
        })),
        extensions: [...normalized.extensions].sort(),
    };
    const json = JSON.stringify(sorted, null, 0);
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
