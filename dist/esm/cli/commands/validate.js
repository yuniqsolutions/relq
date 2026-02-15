import { defineCommand } from 'citty';
import * as path from 'node:path';
import { buildContext } from "../utils/context.js";
import { colors } from "../utils/colors.js";
import { getSchemaPath } from "../utils/config-loader.js";
import { validateSchemaFile, formatValidationErrors } from "../utils/schema-validator.js";
export default defineCommand({
    meta: { name: 'validate', description: 'Check schema for errors' },
    args: {
        schema: { type: 'positional', description: 'Schema file path (optional)', required: false },
        strict: { type: 'boolean', description: 'Treat warnings as errors' },
        json: { type: 'boolean', description: 'Output as JSON' },
    },
    async run({ args }) {
        const { config, projectRoot } = await buildContext({ requireConfig: false });
        console.log('');
        let schemaPath;
        if (args.schema) {
            schemaPath = path.resolve(projectRoot, args.schema);
        }
        else {
            schemaPath = path.resolve(projectRoot, getSchemaPath(config ?? undefined));
        }
        const relativePath = path.relative(process.cwd(), schemaPath);
        console.log(`Validating ${colors.cyan(relativePath)}...`);
        console.log('');
        const result = validateSchemaFile(schemaPath);
        if (args.json) {
            console.log(JSON.stringify({
                valid: result.valid,
                errors: result.errors,
                file: relativePath,
            }, null, 2));
            if (!result.valid)
                process.exit(1);
            return;
        }
        if (result.valid) {
            console.log(colors.green('Schema is valid'));
            console.log('');
            console.log(`   No syntax errors found in ${relativePath}`);
            console.log('');
            return;
        }
        console.log(colors.red(`Schema has ${result.errors.length} syntax error(s)`));
        console.log('');
        console.log(formatValidationErrors(result));
        console.log(`${colors.yellow('hint:')} Fix the errors above before running other commands`);
        console.log('');
        process.exit(1);
    },
});
