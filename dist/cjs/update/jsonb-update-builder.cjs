"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonbUpdateBuilder = void 0;
const pg_format_1 = __importDefault(require("../addon/pg-format/index.cjs"));
class JsonbUpdateBuilder {
    currentColumn;
    constructor(currentColumn = '__COLUMN__') {
        this.currentColumn = currentColumn;
    }
    set(values) {
        return (0, pg_format_1.default)('%L::jsonb', JSON.stringify(values));
    }
    append(value) {
        return (0, pg_format_1.default)('%I || %L::jsonb', this.currentColumn, JSON.stringify([value]));
    }
    prepend(value) {
        return (0, pg_format_1.default)('%L::jsonb || %I', JSON.stringify([value]), this.currentColumn);
    }
    concat(values) {
        if (values.length === 0) {
            return (0, pg_format_1.default)('%I', this.currentColumn);
        }
        return (0, pg_format_1.default)('%I || %L::jsonb', this.currentColumn, JSON.stringify(values));
    }
    removeAt(index) {
        return (0, pg_format_1.default)('%I - %s', this.currentColumn, index);
    }
    removeWhere(key, value) {
        const formattedValue = (0, pg_format_1.default)('%L', value);
        return `COALESCE((SELECT jsonb_agg(elem) FROM jsonb_array_elements(${(0, pg_format_1.default)('%I', this.currentColumn)}) elem WHERE elem->>${(0, pg_format_1.default)('%L', key)} != ${formattedValue}), '[]'::jsonb)`;
    }
    removeWhereAll(conditions) {
        const whereClauses = Object.entries(conditions)
            .map(([key, value]) => `elem->>${(0, pg_format_1.default)('%L', key)} = ${(0, pg_format_1.default)('%L', value)}`)
            .join(' AND ');
        return `COALESCE((SELECT jsonb_agg(elem) FROM jsonb_array_elements(${(0, pg_format_1.default)('%I', this.currentColumn)}) elem WHERE NOT (${whereClauses})), '[]'::jsonb)`;
    }
    filterWhere(key, value) {
        const formattedValue = (0, pg_format_1.default)('%L', value);
        return `COALESCE((SELECT jsonb_agg(elem) FROM jsonb_array_elements(${(0, pg_format_1.default)('%I', this.currentColumn)}) elem WHERE elem->>${(0, pg_format_1.default)('%L', key)} = ${formattedValue}), '[]'::jsonb)`;
    }
    updateAt(index, newValue) {
        return (0, pg_format_1.default)('jsonb_set(%I, %L, %L::jsonb)', this.currentColumn, `{${index}}`, JSON.stringify(newValue));
    }
    updateWhere(matchKey, matchValue, updates) {
        const matchCondition = `elem->>${(0, pg_format_1.default)('%L', matchKey)} = ${(0, pg_format_1.default)('%L', matchValue)}`;
        const updateEntries = Object.entries(updates);
        if (updateEntries.length === 0) {
            return (0, pg_format_1.default)('%I', this.currentColumn);
        }
        let setExpr = 'elem';
        for (const [key, value] of updateEntries) {
            const jsonbValue = typeof value === 'string' ? `"${value}"` : JSON.stringify(value);
            setExpr = `jsonb_set(${setExpr}, ${(0, pg_format_1.default)('%L', `{${key}}`)}, ${(0, pg_format_1.default)('%L', jsonbValue)}::jsonb)`;
        }
        return `COALESCE((SELECT jsonb_agg(CASE WHEN ${matchCondition} THEN ${setExpr} ELSE elem END) FROM jsonb_array_elements(${(0, pg_format_1.default)('%I', this.currentColumn)}) elem), '[]'::jsonb)`;
    }
}
exports.JsonbUpdateBuilder = JsonbUpdateBuilder;
