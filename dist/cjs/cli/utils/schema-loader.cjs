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
const ui_1 = require("./ui.cjs");
const colors_1 = require("./colors.cjs");
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
function detectUnexportedTables(schemaModule) {
    const directTableNames = new Set();
    for (const value of Object.values(schemaModule)) {
        if ((0, schema_to_ast_1.isTableDefinition)(value)) {
            directTableNames.add(value.$name);
        }
    }
    const unexported = [];
    for (const [key, value] of Object.entries(schemaModule)) {
        if (!value || typeof value !== 'object' || Array.isArray(value))
            continue;
        if ((0, schema_to_ast_1.isTableDefinition)(value))
            continue;
        for (const [, nestedValue] of Object.entries(value)) {
            if ((0, schema_to_ast_1.isTableDefinition)(nestedValue)) {
                const name = nestedValue.$name;
                if (!directTableNames.has(name)) {
                    unexported.push({ tableName: name, parentKey: key });
                }
            }
        }
    }
    return unexported;
}
async function handleUnexportedTablesWarning(unexported, projectRoot, config) {
    const suppression = config?.safety?.suppressUnexportedWarning;
    if (suppression === true)
        return;
    let remaining = unexported;
    if (Array.isArray(suppression)) {
        remaining = unexported.filter(u => !suppression.includes(u.tableName));
        if (remaining.length === 0)
            return;
    }
    const tableList = remaining
        .map(u => `  ${colors_1.colors.yellow('•')} ${colors_1.colors.bold(u.tableName)}  ${colors_1.colors.muted(`(inside "${u.parentKey}" export)`)}`)
        .join('\n');
    ui_1.p.log.warn(`Found ${colors_1.colors.bold(String(remaining.length))} table(s) defined but not exported:\n\n` +
        tableList + '\n\n' +
        `  These tables won't be detected by Relq.\n` +
        `  Add ${colors_1.colors.cyan('export')} to their definitions, e.g. ${colors_1.colors.cyan('export const myTable = defineTable(...)')}`);
    const continueAnyway = await ui_1.p.confirm({
        message: 'Continue anyway?',
        initialValue: false,
    });
    if (ui_1.p.isCancel(continueAnyway) || !continueAnyway) {
        ui_1.p.log.info('Cancelled — export your tables and try again');
        process.exit(0);
    }
    const dontAsk = await ui_1.p.confirm({
        message: `Don't warn about ${remaining.length === 1 ? 'this table' : 'these tables'} again?`,
        initialValue: false,
    });
    if (ui_1.p.isCancel(dontAsk) || !dontAsk)
        return;
    const tableNames = remaining.map(u => u.tableName);
    const existingList = Array.isArray(suppression) ? suppression : [];
    const merged = Array.from(new Set([...existingList, ...tableNames]));
    await updateConfigSuppression(projectRoot, merged);
}
async function updateConfigSuppression(projectRoot, tableNames) {
    const configPath = path.resolve(projectRoot, 'relq.config.ts');
    if (!fs.existsSync(configPath))
        return;
    try {
        let content = fs.readFileSync(configPath, 'utf-8');
        const arrayLiteral = JSON.stringify(tableNames);
        const existingField = /suppressUnexportedWarning\s*:\s*(?:\[[^\]]*\]|true|false)/;
        if (existingField.test(content)) {
            content = content.replace(existingField, `suppressUnexportedWarning: ${arrayLiteral}`);
            fs.writeFileSync(configPath, content, 'utf-8');
            ui_1.p.log.success(`Updated ${colors_1.colors.cyan('relq.config.ts')} — suppressed warnings for ${tableNames.length} table(s)`);
            return;
        }
        const safetyBlock = /safety\s*:\s*\{/;
        if (safetyBlock.test(content)) {
            content = content.replace(safetyBlock, (match) => `${match}\n        suppressUnexportedWarning: ${arrayLiteral},`);
            fs.writeFileSync(configPath, content, 'utf-8');
            ui_1.p.log.success(`Updated ${colors_1.colors.cyan('relq.config.ts')} — suppressed warnings for ${tableNames.length} table(s)`);
            return;
        }
        const closingMatch = /\n(\s*)\}\s*\)\s*;?\s*$/;
        if (closingMatch.test(content)) {
            content = content.replace(closingMatch, (match, indent) => `\n\n${indent}    safety: {\n${indent}        suppressUnexportedWarning: ${arrayLiteral},\n${indent}    },` + match);
            fs.writeFileSync(configPath, content, 'utf-8');
            ui_1.p.log.success(`Updated ${colors_1.colors.cyan('relq.config.ts')} — suppressed warnings for ${tableNames.length} table(s)`);
            return;
        }
        ui_1.p.log.warn(`Could not auto-update relq.config.ts — add this manually:\n  safety: { suppressUnexportedWarning: ${arrayLiteral} }`);
    }
    catch (err) {
        ui_1.p.log.warn(`Failed to update relq.config.ts: ${err instanceof Error ? err.message : String(err)}`);
    }
}
async function loadSchemaFile(schemaPath, projectRoot, config) {
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
    const unexported = detectUnexportedTables(schemaModule);
    if (unexported.length > 0) {
        await handleUnexportedTablesWarning(unexported, projectRoot, config);
    }
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
