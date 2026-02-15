"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectEnvironment = detectEnvironment;
exports.isServerless = isServerless;
exports.isTraditional = isTraditional;
exports.isEdge = isEdge;
exports.getEnvironmentDescription = getEnvironmentDescription;
const node_process_1 = __importDefault(require("node:process"));
function detectEnvironment() {
    const detected = [];
    const hasProcess = typeof node_process_1.default !== 'undefined' && node_process_1.default.env !== undefined;
    if (!hasProcess) {
        return {
            type: 'edge',
            provider: 'cloudflare',
            detected: ['NO_PROCESS_OBJECT'],
            hasProcess: false
        };
    }
    if (node_process_1.default.env.VERCEL || node_process_1.default.env.VERCEL_ENV) {
        if (node_process_1.default.env.VERCEL)
            detected.push('VERCEL');
        if (node_process_1.default.env.VERCEL_ENV)
            detected.push('VERCEL_ENV');
        return {
            type: 'serverless',
            provider: 'vercel',
            detected,
            hasProcess: true
        };
    }
    if (node_process_1.default.env.AWS_LAMBDA_FUNCTION_NAME ||
        node_process_1.default.env.AWS_EXECUTION_ENV ||
        node_process_1.default.env.LAMBDA_TASK_ROOT) {
        if (node_process_1.default.env.AWS_LAMBDA_FUNCTION_NAME)
            detected.push('AWS_LAMBDA_FUNCTION_NAME');
        if (node_process_1.default.env.AWS_EXECUTION_ENV)
            detected.push('AWS_EXECUTION_ENV');
        if (node_process_1.default.env.LAMBDA_TASK_ROOT)
            detected.push('LAMBDA_TASK_ROOT');
        return {
            type: 'serverless',
            provider: 'aws-lambda',
            detected,
            hasProcess: true
        };
    }
    if (node_process_1.default.env.NETLIFY || node_process_1.default.env.NETLIFY_DEV) {
        if (node_process_1.default.env.NETLIFY)
            detected.push('NETLIFY');
        if (node_process_1.default.env.NETLIFY_DEV)
            detected.push('NETLIFY_DEV');
        return {
            type: 'serverless',
            provider: 'netlify',
            detected,
            hasProcess: true
        };
    }
    if (node_process_1.default.env.FUNCTION_NAME || node_process_1.default.env.FUNCTION_TARGET || node_process_1.default.env.GCP_PROJECT) {
        if (node_process_1.default.env.FUNCTION_NAME)
            detected.push('FUNCTION_NAME');
        if (node_process_1.default.env.FUNCTION_TARGET)
            detected.push('FUNCTION_TARGET');
        if (node_process_1.default.env.GCP_PROJECT)
            detected.push('GCP_PROJECT');
        return {
            type: 'serverless',
            provider: 'google-cloud',
            detected,
            hasProcess: true
        };
    }
    if (node_process_1.default.env.AZURE_FUNCTIONS_ENVIRONMENT || node_process_1.default.env.WEBSITE_INSTANCE_ID) {
        if (node_process_1.default.env.AZURE_FUNCTIONS_ENVIRONMENT)
            detected.push('AZURE_FUNCTIONS_ENVIRONMENT');
        if (node_process_1.default.env.WEBSITE_INSTANCE_ID)
            detected.push('WEBSITE_INSTANCE_ID');
        return {
            type: 'serverless',
            provider: 'azure',
            detected,
            hasProcess: true
        };
    }
    if (node_process_1.default.env.CLOUDFLARE_WORKERS || node_process_1.default.env.CF_PAGES) {
        if (node_process_1.default.env.CLOUDFLARE_WORKERS)
            detected.push('CLOUDFLARE_WORKERS');
        if (node_process_1.default.env.CF_PAGES)
            detected.push('CF_PAGES');
        return {
            type: 'edge',
            provider: 'cloudflare',
            detected,
            hasProcess: true
        };
    }
    return {
        type: 'traditional',
        detected: [],
        hasProcess: true
    };
}
function isServerless() {
    return detectEnvironment().type === 'serverless';
}
function isTraditional() {
    return detectEnvironment().type === 'traditional';
}
function isEdge() {
    return detectEnvironment().type === 'edge';
}
function getEnvironmentDescription(env) {
    if (env.type === 'serverless') {
        return `${env.provider} (serverless)`;
    }
    if (env.type === 'edge') {
        return `${env.provider || 'edge'} runtime`;
    }
    return 'Traditional server';
}
