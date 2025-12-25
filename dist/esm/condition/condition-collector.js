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
    switch (method) {
        case 'equal':
            if (Array.isArray(values) && values.length > 1) {
                return format('%I IN %L', column, values);
            }
            return format('%I = %L', column, Array.isArray(values) ? values[0] : values);
        case 'notEqual':
            if (Array.isArray(values) && values.length > 1) {
                return format('%I NOT IN %L', column, values);
            }
            return format('%I != %L', column, Array.isArray(values) ? values[0] : values);
        case 'lessThan':
            return format('%I < %L', column, Array.isArray(values) ? values[0] : values);
        case 'lessThanEqual':
            return format('%I <= %L', column, Array.isArray(values) ? values[0] : values);
        case 'greaterThan':
            return format('%I > %L', column, Array.isArray(values) ? values[0] : values);
        case 'greaterThanEqual':
            return format('%I >= %L', column, Array.isArray(values) ? values[0] : values);
        case 'isNull':
            return format('%I IS NULL', column);
        case 'isNotNull':
            return format('%I IS NOT NULL', column);
        case 'between': {
            const [start, end] = values;
            return format('%I BETWEEN %L AND %L', column, start, end);
        }
        case 'notBetween': {
            const [notStart, notEnd] = values;
            return format('%I NOT BETWEEN %L AND %L', column, notStart, notEnd);
        }
        case 'startsWith':
            return format('%I LIKE %L', column, `${values}%`);
        case 'notStartsWith':
            return format('%I NOT LIKE %L', column, `${values}%`);
        case 'endsWith':
            return format('%I LIKE %L', column, `%${values}`);
        case 'notEndsWith':
            return format('%I NOT LIKE %L', column, `%${values}`);
        case 'contains':
            return format('%I LIKE %L', column, `%${values}%`);
        case 'notContains':
            return format('%I NOT LIKE %L', column, `%${values}%`);
        case 'like':
            return format('%I LIKE %L', column, values);
        case 'notLike':
            return format('%I NOT LIKE %L', column, values);
        case 'ilike':
            return format('%I ILIKE %L', column, values);
        case 'in': {
            const valueList = Array.isArray(values) ? values : [values];
            const formattedValues = valueList.map(v => format('%L', v)).join(', ');
            return format('%I IN (%s)', column, formattedValues);
        }
        case 'notIn': {
            const valueList = Array.isArray(values) ? values : [values];
            const formattedValues = valueList.map(v => format('%L', v)).join(', ');
            return format('%I NOT IN (%s)', column, formattedValues);
        }
        case 'exists':
            return format('EXISTS (%s)', values);
        case 'notExists':
            return format('NOT EXISTS (%s)', values);
        case 'search':
            return format('to_tsvector(%I) @@ plainto_tsquery(%L)', column, values);
        case 'notSearch':
            return format('NOT (to_tsvector(%I) @@ plainto_tsquery(%L))', column, values);
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
