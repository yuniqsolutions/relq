"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTriggerSQL = generateTriggerSQL;
exports.dropTriggerSQL = dropTriggerSQL;
exports.pgTrigger = pgTrigger;
exports.isTriggerConfig = isTriggerConfig;
function getTableName(table) {
    if (typeof table === 'string') {
        return table;
    }
    if (typeof table === 'object' && table !== null) {
        if ('$tableName' in table) {
            return table.$tableName;
        }
        if ('name' in table) {
            return table.name;
        }
    }
    throw new Error('Invalid table reference in trigger definition');
}
function getFunctionName(func) {
    if (typeof func === 'string') {
        return func;
    }
    return func.$functionName;
}
function generateTriggerSQL(config) {
    const { $triggerName, $options } = config;
    const { on, before, after, insteadOf, updateOf, forEachRow = true, forEachStatement, when, referencing, constraint, deferrable, initially, execute, executeArgs, } = $options;
    const parts = ['CREATE'];
    if (constraint) {
        parts.push('CONSTRAINT');
    }
    parts.push('TRIGGER', $triggerName);
    let timing;
    let events;
    if (before) {
        timing = 'BEFORE';
        events = Array.isArray(before) ? before : [before];
    }
    else if (after) {
        timing = 'AFTER';
        events = Array.isArray(after) ? after : [after];
    }
    else if (insteadOf) {
        timing = 'INSTEAD OF';
        events = Array.isArray(insteadOf) ? insteadOf : [insteadOf];
    }
    else {
        throw new Error('Trigger must have before, after, or insteadOf timing');
    }
    parts.push('\n    ' + timing);
    const eventStrings = events.map(event => {
        if (event === 'UPDATE' && updateOf && updateOf.length > 0) {
            return 'UPDATE OF ' + updateOf.join(', ');
        }
        return event;
    });
    parts.push(eventStrings.join(' OR '));
    parts.push('ON', getTableName(on));
    if (deferrable) {
        parts.push('\n    DEFERRABLE');
        if (initially) {
            parts.push('INITIALLY', initially);
        }
    }
    if (referencing) {
        const refParts = ['\n    REFERENCING'];
        if (referencing.oldTable) {
            refParts.push('OLD TABLE AS', referencing.oldTable);
        }
        if (referencing.newTable) {
            refParts.push('NEW TABLE AS', referencing.newTable);
        }
        parts.push(refParts.join(' '));
    }
    if (forEachStatement) {
        parts.push('\n    FOR EACH STATEMENT');
    }
    else if (forEachRow !== false) {
        parts.push('\n    FOR EACH ROW');
    }
    if (when) {
        parts.push('\n    WHEN (' + when + ')');
    }
    const funcName = getFunctionName(execute);
    const args = executeArgs ? executeArgs.join(', ') : '';
    parts.push('\n    EXECUTE FUNCTION', funcName + '(' + args + ')');
    return parts.join(' ');
}
function dropTriggerSQL(config, ifExists = true) {
    const { $triggerName, $options } = config;
    const tableName = getTableName($options.on);
    return `DROP TRIGGER ${ifExists ? 'IF EXISTS ' : ''}${$triggerName} ON ${tableName}`;
}
function pgTrigger(name, options) {
    return {
        $triggerName: name,
        $options: options,
        $type: 'trigger',
    };
}
function isTriggerConfig(value) {
    return (typeof value === 'object' &&
        value !== null &&
        '$type' in value &&
        value.$type === 'trigger');
}
