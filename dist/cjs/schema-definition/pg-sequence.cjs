"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pgSequence = pgSequence;
exports.generateSequenceSQL = generateSequenceSQL;
exports.dropSequenceSQL = dropSequenceSQL;
exports.isSequenceConfig = isSequenceConfig;
function pgSequence(name, options = {}) {
    return {
        _type: 'sequence',
        name,
        options,
    };
}
function generateSequenceSQL(seq) {
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
function dropSequenceSQL(seq) {
    return `DROP SEQUENCE IF EXISTS ${seq.name};`;
}
function isSequenceConfig(value) {
    return (typeof value === 'object' &&
        value !== null &&
        '_type' in value &&
        value._type === 'sequence');
}
