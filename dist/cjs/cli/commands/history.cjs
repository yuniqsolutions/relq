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
exports.historyCommand = historyCommand;
const fs = __importStar(require("fs"));
const config_loader_1 = require("../utils/config-loader.cjs");
const env_loader_1 = require("../utils/env-loader.cjs");
const cli_utils_1 = require("../utils/cli-utils.cjs");
const pool_manager_1 = require("../utils/pool-manager.cjs");
async function historyCommand(context) {
    const { config, flags } = context;
    if (!config) {
        (0, cli_utils_1.fatal)('No configuration found', `run ${cli_utils_1.colors.cyan('relq init')} to create a configuration file`);
    }
    await (0, config_loader_1.requireValidConfig)(config, { calledFrom: 'history' });
    const connection = config.connection;
    const migrationsDir = config.migrations?.directory || './migrations';
    const tableName = config.migrations?.tableName || '_relq_migrations';
    const limit = parseInt(flags['n']) || 20;
    console.log('Migration History');
    console.log(`Database: ${(0, env_loader_1.getConnectionDescription)(connection)}`);
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
                console.log(`${cli_utils_1.colors.yellow}○ ${record.name}${cli_utils_1.colors.reset} ${cli_utils_1.colors.dim}(pending)${cli_utils_1.colors.reset}`);
            }
            else {
                const date = record.appliedAt ? formatDate(record.appliedAt) : '';
                console.log(`${cli_utils_1.colors.green}● ${record.name}${cli_utils_1.colors.reset} ${cli_utils_1.colors.dim}${date}${cli_utils_1.colors.reset}`);
            }
        }
        if (history.length > limit) {
            console.log('');
            console.log(`${cli_utils_1.colors.dim}Use "relq history -n ${history.length}" to see all.${cli_utils_1.colors.reset}`);
        }
    }
    catch (error) {
        if (error?.code === '42P01') {
            console.log(`${cli_utils_1.colors.yellow}No migration table found.${cli_utils_1.colors.reset}`);
            console.log(`Run "${cli_utils_1.colors.cyan}relq push${cli_utils_1.colors.reset}" to initialize.`);
            console.log('');
            const files = getMigrationFiles(migrationsDir);
            if (files.length > 0) {
                console.log(`${cli_utils_1.colors.bold}Pending migrations:${cli_utils_1.colors.reset}`);
                for (const file of files.slice(0, limit)) {
                    console.log(`  ${cli_utils_1.colors.yellow}○ ${file}${cli_utils_1.colors.reset}`);
                }
            }
            else {
                console.log(`${cli_utils_1.colors.dim}No migration files found.${cli_utils_1.colors.reset}`);
            }
            return;
        }
        (0, cli_utils_1.fatal)('Failed to load history', error instanceof Error ? error.message : String(error));
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
    return (0, pool_manager_1.withPool)(connection, async (pool) => {
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
