import { columnRefToSQL } from "./table-proxy.js";
export class SqlExpression {
    sql;
    _isSqlExpression = true;
    constructor(sql) {
        this.sql = sql;
    }
}
export class AggregateFunctions {
    count(ref) {
        if (!ref)
            return new SqlExpression('COUNT(*)');
        return new SqlExpression(`COUNT(${columnRefToSQL(ref)})`);
    }
    countDistinct(ref) {
        return new SqlExpression(`COUNT(DISTINCT ${columnRefToSQL(ref)})`);
    }
    sum(ref) {
        return new SqlExpression(`SUM(${columnRefToSQL(ref)})`);
    }
    avg(ref) {
        return new SqlExpression(`AVG(${columnRefToSQL(ref)})`);
    }
    min(ref) {
        return new SqlExpression(`MIN(${columnRefToSQL(ref)})`);
    }
    max(ref) {
        return new SqlExpression(`MAX(${columnRefToSQL(ref)})`);
    }
    raw(sql) {
        return new SqlExpression(sql);
    }
}
