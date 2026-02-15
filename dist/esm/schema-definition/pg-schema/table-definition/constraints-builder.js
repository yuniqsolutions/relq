function formatVal(val) {
    if (val === null)
        return 'NULL';
    if (typeof val === 'number')
        return String(val);
    if (typeof val === 'boolean')
        return val ? 'TRUE' : 'FALSE';
    if (typeof val === 'string')
        return `'${val.replace(/'/g, "''")}'`;
    if (val && typeof val === 'object' && '$sql' in val)
        return val.$sql;
    return String(val);
}
export function createCheckWhereCondition(sql) {
    return {
        $sql: sql,
        $expr: true,
        and(other) {
            return createCheckWhereCondition(`(${this.$sql}) AND (${other.$sql})`);
        },
        or(other) {
            return createCheckWhereCondition(`(${this.$sql}) OR (${other.$sql})`);
        },
    };
}
export function createCheckExpr(sql) {
    const expr = {
        $sql: sql,
        $expr: true,
        gte(value) {
            return createCheckWhereCondition(`${this.$sql} >= ${formatVal(value)}`);
        },
        lte(value) {
            return createCheckWhereCondition(`${this.$sql} <= ${formatVal(value)}`);
        },
        gt(value) {
            return createCheckWhereCondition(`${this.$sql} > ${formatVal(value)}`);
        },
        lt(value) {
            return createCheckWhereCondition(`${this.$sql} < ${formatVal(value)}`);
        },
        eq(value) {
            return createCheckWhereCondition(`${this.$sql} = ${formatVal(value)}`);
        },
        neq(value) {
            return createCheckWhereCondition(`${this.$sql} != ${formatVal(value)}`);
        },
        ne(value) {
            return createCheckWhereCondition(`${this.$sql} <> ${formatVal(value)}`);
        },
        isNull() {
            return createCheckWhereCondition(`${this.$sql} IS NULL`);
        },
        isNotNull() {
            return createCheckWhereCondition(`${this.$sql} IS NOT NULL`);
        },
        in(values) {
            return createCheckWhereCondition(`${this.$sql} IN (${values.map(formatVal).join(', ')})`);
        },
        notIn(values) {
            return createCheckWhereCondition(`${this.$sql} NOT IN (${values.map(formatVal).join(', ')})`);
        },
        between(min, max) {
            return createCheckWhereCondition(`${this.$sql} BETWEEN ${formatVal(min)} AND ${formatVal(max)}`);
        },
        like(pattern) {
            return createCheckWhereCondition(`${this.$sql} LIKE '${pattern.replace(/'/g, "''")}'`);
        },
        ilike(pattern) {
            return createCheckWhereCondition(`${this.$sql} ILIKE '${pattern.replace(/'/g, "''")}'`);
        },
        matches(pattern) {
            return createCheckWhereCondition(`${this.$sql} ~ '${pattern.replace(/'/g, "''")}'`);
        },
        matchesInsensitive(pattern) {
            return createCheckWhereCondition(`${this.$sql} ~* '${pattern.replace(/'/g, "''")}'`);
        },
        plus(value) {
            const valSql = typeof value === 'number' ? String(value) : value.$sql;
            return createCheckExpr(`(${this.$sql} + ${valSql})`);
        },
        minus(value) {
            const valSql = typeof value === 'number' ? String(value) : value.$sql;
            return createCheckExpr(`(${this.$sql} - ${valSql})`);
        },
        times(value) {
            const valSql = typeof value === 'number' ? String(value) : value.$sql;
            return createCheckExpr(`(${this.$sql} * ${valSql})`);
        },
        dividedBy(value) {
            const valSql = typeof value === 'number' ? String(value) : value.$sql;
            return createCheckExpr(`(${this.$sql} / ${valSql})`);
        },
        length() {
            return createCheckExpr(`LENGTH(${this.$sql})`);
        },
        asText() {
            return createCheckExpr(`(${this.$sql})::TEXT`);
        },
        abs() {
            return createCheckExpr(`ABS(${this.$sql})`);
        },
    };
    return expr;
}
export function createCheckTableRefs(columns) {
    const refs = {};
    for (const key of Object.keys(columns)) {
        const col = columns[key];
        const colName = col.$columnName || key;
        refs[key] = createCheckExpr(`"${colName}"`);
    }
    return refs;
}
export function createCheckConstraintBuilder() {
    return {
        col(name) {
            return createCheckExpr(`"${String(name)}"`);
        },
        constraint(name, condition) {
            return { name, expression: condition.$sql };
        },
        raw(expression) {
            return createCheckWhereCondition(expression);
        },
    };
}
export function createConstraintBuilder() {
    return {
        primaryKey(...args) {
            if (args.length === 1 && typeof args[0] === 'object' && args[0] !== null && 'columns' in args[0]) {
                const opts = args[0];
                return {
                    $type: 'PRIMARY KEY',
                    $name: opts.name || '',
                    $columns: opts.columns.map(c => String(c)),
                };
            }
            const columns = args;
            return {
                $type: 'PRIMARY KEY',
                $name: '',
                $columns: columns.map(c => String(c)),
            };
        },
        unique(...args) {
            if (args.length === 1 && typeof args[0] === 'object' && args[0] !== null && 'columns' in args[0]) {
                const opts = args[0];
                return {
                    $type: 'UNIQUE',
                    $name: opts.name || '',
                    $columns: opts.columns.map(c => String(c)),
                };
            }
            const columns = args;
            return {
                $type: 'UNIQUE',
                $name: '',
                $columns: columns.map(c => String(c)),
            };
        },
        exclude(name, expression) {
            return {
                $type: 'EXCLUDE',
                $name: name,
                $columns: [],
                $expression: expression,
            };
        },
    };
}
