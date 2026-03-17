import { defineCommand } from 'citty';
import * as p from '@clack/prompts';
import { buildContext } from "../utils/context.js";
import { colors } from "../utils/colors.js";
import { fatal, formatError } from "../utils/ui.js";
import { requireValidConfig, getSchemaPath } from "../utils/config-loader.js";
import { dialectIntrospect } from "../utils/dialect-introspect.js";
import { getConnectionDescription } from "../utils/env-loader.js";
import { isInitialized } from "../utils/repo-manager.js";
import { loadSnapshot } from "../utils/snapshot-manager.js";
import { compareSchemas } from "../utils/schema-diff.js";
import { generateMigrationFromComparison, formatMigrationStatements } from "../utils/migration-generator.js";
import { loadRelqignore } from "../utils/relqignore.js";
import { loadSchemaFile } from "../utils/schema-loader.js";
import { introspectedToParsedSchema } from "../utils/ast-transformer.js";
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
        console.log(`   ${colors.green('+')} ${added} ${label} ${pushMode ? 'to create' : 'in database only'}`);
    if (removed > 0)
        console.log(`   ${colors.red('-')} ${removed} ${label} ${pushMode ? 'to drop' : 'in local only'}`);
    if (modified > 0)
        console.log(`   ${colors.yellow('~')} ${modified} ${label} ${pushMode ? 'modified' : 'differ'}`);
    if (renamed > 0)
        console.log(`   ${colors.cyan('→')} ${renamed} ${label} renamed`);
}
export default defineCommand({
    meta: { name: 'diff', description: 'Show schema differences' },
    args: {
        sql: { type: 'boolean', description: 'Show SQL statements' },
        json: { type: 'boolean', description: 'Output as JSON' },
    },
    async run({ args }) {
        const { config, projectRoot } = await buildContext();
        console.log('');
        if (!isInitialized(projectRoot)) {
            fatal('not a relq repository', `Run ${colors.cyan('relq init')} to initialize.`);
        }
        await requireValidConfig(config, { calledFrom: 'diff' });
        const connection = config.connection;
        const includeFunctions = config.includeFunctions ?? false;
        const includeTriggers = config.includeTriggers ?? false;
        const schemaPath = getSchemaPath(config);
        const snapshotPath = config.sync?.snapshot || '.relq/snapshot.json';
        const ignorePatterns = loadRelqignore(projectRoot);
        const rawPatterns = ignorePatterns.map(pat => pat.raw);
        const spin = p.spinner();
        try {
            spin.start('Loading local schema file...');
            const { ast: desiredAST } = await loadSchemaFile(schemaPath, projectRoot, config);
            spin.stop('Schema file loaded');
            spin.start(`Connecting to ${getConnectionDescription(connection)}...`);
            const dbSchema = await dialectIntrospect(config, {
                includeFunctions,
                includeTriggers,
            });
            spin.stop(`Connected — ${dbSchema.tables.length} tables in database`);
            spin.start('Analyzing database schema...');
            const dbParsedSchema = await introspectedToParsedSchema(dbSchema);
            const snapshot = loadSnapshot(snapshotPath);
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
            const pushComparison = compareSchemas(dbParsedSchema, desiredAST);
            applyIgnorePatterns(pushComparison, rawPatterns);
            const pullComparison = compareSchemas(desiredAST, dbParsedSchema);
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
                console.log(`${colors.green('Local and database are in sync.')}`);
                console.log('');
                return;
            }
            if (pushComparison.hasChanges) {
                const c = countComparison(pushComparison);
                console.log('');
                console.log(`${colors.bold('Local changes')} ${colors.muted('(push to apply)')}`);
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
                console.log(`${colors.bold('Database drift')} ${colors.muted('(pull to sync)')}`);
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
                console.log(`${colors.bold('SQL Preview')} ${colors.muted('(what push would execute)')}`);
                console.log('');
                const migration = generateMigrationFromComparison(pushComparison);
                const formatted = formatMigrationStatements(migration.up);
                if (formatted.length > 0) {
                    for (const line of formatted.slice(0, 30)) {
                        console.log(`   ${line.startsWith('--') ? colors.muted(line) : colors.cyan(line)}`);
                    }
                    const stmtCount = formatted.filter(l => l.trim() && !l.trim().startsWith('--')).length;
                    const totalStmts = migration.up.length;
                    if (totalStmts > 20) {
                        console.log(`   ${colors.muted(`... and ${totalStmts - 20} more statements`)}`);
                    }
                }
                else {
                    console.log(`   ${colors.muted('(no SQL changes)')}`);
                }
            }
            console.log('');
            if (pushComparison.hasChanges) {
                console.log(`${colors.muted('Run')} ${colors.cyan('relq push')} ${colors.muted('to apply local changes to database.')}`);
            }
            if (pullComparison.hasChanges) {
                console.log(`${colors.muted('Run')} ${colors.cyan('relq pull')} ${colors.muted('to sync local with database.')}`);
            }
            console.log('');
        }
        catch (error) {
            spin.error('Diff failed');
            fatal(formatError(error));
        }
    },
});
