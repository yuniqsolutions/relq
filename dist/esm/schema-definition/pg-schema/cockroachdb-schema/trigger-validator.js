import { createMessage } from "./errors.js";
export function validateTrigger(trigger, tableName) {
    const messages = [];
    const location = { tableName, triggerName: trigger.name };
    if (trigger.updateOfColumns && trigger.updateOfColumns.length > 0) {
        messages.push(createMessage('CRDB_E500', location));
    }
    if (trigger.events?.includes('truncate')) {
        messages.push(createMessage('CRDB_E501', location));
    }
    if (trigger.referencingOldTable) {
        messages.push(createMessage('CRDB_E502', location));
    }
    if (trigger.referencingNewTable) {
        messages.push(createMessage('CRDB_E503', location));
    }
    if (trigger.isConstraintTrigger) {
        messages.push(createMessage('CRDB_E504', location));
    }
    if (trigger.dropCascade) {
        messages.push(createMessage('CRDB_E505', location));
    }
    if (trigger.functionBody && containsTgArgv(trigger.functionBody)) {
        messages.push(createMessage('CRDB_W500', location));
    }
    return messages;
}
export function validateTriggers(triggers) {
    const messages = [];
    for (const { trigger, tableName } of triggers) {
        messages.push(...validateTrigger(trigger, tableName));
    }
    return messages;
}
export const BLOCKED_TRIGGER_FEATURES = [
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
