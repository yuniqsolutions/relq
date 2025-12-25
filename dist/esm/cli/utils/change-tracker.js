import * as crypto from 'crypto';
export function generateChangeId(type, objectType, objectName, parentName) {
    const input = `${type}:${objectType}:${parentName || ''}:${objectName}:${Date.now()}`;
    return crypto.createHash('sha1').update(input).digest('hex').substring(0, 12);
}
export function generateChangeSQL(change) {
    switch (change.objectType) {
        case 'EXTENSION':
            return generateExtensionSQL(change);
        case 'ENUM':
            return generateEnumSQL(change);
        case 'ENUM_VALUE':
            return generateEnumValueSQL(change);
        case 'DOMAIN':
            return generateDomainSQL(change);
        case 'COMPOSITE_TYPE':
            return generateCompositeTypeSQL(change);
        case 'SEQUENCE':
            return generateSequenceSQL(change);
        case 'TABLE':
            return generateTableSQL(change);
        case 'COLUMN':
            return generateColumnSQL(change);
        case 'INDEX':
            return generateIndexSQL(change);
        case 'CONSTRAINT':
        case 'PRIMARY_KEY':
        case 'FOREIGN_KEY':
        case 'CHECK':
        case 'EXCLUSION':
            return generateConstraintSQL(change);
        case 'PARTITION':
            return generatePartitionSQL(change);
        case 'PARTITION_CHILD':
            return generatePartitionChildSQL(change);
        case 'TABLE_COMMENT':
            return generateTableCommentSQL(change);
        case 'COLUMN_COMMENT':
            return generateColumnCommentSQL(change);
        case 'VIEW':
            return generateViewSQL(change);
        case 'MATERIALIZED_VIEW':
            return generateMaterializedViewSQL(change);
        case 'FUNCTION':
        case 'PROCEDURE':
            return generateFunctionSQL(change);
        case 'TRIGGER':
            return generateTriggerSQL(change);
        case 'FOREIGN_SERVER':
            return generateForeignServerSQL(change);
        case 'FOREIGN_TABLE':
            return generateForeignTableSQL(change);
        case 'COLLATION':
            return generateCollationSQL(change);
        default:
            return `-- Unsupported object type: ${change.objectType}`;
    }
}
function generateExtensionSQL(change) {
    if (change.type === 'CREATE') {
        return `CREATE EXTENSION IF NOT EXISTS "${change.objectName}";`;
    }
    else if (change.type === 'DROP') {
        return `DROP EXTENSION IF EXISTS "${change.objectName}";`;
    }
    return '';
}
function generateEnumSQL(change) {
    const data = change.after;
    if (change.type === 'CREATE' && data) {
        const values = data.values.map(v => `'${v}'`).join(', ');
        return `CREATE TYPE "${data.name}" AS ENUM (${values});`;
    }
    else if (change.type === 'DROP') {
        return `DROP TYPE IF EXISTS "${change.objectName}" CASCADE;`;
    }
    return '';
}
function generateEnumValueSQL(change) {
    const data = change.after;
    if (change.type === 'CREATE' && data) {
        const afterClause = data.after ? ` AFTER '${data.after}'` : '';
        return `ALTER TYPE "${data.enumName}" ADD VALUE IF NOT EXISTS '${data.value}'${afterClause};`;
    }
    return '';
}
function generateDomainSQL(change) {
    const data = change.after;
    if (change.type === 'CREATE' && data) {
        let sql = `CREATE DOMAIN "${data.name}" AS ${data.baseType}`;
        if (data.default)
            sql += ` DEFAULT ${data.default}`;
        if (data.notNull)
            sql += ' NOT NULL';
        if (data.check)
            sql += ` CHECK (${data.check})`;
        return sql + ';';
    }
    else if (change.type === 'DROP') {
        return `DROP DOMAIN IF EXISTS "${change.objectName}" CASCADE;`;
    }
    return '';
}
function generateCompositeTypeSQL(change) {
    const data = change.after;
    if (change.type === 'CREATE' && data) {
        const attrs = data.attributes.map(a => `    "${a.name}" ${a.type}`).join(',\n');
        return `CREATE TYPE "${data.name}" AS (\n${attrs}\n);`;
    }
    else if (change.type === 'DROP') {
        return `DROP TYPE IF EXISTS "${change.objectName}" CASCADE;`;
    }
    return '';
}
function generateSequenceSQL(change) {
    const data = change.after;
    if (change.type === 'CREATE' && data) {
        let sql = `CREATE SEQUENCE IF NOT EXISTS "${data.name}"`;
        if (data.startWith)
            sql += ` START WITH ${data.startWith}`;
        if (data.incrementBy)
            sql += ` INCREMENT BY ${data.incrementBy}`;
        return sql + ';';
    }
    else if (change.type === 'DROP') {
        return `DROP SEQUENCE IF EXISTS "${change.objectName}" CASCADE;`;
    }
    return '';
}
function generateTableSQL(change) {
    const data = change.after;
    if (change.type === 'CREATE' && data) {
        const colDefs = [];
        const constraintDefs = [];
        for (const col of data.columns) {
            let def = `    "${col.name}" ${col.dataType}`;
            if (col.isPrimaryKey)
                def += ' PRIMARY KEY';
            if (!col.isNullable && !col.isPrimaryKey)
                def += ' NOT NULL';
            if (col.isUnique && !col.isPrimaryKey)
                def += ' UNIQUE';
            if (col.defaultValue)
                def += ` DEFAULT ${col.defaultValue}`;
            if (col.references) {
                def += ` REFERENCES "${col.references.table}"("${col.references.column}")`;
            }
            colDefs.push(def);
        }
        for (const con of data.constraints || []) {
            constraintDefs.push(`    CONSTRAINT "${con.name}" ${con.definition}`);
        }
        const allDefs = [...colDefs, ...constraintDefs].join(',\n');
        let sql = `CREATE TABLE "${data.name}" (\n${allDefs}\n)`;
        if (data.isPartitioned && data.partitionType && data.partitionKey) {
            const keyArr = Array.isArray(data.partitionKey) ? data.partitionKey : [data.partitionKey];
            if (keyArr.length) {
                sql += ` PARTITION BY ${data.partitionType} (${keyArr.join(', ')})`;
            }
        }
        return sql + ';';
    }
    else if (change.type === 'DROP') {
        return `DROP TABLE IF EXISTS "${change.objectName}" CASCADE;`;
    }
    return '';
}
function generateColumnSQL(change) {
    const tableName = change.parentName;
    if (!tableName)
        return '';
    const data = change.after;
    if (change.type === 'CREATE' && data) {
        let sql = `ALTER TABLE "${tableName}" ADD COLUMN "${data.name}" ${data.dataType}`;
        if (!data.isNullable)
            sql += ' NOT NULL';
        if (data.defaultValue)
            sql += ` DEFAULT ${data.defaultValue}`;
        return sql + ';';
    }
    else if (change.type === 'DROP') {
        return `ALTER TABLE "${tableName}" DROP COLUMN IF EXISTS "${change.objectName}" CASCADE;`;
    }
    else if (change.type === 'ALTER' && data) {
        const before = change.before;
        const lines = [];
        if (before?.dataType !== data.dataType) {
            lines.push(`ALTER TABLE "${tableName}" ALTER COLUMN "${data.name}" TYPE ${data.dataType};`);
        }
        if (before?.isNullable !== data.isNullable) {
            if (data.isNullable) {
                lines.push(`ALTER TABLE "${tableName}" ALTER COLUMN "${data.name}" DROP NOT NULL;`);
            }
            else {
                lines.push(`ALTER TABLE "${tableName}" ALTER COLUMN "${data.name}" SET NOT NULL;`);
            }
        }
        if (before?.defaultValue !== data.defaultValue) {
            if (data.defaultValue) {
                lines.push(`ALTER TABLE "${tableName}" ALTER COLUMN "${data.name}" SET DEFAULT ${data.defaultValue};`);
            }
            else {
                lines.push(`ALTER TABLE "${tableName}" ALTER COLUMN "${data.name}" DROP DEFAULT;`);
            }
        }
        return lines.join('\n');
    }
    return '';
}
function generateIndexSQL(change) {
    const data = change.after;
    if (change.type === 'CREATE' && data) {
        const unique = data.isUnique ? 'UNIQUE ' : '';
        const using = data.type && data.type !== 'btree' ? ` USING ${data.type}` : '';
        const cols = data.columns.map(c => `"${c}"`).join(', ');
        let sql = `CREATE ${unique}INDEX IF NOT EXISTS "${data.name}" ON "${data.tableName}"${using} (${cols})`;
        if (data.where)
            sql += ` WHERE ${data.where}`;
        return sql + ';';
    }
    else if (change.type === 'DROP') {
        return `DROP INDEX IF EXISTS "${change.objectName}";`;
    }
    return '';
}
function generateConstraintSQL(change) {
    const tableName = change.parentName;
    if (!tableName)
        return '';
    const data = change.after;
    if (change.type === 'CREATE' && data) {
        return `ALTER TABLE "${tableName}" ADD CONSTRAINT "${data.name}" ${data.definition};`;
    }
    else if (change.type === 'DROP') {
        return `ALTER TABLE "${tableName}" DROP CONSTRAINT IF EXISTS "${change.objectName}";`;
    }
    return '';
}
function generatePartitionSQL(change) {
    return '';
}
function generatePartitionChildSQL(change) {
    const data = change.after;
    if (change.type === 'CREATE' && data) {
        return `CREATE TABLE "${data.name}" PARTITION OF "${data.parentTable}" ${data.bound};`;
    }
    else if (change.type === 'DROP') {
        return `DROP TABLE IF EXISTS "${change.objectName}";`;
    }
    return '';
}
function generateTableCommentSQL(change) {
    const data = change.after;
    if ((change.type === 'CREATE' || change.type === 'ALTER') && data) {
        const escaped = data.comment.replace(/'/g, "''");
        return `COMMENT ON TABLE "${data.tableName}" IS '${escaped}';`;
    }
    else if (change.type === 'DROP') {
        const beforeData = change.before;
        const tableName = beforeData?.tableName || change.objectName;
        return `COMMENT ON TABLE "${tableName}" IS NULL;`;
    }
    return '';
}
function generateColumnCommentSQL(change) {
    const data = change.after;
    if ((change.type === 'CREATE' || change.type === 'ALTER') && data) {
        const escaped = data.comment.replace(/'/g, "''");
        return `COMMENT ON COLUMN "${data.tableName}"."${data.columnName}" IS '${escaped}';`;
    }
    else if (change.type === 'DROP') {
        const beforeData = change.before;
        const tableName = beforeData?.tableName || change.parentName || '';
        const columnName = beforeData?.columnName || change.objectName;
        return `COMMENT ON COLUMN "${tableName}"."${columnName}" IS NULL;`;
    }
    return '';
}
function generateViewSQL(change) {
    const data = change.after;
    if (change.type === 'CREATE' && data) {
        return `CREATE OR REPLACE VIEW "${data.name}" AS ${data.definition};`;
    }
    else if (change.type === 'DROP') {
        return `DROP VIEW IF EXISTS "${change.objectName}" CASCADE;`;
    }
    return '';
}
function generateMaterializedViewSQL(change) {
    const data = change.after;
    if (change.type === 'CREATE' && data) {
        return `CREATE MATERIALIZED VIEW IF NOT EXISTS "${data.name}" AS ${data.definition};`;
    }
    else if (change.type === 'DROP') {
        return `DROP MATERIALIZED VIEW IF EXISTS "${change.objectName}" CASCADE;`;
    }
    return '';
}
function generateFunctionSQL(change) {
    const data = change.after;
    if (change.type === 'CREATE' && data) {
        const args = data.args || '';
        const volatility = data.volatility || 'VOLATILE';
        return `CREATE OR REPLACE FUNCTION "${data.name}"(${args})
RETURNS ${data.returns}
LANGUAGE ${data.language}
${volatility}
AS $$
${data.body}
$$;`;
    }
    else if (change.type === 'DROP') {
        return `DROP FUNCTION IF EXISTS "${change.objectName}" CASCADE;`;
    }
    return '';
}
function generateTriggerSQL(change) {
    const data = change.after;
    if (change.type === 'CREATE' && data) {
        return `CREATE TRIGGER "${data.name}"
    ${data.timing} ${data.event} ON "${data.tableName}"
    FOR EACH ROW EXECUTE FUNCTION ${data.functionName}();`;
    }
    else if (change.type === 'DROP' && change.parentName) {
        return `DROP TRIGGER IF EXISTS "${change.objectName}" ON "${change.parentName}";`;
    }
    return '';
}
function generateForeignServerSQL(change) {
    const data = change.after;
    if (change.type === 'CREATE' && data) {
        let sql = `CREATE SERVER IF NOT EXISTS "${data.name}" FOREIGN DATA WRAPPER ${data.fdw}`;
        if (data.options && Object.keys(data.options).length > 0) {
            const opts = Object.entries(data.options)
                .map(([k, v]) => `${k} '${v}'`)
                .join(', ');
            sql += ` OPTIONS (${opts})`;
        }
        return sql + ';';
    }
    else if (change.type === 'DROP') {
        return `DROP SERVER IF EXISTS "${change.objectName}" CASCADE;`;
    }
    return '';
}
function generateForeignTableSQL(change) {
    const data = change.after;
    if (change.type === 'CREATE' && data) {
        const cols = data.columns.map(c => `    "${c.name}" ${c.type}`).join(',\n');
        let sql = `CREATE FOREIGN TABLE IF NOT EXISTS "${data.name}" (\n${cols}\n) SERVER "${data.serverName}"`;
        if (data.options && Object.keys(data.options).length > 0) {
            const opts = Object.entries(data.options)
                .map(([k, v]) => `${k} '${v}'`)
                .join(', ');
            sql += ` OPTIONS (${opts})`;
        }
        return sql + ';';
    }
    else if (change.type === 'DROP') {
        return `DROP FOREIGN TABLE IF EXISTS "${change.objectName}";`;
    }
    return '';
}
function generateCollationSQL(change) {
    const data = change.after;
    if (change.type === 'CREATE' && data) {
        const options = [];
        if (data.locale)
            options.push(`LOCALE = '${data.locale}'`);
        if (data.lcCollate)
            options.push(`LC_COLLATE = '${data.lcCollate}'`);
        if (data.lcCtype)
            options.push(`LC_CTYPE = '${data.lcCtype}'`);
        if (data.provider)
            options.push(`PROVIDER = ${data.provider}`);
        if (data.deterministic !== undefined) {
            options.push(`DETERMINISTIC = ${data.deterministic ? 'TRUE' : 'FALSE'}`);
        }
        return `CREATE COLLATION IF NOT EXISTS "${data.name}" (${options.join(', ')});`;
    }
    else if (change.type === 'DROP') {
        return `DROP COLLATION IF EXISTS "${change.objectName}";`;
    }
    return '';
}
export function createChange(type, objectType, objectName, before, after, parentName) {
    const id = generateChangeId(type, objectType, objectName, parentName);
    const change = {
        id,
        type,
        objectType,
        objectName,
        parentName,
        before,
        after,
        sql: '',
        detectedAt: new Date().toISOString(),
    };
    change.sql = generateChangeSQL(change);
    return change;
}
export function getChangeDisplayName(change) {
    const prefix = change.type === 'CREATE' ? '+' :
        change.type === 'DROP' ? '-' :
            change.type === 'ALTER' ? '~' :
                '>';
    if (change.objectType === 'INDEX') {
        const data = change.after;
        const tableName = data?.tableName || change.parentName;
        if (tableName) {
            return `${prefix} ${change.objectType} ${change.objectName} on ${tableName}`;
        }
    }
    if (change.objectType === 'PARTITION') {
        const data = change.after;
        if (data?.tableName && data?.type && data?.key) {
            let keyStr = Array.isArray(data.key) ? data.key.join(', ') : data.key;
            keyStr = keyStr.replace(/[{}]/g, '');
            return `${prefix} PARTITIONED ${data.tableName} by ${data.type.toUpperCase()}(${keyStr})`;
        }
    }
    if (change.objectType === 'PARTITION_CHILD') {
        const data = change.after;
        if (data?.name && data?.parentTable) {
            const bound = data.bound || '';
            return `${prefix} PARTITION ${data.name} of ${data.parentTable} ${bound}`;
        }
    }
    if (change.objectType === 'CHECK') {
        const actionWord = change.type === 'CREATE' ? 'ADD' : change.type === 'DROP' ? 'DROP' : 'ALTER';
        if (change.parentName) {
            return `${prefix} ${actionWord} CHECK ${change.objectName} on ${change.parentName}`;
        }
        return `${prefix} ${actionWord} CHECK ${change.objectName}`;
    }
    if (change.objectType === 'PRIMARY_KEY' || change.objectType === 'FOREIGN_KEY' || change.objectType === 'EXCLUSION') {
        const actionWord = change.type === 'CREATE' ? 'ADD' : change.type === 'DROP' ? 'DROP' : 'ALTER';
        if (change.parentName) {
            return `${prefix} ${actionWord} ${change.objectType.replace('_', ' ')} ${change.objectName} on ${change.parentName}`;
        }
        return `${prefix} ${actionWord} ${change.objectType.replace('_', ' ')} ${change.objectName}`;
    }
    if (change.parentName) {
        return `${prefix} ${change.objectType} ${change.parentName}.${change.objectName}`;
    }
    return `${prefix} ${change.objectType} ${change.objectName}`;
}
export function sortChangesByDependency(changes) {
    const order = {
        'EXTENSION': 1,
        'SCHEMA': 2,
        'SCHEMA_FILE': 0,
        'ENUM': 3,
        'DOMAIN': 4,
        'COMPOSITE_TYPE': 5,
        'SEQUENCE': 6,
        'FOREIGN_SERVER': 7,
        'TABLE': 10,
        'TABLE_COMMENT': 10,
        'PARTITION': 11,
        'PARTITION_CHILD': 12,
        'COLUMN': 13,
        'COLUMN_COMMENT': 12,
        'INDEX': 13,
        'CONSTRAINT': 14,
        'PRIMARY_KEY': 14,
        'FOREIGN_KEY': 15,
        'CHECK': 14,
        'EXCLUSION': 14,
        'VIEW': 20,
        'MATERIALIZED_VIEW': 21,
        'FUNCTION': 30,
        'PROCEDURE': 31,
        'TRIGGER': 40,
        'ENUM_VALUE': 3,
        'COLLATION': 4,
        'FOREIGN_TABLE': 8,
    };
    return [...changes].sort((a, b) => {
        if (a.type === 'CREATE' && b.type === 'DROP')
            return -1;
        if (a.type === 'DROP' && b.type === 'CREATE')
            return 1;
        return (order[a.objectType] || 50) - (order[b.objectType] || 50);
    });
}
export function generateCombinedSQL(changes) {
    const sorted = sortChangesByDependency(changes);
    const lines = [
        '--',
        '-- Generated by Relq CLI',
        `-- Generated at: ${new Date().toISOString()}`,
        '--',
        '',
    ];
    let currentSection = '';
    for (const change of sorted) {
        const section = change.objectType;
        if (section !== currentSection) {
            lines.push(`-- ${section}s`);
            currentSection = section;
        }
        if (change.sql) {
            lines.push(change.sql);
            lines.push('');
        }
    }
    return lines.join('\n');
}
