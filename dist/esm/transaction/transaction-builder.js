import format from "../utils/pg-format.js";
export class TransactionBuilder {
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
export class SavepointBuilder {
    savepointName;
    constructor(savepointName) {
        this.savepointName = savepointName;
    }
    create() {
        return `SAVEPOINT ${format.ident(this.savepointName)}`;
    }
    rollback() {
        return `ROLLBACK TO SAVEPOINT ${format.ident(this.savepointName)}`;
    }
    release() {
        return `RELEASE SAVEPOINT ${format.ident(this.savepointName)}`;
    }
    toString() {
        return this.create();
    }
}
