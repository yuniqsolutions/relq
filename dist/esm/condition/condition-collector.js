import format from "../utils/pg-format.js";
import { JsonbConditionCollector, buildJsonbConditionSQL } from "./jsonb-condition-builder.js";
import { ArrayConditionCollector, buildArrayConditionSQL } from "./array-condition-builder.js";
import { FulltextConditionCollector, buildFulltextConditionSQL } from "./fulltext-condition-builder.js";
import { RangeConditionCollector, buildRangeConditionSQL } from "./range-condition-builder.js";
import { GeometricConditionCollector, buildGeometricConditionSQL } from "./geometric-condition-builder.js";
import { NetworkConditionCollector, buildNetworkConditionSQL } from "./network-condition-builder.js";
import { PostgisConditionCollector, buildPostgisConditionSQL } from "./postgis-condition-builder.js";
export class ConditionCollector {
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
            this._jsonb = new JsonbConditionCollector(this);
        }
        return this._jsonb;
    }
    get json() {
        return this.jsonb;
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
    get postgis() {
        if (!this._postgis) {
            this._postgis = new PostgisConditionCollector(this);
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
    if (method.startsWith('postgis_')) {
        return buildPostgisConditionSQL(condition);
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
        case 'startsWithI':
            return `${col} ILIKE ${format('%L', `${values}%`)}`;
        case 'notStartsWith':
            return `${col} NOT LIKE ${format('%L', `${values}%`)}`;
        case 'notStartsWithI':
            return `${col} NOT ILIKE ${format('%L', `${values}%`)}`;
        case 'endsWith':
            return `${col} LIKE ${format('%L', `%${values}`)}`;
        case 'endsWithI':
            return `${col} ILIKE ${format('%L', `%${values}`)}`;
        case 'notEndsWith':
            return `${col} NOT LIKE ${format('%L', `%${values}`)}`;
        case 'notEndsWithI':
            return `${col} NOT ILIKE ${format('%L', `%${values}`)}`;
        case 'contains':
            return `${col} LIKE ${format('%L', `%${values}%`)}`;
        case 'containsI':
            return `${col} ILIKE ${format('%L', `%${values}%`)}`;
        case 'notContains':
            return `${col} NOT LIKE ${format('%L', `%${values}%`)}`;
        case 'notContainsI':
            return `${col} NOT ILIKE ${format('%L', `%${values}%`)}`;
        case 'like':
            return `${col} LIKE ${format('%L', values)}`;
        case 'notLike':
            return `${col} NOT LIKE ${format('%L', values)}`;
        case 'ilike':
            return `${col} ILIKE ${format('%L', values)}`;
        case 'notIlike':
            return `${col} NOT ILIKE ${format('%L', values)}`;
        case 'regex':
            return `${col} ~ ${format('%L', values)}`;
        case 'iregex':
            return `${col} ~* ${format('%L', values)}`;
        case 'notRegex':
            return `${col} !~ ${format('%L', values)}`;
        case 'notIregex':
            return `${col} !~* ${format('%L', values)}`;
        case 'similarTo':
            return `${col} SIMILAR TO ${format('%L', values)}`;
        case 'notSimilarTo':
            return `${col} NOT SIMILAR TO ${format('%L', values)}`;
        case 'isTrue':
            return `${col} IS TRUE`;
        case 'isFalse':
            return `${col} IS FALSE`;
        case 'distinctFrom':
            return `${col} IS DISTINCT FROM ${format('%L', values)}`;
        case 'notDistinctFrom':
            return `${col} IS NOT DISTINCT FROM ${format('%L', values)}`;
        case 'overlaps': {
            const { startColumn, startValue, endColumn, endValue } = values;
            const startCol = formatColumn(startColumn);
            const endCol = formatColumn(endColumn);
            const startVal = startValue instanceof Date ? startValue.toISOString() : startValue;
            const endVal = endValue instanceof Date ? endValue.toISOString() : endValue;
            return `(${startCol}, ${endCol}) OVERLAPS (${format('%L', startVal)}, ${format('%L', endVal)})`;
        }
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
        case 'not': {
            const notConditions = values;
            return `NOT (${notConditions.map(c => buildConditionSQL(c)).join(' AND ')})`;
        }
        default:
            return '';
    }
}
export function buildConditionsSQL(conditions) {
    return conditions.map(condition => buildConditionSQL(condition)).join(' AND ');
}
