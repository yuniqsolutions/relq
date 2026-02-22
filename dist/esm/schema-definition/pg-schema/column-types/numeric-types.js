import { createColumnWithName, createColumn } from "./column-builder.js";
export const integer = (columnName) => createColumnWithName('INTEGER', columnName);
export const int = integer;
export const int4 = integer;
export const smallint = (columnName) => createColumnWithName('SMALLINT', columnName);
export const int2 = smallint;
export const bigint = (columnName) => createColumnWithName('BIGINT', columnName);
export const int8 = bigint;
export const serial = (columnName) => createColumnWithName('SERIAL', columnName);
export const serial4 = serial;
export const smallserial = (columnName) => createColumnWithName('SMALLSERIAL', columnName);
export const serial2 = smallserial;
export const bigserial = (columnName) => createColumnWithName('BIGSERIAL', columnName);
export const serial8 = bigserial;
export const epoch = (columnName) => createColumnWithName('BIGINT', columnName);
export const decimal = (columnNameOrOpts, scale) => {
    if (typeof columnNameOrOpts === 'string' && !columnNameOrOpts.includes('.')) {
        return createColumnWithName('DECIMAL', columnNameOrOpts);
    }
    if (typeof columnNameOrOpts === 'number') {
        const type = scale !== undefined
            ? `DECIMAL(${columnNameOrOpts}, ${scale})`
            : `DECIMAL(${columnNameOrOpts})`;
        return createColumn(type);
    }
    if (columnNameOrOpts && typeof columnNameOrOpts === 'object') {
        const type = columnNameOrOpts.precision !== undefined
            ? columnNameOrOpts.scale !== undefined
                ? `DECIMAL(${columnNameOrOpts.precision}, ${columnNameOrOpts.scale})`
                : `DECIMAL(${columnNameOrOpts.precision})`
            : 'DECIMAL';
        return createColumn(type);
    }
    return createColumn('DECIMAL');
};
export const numeric = decimal;
export const real = (columnName) => createColumnWithName('REAL', columnName);
export const float4 = real;
export const doublePrecision = (columnName) => createColumnWithName('DOUBLE PRECISION', columnName);
export const float8 = doublePrecision;
export const money = (columnName) => createColumnWithName('MONEY', columnName);
