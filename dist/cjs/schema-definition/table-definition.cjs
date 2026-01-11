"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.defineTable = defineTable;
const pg_format_1 = __importDefault(require("../addon/pg-format/index.cjs"));
const column_types_1 = require("./column-types.cjs");
const partitions_1 = require("./partitions.cjs");
const sql_expressions_1 = require("./sql-expressions.cjs");
const schema_to_ast_1 = require("../cli/utils/schema-to-ast.cjs");
function formatWhereValue(val) {
    if (val === null)
        return 'NULL';
    if (typeof val === 'number')
        return String(val);
    if (typeof val === 'boolean')
        return val ? 'TRUE' : 'FALSE';
    if (typeof val === 'string')
        return `'${val.replace(/'/g, "''")}'`;
    if (val && typeof val === 'object' && '$sql' in val)
        return val.$sql;
    return String(val);
}
function whereCondition(sql) {
    return {
        $sql: sql,
        $expr: true,
        and(other) {
            return whereCondition(`(${this.$sql}) AND (${other.$sql})`);
        },
        or(other) {
            return whereCondition(`(${this.$sql}) OR (${other.$sql})`);
        },
    };
}
function createColumnExpr(colName) {
    const sql = colName.startsWith('"') ? colName : `"${colName}"`;
    const self = {
        $sql: sql,
        $expr: true,
        eq(value) {
            return whereCondition(`${this.$sql} = ${formatWhereValue(value)}`);
        },
        neq(value) {
            return whereCondition(`${this.$sql} != ${formatWhereValue(value)}`);
        },
        ne(value) {
            return whereCondition(`${this.$sql} <> ${formatWhereValue(value)}`);
        },
        gt(value) {
            return whereCondition(`${this.$sql} > ${formatWhereValue(value)}`);
        },
        gte(value) {
            return whereCondition(`${this.$sql} >= ${formatWhereValue(value)}`);
        },
        lt(value) {
            return whereCondition(`${this.$sql} < ${formatWhereValue(value)}`);
        },
        lte(value) {
            return whereCondition(`${this.$sql} <= ${formatWhereValue(value)}`);
        },
        isNull() {
            return whereCondition(`${this.$sql} IS NULL`);
        },
        isNotNull() {
            return whereCondition(`${this.$sql} IS NOT NULL`);
        },
        in(values) {
            return whereCondition(`${this.$sql} IN (${values.map(formatWhereValue).join(', ')})`);
        },
        notIn(values) {
            return whereCondition(`${this.$sql} NOT IN (${values.map(formatWhereValue).join(', ')})`);
        },
        between(min, max) {
            return whereCondition(`${this.$sql} BETWEEN ${formatWhereValue(min)} AND ${formatWhereValue(max)}`);
        },
        like(pattern) {
            return whereCondition(`${this.$sql} LIKE '${pattern.replace(/'/g, "''")}'`);
        },
        ilike(pattern) {
            return whereCondition(`${this.$sql} ILIKE '${pattern.replace(/'/g, "''")}'`);
        },
        plus(value) {
            const valSql = typeof value === 'number' ? String(value) : value.$sql;
            return createColumnExprFromSql(`(${this.$sql} + ${valSql})`);
        },
        minus(value) {
            const valSql = typeof value === 'number' ? String(value) : value.$sql;
            return createColumnExprFromSql(`(${this.$sql} - ${valSql})`);
        },
    };
    return self;
}
function createColumnExprFromSql(sql) {
    const expr = createColumnExpr('dummy');
    expr.$sql = sql;
    return expr;
}
function createIndexWhereBuilder() {
    return {
        col(name) {
            const colName = String(name);
            return createColumnExpr(colName);
        },
        eq(col, value) {
            return createColumnExpr(String(col)).eq(value);
        },
        neq(col, value) {
            return createColumnExpr(String(col)).neq(value);
        },
        gt(col, value) {
            return createColumnExpr(String(col)).gt(value);
        },
        gte(col, value) {
            return createColumnExpr(String(col)).gte(value);
        },
        lt(col, value) {
            return createColumnExpr(String(col)).lt(value);
        },
        lte(col, value) {
            return createColumnExpr(String(col)).lte(value);
        },
        isNull(col) {
            return createColumnExpr(String(col)).isNull();
        },
        isNotNull(col) {
            return createColumnExpr(String(col)).isNotNull();
        },
        between(col, min, max) {
            const colName = String(col);
            const sql = colName.startsWith('"') ? colName : `"${colName}"`;
            return whereCondition(`${sql} BETWEEN ${formatWhereValue(min)} AND ${formatWhereValue(max)}`);
        },
        fn: sql_expressions_1.sqlFunctions,
        currentDate() {
            return createColumnExprFromSql('CURRENT_DATE');
        },
        currentTimestamp() {
            return createColumnExprFromSql('CURRENT_TIMESTAMP');
        },
        now() {
            return createColumnExprFromSql('NOW()');
        },
        interval(value) {
            return { $sql: `INTERVAL '${value}'`, $expr: true };
        },
    };
}
function createCheckExpr(sql) {
    const formatVal = (val) => {
        if (val === null)
            return 'NULL';
        if (typeof val === 'number')
            return String(val);
        if (typeof val === 'boolean')
            return val ? 'TRUE' : 'FALSE';
        if (typeof val === 'string')
            return `'${val.replace(/'/g, "''")}'`;
        if (val && typeof val === 'object' && '$sql' in val)
            return val.$sql;
        return String(val);
    };
    const expr = {
        $sql: sql,
        $expr: true,
        gte(value) {
            return createCheckWhereCondition(`${this.$sql} >= ${formatVal(value)}`);
        },
        lte(value) {
            return createCheckWhereCondition(`${this.$sql} <= ${formatVal(value)}`);
        },
        gt(value) {
            return createCheckWhereCondition(`${this.$sql} > ${formatVal(value)}`);
        },
        lt(value) {
            return createCheckWhereCondition(`${this.$sql} < ${formatVal(value)}`);
        },
        eq(value) {
            return createCheckWhereCondition(`${this.$sql} = ${formatVal(value)}`);
        },
        neq(value) {
            return createCheckWhereCondition(`${this.$sql} != ${formatVal(value)}`);
        },
        ne(value) {
            return createCheckWhereCondition(`${this.$sql} <> ${formatVal(value)}`);
        },
        isNull() {
            return createCheckWhereCondition(`${this.$sql} IS NULL`);
        },
        isNotNull() {
            return createCheckWhereCondition(`${this.$sql} IS NOT NULL`);
        },
        in(values) {
            return createCheckWhereCondition(`${this.$sql} IN (${values.map(formatVal).join(', ')})`);
        },
        notIn(values) {
            return createCheckWhereCondition(`${this.$sql} NOT IN (${values.map(formatVal).join(', ')})`);
        },
        between(min, max) {
            return createCheckWhereCondition(`${this.$sql} BETWEEN ${formatVal(min)} AND ${formatVal(max)}`);
        },
        like(pattern) {
            return createCheckWhereCondition(`${this.$sql} LIKE '${pattern.replace(/'/g, "''")}'`);
        },
        ilike(pattern) {
            return createCheckWhereCondition(`${this.$sql} ILIKE '${pattern.replace(/'/g, "''")}'`);
        },
        matches(pattern) {
            return createCheckWhereCondition(`${this.$sql} ~ '${pattern.replace(/'/g, "''")}'`);
        },
        matchesInsensitive(pattern) {
            return createCheckWhereCondition(`${this.$sql} ~* '${pattern.replace(/'/g, "''")}'`);
        },
        plus(value) {
            const valSql = typeof value === 'number' ? String(value) : value.$sql;
            return createCheckExpr(`(${this.$sql} + ${valSql})`);
        },
        minus(value) {
            const valSql = typeof value === 'number' ? String(value) : value.$sql;
            return createCheckExpr(`(${this.$sql} - ${valSql})`);
        },
        times(value) {
            const valSql = typeof value === 'number' ? String(value) : value.$sql;
            return createCheckExpr(`(${this.$sql} * ${valSql})`);
        },
        dividedBy(value) {
            const valSql = typeof value === 'number' ? String(value) : value.$sql;
            return createCheckExpr(`(${this.$sql} / ${valSql})`);
        },
        length() {
            return createCheckExpr(`LENGTH(${this.$sql})`);
        },
        asText() {
            return createCheckExpr(`(${this.$sql})::TEXT`);
        },
        abs() {
            return createCheckExpr(`ABS(${this.$sql})`);
        },
    };
    return expr;
}
function createCheckWhereCondition(sql) {
    return {
        $sql: sql,
        $expr: true,
        and(other) {
            return createCheckWhereCondition(`(${this.$sql}) AND (${other.$sql})`);
        },
        or(other) {
            return createCheckWhereCondition(`(${this.$sql}) OR (${other.$sql})`);
        },
    };
}
function createCheckTableRefs(columns) {
    const refs = {};
    for (const key of Object.keys(columns)) {
        const col = columns[key];
        const colName = col.$columnName || key;
        refs[key] = createCheckExpr(`"${colName}"`);
    }
    return refs;
}
function createCheckConstraintBuilder() {
    return {
        col(name) {
            return createCheckExpr(`"${String(name)}"`);
        },
        constraint(name, condition) {
            return { name, expression: condition.$sql };
        },
        raw(expression) {
            return createCheckWhereCondition(expression);
        },
    };
}
function createConstraintBuilder() {
    return {
        primaryKey(...args) {
            if (args.length === 1 && typeof args[0] === 'object' && args[0] !== null && 'columns' in args[0]) {
                const opts = args[0];
                return {
                    $type: 'PRIMARY KEY',
                    $name: opts.name || '',
                    $columns: opts.columns.map(c => String(c)),
                };
            }
            const columns = args;
            return {
                $type: 'PRIMARY KEY',
                $name: '',
                $columns: columns.map(c => String(c)),
            };
        },
        unique(...args) {
            if (args.length === 1 && typeof args[0] === 'object' && args[0] !== null && 'columns' in args[0]) {
                const opts = args[0];
                return {
                    $type: 'UNIQUE',
                    $name: opts.name || '',
                    $columns: opts.columns.map(c => String(c)),
                };
            }
            const columns = args;
            return {
                $type: 'UNIQUE',
                $name: '',
                $columns: columns.map(c => String(c)),
            };
        },
        exclude(name, expression) {
            return {
                $type: 'EXCLUDE',
                $name: name,
                $columns: [],
                $expression: expression,
            };
        },
    };
}
function createColumnRefs(columns) {
    const refs = {};
    for (const key of Object.keys(columns)) {
        const col = columns[key];
        const colName = col.$columnName || key;
        refs[key] = colName;
    }
    return refs;
}
function createIndexTableRefs(columns) {
    const refs = {};
    for (const key of Object.keys(columns)) {
        const col = columns[key];
        const colName = col.$columnName || key;
        refs[key] = createColumnExpr(colName);
    }
    return refs;
}
function createGeneratedTableRefs(columns) {
    const refs = {};
    for (const key of Object.keys(columns)) {
        const col = columns[key];
        const colName = col.$columnName || key;
        const expr = (0, column_types_1.createFluentGenExpr)(`"${colName}"`);
        expr.__columnName = colName;
        refs[key] = expr;
    }
    return refs;
}
function createGeneratedAsFactory() {
    return {
        on(column) {
            const columnName = column.__columnName;
            return {
                as(expression) {
                    return {
                        $column: columnName,
                        $expression: expression.$sql,
                        $stored: true,
                    };
                },
            };
        },
    };
}
function createIndexFactory() {
    const factory = (name) => {
        const def = {
            name,
            columns: [],
        };
        const chain = {
            ...def,
            unique() {
                def.unique = true;
                return Object.assign(this, { unique: true });
            },
            using(method) {
                def.using = method;
                return Object.assign(this, { using: method });
            },
            where(condition) {
                if (typeof condition === 'function') {
                    const whereBuilder = createIndexWhereBuilder();
                    const result = condition(whereBuilder);
                    def.where = result.$sql;
                }
                else {
                    def.where = condition.$sql;
                }
                return Object.assign(this, { where: def.where });
            },
            with(options) {
                def.with = options;
                return Object.assign(this, { with: options });
            },
            tablespace(name) {
                def.tablespace = name;
                return Object.assign(this, { tablespace: name });
            },
            nullsFirst() {
                def.nulls = 'first';
                return Object.assign(this, { nulls: 'first' });
            },
            nullsLast() {
                def.nulls = 'last';
                return Object.assign(this, { nulls: 'last' });
            },
            asc() {
                def.order = 'asc';
                return Object.assign(this, { order: 'asc' });
            },
            desc() {
                def.order = 'desc';
                return Object.assign(this, { order: 'desc' });
            },
            include(...columns) {
                def.include = columns;
                return Object.assign(this, { include: columns });
            },
            opclass(opclass) {
                def._opclass = opclass;
                return Object.assign(this, { _opclass: opclass });
            },
            ifNotExists() {
                def.ifNotExists = true;
                return Object.assign(this, { ifNotExists: true });
            },
            tableOnly() {
                def.tableOnly = true;
                return Object.assign(this, { tableOnly: true });
            },
            comment(text) {
                def.comment = text;
                return Object.assign(this, { comment: text });
            },
            $id(trackingId) {
                def.trackingId = trackingId;
                return Object.assign(this, { trackingId: trackingId });
            },
        };
        return {
            on(...columns) {
                def.columns = columns.map(c => {
                    if (typeof c === 'string')
                        return c;
                    return c.$sql;
                });
                return Object.assign(chain, def);
            },
            expression(callback) {
                const result = callback(sql_expressions_1.expressionBuilder);
                def.expression = result.$sql;
                def.columns = [result.$sql];
                return Object.assign(chain, def);
            },
        };
    };
    return factory;
}
const indexFactory = createIndexFactory();
function defineTable(name, columns, options) {
    const columnRefs = createColumnRefs(columns);
    const indexTableRefs = createIndexTableRefs(columns);
    let resolvedIndexes;
    if (options?.indexes) {
        if (typeof options.indexes === 'function') {
            const rawIndexes = options.indexes(indexTableRefs, indexFactory, sql_expressions_1.sqlFunctions);
            resolvedIndexes = rawIndexes.map(normalizeIndexDef);
        }
        else {
            resolvedIndexes = options.indexes.map(normalizeIndexDef);
        }
    }
    let resolvedPartitionBy;
    if (options?.partitionBy) {
        resolvedPartitionBy = options.partitionBy(columnRefs, partitions_1.partitionStrategyFactory);
    }
    let resolvedCheckConstraints;
    if (options?.checkConstraints) {
        const checkTableRefs = createCheckTableRefs(columns);
        const checkBuilder = createCheckConstraintBuilder();
        const constraints = options.checkConstraints(checkTableRefs, checkBuilder);
        resolvedCheckConstraints = constraints.map(c => ({ expression: c.expression, name: c.name }));
    }
    if (options?.generatedAs) {
        const generatedTableRefs = createGeneratedTableRefs(columns);
        const generatedAsFactory = createGeneratedAsFactory();
        const generatedDefs = options.generatedAs(generatedTableRefs, generatedAsFactory);
        for (const def of generatedDefs) {
            const colEntry = Object.entries(columns).find(([key, col]) => {
                const colName = col.$columnName || key;
                return colName === def.$column;
            });
            if (colEntry) {
                const [, col] = colEntry;
                col.$generated = { expression: def.$expression, stored: def.$stored };
            }
        }
    }
    let resolvedConstraints;
    if (options?.constraints) {
        const constraintBuilder = createConstraintBuilder();
        resolvedConstraints = options.constraints(columnRefs, constraintBuilder);
    }
    let resolvedPartitions;
    if (options?.partitions) {
        resolvedPartitions = options.partitions(partitions_1.partition);
    }
    const definition = {
        $name: name,
        $schema: options?.schema,
        $columns: columns,
        $primaryKey: options?.primaryKey,
        $uniqueConstraints: options?.uniqueConstraints,
        $checkConstraints: resolvedCheckConstraints,
        $constraints: resolvedConstraints,
        $foreignKeys: options?.foreignKeys,
        $indexes: resolvedIndexes,
        $inherits: options?.inherits,
        $partitionBy: resolvedPartitionBy,
        $partitions: resolvedPartitions,
        $tablespace: options?.tablespace,
        $withOptions: options?.withOptions,
        $ifNotExists: options?.ifNotExists,
        $trackingId: options?.$trackingId,
        $comment: options?.comment,
        $inferSelect: {},
        $inferInsert: {},
        toSQL() {
            return generateCreateTableSQL(this);
        },
        toCreateIndexSQL() {
            return generateIndexSQL(this);
        },
        toAST() {
            return (0, schema_to_ast_1.tableToAST)(this);
        }
    };
    return definition;
}
function normalizeIndexDef(idx) {
    const unique = typeof idx.unique === 'function' ? false : (idx.unique || idx.isUnique || false);
    const using = typeof idx.using === 'function' ? undefined : (idx.using || idx.method);
    const where = typeof idx.where === 'function' ? undefined : idx.where;
    const withOpts = typeof idx.with === 'function' ? undefined : idx.with;
    const tablespace = typeof idx.tablespace === 'function' ? undefined : idx.tablespace;
    const include = typeof idx.include === 'function' ? undefined : idx.include;
    const comment = typeof idx.comment === 'function' ? undefined : idx.comment;
    return {
        name: idx.name,
        columns: idx.columns || [],
        unique,
        using,
        where,
        with: withOpts,
        tablespace,
        nulls: idx.nulls,
        order: idx.order,
        include,
        ifNotExists: idx.ifNotExists,
        tableOnly: idx.tableOnly,
        trackingId: idx.trackingId,
        comment,
    };
}
function generateCreateTableSQL(def) {
    const tableName = def.$schema
        ? `${pg_format_1.default.ident(def.$schema)}.${pg_format_1.default.ident(def.$name)}`
        : pg_format_1.default.ident(def.$name);
    const ifNotExistsClause = def.$ifNotExists ? 'IF NOT EXISTS ' : '';
    const parts = [`CREATE TABLE ${ifNotExistsClause}${tableName} (`];
    const columnDefs = [];
    const constraints = [];
    for (const [colName, colConfig] of Object.entries(def.$columns)) {
        columnDefs.push(generateColumnSQL(colName, colConfig));
        if (colConfig.$check) {
            constraints.push(`CHECK (${colConfig.$check})`);
        }
    }
    if (def.$primaryKey && def.$primaryKey.length > 0) {
        const pkCols = def.$primaryKey.map(c => pg_format_1.default.ident(c)).join(', ');
        constraints.push(`PRIMARY KEY (${pkCols})`);
    }
    if (def.$uniqueConstraints) {
        for (const uc of def.$uniqueConstraints) {
            const cols = uc.columns.map(c => pg_format_1.default.ident(c)).join(', ');
            if (uc.name) {
                constraints.push(`CONSTRAINT ${pg_format_1.default.ident(uc.name)} UNIQUE (${cols})`);
            }
            else {
                constraints.push(`UNIQUE (${cols})`);
            }
        }
    }
    if (def.$checkConstraints) {
        for (const cc of def.$checkConstraints) {
            if (cc.name) {
                constraints.push(`CONSTRAINT ${pg_format_1.default.ident(cc.name)} CHECK (${cc.expression})`);
            }
            else {
                constraints.push(`CHECK (${cc.expression})`);
            }
        }
    }
    if (def.$constraints) {
        for (const c of def.$constraints) {
            const cols = c.$columns.map(col => pg_format_1.default.ident(col)).join(', ');
            constraints.push(`CONSTRAINT ${pg_format_1.default.ident(c.$name)} ${c.$type} (${cols})`);
        }
    }
    if (def.$foreignKeys) {
        for (const fk of def.$foreignKeys) {
            const cols = fk.columns.map(c => pg_format_1.default.ident(c)).join(', ');
            const refCols = fk.references.columns.map(c => pg_format_1.default.ident(c)).join(', ');
            let fkDef = `FOREIGN KEY (${cols}) REFERENCES ${pg_format_1.default.ident(fk.references.table)} (${refCols})`;
            if (fk.onDelete) {
                fkDef += ` ON DELETE ${fk.onDelete}`;
            }
            if (fk.onUpdate) {
                fkDef += ` ON UPDATE ${fk.onUpdate}`;
            }
            if (fk.name) {
                constraints.push(`CONSTRAINT ${pg_format_1.default.ident(fk.name)} ${fkDef}`);
            }
            else {
                constraints.push(fkDef);
            }
        }
    }
    parts.push([...columnDefs, ...constraints].join(',\n  '));
    parts.push(')');
    if (def.$inherits && def.$inherits.length > 0) {
        parts.push(`INHERITS (${def.$inherits.map(t => pg_format_1.default.ident(t)).join(', ')})`);
    }
    if (def.$partitionBy) {
        const col = pg_format_1.default.ident(def.$partitionBy.$column);
        parts.push(`PARTITION BY ${def.$partitionBy.$type} (${col})`);
    }
    if (def.$withOptions && Object.keys(def.$withOptions).length > 0) {
        const opts = Object.entries(def.$withOptions)
            .map(([k, v]) => `${k} = ${v}`)
            .join(', ');
        parts.push(`WITH (${opts})`);
    }
    if (def.$tablespace) {
        parts.push(`TABLESPACE ${pg_format_1.default.ident(def.$tablespace)}`);
    }
    return parts.join(' ');
}
function generateColumnSQL(name, config) {
    const actualName = config.$columnName || name;
    const parts = [pg_format_1.default.ident(actualName)];
    let typeName = config.$type;
    if (config.$array) {
        const dims = config.$dimensions ?? 1;
        typeName += '[]'.repeat(dims);
    }
    parts.push(typeName);
    if (config.$nullable === false) {
        parts.push('NOT NULL');
    }
    if (config.$primaryKey) {
        parts.push('PRIMARY KEY');
    }
    if (config.$unique) {
        parts.push('UNIQUE');
    }
    if (config.$default !== undefined) {
        const defaultVal = typeof config.$default === 'function'
            ? config.$default()
            : config.$default;
        if (typeof defaultVal === 'object' && defaultVal !== null && '$isDefault' in defaultVal && '$sql' in defaultVal) {
            parts.push(`DEFAULT ${defaultVal.$sql}`);
        }
        else if (typeof defaultVal === 'symbol') {
            const symDesc = defaultVal.description || String(defaultVal);
            if (symDesc.includes('emptyObject')) {
                parts.push(`DEFAULT '{}'::jsonb`);
            }
            else if (symDesc.includes('emptyArray')) {
                parts.push(`DEFAULT '[]'::jsonb`);
            }
        }
        else if (Array.isArray(defaultVal)) {
            parts.push(`DEFAULT '${JSON.stringify(defaultVal)}'::jsonb`);
        }
        else if (typeof defaultVal === 'object' && defaultVal !== null) {
            parts.push(`DEFAULT '${JSON.stringify(defaultVal)}'::jsonb`);
        }
        else if (typeof defaultVal === 'string' && (defaultVal.includes('(') ||
            defaultVal.toUpperCase() === 'NOW()' ||
            defaultVal.toUpperCase() === 'CURRENT_TIMESTAMP' ||
            defaultVal.toUpperCase() === 'CURRENT_DATE' ||
            defaultVal.toUpperCase() === 'CURRENT_TIME' ||
            defaultVal.toUpperCase().startsWith('GEN_RANDOM_UUID') ||
            defaultVal.toUpperCase() === 'TRUE' ||
            defaultVal.toUpperCase() === 'FALSE' ||
            defaultVal.toUpperCase() === 'NULL')) {
            parts.push(`DEFAULT ${defaultVal}`);
        }
        else if (typeof defaultVal === 'boolean') {
            parts.push(`DEFAULT ${defaultVal ? 'TRUE' : 'FALSE'}`);
        }
        else if (typeof defaultVal === 'number') {
            parts.push(`DEFAULT ${defaultVal}`);
        }
        else if (defaultVal === null) {
            parts.push('DEFAULT NULL');
        }
        else {
            parts.push(`DEFAULT ${(0, pg_format_1.default)('%L', String(defaultVal))}`);
        }
    }
    if (config.$references) {
        parts.push(`REFERENCES ${pg_format_1.default.ident(config.$references.table)}(${pg_format_1.default.ident(config.$references.column)})`);
        if (config.$references.onDelete) {
            parts.push(`ON DELETE ${config.$references.onDelete}`);
        }
        if (config.$references.onUpdate) {
            parts.push(`ON UPDATE ${config.$references.onUpdate}`);
        }
    }
    if (config.$generated) {
        const stored = config.$generated.stored !== false ? 'STORED' : '';
        parts.push(`GENERATED ALWAYS AS (${config.$generated.expression}) ${stored}`.trim());
    }
    return parts.join(' ');
}
function generateIndexSQL(def) {
    if (!def.$indexes)
        return [];
    const tableName = def.$schema
        ? `${pg_format_1.default.ident(def.$schema)}.${pg_format_1.default.ident(def.$name)}`
        : pg_format_1.default.ident(def.$name);
    return def.$indexes.map(idx => {
        const indexName = idx.name ?? `idx_${def.$name}_${idx.columns.join('_')}`;
        const colExprs = idx.columns.map(c => {
            let expr = pg_format_1.default.ident(c);
            if (idx.order) {
                expr += ` ${idx.order.toUpperCase()}`;
            }
            if (idx.nulls) {
                expr += ` NULLS ${idx.nulls.toUpperCase()}`;
            }
            return expr;
        });
        let sql = 'CREATE';
        if (idx.unique) {
            sql += ' UNIQUE';
        }
        sql += ' INDEX';
        if (idx.ifNotExists) {
            sql += ' IF NOT EXISTS';
        }
        sql += ` ${pg_format_1.default.ident(indexName)} ON`;
        if (idx.tableOnly) {
            sql += ' ONLY';
        }
        sql += ` ${tableName}`;
        if (idx.using) {
            sql += ` USING ${idx.using}`;
        }
        sql += ` (${colExprs.join(', ')})`;
        if (idx.include && idx.include.length > 0) {
            sql += ` INCLUDE (${idx.include.map(c => pg_format_1.default.ident(c)).join(', ')})`;
        }
        if (idx.with) {
            const withParts = [];
            if (idx.with.fillfactor !== undefined) {
                withParts.push(`fillfactor = ${idx.with.fillfactor}`);
            }
            if (idx.with.fastupdate !== undefined) {
                withParts.push(`fastupdate = ${idx.with.fastupdate ? 'on' : 'off'}`);
            }
            if (idx.with.ginPendingListLimit !== undefined) {
                withParts.push(`gin_pending_list_limit = ${idx.with.ginPendingListLimit}`);
            }
            if (idx.with.pagesPerRange !== undefined) {
                withParts.push(`pages_per_range = ${idx.with.pagesPerRange}`);
            }
            if (idx.with.autosummarize !== undefined) {
                withParts.push(`autosummarize = ${idx.with.autosummarize ? 'on' : 'off'}`);
            }
            if (idx.with.buffering !== undefined) {
                withParts.push(`buffering = ${idx.with.buffering}`);
            }
            if (withParts.length > 0) {
                sql += ` WITH (${withParts.join(', ')})`;
            }
        }
        if (idx.tablespace) {
            sql += ` TABLESPACE ${pg_format_1.default.ident(idx.tablespace)}`;
        }
        if (idx.where) {
            sql += ` WHERE ${idx.where}`;
        }
        return sql;
    });
}
