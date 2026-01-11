"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.remoteCommand = remoteCommand;
const spinner_1 = require("../utils/spinner.cjs");
async function remoteCommand(context) {
    console.log('');
    (0, spinner_1.warning)('Remote tracking is coming soon.');
    console.log('');
    console.log('This will allow you to:');
    console.log('  • Track multiple remote databases');
    console.log('  • Push/pull to different environments');
    console.log('  • Switch between staging/production');
    console.log('');
    console.log('For now, configure your remote in relq.config.ts');
    console.log('');
}
exports.default = remoteCommand;
