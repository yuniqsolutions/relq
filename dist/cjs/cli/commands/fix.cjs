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
const citty_1 = require("citty");
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const context_1 = require("../utils/context.cjs");
const colors_1 = require("../utils/colors.cjs");
const ui_1 = require("../utils/ui.cjs");
const config_loader_1 = require("../utils/config-loader.cjs");
const schema_loader_1 = require("../utils/schema-loader.cjs");
const tracking_id_validator_1 = require("../utils/tracking-id-validator.cjs");
const source_id_validator_1 = require("../utils/source-id-validator.cjs");
const ast_codegen_1 = require("../utils/ast-codegen.cjs");
const repo_manager_1 = require("../utils/repo-manager.cjs");
const schema_surgeon_1 = require("../utils/schema-surgeon.cjs");
function clearDuplicateTrackingIds(schema) {
    let fixCount = 0;
    const tableIds = new Map();
    for (const table of schema.tables) {
        if (table.partitionOf)
            continue;
        if (table.trackingId) {
            if (tableIds.has(table.trackingId)) {
                table.trackingId = undefined;
                fixCount++;
            }
            else {
                tableIds.set(table.trackingId, true);
            }
        }
    }
    for (const table of schema.tables) {
        if (table.partitionOf)
            continue;
        const colIds = new Map();
        for (const col of table.columns) {
            if (col.trackingId) {
                if (colIds.has(col.trackingId)) {
                    col.trackingId = undefined;
                    fixCount++;
                }
                else {
                    colIds.set(col.trackingId, true);
                }
            }
        }
        const idxIds = new Map();
        for (const idx of table.indexes) {
            if (idx.trackingId) {
                if (idxIds.has(idx.trackingId)) {
                    idx.trackingId = undefined;
                    fixCount++;
                }
                else {
                    idxIds.set(idx.trackingId, true);
                }
            }
        }
        const conIds = new Map();
        for (const con of table.constraints) {
            if (con.trackingId) {
                if (colIds.has(con.trackingId))
                    continue;
                if (conIds.has(con.trackingId)) {
                    con.trackingId = undefined;
                    fixCount++;
                }
                else {
                    conIds.set(con.trackingId, true);
                }
            }
        }
    }
    return fixCount;
}
function buildExportMap(schemaModule) {
    const map = new Map();
    for (const [key, value] of Object.entries(schemaModule)) {
        if (!value || typeof value !== 'object')
            continue;
        if (value.$name && typeof value.$name === 'string') {
            map.set(value.$name, key);
        }
        else if (value.$enumName && typeof value.$enumName === 'string') {
            map.set(value.$enumName, key);
        }
        else if (value.$domainName && typeof value.$domainName === 'string') {
            map.set(value.$domainName, key);
        }
        else if (value.$sequenceName && typeof value.$sequenceName === 'string') {
            map.set(value.$sequenceName, key);
        }
        else if (value.$functionName && typeof value.$functionName === 'string') {
            map.set(value.$functionName, key);
        }
        else if (value.$triggerName && typeof value.$triggerName === 'string') {
            map.set(value.$triggerName, key);
        }
        else if (value.$viewName && typeof value.$viewName === 'string') {
            map.set(value.$viewName, key);
        }
    }
    return map;
}
exports.default = (0, citty_1.defineCommand)({
    meta: { name: 'fix', description: 'Auto-repair tracking ID issues in schema' },
    args: {
        schema: { type: 'positional', description: 'Schema file path (optional)', required: false },
        dryRun: { type: 'boolean', alias: 'dry-run', description: 'Show what would be fixed without writing' },
    },
    async run({ args }) {
        const { config, projectRoot } = await (0, context_1.buildContext)({ requireConfig: true });
        if (!config)
            return (0, ui_1.fatal)('No relq.config.ts found. Run `relq init` first.');
        console.log('');
        let schemaPath;
        if (args.schema) {
            schemaPath = path.resolve(projectRoot, args.schema);
        }
        else {
            schemaPath = path.resolve(projectRoot, (0, config_loader_1.getSchemaPath)(config));
        }
        const relativePath = path.relative(process.cwd(), schemaPath);
        if (!fs.existsSync(schemaPath)) {
            return (0, ui_1.fatal)(`Schema file not found: ${relativePath}`);
        }
        console.log(`  Scanning ${colors_1.colors.cyan(relativePath)}...`);
        const rawContent = fs.readFileSync(schemaPath, 'utf-8');
        const sourceIssues = (0, source_id_validator_1.validateSourceTrackingIds)(schemaPath, rawContent);
        let result;
        try {
            result = await (0, schema_loader_1.loadSchemaFile)(schemaPath, projectRoot, config);
        }
        catch (err) {
            return (0, ui_1.fatal)(`Failed to load schema: ${err.message}`);
        }
        const { ast: parsedSchema } = result;
        const runtimeIssues = (0, tracking_id_validator_1.validateTrackingIds)(parsedSchema);
        const runtimeDuplicates = runtimeIssues.filter(i => i.kind === 'duplicate');
        const runtimeMissing = runtimeIssues.filter(i => i.kind === 'missing');
        const sourceLocations = new Set(sourceIssues.map(i => i.location));
        const extraRuntimeMissing = runtimeMissing.filter(i => !sourceLocations.has(i.location));
        const issuesBefore = [...sourceIssues, ...extraRuntimeMissing, ...runtimeDuplicates];
        if (issuesBefore.length === 0) {
            console.log('');
            console.log(`  ${colors_1.colors.green('✔')}  ${colors_1.colors.bold('No issues found')} — schema tracking IDs are clean.`);
            console.log('');
            return;
        }
        const missingIssues = issuesBefore.filter(i => i.kind === 'missing');
        const duplicateIssues = issuesBefore.filter(i => i.kind === 'duplicate');
        if (args.dryRun) {
            console.log('');
            console.log((0, tracking_id_validator_1.formatTrackingIdIssues)(issuesBefore));
            console.log('');
            console.log(colors_1.colors.dim('  Dry run — no changes written.'));
            console.log('');
            return;
        }
        for (const issue of sourceIssues) {
            if (issue.kind !== 'missing')
                continue;
            const parts = issue.location.split('.');
            const tableName = parts[0];
            const entityName = parts.slice(1).join('.');
            const table = parsedSchema.tables.find(t => t.name === tableName);
            if (!table)
                continue;
            if (issue.entity === 'index' && entityName) {
                const idx = table.indexes.find(i => i.name === entityName);
                if (idx)
                    idx.trackingId = undefined;
            }
            else if (issue.entity === 'constraint' && entityName) {
                const con = table.constraints.find(c => c.name === entityName);
                if (con)
                    con.trackingId = undefined;
            }
        }
        const dupsFixed = clearDuplicateTrackingIds(parsedSchema);
        (0, ast_codegen_1.assignTrackingIds)(parsedSchema);
        const { createJiti } = await Promise.resolve().then(() => __importStar(require('jiti')));
        const jiti = createJiti(projectRoot, { interopDefault: true });
        const schemaModule = await jiti.import(schemaPath);
        const exportMap = buildExportMap(schemaModule);
        const tableIssues = issuesBefore.filter(i => i.entity === 'table' || i.entity === 'column' || i.entity === 'index' || i.entity === 'constraint');
        const edits = (0, schema_surgeon_1.computeTrackingIdEdits)(schemaPath, rawContent, tableIssues, parsedSchema, exportMap);
        const enumNames = new Set(parsedSchema.enums.map(e => e.name));
        const domainNames = new Set(parsedSchema.domains.map(d => d.name));
        const seqNames = new Set(parsedSchema.sequences.map(s => s.name));
        for (const issue of issuesBefore) {
            if (issue.entity !== 'table')
                continue;
            const name = issue.location;
            if (enumNames.has(name)) {
                const enumEdits = (0, schema_surgeon_1.computeTopLevelEdits)(schemaPath, rawContent, 'enum', parsedSchema.enums, exportMap, [issue]);
                edits.push(...enumEdits);
            }
            else if (domainNames.has(name)) {
                const domainEdits = (0, schema_surgeon_1.computeTopLevelEdits)(schemaPath, rawContent, 'domain', parsedSchema.domains, exportMap, [issue]);
                edits.push(...domainEdits);
            }
            else if (seqNames.has(name)) {
                const seqEdits = (0, schema_surgeon_1.computeTopLevelEdits)(schemaPath, rawContent, 'sequence', parsedSchema.sequences, exportMap, [issue]);
                edits.push(...seqEdits);
            }
        }
        if (edits.length === 0) {
            console.log('');
            console.log(colors_1.colors.dim('  Could not locate all entities in source — falling back to regeneration.'));
            const { generateTypeScriptFromAST } = await Promise.resolve().then(() => __importStar(require("../utils/ast-codegen.cjs")));
            const { detectDialect, getBuilderImportPath } = await Promise.resolve().then(() => __importStar(require("../utils/dialect-router.cjs")));
            const dialect = detectDialect(config);
            const builderImportPath = getBuilderImportPath(dialect);
            const schemaBaseName = path.basename(schemaPath, '.ts');
            const typesImportPath = `./${schemaBaseName}.types`;
            const typescript = generateTypeScriptFromAST(parsedSchema, {
                camelCase: config.generate?.camelCase ?? true,
                importPath: builderImportPath,
                includeFunctions: false,
                includeTriggers: false,
                columnTypeMap: {},
                typesImportPath,
            });
            fs.writeFileSync(schemaPath, typescript, 'utf-8');
            const fileHash = (0, repo_manager_1.hashFileContent)(typescript);
            (0, repo_manager_1.saveFileHash)(fileHash, projectRoot);
        }
        else {
            const fixed = (0, schema_surgeon_1.applyEdits)(rawContent, edits);
            fs.writeFileSync(schemaPath, fixed, 'utf-8');
            const fileHash = (0, repo_manager_1.hashFileContent)(fixed);
            (0, repo_manager_1.saveFileHash)(fileHash, projectRoot);
        }
        const fixedContent = fs.readFileSync(schemaPath, 'utf-8');
        const sourceIssuesAfter = (0, source_id_validator_1.validateSourceTrackingIds)(schemaPath, fixedContent);
        const reloaded = await (0, schema_loader_1.loadSchemaFile)(schemaPath, projectRoot, config);
        const runtimeIssuesAfter = (0, tracking_id_validator_1.validateTrackingIds)(reloaded.ast);
        const remainingErrors = [
            ...sourceIssuesAfter,
            ...runtimeIssuesAfter.filter(i => i.severity === 'error'),
        ];
        if (remainingErrors.length > 0) {
            console.log('');
            console.log((0, tracking_id_validator_1.formatTrackingIdIssues)(remainingErrors));
            console.log('');
            return (0, ui_1.fatal)('Some issues could not be auto-fixed.');
        }
        console.log('');
        console.log(`  ${colors_1.colors.green('✔')}  ${colors_1.colors.bold('All issues fixed')}`);
        console.log(colors_1.colors.dim('  ───────────────────────────────────'));
        if (edits.length > 0) {
            console.log(`    ${colors_1.colors.green('●')} ${edits.length} surgical edit(s) applied`);
        }
        if (missingIssues.length > 0) {
            console.log(`    ${colors_1.colors.green('+')} ${missingIssues.length} missing ID(s) generated`);
        }
        if (dupsFixed > 0) {
            console.log(`    ${colors_1.colors.green('~')} ${dupsFixed} duplicate ID(s) regenerated`);
        }
        console.log('');
        console.log(`  Updated ${colors_1.colors.cyan(relativePath)}`);
        console.log('');
    },
});
