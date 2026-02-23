"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectedScalarSelectBuilder = exports.ScalarSelectBuilder = void 0;
const pg_format_1 = __importDefault(require("../utils/pg-format.cjs"));
const scalar_query_builder_1 = require("./scalar-query-builder.cjs");
class ScalarSelectBuilder {
    executeQuery;
    scalarResults;
    constructor(scalars, schema, executeQuery, getColumnResolver) {
        this.executeQuery = executeQuery;
        const tableAccessor = (0, scalar_query_builder_1.createScalarTableAccessor)(schema, getColumnResolver);
        this.scalarResults = {};
        for (const [key, callback] of Object.entries(scalars)) {
            this.scalarResults[key] = callback(tableAccessor);
        }
    }
    toString() {
        const columns = Object.entries(this.scalarResults)
            .map(([alias, scalar]) => `${scalar.toSQL()} AS ${pg_format_1.default.ident(alias)}`)
            .join(', ');
        return `SELECT ${columns}`;
    }
    async get(withMetadata) {
        const sql = this.toString();
        const { data, metadata } = await this.executeQuery(sql);
        const row = Array.isArray(data) ? data[0] : data;
        const result = this.transformResult(row);
        if (withMetadata) {
            return { data: result, metadata };
        }
        return result;
    }
    transformResult(row) {
        if (!row) {
            const result = {};
            for (const key of Object.keys(this.scalarResults)) {
                result[key] = null;
            }
            return result;
        }
        const result = {};
        for (const [key, value] of Object.entries(row)) {
            if (typeof value === 'string' && /^\d+$/.test(value)) {
                result[key] = parseInt(value, 10);
            }
            else if (typeof value === 'string' && /^\d+\.\d+$/.test(value)) {
                result[key] = parseFloat(value);
            }
            else {
                result[key] = value;
            }
        }
        return result;
    }
}
exports.ScalarSelectBuilder = ScalarSelectBuilder;
class ConnectedScalarSelectBuilder extends ScalarSelectBuilder {
    constructor(scalars, schema, internal) {
        const executeQuery = async (sql) => {
            return internal.executeSelectOne(sql);
        };
        const getColumnResolver = (tableName) => {
            if (internal.hasColumnMapping()) {
                return (column) => {
                    const transformed = internal.transformToDbColumns(tableName, { [column]: null });
                    const keys = Object.keys(transformed);
                    return keys.length > 0 ? keys[0] : column;
                };
            }
            return undefined;
        };
        super(scalars, schema, executeQuery, getColumnResolver);
    }
}
exports.ConnectedScalarSelectBuilder = ConnectedScalarSelectBuilder;
