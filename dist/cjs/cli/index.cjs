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
exports.main = void 0;
const citty_1 = require("citty");
const context_1 = require("./utils/context.cjs");
(0, context_1.loadEnvFile)();
const main = (0, citty_1.defineCommand)({
    meta: {
        name: 'relq',
        version: '1.1.0',
        description: 'Database schema management for all dialects',
    },
    subCommands: {
        init: () => Promise.resolve().then(() => __importStar(require("./commands/init.cjs"))).then(m => m.default),
        status: () => Promise.resolve().then(() => __importStar(require("./commands/status.cjs"))).then(m => m.default),
        diff: () => Promise.resolve().then(() => __importStar(require("./commands/diff.cjs"))).then(m => m.default),
        pull: () => Promise.resolve().then(() => __importStar(require("./commands/pull.cjs"))).then(m => m.default),
        push: () => Promise.resolve().then(() => __importStar(require("./commands/push.cjs"))).then(m => m.default),
        generate: () => Promise.resolve().then(() => __importStar(require("./commands/generate.cjs"))).then(m => m.default),
        migrate: () => Promise.resolve().then(() => __importStar(require("./commands/migrate.cjs"))).then(m => m.default),
        rollback: () => Promise.resolve().then(() => __importStar(require("./commands/rollback.cjs"))).then(m => m.default),
        sync: () => Promise.resolve().then(() => __importStar(require("./commands/sync.cjs"))).then(m => m.default),
        import: () => Promise.resolve().then(() => __importStar(require("./commands/import.cjs"))).then(m => m.default),
        export: () => Promise.resolve().then(() => __importStar(require("./commands/export.cjs"))).then(m => m.default),
        validate: () => Promise.resolve().then(() => __importStar(require("./commands/validate.cjs"))).then(m => m.default),
        seed: () => Promise.resolve().then(() => __importStar(require("./commands/seed.cjs"))).then(m => m.default),
        introspect: () => Promise.resolve().then(() => __importStar(require("./commands/introspect.cjs"))).then(m => m.default),
    },
});
exports.main = main;
const fromDev = process.argv.some(arg => arg.endsWith('index.ts'));
if (fromDev) {
    (0, citty_1.runMain)(main).catch(err => {
        Promise.resolve().then(() => __importStar(require("./utils/ui.cjs"))).then(({ formatError, p }) => {
            p.log.error(formatError(err));
            process.exit(1);
        }).catch(() => {
            console.error('Error:', err instanceof Error ? err.message : String(err));
            process.exit(1);
        });
    });
}
