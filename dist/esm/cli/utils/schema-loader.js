import * as path from 'node:path';
import * as fs from 'node:fs';
import { createJiti } from 'jiti';
import { schemaToAST, parsedTableToTableInfo } from "./schema-to-ast.js";
function hasMissingTrackingIds(ast) {
    for (const table of ast.tables) {
        if (!table.trackingId)
            return true;
        for (const col of table.columns) {
            if (!col.trackingId)
                return true;
        }
        for (const idx of table.indexes) {
            if (!idx.trackingId)
                return true;
        }
        for (const con of table.constraints) {
            if (!con.trackingId)
                return true;
        }
    }
    for (const e of ast.enums) {
        if (!e.trackingId)
            return true;
    }
    for (const f of ast.functions) {
        if (!f.trackingId)
            return true;
    }
    for (const s of ast.sequences) {
        if (!s.trackingId)
            return true;
    }
    for (const v of ast.views) {
        if (!v.trackingId)
            return true;
    }
    for (const d of ast.domains) {
        if (!d.trackingId)
            return true;
    }
    for (const ct of ast.compositeTypes) {
        if (!ct.trackingId)
            return true;
    }
    for (const tr of ast.triggers) {
        if (!tr.trackingId)
            return true;
    }
    return false;
}
function extractImportPath(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const match = content.match(/import\s*\{[^}]*defineTable[^}]*\}\s*from\s+['"]([^'"]+)['"]/s);
    return match ? match[1] : null;
}
function detectCamelCase(ast) {
    for (const table of ast.tables) {
        for (const col of table.columns) {
            if (col.tsName !== col.name)
                return true;
        }
    }
    return true;
}
export async function loadSchemaFile(schemaPath, projectRoot) {
    const absolutePath = path.isAbsolute(schemaPath)
        ? schemaPath
        : path.resolve(projectRoot, schemaPath);
    if (!fs.existsSync(absolutePath)) {
        throw new Error(`Schema file not found: ${absolutePath}`);
    }
    const jiti = createJiti(projectRoot, {
        interopDefault: true,
    });
    const schemaModule = await jiti.import(absolutePath);
    const ast = schemaToAST(schemaModule);
    const ext = path.extname(absolutePath);
    const baseName = absolutePath.slice(0, -ext.length);
    for (const suffix of ['functions', 'triggers', 'views']) {
        const companionPath = `${baseName}.${suffix}${ext}`;
        if (!fs.existsSync(companionPath))
            continue;
        const companionModule = await jiti.import(companionPath);
        const companionAST = schemaToAST(companionModule);
        ast.tables.push(...companionAST.tables);
        ast.enums.push(...companionAST.enums);
        ast.domains.push(...companionAST.domains);
        ast.compositeTypes.push(...companionAST.compositeTypes);
        ast.sequences.push(...companionAST.sequences);
        ast.views.push(...companionAST.views);
        ast.functions.push(...companionAST.functions);
        ast.triggers.push(...companionAST.triggers);
        ast.extensions.push(...companionAST.extensions);
    }
    const tables = ast.tables.map(parsedTableToTableInfo);
    const schema = {
        tables,
        enums: ast.enums.map(e => ({ name: e.name, values: e.values })),
        domains: ast.domains.map(d => ({
            name: d.name,
            baseType: d.baseType,
            isNotNull: d.notNull,
            defaultValue: d.defaultValue || null,
            checkExpression: d.checkExpression || null,
        })),
        compositeTypes: ast.compositeTypes.map(ct => ({
            name: ct.name,
            attributes: ct.attributes.map(a => ({ name: a.name, type: a.type })),
        })),
        sequences: ast.sequences.map(s => ({
            name: s.name,
            dataType: undefined,
            start: s.startValue,
            increment: s.increment,
            minValue: s.minValue,
            maxValue: s.maxValue,
            cache: s.cache,
            cycle: s.cycle,
            ownedBy: s.ownedBy ? `${s.ownedBy.table}.${s.ownedBy.column}` : undefined,
        })),
        collations: [],
        functions: ast.functions.map(f => ({
            name: f.name,
            schema: f.schema || 'public',
            returnType: f.returnType,
            argTypes: f.args.map(a => a.type),
            language: f.language,
            definition: f.body,
            isAggregate: false,
            volatility: f.volatility || 'VOLATILE',
        })),
        triggers: ast.triggers.map(t => ({
            name: t.name,
            tableName: t.table,
            event: t.events.join(' OR '),
            timing: t.timing,
            forEach: t.forEach,
            functionName: t.functionName,
            definition: '',
            isEnabled: true,
        })),
        policies: [],
        partitions: [],
        foreignServers: [],
        foreignTables: [],
        extensions: ast.extensions,
    };
    return {
        schema,
        ast,
        tables,
        filePath: absolutePath,
    };
}
