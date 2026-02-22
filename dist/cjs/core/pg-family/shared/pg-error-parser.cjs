"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PG_CONNECTION_ERROR_CODES = exports.PG_RECOVERABLE_ERROR_CODES = void 0;
exports.isPgConnectionError = isPgConnectionError;
exports.parsePgError = parsePgError;
const relq_errors_1 = require("../../../errors/relq-errors.cjs");
exports.PG_RECOVERABLE_ERROR_CODES = new Set([
    'ETIMEDOUT',
    'ECONNRESET',
    '57P02'
]);
exports.PG_CONNECTION_ERROR_CODES = new Set([
    'ECONNRESET',
    'ETIMEDOUT',
    'EPIPE',
    'ENOTCONN',
    '57P01',
    '57P02',
    '57P03'
]);
function isPgConnectionError(error) {
    if (exports.PG_CONNECTION_ERROR_CODES.has(error.code))
        return true;
    if (error.message?.includes('Connection terminated'))
        return true;
    if (error.message?.includes('connection is closed'))
        return true;
    if (error.message?.includes('Client has encountered a connection error'))
        return true;
    return false;
}
function parsePgError(error, sql) {
    return (0, relq_errors_1.parsePostgresError)(error, sql);
}
