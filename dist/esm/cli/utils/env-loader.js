export function loadEnvConfig() {
    const connectionString = process.env.RELQ_PG_CONN_URL || process.env.DATABASE_CONNECTION_STRING;
    if (connectionString) {
        return parseConnectionString(connectionString);
    }
    const host = process.env.DATABASE_HOST;
    const database = process.env.DATABASE_NAME;
    const user = process.env.DATABASE_USER;
    const password = process.env.DATABASE_PASSWORD;
    const port = process.env.DATABASE_PORT;
    if (!host || !database) {
        return null;
    }
    return {
        host,
        port: port ? parseInt(port, 10) : 5432,
        database,
        user: user || 'postgres',
        password: password || '',
    };
}
function parseConnectionString(url) {
    try {
        const parsed = new URL(url);
        return {
            url,
            host: parsed.hostname,
            port: parsed.port ? parseInt(parsed.port, 10) : 5432,
            database: parsed.pathname.slice(1),
            user: parsed.username || 'postgres',
            password: parsed.password || '',
            ssl: parsed.searchParams.get('sslmode'),
        };
    }
    catch {
        return { url };
    }
}
export function hasEnvConfig() {
    return !!(process.env.RELQ_PG_CONN_URL ||
        process.env.DATABASE_CONNECTION_STRING ||
        process.env.DATABASE_HOST);
}
export function getConnectionDescription(config) {
    const awsConfig = config.aws;
    if (awsConfig?.hostname && awsConfig?.region) {
        return `${awsConfig.user || 'admin'}@${awsConfig.hostname}:${awsConfig.port || 5432}/${config.database} (AWS DSQL - ${awsConfig.region})`;
    }
    if (config.url) {
        try {
            const url = new URL(config.url);
            if (url.password) {
                url.password = '***';
            }
            return url.toString();
        }
        catch {
            return config.url.replace(/:([^:@]+)@/, ':***@');
        }
    }
    return `${config.user || 'postgres'}@${config.host}:${config.port || 5432}/${config.database}`;
}
