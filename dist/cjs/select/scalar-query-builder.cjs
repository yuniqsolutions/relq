"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScalarQueryBuilderImpl = void 0;
exports.createScalarTableAccessor = createScalarTableAccessor;
const pg_format_1 = __importDefault(require("../utils/pg-format.cjs"));
const condition_collector_1 = require("../condition/condition-collector.cjs");
class ScalarResultImpl {
    sql;
    params;
    $scalar = true;
    $type;
    constructor(sql, params = []) {
        this.sql = sql;
        this.params = params;
    }
    toSQL() {
        return this.sql;
    }
    getParams() {
        return this.params;
    }
}
class ScalarQueryBuilderImpl {
    tableName;
    tableSchema;
    columnResolver;
    whereConditions = [];
    constructor(tableName, tableSchema, columnResolver) {
        this.tableName = tableName;
        this.tableSchema = tableSchema;
        this.columnResolver = columnResolver;
    }
    where(callback) {
        const conditionBuilder = new condition_collector_1.ConditionCollector();
        callback(conditionBuilder);
        this.whereConditions.push(...conditionBuilder.getConditions());
        return this;
    }
    count() {
        const sql = this.buildSQL('COUNT(*)');
        return new ScalarResultImpl(sql);
    }
    sum(column) {
        const sqlColumn = this.resolveColumn(column);
        const sql = this.buildSQL(`COALESCE(SUM(${pg_format_1.default.ident(sqlColumn)}), 0)`);
        return new ScalarResultImpl(sql);
    }
    avg(column) {
        const sqlColumn = this.resolveColumn(column);
        const sql = this.buildSQL(`COALESCE(AVG(${pg_format_1.default.ident(sqlColumn)}), 0)`);
        return new ScalarResultImpl(sql);
    }
    min(column) {
        const sqlColumn = this.resolveColumn(column);
        const sql = this.buildSQL(`MIN(${pg_format_1.default.ident(sqlColumn)})`);
        return new ScalarResultImpl(sql);
    }
    max(column) {
        const sqlColumn = this.resolveColumn(column);
        const sql = this.buildSQL(`MAX(${pg_format_1.default.ident(sqlColumn)})`);
        return new ScalarResultImpl(sql);
    }
    pick(column) {
        const sqlColumn = this.resolveColumn(column);
        const sql = this.buildSQL(pg_format_1.default.ident(sqlColumn), true);
        return new ScalarResultImpl(sql);
    }
    exists() {
        const whereClause = this.buildWhereClause();
        const sql = `(EXISTS(SELECT 1 FROM ${pg_format_1.default.ident(this.tableName)}${whereClause}))`;
        return new ScalarResultImpl(sql);
    }
    resolveColumn(column) {
        if (this.columnResolver) {
            return this.columnResolver(column);
        }
        const columns = this.tableSchema?.$columns || this.tableSchema;
        const columnDef = columns?.[column];
        if (columnDef?.$columnName) {
            return columnDef.$columnName;
        }
        return column.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
    }
    transformConditions(conditions) {
        if (!this.columnResolver && !this.tableSchema) {
            return conditions;
        }
        return conditions.map(cond => {
            if (!cond.column || cond.method === 'raw') {
                return cond;
            }
            if (cond.method === 'or' || cond.method === 'and') {
                return {
                    ...cond,
                    values: this.transformConditions(cond.values)
                };
            }
            return {
                ...cond,
                column: this.resolveColumn(cond.column)
            };
        });
    }
    buildWhereClause() {
        if (this.whereConditions.length === 0) {
            return '';
        }
        const transformed = this.transformConditions(this.whereConditions);
        return ` WHERE ${(0, condition_collector_1.buildConditionsSQL)(transformed)}`;
    }
    buildSQL(selectExpr, withLimit = false) {
        const whereClause = this.buildWhereClause();
        const limitClause = withLimit ? ' LIMIT 1' : '';
        return `(SELECT ${selectExpr} FROM ${pg_format_1.default.ident(this.tableName)}${whereClause}${limitClause})`;
    }
}
exports.ScalarQueryBuilderImpl = ScalarQueryBuilderImpl;
function createScalarTableAccessor(schema, getColumnResolver) {
    return new Proxy({}, {
        get(_, prop) {
            if (typeof prop === 'symbol') {
                return undefined;
            }
            const tables = schema?.tables || schema;
            const tableDef = tables?.[prop];
            const sqlTableName = tableDef?.$name || prop;
            const columnResolver = getColumnResolver?.(sqlTableName);
            return new ScalarQueryBuilderImpl(sqlTableName, tableDef, columnResolver);
        }
    });
}
