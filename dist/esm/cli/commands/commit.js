import * as crypto from 'crypto';
import { colors, createSpinner, fatal, hint } from "../utils/cli-utils.js";
import { isInitialized, getHead, getStagedChanges, getUnstagedChanges, loadSnapshot, shortHash, hashFileContent, saveFileHash, } from "../utils/repo-manager.js";
import { loadConfig, isAwsDsqlConfig } from "../../config/config.js";
import { validateSqlForDsql, formatDsqlErrors } from "../utils/dsql-validator.js";
import { getSchemaPath } from "../utils/config-loader.js";
import { sortChangesByDependency, generateCombinedSQL, generateDownSQL, } from "../utils/change-tracker.js";
import { createCommitFromSchema, generateASTHash, } from "../utils/commit-manager.js";
import { schemaToAST } from "../utils/schema-to-ast.js";
import * as fs from 'fs';
import * as path from 'path';
import { createJiti } from 'jiti';
export async function commitCommand(context) {
    const { config, flags, args, projectRoot } = context;
    const author = config?.author || 'Developer <dev@example.com>';
    console.log('');
    if (!isInitialized(projectRoot)) {
        fatal('not a relq repository (or any parent directories): .relq', "run 'relq init' to initialize");
    }
    const schemaPath = path.resolve(projectRoot, getSchemaPath(config ?? undefined));
    const { requireValidSchema } = await import("../utils/config-loader.js");
    await requireValidSchema(schemaPath, flags);
    if (flags['from-schema']) {
        return commitFromSchema(context, schemaPath, author);
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
    const dsqlConfig = await loadConfig();
    if (dsqlConfig?.connection && isAwsDsqlConfig(dsqlConfig.connection) && sql) {
        const dsqlErrors = validateSqlForDsql(sql, 'commit SQL');
        if (dsqlErrors.length > 0) {
            const dsqlResult = {
                valid: false,
                errors: dsqlErrors,
                warnings: [],
            };
            console.log('');
            console.log(formatDsqlErrors(dsqlResult));
            fatal('Commit SQL contains DSQL incompatibilities', 'Fix the issues above before committing.');
        }
    }
    const downSQL = generateDownSQL(sortedChanges);
    const snapshot = loadSnapshot(projectRoot);
    const creates = staged.filter(c => c.type === 'CREATE').length;
    const alters = staged.filter(c => c.type === 'ALTER').length;
    const drops = staged.filter(c => c.type === 'DROP').length;
    const renames = staged.filter(c => c.type === 'RENAME').length;
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
        downSQL,
        schema: snapshot,
        snapshotHash: hash.substring(0, 12),
        stats: {
            creates,
            alters,
            drops,
            renames,
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
    const schemaPathRaw = getSchemaPath(commitConfig);
    const schemaFilePath = path.resolve(projectRoot, schemaPathRaw);
    if (fs.existsSync(schemaFilePath)) {
        const currentContent = fs.readFileSync(schemaFilePath, 'utf-8');
        const currentHash = hashFileContent(currentContent);
        saveFileHash(currentHash, projectRoot);
    }
    console.log(`[${shortHash(hash)}] ${message}`);
    const statsParts = [];
    if (creates > 0)
        statsParts.push(`${creates} create(s)`);
    if (alters > 0)
        statsParts.push(`${alters} alter(s)`);
    if (drops > 0)
        statsParts.push(`${drops} drop(s)`);
    if (renames > 0)
        statsParts.push(`${renames} rename(s)`);
    console.log(` ${statsParts.length > 0 ? statsParts.join(', ') : 'no changes'}`);
    console.log('');
    hint("run 'relq push' to apply changes to database");
    hint("run 'relq export' to export as SQL file");
    console.log('');
}
async function commitFromSchema(context, schemaPath, author) {
    const { config, flags, args, projectRoot } = context;
    const spinner = createSpinner();
    let message = flags['m'] || flags['message'];
    if (!message) {
        if (args.length > 0) {
            message = args.join(' ');
        }
        else {
            fatal('commit message required', "usage: relq commit --from-schema -m '<message>'");
        }
    }
    spinner.start('Loading schema file');
    let schemaModule;
    try {
        const jiti = createJiti(path.dirname(schemaPath), { interopDefault: true });
        const module = await jiti.import(schemaPath);
        if (module && module.default && typeof module.default === 'object') {
            schemaModule = module.default;
        }
        else if (module && typeof module === 'object') {
            schemaModule = module;
        }
        else {
            throw new Error('Schema file must export an object with table/enum definitions');
        }
        spinner.succeed('Loaded schema file');
    }
    catch (err) {
        spinner.fail('Failed to load schema');
        fatal(`Could not load schema: ${err instanceof Error ? err.message : String(err)}`);
    }
    spinner.start('Converting schema to AST');
    const ast = schemaToAST(schemaModule);
    spinner.succeed('Converted schema to AST');
    const schemaHash = generateASTHash(ast);
    spinner.start('Creating commit');
    try {
        const commit = createCommitFromSchema(schemaModule, author, message, config?.commitLimit ?? 1000, projectRoot);
        spinner.succeed('Created commit');
        const tableCount = ast.tables.length;
        const enumCount = ast.enums.length;
        const functionCount = ast.functions.length;
        const viewCount = ast.views.length;
        const triggerCount = ast.triggers.length;
        console.log('');
        console.log(`[${shortHash(commit.hash)}] ${message}`);
        const statsParts = [];
        if (tableCount > 0)
            statsParts.push(`${tableCount} table(s)`);
        if (enumCount > 0)
            statsParts.push(`${enumCount} enum(s)`);
        if (functionCount > 0)
            statsParts.push(`${functionCount} function(s)`);
        if (viewCount > 0)
            statsParts.push(`${viewCount} view(s)`);
        if (triggerCount > 0)
            statsParts.push(`${triggerCount} trigger(s)`);
        console.log(` ${statsParts.length > 0 ? statsParts.join(', ') : 'empty schema'}`);
        console.log('');
        console.log(colors.muted(`Schema hash: ${schemaHash.substring(0, 12)}`));
        console.log('');
        hint("run 'relq push' to apply changes to database");
        hint("run 'relq log' to view commit history");
    }
    catch (err) {
        spinner.fail('Failed to create commit');
        fatal(`Could not create commit: ${err instanceof Error ? err.message : String(err)}`);
    }
}
export default commitCommand;
