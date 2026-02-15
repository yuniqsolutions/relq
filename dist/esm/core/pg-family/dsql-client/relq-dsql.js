import { PgBase } from "../shared/pg-base.js";
import { DSQL_CAPABILITIES } from "./capabilities.js";
import { mergeWithAwsEnv, validateEnvConfig } from "../../../utils/env-resolver.js";
export class RelqDsql extends PgBase {
    dialect = 'awsdsql';
    capabilities = DSQL_CAPABILITIES;
    constructor(schema, config = {}) {
        validateEnvConfig('awsdsql', config);
        const resolvedConfig = mergeWithAwsEnv({ ...config, dialect: 'awsdsql' });
        super(schema, resolvedConfig);
    }
}
