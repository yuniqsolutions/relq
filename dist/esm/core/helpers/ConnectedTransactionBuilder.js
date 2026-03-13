import { ConnectedRawQueryBuilder } from "./ConnectedRawQueryBuilder.js";
import { createTableAccessor } from "../shared/table-accessor.js";
import { INTERNAL } from "./methods.js";
export class TransactionClient {
    client;
    relq;
    schema;
    constructor(client, relq) {
        this.client = client;
        this.relq = relq;
        const internal = this.relq[INTERNAL];
        this.schema = internal.getSchema?.() ?? this.relq.schema;
    }
    get dialect() { return this.relq.dialect; }
    get capabilities() { return this.relq.capabilities; }
    get table() {
        return createTableAccessor(this, this.schema);
    }
    raw(query, ...params) {
        return new ConnectedRawQueryBuilder(query, params, this);
    }
    get [INTERNAL]() {
        const parentInternal = this.relq[INTERNAL];
        const queryViaClient = async (sql) => {
            const start = performance.now();
            const pgResult = await this.client.query(sql);
            return {
                result: {
                    rows: pgResult.rows,
                    rowCount: pgResult.rowCount,
                    command: pgResult.command,
                    fields: pgResult.fields?.map((f) => ({ name: f.name, dataTypeID: f.dataTypeID })) ?? [],
                },
                duration: performance.now() - start,
            };
        };
        const buildMetadata = (result, duration) => ({
            rowCount: result.rowCount,
            command: result.command,
            duration,
            fields: result.fields,
        });
        return {
            executeQuery: queryViaClient,
            async executeSelect(sql, tableName) {
                const { result, duration } = await queryViaClient(sql);
                const rows = tableName
                    ? parentInternal.transformResultsFromDb(tableName, result.rows)
                    : result.rows;
                return { data: rows, metadata: buildMetadata(result, duration) };
            },
            async executeSelectOne(sql, tableName) {
                const { result, duration } = await queryViaClient(sql);
                const row = result.rows[0]
                    ? (tableName ? parentInternal.transformFromDbColumns(tableName, result.rows[0]) : result.rows[0])
                    : null;
                return { data: row, metadata: buildMetadata(result, duration) };
            },
            async executeCount(sql) {
                const { result, duration } = await queryViaClient(sql);
                const count = result.rows[0]?.count ? parseInt(result.rows[0].count, 10) : 0;
                return { count, metadata: buildMetadata(result, duration) };
            },
            async executeRun(sql) {
                const { result, duration } = await queryViaClient(sql);
                return { success: true, metadata: buildMetadata(result, duration) };
            },
            transformToDbColumns: parentInternal.transformToDbColumns,
            transformFromDbColumns: parentInternal.transformFromDbColumns,
            transformResultsFromDb: parentInternal.transformResultsFromDb,
            hasColumnMapping: parentInternal.hasColumnMapping,
            validateData: parentInternal.validateData,
            getSchema: parentInternal.getSchema,
            getRelations: parentInternal.getRelations,
            getTableDef: parentInternal.getTableDef,
            getClientForCursor: async () => ({ client: this.client, release: () => { } }),
        };
    }
}
export async function executeTransaction(relq, callback) {
    await relq.ensureInitialized();
    const { client, release } = await relq[INTERNAL].getClientForCursor();
    try {
        await client.query('BEGIN');
        const tx = new TransactionClient(client, relq);
        const result = await callback(tx);
        await client.query('COMMIT');
        return result;
    }
    catch (error) {
        try {
            await client.query('ROLLBACK');
        }
        catch { }
        throw error;
    }
    finally {
        release();
    }
}
