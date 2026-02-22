"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFunction = createFunction;
function createFunction(options) {
    const { name, returns, language, as: funcType = 'function', parameters = [], body, volatility, security, schema, orReplace = true, cost, rows, parallel } = options;
    const fullName = schema ? `"${schema}"."${name}"` : `"${name}"`;
    const definition = {
        name,
        options: Object.freeze({ ...options }),
        toSQL() {
            const parts = [];
            parts.push(`CREATE${orReplace ? ' OR REPLACE' : ''} ${funcType.toUpperCase()} ${fullName}`);
            const paramStr = parameters.map(p => {
                let param = '';
                if (p.mode && p.mode !== 'in')
                    param += `${p.mode.toUpperCase()} `;
                param += `"${p.name}" ${p.type}`;
                if (p.default)
                    param += ` DEFAULT ${p.default}`;
                return param;
            }).join(', ');
            parts.push(`(${paramStr})`);
            if (funcType === 'function' && returns) {
                parts.push(`RETURNS ${returns}`);
            }
            parts.push(`LANGUAGE ${language}`);
            if (volatility)
                parts.push(volatility.toUpperCase());
            if (security === 'definer')
                parts.push('SECURITY DEFINER');
            if (cost)
                parts.push(`COST ${cost}`);
            if (rows)
                parts.push(`ROWS ${rows}`);
            if (parallel)
                parts.push(`PARALLEL ${parallel.toUpperCase()}`);
            const bodyText = typeof body === 'string' ? body : body.text;
            parts.push(`AS $$\n${bodyText}\n$$`);
            return parts.join('\n');
        },
        toDropSQL() {
            const paramTypes = parameters.map(p => p.type).join(', ');
            return `DROP ${funcType.toUpperCase()} IF EXISTS ${fullName}(${paramTypes})`;
        }
    };
    return definition;
}
exports.default = createFunction;
