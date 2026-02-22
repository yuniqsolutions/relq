"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CopyFromBuilder = exports.CopyToBuilder = void 0;
const pg_format_1 = __importDefault(require("../utils/pg-format.cjs"));
const relq_errors_1 = require("../errors/relq-errors.cjs");
class CopyToBuilder {
    tableName;
    queryString;
    columns = [];
    destination = 'STDOUT';
    options = {};
    constructor(source) {
        if (source) {
            this.tableName = source;
        }
    }
    table(tableName) {
        this.tableName = tableName;
        return this;
    }
    query(sql) {
        this.queryString = sql;
        this.tableName = undefined;
        return this;
    }
    only(...columnNames) {
        this.columns = columnNames;
        return this;
    }
    toStdout() {
        this.destination = 'STDOUT';
        return this;
    }
    toFile(filename) {
        this.destination = (0, pg_format_1.default)('%L', filename);
        return this;
    }
    toProgram(command) {
        this.destination = (0, pg_format_1.default)('PROGRAM %L', command);
        return this;
    }
    csv() {
        this.options.format = 'CSV';
        return this;
    }
    binary() {
        this.options.format = 'BINARY';
        return this;
    }
    text() {
        this.options.format = 'TEXT';
        return this;
    }
    withFormat(fmt) {
        this.options.format = fmt;
        return this;
    }
    withHeader(value = true) {
        this.options.header = value;
        return this;
    }
    withDelimiter(delimiter) {
        this.options.delimiter = delimiter;
        return this;
    }
    withNull(nullString) {
        this.options.null = nullString;
        return this;
    }
    withQuote(quoteChar) {
        this.options.quote = quoteChar;
        return this;
    }
    withEscape(escapeChar) {
        this.options.escape = escapeChar;
        return this;
    }
    withEncoding(encoding) {
        this.options.encoding = encoding;
        return this;
    }
    forceQuote(columns) {
        this.options.forceQuote = columns;
        return this;
    }
    toString() {
        const parts = ['COPY'];
        if (this.queryString) {
            parts.push(`(${this.queryString})`);
        }
        else if (this.tableName) {
            parts.push((0, pg_format_1.default)('%I', this.tableName));
            if (this.columns.length > 0) {
                const cols = this.columns.map(c => (0, pg_format_1.default)('%I', c)).join(', ');
                parts.push(`(${cols})`);
            }
        }
        else {
            throw new relq_errors_1.RelqBuilderError('COPY TO requires either a table name or query', { builder: 'CopyToBuilder', missing: 'source', hint: 'Use .table() or .query()' });
        }
        parts.push('TO');
        parts.push(this.destination);
        const optionsParts = this.buildOptions();
        if (optionsParts.length > 0) {
            parts.push(`WITH (${optionsParts.join(', ')})`);
        }
        return parts.join(' ');
    }
    buildOptions() {
        const opts = [];
        if (this.options.format) {
            opts.push(`FORMAT ${this.options.format}`);
        }
        if (this.options.header !== undefined) {
            if (this.options.header === 'MATCH') {
                opts.push('HEADER MATCH');
            }
            else {
                opts.push(`HEADER ${this.options.header ? 'TRUE' : 'FALSE'}`);
            }
        }
        if (this.options.delimiter) {
            opts.push((0, pg_format_1.default)('DELIMITER %L', this.options.delimiter));
        }
        if (this.options.null !== undefined) {
            opts.push((0, pg_format_1.default)('NULL %L', this.options.null));
        }
        if (this.options.quote) {
            opts.push((0, pg_format_1.default)('QUOTE %L', this.options.quote));
        }
        if (this.options.escape) {
            opts.push((0, pg_format_1.default)('ESCAPE %L', this.options.escape));
        }
        if (this.options.encoding) {
            opts.push((0, pg_format_1.default)('ENCODING %L', this.options.encoding));
        }
        if (this.options.forceQuote) {
            if (this.options.forceQuote === '*') {
                opts.push('FORCE_QUOTE *');
            }
            else {
                const cols = this.options.forceQuote.map(c => (0, pg_format_1.default)('%I', c)).join(', ');
                opts.push(`FORCE_QUOTE (${cols})`);
            }
        }
        return opts;
    }
}
exports.CopyToBuilder = CopyToBuilder;
class CopyFromBuilder {
    tableName;
    columns = [];
    source = 'STDIN';
    options = {};
    whereClause;
    constructor(tableName) {
        this.tableName = tableName;
    }
    only(...columnNames) {
        this.columns = columnNames;
        return this;
    }
    fromStdin() {
        this.source = 'STDIN';
        return this;
    }
    fromFile(filename) {
        this.source = (0, pg_format_1.default)('%L', filename);
        return this;
    }
    fromProgram(command) {
        this.source = (0, pg_format_1.default)('PROGRAM %L', command);
        return this;
    }
    csv() {
        this.options.format = 'CSV';
        return this;
    }
    binary() {
        this.options.format = 'BINARY';
        return this;
    }
    text() {
        this.options.format = 'TEXT';
        return this;
    }
    withFormat(fmt) {
        this.options.format = fmt;
        return this;
    }
    withHeader(value = true) {
        this.options.header = value;
        return this;
    }
    withDelimiter(delimiter) {
        this.options.delimiter = delimiter;
        return this;
    }
    withNull(nullString) {
        this.options.null = nullString;
        return this;
    }
    withDefault(defaultString) {
        this.options.default = defaultString;
        return this;
    }
    withQuote(quoteChar) {
        this.options.quote = quoteChar;
        return this;
    }
    withEscape(escapeChar) {
        this.options.escape = escapeChar;
        return this;
    }
    withEncoding(encoding) {
        this.options.encoding = encoding;
        return this;
    }
    freeze(value = true) {
        this.options.freeze = value;
        return this;
    }
    forceNotNull(columns) {
        this.options.forceNotNull = columns;
        return this;
    }
    forceNull(columns) {
        this.options.forceNull = columns;
        return this;
    }
    onError(action) {
        this.options.onError = action;
        return this;
    }
    logVerbosity(level) {
        this.options.logVerbosity = level;
        return this;
    }
    where(condition) {
        this.whereClause = condition;
        return this;
    }
    toString() {
        const parts = ['COPY'];
        parts.push((0, pg_format_1.default)('%I', this.tableName));
        if (this.columns.length > 0) {
            const cols = this.columns.map(c => (0, pg_format_1.default)('%I', c)).join(', ');
            parts.push(`(${cols})`);
        }
        parts.push('FROM');
        parts.push(this.source);
        const optionsParts = this.buildOptions();
        if (optionsParts.length > 0) {
            parts.push(`WITH (${optionsParts.join(', ')})`);
        }
        if (this.whereClause) {
            parts.push('WHERE');
            parts.push(this.whereClause);
        }
        return parts.join(' ');
    }
    buildOptions() {
        const opts = [];
        if (this.options.format) {
            opts.push(`FORMAT ${this.options.format}`);
        }
        if (this.options.freeze !== undefined) {
            opts.push(`FREEZE ${this.options.freeze ? 'TRUE' : 'FALSE'}`);
        }
        if (this.options.header !== undefined) {
            if (this.options.header === 'MATCH') {
                opts.push('HEADER MATCH');
            }
            else {
                opts.push(`HEADER ${this.options.header ? 'TRUE' : 'FALSE'}`);
            }
        }
        if (this.options.delimiter) {
            opts.push((0, pg_format_1.default)('DELIMITER %L', this.options.delimiter));
        }
        if (this.options.null !== undefined) {
            opts.push((0, pg_format_1.default)('NULL %L', this.options.null));
        }
        if (this.options.default !== undefined) {
            opts.push((0, pg_format_1.default)('DEFAULT %L', this.options.default));
        }
        if (this.options.quote) {
            opts.push((0, pg_format_1.default)('QUOTE %L', this.options.quote));
        }
        if (this.options.escape) {
            opts.push((0, pg_format_1.default)('ESCAPE %L', this.options.escape));
        }
        if (this.options.encoding) {
            opts.push((0, pg_format_1.default)('ENCODING %L', this.options.encoding));
        }
        if (this.options.forceNotNull && this.options.forceNotNull.length > 0) {
            const cols = this.options.forceNotNull.map(c => (0, pg_format_1.default)('%I', c)).join(', ');
            opts.push(`FORCE_NOT_NULL (${cols})`);
        }
        if (this.options.forceNull && this.options.forceNull.length > 0) {
            const cols = this.options.forceNull.map(c => (0, pg_format_1.default)('%I', c)).join(', ');
            opts.push(`FORCE_NULL (${cols})`);
        }
        if (this.options.onError) {
            opts.push(`ON_ERROR ${this.options.onError.toUpperCase()}`);
        }
        if (this.options.logVerbosity) {
            opts.push(`LOG_VERBOSITY ${this.options.logVerbosity.toUpperCase()}`);
        }
        return opts;
    }
}
exports.CopyFromBuilder = CopyFromBuilder;
