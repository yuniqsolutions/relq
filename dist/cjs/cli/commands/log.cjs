"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logCommand = logCommand;
exports.historyCommand = logCommand;
exports.showCommand = showCommand;
const cli_utils_1 = require("../utils/cli-utils.cjs");
const repo_manager_1 = require("../utils/repo-manager.cjs");
function formatDate(timestamp) {
    const date = new Date(timestamp);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayName = days[date.getDay()];
    const monthName = months[date.getMonth()];
    const day = date.getDate();
    const time = date.toTimeString().split(' ')[0];
    const year = date.getFullYear();
    return `${dayName} ${monthName} ${day} ${time} ${year}`;
}
async function logCommand(context) {
    const { flags, projectRoot } = context;
    const limit = parseInt(flags['n']) || 10;
    const oneline = flags['oneline'] === true;
    console.log('');
    if (!(0, repo_manager_1.isInitialized)(projectRoot)) {
        (0, cli_utils_1.fatal)('not a relq repository (or any parent directories): .relq', "run 'relq init' to initialize");
    }
    const head = (0, repo_manager_1.getHead)(projectRoot);
    const commits = (0, repo_manager_1.getCommitHistory)(limit, projectRoot);
    if (commits.length === 0) {
        console.log('No commits yet.');
        (0, cli_utils_1.hint)("run 'relq commit -m <message>' to create first commit");
        console.log('');
        return;
    }
    for (const commit of commits) {
        const isHead = commit.hash === head;
        if (oneline) {
            const headMarker = isHead ? `${cli_utils_1.colors.cyan('(HEAD)')} ` : '';
            console.log(`${cli_utils_1.colors.yellow((0, repo_manager_1.shortHash)(commit.hash))} ${headMarker}${commit.message}`);
        }
        else {
            console.log(`${cli_utils_1.colors.yellow(`commit ${commit.hash}`)}`);
            if (isHead) {
                console.log(`${cli_utils_1.colors.cyan('(HEAD)')}`);
            }
            console.log(`Author: ${commit.author}`);
            console.log(`Date:   ${formatDate(commit.timestamp)}`);
            console.log('');
            console.log(`    ${commit.message}`);
            console.log('');
            console.log(`    ${cli_utils_1.colors.muted(`${commit.stats.tables} tables, ${commit.stats.columns} columns`)}`);
            console.log('');
        }
    }
    if (!oneline) {
        console.log('');
    }
}
async function showCommand(context) {
    const { args, projectRoot } = context;
    const target = args[0];
    console.log('');
    if (!(0, repo_manager_1.isInitialized)(projectRoot)) {
        console.log(`${cli_utils_1.colors.red('fatal:')} not a relq repository`);
        return;
    }
    if (!target) {
        console.log(`${cli_utils_1.colors.red('error:')} Please specify a commit or tag`);
        console.log('');
        console.log(`Usage: ${cli_utils_1.colors.cyan('relq show <commit|tag>')}`);
        console.log('');
        return;
    }
    const fs = require('fs');
    const path = require('path');
    const { resolveRef, loadCommit } = require("../utils/repo-manager.cjs");
    const hash = resolveRef(target, projectRoot);
    if (!hash) {
        console.log(`${cli_utils_1.colors.red('error:')} Commit or tag not found: ${target}`);
        console.log('');
        console.log('Available commits:');
        const commitsDir = path.join(projectRoot, '.relq', 'commits');
        if (fs.existsSync(commitsDir)) {
            const files = fs.readdirSync(commitsDir);
            for (const f of files.slice(0, 5)) {
                console.log(`   ${cli_utils_1.colors.yellow((0, repo_manager_1.shortHash)(f.replace('.json', '')))}`);
            }
        }
        return;
    }
    const commitPath = path.join(projectRoot, '.relq', 'commits', `${hash}.json`);
    if (!fs.existsSync(commitPath)) {
        console.log(`${cli_utils_1.colors.red('error:')} Commit not found: ${hash}`);
        return;
    }
    const commitData = JSON.parse(fs.readFileSync(commitPath, 'utf-8'));
    console.log(`${cli_utils_1.colors.yellow(`commit ${commitData.hash}`)}`);
    console.log(`Author: ${commitData.author}`);
    console.log(`Date:   ${formatDate(commitData.timestamp)}`);
    console.log('');
    console.log(`    ${commitData.message}`);
    console.log('');
    if (commitData.stats) {
        console.log(`${cli_utils_1.colors.bold('Stats:')}`);
        console.log(`    Tables:  ${commitData.stats.tables}`);
        console.log(`    Columns: ${commitData.stats.columns}`);
        console.log(`    Indexes: ${commitData.stats.indexes || 0}`);
        console.log('');
    }
    if (commitData.changes && commitData.changes.length > 0) {
        console.log(`${cli_utils_1.colors.bold('Changes:')}`);
        for (const change of commitData.changes.slice(0, 20)) {
            const symbol = change.action === 'CREATE'
                ? cli_utils_1.colors.green('+')
                : change.action === 'DROP'
                    ? cli_utils_1.colors.red('-')
                    : cli_utils_1.colors.yellow('~');
            console.log(`    ${symbol} ${change.objectType.toLowerCase()}: ${change.name}`);
        }
        if (commitData.changes.length > 20) {
            console.log(`    ${cli_utils_1.colors.muted(`... and ${commitData.changes.length - 20} more`)}`);
        }
        console.log('');
    }
    if (commitData.sql && commitData.sql.trim()) {
        console.log(`${cli_utils_1.colors.bold('SQL:')}`);
        console.log('');
        console.log(`${cli_utils_1.colors.cyan(commitData.sql)}`);
        console.log('');
    }
}
