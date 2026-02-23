import format from "../utils/pg-format.js";
import { SqlFunction } from "./sql-functions.js";
export class GeometricFunctions {
    static area(column) {
        return new SqlFunction(format('area(%I)', column));
    }
    static center(column) {
        return new SqlFunction(format('center(%I)', column));
    }
    static diameter(column) {
        return new SqlFunction(format('diameter(%I)', column));
    }
    static height(column) {
        return new SqlFunction(format('height(%I)', column));
    }
    static width(column) {
        return new SqlFunction(format('width(%I)', column));
    }
    static geoLength(column) {
        return new SqlFunction(format('length(%I)', column));
    }
    static npoints(column) {
        return new SqlFunction(format('npoints(%I)', column));
    }
    static isclosed(column) {
        return new SqlFunction(format('isclosed(%I)', column));
    }
    static isopen(column) {
        return new SqlFunction(format('isopen(%I)', column));
    }
    static pclose(column) {
        return new SqlFunction(format('pclose(%I)', column));
    }
    static popen(column) {
        return new SqlFunction(format('popen(%I)', column));
    }
    static radius(column) {
        return new SqlFunction(format('radius(%I)', column));
    }
    static slope(point1, point2) {
        return new SqlFunction(format('slope(%I, %I)', point1, point2));
    }
    static distance(column, value) {
        return new SqlFunction(format('%I <-> %L', column, value));
    }
    static toBox(column) {
        return new SqlFunction(format('box(%I)', column));
    }
    static toCircle(column) {
        return new SqlFunction(format('circle(%I)', column));
    }
    static toLine(point1, point2) {
        return new SqlFunction(format('line(%I, %I)', point1, point2));
    }
    static toLseg(point1, point2) {
        return new SqlFunction(format('lseg(%I, %I)', point1, point2));
    }
    static toPath(column) {
        return new SqlFunction(format('path(%I)', column));
    }
    static toPoint(column) {
        return new SqlFunction(format('point(%I)', column));
    }
    static toPolygon(column) {
        return new SqlFunction(format('polygon(%I)', column));
    }
    static point(x, y) {
        if (typeof x === 'string' && typeof y === 'string') {
            return new SqlFunction(format('point(%I, %I)', x, y));
        }
        return new SqlFunction(format('point(%s, %s)', x, y));
    }
    static box(point1, point2) {
        return new SqlFunction(format('box(%I, %I)', point1, point2));
    }
    static circle(center, radius) {
        return new SqlFunction(format('circle(%I, %s)', center, radius));
    }
    static translate(column, offset) {
        return new SqlFunction(format('%I + point %L', column, offset));
    }
    static scale(column, factor) {
        return new SqlFunction(format('%I * point %L', column, factor));
    }
    static rotate(column, rotation) {
        return new SqlFunction(format('%I / point %L', column, rotation));
    }
    static intersection(line1, line2) {
        return new SqlFunction(format('%I # %I', line1, line2));
    }
    static closestPoint(lseg, point) {
        return new SqlFunction(format('%I ## %I', lseg, point));
    }
    static boundingBox(column) {
        return new SqlFunction(format('box(%I)', column));
    }
}
