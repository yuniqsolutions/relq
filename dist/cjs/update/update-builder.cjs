"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateBuilder = void 0;
const pg_format_1 = __importDefault(require("../utils/pg-format.cjs"));
const condition_collector_1 = require("../condition/condition-collector.cjs");
const case_converter_1 = require("../utils/case-converter.cjs");
const array_update_builder_1 = require("./array-update-builder.cjs");
const jsonb_update_builder_1 = require("./jsonb-update-builder.cjs");
const select_builder_1 = require("../select/select-builder.cjs");
const count_builder_1 = require("../count/count-builder.cjs");
class UpdateBuilder {
    tableName;
    updateData;
    whereConditions = [];
    returningClause;
    _case = 'keep-case';
    _convertCase = '2snake';
    columnResolver;
    columnTypeResolver;
    constructor(tableName, data) {
        this.tableName = tableName;
        this.updateData = this.normalizeData(data);
    }
    normalizeData(data) {
        const normalized = {};
        for (const [key, value] of Object.entries(data)) {
            normalized[key] = value === undefined ? null : value;
        }
        return normalized;
    }
    setColumnResolver(resolver) {
        this.columnResolver = resolver;
        return this;
    }
    setColumnTypeResolver(resolver) {
        this.columnTypeResolver = resolver;
        return this;
    }
    resolveColumnName(name) {
        if (this.columnResolver) {
            return this.columnResolver(name);
        }
        return this.convertColumnName(name);
    }
    transformConditionColumns(conditions) {
        if (!this.columnResolver) {
            return conditions;
        }
        return conditions.map(cond => {
            if (cond.method === 'or' || cond.method === 'and') {
                return {
                    ...cond,
                    values: this.transformConditionColumns(cond.values)
                };
            }
            if (!cond.column || cond.method === 'raw') {
                return cond;
            }
            if (cond.column.includes('.')) {
                const [tableRef, colName] = cond.column.split('.');
                return {
                    ...cond,
                    column: `${tableRef}.${this.columnResolver(colName)}`
                };
            }
            return {
                ...cond,
                column: this.columnResolver(cond.column)
            };
        });
    }
    convertCase(type, conversionCase = '2snake') {
        this._case = type;
        this._convertCase = conversionCase;
        return this;
    }
    where(callback) {
        const conditionBuilder = new condition_collector_1.ConditionCollector();
        callback(conditionBuilder);
        this.whereConditions.push(...conditionBuilder.getConditions());
        return this;
    }
    returning(columns) {
        if (columns === null) {
            this.returningClause = undefined;
        }
        else {
            this.returningClause = {
                type: 'columns',
                columns: Array.isArray(columns) ? columns : [columns]
            };
        }
        return this;
    }
    returningSelect(callback) {
        const builder = new select_builder_1.SelectBuilder(this.tableName);
        const result = callback(builder);
        if (result === null) {
            this.returningClause = undefined;
        }
        else {
            this.returningClause = {
                type: 'select',
                builder: result
            };
        }
        return this;
    }
    returningCount(callback) {
        const builder = new count_builder_1.CountBuilder(this.tableName);
        const result = callback(builder);
        if (result === null) {
            this.returningClause = undefined;
        }
        else {
            this.returningClause = {
                type: 'count',
                builder: result
            };
        }
        return this;
    }
    convertColumnName(name) {
        if (this._case === 'to-lower')
            return name.toLowerCase();
        if (this._case === 'to-upper')
            return name.toUpperCase();
        if (this._case === 'convert-case')
            return (0, case_converter_1.convertCase)(name, this._convertCase);
        return name;
    }
    formatPostgresArray(value) {
        if (value.length === 0)
            return 'ARRAY[]';
        const firstElement = value[0];
        const firstType = typeof firstElement;
        const isHomogeneous = value.every(v => typeof v === firstType);
        if (!isHomogeneous) {
            const jsonValues = value.map(v => (0, pg_format_1.default)('%L::jsonb', JSON.stringify(v))).join(',');
            return `ARRAY[${jsonValues}]`;
        }
        if (firstType === 'string') {
            const stringValues = value.map(v => (0, pg_format_1.default)('%L', v)).join(',');
            return `ARRAY[${stringValues}]`;
        }
        if (firstType === 'number') {
            return `ARRAY[${value.join(',')}]`;
        }
        if (firstType === 'boolean') {
            return `ARRAY[${value.map(v => v.toString()).join(',')}]`;
        }
        if (firstType === 'object' && firstElement !== null) {
            const jsonValues = value.map(v => (0, pg_format_1.default)('%L::jsonb', JSON.stringify(v))).join(',');
            return `ARRAY[${jsonValues}]`;
        }
        const stringValues = value.map(v => (0, pg_format_1.default)('%L', v)).join(',');
        return `ARRAY[${stringValues}]`;
    }
    formatJsonbValue(value) {
        const json = JSON.stringify(value).replace(/'/g, "''");
        return `'${json}'::jsonb`;
    }
    formatArrayValueWithType(colName, value) {
        const typeInfo = this.columnTypeResolver?.(colName);
        if (typeInfo) {
            if (typeInfo.isArray) {
                return this.formatPostgresArray(value);
            }
            else if (typeInfo.type === 'jsonb' || typeInfo.type === 'json') {
                return this.formatJsonbValue(value);
            }
            else {
                return this.formatJsonbValue(value);
            }
        }
        return this.formatJsonbValue(value);
    }
    toString() {
        const processedPairs = Object.entries(this.updateData).map(([col, val]) => {
            const convertedCol = this.resolveColumnName(col);
            if (typeof val === 'function') {
                const operationsBuilder = {
                    array: new array_update_builder_1.ArrayUpdateBuilder(col),
                    jsonb: new jsonb_update_builder_1.JsonbUpdateBuilder(col)
                };
                const result = val(operationsBuilder);
                const finalResult = result.replace(/__COLUMN__/g, pg_format_1.default.ident(convertedCol));
                return (0, pg_format_1.default)('%I = %s', convertedCol, finalResult);
            }
            if (Array.isArray(val)) {
                return (0, pg_format_1.default)('%I = %s', convertedCol, this.formatArrayValueWithType(col, val));
            }
            if (val !== null && typeof val === 'object' && !(val instanceof Date)) {
                return (0, pg_format_1.default)('%I = %s', convertedCol, this.formatJsonbValue(val));
            }
            return (0, pg_format_1.default)('%I = %L', convertedCol, val);
        });
        let query = (0, pg_format_1.default)('UPDATE %I SET %s', this.tableName, processedPairs.join(', '));
        if (this.whereConditions.length > 0) {
            const transformedConditions = this.transformConditionColumns(this.whereConditions);
            query += ' WHERE ' + (0, condition_collector_1.buildConditionsSQL)(transformedConditions);
        }
        if (this.returningClause) {
            query += this.buildReturningClause();
        }
        return query;
    }
    parseCountColumns(columnsStr) {
        const columns = [];
        let depth = 0;
        let currentExpr = '';
        let i = 0;
        while (i < columnsStr.length) {
            const char = columnsStr[i];
            if (char === '(')
                depth++;
            else if (char === ')')
                depth--;
            else if (char === ',' && depth === 0) {
                if (currentExpr.trim()) {
                    columns.push(this.parseColumnExpr(currentExpr.trim()));
                }
                currentExpr = '';
                i++;
                continue;
            }
            currentExpr += char;
            i++;
        }
        if (currentExpr.trim()) {
            columns.push(this.parseColumnExpr(currentExpr.trim()));
        }
        return columns;
    }
    parseColumnExpr(expr) {
        const asMatch = expr.match(/^(.+?)\s+AS\s+(.+)$/i);
        if (!asMatch) {
            return { name: 'count', expr };
        }
        const [, expression, alias] = asMatch;
        const name = alias.replace(/^["']|["']$/g, '');
        return { name, expr: expression.trim() };
    }
    buildReturningClause() {
        if (!this.returningClause)
            return '';
        switch (this.returningClause.type) {
            case 'columns': {
                const resolvedColumns = this.returningClause.columns.map(col => col === '*' ? '*' : this.resolveColumnName(col));
                return (0, pg_format_1.default)(' RETURNING %I', resolvedColumns);
            }
            case 'select': {
                const selectSQL = this.returningClause.builder.toString();
                return ` RETURNING (${selectSQL})`;
            }
            case 'count': {
                const countSQL = this.returningClause.builder.toString();
                const selectMatch = countSQL.match(/^SELECT\s+(.+?)\s+FROM\s+(.+)$/is);
                if (!selectMatch)
                    return ` RETURNING (${countSQL})`;
                const [, columnsStr, fromClause] = selectMatch;
                const columns = this.parseCountColumns(columnsStr);
                const jsonArgs = columns.map(({ name, expr }) => `${(0, pg_format_1.default)('%L', name)}, ${expr}`).join(', ');
                return ` RETURNING (SELECT json_build_object(${jsonArgs}) FROM ${fromClause})`;
            }
            default:
                return '';
        }
    }
}
exports.UpdateBuilder = UpdateBuilder;
