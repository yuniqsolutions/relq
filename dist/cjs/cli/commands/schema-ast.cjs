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
exports.schemaAstCommand = schemaAstCommand;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const jiti_1 = require("jiti");
const config_loader_1 = require("../utils/config-loader.cjs");
const schema_to_ast_1 = require("../utils/schema-to-ast.cjs");
const spinner_1 = require("../utils/spinner.cjs");
async function schemaAstCommand(context) {
    const { config, args, flags, projectRoot } = context;
    const spinner = (0, spinner_1.createSpinner)();
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
        schemaPath = path.resolve(projectRoot, (0, config_loader_1.getSchemaPath)(config ?? undefined));
    }
    const relativePath = path.relative(process.cwd(), schemaPath);
    spinner.start(`Loading schema from ${spinner_1.colors.cyan(relativePath)}`);
    let schemaModule;
    try {
        const jiti = (0, jiti_1.createJiti)(path.dirname(schemaPath), { interopDefault: true });
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
        spinner.succeed(`Loaded schema from ${spinner_1.colors.cyan(relativePath)}`);
    }
    catch (error) {
        spinner.fail(`Failed to load schema`);
        console.log('');
        console.log(spinner_1.colors.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
        console.log('');
        console.log(spinner_1.colors.yellow('hint:') + ` Make sure ${relativePath} is a valid TypeScript schema file.`);
        console.log('');
        process.exit(1);
    }
    spinner.start('Converting schema to AST');
    let ast;
    try {
        ast = (0, schema_to_ast_1.schemaToAST)(schemaModule);
        spinner.succeed('Converted schema to AST');
    }
    catch (error) {
        spinner.fail('Failed to convert schema');
        console.log('');
        console.log(spinner_1.colors.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
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
        console.log(`Written AST to ${spinner_1.colors.cyan(options.output)}`);
    }
    else if (options.json) {
        console.log(output);
    }
    else {
        console.log('');
        printAstSummary(ast);
        console.log('');
        console.log(spinner_1.colors.muted(`Use ${spinner_1.colors.cyan('--json')} for full AST output or ${spinner_1.colors.cyan('--output <file>')} to write to file.`));
    }
    console.log('');
}
function printAstSummary(ast) {
    console.log(spinner_1.colors.bold('Schema AST Summary'));
    console.log('');
    if (ast.extensions.length > 0) {
        console.log(spinner_1.colors.cyan('Extensions:') + ` ${ast.extensions.length}`);
        for (const ext of ast.extensions) {
            console.log(`  ${spinner_1.colors.green('•')} ${ext}`);
        }
        console.log('');
    }
    if (ast.enums.length > 0) {
        console.log(spinner_1.colors.cyan('Enums:') + ` ${ast.enums.length}`);
        for (const e of ast.enums) {
            const tid = e.trackingId ? spinner_1.colors.muted(` [${e.trackingId}]`) : '';
            console.log(`  ${spinner_1.colors.green('•')} ${e.name}${tid}: (${e.values.join(', ')})`);
        }
        console.log('');
    }
    if (ast.domains.length > 0) {
        console.log(spinner_1.colors.cyan('Domains:') + ` ${ast.domains.length}`);
        for (const d of ast.domains) {
            const tid = d.trackingId ? spinner_1.colors.muted(` [${d.trackingId}]`) : '';
            console.log(`  ${spinner_1.colors.green('•')} ${d.name}${tid}: ${d.baseType}`);
        }
        console.log('');
    }
    if (ast.compositeTypes.length > 0) {
        console.log(spinner_1.colors.cyan('Composite Types:') + ` ${ast.compositeTypes.length}`);
        for (const c of ast.compositeTypes) {
            const tid = c.trackingId ? spinner_1.colors.muted(` [${c.trackingId}]`) : '';
            const attrs = c.attributes.map(a => a.name).join(', ');
            console.log(`  ${spinner_1.colors.green('•')} ${c.name}${tid}: (${attrs})`);
        }
        console.log('');
    }
    if (ast.sequences.length > 0) {
        console.log(spinner_1.colors.cyan('Sequences:') + ` ${ast.sequences.length}`);
        for (const s of ast.sequences) {
            const tid = s.trackingId ? spinner_1.colors.muted(` [${s.trackingId}]`) : '';
            console.log(`  ${spinner_1.colors.green('•')} ${s.name}${tid}`);
        }
        console.log('');
    }
    if (ast.tables.length > 0) {
        console.log(spinner_1.colors.cyan('Tables:') + ` ${ast.tables.length}`);
        for (const t of ast.tables) {
            const tid = t.trackingId ? spinner_1.colors.muted(` [${t.trackingId}]`) : '';
            console.log(`  ${spinner_1.colors.green('•')} ${t.name}${tid}`);
            console.log(`      Columns: ${t.columns.length}`);
            for (const col of t.columns.slice(0, 5)) {
                const colTid = col.trackingId ? spinner_1.colors.muted(` [${col.trackingId}]`) : '';
                const pk = col.isPrimaryKey ? spinner_1.colors.yellow(' PK') : '';
                const nullable = col.isNullable ? '' : spinner_1.colors.red(' NOT NULL');
                console.log(`        - ${col.name}${colTid}: ${col.type}${pk}${nullable}`);
            }
            if (t.columns.length > 5) {
                console.log(`        ${spinner_1.colors.muted(`... and ${t.columns.length - 5} more`)}`);
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
        console.log(spinner_1.colors.cyan('Views:') + ` ${ast.views.length}`);
        for (const v of ast.views) {
            const tid = v.trackingId ? spinner_1.colors.muted(` [${v.trackingId}]`) : '';
            const mat = v.isMaterialized ? spinner_1.colors.yellow(' (materialized)') : '';
            console.log(`  ${spinner_1.colors.green('•')} ${v.name}${tid}${mat}`);
        }
        console.log('');
    }
    if (ast.functions.length > 0) {
        console.log(spinner_1.colors.cyan('Functions:') + ` ${ast.functions.length}`);
        for (const f of ast.functions) {
            const tid = f.trackingId ? spinner_1.colors.muted(` [${f.trackingId}]`) : '';
            const args = f.args.map(a => a.type).join(', ');
            console.log(`  ${spinner_1.colors.green('•')} ${f.name}${tid}(${args}) -> ${f.returnType}`);
        }
        console.log('');
    }
    if (ast.triggers.length > 0) {
        console.log(spinner_1.colors.cyan('Triggers:') + ` ${ast.triggers.length}`);
        for (const tr of ast.triggers) {
            const tid = tr.trackingId ? spinner_1.colors.muted(` [${tr.trackingId}]`) : '';
            console.log(`  ${spinner_1.colors.green('•')} ${tr.name}${tid} on ${tr.table}`);
        }
        console.log('');
    }
    const total = ast.tables.length + ast.enums.length + ast.views.length +
        ast.functions.length + ast.triggers.length + ast.sequences.length +
        ast.domains.length + ast.compositeTypes.length;
    console.log(spinner_1.colors.bold(`Total: ${total} schema objects`));
}
exports.default = schemaAstCommand;
