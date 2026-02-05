"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArrayUpdateBuilder = exports.ArrayJsonbUpdateBuilder = exports.ArrayDateUpdateBuilder = exports.ArrayUuidUpdateBuilder = exports.ArrayBooleanUpdateBuilder = exports.ArrayNumericUpdateBuilder = exports.ArrayStringUpdateBuilder = void 0;
const pg_format_1 = __importDefault(require("../utils/pg-format.cjs"));
class ArrayStringUpdateBuilder {
    set(values) {
        if (values.length === 0)
            return 'ARRAY[]::text[]';
        const formatted = values.map(v => (0, pg_format_1.default)('%L', v)).join(',');
        return `ARRAY[${formatted}]`;
    }
    append(value) {
        return (0, pg_format_1.default)('array_append(%I, %L)', this.getContextColumn(), value);
    }
    prepend(value) {
        return (0, pg_format_1.default)('array_prepend(%L, %I)', value, this.getContextColumn());
    }
    remove(value) {
        return (0, pg_format_1.default)('array_remove(%I, %L)', this.getContextColumn(), value);
    }
    concat(values) {
        if (values.length === 0)
            return (0, pg_format_1.default)('%I', this.getContextColumn());
        const formatted = values.map(v => (0, pg_format_1.default)('%L', v)).join(',');
        return (0, pg_format_1.default)('%I || ARRAY[%s]', this.getContextColumn(), formatted);
    }
    getContextColumn() {
        return '__COLUMN__';
    }
}
exports.ArrayStringUpdateBuilder = ArrayStringUpdateBuilder;
class ArrayNumericUpdateBuilder {
    set(values) {
        if (values.length === 0)
            return 'ARRAY[]::integer[]';
        return `ARRAY[${values.join(',')}]`;
    }
    append(value) {
        return (0, pg_format_1.default)('array_append(%I, %s)', this.getContextColumn(), value);
    }
    prepend(value) {
        return (0, pg_format_1.default)('array_prepend(%s, %I)', value, this.getContextColumn());
    }
    remove(value) {
        return (0, pg_format_1.default)('array_remove(%I, %s)', this.getContextColumn(), value);
    }
    concat(values) {
        if (values.length === 0)
            return (0, pg_format_1.default)('%I', this.getContextColumn());
        return (0, pg_format_1.default)('%I || ARRAY[%s]', this.getContextColumn(), values.join(','));
    }
    getContextColumn() {
        return '__COLUMN__';
    }
}
exports.ArrayNumericUpdateBuilder = ArrayNumericUpdateBuilder;
class ArrayBooleanUpdateBuilder {
    set(values) {
        if (values.length === 0)
            return 'ARRAY[]::boolean[]';
        return `ARRAY[${values.map(v => v.toString()).join(',')}]`;
    }
    append(value) {
        return (0, pg_format_1.default)('array_append(%I, %s)', this.getContextColumn(), value.toString());
    }
    prepend(value) {
        return (0, pg_format_1.default)('array_prepend(%s, %I)', value.toString(), this.getContextColumn());
    }
    remove(value) {
        return (0, pg_format_1.default)('array_remove(%I, %s)', this.getContextColumn(), value.toString());
    }
    concat(values) {
        if (values.length === 0)
            return (0, pg_format_1.default)('%I', this.getContextColumn());
        return (0, pg_format_1.default)('%I || ARRAY[%s]', this.getContextColumn(), values.map(v => v.toString()).join(','));
    }
    getContextColumn() {
        return '__COLUMN__';
    }
}
exports.ArrayBooleanUpdateBuilder = ArrayBooleanUpdateBuilder;
class ArrayUuidUpdateBuilder {
    set(values) {
        if (values.length === 0)
            return 'ARRAY[]::uuid[]';
        const formatted = values.map(v => (0, pg_format_1.default)('%L::uuid', v)).join(',');
        return `ARRAY[${formatted}]`;
    }
    append(value) {
        return (0, pg_format_1.default)('array_append(%I, %L::uuid)', this.getContextColumn(), value);
    }
    prepend(value) {
        return (0, pg_format_1.default)('array_prepend(%L::uuid, %I)', value, this.getContextColumn());
    }
    remove(value) {
        return (0, pg_format_1.default)('array_remove(%I, %L::uuid)', this.getContextColumn(), value);
    }
    concat(values) {
        if (values.length === 0)
            return (0, pg_format_1.default)('%I', this.getContextColumn());
        const formatted = values.map(v => (0, pg_format_1.default)('%L::uuid', v)).join(',');
        return (0, pg_format_1.default)('%I || ARRAY[%s]', this.getContextColumn(), formatted);
    }
    getContextColumn() {
        return '__COLUMN__';
    }
}
exports.ArrayUuidUpdateBuilder = ArrayUuidUpdateBuilder;
class ArrayDateUpdateBuilder {
    set(values) {
        if (values.length === 0)
            return 'ARRAY[]::timestamp[]';
        const formatted = values.map(v => {
            const dateStr = v instanceof Date ? v.toISOString() : v;
            return (0, pg_format_1.default)('%L::timestamp', dateStr);
        }).join(',');
        return `ARRAY[${formatted}]`;
    }
    append(value) {
        const dateStr = value instanceof Date ? value.toISOString() : value;
        return (0, pg_format_1.default)('array_append(%I, %L::timestamp)', this.getContextColumn(), dateStr);
    }
    prepend(value) {
        const dateStr = value instanceof Date ? value.toISOString() : value;
        return (0, pg_format_1.default)('array_prepend(%L::timestamp, %I)', dateStr, this.getContextColumn());
    }
    remove(value) {
        const dateStr = value instanceof Date ? value.toISOString() : value;
        return (0, pg_format_1.default)('array_remove(%I, %L::timestamp)', this.getContextColumn(), dateStr);
    }
    concat(values) {
        if (values.length === 0)
            return (0, pg_format_1.default)('%I', this.getContextColumn());
        const formatted = values.map(v => {
            const dateStr = v instanceof Date ? v.toISOString() : v;
            return (0, pg_format_1.default)('%L::timestamp', dateStr);
        }).join(',');
        return (0, pg_format_1.default)('%I || ARRAY[%s]', this.getContextColumn(), formatted);
    }
    getContextColumn() {
        return '__COLUMN__';
    }
}
exports.ArrayDateUpdateBuilder = ArrayDateUpdateBuilder;
class ArrayJsonbUpdateBuilder {
    set(values) {
        if (values.length === 0)
            return 'ARRAY[]::jsonb[]';
        const formatted = values.map(v => (0, pg_format_1.default)('%L::jsonb', JSON.stringify(v))).join(',');
        return `ARRAY[${formatted}]`;
    }
    append(value) {
        return (0, pg_format_1.default)('array_append(%I, %L::jsonb)', this.getContextColumn(), JSON.stringify(value));
    }
    prepend(value) {
        return (0, pg_format_1.default)('array_prepend(%L::jsonb, %I)', JSON.stringify(value), this.getContextColumn());
    }
    remove(value) {
        return (0, pg_format_1.default)('array_remove(%I, %L::jsonb)', this.getContextColumn(), JSON.stringify(value));
    }
    concat(values) {
        if (values.length === 0)
            return (0, pg_format_1.default)('%I', this.getContextColumn());
        const formatted = values.map(v => (0, pg_format_1.default)('%L::jsonb', JSON.stringify(v))).join(',');
        return (0, pg_format_1.default)('%I || ARRAY[%s]', this.getContextColumn(), formatted);
    }
    removeWhere(key, value) {
        const formattedValue = (0, pg_format_1.default)('%L', value);
        return `ARRAY(SELECT elem FROM unnest(${(0, pg_format_1.default)('%I', this.getContextColumn())}) AS elem WHERE elem->>${(0, pg_format_1.default)('%L', key)} != ${formattedValue})`;
    }
    removeWhereAll(conditions) {
        const whereClauses = Object.entries(conditions)
            .map(([key, value]) => `elem->>${(0, pg_format_1.default)('%L', key)} = ${(0, pg_format_1.default)('%L', value)}`)
            .join(' AND ');
        return `ARRAY(SELECT elem FROM unnest(${(0, pg_format_1.default)('%I', this.getContextColumn())}) AS elem WHERE NOT (${whereClauses}))`;
    }
    filterWhere(key, value) {
        const formattedValue = (0, pg_format_1.default)('%L', value);
        return `ARRAY(SELECT elem FROM unnest(${(0, pg_format_1.default)('%I', this.getContextColumn())}) AS elem WHERE elem->>${(0, pg_format_1.default)('%L', key)} = ${formattedValue})`;
    }
    updateWhere(matchKey, matchValue, updates) {
        const matchCondition = `elem->>${(0, pg_format_1.default)('%L', matchKey)} = ${(0, pg_format_1.default)('%L', matchValue)}`;
        const updateEntries = Object.entries(updates);
        if (updateEntries.length === 0) {
            return (0, pg_format_1.default)('%I', this.getContextColumn());
        }
        let setExpr = 'elem';
        for (const [key, value] of updateEntries) {
            const jsonbValue = typeof value === 'string' ? `"${value}"` : JSON.stringify(value);
            setExpr = `jsonb_set(${setExpr}, ${(0, pg_format_1.default)('%L', `{${key}}`)}, ${(0, pg_format_1.default)('%L', jsonbValue)}::jsonb)`;
        }
        return `ARRAY(SELECT CASE WHEN ${matchCondition} THEN ${setExpr} ELSE elem END FROM unnest(${(0, pg_format_1.default)('%I', this.getContextColumn())}) AS elem)`;
    }
    getContextColumn() {
        return '__COLUMN__';
    }
}
exports.ArrayJsonbUpdateBuilder = ArrayJsonbUpdateBuilder;
class ArrayUpdateBuilder {
    currentColumn;
    constructor(currentColumn) {
        this.currentColumn = currentColumn;
    }
    get string() {
        return new ArrayStringUpdateBuilder();
    }
    get numeric() {
        return new ArrayNumericUpdateBuilder();
    }
    get integer() {
        return this.numeric;
    }
    get boolean() {
        return new ArrayBooleanUpdateBuilder();
    }
    get uuid() {
        return new ArrayUuidUpdateBuilder();
    }
    get date() {
        return new ArrayDateUpdateBuilder();
    }
    get timestamp() {
        return this.date;
    }
    get jsonb() {
        return new ArrayJsonbUpdateBuilder();
    }
}
exports.ArrayUpdateBuilder = ArrayUpdateBuilder;
