"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonbConditionCollector = void 0;
exports.buildJsonbConditionSQL = buildJsonbConditionSQL;
const pg_format_1 = __importDefault(require("../addon/pg-format/index.cjs"));
class JsonbConditionCollector {
    parent;
    constructor(parent) {
        this.parent = parent;
    }
    contains(column, value) {
        this.parent.conditions.push({
            method: 'jsonb_contains',
            column,
            values: value
        });
        return this.parent;
    }
    containedBy(column, value) {
        this.parent.conditions.push({
            method: 'jsonb_contained_by',
            column,
            values: value
        });
        return this.parent;
    }
    hasKey(column, key) {
        this.parent.conditions.push({
            method: 'jsonb_has_key',
            column,
            values: key
        });
        return this.parent;
    }
    hasAnyKeys(column, keys) {
        this.parent.conditions.push({
            method: 'jsonb_has_any_keys',
            column,
            values: keys
        });
        return this.parent;
    }
    hasAllKeys(column, keys) {
        this.parent.conditions.push({
            method: 'jsonb_has_all_keys',
            column,
            values: keys
        });
        return this.parent;
    }
    extract(column, path) {
        this.parent.conditions.push({
            method: 'jsonb_extract',
            column,
            values: path
        });
        return this.parent;
    }
    extractText(column, path) {
        this.parent.conditions.push({
            method: 'jsonb_extract_text',
            column,
            values: path
        });
        return this.parent;
    }
    get(column, key) {
        this.parent.conditions.push({
            method: 'jsonb_get',
            column,
            values: key
        });
        return this.parent;
    }
    getText(column, key) {
        this.parent.conditions.push({
            method: 'jsonb_get_text',
            column,
            values: key
        });
        return this.parent;
    }
    extractEqual(column, path, value) {
        this.parent.conditions.push({
            method: 'jsonb_extract_equal',
            column,
            values: { path, value }
        });
        return this.parent;
    }
    extractGreaterThan(column, path, value) {
        this.parent.conditions.push({
            method: 'jsonb_extract_gt',
            column,
            values: { path, value }
        });
        return this.parent;
    }
    extractLessThan(column, path, value) {
        this.parent.conditions.push({
            method: 'jsonb_extract_lt',
            column,
            values: { path, value }
        });
        return this.parent;
    }
    extractIn(column, path, values) {
        this.parent.conditions.push({
            method: 'jsonb_extract_in',
            column,
            values: { path, values }
        });
        return this.parent;
    }
}
exports.JsonbConditionCollector = JsonbConditionCollector;
function buildJsonbConditionSQL(condition) {
    const { method, column, values } = condition;
    switch (method) {
        case 'jsonb_contains':
            return (0, pg_format_1.default)('%I @> %L', column, JSON.stringify(values));
        case 'jsonb_contained_by':
            return (0, pg_format_1.default)('%I <@ %L', column, JSON.stringify(values));
        case 'jsonb_has_key':
            return (0, pg_format_1.default)('%I ? %L', column, values);
        case 'jsonb_has_any_keys':
            return (0, pg_format_1.default)('%I ?| ARRAY[%s]', column, values.map(k => (0, pg_format_1.default)('%L', k)).join(','));
        case 'jsonb_has_all_keys':
            return (0, pg_format_1.default)('%I ?& ARRAY[%s]', column, values.map(k => (0, pg_format_1.default)('%L', k)).join(','));
        case 'jsonb_extract':
            return (0, pg_format_1.default)('%I#>%L', column, `{${values.join(',')}}`);
        case 'jsonb_extract_text':
            return (0, pg_format_1.default)('%I#>>%L', column, `{${values.join(',')}}`);
        case 'jsonb_get':
            return (0, pg_format_1.default)('%I->%L', column, values);
        case 'jsonb_get_text':
            return (0, pg_format_1.default)('%I->>%L', column, values);
        case 'jsonb_extract_equal': {
            const { path, value } = values;
            return (0, pg_format_1.default)('%I#>>%L = %L', column, `{${path.join(',')}}`, value);
        }
        case 'jsonb_extract_gt': {
            const { path, value } = values;
            return (0, pg_format_1.default)('(%I#>>%L)::numeric > %L', column, `{${path.join(',')}}`, value);
        }
        case 'jsonb_extract_lt': {
            const { path, value } = values;
            return (0, pg_format_1.default)('(%I#>>%L)::numeric < %L', column, `{${path.join(',')}}`, value);
        }
        case 'jsonb_extract_in': {
            const { path, values: inValues } = values;
            return (0, pg_format_1.default)('%I#>>%L IN %L', column, `{${path.join(',')}}`, inValues);
        }
        default:
            return '';
    }
}
