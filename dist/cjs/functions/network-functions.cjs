"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NetworkFunctions = void 0;
const pg_format_1 = __importDefault(require("../utils/pg-format.cjs"));
const sql_functions_1 = require("./sql-functions.cjs");
class NetworkFunctions {
    static abbrev(column) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('abbrev(%I)', column));
    }
    static broadcast(column) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('broadcast(%I)', column));
    }
    static family(column) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('family(%I)', column));
    }
    static host(column) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('host(%I)', column));
    }
    static hostmask(column) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('hostmask(%I)', column));
    }
    static inetMerge(column1, column2) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('inet_merge(%I, %I)', column1, column2));
    }
    static inetMergeValue(column, value) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('inet_merge(%I, inet %L)', column, value));
    }
    static inetSameFamily(column1, column2) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('inet_same_family(%I, %I)', column1, column2));
    }
    static masklen(column) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('masklen(%I)', column));
    }
    static netmask(column) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('netmask(%I)', column));
    }
    static network(column) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('network(%I)', column));
    }
    static setMasklen(column, length) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('set_masklen(%I, %s)', column, length));
    }
    static setCidrMasklen(column, length) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('set_masklen(%I, %s)', column, length));
    }
    static text(column) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('text(%I)', column));
    }
    static trunc(column) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('trunc(%I)', column));
    }
    static macaddr8(column) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('macaddr8(%I)', column));
    }
    static bitwiseNot(column) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('~ %I', column));
    }
    static bitwiseAnd(column, value) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('%I & inet %L', column, value));
    }
    static bitwiseOr(column, value) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('%I | inet %L', column, value));
    }
    static add(column, offset) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('%I + %s', column, offset));
    }
    static subtract(column, offset) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('%I - %s', column, offset));
    }
    static difference(column1, column2) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('%I - %I', column1, column2));
    }
    static inet(value) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('inet %L', value));
    }
    static cidr(value) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('cidr %L', value));
    }
    static macaddr(value) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('macaddr %L', value));
    }
}
exports.NetworkFunctions = NetworkFunctions;
