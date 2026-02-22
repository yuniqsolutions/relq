import process from 'node:process';
export const activeInstances = new Set();
let cleanupHandlersRegistered = false;
export function registerGlobalCleanupHandlers() {
    if (cleanupHandlersRegistered)
        return;
    if (typeof process === 'undefined' || !process.on)
        return;
    process.on('beforeExit', async () => {
        if (activeInstances.size === 0)
            return;
        await Promise.all(Array.from(activeInstances).map(instance => instance.close().catch(err => console.error('Error closing database connection:', err))));
    });
    cleanupHandlersRegistered = true;
}
export function registerInstance(instance) {
    activeInstances.add(instance);
    registerGlobalCleanupHandlers();
}
export function unregisterInstance(instance) {
    activeInstances.delete(instance);
}
