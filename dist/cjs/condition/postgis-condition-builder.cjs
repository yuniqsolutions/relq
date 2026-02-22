"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostgisConditionCollector = void 0;
exports.buildPostgisConditionSQL = buildPostgisConditionSQL;
const pg_format_1 = __importDefault(require("../utils/pg-format.cjs"));
function isGeoJson(input) {
    return typeof input === 'object' && input !== null && 'type' in input && 'coordinates' in input;
}
function geometryInputToSQL(input) {
    if (isGeoJson(input)) {
        return { sql: JSON.stringify(input), isGeoJson: true };
    }
    return { sql: input, isGeoJson: false };
}
class PostgisConditionCollector {
    parent;
    constructor(parent) {
        this.parent = parent;
    }
    contains(column, geometry) {
        const { sql, isGeoJson } = geometryInputToSQL(geometry);
        this.parent.conditions.push({
            method: 'postgis_contains',
            column,
            values: { geometry: sql, isGeoJson }
        });
        return this.parent;
    }
    within(column, geometry) {
        const { sql, isGeoJson } = geometryInputToSQL(geometry);
        this.parent.conditions.push({
            method: 'postgis_within',
            column,
            values: { geometry: sql, isGeoJson }
        });
        return this.parent;
    }
    intersects(column, geometry) {
        const { sql, isGeoJson } = geometryInputToSQL(geometry);
        this.parent.conditions.push({
            method: 'postgis_intersects',
            column,
            values: { geometry: sql, isGeoJson }
        });
        return this.parent;
    }
    overlaps(column, geometry) {
        const { sql, isGeoJson } = geometryInputToSQL(geometry);
        this.parent.conditions.push({
            method: 'postgis_overlaps',
            column,
            values: { geometry: sql, isGeoJson }
        });
        return this.parent;
    }
    crosses(column, geometry) {
        const { sql, isGeoJson } = geometryInputToSQL(geometry);
        this.parent.conditions.push({
            method: 'postgis_crosses',
            column,
            values: { geometry: sql, isGeoJson }
        });
        return this.parent;
    }
    touches(column, geometry) {
        const { sql, isGeoJson } = geometryInputToSQL(geometry);
        this.parent.conditions.push({
            method: 'postgis_touches',
            column,
            values: { geometry: sql, isGeoJson }
        });
        return this.parent;
    }
    disjoint(column, geometry) {
        const { sql, isGeoJson } = geometryInputToSQL(geometry);
        this.parent.conditions.push({
            method: 'postgis_disjoint',
            column,
            values: { geometry: sql, isGeoJson }
        });
        return this.parent;
    }
    equals(column, geometry) {
        const { sql, isGeoJson } = geometryInputToSQL(geometry);
        this.parent.conditions.push({
            method: 'postgis_equals',
            column,
            values: { geometry: sql, isGeoJson }
        });
        return this.parent;
    }
    dwithin(column, geometry, distance) {
        const { sql, isGeoJson } = geometryInputToSQL(geometry);
        this.parent.conditions.push({
            method: 'postgis_dwithin',
            column,
            values: { geometry: sql, isGeoJson, distance }
        });
        return this.parent;
    }
    distanceLessThan(column, geometry, distance) {
        const { sql, isGeoJson } = geometryInputToSQL(geometry);
        this.parent.conditions.push({
            method: 'postgis_distance_lt',
            column,
            values: { geometry: sql, isGeoJson, distance }
        });
        return this.parent;
    }
    distanceGreaterThan(column, geometry, distance) {
        const { sql, isGeoJson } = geometryInputToSQL(geometry);
        this.parent.conditions.push({
            method: 'postgis_distance_gt',
            column,
            values: { geometry: sql, isGeoJson, distance }
        });
        return this.parent;
    }
    coveredBy(column, geometry) {
        const { sql, isGeoJson } = geometryInputToSQL(geometry);
        this.parent.conditions.push({
            method: 'postgis_covered_by',
            column,
            values: { geometry: sql, isGeoJson }
        });
        return this.parent;
    }
    covers(column, geometry) {
        const { sql, isGeoJson } = geometryInputToSQL(geometry);
        this.parent.conditions.push({
            method: 'postgis_covers',
            column,
            values: { geometry: sql, isGeoJson }
        });
        return this.parent;
    }
}
exports.PostgisConditionCollector = PostgisConditionCollector;
function formatGeometrySQL(geometry, isGeoJson) {
    if (isGeoJson) {
        return (0, pg_format_1.default)('ST_GeomFromGeoJSON(%L)', geometry);
    }
    return (0, pg_format_1.default)('ST_GeomFromText(%L)', geometry);
}
function buildPostgisConditionSQL(condition) {
    const { method, column, values } = condition;
    const { geometry, isGeoJson } = values;
    const geomSQL = formatGeometrySQL(geometry, isGeoJson);
    switch (method) {
        case 'postgis_contains':
            return (0, pg_format_1.default)('ST_Contains(%I, ', column) + geomSQL + ')';
        case 'postgis_within':
            return (0, pg_format_1.default)('ST_Within(%I, ', column) + geomSQL + ')';
        case 'postgis_intersects':
            return (0, pg_format_1.default)('ST_Intersects(%I, ', column) + geomSQL + ')';
        case 'postgis_overlaps':
            return (0, pg_format_1.default)('ST_Overlaps(%I, ', column) + geomSQL + ')';
        case 'postgis_crosses':
            return (0, pg_format_1.default)('ST_Crosses(%I, ', column) + geomSQL + ')';
        case 'postgis_touches':
            return (0, pg_format_1.default)('ST_Touches(%I, ', column) + geomSQL + ')';
        case 'postgis_disjoint':
            return (0, pg_format_1.default)('ST_Disjoint(%I, ', column) + geomSQL + ')';
        case 'postgis_equals':
            return (0, pg_format_1.default)('ST_Equals(%I, ', column) + geomSQL + ')';
        case 'postgis_dwithin': {
            const { distance } = values;
            return (0, pg_format_1.default)('ST_DWithin(%I, ', column) + geomSQL + (0, pg_format_1.default)(', %s)', distance);
        }
        case 'postgis_distance_lt': {
            const { distance } = values;
            return (0, pg_format_1.default)('ST_Distance(%I, ', column) + geomSQL + (0, pg_format_1.default)(') < %s', distance);
        }
        case 'postgis_distance_gt': {
            const { distance } = values;
            return (0, pg_format_1.default)('ST_Distance(%I, ', column) + geomSQL + (0, pg_format_1.default)(') > %s', distance);
        }
        case 'postgis_covered_by':
            return (0, pg_format_1.default)('ST_CoveredBy(%I, ', column) + geomSQL + ')';
        case 'postgis_covers':
            return (0, pg_format_1.default)('ST_Covers(%I, ', column) + geomSQL + ')';
        default:
            return '';
    }
}
