import * as fs from 'fs';
import * as path from 'path';
import { colors } from "../utils/spinner.js";
import { isInitialized, getHead, loadCommit, shortHash } from "../utils/repo-manager.js";
function loadTags(projectRoot) {
    const tagPath = path.join(projectRoot, '.relq', 'tags.json');
    if (fs.existsSync(tagPath)) {
        return JSON.parse(fs.readFileSync(tagPath, 'utf-8'));
    }
    return {};
}
function saveTags(tags, projectRoot) {
    const tagPath = path.join(projectRoot, '.relq', 'tags.json');
    fs.writeFileSync(tagPath, JSON.stringify(tags, null, 2));
}
export async function tagCommand(context) {
    const { args, flags, projectRoot } = context;
    console.log('');
    if (!isInitialized(projectRoot)) {
        console.log(`${colors.red('fatal:')} not a relq repository`);
        return;
    }
    const tags = loadTags(projectRoot);
    const deleteFlag = flags['d'] === true || flags['delete'] === true;
    const force = flags['f'] === true || flags['force'] === true;
    if (deleteFlag) {
        const tagName = args[0];
        if (!tagName) {
            console.log(`${colors.red('error:')} Please specify tag name`);
            console.log('');
            console.log(`Usage: ${colors.cyan('relq tag -d <name>')}`);
            console.log('');
            return;
        }
        if (!tags[tagName]) {
            console.log(`${colors.red('error:')} Tag not found: ${tagName}`);
            return;
        }
        delete tags[tagName];
        saveTags(tags, projectRoot);
        console.log(`Deleted tag '${tagName}'`);
        console.log('');
        return;
    }
    if (args[0]) {
        const tagName = args[0];
        const targetHash = args[1];
        if (!/^[a-zA-Z0-9._-]+$/.test(tagName)) {
            console.log(`${colors.red('error:')} Invalid tag name`);
            console.log('Tag names can only contain: letters, numbers, dots, dashes, underscores');
            console.log('');
            return;
        }
        if (tags[tagName] && !force) {
            console.log(`${colors.red('error:')} Tag already exists: ${tagName}`);
            console.log('');
            console.log(`Use ${colors.cyan(`relq tag -f ${tagName}`)} to overwrite`);
            console.log('');
            return;
        }
        let hash;
        if (targetHash) {
            const commit = loadCommit(targetHash, projectRoot);
            if (!commit) {
                console.log(`${colors.red('error:')} Commit not found: ${targetHash}`);
                return;
            }
            hash = commit.hash;
        }
        else {
            const head = getHead(projectRoot);
            if (!head) {
                console.log(`${colors.red('error:')} No commits yet`);
                return;
            }
            hash = head;
        }
        const commit = loadCommit(hash, projectRoot);
        if (!commit) {
            console.log(`${colors.red('error:')} Cannot load commit`);
            return;
        }
        tags[tagName] = {
            hash,
            message: commit.message,
            createdAt: new Date().toISOString(),
        };
        saveTags(tags, projectRoot);
        console.log(`Tagged ${colors.yellow(shortHash(hash))} as '${tagName}'`);
        console.log(`    ${commit.message}`);
        console.log('');
        return;
    }
    const tagNames = Object.keys(tags).sort();
    if (tagNames.length === 0) {
        console.log(`${colors.muted('No tags.')}`);
        console.log('');
        console.log(`Create one with: ${colors.cyan('relq tag <name>')}`);
        console.log('');
        return;
    }
    for (const name of tagNames) {
        const tag = tags[name];
        const hash = colors.yellow(shortHash(tag.hash));
        const tagName = colors.cyan(name);
        console.log(`${tagName.padEnd(20)} ${hash}  ${tag.message}`);
    }
    console.log('');
}
export default tagCommand;
