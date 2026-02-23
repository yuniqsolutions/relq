import format from "../utils/pg-format.js";
import { RelqQueryError } from "../errors/relq-errors.js";
export class RawQueryBuilder {
    query;
    params;
    constructor(query, params = []) {
        this.query = query;
        this.params = params;
    }
    toString() {
        if (!this.query || typeof this.query !== 'string' || this.query.trim() === '') {
            throw new RelqQueryError(`Invalid query provided: ${this.query === null ? 'null' : this.query === undefined ? 'undefined' : 'empty string'}`, { hint: 'Provide a valid SQL query string' });
        }
        const result = this.params.length > 0 ? format(this.query, ...this.params) : this.query;
        if (!result || typeof result !== 'string') {
            throw new RelqQueryError(`format() returned invalid result: ${result === null ? 'null' : result === undefined ? 'undefined' : typeof result}`, { sql: this.query });
        }
        return result;
    }
}
