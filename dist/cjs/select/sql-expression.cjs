"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AggregateFunctions = exports.SqlExpression = void 0;
const table_proxy_1 = require("./table-proxy.cjs");
class SqlExpression {
    sql;
    _isSqlExpression = true;
    constructor(sql) {
        this.sql = sql;
    }
}
exports.SqlExpression = SqlExpression;
class AggregateFunctions {
    count(ref) {
        if (!ref)
            return new SqlExpression('COUNT(*)');
        return new SqlExpression(`COUNT(${(0, table_proxy_1.columnRefToSQL)(ref)})`);
    }
    countDistinct(ref) {
        return new SqlExpression(`COUNT(DISTINCT ${(0, table_proxy_1.columnRefToSQL)(ref)})`);
    }
    sum(ref) {
        return new SqlExpression(`SUM(${(0, table_proxy_1.columnRefToSQL)(ref)})`);
    }
    avg(ref) {
        return new SqlExpression(`AVG(${(0, table_proxy_1.columnRefToSQL)(ref)})`);
    }
    min(ref) {
        return new SqlExpression(`MIN(${(0, table_proxy_1.columnRefToSQL)(ref)})`);
    }
    max(ref) {
        return new SqlExpression(`MAX(${(0, table_proxy_1.columnRefToSQL)(ref)})`);
    }
    raw(sql) {
        return new SqlExpression(sql);
    }
}
exports.AggregateFunctions = AggregateFunctions;
