import { EventEmitter } from 'node:events';
import { toPoolConfig } from "../types/config-types.js";
import { SelectBuilder } from "../select/select-builder.js";
import { AggregateQueryBuilder } from "../select/aggregate-builder.js";
import { InsertBuilder } from "../insert/insert-builder.js";
import { UpdateBuilder } from "../update/update-builder.js";
import { DeleteBuilder } from "../delete/delete-builder.js";
import { CountBuilder } from "../count/count-builder.js";
import { RawQueryBuilder } from "../raw/raw-query-builder.js";
import { TransactionBuilder } from "../transaction/transaction-builder.js";
import { ListenerConnection } from "../pubsub/listener-connection.js";
import { detectEnvironment, getEnvironmentDescription } from "../utils/environment-detection.js";
import { validatePoolConfig, formatPoolConfig, getSmartPoolDefaults } from "../utils/pool-defaults.js";
import { RelqEnvironmentError, RelqConfigError, RelqQueryError, RelqConnectionError, parsePostgresError } from "../errors/relq-errors.js";
import { randomLimit } from "../types/pagination-types.js";
import { deserializeValue, serializeValue } from "../utils/type-coercion.js";
import Cursor from "../addon/pg-cursor/index.js";
const INTERNAL = Symbol('relq-internal');
let PgPool = null;
let PgClient = null;
const activeRelqInstances = new Set();
let cleanupHandlersRegistered = false;
function debugLog(config, ...args) {
    if (config?.logLevel === 'debug') {
        console.log('[Relq DEBUG]', ...args);
    }
}
function registerGlobalCleanupHandlers() {
    if (cleanupHandlersRegistered)
        return;
    if (typeof process === 'undefined' || !process.on)
        return;
    process.on('beforeExit', async () => {
        if (activeRelqInstances.size === 0)
            return;
        await Promise.all(Array.from(activeRelqInstances).map(instance => instance.close().catch(err => console.error('Error closing database connection:', err))));
    });
    cleanupHandlersRegistered = true;
}
async function loadPg() {
    if (!PgPool || !PgClient) {
        try {
            const pg = await import("../addon/pg/index.js");
            PgPool = pg.Pool;
            PgClient = pg.Client;
            return { Pool: pg.Pool, Client: pg.Client };
        }
        catch (error) {
            throw new RelqConfigError('Failed to load "pg" module', { field: 'pg', value: error instanceof Error ? error.message : String(error) });
        }
    }
    return { Pool: PgPool, Client: PgClient };
}
export class Relq {
    pool;
    client;
    config;
    usePooling;
    initialized = false;
    initPromise;
    isClosed = false;
    environment;
    poolErrorHandler;
    poolConnectHandler;
    poolRemoveHandler;
    listener = null;
    emitter = new EventEmitter();
    columnMappings = new Map();
    schema;
    constructor(schema, config) {
        const schemaObj = schema;
        this.config = config;
        this.schema = schema;
        this.environment = detectEnvironment();
        if (schema) {
            this.buildColumnMappings(schema);
        }
        this.usePooling = this.determinePoolingStrategy(config);
        this.validateConfiguration();
        this.logEnvironmentInfo();
        activeRelqInstances.add(this);
        registerGlobalCleanupHandlers();
    }
    buildColumnMappings(schema) {
        if (!schema || typeof schema !== 'object')
            return;
        const tables = schema.tables || schema;
        for (const [tableName, tableDef] of Object.entries(tables)) {
            if (!tableDef || typeof tableDef !== 'object')
                continue;
            const columns = tableDef.$columns;
            if (!columns || typeof columns !== 'object')
                continue;
            const propToDb = new Map();
            const dbToProp = new Map();
            const propToType = new Map();
            const propToCheckValues = new Map();
            const propToValidate = new Map();
            const propToFields = new Map();
            for (const [propName, colDef] of Object.entries(columns)) {
                const dbColName = colDef?.$columnName ?? propName;
                const colType = colDef?.$type ?? 'TEXT';
                propToDb.set(propName, dbColName);
                dbToProp.set(dbColName, propName);
                propToType.set(propName, colType);
                debugLog(this.config, `buildColumnMappings: ${tableName}.${propName} -> type=${colType}, $validate=${!!colDef?.$validate}, $fields=${!!colDef?.$fields}, $checkValues=${!!colDef?.$checkValues}`);
                if (colDef?.$checkValues && Array.isArray(colDef.$checkValues)) {
                    propToCheckValues.set(propName, colDef.$checkValues);
                }
                if (colDef?.$validate && typeof colDef.$validate === 'function') {
                    propToValidate.set(propName, colDef.$validate);
                }
                if (colDef?.$fields && typeof colDef.$fields === 'object') {
                    propToFields.set(propName, colDef.$fields);
                }
            }
            const dbTableName = tableDef.$name ?? tableName;
            this.columnMappings.set(dbTableName, {
                propToDb,
                dbToProp,
                propToType,
                propToCheckValues,
                propToValidate,
                propToFields
            });
        }
    }
    _transformToDbColumns(tableName, data) {
        const mapping = this.columnMappings.get(tableName);
        if (!mapping)
            return data;
        const result = {};
        for (const [key, value] of Object.entries(data)) {
            const dbColName = mapping.propToDb.get(key) ?? key;
            const colType = mapping.propToType.get(key);
            if (colType && typeof colType === 'string') {
                result[dbColName] = serializeValue(value, colType);
            }
            else {
                result[dbColName] = value;
            }
        }
        return result;
    }
    _transformFromDbColumns(tableName, data) {
        const mapping = this.columnMappings.get(tableName);
        if (!mapping)
            return data;
        const result = {};
        for (const [key, value] of Object.entries(data)) {
            const propName = mapping.dbToProp.get(key) ?? key;
            const colType = mapping.propToType.get(propName);
            if (colType && typeof colType === 'string') {
                result[propName] = deserializeValue(value, colType);
            }
            else {
                result[propName] = value;
            }
        }
        return result;
    }
    _transformResultsFromDb(tableName, rows) {
        const mapping = this.columnMappings.get(tableName);
        if (!mapping)
            return rows;
        return rows.map(row => this._transformFromDbColumns(tableName, row));
    }
    _hasColumnMapping() {
        return this.columnMappings.size > 0;
    }
    _validateData(tableName, data, operation) {
        const validation = this.config.validation;
        if (validation?.enabled === false)
            return;
        const mapping = this.columnMappings.get(tableName);
        if (!mapping) {
            debugLog(this.config, `No mapping found for table: ${tableName}. Available:`, Array.from(this.columnMappings.keys()));
            return;
        }
        const errors = [];
        const validateLength = validation?.validateLength !== false;
        const validateTypes = validation?.validateTypes !== false;
        const onError = validation?.onError ?? 'throw';
        debugLog(this.config, `Validating ${operation} on ${tableName}. Fields:`, Object.keys(data));
        for (const [propName, value] of Object.entries(data)) {
            if (value === null || value === undefined)
                continue;
            const colType = mapping.propToType.get(propName);
            const colTypeStr = typeof colType === 'string' ? colType : null;
            if (validateTypes && colTypeStr) {
                const jsType = typeof value;
                const upperType = colTypeStr.toUpperCase();
                if (['INTEGER', 'INT', 'SMALLINT', 'BIGINT', 'INT2', 'INT4', 'INT8', 'SERIAL'].some(t => upperType.includes(t))) {
                    if (jsType !== 'number' && jsType !== 'bigint' && jsType !== 'string') {
                        errors.push(`${propName}: expected number for ${colType}, got ${jsType}`);
                    }
                }
                else if (['REAL', 'DOUBLE', 'FLOAT', 'NUMERIC', 'DECIMAL'].some(t => upperType.includes(t))) {
                    if (jsType !== 'number' && jsType !== 'string') {
                        errors.push(`${propName}: expected number for ${colType}, got ${jsType}`);
                    }
                }
                else if (upperType.includes('BOOL')) {
                    if (jsType !== 'boolean') {
                        errors.push(`${propName}: expected boolean for ${colType}, got ${jsType}`);
                    }
                }
                else if (['VARCHAR', 'CHAR', 'TEXT', 'UUID'].some(t => upperType.includes(t))) {
                    if (jsType !== 'string') {
                        errors.push(`${propName}: expected string for ${colType}, got ${jsType}`);
                    }
                }
            }
            if (validateLength && typeof value === 'string' && colTypeStr) {
                const lengthMatch = colTypeStr.match(/(?:var)?char\((\d+)\)/i);
                if (lengthMatch) {
                    const maxLength = parseInt(lengthMatch[1], 10);
                    if (value.length > maxLength) {
                        errors.push(`${propName}: string length ${value.length} exceeds ${colTypeStr} limit of ${maxLength}`);
                    }
                }
            }
            const validateFn = mapping.propToValidate.get(propName);
            if (validateFn) {
                const isValid = validateFn(value);
                debugLog(this.config, `Domain validation for '${propName}' with value '${value}': isValid=${isValid}`);
                if (!isValid) {
                    errors.push(`${propName}: value '${value}' failed domain validation`);
                }
            }
            const compositeFields = mapping.propToFields.get(propName);
            if (compositeFields && value && typeof value === 'object') {
                this._validateComposite(propName, value, compositeFields, errors);
            }
            const checkValues = mapping.propToCheckValues.get(propName);
            if (checkValues && checkValues.length > 0 && typeof value === 'string') {
                if (!checkValues.includes(value)) {
                    errors.push(`${propName}: value '${value}' not in allowed values [${checkValues.join(', ')}]`);
                }
            }
        }
        if (errors.length > 0) {
            const message = `Validation failed for ${operation} on ${tableName}:\n  - ${errors.join('\n  - ')}`;
            debugLog(this.config, message);
            if (onError === 'throw') {
                throw new RelqQueryError(message);
            }
            else if (onError === 'warn') {
                console.warn('[Relq]', message);
            }
            else if (onError === 'log') {
                console.log('[Relq]', message);
            }
        }
    }
    _validateComposite(propName, value, fields, errors) {
        const validation = this.config.validation;
        const validateLength = validation?.validateLength !== false;
        const validateTypes = validation?.validateTypes !== false;
        for (const [fieldName, colDef] of Object.entries(fields)) {
            const colConfig = colDef;
            const fieldValue = value[fieldName];
            const colType = colConfig.$sqlType ?? colConfig.$config?.$type ?? (typeof colConfig.$type === 'string' ? colConfig.$type : 'TEXT');
            const upperType = colType.toUpperCase();
            const isNullable = colConfig.$config?.$nullable ?? colConfig.$nullable;
            debugLog(this.config, `Composite field '${propName}.${fieldName}': value=${JSON.stringify(fieldValue)}, colType=${colType}, nullable=${isNullable}`);
            if (fieldValue === null || fieldValue === undefined) {
                if (isNullable === false) {
                    errors.push(`${propName}.${fieldName}: cannot be null`);
                }
                continue;
            }
            if (validateTypes && upperType) {
                const jsType = typeof fieldValue;
                if (['INTEGER', 'INT', 'SMALLINT', 'BIGINT', 'SERIAL'].some(t => upperType.includes(t))) {
                    if (jsType !== 'number' && jsType !== 'bigint' && jsType !== 'string') {
                        errors.push(`${propName}.${fieldName}: expected number, got ${jsType}`);
                    }
                }
                else if (['VARCHAR', 'CHAR', 'TEXT'].some(t => upperType.includes(t))) {
                    if (jsType !== 'string') {
                        errors.push(`${propName}.${fieldName}: expected string, got ${jsType}`);
                    }
                }
            }
            if (validateLength && typeof fieldValue === 'string' && typeof colType === 'string') {
                const lengthMatch = colType.match(/(?:var)?char\((\d+)\)/i);
                if (lengthMatch) {
                    const maxLength = parseInt(lengthMatch[1], 10);
                    if (fieldValue.length > maxLength) {
                        errors.push(`${propName}.${fieldName}: length ${fieldValue.length} exceeds ${maxLength}`);
                    }
                }
            }
            if (colConfig.$validate && typeof colConfig.$validate === 'function') {
                if (!colConfig.$validate(fieldValue)) {
                    errors.push(`${propName}.${fieldName}: failed domain validation`);
                }
            }
            if (colConfig.$fields && fieldValue && typeof fieldValue === 'object') {
                this._validateComposite(`${propName}.${fieldName}`, fieldValue, colConfig.$fields, errors);
            }
        }
    }
    async _getClientForCursor() {
        await this.initialize();
        if (this.pool) {
            const client = await this.pool.connect();
            return {
                client,
                release: () => client.release()
            };
        }
        else if (this.client) {
            return {
                client: this.client,
                release: () => { }
            };
        }
        else {
            throw new RelqConnectionError('No database connection available');
        }
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
            getClientForCursor: this._getClientForCursor.bind(this),
            validateData: this._validateData.bind(this)
        };
    }
    determinePoolingStrategy(config) {
        if (typeof config.pooling === 'boolean') {
            return config.pooling;
        }
        if (config.disableSmartDefaults) {
            return true;
        }
        return this.environment.type === 'traditional';
    }
    validateConfiguration() {
        if (this.config.disableSmartDefaults)
            return;
        if (this.environment.type === 'edge') {
            throw new RelqEnvironmentError('Cannot use Relq with database connections in edge runtime.\n' +
                'Edge runtimes (Cloudflare Workers, Deno Deploy) do not support TCP connections.\n\n' +
                'Options:\n' +
                '1. Use query builder only: relq("table").select().toString()\n' +
                '2. Use HTTP-based database (Supabase, Neon, Xata)\n' +
                '3. Deploy to Node.js runtime', getEnvironmentDescription(this.environment), 'No TCP/PostgreSQL support');
        }
        const poolConfig = {
            min: this.config.pool?.min,
            max: this.config.pool?.max
        };
        const validation = validatePoolConfig(poolConfig, this.environment);
        if (!validation.valid && validation.errors.length > 0) {
            const logLevel = this.config.logLevel ?? 'info';
            if (logLevel !== 'silent') {
                console.error('\n' + validation.errors.join('\n\n'));
            }
            throw new RelqConfigError(validation.errors[0]);
        }
        if (validation.warnings.length > 0) {
            const logLevel = this.config.logLevel ?? 'info';
            if (logLevel === 'warn' || logLevel === 'info' || logLevel === 'debug') {
                console.warn('\n' + validation.warnings.join('\n\n'));
            }
        }
    }
    logEnvironmentInfo() {
        const logLevel = this.config.logLevel ?? 'info';
        if (logLevel === 'silent' || logLevel === 'error')
            return;
        const smartDefaults = getSmartPoolDefaults();
        const poolConfig = formatPoolConfig({
            min: this.config.pool?.min ?? smartDefaults.min,
            max: this.config.pool?.max ?? smartDefaults.max,
            idleTimeoutMillis: this.config.pool?.idleTimeoutMillis ?? smartDefaults.idleTimeoutMillis,
            connectionTimeoutMillis: this.config.pool?.connectionTimeoutMillis ?? smartDefaults.connectionTimeoutMillis
        });
        if (this.environment.type === 'serverless') {
            if (logLevel === 'info' || logLevel === 'debug') {
                console.log(`\n🔵 Relq: ${this.environment.provider} detected (serverless)\n` +
                    `   Pooling: ${this.usePooling ? 'enabled' : 'disabled'}\n` +
                    `   Pool config: ${poolConfig}\n` +
                    `   Recommendation: Use min: 0, max: 1 for serverless`);
            }
        }
        else if (this.environment.type === 'traditional') {
            if (logLevel === 'debug') {
                console.log(`\n🟢 Relq: Traditional server environment\n` +
                    `   Pooling: ${this.usePooling ? 'enabled' : 'disabled'}\n` +
                    `   Pool config: ${poolConfig}\n` +
                    `   Connections created on demand, scale up under load`);
            }
        }
    }
    async initialize() {
        if (this.initialized)
            return;
        if (this.initPromise) {
            return this.initPromise;
        }
        this.initPromise = (async () => {
            const { Pool: PgPoolClass, Client: PgClientClass } = await loadPg();
            if (this.usePooling) {
                this.pool = new PgPoolClass(toPoolConfig(this.config));
                this.setupPoolErrorHandling();
                this.pool.on('connect', (client) => {
                    this.emitter.emit('connect', client);
                    this.emitter.emit('acquire', client);
                });
                this.pool.on('error', (err) => this.emitter.emit('error', err));
                this.pool.on('remove', (client) => this.emitter.emit('remove', client));
            }
            else {
                this.client = new PgClientClass({
                    host: this.config.host || 'localhost',
                    port: this.config.port || 5432,
                    database: this.config.database,
                    user: this.config.user,
                    password: this.config.password,
                    connectionString: this.config.connectionString,
                    ssl: this.config.ssl
                });
                this.client.on('end', () => this.emitter.emit('end'));
                this.client.on('error', (err) => this.emitter.emit('error', err));
                this.client.on('notice', (msg) => this.emitter.emit('notice', msg));
                this.client.on('notification', (msg) => this.emitter.emit('notification', msg));
            }
            this.initialized = true;
        })();
        return this.initPromise;
    }
    setupPoolErrorHandling() {
        if (!this.pool)
            return;
        this.poolErrorHandler = (err) => {
            const errorCode = err.code;
            const recoverableErrors = [
                'ETIMEDOUT',
                'ECONNRESET',
                '57P02'
            ];
            if (!recoverableErrors.includes(errorCode)) {
                throw err;
            }
            console.warn('[Relq Pool] Recoverable connection error (pool will auto-recover):', {
                code: errorCode,
                message: err.message,
                action: 'Connection removed from pool, will be replaced on next query'
            });
        };
        this.poolConnectHandler = () => {
        };
        this.poolRemoveHandler = () => {
        };
        this.pool.on('error', this.poolErrorHandler);
        this.pool.on('connect', this.poolConnectHandler);
        this.pool.on('remove', this.poolRemoveHandler);
    }
    async connect() {
        await this.initialize();
        if (!this.usePooling && this.client) {
            await this.client.connect();
            this.emitter.emit('connect', this.client);
        }
    }
    async subscribe(channel, callback) {
        if (!this.listener) {
            this.listener = new ListenerConnection({
                host: this.config.host,
                port: this.config.port,
                user: this.config.user,
                password: this.config.password,
                database: this.config.database,
                connectionString: this.config.connectionString,
                ssl: this.config.ssl
            });
            this.listener.on('error', (err) => {
                this.emitter.emit('listenerError', err);
            });
            this.listener.on('connect', () => {
                this.emitter.emit('listenerConnect');
            });
        }
        const sub = await this.listener.subscribe(channel);
        sub.on('notification', callback);
        return () => sub.close();
    }
    async close() {
        if (!this.initialized || this.isClosed)
            return;
        try {
            if (this.listener) {
                await this.listener.close();
                this.listener = null;
            }
            if (this.pool) {
                if (this.poolErrorHandler) {
                    this.pool.removeListener('error', this.poolErrorHandler);
                }
                if (this.poolConnectHandler) {
                    this.pool.removeListener('connect', this.poolConnectHandler);
                }
                if (this.poolRemoveHandler) {
                    this.pool.removeListener('remove', this.poolRemoveHandler);
                }
                this.pool.removeAllListeners();
                await this.pool.end();
            }
            else if (this.client) {
                this.client.removeAllListeners();
                await this.client.end();
            }
            this.isClosed = true;
            activeRelqInstances.delete(this);
        }
        catch (error) {
            console.error('Error closing database connection:', error);
            throw error;
        }
    }
    get closed() {
        return this.isClosed;
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
    async _executeQuery(sql) {
        try {
            if (!sql || typeof sql !== 'string' || sql.trim() === '') {
                throw new RelqConfigError(`Invalid SQL query: ${sql === null ? 'null' : sql === undefined ? 'undefined' : 'empty string'}`);
            }
            await this.initialize();
            const startTime = performance.now();
            let result;
            if (this.pool) {
                result = await this.pool.query(sql);
            }
            else if (this.client) {
                result = await this.client.query(sql);
            }
            else {
                throw new RelqConfigError('No database connection available');
            }
            const duration = performance.now() - startTime;
            return { result, duration };
        }
        catch (error) {
            throw parsePostgresError(error, sql);
        }
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
        const relq = this;
        const tableFunction = (tableName) => {
            return new ConnectedQueryBuilder(tableName, relq);
        };
        return new Proxy(tableFunction, {
            get(target, prop, receiver) {
                if (prop in target) {
                    return Reflect.get(target, prop, receiver);
                }
                if (typeof prop === 'string' && relq.schema && prop in relq.schema) {
                    const tableDef = relq.schema[prop];
                    const sqlTableName = tableDef?.$name || prop;
                    return new ConnectedQueryBuilder(sqlTableName, relq);
                }
                return undefined;
            }
        });
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
        const result = await this[INTERNAL].executeQuery(sql);
        if (options.format === 'json') {
            return result.result.rows;
        }
        return result.result.rows.map((r) => r['QUERY PLAN'] || Object.values(r)[0]).join('\n');
    }
}
class ConnectedQueryBuilder {
    tableName;
    relq;
    constructor(tableName, relq) {
        this.tableName = tableName;
        this.relq = relq;
    }
    select(columns) {
        let dbColumns = columns;
        if (columns && this.relq[INTERNAL].hasColumnMapping()) {
            if (Array.isArray(columns)) {
                dbColumns = columns.map(col => {
                    if (Array.isArray(col)) {
                        const transformed = this.relq[INTERNAL].transformToDbColumns(this.tableName, { [col[0]]: true });
                        return [Object.keys(transformed)[0], col[1]];
                    }
                    else {
                        const transformed = this.relq[INTERNAL].transformToDbColumns(this.tableName, { [col]: true });
                        return Object.keys(transformed)[0];
                    }
                });
            }
            else {
                const transformed = this.relq[INTERNAL].transformToDbColumns(this.tableName, { [columns]: true });
                dbColumns = Object.keys(transformed)[0];
            }
        }
        const builder = new SelectBuilder(this.tableName, dbColumns);
        return new ConnectedSelectBuilder(builder, this.relq, this.tableName, columns);
    }
    insert(data) {
        const builder = new InsertBuilder(this.tableName, data);
        return new ConnectedInsertBuilder(builder, this.relq);
    }
    update(data) {
        const builder = new UpdateBuilder(this.tableName, data);
        return new ConnectedUpdateBuilder(builder, this.relq);
    }
    delete() {
        const builder = new DeleteBuilder(this.tableName);
        return new ConnectedDeleteBuilder(builder, this.relq);
    }
    count() {
        const builder = new CountBuilder(this.tableName);
        return new ConnectedCountBuilder(builder, this.relq, this.tableName);
    }
    aggregate() {
        const builder = new AggregateQueryBuilder(this.tableName);
        return new ConnectedAggregateBuilder(builder, this.relq, this.tableName);
    }
    async findById(id) {
        const pkColumn = this.getPrimaryKeyColumn();
        const dbColumn = this.relq[INTERNAL].transformToDbColumns(this.tableName, { [pkColumn]: id });
        const dbColName = Object.keys(dbColumn)[0];
        const builder = new SelectBuilder(this.tableName, ['*']);
        builder.where(q => q.equal(dbColName, id));
        builder.limit(1);
        const sql = builder.toString();
        const result = await this.relq[INTERNAL].executeSelectOne(sql, this.tableName);
        return result.data;
    }
    async findOne(filter) {
        const builder = new SelectBuilder(this.tableName, ['*']);
        const dbFilter = this.relq[INTERNAL].transformToDbColumns(this.tableName, filter);
        builder.where(q => {
            for (const [col, val] of Object.entries(dbFilter)) {
                q.equal(col, val);
            }
            return q;
        });
        builder.limit(1);
        const sql = builder.toString();
        const result = await this.relq[INTERNAL].executeSelectOne(sql, this.tableName);
        return result.data;
    }
    async findMany(filter) {
        const builder = new SelectBuilder(this.tableName, ['*']);
        const dbFilter = this.relq[INTERNAL].transformToDbColumns(this.tableName, filter);
        builder.where(q => {
            for (const [col, val] of Object.entries(dbFilter)) {
                q.equal(col, val);
            }
            return q;
        });
        const sql = builder.toString();
        const result = await this.relq[INTERNAL].executeSelect(sql, this.tableName);
        return result.data;
    }
    async exists(filter) {
        const builder = new CountBuilder(this.tableName);
        const dbFilter = this.relq[INTERNAL].transformToDbColumns(this.tableName, filter);
        builder.where(q => {
            for (const [col, val] of Object.entries(dbFilter)) {
                q.equal(col, val);
            }
            return q;
        });
        const sql = builder.toString();
        const result = await this.relq[INTERNAL].executeCount(sql);
        return result.count > 0;
    }
    async upsert(options) {
        const dbCreate = this.relq[INTERNAL].transformToDbColumns(this.tableName, options.create);
        const dbUpdate = this.relq[INTERNAL].transformToDbColumns(this.tableName, options.update);
        const dbWhere = this.relq[INTERNAL].transformToDbColumns(this.tableName, options.where);
        const conflictColumn = Object.keys(dbWhere)[0];
        const builder = new InsertBuilder(this.tableName, dbCreate);
        builder.onConflict(conflictColumn, cb => cb.doUpdate(dbUpdate));
        builder.returning(['*']);
        const sql = builder.toString();
        const result = await this.relq[INTERNAL].executeQuery(sql);
        const transformed = this.relq[INTERNAL].transformResultsFromDb(this.tableName, result.result.rows);
        return transformed[0];
    }
    async insertMany(rows) {
        if (rows.length === 0)
            return [];
        const firstDbRow = this.relq[INTERNAL].transformToDbColumns(this.tableName, rows[0]);
        const builder = new InsertBuilder(this.tableName, firstDbRow);
        for (let i = 1; i < rows.length; i++) {
            const dbRow = this.relq[INTERNAL].transformToDbColumns(this.tableName, rows[i]);
            builder.addRow(dbRow);
        }
        builder.returning(['*']);
        const sql = builder.toString();
        const result = await this.relq[INTERNAL].executeQuery(sql);
        return this.relq[INTERNAL].transformResultsFromDb(this.tableName, result.result.rows);
    }
    paginate(options = {}) {
        return new PaginateBuilder(this.relq, this.tableName, options.columns, options.where, options.orderBy);
    }
    async softDelete(filter) {
        const dbFilter = this.relq[INTERNAL].transformToDbColumns(this.tableName, filter);
        const builder = new UpdateBuilder(this.tableName, { deleted_at: new Date() });
        builder.where(q => {
            for (const [col, val] of Object.entries(dbFilter)) {
                q.equal(col, val);
            }
            return q;
        });
        builder.returning(['*']);
        const sql = builder.toString();
        const result = await this.relq[INTERNAL].executeQuery(sql);
        if (result.result.rows.length === 0)
            return null;
        const transformed = this.relq[INTERNAL].transformResultsFromDb(this.tableName, result.result.rows);
        return transformed[0];
    }
    async restore(filter) {
        const dbFilter = this.relq[INTERNAL].transformToDbColumns(this.tableName, filter);
        const builder = new UpdateBuilder(this.tableName, { deleted_at: null });
        builder.where(q => {
            for (const [col, val] of Object.entries(dbFilter)) {
                q.equal(col, val);
            }
            return q;
        });
        builder.returning(['*']);
        const sql = builder.toString();
        const result = await this.relq[INTERNAL].executeQuery(sql);
        if (result.result.rows.length === 0)
            return null;
        const transformed = this.relq[INTERNAL].transformResultsFromDb(this.tableName, result.result.rows);
        return transformed[0];
    }
    getPrimaryKeyColumn() {
        const schema = this.relq.schema;
        if (schema && schema[this.tableName]) {
            const tableSchema = schema[this.tableName];
            for (const [colName, colDef] of Object.entries(tableSchema)) {
                if (colDef && typeof colDef === 'object' &&
                    ('$primaryKey' in colDef ||
                        colDef.config?.$primaryKey === true)) {
                    return colName;
                }
            }
        }
        return 'id';
    }
}
class ConnectedAggregateBuilder {
    builder;
    relq;
    tableName;
    constructor(builder, relq, tableName) {
        this.builder = builder;
        this.relq = relq;
        this.tableName = tableName;
    }
    mapColumn(column) {
        const transformed = this.relq[INTERNAL].transformToDbColumns(this.tableName, { [column]: true });
        return Object.keys(transformed)[0] || column;
    }
    groupBy(...columns) {
        const dbColumns = columns.map(col => this.mapColumn(col));
        this.builder.groupBy(...dbColumns);
        return this;
    }
    count(alias) {
        this.builder.count(alias);
        return this;
    }
    countColumn(column, alias) {
        this.builder.countColumn(this.mapColumn(column), alias);
        return this;
    }
    countDistinct(column, alias) {
        this.builder.countDistinct(this.mapColumn(column), alias);
        return this;
    }
    sum(column, alias) {
        this.builder.sum(this.mapColumn(column), alias);
        return this;
    }
    avg(column, alias) {
        this.builder.avg(this.mapColumn(column), alias);
        return this;
    }
    min(column, alias) {
        this.builder.min(this.mapColumn(column), alias);
        return this;
    }
    max(column, alias) {
        this.builder.max(this.mapColumn(column), alias);
        return this;
    }
    arrayAgg(column, alias) {
        this.builder.arrayAgg(this.mapColumn(column), alias);
        return this;
    }
    stringAgg(column, delimiter, alias) {
        this.builder.stringAgg(this.mapColumn(column), delimiter || ', ', alias);
        return this;
    }
    jsonAgg(column, alias) {
        this.builder.jsonAgg(this.mapColumn(column), alias);
        return this;
    }
    jsonbAgg(column, alias) {
        this.builder.jsonbAgg(this.mapColumn(column), alias);
        return this;
    }
    boolAnd(column, alias) {
        this.builder.boolAnd(this.mapColumn(column), alias);
        return this;
    }
    boolOr(column, alias) {
        this.builder.boolOr(this.mapColumn(column), alias);
        return this;
    }
    where(callback) {
        this.builder.where(callback);
        return this;
    }
    having(callback) {
        this.builder.having(callback);
        return this;
    }
    orderBy(column, direction = 'ASC') {
        this.builder.orderBy(this.mapColumn(column), direction);
        return this;
    }
    limit(count) {
        this.builder.limit(count);
        return this;
    }
    offset(count) {
        this.builder.offset(count);
        return this;
    }
    toString() {
        return this.builder.toString();
    }
    async all() {
        const sql = this.builder.toString();
        const result = await this.relq[INTERNAL].executeSelect(sql, this.tableName);
        const numericAliases = this.builder.getNumericAliases();
        if (numericAliases.length > 0) {
            for (const row of result.data) {
                for (const alias of numericAliases) {
                    if (alias in row && typeof row[alias] === 'string') {
                        row[alias] = Number(row[alias]);
                    }
                }
            }
        }
        return result.data;
    }
    async get() {
        this.builder.limit(1);
        const sql = this.builder.toString();
        const result = await this.relq[INTERNAL].executeSelectOne(sql, this.tableName);
        const numericAliases = this.builder.getNumericAliases();
        if (numericAliases.length > 0 && result.data) {
            for (const alias of numericAliases) {
                if (alias in result.data && typeof result.data[alias] === 'string') {
                    result.data[alias] = Number(result.data[alias]);
                }
            }
        }
        return result.data;
    }
}
class ConnectedSelectBuilder {
    builder;
    relq;
    tableName;
    columns;
    constructor(builder, relq, tableName, columns) {
        this.builder = builder;
        this.relq = relq;
        this.tableName = tableName;
        this.columns = columns;
    }
    where(callback) {
        this.builder.where(callback);
        return this;
    }
    orderBy(column, direction) {
        const dbColumn = this.relq[INTERNAL].hasColumnMapping()
            ? Object.keys(this.relq[INTERNAL].transformToDbColumns(this.tableName, { [column]: true }))[0]
            : column;
        this.builder.orderBy(dbColumn, direction);
        return this;
    }
    limit(count) {
        this.builder.limit(count);
        return this;
    }
    offset(count) {
        this.builder.offset(count);
        return this;
    }
    groupBy(...columns) {
        const dbColumns = this.relq[INTERNAL].hasColumnMapping()
            ? columns.map(col => Object.keys(this.relq[INTERNAL].transformToDbColumns(this.tableName, { [col]: true }))[0])
            : columns;
        this.builder.groupBy(...dbColumns);
        return this;
    }
    having(callback) {
        this.builder.having(callback);
        return this;
    }
    join(table, condition) {
        this.builder.join(table, condition);
        return this;
    }
    leftJoin(table, condition) {
        this.builder.leftJoin(table, condition);
        return this;
    }
    rightJoin(table, condition) {
        this.builder.rightJoin(table, condition);
        return this;
    }
    innerJoin(table, condition) {
        this.builder.innerJoin(table, condition);
        return this;
    }
    distinct() {
        this.builder.distinct();
        return this;
    }
    distinctOn(...columns) {
        this.builder.distinctOn(...columns);
        return this;
    }
    union(query) {
        this.builder.union(typeof query === 'string' ? query : query.toString());
        return this;
    }
    unionAll(query) {
        this.builder.unionAll(typeof query === 'string' ? query : query.toString());
        return this;
    }
    intersect(query) {
        this.builder.intersect(typeof query === 'string' ? query : query.toString());
        return this;
    }
    except(query) {
        this.builder.except(typeof query === 'string' ? query : query.toString());
        return this;
    }
    forUpdate() {
        this.builder.forUpdate();
        return this;
    }
    forUpdateSkipLocked() {
        this.builder.forUpdateSkipLocked();
        return this;
    }
    forShare() {
        this.builder.forShare();
        return this;
    }
    toString() {
        return this.builder.toString();
    }
    async all(withMetadata, _asRequired) {
        const sql = this.builder.toString();
        const result = await this.relq[INTERNAL].executeSelect(sql, this.tableName);
        if (withMetadata) {
            return result;
        }
        return result.data;
    }
    async get(withMetadata, _asRequired) {
        this.builder.limit(1);
        const sql = this.builder.toString();
        const result = await this.relq[INTERNAL].executeSelectOne(sql, this.tableName);
        if (withMetadata) {
            return result;
        }
        return result.data;
    }
    async value(column) {
        this.builder.limit(1);
        const sql = this.builder.toString();
        const result = await this.relq[INTERNAL].executeSelectOne(sql, this.tableName);
        return result.data?.[column] ?? null;
    }
    async each(callback, options = {}) {
        const batchSize = options.batchSize ?? 100;
        const sql = this.builder.toString();
        const relqAny = this.relq;
        if (relqAny.usePooling === false || (!relqAny.pool && relqAny.client)) {
            throw new RelqConfigError('each() requires pooled connections', { field: 'pooling', value: 'false (must be true)' });
        }
        const { client, release } = await this.relq[INTERNAL].getClientForCursor();
        try {
            await client.query('BEGIN');
            const cursor = client.query(new Cursor(sql));
            let rows;
            let aborted = false;
            let index = 0;
            outer: do {
                rows = await new Promise((resolve, reject) => {
                    cursor.read(batchSize, (err, result) => {
                        if (err)
                            reject(err);
                        else
                            resolve(result);
                    });
                });
                const transformedRows = this.tableName && this.relq._transformResultsFromDb
                    ? this.relq._transformResultsFromDb(this.tableName, rows)
                    : rows;
                for (const row of transformedRows) {
                    const result = await callback(row, index++);
                    if (result === false) {
                        aborted = true;
                        break outer;
                    }
                }
            } while (rows.length > 0);
            await new Promise((resolve, reject) => {
                cursor.close((err) => {
                    if (err)
                        reject(err);
                    else
                        resolve();
                });
            });
            await client.query('COMMIT');
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            release();
        }
    }
    async pagination(options) {
        if (!options.mode || !['paging', 'offset'].includes(options.mode)) {
            throw new RelqQueryError('pagination() requires "mode" to be one of: \'paging\', \'offset\'', { hint: 'Set mode: "paging" or mode: "offset"' });
        }
        const orderByArr = options.orderBy
            ? (Array.isArray(options.orderBy[0]) ? options.orderBy : [options.orderBy])
            : [];
        for (const [column, direction] of orderByArr) {
            const dbColumn = this.relq[INTERNAL].hasColumnMapping()
                ? Object.keys(this.relq[INTERNAL].transformToDbColumns(this.tableName, { [column]: true }))[0]
                : column;
            this.builder.orderBy(dbColumn, direction);
        }
        const isPaging = options.mode === 'paging';
        const shouldCount = options.count ?? isPaging;
        let total = 0;
        if (shouldCount) {
            const countSql = this.builder.toCountSQL();
            const countResult = await this.relq[INTERNAL].executeCount(countSql);
            total = countResult.count;
        }
        if (isPaging) {
            const { page, perPage } = options;
            if (typeof page !== 'number' || isNaN(page) || page < 1) {
                throw new RelqQueryError('pagination() paging mode requires "page" as a positive number (1-indexed)', { hint: 'page must be >= 1' });
            }
            if (typeof perPage !== 'number' || isNaN(perPage) || perPage < 1) {
                throw new RelqQueryError('pagination() paging mode requires "perPage" as a positive number', { hint: 'perPage must be >= 1' });
            }
            const offset = (page - 1) * perPage;
            this.builder.limit(perPage);
            this.builder.offset(offset);
            const sql = this.builder.toString();
            const result = await this.relq[INTERNAL].executeSelect(sql, this.tableName);
            const totalPages = Math.ceil(total / perPage);
            const hasNext = page < totalPages;
            const hasPrev = page > 1;
            const pagination = {
                page,
                perPage,
                total,
                totalPages,
            };
            if (hasNext) {
                pagination.hasNext = true;
                pagination.nextPage = page + 1;
                Object.defineProperty(pagination, 'loadNext', {
                    value: () => this.pagination({ ...options, page: page + 1 }),
                    enumerable: false,
                    configurable: false
                });
            }
            else {
                pagination.hasNext = false;
            }
            if (hasPrev) {
                pagination.hasPrev = true;
                pagination.prevPage = page - 1;
                Object.defineProperty(pagination, 'loadPrev', {
                    value: () => this.pagination({ ...options, page: page - 1 }),
                    enumerable: false,
                    configurable: false
                });
            }
            else {
                pagination.hasPrev = false;
            }
            const getVisibleProps = () => {
                const visible = { page, perPage, total, totalPages, hasNext };
                if (hasNext)
                    visible.nextPage = page + 1;
                visible.hasPrev = hasPrev;
                if (hasPrev)
                    visible.prevPage = page - 1;
                return visible;
            };
            Object.defineProperty(pagination, Symbol.for('nodejs.util.inspect.custom'), {
                value: () => getVisibleProps(),
                enumerable: false
            });
            Object.defineProperty(pagination, 'toJSON', {
                value: () => getVisibleProps(),
                enumerable: false
            });
            return { data: result.data, pagination };
        }
        if (options.mode === 'offset') {
            const { position, limit: limitOpt } = options;
            if (typeof position !== 'number' || isNaN(position)) {
                throw new RelqQueryError('pagination() offset mode requires "position" as a number', { hint: 'position must be >= 0' });
            }
            if (limitOpt === undefined || (typeof limitOpt !== 'number' && !Array.isArray(limitOpt))) {
                throw new RelqQueryError('pagination() offset mode requires "limit" as a number or [min, max] array', { hint: 'Use limit: number or limit: [min, max]' });
            }
            const limit = Array.isArray(limitOpt) ? randomLimit(limitOpt) : limitOpt;
            this.builder.limit(limit + 1);
            this.builder.offset(position);
            const sql = this.builder.toString();
            const result = await this.relq[INTERNAL].executeSelect(sql, this.tableName);
            const hasMore = result.data.length > limit;
            const hasPrev = position > 0;
            const data = hasMore ? result.data.slice(0, limit) : result.data;
            const pagination = {
                position,
                limit,
                ...(shouldCount && { total }),
            };
            if (hasMore) {
                pagination.hasMore = true;
                pagination.nextPos = position + limit;
                Object.defineProperty(pagination, 'loadNext', {
                    value: () => this.pagination({ ...options, position: position + limit }),
                    enumerable: false,
                    configurable: false
                });
            }
            else {
                pagination.hasMore = false;
            }
            if (hasPrev) {
                pagination.hasPrev = true;
                pagination.prevPos = Math.max(0, position - limit);
                Object.defineProperty(pagination, 'loadPrev', {
                    value: () => this.pagination({ ...options, position: Math.max(0, position - limit) }),
                    enumerable: false,
                    configurable: false
                });
            }
            else {
                pagination.hasPrev = false;
            }
            const getVisibleProps = () => {
                const visible = { position, limit };
                if (shouldCount)
                    visible.total = total;
                visible.hasMore = hasMore;
                if (hasMore)
                    visible.nextPos = position + limit;
                visible.hasPrev = hasPrev;
                if (hasPrev)
                    visible.prevPos = Math.max(0, position - limit);
                return visible;
            };
            Object.defineProperty(pagination, Symbol.for('nodejs.util.inspect.custom'), {
                value: () => getVisibleProps(),
                enumerable: false
            });
            Object.defineProperty(pagination, 'toJSON', {
                value: () => getVisibleProps(),
                enumerable: false
            });
            return { data, pagination };
        }
        throw new RelqQueryError('Invalid pagination mode');
    }
}
class PaginateBuilder {
    relq;
    tableName;
    columns;
    whereClause;
    orderByClause;
    constructor(relq, tableName, columns, whereClause, orderByClause) {
        this.relq = relq;
        this.tableName = tableName;
        this.columns = columns;
        this.whereClause = whereClause;
        this.orderByClause = orderByClause;
    }
    async paging(options) {
        const page = options.page ?? 1;
        const perPage = options.perPage;
        const shouldCount = options.count ?? true;
        if (page < 1) {
            throw new RelqQueryError('page must be >= 1', { hint: 'Page numbers are 1-indexed' });
        }
        if (perPage < 1) {
            throw new RelqQueryError('perPage must be >= 1');
        }
        const columnsToSelect = this.columns && this.columns.length > 0 ? this.columns : ['*'];
        const orderByArr = this.orderByClause
            ? (Array.isArray(this.orderByClause[0]) ? this.orderByClause : [this.orderByClause])
            : [];
        const selectBuilder = new SelectBuilder(this.tableName, columnsToSelect);
        if (this.whereClause) {
            selectBuilder.where(this.whereClause);
        }
        for (const [column, direction] of orderByArr) {
            const dbColumn = this.relq[INTERNAL].transformToDbColumns(this.tableName, { [column]: true });
            selectBuilder.orderBy(Object.keys(dbColumn)[0] || column, direction);
        }
        let total = 0;
        if (shouldCount) {
            const countBuilder = new CountBuilder(this.tableName);
            if (this.whereClause) {
                countBuilder.where(this.whereClause);
            }
            const countResult = await this.relq[INTERNAL].executeCount(countBuilder.toString());
            total = countResult.count;
        }
        const offset = (page - 1) * perPage;
        selectBuilder.limit(perPage);
        selectBuilder.offset(offset);
        const result = await this.relq[INTERNAL].executeSelect(selectBuilder.toString(), this.tableName);
        const totalPages = Math.ceil(total / perPage);
        const hasNext = page < totalPages;
        const hasPrev = page > 1;
        const pagination = {
            page,
            perPage,
            total,
            totalPages,
        };
        if (hasNext) {
            pagination.hasNext = true;
            pagination.nextPage = page + 1;
            Object.defineProperty(pagination, 'loadNext', {
                value: () => this.paging({ ...options, page: page + 1 }),
                enumerable: false
            });
        }
        else {
            pagination.hasNext = false;
        }
        if (hasPrev) {
            pagination.hasPrev = true;
            pagination.prevPage = page - 1;
            Object.defineProperty(pagination, 'loadPrev', {
                value: () => this.paging({ ...options, page: page - 1 }),
                enumerable: false
            });
        }
        else {
            pagination.hasPrev = false;
        }
        Object.defineProperty(pagination, 'toJSON', {
            value: () => ({ page, perPage, total, totalPages, hasNext: pagination.hasNext, hasPrev: pagination.hasPrev, nextPage: pagination.nextPage, prevPage: pagination.prevPage }),
            enumerable: false
        });
        return { data: result.data, pagination };
    }
    async offset(options) {
        const position = options.position ?? 0;
        const shouldCount = options.count ?? false;
        if (position < 0) {
            throw new RelqQueryError('position must be >= 0');
        }
        let limit;
        if (options.shuffleLimit) {
            const [min, max] = options.shuffleLimit;
            if (min < 1 || max < 1) {
                throw new RelqQueryError('shuffleLimit values must be >= 1', { hint: 'Use [min, max] where both are >= 1' });
            }
            if (min > max) {
                throw new RelqQueryError('shuffleLimit[0] must be <= shuffleLimit[1]', { hint: 'Use [min, max] format where min <= max' });
            }
            limit = Math.floor(Math.random() * (max - min + 1)) + min;
        }
        else {
            const limitValue = options.limit;
            if (limitValue !== undefined && limitValue < 1) {
                throw new RelqQueryError('limit must be >= 1');
            }
            limit = limitValue ?? 50;
        }
        const columnsToSelect = this.columns && this.columns.length > 0 ? this.columns : ['*'];
        const orderByArr = this.orderByClause
            ? (Array.isArray(this.orderByClause[0]) ? this.orderByClause : [this.orderByClause])
            : [];
        const selectBuilder = new SelectBuilder(this.tableName, columnsToSelect);
        if (this.whereClause) {
            selectBuilder.where(this.whereClause);
        }
        for (const [column, direction] of orderByArr) {
            const dbColumn = this.relq[INTERNAL].transformToDbColumns(this.tableName, { [column]: true });
            selectBuilder.orderBy(Object.keys(dbColumn)[0] || column, direction);
        }
        let total = 0;
        if (shouldCount) {
            const countBuilder = new CountBuilder(this.tableName);
            if (this.whereClause) {
                countBuilder.where(this.whereClause);
            }
            const countResult = await this.relq[INTERNAL].executeCount(countBuilder.toString());
            total = countResult.count;
        }
        selectBuilder.limit(limit + 1);
        selectBuilder.offset(position);
        const result = await this.relq[INTERNAL].executeSelect(selectBuilder.toString(), this.tableName);
        const hasMore = result.data.length > limit;
        const data = hasMore ? result.data.slice(0, limit) : result.data;
        const hasPrev = position > 0;
        const pagination = {
            position,
            limit,
            total,
        };
        if (hasMore) {
            pagination.hasMore = true;
            pagination.nextPos = position + limit;
            Object.defineProperty(pagination, 'loadNext', {
                value: () => this.offset({ ...options, position: position + limit }),
                enumerable: false
            });
        }
        else {
            pagination.hasMore = false;
        }
        if (hasPrev) {
            pagination.hasPrev = true;
            pagination.prevPos = Math.max(0, position - limit);
            Object.defineProperty(pagination, 'loadPrev', {
                value: () => this.offset({ ...options, position: Math.max(0, position - limit) }),
                enumerable: false
            });
        }
        else {
            pagination.hasPrev = false;
        }
        Object.defineProperty(pagination, 'toJSON', {
            value: () => ({ position, limit, total, hasMore: pagination.hasMore, hasPrev: pagination.hasPrev, nextPos: pagination.nextPos, prevPos: pagination.prevPos }),
            enumerable: false
        });
        return { data, pagination };
    }
}
class ReturningExecutor {
    builder;
    relq;
    constructor(builder, relq) {
        this.builder = builder;
        this.relq = relq;
    }
    toString() {
        return this.builder.toString();
    }
    async run(withMetadata) {
        if (this.builder instanceof InsertBuilder) {
            for (const row of this.builder.insertData) {
                this.relq[INTERNAL].validateData(this.builder.tableName, row, 'insert');
            }
        }
        else if (this.builder instanceof UpdateBuilder) {
            this.relq[INTERNAL].validateData(this.builder.tableName, this.builder.updateData, 'update');
        }
        const sql = this.builder.toString();
        const result = await this.relq[INTERNAL].executeSelect(sql);
        if (withMetadata) {
            return result;
        }
        return result.data;
    }
}
class ConnectedInsertBuilder {
    builder;
    relq;
    constructor(builder, relq) {
        this.builder = builder;
        this.relq = relq;
    }
    addRow(row) {
        this.builder.addRow(row);
        return this;
    }
    addRows(rows) {
        this.builder.addRows(rows);
        return this;
    }
    clear() {
        this.builder.clear();
        return this;
    }
    get total() {
        return this.builder.total;
    }
    onConflict(columns, callback) {
        const cols = Array.isArray(columns) ? columns : [columns];
        this.builder.onConflict(cols, (conflictBuilder) => {
            callback(conflictBuilder);
        });
        return this;
    }
    toString() {
        return this.builder.toString();
    }
    async run(withMetadata) {
        debugLog(this.relq[INTERNAL]?.config, `ConnectedInsertBuilder.run called for table: ${this.builder.tableName}`);
        const internalRelq = this.relq[INTERNAL];
        for (const row of this.builder.insertData) {
            internalRelq.validateData(this.builder.tableName, row, 'insert');
        }
        const sql = this.builder.toString();
        const result = await internalRelq.executeRun(sql);
        if (withMetadata) {
            return result;
        }
        return result.metadata.rowCount ?? 0;
    }
    returning(columns) {
        this.builder.returning(columns);
        return new ReturningExecutor(this.builder, this.relq);
    }
}
class ConnectedUpdateBuilder {
    builder;
    relq;
    constructor(builder, relq) {
        this.builder = builder;
        this.relq = relq;
    }
    where(callback) {
        this.builder.where(callback);
        return this;
    }
    toString() {
        return this.builder.toString();
    }
    async run(withMetadata) {
        this.relq[INTERNAL].validateData(this.builder.tableName, this.builder.updateData, 'update');
        const sql = this.builder.toString();
        const result = await this.relq[INTERNAL].executeRun(sql);
        if (withMetadata) {
            return result;
        }
        return result.metadata.rowCount ?? 0;
    }
    returning(columns) {
        this.builder.returning(columns);
        return new ReturningExecutor(this.builder, this.relq);
    }
}
class ConnectedDeleteBuilder {
    builder;
    relq;
    constructor(builder, relq) {
        this.builder = builder;
        this.relq = relq;
    }
    where(callback) {
        this.builder.where(callback);
        return this;
    }
    toString() {
        return this.builder.toString();
    }
    async run(withMetadata) {
        const sql = this.builder.toString();
        const result = await this.relq[INTERNAL].executeRun(sql);
        if (withMetadata) {
            return result;
        }
        return result.metadata.rowCount ?? 0;
    }
    returning(columns) {
        this.builder.returning(columns);
        return new ReturningExecutor(this.builder, this.relq);
    }
}
class ConnectedCountBuilder {
    builder;
    relq;
    tableName;
    groupNames = [];
    constructor(builder, relq, tableName) {
        this.builder = builder;
        this.relq = relq;
        this.tableName = tableName;
    }
    group(name, callback, options) {
        this.groupNames.push(name);
        this.builder.group(name, (q) => {
            const wrapped = this.wrapConditionBuilder(q);
            return callback(wrapped);
        }, options);
        return this;
    }
    where(callback) {
        this.builder.where((q) => {
            const wrapped = this.wrapConditionBuilder(q);
            return callback(wrapped);
        });
        return this;
    }
    wrapConditionBuilder(originalBuilder) {
        const relq = this.relq;
        const tableName = this.tableName;
        return new Proxy(originalBuilder, {
            get(target, prop) {
                const original = target[prop];
                if (typeof original === 'function') {
                    return function (column, ...args) {
                        const transformed = relq[INTERNAL].transformToDbColumns(tableName, { [column]: true });
                        const dbColumn = Object.keys(transformed)[0] || column;
                        return original.call(target, dbColumn, ...args);
                    };
                }
                return original;
            }
        });
    }
    toString() {
        return this.builder.toString();
    }
    async execute() {
        const sql = this.builder.toString();
        return this.relq[INTERNAL].executeCount(sql);
    }
    async get() {
        const sql = this.builder.toString();
        const result = await this.relq[INTERNAL].executeQuery(sql);
        const row = result.result.rows[0];
        if (this.groupNames.length === 0) {
            return (Number(row?.count) ?? 0);
        }
        const counts = {};
        for (const name of this.groupNames) {
            counts[name] = Number(row?.[name] ?? 0);
        }
        return counts;
    }
}
class ConnectedRawQueryBuilder {
    query;
    params;
    relq;
    builder;
    constructor(query, params, relq) {
        this.query = query;
        this.params = params;
        this.relq = relq;
        const convertedQuery = this.convertPlaceholders(query);
        this.builder = new RawQueryBuilder(convertedQuery, this.params);
    }
    convertPlaceholders(query) {
        let index = 0;
        return query.replace(/\?/g, () => `$${++index}`);
    }
    async all() {
        const sql = this.builder.toString();
        return this.relq[INTERNAL].executeSelect(sql);
    }
    async get() {
        const sql = this.builder.toString();
        return this.relq[INTERNAL].executeSelectOne(sql);
    }
    async getMany(count) {
        const sql = this.builder.toString();
        const limitedSql = sql.toUpperCase().includes('LIMIT')
            ? sql
            : `${sql} LIMIT ${count}`;
        return this.relq[INTERNAL].executeSelect(limitedSql);
    }
    async run() {
        const sql = this.builder.toString();
        return this.relq[INTERNAL].executeRun(sql);
    }
    async count() {
        const sql = this.builder.toString();
        return this.relq[INTERNAL].executeCount(sql);
    }
}
class ConnectedTransactionBuilder {
    relq;
    constructor(relq) {
        this.relq = relq;
    }
    builder = new TransactionBuilder();
    toString() {
        return this.builder.toString();
    }
    async begin() {
        const sql = this.builder.toString();
        return this.relq[INTERNAL].executeRun(sql);
    }
    async commit() {
        const sql = this.builder.commit();
        return this.relq[INTERNAL].executeRun(sql);
    }
    async rollback() {
        const sql = this.builder.rollback();
        return this.relq[INTERNAL].executeRun(sql);
    }
    isolationLevel(level) {
        this.builder.isolation(level);
        return this;
    }
    readOnly() {
        this.builder.readOnly();
        return this;
    }
    readWrite() {
        this.builder.readWrite();
        return this;
    }
    deferrable() {
        this.builder.deferrable();
        return this;
    }
}
class ConnectedCTEBuilder {
    relq;
    ctes = [];
    constructor(relq) {
        this.relq = relq;
    }
    with(name, query) {
        const queryStr = typeof query === 'string' ? query : query.toString();
        this.ctes.push({ name, query: queryStr });
        return this;
    }
    withMaterialized(name, query) {
        const queryStr = typeof query === 'string' ? query : query.toString();
        this.ctes.push({ name, query: `MATERIALIZED (${queryStr})` });
        return this;
    }
    async query(sql) {
        const cteClause = this.buildCTEClause();
        const fullSql = `${cteClause} ${sql}`;
        const result = await this.relq[INTERNAL].executeQuery(fullSql);
        return {
            data: result.result.rows,
            rowCount: result.result.rowCount ?? 0
        };
    }
    async all(sql) {
        const result = await this.query(sql);
        return result.data;
    }
    async get(sql) {
        const result = await this.query(sql);
        return result.data[0] ?? null;
    }
    buildCTEClause() {
        if (this.ctes.length === 0)
            return '';
        const cteStrings = this.ctes.map(cte => {
            if (cte.query.startsWith('MATERIALIZED')) {
                return `"${cte.name}" AS ${cte.query}`;
            }
            return `"${cte.name}" AS (${cte.query})`;
        });
        return `WITH ${cteStrings.join(', ')}`;
    }
    toSQL(mainQuery) {
        return `${this.buildCTEClause()} ${mainQuery}`;
    }
}
export default Relq;
