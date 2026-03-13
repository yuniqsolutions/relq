import * as fs from 'node:fs';
export function generateMigrationFromComparison(comparison, options = {}) {
    const { includeDown = true } = options;
    const up = [];
    const down = [];
    for (const rename of comparison.renamed.enums) {
        up.push(`ALTER TYPE "${rename.from}" RENAME TO "${rename.to}";`);
        if (includeDown) {
            down.unshift(`ALTER TYPE "${rename.to}" RENAME TO "${rename.from}";`);
        }
    }
    for (const rename of comparison.renamed.sequences) {
        up.push(`ALTER SEQUENCE "${rename.from}" RENAME TO "${rename.to}";`);
        if (includeDown) {
            down.unshift(`ALTER SEQUENCE "${rename.to}" RENAME TO "${rename.from}";`);
        }
    }
    for (const rename of comparison.renamed.tables) {
        up.push(`ALTER TABLE "${rename.from}" RENAME TO "${rename.to}";`);
        if (includeDown) {
            down.unshift(`ALTER TABLE "${rename.to}" RENAME TO "${rename.from}";`);
        }
    }
    for (const rename of comparison.renamed.columns) {
        up.push(`ALTER TABLE "${rename.table}" RENAME COLUMN "${rename.from}" TO "${rename.to}";`);
        if (includeDown) {
            down.unshift(`ALTER TABLE "${rename.table}" RENAME COLUMN "${rename.to}" TO "${rename.from}";`);
        }
    }
    for (const rename of comparison.renamed.indexes) {
        up.push(`ALTER INDEX "${rename.from}" RENAME TO "${rename.to}";`);
        if (includeDown) {
            down.unshift(`ALTER INDEX "${rename.to}" RENAME TO "${rename.from}";`);
        }
    }
    for (const rename of comparison.renamed.functions) {
        const argSig = rename.argTypes?.length ? `(${rename.argTypes.join(', ')})` : '';
        up.push(`ALTER FUNCTION "${rename.from}"${argSig} RENAME TO "${rename.to}";`);
        if (includeDown) {
            down.unshift(`ALTER FUNCTION "${rename.to}"${argSig} RENAME TO "${rename.from}";`);
        }
    }
    for (const rename of comparison.renamed.constraints) {
        up.push(`ALTER TABLE "${rename.table}" RENAME CONSTRAINT "${rename.from}" TO "${rename.to}";`);
        if (includeDown) {
            down.unshift(`ALTER TABLE "${rename.table}" RENAME CONSTRAINT "${rename.to}" TO "${rename.from}";`);
        }
    }
    for (const enumMod of comparison.modified.enums) {
        for (const value of enumMod.changes.added) {
            up.push(`ALTER TYPE "${enumMod.name}" ADD VALUE IF NOT EXISTS '${value}';`);
        }
        if (enumMod.changes.removed.length > 0 && includeDown) {
            down.unshift(`-- Warning: Cannot remove enum values in PostgreSQL: ${enumMod.changes.removed.join(', ')}`);
        }
    }
    for (const tableMod of comparison.modified.tables) {
        const { name, changes, oldTable, newTable } = tableMod;
        for (const change of changes) {
            switch (change) {
                case 'comment': {
                    const newComment = newTable.comment;
                    const oldComment = oldTable.comment;
                    if (newComment) {
                        up.push(`COMMENT ON TABLE "${name}" IS '${newComment.replace(/'/g, "''")}';`);
                    }
                    else {
                        up.push(`COMMENT ON TABLE "${name}" IS NULL;`);
                    }
                    if (includeDown) {
                        if (oldComment) {
                            down.unshift(`COMMENT ON TABLE "${name}" IS '${oldComment.replace(/'/g, "''")}';`);
                        }
                        else {
                            down.unshift(`COMMENT ON TABLE "${name}" IS NULL;`);
                        }
                    }
                    break;
                }
                case 'schema': {
                    const newSchema = newTable.schema || 'public';
                    const oldSchema = oldTable.schema || 'public';
                    up.push(`ALTER TABLE "${oldSchema}"."${name}" SET SCHEMA "${newSchema}";`);
                    if (includeDown) {
                        down.unshift(`ALTER TABLE "${newSchema}"."${name}" SET SCHEMA "${oldSchema}";`);
                    }
                    break;
                }
                case 'inherits': {
                    const oldInherits = new Set(oldTable.inherits || []);
                    const newInherits = new Set(newTable.inherits || []);
                    for (const parent of newInherits) {
                        if (!oldInherits.has(parent)) {
                            up.push(`ALTER TABLE "${name}" INHERIT "${parent}";`);
                            if (includeDown) {
                                down.unshift(`ALTER TABLE "${name}" NO INHERIT "${parent}";`);
                            }
                        }
                    }
                    for (const parent of oldInherits) {
                        if (!newInherits.has(parent)) {
                            up.push(`ALTER TABLE "${name}" NO INHERIT "${parent}";`);
                            if (includeDown) {
                                down.unshift(`ALTER TABLE "${name}" INHERIT "${parent}";`);
                            }
                        }
                    }
                    break;
                }
                case 'partitioning':
                case 'partitionType':
                case 'partitionKey': {
                    up.push(`-- WARNING: Partitioning change detected on "${name}" (${change}).`);
                    up.push(`-- PostgreSQL does not support altering partition strategy. Table must be recreated.`);
                    up.push(`-- Old: ${oldTable.isPartitioned ? `${oldTable.partitionType} BY (${(oldTable.partitionKey || []).join(', ')})` : 'not partitioned'}`);
                    up.push(`-- New: ${newTable.isPartitioned ? `${newTable.partitionType} BY (${(newTable.partitionKey || []).join(', ')})` : 'not partitioned'}`);
                    break;
                }
            }
        }
    }
    for (const colMod of comparison.modified.columns) {
        const { upSQL, downSQL } = generateColumnModification(colMod.table, colMod.column, colMod.changes, colMod.columnType);
        up.push(...upSQL);
        if (includeDown)
            down.unshift(...downSQL);
    }
    for (const seqMod of comparison.modified.sequences) {
        const { name, oldSequence, newSequence, changes } = seqMod;
        const alterParts = [];
        const revertParts = [];
        for (const change of changes) {
            switch (change) {
                case 'increment':
                    if (newSequence.increment !== undefined)
                        alterParts.push(`INCREMENT BY ${newSequence.increment}`);
                    if (oldSequence.increment !== undefined)
                        revertParts.push(`INCREMENT BY ${oldSequence.increment}`);
                    break;
                case 'minValue':
                    alterParts.push(newSequence.minValue !== undefined ? `MINVALUE ${newSequence.minValue}` : 'NO MINVALUE');
                    revertParts.push(oldSequence.minValue !== undefined ? `MINVALUE ${oldSequence.minValue}` : 'NO MINVALUE');
                    break;
                case 'maxValue':
                    alterParts.push(newSequence.maxValue !== undefined ? `MAXVALUE ${newSequence.maxValue}` : 'NO MAXVALUE');
                    revertParts.push(oldSequence.maxValue !== undefined ? `MAXVALUE ${oldSequence.maxValue}` : 'NO MAXVALUE');
                    break;
                case 'startValue':
                    if (newSequence.startValue !== undefined)
                        alterParts.push(`START WITH ${newSequence.startValue}`);
                    if (oldSequence.startValue !== undefined)
                        revertParts.push(`START WITH ${oldSequence.startValue}`);
                    break;
                case 'cache':
                    if (newSequence.cache !== undefined)
                        alterParts.push(`CACHE ${newSequence.cache}`);
                    if (oldSequence.cache !== undefined)
                        revertParts.push(`CACHE ${oldSequence.cache}`);
                    break;
                case 'cycle':
                    alterParts.push(newSequence.cycle ? 'CYCLE' : 'NO CYCLE');
                    revertParts.push(oldSequence.cycle ? 'CYCLE' : 'NO CYCLE');
                    break;
                case 'ownedBy':
                    if (newSequence.ownedBy?.table && newSequence.ownedBy?.column) {
                        up.push(`ALTER SEQUENCE "${name}" OWNED BY "${newSequence.ownedBy.table}"."${newSequence.ownedBy.column}";`);
                    }
                    else {
                        up.push(`ALTER SEQUENCE "${name}" OWNED BY NONE;`);
                    }
                    if (includeDown) {
                        if (oldSequence.ownedBy?.table && oldSequence.ownedBy?.column) {
                            down.unshift(`ALTER SEQUENCE "${name}" OWNED BY "${oldSequence.ownedBy.table}"."${oldSequence.ownedBy.column}";`);
                        }
                        else {
                            down.unshift(`ALTER SEQUENCE "${name}" OWNED BY NONE;`);
                        }
                    }
                    break;
            }
        }
        if (alterParts.length > 0) {
            up.push(`ALTER SEQUENCE "${name}" ${alterParts.join(' ')};`);
            if (includeDown && revertParts.length > 0) {
                down.unshift(`ALTER SEQUENCE "${name}" ${revertParts.join(' ')};`);
            }
        }
    }
    for (const funcMod of comparison.modified.functions) {
        const { newFunction } = funcMod;
        if (funcMod.changes.includes('args') || funcMod.changes.includes('returnType')) {
            const oldArgTypes = funcMod.oldFunction.args.map(a => a.type).join(', ');
            up.push(`DROP FUNCTION IF EXISTS "${funcMod.name}"(${oldArgTypes});`);
        }
        up.push(generateCreateFunctionSQL(newFunction));
        if (includeDown) {
            if (funcMod.changes.includes('args') || funcMod.changes.includes('returnType')) {
                const newArgTypes = newFunction.args.map(a => a.type).join(', ');
                down.unshift(`DROP FUNCTION IF EXISTS "${funcMod.name}"(${newArgTypes});`);
            }
            down.unshift(generateCreateFunctionSQL(funcMod.oldFunction));
        }
    }
    for (const viewMod of comparison.modified.views) {
        const { oldView, newView } = viewMod;
        if (viewMod.changes.includes('isMaterialized')) {
            const oldMat = oldView.isMaterialized ? 'MATERIALIZED ' : '';
            const newMat = newView.isMaterialized ? 'MATERIALIZED ' : '';
            up.push(`DROP ${oldMat}VIEW IF EXISTS "${viewMod.name}";`);
            up.push(`CREATE ${newMat}VIEW "${viewMod.name}" AS ${newView.definition};`);
            if (includeDown) {
                down.unshift(`DROP ${newMat}VIEW IF EXISTS "${viewMod.name}";`);
                down.unshift(`CREATE ${oldMat}VIEW "${viewMod.name}" AS ${oldView.definition};`);
            }
        }
        else if (viewMod.changes.includes('definition')) {
            if (newView.isMaterialized) {
                up.push(`DROP MATERIALIZED VIEW IF EXISTS "${viewMod.name}";`);
                up.push(`CREATE MATERIALIZED VIEW "${viewMod.name}" AS ${newView.definition};`);
                if (includeDown) {
                    down.unshift(`DROP MATERIALIZED VIEW IF EXISTS "${viewMod.name}";`);
                    down.unshift(`CREATE MATERIALIZED VIEW "${viewMod.name}" AS ${oldView.definition};`);
                }
            }
            else {
                up.push(`CREATE OR REPLACE VIEW "${viewMod.name}" AS ${newView.definition};`);
                if (includeDown) {
                    down.unshift(`CREATE OR REPLACE VIEW "${viewMod.name}" AS ${oldView.definition};`);
                }
            }
        }
    }
    for (const trigMod of comparison.modified.triggers) {
        const { oldTrigger, newTrigger } = trigMod;
        up.push(`DROP TRIGGER IF EXISTS "${trigMod.name}" ON "${oldTrigger.table}";`);
        up.push(generateCreateTriggerSQL(newTrigger));
        if (includeDown) {
            down.unshift(`DROP TRIGGER IF EXISTS "${trigMod.name}" ON "${newTrigger.table}";`);
            down.unshift(generateCreateTriggerSQL(oldTrigger));
        }
    }
    for (const domMod of comparison.modified.domains) {
        const { name, oldDomain, newDomain, changes } = domMod;
        for (const change of changes) {
            switch (change) {
                case 'baseType':
                    up.push(`-- WARNING: Domain "${name}" base type changed from ${oldDomain.baseType} to ${newDomain.baseType}.`);
                    up.push(`-- PostgreSQL does not support ALTER DOMAIN ... TYPE. Domain must be dropped and recreated.`);
                    up.push(`DROP DOMAIN IF EXISTS "${name}" CASCADE;`);
                    {
                        let domSQL = `CREATE DOMAIN "${name}" AS ${newDomain.baseType}`;
                        if (newDomain.notNull)
                            domSQL += ' NOT NULL';
                        if (newDomain.defaultValue)
                            domSQL += ` DEFAULT ${newDomain.defaultValue}`;
                        if (newDomain.checkExpression) {
                            const cn = newDomain.checkName ? `CONSTRAINT "${newDomain.checkName}" ` : '';
                            domSQL += ` ${cn}CHECK (${newDomain.checkExpression})`;
                        }
                        up.push(domSQL + ';');
                    }
                    if (includeDown) {
                        down.unshift(`DROP DOMAIN IF EXISTS "${name}" CASCADE;`);
                        let domSQL = `CREATE DOMAIN "${name}" AS ${oldDomain.baseType}`;
                        if (oldDomain.notNull)
                            domSQL += ' NOT NULL';
                        if (oldDomain.defaultValue)
                            domSQL += ` DEFAULT ${oldDomain.defaultValue}`;
                        if (oldDomain.checkExpression) {
                            const cn = oldDomain.checkName ? `CONSTRAINT "${oldDomain.checkName}" ` : '';
                            domSQL += ` ${cn}CHECK (${oldDomain.checkExpression})`;
                        }
                        down.unshift(domSQL + ';');
                    }
                    break;
                case 'notNull':
                    if (newDomain.notNull) {
                        up.push(`ALTER DOMAIN "${name}" SET NOT NULL;`);
                        if (includeDown)
                            down.unshift(`ALTER DOMAIN "${name}" DROP NOT NULL;`);
                    }
                    else {
                        up.push(`ALTER DOMAIN "${name}" DROP NOT NULL;`);
                        if (includeDown)
                            down.unshift(`ALTER DOMAIN "${name}" SET NOT NULL;`);
                    }
                    break;
                case 'defaultValue':
                    if (newDomain.defaultValue) {
                        up.push(`ALTER DOMAIN "${name}" SET DEFAULT ${newDomain.defaultValue};`);
                    }
                    else {
                        up.push(`ALTER DOMAIN "${name}" DROP DEFAULT;`);
                    }
                    if (includeDown) {
                        if (oldDomain.defaultValue) {
                            down.unshift(`ALTER DOMAIN "${name}" SET DEFAULT ${oldDomain.defaultValue};`);
                        }
                        else {
                            down.unshift(`ALTER DOMAIN "${name}" DROP DEFAULT;`);
                        }
                    }
                    break;
                case 'checkExpression':
                    if (oldDomain.checkName) {
                        up.push(`ALTER DOMAIN "${name}" DROP CONSTRAINT IF EXISTS "${oldDomain.checkName}";`);
                    }
                    else if (oldDomain.checkExpression) {
                        up.push(`ALTER DOMAIN "${name}" DROP CONSTRAINT IF EXISTS "${name}_check";`);
                    }
                    if (newDomain.checkExpression) {
                        const cn = newDomain.checkName || `${name}_check`;
                        up.push(`ALTER DOMAIN "${name}" ADD CONSTRAINT "${cn}" CHECK (${newDomain.checkExpression});`);
                    }
                    if (includeDown) {
                        if (newDomain.checkName) {
                            down.unshift(`ALTER DOMAIN "${name}" DROP CONSTRAINT IF EXISTS "${newDomain.checkName}";`);
                        }
                        else if (newDomain.checkExpression) {
                            down.unshift(`ALTER DOMAIN "${name}" DROP CONSTRAINT IF EXISTS "${name}_check";`);
                        }
                        if (oldDomain.checkExpression) {
                            const cn = oldDomain.checkName || `${name}_check`;
                            down.unshift(`ALTER DOMAIN "${name}" ADD CONSTRAINT "${cn}" CHECK (${oldDomain.checkExpression});`);
                        }
                    }
                    break;
            }
        }
    }
    for (const ctMod of comparison.modified.compositeTypes) {
        const { name, oldType, newType } = ctMod;
        up.push(`DROP TYPE IF EXISTS "${name}" CASCADE;`);
        {
            const attrs = newType.attributes.map(a => {
                let attr = `"${a.name}" ${a.type}`;
                if (a.collation)
                    attr += ` COLLATE "${a.collation}"`;
                return attr;
            }).join(', ');
            up.push(`CREATE TYPE "${name}" AS (${attrs});`);
        }
        if (includeDown) {
            down.unshift(`DROP TYPE IF EXISTS "${name}" CASCADE;`);
            const attrs = oldType.attributes.map(a => {
                let attr = `"${a.name}" ${a.type}`;
                if (a.collation)
                    attr += ` COLLATE "${a.collation}"`;
                return attr;
            }).join(', ');
            down.unshift(`CREATE TYPE "${name}" AS (${attrs});`);
        }
    }
    for (const ext of comparison.added.extensions) {
        up.push(`CREATE EXTENSION IF NOT EXISTS "${ext}";`);
        if (includeDown) {
            down.unshift(`DROP EXTENSION IF EXISTS "${ext}";`);
        }
    }
    for (const enumDef of comparison.added.enums) {
        const values = enumDef.values.map(v => `'${v}'`).join(', ');
        up.push(`CREATE TYPE "${enumDef.name}" AS ENUM (${values});`);
        if (includeDown) {
            down.unshift(`DROP TYPE IF EXISTS "${enumDef.name}";`);
        }
    }
    for (const domain of comparison.added.domains) {
        let domainSQL = `CREATE DOMAIN "${domain.name}" AS ${domain.baseType}`;
        if (domain.notNull)
            domainSQL += ' NOT NULL';
        if (domain.defaultValue)
            domainSQL += ` DEFAULT ${domain.defaultValue}`;
        if (domain.checkExpression) {
            const checkName = domain.checkName ? `CONSTRAINT "${domain.checkName}" ` : '';
            domainSQL += ` ${checkName}CHECK (${domain.checkExpression})`;
        }
        up.push(domainSQL + ';');
        if (includeDown) {
            down.unshift(`DROP DOMAIN IF EXISTS "${domain.name}";`);
        }
    }
    for (const ct of comparison.added.compositeTypes) {
        const attrs = ct.attributes.map(a => {
            let attr = `"${a.name}" ${a.type}`;
            if (a.collation)
                attr += ` COLLATE "${a.collation}"`;
            return attr;
        }).join(', ');
        up.push(`CREATE TYPE "${ct.name}" AS (${attrs});`);
        if (includeDown) {
            down.unshift(`DROP TYPE IF EXISTS "${ct.name}";`);
        }
    }
    for (const seq of comparison.added.sequences) {
        const parts = [`CREATE SEQUENCE "${seq.name}"`];
        if (seq.startValue !== undefined)
            parts.push(`START WITH ${seq.startValue}`);
        if (seq.increment !== undefined)
            parts.push(`INCREMENT BY ${seq.increment}`);
        if (seq.minValue !== undefined)
            parts.push(`MINVALUE ${seq.minValue}`);
        if (seq.maxValue !== undefined)
            parts.push(`MAXVALUE ${seq.maxValue}`);
        if (seq.cache !== undefined)
            parts.push(`CACHE ${seq.cache}`);
        if (seq.cycle)
            parts.push('CYCLE');
        up.push(parts.join(' ') + ';');
        if (seq.ownedBy?.table && seq.ownedBy?.column) {
            up.push(`ALTER SEQUENCE "${seq.name}" OWNED BY "${seq.ownedBy.table}"."${seq.ownedBy.column}";`);
        }
        if (includeDown) {
            down.unshift(`DROP SEQUENCE IF EXISTS "${seq.name}";`);
        }
    }
    for (const table of comparison.added.tables) {
        up.push(...generateCreateTableFromParsed(table));
        if (includeDown) {
            down.unshift(`DROP TABLE IF EXISTS "${table.name}" CASCADE;`);
        }
    }
    for (const { table, column } of comparison.added.columns) {
        up.push(`ALTER TABLE "${table}" ADD COLUMN ${generateParsedColumnDef(column)};`);
        if (column.comment) {
            up.push(`COMMENT ON COLUMN "${table}"."${column.name}" IS '${column.comment.replace(/'/g, "''")}';`);
        }
        if (includeDown) {
            down.unshift(`ALTER TABLE "${table}" DROP COLUMN IF EXISTS "${column.name}";`);
        }
    }
    for (const { table, index } of comparison.added.indexes) {
        up.push(generateCreateIndexFromParsed(table, index));
        if (includeDown) {
            down.unshift(`DROP INDEX IF EXISTS "${index.name}";`);
        }
    }
    for (const { table, constraint } of comparison.added.constraints) {
        up.push(`ALTER TABLE "${table}" ADD CONSTRAINT "${constraint.name}" ${buildParsedConstraintDef(constraint)};`);
        if (includeDown) {
            down.unshift(`ALTER TABLE "${table}" DROP CONSTRAINT IF EXISTS "${constraint.name}";`);
        }
    }
    for (const { table, oldConstraint, newConstraint } of comparison.modified.constraints) {
        up.push(`ALTER TABLE "${table}" DROP CONSTRAINT IF EXISTS "${oldConstraint.name}";`);
        up.push(`ALTER TABLE "${table}" ADD CONSTRAINT "${newConstraint.name}" ${buildParsedConstraintDef(newConstraint)};`);
        if (includeDown) {
            down.unshift(`ALTER TABLE "${table}" DROP CONSTRAINT IF EXISTS "${newConstraint.name}";`);
            down.unshift(`ALTER TABLE "${table}" ADD CONSTRAINT "${oldConstraint.name}" ${buildParsedConstraintDef(oldConstraint)};`);
        }
    }
    for (const { table, oldIndex, newIndex } of comparison.modified.indexes) {
        up.push(`DROP INDEX IF EXISTS "${oldIndex.name}";`);
        up.push(generateCreateIndexFromParsed(table, newIndex));
        if (includeDown) {
            down.unshift(`DROP INDEX IF EXISTS "${newIndex.name}";`);
            down.unshift(generateCreateIndexFromParsed(table, oldIndex));
        }
    }
    for (const view of comparison.added.views) {
        const materialized = view.isMaterialized ? 'MATERIALIZED ' : '';
        up.push(`CREATE ${materialized}VIEW "${view.name}" AS ${view.definition};`);
        if (includeDown) {
            down.unshift(`DROP ${materialized}VIEW IF EXISTS "${view.name}";`);
        }
    }
    for (const func of comparison.added.functions) {
        up.push(generateCreateFunctionSQL(func));
        if (includeDown) {
            down.unshift(`DROP FUNCTION IF EXISTS "${func.name}"(${func.args.map(a => a.type).join(', ')});`);
        }
    }
    for (const trigger of comparison.added.triggers) {
        up.push(generateCreateTriggerSQL(trigger));
        if (includeDown) {
            down.unshift(`DROP TRIGGER IF EXISTS "${trigger.name}" ON "${trigger.table}";`);
        }
    }
    for (const trigger of comparison.removed.triggers) {
        up.push(`DROP TRIGGER IF EXISTS "${trigger.name}" ON "${trigger.table}";`);
        if (includeDown) {
            down.unshift(generateCreateTriggerSQL(trigger));
        }
    }
    for (const func of comparison.removed.functions) {
        const argTypes = func.args.map(a => a.type).join(', ');
        up.push(`DROP FUNCTION IF EXISTS "${func.name}"(${argTypes});`);
        if (includeDown) {
            down.unshift(generateCreateFunctionSQL(func));
        }
    }
    for (const view of comparison.removed.views) {
        const materialized = view.isMaterialized ? 'MATERIALIZED ' : '';
        up.push(`DROP ${materialized}VIEW IF EXISTS "${view.name}";`);
        if (includeDown) {
            down.unshift(`CREATE ${materialized}VIEW "${view.name}" AS ${view.definition};`);
        }
    }
    for (const { table, constraint } of comparison.removed.constraints) {
        up.push(`ALTER TABLE "${table}" DROP CONSTRAINT IF EXISTS "${constraint.name}";`);
        if (includeDown) {
            down.unshift(`ALTER TABLE "${table}" ADD CONSTRAINT "${constraint.name}" ${buildParsedConstraintDef(constraint)};`);
        }
    }
    for (const { table, index } of comparison.removed.indexes) {
        up.push(`DROP INDEX IF EXISTS "${index.name}";`);
        if (includeDown) {
            down.unshift(generateCreateIndexFromParsed(table, index));
        }
    }
    for (const { table, column } of comparison.removed.columns) {
        up.push(`ALTER TABLE "${table}" DROP COLUMN IF EXISTS "${column.name}";`);
        if (includeDown) {
            down.unshift(`ALTER TABLE "${table}" ADD COLUMN ${generateParsedColumnDef(column)};`);
        }
    }
    for (const table of comparison.removed.tables) {
        up.push(`DROP TABLE IF EXISTS "${table.name}" CASCADE;`);
        if (includeDown) {
            down.unshift(...generateCreateTableFromParsed(table));
        }
    }
    for (const seq of comparison.removed.sequences) {
        up.push(`DROP SEQUENCE IF EXISTS "${seq.name}";`);
        if (includeDown) {
            const parts = [`CREATE SEQUENCE "${seq.name}"`];
            if (seq.startValue !== undefined)
                parts.push(`START WITH ${seq.startValue}`);
            if (seq.increment !== undefined)
                parts.push(`INCREMENT BY ${seq.increment}`);
            if (seq.minValue !== undefined)
                parts.push(`MINVALUE ${seq.minValue}`);
            if (seq.maxValue !== undefined)
                parts.push(`MAXVALUE ${seq.maxValue}`);
            if (seq.cache !== undefined)
                parts.push(`CACHE ${seq.cache}`);
            if (seq.cycle)
                parts.push('CYCLE');
            down.unshift(parts.join(' ') + ';');
            if (seq.ownedBy?.table && seq.ownedBy?.column) {
                down.unshift(`ALTER SEQUENCE "${seq.name}" OWNED BY "${seq.ownedBy.table}"."${seq.ownedBy.column}";`);
            }
        }
    }
    for (const ct of comparison.removed.compositeTypes) {
        up.push(`DROP TYPE IF EXISTS "${ct.name}";`);
        if (includeDown) {
            const attrs = ct.attributes.map(a => {
                let attr = `"${a.name}" ${a.type}`;
                if (a.collation)
                    attr += ` COLLATE "${a.collation}"`;
                return attr;
            }).join(', ');
            down.unshift(`CREATE TYPE "${ct.name}" AS (${attrs});`);
        }
    }
    for (const domain of comparison.removed.domains) {
        up.push(`DROP DOMAIN IF EXISTS "${domain.name}";`);
        if (includeDown) {
            let domainSQL = `CREATE DOMAIN "${domain.name}" AS ${domain.baseType}`;
            if (domain.notNull)
                domainSQL += ' NOT NULL';
            if (domain.defaultValue)
                domainSQL += ` DEFAULT ${domain.defaultValue}`;
            if (domain.checkExpression) {
                const checkName = domain.checkName ? `CONSTRAINT "${domain.checkName}" ` : '';
                domainSQL += ` ${checkName}CHECK (${domain.checkExpression})`;
            }
            down.unshift(domainSQL + ';');
        }
    }
    for (const enumDef of comparison.removed.enums) {
        up.push(`DROP TYPE IF EXISTS "${enumDef.name}";`);
        if (includeDown) {
            const values = enumDef.values.map(v => `'${v}'`).join(', ');
            down.unshift(`CREATE TYPE "${enumDef.name}" AS ENUM (${values});`);
        }
    }
    for (const ext of comparison.removed.extensions) {
        up.push(`DROP EXTENSION IF EXISTS "${ext}";`);
        if (includeDown) {
            down.unshift(`CREATE EXTENSION IF NOT EXISTS "${ext}";`);
        }
    }
    return { up, down };
}
function generateColumnModification(tableName, columnName, changes, columnType) {
    const upSQL = [];
    const downSQL = [];
    for (const change of changes) {
        switch (change.field) {
            case 'type':
                upSQL.push(`ALTER TABLE "${tableName}" ALTER COLUMN "${columnName}" TYPE ${change.to} USING "${columnName}"::${change.to};`);
                downSQL.push(`ALTER TABLE "${tableName}" ALTER COLUMN "${columnName}" TYPE ${change.from} USING "${columnName}"::${change.from};`);
                break;
            case 'nullable':
                if (change.to) {
                    upSQL.push(`ALTER TABLE "${tableName}" ALTER COLUMN "${columnName}" DROP NOT NULL;`);
                    downSQL.push(`ALTER TABLE "${tableName}" ALTER COLUMN "${columnName}" SET NOT NULL;`);
                }
                else {
                    upSQL.push(`ALTER TABLE "${tableName}" ALTER COLUMN "${columnName}" SET NOT NULL;`);
                    downSQL.push(`ALTER TABLE "${tableName}" ALTER COLUMN "${columnName}" DROP NOT NULL;`);
                }
                break;
            case 'default':
                if (change.to !== undefined && change.to !== null) {
                    upSQL.push(`ALTER TABLE "${tableName}" ALTER COLUMN "${columnName}" SET DEFAULT ${change.to};`);
                }
                else {
                    upSQL.push(`ALTER TABLE "${tableName}" ALTER COLUMN "${columnName}" DROP DEFAULT;`);
                }
                if (change.from !== undefined && change.from !== null) {
                    downSQL.push(`ALTER TABLE "${tableName}" ALTER COLUMN "${columnName}" SET DEFAULT ${change.from};`);
                }
                else {
                    downSQL.push(`ALTER TABLE "${tableName}" ALTER COLUMN "${columnName}" DROP DEFAULT;`);
                }
                break;
            case 'length': {
                const newLen = change.to;
                const oldLen = change.from;
                const baseType = (columnType || 'character varying').toUpperCase();
                const newFullType = newLen ? `${baseType}(${newLen})` : baseType;
                const oldFullType = oldLen ? `${baseType}(${oldLen})` : baseType;
                upSQL.push(`ALTER TABLE "${tableName}" ALTER COLUMN "${columnName}" TYPE ${newFullType};`);
                downSQL.push(`ALTER TABLE "${tableName}" ALTER COLUMN "${columnName}" TYPE ${oldFullType};`);
                break;
            }
            case 'unique': {
                const constraintName = `${tableName}_${columnName}_key`;
                if (change.to === true) {
                    upSQL.push(`ALTER TABLE "${tableName}" ADD CONSTRAINT "${constraintName}" UNIQUE ("${columnName}");`);
                    downSQL.push(`ALTER TABLE "${tableName}" DROP CONSTRAINT IF EXISTS "${constraintName}";`);
                }
                else {
                    upSQL.push(`ALTER TABLE "${tableName}" DROP CONSTRAINT IF EXISTS "${constraintName}";`);
                    downSQL.push(`ALTER TABLE "${tableName}" ADD CONSTRAINT "${constraintName}" UNIQUE ("${columnName}");`);
                }
                break;
            }
            case 'primaryKey': {
                const pkName = `${tableName}_pkey`;
                if (change.to === true) {
                    upSQL.push(`ALTER TABLE "${tableName}" ADD CONSTRAINT "${pkName}" PRIMARY KEY ("${columnName}");`);
                    downSQL.push(`ALTER TABLE "${tableName}" DROP CONSTRAINT IF EXISTS "${pkName}";`);
                }
                else {
                    upSQL.push(`ALTER TABLE "${tableName}" DROP CONSTRAINT IF EXISTS "${pkName}";`);
                    downSQL.push(`ALTER TABLE "${tableName}" ADD CONSTRAINT "${pkName}" PRIMARY KEY ("${columnName}");`);
                }
                break;
            }
            case 'precision':
            case 'scale': {
                if (change.field === 'precision') {
                    const newPrec = change.to;
                    const scaleChange = changes.find(c => c.field === 'scale');
                    const newScale = scaleChange ? scaleChange.to : undefined;
                    const oldPrec = change.from;
                    const oldScale = scaleChange ? scaleChange.from : undefined;
                    const newFullType = newPrec != null
                        ? (newScale != null ? `NUMERIC(${newPrec}, ${newScale})` : `NUMERIC(${newPrec})`)
                        : 'NUMERIC';
                    const oldFullType = oldPrec != null
                        ? (oldScale != null ? `NUMERIC(${oldPrec}, ${oldScale})` : `NUMERIC(${oldPrec})`)
                        : 'NUMERIC';
                    upSQL.push(`ALTER TABLE "${tableName}" ALTER COLUMN "${columnName}" TYPE ${newFullType};`);
                    downSQL.push(`ALTER TABLE "${tableName}" ALTER COLUMN "${columnName}" TYPE ${oldFullType};`);
                }
                break;
            }
        }
    }
    return { upSQL, downSQL };
}
function generateCreateTableFromParsed(table) {
    const sql = [];
    const columnDefs = [];
    const constraintDefs = [];
    for (const col of table.columns) {
        columnDefs.push(`    ${generateParsedColumnDef(col)}`);
    }
    for (const con of table.constraints) {
        if (con.type === 'FOREIGN KEY')
            continue;
        if (con.type === 'PRIMARY KEY' && con.columns.length === 1 &&
            table.columns.some(c => c.isPrimaryKey && c.name === con.columns[0]))
            continue;
        if (con.type === 'UNIQUE' && con.columns.length === 1 &&
            table.columns.some(c => c.isUnique && c.name === con.columns[0]))
            continue;
        constraintDefs.push(`    CONSTRAINT "${con.name}" ${buildParsedConstraintDef(con)}`);
    }
    const allDefs = [...columnDefs, ...constraintDefs];
    let createStmt = `CREATE TABLE "${table.name}" (\n${allDefs.join(',\n')}\n)`;
    if (table.inherits?.length) {
        createStmt += ` INHERITS (${table.inherits.map(t => `"${t}"`).join(', ')})`;
    }
    if (table.isPartitioned && table.partitionType && table.partitionKey?.length) {
        createStmt += ` PARTITION BY ${table.partitionType} (${table.partitionKey.join(', ')})`;
    }
    if (table.partitionOf) {
        createStmt = `CREATE TABLE "${table.name}" PARTITION OF "${table.partitionOf}"`;
        if (table.partitionBound) {
            createStmt += ` ${table.partitionBound}`;
        }
    }
    sql.push(createStmt + ';');
    for (const con of table.constraints) {
        if (con.type === 'FOREIGN KEY') {
            sql.push(`ALTER TABLE "${table.name}" ADD CONSTRAINT "${con.name}" ${buildParsedConstraintDef(con)};`);
        }
    }
    for (const idx of table.indexes) {
        sql.push(generateCreateIndexFromParsed(table.name, idx));
    }
    for (const col of table.columns) {
        if (col.comment) {
            sql.push(`COMMENT ON COLUMN "${table.name}"."${col.name}" IS '${col.comment.replace(/'/g, "''")}';`);
        }
    }
    if (table.comment) {
        sql.push(`COMMENT ON TABLE "${table.name}" IS '${table.comment.replace(/'/g, "''")}';`);
    }
    return sql;
}
function buildParsedConstraintDef(con) {
    switch (con.type) {
        case 'PRIMARY KEY':
            return `PRIMARY KEY (${con.columns.map(c => `"${c}"`).join(', ')})`;
        case 'UNIQUE':
            return `UNIQUE (${con.columns.map(c => `"${c}"`).join(', ')})`;
        case 'FOREIGN KEY': {
            const cols = con.columns.map(c => `"${c}"`).join(', ');
            const refCols = (con.references?.columns || con.columns).map((c) => `"${c}"`).join(', ');
            let fk = `FOREIGN KEY (${cols}) REFERENCES "${con.references?.table || ''}"(${refCols})`;
            if (con.references?.onDelete)
                fk += ` ON DELETE ${con.references.onDelete}`;
            if (con.references?.onUpdate)
                fk += ` ON UPDATE ${con.references.onUpdate}`;
            if (con.references?.deferrable)
                fk += ' DEFERRABLE';
            if (con.references?.initiallyDeferred)
                fk += ' INITIALLY DEFERRED';
            return fk;
        }
        case 'CHECK':
            return `CHECK (${con.expression})`;
        case 'EXCLUDE':
            return `EXCLUDE ${con.expression || ''}`;
        default:
            return '';
    }
}
function generateParsedColumnDef(col) {
    const parts = [`"${col.name}"`];
    let typeStr = col.type.toUpperCase();
    if (col.typeParams?.length) {
        typeStr += `(${col.typeParams.length})`;
    }
    else if (col.typeParams?.precision != null && col.typeParams?.scale != null) {
        typeStr += `(${col.typeParams.precision}, ${col.typeParams.scale})`;
    }
    else if (col.typeParams?.precision != null) {
        typeStr += `(${col.typeParams.precision})`;
    }
    if (col.isArray)
        typeStr += '[]';
    parts.push(typeStr);
    if (!col.isNullable) {
        parts.push('NOT NULL');
    }
    if (col.isPrimaryKey) {
        parts.push('PRIMARY KEY');
    }
    if (col.isUnique && !col.isPrimaryKey) {
        parts.push('UNIQUE');
    }
    if (col.isGenerated && col.generatedExpression) {
        parts.push(`GENERATED ALWAYS AS (${col.generatedExpression}) STORED`);
    }
    else if (col.defaultValue !== undefined && col.defaultValue !== null) {
        parts.push(`DEFAULT ${col.defaultValue}`);
    }
    return parts.join(' ');
}
function generateCreateIndexFromParsed(tableName, idx) {
    const unique = idx.isUnique ? 'UNIQUE ' : '';
    const using = idx.method && idx.method !== 'btree' ? ` USING ${idx.method}` : '';
    let colList;
    if (idx.isExpression && idx.expressions?.length) {
        colList = idx.expressions.map(expr => {
            const opclassSuffix = idx.opclass ? ` ${idx.opclass}` : '';
            return `${expr}${opclassSuffix}`;
        }).join(', ');
    }
    else {
        colList = idx.columns.map(c => {
            const quoted = `"${c}"`;
            return idx.opclass ? `${quoted} ${idx.opclass}` : quoted;
        }).join(', ');
    }
    const include = idx.includeColumns?.length
        ? ` INCLUDE (${idx.includeColumns.map(c => `"${c}"`).join(', ')})`
        : '';
    const where = idx.whereClause ? ` WHERE ${idx.whereClause}` : '';
    return `CREATE ${unique}INDEX IF NOT EXISTS "${idx.name}" ON "${tableName}"${using} (${colList})${include}${where};`;
}
function generateCreateFunctionSQL(func) {
    const argsStr = func.args.map(a => {
        const parts = [];
        if (a.mode && a.mode !== 'IN')
            parts.push(a.mode);
        if (a.name)
            parts.push(a.name);
        parts.push(a.type);
        if (a.default)
            parts.push(`DEFAULT ${a.default}`);
        return parts.join(' ');
    }).join(', ');
    const volatility = func.volatility || 'VOLATILE';
    const strict = func.isStrict ? ' STRICT' : '';
    const secDef = func.securityDefiner ? ' SECURITY DEFINER' : '';
    return `CREATE OR REPLACE FUNCTION "${func.name}"(${argsStr}) RETURNS ${func.returnType} LANGUAGE ${func.language} ${volatility}${strict}${secDef} AS $$ ${func.body} $$;`;
}
function generateCreateTriggerSQL(trigger) {
    const events = trigger.events.join(' OR ');
    const forEach = trigger.forEach || 'ROW';
    const constraint = trigger.isConstraint ? 'CONSTRAINT ' : '';
    const deferrable = trigger.deferrable ? ' DEFERRABLE' : '';
    const initiallyDeferred = trigger.initiallyDeferred ? ' INITIALLY DEFERRED' : '';
    const when = trigger.whenClause ? ` WHEN (${trigger.whenClause})` : '';
    return `CREATE ${constraint}TRIGGER "${trigger.name}" ${trigger.timing} ${events} ON "${trigger.table}"${deferrable}${initiallyDeferred} FOR EACH ${forEach}${when} EXECUTE FUNCTION ${trigger.functionName}();`;
}
export function getNextMigrationNumber(migrationsDir) {
    if (!fs.existsSync(migrationsDir)) {
        return '001';
    }
    const files = fs.readdirSync(migrationsDir)
        .filter((f) => f.endsWith('.sql'))
        .sort();
    if (files.length === 0) {
        return '001';
    }
    const lastFile = files[files.length - 1];
    const match = lastFile.match(/^(\d+)/);
    if (match) {
        const num = parseInt(match[1]) + 1;
        return num.toString().padStart(3, '0');
    }
    return '001';
}
export function generateTimestampedName(name) {
    const now = new Date();
    const timestamp = now.toISOString()
        .replace(/[-:T]/g, '')
        .slice(0, 14);
    const sanitized = name.replace(/\s+/g, '_').toLowerCase();
    const maxNameLen = 200;
    const truncated = sanitized.length > maxNameLen ? sanitized.slice(0, maxNameLen) : sanitized;
    return `${timestamp}_${truncated}`;
}
export function generateMigrationNameFromComparison(comparison) {
    const parts = [];
    for (const t of comparison.added.tables.slice(0, 2)) {
        parts.push(`add_${t.name}`);
    }
    for (const t of comparison.removed.tables.slice(0, 2)) {
        parts.push(`drop_${t.name}`);
    }
    for (const r of comparison.renamed.tables.slice(0, 2)) {
        parts.push(`rename_${r.from}_to_${r.to}`);
    }
    for (const e of comparison.added.enums.slice(0, 2)) {
        parts.push(`add_enum_${e.name}`);
    }
    for (const e of comparison.removed.enums.slice(0, 2)) {
        parts.push(`drop_enum_${e.name}`);
    }
    for (const d of comparison.added.domains.slice(0, 1)) {
        parts.push(`add_domain_${d.name}`);
    }
    for (const d of comparison.removed.domains.slice(0, 1)) {
        parts.push(`drop_domain_${d.name}`);
    }
    for (const s of comparison.added.sequences.slice(0, 1)) {
        parts.push(`add_seq_${s.name}`);
    }
    for (const s of comparison.removed.sequences.slice(0, 1)) {
        parts.push(`drop_seq_${s.name}`);
    }
    for (const f of comparison.added.functions.slice(0, 1)) {
        parts.push(`add_fn_${f.name}`);
    }
    for (const f of comparison.removed.functions.slice(0, 1)) {
        parts.push(`drop_fn_${f.name}`);
    }
    for (const v of comparison.added.views.slice(0, 1)) {
        parts.push(`add_view_${v.name}`);
    }
    for (const t of comparison.added.triggers.slice(0, 1)) {
        parts.push(`add_trigger_${t.name}`);
    }
    if (parts.length === 0) {
        const addedCols = comparison.added.columns.slice(0, 2);
        const removedCols = comparison.removed.columns.slice(0, 2);
        for (const c of addedCols) {
            parts.push(`add_${c.column.name}_to_${c.table}`);
        }
        for (const c of removedCols) {
            parts.push(`drop_${c.column.name}_from_${c.table}`);
        }
    }
    if (parts.length === 0 && comparison.modified) {
        const modifiedTables = comparison.modified.tables || [];
        for (const t of modifiedTables.slice(0, 2)) {
            parts.push(`modify_${t.name}`);
        }
    }
    if (parts.length === 0) {
        return 'schema_update';
    }
    const name = parts.join('_');
    return name.length > 120 ? name.slice(0, 120) : name;
}
function extractTableName(sql) {
    const trimmed = sql.trim();
    if (trimmed.startsWith('--') || !trimmed)
        return null;
    const createTable = trimmed.match(/^CREATE TABLE\s+(?:IF NOT EXISTS\s+)?"([^"]+)"/i);
    if (createTable)
        return createTable[1];
    const partitionOf = trimmed.match(/^CREATE TABLE\s+"([^"]+)"\s+PARTITION OF/i);
    if (partitionOf)
        return partitionOf[1];
    const alterTable = trimmed.match(/^ALTER TABLE\s+(?:IF EXISTS\s+)?"([^"]+)"/i);
    if (alterTable)
        return alterTable[1];
    const dropTable = trimmed.match(/^DROP TABLE\s+(?:IF EXISTS\s+)?"([^"]+)"/i);
    if (dropTable)
        return dropTable[1];
    const createIndex = trimmed.match(/^CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF NOT EXISTS\s+)?(?:"[^"]+"\s+)?ON\s+"([^"]+)"/i);
    if (createIndex)
        return createIndex[1];
    const dropIndex = trimmed.match(/^DROP INDEX\s+/i);
    if (dropIndex)
        return null;
    const commentTable = trimmed.match(/^COMMENT ON TABLE\s+"([^"]+)"/i);
    if (commentTable)
        return commentTable[1];
    const commentCol = trimmed.match(/^COMMENT ON COLUMN\s+"([^"]+)"\./i);
    if (commentCol)
        return commentCol[1];
    const commentIdx = trimmed.match(/^COMMENT ON INDEX/i);
    if (commentIdx)
        return null;
    const dropTrigger = trimmed.match(/ON\s+"([^"]+)"\s*;?\s*$/i);
    if (trimmed.match(/^DROP TRIGGER/i) && dropTrigger)
        return dropTrigger[1];
    const createTrigger = trimmed.match(/^CREATE\s+(?:OR REPLACE\s+)?TRIGGER/i);
    if (createTrigger) {
        const onMatch = trimmed.match(/\bON\s+"([^"]+)"/i);
        if (onMatch)
            return onMatch[1];
    }
    return null;
}
export function formatMigrationStatements(statements) {
    if (statements.length === 0)
        return [];
    const result = [];
    let lastTable = null;
    let isFirstGroup = true;
    for (const stmt of statements) {
        const trimmed = stmt.trim();
        if (!trimmed)
            continue;
        if (trimmed.startsWith('--')) {
            result.push(stmt);
            continue;
        }
        const table = extractTableName(trimmed);
        if (table && table !== lastTable) {
            if (!isFirstGroup) {
                result.push('');
            }
            result.push(`-- ${table}`);
            lastTable = table;
            isFirstGroup = false;
        }
        else if (!table && lastTable !== null) {
            const isStandalone = /^(?:CREATE\s+(?:EXTENSION|TYPE|DOMAIN|SEQUENCE|OR REPLACE\s+FUNCTION)|ALTER\s+(?:TYPE|SEQUENCE|DOMAIN)|DROP\s+(?:EXTENSION|TYPE|DOMAIN|SEQUENCE|FUNCTION|INDEX))/i.test(trimmed);
            if (isStandalone) {
                if (!isFirstGroup)
                    result.push('');
                lastTable = null;
                isFirstGroup = false;
            }
        }
        else if (!table && lastTable === null) {
            if (!isFirstGroup && /^(?:CREATE\s+(?:EXTENSION|TYPE|DOMAIN|SEQUENCE)|DROP\s+(?:EXTENSION|TYPE|DOMAIN|SEQUENCE))/i.test(trimmed)) {
                result.push('');
            }
            isFirstGroup = false;
        }
        result.push(stmt);
    }
    return result;
}
function classifyStatement(sql) {
    const t = sql.trim().toUpperCase();
    if (t.startsWith('CREATE TABLE')) {
        if (/PARTITION\s+OF/i.test(t))
            return 'partition';
        return 'create-table';
    }
    if (t.startsWith('DROP TABLE'))
        return 'drop-table';
    if (/^CREATE\s+(?:UNIQUE\s+)?INDEX/.test(t))
        return 'create-index';
    if (t.startsWith('DROP INDEX'))
        return 'drop-index';
    if (t.startsWith('COMMENT ON'))
        return 'comment';
    if (t.startsWith('ALTER TABLE') && t.includes('FOREIGN KEY'))
        return 'fk';
    if (t.startsWith('ALTER TABLE'))
        return 'alter-table';
    return 'other';
}
function makeBanner(label, name) {
    const rule = '-- ==================================================================';
    return `${rule}\n--  ${label}: ${name}\n${rule}`;
}
function reformatCreateTableWithConstraintHeader(sql) {
    const trimmed = sql.trim();
    const openIdx = trimmed.indexOf('(');
    if (openIdx === -1)
        return trimmed;
    let depth = 0;
    let closeIdx = -1;
    for (let i = openIdx; i < trimmed.length; i++) {
        if (trimmed[i] === '(')
            depth++;
        else if (trimmed[i] === ')') {
            depth--;
            if (depth === 0) {
                closeIdx = i;
                break;
            }
        }
    }
    if (closeIdx === -1)
        return trimmed;
    const prefix = trimmed.slice(0, openIdx + 1);
    const body = trimmed.slice(openIdx + 1, closeIdx);
    const suffix = trimmed.slice(closeIdx);
    const lines = body.split(',\n');
    if (lines.length === 0)
        return trimmed;
    const firstConstraintIdx = lines.findIndex(line => /^\s*CONSTRAINT\s+/i.test(line));
    if (firstConstraintIdx === -1)
        return trimmed;
    const beforeConstraint = lines.slice(0, firstConstraintIdx);
    const constraintLines = lines.slice(firstConstraintIdx);
    const columnSection = beforeConstraint.join(',\n');
    const constraintSection = constraintLines.join(',\n');
    const assembled = columnSection + ',\n\n    -- Constraints\n' + constraintSection;
    const cleaned = assembled.replace(/^\n+/, '').replace(/\s+$/, '');
    return prefix + '\n' + cleaned + '\n' + suffix;
}
export function formatMigrationStatementsPolished(statements) {
    if (statements.length === 0)
        return [];
    const result = [];
    let lastBannerTable = null;
    let currentSection = null;
    function addTableBanner(name) {
        if (result.length > 0) {
            result.push('');
            result.push('');
        }
        result.push(makeBanner('TABLE', name));
        result.push('');
    }
    function addSubHeader(label, name) {
        result.push('');
        result.push(`-- ${label} for ${name}`);
    }
    for (const stmt of statements) {
        const trimmed = stmt.trim();
        if (!trimmed)
            continue;
        if (trimmed.startsWith('--') || trimmed.startsWith('/*')) {
            result.push(stmt);
            continue;
        }
        const kind = classifyStatement(trimmed);
        const table = extractTableName(trimmed);
        if (table) {
            const isNewTable = table !== lastBannerTable;
            switch (kind) {
                case 'create-table':
                case 'drop-table':
                    addTableBanner(table);
                    if (kind === 'create-table') {
                        result.push('-- Table');
                    }
                    lastBannerTable = table;
                    currentSection = 'table';
                    break;
                case 'alter-table':
                    if (isNewTable) {
                        addTableBanner(table);
                        lastBannerTable = table;
                    }
                    if (currentSection !== 'alter') {
                        addSubHeader('Alter', table);
                        currentSection = 'alter';
                    }
                    break;
                case 'fk':
                    if (isNewTable) {
                        addTableBanner(table);
                        lastBannerTable = table;
                    }
                    if (currentSection !== 'fk') {
                        addSubHeader('Foreign keys', table);
                        currentSection = 'fk';
                    }
                    break;
                case 'partition': {
                    const parentMatch = trimmed.match(/PARTITION\s+OF\s+"([^"]+)"/i);
                    const parentName = parentMatch ? parentMatch[1] : table;
                    if (currentSection !== 'partition') {
                        addSubHeader('Partitions', parentName);
                        currentSection = 'partition';
                    }
                    break;
                }
                case 'create-index':
                case 'drop-index':
                    if (isNewTable) {
                        addTableBanner(table);
                        lastBannerTable = table;
                    }
                    if (currentSection !== 'index') {
                        addSubHeader('Indexes', table);
                        currentSection = 'index';
                    }
                    break;
                case 'comment':
                    if (isNewTable) {
                        addTableBanner(table);
                        lastBannerTable = table;
                    }
                    if (currentSection !== 'comment') {
                        addSubHeader('Comments', table);
                        currentSection = 'comment';
                    }
                    break;
                default:
                    if (isNewTable) {
                        lastBannerTable = table;
                        currentSection = null;
                    }
                    break;
            }
        }
        else {
            if (lastBannerTable !== null) {
                lastBannerTable = null;
                currentSection = null;
            }
            if (result.length > 0 && result[result.length - 1] !== '') {
                result.push('');
            }
        }
        switch (kind) {
            case 'create-table':
                result.push(reformatCreateTableWithConstraintHeader(trimmed));
                break;
            default:
                result.push(trimmed);
                break;
        }
    }
    return result;
}
