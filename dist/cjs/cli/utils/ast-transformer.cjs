"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deparse = exports.parse = void 0;
exports.parseExpressionToAst = parseExpressionToAst;
exports.parseSQL = parseSQL;
exports.deparseSchema = deparseSchema;
exports.introspectedToParsedSchema = introspectedToParsedSchema;
exports.normalizedToParsedSchema = normalizedToParsedSchema;
const pgsql_parser_1 = require("pgsql-parser");
Object.defineProperty(exports, "parse", { enumerable: true, get: function () { return pgsql_parser_1.parse; } });
const pgsql_deparser_1 = require("pgsql-deparser");
Object.defineProperty(exports, "deparse", { enumerable: true, get: function () { return pgsql_deparser_1.deparse; } });
function extractTypeName(typeName) {
    if (!typeName)
        return { name: 'text', isArray: false };
    const names = typeName.names?.map((n) => n.String?.sval).filter(Boolean) || [];
    let name = names.length > 1 ? names[names.length - 1] : names[0] || 'text';
    if (names[0] === 'pg_catalog') {
        name = names[1] || 'text';
    }
    const isArray = (typeName.arrayBounds?.length ?? 0) > 0;
    const arrayDims = typeName.arrayBounds?.length;
    let params;
    if (typeName.typmods && typeName.typmods.length > 0) {
        const mods = typeName.typmods.map((m) => {
            if (m.A_Const?.ival?.ival !== undefined)
                return m.A_Const.ival.ival;
            if (m.A_Const?.sval?.sval !== undefined)
                return m.A_Const.sval.sval;
            return undefined;
        }).filter((v) => v !== undefined);
        if (mods.length === 1) {
            if (['varchar', 'character varying', 'char', 'character', 'bit', 'varbit'].includes(name.toLowerCase())) {
                params = { length: mods[0] };
            }
            else {
                params = { precision: mods[0] };
            }
        }
        else if (mods.length === 2) {
            params = { precision: mods[0], scale: mods[1] };
        }
    }
    return { name, params, isArray, arrayDims };
}
function extractConstraintType(contype) {
    const types = {
        0: 'NULL',
        1: 'NOT NULL',
        2: 'DEFAULT',
        3: 'IDENTITY',
        4: 'GENERATED',
        5: 'CHECK',
        6: 'PRIMARY KEY',
        7: 'UNIQUE',
        8: 'EXCLUSION',
        9: 'FOREIGN KEY',
    };
    return types[contype] || 'UNKNOWN';
}
function extractFkAction(action) {
    if (!action)
        return undefined;
    const actions = {
        'a': 'NO ACTION',
        'r': 'RESTRICT',
        'c': 'CASCADE',
        'n': 'SET NULL',
        'd': 'SET DEFAULT',
    };
    return actions[action];
}
function extractFkMatch(matchType) {
    if (!matchType)
        return undefined;
    const matches = {
        's': 'SIMPLE',
        'f': 'FULL',
    };
    return matches[matchType];
}
async function parseForeignKeyDefinition(definition) {
    try {
        const wrappedSQL = `CREATE TABLE _fk_parse_temp (dummy int, ${definition});`;
        const result = await (0, pgsql_parser_1.parse)(wrappedSQL);
        const createStmt = result.stmts?.[0]?.stmt?.CreateStmt;
        if (!createStmt)
            return null;
        for (const elt of createStmt.tableElts || []) {
            const constraint = elt?.Constraint;
            if (constraint && constraint.contype === 'CONSTR_FOREIGN') {
                const pktable = constraint.pktable;
                const pkColumns = (constraint.pk_attrs || [])
                    .map((a) => a.String?.sval)
                    .filter(Boolean);
                return {
                    table: pktable?.relname || '',
                    columns: pkColumns,
                    onDelete: extractFkAction(constraint.fk_del_action),
                    onUpdate: extractFkAction(constraint.fk_upd_action),
                    match: extractFkMatch(constraint.fk_matchtype),
                    deferrable: constraint.deferrable ?? false,
                    initiallyDeferred: constraint.initdeferred ?? false,
                };
            }
        }
        return null;
    }
    catch {
        return null;
    }
}
async function parseExpressionToAst(expr) {
    try {
        const sql = `SELECT ${expr};`;
        const result = await (0, pgsql_parser_1.parse)(sql);
        const selectStmt = result.stmts?.[0]?.stmt?.SelectStmt;
        if (!selectStmt)
            return null;
        const resTarget = selectStmt.targetList?.[0]?.ResTarget;
        if (!resTarget)
            return null;
        return resTarget.val || null;
    }
    catch {
        return null;
    }
}
async function deparseNode(node) {
    try {
        const result = await (0, pgsql_deparser_1.deparse)([node]);
        return result.trim();
    }
    catch {
        return '';
    }
}
async function parseColumnDef(colDef) {
    const typeInfo = extractTypeName(colDef.typeName);
    const colName = colDef.colname || '';
    const column = {
        name: colName,
        tsName: colName,
        type: typeInfo.name,
        typeParams: typeInfo.params,
        isNullable: true,
        isPrimaryKey: false,
        isUnique: false,
        hasDefault: false,
        isGenerated: false,
        isArray: typeInfo.isArray,
        arrayDimensions: typeInfo.arrayDims,
    };
    if (colDef.constraints) {
        for (const c of colDef.constraints) {
            const constraint = c.Constraint;
            if (!constraint)
                continue;
            const contype = constraint.contype;
            switch (contype) {
                case 'CONSTR_NOTNULL':
                    column.isNullable = false;
                    break;
                case 'CONSTR_DEFAULT':
                    column.hasDefault = true;
                    if (constraint.raw_expr) {
                        column.defaultValue = await deparseNode(constraint.raw_expr);
                    }
                    break;
                case 'CONSTR_GENERATED':
                    column.isGenerated = true;
                    if (constraint.raw_expr) {
                        column.generatedExpression = await deparseNode(constraint.raw_expr);
                        column.generatedExpressionAst = constraint.raw_expr;
                    }
                    break;
                case 'CONSTR_CHECK':
                    if (constraint.raw_expr) {
                        column.checkConstraint = {
                            name: constraint.conname || '',
                            expression: await deparseNode(constraint.raw_expr),
                            expressionAst: constraint.raw_expr,
                        };
                    }
                    break;
                case 'CONSTR_PRIMARY':
                    column.isPrimaryKey = true;
                    column.isNullable = false;
                    break;
                case 'CONSTR_UNIQUE':
                    column.isUnique = true;
                    break;
                case 'CONSTR_FOREIGN':
                    const pktable = constraint.pktable;
                    const pkColumns = (constraint.pk_attrs || []).map((a) => a.String?.sval).filter(Boolean);
                    column.references = {
                        table: pktable?.relname || '',
                        column: pkColumns[0] || '',
                        onDelete: extractFkAction(constraint.fk_del_action),
                        onUpdate: extractFkAction(constraint.fk_upd_action),
                        match: extractFkMatch(constraint.fk_matchtype),
                        deferrable: constraint.deferrable ?? false,
                        initiallyDeferred: constraint.initdeferred ?? false,
                    };
                    break;
            }
        }
    }
    return column;
}
async function parseTableConstraint(constraint) {
    const c = constraint.Constraint;
    if (!c)
        return null;
    const contype = c.contype;
    const columns = (c.keys || []).map((k) => k.String?.sval).filter(Boolean);
    const result = {
        name: c.conname || '',
        type: 'CHECK',
        columns,
    };
    switch (contype) {
        case 'CONSTR_CHECK':
            result.type = 'CHECK';
            if (c.raw_expr) {
                result.expression = await deparseNode(c.raw_expr);
                result.expressionAst = c.raw_expr;
            }
            break;
        case 'CONSTR_PRIMARY':
            result.type = 'PRIMARY KEY';
            break;
        case 'CONSTR_UNIQUE':
            result.type = 'UNIQUE';
            break;
        case 'CONSTR_EXCLUSION':
            result.type = 'EXCLUDE';
            if (c.exclusions) {
                result.expression = await deparseNode({ exclusions: c.exclusions });
            }
            break;
        case 'CONSTR_FOREIGN':
            result.type = 'FOREIGN KEY';
            const pktable = c.pktable;
            const pkColumns = (c.pk_attrs || []).map((a) => a.String?.sval).filter(Boolean);
            result.references = {
                table: pktable?.relname || '',
                columns: pkColumns,
                onDelete: extractFkAction(c.fk_del_action),
                onUpdate: extractFkAction(c.fk_upd_action),
                match: extractFkMatch(c.fk_matchtype),
                deferrable: c.deferrable ?? false,
                initiallyDeferred: c.initdeferred ?? false,
            };
            break;
        default:
            return null;
    }
    return result;
}
async function parseCreateStmt(stmt) {
    const relation = stmt.relation;
    const table = {
        name: relation?.relname || '',
        schema: relation?.schemaname,
        columns: [],
        constraints: [],
        indexes: [],
        isPartitioned: !!stmt.partspec,
    };
    if (stmt.partspec) {
        const partSpec = stmt.partspec;
        const strategy = partSpec.strategy;
        table.partitionType = strategy === 'r' ? 'RANGE' : strategy === 'l' ? 'LIST' : strategy === 'h' ? 'HASH' : undefined;
        table.partitionKey = (partSpec.partParams || []).map((p) => p.PartitionElem?.name).filter(Boolean);
    }
    if (stmt.partbound) {
        table.partitionOf = (stmt.inhRelations || [])[0]?.RangeVar?.relname;
        const partBound = stmt.partbound;
        if (partBound) {
            table.partitionBound = await deparseNode(partBound);
        }
    }
    if (stmt.inhRelations && !stmt.partbound) {
        table.inherits = (stmt.inhRelations || [])
            .map((r) => r.RangeVar?.relname)
            .filter(Boolean);
    }
    for (const elt of stmt.tableElts || []) {
        if (elt.ColumnDef) {
            const col = await parseColumnDef(elt.ColumnDef);
            table.columns.push(col);
        }
        else if (elt.Constraint) {
            const constraint = await parseTableConstraint(elt);
            if (constraint) {
                table.constraints.push(constraint);
            }
        }
    }
    return table;
}
async function parseIndexStmt(stmt) {
    const index = {
        name: stmt.idxname || '',
        columns: [],
        isUnique: stmt.unique || false,
        method: stmt.accessMethod,
    };
    for (const elem of stmt.indexParams || []) {
        const idxElem = elem.IndexElem;
        if (idxElem) {
            if (idxElem.name) {
                index.columns.push(idxElem.name);
            }
            else if (idxElem.expr) {
                index.isExpression = true;
                const expr = await deparseNode(idxElem.expr);
                index.expressions = index.expressions || [];
                index.expressions.push(expr);
                index.columns.push(expr);
            }
            if (idxElem.opclass && idxElem.opclass.length > 0) {
                index.opclass = idxElem.opclass.map((o) => o.String?.sval).filter(Boolean).join('_');
            }
        }
    }
    if (stmt.whereClause) {
        index.whereClause = await deparseNode(stmt.whereClause);
        index.whereClauseAst = stmt.whereClause;
    }
    if (stmt.indexIncludingParams) {
        index.includeColumns = (stmt.indexIncludingParams || [])
            .map((p) => p.IndexElem?.name)
            .filter(Boolean);
    }
    return index;
}
function parseCreateEnumStmt(stmt) {
    const names = (stmt.typeName || []).map((n) => n.String?.sval).filter(Boolean);
    const values = (stmt.vals || []).map((v) => v.String?.sval).filter(Boolean);
    return {
        name: names.length > 1 ? names[1] : names[0] || '',
        schema: names.length > 1 ? names[0] : undefined,
        values,
    };
}
async function parseCreateDomainStmt(stmt) {
    const names = (stmt.domainname || []).map((n) => n.String?.sval).filter(Boolean);
    const typeInfo = extractTypeName(stmt.typeName);
    const domain = {
        name: names.length > 1 ? names[1] : names[0] || '',
        schema: names.length > 1 ? names[0] : undefined,
        baseType: typeInfo.name,
        notNull: false,
    };
    for (const c of stmt.constraints || []) {
        const constraint = c.Constraint;
        if (!constraint)
            continue;
        const contype = constraint.contype;
        if (contype === 1) {
            domain.notNull = true;
        }
        else if (contype === 5 && constraint.raw_expr) {
            domain.checkExpression = await deparseNode(constraint.raw_expr);
            domain.checkName = constraint.conname;
        }
    }
    if (stmt.collClause?.defval) {
        domain.defaultValue = await deparseNode(stmt.collClause.defval);
    }
    return domain;
}
async function parseViewStmt(stmt, isMaterialized = false) {
    const view = stmt.view;
    return {
        name: view?.relname || '',
        schema: view?.schemaname,
        definition: stmt.query ? await deparseNode(stmt.query) : '',
        isMaterialized,
    };
}
async function parseCreateFunctionStmt(stmt) {
    const names = (stmt.funcname || []).map((n) => n.String?.sval).filter(Boolean);
    const func = {
        name: names.length > 1 ? names[1] : names[0] || '',
        schema: names.length > 1 ? names[0] : undefined,
        args: [],
        returnType: '',
        language: 'sql',
        body: '',
        isStrict: false,
        securityDefiner: false,
    };
    for (const param of stmt.parameters || []) {
        const fp = param.FunctionParameter;
        if (fp) {
            const typeInfo = extractTypeName(fp.argType);
            func.args.push({
                name: fp.name,
                type: typeInfo.name,
                mode: fp.mode === 'i' ? 'IN' : fp.mode === 'o' ? 'OUT' : fp.mode === 'b' ? 'INOUT' : undefined,
            });
        }
    }
    if (stmt.returnType) {
        const typeInfo = extractTypeName(stmt.returnType);
        func.returnType = typeInfo.name;
    }
    for (const opt of stmt.options || []) {
        const defElem = opt.DefElem;
        if (!defElem)
            continue;
        if (defElem.defname === 'language') {
            func.language = defElem.arg?.String?.sval || 'sql';
        }
        else if (defElem.defname === 'as') {
            const parts = (defElem.arg || []).map((a) => a.String?.sval).filter(Boolean);
            func.body = parts[0] || '';
        }
        else if (defElem.defname === 'volatility') {
            func.volatility = defElem.arg?.String?.sval?.toUpperCase();
        }
        else if (defElem.defname === 'strict' && defElem.arg?.Boolean?.boolval) {
            func.isStrict = true;
        }
        else if (defElem.defname === 'security' && defElem.arg?.Boolean?.boolval) {
            func.securityDefiner = true;
        }
    }
    return func;
}
function parseCreateTrigStmt(stmt) {
    const events = [];
    if (stmt.events && typeof stmt.events === 'number') {
        if (stmt.events & 4)
            events.push('INSERT');
        if (stmt.events & 8)
            events.push('DELETE');
        if (stmt.events & 16)
            events.push('UPDATE');
        if (stmt.events & 32)
            events.push('TRUNCATE');
    }
    return {
        name: stmt.trigname || '',
        table: stmt.relation?.relname || '',
        timing: stmt.timing === 2 ? 'BEFORE' : stmt.timing === 64 ? 'INSTEAD OF' : 'AFTER',
        events,
        forEach: stmt.row ? 'ROW' : 'STATEMENT',
        functionName: (stmt.funcname || []).map((n) => n.String?.sval).filter(Boolean).join('.'),
        isConstraint: stmt.isconstraint || false,
        deferrable: stmt.deferrable,
        initiallyDeferred: stmt.initdeferred,
    };
}
function parseCreateSeqStmt(stmt) {
    const relation = stmt.sequence;
    const seq = {
        name: relation?.relname || '',
        schema: relation?.schemaname,
        cycle: false,
    };
    for (const opt of stmt.options || []) {
        const defElem = opt.DefElem;
        if (!defElem)
            continue;
        const name = defElem.defname;
        const val = defElem.arg?.Integer?.ival ?? defElem.arg?.Float?.fval;
        if (name === 'start')
            seq.startValue = val;
        else if (name === 'increment')
            seq.increment = val;
        else if (name === 'minvalue')
            seq.minValue = val;
        else if (name === 'maxvalue')
            seq.maxValue = val;
        else if (name === 'cache')
            seq.cache = val;
        else if (name === 'cycle')
            seq.cycle = true;
    }
    return seq;
}
async function parseSQL(sql) {
    const result = await (0, pgsql_parser_1.parse)(sql);
    const schema = {
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
    for (const stmtWrapper of result.stmts || []) {
        const stmt = stmtWrapper.stmt;
        if (!stmt)
            continue;
        const stmtType = Object.keys(stmt)[0];
        const stmtBody = stmt[stmtType];
        try {
            switch (stmtType) {
                case 'CreateStmt':
                    const table = await parseCreateStmt(stmtBody);
                    schema.tables.push(table);
                    break;
                case 'IndexStmt':
                    const index = await parseIndexStmt(stmtBody);
                    const tableName = stmtBody.relation?.relname;
                    const targetTable = schema.tables.find(t => t.name === tableName);
                    if (targetTable) {
                        targetTable.indexes.push(index);
                    }
                    break;
                case 'CreateEnumStmt':
                    schema.enums.push(parseCreateEnumStmt(stmtBody));
                    break;
                case 'CreateDomainStmt':
                    schema.domains.push(await parseCreateDomainStmt(stmtBody));
                    break;
                case 'ViewStmt':
                    schema.views.push(await parseViewStmt(stmtBody, false));
                    break;
                case 'CreateTableAsStmt':
                    if (stmtBody.objtype === 1) {
                        const mv = await parseViewStmt(stmtBody, true);
                        schema.views.push(mv);
                    }
                    break;
                case 'CreateFunctionStmt':
                    schema.functions.push(await parseCreateFunctionStmt(stmtBody));
                    break;
                case 'CreateTrigStmt':
                    schema.triggers.push(parseCreateTrigStmt(stmtBody));
                    break;
                case 'CreateSeqStmt':
                    schema.sequences.push(parseCreateSeqStmt(stmtBody));
                    break;
                case 'CreateExtensionStmt':
                    schema.extensions.push(stmtBody.extname || '');
                    break;
            }
        }
        catch (error) {
            console.error(`Failed to parse ${stmtType}:`, error);
        }
    }
    return schema;
}
async function deparseSchema(schema) {
    const parts = [];
    for (const ext of schema.extensions) {
        parts.push(`CREATE EXTENSION IF NOT EXISTS "${ext}";`);
    }
    return parts.join('\n\n');
}
async function introspectedToParsedSchema(schema) {
    const parsed = {
        tables: [],
        enums: [],
        domains: [],
        compositeTypes: [],
        sequences: [],
        views: [],
        functions: [],
        triggers: [],
        extensions: schema.extensions || [],
    };
    for (const e of schema.enums || []) {
        parsed.enums.push({
            name: e.name,
            values: e.values,
        });
    }
    for (const d of schema.domains || []) {
        parsed.domains.push({
            name: d.name,
            baseType: d.baseType,
            notNull: d.isNotNull || false,
            defaultValue: d.defaultValue,
            checkExpression: d.checkExpression,
        });
    }
    for (const ct of schema.compositeTypes || []) {
        parsed.compositeTypes.push({
            name: ct.name,
            attributes: ct.attributes.map(attr => ({
                name: attr.name,
                type: attr.type,
            })),
        });
    }
    for (const s of schema.sequences || []) {
        let ownedBy;
        if (s.ownedBy) {
            const parts = s.ownedBy.split('.');
            if (parts.length === 2) {
                ownedBy = { table: parts[0], column: parts[1] };
            }
        }
        parsed.sequences.push({
            name: s.name,
            startValue: s.start,
            increment: s.increment,
            minValue: s.minValue,
            maxValue: s.maxValue,
            cache: s.cache,
            cycle: s.cycle || false,
            ownedBy,
        });
    }
    for (const t of schema.tables || []) {
        const columns = [];
        for (const c of t.columns) {
            const col = {
                name: c.name,
                tsName: c.name,
                type: normalizeTypeName(c.dataType, c.udtName),
                typeParams: extractTypeParams(c),
                isNullable: c.isNullable,
                isPrimaryKey: c.isPrimaryKey || false,
                isUnique: c.isUnique || false,
                hasDefault: c.defaultValue != null,
                defaultValue: c.defaultValue || undefined,
                isGenerated: c.isGenerated || false,
                generatedExpression: c.generationExpression || undefined,
                isArray: c.dataType.endsWith('[]') || c.dataType === 'ARRAY' || c.dataType.startsWith('_'),
                comment: c.comment,
            };
            if (c.isGenerated && c.generationExpression) {
                const ast = await parseExpressionToAst(c.generationExpression);
                if (ast) {
                    col.generatedExpressionAst = ast;
                }
            }
            if (c.references) {
                col.references = {
                    table: c.references.table,
                    column: c.references.column,
                    onDelete: c.references.onDelete,
                    onUpdate: c.references.onUpdate,
                };
            }
            columns.push(col);
        }
        const constraints = [];
        const processedConstraints = new Set();
        for (const c of t.constraints || []) {
            if (processedConstraints.has(c.name))
                continue;
            processedConstraints.add(c.name);
            const constraint = {
                name: c.name,
                type: c.type,
                columns: c.columns || extractColumnsFromDefinition(c.definition),
            };
            if (c.type === 'CHECK') {
                constraint.expression = extractCheckExpression(c.definition);
            }
            if (c.type === 'EXCLUDE') {
                constraint.expression = extractExcludeExpression(c.definition);
            }
            if (c.type === 'FOREIGN KEY' && c.definition) {
                try {
                    const fkAst = await parseForeignKeyDefinition(c.definition);
                    if (fkAst) {
                        constraint.references = fkAst;
                    }
                }
                catch {
                    const fkMatch = c.definition.match(/REFERENCES\s+"?(\w+)"?\s*\(([^)]+)\)/i);
                    if (fkMatch) {
                        const refColumns = fkMatch[2].split(',').map(s => s.trim().replace(/^"|"$/g, ''));
                        constraint.references = {
                            table: fkMatch[1],
                            columns: refColumns,
                        };
                        const onDeleteMatch = c.definition.match(/ON DELETE\s+(\w+(?:\s+\w+)?)/i);
                        const onUpdateMatch = c.definition.match(/ON UPDATE\s+(\w+(?:\s+\w+)?)/i);
                        if (onDeleteMatch)
                            constraint.references.onDelete = onDeleteMatch[1].toUpperCase();
                        if (onUpdateMatch)
                            constraint.references.onUpdate = onUpdateMatch[1].toUpperCase();
                    }
                }
            }
            constraints.push(constraint);
        }
        const indexes = (t.indexes || [])
            .filter(i => !i.isPrimary)
            .map(i => {
            let cols;
            if (Array.isArray(i.columns)) {
                cols = i.columns;
            }
            else if (typeof i.columns === 'string') {
                cols = i.columns.replace(/^\{|\}$/g, '').split(',').filter(Boolean);
            }
            else {
                cols = [];
            }
            return {
                name: i.name,
                columns: cols,
                isUnique: i.isUnique,
                method: i.type,
                whereClause: i.whereClause,
            };
        });
        parsed.tables.push({
            name: t.name,
            schema: t.schema,
            columns,
            constraints,
            indexes,
            isPartitioned: t.isPartitioned || false,
            partitionType: t.partitionType,
            partitionKey: t.partitionKey,
            comment: t.comment,
            childPartitions: t.childPartitions,
        });
    }
    for (const f of schema.functions || []) {
        parsed.functions.push({
            name: f.name,
            args: parseArgTypes(f.argTypes),
            returnType: f.returnType,
            language: f.language,
            body: extractFunctionBody(f.definition || ''),
            volatility: f.volatility,
            isStrict: false,
            securityDefiner: false,
            comment: f.comment,
        });
    }
    for (const t of schema.triggers || []) {
        parsed.triggers.push({
            name: t.name,
            table: t.tableName,
            timing: t.timing,
            events: [t.event],
            forEach: t.forEach || 'ROW',
            functionName: t.functionName || '',
            isConstraint: false,
            comment: t.comment,
        });
    }
    const isInternal = (name) => name.startsWith('_relq_') || name.startsWith('__relq_');
    parsed.tables = parsed.tables.filter(t => !isInternal(t.name));
    parsed.sequences = parsed.sequences.filter(s => {
        if (isInternal(s.name))
            return false;
        if (s.ownedBy && isInternal(s.ownedBy.table))
            return false;
        return true;
    });
    parsed.triggers = parsed.triggers.filter(t => !isInternal(t.table));
    return parsed;
}
function normalizeTypeName(dataType, udtName) {
    const type = dataType.replace('[]', '').toLowerCase();
    const typeMap = {
        'character varying': 'varchar',
        'character': 'char',
        'integer': 'integer',
        'bigint': 'bigint',
        'smallint': 'smallint',
        'boolean': 'boolean',
        'text': 'text',
        'timestamp with time zone': 'timestamptz',
        'timestamp without time zone': 'timestamp',
        'date': 'date',
        'time with time zone': 'timetz',
        'time without time zone': 'time',
        'jsonb': 'jsonb',
        'json': 'json',
        'uuid': 'uuid',
        'numeric': 'numeric',
        'real': 'real',
        'double precision': 'double precision',
        'bytea': 'bytea',
        'inet': 'inet',
        'cidr': 'cidr',
        'macaddr': 'macaddr',
        'tsvector': 'tsvector',
        'tsquery': 'tsquery',
        '_text': 'text',
        '_jsonb': 'jsonb',
        '_json': 'json',
        '_int4': 'integer',
        '_int8': 'bigint',
        '_int2': 'smallint',
        '_bool': 'boolean',
        '_float4': 'real',
        '_float8': 'double precision',
        '_numeric': 'numeric',
        '_varchar': 'varchar',
        '_char': 'char',
        '_uuid': 'uuid',
        '_bytea': 'bytea',
        '_date': 'date',
        '_timestamp': 'timestamp',
        '_timestamptz': 'timestamptz',
        '_time': 'time',
        '_timetz': 'timetz',
        '_inet': 'inet',
        '_cidr': 'cidr',
        '_macaddr': 'macaddr',
        '_tsvector': 'tsvector',
        '_tsquery': 'tsquery',
    };
    return typeMap[type] || udtName || type;
}
function extractTypeParams(col) {
    if (col.maxLength)
        return { length: col.maxLength };
    if (col.precision != null)
        return { precision: col.precision, scale: col.scale || undefined };
    return undefined;
}
function extractColumnsFromDefinition(definition) {
    const match = definition.match(/\(([^)]+)\)/);
    if (!match)
        return [];
    return match[1].split(',').map(c => c.trim().replace(/"/g, ''));
}
function extractCheckExpression(definition) {
    const match = definition.match(/CHECK\s*\((.+)\)/i);
    return match ? match[1] : definition;
}
function extractExcludeExpression(definition) {
    const excludeMatch = definition.match(/EXCLUDE\s+(.+)$/is);
    return excludeMatch ? excludeMatch[1].trim() : definition;
}
function parseArgTypes(argTypes) {
    if (!argTypes)
        return [];
    const parts = Array.isArray(argTypes) ? argTypes : argTypes.split(',');
    return parts.map(arg => {
        const trimmed = typeof arg === 'string' ? arg.trim() : String(arg);
        if (!trimmed)
            return { type: '' };
        const firstSpace = trimmed.indexOf(' ');
        if (firstSpace === -1) {
            return { type: trimmed };
        }
        const firstPart = trimmed.substring(0, firstSpace);
        const restPart = trimmed.substring(firstSpace + 1).trim();
        const commonTypeStarts = ['integer', 'bigint', 'smallint', 'text', 'varchar', 'char', 'boolean',
            'timestamp', 'date', 'time', 'interval', 'numeric', 'decimal', 'real', 'double', 'uuid',
            'json', 'jsonb', 'bytea', 'inet', 'cidr', 'macaddr', 'point', 'line', 'circle', 'box',
            'tsvector', 'tsquery', 'void', 'trigger', 'record', 'setof', 'array'];
        const lowerFirst = firstPart.toLowerCase();
        if (commonTypeStarts.some(t => lowerFirst === t || lowerFirst.startsWith(t + '['))) {
            return { type: trimmed };
        }
        return { name: firstPart, type: restPart };
    }).filter(arg => arg.type !== '');
}
function extractFunctionBody(definition) {
    if (!definition)
        return '';
    const bodyMatch = definition.match(/AS\s+\$([a-zA-Z_]*)\$\s*([\s\S]*?)\s*\$\1\$/i);
    if (bodyMatch) {
        return bodyMatch[2].trim();
    }
    const singleQuoteMatch = definition.match(/AS\s+'([\s\S]*?)'\s*$/i);
    if (singleQuoteMatch) {
        return singleQuoteMatch[1].replace(/''/g, "'");
    }
    return '';
}
function normalizedToParsedSchema(schema) {
    return {
        extensions: (schema.extensions || []).map(e => typeof e === 'string' ? e : e.name),
        enums: (schema.enums || []).map(e => ({
            name: e.name,
            schema: e.schema,
            values: e.values,
        })),
        domains: (schema.domains || []).map(d => ({
            name: d.name,
            baseType: d.baseType,
            notNull: d.notNull ?? false,
            defaultValue: d.default,
            checkExpression: d.check,
            checkName: d.checkName,
        })),
        compositeTypes: [],
        sequences: (schema.sequences || []).map(s => ({
            name: s.name,
            startValue: s.start,
            increment: s.increment,
            minValue: s.minValue,
            maxValue: s.maxValue,
            cache: s.cache,
            cycle: s.cycle ?? false,
        })),
        tables: schema.tables.map(t => ({
            name: t.name,
            schema: t.schema,
            columns: t.columns.map(c => {
                const isArray = c.type.endsWith('[]');
                const baseType = isArray ? c.type.slice(0, -2) : c.type;
                return {
                    name: c.name,
                    tsName: c.name,
                    type: baseType,
                    isNullable: c.nullable ?? true,
                    isPrimaryKey: c.primaryKey ?? false,
                    isUnique: c.unique ?? false,
                    hasDefault: c.default != null,
                    defaultValue: c.default ?? undefined,
                    isGenerated: c.isGenerated ?? false,
                    generatedExpression: c.generatedExpression ?? undefined,
                    generatedExpressionAst: c.generatedExpressionAst ?? undefined,
                    isArray,
                    checkConstraint: c.check ? { name: c.checkName || `check_${c.name}`, expression: c.check } : undefined,
                    references: c.references,
                    comment: c.comment,
                };
            }),
            constraints: (t.constraints || []).map(c => ({
                name: c.name,
                type: c.type,
                columns: c.columns || [],
                expression: c.definition,
                references: c.references ? {
                    table: c.references.table,
                    columns: c.references.columns,
                    onDelete: c.references.onDelete,
                    onUpdate: c.references.onUpdate,
                    match: c.references.match,
                    deferrable: c.references.deferrable,
                    initiallyDeferred: c.references.initiallyDeferred,
                } : undefined,
            })),
            indexes: t.indexes.map(i => {
                let cols;
                if (Array.isArray(i.columns)) {
                    cols = i.columns;
                }
                else if (typeof i.columns === 'string') {
                    cols = i.columns.replace(/^\{|\}$/g, '').split(',').filter(Boolean);
                }
                else {
                    cols = [];
                }
                return {
                    name: i.name,
                    columns: cols,
                    isUnique: i.unique ?? false,
                    method: i.type,
                    whereClause: i.whereClause,
                    whereClauseAst: i.whereClauseAst,
                };
            }),
            isPartitioned: t.isPartitioned ?? false,
            partitionType: t.partitionType,
            partitionKey: t.partitionKey,
            comment: t.comment,
        })),
        views: (schema.views || []).map(v => ({
            name: v.name,
            definition: v.definition,
            isMaterialized: v.isMaterialized ?? false,
        })),
        functions: (schema.functions || []).map(f => ({
            name: f.name,
            schema: f.schema,
            args: f.args || [],
            returnType: f.returnType || 'void',
            language: f.language || 'plpgsql',
            body: f.body || '',
            volatility: f.volatility || 'VOLATILE',
            isStrict: f.isStrict ?? false,
            securityDefiner: f.securityDefiner ?? false,
            comment: f.comment,
            trackingId: f.trackingId,
        })),
        triggers: (schema.triggers || []).map(t => ({
            name: t.name,
            table: t.table,
            timing: t.timing || 'AFTER',
            events: t.events || ['INSERT'],
            forEach: t.level || 'ROW',
            functionName: t.functionName || '',
            whenClause: t.when,
            isConstraint: false,
            comment: t.comment,
            trackingId: t.trackingId,
        })),
    };
}
