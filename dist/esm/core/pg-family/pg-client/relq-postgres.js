import { ListenerConnection } from "../../../pubsub/listener-connection.js";
import { mergeWithPgEnv, validateEnvConfig } from "../../../utils/env-resolver.js";
import { PgBase } from "../shared/pg-base.js";
import { PG_CAPABILITIES } from "./capabilities.js";
export class RelqPostgres extends PgBase {
    dialect = 'postgres';
    capabilities = PG_CAPABILITIES;
    listener = null;
    constructor(schema, config = {}) {
        validateEnvConfig('postgres', config);
        const resolvedConfig = mergeWithPgEnv({ ...config, dialect: 'postgres' });
        super(schema, resolvedConfig);
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
