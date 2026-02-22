"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DropTableBuilder = exports.AlterTableBuilder = void 0;
const pg_format_1 = __importDefault(require("../utils/pg-format.cjs"));
const relq_errors_1 = require("../errors/relq-errors.cjs");
class AlterTableBuilder {
    tableName;
    actions = [];
    constructor(tableName) {
        this.tableName = tableName;
    }
    addColumn(name, definition, ifNotExists = false) {
        const ifNotExistsClause = ifNotExists ? 'IF NOT EXISTS ' : '';
        if (typeof definition === 'string') {
            this.actions.push(`ADD COLUMN ${ifNotExistsClause}${pg_format_1.default.ident(name)} ${definition}`);
        }
        else {
            let colDef = pg_format_1.default.ident(name) + ' ' + definition.type;
            if (definition.generated) {
                const generatedType = definition.generated.always !== false ? 'ALWAYS' : 'BY DEFAULT';
                colDef += ` GENERATED ${generatedType} AS (${definition.generated.expression}) STORED`;
            }
            else {
                if (definition.nullable === false)
                    colDef += ' NOT NULL';
                if (definition.default !== undefined)
                    colDef += ` DEFAULT ${(0, pg_format_1.default)('%L', definition.default)}`;
            }
            this.actions.push(`ADD COLUMN ${ifNotExistsClause}${colDef}`);
        }
        return this;
    }
    dropColumn(name, ifExists = false, cascade = false) {
        const ifExistsClause = ifExists ? 'IF EXISTS ' : '';
        const cascadeClause = cascade ? ' CASCADE' : '';
        this.actions.push(`DROP COLUMN ${ifExistsClause}${pg_format_1.default.ident(name)}${cascadeClause}`);
        return this;
    }
    renameColumn(oldName, newName) {
        this.actions.push(`RENAME COLUMN ${pg_format_1.default.ident(oldName)} TO ${pg_format_1.default.ident(newName)}`);
        return this;
    }
    alterColumnType(name, newType, using) {
        let action = `ALTER COLUMN ${pg_format_1.default.ident(name)} TYPE ${newType}`;
        if (using)
            action += ` USING ${using}`;
        this.actions.push(action);
        return this;
    }
    setColumnDefault(name, defaultValue) {
        this.actions.push(`ALTER COLUMN ${pg_format_1.default.ident(name)} SET DEFAULT ${(0, pg_format_1.default)('%L', defaultValue)}`);
        return this;
    }
    dropColumnDefault(name) {
        this.actions.push(`ALTER COLUMN ${pg_format_1.default.ident(name)} DROP DEFAULT`);
        return this;
    }
    setColumnNotNull(name) {
        this.actions.push(`ALTER COLUMN ${pg_format_1.default.ident(name)} SET NOT NULL`);
        return this;
    }
    dropColumnNotNull(name) {
        this.actions.push(`ALTER COLUMN ${pg_format_1.default.ident(name)} DROP NOT NULL`);
        return this;
    }
    addConstraint(name, constraint) {
        this.actions.push(`ADD CONSTRAINT ${pg_format_1.default.ident(name)} ${constraint}`);
        return this;
    }
    dropConstraint(name, ifExists = false, cascade = false) {
        const ifExistsClause = ifExists ? 'IF EXISTS ' : '';
        const cascadeClause = cascade ? ' CASCADE' : '';
        this.actions.push(`DROP CONSTRAINT ${ifExistsClause}${pg_format_1.default.ident(name)}${cascadeClause}`);
        return this;
    }
    renameTo(newName) {
        this.actions.push(`RENAME TO ${pg_format_1.default.ident(newName)}`);
        return this;
    }
    setSchema(schemaName) {
        this.actions.push(`SET SCHEMA ${pg_format_1.default.ident(schemaName)}`);
        return this;
    }
    setTablespace(tablespaceName) {
        this.actions.push(`SET TABLESPACE ${pg_format_1.default.ident(tablespaceName)}`);
        return this;
    }
    enableTrigger(triggerName) {
        this.actions.push(`ENABLE TRIGGER ${pg_format_1.default.ident(triggerName)}`);
        return this;
    }
    disableTrigger(triggerName) {
        this.actions.push(`DISABLE TRIGGER ${pg_format_1.default.ident(triggerName)}`);
        return this;
    }
    enableAllTriggers() {
        this.actions.push('ENABLE TRIGGER ALL');
        return this;
    }
    disableAllTriggers() {
        this.actions.push('DISABLE TRIGGER ALL');
        return this;
    }
    toString() {
        if (this.actions.length === 0) {
            throw new relq_errors_1.RelqBuilderError('No ALTER TABLE actions specified', { builder: 'AlterTableBuilder', missing: 'actions', hint: 'Use addColumn(), dropColumn(), or other methods' });
        }
        return `ALTER TABLE ${pg_format_1.default.ident(this.tableName)} ${this.actions.join(', ')}`;
    }
}
exports.AlterTableBuilder = AlterTableBuilder;
class DropTableBuilder {
    tableName;
    ifExistsFlag = false;
    cascadeFlag = false;
    constructor(tableName) {
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
        let sql = 'DROP TABLE';
        if (this.ifExistsFlag) {
            sql += ' IF EXISTS';
        }
        sql += ` ${pg_format_1.default.ident(this.tableName)}`;
        if (this.cascadeFlag) {
            sql += ' CASCADE';
        }
        return sql;
    }
}
exports.DropTableBuilder = DropTableBuilder;
