"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INTERNAL = void 0;
exports.debugLog = debugLog;
exports.INTERNAL = Symbol('relq-internal');
function debugLog(config, ...args) {
    if (config?.logLevel === 'debug') {
        console.log('[Relq DEBUG]', ...args);
    }
}
