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
const p = __importStar(require("@clack/prompts"));
const context_1 = require("../utils/context.cjs");
const colors_1 = require("../utils/colors.cjs");
const ui_1 = require("../utils/ui.cjs");
const config_loader_1 = require("../utils/config-loader.cjs");
const dialect_introspect_1 = require("../utils/dialect-introspect.cjs");
const env_loader_1 = require("../utils/env-loader.cjs");
const repo_manager_1 = require("../utils/repo-manager.cjs");
const snapshot_manager_1 = require("../utils/snapshot-manager.cjs");
const schema_diff_1 = require("../utils/schema-diff.cjs");
const schema_hash_1 = require("../utils/schema-hash.cjs");
const migration_generator_1 = require("../utils/migration-generator.cjs");
const relqignore_1 = require("../utils/relqignore.cjs");
exports.default = (0, citty_1.defineCommand)({
    meta: { name: 'diff', description: 'Show schema differences' },
    args: {
        sql: { type: 'boolean', description: 'Show SQL statements' },
        json: { type: 'boolean', description: 'Output as JSON' },
    },
    async run({ args }) {
        const { config, projectRoot } = await (0, context_1.buildContext)();
        console.log('');
        if (!(0, repo_manager_1.isInitialized)(projectRoot)) {
            (0, ui_1.fatal)('not a relq repository', `Run ${colors_1.colors.cyan('relq init')} to initialize.`);
        }
        await (0, config_loader_1.requireValidConfig)(config, { calledFrom: 'diff' });
        const connection = config.connection;
        const includeFunctions = config.includeFunctions ?? false;
        const includeTriggers = config.includeTriggers ?? false;
        const snapshotPath = config.sync?.snapshot || '.relq/snapshot.json';
        const snapshot = (0, snapshot_manager_1.loadSnapshot)(snapshotPath);
        if (!snapshot) {
            console.log(`${colors_1.colors.yellow('No local snapshot.')}`);
            console.log(`${colors_1.colors.muted('Run')} ${colors_1.colors.cyan('relq pull')} ${colors_1.colors.muted('first.')}`);
            console.log('');
            return;
        }
        const ignorePatterns = (0, relqignore_1.loadRelqignore)(projectRoot);
        const spin = p.spinner();
        try {
            spin.start(`Connecting to ${(0, env_loader_1.getConnectionDescription)(connection)}...`);
            const dbSchema = await (0, dialect_introspect_1.dialectIntrospect)(config, {
                includeFunctions,
                includeTriggers,
            });
            spin.stop(`Connected — ${dbSchema.tables.length} tables in database`);
            const localSchema = (0, snapshot_manager_1.snapshotToDatabaseSchema)(snapshot);
            const rawPatterns = ignorePatterns.map(pat => pat.raw);
            const pushDiff = (0, schema_diff_1.diffSchemas)((0, schema_hash_1.normalizeSchema)(dbSchema), (0, schema_hash_1.normalizeSchema)(localSchema));
            const filteredPushDiff = (0, schema_diff_1.filterDiff)(pushDiff, rawPatterns);
            const pullDiff = (0, schema_diff_1.diffSchemas)((0, schema_hash_1.normalizeSchema)(localSchema), (0, schema_hash_1.normalizeSchema)(dbSchema));
            const filteredPullDiff = (0, schema_diff_1.filterDiff)(pullDiff, rawPatterns);
            if (args.json) {
                console.log(JSON.stringify({
                    pushChanges: filteredPushDiff.summary,
                    pullChanges: filteredPullDiff.summary,
                    hasPushChanges: filteredPushDiff.hasChanges,
                    hasPullChanges: filteredPullDiff.hasChanges,
                }, null, 2));
                return;
            }
            if (!filteredPushDiff.hasChanges && !filteredPullDiff.hasChanges) {
                console.log('');
                console.log(`${colors_1.colors.green('Local and database are in sync.')}`);
                console.log('');
                return;
            }
            if (filteredPushDiff.hasChanges) {
                const s = filteredPushDiff.summary;
                console.log('');
                console.log(`${colors_1.colors.bold('Local changes')} ${colors_1.colors.muted('(push to apply)')}`);
                console.log('');
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
            }
            if (filteredPullDiff.hasChanges) {
                const s = filteredPullDiff.summary;
                console.log('');
                console.log(`${colors_1.colors.bold('Database drift')} ${colors_1.colors.muted('(pull to sync)')}`);
                console.log('');
                if (s.tablesAdded > 0)
                    console.log(`   ${colors_1.colors.green('+')} ${s.tablesAdded} table(s) in database only`);
                if (s.tablesRemoved > 0)
                    console.log(`   ${colors_1.colors.red('-')} ${s.tablesRemoved} table(s) in local only`);
                if (s.tablesModified > 0)
                    console.log(`   ${colors_1.colors.yellow('~')} ${s.tablesModified} table(s) differ`);
                if (s.columnsAdded > 0)
                    console.log(`   ${colors_1.colors.green('+')} ${s.columnsAdded} column(s) in database only`);
                if (s.columnsRemoved > 0)
                    console.log(`   ${colors_1.colors.red('-')} ${s.columnsRemoved} column(s) in local only`);
                if (s.columnsModified > 0)
                    console.log(`   ${colors_1.colors.yellow('~')} ${s.columnsModified} column(s) differ`);
            }
            if (args.sql && filteredPushDiff.hasChanges) {
                console.log('');
                console.log(`${colors_1.colors.bold('SQL Preview')} ${colors_1.colors.muted('(what push would execute)')}`);
                console.log('');
                const migration = (0, migration_generator_1.generateMigrationFile)(filteredPushDiff, 'diff-preview', {
                    includeDown: false,
                    includeComments: false,
                });
                if (migration.content.trim()) {
                    const statements = migration.content.split(';').filter(s => s.trim());
                    for (const stmt of statements.slice(0, 20)) {
                        console.log(`   ${colors_1.colors.cyan(stmt.trim())};`);
                    }
                    if (statements.length > 20) {
                        console.log(`   ${colors_1.colors.muted(`... and ${statements.length - 20} more statements`)}`);
                    }
                }
                else {
                    console.log(`   ${colors_1.colors.muted('(no SQL changes)')}`);
                }
            }
            console.log('');
            if (filteredPushDiff.hasChanges) {
                console.log(`${colors_1.colors.muted('Run')} ${colors_1.colors.cyan('relq push')} ${colors_1.colors.muted('to apply local changes to database.')}`);
            }
            if (filteredPullDiff.hasChanges) {
                console.log(`${colors_1.colors.muted('Run')} ${colors_1.colors.cyan('relq pull')} ${colors_1.colors.muted('to sync local with database.')}`);
            }
            console.log('');
        }
        catch (error) {
            spin.error('Diff failed');
            (0, ui_1.fatal)((0, ui_1.formatError)(error));
        }
    },
});
