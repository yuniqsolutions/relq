"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSqlForCockroachDB = validateSqlForCockroachDB;
exports.validateSchemaForCockroachDB = validateSchemaForCockroachDB;
exports.validateTableForCockroachDB = validateTableForCockroachDB;
exports.getAlternativeType = getAlternativeType;
exports.isTypeSupported = isTypeSupported;
const features_1 = require("./features.cjs");
function validateSqlForCockroachDB(sql) {
    const issues = [];
    for (const typeCheck of features_1.UNSUPPORTED_DATA_TYPES) {
        if (typeCheck.pattern.test(sql)) {
            issues.push({
                severity: 'error',
                category: 'DATA_TYPE',
                feature: typeCheck.name,
                message: `Data type '${typeCheck.name}' is not supported in CockroachDB`,
                alternative: typeCheck.alternative,
            });
        }
    }
    for (const feature of features_1.UNSUPPORTED_SQL_FEATURES) {
        if (feature.pattern.test(sql)) {
            issues.push({
                severity: feature.severity,
                category: 'FEATURE',
                feature: feature.name,
                message: `'${feature.name}' is not supported in CockroachDB`,
                alternative: feature.alternative,
            });
        }
    }
    if (/\bCREATE\s+(OR\s+REPLACE\s+)?FUNCTION\b/i.test(sql)) {
        for (const limitation of features_1.PLPGSQL_LIMITATIONS) {
            if (limitation.pattern.test(sql)) {
                issues.push({
                    severity: 'error',
                    category: 'SYNTAX',
                    feature: limitation.name,
                    message: `PL/pgSQL feature '${limitation.name}' is not supported in CockroachDB`,
                    alternative: limitation.alternative,
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
function validateSchemaForCockroachDB(schema) {
    const issues = [];
    for (const table of schema.tables) {
        const tableResult = validateTableForCockroachDB(table);
        issues.push(...tableResult.issues);
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
function validateTableForCockroachDB(table) {
    const issues = [];
    for (const column of table.columns) {
        const typeCheck = checkColumnType(column.type);
        if (typeCheck) {
            issues.push({
                severity: 'error',
                category: 'DATA_TYPE',
                feature: typeCheck.name,
                location: `${table.schema}.${table.name}.${column.name}`,
                message: `Column uses unsupported type '${typeCheck.name}'`,
                alternative: typeCheck.alternative,
            });
        }
    }
    const hasSerialPK = table.columns.some(c => c.isPrimaryKey && (c.type === 'serial' || c.type === 'bigserial' || c.isAutoIncrement));
    if (hasSerialPK) {
        issues.push({
            severity: 'warning',
            category: 'PERFORMANCE',
            feature: 'SERIAL Primary Key',
            location: `${table.schema}.${table.name}`,
            message: 'SERIAL primary key may not distribute well in CockroachDB',
            alternative: 'Consider UUID with gen_random_uuid() for better distribution',
        });
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
function checkColumnType(type) {
    const upperType = type.toUpperCase();
    for (const typeCheck of features_1.UNSUPPORTED_DATA_TYPES) {
        if (typeCheck.pattern.test(upperType)) {
            return {
                name: typeCheck.name,
                alternative: typeCheck.alternative,
            };
        }
    }
    return null;
}
function getAlternativeType(type) {
    const upperType = type.toUpperCase();
    const typeMap = {
        'MONEY': 'NUMERIC(19,4)',
        'XML': 'TEXT',
        'POINT': 'GEOMETRY',
        'LINE': 'TEXT',
        'LSEG': 'TEXT',
        'BOX': 'TEXT',
        'PATH': 'TEXT',
        'POLYGON': 'GEOMETRY',
        'CIRCLE': 'TEXT',
        'INT4RANGE': 'JSONB',
        'INT8RANGE': 'JSONB',
        'NUMRANGE': 'JSONB',
        'TSRANGE': 'JSONB',
        'TSTZRANGE': 'JSONB',
        'DATERANGE': 'JSONB',
        'TSVECTOR': 'TEXT',
        'TSQUERY': 'TEXT',
        'CIDR': 'INET',
        'MACADDR': 'VARCHAR(17)',
        'MACADDR8': 'VARCHAR(23)',
        'OID': 'BIGINT',
        'REGCLASS': 'TEXT',
        'REGPROC': 'TEXT',
        'REGTYPE': 'TEXT',
    };
    return typeMap[upperType] || type;
}
function isTypeSupported(type) {
    return checkColumnType(type) === null;
}
