"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConditionCollector = void 0;
exports.buildConditionSQL = buildConditionSQL;
exports.buildConditionsSQL = buildConditionsSQL;
const pg_format_1 = __importDefault(require("../addon/pg-format/index.cjs"));
const jsonb_condition_builder_1 = require("./jsonb-condition-builder.cjs");
const array_condition_builder_1 = require("./array-condition-builder.cjs");
const fulltext_condition_builder_1 = require("./fulltext-condition-builder.cjs");
const range_condition_builder_1 = require("./range-condition-builder.cjs");
const geometric_condition_builder_1 = require("./geometric-condition-builder.cjs");
const network_condition_builder_1 = require("./network-condition-builder.cjs");
class ConditionCollector {
    conditions = [];
    _jsonb;
    _array;
    _fulltext;
    _range;
    _geometric;
    _network;
    get jsonb() {
        if (!this._jsonb) {
            this._jsonb = new jsonb_condition_builder_1.JsonbConditionCollector(this);
        }
        return this._jsonb;
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
    startsWith(column, value) {
        this.conditions.push({ method: 'startsWith', column, values: value });
        return this;
    }
    notStartsWith(column, value) {
        this.conditions.push({ method: 'notStartsWith', column, values: value });
        return this;
    }
    endsWith(column, value) {
        this.conditions.push({ method: 'endsWith', column, values: value });
        return this;
    }
    notEndsWith(column, value) {
        this.conditions.push({ method: 'notEndsWith', column, values: value });
        return this;
    }
    contains(column, value) {
        this.conditions.push({ method: 'contains', column, values: value });
        return this;
    }
    notContains(column, value) {
        this.conditions.push({ method: 'notContains', column, values: value });
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
    raw(condition) {
        this.conditions.push({ method: 'raw', values: condition });
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
        case 'notStartsWith':
            return `${col} NOT LIKE ${(0, pg_format_1.default)('%L', `${values}%`)}`;
        case 'endsWith':
            return `${col} LIKE ${(0, pg_format_1.default)('%L', `%${values}`)}`;
        case 'notEndsWith':
            return `${col} NOT LIKE ${(0, pg_format_1.default)('%L', `%${values}`)}`;
        case 'contains':
            return `${col} LIKE ${(0, pg_format_1.default)('%L', `%${values}%`)}`;
        case 'notContains':
            return `${col} NOT LIKE ${(0, pg_format_1.default)('%L', `%${values}%`)}`;
        case 'like':
            return `${col} LIKE ${(0, pg_format_1.default)('%L', values)}`;
        case 'notLike':
            return `${col} NOT LIKE ${(0, pg_format_1.default)('%L', values)}`;
        case 'ilike':
            return `${col} ILIKE ${(0, pg_format_1.default)('%L', values)}`;
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
        case 'raw':
            return values;
        default:
            return '';
    }
}
function buildConditionsSQL(conditions) {
    return conditions.map(condition => buildConditionSQL(condition)).join(' AND ');
}
