"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Conditional = exports.Aggregate = exports.Jsonb = exports.Array = exports.ConditionalFunctions = exports.AggregateFunctions = exports.JsonbFunctions = exports.ArrayFunctions = void 0;
const pg_format_1 = __importDefault(require("../utils/pg-format.cjs"));
const sql_functions_1 = require("./sql-functions.cjs");
class ArrayFunctions {
    static array_length(array, dimension = 1) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('array_length(%I, %s)', array, dimension));
    }
    static array_append(array, element) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('array_append(%I, %L)', array, element));
    }
    static array_prepend(element, array) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('array_prepend(%L, %I)', element, array));
    }
    static array_cat(array1, array2) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('array_cat(%I, %I)', array1, array2));
    }
    static array_remove(array, element) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('array_remove(%I, %L)', array, element));
    }
    static array_replace(array, from, to) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('array_replace(%I, %L, %L)', array, from, to));
    }
    static array_position(array, element) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('array_position(%I, %L)', array, element));
    }
    static array_positions(array, element) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('array_positions(%I, %L)', array, element));
    }
    static array_dims(array) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('array_dims(%I)', array));
    }
    static array_lower(array, dimension) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('array_lower(%I, %s)', array, dimension));
    }
    static array_upper(array, dimension) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('array_upper(%I, %s)', array, dimension));
    }
    static cardinality(array) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('cardinality(%I)', array));
    }
    static array_to_string(array, delimiter, nullString) {
        if (nullString !== undefined) {
            return new sql_functions_1.SqlFunction((0, pg_format_1.default)('array_to_string(%I, %L, %L)', array, delimiter, nullString));
        }
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('array_to_string(%I, %L)', array, delimiter));
    }
    static string_to_array(str, delimiter, nullString) {
        if (nullString !== undefined) {
            return new sql_functions_1.SqlFunction((0, pg_format_1.default)('string_to_array(%I, %L, %L)', str, delimiter, nullString));
        }
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('string_to_array(%I, %L)', str, delimiter));
    }
    static unnest(array) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('unnest(%I)', array));
    }
    static array_fill(value, dimensions) {
        const dims = (0, pg_format_1.default)('%L', dimensions);
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('array_fill(%L, %s)', value, dims));
    }
    static array_agg(expression) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('array_agg(%I)', expression));
    }
    static array_agg_order(expression, orderBy, direction = 'ASC') {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('array_agg(%I ORDER BY %I %s)', expression, orderBy, direction));
    }
}
exports.ArrayFunctions = ArrayFunctions;
exports.Array = ArrayFunctions;
class JsonbFunctions {
    static jsonb_array_length(jsonb) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('jsonb_array_length(%I)', jsonb));
    }
    static jsonb_each(jsonb) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('jsonb_each(%I)', jsonb));
    }
    static jsonb_each_text(jsonb) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('jsonb_each_text(%I)', jsonb));
    }
    static jsonb_object_keys(jsonb) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('jsonb_object_keys(%I)', jsonb));
    }
    static jsonb_array_elements(jsonb) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('jsonb_array_elements(%I)', jsonb));
    }
    static jsonb_array_elements_text(jsonb) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('jsonb_array_elements_text(%I)', jsonb));
    }
    static jsonb_typeof(jsonb) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('jsonb_typeof(%I)', jsonb));
    }
    static jsonb_strip_nulls(jsonb) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('jsonb_strip_nulls(%I)', jsonb));
    }
    static jsonb_pretty(jsonb) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('jsonb_pretty(%I)', jsonb));
    }
    static jsonb_set(target, path, newValue, createMissing = true) {
        const pathStr = (0, pg_format_1.default)('%L', `{${path.join(',')}}`);
        const valueStr = (0, pg_format_1.default)('%L', JSON.stringify(newValue));
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('jsonb_set(%I, %s, %s, %s)', target, pathStr, valueStr, createMissing));
    }
    static jsonb_insert(target, path, newValue, insertAfter = false) {
        const pathStr = (0, pg_format_1.default)('%L', `{${path.join(',')}}`);
        const valueStr = (0, pg_format_1.default)('%L', JSON.stringify(newValue));
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('jsonb_insert(%I, %s, %s, %s)', target, pathStr, valueStr, insertAfter));
    }
    static jsonb_build_object(...keyValuePairs) {
        const args = keyValuePairs.map((v, idx) => idx % 2 === 0
            ? (0, pg_format_1.default)('%L', v)
            : (typeof v === 'string' && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(v))
                ? pg_format_1.default.ident(v)
                : (0, pg_format_1.default)('%L', v)).join(', ');
        return new sql_functions_1.SqlFunction(`jsonb_build_object(${args})`);
    }
    static jsonb_build_array(...values) {
        const args = values.map(v => typeof v === 'string' && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(v)
            ? pg_format_1.default.ident(v)
            : (0, pg_format_1.default)('%L', v)).join(', ');
        return new sql_functions_1.SqlFunction(`jsonb_build_array(${args})`);
    }
    static jsonb_to_text(jsonb) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('%I::text', jsonb));
    }
    static text_to_jsonb(text) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('%I::jsonb', text));
    }
    static jsonb_agg(expression) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('jsonb_agg(%I)', expression));
    }
    static jsonb_object_agg(keys, values) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('jsonb_object_agg(%I, %I)', keys, values));
    }
}
exports.JsonbFunctions = JsonbFunctions;
exports.Jsonb = JsonbFunctions;
class AggregateFunctions {
    static count(expression = '*') {
        if (expression === '*') {
            return new sql_functions_1.SqlFunction('COUNT(*)');
        }
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('COUNT(%I)', expression));
    }
    static count_distinct(expression) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('COUNT(DISTINCT %I)', expression));
    }
    static sum(expression) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('SUM(%I)', expression));
    }
    static avg(expression) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('AVG(%I)', expression));
    }
    static min(expression) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('MIN(%I)', expression));
    }
    static max(expression) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('MAX(%I)', expression));
    }
    static string_agg(expression, delimiter) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('string_agg(%I, %L)', expression, delimiter));
    }
    static string_agg_order(expression, delimiter, orderBy, direction = 'ASC') {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('string_agg(%I, %L ORDER BY %I %s)', expression, delimiter, orderBy, direction));
    }
    static bool_and(expression) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('bool_and(%I)', expression));
    }
    static bool_or(expression) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('bool_or(%I)', expression));
    }
    static every(expression) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('every(%I)', expression));
    }
    static bit_and(expression) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('bit_and(%I)', expression));
    }
    static bit_or(expression) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('bit_or(%I)', expression));
    }
    static stddev_pop(expression) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('stddev_pop(%I)', expression));
    }
    static stddev_samp(expression) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('stddev_samp(%I)', expression));
    }
    static stddev(expression) {
        return this.stddev_samp(expression);
    }
    static var_pop(expression) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('var_pop(%I)', expression));
    }
    static var_samp(expression) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('var_samp(%I)', expression));
    }
    static variance(expression) {
        return this.var_samp(expression);
    }
    static corr(y, x) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('corr(%I, %I)', y, x));
    }
    static covar_pop(y, x) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('covar_pop(%I, %I)', y, x));
    }
    static covar_samp(y, x) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('covar_samp(%I, %I)', y, x));
    }
    static percentile_cont(percentile, expression) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('percentile_cont(%s) WITHIN GROUP (ORDER BY %I)', percentile, expression));
    }
    static percentile_disc(percentile, expression) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('percentile_disc(%s) WITHIN GROUP (ORDER BY %I)', percentile, expression));
    }
    static mode(expression) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('mode() WITHIN GROUP (ORDER BY %I)', expression));
    }
}
exports.AggregateFunctions = AggregateFunctions;
exports.Aggregate = AggregateFunctions;
class ConditionalFunctions {
    static coalesce(...values) {
        const args = values.map(v => typeof v === 'string' && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(v)
            ? pg_format_1.default.ident(v)
            : (0, pg_format_1.default)('%L', v)).join(', ');
        return new sql_functions_1.SqlFunction(`COALESCE(${args})`);
    }
    static nullif(value1, value2) {
        const arg1 = typeof value1 === 'string' && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value1)
            ? pg_format_1.default.ident(value1)
            : (0, pg_format_1.default)('%L', value1);
        const arg2 = typeof value2 === 'string' && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value2)
            ? pg_format_1.default.ident(value2)
            : (0, pg_format_1.default)('%L', value2);
        return new sql_functions_1.SqlFunction(`NULLIF(${arg1}, ${arg2})`);
    }
}
exports.ConditionalFunctions = ConditionalFunctions;
exports.Conditional = ConditionalFunctions;
