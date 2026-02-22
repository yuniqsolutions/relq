"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bool = exports.boolean = exports.timeWithTimeZone = exports.date = exports.timestampWithTimeZone = exports.bytea = exports.text = exports.character = exports.characterVarying = void 0;
exports.varchar = varchar;
exports.char = char;
exports.timestamp = timestamp;
exports.timestamptz = timestamptz;
exports.time = time;
exports.timetz = timetz;
exports.interval = interval;
const column_builder_1 = require("./column-builder.cjs");
function varchar(arg1, arg2) {
    if (arg1 === undefined) {
        return (0, column_builder_1.createColumn)('VARCHAR');
    }
    if (typeof arg1 === 'number') {
        return (0, column_builder_1.createColumn)(`VARCHAR(${arg1})`);
    }
    if (typeof arg1 === 'object') {
        const length = arg1.length;
        return (0, column_builder_1.createColumn)(length ? `VARCHAR(${length})` : 'VARCHAR');
    }
    const length = arg2?.length;
    const col = (0, column_builder_1.createColumn)(length ? `VARCHAR(${length})` : 'VARCHAR');
    col.$columnName = arg1;
    return col;
}
exports.characterVarying = varchar;
function char(arg1, arg2) {
    if (arg1 === undefined) {
        return (0, column_builder_1.createColumn)('CHAR(1)');
    }
    if (typeof arg1 === 'number') {
        return (0, column_builder_1.createColumn)(`CHAR(${arg1})`);
    }
    if (typeof arg1 === 'object') {
        const length = arg1.length ?? 1;
        return (0, column_builder_1.createColumn)(`CHAR(${length})`);
    }
    const length = arg2?.length ?? 1;
    const col = (0, column_builder_1.createColumn)(`CHAR(${length})`);
    col.$columnName = arg1;
    return col;
}
exports.character = char;
const text = (columnName) => (0, column_builder_1.createColumnWithName)('TEXT', columnName);
exports.text = text;
const bytea = (columnName) => (0, column_builder_1.createColumnWithName)('BYTEA', columnName);
exports.bytea = bytea;
function timestamp(arg1, arg2) {
    if (typeof arg1 === 'string') {
        const opts = arg2;
        const base = opts?.withTimezone ? 'TIMESTAMPTZ' : 'TIMESTAMP';
        const type = opts?.precision !== undefined ? `${base}(${opts.precision})` : base;
        const col = (0, column_builder_1.createColumn)(type);
        col.$columnName = arg1;
        return col;
    }
    if (typeof arg1 === 'number') {
        return (0, column_builder_1.createColumn)(`TIMESTAMP(${arg1})`);
    }
    if (arg1 && typeof arg1 === 'object') {
        const base = arg1.withTimezone ? 'TIMESTAMPTZ' : 'TIMESTAMP';
        if (arg1.precision !== undefined) {
            return (0, column_builder_1.createColumn)(`${base}(${arg1.precision})`);
        }
        return (0, column_builder_1.createColumn)(base);
    }
    return (0, column_builder_1.createColumn)('TIMESTAMP');
}
function timestamptz(arg1, arg2) {
    if (typeof arg1 === 'string') {
        const opts = arg2;
        const type = opts?.precision !== undefined ? `TIMESTAMPTZ(${opts.precision})` : 'TIMESTAMPTZ';
        const col = (0, column_builder_1.createColumn)(type);
        col.$columnName = arg1;
        return col;
    }
    if (typeof arg1 === 'number') {
        return (0, column_builder_1.createColumn)(`TIMESTAMPTZ(${arg1})`);
    }
    if (arg1 && typeof arg1 === 'object' && arg1.precision !== undefined) {
        return (0, column_builder_1.createColumn)(`TIMESTAMPTZ(${arg1.precision})`);
    }
    return (0, column_builder_1.createColumn)('TIMESTAMPTZ');
}
exports.timestampWithTimeZone = timestamptz;
const date = (columnName) => (0, column_builder_1.createColumnWithName)('DATE', columnName);
exports.date = date;
function time(arg1, arg2) {
    if (typeof arg1 === 'string') {
        const opts = arg2;
        const base = opts?.withTimezone ? 'TIMETZ' : 'TIME';
        const type = opts?.precision !== undefined ? `${base}(${opts.precision})` : base;
        return (0, column_builder_1.createColumnWithName)(type, arg1);
    }
    if (arg1 && typeof arg1 === 'object') {
        const base = arg1.withTimezone ? 'TIMETZ' : 'TIME';
        if (arg1.precision !== undefined) {
            return (0, column_builder_1.createColumn)(`${base}(${arg1.precision})`);
        }
        return (0, column_builder_1.createColumn)(base);
    }
    return (0, column_builder_1.createColumn)('TIME');
}
function timetz(arg1, arg2) {
    if (typeof arg1 === 'string') {
        const opts = arg2;
        const type = opts?.precision !== undefined ? `TIMETZ(${opts.precision})` : 'TIMETZ';
        return (0, column_builder_1.createColumnWithName)(type, arg1);
    }
    if (arg1 && typeof arg1 === 'object' && arg1.precision !== undefined) {
        return (0, column_builder_1.createColumn)(`TIMETZ(${arg1.precision})`);
    }
    return (0, column_builder_1.createColumn)('TIMETZ');
}
exports.timeWithTimeZone = timetz;
function interval(arg1, arg2) {
    if (arg1 && !arg1.includes(' ') && arg2 !== undefined) {
        const type = arg2 ? `INTERVAL ${arg2}` : 'INTERVAL';
        return (0, column_builder_1.createColumnWithName)(type, arg1);
    }
    if (arg1 && !arg1.includes(' ') && arg2 === undefined) {
        const validFields = ['YEAR', 'MONTH', 'DAY', 'HOUR', 'MINUTE', 'SECOND'];
        const isField = validFields.some(f => arg1.toUpperCase().startsWith(f));
        if (isField) {
            return (0, column_builder_1.createColumn)(`INTERVAL ${arg1}`);
        }
        return (0, column_builder_1.createColumnWithName)('INTERVAL', arg1);
    }
    if (arg1) {
        return (0, column_builder_1.createColumn)(`INTERVAL ${arg1}`);
    }
    return (0, column_builder_1.createColumn)('INTERVAL');
}
const boolean = (columnName) => (0, column_builder_1.createColumnWithName)('BOOLEAN', columnName);
exports.boolean = boolean;
exports.bool = exports.boolean;
