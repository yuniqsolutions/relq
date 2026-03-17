import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { buildPoolConfig } from "../../config/config.js";
import { detectDialect } from "./dialect-router.js";
const RELQ_DIR = '.relq';
const HEAD_FILE = 'HEAD';
const FETCH_HEAD_FILE = 'FETCH_HEAD';
const STAGED_FILE = 'staged.json';
const WORKING_FILE = 'working.json';
const SNAPSHOT_FILE = 'snapshot.json';
const COMMITS_DIR = 'commits';
const FILE_HASH_FILE = 'file_hash';
export function isInitialized(projectRoot = process.cwd()) {
    const relqPath = path.join(projectRoot, RELQ_DIR);
    const headPath = path.join(relqPath, HEAD_FILE);
    return fs.existsSync(relqPath) && fs.existsSync(headPath);
}
export function initRepository(projectRoot = process.cwd()) {
    const relqPath = path.join(projectRoot, RELQ_DIR);
    const commitsPath = path.join(relqPath, COMMITS_DIR);
    if (!fs.existsSync(relqPath)) {
        fs.mkdirSync(relqPath, { recursive: true });
    }
    if (!fs.existsSync(commitsPath)) {
        fs.mkdirSync(commitsPath, { recursive: true });
    }
    const headPath = path.join(relqPath, HEAD_FILE);
    if (!fs.existsSync(headPath)) {
        fs.writeFileSync(headPath, '', 'utf-8');
    }
    const workingPath = path.join(relqPath, WORKING_FILE);
    if (!fs.existsSync(workingPath)) {
        const initialState = {
            timestamp: new Date().toISOString(),
            staged: [],
            unstaged: [],
        };
        fs.writeFileSync(workingPath, JSON.stringify(initialState, null, 2), 'utf-8');
    }
}
export function getHead(projectRoot = process.cwd()) {
    const headPath = path.join(projectRoot, RELQ_DIR, HEAD_FILE);
    if (!fs.existsSync(headPath)) {
        return null;
    }
    const content = fs.readFileSync(headPath, 'utf-8').trim();
    return content || null;
}
export function setHead(hash, projectRoot = process.cwd()) {
    const headPath = path.join(projectRoot, RELQ_DIR, HEAD_FILE);
    fs.writeFileSync(headPath, hash, 'utf-8');
}
export function getFetchHead(projectRoot = process.cwd()) {
    const fetchPath = path.join(projectRoot, RELQ_DIR, FETCH_HEAD_FILE);
    if (!fs.existsSync(fetchPath)) {
        return null;
    }
    return fs.readFileSync(fetchPath, 'utf-8').trim() || null;
}
export function setFetchHead(hash, projectRoot = process.cwd()) {
    const fetchPath = path.join(projectRoot, RELQ_DIR, FETCH_HEAD_FILE);
    fs.writeFileSync(fetchPath, hash, 'utf-8');
}
export function generateHash(schema) {
    const normalized = JSON.stringify(schema, Object.keys(schema).sort());
    return crypto.createHash('sha1').update(normalized).digest('hex');
}
export function shortHash(hash) {
    return hash.substring(0, 7);
}
export function getConnectionId(connection) {
    const parts = [
        connection.host || 'localhost',
        String(connection.port || 5432),
        connection.database || 'postgres',
        connection.user || 'postgres',
    ];
    return crypto.createHash('sha256').update(parts.join('/')).digest('hex').substring(0, 12);
}
export function getConnectionLabel(connection) {
    const user = connection.user || 'postgres';
    const host = connection.host || 'localhost';
    const db = connection.database || 'postgres';
    return `${user}@${host}/${db}`;
}
export function getRemoteRef(connection) {
    return {
        id: getConnectionId(connection),
        label: getConnectionLabel(connection),
    };
}
export function isCommitSyncedWith(commit, connection) {
    const connectionId = getConnectionId(connection);
    if (commit.remotes?.pushed?.some((r) => r.id === connectionId)) {
        return { synced: true, type: 'pushed' };
    }
    if (commit.remotes?.pulled?.some((r) => r.id === connectionId)) {
        return { synced: true, type: 'pulled' };
    }
    if (commit.message?.startsWith('pull: sync from ')) {
        const pullTarget = commit.message.replace('pull: sync from ', '');
        const currentLabel = getConnectionLabel(connection);
        const legacyLabel = `${connection.user}@${connection.host}:${connection.port || 5432}/${connection.database}`;
        if (pullTarget === currentLabel || pullTarget === legacyLabel) {
            return { synced: true, type: 'pulled' };
        }
    }
    return { synced: false, type: null };
}
export function markCommitAsPushed(commitHash, connection, projectRoot = process.cwd()) {
    const commitPath = path.join(projectRoot, RELQ_DIR, COMMITS_DIR, `${commitHash}.json`);
    if (!fs.existsSync(commitPath)) {
        return;
    }
    const commit = JSON.parse(fs.readFileSync(commitPath, 'utf-8'));
    const remoteRef = getRemoteRef(connection);
    if (!commit.remotes) {
        commit.remotes = {};
    }
    if (!commit.remotes.pushed) {
        commit.remotes.pushed = [];
    }
    if (!commit.remotes.pushed.some((r) => r.id === remoteRef.id)) {
        commit.remotes.pushed.push(remoteRef);
    }
    fs.writeFileSync(commitPath, JSON.stringify(commit, null, 2), 'utf-8');
}
export function markCommitAsPulled(commitHash, connection, projectRoot = process.cwd()) {
    const commitPath = path.join(projectRoot, RELQ_DIR, COMMITS_DIR, `${commitHash}.json`);
    if (!fs.existsSync(commitPath)) {
        return;
    }
    const commit = JSON.parse(fs.readFileSync(commitPath, 'utf-8'));
    const remoteRef = getRemoteRef(connection);
    if (!commit.remotes) {
        commit.remotes = {};
    }
    if (!commit.remotes.pulled) {
        commit.remotes.pulled = [];
    }
    if (!commit.remotes.pulled.some((r) => r.id === remoteRef.id)) {
        commit.remotes.pulled.push(remoteRef);
    }
    fs.writeFileSync(commitPath, JSON.stringify(commit, null, 2), 'utf-8');
}
export function saveCommit(commit, projectRoot = process.cwd()) {
    const commitsPath = path.join(projectRoot, RELQ_DIR, COMMITS_DIR);
    const commitPath = path.join(commitsPath, `${commit.hash}.json`);
    fs.writeFileSync(commitPath, JSON.stringify(commit, null, 2), 'utf-8');
}
export function loadCommit(hash, projectRoot = process.cwd()) {
    const commitPath = path.join(projectRoot, RELQ_DIR, COMMITS_DIR, `${hash}.json`);
    if (!fs.existsSync(commitPath)) {
        return null;
    }
    return JSON.parse(fs.readFileSync(commitPath, 'utf-8'));
}
export function getAllCommits(projectRoot = process.cwd()) {
    const commitsPath = path.join(projectRoot, RELQ_DIR, COMMITS_DIR);
    if (!fs.existsSync(commitsPath)) {
        return [];
    }
    const files = fs.readdirSync(commitsPath).filter(f => f.endsWith('.json'));
    const commits = [];
    for (const file of files) {
        const content = fs.readFileSync(path.join(commitsPath, file), 'utf-8');
        commits.push(JSON.parse(content));
    }
    commits.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return commits;
}
export function getCommitHistory(limit = 20, projectRoot = process.cwd()) {
    const head = getHead(projectRoot);
    if (!head)
        return [];
    const history = [];
    let currentHash = head;
    while (currentHash && history.length < limit) {
        const commit = loadCommit(currentHash, projectRoot);
        if (!commit)
            break;
        history.push(commit);
        currentHash = commit.parentHash;
    }
    return history;
}
export function buildTrackingMap(ast) {
    const map = {
        tables: {},
        columns: {},
        indexes: {},
        enums: {},
        functions: {},
    };
    for (const table of ast.tables) {
        if (table.trackingId) {
            map.tables[table.trackingId] = table.name;
        }
        for (const col of table.columns) {
            if (col.trackingId) {
                map.columns[col.trackingId] = `${table.name}.${col.name}`;
            }
        }
        for (const idx of table.indexes) {
            if (idx.trackingId) {
                map.indexes[idx.trackingId] = idx.name;
            }
        }
    }
    for (const e of ast.enums) {
        if (e.trackingId) {
            map.enums[e.trackingId] = e.name;
        }
    }
    for (const f of ast.functions) {
        if (f.trackingId) {
            map.functions[f.trackingId] = f.name;
        }
    }
    return map;
}
export function createCommit(schema, author, message, projectRoot = process.cwd(), options) {
    const hash = generateHash(schema);
    const parentHash = getHead(projectRoot);
    const commit = {
        hash,
        parentHash,
        author,
        message,
        timestamp: new Date().toISOString(),
        schema,
        stats: {
            tables: schema.tables.length,
            columns: schema.tables.reduce((acc, t) => acc + t.columns.length, 0),
            indexes: schema.tables.reduce((acc, t) => acc + t.indexes.length, 0),
            enums: schema.enums?.length || 0,
            domains: schema.domains?.length || 0,
            compositeTypes: schema.compositeTypes?.length || 0,
            sequences: schema.sequences?.length || 0,
            functions: schema.functions?.length || 0,
            triggers: schema.triggers?.length || 0,
        },
    };
    if (options?.schemaAST) {
        commit.schemaAST = options.schemaAST;
        commit.trackingMap = buildTrackingMap(options.schemaAST);
    }
    if (options?.changes) {
        commit.changes = options.changes;
    }
    saveCommit(commit, projectRoot);
    setHead(hash, projectRoot);
    if (!options?.skipClearStaged) {
        clearStaged(projectRoot);
    }
    return commit;
}
export function getStaged(projectRoot = process.cwd()) {
    const stagedPath = path.join(projectRoot, RELQ_DIR, STAGED_FILE);
    if (!fs.existsSync(stagedPath)) {
        return null;
    }
    const content = fs.readFileSync(stagedPath, 'utf-8');
    return content === 'null' ? null : JSON.parse(content);
}
export function setStaged(staged, projectRoot = process.cwd()) {
    const stagedPath = path.join(projectRoot, RELQ_DIR, STAGED_FILE);
    fs.writeFileSync(stagedPath, staged ? JSON.stringify(staged, null, 2) : 'null', 'utf-8');
}
export function clearStaged(projectRoot = process.cwd()) {
    setStaged(null, projectRoot);
}
export function hasStaged(projectRoot = process.cwd()) {
    const staged = getStaged(projectRoot);
    if (!staged)
        return false;
    return (staged.tables.added.length > 0 ||
        staged.tables.modified.length > 0 ||
        staged.tables.removed.length > 0 ||
        staged.functions.added.length > 0 ||
        staged.functions.modified.length > 0 ||
        staged.functions.removed.length > 0);
}
export function loadSnapshot(projectRoot = process.cwd()) {
    const snapshotPath = path.join(projectRoot, RELQ_DIR, SNAPSHOT_FILE);
    if (!fs.existsSync(snapshotPath)) {
        return null;
    }
    const raw = JSON.parse(fs.readFileSync(snapshotPath, 'utf-8'));
    return migrateSnapshot(raw);
}
export function saveSnapshot(schema, projectRoot = process.cwd()) {
    const snapshotPath = path.join(projectRoot, RELQ_DIR, SNAPSHOT_FILE);
    fs.writeFileSync(snapshotPath, JSON.stringify(schema, null, 2), 'utf-8');
}
export function hashFileContent(content) {
    return crypto.createHash('sha1').update(content, 'utf8').digest('hex');
}
export function getSavedFileHash(projectRoot = process.cwd()) {
    const hashPath = path.join(projectRoot, RELQ_DIR, FILE_HASH_FILE);
    if (!fs.existsSync(hashPath)) {
        return null;
    }
    return fs.readFileSync(hashPath, 'utf-8').trim() || null;
}
export function saveFileHash(hash, projectRoot = process.cwd()) {
    const hashPath = path.join(projectRoot, RELQ_DIR, FILE_HASH_FILE);
    fs.writeFileSync(hashPath, hash, 'utf-8');
}
export function detectFileChanges(schemaPath, projectRoot = process.cwd()) {
    if (!fs.existsSync(schemaPath)) {
        return null;
    }
    const currentContent = fs.readFileSync(schemaPath, 'utf-8');
    const currentHash = hashFileContent(currentContent);
    const savedHash = getSavedFileHash(projectRoot);
    if (savedHash && currentHash === savedHash) {
        return null;
    }
    if (!savedHash) {
        return {
            id: `file_${currentHash.substring(0, 8)}`,
            type: 'ALTER',
            objectType: 'SCHEMA_FILE',
            objectName: path.basename(schemaPath),
            before: null,
            after: { hash: currentHash },
            sql: '-- Schema file needs comparison (no previous hash)',
            detectedAt: new Date().toISOString(),
        };
    }
    return {
        id: `file_${currentHash.substring(0, 8)}`,
        type: 'ALTER',
        objectType: 'SCHEMA_FILE',
        objectName: path.basename(schemaPath),
        before: { hash: savedHash },
        after: { hash: currentHash },
        sql: '-- Schema file modified (comments, formatting, or manual edits)',
        detectedAt: new Date().toISOString(),
    };
}
export function loadWorkingState(projectRoot = process.cwd()) {
    const workingPath = path.join(projectRoot, RELQ_DIR, WORKING_FILE);
    if (!fs.existsSync(workingPath)) {
        return null;
    }
    const content = fs.readFileSync(workingPath, 'utf-8');
    return content === 'null' ? null : JSON.parse(content);
}
export function saveWorkingState(state, projectRoot = process.cwd()) {
    const workingPath = path.join(projectRoot, RELQ_DIR, WORKING_FILE);
    fs.writeFileSync(workingPath, JSON.stringify(state, null, 2), 'utf-8');
}
export function getOrCreateWorkingState(projectRoot = process.cwd()) {
    const existing = loadWorkingState(projectRoot);
    if (existing)
        return existing;
    return {
        timestamp: new Date().toISOString(),
        staged: [],
        unstaged: [],
    };
}
export function addUnstagedChanges(changes, projectRoot = process.cwd()) {
    const state = getOrCreateWorkingState(projectRoot);
    const existingIds = new Set(state.unstaged.map(c => c.id));
    for (const change of changes) {
        if (!existingIds.has(change.id)) {
            state.unstaged.push(change);
            existingIds.add(change.id);
        }
    }
    state.timestamp = new Date().toISOString();
    saveWorkingState(state, projectRoot);
}
export function clearUnstagedChanges(projectRoot = process.cwd()) {
    const state = getOrCreateWorkingState(projectRoot);
    state.unstaged = [];
    state.timestamp = new Date().toISOString();
    saveWorkingState(state, projectRoot);
}
export function stageChanges(patterns, projectRoot = process.cwd()) {
    const state = getOrCreateWorkingState(projectRoot);
    const staged = [];
    const remaining = [];
    const isAll = patterns.includes('*') || patterns.includes('.');
    for (const change of state.unstaged) {
        const matchesPattern = isAll || patterns.some(p => {
            const fullName = change.parentName
                ? `${change.parentName}.${change.objectName}`
                : change.objectName;
            return fullName.includes(p) ||
                change.objectName === p ||
                change.objectType.toLowerCase() === p.toLowerCase();
        });
        if (matchesPattern) {
            staged.push(change);
        }
        else {
            remaining.push(change);
        }
    }
    const newKeys = new Set(staged.map(c => `${c.objectType}:${c.objectName}:${c.parentName || ''}`));
    const keptStaged = state.staged.filter(c => !newKeys.has(`${c.objectType}:${c.objectName}:${c.parentName || ''}`));
    state.staged = [...keptStaged, ...staged];
    state.unstaged = remaining;
    state.timestamp = new Date().toISOString();
    saveWorkingState(state, projectRoot);
    return staged;
}
export function unstageChanges(patterns, projectRoot = process.cwd()) {
    const state = getOrCreateWorkingState(projectRoot);
    const unstaged = [];
    const remaining = [];
    const isAll = patterns.includes('*') || patterns.includes('.');
    for (const change of state.staged) {
        const matchesPattern = isAll || patterns.some(p => {
            const fullName = change.parentName
                ? `${change.parentName}.${change.objectName}`
                : change.objectName;
            return fullName.includes(p) || change.objectName === p;
        });
        if (matchesPattern) {
            unstaged.push(change);
        }
        else {
            remaining.push(change);
        }
    }
    state.unstaged.push(...unstaged);
    state.staged = remaining;
    state.timestamp = new Date().toISOString();
    saveWorkingState(state, projectRoot);
    return unstaged;
}
export function clearWorkingState(projectRoot = process.cwd()) {
    const workingPath = path.join(projectRoot, RELQ_DIR, WORKING_FILE);
    if (fs.existsSync(workingPath)) {
        fs.unlinkSync(workingPath);
    }
}
export function getStagedChanges(projectRoot = process.cwd()) {
    const state = loadWorkingState(projectRoot);
    return state?.staged || [];
}
export function cleanupStagedChanges(validChanges, projectRoot = process.cwd()) {
    const state = getOrCreateWorkingState(projectRoot);
    const validKeys = new Set(validChanges.map(c => `${c.objectType}:${c.objectName}:${c.parentName || ''}`));
    const originalCount = state.staged.length;
    state.staged = state.staged.filter(c => validKeys.has(`${c.objectType}:${c.objectName}:${c.parentName || ''}`));
    const removedCount = originalCount - state.staged.length;
    if (removedCount > 0) {
        state.timestamp = new Date().toISOString();
        saveWorkingState(state, projectRoot);
    }
    return removedCount;
}
export function getUnstagedChanges(projectRoot = process.cwd()) {
    const state = loadWorkingState(projectRoot);
    return state?.unstaged || [];
}
export function hasUncommittedChanges(projectRoot = process.cwd()) {
    const state = loadWorkingState(projectRoot);
    if (!state)
        return false;
    return state.staged.length > 0 || state.unstaged.length > 0;
}
export async function ensureRemoteTable(connection) {
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
                author VARCHAR(255) NOT NULL,
                message TEXT,
                schema_snapshot ${jsonType} NOT NULL,
                stats ${jsonType},
                created_at TIMESTAMPTZ DEFAULT NOW(),
                applied_at TIMESTAMPTZ,
                rolled_back_at TIMESTAMPTZ
            );
        `);
        try {
            await pool.query(`CREATE INDEX IF NOT EXISTS idx_relq_commits_hash ON _relq_commits(hash);`);
        }
        catch { }
        try {
            await pool.query(`CREATE INDEX IF NOT EXISTS idx_relq_commits_created ON _relq_commits(created_at DESC);`);
        }
        catch { }
        const colCheck = await pool.query(`
            SELECT column_name FROM information_schema.columns
            WHERE table_name = '_relq_commits' AND column_name IN ('applied_at', 'rolled_back_at')
        `);
        const existingCols = new Set(colCheck.rows.map((r) => r.column_name));
        if (!existingCols.has('applied_at')) {
            try {
                await pool.query(`ALTER TABLE _relq_commits ADD COLUMN applied_at TIMESTAMPTZ;`);
            }
            catch { }
        }
        if (!existingCols.has('rolled_back_at')) {
            try {
                await pool.query(`ALTER TABLE _relq_commits ADD COLUMN rolled_back_at TIMESTAMPTZ;`);
            }
            catch { }
        }
    }
    finally {
        await pool.end();
    }
}
export async function markCommitAsApplied(connection, commitHash) {
    const { Pool } = await import('pg');
    const poolConfig = await buildPoolConfig(connection);
    const pool = new Pool(poolConfig);
    try {
        await pool.query(`UPDATE _relq_commits SET applied_at = NOW(), rolled_back_at = NULL WHERE hash = $1`, [commitHash]);
    }
    finally {
        await pool.end();
    }
}
export async function markCommitAsRolledBack(connection, commitHash) {
    const { Pool } = await import('pg');
    const poolConfig = await buildPoolConfig(connection);
    const pool = new Pool(poolConfig);
    try {
        await pool.query(`UPDATE _relq_commits SET rolled_back_at = NOW() WHERE hash = $1`, [commitHash]);
    }
    finally {
        await pool.end();
    }
}
export async function getPushedButNotAppliedCommits(connection, localHashes) {
    if (localHashes.length === 0)
        return [];
    const { Pool } = await import('pg');
    const poolConfig = await buildPoolConfig(connection);
    const pool = new Pool(poolConfig);
    try {
        const result = await pool.query(`
            SELECT hash FROM _relq_commits 
            WHERE hash = ANY($1::varchar[]) 
            AND applied_at IS NULL 
            AND (rolled_back_at IS NULL OR rolled_back_at < NOW() - INTERVAL '1 hour')
            ORDER BY created_at ASC
        `, [localHashes]);
        return result.rows.map(row => row.hash);
    }
    finally {
        await pool.end();
    }
}
export async function fetchRemoteCommits(connection, limit = 100) {
    const { Pool } = await import('pg');
    const poolConfig = await buildPoolConfig(connection);
    const pool = new Pool(poolConfig);
    try {
        const result = await pool.query(`
            SELECT hash, parent_hash, author, message, schema_snapshot, stats, created_at
            FROM _relq_commits
            ORDER BY created_at DESC
            LIMIT $1
        `, [limit]);
        return result.rows.map(row => ({
            hash: row.hash,
            parentHash: row.parent_hash,
            author: row.author,
            message: row.message || '',
            timestamp: row.created_at.toISOString(),
            schema: row.schema_snapshot,
            stats: row.stats || { tables: 0, columns: 0, indexes: 0, functions: 0, triggers: 0 },
        }));
    }
    finally {
        await pool.end();
    }
}
export async function getRemoteHead(connection) {
    const commits = await fetchRemoteCommits(connection, 1);
    return commits.length > 0 ? commits[0].hash : null;
}
export async function pushCommit(connection, commit, projectRoot = process.cwd()) {
    const { Pool } = await import('pg');
    const poolConfig = await buildPoolConfig(connection);
    const pool = new Pool(poolConfig);
    try {
        let schemaSnapshot = null;
        if (commit.schema) {
            schemaSnapshot = commit.schema;
        }
        else {
            schemaSnapshot = loadSnapshot(projectRoot);
        }
        if (!schemaSnapshot) {
            throw new Error(`Cannot push commit ${commit.hash}: No schema snapshot available. Run 'relq pull' first.`);
        }
        const stats = commit.stats || {
            tables: 0,
            columns: 0,
            indexes: 0,
            enums: 0,
            domains: 0,
            compositeTypes: 0,
            sequences: 0,
            functions: 0,
            triggers: 0,
        };
        await pool.query(`
            INSERT INTO _relq_commits (hash, parent_hash, author, message, schema_snapshot, stats)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (hash) DO NOTHING
        `, [
            commit.hash,
            commit.parentHash,
            commit.author,
            commit.message,
            JSON.stringify(schemaSnapshot),
            JSON.stringify(stats),
        ]);
    }
    finally {
        await pool.end();
    }
}
export async function getRepoStatus(connection, projectRoot = process.cwd()) {
    const initialized = isInitialized(projectRoot);
    const head = getHead(projectRoot);
    const staged = getStaged(projectRoot);
    const localCommits = getAllCommits(projectRoot).length;
    let aheadBy = 0;
    let behindBy = 0;
    if (initialized && head) {
        try {
            const remoteHead = await getRemoteHead(connection);
            const localHashes = new Set(getAllCommits(projectRoot).map(c => c.hash));
            const remoteCommits = await fetchRemoteCommits(connection, 100);
            const remoteHashes = new Set(remoteCommits.map(c => c.hash));
            aheadBy = [...localHashes].filter(h => !remoteHashes.has(h)).length;
            behindBy = [...remoteHashes].filter(h => !localHashes.has(h)).length;
        }
        catch {
        }
    }
    return {
        initialized,
        head,
        staged,
        localCommits,
        aheadBy,
        behindBy,
    };
}
export function createEmptySchema() {
    return {
        extensions: [],
        enums: [],
        domains: [],
        compositeTypes: [],
        sequences: [],
        collations: [],
        tables: [],
        functions: [],
        triggers: [],
        views: [],
        materializedViews: [],
        foreignTables: [],
    };
}
export function migrateSnapshot(snapshot) {
    const extensions = (snapshot.extensions || []).map(ext => typeof ext === 'string' ? { name: ext } : ext);
    const triggers = (snapshot.triggers || []).map((t) => ({
        ...t,
        events: t.events || (t.event ? [t.event] : []),
        forEach: t.forEach || 'STATEMENT',
        functionName: t.functionName || '',
    }));
    return {
        extensions,
        enums: snapshot.enums || [],
        domains: snapshot.domains || [],
        compositeTypes: snapshot.compositeTypes || [],
        sequences: snapshot.sequences || [],
        collations: snapshot.collations || [],
        tables: snapshot.tables || [],
        functions: snapshot.functions || [],
        triggers,
        views: snapshot.views || [],
        materializedViews: snapshot.materializedViews || [],
        foreignTables: snapshot.foreignTables || [],
    };
}
export function loadTags(projectRoot = process.cwd()) {
    const tagPath = path.join(projectRoot, '.relq', 'tags.json');
    if (fs.existsSync(tagPath)) {
        return JSON.parse(fs.readFileSync(tagPath, 'utf-8'));
    }
    return {};
}
export function saveTags(tags, projectRoot = process.cwd()) {
    const tagPath = path.join(projectRoot, '.relq', 'tags.json');
    fs.writeFileSync(tagPath, JSON.stringify(tags, null, 2));
}
export function resolveRef(ref, projectRoot = process.cwd()) {
    const commit = loadCommit(ref, projectRoot);
    if (commit)
        return commit.hash;
    const tags = loadTags(projectRoot);
    if (tags[ref])
        return tags[ref].hash;
    const headMatch = ref.match(/^HEAD~(\d+)$/);
    if (headMatch) {
        const offset = parseInt(headMatch[1]);
        let current = getHead(projectRoot);
        for (let i = 0; i < offset && current; i++) {
            const c = loadCommit(current, projectRoot);
            if (!c || !c.parentHash)
                return null;
            current = c.parentHash;
        }
        return current;
    }
    return null;
}
export function loadParentCommit(hash, projectRoot = process.cwd()) {
    const commit = loadCommit(hash, projectRoot);
    if (!commit || !commit.parentHash)
        return null;
    return loadCommit(commit.parentHash, projectRoot);
}
