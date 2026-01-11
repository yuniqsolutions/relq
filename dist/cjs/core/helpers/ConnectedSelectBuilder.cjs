"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectedSelectBuilder = void 0;
const pg_cursor_1 = __importDefault(require("../../addon/pg-cursor/index.cjs"));
const relq_errors_1 = require("../../errors/relq-errors.cjs");
const join_condition_builder_1 = require("../../select/join-condition-builder.cjs");
const join_internals_1 = require("../../select/join-internals.cjs");
const join_many_condition_builder_1 = require("../../select/join-many-condition-builder.cjs");
const table_proxy_1 = require("../../select/table-proxy.cjs");
const pagination_types_1 = require("../../types/pagination-types.cjs");
const fk_resolver_1 = require("../../utils/fk-resolver.cjs");
const methods_1 = require("./methods.cjs");
class ConnectedSelectBuilder {
    builder;
    relq;
    tableName;
    columns;
    schemaKey;
    constructor(builder, relq, tableName, columns, schemaKey) {
        this.builder = builder;
        this.relq = relq;
        this.tableName = tableName;
        this.columns = columns;
        this.schemaKey = schemaKey;
        this.setupColumnResolver();
    }
    setupColumnResolver() {
        const internal = this.relq[methods_1.INTERNAL];
        const tableDef = internal.getTableDef(this.schemaKey || this.tableName);
        if (!tableDef) {
            return;
        }
        const tableColumns = tableDef.$columns || tableDef;
        this.builder.setColumnResolver((column) => {
            const columnDef = tableColumns[column];
            if (columnDef) {
                return columnDef.$columnName || column;
            }
            return column;
        });
    }
    where(callback) {
        this.builder.where(callback);
        return this;
    }
    orderBy(column, direction) {
        const dbColumn = this.relq[methods_1.INTERNAL].hasColumnMapping()
            ? Object.keys(this.relq[methods_1.INTERNAL].transformToDbColumns(this.tableName, { [column]: true }))[0]
            : column;
        this.builder.orderBy(dbColumn, direction);
        return this;
    }
    limit(count) {
        this.builder.limit(count);
        return this;
    }
    offset(count) {
        this.builder.offset(count);
        return this;
    }
    groupBy(...columns) {
        const dbColumns = this.relq[methods_1.INTERNAL].hasColumnMapping()
            ? columns.map(col => Object.keys(this.relq[methods_1.INTERNAL].transformToDbColumns(this.tableName, { [col]: true }))[0])
            : columns;
        this.builder.groupBy(...dbColumns);
        return this;
    }
    having(callback) {
        this.builder.having(callback);
        return this;
    }
    join(tableOrAlias, callback) {
        this.addTypeSafeJoin('JOIN', tableOrAlias, callback);
        return this;
    }
    leftJoin(tableOrAlias, callback) {
        this.addTypeSafeJoin('LEFT JOIN', tableOrAlias, callback);
        return this;
    }
    rightJoin(tableOrAlias, callback) {
        this.addTypeSafeJoin('RIGHT JOIN', tableOrAlias, callback);
        return this;
    }
    innerJoin(tableOrAlias, callback) {
        this.addTypeSafeJoin('INNER JOIN', tableOrAlias, callback);
        return this;
    }
    joinSubquery(alias, subquery, onClause) {
        const subquerySQL = typeof subquery === 'string' ? subquery : subquery.toString();
        this.builder.addRawJoin(`JOIN (${subquerySQL}) AS "${alias}" ON ${onClause}`);
        return this;
    }
    leftJoinSubquery(alias, subquery, onClause) {
        const subquerySQL = typeof subquery === 'string' ? subquery : subquery.toString();
        this.builder.addRawJoin(`LEFT JOIN (${subquerySQL}) AS "${alias}" ON ${onClause}`);
        return this;
    }
    joinMany(tableOrAlias, callback) {
        this.addTypeSafeJoinMany('JOIN', tableOrAlias, callback);
        return this;
    }
    leftJoinMany(tableOrAlias, callback) {
        this.addTypeSafeJoinMany('LEFT JOIN', tableOrAlias, callback);
        return this;
    }
    addTypeSafeJoinMany(joinType, tableOrAlias, callback) {
        const [rightTableKey, rightAlias] = Array.isArray(tableOrAlias)
            ? tableOrAlias
            : [tableOrAlias, tableOrAlias];
        const internal = this.relq[methods_1.INTERNAL];
        const leftTableDef = internal.getTableDef(this.schemaKey || this.tableName);
        const rightTableDef = internal.getTableDef(rightTableKey);
        const leftTableName = leftTableDef?.$name || this.tableName;
        const rightTableName = rightTableDef?.$name || rightTableKey;
        const leftAlias = this.builder.getTableIdentifier();
        const leftProxy = (0, table_proxy_1.createTableProxy)(leftTableName, leftAlias, leftTableDef);
        const rightProxy = (0, table_proxy_1.createTableProxy)(rightTableName, rightAlias, rightTableDef);
        const conditionBuilder = new join_many_condition_builder_1.JoinManyConditionBuilder();
        const proxyCreator = (tableKey, alias) => {
            const tableDef = internal.getTableDef(tableKey);
            const sqlTableName = tableDef?.$name || tableKey;
            return {
                proxy: (0, table_proxy_1.createTableProxy)(sqlTableName, alias, tableDef),
                tableName: sqlTableName
            };
        };
        conditionBuilder[join_internals_1.JOIN_SETUP](proxyCreator, rightProxy);
        callback(conditionBuilder, leftProxy, rightProxy);
        const lateralSQL = this.buildLateralSubquery(rightTableName, rightAlias, conditionBuilder, rightTableDef);
        const lateralJoinType = joinType === 'LEFT JOIN' ? 'LEFT JOIN LATERAL' : 'JOIN LATERAL';
        const joinClause = {
            type: lateralJoinType,
            table: rightTableName,
            alias: rightAlias,
            lateralSubquery: lateralSQL
        };
        this.builder.addStructuredJoin(joinClause);
    }
    buildLateralSubquery(tableName, alias, builder, tableDef) {
        const parts = [];
        parts.push('(SELECT');
        parts.push(`COALESCE(jsonb_agg(row_to_json(sub.*)), '[]'::jsonb) AS ${alias}`);
        parts.push('FROM (');
        const internals = builder[join_internals_1.JOIN_INTERNAL];
        parts.push('SELECT');
        const selectedProps = internals.getSelectedColumns();
        if (selectedProps && selectedProps.length > 0) {
            const tableColumns = tableDef?.$columns || tableDef;
            const selectCols = selectedProps.map(prop => {
                const columnDef = tableColumns?.[prop];
                const sqlName = columnDef?.$columnName || prop;
                return `"${alias}"."${sqlName}" AS "${prop}"`;
            }).join(', ');
            parts.push(selectCols);
        }
        else {
            parts.push(`"${alias}".*`);
        }
        parts.push(`FROM "${tableName}" AS "${alias}"`);
        const innerJoins = internals.getInnerJoins();
        for (const join of innerJoins) {
            parts.push(`${join.type} "${join.table}" AS "${join.alias}" ON ${join.onClause}`);
        }
        const whereSQL = internals.toWhereSQL();
        if (whereSQL) {
            parts.push(`WHERE ${whereSQL}`);
        }
        const orderBySQL = internals.toOrderBySQL();
        if (orderBySQL) {
            parts.push(`ORDER BY ${orderBySQL}`);
        }
        const limitSQL = internals.toLimitSQL();
        if (limitSQL) {
            parts.push(limitSQL);
        }
        const offsetSQL = internals.toOffsetSQL();
        if (offsetSQL) {
            parts.push(offsetSQL);
        }
        parts.push(') sub');
        parts.push(`) AS "${alias}_lateral"`);
        return parts.join(' ');
    }
    addTypeSafeJoin(joinType, tableOrAlias, callback) {
        const [rightTableKey, rightAlias] = Array.isArray(tableOrAlias)
            ? tableOrAlias
            : [tableOrAlias, tableOrAlias];
        const internal = this.relq[methods_1.INTERNAL];
        const schema = internal.getSchema();
        const relations = internal.getRelations();
        const leftTableDef = internal.getTableDef(this.schemaKey || this.tableName);
        const rightTableDef = internal.getTableDef(rightTableKey);
        const leftTableName = leftTableDef?.$name || this.tableName;
        const rightTableName = rightTableDef?.$name || rightTableKey;
        const leftAlias = this.builder.getTableIdentifier();
        const leftProxy = (0, table_proxy_1.createTableProxy)(leftTableName, leftAlias, leftTableDef);
        const rightProxy = (0, table_proxy_1.createTableProxy)(rightTableName, rightAlias, rightTableDef);
        const conditionBuilder = new join_condition_builder_1.JoinConditionBuilder();
        if (callback) {
            callback(conditionBuilder, leftProxy, rightProxy);
        }
        const conditionInternals = conditionBuilder[join_internals_1.JOIN_INTERNAL];
        if (!conditionInternals.hasConditions() && schema && relations) {
            const fkResolution = (0, fk_resolver_1.resolveForeignKey)(relations, schema, this.schemaKey || this.tableName, rightTableKey);
            if (fkResolution) {
                const leftCol = leftProxy[fkResolution.fromColumn];
                const rightCol = rightProxy[fkResolution.toColumn];
                conditionBuilder.equal(leftCol, rightCol);
            }
            else {
                throw new relq_errors_1.RelqQueryError(`Cannot auto-resolve FK relationship between "${this.schemaKey || this.tableName}" and "${rightTableKey}". ` +
                    `Either provide a callback with explicit join conditions, or define the relationship in your relations config.`, { hint: `Use .join('${rightTableKey}', (on, left, right) => on.equal(left.columnName, right.id))` });
            }
        }
        const selectedProps = conditionInternals.getSelectedColumns();
        let selectColumns;
        if (selectedProps && selectedProps.length > 0) {
            const rightColumns = rightTableDef?.$columns || rightTableDef;
            selectColumns = selectedProps.map(prop => {
                const columnDef = rightColumns?.[prop];
                const sqlName = columnDef?.$columnName || prop;
                return { property: prop, sqlName };
            });
        }
        const joinClause = {
            type: joinType,
            table: rightTableName,
            alias: rightAlias,
            onClause: conditionInternals.toSQL() || undefined,
            usingColumns: conditionInternals.getUsingColumns() || undefined,
            selectColumns
        };
        this.builder.addStructuredJoin(joinClause);
    }
    distinct() {
        this.builder.distinct();
        return this;
    }
    distinctOn(...columns) {
        this.builder.distinctOn(...columns);
        return this;
    }
    union(query) {
        this.builder.union(typeof query === 'string' ? query : query.toString());
        return this;
    }
    unionAll(query) {
        this.builder.unionAll(typeof query === 'string' ? query : query.toString());
        return this;
    }
    intersect(query) {
        this.builder.intersect(typeof query === 'string' ? query : query.toString());
        return this;
    }
    except(query) {
        this.builder.except(typeof query === 'string' ? query : query.toString());
        return this;
    }
    forUpdate() {
        this.builder.forUpdate();
        return this;
    }
    forUpdateSkipLocked() {
        this.builder.forUpdateSkipLocked();
        return this;
    }
    forShare() {
        this.builder.forShare();
        return this;
    }
    toString() {
        return this.builder.toString();
    }
    async all(withMetadata, _asRequired) {
        const sql = this.builder.toString();
        const result = await this.relq[methods_1.INTERNAL].executeSelect(sql, this.tableName);
        if (withMetadata) {
            return result;
        }
        return result.data;
    }
    async get(withMetadata, _asRequired) {
        this.builder.limit(1);
        const sql = this.builder.toString();
        const result = await this.relq[methods_1.INTERNAL].executeSelectOne(sql, this.tableName);
        if (withMetadata) {
            return result;
        }
        return result.data;
    }
    async value(column) {
        this.builder.limit(1);
        const sql = this.builder.toString();
        const result = await this.relq[methods_1.INTERNAL].executeSelectOne(sql, this.tableName);
        return result.data?.[column] ?? null;
    }
    async each(callback, options = {}) {
        const batchSize = options.batchSize ?? 100;
        const sql = this.builder.toString();
        const relqAny = this.relq;
        if (relqAny.usePooling === false || (!relqAny.pool && relqAny.client)) {
            throw new relq_errors_1.RelqConfigError('each() requires pooled connections', { field: 'pooling', value: 'false (must be true)' });
        }
        const { client, release } = await this.relq[methods_1.INTERNAL].getClientForCursor();
        try {
            await client.query('BEGIN');
            const cursor = client.query(new pg_cursor_1.default(sql));
            let rows;
            let aborted = false;
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
                const transformedRows = this.tableName && this.relq._transformResultsFromDb
                    ? this.relq._transformResultsFromDb(this.tableName, rows)
                    : rows;
                for (const row of transformedRows) {
                    const result = await callback(row, index++);
                    if (result === false) {
                        aborted = true;
                        break outer;
                    }
                }
            } while (rows.length > 0);
            await new Promise((resolve, reject) => {
                cursor.close((err) => {
                    if (err)
                        reject(err);
                    else
                        resolve();
                });
            });
            await client.query('COMMIT');
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            release();
        }
    }
    async pagination(options) {
        if (!options.mode || !['paging', 'offset'].includes(options.mode)) {
            throw new relq_errors_1.RelqQueryError('pagination() requires "mode" to be one of: \'paging\', \'offset\'', { hint: 'Set mode: "paging" or mode: "offset"' });
        }
        const orderByArr = options.orderBy
            ? (Array.isArray(options.orderBy[0]) ? options.orderBy : [options.orderBy])
            : [];
        for (const [column, direction] of orderByArr) {
            const dbColumn = this.relq[methods_1.INTERNAL].hasColumnMapping()
                ? Object.keys(this.relq[methods_1.INTERNAL].transformToDbColumns(this.tableName, { [column]: true }))[0]
                : column;
            this.builder.orderBy(dbColumn, direction);
        }
        const isPaging = options.mode === 'paging';
        const shouldCount = options.count ?? isPaging;
        let total = 0;
        if (shouldCount) {
            const countSql = this.builder.toCountSQL();
            const countResult = await this.relq[methods_1.INTERNAL].executeCount(countSql);
            total = countResult.count;
        }
        if (isPaging) {
            const { page, perPage } = options;
            if (typeof page !== 'number' || isNaN(page) || page < 1) {
                throw new relq_errors_1.RelqQueryError('pagination() paging mode requires "page" as a positive number (1-indexed)', { hint: 'page must be >= 1' });
            }
            if (typeof perPage !== 'number' || isNaN(perPage) || perPage < 1) {
                throw new relq_errors_1.RelqQueryError('pagination() paging mode requires "perPage" as a positive number', { hint: 'perPage must be >= 1' });
            }
            const offset = (page - 1) * perPage;
            this.builder.limit(perPage);
            this.builder.offset(offset);
            const sql = this.builder.toString();
            const result = await this.relq[methods_1.INTERNAL].executeSelect(sql, this.tableName);
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
                    value: () => this.pagination({ ...options, page: page + 1 }),
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
                    value: () => this.pagination({ ...options, page: page - 1 }),
                    enumerable: false,
                    configurable: false
                });
            }
            else {
                pagination.hasPrev = false;
            }
            const getVisibleProps = () => {
                const visible = { page, perPage, total, totalPages, hasNext };
                if (hasNext)
                    visible.nextPage = page + 1;
                visible.hasPrev = hasPrev;
                if (hasPrev)
                    visible.prevPage = page - 1;
                return visible;
            };
            Object.defineProperty(pagination, Symbol.for('nodejs.util.inspect.custom'), {
                value: () => getVisibleProps(),
                enumerable: false
            });
            Object.defineProperty(pagination, 'toJSON', {
                value: () => getVisibleProps(),
                enumerable: false
            });
            return { data: result.data, pagination };
        }
        if (options.mode === 'offset') {
            const { position, limit: limitOpt } = options;
            if (typeof position !== 'number' || isNaN(position)) {
                throw new relq_errors_1.RelqQueryError('pagination() offset mode requires "position" as a number', { hint: 'position must be >= 0' });
            }
            if (limitOpt === undefined || (typeof limitOpt !== 'number' && !Array.isArray(limitOpt))) {
                throw new relq_errors_1.RelqQueryError('pagination() offset mode requires "limit" as a number or [min, max] array', { hint: 'Use limit: number or limit: [min, max]' });
            }
            const limit = Array.isArray(limitOpt) ? (0, pagination_types_1.randomLimit)(limitOpt) : limitOpt;
            this.builder.limit(limit + 1);
            this.builder.offset(position);
            const sql = this.builder.toString();
            const result = await this.relq[methods_1.INTERNAL].executeSelect(sql, this.tableName);
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
                    value: () => this.pagination({ ...options, position: position + limit }),
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
                    value: () => this.pagination({ ...options, position: Math.max(0, position - limit) }),
                    enumerable: false,
                    configurable: false
                });
            }
            else {
                pagination.hasPrev = false;
            }
            const getVisibleProps = () => {
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
            };
            Object.defineProperty(pagination, Symbol.for('nodejs.util.inspect.custom'), {
                value: () => getVisibleProps(),
                enumerable: false
            });
            Object.defineProperty(pagination, 'toJSON', {
                value: () => getVisibleProps(),
                enumerable: false
            });
            return { data, pagination };
        }
        throw new relq_errors_1.RelqQueryError('Invalid pagination mode');
    }
}
exports.ConnectedSelectBuilder = ConnectedSelectBuilder;
