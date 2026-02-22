import { toCamelCase, escapeString, isBalanced, getComparisonMethod } from "./utils.js";
import { astToBuilder } from "./builder.js";
let needsSqlImport = false;
export function resetSqlImportFlag() {
    needsSqlImport = false;
}
export function getSqlImportNeeded() {
    return needsSqlImport;
}
export function extractEnumValues(expression) {
    const anyMatch = expression.match(/ANY\s*\(\s*\(?(?:ARRAY)?\s*\[([^\]]+)\]/i);
    if (anyMatch) {
        const valuesStr = anyMatch[1];
        const values = valuesStr.match(/'([^']+)'/g)?.map(v => v.replace(/'/g, '').replace(/::.*$/, '')) || [];
        return values.length > 0 ? values : null;
    }
    const inMatch = expression.match(/\bIN\s*\(([^)]+)\)/i);
    if (inMatch) {
        const valuesStr = inMatch[1];
        const values = valuesStr.match(/'([^']+)'/g)?.map(v => v.replace(/'/g, '')) || [];
        return values.length > 0 ? values : null;
    }
    return null;
}
export function generateConstraintCode(constraints, useCamelCase) {
    const lines = [];
    for (const c of constraints) {
        const cols = c.columns.map(col => `table.${useCamelCase ? toCamelCase(col) : col}`);
        const commentOpt = c.comment ? `, comment: '${escapeString(c.comment)}'` : '';
        if (c.type === 'PRIMARY KEY' && c.columns.length > 1) {
            const nameOpt = c.name ? `name: '${c.name}', ` : '';
            lines.push(`        constraint.primaryKey({ ${nameOpt}columns: [${cols.join(', ')}]${commentOpt} })`);
        }
        else if (c.type === 'UNIQUE' && c.columns.length > 1) {
            const nameOpt = c.name ? `name: '${c.name}', ` : '';
            lines.push(`        constraint.unique({ ${nameOpt}columns: [${cols.join(', ')}]${commentOpt} })`);
        }
        else if (c.type === 'EXCLUDE' && c.expression) {
            const escapedExpr = escapeString(c.expression);
            let line = `        constraint.exclude('${c.name}', '${escapedExpr}')`;
            if (c.comment) {
                line += `.comment('${escapeString(c.comment)}')`;
            }
            lines.push(line);
        }
    }
    return lines;
}
export function generateForeignKeysOption(constraints) {
    const fks = constraints.filter(c => c.type === 'FOREIGN KEY' && c.references);
    if (fks.length === 0)
        return null;
    const entries = fks.map(fk => {
        const cols = fk.columns.map(c => `'${c}'`).join(', ');
        const refCols = fk.references.columns.map(c => `'${c}'`).join(', ');
        let entry = `        { columns: [${cols}], references: { table: '${fk.references.table}', columns: [${refCols}] }`;
        if (fk.references.onDelete && fk.references.onDelete !== 'NO ACTION') {
            entry += `, onDelete: '${fk.references.onDelete}'`;
        }
        if (fk.references.onUpdate && fk.references.onUpdate !== 'NO ACTION') {
            entry += `, onUpdate: '${fk.references.onUpdate}'`;
        }
        entry += ' }';
        return entry;
    });
    return `    foreignKeys: [\n${entries.join(',\n')},\n    ]`;
}
export function generateCheckConstraintsOption(constraints, useCamelCase) {
    const checks = constraints.filter(c => c.type === 'CHECK' && c.expression && !extractEnumValues(c.expression));
    if (checks.length === 0)
        return null;
    const lines = checks.map(c => {
        if (c.expressionAst) {
            try {
                const typedExpr = astToBuilder(c.expressionAst, {
                    prefix: 'table',
                    useCamelCase,
                    useTableRef: true
                });
                return `        check.constraint('${c.name}', ${typedExpr})`;
            }
            catch {
                const typedExpr = convertCheckExpressionToTyped(c.expression, useCamelCase);
                return `        check.constraint('${c.name}', ${typedExpr})`;
            }
        }
        const typedExpr = convertCheckExpressionToTyped(c.expression, useCamelCase);
        return `        check.constraint('${c.name}', ${typedExpr})`;
    });
    return `    checkConstraints: (table, check) => [\n${lines.join(',\n')},\n    ]`;
}
export function convertCheckExpressionToTyped(expression, useCamelCase) {
    const trimmed = expression.trim();
    let expr = trimmed;
    while (expr.startsWith('(') && expr.endsWith(')')) {
        const inner = expr.slice(1, -1);
        if (isBalanced(inner)) {
            expr = inner;
        }
        else {
            break;
        }
    }
    const comparisonMatch = expr.match(/^(\w+)\s*(>=?|<=?|<>|!=|=)\s*\(?\s*(-?\d+(?:\.\d+)?)\s*\)?(?:::[\w\s]+)?$/i);
    if (comparisonMatch) {
        const [, column, op, value] = comparisonMatch;
        const colName = useCamelCase ? toCamelCase(column) : column;
        const method = getComparisonMethod(op);
        return `table.${colName}.${method}(${value})`;
    }
    const isNotNullMatch = expr.match(/^(\w+)\s+IS\s+NOT\s+NULL$/i);
    if (isNotNullMatch) {
        const colName = useCamelCase ? toCamelCase(isNotNullMatch[1]) : isNotNullMatch[1];
        return `table.${colName}.isNotNull()`;
    }
    const isNullMatch = expr.match(/^(\w+)\s+IS\s+NULL$/i);
    if (isNullMatch) {
        const colName = useCamelCase ? toCamelCase(isNullMatch[1]) : isNullMatch[1];
        return `table.${colName}.isNull()`;
    }
    const betweenMatch = expr.match(/^(\w+)\s+BETWEEN\s+(-?\d+(?:\.\d+)?)\s+AND\s+(-?\d+(?:\.\d+)?)$/i);
    if (betweenMatch) {
        const [, column, min, max] = betweenMatch;
        const colName = useCamelCase ? toCamelCase(column) : column;
        return `table.${colName}.between(${min}, ${max})`;
    }
    const stringCompareMatch = expr.match(/^(\w+)\s*(=|<>|!=)\s*'([^']*)'(?:::[\w\s]+)?$/i);
    if (stringCompareMatch) {
        const [, column, op, value] = stringCompareMatch;
        const colName = useCamelCase ? toCamelCase(column) : column;
        const method = getComparisonMethod(op);
        return `table.${colName}.${method}('${value}')`;
    }
    const colCompareMatch = expr.match(/^(\w+)\s*(>=?|<=?|<>|!=|=)\s*(\w+)$/i);
    if (colCompareMatch) {
        const [, col1, op, col2] = colCompareMatch;
        const colName1 = useCamelCase ? toCamelCase(col1) : col1;
        const colName2 = useCamelCase ? toCamelCase(col2) : col2;
        const method = getComparisonMethod(op);
        return `table.${colName1}.${method}(table.${colName2})`;
    }
    const lengthMatch = expr.match(/^length\((\w+)\)\s*(>=?|<=?|<>|!=|=)\s*(\d+)$/i);
    if (lengthMatch) {
        const [, column, op, value] = lengthMatch;
        const colName = useCamelCase ? toCamelCase(column) : column;
        const method = getComparisonMethod(op);
        return `table.${colName}.asText().length().${method}(${value})`;
    }
    const andRangeMatch = expr.match(/^\((\w+)\s*(>=?)\s*(-?\d+(?:\.\d+)?)\)\s+AND\s+\(\1\s*(<=?)\s*(-?\d+(?:\.\d+)?)\)$/i);
    if (andRangeMatch) {
        const [, column, op1, min, op2, max] = andRangeMatch;
        const colName = useCamelCase ? toCamelCase(column) : column;
        const method1 = getComparisonMethod(op1);
        const method2 = getComparisonMethod(op2);
        return `table.${colName}.${method1}(${min}).and(table.${colName}.${method2}(${max}))`;
    }
    const andOpenRangeMatch = expr.match(/^\((\w+)\s*(>)\s*(-?\d+(?:\.\d+)?)\)\s+AND\s+\(\1\s*(<)\s*(-?\d+(?:\.\d+)?)\)$/i);
    if (andOpenRangeMatch) {
        const [, column, op1, min, op2, max] = andOpenRangeMatch;
        const colName = useCamelCase ? toCamelCase(column) : column;
        const method1 = getComparisonMethod(op1);
        const method2 = getComparisonMethod(op2);
        return `table.${colName}.${method1}(${min}).and(table.${colName}.${method2}(${max}))`;
    }
    const andMatch = expr.match(/^\((.+?)\)\s+AND\s+\((.+)\)$/i);
    if (andMatch) {
        const [, cond1, cond2] = andMatch;
        const typed1 = convertCheckExpressionToTyped(`(${cond1})`, useCamelCase);
        const typed2 = convertCheckExpressionToTyped(`(${cond2})`, useCamelCase);
        if (!typed1.startsWith('sql`') && !typed2.startsWith('sql`')) {
            return `${typed1}.and(${typed2})`;
        }
    }
    needsSqlImport = true;
    return `sql\`${escapeString(expression)}\``;
}
