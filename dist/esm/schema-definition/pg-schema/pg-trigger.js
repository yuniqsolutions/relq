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
export function generateTriggerSQL(config) {
    const { $triggerName, $options, $commentText } = config;
    const { on, before, after, insteadOf, updateOf, forEach = 'ROW', when, referencing, constraint, deferrable, initially, execute, executeArgs, comment, } = $options;
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
    const tableName = getTableName(on);
    parts.push('ON', tableName);
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
    if (forEach === 'STATEMENT') {
        parts.push('\n    FOR EACH STATEMENT');
    }
    else {
        parts.push('\n    FOR EACH ROW');
    }
    if (when) {
        parts.push('\n    WHEN (' + when + ')');
    }
    const funcName = getFunctionName(execute);
    const args = executeArgs ? executeArgs.join(', ') : '';
    parts.push('\n    EXECUTE FUNCTION', funcName + '(' + args + ')');
    let sql = parts.join(' ');
    const commentText = $commentText || comment;
    if (commentText) {
        const escapedComment = commentText.replace(/'/g, "''");
        sql += `;\n\nCOMMENT ON TRIGGER ${$triggerName} ON ${tableName} IS '${escapedComment}'`;
    }
    return sql;
}
export function dropTriggerSQL(config, ifExists = true) {
    const { $triggerName, $options } = config;
    const tableName = getTableName($options.on);
    return `DROP TRIGGER ${ifExists ? 'IF EXISTS ' : ''}${$triggerName} ON ${tableName}`;
}
export function pgTrigger(name, options) {
    return {
        $triggerName: name,
        $options: options,
        $type: 'trigger',
        $trackingId: undefined,
        $commentText: options.comment,
        toAST() {
            const opts = this.$options;
            let timing;
            let events;
            if (opts.before) {
                timing = 'BEFORE';
                events = Array.isArray(opts.before) ? opts.before : [opts.before];
            }
            else if (opts.after) {
                timing = 'AFTER';
                events = Array.isArray(opts.after) ? opts.after : [opts.after];
            }
            else if (opts.insteadOf) {
                timing = 'INSTEAD OF';
                events = Array.isArray(opts.insteadOf) ? opts.insteadOf : [opts.insteadOf];
            }
            else {
                timing = 'BEFORE';
                events = ['INSERT'];
            }
            const forEachLevel = opts.forEach || 'ROW';
            const functionName = typeof opts.execute === 'string'
                ? opts.execute
                : opts.execute.$functionName;
            return {
                name: this.$triggerName,
                table: getTableName(opts.on),
                timing,
                events,
                forEach: forEachLevel,
                functionName,
                whenClause: opts.when,
                isConstraint: opts.constraint ?? false,
                deferrable: opts.deferrable,
                initiallyDeferred: opts.initially === 'DEFERRED',
                comment: this.$commentText,
                trackingId: this.$trackingId,
            };
        },
        $id(trackingId) {
            this.$trackingId = trackingId;
            return this;
        },
        $comment(comment) {
            this.$commentText = comment;
            return this;
        },
    };
}
export function isTriggerConfig(value) {
    return (typeof value === 'object' &&
        value !== null &&
        '$type' in value &&
        value.$type === 'trigger');
}
