"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CaseBuilder = void 0;
exports.Case = Case;
const pg_format_1 = __importDefault(require("../utils/pg-format.cjs"));
class CaseBuilder {
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
            sql += ` ${pg_format_1.default.ident(this.expression)}`;
        }
        for (const clause of this.whenClauses) {
            if (this.expression) {
                sql += ` WHEN ${(0, pg_format_1.default)('%L', clause.condition)} THEN ${this.formatValue(clause.result)}`;
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
        return `${this.build()} AS ${pg_format_1.default.ident(alias)}`;
    }
    toString() {
        return this.build();
    }
    formatValue(value) {
        if (value === null) {
            return 'NULL';
        }
        if (typeof value === 'string' && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) {
            return pg_format_1.default.ident(value);
        }
        return (0, pg_format_1.default)('%L', value);
    }
}
exports.CaseBuilder = CaseBuilder;
function Case(expression) {
    return new CaseBuilder(expression);
}
exports.default = Case;
