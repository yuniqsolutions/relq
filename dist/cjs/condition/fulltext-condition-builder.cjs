"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FulltextConditionCollector = void 0;
exports.buildFulltextConditionSQL = buildFulltextConditionSQL;
const pg_format_1 = __importDefault(require("../utils/pg-format.cjs"));
class FulltextConditionCollector {
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
exports.FulltextConditionCollector = FulltextConditionCollector;
function buildFulltextConditionSQL(condition) {
    const { method, column, values } = condition;
    switch (method) {
        case 'fulltext_search': {
            const { query, config } = values;
            const isTsVector = column?.endsWith('_vector') || column?.endsWith('_tsvector');
            if (isTsVector) {
                return (0, pg_format_1.default)('%I @@ plainto_tsquery(%L, %L)', column, config, query);
            }
            else {
                return (0, pg_format_1.default)('to_tsvector(%L, %I) @@ plainto_tsquery(%L, %L)', config, column, config, query);
            }
        }
        case 'fulltext_rank': {
            const { query, minRank, config } = values;
            const isTsVector = column?.endsWith('_vector') || column?.endsWith('_tsvector');
            if (isTsVector) {
                return (0, pg_format_1.default)('ts_rank(%I, plainto_tsquery(%L, %L)) > %L', column, config, query, minRank);
            }
            else {
                return (0, pg_format_1.default)('ts_rank(to_tsvector(%L, %I), plainto_tsquery(%L, %L)) > %L', config, column, config, query, minRank);
            }
        }
        default:
            return '';
    }
}
