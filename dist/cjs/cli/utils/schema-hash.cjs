"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeSchema = normalizeSchema;
exports.generateSchemaHash = generateSchemaHash;
exports.generateShortHash = generateShortHash;
exports.schemasMatch = schemasMatch;
const crypto = __importStar(require("crypto"));
function normalizeSchema(schema) {
    const userTables = schema.tables.filter(t => !t.name.startsWith('_relq') &&
        !t.name.startsWith('relq_'));
    const tables = userTables
        .map(normalizeTable)
        .sort((a, b) => a.name.localeCompare(b.name));
    const extensions = [...schema.extensions].sort();
    return { tables, extensions };
}
function normalizeTable(table) {
    const columns = table.columns
        .map(normalizeColumn)
        .sort((a, b) => a.name.localeCompare(b.name));
    const indexes = (table.indexes || [])
        .map(normalizeIndex)
        .sort((a, b) => a.name.localeCompare(b.name));
    const constraints = (table.constraints || [])
        .map(normalizeConstraint)
        .sort((a, b) => a.name.localeCompare(b.name));
    return {
        name: table.name,
        columns,
        indexes,
        constraints,
        isPartitioned: table.isPartitioned,
        partitionType: table.partitionType,
        partitionKey: table.partitionKey ? [...table.partitionKey] : undefined,
    };
}
function normalizeColumn(col) {
    return {
        name: col.name,
        type: col.dataType.toUpperCase(),
        nullable: col.isNullable,
        defaultValue: col.defaultValue || undefined,
        isPrimaryKey: col.isPrimaryKey,
        isUnique: col.isUnique,
        length: col.maxLength || undefined,
    };
}
function normalizeIndex(idx) {
    return {
        name: idx.name,
        columns: [...idx.columns].sort(),
        unique: idx.isUnique,
        type: idx.type?.toUpperCase(),
    };
}
function normalizeConstraint(con) {
    return {
        name: con.name,
        type: con.type.toUpperCase(),
        definition: con.definition || undefined,
    };
}
function generateSchemaHash(schema) {
    const normalized = normalizeSchema(schema);
    const json = JSON.stringify(normalized, null, 0);
    return crypto
        .createHash('sha1')
        .update(json, 'utf8')
        .digest('hex');
}
function generateShortHash(schema) {
    return generateSchemaHash(schema).substring(0, 7);
}
function schemasMatch(schema1, schema2) {
    return generateSchemaHash(schema1) === generateSchemaHash(schema2);
}
