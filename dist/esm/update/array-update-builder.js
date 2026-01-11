import format from "../addon/pg-format/index.js";
export class ArrayStringUpdateBuilder {
    set(values) {
        if (values.length === 0)
            return 'ARRAY[]::text[]';
        const formatted = values.map(v => format('%L', v)).join(',');
        return `ARRAY[${formatted}]`;
    }
    append(value) {
        return format('array_append(%I, %L)', this.getContextColumn(), value);
    }
    prepend(value) {
        return format('array_prepend(%L, %I)', value, this.getContextColumn());
    }
    remove(value) {
        return format('array_remove(%I, %L)', this.getContextColumn(), value);
    }
    concat(values) {
        if (values.length === 0)
            return format('%I', this.getContextColumn());
        const formatted = values.map(v => format('%L', v)).join(',');
        return format('%I || ARRAY[%s]', this.getContextColumn(), formatted);
    }
    getContextColumn() {
        return '__COLUMN__';
    }
}
export class ArrayNumericUpdateBuilder {
    set(values) {
        if (values.length === 0)
            return 'ARRAY[]::integer[]';
        return `ARRAY[${values.join(',')}]`;
    }
    append(value) {
        return format('array_append(%I, %s)', this.getContextColumn(), value);
    }
    prepend(value) {
        return format('array_prepend(%s, %I)', value, this.getContextColumn());
    }
    remove(value) {
        return format('array_remove(%I, %s)', this.getContextColumn(), value);
    }
    concat(values) {
        if (values.length === 0)
            return format('%I', this.getContextColumn());
        return format('%I || ARRAY[%s]', this.getContextColumn(), values.join(','));
    }
    getContextColumn() {
        return '__COLUMN__';
    }
}
export class ArrayBooleanUpdateBuilder {
    set(values) {
        if (values.length === 0)
            return 'ARRAY[]::boolean[]';
        return `ARRAY[${values.map(v => v.toString()).join(',')}]`;
    }
    append(value) {
        return format('array_append(%I, %s)', this.getContextColumn(), value.toString());
    }
    prepend(value) {
        return format('array_prepend(%s, %I)', value.toString(), this.getContextColumn());
    }
    remove(value) {
        return format('array_remove(%I, %s)', this.getContextColumn(), value.toString());
    }
    concat(values) {
        if (values.length === 0)
            return format('%I', this.getContextColumn());
        return format('%I || ARRAY[%s]', this.getContextColumn(), values.map(v => v.toString()).join(','));
    }
    getContextColumn() {
        return '__COLUMN__';
    }
}
export class ArrayUuidUpdateBuilder {
    set(values) {
        if (values.length === 0)
            return 'ARRAY[]::uuid[]';
        const formatted = values.map(v => format('%L::uuid', v)).join(',');
        return `ARRAY[${formatted}]`;
    }
    append(value) {
        return format('array_append(%I, %L::uuid)', this.getContextColumn(), value);
    }
    prepend(value) {
        return format('array_prepend(%L::uuid, %I)', value, this.getContextColumn());
    }
    remove(value) {
        return format('array_remove(%I, %L::uuid)', this.getContextColumn(), value);
    }
    concat(values) {
        if (values.length === 0)
            return format('%I', this.getContextColumn());
        const formatted = values.map(v => format('%L::uuid', v)).join(',');
        return format('%I || ARRAY[%s]', this.getContextColumn(), formatted);
    }
    getContextColumn() {
        return '__COLUMN__';
    }
}
export class ArrayDateUpdateBuilder {
    set(values) {
        if (values.length === 0)
            return 'ARRAY[]::timestamp[]';
        const formatted = values.map(v => {
            const dateStr = v instanceof Date ? v.toISOString() : v;
            return format('%L::timestamp', dateStr);
        }).join(',');
        return `ARRAY[${formatted}]`;
    }
    append(value) {
        const dateStr = value instanceof Date ? value.toISOString() : value;
        return format('array_append(%I, %L::timestamp)', this.getContextColumn(), dateStr);
    }
    prepend(value) {
        const dateStr = value instanceof Date ? value.toISOString() : value;
        return format('array_prepend(%L::timestamp, %I)', dateStr, this.getContextColumn());
    }
    remove(value) {
        const dateStr = value instanceof Date ? value.toISOString() : value;
        return format('array_remove(%I, %L::timestamp)', this.getContextColumn(), dateStr);
    }
    concat(values) {
        if (values.length === 0)
            return format('%I', this.getContextColumn());
        const formatted = values.map(v => {
            const dateStr = v instanceof Date ? v.toISOString() : v;
            return format('%L::timestamp', dateStr);
        }).join(',');
        return format('%I || ARRAY[%s]', this.getContextColumn(), formatted);
    }
    getContextColumn() {
        return '__COLUMN__';
    }
}
export class ArrayJsonbUpdateBuilder {
    set(values) {
        if (values.length === 0)
            return 'ARRAY[]::jsonb[]';
        const formatted = values.map(v => format('%L::jsonb', JSON.stringify(v))).join(',');
        return `ARRAY[${formatted}]`;
    }
    append(value) {
        return format('array_append(%I, %L::jsonb)', this.getContextColumn(), JSON.stringify(value));
    }
    prepend(value) {
        return format('array_prepend(%L::jsonb, %I)', JSON.stringify(value), this.getContextColumn());
    }
    remove(value) {
        return format('array_remove(%I, %L::jsonb)', this.getContextColumn(), JSON.stringify(value));
    }
    concat(values) {
        if (values.length === 0)
            return format('%I', this.getContextColumn());
        const formatted = values.map(v => format('%L::jsonb', JSON.stringify(v))).join(',');
        return format('%I || ARRAY[%s]', this.getContextColumn(), formatted);
    }
    getContextColumn() {
        return '__COLUMN__';
    }
}
export class ArrayUpdateBuilder {
    currentColumn;
    constructor(currentColumn) {
        this.currentColumn = currentColumn;
    }
    get string() {
        return new ArrayStringUpdateBuilder();
    }
    get numeric() {
        return new ArrayNumericUpdateBuilder();
    }
    get integer() {
        return this.numeric;
    }
    get boolean() {
        return new ArrayBooleanUpdateBuilder();
    }
    get uuid() {
        return new ArrayUuidUpdateBuilder();
    }
    get date() {
        return new ArrayDateUpdateBuilder();
    }
    get timestamp() {
        return this.date;
    }
    get jsonb() {
        return new ArrayJsonbUpdateBuilder();
    }
}
