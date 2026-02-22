"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activeInstances = void 0;
exports.registerGlobalCleanupHandlers = registerGlobalCleanupHandlers;
exports.registerInstance = registerInstance;
exports.unregisterInstance = unregisterInstance;
const node_process_1 = __importDefault(require("node:process"));
exports.activeInstances = new Set();
let cleanupHandlersRegistered = false;
function registerGlobalCleanupHandlers() {
    if (cleanupHandlersRegistered)
        return;
    if (typeof node_process_1.default === 'undefined' || !node_process_1.default.on)
        return;
    node_process_1.default.on('beforeExit', async () => {
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
