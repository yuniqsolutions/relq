import * as fs from 'fs';
import * as path from 'path';
import { requireValidConfig } from "../utils/config-loader.js";
import { getConnectionDescription } from "../utils/env-loader.js";
import { confirm, fatal, colors, warning } from "../utils/cli-utils.js";
function parseMigration(content) {
    const upMatch = content.match(/--\s*UP\s*\n([\s\S]*?)(?=--\s*DOWN|$)/i);
    const downMatch = content.match(/--\s*DOWN\s*\n([\s\S]*?)$/i);
    return {
        up: upMatch?.[1]?.trim() || '',
        down: downMatch?.[1]?.trim() || '',
    };
}
export async function migrateCommand(context) {
    const { config, flags } = context;
    if (!config) {
        fatal('No configuration found', `run ${colors.cyan('relq init')} to create a configuration file`);
        return;
    }
    await requireValidConfig(config, { calledFrom: 'migrate' });
    const dryRun = flags['dry-run'] === true;
    const force = flags['force'] === true;
    const connection = config.connection;
    const migrationsDir = config.migrations?.directory || './migrations';
    const tableName = config.migrations?.tableName || '_relq_migrations';
    console.log('Running migrations...');
    console.log(`   Connection: ${getConnectionDescription(connection)}`);
    console.log(`   Migrations: ${migrationsDir}\n`);
    try {
        const { Pool } = await import("../../addon/pg/index.js");
        const pool = new Pool({
            host: connection.host,
            port: connection.port || 5432,
            database: connection.database,
            user: connection.user,
            password: connection.password,
            connectionString: connection.url,
        });
        try {
            await pool.query(`
                CREATE TABLE IF NOT EXISTS "${tableName}" (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL UNIQUE,
                    applied_at TIMESTAMPTZ DEFAULT NOW()
                );
            `);
            const appliedResult = await pool.query(`
                SELECT name FROM "${tableName}" ORDER BY id;
            `);
            const appliedMigrations = new Set(appliedResult.rows.map(r => r.name));
            if (!fs.existsSync(migrationsDir)) {
                console.log('No migrations directory found.');
                return;
            }
            const migrationFiles = fs.readdirSync(migrationsDir)
                .filter(f => f.endsWith('.sql'))
                .sort();
            const pending = migrationFiles.filter(f => !appliedMigrations.has(f));
            if (pending.length === 0) {
                console.log('No pending migrations.');
                return;
            }
            console.log(`Pending migrations (${pending.length}):`);
            for (const file of pending) {
                console.log(`   • ${file}`);
            }
            console.log('');
            if (!force && !dryRun) {
                if (!await confirm('Apply these migrations?', false)) {
                    console.log('Cancelled.');
                    return;
                }
            }
            for (const file of pending) {
                const filePath = path.join(migrationsDir, file);
                const content = fs.readFileSync(filePath, 'utf-8');
                const { up } = parseMigration(content);
                if (!up) {
                    warning(`Skipping ${file} (no UP section)`);
                    continue;
                }
                if (dryRun) {
                    console.log(`Would apply: ${file}`);
                    console.log('---');
                    console.log(up);
                    console.log('---\n');
                }
                else {
                    console.log(`Applying: ${file}...`);
                    const client = await pool.connect();
                    try {
                        await client.query('BEGIN');
                        await client.query(up);
                        await client.query(`INSERT INTO "${tableName}" (name) VALUES ($1)`, [file]);
                        await client.query('COMMIT');
                        console.log('   Applied');
                    }
                    catch (error) {
                        await client.query('ROLLBACK');
                        throw error;
                    }
                    finally {
                        client.release();
                    }
                }
            }
            if (!dryRun) {
                console.log(`\nApplied ${pending.length} migration(s).`);
            }
        }
        finally {
            await pool.end();
        }
    }
    catch (error) {
        fatal('Migration failed', error instanceof Error ? error.message : String(error));
    }
}
