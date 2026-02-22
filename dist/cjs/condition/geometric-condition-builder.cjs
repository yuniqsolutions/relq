"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeometricConditionCollector = void 0;
exports.buildGeometricConditionSQL = buildGeometricConditionSQL;
const pg_format_1 = __importDefault(require("../utils/pg-format.cjs"));
function geometricToSQL(input) {
    if (typeof input === 'string')
        return input;
    if (Array.isArray(input) && input.length === 2 && typeof input[0] === 'number' && typeof input[1] === 'number') {
        return `(${input[0]},${input[1]})`;
    }
    if (Array.isArray(input) && input.length === 2 && Array.isArray(input[0]) && typeof input[1] === 'number') {
        const [center, radius] = input;
        return `<(${center[0]},${center[1]}),${radius}>`;
    }
    if (Array.isArray(input) && input.length === 2 && Array.isArray(input[0]) && Array.isArray(input[1])) {
        const [p1, p2] = input;
        return `((${p1[0]},${p1[1]}),(${p2[0]},${p2[1]}))`;
    }
    if (Array.isArray(input) && input.length > 2) {
        const points = input;
        return `(${points.map(p => `(${p[0]},${p[1]})`).join(',')})`;
    }
    return String(input);
}
class GeometricConditionCollector {
    parent;
    constructor(parent) {
        this.parent = parent;
    }
    contains(column, value) {
        this.parent.conditions.push({
            method: 'geometric_contains',
            column,
            values: geometricToSQL(value)
        });
        return this.parent;
    }
    containedBy(column, value) {
        this.parent.conditions.push({
            method: 'geometric_contained_by',
            column,
            values: geometricToSQL(value)
        });
        return this.parent;
    }
    overlaps(column, value) {
        this.parent.conditions.push({
            method: 'geometric_overlaps',
            column,
            values: geometricToSQL(value)
        });
        return this.parent;
    }
    strictlyLeft(column, value) {
        this.parent.conditions.push({
            method: 'geometric_strictly_left',
            column,
            values: geometricToSQL(value)
        });
        return this.parent;
    }
    strictlyRight(column, value) {
        this.parent.conditions.push({
            method: 'geometric_strictly_right',
            column,
            values: geometricToSQL(value)
        });
        return this.parent;
    }
    below(column, value) {
        this.parent.conditions.push({
            method: 'geometric_below',
            column,
            values: geometricToSQL(value)
        });
        return this.parent;
    }
    above(column, value) {
        this.parent.conditions.push({
            method: 'geometric_above',
            column,
            values: geometricToSQL(value)
        });
        return this.parent;
    }
    intersects(column, value) {
        this.parent.conditions.push({
            method: 'geometric_intersects',
            column,
            values: geometricToSQL(value)
        });
        return this.parent;
    }
    isHorizontal(column) {
        this.parent.conditions.push({
            method: 'geometric_is_horizontal',
            column
        });
        return this.parent;
    }
    isVertical(column) {
        this.parent.conditions.push({
            method: 'geometric_is_vertical',
            column
        });
        return this.parent;
    }
    isParallel(column, value) {
        this.parent.conditions.push({
            method: 'geometric_is_parallel',
            column,
            values: value
        });
        return this.parent;
    }
    isPerpendicular(column, value) {
        this.parent.conditions.push({
            method: 'geometric_is_perpendicular',
            column,
            values: value
        });
        return this.parent;
    }
    sameAs(column, value) {
        this.parent.conditions.push({
            method: 'geometric_same_as',
            column,
            values: geometricToSQL(value)
        });
        return this.parent;
    }
    distanceLessThan(column, value, maxDistance) {
        this.parent.conditions.push({
            method: 'geometric_distance_lt',
            column,
            values: { value: geometricToSQL(value), threshold: maxDistance }
        });
        return this.parent;
    }
    distanceLessThanOrEqual(column, value, maxDistance) {
        this.parent.conditions.push({
            method: 'geometric_distance_lte',
            column,
            values: { value: geometricToSQL(value), threshold: maxDistance }
        });
        return this.parent;
    }
    distanceGreaterThan(column, value, minDistance) {
        this.parent.conditions.push({
            method: 'geometric_distance_gt',
            column,
            values: { value: geometricToSQL(value), threshold: minDistance }
        });
        return this.parent;
    }
    distanceBetween(column, value, minDistance, maxDistance) {
        this.parent.conditions.push({
            method: 'geometric_distance_between',
            column,
            values: { value: geometricToSQL(value), min: minDistance, max: maxDistance }
        });
        return this.parent;
    }
    isClosed(column) {
        this.parent.conditions.push({
            method: 'geometric_is_closed',
            column
        });
        return this.parent;
    }
    isOpen(column) {
        this.parent.conditions.push({
            method: 'geometric_is_open',
            column
        });
        return this.parent;
    }
}
exports.GeometricConditionCollector = GeometricConditionCollector;
function buildGeometricConditionSQL(condition) {
    const { method, column, values } = condition;
    switch (method) {
        case 'geometric_contains':
            return (0, pg_format_1.default)('%I @> %L', column, values);
        case 'geometric_contained_by':
            return (0, pg_format_1.default)('%I <@ %L', column, values);
        case 'geometric_overlaps':
            return (0, pg_format_1.default)('%I && %L', column, values);
        case 'geometric_strictly_left':
            return (0, pg_format_1.default)('%I << %L', column, values);
        case 'geometric_strictly_right':
            return (0, pg_format_1.default)('%I >> %L', column, values);
        case 'geometric_below':
            return (0, pg_format_1.default)('%I <^ %L', column, values);
        case 'geometric_above':
            return (0, pg_format_1.default)('%I >^ %L', column, values);
        case 'geometric_intersects':
            return (0, pg_format_1.default)('%I ?# %L', column, values);
        case 'geometric_is_horizontal':
            return (0, pg_format_1.default)('?- %I', column);
        case 'geometric_is_vertical':
            return (0, pg_format_1.default)('?| %I', column);
        case 'geometric_is_parallel':
            return (0, pg_format_1.default)('%I ?|| %L', column, values);
        case 'geometric_is_perpendicular':
            return (0, pg_format_1.default)('%I ?-| %L', column, values);
        case 'geometric_same_as':
            return (0, pg_format_1.default)('%I ~= %L', column, values);
        case 'geometric_distance_lt':
            return (0, pg_format_1.default)('(%I <-> %L) < %s', column, values.value, values.threshold);
        case 'geometric_distance_lte':
            return (0, pg_format_1.default)('(%I <-> %L) <= %s', column, values.value, values.threshold);
        case 'geometric_distance_gt':
            return (0, pg_format_1.default)('(%I <-> %L) > %s', column, values.value, values.threshold);
        case 'geometric_distance_between':
            return (0, pg_format_1.default)('(%I <-> %L) BETWEEN %s AND %s', column, values.value, values.min, values.max);
        case 'geometric_is_closed':
            return (0, pg_format_1.default)('isclosed(%I)', column);
        case 'geometric_is_open':
            return (0, pg_format_1.default)('isopen(%I)', column);
        default:
            return '';
    }
}
