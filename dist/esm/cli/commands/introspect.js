import { defineCommand } from 'citty';
import * as fs from 'node:fs';
import * as readline from 'node:readline';
import { buildContext } from "../utils/context.js";
import { fatal, formatError } from "../utils/ui.js";
import { parseSqlToDefineTable } from "../../introspect/index.js";
import { detectDialect, getBuilderImportPath } from "../utils/dialect-router.js";
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
    return `export const ${table.name} = defineTable('${table.name}', {\n${columns.join('\n')}\n});`;
}
export default defineCommand({
    meta: { name: 'introspect', description: 'Parse SQL DDL to defineTable() code' },
    args: {
        file: { type: 'string', description: 'Read SQL from file' },
        stdin: { type: 'boolean', description: 'Read from stdin' },
    },
    async run({ args }) {
        const { config } = await buildContext({ requireConfig: false });
        const builderImportPath = config ? getBuilderImportPath(detectDialect(config)) : 'relq';
        let sql;
        if (args.file) {
            if (!fs.existsSync(args.file)) {
                fatal(`File not found: ${args.file}`, 'Check the file path and try again.');
            }
            sql = fs.readFileSync(args.file, 'utf-8');
            console.log(`Reading from: ${args.file}\n`);
        }
        else if (args.stdin || !process.stdin.isTTY) {
            sql = await readStdin();
        }
        else {
            sql = await readInteractive();
        }
        if (!sql.trim()) {
            fatal('No SQL input provided', 'Usage: relq introspect --file schema.sql\n   or: cat schema.sql | relq introspect');
        }
        console.log('Parsing SQL...\n');
        try {
            const tables = parseSqlToDefineTable(sql);
            if (tables.length === 0) {
                console.log('No CREATE TABLE statements found.');
                return;
            }
            console.log(`Found ${tables.length} table(s):\n`);
            const output = [
                `import { defineTable, serial, integer, bigint, varchar, text, boolean, uuid, jsonb, json, timestamp, date, numeric, vector } from '${builderImportPath}';`,
                '',
            ];
            for (const table of tables) {
                output.push(generateDefineTableCode(table));
                output.push('');
            }
            console.log(output.join('\n'));
        }
        catch (error) {
            fatal('Error parsing SQL', formatError(error));
        }
    },
});
