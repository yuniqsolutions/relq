"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListenerConnection = void 0;
const node_events_1 = require("node:events");
const pg_1 = require("pg");
const pg_format_1 = __importDefault(require("../utils/pg-format.cjs"));
class ListenerConnection extends node_events_1.EventEmitter {
    client = null;
    config;
    connected = false;
    connecting = false;
    subscriptions = new Map();
    reconnectTimeout = null;
    isClosing = false;
    reconnectDelay = 1000;
    maxReconnectDelay = 30000;
    constructor(config) {
        super();
        this.config = config;
    }
    async subscribe(channel) {
        if (!this.connected && !this.connecting) {
            await this.connect();
        }
        else if (this.connecting) {
            await this.waitForConnection();
        }
        let channelSub = this.subscriptions.get(channel);
        if (!channelSub) {
            channelSub = { subscribers: [], retryCount: 0 };
            this.subscriptions.set(channel, channelSub);
            await this.executeListen(channel);
        }
        const emitter = new node_events_1.EventEmitter();
        channelSub.subscribers.push(emitter);
        const subscription = {
            on(event, listener) {
                emitter.on(event, listener);
                return this;
            },
            close: async () => {
                emitter.removeAllListeners();
                const sub = this.subscriptions.get(channel);
                if (sub) {
                    const index = sub.subscribers.indexOf(emitter);
                    if (index !== -1) {
                        sub.subscribers.splice(index, 1);
                    }
                    if (sub.subscribers.length === 0) {
                        this.subscriptions.delete(channel);
                        if (this.connected) {
                            try {
                                await this.client?.query(`UNLISTEN ${pg_format_1.default.ident(channel)}`);
                            }
                            catch (err) {
                            }
                        }
                        if (this.subscriptions.size === 0) {
                            await this.close();
                        }
                    }
                }
            }
        };
        return subscription;
    }
    async connect() {
        if (this.connected || this.connecting)
            return;
        this.connecting = true;
        this.isClosing = false;
        try {
            this.client = new pg_1.Client(this.config);
            this.client.on('notification', (msg) => {
                if (msg.channel && msg.payload) {
                    this.dispatch(msg.channel, msg.payload);
                }
            });
            this.client.on('error', (err) => {
                this.emit('error', err);
                if (!this.isClosing) {
                    this.handleDisconnect();
                }
            });
            this.client.on('end', () => {
                if (!this.isClosing) {
                    this.handleDisconnect();
                }
            });
            await this.client.connect();
            this.connected = true;
            this.connecting = false;
            this.reconnectDelay = 1000;
            await this.resubscribeAll();
            this.emit('connect');
        }
        catch (err) {
            this.connecting = false;
            this.handleDisconnect();
            throw err;
        }
    }
    async waitForConnection() {
        return new Promise((resolve, reject) => {
            const onConnect = () => {
                cleanup();
                resolve();
            };
            const onError = (err) => {
                cleanup();
                reject(err);
            };
            const cleanup = () => {
                this.removeListener('connect', onConnect);
                this.removeListener('error', onError);
            };
            this.on('connect', onConnect);
            this.on('error', onError);
        });
    }
    dispatch(channel, payload) {
        const sub = this.subscriptions.get(channel);
        if (sub) {
            let data = payload;
            try {
                data = JSON.parse(payload);
            }
            catch {
            }
            sub.subscribers.forEach(emitter => emitter.emit('notification', data));
        }
    }
    async executeListen(channel) {
        if (this.client && this.connected) {
            await this.client.query(`LISTEN ${pg_format_1.default.ident(channel)}`);
        }
    }
    async resubscribeAll() {
        for (const channel of this.subscriptions.keys()) {
            try {
                await this.executeListen(channel);
            }
            catch (err) {
                console.error(`Failed to resubscribe to ${channel}:`, err);
            }
        }
    }
    handleDisconnect() {
        this.connected = false;
        this.client = null;
        if (this.isClosing)
            return;
        if (this.reconnectTimeout)
            clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = setTimeout(() => {
            console.log('Reconnecting listener...');
            this.connect().catch(err => {
                console.error('Reconnect failed:', err);
                this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
                this.handleDisconnect();
            });
        }, this.reconnectDelay);
        this.reconnectTimeout.unref();
    }
    async close() {
        this.isClosing = true;
        if (this.reconnectTimeout)
            clearTimeout(this.reconnectTimeout);
        if (this.client) {
            await this.client.end();
            this.client = null;
        }
        this.connected = false;
        this.subscriptions.clear();
    }
}
exports.ListenerConnection = ListenerConnection;
