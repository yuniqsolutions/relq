"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectedSelectBuilder = void 0;
const methods_1 = require("./methods.cjs");
const select_joins_1 = require("./select-joins.cjs");
const select_pagination_1 = require("./select-pagination.cjs");
const capability_guard_1 = require("./capability-guard.cjs");
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
    get joinCtx() {
        return { relq: this.relq, builder: this.builder, tableName: this.tableName, schemaKey: this.schemaKey };
    }
    get paginationCtx() {
        return { relq: this.relq, builder: this.builder, tableName: this.tableName };
    }
    setupColumnResolver() {
        const internal = this.relq[methods_1.INTERNAL];
        const tableKey = this.schemaKey || this.tableName;
        const tableDef = internal.getTableDef(tableKey);
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
    orderByNulls(column, direction, nulls) {
        const dbColumn = this.relq[methods_1.INTERNAL].hasColumnMapping()
            ? Object.keys(this.relq[methods_1.INTERNAL].transformToDbColumns(this.tableName, { [column]: true }))[0]
            : column;
        this.builder.orderByNulls(dbColumn, direction, nulls);
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
        (0, select_joins_1.executeTypeSafeJoin)(this.joinCtx, 'JOIN', tableOrAlias, callback);
        return this;
    }
    leftJoin(tableOrAlias, callback) {
        (0, select_joins_1.executeTypeSafeJoin)(this.joinCtx, 'LEFT JOIN', tableOrAlias, callback);
        return this;
    }
    rightJoin(tableOrAlias, callback) {
        (0, select_joins_1.executeTypeSafeJoin)(this.joinCtx, 'RIGHT JOIN', tableOrAlias, callback);
        return this;
    }
    innerJoin(tableOrAlias, callback) {
        (0, select_joins_1.executeTypeSafeJoin)(this.joinCtx, 'INNER JOIN', tableOrAlias, callback);
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
        (0, capability_guard_1.requireCapability)(this.relq, 'lateral', 'LATERAL JOIN (joinMany)', 'Use separate queries for one-to-many relationships');
        (0, select_joins_1.executeTypeSafeJoinMany)(this.joinCtx, 'JOIN', tableOrAlias, callback);
        return this;
    }
    leftJoinMany(tableOrAlias, callback) {
        (0, capability_guard_1.requireCapability)(this.relq, 'lateral', 'LATERAL JOIN (leftJoinMany)', 'Use separate queries for one-to-many relationships');
        (0, select_joins_1.executeTypeSafeJoinMany)(this.joinCtx, 'LEFT JOIN', tableOrAlias, callback);
        return this;
    }
    distinct() {
        this.builder.distinct();
        return this;
    }
    distinctOn(...columns) {
        (0, capability_guard_1.requireCapability)(this.relq, 'distinctOn', 'DISTINCT ON', 'Use GROUP BY with appropriate aggregation instead');
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
        (0, capability_guard_1.requireCapability)(this.relq, 'forUpdateSkipLocked', 'FOR UPDATE SKIP LOCKED', 'Use FOR UPDATE without SKIP LOCKED');
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
        (0, capability_guard_1.requireCapability)(this.relq, 'cursors', 'Cursor-based iteration (each)', 'Use pagination() instead of each() for row-by-row processing');
        return (0, select_pagination_1.executeCursorEach)(this.paginationCtx, callback, options);
    }
    async pagination(options) {
        return (0, select_pagination_1.executePagination)(this.paginationCtx, options, (opts) => this.pagination(opts));
    }
}
exports.ConnectedSelectBuilder = ConnectedSelectBuilder;
