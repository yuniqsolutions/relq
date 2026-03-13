import { createDsqlMessage } from "./errors.js";
export function validateDsqlTrigger(input, tableName) {
    const messages = [];
    const location = { tableName };
    if (input.isDrop) {
        messages.push(createDsqlMessage('DSQL-TRIG-002', location));
    }
    else {
        messages.push(createDsqlMessage('DSQL-TRIG-001', location));
    }
    return messages;
}
export function validateDsqlTriggers(triggers, tableName) {
    const messages = [];
    for (const t of triggers) {
        messages.push(...validateDsqlTrigger(t, tableName));
    }
    return messages;
}
