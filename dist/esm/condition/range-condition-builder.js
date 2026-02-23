import format from "../utils/pg-format.js";
function rangeToSQL(range) {
    if (typeof range === 'string')
        return range;
    if (Array.isArray(range)) {
        const [start, end] = range;
        const startStr = start instanceof Date ? start.toISOString() : String(start);
        const endStr = end instanceof Date ? end.toISOString() : String(end);
        return `[${startStr},${endStr})`;
    }
    const rangeObj = range;
    const startBracket = rangeObj.startBound === 'exclusive' ? '(' : '[';
    const endBracket = rangeObj.endBound === 'inclusive' ? ']' : ')';
    const startStr = rangeObj.start instanceof Date ? rangeObj.start.toISOString() : String(rangeObj.start);
    const endStr = rangeObj.end instanceof Date ? rangeObj.end.toISOString() : String(rangeObj.end);
    return `${startBracket}${startStr},${endStr}${endBracket}`;
}
export class RangeConditionCollector {
    parent;
    constructor(parent) {
        this.parent = parent;
    }
    contains(column, value) {
        this.parent.conditions.push({
            method: 'range_contains',
            column,
            values: value
        });
        return this.parent;
    }
    containedBy(column, range) {
        this.parent.conditions.push({
            method: 'range_contained_by',
            column,
            values: rangeToSQL(range)
        });
        return this.parent;
    }
    overlaps(column, range) {
        this.parent.conditions.push({
            method: 'range_overlaps',
            column,
            values: rangeToSQL(range)
        });
        return this.parent;
    }
    strictlyLeft(column, range) {
        this.parent.conditions.push({
            method: 'range_strictly_left',
            column,
            values: rangeToSQL(range)
        });
        return this.parent;
    }
    strictlyRight(column, range) {
        this.parent.conditions.push({
            method: 'range_strictly_right',
            column,
            values: rangeToSQL(range)
        });
        return this.parent;
    }
    adjacent(column, range) {
        this.parent.conditions.push({
            method: 'range_adjacent',
            column,
            values: rangeToSQL(range)
        });
        return this.parent;
    }
}
export function buildRangeConditionSQL(condition) {
    const { method, column, values } = condition;
    switch (method) {
        case 'range_contains':
            return format('%I @> %L', column, values);
        case 'range_contained_by':
            return format('%I <@ %L', column, values);
        case 'range_overlaps':
            return format('%I && %L', column, values);
        case 'range_strictly_left':
            return format('%I << %L', column, values);
        case 'range_strictly_right':
            return format('%I >> %L', column, values);
        case 'range_adjacent':
            return format('%I -|- %L', column, values);
        default:
            return '';
    }
}
