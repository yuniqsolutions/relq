"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectedInsertFromSelectBuilder = void 0;
const methods_1 = require("./methods.cjs");
const ReturningExecutor_1 = require("./ReturningExecutor.cjs");
const capability_guard_1 = require("./capability-guard.cjs");
class ConnectedInsertFromSelectBuilder {
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
        if (!this.tableName && !this.schemaKey)
            return;
        const internal = this.relq[methods_1.INTERNAL];
        const tableDef = internal.getTableDef(this.schemaKey || this.tableName);
        if (!tableDef)
            return;
        const tableColumns = tableDef.$columns || tableDef;
        this.builder.setColumnResolver((column) => {
            const columnDef = tableColumns[column];
            if (columnDef) {
                return columnDef.$columnName || column;
            }
            return column;
        });
    }
    doNothing(...args) {
        const columns = [...new Set(args.flat())];
        this.builder.onConflictDoNothing(columns.length > 0 ? columns : undefined);
        return this;
    }
    doUpdate(columns, updateData) {
        const cols = Array.isArray(columns) ? columns : [columns];
        this.builder.onConflictDoUpdate(cols, updateData);
        return this;
    }
    toString() {
        return this.builder.toString();
    }
    async run(withMetadata) {
        (0, methods_1.debugLog)(this.relq[methods_1.INTERNAL]?.config, `ConnectedInsertFromSelectBuilder.run called for table: ${this.builder.tableName}`);
        const sql = this.builder.toString();
        const result = await this.relq[methods_1.INTERNAL].executeRun(sql);
        if (withMetadata) {
            return result;
        }
        return result.metadata.rowCount ?? 0;
    }
    returning(columns) {
        if (columns === null) {
            return this;
        }
        (0, capability_guard_1.requireCapability)(this.relq, 'returning', 'RETURNING clause', 'Use a SELECT query after the INSERT to retrieve inserted data');
        this.builder.returning(columns);
        return new ReturningExecutor_1.ReturningExecutor(this.builder, this.relq, this.tableName, this.schemaKey);
    }
}
exports.ConnectedInsertFromSelectBuilder = ConnectedInsertFromSelectBuilder;
