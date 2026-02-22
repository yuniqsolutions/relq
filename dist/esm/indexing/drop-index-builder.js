import format from "../utils/pg-format.js";
export class DropIndexBuilder {
    indexName;
    ifExistsFlag = false;
    cascadeFlag = false;
    concurrentlyFlag = false;
    constructor(indexName) {
        this.indexName = indexName;
    }
    ifExists() {
        this.ifExistsFlag = true;
        return this;
    }
    cascade() {
        this.cascadeFlag = true;
        return this;
    }
    restrict() {
        this.cascadeFlag = false;
        return this;
    }
    concurrently() {
        this.concurrentlyFlag = true;
        return this;
    }
    toString() {
        let sql = 'DROP INDEX';
        if (this.concurrentlyFlag) {
            sql += ' CONCURRENTLY';
        }
        if (this.ifExistsFlag) {
            sql += ' IF EXISTS';
        }
        sql += ` ${format.ident(this.indexName)}`;
        if (this.cascadeFlag) {
            sql += ' CASCADE';
        }
        return sql;
    }
}
export class ReindexBuilder {
    target;
    name;
    concurrentlyFlag = false;
    tablespaceValue;
    verboseFlag = false;
    constructor(target, name) {
        this.target = target;
        this.name = name;
    }
    concurrently() {
        this.concurrentlyFlag = true;
        return this;
    }
    tablespace(name) {
        this.tablespaceValue = name;
        return this;
    }
    verbose() {
        this.verboseFlag = true;
        return this;
    }
    toString() {
        let sql = 'REINDEX';
        const options = [];
        if (this.concurrentlyFlag)
            options.push('CONCURRENTLY');
        if (this.verboseFlag)
            options.push('VERBOSE');
        if (this.tablespaceValue)
            options.push(`TABLESPACE ${format.ident(this.tablespaceValue)}`);
        if (options.length > 0) {
            sql += ` (${options.join(', ')})`;
        }
        sql += ` ${this.target}`;
        if (this.target !== 'SYSTEM') {
            sql += ` ${format.ident(this.name)}`;
        }
        return sql;
    }
}
