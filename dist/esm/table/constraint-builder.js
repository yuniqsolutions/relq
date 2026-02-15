import format from "../utils/pg-format.js";
export class ConstraintBuilder {
    constraints = [];
    addPrimaryKey(columns, name) {
        this.constraints.push({
            type: 'PRIMARY KEY',
            name,
            columns
        });
        return this;
    }
    addForeignKey(config) {
        this.constraints.push({
            type: 'FOREIGN KEY',
            name: config.name,
            columns: config.columns,
            references: config.references,
            onDelete: config.onDelete,
            onUpdate: config.onUpdate,
            deferrable: config.deferrable,
            initially: config.initially
        });
        return this;
    }
    addUnique(columns, name) {
        this.constraints.push({
            type: 'UNIQUE',
            name,
            columns
        });
        return this;
    }
    addCheck(condition, name) {
        this.constraints.push({
            type: 'CHECK',
            name,
            definition: condition
        });
        return this;
    }
    addExclusion(constraint, using = 'GIST', name) {
        this.constraints.push({
            type: 'EXCLUSION',
            name,
            definition: constraint,
            using
        });
        return this;
    }
    getConstraints() {
        return this.constraints;
    }
    static buildConstraintSQL(constraint) {
        let sql = '';
        if (constraint.name) {
            sql += `CONSTRAINT ${format.ident(constraint.name)} `;
        }
        switch (constraint.type) {
            case 'PRIMARY KEY':
                sql += `PRIMARY KEY (${constraint.columns.map(c => format.ident(c)).join(', ')})`;
                break;
            case 'FOREIGN KEY': {
                const cols = constraint.columns.map(c => format.ident(c)).join(', ');
                const refCols = constraint.references.columns.map(c => format.ident(c)).join(', ');
                sql += `FOREIGN KEY (${cols}) REFERENCES ${format.ident(constraint.references.table)} (${refCols})`;
                if (constraint.onDelete) {
                    sql += ` ON DELETE ${constraint.onDelete}`;
                }
                if (constraint.onUpdate) {
                    sql += ` ON UPDATE ${constraint.onUpdate}`;
                }
                if (constraint.deferrable) {
                    sql += ' DEFERRABLE';
                    if (constraint.initially) {
                        sql += ` INITIALLY ${constraint.initially}`;
                    }
                }
                break;
            }
            case 'UNIQUE':
                sql += `UNIQUE (${constraint.columns.map(c => format.ident(c)).join(', ')})`;
                break;
            case 'CHECK':
                sql += `CHECK (${constraint.definition})`;
                break;
            case 'EXCLUSION':
                sql += `EXCLUDE USING ${constraint.using} (${constraint.definition})`;
                break;
        }
        return sql;
    }
    buildAllConstraintsSQL() {
        return this.constraints.map(c => ConstraintBuilder.buildConstraintSQL(c));
    }
}
