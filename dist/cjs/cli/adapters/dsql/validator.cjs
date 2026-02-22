"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSchemaForDsql = validateSchemaForDsql;
exports.validateTableForDsql = validateTableForDsql;
exports.validateSqlForDsql = validateSqlForDsql;
exports.isTypeSupported = isTypeSupported;
exports.getAlternative = getAlternative;
exports.getAlternativeType = getAlternativeType;
const dsql_validator_1 = require("../../utils/dsql-validator.cjs");
const features_1 = require("./features.cjs");
function mapCategory(dsqlCategory) {
    const mapping = {
        'DATA_TYPE': 'DATA_TYPE',
        'CONSTRAINT': 'CONSTRAINT',
        'DDL': 'SYNTAX',
        'DML': 'SYNTAX',
        'FUNCTION': 'FUNCTION',
        'TRIGGER': 'TRIGGER',
        'SEQUENCE': 'FEATURE',
        'INDEX': 'INDEX',
        'TRANSACTION': 'FEATURE',
        'PERMISSION': 'SECURITY',
        'CONFIGURATION': 'FEATURE',
        'SYNTAX': 'SYNTAX',
    };
    return mapping[dsqlCategory] || 'FEATURE';
}
function convertToIssue(error, severity) {
    return {
        severity,
        category: mapCategory(error.category),
        feature: error.feature.toLowerCase(),
        location: error.location,
        message: error.message,
        alternative: error.alternative,
        docsUrl: error.docsUrl,
    };
}
function validateSchemaForDsql(schema) {
    const issues = [];
    const schemaForValidation = {
        tables: schema.tables?.map(t => ({
            name: t.name,
            columns: t.columns?.map(c => ({
                name: c.name,
                type: c.type,
                references: undefined,
            })),
        })),
        functions: schema.functions?.map(f => ({
            name: f.name,
            language: f.language,
            body: f.definition,
        })),
        triggers: schema.triggers?.map(t => ({
            name: t.name,
        })),
        sequences: [],
        extensions: [],
    };
    const baseResult = (0, dsql_validator_1.validateSchemaForDsql)(schemaForValidation);
    for (const error of baseResult.errors) {
        issues.push(convertToIssue(error, 'error'));
    }
    for (const warning of baseResult.warnings) {
        issues.push(convertToIssue(warning, 'warning'));
    }
    if (schema.constraints) {
        for (const constraint of schema.constraints) {
            if (constraint.type === 'FOREIGN KEY') {
                issues.push({
                    severity: 'warning',
                    category: 'CONSTRAINT',
                    feature: 'foreign_key',
                    location: `${constraint.schema}.${constraint.tableName}.${constraint.name}`,
                    message: 'Foreign key constraints are not enforced in DSQL',
                    alternative: features_1.DSQL_ALTERNATIVES['foreign_keys'],
                    docsUrl: 'https://docs.aws.amazon.com/aurora-dsql/latest/userguide/working-with-postgresql-compatibility-unsupported-features.html',
                });
            }
        }
    }
    for (const table of schema.tables) {
        for (const column of table.columns) {
            if (column.arrayDimensions && column.arrayDimensions > 0) {
                issues.push({
                    severity: 'error',
                    category: 'DATA_TYPE',
                    feature: 'array_column',
                    location: `${table.schema}.${table.name}.${column.name}`,
                    message: 'Array column types are not supported in DSQL',
                    alternative: features_1.DSQL_ALTERNATIVES['ARRAY'],
                    docsUrl: 'https://docs.aws.amazon.com/aurora-dsql/latest/userguide/working-with-postgresql-compatibility-supported-data-types.html',
                });
            }
            if (column.isAutoIncrement) {
                issues.push({
                    severity: 'error',
                    category: 'DATA_TYPE',
                    feature: 'auto_increment',
                    location: `${table.schema}.${table.name}.${column.name}`,
                    message: 'Auto-increment (SERIAL) types are not supported in DSQL',
                    alternative: features_1.DSQL_ALTERNATIVES['SERIAL'],
                    docsUrl: 'https://docs.aws.amazon.com/aurora-dsql/latest/userguide/working-with-postgresql-compatibility-supported-data-types.html',
                });
            }
        }
    }
    const errors = issues.filter(i => i.severity === 'error').length;
    const warnings = issues.filter(i => i.severity === 'warning').length;
    const info = issues.filter(i => i.severity === 'info').length;
    return {
        valid: errors === 0,
        issues,
        summary: { errors, warnings, info },
    };
}
function validateTableForDsql(table) {
    const issues = [];
    const location = `${table.schema}.${table.name}`;
    for (const column of table.columns) {
        const columnLocation = `${location}.${column.name}`;
        const type = column.type.toUpperCase();
        for (const unsupportedType of features_1.UNSUPPORTED_COLUMN_TYPES) {
            if (type.includes(unsupportedType)) {
                const alternative = features_1.DSQL_ALTERNATIVES[unsupportedType];
                issues.push({
                    severity: 'error',
                    category: 'DATA_TYPE',
                    feature: unsupportedType.toLowerCase(),
                    location: columnLocation,
                    message: `Column type '${column.type}' is not supported in DSQL`,
                    alternative: alternative || 'Use a supported type',
                    docsUrl: 'https://docs.aws.amazon.com/aurora-dsql/latest/userguide/working-with-postgresql-compatibility-supported-data-types.html',
                });
                break;
            }
        }
        if (column.arrayDimensions && column.arrayDimensions > 0) {
            issues.push({
                severity: 'error',
                category: 'DATA_TYPE',
                feature: 'array_column',
                location: columnLocation,
                message: 'Array column types are not supported in DSQL',
                alternative: features_1.DSQL_ALTERNATIVES['ARRAY'],
            });
        }
        if (column.isAutoIncrement) {
            issues.push({
                severity: 'error',
                category: 'DATA_TYPE',
                feature: 'auto_increment',
                location: columnLocation,
                message: 'Auto-increment columns are not supported in DSQL',
                alternative: features_1.DSQL_ALTERNATIVES['SERIAL'],
            });
        }
    }
    return issues;
}
function validateSqlForDsql(sql) {
    const issues = [];
    const errors = (0, dsql_validator_1.validateSqlForDsql)(sql);
    for (const error of errors) {
        let severity = 'error';
        if (error.feature === 'REFERENCES' || error.feature === 'FOREIGN_KEY') {
            severity = 'warning';
        }
        issues.push(convertToIssue(error, severity));
    }
    const errorCount = issues.filter(i => i.severity === 'error').length;
    const warnings = issues.filter(i => i.severity === 'warning').length;
    const info = issues.filter(i => i.severity === 'info').length;
    return {
        valid: errorCount === 0,
        issues,
        summary: { errors: errorCount, warnings, info },
    };
}
function isTypeSupported(type) {
    const upperType = type.toUpperCase();
    for (const unsupported of features_1.UNSUPPORTED_COLUMN_TYPES) {
        if (upperType.includes(unsupported)) {
            return false;
        }
    }
    if (upperType.includes('[]') || upperType.includes('ARRAY')) {
        return false;
    }
    return true;
}
function getAlternative(feature) {
    return features_1.DSQL_ALTERNATIVES[feature.toUpperCase()] ||
        features_1.DSQL_ALTERNATIVES[feature.toLowerCase()];
}
function getAlternativeType(type) {
    const upperType = type.toUpperCase();
    if (features_1.DSQL_ALTERNATIVES[upperType]) {
        return features_1.DSQL_ALTERNATIVES[upperType];
    }
    if (upperType.includes('SERIAL')) {
        return features_1.DSQL_ALTERNATIVES['SERIAL'];
    }
    if (upperType.includes('JSON')) {
        return features_1.DSQL_ALTERNATIVES['JSON'];
    }
    if (upperType.includes('[]') || upperType.includes('ARRAY')) {
        return features_1.DSQL_ALTERNATIVES['ARRAY'];
    }
    return 'Use a supported DSQL type';
}
