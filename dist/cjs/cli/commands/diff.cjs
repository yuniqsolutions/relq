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
const migration_generator_1 = require("../utils/migration-generator.cjs");
const relqignore_1 = require("../utils/relqignore.cjs");
const schema_loader_1 = require("../utils/schema-loader.cjs");
const ast_transformer_1 = require("../utils/ast-transformer.cjs");
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
    comparison.added.triggers = comparison.added.triggers.filter(t => !shouldIgnore(t.table));
    comparison.removed.triggers = comparison.removed.triggers.filter(t => !shouldIgnore(t.table));
    comparison.modified.triggers = comparison.modified.triggers.filter(t => !shouldIgnore(t.oldTrigger.table));
}
function countComparison(comparison) {
    return {
        tables: { added: comparison.added.tables.length, removed: comparison.removed.tables.length, modified: comparison.modified.tables.length, renamed: comparison.renamed.tables.length },
        columns: { added: comparison.added.columns.length, removed: comparison.removed.columns.length, modified: comparison.modified.columns.length, renamed: comparison.renamed.columns.length },
        indexes: { added: comparison.added.indexes.length, removed: comparison.removed.indexes.length, modified: comparison.modified.indexes.length, renamed: comparison.renamed.indexes.length },
        constraints: { added: comparison.added.constraints.length, removed: comparison.removed.constraints.length, modified: comparison.modified.constraints.length, renamed: comparison.renamed.constraints.length },
        enums: { added: comparison.added.enums.length, removed: comparison.removed.enums.length, modified: comparison.modified.enums.length, renamed: comparison.renamed.enums.length },
        sequences: { added: comparison.added.sequences.length, removed: comparison.removed.sequences.length, modified: comparison.modified.sequences.length, renamed: comparison.renamed.sequences.length },
        functions: { added: comparison.added.functions.length, removed: comparison.removed.functions.length, modified: comparison.modified.functions.length, renamed: comparison.renamed.functions.length },
        views: { added: comparison.added.views.length, removed: comparison.removed.views.length, modified: comparison.modified.views.length },
        triggers: { added: comparison.added.triggers.length, removed: comparison.removed.triggers.length, modified: comparison.modified.triggers.length },
        domains: { added: comparison.added.domains.length, removed: comparison.removed.domains.length, modified: comparison.modified.domains.length },
        compositeTypes: { added: comparison.added.compositeTypes.length, removed: comparison.removed.compositeTypes.length, modified: comparison.modified.compositeTypes.length },
        extensions: { added: comparison.added.extensions.length, removed: comparison.removed.extensions.length },
    };
}
function renderCategoryLines(label, counts, pushMode) {
    const { added, removed, modified = 0, renamed = 0 } = counts;
    if (added > 0)
        console.log(`   ${colors_1.colors.green('+')} ${added} ${label} ${pushMode ? 'to create' : 'in database only'}`);
    if (removed > 0)
        console.log(`   ${colors_1.colors.red('-')} ${removed} ${label} ${pushMode ? 'to drop' : 'in local only'}`);
    if (modified > 0)
        console.log(`   ${colors_1.colors.yellow('~')} ${modified} ${label} ${pushMode ? 'modified' : 'differ'}`);
    if (renamed > 0)
        console.log(`   ${colors_1.colors.cyan('→')} ${renamed} ${label} renamed`);
}
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
        const schemaPath = (0, config_loader_1.getSchemaPath)(config);
        const snapshotPath = config.sync?.snapshot || '.relq/snapshot.json';
        const ignorePatterns = (0, relqignore_1.loadRelqignore)(projectRoot);
        const rawPatterns = ignorePatterns.map(pat => pat.raw);
        const spin = p.spinner();
        try {
            spin.start('Loading local schema file...');
            const { ast: desiredAST } = await (0, schema_loader_1.loadSchemaFile)(schemaPath, projectRoot, config);
            spin.stop('Schema file loaded');
            spin.start(`Connecting to ${(0, env_loader_1.getConnectionDescription)(connection)}...`);
            const dbSchema = await (0, dialect_introspect_1.dialectIntrospect)(config, {
                includeFunctions,
                includeTriggers,
            });
            spin.stop(`Connected — ${dbSchema.tables.length} tables in database`);
            spin.start('Analyzing database schema...');
            const dbParsedSchema = await (0, ast_transformer_1.introspectedToParsedSchema)(dbSchema);
            const snapshot = (0, snapshot_manager_1.loadSnapshot)(snapshotPath);
            if (snapshot && snapshot.tables) {
                for (const dbTable of dbParsedSchema.tables) {
                    const snapTable = snapshot.tables[dbTable.name];
                    if (!snapTable)
                        continue;
                    if (snapTable.trackingId)
                        dbTable.trackingId = snapTable.trackingId;
                    for (const dbCol of dbTable.columns) {
                        const snapCol = snapTable.columns?.[dbCol.name];
                        if (snapCol?.trackingId)
                            dbCol.trackingId = snapCol.trackingId;
                    }
                    for (const dbIdx of dbTable.indexes) {
                        const snapIdx = snapTable.indexes?.[dbIdx.name];
                        if (snapIdx?.trackingId)
                            dbIdx.trackingId = snapIdx.trackingId;
                    }
                    for (const dbCon of dbTable.constraints) {
                        const snapCon = snapTable.constraints?.[dbCon.name];
                        if (snapCon?.trackingId)
                            dbCon.trackingId = snapCon.trackingId;
                    }
                }
            }
            spin.stop('Schema analyzed');
            const pushComparison = (0, schema_diff_1.compareSchemas)(dbParsedSchema, desiredAST);
            applyIgnorePatterns(pushComparison, rawPatterns);
            const pullComparison = (0, schema_diff_1.compareSchemas)(desiredAST, dbParsedSchema);
            applyIgnorePatterns(pullComparison, rawPatterns);
            if (args.json) {
                console.log(JSON.stringify({
                    push: countComparison(pushComparison),
                    pull: countComparison(pullComparison),
                    hasPushChanges: pushComparison.hasChanges,
                    hasPullChanges: pullComparison.hasChanges,
                }, null, 2));
                return;
            }
            if (!pushComparison.hasChanges && !pullComparison.hasChanges) {
                console.log('');
                console.log(`${colors_1.colors.green('Local and database are in sync.')}`);
                console.log('');
                return;
            }
            if (pushComparison.hasChanges) {
                const c = countComparison(pushComparison);
                console.log('');
                console.log(`${colors_1.colors.bold('Local changes')} ${colors_1.colors.muted('(push to apply)')}`);
                console.log('');
                renderCategoryLines('table(s)', c.tables, true);
                renderCategoryLines('column(s)', c.columns, true);
                renderCategoryLines('index(es)', c.indexes, true);
                renderCategoryLines('constraint(s)', c.constraints, true);
                renderCategoryLines('enum(s)', c.enums, true);
                renderCategoryLines('sequence(s)', c.sequences, true);
                renderCategoryLines('function(s)', c.functions, true);
                renderCategoryLines('view(s)', c.views, true);
                renderCategoryLines('trigger(s)', c.triggers, true);
                renderCategoryLines('domain(s)', c.domains, true);
                renderCategoryLines('composite type(s)', c.compositeTypes, true);
                renderCategoryLines('extension(s)', c.extensions, true);
            }
            if (pullComparison.hasChanges) {
                const c = countComparison(pullComparison);
                console.log('');
                console.log(`${colors_1.colors.bold('Database drift')} ${colors_1.colors.muted('(pull to sync)')}`);
                console.log('');
                renderCategoryLines('table(s)', c.tables, false);
                renderCategoryLines('column(s)', c.columns, false);
                renderCategoryLines('index(es)', c.indexes, false);
                renderCategoryLines('constraint(s)', c.constraints, false);
                renderCategoryLines('enum(s)', c.enums, false);
                renderCategoryLines('sequence(s)', c.sequences, false);
                renderCategoryLines('function(s)', c.functions, false);
                renderCategoryLines('view(s)', c.views, false);
                renderCategoryLines('trigger(s)', c.triggers, false);
                renderCategoryLines('domain(s)', c.domains, false);
                renderCategoryLines('composite type(s)', c.compositeTypes, false);
                renderCategoryLines('extension(s)', c.extensions, false);
            }
            if (args.sql && pushComparison.hasChanges) {
                console.log('');
                console.log(`${colors_1.colors.bold('SQL Preview')} ${colors_1.colors.muted('(what push would execute)')}`);
                console.log('');
                const migration = (0, migration_generator_1.generateMigrationFromComparison)(pushComparison);
                const formatted = (0, migration_generator_1.formatMigrationStatements)(migration.up);
                if (formatted.length > 0) {
                    for (const line of formatted.slice(0, 30)) {
                        console.log(`   ${line.startsWith('--') ? colors_1.colors.muted(line) : colors_1.colors.cyan(line)}`);
                    }
                    const stmtCount = formatted.filter(l => l.trim() && !l.trim().startsWith('--')).length;
                    const totalStmts = migration.up.length;
                    if (totalStmts > 20) {
                        console.log(`   ${colors_1.colors.muted(`... and ${totalStmts - 20} more statements`)}`);
                    }
                }
                else {
                    console.log(`   ${colors_1.colors.muted('(no SQL changes)')}`);
                }
            }
            console.log('');
            if (pushComparison.hasChanges) {
                console.log(`${colors_1.colors.muted('Run')} ${colors_1.colors.cyan('relq push')} ${colors_1.colors.muted('to apply local changes to database.')}`);
            }
            if (pullComparison.hasChanges) {
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
