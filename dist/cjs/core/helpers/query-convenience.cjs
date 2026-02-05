"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeFindById = executeFindById;
exports.executeFindOne = executeFindOne;
exports.executeFindMany = executeFindMany;
exports.executeExists = executeExists;
exports.executeUpsert = executeUpsert;
exports.executeInsertMany = executeInsertMany;
exports.executeSoftDelete = executeSoftDelete;
exports.executeRestore = executeRestore;
exports.getPrimaryKeyColumn = getPrimaryKeyColumn;
const count_builder_1 = require("../../count/count-builder.cjs");
const insert_builder_1 = require("../../insert/insert-builder.cjs");
const select_builder_1 = require("../../select/select-builder.cjs");
const update_builder_1 = require("../../update/update-builder.cjs");
const methods_1 = require("./methods.cjs");
async function executeFindById(ctx, id, getPrimaryKeyColumn) {
    const pkColumn = getPrimaryKeyColumn();
    const dbColumn = ctx.relq[methods_1.INTERNAL].transformToDbColumns(ctx.tableName, { [pkColumn]: id });
    const dbColName = Object.keys(dbColumn)[0];
    const builder = new select_builder_1.SelectBuilder(ctx.tableName, ['*']);
    builder.where(q => q.equal(dbColName, id));
    builder.limit(1);
    const sql = builder.toString();
    const result = await ctx.relq[methods_1.INTERNAL].executeSelectOne(sql, ctx.tableName);
    return result.data;
}
async function executeFindOne(ctx, filter) {
    const builder = new select_builder_1.SelectBuilder(ctx.tableName, ['*']);
    const dbFilter = ctx.relq[methods_1.INTERNAL].transformToDbColumns(ctx.tableName, filter);
    builder.where(q => {
        for (const [col, val] of Object.entries(dbFilter)) {
            q.equal(col, val);
        }
        return q;
    });
    builder.limit(1);
    const sql = builder.toString();
    const result = await ctx.relq[methods_1.INTERNAL].executeSelectOne(sql, ctx.tableName);
    return result.data;
}
async function executeFindMany(ctx, filter) {
    const builder = new select_builder_1.SelectBuilder(ctx.tableName, ['*']);
    const dbFilter = ctx.relq[methods_1.INTERNAL].transformToDbColumns(ctx.tableName, filter);
    builder.where(q => {
        for (const [col, val] of Object.entries(dbFilter)) {
            q.equal(col, val);
        }
        return q;
    });
    const sql = builder.toString();
    const result = await ctx.relq[methods_1.INTERNAL].executeSelect(sql, ctx.tableName);
    return result.data;
}
async function executeExists(ctx, filter) {
    const builder = new count_builder_1.CountBuilder(ctx.tableName);
    const dbFilter = ctx.relq[methods_1.INTERNAL].transformToDbColumns(ctx.tableName, filter);
    builder.where(q => {
        for (const [col, val] of Object.entries(dbFilter)) {
            q.equal(col, val);
        }
        return q;
    });
    const sql = builder.toString();
    const result = await ctx.relq[methods_1.INTERNAL].executeCount(sql);
    return result.count > 0;
}
async function executeUpsert(ctx, options) {
    const dbCreate = ctx.relq[methods_1.INTERNAL].transformToDbColumns(ctx.tableName, options.create);
    const dbUpdate = ctx.relq[methods_1.INTERNAL].transformToDbColumns(ctx.tableName, options.update);
    const dbWhere = ctx.relq[methods_1.INTERNAL].transformToDbColumns(ctx.tableName, options.where);
    const conflictColumn = Object.keys(dbWhere)[0];
    const builder = new insert_builder_1.InsertBuilder(ctx.tableName, dbCreate);
    builder._onConflict(conflictColumn, cb => cb.doUpdate(dbUpdate));
    builder.returning(['*']);
    const sql = builder.toString();
    const result = await ctx.relq[methods_1.INTERNAL].executeQuery(sql);
    const transformed = ctx.relq[methods_1.INTERNAL].transformResultsFromDb(ctx.tableName, result.result.rows);
    return transformed[0];
}
async function executeInsertMany(ctx, rows) {
    if (rows.length === 0)
        return [];
    const firstDbRow = ctx.relq[methods_1.INTERNAL].transformToDbColumns(ctx.tableName, rows[0]);
    const builder = new insert_builder_1.InsertBuilder(ctx.tableName, firstDbRow);
    for (let i = 1; i < rows.length; i++) {
        const dbRow = ctx.relq[methods_1.INTERNAL].transformToDbColumns(ctx.tableName, rows[i]);
        builder.addRow(dbRow);
    }
    builder.returning(['*']);
    const sql = builder.toString();
    const result = await ctx.relq[methods_1.INTERNAL].executeQuery(sql);
    return ctx.relq[methods_1.INTERNAL].transformResultsFromDb(ctx.tableName, result.result.rows);
}
async function executeSoftDelete(ctx, filter) {
    const dbFilter = ctx.relq[methods_1.INTERNAL].transformToDbColumns(ctx.tableName, filter);
    const builder = new update_builder_1.UpdateBuilder(ctx.tableName, { deleted_at: new Date() });
    builder.where(q => {
        for (const [col, val] of Object.entries(dbFilter)) {
            q.equal(col, val);
        }
        return q;
    });
    builder.returning(['*']);
    const sql = builder.toString();
    const result = await ctx.relq[methods_1.INTERNAL].executeQuery(sql);
    if (result.result.rows.length === 0)
        return null;
    const transformed = ctx.relq[methods_1.INTERNAL].transformResultsFromDb(ctx.tableName, result.result.rows);
    return transformed[0];
}
async function executeRestore(ctx, filter) {
    const dbFilter = ctx.relq[methods_1.INTERNAL].transformToDbColumns(ctx.tableName, filter);
    const builder = new update_builder_1.UpdateBuilder(ctx.tableName, { deleted_at: null });
    builder.where(q => {
        for (const [col, val] of Object.entries(dbFilter)) {
            q.equal(col, val);
        }
        return q;
    });
    builder.returning(['*']);
    const sql = builder.toString();
    const result = await ctx.relq[methods_1.INTERNAL].executeQuery(sql);
    if (result.result.rows.length === 0)
        return null;
    const transformed = ctx.relq[methods_1.INTERNAL].transformResultsFromDb(ctx.tableName, result.result.rows);
    return transformed[0];
}
function getPrimaryKeyColumn(relq, tableName) {
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
