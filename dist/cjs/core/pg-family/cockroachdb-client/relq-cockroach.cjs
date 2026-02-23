"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelqCockroachDB = void 0;
const pg_base_1 = require("../shared/pg-base.cjs");
const capabilities_1 = require("./capabilities.cjs");
const env_resolver_1 = require("../../../utils/env-resolver.cjs");
class RelqCockroachDB extends pg_base_1.PgBase {
    dialect = 'cockroachdb';
    capabilities = capabilities_1.COCKROACHDB_CAPABILITIES;
    constructor(schema, config = {}) {
        (0, env_resolver_1.validateEnvConfig)('cockroachdb', config);
        const resolvedConfig = (0, env_resolver_1.mergeWithPgEnv)({ ...config, dialect: 'cockroachdb' });
        super(schema, resolvedConfig);
    }
}
exports.RelqCockroachDB = RelqCockroachDB;
