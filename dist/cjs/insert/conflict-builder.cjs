"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConflictBuilder = void 0;
exports.createExcludedProxy = createExcludedProxy;
exports.createRowProxy = createRowProxy;
exports.createSqlHelpers = createSqlHelpers;
exports.buildConflictUpdateSql = buildConflictUpdateSql;
const pg_format_1 = __importDefault(require("../utils/pg-format.cjs"));
function isColumnRef(value) {
    return typeof value === 'object' && value !== null && value.__type === 'column_ref';
}
function isSqlExpression(value) {
    return typeof value === 'object' && value !== null && value.__type === 'sql_expression';
}
function createExcludedProxy() {
    return new Proxy({}, {
        get(_target, prop) {
            return { __type: 'column_ref', table: 'EXCLUDED', column: prop };
        }
    });
}
function createRowProxy(tableName) {
    return new Proxy({}, {
        get(_target, prop) {
            return { __type: 'column_ref', table: tableName, column: prop };
        }
    });
}
function columnRefToSql(ref) {
    return (0, pg_format_1.default)('%I.%I', ref.table, ref.column);
}
function valueToSql(value) {
    if (isColumnRef(value)) {
        return columnRefToSql(value);
    }
    if (isSqlExpression(value)) {
        return value.sql;
    }
    if (typeof value === 'number' || typeof value === 'bigint') {
        return String(value);
    }
    return (0, pg_format_1.default)('%L', value);
}
function createSqlHelpers(currentColumn, tableName) {
    const expr = (sql) => ({ __type: 'sql_expression', sql });
    return {
        increment(amount) {
            return expr(`${(0, pg_format_1.default)('%I.%I', tableName, currentColumn)} + ${amount}`);
        },
        add(a, b) {
            return expr(`${valueToSql(a)} + ${valueToSql(b)}`);
        },
        subtract(a, b) {
            return expr(`${valueToSql(a)} - ${valueToSql(b)}`);
        },
        multiply(a, b) {
            return expr(`${valueToSql(a)} * ${valueToSql(b)}`);
        },
        divide(a, b) {
            return expr(`${valueToSql(a)} / ${valueToSql(b)}`);
        },
        modulo(a, b) {
            return expr(`${valueToSql(a)} % ${valueToSql(b)}`);
        },
        coalesce(...values) {
            return expr(`COALESCE(${values.map(v => valueToSql(v)).join(', ')})`);
        },
        greatest(...values) {
            return expr(`GREATEST(${values.map(v => valueToSql(v)).join(', ')})`);
        },
        least(...values) {
            return expr(`LEAST(${values.map(v => valueToSql(v)).join(', ')})`);
        },
        nullif(a, b) {
            return expr(`NULLIF(${valueToSql(a)}, ${valueToSql(b)})`);
        },
        abs(value) {
            return expr(`ABS(${valueToSql(value)})`);
        },
        ceil(value) {
            return expr(`CEIL(${valueToSql(value)})`);
        },
        floor(value) {
            return expr(`FLOOR(${valueToSql(value)})`);
        },
        round(value, decimals) {
            if (decimals !== undefined) {
                return expr(`ROUND(${valueToSql(value)}, ${decimals})`);
            }
            return expr(`ROUND(${valueToSql(value)})`);
        },
        concat(...values) {
            return expr(`CONCAT(${values.map(v => valueToSql(v)).join(', ')})`);
        },
        lower(value) {
            return expr(`LOWER(${valueToSql(value)})`);
        },
        upper(value) {
            return expr(`UPPER(${valueToSql(value)})`);
        },
        trim(value) {
            return expr(`TRIM(${valueToSql(value)})`);
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
class ConflictBuilder {
    _action = 'nothing';
    _updateData = {};
    _whereClause;
    _tableName;
    constructor(tableName) {
        this._tableName = tableName;
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
                const sqlHelpers = createSqlHelpers(column, this._tableName);
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
exports.ConflictBuilder = ConflictBuilder;
function buildConflictUpdateSql(updateData, tableName) {
    const setClauses = [];
    for (const [column, value] of Object.entries(updateData)) {
        if (isColumnRef(value)) {
            setClauses.push(`${(0, pg_format_1.default)('%I', column)} = ${columnRefToSql(value)}`);
        }
        else if (isSqlExpression(value)) {
            setClauses.push(`${(0, pg_format_1.default)('%I', column)} = ${value.sql}`);
        }
        else if (Array.isArray(value)) {
            if (value.length === 0) {
                setClauses.push(`${(0, pg_format_1.default)('%I', column)} = ARRAY[]::jsonb[]`);
            }
            else {
                const jsonValues = value.map(v => (0, pg_format_1.default)('%L', JSON.stringify(v))).join(',');
                setClauses.push(`${(0, pg_format_1.default)('%I', column)} = ARRAY[${jsonValues}]::jsonb[]`);
            }
        }
        else {
            setClauses.push((0, pg_format_1.default)('%I = %L', column, value));
        }
    }
    return setClauses.join(', ');
}
