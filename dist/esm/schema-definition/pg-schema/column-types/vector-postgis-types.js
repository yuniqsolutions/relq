import { createColumnWithName } from "./column-builder.js";
export const vector = (dimensions, columnName) => {
    if (dimensions <= 0) {
        throw new Error(`Vector dimensions must be positive, got: ${dimensions}`);
    }
    return createColumnWithName(`VECTOR(${dimensions})`, columnName);
};
export const halfvec = (dimensions, columnName) => {
    if (dimensions <= 0) {
        throw new Error(`Halfvec dimensions must be positive, got: ${dimensions}`);
    }
    return createColumnWithName(`HALFVEC(${dimensions})`, columnName);
};
export const sparsevec = (dimensions, columnName) => {
    if (dimensions <= 0) {
        throw new Error(`Sparsevec dimensions must be positive, got: ${dimensions}`);
    }
    return createColumnWithName(`SPARSEVEC(${dimensions})`, columnName);
};
export const geometry = (columnName, srid, geometryType) => {
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
    return createColumnWithName(typeName, columnName);
};
export const geography = (columnName, srid = 4326, geometryType) => {
    let typeName = 'GEOGRAPHY';
    if (geometryType) {
        typeName = `GEOGRAPHY(${geometryType}, ${srid})`;
    }
    else {
        typeName = `GEOGRAPHY(GEOMETRY, ${srid})`;
    }
    return createColumnWithName(typeName, columnName);
};
export const geoPoint = (columnName, srid = 4326) => {
    return createColumnWithName(`GEOMETRY(POINT, ${srid})`, columnName);
};
export const box2d = (columnName) => createColumnWithName('BOX2D', columnName);
export const box3d = (columnName) => createColumnWithName('BOX3D', columnName);
