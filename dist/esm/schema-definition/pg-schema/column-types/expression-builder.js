export function formatGenValue(val) {
    if (val === null)
        return 'NULL';
    if (typeof val === 'number')
        return String(val);
    if (typeof val === 'string')
        return `'${val.replace(/'/g, "''")}'`;
    return val.$sql;
}
export function chainableExpr(sql) {
    const expr = {
        $sql: sql,
        $expr: true,
        add(value) { return chainableExpr(`(${this.$sql} + ${formatGenValue(value)})`); },
        plus(value) { return this.add(value); },
        subtract(value) { return chainableExpr(`(${this.$sql} - ${formatGenValue(value)})`); },
        minus(value) { return this.subtract(value); },
        multiply(value) { return chainableExpr(`(${this.$sql} * ${formatGenValue(value)})`); },
        times(value) { return this.multiply(value); },
        divide(value) { return chainableExpr(`(${this.$sql} / ${formatGenValue(value)})`); },
        dividedBy(value) { return this.divide(value); },
        mod(value) { return chainableExpr(`(${this.$sql} % ${formatGenValue(value)})`); },
        concat(...args) {
            const allParts = [this.$sql, ...args.map(formatGenValue)];
            return chainableExpr(`CONCAT(${allParts.join(', ')})`);
        },
    };
    return expr;
}
export function formatFluentValue(val) {
    if (val === null)
        return 'NULL';
    if (typeof val === 'boolean')
        return val ? 'TRUE' : 'FALSE';
    if (typeof val === 'number')
        return String(val);
    if (typeof val === 'string')
        return `'${val.replace(/'/g, "''")}'`;
    return val.$sql;
}
export function createFluentGenExpr(sql) {
    const self = {
        $sql: sql,
        $expr: true,
        coalesce(fallback) {
            return createFluentGenExpr(`COALESCE(${this.$sql}, ${formatFluentValue(fallback)})`);
        },
        nullif(value) {
            return createFluentGenExpr(`NULLIF(${this.$sql}, ${formatFluentValue(value)})`);
        },
        asText() { return createFluentGenExpr(`(${this.$sql})::TEXT`); },
        asInteger() { return createFluentGenExpr(`(${this.$sql})::INTEGER`); },
        asVarchar() { return createFluentGenExpr(`(${this.$sql})::VARCHAR`); },
        asBigint() { return createFluentGenExpr(`(${this.$sql})::BIGINT`); },
        asSmallint() { return createFluentGenExpr(`(${this.$sql})::SMALLINT`); },
        asNumeric(precision, scale) {
            if (precision !== undefined && scale !== undefined) {
                return createFluentGenExpr(`(${this.$sql})::NUMERIC(${precision}, ${scale})`);
            }
            else if (precision !== undefined) {
                return createFluentGenExpr(`(${this.$sql})::NUMERIC(${precision})`);
            }
            return createFluentGenExpr(`(${this.$sql})::NUMERIC`);
        },
        asReal() { return createFluentGenExpr(`(${this.$sql})::REAL`); },
        asDouble() { return createFluentGenExpr(`(${this.$sql})::DOUBLE PRECISION`); },
        asBool() { return createFluentGenExpr(`(${this.$sql})::BOOLEAN`); },
        asDate() { return createFluentGenExpr(`(${this.$sql})::DATE`); },
        asTime() { return createFluentGenExpr(`(${this.$sql})::TIME`); },
        asTimestamp() { return createFluentGenExpr(`(${this.$sql})::TIMESTAMP`); },
        asTimestamptz() { return createFluentGenExpr(`(${this.$sql})::TIMESTAMPTZ`); },
        asInterval() { return createFluentGenExpr(`(${this.$sql})::INTERVAL`); },
        asUuid() { return createFluentGenExpr(`(${this.$sql})::UUID`); },
        asBytea() { return createFluentGenExpr(`(${this.$sql})::BYTEA`); },
        asJson() { return createFluentGenExpr(`(${this.$sql})::JSON`); },
        asJsonb() { return createFluentGenExpr(`(${this.$sql})::JSONB`); },
        cast(typeName) { return createFluentGenExpr(`(${this.$sql})::${typeName}`); },
        lower() { return createFluentGenExpr(`LOWER(${this.$sql})`); },
        upper() { return createFluentGenExpr(`UPPER(${this.$sql})`); },
        trim() { return createFluentGenExpr(`TRIM(${this.$sql})`); },
        ltrim(chars) {
            return chars ? createFluentGenExpr(`LTRIM(${this.$sql}, '${chars}')`) : createFluentGenExpr(`LTRIM(${this.$sql})`);
        },
        rtrim(chars) {
            return chars ? createFluentGenExpr(`RTRIM(${this.$sql}, '${chars}')`) : createFluentGenExpr(`RTRIM(${this.$sql})`);
        },
        btrim(chars) {
            return chars ? createFluentGenExpr(`BTRIM(${this.$sql}, '${chars}')`) : createFluentGenExpr(`BTRIM(${this.$sql})`);
        },
        concat(...parts) {
            const partsSql = parts.map(p => typeof p === 'object' && '$sql' in p ? p.$sql : formatFluentValue(p));
            return createFluentGenExpr(`(${[this.$sql, ...partsSql].join(' || ')})`);
        },
        substring(start, length) {
            return length !== undefined
                ? createFluentGenExpr(`SUBSTRING(${this.$sql} FROM ${start} FOR ${length})`)
                : createFluentGenExpr(`SUBSTRING(${this.$sql} FROM ${start})`);
        },
        replace(from, to) {
            return createFluentGenExpr(`REPLACE(${this.$sql}, '${from.replace(/'/g, "''")}', '${to.replace(/'/g, "''")}')`);
        },
        length() { return createFluentGenExpr(`LENGTH(${this.$sql})`); },
        lpad(len, fill = ' ') { return createFluentGenExpr(`LPAD(${this.$sql}, ${len}, '${fill}')`); },
        rpad(len, fill = ' ') { return createFluentGenExpr(`RPAD(${this.$sql}, ${len}, '${fill}')`); },
        left(n) { return createFluentGenExpr(`LEFT(${this.$sql}, ${n})`); },
        right(n) { return createFluentGenExpr(`RIGHT(${this.$sql}, ${n})`); },
        reverse() { return createFluentGenExpr(`REVERSE(${this.$sql})`); },
        repeat(n) { return createFluentGenExpr(`REPEAT(${this.$sql}, ${n})`); },
        initcap() { return createFluentGenExpr(`INITCAP(${this.$sql})`); },
        ascii() { return createFluentGenExpr(`ASCII(${this.$sql})`); },
        chr() { return createFluentGenExpr(`CHR(${this.$sql})`); },
        position(substring) { return createFluentGenExpr(`POSITION('${substring.replace(/'/g, "''")}' IN ${this.$sql})`); },
        overlay(replacement, start, length) {
            return length !== undefined
                ? createFluentGenExpr(`OVERLAY(${this.$sql} PLACING '${replacement.replace(/'/g, "''")}' FROM ${start} FOR ${length})`)
                : createFluentGenExpr(`OVERLAY(${this.$sql} PLACING '${replacement.replace(/'/g, "''")}' FROM ${start})`);
        },
        translate(from, to) {
            return createFluentGenExpr(`TRANSLATE(${this.$sql}, '${from.replace(/'/g, "''")}', '${to.replace(/'/g, "''")}')`);
        },
        splitPart(delimiter, field) {
            return createFluentGenExpr(`SPLIT_PART(${this.$sql}, '${delimiter.replace(/'/g, "''")}', ${field})`);
        },
        regexpReplace(pattern, replacement, flags) {
            return flags
                ? createFluentGenExpr(`REGEXP_REPLACE(${this.$sql}, '${pattern.replace(/'/g, "''")}', '${replacement.replace(/'/g, "''")}', '${flags}')`)
                : createFluentGenExpr(`REGEXP_REPLACE(${this.$sql}, '${pattern.replace(/'/g, "''")}', '${replacement.replace(/'/g, "''")}')`);
        },
        format(formatStr, ...args) {
            const argsSql = args.map(a => formatFluentValue(a)).join(', ');
            return argsSql
                ? createFluentGenExpr(`FORMAT('${formatStr.replace(/'/g, "''")}', ${this.$sql}, ${argsSql})`)
                : createFluentGenExpr(`FORMAT('${formatStr.replace(/'/g, "''")}', ${this.$sql})`);
        },
        quoteIdent() { return createFluentGenExpr(`QUOTE_IDENT(${this.$sql})`); },
        quoteLiteral() { return createFluentGenExpr(`QUOTE_LITERAL(${this.$sql})`); },
        quoteNullable() { return createFluentGenExpr(`QUOTE_NULLABLE(${this.$sql})`); },
        encode(format) { return createFluentGenExpr(`ENCODE(${this.$sql}, '${format}')`); },
        decode(format) { return createFluentGenExpr(`DECODE(${this.$sql}, '${format}')`); },
        md5() { return createFluentGenExpr(`MD5(${this.$sql})`); },
        sha256() { return createFluentGenExpr(`SHA256(${this.$sql})`); },
        sha512() { return createFluentGenExpr(`SHA512(${this.$sql})`); },
        digest(algorithm) { return createFluentGenExpr(`DIGEST(${this.$sql}, '${algorithm}')`); },
        add(value) { return createFluentGenExpr(`(${this.$sql} + ${formatFluentValue(value)})`); },
        plus(value) { return this.add(value); },
        subtract(value) { return createFluentGenExpr(`(${this.$sql} - ${formatFluentValue(value)})`); },
        minus(value) { return this.subtract(value); },
        multiply(value) { return createFluentGenExpr(`(${this.$sql} * ${formatFluentValue(value)})`); },
        times(value) { return this.multiply(value); },
        divide(value) { return createFluentGenExpr(`(${this.$sql} / ${formatFluentValue(value)})`); },
        dividedBy(value) { return this.divide(value); },
        mod(divisor) { return createFluentGenExpr(`MOD(${this.$sql}, ${formatFluentValue(divisor)})`); },
        power(exponent) { return createFluentGenExpr(`POWER(${this.$sql}, ${formatFluentValue(exponent)})`); },
        sqrt() { return createFluentGenExpr(`SQRT(${this.$sql})`); },
        cbrt() { return createFluentGenExpr(`CBRT(${this.$sql})`); },
        abs() { return createFluentGenExpr(`ABS(${this.$sql})`); },
        round(precision) {
            return precision !== undefined
                ? createFluentGenExpr(`ROUND(${this.$sql}, ${precision})`)
                : createFluentGenExpr(`ROUND(${this.$sql})`);
        },
        floor() { return createFluentGenExpr(`FLOOR(${this.$sql})`); },
        ceil() { return createFluentGenExpr(`CEIL(${this.$sql})`); },
        trunc(scale) {
            return scale !== undefined
                ? createFluentGenExpr(`TRUNC(${this.$sql}, ${scale})`)
                : createFluentGenExpr(`TRUNC(${this.$sql})`);
        },
        sign() { return createFluentGenExpr(`SIGN(${this.$sql})`); },
        exp() { return createFluentGenExpr(`EXP(${this.$sql})`); },
        ln() { return createFluentGenExpr(`LN(${this.$sql})`); },
        log(base) {
            return base !== undefined
                ? createFluentGenExpr(`LOG(${base}, ${this.$sql})`)
                : createFluentGenExpr(`LOG(${this.$sql})`);
        },
        log10() { return createFluentGenExpr(`LOG10(${this.$sql})`); },
        degrees() { return createFluentGenExpr(`DEGREES(${this.$sql})`); },
        radians() { return createFluentGenExpr(`RADIANS(${this.$sql})`); },
        sin() { return createFluentGenExpr(`SIN(${this.$sql})`); },
        cos() { return createFluentGenExpr(`COS(${this.$sql})`); },
        tan() { return createFluentGenExpr(`TAN(${this.$sql})`); },
        asin() { return createFluentGenExpr(`ASIN(${this.$sql})`); },
        acos() { return createFluentGenExpr(`ACOS(${this.$sql})`); },
        atan() { return createFluentGenExpr(`ATAN(${this.$sql})`); },
        atan2(x) { return createFluentGenExpr(`ATAN2(${this.$sql}, ${formatFluentValue(x)})`); },
        sinh() { return createFluentGenExpr(`SINH(${this.$sql})`); },
        cosh() { return createFluentGenExpr(`COSH(${this.$sql})`); },
        tanh() { return createFluentGenExpr(`TANH(${this.$sql})`); },
        factorial() { return createFluentGenExpr(`FACTORIAL(${this.$sql})`); },
        gcd(other) { return createFluentGenExpr(`GCD(${this.$sql}, ${formatFluentValue(other)})`); },
        lcm(other) { return createFluentGenExpr(`LCM(${this.$sql}, ${formatFluentValue(other)})`); },
        widthBucket(min, max, buckets) {
            return createFluentGenExpr(`WIDTH_BUCKET(${this.$sql}, ${min}, ${max}, ${buckets})`);
        },
        eq(value) { return createFluentGenExpr(`(${this.$sql} = ${formatFluentValue(value)})`); },
        ne(value) { return createFluentGenExpr(`(${this.$sql} <> ${formatFluentValue(value)})`); },
        gt(value) { return createFluentGenExpr(`(${this.$sql} > ${formatFluentValue(value)})`); },
        gte(value) { return createFluentGenExpr(`(${this.$sql} >= ${formatFluentValue(value)})`); },
        lt(value) { return createFluentGenExpr(`(${this.$sql} < ${formatFluentValue(value)})`); },
        lte(value) { return createFluentGenExpr(`(${this.$sql} <= ${formatFluentValue(value)})`); },
        between(min, max) {
            return createFluentGenExpr(`(${this.$sql} BETWEEN ${formatFluentValue(min)} AND ${formatFluentValue(max)})`);
        },
        notBetween(min, max) {
            return createFluentGenExpr(`(${this.$sql} NOT BETWEEN ${formatFluentValue(min)} AND ${formatFluentValue(max)})`);
        },
        in(...values) {
            const valsSql = values.map(v => formatFluentValue(v)).join(', ');
            return createFluentGenExpr(`(${this.$sql} IN (${valsSql}))`);
        },
        notIn(...values) {
            const valsSql = values.map(v => formatFluentValue(v)).join(', ');
            return createFluentGenExpr(`(${this.$sql} NOT IN (${valsSql}))`);
        },
        isDistinctFrom(other) {
            return createFluentGenExpr(`(${this.$sql} IS DISTINCT FROM ${formatFluentValue(other)})`);
        },
        isNotDistinctFrom(other) {
            return createFluentGenExpr(`(${this.$sql} IS NOT DISTINCT FROM ${formatFluentValue(other)})`);
        },
        like(pattern) { return createFluentGenExpr(`(${this.$sql} LIKE '${pattern.replace(/'/g, "''")}')`); },
        ilike(pattern) { return createFluentGenExpr(`(${this.$sql} ILIKE '${pattern.replace(/'/g, "''")}')`); },
        similar(pattern) { return createFluentGenExpr(`(${this.$sql} SIMILAR TO '${pattern.replace(/'/g, "''")}')`); },
        matches(regex, flags) {
            const op = flags?.includes('i') ? '~*' : '~';
            return createFluentGenExpr(`(${this.$sql} ${op} '${regex.replace(/'/g, "''")}')`);
        },
        greatest(...values) {
            const valsSql = [this.$sql, ...values.map(v => formatFluentValue(v))].join(', ');
            return createFluentGenExpr(`GREATEST(${valsSql})`);
        },
        least(...values) {
            const valsSql = [this.$sql, ...values.map(v => formatFluentValue(v))].join(', ');
            return createFluentGenExpr(`LEAST(${valsSql})`);
        },
        and(other) { return createFluentGenExpr(`(${this.$sql} AND ${other.$sql})`); },
        or(other) { return createFluentGenExpr(`(${this.$sql} OR ${other.$sql})`); },
        not() { return createFluentGenExpr(`(NOT ${this.$sql})`); },
        isNull() { return createFluentGenExpr(`(${this.$sql} IS NULL)`); },
        isNotNull() { return createFluentGenExpr(`(${this.$sql} IS NOT NULL)`); },
        jsonExtract(key) {
            const keyStr = typeof key === 'number' ? key : `'${key}'`;
            return createFluentGenExpr(`${this.$sql}->${keyStr}`);
        },
        jsonExtractText(key) {
            const keyStr = typeof key === 'number' ? key : `'${key}'`;
            return createFluentGenExpr(`${this.$sql}->>${keyStr}`);
        },
        jsonbExtract(key) {
            const keyStr = typeof key === 'number' ? key : `'${key}'`;
            return createFluentGenExpr(`${this.$sql}->${keyStr}`);
        },
        jsonbExtractText(key) {
            const keyStr = typeof key === 'number' ? key : `'${key}'`;
            return createFluentGenExpr(`${this.$sql}->>${keyStr}`);
        },
        jsonbPath(path) {
            const pathStr = path.map(p => `'${p}'`).join(', ');
            return createFluentGenExpr(`${this.$sql}#>ARRAY[${pathStr}]`);
        },
        jsonbPathText(path) {
            const pathStr = path.map(p => `'${p}'`).join(', ');
            return createFluentGenExpr(`${this.$sql}#>>ARRAY[${pathStr}]`);
        },
        jsonTypeof() { return createFluentGenExpr(`JSON_TYPEOF(${this.$sql})`); },
        jsonbTypeof() { return createFluentGenExpr(`JSONB_TYPEOF(${this.$sql})`); },
        jsonArrayLength() { return createFluentGenExpr(`JSON_ARRAY_LENGTH(${this.$sql})`); },
        jsonbArrayLength() { return createFluentGenExpr(`JSONB_ARRAY_LENGTH(${this.$sql})`); },
        jsonbKeys() { return createFluentGenExpr(`JSONB_OBJECT_KEYS(${this.$sql})`); },
        jsonbPretty() { return createFluentGenExpr(`JSONB_PRETTY(${this.$sql})`); },
        jsonbStripNulls() { return createFluentGenExpr(`JSONB_STRIP_NULLS(${this.$sql})`); },
        toJson() { return createFluentGenExpr(`TO_JSON(${this.$sql})`); },
        toJsonb() { return createFluentGenExpr(`TO_JSONB(${this.$sql})`); },
        arrayLength(dimension = 1) { return createFluentGenExpr(`ARRAY_LENGTH(${this.$sql}, ${dimension})`); },
        arrayGet(index) { return createFluentGenExpr(`(${this.$sql})[${index}]`); },
        arrayPosition(element, start) {
            return start !== undefined
                ? createFluentGenExpr(`ARRAY_POSITION(${this.$sql}, ${formatFluentValue(element)}, ${start})`)
                : createFluentGenExpr(`ARRAY_POSITION(${this.$sql}, ${formatFluentValue(element)})`);
        },
        arrayPositions(element) {
            return createFluentGenExpr(`ARRAY_POSITIONS(${this.$sql}, ${formatFluentValue(element)})`);
        },
        arrayDims() { return createFluentGenExpr(`ARRAY_DIMS(${this.$sql})`); },
        arrayLower(dimension = 1) { return createFluentGenExpr(`ARRAY_LOWER(${this.$sql}, ${dimension})`); },
        arrayUpper(dimension = 1) { return createFluentGenExpr(`ARRAY_UPPER(${this.$sql}, ${dimension})`); },
        arrayNDims() { return createFluentGenExpr(`ARRAY_NDIMS(${this.$sql})`); },
        arrayToString(delimiter, nullString) {
            return nullString !== undefined
                ? createFluentGenExpr(`ARRAY_TO_STRING(${this.$sql}, '${delimiter}', '${nullString}')`)
                : createFluentGenExpr(`ARRAY_TO_STRING(${this.$sql}, '${delimiter}')`);
        },
        arrayAppend(element) {
            return createFluentGenExpr(`ARRAY_APPEND(${this.$sql}, ${formatFluentValue(element)})`);
        },
        arrayPrepend(element) {
            return createFluentGenExpr(`ARRAY_PREPEND(${formatFluentValue(element)}, ${this.$sql})`);
        },
        arrayCat(other) { return createFluentGenExpr(`ARRAY_CAT(${this.$sql}, ${other.$sql})`); },
        arrayRemove(element) {
            return createFluentGenExpr(`ARRAY_REMOVE(${this.$sql}, ${formatFluentValue(element)})`);
        },
        arrayReplace(from, to) {
            return createFluentGenExpr(`ARRAY_REPLACE(${this.$sql}, ${formatFluentValue(from)}, ${formatFluentValue(to)})`);
        },
        unnest() { return createFluentGenExpr(`UNNEST(${this.$sql})`); },
        cardinality() { return createFluentGenExpr(`CARDINALITY(${this.$sql})`); },
        toTsvector(config) {
            return config
                ? createFluentGenExpr(`TO_TSVECTOR('${config}', ${this.$sql})`)
                : createFluentGenExpr(`TO_TSVECTOR(${this.$sql})`);
        },
        setWeight(weight) { return createFluentGenExpr(`SETWEIGHT(${this.$sql}, '${weight}')`); },
        tsvConcat(other) { return createFluentGenExpr(`(${this.$sql} || ${other.$sql})`); },
        toTsquery(config) {
            return config
                ? createFluentGenExpr(`TO_TSQUERY('${config}', ${this.$sql})`)
                : createFluentGenExpr(`TO_TSQUERY(${this.$sql})`);
        },
        plainToTsquery(config) {
            return config
                ? createFluentGenExpr(`PLAINTO_TSQUERY('${config}', ${this.$sql})`)
                : createFluentGenExpr(`PLAINTO_TSQUERY(${this.$sql})`);
        },
        phraseToTsquery(config) {
            return config
                ? createFluentGenExpr(`PHRASETO_TSQUERY('${config}', ${this.$sql})`)
                : createFluentGenExpr(`PHRASETO_TSQUERY(${this.$sql})`);
        },
        websearchToTsquery(config) {
            return config
                ? createFluentGenExpr(`WEBSEARCH_TO_TSQUERY('${config}', ${this.$sql})`)
                : createFluentGenExpr(`WEBSEARCH_TO_TSQUERY(${this.$sql})`);
        },
        tsStrip() { return createFluentGenExpr(`STRIP(${this.$sql})`); },
        tsLength() { return createFluentGenExpr(`LENGTH(${this.$sql})`); },
        numNode() { return createFluentGenExpr(`NUMNODE(${this.$sql})`); },
        queryTree() { return createFluentGenExpr(`QUERYTREE(${this.$sql})`); },
        tsRank(query, normalization) {
            return normalization !== undefined
                ? createFluentGenExpr(`TS_RANK(${this.$sql}, ${query.$sql}, ${normalization})`)
                : createFluentGenExpr(`TS_RANK(${this.$sql}, ${query.$sql})`);
        },
        tsRankCd(query, normalization) {
            return normalization !== undefined
                ? createFluentGenExpr(`TS_RANK_CD(${this.$sql}, ${query.$sql}, ${normalization})`)
                : createFluentGenExpr(`TS_RANK_CD(${this.$sql}, ${query.$sql})`);
        },
        tsHeadline(query, options) {
            return options
                ? createFluentGenExpr(`TS_HEADLINE(${this.$sql}, ${query.$sql}, '${options}')`)
                : createFluentGenExpr(`TS_HEADLINE(${this.$sql}, ${query.$sql})`);
        },
        tsRewrite(target, substitute) {
            return createFluentGenExpr(`TS_REWRITE(${this.$sql}, ${target.$sql}, ${substitute.$sql})`);
        },
        tsFilter(weights) {
            const weightsStr = weights.map(w => `'${w}'`).join(', ');
            return createFluentGenExpr(`TS_FILTER(${this.$sql}, ARRAY[${weightsStr}])`);
        },
        tsDelete(lexemes) {
            const lexemesStr = lexemes.map(l => `'${l}'`).join(', ');
            return createFluentGenExpr(`TS_DELETE(${this.$sql}, ARRAY[${lexemesStr}])`);
        },
        extract(field) { return createFluentGenExpr(`EXTRACT(${field.toUpperCase()} FROM ${this.$sql})`); },
        datePart(field) { return createFluentGenExpr(`DATE_PART('${field}', ${this.$sql})`); },
        age(other) {
            return other
                ? createFluentGenExpr(`AGE(${this.$sql}, ${other.$sql})`)
                : createFluentGenExpr(`AGE(${this.$sql})`);
        },
        dateTrunc(field) { return createFluentGenExpr(`DATE_TRUNC('${field}', ${this.$sql})`); },
        epoch() { return createFluentGenExpr(`EXTRACT(EPOCH FROM ${this.$sql})`); },
        isfinite() { return createFluentGenExpr(`ISFINITE(${this.$sql})`); },
        case() { return createCaseBuilder(); },
        ifThen(condition, thenValue, elseValue) {
            return createFluentGenExpr(`CASE WHEN ${condition.$sql} THEN ${formatFluentValue(thenValue)} ELSE ${formatFluentValue(elseValue)} END`);
        },
        parentheses() { return createFluentGenExpr(`(${this.$sql})`); },
        func(name, ...args) {
            const argsSql = args.map(a => formatFluentValue(a)).join(', ');
            return argsSql
                ? createFluentGenExpr(`${name.toUpperCase()}(${this.$sql}, ${argsSql})`)
                : createFluentGenExpr(`${name.toUpperCase()}(${this.$sql})`);
        },
        op(operator, right) {
            return createFluentGenExpr(`(${this.$sql} ${operator} ${formatFluentValue(right)})`);
        },
    };
    return self;
}
export function createCaseBuilder() {
    const whens = [];
    let elseResult = null;
    const builder = {
        when(condition, result) {
            const condSql = typeof condition === 'string' ? condition : condition.$sql;
            whens.push({ condition: condSql, result: formatGenValue(result) });
            return builder;
        },
        else(result) {
            elseResult = formatGenValue(result);
            return this.end();
        },
        end() {
            let sql = 'CASE';
            for (const w of whens) {
                sql += ` WHEN ${w.condition} THEN ${w.result}`;
            }
            if (elseResult !== null) {
                sql += ` ELSE ${elseResult}`;
            }
            sql += ' END';
            return chainableExpr(sql);
        },
    };
    return builder;
}
