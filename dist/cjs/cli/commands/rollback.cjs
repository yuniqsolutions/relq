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
exports.rollbackCommand = rollbackCommand;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const config_loader_1 = require("../utils/config-loader.cjs");
const env_loader_1 = require("../utils/env-loader.cjs");
const cli_utils_1 = require("../utils/cli-utils.cjs");
function parseMigration(content) {
    const upMatch = content.match(/--\s*UP\s*\n([\s\S]*?)(?=--\s*DOWN|$)/i);
    const downMatch = content.match(/--\s*DOWN\s*\n([\s\S]*?)$/i);
    return {
        up: upMatch?.[1]?.trim() || '',
        down: downMatch?.[1]?.trim() || '',
    };
}
async function rollbackCommand(context) {
    const { config, args, flags } = context;
    if (!config) {
        (0, cli_utils_1.fatal)('No configuration found', `run ${cli_utils_1.colors.cyan('relq init')} to create a configuration file`);
        return;
    }
    await (0, config_loader_1.requireValidConfig)(config, { calledFrom: 'rollback' });
    const connection = config.connection;
    const migrationsDir = config.migrations?.directory || './migrations';
    const tableName = config.migrations?.tableName || '_relq_migrations';
    const count = parseInt(args[0]) || 1;
    const dryRun = flags['dry-run'] === true;
    const force = flags['force'] === true;
    console.log(`Rolling back ${count} migration(s)...`);
    console.log(`   Connection: ${(0, env_loader_1.getConnectionDescription)(connection)}`);
    console.log('');
    try {
        const { Pool } = await Promise.resolve().then(() => __importStar(require("../../addon/pg/index.cjs")));
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
                const proceed = await (0, cli_utils_1.confirm)(`${cli_utils_1.colors.red('This will undo ' + toRollback.length + ' migration(s). Continue?')}`, false);
                if (!proceed) {
                    console.log('Cancelled.');
                    return;
                }
            }
            for (const name of toRollback) {
                const filePath = path.join(migrationsDir, name);
                if (!fs.existsSync(filePath)) {
                    (0, cli_utils_1.warning)(`Migration file not found: ${name}`);
                    continue;
                }
                const content = fs.readFileSync(filePath, 'utf-8');
                const { down } = parseMigration(content);
                if (!down) {
                    (0, cli_utils_1.warning)(`No DOWN section in: ${name}`);
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
        (0, cli_utils_1.fatal)('Rollback failed', error instanceof Error ? error.message : String(error));
    }
}
