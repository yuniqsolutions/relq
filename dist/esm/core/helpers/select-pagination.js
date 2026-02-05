import Cursor from "pg-cursor";
import { RelqConfigError, RelqQueryError } from "../../errors/relq-errors.js";
import { randomLimit } from "../../types/pagination-types.js";
import { INTERNAL } from "./methods.js";
export async function executeCursorEach(ctx, callback, options = {}) {
    const batchSize = options.batchSize ?? 100;
    const sql = ctx.builder.toString();
    const relqAny = ctx.relq;
    if (relqAny.usePooling === false || (!relqAny.pool && relqAny.client)) {
        throw new RelqConfigError('each() requires pooled connections', { field: 'pooling', value: 'false (must be true)' });
    }
    const { client, release } = await ctx.relq[INTERNAL].getClientForCursor();
    let cursor = null;
    try {
        await client.query('BEGIN');
        cursor = client.query(new Cursor(sql));
        let rows;
        let index = 0;
        outer: do {
            rows = await new Promise((resolve, reject) => {
                cursor.read(batchSize, (err, result) => {
                    if (err)
                        reject(err);
                    else
                        resolve(result);
                });
            });
            const internal = ctx.relq[INTERNAL];
            const transformedRows = ctx.tableName && internal.hasColumnMapping()
                ? internal.transformResultsFromDb(ctx.tableName, rows)
                : rows;
            for (const row of transformedRows) {
                const result = await callback(row, index++);
                if (result === false) {
                    break outer;
                }
            }
        } while (rows.length > 0);
        await closeCursor(cursor);
        cursor = null;
        await client.query('COMMIT');
    }
    catch (error) {
        if (cursor) {
            try {
                await closeCursor(cursor);
            }
            catch {
            }
        }
        try {
            await client.query('ROLLBACK');
        }
        catch {
        }
        throw error;
    }
    finally {
        release();
    }
}
export async function executePagination(ctx, options, recurse) {
    if (!options.mode || !['paging', 'offset'].includes(options.mode)) {
        throw new RelqQueryError('pagination() requires "mode" to be one of: \'paging\', \'offset\'', { hint: 'Set mode: "paging" or mode: "offset"' });
    }
    const orderByArr = options.orderBy
        ? (Array.isArray(options.orderBy[0]) ? options.orderBy : [options.orderBy])
        : [];
    for (const [column, direction] of orderByArr) {
        const dbColumn = ctx.relq[INTERNAL].hasColumnMapping()
            ? Object.keys(ctx.relq[INTERNAL].transformToDbColumns(ctx.tableName, { [column]: true }))[0]
            : column;
        ctx.builder.orderBy(dbColumn, direction);
    }
    const isPaging = options.mode === 'paging';
    const shouldCount = options.count ?? isPaging;
    let total = 0;
    if (shouldCount) {
        const countSql = ctx.builder.toCountSQL();
        const countResult = await ctx.relq[INTERNAL].executeCount(countSql);
        total = countResult.count;
    }
    if (isPaging) {
        return executePagingMode(ctx, options, total, recurse);
    }
    if (options.mode === 'offset') {
        return executeOffsetMode(ctx, options, total, shouldCount, recurse);
    }
    throw new RelqQueryError('Invalid pagination mode');
}
async function executePagingMode(ctx, options, total, recurse) {
    const { page, perPage } = options;
    if (typeof page !== 'number' || isNaN(page) || page < 1) {
        throw new RelqQueryError('pagination() paging mode requires "page" as a positive number (1-indexed)', { hint: 'page must be >= 1' });
    }
    if (typeof perPage !== 'number' || isNaN(perPage) || perPage < 1) {
        throw new RelqQueryError('pagination() paging mode requires "perPage" as a positive number', { hint: 'perPage must be >= 1' });
    }
    const offset = (page - 1) * perPage;
    ctx.builder.limit(perPage);
    ctx.builder.offset(offset);
    const sql = ctx.builder.toString();
    const result = await ctx.relq[INTERNAL].executeSelect(sql, ctx.tableName);
    const totalPages = Math.ceil(total / perPage);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;
    const pagination = {
        page,
        perPage,
        total,
        totalPages,
    };
    if (hasNext) {
        pagination.hasNext = true;
        pagination.nextPage = page + 1;
        Object.defineProperty(pagination, 'loadNext', {
            value: () => recurse({ ...options, page: page + 1 }),
            enumerable: false,
            configurable: false
        });
    }
    else {
        pagination.hasNext = false;
    }
    if (hasPrev) {
        pagination.hasPrev = true;
        pagination.prevPage = page - 1;
        Object.defineProperty(pagination, 'loadPrev', {
            value: () => recurse({ ...options, page: page - 1 }),
            enumerable: false,
            configurable: false
        });
    }
    else {
        pagination.hasPrev = false;
    }
    addInspectProperties(pagination, () => {
        const visible = { page, perPage, total, totalPages, hasNext };
        if (hasNext)
            visible.nextPage = page + 1;
        visible.hasPrev = hasPrev;
        if (hasPrev)
            visible.prevPage = page - 1;
        return visible;
    });
    return { data: result.data, pagination };
}
async function executeOffsetMode(ctx, options, total, shouldCount, recurse) {
    const { position, limit: limitOpt } = options;
    if (typeof position !== 'number' || isNaN(position)) {
        throw new RelqQueryError('pagination() offset mode requires "position" as a number', { hint: 'position must be >= 0' });
    }
    if (limitOpt === undefined || (typeof limitOpt !== 'number' && !Array.isArray(limitOpt))) {
        throw new RelqQueryError('pagination() offset mode requires "limit" as a number or [min, max] array', { hint: 'Use limit: number or limit: [min, max]' });
    }
    const limit = Array.isArray(limitOpt) ? randomLimit(limitOpt) : limitOpt;
    ctx.builder.limit(limit + 1);
    ctx.builder.offset(position);
    const sql = ctx.builder.toString();
    const result = await ctx.relq[INTERNAL].executeSelect(sql, ctx.tableName);
    const hasMore = result.data.length > limit;
    const hasPrev = position > 0;
    const data = hasMore ? result.data.slice(0, limit) : result.data;
    const pagination = {
        position,
        limit,
        ...(shouldCount && { total }),
    };
    if (hasMore) {
        pagination.hasMore = true;
        pagination.nextPos = position + limit;
        Object.defineProperty(pagination, 'loadNext', {
            value: () => recurse({ ...options, position: position + limit }),
            enumerable: false,
            configurable: false
        });
    }
    else {
        pagination.hasMore = false;
    }
    if (hasPrev) {
        pagination.hasPrev = true;
        pagination.prevPos = Math.max(0, position - limit);
        Object.defineProperty(pagination, 'loadPrev', {
            value: () => recurse({ ...options, position: Math.max(0, position - limit) }),
            enumerable: false,
            configurable: false
        });
    }
    else {
        pagination.hasPrev = false;
    }
    addInspectProperties(pagination, () => {
        const visible = { position, limit };
        if (shouldCount)
            visible.total = total;
        visible.hasMore = hasMore;
        if (hasMore)
            visible.nextPos = position + limit;
        visible.hasPrev = hasPrev;
        if (hasPrev)
            visible.prevPos = Math.max(0, position - limit);
        return visible;
    });
    return { data, pagination };
}
function closeCursor(cursor) {
    return new Promise((resolve, reject) => {
        cursor.close((err) => {
            if (err)
                reject(err);
            else
                resolve();
        });
    });
}
function addInspectProperties(obj, getVisibleProps) {
    Object.defineProperty(obj, Symbol.for('nodejs.util.inspect.custom'), {
        value: () => getVisibleProps(),
        enumerable: false
    });
    Object.defineProperty(obj, 'toJSON', {
        value: () => getVisibleProps(),
        enumerable: false
    });
}
