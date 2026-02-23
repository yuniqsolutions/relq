import format from "../utils/pg-format.js";
export class TruncateBuilder {
    tables;
    cascadeFlag = false;
    restrictFlag = false;
    restartIdentityFlag = false;
    continueIdentityFlag = false;
    onlyFlag = false;
    constructor(tables) {
        this.tables = Array.isArray(tables) ? tables : [tables];
    }
    cascade() {
        this.cascadeFlag = true;
        this.restrictFlag = false;
        return this;
    }
    restrict() {
        this.restrictFlag = true;
        this.cascadeFlag = false;
        return this;
    }
    restartIdentity() {
        this.restartIdentityFlag = true;
        this.continueIdentityFlag = false;
        return this;
    }
    continueIdentity() {
        this.continueIdentityFlag = true;
        this.restartIdentityFlag = false;
        return this;
    }
    only() {
        this.onlyFlag = true;
        return this;
    }
    onlyIfEmpty() {
        return this.only();
    }
    addTable(...tables) {
        this.tables.push(...tables);
        return this;
    }
    toString() {
        let sql = 'TRUNCATE TABLE';
        if (this.onlyFlag && this.tables.length === 1) {
            sql += ' ONLY';
        }
        sql += ' ' + this.tables.map(t => format.ident(t)).join(', ');
        if (this.restartIdentityFlag) {
            sql += ' RESTART IDENTITY';
        }
        else if (this.continueIdentityFlag) {
            sql += ' CONTINUE IDENTITY';
        }
        if (this.cascadeFlag) {
            sql += ' CASCADE';
        }
        else if (this.restrictFlag) {
            sql += ' RESTRICT';
        }
        return sql;
    }
}
