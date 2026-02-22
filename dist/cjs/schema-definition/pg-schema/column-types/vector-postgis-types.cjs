"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.box3d = exports.box2d = exports.geoPoint = exports.geography = exports.geometry = exports.sparsevec = exports.halfvec = exports.vector = void 0;
const column_builder_1 = require("./column-builder.cjs");
const vector = (dimensions, columnName) => {
    if (dimensions <= 0) {
        throw new Error(`Vector dimensions must be positive, got: ${dimensions}`);
    }
    return (0, column_builder_1.createColumnWithName)(`VECTOR(${dimensions})`, columnName);
};
exports.vector = vector;
const halfvec = (dimensions, columnName) => {
    if (dimensions <= 0) {
        throw new Error(`Halfvec dimensions must be positive, got: ${dimensions}`);
    }
    return (0, column_builder_1.createColumnWithName)(`HALFVEC(${dimensions})`, columnName);
};
exports.halfvec = halfvec;
const sparsevec = (dimensions, columnName) => {
    if (dimensions <= 0) {
        throw new Error(`Sparsevec dimensions must be positive, got: ${dimensions}`);
    }
    return (0, column_builder_1.createColumnWithName)(`SPARSEVEC(${dimensions})`, columnName);
};
exports.sparsevec = sparsevec;
const geometry = (columnName, srid, geometryType) => {
    let typeName = 'GEOMETRY';
    if (geometryType && srid) {
        typeName = `GEOMETRY(${geometryType}, ${srid})`;
    }
    else if (geometryType) {
        typeName = `GEOMETRY(${geometryType})`;
    }
    else if (srid) {
        typeName = `GEOMETRY(GEOMETRY, ${srid})`;
    }
    return (0, column_builder_1.createColumnWithName)(typeName, columnName);
};
exports.geometry = geometry;
const geography = (columnName, srid = 4326, geometryType) => {
    let typeName = 'GEOGRAPHY';
    if (geometryType) {
        typeName = `GEOGRAPHY(${geometryType}, ${srid})`;
    }
    else {
        typeName = `GEOGRAPHY(GEOMETRY, ${srid})`;
    }
    return (0, column_builder_1.createColumnWithName)(typeName, columnName);
};
exports.geography = geography;
const geoPoint = (columnName, srid = 4326) => {
    return (0, column_builder_1.createColumnWithName)(`GEOMETRY(POINT, ${srid})`, columnName);
};
exports.geoPoint = geoPoint;
const box2d = (columnName) => (0, column_builder_1.createColumnWithName)('BOX2D', columnName);
exports.box2d = box2d;
const box3d = (columnName) => (0, column_builder_1.createColumnWithName)('BOX3D', columnName);
exports.box3d = box3d;
