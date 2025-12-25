import * as fs from 'fs';
import { requireValidConfig } from "../utils/config-loader.js";
import { getConnectionDescription } from "../utils/env-loader.js";
import { colors, fatal } from "../utils/cli-utils.js";
import { withPool } from "../utils/pool-manager.js";
export async function historyCommand(context) {
    const { config, flags } = context;
    if (!config) {
        fatal('No configuration found', `run ${colors.cyan('relq init')} to create a configuration file`);
    }
    await requireValidConfig(config, { calledFrom: 'history' });
    const connection = config.connection;
    const migrationsDir = config.migrations?.directory || './migrations';
    const tableName = config.migrations?.tableName || '_relq_migrations';
    const limit = parseInt(flags['n']) || 20;
    console.log('Migration History');
    console.log(`Database: ${getConnectionDescription(connection)}`);
    console.log('');
    try {
        const migrationFiles = getMigrationFiles(migrationsDir);
        const appliedMigrations = await getAppliedMigrations(connection, tableName);
        const history = [];
        for (const file of migrationFiles) {
            const applied = appliedMigrations.find(m => m.name === file);
            history.push({
                name: file,
                appliedAt: applied?.appliedAt || null,
                pending: !applied,
            });
        }
        history.sort((a, b) => b.name.localeCompare(a.name));
        const toShow = history.slice(0, limit);
        const pendingCount = history.filter(h => h.pending).length;
        const appliedCount = history.filter(h => !h.pending).length;
        console.log(`Showing ${toShow.length} of ${history.length} migrations`);
        console.log(`${appliedCount} applied, ${pendingCount} pending`);
        console.log('');
        for (const record of toShow) {
            if (record.pending) {
                console.log(`${colors.yellow}○ ${record.name}${colors.reset} ${colors.dim}(pending)${colors.reset}`);
            }
            else {
                const date = record.appliedAt ? formatDate(record.appliedAt) : '';
                console.log(`${colors.green}● ${record.name}${colors.reset} ${colors.dim}${date}${colors.reset}`);
            }
        }
        if (history.length > limit) {
            console.log('');
            console.log(`${colors.dim}Use "relq history -n ${history.length}" to see all.${colors.reset}`);
        }
    }
    catch (error) {
        if (error?.code === '42P01') {
            console.log(`${colors.yellow}No migration table found.${colors.reset}`);
            console.log(`Run "${colors.cyan}relq push${colors.reset}" to initialize.`);
            console.log('');
            const files = getMigrationFiles(migrationsDir);
            if (files.length > 0) {
                console.log(`${colors.bold}Pending migrations:${colors.reset}`);
                for (const file of files.slice(0, limit)) {
                    console.log(`  ${colors.yellow}○ ${file}${colors.reset}`);
                }
            }
            else {
                console.log(`${colors.dim}No migration files found.${colors.reset}`);
            }
            return;
        }
        fatal('Failed to load history', error instanceof Error ? error.message : String(error));
    }
}
function getMigrationFiles(migrationsDir) {
    if (!fs.existsSync(migrationsDir)) {
        return [];
    }
    return fs.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort();
}
async function getAppliedMigrations(connection, tableName) {
    return withPool(connection, async (pool) => {
        const result = await pool.query(`
            SELECT name, applied_at 
            FROM "${tableName}" 
            ORDER BY id DESC;
        `);
        return result.rows.map((r) => ({
            name: r.name,
            appliedAt: new Date(r.applied_at),
        }));
    });
}
function formatDate(date) {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0)
        return 'today';
    if (days === 1)
        return 'yesterday';
    if (days < 7)
        return `${days} days ago`;
    if (days < 30)
        return `${Math.floor(days / 7)} weeks ago`;
    if (days < 365)
        return `${Math.floor(days / 30)} months ago`;
    return date.toLocaleDateString();
}
