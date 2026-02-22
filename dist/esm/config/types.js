export const DIALECT_FAMILY_MAP = {
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
export function getDialectFamily(dialect) {
    return DIALECT_FAMILY_MAP[dialect];
}
export function isPostgresFamily(dialect) {
    return DIALECT_FAMILY_MAP[dialect] === 'postgres';
}
export function isSQLiteFamily(dialect) {
    return DIALECT_FAMILY_MAP[dialect] === 'sqlite';
}
export function isMySQLFamily(dialect) {
    return DIALECT_FAMILY_MAP[dialect] === 'mysql';
}
export function isXataDialect(dialect) {
    return dialect === 'xata';
}
export const PROTOCOL_DIALECT_MAP = {
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
export const HOST_DIALECT_PATTERNS = [
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
export function detectDialectFromUrl(url) {
    try {
        const parsed = new URL(url);
        const protocol = parsed.protocol.replace(/:$/, '').toLowerCase();
        for (const { pattern, dialect } of HOST_DIALECT_PATTERNS) {
            if (pattern.test(parsed.hostname)) {
                return dialect;
            }
        }
        if (protocol in PROTOCOL_DIALECT_MAP) {
            return PROTOCOL_DIALECT_MAP[protocol];
        }
        return undefined;
    }
    catch {
        for (const { pattern, dialect } of HOST_DIALECT_PATTERNS) {
            if (pattern.test(url)) {
                return dialect;
            }
        }
        return undefined;
    }
}
export const DEFAULT_DIALECT = 'postgres';
export const POSTGRES_DIALECTS = ['postgres', 'cockroachdb', 'nile', 'dsql'];
export const SQLITE_DIALECTS = ['sqlite', 'turso'];
export const MYSQL_DIALECTS = ['mysql', 'mariadb', 'planetscale'];
export const ALL_DIALECTS = [
    ...POSTGRES_DIALECTS,
    ...SQLITE_DIALECTS,
    ...MYSQL_DIALECTS,
    'xata',
];
