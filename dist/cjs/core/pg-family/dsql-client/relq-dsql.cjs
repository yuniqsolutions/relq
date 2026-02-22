"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelqDsql = void 0;
const pg_base_1 = require("../shared/pg-base.cjs");
const capabilities_1 = require("./capabilities.cjs");
const env_resolver_1 = require("../../../utils/env-resolver.cjs");
class RelqDsql extends pg_base_1.PgBase {
    dialect = 'awsdsql';
    capabilities = capabilities_1.DSQL_CAPABILITIES;
    constructor(schema, config = {}) {
        (0, env_resolver_1.validateEnvConfig)('awsdsql', config);
        const resolvedConfig = (0, env_resolver_1.mergeWithAwsEnv)({ ...config, dialect: 'awsdsql' });
        super(schema, resolvedConfig);
    }
}
exports.RelqDsql = RelqDsql;
