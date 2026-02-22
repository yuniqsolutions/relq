"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JoinConditionBuilder = void 0;
exports.createJoinConditionBuilder = createJoinConditionBuilder;
const table_proxy_1 = require("./table-proxy.cjs");
const condition_collector_1 = require("../condition/condition-collector.cjs");
const pg_format_1 = __importDefault(require("../utils/pg-format.cjs"));
const join_internals_1 = require("./join-internals.cjs");
class JoinConditionBuilder {
    conditions = [];
    whereConditions = [];
    selectedColumns;
    equal(left, right) {
        this.conditions.push({
            type: 'equal',
            left,
            right,
            operator: '='
        });
        return this;
    }
    notEqual(left, right) {
        this.conditions.push({
            type: 'notEqual',
            left,
            right,
            operator: '!='
        });
        return this;
    }
    greaterThan(left, right) {
        this.conditions.push({
            type: 'greaterThan',
            left,
            right,
            operator: '>'
        });
        return this;
    }
    lessThan(left, right) {
        this.conditions.push({
            type: 'lessThan',
            left,
            right,
            operator: '<'
        });
        return this;
    }
    greaterThanOrEqual(left, right) {
        this.conditions.push({
            type: 'greaterThanOrEqual',
            left,
            right,
            operator: '>='
        });
        return this;
    }
    lessThanOrEqual(left, right) {
        this.conditions.push({
            type: 'lessThanOrEqual',
            left,
            right,
            operator: '<='
        });
        return this;
    }
    like(left, right) {
        this.conditions.push({
            type: 'like',
            left,
            right,
            operator: 'LIKE'
        });
        return this;
    }
    ilike(left, right) {
        this.conditions.push({
            type: 'ilike',
            left,
            right,
            operator: 'ILIKE'
        });
        return this;
    }
    using(...columns) {
        this.conditions.push({
            type: 'using',
            columns: columns
        });
        return this;
    }
    where(callback) {
        const collector = new condition_collector_1.ConditionCollector();
        callback(collector);
        this.whereConditions.push(...collector.getConditions());
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
            toSQL: () => this.internalToSQL(),
            isUsingJoin: () => this.internalIsUsingJoin(),
            getUsingColumns: () => this.internalGetUsingColumns(),
            toUsingSQL: () => this.internalToUsingSQL(),
            getConditions: () => [...this.conditions],
            getWhereConditions: () => [...this.whereConditions],
            hasConditions: () => this.conditions.length > 0,
            hasWhereConditions: () => this.whereConditions.length > 0,
            getSelectedColumns: () => this.selectedColumns ?? null,
        };
    }
    internalToSQL() {
        const parts = [];
        for (const cond of this.conditions) {
            switch (cond.type) {
                case 'using':
                    break;
                case 'raw':
                    parts.push(cond.raw);
                    break;
                default:
                    const leftSQL = (0, table_proxy_1.columnRefToSQL)(cond.left);
                    const rightSQL = this.formatRightSide(cond.right);
                    parts.push(`${leftSQL} ${cond.operator} ${rightSQL}`);
                    break;
            }
        }
        if (this.whereConditions.length > 0) {
            const whereSQL = (0, condition_collector_1.buildConditionsSQL)(this.whereConditions);
            if (whereSQL) {
                parts.push(whereSQL);
            }
        }
        return parts.join(' AND ');
    }
    internalIsUsingJoin() {
        return this.conditions.length === 1 && this.conditions[0].type === 'using';
    }
    internalGetUsingColumns() {
        if (!this.internalIsUsingJoin())
            return null;
        return this.conditions[0].columns || null;
    }
    internalToUsingSQL() {
        const columns = this.internalGetUsingColumns();
        if (!columns)
            return null;
        return `USING (${columns.map(c => pg_format_1.default.ident(c)).join(', ')})`;
    }
    formatRightSide(right) {
        if ((0, table_proxy_1.isColumnRef)(right)) {
            return (0, table_proxy_1.columnRefToSQL)(right);
        }
        if (right === null) {
            return 'NULL';
        }
        if (typeof right === 'boolean') {
            return right ? 'true' : 'false';
        }
        if (typeof right === 'number') {
            return String(right);
        }
        if (typeof right === 'string') {
            return pg_format_1.default.literal(right);
        }
        if (right instanceof Date) {
            return pg_format_1.default.literal(right.toISOString());
        }
        if (Array.isArray(right)) {
            return `ARRAY[${right.map(v => this.formatRightSide(v)).join(', ')}]`;
        }
        return pg_format_1.default.literal(JSON.stringify(right));
    }
}
exports.JoinConditionBuilder = JoinConditionBuilder;
function createJoinConditionBuilder() {
    return new JoinConditionBuilder();
}
