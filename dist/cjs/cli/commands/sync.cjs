"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const citty_1 = require("citty");
const context_1 = require("../utils/context.cjs");
const colors_1 = require("../utils/colors.cjs");
const ui_1 = require("../utils/ui.cjs");
const format_1 = require("../utils/format.cjs");
const config_loader_1 = require("../utils/config-loader.cjs");
const env_loader_1 = require("../utils/env-loader.cjs");
const repo_manager_1 = require("../utils/repo-manager.cjs");
const pull_1 = require("./pull.cjs");
const push_1 = require("./push.cjs");
exports.default = (0, citty_1.defineCommand)({
    meta: { name: 'sync', description: 'Pull + Push bidirectional sync' },
    args: {
        'pull-only': { type: 'boolean', description: 'Only pull, don\'t push' },
        'push-only': { type: 'boolean', description: 'Only push, don\'t pull' },
        force: { type: 'boolean', description: 'Force sync without confirmation' },
        yes: { type: 'boolean', alias: 'y', description: 'Skip confirmation' },
    },
    async run({ args }) {
        const { config, projectRoot } = await (0, context_1.buildContext)();
        await (0, config_loader_1.requireValidConfig)(config, { calledFrom: 'sync' });
        const connection = config.connection;
        const pullOnly = args['pull-only'] === true;
        const pushOnly = args['push-only'] === true;
        const startTime = Date.now();
        console.log('');
        if (!(0, repo_manager_1.isInitialized)(projectRoot)) {
            console.log(`${colors_1.colors.yellow('Initializing')} .relq repository...`);
            (0, repo_manager_1.initRepository)(projectRoot);
            console.log(`${colors_1.colors.green('✓')} Repository initialized`);
            console.log('');
        }
        console.log(`Syncing with ${colors_1.colors.cyan((0, env_loader_1.getConnectionDescription)(connection))}...`);
        console.log('');
        try {
            if (!pushOnly) {
                await (0, pull_1.runPull)(config, projectRoot, {
                    force: args.force === true,
                    skipPrompt: args.yes === true,
                });
            }
            if (!pullOnly) {
                await (0, push_1.runPush)(config, projectRoot, {
                    force: args.force === true,
                    skipPrompt: args.yes === true,
                });
            }
            const duration = Date.now() - startTime;
            console.log(`Sync completed in ${(0, format_1.formatDuration)(duration)}`);
            console.log('');
        }
        catch (err) {
            (0, ui_1.fatal)((0, ui_1.formatError)(err));
        }
    },
});
