"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTableAccessor = createTableAccessor;
const ConnectedQueryBuilder_1 = require("../helpers/ConnectedQueryBuilder.cjs");
function createTableAccessor(relq, schema) {
    const tableFunction = (tableName) => {
        return new ConnectedQueryBuilder_1.ConnectedQueryBuilder(tableName, relq);
    };
    return new Proxy(tableFunction, {
        get(target, prop, receiver) {
            if (prop in target) {
                return Reflect.get(target, prop, receiver);
            }
            if (typeof prop === 'string' && schema && prop in schema) {
                const tableDef = schema[prop];
                const sqlTableName = tableDef?.$name || prop;
                return new ConnectedQueryBuilder_1.ConnectedQueryBuilder(sqlTableName, relq, prop);
            }
            return undefined;
        }
    });
}
