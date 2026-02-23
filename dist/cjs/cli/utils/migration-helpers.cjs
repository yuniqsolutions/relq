"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getQuoteChar = getQuoteChar;
exports.getParamPlaceholder = getParamPlaceholder;
exports.getMigrationTableDDL = getMigrationTableDDL;
exports.parseMigration = parseMigration;
exports.splitStatements = splitStatements;
const registry_1 = require("../adapters/registry.cjs");
const dialect_router_1 = require("./dialect-router.cjs");
async function getQuoteChar(dialect) {
    const adapter = await (0, registry_1.getAdapter)(dialect);
    return adapter.quoteChar;
}
async function getParamPlaceholder(dialect, index = 1) {
    const adapter = await (0, registry_1.getAdapter)(dialect);
    return adapter.getParamPlaceholder(index);
}
async function getMigrationTableDDL(config, tableName) {
    const dialect = (0, dialect_router_1.detectDialect)(config);
    const adapter = await (0, registry_1.getAdapter)(dialect);
    return adapter.getMigrationTableDDL(tableName);
}
function parseMigration(content) {
    const upMatch = content.match(/--\s*UP\s*\n([\s\S]*?)(?=--\s*DOWN|$)/i);
    const downMatch = content.match(/--\s*DOWN\s*\n([\s\S]*?)$/i);
    return {
        up: upMatch?.[1]?.trim() || '',
        down: downMatch?.[1]?.trim() || '',
    };
}
function splitStatements(sql) {
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
