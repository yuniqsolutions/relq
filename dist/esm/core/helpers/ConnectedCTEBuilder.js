import { INTERNAL } from "./methods.js";
export class ConnectedCTEBuilder {
    relq;
    ctes = [];
    constructor(relq) {
        this.relq = relq;
    }
    with(name, query) {
        const queryStr = typeof query === 'string' ? query : query.toString();
        this.ctes.push({ name, query: queryStr });
        return this;
    }
    withMaterialized(name, query) {
        const queryStr = typeof query === 'string' ? query : query.toString();
        this.ctes.push({ name, query: `MATERIALIZED (${queryStr})` });
        return this;
    }
    async query(sql) {
        const cteClause = this.buildCTEClause();
        const fullSql = `${cteClause} ${sql}`;
        const result = await this.relq[INTERNAL].executeQuery(fullSql);
        return {
            data: result.result.rows,
            rowCount: result.result.rowCount ?? 0
        };
    }
    async all(sql) {
        const result = await this.query(sql);
        return result.data;
    }
    async get(sql) {
        const result = await this.query(sql);
        return result.data[0] ?? null;
    }
    buildCTEClause() {
        if (this.ctes.length === 0)
            return '';
        const cteStrings = this.ctes.map(cte => {
            if (cte.query.startsWith('MATERIALIZED')) {
                return `"${cte.name}" AS ${cte.query}`;
            }
            return `"${cte.name}" AS (${cte.query})`;
        });
        return `WITH ${cteStrings.join(', ')}`;
    }
    toSQL(mainQuery) {
        return `${this.buildCTEClause()} ${mainQuery}`;
    }
}
