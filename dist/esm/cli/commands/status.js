import { defineCommand } from 'citty';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { buildContext } from "../utils/context.js";
import { colors } from "../utils/colors.js";
import { fatal } from "../utils/ui.js";
import { getSchemaPath } from "../utils/config-loader.js";
import { detectDialect } from "../utils/dialect-router.js";
import { getConnectionDescription } from "../utils/env-loader.js";
import { loadRelqignore } from "../utils/relqignore.js";
import { isInitialized, loadSnapshot } from "../utils/repo-manager.js";
export default defineCommand({
    meta: { name: 'status', description: 'Show current schema state' },
    args: {
        json: { type: 'boolean', description: 'Output as JSON' },
        verbose: { type: 'boolean', alias: 'v', description: 'Show detailed information' },
    },
    async run({ args }) {
        const { config, projectRoot } = await buildContext({ requireConfig: false });
        const connection = config?.connection;
        const outputJson = args.json;
        const verbose = args.verbose;
        console.log('');
        if (!isInitialized(projectRoot)) {
            if (outputJson) {
                console.log(JSON.stringify({ initialized: false }));
                return;
            }
            fatal('not a relq repository', `Run ${colors.cyan('relq init')} to initialize.`);
        }
        const dialect = config ? detectDialect(config) : 'unknown';
        const snapshot = loadSnapshot(projectRoot);
        const schemaPath = config ? path.resolve(projectRoot, getSchemaPath(config)) : null;
        const schemaExists = schemaPath ? fs.existsSync(schemaPath) : false;
        const ignorePatterns = loadRelqignore(projectRoot);
        const relqignorePath = path.join(projectRoot, '.relqignore');
        const hasRelqignore = fs.existsSync(relqignorePath);
        const migrationsDir = config?.migrations?.directory || './migrations';
        const migrationsPath = path.resolve(projectRoot, migrationsDir);
        const hasMigrations = fs.existsSync(migrationsPath);
        let totalMigrations = 0;
        if (hasMigrations) {
            totalMigrations = fs.readdirSync(migrationsPath)
                .filter(f => f.endsWith('.sql'))
                .length;
        }
        if (outputJson) {
            console.log(JSON.stringify({
                initialized: true,
                dialect,
                connection: connection ? getConnectionDescription(connection) : null,
                schema: { path: schemaPath, exists: schemaExists },
                snapshot: snapshot ? {
                    tables: snapshot.tables.length,
                    enums: snapshot.enums.length,
                    domains: snapshot.domains.length,
                    compositeTypes: snapshot.compositeTypes.length,
                    sequences: snapshot.sequences.length,
                    functions: snapshot.functions?.length || 0,
                    triggers: snapshot.triggers?.length || 0,
                    extensions: snapshot.extensions?.length || 0,
                } : null,
                migrations: { directory: migrationsDir, total: totalMigrations },
                relqignore: hasRelqignore ? ignorePatterns.length : 0,
            }, null, 2));
            return;
        }
        console.log(`${colors.bold('Relq Status')}`);
        console.log('───────────────────────────────────');
        console.log(`Dialect:     ${colors.cyan(dialect)}`);
        if (connection) {
            console.log(`Connection:  ${colors.cyan(getConnectionDescription(connection))}`);
        }
        else {
            console.log(`Connection:  ${colors.muted('not configured')}`);
        }
        console.log('');
        if (snapshot) {
            console.log(`${colors.bold('Schema:')}`);
            console.log(`  Tables:         ${snapshot.tables.length}`);
            console.log(`  Enums:          ${snapshot.enums.length}`);
            if (snapshot.domains.length > 0)
                console.log(`  Domains:        ${snapshot.domains.length}`);
            if (snapshot.compositeTypes.length > 0)
                console.log(`  Composite:      ${snapshot.compositeTypes.length}`);
            if (snapshot.sequences.length > 0)
                console.log(`  Sequences:      ${snapshot.sequences.length}`);
            if ((snapshot.functions?.length || 0) > 0)
                console.log(`  Functions:      ${snapshot.functions.length}`);
            if ((snapshot.triggers?.length || 0) > 0)
                console.log(`  Triggers:       ${snapshot.triggers.length}`);
            if ((snapshot.extensions?.length || 0) > 0)
                console.log(`  Extensions:     ${snapshot.extensions.length}`);
        }
        else {
            console.log(`${colors.muted('No snapshot.')}`);
            console.log(`Run ${colors.cyan('relq pull')} to sync with database.`);
        }
        if (totalMigrations > 0) {
            console.log('');
            console.log(`${colors.bold('Migrations:')}`);
            console.log(`  Total:          ${totalMigrations}`);
        }
        console.log('');
        if (schemaExists && schemaPath) {
            const stat = fs.statSync(schemaPath);
            const sizeKB = (stat.size / 1024).toFixed(1);
            console.log(`Schema file:  ${colors.cyan(schemaPath)} ${colors.muted(`(${sizeKB} KB)`)}`);
        }
        else if (schemaPath) {
            console.log(`Schema file:  ${colors.muted('not generated yet')}`);
        }
        if (hasRelqignore) {
            const userPatterns = ignorePatterns.filter(p => !p.raw.startsWith('_relq_') &&
                !p.raw.startsWith('pg_') &&
                !p.raw.startsWith('_temp_') &&
                !p.raw.startsWith('tmp_'));
            if (userPatterns.length > 0) {
                console.log(`Ignore:       ${userPatterns.length} pattern(s) in .relqignore`);
            }
        }
        if (verbose && snapshot && snapshot.tables.length > 0) {
            console.log('');
            console.log(`${colors.bold('Tables:')}`);
            for (const table of snapshot.tables.slice(0, 20)) {
                const colCount = table.columns.length;
                const idxCount = table.indexes.length;
                const partInfo = table.isPartitioned ? ` ${colors.muted('(partitioned)')}` : '';
                console.log(`  ${colors.green('•')} ${table.name} ${colors.muted(`(${colCount} cols, ${idxCount} idx)`)}${partInfo}`);
            }
            if (snapshot.tables.length > 20) {
                console.log(`  ${colors.muted(`... and ${snapshot.tables.length - 20} more`)}`);
            }
        }
        console.log('');
        if (!snapshot) {
            console.log(`${colors.muted('Run')} ${colors.cyan('relq pull')} ${colors.muted('to sync with database.')}`);
        }
        else {
            console.log(`${colors.muted('Run')} ${colors.cyan('relq diff')} ${colors.muted('to compare with database.')}`);
            console.log(`${colors.muted('Run')} ${colors.cyan('relq push')} ${colors.muted('to push local changes.')}`);
        }
        console.log('');
    },
});
