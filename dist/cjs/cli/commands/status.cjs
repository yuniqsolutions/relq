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
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const context_1 = require("../utils/context.cjs");
const colors_1 = require("../utils/colors.cjs");
const ui_1 = require("../utils/ui.cjs");
const config_loader_1 = require("../utils/config-loader.cjs");
const dialect_router_1 = require("../utils/dialect-router.cjs");
const env_loader_1 = require("../utils/env-loader.cjs");
const relqignore_1 = require("../utils/relqignore.cjs");
const repo_manager_1 = require("../utils/repo-manager.cjs");
exports.default = (0, citty_1.defineCommand)({
    meta: { name: 'status', description: 'Show current schema state' },
    args: {
        json: { type: 'boolean', description: 'Output as JSON' },
        verbose: { type: 'boolean', alias: 'v', description: 'Show detailed information' },
    },
    async run({ args }) {
        const { config, projectRoot } = await (0, context_1.buildContext)({ requireConfig: false });
        const connection = config?.connection;
        const outputJson = args.json;
        const verbose = args.verbose;
        console.log('');
        if (!(0, repo_manager_1.isInitialized)(projectRoot)) {
            if (outputJson) {
                console.log(JSON.stringify({ initialized: false }));
                return;
            }
            (0, ui_1.fatal)('not a relq repository', `Run ${colors_1.colors.cyan('relq init')} to initialize.`);
        }
        const dialect = config ? (0, dialect_router_1.detectDialect)(config) : 'unknown';
        const snapshot = (0, repo_manager_1.loadSnapshot)(projectRoot);
        const schemaPath = config ? path.resolve(projectRoot, (0, config_loader_1.getSchemaPath)(config)) : null;
        const schemaExists = schemaPath ? fs.existsSync(schemaPath) : false;
        const ignorePatterns = (0, relqignore_1.loadRelqignore)(projectRoot);
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
                connection: connection ? (0, env_loader_1.getConnectionDescription)(connection) : null,
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
        console.log(`${colors_1.colors.bold('Relq Status')}`);
        console.log('───────────────────────────────────');
        console.log(`Dialect:     ${colors_1.colors.cyan(dialect)}`);
        if (connection) {
            console.log(`Connection:  ${colors_1.colors.cyan((0, env_loader_1.getConnectionDescription)(connection))}`);
        }
        else {
            console.log(`Connection:  ${colors_1.colors.muted('not configured')}`);
        }
        console.log('');
        if (snapshot) {
            console.log(`${colors_1.colors.bold('Schema:')}`);
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
            console.log(`${colors_1.colors.muted('No snapshot.')}`);
            console.log(`Run ${colors_1.colors.cyan('relq pull')} to sync with database.`);
        }
        if (totalMigrations > 0) {
            console.log('');
            console.log(`${colors_1.colors.bold('Migrations:')}`);
            console.log(`  Total:          ${totalMigrations}`);
        }
        console.log('');
        if (schemaExists && schemaPath) {
            const stat = fs.statSync(schemaPath);
            const sizeKB = (stat.size / 1024).toFixed(1);
            console.log(`Schema file:  ${colors_1.colors.cyan(schemaPath)} ${colors_1.colors.muted(`(${sizeKB} KB)`)}`);
        }
        else if (schemaPath) {
            console.log(`Schema file:  ${colors_1.colors.muted('not generated yet')}`);
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
            console.log(`${colors_1.colors.bold('Tables:')}`);
            for (const table of snapshot.tables.slice(0, 20)) {
                const colCount = table.columns.length;
                const idxCount = table.indexes.length;
                const partInfo = table.isPartitioned ? ` ${colors_1.colors.muted('(partitioned)')}` : '';
                console.log(`  ${colors_1.colors.green('•')} ${table.name} ${colors_1.colors.muted(`(${colCount} cols, ${idxCount} idx)`)}${partInfo}`);
            }
            if (snapshot.tables.length > 20) {
                console.log(`  ${colors_1.colors.muted(`... and ${snapshot.tables.length - 20} more`)}`);
            }
        }
        console.log('');
        if (!snapshot) {
            console.log(`${colors_1.colors.muted('Run')} ${colors_1.colors.cyan('relq pull')} ${colors_1.colors.muted('to sync with database.')}`);
        }
        else {
            console.log(`${colors_1.colors.muted('Run')} ${colors_1.colors.cyan('relq diff')} ${colors_1.colors.muted('to compare with database.')}`);
            console.log(`${colors_1.colors.muted('Run')} ${colors_1.colors.cyan('relq push')} ${colors_1.colors.muted('to push local changes.')}`);
        }
        console.log('');
    },
});
