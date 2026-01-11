import { debugLog, INTERNAL } from "./methods.js";
import { ReturningExecutor } from "./ReturningExecutor.js";
export class ConnectedInsertBuilder {
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
        const internal = this.relq[INTERNAL];
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
        debugLog(this.relq[INTERNAL]?.config, `ConnectedInsertBuilder.run called for table: ${this.builder.tableName}`);
        const internalRelq = this.relq[INTERNAL];
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
        return new ReturningExecutor(this.builder, this.relq, this.tableName, this.schemaKey);
    }
}
