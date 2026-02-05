import format from "../utils/pg-format.js";
import { RelqBuilderError } from "../errors/relq-errors.js";
export class AlterTableBuilder {
    tableName;
    actions = [];
    constructor(tableName) {
        this.tableName = tableName;
    }
    addColumn(name, definition, ifNotExists = false) {
        const ifNotExistsClause = ifNotExists ? 'IF NOT EXISTS ' : '';
        if (typeof definition === 'string') {
            this.actions.push(`ADD COLUMN ${ifNotExistsClause}${format.ident(name)} ${definition}`);
        }
        else {
            let colDef = format.ident(name) + ' ' + definition.type;
            if (definition.generated) {
                const generatedType = definition.generated.always !== false ? 'ALWAYS' : 'BY DEFAULT';
                colDef += ` GENERATED ${generatedType} AS (${definition.generated.expression}) STORED`;
            }
            else {
                if (definition.nullable === false)
                    colDef += ' NOT NULL';
                if (definition.default !== undefined)
                    colDef += ` DEFAULT ${format('%L', definition.default)}`;
            }
            this.actions.push(`ADD COLUMN ${ifNotExistsClause}${colDef}`);
        }
        return this;
    }
    dropColumn(name, ifExists = false, cascade = false) {
        const ifExistsClause = ifExists ? 'IF EXISTS ' : '';
        const cascadeClause = cascade ? ' CASCADE' : '';
        this.actions.push(`DROP COLUMN ${ifExistsClause}${format.ident(name)}${cascadeClause}`);
        return this;
    }
    renameColumn(oldName, newName) {
        this.actions.push(`RENAME COLUMN ${format.ident(oldName)} TO ${format.ident(newName)}`);
        return this;
    }
    alterColumnType(name, newType, using) {
        let action = `ALTER COLUMN ${format.ident(name)} TYPE ${newType}`;
        if (using)
            action += ` USING ${using}`;
        this.actions.push(action);
        return this;
    }
    setColumnDefault(name, defaultValue) {
        this.actions.push(`ALTER COLUMN ${format.ident(name)} SET DEFAULT ${format('%L', defaultValue)}`);
        return this;
    }
    dropColumnDefault(name) {
        this.actions.push(`ALTER COLUMN ${format.ident(name)} DROP DEFAULT`);
        return this;
    }
    setColumnNotNull(name) {
        this.actions.push(`ALTER COLUMN ${format.ident(name)} SET NOT NULL`);
        return this;
    }
    dropColumnNotNull(name) {
        this.actions.push(`ALTER COLUMN ${format.ident(name)} DROP NOT NULL`);
        return this;
    }
    addConstraint(name, constraint) {
        this.actions.push(`ADD CONSTRAINT ${format.ident(name)} ${constraint}`);
        return this;
    }
    dropConstraint(name, ifExists = false, cascade = false) {
        const ifExistsClause = ifExists ? 'IF EXISTS ' : '';
        const cascadeClause = cascade ? ' CASCADE' : '';
        this.actions.push(`DROP CONSTRAINT ${ifExistsClause}${format.ident(name)}${cascadeClause}`);
        return this;
    }
    renameTo(newName) {
        this.actions.push(`RENAME TO ${format.ident(newName)}`);
        return this;
    }
    setSchema(schemaName) {
        this.actions.push(`SET SCHEMA ${format.ident(schemaName)}`);
        return this;
    }
    setTablespace(tablespaceName) {
        this.actions.push(`SET TABLESPACE ${format.ident(tablespaceName)}`);
        return this;
    }
    enableTrigger(triggerName) {
        this.actions.push(`ENABLE TRIGGER ${format.ident(triggerName)}`);
        return this;
    }
    disableTrigger(triggerName) {
        this.actions.push(`DISABLE TRIGGER ${format.ident(triggerName)}`);
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
            throw new RelqBuilderError('No ALTER TABLE actions specified', { builder: 'AlterTableBuilder', missing: 'actions', hint: 'Use addColumn(), dropColumn(), or other methods' });
        }
        return `ALTER TABLE ${format.ident(this.tableName)} ${this.actions.join(', ')}`;
    }
}
export class DropTableBuilder {
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
        sql += ` ${format.ident(this.tableName)}`;
        if (this.cascadeFlag) {
            sql += ' CASCADE';
        }
        return sql;
    }
}
