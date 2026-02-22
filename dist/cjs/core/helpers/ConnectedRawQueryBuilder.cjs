"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectedRawQueryBuilder = void 0;
const raw_1 = require("../../raw/index.cjs");
const methods_1 = require("./methods.cjs");
class ConnectedRawQueryBuilder {
    query;
    params;
    relq;
    builder;
    constructor(query, params, relq) {
        this.query = query;
        this.params = params;
        this.relq = relq;
        const convertedQuery = this.convertPlaceholders(query);
        this.builder = new raw_1.RawQueryBuilder(convertedQuery, this.params);
    }
    convertPlaceholders(query) {
        let index = 0;
        return query.replace(/\?/g, () => `$${++index}`);
    }
    async all() {
        const sql = this.builder.toString();
        return this.relq[methods_1.INTERNAL].executeSelect(sql);
    }
    async get() {
        const sql = this.builder.toString();
        return this.relq[methods_1.INTERNAL].executeSelectOne(sql);
    }
    async getMany(count) {
        const sql = this.builder.toString();
        const limitedSql = sql.toUpperCase().includes('LIMIT')
            ? sql
            : `${sql} LIMIT ${count}`;
        return this.relq[methods_1.INTERNAL].executeSelect(limitedSql);
    }
    async run() {
        const sql = this.builder.toString();
        return this.relq[methods_1.INTERNAL].executeRun(sql);
    }
    async count() {
        const sql = this.builder.toString();
        return this.relq[methods_1.INTERNAL].executeCount(sql);
    }
}
exports.ConnectedRawQueryBuilder = ConnectedRawQueryBuilder;
