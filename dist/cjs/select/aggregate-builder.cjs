"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AggregateQueryBuilder = void 0;
const pg_format_1 = __importDefault(require("../utils/pg-format.cjs"));
const condition_collector_1 = require("../condition/condition-collector.cjs");
const NUMERIC_FUNCS = new Set(['COUNT', 'SUM', 'AVG', 'MIN', 'MAX']);
class AggregateQueryBuilder {
    tableName;
    groupByColumns = [];
    entries = [];
    whereConditions = [];
    havingConditions = [];
    orderByColumns = [];
    limitValue;
    offsetValue;
    constructor(tableName) {
        this.tableName = tableName;
    }
    groupBy(...columns) {
        this.groupByColumns.push(...columns);
        return this;
    }
    count(alias = 'count') {
        this.entries.push({ func: 'COUNT', column: '*', alias });
        return this;
    }
    countColumn(column, alias) {
        this.entries.push({ func: 'COUNT', column, alias: alias || column });
        return this;
    }
    countDistinct(column, alias) {
        this.entries.push({ func: 'COUNT', column, alias: alias || column, distinct: true });
        return this;
    }
    sum(column, alias, filter) {
        const entry = { func: 'SUM', column, alias: alias || column };
        if (filter) {
            const collector = new condition_collector_1.ConditionCollector();
            filter(collector);
            entry.filterConditions = collector.getConditions();
        }
        this.entries.push(entry);
        return this;
    }
    avg(column, alias, filter) {
        const entry = { func: 'AVG', column, alias: alias || column };
        if (filter) {
            const collector = new condition_collector_1.ConditionCollector();
            filter(collector);
            entry.filterConditions = collector.getConditions();
        }
        this.entries.push(entry);
        return this;
    }
    min(column, alias) {
        this.entries.push({ func: 'MIN', column, alias: alias || column });
        return this;
    }
    max(column, alias) {
        this.entries.push({ func: 'MAX', column, alias: alias || column });
        return this;
    }
    arrayAgg(column, alias) {
        this.entries.push({ func: 'ARRAY_AGG', column, alias: alias || column });
        return this;
    }
    stringAgg(column, delimiter = ', ', alias) {
        this.entries.push({ func: 'STRING_AGG', column, alias: alias || column, delimiter });
        return this;
    }
    jsonAgg(column, alias) {
        this.entries.push({ func: 'JSON_AGG', column, alias: alias || column });
        return this;
    }
    jsonbAgg(column, alias) {
        this.entries.push({ func: 'JSONB_AGG', column, alias: alias || column });
        return this;
    }
    boolAnd(column, alias) {
        this.entries.push({ func: 'BOOL_AND', column, alias: alias || column });
        return this;
    }
    boolOr(column, alias) {
        this.entries.push({ func: 'BOOL_OR', column, alias: alias || column });
        return this;
    }
    where(callback) {
        const collector = new condition_collector_1.ConditionCollector();
        callback(collector);
        this.whereConditions.push(...collector.getConditions());
        return this;
    }
    having(callback) {
        const collector = new condition_collector_1.ConditionCollector();
        callback(collector);
        this.havingConditions.push(...collector.getConditions());
        return this;
    }
    orderBy(column, direction = 'ASC') {
        this.orderByColumns.push({ column, direction });
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
    getNumericAliases() {
        return this.entries
            .filter(e => NUMERIC_FUNCS.has(e.func))
            .map(e => e.alias);
    }
    getGroupByColumns() {
        return this.groupByColumns;
    }
    toString() {
        const selectParts = [];
        for (const col of this.groupByColumns) {
            selectParts.push(pg_format_1.default.ident(col));
        }
        for (const entry of this.entries) {
            selectParts.push(this.buildEntrySQL(entry));
        }
        if (selectParts.length === 0) {
            selectParts.push('COUNT(*) AS count');
        }
        let query = (0, pg_format_1.default)('SELECT %s FROM %I', selectParts.join(', '), this.tableName);
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
                .map(o => `${pg_format_1.default.ident(o.column)} ${o.direction}`)
                .join(', ');
        }
        if (this.limitValue !== undefined) {
            query += (0, pg_format_1.default)(' LIMIT %s', this.limitValue);
        }
        if (this.offsetValue !== undefined) {
            query += (0, pg_format_1.default)(' OFFSET %s', this.offsetValue);
        }
        return query;
    }
    buildEntrySQL(entry) {
        let columnExpr;
        if (entry.column === '*') {
            columnExpr = '*';
        }
        else if (entry.distinct) {
            columnExpr = `DISTINCT ${pg_format_1.default.ident(entry.column)}`;
        }
        else if (entry.func === 'STRING_AGG' && entry.delimiter) {
            columnExpr = `${pg_format_1.default.ident(entry.column)}, ${pg_format_1.default.literal(entry.delimiter)}`;
        }
        else {
            columnExpr = pg_format_1.default.ident(entry.column);
        }
        let sql = `${entry.func}(${columnExpr})`;
        if (entry.filterConditions && entry.filterConditions.length > 0) {
            const filterSQL = (0, condition_collector_1.buildConditionsSQL)(entry.filterConditions);
            sql += ` FILTER (WHERE ${filterSQL})`;
        }
        sql += ` AS ${pg_format_1.default.ident(entry.alias)}`;
        return sql;
    }
}
exports.AggregateQueryBuilder = AggregateQueryBuilder;
