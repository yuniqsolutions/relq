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
exports.findProjectRoot = findProjectRoot;
exports.getRelqDir = getRelqDir;
exports.getProjectRoot = getProjectRoot;
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const os = __importStar(require("node:os"));
const CONFIG_FILENAMES = [
    'relq.config.ts',
    'relq.config.mjs',
];
function hasProjectMarker(dir) {
    for (const filename of CONFIG_FILENAMES) {
        if (fs.existsSync(path.join(dir, filename))) {
            return true;
        }
    }
    if (fs.existsSync(path.join(dir, 'package.json'))) {
        return true;
    }
    return false;
}
function findProjectRoot(startDir = process.cwd()) {
    let currentDir = path.resolve(startDir);
    const root = path.parse(currentDir).root;
    const homeDir = os.homedir();
    while (currentDir !== root) {
        if (hasProjectMarker(currentDir)) {
            return currentDir;
        }
        if (currentDir === homeDir) {
            return null;
        }
        currentDir = path.dirname(currentDir);
    }
    return null;
}
function getRelqDir(startDir = process.cwd()) {
    const projectRoot = findProjectRoot(startDir);
    if (!projectRoot) {
        const colors = {
            red: (s) => `\x1b[31m${s}\x1b[0m`,
            yellow: (s) => `\x1b[33m${s}\x1b[0m`,
            cyan: (s) => `\x1b[36m${s}\x1b[0m`,
        };
        console.error('');
        console.error(colors.red('fatal:') + ' not a relq project (or any of the parent directories)');
        console.error('');
        console.error(colors.yellow('hint:') + ` Run ${colors.cyan('relq init')} in your project directory to initialize relq.`);
        console.error('');
        process.exit(128);
    }
    return path.join(projectRoot, '.relq');
}
function getProjectRoot(startDir = process.cwd()) {
    const projectRoot = findProjectRoot(startDir);
    if (!projectRoot) {
        const colors = {
            red: (s) => `\x1b[31m${s}\x1b[0m`,
            yellow: (s) => `\x1b[33m${s}\x1b[0m`,
            cyan: (s) => `\x1b[36m${s}\x1b[0m`,
        };
        console.error('');
        console.error(colors.red('fatal:') + ' not a relq project (or any of the parent directories)');
        console.error('');
        console.error(colors.yellow('hint:') + ` Run ${colors.cyan('relq init')} in your project directory to initialize relq.`);
        console.error('');
        process.exit(128);
    }
    return projectRoot;
}
exports.default = { findProjectRoot, getRelqDir, getProjectRoot };
