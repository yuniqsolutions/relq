"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectedInsertBuilder = void 0;
const condition_collector_1 = require("../../condition/condition-collector.cjs");
const methods_1 = require("./methods.cjs");
const ReturningExecutor_1 = require("./ReturningExecutor.cjs");
const capability_guard_1 = require("./capability-guard.cjs");
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
        this.builder.setColumnTypeResolver((column) => {
            const columnDef = tableColumns[column];
            if (!columnDef) {
                return undefined;
            }
            const type = columnDef.$type;
            if (typeof type !== 'string') {
                return undefined;
            }
            const isArray = columnDef.$array === true;
            const baseType = type.replace(/\[\]$/, '').toLowerCase();
            return { type: baseType, isArray };
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
    doNothing(...args) {
        const columns = [...new Set(args.flat())];
        this.builder._onConflict(columns.length > 0 ? columns : null, q => q.doNothing());
        return this;
    }
    doUpdate(columns, values, where) {
        const cols = [...new Set(Array.isArray(columns) ? columns : [columns])];
        this.builder._onConflict(cols, (conflictBuilder) => {
            conflictBuilder.doUpdate(values);
            if (where) {
                const collector = new condition_collector_1.ConditionCollector();
                where(collector);
                const conditions = collector.getConditions();
                if (conditions.length > 0) {
                    const whereClause = (0, condition_collector_1.buildConditionsSQL)(conditions);
                    conflictBuilder.where(whereClause);
                }
            }
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
        (0, capability_guard_1.requireCapability)(this.relq, 'returning', 'RETURNING clause', 'Use a SELECT query after the INSERT to retrieve inserted data');
        this.builder.returning(columns);
        return new ReturningExecutor_1.ReturningExecutor(this.builder, this.relq, this.tableName, this.schemaKey);
    }
}
exports.ConnectedInsertBuilder = ConnectedInsertBuilder;
