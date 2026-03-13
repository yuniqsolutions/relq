import { partitionStrategyFactory, partition as partitionHelper } from "../partitions.js";
import { sqlFunctions } from "../sql-expressions/index.js";
import { tableToAST } from "../../../cli/utils/schema-to-ast.js";
import { normalizeIndexDef, createIndexFactory, createIndexTableRefs, } from "./index-builder.js";
import { createCheckTableRefs, createCheckConstraintBuilder, createConstraintBuilder, } from "./constraints-builder.js";
import { createGeneratedTableRefs, createGeneratedAsFactory, } from "./generated-columns.js";
import { generateCreateTableSQL, generateIndexSQL, } from "./sql-generation.js";
function createColumnRefs(columns) {
    const refs = {};
    for (const key of Object.keys(columns)) {
        const col = columns[key];
        const colName = col.$columnName || key;
        refs[key] = colName;
    }
    return refs;
}
const indexFactory = createIndexFactory();
function validateTableForDialect(table, dialect, strict) {
    const { validateSchemaForDialect, formatValidationReport } = require('../validate-schema');
    const result = validateSchemaForDialect({ tables: { [table.$name]: table } }, { dialect });
    if (result.errors.length > 0 || result.warnings.length > 0) {
        const report = formatValidationReport(result);
        if (strict && result.errors.length > 0) {
            throw new Error(`Table '${table.$name}' is not compatible with ${dialect}:\n${report}`);
        }
        else if (result.errors.length > 0 || result.warnings.length > 0) {
            console.warn(`[Relq] Dialect validation warnings for table '${table.$name}' (${dialect}):\n${report}`);
        }
    }
}
export function defineTable(name, columns, options) {
    const columnRefs = createColumnRefs(columns);
    const indexTableRefs = createIndexTableRefs(columns);
    let resolvedIndexes;
    if (options?.indexes) {
        if (typeof options.indexes === 'function') {
            const rawIndexes = options.indexes(indexTableRefs, indexFactory, sqlFunctions);
            resolvedIndexes = rawIndexes.map(normalizeIndexDef);
        }
        else {
            resolvedIndexes = options.indexes.map(normalizeIndexDef);
        }
    }
    let resolvedPartitionBy;
    if (options?.partitionBy) {
        resolvedPartitionBy = options.partitionBy(columnRefs, partitionStrategyFactory);
    }
    let resolvedCheckConstraints;
    if (options?.checkConstraints) {
        const checkTableRefs = createCheckTableRefs(columns);
        const checkBuilder = createCheckConstraintBuilder();
        const constraints = options.checkConstraints(checkTableRefs, checkBuilder);
        resolvedCheckConstraints = constraints.map(c => ({ expression: c.expression, name: c.name }));
    }
    if (options?.generatedAs) {
        const generatedTableRefs = createGeneratedTableRefs(columns);
        const generatedAsFactory = createGeneratedAsFactory();
        const generatedDefs = options.generatedAs(generatedTableRefs, generatedAsFactory);
        for (const def of generatedDefs) {
            const colEntry = Object.entries(columns).find(([key, col]) => {
                const colName = col.$columnName || key;
                return colName === def.$column;
            });
            if (colEntry) {
                const [, col] = colEntry;
                col.$generated = { expression: def.$expression, stored: def.$stored };
            }
        }
    }
    let resolvedConstraints;
    if (options?.constraints) {
        const constraintBuilder = createConstraintBuilder();
        resolvedConstraints = options.constraints(columnRefs, constraintBuilder);
    }
    let resolvedPartitions;
    if (options?.partitions) {
        resolvedPartitions = options.partitions(partitionHelper);
    }
    const definition = {
        $name: name,
        $schema: options?.schema,
        $columns: columns,
        $primaryKey: options?.primaryKey,
        $uniqueConstraints: options?.uniqueConstraints,
        $checkConstraints: resolvedCheckConstraints,
        $constraints: resolvedConstraints,
        $foreignKeys: options?.foreignKeys,
        $indexes: resolvedIndexes,
        $inherits: options?.inherits,
        $partitionBy: resolvedPartitionBy,
        $partitions: resolvedPartitions,
        $tablespace: options?.tablespace,
        $withOptions: options?.withOptions,
        $ifNotExists: options?.ifNotExists,
        $trackingId: options?.$trackingId,
        $comment: options?.comment,
        $temporary: options?.temporary,
        $unlogged: options?.unlogged,
        $inferSelect: {},
        $inferInsert: {},
        toSQL() {
            return generateCreateTableSQL(this);
        },
        toCreateIndexSQL() {
            return generateIndexSQL(this);
        },
        toAST() {
            return tableToAST(this);
        }
    };
    if (options?.dialect) {
        validateTableForDialect(definition, options.dialect, options.dialectStrict);
    }
    return definition;
}
