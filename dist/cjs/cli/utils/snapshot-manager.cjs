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
exports.loadSnapshot = loadSnapshot;
exports.saveSnapshot = saveSnapshot;
exports.databaseSchemaToSnapshot = databaseSchemaToSnapshot;
exports.snapshotToDatabaseSchema = snapshotToDatabaseSchema;
exports.createBackup = createBackup;
exports.listBackups = listBackups;
exports.restoreBackup = restoreBackup;
exports.addMigrationToSnapshot = addMigrationToSnapshot;
exports.getAppliedMigrations = getAppliedMigrations;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const SNAPSHOT_VERSION = 1;
const DEFAULT_SNAPSHOT_PATH = '.relq/snapshot.json';
function loadSnapshot(snapshotPath) {
    const filePath = snapshotPath || DEFAULT_SNAPSHOT_PATH;
    if (!fs.existsSync(filePath)) {
        return null;
    }
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const snapshot = JSON.parse(content);
        if (snapshot.version !== SNAPSHOT_VERSION) {
            console.warn(`Snapshot version mismatch: expected ${SNAPSHOT_VERSION}, got ${snapshot.version}`);
        }
        return snapshot;
    }
    catch (error) {
        console.error('Failed to load snapshot:', error);
        return null;
    }
}
function saveSnapshot(schema, snapshotPath, database) {
    const filePath = snapshotPath || DEFAULT_SNAPSHOT_PATH;
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    const snapshot = databaseSchemaToSnapshot(schema, database);
    fs.writeFileSync(filePath, JSON.stringify(snapshot, null, 2), 'utf-8');
}
function databaseSchemaToSnapshot(schema, database) {
    const tables = {};
    for (const table of schema.tables) {
        tables[table.name] = tableToSnapshot(table);
    }
    return {
        version: SNAPSHOT_VERSION,
        generatedAt: new Date().toISOString(),
        database,
        tables,
        appliedMigrations: [],
        extensions: schema.extensions || [],
    };
}
function tableToSnapshot(table) {
    const columns = {};
    const indexes = {};
    const constraints = {};
    for (const col of table.columns) {
        columns[col.name] = {
            name: col.name,
            dataType: col.dataType,
            isNullable: col.isNullable,
            defaultValue: col.defaultValue,
            isPrimaryKey: col.isPrimaryKey,
            isUnique: col.isUnique,
            maxLength: col.maxLength,
            precision: col.precision,
            scale: col.scale,
            references: col.references,
        };
    }
    for (const idx of table.indexes || []) {
        indexes[idx.name] = {
            name: idx.name,
            columns: Array.isArray(idx.columns) ? idx.columns : [idx.columns],
            isUnique: idx.isUnique,
            isPrimary: idx.isPrimary,
            type: idx.type,
        };
    }
    for (const con of table.constraints || []) {
        constraints[con.name] = {
            name: con.name,
            type: con.type,
            columns: con.columns || [],
            definition: con.definition,
            referencedTable: con.referencedTable,
        };
    }
    return {
        name: table.name,
        schema: table.schema,
        columns,
        indexes,
        constraints,
        isPartitioned: table.isPartitioned,
        partitionType: table.partitionType,
        partitionKey: table.partitionKey,
    };
}
function snapshotToDatabaseSchema(snapshot) {
    const tables = [];
    for (const [, tableSnapshot] of Object.entries(snapshot.tables)) {
        tables.push(snapshotToTable(tableSnapshot));
    }
    return {
        tables,
        enums: [],
        domains: [],
        compositeTypes: [],
        sequences: [],
        collations: [],
        functions: [],
        triggers: [],
        policies: [],
        partitions: [],
        foreignServers: [],
        foreignTables: [],
        extensions: snapshot.extensions,
    };
}
function snapshotToTable(snapshot) {
    const columns = Object.values(snapshot.columns);
    const indexes = Object.values(snapshot.indexes);
    const constraints = Object.values(snapshot.constraints).map(c => ({
        ...c,
        type: c.type,
    }));
    return {
        name: snapshot.name,
        schema: snapshot.schema,
        columns,
        indexes,
        constraints,
        rowCount: 0,
        isPartitioned: snapshot.isPartitioned || false,
        partitionType: snapshot.partitionType,
        partitionKey: snapshot.partitionKey,
    };
}
function createBackup(filePath, backupDir) {
    if (!fs.existsSync(filePath)) {
        return null;
    }
    const dir = backupDir || '.relq/backups';
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = path.basename(filePath);
    const backupPath = path.join(dir, `${fileName}.${timestamp}.bak`);
    fs.copyFileSync(filePath, backupPath);
    return backupPath;
}
function listBackups(filePath, backupDir) {
    const dir = backupDir || '.relq/backups';
    if (!fs.existsSync(dir)) {
        return [];
    }
    const fileName = path.basename(filePath);
    const files = fs.readdirSync(dir);
    return files
        .filter(f => f.startsWith(fileName) && f.endsWith('.bak'))
        .map(f => path.join(dir, f))
        .sort()
        .reverse();
}
function restoreBackup(backupPath, targetPath) {
    if (!fs.existsSync(backupPath)) {
        throw new Error(`Backup not found: ${backupPath}`);
    }
    fs.copyFileSync(backupPath, targetPath);
}
function addMigrationToSnapshot(snapshotPath, migrationName) {
    const snapshot = loadSnapshot(snapshotPath);
    if (!snapshot) {
        console.warn('No snapshot found, creating new one');
        return;
    }
    if (!snapshot.appliedMigrations.includes(migrationName)) {
        snapshot.appliedMigrations.push(migrationName);
        fs.writeFileSync(snapshotPath || DEFAULT_SNAPSHOT_PATH, JSON.stringify(snapshot, null, 2), 'utf-8');
    }
}
function getAppliedMigrations(snapshotPath) {
    const snapshot = loadSnapshot(snapshotPath);
    return snapshot?.appliedMigrations || [];
}
