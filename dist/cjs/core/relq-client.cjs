"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Relq = void 0;
const node_events_1 = require("node:events");
const config_types_1 = require("../types/config-types.cjs");
const aws_dsql_1 = require("../utils/aws-dsql.cjs");
const listener_connection_1 = require("../pubsub/listener-connection.cjs");
const environment_detection_1 = require("../utils/environment-detection.cjs");
const pool_defaults_1 = require("../utils/pool-defaults.cjs");
const relq_errors_1 = require("../errors/relq-errors.cjs");
const type_coercion_1 = require("../utils/type-coercion.cjs");
const helpers_1 = require("./helpers/index.cjs");
const scalar_select_builder_1 = require("../select/scalar-select-builder.cjs");
const condition_collector_1 = require("../condition/condition-collector.cjs");
let PgPool = null;
let PgClient = null;
const activeRelqInstances = new Set();
let cleanupHandlersRegistered = false;
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
            const pg = await Promise.resolve().then(() => __importStar(require("../addon/pg/index.cjs")));
            PgPool = pg.Pool;
            PgClient = pg.Client;
            return { Pool: pg.Pool, Client: pg.Client };
        }
        catch (error) {
            throw new relq_errors_1.RelqConfigError('Failed to load "pg" module', { field: 'pg', value: error instanceof Error ? error.message : String(error) });
        }
    }
    return { Pool: PgPool, Client: PgClient };
}
class Relq {
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
    emitter = new node_events_1.EventEmitter();
    columnMappings = new Map();
    schema;
    constructor(schema, config) {
        const schemaObj = schema;
        this.config = config;
        this.schema = schema;
        this.environment = (0, environment_detection_1.detectEnvironment)();
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
                (0, helpers_1.debugLog)(this.config, `buildColumnMappings: ${tableName}.${propName} -> type=${colType}, $validate=${!!colDef?.$validate}, $fields=${!!colDef?.$fields}, $checkValues=${!!colDef?.$checkValues}`);
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
                result[dbColName] = (0, type_coercion_1.serializeValue)(value, colType);
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
                result[propName] = (0, type_coercion_1.deserializeValue)(value, colType);
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
            (0, helpers_1.debugLog)(this.config, `No mapping found for table: ${tableName}. Available:`, Array.from(this.columnMappings.keys()));
            return;
        }
        const errors = [];
        const validateLength = validation?.validateLength !== false;
        const validateTypes = validation?.validateTypes !== false;
        const onError = validation?.onError ?? 'throw';
        (0, helpers_1.debugLog)(this.config, `Validating ${operation} on ${tableName}. Fields:`, Object.keys(data));
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
                (0, helpers_1.debugLog)(this.config, `Domain validation for '${propName}' with value '${value}': isValid=${isValid}`);
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
            (0, helpers_1.debugLog)(this.config, message);
            if (onError === 'throw') {
                throw new relq_errors_1.RelqQueryError(message);
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
            (0, helpers_1.debugLog)(this.config, `Composite field '${propName}.${fieldName}': value=${JSON.stringify(fieldValue)}, colType=${colType}, nullable=${isNullable}`);
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
            throw new relq_errors_1.RelqConnectionError('No database connection available');
        }
    }
    get [helpers_1.INTERNAL]() {
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
            validateData: this._validateData.bind(this),
            getSchema: this._getSchema.bind(this),
            getRelations: this._getRelations.bind(this),
            getTableDef: this._getTableDef.bind(this)
        };
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
            throw new relq_errors_1.RelqEnvironmentError('Cannot use Relq with database connections in edge runtime.\n' +
                'Edge runtimes (Cloudflare Workers, Deno Deploy) do not support TCP connections.\n\n' +
                'Options:\n' +
                '1. Use query builder only: relq("table").select().toString()\n' +
                '2. Use HTTP-based database (Supabase, Neon, Xata)\n' +
                '3. Deploy to Node.js runtime', (0, environment_detection_1.getEnvironmentDescription)(this.environment), 'No TCP/PostgreSQL support');
        }
        const poolConfig = {
            min: this.config.pool?.min,
            max: this.config.pool?.max
        };
        const validation = (0, pool_defaults_1.validatePoolConfig)(poolConfig, this.environment);
        if (!validation.valid && validation.errors.length > 0) {
            const logLevel = this.config.logLevel ?? 'info';
            if (logLevel !== 'silent') {
                console.error('\n' + validation.errors.join('\n\n'));
            }
            throw new relq_errors_1.RelqConfigError(validation.errors[0]);
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
        const smartDefaults = (0, pool_defaults_1.getSmartPoolDefaults)();
        const poolConfig = (0, pool_defaults_1.formatPoolConfig)({
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
            let resolvedPassword = this.config.password;
            if ((0, config_types_1.isAwsDsqlConfig)(this.config)) {
                (0, helpers_1.debugLog)(this.config, 'Resolving AWS DSQL token...');
                resolvedPassword = await (0, aws_dsql_1.getAwsDsqlToken)(this.config.aws);
                (0, helpers_1.debugLog)(this.config, 'AWS DSQL token resolved successfully');
            }
            if (this.usePooling) {
                const poolConfig = (0, config_types_1.toPoolConfig)(this.config);
                if (resolvedPassword) {
                    poolConfig.password = resolvedPassword;
                }
                this.pool = new PgPoolClass(poolConfig);
                this.setupPoolErrorHandling();
                this.pool.on('connect', (client) => {
                    this.emitter.emit('connect', client);
                    this.emitter.emit('acquire', client);
                });
                this.pool.on('error', (err) => this.emitter.emit('error', err));
                this.pool.on('remove', (client) => this.emitter.emit('remove', client));
            }
            else {
                const isAws = (0, config_types_1.isAwsDsqlConfig)(this.config);
                const host = isAws ? this.config.aws.hostname : (this.config.host || 'localhost');
                const port = this.config.aws?.port ?? this.config.port ?? 5432;
                const user = this.config.aws?.user ?? this.config.user ?? (isAws ? 'admin' : undefined);
                const ssl = isAws ? (this.config.aws.ssl ?? true) : this.config.ssl;
                this.client = new PgClientClass({
                    host,
                    port,
                    database: this.config.database,
                    user,
                    password: resolvedPassword,
                    connectionString: this.config.connectionString,
                    ssl
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
            this.listener = new listener_connection_1.ListenerConnection({
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
                throw new relq_errors_1.RelqConfigError(`Invalid SQL query: ${sql === null ? 'null' : sql === undefined ? 'undefined' : 'empty string'}`);
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
                throw new relq_errors_1.RelqConfigError('No database connection available');
            }
            const duration = performance.now() - startTime;
            return { result, duration };
        }
        catch (error) {
            throw (0, relq_errors_1.parsePostgresError)(error, sql);
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
            return new helpers_1.ConnectedQueryBuilder(tableName, relq);
        };
        return new Proxy(tableFunction, {
            get(target, prop, receiver) {
                if (prop in target) {
                    return Reflect.get(target, prop, receiver);
                }
                if (typeof prop === 'string' && relq.schema && prop in relq.schema) {
                    const tableDef = relq.schema[prop];
                    const sqlTableName = tableDef?.$name || prop;
                    return new helpers_1.ConnectedQueryBuilder(sqlTableName, relq, prop);
                }
                return undefined;
            }
        });
    }
    raw(query, ...params) {
        return new helpers_1.ConnectedRawQueryBuilder(query, params, this);
    }
    transaction() {
        return new helpers_1.ConnectedTransactionBuilder(this);
    }
    with(name, query) {
        return new helpers_1.ConnectedCTEBuilder(this).with(name, query);
    }
    async ctAs(tableName, query, options = {}) {
        const queryStr = typeof query === 'string' ? query : query.toString();
        const temp = options.temporary ? 'TEMPORARY ' : '';
        const ifNotExists = options.ifNotExists ? 'IF NOT EXISTS ' : '';
        const sql = `CREATE ${temp}TABLE ${ifNotExists}"${tableName}" AS ${queryStr}`;
        await this[helpers_1.INTERNAL].executeQuery(sql);
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
        const result = await this[helpers_1.INTERNAL].executeQuery(sql);
        if (options.format === 'json') {
            return result.result.rows;
        }
        return result.result.rows.map((r) => r['QUERY PLAN'] || Object.values(r)[0]).join('\n');
    }
    scalar(scalars) {
        const schema = this._getSchema();
        return new scalar_select_builder_1.ConnectedScalarSelectBuilder(scalars, schema, {
            executeSelectOne: this[helpers_1.INTERNAL].executeSelect.bind(this),
            hasColumnMapping: this._hasColumnMapping.bind(this),
            transformToDbColumns: this._transformToDbColumns.bind(this)
        });
    }
    where(_tableName) {
        return new condition_collector_1.ConditionCollector();
    }
}
exports.Relq = Relq;
exports.default = Relq;
