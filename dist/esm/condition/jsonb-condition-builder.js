import format from "../utils/pg-format.js";
export class JsonbArrayConditionBuilder {
    parent;
    constructor(parent) {
        this.parent = parent;
    }
    length(column, operator, value) {
        this.parent.conditions.push({
            method: 'jsonb_array_length',
            column,
            values: { operator, value }
        });
        return this.parent;
    }
    isEmpty(column) {
        this.parent.conditions.push({
            method: 'jsonb_array_empty',
            column,
            values: true
        });
        return this.parent;
    }
    isNotEmpty(column) {
        this.parent.conditions.push({
            method: 'jsonb_array_empty',
            column,
            values: false
        });
        return this.parent;
    }
    contains(column, element) {
        this.parent.conditions.push({
            method: 'jsonb_array_contains_element',
            column,
            values: element
        });
        return this.parent;
    }
    containsAll(column, elements) {
        this.parent.conditions.push({
            method: 'jsonb_array_contains_all',
            column,
            values: elements
        });
        return this.parent;
    }
    containsAny(column, elements) {
        this.parent.conditions.push({
            method: 'jsonb_array_contains_any',
            column,
            values: elements
        });
        return this.parent;
    }
    any(column, key, operator, value) {
        this.parent.conditions.push({
            method: 'jsonb_array_any',
            column,
            values: { key, operator, value }
        });
        return this.parent;
    }
    all(column, key, operator, value) {
        this.parent.conditions.push({
            method: 'jsonb_array_all',
            column,
            values: { key, operator, value }
        });
        return this.parent;
    }
    anyIn(column, key, values) {
        this.parent.conditions.push({
            method: 'jsonb_array_any_in',
            column,
            values: { key, values }
        });
        return this.parent;
    }
    anyLike(column, key, pattern) {
        this.parent.conditions.push({
            method: 'jsonb_array_any_like',
            column,
            values: { key, pattern }
        });
        return this.parent;
    }
    anyILike(column, key, pattern) {
        this.parent.conditions.push({
            method: 'jsonb_array_any_ilike',
            column,
            values: { key, pattern }
        });
        return this.parent;
    }
}
export class JsonbConditionCollector {
    parent;
    _array = null;
    constructor(parent) {
        this.parent = parent;
    }
    get array() {
        if (!this._array) {
            this._array = new JsonbArrayConditionBuilder(this.parent);
        }
        return this._array;
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
    isNull(column) {
        this.parent.conditions.push({
            method: 'jsonb_is_null',
            column,
            values: true
        });
        return this.parent;
    }
    isNotNull(column) {
        this.parent.conditions.push({
            method: 'jsonb_is_null',
            column,
            values: false
        });
        return this.parent;
    }
    typeOf(column, path, type) {
        this.parent.conditions.push({
            method: 'jsonb_typeof',
            column,
            values: { path: Array.isArray(path) ? path : [path], type }
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
    extractNotEqual(column, path, value) {
        this.parent.conditions.push({
            method: 'jsonb_extract_not_equal',
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
    extractGreaterThanOrEqual(column, path, value) {
        this.parent.conditions.push({
            method: 'jsonb_extract_gte',
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
    extractLessThanOrEqual(column, path, value) {
        this.parent.conditions.push({
            method: 'jsonb_extract_lte',
            column,
            values: { path, value }
        });
        return this.parent;
    }
    extractBetween(column, path, min, max) {
        this.parent.conditions.push({
            method: 'jsonb_extract_between',
            column,
            values: { path, min, max }
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
    extractNotIn(column, path, values) {
        this.parent.conditions.push({
            method: 'jsonb_extract_not_in',
            column,
            values: { path, values }
        });
        return this.parent;
    }
    extractLike(column, path, pattern) {
        this.parent.conditions.push({
            method: 'jsonb_extract_like',
            column,
            values: { path, pattern }
        });
        return this.parent;
    }
    extractILike(column, path, pattern) {
        this.parent.conditions.push({
            method: 'jsonb_extract_ilike',
            column,
            values: { path, pattern }
        });
        return this.parent;
    }
    extractIsNull(column, path) {
        this.parent.conditions.push({
            method: 'jsonb_extract_is_null',
            column,
            values: { path, isNull: true }
        });
        return this.parent;
    }
    extractIsNotNull(column, path) {
        this.parent.conditions.push({
            method: 'jsonb_extract_is_null',
            column,
            values: { path, isNull: false }
        });
        return this.parent;
    }
}
export function buildJsonbConditionSQL(condition) {
    const { method, column, values } = condition;
    switch (method) {
        case 'jsonb_contains':
            return format('%I @> %L', column, JSON.stringify(values));
        case 'jsonb_contained_by':
            return format('%I <@ %L', column, JSON.stringify(values));
        case 'jsonb_has_key':
            return format('%I ? %L', column, values);
        case 'jsonb_has_any_keys':
            return format('%I ?| ARRAY[%s]', column, values.map(k => format('%L', k)).join(','));
        case 'jsonb_has_all_keys':
            return format('%I ?& ARRAY[%s]', column, values.map(k => format('%L', k)).join(','));
        case 'jsonb_is_null':
            return values ? format('%I IS NULL', column) : format('%I IS NOT NULL', column);
        case 'jsonb_typeof': {
            const { path, type } = values;
            const pathStr = `{${path.join(',')}}`;
            return format('jsonb_typeof(%I#>%L) = %L', column, pathStr, type);
        }
        case 'jsonb_extract':
            return format('%I#>%L', column, `{${values.join(',')}}`);
        case 'jsonb_extract_text':
            return format('%I#>>%L', column, `{${values.join(',')}}`);
        case 'jsonb_get':
            return format('%I->%L', column, values);
        case 'jsonb_get_text':
            return format('%I->>%L', column, values);
        case 'jsonb_extract_equal': {
            const { path, value } = values;
            return format('%I#>>%L = %L', column, `{${path.join(',')}}`, value);
        }
        case 'jsonb_extract_not_equal': {
            const { path, value } = values;
            return format('%I#>>%L != %L', column, `{${path.join(',')}}`, value);
        }
        case 'jsonb_extract_gt': {
            const { path, value } = values;
            return format('(%I#>>%L)::numeric > %L', column, `{${path.join(',')}}`, value);
        }
        case 'jsonb_extract_gte': {
            const { path, value } = values;
            return format('(%I#>>%L)::numeric >= %L', column, `{${path.join(',')}}`, value);
        }
        case 'jsonb_extract_lt': {
            const { path, value } = values;
            return format('(%I#>>%L)::numeric < %L', column, `{${path.join(',')}}`, value);
        }
        case 'jsonb_extract_lte': {
            const { path, value } = values;
            return format('(%I#>>%L)::numeric <= %L', column, `{${path.join(',')}}`, value);
        }
        case 'jsonb_extract_between': {
            const { path, min, max } = values;
            return format('(%I#>>%L)::numeric BETWEEN %L AND %L', column, `{${path.join(',')}}`, min, max);
        }
        case 'jsonb_extract_in': {
            const { path, values: inValues } = values;
            const inList = inValues.map(v => format('%L', v)).join(', ');
            return format('%I#>>%L IN (%s)', column, `{${path.join(',')}}`, inList);
        }
        case 'jsonb_extract_not_in': {
            const { path, values: inValues } = values;
            const inList = inValues.map(v => format('%L', v)).join(', ');
            return format('%I#>>%L NOT IN (%s)', column, `{${path.join(',')}}`, inList);
        }
        case 'jsonb_extract_like': {
            const { path, pattern } = values;
            return format('%I#>>%L LIKE %L', column, `{${path.join(',')}}`, pattern);
        }
        case 'jsonb_extract_ilike': {
            const { path, pattern } = values;
            return format('%I#>>%L ILIKE %L', column, `{${path.join(',')}}`, pattern);
        }
        case 'jsonb_extract_is_null': {
            const { path, isNull } = values;
            const pathStr = `{${path.join(',')}}`;
            if (isNull) {
                return format('(%I#>%L IS NULL OR %I#>%L = \'null\'::jsonb)', column, pathStr, column, pathStr);
            }
            return format('(%I#>%L IS NOT NULL AND %I#>%L != \'null\'::jsonb)', column, pathStr, column, pathStr);
        }
        case 'jsonb_array_length': {
            const { operator, value } = values;
            return format('jsonb_array_length(COALESCE(%I, \'[]\'::jsonb)) %s %s', column, operator, value);
        }
        case 'jsonb_array_empty': {
            const isEmpty = values;
            if (isEmpty) {
                return format('jsonb_array_length(COALESCE(%I, \'[]\'::jsonb)) = 0', column);
            }
            return format('jsonb_array_length(COALESCE(%I, \'[]\'::jsonb)) > 0', column);
        }
        case 'jsonb_array_contains_element':
            return format('%I @> %L', column, JSON.stringify([values]));
        case 'jsonb_array_contains_all':
            return format('%I @> %L', column, JSON.stringify(values));
        case 'jsonb_array_contains_any': {
            const elements = values;
            const conditions = elements.map(el => format('%I @> %L', column, JSON.stringify([el])));
            return `(${conditions.join(' OR ')})`;
        }
        case 'jsonb_array_any': {
            const { key, operator, value } = values;
            const isNumeric = typeof value === 'number';
            const cast = isNumeric ? '::numeric' : '';
            return format('EXISTS (SELECT 1 FROM jsonb_array_elements(COALESCE(%I, \'[]\'::jsonb)) elem WHERE (elem->>%L)%s %s %L)', column, key, cast, operator, value);
        }
        case 'jsonb_array_all': {
            const { key, operator, value } = values;
            const isNumeric = typeof value === 'number';
            const cast = isNumeric ? '::numeric' : '';
            return format('NOT EXISTS (SELECT 1 FROM jsonb_array_elements(COALESCE(%I, \'[]\'::jsonb)) elem WHERE NOT ((elem->>%L)%s %s %L))', column, key, cast, operator, value);
        }
        case 'jsonb_array_any_in': {
            const { key, values: inValues } = values;
            const inList = inValues.map(v => format('%L', v)).join(', ');
            return format('EXISTS (SELECT 1 FROM jsonb_array_elements(COALESCE(%I, \'[]\'::jsonb)) elem WHERE elem->>%L IN (%s))', column, key, inList);
        }
        case 'jsonb_array_any_like': {
            const { key, pattern } = values;
            return format('EXISTS (SELECT 1 FROM jsonb_array_elements(COALESCE(%I, \'[]\'::jsonb)) elem WHERE elem->>%L LIKE %L)', column, key, pattern);
        }
        case 'jsonb_array_any_ilike': {
            const { key, pattern } = values;
            return format('EXISTS (SELECT 1 FROM jsonb_array_elements(COALESCE(%I, \'[]\'::jsonb)) elem WHERE elem->>%L ILIKE %L)', column, key, pattern);
        }
        default:
            return '';
    }
}
