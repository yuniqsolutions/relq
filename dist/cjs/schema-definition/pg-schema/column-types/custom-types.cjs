"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.index = exports.raw = exports.emptyArray = exports.emptyObject = exports.currentDate = exports.currentTimestamp = exports.now = exports.uuidV4 = exports.genRandomUuid = exports.SQL_BRAND = exports.customType = void 0;
exports.pgComposite = pgComposite;
exports.generateCompositeTypeSQL = generateCompositeTypeSQL;
exports.sql = sql;
const column_builder_1 = require("./column-builder.cjs");
function pgComposite(name, fields) {
    const compositeFn = (columnName) => {
        const col = (0, column_builder_1.createColumnWithName)(name, columnName);
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
function generateCompositeTypeSQL(composite) {
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
const customType = (typeName, columnName) => (0, column_builder_1.createColumnWithName)(typeName, columnName);
exports.customType = customType;
exports.SQL_BRAND = Symbol.for('relq.sql.brand');
function sqlExpr(sql) {
    const branded = Object.create(null);
    Object.defineProperty(branded, '$sql', { value: sql, enumerable: false });
    return branded;
}
const genRandomUuid = () => sqlExpr('gen_random_uuid()');
exports.genRandomUuid = genRandomUuid;
const uuidV4 = () => sqlExpr('uuid_generate_v4()');
exports.uuidV4 = uuidV4;
const now = () => sqlExpr('NOW()');
exports.now = now;
const currentTimestamp = () => sqlExpr('CURRENT_TIMESTAMP');
exports.currentTimestamp = currentTimestamp;
const currentDate = () => sqlExpr('CURRENT_DATE');
exports.currentDate = currentDate;
const emptyObject = () => sqlExpr("'{}'");
exports.emptyObject = emptyObject;
const emptyArray = () => sqlExpr("'[]'");
exports.emptyArray = emptyArray;
function sql(strings, ...values) {
    let result = strings[0];
    for (let i = 0; i < values.length; i++) {
        result += String(values[i]) + strings[i + 1];
    }
    return sqlExpr(result);
}
const raw = (expression) => sqlExpr(expression);
exports.raw = raw;
const index = (name) => ({
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
exports.index = index;
