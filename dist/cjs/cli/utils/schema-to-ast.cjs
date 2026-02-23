"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTableDefinition = isTableDefinition;
exports.isEnumConfig = isEnumConfig;
exports.isDomainConfig = isDomainConfig;
exports.isCompositeConfig = isCompositeConfig;
exports.isSequenceConfig = isSequenceConfig;
exports.isViewConfig = isViewConfig;
exports.isMaterializedViewConfig = isMaterializedViewConfig;
exports.isFunctionConfig = isFunctionConfig;
exports.isTriggerConfig = isTriggerConfig;
exports.isExtensionsConfig = isExtensionsConfig;
exports.isRelationsConfig = isRelationsConfig;
exports.generateTrackingId = generateTrackingId;
exports.isValidTrackingId = isValidTrackingId;
exports.extractTrackingId = extractTrackingId;
exports.mapColumnTypeToPostgres = mapColumnTypeToPostgres;
exports.schemaToAST = schemaToAST;
exports.tableToAST = tableToAST;
exports.columnToAST = columnToAST;
exports.indexToAST = indexToAST;
exports.constraintToAST = constraintToAST;
exports.enumToAST = enumToAST;
exports.domainToAST = domainToAST;
exports.compositeToAST = compositeToAST;
exports.sequenceToAST = sequenceToAST;
exports.viewToAST = viewToAST;
exports.materializedViewToAST = materializedViewToAST;
exports.functionToAST = functionToAST;
exports.triggerToAST = triggerToAST;
exports.parsedColumnToColumnInfo = parsedColumnToColumnInfo;
exports.parsedIndexToIndexInfo = parsedIndexToIndexInfo;
exports.parsedConstraintToConstraintInfo = parsedConstraintToConstraintInfo;
exports.parsedTableToTableInfo = parsedTableToTableInfo;
function isTableDefinition(value) {
    return value && typeof value === 'object' &&
        typeof value.$name === 'string' &&
        typeof value.$columns === 'object' &&
        typeof value.toSQL === 'function';
}
function isEnumConfig(value) {
    return value && typeof value === 'object' &&
        typeof value.$enumName === 'string' &&
        Array.isArray(value.$enumValues);
}
function isDomainConfig(value) {
    return value && typeof value === 'object' &&
        typeof value.$domainName === 'string' &&
        typeof value.$baseType === 'string';
}
function isCompositeConfig(value) {
    return value && typeof value === 'object' &&
        typeof value.$typeName === 'string' &&
        typeof value.$fields === 'object';
}
function isSequenceConfig(value) {
    return value && typeof value === 'object' &&
        value.$type === 'sequence' &&
        typeof value.name === 'string';
}
function isViewConfig(value) {
    return value && typeof value === 'object' &&
        value.$type === 'view' &&
        typeof value.name === 'string' &&
        typeof value.definition === 'string';
}
function isMaterializedViewConfig(value) {
    return value && typeof value === 'object' &&
        value.$type === 'materialized_view' &&
        typeof value.name === 'string' &&
        typeof value.definition === 'string';
}
function isFunctionConfig(value) {
    return value && typeof value === 'object' &&
        value.$type === 'function' &&
        typeof value.$functionName === 'string';
}
function isTriggerConfig(value) {
    return value && typeof value === 'object' &&
        value.$type === 'trigger' &&
        typeof value.$triggerName === 'string';
}
function isExtensionsConfig(value) {
    return value && typeof value === 'object' &&
        Array.isArray(value.extensions) &&
        typeof value.toSQL === 'function';
}
function isRelationsConfig(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value))
        return false;
    for (const val of Object.values(value)) {
        if (Array.isArray(val) && val.length > 0 && val[0]?.$type === 'foreignKey') {
            return true;
        }
    }
    return false;
}
function generateTrackingId() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
function isValidTrackingId(id) {
    return typeof id === 'string' && /^[a-z0-9]{6}$/.test(id);
}
function extractTrackingId(obj) {
    if (!obj)
        return undefined;
    if (typeof obj.$trackingId === 'string') {
        return obj.$trackingId;
    }
    if (typeof obj.$id === 'function') {
        const id = obj.$id();
        if (typeof id === 'string') {
            return id;
        }
    }
    return undefined;
}
function mapColumnTypeToPostgres(type) {
    const typeMap = {
        'UUID': 'uuid',
        'TEXT': 'text',
        'VARCHAR': 'character varying',
        'CHAR': 'character',
        'INTEGER': 'integer',
        'INT': 'integer',
        'BIGINT': 'bigint',
        'SMALLINT': 'smallint',
        'SERIAL': 'serial',
        'BIGSERIAL': 'bigserial',
        'SMALLSERIAL': 'smallserial',
        'BOOLEAN': 'boolean',
        'BOOL': 'boolean',
        'REAL': 'real',
        'FLOAT4': 'real',
        'DOUBLE PRECISION': 'double precision',
        'FLOAT8': 'double precision',
        'NUMERIC': 'numeric',
        'DECIMAL': 'numeric',
        'MONEY': 'money',
        'DATE': 'date',
        'TIME': 'time without time zone',
        'TIME WITH TIME ZONE': 'time with time zone',
        'TIMETZ': 'time with time zone',
        'TIMESTAMP': 'timestamp without time zone',
        'TIMESTAMP WITH TIME ZONE': 'timestamp with time zone',
        'TIMESTAMPTZ': 'timestamp with time zone',
        'INTERVAL': 'interval',
        'JSON': 'json',
        'JSONB': 'jsonb',
        'BYTEA': 'bytea',
        'INET': 'inet',
        'CIDR': 'cidr',
        'MACADDR': 'macaddr',
        'MACADDR8': 'macaddr8',
        'POINT': 'point',
        'LINE': 'line',
        'LSEG': 'lseg',
        'BOX': 'box',
        'PATH': 'path',
        'POLYGON': 'polygon',
        'CIRCLE': 'circle',
        'TSVECTOR': 'tsvector',
        'TSQUERY': 'tsquery',
        'XML': 'xml',
        'BIT': 'bit',
        'BIT VARYING': 'bit varying',
        'VARBIT': 'bit varying',
        'PG_LSN': 'pg_lsn',
        'PG_SNAPSHOT': 'pg_snapshot',
        'INT4RANGE': 'int4range',
        'INT8RANGE': 'int8range',
        'NUMRANGE': 'numrange',
        'TSRANGE': 'tsrange',
        'TSTZRANGE': 'tstzrange',
        'DATERANGE': 'daterange',
        'CITEXT': 'citext',
        'LTREE': 'ltree',
        'HSTORE': 'hstore',
        'CUBE': 'cube',
        'VECTOR': 'vector',
    };
    const baseType = type.replace(/\(.*\)$/, '');
    const upperType = baseType.toUpperCase().trim();
    return typeMap[upperType] || baseType.toLowerCase().trim();
}
function schemaToAST(schema) {
    const result = {
        enums: [],
        domains: [],
        compositeTypes: [],
        sequences: [],
        tables: [],
        views: [],
        functions: [],
        triggers: [],
        extensions: [],
    };
    const pendingRelations = [];
    for (const [key, value] of Object.entries(schema)) {
        if (!value)
            continue;
        if (isTableDefinition(value)) {
            const table = tableToAST(value);
            if (table)
                result.tables.push(table);
            continue;
        }
        if (isEnumConfig(value)) {
            const enumDef = enumToAST(value);
            if (enumDef)
                result.enums.push(enumDef);
            continue;
        }
        if (isDomainConfig(value)) {
            const domain = domainToAST(value);
            if (domain)
                result.domains.push(domain);
            continue;
        }
        if (isCompositeConfig(value)) {
            const composite = compositeToAST(value);
            if (composite)
                result.compositeTypes.push(composite);
            continue;
        }
        if (isSequenceConfig(value)) {
            const sequence = sequenceToAST(value);
            if (sequence)
                result.sequences.push(sequence);
            continue;
        }
        if (isViewConfig(value)) {
            const view = viewToAST(value);
            if (view)
                result.views.push(view);
            continue;
        }
        if (isMaterializedViewConfig(value)) {
            const matView = materializedViewToAST(value);
            if (matView)
                result.views.push(matView);
            continue;
        }
        if (isFunctionConfig(value)) {
            const func = functionToAST(value);
            if (func)
                result.functions.push(func);
            continue;
        }
        if (isTriggerConfig(value)) {
            const trigger = triggerToAST(value);
            if (trigger)
                result.triggers.push(trigger);
            continue;
        }
        if (isExtensionsConfig(value)) {
            result.extensions.push(...value.extensions);
            continue;
        }
        if (isRelationsConfig(value)) {
            pendingRelations.push(value);
            continue;
        }
    }
    for (const relations of pendingRelations) {
        mergeRelationsIntoAST(result, relations);
    }
    return result;
}
function mergeRelationsIntoAST(result, relations) {
    const resolveColumnName = (name, tableColumns) => {
        const byTsName = tableColumns.find(c => c.tsName === name);
        if (byTsName)
            return byTsName.name;
        const bySqlName = tableColumns.find(c => c.name === name);
        if (bySqlName)
            return bySqlName.name;
        return name;
    };
    for (const [_tableKey, fkDefs] of Object.entries(relations)) {
        if (!Array.isArray(fkDefs))
            continue;
        for (const fk of fkDefs) {
            if (!fk || fk.$type !== 'foreignKey')
                continue;
            const sourceTableSqlName = fk.$columns?.[0]?.table;
            if (!sourceTableSqlName)
                continue;
            const table = result.tables.find(t => t.name === sourceTableSqlName);
            if (!table)
                continue;
            const rawSourceColumns = fk.$columns.map(c => c.column);
            const sourceColumns = rawSourceColumns.map(c => resolveColumnName(c, table.columns));
            const targetTableDef = result.tables.find(t => t.name === fk.$targetTable);
            const rawTargetColumns = fk.$references
                ? fk.$references.map(r => r.column)
                : [];
            let targetColumns = targetTableDef
                ? rawTargetColumns.map(c => resolveColumnName(c, targetTableDef.columns))
                : rawTargetColumns;
            if (targetColumns.length === 0 && targetTableDef) {
                const pkCols = targetTableDef.columns.filter(c => c.isPrimaryKey);
                if (pkCols.length > 0) {
                    targetColumns = pkCols.map(c => c.name);
                }
            }
            const constraintName = fk.$name || `${sourceTableSqlName}_${sourceColumns.join('_')}_fkey`;
            const constraint = {
                name: constraintName,
                type: 'FOREIGN KEY',
                columns: sourceColumns,
                references: {
                    table: fk.$targetTable,
                    columns: targetColumns.length > 0 ? targetColumns : sourceColumns,
                    onDelete: fk.$onDelete,
                    onUpdate: fk.$onUpdate,
                    match: fk.$match,
                    deferrable: fk.$deferrable,
                    initiallyDeferred: fk.$initiallyDeferred,
                },
                trackingId: fk.$trackingId,
            };
            table.constraints.push(constraint);
        }
    }
}
function tableToAST(table) {
    if (!isTableDefinition(table))
        return null;
    const columns = [];
    const constraints = [];
    for (const [colKey, colDef] of Object.entries(table.$columns || {})) {
        const col = columnToAST(colDef, colKey);
        if (col)
            columns.push(col);
        const config = colDef.$config || colDef;
        if (config.$check) {
            let expression = config.$check;
            if (config.$checkValues && col) {
                const sqlColName = col.name;
                const values = config.$checkValues;
                expression = `"${sqlColName}" IN ('${values.join("', '")}')`;
            }
            constraints.push({
                name: config.$checkName || '',
                type: 'CHECK',
                columns: [colKey],
                expression,
                trackingId: config.$trackingId || config.$checkName || `${table.$name}_${colKey}_check`,
            });
        }
    }
    const indexes = [];
    for (const idx of table.$indexes || []) {
        const index = indexToAST(idx);
        if (index)
            indexes.push(index);
    }
    for (const uc of table.$uniqueConstraints || []) {
        constraints.push({
            name: uc.name || '',
            type: 'UNIQUE',
            columns: uc.columns,
            trackingId: uc.trackingId || uc.name || `${table.$name}_${uc.columns.join('_')}_key`,
        });
    }
    for (const cc of table.$checkConstraints || []) {
        constraints.push({
            name: cc.name || '',
            type: 'CHECK',
            columns: [],
            expression: cc.expression,
            trackingId: cc.trackingId || cc.name || `${table.$name}_check`,
        });
    }
    for (const con of table.$constraints || []) {
        const constraint = constraintToAST(con);
        if (constraint)
            constraints.push(constraint);
    }
    for (const fk of table.$foreignKeys || []) {
        constraints.push({
            name: fk.name || '',
            type: 'FOREIGN KEY',
            columns: fk.columns,
            references: {
                table: fk.references?.table,
                columns: fk.references?.columns,
                onDelete: fk.onDelete,
                onUpdate: fk.onUpdate,
            },
            trackingId: fk.trackingId || fk.name || `${table.$name}_${fk.columns.join('_')}_fkey`,
        });
    }
    const partitionBy = table.$partitionBy;
    const isPartitioned = !!partitionBy;
    const partitionType = partitionBy?.$type?.toUpperCase();
    const partitionKey = partitionBy?.$column ? [partitionBy.$column] : undefined;
    let childPartitions;
    if (table.$partitions && table.$partitions.length > 0) {
        childPartitions = table.$partitions.map((p) => {
            let partitionBound;
            if (p.$partitionType === 'LIST') {
                const values = (p.$values || []).map((v) => `'${v}'`).join(', ');
                partitionBound = `FOR VALUES IN (${values})`;
            }
            else if (p.$partitionType === 'RANGE') {
                partitionBound = `FOR VALUES FROM ('${p.$from}') TO ('${p.$to}')`;
            }
            else if (p.$partitionType === 'HASH') {
                partitionBound = `FOR VALUES WITH (MODULUS ${p.$modulus || partitionBy?.$modulus}, REMAINDER ${p.$remainder})`;
            }
            else if (p.$partitionType === 'DEFAULT' || p.$isDefault) {
                partitionBound = 'DEFAULT';
            }
            else {
                partitionBound = '';
            }
            return { name: p.$name, partitionBound };
        });
    }
    for (const con of constraints) {
        if (con.type === 'PRIMARY KEY' && con.columns.length > 0) {
            for (const colName of con.columns) {
                const col = columns.find(c => c.name === colName || c.tsName === colName);
                if (col)
                    col.isPrimaryKey = true;
            }
        }
        if (con.type === 'UNIQUE' && con.columns.length === 1) {
            const col = columns.find(c => c.name === con.columns[0] || c.tsName === con.columns[0]);
            if (col)
                col.isUnique = true;
        }
    }
    const hasPKConstraint = constraints.some(c => c.type === 'PRIMARY KEY');
    if (!hasPKConstraint) {
        const pkCols = columns.filter(c => c.isPrimaryKey).map(c => c.name);
        if (pkCols.length > 0) {
            constraints.push({
                name: `${table.$name}_pkey`,
                type: 'PRIMARY KEY',
                columns: pkCols,
                trackingId: `${table.$name}_pkey`,
            });
        }
    }
    for (const col of columns) {
        if (!col.isUnique)
            continue;
        const hasUniqueConstraint = constraints.some(c => c.type === 'UNIQUE' && c.columns.length === 1 && c.columns[0] === col.name);
        if (!hasUniqueConstraint) {
            constraints.push({
                name: `${table.$name}_${col.name}_key`,
                type: 'UNIQUE',
                columns: [col.name],
                trackingId: `${table.$name}_${col.name}_key`,
            });
        }
    }
    return {
        name: table.$name,
        schema: table.$schema || 'public',
        columns,
        constraints,
        indexes,
        isPartitioned,
        partitionType,
        partitionKey,
        childPartitions,
        comment: table.$comment,
        trackingId: extractTrackingId(table),
    };
}
function extractDefaultValue(defaultVal, columnType, isArray) {
    if (defaultVal === undefined || defaultVal === null)
        return undefined;
    if (typeof defaultVal === 'object' && defaultVal.$isDefault && typeof defaultVal.$sql === 'string') {
        let sql = defaultVal.$sql;
        if (isArray && columnType && (sql === "'{}'" || sql === "'{}'")) {
            const baseType = columnType.replace(/\[\]$/, '');
            return `ARRAY[]::${baseType}[]`;
        }
        return sql;
    }
    if (typeof defaultVal === 'string') {
        if (defaultVal.startsWith("'") && defaultVal.endsWith("'")) {
            return defaultVal;
        }
        const SQL_DEFAULT_KEYWORDS = /^(TRUE|FALSE|NULL|CURRENT_TIMESTAMP|CURRENT_DATE|CURRENT_TIME|CURRENT_USER|SESSION_USER|LOCALTIME|LOCALTIMESTAMP|USER)$/i;
        if (SQL_DEFAULT_KEYWORDS.test(defaultVal)) {
            return defaultVal;
        }
        if (defaultVal.includes('(') || defaultVal.includes('::') || defaultVal.startsWith('ARRAY') || /^-?\d+(\.\d+)?$/.test(defaultVal)) {
            return defaultVal;
        }
        return `'${defaultVal.replace(/'/g, "''")}'`;
    }
    if (typeof defaultVal === 'boolean') {
        return defaultVal ? 'true' : 'false';
    }
    if (typeof defaultVal === 'number') {
        return String(defaultVal);
    }
    if (Array.isArray(defaultVal)) {
        if (defaultVal.length === 0 && columnType && isArray) {
            const baseType = columnType.replace(/\[\]$/, '');
            return `ARRAY[]::${baseType}[]`;
        }
        return `'${JSON.stringify(defaultVal)}'::jsonb`;
    }
    if (typeof defaultVal === 'object') {
        return `'${JSON.stringify(defaultVal)}'::jsonb`;
    }
    return String(defaultVal);
}
const LENGTH_TYPES = new Set([
    'varchar', 'character varying', 'char', 'character', 'bit', 'bit varying', 'varbit'
]);
const PRECISION_TYPES = new Set([
    'numeric', 'decimal', 'time', 'time without time zone', 'time with time zone',
    'timestamp', 'timestamp without time zone', 'timestamp with time zone', 'interval'
]);
function columnToAST(col, schemaKey) {
    if (!col)
        return null;
    const config = col.$config || col;
    const typeValue = config.$sqlType || (typeof config.$type === 'string' ? config.$type : null) || 'text';
    const mappedType = mapColumnTypeToPostgres(typeValue);
    const lowerType = mappedType.toLowerCase();
    let length = config.$length;
    let precision = config.$precision;
    let scale = config.$scale;
    if (length === undefined && precision === undefined) {
        const paramsMatch = typeValue.match(/\(([^)]+)\)$/);
        if (paramsMatch) {
            const params = paramsMatch[1].split(',').map((s) => s.trim());
            if (params.length === 1 && /^\d+$/.test(params[0])) {
                const val = parseInt(params[0], 10);
                if (LENGTH_TYPES.has(lowerType)) {
                    length = val;
                }
                else if (PRECISION_TYPES.has(lowerType)) {
                    precision = val;
                }
            }
            else if (params.length === 2 && /^\d+$/.test(params[0]) && /^\d+$/.test(params[1])) {
                if (PRECISION_TYPES.has(lowerType)) {
                    precision = parseInt(params[0], 10);
                    scale = parseInt(params[1], 10);
                }
            }
        }
    }
    if (length !== undefined && !LENGTH_TYPES.has(lowerType)) {
        console.warn(`Warning: length parameter not supported for type '${mappedType}' on column '${schemaKey}'`);
    }
    if ((precision !== undefined || scale !== undefined) && !PRECISION_TYPES.has(lowerType)) {
        console.warn(`Warning: precision/scale parameters not supported for type '${mappedType}' on column '${schemaKey}'`);
    }
    const isArray = config.$array || false;
    const sqlName = config.$sqlName || config.$columnName || schemaKey;
    return {
        name: sqlName,
        tsName: schemaKey,
        type: mappedType,
        typeParams: {
            precision,
            scale,
            length,
        },
        isPrimaryKey: config.$primaryKey || false,
        isNullable: (config.$primaryKey) ? false : config.$nullable !== false,
        isUnique: config.$unique || false,
        hasDefault: config.$default !== undefined,
        defaultValue: extractDefaultValue(config.$default, mappedType, isArray),
        isGenerated: !!config.$generated,
        generatedExpression: config.$generated?.expression,
        isArray,
        arrayDimensions: config.$dimensions,
        comment: config.$comment,
        trackingId: extractTrackingId(config),
    };
}
function indexToAST(idx) {
    if (!idx)
        return null;
    const rawColumns = idx.$columns || idx.columns || [];
    const columns = rawColumns.map((col) => typeof col === 'string' ? col.replace(/^"|"$/g, '') : col);
    let whereClause;
    const whereVal = idx.$where || idx.where;
    if (typeof whereVal === 'string') {
        whereClause = whereVal;
    }
    else if (whereVal && typeof whereVal === 'object' && whereVal.$sql) {
        whereClause = whereVal.$sql;
    }
    const includeVal = idx.$include || idx.include;
    const includeColumns = Array.isArray(includeVal) ? includeVal : undefined;
    const commentVal = idx.$comment || idx.comment;
    const comment = typeof commentVal === 'string' ? commentVal : undefined;
    const methodVal = idx.$using || idx.using;
    const method = typeof methodVal === 'string' ? methodVal.toLowerCase() : 'btree';
    return {
        name: idx.$name || idx.name,
        columns,
        isUnique: idx.$unique || idx.unique || false,
        method,
        whereClause,
        includeColumns,
        comment,
        trackingId: extractTrackingId(idx) || idx.trackingId || idx.$name || idx.name,
    };
}
function constraintToAST(con) {
    if (!con)
        return null;
    return {
        name: con.$name || con.name,
        type: (con.$type || con.type || 'CHECK').toUpperCase(),
        columns: con.$columns || con.columns || [],
        expression: con.$expression || con.expression,
        trackingId: extractTrackingId(con),
    };
}
function enumToAST(enumDef) {
    if (!isEnumConfig(enumDef))
        return null;
    return {
        name: enumDef.$enumName,
        schema: enumDef.$schema || 'public',
        values: [...enumDef.$enumValues],
        trackingId: extractTrackingId(enumDef),
    };
}
function domainToAST(domain) {
    if (!isDomainConfig(domain))
        return null;
    let checkExpression;
    let checkName;
    if (domain.$constraints && domain.$constraints.length > 0) {
        const constraint = domain.$constraints[0];
        const namedMatch = constraint.match(/^CONSTRAINT\s+(\w+)\s+CHECK\s*\((.+)\)$/i);
        if (namedMatch) {
            checkName = namedMatch[1];
            checkExpression = namedMatch[2];
        }
        else {
            const simpleMatch = constraint.match(/^CHECK\s*\((.+)\)$/i);
            if (simpleMatch) {
                checkExpression = simpleMatch[1];
            }
        }
    }
    return {
        name: domain.$domainName,
        schema: domain.$schema || 'public',
        baseType: domain.$baseType,
        notNull: domain.$notNull || false,
        defaultValue: domain.$domainDefault?.toString(),
        checkExpression,
        checkName,
        trackingId: extractTrackingId(domain),
    };
}
function compositeToAST(composite) {
    if (!isCompositeConfig(composite))
        return null;
    const attributes = [];
    for (const [fieldName, fieldDef] of Object.entries(composite.$fields || {})) {
        const config = fieldDef.$config || fieldDef;
        attributes.push({
            name: fieldName,
            type: config.$sqlType || (typeof config.$type === 'string' ? config.$type : null) || 'text',
            collation: config.$collation,
        });
    }
    return {
        name: composite.$typeName,
        schema: composite.$schema || 'public',
        attributes,
        trackingId: extractTrackingId(composite),
    };
}
function sequenceToAST(seq) {
    if (!isSequenceConfig(seq))
        return null;
    return {
        name: seq.name,
        schema: seq.schema || 'public',
        startValue: seq.options?.start,
        increment: seq.options?.increment,
        minValue: seq.options?.minValue,
        maxValue: seq.options?.maxValue,
        cache: seq.options?.cache,
        cycle: seq.options?.cycle || false,
        ownedBy: seq.options?.ownedBy,
        trackingId: extractTrackingId(seq),
    };
}
function viewToAST(view) {
    if (!isViewConfig(view))
        return null;
    return {
        name: view.name,
        schema: view.schema || 'public',
        definition: view.definition,
        isMaterialized: false,
        trackingId: extractTrackingId(view),
    };
}
function materializedViewToAST(matView) {
    if (!isMaterializedViewConfig(matView))
        return null;
    return {
        name: matView.name,
        schema: matView.schema || 'public',
        definition: matView.definition,
        isMaterialized: true,
        withData: matView.withData,
        trackingId: extractTrackingId(matView),
    };
}
function functionToAST(func) {
    if (!isFunctionConfig(func))
        return null;
    const opts = func.$options || {};
    return {
        name: func.$functionName,
        schema: opts.schema || 'public',
        args: (opts.args || []).map((arg) => ({
            name: arg.name,
            type: arg.type,
            mode: arg.mode,
            default: arg.default,
        })),
        returnType: opts.returns || 'void',
        language: opts.language || 'plpgsql',
        body: opts.body || '',
        volatility: opts.volatility?.toUpperCase(),
        isStrict: opts.strict || false,
        securityDefiner: opts.securityDefiner || false,
        trackingId: extractTrackingId(func),
    };
}
function triggerToAST(trigger) {
    if (!isTriggerConfig(trigger))
        return null;
    const opts = trigger.$options || {};
    return {
        name: trigger.$triggerName,
        table: opts.table || '',
        timing: (opts.timing || 'BEFORE').toUpperCase(),
        events: (opts.events || ['INSERT']).map((e) => e.toUpperCase()),
        forEach: (opts.forEach || 'ROW').toUpperCase(),
        functionName: opts.execute || '',
        whenClause: opts.when,
        isConstraint: opts.constraint || false,
        deferrable: opts.deferrable,
        initiallyDeferred: opts.initiallyDeferred,
        trackingId: extractTrackingId(trigger),
    };
}
function parsedColumnToColumnInfo(col) {
    return {
        name: col.name,
        dataType: col.isArray ? `${col.type}[]` : col.type,
        isNullable: col.isNullable,
        defaultValue: col.defaultValue || null,
        isPrimaryKey: col.isPrimaryKey,
        isUnique: col.isUnique,
        maxLength: col.typeParams?.length || null,
        precision: col.typeParams?.precision || null,
        scale: col.typeParams?.scale || null,
        references: col.references ? {
            table: col.references.table,
            column: col.references.column,
            onDelete: col.references.onDelete,
            onUpdate: col.references.onUpdate,
        } : null,
        comment: col.comment,
        isGenerated: col.isGenerated,
        generationExpression: col.generatedExpression || null,
        trackingId: col.trackingId,
    };
}
function parsedIndexToIndexInfo(idx) {
    return {
        name: idx.name,
        columns: idx.columns,
        isUnique: idx.isUnique,
        isPrimary: false,
        type: idx.method || 'btree',
        whereClause: idx.whereClause || null,
        comment: idx.comment || null,
        trackingId: idx.trackingId,
    };
}
function parsedConstraintToConstraintInfo(con) {
    let definition = '';
    if (con.type === 'CHECK' && con.expression) {
        definition = `CHECK (${con.expression})`;
    }
    else if (con.type === 'PRIMARY KEY') {
        definition = `PRIMARY KEY (${con.columns.map(c => `"${c}"`).join(', ')})`;
    }
    else if (con.type === 'UNIQUE') {
        definition = `UNIQUE (${con.columns.map(c => `"${c}"`).join(', ')})`;
    }
    else if (con.type === 'FOREIGN KEY' && con.references) {
        const refCols = con.references.columns.map(c => `"${c}"`).join(', ');
        definition = `FOREIGN KEY (${con.columns.map(c => `"${c}"`).join(', ')}) REFERENCES "${con.references.table}" (${refCols})`;
        if (con.references.onDelete) {
            definition += ` ON DELETE ${con.references.onDelete}`;
        }
        if (con.references.onUpdate) {
            definition += ` ON UPDATE ${con.references.onUpdate}`;
        }
    }
    return {
        name: con.name,
        type: con.type,
        columns: con.columns,
        definition,
        referencedTable: con.references?.table,
        referencedColumns: con.references?.columns,
        checkExpression: con.expression,
        trackingId: con.trackingId,
    };
}
function parsedTableToTableInfo(table) {
    return {
        name: table.name,
        schema: table.schema || 'public',
        columns: table.columns.map(parsedColumnToColumnInfo),
        indexes: table.indexes.map(parsedIndexToIndexInfo),
        constraints: table.constraints.map(parsedConstraintToConstraintInfo),
        rowCount: 0,
        isPartitioned: table.isPartitioned,
        partitionType: table.partitionType,
        partitionKey: table.partitionKey,
        comment: table.comment,
        trackingId: table.trackingId,
    };
}
