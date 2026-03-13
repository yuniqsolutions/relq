import * as ts from 'typescript';
import * as fs from 'node:fs';
import * as path from 'node:path';
export function validateSchemaFile(schemaPath) {
    const absolutePath = path.resolve(schemaPath);
    if (!fs.existsSync(absolutePath)) {
        return {
            valid: false,
            errors: [{
                    line: 0,
                    column: 0,
                    message: `Schema file not found: ${absolutePath}`,
                    code: -1,
                }],
            filePath: absolutePath,
        };
    }
    const content = fs.readFileSync(absolutePath, 'utf-8');
    const sourceFile = ts.createSourceFile(absolutePath, content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    const errors = [];
    const compilerOptions = {
        target: ts.ScriptTarget.ESNext,
        module: ts.ModuleKind.ESNext,
        strict: false,
        skipLibCheck: true,
        noEmit: true,
        moduleResolution: ts.ModuleResolutionKind.NodeNext,
    };
    const program = ts.createProgram([absolutePath], compilerOptions, {
        getSourceFile: (fileName) => {
            if (fileName === absolutePath)
                return sourceFile;
            return ts.createSourceFile(fileName, '', ts.ScriptTarget.Latest, true);
        },
        getDefaultLibFileName: () => 'lib.d.ts',
        writeFile: () => { },
        getCurrentDirectory: () => path.dirname(absolutePath),
        getDirectories: () => [],
        fileExists: (fileName) => fileName === absolutePath || fs.existsSync(fileName),
        readFile: (fileName) => {
            if (fileName === absolutePath)
                return content;
            try {
                return fs.readFileSync(fileName, 'utf-8');
            }
            catch {
                return undefined;
            }
        },
        getCanonicalFileName: (fileName) => fileName,
        useCaseSensitiveFileNames: () => true,
        getNewLine: () => '\n',
    });
    const syntacticDiagnostics = program.getSyntacticDiagnostics(sourceFile);
    const ignoredErrorCodes = new Set([
        2306,
        2307,
        2305,
        2339,
        2694,
        2792,
        2503,
        2749,
        2315,
        2322,
        2345,
        2769,
        2741,
        2551,
        2737,
    ]);
    const semanticDiagnostics = program.getSemanticDiagnostics(sourceFile)
        .filter(d => !ignoredErrorCodes.has(d.code));
    const allDiagnostics = [...syntacticDiagnostics, ...semanticDiagnostics];
    for (const diagnostic of allDiagnostics) {
        if (diagnostic.file && diagnostic.start !== undefined) {
            const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
            errors.push({
                line: line + 1,
                column: character + 1,
                message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
                code: diagnostic.code,
            });
        }
        else {
            errors.push({
                line: 0,
                column: 0,
                message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
                code: diagnostic.code,
            });
        }
    }
    return {
        valid: errors.length === 0,
        errors,
        filePath: absolutePath,
    };
}
export function formatValidationErrors(result) {
    if (result.valid) {
        return '';
    }
    const lines = [];
    const relativePath = path.relative(process.cwd(), result.filePath);
    for (const error of result.errors) {
        if (error.line > 0) {
            lines.push(`   ${relativePath}:${error.line}:${error.column}`);
            lines.push(`   │`);
            try {
                const content = fs.readFileSync(result.filePath, 'utf-8');
                const fileLine = content.split('\n')[error.line - 1];
                if (fileLine !== undefined) {
                    const trimmedLine = fileLine.substring(0, 60);
                    lines.push(`${error.line.toString().padStart(3)} │ ${trimmedLine}${fileLine.length > 60 ? '...' : ''}`);
                    lines.push(`   │ ${' '.repeat(error.column - 1)}^`);
                }
            }
            catch {
            }
            lines.push(`   │`);
            lines.push(`   └─ ${error.message}`);
        }
        else {
            lines.push(`   ${error.message}`);
        }
        lines.push('');
    }
    return lines.join('\n');
}
