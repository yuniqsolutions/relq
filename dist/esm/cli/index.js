import { defineCommand, runMain } from 'citty';
import { loadEnvFile } from "./utils/context.js";
loadEnvFile();
const main = defineCommand({
    meta: {
        name: 'relq',
        version: '1.1.0',
        description: 'Database schema management for all dialects',
    },
    subCommands: {
        init: () => import("./commands/init.js").then(m => m.default),
        status: () => import("./commands/status.js").then(m => m.default),
        diff: () => import("./commands/diff.js").then(m => m.default),
        pull: () => import("./commands/pull.js").then(m => m.default),
        push: () => import("./commands/push.js").then(m => m.default),
        generate: () => import("./commands/generate.js").then(m => m.default),
        migrate: () => import("./commands/migrate.js").then(m => m.default),
        rollback: () => import("./commands/rollback.js").then(m => m.default),
        sync: () => import("./commands/sync.js").then(m => m.default),
        import: () => import("./commands/import.js").then(m => m.default),
        export: () => import("./commands/export.js").then(m => m.default),
        validate: () => import("./commands/validate.js").then(m => m.default),
        seed: () => import("./commands/seed.js").then(m => m.default),
        introspect: () => import("./commands/introspect.js").then(m => m.default),
    },
});
export { main };
const fromDev = process.argv.some(arg => arg.endsWith('index.ts'));
if (fromDev) {
    runMain(main).catch(err => {
        import("./utils/ui.js").then(({ formatError, p }) => {
            p.log.error(formatError(err));
            process.exit(1);
        }).catch(() => {
            console.error('Error:', err instanceof Error ? err.message : String(err));
            process.exit(1);
        });
    });
}
