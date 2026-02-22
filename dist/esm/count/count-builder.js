import format from "../utils/pg-format.js";
import { ConditionCollector, buildConditionsSQL, buildConditionSQL } from "../condition/condition-collector.js";
export class CountBuilder {
    tableName;
    countGroups = [];
    whereConditions = [];
    constructor(tableName) {
        this.tableName = tableName;
    }
    group(name, callback, options) {
        const conditionBuilder = new ConditionCollector();
        callback(conditionBuilder);
        let aggregateFunction = 'COUNT';
        let column;
        if (options) {
            if (options.distinct) {
                aggregateFunction = 'COUNT_DISTINCT';
                column = options.distinct;
            }
            else if (options.sum) {
                aggregateFunction = 'SUM';
                column = options.sum;
            }
            else if (options.avg) {
                aggregateFunction = 'AVG';
                column = options.avg;
            }
            else if (options.min) {
                aggregateFunction = 'MIN';
                column = options.min;
            }
            else if (options.max) {
                aggregateFunction = 'MAX';
                column = options.max;
            }
        }
        this.countGroups.push({
            name,
            conditions: conditionBuilder.getConditions(),
            aggregateFunction,
            column
        });
        return this;
    }
    where(callback) {
        const conditionBuilder = new ConditionCollector();
        callback(conditionBuilder);
        this.whereConditions.push(...conditionBuilder.getConditions());
        return this;
    }
    toString() {
        let selectColumns = [];
        if (this.countGroups.length > 0) {
            selectColumns = this.countGroups.map(group => this.buildGroupSQL(group));
        }
        else {
            selectColumns.push('COUNT(*) AS count');
        }
        let query = format('SELECT %s FROM %I', selectColumns.join(', '), this.tableName);
        if (this.whereConditions.length > 0) {
            query += ' WHERE ' + buildConditionsSQL(this.whereConditions);
        }
        return query;
    }
    buildGroupSQL(group) {
        const conditionsSQL = group.conditions.map(condition => buildConditionSQL(condition)).join(' AND ');
        let aggregateColumn = '*';
        if (group.column) {
            aggregateColumn = group.aggregateFunction === 'COUNT_DISTINCT'
                ? format('DISTINCT %I', group.column)
                : format.ident(group.column);
        }
        const funcName = group.aggregateFunction === 'COUNT_DISTINCT' ? 'COUNT' : group.aggregateFunction;
        if (group.conditions.length > 0) {
            return format('%s(%s) FILTER (WHERE %s) AS %I', funcName, aggregateColumn, conditionsSQL, group.name);
        }
        else {
            return format('%s(%s) AS %I', funcName, aggregateColumn, group.name);
        }
    }
}
