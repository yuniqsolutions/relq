export function generateFunctionSQL(config) {
    const { $functionName, $options } = config;
    const { args = [], returns, language = 'plpgsql', volatility, parallel, security, strict, leakproof, cost, rows, setConfig, body, raw, } = $options;
    const parts = ['CREATE OR REPLACE FUNCTION', $functionName];
    const argStrings = args.map(arg => {
        let argStr = '';
        if (arg.mode && arg.mode !== 'IN') {
            argStr += arg.mode + ' ';
        }
        argStr += arg.name + ' ' + arg.type;
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
        if (language.toLowerCase() === 'plpgsql' &&
            !trimmedBody.toUpperCase().startsWith('BEGIN') &&
            !trimmedBody.toUpperCase().startsWith('DECLARE')) {
            parts.push('\nBEGIN');
            parts.push('\n    ' + trimmedBody.replace(/\n/g, '\n    '));
            parts.push('\nEND;');
        }
        else {
            parts.push('\n' + trimmedBody);
        }
    }
    parts.push('\n$$');
    return parts.join('');
}
export function dropFunctionSQL(config, ifExists = true) {
    const { $functionName, $options } = config;
    const argTypes = ($options.args || [])
        .filter(arg => !arg.mode || arg.mode === 'IN' || arg.mode === 'INOUT' || arg.mode === 'VARIADIC')
        .map(arg => arg.type)
        .join(', ');
    return `DROP FUNCTION ${ifExists ? 'IF EXISTS ' : ''}${$functionName}(${argTypes})`;
}
export function pgFunction(name, options) {
    return {
        $functionName: name,
        $options: options,
        $type: 'function',
    };
}
export function isFunctionConfig(value) {
    return (typeof value === 'object' &&
        value !== null &&
        '$type' in value &&
        value.$type === 'function');
}
