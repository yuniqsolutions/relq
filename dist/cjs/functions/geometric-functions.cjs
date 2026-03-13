"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeometricFunctions = void 0;
const pg_format_1 = __importDefault(require("../utils/pg-format.cjs"));
const sql_functions_1 = require("./sql-functions.cjs");
class GeometricFunctions {
    static area(column) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('area(%I)', column));
    }
    static center(column) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('center(%I)', column));
    }
    static diameter(column) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('diameter(%I)', column));
    }
    static height(column) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('height(%I)', column));
    }
    static width(column) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('width(%I)', column));
    }
    static geoLength(column) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('length(%I)', column));
    }
    static npoints(column) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('npoints(%I)', column));
    }
    static isclosed(column) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('isclosed(%I)', column));
    }
    static isopen(column) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('isopen(%I)', column));
    }
    static pclose(column) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('pclose(%I)', column));
    }
    static popen(column) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('popen(%I)', column));
    }
    static radius(column) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('radius(%I)', column));
    }
    static slope(point1, point2) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('slope(%I, %I)', point1, point2));
    }
    static distance(column, value) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('%I <-> %L', column, value));
    }
    static toBox(column) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('box(%I)', column));
    }
    static toCircle(column) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('circle(%I)', column));
    }
    static toLine(point1, point2) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('line(%I, %I)', point1, point2));
    }
    static toLseg(point1, point2) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('lseg(%I, %I)', point1, point2));
    }
    static toPath(column) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('path(%I)', column));
    }
    static toPoint(column) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('point(%I)', column));
    }
    static toPolygon(column) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('polygon(%I)', column));
    }
    static point(x, y) {
        if (typeof x === 'string' && typeof y === 'string') {
            return new sql_functions_1.SqlFunction((0, pg_format_1.default)('point(%I, %I)', x, y));
        }
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('point(%s, %s)', x, y));
    }
    static box(point1, point2) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('box(%I, %I)', point1, point2));
    }
    static circle(center, radius) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('circle(%I, %s)', center, radius));
    }
    static translate(column, offset) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('%I + point %L', column, offset));
    }
    static scale(column, factor) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('%I * point %L', column, factor));
    }
    static rotate(column, rotation) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('%I / point %L', column, rotation));
    }
    static intersection(line1, line2) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('%I # %I', line1, line2));
    }
    static closestPoint(lseg, point) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('%I ## %I', lseg, point));
    }
    static boundingBox(column) {
        return new sql_functions_1.SqlFunction((0, pg_format_1.default)('box(%I)', column));
    }
}
exports.GeometricFunctions = GeometricFunctions;
