import { PgBase } from "../shared/pg-base.js";
import { NILE_CAPABILITIES } from "./capabilities.js";
import { TenantContext } from "./tenant-context.js";
import { mergeWithPgEnv, validateEnvConfig } from "../../../utils/env-resolver.js";
export class RelqNile extends PgBase {
    dialect = 'nile';
    capabilities = NILE_CAPABILITIES;
    tenantCtx = new TenantContext();
    constructor(schema, config = {}) {
        validateEnvConfig('nile', config);
        const resolvedConfig = mergeWithPgEnv({ ...config, dialect: 'nile' });
        super(schema, resolvedConfig);
    }
    get queryFn() {
        return async (sql) => { await this._executeQuery(sql); };
    }
    async setTenant(tenantId) {
        await this.ensureInitialized();
        await this.tenantCtx.setTenant(tenantId, this.queryFn);
    }
    async clearTenant() {
        await this.ensureInitialized();
        await this.tenantCtx.clearTenant(this.queryFn);
    }
    getTenantContext() {
        return this.tenantCtx.getTenantId();
    }
    async withTenant(tenantId, callback) {
        await this.ensureInitialized();
        return this.tenantCtx.withTenant(tenantId, this.queryFn, callback);
    }
}
