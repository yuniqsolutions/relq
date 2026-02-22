"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractTypeName = extractTypeName;
exports.extractConstraintType = extractConstraintType;
exports.extractFkAction = extractFkAction;
exports.extractFkMatch = extractFkMatch;
exports.deparseNode = deparseNode;
exports.normalizeTypeName = normalizeTypeName;
exports.extractTypeParams = extractTypeParams;
exports.extractColumnsFromDefinition = extractColumnsFromDefinition;
exports.extractCheckExpression = extractCheckExpression;
exports.extractExcludeExpression = extractExcludeExpression;
exports.parseArgTypes = parseArgTypes;
const pgsql_deparser_1 = require("pgsql-deparser");
function extractTypeName(typeName) {
    if (!typeName)
        return { name: 'text', isArray: false };
    const names = typeName.names?.map((n) => n.String?.sval).filter(Boolean) || [];
    let name = names.length > 1 ? names[names.length - 1] : names[0] || 'text';
    if (names[0] === 'pg_catalog') {
        name = names[1] || 'text';
    }
    const isArray = (typeName.arrayBounds?.length ?? 0) > 0;
    const arrayDims = typeName.arrayBounds?.length;
    let params;
    if (typeName.typmods && typeName.typmods.length > 0) {
        const mods = typeName.typmods.map((m) => {
            if (m.A_Const?.ival?.ival !== undefined)
                return m.A_Const.ival.ival;
            if (m.A_Const?.sval?.sval !== undefined)
                return m.A_Const.sval.sval;
            return undefined;
        }).filter((v) => v !== undefined);
        if (mods.length === 1) {
            if (['varchar', 'character varying', 'char', 'character', 'bit', 'varbit'].includes(name.toLowerCase())) {
                params = { length: mods[0] };
            }
            else {
                params = { precision: mods[0] };
            }
        }
        else if (mods.length === 2) {
            params = { precision: mods[0], scale: mods[1] };
        }
    }
    return { name, params, isArray, arrayDims };
}
function extractConstraintType(contype) {
    const types = {
        0: 'NULL',
        1: 'NOT NULL',
        2: 'DEFAULT',
        3: 'IDENTITY',
        4: 'GENERATED',
        5: 'CHECK',
        6: 'PRIMARY KEY',
        7: 'UNIQUE',
        8: 'EXCLUSION',
        9: 'FOREIGN KEY',
    };
    return types[contype] || 'UNKNOWN';
}
function extractFkAction(action) {
    if (!action)
        return undefined;
    const actions = {
        'a': 'NO ACTION',
        'r': 'RESTRICT',
        'c': 'CASCADE',
        'n': 'SET NULL',
        'd': 'SET DEFAULT',
    };
    return actions[action];
}
function extractFkMatch(matchType) {
    if (!matchType)
        return undefined;
    const matches = {
        's': 'SIMPLE',
        'f': 'FULL',
    };
    return matches[matchType];
}
async function deparseNode(node) {
    try {
        const result = await (0, pgsql_deparser_1.deparse)([node]);
        return result.trim();
    }
    catch {
        return '';
    }
}
function normalizeTypeName(dataType, udtName) {
    if (dataType === 'ARRAY' && udtName) {
        const baseType = udtName.replace(/^_/, '');
        return baseType;
    }
    const typeMap = {
        'integer': 'int4',
        'smallint': 'int2',
        'bigint': 'int8',
        'real': 'float4',
        'double precision': 'float8',
        'character varying': 'varchar',
        'character': 'char',
        'boolean': 'bool',
        'timestamp without time zone': 'timestamp',
        'timestamp with time zone': 'timestamptz',
        'time without time zone': 'time',
        'time with time zone': 'timetz',
    };
    const lower = dataType.toLowerCase();
    return typeMap[lower] || udtName || lower;
}
function extractTypeParams(col) {
    if (col.characterMaxLength) {
        return { length: col.characterMaxLength };
    }
    if (col.numericPrecision != null) {
        if (col.numericScale != null && col.numericScale > 0) {
            return { precision: col.numericPrecision, scale: col.numericScale };
        }
        return { precision: col.numericPrecision };
    }
    return undefined;
}
function extractColumnsFromDefinition(definition) {
    const match = definition.match(/\(([^)]+)\)/);
    if (!match)
        return [];
    return match[1].split(',').map(s => s.trim().replace(/"/g, ''));
}
function extractCheckExpression(definition) {
    const match = definition.match(/CHECK\s*\((.+)\)/is);
    return match ? match[1].trim() : definition;
}
function extractExcludeExpression(definition) {
    const match = definition.match(/EXCLUDE\s+USING\s+\w+\s*\((.+)\)/is);
    return match ? match[1].trim() : definition;
}
function parseArgTypes(argTypes) {
    if (!argTypes)
        return [];
    if (Array.isArray(argTypes)) {
        return argTypes.map(t => ({ type: t }));
    }
    return argTypes.split(',').map(arg => {
        const parts = arg.trim().split(/\s+/);
        if (parts.length > 1) {
            return { name: parts[0], type: parts.slice(1).join(' ') };
        }
        return { type: parts[0] };
    }).filter(a => a.type);
}
