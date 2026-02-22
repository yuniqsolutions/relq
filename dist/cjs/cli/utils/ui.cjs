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
exports.p = void 0;
exports.fatal = fatal;
exports.warning = warning;
exports.success = success;
exports.info = info;
exports.formatError = formatError;
exports.requireInit = requireInit;
const p = __importStar(require("@clack/prompts"));
exports.p = p;
const colors_1 = require("./colors.cjs");
function fatal(message, hint) {
    p.log.error(message);
    if (hint) {
        p.log.info(hint);
    }
    process.exit(1);
}
function warning(msg) {
    p.log.warn(msg);
}
function success(msg) {
    p.log.success(msg);
}
function info(msg) {
    p.log.info(msg);
}
function formatError(err) {
    if (err instanceof AggregateError) {
        const errors = err.errors || [];
        if (errors.length === 0) {
            return err.message || 'Multiple errors occurred';
        }
        if (errors.length === 1) {
            return formatError(errors[0]);
        }
        const formatted = errors.map((e, i) => `  ${i + 1}. ${formatError(e)}`).join('\n');
        return `Multiple errors occurred:\n${formatted}`;
    }
    if (err instanceof Error) {
        const msg = err.message || '';
        if (msg.includes('ECONNREFUSED')) {
            return 'Connection refused - is the database running?';
        }
        if (msg.includes('ENOTFOUND')) {
            return 'Host not found - check your connection settings';
        }
        if (msg.includes('ECONNRESET')) {
            return 'Connection reset - the database closed the connection';
        }
        if (msg.includes('ETIMEDOUT')) {
            return 'Connection timed out - check network connectivity';
        }
        if (msg.includes('authentication failed') || msg.includes('password authentication')) {
            return 'Authentication failed - check your username and password';
        }
        if (msg.includes('no pg_hba.conf entry')) {
            return 'Access denied - your IP is not allowed to connect to this database';
        }
        if (msg.includes('database') && msg.includes('does not exist')) {
            const match = msg.match(/database "([^"]+)" does not exist/);
            return match
                ? `Database "${match[1]}" does not exist - create it first or check the name`
                : 'Database does not exist - check your connection settings';
        }
        if (msg.includes('relation') && msg.includes('does not exist')) {
            const match = msg.match(/relation "([^"]+)" does not exist/);
            return match
                ? `Table "${match[1]}" does not exist`
                : 'Table does not exist';
        }
        if (msg.includes('SSL') || msg.includes('certificate')) {
            return `SSL/TLS error: ${msg}`;
        }
        if (msg.includes('token') || msg.includes('IAM') || msg.includes('credentials')) {
            return `AWS authentication error: ${msg}`;
        }
        if (msg.includes('timeout') || msg.includes('Timeout')) {
            return 'Operation timed out - try again or check your connection';
        }
        if (msg.includes('Cannot find module') || msg.includes('Module not found')) {
            const match = msg.match(/Cannot find module '([^']+)'/);
            return match
                ? `Missing dependency: ${match[1]} - try running "npm install" or "bun install"`
                : 'Missing dependency - try running "npm install" or "bun install"';
        }
        if (msg.includes('permission denied') || msg.includes('EACCES')) {
            return 'Permission denied - check file/folder permissions';
        }
        if (msg.includes('relq.config') || msg.includes('config file')) {
            return `Configuration error: ${msg}`;
        }
        return msg || err.name || 'Unknown error';
    }
    if (typeof err === 'string') {
        return err || 'Unknown error';
    }
    if (err && typeof err === 'object' && 'message' in err) {
        return String(err.message) || 'Unknown error';
    }
    return String(err) || 'Unknown error';
}
function requireInit(isInitialized) {
    if (!isInitialized) {
        fatal('Not a relq repository (or any of the parent directories): .relq', `Run ${colors_1.colors.cyan('relq init')} to initialize a repository`);
    }
}
