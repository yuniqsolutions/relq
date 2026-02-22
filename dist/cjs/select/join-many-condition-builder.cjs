"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JoinManyConditionBuilder = void 0;
exports.createJoinManyConditionBuilder = createJoinManyConditionBuilder;
const table_proxy_1 = require("./table-proxy.cjs");
const join_condition_builder_1 = require("./join-condition-builder.cjs");
const join_internals_1 = require("./join-internals.cjs");
const pg_format_1 = __importDefault(require("../utils/pg-format.cjs"));
class JoinManyConditionBuilder extends join_condition_builder_1.JoinConditionBuilder {
    orderSpecs = [];
    limitValue;
    offsetValue;
    innerJoins = [];
    proxyCreator;
    rightProxy;
    orderBy(column, direction = 'ASC', nulls) {
        this.orderSpecs.push({ column, direction, nulls });
        return this;
    }
    limit(count) {
        this.limitValue = count;
        return this;
    }
    offset(count) {
        this.offsetValue = count;
        return this;
    }
    get [join_internals_1.JOIN_SETUP]() {
        return (creator, rightProxy) => {
            this.proxyCreator = creator;
            this.rightProxy = rightProxy;
        };
    }
    innerJoin(tableOrAlias, callback) {
        if (!this.proxyCreator) {
            throw new Error('innerJoin requires proxy creator - use raw innerJoinRaw() instead');
        }
        const [tableKey, alias] = Array.isArray(tableOrAlias)
            ? tableOrAlias
            : [tableOrAlias, tableOrAlias];
        const { proxy: innerProxy, tableName } = this.proxyCreator(tableKey, alias);
        const conditionBuilder = new join_condition_builder_1.JoinConditionBuilder();
        callback(conditionBuilder, innerProxy);
        const internals = conditionBuilder[join_internals_1.JOIN_INTERNAL];
        const onClause = internals.toSQL();
        this.innerJoins.push({ type: 'JOIN', table: tableName, alias, onClause });
        return this;
    }
    leftInnerJoin(tableOrAlias, callback) {
        if (!this.proxyCreator) {
            throw new Error('leftInnerJoin requires proxy creator - use raw leftInnerJoinRaw() instead');
        }
        const [tableKey, alias] = Array.isArray(tableOrAlias)
            ? tableOrAlias
            : [tableOrAlias, tableOrAlias];
        const { proxy: innerProxy, tableName } = this.proxyCreator(tableKey, alias);
        const conditionBuilder = new join_condition_builder_1.JoinConditionBuilder();
        callback(conditionBuilder, innerProxy);
        const internals = conditionBuilder[join_internals_1.JOIN_INTERNAL];
        const onClause = internals.toSQL();
        this.innerJoins.push({ type: 'LEFT JOIN', table: tableName, alias, onClause });
        return this;
    }
    innerJoinRaw(table, alias, onClause) {
        this.innerJoins.push({ type: 'JOIN', table, alias, onClause });
        return this;
    }
    leftInnerJoinRaw(table, alias, onClause) {
        this.innerJoins.push({ type: 'LEFT JOIN', table, alias, onClause });
        return this;
    }
    select(...args) {
        if (args.length === 1 && Array.isArray(args[0])) {
            this.selectedColumns = args[0];
        }
        else {
            this.selectedColumns = args;
        }
        return this;
    }
    get [join_internals_1.JOIN_INTERNAL]() {
        return {
            toSQL: () => this.buildSQL(),
            isUsingJoin: () => false,
            getUsingColumns: () => null,
            toUsingSQL: () => null,
            getConditions: () => [...this.conditions],
            getWhereConditions: () => [...this.whereConditions],
            hasConditions: () => this.conditions.length > 0,
            hasWhereConditions: () => this.whereConditions.length > 0,
            getSelectedColumns: () => this.selectedColumns ?? null,
            toSelectSQL: (alias) => this.buildSelectSQL(alias),
            toOrderBySQL: () => this.buildOrderBySQL(),
            toLimitSQL: () => this.buildLimitSQL(),
            toOffsetSQL: () => this.buildOffsetSQL(),
            toWhereSQL: () => this.buildSQL(),
            getInnerJoins: () => [...this.innerJoins],
        };
    }
    buildSQL() {
        const parts = [];
        for (const cond of this.conditions) {
            if (cond.type === 'raw') {
                parts.push(cond.raw);
            }
            else if (cond.type !== 'using') {
                const leftSQL = (0, table_proxy_1.columnRefToSQL)(cond.left);
                const rightSQL = this.formatRightSide(cond.right);
                parts.push(`${leftSQL} ${cond.operator} ${rightSQL}`);
            }
        }
        if (this.whereConditions.length > 0) {
            const { buildConditionsSQL } = require("../condition/condition-collector.cjs");
            const whereSQL = buildConditionsSQL(this.whereConditions);
            if (whereSQL) {
                parts.push(whereSQL);
            }
        }
        return parts.join(' AND ');
    }
    buildSelectSQL(tableAlias) {
        if (!this.selectedColumns || this.selectedColumns.length === 0) {
            return `${pg_format_1.default.ident(tableAlias)}.*`;
        }
        return this.selectedColumns.map(col => `${pg_format_1.default.ident(tableAlias)}.${pg_format_1.default.ident(col)}`).join(', ');
    }
    buildOrderBySQL() {
        if (this.orderSpecs.length === 0) {
            return null;
        }
        return this.orderSpecs.map(spec => {
            const col = pg_format_1.default.ident(spec.column);
            let sql = `${col} ${spec.direction}`;
            if (spec.nulls) {
                sql += ` NULLS ${spec.nulls}`;
            }
            return sql;
        }).join(', ');
    }
    buildLimitSQL() {
        if (this.limitValue === undefined) {
            return null;
        }
        return `LIMIT ${this.limitValue}`;
    }
    buildOffsetSQL() {
        if (this.offsetValue === undefined) {
            return null;
        }
        return `OFFSET ${this.offsetValue}`;
    }
}
exports.JoinManyConditionBuilder = JoinManyConditionBuilder;
function createJoinManyConditionBuilder() {
    return new JoinManyConditionBuilder();
}
