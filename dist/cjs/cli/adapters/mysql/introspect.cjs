"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.introspectMySQL = introspectMySQL;
const GET_TABLES_SQL = `
SELECT
    TABLE_NAME as name,
    TABLE_SCHEMA as \`schema\`,
    TABLE_TYPE as type,
    TABLE_COMMENT as comment,
    ENGINE as engine,
    TABLE_ROWS as row_estimate
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_TYPE IN ('BASE TABLE', 'VIEW')
ORDER BY TABLE_NAME
`;
const GET_COLUMNS_SQL = `
SELECT
    COLUMN_NAME as name,
    DATA_TYPE as data_type,
    COLUMN_TYPE as column_type,
    IS_NULLABLE as nullable,
    COLUMN_DEFAULT as default_value,
    EXTRA as extra,
    CHARACTER_MAXIMUM_LENGTH as max_length,
    NUMERIC_PRECISION as precision,
    NUMERIC_SCALE as scale,
    COLUMN_KEY as column_key,
    COLUMN_COMMENT as comment,
    ORDINAL_POSITION as ordinal_position,
    GENERATION_EXPRESSION as generation_expression
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = ?
ORDER BY ORDINAL_POSITION
`;
const GET_INDEXES_SQL = `
SELECT
    INDEX_NAME as name,
    TABLE_NAME as table_name,
    NON_UNIQUE as non_unique,
    INDEX_TYPE as type,
    COLUMN_NAME as column_name,
    SEQ_IN_INDEX as seq,
    COLLATION as direction,
    CARDINALITY as cardinality,
    SUB_PART as sub_part,
    NULLABLE as nullable,
    INDEX_COMMENT as comment
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = ?
ORDER BY INDEX_NAME, SEQ_IN_INDEX
`;
const GET_CONSTRAINTS_SQL = `
SELECT
    tc.CONSTRAINT_NAME as name,
    tc.TABLE_NAME as table_name,
    tc.CONSTRAINT_TYPE as type,
    kcu.COLUMN_NAME as column_name,
    kcu.REFERENCED_TABLE_NAME as referenced_table,
    kcu.REFERENCED_COLUMN_NAME as referenced_column,
    rc.UPDATE_RULE as on_update,
    rc.DELETE_RULE as on_delete
FROM information_schema.TABLE_CONSTRAINTS tc
LEFT JOIN information_schema.KEY_COLUMN_USAGE kcu
    ON tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
    AND tc.TABLE_SCHEMA = kcu.TABLE_SCHEMA
    AND tc.TABLE_NAME = kcu.TABLE_NAME
LEFT JOIN information_schema.REFERENTIAL_CONSTRAINTS rc
    ON tc.CONSTRAINT_NAME = rc.CONSTRAINT_NAME
    AND tc.TABLE_SCHEMA = rc.CONSTRAINT_SCHEMA
WHERE tc.TABLE_SCHEMA = DATABASE()
ORDER BY tc.TABLE_NAME, tc.CONSTRAINT_NAME
`;
const GET_TRIGGERS_SQL = `
SELECT
    TRIGGER_NAME as name,
    EVENT_OBJECT_TABLE as table_name,
    ACTION_TIMING as timing,
    EVENT_MANIPULATION as event,
    ACTION_STATEMENT as statement,
    ACTION_ORIENTATION as orientation
FROM information_schema.TRIGGERS
WHERE TRIGGER_SCHEMA = DATABASE()
ORDER BY EVENT_OBJECT_TABLE, TRIGGER_NAME
`;
const GET_ROUTINES_SQL = `
SELECT
    ROUTINE_NAME as name,
    ROUTINE_TYPE as type,
    DATA_TYPE as return_type,
    ROUTINE_DEFINITION as definition,
    ROUTINE_COMMENT as comment,
    IS_DETERMINISTIC as is_deterministic,
    SQL_DATA_ACCESS as sql_data_access
FROM information_schema.ROUTINES
WHERE ROUTINE_SCHEMA = DATABASE()
ORDER BY ROUTINE_NAME
`;
async function introspectMySQL(executeQuery, databaseName, options) {
    const schema = {
        database: databaseName,
        tables: [],
        indexes: [],
        constraints: [],
    };
    const tableRows = await executeQuery(GET_TABLES_SQL);
    for (const row of tableRows) {
        if (row.type === 'VIEW' && !options?.includeViews) {
            continue;
        }
        const columnRows = await executeQuery(GET_COLUMNS_SQL, [row.name]);
        const columns = columnRows.map((col) => mapColumnInfo(col));
        const tableInfo = {
            name: row.name,
            schema: row.schema,
            type: row.type === 'VIEW' ? 'view' : 'table',
            columns,
            comment: row.comment || undefined,
            rowEstimate: row.row_estimate || undefined,
        };
        schema.tables.push(tableInfo);
        const indexRows = await executeQuery(GET_INDEXES_SQL, [row.name]);
        const indexes = aggregateIndexes(indexRows, row.schema);
        schema.indexes.push(...indexes);
    }
    const constraintRows = await executeQuery(GET_CONSTRAINTS_SQL);
    schema.constraints = aggregateConstraints(constraintRows);
    if (options?.includeTriggers) {
        const triggerRows = await executeQuery(GET_TRIGGERS_SQL);
        schema.triggers = triggerRows.map((t) => mapTriggerInfo(t));
    }
    if (options?.includeFunctions) {
        const routineRows = await executeQuery(GET_ROUTINES_SQL);
        schema.functions = routineRows
            .filter((r) => r.type === 'FUNCTION')
            .map((r) => mapFunctionInfo(r));
    }
    return schema;
}
function mapColumnInfo(row) {
    const isAutoIncrement = row.extra.includes('auto_increment');
    const isGenerated = row.extra.includes('GENERATED') || !!row.generation_expression;
    return {
        name: row.name,
        type: row.column_type,
        baseType: row.data_type,
        nullable: row.nullable === 'YES',
        defaultValue: row.default_value || undefined,
        defaultIsExpression: row.default_value?.includes('(') || false,
        isPrimaryKey: row.column_key === 'PRI',
        isAutoIncrement,
        isGenerated,
        generatedExpression: row.generation_expression || undefined,
        maxLength: row.max_length || undefined,
        precision: row.precision || undefined,
        scale: row.scale || undefined,
        comment: row.comment || undefined,
        ordinalPosition: row.ordinal_position,
    };
}
function aggregateIndexes(rows, schemaName) {
    const indexMap = new Map();
    for (const row of rows) {
        const key = `${row.table_name}.${row.name}`;
        if (!indexMap.has(key)) {
            indexMap.set(key, {
                name: row.name,
                tableName: row.table_name,
                schema: schemaName,
                columns: [],
                isUnique: row.non_unique === 0,
                isPrimary: row.name === 'PRIMARY',
                type: row.type.toLowerCase(),
                comment: row.comment || undefined,
            });
        }
        const index = indexMap.get(key);
        const columnInfo = {
            name: row.column_name,
            direction: row.direction === 'D' ? 'DESC' : 'ASC',
            nulls: 'LAST',
        };
        index.columns.push(columnInfo);
    }
    return Array.from(indexMap.values());
}
function aggregateConstraints(rows) {
    const constraintMap = new Map();
    for (const row of rows) {
        const key = `${row.table_name}.${row.name}`;
        if (!constraintMap.has(key)) {
            let type = 'CHECK';
            if (row.type === 'PRIMARY KEY')
                type = 'PRIMARY KEY';
            else if (row.type === 'UNIQUE')
                type = 'UNIQUE';
            else if (row.type === 'FOREIGN KEY')
                type = 'FOREIGN KEY';
            constraintMap.set(key, {
                name: row.name,
                tableName: row.table_name,
                schema: '',
                type,
                columns: [],
                referencedTable: row.referenced_table || undefined,
                referencedColumns: [],
                onDelete: mapReferentialAction(row.on_delete),
                onUpdate: mapReferentialAction(row.on_update),
            });
        }
        const constraint = constraintMap.get(key);
        if (row.column_name) {
            constraint.columns.push(row.column_name);
        }
        if (row.referenced_column) {
            constraint.referencedColumns.push(row.referenced_column);
        }
    }
    return Array.from(constraintMap.values());
}
function mapReferentialAction(action) {
    if (!action)
        return undefined;
    const mapping = {
        'CASCADE': 'CASCADE',
        'SET NULL': 'SET NULL',
        'SET DEFAULT': 'SET DEFAULT',
        'RESTRICT': 'RESTRICT',
        'NO ACTION': 'NO ACTION',
    };
    return mapping[action];
}
function mapTriggerInfo(row) {
    return {
        name: row.name,
        tableName: row.table_name,
        schema: '',
        timing: row.timing,
        events: [row.event],
        forEach: row.orientation === 'ROW' ? 'ROW' : 'STATEMENT',
        functionName: row.name,
    };
}
function mapFunctionInfo(row) {
    return {
        name: row.name,
        schema: '',
        arguments: '',
        returnType: row.return_type || 'void',
        language: 'SQL',
        definition: row.definition || undefined,
        volatility: row.is_deterministic === 'YES' ? 'IMMUTABLE' : 'VOLATILE',
        comment: row.comment || undefined,
    };
}
