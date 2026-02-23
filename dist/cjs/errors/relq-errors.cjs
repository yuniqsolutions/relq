"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelqBuilderError = exports.RelqEnvironmentError = exports.RelqPoolError = exports.RelqTimeoutError = exports.RelqConfigError = exports.RelqTransactionError = exports.RelqQueryError = exports.RelqConnectionError = exports.RelqError = void 0;
exports.setupErrorHandler = setupErrorHandler;
exports.isRelqError = isRelqError;
exports.isRelqConnectionError = isRelqConnectionError;
exports.isRelqQueryError = isRelqQueryError;
exports.isRelqBuilderError = isRelqBuilderError;
exports.wrapError = wrapError;
exports.parsePostgresError = parsePostgresError;
const node_process_1 = __importDefault(require("node:process"));
function setupErrorHandler() {
    if (typeof node_process_1.default === 'undefined' || !node_process_1.default.on)
        return;
    node_process_1.default.on('uncaughtException', (error) => {
        if (error instanceof RelqError) {
            const inspect = error[Symbol.for('nodejs.util.inspect.custom')];
            if (typeof inspect === 'function') {
                console.error(inspect.call(error, 0, {}));
            }
            else {
                console.error(`${error.name}: ${error.message}`);
            }
        }
        else {
            console.error(`${error.name || 'Error'}: ${error.message}`);
            if (error.stack) {
                const stackLines = error.stack.split('\n').filter(line => line.trim().startsWith('at '));
                console.error(stackLines.slice(0, 5).join('\n'));
            }
        }
        node_process_1.default.exit(1);
    });
    node_process_1.default.on('unhandledRejection', (reason) => {
        if (reason instanceof RelqError) {
            const inspect = reason[Symbol.for('nodejs.util.inspect.custom')];
            if (typeof inspect === 'function') {
                console.error(inspect.call(reason, 0, {}));
            }
            else {
                console.error(`${reason.name}: ${reason.message}`);
            }
        }
        else if (reason instanceof Error) {
            console.error(`${reason.name || 'Error'}: ${reason.message}`);
            if (reason.stack) {
                const stackLines = reason.stack.split('\n').filter(line => line.trim().startsWith('at '));
                console.error(stackLines.slice(0, 5).join('\n'));
            }
        }
        else {
            console.error('Unhandled rejection:', reason);
        }
        node_process_1.default.exit(1);
    });
}
class RelqError extends Error {
    name;
    cause;
    timestamp;
    constructor(message, cause) {
        super(message);
        this.name = 'RelqError';
        this.cause = cause;
        this.timestamp = new Date();
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
    [Symbol.for('nodejs.util.inspect.custom')](_depth, _options) {
        const lines = [
            `${this.name}: ${this.message}`,
            ` timestamp: ${this.timestamp.toISOString()}`
        ];
        const props = this._getInspectProps();
        for (const [key, value] of Object.entries(props)) {
            const strVal = value === undefined ? 'undefined' : JSON.stringify(value);
            lines.push(`${key.padStart(10)}: ${strVal}`);
        }
        if (this.stack) {
            const stackLines = this.stack.split('\n').filter(line => line.trim().startsWith('at ') || line.includes(this.name));
            lines.push('');
            lines.push(...stackLines.slice(1, 6));
        }
        return lines.join('\n');
    }
    _getInspectProps() {
        return {};
    }
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            cause: this.cause?.message,
            timestamp: this.timestamp.toISOString(),
            stack: this.stack
        };
    }
}
exports.RelqError = RelqError;
class RelqConnectionError extends RelqError {
    name = 'RelqConnectionError';
    code;
    host;
    port;
    constructor(message, options) {
        super(message, options?.cause);
        this.code = options?.code;
        this.host = options?.host;
        this.port = options?.port;
    }
    _getInspectProps() {
        return { code: this.code, host: this.host, port: this.port };
    }
    toJSON() {
        return {
            ...super.toJSON(),
            code: this.code,
            host: this.host,
            port: this.port
        };
    }
}
exports.RelqConnectionError = RelqConnectionError;
class RelqQueryError extends RelqError {
    name = 'RelqQueryError';
    sql;
    code;
    detail;
    hint;
    constructor(message, options) {
        super(message, options?.cause);
        this.sql = options?.sql;
        this.code = options?.code;
        this.detail = options?.detail;
        this.hint = options?.hint;
    }
    _getInspectProps() {
        return { sql: this.sql, detail: this.detail, hint: this.hint, code: this.code };
    }
    toJSON() {
        return {
            ...super.toJSON(),
            sql: this.sql,
            code: this.code,
            detail: this.detail,
            hint: this.hint
        };
    }
}
exports.RelqQueryError = RelqQueryError;
class RelqTransactionError extends RelqError {
    name = 'RelqTransactionError';
    operation;
    transactionState;
    constructor(message, operation, options) {
        super(message, options?.cause);
        this.operation = operation;
        this.transactionState = options?.transactionState;
    }
    _getInspectProps() {
        return { operation: this.operation, transactionState: this.transactionState };
    }
    toJSON() {
        return {
            ...super.toJSON(),
            operation: this.operation,
            transactionState: this.transactionState
        };
    }
}
exports.RelqTransactionError = RelqTransactionError;
class RelqConfigError extends RelqError {
    name = 'RelqConfigError';
    field;
    value;
    constructor(message, options) {
        super(message);
        this.field = options?.field;
        this.value = options?.value;
    }
    _getInspectProps() {
        return { field: this.field, value: this.value };
    }
    toJSON() {
        return {
            ...super.toJSON(),
            field: this.field,
            value: this.value
        };
    }
}
exports.RelqConfigError = RelqConfigError;
class RelqTimeoutError extends RelqError {
    name = 'RelqTimeoutError';
    timeout;
    operation;
    constructor(message, timeout, operation, cause) {
        super(message, cause);
        this.timeout = timeout;
        this.operation = operation;
    }
    _getInspectProps() {
        return { timeout: this.timeout, operation: this.operation };
    }
    toJSON() {
        return {
            ...super.toJSON(),
            timeout: this.timeout,
            operation: this.operation
        };
    }
}
exports.RelqTimeoutError = RelqTimeoutError;
class RelqPoolError extends RelqError {
    name = 'RelqPoolError';
    poolSize;
    activeConnections;
    waitingClients;
    constructor(message, options) {
        super(message, options?.cause);
        this.poolSize = options?.poolSize;
        this.activeConnections = options?.activeConnections;
        this.waitingClients = options?.waitingClients;
    }
    _getInspectProps() {
        return { poolSize: this.poolSize, activeConnections: this.activeConnections, waitingClients: this.waitingClients };
    }
    toJSON() {
        return {
            ...super.toJSON(),
            poolSize: this.poolSize,
            activeConnections: this.activeConnections,
            waitingClients: this.waitingClients
        };
    }
}
exports.RelqPoolError = RelqPoolError;
class RelqEnvironmentError extends RelqError {
    name = 'RelqEnvironmentError';
    environment;
    reason;
    constructor(message, environment, reason) {
        super(message);
        this.environment = environment;
        this.reason = reason;
    }
    _getInspectProps() {
        return { environment: this.environment, reason: this.reason };
    }
    toJSON() {
        return {
            ...super.toJSON(),
            environment: this.environment,
            reason: this.reason
        };
    }
}
exports.RelqEnvironmentError = RelqEnvironmentError;
class RelqBuilderError extends RelqError {
    name = 'RelqBuilderError';
    builder;
    missing;
    hint;
    constructor(message, options) {
        super(message);
        this.builder = options?.builder;
        this.missing = options?.missing;
        this.hint = options?.hint;
    }
    _getInspectProps() {
        return { builder: this.builder, missing: this.missing, hint: this.hint };
    }
    toJSON() {
        return {
            ...super.toJSON(),
            builder: this.builder,
            missing: this.missing,
            hint: this.hint
        };
    }
}
exports.RelqBuilderError = RelqBuilderError;
function isRelqError(error) {
    return error instanceof RelqError;
}
function isRelqConnectionError(error) {
    return error instanceof RelqConnectionError;
}
function isRelqQueryError(error) {
    return error instanceof RelqQueryError;
}
function isRelqBuilderError(error) {
    return error instanceof RelqBuilderError;
}
function wrapError(error, context) {
    if (isRelqError(error)) {
        return error;
    }
    if (error instanceof Error) {
        const message = context ? `${context}: ${error.message}` : error.message;
        return new RelqError(message, error);
    }
    const message = context
        ? `${context}: ${String(error)}`
        : String(error);
    return new RelqError(message);
}
function parsePostgresError(error, sql) {
    const message = error.message || 'Database error';
    const code = error.code;
    if (isNetworkErrorCode(code)) {
        return new RelqConnectionError(message, {
            cause: error,
            code,
            host: error.hostname || error.address,
            port: error.port
        });
    }
    if (code === '57P01' || code === '57P03' || code === '08006' || code === '08001' || code === '08004') {
        return new RelqConnectionError(message, {
            cause: error,
            code,
            host: error.hostname,
            port: error.port
        });
    }
    if (code === '57014') {
        return new RelqTimeoutError('Query execution timed out', error.timeout || 0, 'query', error);
    }
    return new RelqQueryError(message, {
        cause: error,
        sql,
        code,
        detail: error.detail,
        hint: error.hint
    });
}
const NETWORK_ERROR_CODES = new Set([
    'ECONNREFUSED', 'ECONNRESET', 'ENOTFOUND', 'ESERVFAIL',
    'ETIMEDOUT', 'EPIPE', 'EAI_AGAIN', 'EHOSTUNREACH',
    'CONNECTION_LOST', 'PROTOCOL_CONNECTION_LOST',
]);
function isNetworkErrorCode(code) {
    return !!code && NETWORK_ERROR_CODES.has(code);
}
