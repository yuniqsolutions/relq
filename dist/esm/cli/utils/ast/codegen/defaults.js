import { escapeString } from "./utils.js";
let needsDefaultImport = false;
let needsSqlImport = false;
export function resetDefaultImportFlags() {
    needsDefaultImport = false;
    needsSqlImport = false;
}
export function getDefaultImportNeeded() {
    return needsDefaultImport;
}
export function getDefaultSqlImportNeeded() {
    return needsSqlImport;
}
export function formatDefaultValue(value, columnType) {
    if (!value)
        return "''";
    const trimmed = value.trim();
    const upper = trimmed.toUpperCase();
    if (upper === 'TRUE')
        return 'true';
    if (upper === 'FALSE')
        return 'false';
    if (upper === 'NULL')
        return 'null';
    if (upper === 'GEN_RANDOM_UUID()' || upper.includes('GEN_RANDOM_UUID')) {
        needsDefaultImport = true;
        return 'DEFAULT.genRandomUuid()';
    }
    if (upper === 'UUID_GENERATE_V4()' || upper.includes('UUID_GENERATE_V4')) {
        needsDefaultImport = true;
        return 'DEFAULT.uuidGenerateV4()';
    }
    if (upper === 'UUID_GENERATE_V1()' || upper.includes('UUID_GENERATE_V1()')) {
        needsDefaultImport = true;
        return 'DEFAULT.uuidGenerateV1()';
    }
    if (upper === 'UUID_GENERATE_V1MC()') {
        needsDefaultImport = true;
        return 'DEFAULT.uuidGenerateV1mc()';
    }
    if (upper === 'UUID_NIL()') {
        needsDefaultImport = true;
        return 'DEFAULT.uuidNil()';
    }
    if (upper === 'NOW()' || upper === 'NOW') {
        needsDefaultImport = true;
        return 'DEFAULT.now()';
    }
    if (upper === 'CURRENT_TIMESTAMP' || upper === 'CURRENT_TIMESTAMP()') {
        needsDefaultImport = true;
        return 'DEFAULT.currentTimestamp()';
    }
    if (upper === 'CURRENT_DATE' || upper === 'CURRENT_DATE()') {
        needsDefaultImport = true;
        return 'DEFAULT.currentDate()';
    }
    if (upper === 'CURRENT_TIME' || upper === 'CURRENT_TIME()') {
        needsDefaultImport = true;
        return 'DEFAULT.currentTime()';
    }
    if (upper === 'LOCALTIMESTAMP' || upper === 'LOCALTIMESTAMP()') {
        needsDefaultImport = true;
        return 'DEFAULT.localTimestamp()';
    }
    if (upper === 'LOCALTIME' || upper === 'LOCALTIME()') {
        needsDefaultImport = true;
        return 'DEFAULT.localTime()';
    }
    if (upper === 'TRANSACTION_TIMESTAMP()') {
        needsDefaultImport = true;
        return 'DEFAULT.transactionTimestamp()';
    }
    if (upper === 'STATEMENT_TIMESTAMP()') {
        needsDefaultImport = true;
        return 'DEFAULT.statementTimestamp()';
    }
    if (upper === 'CLOCK_TIMESTAMP()') {
        needsDefaultImport = true;
        return 'DEFAULT.clockTimestamp()';
    }
    if (upper === 'TIMEOFDAY()') {
        needsDefaultImport = true;
        return 'DEFAULT.timeofday()';
    }
    const intervalMatch = trimmed.match(/^'([^']+)'::interval$/i);
    if (intervalMatch) {
        needsDefaultImport = true;
        return `DEFAULT.interval('${intervalMatch[1]}')`;
    }
    if (upper.includes('EXTRACT') && upper.includes('EPOCH') && upper.includes('NOW') && upper.includes('* 1000')) {
        needsDefaultImport = true;
        return 'DEFAULT.epochNow()';
    }
    if (upper.includes('EXTRACT') && upper.includes('EPOCH') && upper.includes('NOW') && !upper.includes('* 1000')) {
        needsDefaultImport = true;
        return 'DEFAULT.epochSeconds()';
    }
    if (upper === 'CURRENT_USER' || upper === 'CURRENT_USER()') {
        needsDefaultImport = true;
        return 'DEFAULT.currentUser()';
    }
    if (upper === 'SESSION_USER' || upper === 'SESSION_USER()') {
        needsDefaultImport = true;
        return 'DEFAULT.sessionUser()';
    }
    if (upper === 'USER' || upper === 'USER()') {
        needsDefaultImport = true;
        return 'DEFAULT.user()';
    }
    if (upper === 'CURRENT_SCHEMA()' || upper === 'CURRENT_SCHEMA') {
        needsDefaultImport = true;
        return 'DEFAULT.currentSchema()';
    }
    if (upper === 'CURRENT_DATABASE()') {
        needsDefaultImport = true;
        return 'DEFAULT.currentDatabase()';
    }
    if (upper === 'CURRENT_CATALOG' || upper === 'CURRENT_CATALOG()') {
        needsDefaultImport = true;
        return 'DEFAULT.currentCatalog()';
    }
    if (upper === 'INET_CLIENT_ADDR()') {
        needsDefaultImport = true;
        return 'DEFAULT.inetClientAddr()';
    }
    if (upper === 'INET_SERVER_ADDR()') {
        needsDefaultImport = true;
        return 'DEFAULT.inetServerAddr()';
    }
    if (upper === 'PG_BACKEND_PID()') {
        needsDefaultImport = true;
        return 'DEFAULT.pgBackendPid()';
    }
    const nextvalMatch = trimmed.match(/^nextval\('([^']+)'(?:::regclass)?\)$/i);
    if (nextvalMatch) {
        needsDefaultImport = true;
        return `DEFAULT.nextval('${nextvalMatch[1]}')`;
    }
    const currvalMatch = trimmed.match(/^currval\('([^']+)'(?:::regclass)?\)$/i);
    if (currvalMatch) {
        needsDefaultImport = true;
        return `DEFAULT.currval('${currvalMatch[1]}')`;
    }
    if (upper === 'LASTVAL()') {
        needsDefaultImport = true;
        return 'DEFAULT.lastval()';
    }
    if (upper === 'RANDOM()') {
        needsDefaultImport = true;
        return 'DEFAULT.random()';
    }
    if (upper === 'PI()') {
        needsDefaultImport = true;
        return 'DEFAULT.pi()';
    }
    if (trimmed === "''" || trimmed === '""') {
        needsDefaultImport = true;
        return 'DEFAULT.emptyString()';
    }
    if (trimmed === "'{}'::jsonb" || upper === "'{}'::JSONB") {
        needsDefaultImport = true;
        return 'DEFAULT.emptyJsonb()';
    }
    if (trimmed === "'{}'::json" || upper === "'{}'::JSON") {
        needsDefaultImport = true;
        return 'DEFAULT.emptyJson()';
    }
    if (trimmed === "'{}'" || trimmed === "'{}'") {
        needsDefaultImport = true;
        return 'DEFAULT.emptyObject()';
    }
    if (trimmed === "'[]'::jsonb" || upper === "'[]'::JSONB" || trimmed === "'[]'::json" || upper === "'[]'::JSON") {
        needsDefaultImport = true;
        return 'DEFAULT.emptyArray()';
    }
    const emptyArrayMatch = trimmed.match(/^ARRAY\[\]::(\w+)\[\]$/i);
    if (emptyArrayMatch) {
        needsDefaultImport = true;
        return 'DEFAULT.emptyArray()';
    }
    const emptyArrayLiteralMatch = trimmed.match(/^'\{\}'::(\w+)\[\]$/i);
    if (emptyArrayLiteralMatch) {
        needsDefaultImport = true;
        return 'DEFAULT.emptyArray()';
    }
    if (upper === "'EMPTY'::INT4RANGE") {
        needsDefaultImport = true;
        return 'DEFAULT.emptyInt4range()';
    }
    if (upper === "'EMPTY'::INT8RANGE") {
        needsDefaultImport = true;
        return 'DEFAULT.emptyInt8range()';
    }
    if (upper === "'EMPTY'::NUMRANGE") {
        needsDefaultImport = true;
        return 'DEFAULT.emptyNumrange()';
    }
    if (upper === "'EMPTY'::TSRANGE") {
        needsDefaultImport = true;
        return 'DEFAULT.emptyTsrange()';
    }
    if (upper === "'EMPTY'::TSTZRANGE") {
        needsDefaultImport = true;
        return 'DEFAULT.emptyTstzrange()';
    }
    if (upper === "'EMPTY'::DATERANGE") {
        needsDefaultImport = true;
        return 'DEFAULT.emptyDaterange()';
    }
    if (upper === "''::TSVECTOR") {
        needsDefaultImport = true;
        return 'DEFAULT.emptyTsvector()';
    }
    if (upper === "''::HSTORE") {
        needsDefaultImport = true;
        return 'DEFAULT.emptyHstore()';
    }
    if (trimmed === "'\\x'::bytea" || upper === "'\\X'::BYTEA") {
        needsDefaultImport = true;
        return 'DEFAULT.emptyBytea()';
    }
    const moneyMatch = trimmed.match(/^'([^']+)'::money$/i);
    if (moneyMatch) {
        needsDefaultImport = true;
        if (moneyMatch[1] === '0' || moneyMatch[1] === '0.00') {
            return 'DEFAULT.zeroMoney()';
        }
        return `DEFAULT.money('${moneyMatch[1]}')`;
    }
    const inetMatch = trimmed.match(/^'([^']+)'::inet$/i);
    if (inetMatch) {
        needsDefaultImport = true;
        return `DEFAULT.inet('${inetMatch[1]}')`;
    }
    const cidrMatch = trimmed.match(/^'([^']+)'::cidr$/i);
    if (cidrMatch) {
        needsDefaultImport = true;
        return `DEFAULT.cidr('${cidrMatch[1]}')`;
    }
    const macaddrMatch = trimmed.match(/^'([^']+)'::macaddr$/i);
    if (macaddrMatch) {
        needsDefaultImport = true;
        return `DEFAULT.macaddr('${macaddrMatch[1]}')`;
    }
    const pointMatch = trimmed.match(/^point\(([^,]+),\s*([^)]+)\)$/i);
    if (pointMatch) {
        needsDefaultImport = true;
        return `DEFAULT.point(${pointMatch[1]}, ${pointMatch[2]})`;
    }
    const castMatch = trimmed.match(/^'([^']*)'::(.+)$/i);
    if (castMatch) {
        const castValue = castMatch[1];
        const castType = castMatch[2].toLowerCase().trim();
        if ((castType === 'jsonb' || castType === 'json') && castValue.startsWith('[')) {
            try {
                const parsed = JSON.parse(castValue);
                return JSON.stringify(parsed);
            }
            catch {
            }
        }
        if ((castType === 'jsonb' || castType === 'json') && castValue.startsWith('{')) {
            try {
                const parsed = JSON.parse(castValue);
                return JSON.stringify(parsed);
            }
            catch {
            }
        }
        if (['varchar', 'text', 'char', 'bpchar', 'character', 'character varying'].includes(castType)) {
            return `'${castValue.replace(/'/g, "\\'")}'`;
        }
        if (['int', 'int2', 'int4', 'int8', 'integer', 'smallint', 'bigint'].includes(castType)) {
            const num = parseInt(castValue, 10);
            if (!isNaN(num)) {
                if (castType === 'int8' || castType === 'bigint') {
                    return `${num}n`;
                }
                return String(num);
            }
        }
        if (castType === 'boolean' || castType === 'bool') {
            return castValue.toLowerCase() === 'true' ? 'true' : 'false';
        }
        if (['numeric', 'decimal', 'real', 'float', 'float4', 'float8', 'double precision'].includes(castType)) {
            const num = parseFloat(castValue);
            if (!isNaN(num)) {
                return String(num);
            }
        }
        return `'${castValue.replace(/'/g, "\\'")}'`;
    }
    const normalizedColType = columnType?.toLowerCase().trim();
    const isBigintColumn = normalizedColType === 'int8' || normalizedColType === 'bigint';
    if (/^-?\d+$/.test(trimmed)) {
        if (isBigintColumn) {
            return `${trimmed}n`;
        }
        return trimmed;
    }
    if (/^-?\d+\.\d+$/.test(trimmed)) {
        return trimmed;
    }
    if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
        const inner = trimmed.slice(1, -1);
        return `'${inner.replace(/'/g, "\\'")}'`;
    }
    if (/^CAST\s*\(\s*(?:'?\{\}'?|ARRAY\s*\[\s*\])\s+AS\s+\w+\s*\[\s*\]\s*\)$/i.test(trimmed)) {
        return '[]';
    }
    needsSqlImport = true;
    return `sql\`${escapeString(trimmed)}\``;
}
