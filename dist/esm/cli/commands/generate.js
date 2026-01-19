import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { requireValidConfig } from "../utils/config-loader.js";
import { introspectDatabase } from "../utils/schema-introspect.js";
import { loadSnapshot, snapshotToDatabaseSchema, saveSnapshot } from "../utils/snapshot-manager.js";
import { diffSchemas, filterDiff, hasDestructiveChanges, getDestructiveTables } from "../utils/schema-diff.js";
import { normalizeSchema } from "../utils/schema-hash.js";
import { generateMigrationFile, getNextMigrationNumber, generateTimestampedName } from "../utils/migration-generator.js";
import { getConnectionDescription } from "../utils/env-loader.js";
import { colors, confirm, fatal, warning } from "../utils/cli-utils.js";
function askInput(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer.trim());
        });
    });
}
export async function generateCommand(context) {
    const { config, args, flags } = context;
    if (!config) {
        fatal('No configuration found', `run ${colors.cyan('relq init')} to create a configuration file`);
        return;
    }
    await requireValidConfig(config, { calledFrom: 'generate' });
    const connection = config.connection;
    const migrationsDir = config.migrations?.directory || './migrations';
    const snapshotPath = config.sync?.snapshot || '.relq/snapshot.json';
    const ignorePatterns = config.sync?.ignore || ['_relq_*'];
    const format = config.migrations?.format || 'sequential';
    const message = flags['m'] || flags['message'];
    const autoStage = flags['a'] === true || flags['am'] !== undefined;
    const isEmpty = flags['empty'] === true;
    const interactive = flags['interactive'] === true;
    const noDown = flags['no-down'] === true;
    const dryRun = flags['dry-run'] === true;
    let migrationName = args[0] || '';
    if (flags['am']) {
        const amMessage = flags['am'];
        if (typeof amMessage === 'string') {
            migrationName = amMessage.replace(/\s+/g, '_').toLowerCase();
        }
    }
    if (!migrationName && message) {
        migrationName = message.replace(/\s+/g, '_').toLowerCase();
    }
    if (!migrationName && !isEmpty) {
        migrationName = await askInput('Migration name: ');
        if (!migrationName) {
            fatal('Migration name is required');
            return;
        }
    }
    if (isEmpty) {
        migrationName = migrationName || 'empty';
        await createEmptyMigration(migrationsDir, migrationName, format, dryRun);
        return;
    }
    console.log('Generating migration...');
    console.log(`   Connection: ${getConnectionDescription(connection)}`);
    console.log('');
    try {
        const dbSchema = await introspectDatabase(connection);
        const snapshot = loadSnapshot(snapshotPath);
        if (!snapshot) {
            warning('No snapshot found.');
            console.log('Run "relq pull" first to create initial snapshot.');
            return;
        }
        const localSchema = snapshotToDatabaseSchema(snapshot);
        const diff = diffSchemas(normalizeSchema(localSchema), normalizeSchema(dbSchema));
        const filteredDiff = filterDiff(diff, ignorePatterns);
        if (!filteredDiff.hasChanges) {
            console.log('No changes to generate.');
            return;
        }
        const s = filteredDiff.summary;
        console.log('Changes to include:');
        if (s.tablesAdded > 0)
            console.log(`  + ${s.tablesAdded} table(s)`);
        if (s.tablesRemoved > 0)
            console.log(`  - ${s.tablesRemoved} table(s)`);
        if (s.tablesModified > 0)
            console.log(`  ~ ${s.tablesModified} table(s) modified`);
        if (s.columnsAdded > 0)
            console.log(`  + ${s.columnsAdded} column(s)`);
        if (s.columnsRemoved > 0)
            console.log(`  - ${s.columnsRemoved} column(s)`);
        if (s.columnsModified > 0)
            console.log(`  ~ ${s.columnsModified} column(s)`);
        console.log('');
        if (hasDestructiveChanges(filteredDiff)) {
            const tables = getDestructiveTables(filteredDiff);
            warning('Destructive changes:');
            for (const t of tables) {
                console.log(`   - ${t}`);
            }
            console.log('');
            if (!autoStage) {
                const proceed = await confirm('Include destructive changes?', false);
                if (!proceed) {
                    console.log('Cancelled.');
                    return;
                }
            }
        }
        const migrationFile = generateMigrationFile(filteredDiff, migrationName, {
            includeDown: !noDown,
            includeComments: true,
            message: message,
        });
        let fileName;
        if (format === 'timestamp') {
            fileName = generateTimestampedName(migrationName) + '.sql';
        }
        else {
            const num = getNextMigrationNumber(migrationsDir);
            fileName = `${num}_${migrationName.replace(/\s+/g, '_').toLowerCase()}.sql`;
        }
        const filePath = path.join(migrationsDir, fileName);
        if (dryRun) {
            console.log(`[dry-run] Would create: ${filePath}`);
            console.log('');
            console.log('--- Generated SQL ---');
            console.log(migrationFile.content);
            console.log('--- End ---');
        }
        else {
            if (!fs.existsSync(migrationsDir)) {
                fs.mkdirSync(migrationsDir, { recursive: true });
            }
            fs.writeFileSync(filePath, migrationFile.content, 'utf-8');
            console.log(`Created: ${filePath}`);
            saveSnapshot(dbSchema, snapshotPath, connection.database);
            console.log('Updated snapshot.');
        }
        console.log('');
        console.log('Run "relq push" to apply this migration.');
    }
    catch (error) {
        fatal('Generation failed', error instanceof Error ? error.message : String(error));
    }
}
async function createEmptyMigration(migrationsDir, name, format, dryRun) {
    let fileName;
    if (format === 'timestamp') {
        fileName = generateTimestampedName(name) + '.sql';
    }
    else {
        const num = getNextMigrationNumber(migrationsDir);
        fileName = `${num}_${name.replace(/\s+/g, '_').toLowerCase()}.sql`;
    }
    const filePath = path.join(migrationsDir, fileName);
    const content = `-- Migration: ${name}
-- Generated: ${new Date().toISOString()}

-- UP
-- Add your schema changes here


-- DOWN
-- Add rollback statements here

`;
    if (dryRun) {
        console.log(`[dry-run] Would create: ${filePath}`);
    }
    else {
        if (!fs.existsSync(migrationsDir)) {
            fs.mkdirSync(migrationsDir, { recursive: true });
        }
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`Created empty migration: ${filePath}`);
    }
}
