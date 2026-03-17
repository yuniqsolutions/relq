import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
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
export function findProjectRoot(startDir = process.cwd()) {
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
export function getRelqDir(startDir = process.cwd()) {
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
export function getProjectRoot(startDir = process.cwd()) {
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
export default { findProjectRoot, getRelqDir, getProjectRoot };
