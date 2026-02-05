"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DropTriggerBuilder = exports.CreateTriggerBuilder = void 0;
const pg_format_1 = __importDefault(require("../utils/pg-format.cjs"));
const relq_errors_1 = require("../errors/relq-errors.cjs");
class CreateTriggerBuilder {
    triggerName;
    tableName;
    timing;
    events = [];
    level = 'ROW';
    whenCondition;
    functionCall;
    functionArgs = [];
    updateOfColumns;
    referencingOld;
    referencingNew;
    deferrableFlag;
    initiallyValue;
    orReplaceFlag = false;
    constructor(triggerName) {
        this.triggerName = triggerName;
    }
    on(tableName) {
        this.tableName = tableName;
        return this;
    }
    before(...events) {
        this.timing = 'BEFORE';
        this.events = events;
        return this;
    }
    after(...events) {
        this.timing = 'AFTER';
        this.events = events;
        return this;
    }
    insteadOf(...events) {
        this.timing = 'INSTEAD OF';
        this.events = events;
        return this;
    }
    forEachRow() {
        this.level = 'ROW';
        return this;
    }
    forEachStatement() {
        this.level = 'STATEMENT';
        return this;
    }
    updateOf(...columns) {
        this.updateOfColumns = columns;
        return this;
    }
    when(condition) {
        this.whenCondition = condition;
        return this;
    }
    referencing(oldTable, newTable) {
        this.referencingOld = oldTable;
        this.referencingNew = newTable;
        return this;
    }
    execute(functionName, ...args) {
        this.functionCall = functionName;
        this.functionArgs = args;
        return this;
    }
    deferrable() {
        this.deferrableFlag = true;
        return this;
    }
    initiallyDeferred() {
        this.deferrableFlag = true;
        this.initiallyValue = 'DEFERRED';
        return this;
    }
    initiallyImmediate() {
        this.deferrableFlag = true;
        this.initiallyValue = 'IMMEDIATE';
        return this;
    }
    orReplace() {
        this.orReplaceFlag = true;
        return this;
    }
    toString() {
        if (!this.tableName) {
            throw new relq_errors_1.RelqBuilderError('Table name is required for trigger creation', { builder: 'CreateTriggerBuilder', missing: 'tableName', hint: 'Use .on(tableName)' });
        }
        if (!this.timing || this.events.length === 0) {
            throw new relq_errors_1.RelqBuilderError('Trigger timing and events are required', { builder: 'CreateTriggerBuilder', missing: 'timing/events', hint: 'Use .before(), .after(), or .insteadOf()' });
        }
        if (!this.functionCall) {
            throw new relq_errors_1.RelqBuilderError('Trigger function is required', { builder: 'CreateTriggerBuilder', missing: 'function', hint: 'Use .execute(functionName)' });
        }
        let sql = 'CREATE';
        if (this.orReplaceFlag) {
            sql += ' OR REPLACE';
        }
        sql += ` TRIGGER ${pg_format_1.default.ident(this.triggerName)}`;
        sql += ` ${this.timing}`;
        sql += ` ${this.events.join(' OR ')}`;
        sql += ` ON ${pg_format_1.default.ident(this.tableName)}`;
        if (this.deferrableFlag) {
            sql += ' DEFERRABLE';
            if (this.initiallyValue) {
                sql += ` INITIALLY ${this.initiallyValue}`;
            }
        }
        if (this.referencingOld || this.referencingNew) {
            sql += ' REFERENCING';
            if (this.referencingOld) {
                sql += ` OLD TABLE AS ${pg_format_1.default.ident(this.referencingOld)}`;
            }
            if (this.referencingNew) {
                if (this.referencingOld)
                    sql += ' ';
                sql += `NEW TABLE AS ${pg_format_1.default.ident(this.referencingNew)}`;
            }
        }
        sql += ` FOR EACH ${this.level}`;
        if (this.whenCondition) {
            sql += ` WHEN (${this.whenCondition})`;
        }
        sql += ` EXECUTE FUNCTION ${this.functionCall}`;
        if (this.functionArgs.length > 0) {
            const args = this.functionArgs.map(arg => (0, pg_format_1.default)('%L', arg)).join(', ');
            sql = sql.replace(this.functionCall, `${this.functionCall}(${args})`);
        }
        else if (!this.functionCall.includes('(')) {
            sql += '()';
        }
        return sql;
    }
}
exports.CreateTriggerBuilder = CreateTriggerBuilder;
class DropTriggerBuilder {
    triggerName;
    tableName;
    ifExistsFlag = false;
    cascadeFlag = false;
    constructor(triggerName, tableName) {
        this.triggerName = triggerName;
        this.tableName = tableName;
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
    toString() {
        let sql = 'DROP TRIGGER';
        if (this.ifExistsFlag) {
            sql += ' IF EXISTS';
        }
        sql += ` ${pg_format_1.default.ident(this.triggerName)} ON ${pg_format_1.default.ident(this.tableName)}`;
        if (this.cascadeFlag) {
            sql += ' CASCADE';
        }
        return sql;
    }
}
exports.DropTriggerBuilder = DropTriggerBuilder;
