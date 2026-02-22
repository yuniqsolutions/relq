import { EventEmitter } from 'node:events';
import { RelqConnectionError } from "../errors/relq-errors.js";
import { ConditionCollector } from "../condition/condition-collector.js";
import { ConnectedCTEBuilder, ConnectedRawQueryBuilder, ConnectedTransactionBuilder, INTERNAL, debugLog } from "./helpers/index.js";
import { ConnectedScalarSelectBuilder } from "../select/scalar-select-builder.js";
import { buildColumnMappings, transformToDbColumns, transformFromDbColumns, transformResultsFromDb, hasColumnMapping } from "./shared/column-mapping.js";
import { validateData } from "./shared/validation.js";
import { createTableAccessor } from "./shared/table-accessor.js";
import { registerInstance, unregisterInstance } from "./shared/cleanup.js";
export class RelqBase {
    config;
    schema;
    emitter = new EventEmitter();
    _defaultErrorHandler = () => { };
    columnMappings = new Map();
    initialized = false;
    initPromise;
    _isClosed = false;
    constructor(schema, config) {
        this.config = config;
        this.schema = schema;
        this.emitter.on('error', this._defaultErrorHandler);
        if (schema) {
            const log = config.logLevel === 'debug'
                ? (...args) => debugLog(config, ...args)
                : undefined;
            buildColumnMappings(schema, this.columnMappings, log);
        }
        registerInstance(this);
    }
    async ensureInitialized() {
        if (this.initialized)
            return;
        if (this.initPromise)
            return this.initPromise;
        this.initPromise = (async () => {
            await this._initialize();
            this.initialized = true;
        })();
        return this.initPromise;
    }
    _transformToDbColumns(tableName, data) {
        return transformToDbColumns(tableName, data, this.columnMappings);
    }
    _transformFromDbColumns(tableName, data) {
        return transformFromDbColumns(tableName, data, this.columnMappings);
    }
    _transformResultsFromDb(tableName, rows) {
        return transformResultsFromDb(tableName, rows, this.columnMappings);
    }
    _hasColumnMapping() {
        return hasColumnMapping(this.columnMappings);
    }
    _validateData(tableName, data, operation) {
        validateData(tableName, data, operation, this.columnMappings, this.config);
    }
    _getSchema() {
        if (!this.schema)
            return undefined;
        return this.schema.tables || this.schema;
    }
    _getRelations() {
        return this.config.relations;
    }
    _getTableDef(tableKey) {
        const schema = this._getSchema();
        if (!schema)
            return undefined;
        return schema[tableKey];
    }
    get [INTERNAL]() {
        return {
            executeSelect: this._executeSelect.bind(this),
            executeSelectOne: this._executeSelectOne.bind(this),
            executeCount: this._executeCount.bind(this),
            executeRun: this._executeRun.bind(this),
            executeQuery: this._executeQuery.bind(this),
            transformToDbColumns: this._transformToDbColumns.bind(this),
            transformFromDbColumns: this._transformFromDbColumns.bind(this),
            transformResultsFromDb: this._transformResultsFromDb.bind(this),
            hasColumnMapping: this._hasColumnMapping.bind(this),
            getClientForCursor: this._acquireClient.bind(this),
            validateData: this._validateData.bind(this),
            getSchema: this._getSchema.bind(this),
            getRelations: this._getRelations.bind(this),
            getTableDef: this._getTableDef.bind(this)
        };
    }
    async _executeQuery(sql) {
        if (!sql || typeof sql !== 'string' || sql.trim() === '') {
            throw new RelqConnectionError(`Invalid SQL query: ${sql === null ? 'null' : sql === undefined ? 'undefined' : 'empty string'}`);
        }
        await this.ensureInitialized();
        const startTime = performance.now();
        const retryConfig = this.config.retry;
        if (!retryConfig) {
            const result = await this._query(sql);
            return { result, duration: performance.now() - startTime };
        }
        const opts = typeof retryConfig === 'object'
            ? { maxRetries: retryConfig.maxRetries ?? 3, initialDelayMs: retryConfig.initialDelayMs ?? 250, maxDelayMs: retryConfig.maxDelayMs ?? 5000 }
            : { maxRetries: 3, initialDelayMs: 250, maxDelayMs: 5000 };
        let lastError;
        for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
            try {
                const result = await this._query(sql);
                return { result, duration: performance.now() - startTime };
            }
            catch (error) {
                lastError = error;
                if (attempt < opts.maxRetries && isTransientError(error)) {
                    const delay = Math.min(opts.initialDelayMs * 2 ** attempt, opts.maxDelayMs);
                    debugLog(this.config, `Transient error (attempt ${attempt + 1}/${opts.maxRetries}), retrying in ${delay}ms: ${error.code || error.message}`);
                    await sleep(delay);
                    continue;
                }
                throw error;
            }
        }
        throw lastError;
    }
    buildMetadata(result, duration) {
        return {
            rowCount: result.rowCount,
            command: result.command,
            duration,
            fields: result.fields
        };
    }
    async _executeSelect(sql, tableName) {
        const { result, duration } = await this._executeQuery(sql);
        const rows = tableName
            ? this._transformResultsFromDb(tableName, result.rows)
            : result.rows;
        return {
            data: rows,
            metadata: this.buildMetadata(result, duration)
        };
    }
    async _executeSelectOne(sql, tableName) {
        const { result, duration } = await this._executeQuery(sql);
        const row = result.rows[0]
            ? (tableName ? this._transformFromDbColumns(tableName, result.rows[0]) : result.rows[0])
            : null;
        return {
            data: row,
            metadata: this.buildMetadata(result, duration)
        };
    }
    async _executeCount(sql) {
        const { result, duration } = await this._executeQuery(sql);
        const count = result.rows[0]?.count
            ? parseInt(result.rows[0].count, 10)
            : 0;
        return {
            count,
            metadata: this.buildMetadata(result, duration)
        };
    }
    async _executeRun(sql) {
        const { result, duration } = await this._executeQuery(sql);
        return {
            success: true,
            metadata: this.buildMetadata(result, duration)
        };
    }
    get table() {
        return createTableAccessor(this, this.schema);
    }
    raw(query, ...params) {
        return new ConnectedRawQueryBuilder(query, params, this);
    }
    transaction() {
        return new ConnectedTransactionBuilder(this);
    }
    with(name, query) {
        return new ConnectedCTEBuilder(this).with(name, query);
    }
    async ctAs(tableName, query, options = {}) {
        const queryStr = typeof query === 'string' ? query : query.toString();
        const temp = options.temporary ? 'TEMPORARY ' : '';
        const ifNotExists = options.ifNotExists ? 'IF NOT EXISTS ' : '';
        const sql = `CREATE ${temp}TABLE ${ifNotExists}"${tableName}" AS ${queryStr}`;
        await this[INTERNAL].executeQuery(sql);
    }
    async explain(query, options = {}) {
        const queryStr = typeof query === 'string' ? query : query.toString();
        const parts = ['EXPLAIN'];
        if (options.format)
            parts.push(`(FORMAT ${options.format.toUpperCase()}`);
        if (options.analyze)
            parts.push(options.format ? ', ANALYZE' : '(ANALYZE');
        if (options.verbose)
            parts.push(options.format || options.analyze ? ', VERBOSE' : '(VERBOSE');
        if (options.format || options.analyze || options.verbose)
            parts.push(')');
        const sql = `${parts.join(' ')} ${queryStr}`;
        const { result } = await this._executeQuery(sql);
        if (options.format === 'json') {
            return result.rows;
        }
        return result.rows.map((r) => r['QUERY PLAN'] || Object.values(r)[0]).join('\n');
    }
    scalar(scalars) {
        const schema = this._getSchema();
        return new ConnectedScalarSelectBuilder(scalars, schema, {
            executeSelectOne: this[INTERNAL].executeSelect.bind(this),
            hasColumnMapping: this._hasColumnMapping.bind(this),
            transformToDbColumns: this._transformToDbColumns.bind(this)
        });
    }
    where(_tableName) {
        return new ConditionCollector();
    }
    on(event, listener) {
        this.emitter.on(event, listener);
        return this;
    }
    once(event, listener) {
        this.emitter.once(event, listener);
        return this;
    }
    off(event, listener) {
        this.emitter.off(event, listener);
        return this;
    }
    async close() {
        if (!this.initialized || this._isClosed)
            return;
        try {
            await this._close();
            this._isClosed = true;
            unregisterInstance(this);
        }
        catch (error) {
            console.error('Error closing database connection:', error);
            throw error;
        }
    }
    get closed() {
        return this._isClosed;
    }
}
const TRANSIENT_NETWORK_CODES = new Set([
    'ECONNRESET', 'ECONNREFUSED', 'ENOTFOUND', 'ESERVFAIL',
    'ETIMEDOUT', 'EPIPE', 'EAI_AGAIN', 'EHOSTUNREACH',
    'CONNECTION_LOST', 'PROTOCOL_CONNECTION_LOST',
]);
const TRANSIENT_PG_CODES = new Set([
    '40P01',
    '40001',
    '08006',
    '08001',
    '08004',
    '57P01',
    '57P03',
]);
function isTransientError(error) {
    if (TRANSIENT_NETWORK_CODES.has(error.code))
        return true;
    if (error.cause && TRANSIENT_NETWORK_CODES.has(error.cause.code))
        return true;
    if (TRANSIENT_PG_CODES.has(error.code))
        return true;
    return false;
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
