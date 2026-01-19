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
exports.introspectCommand = introspectCommand;
const fs = __importStar(require("fs"));
const readline = __importStar(require("readline"));
const index_1 = require("../../introspect/index.cjs");
const cli_utils_1 = require("../utils/cli-utils.cjs");
function readStdin() {
    return new Promise((resolve) => {
        let data = '';
        process.stdin.setEncoding('utf-8');
        process.stdin.on('data', chunk => data += chunk);
        process.stdin.on('end', () => resolve(data));
    });
}
function readInteractive() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    console.log('Enter SQL (CREATE TABLE statements). End with empty line:\n');
    return new Promise((resolve) => {
        const lines = [];
        let emptyLineCount = 0;
        rl.on('line', (line) => {
            if (line.trim() === '') {
                emptyLineCount++;
                if (emptyLineCount >= 2) {
                    rl.close();
                    resolve(lines.join('\n'));
                }
            }
            else {
                emptyLineCount = 0;
                lines.push(line);
            }
        });
        rl.on('close', () => {
            resolve(lines.join('\n'));
        });
    });
}
async function introspectCommand(context) {
    const { flags } = context;
    const filePath = flags['file'];
    const useStdin = flags['stdin'] === true;
    let sql;
    if (filePath) {
        if (!fs.existsSync(filePath)) {
            (0, cli_utils_1.fatal)(`File not found: ${filePath}`, 'Check the file path and try again.');
        }
        sql = fs.readFileSync(filePath, 'utf-8');
        console.log(`📄 Reading from: ${filePath}\n`);
    }
    else if (useStdin || !process.stdin.isTTY) {
        sql = await readStdin();
    }
    else {
        sql = await readInteractive();
    }
    if (!sql.trim()) {
        (0, cli_utils_1.fatal)('No SQL input provided', 'Usage: relq introspect --file schema.sql\n   or: cat schema.sql | relq introspect');
    }
    console.log('🔍 Parsing SQL...\n');
    try {
        const tables = (0, index_1.parseSqlToDefineTable)(sql);
        if (tables.length === 0) {
            console.log('No CREATE TABLE statements found.');
            return;
        }
        console.log(`Found ${tables.length} table(s):\n`);
        const output = [
            "import { defineTable, serial, integer, bigint, varchar, text, boolean, uuid, jsonb, json, timestamp, date, numeric, vector } from 'relq/schema-builder';",
            '',
        ];
        for (const table of tables) {
            output.push(generateDefineTableCode(table));
            output.push('');
        }
        console.log(output.join('\n'));
    }
    catch (error) {
        (0, cli_utils_1.fatal)('Error parsing SQL', error instanceof Error ? error.message : String(error));
    }
}
function generateDefineTableCode(table) {
    const columns = table.columns.map(col => {
        const parts = [];
        parts.push(col.typeCode);
        if (col.isPrimaryKey)
            parts.push('.primaryKey()');
        if (!col.isNullable && !col.isPrimaryKey)
            parts.push('.notNull()');
        if (col.isUnique)
            parts.push('.unique()');
        if (col.references)
            parts.push(`.references('${col.references.table}', '${col.references.column}')`);
        if (col.defaultValue)
            parts.push(`.default(${col.defaultValue})`);
        return `    ${col.name}: ${parts.join('')},`;
    });
    return `export const ${table.name} = defineTable('${table.name}', {
${columns.join('\n')}
});`;
}
