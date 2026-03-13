import { PG_CAPABILITIES } from "../pg-client/capabilities.js";
export class PgDialect {
    name = 'postgres';
    quoteIdentifier(name) {
        return `"${name.replace(/"/g, '""')}"`;
    }
    quoteString(value) {
        return `'${value.replace(/'/g, "''")}'`;
    }
    formatBoolean(value) {
        return value ? 'TRUE' : 'FALSE';
    }
    returning(columns) {
        return `RETURNING ${columns.map(c => c === '*' ? '*' : this.quoteIdentifier(c)).join(', ')}`;
    }
    upsert(conflictColumns, updateColumns) {
        const cols = conflictColumns.map(c => this.quoteIdentifier(c)).join(', ');
        const sets = Object.keys(updateColumns)
            .map(c => `${this.quoteIdentifier(c)} = EXCLUDED.${this.quoteIdentifier(c)}`)
            .join(', ');
        return `ON CONFLICT (${cols}) DO UPDATE SET ${sets}`;
    }
    distinctOn(columns) {
        return `DISTINCT ON (${columns.map(c => this.quoteIdentifier(c)).join(', ')})`;
    }
    lateralSubquery(subquery, alias) {
        return `JOIN LATERAL (${subquery}) AS ${this.quoteIdentifier(alias)} ON TRUE`;
    }
    jsonAgg(expression, alias) {
        return `COALESCE(jsonb_agg(${expression}), '[]'::jsonb) AS ${this.quoteIdentifier(alias)}`;
    }
    rowToJson(alias) {
        return `row_to_json(${alias}.*)`;
    }
    explain(query, options) {
        const parts = ['EXPLAIN'];
        if (options.format)
            parts.push(`(FORMAT ${options.format.toUpperCase()}`);
        if (options.analyze)
            parts.push(options.format ? ', ANALYZE' : '(ANALYZE');
        if (options.verbose)
            parts.push(options.format || options.analyze ? ', VERBOSE' : '(VERBOSE');
        if (options.format || options.analyze || options.verbose)
            parts.push(')');
        return `${parts.join(' ')} ${query}`;
    }
    typeCast(expression, targetType) {
        return `${expression}::${targetType}`;
    }
    currentTimestamp() {
        return 'NOW()';
    }
    randomUuid() {
        return 'gen_random_uuid()';
    }
    supports(capability) {
        return PG_CAPABILITIES[capability] === true;
    }
    transformSql(sql) {
        return sql;
    }
}
export const pgDialect = new PgDialect();
