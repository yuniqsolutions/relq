import { parse } from 'pgsql-parser';
import { deparse } from 'pgsql-deparser';
export async function parseSQL(sql) {
    try {
        const result = await parse(sql);
        return result;
    }
    catch (err) {
        return null;
    }
}
export async function normalizeSQL(sql) {
    try {
        const ast = await parse(sql);
        if (!ast || ast.length === 0)
            return null;
        return await deparse(ast);
    }
    catch (err) {
        return null;
    }
}
export async function compareSQLByAST(sql1, sql2) {
    try {
        const [ast1, ast2] = await Promise.all([parse(sql1), parse(sql2)]);
        if (!ast1 || !ast2)
            return false;
        const [normalized1, normalized2] = await Promise.all([deparse(ast1), deparse(ast2)]);
        return normalized1 === normalized2;
    }
    catch (err) {
        return false;
    }
}
export async function normalizeCheckConstraint(definition) {
    if (!definition)
        return null;
    let sqlToparse = definition.trim();
    if (sqlToparse.toUpperCase().startsWith('CHECK')) {
        sqlToparse = sqlToparse.slice(5).trim();
    }
    while (sqlToparse.startsWith('(') && sqlToparse.endsWith(')')) {
        let depth = 0;
        let innerIsSame = true;
        for (let i = 0; i < sqlToparse.length - 1; i++) {
            if (sqlToparse[i] === '(')
                depth++;
            else if (sqlToparse[i] === ')') {
                depth--;
                if (depth === 0 && i < sqlToparse.length - 1) {
                    innerIsSame = false;
                    break;
                }
            }
        }
        if (innerIsSame) {
            sqlToparse = sqlToparse.slice(1, -1).trim();
        }
        else {
            break;
        }
    }
    try {
        const wrappedSQL = `SELECT * FROM t WHERE ${sqlToparse}`;
        const ast = await parse(wrappedSQL);
        if (ast && ast.length > 0) {
            const normalized = await deparse(ast);
            const whereIdx = normalized.toUpperCase().indexOf('WHERE ');
            if (whereIdx >= 0) {
                return normalized.slice(whereIdx + 6).trim();
            }
        }
    }
    catch (err) {
    }
    const wrapStrategies = [
        `SELECT CASE WHEN ${sqlToparse} THEN 1 END`,
        `CREATE TABLE t (x INT CHECK (${sqlToparse}))`,
    ];
    for (const wrapped of wrapStrategies) {
        try {
            const ast = await parse(wrapped);
            if (ast && ast.length > 0) {
                return await deparse(ast);
            }
        }
        catch {
            continue;
        }
    }
    return null;
}
export async function compareCheckConstraintsAsync(def1, def2) {
    if (!def1 && !def2)
        return true;
    if (!def1 || !def2)
        return false;
    const [norm1, norm2] = await Promise.all([
        normalizeCheckConstraint(def1),
        normalizeCheckConstraint(def2)
    ]);
    if (norm1 && norm2) {
        return norm1 === norm2;
    }
    return compareCheckValues(def1, def2);
}
export async function compareCheckConstraints(def1, def2) {
    if (!def1 && !def2)
        return true;
    if (!def1 || !def2)
        return false;
    const [norm1, norm2] = await Promise.all([
        normalizeCheckConstraint(def1),
        normalizeCheckConstraint(def2)
    ]);
    if (norm1 && norm2) {
        return norm1 === norm2;
    }
    return compareCheckValues(def1, def2);
}
function compareCheckValues(def1, def2) {
    const values1 = extractCheckValues(def1);
    const values2 = extractCheckValues(def2);
    if (values1.length !== values2.length)
        return false;
    const sorted1 = [...values1].sort();
    const sorted2 = [...values2].sort();
    return sorted1.every((v, i) => v === sorted2[i]);
}
function extractCheckValues(definition) {
    if (!definition)
        return [];
    const arrayMatch = definition.match(/ARRAY\[([^\]]+)\]/i);
    if (arrayMatch) {
        const valuesStr = arrayMatch[1];
        const values = valuesStr.match(/'([^']+)'/g)?.map(v => v.replace(/'/g, '').toLowerCase()) || [];
        return values;
    }
    const inMatch = definition.match(/IN\s*\(([^)]+)\)/i);
    if (inMatch) {
        const valuesStr = inMatch[1];
        const values = valuesStr.match(/'([^']+)'/g)?.map(v => v.replace(/'/g, '').toLowerCase()) || [];
        return values;
    }
    return [];
}
export async function normalizeFunctionBodyAST(body) {
    if (!body)
        return null;
    try {
        const asBlock = `DO $$ ${body} $$`;
        const ast = await parse(asBlock);
        if (ast && ast.length > 0) {
            return await deparse(ast);
        }
    }
    catch {
    }
    try {
        const ast = await parse(body);
        if (ast && ast.length > 0) {
            return await deparse(ast);
        }
    }
    catch {
    }
    try {
        const asFunc = `CREATE FUNCTION _tmp() RETURNS void AS $$ ${body} $$ LANGUAGE plpgsql`;
        const ast = await parse(asFunc);
        if (ast && ast.length > 0) {
            return await deparse(ast);
        }
    }
    catch {
    }
    return null;
}
export async function compareFunctionBodiesAsync(body1, body2) {
    if (!body1 && !body2)
        return true;
    if (!body1 || !body2)
        return false;
    const [norm1, norm2] = await Promise.all([
        normalizeFunctionBodyAST(body1),
        normalizeFunctionBodyAST(body2)
    ]);
    if (norm1 && norm2) {
        return norm1 === norm2;
    }
    return normalizeString(body1) === normalizeString(body2);
}
export async function compareFunctionBodies(body1, body2) {
    if (!body1 && !body2)
        return true;
    if (!body1 || !body2)
        return false;
    const [norm1, norm2] = await Promise.all([
        normalizeFunctionBodyAST(body1),
        normalizeFunctionBodyAST(body2)
    ]);
    if (norm1 && norm2) {
        return norm1 === norm2;
    }
    return normalizeString(body1) === normalizeString(body2);
}
function normalizeString(str) {
    if (!str)
        return '';
    return str.trim().replace(/\s+/g, ' ').toLowerCase();
}
export async function normalizeCreateTable(sql) {
    try {
        const ast = await parse(sql);
        if (ast && ast.length > 0) {
            return await deparse(ast);
        }
    }
    catch {
        return null;
    }
    return null;
}
export function extractColumnFromCheck(definition) {
    if (!definition)
        return null;
    const enumMatch = definition.match(/\((\w+)\)::text\s*=\s*ANY/i);
    if (enumMatch)
        return enumMatch[1].toLowerCase();
    const inMatch = definition.match(/["\(](\w+)["]\s+IN\s*\(/i);
    if (inMatch)
        return inMatch[1].toLowerCase();
    const compMatch = definition.match(/\(\(?(\w+)\s*(?:>=?|<=?|<>|!=|=)/i);
    if (compMatch)
        return compMatch[1].toLowerCase();
    return null;
}
export function compareTriggers(trigger1, trigger2) {
    if (!trigger1 || !trigger2)
        return false;
    return (normalizeString(trigger1.timing) === normalizeString(trigger2.timing) &&
        normalizeString(trigger1.event) === normalizeString(trigger2.event) &&
        normalizeString(trigger1.functionName) === normalizeString(trigger2.functionName) &&
        normalizeString(trigger1.tableName) === normalizeString(trigger2.tableName));
}
