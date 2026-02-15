import { CountBuilder } from "../../count/count-builder.js";
import { InsertBuilder } from "../../insert/insert-builder.js";
import { SelectBuilder } from "../../select/select-builder.js";
import { UpdateBuilder } from "../../update/update-builder.js";
import { INTERNAL } from "./methods.js";
export async function executeFindById(ctx, id, getPrimaryKeyColumn) {
    const pkColumn = getPrimaryKeyColumn();
    const dbColumn = ctx.relq[INTERNAL].transformToDbColumns(ctx.tableName, { [pkColumn]: id });
    const dbColName = Object.keys(dbColumn)[0];
    const builder = new SelectBuilder(ctx.tableName, ['*']);
    builder.where(q => q.equal(dbColName, id));
    builder.limit(1);
    const sql = builder.toString();
    const result = await ctx.relq[INTERNAL].executeSelectOne(sql, ctx.tableName);
    return result.data;
}
export async function executeFindOne(ctx, filter) {
    const builder = new SelectBuilder(ctx.tableName, ['*']);
    const dbFilter = ctx.relq[INTERNAL].transformToDbColumns(ctx.tableName, filter);
    builder.where(q => {
        for (const [col, val] of Object.entries(dbFilter)) {
            q.equal(col, val);
        }
        return q;
    });
    builder.limit(1);
    const sql = builder.toString();
    const result = await ctx.relq[INTERNAL].executeSelectOne(sql, ctx.tableName);
    return result.data;
}
export async function executeFindMany(ctx, filter) {
    const builder = new SelectBuilder(ctx.tableName, ['*']);
    const dbFilter = ctx.relq[INTERNAL].transformToDbColumns(ctx.tableName, filter);
    builder.where(q => {
        for (const [col, val] of Object.entries(dbFilter)) {
            q.equal(col, val);
        }
        return q;
    });
    const sql = builder.toString();
    const result = await ctx.relq[INTERNAL].executeSelect(sql, ctx.tableName);
    return result.data;
}
export async function executeExists(ctx, filter) {
    const builder = new CountBuilder(ctx.tableName);
    const dbFilter = ctx.relq[INTERNAL].transformToDbColumns(ctx.tableName, filter);
    builder.where(q => {
        for (const [col, val] of Object.entries(dbFilter)) {
            q.equal(col, val);
        }
        return q;
    });
    const sql = builder.toString();
    const result = await ctx.relq[INTERNAL].executeCount(sql);
    return result.count > 0;
}
export async function executeUpsert(ctx, options) {
    const dbCreate = ctx.relq[INTERNAL].transformToDbColumns(ctx.tableName, options.create);
    const dbUpdate = ctx.relq[INTERNAL].transformToDbColumns(ctx.tableName, options.update);
    const dbWhere = ctx.relq[INTERNAL].transformToDbColumns(ctx.tableName, options.where);
    const conflictColumn = Object.keys(dbWhere)[0];
    const builder = new InsertBuilder(ctx.tableName, dbCreate);
    builder._onConflict(conflictColumn, cb => cb.doUpdate(dbUpdate));
    builder.returning(['*']);
    const sql = builder.toString();
    const result = await ctx.relq[INTERNAL].executeQuery(sql);
    const transformed = ctx.relq[INTERNAL].transformResultsFromDb(ctx.tableName, result.result.rows);
    return transformed[0];
}
export async function executeInsertMany(ctx, rows) {
    if (rows.length === 0)
        return [];
    const firstDbRow = ctx.relq[INTERNAL].transformToDbColumns(ctx.tableName, rows[0]);
    const builder = new InsertBuilder(ctx.tableName, firstDbRow);
    for (let i = 1; i < rows.length; i++) {
        const dbRow = ctx.relq[INTERNAL].transformToDbColumns(ctx.tableName, rows[i]);
        builder.addRow(dbRow);
    }
    builder.returning(['*']);
    const sql = builder.toString();
    const result = await ctx.relq[INTERNAL].executeQuery(sql);
    return ctx.relq[INTERNAL].transformResultsFromDb(ctx.tableName, result.result.rows);
}
export async function executeSoftDelete(ctx, filter) {
    const dbFilter = ctx.relq[INTERNAL].transformToDbColumns(ctx.tableName, filter);
    const builder = new UpdateBuilder(ctx.tableName, { deleted_at: new Date() });
    builder.where(q => {
        for (const [col, val] of Object.entries(dbFilter)) {
            q.equal(col, val);
        }
        return q;
    });
    builder.returning(['*']);
    const sql = builder.toString();
    const result = await ctx.relq[INTERNAL].executeQuery(sql);
    if (result.result.rows.length === 0)
        return null;
    const transformed = ctx.relq[INTERNAL].transformResultsFromDb(ctx.tableName, result.result.rows);
    return transformed[0];
}
export async function executeRestore(ctx, filter) {
    const dbFilter = ctx.relq[INTERNAL].transformToDbColumns(ctx.tableName, filter);
    const builder = new UpdateBuilder(ctx.tableName, { deleted_at: null });
    builder.where(q => {
        for (const [col, val] of Object.entries(dbFilter)) {
            q.equal(col, val);
        }
        return q;
    });
    builder.returning(['*']);
    const sql = builder.toString();
    const result = await ctx.relq[INTERNAL].executeQuery(sql);
    if (result.result.rows.length === 0)
        return null;
    const transformed = ctx.relq[INTERNAL].transformResultsFromDb(ctx.tableName, result.result.rows);
    return transformed[0];
}
export function getPrimaryKeyColumn(relq, tableName) {
    const schema = relq.schema;
    if (schema && schema[tableName]) {
        const tableSchema = schema[tableName];
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
