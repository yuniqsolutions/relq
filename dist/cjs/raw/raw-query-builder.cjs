"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RawQueryBuilder = void 0;
const pg_format_1 = __importDefault(require("../utils/pg-format.cjs"));
const relq_errors_1 = require("../errors/relq-errors.cjs");
class RawQueryBuilder {
    query;
    params;
    constructor(query, params = []) {
        this.query = query;
        this.params = params;
    }
    toString() {
        if (!this.query || typeof this.query !== 'string' || this.query.trim() === '') {
            throw new relq_errors_1.RelqQueryError(`Invalid query provided: ${this.query === null ? 'null' : this.query === undefined ? 'undefined' : 'empty string'}`, { hint: 'Provide a valid SQL query string' });
        }
        const result = this.params.length > 0 ? (0, pg_format_1.default)(this.query, ...this.params) : this.query;
        if (!result || typeof result !== 'string') {
            throw new relq_errors_1.RelqQueryError(`format() returned invalid result: ${result === null ? 'null' : result === undefined ? 'undefined' : typeof result}`, { sql: this.query });
        }
        return result;
    }
}
exports.RawQueryBuilder = RawQueryBuilder;
