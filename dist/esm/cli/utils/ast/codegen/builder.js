import { toCamelCase, escapeString } from "./utils.js";
export const KNOWN_BUILDER_FUNCTIONS = {
    'coalesce': 'coalesce',
    'nullif': 'nullif',
    'lower': 'lower',
    'upper': 'upper',
    'trim': 'trim',
    'ltrim': 'ltrim',
    'rtrim': 'rtrim',
    'btrim': 'btrim',
    'concat': 'concat',
    'concat_ws': 'concatWs',
    'length': 'length',
    'char_length': 'length',
    'character_length': 'length',
    'octet_length': 'octetLength',
    'bit_length': 'bitLength',
    'substring': 'substring',
    'substr': 'substring',
    'replace': 'replace',
    'lpad': 'lpad',
    'rpad': 'rpad',
    'left': 'left',
    'right': 'right',
    'reverse': 'reverse',
    'repeat': 'repeat',
    'initcap': 'initcap',
    'ascii': 'ascii',
    'chr': 'chr',
    'position': 'position',
    'strpos': 'position',
    'overlay': 'overlay',
    'translate': 'translate',
    'split_part': 'splitPart',
    'regexp_replace': 'regexpReplace',
    'regexp_match': 'regexpMatch',
    'regexp_matches': 'regexpMatches',
    'format': 'format',
    'quote_ident': 'quoteIdent',
    'quote_literal': 'quoteLiteral',
    'quote_nullable': 'quoteNullable',
    'encode': 'encode',
    'decode': 'decode',
    'md5': 'md5',
    'sha256': 'sha256',
    'sha512': 'sha512',
    'digest': 'digest',
    'abs': 'abs',
    'ceil': 'ceil',
    'ceiling': 'ceil',
    'floor': 'floor',
    'round': 'round',
    'trunc': 'trunc',
    'truncate': 'trunc',
    'sign': 'sign',
    'sqrt': 'sqrt',
    'cbrt': 'cbrt',
    'exp': 'exp',
    'ln': 'ln',
    'log': 'log',
    'log10': 'log10',
    'power': 'power',
    'pow': 'power',
    'mod': 'mod',
    'degrees': 'degrees',
    'radians': 'radians',
    'pi': 'pi',
    'sin': 'sin',
    'cos': 'cos',
    'tan': 'tan',
    'asin': 'asin',
    'acos': 'acos',
    'atan': 'atan',
    'atan2': 'atan2',
    'sinh': 'sinh',
    'cosh': 'cosh',
    'tanh': 'tanh',
    'asinh': 'asinh',
    'acosh': 'acosh',
    'atanh': 'atanh',
    'factorial': 'factorial',
    'gcd': 'gcd',
    'lcm': 'lcm',
    'width_bucket': 'widthBucket',
    'random': 'random',
    'setseed': 'setseed',
    'greatest': 'greatest',
    'least': 'least',
    'json_typeof': 'jsonTypeof',
    'jsonb_typeof': 'jsonbTypeof',
    'json_array_length': 'jsonArrayLength',
    'jsonb_array_length': 'jsonbArrayLength',
    'jsonb_object_keys': 'jsonbKeys',
    'json_object_keys': 'jsonKeys',
    'jsonb_pretty': 'jsonbPretty',
    'jsonb_strip_nulls': 'jsonbStripNulls',
    'to_json': 'toJson',
    'to_jsonb': 'toJsonb',
    'row_to_json': 'rowToJson',
    'json_build_object': 'jsonBuildObject',
    'jsonb_build_object': 'jsonbBuildObject',
    'json_build_array': 'jsonBuildArray',
    'jsonb_build_array': 'jsonbBuildArray',
    'json_agg': 'jsonAgg',
    'jsonb_agg': 'jsonbAgg',
    'json_object_agg': 'jsonObjectAgg',
    'jsonb_object_agg': 'jsonbObjectAgg',
    'jsonb_set': 'jsonbSet',
    'jsonb_insert': 'jsonbInsert',
    'jsonb_path_query': 'jsonbPathQuery',
    'jsonb_path_query_array': 'jsonbPathQueryArray',
    'jsonb_path_query_first': 'jsonbPathQueryFirst',
    'jsonb_path_exists': 'jsonbPathExists',
    'array_length': 'arrayLength',
    'array_position': 'arrayPosition',
    'array_positions': 'arrayPositions',
    'array_dims': 'arrayDims',
    'array_lower': 'arrayLower',
    'array_upper': 'arrayUpper',
    'array_ndims': 'arrayNDims',
    'array_to_string': 'arrayToString',
    'string_to_array': 'stringToArray',
    'array_append': 'arrayAppend',
    'array_prepend': 'arrayPrepend',
    'array_cat': 'arrayCat',
    'array_remove': 'arrayRemove',
    'array_replace': 'arrayReplace',
    'unnest': 'unnest',
    'cardinality': 'cardinality',
    'array_agg': 'arrayAgg',
    'to_tsvector': 'toTsvector',
    'setweight': 'setWeight',
    'to_tsquery': 'toTsquery',
    'plainto_tsquery': 'plainToTsquery',
    'phraseto_tsquery': 'phraseToTsquery',
    'websearch_to_tsquery': 'websearchToTsquery',
    'strip': 'tsStrip',
    'numnode': 'numNode',
    'querytree': 'queryTree',
    'ts_rank': 'tsRank',
    'ts_rank_cd': 'tsRankCd',
    'ts_headline': 'tsHeadline',
    'ts_rewrite': 'tsRewrite',
    'ts_filter': 'tsFilter',
    'ts_delete': 'tsDelete',
    'tsvector_to_array': 'tsvectorToArray',
    'extract': 'extract',
    'date_part': 'datePart',
    'date_trunc': 'dateTrunc',
    'age': 'age',
    'isfinite': 'isfinite',
    'make_date': 'makeDate',
    'make_time': 'makeTime',
    'make_timestamp': 'makeTimestamp',
    'make_timestamptz': 'makeTimestamptz',
    'make_interval': 'makeInterval',
    'now': 'now',
    'current_timestamp': 'currentTimestamp',
    'current_date': 'currentDate',
    'current_time': 'currentTime',
    'localtime': 'localtime',
    'localtimestamp': 'localtimestamp',
    'clock_timestamp': 'clockTimestamp',
    'statement_timestamp': 'statementTimestamp',
    'transaction_timestamp': 'transactionTimestamp',
    'timeofday': 'timeofday',
    'to_char': 'toChar',
    'to_date': 'toDate',
    'to_timestamp': 'toTimestamp',
    'gen_random_uuid': 'genRandomUuid',
    'uuid_generate_v4': 'uuidGenerateV4',
    'uuid_generate_v1': 'uuidGenerateV1',
    'count': 'count',
    'sum': 'sum',
    'avg': 'avg',
    'min': 'min',
    'max': 'max',
    'string_agg': 'stringAgg',
    'bool_and': 'boolAnd',
    'bool_or': 'boolOr',
    'every': 'every',
    'bit_and': 'bitAnd',
    'bit_or': 'bitOr',
    'inet_client_addr': 'inetClientAddr',
    'inet_server_addr': 'inetServerAddr',
    'host': 'host',
    'hostmask': 'hostmask',
    'netmask': 'netmask',
    'network': 'network',
    'broadcast': 'broadcast',
    'masklen': 'masklen',
    'family': 'family',
    'area': 'area',
    'center': 'center',
    'diameter': 'diameter',
    'height': 'height',
    'width': 'width',
    'isclosed': 'isclosed',
    'isopen': 'isopen',
    'npoints': 'npoints',
    'pclose': 'pclose',
    'popen': 'popen',
    'radius': 'radius',
    'lower_bound': 'lowerBound',
    'upper_bound': 'upperBound',
    'isempty': 'isempty',
    'lower_inc': 'lowerInc',
    'upper_inc': 'upperInc',
    'lower_inf': 'lowerInf',
    'upper_inf': 'upperInf',
    'range_merge': 'rangeMerge',
};
export function mapFunctionToBuilder(funcName) {
    return KNOWN_BUILDER_FUNCTIONS[funcName] || null;
}
export const CHAINABLE_FUNCTIONS = new Set([
    'lower', 'upper', 'trim', 'ltrim', 'rtrim', 'btrim',
    'length', 'char_length', 'character_length',
    'left', 'right', 'reverse', 'repeat', 'initcap',
    'substring', 'substr', 'replace', 'translate',
    'lpad', 'rpad', 'ascii', 'md5', 'sha256', 'sha512',
    'encode', 'decode', 'quote_ident', 'quote_literal', 'quote_nullable',
    'coalesce', 'nullif',
    'json_typeof', 'jsonb_typeof',
    'json_array_length', 'jsonb_array_length',
    'jsonb_object_keys', 'json_object_keys',
    'jsonb_pretty', 'jsonb_strip_nulls',
    'to_json', 'to_jsonb',
    'array_length', 'array_position', 'array_positions',
    'array_dims', 'array_lower', 'array_upper', 'array_ndims',
    'array_to_string', 'array_append', 'array_prepend',
    'array_cat', 'array_remove', 'array_replace',
    'unnest', 'cardinality',
    'to_tsvector', 'setweight', 'strip',
    'to_tsquery', 'plainto_tsquery', 'phraseto_tsquery', 'websearch_to_tsquery',
    'ts_rank', 'ts_rank_cd', 'ts_headline',
    'numnode', 'querytree', 'ts_rewrite', 'ts_filter', 'ts_delete',
    'abs', 'ceil', 'ceiling', 'floor', 'round', 'trunc', 'truncate', 'sign',
    'sqrt', 'cbrt', 'exp', 'ln', 'log', 'log10',
    'sin', 'cos', 'tan', 'asin', 'acos', 'atan',
    'sinh', 'cosh', 'tanh', 'degrees', 'radians',
    'factorial',
    'extract', 'date_part', 'date_trunc', 'age', 'isfinite',
]);
export function isChainableFunction(funcName) {
    return CHAINABLE_FUNCTIONS.has(funcName.toLowerCase());
}
function isChainableNode(node) {
    if (!node)
        return false;
    if (node.ColumnRef)
        return true;
    if (node.FuncCall)
        return true;
    if (node.CoalesceExpr)
        return true;
    if (node.TypeCast)
        return isChainableNode(node.TypeCast.arg);
    if (node.A_Expr)
        return isChainableNode(node.A_Expr.lexpr) || isChainableNode(node.A_Expr.rexpr);
    if (node.CaseExpr)
        return true;
    if (node.A_Const)
        return false;
    return false;
}
const SECOND_ARG_CHAINABLE_FUNCTIONS = new Set([
    'to_tsvector',
    'to_tsquery',
    'plainto_tsquery',
    'phraseto_tsquery',
    'websearch_to_tsquery',
    'setweight',
]);
export function astToBuilder(node, prefixOrOptions = 'g') {
    const opts = typeof prefixOrOptions === 'string'
        ? { prefix: prefixOrOptions }
        : prefixOrOptions;
    const { prefix = 'g', useCamelCase = false, useTableRef = false, chainable = false } = opts;
    if (!node)
        return "''";
    if (node.FuncCall) {
        const func = node.FuncCall;
        const funcName = func.funcname?.map((n) => n.String?.sval).filter(Boolean).join('.') || '';
        const funcNameLower = funcName.toLowerCase();
        const rawArgs = func.args || [];
        const args = rawArgs.map((a) => astToBuilder(a, opts));
        const builderMethod = mapFunctionToBuilder(funcNameLower);
        if (builderMethod) {
            if (chainable && isChainableFunction(funcName) && args.length > 0) {
                if (SECOND_ARG_CHAINABLE_FUNCTIONS.has(funcNameLower) && args.length >= 2) {
                    const firstArgIsChainable = isChainableNode(rawArgs[0]);
                    const secondArgIsChainable = isChainableNode(rawArgs[1]);
                    if (!firstArgIsChainable && secondArgIsChainable) {
                        const [configArg, baseArg, ...restArgs] = args;
                        if (restArgs.length > 0) {
                            return `${baseArg}.${builderMethod}(${configArg}, ${restArgs.join(', ')})`;
                        }
                        return `${baseArg}.${builderMethod}(${configArg})`;
                    }
                }
                const firstArgIsChainable = isChainableNode(rawArgs[0]);
                if (firstArgIsChainable) {
                    const [firstArg, ...restArgs] = args;
                    if (restArgs.length > 0) {
                        return `${firstArg}.${builderMethod}(${restArgs.join(', ')})`;
                    }
                    return `${firstArg}.${builderMethod}()`;
                }
            }
            return `${prefix}.${builderMethod}(${args.join(', ')})`;
        }
        throw new Error(`Unsupported function in generated expression: "${funcName}". Add this function to KNOWN_BUILDER_FUNCTIONS in src/cli/utils/ast/codegen/builder.ts`);
    }
    if (node.CoalesceExpr) {
        const rawArgs = node.CoalesceExpr.args || [];
        const args = rawArgs.map((a) => astToBuilder(a, opts));
        if (chainable && args.length > 0 && isChainableNode(rawArgs[0])) {
            const [firstArg, ...restArgs] = args;
            return `${firstArg}.coalesce(${restArgs.join(', ')})`;
        }
        return `${prefix}.coalesce(${args.join(', ')})`;
    }
    if (node.A_Expr) {
        const expr = node.A_Expr;
        const op = expr.name?.[0]?.String?.sval || '';
        const leftIsChainable = isChainableNode(expr.lexpr);
        const left = astToBuilder(expr.lexpr, opts);
        const right = astToBuilder(expr.rexpr, opts);
        switch (op) {
            case '||':
                if (chainable && leftIsChainable) {
                    return `${left}.concat(${right})`;
                }
                return `__CONCAT__[${left}, ${right}]`;
            case '->>':
                if (chainable && leftIsChainable) {
                    return `${left}.jsonbExtractText(${right})`;
                }
                return `${prefix}.jsonbExtractText(${left}, ${right})`;
            case '->':
                if (chainable && leftIsChainable) {
                    return `${left}.jsonbExtract(${right})`;
                }
                return `${prefix}.jsonbExtract(${left}, ${right})`;
            case '@@':
                if (chainable && leftIsChainable) {
                    return `${left}.tsMatch(${right})`;
                }
                return `${prefix}.tsMatch(${left}, ${right})`;
            case '+':
                if (chainable && leftIsChainable) {
                    return `${left}.add(${right})`;
                }
                return `${prefix}.add(${left}, ${right})`;
            case '-':
                if (chainable && leftIsChainable) {
                    return `${left}.subtract(${right})`;
                }
                return `${prefix}.subtract(${left}, ${right})`;
            case '*':
                if (chainable && leftIsChainable) {
                    return `${left}.multiply(${right})`;
                }
                return `${prefix}.multiply(${left}, ${right})`;
            case '/':
                if (chainable && leftIsChainable) {
                    return `${left}.divide(${right})`;
                }
                return `${prefix}.divide(${left}, ${right})`;
            case '%':
                if (chainable && leftIsChainable) {
                    return `${left}.mod(${right})`;
                }
                return `${prefix}.mod(${left}, ${right})`;
            case '=':
            case '<>':
            case '!=':
            case '<':
            case '>':
            case '<=':
            case '>=':
                if ((useTableRef || chainable) && leftIsChainable) {
                    const methodMap = {
                        '=': 'eq', '<>': 'ne', '!=': 'ne',
                        '<': 'lt', '>': 'gt', '<=': 'lte', '>=': 'gte'
                    };
                    return `${left}.${methodMap[op]}(${right})`;
                }
                return `${prefix}.compare(${left}, '${op}', ${right})`;
            case '~':
            case '~*':
            case '!~':
            case '!~*':
                if (chainable && leftIsChainable) {
                    const flags = op.includes('*') ? 'i' : '';
                    const negated = op.startsWith('!');
                    if (negated) {
                        return `${left}.matches(${right}${flags ? `, '${flags}'` : ''}).not()`;
                    }
                    return `${left}.matches(${right}${flags ? `, '${flags}'` : ''})`;
                }
                return `${prefix}.regex(${left}, '${op}', ${right})`;
            default:
                throw new Error(`Unsupported operator in generated expression: "${op}". Add explicit handling for this operator in astToBuilder.`);
        }
    }
    if (node.ColumnRef) {
        const fields = (node.ColumnRef.fields || [])
            .map((f) => f.String?.sval)
            .filter(Boolean);
        if (fields.length === 1) {
            const colName = useCamelCase ? toCamelCase(fields[0]) : fields[0];
            return `${prefix}.${colName}`;
        }
        else if (fields.length === 2) {
            const colName = useCamelCase ? toCamelCase(fields[1]) : fields[1];
            return `${prefix}.${colName}`;
        }
        const colName = useCamelCase ? toCamelCase(fields[fields.length - 1]) : fields[fields.length - 1];
        return `${prefix}.${colName}`;
    }
    if (node.A_Const) {
        const val = node.A_Const;
        if (val.sval !== undefined) {
            const s = val.sval?.sval ?? val.sval;
            return `'${escapeString(String(s))}'`;
        }
        else if (val.ival !== undefined) {
            const i = val.ival?.ival ?? val.ival;
            return String(i);
        }
        else if (val.fval !== undefined) {
            const f = val.fval?.fval ?? val.fval;
            return String(f);
        }
        else if (val.boolval !== undefined) {
            return val.boolval?.boolval ? 'true' : 'false';
        }
        return "''";
    }
    if (node.TypeCast) {
        const argIsChainable = isChainableNode(node.TypeCast.arg);
        const argIsLiteral = node.TypeCast.arg?.A_Const !== undefined;
        const arg = astToBuilder(node.TypeCast.arg, opts);
        const typeName = node.TypeCast.typeName?.names
            ?.map((n) => n.String?.sval)
            .filter(Boolean)
            .join('.') || '';
        if (typeName === 'regconfig' || typeName === 'pg_catalog.regconfig') {
            return arg;
        }
        if (typeName === 'text' || typeName === 'pg_catalog.text') {
            if (argIsLiteral) {
                return arg;
            }
            if (chainable && argIsChainable) {
                return `${arg}.asText()`;
            }
            return `${prefix}.asText(${arg})`;
        }
        if (typeName === 'varchar' || typeName === 'pg_catalog.varchar' || typeName.includes('character varying')) {
            return arg;
        }
        if (typeName === 'char' || typeName === 'bpchar' || typeName === 'pg_catalog.bpchar') {
            return arg;
        }
        if (typeName === 'numeric' || typeName === 'pg_catalog.numeric') {
            return arg;
        }
        if (typeName === 'int4' || typeName === 'integer' || typeName === 'pg_catalog.int4') {
            return arg;
        }
        if (chainable && argIsChainable) {
            return `${arg}.cast('${typeName}')`;
        }
        return `${prefix}.cast(${arg}, '${typeName}')`;
    }
    if (node.NullTest) {
        const argIsChainable = isChainableNode(node.NullTest.arg);
        const arg = astToBuilder(node.NullTest.arg, opts);
        const isNull = node.NullTest.nulltesttype === 'IS_NULL';
        if (chainable && argIsChainable) {
            return isNull ? `${arg}.isNull()` : `${arg}.isNotNull()`;
        }
        return isNull ? `${prefix}.isNull(${arg})` : `${prefix}.isNotNull(${arg})`;
    }
    if (node.BoolExpr) {
        const boolexpr = node.BoolExpr;
        const args = (boolexpr.args || []).map((a) => astToBuilder(a, opts));
        if (useTableRef && args.length >= 2) {
            switch (boolexpr.boolop) {
                case 'AND_EXPR': return args.reduce((acc, arg) => `${acc}.and(${arg})`);
                case 'OR_EXPR': return args.reduce((acc, arg) => `${acc}.or(${arg})`);
                case 'NOT_EXPR': return `${args[0]}.not()`;
            }
        }
        switch (boolexpr.boolop) {
            case 'AND_EXPR': return `${prefix}.and(${args.join(', ')})`;
            case 'OR_EXPR': return `${prefix}.or(${args.join(', ')})`;
            case 'NOT_EXPR': return `${prefix}.not(${args[0]})`;
        }
    }
    if (node.CaseExpr) {
        const caseExpr = node.CaseExpr;
        let chain = `${prefix}.case()`;
        for (const w of (caseExpr.args || [])) {
            if (w.CaseWhen) {
                const condition = astToBuilder(w.CaseWhen.expr, opts);
                const result = astToBuilder(w.CaseWhen.result, opts);
                chain += `.when(${condition}, ${result})`;
            }
        }
        if (caseExpr.defresult) {
            const defResult = astToBuilder(caseExpr.defresult, opts);
            chain += `.else(${defResult})`;
        }
        else {
            chain += '.end()';
        }
        return chain;
    }
    const nodeType = Object.keys(node)[0];
    throw new Error(`Unsupported AST node type in generated expression: "${nodeType}". Add explicit handling for this node type in astToBuilder.`);
}
function extractConcatItems(expr) {
    if (expr.startsWith('__CONCAT__[')) {
        const inner = expr.slice('__CONCAT__['.length, -1);
        const items = [];
        let depth = 0;
        let current = '';
        let inQuote = false;
        for (let i = 0; i < inner.length; i++) {
            const c = inner[i];
            if (c === "'" && inner[i - 1] !== '\\') {
                inQuote = !inQuote;
            }
            if (!inQuote) {
                if (c === '[' || c === '(')
                    depth++;
                if (c === ']' || c === ')')
                    depth--;
                if (c === ',' && depth === 0) {
                    items.push(current.trim());
                    current = '';
                    continue;
                }
            }
            current += c;
        }
        if (current.trim())
            items.push(current.trim());
        return items.flatMap(item => extractConcatItems(item));
    }
    return [expr];
}
function cleanAllConcats(expr) {
    let result = expr;
    let iterations = 0;
    const maxIterations = 50;
    while (result.includes('__CONCAT__[') && iterations < maxIterations) {
        const match = result.match(/__CONCAT__\[([^\[\]]*)\]/);
        if (match) {
            const replacement = `F.concat(${match[1]})`;
            result = result.replace(match[0], replacement);
        }
        else {
            break;
        }
        iterations++;
    }
    return result;
}
export function formatGeneratedExpression(expr) {
    if (expr.startsWith('__CONCAT__[')) {
        const items = extractConcatItems(expr);
        const cleanedItems = items.map(item => cleanAllConcats(item));
        return { isArray: true, items: cleanedItems };
    }
    const cleaned = cleanAllConcats(expr);
    return { isArray: false, items: [cleaned] };
}
