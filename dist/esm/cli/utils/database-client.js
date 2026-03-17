import { isPostgresFamily, isMySQLFamily } from "../../config/types.js";
import { buildPoolConfig } from "../../config/config.js";
import { detectDialect } from "./dialect-router.js";
async function createPostgresClient(connection, dialect) {
    const pg = await import('pg');
    const poolConfig = await buildPoolConfig(connection);
    const pool = new pg.Pool(poolConfig);
    return {
        dialect,
        async query(sql, params) {
            const result = await pool.query(sql, params);
            return {
                rows: result.rows,
                rowCount: result.rowCount || 0,
                fields: result.fields,
            };
        },
        async beginTransaction() {
            const client = await pool.connect();
            await client.query('BEGIN');
            return {
                async query(sql, params) {
                    const result = await client.query(sql, params);
                    return {
                        rows: result.rows,
                        rowCount: result.rowCount || 0,
                        fields: result.fields,
                    };
                },
                async commit() {
                    await client.query('COMMIT');
                    client.release();
                },
                async rollback() {
                    await client.query('ROLLBACK');
                    client.release();
                },
            };
        },
        async close() {
            await pool.end();
        },
    };
}
async function createMySQLClient(connection, dialect) {
    const moduleName = 'mysql2/promise';
    const mysql2 = await eval(`import('${moduleName}')`);
    const mysqlConfig = connection.url
        ? { uri: connection.url }
        : {
            host: connection.host || 'localhost',
            port: connection.port || 3306,
            database: connection.database,
            user: connection.user,
            password: connection.password,
            ssl: connection.ssl,
        };
    const conn = await mysql2.createConnection(mysqlConfig);
    return {
        dialect,
        async query(sql, params) {
            const [rows, fields] = await conn.query(sql, params);
            return {
                rows: rows,
                rowCount: Array.isArray(rows) ? rows.length : 0,
                fields: fields?.map((f) => ({ name: f.name })),
            };
        },
        async beginTransaction() {
            await conn.beginTransaction();
            return {
                async query(sql, params) {
                    const [rows, fields] = await conn.query(sql, params);
                    return {
                        rows: rows,
                        rowCount: Array.isArray(rows) ? rows.length : 0,
                        fields: fields?.map((f) => ({ name: f.name })),
                    };
                },
                async commit() {
                    await conn.commit();
                },
                async rollback() {
                    await conn.rollback();
                },
            };
        },
        async close() {
            await conn.end();
        },
    };
}
async function createSQLiteClient(connection, dialect) {
    const filename = connection.filename || connection.url?.replace('sqlite://', '') || ':memory:';
    let db;
    if (typeof Bun !== 'undefined') {
        try {
            const { Database } = await import('bun:sqlite');
            db = new Database(filename);
        }
        catch {
        }
    }
    if (!db) {
        try {
            const moduleName = 'better-sqlite3';
            const BetterSqlite3 = await eval(`import('${moduleName}')`);
            db = new BetterSqlite3.default(filename);
        }
        catch {
            throw new Error('SQLite driver not found. Install it with:\n' +
                '  npm install better-sqlite3\n' +
                '  # or use Bun runtime with built-in sqlite');
        }
    }
    return {
        dialect,
        async query(sql, params) {
            const isSelect = sql.trim().toLowerCase().startsWith('select');
            if (isSelect) {
                const rows = db.prepare(sql).all(...(params || []));
                return {
                    rows: rows,
                    rowCount: rows.length,
                };
            }
            else {
                const result = db.prepare(sql).run(...(params || []));
                return {
                    rows: [],
                    rowCount: result.changes,
                };
            }
        },
        async beginTransaction() {
            db.exec('BEGIN');
            return {
                async query(sql, params) {
                    const isSelect = sql.trim().toLowerCase().startsWith('select');
                    if (isSelect) {
                        const rows = db.prepare(sql).all(...(params || []));
                        return { rows: rows, rowCount: rows.length };
                    }
                    else {
                        const result = db.prepare(sql).run(...(params || []));
                        return { rows: [], rowCount: result.changes };
                    }
                },
                async commit() {
                    db.exec('COMMIT');
                },
                async rollback() {
                    db.exec('ROLLBACK');
                },
            };
        },
        async close() {
            db.close();
        },
    };
}
async function createTursoClient(connection, dialect) {
    const moduleName = '@libsql/client';
    const libsql = await eval(`import('${moduleName}')`);
    const client = libsql.createClient({
        url: connection.url,
        authToken: connection.authToken,
    });
    return {
        dialect,
        async query(sql, params) {
            const result = await client.execute({
                sql,
                args: params || [],
            });
            return {
                rows: result.rows,
                rowCount: result.rows.length,
            };
        },
        async beginTransaction() {
            const tx = await client.transaction();
            return {
                async query(sql, params) {
                    const result = await tx.execute({ sql, args: params || [] });
                    return { rows: result.rows, rowCount: result.rows.length };
                },
                async commit() {
                    await tx.commit();
                },
                async rollback() {
                    await tx.rollback();
                },
            };
        },
        async close() {
            client.close();
        },
    };
}
async function createXataClient(connection, dialect) {
    const moduleName = '@xata.io/client';
    const xata = await eval(`import('${moduleName}')`);
    const XataClient = xata.XataClient || xata.default?.XataClient;
    const client = new XataClient({
        apiKey: connection.apiKey || process.env.XATA_API_KEY,
        databaseURL: connection.databaseURL,
        branch: connection.branch || 'main',
    });
    return {
        dialect,
        async query(sql, params) {
            const result = await client.sql({ statement: sql });
            return {
                rows: result.records,
                rowCount: result.records?.length || 0,
            };
        },
        async beginTransaction() {
            throw new Error('Transactions are not supported in Xata. Use individual operations instead.');
        },
        async close() {
        },
    };
}
export async function createDatabaseClient(config) {
    if (!config.connection) {
        throw new Error('No database connection configured');
    }
    const dialect = detectDialect(config);
    const connection = config.connection;
    if (isPostgresFamily(dialect)) {
        return createPostgresClient(connection, dialect);
    }
    if (isMySQLFamily(dialect)) {
        return createMySQLClient(connection, dialect);
    }
    if (dialect === 'turso') {
        return createTursoClient(connection, dialect);
    }
    if (dialect === 'sqlite') {
        return createSQLiteClient(connection, dialect);
    }
    if (dialect === 'xata') {
        return createXataClient(connection, dialect);
    }
    return createPostgresClient(connection, dialect);
}
export async function createClientFromConnection(connection, dialect) {
    const resolvedDialect = dialect || detectDialect({ connection });
    return createDatabaseClient({ dialect: resolvedDialect, connection });
}
