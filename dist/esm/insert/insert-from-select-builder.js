import format from "../utils/pg-format.js";
import { buildConflictUpdateSql } from "./conflict-builder.js";
export class InsertFromSelectBuilder {
    tableName;
    columns;
    selectSQL;
    returningColumns;
    columnResolver;
    conflictColumns;
    conflictAction;
    conflictUpdateData;
    conflictWhereClause;
    constructor(tableName, columns, selectSQL) {
        this.tableName = tableName;
        this.columns = columns;
        this.selectSQL = selectSQL;
    }
    setColumnResolver(resolver) {
        this.columnResolver = resolver;
        return this;
    }
    onConflictDoNothing(columns) {
        this.conflictColumns = columns
            ? (Array.isArray(columns) ? columns : [columns])
            : undefined;
        this.conflictAction = 'nothing';
        return this;
    }
    onConflictDoUpdate(columns, updateData, whereClause) {
        this.conflictColumns = Array.isArray(columns) ? columns : [columns];
        this.conflictAction = 'update';
        this.conflictUpdateData = updateData;
        this.conflictWhereClause = whereClause;
        return this;
    }
    returning(columns) {
        if (columns === null) {
            this.returningColumns = undefined;
        }
        else {
            this.returningColumns = Array.isArray(columns) ? columns : [columns];
        }
        return this;
    }
    resolveColumnName(name) {
        if (this.columnResolver) {
            return this.columnResolver(name);
        }
        return name;
    }
    buildConflictClause() {
        if (!this.conflictAction)
            return '';
        let clause = this.conflictColumns && this.conflictColumns.length > 0
            ? format(' ON CONFLICT (%I)', this.conflictColumns)
            : ' ON CONFLICT';
        if (this.conflictAction === 'nothing') {
            clause += ' DO NOTHING';
        }
        else if (this.conflictAction === 'update' && this.conflictUpdateData) {
            const updateSql = buildConflictUpdateSql(this.conflictUpdateData, this.tableName);
            clause += ` DO UPDATE SET ${updateSql}`;
            if (this.conflictWhereClause) {
                clause += ` WHERE ${this.conflictWhereClause}`;
            }
        }
        return clause;
    }
    toString() {
        const resolvedColumns = this.columns.map(c => this.resolveColumnName(c));
        let query = format('INSERT INTO %I (%I) %s', this.tableName, resolvedColumns, this.selectSQL);
        query += this.buildConflictClause();
        if (this.returningColumns) {
            const resolvedReturning = this.returningColumns.map(col => col === '*' ? '*' : this.resolveColumnName(col));
            query += format(' RETURNING %I', resolvedReturning);
        }
        return query;
    }
}
