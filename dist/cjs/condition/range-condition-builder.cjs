"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RangeConditionCollector = void 0;
exports.buildRangeConditionSQL = buildRangeConditionSQL;
const pg_format_1 = __importDefault(require("../utils/pg-format.cjs"));
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
class RangeConditionCollector {
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
exports.RangeConditionCollector = RangeConditionCollector;
function buildRangeConditionSQL(condition) {
    const { method, column, values } = condition;
    switch (method) {
        case 'range_contains':
            return (0, pg_format_1.default)('%I @> %L', column, values);
        case 'range_contained_by':
            return (0, pg_format_1.default)('%I <@ %L', column, values);
        case 'range_overlaps':
            return (0, pg_format_1.default)('%I && %L', column, values);
        case 'range_strictly_left':
            return (0, pg_format_1.default)('%I << %L', column, values);
        case 'range_strictly_right':
            return (0, pg_format_1.default)('%I >> %L', column, values);
        case 'range_adjacent':
            return (0, pg_format_1.default)('%I -|- %L', column, values);
        default:
            return '';
    }
}
