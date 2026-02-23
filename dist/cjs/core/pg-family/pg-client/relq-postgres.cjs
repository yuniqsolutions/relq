"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelqPostgres = void 0;
const listener_connection_1 = require("../../../pubsub/listener-connection.cjs");
const env_resolver_1 = require("../../../utils/env-resolver.cjs");
const pg_base_1 = require("../shared/pg-base.cjs");
const capabilities_1 = require("./capabilities.cjs");
class RelqPostgres extends pg_base_1.PgBase {
    dialect = 'postgres';
    capabilities = capabilities_1.PG_CAPABILITIES;
    listener = null;
    constructor(schema, config = {}) {
        (0, env_resolver_1.validateEnvConfig)('postgres', config);
        const resolvedConfig = (0, env_resolver_1.mergeWithPgEnv)({ ...config, dialect: 'postgres' });
        super(schema, resolvedConfig);
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
            this.listener.on('error', (err) => this.emitter.emit('listenerError', err));
            this.listener.on('connect', () => this.emitter.emit('listenerConnect'));
        }
        const sub = await this.listener.subscribe(channel);
        sub.on('notification', callback);
        return () => sub.close();
    }
    async _close() {
        if (this.listener) {
            await this.listener.close();
            this.listener = null;
        }
        await super._close();
    }
}
exports.RelqPostgres = RelqPostgres;
