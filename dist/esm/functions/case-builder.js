import format from "../utils/pg-format.js";
export class CaseBuilder {
    expression;
    whenClauses = [];
    elseResult;
    constructor(expression) {
        this.expression = expression;
    }
    when(condition, result) {
        this.whenClauses.push({
            condition: String(condition),
            result
        });
        return this;
    }
    else(result) {
        this.elseResult = result;
        return this;
    }
    build() {
        let sql = 'CASE';
        if (this.expression) {
            sql += ` ${format.ident(this.expression)}`;
        }
        for (const clause of this.whenClauses) {
            if (this.expression) {
                sql += ` WHEN ${format('%L', clause.condition)} THEN ${this.formatValue(clause.result)}`;
            }
            else {
                sql += ` WHEN ${clause.condition} THEN ${this.formatValue(clause.result)}`;
            }
        }
        if (this.elseResult !== undefined) {
            sql += ` ELSE ${this.formatValue(this.elseResult)}`;
        }
        sql += ' END';
        return sql;
    }
    as(alias) {
        return `${this.build()} AS ${format.ident(alias)}`;
    }
    toString() {
        return this.build();
    }
    formatValue(value) {
        if (value === null) {
            return 'NULL';
        }
        if (typeof value === 'string' && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) {
            return format.ident(value);
        }
        return format('%L', value);
    }
}
export function Case(expression) {
    return new CaseBuilder(expression);
}
export default Case;
