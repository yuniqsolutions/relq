import { RelqConfigError } from "../../../errors/relq-errors.js";
function escapeTenantId(value) {
    if (value.includes('\0')) {
        throw new RelqConfigError('Tenant ID cannot contain null bytes', {
            field: 'tenantId',
            value: '<contains null byte>'
        });
    }
    return value.replace(/'/g, "''");
}
export class TenantContext {
    currentTenantId = null;
    async setTenant(tenantId, queryFn) {
        const escapedId = escapeTenantId(tenantId);
        await queryFn(`SET nile.tenant_id = '${escapedId}'`);
        this.currentTenantId = tenantId;
    }
    async clearTenant(queryFn) {
        await queryFn('RESET nile.tenant_id');
        this.currentTenantId = null;
    }
    getTenantId() {
        return this.currentTenantId;
    }
    async withTenant(tenantId, queryFn, callback) {
        const previousTenantId = this.currentTenantId;
        try {
            await this.setTenant(tenantId, queryFn);
            return await callback();
        }
        finally {
            if (previousTenantId) {
                await this.setTenant(previousTenantId, queryFn);
            }
            else {
                await this.clearTenant(queryFn);
            }
        }
    }
}
