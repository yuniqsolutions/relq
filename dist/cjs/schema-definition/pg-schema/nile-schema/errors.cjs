"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NILE_ALL_RULES = exports.NILE_CON_RULES = exports.NILE_ADM_RULES = exports.NILE_TX_RULES = exports.NILE_BT_RULES = exports.NILE_EXT_RULES = exports.NILE_SEQ_RULES = exports.NILE_TF_RULES = exports.NILE_CT_RULES = exports.NILE_FK_RULES = exports.NILE_PK_RULES = exports.NILE_TC_RULES = void 0;
exports.createNileValidationResult = createNileValidationResult;
exports.lookupNileRule = lookupNileRule;
exports.createNileMessage = createNileMessage;
exports.formatNileMessage = formatNileMessage;
exports.formatNileValidationResult = formatNileValidationResult;
const NILE_DOCS_COMPAT = 'https://www.thenile.dev/docs/postgres/postgres-compatibility';
const NILE_DOCS_TENANTS = 'https://www.thenile.dev/docs/tenant-virtualization';
const NILE_DOCS_EXTENSIONS = 'https://www.thenile.dev/docs/postgres/extensions';
const NILE_DOCS_BUILTIN = 'https://www.thenile.dev/docs/tenant-virtualization/built-in-tables';
const NILE_DOCS_TRANSACTIONS = 'https://www.thenile.dev/docs/tenant-virtualization/transactions';
exports.NILE_TC_RULES = {
    'NILE-TC-001': {
        code: 'NILE-TC-001',
        severity: 'info',
        message: 'Tenant table detected (has tenant_id column). Automatic classification.',
        alternative: 'No action required. Tables with a tenant_id column are automatically treated as tenant-aware.',
        category: 'table-classification',
        docsUrl: NILE_DOCS_TENANTS,
    },
    'NILE-TC-002': {
        code: 'NILE-TC-002',
        severity: 'error',
        message: 'Column "tenant_id" must be UUID type, found: {actual_type}',
        alternative: 'Change tenant_id column type to UUID',
        category: 'table-classification',
        docsUrl: NILE_DOCS_TENANTS,
    },
    'NILE-TC-003': {
        code: 'NILE-TC-003',
        severity: 'error',
        message: 'Column "tenant_id" must be NOT NULL on tenant-aware tables',
        alternative: 'Add NOT NULL constraint to tenant_id column',
        category: 'table-classification',
        docsUrl: NILE_DOCS_TENANTS,
    },
};
exports.NILE_PK_RULES = {
    'NILE-PK-001': {
        code: 'NILE-PK-001',
        severity: 'error',
        message: 'Table PRIMARY KEY does not include tenant_id. Fix: PRIMARY KEY (tenant_id, id)',
        alternative: 'Add tenant_id as the first column in the composite PRIMARY KEY',
        category: 'primary-key',
        docsUrl: NILE_DOCS_TENANTS,
        autoFix: {
            description: 'Add tenant_id to PRIMARY KEY',
            originalType: 'PRIMARY KEY (id)',
            replacementType: 'PRIMARY KEY (tenant_id, id)',
            additionalChanges: ['Ensure tenant_id column exists as UUID NOT NULL'],
        },
    },
    'NILE-PK-002': {
        code: 'NILE-PK-002',
        severity: 'warning',
        message: 'tenant_id should be the first column in PRIMARY KEY for optimal index performance',
        alternative: 'Reorder PRIMARY KEY columns so tenant_id comes first',
        category: 'primary-key',
        docsUrl: NILE_DOCS_TENANTS,
    },
    'NILE-PK-003': {
        code: 'NILE-PK-003',
        severity: 'error',
        message: 'Tenant-aware tables require a composite PRIMARY KEY including tenant_id',
        alternative: 'Change from single-column PK to composite: PRIMARY KEY (tenant_id, id)',
        category: 'primary-key',
        docsUrl: NILE_DOCS_TENANTS,
    },
    'NILE-PK-004': {
        code: 'NILE-PK-004',
        severity: 'error',
        message: 'Tenant-aware table has no PRIMARY KEY defined. Add: PRIMARY KEY (tenant_id, id)',
        alternative: 'Define a composite PRIMARY KEY including tenant_id',
        category: 'primary-key',
        docsUrl: NILE_DOCS_TENANTS,
    },
};
exports.NILE_FK_RULES = {
    'NILE-FK-001': {
        code: 'NILE-FK-001',
        severity: 'error',
        message: 'Foreign key from tenant table to shared table is not supported in Nile',
        alternative: 'Remove the FK constraint and enforce referential integrity in application code',
        category: 'foreign-key',
        docsUrl: NILE_DOCS_COMPAT,
    },
    'NILE-FK-002': {
        code: 'NILE-FK-002',
        severity: 'error',
        message: 'Foreign key from shared table to tenant table is not supported in Nile',
        alternative: 'Remove the FK constraint and enforce referential integrity in application code',
        category: 'foreign-key',
        docsUrl: NILE_DOCS_COMPAT,
    },
    'NILE-FK-003': {
        code: 'NILE-FK-003',
        severity: 'error',
        message: 'Foreign key between tenant tables must include tenant_id on both sides',
        alternative: 'Add tenant_id to both the referencing and referenced column lists',
        category: 'foreign-key',
        docsUrl: NILE_DOCS_TENANTS,
    },
    'NILE-FK-004': {
        code: 'NILE-FK-004',
        severity: 'warning',
        message: 'FK cascade is tenant-scoped. Cascade will only affect rows belonging to the same tenant.',
        alternative: 'No action required, but be aware that CASCADE only operates within tenant boundaries',
        category: 'foreign-key',
        docsUrl: NILE_DOCS_TENANTS,
    },
};
exports.NILE_CT_RULES = {
    'NILE-CT-001': {
        code: 'NILE-CT-001',
        severity: 'error',
        message: 'Sequence-based column types are not available on tenant-aware tables. Use UUID with gen_random_uuid() instead.',
        alternative: 'uuid().default(DEFAULT.genRandomUuid())',
        category: 'column-type',
        docsUrl: NILE_DOCS_COMPAT,
        autoFix: {
            description: 'Replace SERIAL/BIGSERIAL/SMALLSERIAL with UUID + gen_random_uuid()',
            originalType: 'serial',
            replacementType: 'uuid',
            additionalChanges: ['Add .default(DEFAULT.genRandomUuid())'],
        },
    },
    'NILE-CT-002': {
        code: 'NILE-CT-002',
        severity: 'error',
        message: 'Identity columns use sequences internally, not available for tenant tables.',
        alternative: 'uuid().default(DEFAULT.genRandomUuid())',
        category: 'column-type',
        docsUrl: NILE_DOCS_COMPAT,
        autoFix: {
            description: 'Replace GENERATED AS IDENTITY with UUID + gen_random_uuid()',
            originalType: 'GENERATED AS IDENTITY',
            replacementType: 'uuid',
            additionalChanges: ['Remove identity modifier', 'Add .default(DEFAULT.genRandomUuid())'],
        },
    },
    'NILE-CT-003': {
        code: 'NILE-CT-003',
        severity: 'error',
        message: 'DEFAULT nextval() is not available on tenant-aware tables. Use gen_random_uuid() instead.',
        alternative: 'uuid().default(DEFAULT.genRandomUuid())',
        category: 'column-type',
        docsUrl: NILE_DOCS_COMPAT,
    },
    'NILE-CT-004': {
        code: 'NILE-CT-004',
        severity: 'info',
        message: 'All PostgreSQL 15 column types (except sequence-based on tenant tables) are supported.',
        alternative: 'No action required.',
        category: 'column-type',
        docsUrl: NILE_DOCS_COMPAT,
    },
    'NILE-CT-005': {
        code: 'NILE-CT-005',
        severity: 'info',
        message: 'Extension column types (VECTOR, GEOMETRY, GEOGRAPHY, CITEXT) are available without CREATE EXTENSION.',
        alternative: 'No action required. Use extension types directly.',
        category: 'column-type',
        docsUrl: NILE_DOCS_EXTENSIONS,
    },
};
exports.NILE_TF_RULES = {
    'NILE-TF-001': {
        code: 'NILE-TF-001',
        severity: 'error',
        message: 'Triggers are not supported on Nile. Move trigger logic to application code.',
        alternative: 'Implement trigger logic in application middleware or event handlers',
        category: 'trigger-function',
        docsUrl: NILE_DOCS_COMPAT,
    },
    'NILE-TF-002': {
        code: 'NILE-TF-002',
        severity: 'error',
        message: 'User-defined functions are not supported on Nile. Move function logic to application code.',
        alternative: 'Implement function logic in application layer',
        category: 'trigger-function',
        docsUrl: NILE_DOCS_COMPAT,
    },
    'NILE-TF-003': {
        code: 'NILE-TF-003',
        severity: 'error',
        message: 'Stored procedures are not supported on Nile. Move procedure logic to application code.',
        alternative: 'Implement procedure logic in application layer',
        category: 'trigger-function',
        docsUrl: NILE_DOCS_COMPAT,
    },
    'NILE-TF-004': {
        code: 'NILE-TF-004',
        severity: 'error',
        message: 'Anonymous code blocks (DO $$) are not supported on Nile. Execute statements separately.',
        alternative: 'Break DO $$ block into individual SQL statements',
        category: 'trigger-function',
        docsUrl: NILE_DOCS_COMPAT,
    },
    'NILE-TF-005': {
        code: 'NILE-TF-005',
        severity: 'error',
        message: 'PL/pgSQL is not available on Nile.',
        alternative: 'Use LANGUAGE SQL or move logic to application code',
        category: 'trigger-function',
        docsUrl: NILE_DOCS_COMPAT,
    },
};
exports.NILE_SEQ_RULES = {
    'NILE-SEQ-001': {
        code: 'NILE-SEQ-001',
        severity: 'error',
        message: 'Sequences are only available for shared tables in Nile.',
        alternative: 'Use UUID with gen_random_uuid() for tenant table IDs',
        category: 'sequence',
        docsUrl: NILE_DOCS_COMPAT,
    },
    'NILE-SEQ-002': {
        code: 'NILE-SEQ-002',
        severity: 'warning',
        message: 'Standalone sequences can only be used by shared tables.',
        alternative: 'Ensure this sequence is only referenced by shared (non-tenant) tables',
        category: 'sequence',
        docsUrl: NILE_DOCS_COMPAT,
    },
    'NILE-SEQ-003': {
        code: 'NILE-SEQ-003',
        severity: 'info',
        message: 'SERIAL/BIGSERIAL on shared tables is supported.',
        alternative: 'No action required. Sequence-based types work on shared tables.',
        category: 'sequence',
        docsUrl: NILE_DOCS_COMPAT,
    },
    'NILE-SEQ-004': {
        code: 'NILE-SEQ-004',
        severity: 'error',
        message: 'Sequences cannot be owned by tenant table columns.',
        alternative: 'Remove OWNED BY or change ownership to a shared table column',
        category: 'sequence',
        docsUrl: NILE_DOCS_COMPAT,
    },
};
exports.NILE_EXT_RULES = {
    'NILE-EXT-001': {
        code: 'NILE-EXT-001',
        severity: 'info',
        message: 'CREATE EXTENSION skipped -- extensions are pre-installed in Nile.',
        alternative: 'No action required. Remove CREATE EXTENSION statements.',
        category: 'extension',
        docsUrl: NILE_DOCS_EXTENSIONS,
    },
    'NILE-EXT-002': {
        code: 'NILE-EXT-002',
        severity: 'warning',
        message: 'DROP EXTENSION skipped. Pre-installed extensions cannot be removed.',
        alternative: 'Remove DROP EXTENSION statements',
        category: 'extension',
        docsUrl: NILE_DOCS_EXTENSIONS,
    },
};
exports.NILE_BT_RULES = {
    'NILE-BT-001': {
        code: 'NILE-BT-001',
        severity: 'error',
        message: 'Table is a Nile built-in table and already exists. Use ALTER TABLE to add extension columns.',
        alternative: 'Use ALTER TABLE to add custom columns to the built-in table',
        category: 'built-in-table',
        docsUrl: NILE_DOCS_BUILTIN,
    },
    'NILE-BT-002': {
        code: 'NILE-BT-002',
        severity: 'error',
        message: 'Table is a Nile built-in table and cannot be dropped.',
        alternative: 'Remove the DROP TABLE statement for this built-in table',
        category: 'built-in-table',
        docsUrl: NILE_DOCS_BUILTIN,
    },
    'NILE-BT-003': {
        code: 'NILE-BT-003',
        severity: 'warning',
        message: 'Only user-added extension columns can be modified on built-in tables.',
        alternative: 'Ensure you are only modifying columns you added, not built-in columns',
        category: 'built-in-table',
        docsUrl: NILE_DOCS_BUILTIN,
    },
    'NILE-BT-004': {
        code: 'NILE-BT-004',
        severity: 'error',
        message: 'Cannot drop or rename tenant_id column. It is required for tenant isolation in Nile.',
        alternative: 'Keep the tenant_id column as-is. It is managed by Nile.',
        category: 'built-in-table',
        docsUrl: NILE_DOCS_TENANTS,
    },
};
exports.NILE_TX_RULES = {
    'NILE-TX-001': {
        code: 'NILE-TX-001',
        severity: 'warning',
        message: 'Writes to tenant tables must be within a single tenant context at runtime.',
        alternative: 'Set nile.tenant_id before writing to tenant tables: SET nile.tenant_id = :tenantId',
        category: 'transaction',
        docsUrl: NILE_DOCS_TRANSACTIONS,
    },
    'NILE-TX-002': {
        code: 'NILE-TX-002',
        severity: 'warning',
        message: 'Nile does not support writing to both tenant and shared tables in the same transaction.',
        alternative: 'Split tenant and shared table writes into separate transactions',
        category: 'transaction',
        docsUrl: NILE_DOCS_TRANSACTIONS,
    },
    'NILE-TX-003': {
        code: 'NILE-TX-003',
        severity: 'info',
        message: 'DDL changes will be applied to all tenants atomically via pg_karnak.',
        alternative: 'No action required. Schema changes propagate automatically.',
        category: 'transaction',
        docsUrl: NILE_DOCS_TRANSACTIONS,
    },
};
exports.NILE_ADM_RULES = {
    'NILE-ADM-001': {
        code: 'NILE-ADM-001',
        severity: 'error',
        message: 'User and role management must be done through Nile Console or API.',
        alternative: 'Use Nile Console or Nile SDK for user/role management',
        category: 'admin',
        docsUrl: NILE_DOCS_COMPAT,
    },
    'NILE-ADM-002': {
        code: 'NILE-ADM-002',
        severity: 'error',
        message: 'Database creation must be done through Nile Console.',
        alternative: 'Use Nile Console to create databases',
        category: 'admin',
        docsUrl: NILE_DOCS_COMPAT,
    },
    'NILE-ADM-003': {
        code: 'NILE-ADM-003',
        severity: 'error',
        message: 'Permission management must be done through Nile Console.',
        alternative: 'Use Nile Console for GRANT/REVOKE operations',
        category: 'admin',
        docsUrl: NILE_DOCS_COMPAT,
    },
    'NILE-ADM-004': {
        code: 'NILE-ADM-004',
        severity: 'error',
        message: 'Row-Level Security is not supported on Nile. Use SET nile.tenant_id for tenant isolation.',
        alternative: 'Use SET nile.tenant_id = :tenantId for tenant isolation instead of RLS policies',
        category: 'admin',
        docsUrl: NILE_DOCS_TENANTS,
    },
};
exports.NILE_CON_RULES = {
    'NILE-CON-001': {
        code: 'NILE-CON-001',
        severity: 'error',
        message: 'UNIQUE constraint on tenant table must include tenant_id for tenant-scoped uniqueness.',
        alternative: 'Add tenant_id to the UNIQUE constraint: UNIQUE(tenant_id, ...columns)',
        category: 'constraint',
        docsUrl: NILE_DOCS_TENANTS,
        autoFix: {
            description: 'Add tenant_id to UNIQUE constraint',
            originalType: 'UNIQUE(column)',
            replacementType: 'UNIQUE(tenant_id, column)',
            additionalChanges: ['Ensure tenant_id column exists as UUID NOT NULL'],
        },
    },
    'NILE-CON-002': {
        code: 'NILE-CON-002',
        severity: 'warning',
        message: 'tenant_id should be the first column in UNIQUE constraint for optimal index performance.',
        alternative: 'Reorder UNIQUE constraint columns so tenant_id comes first',
        category: 'constraint',
        docsUrl: NILE_DOCS_TENANTS,
    },
    'NILE-CON-003': {
        code: 'NILE-CON-003',
        severity: 'error',
        message: 'EXCLUSION constraint on tenant table must include tenant_id for tenant-scoped exclusion.',
        alternative: 'Add tenant_id to the EXCLUSION constraint with the = operator',
        category: 'constraint',
        docsUrl: NILE_DOCS_TENANTS,
    },
    'NILE-CON-004': {
        code: 'NILE-CON-004',
        severity: 'info',
        message: 'Constraint on shared table has no tenant-scoping requirements.',
        alternative: 'No action required.',
        category: 'constraint',
        docsUrl: NILE_DOCS_COMPAT,
    },
};
exports.NILE_ALL_RULES = {
    ...exports.NILE_TC_RULES,
    ...exports.NILE_PK_RULES,
    ...exports.NILE_FK_RULES,
    ...exports.NILE_CT_RULES,
    ...exports.NILE_TF_RULES,
    ...exports.NILE_SEQ_RULES,
    ...exports.NILE_EXT_RULES,
    ...exports.NILE_BT_RULES,
    ...exports.NILE_TX_RULES,
    ...exports.NILE_ADM_RULES,
    ...exports.NILE_CON_RULES,
};
function createNileValidationResult(messages) {
    const errors = messages.filter(m => m.severity === 'error');
    const warnings = messages.filter(m => m.severity === 'warning');
    const info = messages.filter(m => m.severity === 'info');
    return {
        valid: errors.length === 0,
        errors,
        warnings,
        info,
        all: messages,
    };
}
function lookupNileRule(code) {
    return exports.NILE_ALL_RULES[code];
}
function createNileMessage(code, location) {
    const def = exports.NILE_ALL_RULES[code];
    if (!def) {
        return {
            code,
            severity: 'error',
            message: `Unknown Nile validation rule: ${code}`,
            ...location,
        };
    }
    return {
        code: def.code,
        severity: def.severity,
        message: def.message,
        alternative: def.alternative,
        category: def.category,
        docsUrl: def.docsUrl,
        ...location,
    };
}
function formatNileMessage(msg) {
    const prefix = msg.severity === 'error' ? 'ERROR' : msg.severity === 'warning' ? 'WARN' : 'INFO';
    const location = [msg.tableName, msg.columnName ?? msg.constraintName ?? msg.functionName]
        .filter(Boolean)
        .join('.');
    const parts = [`[${prefix}] ${msg.code}: ${msg.message}`];
    if (location)
        parts.push(`  Location: ${location}`);
    if (msg.alternative)
        parts.push(`  Alternative: ${msg.alternative}`);
    if (msg.docsUrl)
        parts.push(`  Docs: ${msg.docsUrl}`);
    return parts.join('\n');
}
function formatNileValidationResult(result) {
    const lines = [];
    if (result.errors.length > 0) {
        lines.push(`=== ${result.errors.length} Error(s) ===`);
        for (const msg of result.errors) {
            lines.push(formatNileMessage(msg));
            lines.push('');
        }
    }
    if (result.warnings.length > 0) {
        lines.push(`=== ${result.warnings.length} Warning(s) ===`);
        for (const msg of result.warnings) {
            lines.push(formatNileMessage(msg));
            lines.push('');
        }
    }
    if (result.info.length > 0) {
        lines.push(`=== ${result.info.length} Info(s) ===`);
        for (const msg of result.info) {
            lines.push(formatNileMessage(msg));
            lines.push('');
        }
    }
    if (result.valid && result.warnings.length === 0 && result.info.length === 0) {
        lines.push('Schema is fully Nile-compatible.');
    }
    return lines.join('\n');
}
