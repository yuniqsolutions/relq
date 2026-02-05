"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.XATA_FEATURES = exports.XataAdapter = void 0;
const features_1 = require("./features.cjs");
const introspect_1 = require("./introspect.cjs");
class XataAdapter {
    dialect = 'xata';
    family = 'xata';
    displayName = 'Xata';
    features = features_1.XATA_FEATURES;
    defaultPort = 443;
    defaultUser = '';
    quoteChar = '"';
    client = null;
    async testConnection(connection) {
        try {
            const client = await this.createClient(connection);
            await client.getBranchDetails();
            return true;
        }
        catch (error) {
            return false;
        }
    }
    async getDatabaseVersion(connection) {
        try {
            const client = await this.createClient(connection);
            const branch = await client.getBranchDetails();
            return `Xata (Branch: ${branch.branchName || 'main'})`;
        }
        catch {
            return 'Xata';
        }
    }
    async introspect(connection, options) {
        const client = await this.createClient(connection);
        const config = connection;
        const fetchSchema = async () => {
            const branch = await client.getBranchDetails();
            return branch.schema || { tables: [] };
        };
        const databaseName = config.database || this.extractDatabaseName(config.databaseURL || '');
        return await (0, introspect_1.introspectXata)(fetchSchema, databaseName, options);
    }
    async introspectTable(connection, tableName, schema) {
        const dbSchema = await this.introspect(connection);
        return dbSchema.tables.find(t => t.name === tableName) || null;
    }
    async listTables(connection, schema) {
        const client = await this.createClient(connection);
        const branch = await client.getBranchDetails();
        const tables = branch.schema?.tables || [];
        return tables.map((t) => t.name);
    }
    async listSchemas(connection) {
        const client = await this.createClient(connection);
        const branches = await client.getBranches();
        return branches.branches?.map((b) => b.name) || ['main'];
    }
    validate(schema) {
        const issues = [];
        if (schema.triggers && schema.triggers.length > 0) {
            for (const trigger of schema.triggers) {
                issues.push({
                    severity: 'error',
                    category: 'TRIGGER',
                    feature: 'trigger',
                    location: trigger.name,
                    message: 'Triggers are not supported in Xata',
                    alternative: 'Use Xata webhooks or application logic',
                });
            }
        }
        if (schema.functions && schema.functions.length > 0) {
            for (const func of schema.functions) {
                issues.push({
                    severity: 'error',
                    category: 'FUNCTION',
                    feature: 'stored_procedure',
                    location: func.name,
                    message: 'Stored procedures are not supported in Xata',
                    alternative: 'Use serverless functions or application code',
                });
            }
        }
        const pgSchema = schema;
        if (pgSchema.sequences && pgSchema.sequences.length > 0) {
            for (const seq of pgSchema.sequences) {
                issues.push({
                    severity: 'error',
                    category: 'FEATURE',
                    feature: 'sequence',
                    location: seq.name,
                    message: 'Sequences are not supported in Xata (uses string IDs)',
                    alternative: 'Use Xata auto-generated string IDs',
                });
            }
        }
        for (const table of schema.tables) {
            issues.push(...this.validateTableInternal(table));
        }
        if (schema.tables.length > features_1.XATA_LIMITS.maxTablesPerDatabase) {
            issues.push({
                severity: 'error',
                category: 'FEATURE',
                feature: 'table_count',
                location: 'database',
                message: `Xata supports maximum ${features_1.XATA_LIMITS.maxTablesPerDatabase} tables per database`,
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
    validateTable(table) {
        const issues = this.validateTableInternal(table);
        const errors = issues.filter(i => i.severity === 'error').length;
        const warnings = issues.filter(i => i.severity === 'warning').length;
        const info = issues.filter(i => i.severity === 'info').length;
        return {
            valid: errors === 0,
            issues,
            summary: { errors, warnings, info },
        };
    }
    validateTableInternal(table) {
        const issues = [];
        if (table.columns.length > features_1.XATA_LIMITS.maxColumnsPerTable) {
            issues.push({
                severity: 'error',
                category: 'FEATURE',
                feature: 'column_count',
                location: table.name,
                message: `Xata supports maximum ${features_1.XATA_LIMITS.maxColumnsPerTable} columns per table`,
            });
        }
        for (const column of table.columns) {
            const type = column.type.toLowerCase();
            if (!this.isTypeSupported(type)) {
                const xataType = features_1.POSTGRES_TO_XATA_TYPE_MAP[type];
                if (xataType) {
                    issues.push({
                        severity: 'warning',
                        category: 'DATA_TYPE',
                        feature: type,
                        location: `${table.name}.${column.name}`,
                        message: `Type '${type}' will be converted to Xata type '${xataType}'`,
                    });
                }
                else {
                    issues.push({
                        severity: 'error',
                        category: 'DATA_TYPE',
                        feature: type,
                        location: `${table.name}.${column.name}`,
                        message: `Type '${type}' is not supported in Xata`,
                        alternative: this.getAlternative(type),
                    });
                }
            }
            if (column.isGenerated && column.name !== 'id' && column.name !== 'xata') {
                issues.push({
                    severity: 'error',
                    category: 'FEATURE',
                    feature: 'generated_column',
                    location: `${table.name}.${column.name}`,
                    message: 'Generated columns are not supported in Xata',
                    alternative: 'Compute values in application code',
                });
            }
            if (column.name === 'id' || column.name === 'xata') {
                issues.push({
                    severity: 'info',
                    category: 'FEATURE',
                    feature: 'reserved_column',
                    location: `${table.name}.${column.name}`,
                    message: `Column '${column.name}' is reserved by Xata and will be auto-managed`,
                });
            }
        }
        return issues;
    }
    isTypeSupported(sqlType) {
        const type = sqlType.toLowerCase();
        const supportedTypes = Object.keys(features_1.POSTGRES_TO_XATA_TYPE_MAP);
        const unsupported = [
            'interval', 'money', 'bytea', 'bit', 'varbit',
            'inet', 'cidr', 'macaddr', 'macaddr8',
            'point', 'line', 'lseg', 'box', 'path', 'polygon', 'circle',
            'tsvector', 'tsquery', 'xml',
            'int4range', 'int8range', 'numrange', 'tsrange', 'tstzrange', 'daterange',
        ];
        if (unsupported.some(t => type === t || type.startsWith(t))) {
            return false;
        }
        return supportedTypes.some(t => type === t || type.startsWith(t));
    }
    getAlternative(feature) {
        const alternatives = {
            'trigger': 'Use Xata webhooks or application logic',
            'stored_procedure': 'Use serverless functions or application code',
            'function': 'Use serverless functions or application code',
            'sequence': 'Use Xata auto-generated string IDs',
            'serial': 'Use Xata auto-generated string IDs',
            'bigserial': 'Use Xata auto-generated string IDs',
            'interval': 'Store as string or separate fields',
            'money': 'Use float or integer (cents)',
            'bytea': 'Use Xata file attachments',
            'geometry': 'Store coordinates as JSON',
            'geography': 'Store coordinates as JSON',
            'inet': 'Use string type',
            'cidr': 'Use string type',
            'macaddr': 'Use string type',
            'tsvector': 'Xata has built-in full-text search',
            'tsquery': 'Xata has built-in full-text search',
            'jsonb': 'Use json type',
            'array': 'Use multiple type for string arrays, or json for complex arrays',
        };
        return alternatives[feature.toLowerCase()];
    }
    generateCreateTable(table, options) {
        const lines = [];
        lines.push(`-- Xata schema (for reference only)`);
        lines.push(`-- Use 'xata schema edit' or the SDK to modify schema`);
        lines.push(`CREATE TABLE "${table.name}" (`);
        const columnDefs = [];
        for (const col of table.columns) {
            let def = `    "${col.name}" ${col.type}`;
            if (!col.nullable)
                def += ' NOT NULL';
            if (col.defaultValue)
                def += ` DEFAULT ${col.defaultValue}`;
            columnDefs.push(def);
        }
        lines.push(columnDefs.join(',\n'));
        lines.push(');');
        return {
            sql: lines.join('\n'),
            type: 'CREATE',
            destructive: false,
            affects: [table.name],
        };
    }
    generateCreateIndex(index, options) {
        return {
            sql: `-- Xata automatically manages indexes\n-- Index: ${index.name}`,
            type: 'CREATE',
            destructive: false,
            affects: [index.tableName],
        };
    }
    generateAlterTable(from, to, options) {
        return [{
                sql: `-- Use Xata CLI or SDK to modify schema\n-- xata schema edit ${to.name}`,
                type: 'ALTER',
                destructive: false,
                affects: [to.name],
            }];
    }
    generateDropTable(tableName, options) {
        return {
            sql: `-- Use Xata CLI to delete table\n-- xata schema delete ${tableName}`,
            type: 'DROP',
            destructive: true,
            affects: [tableName],
        };
    }
    quoteIdentifier(identifier) {
        return `"${identifier.replace(/"/g, '""')}"`;
    }
    escapeString(value) {
        return `'${value.replace(/'/g, "''")}'`;
    }
    mapTypeToFriendly(internalType) {
        return features_1.POSTGRES_TO_XATA_TYPE_MAP[internalType.toLowerCase()] || internalType;
    }
    mapTypeToInternal(friendlyType) {
        const entries = Object.entries(features_1.POSTGRES_TO_XATA_TYPE_MAP);
        const found = entries.find(([_, v]) => v === friendlyType.toLowerCase());
        return found ? found[0] : friendlyType;
    }
    getTypeScriptType(sqlType) {
        const type = sqlType.toLowerCase();
        if (type === 'int' || type === 'float') {
            return 'number';
        }
        if (type === 'bool' || type === 'boolean') {
            return 'boolean';
        }
        if (type === 'datetime') {
            return 'Date';
        }
        if (type === 'json') {
            return 'unknown';
        }
        if (type === 'multiple') {
            return 'string[]';
        }
        if (type === 'file') {
            return 'XataFile';
        }
        if (type === 'file[]') {
            return 'XataFile[]';
        }
        if (type === 'vector') {
            return 'number[]';
        }
        if (type === 'link') {
            return 'string';
        }
        return 'string';
    }
    getParamPlaceholder(index) {
        return `$${index}`;
    }
    getMigrationTableDDL(tableName) {
        return `CREATE TABLE IF NOT EXISTS ${this.quoteIdentifier(tableName)} (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    filename TEXT NOT NULL,
    hash TEXT NOT NULL,
    batch INTEGER NOT NULL,
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    execution_time_ms INTEGER,
    metadata JSONB
);`;
    }
    validateSql(_sql, _context) {
        return {
            valid: true,
            issues: [],
            summary: { errors: 0, warnings: 0, info: 0 },
        };
    }
    async listBranches(connection) {
        const client = await this.createClient(connection);
        const branches = await client.getBranches();
        return branches.branches?.map((b) => b.name) || ['main'];
    }
    async getCurrentBranch(connection) {
        return connection.branch || 'main';
    }
    async createBranch(connection, branchName, fromBranch) {
        const client = await this.createClient(connection);
        await client.createBranch(branchName, { from: fromBranch || 'main' });
    }
    async deleteBranch(connection, branchName) {
        if (branchName === 'main') {
            throw new Error('Cannot delete main branch');
        }
        const client = await this.createClient(connection);
        await client.deleteBranch(branchName);
    }
    async createClient(config) {
        try {
            const moduleName = '@xata.io/client';
            const xata = await eval(`import('${moduleName}')`);
            let apiKey = config.apiKey;
            let workspace = config.workspace;
            let region = config.region;
            let database = config.database;
            let branch = config.branch || 'main';
            if (config.databaseURL) {
                const parsed = this.parseDatabaseURL(config.databaseURL);
                workspace = parsed.workspace;
                region = parsed.region;
                database = parsed.database;
                branch = parsed.branch || branch;
            }
            apiKey = apiKey || process.env.XATA_API_KEY;
            if (!apiKey) {
                throw new Error('Xata API key not provided');
            }
            const XataClient = xata.XataClient || xata.default?.XataClient;
            if (!XataClient) {
                throw new Error('Could not find XataClient in @xata.io/client');
            }
            return new XataClient({
                apiKey,
                workspace,
                region,
                branch,
                databaseURL: config.databaseURL,
            });
        }
        catch (error) {
            if (error instanceof Error && error.message.includes('Xata')) {
                throw error;
            }
            throw new Error('Xata client not found. Install it with:\n' +
                '  npm install @xata.io/client\n' +
                '  # or\n' +
                '  bun add @xata.io/client');
        }
    }
    parseDatabaseURL(url) {
        try {
            const urlObj = new URL(url);
            const hostParts = urlObj.hostname.split('.');
            const workspace = hostParts[0];
            const region = hostParts[1];
            const pathParts = urlObj.pathname.split('/');
            const dbPart = pathParts[pathParts.indexOf('db') + 1] || '';
            const [database, branch] = dbPart.split(':');
            return { workspace, region, database, branch };
        }
        catch {
            return {};
        }
    }
    extractDatabaseName(url) {
        const parsed = this.parseDatabaseURL(url);
        return parsed.database || 'xata';
    }
}
exports.XataAdapter = XataAdapter;
var features_2 = require("./features.cjs");
Object.defineProperty(exports, "XATA_FEATURES", { enumerable: true, get: function () { return features_2.XATA_FEATURES; } });
