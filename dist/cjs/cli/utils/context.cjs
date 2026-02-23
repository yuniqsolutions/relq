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
exports.loadEnvFile = loadEnvFile;
exports.buildContext = buildContext;
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const project_root_1 = require("./project-root.cjs");
const config_loader_1 = require("./config-loader.cjs");
const ui_1 = require("./ui.cjs");
const colors_1 = require("./colors.cjs");
function loadEnvFile() {
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
async function buildContext(opts = {}) {
    const { requireConfig = true } = opts;
    loadEnvFile();
    const configResult = (0, config_loader_1.findConfigFileRecursive)();
    const projectRoot = configResult?.directory || (0, project_root_1.findProjectRoot)() || process.cwd();
    if (requireConfig && !configResult) {
        (0, ui_1.fatal)('relq.config.ts not found', `Run ${colors_1.colors.cyan('relq init')} to create one.`);
    }
    let config = {};
    if (configResult?.path) {
        config = await (0, config_loader_1.loadConfigWithEnv)(configResult.path);
    }
    return { config, projectRoot };
}
