"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReturningExecutor = void 0;
const insert_builder_1 = require("../../insert/insert-builder.cjs");
const update_builder_1 = require("../../update/update-builder.cjs");
const methods_1 = require("./methods.cjs");
class ReturningExecutor {
    builder;
    relq;
    tableName;
    schemaKey;
    columnMapping;
    constructor(builder, relq, tableName, schemaKey) {
        this.builder = builder;
        this.relq = relq;
        this.tableName = tableName;
        this.schemaKey = schemaKey;
        this.setupColumnMapping();
    }
    setupColumnMapping() {
        if (!this.tableName && !this.schemaKey) {
            return;
        }
        const internal = this.relq[methods_1.INTERNAL];
        const tableDef = internal.getTableDef(this.schemaKey || this.tableName);
        if (!tableDef) {
            return;
        }
        const tableColumns = tableDef.$columns || tableDef;
        this.columnMapping = new Map();
        for (const [propName, columnDef] of Object.entries(tableColumns)) {
            if (columnDef && typeof columnDef === 'object') {
                const sqlName = columnDef.$columnName || propName;
                this.columnMapping.set(sqlName, propName);
            }
        }
    }
    transformRow(row) {
        if (!this.columnMapping) {
            return row;
        }
        const transformed = {};
        for (const [sqlKey, value] of Object.entries(row)) {
            const propName = this.columnMapping.get(sqlKey) || sqlKey;
            transformed[propName] = value;
        }
        return transformed;
    }
    toString() {
        return this.builder.toString();
    }
    async run(withMetadata) {
        if (this.builder instanceof insert_builder_1.InsertBuilder) {
            for (const row of this.builder.insertData) {
                this.relq[methods_1.INTERNAL].validateData(this.builder.tableName, row, 'insert');
            }
        }
        else if (this.builder instanceof update_builder_1.UpdateBuilder) {
            this.relq[methods_1.INTERNAL].validateData(this.builder.tableName, this.builder.updateData, 'update');
        }
        const sql = this.builder.toString();
        const result = await this.relq[methods_1.INTERNAL].executeSelect(sql);
        const transformedData = result.data.map(row => this.transformRow(row));
        if (withMetadata) {
            return { ...result, data: transformedData };
        }
        return transformedData;
    }
}
exports.ReturningExecutor = ReturningExecutor;
