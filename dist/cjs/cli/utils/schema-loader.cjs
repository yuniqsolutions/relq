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
exports.loadSchemaFile = loadSchemaFile;
const path = __importStar(require("node:path"));
const fs = __importStar(require("node:fs"));
const jiti_1 = require("jiti");
const schema_to_ast_1 = require("./schema-to-ast.cjs");
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
async function loadSchemaFile(schemaPath, projectRoot) {
    const absolutePath = path.isAbsolute(schemaPath)
        ? schemaPath
        : path.resolve(projectRoot, schemaPath);
    if (!fs.existsSync(absolutePath)) {
        throw new Error(`Schema file not found: ${absolutePath}`);
    }
    const jiti = (0, jiti_1.createJiti)(projectRoot, {
        interopDefault: true,
    });
    const schemaModule = await jiti.import(absolutePath);
    const ast = (0, schema_to_ast_1.schemaToAST)(schemaModule);
    const ext = path.extname(absolutePath);
    const baseName = absolutePath.slice(0, -ext.length);
    for (const suffix of ['functions', 'triggers', 'views']) {
        const companionPath = `${baseName}.${suffix}${ext}`;
        if (!fs.existsSync(companionPath))
            continue;
        const companionModule = await jiti.import(companionPath);
        const companionAST = (0, schema_to_ast_1.schemaToAST)(companionModule);
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
    const tables = ast.tables.map(schema_to_ast_1.parsedTableToTableInfo);
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
