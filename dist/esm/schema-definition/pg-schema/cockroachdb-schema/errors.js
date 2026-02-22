export function createValidationResult(messages) {
    const errors = messages.filter(m => m.severity === 'error');
    const warnings = messages.filter(m => m.severity === 'warning');
    const info = messages.filter(m => m.severity === 'info');
    return {
        errors,
        warnings,
        info,
        hasErrors: errors.length > 0,
        hasWarnings: warnings.length > 0,
        totalIssues: messages.length,
    };
}
export const CRDB_ERRORS = {
    CRDB_E001: {
        code: 'CRDB_E001',
        severity: 'error',
        message: 'MONEY type is not supported in CockroachDB.',
        alternative: 'Use numeric({ precision: 19, scale: 4 }).',
        category: 'Numeric',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/data-types',
    },
    CRDB_E002: {
        code: 'CRDB_E002',
        severity: 'error',
        message: 'XML type is not supported in CockroachDB.',
        alternative: 'Use text() to store XML data.',
        category: 'Document',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/data-types',
    },
    CRDB_E003: {
        code: 'CRDB_E003',
        severity: 'error',
        message: 'POINT type is not supported in CockroachDB.',
        alternative: 'Use GEOMETRY(Point, 4326) or jsonb() for coordinate data.',
        category: 'Geometric',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/spatial-features',
    },
    CRDB_E004: {
        code: 'CRDB_E004',
        severity: 'error',
        message: 'LINE type is not supported in CockroachDB.',
        alternative: 'Use GEOMETRY(LineString, 4326).',
        category: 'Geometric',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/spatial-features',
    },
    CRDB_E005: {
        code: 'CRDB_E005',
        severity: 'error',
        message: 'LSEG type is not supported in CockroachDB.',
        alternative: 'Use GEOMETRY(LineString, 4326).',
        category: 'Geometric',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/spatial-features',
    },
    CRDB_E006: {
        code: 'CRDB_E006',
        severity: 'error',
        message: 'BOX type is not supported in CockroachDB.',
        alternative: 'Use GEOMETRY(Polygon, 4326).',
        category: 'Geometric',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/spatial-features',
    },
    CRDB_E007: {
        code: 'CRDB_E007',
        severity: 'error',
        message: 'PATH type is not supported in CockroachDB.',
        alternative: 'Use GEOMETRY(LineString, 4326).',
        category: 'Geometric',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/spatial-features',
    },
    CRDB_E008: {
        code: 'CRDB_E008',
        severity: 'error',
        message: 'POLYGON type is not supported in CockroachDB.',
        alternative: 'Use GEOMETRY(Polygon, 4326).',
        category: 'Geometric',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/spatial-features',
    },
    CRDB_E009: {
        code: 'CRDB_E009',
        severity: 'error',
        message: 'CIRCLE type is not supported in CockroachDB.',
        alternative: 'Use GEOMETRY(Point, 4326) with a separate radius column.',
        category: 'Geometric',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/spatial-features',
    },
    CRDB_E010: {
        code: 'CRDB_E010',
        severity: 'error',
        message: 'CIDR type is not supported in CockroachDB.',
        alternative: 'Use text() or varchar().',
        category: 'Network',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/data-types',
    },
    CRDB_E011: {
        code: 'CRDB_E011',
        severity: 'error',
        message: 'MACADDR type is not supported in CockroachDB.',
        alternative: 'Use varchar({ length: 17 }).',
        category: 'Network',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/data-types',
    },
    CRDB_E012: {
        code: 'CRDB_E012',
        severity: 'error',
        message: 'MACADDR8 type is not supported in CockroachDB.',
        alternative: 'Use varchar({ length: 23 }).',
        category: 'Network',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/data-types',
    },
    CRDB_E013: {
        code: 'CRDB_E013',
        severity: 'error',
        message: 'INT4RANGE type is not supported in CockroachDB.',
        alternative: 'Use two integer() columns (lower, upper).',
        category: 'Range',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/data-types',
    },
    CRDB_E014: {
        code: 'CRDB_E014',
        severity: 'error',
        message: 'INT8RANGE type is not supported in CockroachDB.',
        alternative: 'Use two bigint() columns (lower, upper).',
        category: 'Range',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/data-types',
    },
    CRDB_E015: {
        code: 'CRDB_E015',
        severity: 'error',
        message: 'NUMRANGE type is not supported in CockroachDB.',
        alternative: 'Use two numeric() columns (lower, upper).',
        category: 'Range',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/data-types',
    },
    CRDB_E016: {
        code: 'CRDB_E016',
        severity: 'error',
        message: 'TSRANGE type is not supported in CockroachDB.',
        alternative: 'Use two timestamp() columns (lower, upper).',
        category: 'Range',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/data-types',
    },
    CRDB_E017: {
        code: 'CRDB_E017',
        severity: 'error',
        message: 'TSTZRANGE type is not supported in CockroachDB.',
        alternative: 'Use two timestamptz() columns (lower, upper).',
        category: 'Range',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/data-types',
    },
    CRDB_E018: {
        code: 'CRDB_E018',
        severity: 'error',
        message: 'DATERANGE type is not supported in CockroachDB.',
        alternative: 'Use two date() columns (lower, upper).',
        category: 'Range',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/data-types',
    },
    CRDB_E019: {
        code: 'CRDB_E019',
        severity: 'error',
        message: 'INT4MULTIRANGE type is not supported in CockroachDB.',
        alternative: 'Use multiple rows or a JSONB array.',
        category: 'Multirange',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/data-types',
    },
    CRDB_E020: {
        code: 'CRDB_E020',
        severity: 'error',
        message: 'INT8MULTIRANGE type is not supported in CockroachDB.',
        alternative: 'Use multiple rows or a JSONB array.',
        category: 'Multirange',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/data-types',
    },
    CRDB_E021: {
        code: 'CRDB_E021',
        severity: 'error',
        message: 'NUMMULTIRANGE type is not supported in CockroachDB.',
        alternative: 'Use multiple rows or a JSONB array.',
        category: 'Multirange',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/data-types',
    },
    CRDB_E022: {
        code: 'CRDB_E022',
        severity: 'error',
        message: 'TSMULTIRANGE type is not supported in CockroachDB.',
        alternative: 'Use multiple rows or a JSONB array.',
        category: 'Multirange',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/data-types',
    },
    CRDB_E023: {
        code: 'CRDB_E023',
        severity: 'error',
        message: 'TSTZMULTIRANGE type is not supported in CockroachDB.',
        alternative: 'Use multiple rows or a JSONB array.',
        category: 'Multirange',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/data-types',
    },
    CRDB_E024: {
        code: 'CRDB_E024',
        severity: 'error',
        message: 'DATEMULTIRANGE type is not supported in CockroachDB.',
        alternative: 'Use multiple rows or a JSONB array.',
        category: 'Multirange',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/data-types',
    },
    CRDB_E025: {
        code: 'CRDB_E025',
        severity: 'error',
        message: 'TSVECTOR type is not supported in CockroachDB.',
        alternative: 'Use inverted indexes on text or JSONB columns.',
        category: 'TextSearch',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/inverted-indexes',
    },
    CRDB_E026: {
        code: 'CRDB_E026',
        severity: 'error',
        message: 'TSQUERY type is not supported in CockroachDB.',
        alternative: 'Use application-layer search (Elasticsearch, Meilisearch).',
        category: 'TextSearch',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/inverted-indexes',
    },
    CRDB_E027: {
        code: 'CRDB_E027',
        severity: 'error',
        message: 'OID type is not supported in CockroachDB.',
        alternative: 'Use integer() or bigint().',
        category: 'Internal',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/data-types',
    },
    CRDB_E028: {
        code: 'CRDB_E028',
        severity: 'error',
        message: 'REGCLASS type is not supported in CockroachDB.',
        alternative: 'Use text().',
        category: 'Internal',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/data-types',
    },
    CRDB_E029: {
        code: 'CRDB_E029',
        severity: 'error',
        message: 'REGPROC type is not supported in CockroachDB.',
        alternative: 'Use text().',
        category: 'Internal',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/data-types',
    },
    CRDB_E030: {
        code: 'CRDB_E030',
        severity: 'error',
        message: 'REGTYPE type is not supported in CockroachDB.',
        alternative: 'Use text().',
        category: 'Internal',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/data-types',
    },
    CRDB_E031: {
        code: 'CRDB_E031',
        severity: 'error',
        message: 'PG_LSN type is not supported in CockroachDB.',
        alternative: 'Not applicable in CockroachDB (no WAL).',
        category: 'Internal',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/data-types',
    },
    CRDB_E032: {
        code: 'CRDB_E032',
        severity: 'error',
        message: 'PG_SNAPSHOT type is not supported in CockroachDB.',
        alternative: 'Not applicable in CockroachDB.',
        category: 'Internal',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/data-types',
    },
    CRDB_E100: {
        code: 'CRDB_E100',
        severity: 'error',
        message: 'EXCLUSION constraints are not supported in CockroachDB.',
        alternative: 'Use a BEFORE INSERT trigger or application-level check.',
        category: 'Constraint',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/known-limitations',
    },
    CRDB_E101: {
        code: 'CRDB_E101',
        severity: 'error',
        message: 'DEFERRABLE constraints are not supported in CockroachDB.',
        alternative: 'Restructure INSERT order to satisfy foreign keys, or use nullable FK columns.',
        category: 'Constraint',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/known-limitations',
    },
    CRDB_E102: {
        code: 'CRDB_E102',
        severity: 'error',
        message: 'INITIALLY DEFERRED constraints are not supported in CockroachDB.',
        alternative: 'Restructure INSERT order to satisfy foreign keys, or use nullable FK columns.',
        category: 'Constraint',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/known-limitations',
    },
    CRDB_E103: {
        code: 'CRDB_E103',
        severity: 'error',
        message: 'MATCH PARTIAL is not supported in CockroachDB.',
        alternative: 'Use MATCH SIMPLE (default) or MATCH FULL.',
        category: 'Constraint',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/foreign-key',
    },
    CRDB_E104: {
        code: 'CRDB_E104',
        severity: 'error',
        message: 'NOT ENFORCED constraints are not supported in CockroachDB.',
        alternative: 'Remove the constraint or keep it enforced.',
        category: 'Constraint',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/known-limitations',
    },
    CRDB_E200: {
        code: 'CRDB_E200',
        severity: 'error',
        message: 'SP-GiST indexes are not supported in CockroachDB.',
        alternative: 'Use BTREE for general-purpose indexing or GiST for spatial data.',
        category: 'Index',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/indexes',
    },
    CRDB_E201: {
        code: 'CRDB_E201',
        severity: 'error',
        message: 'BRIN indexes are not supported in CockroachDB.',
        alternative: 'Use BTREE indexes. For sequential data, consider hash-sharded indexes.',
        category: 'Index',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/indexes',
    },
    CRDB_E202: {
        code: 'CRDB_E202',
        severity: 'error',
        message: 'tsvector_ops operator class is not supported in CockroachDB.',
        alternative: 'Use inverted indexes on text or JSONB columns.',
        category: 'Index',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/inverted-indexes',
    },
    CRDB_E203: {
        code: 'CRDB_E203',
        severity: 'error',
        message: 'range_ops operator class is not supported in CockroachDB.',
        alternative: 'Use BTREE indexes on separate bound columns.',
        category: 'Index',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/indexes',
    },
    CRDB_E204: {
        code: 'CRDB_E204',
        severity: 'error',
        message: 'Custom operator class is not supported in CockroachDB.',
        alternative: 'Use built-in operator classes.',
        category: 'Index',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/indexes',
    },
    CRDB_E300: {
        code: 'CRDB_E300',
        severity: 'error',
        message: 'Table inheritance (INHERITS) is not supported in CockroachDB.',
        alternative: 'Use partitioning or define shared columns across tables.',
        category: 'Table',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/known-limitations',
    },
    CRDB_E301: {
        code: 'CRDB_E301',
        severity: 'error',
        message: 'UNLOGGED tables are not supported in CockroachDB.',
        alternative: 'Use regular tables. CockroachDB replicates all data by design.',
        category: 'Table',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/known-limitations',
    },
    CRDB_E302: {
        code: 'CRDB_E302',
        severity: 'error',
        message: 'TABLESPACE is not supported in CockroachDB.',
        alternative: 'Use zone configurations for data placement.',
        category: 'Table',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/configure-replication-zones',
    },
    CRDB_E303: {
        code: 'CRDB_E303',
        severity: 'error',
        message: 'TEMPORARY tables are experimental in CockroachDB.',
        alternative: 'Use regular tables with row-level TTL, or use CTEs.',
        category: 'Table',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/known-limitations',
    },
    CRDB_E310: {
        code: 'CRDB_E310',
        severity: 'error',
        message: 'toast_tuple_target storage parameter is not supported in CockroachDB.',
        alternative: 'CockroachDB does not use TOAST. Remove this parameter.',
        category: 'Table',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/known-limitations',
    },
    CRDB_E311: {
        code: 'CRDB_E311',
        severity: 'error',
        message: 'autovacuum storage parameters are not supported in CockroachDB.',
        alternative: 'CockroachDB uses automatic garbage collection (no VACUUM).',
        category: 'Table',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/known-limitations',
    },
    CRDB_E312: {
        code: 'CRDB_E312',
        severity: 'error',
        message: 'parallel_workers storage parameter is not supported in CockroachDB.',
        alternative: 'CockroachDB uses DistSQL for parallel execution.',
        category: 'Table',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/known-limitations',
    },
    CRDB_E400: {
        code: 'CRDB_E400',
        severity: 'error',
        message: 'CREATE DOMAIN is not supported in CockroachDB.',
        alternative: 'Use the base column type with a CHECK constraint.',
        category: 'Domain',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/known-limitations',
    },
    CRDB_E401: {
        code: 'CRDB_E401',
        severity: 'error',
        message: 'Composite types (CREATE TYPE ... AS) are not supported in CockroachDB.',
        alternative: 'Use a JSONB column or separate columns.',
        category: 'Composite',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/known-limitations',
    },
    CRDB_E500: {
        code: 'CRDB_E500',
        severity: 'error',
        message: 'UPDATE OF <column_list> is not supported in CockroachDB triggers.',
        alternative: 'Use a WHEN clause with IS DISTINCT FROM to check specific columns.',
        category: 'Trigger',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/triggers',
    },
    CRDB_E501: {
        code: 'CRDB_E501',
        severity: 'error',
        message: 'TRUNCATE event is not supported in CockroachDB triggers.',
        alternative: 'Use application-level event handling for TRUNCATE operations.',
        category: 'Trigger',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/triggers',
    },
    CRDB_E502: {
        code: 'CRDB_E502',
        severity: 'error',
        message: 'REFERENCING OLD TABLE AS is not supported in CockroachDB triggers.',
        alternative: 'Use row-level triggers with OLD row variable.',
        category: 'Trigger',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/triggers',
    },
    CRDB_E503: {
        code: 'CRDB_E503',
        severity: 'error',
        message: 'REFERENCING NEW TABLE AS is not supported in CockroachDB triggers.',
        alternative: 'Use row-level triggers with NEW row variable.',
        category: 'Trigger',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/triggers',
    },
    CRDB_E504: {
        code: 'CRDB_E504',
        severity: 'error',
        message: 'CREATE CONSTRAINT TRIGGER is not supported in CockroachDB.',
        alternative: 'Use a regular trigger.',
        category: 'Trigger',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/triggers',
    },
    CRDB_E505: {
        code: 'CRDB_E505',
        severity: 'error',
        message: 'DROP TRIGGER CASCADE is not supported in CockroachDB.',
        alternative: 'Drop triggers individually.',
        category: 'Trigger',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/triggers',
    },
    CRDB_E600: {
        code: 'CRDB_E600',
        severity: 'error',
        message: '%TYPE variable declaration is not supported in CockroachDB PL/pgSQL.',
        alternative: 'Declare the explicit type instead of using %TYPE.',
        category: 'Function',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/user-defined-functions',
    },
    CRDB_E601: {
        code: 'CRDB_E601',
        severity: 'error',
        message: '%ROWTYPE variable declaration is not supported in CockroachDB PL/pgSQL.',
        alternative: 'Declare explicit record types.',
        category: 'Function',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/user-defined-functions',
    },
    CRDB_E602: {
        code: 'CRDB_E602',
        severity: 'error',
        message: 'Ordinal parameters ($1, $2, ...) are not supported in CockroachDB PL/pgSQL.',
        alternative: 'Use named parameters.',
        category: 'Function',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/user-defined-functions',
    },
    CRDB_E603: {
        code: 'CRDB_E603',
        severity: 'error',
        message: 'PERFORM statement is not supported in CockroachDB PL/pgSQL.',
        alternative: 'Use SELECT INTO _dummy FROM ... to discard the result.',
        category: 'Function',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/user-defined-functions',
    },
    CRDB_E604: {
        code: 'CRDB_E604',
        severity: 'error',
        message: 'EXECUTE ... INTO is not supported in CockroachDB PL/pgSQL.',
        alternative: 'Use static SQL statements.',
        category: 'Function',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/user-defined-functions',
    },
    CRDB_E605: {
        code: 'CRDB_E605',
        severity: 'error',
        message: 'GET DIAGNOSTICS is not supported in CockroachDB PL/pgSQL.',
        alternative: 'Check return values manually.',
        category: 'Function',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/user-defined-functions',
    },
    CRDB_E606: {
        code: 'CRDB_E606',
        severity: 'error',
        message: 'CASE statement (PL/pgSQL control flow) is not supported in CockroachDB.',
        alternative: 'Use IF/ELSIF chain.',
        category: 'Function',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/user-defined-functions',
    },
    CRDB_E607: {
        code: 'CRDB_E607',
        severity: 'error',
        message: 'RETURN QUERY is not supported in CockroachDB PL/pgSQL.',
        alternative: 'Use RETURN NEXT in a loop.',
        category: 'Function',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/user-defined-functions',
    },
    CRDB_E608: {
        code: 'CRDB_E608',
        severity: 'error',
        message: 'Nested BEGIN/EXCEPTION blocks are not supported in CockroachDB PL/pgSQL.',
        alternative: 'Flatten to a single exception block.',
        category: 'Function',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/user-defined-functions',
    },
    CRDB_E609: {
        code: 'CRDB_E609',
        severity: 'error',
        message: 'FOR/FOREACH loops over queries are not supported in CockroachDB PL/pgSQL.',
        alternative: 'Use cursors or refactor to set-returning SQL.',
        category: 'Function',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/user-defined-functions',
    },
    CRDB_E700: {
        code: 'CRDB_E700',
        severity: 'error',
        message: 'REGIONAL BY ROW requires a multi-region database.',
        alternative: 'Configure database regions first with ALTER DATABASE ADD REGION.',
        category: 'MultiRegion',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/multiregion-overview',
    },
    CRDB_E701: {
        code: 'CRDB_E701',
        severity: 'error',
        message: 'GLOBAL locality requires a multi-region database.',
        alternative: 'Configure database regions first with ALTER DATABASE ADD REGION.',
        category: 'MultiRegion',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/multiregion-overview',
    },
    CRDB_E702: {
        code: 'CRDB_E702',
        severity: 'error',
        message: 'Region survival goal requires at least 3 regions.',
        alternative: 'Add more regions or use zone survival goal.',
        category: 'MultiRegion',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/multiregion-overview',
    },
    CRDB_E703: {
        code: 'CRDB_E703',
        severity: 'error',
        message: 'Super region contains regions not in the database region list.',
        alternative: 'Ensure all specified regions are added to the database first.',
        category: 'MultiRegion',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/multiregion-overview',
    },
    CRDB_E710: {
        code: 'CRDB_E710',
        severity: 'error',
        message: 'Row-level TTL requires an expirationExpression.',
        alternative: 'Specify expirationExpression, e.g. "created_at + INTERVAL \'30 days\'".',
        category: 'TTL',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/row-level-ttl',
    },
    CRDB_E711: {
        code: 'CRDB_E711',
        severity: 'error',
        message: 'Invalid cron expression for TTL job schedule.',
        alternative: 'Use valid cron syntax, e.g. "0 * * * *" for hourly.',
        category: 'TTL',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/row-level-ttl',
    },
    CRDB_E720: {
        code: 'CRDB_E720',
        severity: 'error',
        message: 'Hash-sharded index bucket count must be at least 2.',
        alternative: 'Set bucketCount to 2 or higher.',
        category: 'Index',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/hash-sharded-indexes',
    },
    CRDB_E730: {
        code: 'CRDB_E730',
        severity: 'error',
        message: 'CockroachDB requires an explicit primary key on every table.',
        alternative: 'Add a primary key column (uuid() recommended for distributed systems).',
        category: 'Table',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/create-table',
    },
};
export const CRDB_WARNINGS = {
    CRDB_W001: {
        code: 'CRDB_W001',
        severity: 'warning',
        message: 'SERIAL columns in CockroachDB use unique_rowid() instead of PostgreSQL sequences.',
        alternative: 'Use uuid().default(sql`gen_random_uuid()`) for distributed primary keys.',
        category: 'Numeric',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/serial',
    },
    CRDB_W002: {
        code: 'CRDB_W002',
        severity: 'warning',
        message: 'SMALLSERIAL columns in CockroachDB use unique_rowid() instead of PostgreSQL sequences.',
        alternative: 'Use uuid().default(sql`gen_random_uuid()`) for distributed primary keys.',
        category: 'Numeric',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/serial',
    },
    CRDB_W003: {
        code: 'CRDB_W003',
        severity: 'warning',
        message: 'BIGSERIAL columns in CockroachDB use unique_rowid() instead of PostgreSQL sequences.',
        alternative: 'Use uuid().default(sql`gen_random_uuid()`) for distributed primary keys.',
        category: 'Numeric',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/serial',
    },
    CRDB_W010: {
        code: 'CRDB_W010',
        severity: 'warning',
        message: 'CockroachDB defaults to NULLS FIRST for ASC ordering (PostgreSQL defaults to NULLS LAST).',
        alternative: 'Specify NULLS FIRST or NULLS LAST explicitly for cross-dialect consistency.',
        category: 'Ordering',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/order-by',
    },
    CRDB_W011: {
        code: 'CRDB_W011',
        severity: 'warning',
        message: 'Index ordering without explicit NULLS differs between CockroachDB and PostgreSQL.',
        alternative: 'Specify NULLS FIRST or NULLS LAST explicitly on index columns.',
        category: 'Index',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/indexes',
    },
    CRDB_W020: {
        code: 'CRDB_W020',
        severity: 'warning',
        message: 'Float overflow returns Infinity in CockroachDB instead of an error (PostgreSQL behavior).',
        alternative: 'Add application-level overflow checks if error-on-overflow is expected.',
        category: 'Numeric',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/data-types',
    },
    CRDB_W021: {
        code: 'CRDB_W021',
        severity: 'warning',
        message: 'Integer division returns DECIMAL in CockroachDB instead of INTEGER (PostgreSQL behavior).',
        alternative: 'Cast the result to INT if integer division is expected: (a / b)::INT.',
        category: 'Numeric',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/data-types',
    },
    CRDB_W030: {
        code: 'CRDB_W030',
        severity: 'warning',
        message: 'Sequence CACHE is per-node in CockroachDB; expect gaps in allocated values.',
        alternative: 'Set CACHE to 1 for no gaps, or accept gaps for better distributed performance.',
        category: 'Sequence',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/create-sequence',
    },
    CRDB_W040: {
        code: 'CRDB_W040',
        severity: 'warning',
        message: 'CONCURRENTLY is accepted but unnecessary in CockroachDB.',
        alternative: 'All index creation in CockroachDB is online. Remove CONCURRENTLY keyword.',
        category: 'Index',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/indexes',
    },
    CRDB_W500: {
        code: 'CRDB_W500',
        severity: 'warning',
        message: 'TG_ARGV is 1-based in CockroachDB (0-based in PostgreSQL).',
        alternative: 'Update TG_ARGV indices: TG_ARGV[0] in PostgreSQL becomes TG_ARGV[1] in CockroachDB.',
        category: 'Trigger',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/triggers',
    },
    CRDB_W710: {
        code: 'CRDB_W710',
        severity: 'warning',
        message: 'TTL on REGIONAL BY ROW tables may be slow; TTL jobs run per-range.',
        alternative: 'Monitor TTL job performance and adjust deleteBatchSize/deleteRateLimit.',
        category: 'TTL',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/row-level-ttl',
    },
    CRDB_W720: {
        code: 'CRDB_W720',
        severity: 'warning',
        message: 'Hash-sharded index on non-sequential column may not improve performance.',
        alternative: 'Hash-sharding is only useful for sequential keys (timestamps, auto-IDs).',
        category: 'Index',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/hash-sharded-indexes',
    },
    CRDB_W721: {
        code: 'CRDB_W721',
        severity: 'warning',
        message: 'Hash-sharded index bucket count exceeds 256, which may reduce scan performance.',
        alternative: 'Use 8-64 buckets for most workloads. Reduce bucketCount.',
        category: 'Index',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/hash-sharded-indexes',
    },
};
export const CRDB_INFO = {
    CRDB_I600: {
        code: 'CRDB_I600',
        severity: 'info',
        message: 'For CockroachDB, prefer LANGUAGE SQL over LANGUAGE plpgsql where possible.',
        alternative: 'SQL functions have full support; PL/pgSQL has limitations.',
        category: 'Function',
        documentationUrl: 'https://www.cockroachlabs.com/docs/stable/user-defined-functions',
    },
};
export function lookupErrorCode(code) {
    return CRDB_ERRORS[code]
        ?? CRDB_WARNINGS[code]
        ?? CRDB_INFO[code];
}
export function createMessage(code, location) {
    const def = lookupErrorCode(code);
    if (!def) {
        return {
            code,
            severity: 'error',
            message: `Unknown error code: ${code}`,
            category: 'Unknown',
            ...location,
        };
    }
    return {
        code: def.code,
        severity: def.severity,
        message: def.message,
        alternative: def.alternative,
        category: def.category,
        documentationUrl: def.documentationUrl,
        ...location,
    };
}
export function formatMessage(msg) {
    const location = [msg.tableName, msg.columnName].filter(Boolean).join('.');
    const prefix = location ? `${location}: ` : '';
    const lines = [`[${msg.code}] ${prefix}${msg.message}`];
    if (msg.alternative) {
        lines.push(`  Alternative: ${msg.alternative}`);
    }
    if (msg.documentationUrl) {
        lines.push(`  Documentation: ${msg.documentationUrl}`);
    }
    return lines.join('\n');
}
export function formatValidationResult(result) {
    const sections = [];
    sections.push('Schema Validation Results (CockroachDB)');
    sections.push('========================================');
    sections.push('');
    if (result.errors.length > 0) {
        sections.push(`ERRORS (${result.errors.length} issue${result.errors.length !== 1 ? 's' : ''} - must fix):`);
        sections.push('');
        for (const err of result.errors) {
            sections.push(`  ${formatMessage(err)}`);
            sections.push('');
        }
    }
    if (result.warnings.length > 0) {
        sections.push(`WARNINGS (${result.warnings.length} issue${result.warnings.length !== 1 ? 's' : ''} - review recommended):`);
        sections.push('');
        for (const warn of result.warnings) {
            sections.push(`  ${formatMessage(warn)}`);
            sections.push('');
        }
    }
    if (result.info.length > 0) {
        sections.push(`INFO (${result.info.length} note${result.info.length !== 1 ? 's' : ''}):`);
        sections.push('');
        for (const inf of result.info) {
            sections.push(`  ${formatMessage(inf)}`);
            sections.push('');
        }
    }
    sections.push(`Summary: ${result.errors.length} errors, ${result.warnings.length} warnings, ${result.info.length} info`);
    sections.push(`Status: ${result.hasErrors ? 'FAILED (fix errors before pushing)' : 'PASSED'}`);
    return sections.join('\n');
}
