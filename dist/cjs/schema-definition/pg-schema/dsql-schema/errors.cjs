"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DSQL_ALL_RULES = exports.DSQL_MISC_RULES = exports.DSQL_TXN_RULES = exports.DSQL_DB_RULES = exports.DSQL_SEQ_RULES = exports.DSQL_EXT_RULES = exports.DSQL_VIEW_RULES = exports.DSQL_TRIG_RULES = exports.DSQL_FN_RULES = exports.DSQL_TBL_RULES = exports.DSQL_IDX_LIMIT_RULES = exports.DSQL_IDX_RULES = exports.DSQL_CONS_RULES = exports.DSQL_MOD_ERRORS = exports.DSQL_LIMIT_WARNINGS = exports.DSQL_TYPE_ERRORS = void 0;
exports.createDsqlValidationResult = createDsqlValidationResult;
exports.lookupDsqlRule = lookupDsqlRule;
exports.createDsqlMessage = createDsqlMessage;
exports.formatDsqlMessage = formatDsqlMessage;
exports.formatDsqlValidationResult = formatDsqlValidationResult;
const DSQL_DOCS_TYPES = 'https://docs.aws.amazon.com/aurora-dsql/latest/userguide/working-with-postgresql-compatibility-supported-data-types.html';
const DSQL_DOCS_UNSUPPORTED = 'https://docs.aws.amazon.com/aurora-dsql/latest/userguide/working-with-postgresql-compatibility-unsupported-features.html';
const DSQL_DOCS_LIMITS = 'https://docs.aws.amazon.com/aurora-dsql/latest/userguide/quotas.html';
exports.DSQL_TYPE_ERRORS = {
    'DSQL-TYPE-001': {
        code: 'DSQL-TYPE-001',
        severity: 'error',
        message: 'SERIAL/BIGSERIAL/SMALLSERIAL types are not supported in DSQL. Sequences are not available.',
        alternative: 'uuid().default(DEFAULT.genRandomUuid())',
        category: 'column-type',
        docsUrl: DSQL_DOCS_TYPES,
        autoFix: {
            description: 'Replace SERIAL with UUID + gen_random_uuid()',
            originalType: 'serial',
            replacementType: 'uuid',
            additionalChanges: ['Add .default(DEFAULT.genRandomUuid())', 'Add .primaryKey()'],
        },
    },
    'DSQL-TYPE-002': {
        code: 'DSQL-TYPE-002',
        severity: 'error',
        message: 'JSON/JSONB column types are not supported in DSQL. Use TEXT and cast to jsonb at query time.',
        alternative: 'text() — store JSON as text, cast with col::jsonb in queries',
        category: 'column-type',
        docsUrl: DSQL_DOCS_TYPES,
        autoFix: {
            description: 'Replace JSON/JSONB column with TEXT + CHECK constraint',
            originalType: 'jsonb',
            replacementType: 'text',
            additionalChanges: ['Add CHECK (col IS NULL OR (col::jsonb) IS NOT NULL)', 'Cast with col::jsonb in queries'],
        },
    },
    'DSQL-TYPE-003': {
        code: 'DSQL-TYPE-003',
        severity: 'error',
        message: 'XML column type is not supported in DSQL.',
        alternative: 'text() — store XML as text',
        category: 'column-type',
        docsUrl: DSQL_DOCS_TYPES,
        autoFix: {
            description: 'Replace XML column with TEXT',
            originalType: 'xml',
            replacementType: 'text',
        },
    },
    'DSQL-TYPE-004': {
        code: 'DSQL-TYPE-004',
        severity: 'error',
        message: 'MONEY type is not supported in DSQL.',
        alternative: 'numeric({ precision: 19, scale: 4 })',
        category: 'column-type',
        docsUrl: DSQL_DOCS_TYPES,
        autoFix: {
            description: 'Replace MONEY with NUMERIC(19,4)',
            originalType: 'money',
            replacementType: 'numeric(19,4)',
        },
    },
    'DSQL-TYPE-005': {
        code: 'DSQL-TYPE-005',
        severity: 'error',
        message: 'Geometric types (POINT, LINE, LSEG, BOX, PATH, POLYGON, CIRCLE) are not supported in DSQL.',
        alternative: 'Store as separate numeric columns or text()',
        category: 'column-type',
        docsUrl: DSQL_DOCS_TYPES,
    },
    'DSQL-TYPE-006': {
        code: 'DSQL-TYPE-006',
        severity: 'error',
        message: 'Range types (INT4RANGE, INT8RANGE, NUMRANGE, TSRANGE, TSTZRANGE, DATERANGE) are not supported in DSQL.',
        alternative: 'Use two columns for lower and upper bounds',
        category: 'column-type',
        docsUrl: DSQL_DOCS_TYPES,
    },
    'DSQL-TYPE-007': {
        code: 'DSQL-TYPE-007',
        severity: 'error',
        message: 'Multirange types are not supported in DSQL.',
        alternative: 'Use a junction table with bound columns',
        category: 'column-type',
        docsUrl: DSQL_DOCS_TYPES,
    },
    'DSQL-TYPE-008': {
        code: 'DSQL-TYPE-008',
        severity: 'error',
        message: 'Bit string types (BIT, VARBIT, BIT VARYING) are not supported in DSQL.',
        alternative: 'bytea() or text()',
        category: 'column-type',
        docsUrl: DSQL_DOCS_TYPES,
        autoFix: {
            description: 'Replace BIT/VARBIT with BYTEA',
            originalType: 'bit',
            replacementType: 'bytea',
        },
    },
    'DSQL-TYPE-009': {
        code: 'DSQL-TYPE-009',
        severity: 'error',
        message: 'Network types CIDR, MACADDR, MACADDR8 are not supported as column types in DSQL.',
        alternative: 'text() or varchar()',
        category: 'column-type',
        docsUrl: DSQL_DOCS_TYPES,
        autoFix: {
            description: 'Replace network types with TEXT',
            originalType: 'cidr/macaddr/macaddr8',
            replacementType: 'text',
        },
    },
    'DSQL-TYPE-010': {
        code: 'DSQL-TYPE-010',
        severity: 'error',
        message: 'INET is not supported as a column type in DSQL (runtime-only).',
        alternative: 'varchar(45) — fits both IPv4 and IPv6',
        category: 'column-type',
        docsUrl: DSQL_DOCS_TYPES,
        autoFix: {
            description: 'Replace INET with VARCHAR(45)',
            originalType: 'inet',
            replacementType: 'varchar(45)',
        },
    },
    'DSQL-TYPE-011': {
        code: 'DSQL-TYPE-011',
        severity: 'error',
        message: 'Text search types (TSVECTOR, TSQUERY) are not supported in DSQL. Full-text search is not available.',
        alternative: 'text() — use external search service (OpenSearch, Elasticsearch)',
        category: 'column-type',
        docsUrl: DSQL_DOCS_TYPES,
        autoFix: {
            description: 'Replace TSVECTOR/TSQUERY with TEXT',
            originalType: 'tsvector/tsquery',
            replacementType: 'text',
        },
    },
    'DSQL-TYPE-012': {
        code: 'DSQL-TYPE-012',
        severity: 'error',
        message: 'OID and REG* types are not supported in DSQL.',
        alternative: 'text() or integer()',
        category: 'column-type',
        docsUrl: DSQL_DOCS_TYPES,
        autoFix: {
            description: 'Replace OID/REG* with TEXT',
            originalType: 'oid/reg*',
            replacementType: 'text',
        },
    },
    'DSQL-TYPE-013': {
        code: 'DSQL-TYPE-013',
        severity: 'error',
        message: 'Internal types (PG_LSN, PG_SNAPSHOT) are not supported in DSQL.',
        alternative: 'No direct alternative',
        category: 'column-type',
        docsUrl: DSQL_DOCS_TYPES,
    },
    'DSQL-TYPE-014': {
        code: 'DSQL-TYPE-014',
        severity: 'error',
        message: 'Array column types are not supported in DSQL (runtime-only).',
        alternative: 'text() — store as JSON array string, or normalize into separate table',
        category: 'column-type',
        docsUrl: DSQL_DOCS_TYPES,
        autoFix: {
            description: 'Replace array column with TEXT (JSON array string)',
            originalType: 'type[]',
            replacementType: 'text',
            additionalChanges: ['Store arrays as JSON strings', 'Parse with col::jsonb in queries'],
        },
    },
};
exports.DSQL_LIMIT_WARNINGS = {
    'DSQL-LIMIT-001': {
        code: 'DSQL-LIMIT-001',
        severity: 'warning',
        message: 'VARCHAR length exceeds DSQL maximum of 65,535 bytes.',
        alternative: 'varchar(65535) or text()',
        category: 'column-limit',
        docsUrl: DSQL_DOCS_LIMITS,
    },
    'DSQL-LIMIT-002': {
        code: 'DSQL-LIMIT-002',
        severity: 'warning',
        message: 'CHAR length exceeds DSQL maximum of 4,096 bytes.',
        alternative: 'char(4096) or varchar()',
        category: 'column-limit',
        docsUrl: DSQL_DOCS_LIMITS,
    },
    'DSQL-LIMIT-003': {
        code: 'DSQL-LIMIT-003',
        severity: 'warning',
        message: 'NUMERIC precision exceeds DSQL maximum of 38.',
        alternative: 'numeric({ precision: 38, scale: ... })',
        category: 'column-limit',
        docsUrl: DSQL_DOCS_LIMITS,
    },
    'DSQL-LIMIT-004': {
        code: 'DSQL-LIMIT-004',
        severity: 'warning',
        message: 'NUMERIC scale exceeds DSQL maximum of 37.',
        alternative: 'numeric({ precision: ..., scale: 37 })',
        category: 'column-limit',
        docsUrl: DSQL_DOCS_LIMITS,
    },
};
exports.DSQL_MOD_ERRORS = {
    'DSQL-MOD-001': {
        code: 'DSQL-MOD-001',
        severity: 'error',
        message: 'GENERATED AS IDENTITY is not supported in DSQL. Sequences are not available.',
        alternative: 'uuid().default(DEFAULT.genRandomUuid())',
        category: 'column-modifier',
        docsUrl: DSQL_DOCS_UNSUPPORTED,
        autoFix: {
            description: 'Replace IDENTITY column with UUID + gen_random_uuid()',
            originalType: 'GENERATED AS IDENTITY',
            replacementType: 'uuid',
            additionalChanges: ['Remove identity modifier', 'Add .default(DEFAULT.genRandomUuid())'],
        },
    },
    'DSQL-MOD-002': {
        code: 'DSQL-MOD-002',
        severity: 'error',
        message: 'DEFAULT nextval() is not supported in DSQL. Sequences are not available.',
        alternative: 'uuid().default(DEFAULT.genRandomUuid())',
        category: 'column-modifier',
        docsUrl: DSQL_DOCS_UNSUPPORTED,
        autoFix: {
            description: 'Replace nextval() default with gen_random_uuid()',
            originalType: "DEFAULT nextval('...')",
            replacementType: 'DEFAULT gen_random_uuid()',
        },
    },
    'DSQL-MOD-003': {
        code: 'DSQL-MOD-003',
        severity: 'warning',
        message: 'Only C collation is supported in DSQL. Locale-specific collations are not available.',
        alternative: 'Remove .collate() or use collate("C")',
        category: 'column-modifier',
        docsUrl: DSQL_DOCS_UNSUPPORTED,
    },
};
exports.DSQL_CONS_RULES = {
    'DSQL-CONS-001': {
        code: 'DSQL-CONS-001',
        severity: 'warning',
        message: 'FOREIGN KEY constraints are accepted but NOT enforced in DSQL.',
        alternative: 'Implement referential integrity in application layer',
        category: 'constraint',
        docsUrl: DSQL_DOCS_UNSUPPORTED,
    },
    'DSQL-CONS-002': {
        code: 'DSQL-CONS-002',
        severity: 'warning',
        message: 'Column-level REFERENCES (inline FK) are accepted but NOT enforced in DSQL.',
        alternative: 'Implement referential integrity in application layer',
        category: 'constraint',
        docsUrl: DSQL_DOCS_UNSUPPORTED,
    },
    'DSQL-CONS-003': {
        code: 'DSQL-CONS-003',
        severity: 'warning',
        message: 'ON DELETE actions (CASCADE, SET NULL, etc.) are NOT enforced in DSQL.',
        alternative: 'Implement cascade/set-null logic in application layer',
        category: 'constraint',
        docsUrl: DSQL_DOCS_UNSUPPORTED,
    },
    'DSQL-CONS-004': {
        code: 'DSQL-CONS-004',
        severity: 'warning',
        message: 'ON UPDATE actions (CASCADE, etc.) are NOT enforced in DSQL.',
        alternative: 'Implement cascade logic in application layer',
        category: 'constraint',
        docsUrl: DSQL_DOCS_UNSUPPORTED,
    },
    'DSQL-CONS-005': {
        code: 'DSQL-CONS-005',
        severity: 'error',
        message: 'EXCLUSION constraints are not supported in DSQL.',
        alternative: 'Implement exclusion logic in application layer',
        category: 'constraint',
        docsUrl: DSQL_DOCS_UNSUPPORTED,
    },
    'DSQL-CONS-006': {
        code: 'DSQL-CONS-006',
        severity: 'error',
        message: 'DEFERRABLE / INITIALLY DEFERRED constraints are not supported in DSQL.',
        alternative: 'Remove deferrable option — all constraints are immediate in DSQL',
        category: 'constraint',
        docsUrl: DSQL_DOCS_UNSUPPORTED,
    },
    'DSQL-CONS-007': {
        code: 'DSQL-CONS-007',
        severity: 'warning',
        message: 'MATCH FULL / MATCH PARTIAL for foreign keys may not behave as expected in DSQL.',
        alternative: 'Remove match option — FKs are not enforced',
        category: 'constraint',
        docsUrl: DSQL_DOCS_UNSUPPORTED,
    },
};
exports.DSQL_IDX_RULES = {
    'DSQL-IDX-001': {
        code: 'DSQL-IDX-001',
        severity: 'error',
        message: 'GIN indexes are not supported in DSQL. Only B-tree indexes are allowed.',
        alternative: 'Use B-tree index or application-level search',
        category: 'index',
        docsUrl: DSQL_DOCS_UNSUPPORTED,
    },
    'DSQL-IDX-002': {
        code: 'DSQL-IDX-002',
        severity: 'error',
        message: 'GiST indexes are not supported in DSQL. Only B-tree indexes are allowed.',
        alternative: 'Use B-tree index',
        category: 'index',
        docsUrl: DSQL_DOCS_UNSUPPORTED,
    },
    'DSQL-IDX-003': {
        code: 'DSQL-IDX-003',
        severity: 'error',
        message: 'SP-GiST indexes are not supported in DSQL. Only B-tree indexes are allowed.',
        alternative: 'Use B-tree index',
        category: 'index',
        docsUrl: DSQL_DOCS_UNSUPPORTED,
    },
    'DSQL-IDX-004': {
        code: 'DSQL-IDX-004',
        severity: 'error',
        message: 'BRIN indexes are not supported in DSQL. Only B-tree indexes are allowed.',
        alternative: 'Use B-tree index',
        category: 'index',
        docsUrl: DSQL_DOCS_UNSUPPORTED,
    },
    'DSQL-IDX-005': {
        code: 'DSQL-IDX-005',
        severity: 'error',
        message: 'Hash indexes are not supported in DSQL. Only B-tree indexes are allowed.',
        alternative: 'Use B-tree index',
        category: 'index',
        docsUrl: DSQL_DOCS_UNSUPPORTED,
    },
    'DSQL-IDX-006': {
        code: 'DSQL-IDX-006',
        severity: 'warning',
        message: 'CONCURRENTLY index creation is not supported in DSQL.',
        alternative: 'Remove CONCURRENTLY — DSQL manages index creation automatically',
        category: 'index',
        docsUrl: DSQL_DOCS_UNSUPPORTED,
    },
    'DSQL-IDX-007': {
        code: 'DSQL-IDX-007',
        severity: 'error',
        message: 'Custom operator classes are not supported in DSQL indexes.',
        alternative: 'Remove operator class specification',
        category: 'index',
        docsUrl: DSQL_DOCS_UNSUPPORTED,
    },
};
exports.DSQL_IDX_LIMIT_RULES = {
    'DSQL-IDX-LIMIT-001': {
        code: 'DSQL-IDX-LIMIT-001',
        severity: 'error',
        message: 'DSQL allows a maximum of 24 indexes per table.',
        alternative: 'Reduce the number of indexes',
        category: 'index-limit',
        docsUrl: DSQL_DOCS_LIMITS,
    },
    'DSQL-IDX-LIMIT-002': {
        code: 'DSQL-IDX-LIMIT-002',
        severity: 'error',
        message: 'DSQL allows a maximum of 8 columns per index or primary key.',
        alternative: 'Reduce the number of columns in the index',
        category: 'index-limit',
        docsUrl: DSQL_DOCS_LIMITS,
    },
    'DSQL-IDX-LIMIT-003': {
        code: 'DSQL-IDX-LIMIT-003',
        severity: 'error',
        message: 'BYTEA columns cannot be indexed in DSQL.',
        alternative: 'Remove bytea column from index, or use a hash column',
        category: 'index-limit',
        docsUrl: DSQL_DOCS_LIMITS,
    },
    'DSQL-IDX-LIMIT-004': {
        code: 'DSQL-IDX-LIMIT-004',
        severity: 'error',
        message: 'INTERVAL columns cannot be indexed in DSQL.',
        alternative: 'Remove interval column from index, or store as integer (seconds)',
        category: 'index-limit',
        docsUrl: DSQL_DOCS_LIMITS,
    },
    'DSQL-IDX-LIMIT-005': {
        code: 'DSQL-IDX-LIMIT-005',
        severity: 'error',
        message: 'TIMETZ columns cannot be indexed in DSQL.',
        alternative: 'Remove timetz column from index, or use timestamptz instead',
        category: 'index-limit',
        docsUrl: DSQL_DOCS_LIMITS,
    },
};
exports.DSQL_TBL_RULES = {
    'DSQL-TBL-001': {
        code: 'DSQL-TBL-001',
        severity: 'error',
        message: 'TEMPORARY tables are not supported in DSQL.',
        alternative: 'Use CTEs (WITH clause) or regular tables',
        category: 'table-feature',
        docsUrl: DSQL_DOCS_UNSUPPORTED,
    },
    'DSQL-TBL-002': {
        code: 'DSQL-TBL-002',
        severity: 'error',
        message: 'UNLOGGED tables are not supported in DSQL.',
        alternative: 'Use regular tables — DSQL manages durability automatically',
        category: 'table-feature',
        docsUrl: DSQL_DOCS_UNSUPPORTED,
    },
    'DSQL-TBL-003': {
        code: 'DSQL-TBL-003',
        severity: 'error',
        message: 'Table inheritance (INHERITS) is not supported in DSQL.',
        alternative: 'Use separate tables with shared column definitions',
        category: 'table-feature',
        docsUrl: DSQL_DOCS_UNSUPPORTED,
    },
    'DSQL-TBL-004': {
        code: 'DSQL-TBL-004',
        severity: 'error',
        message: 'TABLESPACE is not supported in DSQL.',
        alternative: 'Remove tablespace — DSQL manages storage automatically',
        category: 'table-feature',
        docsUrl: DSQL_DOCS_UNSUPPORTED,
    },
    'DSQL-TBL-005': {
        code: 'DSQL-TBL-005',
        severity: 'error',
        message: 'PARTITION BY is not supported in DSQL. DSQL automatically partitions data.',
        alternative: 'Remove partitioning — DSQL handles distribution automatically',
        category: 'table-feature',
        docsUrl: DSQL_DOCS_UNSUPPORTED,
    },
    'DSQL-TBL-006': {
        code: 'DSQL-TBL-006',
        severity: 'warning',
        message: 'WITH (storage_parameters) is not supported in DSQL.',
        alternative: 'Remove storage parameters — DSQL manages storage automatically',
        category: 'table-feature',
        docsUrl: DSQL_DOCS_UNSUPPORTED,
    },
    'DSQL-TBL-007': {
        code: 'DSQL-TBL-007',
        severity: 'error',
        message: 'ON COMMIT clause is not supported in DSQL (no temporary tables).',
        alternative: 'Remove ON COMMIT — temporary tables are not supported',
        category: 'table-feature',
        docsUrl: DSQL_DOCS_UNSUPPORTED,
    },
};
exports.DSQL_FN_RULES = {
    'DSQL-FN-001': {
        code: 'DSQL-FN-001',
        severity: 'error',
        message: 'LANGUAGE plpgsql is not supported in DSQL. Only SQL language functions are allowed.',
        alternative: 'Use LANGUAGE SQL or move logic to application/Lambda',
        category: 'function',
        docsUrl: DSQL_DOCS_UNSUPPORTED,
    },
    'DSQL-FN-002': {
        code: 'DSQL-FN-002',
        severity: 'error',
        message: 'LANGUAGE plpython3u is not supported in DSQL.',
        alternative: 'Use AWS Lambda for Python logic',
        category: 'function',
        docsUrl: DSQL_DOCS_UNSUPPORTED,
    },
    'DSQL-FN-003': {
        code: 'DSQL-FN-003',
        severity: 'error',
        message: 'LANGUAGE plperl is not supported in DSQL.',
        alternative: 'Use AWS Lambda',
        category: 'function',
        docsUrl: DSQL_DOCS_UNSUPPORTED,
    },
    'DSQL-FN-004': {
        code: 'DSQL-FN-004',
        severity: 'error',
        message: 'LANGUAGE pltcl is not supported in DSQL.',
        alternative: 'Use AWS Lambda',
        category: 'function',
        docsUrl: DSQL_DOCS_UNSUPPORTED,
    },
    'DSQL-FN-005': {
        code: 'DSQL-FN-005',
        severity: 'error',
        message: 'LANGUAGE c is not supported in DSQL.',
        alternative: 'Use LANGUAGE SQL or AWS Lambda',
        category: 'function',
        docsUrl: DSQL_DOCS_UNSUPPORTED,
    },
    'DSQL-FN-006': {
        code: 'DSQL-FN-006',
        severity: 'error',
        message: 'CREATE PROCEDURE with non-SQL language is not supported in DSQL.',
        alternative: 'Use SQL-language functions or application logic',
        category: 'function',
        docsUrl: DSQL_DOCS_UNSUPPORTED,
    },
    'DSQL-FN-007': {
        code: 'DSQL-FN-007',
        severity: 'error',
        message: 'DO $$ ... $$ anonymous code blocks are not supported in DSQL.',
        alternative: 'Execute statements separately or use SQL functions',
        category: 'function',
        docsUrl: DSQL_DOCS_UNSUPPORTED,
    },
    'DSQL-FN-008': {
        code: 'DSQL-FN-008',
        severity: 'warning',
        message: 'CALL procedure_name() may not work if procedure uses non-SQL language.',
        alternative: 'Ensure the procedure uses LANGUAGE SQL',
        category: 'function',
        docsUrl: DSQL_DOCS_UNSUPPORTED,
    },
};
exports.DSQL_TRIG_RULES = {
    'DSQL-TRIG-001': {
        code: 'DSQL-TRIG-001',
        severity: 'error',
        message: 'CREATE TRIGGER is not supported in DSQL.',
        alternative: 'Move trigger logic to application code or AWS Lambda/EventBridge',
        category: 'trigger',
        docsUrl: DSQL_DOCS_UNSUPPORTED,
    },
    'DSQL-TRIG-002': {
        code: 'DSQL-TRIG-002',
        severity: 'error',
        message: 'DROP TRIGGER is not supported in DSQL.',
        alternative: 'N/A — triggers are not supported',
        category: 'trigger',
        docsUrl: DSQL_DOCS_UNSUPPORTED,
    },
    'DSQL-TRIG-003': {
        code: 'DSQL-TRIG-003',
        severity: 'error',
        message: 'Functions that RETURN TRIGGER are not supported in DSQL.',
        alternative: 'Move trigger logic to application code or AWS Lambda/EventBridge',
        category: 'trigger',
        docsUrl: DSQL_DOCS_UNSUPPORTED,
    },
};
exports.DSQL_VIEW_RULES = {
    'DSQL-VIEW-001': {
        code: 'DSQL-VIEW-001',
        severity: 'error',
        message: 'MATERIALIZED VIEWS are not supported in DSQL.',
        alternative: 'Use regular views or cache results in application layer',
        category: 'view',
        docsUrl: DSQL_DOCS_UNSUPPORTED,
    },
    'DSQL-VIEW-002': {
        code: 'DSQL-VIEW-002',
        severity: 'error',
        message: 'REFRESH MATERIALIZED VIEW is not supported in DSQL.',
        alternative: 'N/A — materialized views are not supported',
        category: 'view',
        docsUrl: DSQL_DOCS_UNSUPPORTED,
    },
    'DSQL-VIEW-003': {
        code: 'DSQL-VIEW-003',
        severity: 'error',
        message: 'DSQL allows a maximum of 5,000 views per database.',
        alternative: 'Reduce the number of views',
        category: 'view',
        docsUrl: DSQL_DOCS_LIMITS,
    },
    'DSQL-VIEW-004': {
        code: 'DSQL-VIEW-004',
        severity: 'error',
        message: 'View definition must not exceed 2 MiB in DSQL.',
        alternative: 'Simplify the view definition',
        category: 'view',
        docsUrl: DSQL_DOCS_LIMITS,
    },
};
exports.DSQL_EXT_RULES = {
    'DSQL-EXT-001': {
        code: 'DSQL-EXT-001',
        severity: 'error',
        message: 'CREATE EXTENSION is not supported in DSQL. No extensions are available.',
        alternative: 'Use built-in functions only',
        category: 'extension',
        docsUrl: DSQL_DOCS_UNSUPPORTED,
    },
    'DSQL-EXT-002': {
        code: 'DSQL-EXT-002',
        severity: 'error',
        message: 'PostGIS types and functions are not available in DSQL.',
        alternative: 'Use separate numeric/text columns for coordinates',
        category: 'extension',
        docsUrl: DSQL_DOCS_UNSUPPORTED,
    },
    'DSQL-EXT-003': {
        code: 'DSQL-EXT-003',
        severity: 'error',
        message: 'pgvector types and functions are not available in DSQL.',
        alternative: 'Use external vector DB or store vectors as text/bytea',
        category: 'extension',
        docsUrl: DSQL_DOCS_UNSUPPORTED,
    },
    'DSQL-EXT-004': {
        code: 'DSQL-EXT-004',
        severity: 'error',
        message: 'pg_trgm functions are not available in DSQL.',
        alternative: 'Use LIKE/ILIKE for pattern matching or external search service',
        category: 'extension',
        docsUrl: DSQL_DOCS_UNSUPPORTED,
    },
};
exports.DSQL_SEQ_RULES = {
    'DSQL-SEQ-001': {
        code: 'DSQL-SEQ-001',
        severity: 'error',
        message: 'CREATE SEQUENCE is not supported in DSQL.',
        alternative: 'Use UUID with gen_random_uuid() for unique IDs',
        category: 'sequence',
        docsUrl: DSQL_DOCS_UNSUPPORTED,
    },
    'DSQL-SEQ-002': {
        code: 'DSQL-SEQ-002',
        severity: 'error',
        message: 'nextval() is not supported in DSQL. Sequences are not available.',
        alternative: 'Use gen_random_uuid()',
        category: 'sequence',
        docsUrl: DSQL_DOCS_UNSUPPORTED,
    },
    'DSQL-SEQ-003': {
        code: 'DSQL-SEQ-003',
        severity: 'error',
        message: 'currval() is not supported in DSQL. Sequences are not available.',
        alternative: 'Use RETURNING clause to get inserted IDs',
        category: 'sequence',
        docsUrl: DSQL_DOCS_UNSUPPORTED,
    },
    'DSQL-SEQ-004': {
        code: 'DSQL-SEQ-004',
        severity: 'error',
        message: 'setval() is not supported in DSQL. Sequences are not available.',
        alternative: 'N/A — use UUID-based IDs',
        category: 'sequence',
        docsUrl: DSQL_DOCS_UNSUPPORTED,
    },
    'DSQL-SEQ-005': {
        code: 'DSQL-SEQ-005',
        severity: 'error',
        message: 'lastval() is not supported in DSQL. Sequences are not available.',
        alternative: 'Use RETURNING clause',
        category: 'sequence',
        docsUrl: DSQL_DOCS_UNSUPPORTED,
    },
};
exports.DSQL_DB_RULES = {
    'DSQL-DB-001': {
        code: 'DSQL-DB-001',
        severity: 'error',
        message: 'DSQL supports only 1 database per cluster (the "postgres" database).',
        alternative: 'Use schemas to separate data within the postgres database',
        category: 'database-limit',
        docsUrl: DSQL_DOCS_LIMITS,
    },
    'DSQL-DB-002': {
        code: 'DSQL-DB-002',
        severity: 'error',
        message: 'DSQL allows a maximum of 10 schemas per database.',
        alternative: 'Consolidate schemas',
        category: 'database-limit',
        docsUrl: DSQL_DOCS_LIMITS,
    },
    'DSQL-DB-003': {
        code: 'DSQL-DB-003',
        severity: 'error',
        message: 'DSQL allows a maximum of 1,000 tables per database.',
        alternative: 'Consolidate tables or use multiple clusters',
        category: 'database-limit',
        docsUrl: DSQL_DOCS_LIMITS,
    },
    'DSQL-DB-004': {
        code: 'DSQL-DB-004',
        severity: 'error',
        message: 'DSQL allows a maximum of 255 columns per table.',
        alternative: 'Normalize the table into multiple related tables',
        category: 'database-limit',
        docsUrl: DSQL_DOCS_LIMITS,
    },
    'DSQL-DB-005': {
        code: 'DSQL-DB-005',
        severity: 'warning',
        message: 'Combined primary key column size should not exceed 1 KiB in DSQL.',
        alternative: 'Use shorter PK columns or a single UUID primary key',
        category: 'database-limit',
        docsUrl: DSQL_DOCS_LIMITS,
    },
    'DSQL-DB-006': {
        code: 'DSQL-DB-006',
        severity: 'warning',
        message: 'Row size should not exceed 2 MiB in DSQL.',
        alternative: 'Store large data in S3 and keep references in the table',
        category: 'database-limit',
        docsUrl: DSQL_DOCS_LIMITS,
    },
};
exports.DSQL_TXN_RULES = {
    'DSQL-TXN-001': {
        code: 'DSQL-TXN-001',
        severity: 'error',
        message: 'DSQL allows a maximum of 3,000 mutated rows per transaction.',
        alternative: 'Batch operations into multiple transactions',
        category: 'transaction',
        docsUrl: DSQL_DOCS_LIMITS,
    },
    'DSQL-TXN-002': {
        code: 'DSQL-TXN-002',
        severity: 'error',
        message: 'DSQL transactions must complete within 5 minutes.',
        alternative: 'Break long-running operations into smaller transactions',
        category: 'transaction',
        docsUrl: DSQL_DOCS_LIMITS,
    },
    'DSQL-TXN-003': {
        code: 'DSQL-TXN-003',
        severity: 'error',
        message: 'DSQL allows only 1 DDL statement per transaction.',
        alternative: 'Execute DDL statements in separate transactions',
        category: 'transaction',
        docsUrl: DSQL_DOCS_LIMITS,
    },
    'DSQL-TXN-004': {
        code: 'DSQL-TXN-004',
        severity: 'error',
        message: 'Cannot mix DDL and DML statements in the same DSQL transaction.',
        alternative: 'Separate DDL and DML into different transactions',
        category: 'transaction',
        docsUrl: DSQL_DOCS_LIMITS,
    },
    'DSQL-TXN-005': {
        code: 'DSQL-TXN-005',
        severity: 'warning',
        message: 'DSQL write transactions should not exceed 10 MiB of data.',
        alternative: 'Batch large writes into smaller transactions',
        category: 'transaction',
        docsUrl: DSQL_DOCS_LIMITS,
    },
};
exports.DSQL_MISC_RULES = {
    'DSQL-MISC-001': {
        code: 'DSQL-MISC-001',
        severity: 'error',
        message: 'LISTEN is not supported in DSQL.',
        alternative: 'Use AWS SNS, SQS, or EventBridge for notifications',
        category: 'miscellaneous',
        docsUrl: DSQL_DOCS_UNSUPPORTED,
    },
    'DSQL-MISC-002': {
        code: 'DSQL-MISC-002',
        severity: 'error',
        message: 'NOTIFY is not supported in DSQL.',
        alternative: 'Use AWS SNS, SQS, or EventBridge for notifications',
        category: 'miscellaneous',
        docsUrl: DSQL_DOCS_UNSUPPORTED,
    },
    'DSQL-MISC-003': {
        code: 'DSQL-MISC-003',
        severity: 'error',
        message: 'Advisory locks (pg_advisory_lock) are not supported in DSQL.',
        alternative: 'Use optimistic concurrency (OCC is built-in) or external locking (DynamoDB, Redis)',
        category: 'miscellaneous',
        docsUrl: DSQL_DOCS_UNSUPPORTED,
    },
    'DSQL-MISC-004': {
        code: 'DSQL-MISC-004',
        severity: 'error',
        message: 'TRUNCATE is not supported in DSQL.',
        alternative: 'Use DELETE FROM table_name (batch in 3,000-row transactions)',
        category: 'miscellaneous',
        docsUrl: DSQL_DOCS_UNSUPPORTED,
    },
    'DSQL-MISC-005': {
        code: 'DSQL-MISC-005',
        severity: 'error',
        message: 'CREATE RULE is not supported in DSQL.',
        alternative: 'Implement rule logic in application layer or views',
        category: 'miscellaneous',
        docsUrl: DSQL_DOCS_UNSUPPORTED,
    },
    'DSQL-MISC-006': {
        code: 'DSQL-MISC-006',
        severity: 'warning',
        message: 'VACUUM, ANALYZE, and REINDEX are not needed in DSQL — automatic maintenance.',
        alternative: 'Remove — DSQL manages maintenance automatically',
        category: 'miscellaneous',
        docsUrl: DSQL_DOCS_UNSUPPORTED,
    },
};
exports.DSQL_ALL_RULES = {
    ...exports.DSQL_TYPE_ERRORS,
    ...exports.DSQL_LIMIT_WARNINGS,
    ...exports.DSQL_MOD_ERRORS,
    ...exports.DSQL_CONS_RULES,
    ...exports.DSQL_IDX_RULES,
    ...exports.DSQL_IDX_LIMIT_RULES,
    ...exports.DSQL_TBL_RULES,
    ...exports.DSQL_FN_RULES,
    ...exports.DSQL_TRIG_RULES,
    ...exports.DSQL_VIEW_RULES,
    ...exports.DSQL_EXT_RULES,
    ...exports.DSQL_SEQ_RULES,
    ...exports.DSQL_DB_RULES,
    ...exports.DSQL_TXN_RULES,
    ...exports.DSQL_MISC_RULES,
};
function createDsqlValidationResult(messages) {
    const errors = messages.filter(m => m.severity === 'error');
    const warnings = messages.filter(m => m.severity === 'warning');
    return {
        valid: errors.length === 0,
        errors,
        warnings,
        all: messages,
    };
}
function lookupDsqlRule(code) {
    return exports.DSQL_ALL_RULES[code];
}
function createDsqlMessage(code, location) {
    const def = exports.DSQL_ALL_RULES[code];
    if (!def) {
        return {
            code,
            severity: 'error',
            message: `Unknown DSQL validation rule: ${code}`,
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
function formatDsqlMessage(msg) {
    const prefix = msg.severity === 'error' ? 'ERROR' : 'WARN';
    const location = [msg.tableName, msg.columnName ?? msg.indexName ?? msg.functionName]
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
function formatDsqlValidationResult(result) {
    const lines = [];
    if (result.errors.length > 0) {
        lines.push(`=== ${result.errors.length} Error(s) ===`);
        for (const msg of result.errors) {
            lines.push(formatDsqlMessage(msg));
            lines.push('');
        }
    }
    if (result.warnings.length > 0) {
        lines.push(`=== ${result.warnings.length} Warning(s) ===`);
        for (const msg of result.warnings) {
            lines.push(formatDsqlMessage(msg));
            lines.push('');
        }
    }
    if (result.valid && result.warnings.length === 0) {
        lines.push('Schema is fully DSQL-compatible.');
    }
    return lines.join('\n');
}
