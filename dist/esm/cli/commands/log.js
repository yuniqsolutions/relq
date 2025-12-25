import { colors, fatal, hint } from "../utils/cli-utils.js";
import { isInitialized, getHead, getCommitHistory, shortHash, } from "../utils/repo-manager.js";
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
export async function logCommand(context) {
    const { flags, projectRoot } = context;
    const limit = parseInt(flags['n']) || 10;
    const oneline = flags['oneline'] === true;
    console.log('');
    if (!isInitialized(projectRoot)) {
        fatal('not a relq repository (or any parent directories): .relq', "run 'relq init' to initialize");
    }
    const head = getHead(projectRoot);
    const commits = getCommitHistory(limit, projectRoot);
    if (commits.length === 0) {
        console.log('No commits yet.');
        hint("run 'relq commit -m <message>' to create first commit");
        console.log('');
        return;
    }
    for (const commit of commits) {
        const isHead = commit.hash === head;
        if (oneline) {
            const headMarker = isHead ? `${colors.cyan('(HEAD)')} ` : '';
            console.log(`${colors.yellow(shortHash(commit.hash))} ${headMarker}${commit.message}`);
        }
        else {
            console.log(`${colors.yellow(`commit ${commit.hash}`)}`);
            if (isHead) {
                console.log(`${colors.cyan('(HEAD)')}`);
            }
            console.log(`Author: ${commit.author}`);
            console.log(`Date:   ${formatDate(commit.timestamp)}`);
            console.log('');
            console.log(`    ${commit.message}`);
            console.log('');
            console.log(`    ${colors.muted(`${commit.stats.tables} tables, ${commit.stats.columns} columns`)}`);
            console.log('');
        }
    }
    if (!oneline) {
        console.log('');
    }
}
export async function showCommand(context) {
    const { args, projectRoot } = context;
    const target = args[0];
    console.log('');
    if (!isInitialized(projectRoot)) {
        console.log(`${colors.red('fatal:')} not a relq repository`);
        return;
    }
    if (!target) {
        console.log(`${colors.red('error:')} Please specify a commit or tag`);
        console.log('');
        console.log(`Usage: ${colors.cyan('relq show <commit|tag>')}`);
        console.log('');
        return;
    }
    const fs = require('fs');
    const path = require('path');
    const { resolveRef, loadCommit } = require('../utils/repo-manager');
    const hash = resolveRef(target, projectRoot);
    if (!hash) {
        console.log(`${colors.red('error:')} Commit or tag not found: ${target}`);
        console.log('');
        console.log('Available commits:');
        const commitsDir = path.join(projectRoot, '.relq', 'commits');
        if (fs.existsSync(commitsDir)) {
            const files = fs.readdirSync(commitsDir);
            for (const f of files.slice(0, 5)) {
                console.log(`   ${colors.yellow(shortHash(f.replace('.json', '')))}`);
            }
        }
        return;
    }
    const commitPath = path.join(projectRoot, '.relq', 'commits', `${hash}.json`);
    if (!fs.existsSync(commitPath)) {
        console.log(`${colors.red('error:')} Commit not found: ${hash}`);
        return;
    }
    const commitData = JSON.parse(fs.readFileSync(commitPath, 'utf-8'));
    console.log(`${colors.yellow(`commit ${commitData.hash}`)}`);
    console.log(`Author: ${commitData.author}`);
    console.log(`Date:   ${formatDate(commitData.timestamp)}`);
    console.log('');
    console.log(`    ${commitData.message}`);
    console.log('');
    if (commitData.stats) {
        console.log(`${colors.bold('Stats:')}`);
        console.log(`    Tables:  ${commitData.stats.tables}`);
        console.log(`    Columns: ${commitData.stats.columns}`);
        console.log(`    Indexes: ${commitData.stats.indexes || 0}`);
        console.log('');
    }
    if (commitData.changes && commitData.changes.length > 0) {
        console.log(`${colors.bold('Changes:')}`);
        for (const change of commitData.changes.slice(0, 20)) {
            const symbol = change.action === 'CREATE'
                ? colors.green('+')
                : change.action === 'DROP'
                    ? colors.red('-')
                    : colors.yellow('~');
            console.log(`    ${symbol} ${change.objectType.toLowerCase()}: ${change.name}`);
        }
        if (commitData.changes.length > 20) {
            console.log(`    ${colors.muted(`... and ${commitData.changes.length - 20} more`)}`);
        }
        console.log('');
    }
    if (commitData.sql && commitData.sql.trim()) {
        console.log(`${colors.bold('SQL:')}`);
        console.log('');
        console.log(`${colors.cyan(commitData.sql)}`);
        console.log('');
    }
}
export { logCommand as historyCommand };
