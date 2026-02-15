import { createDsqlMessage } from "./errors.js";
import { DSQL_DATABASE_LIMITS, DSQL_TABLE_LIMITS } from "./limits.js";
export function validateDsqlView(input) {
    const messages = [];
    const location = { tableName: input.name };
    if (input.materialized) {
        messages.push(createDsqlMessage('DSQL-VIEW-001', location));
    }
    if (input.isRefresh) {
        messages.push(createDsqlMessage('DSQL-VIEW-002', location));
    }
    if (input.definition) {
        const sizeBytes = new TextEncoder().encode(input.definition).length;
        if (sizeBytes > DSQL_TABLE_LIMITS.MAX_VIEW_DEF_BYTES) {
            messages.push(createDsqlMessage('DSQL-VIEW-004', location));
        }
    }
    return messages;
}
export function validateDsqlViewCount(viewCount) {
    const messages = [];
    if (viewCount > DSQL_DATABASE_LIMITS.MAX_VIEWS) {
        messages.push(createDsqlMessage('DSQL-VIEW-003'));
    }
    return messages;
}
export function validateDsqlViews(views) {
    const messages = [];
    if (views.length > DSQL_DATABASE_LIMITS.MAX_VIEWS) {
        messages.push(createDsqlMessage('DSQL-VIEW-003'));
    }
    for (const v of views) {
        messages.push(...validateDsqlView(v));
    }
    return messages;
}
