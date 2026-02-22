"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExplainBuilder = void 0;
class ExplainBuilder {
    query;
    options;
    constructor(query, options = {}) {
        this.query = query;
        this.options = options;
    }
    analyze(enable = true) {
        this.options.analyze = enable;
        return this;
    }
    verbose(enable = true) {
        this.options.verbose = enable;
        return this;
    }
    costs(enable = true) {
        this.options.costs = enable;
        return this;
    }
    settings(enable = true) {
        this.options.settings = enable;
        return this;
    }
    buffers(enable = true) {
        this.options.buffers = enable;
        if (enable) {
            this.options.analyze = true;
        }
        return this;
    }
    timing(enable = true) {
        this.options.timing = enable;
        if (enable) {
            this.options.analyze = true;
        }
        return this;
    }
    summary(enable = true) {
        this.options.summary = enable;
        return this;
    }
    wal(enable = true) {
        this.options.wal = enable;
        if (enable) {
            this.options.analyze = true;
        }
        return this;
    }
    format(format) {
        this.options.format = format;
        return this;
    }
    toString() {
        const options = [];
        if (this.options.analyze) {
            options.push('ANALYZE');
        }
        if (this.options.verbose) {
            options.push('VERBOSE');
        }
        if (this.options.costs === false) {
            options.push('COSTS FALSE');
        }
        else if (this.options.costs === true) {
            options.push('COSTS TRUE');
        }
        if (this.options.settings) {
            options.push('SETTINGS');
        }
        if (this.options.buffers) {
            options.push('BUFFERS');
        }
        if (this.options.timing === false) {
            options.push('TIMING FALSE');
        }
        else if (this.options.timing === true) {
            options.push('TIMING TRUE');
        }
        if (this.options.summary) {
            options.push('SUMMARY');
        }
        if (this.options.wal) {
            options.push('WAL');
        }
        if (this.options.format) {
            options.push(`FORMAT ${this.options.format}`);
        }
        let sql = 'EXPLAIN';
        if (options.length > 0) {
            sql += ` (${options.join(', ')})`;
        }
        sql += ' ' + this.query;
        return sql;
    }
}
exports.ExplainBuilder = ExplainBuilder;
