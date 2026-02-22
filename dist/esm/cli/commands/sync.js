import { defineCommand } from 'citty';
import { buildContext } from "../utils/context.js";
import { colors } from "../utils/colors.js";
import { fatal, formatError } from "../utils/ui.js";
import { formatDuration } from "../utils/format.js";
import { requireValidConfig } from "../utils/config-loader.js";
import { getConnectionDescription } from "../utils/env-loader.js";
import { isInitialized, initRepository } from "../utils/repo-manager.js";
import { runPull } from "./pull.js";
import { runPush } from "./push.js";
export default defineCommand({
    meta: { name: 'sync', description: 'Pull + Push bidirectional sync' },
    args: {
        'pull-only': { type: 'boolean', description: 'Only pull, don\'t push' },
        'push-only': { type: 'boolean', description: 'Only push, don\'t pull' },
        force: { type: 'boolean', description: 'Force sync without confirmation' },
        yes: { type: 'boolean', alias: 'y', description: 'Skip confirmation' },
    },
    async run({ args }) {
        const { config, projectRoot } = await buildContext();
        await requireValidConfig(config, { calledFrom: 'sync' });
        const connection = config.connection;
        const pullOnly = args['pull-only'] === true;
        const pushOnly = args['push-only'] === true;
        const startTime = Date.now();
        console.log('');
        if (!isInitialized(projectRoot)) {
            console.log(`${colors.yellow('Initializing')} .relq repository...`);
            initRepository(projectRoot);
            console.log(`${colors.green('✓')} Repository initialized`);
            console.log('');
        }
        console.log(`Syncing with ${colors.cyan(getConnectionDescription(connection))}...`);
        console.log('');
        try {
            if (!pushOnly) {
                await runPull(config, projectRoot, {
                    force: args.force === true,
                    skipPrompt: args.yes === true,
                });
            }
            if (!pullOnly) {
                await runPush(config, projectRoot, {
                    force: args.force === true,
                    skipPrompt: args.yes === true,
                });
            }
            const duration = Date.now() - startTime;
            console.log(`Sync completed in ${formatDuration(duration)}`);
            console.log('');
        }
        catch (err) {
            fatal(formatError(err));
        }
    },
});
