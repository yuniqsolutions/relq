"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sql = sql;
function sql(strings, ...values) {
    let text = '';
    const paramValues = [];
    strings.forEach((str, i) => {
        text += str;
        if (i < values.length) {
            const value = values[i];
            if (value && typeof value === 'object' && '__raw' in value) {
                text += value.__raw;
            }
            else {
                paramValues.push(value);
                text += `$${paramValues.length}`;
            }
        }
    });
    return {
        text,
        values: paramValues,
        toString() {
            let result = text;
            for (let i = paramValues.length; i > 0; i--) {
                const val = paramValues[i - 1];
                const replacement = typeof val === 'string'
                    ? `'${val.replace(/'/g, "''")}'`
                    : String(val);
                result = result.replace(`$${i}`, replacement);
            }
            return result;
        },
        toParameterized() {
            return { text, values: [...paramValues] };
        }
    };
}
sql.raw = function (value) {
    return { __raw: value };
};
sql.id = function (identifier) {
    return { __raw: `"${identifier.replace(/"/g, '""')}"` };
};
sql.literal = function (value) {
    if (value === null)
        return { __raw: 'NULL' };
    if (typeof value === 'boolean')
        return { __raw: value ? 'TRUE' : 'FALSE' };
    if (typeof value === 'number')
        return { __raw: String(value) };
    return { __raw: `'${String(value).replace(/'/g, "''")}'` };
};
exports.default = sql;
