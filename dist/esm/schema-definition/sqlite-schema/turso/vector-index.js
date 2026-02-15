import { quoteSQLiteIdentifier } from "../table-definition/sql-generation.js";
export function generateVectorIndexSQL(config) {
    let sql = 'CREATE INDEX';
    if (config.ifNotExists)
        sql += ' IF NOT EXISTS';
    sql += ` ${quoteSQLiteIdentifier(config.name)}`;
    sql += ` ON ${quoteSQLiteIdentifier(config.table)}`;
    const args = [quoteSQLiteIdentifier(config.column)];
    if (config.metric) {
        args.push(`'metric=${config.metric}'`);
    }
    if (config.compressNeighbors) {
        args.push(`'compress_neighbors=${config.compressNeighbors}'`);
    }
    sql += `(libsql_vector_idx(${args.join(', ')}))`;
    return sql + ';';
}
export function vectorTopK(indexName, vectorParam, k) {
    return `vector_top_k('${indexName}', ${vectorParam}, ${k})`;
}
export function vectorDistanceCos(column, vectorParam) {
    return `vector_distance_cos(${quoteSQLiteIdentifier(column)}, ${vectorParam})`;
}
export function vectorDistanceL2(column, vectorParam) {
    return `vector_distance_l2(${quoteSQLiteIdentifier(column)}, ${vectorParam})`;
}
export function toVector32(values) {
    return `vector32('[${values.join(',')}]')`;
}
export function toVector64(values) {
    return `vector64('[${values.join(',')}]')`;
}
