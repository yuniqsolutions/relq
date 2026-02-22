"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateVectorIndexSQL = generateVectorIndexSQL;
exports.vectorTopK = vectorTopK;
exports.vectorDistanceCos = vectorDistanceCos;
exports.vectorDistanceL2 = vectorDistanceL2;
exports.toVector32 = toVector32;
exports.toVector64 = toVector64;
const sql_generation_1 = require("../table-definition/sql-generation.cjs");
function generateVectorIndexSQL(config) {
    let sql = 'CREATE INDEX';
    if (config.ifNotExists)
        sql += ' IF NOT EXISTS';
    sql += ` ${(0, sql_generation_1.quoteSQLiteIdentifier)(config.name)}`;
    sql += ` ON ${(0, sql_generation_1.quoteSQLiteIdentifier)(config.table)}`;
    const args = [(0, sql_generation_1.quoteSQLiteIdentifier)(config.column)];
    if (config.metric) {
        args.push(`'metric=${config.metric}'`);
    }
    if (config.compressNeighbors) {
        args.push(`'compress_neighbors=${config.compressNeighbors}'`);
    }
    sql += `(libsql_vector_idx(${args.join(', ')}))`;
    return sql + ';';
}
function vectorTopK(indexName, vectorParam, k) {
    return `vector_top_k('${indexName}', ${vectorParam}, ${k})`;
}
function vectorDistanceCos(column, vectorParam) {
    return `vector_distance_cos(${(0, sql_generation_1.quoteSQLiteIdentifier)(column)}, ${vectorParam})`;
}
function vectorDistanceL2(column, vectorParam) {
    return `vector_distance_l2(${(0, sql_generation_1.quoteSQLiteIdentifier)(column)}, ${vectorParam})`;
}
function toVector32(values) {
    return `vector32('[${values.join(',')}]')`;
}
function toVector64(values) {
    return `vector64('[${values.join(',')}]')`;
}
