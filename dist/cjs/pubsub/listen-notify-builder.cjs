"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotifyBuilder = exports.UnlistenBuilder = exports.ListenBuilder = void 0;
const pg_format_1 = __importDefault(require("../utils/pg-format.cjs"));
class ListenBuilder {
    channelName;
    constructor(channelName) {
        this.channelName = channelName;
    }
    toString() {
        return `LISTEN ${pg_format_1.default.ident(this.channelName)}`;
    }
}
exports.ListenBuilder = ListenBuilder;
class UnlistenBuilder {
    channelName;
    constructor(channelName = '*') {
        this.channelName = channelName;
    }
    all() {
        this.channelName = '*';
        return this;
    }
    toString() {
        if (this.channelName === '*') {
            return 'UNLISTEN *';
        }
        return `UNLISTEN ${pg_format_1.default.ident(this.channelName)}`;
    }
}
exports.UnlistenBuilder = UnlistenBuilder;
class NotifyBuilder {
    channelName;
    payload;
    constructor(channelName, payload) {
        this.channelName = channelName;
        this.payload = payload;
    }
    withPayload(payload) {
        this.payload = payload;
        return this;
    }
    toString() {
        let sql = `NOTIFY ${pg_format_1.default.ident(this.channelName)}`;
        if (this.payload !== undefined) {
            const payloadStr = typeof this.payload === 'string'
                ? this.payload
                : JSON.stringify(this.payload);
            sql += `, ${pg_format_1.default.literal(payloadStr)}`;
        }
        return sql;
    }
}
exports.NotifyBuilder = NotifyBuilder;
