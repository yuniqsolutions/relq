import * as readline from 'readline';
import cliSpinners from 'cli-spinners';
const isColorSupported = process.stdout.isTTY && !process.env.NO_COLOR;
const isTTY = process.stdout.isTTY;
export const colors = {
    reset: '\x1b[0m',
    red: (s) => isColorSupported ? `\x1b[31m${s}\x1b[0m` : s,
    green: (s) => isColorSupported ? `\x1b[32m${s}\x1b[0m` : s,
    yellow: (s) => isColorSupported ? `\x1b[33m${s}\x1b[0m` : s,
    blue: (s) => isColorSupported ? `\x1b[34m${s}\x1b[0m` : s,
    magenta: (s) => isColorSupported ? `\x1b[35m${s}\x1b[0m` : s,
    cyan: (s) => isColorSupported ? `\x1b[36m${s}\x1b[0m` : s,
    white: (s) => isColorSupported ? `\x1b[37m${s}\x1b[0m` : s,
    gray: (s) => isColorSupported ? `\x1b[90m${s}\x1b[0m` : s,
    bold: (s) => isColorSupported ? `\x1b[1m${s}\x1b[0m` : s,
    dim: (s) => isColorSupported ? `\x1b[2m${s}\x1b[0m` : s,
    muted: (s) => isColorSupported ? `\x1b[90m${s}\x1b[0m` : s,
    success: (s) => isColorSupported ? `\x1b[32m${s}\x1b[0m` : s,
    error: (s) => isColorSupported ? `\x1b[31m${s}\x1b[0m` : s,
    warning: (s) => isColorSupported ? `\x1b[33m${s}\x1b[0m` : s,
    info: (s) => isColorSupported ? `\x1b[34m${s}\x1b[0m` : s,
};
export function createSpinner() {
    const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let frameIndex = 0;
    let interval = null;
    let currentMessage = '';
    let isSpinning = false;
    const isTTY = process.stdout.isTTY;
    const clearLine = () => {
        if (isTTY)
            process.stdout.write('\r\x1b[K');
    };
    const render = () => {
        if (!isSpinning)
            return;
        clearLine();
        process.stdout.write(`${colors.cyan(frames[frameIndex])} ${currentMessage}`);
        frameIndex = (frameIndex + 1) % frames.length;
    };
    return {
        start(message) {
            if (isSpinning)
                this.stop();
            currentMessage = message;
            isSpinning = true;
            frameIndex = 0;
            if (isTTY) {
                interval = setInterval(render, 80);
                render();
            }
            else {
                console.log(`${message}...`);
            }
        },
        update(message) {
            currentMessage = message;
        },
        succeed(message) {
            this.stop();
            console.log(message || currentMessage);
        },
        fail(message) {
            this.stop();
        },
        info(message) {
            this.stop();
            console.log(message || currentMessage);
        },
        warn(message) {
            this.stop();
            warning(message || currentMessage);
        },
        stop() {
            if (interval) {
                clearInterval(interval);
                interval = null;
            }
            if (isSpinning && isTTY) {
                clearLine();
            }
            isSpinning = false;
        }
    };
}
export function fatal(message, hintMessage) {
    console.error(`${colors.red('fatal:')} ${message}`);
    if (hintMessage) {
        hint(hintMessage);
    }
    process.exit(1);
}
export function error(message, hintMessage) {
    console.error(`${colors.red('error:')} ${message}`);
    if (hintMessage) {
        hint(hintMessage);
    }
}
export function warning(message) {
    console.error(`${colors.yellow('warning:')} ${message}`);
}
export function hint(message) {
    console.error(`${colors.yellow('hint:')} ${message}`);
}
export function success(message) {
    console.log(colors.green(message));
}
export function confirm(question, defaultYes = true) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    const suffix = defaultYes ? '[Y/n]' : '[y/N]';
    return new Promise((resolve) => {
        rl.question(`${question} ${suffix} `, (answer) => {
            rl.close();
            const a = answer.trim().toLowerCase();
            if (!a)
                resolve(defaultYes);
            else
                resolve(a === 'y' || a === 'yes');
        });
    });
}
export function select(question, options) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    console.log(question);
    options.forEach((opt, i) => {
        console.log(`  ${i + 1}) ${opt}`);
    });
    return new Promise((resolve) => {
        rl.question(`Select [1-${options.length}]: `, (answer) => {
            rl.close();
            const num = parseInt(answer.trim(), 10);
            if (num >= 1 && num <= options.length) {
                resolve(num - 1);
            }
            else {
                resolve(0);
            }
        });
    });
}
export function formatBytes(bytes) {
    if (bytes < 1024)
        return `${bytes} B`;
    if (bytes < 1024 * 1024)
        return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
export function formatDuration(ms) {
    if (ms < 1000)
        return `${ms}ms`;
    if (ms < 60000)
        return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}
export function progressBar(current, total, width = 30) {
    const percentage = Math.min(100, Math.round((current / total) * 100));
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;
    return `${'#'.repeat(filled)}${'.'.repeat(empty)} ${percentage}%`;
}
export function requireInit(isInitialized, projectRoot) {
    if (!isInitialized) {
        fatal('not a relq repository (or any of the parent directories): .relq', "run 'relq init' to initialize a repository");
    }
}
export function createMultiProgress() {
    const spinner = cliSpinners.dots;
    let items = [];
    let frameIndex = 0;
    let interval = null;
    let isRunning = false;
    let lineCount = 0;
    let lastPrintedStatus = new Map();
    const moveCursorUp = (lines) => {
        if (isTTY && lines > 0) {
            process.stdout.write(`\x1b[${lines}A`);
        }
    };
    const clearLine = () => {
        if (isTTY) {
            process.stdout.write('\x1b[2K\r');
        }
    };
    const padNumber = (n, width = 4) => {
        return n.toString().padStart(width);
    };
    const render = () => {
        if (!isRunning || !isTTY)
            return;
        if (lineCount > 0) {
            moveCursorUp(lineCount);
        }
        const frame = spinner.frames[frameIndex];
        frameIndex = (frameIndex + 1) % spinner.frames.length;
        for (const item of items) {
            clearLine();
            let prefix;
            let statusText;
            let countStr = padNumber(item.count);
            if (item.status === 'pending') {
                prefix = colors.gray('[ ]');
                statusText = colors.gray(`${countStr} ${item.label} waiting`);
            }
            else if (item.status === 'fetching') {
                prefix = colors.cyan(`[${frame}]`);
                statusText = colors.white(`${countStr} ${item.label} fetching`);
            }
            else if (item.status === 'done') {
                prefix = colors.green('[+]');
                statusText = colors.green(`${countStr} ${item.label} fetched`);
            }
            else {
                prefix = colors.red('[x]');
                statusText = colors.red(`${countStr} ${item.label} error`);
            }
            process.stdout.write(`${prefix} ${statusText}\n`);
        }
        lineCount = items.length;
    };
    const printStaticLine = (item) => {
        let prefix;
        let statusText;
        let countStr = padNumber(item.count);
        if (item.status === 'error') {
            prefix = '[x]';
            statusText = `${countStr} ${item.label} error`;
        }
        else if (item.status === 'done' && item.count > 0) {
            prefix = '[+]';
            statusText = `${countStr} ${item.label} fetched`;
        }
        else if (item.status === 'done') {
            prefix = '[+]';
            statusText = `${countStr} ${item.label} fetched`;
        }
        else if (item.status === 'fetching') {
            prefix = '[~]';
            statusText = `${countStr} ${item.label} fetching`;
        }
        else {
            prefix = '[ ]';
            statusText = `${countStr} ${item.label} waiting`;
        }
        console.log(`${prefix} ${statusText}`);
    };
    return {
        setItems(newItems) {
            items = [...newItems];
            lastPrintedStatus.clear();
        },
        updateItem(id, updates) {
            const item = items.find(i => i.id === id);
            if (item) {
                const prevStatus = item.status;
                Object.assign(item, updates);
                if (!isTTY && isRunning) {
                    const statusKey = `${item.id}:${item.status}:${item.count}`;
                    if (lastPrintedStatus.get(item.id) !== statusKey) {
                        printStaticLine(item);
                        lastPrintedStatus.set(item.id, statusKey);
                    }
                }
            }
        },
        start() {
            if (isRunning)
                return;
            isRunning = true;
            frameIndex = 0;
            lineCount = 0;
            lastPrintedStatus.clear();
            if (isTTY) {
                interval = setInterval(render, spinner.interval);
                render();
            }
        },
        stop() {
            if (interval) {
                clearInterval(interval);
                interval = null;
            }
            isRunning = false;
        },
        complete() {
            this.stop();
            if (isTTY && lineCount > 0) {
                moveCursorUp(lineCount);
                for (const item of items) {
                    clearLine();
                    let prefix;
                    let statusText;
                    let countStr = padNumber(item.count);
                    if (item.status === 'error') {
                        prefix = colors.red('[x]');
                        statusText = colors.red(`${countStr} ${item.label} error`);
                    }
                    else if (item.status === 'done' && item.count > 0) {
                        prefix = colors.green('[+]');
                        statusText = colors.green(`${countStr} ${item.label} fetched`);
                    }
                    else {
                        prefix = colors.dim('[+]');
                        statusText = colors.dim(`${countStr} ${item.label} fetched`);
                    }
                    process.stdout.write(`${prefix} ${statusText}\n`);
                }
            }
        }
    };
}
