export function pgSequence(name, options = {}) {
    const config = {
        $type: 'sequence',
        name,
        options,
        toAST() {
            return {
                name: this.name,
                startValue: this.options.start,
                increment: this.options.increment,
                minValue: this.options.minValue ?? undefined,
                maxValue: this.options.maxValue ?? undefined,
                cache: this.options.cache,
                cycle: this.options.cycle ?? false,
                ownedBy: this.options.ownedBy ? parseOwnedBy(this.options.ownedBy) : undefined,
                trackingId: this.$trackingId,
            };
        },
    };
    return config;
}
function parseOwnedBy(ownedBy) {
    const parts = ownedBy.split('.');
    if (parts.length === 2) {
        return { table: parts[0], column: parts[1] };
    }
    return undefined;
}
export function generateSequenceSQL(seq) {
    const parts = [`CREATE SEQUENCE ${seq.name}`];
    if (seq.options.as) {
        parts.push(`AS ${seq.options.as.toUpperCase()}`);
    }
    if (seq.options.start !== undefined) {
        parts.push(`START WITH ${seq.options.start}`);
    }
    if (seq.options.increment !== undefined) {
        parts.push(`INCREMENT BY ${seq.options.increment}`);
    }
    if (seq.options.minValue === null) {
        parts.push('NO MINVALUE');
    }
    else if (seq.options.minValue !== undefined) {
        parts.push(`MINVALUE ${seq.options.minValue}`);
    }
    if (seq.options.maxValue === null) {
        parts.push('NO MAXVALUE');
    }
    else if (seq.options.maxValue !== undefined) {
        parts.push(`MAXVALUE ${seq.options.maxValue}`);
    }
    if (seq.options.cache !== undefined) {
        parts.push(`CACHE ${seq.options.cache}`);
    }
    if (seq.options.cycle !== undefined) {
        parts.push(seq.options.cycle ? 'CYCLE' : 'NO CYCLE');
    }
    if (seq.options.ownedBy) {
        parts.push(`OWNED BY ${seq.options.ownedBy}`);
    }
    return parts.join('\n    ') + ';';
}
export function dropSequenceSQL(seq) {
    return `DROP SEQUENCE IF EXISTS ${seq.name};`;
}
export function isSequenceConfig(value) {
    return (typeof value === 'object' &&
        value !== null &&
        '$type' in value &&
        value.$type === 'sequence');
}
