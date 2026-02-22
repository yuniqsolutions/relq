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
export async function executeCreateWith(ctx, parentData, related) {
    const internal = ctx.relq[INTERNAL];
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
        const parentBuilder = new InsertBuilder(ctx.tableName, dbParent);
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
            const { resolveForeignKey } = await import("../../utils/fk-resolver.js");
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
            const childBuilder = new InsertBuilder(childTableName, dbFirst);
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
