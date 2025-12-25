import * as fs from 'fs';
import * as path from 'path';
import { requireValidConfig } from "../utils/config-loader.js";
import { getConnectionDescription } from "../utils/env-loader.js";
import { colors, confirm, fatal, warning } from "../utils/cli-utils.js";
function parseMigration(content) {
    const upMatch = content.match(/--\s*UP\s*\n([\s\S]*?)(?=--\s*DOWN|$)/i);
    const downMatch = content.match(/--\s*DOWN\s*\n([\s\S]*?)$/i);
    return {
        up: upMatch?.[1]?.trim() || '',
        down: downMatch?.[1]?.trim() || '',
    };
}
export async function rollbackCommand(context) {
    const { config, args, flags } = context;
    if (!config) {
        fatal('No configuration found', `run ${colors.cyan('relq init')} to create a configuration file`);
        return;
    }
    await requireValidConfig(config, { calledFrom: 'rollback' });
    const connection = config.connection;
    const migrationsDir = config.migrations?.directory || './migrations';
    const tableName = config.migrations?.tableName || '_relq_migrations';
    const count = parseInt(args[0]) || 1;
    const dryRun = flags['dry-run'] === true;
    const force = flags['force'] === true;
    console.log(`Rolling back ${count} migration(s)...`);
    console.log(`   Connection: ${getConnectionDescription(connection)}`);
    console.log('');
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
            const result = await pool.query(`
                SELECT name FROM "${tableName}" 
                ORDER BY id DESC 
                LIMIT $1;
            `, [count]);
            if (result.rows.length === 0) {
                console.log('No migrations to rollback.');
                return;
            }
            const toRollback = result.rows.map(r => r.name);
            console.log('Migrations to rollback:');
            for (const name of toRollback) {
                console.log(`  - ${name}`);
            }
            console.log('');
            if (!force && !dryRun) {
                const proceed = await confirm(`${colors.red('This will undo ' + toRollback.length + ' migration(s). Continue?')}`, false);
                if (!proceed) {
                    console.log('Cancelled.');
                    return;
                }
            }
            for (const name of toRollback) {
                const filePath = path.join(migrationsDir, name);
                if (!fs.existsSync(filePath)) {
                    warning(`Migration file not found: ${name}`);
                    continue;
                }
                const content = fs.readFileSync(filePath, 'utf-8');
                const { down } = parseMigration(content);
                if (!down) {
                    warning(`No DOWN section in: ${name}`);
                    continue;
                }
                if (dryRun) {
                    console.log(`[dry-run] Would rollback: ${name}`);
                    console.log(down);
                    console.log('');
                }
                else {
                    console.log(`Rolling back: ${name}...`);
                    const client = await pool.connect();
                    try {
                        await client.query('BEGIN');
                        await client.query(down);
                        await client.query(`DELETE FROM "${tableName}" WHERE name = $1`, [name]);
                        await client.query('COMMIT');
                        console.log('   Rolled back');
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
                console.log('');
                console.log(`Rolled back ${toRollback.length} migration(s).`);
            }
        }
        finally {
            await pool.end();
        }
    }
    catch (error) {
        fatal('Rollback failed', error instanceof Error ? error.message : String(error));
    }
}
