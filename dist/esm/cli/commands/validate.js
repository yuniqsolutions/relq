import * as path from 'path';
import { getSchemaPath } from "../utils/config-loader.js";
import { validateSchemaFile, formatValidationErrors } from "../utils/schema-validator.js";
import { colors, success } from "../utils/cli-utils.js";
export async function validateCommand(context) {
    const { config, args, projectRoot } = context;
    console.log('');
    let schemaPath;
    if (args.length > 0) {
        schemaPath = path.resolve(projectRoot, args[0]);
    }
    else {
        schemaPath = path.resolve(projectRoot, getSchemaPath(config ?? undefined));
    }
    const relativePath = path.relative(process.cwd(), schemaPath);
    console.log(`Validating ${colors.cyan(relativePath)}...`);
    console.log('');
    const result = validateSchemaFile(schemaPath);
    if (result.valid) {
        success('Schema is valid');
        console.log('');
        console.log(`   No syntax errors found in ${relativePath}`);
        console.log('');
        return;
    }
    console.log(colors.red(`error: Schema has ${result.errors.length} syntax error(s)`));
    console.log('');
    console.log(formatValidationErrors(result));
    console.log(colors.yellow('hint:') + ' Fix the errors above before running other commands');
    console.log('');
    process.exit(1);
}
export default validateCommand;
