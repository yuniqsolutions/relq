import * as fs from 'node:fs';
import * as path from 'node:path';
import { buildPoolConfig } from "../../config/config.js";
import { detectDialect } from "./dialect-router.js";
function getCreateTableSql(isDsql) {
    const jsonType = isDsql ? 'TEXT' : 'JSONB';
    return `
CREATE TABLE IF NOT EXISTS _relq_types (
    name TEXT PRIMARY KEY,
    kind TEXT NOT NULL CHECK (kind IN ('interface', 'type')),
    source TEXT NOT NULL,
    usages ${jsonType} DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_relq_types_kind ON _relq_types(kind);
`;
}
function getAddUsagesColumnSql(isDsql) {
    const jsonType = isDsql ? 'TEXT' : 'JSONB';
    return `ALTER TABLE _relq_types ADD COLUMN IF NOT EXISTS usages ${jsonType} DEFAULT '[]';`;
}
async function createPool(connection) {
    const { Pool } = await import('pg');
    const poolConfig = await buildPoolConfig(connection);
    return new Pool(poolConfig);
}
export async function ensureTypesTable(connection) {
    const pool = await createPool(connection);
    const isDsql = detectDialect({ connection }) === 'dsql';
    try {
        await pool.query(getCreateTableSql(isDsql));
        await pool.query(getAddUsagesColumnSql(isDsql));
    }
    finally {
        await pool.end();
    }
}
export async function typesTableExists(connection) {
    const pool = await createPool(connection);
    try {
        const result = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_name = '_relq_types'
            ) as exists
        `);
        return result.rows[0]?.exists ?? false;
    }
    finally {
        await pool.end();
    }
}
export function parseTypesFile(content) {
    const definitions = [];
    const lines = content.split('\n');
    let i = 0;
    while (i < lines.length) {
        const line = lines[i];
        const interfaceMatch = line.match(/^(?:export\s+)?interface\s+(\w+)(?:<[^>]+>)?\s*\{?\s*$/);
        if (interfaceMatch) {
            const name = interfaceMatch[1];
            const startLine = i;
            const { endLine, source } = extractBlock(lines, i);
            definitions.push({ name, kind: 'interface', source, startLine, endLine });
            i = endLine + 1;
            continue;
        }
        const interfaceExtendsMatch = line.match(/^(?:export\s+)?interface\s+(\w+)(?:<[^>]+>)?\s+extends\s+/);
        if (interfaceExtendsMatch) {
            const name = interfaceExtendsMatch[1];
            const startLine = i;
            const { endLine, source } = extractBlock(lines, i);
            definitions.push({ name, kind: 'interface', source, startLine, endLine });
            i = endLine + 1;
            continue;
        }
        const typeMatch = line.match(/^(?:export\s+)?type\s+(\w+)(?:<[^>]+>)?\s*=\s*/);
        if (typeMatch) {
            const name = typeMatch[1];
            const startLine = i;
            const { endLine, source } = extractTypeAlias(lines, i);
            definitions.push({ name, kind: 'type', source, startLine, endLine });
            i = endLine + 1;
            continue;
        }
        i++;
    }
    return definitions;
}
function extractBlock(lines, startIdx) {
    let depth = 0;
    let started = false;
    let endIdx = startIdx;
    for (let i = startIdx; i < lines.length; i++) {
        const line = lines[i];
        for (const char of line) {
            if (char === '{') {
                depth++;
                started = true;
            }
            else if (char === '}') {
                depth--;
            }
        }
        if (started && depth === 0) {
            endIdx = i;
            break;
        }
    }
    const source = lines.slice(startIdx, endIdx + 1).join('\n');
    return { endLine: endIdx, source };
}
function extractTypeAlias(lines, startIdx) {
    const firstLine = lines[startIdx];
    if (firstLine.includes(';') && !firstLine.includes('{')) {
        return { endLine: startIdx, source: firstLine };
    }
    let depth = 0;
    let endIdx = startIdx;
    for (let i = startIdx; i < lines.length; i++) {
        const line = lines[i];
        for (const char of line) {
            if (char === '{' || char === '(' || char === '<') {
                depth++;
            }
            else if (char === '}' || char === ')' || char === '>') {
                depth--;
            }
        }
        if (line.includes(';') && depth === 0) {
            endIdx = i;
            break;
        }
        if (i > startIdx && depth === 0) {
            const trimmed = line.trim();
            if (trimmed === '' || trimmed.startsWith('export ')) {
                endIdx = i - 1;
                break;
            }
        }
    }
    const source = lines.slice(startIdx, endIdx + 1).join('\n');
    return { endLine: endIdx, source };
}
export function extractUsedTypes(schemaContent) {
    const usedTypes = new Set();
    const genericPattern = /(?:jsonb|json|varchar|text|char)\s*<\s*([A-Z][a-zA-Z0-9_]*)/g;
    let match;
    while ((match = genericPattern.exec(schemaContent)) !== null) {
        usedTypes.add(match[1]);
    }
    return Array.from(usedTypes);
}
export function extractTypeUsages(schemaContent) {
    const usages = {};
    const tablePattern = /(?:(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*)?defineTable\s*\(\s*['"]([^'"]+)['"]\s*,\s*\{/g;
    let tableMatch;
    while ((tableMatch = tablePattern.exec(schemaContent)) !== null) {
        const tableName = tableMatch[2];
        const tableStartIdx = tableMatch.index + tableMatch[0].length;
        let depth = 1;
        let columnsEndIdx = tableStartIdx;
        for (let i = tableStartIdx; i < schemaContent.length && depth > 0; i++) {
            if (schemaContent[i] === '{')
                depth++;
            else if (schemaContent[i] === '}')
                depth--;
            columnsEndIdx = i;
        }
        const columnsBlock = schemaContent.substring(tableStartIdx, columnsEndIdx);
        const columnPattern = /(\w+)\s*:\s*(?:jsonb|json|varchar|text|char)\s*<\s*([A-Z][a-zA-Z0-9_]*)\s*>\s*\(([^)]*)\)/g;
        let columnMatch;
        while ((columnMatch = columnPattern.exec(columnsBlock)) !== null) {
            const tsColumnName = columnMatch[1];
            const typeName = columnMatch[2];
            const argsBlock = columnMatch[3];
            const explicitNameMatch = argsBlock.match(/^\s*['"]([^'"]+)['"]/);
            const sqlColumnName = explicitNameMatch ? explicitNameMatch[1] : tsColumnName;
            const usage = `${tableName}.${sqlColumnName}`;
            if (!usages[typeName]) {
                usages[typeName] = [];
            }
            if (!usages[typeName].includes(usage)) {
                usages[typeName].push(usage);
            }
        }
    }
    return usages;
}
export async function getTypesFromDb(connection) {
    const exists = await typesTableExists(connection);
    if (!exists)
        return [];
    const pool = await createPool(connection);
    try {
        const result = await pool.query(`
            SELECT name, kind, source, usages, created_at, updated_at
            FROM _relq_types
            ORDER BY name
        `);
        return result.rows.map(row => ({
            name: row.name,
            kind: row.kind,
            source: row.source,
            usages: typeof row.usages === 'string' ? JSON.parse(row.usages || '[]') : (row.usages || []),
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        }));
    }
    finally {
        await pool.end();
    }
}
export async function storeTypesInDb(connection, types, usages) {
    await ensureTypesTable(connection);
    const pool = await createPool(connection);
    try {
        for (const type of types) {
            const typeUsages = usages?.[type.name] || [];
            await pool.query(`
                INSERT INTO _relq_types (name, kind, source, usages, updated_at)
                VALUES ($1, $2, $3, $4, NOW())
                ON CONFLICT (name) DO UPDATE SET
                    kind = EXCLUDED.kind,
                    source = EXCLUDED.source,
                    usages = EXCLUDED.usages,
                    updated_at = NOW()
            `, [type.name, type.kind, type.source, JSON.stringify(typeUsages)]);
        }
    }
    finally {
        await pool.end();
    }
}
export async function removeStaleTypes(connection, currentTypeNames) {
    const exists = await typesTableExists(connection);
    if (!exists)
        return [];
    const pool = await createPool(connection);
    try {
        const result = await pool.query(`
            DELETE FROM _relq_types
            WHERE name != ALL($1::text[])
            RETURNING name
        `, [currentTypeNames]);
        return result.rows.map(r => r.name);
    }
    finally {
        await pool.end();
    }
}
export function generateTypesFile(types) {
    if (types.length === 0) {
        return `/**
 * Schema Types
 *
 * TypeScript type definitions for JSON/JSONB columns.
 * These types are tracked in the database and synced across workspaces.
 *
 * Usage in schema.ts:
 *   import type { UserMetadata } from "./schema.types.js";
 *   const users = defineTable('users', {
 *       metadata: jsonb<UserMetadata>(),
 *   });
 */

// Add your type definitions here:
// export interface UserMetadata {
//     name: string;
//     age: number;
// }
`;
    }
    const interfaceTypes = types.filter(t => t.kind === 'interface');
    const typeAliases = types.filter(t => t.kind === 'type');
    let content = `/**
 * Schema Types
 *
 * TypeScript type definitions for JSON/JSONB columns.
 * These types are tracked in the database and synced across workspaces.
 *
 * Generated by: relq pull
 * Types: ${types.length}
 */

`;
    if (interfaceTypes.length > 0) {
        content += '// =============================================================================\n';
        content += '// INTERFACES\n';
        content += '// =============================================================================\n\n';
        for (const type of interfaceTypes) {
            content += type.source + '\n\n';
        }
    }
    if (typeAliases.length > 0) {
        content += '// =============================================================================\n';
        content += '// TYPE ALIASES\n';
        content += '// =============================================================================\n\n';
        for (const type of typeAliases) {
            content += type.source + '\n\n';
        }
    }
    return content;
}
export function validateTypesUsage(usedTypes, definedTypes) {
    const definedSet = new Set(definedTypes);
    const missingTypes = usedTypes.filter(t => !definedSet.has(t));
    return {
        valid: missingTypes.length === 0,
        missingTypes,
    };
}
export function validateSchemaForInlineTypes(schemaContent) {
    const lines = schemaContent.split('\n');
    const inlineTypes = [];
    const excludePatterns = [
        /RelqDatabaseSchema/,
        /typeof\s+schema/,
        /Infer</,
    ];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const interfaceMatch = line.match(/^(?:export\s+)?interface\s+(\w+)\s*(?:<[^>]*>)?\s*\{/);
        if (interfaceMatch) {
            let hasBody = false;
            for (let j = i + 1; j < lines.length && j < i + 50; j++) {
                const bodyLine = lines[j].trim();
                if (bodyLine === '}')
                    break;
                if (bodyLine && !bodyLine.startsWith('//') && !bodyLine.startsWith('/*')) {
                    hasBody = true;
                    break;
                }
            }
            if (hasBody) {
                inlineTypes.push(`interface ${interfaceMatch[1]} (line ${i + 1})`);
            }
            continue;
        }
        const typeMatch = line.match(/^(?:export\s+)?type\s+(\w+)(?:<[^>]*>)?\s*=\s*(.+)/);
        if (typeMatch) {
            const typeName = typeMatch[1];
            const typeValue = typeMatch[2];
            const isExcluded = excludePatterns.some(pattern => pattern.test(typeValue));
            if (isExcluded) {
                continue;
            }
            const isObjectType = typeValue.trim().startsWith('{');
            const isUnionType = typeValue.includes('|') && !typeValue.includes('<');
            const isLiteralType = /^['"]/.test(typeValue.trim());
            if (isObjectType || isUnionType || isLiteralType) {
                inlineTypes.push(`type ${typeName} (line ${i + 1})`);
            }
        }
    }
    if (inlineTypes.length > 0) {
        return {
            type: 'inline_type',
            message: 'Type definitions found in schema file',
            hint: 'Move type definitions to schema.types.ts to enable database syncing and team collaboration.',
            details: inlineTypes,
        };
    }
    return null;
}
export function validateTypeImports(schemaContent, schemaPath) {
    const typesFileName = path.basename(getTypesFilePath(schemaPath));
    const wrongImports = [];
    const importPattern = /import\s+(?:type\s+)?\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    while ((match = importPattern.exec(schemaContent)) !== null) {
        const imports = match[1];
        const source = match[2];
        if (source.endsWith('.types') || source.includes(typesFileName.replace('.ts', ''))) {
            continue;
        }
        if (source.startsWith('relq') || source.startsWith('@') || !source.startsWith('.')) {
            continue;
        }
        const importedItems = imports.split(',').map(s => s.trim());
        const typeImports = importedItems.filter(item => {
            const name = item.split(' as ')[0].trim();
            return /^[A-Z][a-zA-Z0-9]*$/.test(name);
        });
        if (typeImports.length > 0) {
            wrongImports.push(`${typeImports.join(', ')} from '${source}'`);
        }
    }
    if (wrongImports.length > 0) {
        return {
            type: 'wrong_import',
            message: 'Types imported from incorrect location',
            hint: `Database-synced types must be defined in ${typesFileName}. Move these type definitions there and update the import.`,
            details: wrongImports,
        };
    }
    return null;
}
export async function validateTypesFileSyntax(typesFilePath) {
    if (!fs.existsSync(typesFilePath)) {
        return null;
    }
    const content = fs.readFileSync(typesFilePath, 'utf-8');
    const errors = [];
    let braceCount = 0;
    let inInterface = false;
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (/^(?:export\s+)?interface\s+\w+/.test(line)) {
            inInterface = true;
        }
        for (const char of line) {
            if (char === '{')
                braceCount++;
            else if (char === '}')
                braceCount--;
        }
        if (inInterface && braceCount === 0) {
            inInterface = false;
        }
    }
    if (braceCount !== 0) {
        errors.push('Unbalanced braces detected - check for missing { or }');
    }
    const invalidPatterns = [
        { pattern: /interface\s+\d/, message: 'Interface name cannot start with a number' },
        { pattern: /type\s+\d/, message: 'Type name cannot start with a number' },
        { pattern: /:\s*;/, message: 'Missing type annotation before semicolon' },
    ];
    for (const { pattern, message } of invalidPatterns) {
        if (pattern.test(content)) {
            errors.push(message);
        }
    }
    if (errors.length > 0) {
        return {
            type: 'typescript_error',
            message: 'TypeScript syntax errors in types file',
            hint: 'Fix the syntax errors in your types file before pushing.',
            details: errors,
        };
    }
    return null;
}
export async function validateTypesConfiguration(schemaPath, typesFilePath) {
    const errors = [];
    if (!fs.existsSync(schemaPath)) {
        return errors;
    }
    const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
    const inlineError = validateSchemaForInlineTypes(schemaContent);
    if (inlineError) {
        errors.push(inlineError);
    }
    const importError = validateTypeImports(schemaContent, schemaPath);
    if (importError) {
        errors.push(importError);
    }
    const syntaxError = await validateTypesFileSyntax(typesFilePath);
    if (syntaxError) {
        errors.push(syntaxError);
    }
    if (fs.existsSync(typesFilePath)) {
        const typesContent = fs.readFileSync(typesFilePath, 'utf-8');
        const usedTypes = extractUsedTypes(schemaContent);
        const parsedTypes = parseTypesFile(typesContent);
        const definedTypeNames = parsedTypes.map(t => t.name);
        const usageValidation = validateTypesUsage(usedTypes, definedTypeNames);
        if (!usageValidation.valid) {
            errors.push({
                type: 'missing_type',
                message: 'Types used in schema but not defined in types file',
                hint: `Add these type definitions to ${path.basename(typesFilePath)}.`,
                details: usageValidation.missingTypes,
            });
        }
    }
    return errors;
}
export function isValidTypesFilePath(filePath) {
    const basename = path.basename(filePath);
    return basename.endsWith('.types.ts');
}
export function getTypesFilePath(schemaPath) {
    const dir = path.dirname(schemaPath);
    const basename = path.basename(schemaPath, '.ts');
    return path.join(dir, `${basename}.types.ts`);
}
export async function syncTypesToDb(connection, typesFilePath, schemaFilePath) {
    const result = { added: [], updated: [], removed: [] };
    if (!fs.existsSync(typesFilePath)) {
        return result;
    }
    const content = fs.readFileSync(typesFilePath, 'utf-8');
    const localTypes = parseTypesFile(content);
    const localTypeNames = localTypes.map(t => t.name);
    let usages;
    if (schemaFilePath && fs.existsSync(schemaFilePath)) {
        const schemaContent = fs.readFileSync(schemaFilePath, 'utf-8');
        usages = extractTypeUsages(schemaContent);
    }
    const dbTypes = await getTypesFromDb(connection);
    const dbTypeMap = new Map(dbTypes.map(t => [t.name, t]));
    for (const localType of localTypes) {
        const dbType = dbTypeMap.get(localType.name);
        if (!dbType) {
            result.added.push(localType.name);
        }
        else if (dbType.source !== localType.source) {
            result.updated.push(localType.name);
        }
    }
    await storeTypesInDb(connection, localTypes, usages);
    result.removed = await removeStaleTypes(connection, localTypeNames);
    return result;
}
export async function syncTypesFromDb(connection, typesFilePath) {
    const types = await getTypesFromDb(connection);
    if (types.length === 0) {
        if (!fs.existsSync(typesFilePath)) {
            const content = generateTypesFile([]);
            fs.writeFileSync(typesFilePath, content);
            return { typesCount: 0, generated: true };
        }
        return { typesCount: 0, generated: false };
    }
    const content = generateTypesFile(types);
    fs.writeFileSync(typesFilePath, content);
    return { typesCount: types.length, generated: true };
}
