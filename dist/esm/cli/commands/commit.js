import * as crypto from 'crypto';
import { fatal, hint } from "../utils/cli-utils.js";
import { isInitialized, getHead, getStagedChanges, getUnstagedChanges, shortHash, hashFileContent, saveFileHash, } from "../utils/repo-manager.js";
import { loadConfig } from "../../config/config.js";
import { sortChangesByDependency, generateCombinedSQL, } from "../utils/change-tracker.js";
import * as fs from 'fs';
import * as path from 'path';
export async function commitCommand(context) {
    const { config, flags, args, projectRoot } = context;
    const author = config?.author || 'Developer <dev@example.com>';
    console.log('');
    if (!isInitialized(projectRoot)) {
        fatal('not a relq repository (or any parent directories): .relq', "run 'relq init' to initialize");
    }
    const staged = getStagedChanges(projectRoot);
    if (staged.length === 0) {
        console.log('nothing to commit, working tree clean');
        const unstaged = getUnstagedChanges(projectRoot);
        if (unstaged.length > 0) {
            console.log(`${unstaged.length} unstaged change(s).`);
            hint("run 'relq add .' to stage all changes");
        }
        else {
            hint("run 'relq add <table>' to stage changes");
        }
        return;
    }
    let message = flags['m'] || flags['message'];
    if (!message) {
        if (args.length > 0) {
            message = args.join(' ');
        }
        else {
            fatal('commit message required', "usage: relq commit -m '<message>'");
        }
    }
    const sortedChanges = sortChangesByDependency(staged);
    const sql = generateCombinedSQL(sortedChanges);
    const creates = staged.filter(c => c.type === 'CREATE').length;
    const alters = staged.filter(c => c.type === 'ALTER').length;
    const drops = staged.filter(c => c.type === 'DROP').length;
    const parentHash = getHead(projectRoot);
    const hashInput = JSON.stringify({
        changes: staged.map(c => c.id),
        message,
        timestamp: new Date().toISOString(),
        parent: parentHash,
    });
    const hash = crypto.createHash('sha1').update(hashInput).digest('hex');
    const commit = {
        hash,
        parentHash,
        author,
        message,
        timestamp: new Date().toISOString(),
        changes: sortedChanges,
        sql,
        snapshotHash: hash.substring(0, 12),
        stats: {
            creates,
            alters,
            drops,
            total: staged.length,
        },
    };
    const commitsDir = path.join(projectRoot, '.relq', 'commits');
    if (!fs.existsSync(commitsDir)) {
        fs.mkdirSync(commitsDir, { recursive: true });
    }
    fs.writeFileSync(path.join(commitsDir, `${hash}.json`), JSON.stringify(commit, null, 2), 'utf-8');
    fs.writeFileSync(path.join(projectRoot, '.relq', 'HEAD'), hash, 'utf-8');
    const workingPath = path.join(projectRoot, '.relq', 'working.json');
    const unstaged = getUnstagedChanges(projectRoot).filter(c => c.objectType !== 'SCHEMA_FILE');
    if (unstaged.length > 0) {
        fs.writeFileSync(workingPath, JSON.stringify({
            timestamp: new Date().toISOString(),
            staged: [],
            unstaged,
        }, null, 2), 'utf-8');
    }
    else {
        if (fs.existsSync(workingPath)) {
            fs.unlinkSync(workingPath);
        }
    }
    const commitConfig = await loadConfig();
    const schemaPathRaw = typeof commitConfig.schema === 'string' ? commitConfig.schema : './db/schema.ts';
    const schemaFilePath = path.resolve(projectRoot, schemaPathRaw);
    if (fs.existsSync(schemaFilePath)) {
        const currentContent = fs.readFileSync(schemaFilePath, 'utf-8');
        const currentHash = hashFileContent(currentContent);
        saveFileHash(currentHash, projectRoot);
    }
    console.log(`[${shortHash(hash)}] ${message}`);
    console.log(` ${creates} create(s), ${alters} alter(s), ${drops} drop(s)`);
    console.log('');
    hint("run 'relq push' to apply changes to database");
    hint("run 'relq export' to export as SQL file");
    console.log('');
}
export default commitCommand;
