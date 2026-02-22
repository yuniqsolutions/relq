"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTableZoneSQL = generateTableZoneSQL;
exports.generateIndexZoneSQL = generateIndexZoneSQL;
exports.generateDatabaseZoneSQL = generateDatabaseZoneSQL;
exports.validateZoneConfig = validateZoneConfig;
function generateTableZoneSQL(tableName, config) {
    const clauses = buildZoneClauses(config);
    if (clauses.length === 0)
        return '';
    return `ALTER TABLE ${tableName} CONFIGURE ZONE USING ${clauses.join(', ')}`;
}
function generateIndexZoneSQL(tableName, indexName, config) {
    const clauses = buildZoneClauses(config);
    if (clauses.length === 0)
        return '';
    return `ALTER INDEX ${tableName}@${indexName} CONFIGURE ZONE USING ${clauses.join(', ')}`;
}
function generateDatabaseZoneSQL(dbName, config) {
    const clauses = buildZoneClauses(config);
    if (clauses.length === 0)
        return '';
    return `ALTER DATABASE ${dbName} CONFIGURE ZONE USING ${clauses.join(', ')}`;
}
function validateZoneConfig(config) {
    const errors = [];
    if (config.numReplicas !== undefined && config.numReplicas < 1) {
        errors.push('numReplicas must be at least 1.');
    }
    if (config.gcTtlSeconds !== undefined && config.gcTtlSeconds < 0) {
        errors.push('gcTtlSeconds must be non-negative.');
    }
    if (config.rangeMinBytes !== undefined && config.rangeMinBytes < 0) {
        errors.push('rangeMinBytes must be non-negative.');
    }
    if (config.rangeMaxBytes !== undefined && config.rangeMaxBytes < 0) {
        errors.push('rangeMaxBytes must be non-negative.');
    }
    if (config.rangeMinBytes !== undefined && config.rangeMaxBytes !== undefined) {
        if (config.rangeMinBytes > config.rangeMaxBytes) {
            errors.push('rangeMinBytes must not exceed rangeMaxBytes.');
        }
    }
    return errors;
}
function buildZoneClauses(config) {
    const clauses = [];
    if (config.numReplicas !== undefined) {
        clauses.push(`num_replicas = ${config.numReplicas}`);
    }
    if (config.constraints !== undefined) {
        if (Array.isArray(config.constraints)) {
            const formatted = config.constraints.map(c => `'${c}'`).join(', ');
            clauses.push(`constraints = '[${formatted}]'`);
        }
        else {
            const entries = Object.entries(config.constraints)
                .map(([region, count]) => `+region=${region}: ${count}`)
                .join(', ');
            clauses.push(`constraints = '{${entries}}'`);
        }
    }
    if (config.leasePreferences !== undefined && config.leasePreferences.length > 0) {
        const prefs = config.leasePreferences.map(p => `+region=${p}`).join(', ');
        clauses.push(`lease_preferences = '[[${prefs}]]'`);
    }
    if (config.gcTtlSeconds !== undefined) {
        clauses.push(`gc.ttlseconds = ${config.gcTtlSeconds}`);
    }
    if (config.rangeMinBytes !== undefined) {
        clauses.push(`range_min_bytes = ${config.rangeMinBytes}`);
    }
    if (config.rangeMaxBytes !== undefined) {
        clauses.push(`range_max_bytes = ${config.rangeMaxBytes}`);
    }
    return clauses;
}
