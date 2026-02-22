export function validateSchema(schema, features) {
    const issues = [];
    for (const table of schema.tables) {
        const tableResult = validateTable(table, features);
        issues.push(...tableResult.issues);
    }
    for (const index of schema.indexes) {
        const indexIssues = validateIndex(index, features);
        issues.push(...indexIssues);
    }
    if (schema.functions) {
        for (const fn of schema.functions) {
            if (!features.supportsStoredProcedures) {
                issues.push({
                    severity: 'error',
                    category: 'FUNCTION',
                    feature: 'stored_procedures',
                    location: `${fn.schema}.${fn.name}`,
                    message: `Function '${fn.name}' cannot be used - stored procedures not supported`,
                    alternative: 'Move logic to application layer',
                });
            }
        }
    }
    if (schema.triggers) {
        for (const trigger of schema.triggers) {
            if (!features.supportsTriggers) {
                issues.push({
                    severity: 'error',
                    category: 'TRIGGER',
                    feature: 'triggers',
                    location: `${trigger.schema}.${trigger.tableName}.${trigger.name}`,
                    message: `Trigger '${trigger.name}' cannot be used - triggers not supported`,
                    alternative: 'Use application-level event handling',
                });
            }
        }
    }
    return {
        valid: issues.filter(i => i.severity === 'error').length === 0,
        issues,
        summary: {
            errors: issues.filter(i => i.severity === 'error').length,
            warnings: issues.filter(i => i.severity === 'warning').length,
            info: issues.filter(i => i.severity === 'info').length,
        },
    };
}
export function validateTable(table, features) {
    const issues = [];
    const location = `${table.schema}.${table.name}`;
    if (table.type === 'materialized_view' && !features.supportsMaterializedViews) {
        issues.push({
            severity: 'error',
            category: 'FEATURE',
            feature: 'materialized_views',
            location,
            message: `Materialized view '${table.name}' not supported`,
            alternative: 'Use regular view or caching at application layer',
        });
    }
    if (table.type === 'foreign_table' && !features.supportsForeignTables) {
        issues.push({
            severity: 'error',
            category: 'FEATURE',
            feature: 'foreign_tables',
            location,
            message: `Foreign table '${table.name}' not supported`,
            alternative: 'Use application-level data federation',
        });
    }
    if (table.partitioning && !features.supportsTablePartitioning) {
        issues.push({
            severity: 'error',
            category: 'FEATURE',
            feature: 'table_partitioning',
            location,
            message: `Table partitioning not supported for '${table.name}'`,
            alternative: 'Use application-level sharding or multiple tables',
        });
    }
    for (const column of table.columns) {
        const columnIssues = validateColumn(column, features, location);
        issues.push(...columnIssues);
    }
    return {
        valid: issues.filter(i => i.severity === 'error').length === 0,
        issues,
        summary: {
            errors: issues.filter(i => i.severity === 'error').length,
            warnings: issues.filter(i => i.severity === 'warning').length,
            info: issues.filter(i => i.severity === 'info').length,
        },
    };
}
function validateColumn(column, features, tableLocation) {
    const issues = [];
    const location = `${tableLocation}.${column.name}`;
    const typeIssue = validateColumnType(column, features, location);
    if (typeIssue) {
        issues.push(typeIssue);
    }
    if (column.isGenerated && !features.supportsGeneratedColumns) {
        issues.push({
            severity: 'error',
            category: 'FEATURE',
            feature: 'generated_columns',
            location,
            message: `Generated column '${column.name}' not supported`,
            alternative: 'Compute value in application or use trigger (if supported)',
        });
    }
    if (column.isAutoIncrement) {
        const type = column.type.toLowerCase();
        if (type.includes('serial') && !features.supportsSerial) {
            issues.push({
                severity: 'error',
                category: 'DATA_TYPE',
                feature: 'serial',
                location,
                message: `SERIAL type not supported for '${column.name}'`,
                alternative: 'Use UUID PRIMARY KEY DEFAULT gen_random_uuid()',
            });
        }
    }
    return issues;
}
function validateColumnType(column, features, location) {
    const type = column.type.toLowerCase();
    const baseType = column.baseType.toLowerCase();
    if ((baseType === 'json' || baseType === 'jsonb') && !features.supportsJsonb) {
        return {
            severity: 'error',
            category: 'DATA_TYPE',
            feature: baseType,
            location,
            message: `${baseType.toUpperCase()} type not supported as column type`,
            alternative: 'Use TEXT and cast to JSON in queries',
        };
    }
    if ((type.endsWith('[]') || type.includes(' array')) && !features.supportsArrays) {
        return {
            severity: 'error',
            category: 'DATA_TYPE',
            feature: 'arrays',
            location,
            message: `Array type not supported for column '${column.name}'`,
            alternative: 'Use separate table or JSON',
        };
    }
    if (column.enumValues && column.enumValues.length > 0 && !features.supportsEnums) {
        return {
            severity: 'error',
            category: 'DATA_TYPE',
            feature: 'enums',
            location,
            message: `Enum type not supported for column '${column.name}'`,
            alternative: 'Use TEXT with CHECK constraint or VARCHAR',
        };
    }
    if (baseType === 'uuid' && !features.supportsUuid) {
        return {
            severity: 'error',
            category: 'DATA_TYPE',
            feature: 'uuid',
            location,
            message: `UUID type not supported for column '${column.name}'`,
            alternative: 'Use CHAR(36) or TEXT',
        };
    }
    if (baseType.includes('range') && !features.supportsRangeTypes) {
        return {
            severity: 'error',
            category: 'DATA_TYPE',
            feature: 'range_types',
            location,
            message: `Range type not supported for column '${column.name}'`,
            alternative: 'Use two separate columns for range bounds',
        };
    }
    if (['inet', 'cidr', 'macaddr', 'macaddr8'].includes(baseType) && !features.supportsNetworkTypes) {
        return {
            severity: 'warning',
            category: 'DATA_TYPE',
            feature: 'network_types',
            location,
            message: `Network type '${baseType}' may have limited support`,
            alternative: 'Use TEXT or VARCHAR',
        };
    }
    return null;
}
function validateIndex(index, features) {
    const issues = [];
    const location = `${index.schema}.${index.tableName}.${index.name}`;
    const indexType = index.type.toLowerCase();
    if (indexType === 'hash' && !features.supportsHashIndex) {
        issues.push({
            severity: 'error',
            category: 'INDEX',
            feature: 'hash_index',
            location,
            message: `Hash index not supported: '${index.name}'`,
            alternative: 'Use B-tree index',
        });
    }
    if (indexType === 'gist' && !features.supportsGistIndex) {
        issues.push({
            severity: 'error',
            category: 'INDEX',
            feature: 'gist_index',
            location,
            message: `GiST index not supported: '${index.name}'`,
            alternative: 'Use B-tree index or restructure data',
        });
    }
    if (indexType === 'gin' && !features.supportsGinIndex) {
        issues.push({
            severity: 'error',
            category: 'INDEX',
            feature: 'gin_index',
            location,
            message: `GIN index not supported: '${index.name}'`,
            alternative: 'Use B-tree index or application-level search',
        });
    }
    if (indexType === 'brin' && !features.supportsBrinIndex) {
        issues.push({
            severity: 'error',
            category: 'INDEX',
            feature: 'brin_index',
            location,
            message: `BRIN index not supported: '${index.name}'`,
            alternative: 'Use B-tree index',
        });
    }
    if (indexType === 'spgist' && !features.supportsSpGistIndex) {
        issues.push({
            severity: 'error',
            category: 'INDEX',
            feature: 'spgist_index',
            location,
            message: `SP-GiST index not supported: '${index.name}'`,
            alternative: 'Use B-tree or GiST index',
        });
    }
    if (index.predicate && !features.supportsPartialIndexes) {
        issues.push({
            severity: 'error',
            category: 'INDEX',
            feature: 'partial_indexes',
            location,
            message: `Partial index not supported: '${index.name}'`,
            alternative: 'Use full index on the column',
        });
    }
    if (index.includeColumns && index.includeColumns.length > 0 && !features.supportsCoveringIndexes) {
        issues.push({
            severity: 'error',
            category: 'INDEX',
            feature: 'covering_indexes',
            location,
            message: `Covering index (INCLUDE) not supported: '${index.name}'`,
            alternative: 'Add columns to the index key or remove INCLUDE',
        });
    }
    return issues;
}
const ALWAYS_SUPPORTED_TYPES = new Set([
    'smallint', 'int2', 'integer', 'int', 'int4', 'bigint', 'int8',
    'real', 'float4', 'double precision', 'float8', 'numeric', 'decimal', 'money',
    'boolean', 'bool',
    'text', 'varchar', 'character varying', 'char', 'character', 'bpchar', 'name',
    'bytea',
    'date', 'time', 'timetz', 'timestamp', 'timestamptz', 'interval',
    'uuid',
    'bit', 'varbit',
    'oid', 'regclass', 'regproc', 'regtype',
]);
export function isTypeSupported(sqlType, features) {
    const lower = sqlType.toLowerCase();
    const baseType = lower.replace(/\([^)]*\)/g, '').replace('[]', '').trim();
    if (ALWAYS_SUPPORTED_TYPES.has(baseType)) {
        return true;
    }
    if (baseType === 'json' || baseType === 'jsonb') {
        return features.supportsJsonb;
    }
    if (baseType === 'serial' || baseType === 'smallserial' || baseType === 'bigserial') {
        return features.supportsSerial;
    }
    if (baseType.includes('range')) {
        return features.supportsRangeTypes;
    }
    if (['inet', 'cidr', 'macaddr', 'macaddr8'].includes(baseType)) {
        return features.supportsNetworkTypes;
    }
    if (['point', 'line', 'lseg', 'box', 'path', 'polygon', 'circle'].includes(baseType)) {
        return features.supportsGeometry;
    }
    if (['tsvector', 'tsquery'].includes(baseType)) {
        return features.supportsFullTextSearch;
    }
    if (lower.endsWith('[]') || lower.includes(' array')) {
        return features.supportsArrays;
    }
    return true;
}
const ALTERNATIVES = {
    'serial': 'UUID PRIMARY KEY DEFAULT gen_random_uuid()',
    'bigserial': 'UUID PRIMARY KEY DEFAULT gen_random_uuid()',
    'smallserial': 'UUID PRIMARY KEY DEFAULT gen_random_uuid()',
    'json': 'TEXT (cast to JSON in queries)',
    'jsonb': 'TEXT (cast to JSONB in queries)',
    'xml': 'TEXT',
    'enum': 'TEXT with CHECK constraint',
    'array': 'Separate table or JSON',
    'range': 'Two columns for bounds',
    'geometry': 'Separate coordinate columns',
    'inet': 'TEXT or VARCHAR(45)',
    'cidr': 'TEXT or VARCHAR(43)',
    'macaddr': 'TEXT or VARCHAR(17)',
    'triggers': 'Application-level event handling',
    'stored_procedures': 'Application layer logic',
    'materialized_views': 'Regular view with caching',
    'foreign_tables': 'Application-level data federation',
    'table_partitioning': 'Multiple tables or application sharding',
    'table_inheritance': 'Shared columns in each table',
    'listen_notify': 'Polling or external message queue',
    'sequences': 'UUID or application-generated IDs',
    'domains': 'Column type with CHECK constraint',
    'exclusion_constraints': 'Application-level validation',
    'deferrable_constraints': 'Transaction restructuring',
    'hash_index': 'B-tree index',
    'gist_index': 'B-tree index (may need data restructuring)',
    'gin_index': 'B-tree index or application search',
    'brin_index': 'B-tree index',
    'spgist_index': 'B-tree or GiST index',
    'partial_indexes': 'Full index on column',
    'covering_indexes': 'Include columns in index key',
};
export function getAlternative(feature) {
    return ALTERNATIVES[feature.toLowerCase()];
}
