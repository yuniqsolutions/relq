import { createColumnWithName } from "./column-builder.js";
export function pgComposite(name, fields) {
    const compositeFn = (columnName) => {
        const col = createColumnWithName(name, columnName);
        col.$fields = fields;
        return col;
    };
    const attributes = Object.entries(fields).map(([fieldName, fieldConfig]) => {
        const config = fieldConfig;
        return {
            name: fieldName,
            type: config.$sqlType || (typeof config.$type === 'string' ? config.$type : 'TEXT'),
            collation: undefined,
        };
    });
    const compositeConfig = {
        $typeName: name,
        $fields: fields,
        $inferType: {},
        $trackingId: undefined,
        toAST() {
            return {
                name: compositeConfig.$typeName,
                attributes,
                trackingId: compositeConfig.$trackingId,
            };
        },
        $id(trackingId) {
            compositeConfig.$trackingId = trackingId;
            return compositeFn;
        },
    };
    Object.assign(compositeFn, compositeConfig);
    return compositeFn;
}
export function generateCompositeTypeSQL(composite) {
    const fieldDefs = [];
    for (const [fieldName, fieldConfig] of Object.entries(composite.$fields)) {
        const config = fieldConfig;
        let fieldDef = `"${fieldName}" ${config.$sqlType || (typeof config.$type === 'string' ? config.$type : 'TEXT')}`;
        if (config.$nullable === false) {
            fieldDef += ' NOT NULL';
        }
        fieldDefs.push(fieldDef);
    }
    return `CREATE TYPE "${composite.$typeName}" AS (\n  ${fieldDefs.join(',\n  ')}\n);`;
}
export const customType = (typeName, columnName) => createColumnWithName(typeName, columnName);
export const SQL_BRAND = Symbol.for('relq.sql.brand');
function sqlExpr(sql) {
    const branded = Object.create(null);
    Object.defineProperty(branded, '$sql', { value: sql, enumerable: false });
    return branded;
}
export const genRandomUuid = () => sqlExpr('gen_random_uuid()');
export const uuidV4 = () => sqlExpr('uuid_generate_v4()');
export const now = () => sqlExpr('NOW()');
export const currentTimestamp = () => sqlExpr('CURRENT_TIMESTAMP');
export const currentDate = () => sqlExpr('CURRENT_DATE');
export const emptyObject = () => sqlExpr("'{}'");
export const emptyArray = () => sqlExpr("'[]'");
export function sql(strings, ...values) {
    let result = strings[0];
    for (let i = 0; i < values.length; i++) {
        result += String(values[i]) + strings[i + 1];
    }
    return sqlExpr(result);
}
export const raw = (expression) => sqlExpr(expression);
export const index = (name) => ({
    name,
    on: (...columns) => ({
        name,
        columns,
        unique() { return { name, columns, unique: true, isUnique: true }; },
        using(method) {
            return { name, columns, using: method, method };
        },
    }),
});
