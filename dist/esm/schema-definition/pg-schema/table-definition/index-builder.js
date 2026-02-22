import { sqlFunctions, expressionBuilder } from "../sql-expressions/index.js";
function formatWhereValue(val) {
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
function whereCondition(sql) {
    return {
        $sql: sql,
        $expr: true,
        and(other) {
            return whereCondition(`(${this.$sql}) AND (${other.$sql})`);
        },
        or(other) {
            return whereCondition(`(${this.$sql}) OR (${other.$sql})`);
        },
    };
}
export function createColumnExpr(colName) {
    const sql = colName.startsWith('"') ? colName : `"${colName}"`;
    const self = {
        $sql: sql,
        $expr: true,
        eq(value) {
            return whereCondition(`${this.$sql} = ${formatWhereValue(value)}`);
        },
        neq(value) {
            return whereCondition(`${this.$sql} != ${formatWhereValue(value)}`);
        },
        ne(value) {
            return whereCondition(`${this.$sql} <> ${formatWhereValue(value)}`);
        },
        gt(value) {
            return whereCondition(`${this.$sql} > ${formatWhereValue(value)}`);
        },
        gte(value) {
            return whereCondition(`${this.$sql} >= ${formatWhereValue(value)}`);
        },
        lt(value) {
            return whereCondition(`${this.$sql} < ${formatWhereValue(value)}`);
        },
        lte(value) {
            return whereCondition(`${this.$sql} <= ${formatWhereValue(value)}`);
        },
        isNull() {
            return whereCondition(`${this.$sql} IS NULL`);
        },
        isNotNull() {
            return whereCondition(`${this.$sql} IS NOT NULL`);
        },
        in(values) {
            return whereCondition(`${this.$sql} IN (${values.map(formatWhereValue).join(', ')})`);
        },
        notIn(values) {
            return whereCondition(`${this.$sql} NOT IN (${values.map(formatWhereValue).join(', ')})`);
        },
        between(min, max) {
            return whereCondition(`${this.$sql} BETWEEN ${formatWhereValue(min)} AND ${formatWhereValue(max)}`);
        },
        like(pattern) {
            return whereCondition(`${this.$sql} LIKE '${pattern.replace(/'/g, "''")}'`);
        },
        ilike(pattern) {
            return whereCondition(`${this.$sql} ILIKE '${pattern.replace(/'/g, "''")}'`);
        },
        plus(value) {
            const valSql = typeof value === 'number' ? String(value) : value.$sql;
            return createColumnExprFromSql(`(${this.$sql} + ${valSql})`);
        },
        minus(value) {
            const valSql = typeof value === 'number' ? String(value) : value.$sql;
            return createColumnExprFromSql(`(${this.$sql} - ${valSql})`);
        },
    };
    return self;
}
export function createColumnExprFromSql(sql) {
    const expr = createColumnExpr('dummy');
    expr.$sql = sql;
    return expr;
}
export function createIndexWhereBuilder() {
    return {
        col(name) {
            const colName = String(name);
            return createColumnExpr(colName);
        },
        eq(col, value) {
            return createColumnExpr(String(col)).eq(value);
        },
        neq(col, value) {
            return createColumnExpr(String(col)).neq(value);
        },
        gt(col, value) {
            return createColumnExpr(String(col)).gt(value);
        },
        gte(col, value) {
            return createColumnExpr(String(col)).gte(value);
        },
        lt(col, value) {
            return createColumnExpr(String(col)).lt(value);
        },
        lte(col, value) {
            return createColumnExpr(String(col)).lte(value);
        },
        isNull(col) {
            return createColumnExpr(String(col)).isNull();
        },
        isNotNull(col) {
            return createColumnExpr(String(col)).isNotNull();
        },
        between(col, min, max) {
            const colName = String(col);
            const sqlStr = colName.startsWith('"') ? colName : `"${colName}"`;
            return whereCondition(`${sqlStr} BETWEEN ${formatWhereValue(min)} AND ${formatWhereValue(max)}`);
        },
        fn: sqlFunctions,
        currentDate() {
            return createColumnExprFromSql('CURRENT_DATE');
        },
        currentTimestamp() {
            return createColumnExprFromSql('CURRENT_TIMESTAMP');
        },
        now() {
            return createColumnExprFromSql('NOW()');
        },
        interval(value) {
            return { $sql: `INTERVAL '${value}'`, $expr: true };
        },
    };
}
export function createIndexTableRefs(columns) {
    const refs = {};
    for (const key of Object.keys(columns)) {
        const col = columns[key];
        const colName = col.$columnName || key;
        refs[key] = createColumnExpr(colName);
    }
    return refs;
}
export function createIndexFactory() {
    const factory = (name) => {
        const def = {
            name,
            columns: [],
        };
        const chain = {
            ...def,
            unique() {
                def.unique = true;
                return Object.assign(this, { unique: true });
            },
            using(method) {
                def.using = method;
                return Object.assign(this, { using: method });
            },
            where(condition) {
                if (typeof condition === 'function') {
                    const whereBuilder = createIndexWhereBuilder();
                    const result = condition(whereBuilder);
                    def.where = result.$sql;
                }
                else {
                    def.where = condition.$sql;
                }
                return Object.assign(this, { where: def.where });
            },
            with(options) {
                def.with = options;
                return Object.assign(this, { with: options });
            },
            tablespace(name) {
                def.tablespace = name;
                return Object.assign(this, { tablespace: name });
            },
            nullsFirst() {
                def.nulls = 'first';
                return Object.assign(this, { nulls: 'first' });
            },
            nullsLast() {
                def.nulls = 'last';
                return Object.assign(this, { nulls: 'last' });
            },
            asc() {
                def.order = 'asc';
                return Object.assign(this, { order: 'asc' });
            },
            desc() {
                def.order = 'desc';
                return Object.assign(this, { order: 'desc' });
            },
            include(...columns) {
                def.include = columns;
                return Object.assign(this, { include: columns });
            },
            opclass(opclass) {
                def._opclass = opclass;
                return Object.assign(this, { _opclass: opclass });
            },
            nullsNotDistinct() {
                def.nullsNotDistinct = true;
                return Object.assign(this, { nullsNotDistinct: true });
            },
            ifNotExists() {
                def.ifNotExists = true;
                return Object.assign(this, { ifNotExists: true });
            },
            tableOnly() {
                def.tableOnly = true;
                return Object.assign(this, { tableOnly: true });
            },
            comment(text) {
                def.comment = text;
                return Object.assign(this, { comment: text });
            },
            $id(trackingId) {
                def.trackingId = trackingId;
                return Object.assign(this, { trackingId: trackingId });
            },
        };
        return {
            on(...columns) {
                def.columns = columns.map(c => {
                    if (typeof c === 'string')
                        return c;
                    return c.$sql;
                });
                return Object.assign(chain, def);
            },
            expression(callback) {
                const result = callback(expressionBuilder);
                def.expression = result.$sql;
                def.columns = [result.$sql];
                return Object.assign(chain, def);
            },
        };
    };
    return factory;
}
export const indexFactory = createIndexFactory();
export function normalizeIndexDef(idx) {
    const unique = typeof idx.unique === 'function' ? false : (idx.unique || idx.isUnique || false);
    const using = typeof idx.using === 'function' ? undefined : (idx.using || idx.method);
    const where = typeof idx.where === 'function' ? undefined : idx.where;
    const withOpts = typeof idx.with === 'function' ? undefined : idx.with;
    const tablespace = typeof idx.tablespace === 'function' ? undefined : idx.tablespace;
    const include = typeof idx.include === 'function' ? undefined : idx.include;
    const comment = typeof idx.comment === 'function' ? undefined : idx.comment;
    return {
        name: idx.name,
        columns: idx.columns || [],
        unique,
        using,
        where,
        with: withOpts,
        tablespace,
        nulls: idx.nulls,
        order: idx.order,
        include,
        ifNotExists: idx.ifNotExists,
        tableOnly: idx.tableOnly,
        trackingId: idx.trackingId,
        comment,
    };
}
