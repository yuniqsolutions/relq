"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pgRelations = pgRelations;
exports.defineRelations = defineRelations;
exports.defineSchema = defineSchema;
exports.actionCodeToString = actionCodeToString;
exports.stringToActionCode = stringToActionCode;
exports.matchCodeToString = matchCodeToString;
exports.generateReferencesSQL = generateReferencesSQL;
const relation_builder_1 = require("./relation-builder.cjs");
function pgRelations(schema, builder) {
    const tables = {};
    for (const tableKey of Object.keys(schema)) {
        tables[tableKey] = (defineRelations) => {
            const fullBuilder = (0, relation_builder_1.createFullBuilder)(schema, tableKey);
            return defineRelations(fullBuilder);
        };
    }
    return builder(tables);
}
function defineRelations(schema, relationDefs) {
    const result = {};
    for (const [tableKey, defFn] of Object.entries(relationDefs)) {
        if (typeof defFn === 'function') {
            const fullBuilder = (0, relation_builder_1.createFullBuilder)(schema, tableKey);
            result[tableKey] = defFn(fullBuilder);
        }
    }
    return result;
}
function defineSchema(schema) {
    return schema;
}
function actionCodeToString(code) {
    switch (code) {
        case 'a': return 'NO ACTION';
        case 'r': return 'RESTRICT';
        case 'c': return 'CASCADE';
        case 'n': return 'SET NULL';
        case 'd': return 'SET DEFAULT';
        default: return 'NO ACTION';
    }
}
function stringToActionCode(action) {
    switch (action) {
        case 'NO ACTION': return 'a';
        case 'RESTRICT': return 'r';
        case 'CASCADE': return 'c';
        case 'SET NULL': return 'n';
        case 'SET DEFAULT': return 'd';
        default: return 'a';
    }
}
function matchCodeToString(code) {
    switch (code) {
        case 'f': return 'FULL';
        case 's':
        default: return 'SIMPLE';
    }
}
function generateReferencesSQL(relation, columnName, columnType = 'uuid') {
    const parts = [`${columnName} ${columnType}`];
    if (relation.$references && relation.$references.length > 0) {
        const refCols = relation.$references.map(r => r.column).join(', ');
        parts.push(`REFERENCES ${relation.$targetTable}(${refCols})`);
    }
    else {
        parts.push(`REFERENCES ${relation.$targetTable}`);
    }
    if (relation.$onDelete && relation.$onDelete !== 'NO ACTION') {
        parts.push(`ON DELETE ${relation.$onDelete}`);
    }
    if (relation.$onUpdate && relation.$onUpdate !== 'NO ACTION') {
        parts.push(`ON UPDATE ${relation.$onUpdate}`);
    }
    if (relation.$match && relation.$match !== 'SIMPLE') {
        parts.push(`MATCH ${relation.$match}`);
    }
    if (relation.$deferrable) {
        parts.push('DEFERRABLE');
        if (relation.$initiallyDeferred) {
            parts.push('INITIALLY DEFERRED');
        }
    }
    return parts.join(' ');
}
