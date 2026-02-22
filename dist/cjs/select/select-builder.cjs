"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SelectBuilder = void 0;
const pg_format_1 = __importDefault(require("../utils/pg-format.cjs"));
const condition_collector_1 = require("../condition/condition-collector.cjs");
class SelectBuilder {
    tableName;
    tableAlias;
    selectColumns = ['*'];
    whereConditions = [];
    havingConditions = [];
    joinClauses = [];
    structuredJoins = [];
    groupByColumns = [];
    orderByColumns = [];
    limitValue;
    offsetValue;
    distinctOnColumns = [];
    isDistinct = false;
    lockingClause;
    unionQueries = [];
    includeExpressions = [];
    columnResolver;
    constructor(tableName, columns) {
        this.tableName = tableName;
        if (columns) {
            this.selectColumns = Array.isArray(columns) ? columns : [columns];
        }
    }
    setColumnResolver(resolver) {
        this.columnResolver = resolver;
        return this;
    }
    transformConditionColumns(conditions) {
        if (!this.columnResolver) {
            return conditions;
        }
        return conditions.map(cond => {
            if (cond.method === 'or' || cond.method === 'and') {
                return {
                    ...cond,
                    values: this.transformConditionColumns(cond.values)
                };
            }
            if (!cond.column) {
                return cond;
            }
            if (cond.method === 'raw') {
                return cond;
            }
            if (cond.column.includes('.')) {
                const [tableRef, colName] = cond.column.split('.');
                return {
                    ...cond,
                    column: `${tableRef}.${this.columnResolver(colName)}`
                };
            }
            return {
                ...cond,
                column: this.columnResolver(cond.column)
            };
        });
    }
    setTableAlias(alias) {
        this.tableAlias = alias;
        return this;
    }
    getTableIdentifier() {
        return this.tableAlias || this.tableName;
    }
    distinct() {
        this.isDistinct = true;
        return this;
    }
    where(callback) {
        const conditionBuilder = new condition_collector_1.ConditionCollector();
        callback(conditionBuilder);
        this.whereConditions.push(...conditionBuilder.getConditions());
        return this;
    }
    join(table, condition) {
        this.joinClauses.push(`JOIN ${pg_format_1.default.ident(table)} ON ${condition}`);
        return this;
    }
    leftJoin(table, condition) {
        this.joinClauses.push(`LEFT JOIN ${pg_format_1.default.ident(table)} ON ${condition}`);
        return this;
    }
    rightJoin(table, condition) {
        this.joinClauses.push(`RIGHT JOIN ${pg_format_1.default.ident(table)} ON ${condition}`);
        return this;
    }
    innerJoin(table, condition) {
        this.joinClauses.push(`INNER JOIN ${pg_format_1.default.ident(table)} ON ${condition}`);
        return this;
    }
    addRawJoin(joinSQL) {
        this.joinClauses.push(joinSQL);
        return this;
    }
    groupBy(...columns) {
        this.groupByColumns.push(...columns);
        return this;
    }
    having(callback) {
        const conditionBuilder = new condition_collector_1.ConditionCollector();
        callback(conditionBuilder);
        this.havingConditions.push(...conditionBuilder.getConditions());
        return this;
    }
    orderBy(column, direction = 'ASC') {
        this.orderByColumns.push({ column, direction });
        return this;
    }
    orderByNulls(column, direction, nulls) {
        this.orderByColumns.push({ column, direction, nulls });
        return this;
    }
    orderAsc(column) {
        return this.orderBy(column, 'ASC');
    }
    orderDesc(column) {
        return this.orderBy(column, 'DESC');
    }
    limit(count) {
        this.limitValue = count;
        return this;
    }
    offset(count) {
        this.offsetValue = count;
        return this;
    }
    distinctOn(...columns) {
        this.distinctOnColumns.push(...columns);
        return this;
    }
    forUpdate() {
        this.lockingClause = 'FOR UPDATE';
        return this;
    }
    forUpdateNoWait() {
        this.lockingClause = 'FOR UPDATE NOWAIT';
        return this;
    }
    forUpdateSkipLocked() {
        this.lockingClause = 'FOR UPDATE SKIP LOCKED';
        return this;
    }
    forShare() {
        this.lockingClause = 'FOR SHARE';
        return this;
    }
    forShareNoWait() {
        this.lockingClause = 'FOR SHARE NOWAIT';
        return this;
    }
    forShareSkipLocked() {
        this.lockingClause = 'FOR SHARE SKIP LOCKED';
        return this;
    }
    union(query) {
        this.unionQueries.push({
            query: typeof query === 'string' ? query : query.toString(),
            type: 'UNION'
        });
        return this;
    }
    unionAll(query) {
        this.unionQueries.push({
            query: typeof query === 'string' ? query : query.toString(),
            type: 'UNION ALL'
        });
        return this;
    }
    intersect(query) {
        this.unionQueries.push({
            query: typeof query === 'string' ? query : query.toString(),
            type: 'INTERSECT'
        });
        return this;
    }
    except(query) {
        this.unionQueries.push({
            query: typeof query === 'string' ? query : query.toString(),
            type: 'EXCEPT'
        });
        return this;
    }
    fullOuterJoin(table, condition) {
        this.joinClauses.push(`FULL OUTER JOIN ${pg_format_1.default.ident(table)} ON ${condition}`);
        return this;
    }
    crossJoin(table) {
        this.joinClauses.push(`CROSS JOIN ${pg_format_1.default.ident(table)}`);
        return this;
    }
    lateralJoin(subquery, left = false) {
        const joinType = left ? 'LEFT JOIN LATERAL' : 'JOIN LATERAL';
        this.joinClauses.push(`${joinType} ${subquery}`);
        return this;
    }
    addStructuredJoin(join) {
        this.structuredJoins.push(join);
        return this;
    }
    getStructuredJoins() {
        return [...this.structuredJoins];
    }
    addIncludeExpression(alias, sql) {
        this.includeExpressions.push({ alias, sql });
        return this;
    }
    qualifyWhereConditions(conditions, tableRef) {
        return conditions.map(cond => {
            if (!cond.column) {
                return cond;
            }
            if (cond.column.includes('.')) {
                return cond;
            }
            if (cond.method === 'or' || cond.method === 'and') {
                return {
                    ...cond,
                    values: this.qualifyWhereConditions(cond.values, tableRef)
                };
            }
            return {
                ...cond,
                column: `${tableRef}.${cond.column}`
            };
        });
    }
    buildStructuredJoinSQL(join) {
        if ((join.type === 'LEFT JOIN LATERAL' || join.type === 'JOIN LATERAL') && join.lateralSubquery) {
            return `${join.type} ${join.lateralSubquery} ON true`;
        }
        if (join.type === 'CROSS JOIN') {
            const tableRef = join.alias !== join.table
                ? `${pg_format_1.default.ident(join.table)} AS ${pg_format_1.default.ident(join.alias)}`
                : pg_format_1.default.ident(join.table);
            return `CROSS JOIN ${tableRef}`;
        }
        const tableRef = join.alias !== join.table
            ? `${pg_format_1.default.ident(join.table)} AS ${pg_format_1.default.ident(join.alias)}`
            : pg_format_1.default.ident(join.table);
        if (join.usingColumns && join.usingColumns.length > 0) {
            const usingSQL = join.usingColumns.map(c => pg_format_1.default.ident(c)).join(', ');
            return `${join.type} ${tableRef} USING (${usingSQL})`;
        }
        if (join.onClause) {
            return `${join.type} ${tableRef} ON ${join.onClause}`;
        }
        return `${join.type} ${tableRef}`;
    }
    toString() {
        const hasJoins = this.joinClauses.length > 0 || this.structuredJoins.length > 0;
        const tableRef = this.tableAlias || this.tableName;
        const columns = this.selectColumns.map(col => {
            if (col === '*') {
                return hasJoins ? `${pg_format_1.default.ident(tableRef)}.*` : '*';
            }
            if (Array.isArray(col)) {
                const [column, alias] = col;
                if (hasJoins) {
                    return (0, pg_format_1.default)('%I.%I AS %I', tableRef, column, alias);
                }
                return (0, pg_format_1.default)('%I AS %I', column, alias);
            }
            if (col.includes('(') || col.includes('DISTINCT') || col.includes(' AS ') || col.includes('.')) {
                return col;
            }
            if (hasJoins) {
                return (0, pg_format_1.default)('%I.%I', tableRef, col);
            }
            return pg_format_1.default.ident(col);
        });
        for (const join of this.structuredJoins) {
            if (join.type === 'LEFT JOIN LATERAL' || join.type === 'JOIN LATERAL') {
                columns.push(`${pg_format_1.default.ident(join.alias + '_lateral')}.${pg_format_1.default.ident(join.alias)} AS ${pg_format_1.default.ident(join.alias)}`);
            }
            else if (join.selectColumns && join.selectColumns.length > 0) {
                const jsonArgs = join.selectColumns
                    .map(col => `'${col.property}', ${pg_format_1.default.ident(join.alias)}.${pg_format_1.default.ident(col.sqlName)}`)
                    .join(', ');
                columns.push(`json_build_object(${jsonArgs}) AS ${pg_format_1.default.ident(join.alias)}`);
            }
            else {
                columns.push(`row_to_json(${pg_format_1.default.ident(join.alias)}.*) AS ${pg_format_1.default.ident(join.alias)}`);
            }
        }
        for (const expr of this.includeExpressions) {
            columns.push(`${expr.sql} AS ${pg_format_1.default.ident(expr.alias)}`);
        }
        const columnsSQL = columns.join(', ');
        let query = 'SELECT';
        if (this.distinctOnColumns.length > 0) {
            const distinctCols = this.distinctOnColumns.map(col => pg_format_1.default.ident(col)).join(', ');
            query += (0, pg_format_1.default)(' DISTINCT ON (%s)', distinctCols);
        }
        else if (this.isDistinct) {
            query += ' DISTINCT';
        }
        if (this.tableAlias && this.tableAlias !== this.tableName) {
            query += (0, pg_format_1.default)(' %s FROM %I AS %I', columnsSQL, this.tableName, this.tableAlias);
        }
        else {
            query += (0, pg_format_1.default)(' %s FROM %I', columnsSQL, this.tableName);
        }
        if (this.joinClauses.length > 0) {
            query += ' ' + this.joinClauses.join(' ');
        }
        if (this.structuredJoins.length > 0) {
            const structuredJoinSQL = this.structuredJoins
                .map(join => this.buildStructuredJoinSQL(join))
                .join(' ');
            query += ' ' + structuredJoinSQL;
        }
        if (this.whereConditions.length > 0) {
            let conditions = this.transformConditionColumns(this.whereConditions);
            if (hasJoins) {
                conditions = this.qualifyWhereConditions(conditions, tableRef);
            }
            query += ' WHERE ' + (0, condition_collector_1.buildConditionsSQL)(conditions);
        }
        if (this.groupByColumns.length > 0) {
            const groupBySQL = this.groupByColumns.map(col => {
                if (col.includes('.'))
                    return col;
                if (hasJoins)
                    return (0, pg_format_1.default)('%I.%I', tableRef, col);
                return pg_format_1.default.ident(col);
            }).join(', ');
            query += ' GROUP BY ' + groupBySQL;
        }
        if (this.havingConditions.length > 0) {
            let havingConds = this.transformConditionColumns(this.havingConditions);
            if (hasJoins) {
                havingConds = this.qualifyWhereConditions(havingConds, tableRef);
            }
            query += ' HAVING ' + (0, condition_collector_1.buildConditionsSQL)(havingConds);
        }
        if (this.orderByColumns.length > 0) {
            query += ' ORDER BY ' + this.orderByColumns
                .map(order => {
                let sql = (0, pg_format_1.default)('%I %s', order.column, order.direction);
                if (order.nulls) {
                    sql += ` NULLS ${order.nulls}`;
                }
                return sql;
            })
                .join(', ');
        }
        if (this.limitValue !== undefined) {
            query += (0, pg_format_1.default)(' LIMIT %s', this.limitValue);
        }
        if (this.offsetValue !== undefined) {
            query += (0, pg_format_1.default)(' OFFSET %s', this.offsetValue);
        }
        if (this.lockingClause) {
            query += ' ' + this.lockingClause;
        }
        if (this.unionQueries.length > 0) {
            for (const unionQuery of this.unionQueries) {
                query += ` ${unionQuery.type} ${unionQuery.query}`;
            }
        }
        return query;
    }
    whereRaw(condition) {
        this.whereConditions.push({
            method: 'raw',
            column: condition,
            values: undefined
        });
        return this;
    }
    toCountSQL() {
        let query;
        const hasJoins = this.joinClauses.length > 0 || this.structuredJoins.length > 0;
        const tableRef = this.tableAlias || this.tableName;
        if (this.tableAlias && this.tableAlias !== this.tableName) {
            query = `SELECT COUNT(*) as count FROM ${pg_format_1.default.ident(this.tableName)} AS ${pg_format_1.default.ident(this.tableAlias)}`;
        }
        else {
            query = `SELECT COUNT(*) as count FROM ${pg_format_1.default.ident(this.tableName)}`;
        }
        if (this.joinClauses.length > 0) {
            query += ' ' + this.joinClauses.join(' ');
        }
        if (this.structuredJoins.length > 0) {
            const structuredJoinSQL = this.structuredJoins
                .map(join => this.buildStructuredJoinSQL(join))
                .join(' ');
            query += ' ' + structuredJoinSQL;
        }
        if (this.whereConditions.length > 0) {
            let conditions = this.transformConditionColumns(this.whereConditions);
            if (hasJoins) {
                conditions = this.qualifyWhereConditions(conditions, tableRef);
            }
            query += ' WHERE ' + (0, condition_collector_1.buildConditionsSQL)(conditions);
        }
        if (this.groupByColumns.length > 0) {
            const groupBySQL = this.groupByColumns.map(col => {
                if (col.includes('.'))
                    return col;
                if (hasJoins)
                    return (0, pg_format_1.default)('%I.%I', tableRef, col);
                return pg_format_1.default.ident(col);
            }).join(', ');
            query += ' GROUP BY ' + groupBySQL;
        }
        if (this.havingConditions.length > 0) {
            let havingConds = this.transformConditionColumns(this.havingConditions);
            if (hasJoins) {
                havingConds = this.qualifyWhereConditions(havingConds, tableRef);
            }
            query += ' HAVING ' + (0, condition_collector_1.buildConditionsSQL)(havingConds);
        }
        return query;
    }
}
exports.SelectBuilder = SelectBuilder;
