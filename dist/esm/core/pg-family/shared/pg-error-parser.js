import { parsePostgresError } from "../../../errors/relq-errors.js";
export const PG_RECOVERABLE_ERROR_CODES = new Set([
    'ETIMEDOUT',
    'ECONNRESET',
    '57P02'
]);
export const PG_CONNECTION_ERROR_CODES = new Set([
    'ECONNRESET',
    'ETIMEDOUT',
    'EPIPE',
    'ENOTCONN',
    '57P01',
    '57P02',
    '57P03'
]);
export function isPgConnectionError(error) {
    if (PG_CONNECTION_ERROR_CODES.has(error.code))
        return true;
    if (error.message?.includes('Connection terminated'))
        return true;
    if (error.message?.includes('connection is closed'))
        return true;
    if (error.message?.includes('Client has encountered a connection error'))
        return true;
    return false;
}
export function parsePgError(error, sql) {
    return parsePostgresError(error, sql);
}
