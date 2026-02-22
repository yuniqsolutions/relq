"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MariaDBAdapter = void 0;
const index_1 = require("./index.cjs");
const features_1 = require("./features.cjs");
class MariaDBAdapter extends index_1.MySQLAdapter {
    dialect = 'mariadb';
    displayName = 'MariaDB';
    features = features_1.MARIADB_FEATURES;
    async getDatabaseVersion(connection) {
        const version = await super.getDatabaseVersion(connection);
        return `MariaDB ${version}`;
    }
    validate(schema) {
        const result = super.validate(schema);
        const filteredIssues = result.issues.filter(issue => {
            if (issue.feature === 'sequence') {
                return false;
            }
            return true;
        });
        const errors = filteredIssues.filter(i => i.severity === 'error').length;
        const warnings = filteredIssues.filter(i => i.severity === 'warning').length;
        const info = filteredIssues.filter(i => i.severity === 'info').length;
        return {
            valid: errors === 0,
            issues: filteredIssues,
            summary: { errors, warnings, info },
        };
    }
}
exports.MariaDBAdapter = MariaDBAdapter;
