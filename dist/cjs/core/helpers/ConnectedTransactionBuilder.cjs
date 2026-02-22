"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectedTransactionBuilder = void 0;
const transaction_builder_1 = require("../../transaction/transaction-builder.cjs");
const methods_1 = require("./methods.cjs");
class ConnectedTransactionBuilder {
    relq;
    constructor(relq) {
        this.relq = relq;
    }
    builder = new transaction_builder_1.TransactionBuilder();
    toString() {
        return this.builder.toString();
    }
    async begin() {
        const sql = this.builder.toString();
        return this.relq[methods_1.INTERNAL].executeRun(sql);
    }
    async commit() {
        const sql = this.builder.commit();
        return this.relq[methods_1.INTERNAL].executeRun(sql);
    }
    async rollback() {
        const sql = this.builder.rollback();
        return this.relq[methods_1.INTERNAL].executeRun(sql);
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
exports.ConnectedTransactionBuilder = ConnectedTransactionBuilder;
