import process from 'node:process';
export function detectEnvironment() {
    const detected = [];
    const hasProcess = typeof process !== 'undefined' && process.env !== undefined;
    if (!hasProcess) {
        return {
            type: 'edge',
            provider: 'cloudflare',
            detected: ['NO_PROCESS_OBJECT'],
            hasProcess: false
        };
    }
    if (process.env.VERCEL || process.env.VERCEL_ENV) {
        if (process.env.VERCEL)
            detected.push('VERCEL');
        if (process.env.VERCEL_ENV)
            detected.push('VERCEL_ENV');
        return {
            type: 'serverless',
            provider: 'vercel',
            detected,
            hasProcess: true
        };
    }
    if (process.env.AWS_LAMBDA_FUNCTION_NAME ||
        process.env.AWS_EXECUTION_ENV ||
        process.env.LAMBDA_TASK_ROOT) {
        if (process.env.AWS_LAMBDA_FUNCTION_NAME)
            detected.push('AWS_LAMBDA_FUNCTION_NAME');
        if (process.env.AWS_EXECUTION_ENV)
            detected.push('AWS_EXECUTION_ENV');
        if (process.env.LAMBDA_TASK_ROOT)
            detected.push('LAMBDA_TASK_ROOT');
        return {
            type: 'serverless',
            provider: 'aws-lambda',
            detected,
            hasProcess: true
        };
    }
    if (process.env.NETLIFY || process.env.NETLIFY_DEV) {
        if (process.env.NETLIFY)
            detected.push('NETLIFY');
        if (process.env.NETLIFY_DEV)
            detected.push('NETLIFY_DEV');
        return {
            type: 'serverless',
            provider: 'netlify',
            detected,
            hasProcess: true
        };
    }
    if (process.env.FUNCTION_NAME || process.env.FUNCTION_TARGET || process.env.GCP_PROJECT) {
        if (process.env.FUNCTION_NAME)
            detected.push('FUNCTION_NAME');
        if (process.env.FUNCTION_TARGET)
            detected.push('FUNCTION_TARGET');
        if (process.env.GCP_PROJECT)
            detected.push('GCP_PROJECT');
        return {
            type: 'serverless',
            provider: 'google-cloud',
            detected,
            hasProcess: true
        };
    }
    if (process.env.AZURE_FUNCTIONS_ENVIRONMENT || process.env.WEBSITE_INSTANCE_ID) {
        if (process.env.AZURE_FUNCTIONS_ENVIRONMENT)
            detected.push('AZURE_FUNCTIONS_ENVIRONMENT');
        if (process.env.WEBSITE_INSTANCE_ID)
            detected.push('WEBSITE_INSTANCE_ID');
        return {
            type: 'serverless',
            provider: 'azure',
            detected,
            hasProcess: true
        };
    }
    if (process.env.CLOUDFLARE_WORKERS || process.env.CF_PAGES) {
        if (process.env.CLOUDFLARE_WORKERS)
            detected.push('CLOUDFLARE_WORKERS');
        if (process.env.CF_PAGES)
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
export function isServerless() {
    return detectEnvironment().type === 'serverless';
}
export function isTraditional() {
    return detectEnvironment().type === 'traditional';
}
export function isEdge() {
    return detectEnvironment().type === 'edge';
}
export function getEnvironmentDescription(env) {
    if (env.type === 'serverless') {
        return `${env.provider} (serverless)`;
    }
    if (env.type === 'edge') {
        return `${env.provider || 'edge'} runtime`;
    }
    return 'Traditional server';
}
