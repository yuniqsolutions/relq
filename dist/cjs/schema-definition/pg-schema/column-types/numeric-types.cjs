"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.money = exports.float8 = exports.doublePrecision = exports.float4 = exports.real = exports.numeric = exports.decimal = exports.epoch = exports.serial8 = exports.bigserial = exports.serial2 = exports.smallserial = exports.serial4 = exports.serial = exports.int8 = exports.bigint = exports.int2 = exports.smallint = exports.int4 = exports.int = exports.integer = void 0;
const column_builder_1 = require("./column-builder.cjs");
const integer = (columnName) => (0, column_builder_1.createColumnWithName)('INTEGER', columnName);
exports.integer = integer;
exports.int = exports.integer;
exports.int4 = exports.integer;
const smallint = (columnName) => (0, column_builder_1.createColumnWithName)('SMALLINT', columnName);
exports.smallint = smallint;
exports.int2 = exports.smallint;
const bigint = (columnName) => (0, column_builder_1.createColumnWithName)('BIGINT', columnName);
exports.bigint = bigint;
exports.int8 = exports.bigint;
const serial = (columnName) => (0, column_builder_1.createColumnWithName)('SERIAL', columnName);
exports.serial = serial;
exports.serial4 = exports.serial;
const smallserial = (columnName) => (0, column_builder_1.createColumnWithName)('SMALLSERIAL', columnName);
exports.smallserial = smallserial;
exports.serial2 = exports.smallserial;
const bigserial = (columnName) => (0, column_builder_1.createColumnWithName)('BIGSERIAL', columnName);
exports.bigserial = bigserial;
exports.serial8 = exports.bigserial;
const epoch = (columnName) => (0, column_builder_1.createColumnWithName)('BIGINT', columnName);
exports.epoch = epoch;
const decimal = (columnNameOrOpts, scale) => {
    if (typeof columnNameOrOpts === 'string' && !columnNameOrOpts.includes('.')) {
        return (0, column_builder_1.createColumnWithName)('DECIMAL', columnNameOrOpts);
    }
    if (typeof columnNameOrOpts === 'number') {
        const type = scale !== undefined
            ? `DECIMAL(${columnNameOrOpts}, ${scale})`
            : `DECIMAL(${columnNameOrOpts})`;
        return (0, column_builder_1.createColumn)(type);
    }
    if (columnNameOrOpts && typeof columnNameOrOpts === 'object') {
        const type = columnNameOrOpts.precision !== undefined
            ? columnNameOrOpts.scale !== undefined
                ? `DECIMAL(${columnNameOrOpts.precision}, ${columnNameOrOpts.scale})`
                : `DECIMAL(${columnNameOrOpts.precision})`
            : 'DECIMAL';
        return (0, column_builder_1.createColumn)(type);
    }
    return (0, column_builder_1.createColumn)('DECIMAL');
};
exports.decimal = decimal;
exports.numeric = exports.decimal;
const real = (columnName) => (0, column_builder_1.createColumnWithName)('REAL', columnName);
exports.real = real;
exports.float4 = exports.real;
const doublePrecision = (columnName) => (0, column_builder_1.createColumnWithName)('DOUBLE PRECISION', columnName);
exports.doublePrecision = doublePrecision;
exports.float8 = exports.doublePrecision;
const money = (columnName) => (0, column_builder_1.createColumnWithName)('MONEY', columnName);
exports.money = money;
