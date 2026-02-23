function getColumnName(column) {
    if (typeof column === 'string')
        return column;
    return column.$columnName || column.name || 'unknown';
}
function createListBuilder(column) {
    const builder = {
        $type: 'LIST',
        $column: column,
        sub(fn) {
            const subStrategy = fn(partitionStrategyFactory);
            return {
                ...this,
                $subpartition: subStrategy,
            };
        },
    };
    return builder;
}
function createRangeBuilder(column) {
    const builder = {
        $type: 'RANGE',
        $column: column,
        sub(fn) {
            const subStrategy = fn(partitionStrategyFactory);
            return {
                ...this,
                $subpartition: subStrategy,
            };
        },
    };
    return builder;
}
function createHashBuilder(column, modulus) {
    return {
        $type: 'HASH',
        $column: column,
        $modulus: modulus,
    };
}
export const partitionStrategyFactory = {
    list(column) {
        return createListBuilder(getColumnName(column));
    },
    range(column) {
        return createRangeBuilder(getColumnName(column));
    },
    hash(column, modulus) {
        return createHashBuilder(getColumnName(column), modulus);
    },
};
function formatValue(value) {
    if (value instanceof Date) {
        return value.toISOString().split('T')[0];
    }
    return String(value);
}
export function partition(name) {
    return {
        $name: name,
        in(values) {
            const normalized = Array.isArray(values) ? values : [values];
            return {
                $name: name,
                $partitionType: 'LIST',
                $values: normalized,
            };
        },
        from(value) {
            const fromValue = formatValue(value);
            return {
                to(toValue) {
                    return {
                        $name: name,
                        $partitionType: 'RANGE',
                        $from: fromValue,
                        $to: formatValue(toValue),
                    };
                },
            };
        },
        remainder(value) {
            return {
                $name: name,
                $partitionType: 'HASH',
                $remainder: value,
            };
        },
        default() {
            return {
                $name: name,
                $partitionType: 'DEFAULT',
                $isDefault: true,
            };
        },
    };
}
export function generatePartitionBySQL(strategy) {
    let sql = `PARTITION BY ${strategy.$type} (${strategy.$column})`;
    return sql;
}
export function generateChildPartitionSQL(parentTable, child, subpartitionStrategy) {
    let sql = `CREATE TABLE IF NOT EXISTS ${child.$name} PARTITION OF ${parentTable}`;
    switch (child.$partitionType) {
        case 'LIST':
            const values = child.$values?.map(v => `'${v}'`).join(', ') || '';
            sql += ` FOR VALUES IN (${values})`;
            break;
        case 'RANGE':
            sql += ` FOR VALUES FROM ('${child.$from}') TO ('${child.$to}')`;
            break;
        case 'HASH':
            sql += ` FOR VALUES WITH (MODULUS ${child.$modulus}, REMAINDER ${child.$remainder})`;
            break;
        case 'DEFAULT':
            sql += ` DEFAULT`;
            break;
    }
    if (subpartitionStrategy) {
        sql += ` ${generatePartitionBySQL(subpartitionStrategy)}`;
    }
    return sql + ';';
}
