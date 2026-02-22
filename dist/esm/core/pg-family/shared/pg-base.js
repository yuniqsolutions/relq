import { toPoolConfig, isAwsDsqlConfig } from "../../../types/config-types.js";
import { getAwsDsqlToken } from "../../../utils/aws-dsql.js";
import { RelqConfigError, RelqConnectionError, parsePostgresError } from "../../../errors/relq-errors.js";
import { detectEnvironment } from "../../../utils/environment-detection.js";
import { validatePoolConfig, formatPoolConfig, getSmartPoolDefaults } from "../../../utils/pool-defaults.js";
import { debugLog } from "../../helpers/methods.js";
import { RelqBase } from "../../relq-base.js";
import { pgDialect } from "./pg-dialect.js";
import { isPgConnectionError } from "./pg-error-parser.js";
let PgPool = null;
let PgClient = null;
export async function loadPg() {
    if (!PgPool || !PgClient) {
        try {
            const pg = await import('pg');
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
export class PgBase extends RelqBase {
    sqlDialect = pgDialect;
    pool;
    client;
    usePooling;
    clientConnected = false;
    connectPromise;
    environment;
    poolErrorHandler;
    poolConnectHandler;
    poolRemoveHandler;
    constructor(schema, config) {
        super(schema, config);
        this.environment = detectEnvironment();
        this.usePooling = this.determinePoolingStrategy(config);
        this.validateConfiguration();
        this.logEnvironmentInfo();
    }
    async _initialize() {
        const { Pool: PgPoolClass, Client: PgClientClass } = await loadPg();
        let resolvedPassword = this.config.password;
        if (isAwsDsqlConfig(this.config)) {
            debugLog(this.config, 'Resolving AWS DSQL token...');
            resolvedPassword = await getAwsDsqlToken(this.config.aws);
            debugLog(this.config, 'AWS DSQL token resolved successfully');
        }
        if (this.usePooling) {
            const poolConfig = toPoolConfig(this.config);
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
            const isAws = isAwsDsqlConfig(this.config);
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
            this.client.on('end', () => {
                this.clientConnected = false;
                this.emitter.emit('end');
            });
            this.client.on('error', (err) => {
                this.clientConnected = false;
                this.emitter.emit('error', err);
            });
            this.client.on('notice', (msg) => this.emitter.emit('notice', msg));
            this.client.on('notification', (msg) => this.emitter.emit('notification', msg));
        }
    }
    async _query(sql) {
        const executeQuery = async () => {
            if (this.pool) {
                return await this.pool.query(sql);
            }
            else if (this.client) {
                await this.ensureClientConnection();
                return await this.client.query(sql);
            }
            else {
                throw new RelqConfigError('No database connection available');
            }
        };
        try {
            const result = await executeQuery();
            return this.toDriverResult(result);
        }
        catch (error) {
            if (isPgConnectionError(error) && !this.usePooling && this.client) {
                this.clientConnected = false;
                try {
                    await this.ensureClientConnection();
                    const result = await this.client.query(sql);
                    return this.toDriverResult(result);
                }
                catch {
                    throw parsePostgresError(error, sql);
                }
            }
            throw parsePostgresError(error, sql);
        }
    }
    async _acquireClient() {
        if (this.pool) {
            const client = await this.pool.connect();
            return { client, release: () => client.release() };
        }
        else if (this.client) {
            return { client: this.client, release: () => { } };
        }
        else {
            throw new RelqConnectionError('No database connection available');
        }
    }
    async _close() {
        if (this.pool) {
            if (this.poolErrorHandler)
                this.pool.removeListener('error', this.poolErrorHandler);
            if (this.poolConnectHandler)
                this.pool.removeListener('connect', this.poolConnectHandler);
            if (this.poolRemoveHandler)
                this.pool.removeListener('remove', this.poolRemoveHandler);
            this.pool.removeAllListeners();
            await this.pool.end();
        }
        else if (this.client) {
            this.client.removeAllListeners();
            await this.client.end();
            this.clientConnected = false;
        }
    }
    toDriverResult(result) {
        return {
            rows: result.rows,
            rowCount: result.rowCount,
            command: result.command,
            fields: result.fields.map(f => ({
                name: f.name,
                dataTypeID: f.dataTypeID,
            }))
        };
    }
    determinePoolingStrategy(config) {
        if (typeof config.pooling === 'boolean')
            return config.pooling;
        if (config.disableSmartDefaults)
            return true;
        return true;
    }
    validateConfiguration() {
        if (this.config.disableSmartDefaults)
            return;
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
        if (this.environment.type === 'serverless' || this.environment.type === 'edge') {
            if (logLevel === 'info' || logLevel === 'debug') {
                console.log(`\n🔵 Relq: ${this.environment.provider} detected (${this.environment.type})\n` +
                    `   Pool config: ${poolConfig}`);
            }
        }
        else if (this.environment.type === 'traditional') {
            if (logLevel === 'debug') {
                console.log(`\n🟢 Relq: Traditional server environment\n` +
                    `   Pool config: ${poolConfig}`);
            }
        }
    }
    setupPoolErrorHandling() {
        if (!this.pool)
            return;
        this.poolErrorHandler = (err) => {
            const errorCode = err.code;
            if (isPoolRecoverableError(errorCode)) {
                const logLevel = this.config.logLevel ?? 'info';
                if (logLevel !== 'silent') {
                    console.warn('[Relq Pool] Recoverable connection error (pool will auto-recover):', {
                        code: errorCode,
                        message: err.message,
                        action: 'Connection removed from pool, will be replaced on next query'
                    });
                }
                return;
            }
            const logLevel = this.config.logLevel ?? 'info';
            if (logLevel !== 'silent') {
                console.error('[Relq Pool] Pool error:', {
                    code: errorCode,
                    message: err.message,
                });
            }
        };
        this.poolConnectHandler = () => { };
        this.poolRemoveHandler = () => { };
        this.pool.on('error', this.poolErrorHandler);
        this.pool.on('connect', this.poolConnectHandler);
        this.pool.on('remove', this.poolRemoveHandler);
    }
    async ensureClientConnection() {
        if (this.usePooling || !this.client)
            return;
        if (this.clientConnected)
            return;
        if (this.connectPromise)
            return this.connectPromise;
        this.connectPromise = (async () => {
            try {
                if (this.client && !this.clientConnected) {
                    try {
                        await this.client.connect();
                        this.clientConnected = true;
                        this.emitter.emit('connect', this.client);
                    }
                    catch (err) {
                        if (err.message?.includes('already been connected') ||
                            err.code === 'ECONNRESET' ||
                            err.code === 'ETIMEDOUT' ||
                            err.code === 'EPIPE' ||
                            err.message?.includes('Connection terminated')) {
                            this.client.removeAllListeners();
                            try {
                                await this.client.end();
                            }
                            catch { }
                            await this.recreateClient();
                        }
                        else {
                            throw err;
                        }
                    }
                }
            }
            finally {
                this.connectPromise = undefined;
            }
        })();
        return this.connectPromise;
    }
    async recreateClient() {
        const { Client: PgClientClass } = await loadPg();
        let resolvedPassword = this.config.password;
        const isAws = isAwsDsqlConfig(this.config);
        if (isAws) {
            resolvedPassword = await getAwsDsqlToken(this.config.aws);
        }
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
        this.client.on('end', () => {
            this.clientConnected = false;
            this.emitter.emit('end');
        });
        this.client.on('error', (err) => {
            this.clientConnected = false;
            this.emitter.emit('error', err);
        });
        this.client.on('notice', (msg) => this.emitter.emit('notice', msg));
        this.client.on('notification', (msg) => this.emitter.emit('notification', msg));
        await this.client.connect();
        this.clientConnected = true;
        this.emitter.emit('connect', this.client);
    }
}
const POOL_RECOVERABLE_NETWORK_CODES = new Set([
    'ECONNRESET', 'ECONNREFUSED', 'ENOTFOUND', 'ESERVFAIL',
    'ETIMEDOUT', 'EPIPE', 'EAI_AGAIN', 'EHOSTUNREACH',
    'ECONNABORTED', 'ENETUNREACH', 'ENETRESET',
    'CONNECTION_LOST', 'PROTOCOL_CONNECTION_LOST',
]);
const POOL_RECOVERABLE_PG_CODES = new Set([
    '57P01',
    '57P02',
    '57P03',
    '08006',
    '08001',
    '08004',
]);
function isPoolRecoverableError(code) {
    if (!code)
        return true;
    return POOL_RECOVERABLE_NETWORK_CODES.has(code) || POOL_RECOVERABLE_PG_CODES.has(code);
}
