import { getDialectFeatures, validateColumnType, isIndexMethodSupported, } from "../dialect-support/index.js";
export function validateSchemaForDialect(schema, options) {
    const { dialect, includeInfo = false, checkPortability = false, allowedCustomTypes = [] } = options;
    const features = getDialectFeatures(dialect);
    const errors = [];
    const warnings = [];
    const info = [];
    const summary = {
        tablesChecked: 0,
        columnsChecked: 0,
        indexesChecked: 0,
        triggersChecked: 0,
        functionsChecked: 0,
        sequencesChecked: 0,
        viewsChecked: 0,
    };
    if (schema.tables) {
        for (const [tableName, table] of Object.entries(schema.tables)) {
            summary.tablesChecked++;
            validateTable(table, tableName, features, errors, warnings, info, allowedCustomTypes, summary);
        }
    }
    if (schema.triggers) {
        for (const [triggerName, trigger] of Object.entries(schema.triggers)) {
            summary.triggersChecked++;
            validateTrigger(trigger, triggerName, features, errors, warnings);
        }
    }
    if (schema.functions) {
        for (const [funcName, func] of Object.entries(schema.functions)) {
            summary.functionsChecked++;
            validateFunction(func, funcName, features, errors, warnings);
        }
    }
    if (schema.sequences) {
        for (const [seqName, seq] of Object.entries(schema.sequences)) {
            summary.sequencesChecked++;
            validateSequence(seq, seqName, features, errors, warnings);
        }
    }
    if (schema.views) {
        summary.viewsChecked += Object.keys(schema.views).length;
    }
    if (schema.materializedViews) {
        for (const [viewName, view] of Object.entries(schema.materializedViews)) {
            summary.viewsChecked++;
            validateMaterializedView(view, viewName, features, errors, warnings);
        }
    }
    if (checkPortability && includeInfo) {
        addPortabilityNotes(schema, info);
    }
    return {
        valid: errors.length === 0,
        dialect,
        errors,
        warnings,
        info: includeInfo ? info : [],
        summary,
    };
}
function validateTable(table, tableName, features, errors, warnings, info, allowedCustomTypes, summary) {
    for (const [colName, colConfig] of Object.entries(table.$columns)) {
        summary.columnsChecked++;
        validateColumn(colConfig, `${tableName}.${colName}`, features, errors, warnings, allowedCustomTypes);
    }
    if (table.$indexes) {
        for (const index of table.$indexes) {
            summary.indexesChecked++;
            validateIndex(index, tableName, features, errors, warnings);
        }
    }
    validateTableFeatures(table, tableName, features, errors, warnings);
}
function validateColumn(column, location, features, errors, warnings, allowedCustomTypes) {
    const colType = column.$sqlType || (typeof column.$type === 'string' ? column.$type : undefined) || 'unknown';
    if (allowedCustomTypes.includes(colType.toUpperCase())) {
        return;
    }
    const typeResult = validateColumnType(colType, features.dialect);
    if (!typeResult.supported) {
        errors.push({
            severity: 'error',
            code: 'UNSUPPORTED_TYPE',
            message: `Column type '${colType}' is not supported in ${features.name}`,
            location,
            suggestion: typeResult.alternative || 'Use a supported type',
            docsUrl: typeResult.docsUrl || features.docsUrl,
        });
    }
    if (column.$array && !features.supports.arrayColumns) {
        errors.push({
            severity: 'error',
            code: 'UNSUPPORTED_ARRAY',
            message: `Array columns are not supported in ${features.name}`,
            location,
            suggestion: 'Use JSONB to store array data',
        });
    }
    if (column.$identity && !features.supports.identityColumns) {
        errors.push({
            severity: 'error',
            code: 'UNSUPPORTED_IDENTITY',
            message: `IDENTITY columns are not supported in ${features.name}`,
            location,
            suggestion: 'Use SERIAL or application-generated IDs',
        });
    }
    if (column.$collate && features.dialect === 'dsql') {
        warnings.push({
            severity: 'warning',
            code: 'COLLATION_LIMITED',
            message: `Custom collations may have limited support in ${features.name}`,
            location,
            suggestion: 'DSQL only supports C collation',
        });
    }
}
function validateIndex(index, tableName, features, errors, warnings) {
    const location = `${tableName}.${index.name}`;
    if (index.using) {
        const method = index.using.toLowerCase();
        if (!isIndexMethodSupported(method, features.dialect)) {
            errors.push({
                severity: 'error',
                code: 'UNSUPPORTED_INDEX_METHOD',
                message: `Index method '${index.using}' is not supported in ${features.name}`,
                location,
                suggestion: 'Use BTREE index method',
            });
        }
    }
    if (index.nullsNotDistinct && !features.supports.nullsNotDistinct) {
        errors.push({
            severity: 'error',
            code: 'UNSUPPORTED_NULLS_NOT_DISTINCT',
            message: `NULLS NOT DISTINCT is not supported in ${features.name}`,
            location,
            suggestion: 'Remove NULLS NOT DISTINCT or use application logic',
        });
    }
    if (index.include && index.include.length > 0) {
        if (features.dialect === 'cockroachdb') {
            warnings.push({
                severity: 'warning',
                code: 'INCLUDE_SYNTAX',
                message: `CockroachDB uses STORING instead of INCLUDE for covering indexes`,
                location,
                suggestion: 'SQL generation will automatically use STORING syntax',
            });
        }
    }
}
function validateTableFeatures(table, tableName, features, errors, warnings) {
    if (table.$partitionBy && !features.supports.partitioning) {
        if (features.dialect === 'dsql') {
            warnings.push({
                severity: 'warning',
                code: 'AUTO_PARTITIONING',
                message: `Manual partitioning not supported in ${features.name}`,
                location: tableName,
                suggestion: 'DSQL handles partitioning automatically',
            });
        }
        else {
            errors.push({
                severity: 'error',
                code: 'UNSUPPORTED_PARTITIONING',
                message: `Table partitioning is not supported in ${features.name}`,
                location: tableName,
            });
        }
    }
    if (table.$constraints) {
        for (const constraint of table.$constraints) {
            if (constraint.$type === 'EXCLUDE' && !features.supports.exclusionConstraints) {
                errors.push({
                    severity: 'error',
                    code: 'UNSUPPORTED_EXCLUSION',
                    message: `EXCLUSION constraints are not supported in ${features.name}`,
                    location: tableName,
                    suggestion: 'Use unique constraints or application logic',
                });
            }
        }
    }
    if (table.$foreignKeys) {
        for (const fk of table.$foreignKeys) {
            if (!features.supports.foreignKeys) {
                warnings.push({
                    severity: 'warning',
                    code: 'FK_NOT_ENFORCED',
                    message: `Foreign keys may not be enforced in ${features.name}`,
                    location: `${tableName}.FK`,
                    suggestion: 'Use application-level referential integrity',
                });
                break;
            }
        }
    }
}
function validateTrigger(trigger, triggerName, features, errors, warnings) {
    if (!features.supports.triggers) {
        errors.push({
            severity: 'error',
            code: 'UNSUPPORTED_TRIGGERS',
            message: `Triggers are not supported in ${features.name}`,
            location: triggerName,
            suggestion: 'Use application code, AWS EventBridge, or Lambda functions',
        });
    }
}
function validateFunction(func, funcName, features, errors, warnings) {
    if (!features.supports.functions) {
        errors.push({
            severity: 'error',
            code: 'UNSUPPORTED_FUNCTIONS',
            message: `Stored functions/procedures are not supported in ${features.name}`,
            location: funcName,
            suggestion: 'Use application code or serverless functions',
        });
        return;
    }
    const language = func.$options?.language;
    if (language && language !== 'sql') {
        if (features.dialect === 'cockroachdb') {
            warnings.push({
                severity: 'warning',
                code: 'LIMITED_PLPGSQL',
                message: `PL/pgSQL support is limited in ${features.name}`,
                location: funcName,
                suggestion: 'Some PL/pgSQL constructs may not work. Use SQL language when possible.',
            });
        }
    }
}
function validateSequence(seq, seqName, features, errors, warnings) {
    if (!features.supports.sequences) {
        errors.push({
            severity: 'error',
            code: 'UNSUPPORTED_SEQUENCES',
            message: `Sequences are not supported in ${features.name}`,
            location: seqName,
            suggestion: 'Use SERIAL columns or application-generated IDs (UUID)',
        });
    }
}
function validateMaterializedView(view, viewName, features, errors, warnings) {
    if (!features.supports.materializedViews) {
        errors.push({
            severity: 'error',
            code: 'UNSUPPORTED_MATERIALIZED_VIEWS',
            message: `Materialized views are not supported in ${features.name}`,
            location: viewName,
            suggestion: 'Use application-level caching or regular views',
        });
    }
}
function addPortabilityNotes(schema, info) {
    info.push({
        severity: 'info',
        code: 'PORTABILITY_CHECK',
        message: 'Schema was checked for portability across all PostgreSQL-family dialects',
    });
    if (schema.tables) {
        const hasTriggers = Object.keys(schema.triggers || {}).length > 0;
        const hasFunctions = Object.keys(schema.functions || {}).length > 0;
        const hasSequences = Object.keys(schema.sequences || {}).length > 0;
        if (!hasTriggers && !hasFunctions && !hasSequences) {
            info.push({
                severity: 'info',
                code: 'DSQL_COMPATIBLE',
                message: 'Schema structure is compatible with AWS Aurora DSQL (no triggers, functions, or sequences)',
            });
        }
    }
}
