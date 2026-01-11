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
exports.generateCommand = generateCommand;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const readline = __importStar(require("readline"));
const config_loader_1 = require("../utils/config-loader.cjs");
const schema_introspect_1 = require("../utils/schema-introspect.cjs");
const snapshot_manager_1 = require("../utils/snapshot-manager.cjs");
const schema_diff_1 = require("../utils/schema-diff.cjs");
const schema_hash_1 = require("../utils/schema-hash.cjs");
const migration_generator_1 = require("../utils/migration-generator.cjs");
const env_loader_1 = require("../utils/env-loader.cjs");
const cli_utils_1 = require("../utils/cli-utils.cjs");
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
async function generateCommand(context) {
    const { config, args, flags } = context;
    if (!config) {
        (0, cli_utils_1.fatal)('No configuration found', `run ${cli_utils_1.colors.cyan('relq init')} to create a configuration file`);
        return;
    }
    await (0, config_loader_1.requireValidConfig)(config, { calledFrom: 'generate' });
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
            (0, cli_utils_1.fatal)('Migration name is required');
            return;
        }
    }
    if (isEmpty) {
        migrationName = migrationName || 'empty';
        await createEmptyMigration(migrationsDir, migrationName, format, dryRun);
        return;
    }
    console.log('Generating migration...');
    console.log(`   Connection: ${(0, env_loader_1.getConnectionDescription)(connection)}`);
    console.log('');
    try {
        const dbSchema = await (0, schema_introspect_1.introspectDatabase)(connection);
        const snapshot = (0, snapshot_manager_1.loadSnapshot)(snapshotPath);
        if (!snapshot) {
            (0, cli_utils_1.warning)('No snapshot found.');
            console.log('Run "relq pull" first to create initial snapshot.');
            return;
        }
        const localSchema = (0, snapshot_manager_1.snapshotToDatabaseSchema)(snapshot);
        const diff = (0, schema_diff_1.diffSchemas)((0, schema_hash_1.normalizeSchema)(localSchema), (0, schema_hash_1.normalizeSchema)(dbSchema));
        const filteredDiff = (0, schema_diff_1.filterDiff)(diff, ignorePatterns);
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
        if ((0, schema_diff_1.hasDestructiveChanges)(filteredDiff)) {
            const tables = (0, schema_diff_1.getDestructiveTables)(filteredDiff);
            (0, cli_utils_1.warning)('Destructive changes:');
            for (const t of tables) {
                console.log(`   - ${t}`);
            }
            console.log('');
            if (!autoStage) {
                const proceed = await (0, cli_utils_1.confirm)('Include destructive changes?', false);
                if (!proceed) {
                    console.log('Cancelled.');
                    return;
                }
            }
        }
        const migrationFile = (0, migration_generator_1.generateMigrationFile)(filteredDiff, migrationName, {
            includeDown: !noDown,
            includeComments: true,
            message: message,
        });
        let fileName;
        if (format === 'timestamp') {
            fileName = (0, migration_generator_1.generateTimestampedName)(migrationName) + '.sql';
        }
        else {
            const num = (0, migration_generator_1.getNextMigrationNumber)(migrationsDir);
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
            (0, snapshot_manager_1.saveSnapshot)(dbSchema, snapshotPath, connection.database);
            console.log('Updated snapshot.');
        }
        console.log('');
        console.log('Run "relq push" to apply this migration.');
    }
    catch (error) {
        (0, cli_utils_1.fatal)('Generation failed', error instanceof Error ? error.message : String(error));
    }
}
async function createEmptyMigration(migrationsDir, name, format, dryRun) {
    let fileName;
    if (format === 'timestamp') {
        fileName = (0, migration_generator_1.generateTimestampedName)(name) + '.sql';
    }
    else {
        const num = (0, migration_generator_1.getNextMigrationNumber)(migrationsDir);
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
