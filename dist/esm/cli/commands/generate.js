import { defineCommand } from 'citty';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import * as p from '@clack/prompts';
import { buildContext } from "../utils/context.js";
import { colors } from "../utils/colors.js";
import { fatal, warning, formatError } from "../utils/ui.js";
import { requireValidConfig, getSchemaPath } from "../utils/config-loader.js";
import { dialectIntrospect } from "../utils/dialect-introspect.js";
import { getConnectionDescription } from "../utils/env-loader.js";
import { isInitialized } from "../utils/repo-manager.js";
import { validateSchemaFile, formatValidationErrors } from "../utils/schema-validator.js";
import { loadSchemaFile } from "../utils/schema-loader.js";
import { compareSchemas } from "../utils/schema-diff.js";
import { generateMigrationFromComparison, generateMigrationNameFromComparison, getNextMigrationNumber, generateTimestampedName, formatMigrationStatements, formatMigrationStatementsPolished } from "../utils/migration-generator.js";
import { loadRelqignore } from "../utils/relqignore.js";
import { introspectedToParsedSchema } from "../utils/ast-transformer.js";
import { validateTrackingIds, formatTrackingIdIssues } from "../utils/tracking-id-validator.js";
import { validateSourceTrackingIds } from "../utils/source-id-validator.js";
function applyIgnorePatterns(comparison, patterns) {
    if (patterns.length === 0)
        return;
    const shouldIgnore = (name) => {
        return patterns.some(pattern => {
            if (pattern.includes('*')) {
                const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
                return regex.test(name);
            }
            return name === pattern;
        });
    };
    comparison.added.tables = comparison.added.tables.filter(t => !shouldIgnore(t.name));
    comparison.removed.tables = comparison.removed.tables.filter(t => !shouldIgnore(t.name));
    comparison.modified.tables = comparison.modified.tables.filter(t => !shouldIgnore(t.name));
    comparison.renamed.tables = comparison.renamed.tables.filter(t => !shouldIgnore(t.from) && !shouldIgnore(t.to));
    comparison.added.columns = comparison.added.columns.filter(c => !shouldIgnore(c.table));
    comparison.removed.columns = comparison.removed.columns.filter(c => !shouldIgnore(c.table));
    comparison.modified.columns = comparison.modified.columns.filter(c => !shouldIgnore(c.table));
    comparison.renamed.columns = comparison.renamed.columns.filter(c => !shouldIgnore(c.table));
    comparison.added.indexes = comparison.added.indexes.filter(i => !shouldIgnore(i.table));
    comparison.removed.indexes = comparison.removed.indexes.filter(i => !shouldIgnore(i.table));
    comparison.modified.indexes = comparison.modified.indexes.filter(i => !shouldIgnore(i.table));
    comparison.renamed.indexes = comparison.renamed.indexes.filter(i => !shouldIgnore(i.table));
    comparison.added.constraints = comparison.added.constraints.filter(c => !shouldIgnore(c.table));
    comparison.removed.constraints = comparison.removed.constraints.filter(c => !shouldIgnore(c.table));
    comparison.modified.constraints = comparison.modified.constraints.filter(c => !shouldIgnore(c.table));
    comparison.renamed.constraints = comparison.renamed.constraints.filter(c => !shouldIgnore(c.table));
}
function hasDestructiveChanges(comparison) {
    return comparison.removed.tables.length > 0
        || comparison.removed.columns.length > 0
        || comparison.removed.enums.length > 0
        || comparison.removed.domains.length > 0
        || comparison.removed.sequences.length > 0
        || comparison.removed.compositeTypes.length > 0
        || comparison.removed.views.length > 0
        || comparison.removed.functions.length > 0
        || comparison.removed.triggers.length > 0;
}
function getDestructiveItems(comparison) {
    const items = [];
    for (const t of comparison.removed.tables) {
        items.push(t.name);
    }
    for (const c of comparison.removed.columns) {
        items.push(`${c.table}.${c.column.name}`);
    }
    for (const e of comparison.removed.enums)
        items.push(`enum ${e.name}`);
    for (const d of comparison.removed.domains)
        items.push(`domain ${d.name}`);
    for (const s of comparison.removed.sequences)
        items.push(`sequence ${s.name}`);
    for (const ct of comparison.removed.compositeTypes)
        items.push(`type ${ct.name}`);
    for (const v of comparison.removed.views)
        items.push(`view ${v.name}`);
    for (const f of comparison.removed.functions)
        items.push(`function ${f.name}`);
    for (const tr of comparison.removed.triggers)
        items.push(`trigger ${tr.name}`);
    return items;
}
function stripDestructiveChanges(comparison) {
    comparison.removed.tables = [];
    comparison.removed.columns = [];
    comparison.removed.enums = [];
    comparison.removed.domains = [];
    comparison.removed.sequences = [];
    comparison.removed.compositeTypes = [];
    comparison.removed.views = [];
    comparison.removed.functions = [];
    comparison.removed.triggers = [];
    comparison.hasChanges = checkHasChanges(comparison);
}
function checkHasChanges(c) {
    return c.added.tables.length > 0 || c.added.columns.length > 0
        || c.added.indexes.length > 0 || c.added.constraints.length > 0
        || c.added.enums.length > 0 || c.added.extensions.length > 0
        || c.added.sequences.length > 0 || c.added.functions.length > 0
        || c.added.views.length > 0 || c.added.triggers.length > 0
        || c.added.domains.length > 0 || c.added.compositeTypes.length > 0
        || c.removed.tables.length > 0 || c.removed.columns.length > 0
        || c.removed.indexes.length > 0 || c.removed.constraints.length > 0
        || c.removed.enums.length > 0 || c.removed.extensions.length > 0
        || c.removed.sequences.length > 0 || c.removed.functions.length > 0
        || c.removed.views.length > 0 || c.removed.triggers.length > 0
        || c.removed.domains.length > 0 || c.removed.compositeTypes.length > 0
        || c.renamed.tables.length > 0 || c.renamed.columns.length > 0
        || c.renamed.indexes.length > 0 || c.renamed.constraints.length > 0
        || c.renamed.enums.length > 0 || c.renamed.sequences.length > 0
        || c.renamed.functions.length > 0
        || c.modified.tables.length > 0 || c.modified.columns.length > 0
        || c.modified.indexes.length > 0 || c.modified.constraints.length > 0
        || c.modified.enums.length > 0 || c.modified.sequences.length > 0
        || c.modified.functions.length > 0 || c.modified.views.length > 0
        || c.modified.triggers.length > 0 || c.modified.domains.length > 0
        || c.modified.compositeTypes.length > 0;
}
function createEmptyMigration(migrationsDir, name, format, dryRun) {
    let fileName;
    if (format === 'timestamp') {
        fileName = generateTimestampedName(name) + '.sql';
    }
    else {
        const num = getNextMigrationNumber(migrationsDir);
        fileName = `${num}_${name}.sql`;
    }
    const filePath = path.join(migrationsDir, fileName);
    const content = `-- Migration: ${name}
-- Generated: ${new Date().toISOString()}

-- UP


-- DOWN

`;
    if (dryRun) {
        console.log(`${colors.yellow('Dry run')} — would create: ${colors.cyan(filePath)}`);
        console.log('');
        return;
    }
    if (!fs.existsSync(migrationsDir)) {
        fs.mkdirSync(migrationsDir, { recursive: true });
    }
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('');
    console.log(`${colors.green('Created')} ${colors.cyan(filePath)}`);
    console.log('');
}
export default defineCommand({
    meta: { name: 'generate', description: 'Generate migration file from schema diff' },
    args: {
        name: { type: 'string', description: 'Migration name' },
        empty: { type: 'boolean', description: 'Generate empty migration template' },
        'no-down': { type: 'boolean', description: 'Skip generating DOWN section' },
        'dry-run': { type: 'boolean', description: 'Show migration without writing' },
        yes: { type: 'boolean', alias: 'y', description: 'Skip confirmation' },
    },
    async run({ args }) {
        const { config, projectRoot } = await buildContext();
        console.log('');
        if (!isInitialized(projectRoot)) {
            fatal('not a relq repository', `Run ${colors.cyan('relq init')} to initialize.`);
        }
        await requireValidConfig(config, { calledFrom: 'generate' });
        const connection = config.connection;
        const migrationsDir = config.migrations?.directory || './migrations';
        const format = config.migrations?.format || 'sequential';
        const includeFunctions = config.includeFunctions ?? false;
        const includeTriggers = config.includeTriggers ?? false;
        const includePolicies = config.includePolicies ?? false;
        const isEmpty = args.empty === true;
        const noDown = args['no-down'] === true;
        const dryRun = args['dry-run'] === true;
        const skipPrompt = args.yes === true;
        let migrationName = args.name || '';
        if (!migrationName && !isEmpty && !skipPrompt) {
            const result = await p.text({
                message: 'Migration name (leave empty to auto-generate):',
                placeholder: 'add_users_table',
            });
            if (p.isCancel(result)) {
                fatal('Operation cancelled by user');
            }
            migrationName = result || '';
        }
        migrationName = migrationName.replace(/\s+/g, '_').toLowerCase();
        if (isEmpty) {
            migrationName = migrationName || 'empty';
            createEmptyMigration(migrationsDir, migrationName, format, dryRun);
            return;
        }
        const ignorePatterns = loadRelqignore(projectRoot);
        const spin = p.spinner();
        try {
            const schemaPathRaw = getSchemaPath(config);
            const schemaPath = path.resolve(projectRoot, schemaPathRaw);
            spin.start('Loading schema file...');
            const validation = validateSchemaFile(schemaPath);
            if (!validation.valid) {
                spin.stop('Schema validation failed');
                console.log('');
                console.log(formatValidationErrors(validation));
                fatal('Fix schema errors before generating');
            }
            const schemaSource = fs.readFileSync(schemaPath, 'utf-8');
            const sourceIdIssues = validateSourceTrackingIds(schemaPath, schemaSource);
            if (sourceIdIssues.length > 0) {
                spin.stop('Schema validation failed');
                console.log('');
                console.log(formatTrackingIdIssues(sourceIdIssues));
                console.log('');
                fatal('Generate aborted — resolve tracking ID issues first.');
            }
            const { schema: desiredSchema, ast: desiredAST } = await loadSchemaFile(schemaPathRaw, projectRoot, config);
            spin.stop(`Schema: ${colors.cyan(String(desiredSchema.tables.length))} table(s) loaded`);
            const trackingIssues = validateTrackingIds(desiredAST);
            const trackingErrors = trackingIssues.filter(i => i.severity === 'error');
            if (trackingErrors.length > 0) {
                console.log('');
                console.log(formatTrackingIdIssues(trackingErrors));
                console.log('');
                fatal('Generate aborted — resolve tracking ID issues first.');
            }
            spin.start(`Connecting to ${getConnectionDescription(connection)}...`);
            const dbSchema = await dialectIntrospect(config, {
                includeFunctions,
                includeTriggers,
            });
            spin.stop(`Database: ${colors.cyan(String(dbSchema.tables.length))} table(s) found`);
            spin.start('Computing diff...');
            const rawPatterns = ignorePatterns.map(pat => pat.raw);
            const dbParsedSchema = await introspectedToParsedSchema(dbSchema);
            const desiredASTCopy = { ...desiredAST };
            if (!includeFunctions) {
                dbParsedSchema.functions = [];
                desiredASTCopy.functions = [];
            }
            if (!includeTriggers) {
                dbParsedSchema.triggers = [];
                desiredASTCopy.triggers = [];
            }
            if (!includePolicies) {
                dbParsedSchema.policies = [];
                desiredASTCopy.policies = [];
            }
            const comparison = compareSchemas(dbParsedSchema, desiredASTCopy);
            applyIgnorePatterns(comparison, rawPatterns);
            spin.stop('Diff computed');
            if (!comparison.hasChanges) {
                console.log('');
                console.log('No changes to generate — schema is in sync.');
                console.log('');
                return;
            }
            console.log('');
            console.log(`${colors.bold('Changes to include:')}`);
            for (const t of comparison.added.tables) {
                console.log(`  ${colors.green('+')} table ${colors.bold(t.name)}`);
            }
            for (const t of comparison.removed.tables) {
                console.log(`  ${colors.red('-')} table ${colors.bold(t.name)}`);
            }
            for (const t of comparison.renamed.tables) {
                console.log(`  ${colors.yellow('~')} table ${colors.bold(t.from)} → ${colors.bold(t.to)}`);
            }
            for (const t of comparison.modified.tables) {
                console.log(`  ${colors.yellow('~')} table ${colors.bold(t.name)}`);
            }
            for (const c of comparison.added.columns) {
                console.log(`  ${colors.green('+')} ${c.table}.${colors.bold(c.column.name)}`);
            }
            for (const c of comparison.removed.columns) {
                console.log(`  ${colors.red('-')} ${c.table}.${colors.bold(c.column.name)}`);
            }
            for (const c of comparison.renamed.columns) {
                console.log(`  ${colors.yellow('~')} ${c.table}: ${colors.bold(c.from)} → ${colors.bold(c.to)}`);
            }
            for (const c of comparison.modified.columns) {
                console.log(`  ${colors.yellow('~')} ${c.table}.${colors.bold(c.column)}`);
            }
            for (const i of comparison.added.indexes) {
                console.log(`  ${colors.green('+')} index ${colors.bold(i.index.name)}`);
            }
            for (const i of comparison.removed.indexes) {
                console.log(`  ${colors.red('-')} index ${colors.bold(i.index.name)}`);
            }
            for (const i of comparison.modified.indexes) {
                console.log(`  ${colors.yellow('~')} index ${colors.bold(i.newIndex.name)}`);
            }
            for (const c of comparison.added.constraints) {
                console.log(`  ${colors.green('+')} constraint ${colors.bold(c.constraint.name)}`);
            }
            for (const c of comparison.removed.constraints) {
                console.log(`  ${colors.red('-')} constraint ${colors.bold(c.constraint.name)}`);
            }
            for (const c of comparison.modified.constraints) {
                console.log(`  ${colors.yellow('~')} constraint ${colors.bold(c.newConstraint.name)}`);
            }
            for (const e of comparison.added.enums) {
                console.log(`  ${colors.green('+')} enum ${colors.bold(e.name)}`);
            }
            for (const e of comparison.removed.enums) {
                console.log(`  ${colors.red('-')} enum ${colors.bold(e.name)}`);
            }
            for (const e of comparison.modified.enums) {
                console.log(`  ${colors.yellow('~')} enum ${colors.bold(e.name)}`);
            }
            for (const d of comparison.added.domains) {
                console.log(`  ${colors.green('+')} domain ${colors.bold(d.name)}`);
            }
            for (const d of comparison.removed.domains) {
                console.log(`  ${colors.red('-')} domain ${colors.bold(d.name)}`);
            }
            for (const d of comparison.modified.domains) {
                console.log(`  ${colors.yellow('~')} domain ${colors.bold(d.name)} ${colors.muted(`(${d.changes.join(', ')})`)}`);
            }
            for (const s of comparison.added.sequences) {
                console.log(`  ${colors.green('+')} sequence ${colors.bold(s.name)}`);
            }
            for (const s of comparison.removed.sequences) {
                console.log(`  ${colors.red('-')} sequence ${colors.bold(s.name)}`);
            }
            for (const s of comparison.modified.sequences) {
                console.log(`  ${colors.yellow('~')} sequence ${colors.bold(s.name)} ${colors.muted(`(${s.changes.join(', ')})`)}`);
            }
            for (const ct of comparison.added.compositeTypes) {
                console.log(`  ${colors.green('+')} type ${colors.bold(ct.name)}`);
            }
            for (const ct of comparison.removed.compositeTypes) {
                console.log(`  ${colors.red('-')} type ${colors.bold(ct.name)}`);
            }
            for (const ct of comparison.modified.compositeTypes) {
                console.log(`  ${colors.yellow('~')} type ${colors.bold(ct.name)} ${colors.muted(`(${ct.changes.join(', ')})`)}`);
            }
            for (const v of comparison.added.views) {
                console.log(`  ${colors.green('+')} view ${colors.bold(v.name)}`);
            }
            for (const v of comparison.removed.views) {
                console.log(`  ${colors.red('-')} view ${colors.bold(v.name)}`);
            }
            for (const v of comparison.modified.views) {
                console.log(`  ${colors.yellow('~')} view ${colors.bold(v.name)} ${colors.muted(`(${v.changes.join(', ')})`)}`);
            }
            for (const f of comparison.added.functions) {
                console.log(`  ${colors.green('+')} function ${colors.bold(f.name)}`);
            }
            for (const f of comparison.removed.functions) {
                console.log(`  ${colors.red('-')} function ${colors.bold(f.name)}`);
            }
            for (const f of comparison.modified.functions) {
                console.log(`  ${colors.yellow('~')} function ${colors.bold(f.name)} ${colors.muted(`(${f.changes.join(', ')})`)}`);
            }
            for (const t of comparison.added.triggers) {
                console.log(`  ${colors.green('+')} trigger ${colors.bold(t.name)}`);
            }
            for (const t of comparison.removed.triggers) {
                console.log(`  ${colors.red('-')} trigger ${colors.bold(t.name)}`);
            }
            for (const t of comparison.modified.triggers) {
                console.log(`  ${colors.yellow('~')} trigger ${colors.bold(t.name)} ${colors.muted(`(${t.changes.join(', ')})`)}`);
            }
            for (const ext of comparison.added.extensions) {
                console.log(`  ${colors.green('+')} extension ${colors.bold(ext)}`);
            }
            for (const ext of comparison.removed.extensions) {
                console.log(`  ${colors.red('-')} extension ${colors.bold(ext)}`);
            }
            console.log('');
            if (hasDestructiveChanges(comparison)) {
                const destructiveItems = getDestructiveItems(comparison);
                warning('Destructive changes detected:');
                for (const item of destructiveItems) {
                    console.log(`   ${colors.red('-')} ${item}`);
                }
                console.log('');
                if (!skipPrompt) {
                    const proceed = await p.confirm({
                        message: 'Include destructive changes?',
                        initialValue: false,
                    });
                    if (p.isCancel(proceed)) {
                        fatal('Operation cancelled by user');
                    }
                    if (!proceed) {
                        stripDestructiveChanges(comparison);
                        if (!comparison.hasChanges) {
                            p.log.info('No non-destructive changes to generate.');
                            process.exit(0);
                        }
                        p.log.info('Destructive changes excluded. Continuing with safe changes only.');
                    }
                }
            }
            if (!migrationName) {
                migrationName = generateMigrationNameFromComparison(comparison);
                if (!migrationName)
                    migrationName = 'migration';
            }
            spin.start('Generating migration...');
            const fullMigration = generateMigrationFromComparison(comparison, { includeDown: !noDown });
            const upStatements = fullMigration.up.filter((s) => s.trim());
            const downStatements = fullMigration.down.filter((s) => s.trim());
            spin.stop(`Migration generated — ${upStatements.length} statement(s)`);
            let fileName;
            if (format === 'timestamp') {
                fileName = generateTimestampedName(migrationName) + '.sql';
            }
            else {
                const num = getNextMigrationNumber(migrationsDir);
                fileName = `${num}_${migrationName}.sql`;
            }
            const filePath = path.join(migrationsDir, fileName);
            const polishedUp = formatMigrationStatementsPolished(upStatements);
            const upSection = polishedUp.length > 0
                ? polishedUp.join('\n')
                : '-- (no changes)';
            const generatedAt = new Date().toISOString();
            const content = `-- Migration: ${migrationName}\n-- Generated: ${generatedAt}\n\n${upSection}\n`;
            const migrationHash = crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);
            if (dryRun) {
                const previewUp = formatMigrationStatements(upStatements);
                console.log(`${colors.yellow('Dry run')} — would create: ${colors.cyan(filePath)}`);
                console.log('');
                for (const line of previewUp.slice(0, 30)) {
                    console.log(`   ${line}`);
                }
                if (upStatements.length > 20) {
                    console.log(`   ${colors.muted(`... and ${upStatements.length - 20} more statements`)}`);
                }
                console.log('');
                console.log(`${colors.muted('Remove')} ${colors.cyan('--dry-run')} ${colors.muted('to write the file.')}`);
                console.log('');
                return;
            }
            if (!fs.existsSync(migrationsDir)) {
                fs.mkdirSync(migrationsDir, { recursive: true });
            }
            fs.writeFileSync(filePath, content, 'utf-8');
            const relqMigrationsDir = path.join(projectRoot, '.relq', 'migrations');
            if (!fs.existsSync(relqMigrationsDir)) {
                fs.mkdirSync(relqMigrationsDir, { recursive: true });
            }
            const astRecord = {
                hash: migrationHash,
                name: migrationName,
                filename: fileName,
                generatedAt,
                up: upStatements,
                down: downStatements,
                statementCount: { up: upStatements.length, down: downStatements.length },
            };
            const astPath = path.join(relqMigrationsDir, `${migrationHash}.json`);
            fs.writeFileSync(astPath, JSON.stringify(astRecord, null, 2), 'utf-8');
            console.log('');
            console.log(`${colors.green('Created')} ${colors.cyan(filePath)}`);
            console.log(`${colors.muted('AST:')}    ${colors.muted(path.relative(projectRoot, astPath))}`);
            console.log('');
            console.log(`${colors.muted('Run')} ${colors.cyan('relq migrate')} ${colors.muted('to apply.')}`);
            console.log('');
        }
        catch (error) {
            spin.error('Generation failed');
            fatal(formatError(error));
        }
    },
});
