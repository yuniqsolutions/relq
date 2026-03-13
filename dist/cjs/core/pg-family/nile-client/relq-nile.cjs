"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelqNile = void 0;
const pg_base_1 = require("../shared/pg-base.cjs");
const capabilities_1 = require("./capabilities.cjs");
const tenant_context_1 = require("./tenant-context.cjs");
const env_resolver_1 = require("../../../utils/env-resolver.cjs");
class RelqNile extends pg_base_1.PgBase {
    dialect = 'nile';
    capabilities = capabilities_1.NILE_CAPABILITIES;
    tenantCtx = new tenant_context_1.TenantContext();
    constructor(schema, config = {}) {
        (0, env_resolver_1.validateEnvConfig)('nile', config);
        const resolvedConfig = (0, env_resolver_1.mergeWithPgEnv)({ ...config, dialect: 'nile' });
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
exports.RelqNile = RelqNile;
