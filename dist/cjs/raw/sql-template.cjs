"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlFragment = void 0;
exports.sql = sql;
const pg_format_1 = __importDefault(require("../utils/pg-format.cjs"));
class SqlFragment {
    text;
    _isSqlFragment = true;
    constructor(text) {
        this.text = text;
    }
    toString() {
        return this.text;
    }
}
exports.SqlFragment = SqlFragment;
function sqlIdentifier(name) {
    return new SqlFragment(pg_format_1.default.ident(name));
}
function sqlRaw(text) {
    return new SqlFragment(text);
}
function sql(strings, ...values) {
    let result = '';
    for (let i = 0; i < strings.length; i++) {
        result += strings[i];
        if (i < values.length) {
            const value = values[i];
            result += formatValue(value);
        }
    }
    return new SqlFragment(result);
}
function formatValue(value) {
    if (value && value._isSqlFragment === true) {
        return value.text;
    }
    if (value === null || value === undefined) {
        return 'NULL';
    }
    if (value instanceof Date) {
        return (0, pg_format_1.default)('%L', value.toISOString());
    }
    if (Array.isArray(value)) {
        if (value.length === 0) {
            return 'ARRAY[]';
        }
        const escaped = value.map(v => formatValue(v)).join(', ');
        return `(${escaped})`;
    }
    if (typeof value === 'boolean') {
        return value ? 'true' : 'false';
    }
    if (typeof value === 'number') {
        return String(value);
    }
    if (typeof value === 'bigint') {
        return String(value);
    }
    if (typeof value === 'string') {
        return (0, pg_format_1.default)('%L', value);
    }
    if (typeof value === 'object') {
        return (0, pg_format_1.default)('%L', JSON.stringify(value)) + '::jsonb';
    }
    return (0, pg_format_1.default)('%L', String(value));
}
sql.id = sqlIdentifier;
sql.raw = sqlRaw;
sql.fragment = sqlRaw;
