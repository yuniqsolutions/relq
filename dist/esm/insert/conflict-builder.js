import format from "../utils/pg-format.js";
function isColumnRef(value) {
    return typeof value === 'object' && value !== null && value.__type === 'column_ref';
}
function isSqlExpression(value) {
    return typeof value === 'object' && value !== null && value.__type === 'sql_expression';
}
export function createExcludedProxy() {
    return new Proxy({}, {
        get(_target, prop) {
            return { __type: 'column_ref', table: 'EXCLUDED', column: prop };
        }
    });
}
export function createRowProxy(tableName) {
    return new Proxy({}, {
        get(_target, prop) {
            return { __type: 'column_ref', table: tableName, column: prop };
        }
    });
}
function columnRefToSql(ref) {
    return format('%I.%I', ref.table, ref.column);
}
function resolveColumnRef(ref, columnResolver) {
    if (!columnResolver)
        return ref;
    return { ...ref, column: columnResolver(ref.column) };
}
function valueToSql(value, columnResolver) {
    if (isColumnRef(value)) {
        return columnRefToSql(resolveColumnRef(value, columnResolver));
    }
    if (isSqlExpression(value)) {
        return value.sql;
    }
    if (typeof value === 'number' || typeof value === 'bigint') {
        return String(value);
    }
    return format('%L', value);
}
export function createSqlHelpers(currentColumn, tableName, columnResolver) {
    const resolve = (col) => columnResolver ? columnResolver(col) : col;
    const resolvedColumn = resolve(currentColumn);
    const expr = (sql) => ({ __type: 'sql_expression', sql });
    return {
        increment(amount) {
            return expr(`${format('%I.%I', tableName, resolvedColumn)} + ${amount}`);
        },
        add(a, b) {
            return expr(`${valueToSql(a, columnResolver)} + ${valueToSql(b, columnResolver)}`);
        },
        subtract(a, b) {
            return expr(`${valueToSql(a, columnResolver)} - ${valueToSql(b, columnResolver)}`);
        },
        multiply(a, b) {
            return expr(`${valueToSql(a, columnResolver)} * ${valueToSql(b, columnResolver)}`);
        },
        divide(a, b) {
            return expr(`${valueToSql(a, columnResolver)} / ${valueToSql(b, columnResolver)}`);
        },
        modulo(a, b) {
            return expr(`${valueToSql(a, columnResolver)} % ${valueToSql(b, columnResolver)}`);
        },
        coalesce(...values) {
            return expr(`COALESCE(${values.map(v => valueToSql(v, columnResolver)).join(', ')})`);
        },
        greatest(...values) {
            return expr(`GREATEST(${values.map(v => valueToSql(v, columnResolver)).join(', ')})`);
        },
        least(...values) {
            return expr(`LEAST(${values.map(v => valueToSql(v, columnResolver)).join(', ')})`);
        },
        nullif(a, b) {
            return expr(`NULLIF(${valueToSql(a, columnResolver)}, ${valueToSql(b, columnResolver)})`);
        },
        abs(value) {
            return expr(`ABS(${valueToSql(value, columnResolver)})`);
        },
        ceil(value) {
            return expr(`CEIL(${valueToSql(value, columnResolver)})`);
        },
        floor(value) {
            return expr(`FLOOR(${valueToSql(value, columnResolver)})`);
        },
        round(value, decimals) {
            if (decimals !== undefined) {
                return expr(`ROUND(${valueToSql(value, columnResolver)}, ${decimals})`);
            }
            return expr(`ROUND(${valueToSql(value, columnResolver)})`);
        },
        concat(...values) {
            return expr(`CONCAT(${values.map(v => valueToSql(v, columnResolver)).join(', ')})`);
        },
        lower(value) {
            return expr(`LOWER(${valueToSql(value, columnResolver)})`);
        },
        upper(value) {
            return expr(`UPPER(${valueToSql(value, columnResolver)})`);
        },
        trim(value) {
            return expr(`TRIM(${valueToSql(value, columnResolver)})`);
        },
        now() {
            return expr('NOW()');
        },
        currentDate() {
            return expr('CURRENT_DATE');
        },
        currentTimestamp() {
            return expr('CURRENT_TIMESTAMP');
        }
    };
}
export class ConflictBuilder {
    _action = 'nothing';
    _updateData = {};
    _whereClause;
    _tableName;
    _columnResolver;
    constructor(tableName) {
        this._tableName = tableName;
    }
    setColumnResolver(resolver) {
        this._columnResolver = resolver;
        return this;
    }
    doNothing() {
        this._action = 'nothing';
        this._updateData = {};
        return this;
    }
    doUpdate(values) {
        this._action = 'update';
        const excludedProxy = createExcludedProxy();
        const rowProxy = createRowProxy(this._tableName);
        for (const [column, value] of Object.entries(values)) {
            if (typeof value === 'function') {
                const fn = value;
                const sqlHelpers = createSqlHelpers(column, this._tableName, this._columnResolver);
                let result;
                if (fn.length === 1) {
                    result = fn(excludedProxy);
                }
                else if (fn.length === 2) {
                    result = fn(excludedProxy, sqlHelpers);
                }
                else {
                    result = fn(excludedProxy, sqlHelpers, rowProxy);
                }
                this._updateData[column] = result;
            }
            else {
                this._updateData[column] = value;
            }
        }
        return this;
    }
    where(condition) {
        this._whereClause = condition;
        return this;
    }
    get action() {
        return this._action;
    }
    get updateData() {
        return this._updateData;
    }
    get whereClause() {
        return this._whereClause;
    }
    get tableName() {
        return this._tableName;
    }
}
export function buildConflictUpdateSql(updateData, tableName, columnResolver) {
    const resolve = (col) => columnResolver ? columnResolver(col) : col;
    const setClauses = [];
    for (const [column, value] of Object.entries(updateData)) {
        const resolvedCol = resolve(column);
        if (isColumnRef(value)) {
            const resolvedRef = resolveColumnRef(value, columnResolver);
            setClauses.push(`${format('%I', resolvedCol)} = ${columnRefToSql(resolvedRef)}`);
        }
        else if (isSqlExpression(value)) {
            setClauses.push(`${format('%I', resolvedCol)} = ${value.sql}`);
        }
        else if (Array.isArray(value)) {
            if (value.length === 0) {
                setClauses.push(`${format('%I', resolvedCol)} = ARRAY[]::jsonb[]`);
            }
            else {
                const jsonValues = value.map(v => format('%L', JSON.stringify(v))).join(',');
                setClauses.push(`${format('%I', resolvedCol)} = ARRAY[${jsonValues}]::jsonb[]`);
            }
        }
        else {
            setClauses.push(format('%I = %L', resolvedCol, value));
        }
    }
    return setClauses.join(', ');
}
