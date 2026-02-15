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
const citty_1 = require("citty");
const path = __importStar(require("node:path"));
const context_1 = require("../utils/context.cjs");
const colors_1 = require("../utils/colors.cjs");
const config_loader_1 = require("../utils/config-loader.cjs");
const schema_validator_1 = require("../utils/schema-validator.cjs");
exports.default = (0, citty_1.defineCommand)({
    meta: { name: 'validate', description: 'Check schema for errors' },
    args: {
        schema: { type: 'positional', description: 'Schema file path (optional)', required: false },
        strict: { type: 'boolean', description: 'Treat warnings as errors' },
        json: { type: 'boolean', description: 'Output as JSON' },
    },
    async run({ args }) {
        const { config, projectRoot } = await (0, context_1.buildContext)({ requireConfig: false });
        console.log('');
        let schemaPath;
        if (args.schema) {
            schemaPath = path.resolve(projectRoot, args.schema);
        }
        else {
            schemaPath = path.resolve(projectRoot, (0, config_loader_1.getSchemaPath)(config ?? undefined));
        }
        const relativePath = path.relative(process.cwd(), schemaPath);
        console.log(`Validating ${colors_1.colors.cyan(relativePath)}...`);
        console.log('');
        const result = (0, schema_validator_1.validateSchemaFile)(schemaPath);
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
            console.log(colors_1.colors.green('Schema is valid'));
            console.log('');
            console.log(`   No syntax errors found in ${relativePath}`);
            console.log('');
            return;
        }
        console.log(colors_1.colors.red(`Schema has ${result.errors.length} syntax error(s)`));
        console.log('');
        console.log((0, schema_validator_1.formatValidationErrors)(result));
        console.log(`${colors_1.colors.yellow('hint:')} Fix the errors above before running other commands`);
        console.log('');
        process.exit(1);
    },
});
