"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NetworkConditionCollector = void 0;
exports.buildNetworkConditionSQL = buildNetworkConditionSQL;
const pg_format_1 = __importDefault(require("../utils/pg-format.cjs"));
function networkToSQL(address) {
    if (typeof address === 'string')
        return address;
    const { octets, mask } = address;
    const ip = octets.join('.');
    return mask !== undefined ? `${ip}/${mask}` : ip;
}
class NetworkConditionCollector {
    parent;
    constructor(parent) {
        this.parent = parent;
    }
    containedByStrict(column, value) {
        this.parent.conditions.push({
            method: 'network_contained_by_strict',
            column,
            values: networkToSQL(value)
        });
        return this.parent;
    }
    containedByOrEqual(column, value) {
        this.parent.conditions.push({
            method: 'network_contained_by_or_equal',
            column,
            values: networkToSQL(value)
        });
        return this.parent;
    }
    containsStrict(column, value) {
        this.parent.conditions.push({
            method: 'network_contains_strict',
            column,
            values: networkToSQL(value)
        });
        return this.parent;
    }
    containsOrEqual(column, value) {
        this.parent.conditions.push({
            method: 'network_contains_or_equal',
            column,
            values: networkToSQL(value)
        });
        return this.parent;
    }
    overlaps(column, value) {
        this.parent.conditions.push({
            method: 'network_overlaps',
            column,
            values: networkToSQL(value)
        });
        return this.parent;
    }
    sameFamily(column, value) {
        this.parent.conditions.push({
            method: 'network_same_family',
            column,
            values: networkToSQL(value)
        });
        return this.parent;
    }
    isIPv4(column) {
        this.parent.conditions.push({
            method: 'network_is_ipv4',
            column
        });
        return this.parent;
    }
    isIPv6(column) {
        this.parent.conditions.push({
            method: 'network_is_ipv6',
            column
        });
        return this.parent;
    }
    maskLengthEquals(column, length) {
        this.parent.conditions.push({
            method: 'network_masklen_eq',
            column,
            values: length
        });
        return this.parent;
    }
    maskLengthGreaterThan(column, length) {
        this.parent.conditions.push({
            method: 'network_masklen_gt',
            column,
            values: length
        });
        return this.parent;
    }
    maskLengthLessThan(column, length) {
        this.parent.conditions.push({
            method: 'network_masklen_lt',
            column,
            values: length
        });
        return this.parent;
    }
    bitwiseAnd(column, mask, expected) {
        this.parent.conditions.push({
            method: 'network_bitwise_and',
            column,
            values: { mask, expected }
        });
        return this.parent;
    }
    bitwiseOr(column, value, expected) {
        this.parent.conditions.push({
            method: 'network_bitwise_or',
            column,
            values: { value, expected }
        });
        return this.parent;
    }
    macEquals(column, value) {
        this.parent.conditions.push({
            method: 'network_mac_equals',
            column,
            values: value
        });
        return this.parent;
    }
    macNotEquals(column, value) {
        this.parent.conditions.push({
            method: 'network_mac_not_equals',
            column,
            values: value
        });
        return this.parent;
    }
    macGreaterThan(column, value) {
        this.parent.conditions.push({
            method: 'network_mac_gt',
            column,
            values: value
        });
        return this.parent;
    }
    macLessThan(column, value) {
        this.parent.conditions.push({
            method: 'network_mac_lt',
            column,
            values: value
        });
        return this.parent;
    }
    macTruncEquals(column, oui) {
        this.parent.conditions.push({
            method: 'network_mac_trunc_equals',
            column,
            values: oui
        });
        return this.parent;
    }
    hostEquals(column, value) {
        this.parent.conditions.push({
            method: 'network_host_equals',
            column,
            values: value
        });
        return this.parent;
    }
    networkEquals(column, value) {
        this.parent.conditions.push({
            method: 'network_network_equals',
            column,
            values: value
        });
        return this.parent;
    }
    broadcastEquals(column, value) {
        this.parent.conditions.push({
            method: 'network_broadcast_equals',
            column,
            values: value
        });
        return this.parent;
    }
}
exports.NetworkConditionCollector = NetworkConditionCollector;
function buildNetworkConditionSQL(condition) {
    const { method, column, values } = condition;
    switch (method) {
        case 'network_contained_by_strict':
            return (0, pg_format_1.default)('%I << inet %L', column, values);
        case 'network_contained_by_or_equal':
            return (0, pg_format_1.default)('%I <<= inet %L', column, values);
        case 'network_contains_strict':
            return (0, pg_format_1.default)('%I >> inet %L', column, values);
        case 'network_contains_or_equal':
            return (0, pg_format_1.default)('%I >>= inet %L', column, values);
        case 'network_overlaps':
            return (0, pg_format_1.default)('%I && inet %L', column, values);
        case 'network_same_family':
            return (0, pg_format_1.default)('inet_same_family(%I, inet %L)', column, values);
        case 'network_is_ipv4':
            return (0, pg_format_1.default)('family(%I) = 4', column);
        case 'network_is_ipv6':
            return (0, pg_format_1.default)('family(%I) = 6', column);
        case 'network_masklen_eq':
            return (0, pg_format_1.default)('masklen(%I) = %s', column, values);
        case 'network_masklen_gt':
            return (0, pg_format_1.default)('masklen(%I) > %s', column, values);
        case 'network_masklen_lt':
            return (0, pg_format_1.default)('masklen(%I) < %s', column, values);
        case 'network_bitwise_and':
            return (0, pg_format_1.default)('(%I & inet %L) = inet %L', column, values.mask, values.expected);
        case 'network_bitwise_or':
            return (0, pg_format_1.default)('(%I | inet %L) = inet %L', column, values.value, values.expected);
        case 'network_mac_equals':
            return (0, pg_format_1.default)('%I = macaddr %L', column, values);
        case 'network_mac_not_equals':
            return (0, pg_format_1.default)('%I <> macaddr %L', column, values);
        case 'network_mac_gt':
            return (0, pg_format_1.default)('%I > macaddr %L', column, values);
        case 'network_mac_lt':
            return (0, pg_format_1.default)('%I < macaddr %L', column, values);
        case 'network_mac_trunc_equals':
            return (0, pg_format_1.default)('trunc(%I) = macaddr %L', column, values);
        case 'network_host_equals':
            return (0, pg_format_1.default)('host(%I) = %L', column, values);
        case 'network_network_equals':
            return (0, pg_format_1.default)('network(%I) = cidr %L', column, values);
        case 'network_broadcast_equals':
            return (0, pg_format_1.default)('broadcast(%I) = inet %L', column, values);
        default:
            return '';
    }
}
