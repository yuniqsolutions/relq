import { INTERNAL } from "./methods.js";
import { executeTypeSafeJoin, executeTypeSafeJoinMany } from "./select-joins.js";
import { executeCursorEach, executePagination } from "./select-pagination.js";
import { requireCapability } from "./capability-guard.js";
export class ConnectedSelectBuilder {
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
        const internal = this.relq[INTERNAL];
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
    transformJoinResults(rows) {
        const joins = this.builder.getStructuredJoins();
        if (joins.length === 0) {
            return rows;
        }
        const internal = this.relq[INTERNAL];
        return rows.map(row => {
            if (!row || typeof row !== 'object')
                return row;
            const transformed = { ...row };
            for (const join of joins) {
                const alias = join.alias;
                const nestedData = transformed[alias];
                if (nestedData === null || nestedData === undefined) {
                    continue;
                }
                const joinedTableDef = internal.getTableDef(join.schemaKey || alias) || internal.getTableDef(join.table);
                if (!joinedTableDef) {
                    continue;
                }
                const tableColumns = joinedTableDef.$columns || joinedTableDef;
                const dbToProp = new Map();
                const propTypes = new Map();
                for (const [propName, colDef] of Object.entries(tableColumns)) {
                    const dbColName = colDef?.$columnName ?? propName;
                    dbToProp.set(dbColName, propName);
                    const snakeCase = propName.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
                    if (snakeCase !== propName && !dbToProp.has(snakeCase)) {
                        dbToProp.set(snakeCase, propName);
                    }
                    const sqlType = colDef?.$sqlType || (typeof colDef?.$type === 'string' ? colDef.$type : undefined);
                    if (sqlType) {
                        propTypes.set(propName, sqlType.toLowerCase());
                    }
                }
                if (Array.isArray(nestedData)) {
                    transformed[alias] = nestedData.map((item) => this.transformNestedObject(item, dbToProp, propTypes));
                }
                else {
                    transformed[alias] = this.transformNestedObject(nestedData, dbToProp, propTypes);
                }
            }
            return transformed;
        });
    }
    transformNestedObject(obj, dbToProp, propTypes) {
        if (!obj || typeof obj !== 'object')
            return obj;
        const result = {};
        for (const [key, value] of Object.entries(obj)) {
            const propName = dbToProp.get(key) ?? key;
            result[propName] = propTypes ? this.coerceValue(value, propTypes.get(propName)) : value;
        }
        return result;
    }
    coerceValue(value, sqlType) {
        if (value === null || value === undefined || !sqlType)
            return value;
        switch (sqlType) {
            case 'timestamp':
            case 'timestamptz':
            case 'timestamp without time zone':
            case 'timestamp with time zone':
                return typeof value === 'string' ? new Date(value) : value;
            case 'bigint':
            case 'int8':
                return typeof value === 'number' ? BigInt(value) : typeof value === 'string' ? BigInt(value) : value;
            default:
                return value;
        }
    }
    where(callback) {
        this.builder.where(callback);
        return this;
    }
    orderBy(column, direction) {
        const dbColumn = this.relq[INTERNAL].hasColumnMapping()
            ? Object.keys(this.relq[INTERNAL].transformToDbColumns(this.tableName, { [column]: true }))[0]
            : column;
        this.builder.orderBy(dbColumn, direction);
        return this;
    }
    orderByNulls(column, direction, nulls) {
        const dbColumn = this.relq[INTERNAL].hasColumnMapping()
            ? Object.keys(this.relq[INTERNAL].transformToDbColumns(this.tableName, { [column]: true }))[0]
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
        const dbColumns = this.relq[INTERNAL].hasColumnMapping()
            ? columns.map(col => Object.keys(this.relq[INTERNAL].transformToDbColumns(this.tableName, { [col]: true }))[0])
            : columns;
        this.builder.groupBy(...dbColumns);
        return this;
    }
    having(callback) {
        this.builder.having(callback);
        return this;
    }
    join(tableOrAlias, callback) {
        executeTypeSafeJoin(this.joinCtx, 'JOIN', tableOrAlias, callback);
        return this;
    }
    leftJoin(tableOrAlias, callback) {
        executeTypeSafeJoin(this.joinCtx, 'LEFT JOIN', tableOrAlias, callback);
        return this;
    }
    rightJoin(tableOrAlias, callback) {
        executeTypeSafeJoin(this.joinCtx, 'RIGHT JOIN', tableOrAlias, callback);
        return this;
    }
    innerJoin(tableOrAlias, callback) {
        executeTypeSafeJoin(this.joinCtx, 'INNER JOIN', tableOrAlias, callback);
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
        requireCapability(this.relq, 'lateral', 'LATERAL JOIN (joinMany)', 'Use separate queries for one-to-many relationships');
        executeTypeSafeJoinMany(this.joinCtx, 'JOIN', tableOrAlias, callback);
        return this;
    }
    leftJoinMany(tableOrAlias, callback) {
        requireCapability(this.relq, 'lateral', 'LATERAL JOIN (leftJoinMany)', 'Use separate queries for one-to-many relationships');
        executeTypeSafeJoinMany(this.joinCtx, 'LEFT JOIN', tableOrAlias, callback);
        return this;
    }
    distinct() {
        this.builder.distinct();
        return this;
    }
    distinctOn(...columns) {
        requireCapability(this.relq, 'distinctOn', 'DISTINCT ON', 'Use GROUP BY with appropriate aggregation instead');
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
        requireCapability(this.relq, 'forUpdateSkipLocked', 'FOR UPDATE SKIP LOCKED', 'Use FOR UPDATE without SKIP LOCKED');
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
        const result = await this.relq[INTERNAL].executeSelect(sql, this.tableName);
        const transformedData = this.transformJoinResults(result.data);
        if (withMetadata) {
            return { data: transformedData, metadata: result.metadata };
        }
        return transformedData;
    }
    async get(withMetadata, _asRequired) {
        this.builder.limit(1);
        const sql = this.builder.toString();
        const result = await this.relq[INTERNAL].executeSelectOne(sql, this.tableName);
        const transformedData = result.data ? this.transformJoinResults([result.data])[0] : null;
        if (withMetadata) {
            return { data: transformedData, metadata: result.metadata };
        }
        return transformedData;
    }
    async value(column) {
        this.builder.limit(1);
        const sql = this.builder.toString();
        const result = await this.relq[INTERNAL].executeSelectOne(sql, this.tableName);
        return result.data?.[column] ?? null;
    }
    async each(callback, options = {}) {
        requireCapability(this.relq, 'cursors', 'Cursor-based iteration (each)', 'Use pagination() instead of each() for row-by-row processing');
        return executeCursorEach(this.paginationCtx, callback, options);
    }
    async pagination(options) {
        return executePagination(this.paginationCtx, options, (opts) => this.pagination(opts));
    }
}
