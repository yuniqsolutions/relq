"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSchemaCode = generateSchemaCode;
exports.toPascalCase = toPascalCase;
exports.escapeString = escapeString;
exports.formatDefaultValue = formatDefaultValue;
exports.introspectSQL = introspectSQL;
exports.introspectMultiple = introspectMultiple;
const sql_parser_1 = require("./sql-parser.cjs");
function generateSchemaCode(table, options) {
    const exportName = options.exportName || toPascalCase(table.name);
    const builderPath = options.importPath;
    const lines = [];
    lines.push(`import { defineTable } from '${builderPath}';`);
    lines.push("import {");
    const usedTypes = new Set();
    for (const col of table.columns) {
        const typeFunc = col.type.match(/^(\w+)/)?.[1];
        if (typeFunc) {
            usedTypes.add(typeFunc);
        }
    }
    lines.push(`  ${Array.from(usedTypes).join(', ')}`);
    lines.push(`} from '${builderPath}';`);
    lines.push('');
    lines.push(`export const ${exportName} = defineTable('${table.name}', {`);
    for (const col of table.columns) {
        let colDef = `  ${col.name}: ${col.type}`;
        const modifiers = [];
        if (col.array) {
            modifiers.push(col.arrayDimensions > 1 ? `.array(${col.arrayDimensions})` : '.array()');
        }
        if (!col.nullable) {
            modifiers.push('.notNull()');
        }
        if (col.primaryKey) {
            modifiers.push('.primaryKey()');
        }
        if (col.unique) {
            modifiers.push('.unique()');
        }
        if (col.default !== undefined) {
            const defaultVal = formatDefaultValue(col.default, col.type);
            modifiers.push(`.default(${defaultVal})`);
        }
        if (col.references) {
            let refCall = `.references('${col.references.table}', '${col.references.column}'`;
            if (col.references.onDelete || col.references.onUpdate) {
                const opts = [];
                if (col.references.onDelete) {
                    opts.push(`onDelete: '${col.references.onDelete}'`);
                }
                if (col.references.onUpdate) {
                    opts.push(`onUpdate: '${col.references.onUpdate}'`);
                }
                refCall += `, { ${opts.join(', ')} }`;
            }
            refCall += ')';
            modifiers.push(refCall);
        }
        if (col.check) {
            modifiers.push(`.check('${escapeString(col.check)}')`);
        }
        if (col.generated) {
            modifiers.push(`.generatedAs('${escapeString(col.generated.expression)}', ${col.generated.stored})`);
        }
        colDef += modifiers.join('');
        colDef += ',';
        lines.push(colDef);
    }
    lines.push('}');
    const hasOptions = table.schema || table.primaryKey ||
        table.uniqueConstraints.length > 0 ||
        table.checkConstraints.length > 0 ||
        table.foreignKeys.length > 0;
    if (hasOptions) {
        lines[lines.length - 1] = '}, {';
        if (table.schema) {
            lines.push(`  schema: '${table.schema}',`);
        }
        if (table.primaryKey && table.primaryKey.length > 0) {
            const hasInlineKey = table.columns.some(c => c.primaryKey);
            if (!hasInlineKey) {
                lines.push(`  primaryKey: [${table.primaryKey.map(k => `'${k}'`).join(', ')}],`);
            }
        }
        if (table.uniqueConstraints.length > 0) {
            lines.push('  uniqueConstraints: [');
            for (const uc of table.uniqueConstraints) {
                const cols = uc.columns.map(c => `'${c}'`).join(', ');
                if (uc.name) {
                    lines.push(`    { columns: [${cols}], name: '${uc.name}' },`);
                }
                else {
                    lines.push(`    { columns: [${cols}] },`);
                }
            }
            lines.push('  ],');
        }
        if (table.checkConstraints.length > 0) {
            lines.push('  checkConstraints: [');
            for (const cc of table.checkConstraints) {
                if (cc.name) {
                    lines.push(`    { expression: '${escapeString(cc.expression)}', name: '${cc.name}' },`);
                }
                else {
                    lines.push(`    { expression: '${escapeString(cc.expression)}' },`);
                }
            }
            lines.push('  ],');
        }
        if (table.foreignKeys.length > 0) {
            lines.push('  foreignKeys: [');
            for (const fk of table.foreignKeys) {
                const cols = fk.columns.map(c => `'${c}'`).join(', ');
                const refCols = fk.references.columns.map(c => `'${c}'`).join(', ');
                let fkDef = `    { columns: [${cols}], references: { table: '${fk.references.table}', columns: [${refCols}] }`;
                if (fk.onDelete) {
                    fkDef += `, onDelete: '${fk.onDelete}'`;
                }
                if (fk.onUpdate) {
                    fkDef += `, onUpdate: '${fk.onUpdate}'`;
                }
                if (fk.name) {
                    fkDef += `, name: '${fk.name}'`;
                }
                fkDef += ' },';
                lines.push(fkDef);
            }
            lines.push('  ],');
        }
        lines.push('});');
    }
    else {
        lines[lines.length - 1] = '});';
    }
    return lines.join('\n');
}
function toPascalCase(str) {
    return str
        .split(/[_-]/)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join('');
}
function escapeString(str) {
    return str.replace(/'/g, "\\'").replace(/\\/g, '\\\\');
}
function formatDefaultValue(value, colType) {
    const upper = value.toUpperCase().trim();
    if (upper === 'NOW()' || upper === 'CURRENT_TIMESTAMP' ||
        upper === 'CURRENT_DATE' || upper === 'CURRENT_TIME') {
        return `'${upper}'`;
    }
    if (upper.startsWith('GEN_RANDOM_UUID')) {
        return `'${upper}'`;
    }
    if (upper === 'TRUE' || upper === 'FALSE') {
        return upper.toLowerCase();
    }
    if (upper === 'NULL') {
        return 'null';
    }
    const isBigint = colType?.toLowerCase().startsWith('bigint');
    if (/^-?\d+$/.test(value)) {
        return isBigint ? `${value}n` : value;
    }
    if (/^-?\d+\.\d+$/.test(value)) {
        return value;
    }
    if (value.includes('(')) {
        return `'${value}'`;
    }
    return `'${escapeString(value)}'`;
}
function introspectSQL(sql, importPath) {
    const parsed = (0, sql_parser_1.parseCreateTable)(sql);
    const code = generateSchemaCode(parsed, { importPath });
    return { parsed, code };
}
function introspectMultiple(sql, importPath) {
    const statements = sql
        .split(/;\s*(?=CREATE\s+TABLE)/i)
        .filter(s => s.trim())
        .map(s => s.trim() + (s.trim().endsWith(';') ? '' : ';'));
    return statements.map(stmt => introspectSQL(stmt, importPath));
}
