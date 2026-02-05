import { TransactionBuilder } from "../../transaction/transaction-builder.js";
import { INTERNAL } from "./methods.js";
export class ConnectedTransactionBuilder {
    relq;
    constructor(relq) {
        this.relq = relq;
    }
    builder = new TransactionBuilder();
    toString() {
        return this.builder.toString();
    }
    async begin() {
        const sql = this.builder.toString();
        return this.relq[INTERNAL].executeRun(sql);
    }
    async commit() {
        const sql = this.builder.commit();
        return this.relq[INTERNAL].executeRun(sql);
    }
    async rollback() {
        const sql = this.builder.rollback();
        return this.relq[INTERNAL].executeRun(sql);
    }
    isolationLevel(level) {
        this.builder.isolation(level);
        return this;
    }
    readOnly() {
        this.builder.readOnly();
        return this;
    }
    readWrite() {
        this.builder.readWrite();
        return this;
    }
    deferrable() {
        this.builder.deferrable();
        return this;
    }
}
