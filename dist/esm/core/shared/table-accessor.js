import { ConnectedQueryBuilder } from "../helpers/ConnectedQueryBuilder.js";
export function createTableAccessor(relq, schema) {
    const tableFunction = (tableName) => {
        return new ConnectedQueryBuilder(tableName, relq);
    };
    return new Proxy(tableFunction, {
        get(target, prop, receiver) {
            if (prop in target) {
                return Reflect.get(target, prop, receiver);
            }
            if (typeof prop === 'string' && schema && prop in schema) {
                const tableDef = schema[prop];
                const sqlTableName = tableDef?.$name || prop;
                return new ConnectedQueryBuilder(sqlTableName, relq, prop);
            }
            return undefined;
        }
    });
}
