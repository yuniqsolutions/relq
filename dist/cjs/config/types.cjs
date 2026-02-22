"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALL_DIALECTS = exports.MYSQL_DIALECTS = exports.SQLITE_DIALECTS = exports.POSTGRES_DIALECTS = exports.DEFAULT_DIALECT = exports.HOST_DIALECT_PATTERNS = exports.PROTOCOL_DIALECT_MAP = exports.DIALECT_FAMILY_MAP = void 0;
exports.getDialectFamily = getDialectFamily;
exports.isPostgresFamily = isPostgresFamily;
exports.isSQLiteFamily = isSQLiteFamily;
exports.isMySQLFamily = isMySQLFamily;
exports.isXataDialect = isXataDialect;
exports.detectDialectFromUrl = detectDialectFromUrl;
exports.DIALECT_FAMILY_MAP = {
    postgres: 'postgres',
    cockroachdb: 'postgres',
    nile: 'postgres',
    dsql: 'postgres',
    sqlite: 'sqlite',
    turso: 'sqlite',
    mysql: 'mysql',
    mariadb: 'mysql',
    planetscale: 'mysql',
    xata: 'xata',
};
function getDialectFamily(dialect) {
    return exports.DIALECT_FAMILY_MAP[dialect];
}
function isPostgresFamily(dialect) {
    return exports.DIALECT_FAMILY_MAP[dialect] === 'postgres';
}
function isSQLiteFamily(dialect) {
    return exports.DIALECT_FAMILY_MAP[dialect] === 'sqlite';
}
function isMySQLFamily(dialect) {
    return exports.DIALECT_FAMILY_MAP[dialect] === 'mysql';
}
function isXataDialect(dialect) {
    return dialect === 'xata';
}
exports.PROTOCOL_DIALECT_MAP = {
    'postgres': 'postgres',
    'postgresql': 'postgres',
    'pg': 'postgres',
    'cockroachdb': 'cockroachdb',
    'crdb': 'cockroachdb',
    'sqlite': 'sqlite',
    'sqlite3': 'sqlite',
    'file': 'sqlite',
    'libsql': 'turso',
    'turso': 'turso',
    'wss': 'turso',
    'mysql': 'mysql',
    'mysql2': 'mysql',
    'mariadb': 'mariadb',
};
exports.HOST_DIALECT_PATTERNS = [
    { pattern: /\.dsql\.[a-z0-9-]+\.on\.aws$/i, dialect: 'dsql' },
    { pattern: /\.psdb\.cloud$/i, dialect: 'planetscale' },
    { pattern: /\.planetscale\.io$/i, dialect: 'planetscale' },
    { pattern: /\.nile\.dev$/i, dialect: 'nile' },
    { pattern: /\.thenile\.dev$/i, dialect: 'nile' },
    { pattern: /\.cockroachlabs\.cloud$/i, dialect: 'cockroachdb' },
    { pattern: /\.crdb\.io$/i, dialect: 'cockroachdb' },
    { pattern: /\.turso\.io$/i, dialect: 'turso' },
    { pattern: /\.libsql\.io$/i, dialect: 'turso' },
    { pattern: /\.xata\.sh$/i, dialect: 'xata' },
];
function detectDialectFromUrl(url) {
    try {
        const parsed = new URL(url);
        const protocol = parsed.protocol.replace(/:$/, '').toLowerCase();
        for (const { pattern, dialect } of exports.HOST_DIALECT_PATTERNS) {
            if (pattern.test(parsed.hostname)) {
                return dialect;
            }
        }
        if (protocol in exports.PROTOCOL_DIALECT_MAP) {
            return exports.PROTOCOL_DIALECT_MAP[protocol];
        }
        return undefined;
    }
    catch {
        for (const { pattern, dialect } of exports.HOST_DIALECT_PATTERNS) {
            if (pattern.test(url)) {
                return dialect;
            }
        }
        return undefined;
    }
}
exports.DEFAULT_DIALECT = 'postgres';
exports.POSTGRES_DIALECTS = ['postgres', 'cockroachdb', 'nile', 'dsql'];
exports.SQLITE_DIALECTS = ['sqlite', 'turso'];
exports.MYSQL_DIALECTS = ['mysql', 'mariadb', 'planetscale'];
exports.ALL_DIALECTS = [
    ...exports.POSTGRES_DIALECTS,
    ...exports.SQLITE_DIALECTS,
    ...exports.MYSQL_DIALECTS,
    'xata',
];
