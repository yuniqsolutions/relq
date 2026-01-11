"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InsertBuilder = void 0;
const pg_format_1 = __importDefault(require("../addon/pg-format/index.cjs"));
const case_converter_1 = require("../utils/case-converter.cjs");
const select_builder_1 = require("../select/select-builder.cjs");
const count_builder_1 = require("../count/count-builder.cjs");
const conflict_builder_1 = require("./conflict-builder.cjs");
const relq_errors_1 = require("../errors/relq-errors.cjs");
class InsertBuilder {
    tableName;
    insertData;
    conflictColumns;
    conflictBuilder;
    returningClause;
    _case = 'keep-case';
    _convertCase = '2snake';
    originalColumns;
    columnResolver;
    constructor(tableName, data) {
        this.tableName = tableName;
        this.insertData = [data];
        this.originalColumns = Object.keys(data).sort();
    }
    setColumnResolver(resolver) {
        this.columnResolver = resolver;
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
            throw new relq_errors_1.RelqBuilderError(`Column count mismatch: expected ${this.originalColumns.length} columns, got ${newColumns.length}`, { builder: 'InsertBuilder', hint: `Expected columns: [${this.originalColumns.join(', ')}]` });
        }
        for (let i = 0; i < this.originalColumns.length; i++) {
            if (this.originalColumns[i] !== newColumns[i]) {
                throw new relq_errors_1.RelqBuilderError('Column name mismatch: all rows must have the exact same column names', { builder: 'InsertBuilder', hint: `Expected columns: [${this.originalColumns.join(', ')}]` });
            }
        }
    }
    addRow(row) {
        if (this.insertData.length === 0) {
            this.originalColumns = Object.keys(row).sort();
        }
        else {
            this.validateColumns(row);
        }
        this.insertData.push(row);
        return this;
    }
    addRows(rows) {
        if (rows.length === 0)
            return this;
        if (this.insertData.length === 0) {
            this.originalColumns = Object.keys(rows[0]).sort();
        }
        for (const row of rows) {
            this.validateColumns(row);
        }
        this.insertData.push(...rows);
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
    onConflict(columns, callback) {
        this.conflictColumns = Array.isArray(columns) ? columns : [columns];
        this.conflictBuilder = new conflict_builder_1.ConflictBuilder(this.tableName);
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
        const builder = new select_builder_1.SelectBuilder(this.tableName);
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
        const builder = new count_builder_1.CountBuilder(this.tableName);
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
            return (0, case_converter_1.convertCase)(name, this._convertCase);
        return name;
    }
    formatArrayValue(value) {
        if (value.length === 0)
            return 'ARRAY[]::jsonb[]';
        const jsonValues = value.map(v => (0, pg_format_1.default)('%L', JSON.stringify(v))).join(',');
        return `ARRAY[${jsonValues}]::jsonb[]`;
    }
    processRowValues(row, originalColumns) {
        const processedValues = [];
        const placeholderTypes = [];
        for (const colName of originalColumns) {
            const value = row[colName];
            if (Array.isArray(value)) {
                processedValues.push(this.formatArrayValue(value));
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
        if (!this.conflictColumns || !this.conflictBuilder)
            return '';
        if (this.insertData.length > 1) {
            throw new relq_errors_1.RelqBuilderError('ON CONFLICT (upsert) is not supported with multiple row inserts', { builder: 'InsertBuilder', hint: 'Use single row insert for upsert operations' });
        }
        let clause = (0, pg_format_1.default)(' ON CONFLICT (%I)', this.conflictColumns);
        if (this.conflictBuilder.action === 'update') {
            const updateSql = (0, conflict_builder_1.buildConflictUpdateSql)(this.conflictBuilder.updateData, this.tableName);
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
            throw new relq_errors_1.RelqBuilderError('Cannot generate INSERT query: no rows to insert', { builder: 'InsertBuilder', missing: 'data', hint: 'Add rows using addRow() or addRows() first' });
        }
        const originalColumns = Object.keys(this.insertData[0]);
        const columns = originalColumns.map(name => this.resolveColumnName(name));
        const allValuesGroups = [];
        for (const row of this.insertData) {
            const { values, placeholders } = this.processRowValues(row, originalColumns);
            const formattedRow = (0, pg_format_1.default)(`(${placeholders})`, ...values);
            allValuesGroups.push(formattedRow);
        }
        let query = (0, pg_format_1.default)('INSERT INTO %I (%I) VALUES %s', this.tableName, columns, allValuesGroups.join(', '));
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
                return (0, pg_format_1.default)(' RETURNING %I', resolvedColumns);
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
                const jsonArgs = columns.map(({ name, expr }) => `${(0, pg_format_1.default)('%L', name)}, ${expr}`).join(', ');
                return ` RETURNING (SELECT json_build_object(${jsonArgs}) FROM ${fromClause})`;
            }
            default:
                return '';
        }
    }
}
exports.InsertBuilder = InsertBuilder;
