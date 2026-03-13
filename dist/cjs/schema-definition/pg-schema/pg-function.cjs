"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateFunctionSQL = generateFunctionSQL;
exports.dropFunctionSQL = dropFunctionSQL;
exports.pgFunction = pgFunction;
exports.isFunctionConfig = isFunctionConfig;
function generateFunctionSQL(config) {
    const { $functionName, $options, $commentText } = config;
    const { args = [], returns, language = 'plpgsql', volatility, parallel, security, strict, leakproof, cost, rows, setConfig, body, raw, comment, } = $options;
    const parts = ['CREATE OR REPLACE FUNCTION', $functionName];
    const argStrings = args.map(arg => {
        let argStr = '';
        if (arg.mode && arg.mode !== 'IN') {
            argStr += arg.mode + ' ';
        }
        if (arg.name) {
            argStr += arg.name + ' ' + arg.type;
        }
        else {
            argStr += arg.type;
        }
        if (arg.default !== undefined) {
            argStr += ' DEFAULT ' + arg.default;
        }
        return argStr;
    });
    parts.push('(' + argStrings.join(', ') + ')');
    parts.push('\nRETURNS ' + returns);
    parts.push('\nLANGUAGE ' + language);
    if (volatility) {
        parts.push('\n' + volatility);
    }
    if (parallel) {
        parts.push('\nPARALLEL ' + parallel);
    }
    if (security) {
        parts.push('\nSECURITY ' + security);
    }
    if (strict) {
        parts.push('\nSTRICT');
    }
    if (leakproof) {
        parts.push('\nLEAKPROOF');
    }
    if (cost !== undefined) {
        parts.push('\nCOST ' + cost);
    }
    if (rows !== undefined) {
        parts.push('\nROWS ' + rows);
    }
    if (setConfig) {
        for (const [key, value] of Object.entries(setConfig)) {
            parts.push(`\nSET ${key} = '${value}'`);
        }
    }
    parts.push('\nAS $$');
    if (raw) {
        parts.push('\n' + raw.trim());
    }
    else if (body) {
        const trimmedBody = body.trim();
        const upperBody = trimmedBody.toUpperCase();
        if (language.toLowerCase() === 'plpgsql') {
            if (upperBody.startsWith('BEGIN') || upperBody.startsWith('DECLARE')) {
                throw new Error(`pgFunction '${$functionName}': The 'body' option should not include BEGIN/END or DECLARE blocks. ` +
                    `Use 'raw' instead for complex functions, or remove BEGIN/END wrapper for simple functions.`);
            }
        }
        if (language.toLowerCase() === 'plpgsql') {
            parts.push('\nBEGIN');
            parts.push('\n    ' + trimmedBody.replace(/\n/g, '\n    '));
            parts.push('\nEND;');
        }
        else {
            parts.push('\n' + trimmedBody);
        }
    }
    parts.push('\n$$');
    let sql = parts.join('');
    const commentText = $commentText || comment;
    if (commentText) {
        const argTypes = args
            .filter(arg => !arg.mode || arg.mode === 'IN' || arg.mode === 'INOUT' || arg.mode === 'VARIADIC')
            .map(arg => arg.type)
            .join(', ');
        const escapedComment = commentText.replace(/'/g, "''");
        sql += `;\n\nCOMMENT ON FUNCTION ${$functionName}(${argTypes}) IS '${escapedComment}'`;
    }
    return sql;
}
function dropFunctionSQL(config, ifExists = true) {
    const { $functionName, $options } = config;
    const argTypes = ($options.args || [])
        .filter(arg => !arg.mode || arg.mode === 'IN' || arg.mode === 'INOUT' || arg.mode === 'VARIADIC')
        .map(arg => arg.type)
        .join(', ');
    return `DROP FUNCTION ${ifExists ? 'IF EXISTS ' : ''}${$functionName}(${argTypes})`;
}
function pgFunction(name, options) {
    if (options.body && (options.language || 'plpgsql').toLowerCase() === 'plpgsql') {
        const upperBody = options.body.trim().toUpperCase();
        if (upperBody.startsWith('BEGIN') || upperBody.startsWith('DECLARE')) {
            throw new Error(`pgFunction '${name}': The 'body' option should not include BEGIN/END or DECLARE blocks. ` +
                `Use 'raw' instead for complex functions, or remove BEGIN/END wrapper for simple functions.`);
        }
    }
    return {
        $functionName: name,
        $options: options,
        $type: 'function',
        $trackingId: undefined,
        $commentText: options.comment,
        toAST() {
            const opts = this.$options;
            return {
                name: this.$functionName,
                args: (opts.args || []).map(arg => ({
                    name: arg.name,
                    type: arg.type,
                    mode: arg.mode,
                    default: arg.default,
                })),
                returnType: opts.returns,
                language: opts.language || 'plpgsql',
                body: opts.raw || opts.body || '',
                volatility: opts.volatility,
                isStrict: opts.strict || false,
                securityDefiner: opts.security === 'DEFINER',
                comment: this.$commentText,
                trackingId: this.$trackingId,
            };
        },
        $id(trackingId) {
            this.$trackingId = trackingId;
            return this;
        },
        $comment(comment) {
            this.$commentText = comment;
            return this;
        },
    };
}
function isFunctionConfig(value) {
    return (typeof value === 'object' &&
        value !== null &&
        '$type' in value &&
        value.$type === 'function');
}
