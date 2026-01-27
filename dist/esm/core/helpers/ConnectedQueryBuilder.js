import { CountBuilder } from "../../count/count-builder.js";
import { DeleteBuilder } from "../../delete/delete-builder.js";
import { InsertBuilder } from "../../insert/insert-builder.js";
import { AggregateQueryBuilder } from "../../select/aggregate-builder.js";
import { SelectBuilder } from "../../select/select-builder.js";
import { UpdateBuilder } from "../../update/update-builder.js";
import { ConnectedAggregateBuilder } from "./ConnectedAggregateBuilder.js";
import { ConnectedCountBuilder } from "./ConnectedCountBuilder.js";
import { ConnectedDeleteBuilder } from "./ConnectedDeleteBuilder.js";
import { ConnectedInsertBuilder } from "./ConnectedInsertBuilder.js";
import { ConnectedSelectBuilder } from "./ConnectedSelectBuilder.js";
import { ConnectedUpdateBuilder } from "./ConnectedUpdateBuilder.js";
import { INTERNAL } from "./methods.js";
import { PaginateBuilder } from "./PaginateBuilder.js";
export class ConnectedQueryBuilder {
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
        const pkColumn = this.getPrimaryKeyColumn();
        const dbColumn = this.relq[INTERNAL].transformToDbColumns(this.tableName, { [pkColumn]: id });
        const dbColName = Object.keys(dbColumn)[0];
        const builder = new SelectBuilder(this.tableName, ['*']);
        builder.where(q => q.equal(dbColName, id));
        builder.limit(1);
        const sql = builder.toString();
        const result = await this.relq[INTERNAL].executeSelectOne(sql, this.tableName);
        return result.data;
    }
    async findOne(filter) {
        const builder = new SelectBuilder(this.tableName, ['*']);
        const dbFilter = this.relq[INTERNAL].transformToDbColumns(this.tableName, filter);
        builder.where(q => {
            for (const [col, val] of Object.entries(dbFilter)) {
                q.equal(col, val);
            }
            return q;
        });
        builder.limit(1);
        const sql = builder.toString();
        const result = await this.relq[INTERNAL].executeSelectOne(sql, this.tableName);
        return result.data;
    }
    async findMany(filter) {
        const builder = new SelectBuilder(this.tableName, ['*']);
        const dbFilter = this.relq[INTERNAL].transformToDbColumns(this.tableName, filter);
        builder.where(q => {
            for (const [col, val] of Object.entries(dbFilter)) {
                q.equal(col, val);
            }
            return q;
        });
        const sql = builder.toString();
        const result = await this.relq[INTERNAL].executeSelect(sql, this.tableName);
        return result.data;
    }
    async exists(filter) {
        const builder = new CountBuilder(this.tableName);
        const dbFilter = this.relq[INTERNAL].transformToDbColumns(this.tableName, filter);
        builder.where(q => {
            for (const [col, val] of Object.entries(dbFilter)) {
                q.equal(col, val);
            }
            return q;
        });
        const sql = builder.toString();
        const result = await this.relq[INTERNAL].executeCount(sql);
        return result.count > 0;
    }
    async upsert(options) {
        const dbCreate = this.relq[INTERNAL].transformToDbColumns(this.tableName, options.create);
        const dbUpdate = this.relq[INTERNAL].transformToDbColumns(this.tableName, options.update);
        const dbWhere = this.relq[INTERNAL].transformToDbColumns(this.tableName, options.where);
        const conflictColumn = Object.keys(dbWhere)[0];
        const builder = new InsertBuilder(this.tableName, dbCreate);
        builder.onConflict(conflictColumn, cb => cb.doUpdate(dbUpdate));
        builder.returning(['*']);
        const sql = builder.toString();
        const result = await this.relq[INTERNAL].executeQuery(sql);
        const transformed = this.relq[INTERNAL].transformResultsFromDb(this.tableName, result.result.rows);
        return transformed[0];
    }
    async insertMany(rows) {
        if (rows.length === 0)
            return [];
        const firstDbRow = this.relq[INTERNAL].transformToDbColumns(this.tableName, rows[0]);
        const builder = new InsertBuilder(this.tableName, firstDbRow);
        for (let i = 1; i < rows.length; i++) {
            const dbRow = this.relq[INTERNAL].transformToDbColumns(this.tableName, rows[i]);
            builder.addRow(dbRow);
        }
        builder.returning(['*']);
        const sql = builder.toString();
        const result = await this.relq[INTERNAL].executeQuery(sql);
        return this.relq[INTERNAL].transformResultsFromDb(this.tableName, result.result.rows);
    }
    paginate(options = {}) {
        return new PaginateBuilder(this.relq, this.tableName, options.columns, options.where, options.orderBy);
    }
    async softDelete(filter) {
        const dbFilter = this.relq[INTERNAL].transformToDbColumns(this.tableName, filter);
        const builder = new UpdateBuilder(this.tableName, { deleted_at: new Date() });
        builder.where(q => {
            for (const [col, val] of Object.entries(dbFilter)) {
                q.equal(col, val);
            }
            return q;
        });
        builder.returning(['*']);
        const sql = builder.toString();
        const result = await this.relq[INTERNAL].executeQuery(sql);
        if (result.result.rows.length === 0)
            return null;
        const transformed = this.relq[INTERNAL].transformResultsFromDb(this.tableName, result.result.rows);
        return transformed[0];
    }
    async restore(filter) {
        const dbFilter = this.relq[INTERNAL].transformToDbColumns(this.tableName, filter);
        const builder = new UpdateBuilder(this.tableName, { deleted_at: null });
        builder.where(q => {
            for (const [col, val] of Object.entries(dbFilter)) {
                q.equal(col, val);
            }
            return q;
        });
        builder.returning(['*']);
        const sql = builder.toString();
        const result = await this.relq[INTERNAL].executeQuery(sql);
        if (result.result.rows.length === 0)
            return null;
        const transformed = this.relq[INTERNAL].transformResultsFromDb(this.tableName, result.result.rows);
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
