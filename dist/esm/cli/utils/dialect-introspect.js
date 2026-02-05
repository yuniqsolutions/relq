import { isPostgresFamily } from "../../config/types.js";
import { detectDialect, getAdapterForConfig } from "./dialect-router.js";
export async function dialectIntrospect(config, options) {
    if (!config.connection) {
        throw new Error('No database connection configured');
    }
    const dialect = detectDialect(config);
    if (isPostgresFamily(dialect)) {
        let pgSchema;
        switch (dialect) {
            case 'postgres': {
                const { introspectPostgres } = await import("./postgres/introspect.js");
                pgSchema = await introspectPostgres(config.connection, {
                    includeFunctions: options?.includeFunctions,
                    includeTriggers: options?.includeTriggers,
                    onProgress: options?.onProgress,
                    onDetailedProgress: options?.onDetailedProgress,
                });
                break;
            }
            case 'cockroachdb': {
                const { introspectCockroachDB } = await import("./cockroachdb/introspect.js");
                pgSchema = await introspectCockroachDB(config.connection, {
                    includeFunctions: options?.includeFunctions,
                    includeTriggers: options?.includeTriggers,
                    onProgress: options?.onProgress,
                    onDetailedProgress: options?.onDetailedProgress,
                });
                break;
            }
            case 'nile': {
                const { introspectNile } = await import("./nile/introspect.js");
                pgSchema = await introspectNile(config.connection, {
                    includeFunctions: options?.includeFunctions,
                    includeTriggers: options?.includeTriggers,
                    onProgress: options?.onProgress,
                    onDetailedProgress: options?.onDetailedProgress,
                });
                break;
            }
            case 'dsql': {
                const { introspectDsql } = await import("./dsql/introspect.js");
                pgSchema = await introspectDsql(config.connection, {
                    onProgress: options?.onProgress,
                    onDetailedProgress: options?.onDetailedProgress,
                });
                break;
            }
            default: {
                const { introspectPostgres } = await import("./postgres/introspect.js");
                pgSchema = await introspectPostgres(config.connection, {
                    includeFunctions: options?.includeFunctions,
                    includeTriggers: options?.includeTriggers,
                    onProgress: options?.onProgress,
                    onDetailedProgress: options?.onDetailedProgress,
                });
                break;
            }
        }
        return pgSchema;
    }
    const adapter = await getAdapterForConfig(config);
    return adapter.introspect(config.connection, {
        includeFunctions: options?.includeFunctions,
        includeTriggers: options?.includeTriggers,
        excludePatterns: options?.excludePatterns,
    });
}
export async function introspectFromConnection(connection, dialect, options) {
    return dialectIntrospect({ connection, dialect }, options);
}
export async function dialectListTables(config, schema) {
    const adapter = await getAdapterForConfig(config);
    return adapter.listTables(config.connection, schema);
}
export async function dialectListSchemas(config) {
    const adapter = await getAdapterForConfig(config);
    return adapter.listSchemas(config.connection);
}
export async function dialectTestConnection(config) {
    const adapter = await getAdapterForConfig(config);
    return adapter.testConnection(config.connection);
}
export async function dialectGetVersion(config) {
    const adapter = await getAdapterForConfig(config);
    return adapter.getDatabaseVersion(config.connection);
}
