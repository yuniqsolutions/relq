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
exports.ensureRelqDir = ensureRelqDir;
exports.getLocalCommits = getLocalCommits;
exports.saveLocalCommits = saveLocalCommits;
exports.getLocalHead = getLocalHead;
exports.setLocalHead = setLocalHead;
exports.addLocalCommit = addLocalCommit;
exports.getLatestLocalCommit = getLatestLocalCommit;
exports.ensureCommitsTable = ensureCommitsTable;
exports.getRemoteCommits = getRemoteCommits;
exports.getLatestRemoteCommit = getLatestRemoteCommit;
exports.addRemoteCommit = addRemoteCommit;
exports.createCommit = createCommit;
exports.checkSyncStatus = checkSyncStatus;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const schema_hash_1 = require("./schema-hash.cjs");
const RELQ_DIR = '.relq';
const COMMITS_FILE = 'commits.json';
const HEAD_FILE = 'HEAD';
function ensureRelqDir(baseDir = process.cwd()) {
    const relqPath = path.join(baseDir, RELQ_DIR);
    if (!fs.existsSync(relqPath)) {
        fs.mkdirSync(relqPath, { recursive: true });
    }
    return relqPath;
}
function getLocalCommits(baseDir = process.cwd()) {
    const filePath = path.join(baseDir, RELQ_DIR, COMMITS_FILE);
    if (!fs.existsSync(filePath)) {
        return [];
    }
    try {
        const data = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(data);
    }
    catch {
        return [];
    }
}
function saveLocalCommits(commits, baseDir = process.cwd()) {
    ensureRelqDir(baseDir);
    const filePath = path.join(baseDir, RELQ_DIR, COMMITS_FILE);
    fs.writeFileSync(filePath, JSON.stringify(commits, null, 2), 'utf-8');
}
function getLocalHead(baseDir = process.cwd()) {
    const filePath = path.join(baseDir, RELQ_DIR, HEAD_FILE);
    if (!fs.existsSync(filePath)) {
        return null;
    }
    return fs.readFileSync(filePath, 'utf-8').trim() || null;
}
function setLocalHead(hash, baseDir = process.cwd()) {
    ensureRelqDir(baseDir);
    const filePath = path.join(baseDir, RELQ_DIR, HEAD_FILE);
    fs.writeFileSync(filePath, hash, 'utf-8');
}
function addLocalCommit(commit, limit = 1000, baseDir = process.cwd()) {
    const commits = getLocalCommits(baseDir);
    commits.push(commit);
    while (commits.length > limit) {
        commits.shift();
    }
    saveLocalCommits(commits, baseDir);
    setLocalHead(commit.hash, baseDir);
}
function getLatestLocalCommit(baseDir = process.cwd()) {
    const commits = getLocalCommits(baseDir);
    return commits.length > 0 ? commits[commits.length - 1] : null;
}
const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS _relq_commits (
    id SERIAL PRIMARY KEY,
    hash VARCHAR(40) UNIQUE NOT NULL,
    parent_hash VARCHAR(40),
    schema_snapshot JSONB NOT NULL,
    author VARCHAR(255) NOT NULL,
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_relq_commits_created 
    ON _relq_commits(created_at DESC);
`;
async function ensureCommitsTable(connection) {
    const { Pool } = await Promise.resolve().then(() => __importStar(require("../../addon/pg/index.cjs")));
    const pool = new Pool({
        host: connection.host,
        port: connection.port || 5432,
        database: connection.database,
        user: connection.user,
        password: connection.password,
        connectionString: connection.url,
        ssl: connection.ssl,
    });
    try {
        await pool.query(CREATE_TABLE_SQL);
    }
    finally {
        await pool.end();
    }
}
async function getRemoteCommits(connection, limit = 100) {
    const { Pool } = await Promise.resolve().then(() => __importStar(require("../../addon/pg/index.cjs")));
    const pool = new Pool({
        host: connection.host,
        port: connection.port || 5432,
        database: connection.database,
        user: connection.user,
        password: connection.password,
        connectionString: connection.url,
        ssl: connection.ssl,
    });
    try {
        await ensureCommitsTable(connection);
        const result = await pool.query(`
            SELECT id, hash, parent_hash, schema_snapshot, author, message, created_at
            FROM _relq_commits
            ORDER BY created_at DESC
            LIMIT $1
        `, [limit]);
        return result.rows.map((row) => ({
            id: row.id,
            hash: row.hash,
            parentHash: row.parent_hash,
            schemaSnapshot: row.schema_snapshot,
            author: row.author,
            message: row.message,
            createdAt: new Date(row.created_at),
        }));
    }
    finally {
        await pool.end();
    }
}
async function getLatestRemoteCommit(connection) {
    const commits = await getRemoteCommits(connection, 1);
    return commits.length > 0 ? commits[0] : null;
}
async function addRemoteCommit(connection, commit, limit = 1000) {
    const { Pool } = await Promise.resolve().then(() => __importStar(require("../../addon/pg/index.cjs")));
    const pool = new Pool({
        host: connection.host,
        port: connection.port || 5432,
        database: connection.database,
        user: connection.user,
        password: connection.password,
        connectionString: connection.url,
        ssl: connection.ssl,
    });
    try {
        await ensureCommitsTable(connection);
        await pool.query(`
            INSERT INTO _relq_commits (hash, parent_hash, schema_snapshot, author, message)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (hash) DO NOTHING
        `, [
            commit.hash,
            commit.parentHash || null,
            JSON.stringify(commit.schemaSnapshot),
            commit.author,
            commit.message || null,
        ]);
        await pool.query(`
            DELETE FROM _relq_commits
            WHERE id NOT IN (
                SELECT id FROM _relq_commits
                ORDER BY created_at DESC
                LIMIT $1
            )
        `, [limit]);
    }
    finally {
        await pool.end();
    }
}
async function createCommit(connection, schema, author, message, commitLimit = 1000, baseDir = process.cwd()) {
    const hash = (0, schema_hash_1.generateSchemaHash)(schema);
    const normalized = (0, schema_hash_1.normalizeSchema)(schema);
    const parentHash = getLocalHead(baseDir);
    const commit = {
        hash,
        parentHash,
        schemaSnapshot: normalized,
        author,
        message,
        createdAt: new Date(),
    };
    addLocalCommit(commit, commitLimit, baseDir);
    await addRemoteCommit(connection, commit, commitLimit);
    return commit;
}
async function checkSyncStatus(connection, baseDir = process.cwd()) {
    const localHead = getLocalHead(baseDir);
    const remoteCommit = await getLatestRemoteCommit(connection);
    const remoteHead = remoteCommit?.hash || null;
    const localCommits = getLocalCommits(baseDir);
    const remoteCommits = await getRemoteCommits(connection, 100);
    const inSync = localHead === remoteHead;
    const localHashes = new Set(localCommits.map(c => c.hash));
    const remoteHashes = new Set(remoteCommits.map(c => c.hash));
    const localAhead = [...localHashes].filter(h => !remoteHashes.has(h)).length;
    const remoteAhead = [...remoteHashes].filter(h => !localHashes.has(h)).length;
    return { inSync, localHead, remoteHead, localAhead, remoteAhead };
}
