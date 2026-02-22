import { detectDialectFromUrl, DEFAULT_DIALECT, } from "./types.js";
export function parseConnectionUrl(url, dialectHint) {
    const detectedDialect = detectDialectFromUrl(url);
    const dialect = dialectHint ?? detectedDialect ?? DEFAULT_DIALECT;
    const dialectAutoDetected = !dialectHint && !!detectedDialect;
    const sanitizedUrl = sanitizeUrl(url);
    let connection;
    if (dialect === 'sqlite') {
        connection = parseSQLiteUrl(url);
    }
    else if (dialect === 'turso') {
        connection = parseTursoUrl(url);
    }
    else if (dialect === 'xata') {
        connection = parseXataUrl(url);
    }
    else if (dialect === 'mysql' || dialect === 'mariadb' || dialect === 'planetscale') {
        connection = parseMySQLUrl(url, dialect);
    }
    else {
        connection = parsePostgresUrl(url);
    }
    return {
        dialect,
        connection,
        originalUrl: sanitizedUrl,
        dialectAutoDetected,
    };
}
function parsePostgresUrl(url) {
    try {
        const parsed = new URL(url);
        const sslmode = parsed.searchParams.get('sslmode');
        const applicationName = parsed.searchParams.get('application_name');
        const searchPath = parsed.searchParams.get('search_path');
        const statementTimeout = parsed.searchParams.get('statement_timeout');
        const lockTimeout = parsed.searchParams.get('lock_timeout');
        let ssl;
        if (sslmode) {
            ssl = sslmode;
        }
        const config = {
            url,
            host: parsed.hostname || undefined,
            port: parsed.port ? parseInt(parsed.port, 10) : 5432,
            database: parsed.pathname.slice(1) || undefined,
            user: parsed.username || undefined,
            password: parsed.password || undefined,
            ssl,
            applicationName: applicationName || undefined,
            searchPath: searchPath ? searchPath.split(',') : undefined,
            statementTimeoutMs: statementTimeout ? parseInt(statementTimeout, 10) : undefined,
            lockTimeoutMs: lockTimeout ? parseInt(lockTimeout, 10) : undefined,
        };
        return cleanConfig(config);
    }
    catch {
        return { url };
    }
}
function parseMySQLUrl(url, dialect) {
    try {
        const parsed = new URL(url);
        const sslParam = parsed.searchParams.get('ssl');
        const charset = parsed.searchParams.get('charset');
        const timezone = parsed.searchParams.get('timezone');
        let ssl;
        if (sslParam === 'true' || sslParam === 'required') {
            ssl = true;
        }
        else if (sslParam === 'false') {
            ssl = false;
        }
        const config = {
            url,
            host: parsed.hostname || undefined,
            port: parsed.port ? parseInt(parsed.port, 10) : 3306,
            database: parsed.pathname.slice(1) || undefined,
            user: parsed.username || undefined,
            password: parsed.password || undefined,
            ssl,
            charset: charset || undefined,
            timezone: timezone || undefined,
        };
        if (dialect === 'planetscale') {
            const branch = parsed.searchParams.get('branch');
            return cleanConfig({
                ...config,
                branch: branch || undefined,
            });
        }
        return cleanConfig(config);
    }
    catch {
        return { url };
    }
}
function parseSQLiteUrl(url) {
    if (url === ':memory:') {
        return { filename: ':memory:' };
    }
    if (!url.includes(':') || url.startsWith('./') || url.startsWith('/')) {
        return { filename: url };
    }
    try {
        if (url.startsWith('file:')) {
            const withoutProtocol = url.slice(5);
            const queryIndex = withoutProtocol.indexOf('?');
            const filename = queryIndex >= 0
                ? withoutProtocol.slice(0, queryIndex)
                : withoutProtocol;
            const config = { filename };
            if (queryIndex >= 0) {
                const params = new URLSearchParams(withoutProtocol.slice(queryIndex));
                const mode = params.get('mode');
                if (mode === 'ro')
                    config.mode = 'readonly';
                else if (mode === 'rw')
                    config.mode = 'readwrite';
                else if (mode === 'rwc')
                    config.mode = 'create';
                else if (mode === 'memory')
                    return { filename: ':memory:' };
            }
            return config;
        }
        const parsed = new URL(url);
        const filename = parsed.hostname
            ? `${parsed.hostname}${parsed.pathname}`
            : parsed.pathname;
        return { filename: filename || ':memory:' };
    }
    catch {
        return { filename: url };
    }
}
function parseTursoUrl(url) {
    return {
        url,
    };
}
function parseXataUrl(url) {
    try {
        const parsed = new URL(url);
        const hostParts = parsed.hostname.split('.');
        const workspace = hostParts[0];
        const pathParts = parsed.pathname.split('/').filter(Boolean);
        let database;
        if (pathParts[0] === 'db' && pathParts[1]) {
            database = pathParts[1];
        }
        return {
            databaseUrl: url,
            workspace,
            database,
            apiKey: '',
        };
    }
    catch {
        return {
            databaseUrl: url,
            apiKey: '',
        };
    }
}
function sanitizeUrl(url) {
    try {
        const parsed = new URL(url);
        if (parsed.password) {
            parsed.password = '***';
        }
        return parsed.toString();
    }
    catch {
        return url;
    }
}
function cleanConfig(config) {
    const cleaned = {};
    for (const [key, value] of Object.entries(config)) {
        if (value !== undefined) {
            cleaned[key] = value;
        }
    }
    return cleaned;
}
export function buildConnectionUrl(config, dialect) {
    if (config.url) {
        return config.url;
    }
    const pgConfig = config;
    const mysqlConfig = config;
    const sqliteConfig = config;
    switch (dialect) {
        case 'postgres':
        case 'cockroachdb':
        case 'nile':
        case 'dsql': {
            const protocol = dialect === 'cockroachdb' ? 'cockroachdb' : 'postgresql';
            const auth = pgConfig.user
                ? `${pgConfig.user}${pgConfig.password ? ':' + pgConfig.password : ''}@`
                : '';
            const host = pgConfig.host || 'localhost';
            const port = pgConfig.port || 5432;
            const database = pgConfig.database || 'postgres';
            return `${protocol}://${auth}${host}:${port}/${database}`;
        }
        case 'mysql':
        case 'mariadb':
        case 'planetscale': {
            const protocol = dialect === 'mariadb' ? 'mariadb' : 'mysql';
            const auth = mysqlConfig.user
                ? `${mysqlConfig.user}${mysqlConfig.password ? ':' + mysqlConfig.password : ''}@`
                : '';
            const host = mysqlConfig.host || 'localhost';
            const port = mysqlConfig.port || 3306;
            const database = mysqlConfig.database || '';
            return `${protocol}://${auth}${host}:${port}/${database}`;
        }
        case 'sqlite':
            return sqliteConfig.filename === ':memory:'
                ? ':memory:'
                : `file:${sqliteConfig.filename}`;
        case 'turso': {
            const tursoConfig = config;
            return tursoConfig.url || '';
        }
        case 'xata': {
            const xataConfig = config;
            return xataConfig.databaseUrl || '';
        }
        default:
            return '';
    }
}
export function getDatabaseName(config, dialect) {
    switch (dialect) {
        case 'postgres':
        case 'cockroachdb':
        case 'nile':
        case 'dsql':
            return config.database;
        case 'mysql':
        case 'mariadb':
        case 'planetscale':
            return config.database;
        case 'sqlite':
        case 'turso':
            return config.filename;
        case 'xata':
            return config.database;
        default:
            return undefined;
    }
}
