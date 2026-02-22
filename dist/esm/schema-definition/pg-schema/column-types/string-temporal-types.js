import { createColumn, createColumnWithName } from "./column-builder.js";
export function varchar(arg1, arg2) {
    if (arg1 === undefined) {
        return createColumn('VARCHAR');
    }
    if (typeof arg1 === 'number') {
        return createColumn(`VARCHAR(${arg1})`);
    }
    if (typeof arg1 === 'object') {
        const length = arg1.length;
        return createColumn(length ? `VARCHAR(${length})` : 'VARCHAR');
    }
    const length = arg2?.length;
    const col = createColumn(length ? `VARCHAR(${length})` : 'VARCHAR');
    col.$columnName = arg1;
    return col;
}
export const characterVarying = varchar;
export function char(arg1, arg2) {
    if (arg1 === undefined) {
        return createColumn('CHAR(1)');
    }
    if (typeof arg1 === 'number') {
        return createColumn(`CHAR(${arg1})`);
    }
    if (typeof arg1 === 'object') {
        const length = arg1.length ?? 1;
        return createColumn(`CHAR(${length})`);
    }
    const length = arg2?.length ?? 1;
    const col = createColumn(`CHAR(${length})`);
    col.$columnName = arg1;
    return col;
}
export const character = char;
export const text = (columnName) => createColumnWithName('TEXT', columnName);
export const bytea = (columnName) => createColumnWithName('BYTEA', columnName);
export function timestamp(arg1, arg2) {
    if (typeof arg1 === 'string') {
        const opts = arg2;
        const base = opts?.withTimezone ? 'TIMESTAMPTZ' : 'TIMESTAMP';
        const type = opts?.precision !== undefined ? `${base}(${opts.precision})` : base;
        const col = createColumn(type);
        col.$columnName = arg1;
        return col;
    }
    if (typeof arg1 === 'number') {
        return createColumn(`TIMESTAMP(${arg1})`);
    }
    if (arg1 && typeof arg1 === 'object') {
        const base = arg1.withTimezone ? 'TIMESTAMPTZ' : 'TIMESTAMP';
        if (arg1.precision !== undefined) {
            return createColumn(`${base}(${arg1.precision})`);
        }
        return createColumn(base);
    }
    return createColumn('TIMESTAMP');
}
export function timestamptz(arg1, arg2) {
    if (typeof arg1 === 'string') {
        const opts = arg2;
        const type = opts?.precision !== undefined ? `TIMESTAMPTZ(${opts.precision})` : 'TIMESTAMPTZ';
        const col = createColumn(type);
        col.$columnName = arg1;
        return col;
    }
    if (typeof arg1 === 'number') {
        return createColumn(`TIMESTAMPTZ(${arg1})`);
    }
    if (arg1 && typeof arg1 === 'object' && arg1.precision !== undefined) {
        return createColumn(`TIMESTAMPTZ(${arg1.precision})`);
    }
    return createColumn('TIMESTAMPTZ');
}
export const timestampWithTimeZone = timestamptz;
export const date = (columnName) => createColumnWithName('DATE', columnName);
export function time(arg1, arg2) {
    if (typeof arg1 === 'string') {
        const opts = arg2;
        const base = opts?.withTimezone ? 'TIMETZ' : 'TIME';
        const type = opts?.precision !== undefined ? `${base}(${opts.precision})` : base;
        return createColumnWithName(type, arg1);
    }
    if (arg1 && typeof arg1 === 'object') {
        const base = arg1.withTimezone ? 'TIMETZ' : 'TIME';
        if (arg1.precision !== undefined) {
            return createColumn(`${base}(${arg1.precision})`);
        }
        return createColumn(base);
    }
    return createColumn('TIME');
}
export function timetz(arg1, arg2) {
    if (typeof arg1 === 'string') {
        const opts = arg2;
        const type = opts?.precision !== undefined ? `TIMETZ(${opts.precision})` : 'TIMETZ';
        return createColumnWithName(type, arg1);
    }
    if (arg1 && typeof arg1 === 'object' && arg1.precision !== undefined) {
        return createColumn(`TIMETZ(${arg1.precision})`);
    }
    return createColumn('TIMETZ');
}
export const timeWithTimeZone = timetz;
export function interval(arg1, arg2) {
    if (arg1 && !arg1.includes(' ') && arg2 !== undefined) {
        const type = arg2 ? `INTERVAL ${arg2}` : 'INTERVAL';
        return createColumnWithName(type, arg1);
    }
    if (arg1 && !arg1.includes(' ') && arg2 === undefined) {
        const validFields = ['YEAR', 'MONTH', 'DAY', 'HOUR', 'MINUTE', 'SECOND'];
        const isField = validFields.some(f => arg1.toUpperCase().startsWith(f));
        if (isField) {
            return createColumn(`INTERVAL ${arg1}`);
        }
        return createColumnWithName('INTERVAL', arg1);
    }
    if (arg1) {
        return createColumn(`INTERVAL ${arg1}`);
    }
    return createColumn('INTERVAL');
}
export const boolean = (columnName) => createColumnWithName('BOOLEAN', columnName);
export const bool = boolean;
