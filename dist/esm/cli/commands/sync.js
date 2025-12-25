import { requireValidConfig } from "../utils/config-loader.js";
import { getConnectionDescription } from "../utils/env-loader.js";
import { colors, createSpinner, fatal, success } from "../utils/cli-utils.js";
import { isInitialized, shortHash, fetchRemoteCommits, pushCommit, ensureRemoteTable, getAllCommits, } from "../utils/repo-manager.js";
import { pullCommand } from "./pull.js";
export async function syncCommand(context) {
    const { config, flags } = context;
    if (!config) {
        fatal('No configuration found', `Run ${colors.cyan('relq init')} to create one.`);
    }
    await requireValidConfig(config, { calledFrom: 'sync' });
    const connection = config.connection;
    const { projectRoot } = context;
    console.log('');
    if (!isInitialized(projectRoot)) {
        fatal('not a relq repository (or any parent directories): .relq', `Run ${colors.cyan('relq init')} to initialize.`);
    }
    const spinner = createSpinner();
    try {
        console.log(`Syncing with ${colors.cyan(getConnectionDescription(connection))}...`);
        console.log('');
        await pullCommand(context);
        await ensureRemoteTable(connection);
        const remoteCommits = await fetchRemoteCommits(connection, 100);
        const remoteHashes = new Set(remoteCommits.map(c => c.hash));
        const localCommitsAfter = getAllCommits(projectRoot);
        const toPush = localCommitsAfter.filter(c => !remoteHashes.has(c.hash));
        if (toPush.length === 0) {
            success('Sync complete - up to date');
            console.log('');
            return;
        }
        console.log(`Pushing ${toPush.length} local commit(s)...`);
        console.log('');
        spinner.start(`Pushing ${toPush.length} commit(s)...`);
        for (const commit of toPush.reverse()) {
            await pushCommit(connection, commit);
        }
        spinner.succeed(`Pushed ${toPush.length} commit(s)`);
        console.log('');
        console.log('Pushed commits:');
        for (const commit of toPush.slice(0, 5)) {
            console.log(`  ${colors.yellow(shortHash(commit.hash))} ${commit.message}`);
        }
        if (toPush.length > 5) {
            console.log(`  ${colors.muted(`... and ${toPush.length - 5} more`)}`);
        }
        console.log('');
        success(`Sync complete - pushed ${toPush.length} commit(s)`);
    }
    catch (err) {
        spinner.fail('Sync failed');
        fatal(err instanceof Error ? err.message : String(err));
    }
    console.log('');
}
