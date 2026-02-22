import { RelqPostgres } from "./pg-family/pg-client/index.js";
import { RelqNile } from "./pg-family/nile-client/index.js";
import { RelqDsql } from "./pg-family/dsql-client/index.js";
import { RelqCockroachDB } from "./pg-family/cockroachdb-client/index.js";
import { RelqConfigError } from "../errors/relq-errors.js";
class RelqImpl {
    constructor(schema, dialect, options) {
        const opts = options ?? {};
        switch (dialect) {
            case 'postgres':
                return new RelqPostgres(schema, { ...opts, dialect: 'postgres' });
            case 'nile':
                return new RelqNile(schema, { ...opts, dialect: 'nile' });
            case 'cockroachdb':
                return new RelqCockroachDB(schema, { ...opts, dialect: 'cockroachdb' });
            case 'awsdsql':
                return new RelqDsql(schema, { ...opts, dialect: 'awsdsql' });
            case 'sqlite':
                throw new RelqConfigError(`Dialect "sqlite" is not yet implemented. ` +
                    `Currently supported: postgres, nile, cockroachdb, awsdsql`, { field: 'dialect', value: dialect });
            case 'turso':
                throw new RelqConfigError(`Dialect "turso" is not yet implemented. ` +
                    `Currently supported: postgres, nile, cockroachdb, awsdsql`, { field: 'dialect', value: dialect });
            case 'mysql':
                throw new RelqConfigError(`Dialect "mysql" is not yet implemented. ` +
                    `Currently supported: postgres, nile, cockroachdb, awsdsql`, { field: 'dialect', value: dialect });
            case 'mariadb':
                throw new RelqConfigError(`Dialect "mariadb" is not yet implemented. ` +
                    `Currently supported: postgres, nile, cockroachdb, awsdsql`, { field: 'dialect', value: dialect });
            case 'planetscale':
                throw new RelqConfigError(`Dialect "planetscale" is not yet implemented. ` +
                    `Currently supported: postgres, nile, cockroachdb, awsdsql`, { field: 'dialect', value: dialect });
            case 'xata':
                throw new RelqConfigError(`Dialect "xata" is not yet implemented. ` +
                    `Currently supported: postgres, nile, cockroachdb, awsdsql`, { field: 'dialect', value: dialect });
            default:
                throw new RelqConfigError(`Unknown dialect: "${dialect}". ` +
                    `Supported dialects: postgres, nile, cockroachdb, awsdsql, sqlite, turso, mysql, mariadb, planetscale, xata`, { field: 'dialect', value: dialect });
        }
    }
}
export const Relq = RelqImpl;
export { RelqPostgres } from "./pg-family/pg-client/index.js";
export { RelqNile } from "./pg-family/nile-client/index.js";
export { RelqDsql } from "./pg-family/dsql-client/index.js";
export { RelqCockroachDB } from "./pg-family/cockroachdb-client/index.js";
export { RelqBase } from "./relq-base.js";
export default Relq;
