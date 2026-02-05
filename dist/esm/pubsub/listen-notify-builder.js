import format from "../utils/pg-format.js";
export class ListenBuilder {
    channelName;
    constructor(channelName) {
        this.channelName = channelName;
    }
    toString() {
        return `LISTEN ${format.ident(this.channelName)}`;
    }
}
export class UnlistenBuilder {
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
        return `UNLISTEN ${format.ident(this.channelName)}`;
    }
}
export class NotifyBuilder {
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
        let sql = `NOTIFY ${format.ident(this.channelName)}`;
        if (this.payload !== undefined) {
            const payloadStr = typeof this.payload === 'string'
                ? this.payload
                : JSON.stringify(this.payload);
            sql += `, ${format.literal(payloadStr)}`;
        }
        return sql;
    }
}
