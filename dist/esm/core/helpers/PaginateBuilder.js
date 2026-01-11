import { CountBuilder } from "../../count/count-builder.js";
import { RelqQueryError } from "../../errors/relq-errors.js";
import { SelectBuilder } from "../../select/select-builder.js";
import { INTERNAL } from "./methods.js";
export class PaginateBuilder {
    relq;
    tableName;
    columns;
    whereClause;
    orderByClause;
    constructor(relq, tableName, columns, whereClause, orderByClause) {
        this.relq = relq;
        this.tableName = tableName;
        this.columns = columns;
        this.whereClause = whereClause;
        this.orderByClause = orderByClause;
    }
    async paging(options) {
        const page = options.page ?? 1;
        const perPage = options.perPage;
        const shouldCount = options.count ?? true;
        if (page < 1) {
            throw new RelqQueryError('page must be >= 1', { hint: 'Page numbers are 1-indexed' });
        }
        if (perPage < 1) {
            throw new RelqQueryError('perPage must be >= 1');
        }
        const columnsToSelect = this.columns && this.columns.length > 0 ? this.columns : ['*'];
        const orderByArr = this.orderByClause
            ? (Array.isArray(this.orderByClause[0]) ? this.orderByClause : [this.orderByClause])
            : [];
        const selectBuilder = new SelectBuilder(this.tableName, columnsToSelect);
        if (this.whereClause) {
            selectBuilder.where(this.whereClause);
        }
        for (const [column, direction] of orderByArr) {
            const dbColumn = this.relq[INTERNAL].transformToDbColumns(this.tableName, { [column]: true });
            selectBuilder.orderBy(Object.keys(dbColumn)[0] || column, direction);
        }
        let total = 0;
        if (shouldCount) {
            const countBuilder = new CountBuilder(this.tableName);
            if (this.whereClause) {
                countBuilder.where(this.whereClause);
            }
            const countResult = await this.relq[INTERNAL].executeCount(countBuilder.toString());
            total = countResult.count;
        }
        const offset = (page - 1) * perPage;
        selectBuilder.limit(perPage);
        selectBuilder.offset(offset);
        const result = await this.relq[INTERNAL].executeSelect(selectBuilder.toString(), this.tableName);
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
                value: () => this.paging({ ...options, page: page + 1 }),
                enumerable: false
            });
        }
        else {
            pagination.hasNext = false;
        }
        if (hasPrev) {
            pagination.hasPrev = true;
            pagination.prevPage = page - 1;
            Object.defineProperty(pagination, 'loadPrev', {
                value: () => this.paging({ ...options, page: page - 1 }),
                enumerable: false
            });
        }
        else {
            pagination.hasPrev = false;
        }
        Object.defineProperty(pagination, 'toJSON', {
            value: () => ({ page, perPage, total, totalPages, hasNext: pagination.hasNext, hasPrev: pagination.hasPrev, nextPage: pagination.nextPage, prevPage: pagination.prevPage }),
            enumerable: false
        });
        return { data: result.data, pagination };
    }
    async offset(options) {
        const position = options.position ?? 0;
        const shouldCount = options.count ?? false;
        if (position < 0) {
            throw new RelqQueryError('position must be >= 0');
        }
        let limit;
        if (options.shuffleLimit) {
            const [min, max] = options.shuffleLimit;
            if (min < 1 || max < 1) {
                throw new RelqQueryError('shuffleLimit values must be >= 1', { hint: 'Use [min, max] where both are >= 1' });
            }
            if (min > max) {
                throw new RelqQueryError('shuffleLimit[0] must be <= shuffleLimit[1]', { hint: 'Use [min, max] format where min <= max' });
            }
            limit = Math.floor(Math.random() * (max - min + 1)) + min;
        }
        else {
            const limitValue = options.limit;
            if (limitValue !== undefined && limitValue < 1) {
                throw new RelqQueryError('limit must be >= 1');
            }
            limit = limitValue ?? 50;
        }
        const columnsToSelect = this.columns && this.columns.length > 0 ? this.columns : ['*'];
        const orderByArr = this.orderByClause
            ? (Array.isArray(this.orderByClause[0]) ? this.orderByClause : [this.orderByClause])
            : [];
        const selectBuilder = new SelectBuilder(this.tableName, columnsToSelect);
        if (this.whereClause) {
            selectBuilder.where(this.whereClause);
        }
        for (const [column, direction] of orderByArr) {
            const dbColumn = this.relq[INTERNAL].transformToDbColumns(this.tableName, { [column]: true });
            selectBuilder.orderBy(Object.keys(dbColumn)[0] || column, direction);
        }
        let total = 0;
        if (shouldCount) {
            const countBuilder = new CountBuilder(this.tableName);
            if (this.whereClause) {
                countBuilder.where(this.whereClause);
            }
            const countResult = await this.relq[INTERNAL].executeCount(countBuilder.toString());
            total = countResult.count;
        }
        selectBuilder.limit(limit + 1);
        selectBuilder.offset(position);
        const result = await this.relq[INTERNAL].executeSelect(selectBuilder.toString(), this.tableName);
        const hasMore = result.data.length > limit;
        const data = hasMore ? result.data.slice(0, limit) : result.data;
        const hasPrev = position > 0;
        const pagination = {
            position,
            limit,
            total,
        };
        if (hasMore) {
            pagination.hasMore = true;
            pagination.nextPos = position + limit;
            Object.defineProperty(pagination, 'loadNext', {
                value: () => this.offset({ ...options, position: position + limit }),
                enumerable: false
            });
        }
        else {
            pagination.hasMore = false;
        }
        if (hasPrev) {
            pagination.hasPrev = true;
            pagination.prevPos = Math.max(0, position - limit);
            Object.defineProperty(pagination, 'loadPrev', {
                value: () => this.offset({ ...options, position: Math.max(0, position - limit) }),
                enumerable: false
            });
        }
        else {
            pagination.hasPrev = false;
        }
        Object.defineProperty(pagination, 'toJSON', {
            value: () => ({ position, limit, total, hasMore: pagination.hasMore, hasPrev: pagination.hasPrev, nextPos: pagination.nextPos, prevPos: pagination.prevPos }),
            enumerable: false
        });
        return { data, pagination };
    }
}
