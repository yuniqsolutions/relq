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
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
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
        if (!snapshot.version) {
            snapshot.version = SNAPSHOT_VERSION;
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
    const functions = (schema.functions || []).map(f => ({
        name: f.name,
        schema: f.schema || 'public',
        returnType: f.returnType,
        argTypes: f.argTypes || [],
        language: f.language,
        definition: f.definition || '',
        volatility: f.volatility || 'VOLATILE',
        ...(f.trackingId ? { trackingId: f.trackingId } : {}),
    }));
    const triggers = (schema.triggers || []).map(t => ({
        name: t.name,
        tableName: t.tableName,
        event: t.event,
        timing: t.timing,
        forEach: t.forEach,
        functionName: t.functionName,
        ...(t.trackingId ? { trackingId: t.trackingId } : {}),
    }));
    return {
        version: SNAPSHOT_VERSION,
        generatedAt: new Date().toISOString(),
        database,
        tables,
        functions,
        triggers,
        appliedMigrations: [],
        extensions: schema.extensions || [],
    };
}
function tableToSnapshot(table) {
    const columns = {};
    const indexes = {};
    const constraints = {};
    for (const col of table.columns) {
        const c = col;
        const colSnap = {
            name: col.name,
            dataType: col.dataType ?? c.type ?? '',
            isNullable: col.isNullable ?? c.nullable ?? false,
            defaultValue: col.defaultValue ?? null,
            isPrimaryKey: col.isPrimaryKey ?? false,
            isUnique: col.isUnique ?? false,
            maxLength: col.maxLength ?? null,
            precision: col.precision ?? null,
            scale: col.scale ?? null,
        };
        if (col.trackingId)
            colSnap.trackingId = col.trackingId;
        columns[col.name] = colSnap;
    }
    for (const idx of table.indexes || []) {
        const idxSnap = {
            name: idx.name,
            columns: Array.isArray(idx.columns) ? idx.columns : [idx.columns],
            isUnique: idx.isUnique,
            isPrimary: idx.isPrimary,
            type: idx.type,
        };
        if (idx.trackingId)
            idxSnap.trackingId = idx.trackingId;
        indexes[idx.name] = idxSnap;
    }
    for (const con of table.constraints || []) {
        const conSnap = {
            name: con.name,
            type: con.type,
            columns: con.columns || [],
            definition: con.definition,
            referencedTable: con.referencedTable,
        };
        if (con.trackingId)
            conSnap.trackingId = con.trackingId;
        constraints[con.name] = conSnap;
    }
    const tableSnap = {
        name: table.name,
        schema: table.schema,
        columns,
        indexes,
        constraints,
        isPartitioned: table.isPartitioned,
        partitionType: table.partitionType,
        partitionKey: table.partitionKey,
    };
    if (table.trackingId)
        tableSnap.trackingId = table.trackingId;
    return tableSnap;
}
function snapshotToDatabaseSchema(snapshot) {
    const tables = [];
    for (const [, tableSnapshot] of Object.entries(snapshot.tables)) {
        tables.push(snapshotToTable(tableSnapshot));
    }
    const functions = (snapshot.functions || []).map(f => ({
        ...f,
        argTypes: f.argTypes || [],
        isAggregate: false,
    }));
    const triggers = (snapshot.triggers || []).map(t => ({
        ...t,
        forEach: (t.forEach || 'ROW'),
        definition: '',
        isEnabled: true,
    }));
    return {
        tables,
        enums: [],
        domains: [],
        compositeTypes: [],
        sequences: [],
        collations: [],
        functions,
        triggers,
        policies: [],
        partitions: [],
        foreignServers: [],
        foreignTables: [],
        extensions: snapshot.extensions,
    };
}
function snapshotToTable(snapshot) {
    const columns = Object.values(snapshot.columns).map(c => ({
        ...c,
        trackingId: c.trackingId,
    }));
    const indexes = Object.values(snapshot.indexes).map(i => ({
        ...i,
        trackingId: i.trackingId,
    }));
    const constraints = Object.values(snapshot.constraints).map(c => ({
        ...c,
        type: c.type,
        trackingId: c.trackingId,
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
        trackingId: snapshot.trackingId,
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
