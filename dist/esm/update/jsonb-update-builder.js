import format from "../addon/pg-format/index.js";
export class JsonbUpdateBuilder {
    currentColumn;
    constructor(currentColumn = '__COLUMN__') {
        this.currentColumn = currentColumn;
    }
    set(values) {
        return format('%L::jsonb', JSON.stringify(values));
    }
    append(value) {
        return format('%I || %L::jsonb', this.currentColumn, JSON.stringify([value]));
    }
    prepend(value) {
        return format('%L::jsonb || %I', JSON.stringify([value]), this.currentColumn);
    }
    concat(values) {
        if (values.length === 0) {
            return format('%I', this.currentColumn);
        }
        return format('%I || %L::jsonb', this.currentColumn, JSON.stringify(values));
    }
    removeAt(index) {
        return format('%I - %s', this.currentColumn, index);
    }
    removeWhere(key, value) {
        const formattedValue = format('%L', value);
        return `COALESCE((SELECT jsonb_agg(elem) FROM jsonb_array_elements(${format('%I', this.currentColumn)}) elem WHERE elem->>${format('%L', key)} != ${formattedValue}), '[]'::jsonb)`;
    }
    removeWhereAll(conditions) {
        const whereClauses = Object.entries(conditions)
            .map(([key, value]) => `elem->>${format('%L', key)} = ${format('%L', value)}`)
            .join(' AND ');
        return `COALESCE((SELECT jsonb_agg(elem) FROM jsonb_array_elements(${format('%I', this.currentColumn)}) elem WHERE NOT (${whereClauses})), '[]'::jsonb)`;
    }
    filterWhere(key, value) {
        const formattedValue = format('%L', value);
        return `COALESCE((SELECT jsonb_agg(elem) FROM jsonb_array_elements(${format('%I', this.currentColumn)}) elem WHERE elem->>${format('%L', key)} = ${formattedValue}), '[]'::jsonb)`;
    }
    updateAt(index, newValue) {
        return format('jsonb_set(%I, %L, %L::jsonb)', this.currentColumn, `{${index}}`, JSON.stringify(newValue));
    }
    updateWhere(matchKey, matchValue, updates) {
        const matchCondition = `elem->>${format('%L', matchKey)} = ${format('%L', matchValue)}`;
        const updateEntries = Object.entries(updates);
        if (updateEntries.length === 0) {
            return format('%I', this.currentColumn);
        }
        let setExpr = 'elem';
        for (const [key, value] of updateEntries) {
            const jsonbValue = typeof value === 'string' ? `"${value}"` : JSON.stringify(value);
            setExpr = `jsonb_set(${setExpr}, ${format('%L', `{${key}}`)}, ${format('%L', jsonbValue)}::jsonb)`;
        }
        return `COALESCE((SELECT jsonb_agg(CASE WHEN ${matchCondition} THEN ${setExpr} ELSE elem END) FROM jsonb_array_elements(${format('%I', this.currentColumn)}) elem), '[]'::jsonb)`;
    }
}
