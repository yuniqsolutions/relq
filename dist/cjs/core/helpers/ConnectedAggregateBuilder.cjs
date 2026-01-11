"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectedAggregateBuilder = void 0;
const methods_1 = require("./methods.cjs");
class ConnectedAggregateBuilder {
    builder;
    relq;
    tableName;
    constructor(builder, relq, tableName) {
        this.builder = builder;
        this.relq = relq;
        this.tableName = tableName;
    }
    mapColumn(column) {
        const transformed = this.relq[methods_1.INTERNAL].transformToDbColumns(this.tableName, { [column]: true });
        return Object.keys(transformed)[0] || column;
    }
    groupBy(...columns) {
        const dbColumns = columns.map(col => this.mapColumn(col));
        this.builder.groupBy(...dbColumns);
        return this;
    }
    count(alias) {
        this.builder.count(alias);
        return this;
    }
    countColumn(column, alias) {
        this.builder.countColumn(this.mapColumn(column), alias);
        return this;
    }
    countDistinct(column, alias) {
        this.builder.countDistinct(this.mapColumn(column), alias);
        return this;
    }
    sum(column, alias) {
        this.builder.sum(this.mapColumn(column), alias);
        return this;
    }
    avg(column, alias) {
        this.builder.avg(this.mapColumn(column), alias);
        return this;
    }
    min(column, alias) {
        this.builder.min(this.mapColumn(column), alias);
        return this;
    }
    max(column, alias) {
        this.builder.max(this.mapColumn(column), alias);
        return this;
    }
    arrayAgg(column, alias) {
        this.builder.arrayAgg(this.mapColumn(column), alias);
        return this;
    }
    stringAgg(column, delimiter, alias) {
        this.builder.stringAgg(this.mapColumn(column), delimiter || ', ', alias);
        return this;
    }
    jsonAgg(column, alias) {
        this.builder.jsonAgg(this.mapColumn(column), alias);
        return this;
    }
    jsonbAgg(column, alias) {
        this.builder.jsonbAgg(this.mapColumn(column), alias);
        return this;
    }
    boolAnd(column, alias) {
        this.builder.boolAnd(this.mapColumn(column), alias);
        return this;
    }
    boolOr(column, alias) {
        this.builder.boolOr(this.mapColumn(column), alias);
        return this;
    }
    where(callback) {
        this.builder.where(callback);
        return this;
    }
    having(callback) {
        this.builder.having(callback);
        return this;
    }
    orderBy(column, direction = 'ASC') {
        this.builder.orderBy(this.mapColumn(column), direction);
        return this;
    }
    limit(count) {
        this.builder.limit(count);
        return this;
    }
    offset(count) {
        this.builder.offset(count);
        return this;
    }
    toString() {
        return this.builder.toString();
    }
    async all() {
        const sql = this.builder.toString();
        const result = await this.relq[methods_1.INTERNAL].executeSelect(sql, this.tableName);
        const numericAliases = this.builder.getNumericAliases();
        if (numericAliases.length > 0) {
            for (const row of result.data) {
                for (const alias of numericAliases) {
                    if (alias in row && typeof row[alias] === 'string') {
                        row[alias] = Number(row[alias]);
                    }
                }
            }
        }
        return result.data;
    }
    async get() {
        this.builder.limit(1);
        const sql = this.builder.toString();
        const result = await this.relq[methods_1.INTERNAL].executeSelectOne(sql, this.tableName);
        const numericAliases = this.builder.getNumericAliases();
        if (numericAliases.length > 0 && result.data) {
            for (const alias of numericAliases) {
                if (alias in result.data && typeof result.data[alias] === 'string') {
                    result.data[alias] = Number(result.data[alias]);
                }
            }
        }
        return result.data;
    }
}
exports.ConnectedAggregateBuilder = ConnectedAggregateBuilder;
