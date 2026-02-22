"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateLocalitySQL = generateLocalitySQL;
exports.generateDatabaseConfigSQL = generateDatabaseConfigSQL;
exports.validateLocality = validateLocality;
exports.validateDatabaseConfig = validateDatabaseConfig;
const errors_1 = require("./errors.cjs");
function generateLocalitySQL(tableName, locality) {
    switch (locality.type) {
        case 'regional-by-table':
            if (locality.region) {
                return `ALTER TABLE ${tableName} SET LOCALITY REGIONAL BY TABLE IN '${locality.region}'`;
            }
            return `ALTER TABLE ${tableName} SET LOCALITY REGIONAL BY TABLE`;
        case 'regional-by-row':
            if (locality.column) {
                return `ALTER TABLE ${tableName} SET LOCALITY REGIONAL BY ROW AS ${locality.column}`;
            }
            return `ALTER TABLE ${tableName} SET LOCALITY REGIONAL BY ROW`;
        case 'global':
            return `ALTER TABLE ${tableName} SET LOCALITY GLOBAL`;
    }
}
function generateDatabaseConfigSQL(dbName, config) {
    const statements = [];
    if (config.primaryRegion) {
        statements.push(`ALTER DATABASE ${dbName} PRIMARY REGION '${config.primaryRegion}'`);
    }
    if (config.regions) {
        for (const region of config.regions) {
            if (region !== config.primaryRegion) {
                statements.push(`ALTER DATABASE ${dbName} ADD REGION '${region}'`);
            }
        }
    }
    if (config.survivalGoal) {
        const goal = config.survivalGoal === 'region' ? 'REGION FAILURE' : 'ZONE FAILURE';
        statements.push(`ALTER DATABASE ${dbName} SURVIVE ${goal}`);
    }
    if (config.superRegions) {
        for (const [name, regions] of Object.entries(config.superRegions)) {
            const regionList = regions.map(r => `'${r}'`).join(', ');
            statements.push(`ALTER DATABASE ${dbName} ADD SUPER REGION "${name}" VALUES ${regionList}`);
        }
    }
    return statements;
}
function validateLocality(locality, databaseConfig, tableName) {
    const messages = [];
    const location = { tableName };
    const hasRegions = databaseConfig?.regions && databaseConfig.regions.length > 0;
    if (locality.type === 'regional-by-row' && !hasRegions) {
        messages.push((0, errors_1.createMessage)('CRDB_E700', location));
    }
    if (locality.type === 'global' && !hasRegions) {
        messages.push((0, errors_1.createMessage)('CRDB_E701', location));
    }
    return messages;
}
function validateDatabaseConfig(config) {
    const messages = [];
    if (config.survivalGoal === 'region') {
        const regionCount = config.regions?.length ?? 0;
        if (regionCount < 3) {
            messages.push((0, errors_1.createMessage)('CRDB_E702'));
        }
    }
    if (config.superRegions && config.regions) {
        const validRegions = new Set(config.regions);
        for (const [, regions] of Object.entries(config.superRegions)) {
            for (const region of regions) {
                if (!validRegions.has(region)) {
                    messages.push((0, errors_1.createMessage)('CRDB_E703'));
                    break;
                }
            }
        }
    }
    return messages;
}
