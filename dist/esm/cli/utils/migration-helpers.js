import { getAdapter } from "../adapters/registry.js";
import { detectDialect } from "./dialect-router.js";
export async function getQuoteChar(dialect) {
    const adapter = await getAdapter(dialect);
    return adapter.quoteChar;
}
export async function getParamPlaceholder(dialect, index = 1) {
    const adapter = await getAdapter(dialect);
    return adapter.getParamPlaceholder(index);
}
export async function getMigrationTableDDL(config, tableName) {
    const dialect = detectDialect(config);
    const adapter = await getAdapter(dialect);
    return adapter.getMigrationTableDDL(tableName);
}
export function parseMigration(content) {
    const upMatch = content.match(/--\s*UP\s*\n([\s\S]*?)(?=--\s*DOWN|$)/i);
    const downMatch = content.match(/--\s*DOWN\s*\n([\s\S]*?)$/i);
    return {
        up: upMatch?.[1]?.trim() || '',
        down: downMatch?.[1]?.trim() || '',
    };
}
export function splitStatements(sql) {
    const statements = [];
    let current = '';
    let inSingleQuote = false;
    let inDollarQuote = false;
    let dollarTag = '';
    for (let i = 0; i < sql.length; i++) {
        const char = sql[i];
        const next = sql[i + 1] || '';
        if (!inSingleQuote && char === '$') {
            const tagMatch = sql.slice(i).match(/^\$([a-zA-Z_]*)\$/);
            if (tagMatch) {
                const tag = tagMatch[0];
                if (!inDollarQuote) {
                    inDollarQuote = true;
                    dollarTag = tag;
                    current += tag;
                    i += tag.length - 1;
                    continue;
                }
                else if (tag === dollarTag) {
                    inDollarQuote = false;
                    current += tag;
                    i += tag.length - 1;
                    dollarTag = '';
                    continue;
                }
            }
        }
        if (!inDollarQuote && char === "'") {
            if (inSingleQuote && next === "'") {
                current += "''";
                i++;
                continue;
            }
            inSingleQuote = !inSingleQuote;
        }
        if (char === ';' && !inSingleQuote && !inDollarQuote) {
            const trimmed = current.trim();
            if (trimmed) {
                statements.push(trimmed);
            }
            current = '';
            continue;
        }
        current += char;
    }
    const trimmed = current.trim();
    if (trimmed) {
        statements.push(trimmed);
    }
    return statements;
}
