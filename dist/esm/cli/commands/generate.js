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
import { diffSchemas, filterDiff, hasDestructiveChanges, getDestructiveTables } from "../utils/schema-diff.js";
import { normalizeSchema } from "../utils/schema-hash.js";
import { generateMigrationFile, generateMigrationName, getNextMigrationNumber, generateTimestampedName } from "../utils/migration-generator.js";
import { loadRelqignore } from "../utils/relqignore.js";
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
            const { schema: desiredSchema } = await loadSchemaFile(schemaPathRaw, projectRoot);
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
            const filteredDiff = filterDiff(diff, rawPatterns);
            spin.stop('Diff computed');
            if (!filteredDiff.hasChanges) {
                console.log('');
                console.log('No changes to generate — schema is in sync.');
                console.log('');
                return;
            }
            const s = filteredDiff.summary;
            console.log('');
            console.log(`${colors.bold('Changes to include:')}`);
            if (s.tablesAdded > 0)
                console.log(`   ${colors.green('+')} ${s.tablesAdded} table(s) to create`);
            if (s.tablesRemoved > 0)
                console.log(`   ${colors.red('-')} ${s.tablesRemoved} table(s) to drop`);
            if (s.tablesModified > 0)
                console.log(`   ${colors.yellow('~')} ${s.tablesModified} table(s) modified`);
            if (s.columnsAdded > 0)
                console.log(`   ${colors.green('+')} ${s.columnsAdded} column(s) to add`);
            if (s.columnsRemoved > 0)
                console.log(`   ${colors.red('-')} ${s.columnsRemoved} column(s) to drop`);
            if (s.columnsModified > 0)
                console.log(`   ${colors.yellow('~')} ${s.columnsModified} column(s) modified`);
            console.log('');
            if (hasDestructiveChanges(filteredDiff)) {
                const tables = getDestructiveTables(filteredDiff);
                warning('Destructive changes detected:');
                for (const t of tables) {
                    console.log(`   ${colors.red('-')} ${t}`);
                }
                console.log('');
                if (!skipPrompt) {
                    const proceed = await p.confirm({
                        message: 'Include destructive changes?',
                        initialValue: false,
                    });
                    if (p.isCancel(proceed) || !proceed) {
                        fatal('Operation cancelled by user');
                    }
                }
            }
            if (!migrationName) {
                migrationName = generateMigrationName(filteredDiff);
            }
            spin.start('Generating migration...');
            const migration = generateMigrationFile(filteredDiff, migrationName, {
                includeDown: !noDown,
                includeComments: true,
            });
            spin.stop('Migration generated');
            let fileName;
            if (format === 'timestamp') {
                fileName = generateTimestampedName(migrationName) + '.sql';
            }
            else {
                const num = getNextMigrationNumber(migrationsDir);
                fileName = `${num}_${migrationName}.sql`;
            }
            const filePath = path.join(migrationsDir, fileName);
            if (dryRun) {
                console.log(`${colors.yellow('Dry run')} — would create: ${colors.cyan(filePath)}`);
                console.log('');
                const statements = migration.content.split(';').filter(s => s.trim());
                for (const stmt of statements.slice(0, 20)) {
                    console.log(`   ${stmt.trim()};`);
                }
                if (statements.length > 20) {
                    console.log(`   ${colors.muted(`... and ${statements.length - 20} more statements`)}`);
                }
                console.log('');
                console.log(`${colors.muted('Remove')} ${colors.cyan('--dry-run')} ${colors.muted('to write the file.')}`);
                console.log('');
                return;
            }
            if (!fs.existsSync(migrationsDir)) {
                fs.mkdirSync(migrationsDir, { recursive: true });
            }
            fs.writeFileSync(filePath, migration.content, 'utf-8');
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
