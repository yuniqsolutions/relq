"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonbUpdateBuilder = exports.JsonbArrayBuilder = void 0;
const pg_format_1 = __importDefault(require("../utils/pg-format.cjs"));
class JsonbArrayBuilder {
    currentColumn;
    constructor(currentColumn) {
        this.currentColumn = currentColumn;
    }
    set(values) {
        return (0, pg_format_1.default)('%L::jsonb', JSON.stringify(values));
    }
    append(value) {
        return (0, pg_format_1.default)('COALESCE(%I, \'[]\'::jsonb) || %L::jsonb', this.currentColumn, JSON.stringify([value]));
    }
    prepend(value) {
        return (0, pg_format_1.default)('%L::jsonb || COALESCE(%I, \'[]\'::jsonb)', JSON.stringify([value]), this.currentColumn);
    }
    concat(values) {
        if (values.length === 0) {
            return (0, pg_format_1.default)('COALESCE(%I, \'[]\'::jsonb)', this.currentColumn);
        }
        return (0, pg_format_1.default)('COALESCE(%I, \'[]\'::jsonb) || %L::jsonb', this.currentColumn, JSON.stringify(values));
    }
    insertAt(index, value) {
        return (0, pg_format_1.default)('jsonb_insert(COALESCE(%I, \'[]\'::jsonb), %L, %L::jsonb)', this.currentColumn, `{${index}}`, JSON.stringify(value));
    }
    removeAt(index) {
        return (0, pg_format_1.default)('COALESCE(%I, \'[]\'::jsonb) - %s', this.currentColumn, index);
    }
    shift() {
        return this.removeAt(0);
    }
    pop() {
        return this.removeAt(-1);
    }
    removeWhere(key, value) {
        const formattedValue = (0, pg_format_1.default)('%L', value);
        return `COALESCE((SELECT jsonb_agg(elem) FROM jsonb_array_elements(COALESCE(${(0, pg_format_1.default)('%I', this.currentColumn)}, '[]'::jsonb)) elem WHERE elem->>${(0, pg_format_1.default)('%L', key)} != ${formattedValue}), '[]'::jsonb)`;
    }
    removeWhereAll(conditions) {
        const whereClauses = Object.entries(conditions)
            .map(([key, value]) => `elem->>${(0, pg_format_1.default)('%L', key)} = ${(0, pg_format_1.default)('%L', value)}`)
            .join(' AND ');
        return `COALESCE((SELECT jsonb_agg(elem) FROM jsonb_array_elements(COALESCE(${(0, pg_format_1.default)('%I', this.currentColumn)}, '[]'::jsonb)) elem WHERE NOT (${whereClauses})), '[]'::jsonb)`;
    }
    filter(key, value) {
        const formattedValue = (0, pg_format_1.default)('%L', value);
        return `COALESCE((SELECT jsonb_agg(elem) FROM jsonb_array_elements(COALESCE(${(0, pg_format_1.default)('%I', this.currentColumn)}, '[]'::jsonb)) elem WHERE elem->>${(0, pg_format_1.default)('%L', key)} = ${formattedValue}), '[]'::jsonb)`;
    }
    filterAll(conditions) {
        const whereClauses = Object.entries(conditions)
            .map(([key, value]) => `elem->>${(0, pg_format_1.default)('%L', key)} = ${(0, pg_format_1.default)('%L', value)}`)
            .join(' AND ');
        return `COALESCE((SELECT jsonb_agg(elem) FROM jsonb_array_elements(COALESCE(${(0, pg_format_1.default)('%I', this.currentColumn)}, '[]'::jsonb)) elem WHERE ${whereClauses}), '[]'::jsonb)`;
    }
    updateAt(index, newValue) {
        return (0, pg_format_1.default)('jsonb_set(COALESCE(%I, \'[]\'::jsonb), %L, %L::jsonb)', this.currentColumn, `{${index}}`, JSON.stringify(newValue));
    }
    updateWhere(matchKey, matchValue, updates) {
        const matchCondition = `elem->>${(0, pg_format_1.default)('%L', matchKey)} = ${(0, pg_format_1.default)('%L', matchValue)}`;
        const updateEntries = Object.entries(updates);
        if (updateEntries.length === 0) {
            return (0, pg_format_1.default)('COALESCE(%I, \'[]\'::jsonb)', this.currentColumn);
        }
        let setExpr = 'elem';
        for (const [key, value] of updateEntries) {
            const jsonbValue = typeof value === 'string' ? `"${value}"` : JSON.stringify(value);
            setExpr = `jsonb_set(${setExpr}, ${(0, pg_format_1.default)('%L', `{${key}}`)}, ${(0, pg_format_1.default)('%L', jsonbValue)}::jsonb)`;
        }
        return `COALESCE((SELECT jsonb_agg(CASE WHEN ${matchCondition} THEN ${setExpr} ELSE elem END) FROM jsonb_array_elements(COALESCE(${(0, pg_format_1.default)('%I', this.currentColumn)}, '[]'::jsonb)) elem), '[]'::jsonb)`;
    }
    reverse() {
        return `COALESCE((SELECT jsonb_agg(elem ORDER BY idx DESC) FROM jsonb_array_elements(COALESCE(${(0, pg_format_1.default)('%I', this.currentColumn)}, '[]'::jsonb)) WITH ORDINALITY AS t(elem, idx)), '[]'::jsonb)`;
    }
    unique() {
        return `COALESCE((SELECT jsonb_agg(DISTINCT elem) FROM jsonb_array_elements(COALESCE(${(0, pg_format_1.default)('%I', this.currentColumn)}, '[]'::jsonb)) elem), '[]'::jsonb)`;
    }
    uniqueBy(key) {
        return `COALESCE((SELECT jsonb_agg(elem) FROM (SELECT DISTINCT ON (elem->>${(0, pg_format_1.default)('%L', key)}) elem FROM jsonb_array_elements(COALESCE(${(0, pg_format_1.default)('%I', this.currentColumn)}, '[]'::jsonb)) elem) t), '[]'::jsonb)`;
    }
    sortBy(key, direction = 'ASC') {
        return `COALESCE((SELECT jsonb_agg(elem ORDER BY elem->>${(0, pg_format_1.default)('%L', key)} ${direction}) FROM jsonb_array_elements(COALESCE(${(0, pg_format_1.default)('%I', this.currentColumn)}, '[]'::jsonb)) elem), '[]'::jsonb)`;
    }
    slice(start, end) {
        if (end === undefined) {
            return `COALESCE((SELECT jsonb_agg(elem) FROM (SELECT elem FROM jsonb_array_elements(COALESCE(${(0, pg_format_1.default)('%I', this.currentColumn)}, '[]'::jsonb)) WITH ORDINALITY AS t(elem, idx) WHERE idx > ${start}) t), '[]'::jsonb)`;
        }
        return `COALESCE((SELECT jsonb_agg(elem) FROM (SELECT elem FROM jsonb_array_elements(COALESCE(${(0, pg_format_1.default)('%I', this.currentColumn)}, '[]'::jsonb)) WITH ORDINALITY AS t(elem, idx) WHERE idx > ${start} AND idx <= ${end}) t), '[]'::jsonb)`;
    }
    take(n) {
        return `COALESCE((SELECT jsonb_agg(elem) FROM (SELECT elem FROM jsonb_array_elements(COALESCE(${(0, pg_format_1.default)('%I', this.currentColumn)}, '[]'::jsonb)) WITH ORDINALITY AS t(elem, idx) WHERE idx <= ${n}) t), '[]'::jsonb)`;
    }
    skip(n) {
        return `COALESCE((SELECT jsonb_agg(elem) FROM (SELECT elem FROM jsonb_array_elements(COALESCE(${(0, pg_format_1.default)('%I', this.currentColumn)}, '[]'::jsonb)) WITH ORDINALITY AS t(elem, idx) WHERE idx > ${n}) t), '[]'::jsonb)`;
    }
    mapSet(key, value) {
        const jsonbValue = typeof value === 'string' ? `"${value}"` : JSON.stringify(value);
        return `COALESCE((SELECT jsonb_agg(jsonb_set(elem, ${(0, pg_format_1.default)('%L', `{${key}}`)}, ${(0, pg_format_1.default)('%L', jsonbValue)}::jsonb)) FROM jsonb_array_elements(COALESCE(${(0, pg_format_1.default)('%I', this.currentColumn)}, '[]'::jsonb)) elem), '[]'::jsonb)`;
    }
    mapIncrement(key, amount = 1) {
        return `COALESCE((SELECT jsonb_agg(jsonb_set(elem, ${(0, pg_format_1.default)('%L', `{${key}}`)}, ((COALESCE((elem->>${(0, pg_format_1.default)('%L', key)})::numeric, 0) + ${amount})::text)::jsonb)) FROM jsonb_array_elements(COALESCE(${(0, pg_format_1.default)('%I', this.currentColumn)}, '[]'::jsonb)) elem), '[]'::jsonb)`;
    }
    mapDecrement(key, amount = 1) {
        return this.mapIncrement(key, -amount);
    }
}
exports.JsonbArrayBuilder = JsonbArrayBuilder;
class JsonbUpdateBuilder {
    currentColumn;
    _array = null;
    constructor(currentColumn = '__COLUMN__') {
        this.currentColumn = currentColumn;
    }
    get array() {
        if (!this._array) {
            this._array = new JsonbArrayBuilder(this.currentColumn);
        }
        return this._array;
    }
    set(value) {
        return (0, pg_format_1.default)('%L::jsonb', JSON.stringify(value));
    }
    setField(path, value) {
        const pathArray = Array.isArray(path) ? path : [path];
        const pathStr = `{${pathArray.join(',')}}`;
        const jsonbValue = typeof value === 'string' ? `"${value}"` : JSON.stringify(value);
        return (0, pg_format_1.default)('jsonb_set(COALESCE(%I, \'{}\'::jsonb), %L, %L::jsonb, true)', this.currentColumn, pathStr, jsonbValue);
    }
    removeField(key) {
        if (Array.isArray(key)) {
            const pathStr = `{${key.join(',')}}`;
            return (0, pg_format_1.default)('COALESCE(%I, \'{}\'::jsonb) #- %L', this.currentColumn, pathStr);
        }
        return (0, pg_format_1.default)('COALESCE(%I, \'{}\'::jsonb) - %L', this.currentColumn, key);
    }
    removeFields(keys) {
        if (keys.length === 0) {
            return (0, pg_format_1.default)('COALESCE(%I, \'{}\'::jsonb)', this.currentColumn);
        }
        const keysArray = keys.map(k => (0, pg_format_1.default)('%L', k)).join(', ');
        return (0, pg_format_1.default)('COALESCE(%I, \'{}\'::jsonb) - ARRAY[%s]', this.currentColumn, keysArray);
    }
    merge(obj) {
        return (0, pg_format_1.default)('COALESCE(%I, \'{}\'::jsonb) || %L::jsonb', this.currentColumn, JSON.stringify(obj));
    }
    deepMerge(obj) {
        const entries = Object.entries(obj);
        if (entries.length === 0) {
            return (0, pg_format_1.default)('COALESCE(%I, \'{}\'::jsonb)', this.currentColumn);
        }
        let result = (0, pg_format_1.default)('COALESCE(%I, \'{}\'::jsonb)', this.currentColumn);
        for (const [key, value] of entries) {
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                result = (0, pg_format_1.default)('jsonb_set(%s, %L, COALESCE(%I->%L, \'{}\'::jsonb) || %L::jsonb, true)', result, `{${key}}`, this.currentColumn, key, JSON.stringify(value));
            }
            else {
                const jsonbValue = typeof value === 'string' ? `"${value}"` : JSON.stringify(value);
                result = (0, pg_format_1.default)('jsonb_set(%s, %L, %L::jsonb, true)', result, `{${key}}`, jsonbValue);
            }
        }
        return result;
    }
    renameField(oldKey, newKey) {
        return (0, pg_format_1.default)('(COALESCE(%I, \'{}\'::jsonb) || jsonb_build_object(%L, %I->%L)) - %L', this.currentColumn, newKey, this.currentColumn, oldKey, oldKey);
    }
    increment(path, amount = 1) {
        const pathArray = Array.isArray(path) ? path : [path];
        const pathStr = `{${pathArray.join(',')}}`;
        const extractExpr = pathArray.length === 1
            ? (0, pg_format_1.default)('%I->>%L', this.currentColumn, pathArray[0])
            : (0, pg_format_1.default)('%I#>>%L', this.currentColumn, pathStr);
        return (0, pg_format_1.default)('jsonb_set(COALESCE(%I, \'{}\'::jsonb), %L, ((COALESCE((%s)::numeric, 0) + %s)::text)::jsonb, true)', this.currentColumn, pathStr, extractExpr, amount);
    }
    decrement(path, amount = 1) {
        return this.increment(path, -amount);
    }
    multiply(path, factor) {
        const pathArray = Array.isArray(path) ? path : [path];
        const pathStr = `{${pathArray.join(',')}}`;
        const extractExpr = pathArray.length === 1
            ? (0, pg_format_1.default)('%I->>%L', this.currentColumn, pathArray[0])
            : (0, pg_format_1.default)('%I#>>%L', this.currentColumn, pathStr);
        return (0, pg_format_1.default)('jsonb_set(COALESCE(%I, \'{}\'::jsonb), %L, ((COALESCE((%s)::numeric, 0) * %s)::text)::jsonb, true)', this.currentColumn, pathStr, extractExpr, factor);
    }
    toggle(path) {
        const pathArray = Array.isArray(path) ? path : [path];
        const pathStr = `{${pathArray.join(',')}}`;
        const extractExpr = pathArray.length === 1
            ? (0, pg_format_1.default)('%I->%L', this.currentColumn, pathArray[0])
            : (0, pg_format_1.default)('%I#>%L', this.currentColumn, pathStr);
        return (0, pg_format_1.default)('jsonb_set(COALESCE(%I, \'{}\'::jsonb), %L, (NOT COALESCE((%s)::boolean, false))::text::jsonb, true)', this.currentColumn, pathStr, extractExpr);
    }
    setTimestamp(path) {
        const pathArray = Array.isArray(path) ? path : [path];
        const pathStr = `{${pathArray.join(',')}}`;
        return (0, pg_format_1.default)('jsonb_set(COALESCE(%I, \'{}\'::jsonb), %L, to_jsonb(NOW()), true)', this.currentColumn, pathStr);
    }
    appendString(path, suffix) {
        const pathArray = Array.isArray(path) ? path : [path];
        const pathStr = `{${pathArray.join(',')}}`;
        const extractExpr = pathArray.length === 1
            ? (0, pg_format_1.default)('%I->>%L', this.currentColumn, pathArray[0])
            : (0, pg_format_1.default)('%I#>>%L', this.currentColumn, pathStr);
        return (0, pg_format_1.default)('jsonb_set(COALESCE(%I, \'{}\'::jsonb), %L, to_jsonb(COALESCE(%s, \'\') || %L), true)', this.currentColumn, pathStr, extractExpr, suffix);
    }
    prependString(path, prefix) {
        const pathArray = Array.isArray(path) ? path : [path];
        const pathStr = `{${pathArray.join(',')}}`;
        const extractExpr = pathArray.length === 1
            ? (0, pg_format_1.default)('%I->>%L', this.currentColumn, pathArray[0])
            : (0, pg_format_1.default)('%I#>>%L', this.currentColumn, pathStr);
        return (0, pg_format_1.default)('jsonb_set(COALESCE(%I, \'{}\'::jsonb), %L, to_jsonb(%L || COALESCE(%s, \'\')), true)', this.currentColumn, pathStr, prefix, extractExpr);
    }
}
exports.JsonbUpdateBuilder = JsonbUpdateBuilder;
