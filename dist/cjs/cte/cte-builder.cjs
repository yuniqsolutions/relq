"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CTEBuilder = void 0;
const pg_format_1 = __importDefault(require("../utils/pg-format.cjs"));
const select_builder_1 = require("../select/select-builder.cjs");
const insert_builder_1 = require("../insert/insert-builder.cjs");
const update_builder_1 = require("../update/update-builder.cjs");
const delete_builder_1 = require("../delete/delete-builder.cjs");
class CTEBuilder {
    ctes = [];
    recursiveFlag = false;
    with(name, query, columns) {
        this.ctes.push({
            name,
            query: typeof query === 'string' ? query : query.toString(),
            columns
        });
        return this;
    }
    withRecursive(name, query, columns) {
        this.recursiveFlag = true;
        this.ctes.push({
            name,
            query,
            columns
        });
        return this;
    }
    withMaterialized(name, query, columns) {
        this.ctes.push({
            name,
            query: typeof query === 'string' ? query : query.toString(),
            columns,
            materialized: true
        });
        return this;
    }
    withNotMaterialized(name, query, columns) {
        this.ctes.push({
            name,
            query: typeof query === 'string' ? query : query.toString(),
            columns,
            notMaterialized: true
        });
        return this;
    }
    select(columns) {
        const builder = new select_builder_1.SelectBuilder('__CTE__', columns);
        return builder;
    }
    insert(tableName, data) {
        return new insert_builder_1.InsertBuilder(tableName, data);
    }
    update(tableName, data) {
        return new update_builder_1.UpdateBuilder(tableName, data);
    }
    delete(tableName) {
        return new delete_builder_1.DeleteBuilder(tableName);
    }
    buildCTEClause() {
        if (this.ctes.length === 0)
            return '';
        const keyword = this.recursiveFlag ? 'WITH RECURSIVE' : 'WITH';
        const cteStrings = this.ctes.map(cte => {
            let str = pg_format_1.default.ident(cte.name);
            if (cte.columns && cte.columns.length > 0) {
                str += ` (${cte.columns.map(c => pg_format_1.default.ident(c)).join(', ')})`;
            }
            str += ' AS ';
            if (cte.materialized) {
                str += 'MATERIALIZED ';
            }
            else if (cte.notMaterialized) {
                str += 'NOT MATERIALIZED ';
            }
            str += `(${cte.query})`;
            return str;
        });
        return `${keyword} ${cteStrings.join(', ')}`;
    }
    toString(mainQuery) {
        const cteClause = this.buildCTEClause();
        return cteClause ? `${cteClause} ${mainQuery}` : mainQuery;
    }
}
exports.CTEBuilder = CTEBuilder;
