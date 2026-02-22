import format from "../utils/pg-format.js";
import { ArrayStringConditionBuilder } from "./array-string-condition-builder.js";
import { ArrayNumericConditionBuilder } from "./array-numeric-condition-builder.js";
import { ArrayUuidConditionBuilder, ArrayDateConditionBuilder, ArrayJsonbConditionBuilder } from "./array-specialized-condition-builder.js";
export class ArrayConditionCollector {
    parent;
    string;
    numeric;
    integer;
    uuid;
    date;
    timestamp;
    jsonb;
    constructor(parent) {
        this.parent = parent;
        this.string = new ArrayStringConditionBuilder(parent);
        this.numeric = new ArrayNumericConditionBuilder(parent);
        this.integer = this.numeric;
        this.uuid = new ArrayUuidConditionBuilder(parent);
        this.date = new ArrayDateConditionBuilder(parent);
        this.timestamp = this.date;
        this.jsonb = new ArrayJsonbConditionBuilder(parent);
    }
    contains(column, values) {
        this.parent.conditions.push({
            method: 'array_contains',
            column,
            values
        });
        return this.parent;
    }
    containedBy(column, values) {
        this.parent.conditions.push({
            method: 'array_contained_by',
            column,
            values
        });
        return this.parent;
    }
    overlaps(column, values) {
        this.parent.conditions.push({
            method: 'array_overlaps',
            column,
            values
        });
        return this.parent;
    }
    equal(column, values) {
        this.parent.conditions.push({
            method: 'array_equal',
            column,
            values
        });
        return this.parent;
    }
    notEqual(column, values) {
        this.parent.conditions.push({
            method: 'array_not_equal',
            column,
            values
        });
        return this.parent;
    }
    any(column, operator, value) {
        this.parent.conditions.push({
            method: 'array_any',
            column,
            values: { operator, value }
        });
        return this.parent;
    }
    all(column, operator, value) {
        this.parent.conditions.push({
            method: 'array_all',
            column,
            values: { operator, value }
        });
        return this.parent;
    }
    length(column, length) {
        this.parent.conditions.push({
            method: 'array_length',
            column,
            values: length
        });
        return this.parent;
    }
    slice(column, start, end, values) {
        this.parent.conditions.push({
            method: 'array_slice',
            column,
            values: { start, end, values }
        });
        return this.parent;
    }
    atIndex(column, index, value) {
        this.parent.conditions.push({
            method: 'array_at_index',
            column,
            values: { index, value }
        });
        return this.parent;
    }
    containsPattern(column, pattern, matchType = 'prefix') {
        this.parent.conditions.push({
            method: 'array_contains_pattern',
            column,
            values: { pattern, matchType }
        });
        return this.parent;
    }
    containsPrefix(column, prefix) {
        return this.containsPattern(column, prefix, 'prefix');
    }
    containsSuffix(column, suffix) {
        return this.containsPattern(column, suffix, 'suffix');
    }
    containsSubstring(column, substring) {
        return this.containsPattern(column, substring, 'contains');
    }
    append(column, value) {
        this.parent.conditions.push({
            method: 'array_append_value',
            column,
            values: value
        });
        return this.parent;
    }
    prepend(column, value) {
        this.parent.conditions.push({
            method: 'array_prepend_value',
            column,
            values: value
        });
        return this.parent;
    }
    remove(column, value) {
        this.parent.conditions.push({
            method: 'array_remove_value',
            column,
            values: value
        });
        return this.parent;
    }
    removePattern(column, pattern, matchType = 'prefix') {
        this.parent.conditions.push({
            method: 'array_remove_pattern',
            column,
            values: { pattern, matchType }
        });
        return this.parent;
    }
    removePrefix(column, prefix) {
        return this.removePattern(column, prefix, 'prefix');
    }
    removeSuffix(column, suffix) {
        return this.removePattern(column, suffix, 'suffix');
    }
    removeSubstring(column, substring) {
        return this.removePattern(column, substring, 'contains');
    }
    updatePattern(column, pattern, replacement, matchType = 'prefix') {
        this.parent.conditions.push({
            method: 'array_update_pattern',
            column,
            values: { pattern, replacement, matchType }
        });
        return this.parent;
    }
    updatePrefix(column, prefix, replacement) {
        return this.updatePattern(column, prefix, replacement, 'prefix');
    }
    updateSuffix(column, suffix, replacement) {
        return this.updatePattern(column, suffix, replacement, 'suffix');
    }
    updateSubstring(column, substring, replacement) {
        return this.updatePattern(column, substring, replacement, 'contains');
    }
    hasNonMatching(column, pattern, matchType = 'prefix') {
        this.parent.conditions.push({
            method: 'array_has_non_matching',
            column,
            values: { pattern, matchType }
        });
        return this.parent;
    }
    hasNonMatchingPrefix(column, prefix) {
        return this.hasNonMatching(column, prefix, 'prefix');
    }
    hasNonMatchingSuffix(column, suffix) {
        return this.hasNonMatching(column, suffix, 'suffix');
    }
    allMatch(column, pattern, matchType = 'prefix') {
        this.parent.conditions.push({
            method: 'array_all_match',
            column,
            values: { pattern, matchType }
        });
        return this.parent;
    }
    allMatchPrefix(column, prefix) {
        return this.allMatch(column, prefix, 'prefix');
    }
    allMatchSuffix(column, suffix) {
        return this.allMatch(column, suffix, 'suffix');
    }
    allMatchSubstring(column, substring) {
        return this.allMatch(column, substring, 'contains');
    }
}
function formatLikePattern(pattern, matchType) {
    switch (matchType) {
        case 'prefix':
            return `${pattern}%`;
        case 'suffix':
            return `%${pattern}`;
        case 'contains':
            return `%${pattern}%`;
        case 'exact':
            return pattern;
        default:
            return `${pattern}%`;
    }
}
export function buildArrayConditionSQL(condition) {
    const { method, column, values } = condition;
    switch (method) {
        case 'array_contains':
            return format('%I @> ARRAY[%s]', column, values.map(v => format('%L', v)).join(','));
        case 'array_contained_by':
            return format('%I <@ ARRAY[%s]', column, values.map(v => format('%L', v)).join(','));
        case 'array_overlaps':
            return format('%I && ARRAY[%s]', column, values.map(v => format('%L', v)).join(','));
        case 'array_equal':
            return format('%I = ARRAY[%s]', column, values.map(v => format('%L', v)).join(','));
        case 'array_not_equal':
            return format('%I <> ARRAY[%s]', column, values.map(v => format('%L', v)).join(','));
        case 'array_any': {
            const { operator, value } = values;
            return format('%L %s ANY(%I)', value, operator, column);
        }
        case 'array_all': {
            const { operator, value } = values;
            return format('%L %s ALL(%I)', value, operator, column);
        }
        case 'array_length':
            return format('array_length(%I, 1) = %L', column, values);
        case 'array_slice': {
            const { start, end, values: sliceValues } = values;
            return format('%I[%s:%s] = ARRAY[%s]', column, start, end, sliceValues.map(v => format('%L', v)).join(','));
        }
        case 'array_at_index': {
            const { index, value } = values;
            return format('%I[%s] = %L', column, index, value);
        }
        case 'array_contains_pattern': {
            const { pattern, matchType } = values;
            const likePattern = formatLikePattern(pattern, matchType);
            if (matchType === 'exact') {
                return format('EXISTS (SELECT 1 FROM unnest(%I) AS elem WHERE elem = %L)', column, pattern);
            }
            return format('EXISTS (SELECT 1 FROM unnest(%I) AS elem WHERE elem LIKE %L)', column, likePattern);
        }
        case 'array_has_non_matching': {
            const { pattern, matchType } = values;
            const likePattern = formatLikePattern(pattern, matchType);
            if (matchType === 'exact') {
                return format('EXISTS (SELECT 1 FROM unnest(%I) AS elem WHERE elem <> %L)', column, pattern);
            }
            return format('EXISTS (SELECT 1 FROM unnest(%I) AS elem WHERE elem NOT LIKE %L)', column, likePattern);
        }
        case 'array_all_match': {
            const { pattern, matchType } = values;
            const likePattern = formatLikePattern(pattern, matchType);
            if (matchType === 'exact') {
                return format('NOT EXISTS (SELECT 1 FROM unnest(%I) AS elem WHERE elem <> %L)', column, pattern);
            }
            return format('NOT EXISTS (SELECT 1 FROM unnest(%I) AS elem WHERE elem NOT LIKE %L)', column, likePattern);
        }
        case 'array_append_value':
            return format('array_append(%I, %L)', column, values);
        case 'array_prepend_value':
            return format('array_prepend(%L, %I)', values, column);
        case 'array_remove_value':
            return format('array_remove(%I, %L)', column, values);
        case 'array_remove_pattern': {
            const { pattern, matchType } = values;
            const likePattern = formatLikePattern(pattern, matchType);
            if (matchType === 'exact') {
                return format('ARRAY(SELECT elem FROM unnest(%I) AS elem WHERE elem <> %L)', column, pattern);
            }
            return format('ARRAY(SELECT elem FROM unnest(%I) AS elem WHERE elem NOT LIKE %L)', column, likePattern);
        }
        case 'array_update_pattern': {
            const { pattern, replacement, matchType } = values;
            const likePattern = formatLikePattern(pattern, matchType);
            if (matchType === 'exact') {
                return format('ARRAY(SELECT CASE WHEN elem = %L THEN %L ELSE elem END FROM unnest(%I) AS elem)', pattern, replacement, column);
            }
            return format('ARRAY(SELECT CASE WHEN elem LIKE %L THEN %L ELSE elem END FROM unnest(%I) AS elem)', likePattern, replacement, column);
        }
        case 'array_string_starts_with': {
            const { prefix } = values;
            return format('EXISTS (SELECT 1 FROM unnest(%I) AS elem WHERE elem LIKE %L)', column, `${prefix}%`);
        }
        case 'array_string_ends_with': {
            const { suffix } = values;
            return format('EXISTS (SELECT 1 FROM unnest(%I) AS elem WHERE elem LIKE %L)', column, `%${suffix}`);
        }
        case 'array_string_contains': {
            const { substring } = values;
            return format('EXISTS (SELECT 1 FROM unnest(%I) AS elem WHERE elem LIKE %L)', column, `%${substring}%`);
        }
        case 'array_string_matches': {
            const { pattern } = values;
            return format('EXISTS (SELECT 1 FROM unnest(%I) AS elem WHERE elem ~ %L)', column, pattern);
        }
        case 'array_string_imatches': {
            const { pattern } = values;
            return format('EXISTS (SELECT 1 FROM unnest(%I) AS elem WHERE elem ~* %L)', column, pattern);
        }
        case 'array_string_ilike': {
            const { pattern } = values;
            return format('EXISTS (SELECT 1 FROM unnest(%I) AS elem WHERE elem ILIKE %L)', column, pattern);
        }
        case 'array_string_all_start_with': {
            const { prefix } = values;
            return format('NOT EXISTS (SELECT 1 FROM unnest(%I) AS elem WHERE elem NOT LIKE %L)', column, `${prefix}%`);
        }
        case 'array_string_all_end_with': {
            const { suffix } = values;
            return format('NOT EXISTS (SELECT 1 FROM unnest(%I) AS elem WHERE elem NOT LIKE %L)', column, `%${suffix}`);
        }
        case 'array_string_all_contain': {
            const { substring } = values;
            return format('NOT EXISTS (SELECT 1 FROM unnest(%I) AS elem WHERE elem NOT LIKE %L)', column, `%${substring}%`);
        }
        case 'array_string_length_between': {
            const { min, max } = values;
            if (max !== undefined) {
                return format('EXISTS (SELECT 1 FROM unnest(%I) AS elem WHERE length(elem) BETWEEN %s AND %s)', column, min, max);
            }
            return format('EXISTS (SELECT 1 FROM unnest(%I) AS elem WHERE length(elem) >= %s)', column, min);
        }
        case 'array_string_has_empty':
            return format('EXISTS (SELECT 1 FROM unnest(%I) AS elem WHERE elem = \'\')', column);
        case 'array_string_has_non_empty':
            return format('EXISTS (SELECT 1 FROM unnest(%I) AS elem WHERE elem <> \'\')', column);
        case 'array_string_has_uppercase':
            return format('EXISTS (SELECT 1 FROM unnest(%I) AS elem WHERE elem ~ \'[A-Z]\')', column);
        case 'array_string_has_lowercase':
            return format('EXISTS (SELECT 1 FROM unnest(%I) AS elem WHERE elem ~ \'[a-z]\')', column);
        case 'array_string_has_numeric':
            return format('EXISTS (SELECT 1 FROM unnest(%I) AS elem WHERE elem ~ \'^[0-9]+$\')', column);
        case 'array_string_equals': {
            const { value } = values;
            return format('EXISTS (SELECT 1 FROM unnest(%I) AS elem WHERE elem = %L)', column, value);
        }
        case 'array_string_iequals': {
            const { value } = values;
            return format('EXISTS (SELECT 1 FROM unnest(%I) AS elem WHERE LOWER(elem) = LOWER(%L))', column, value);
        }
        case 'array_numeric_greater_than': {
            const { value } = values;
            return format('EXISTS (SELECT 1 FROM unnest(%I) AS elem WHERE elem > %s)', column, value);
        }
        case 'array_numeric_greater_than_or_equal': {
            const { value } = values;
            return format('EXISTS (SELECT 1 FROM unnest(%I) AS elem WHERE elem >= %s)', column, value);
        }
        case 'array_numeric_less_than': {
            const { value } = values;
            return format('EXISTS (SELECT 1 FROM unnest(%I) AS elem WHERE elem < %s)', column, value);
        }
        case 'array_numeric_less_than_or_equal': {
            const { value } = values;
            return format('EXISTS (SELECT 1 FROM unnest(%I) AS elem WHERE elem <= %s)', column, value);
        }
        case 'array_numeric_between': {
            const { min, max } = values;
            return format('EXISTS (SELECT 1 FROM unnest(%I) AS elem WHERE elem BETWEEN %s AND %s)', column, min, max);
        }
        case 'array_numeric_all_greater_than': {
            const { value } = values;
            return format('NOT EXISTS (SELECT 1 FROM unnest(%I) AS elem WHERE elem <= %s)', column, value);
        }
        case 'array_numeric_all_less_than': {
            const { value } = values;
            return format('NOT EXISTS (SELECT 1 FROM unnest(%I) AS elem WHERE elem >= %s)', column, value);
        }
        case 'array_numeric_all_between': {
            const { min, max } = values;
            return format('NOT EXISTS (SELECT 1 FROM unnest(%I) AS elem WHERE elem NOT BETWEEN %s AND %s)', column, min, max);
        }
        case 'array_numeric_sum_equals': {
            const { target } = values;
            return format('(SELECT SUM(elem) FROM unnest(%I) AS elem) = %s', column, target);
        }
        case 'array_numeric_sum_greater_than': {
            const { target } = values;
            return format('(SELECT SUM(elem) FROM unnest(%I) AS elem) > %s', column, target);
        }
        case 'array_numeric_sum_less_than': {
            const { target } = values;
            return format('(SELECT SUM(elem) FROM unnest(%I) AS elem) < %s', column, target);
        }
        case 'array_numeric_avg_equals': {
            const { target } = values;
            return format('(SELECT AVG(elem) FROM unnest(%I) AS elem) = %s', column, target);
        }
        case 'array_numeric_avg_greater_than': {
            const { target } = values;
            return format('(SELECT AVG(elem) FROM unnest(%I) AS elem) > %s', column, target);
        }
        case 'array_numeric_avg_less_than': {
            const { target } = values;
            return format('(SELECT AVG(elem) FROM unnest(%I) AS elem) < %s', column, target);
        }
        case 'array_numeric_max_equals': {
            const { target } = values;
            return format('(SELECT MAX(elem) FROM unnest(%I) AS elem) = %s', column, target);
        }
        case 'array_numeric_min_equals': {
            const { target } = values;
            return format('(SELECT MIN(elem) FROM unnest(%I) AS elem) = %s', column, target);
        }
        case 'array_numeric_equals': {
            const { value } = values;
            return format('EXISTS (SELECT 1 FROM unnest(%I) AS elem WHERE elem = %s)', column, value);
        }
        case 'array_numeric_has_even':
            return format('EXISTS (SELECT 1 FROM unnest(%I) AS elem WHERE elem %% 2 = 0)', column);
        case 'array_numeric_has_odd':
            return format('EXISTS (SELECT 1 FROM unnest(%I) AS elem WHERE elem %% 2 <> 0)', column);
        case 'array_numeric_has_positive':
            return format('EXISTS (SELECT 1 FROM unnest(%I) AS elem WHERE elem > 0)', column);
        case 'array_numeric_has_negative':
            return format('EXISTS (SELECT 1 FROM unnest(%I) AS elem WHERE elem < 0)', column);
        case 'array_numeric_has_zero':
            return format('EXISTS (SELECT 1 FROM unnest(%I) AS elem WHERE elem = 0)', column);
        case 'array_uuid_all_valid':
            return format('NOT EXISTS (SELECT 1 FROM unnest(%I) AS elem WHERE elem::text !~ \'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$\')', column);
        case 'array_uuid_has_version': {
            const { version } = values;
            return format('EXISTS (SELECT 1 FROM unnest(%I) AS elem WHERE substring(elem::text from 15 for 1) = %L)', column, String(version));
        }
        case 'array_uuid_equals': {
            const { uuid } = values;
            return format('EXISTS (SELECT 1 FROM unnest(%I) AS elem WHERE elem = %L::uuid)', column, uuid);
        }
        case 'array_date_before': {
            const { date } = values;
            return format('EXISTS (SELECT 1 FROM unnest(%I) AS elem WHERE elem < %L::timestamp)', column, date);
        }
        case 'array_date_after': {
            const { date } = values;
            return format('EXISTS (SELECT 1 FROM unnest(%I) AS elem WHERE elem > %L::timestamp)', column, date);
        }
        case 'array_date_between': {
            const { start, end } = values;
            return format('EXISTS (SELECT 1 FROM unnest(%I) AS elem WHERE elem BETWEEN %L::timestamp AND %L::timestamp)', column, start, end);
        }
        case 'array_date_within_days': {
            const { days } = values;
            if (days >= 0) {
                return format('EXISTS (SELECT 1 FROM unnest(%I) AS elem WHERE elem BETWEEN NOW() AND NOW() + INTERVAL \'%s days\')', column, days);
            }
            return format('EXISTS (SELECT 1 FROM unnest(%I) AS elem WHERE elem BETWEEN NOW() - INTERVAL \'%s days\' AND NOW())', column, Math.abs(days));
        }
        case 'array_date_equals': {
            const { date } = values;
            return format('EXISTS (SELECT 1 FROM unnest(%I) AS elem WHERE elem = %L::timestamp)', column, date);
        }
        case 'array_date_has_today':
            return format('EXISTS (SELECT 1 FROM unnest(%I) AS elem WHERE elem::date = CURRENT_DATE)', column);
        case 'array_date_has_past':
            return format('EXISTS (SELECT 1 FROM unnest(%I) AS elem WHERE elem < NOW())', column);
        case 'array_date_has_future':
            return format('EXISTS (SELECT 1 FROM unnest(%I) AS elem WHERE elem > NOW())', column);
        case 'array_date_has_this_week':
            return format('EXISTS (SELECT 1 FROM unnest(%I) AS elem WHERE date_trunc(\'week\', elem) = date_trunc(\'week\', NOW()))', column);
        case 'array_date_has_this_month':
            return format('EXISTS (SELECT 1 FROM unnest(%I) AS elem WHERE date_trunc(\'month\', elem) = date_trunc(\'month\', NOW()))', column);
        case 'array_date_has_this_year':
            return format('EXISTS (SELECT 1 FROM unnest(%I) AS elem WHERE date_trunc(\'year\', elem) = date_trunc(\'year\', NOW()))', column);
        case 'array_jsonb_has_key': {
            const { key } = values;
            return format('EXISTS (SELECT 1 FROM unnest(%I) AS elem WHERE elem ? %L)', column, key);
        }
        case 'array_jsonb_has_path': {
            const { path } = values;
            const pathArray = path.split('.').map((p) => p.trim());
            return format('EXISTS (SELECT 1 FROM unnest(%I) AS elem WHERE elem #> %L IS NOT NULL)', column, `{${pathArray.join(',')}}`);
        }
        case 'array_jsonb_contains': {
            const { value } = values;
            return format('EXISTS (SELECT 1 FROM unnest(%I) AS elem WHERE elem @> %L::jsonb)', column, JSON.stringify(value));
        }
        case 'array_jsonb_contained_by': {
            const { value } = values;
            return format('EXISTS (SELECT 1 FROM unnest(%I) AS elem WHERE elem <@ %L::jsonb)', column, JSON.stringify(value));
        }
        case 'array_jsonb_equals': {
            const { value } = values;
            return format('EXISTS (SELECT 1 FROM unnest(%I) AS elem WHERE elem = %L::jsonb)', column, JSON.stringify(value));
        }
        case 'array_jsonb_path_equals': {
            const { path, value } = values;
            const pathArray = path.split('.').map((p) => p.trim());
            return format('EXISTS (SELECT 1 FROM unnest(%I) AS elem WHERE elem #> %L = %L::jsonb)', column, `{${pathArray.join(',')}}`, JSON.stringify(value));
        }
        case 'array_jsonb_has_object':
            return format('EXISTS (SELECT 1 FROM unnest(%I) AS elem WHERE jsonb_typeof(elem) = \'object\')', column);
        case 'array_jsonb_has_array':
            return format('EXISTS (SELECT 1 FROM unnest(%I) AS elem WHERE jsonb_typeof(elem) = \'array\')', column);
        default:
            return '';
    }
}
