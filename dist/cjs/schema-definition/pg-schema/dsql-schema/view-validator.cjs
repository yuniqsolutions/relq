"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateDsqlView = validateDsqlView;
exports.validateDsqlViewCount = validateDsqlViewCount;
exports.validateDsqlViews = validateDsqlViews;
const errors_1 = require("./errors.cjs");
const limits_1 = require("./limits.cjs");
function validateDsqlView(input) {
    const messages = [];
    const location = { tableName: input.name };
    if (input.materialized) {
        messages.push((0, errors_1.createDsqlMessage)('DSQL-VIEW-001', location));
    }
    if (input.isRefresh) {
        messages.push((0, errors_1.createDsqlMessage)('DSQL-VIEW-002', location));
    }
    if (input.definition) {
        const sizeBytes = new TextEncoder().encode(input.definition).length;
        if (sizeBytes > limits_1.DSQL_TABLE_LIMITS.MAX_VIEW_DEF_BYTES) {
            messages.push((0, errors_1.createDsqlMessage)('DSQL-VIEW-004', location));
        }
    }
    return messages;
}
function validateDsqlViewCount(viewCount) {
    const messages = [];
    if (viewCount > limits_1.DSQL_DATABASE_LIMITS.MAX_VIEWS) {
        messages.push((0, errors_1.createDsqlMessage)('DSQL-VIEW-003'));
    }
    return messages;
}
function validateDsqlViews(views) {
    const messages = [];
    if (views.length > limits_1.DSQL_DATABASE_LIMITS.MAX_VIEWS) {
        messages.push((0, errors_1.createDsqlMessage)('DSQL-VIEW-003'));
    }
    for (const v of views) {
        messages.push(...validateDsqlView(v));
    }
    return messages;
}
