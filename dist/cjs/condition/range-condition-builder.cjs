"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RangeConditionCollector = void 0;
exports.buildRangeConditionSQL = buildRangeConditionSQL;
const pg_format_1 = __importDefault(require("../addon/pg-format/index.cjs"));
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
