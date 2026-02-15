import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { buildPoolConfig } from "../../config/index.js";
import { detectDialect } from "./dialect-router.js";
import { normalizeSchema, generateSchemaHash } from "./schema-hash.js";
import { schemaToAST } from "./schema-to-ast.js";
const RELQ_DIR = '.relq';
const COMMITS_FILE = 'commits.json';
const HEAD_FILE = 'HEAD';
export function ensureRelqDir(baseDir = process.cwd()) {
    const relqPath = path.join(baseDir, RELQ_DIR);
    if (!fs.existsSync(relqPath)) {
        fs.mkdirSync(relqPath, { recursive: true });
    }
    return relqPath;
}
export function getLocalCommits(baseDir = process.cwd()) {
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
function getLocalCommitByHash(hash, baseDir = process.cwd()) {
    const commitPath = path.join(baseDir, '.relq', 'commits', `${hash}.json`);
    if (!fs.existsSync(commitPath)) {
        return null;
    }
    try {
        return JSON.parse(fs.readFileSync(commitPath, 'utf-8'));
    }
    catch {
        return null;
    }
}
export function saveLocalCommits(commits, baseDir = process.cwd()) {
    ensureRelqDir(baseDir);
    const filePath = path.join(baseDir, RELQ_DIR, COMMITS_FILE);
    fs.writeFileSync(filePath, JSON.stringify(commits, null, 2), 'utf-8');
}
export function getLocalHead(baseDir = process.cwd()) {
    const filePath = path.join(baseDir, RELQ_DIR, HEAD_FILE);
    if (!fs.existsSync(filePath)) {
        return null;
    }
    return fs.readFileSync(filePath, 'utf-8').trim() || null;
}
export function setLocalHead(hash, baseDir = process.cwd()) {
    ensureRelqDir(baseDir);
    const filePath = path.join(baseDir, RELQ_DIR, HEAD_FILE);
    fs.writeFileSync(filePath, hash, 'utf-8');
}
export function addLocalCommit(commit, limit = 1000, baseDir = process.cwd()) {
    const commits = getLocalCommits(baseDir);
    commits.push(commit);
    while (commits.length > limit) {
        commits.shift();
    }
    saveLocalCommits(commits, baseDir);
    setLocalHead(commit.hash, baseDir);
}
export function getLatestLocalCommit(baseDir = process.cwd()) {
    const commits = getLocalCommits(baseDir);
    return commits.length > 0 ? commits[commits.length - 1] : null;
}
export async function ensureCommitsTable(connection) {
    const { Pool } = await import('pg');
    const poolConfig = await buildPoolConfig(connection);
    const pool = new Pool(poolConfig);
    const isDsql = detectDialect({ connection }) === 'dsql';
    try {
        const idColumn = isDsql
            ? 'id UUID PRIMARY KEY DEFAULT gen_random_uuid()'
            : 'id SERIAL PRIMARY KEY';
        const jsonType = isDsql ? 'TEXT' : 'JSONB';
        await pool.query(`
            CREATE TABLE IF NOT EXISTS _relq_commits (
                ${idColumn},
                hash VARCHAR(40) UNIQUE NOT NULL,
                parent_hash VARCHAR(40),
                schema_snapshot ${jsonType} NOT NULL,
                author VARCHAR(255) NOT NULL,
                message TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);
        try {
            await pool.query(`CREATE INDEX IF NOT EXISTS idx_relq_commits_created ON _relq_commits(created_at DESC);`);
        }
        catch { }
    }
    finally {
        await pool.end();
    }
}
export async function getRemoteCommits(connection, limit = 100) {
    const { Pool } = await import('pg');
    const poolConfig = await buildPoolConfig(connection);
    const pool = new Pool(poolConfig);
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
export async function getLatestRemoteCommit(connection) {
    const commits = await getRemoteCommits(connection, 1);
    return commits.length > 0 ? commits[0] : null;
}
export async function addRemoteCommit(connection, commit, limit = 1000) {
    const { Pool } = await import('pg');
    const poolConfig = await buildPoolConfig(connection);
    const pool = new Pool(poolConfig);
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
export async function createCommit(connection, schema, author, message, commitLimit = 1000, baseDir = process.cwd()) {
    const hash = generateSchemaHash(schema);
    const normalized = normalizeSchema(schema);
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
export async function checkSyncStatus(connection, baseDir = process.cwd()) {
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
export function generateASTHash(ast) {
    const normalized = {
        enums: [...ast.enums].sort((a, b) => a.name.localeCompare(b.name)),
        domains: [...ast.domains].sort((a, b) => a.name.localeCompare(b.name)),
        compositeTypes: [...ast.compositeTypes].sort((a, b) => a.name.localeCompare(b.name)),
        sequences: [...ast.sequences].sort((a, b) => a.name.localeCompare(b.name)),
        tables: [...ast.tables].sort((a, b) => a.name.localeCompare(b.name)),
        views: [...ast.views].sort((a, b) => a.name.localeCompare(b.name)),
        functions: [...ast.functions].sort((a, b) => a.name.localeCompare(b.name)),
        triggers: [...ast.triggers].sort((a, b) => a.name.localeCompare(b.name)),
        extensions: [...ast.extensions].sort(),
    };
    const json = JSON.stringify(normalized, null, 0);
    return crypto
        .createHash('sha1')
        .update(json, 'utf8')
        .digest('hex');
}
export function createCommitFromSchema(schema, author, message, commitLimit = 1000, baseDir = process.cwd()) {
    const parsedSchema = schemaToAST(schema);
    const hash = generateASTHash(parsedSchema);
    const currentHead = getLocalHead(baseDir);
    let parentHash = currentHead;
    if (currentHead) {
        const headCommit = getLocalCommitByHash(currentHead, baseDir);
        const isUnpushed = headCommit && (!headCommit.remotes?.pushed || headCommit.remotes.pushed.length === 0);
        const isPullCommit = headCommit?.message?.startsWith('pull: sync from ');
        if (isUnpushed && !isPullCommit) {
            parentHash = headCommit?.parentHash || null;
            const commitsDir = path.join(baseDir, '.relq', 'commits');
            const oldCommitFile = path.join(commitsDir, `${currentHead}.json`);
            if (fs.existsSync(oldCommitFile)) {
                fs.unlinkSync(oldCommitFile);
            }
        }
    }
    const commit = {
        hash,
        parentHash,
        schemaSnapshot: parsedSchema,
        author,
        message,
        createdAt: new Date(),
    };
    addLocalCommit(commit, commitLimit, baseDir);
    return commit;
}
export async function createCommitFromSchemaWithRemote(schema, connection, author, message, commitLimit = 1000, baseDir = process.cwd()) {
    const parsedSchema = schemaToAST(schema);
    const hash = generateASTHash(parsedSchema);
    const parentHash = getLocalHead(baseDir);
    const commit = {
        hash,
        parentHash,
        schemaSnapshot: parsedSchema,
        author,
        message,
        createdAt: new Date(),
    };
    addLocalCommit(commit, commitLimit, baseDir);
    await addRemoteCommit(connection, commit, commitLimit);
    return commit;
}
