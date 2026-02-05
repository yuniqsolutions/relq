import { defineCommand } from 'citty';
import * as p from '@clack/prompts';
import { buildContext } from "../utils/context.js";
import { colors } from "../utils/colors.js";
import { fatal, formatError } from "../utils/ui.js";
import { requireValidConfig } from "../utils/config-loader.js";
import { dialectIntrospect } from "../utils/dialect-introspect.js";
import { getConnectionDescription } from "../utils/env-loader.js";
import { isInitialized } from "../utils/repo-manager.js";
import { loadSnapshot, snapshotToDatabaseSchema } from "../utils/snapshot-manager.js";
import { diffSchemas, filterDiff } from "../utils/schema-diff.js";
import { normalizeSchema } from "../utils/schema-hash.js";
import { generateMigrationFile } from "../utils/migration-generator.js";
import { loadRelqignore } from "../utils/relqignore.js";
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
        const snapshotPath = config.sync?.snapshot || '.relq/snapshot.json';
        const snapshot = loadSnapshot(snapshotPath);
        if (!snapshot) {
            console.log(`${colors.yellow('No local snapshot.')}`);
            console.log(`${colors.muted('Run')} ${colors.cyan('relq pull')} ${colors.muted('first.')}`);
            console.log('');
            return;
        }
        const ignorePatterns = loadRelqignore(projectRoot);
        const spin = p.spinner();
        try {
            spin.start(`Connecting to ${getConnectionDescription(connection)}...`);
            const dbSchema = await dialectIntrospect(config, {
                includeFunctions,
                includeTriggers,
            });
            spin.stop(`Connected — ${dbSchema.tables.length} tables in database`);
            const localSchema = snapshotToDatabaseSchema(snapshot);
            const rawPatterns = ignorePatterns.map(pat => pat.raw);
            const pushDiff = diffSchemas(normalizeSchema(dbSchema), normalizeSchema(localSchema));
            const filteredPushDiff = filterDiff(pushDiff, rawPatterns);
            const pullDiff = diffSchemas(normalizeSchema(localSchema), normalizeSchema(dbSchema));
            const filteredPullDiff = filterDiff(pullDiff, rawPatterns);
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
                console.log(`${colors.green('Local and database are in sync.')}`);
                console.log('');
                return;
            }
            if (filteredPushDiff.hasChanges) {
                const s = filteredPushDiff.summary;
                console.log('');
                console.log(`${colors.bold('Local changes')} ${colors.muted('(push to apply)')}`);
                console.log('');
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
            }
            if (filteredPullDiff.hasChanges) {
                const s = filteredPullDiff.summary;
                console.log('');
                console.log(`${colors.bold('Database drift')} ${colors.muted('(pull to sync)')}`);
                console.log('');
                if (s.tablesAdded > 0)
                    console.log(`   ${colors.green('+')} ${s.tablesAdded} table(s) in database only`);
                if (s.tablesRemoved > 0)
                    console.log(`   ${colors.red('-')} ${s.tablesRemoved} table(s) in local only`);
                if (s.tablesModified > 0)
                    console.log(`   ${colors.yellow('~')} ${s.tablesModified} table(s) differ`);
                if (s.columnsAdded > 0)
                    console.log(`   ${colors.green('+')} ${s.columnsAdded} column(s) in database only`);
                if (s.columnsRemoved > 0)
                    console.log(`   ${colors.red('-')} ${s.columnsRemoved} column(s) in local only`);
                if (s.columnsModified > 0)
                    console.log(`   ${colors.yellow('~')} ${s.columnsModified} column(s) differ`);
            }
            if (args.sql && filteredPushDiff.hasChanges) {
                console.log('');
                console.log(`${colors.bold('SQL Preview')} ${colors.muted('(what push would execute)')}`);
                console.log('');
                const migration = generateMigrationFile(filteredPushDiff, 'diff-preview', {
                    includeDown: false,
                    includeComments: false,
                });
                if (migration.content.trim()) {
                    const statements = migration.content.split(';').filter(s => s.trim());
                    for (const stmt of statements.slice(0, 20)) {
                        console.log(`   ${colors.cyan(stmt.trim())};`);
                    }
                    if (statements.length > 20) {
                        console.log(`   ${colors.muted(`... and ${statements.length - 20} more statements`)}`);
                    }
                }
                else {
                    console.log(`   ${colors.muted('(no SQL changes)')}`);
                }
            }
            console.log('');
            if (filteredPushDiff.hasChanges) {
                console.log(`${colors.muted('Run')} ${colors.cyan('relq push')} ${colors.muted('to apply local changes to database.')}`);
            }
            if (filteredPullDiff.hasChanges) {
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
