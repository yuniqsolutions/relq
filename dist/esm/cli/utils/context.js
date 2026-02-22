import * as fs from 'node:fs';
import * as path from 'node:path';
import { findProjectRoot } from "./project-root.js";
import { findConfigFileRecursive, loadConfigWithEnv } from "./config-loader.js";
import { fatal } from "./ui.js";
import { colors } from "./colors.js";
export function loadEnvFile() {
    let currentDir = process.cwd();
    const root = path.parse(currentDir).root;
    while (currentDir !== root) {
        const envPath = path.join(currentDir, '.env');
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf-8');
            for (const line of envContent.split('\n')) {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith('#'))
                    continue;
                const match = trimmed.match(/^([^=]+)=(.*)$/);
                if (match) {
                    const key = match[1].trim();
                    const value = match[2].trim().replace(/^["']|["']$/g, '');
                    if (!process.env[key]) {
                        process.env[key] = value;
                    }
                }
            }
            return;
        }
        currentDir = path.dirname(currentDir);
    }
}
export async function buildContext(opts = {}) {
    const { requireConfig = true } = opts;
    loadEnvFile();
    const configResult = findConfigFileRecursive();
    const projectRoot = configResult?.directory || findProjectRoot() || process.cwd();
    if (requireConfig && !configResult) {
        fatal('relq.config.ts not found', `Run ${colors.cyan('relq init')} to create one.`);
    }
    let config = {};
    if (configResult?.path) {
        config = await loadConfigWithEnv(configResult.path);
    }
    return { config, projectRoot };
}
