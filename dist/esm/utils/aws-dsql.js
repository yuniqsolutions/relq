import process from 'node:process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, accessSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { F_OK, W_OK, R_OK } from 'node:constants';
import { RelqConfigError } from "../errors/relq-errors.js";
const tokenCache = new Map();
function getCacheKey(config) {
    const hash = createHash('md5')
        .update(`${config.secretAccessKey ?? ''}-${config.accessKeyId ?? ''}-${config.region}-${config.hostname}`)
        .digest('hex');
    return hash;
}
function getTempFolder() {
    return join(tmpdir(), '.dsql_');
}
function isTempFolderAvailable() {
    const tempFolder = getTempFolder();
    try {
        mkdirSync(tempFolder, { recursive: true });
        accessSync(tempFolder, F_OK | R_OK | W_OK);
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
    const envToken = process.env[envName];
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
        const tokenFile = join(getTempFolder(), `${cacheKey}.json`);
        if (existsSync(tokenFile)) {
            try {
                const parsed = JSON.parse(readFileSync(tokenFile, 'utf8'));
                if (parsed.expiresAt > Date.now()) {
                    tokenCache.set(cacheKey, parsed);
                    process.env[envName] = JSON.stringify(parsed);
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
    process.env[envName] = JSON.stringify(token);
    if (isTempFolderAvailable()) {
        const tokenFile = join(getTempFolder(), `${cacheKey}.json`);
        try {
            writeFileSync(tokenFile, JSON.stringify(token));
        }
        catch { }
    }
}
let DsqlSigner = null;
async function loadAwsSdk() {
    if (!DsqlSigner) {
        try {
            const sdk = await import('@aws-sdk/dsql-signer');
            DsqlSigner = sdk.DsqlSigner;
        }
        catch (error) {
            throw new RelqConfigError('AWS DSQL requires @aws-sdk/dsql-signer package.\n\n' +
                'Install it with:\n' +
                '  npm install @aws-sdk/dsql-signer\n' +
                '  # or\n' +
                '  bun add @aws-sdk/dsql-signer', { field: '@aws-sdk/dsql-signer', value: 'not installed' });
        }
    }
    return DsqlSigner;
}
export async function getAwsDsqlToken(config) {
    const cacheKey = getCacheKey(config);
    const cached = getFromCache(cacheKey);
    if (cached) {
        return cached.token;
    }
    if (!config.useDefaultCredentials && (!config.accessKeyId || !config.secretAccessKey)) {
        throw new RelqConfigError('AWS DSQL requires credentials. Either provide accessKeyId + secretAccessKey, ' +
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
export function clearAwsDsqlToken(config) {
    const cacheKey = getCacheKey(config);
    tokenCache.delete(cacheKey);
    const envName = `DSQL_TOKEN_${cacheKey}`;
    delete process.env[envName];
    if (isTempFolderAvailable()) {
        const tokenFile = join(getTempFolder(), `${cacheKey}.json`);
        try {
            if (existsSync(tokenFile)) {
                writeFileSync(tokenFile, '');
            }
        }
        catch { }
    }
}
export function isAwsDsql(config) {
    return !!config.aws?.hostname && !!config.aws?.region;
}
