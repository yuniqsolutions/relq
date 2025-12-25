import format from "../addon/pg-format/index.js";
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
            values: range
        });
        return this.parent;
    }
    overlaps(column, range) {
        this.parent.conditions.push({
            method: 'range_overlaps',
            column,
            values: range
        });
        return this.parent;
    }
    strictlyLeft(column, range) {
        this.parent.conditions.push({
            method: 'range_strictly_left',
            column,
            values: range
        });
        return this.parent;
    }
    strictlyRight(column, range) {
        this.parent.conditions.push({
            method: 'range_strictly_right',
            column,
            values: range
        });
        return this.parent;
    }
    adjacent(column, range) {
        this.parent.conditions.push({
            method: 'range_adjacent',
            column,
            values: range
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
