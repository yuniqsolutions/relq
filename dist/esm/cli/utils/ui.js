import * as p from '@clack/prompts';
import { colors } from "./colors.js";
export { p };
export function fatal(message, hint) {
    p.log.error(message);
    if (hint) {
        p.log.info(hint);
    }
    process.exit(1);
}
export function warning(msg) {
    p.log.warn(msg);
}
export function success(msg) {
    p.log.success(msg);
}
export function info(msg) {
    p.log.info(msg);
}
export function formatError(err) {
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
export function requireInit(isInitialized) {
    if (!isInitialized) {
        fatal('Not a relq repository (or any of the parent directories): .relq', `Run ${colors.cyan('relq init')} to initialize a repository`);
    }
}
