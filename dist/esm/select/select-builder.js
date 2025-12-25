import format from "../addon/pg-format/index.js";
import { ConditionCollector, buildConditionsSQL } from "../condition/condition-collector.js";
export class SelectBuilder {
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
        const conditionBuilder = new ConditionCollector();
        callback(conditionBuilder);
        this.whereConditions.push(...conditionBuilder.getConditions());
        return this;
    }
    join(table, condition) {
        this.joinClauses.push(`JOIN ${format.ident(table)} ON ${condition}`);
        return this;
    }
    leftJoin(table, condition) {
        this.joinClauses.push(`LEFT JOIN ${format.ident(table)} ON ${condition}`);
        return this;
    }
    rightJoin(table, condition) {
        this.joinClauses.push(`RIGHT JOIN ${format.ident(table)} ON ${condition}`);
        return this;
    }
    innerJoin(table, condition) {
        this.joinClauses.push(`INNER JOIN ${format.ident(table)} ON ${condition}`);
        return this;
    }
    groupBy(...columns) {
        this.groupByColumns.push(...columns);
        return this;
    }
    having(callback) {
        const conditionBuilder = new ConditionCollector();
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
        this.joinClauses.push(`FULL OUTER JOIN ${format.ident(table)} ON ${condition}`);
        return this;
    }
    crossJoin(table) {
        this.joinClauses.push(`CROSS JOIN ${format.ident(table)}`);
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
                return format('%I AS %I', column, alias);
            }
            if (col.includes('(') || col.includes('DISTINCT') || col.includes(' AS ')) {
                return col;
            }
            return format.ident(col);
        }).join(', ');
        let query = 'SELECT';
        if (this.distinctOnColumns.length > 0) {
            const distinctCols = this.distinctOnColumns.map(col => format.ident(col)).join(', ');
            query += format(' DISTINCT ON (%s)', distinctCols);
        }
        query += format(' %s FROM %I', columns, this.tableName);
        if (this.joinClauses.length > 0) {
            query += ' ' + this.joinClauses.join(' ');
        }
        if (this.whereConditions.length > 0) {
            query += ' WHERE ' + buildConditionsSQL(this.whereConditions);
        }
        if (this.groupByColumns.length > 0) {
            query += ' GROUP BY ' + this.groupByColumns.map(col => format.ident(col)).join(', ');
        }
        if (this.havingConditions.length > 0) {
            query += ' HAVING ' + buildConditionsSQL(this.havingConditions);
        }
        if (this.orderByColumns.length > 0) {
            query += ' ORDER BY ' + this.orderByColumns
                .map(order => format('%I %s', order.column, order.direction))
                .join(', ');
        }
        if (this.limitValue !== undefined) {
            query += format(' LIMIT %s', this.limitValue);
        }
        if (this.offsetValue !== undefined) {
            query += format(' OFFSET %s', this.offsetValue);
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
        let query = `SELECT COUNT(*) as count FROM ${format.ident(this.tableName)}`;
        if (this.joinClauses.length > 0) {
            query += ' ' + this.joinClauses.join(' ');
        }
        if (this.whereConditions.length > 0) {
            query += ' WHERE ' + buildConditionsSQL(this.whereConditions);
        }
        if (this.groupByColumns.length > 0) {
            query += ' GROUP BY ' + this.groupByColumns.map(col => format.ident(col)).join(', ');
        }
        if (this.havingConditions.length > 0) {
            query += ' HAVING ' + buildConditionsSQL(this.havingConditions);
        }
        return query;
    }
}
