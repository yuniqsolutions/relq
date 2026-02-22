import { SQLiteAdapter } from "./index.js";
import { TURSO_FEATURES } from "./features.js";
import { introspectSQLite } from "./introspect.js";
export class TursoAdapter extends SQLiteAdapter {
    dialect = 'turso';
    displayName = 'Turso';
    features = TURSO_FEATURES;
    client = null;
    async testConnection(connection) {
        try {
            const client = await this.createClient(connection);
            await client.execute('SELECT 1');
            return true;
        }
        catch (error) {
            return false;
        }
    }
    async getDatabaseVersion(connection) {
        const client = await this.createClient(connection);
        const result = await client.execute('SELECT sqlite_version() as version');
        const version = result.rows[0]?.version || 'unknown';
        return `Turso (SQLite ${version})`;
    }
    async introspect(connection, options) {
        const client = await this.createClient(connection);
        const executeQuery = async (sql, params) => {
            const result = await client.execute({
                sql,
                args: params || [],
            });
            return result.rows;
        };
        const config = connection;
        const databaseName = this.extractDatabaseName(config.url || '');
        return await introspectSQLite(executeQuery, databaseName, options);
    }
    async listTables(connection, schema) {
        const client = await this.createClient(connection);
        const result = await client.execute(`
            SELECT name
            FROM sqlite_master
            WHERE type = 'table'
                AND name NOT LIKE 'sqlite_%'
                AND name NOT LIKE '_litestream_%'
            ORDER BY name
        `);
        return result.rows.map((r) => r.name);
    }
    async getReplicaInfo(connection) {
        if (!connection.syncUrl) {
            return { syncEnabled: false };
        }
        try {
            const client = await this.createClient(connection);
            const result = await client.execute('PRAGMA sync_status');
            return {
                syncEnabled: true,
                lastSyncTime: result.rows[0]?.last_sync_time
                    ? new Date(result.rows[0].last_sync_time)
                    : undefined,
            };
        }
        catch {
            return { syncEnabled: true };
        }
    }
    async syncReplica(connection) {
        if (!connection.syncUrl) {
            throw new Error('Sync URL not configured for embedded replica');
        }
        const client = await this.createClient(connection);
        await client.sync();
    }
    async createClient(config) {
        try {
            const moduleName = '@libsql/client';
            const libsql = await eval(`import('${moduleName}')`);
            if (config.syncUrl) {
                return libsql.createClient({
                    url: 'file:local.db',
                    syncUrl: config.syncUrl,
                    authToken: config.authToken,
                    encryptionKey: config.encryptionKey,
                });
            }
            return libsql.createClient({
                url: config.url,
                authToken: config.authToken,
            });
        }
        catch (error) {
            throw new Error('Turso driver not found. Install it with:\n' +
                '  npm install @libsql/client\n' +
                '  # or\n' +
                '  bun add @libsql/client');
        }
    }
    extractDatabaseName(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname.split('.')[0] || 'turso';
        }
        catch {
            return 'turso';
        }
    }
}
