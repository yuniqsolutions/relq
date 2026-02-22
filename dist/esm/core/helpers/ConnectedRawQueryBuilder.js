import { RawQueryBuilder } from "../../raw/index.js";
import { INTERNAL } from "./methods.js";
export class ConnectedRawQueryBuilder {
    query;
    params;
    relq;
    builder;
    constructor(query, params, relq) {
        this.query = query;
        this.params = params;
        this.relq = relq;
        const convertedQuery = this.convertPlaceholders(query);
        this.builder = new RawQueryBuilder(convertedQuery, this.params);
    }
    convertPlaceholders(query) {
        let index = 0;
        return query.replace(/\?/g, () => `$${++index}`);
    }
    async all() {
        const sql = this.builder.toString();
        return this.relq[INTERNAL].executeSelect(sql);
    }
    async get() {
        const sql = this.builder.toString();
        return this.relq[INTERNAL].executeSelectOne(sql);
    }
    async getMany(count) {
        const sql = this.builder.toString();
        const limitedSql = sql.toUpperCase().includes('LIMIT')
            ? sql
            : `${sql} LIMIT ${count}`;
        return this.relq[INTERNAL].executeSelect(limitedSql);
    }
    async run() {
        const sql = this.builder.toString();
        return this.relq[INTERNAL].executeRun(sql);
    }
    async count() {
        const sql = this.builder.toString();
        return this.relq[INTERNAL].executeCount(sql);
    }
}
