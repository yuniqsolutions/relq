import format from "../utils/pg-format.js";
import { SelectBuilder } from "../select/select-builder.js";
import { InsertBuilder } from "../insert/insert-builder.js";
import { UpdateBuilder } from "../update/update-builder.js";
import { DeleteBuilder } from "../delete/delete-builder.js";
export class CTEBuilder {
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
        const builder = new SelectBuilder('__CTE__', columns);
        return builder;
    }
    insert(tableName, data) {
        return new InsertBuilder(tableName, data);
    }
    update(tableName, data) {
        return new UpdateBuilder(tableName, data);
    }
    delete(tableName) {
        return new DeleteBuilder(tableName);
    }
    buildCTEClause() {
        if (this.ctes.length === 0)
            return '';
        const keyword = this.recursiveFlag ? 'WITH RECURSIVE' : 'WITH';
        const cteStrings = this.ctes.map(cte => {
            let str = format.ident(cte.name);
            if (cte.columns && cte.columns.length > 0) {
                str += ` (${cte.columns.map(c => format.ident(c)).join(', ')})`;
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
