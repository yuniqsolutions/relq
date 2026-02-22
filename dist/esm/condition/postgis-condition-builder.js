import format from "../utils/pg-format.js";
function isGeoJson(input) {
    return typeof input === 'object' && input !== null && 'type' in input && 'coordinates' in input;
}
function geometryInputToSQL(input) {
    if (isGeoJson(input)) {
        return { sql: JSON.stringify(input), isGeoJson: true };
    }
    return { sql: input, isGeoJson: false };
}
export class PostgisConditionCollector {
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
function formatGeometrySQL(geometry, isGeoJson) {
    if (isGeoJson) {
        return format('ST_GeomFromGeoJSON(%L)', geometry);
    }
    return format('ST_GeomFromText(%L)', geometry);
}
export function buildPostgisConditionSQL(condition) {
    const { method, column, values } = condition;
    const { geometry, isGeoJson } = values;
    const geomSQL = formatGeometrySQL(geometry, isGeoJson);
    switch (method) {
        case 'postgis_contains':
            return format('ST_Contains(%I, ', column) + geomSQL + ')';
        case 'postgis_within':
            return format('ST_Within(%I, ', column) + geomSQL + ')';
        case 'postgis_intersects':
            return format('ST_Intersects(%I, ', column) + geomSQL + ')';
        case 'postgis_overlaps':
            return format('ST_Overlaps(%I, ', column) + geomSQL + ')';
        case 'postgis_crosses':
            return format('ST_Crosses(%I, ', column) + geomSQL + ')';
        case 'postgis_touches':
            return format('ST_Touches(%I, ', column) + geomSQL + ')';
        case 'postgis_disjoint':
            return format('ST_Disjoint(%I, ', column) + geomSQL + ')';
        case 'postgis_equals':
            return format('ST_Equals(%I, ', column) + geomSQL + ')';
        case 'postgis_dwithin': {
            const { distance } = values;
            return format('ST_DWithin(%I, ', column) + geomSQL + format(', %s)', distance);
        }
        case 'postgis_distance_lt': {
            const { distance } = values;
            return format('ST_Distance(%I, ', column) + geomSQL + format(') < %s', distance);
        }
        case 'postgis_distance_gt': {
            const { distance } = values;
            return format('ST_Distance(%I, ', column) + geomSQL + format(') > %s', distance);
        }
        case 'postgis_covered_by':
            return format('ST_CoveredBy(%I, ', column) + geomSQL + ')';
        case 'postgis_covers':
            return format('ST_Covers(%I, ', column) + geomSQL + ')';
        default:
            return '';
    }
}
