import { warning } from "../utils/spinner.js";
export async function remoteCommand(context) {
    console.log('');
    warning('Remote tracking is coming soon.');
    console.log('');
    console.log('This will allow you to:');
    console.log('  • Track multiple remote databases');
    console.log('  • Push/pull to different environments');
    console.log('  • Switch between staging/production');
    console.log('');
    console.log('For now, configure your remote in relq.config.ts');
    console.log('');
}
export default remoteCommand;
