import { MySQLAdapter } from "./index.js";
import { PLANETSCALE_FEATURES } from "./features.js";
export class PlanetScaleAdapter extends MySQLAdapter {
    dialect = 'planetscale';
    displayName = 'PlanetScale';
    features = PLANETSCALE_FEATURES;
    async testConnection(connection) {
        const psConfig = connection;
        try {
            const { Client } = await this.loadPlanetScaleDriver();
            const client = new Client({
                url: psConfig.url,
                host: psConfig.host,
                username: psConfig.user,
                password: psConfig.password,
            });
            await client.execute('SELECT 1');
            return true;
        }
        catch (error) {
            return super.testConnection(connection);
        }
    }
    async getDatabaseVersion(connection) {
        const version = await super.getDatabaseVersion(connection);
        return `PlanetScale (Vitess ${version})`;
    }
    validate(schema) {
        const issues = [];
        if (schema.triggers && schema.triggers.length > 0) {
            for (const trigger of schema.triggers) {
                issues.push({
                    severity: 'error',
                    category: 'TRIGGER',
                    feature: 'trigger',
                    location: `${trigger.tableName}.${trigger.name}`,
                    message: 'Triggers are not supported in PlanetScale',
                    alternative: 'Move trigger logic to application code or use webhooks',
                });
            }
        }
        if (schema.functions && schema.functions.length > 0) {
            for (const func of schema.functions) {
                issues.push({
                    severity: 'warning',
                    category: 'FUNCTION',
                    feature: 'stored_procedure',
                    location: func.name,
                    message: 'Stored procedures have limited support in PlanetScale',
                    alternative: 'Move logic to application code or use serverless functions',
                });
            }
        }
        for (const constraint of schema.constraints || []) {
            if (constraint.type === 'FOREIGN KEY') {
                issues.push({
                    severity: 'warning',
                    category: 'CONSTRAINT',
                    feature: 'foreign_key',
                    location: `${constraint.tableName}.${constraint.name}`,
                    message: 'Foreign keys are a beta feature in PlanetScale and must be enabled per-database',
                    alternative: 'Enable foreign keys in PlanetScale settings or implement referential integrity in application',
                    docsUrl: 'https://planetscale.com/docs/concepts/foreign-key-constraints',
                });
            }
        }
        for (const table of schema.tables) {
            issues.push(...this.validateTableForPlanetScale(table));
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
    validateTableForPlanetScale(table) {
        const issues = [];
        const hasPrimaryKey = table.columns.some(c => c.isPrimaryKey);
        if (!hasPrimaryKey) {
            issues.push({
                severity: 'warning',
                category: 'CONSTRAINT',
                feature: 'primary_key',
                location: table.name,
                message: 'Tables should have a primary key for proper sharding in PlanetScale',
                alternative: 'Add a primary key column, preferably UUID or auto-increment',
            });
        }
        const parentIssues = super.validateTable(table);
        issues.push(...parentIssues.issues);
        return issues;
    }
    getAlternative(feature) {
        const alternatives = {
            'trigger': 'Application code or webhooks',
            'stored_procedure': 'Serverless functions or application code',
            'foreign_key': 'Enable in PlanetScale settings (beta) or implement in application',
            'cross_shard_fk': 'Not supported - redesign to avoid cross-shard relationships',
        };
        return alternatives[feature.toLowerCase()] || super.getAlternative(feature);
    }
    async loadPlanetScaleDriver() {
        try {
            const moduleName = '@planetscale/database';
            return await eval(`import('${moduleName}')`);
        }
        catch (error) {
            throw new Error('PlanetScale driver not found. Install it with:\n' +
                '  npm install @planetscale/database\n' +
                '  # or\n' +
                '  bun add @planetscale/database');
        }
    }
}
