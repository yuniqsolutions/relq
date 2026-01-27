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
exports.validateCommand = validateCommand;
const path = __importStar(require("path"));
const config_loader_1 = require("../utils/config-loader.cjs");
const schema_validator_1 = require("../utils/schema-validator.cjs");
const cli_utils_1 = require("../utils/cli-utils.cjs");
async function validateCommand(context) {
    const { config, args, projectRoot } = context;
    console.log('');
    let schemaPath;
    if (args.length > 0) {
        schemaPath = path.resolve(projectRoot, args[0]);
    }
    else {
        schemaPath = path.resolve(projectRoot, (0, config_loader_1.getSchemaPath)(config ?? undefined));
    }
    const relativePath = path.relative(process.cwd(), schemaPath);
    console.log(`Validating ${cli_utils_1.colors.cyan(relativePath)}...`);
    console.log('');
    const result = (0, schema_validator_1.validateSchemaFile)(schemaPath);
    if (result.valid) {
        (0, cli_utils_1.success)('Schema is valid');
        console.log('');
        console.log(`   No syntax errors found in ${relativePath}`);
        console.log('');
        return;
    }
    console.log(cli_utils_1.colors.red(`error: Schema has ${result.errors.length} syntax error(s)`));
    console.log('');
    console.log((0, schema_validator_1.formatValidationErrors)(result));
    console.log(cli_utils_1.colors.yellow('hint:') + ' Fix the errors above before running other commands');
    console.log('');
    process.exit(1);
}
exports.default = validateCommand;
