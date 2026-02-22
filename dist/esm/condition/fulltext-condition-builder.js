import format from "../utils/pg-format.js";
export class FulltextConditionCollector {
    parent;
    constructor(parent) {
        this.parent = parent;
    }
    search(column, query, config = 'english') {
        this.parent.conditions.push({
            method: 'fulltext_search',
            column,
            values: { query, config }
        });
        return this.parent;
    }
    match(column, query, config = 'english') {
        return this.search(column, query, config);
    }
    rank(column, query, minRank = 0, config = 'english') {
        this.parent.conditions.push({
            method: 'fulltext_rank',
            column,
            values: { query, minRank, config }
        });
        return this.parent;
    }
}
export function buildFulltextConditionSQL(condition) {
    const { method, column, values } = condition;
    switch (method) {
        case 'fulltext_search': {
            const { query, config } = values;
            const isTsVector = column?.endsWith('_vector') || column?.endsWith('_tsvector');
            if (isTsVector) {
                return format('%I @@ plainto_tsquery(%L, %L)', column, config, query);
            }
            else {
                return format('to_tsvector(%L, %I) @@ plainto_tsquery(%L, %L)', config, column, config, query);
            }
        }
        case 'fulltext_rank': {
            const { query, minRank, config } = values;
            const isTsVector = column?.endsWith('_vector') || column?.endsWith('_tsvector');
            if (isTsVector) {
                return format('ts_rank(%I, plainto_tsquery(%L, %L)) > %L', column, config, query, minRank);
            }
            else {
                return format('ts_rank(to_tsvector(%L, %I), plainto_tsquery(%L, %L)) > %L', config, column, config, query, minRank);
            }
        }
        default:
            return '';
    }
}
