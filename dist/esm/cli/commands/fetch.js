import { requireValidConfig } from "../utils/config-loader.js";
import { getConnectionDescription } from "../utils/env-loader.js";
import { colors, createSpinner, fatal, hint } from "../utils/cli-utils.js";
import { isInitialized, getHead, loadCommit, saveCommit, setFetchHead, fetchRemoteCommits, ensureRemoteTable, } from "../utils/repo-manager.js";
export async function fetchCommand(context) {
    const { config, flags } = context;
    if (!config) {
        fatal('No configuration found', `run ${colors.cyan('relq init')} to create a configuration file`);
    }
    await requireValidConfig(config, { calledFrom: 'fetch' });
    const connection = config.connection;
    const { projectRoot } = context;
    console.log('');
    if (!isInitialized(projectRoot)) {
        fatal('not a relq repository (or any parent directories): .relq', "run 'relq init' to initialize");
    }
    const spinner = createSpinner();
    spinner.start(`Fetching from ${getConnectionDescription(connection)}...`);
    try {
        await ensureRemoteTable(connection);
        const remoteCommits = await fetchRemoteCommits(connection, 100);
        if (remoteCommits.length === 0) {
            spinner.succeed('No remote commits found');
            hint("run 'relq push' to push your commits");
            return;
        }
        let newCommits = 0;
        for (const commit of remoteCommits) {
            const existing = loadCommit(commit.hash, projectRoot);
            if (!existing) {
                saveCommit(commit, projectRoot);
                newCommits++;
            }
        }
        const latestRemote = remoteCommits[0];
        setFetchHead(latestRemote.hash, projectRoot);
        spinner.succeed(`Fetched ${remoteCommits.length} commits (${newCommits} new)`);
        const localHead = getHead(projectRoot);
        const localCommits = localHead ? getAllLocalCommitHashes(projectRoot) : new Set();
        const remoteHashes = new Set(remoteCommits.map(c => c.hash));
        const behind = remoteCommits.filter(c => !localCommits.has(c.hash)).length;
        const ahead = [...localCommits].filter(h => !remoteHashes.has(h)).length;
        console.log('');
        if (behind > 0 && ahead > 0) {
            console.log(`Your branch and 'origin/main' have diverged,`);
            console.log(`and have ${ahead} and ${behind} different commits each, respectively.`);
        }
        else if (behind > 0) {
            console.log(`Your branch is behind 'origin/main' by ${behind} commit(s).`);
            hint("run 'relq pull' to update your local branch");
        }
        else if (ahead > 0) {
            console.log(`Your branch is ahead of 'origin/main' by ${ahead} commit(s).`);
            hint("run 'relq push' to publish your local commits");
        }
        else {
            console.log("Your branch is up to date with 'origin/main'.");
        }
    }
    catch (error) {
        spinner.fail('Fetch failed');
        fatal('Fetch failed', error instanceof Error ? error.message : String(error));
    }
    console.log('');
}
function getAllLocalCommitHashes(projectRoot) {
    const fs = require('fs');
    const path = require('path');
    const commitsDir = path.join(projectRoot, '.relq', 'commits');
    const hashes = new Set();
    if (fs.existsSync(commitsDir)) {
        const files = fs.readdirSync(commitsDir);
        for (const file of files) {
            if (file.endsWith('.json')) {
                hashes.add(file.replace('.json', ''));
            }
        }
    }
    return hashes;
}
