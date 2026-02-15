"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CountBuilder = void 0;
const pg_format_1 = __importDefault(require("../utils/pg-format.cjs"));
const condition_collector_1 = require("../condition/condition-collector.cjs");
class CountBuilder {
    tableName;
    countGroups = [];
    whereConditions = [];
    constructor(tableName) {
        this.tableName = tableName;
    }
    group(name, callback, options) {
        const conditionBuilder = new condition_collector_1.ConditionCollector();
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
        const conditionBuilder = new condition_collector_1.ConditionCollector();
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
        let query = (0, pg_format_1.default)('SELECT %s FROM %I', selectColumns.join(', '), this.tableName);
        if (this.whereConditions.length > 0) {
            query += ' WHERE ' + (0, condition_collector_1.buildConditionsSQL)(this.whereConditions);
        }
        return query;
    }
    buildGroupSQL(group) {
        const conditionsSQL = group.conditions.map(condition => (0, condition_collector_1.buildConditionSQL)(condition)).join(' AND ');
        let aggregateColumn = '*';
        if (group.column) {
            aggregateColumn = group.aggregateFunction === 'COUNT_DISTINCT'
                ? (0, pg_format_1.default)('DISTINCT %I', group.column)
                : pg_format_1.default.ident(group.column);
        }
        const funcName = group.aggregateFunction === 'COUNT_DISTINCT' ? 'COUNT' : group.aggregateFunction;
        if (group.conditions.length > 0) {
            return (0, pg_format_1.default)('%s(%s) FILTER (WHERE %s) AS %I', funcName, aggregateColumn, conditionsSQL, group.name);
        }
        else {
            return (0, pg_format_1.default)('%s(%s) AS %I', funcName, aggregateColumn, group.name);
        }
    }
}
exports.CountBuilder = CountBuilder;
