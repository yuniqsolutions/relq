export const INTERNAL = Symbol('relq-internal');
export function debugLog(config, ...args) {
    if (config?.logLevel === 'debug') {
        console.log('[Relq DEBUG]', ...args);
    }
}
