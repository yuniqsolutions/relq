"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelqBase = exports.RelqCockroachDB = exports.RelqDsql = exports.RelqNile = exports.RelqPostgres = exports.Relq = void 0;
const pg_client_1 = require("./pg-family/pg-client/index.cjs");
const nile_client_1 = require("./pg-family/nile-client/index.cjs");
const dsql_client_1 = require("./pg-family/dsql-client/index.cjs");
const cockroachdb_client_1 = require("./pg-family/cockroachdb-client/index.cjs");
const relq_errors_1 = require("../errors/relq-errors.cjs");
class RelqImpl {
    constructor(schema, dialect, options) {
        const opts = options ?? {};
        switch (dialect) {
            case 'postgres':
                return new pg_client_1.RelqPostgres(schema, { ...opts, dialect: 'postgres' });
            case 'nile':
                return new nile_client_1.RelqNile(schema, { ...opts, dialect: 'nile' });
            case 'cockroachdb':
                return new cockroachdb_client_1.RelqCockroachDB(schema, { ...opts, dialect: 'cockroachdb' });
            case 'awsdsql':
                return new dsql_client_1.RelqDsql(schema, { ...opts, dialect: 'awsdsql' });
            case 'sqlite':
                throw new relq_errors_1.RelqConfigError(`Dialect "sqlite" is not yet implemented. ` +
                    `Currently supported: postgres, nile, cockroachdb, awsdsql`, { field: 'dialect', value: dialect });
            case 'turso':
                throw new relq_errors_1.RelqConfigError(`Dialect "turso" is not yet implemented. ` +
                    `Currently supported: postgres, nile, cockroachdb, awsdsql`, { field: 'dialect', value: dialect });
            case 'mysql':
                throw new relq_errors_1.RelqConfigError(`Dialect "mysql" is not yet implemented. ` +
                    `Currently supported: postgres, nile, cockroachdb, awsdsql`, { field: 'dialect', value: dialect });
            case 'mariadb':
                throw new relq_errors_1.RelqConfigError(`Dialect "mariadb" is not yet implemented. ` +
                    `Currently supported: postgres, nile, cockroachdb, awsdsql`, { field: 'dialect', value: dialect });
            case 'planetscale':
                throw new relq_errors_1.RelqConfigError(`Dialect "planetscale" is not yet implemented. ` +
                    `Currently supported: postgres, nile, cockroachdb, awsdsql`, { field: 'dialect', value: dialect });
            case 'xata':
                throw new relq_errors_1.RelqConfigError(`Dialect "xata" is not yet implemented. ` +
                    `Currently supported: postgres, nile, cockroachdb, awsdsql`, { field: 'dialect', value: dialect });
            default:
                throw new relq_errors_1.RelqConfigError(`Unknown dialect: "${dialect}". ` +
                    `Supported dialects: postgres, nile, cockroachdb, awsdsql, sqlite, turso, mysql, mariadb, planetscale, xata`, { field: 'dialect', value: dialect });
        }
    }
}
exports.Relq = RelqImpl;
var pg_client_2 = require("./pg-family/pg-client/index.cjs");
Object.defineProperty(exports, "RelqPostgres", { enumerable: true, get: function () { return pg_client_2.RelqPostgres; } });
var nile_client_2 = require("./pg-family/nile-client/index.cjs");
Object.defineProperty(exports, "RelqNile", { enumerable: true, get: function () { return nile_client_2.RelqNile; } });
var dsql_client_2 = require("./pg-family/dsql-client/index.cjs");
Object.defineProperty(exports, "RelqDsql", { enumerable: true, get: function () { return dsql_client_2.RelqDsql; } });
var cockroachdb_client_2 = require("./pg-family/cockroachdb-client/index.cjs");
Object.defineProperty(exports, "RelqCockroachDB", { enumerable: true, get: function () { return cockroachdb_client_2.RelqCockroachDB; } });
var relq_base_1 = require("./relq-base.cjs");
Object.defineProperty(exports, "RelqBase", { enumerable: true, get: function () { return relq_base_1.RelqBase; } });
exports.default = exports.Relq;
