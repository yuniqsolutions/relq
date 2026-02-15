import { validateSqlForDsql, validateSchemaForDsql, hasDsqlIncompatibilities, } from "./dsql-validator.js";
import { validateSqlForCrdb, validateSchemaForCrdb, hasCrdbIncompatibilities, } from "./crdb-validator.js";
import { validateSqlForNile, validateSchemaForNile, hasNileIncompatibilities, filterSqlForNile, } from "./nile-validator.js";
import { validateSqlForMySQL, validateSchemaForMySQL, hasMySQLIncompatibilities, transformPgToMySQL, } from "./mysql-validator.js";
import { validateSqlForSQLite, validateSchemaForSQLite, hasSQLiteIncompatibilities, transformPgToSQLite, } from "./sqlite-validator.js";
export const DIALECT_INFO = {
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
export function getDialectFamily(dialect) {
    return DIALECT_INFO[dialect].family;
}
export function isPostgresDialect(dialect) {
    return DIALECT_INFO[dialect].family === 'postgres';
}
export function requiresTransform(dialect) {
    return DIALECT_INFO[dialect].requiresTransform;
}
export function validateForDialect(sql, dialect, options = {}) {
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
            const errors = validateSqlForCrdb(sql, location);
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
            const errors = validateSqlForNile(sql, location);
            const filterResult = transform ? filterSqlForNile(sql) : undefined;
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
            const errors = validateSqlForDsql(sql, location);
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
            const errors = validateSqlForMySQL(sql, mysqlDialect, location);
            const transformResult = transform ? transformPgToMySQL(sql) : undefined;
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
            const errors = validateSqlForSQLite(sql, sqliteDialect, location);
            const transformResult = transform ? transformPgToSQLite(sql) : undefined;
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
export function validateSchemaForDialect(schema, dialect) {
    switch (dialect) {
        case 'postgres':
            return {
                valid: true,
                dialect,
                errors: [],
                warnings: [],
            };
        case 'cockroachdb': {
            const result = validateSchemaForCrdb(schema);
            return {
                valid: result.valid,
                dialect,
                errors: result.errors.map(mapToGenericError),
                warnings: result.warnings.map(mapToGenericError),
            };
        }
        case 'nile': {
            const result = validateSchemaForNile(schema);
            return {
                valid: result.valid,
                dialect,
                errors: result.errors.map(mapToGenericError),
                warnings: result.warnings.map(mapToGenericError),
            };
        }
        case 'dsql': {
            const result = validateSchemaForDsql(schema);
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
            const result = validateSchemaForMySQL(schema, dialect);
            return {
                valid: result.valid,
                dialect,
                errors: result.errors.map(mapToGenericError),
                warnings: result.warnings.map(mapToGenericError),
            };
        }
        case 'sqlite':
        case 'turso': {
            const result = validateSchemaForSQLite(schema, dialect);
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
export function hasDialectIncompatibilities(sql, dialect) {
    switch (dialect) {
        case 'postgres':
            return false;
        case 'cockroachdb':
            return hasCrdbIncompatibilities(sql);
        case 'nile':
            return hasNileIncompatibilities(sql);
        case 'dsql':
            return hasDsqlIncompatibilities(sql);
        case 'mysql':
        case 'mariadb':
        case 'planetscale':
            return hasMySQLIncompatibilities(sql);
        case 'sqlite':
        case 'turso':
            return hasSQLiteIncompatibilities(sql);
        case 'xata':
            return true;
        default:
            return true;
    }
}
export function transformSqlForDialect(sql, dialect) {
    switch (dialect) {
        case 'postgres':
        case 'cockroachdb':
        case 'dsql':
            return sql;
        case 'nile':
            return filterSqlForNile(sql).filtered;
        case 'mysql':
        case 'mariadb':
        case 'planetscale':
            return transformPgToMySQL(sql).sql;
        case 'sqlite':
        case 'turso':
            return transformPgToSQLite(sql).sql;
        case 'xata':
            return sql;
        default:
            return sql;
    }
}
export function formatDialectErrors(result, options = {}) {
    const { showDocsLinks = true, showTransform = true, colorize = true } = options;
    const red = colorize ? '\x1b[31m' : '';
    const yellow = colorize ? '\x1b[33m' : '';
    const cyan = colorize ? '\x1b[36m' : '';
    const green = colorize ? '\x1b[32m' : '';
    const reset = colorize ? '\x1b[0m' : '';
    const bold = colorize ? '\x1b[1m' : '';
    const lines = [];
    const dialectInfo = DIALECT_INFO[result.dialect];
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
export function formatErrorList(result) {
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
export function getSupportedDialects() {
    return Object.keys(DIALECT_INFO);
}
export function isValidDialect(value) {
    return value in DIALECT_INFO;
}
export function detectDialectFromConnectionString(connectionString) {
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
export { validateSqlForDsql, validateSchemaForDsql, formatDsqlErrors, hasDsqlIncompatibilities, } from "./dsql-validator.js";
export { validateSqlForCrdb, validateSchemaForCrdb, formatCrdbErrors, hasCrdbIncompatibilities, } from "./crdb-validator.js";
export { validateSqlForNile, validateSchemaForNile, formatNileErrors, hasNileIncompatibilities, filterSqlForNile, classifyTable, } from "./nile-validator.js";
export { validateSqlForMySQL, validateSchemaForMySQL, formatMySQLErrors, hasMySQLIncompatibilities, transformPgToMySQL, } from "./mysql-validator.js";
export { validateSqlForSQLite, validateSchemaForSQLite, formatSQLiteErrors, hasSQLiteIncompatibilities, transformPgToSQLite, } from "./sqlite-validator.js";
