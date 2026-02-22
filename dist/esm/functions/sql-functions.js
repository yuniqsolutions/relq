import format from "../utils/pg-format.js";
export class SqlFunction {
    expression;
    constructor(expression) {
        this.expression = expression;
    }
    as(alias) {
        return `${this.expression} AS ${format.ident(alias)}`;
    }
    toString() {
        return this.expression;
    }
}
export class StringFunctions {
    static concat(...values) {
        const args = values.map(v => typeof v === 'string' && v.includes('.') || /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(v)
            ? format.ident(v)
            : format('%L', v)).join(', ');
        return new SqlFunction(`concat(${args})`);
    }
    static concat_ws(separator, ...values) {
        const sep = format('%L', separator);
        const args = values.map(v => typeof v === 'string' && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(v)
            ? format.ident(v)
            : format('%L', v)).join(', ');
        return new SqlFunction(`concat_ws(${sep}, ${args})`);
    }
    static lower(value) {
        return new SqlFunction(format('lower(%I)', value));
    }
    static upper(value) {
        return new SqlFunction(format('upper(%I)', value));
    }
    static initcap(value) {
        return new SqlFunction(format('initcap(%I)', value));
    }
    static substring(str, start, length) {
        const args = length
            ? format('%I, %s, %s', str, start, length)
            : format('%I, %s', str, start);
        return new SqlFunction(`substring(${args})`);
    }
    static substr(str, start, length) {
        return this.substring(str, start, length);
    }
    static strLength(value) {
        return new SqlFunction(format('length(%I)', value));
    }
    static char_length(value) {
        return new SqlFunction(format('char_length(%I)', value));
    }
    static octet_length(value) {
        return new SqlFunction(format('octet_length(%I)', value));
    }
    static bit_length(value) {
        return new SqlFunction(format('bit_length(%I)', value));
    }
    static trim(str, chars, side = 'both') {
        if (chars) {
            const sideStr = side === 'both' ? 'BOTH' : side === 'leading' ? 'LEADING' : 'TRAILING';
            return new SqlFunction(format(`trim(${sideStr} %L FROM %I)`, chars, str));
        }
        return new SqlFunction(format('trim(%I)', str));
    }
    static ltrim(str, chars) {
        if (chars) {
            return new SqlFunction(format('ltrim(%I, %L)', str, chars));
        }
        return new SqlFunction(format('ltrim(%I)', str));
    }
    static rtrim(str, chars) {
        if (chars) {
            return new SqlFunction(format('rtrim(%I, %L)', str, chars));
        }
        return new SqlFunction(format('rtrim(%I)', str));
    }
    static btrim(str, chars) {
        return this.trim(str, chars, 'both');
    }
    static position(substring, str) {
        return new SqlFunction(format('position(%L IN %I)', substring, str));
    }
    static strpos(str, substring) {
        return new SqlFunction(format('strpos(%I, %L)', str, substring));
    }
    static replace(str, from, to) {
        return new SqlFunction(format('replace(%I, %L, %L)', str, from, to));
    }
    static translate(str, from, to) {
        return new SqlFunction(format('translate(%I, %L, %L)', str, from, to));
    }
    static repeat(str, n) {
        return new SqlFunction(format('repeat(%I, %s)', str, n));
    }
    static lpad(str, length, fill = ' ') {
        return new SqlFunction(format('lpad(%I, %s, %L)', str, length, fill));
    }
    static rpad(str, length, fill = ' ') {
        return new SqlFunction(format('rpad(%I, %s, %L)', str, length, fill));
    }
    static reverse(str) {
        return new SqlFunction(format('reverse(%I)', str));
    }
    static split_part(str, delimiter, position) {
        return new SqlFunction(format('split_part(%I, %L, %s)', str, delimiter, position));
    }
    static regexp_match(str, pattern, flags) {
        if (flags) {
            return new SqlFunction(format('regexp_match(%I, %L, %L)', str, pattern, flags));
        }
        return new SqlFunction(format('regexp_match(%I, %L)', str, pattern));
    }
    static regexp_matches(str, pattern, flags) {
        if (flags) {
            return new SqlFunction(format('regexp_matches(%I, %L, %L)', str, pattern, flags));
        }
        return new SqlFunction(format('regexp_matches(%I, %L)', str, pattern));
    }
    static regexp_replace(str, pattern, replacement, flags) {
        if (flags) {
            return new SqlFunction(format('regexp_replace(%I, %L, %L, %L)', str, pattern, replacement, flags));
        }
        return new SqlFunction(format('regexp_replace(%I, %L, %L)', str, pattern, replacement));
    }
    static regexp_split_to_array(str, pattern, flags) {
        if (flags) {
            return new SqlFunction(format('regexp_split_to_array(%I, %L, %L)', str, pattern, flags));
        }
        return new SqlFunction(format('regexp_split_to_array(%I, %L)', str, pattern));
    }
    static regexp_split_to_table(str, pattern, flags) {
        if (flags) {
            return new SqlFunction(format('regexp_split_to_table(%I, %L, %L)', str, pattern, flags));
        }
        return new SqlFunction(format('regexp_split_to_table(%I, %L)', str, pattern));
    }
    static encode(data, fmt) {
        return new SqlFunction(format('encode(%I, %L)', data, fmt));
    }
    static decode(data, fmt) {
        return new SqlFunction(format('decode(%I, %L)', data, fmt));
    }
    static md5(str) {
        return new SqlFunction(format('md5(%I)', str));
    }
    static ascii(str) {
        return new SqlFunction(format('ascii(%I)', str));
    }
    static chr(code) {
        return new SqlFunction(`chr(${code})`);
    }
    static to_hex(num) {
        const arg = typeof num === 'string' ? format.ident(num) : num;
        return new SqlFunction(`to_hex(${arg})`);
    }
    static lpad_zero(str, width) {
        return new SqlFunction(format('lpad(%I, %s, \'0\')', str, width));
    }
    static format(formatStr, ...values) {
        const args = [format('%L', formatStr), ...values.map(v => typeof v === 'string' && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(v)
                ? format.ident(v)
                : format('%L', v))].join(', ');
        return new SqlFunction(`format(${args})`);
    }
    static quote_ident(str) {
        return new SqlFunction(format('quote_ident(%I)', str));
    }
    static quote_literal(str) {
        return new SqlFunction(format('quote_literal(%I)', str));
    }
    static quote_nullable(str) {
        return new SqlFunction(format('quote_nullable(%I)', str));
    }
}
export class DateTimeFunctions {
    static now() {
        return new SqlFunction('now()');
    }
    static current_date() {
        return new SqlFunction('CURRENT_DATE');
    }
    static current_time() {
        return new SqlFunction('CURRENT_TIME');
    }
    static current_timestamp() {
        return new SqlFunction('CURRENT_TIMESTAMP');
    }
    static transaction_timestamp() {
        return new SqlFunction('transaction_timestamp()');
    }
    static statement_timestamp() {
        return new SqlFunction('statement_timestamp()');
    }
    static clock_timestamp() {
        return new SqlFunction('clock_timestamp()');
    }
    static localtimestamp() {
        return new SqlFunction('localtimestamp');
    }
    static date_trunc(field, source) {
        return new SqlFunction(format('date_trunc(%L, %I)', field, source));
    }
    static extract(field, source) {
        return new SqlFunction(format('extract(%s FROM %I)', field.toUpperCase(), source));
    }
    static date_part(field, source) {
        return new SqlFunction(format('date_part(%L, %I)', field, source));
    }
    static age(timestamp1, timestamp2) {
        if (timestamp2) {
            return new SqlFunction(format('age(%I, %I)', timestamp1, timestamp2));
        }
        return new SqlFunction(format('age(%I)', timestamp1));
    }
    static make_date(year, month, day) {
        const y = typeof year === 'string' ? format.ident(year) : year;
        const m = typeof month === 'string' ? format.ident(month) : month;
        const d = typeof day === 'string' ? format.ident(day) : day;
        return new SqlFunction(`make_date(${y}, ${m}, ${d})`);
    }
    static make_time(hour, min, sec) {
        const h = typeof hour === 'string' ? format.ident(hour) : hour;
        const m = typeof min === 'string' ? format.ident(min) : min;
        const s = typeof sec === 'string' ? format.ident(sec) : sec;
        return new SqlFunction(`make_time(${h}, ${m}, ${s})`);
    }
    static make_timestamp(year, month, day, hour, min, sec) {
        const args = [year, month, day, hour, min, sec].map(v => typeof v === 'string' ? format.ident(v) : v).join(', ');
        return new SqlFunction(`make_timestamp(${args})`);
    }
    static make_interval(years, months, weeks, days, hours, mins, secs) {
        const parts = [];
        if (years !== undefined)
            parts.push(`years => ${years}`);
        if (months !== undefined)
            parts.push(`months => ${months}`);
        if (weeks !== undefined)
            parts.push(`weeks => ${weeks}`);
        if (days !== undefined)
            parts.push(`days => ${days}`);
        if (hours !== undefined)
            parts.push(`hours => ${hours}`);
        if (mins !== undefined)
            parts.push(`mins => ${mins}`);
        if (secs !== undefined)
            parts.push(`secs => ${secs}`);
        return new SqlFunction(`make_interval(${parts.join(', ')})`);
    }
    static to_timestamp(unixTimestamp) {
        const arg = typeof unixTimestamp === 'string' ? format.ident(unixTimestamp) : unixTimestamp;
        return new SqlFunction(`to_timestamp(${arg})`);
    }
    static to_timestamp_format(text, formatPattern) {
        return new SqlFunction(format('to_timestamp(%I, %L)', text, formatPattern));
    }
    static to_date(text, formatPattern) {
        return new SqlFunction(format('to_date(%I, %L)', text, formatPattern));
    }
    static to_char(timestamp, formatPattern) {
        return new SqlFunction(format('to_char(%I, %L)', timestamp, formatPattern));
    }
    static timezone(timestamp, timezone) {
        return new SqlFunction(format('timezone(%L, %I)', timezone, timestamp));
    }
    static justify_days(interval) {
        return new SqlFunction(format('justify_days(%I)', interval));
    }
    static justify_hours(interval) {
        return new SqlFunction(format('justify_hours(%I)', interval));
    }
    static justify_interval(interval) {
        return new SqlFunction(format('justify_interval(%I)', interval));
    }
    static isfinite(date) {
        return new SqlFunction(format('isfinite(%I)', date));
    }
}
export class MathFunctions {
    static abs(x) {
        const arg = typeof x === 'string' ? format.ident(x) : x;
        return new SqlFunction(`abs(${arg})`);
    }
    static sign(x) {
        const arg = typeof x === 'string' ? format.ident(x) : x;
        return new SqlFunction(`sign(${arg})`);
    }
    static ceil(x) {
        const arg = typeof x === 'string' ? format.ident(x) : x;
        return new SqlFunction(`ceil(${arg})`);
    }
    static ceiling(x) {
        return this.ceil(x);
    }
    static floor(x) {
        const arg = typeof x === 'string' ? format.ident(x) : x;
        return new SqlFunction(`floor(${arg})`);
    }
    static round(x, decimals = 0) {
        const arg = typeof x === 'string' ? format.ident(x) : x;
        return new SqlFunction(`round(${arg}, ${decimals})`);
    }
    static trunc(x, decimals = 0) {
        const arg = typeof x === 'string' ? format.ident(x) : x;
        return new SqlFunction(`trunc(${arg}, ${decimals})`);
    }
    static mod(dividend, divisor) {
        const arg = typeof dividend === 'string' ? format.ident(dividend) : dividend;
        return new SqlFunction(`mod(${arg}, ${divisor})`);
    }
    static div(dividend, divisor) {
        const arg = typeof dividend === 'string' ? format.ident(dividend) : dividend;
        return new SqlFunction(`div(${arg}, ${divisor})`);
    }
    static power(x, y) {
        const arg = typeof x === 'string' ? format.ident(x) : x;
        return new SqlFunction(`power(${arg}, ${y})`);
    }
    static sqrt(x) {
        const arg = typeof x === 'string' ? format.ident(x) : x;
        return new SqlFunction(`sqrt(${arg})`);
    }
    static cbrt(x) {
        const arg = typeof x === 'string' ? format.ident(x) : x;
        return new SqlFunction(`cbrt(${arg})`);
    }
    static exp(x) {
        const arg = typeof x === 'string' ? format.ident(x) : x;
        return new SqlFunction(`exp(${arg})`);
    }
    static ln(x) {
        const arg = typeof x === 'string' ? format.ident(x) : x;
        return new SqlFunction(`ln(${arg})`);
    }
    static log10(x) {
        const arg = typeof x === 'string' ? format.ident(x) : x;
        return new SqlFunction(`log10(${arg})`);
    }
    static log(base, x) {
        const arg = typeof x === 'string' ? format.ident(x) : x;
        return new SqlFunction(`log(${base}, ${arg})`);
    }
    static pi() {
        return new SqlFunction('pi()');
    }
    static degrees(radians) {
        const arg = typeof radians === 'string' ? format.ident(radians) : radians;
        return new SqlFunction(`degrees(${arg})`);
    }
    static radians(degrees) {
        const arg = typeof degrees === 'string' ? format.ident(degrees) : degrees;
        return new SqlFunction(`radians(${arg})`);
    }
    static sin(x) {
        const arg = typeof x === 'string' ? format.ident(x) : x;
        return new SqlFunction(`sin(${arg})`);
    }
    static cos(x) {
        const arg = typeof x === 'string' ? format.ident(x) : x;
        return new SqlFunction(`cos(${arg})`);
    }
    static tan(x) {
        const arg = typeof x === 'string' ? format.ident(x) : x;
        return new SqlFunction(`tan(${arg})`);
    }
    static asin(x) {
        const arg = typeof x === 'string' ? format.ident(x) : x;
        return new SqlFunction(`asin(${arg})`);
    }
    static acos(x) {
        const arg = typeof x === 'string' ? format.ident(x) : x;
        return new SqlFunction(`acos(${arg})`);
    }
    static atan(x) {
        const arg = typeof x === 'string' ? format.ident(x) : x;
        return new SqlFunction(`atan(${arg})`);
    }
    static atan2(y, x) {
        const yArg = typeof y === 'string' ? format.ident(y) : y;
        const xArg = typeof x === 'string' ? format.ident(x) : x;
        return new SqlFunction(`atan2(${yArg}, ${xArg})`);
    }
    static random() {
        return new SqlFunction('random()');
    }
    static setseed(seed) {
        return new SqlFunction(`setseed(${seed})`);
    }
    static gcd(a, b) {
        const aArg = typeof a === 'string' ? format.ident(a) : a;
        const bArg = typeof b === 'string' ? format.ident(b) : b;
        return new SqlFunction(`gcd(${aArg}, ${bArg})`);
    }
    static lcm(a, b) {
        const aArg = typeof a === 'string' ? format.ident(a) : a;
        const bArg = typeof b === 'string' ? format.ident(b) : b;
        return new SqlFunction(`lcm(${aArg}, ${bArg})`);
    }
    static factorial(n) {
        const arg = typeof n === 'string' ? format.ident(n) : n;
        return new SqlFunction(`factorial(${arg})`);
    }
    static greatest(...values) {
        const args = values.map(v => typeof v === 'string' && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(v)
            ? format.ident(v)
            : format('%L', v)).join(', ');
        return new SqlFunction(`greatest(${args})`);
    }
    static least(...values) {
        const args = values.map(v => typeof v === 'string' && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(v)
            ? format.ident(v)
            : format('%L', v)).join(', ');
        return new SqlFunction(`least(${args})`);
    }
    static width_bucket(operand, min, max, count) {
        const arg = typeof operand === 'string' ? format.ident(operand) : operand;
        return new SqlFunction(`width_bucket(${arg}, ${min}, ${max}, ${count})`);
    }
}
export { StringFunctions as String };
export { DateTimeFunctions as DateTime };
export { MathFunctions as Math };
