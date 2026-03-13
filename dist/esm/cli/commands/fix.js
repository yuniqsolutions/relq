import { defineCommand } from 'citty';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { buildContext } from "../utils/context.js";
import { colors } from "../utils/colors.js";
import { fatal } from "../utils/ui.js";
import { getSchemaPath } from "../utils/config-loader.js";
import { loadSchemaFile } from "../utils/schema-loader.js";
import { validateTrackingIds, formatTrackingIdIssues } from "../utils/tracking-id-validator.js";
import { validateSourceTrackingIds } from "../utils/source-id-validator.js";
import { assignTrackingIds } from "../utils/ast-codegen.js";
import { hashFileContent, saveFileHash } from "../utils/repo-manager.js";
import { computeTrackingIdEdits, computeTopLevelEdits, applyEdits } from "../utils/schema-surgeon.js";
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
export default defineCommand({
    meta: { name: 'fix', description: 'Auto-repair tracking ID issues in schema' },
    args: {
        schema: { type: 'positional', description: 'Schema file path (optional)', required: false },
        dryRun: { type: 'boolean', alias: 'dry-run', description: 'Show what would be fixed without writing' },
    },
    async run({ args }) {
        const { config, projectRoot } = await buildContext({ requireConfig: true });
        if (!config)
            return fatal('No relq.config.ts found. Run `relq init` first.');
        console.log('');
        let schemaPath;
        if (args.schema) {
            schemaPath = path.resolve(projectRoot, args.schema);
        }
        else {
            schemaPath = path.resolve(projectRoot, getSchemaPath(config));
        }
        const relativePath = path.relative(process.cwd(), schemaPath);
        if (!fs.existsSync(schemaPath)) {
            return fatal(`Schema file not found: ${relativePath}`);
        }
        console.log(`  Scanning ${colors.cyan(relativePath)}...`);
        const rawContent = fs.readFileSync(schemaPath, 'utf-8');
        const sourceIssues = validateSourceTrackingIds(schemaPath, rawContent);
        let result;
        try {
            result = await loadSchemaFile(schemaPath, projectRoot, config);
        }
        catch (err) {
            return fatal(`Failed to load schema: ${err.message}`);
        }
        const { ast: parsedSchema } = result;
        const runtimeIssues = validateTrackingIds(parsedSchema);
        const runtimeDuplicates = runtimeIssues.filter(i => i.kind === 'duplicate');
        const runtimeMissing = runtimeIssues.filter(i => i.kind === 'missing');
        const sourceLocations = new Set(sourceIssues.map(i => i.location));
        const extraRuntimeMissing = runtimeMissing.filter(i => !sourceLocations.has(i.location));
        const issuesBefore = [...sourceIssues, ...extraRuntimeMissing, ...runtimeDuplicates];
        if (issuesBefore.length === 0) {
            console.log('');
            console.log(`  ${colors.green('✔')}  ${colors.bold('No issues found')} — schema tracking IDs are clean.`);
            console.log('');
            return;
        }
        const missingIssues = issuesBefore.filter(i => i.kind === 'missing');
        const duplicateIssues = issuesBefore.filter(i => i.kind === 'duplicate');
        if (args.dryRun) {
            console.log('');
            console.log(formatTrackingIdIssues(issuesBefore));
            console.log('');
            console.log(colors.dim('  Dry run — no changes written.'));
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
        assignTrackingIds(parsedSchema);
        const { createJiti } = await import('jiti');
        const jiti = createJiti(projectRoot, { interopDefault: true });
        const schemaModule = await jiti.import(schemaPath);
        const exportMap = buildExportMap(schemaModule);
        const tableIssues = issuesBefore.filter(i => i.entity === 'table' || i.entity === 'column' || i.entity === 'index' || i.entity === 'constraint');
        const edits = computeTrackingIdEdits(schemaPath, rawContent, tableIssues, parsedSchema, exportMap);
        const enumNames = new Set(parsedSchema.enums.map(e => e.name));
        const domainNames = new Set(parsedSchema.domains.map(d => d.name));
        const seqNames = new Set(parsedSchema.sequences.map(s => s.name));
        for (const issue of issuesBefore) {
            if (issue.entity !== 'table')
                continue;
            const name = issue.location;
            if (enumNames.has(name)) {
                const enumEdits = computeTopLevelEdits(schemaPath, rawContent, 'enum', parsedSchema.enums, exportMap, [issue]);
                edits.push(...enumEdits);
            }
            else if (domainNames.has(name)) {
                const domainEdits = computeTopLevelEdits(schemaPath, rawContent, 'domain', parsedSchema.domains, exportMap, [issue]);
                edits.push(...domainEdits);
            }
            else if (seqNames.has(name)) {
                const seqEdits = computeTopLevelEdits(schemaPath, rawContent, 'sequence', parsedSchema.sequences, exportMap, [issue]);
                edits.push(...seqEdits);
            }
        }
        if (edits.length === 0) {
            console.log('');
            console.log(colors.dim('  Could not locate all entities in source — falling back to regeneration.'));
            const { generateTypeScriptFromAST } = await import("../utils/ast-codegen.js");
            const { detectDialect, getBuilderImportPath } = await import("../utils/dialect-router.js");
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
            const fileHash = hashFileContent(typescript);
            saveFileHash(fileHash, projectRoot);
        }
        else {
            const fixed = applyEdits(rawContent, edits);
            fs.writeFileSync(schemaPath, fixed, 'utf-8');
            const fileHash = hashFileContent(fixed);
            saveFileHash(fileHash, projectRoot);
        }
        const fixedContent = fs.readFileSync(schemaPath, 'utf-8');
        const sourceIssuesAfter = validateSourceTrackingIds(schemaPath, fixedContent);
        const reloaded = await loadSchemaFile(schemaPath, projectRoot, config);
        const runtimeIssuesAfter = validateTrackingIds(reloaded.ast);
        const remainingErrors = [
            ...sourceIssuesAfter,
            ...runtimeIssuesAfter.filter(i => i.severity === 'error'),
        ];
        if (remainingErrors.length > 0) {
            console.log('');
            console.log(formatTrackingIdIssues(remainingErrors));
            console.log('');
            return fatal('Some issues could not be auto-fixed.');
        }
        console.log('');
        console.log(`  ${colors.green('✔')}  ${colors.bold('All issues fixed')}`);
        console.log(colors.dim('  ───────────────────────────────────'));
        if (edits.length > 0) {
            console.log(`    ${colors.green('●')} ${edits.length} surgical edit(s) applied`);
        }
        if (missingIssues.length > 0) {
            console.log(`    ${colors.green('+')} ${missingIssues.length} missing ID(s) generated`);
        }
        if (dupsFixed > 0) {
            console.log(`    ${colors.green('~')} ${dupsFixed} duplicate ID(s) regenerated`);
        }
        console.log('');
        console.log(`  Updated ${colors.cyan(relativePath)}`);
        console.log('');
    },
});
