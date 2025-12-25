"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.colors = void 0;
exports.createSpinner = createSpinner;
exports.fatal = fatal;
exports.error = error;
exports.warning = warning;
exports.hint = hint;
exports.success = success;
exports.confirm = confirm;
exports.select = select;
exports.formatBytes = formatBytes;
exports.formatDuration = formatDuration;
exports.progressBar = progressBar;
exports.requireInit = requireInit;
const readline = __importStar(require("readline"));
const isColorSupported = process.stdout.isTTY && !process.env.NO_COLOR;
exports.colors = {
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
function createSpinner() {
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
        process.stdout.write(`${exports.colors.cyan(frames[frameIndex])} ${currentMessage}`);
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
function fatal(message, hintMessage) {
    console.error(`${exports.colors.red('fatal:')} ${message}`);
    if (hintMessage) {
        hint(hintMessage);
    }
    process.exit(1);
}
function error(message, hintMessage) {
    console.error(`${exports.colors.red('error:')} ${message}`);
    if (hintMessage) {
        hint(hintMessage);
    }
}
function warning(message) {
    console.error(`${exports.colors.yellow('warning:')} ${message}`);
}
function hint(message) {
    console.error(`${exports.colors.yellow('hint:')} ${message}`);
}
function success(message) {
    console.log(exports.colors.green(message));
}
function confirm(question, defaultYes = true) {
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
function select(question, options) {
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
function formatBytes(bytes) {
    if (bytes < 1024)
        return `${bytes} B`;
    if (bytes < 1024 * 1024)
        return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
function formatDuration(ms) {
    if (ms < 1000)
        return `${ms}ms`;
    if (ms < 60000)
        return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}
function progressBar(current, total, width = 30) {
    const percentage = Math.min(100, Math.round((current / total) * 100));
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;
    return `${'#'.repeat(filled)}${'.'.repeat(empty)} ${percentage}%`;
}
function requireInit(isInitialized, projectRoot) {
    if (!isInitialized) {
        fatal('not a relq repository (or any of the parent directories): .relq', "run 'relq init' to initialize a repository");
    }
}
