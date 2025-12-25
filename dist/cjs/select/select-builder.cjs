"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SelectBuilder = void 0;
const pg_format_1 = __importDefault(require("../addon/pg-format/index.cjs"));
const condition_collector_1 = require("../condition/condition-collector.cjs");
class SelectBuilder {
    tableName;
    selectColumns = ['*'];
    whereConditions = [];
    havingConditions = [];
    joinClauses = [];
    groupByColumns = [];
    orderByColumns = [];
    limitValue;
    offsetValue;
    distinctOnColumns = [];
    lockingClause;
    unionQueries = [];
    constructor(tableName, columns) {
        this.tableName = tableName;
        if (columns) {
            this.selectColumns = Array.isArray(columns) ? columns : [columns];
        }
    }
    distinct() {
        this.selectColumns = this.selectColumns.map(col => {
            if (typeof col === 'string') {
                return col.startsWith('DISTINCT') ? col : `DISTINCT ${col}`;
            }
            return col;
        });
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
    toString() {
        const columns = this.selectColumns.map(col => {
            if (col === '*')
                return '*';
            if (Array.isArray(col)) {
                const [column, alias] = col;
                return (0, pg_format_1.default)('%I AS %I', column, alias);
            }
            if (col.includes('(') || col.includes('DISTINCT') || col.includes(' AS ')) {
                return col;
            }
            return pg_format_1.default.ident(col);
        }).join(', ');
        let query = 'SELECT';
        if (this.distinctOnColumns.length > 0) {
            const distinctCols = this.distinctOnColumns.map(col => pg_format_1.default.ident(col)).join(', ');
            query += (0, pg_format_1.default)(' DISTINCT ON (%s)', distinctCols);
        }
        query += (0, pg_format_1.default)(' %s FROM %I', columns, this.tableName);
        if (this.joinClauses.length > 0) {
            query += ' ' + this.joinClauses.join(' ');
        }
        if (this.whereConditions.length > 0) {
            query += ' WHERE ' + (0, condition_collector_1.buildConditionsSQL)(this.whereConditions);
        }
        if (this.groupByColumns.length > 0) {
            query += ' GROUP BY ' + this.groupByColumns.map(col => pg_format_1.default.ident(col)).join(', ');
        }
        if (this.havingConditions.length > 0) {
            query += ' HAVING ' + (0, condition_collector_1.buildConditionsSQL)(this.havingConditions);
        }
        if (this.orderByColumns.length > 0) {
            query += ' ORDER BY ' + this.orderByColumns
                .map(order => (0, pg_format_1.default)('%I %s', order.column, order.direction))
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
        let query = `SELECT COUNT(*) as count FROM ${pg_format_1.default.ident(this.tableName)}`;
        if (this.joinClauses.length > 0) {
            query += ' ' + this.joinClauses.join(' ');
        }
        if (this.whereConditions.length > 0) {
            query += ' WHERE ' + (0, condition_collector_1.buildConditionsSQL)(this.whereConditions);
        }
        if (this.groupByColumns.length > 0) {
            query += ' GROUP BY ' + this.groupByColumns.map(col => pg_format_1.default.ident(col)).join(', ');
        }
        if (this.havingConditions.length > 0) {
            query += ' HAVING ' + (0, condition_collector_1.buildConditionsSQL)(this.havingConditions);
        }
        return query;
    }
}
exports.SelectBuilder = SelectBuilder;
