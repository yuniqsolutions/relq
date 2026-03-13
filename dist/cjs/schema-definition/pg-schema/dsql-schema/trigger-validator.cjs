"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateDsqlTrigger = validateDsqlTrigger;
exports.validateDsqlTriggers = validateDsqlTriggers;
const errors_1 = require("./errors.cjs");
function validateDsqlTrigger(input, tableName) {
    const messages = [];
    const location = { tableName };
    if (input.isDrop) {
        messages.push((0, errors_1.createDsqlMessage)('DSQL-TRIG-002', location));
    }
    else {
        messages.push((0, errors_1.createDsqlMessage)('DSQL-TRIG-001', location));
    }
    return messages;
}
function validateDsqlTriggers(triggers, tableName) {
    const messages = [];
    for (const t of triggers) {
        messages.push(...validateDsqlTrigger(t, tableName));
    }
    return messages;
}
