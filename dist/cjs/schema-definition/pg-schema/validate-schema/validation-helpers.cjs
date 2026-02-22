"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateTableForDialect = validateTableForDialect;
exports.isColumnTypeSupported = isColumnTypeSupported;
exports.getSchemaUnsupportedFeatures = getSchemaUnsupportedFeatures;
exports.formatValidationReport = formatValidationReport;
const dialect_support_1 = require("../dialect-support/index.cjs");
const validators_1 = require("./validators.cjs");
function validateTableForDialect(table, dialect) {
    return (0, validators_1.validateSchemaForDialect)({ tables: { [table.$name]: table } }, { dialect });
}
function isColumnTypeSupported(columnType, dialect) {
    const result = (0, dialect_support_1.validateColumnType)(columnType, dialect);
    return result.supported;
}
function getSchemaUnsupportedFeatures(schema, dialect) {
    const result = (0, validators_1.validateSchemaForDialect)(schema, { dialect });
    return result.errors.map(e => e.code);
}
function formatValidationReport(result) {
    const lines = [];
    lines.push(`Schema Validation Report for ${result.dialect.toUpperCase()}`);
    lines.push('='.repeat(50));
    lines.push('');
    lines.push('Summary:');
    lines.push(`  Tables: ${result.summary.tablesChecked}`);
    lines.push(`  Columns: ${result.summary.columnsChecked}`);
    lines.push(`  Indexes: ${result.summary.indexesChecked}`);
    lines.push(`  Triggers: ${result.summary.triggersChecked}`);
    lines.push(`  Functions: ${result.summary.functionsChecked}`);
    lines.push(`  Sequences: ${result.summary.sequencesChecked}`);
    lines.push(`  Views: ${result.summary.viewsChecked}`);
    lines.push('');
    if (result.valid) {
        lines.push('✅ Schema is valid for ' + result.dialect);
    }
    else {
        lines.push('❌ Schema has compatibility issues');
    }
    lines.push('');
    if (result.errors.length > 0) {
        lines.push(`Errors (${result.errors.length}):`);
        for (const error of result.errors) {
            lines.push(`  ❌ [${error.code}] ${error.message}`);
            if (error.location) {
                lines.push(`     Location: ${error.location}`);
            }
            if (error.suggestion) {
                lines.push(`     Suggestion: ${error.suggestion}`);
            }
        }
        lines.push('');
    }
    if (result.warnings.length > 0) {
        lines.push(`Warnings (${result.warnings.length}):`);
        for (const warning of result.warnings) {
            lines.push(`  ⚠️ [${warning.code}] ${warning.message}`);
            if (warning.location) {
                lines.push(`     Location: ${warning.location}`);
            }
            if (warning.suggestion) {
                lines.push(`     Suggestion: ${warning.suggestion}`);
            }
        }
        lines.push('');
    }
    if (result.info.length > 0) {
        lines.push(`Info (${result.info.length}):`);
        for (const note of result.info) {
            lines.push(`  ℹ️ [${note.code}] ${note.message}`);
        }
        lines.push('');
    }
    return lines.join('\n');
}
