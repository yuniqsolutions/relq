import { defineCommand } from 'citty';
import * as fs from 'node:fs';
import * as path from 'node:path';
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
import { diffSchemas, filterDiff, hasDestructiveChanges, getDestructiveTables, stripDestructiveChanges, formatCategorizedSummary, compareSchemas } from "../utils/schema-diff.js";
import { normalizeSchema } from "../utils/schema-hash.js";
import { generateMigrationFromComparison, generateMigrationNameFromComparison, getNextMigrationNumber, generateTimestampedName } from "../utils/migration-generator.js";
import { loadRelqignore } from "../utils/relqignore.js";
import { introspectedToParsedSchema } from "../utils/ast-transformer.js";
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
            const { schema: desiredSchema, ast: desiredAST } = await loadSchemaFile(schemaPathRaw, projectRoot);
            spin.stop(`Schema: ${colors.cyan(String(desiredSchema.tables.length))} table(s) loaded`);
            spin.start(`Connecting to ${getConnectionDescription(connection)}...`);
            const dbSchema = await dialectIntrospect(config, {
                includeFunctions,
                includeTriggers,
            });
            spin.stop(`Database: ${colors.cyan(String(dbSchema.tables.length))} table(s) found`);
            spin.start('Computing diff...');
            const rawPatterns = ignorePatterns.map(pat => pat.raw);
            const diff = diffSchemas(normalizeSchema(dbSchema), normalizeSchema(desiredSchema));
            let filteredDiff = filterDiff(diff, rawPatterns);
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
            const comparison = compareSchemas(dbParsedSchema, desiredASTCopy);
            spin.stop('Diff computed');
            if (!comparison.hasChanges && !filteredDiff.hasChanges) {
                console.log('');
                console.log('No changes to generate — schema is in sync.');
                console.log('');
                return;
            }
            console.log('');
            console.log(`${colors.bold('Changes to include:')}`);
            const changeSummaryLines = formatCategorizedSummary(filteredDiff);
            for (const line of changeSummaryLines)
                console.log(line);
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
            for (const s of comparison.added.sequences) {
                console.log(`  ${colors.green('+')} sequence ${colors.bold(s.name)}`);
            }
            for (const s of comparison.removed.sequences) {
                console.log(`  ${colors.red('-')} sequence ${colors.bold(s.name)}`);
            }
            for (const ct of comparison.added.compositeTypes) {
                console.log(`  ${colors.green('+')} type ${colors.bold(ct.name)}`);
            }
            for (const ct of comparison.removed.compositeTypes) {
                console.log(`  ${colors.red('-')} type ${colors.bold(ct.name)}`);
            }
            for (const v of comparison.added.views) {
                console.log(`  ${colors.green('+')} view ${colors.bold(v.name)}`);
            }
            for (const v of comparison.removed.views) {
                console.log(`  ${colors.red('-')} view ${colors.bold(v.name)}`);
            }
            for (const f of comparison.added.functions) {
                console.log(`  ${colors.green('+')} function ${colors.bold(f.name)}`);
            }
            for (const f of comparison.removed.functions) {
                console.log(`  ${colors.red('-')} function ${colors.bold(f.name)}`);
            }
            for (const t of comparison.added.triggers) {
                console.log(`  ${colors.green('+')} trigger ${colors.bold(t.name)}`);
            }
            for (const t of comparison.removed.triggers) {
                console.log(`  ${colors.red('-')} trigger ${colors.bold(t.name)}`);
            }
            for (const ext of comparison.added.extensions) {
                console.log(`  ${colors.green('+')} extension ${colors.bold(ext)}`);
            }
            for (const ext of comparison.removed.extensions) {
                console.log(`  ${colors.red('-')} extension ${colors.bold(ext)}`);
            }
            console.log('');
            const hasNonTableDestructive = comparison.removed.enums.length > 0
                || comparison.removed.domains.length > 0
                || comparison.removed.sequences.length > 0
                || comparison.removed.compositeTypes.length > 0
                || comparison.removed.views.length > 0
                || comparison.removed.functions.length > 0
                || comparison.removed.triggers.length > 0;
            if (hasDestructiveChanges(filteredDiff) || hasNonTableDestructive) {
                const destructiveItems = [];
                const tables = getDestructiveTables(filteredDiff);
                for (const t of tables)
                    destructiveItems.push(t);
                for (const e of comparison.removed.enums)
                    destructiveItems.push(`enum ${e.name}`);
                for (const d of comparison.removed.domains)
                    destructiveItems.push(`domain ${d.name}`);
                for (const s of comparison.removed.sequences)
                    destructiveItems.push(`sequence ${s.name}`);
                for (const ct of comparison.removed.compositeTypes)
                    destructiveItems.push(`type ${ct.name}`);
                for (const v of comparison.removed.views)
                    destructiveItems.push(`view ${v.name}`);
                for (const f of comparison.removed.functions)
                    destructiveItems.push(`function ${f.name}`);
                for (const tr of comparison.removed.triggers)
                    destructiveItems.push(`trigger ${tr.name}`);
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
                        filteredDiff = stripDestructiveChanges(filteredDiff);
                        comparison.removed.enums = [];
                        comparison.removed.domains = [];
                        comparison.removed.sequences = [];
                        comparison.removed.compositeTypes = [];
                        comparison.removed.views = [];
                        comparison.removed.functions = [];
                        comparison.removed.triggers = [];
                        if (!filteredDiff.hasChanges && !comparison.hasChanges) {
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
            const upSection = upStatements.length > 0
                ? upStatements.join('\n\n')
                : '-- (no changes)';
            const downSection = !noDown && downStatements.length > 0
                ? downStatements.join('\n\n')
                : '-- (no revert statements)';
            const content = `-- Migration: ${migrationName}
-- Generated: ${new Date().toISOString()}

-- UP
${upSection}

-- DOWN
${downSection}
`;
            if (dryRun) {
                console.log(`${colors.yellow('Dry run')} — would create: ${colors.cyan(filePath)}`);
                console.log('');
                for (const stmt of upStatements.slice(0, 20)) {
                    console.log(`   ${stmt}`);
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
            console.log('');
            console.log(`${colors.green('Created')} ${colors.cyan(filePath)}`);
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
