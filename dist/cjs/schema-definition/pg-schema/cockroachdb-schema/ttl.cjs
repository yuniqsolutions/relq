"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTTLStorageParams = generateTTLStorageParams;
exports.generateAlterTableTTL = generateAlterTableTTL;
exports.generateRemoveTTL = generateRemoveTTL;
exports.validateTTL = validateTTL;
const errors_1 = require("./errors.cjs");
function generateTTLStorageParams(config) {
    const params = [];
    params.push(`ttl_expiration_expression = '${escapeSingleQuotes(config.expirationExpression)}'`);
    if (config.jobCron !== undefined) {
        params.push(`ttl_job_cron = '${config.jobCron}'`);
    }
    if (config.selectBatchSize !== undefined) {
        params.push(`ttl_select_batch_size = ${config.selectBatchSize}`);
    }
    if (config.deleteBatchSize !== undefined) {
        params.push(`ttl_delete_batch_size = ${config.deleteBatchSize}`);
    }
    if (config.deleteRateLimit !== undefined) {
        params.push(`ttl_delete_rate_limit = ${config.deleteRateLimit}`);
    }
    if (config.pause !== undefined) {
        params.push(`ttl_pause = ${config.pause}`);
    }
    if (config.disableChangefeedReplication !== undefined) {
        params.push(`ttl_disable_changefeed_replication = ${config.disableChangefeedReplication}`);
    }
    if (config.labelMetrics !== undefined) {
        params.push(`ttl_label_metrics = ${config.labelMetrics}`);
    }
    if (config.rowStatsPollInterval !== undefined) {
        params.push(`ttl_row_stats_poll_interval = '${config.rowStatsPollInterval}'`);
    }
    return params.join(', ');
}
function generateAlterTableTTL(tableName, config) {
    const params = generateTTLStorageParams(config);
    return `ALTER TABLE ${tableName} SET (${params})`;
}
function generateRemoveTTL(tableName) {
    return `ALTER TABLE ${tableName} RESET (ttl)`;
}
function validateTTL(config, tableName) {
    const messages = [];
    const location = { tableName };
    if (!config.expirationExpression || config.expirationExpression.trim() === '') {
        messages.push((0, errors_1.createMessage)('CRDB_E710', location));
    }
    if (config.jobCron !== undefined && !isValidCron(config.jobCron)) {
        messages.push((0, errors_1.createMessage)('CRDB_E711', location));
    }
    return messages;
}
function isValidCron(cron) {
    const trimmed = cron.trim();
    if (/^@(yearly|annually|monthly|weekly|daily|midnight|hourly)$/i.test(trimmed)) {
        return true;
    }
    const fields = trimmed.split(/\s+/);
    if (fields.length !== 5) {
        return false;
    }
    const fieldPattern = /^(\*|(\d+|\*)([\/\-,]\d+)*)$/;
    return fields.every(f => fieldPattern.test(f));
}
function escapeSingleQuotes(s) {
    return s.replace(/'/g, "''");
}
