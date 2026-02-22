"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SavepointBuilder = exports.TransactionBuilder = void 0;
const pg_format_1 = __importDefault(require("../utils/pg-format.cjs"));
class TransactionBuilder {
    isolationLevel;
    mode;
    __deferrable;
    isolation(level) {
        this.isolationLevel = level;
        return this;
    }
    readWrite() {
        this.mode = 'READ WRITE';
        return this;
    }
    readOnly() {
        this.mode = 'READ ONLY';
        return this;
    }
    deferrable() {
        this.__deferrable = true;
        return this;
    }
    notDeferrable() {
        this.__deferrable = false;
        return this;
    }
    begin() {
        let sql = 'BEGIN';
        const options = [];
        if (this.isolationLevel) {
            options.push(`ISOLATION LEVEL ${this.isolationLevel}`);
        }
        if (this.mode) {
            options.push(this.mode);
        }
        if (this.__deferrable !== undefined) {
            options.push(this.__deferrable ? 'DEFERRABLE' : 'NOT DEFERRABLE');
        }
        if (options.length > 0) {
            sql += ` ${options.join(', ')}`;
        }
        return sql;
    }
    commit() {
        return 'COMMIT';
    }
    rollback() {
        return 'ROLLBACK';
    }
    toString() {
        return this.begin();
    }
}
exports.TransactionBuilder = TransactionBuilder;
class SavepointBuilder {
    savepointName;
    constructor(savepointName) {
        this.savepointName = savepointName;
    }
    create() {
        return `SAVEPOINT ${pg_format_1.default.ident(this.savepointName)}`;
    }
    rollback() {
        return `ROLLBACK TO SAVEPOINT ${pg_format_1.default.ident(this.savepointName)}`;
    }
    release() {
        return `RELEASE SAVEPOINT ${pg_format_1.default.ident(this.savepointName)}`;
    }
    toString() {
        return this.create();
    }
}
exports.SavepointBuilder = SavepointBuilder;
