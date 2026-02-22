import { CountBuilder } from "../../count/count-builder.js";
import { DeleteBuilder } from "../../delete/delete-builder.js";
import { InsertBuilder } from "../../insert/insert-builder.js";
import { InsertFromSelectBuilder } from "../../insert/insert-from-select-builder.js";
import { AggregateQueryBuilder } from "../../select/aggregate-builder.js";
import { SelectBuilder } from "../../select/select-builder.js";
import { UpdateBuilder } from "../../update/update-builder.js";
import { ConnectedAggregateBuilder } from "./ConnectedAggregateBuilder.js";
import { ConnectedCountBuilder } from "./ConnectedCountBuilder.js";
import { ConnectedDeleteBuilder } from "./ConnectedDeleteBuilder.js";
import { ConnectedInsertBuilder } from "./ConnectedInsertBuilder.js";
import { ConnectedInsertFromSelectBuilder } from "./ConnectedInsertFromSelectBuilder.js";
import { ConnectedSelectBuilder } from "./ConnectedSelectBuilder.js";
import { ConnectedUpdateBuilder } from "./ConnectedUpdateBuilder.js";
import { INTERNAL } from "./methods.js";
import { PaginateBuilder } from "./PaginateBuilder.js";
import { createTableAccessor } from "../shared/table-accessor.js";
import { executeFindById, executeFindOne, executeFindMany, executeExists, executeUpsert, executeCreateWith, executeSoftDelete, executeRestore, getPrimaryKeyColumn } from "./query-convenience.js";
export class ConnectedQueryBuilder {
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
        if (columns && this.relq[INTERNAL].hasColumnMapping()) {
            if (Array.isArray(columns)) {
                dbColumns = columns.map(col => {
                    if (Array.isArray(col)) {
                        const transformed = this.relq[INTERNAL].transformToDbColumns(this.tableName, { [col[0]]: true });
                        return [Object.keys(transformed)[0], col[1]];
                    }
                    else {
                        const transformed = this.relq[INTERNAL].transformToDbColumns(this.tableName, { [col]: true });
                        return Object.keys(transformed)[0];
                    }
                });
            }
            else {
                const transformed = this.relq[INTERNAL].transformToDbColumns(this.tableName, { [columns]: true });
                dbColumns = Object.keys(transformed)[0];
            }
        }
        const builder = new SelectBuilder(this.tableName, dbColumns);
        return new ConnectedSelectBuilder(builder, this.relq, this.tableName, columns, this.schemaKey);
    }
    insert(data) {
        const builder = new InsertBuilder(this.tableName, data);
        return new ConnectedInsertBuilder(builder, this.relq, this.tableName, this.schemaKey);
    }
    update(data) {
        const builder = new UpdateBuilder(this.tableName, data);
        return new ConnectedUpdateBuilder(builder, this.relq, this.tableName, this.schemaKey);
    }
    delete() {
        const builder = new DeleteBuilder(this.tableName);
        return new ConnectedDeleteBuilder(builder, this.relq, this.tableName, this.schemaKey);
    }
    count() {
        const builder = new CountBuilder(this.tableName);
        return new ConnectedCountBuilder(builder, this.relq, this.tableName);
    }
    aggregate() {
        const builder = new AggregateQueryBuilder(this.tableName);
        return new ConnectedAggregateBuilder(builder, this.relq, this.tableName);
    }
    async findById(id) {
        return executeFindById(this.ctx, id, () => getPrimaryKeyColumn(this.relq, this.tableName));
    }
    async findOne(filter) {
        return executeFindOne(this.ctx, filter);
    }
    async findMany(filter) {
        return executeFindMany(this.ctx, filter);
    }
    async exists(filter) {
        return executeExists(this.ctx, filter);
    }
    async upsert(options) {
        return executeUpsert(this.ctx, {
            where: options.where,
            create: options.create,
            update: options.update,
        });
    }
    insertMany(rows) {
        if (rows.length === 0) {
            const builder = new InsertBuilder(this.tableName, {});
            builder.clear();
            return new ConnectedInsertBuilder(builder, this.relq, this.tableName, this.schemaKey);
        }
        const builder = new InsertBuilder(this.tableName, rows[0]);
        for (let i = 1; i < rows.length; i++) {
            builder.addRow(rows[i]);
        }
        return new ConnectedInsertBuilder(builder, this.relq, this.tableName, this.schemaKey);
    }
    insertFrom(columns, selectCallback) {
        const tables = createTableAccessor(this.relq, this.relq.schema);
        const selectQuery = selectCallback(tables);
        const builder = new InsertFromSelectBuilder(this.tableName, columns, selectQuery.toString());
        return new ConnectedInsertFromSelectBuilder(builder, this.relq, this.tableName, this.schemaKey);
    }
    paginate(options = {}) {
        return new PaginateBuilder(this.relq, this.tableName, options.columns, options.where, options.orderBy);
    }
    async createWith(options) {
        return executeCreateWith(this.ctx, options.data, options.with);
    }
    async softDelete(filter) {
        return executeSoftDelete(this.ctx, filter);
    }
    async restore(filter) {
        return executeRestore(this.ctx, filter);
    }
}
