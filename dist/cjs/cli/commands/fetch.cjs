"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchCommand = fetchCommand;
const config_loader_1 = require("../utils/config-loader.cjs");
const env_loader_1 = require("../utils/env-loader.cjs");
const cli_utils_1 = require("../utils/cli-utils.cjs");
const repo_manager_1 = require("../utils/repo-manager.cjs");
async function fetchCommand(context) {
    const { config, flags } = context;
    if (!config) {
        (0, cli_utils_1.fatal)('No configuration found', `run ${cli_utils_1.colors.cyan('relq init')} to create a configuration file`);
    }
    await (0, config_loader_1.requireValidConfig)(config, { calledFrom: 'fetch' });
    const connection = config.connection;
    const { projectRoot } = context;
    console.log('');
    if (!(0, repo_manager_1.isInitialized)(projectRoot)) {
        (0, cli_utils_1.fatal)('not a relq repository (or any parent directories): .relq', "run 'relq init' to initialize");
    }
    const spinner = (0, cli_utils_1.createSpinner)();
    spinner.start(`Fetching from ${(0, env_loader_1.getConnectionDescription)(connection)}...`);
    try {
        await (0, repo_manager_1.ensureRemoteTable)(connection);
        const remoteCommits = await (0, repo_manager_1.fetchRemoteCommits)(connection, 100);
        if (remoteCommits.length === 0) {
            spinner.succeed('No remote commits found');
            (0, cli_utils_1.hint)("run 'relq push' to push your commits");
            return;
        }
        let newCommits = 0;
        for (const commit of remoteCommits) {
            const existing = (0, repo_manager_1.loadCommit)(commit.hash, projectRoot);
            if (!existing) {
                (0, repo_manager_1.saveCommit)(commit, projectRoot);
                newCommits++;
            }
        }
        const latestRemote = remoteCommits[0];
        (0, repo_manager_1.setFetchHead)(latestRemote.hash, projectRoot);
        spinner.succeed(`Fetched ${remoteCommits.length} commits (${newCommits} new)`);
        const localHead = (0, repo_manager_1.getHead)(projectRoot);
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
            (0, cli_utils_1.hint)("run 'relq pull' to update your local branch");
        }
        else if (ahead > 0) {
            console.log(`Your branch is ahead of 'origin/main' by ${ahead} commit(s).`);
            (0, cli_utils_1.hint)("run 'relq push' to publish your local commits");
        }
        else {
            console.log("Your branch is up to date with 'origin/main'.");
        }
    }
    catch (error) {
        spinner.fail('Fetch failed');
        (0, cli_utils_1.fatal)('Fetch failed', error instanceof Error ? error.message : String(error));
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
