import format from "../utils/pg-format.js";
import { SqlFunction } from "./sql-functions.js";
export class ArrayFunctions {
    static array_length(array, dimension = 1) {
        return new SqlFunction(format('array_length(%I, %s)', array, dimension));
    }
    static array_append(array, element) {
        return new SqlFunction(format('array_append(%I, %L)', array, element));
    }
    static array_prepend(element, array) {
        return new SqlFunction(format('array_prepend(%L, %I)', element, array));
    }
    static array_cat(array1, array2) {
        return new SqlFunction(format('array_cat(%I, %I)', array1, array2));
    }
    static array_remove(array, element) {
        return new SqlFunction(format('array_remove(%I, %L)', array, element));
    }
    static array_replace(array, from, to) {
        return new SqlFunction(format('array_replace(%I, %L, %L)', array, from, to));
    }
    static array_position(array, element) {
        return new SqlFunction(format('array_position(%I, %L)', array, element));
    }
    static array_positions(array, element) {
        return new SqlFunction(format('array_positions(%I, %L)', array, element));
    }
    static array_dims(array) {
        return new SqlFunction(format('array_dims(%I)', array));
    }
    static array_lower(array, dimension) {
        return new SqlFunction(format('array_lower(%I, %s)', array, dimension));
    }
    static array_upper(array, dimension) {
        return new SqlFunction(format('array_upper(%I, %s)', array, dimension));
    }
    static cardinality(array) {
        return new SqlFunction(format('cardinality(%I)', array));
    }
    static array_to_string(array, delimiter, nullString) {
        if (nullString !== undefined) {
            return new SqlFunction(format('array_to_string(%I, %L, %L)', array, delimiter, nullString));
        }
        return new SqlFunction(format('array_to_string(%I, %L)', array, delimiter));
    }
    static string_to_array(str, delimiter, nullString) {
        if (nullString !== undefined) {
            return new SqlFunction(format('string_to_array(%I, %L, %L)', str, delimiter, nullString));
        }
        return new SqlFunction(format('string_to_array(%I, %L)', str, delimiter));
    }
    static unnest(array) {
        return new SqlFunction(format('unnest(%I)', array));
    }
    static array_fill(value, dimensions) {
        const dims = format('%L', dimensions);
        return new SqlFunction(format('array_fill(%L, %s)', value, dims));
    }
    static array_agg(expression) {
        return new SqlFunction(format('array_agg(%I)', expression));
    }
    static array_agg_order(expression, orderBy, direction = 'ASC') {
        return new SqlFunction(format('array_agg(%I ORDER BY %I %s)', expression, orderBy, direction));
    }
}
export class JsonbFunctions {
    static jsonb_array_length(jsonb) {
        return new SqlFunction(format('jsonb_array_length(%I)', jsonb));
    }
    static jsonb_each(jsonb) {
        return new SqlFunction(format('jsonb_each(%I)', jsonb));
    }
    static jsonb_each_text(jsonb) {
        return new SqlFunction(format('jsonb_each_text(%I)', jsonb));
    }
    static jsonb_object_keys(jsonb) {
        return new SqlFunction(format('jsonb_object_keys(%I)', jsonb));
    }
    static jsonb_array_elements(jsonb) {
        return new SqlFunction(format('jsonb_array_elements(%I)', jsonb));
    }
    static jsonb_array_elements_text(jsonb) {
        return new SqlFunction(format('jsonb_array_elements_text(%I)', jsonb));
    }
    static jsonb_typeof(jsonb) {
        return new SqlFunction(format('jsonb_typeof(%I)', jsonb));
    }
    static jsonb_strip_nulls(jsonb) {
        return new SqlFunction(format('jsonb_strip_nulls(%I)', jsonb));
    }
    static jsonb_pretty(jsonb) {
        return new SqlFunction(format('jsonb_pretty(%I)', jsonb));
    }
    static jsonb_set(target, path, newValue, createMissing = true) {
        const pathStr = format('%L', `{${path.join(',')}}`);
        const valueStr = format('%L', JSON.stringify(newValue));
        return new SqlFunction(format('jsonb_set(%I, %s, %s, %s)', target, pathStr, valueStr, createMissing));
    }
    static jsonb_insert(target, path, newValue, insertAfter = false) {
        const pathStr = format('%L', `{${path.join(',')}}`);
        const valueStr = format('%L', JSON.stringify(newValue));
        return new SqlFunction(format('jsonb_insert(%I, %s, %s, %s)', target, pathStr, valueStr, insertAfter));
    }
    static jsonb_build_object(...keyValuePairs) {
        const args = keyValuePairs.map((v, idx) => idx % 2 === 0
            ? format('%L', v)
            : (typeof v === 'string' && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(v))
                ? format.ident(v)
                : format('%L', v)).join(', ');
        return new SqlFunction(`jsonb_build_object(${args})`);
    }
    static jsonb_build_array(...values) {
        const args = values.map(v => typeof v === 'string' && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(v)
            ? format.ident(v)
            : format('%L', v)).join(', ');
        return new SqlFunction(`jsonb_build_array(${args})`);
    }
    static jsonb_to_text(jsonb) {
        return new SqlFunction(format('%I::text', jsonb));
    }
    static text_to_jsonb(text) {
        return new SqlFunction(format('%I::jsonb', text));
    }
    static jsonb_agg(expression) {
        return new SqlFunction(format('jsonb_agg(%I)', expression));
    }
    static jsonb_object_agg(keys, values) {
        return new SqlFunction(format('jsonb_object_agg(%I, %I)', keys, values));
    }
}
export class AggregateFunctions {
    static count(expression = '*') {
        if (expression === '*') {
            return new SqlFunction('COUNT(*)');
        }
        return new SqlFunction(format('COUNT(%I)', expression));
    }
    static count_distinct(expression) {
        return new SqlFunction(format('COUNT(DISTINCT %I)', expression));
    }
    static sum(expression) {
        return new SqlFunction(format('SUM(%I)', expression));
    }
    static avg(expression) {
        return new SqlFunction(format('AVG(%I)', expression));
    }
    static min(expression) {
        return new SqlFunction(format('MIN(%I)', expression));
    }
    static max(expression) {
        return new SqlFunction(format('MAX(%I)', expression));
    }
    static string_agg(expression, delimiter) {
        return new SqlFunction(format('string_agg(%I, %L)', expression, delimiter));
    }
    static string_agg_order(expression, delimiter, orderBy, direction = 'ASC') {
        return new SqlFunction(format('string_agg(%I, %L ORDER BY %I %s)', expression, delimiter, orderBy, direction));
    }
    static bool_and(expression) {
        return new SqlFunction(format('bool_and(%I)', expression));
    }
    static bool_or(expression) {
        return new SqlFunction(format('bool_or(%I)', expression));
    }
    static every(expression) {
        return new SqlFunction(format('every(%I)', expression));
    }
    static bit_and(expression) {
        return new SqlFunction(format('bit_and(%I)', expression));
    }
    static bit_or(expression) {
        return new SqlFunction(format('bit_or(%I)', expression));
    }
    static stddev_pop(expression) {
        return new SqlFunction(format('stddev_pop(%I)', expression));
    }
    static stddev_samp(expression) {
        return new SqlFunction(format('stddev_samp(%I)', expression));
    }
    static stddev(expression) {
        return this.stddev_samp(expression);
    }
    static var_pop(expression) {
        return new SqlFunction(format('var_pop(%I)', expression));
    }
    static var_samp(expression) {
        return new SqlFunction(format('var_samp(%I)', expression));
    }
    static variance(expression) {
        return this.var_samp(expression);
    }
    static corr(y, x) {
        return new SqlFunction(format('corr(%I, %I)', y, x));
    }
    static covar_pop(y, x) {
        return new SqlFunction(format('covar_pop(%I, %I)', y, x));
    }
    static covar_samp(y, x) {
        return new SqlFunction(format('covar_samp(%I, %I)', y, x));
    }
    static percentile_cont(percentile, expression) {
        return new SqlFunction(format('percentile_cont(%s) WITHIN GROUP (ORDER BY %I)', percentile, expression));
    }
    static percentile_disc(percentile, expression) {
        return new SqlFunction(format('percentile_disc(%s) WITHIN GROUP (ORDER BY %I)', percentile, expression));
    }
    static mode(expression) {
        return new SqlFunction(format('mode() WITHIN GROUP (ORDER BY %I)', expression));
    }
}
export class ConditionalFunctions {
    static coalesce(...values) {
        const args = values.map(v => typeof v === 'string' && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(v)
            ? format.ident(v)
            : format('%L', v)).join(', ');
        return new SqlFunction(`COALESCE(${args})`);
    }
    static nullif(value1, value2) {
        const arg1 = typeof value1 === 'string' && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value1)
            ? format.ident(value1)
            : format('%L', value1);
        const arg2 = typeof value2 === 'string' && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value2)
            ? format.ident(value2)
            : format('%L', value2);
        return new SqlFunction(`NULLIF(${arg1}, ${arg2})`);
    }
}
export { ArrayFunctions as Array };
export { JsonbFunctions as Jsonb };
export { AggregateFunctions as Aggregate };
export { ConditionalFunctions as Conditional };
