"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectedInsertBuilder = void 0;
const methods_1 = require("./methods.cjs");
const ReturningExecutor_1 = require("./ReturningExecutor.cjs");
class ConnectedInsertBuilder {
    builder;
    relq;
    tableName;
    schemaKey;
    constructor(builder, relq, tableName, schemaKey) {
        this.builder = builder;
        this.relq = relq;
        this.tableName = tableName;
        this.schemaKey = schemaKey;
        this.setupColumnResolver();
    }
    setupColumnResolver() {
        if (!this.tableName && !this.schemaKey) {
            return;
        }
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
    addRow(row) {
        this.builder.addRow(row);
        return this;
    }
    addRows(rows) {
        this.builder.addRows(rows);
        return this;
    }
    clear() {
        this.builder.clear();
        return this;
    }
    get total() {
        return this.builder.total;
    }
    onConflict(columns, callback) {
        const cols = Array.isArray(columns) ? columns : [columns];
        this.builder.onConflict(cols, (conflictBuilder) => {
            callback(conflictBuilder);
        });
        return this;
    }
    toString() {
        return this.builder.toString();
    }
    async run(withMetadata) {
        (0, methods_1.debugLog)(this.relq[methods_1.INTERNAL]?.config, `ConnectedInsertBuilder.run called for table: ${this.builder.tableName}`);
        const internalRelq = this.relq[methods_1.INTERNAL];
        for (const row of this.builder.insertData) {
            internalRelq.validateData(this.builder.tableName, row, 'insert');
        }
        const sql = this.builder.toString();
        const result = await internalRelq.executeRun(sql);
        if (withMetadata) {
            return result;
        }
        return result.metadata.rowCount ?? 0;
    }
    returning(columns) {
        if (columns === null) {
            return this;
        }
        this.builder.returning(columns);
        return new ReturningExecutor_1.ReturningExecutor(this.builder, this.relq, this.tableName, this.schemaKey);
    }
}
exports.ConnectedInsertBuilder = ConnectedInsertBuilder;
