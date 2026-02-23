"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateChangeId = generateChangeId;
exports.generateChangeSQL = generateChangeSQL;
exports.createChange = createChange;
exports.getChangeDisplayName = getChangeDisplayName;
exports.sortChangesByDependency = sortChangesByDependency;
exports.generateCombinedSQL = generateCombinedSQL;
exports.generateDownSQL = generateDownSQL;
const crypto = __importStar(require("node:crypto"));
function generateChangeId(type, objectType, objectName, parentName) {
    const input = `${type}:${objectType}:${parentName || ''}:${objectName}:${Date.now()}`;
    return crypto.createHash('sha1').update(input).digest('hex').substring(0, 12);
}
function generateChangeSQL(change) {
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
        case 'INDEX_COMMENT':
            return generateIndexCommentSQL(change);
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
                def += ` REFERENCES "${col.references.table}"`;
                if (col.references.column) {
                    def += `("${col.references.column}")`;
                }
                if (col.references.onDelete)
                    def += ` ON DELETE ${col.references.onDelete.toUpperCase()}`;
                if (col.references.onUpdate)
                    def += ` ON UPDATE ${col.references.onUpdate.toUpperCase()}`;
            }
            colDefs.push(def);
        }
        for (const con of data.constraints || []) {
            if (!con.definition || !con.definition.trim())
                continue;
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
        if (data.defaultValue) {
            let defaultVal = data.defaultValue;
            if (data.dataType.endsWith('[]') && (defaultVal === "'[]'::jsonb" || defaultVal === "'[]'::json" || defaultVal === "'{}'")) {
                defaultVal = `'{}'::${data.dataType}`;
            }
            sql += ` DEFAULT ${defaultVal}`;
        }
        return sql + ';';
    }
    else if (change.type === 'DROP') {
        return `ALTER TABLE "${tableName}" DROP COLUMN IF EXISTS "${change.objectName}" CASCADE;`;
    }
    else if (change.type === 'RENAME' && data) {
        const before = change.before;
        if (before?.name) {
            return `ALTER TABLE "${tableName}" RENAME COLUMN "${before.name}" TO "${data.name}";`;
        }
        return '';
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
                let defaultVal = data.defaultValue;
                if (data.dataType.endsWith('[]') && (defaultVal === "'[]'::jsonb" || defaultVal === "'[]'::json" || defaultVal === "'{}'")) {
                    defaultVal = `'{}'::${data.dataType}`;
                }
                lines.push(`ALTER TABLE "${tableName}" ALTER COLUMN "${data.name}" SET DEFAULT ${defaultVal};`);
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
    else if (change.type === 'RENAME' && data) {
        const before = change.before;
        if (before?.name) {
            return `ALTER INDEX "${before.name}" RENAME TO "${data.name}";`;
        }
        return '';
    }
    return '';
}
function generateConstraintSQL(change) {
    const tableName = change.parentName;
    if (!tableName)
        return '';
    const data = change.after;
    if (change.type === 'CREATE' && data) {
        if (!data.definition || data.definition.trim() === '') {
            if (data.name.endsWith('_key')) {
                return `-- Skipping ${data.name}: UNIQUE constraint already defined on column`;
            }
            return `-- Skipping ${data.name}: empty constraint definition`;
        }
        return `ALTER TABLE "${tableName}" ADD CONSTRAINT "${data.name}" ${data.definition};`;
    }
    else if (change.type === 'ALTER' && data) {
        const beforeData = change.before;
        const oldName = beforeData?.name || change.objectName;
        if (!data.definition || data.definition.trim() === '') {
            return `-- Skipping ALTER ${data.name}: empty constraint definition`;
        }
        const dropSQL = `ALTER TABLE "${tableName}" DROP CONSTRAINT IF EXISTS "${oldName}";`;
        const addSQL = `ALTER TABLE "${tableName}" ADD CONSTRAINT "${data.name}" ${data.definition};`;
        return `${dropSQL}\n${addSQL}`;
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
function generateIndexCommentSQL(change) {
    const data = change.after;
    if ((change.type === 'CREATE' || change.type === 'ALTER') && data) {
        const escaped = data.comment.replace(/'/g, "''");
        return `COMMENT ON INDEX "${data.indexName}" IS '${escaped}';`;
    }
    else if (change.type === 'DROP') {
        const beforeData = change.before;
        const indexName = beforeData?.indexName || change.objectName;
        return `COMMENT ON INDEX "${indexName}" IS NULL;`;
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
function createChange(type, objectType, objectName, before, after, parentName) {
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
function getChangeDisplayName(change) {
    const prefix = change.type === 'CREATE' ? '+' :
        change.type === 'DROP' ? '-' :
            change.type === 'ALTER' ? '~' :
                change.type === 'RENAME' ? '→' :
                    '>';
    if (change.objectType === 'INDEX') {
        const data = change.after;
        const tableName = data?.tableName || change.parentName;
        if (tableName) {
            return `${prefix} ${change.objectType} ${change.objectName} on ${tableName}`;
        }
    }
    if (change.objectType === 'INDEX_COMMENT') {
        const data = (change.after || change.before);
        const tableName = data?.tableName || change.parentName;
        if (tableName) {
            return `${prefix} INDEX COMMENT ${change.objectName} on ${tableName}`;
        }
        return `${prefix} INDEX COMMENT ${change.objectName}`;
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
        const data = (change.after || change.before);
        const columnName = data?.columnName;
        if (change.parentName && columnName) {
            return `${prefix} ${actionWord} CHECK ${change.objectName} on ${change.parentName}.${columnName}`;
        }
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
    if (change.type === 'RENAME') {
        const before = change.before;
        const after = change.after;
        if (before?.name && after?.name) {
            if (change.parentName) {
                return `${prefix} RENAME ${change.objectType} ${change.parentName}.${before.name} → ${after.name}`;
            }
            return `${prefix} RENAME ${change.objectType} ${before.name} → ${after.name}`;
        }
    }
    if (change.parentName) {
        return `${prefix} ${change.objectType} ${change.parentName}.${change.objectName}`;
    }
    return `${prefix} ${change.objectType} ${change.objectName}`;
}
function sortChangesByDependency(changes) {
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
        'COLUMN_COMMENT': 14,
        'INDEX': 15,
        'INDEX_COMMENT': 16,
        'CONSTRAINT': 17,
        'PRIMARY_KEY': 17,
        'FOREIGN_KEY': 18,
        'CHECK': 17,
        'EXCLUSION': 17,
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
function generateCombinedSQL(changes) {
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
function generateDownSQL(changes) {
    const reversed = [...changes].reverse();
    const lines = [
        '--',
        '-- DOWN Migration (Rollback)',
        `-- Generated at: ${new Date().toISOString()}`,
        '--',
        '',
    ];
    for (const change of reversed) {
        const downSQL = generateDownSQLForChange(change);
        if (downSQL) {
            lines.push(downSQL);
            lines.push('');
        }
    }
    return lines.join('\n');
}
function generateDownSQLForChange(change) {
    const { type, objectType, objectName, parentName, before, after } = change;
    switch (type) {
        case 'CREATE':
            return generateDropSQL(objectType, objectName, parentName);
        case 'DROP':
            if (before) {
                return generateCreateSQL(objectType, objectName, before, parentName);
            }
            return `-- Cannot reverse DROP ${objectType} ${objectName} (no 'before' state saved)`;
        case 'ALTER':
            if (before && after) {
                return generateAlterReverseSQL(objectType, objectName, after, before, parentName);
            }
            return `-- Cannot reverse ALTER ${objectType} ${objectName} (no state saved)`;
        case 'RENAME':
            if (before && after) {
                const oldName = before.name || objectName;
                const newName = after.name || objectName;
                return generateRenameSQL(objectType, newName, oldName, parentName);
            }
            return `-- Cannot reverse RENAME ${objectType} ${objectName} (no state saved)`;
        default:
            return null;
    }
}
function generateDropSQL(objectType, objectName, parentName) {
    switch (objectType) {
        case 'TABLE':
            return `DROP TABLE IF EXISTS "${objectName}" CASCADE;`;
        case 'COLUMN':
            return `ALTER TABLE "${parentName}" DROP COLUMN IF EXISTS "${objectName}";`;
        case 'INDEX':
            return `DROP INDEX IF EXISTS "${objectName}";`;
        case 'ENUM':
            return `DROP TYPE IF EXISTS "${objectName}";`;
        case 'SEQUENCE':
            return `DROP SEQUENCE IF EXISTS "${objectName}";`;
        case 'FUNCTION':
            return `DROP FUNCTION IF EXISTS "${objectName}" CASCADE;`;
        case 'TRIGGER':
            return `DROP TRIGGER IF EXISTS "${objectName}" ON "${parentName}";`;
        case 'VIEW':
            return `DROP VIEW IF EXISTS "${objectName}";`;
        case 'CONSTRAINT':
        case 'CHECK':
        case 'FOREIGN_KEY':
        case 'PRIMARY_KEY':
            return `ALTER TABLE "${parentName}" DROP CONSTRAINT IF EXISTS "${objectName}";`;
        default:
            return `-- Cannot generate DROP for ${objectType} ${objectName}`;
    }
}
function generateCreateSQL(objectType, objectName, state, parentName) {
    switch (objectType) {
        case 'COLUMN':
            if (state.dataType) {
                const nullable = state.isNullable === false ? ' NOT NULL' : '';
                const defaultVal = state.defaultValue ? ` DEFAULT ${state.defaultValue}` : '';
                return `ALTER TABLE "${parentName}" ADD COLUMN "${objectName}" ${state.dataType}${nullable}${defaultVal};`;
            }
            break;
        case 'INDEX':
            if (state.columns) {
                const unique = state.isUnique ? 'UNIQUE ' : '';
                const cols = Array.isArray(state.columns) ? state.columns.join(', ') : state.columns;
                return `CREATE ${unique}INDEX "${objectName}" ON "${state.tableName || parentName}" (${cols});`;
            }
            break;
    }
    return `-- Cannot reconstruct CREATE ${objectType} ${objectName} from saved state`;
}
function generateAlterReverseSQL(objectType, objectName, from, to, parentName) {
    switch (objectType) {
        case 'COLUMN':
            const stmts = [];
            if (from.dataType !== to.dataType && to.dataType) {
                stmts.push(`ALTER TABLE "${parentName}" ALTER COLUMN "${objectName}" TYPE ${to.dataType};`);
            }
            if (from.isNullable !== to.isNullable) {
                if (to.isNullable === false) {
                    stmts.push(`ALTER TABLE "${parentName}" ALTER COLUMN "${objectName}" SET NOT NULL;`);
                }
                else {
                    stmts.push(`ALTER TABLE "${parentName}" ALTER COLUMN "${objectName}" DROP NOT NULL;`);
                }
            }
            if (from.defaultValue !== to.defaultValue) {
                if (to.defaultValue) {
                    stmts.push(`ALTER TABLE "${parentName}" ALTER COLUMN "${objectName}" SET DEFAULT ${to.defaultValue};`);
                }
                else {
                    stmts.push(`ALTER TABLE "${parentName}" ALTER COLUMN "${objectName}" DROP DEFAULT;`);
                }
            }
            return stmts.length > 0 ? stmts.join('\n') : `-- No reverse ALTER needed for ${objectName}`;
        default:
            return `-- Cannot reverse ALTER ${objectType} ${objectName}`;
    }
}
function generateRenameSQL(objectType, fromName, toName, parentName) {
    switch (objectType) {
        case 'TABLE':
            return `ALTER TABLE "${fromName}" RENAME TO "${toName}";`;
        case 'COLUMN':
            return `ALTER TABLE "${parentName}" RENAME COLUMN "${fromName}" TO "${toName}";`;
        case 'INDEX':
            return `ALTER INDEX "${fromName}" RENAME TO "${toName}";`;
        case 'ENUM':
            return `ALTER TYPE "${fromName}" RENAME TO "${toName}";`;
        case 'SEQUENCE':
            return `ALTER SEQUENCE "${fromName}" RENAME TO "${toName}";`;
        default:
            return `-- Cannot rename ${objectType} ${fromName} to ${toName}`;
    }
}
