"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BLOCKED_TRIGGER_FEATURES = void 0;
exports.validateTrigger = validateTrigger;
exports.validateTriggers = validateTriggers;
const errors_1 = require("./errors.cjs");
function validateTrigger(trigger, tableName) {
    const messages = [];
    const location = { tableName, triggerName: trigger.name };
    if (trigger.updateOfColumns && trigger.updateOfColumns.length > 0) {
        messages.push((0, errors_1.createMessage)('CRDB_E500', location));
    }
    if (trigger.events?.includes('truncate')) {
        messages.push((0, errors_1.createMessage)('CRDB_E501', location));
    }
    if (trigger.referencingOldTable) {
        messages.push((0, errors_1.createMessage)('CRDB_E502', location));
    }
    if (trigger.referencingNewTable) {
        messages.push((0, errors_1.createMessage)('CRDB_E503', location));
    }
    if (trigger.isConstraintTrigger) {
        messages.push((0, errors_1.createMessage)('CRDB_E504', location));
    }
    if (trigger.dropCascade) {
        messages.push((0, errors_1.createMessage)('CRDB_E505', location));
    }
    if (trigger.functionBody && containsTgArgv(trigger.functionBody)) {
        messages.push((0, errors_1.createMessage)('CRDB_W500', location));
    }
    return messages;
}
function validateTriggers(triggers) {
    const messages = [];
    for (const { trigger, tableName } of triggers) {
        messages.push(...validateTrigger(trigger, tableName));
    }
    return messages;
}
exports.BLOCKED_TRIGGER_FEATURES = [
    'UPDATE OF <column_list>',
    'TRUNCATE event',
    'REFERENCING OLD TABLE AS (transition tables)',
    'REFERENCING NEW TABLE AS (transition tables)',
    'CREATE CONSTRAINT TRIGGER',
    'DROP TRIGGER CASCADE',
];
function containsTgArgv(body) {
    return /\bTG_ARGV\b/i.test(body);
}
