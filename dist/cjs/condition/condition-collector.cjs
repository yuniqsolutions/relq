"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConditionCollector = void 0;
exports.buildConditionSQL = buildConditionSQL;
exports.buildConditionsSQL = buildConditionsSQL;
const pg_format_1 = __importDefault(require("../utils/pg-format.cjs"));
const jsonb_condition_builder_1 = require("./jsonb-condition-builder.cjs");
const array_condition_builder_1 = require("./array-condition-builder.cjs");
const fulltext_condition_builder_1 = require("./fulltext-condition-builder.cjs");
const range_condition_builder_1 = require("./range-condition-builder.cjs");
const geometric_condition_builder_1 = require("./geometric-condition-builder.cjs");
const network_condition_builder_1 = require("./network-condition-builder.cjs");
const postgis_condition_builder_1 = require("./postgis-condition-builder.cjs");
class ConditionCollector {
    conditions = [];
    _jsonb;
    _array;
    _fulltext;
    _range;
    _geometric;
    _network;
    _postgis;
    get jsonb() {
        if (!this._jsonb) {
            this._jsonb = new jsonb_condition_builder_1.JsonbConditionCollector(this);
        }
        return this._jsonb;
    }
    get json() {
        return this.jsonb;
    }
    get array() {
        if (!this._array) {
            this._array = new array_condition_builder_1.ArrayConditionCollector(this);
        }
        return this._array;
    }
    get fulltext() {
        if (!this._fulltext) {
            this._fulltext = new fulltext_condition_builder_1.FulltextConditionCollector(this);
        }
        return this._fulltext;
    }
    get range() {
        if (!this._range) {
            this._range = new range_condition_builder_1.RangeConditionCollector(this);
        }
        return this._range;
    }
    get geometric() {
        if (!this._geometric) {
            this._geometric = new geometric_condition_builder_1.GeometricConditionCollector(this);
        }
        return this._geometric;
    }
    get network() {
        if (!this._network) {
            this._network = new network_condition_builder_1.NetworkConditionCollector(this);
        }
        return this._network;
    }
    get postgis() {
        if (!this._postgis) {
            this._postgis = new postgis_condition_builder_1.PostgisConditionCollector(this);
        }
        return this._postgis;
    }
    equal(column, value) {
        this.conditions.push({ method: 'equal', column, values: value });
        return this;
    }
    notEqual(column, value) {
        this.conditions.push({ method: 'notEqual', column, values: value });
        return this;
    }
    lessThan(column, value) {
        this.conditions.push({ method: 'lessThan', column, values: value });
        return this;
    }
    lessThanEqual(column, value) {
        this.conditions.push({ method: 'lessThanEqual', column, values: value });
        return this;
    }
    greaterThan(column, value) {
        this.conditions.push({ method: 'greaterThan', column, values: value });
        return this;
    }
    greaterThanEqual(column, value) {
        this.conditions.push({ method: 'greaterThanEqual', column, values: value });
        return this;
    }
    isNull(column) {
        this.conditions.push({ method: 'isNull', column });
        return this;
    }
    isNotNull(column) {
        this.conditions.push({ method: 'isNotNull', column });
        return this;
    }
    between(column, start, end) {
        this.conditions.push({ method: 'between', column, values: [start, end] });
        return this;
    }
    notBetween(column, start, end) {
        this.conditions.push({ method: 'notBetween', column, values: [start, end] });
        return this;
    }
    startsWith(column, value, caseInsensitive) {
        this.conditions.push({
            method: caseInsensitive ? 'startsWithI' : 'startsWith',
            column,
            values: value
        });
        return this;
    }
    notStartsWith(column, value, caseInsensitive) {
        this.conditions.push({
            method: caseInsensitive ? 'notStartsWithI' : 'notStartsWith',
            column,
            values: value
        });
        return this;
    }
    endsWith(column, value, caseInsensitive) {
        this.conditions.push({
            method: caseInsensitive ? 'endsWithI' : 'endsWith',
            column,
            values: value
        });
        return this;
    }
    notEndsWith(column, value, caseInsensitive) {
        this.conditions.push({
            method: caseInsensitive ? 'notEndsWithI' : 'notEndsWith',
            column,
            values: value
        });
        return this;
    }
    contains(column, value, caseInsensitive) {
        this.conditions.push({
            method: caseInsensitive ? 'containsI' : 'contains',
            column,
            values: value
        });
        return this;
    }
    notContains(column, value, caseInsensitive) {
        this.conditions.push({
            method: caseInsensitive ? 'notContainsI' : 'notContains',
            column,
            values: value
        });
        return this;
    }
    like(column, pattern) {
        this.conditions.push({ method: 'like', column, values: pattern });
        return this;
    }
    notLike(column, pattern) {
        this.conditions.push({ method: 'notLike', column, values: pattern });
        return this;
    }
    ilike(column, pattern) {
        this.conditions.push({ method: 'ilike', column, values: pattern });
        return this;
    }
    notIlike(column, pattern) {
        this.conditions.push({ method: 'notIlike', column, values: pattern });
        return this;
    }
    regex(column, pattern) {
        this.conditions.push({ method: 'regex', column, values: pattern });
        return this;
    }
    iregex(column, pattern) {
        this.conditions.push({ method: 'iregex', column, values: pattern });
        return this;
    }
    notRegex(column, pattern) {
        this.conditions.push({ method: 'notRegex', column, values: pattern });
        return this;
    }
    notIregex(column, pattern) {
        this.conditions.push({ method: 'notIregex', column, values: pattern });
        return this;
    }
    similarTo(column, pattern) {
        this.conditions.push({ method: 'similarTo', column, values: pattern });
        return this;
    }
    notSimilarTo(column, pattern) {
        this.conditions.push({ method: 'notSimilarTo', column, values: pattern });
        return this;
    }
    isTrue(column) {
        this.conditions.push({ method: 'isTrue', column });
        return this;
    }
    isFalse(column) {
        this.conditions.push({ method: 'isFalse', column });
        return this;
    }
    distinctFrom(column, value) {
        this.conditions.push({ method: 'distinctFrom', column, values: value });
        return this;
    }
    notDistinctFrom(column, value) {
        this.conditions.push({ method: 'notDistinctFrom', column, values: value });
        return this;
    }
    overlaps(start, end) {
        this.conditions.push({
            method: 'overlaps',
            values: { startColumn: start[0], startValue: start[1], endColumn: end[0], endValue: end[1] }
        });
        return this;
    }
    greaterThanOrEqual(column, value) {
        return this.greaterThanEqual(column, value);
    }
    lessThanOrEqual(column, value) {
        return this.lessThanEqual(column, value);
    }
    notNull(column) {
        return this.isNotNull(column);
    }
    in(column, values) {
        this.conditions.push({ method: 'in', column, values });
        return this;
    }
    notIn(column, values) {
        this.conditions.push({ method: 'notIn', column, values });
        return this;
    }
    exists(subquery) {
        this.conditions.push({ method: 'exists', values: subquery });
        return this;
    }
    notExists(subquery) {
        this.conditions.push({ method: 'notExists', values: subquery });
        return this;
    }
    search(column, value) {
        this.conditions.push({ method: 'search', column, values: value });
        return this;
    }
    notSearch(column, value) {
        this.conditions.push({ method: 'notSearch', column, values: value });
        return this;
    }
    or(callback) {
        const subBuilder = new ConditionCollector();
        callback(subBuilder);
        this.conditions.push({ method: 'or', values: subBuilder.getConditions() });
        return this;
    }
    and(callback) {
        const subBuilder = new ConditionCollector();
        callback(subBuilder);
        this.conditions.push({ method: 'and', values: subBuilder.getConditions() });
        return this;
    }
    not(callback) {
        const subBuilder = new ConditionCollector();
        callback(subBuilder);
        this.conditions.push({ method: 'not', values: subBuilder.getConditions() });
        return this;
    }
    getConditions() {
        return this.conditions;
    }
}
exports.ConditionCollector = ConditionCollector;
function formatColumn(column) {
    if (column.includes('.')) {
        const parts = column.split('.');
        return parts.map(p => pg_format_1.default.ident(p)).join('.');
    }
    return pg_format_1.default.ident(column);
}
function buildConditionSQL(condition) {
    const { method, column, values } = condition;
    if (method.startsWith('jsonb_')) {
        return (0, jsonb_condition_builder_1.buildJsonbConditionSQL)(condition);
    }
    if (method.startsWith('array_')) {
        return (0, array_condition_builder_1.buildArrayConditionSQL)(condition);
    }
    if (method.startsWith('fulltext_')) {
        return (0, fulltext_condition_builder_1.buildFulltextConditionSQL)(condition);
    }
    if (method.startsWith('range_')) {
        return (0, range_condition_builder_1.buildRangeConditionSQL)(condition);
    }
    if (method.startsWith('geometric_')) {
        return (0, geometric_condition_builder_1.buildGeometricConditionSQL)(condition);
    }
    if (method.startsWith('network_')) {
        return (0, network_condition_builder_1.buildNetworkConditionSQL)(condition);
    }
    if (method.startsWith('postgis_')) {
        return (0, postgis_condition_builder_1.buildPostgisConditionSQL)(condition);
    }
    const col = column ? formatColumn(column) : '';
    switch (method) {
        case 'equal':
            if (Array.isArray(values) && values.length > 1) {
                return `${col} IN ${(0, pg_format_1.default)('%L', values)}`;
            }
            return `${col} = ${(0, pg_format_1.default)('%L', Array.isArray(values) ? values[0] : values)}`;
        case 'notEqual':
            if (Array.isArray(values) && values.length > 1) {
                return `${col} NOT IN ${(0, pg_format_1.default)('%L', values)}`;
            }
            return `${col} != ${(0, pg_format_1.default)('%L', Array.isArray(values) ? values[0] : values)}`;
        case 'lessThan':
            return `${col} < ${(0, pg_format_1.default)('%L', Array.isArray(values) ? values[0] : values)}`;
        case 'lessThanEqual':
            return `${col} <= ${(0, pg_format_1.default)('%L', Array.isArray(values) ? values[0] : values)}`;
        case 'greaterThan':
            return `${col} > ${(0, pg_format_1.default)('%L', Array.isArray(values) ? values[0] : values)}`;
        case 'greaterThanEqual':
            return `${col} >= ${(0, pg_format_1.default)('%L', Array.isArray(values) ? values[0] : values)}`;
        case 'isNull':
            return `${col} IS NULL`;
        case 'isNotNull':
            return `${col} IS NOT NULL`;
        case 'between': {
            const [start, end] = values;
            return `${col} BETWEEN ${(0, pg_format_1.default)('%L', start)} AND ${(0, pg_format_1.default)('%L', end)}`;
        }
        case 'notBetween': {
            const [notStart, notEnd] = values;
            return `${col} NOT BETWEEN ${(0, pg_format_1.default)('%L', notStart)} AND ${(0, pg_format_1.default)('%L', notEnd)}`;
        }
        case 'startsWith':
            return `${col} LIKE ${(0, pg_format_1.default)('%L', `${values}%`)}`;
        case 'startsWithI':
            return `${col} ILIKE ${(0, pg_format_1.default)('%L', `${values}%`)}`;
        case 'notStartsWith':
            return `${col} NOT LIKE ${(0, pg_format_1.default)('%L', `${values}%`)}`;
        case 'notStartsWithI':
            return `${col} NOT ILIKE ${(0, pg_format_1.default)('%L', `${values}%`)}`;
        case 'endsWith':
            return `${col} LIKE ${(0, pg_format_1.default)('%L', `%${values}`)}`;
        case 'endsWithI':
            return `${col} ILIKE ${(0, pg_format_1.default)('%L', `%${values}`)}`;
        case 'notEndsWith':
            return `${col} NOT LIKE ${(0, pg_format_1.default)('%L', `%${values}`)}`;
        case 'notEndsWithI':
            return `${col} NOT ILIKE ${(0, pg_format_1.default)('%L', `%${values}`)}`;
        case 'contains':
            return `${col} LIKE ${(0, pg_format_1.default)('%L', `%${values}%`)}`;
        case 'containsI':
            return `${col} ILIKE ${(0, pg_format_1.default)('%L', `%${values}%`)}`;
        case 'notContains':
            return `${col} NOT LIKE ${(0, pg_format_1.default)('%L', `%${values}%`)}`;
        case 'notContainsI':
            return `${col} NOT ILIKE ${(0, pg_format_1.default)('%L', `%${values}%`)}`;
        case 'like':
            return `${col} LIKE ${(0, pg_format_1.default)('%L', values)}`;
        case 'notLike':
            return `${col} NOT LIKE ${(0, pg_format_1.default)('%L', values)}`;
        case 'ilike':
            return `${col} ILIKE ${(0, pg_format_1.default)('%L', values)}`;
        case 'notIlike':
            return `${col} NOT ILIKE ${(0, pg_format_1.default)('%L', values)}`;
        case 'regex':
            return `${col} ~ ${(0, pg_format_1.default)('%L', values)}`;
        case 'iregex':
            return `${col} ~* ${(0, pg_format_1.default)('%L', values)}`;
        case 'notRegex':
            return `${col} !~ ${(0, pg_format_1.default)('%L', values)}`;
        case 'notIregex':
            return `${col} !~* ${(0, pg_format_1.default)('%L', values)}`;
        case 'similarTo':
            return `${col} SIMILAR TO ${(0, pg_format_1.default)('%L', values)}`;
        case 'notSimilarTo':
            return `${col} NOT SIMILAR TO ${(0, pg_format_1.default)('%L', values)}`;
        case 'isTrue':
            return `${col} IS TRUE`;
        case 'isFalse':
            return `${col} IS FALSE`;
        case 'distinctFrom':
            return `${col} IS DISTINCT FROM ${(0, pg_format_1.default)('%L', values)}`;
        case 'notDistinctFrom':
            return `${col} IS NOT DISTINCT FROM ${(0, pg_format_1.default)('%L', values)}`;
        case 'overlaps': {
            const { startColumn, startValue, endColumn, endValue } = values;
            const startCol = formatColumn(startColumn);
            const endCol = formatColumn(endColumn);
            const startVal = startValue instanceof Date ? startValue.toISOString() : startValue;
            const endVal = endValue instanceof Date ? endValue.toISOString() : endValue;
            return `(${startCol}, ${endCol}) OVERLAPS (${(0, pg_format_1.default)('%L', startVal)}, ${(0, pg_format_1.default)('%L', endVal)})`;
        }
        case 'in': {
            const valueList = Array.isArray(values) ? values : [values];
            const formattedValues = valueList.map(v => (0, pg_format_1.default)('%L', v)).join(', ');
            return `${col} IN (${formattedValues})`;
        }
        case 'notIn': {
            const valueList = Array.isArray(values) ? values : [values];
            const formattedValues = valueList.map(v => (0, pg_format_1.default)('%L', v)).join(', ');
            return `${col} NOT IN (${formattedValues})`;
        }
        case 'exists':
            return `EXISTS (${values})`;
        case 'notExists':
            return `NOT EXISTS (${values})`;
        case 'search':
            return `to_tsvector(${col}) @@ plainto_tsquery(${(0, pg_format_1.default)('%L', values)})`;
        case 'notSearch':
            return `NOT (to_tsvector(${col}) @@ plainto_tsquery(${(0, pg_format_1.default)('%L', values)}))`;
        case 'or': {
            const orConditions = values;
            return `(${orConditions.map(c => buildConditionSQL(c)).join(' OR ')})`;
        }
        case 'and': {
            const andConditions = values;
            return `(${andConditions.map(c => buildConditionSQL(c)).join(' AND ')})`;
        }
        case 'not': {
            const notConditions = values;
            return `NOT (${notConditions.map(c => buildConditionSQL(c)).join(' AND ')})`;
        }
        default:
            return '';
    }
}
function buildConditionsSQL(conditions) {
    return conditions.map(condition => buildConditionSQL(condition)).join(' AND ');
}
