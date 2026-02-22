import format from "../utils/pg-format.js";
export class SqlFragment {
    text;
    _isSqlFragment = true;
    constructor(text) {
        this.text = text;
    }
    toString() {
        return this.text;
    }
}
function sqlIdentifier(name) {
    return new SqlFragment(format.ident(name));
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
        return format('%L', value.toISOString());
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
        return format('%L', value);
    }
    if (typeof value === 'object') {
        return format('%L', JSON.stringify(value)) + '::jsonb';
    }
    return format('%L', String(value));
}
sql.id = sqlIdentifier;
sql.raw = sqlRaw;
sql.fragment = sqlRaw;
export { sql };
