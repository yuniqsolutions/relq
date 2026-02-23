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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAwsDsqlToken = getAwsDsqlToken;
exports.clearAwsDsqlToken = clearAwsDsqlToken;
exports.isAwsDsql = isAwsDsql;
const node_process_1 = __importDefault(require("node:process"));
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const node_os_1 = require("node:os");
const node_crypto_1 = require("node:crypto");
const node_constants_1 = require("node:constants");
const relq_errors_1 = require("../errors/relq-errors.cjs");
const tokenCache = new Map();
function getCacheKey(config) {
    const hash = (0, node_crypto_1.createHash)('md5')
        .update(`${config.secretAccessKey ?? ''}-${config.accessKeyId ?? ''}-${config.region}-${config.hostname}`)
        .digest('hex');
    return hash;
}
function getTempFolder() {
    return (0, node_path_1.join)((0, node_os_1.tmpdir)(), '.dsql_');
}
function isTempFolderAvailable() {
    const tempFolder = getTempFolder();
    try {
        (0, node_fs_1.mkdirSync)(tempFolder, { recursive: true });
        (0, node_fs_1.accessSync)(tempFolder, node_constants_1.F_OK | node_constants_1.R_OK | node_constants_1.W_OK);
        return true;
    }
    catch {
        return false;
    }
}
function getFromCache(cacheKey) {
    const memoryToken = tokenCache.get(cacheKey);
    if (memoryToken && memoryToken.expiresAt > Date.now()) {
        return memoryToken;
    }
    const envName = `DSQL_TOKEN_${cacheKey}`;
    const envToken = node_process_1.default.env[envName];
    if (envToken) {
        try {
            const parsed = JSON.parse(envToken);
            if (parsed.expiresAt > Date.now()) {
                tokenCache.set(cacheKey, parsed);
                return parsed;
            }
        }
        catch { }
    }
    if (isTempFolderAvailable()) {
        const tokenFile = (0, node_path_1.join)(getTempFolder(), `${cacheKey}.json`);
        if ((0, node_fs_1.existsSync)(tokenFile)) {
            try {
                const parsed = JSON.parse((0, node_fs_1.readFileSync)(tokenFile, 'utf8'));
                if (parsed.expiresAt > Date.now()) {
                    tokenCache.set(cacheKey, parsed);
                    node_process_1.default.env[envName] = JSON.stringify(parsed);
                    return parsed;
                }
            }
            catch { }
        }
    }
    return null;
}
function saveToCache(cacheKey, token) {
    tokenCache.set(cacheKey, token);
    const envName = `DSQL_TOKEN_${cacheKey}`;
    node_process_1.default.env[envName] = JSON.stringify(token);
    if (isTempFolderAvailable()) {
        const tokenFile = (0, node_path_1.join)(getTempFolder(), `${cacheKey}.json`);
        try {
            (0, node_fs_1.writeFileSync)(tokenFile, JSON.stringify(token));
        }
        catch { }
    }
}
let DsqlSigner = null;
async function loadAwsSdk() {
    if (!DsqlSigner) {
        try {
            const sdk = await Promise.resolve().then(() => __importStar(require('@aws-sdk/dsql-signer')));
            DsqlSigner = sdk.DsqlSigner;
        }
        catch (error) {
            throw new relq_errors_1.RelqConfigError('AWS DSQL requires @aws-sdk/dsql-signer package.\n\n' +
                'Install it with:\n' +
                '  npm install @aws-sdk/dsql-signer\n' +
                '  # or\n' +
                '  bun add @aws-sdk/dsql-signer', { field: '@aws-sdk/dsql-signer', value: 'not installed' });
        }
    }
    return DsqlSigner;
}
async function getAwsDsqlToken(config) {
    const cacheKey = getCacheKey(config);
    const cached = getFromCache(cacheKey);
    if (cached) {
        return cached.token;
    }
    if (!config.useDefaultCredentials && (!config.accessKeyId || !config.secretAccessKey)) {
        throw new relq_errors_1.RelqConfigError('AWS DSQL requires credentials. Either provide accessKeyId + secretAccessKey, ' +
            'or set useDefaultCredentials: true to use AWS credential chain.', { field: 'aws.credentials', value: 'missing' });
    }
    const SignerClass = await loadAwsSdk();
    const expiresIn = config.tokenExpiresIn ?? 604800;
    const signerConfig = {
        hostname: config.hostname,
        region: config.region,
        expiresIn,
    };
    if (!config.useDefaultCredentials) {
        signerConfig.credentials = {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
        };
    }
    const signer = new SignerClass(signerConfig);
    const token = await signer.getDbConnectAdminAuthToken();
    const cachedToken = {
        token,
        expiresAt: Date.now() + ((expiresIn - 30) * 1000)
    };
    saveToCache(cacheKey, cachedToken);
    return token;
}
function clearAwsDsqlToken(config) {
    const cacheKey = getCacheKey(config);
    tokenCache.delete(cacheKey);
    const envName = `DSQL_TOKEN_${cacheKey}`;
    delete node_process_1.default.env[envName];
    if (isTempFolderAvailable()) {
        const tokenFile = (0, node_path_1.join)(getTempFolder(), `${cacheKey}.json`);
        try {
            if ((0, node_fs_1.existsSync)(tokenFile)) {
                (0, node_fs_1.writeFileSync)(tokenFile, '');
            }
        }
        catch { }
    }
}
function isAwsDsql(config) {
    return !!config.aws?.hostname && !!config.aws?.region;
}
