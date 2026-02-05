import format from "../utils/pg-format.js";
import { ConditionCollector, buildConditionsSQL } from "../condition/condition-collector.js";
import { SelectBuilder } from "../select/select-builder.js";
import { CountBuilder } from "../count/count-builder.js";
export class DeleteBuilder {
    tableName;
    whereConditions = [];
    returningClause;
    columnResolver;
    constructor(tableName) {
        this.tableName = tableName;
    }
    setColumnResolver(resolver) {
        this.columnResolver = resolver;
        return this;
    }
    resolveColumnName(name) {
        if (this.columnResolver) {
            return this.columnResolver(name);
        }
        return name;
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
            if (!cond.column || cond.method === 'raw') {
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
    where(callback) {
        const conditionBuilder = new ConditionCollector();
        callback(conditionBuilder);
        this.whereConditions.push(...conditionBuilder.getConditions());
        return this;
    }
    returning(columns) {
        if (columns === null) {
            this.returningClause = undefined;
        }
        else {
            this.returningClause = {
                type: 'columns',
                columns: Array.isArray(columns) ? columns : [columns]
            };
        }
        return this;
    }
    returningSelect(callback) {
        const builder = new SelectBuilder(this.tableName);
        const result = callback(builder);
        if (result === null) {
            this.returningClause = undefined;
        }
        else {
            this.returningClause = {
                type: 'select',
                builder: result
            };
        }
        return this;
    }
    returningCount(callback) {
        const builder = new CountBuilder(this.tableName);
        const result = callback(builder);
        if (result === null) {
            this.returningClause = undefined;
        }
        else {
            this.returningClause = {
                type: 'count',
                builder: result
            };
        }
        return this;
    }
    toString() {
        let query = format('DELETE FROM %I', this.tableName);
        if (this.whereConditions.length > 0) {
            const transformedConditions = this.transformConditionColumns(this.whereConditions);
            query += ' WHERE ' + buildConditionsSQL(transformedConditions);
        }
        if (this.returningClause) {
            query += this.buildReturningClause();
        }
        return query;
    }
    parseCountColumns(columnsStr) {
        const columns = [];
        let depth = 0;
        let currentExpr = '';
        let i = 0;
        while (i < columnsStr.length) {
            const char = columnsStr[i];
            if (char === '(')
                depth++;
            else if (char === ')')
                depth--;
            else if (char === ',' && depth === 0) {
                if (currentExpr.trim()) {
                    columns.push(this.parseColumnExpr(currentExpr.trim()));
                }
                currentExpr = '';
                i++;
                continue;
            }
            currentExpr += char;
            i++;
        }
        if (currentExpr.trim()) {
            columns.push(this.parseColumnExpr(currentExpr.trim()));
        }
        return columns;
    }
    parseColumnExpr(expr) {
        const asMatch = expr.match(/^(.+?)\s+AS\s+(.+)$/i);
        if (!asMatch) {
            return { name: 'count', expr };
        }
        const [, expression, alias] = asMatch;
        const name = alias.replace(/^["']|["']$/g, '');
        return { name, expr: expression.trim() };
    }
    buildReturningClause() {
        if (!this.returningClause)
            return '';
        switch (this.returningClause.type) {
            case 'columns': {
                const resolvedColumns = this.returningClause.columns.map(col => col === '*' ? '*' : this.resolveColumnName(col));
                return format(' RETURNING %I', resolvedColumns);
            }
            case 'select': {
                const selectSQL = this.returningClause.builder.toString();
                return ` RETURNING (${selectSQL})`;
            }
            case 'count': {
                const countSQL = this.returningClause.builder.toString();
                const selectMatch = countSQL.match(/^SELECT\s+(.+?)\s+FROM\s+(.+)$/is);
                if (!selectMatch)
                    return ` RETURNING (${countSQL})`;
                const [, columnsStr, fromClause] = selectMatch;
                const columns = this.parseCountColumns(columnsStr);
                const jsonArgs = columns.map(({ name, expr }) => `${format('%L', name)}, ${expr}`).join(', ');
                return ` RETURNING (SELECT json_build_object(${jsonArgs}) FROM ${fromClause})`;
            }
            default:
                return '';
        }
    }
}
