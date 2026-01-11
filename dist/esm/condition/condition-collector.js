import format from "../addon/pg-format/index.js";
import { JsonbConditionCollector, buildJsonbConditionSQL } from "./jsonb-condition-builder.js";
import { ArrayConditionCollector, buildArrayConditionSQL } from "./array-condition-builder.js";
import { FulltextConditionCollector, buildFulltextConditionSQL } from "./fulltext-condition-builder.js";
import { RangeConditionCollector, buildRangeConditionSQL } from "./range-condition-builder.js";
import { GeometricConditionCollector, buildGeometricConditionSQL } from "./geometric-condition-builder.js";
import { NetworkConditionCollector, buildNetworkConditionSQL } from "./network-condition-builder.js";
export class ConditionCollector {
    conditions = [];
    _jsonb;
    _array;
    _fulltext;
    _range;
    _geometric;
    _network;
    get jsonb() {
        if (!this._jsonb) {
            this._jsonb = new JsonbConditionCollector(this);
        }
        return this._jsonb;
    }
    get array() {
        if (!this._array) {
            this._array = new ArrayConditionCollector(this);
        }
        return this._array;
    }
    get fulltext() {
        if (!this._fulltext) {
            this._fulltext = new FulltextConditionCollector(this);
        }
        return this._fulltext;
    }
    get range() {
        if (!this._range) {
            this._range = new RangeConditionCollector(this);
        }
        return this._range;
    }
    get geometric() {
        if (!this._geometric) {
            this._geometric = new GeometricConditionCollector(this);
        }
        return this._geometric;
    }
    get network() {
        if (!this._network) {
            this._network = new NetworkConditionCollector(this);
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
function formatColumn(column) {
    if (column.includes('.')) {
        const parts = column.split('.');
        return parts.map(p => format.ident(p)).join('.');
    }
    return format.ident(column);
}
export function buildConditionSQL(condition) {
    const { method, column, values } = condition;
    if (method.startsWith('jsonb_')) {
        return buildJsonbConditionSQL(condition);
    }
    if (method.startsWith('array_')) {
        return buildArrayConditionSQL(condition);
    }
    if (method.startsWith('fulltext_')) {
        return buildFulltextConditionSQL(condition);
    }
    if (method.startsWith('range_')) {
        return buildRangeConditionSQL(condition);
    }
    if (method.startsWith('geometric_')) {
        return buildGeometricConditionSQL(condition);
    }
    if (method.startsWith('network_')) {
        return buildNetworkConditionSQL(condition);
    }
    const col = column ? formatColumn(column) : '';
    switch (method) {
        case 'equal':
            if (Array.isArray(values) && values.length > 1) {
                return `${col} IN ${format('%L', values)}`;
            }
            return `${col} = ${format('%L', Array.isArray(values) ? values[0] : values)}`;
        case 'notEqual':
            if (Array.isArray(values) && values.length > 1) {
                return `${col} NOT IN ${format('%L', values)}`;
            }
            return `${col} != ${format('%L', Array.isArray(values) ? values[0] : values)}`;
        case 'lessThan':
            return `${col} < ${format('%L', Array.isArray(values) ? values[0] : values)}`;
        case 'lessThanEqual':
            return `${col} <= ${format('%L', Array.isArray(values) ? values[0] : values)}`;
        case 'greaterThan':
            return `${col} > ${format('%L', Array.isArray(values) ? values[0] : values)}`;
        case 'greaterThanEqual':
            return `${col} >= ${format('%L', Array.isArray(values) ? values[0] : values)}`;
        case 'isNull':
            return `${col} IS NULL`;
        case 'isNotNull':
            return `${col} IS NOT NULL`;
        case 'between': {
            const [start, end] = values;
            return `${col} BETWEEN ${format('%L', start)} AND ${format('%L', end)}`;
        }
        case 'notBetween': {
            const [notStart, notEnd] = values;
            return `${col} NOT BETWEEN ${format('%L', notStart)} AND ${format('%L', notEnd)}`;
        }
        case 'startsWith':
            return `${col} LIKE ${format('%L', `${values}%`)}`;
        case 'notStartsWith':
            return `${col} NOT LIKE ${format('%L', `${values}%`)}`;
        case 'endsWith':
            return `${col} LIKE ${format('%L', `%${values}`)}`;
        case 'notEndsWith':
            return `${col} NOT LIKE ${format('%L', `%${values}`)}`;
        case 'contains':
            return `${col} LIKE ${format('%L', `%${values}%`)}`;
        case 'notContains':
            return `${col} NOT LIKE ${format('%L', `%${values}%`)}`;
        case 'like':
            return `${col} LIKE ${format('%L', values)}`;
        case 'notLike':
            return `${col} NOT LIKE ${format('%L', values)}`;
        case 'ilike':
            return `${col} ILIKE ${format('%L', values)}`;
        case 'in': {
            const valueList = Array.isArray(values) ? values : [values];
            const formattedValues = valueList.map(v => format('%L', v)).join(', ');
            return `${col} IN (${formattedValues})`;
        }
        case 'notIn': {
            const valueList = Array.isArray(values) ? values : [values];
            const formattedValues = valueList.map(v => format('%L', v)).join(', ');
            return `${col} NOT IN (${formattedValues})`;
        }
        case 'exists':
            return `EXISTS (${values})`;
        case 'notExists':
            return `NOT EXISTS (${values})`;
        case 'search':
            return `to_tsvector(${col}) @@ plainto_tsquery(${format('%L', values)})`;
        case 'notSearch':
            return `NOT (to_tsvector(${col}) @@ plainto_tsquery(${format('%L', values)}))`;
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
export function buildConditionsSQL(conditions) {
    return conditions.map(condition => buildConditionSQL(condition)).join(' AND ');
}
