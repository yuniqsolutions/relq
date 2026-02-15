"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformPgToSQLite = exports.hasSQLiteIncompatibilities = exports.formatSQLiteErrors = exports.validateSchemaForSQLite = exports.validateSqlForSQLite = exports.transformPgToMySQL = exports.hasMySQLIncompatibilities = exports.formatMySQLErrors = exports.validateSchemaForMySQL = exports.validateSqlForMySQL = exports.classifyTable = exports.filterSqlForNile = exports.hasNileIncompatibilities = exports.formatNileErrors = exports.validateSchemaForNile = exports.validateSqlForNile = exports.hasCrdbIncompatibilities = exports.formatCrdbErrors = exports.validateSchemaForCrdb = exports.validateSqlForCrdb = exports.hasDsqlIncompatibilities = exports.formatDsqlErrors = exports.validateSchemaForDsql = exports.validateSqlForDsql = exports.DIALECT_INFO = void 0;
exports.getDialectFamily = getDialectFamily;
exports.isPostgresDialect = isPostgresDialect;
exports.requiresTransform = requiresTransform;
exports.validateForDialect = validateForDialect;
exports.validateSchemaForDialect = validateSchemaForDialect;
exports.hasDialectIncompatibilities = hasDialectIncompatibilities;
exports.transformSqlForDialect = transformSqlForDialect;
exports.formatDialectErrors = formatDialectErrors;
exports.formatErrorList = formatErrorList;
exports.getSupportedDialects = getSupportedDialects;
exports.isValidDialect = isValidDialect;
exports.detectDialectFromConnectionString = detectDialectFromConnectionString;
const dsql_validator_1 = require("./dsql-validator.cjs");
const crdb_validator_1 = require("./crdb-validator.cjs");
const nile_validator_1 = require("./nile-validator.cjs");
const mysql_validator_1 = require("./mysql-validator.cjs");
const sqlite_validator_1 = require("./sqlite-validator.cjs");
exports.DIALECT_INFO = {
    postgres: {
        name: 'PostgreSQL',
        family: 'postgres',
        description: 'Native PostgreSQL - full feature support',
        docsUrl: 'https://www.postgresql.org/docs/',
        requiresTransform: false,
    },
    cockroachdb: {
        name: 'CockroachDB',
        family: 'postgres',
        description: 'PostgreSQL-compatible distributed database with some limitations',
        docsUrl: 'https://www.cockroachlabs.com/docs/',
        requiresTransform: false,
    },
    nile: {
        name: 'Nile',
        family: 'postgres',
        description: 'Multi-tenant PostgreSQL with tenant isolation',
        docsUrl: 'https://www.thenile.dev/docs/',
        requiresTransform: false,
    },
    dsql: {
        name: 'AWS Aurora DSQL',
        family: 'postgres',
        description: 'AWS serverless PostgreSQL-compatible distributed database',
        docsUrl: 'https://docs.aws.amazon.com/aurora-dsql/',
        requiresTransform: false,
    },
    mysql: {
        name: 'MySQL',
        family: 'mysql',
        description: 'MySQL database - requires syntax transformation from PostgreSQL',
        docsUrl: 'https://dev.mysql.com/doc/',
        requiresTransform: true,
    },
    mariadb: {
        name: 'MariaDB',
        family: 'mysql',
        description: 'MariaDB - MySQL fork with additional features',
        docsUrl: 'https://mariadb.com/kb/',
        requiresTransform: true,
    },
    planetscale: {
        name: 'PlanetScale',
        family: 'mysql',
        description: 'Vitess-based MySQL - no foreign keys',
        docsUrl: 'https://planetscale.com/docs/',
        requiresTransform: true,
    },
    sqlite: {
        name: 'SQLite',
        family: 'sqlite',
        description: 'Embedded SQLite database - requires syntax transformation',
        docsUrl: 'https://www.sqlite.org/docs.html',
        requiresTransform: true,
    },
    turso: {
        name: 'Turso',
        family: 'sqlite',
        description: 'SQLite-over-HTTP using libSQL',
        docsUrl: 'https://docs.turso.tech/',
        requiresTransform: true,
    },
    xata: {
        name: 'Xata',
        family: 'xata',
        description: 'Xata serverless database with built-in search',
        docsUrl: 'https://xata.io/docs/',
        requiresTransform: true,
    },
};
function getDialectFamily(dialect) {
    return exports.DIALECT_INFO[dialect].family;
}
function isPostgresDialect(dialect) {
    return exports.DIALECT_INFO[dialect].family === 'postgres';
}
function requiresTransform(dialect) {
    return exports.DIALECT_INFO[dialect].requiresTransform;
}
function validateForDialect(sql, dialect, options = {}) {
    const { location, transform = true } = options;
    switch (dialect) {
        case 'postgres':
            return {
                valid: true,
                dialect,
                errors: [],
                warnings: [],
                canTransform: false,
            };
        case 'cockroachdb': {
            const errors = (0, crdb_validator_1.validateSqlForCrdb)(sql, location);
            const result = {
                valid: errors.length === 0,
                dialect,
                errors: errors.map(mapToGenericError),
                warnings: [],
                canTransform: false,
            };
            return result;
        }
        case 'nile': {
            const errors = (0, nile_validator_1.validateSqlForNile)(sql, location);
            const filterResult = transform ? (0, nile_validator_1.filterSqlForNile)(sql) : undefined;
            const transformedSql = filterResult?.filtered;
            const result = {
                valid: errors.length === 0,
                dialect,
                errors: errors.map(mapToGenericError),
                warnings: [],
                transformedSql: transformedSql !== sql ? transformedSql : undefined,
                canTransform: transformedSql !== undefined && transformedSql !== sql,
            };
            return result;
        }
        case 'dsql': {
            const errors = (0, dsql_validator_1.validateSqlForDsql)(sql, location);
            const result = {
                valid: errors.length === 0,
                dialect,
                errors: errors.map(mapToGenericError),
                warnings: [],
                canTransform: false,
            };
            return result;
        }
        case 'mysql':
        case 'mariadb':
        case 'planetscale': {
            const mysqlDialect = dialect;
            const errors = (0, mysql_validator_1.validateSqlForMySQL)(sql, mysqlDialect, location);
            const transformResult = transform ? (0, mysql_validator_1.transformPgToMySQL)(sql) : undefined;
            const transformedSql = transformResult?.sql;
            const result = {
                valid: errors.length === 0,
                dialect,
                errors: errors.map(mapToGenericError),
                warnings: [],
                transformedSql,
                canTransform: true,
            };
            return result;
        }
        case 'sqlite':
        case 'turso': {
            const sqliteDialect = dialect;
            const errors = (0, sqlite_validator_1.validateSqlForSQLite)(sql, sqliteDialect, location);
            const transformResult = transform ? (0, sqlite_validator_1.transformPgToSQLite)(sql) : undefined;
            const transformedSql = transformResult?.sql;
            const result = {
                valid: errors.length === 0,
                dialect,
                errors: errors.map(mapToGenericError),
                warnings: [],
                transformedSql,
                canTransform: true,
            };
            return result;
        }
        case 'xata': {
            return {
                valid: false,
                dialect,
                errors: [{
                        category: 'DIALECT',
                        feature: 'SQL_EXECUTION',
                        detected: 'SQL statement',
                        message: 'Xata uses its own SDK and does not support direct SQL execution',
                        alternative: 'Use the Xata SDK (@xata.io/client) for database operations',
                        docsUrl: 'https://xata.io/docs/sdk/overview',
                        severity: 'error',
                    }],
                warnings: [],
                canTransform: false,
            };
        }
        default: {
            const _exhaustive = dialect;
            return {
                valid: false,
                dialect: dialect,
                errors: [{
                        category: 'DIALECT',
                        feature: 'UNKNOWN_DIALECT',
                        detected: dialect,
                        message: `Unknown dialect: ${dialect}`,
                        alternative: 'Use one of: postgres, cockroachdb, nile, dsql, mysql, mariadb, planetscale, sqlite, turso, xata',
                        severity: 'error',
                    }],
                warnings: [],
                canTransform: false,
            };
        }
    }
}
function validateSchemaForDialect(schema, dialect) {
    switch (dialect) {
        case 'postgres':
            return {
                valid: true,
                dialect,
                errors: [],
                warnings: [],
            };
        case 'cockroachdb': {
            const result = (0, crdb_validator_1.validateSchemaForCrdb)(schema);
            return {
                valid: result.valid,
                dialect,
                errors: result.errors.map(mapToGenericError),
                warnings: result.warnings.map(mapToGenericError),
            };
        }
        case 'nile': {
            const result = (0, nile_validator_1.validateSchemaForNile)(schema);
            return {
                valid: result.valid,
                dialect,
                errors: result.errors.map(mapToGenericError),
                warnings: result.warnings.map(mapToGenericError),
            };
        }
        case 'dsql': {
            const result = (0, dsql_validator_1.validateSchemaForDsql)(schema);
            return {
                valid: result.valid,
                dialect,
                errors: result.errors.map(mapToGenericError),
                warnings: result.warnings.map(mapToGenericError),
            };
        }
        case 'mysql':
        case 'mariadb':
        case 'planetscale': {
            const result = (0, mysql_validator_1.validateSchemaForMySQL)(schema, dialect);
            return {
                valid: result.valid,
                dialect,
                errors: result.errors.map(mapToGenericError),
                warnings: result.warnings.map(mapToGenericError),
            };
        }
        case 'sqlite':
        case 'turso': {
            const result = (0, sqlite_validator_1.validateSchemaForSQLite)(schema, dialect);
            return {
                valid: result.valid,
                dialect,
                errors: result.errors.map(mapToGenericError),
                warnings: result.warnings.map(mapToGenericError),
            };
        }
        case 'xata':
            return {
                valid: false,
                dialect,
                errors: [{
                        category: 'DIALECT',
                        feature: 'SCHEMA_DEFINITION',
                        detected: 'Schema',
                        message: 'Xata schema management uses the Xata SDK, not SQL DDL',
                        alternative: 'Use Xata SDK schema management or Xata web interface',
                        docsUrl: 'https://xata.io/docs/concepts/schema',
                        severity: 'error',
                    }],
                warnings: [],
            };
        default:
            return {
                valid: false,
                dialect,
                errors: [{
                        category: 'DIALECT',
                        feature: 'UNKNOWN_DIALECT',
                        detected: dialect,
                        message: `Unknown dialect: ${dialect}`,
                        alternative: 'Use a supported dialect',
                        severity: 'error',
                    }],
                warnings: [],
            };
    }
}
function hasDialectIncompatibilities(sql, dialect) {
    switch (dialect) {
        case 'postgres':
            return false;
        case 'cockroachdb':
            return (0, crdb_validator_1.hasCrdbIncompatibilities)(sql);
        case 'nile':
            return (0, nile_validator_1.hasNileIncompatibilities)(sql);
        case 'dsql':
            return (0, dsql_validator_1.hasDsqlIncompatibilities)(sql);
        case 'mysql':
        case 'mariadb':
        case 'planetscale':
            return (0, mysql_validator_1.hasMySQLIncompatibilities)(sql);
        case 'sqlite':
        case 'turso':
            return (0, sqlite_validator_1.hasSQLiteIncompatibilities)(sql);
        case 'xata':
            return true;
        default:
            return true;
    }
}
function transformSqlForDialect(sql, dialect) {
    switch (dialect) {
        case 'postgres':
        case 'cockroachdb':
        case 'dsql':
            return sql;
        case 'nile':
            return (0, nile_validator_1.filterSqlForNile)(sql).filtered;
        case 'mysql':
        case 'mariadb':
        case 'planetscale':
            return (0, mysql_validator_1.transformPgToMySQL)(sql).sql;
        case 'sqlite':
        case 'turso':
            return (0, sqlite_validator_1.transformPgToSQLite)(sql).sql;
        case 'xata':
            return sql;
        default:
            return sql;
    }
}
function formatDialectErrors(result, options = {}) {
    const { showDocsLinks = true, showTransform = true, colorize = true } = options;
    const red = colorize ? '\x1b[31m' : '';
    const yellow = colorize ? '\x1b[33m' : '';
    const cyan = colorize ? '\x1b[36m' : '';
    const green = colorize ? '\x1b[32m' : '';
    const reset = colorize ? '\x1b[0m' : '';
    const bold = colorize ? '\x1b[1m' : '';
    const lines = [];
    const dialectInfo = exports.DIALECT_INFO[result.dialect];
    lines.push(`${bold}${dialectInfo.name} Compatibility Check${reset}\n`);
    if (result.errors.length > 0) {
        lines.push(`${red}✗ ${result.errors.length} Error(s):${reset}\n`);
        for (const err of result.errors) {
            lines.push(`  ${red}•${reset} ${err.message}`);
            if (err.location) {
                lines.push(`    Location: ${err.location}`);
            }
            lines.push(`    Detected: ${cyan}${err.detected}${reset}`);
            lines.push(`    ${yellow}Alternative:${reset} ${err.alternative}`);
            if (showDocsLinks && err.docsUrl) {
                lines.push(`    ${cyan}Docs:${reset} ${err.docsUrl}`);
            }
            lines.push('');
        }
    }
    if (result.warnings.length > 0) {
        lines.push(`${yellow}⚠ ${result.warnings.length} Warning(s):${reset}\n`);
        for (const warn of result.warnings) {
            lines.push(`  ${yellow}•${reset} ${warn.message}`);
            if (warn.location) {
                lines.push(`    Location: ${warn.location}`);
            }
            lines.push(`    ${yellow}Alternative:${reset} ${warn.alternative}`);
            lines.push('');
        }
    }
    if (result.valid && result.errors.length === 0) {
        lines.push(`${green}✓ SQL is compatible with ${dialectInfo.name}${reset}\n`);
    }
    if (showTransform && result.canTransform && result.transformedSql) {
        lines.push(`${cyan}ℹ Transformed SQL available${reset}`);
        lines.push('  Use --transform flag to apply automatic transformations\n');
    }
    return lines.join('\n');
}
function formatErrorList(result) {
    const messages = [];
    for (const err of result.errors) {
        messages.push(`ERROR: ${err.message} (${err.detected})`);
    }
    for (const warn of result.warnings) {
        messages.push(`WARNING: ${warn.message} (${warn.detected})`);
    }
    return messages;
}
function mapToGenericError(error) {
    return {
        category: error.category || 'UNKNOWN',
        feature: error.feature || 'UNKNOWN',
        detected: error.detected || '',
        location: error.location,
        message: error.message || 'Unknown error',
        alternative: error.alternative || 'No alternative provided',
        docsUrl: error.docsUrl,
        severity: error.severity || 'error',
    };
}
function getSupportedDialects() {
    return Object.keys(exports.DIALECT_INFO);
}
function isValidDialect(value) {
    return value in exports.DIALECT_INFO;
}
function detectDialectFromConnectionString(connectionString) {
    const url = connectionString.toLowerCase();
    if (url.startsWith('postgres://') || url.startsWith('postgresql://')) {
        if (url.includes('cockroachlabs') || url.includes('cockroachdb')) {
            return 'cockroachdb';
        }
        if (url.includes('thenile.dev') || url.includes('nile')) {
            return 'nile';
        }
        if (url.includes('dsql.amazonaws.com') || url.includes('aurora-dsql')) {
            return 'dsql';
        }
        return 'postgres';
    }
    if (url.startsWith('mysql://')) {
        if (url.includes('planetscale')) {
            return 'planetscale';
        }
        return 'mysql';
    }
    if (url.startsWith('mariadb://')) {
        return 'mariadb';
    }
    if (url.startsWith('libsql://') || url.startsWith('http://') && url.includes('turso')) {
        return 'turso';
    }
    if (url.includes('.sqlite') || url.endsWith('.db')) {
        return 'sqlite';
    }
    if (url.includes('xata.sh') || url.includes('xata')) {
        return 'xata';
    }
    return null;
}
var dsql_validator_2 = require("./dsql-validator.cjs");
Object.defineProperty(exports, "validateSqlForDsql", { enumerable: true, get: function () { return dsql_validator_2.validateSqlForDsql; } });
Object.defineProperty(exports, "validateSchemaForDsql", { enumerable: true, get: function () { return dsql_validator_2.validateSchemaForDsql; } });
Object.defineProperty(exports, "formatDsqlErrors", { enumerable: true, get: function () { return dsql_validator_2.formatDsqlErrors; } });
Object.defineProperty(exports, "hasDsqlIncompatibilities", { enumerable: true, get: function () { return dsql_validator_2.hasDsqlIncompatibilities; } });
var crdb_validator_2 = require("./crdb-validator.cjs");
Object.defineProperty(exports, "validateSqlForCrdb", { enumerable: true, get: function () { return crdb_validator_2.validateSqlForCrdb; } });
Object.defineProperty(exports, "validateSchemaForCrdb", { enumerable: true, get: function () { return crdb_validator_2.validateSchemaForCrdb; } });
Object.defineProperty(exports, "formatCrdbErrors", { enumerable: true, get: function () { return crdb_validator_2.formatCrdbErrors; } });
Object.defineProperty(exports, "hasCrdbIncompatibilities", { enumerable: true, get: function () { return crdb_validator_2.hasCrdbIncompatibilities; } });
var nile_validator_2 = require("./nile-validator.cjs");
Object.defineProperty(exports, "validateSqlForNile", { enumerable: true, get: function () { return nile_validator_2.validateSqlForNile; } });
Object.defineProperty(exports, "validateSchemaForNile", { enumerable: true, get: function () { return nile_validator_2.validateSchemaForNile; } });
Object.defineProperty(exports, "formatNileErrors", { enumerable: true, get: function () { return nile_validator_2.formatNileErrors; } });
Object.defineProperty(exports, "hasNileIncompatibilities", { enumerable: true, get: function () { return nile_validator_2.hasNileIncompatibilities; } });
Object.defineProperty(exports, "filterSqlForNile", { enumerable: true, get: function () { return nile_validator_2.filterSqlForNile; } });
Object.defineProperty(exports, "classifyTable", { enumerable: true, get: function () { return nile_validator_2.classifyTable; } });
var mysql_validator_2 = require("./mysql-validator.cjs");
Object.defineProperty(exports, "validateSqlForMySQL", { enumerable: true, get: function () { return mysql_validator_2.validateSqlForMySQL; } });
Object.defineProperty(exports, "validateSchemaForMySQL", { enumerable: true, get: function () { return mysql_validator_2.validateSchemaForMySQL; } });
Object.defineProperty(exports, "formatMySQLErrors", { enumerable: true, get: function () { return mysql_validator_2.formatMySQLErrors; } });
Object.defineProperty(exports, "hasMySQLIncompatibilities", { enumerable: true, get: function () { return mysql_validator_2.hasMySQLIncompatibilities; } });
Object.defineProperty(exports, "transformPgToMySQL", { enumerable: true, get: function () { return mysql_validator_2.transformPgToMySQL; } });
var sqlite_validator_2 = require("./sqlite-validator.cjs");
Object.defineProperty(exports, "validateSqlForSQLite", { enumerable: true, get: function () { return sqlite_validator_2.validateSqlForSQLite; } });
Object.defineProperty(exports, "validateSchemaForSQLite", { enumerable: true, get: function () { return sqlite_validator_2.validateSchemaForSQLite; } });
Object.defineProperty(exports, "formatSQLiteErrors", { enumerable: true, get: function () { return sqlite_validator_2.formatSQLiteErrors; } });
Object.defineProperty(exports, "hasSQLiteIncompatibilities", { enumerable: true, get: function () { return sqlite_validator_2.hasSQLiteIncompatibilities; } });
Object.defineProperty(exports, "transformPgToSQLite", { enumerable: true, get: function () { return sqlite_validator_2.transformPgToSQLite; } });
