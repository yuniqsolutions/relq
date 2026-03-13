import format from "../utils/pg-format.js";
import { SqlFunction } from "./sql-functions.js";
export class NetworkFunctions {
    static abbrev(column) {
        return new SqlFunction(format('abbrev(%I)', column));
    }
    static broadcast(column) {
        return new SqlFunction(format('broadcast(%I)', column));
    }
    static family(column) {
        return new SqlFunction(format('family(%I)', column));
    }
    static host(column) {
        return new SqlFunction(format('host(%I)', column));
    }
    static hostmask(column) {
        return new SqlFunction(format('hostmask(%I)', column));
    }
    static inetMerge(column1, column2) {
        return new SqlFunction(format('inet_merge(%I, %I)', column1, column2));
    }
    static inetMergeValue(column, value) {
        return new SqlFunction(format('inet_merge(%I, inet %L)', column, value));
    }
    static inetSameFamily(column1, column2) {
        return new SqlFunction(format('inet_same_family(%I, %I)', column1, column2));
    }
    static masklen(column) {
        return new SqlFunction(format('masklen(%I)', column));
    }
    static netmask(column) {
        return new SqlFunction(format('netmask(%I)', column));
    }
    static network(column) {
        return new SqlFunction(format('network(%I)', column));
    }
    static setMasklen(column, length) {
        return new SqlFunction(format('set_masklen(%I, %s)', column, length));
    }
    static setCidrMasklen(column, length) {
        return new SqlFunction(format('set_masklen(%I, %s)', column, length));
    }
    static text(column) {
        return new SqlFunction(format('text(%I)', column));
    }
    static trunc(column) {
        return new SqlFunction(format('trunc(%I)', column));
    }
    static macaddr8(column) {
        return new SqlFunction(format('macaddr8(%I)', column));
    }
    static bitwiseNot(column) {
        return new SqlFunction(format('~ %I', column));
    }
    static bitwiseAnd(column, value) {
        return new SqlFunction(format('%I & inet %L', column, value));
    }
    static bitwiseOr(column, value) {
        return new SqlFunction(format('%I | inet %L', column, value));
    }
    static add(column, offset) {
        return new SqlFunction(format('%I + %s', column, offset));
    }
    static subtract(column, offset) {
        return new SqlFunction(format('%I - %s', column, offset));
    }
    static difference(column1, column2) {
        return new SqlFunction(format('%I - %I', column1, column2));
    }
    static inet(value) {
        return new SqlFunction(format('inet %L', value));
    }
    static cidr(value) {
        return new SqlFunction(format('cidr %L', value));
    }
    static macaddr(value) {
        return new SqlFunction(format('macaddr %L', value));
    }
}
