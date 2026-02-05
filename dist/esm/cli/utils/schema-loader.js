import * as path from 'path';
import * as fs from 'fs';
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
    const tables = ast.tables.map(parsedTableToTableInfo);
    const schema = {
        tables,
        enums: ast.enums.map(e => ({ name: e.name, values: e.values })),
        domains: [],
        compositeTypes: [],
        sequences: [],
        collations: [],
        functions: [],
        triggers: [],
        policies: [],
        partitions: [],
        foreignServers: [],
        foreignTables: [],
        extensions: ast.extensions,
    };
    return {
        schema,
        tables,
        filePath: absolutePath,
    };
}
