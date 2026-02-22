"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeFindById = executeFindById;
exports.executeFindOne = executeFindOne;
exports.executeFindMany = executeFindMany;
exports.executeExists = executeExists;
exports.executeUpsert = executeUpsert;
exports.executeSoftDelete = executeSoftDelete;
exports.executeRestore = executeRestore;
exports.executeCreateWith = executeCreateWith;
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
async function executeCreateWith(ctx, parentData, related) {
    const internal = ctx.relq[methods_1.INTERNAL];
    const schema = internal.getSchema();
    const relations = internal.getRelations();
    if (!schema || !relations) {
        throw new Error('Cannot use createWith() without schema and relations config. ' +
            'Use separate insert calls with a transaction instead.');
    }
    const parentSchemaKey = findSchemaKeyByTableName(schema, ctx.tableName) || ctx.tableName;
    try {
        await internal.executeRun('BEGIN');
        const dbParent = internal.transformToDbColumns(ctx.tableName, parentData);
        const parentBuilder = new insert_builder_1.InsertBuilder(ctx.tableName, dbParent);
        parentBuilder.returning(['*']);
        const parentSQL = parentBuilder.toString();
        const parentResult = await internal.executeQuery(parentSQL);
        if (!parentResult.result.rows || parentResult.result.rows.length === 0) {
            throw new Error('Parent insert returned no rows');
        }
        const parentRow = parentResult.result.rows[0];
        for (const [relationKey, childData] of Object.entries(related)) {
            const childTableDef = schema[relationKey];
            if (!childTableDef) {
                throw new Error(`Unknown table "${relationKey}" in createWith(). Check your schema.`);
            }
            const childTableName = childTableDef.$name || relationKey;
            const { resolveForeignKey } = await Promise.resolve().then(() => __importStar(require("../../utils/fk-resolver.cjs")));
            const fk = resolveForeignKey(relations, schema, parentSchemaKey, relationKey);
            if (!fk) {
                throw new Error(`No FK relationship between "${parentSchemaKey}" and "${relationKey}". ` +
                    'Define the relationship in your relations config.');
            }
            let fkColumn;
            let fkValue;
            if (fk.direction === 'reverse') {
                fkColumn = fk.toColumn;
                fkValue = parentRow[fk.fromColumn];
            }
            else {
                fkColumn = fk.fromColumn;
                fkValue = parentRow[fk.toColumn];
            }
            const rows = Array.isArray(childData) ? childData : [childData];
            if (rows.length === 0)
                continue;
            const firstRow = { ...rows[0], [fkColumn]: fkValue };
            const dbFirst = internal.transformToDbColumns(childTableName, firstRow);
            const childBuilder = new insert_builder_1.InsertBuilder(childTableName, dbFirst);
            for (let i = 1; i < rows.length; i++) {
                const row = { ...rows[i], [fkColumn]: fkValue };
                const dbRow = internal.transformToDbColumns(childTableName, row);
                childBuilder.addRow(dbRow);
            }
            const childSQL = childBuilder.toString();
            await internal.executeQuery(childSQL);
        }
        await internal.executeRun('COMMIT');
        const transformed = internal.transformResultsFromDb(ctx.tableName, [parentRow]);
        return transformed[0];
    }
    catch (error) {
        try {
            await internal.executeRun('ROLLBACK');
        }
        catch {
        }
        throw error;
    }
}
function findSchemaKeyByTableName(schema, tableName) {
    for (const [key, def] of Object.entries(schema)) {
        if (def?.$name === tableName || key === tableName) {
            return key;
        }
    }
    return null;
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
