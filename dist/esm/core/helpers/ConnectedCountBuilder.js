import { INTERNAL } from "./methods.js";
export class ConnectedCountBuilder {
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
        const createProxy = (target) => {
            return new Proxy(target, {
                get(target, prop) {
                    const original = target[prop];
                    if (typeof original === 'function') {
                        return function (column, ...args) {
                            const transformed = relq[INTERNAL].transformToDbColumns(tableName, { [column]: true });
                            const dbColumn = Object.keys(transformed)[0] || column;
                            const result = original.call(target, dbColumn, ...args);
                            if (result === target || (result && typeof result === 'object')) {
                                return createProxy(result);
                            }
                            return result;
                        };
                    }
                    return original;
                }
            });
        };
        return createProxy(originalBuilder);
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
