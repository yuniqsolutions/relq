import format from "../utils/pg-format.js";
export class CreateIndexBuilder {
    tableName;
    indexName;
    indexType;
    columns = [];
    expressionIndex;
    whereClause;
    includeColumns = [];
    withOptions = {};
    concurrentFlag = false;
    ifNotExistsFlag = false;
    uniqueFlag = false;
    tablespaceValue;
    operatorClass;
    constructor(tableName, indexName) {
        this.tableName = tableName;
        this.indexName = indexName;
    }
    btree(columns) {
        this.indexType = 'BTREE';
        this.columns = this.normalizeColumns(columns);
        return this;
    }
    hash(column) {
        this.indexType = 'HASH';
        this.columns = [{ column }];
        return this;
    }
    gin(columns, opClass) {
        this.indexType = 'GIN';
        this.columns = columns.map(col => ({ column: col }));
        if (opClass) {
            this.operatorClass = opClass;
        }
        return this;
    }
    gist(columns, opClass) {
        this.indexType = 'GIST';
        this.columns = columns.map(col => ({ column: col }));
        if (opClass) {
            this.operatorClass = opClass;
        }
        return this;
    }
    brin(columns, pagesPerRange) {
        this.indexType = 'BRIN';
        this.columns = columns.map(col => ({ column: col }));
        if (pagesPerRange) {
            this.withOptions.pages_per_range = pagesPerRange;
        }
        return this;
    }
    spgist(columns) {
        this.indexType = 'SPGIST';
        this.columns = columns.map(col => ({ column: col }));
        return this;
    }
    bloom(columns, options) {
        this.indexType = 'BLOOM';
        this.columns = columns.map(col => ({ column: col }));
        if (options) {
            this.withOptions = { ...this.withOptions, ...options };
        }
        return this;
    }
    unique() {
        this.uniqueFlag = true;
        return this;
    }
    where(condition) {
        this.whereClause = condition;
        return this;
    }
    partial(condition) {
        return this.where(condition);
    }
    include(...columns) {
        this.includeColumns.push(...columns);
        return this;
    }
    with(options) {
        this.withOptions = { ...this.withOptions, ...options };
        return this;
    }
    concurrently() {
        this.concurrentFlag = true;
        return this;
    }
    ifNotExists() {
        this.ifNotExistsFlag = true;
        return this;
    }
    tablespace(name) {
        this.tablespaceValue = name;
        return this;
    }
    expression(expr) {
        this.expressionIndex = expr;
        return this;
    }
    fillfactor(percent) {
        this.withOptions.fillfactor = percent;
        return this;
    }
    normalizeColumns(columns) {
        return columns.map(col => {
            if (typeof col === 'string') {
                return { column: col };
            }
            return col;
        });
    }
    formatColumn(col) {
        let result = format.ident(col.column);
        if (col.collation) {
            result += ` COLLATE ${format.ident(col.collation)}`;
        }
        if (col.opclass) {
            result += ` ${col.opclass}`;
        }
        else if (this.operatorClass && this.columns.length === 1) {
            result += ` ${this.operatorClass}`;
        }
        if (col.order) {
            result += ` ${col.order}`;
        }
        if (col.nulls) {
            result += ` NULLS ${col.nulls}`;
        }
        return result;
    }
    toString() {
        let sql = 'CREATE';
        if (this.uniqueFlag) {
            sql += ' UNIQUE';
        }
        sql += ' INDEX';
        if (this.concurrentFlag) {
            sql += ' CONCURRENTLY';
        }
        if (this.ifNotExistsFlag) {
            sql += ' IF NOT EXISTS';
        }
        sql += ` ${format.ident(this.indexName)} ON ${format.ident(this.tableName)}`;
        if (this.indexType && this.indexType !== 'BTREE') {
            sql += ` USING ${this.indexType}`;
        }
        if (this.expressionIndex) {
            sql += ` (${this.expressionIndex})`;
        }
        else if (this.columns.length > 0) {
            const columnDefs = this.columns.map(col => this.formatColumn(col));
            if ((this.indexType === 'GIN' || this.indexType === 'GIST') &&
                this.operatorClass &&
                this.columns.length > 1) {
                sql += ` (${columnDefs.join(', ')}) ${this.operatorClass}`;
            }
            else {
                sql += ` (${columnDefs.join(', ')})`;
            }
        }
        if (this.includeColumns.length > 0) {
            sql += ` INCLUDE (${this.includeColumns.map(c => format.ident(c)).join(', ')})`;
        }
        if (Object.keys(this.withOptions).length > 0) {
            const options = Object.entries(this.withOptions)
                .map(([key, value]) => `${key} = ${typeof value === 'boolean' ? (value ? 'on' : 'off') : value}`)
                .join(', ');
            sql += ` WITH (${options})`;
        }
        if (this.tablespaceValue) {
            sql += ` TABLESPACE ${format.ident(this.tablespaceValue)}`;
        }
        if (this.whereClause) {
            sql += ` WHERE ${this.whereClause}`;
        }
        return sql;
    }
}
