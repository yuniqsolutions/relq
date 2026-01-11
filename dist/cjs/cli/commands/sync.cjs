"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncCommand = syncCommand;
const config_loader_1 = require("../utils/config-loader.cjs");
const env_loader_1 = require("../utils/env-loader.cjs");
const cli_utils_1 = require("../utils/cli-utils.cjs");
const repo_manager_1 = require("../utils/repo-manager.cjs");
const pull_1 = require("./pull.cjs");
async function syncCommand(context) {
    const { config, flags } = context;
    if (!config) {
        (0, cli_utils_1.fatal)('No configuration found', `Run ${cli_utils_1.colors.cyan('relq init')} to create one.`);
    }
    await (0, config_loader_1.requireValidConfig)(config, { calledFrom: 'sync' });
    const connection = config.connection;
    const { projectRoot } = context;
    console.log('');
    if (!(0, repo_manager_1.isInitialized)(projectRoot)) {
        console.log(`${cli_utils_1.colors.yellow('Initializing')} .relq repository...`);
        (0, repo_manager_1.initRepository)(projectRoot);
        console.log(`${cli_utils_1.colors.green('✓')} Repository initialized`);
        console.log('');
    }
    const spinner = (0, cli_utils_1.createSpinner)();
    try {
        console.log(`Syncing with ${cli_utils_1.colors.cyan((0, env_loader_1.getConnectionDescription)(connection))}...`);
        console.log('');
        await (0, pull_1.pullCommand)(context);
        await (0, repo_manager_1.ensureRemoteTable)(connection);
        const remoteCommits = await (0, repo_manager_1.fetchRemoteCommits)(connection, 100);
        const remoteHashes = new Set(remoteCommits.map(c => c.hash));
        const localCommitsAfter = (0, repo_manager_1.getAllCommits)(projectRoot);
        const toPush = localCommitsAfter.filter(c => !remoteHashes.has(c.hash));
        if (toPush.length === 0) {
            (0, cli_utils_1.success)('Sync complete - up to date');
            console.log('');
            return;
        }
        console.log(`Pushing ${toPush.length} local commit(s)...`);
        console.log('');
        spinner.start(`Pushing ${toPush.length} commit(s)...`);
        for (const commit of toPush.reverse()) {
            await (0, repo_manager_1.pushCommit)(connection, commit);
        }
        spinner.succeed(`Pushed ${toPush.length} commit(s)`);
        console.log('');
        console.log('Pushed commits:');
        for (const commit of toPush.slice(0, 5)) {
            console.log(`  ${cli_utils_1.colors.yellow((0, repo_manager_1.shortHash)(commit.hash))} ${commit.message}`);
        }
        if (toPush.length > 5) {
            console.log(`  ${cli_utils_1.colors.muted(`... and ${toPush.length - 5} more`)}`);
        }
        console.log('');
        (0, cli_utils_1.success)(`Sync complete - pushed ${toPush.length} commit(s)`);
    }
    catch (err) {
        spinner.fail('Sync failed');
        (0, cli_utils_1.fatal)(err instanceof Error ? err.message : String(err));
    }
    console.log('');
}
