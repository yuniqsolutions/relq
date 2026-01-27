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
exports.tagCommand = tagCommand;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const spinner_1 = require("../utils/spinner.cjs");
const repo_manager_1 = require("../utils/repo-manager.cjs");
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
async function tagCommand(context) {
    const { args, flags, projectRoot } = context;
    console.log('');
    if (!(0, repo_manager_1.isInitialized)(projectRoot)) {
        console.log(`${spinner_1.colors.red('fatal:')} not a relq repository`);
        return;
    }
    const tags = loadTags(projectRoot);
    const deleteFlag = flags['d'] === true || flags['delete'] === true;
    const force = flags['f'] === true || flags['force'] === true;
    if (deleteFlag) {
        const tagName = args[0];
        if (!tagName) {
            console.log(`${spinner_1.colors.red('error:')} Please specify tag name`);
            console.log('');
            console.log(`Usage: ${spinner_1.colors.cyan('relq tag -d <name>')}`);
            console.log('');
            return;
        }
        if (!tags[tagName]) {
            console.log(`${spinner_1.colors.red('error:')} Tag not found: ${tagName}`);
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
            console.log(`${spinner_1.colors.red('error:')} Invalid tag name`);
            console.log('Tag names can only contain: letters, numbers, dots, dashes, underscores');
            console.log('');
            return;
        }
        if (tags[tagName] && !force) {
            console.log(`${spinner_1.colors.red('error:')} Tag already exists: ${tagName}`);
            console.log('');
            console.log(`Use ${spinner_1.colors.cyan(`relq tag -f ${tagName}`)} to overwrite`);
            console.log('');
            return;
        }
        let hash;
        if (targetHash) {
            const commit = (0, repo_manager_1.loadCommit)(targetHash, projectRoot);
            if (!commit) {
                console.log(`${spinner_1.colors.red('error:')} Commit not found: ${targetHash}`);
                return;
            }
            hash = commit.hash;
        }
        else {
            const head = (0, repo_manager_1.getHead)(projectRoot);
            if (!head) {
                console.log(`${spinner_1.colors.red('error:')} No commits yet`);
                return;
            }
            hash = head;
        }
        const commit = (0, repo_manager_1.loadCommit)(hash, projectRoot);
        if (!commit) {
            console.log(`${spinner_1.colors.red('error:')} Cannot load commit`);
            return;
        }
        tags[tagName] = {
            hash,
            message: commit.message,
            createdAt: new Date().toISOString(),
        };
        saveTags(tags, projectRoot);
        console.log(`Tagged ${spinner_1.colors.yellow((0, repo_manager_1.shortHash)(hash))} as '${tagName}'`);
        console.log(`    ${commit.message}`);
        console.log('');
        return;
    }
    const tagNames = Object.keys(tags).sort();
    if (tagNames.length === 0) {
        console.log(`${spinner_1.colors.muted('No tags.')}`);
        console.log('');
        console.log(`Create one with: ${spinner_1.colors.cyan('relq tag <name>')}`);
        console.log('');
        return;
    }
    for (const name of tagNames) {
        const tag = tags[name];
        const hash = spinner_1.colors.yellow((0, repo_manager_1.shortHash)(tag.hash));
        const tagName = spinner_1.colors.cyan(name);
        console.log(`${tagName.padEnd(20)} ${hash}  ${tag.message}`);
    }
    console.log('');
}
exports.default = tagCommand;
