import format from "../utils/pg-format.js";
export class PartitionBuilder {
    strategy;
    columns = [];
    range(...columns) {
        this.strategy = 'RANGE';
        this.columns = columns;
        return this;
    }
    list(column) {
        this.strategy = 'LIST';
        this.columns = [column];
        return this;
    }
    hash(column) {
        this.strategy = 'HASH';
        this.columns = [column];
        return this;
    }
    getStrategy() {
        return this.strategy;
    }
    getColumns() {
        return this.columns;
    }
    buildPartitionBySQL() {
        if (!this.strategy || this.columns.length === 0) {
            return '';
        }
        const cols = this.columns.map(c => format.ident(c)).join(', ');
        return ` PARTITION BY ${this.strategy} (${cols})`;
    }
}
export class CreatePartitionBuilder {
    partitionName;
    parentTable;
    forValuesClause;
    tablespaceValue;
    withOptions;
    constructor(partitionName, parentTable) {
        this.partitionName = partitionName;
        this.parentTable = parentTable;
    }
    forValues(specification) {
        this.forValuesClause = specification;
        return this;
    }
    tablespace(name) {
        this.tablespaceValue = name;
        return this;
    }
    with(options) {
        this.withOptions = options;
        return this;
    }
    toString() {
        let sql = format('CREATE TABLE %I PARTITION OF %I', this.partitionName, this.parentTable);
        if (this.forValuesClause) {
            sql += ` FOR VALUES ${this.forValuesClause}`;
        }
        if (this.withOptions && Object.keys(this.withOptions).length > 0) {
            const options = Object.entries(this.withOptions)
                .map(([key, value]) => `${key} = ${value}`)
                .join(', ');
            sql += ` WITH (${options})`;
        }
        if (this.tablespaceValue) {
            sql += ` TABLESPACE ${format.ident(this.tablespaceValue)}`;
        }
        return sql;
    }
}
export class AttachPartitionBuilder {
    parentTable;
    partitionName;
    forValuesClause;
    concurrentFlag = false;
    constructor(parentTable, partitionName) {
        this.parentTable = parentTable;
        this.partitionName = partitionName;
    }
    forValues(specification) {
        this.forValuesClause = specification;
        return this;
    }
    toString() {
        let sql = format('ALTER TABLE %I ATTACH PARTITION %I', this.parentTable, this.partitionName);
        if (this.forValuesClause) {
            sql += ` FOR VALUES ${this.forValuesClause}`;
        }
        return sql;
    }
}
export class DetachPartitionBuilder {
    parentTable;
    partitionName;
    concurrentFlag = false;
    finalizeFlag = false;
    constructor(parentTable, partitionName) {
        this.parentTable = parentTable;
        this.partitionName = partitionName;
    }
    concurrently() {
        this.concurrentFlag = true;
        return this;
    }
    finalize() {
        this.finalizeFlag = true;
        return this;
    }
    toString() {
        let sql = format('ALTER TABLE %I DETACH PARTITION %I', this.parentTable, this.partitionName);
        if (this.concurrentFlag) {
            sql += ' CONCURRENTLY';
        }
        if (this.finalizeFlag) {
            sql += ' FINALIZE';
        }
        return sql;
    }
}
