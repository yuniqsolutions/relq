import format from "../utils/pg-format.js";
export class CreateSequenceBuilder {
    sequenceName;
    options = {};
    ifNotExistsFlag = false;
    temporaryFlag = false;
    unloggedFlag = false;
    constructor(sequenceName) {
        this.sequenceName = sequenceName;
    }
    ifNotExists() {
        this.ifNotExistsFlag = true;
        return this;
    }
    temporary() {
        this.temporaryFlag = true;
        return this;
    }
    unlogged() {
        this.unloggedFlag = true;
        return this;
    }
    as(type) {
        this.options.as = type;
        return this;
    }
    start(value) {
        this.options.start = value;
        return this;
    }
    increment(value) {
        this.options.increment = value;
        return this;
    }
    minValue(value) {
        this.options.minValue = value;
        return this;
    }
    maxValue(value) {
        this.options.maxValue = value;
        return this;
    }
    noMinValue() {
        this.options.minValue = undefined;
        return this;
    }
    noMaxValue() {
        this.options.maxValue = undefined;
        return this;
    }
    cache(count) {
        this.options.cache = count;
        return this;
    }
    cycle() {
        this.options.cycle = true;
        return this;
    }
    noCycle() {
        this.options.cycle = false;
        return this;
    }
    ownedBy(tableColumn) {
        this.options.ownedBy = tableColumn;
        return this;
    }
    ownedByNone() {
        this.options.ownedBy = 'NONE';
        return this;
    }
    toString() {
        let sql = 'CREATE';
        if (this.temporaryFlag) {
            sql += ' TEMPORARY';
        }
        if (this.unloggedFlag) {
            sql += ' UNLOGGED';
        }
        sql += ' SEQUENCE';
        if (this.ifNotExistsFlag) {
            sql += ' IF NOT EXISTS';
        }
        sql += ' ' + format.ident(this.sequenceName);
        if (this.options.as) {
            sql += ` AS ${this.options.as}`;
        }
        if (this.options.increment !== undefined) {
            sql += ` INCREMENT BY ${this.options.increment}`;
        }
        if (this.options.minValue !== undefined) {
            sql += ` MINVALUE ${this.options.minValue}`;
        }
        if (this.options.maxValue !== undefined) {
            sql += ` MAXVALUE ${this.options.maxValue}`;
        }
        if (this.options.start !== undefined) {
            sql += ` START WITH ${this.options.start}`;
        }
        if (this.options.cache !== undefined) {
            sql += ` CACHE ${this.options.cache}`;
        }
        if (this.options.cycle === true) {
            sql += ' CYCLE';
        }
        else if (this.options.cycle === false) {
            sql += ' NO CYCLE';
        }
        if (this.options.ownedBy) {
            sql += ` OWNED BY ${this.options.ownedBy}`;
        }
        return sql;
    }
}
export class AlterSequenceBuilder {
    sequenceName;
    options = {};
    ifExistsFlag = false;
    constructor(sequenceName) {
        this.sequenceName = sequenceName;
    }
    ifExists() {
        this.ifExistsFlag = true;
        return this;
    }
    restart(value) {
        this.options.restart = value ?? true;
        return this;
    }
    as(type) {
        this.options.as = type;
        return this;
    }
    start(value) {
        this.options.start = value;
        return this;
    }
    increment(value) {
        this.options.increment = value;
        return this;
    }
    minValue(value) {
        this.options.minValue = value;
        return this;
    }
    maxValue(value) {
        this.options.maxValue = value;
        return this;
    }
    noMinValue() {
        this.options.minValue = undefined;
        return this;
    }
    noMaxValue() {
        this.options.maxValue = undefined;
        return this;
    }
    cache(count) {
        this.options.cache = count;
        return this;
    }
    cycle() {
        this.options.cycle = true;
        return this;
    }
    noCycle() {
        this.options.cycle = false;
        return this;
    }
    ownedBy(tableColumn) {
        this.options.ownedBy = tableColumn;
        return this;
    }
    ownedByNone() {
        this.options.ownedBy = 'NONE';
        return this;
    }
    toString() {
        let sql = 'ALTER SEQUENCE';
        if (this.ifExistsFlag) {
            sql += ' IF EXISTS';
        }
        sql += ' ' + format.ident(this.sequenceName);
        if (this.options.as) {
            sql += ` AS ${this.options.as}`;
        }
        if (this.options.increment !== undefined) {
            sql += ` INCREMENT BY ${this.options.increment}`;
        }
        if (this.options.minValue !== undefined) {
            sql += ` MINVALUE ${this.options.minValue}`;
        }
        if (this.options.maxValue !== undefined) {
            sql += ` MAXVALUE ${this.options.maxValue}`;
        }
        if (this.options.start !== undefined) {
            sql += ` START WITH ${this.options.start}`;
        }
        if (this.options.cache !== undefined) {
            sql += ` CACHE ${this.options.cache}`;
        }
        if (this.options.cycle === true) {
            sql += ' CYCLE';
        }
        else if (this.options.cycle === false) {
            sql += ' NO CYCLE';
        }
        if (this.options.ownedBy) {
            sql += ` OWNED BY ${this.options.ownedBy}`;
        }
        if (this.options.restart === true) {
            sql += ' RESTART';
        }
        else if (typeof this.options.restart === 'number') {
            sql += ` RESTART WITH ${this.options.restart}`;
        }
        return sql;
    }
}
export class DropSequenceBuilder {
    sequenceNames;
    ifExistsFlag = false;
    cascadeFlag = false;
    restrictFlag = false;
    constructor(sequenceNames) {
        this.sequenceNames = Array.isArray(sequenceNames) ? sequenceNames : [sequenceNames];
    }
    ifExists() {
        this.ifExistsFlag = true;
        return this;
    }
    cascade() {
        this.cascadeFlag = true;
        this.restrictFlag = false;
        return this;
    }
    restrict() {
        this.restrictFlag = true;
        this.cascadeFlag = false;
        return this;
    }
    toString() {
        let sql = 'DROP SEQUENCE';
        if (this.ifExistsFlag) {
            sql += ' IF EXISTS';
        }
        sql += ' ' + this.sequenceNames.map(name => format.ident(name)).join(', ');
        if (this.cascadeFlag) {
            sql += ' CASCADE';
        }
        else if (this.restrictFlag) {
            sql += ' RESTRICT';
        }
        return sql;
    }
}
