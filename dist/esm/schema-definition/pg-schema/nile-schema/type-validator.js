import { createNileMessage } from "./errors.js";
export const NILE_SERIAL_TYPES = new Set([
    'serial',
    'serial2',
    'serial4',
    'serial8',
    'smallserial',
    'bigserial',
]);
export const NILE_EXTENSION_TYPES = new Set([
    'vector',
    'halfvec',
    'sparsevec',
    'geometry',
    'geography',
    'citext',
    'hstore',
    'ltree',
    'cube',
]);
export function validateNileColumnType(input) {
    const messages = [];
    const normalizedType = input.sqlType.toLowerCase().trim();
    const location = { tableName: input.tableName, columnName: input.columnName };
    if (input.tableType === 'tenant') {
        if (NILE_SERIAL_TYPES.has(normalizedType)) {
            messages.push({
                ...createNileMessage('NILE-CT-001', location),
                message: `Column "${input.tableName}.${input.columnName}" uses ${input.sqlType} on a tenant-aware table. Sequences are not available for tenant tables in Nile.`,
                alternative: `uuid('${input.columnName}').default(DEFAULT.genRandomUuid())`,
            });
            return messages;
        }
        if (input.hasIdentity === true) {
            messages.push({
                ...createNileMessage('NILE-CT-002', location),
                message: `Column "${input.tableName}.${input.columnName}" uses GENERATED AS IDENTITY on a tenant-aware table. Identity columns use sequences internally, which are not available for tenant tables.`,
                alternative: 'Use UUID with gen_random_uuid() instead',
            });
            return messages;
        }
        if (input.defaultExpression && /nextval\s*\(/i.test(input.defaultExpression)) {
            messages.push({
                ...createNileMessage('NILE-CT-003', location),
                message: `DEFAULT nextval() on column "${input.tableName}.${input.columnName}" is not available on tenant-aware tables.`,
                alternative: 'Use gen_random_uuid() instead',
            });
            return messages;
        }
    }
    if (input.tableType === 'shared') {
        if (NILE_SERIAL_TYPES.has(normalizedType)) {
            messages.push({
                ...createNileMessage('NILE-SEQ-003', location),
                message: `SERIAL/BIGSERIAL on shared table "${input.tableName}" is supported.`,
            });
            return messages;
        }
    }
    if (NILE_EXTENSION_TYPES.has(normalizedType)) {
        messages.push({
            ...createNileMessage('NILE-CT-005', location),
            message: `Extension type "${input.sqlType}" on "${input.tableName}.${input.columnName}" is available without CREATE EXTENSION (pre-installed on Nile).`,
        });
        return messages;
    }
    if (!NILE_SERIAL_TYPES.has(normalizedType)) {
        messages.push({
            ...createNileMessage('NILE-CT-004', location),
            message: `Column type "${input.sqlType}" on "${input.tableName}.${input.columnName}" is supported on Nile.`,
        });
    }
    return messages;
}
export function validateNileColumnTypes(inputs) {
    const messages = [];
    for (const input of inputs) {
        messages.push(...validateNileColumnType(input));
    }
    return messages;
}
export function isNileColumnTypeBlocked(sqlType, tableType) {
    if (tableType !== 'tenant') {
        return false;
    }
    return NILE_SERIAL_TYPES.has(sqlType.toLowerCase().trim());
}
export function getNileTypeAlternative(sqlType) {
    const normalized = sqlType.toLowerCase().trim();
    if (NILE_SERIAL_TYPES.has(normalized)) {
        return 'uuid().default(DEFAULT.genRandomUuid())';
    }
    return undefined;
}
