"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activeInstances = void 0;
exports.registerGlobalCleanupHandlers = registerGlobalCleanupHandlers;
exports.registerInstance = registerInstance;
exports.unregisterInstance = unregisterInstance;
exports.activeInstances = new Set();
let cleanupHandlersRegistered = false;
function registerGlobalCleanupHandlers() {
    if (cleanupHandlersRegistered)
        return;
    if (typeof process === 'undefined' || !process.on)
        return;
    process.on('beforeExit', async () => {
        if (exports.activeInstances.size === 0)
            return;
        await Promise.all(Array.from(exports.activeInstances).map(instance => instance.close().catch(err => console.error('Error closing database connection:', err))));
    });
    cleanupHandlersRegistered = true;
}
function registerInstance(instance) {
    exports.activeInstances.add(instance);
    registerGlobalCleanupHandlers();
}
function unregisterInstance(instance) {
    exports.activeInstances.delete(instance);
}
