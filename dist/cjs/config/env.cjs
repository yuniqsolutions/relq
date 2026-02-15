"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENV_VARS = void 0;
exports.loadEnvConfig = loadEnvConfig;
exports.hasEnvConfig = hasEnvConfig;
exports.describeEnvConfig = describeEnvConfig;
const node_process_1 = __importDefault(require("node:process"));
const types_1 = require("./types.cjs");
const url_parser_1 = require("./url-parser.cjs");
exports.ENV_VARS = {
    DATABASE_URL: 'DATABASE_URL',
    POSTGRES_URL: 'POSTGRES_URL',
    POSTGRESQL_URL: 'POSTGRESQL_URL',
    PG_URL: 'PG_URL',
    MYSQL_URL: 'MYSQL_URL',
    SQLITE_URL: 'SQLITE_URL',
    TURSO_URL: 'TURSO_URL',
    LIBSQL_URL: 'LIBSQL_URL',
    XATA_DATABASE_URL: 'XATA_DATABASE_URL',
    RELQ_DIALECT: 'RELQ_DIALECT',
    PGHOST: 'PGHOST',
    PGPORT: 'PGPORT',
    PGDATABASE: 'PGDATABASE',
    PGUSER: 'PGUSER',
    PGPASSWORD: 'PGPASSWORD',
    PGSSLMODE: 'PGSSLMODE',
    MYSQL_HOST: 'MYSQL_HOST',
    MYSQL_PORT: 'MYSQL_PORT',
    MYSQL_DATABASE: 'MYSQL_DATABASE',
    MYSQL_USER: 'MYSQL_USER',
    MYSQL_PASSWORD: 'MYSQL_PASSWORD',
    SQLITE_DATABASE: 'SQLITE_DATABASE',
    SQLITE_FILENAME: 'SQLITE_FILENAME',
    TURSO_DATABASE_URL: 'TURSO_DATABASE_URL',
    TURSO_AUTH_TOKEN: 'TURSO_AUTH_TOKEN',
    LIBSQL_AUTH_TOKEN: 'LIBSQL_AUTH_TOKEN',
    XATA_API_KEY: 'XATA_API_KEY',
    XATA_BRANCH: 'XATA_BRANCH',
    AWS_DSQL_HOSTNAME: 'AWS_DSQL_HOSTNAME',
    AWS_DSQL_REGION: 'AWS_DSQL_REGION',
    AWS_ACCESS_KEY_ID: 'AWS_ACCESS_KEY_ID',
    AWS_SECRET_ACCESS_KEY: 'AWS_SECRET_ACCESS_KEY',
    AWS_SESSION_TOKEN: 'AWS_SESSION_TOKEN',
    AWS_REGION: 'AWS_REGION',
    COCKROACH_URL: 'COCKROACH_URL',
    COCKROACHDB_URL: 'COCKROACHDB_URL',
    NILE_URL: 'NILE_URL',
    NILE_API_KEY: 'NILE_API_KEY',
    PLANETSCALE_URL: 'PLANETSCALE_URL',
    PLANETSCALE_HOST: 'PLANETSCALE_HOST',
};
function loadEnvConfig(env = node_process_1.default.env) {
    const usedVars = [];
    const dialectOverride = env[exports.ENV_VARS.RELQ_DIALECT];
    if (dialectOverride) {
        usedVars.push(exports.ENV_VARS.RELQ_DIALECT);
    }
    const loaders = [
        () => tryLoadFromUrl(env, exports.ENV_VARS.DATABASE_URL, dialectOverride, usedVars),
        () => tryLoadFromUrl(env, exports.ENV_VARS.POSTGRES_URL, 'postgres', usedVars),
        () => tryLoadFromUrl(env, exports.ENV_VARS.POSTGRESQL_URL, 'postgres', usedVars),
        () => tryLoadFromUrl(env, exports.ENV_VARS.PG_URL, 'postgres', usedVars),
        () => tryLoadFromUrl(env, exports.ENV_VARS.COCKROACH_URL, 'cockroachdb', usedVars),
        () => tryLoadFromUrl(env, exports.ENV_VARS.COCKROACHDB_URL, 'cockroachdb', usedVars),
        () => tryLoadFromUrl(env, exports.ENV_VARS.NILE_URL, 'nile', usedVars),
        () => tryLoadFromUrl(env, exports.ENV_VARS.MYSQL_URL, 'mysql', usedVars),
        () => tryLoadFromUrl(env, exports.ENV_VARS.PLANETSCALE_URL, 'planetscale', usedVars),
        () => tryLoadFromUrl(env, exports.ENV_VARS.SQLITE_URL, 'sqlite', usedVars),
        () => tryLoadFromUrl(env, exports.ENV_VARS.TURSO_URL, 'turso', usedVars),
        () => tryLoadFromUrl(env, exports.ENV_VARS.LIBSQL_URL, 'turso', usedVars),
        () => tryLoadFromUrl(env, exports.ENV_VARS.TURSO_DATABASE_URL, 'turso', usedVars),
        () => tryLoadFromUrl(env, exports.ENV_VARS.XATA_DATABASE_URL, 'xata', usedVars),
        () => tryLoadAwsDsql(env, usedVars),
        () => tryLoadPostgresParams(env, usedVars),
        () => tryLoadMySqlParams(env, usedVars),
        () => tryLoadSqliteParams(env, usedVars),
        () => tryLoadTursoParams(env, usedVars),
        () => tryLoadXataParams(env, usedVars),
    ];
    for (const loader of loaders) {
        const result = loader();
        if (result?.found) {
            return result;
        }
    }
    return {
        dialect: dialectOverride || types_1.DEFAULT_DIALECT,
        connection: {},
        usedVars,
        found: false,
    };
}
function tryLoadFromUrl(env, varName, dialectHint, usedVars) {
    const url = env[varName];
    if (!url)
        return null;
    usedVars.push(varName);
    const parsed = (0, url_parser_1.parseConnectionUrl)(url, dialectHint);
    return {
        dialect: parsed.dialect,
        connection: parsed.connection,
        usedVars: [...usedVars],
        found: true,
    };
}
function tryLoadAwsDsql(env, usedVars) {
    const hostname = env[exports.ENV_VARS.AWS_DSQL_HOSTNAME];
    const region = env[exports.ENV_VARS.AWS_DSQL_REGION] || env[exports.ENV_VARS.AWS_REGION];
    if (!hostname || !region)
        return null;
    usedVars.push(exports.ENV_VARS.AWS_DSQL_HOSTNAME);
    usedVars.push(region === env[exports.ENV_VARS.AWS_DSQL_REGION]
        ? exports.ENV_VARS.AWS_DSQL_REGION
        : exports.ENV_VARS.AWS_REGION);
    const connection = {
        database: 'postgres',
        aws: {
            hostname,
            region: region,
        },
    };
    if (env[exports.ENV_VARS.AWS_ACCESS_KEY_ID]) {
        usedVars.push(exports.ENV_VARS.AWS_ACCESS_KEY_ID);
        connection.aws.accessKeyId = env[exports.ENV_VARS.AWS_ACCESS_KEY_ID];
    }
    if (env[exports.ENV_VARS.AWS_SECRET_ACCESS_KEY]) {
        usedVars.push(exports.ENV_VARS.AWS_SECRET_ACCESS_KEY);
        connection.aws.secretAccessKey = env[exports.ENV_VARS.AWS_SECRET_ACCESS_KEY];
    }
    if (env[exports.ENV_VARS.AWS_SESSION_TOKEN]) {
        usedVars.push(exports.ENV_VARS.AWS_SESSION_TOKEN);
        connection.aws.sessionToken = env[exports.ENV_VARS.AWS_SESSION_TOKEN];
    }
    return {
        dialect: 'dsql',
        connection,
        usedVars: [...usedVars],
        found: true,
    };
}
function tryLoadPostgresParams(env, usedVars) {
    const host = env[exports.ENV_VARS.PGHOST];
    const database = env[exports.ENV_VARS.PGDATABASE];
    if (!host && !database)
        return null;
    const connection = {};
    if (host) {
        usedVars.push(exports.ENV_VARS.PGHOST);
        connection.host = host;
    }
    if (env[exports.ENV_VARS.PGPORT]) {
        usedVars.push(exports.ENV_VARS.PGPORT);
        connection.port = parseInt(env[exports.ENV_VARS.PGPORT], 10);
    }
    if (database) {
        usedVars.push(exports.ENV_VARS.PGDATABASE);
        connection.database = database;
    }
    if (env[exports.ENV_VARS.PGUSER]) {
        usedVars.push(exports.ENV_VARS.PGUSER);
        connection.user = env[exports.ENV_VARS.PGUSER];
    }
    if (env[exports.ENV_VARS.PGPASSWORD]) {
        usedVars.push(exports.ENV_VARS.PGPASSWORD);
        connection.password = env[exports.ENV_VARS.PGPASSWORD];
    }
    if (env[exports.ENV_VARS.PGSSLMODE]) {
        usedVars.push(exports.ENV_VARS.PGSSLMODE);
        connection.ssl = env[exports.ENV_VARS.PGSSLMODE];
    }
    return {
        dialect: 'postgres',
        connection,
        usedVars: [...usedVars],
        found: true,
    };
}
function tryLoadMySqlParams(env, usedVars) {
    const host = env[exports.ENV_VARS.MYSQL_HOST];
    const database = env[exports.ENV_VARS.MYSQL_DATABASE];
    if (!host && !database)
        return null;
    const connection = {};
    if (host) {
        usedVars.push(exports.ENV_VARS.MYSQL_HOST);
        connection.host = host;
    }
    if (env[exports.ENV_VARS.MYSQL_PORT]) {
        usedVars.push(exports.ENV_VARS.MYSQL_PORT);
        connection.port = parseInt(env[exports.ENV_VARS.MYSQL_PORT], 10);
    }
    if (database) {
        usedVars.push(exports.ENV_VARS.MYSQL_DATABASE);
        connection.database = database;
    }
    if (env[exports.ENV_VARS.MYSQL_USER]) {
        usedVars.push(exports.ENV_VARS.MYSQL_USER);
        connection.user = env[exports.ENV_VARS.MYSQL_USER];
    }
    if (env[exports.ENV_VARS.MYSQL_PASSWORD]) {
        usedVars.push(exports.ENV_VARS.MYSQL_PASSWORD);
        connection.password = env[exports.ENV_VARS.MYSQL_PASSWORD];
    }
    return {
        dialect: 'mysql',
        connection,
        usedVars: [...usedVars],
        found: true,
    };
}
function tryLoadSqliteParams(env, usedVars) {
    const filename = env[exports.ENV_VARS.SQLITE_FILENAME] || env[exports.ENV_VARS.SQLITE_DATABASE];
    if (!filename)
        return null;
    usedVars.push(env[exports.ENV_VARS.SQLITE_FILENAME]
        ? exports.ENV_VARS.SQLITE_FILENAME
        : exports.ENV_VARS.SQLITE_DATABASE);
    const connection = { filename };
    return {
        dialect: 'sqlite',
        connection,
        usedVars: [...usedVars],
        found: true,
    };
}
function tryLoadTursoParams(env, usedVars) {
    const authToken = env[exports.ENV_VARS.TURSO_AUTH_TOKEN] || env[exports.ENV_VARS.LIBSQL_AUTH_TOKEN];
    if (!authToken)
        return null;
    usedVars.push(env[exports.ENV_VARS.TURSO_AUTH_TOKEN]
        ? exports.ENV_VARS.TURSO_AUTH_TOKEN
        : exports.ENV_VARS.LIBSQL_AUTH_TOKEN);
    const connection = {
        authToken,
    };
    return {
        dialect: 'turso',
        connection,
        usedVars: [...usedVars],
        found: true,
    };
}
function tryLoadXataParams(env, usedVars) {
    const apiKey = env[exports.ENV_VARS.XATA_API_KEY];
    if (!apiKey)
        return null;
    usedVars.push(exports.ENV_VARS.XATA_API_KEY);
    const connection = {
        apiKey,
    };
    if (env[exports.ENV_VARS.XATA_BRANCH]) {
        usedVars.push(exports.ENV_VARS.XATA_BRANCH);
        connection.branch = env[exports.ENV_VARS.XATA_BRANCH];
    }
    return {
        dialect: 'xata',
        connection,
        usedVars: [...usedVars],
        found: true,
    };
}
function hasEnvConfig(env = node_process_1.default.env) {
    const urlVars = [
        exports.ENV_VARS.DATABASE_URL,
        exports.ENV_VARS.POSTGRES_URL,
        exports.ENV_VARS.POSTGRESQL_URL,
        exports.ENV_VARS.PG_URL,
        exports.ENV_VARS.MYSQL_URL,
        exports.ENV_VARS.SQLITE_URL,
        exports.ENV_VARS.TURSO_URL,
        exports.ENV_VARS.LIBSQL_URL,
        exports.ENV_VARS.TURSO_DATABASE_URL,
        exports.ENV_VARS.XATA_DATABASE_URL,
        exports.ENV_VARS.COCKROACH_URL,
        exports.ENV_VARS.COCKROACHDB_URL,
        exports.ENV_VARS.NILE_URL,
        exports.ENV_VARS.PLANETSCALE_URL,
    ];
    for (const varName of urlVars) {
        if (env[varName])
            return true;
    }
    if (env[exports.ENV_VARS.AWS_DSQL_HOSTNAME])
        return true;
    if (env[exports.ENV_VARS.PGHOST] || env[exports.ENV_VARS.PGDATABASE])
        return true;
    if (env[exports.ENV_VARS.MYSQL_HOST] || env[exports.ENV_VARS.MYSQL_DATABASE])
        return true;
    if (env[exports.ENV_VARS.SQLITE_FILENAME] || env[exports.ENV_VARS.SQLITE_DATABASE])
        return true;
    if (env[exports.ENV_VARS.XATA_API_KEY])
        return true;
    return false;
}
function describeEnvConfig(env = node_process_1.default.env) {
    const result = loadEnvConfig(env);
    if (!result.found) {
        return 'No database configuration found in environment';
    }
    const varsUsed = result.usedVars.join(', ');
    return `Loaded ${result.dialect} configuration from: ${varsUsed}`;
}
