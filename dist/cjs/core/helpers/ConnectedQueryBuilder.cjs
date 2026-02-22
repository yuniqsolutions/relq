"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectedQueryBuilder = void 0;
const count_builder_1 = require("../../count/count-builder.cjs");
const delete_builder_1 = require("../../delete/delete-builder.cjs");
const insert_builder_1 = require("../../insert/insert-builder.cjs");
const insert_from_select_builder_1 = require("../../insert/insert-from-select-builder.cjs");
const aggregate_builder_1 = require("../../select/aggregate-builder.cjs");
const select_builder_1 = require("../../select/select-builder.cjs");
const update_builder_1 = require("../../update/update-builder.cjs");
const ConnectedAggregateBuilder_1 = require("./ConnectedAggregateBuilder.cjs");
const ConnectedCountBuilder_1 = require("./ConnectedCountBuilder.cjs");
const ConnectedDeleteBuilder_1 = require("./ConnectedDeleteBuilder.cjs");
const ConnectedInsertBuilder_1 = require("./ConnectedInsertBuilder.cjs");
const ConnectedInsertFromSelectBuilder_1 = require("./ConnectedInsertFromSelectBuilder.cjs");
const ConnectedSelectBuilder_1 = require("./ConnectedSelectBuilder.cjs");
const ConnectedUpdateBuilder_1 = require("./ConnectedUpdateBuilder.cjs");
const methods_1 = require("./methods.cjs");
const PaginateBuilder_1 = require("./PaginateBuilder.cjs");
const table_accessor_1 = require("../shared/table-accessor.cjs");
const query_convenience_1 = require("./query-convenience.cjs");
class ConnectedQueryBuilder {
    tableName;
    relq;
    schemaKey;
    constructor(tableName, relq, schemaKey) {
        this.tableName = tableName;
        this.relq = relq;
        this.schemaKey = schemaKey;
    }
    get ctx() {
        return { relq: this.relq, tableName: this.tableName };
    }
    select(...args) {
        let columns;
        if (args.length === 0) {
            columns = undefined;
        }
        else if (args.length === 1) {
            columns = args[0];
        }
        else {
            columns = args;
        }
        if (columns !== undefined) {
            if (Array.isArray(columns)) {
                if (columns.length === 0) {
                    throw new Error('select() requires at least one column. Use .select() without arguments for SELECT *');
                }
            }
            else if (typeof columns === 'string') {
                if (columns === '' || columns === '*') {
                    throw new Error(`Invalid column name: "${columns}". Use .select() without arguments for SELECT *, or specify column names`);
                }
            }
        }
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
        return (0, query_convenience_1.executeFindById)(this.ctx, id, () => (0, query_convenience_1.getPrimaryKeyColumn)(this.relq, this.tableName));
    }
    async findOne(filter) {
        return (0, query_convenience_1.executeFindOne)(this.ctx, filter);
    }
    async findMany(filter) {
        return (0, query_convenience_1.executeFindMany)(this.ctx, filter);
    }
    async exists(filter) {
        return (0, query_convenience_1.executeExists)(this.ctx, filter);
    }
    async upsert(options) {
        return (0, query_convenience_1.executeUpsert)(this.ctx, {
            where: options.where,
            create: options.create,
            update: options.update,
        });
    }
    insertMany(rows) {
        if (rows.length === 0) {
            const builder = new insert_builder_1.InsertBuilder(this.tableName, {});
            builder.clear();
            return new ConnectedInsertBuilder_1.ConnectedInsertBuilder(builder, this.relq, this.tableName, this.schemaKey);
        }
        const builder = new insert_builder_1.InsertBuilder(this.tableName, rows[0]);
        for (let i = 1; i < rows.length; i++) {
            builder.addRow(rows[i]);
        }
        return new ConnectedInsertBuilder_1.ConnectedInsertBuilder(builder, this.relq, this.tableName, this.schemaKey);
    }
    insertFrom(columns, selectCallback) {
        const tables = (0, table_accessor_1.createTableAccessor)(this.relq, this.relq.schema);
        const selectQuery = selectCallback(tables);
        const builder = new insert_from_select_builder_1.InsertFromSelectBuilder(this.tableName, columns, selectQuery.toString());
        return new ConnectedInsertFromSelectBuilder_1.ConnectedInsertFromSelectBuilder(builder, this.relq, this.tableName, this.schemaKey);
    }
    paginate(options = {}) {
        return new PaginateBuilder_1.PaginateBuilder(this.relq, this.tableName, options.columns, options.where, options.orderBy);
    }
    async createWith(options) {
        return (0, query_convenience_1.executeCreateWith)(this.ctx, options.data, options.with);
    }
    async softDelete(filter) {
        return (0, query_convenience_1.executeSoftDelete)(this.ctx, filter);
    }
    async restore(filter) {
        return (0, query_convenience_1.executeRestore)(this.ctx, filter);
    }
}
exports.ConnectedQueryBuilder = ConnectedQueryBuilder;
