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
const p = __importStar(require("@clack/prompts"));
const context_1 = require("../utils/context.cjs");
const colors_1 = require("../utils/colors.cjs");
const ui_1 = require("../utils/ui.cjs");
const config_loader_1 = require("../utils/config-loader.cjs");
const dialect_introspect_1 = require("../utils/dialect-introspect.cjs");
const env_loader_1 = require("../utils/env-loader.cjs");
const repo_manager_1 = require("../utils/repo-manager.cjs");
const schema_validator_1 = require("../utils/schema-validator.cjs");
const schema_loader_1 = require("../utils/schema-loader.cjs");
const schema_diff_1 = require("../utils/schema-diff.cjs");
const schema_hash_1 = require("../utils/schema-hash.cjs");
const migration_generator_1 = require("../utils/migration-generator.cjs");
const relqignore_1 = require("../utils/relqignore.cjs");
function createEmptyMigration(migrationsDir, name, format, dryRun) {
    let fileName;
    if (format === 'timestamp') {
        fileName = (0, migration_generator_1.generateTimestampedName)(name) + '.sql';
    }
    else {
        const num = (0, migration_generator_1.getNextMigrationNumber)(migrationsDir);
        fileName = `${num}_${name}.sql`;
    }
    const filePath = path.join(migrationsDir, fileName);
    const content = `-- Migration: ${name}
-- Generated: ${new Date().toISOString()}

-- UP


-- DOWN

`;
    if (dryRun) {
        console.log(`${colors_1.colors.yellow('Dry run')} — would create: ${colors_1.colors.cyan(filePath)}`);
        console.log('');
        return;
    }
    if (!fs.existsSync(migrationsDir)) {
        fs.mkdirSync(migrationsDir, { recursive: true });
    }
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('');
    console.log(`${colors_1.colors.green('Created')} ${colors_1.colors.cyan(filePath)}`);
    console.log('');
}
exports.default = (0, citty_1.defineCommand)({
    meta: { name: 'generate', description: 'Generate migration file from schema diff' },
    args: {
        name: { type: 'string', description: 'Migration name' },
        empty: { type: 'boolean', description: 'Generate empty migration template' },
        'no-down': { type: 'boolean', description: 'Skip generating DOWN section' },
        'dry-run': { type: 'boolean', description: 'Show migration without writing' },
        yes: { type: 'boolean', alias: 'y', description: 'Skip confirmation' },
    },
    async run({ args }) {
        const { config, projectRoot } = await (0, context_1.buildContext)();
        console.log('');
        if (!(0, repo_manager_1.isInitialized)(projectRoot)) {
            (0, ui_1.fatal)('not a relq repository', `Run ${colors_1.colors.cyan('relq init')} to initialize.`);
        }
        await (0, config_loader_1.requireValidConfig)(config, { calledFrom: 'generate' });
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
                (0, ui_1.fatal)('Operation cancelled by user');
            }
            migrationName = result || '';
        }
        migrationName = migrationName.replace(/\s+/g, '_').toLowerCase();
        if (isEmpty) {
            migrationName = migrationName || 'empty';
            createEmptyMigration(migrationsDir, migrationName, format, dryRun);
            return;
        }
        const ignorePatterns = (0, relqignore_1.loadRelqignore)(projectRoot);
        const spin = p.spinner();
        try {
            const schemaPathRaw = (0, config_loader_1.getSchemaPath)(config);
            const schemaPath = path.resolve(projectRoot, schemaPathRaw);
            spin.start('Loading schema file...');
            const validation = (0, schema_validator_1.validateSchemaFile)(schemaPath);
            if (!validation.valid) {
                spin.stop('Schema validation failed');
                console.log('');
                console.log((0, schema_validator_1.formatValidationErrors)(validation));
                (0, ui_1.fatal)('Fix schema errors before generating');
            }
            const { schema: desiredSchema } = await (0, schema_loader_1.loadSchemaFile)(schemaPathRaw, projectRoot);
            spin.stop(`Schema: ${colors_1.colors.cyan(String(desiredSchema.tables.length))} table(s) loaded`);
            spin.start(`Connecting to ${(0, env_loader_1.getConnectionDescription)(connection)}...`);
            const dbSchema = await (0, dialect_introspect_1.dialectIntrospect)(config, {
                includeFunctions,
                includeTriggers,
            });
            spin.stop(`Database: ${colors_1.colors.cyan(String(dbSchema.tables.length))} table(s) found`);
            spin.start('Computing diff...');
            const rawPatterns = ignorePatterns.map(pat => pat.raw);
            const diff = (0, schema_diff_1.diffSchemas)((0, schema_hash_1.normalizeSchema)(dbSchema), (0, schema_hash_1.normalizeSchema)(desiredSchema));
            const filteredDiff = (0, schema_diff_1.filterDiff)(diff, rawPatterns);
            spin.stop('Diff computed');
            if (!filteredDiff.hasChanges) {
                console.log('');
                console.log('No changes to generate — schema is in sync.');
                console.log('');
                return;
            }
            const s = filteredDiff.summary;
            console.log('');
            console.log(`${colors_1.colors.bold('Changes to include:')}`);
            if (s.tablesAdded > 0)
                console.log(`   ${colors_1.colors.green('+')} ${s.tablesAdded} table(s) to create`);
            if (s.tablesRemoved > 0)
                console.log(`   ${colors_1.colors.red('-')} ${s.tablesRemoved} table(s) to drop`);
            if (s.tablesModified > 0)
                console.log(`   ${colors_1.colors.yellow('~')} ${s.tablesModified} table(s) modified`);
            if (s.columnsAdded > 0)
                console.log(`   ${colors_1.colors.green('+')} ${s.columnsAdded} column(s) to add`);
            if (s.columnsRemoved > 0)
                console.log(`   ${colors_1.colors.red('-')} ${s.columnsRemoved} column(s) to drop`);
            if (s.columnsModified > 0)
                console.log(`   ${colors_1.colors.yellow('~')} ${s.columnsModified} column(s) modified`);
            console.log('');
            if ((0, schema_diff_1.hasDestructiveChanges)(filteredDiff)) {
                const tables = (0, schema_diff_1.getDestructiveTables)(filteredDiff);
                (0, ui_1.warning)('Destructive changes detected:');
                for (const t of tables) {
                    console.log(`   ${colors_1.colors.red('-')} ${t}`);
                }
                console.log('');
                if (!skipPrompt) {
                    const proceed = await p.confirm({
                        message: 'Include destructive changes?',
                        initialValue: false,
                    });
                    if (p.isCancel(proceed) || !proceed) {
                        (0, ui_1.fatal)('Operation cancelled by user');
                    }
                }
            }
            if (!migrationName) {
                migrationName = (0, migration_generator_1.generateMigrationName)(filteredDiff);
            }
            spin.start('Generating migration...');
            const migration = (0, migration_generator_1.generateMigrationFile)(filteredDiff, migrationName, {
                includeDown: !noDown,
                includeComments: true,
            });
            spin.stop('Migration generated');
            let fileName;
            if (format === 'timestamp') {
                fileName = (0, migration_generator_1.generateTimestampedName)(migrationName) + '.sql';
            }
            else {
                const num = (0, migration_generator_1.getNextMigrationNumber)(migrationsDir);
                fileName = `${num}_${migrationName}.sql`;
            }
            const filePath = path.join(migrationsDir, fileName);
            if (dryRun) {
                console.log(`${colors_1.colors.yellow('Dry run')} — would create: ${colors_1.colors.cyan(filePath)}`);
                console.log('');
                const statements = migration.content.split(';').filter(s => s.trim());
                for (const stmt of statements.slice(0, 20)) {
                    console.log(`   ${stmt.trim()};`);
                }
                if (statements.length > 20) {
                    console.log(`   ${colors_1.colors.muted(`... and ${statements.length - 20} more statements`)}`);
                }
                console.log('');
                console.log(`${colors_1.colors.muted('Remove')} ${colors_1.colors.cyan('--dry-run')} ${colors_1.colors.muted('to write the file.')}`);
                console.log('');
                return;
            }
            if (!fs.existsSync(migrationsDir)) {
                fs.mkdirSync(migrationsDir, { recursive: true });
            }
            fs.writeFileSync(filePath, migration.content, 'utf-8');
            console.log('');
            console.log(`${colors_1.colors.green('Created')} ${colors_1.colors.cyan(filePath)}`);
            console.log('');
            console.log(`${colors_1.colors.muted('Run')} ${colors_1.colors.cyan('relq migrate')} ${colors_1.colors.muted('to apply.')}`);
            console.log('');
        }
        catch (error) {
            spin.error('Generation failed');
            (0, ui_1.fatal)((0, ui_1.formatError)(error));
        }
    },
});
