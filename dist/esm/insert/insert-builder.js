import format from "../utils/pg-format.js";
import { convertCase } from "../utils/case-converter.js";
import { SelectBuilder } from "../select/select-builder.js";
import { CountBuilder } from "../count/count-builder.js";
import { ConflictBuilder, buildConflictUpdateSql } from "./conflict-builder.js";
import { RelqBuilderError } from "../errors/relq-errors.js";
export class InsertBuilder {
    tableName;
    insertData;
    conflictColumns;
    conflictBuilder;
    returningClause;
    _case = 'keep-case';
    _convertCase = '2snake';
    originalColumns;
    columnResolver;
    columnTypeResolver;
    constructor(tableName, data) {
        this.tableName = tableName;
        const normalized = this.normalizeData(data);
        this.insertData = [normalized];
        this.originalColumns = Object.keys(normalized).sort();
    }
    normalizeData(data) {
        const normalized = {};
        for (const [key, value] of Object.entries(data)) {
            normalized[key] = value === undefined ? null : value;
        }
        return normalized;
    }
    setColumnResolver(resolver) {
        this.columnResolver = resolver;
        return this;
    }
    setColumnTypeResolver(resolver) {
        this.columnTypeResolver = resolver;
        return this;
    }
    resolveColumnName(name) {
        if (this.columnResolver) {
            return this.columnResolver(name);
        }
        return this.convertColumnName(name);
    }
    convertCase(type, conversionCase = '2snake') {
        this._case = type;
        this._convertCase = conversionCase;
        return this;
    }
    validateColumns(row) {
        const newColumns = Object.keys(row).sort();
        if (newColumns.length !== this.originalColumns.length) {
            throw new RelqBuilderError(`Column count mismatch: expected ${this.originalColumns.length} columns, got ${newColumns.length}`, { builder: 'InsertBuilder', hint: `Expected columns: [${this.originalColumns.join(', ')}]` });
        }
        for (let i = 0; i < this.originalColumns.length; i++) {
            if (this.originalColumns[i] !== newColumns[i]) {
                throw new RelqBuilderError('Column name mismatch: all rows must have the exact same column names', { builder: 'InsertBuilder', hint: `Expected columns: [${this.originalColumns.join(', ')}]` });
            }
        }
    }
    addRow(row) {
        const normalized = this.normalizeData(row);
        if (this.insertData.length === 0) {
            this.originalColumns = Object.keys(normalized).sort();
        }
        else {
            this.validateColumns(normalized);
        }
        this.insertData.push(normalized);
        return this;
    }
    addRows(rows) {
        if (rows.length === 0)
            return this;
        const normalizedRows = rows.map(row => this.normalizeData(row));
        if (this.insertData.length === 0) {
            this.originalColumns = Object.keys(normalizedRows[0]).sort();
        }
        for (const row of normalizedRows) {
            this.validateColumns(row);
        }
        this.insertData.push(...normalizedRows);
        return this;
    }
    clear() {
        this.insertData = [];
        this.originalColumns = [];
        return this;
    }
    get total() {
        return this.insertData.length;
    }
    _onConflict(columns, callback) {
        this.conflictColumns = columns === null ? [] : Array.isArray(columns) ? columns : [columns];
        this.conflictBuilder = new ConflictBuilder(this.tableName);
        if (callback) {
            callback(this.conflictBuilder);
        }
        else {
            this.conflictBuilder.doNothing();
        }
        return this;
    }
    returning(columns) {
        if (columns === null) {
            this.returningClause = undefined;
        }
        else {
            this.returningClause = {
                type: 'columns',
                columns: Array.isArray(columns) ? columns : [columns]
            };
        }
        return this;
    }
    returningSelect(callback) {
        const builder = new SelectBuilder(this.tableName);
        const result = callback(builder);
        if (result === null) {
            this.returningClause = undefined;
        }
        else {
            this.returningClause = {
                type: 'select',
                builder: result
            };
        }
        return this;
    }
    returningCount(callback) {
        const builder = new CountBuilder(this.tableName);
        const result = callback(builder);
        if (result === null) {
            this.returningClause = undefined;
        }
        else {
            this.returningClause = {
                type: 'count',
                builder: result
            };
        }
        return this;
    }
    convertColumnName(name) {
        if (this._case === 'to-lower')
            return name.toLowerCase();
        if (this._case === 'to-upper')
            return name.toUpperCase();
        if (this._case === 'convert-case')
            return convertCase(name, this._convertCase);
        return name;
    }
    formatPostgresArray(value, baseType = 'jsonb') {
        if (value.length === 0)
            return `ARRAY[]::${baseType}[]`;
        if (baseType === 'jsonb') {
            const jsonValues = value.map(v => format('%L', JSON.stringify(v))).join(',');
            return `ARRAY[${jsonValues}]::jsonb[]`;
        }
        else if (baseType === 'text' || baseType === 'varchar') {
            const textValues = value.map(v => format('%L', String(v))).join(',');
            return `ARRAY[${textValues}]::text[]`;
        }
        else if (baseType === 'integer' || baseType === 'int4' || baseType === 'bigint' || baseType === 'int8') {
            return `ARRAY[${value.join(',')}]::${baseType}[]`;
        }
        else {
            const jsonValues = value.map(v => format('%L', JSON.stringify(v))).join(',');
            return `ARRAY[${jsonValues}]::${baseType}[]`;
        }
    }
    formatJsonbValue(value) {
        const json = JSON.stringify(value).replace(/'/g, "''");
        return `'${json}'::jsonb`;
    }
    processRowValues(row, originalColumns) {
        const processedValues = [];
        const placeholderTypes = [];
        for (const colName of originalColumns) {
            const value = row[colName];
            if (Array.isArray(value) || (value !== null && typeof value === 'object' && !(value instanceof Date))) {
                const typeInfo = this.columnTypeResolver?.(colName);
                if (typeInfo) {
                    if (Array.isArray(value)) {
                        if (typeInfo.isArray) {
                            processedValues.push(this.formatPostgresArray(value, typeInfo.type));
                        }
                        else if (typeInfo.type === 'jsonb' || typeInfo.type === 'json') {
                            processedValues.push(this.formatJsonbValue(value));
                        }
                        else {
                            processedValues.push(this.formatJsonbValue(value));
                        }
                    }
                    else {
                        processedValues.push(this.formatJsonbValue(value));
                    }
                }
                else {
                    processedValues.push(this.formatJsonbValue(value));
                }
                placeholderTypes.push('%s');
            }
            else {
                processedValues.push(value);
                placeholderTypes.push('%L');
            }
        }
        return { values: processedValues, placeholders: placeholderTypes.join(', ') };
    }
    buildConflictClause() {
        if (!this.conflictBuilder)
            return '';
        let clause = this.conflictColumns && this.conflictColumns.length > 0
            ? format(' ON CONFLICT (%I)', this.conflictColumns)
            : ' ON CONFLICT';
        if (this.conflictBuilder.action === 'update') {
            const updateSql = buildConflictUpdateSql(this.conflictBuilder.updateData, this.tableName);
            clause += ` DO UPDATE SET ${updateSql}`;
            if (this.conflictBuilder.whereClause) {
                clause += ` WHERE ${this.conflictBuilder.whereClause}`;
            }
        }
        else {
            clause += ' DO NOTHING';
        }
        return clause;
    }
    toString() {
        if (this.insertData.length === 0) {
            throw new RelqBuilderError('Cannot generate INSERT query: no rows to insert', { builder: 'InsertBuilder', missing: 'data', hint: 'Add rows using addRow() or addRows() first' });
        }
        const originalColumns = Object.keys(this.insertData[0]);
        const columns = originalColumns.map(name => this.resolveColumnName(name));
        const allValuesGroups = [];
        for (const row of this.insertData) {
            const { values, placeholders } = this.processRowValues(row, originalColumns);
            const formattedRow = format(`(${placeholders})`, ...values);
            allValuesGroups.push(formattedRow);
        }
        let query = format('INSERT INTO %I (%I) VALUES %s', this.tableName, columns, allValuesGroups.join(', '));
        query += this.buildConflictClause();
        if (this.returningClause) {
            query += this.buildReturningClause();
        }
        return query;
    }
    parseCountColumns(columnsStr) {
        const columns = [];
        let depth = 0;
        let currentExpr = '';
        let i = 0;
        while (i < columnsStr.length) {
            const char = columnsStr[i];
            if (char === '(')
                depth++;
            else if (char === ')')
                depth--;
            else if (char === ',' && depth === 0) {
                if (currentExpr.trim()) {
                    columns.push(this.parseColumnExpr(currentExpr.trim()));
                }
                currentExpr = '';
                i++;
                continue;
            }
            currentExpr += char;
            i++;
        }
        if (currentExpr.trim()) {
            columns.push(this.parseColumnExpr(currentExpr.trim()));
        }
        return columns;
    }
    parseColumnExpr(expr) {
        const asMatch = expr.match(/^(.+?)\s+AS\s+(.+)$/i);
        if (!asMatch) {
            return { name: 'count', expr };
        }
        const [, expression, alias] = asMatch;
        const name = alias.replace(/^["']|["']$/g, '');
        return { name, expr: expression.trim() };
    }
    buildReturningClause() {
        if (!this.returningClause)
            return '';
        switch (this.returningClause.type) {
            case 'columns': {
                const resolvedColumns = this.returningClause.columns.map(col => col === '*' ? '*' : this.resolveColumnName(col));
                return format(' RETURNING %I', resolvedColumns);
            }
            case 'select': {
                const selectSQL = this.returningClause.builder.toString();
                return ` RETURNING (${selectSQL})`;
            }
            case 'count': {
                const countSQL = this.returningClause.builder.toString();
                const selectMatch = countSQL.match(/^SELECT\s+(.+?)\s+FROM\s+(.+)$/is);
                if (!selectMatch)
                    return ` RETURNING (${countSQL})`;
                const [, columnsStr, fromClause] = selectMatch;
                const columns = this.parseCountColumns(columnsStr);
                const jsonArgs = columns.map(({ name, expr }) => `${format('%L', name)}, ${expr}`).join(', ');
                return ` RETURNING (SELECT json_build_object(${jsonArgs}) FROM ${fromClause})`;
            }
            default:
                return '';
        }
    }
}
