"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DropFunctionBuilder = exports.CreateFunctionBuilder = void 0;
const pg_format_1 = __importDefault(require("../utils/pg-format.cjs"));
const relq_errors_1 = require("../errors/relq-errors.cjs");
class CreateFunctionBuilder {
    functionName;
    __parameters = [];
    returnType;
    __returnsTable;
    __returnsSetOf;
    __language = 'plpgsql';
    functionBody;
    volatility = 'VOLATILE';
    security = 'INVOKER';
    __parallel = 'UNSAFE';
    costValue;
    rowsValue;
    strictFlag = false;
    leakproofFlag = false;
    orReplaceFlag = false;
    constructor(functionName) {
        this.functionName = functionName;
    }
    parameter(name, type, defaultValue, mode = 'IN') {
        this.__parameters.push({ name, type, default: defaultValue, mode });
        return this;
    }
    parameters(params) {
        Object.entries(params).forEach(([name, type]) => {
            this.__parameters.push({ name, type });
        });
        return this;
    }
    returns(type) {
        this.returnType = type;
        return this;
    }
    returnsTable(columns) {
        this.__returnsTable = columns;
        return this;
    }
    returnsSetOf(type) {
        this.__returnsSetOf = type;
        return this;
    }
    language(lang) {
        this.__language = lang;
        return this;
    }
    body(sql) {
        this.functionBody = sql.trim();
        return this;
    }
    immutable() {
        this.volatility = 'IMMUTABLE';
        return this;
    }
    stable() {
        this.volatility = 'STABLE';
        return this;
    }
    volatile() {
        this.volatility = 'VOLATILE';
        return this;
    }
    securityDefiner() {
        this.security = 'DEFINER';
        return this;
    }
    securityInvoker() {
        this.security = 'INVOKER';
        return this;
    }
    parallel(safety) {
        this.__parallel = safety;
        return this;
    }
    strict() {
        this.strictFlag = true;
        return this;
    }
    leakproof() {
        this.leakproofFlag = true;
        return this;
    }
    cost(estimatedCost) {
        this.costValue = estimatedCost;
        return this;
    }
    rows(estimatedRows) {
        this.rowsValue = estimatedRows;
        return this;
    }
    orReplace() {
        this.orReplaceFlag = true;
        return this;
    }
    toString() {
        if (!this.returnType && !this.__returnsTable && !this.__returnsSetOf) {
            throw new relq_errors_1.RelqBuilderError('Return type is required', { builder: 'CreateFunctionBuilder', missing: 'returnType', hint: 'Use .returns(), .returnsTable(), or .returnsSetOf()' });
        }
        if (!this.functionBody) {
            throw new relq_errors_1.RelqBuilderError('Function body is required', { builder: 'CreateFunctionBuilder', missing: 'body', hint: 'Use .body()' });
        }
        let sql = 'CREATE';
        if (this.orReplaceFlag) {
            sql += ' OR REPLACE';
        }
        sql += ` FUNCTION ${pg_format_1.default.ident(this.functionName)}`;
        if (this.__parameters.length > 0) {
            const params = this.__parameters.map(p => {
                let paramSQL = '';
                if (p.mode && p.mode !== 'IN') {
                    paramSQL += `${p.mode} `;
                }
                paramSQL += `${pg_format_1.default.ident(p.name)} ${p.type}`;
                if (p.default !== undefined) {
                    paramSQL += ` DEFAULT ${(0, pg_format_1.default)('%L', p.default)}`;
                }
                return paramSQL;
            });
            sql += `(${params.join(', ')})`;
        }
        else {
            sql += '()';
        }
        if (this.__returnsTable) {
            const tableCols = Object.entries(this.__returnsTable)
                .map(([name, type]) => `${pg_format_1.default.ident(name)} ${type}`)
                .join(', ');
            sql += ` RETURNS TABLE(${tableCols})`;
        }
        else if (this.__returnsSetOf) {
            sql += ` RETURNS SETOF ${this.__returnsSetOf}`;
        }
        else {
            sql += ` RETURNS ${this.returnType}`;
        }
        sql += ` LANGUAGE ${this.language}`;
        sql += ` ${this.volatility}`;
        if (this.strictFlag) {
            sql += ' STRICT';
        }
        sql += ` SECURITY ${this.security}`;
        sql += ` PARALLEL ${this.__parallel}`;
        if (this.leakproofFlag) {
            sql += ' LEAKPROOF';
        }
        if (this.costValue !== undefined) {
            sql += ` COST ${this.costValue}`;
        }
        if (this.rowsValue !== undefined) {
            sql += ` ROWS ${this.rowsValue}`;
        }
        sql += ` AS $$${this.functionBody}$$`;
        return sql;
    }
}
exports.CreateFunctionBuilder = CreateFunctionBuilder;
class DropFunctionBuilder {
    functionName;
    parameterTypes;
    ifExistsFlag = false;
    cascadeFlag = false;
    constructor(functionName, parameterTypes) {
        this.functionName = functionName;
        this.parameterTypes = parameterTypes;
    }
    ifExists() {
        this.ifExistsFlag = true;
        return this;
    }
    cascade() {
        this.cascadeFlag = true;
        return this;
    }
    toString() {
        let sql = 'DROP FUNCTION';
        if (this.ifExistsFlag) {
            sql += ' IF EXISTS';
        }
        sql += ` ${pg_format_1.default.ident(this.functionName)}`;
        if (this.parameterTypes && this.parameterTypes.length > 0) {
            sql += `(${this.parameterTypes.join(', ')})`;
        }
        if (this.cascadeFlag) {
            sql += ' CASCADE';
        }
        return sql;
    }
}
exports.DropFunctionBuilder = DropFunctionBuilder;
