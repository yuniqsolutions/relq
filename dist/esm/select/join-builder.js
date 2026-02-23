import { JoinConditionBuilder } from "./join-condition-builder.js";
import { columnRefToSQL, columnRefToSQLUnqualified } from "./table-proxy.js";
import { ConditionCollector, buildConditionsSQL } from "../condition/condition-collector.js";
import format from "../utils/pg-format.js";
export class JoinManyBuilder extends JoinConditionBuilder {
    orderBySpecs = [];
    selectColumns = [];
    limitValue;
    offsetValue;
    groupByColumns = [];
    havingConditions = [];
    selectRefs(columns) {
        this.selectColumns = columns;
        return this;
    }
    orderBy(column, direction = 'ASC') {
        this.orderBySpecs.push({ column, direction });
        return this;
    }
    orderByNulls(column, direction, nulls) {
        this.orderBySpecs.push({ column, direction, nulls });
        return this;
    }
    limit(count) {
        this.limitValue = count;
        return this;
    }
    offset(count) {
        this.offsetValue = count;
        return this;
    }
    groupBy(...columns) {
        this.groupByColumns.push(...columns);
        return this;
    }
    having(callback) {
        const collector = new ConditionCollector();
        callback(collector);
        this.havingConditions.push(...collector.getConditions());
        return this;
    }
    hasQueryModifiers() {
        return (this.orderBySpecs.length > 0 ||
            this.selectColumns.length > 0 ||
            this.limitValue !== undefined ||
            this.offsetValue !== undefined ||
            this.groupByColumns.length > 0 ||
            this.havingConditions.length > 0);
    }
    getSelectColumns() {
        return [...this.selectColumns];
    }
    getOrderBySpecs() {
        return [...this.orderBySpecs];
    }
    getLimit() {
        return this.limitValue;
    }
    getOffset() {
        return this.offsetValue;
    }
    toLateralSQL(rightTable, rightAlias, leftAlias) {
        const selectPart = this.buildSelectPart();
        const fromPart = format.ident(rightTable);
        const wherePart = this.buildWherePart(leftAlias);
        const groupByPart = this.buildGroupByPart();
        const havingPart = this.buildHavingPart();
        const orderByPart = this.buildOrderByPart();
        const limitPart = this.buildLimitPart();
        let innerQuery = `SELECT ${selectPart} FROM ${fromPart}`;
        if (wherePart) {
            innerQuery += ` WHERE ${wherePart}`;
        }
        if (groupByPart) {
            innerQuery += ` GROUP BY ${groupByPart}`;
        }
        if (havingPart) {
            innerQuery += ` HAVING ${havingPart}`;
        }
        if (orderByPart) {
            innerQuery += ` ORDER BY ${orderByPart}`;
        }
        if (limitPart) {
            innerQuery += limitPart;
        }
        const wrappedQuery = `SELECT COALESCE(json_agg(sub.*), '[]'::json) as ${format.ident(rightAlias)} FROM (${innerQuery}) sub`;
        return `(${wrappedQuery})`;
    }
    toSubquerySQL(rightTable, leftAlias) {
        const selectPart = this.buildSelectPart();
        const fromPart = format.ident(rightTable);
        const wherePart = this.buildWherePart(leftAlias);
        const groupByPart = this.buildGroupByPart();
        const havingPart = this.buildHavingPart();
        const orderByPart = this.buildOrderByPart();
        const limitPart = this.buildLimitPart();
        let query = `SELECT ${selectPart} FROM ${fromPart}`;
        if (wherePart) {
            query += ` WHERE ${wherePart}`;
        }
        if (groupByPart) {
            query += ` GROUP BY ${groupByPart}`;
        }
        if (havingPart) {
            query += ` HAVING ${havingPart}`;
        }
        if (orderByPart) {
            query += ` ORDER BY ${orderByPart}`;
        }
        if (limitPart) {
            query += limitPart;
        }
        return query;
    }
    buildSelectPart() {
        if (this.selectColumns.length === 0) {
            return '*';
        }
        return this.selectColumns
            .map(col => columnRefToSQLUnqualified(col))
            .join(', ');
    }
    buildWherePart(leftAlias) {
        const parts = [];
        for (const cond of this.conditions) {
            if (cond.type === 'using' || cond.type === 'raw') {
                if (cond.raw)
                    parts.push(cond.raw);
                continue;
            }
            const leftSQL = columnRefToSQL(cond.left);
            const rightSQL = this.formatRightSide(cond.right);
            parts.push(`${leftSQL} ${cond.operator} ${rightSQL}`);
        }
        if (this.whereConditions.length > 0) {
            const whereSQL = buildConditionsSQL(this.whereConditions);
            if (whereSQL) {
                parts.push(whereSQL);
            }
        }
        return parts.length > 0 ? parts.join(' AND ') : null;
    }
    buildGroupByPart() {
        if (this.groupByColumns.length === 0) {
            return null;
        }
        return this.groupByColumns
            .map(col => columnRefToSQLUnqualified(col))
            .join(', ');
    }
    buildHavingPart() {
        if (this.havingConditions.length === 0) {
            return null;
        }
        return buildConditionsSQL(this.havingConditions);
    }
    buildOrderByPart() {
        if (this.orderBySpecs.length === 0) {
            return null;
        }
        return this.orderBySpecs
            .map(spec => {
            let sql = `${columnRefToSQLUnqualified(spec.column)} ${spec.direction}`;
            if (spec.nulls) {
                sql += ` NULLS ${spec.nulls}`;
            }
            return sql;
        })
            .join(', ');
    }
    buildLimitPart() {
        let sql = '';
        if (this.limitValue !== undefined) {
            sql += ` LIMIT ${this.limitValue}`;
        }
        if (this.offsetValue !== undefined) {
            sql += ` OFFSET ${this.offsetValue}`;
        }
        return sql;
    }
}
export function createJoinManyBuilder() {
    return new JoinManyBuilder();
}
