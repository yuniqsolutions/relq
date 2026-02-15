import { MySQLAdapter } from "./index.js";
import { MARIADB_FEATURES } from "./features.js";
export class MariaDBAdapter extends MySQLAdapter {
    dialect = 'mariadb';
    displayName = 'MariaDB';
    features = MARIADB_FEATURES;
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
