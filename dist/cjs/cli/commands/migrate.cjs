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
exports.migrateCommand = migrateCommand;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const config_loader_1 = require("../utils/config-loader.cjs");
const env_loader_1 = require("../utils/env-loader.cjs");
const cli_utils_1 = require("../utils/cli-utils.cjs");
const config_1 = require("../../config/config.cjs");
function parseMigration(content) {
    const upMatch = content.match(/--\s*UP\s*\n([\s\S]*?)(?=--\s*DOWN|$)/i);
    const downMatch = content.match(/--\s*DOWN\s*\n([\s\S]*?)$/i);
    return {
        up: upMatch?.[1]?.trim() || '',
        down: downMatch?.[1]?.trim() || '',
    };
}
async function migrateCommand(context) {
    const { config, flags } = context;
    if (!config) {
        (0, cli_utils_1.fatal)('No configuration found', `run ${cli_utils_1.colors.cyan('relq init')} to create a configuration file`);
        return;
    }
    await (0, config_loader_1.requireValidConfig)(config, { calledFrom: 'migrate' });
    const dryRun = flags['dry-run'] === true;
    const force = flags['force'] === true;
    const connection = config.connection;
    const migrationsDir = config.migrations?.directory || './migrations';
    const tableName = config.migrations?.tableName || '_relq_migrations';
    console.log('Running migrations...');
    console.log(`   Connection: ${(0, env_loader_1.getConnectionDescription)(connection)}`);
    console.log(`   Migrations: ${migrationsDir}\n`);
    try {
        const { Pool } = await Promise.resolve().then(() => __importStar(require("../../addon/pg/index.cjs")));
        const poolConfig = await (0, config_1.buildPoolConfig)(connection);
        const pool = new Pool(poolConfig);
        const isDsql = (0, config_1.isAwsDsqlConfig)(connection);
        try {
            const idColumn = isDsql
                ? 'id UUID PRIMARY KEY DEFAULT gen_random_uuid()'
                : 'id SERIAL PRIMARY KEY';
            await pool.query(`
                CREATE TABLE IF NOT EXISTS "${tableName}" (
                    ${idColumn},
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
                if (!await (0, cli_utils_1.confirm)('Apply these migrations?', false)) {
                    console.log('Cancelled.');
                    return;
                }
            }
            for (const file of pending) {
                const filePath = path.join(migrationsDir, file);
                const content = fs.readFileSync(filePath, 'utf-8');
                const { up } = parseMigration(content);
                if (!up) {
                    (0, cli_utils_1.warning)(`Skipping ${file} (no UP section)`);
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
        (0, cli_utils_1.fatal)('Migration failed', error instanceof Error ? error.message : String(error));
    }
}
