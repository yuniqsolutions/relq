export const NILE_BUILTIN_TABLES = new Set([
    'tenants',
    'users',
    'tenant_users',
]);
export const NILE_BUILTIN_COLUMNS = {
    tenants: ['id', 'name', 'created', 'updated', 'deleted'],
    users: ['id', 'name', 'email', 'created', 'updated', 'picture', 'given_name', 'family_name'],
    tenant_users: ['tenant_id', 'user_id', 'email', 'created', 'updated', 'roles'],
};
export const NILE_RESERVED_COLUMNS = new Set([
    'tenant_id',
]);
export const NILE_PREINSTALLED_EXTENSIONS = new Set([
    'pgvector',
    'postgis',
    'postgis_raster',
    'postgis_topology',
    'pg_trgm',
    'citext',
    'uuid-ossp',
    'pgcrypto',
    'hstore',
    'ltree',
    'fuzzystrmatch',
    'tablefunc',
    'cube',
    'earthdistance',
]);
export const NILE_TENANT_ID_REQUIREMENTS = {
    COLUMN_NAME: 'tenant_id',
    COLUMN_TYPE: 'uuid',
    NULLABLE: false,
    MUST_BE_IN_PK: true,
    RECOMMENDED_PK_POSITION: 0,
};
export const NILE_BLOCKED_FEATURES = new Set([
    'trigger',
    'function',
    'procedure',
    'do_block',
    'plpgsql',
    'rls',
    'create_user',
    'create_role',
    'create_database',
    'grant',
    'revoke',
]);
export const NILE_SEQUENCE_RESTRICTIONS = {
    ALLOWED_ON_TENANT_TABLES: false,
    ALLOWED_ON_SHARED_TABLES: true,
    SERIAL_ON_TENANT: false,
    SERIAL_ON_SHARED: true,
    IDENTITY_ON_TENANT: false,
    IDENTITY_ON_SHARED: true,
};
export const NILE_SUPPORTED_INDEX_METHODS = new Set([
    'btree',
    'hash',
    'gin',
    'gist',
    'spgist',
    'brin',
]);
export const NILE_SUPPORTED_PG_VERSION = '15';
