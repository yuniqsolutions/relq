"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defineTable = defineTable;
const partitions_1 = require("../partitions.cjs");
const sql_expressions_1 = require("../sql-expressions/index.cjs");
const schema_to_ast_1 = require("../../../cli/utils/schema-to-ast.cjs");
const index_builder_1 = require("./index-builder.cjs");
const constraints_builder_1 = require("./constraints-builder.cjs");
const generated_columns_1 = require("./generated-columns.cjs");
const sql_generation_1 = require("./sql-generation.cjs");
function createColumnRefs(columns) {
    const refs = {};
    for (const key of Object.keys(columns)) {
        const col = columns[key];
        const colName = col.$columnName || key;
        refs[key] = colName;
    }
    return refs;
}
const indexFactory = (0, index_builder_1.createIndexFactory)();
function validateTableForDialect(table, dialect, strict) {
    const { validateSchemaForDialect, formatValidationReport } = require("../validate-schema/index.cjs");
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
function defineTable(name, columns, options) {
    const columnRefs = createColumnRefs(columns);
    const indexTableRefs = (0, index_builder_1.createIndexTableRefs)(columns);
    let resolvedIndexes;
    if (options?.indexes) {
        if (typeof options.indexes === 'function') {
            const rawIndexes = options.indexes(indexTableRefs, indexFactory, sql_expressions_1.sqlFunctions);
            resolvedIndexes = rawIndexes.map(index_builder_1.normalizeIndexDef);
        }
        else {
            resolvedIndexes = options.indexes.map(index_builder_1.normalizeIndexDef);
        }
    }
    let resolvedPartitionBy;
    if (options?.partitionBy) {
        resolvedPartitionBy = options.partitionBy(columnRefs, partitions_1.partitionStrategyFactory);
    }
    let resolvedCheckConstraints;
    if (options?.checkConstraints) {
        const checkTableRefs = (0, constraints_builder_1.createCheckTableRefs)(columns);
        const checkBuilder = (0, constraints_builder_1.createCheckConstraintBuilder)();
        const constraints = options.checkConstraints(checkTableRefs, checkBuilder);
        resolvedCheckConstraints = constraints.map(c => ({ expression: c.expression, name: c.name }));
    }
    if (options?.generatedAs) {
        const generatedTableRefs = (0, generated_columns_1.createGeneratedTableRefs)(columns);
        const generatedAsFactory = (0, generated_columns_1.createGeneratedAsFactory)();
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
        const constraintBuilder = (0, constraints_builder_1.createConstraintBuilder)();
        resolvedConstraints = options.constraints(columnRefs, constraintBuilder);
    }
    let resolvedPartitions;
    if (options?.partitions) {
        resolvedPartitions = options.partitions(partitions_1.partition);
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
            return (0, sql_generation_1.generateCreateTableSQL)(this);
        },
        toCreateIndexSQL() {
            return (0, sql_generation_1.generateIndexSQL)(this);
        },
        toAST() {
            return (0, schema_to_ast_1.tableToAST)(this);
        }
    };
    if (options?.dialect) {
        validateTableForDialect(definition, options.dialect, options.dialectStrict);
    }
    return definition;
}
