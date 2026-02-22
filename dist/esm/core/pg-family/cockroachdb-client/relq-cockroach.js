import { PgBase } from "../shared/pg-base.js";
import { COCKROACHDB_CAPABILITIES } from "./capabilities.js";
import { mergeWithPgEnv, validateEnvConfig } from "../../../utils/env-resolver.js";
export class RelqCockroachDB extends PgBase {
    dialect = 'cockroachdb';
    capabilities = COCKROACHDB_CAPABILITIES;
    constructor(schema, config = {}) {
        validateEnvConfig('cockroachdb', config);
        const resolvedConfig = mergeWithPgEnv({ ...config, dialect: 'cockroachdb' });
        super(schema, resolvedConfig);
    }
}
