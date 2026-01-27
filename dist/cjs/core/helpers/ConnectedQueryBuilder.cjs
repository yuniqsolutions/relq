"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectedQueryBuilder = void 0;
const count_builder_1 = require("../../count/count-builder.cjs");
const delete_builder_1 = require("../../delete/delete-builder.cjs");
const insert_builder_1 = require("../../insert/insert-builder.cjs");
const aggregate_builder_1 = require("../../select/aggregate-builder.cjs");
const select_builder_1 = require("../../select/select-builder.cjs");
const update_builder_1 = require("../../update/update-builder.cjs");
const ConnectedAggregateBuilder_1 = require("./ConnectedAggregateBuilder.cjs");
const ConnectedCountBuilder_1 = require("./ConnectedCountBuilder.cjs");
const ConnectedDeleteBuilder_1 = require("./ConnectedDeleteBuilder.cjs");
const ConnectedInsertBuilder_1 = require("./ConnectedInsertBuilder.cjs");
const ConnectedSelectBuilder_1 = require("./ConnectedSelectBuilder.cjs");
const ConnectedUpdateBuilder_1 = require("./ConnectedUpdateBuilder.cjs");
const methods_1 = require("./methods.cjs");
const PaginateBuilder_1 = require("./PaginateBuilder.cjs");
class ConnectedQueryBuilder {
    tableName;
    relq;
    schemaKey;
    constructor(tableName, relq, schemaKey) {
        this.tableName = tableName;
        this.relq = relq;
        this.schemaKey = schemaKey;
    }
    select(columns) {
        let dbColumns = columns;
        if (columns && this.relq[methods_1.INTERNAL].hasColumnMapping()) {
            if (Array.isArray(columns)) {
                dbColumns = columns.map(col => {
                    if (Array.isArray(col)) {
                        const transformed = this.relq[methods_1.INTERNAL].transformToDbColumns(this.tableName, { [col[0]]: true });
                        return [Object.keys(transformed)[0], col[1]];
                    }
                    else {
                        const transformed = this.relq[methods_1.INTERNAL].transformToDbColumns(this.tableName, { [col]: true });
                        return Object.keys(transformed)[0];
                    }
                });
            }
            else {
                const transformed = this.relq[methods_1.INTERNAL].transformToDbColumns(this.tableName, { [columns]: true });
                dbColumns = Object.keys(transformed)[0];
            }
        }
        const builder = new select_builder_1.SelectBuilder(this.tableName, dbColumns);
        return new ConnectedSelectBuilder_1.ConnectedSelectBuilder(builder, this.relq, this.tableName, columns, this.schemaKey);
    }
    insert(data) {
        const builder = new insert_builder_1.InsertBuilder(this.tableName, data);
        return new ConnectedInsertBuilder_1.ConnectedInsertBuilder(builder, this.relq, this.tableName, this.schemaKey);
    }
    update(data) {
        const builder = new update_builder_1.UpdateBuilder(this.tableName, data);
        return new ConnectedUpdateBuilder_1.ConnectedUpdateBuilder(builder, this.relq, this.tableName, this.schemaKey);
    }
    delete() {
        const builder = new delete_builder_1.DeleteBuilder(this.tableName);
        return new ConnectedDeleteBuilder_1.ConnectedDeleteBuilder(builder, this.relq, this.tableName, this.schemaKey);
    }
    count() {
        const builder = new count_builder_1.CountBuilder(this.tableName);
        return new ConnectedCountBuilder_1.ConnectedCountBuilder(builder, this.relq, this.tableName);
    }
    aggregate() {
        const builder = new aggregate_builder_1.AggregateQueryBuilder(this.tableName);
        return new ConnectedAggregateBuilder_1.ConnectedAggregateBuilder(builder, this.relq, this.tableName);
    }
    async findById(id) {
        const pkColumn = this.getPrimaryKeyColumn();
        const dbColumn = this.relq[methods_1.INTERNAL].transformToDbColumns(this.tableName, { [pkColumn]: id });
        const dbColName = Object.keys(dbColumn)[0];
        const builder = new select_builder_1.SelectBuilder(this.tableName, ['*']);
        builder.where(q => q.equal(dbColName, id));
        builder.limit(1);
        const sql = builder.toString();
        const result = await this.relq[methods_1.INTERNAL].executeSelectOne(sql, this.tableName);
        return result.data;
    }
    async findOne(filter) {
        const builder = new select_builder_1.SelectBuilder(this.tableName, ['*']);
        const dbFilter = this.relq[methods_1.INTERNAL].transformToDbColumns(this.tableName, filter);
        builder.where(q => {
            for (const [col, val] of Object.entries(dbFilter)) {
                q.equal(col, val);
            }
            return q;
        });
        builder.limit(1);
        const sql = builder.toString();
        const result = await this.relq[methods_1.INTERNAL].executeSelectOne(sql, this.tableName);
        return result.data;
    }
    async findMany(filter) {
        const builder = new select_builder_1.SelectBuilder(this.tableName, ['*']);
        const dbFilter = this.relq[methods_1.INTERNAL].transformToDbColumns(this.tableName, filter);
        builder.where(q => {
            for (const [col, val] of Object.entries(dbFilter)) {
                q.equal(col, val);
            }
            return q;
        });
        const sql = builder.toString();
        const result = await this.relq[methods_1.INTERNAL].executeSelect(sql, this.tableName);
        return result.data;
    }
    async exists(filter) {
        const builder = new count_builder_1.CountBuilder(this.tableName);
        const dbFilter = this.relq[methods_1.INTERNAL].transformToDbColumns(this.tableName, filter);
        builder.where(q => {
            for (const [col, val] of Object.entries(dbFilter)) {
                q.equal(col, val);
            }
            return q;
        });
        const sql = builder.toString();
        const result = await this.relq[methods_1.INTERNAL].executeCount(sql);
        return result.count > 0;
    }
    async upsert(options) {
        const dbCreate = this.relq[methods_1.INTERNAL].transformToDbColumns(this.tableName, options.create);
        const dbUpdate = this.relq[methods_1.INTERNAL].transformToDbColumns(this.tableName, options.update);
        const dbWhere = this.relq[methods_1.INTERNAL].transformToDbColumns(this.tableName, options.where);
        const conflictColumn = Object.keys(dbWhere)[0];
        const builder = new insert_builder_1.InsertBuilder(this.tableName, dbCreate);
        builder.onConflict(conflictColumn, cb => cb.doUpdate(dbUpdate));
        builder.returning(['*']);
        const sql = builder.toString();
        const result = await this.relq[methods_1.INTERNAL].executeQuery(sql);
        const transformed = this.relq[methods_1.INTERNAL].transformResultsFromDb(this.tableName, result.result.rows);
        return transformed[0];
    }
    async insertMany(rows) {
        if (rows.length === 0)
            return [];
        const firstDbRow = this.relq[methods_1.INTERNAL].transformToDbColumns(this.tableName, rows[0]);
        const builder = new insert_builder_1.InsertBuilder(this.tableName, firstDbRow);
        for (let i = 1; i < rows.length; i++) {
            const dbRow = this.relq[methods_1.INTERNAL].transformToDbColumns(this.tableName, rows[i]);
            builder.addRow(dbRow);
        }
        builder.returning(['*']);
        const sql = builder.toString();
        const result = await this.relq[methods_1.INTERNAL].executeQuery(sql);
        return this.relq[methods_1.INTERNAL].transformResultsFromDb(this.tableName, result.result.rows);
    }
    paginate(options = {}) {
        return new PaginateBuilder_1.PaginateBuilder(this.relq, this.tableName, options.columns, options.where, options.orderBy);
    }
    async softDelete(filter) {
        const dbFilter = this.relq[methods_1.INTERNAL].transformToDbColumns(this.tableName, filter);
        const builder = new update_builder_1.UpdateBuilder(this.tableName, { deleted_at: new Date() });
        builder.where(q => {
            for (const [col, val] of Object.entries(dbFilter)) {
                q.equal(col, val);
            }
            return q;
        });
        builder.returning(['*']);
        const sql = builder.toString();
        const result = await this.relq[methods_1.INTERNAL].executeQuery(sql);
        if (result.result.rows.length === 0)
            return null;
        const transformed = this.relq[methods_1.INTERNAL].transformResultsFromDb(this.tableName, result.result.rows);
        return transformed[0];
    }
    async restore(filter) {
        const dbFilter = this.relq[methods_1.INTERNAL].transformToDbColumns(this.tableName, filter);
        const builder = new update_builder_1.UpdateBuilder(this.tableName, { deleted_at: null });
        builder.where(q => {
            for (const [col, val] of Object.entries(dbFilter)) {
                q.equal(col, val);
            }
            return q;
        });
        builder.returning(['*']);
        const sql = builder.toString();
        const result = await this.relq[methods_1.INTERNAL].executeQuery(sql);
        if (result.result.rows.length === 0)
            return null;
        const transformed = this.relq[methods_1.INTERNAL].transformResultsFromDb(this.tableName, result.result.rows);
        return transformed[0];
    }
    getPrimaryKeyColumn() {
        const schema = this.relq.schema;
        if (schema && schema[this.tableName]) {
            const tableSchema = schema[this.tableName];
            for (const [colName, colDef] of Object.entries(tableSchema)) {
                if (colDef && typeof colDef === 'object' &&
                    ('$primaryKey' in colDef ||
                        colDef.config?.$primaryKey === true)) {
                    return colName;
                }
            }
        }
        return 'id';
    }
}
exports.ConnectedQueryBuilder = ConnectedQueryBuilder;
