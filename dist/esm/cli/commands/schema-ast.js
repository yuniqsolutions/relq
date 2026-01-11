import * as fs from 'fs';
import * as path from 'path';
import { createJiti } from 'jiti';
import { getSchemaPath } from "../utils/config-loader.js";
import { schemaToAST } from "../utils/schema-to-ast.js";
import { colors, createSpinner } from "../utils/spinner.js";
export async function schemaAstCommand(context) {
    const { config, args, flags, projectRoot } = context;
    const spinner = createSpinner();
    console.log('');
    const options = {
        json: Boolean(flags.json),
        output: flags.output,
        pretty: flags.pretty !== false,
    };
    let schemaPath;
    if (args.length > 0) {
        schemaPath = path.resolve(projectRoot, args[0]);
    }
    else {
        schemaPath = path.resolve(projectRoot, getSchemaPath(config ?? undefined));
    }
    const relativePath = path.relative(process.cwd(), schemaPath);
    spinner.start(`Loading schema from ${colors.cyan(relativePath)}`);
    let schemaModule;
    try {
        const jiti = createJiti(path.dirname(schemaPath), { interopDefault: true });
        const module = await jiti.import(schemaPath);
        if (module && module.default && typeof module.default === 'object') {
            schemaModule = module.default;
        }
        else if (module && typeof module === 'object') {
            schemaModule = module;
        }
        else {
            throw new Error('Schema file must export an object with table/enum definitions');
        }
        spinner.succeed(`Loaded schema from ${colors.cyan(relativePath)}`);
    }
    catch (error) {
        spinner.fail(`Failed to load schema`);
        console.log('');
        console.log(colors.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
        console.log('');
        console.log(colors.yellow('hint:') + ` Make sure ${relativePath} is a valid TypeScript schema file.`);
        console.log('');
        process.exit(1);
    }
    spinner.start('Converting schema to AST');
    let ast;
    try {
        ast = schemaToAST(schemaModule);
        spinner.succeed('Converted schema to AST');
    }
    catch (error) {
        spinner.fail('Failed to convert schema');
        console.log('');
        console.log(colors.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
        console.log('');
        process.exit(1);
    }
    const indent = options.pretty ? 2 : 0;
    const output = JSON.stringify(ast, null, indent);
    if (options.output) {
        const outputPath = path.resolve(projectRoot, options.output);
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        fs.writeFileSync(outputPath, output, 'utf-8');
        console.log('');
        console.log(`Written AST to ${colors.cyan(options.output)}`);
    }
    else if (options.json) {
        console.log(output);
    }
    else {
        console.log('');
        printAstSummary(ast);
        console.log('');
        console.log(colors.muted(`Use ${colors.cyan('--json')} for full AST output or ${colors.cyan('--output <file>')} to write to file.`));
    }
    console.log('');
}
function printAstSummary(ast) {
    console.log(colors.bold('Schema AST Summary'));
    console.log('');
    if (ast.extensions.length > 0) {
        console.log(colors.cyan('Extensions:') + ` ${ast.extensions.length}`);
        for (const ext of ast.extensions) {
            console.log(`  ${colors.green('•')} ${ext}`);
        }
        console.log('');
    }
    if (ast.enums.length > 0) {
        console.log(colors.cyan('Enums:') + ` ${ast.enums.length}`);
        for (const e of ast.enums) {
            const tid = e.trackingId ? colors.muted(` [${e.trackingId}]`) : '';
            console.log(`  ${colors.green('•')} ${e.name}${tid}: (${e.values.join(', ')})`);
        }
        console.log('');
    }
    if (ast.domains.length > 0) {
        console.log(colors.cyan('Domains:') + ` ${ast.domains.length}`);
        for (const d of ast.domains) {
            const tid = d.trackingId ? colors.muted(` [${d.trackingId}]`) : '';
            console.log(`  ${colors.green('•')} ${d.name}${tid}: ${d.baseType}`);
        }
        console.log('');
    }
    if (ast.compositeTypes.length > 0) {
        console.log(colors.cyan('Composite Types:') + ` ${ast.compositeTypes.length}`);
        for (const c of ast.compositeTypes) {
            const tid = c.trackingId ? colors.muted(` [${c.trackingId}]`) : '';
            const attrs = c.attributes.map(a => a.name).join(', ');
            console.log(`  ${colors.green('•')} ${c.name}${tid}: (${attrs})`);
        }
        console.log('');
    }
    if (ast.sequences.length > 0) {
        console.log(colors.cyan('Sequences:') + ` ${ast.sequences.length}`);
        for (const s of ast.sequences) {
            const tid = s.trackingId ? colors.muted(` [${s.trackingId}]`) : '';
            console.log(`  ${colors.green('•')} ${s.name}${tid}`);
        }
        console.log('');
    }
    if (ast.tables.length > 0) {
        console.log(colors.cyan('Tables:') + ` ${ast.tables.length}`);
        for (const t of ast.tables) {
            const tid = t.trackingId ? colors.muted(` [${t.trackingId}]`) : '';
            console.log(`  ${colors.green('•')} ${t.name}${tid}`);
            console.log(`      Columns: ${t.columns.length}`);
            for (const col of t.columns.slice(0, 5)) {
                const colTid = col.trackingId ? colors.muted(` [${col.trackingId}]`) : '';
                const pk = col.isPrimaryKey ? colors.yellow(' PK') : '';
                const nullable = col.isNullable ? '' : colors.red(' NOT NULL');
                console.log(`        - ${col.name}${colTid}: ${col.type}${pk}${nullable}`);
            }
            if (t.columns.length > 5) {
                console.log(`        ${colors.muted(`... and ${t.columns.length - 5} more`)}`);
            }
            if (t.indexes.length > 0) {
                console.log(`      Indexes: ${t.indexes.length}`);
            }
            if (t.constraints.length > 0) {
                console.log(`      Constraints: ${t.constraints.length}`);
            }
        }
        console.log('');
    }
    if (ast.views.length > 0) {
        console.log(colors.cyan('Views:') + ` ${ast.views.length}`);
        for (const v of ast.views) {
            const tid = v.trackingId ? colors.muted(` [${v.trackingId}]`) : '';
            const mat = v.isMaterialized ? colors.yellow(' (materialized)') : '';
            console.log(`  ${colors.green('•')} ${v.name}${tid}${mat}`);
        }
        console.log('');
    }
    if (ast.functions.length > 0) {
        console.log(colors.cyan('Functions:') + ` ${ast.functions.length}`);
        for (const f of ast.functions) {
            const tid = f.trackingId ? colors.muted(` [${f.trackingId}]`) : '';
            const args = f.args.map(a => a.type).join(', ');
            console.log(`  ${colors.green('•')} ${f.name}${tid}(${args}) -> ${f.returnType}`);
        }
        console.log('');
    }
    if (ast.triggers.length > 0) {
        console.log(colors.cyan('Triggers:') + ` ${ast.triggers.length}`);
        for (const tr of ast.triggers) {
            const tid = tr.trackingId ? colors.muted(` [${tr.trackingId}]`) : '';
            console.log(`  ${colors.green('•')} ${tr.name}${tid} on ${tr.table}`);
        }
        console.log('');
    }
    const total = ast.tables.length + ast.enums.length + ast.views.length +
        ast.functions.length + ast.triggers.length + ast.sequences.length +
        ast.domains.length + ast.compositeTypes.length;
    console.log(colors.bold(`Total: ${total} schema objects`));
}
export default schemaAstCommand;
