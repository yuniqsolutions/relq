const EXCLUDED_TABLES = ['_relq_migrations', 'relq_migrations'];
const VALID_INDEX_METHODS = new Set(['BTREE', 'HASH', 'GIN', 'GIST', 'BRIN', 'SPGIST']);
const EXCLUDED_FUNCTIONS = [
    'armor', 'dearmor', 'crypt', 'decrypt', 'encrypt', 'digest', 'hmac',
    'gen_salt', 'gen_random_bytes', 'gen_random_uuid', 'pgp_', 'decrypt_iv',
    'encrypt_iv'
];
function toCamelCase(str) {
    if (!str)
        return 'unknown';
    const cleaned = str.replace(/^[_0-9]+/, '');
    return cleaned
        .split('_')
        .map((word, i) => i === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');
}
function toPascalCase(str) {
    if (!str)
        return 'Unknown';
    const cleaned = str.replace(/^[_0-9]+/, '');
    return cleaned
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');
}
function inferTsTypeFromSqlType(sqlType) {
    if (!sqlType)
        return 'string';
    const normalized = sqlType.toLowerCase().replace(/\([^)]*\)/g, '').trim();
    if (['integer', 'int', 'int4', 'smallint', 'int2', 'bigint', 'int8',
        'numeric', 'decimal', 'real', 'float4', 'float8', 'double precision',
        'float', 'money'].includes(normalized)) {
        return 'number';
    }
    if (['boolean', 'bool'].includes(normalized)) {
        return 'boolean';
    }
    if (['timestamp', 'timestamptz', 'date', 'time', 'timetz'].includes(normalized)) {
        return 'Date';
    }
    if (['inet', 'cidr', 'macaddr', 'macaddr8'].includes(normalized)) {
        return 'string';
    }
    if (normalized === 'uuid') {
        return 'string';
    }
    return 'string';
}
function generateColumnBuilderFromType(sqlType) {
    if (!sqlType)
        return 'text()';
    const normalized = sqlType.toLowerCase().trim();
    const paramMatch = normalized.match(/^([a-z_][a-z0-9_\s]*?)(?:\s*\(([^)]+)\))?$/i);
    if (!paramMatch)
        return `text()`;
    const baseType = paramMatch[1].trim();
    const params = paramMatch[2];
    if (['integer', 'int', 'int4'].includes(baseType)) {
        return 'integer()';
    }
    if (['smallint', 'int2'].includes(baseType)) {
        return 'smallint()';
    }
    if (['bigint', 'int8'].includes(baseType)) {
        return 'bigint()';
    }
    if (baseType === 'numeric' || baseType === 'decimal') {
        if (params) {
            const [precision, scale] = params.split(',').map(s => s.trim());
            if (scale) {
                return `numeric().precision(${precision}).scale(${scale})`;
            }
            return `numeric().precision(${precision})`;
        }
        return 'numeric()';
    }
    if (['real', 'float4'].includes(baseType)) {
        return 'real()';
    }
    if (['float8', 'double precision'].includes(baseType)) {
        return 'doublePrecision()';
    }
    if (baseType === 'text') {
        return 'text()';
    }
    if (baseType === 'varchar' || baseType === 'character varying') {
        if (params) {
            return `varchar().length(${params})`;
        }
        return 'varchar()';
    }
    if (baseType === 'char' || baseType === 'character' || baseType === 'bpchar') {
        if (params) {
            return `char().length(${params})`;
        }
        return 'char()';
    }
    if (baseType === 'citext') {
        return 'citext()';
    }
    if (baseType === 'boolean' || baseType === 'bool') {
        return 'boolean()';
    }
    if (baseType === 'uuid') {
        return 'uuid()';
    }
    if (baseType === 'inet') {
        return 'inet()';
    }
    if (baseType === 'timestamp' || baseType === 'timestamptz') {
        return 'timestamp().withTimezone()';
    }
    if (baseType === 'date') {
        return 'date()';
    }
    if (baseType === 'time' || baseType === 'timetz') {
        return 'time()';
    }
    if (baseType === 'jsonb') {
        return 'jsonb()';
    }
    if (baseType === 'json') {
        return 'json()';
    }
    if (baseType === 'bytea') {
        return 'bytea()';
    }
    return 'text()';
}
function convertSqlCheckToTypedExpr(check) {
    const trimmed = check.trim();
    const betweenExact = trimmed.match(/^VALUE\s+BETWEEN\s+(\S+)\s+AND\s+(\S+)$/i);
    if (betweenExact) {
        return `value.between('${betweenExact[1]}', '${betweenExact[2]}')`;
    }
    if (/\sAND\s/i.test(trimmed) && !/\bBETWEEN\b/i.test(trimmed)) {
        const parts = splitCheckByAnd(trimmed);
        if (parts.length > 1) {
            const parsedParts = parts.map(p => convertSqlCheckToTypedExpr(p.trim()));
            return parsedParts.reduce((acc, part, idx) => {
                if (idx === 0)
                    return part;
                return `${acc}.and(${part})`;
            });
        }
    }
    const regexMatch = trimmed.match(/^VALUE\s+~\*\s+'([^']+)'$/i);
    if (regexMatch) {
        const regex = regexMatch[1].replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        return `value.matches('${regex}')`;
    }
    const csRegexMatch = trimmed.match(/^VALUE\s+~\s+'([^']+)'$/i);
    if (csRegexMatch) {
        const regex = csRegexMatch[1].replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        return `value.matchesCaseSensitive('${regex}')`;
    }
    const gtMatch = trimmed.match(/^VALUE\s*>\s*([^\s]+)$/i);
    if (gtMatch) {
        return `value.gt('${gtMatch[1]}')`;
    }
    const gteMatch = trimmed.match(/^VALUE\s*>=\s*([^\s]+)$/i);
    if (gteMatch) {
        return `value.gte('${gteMatch[1]}')`;
    }
    const ltMatch = trimmed.match(/^VALUE\s*<\s*([^\s]+)$/i);
    if (ltMatch) {
        return `value.lt('${ltMatch[1]}')`;
    }
    const lteMatch = trimmed.match(/^VALUE\s*<=\s*([^\s]+)$/i);
    if (lteMatch) {
        return `value.lte('${lteMatch[1]}')`;
    }
    const eqMatch = trimmed.match(/^VALUE\s*=\s*(.+)$/i);
    if (eqMatch) {
        const val = eqMatch[1].trim();
        if (val.startsWith("'") && val.endsWith("'")) {
            return `value.eq(${val})`;
        }
        return `value.eq('${val}')`;
    }
    const lengthLte = trimmed.match(/^LENGTH\s*\(\s*VALUE\s*\)\s*<=\s*(\d+)$/i);
    if (lengthLte) {
        return `value.lengthLte(${lengthLte[1]})`;
    }
    const lengthGte = trimmed.match(/^LENGTH\s*\(\s*VALUE\s*\)\s*>=\s*(\d+)$/i);
    if (lengthGte) {
        return `value.lengthGte(${lengthGte[1]})`;
    }
    const lengthLt = trimmed.match(/^LENGTH\s*\(\s*VALUE\s*\)\s*<\s*(\d+)$/i);
    if (lengthLt) {
        return `value.lengthLt(${lengthLt[1]})`;
    }
    const lengthGt = trimmed.match(/^LENGTH\s*\(\s*VALUE\s*\)\s*>\s*(\d+)$/i);
    if (lengthGt) {
        return `value.lengthGt(${lengthGt[1]})`;
    }
    const lengthEq = trimmed.match(/^LENGTH\s*\(\s*VALUE\s*\)\s*=\s*(\d+)$/i);
    if (lengthEq) {
        return `value.lengthEq(${lengthEq[1]})`;
    }
    const notLike = trimmed.match(/^VALUE\s+NOT\s+LIKE\s+'([^']+)'$/i);
    if (notLike) {
        return `value.notLike('${notLike[1].replace(/'/g, "\\'")}')`;
    }
    const like = trimmed.match(/^VALUE\s+LIKE\s+'([^']+)'$/i);
    if (like) {
        return `value.like('${like[1].replace(/'/g, "\\'")}')`;
    }
    const inMatch = trimmed.match(/^VALUE\s+IN\s*\(([^)]+)\)$/i);
    if (inMatch) {
        return `value.in([${inMatch[1]}])`;
    }
    const notInMatch = trimmed.match(/^VALUE\s+NOT\s+IN\s*\(([^)]+)\)$/i);
    if (notInMatch) {
        return `value.notIn([${notInMatch[1]}])`;
    }
    const escapedCheck = check.replace(/'/g, "\\'");
    return `value.matches('${escapedCheck}')`;
}
function splitCheckByAnd(expr) {
    const parts = [];
    let current = '';
    let depth = 0;
    let inQuote = false;
    let quoteChar = '';
    let i = 0;
    while (i < expr.length) {
        const char = expr[i];
        if (!inQuote) {
            if (char === "'" || char === '"') {
                inQuote = true;
                quoteChar = char;
                current += char;
            }
            else if (char === '(' || char === '[') {
                depth++;
                current += char;
            }
            else if (char === ')' || char === ']') {
                depth--;
                current += char;
            }
            else if (depth === 0 && expr.substring(i).toUpperCase().startsWith(' AND ')) {
                if (current.trim()) {
                    parts.push(current.trim());
                }
                current = '';
                i += 5;
                continue;
            }
            else {
                current += char;
            }
        }
        else {
            current += char;
            if (char === quoteChar && expr[i - 1] !== '\\') {
                inQuote = false;
            }
        }
        i++;
    }
    if (current.trim()) {
        parts.push(current.trim());
    }
    return parts;
}
function getColumnType(col, enumNames, domainNames, compositeNames) {
    if (!col.dataType) {
        console.warn(`Warning: Column ${col.name} has no dataType, defaulting to text`);
        return 'text()';
    }
    let pgType = col.dataType.toLowerCase();
    const isArray = pgType.startsWith('_') || pgType.endsWith('[]');
    if (pgType.startsWith('_')) {
        pgType = pgType.slice(1);
    }
    if (pgType.endsWith('[]')) {
        pgType = pgType.slice(0, -2);
    }
    const paramMatch = pgType.match(/^([a-z_]+)(?:\(([^)]+)\))?$/);
    const baseType = paramMatch ? paramMatch[1] : pgType;
    const paramsStr = paramMatch ? paramMatch[2] : null;
    if (enumNames && enumNames.has(baseType)) {
        const enumVarName = toCamelCase(baseType) + 'Enum';
        let typeFunc = `${enumVarName}()`;
        if (isArray) {
            typeFunc += '.array()';
        }
        return typeFunc;
    }
    if (compositeNames && compositeNames.has(baseType)) {
        const compositeVarName = toCamelCase(baseType) + 'Composite';
        let typeFunc = `${compositeVarName}()`;
        if (isArray) {
            typeFunc += '.array()';
        }
        return typeFunc;
    }
    if (domainNames && domainNames.has(baseType)) {
        const domainVarName = toCamelCase(baseType) + 'Domain';
        let typeFunc = `${domainVarName}()`;
        if (isArray) {
            typeFunc += '.array()';
        }
        return typeFunc;
    }
    let length = col.maxLength;
    let precision = col.precision;
    let scale = col.scale;
    if (paramsStr) {
        const params = paramsStr.split(',').map(p => p.trim());
        if (params.length === 1 && !isNaN(Number(params[0]))) {
            length = Number(params[0]);
        }
        else if (params.length === 2) {
            precision = Number(params[0]);
            scale = Number(params[1]);
        }
    }
    const colWithParams = { ...col, maxLength: length, precision, scale };
    let typeFunc = getTypeFunctionBase(baseType, colWithParams);
    if (isArray) {
        typeFunc += '.array()';
    }
    return typeFunc;
}
function getTypeFunctionBase(pgType, col) {
    if (['int4', 'integer'].includes(pgType))
        return 'integer()';
    if (['int2', 'smallint'].includes(pgType))
        return 'smallint()';
    if (['int8', 'bigint'].includes(pgType))
        return 'bigint()';
    if (['serial', 'serial4'].includes(pgType))
        return 'serial()';
    if (['serial2', 'smallserial'].includes(pgType))
        return 'smallserial()';
    if (['serial8', 'bigserial'].includes(pgType))
        return 'bigserial()';
    if (['float4', 'real'].includes(pgType))
        return 'real()';
    if (['float8', 'double precision'].includes(pgType))
        return 'doublePrecision()';
    if (pgType === 'numeric' || pgType === 'decimal') {
        if (col.precision && col.scale) {
            return `numeric().precision(${col.precision}).scale(${col.scale})`;
        }
        else if (col.precision) {
            return `numeric().precision(${col.precision})`;
        }
        return 'numeric()';
    }
    if (pgType === 'text')
        return 'text()';
    if (pgType === 'varchar' || pgType === 'character varying') {
        return col.maxLength ? `varchar().length(${col.maxLength})` : 'varchar()';
    }
    if (pgType === 'char' || pgType === 'character' || pgType === 'bpchar') {
        return col.maxLength ? `char().length(${col.maxLength})` : 'char()';
    }
    if (pgType === 'boolean' || pgType === 'bool')
        return 'boolean()';
    if (pgType === 'uuid')
        return 'uuid()';
    if (pgType === 'jsonb')
        return 'jsonb()';
    if (pgType === 'json')
        return 'json()';
    if (pgType === 'timestamp')
        return 'timestamp()';
    if (pgType === 'timestamptz')
        return 'timestamp().withTimezone()';
    if (pgType === 'date')
        return 'date()';
    if (pgType === 'time')
        return 'time()';
    if (pgType === 'timetz')
        return 'time().withTimezone()';
    if (pgType === 'interval')
        return 'interval()';
    if (pgType === 'bytea')
        return 'bytea()';
    if (pgType === 'inet')
        return 'inet()';
    if (pgType === 'cidr')
        return 'cidr()';
    if (pgType === 'macaddr')
        return 'macaddr()';
    if (pgType === 'vector') {
        return col.maxLength ? `vector().dimensions(${col.maxLength})` : 'vector()';
    }
    if (pgType === 'tsvector')
        return 'tsvector()';
    if (pgType === 'tsquery')
        return 'tsquery()';
    if (pgType === 'citext')
        return 'citext()';
    if (pgType === 'hstore')
        return 'hstore()';
    if (pgType === 'ltree')
        return 'ltree()';
    if (pgType === 'lquery')
        return 'lquery()';
    if (pgType === 'ltxtquery')
        return 'ltxtquery()';
    if (pgType === 'cube')
        return 'cube()';
    if (pgType === 'semver')
        return 'semver()';
    return 'text()';
}
function parseGeneratedExpression(expr, camelCase) {
    expr = expr.trim();
    if (expr.startsWith('(') && expr.endsWith(')')) {
        expr = expr.slice(1, -1).trim();
    }
    const arithmeticResult = parseArithmeticExpression(expr, camelCase);
    if (arithmeticResult) {
        return arithmeticResult;
    }
    const functionResult = parseFunctionExpression(expr, camelCase);
    if (functionResult) {
        return functionResult;
    }
    if (/^[a-z_][a-z0-9_]*$/i.test(expr)) {
        const colName = camelCase ? toCamelCase(expr) : expr;
        return `table.${colName}`;
    }
    const escapedExpr = expr
        .replace(/\\/g, '\\\\')
        .replace(/`/g, '\\`')
        .replace(/\$\{/g, '\\${');
    return `sql\`${escapedExpr}\``;
}
function parseArithmeticExpression(expr, camelCase) {
    const tokens = [];
    const operators = [];
    let current = '';
    let parenDepth = 0;
    let inQuote = false;
    let quoteChar = '';
    for (let i = 0; i < expr.length; i++) {
        const char = expr[i];
        const nextChar = i + 1 < expr.length ? expr[i + 1] : '';
        if (!inQuote && (char === "'" || char === '"')) {
            inQuote = true;
            quoteChar = char;
            current += char;
        }
        else if (inQuote && char === quoteChar) {
            inQuote = false;
            current += char;
        }
        else if (inQuote) {
            current += char;
        }
        else if (char === '(') {
            parenDepth++;
            current += char;
        }
        else if (char === ')') {
            parenDepth--;
            current += char;
        }
        else if (parenDepth === 0 && char === '|' && nextChar === '|') {
            if (current.trim()) {
                tokens.push(current.trim());
            }
            operators.push('||');
            current = '';
            i++;
        }
        else if (parenDepth === 0 && ['+', '-', '*', '/'].includes(char)) {
            if (char === '-' && current.trim() === '') {
                current += char;
            }
            else {
                if (current.trim()) {
                    tokens.push(current.trim());
                }
                operators.push(char);
                current = '';
            }
        }
        else {
            current += char;
        }
    }
    if (current.trim()) {
        tokens.push(current.trim());
    }
    if (tokens.length < 2 || operators.length < 1) {
        return null;
    }
    let result = parseSimpleTerm(tokens[0], camelCase);
    if (!result)
        return null;
    for (let i = 0; i < operators.length; i++) {
        const nextTerm = parseSimpleTerm(tokens[i + 1], camelCase);
        if (!nextTerm)
            return null;
        const method = operatorToMethod(operators[i]);
        result = `${result}.${method}(${nextTerm})`;
    }
    return result;
}
function operatorToMethod(op) {
    switch (op) {
        case '+': return 'add';
        case '-': return 'subtract';
        case '*': return 'multiply';
        case '/': return 'divide';
        case '||': return 'concat';
        default: return 'add';
    }
}
function parseSimpleTerm(term, camelCase) {
    term = term.trim();
    term = term.replace(/::[\w\s\[\]]+$/gi, '').trim();
    if (term.startsWith("'") && term.endsWith("'")) {
        return term;
    }
    if (/^-?\d+(\.\d+)?$/.test(term)) {
        return term;
    }
    if (/^[a-z_][a-z0-9_]*$/i.test(term)) {
        const colName = camelCase ? toCamelCase(term) : term;
        return `table.${colName}`;
    }
    if (term.startsWith('"') && term.endsWith('"')) {
        const name = term.slice(1, -1);
        const colName = camelCase ? toCamelCase(name) : name;
        return `table.${colName}`;
    }
    const funcResult = parseFunctionExpression(term, camelCase);
    if (funcResult) {
        return funcResult;
    }
    if (term.startsWith('(') && term.endsWith(')')) {
        const inner = term.slice(1, -1);
        const arithmeticResult = parseArithmeticExpression(inner, camelCase);
        if (arithmeticResult) {
            return `(${arithmeticResult})`;
        }
        const simpleResult = parseSimpleTerm(inner, camelCase);
        if (simpleResult) {
            return simpleResult;
        }
    }
    const arithmeticResult = parseArithmeticExpression(term, camelCase);
    if (arithmeticResult) {
        return arithmeticResult;
    }
    return null;
}
function parseFunctionExpression(expr, camelCase) {
    const funcMatch = expr.match(/^([a-z_][a-z0-9_]*)\s*\((.+)\)$/i);
    if (!funcMatch)
        return null;
    const funcName = funcMatch[1].toLowerCase();
    const argsStr = funcMatch[2];
    const args = parseArguments(argsStr);
    switch (funcName) {
        case 'coalesce': {
            const parsedArgs = args.map(a => parseSimpleTerm(a.trim(), camelCase) || a.trim());
            return `F.coalesce(${parsedArgs.join(', ')})`;
        }
        case 'nullif': {
            const parsedArgs = args.map(a => parseSimpleTerm(a.trim(), camelCase) || a.trim());
            return `F.nullif(${parsedArgs.join(', ')})`;
        }
        case 'lower': {
            const arg = parseSimpleTerm(args[0]?.trim() || '', camelCase);
            return arg ? `F.lower(${arg})` : null;
        }
        case 'upper': {
            const arg = parseSimpleTerm(args[0]?.trim() || '', camelCase);
            return arg ? `F.upper(${arg})` : null;
        }
        case 'trim': {
            const arithmetic = parseArithmeticExpression(args[0]?.trim() || '', camelCase);
            if (arithmetic) {
                return `F.trim(${arithmetic})`;
            }
            const arg = parseSimpleTerm(args[0]?.trim() || '', camelCase);
            return arg ? `F.trim(${arg})` : null;
        }
        case 'length': {
            const arg = parseSimpleTerm(args[0]?.trim() || '', camelCase);
            return arg ? `F.length(${arg})` : null;
        }
        case 'abs': {
            const arg = parseSimpleTerm(args[0]?.trim() || '', camelCase);
            return arg ? `F.abs(${arg})` : null;
        }
        case 'ceil':
        case 'ceiling': {
            const arg = parseSimpleTerm(args[0]?.trim() || '', camelCase);
            return arg ? `F.ceil(${arg})` : null;
        }
        case 'floor': {
            const arg = parseSimpleTerm(args[0]?.trim() || '', camelCase);
            return arg ? `F.floor(${arg})` : null;
        }
        case 'round': {
            const arg = parseSimpleTerm(args[0]?.trim() || '', camelCase);
            const decimals = args[1]?.trim();
            if (decimals) {
                return arg ? `F.round(${arg}, ${decimals})` : null;
            }
            return arg ? `F.round(${arg})` : null;
        }
        case 'concat': {
            const parsedArgs = args.map(a => {
                const trimmed = a.trim();
                if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
                    return trimmed;
                }
                return parseSimpleTerm(trimmed, camelCase) || trimmed;
            });
            return `F.concat(${parsedArgs.join(', ')})`;
        }
        case 'greatest': {
            const parsedArgs = args.map(a => parseSimpleTerm(a.trim(), camelCase) || a.trim());
            return `F.greatest(${parsedArgs.join(', ')})`;
        }
        case 'least': {
            const parsedArgs = args.map(a => parseSimpleTerm(a.trim(), camelCase) || a.trim());
            return `F.least(${parsedArgs.join(', ')})`;
        }
        case 'md5': {
            const arg = parseSimpleTerm(args[0]?.trim() || '', camelCase);
            return arg ? `F.md5(${arg})` : null;
        }
        default:
            return null;
    }
}
function parseArguments(argsStr) {
    const args = [];
    let current = '';
    let parenDepth = 0;
    for (const char of argsStr) {
        if (char === '(') {
            parenDepth++;
            current += char;
        }
        else if (char === ')') {
            parenDepth--;
            current += char;
        }
        else if (char === ',' && parenDepth === 0) {
            args.push(current);
            current = '';
        }
        else {
            current += char;
        }
    }
    if (current) {
        args.push(current);
    }
    return args;
}
function formatDefaultValue(val, col, domainMap) {
    if (!val)
        return null;
    const cleaned = val.replace(/::[\w\s\[\]]+$/gi, '').trim();
    if (cleaned.startsWith('nextval('))
        return null;
    if (cleaned.toLowerCase().includes('gen_random_uuid') && col.isPrimaryKey) {
        return null;
    }
    if (cleaned.toLowerCase() === 'true')
        return 'true';
    if (cleaned.toLowerCase() === 'false')
        return 'false';
    if (!col.dataType) {
        if (cleaned.startsWith("'") && cleaned.endsWith("'")) {
            const str = cleaned.slice(1, -1).replace(/'/g, "\\'");
            return `'${str}'`;
        }
        return null;
    }
    let baseDataType = col.dataType.toLowerCase().replace(/\([^)]*\)$/, '').trim();
    if (domainMap && domainMap.has(baseDataType)) {
        baseDataType = domainMap.get(baseDataType).toLowerCase().replace(/\([^)]*\)$/, '').trim();
    }
    const isNumeric = ['numeric', 'decimal'].includes(baseDataType);
    const isBigInt = ['int8', 'bigint'].includes(baseDataType);
    if (/^-?\d+$/.test(cleaned)) {
        if (isNumeric) {
            return `'${cleaned}'`;
        }
        else if (isBigInt) {
            return `${cleaned}n`;
        }
        return cleaned;
    }
    if (/^-?\d+\.\d+$/.test(cleaned)) {
        return isNumeric ? `'${cleaned}'` : cleaned;
    }
    if (cleaned.toLowerCase() === 'gen_random_uuid()')
        return 'genRandomUuid()';
    if (cleaned.toLowerCase() === 'uuid_generate_v4()')
        return 'genRandomUuid()';
    if (cleaned.toLowerCase() === 'now()')
        return 'now()';
    if (cleaned.toLowerCase() === 'current_timestamp')
        return 'now()';
    if (cleaned.toLowerCase() === 'current_date')
        return 'currentDate()';
    if (cleaned === "'{}'") {
        const isArray = col.dataType.endsWith('[]') || col.dataType.startsWith('_');
        if (isArray)
            return 'emptyArray()';
        return 'emptyObject()';
    }
    if (cleaned === "'[]'" || cleaned === 'ARRAY[]')
        return 'emptyArray()';
    const isJsonColumn = col.dataType.toLowerCase().includes('json');
    if (isJsonColumn && cleaned.startsWith("'") && cleaned.endsWith("'")) {
        const jsonStr = cleaned.slice(1, -1).replace(/''/g, "'");
        try {
            const parsed = JSON.parse(jsonStr);
            return JSON.stringify(parsed);
        }
        catch {
        }
    }
    const pgArrayMatch = cleaned.match(/^'?\{([^}]*)\}'?$/);
    if (pgArrayMatch && !isJsonColumn) {
        const contents = pgArrayMatch[1];
        if (contents === '') {
            return 'emptyArray()';
        }
        const values = contents.split(',').map(v => {
            const trimmed = v.trim();
            if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
                return `'${trimmed.slice(1, -1)}'`;
            }
            return `'${trimmed}'`;
        });
        return `[${values.join(', ')}]`;
    }
    if (cleaned.startsWith('ARRAY[')) {
        const arrayContent = cleaned.match(/ARRAY\[([^\]]*)\]/i);
        if (arrayContent && arrayContent[1]) {
            const values = arrayContent[1].split(',').map(v => {
                const trimmed = v.trim();
                if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
                    return trimmed;
                }
                if (/^(true|false)$/i.test(trimmed)) {
                    return trimmed.toLowerCase();
                }
                if (/^null$/i.test(trimmed)) {
                    return 'null';
                }
                const unquoted = trimmed.replace(/^'|'$/g, '');
                return `'${unquoted}'`;
            });
            return `[${values.join(', ')}]`;
        }
        return 'emptyArray()';
    }
    if (cleaned.startsWith("'") && cleaned.endsWith("'")) {
        const str = cleaned.slice(1, -1).replace(/'/g, "\\'");
        return `'${str}'`;
    }
    return null;
}
function generateColumnDef(col, seenColumns, camelCase = true, checkInfo, enumNames, domainNames, compositeNames, domainMap) {
    if (seenColumns.has(col.name)) {
        return null;
    }
    seenColumns.add(col.name);
    const colType = getColumnType(col, enumNames, domainNames, compositeNames);
    let propName;
    let typeCall;
    if (camelCase) {
        propName = toCamelCase(col.name);
        if (propName !== col.name) {
            typeCall = injectColumnName(colType, col.name);
        }
        else {
            typeCall = colType;
        }
    }
    else {
        propName = col.name;
        typeCall = colType;
    }
    const parts = [typeCall];
    if (checkInfo && checkInfo.values.length > 0) {
        const quotedValues = checkInfo.values.map(v => `'${v}'`).join(', ');
        parts.push(`.check('${checkInfo.name}', [${quotedValues}])`);
    }
    if (col.isPrimaryKey) {
        parts.push('.primaryKey()');
    }
    if (!col.isNullable && !col.isPrimaryKey && !col.isGenerated) {
        parts.push('.notNull()');
    }
    if (col.isUnique && !col.isPrimaryKey) {
        parts.push('.unique()');
    }
    if (col.isGenerated && col.generationExpression) {
        const typedExpr = parseGeneratedExpression(col.generationExpression, camelCase);
        parts.push(`.generatedAlwaysAs((table, F) => ${typedExpr})`);
    }
    else {
        const defaultVal = formatDefaultValue(col.defaultValue, col, domainMap);
        if (defaultVal) {
            parts.push(`.default(${defaultVal})`);
        }
    }
    if (col.references) {
        let refStr = `.references(() => ${toCamelCase(col.references.table)}.${toCamelCase(col.references.column)})`;
        if (col.references.onDelete && col.references.onDelete !== 'NO ACTION') {
            refStr = `.references(() => ${toCamelCase(col.references.table)}.${toCamelCase(col.references.column)}, { onDelete: '${col.references.onDelete.toLowerCase()}' })`;
        }
        if (col.references.onUpdate && col.references.onUpdate !== 'NO ACTION') {
            if (col.references.onDelete && col.references.onDelete !== 'NO ACTION') {
                refStr = `.references(() => ${toCamelCase(col.references.table)}.${toCamelCase(col.references.column)}, { onDelete: '${col.references.onDelete.toLowerCase()}', onUpdate: '${col.references.onUpdate.toLowerCase()}' })`;
            }
            else {
                refStr = `.references(() => ${toCamelCase(col.references.table)}.${toCamelCase(col.references.column)}, { onUpdate: '${col.references.onUpdate.toLowerCase()}' })`;
            }
        }
        parts.push(refStr);
    }
    const columnLine = `${propName}: ${parts.join('')}`;
    if (col.comment) {
        const safeComment = col.comment.replace(/\*\//g, '* /');
        return `    /** ${safeComment} */\n    ${columnLine}`;
    }
    return `    ${columnLine}`;
}
function injectColumnName(typeCall, columnName) {
    return typeCall.replace(/^(\w+)(<[^>]+>)?\(\)/, `$1$2('${columnName}')`);
}
function generateIndexes(indexes, columnNames, camelCase = true) {
    const nonPkIndexes = indexes.filter(idx => !idx.isPrimary);
    if (nonPkIndexes.length === 0) {
        return null;
    }
    let usesExpressions = false;
    const indexLines = nonPkIndexes.map(idx => {
        let columnsArr;
        if (Array.isArray(idx.columns)) {
            columnsArr = idx.columns;
        }
        else if (typeof idx.columns === 'string') {
            const cleaned = idx.columns.replace(/^\{|\}$/g, '');
            columnsArr = cleaned.split(',').map(s => s.trim()).filter(Boolean);
        }
        else {
            columnsArr = [];
        }
        const hasExpression = idx.expression || idx.definition?.includes('(');
        const sqlFunctions = new Set(['lower', 'upper', 'coalesce', 'concat', 'to_tsvector', 'toTsvector',
            'plainto_tsquery', 'ts_rank', 'substring', 'trim', 'length', 'position', 'replace', 'left', 'right',
            'english', 'simple', 'german', 'french', 'spanish', 'now', 'current_timestamp', 'current_date']);
        const validColumns = columnsArr.filter(c => {
            const trimmed = c.trim().toLowerCase();
            if (!trimmed || !/^[a-zA-Z_]/.test(trimmed))
                return false;
            if (sqlFunctions.has(trimmed))
                return false;
            return columnNames.some(cn => cn.toLowerCase() === trimmed || toCamelCase(cn).toLowerCase() === trimmed);
        });
        if (validColumns.length === 0 && hasExpression) {
            usesExpressions = true;
            const expr = idx.expression || extractExpressionFromDef(idx.definition);
            if (expr) {
                const parsedExpr = parseIndexExpression(expr, camelCase);
                let line;
                if (parsedExpr) {
                    line = `        index('${idx.name}').expression(exp => ${parsedExpr})`;
                }
                else {
                    const escapedExpr = expr.replace(/'/g, "\\'").replace(/\n/g, ' ');
                    line = `        index('${idx.name}').expression(exp => exp.raw('${escapedExpr}'))`;
                }
                if (idx.isUnique)
                    line += '.unique()';
                if (idx.type && idx.type !== 'btree') {
                    const method = idx.type.toUpperCase();
                    if (VALID_INDEX_METHODS.has(method)) {
                        line += `.using('${method}')`;
                    }
                }
                if (idx.operatorClasses && idx.operatorClasses.length > 0) {
                    line += `.opclass('${idx.operatorClasses[0]}')`;
                }
                if (idx.whereClause) {
                    const whereCallback = parseWhereClause(idx.whereClause, camelCase);
                    line += `.where(${whereCallback})`;
                }
                return line;
            }
            return null;
        }
        if (validColumns.length === 0)
            return null;
        const cols = validColumns.map(c => {
            const propName = camelCase ? toCamelCase(c) : c;
            return `table.${propName}`;
        }).join(', ');
        let line = `        index('${idx.name}').on(${cols})`;
        if (idx.isUnique) {
            line += '.unique()';
        }
        if (idx.type && idx.type !== 'btree') {
            const method = idx.type.toUpperCase();
            if (VALID_INDEX_METHODS.has(method)) {
                line += `.using('${method}')`;
            }
        }
        if (idx.operatorClasses && idx.operatorClasses.length > 0) {
            line += `.opclass('${idx.operatorClasses[0]}')`;
        }
        if (idx.whereClause) {
            const whereCallback = parseWhereClause(idx.whereClause, camelCase);
            line += `.where(${whereCallback})`;
        }
        return line;
    }).filter(Boolean);
    if (indexLines.length === 0)
        return null;
    if (usesExpressions) {
        return `    (table, index, F) => [\n${indexLines.join(',\n')},\n    ]`;
    }
    else {
        return `    (table, index) => [\n${indexLines.join(',\n')},\n    ]`;
    }
}
function extractExpressionFromDef(definition) {
    if (!definition)
        return null;
    const onMatch = definition.match(/\bON\s+\w+\s*(?:USING\s+\w+\s*)?\(/i);
    if (!onMatch)
        return null;
    const startIdx = onMatch.index + onMatch[0].length;
    let depth = 1;
    let endIdx = startIdx;
    for (let i = startIdx; i < definition.length && depth > 0; i++) {
        if (definition[i] === '(')
            depth++;
        else if (definition[i] === ')')
            depth--;
        if (depth > 0)
            endIdx = i + 1;
    }
    const expr = definition.slice(startIdx, endIdx).trim();
    return expr || null;
}
function parseIndexExpression(expr, camelCase) {
    expr = expr.trim();
    const tsvectorMatch = expr.match(/^to_tsvector\s*\(\s*'([^']+)'\s*,\s*(.+)\s*\)$/i);
    if (tsvectorMatch) {
        const config = tsvectorMatch[1];
        const innerExpr = tsvectorMatch[2].trim();
        const parsedInner = parseIndexExpressionPart(innerExpr, camelCase);
        if (parsedInner) {
            return `exp.toTsvector('${config}', ${parsedInner})`;
        }
    }
    const lowerMatch = expr.match(/^LOWER\s*\(\s*([a-z_][a-z0-9_]*)(?:::TEXT)?\s*\)$/i);
    if (lowerMatch) {
        const col = camelCase ? toCamelCase(lowerMatch[1]) : lowerMatch[1];
        return `exp.lower(exp.col('${col}'))`;
    }
    const upperMatch = expr.match(/^UPPER\s*\(\s*([a-z_][a-z0-9_]*)(?:::TEXT)?\s*\)$/i);
    if (upperMatch) {
        const col = camelCase ? toCamelCase(upperMatch[1]) : upperMatch[1];
        return `exp.upper(exp.col('${col}'))`;
    }
    const orderedColMatch = expr.match(/^([a-z_][a-z0-9_]*)\s+(DESC|ASC)(?:\s+NULLS\s+(FIRST|LAST))?$/i);
    if (orderedColMatch) {
        const col = camelCase ? toCamelCase(orderedColMatch[1]) : orderedColMatch[1];
        const order = orderedColMatch[2].toLowerCase();
        const nulls = orderedColMatch[3]?.toLowerCase();
        let result = `exp.col('${col}')`;
        if (order === 'desc') {
            result += '.desc()';
        }
        else {
            result += '.asc()';
        }
        if (nulls === 'last') {
            result += '.nullsLast()';
        }
        else if (nulls === 'first') {
            result += '.nullsFirst()';
        }
        return result;
    }
    if (/^[a-z_][a-z0-9_]*$/i.test(expr)) {
        const col = camelCase ? toCamelCase(expr) : expr;
        return `exp.col('${col}')`;
    }
    return null;
}
function parseIndexExpressionPart(expr, camelCase) {
    expr = expr.trim();
    if (expr.includes(' || ')) {
        const parts = splitByConcatOperator(expr);
        if (parts.length > 1) {
            const parsedParts = parts.map(p => parseIndexExpressionPart(p.trim(), camelCase));
            if (parsedParts.every(p => p !== null)) {
                return `exp.concat(${parsedParts.join(', ')})`;
            }
        }
    }
    const coalesceMatch = expr.match(/^COALESCE\s*\(\s*([^,]+)\s*,\s*(.+)\s*\)$/i);
    if (coalesceMatch) {
        const firstArg = coalesceMatch[1].trim();
        const defaultArg = coalesceMatch[2].trim();
        let parsedFirst = null;
        const colCastMatch = firstArg.match(/^([a-z_][a-z0-9_]*)::TEXT$/i);
        if (colCastMatch) {
            const col = camelCase ? toCamelCase(colCastMatch[1]) : colCastMatch[1];
            parsedFirst = `exp.asText(exp.col('${col}'))`;
        }
        else if (/^[a-z_][a-z0-9_]*$/i.test(firstArg)) {
            const col = camelCase ? toCamelCase(firstArg) : firstArg;
            parsedFirst = `exp.col('${col}')`;
        }
        if (parsedFirst) {
            if (defaultArg === "''" || defaultArg === "''") {
                return `exp.coalesce(${parsedFirst}, '')`;
            }
            if (/^'[^']*'$/.test(defaultArg)) {
                return `exp.coalesce(${parsedFirst}, ${defaultArg})`;
            }
        }
    }
    const colCastMatch = expr.match(/^([a-z_][a-z0-9_]*)::TEXT$/i);
    if (colCastMatch) {
        const col = camelCase ? toCamelCase(colCastMatch[1]) : colCastMatch[1];
        return `exp.asText(exp.col('${col}'))`;
    }
    if (/^[a-z_][a-z0-9_]*$/i.test(expr)) {
        const col = camelCase ? toCamelCase(expr) : expr;
        return `exp.col('${col}')`;
    }
    if (/^'[^']*'$/.test(expr)) {
        return expr;
    }
    return null;
}
function splitByConcatOperator(expr) {
    const parts = [];
    let current = '';
    let parenDepth = 0;
    for (let i = 0; i < expr.length; i++) {
        const char = expr[i];
        if (char === '(') {
            parenDepth++;
            current += char;
        }
        else if (char === ')') {
            parenDepth--;
            current += char;
        }
        else if (parenDepth === 0 && expr.slice(i, i + 4) === ' || ') {
            if (current.trim()) {
                parts.push(current.trim());
            }
            current = '';
            i += 3;
        }
        else {
            current += char;
        }
    }
    if (current.trim()) {
        parts.push(current.trim());
    }
    return parts;
}
function parseWhereValue(value, camelCase) {
    value = value.trim();
    if (/^'.*'$/.test(value)) {
        return value;
    }
    if (/^-?\d+(\.\d+)?$/.test(value)) {
        return value;
    }
    if (/^TRUE$/i.test(value)) {
        return 'true';
    }
    if (/^FALSE$/i.test(value)) {
        return 'false';
    }
    if (/^NOW\(\)$/i.test(value)) {
        return 'w.now()';
    }
    if (/^CURRENT_DATE$/i.test(value)) {
        return 'w.currentDate()';
    }
    if (/^CURRENT_TIMESTAMP$/i.test(value)) {
        return 'w.currentTimestamp()';
    }
    const dateIntervalMatch = value.match(/^(CURRENT_DATE|CURRENT_TIMESTAMP|NOW\(\))\s*\+\s*INTERVAL\s*'([^']+)'$/i);
    if (dateIntervalMatch) {
        const dateFn = dateIntervalMatch[1].toUpperCase();
        const interval = dateIntervalMatch[2];
        if (dateFn === 'CURRENT_DATE') {
            return `w.currentDate().plus(w.interval('${interval}'))`;
        }
        else if (dateFn === 'CURRENT_TIMESTAMP') {
            return `w.currentTimestamp().plus(w.interval('${interval}'))`;
        }
        else {
            return `w.now().plus(w.interval('${interval}'))`;
        }
    }
    const dateMinusIntervalMatch = value.match(/^(CURRENT_DATE|CURRENT_TIMESTAMP|NOW\(\))\s*-\s*INTERVAL\s*'([^']+)'$/i);
    if (dateMinusIntervalMatch) {
        const dateFn = dateMinusIntervalMatch[1].toUpperCase();
        const interval = dateMinusIntervalMatch[2];
        if (dateFn === 'CURRENT_DATE') {
            return `w.currentDate().minus(w.interval('${interval}'))`;
        }
        else if (dateFn === 'CURRENT_TIMESTAMP') {
            return `w.currentTimestamp().minus(w.interval('${interval}'))`;
        }
        else {
            return `w.now().minus(w.interval('${interval}'))`;
        }
    }
    if (/^[a-z_][a-z0-9_]*$/i.test(value)) {
        const valCol = camelCase ? toCamelCase(value) : value;
        return `table.${valCol}`;
    }
    return null;
}
function parseSingleCondition(clause, camelCase) {
    clause = clause.trim();
    while (clause.startsWith('(') && clause.endsWith(')')) {
        let depth = 0;
        let matched = true;
        for (let i = 0; i < clause.length - 1; i++) {
            if (clause[i] === '(')
                depth++;
            else if (clause[i] === ')')
                depth--;
            if (depth === 0 && i < clause.length - 1) {
                matched = false;
                break;
            }
        }
        if (matched) {
            clause = clause.slice(1, -1).trim();
        }
        else {
            break;
        }
    }
    const isNullMatch = clause.match(/^([a-z_][a-z0-9_]*)\s+IS\s+NULL$/i);
    if (isNullMatch) {
        const col = camelCase ? toCamelCase(isNullMatch[1]) : isNullMatch[1];
        return `w.col(table.${col}).isNull()`;
    }
    const isNotNullMatch = clause.match(/^([a-z_][a-z0-9_]*)\s+IS\s+NOT\s+NULL$/i);
    if (isNotNullMatch) {
        const col = camelCase ? toCamelCase(isNotNullMatch[1]) : isNotNullMatch[1];
        return `w.col(table.${col}).isNotNull()`;
    }
    const notInMatch = clause.match(/^([a-z_][a-z0-9_]*)\s+NOT\s+IN\s*\((.+)\)$/i);
    if (notInMatch) {
        const col = camelCase ? toCamelCase(notInMatch[1]) : notInMatch[1];
        const valuesStr = notInMatch[2];
        const values = valuesStr.match(/'[^']*'/g)?.join(', ') || valuesStr;
        return `w.col(table.${col}).notIn([${values}])`;
    }
    const inMatch = clause.match(/^([a-z_][a-z0-9_]*)\s+IN\s*\((.+)\)$/i);
    if (inMatch) {
        const col = camelCase ? toCamelCase(inMatch[1]) : inMatch[1];
        const valuesStr = inMatch[2];
        const values = valuesStr.match(/'[^']*'/g)?.join(', ') || valuesStr;
        return `w.col(table.${col}).in([${values}])`;
    }
    const comparisonMatch = clause.match(/^([a-z_][a-z0-9_]*)\s*(<=?|>=?|<>|!=|=)\s*(.+)$/i);
    if (comparisonMatch) {
        const col = camelCase ? toCamelCase(comparisonMatch[1]) : comparisonMatch[1];
        const op = comparisonMatch[2];
        const value = comparisonMatch[3].trim();
        let method;
        switch (op) {
            case '=':
                method = 'eq';
                break;
            case '<>':
            case '!=':
                method = 'neq';
                break;
            case '<':
                method = 'lt';
                break;
            case '<=':
                method = 'lte';
                break;
            case '>':
                method = 'gt';
                break;
            case '>=':
                method = 'gte';
                break;
            default: method = 'eq';
        }
        const parsedValue = parseWhereValue(value, camelCase);
        if (parsedValue === null) {
            return null;
        }
        return `w.col(table.${col}).${method}(${parsedValue})`;
    }
    const likeMatch = clause.match(/^([a-z_][a-z0-9_]*)\s+LIKE\s+('.+')$/i);
    if (likeMatch) {
        const col = camelCase ? toCamelCase(likeMatch[1]) : likeMatch[1];
        return `w.col(table.${col}).like(${likeMatch[2]})`;
    }
    const ilikeMatch = clause.match(/^([a-z_][a-z0-9_]*)\s+ILIKE\s+('.+')$/i);
    if (ilikeMatch) {
        const col = camelCase ? toCamelCase(ilikeMatch[1]) : ilikeMatch[1];
        return `w.col(table.${col}).ilike(${ilikeMatch[2]})`;
    }
    const betweenMatch = clause.match(/^([a-z_][a-z0-9_]*)\s+BETWEEN\s+(.+)\s+AND\s+(.+)$/i);
    if (betweenMatch) {
        const col = camelCase ? toCamelCase(betweenMatch[1]) : betweenMatch[1];
        const min = parseWhereValue(betweenMatch[2].trim(), camelCase);
        const max = parseWhereValue(betweenMatch[3].trim(), camelCase);
        if (min && max) {
            return `w.col(table.${col}).between(${min}, ${max})`;
        }
    }
    return null;
}
function splitByOperator(clause, operator) {
    const parts = [];
    let current = '';
    let parenDepth = 0;
    let i = 0;
    while (i < clause.length) {
        const char = clause[i];
        if (char === '(') {
            parenDepth++;
            current += char;
            i++;
        }
        else if (char === ')') {
            parenDepth--;
            current += char;
            i++;
        }
        else if (parenDepth === 0) {
            const remaining = clause.slice(i);
            const match = remaining.match(new RegExp(`^\\s+${operator}\\s+`, 'i'));
            if (match) {
                if (current.trim()) {
                    parts.push(current.trim());
                }
                current = '';
                i += match[0].length;
            }
            else {
                current += char;
                i++;
            }
        }
        else {
            current += char;
            i++;
        }
    }
    if (current.trim()) {
        parts.push(current.trim());
    }
    return parts.length > 1 ? parts : null;
}
function parseCompoundCondition(clause, camelCase) {
    clause = clause.trim();
    while (clause.startsWith('(') && clause.endsWith(')')) {
        let depth = 0;
        let matched = true;
        for (let i = 0; i < clause.length - 1; i++) {
            if (clause[i] === '(')
                depth++;
            else if (clause[i] === ')')
                depth--;
            if (depth === 0 && i < clause.length - 1) {
                matched = false;
                break;
            }
        }
        if (matched) {
            clause = clause.slice(1, -1).trim();
        }
        else {
            break;
        }
    }
    const orParts = splitByOperator(clause, 'OR');
    if (orParts && orParts.length > 1) {
        const parsedParts = orParts.map(p => parseCompoundCondition(p, camelCase));
        if (parsedParts.every(p => p !== null)) {
            const chained = parsedParts.reduce((acc, part, i) => i === 0 ? part : `${acc}.or(${part})`);
            return chained;
        }
        return null;
    }
    const andParts = splitByOperator(clause, 'AND');
    if (andParts && andParts.length > 1) {
        const parsedParts = andParts.map(p => parseCompoundCondition(p, camelCase));
        if (parsedParts.every(p => p !== null)) {
            const chained = parsedParts.reduce((acc, part, i) => i === 0 ? part : `${acc}.and(${part})`);
            return chained;
        }
        return null;
    }
    return parseSingleCondition(clause, camelCase);
}
function parseWhereClause(whereClause, camelCase) {
    const result = parseCompoundCondition(whereClause, camelCase);
    if (result) {
        return `(w) => ${result}`;
    }
    throw new Error(`Unable to parse WHERE clause: ${whereClause}`);
}
function parseCheckExpression(expr, camelCase) {
    expr = expr.trim();
    while (expr.startsWith('(') && expr.endsWith(')')) {
        let depth = 0;
        let matched = true;
        for (let i = 0; i < expr.length - 1; i++) {
            if (expr[i] === '(')
                depth++;
            else if (expr[i] === ')')
                depth--;
            if (depth === 0 && i < expr.length - 1) {
                matched = false;
                break;
            }
        }
        if (matched) {
            expr = expr.slice(1, -1).trim();
        }
        else {
            break;
        }
    }
    const orParts = splitCheckByOperator(expr, 'OR');
    if (orParts && orParts.length > 1) {
        const parsedParts = orParts.map(p => parseCheckExpression(p, camelCase));
        if (parsedParts.every(p => p !== null)) {
            return parsedParts.reduce((acc, part, i) => i === 0 ? part : `${acc}.or(${part})`);
        }
        return null;
    }
    const andParts = splitCheckByOperator(expr, 'AND');
    if (andParts && andParts.length > 1) {
        const parsedParts = andParts.map(p => parseCheckExpression(p, camelCase));
        if (parsedParts.every(p => p !== null)) {
            return parsedParts.reduce((acc, part, i) => i === 0 ? part : `${acc}.and(${part})`);
        }
        return null;
    }
    const isNullMatch = expr.match(/^([a-z_][a-z0-9_]*)\s+IS\s+NULL$/i);
    if (isNullMatch) {
        const col = camelCase ? toCamelCase(isNullMatch[1]) : isNullMatch[1];
        return `table.${col}.isNull()`;
    }
    const isNotNullMatch = expr.match(/^([a-z_][a-z0-9_]*)\s+IS\s+NOT\s+NULL$/i);
    if (isNotNullMatch) {
        const col = camelCase ? toCamelCase(isNotNullMatch[1]) : isNotNullMatch[1];
        return `table.${col}.isNotNull()`;
    }
    const betweenMatch = expr.match(/^([a-z_][a-z0-9_]*)\s+BETWEEN\s+(.+)\s+AND\s+(.+)$/i);
    if (betweenMatch) {
        const col = camelCase ? toCamelCase(betweenMatch[1]) : betweenMatch[1];
        const min = parseCheckValue(betweenMatch[2].trim(), camelCase);
        const max = parseCheckValue(betweenMatch[3].trim(), camelCase);
        if (min && max) {
            return `table.${col}.between(${min}, ${max})`;
        }
    }
    const inMatch = expr.match(/^([a-z_][a-z0-9_]*)\s+IN\s*\(([^)]+)\)$/i);
    if (inMatch) {
        const col = camelCase ? toCamelCase(inMatch[1]) : inMatch[1];
        const values = inMatch[2].split(',').map(v => v.trim());
        return `table.${col}.in([${values.join(', ')}])`;
    }
    const notInMatch = expr.match(/^([a-z_][a-z0-9_]*)\s+NOT\s+IN\s*\(([^)]+)\)$/i);
    if (notInMatch) {
        const col = camelCase ? toCamelCase(notInMatch[1]) : notInMatch[1];
        const values = notInMatch[2].split(',').map(v => v.trim());
        return `table.${col}.notIn([${values.join(', ')}])`;
    }
    const regexMatch = expr.match(/^([a-z_][a-z0-9_]*)\s+(~\*|~)\s+'([^']+)'$/i);
    if (regexMatch) {
        const col = camelCase ? toCamelCase(regexMatch[1]) : regexMatch[1];
        const pattern = regexMatch[3].replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        const method = regexMatch[2] === '~*' ? 'matchesInsensitive' : 'matches';
        return `table.${col}.${method}('${pattern}')`;
    }
    const lengthMatch = expr.match(/^LENGTH\(([a-z_][a-z0-9_]*)(?:::TEXT)?\)\s*(<=?|>=?|<>|!=|=)\s*(\d+)$/i);
    if (lengthMatch) {
        const col = camelCase ? toCamelCase(lengthMatch[1]) : lengthMatch[1];
        const op = lengthMatch[2];
        const value = lengthMatch[3];
        const method = op === '>=' ? 'gte' : op === '<=' ? 'lte' : op === '>' ? 'gt' : op === '<' ? 'lt' : op === '=' ? 'eq' : 'neq';
        return `table.${col}.asText().length().${method}(${value})`;
    }
    const absMatch = expr.match(/^ABS\(([a-z_][a-z0-9_]*)\)\s*(<=?|>=?|<>|!=|=)\s*(.+)$/i);
    if (absMatch) {
        const col = camelCase ? toCamelCase(absMatch[1]) : absMatch[1];
        const op = absMatch[2];
        const value = parseCheckValue(absMatch[3].trim(), camelCase);
        if (value) {
            const method = op === '>=' ? 'gte' : op === '<=' ? 'lte' : op === '>' ? 'gt' : op === '<' ? 'lt' : op === '=' ? 'eq' : 'neq';
            return `table.${col}.abs().${method}(${value})`;
        }
    }
    const arithmeticMatch = expr.match(/^([a-z_][a-z0-9_]*)\s*([+\-])\s*([a-z_][a-z0-9_]*)\s*(<=?|>=?|<>|!=|=)\s*(.+)$/i);
    if (arithmeticMatch) {
        const col1 = camelCase ? toCamelCase(arithmeticMatch[1]) : arithmeticMatch[1];
        const op = arithmeticMatch[2];
        const col2 = camelCase ? toCamelCase(arithmeticMatch[3]) : arithmeticMatch[3];
        const cmpOp = arithmeticMatch[4];
        const value = parseCheckValue(arithmeticMatch[5].trim(), camelCase);
        if (value) {
            const arithMethod = op === '+' ? 'plus' : 'minus';
            const cmpMethod = cmpOp === '>=' ? 'gte' : cmpOp === '<=' ? 'lte' : cmpOp === '>' ? 'gt' : cmpOp === '<' ? 'lt' : cmpOp === '=' ? 'eq' : 'neq';
            return `table.${col1}.${arithMethod}(table.${col2}).${cmpMethod}(${value})`;
        }
    }
    const comparisonMatch = expr.match(/^([a-z_][a-z0-9_]*)\s*(<=?|>=?|<>|!=|=)\s*(.+)$/i);
    if (comparisonMatch) {
        const col = camelCase ? toCamelCase(comparisonMatch[1]) : comparisonMatch[1];
        const op = comparisonMatch[2];
        const value = parseCheckValue(comparisonMatch[3].trim(), camelCase);
        if (value) {
            const method = op === '>=' ? 'gte' : op === '<=' ? 'lte' : op === '>' ? 'gt' : op === '<' ? 'lt' : op === '=' ? 'eq' : 'neq';
            return `table.${col}.${method}(${value})`;
        }
    }
    return null;
}
function parseCheckValue(value, camelCase) {
    value = value.trim();
    if (/^-?\d+(\.\d+)?$/.test(value)) {
        return value;
    }
    const castMatch = value.match(/^\(?(.+?)\)?::[a-z_][a-z0-9_]*(\[\])?$/i);
    if (castMatch) {
        const innerValue = castMatch[1].trim();
        if (/^-?\d+(\.\d+)?$/.test(innerValue)) {
            return innerValue;
        }
        if (/^'.*'$/.test(innerValue)) {
            return innerValue;
        }
        return parseCheckValue(innerValue, camelCase);
    }
    if (/^TRUE$/i.test(value))
        return 'true';
    if (/^FALSE$/i.test(value))
        return 'false';
    if (/^'.*'$/.test(value)) {
        return value;
    }
    if (/^NULL$/i.test(value)) {
        return 'null';
    }
    if (/^[a-z_][a-z0-9_]*$/i.test(value)) {
        const col = camelCase ? toCamelCase(value) : value;
        return `table.${col}`;
    }
    return null;
}
function splitCheckByOperator(expr, operator) {
    if (operator === 'AND' && /\bBETWEEN\b.*\bAND\b/i.test(expr)) {
        const betweenMatch = expr.match(/^([a-z_][a-z0-9_]*)\s+BETWEEN\s+\S+\s+AND\s+\S+$/i);
        if (betweenMatch) {
            return null;
        }
    }
    const parts = [];
    let current = '';
    let parenDepth = 0;
    let i = 0;
    while (i < expr.length) {
        const char = expr[i];
        if (char === '(') {
            parenDepth++;
            current += char;
            i++;
        }
        else if (char === ')') {
            parenDepth--;
            current += char;
            i++;
        }
        else if (parenDepth === 0) {
            const remaining = expr.slice(i);
            const match = remaining.match(new RegExp(`^\\s+${operator}\\s+`, 'i'));
            if (match) {
                if (operator === 'AND' && /\bBETWEEN\s+\S+$/i.test(current.trim())) {
                    current += match[0];
                    i += match[0].length;
                    continue;
                }
                if (current.trim()) {
                    parts.push(current.trim());
                }
                current = '';
                i += match[0].length;
            }
            else {
                current += char;
                i++;
            }
        }
        else {
            current += char;
            i++;
        }
    }
    if (current.trim()) {
        parts.push(current.trim());
    }
    return parts.length > 1 ? parts : null;
}
function generateCheckConstraints(constraints, camelCase) {
    const checkConstraints = constraints.filter(c => {
        if (c.type !== 'CHECK')
            return false;
        if (/::text\s*=\s*ANY/i.test(c.definition))
            return false;
        return true;
    });
    if (checkConstraints.length === 0)
        return null;
    const lines = [];
    for (const check of checkConstraints) {
        let expr = check.definition.trim();
        const checkMatch = expr.match(/CHECK\s*\(/i);
        if (checkMatch && checkMatch.index !== undefined) {
            const startIdx = checkMatch.index + checkMatch[0].length;
            let depth = 1;
            let endIdx = startIdx;
            for (let i = startIdx; i < expr.length && depth > 0; i++) {
                if (expr[i] === '(')
                    depth++;
                else if (expr[i] === ')')
                    depth--;
                if (depth === 0)
                    endIdx = i;
            }
            if (endIdx > startIdx) {
                expr = expr.substring(startIdx, endIdx).trim();
            }
        }
        else if (expr.startsWith('(') && expr.endsWith(')')) {
            expr = expr.slice(1, -1).trim();
        }
        const parsed = parseCheckExpression(expr, camelCase);
        if (parsed) {
            lines.push(`        check.constraint('${check.name}', ${parsed})`);
        }
    }
    if (lines.length === 0)
        return null;
    return `(table, check) => [\n${lines.join(',\n')},\n    ]`;
}
function generateDefineTable(table, camelCase = true, childPartitions, enumNames, domainNames, compositeNames, domainMap) {
    const tableName = toCamelCase(table.name);
    const seenColumns = new Set();
    const pkColumns = new Set();
    const compositePKs = [];
    const pkConstraints = (table.constraints || []).filter(c => c.type === 'PRIMARY KEY');
    for (const pk of pkConstraints) {
        const match = pk.definition.match(/PRIMARY\s+KEY\s*\(([^)]+)\)/i);
        if (match) {
            const cols = match[1].split(',').map(c => c.trim().replace(/"/g, ''));
            if (cols.length === 1) {
                pkColumns.add(cols[0]);
            }
            else if (cols.length > 1) {
                compositePKs.push({ name: pk.name, columns: cols });
            }
        }
    }
    const uniqueColumns = new Set();
    const compositeUniques = [];
    const uniqueConstraints = (table.constraints || []).filter(c => c.type === 'UNIQUE');
    for (const uq of uniqueConstraints) {
        const match = uq.definition.match(/UNIQUE\s*\(([^)]+)\)/i);
        if (match) {
            const cols = match[1].split(',').map(c => c.trim().replace(/"/g, ''));
            if (cols.length === 1) {
                uniqueColumns.add(cols[0]);
            }
            else if (cols.length > 1) {
                compositeUniques.push({ name: uq.name, columns: cols });
            }
        }
    }
    const checkConstraints = (table.constraints || []).filter(c => c.type === 'CHECK');
    const columnChecks = new Map();
    for (const check of checkConstraints) {
        const enumMatch = check.definition.match(/\((\w+)\)::text\s*=\s*ANY\s*\(\s*(?:ARRAY\[)?([^\]]+)\]/i);
        if (enumMatch) {
            const colName = enumMatch[1];
            const valuesStr = enumMatch[2];
            const values = valuesStr.match(/'([^']+)'/g)?.map(v => v.replace(/'/g, '')) || [];
            if (values.length > 0) {
                columnChecks.set(colName, { name: check.name, values });
            }
        }
    }
    const columns = table.columns
        .map(col => {
        const colWithConstraints = {
            ...col,
            isPrimaryKey: pkColumns.has(col.name) ? true : col.isPrimaryKey,
            isUnique: uniqueColumns.has(col.name) ? true : col.isUnique,
        };
        const checkInfo = columnChecks.get(col.name);
        return generateColumnDef(colWithConstraints, seenColumns, camelCase, checkInfo, enumNames, domainNames, compositeNames, domainMap);
    })
        .filter(Boolean);
    const columnNames = Array.from(seenColumns);
    const indexesFn = table.indexes ? generateIndexes(table.indexes, columnNames, camelCase) : null;
    const checkConstraintsFn = table.constraints ? generateCheckConstraints(table.constraints, camelCase) : null;
    const hasPartition = table.isPartitioned && table.partitionType && table.partitionKey?.length;
    const hasChildPartitions = childPartitions && childPartitions.length > 0;
    const hasCompositePK = compositePKs.length > 0;
    const hasCompositeUnique = compositeUniques.length > 0;
    const hasTableConstraints = hasCompositePK || hasCompositeUnique;
    if (hasPartition || indexesFn || hasChildPartitions || checkConstraintsFn || hasTableConstraints) {
        const parts = [];
        if (hasPartition) {
            let rawPartitionKey = table.partitionKey || [];
            if (typeof rawPartitionKey === 'string') {
                rawPartitionKey = rawPartitionKey
                    .replace(/^\{|\}$/g, '')
                    .split(',')
                    .map(k => k.trim())
                    .filter(Boolean);
            }
            if (!Array.isArray(rawPartitionKey)) {
                rawPartitionKey = [String(rawPartitionKey)];
            }
            const cleanedPartitionKey = rawPartitionKey.map((k) => {
                return k.replace(/^\{|\}$/g, '').trim();
            }).filter(Boolean);
            const partitionCol = camelCase ? toCamelCase(cleanedPartitionKey[0]) : cleanedPartitionKey[0];
            const partitionTypeLC = (table.partitionType || 'LIST').toLowerCase();
            if (partitionTypeLC === 'hash') {
                parts.push(`    partitionBy: (table, p) => p.hash(table.${partitionCol}, 4)`);
            }
            else {
                parts.push(`    partitionBy: (table, p) => p.${partitionTypeLC}(table.${partitionCol})`);
            }
        }
        if (hasChildPartitions && childPartitions) {
            const partitionLines = childPartitions.map(cp => {
                const bound = cp.partitionBound || '';
                if (bound.includes('DEFAULT')) {
                    return `        partition('${cp.name}').default()`;
                }
                const listMatch = bound.match(/IN\s*\(([^)]+)\)/i);
                if (listMatch) {
                    const valuesStr = listMatch[1];
                    const values = valuesStr.match(/'([^']+)'/g)?.map((v) => v.replace(/'/g, '')) || [];
                    return `        partition('${cp.name}').in([${values.map((v) => `'${v}'`).join(', ')}])`;
                }
                const rangeMatch = bound.match(/FROM\s*\(([^)]+)\)\s*TO\s*\(([^)]+)\)/i);
                if (rangeMatch) {
                    const from = rangeMatch[1].replace(/'/g, '').trim();
                    const to = rangeMatch[2].replace(/'/g, '').trim();
                    return `        partition('${cp.name}').from('${from}').to('${to}')`;
                }
                const hashMatch = bound.match(/MODULUS\s+(\d+),\s*REMAINDER\s+(\d+)/i);
                if (hashMatch) {
                    const remainder = parseInt(hashMatch[2], 10);
                    return `        partition('${cp.name}').remainder(${remainder})`;
                }
                return `        // Unknown partition: ${cp.name} - ${bound}`;
            });
            parts.push(`    partitions: (partition) => [\n${partitionLines.join(',\n')},\n    ]`);
        }
        if (hasTableConstraints) {
            const constraintLines = [];
            for (const pk of compositePKs) {
                const colRefs = pk.columns.map(c => `table.${camelCase ? toCamelCase(c) : c}`).join(', ');
                constraintLines.push(`        constraint.primaryKey('${pk.name}', ${colRefs})`);
            }
            for (const uq of compositeUniques) {
                const colRefs = uq.columns.map(c => `table.${camelCase ? toCamelCase(c) : c}`).join(', ');
                constraintLines.push(`        constraint.unique('${uq.name}', ${colRefs})`);
            }
            parts.push(`    constraints: (table, constraint) => [\n${constraintLines.join(',\n')},\n    ]`);
        }
        if (checkConstraintsFn) {
            parts.push(`    checkConstraints: ${checkConstraintsFn.trim()}`);
        }
        if (indexesFn) {
            parts.push(`    indexes: ${indexesFn.trim()}`);
        }
        const jsDoc = table.comment ? `/**\n * ${table.comment.replace(/\*\//g, '* /')}\n */\n` : '';
        return `${jsDoc}export const ${tableName} = defineTable('${table.name}', {
${columns.join(',\n')},
}, {
${parts.join(',\n')},
})`;
    }
    const jsDoc = table.comment ? `/**\n * ${table.comment.replace(/\*\//g, '* /')}\n */\n` : '';
    return `${jsDoc}export const ${tableName} = defineTable('${table.name}', {
${columns.join(',\n')},
})`;
}
export function generateTypeScript(schema, options) {
    const { includeDefineTables = true, includeSchema = true, includeFunctions = true, includeTriggers = true, camelCase = true, importPath, } = options;
    const partitionTableNames = new Set(schema.partitions.map((p) => p.name.toLowerCase()));
    const tables = schema.tables.filter(t => !EXCLUDED_TABLES.includes(t.name.toLowerCase()) &&
        !partitionTableNames.has(t.name.toLowerCase()));
    const parts = [
        '/**',
        ' * Auto-generated by Relq CLI',
        ` * Generated at: ${new Date().toISOString()}`,
        ' * DO NOT EDIT - changes will be overwritten',
        ' */',
        '',
    ];
    const imports = new Set(['defineTable']);
    for (const table of tables) {
        for (const col of table.columns) {
            if (!col.dataType) {
                console.warn(`Warning: Column ${table.name}.${col.name} has no dataType, skipping`);
                continue;
            }
            const rawType = col.dataType.toLowerCase().replace(/^_/, '');
            const pgType = rawType.replace(/\([^)]*\)$/, '').trim();
            if (['int4', 'integer'].includes(pgType))
                imports.add('integer');
            else if (['int2', 'smallint'].includes(pgType))
                imports.add('smallint');
            else if (['int8', 'bigint'].includes(pgType))
                imports.add('bigint');
            else if (['serial', 'serial4'].includes(pgType))
                imports.add('serial');
            else if (['serial8', 'bigserial'].includes(pgType))
                imports.add('bigserial');
            else if (['float4', 'real'].includes(pgType))
                imports.add('real');
            else if (['float8', 'double precision'].includes(pgType))
                imports.add('doublePrecision');
            else if (pgType === 'numeric' || pgType === 'decimal')
                imports.add('numeric');
            else if (pgType === 'text')
                imports.add('text');
            else if (pgType === 'varchar' || pgType === 'character varying')
                imports.add('varchar');
            else if (pgType === 'char' || pgType === 'character' || pgType === 'bpchar')
                imports.add('char');
            else if (pgType === 'boolean' || pgType === 'bool')
                imports.add('boolean');
            else if (pgType === 'uuid')
                imports.add('uuid');
            else if (pgType === 'jsonb')
                imports.add('jsonb');
            else if (pgType === 'json')
                imports.add('json');
            else if (pgType === 'timestamp' || pgType === 'timestamptz')
                imports.add('timestamp');
            else if (pgType === 'date')
                imports.add('date');
            else if (pgType === 'time' || pgType === 'timetz')
                imports.add('time');
            else if (pgType === 'interval')
                imports.add('interval');
            else if (pgType === 'bytea')
                imports.add('bytea');
            else if (pgType === 'inet')
                imports.add('inet');
            else if (pgType === 'tsvector')
                imports.add('tsvector');
            else if (pgType === 'tsquery')
                imports.add('tsquery');
            else if (pgType === 'vector')
                imports.add('vector');
            else if (pgType === 'citext')
                imports.add('citext');
            else if (pgType === 'hstore')
                imports.add('hstore');
            else if (pgType === 'ltree')
                imports.add('ltree');
            else if (pgType === 'lquery')
                imports.add('lquery');
            else if (pgType === 'ltxtquery')
                imports.add('ltxtquery');
            else if (pgType === 'cube')
                imports.add('cube');
            else
                imports.add('text');
            if (col.defaultValue) {
                const d = col.defaultValue.toLowerCase();
                if (d.includes('gen_random_uuid') || d.includes('uuid_generate')) {
                    imports.add('genRandomUuid');
                }
                if (d.includes('now()') || d.includes('current_timestamp'))
                    imports.add('now');
                if (d.includes('current_date'))
                    imports.add('currentDate');
                const isArrayType = col.dataType.endsWith('[]') || col.dataType.startsWith('_');
                if (d.includes("'{}'")) {
                    if (isArrayType) {
                        imports.add('emptyArray');
                    }
                    else {
                        imports.add('emptyObject');
                    }
                }
                if (d.includes("'[]'") || d.includes('array[]'))
                    imports.add('emptyArray');
            }
            if (col.isGenerated && col.generationExpression) {
                const expr = col.generationExpression.toLowerCase();
                const complexFunctions = ['setweight', 'to_tsvector', 'plainto_tsquery', 'ts_rank',
                    'regexp_replace', 'array_agg', 'string_agg', 'jsonb_build_object',
                    'jsonb_agg', 'row_to_json', 'json_build_object'];
                if (complexFunctions.some(f => expr.includes(f))) {
                    imports.add('sql');
                }
            }
        }
    }
    const userFunctions = schema.functions?.filter((f) => !f.name.startsWith('pg_') &&
        !EXCLUDED_FUNCTIONS.some(ex => f.name.startsWith(ex) || f.name === ex)) || [];
    if (includeFunctions && userFunctions.length > 0) {
        imports.add('pgFunction');
    }
    if (includeTriggers && schema.triggers && schema.triggers.length > 0) {
        imports.add('pgTrigger');
        if (!includeFunctions) {
            imports.add('pgFunction');
        }
    }
    if (schema.sequences && schema.sequences.length > 0) {
        imports.add('pgSequence');
    }
    if (schema.enums && schema.enums.length > 0) {
        imports.add('pgEnum');
    }
    if (schema.domains && schema.domains.length > 0) {
        imports.add('pgDomain');
        for (const domainDef of schema.domains) {
            const rawType = domainDef.baseType.toLowerCase().replace(/^_/, '');
            const pgType = rawType.replace(/\([^)]*\)$/, '').trim();
            if (['int4', 'integer'].includes(pgType))
                imports.add('integer');
            else if (['int2', 'smallint'].includes(pgType))
                imports.add('smallint');
            else if (['int8', 'bigint'].includes(pgType))
                imports.add('bigint');
            else if (['float4', 'real'].includes(pgType))
                imports.add('real');
            else if (['float8', 'double precision'].includes(pgType))
                imports.add('doublePrecision');
            else if (pgType === 'numeric' || pgType === 'decimal')
                imports.add('numeric');
            else if (pgType === 'text')
                imports.add('text');
            else if (pgType === 'varchar' || pgType === 'character varying')
                imports.add('varchar');
            else if (pgType === 'char' || pgType === 'character' || pgType === 'bpchar')
                imports.add('char');
            else if (pgType === 'boolean' || pgType === 'bool')
                imports.add('boolean');
            else if (pgType === 'uuid')
                imports.add('uuid');
            else if (pgType === 'inet')
                imports.add('inet');
            else if (pgType === 'citext')
                imports.add('citext');
        }
    }
    if (schema.compositeTypes && schema.compositeTypes.length > 0) {
        imports.add('pgComposite');
        for (const composite of schema.compositeTypes) {
            for (const attr of composite.attributes || []) {
                const rawType = attr.type.toLowerCase().replace(/^_/, '');
                const pgType = rawType.replace(/\([^)]*\)$/, '').trim();
                if (['int4', 'integer'].includes(pgType))
                    imports.add('integer');
                else if (['int2', 'smallint'].includes(pgType))
                    imports.add('smallint');
                else if (['int8', 'bigint'].includes(pgType))
                    imports.add('bigint');
                else if (['float4', 'real'].includes(pgType))
                    imports.add('real');
                else if (['float8', 'double precision'].includes(pgType))
                    imports.add('doublePrecision');
                else if (pgType === 'numeric' || pgType === 'decimal')
                    imports.add('numeric');
                else if (pgType === 'text')
                    imports.add('text');
                else if (pgType === 'varchar' || pgType === 'character varying')
                    imports.add('varchar');
                else if (pgType === 'char' || pgType === 'character' || pgType === 'bpchar')
                    imports.add('char');
                else if (pgType === 'boolean' || pgType === 'bool')
                    imports.add('boolean');
                else if (pgType === 'uuid')
                    imports.add('uuid');
                else if (pgType === 'jsonb')
                    imports.add('jsonb');
                else if (pgType === 'json')
                    imports.add('json');
                else if (pgType === 'timestamp' || pgType === 'timestamptz')
                    imports.add('timestamp');
                else if (pgType === 'date')
                    imports.add('date');
                else if (pgType === 'time' || pgType === 'timetz')
                    imports.add('time');
                else if (pgType === 'inet')
                    imports.add('inet');
            }
        }
    }
    if (schema.extensions && schema.extensions.length > 0) {
        imports.add('pgExtensions');
    }
    parts.push(`import {`);
    parts.push(`    ${Array.from(imports).sort().join(',\n    ')},`);
    parts.push(`} from '${importPath}';`);
    parts.push('');
    if (schema.enums && schema.enums.length > 0) {
        parts.push('// ============================================');
        parts.push('// Enum Definitions');
        parts.push('// ============================================');
        parts.push('');
        for (const enumDef of schema.enums) {
            const enumName = toCamelCase(enumDef.name) + 'Enum';
            const values = enumDef.values.map((v) => `'${v}'`).join(', ');
            parts.push(`export const ${enumName} = pgEnum('${enumDef.name}', [${values}]);`);
        }
        parts.push('');
    }
    if (schema.domains && schema.domains.length > 0) {
        parts.push('// ============================================');
        parts.push('// Domain Type Definitions');
        parts.push('// ============================================');
        parts.push('');
        for (const domainDef of schema.domains) {
            const domainName = toCamelCase(domainDef.name) + 'Domain';
            const columnBuilderCall = generateColumnBuilderFromType(domainDef.baseType);
            if (domainDef.check) {
                const checkExpr = convertSqlCheckToTypedExpr(domainDef.check);
                parts.push(`export const ${domainName} = pgDomain('${domainDef.name}',`);
                parts.push(`    ${columnBuilderCall},`);
                parts.push(`    (value) => [${checkExpr}]`);
                parts.push(`);`);
            }
            else {
                parts.push(`export const ${domainName} = pgDomain('${domainDef.name}', ${columnBuilderCall});`);
            }
        }
        parts.push('');
    }
    if (schema.compositeTypes && schema.compositeTypes.length > 0) {
        parts.push('// ============================================');
        parts.push('// Composite Type Definitions');
        parts.push('// ============================================');
        parts.push('');
        for (const compDef of schema.compositeTypes) {
            const compName = toCamelCase(compDef.name) + 'Composite';
            const fields = (compDef.attributes || [])
                .map((attr) => {
                const fieldName = toCamelCase(attr.name);
                const fieldType = getColumnType({ name: attr.name, dataType: attr.type });
                return `    ${fieldName}: ${fieldType}`;
            })
                .join(',\n');
            if (fields) {
                parts.push(`export const ${compName} = pgComposite('${compDef.name}', {`);
                parts.push(fields);
                parts.push('});');
            }
            else {
                parts.push(`export const ${compName} = pgComposite('${compDef.name}', {});`);
            }
        }
        parts.push('');
    }
    if (includeDefineTables) {
        parts.push('// ============================================');
        parts.push('// Table Definitions');
        parts.push('// ============================================');
        parts.push('');
        const enumNames = new Set((schema.enums || []).map((e) => e.name.toLowerCase()));
        const domainNames = new Set((schema.domains || []).map((d) => d.name.toLowerCase()));
        const compositeNames = new Set((schema.compositeTypes || []).map((c) => c.name.toLowerCase()));
        const domainMap = new Map((schema.domains || []).map((d) => [d.name.toLowerCase(), d.baseType]));
        for (const table of tables) {
            const childPartitions = schema.partitions.filter((p) => p.parentTable === table.name);
            parts.push(generateDefineTable(table, camelCase, childPartitions, enumNames, domainNames, compositeNames, domainMap));
            parts.push('');
        }
    }
    parts.push('// ============================================');
    parts.push('// Type Exports');
    parts.push('// ============================================');
    parts.push('');
    for (const table of tables) {
        const tableName = toCamelCase(table.name);
        const typeName = toPascalCase(table.name);
        parts.push(`export type ${typeName} = typeof ${tableName}.$inferSelect;`);
        parts.push(`export type New${typeName} = typeof ${tableName}.$inferInsert;`);
    }
    parts.push('');
    if (schema.sequences && schema.sequences.length > 0) {
        parts.push('// ============================================');
        parts.push('// Database Sequences');
        parts.push('// ============================================');
        parts.push('');
        for (const seq of schema.sequences) {
            const seqName = toCamelCase(seq.name);
            const opts = [];
            if (seq.dataType) {
                opts.push(`    as: '${seq.dataType}'`);
            }
            if (seq.start !== undefined) {
                opts.push(`    start: ${seq.start}`);
            }
            if (seq.increment !== undefined) {
                opts.push(`    increment: ${seq.increment}`);
            }
            if (seq.minValue !== undefined) {
                opts.push(`    minValue: ${seq.minValue === null ? 'null' : seq.minValue}`);
            }
            if (seq.maxValue !== undefined) {
                opts.push(`    maxValue: ${seq.maxValue === null ? 'null' : seq.maxValue}`);
            }
            if (seq.cache !== undefined) {
                opts.push(`    cache: ${seq.cache}`);
            }
            if (seq.cycle !== undefined) {
                opts.push(`    cycle: ${seq.cycle}`);
            }
            if (seq.ownedBy) {
                opts.push(`    ownedBy: '${seq.ownedBy}'`);
            }
            if (opts.length > 0) {
                parts.push(`export const ${seqName} = pgSequence('${seq.name}', {`);
                parts.push(opts.join(',\n') + ',');
                parts.push(`});`);
            }
            else {
                parts.push(`export const ${seqName} = pgSequence('${seq.name}');`);
            }
            parts.push('');
        }
    }
    if (includeFunctions && schema.functions && schema.functions.length > 0) {
        const userFunctions = schema.functions.filter(f => !f.name.startsWith('pg_') &&
            !EXCLUDED_FUNCTIONS.some(ex => f.name.startsWith(ex) || f.name === ex));
        if (userFunctions.length > 0) {
            parts.push('// ============================================');
            parts.push('// Database Functions');
            parts.push('// ============================================');
            parts.push('');
            for (const func of userFunctions) {
                const funcName = toCamelCase(func.name);
                const escapedDefinition = func.definition
                    .replace(/\\/g, '\\\\')
                    .replace(/`/g, '\\`')
                    .replace(/\${/g, '\\${');
                const argsStr = func.argTypes && func.argTypes.length > 0
                    ? func.argTypes.map((arg, i) => `{ name: 'arg${i}', type: '${arg}' }`).join(', ')
                    : '';
                if (func.comment) {
                    const safeComment = func.comment.replace(/\*\//g, '* /');
                    parts.push(`/**\n * ${safeComment}\n */`);
                }
                parts.push(`export const ${funcName} = pgFunction('${func.name}', {`);
                if (argsStr) {
                    parts.push(`    args: [${argsStr}],`);
                }
                parts.push(`    returns: '${func.returnType}',`);
                parts.push(`    language: '${func.language}',`);
                parts.push(`    raw: \`${escapedDefinition}\`,`);
                parts.push(`});`);
                parts.push('');
            }
        }
    }
    if (includeTriggers && schema.triggers && schema.triggers.length > 0) {
        const tableNames = new Set(tables.map(t => t.name.toLowerCase()));
        const validTriggers = schema.triggers.filter((t) => tableNames.has(t.tableName.toLowerCase()) &&
            !partitionTableNames.has(t.tableName.toLowerCase()));
        if (validTriggers.length > 0) {
            const triggerFuncNames = new Set();
            for (const trigger of validTriggers) {
                triggerFuncNames.add(trigger.functionName);
            }
            if (!includeFunctions && triggerFuncNames.size > 0) {
                parts.push('// ============================================');
                parts.push('// Trigger Function References');
                parts.push('// ============================================');
                parts.push('');
                for (const funcName of triggerFuncNames) {
                    const funcCamel = toCamelCase(funcName);
                    parts.push(`export const ${funcCamel} = pgFunction('${funcName}', { returns: 'trigger', language: 'plpgsql' });`);
                }
                parts.push('');
            }
            parts.push('// ============================================');
            parts.push('// Database Triggers');
            parts.push('// ============================================');
            parts.push('');
            const seenTriggerNames = new Set();
            for (const trigger of validTriggers) {
                const tableCamel = toCamelCase(trigger.tableName);
                const funcCamel = toCamelCase(trigger.functionName);
                let triggerName = toCamelCase(trigger.name);
                if (seenTriggerNames.has(triggerName)) {
                    triggerName = `${triggerName}_${tableCamel}`;
                }
                seenTriggerNames.add(triggerName);
                const timing = (trigger.timing || 'AFTER').toUpperCase();
                const event = (trigger.event || 'INSERT').toUpperCase();
                const timingProp = timing === 'BEFORE' ? 'before' :
                    timing === 'INSTEAD OF' ? 'insteadOf' : 'after';
                if (trigger.comment) {
                    const safeComment = trigger.comment.replace(/\*\//g, '* /');
                    parts.push(`/**\n * ${safeComment}\n */`);
                }
                parts.push(`export const ${triggerName} = pgTrigger('${trigger.name}', {`);
                parts.push(`    on: ${tableCamel},`);
                parts.push(`    ${timingProp}: '${event}',`);
                parts.push(`    forEachRow: true,`);
                parts.push(`    execute: ${funcCamel},`);
                parts.push(`});`);
                parts.push('');
            }
        }
    }
    if (includeSchema) {
        parts.push('// ============================================');
        parts.push('// Schema Export');
        parts.push('// ============================================');
        parts.push('');
        const tableRefs = tables.map(t => `    ${toCamelCase(t.name)},`).join('\n');
        parts.push('export const schema = {');
        parts.push(tableRefs);
        parts.push('} as const;');
        parts.push('');
        const schemaTypes = tables.map(t => `    ${toCamelCase(t.name)}: typeof ${toCamelCase(t.name)};`).join('\n');
        parts.push('export type DatabaseSchema = {');
        parts.push(schemaTypes);
        parts.push('};');
    }
    if (schema.extensions && schema.extensions.length > 0) {
        parts.push('');
        parts.push('// Enabled Extensions');
        const extArgs = schema.extensions.map((e) => `'${e}'`).join(', ');
        parts.push(`export const enabledExtensions = pgExtensions(${extArgs});`);
    }
    return parts.join('\n');
}
