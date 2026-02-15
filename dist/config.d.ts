import events = require('events');
import stream = require('stream');
import { ConnectionOptions } from 'tls';

/**
 * Dialect type definitions for Relq ORM
 *
 * Defines all supported database dialects grouped by family.
 * Each dialect family shares common SQL syntax patterns.
 *
 * @module config/types
 */
/**
 * PostgreSQL family dialects
 * These dialects use PostgreSQL wire protocol and share most SQL syntax.
 *
 * @remarks
 * | Dialect      | Description                                    |
 * |--------------|------------------------------------------------|
 * | postgres     | Standard PostgreSQL (14, 15, 16, 17+)         |
 * | cockroachdb  | CockroachDB (PostgreSQL-compatible)           |
 * | nile         | Nile (multi-tenant PostgreSQL)                |
 * | dsql         | AWS Aurora DSQL (serverless PostgreSQL)       |
 */
export type PostgresDialect = "postgres" | "cockroachdb" | "nile" | "dsql";
/**
 * SQLite family dialects
 * These dialects use SQLite's SQL syntax with some variations.
 *
 * @remarks
 * | Dialect | Description                                       |
 * |---------|---------------------------------------------------|
 * | sqlite  | Native SQLite (via better-sqlite3, bun:sqlite)   |
 * | turso   | Turso/libSQL (edge SQLite with HTTP transport)   |
 */
export type SQLiteDialect = "sqlite" | "turso";
/**
 * MySQL family dialects
 * These dialects use MySQL wire protocol and share most SQL syntax.
 *
 * @remarks
 * | Dialect     | Description                                    |
 * |-------------|------------------------------------------------|
 * | mysql       | Standard MySQL (5.7, 8.0+)                     |
 * | mariadb     | MariaDB (MySQL-compatible with extensions)     |
 * | planetscale | PlanetScale (serverless MySQL via Vitess)      |
 */
export type MySQLDialect = "mysql" | "mariadb" | "planetscale";
/**
 * Xata dialect
 * API-based database with built-in full-text search and file attachments.
 */
export type XataDialect = "xata";
/**
 * All supported database dialects
 *
 * @example
 * ```typescript
 * import type { DialectName } from 'relq/config';
 *
 * const dialect: DialectName = 'postgres'; // Type-safe
 * const dialect: DialectName = 'mongodb';  // Error: not a valid dialect
 * ```
 */
export type DialectName = PostgresDialect | SQLiteDialect | MySQLDialect | XataDialect;
/**
 * Dialect family categories
 * Used for grouping dialects with similar SQL syntax patterns.
 *
 * @example
 * ```typescript
 * import { getDialectFamily } from 'relq/config';
 *
 * getDialectFamily('postgres');     // 'postgres'
 * getDialectFamily('cockroachdb');  // 'postgres'
 * getDialectFamily('mysql');        // 'mysql'
 * getDialectFamily('sqlite');       // 'sqlite'
 * getDialectFamily('xata');         // 'xata'
 * ```
 */
export type DialectFamily = "postgres" | "mysql" | "sqlite" | "xata";
/**
 * Map of dialect names to their families
 * Used for determining SQL generation strategy.
 */
export declare const DIALECT_FAMILY_MAP: Record<DialectName, DialectFamily>;
/**
 * Get the dialect family for a given dialect name
 *
 * @param dialect - The dialect name
 * @returns The dialect family
 *
 * @example
 * ```typescript
 * getDialectFamily('cockroachdb');  // 'postgres'
 * getDialectFamily('turso');        // 'sqlite'
 * getDialectFamily('planetscale');  // 'mysql'
 * ```
 */
export declare function getDialectFamily(dialect: DialectName): DialectFamily;
/**
 * Check if a dialect belongs to the PostgreSQL family
 */
export declare function isPostgresFamily(dialect: DialectName): dialect is PostgresDialect;
/**
 * Check if a dialect belongs to the SQLite family
 */
export declare function isSQLiteFamily(dialect: DialectName): dialect is SQLiteDialect;
/**
 * Check if a dialect belongs to the MySQL family
 */
export declare function isMySQLFamily(dialect: DialectName): dialect is MySQLDialect;
/**
 * Check if a dialect is Xata
 */
export declare function isXataDialect(dialect: DialectName): dialect is XataDialect;
/**
 * URL protocol to dialect mapping
 * Used for auto-detecting dialect from connection URL.
 */
export declare const PROTOCOL_DIALECT_MAP: Record<string, DialectName>;
/**
 * Host patterns for dialect detection
 * Some cloud databases can be detected by their hostname patterns.
 */
export declare const HOST_DIALECT_PATTERNS: Array<{
	pattern: RegExp;
	dialect: DialectName;
}>;
/**
 * Detect dialect from connection URL
 *
 * @param url - Connection URL or hostname
 * @returns Detected dialect or undefined if not detected
 *
 * @example
 * ```typescript
 * detectDialectFromUrl('postgres://localhost:5432/mydb');
 * // Returns: 'postgres'
 *
 * detectDialectFromUrl('libsql://my-db.turso.io');
 * // Returns: 'turso'
 *
 * detectDialectFromUrl('mysql://user:pass@aws.connect.psdb.cloud/mydb');
 * // Returns: 'planetscale' (detected from host pattern)
 * ```
 */
export declare function detectDialectFromUrl(url: string): DialectName | undefined;
/**
 * Default dialect when none is specified
 */
export declare const DEFAULT_DIALECT: DialectName;
/**
 * All PostgreSQL family dialect names as array (for iteration)
 */
export declare const POSTGRES_DIALECTS: readonly PostgresDialect[];
/**
 * All SQLite family dialect names as array (for iteration)
 */
export declare const SQLITE_DIALECTS: readonly SQLiteDialect[];
/**
 * All MySQL family dialect names as array (for iteration)
 */
export declare const MYSQL_DIALECTS: readonly MySQLDialect[];
/**
 * All dialect names as array (for iteration)
 */
export declare const ALL_DIALECTS: readonly DialectName[];
/**
 * SSL/TLS configuration options
 * Common across PostgreSQL and MySQL families.
 */
export interface SSLConfig {
	/**
	 * Reject connections to servers with untrusted certificates
	 * @default true
	 */
	rejectUnauthorized?: boolean;
	/**
	 * Certificate Authority certificate(s)
	 * Can be a string (PEM format) or Buffer
	 */
	ca?: string | Buffer;
	/**
	 * Client private key
	 * Required for mutual TLS authentication
	 */
	key?: string | Buffer;
	/**
	 * Client certificate
	 * Required for mutual TLS authentication
	 */
	cert?: string | Buffer;
	/**
	 * Server name for SNI (Server Name Indication)
	 * Required for some cloud providers
	 */
	servername?: string;
}
/**
 * SSL configuration can be:
 * - boolean: true enables SSL with default settings
 * - 'require': Same as true, SSL required
 * - 'prefer': Try SSL first, fall back to no SSL
 * - 'allow': No SSL preferred, but allow if server requires
 * - 'disable': Never use SSL
 * - SSLConfig object: Custom SSL settings
 */
export type SSLMode = boolean | "require" | "prefer" | "allow" | "disable" | SSLConfig;
/**
 * AWS regions with autocomplete support
 * Includes all standard AWS regions that may support DSQL
 */
export type AwsRegion = "us-east-1" | "us-east-2" | "us-west-1" | "us-west-2" | "eu-west-1" | "eu-west-2" | "eu-west-3" | "eu-central-1" | "eu-central-2" | "eu-north-1" | "eu-south-1" | "eu-south-2" | "ap-east-1" | "ap-south-1" | "ap-south-2" | "ap-northeast-1" | "ap-northeast-2" | "ap-northeast-3" | "ap-southeast-1" | "ap-southeast-2" | "ap-southeast-3" | "ap-southeast-4" | "me-south-1" | "me-central-1" | "af-south-1" | "il-central-1" | "sa-east-1" | "ca-central-1" | "ca-west-1" | "us-gov-east-1" | "us-gov-west-1" | (string & {});
/**
 * Base connection configuration shared by all dialects
 */
export interface BaseConnectionConfig {
	/**
	 * Connection URL (alternative to individual parameters)
	 * Takes precedence over individual host/port/user/password settings
	 *
	 * @example
	 * ```typescript
	 * // PostgreSQL
	 * url: 'postgresql://user:pass@localhost:5432/mydb'
	 *
	 * // MySQL
	 * url: 'mysql://user:pass@localhost:3306/mydb'
	 *
	 * // SQLite
	 * url: 'file:./data.db'
	 *
	 * // Turso
	 * url: 'libsql://mydb-user.turso.io'
	 * ```
	 */
	url?: string;
	/**
	 * Application name for connection identification
	 * Shown in database process lists (e.g., pg_stat_activity)
	 */
	applicationName?: string;
	/**
	 * Connection timeout in milliseconds
	 * @default 5000
	 */
	connectionTimeoutMs?: number;
}
/**
 * PostgreSQL connection configuration
 * Used for: postgres, cockroachdb, nile, dsql
 *
 * @example
 * ```typescript
 * // Standard PostgreSQL
 * const config: PostgresConnectionConfig = {
 *     host: 'localhost',
 *     port: 5432,
 *     database: 'mydb',
 *     user: 'postgres',
 *     password: 'secret',
 * };
 *
 * // With connection URL
 * const config: PostgresConnectionConfig = {
 *     url: 'postgresql://user:pass@localhost:5432/mydb?sslmode=require',
 * };
 *
 * // AWS Aurora DSQL
 * const config: PostgresConnectionConfig = {
 *     database: 'postgres',
 *     aws: {
 *         hostname: 'abc123.dsql.us-east-1.on.aws',
 *         region: 'us-east-1',
 *     },
 * };
 * ```
 */
export interface PostgresConnectionConfig extends BaseConnectionConfig {
	/** Database host */
	host?: string;
	/**
	 * Database port
	 * @default 5432
	 */
	port?: number;
	/** Database name */
	database?: string;
	/** Database user */
	user?: string;
	/** Database password */
	password?: string;
	/**
	 * SSL/TLS configuration
	 * @default false for localhost, true for remote hosts
	 */
	ssl?: SSLMode;
	/**
	 * PostgreSQL search_path (schema search order)
	 * @example ['public', 'app_schema']
	 */
	searchPath?: string[];
	/**
	 * Statement timeout in milliseconds
	 * @default 0 (no timeout)
	 */
	statementTimeoutMs?: number;
	/**
	 * Lock timeout in milliseconds
	 * @default 0 (no timeout)
	 */
	lockTimeoutMs?: number;
	/**
	 * Idle in transaction session timeout in milliseconds
	 * @default 0 (no timeout)
	 */
	idleInTransactionSessionTimeoutMs?: number;
	/**
	 * AWS DSQL configuration
	 * When provided, enables automatic IAM token generation
	 *
	 * @example
	 * ```typescript
	 * aws: {
	 *     hostname: 'abc123.dsql.us-east-1.on.aws',
	 *     region: 'us-east-1',
	 *     // Uses AWS SDK credential chain by default
	 *     // Or provide explicit credentials:
	 *     accessKeyId: 'AKIA...',
	 *     secretAccessKey: '...',
	 * }
	 * ```
	 */
	aws?: AwsDsqlConfig;
}
/**
 * AWS Aurora DSQL specific configuration
 * Used for automatic IAM token generation and connection
 */
export interface AwsDsqlConfig {
	/**
	 * DSQL cluster hostname
	 * @example "abc123.dsql.us-east-1.on.aws"
	 */
	hostname: string;
	/**
	 * AWS region with autocomplete support
	 * @example "us-east-1"
	 */
	region: AwsRegion;
	/**
	 * AWS Access Key ID
	 * If not provided, uses AWS SDK default credential chain
	 */
	accessKeyId?: string;
	/**
	 * AWS Secret Access Key
	 * If not provided, uses AWS SDK default credential chain
	 */
	secretAccessKey?: string;
	/**
	 * AWS Session Token (for temporary credentials)
	 */
	sessionToken?: string;
	/**
	 * Database user
	 * @default 'admin'
	 */
	user?: string;
	/**
	 * Token expiration time in seconds
	 * @default 604800 (7 days)
	 */
	tokenExpiresIn?: number;
	/**
	 * Use AWS default credential provider chain
	 * (env vars, IAM role, ~/.aws/credentials)
	 * @default true when no explicit credentials provided
	 */
	useDefaultCredentials?: boolean;
}
/**
 * CockroachDB-specific connection config (extends PostgreSQL)
 * Adds CockroachDB-specific options
 */
export interface CockroachDBConnectionConfig extends PostgresConnectionConfig {
	/**
	 * CockroachDB cluster identifier
	 * Required for CockroachDB Serverless
	 */
	cluster?: string;
	/**
	 * Routing ID for cluster routing
	 */
	routingId?: string;
}
/**
 * Nile-specific connection config (extends PostgreSQL)
 * Adds multi-tenant configuration
 */
export interface NileConnectionConfig extends PostgresConnectionConfig {
	/**
	 * Default tenant ID for all queries
	 * Can be overridden per-query
	 */
	tenantId?: string;
	/**
	 * API key for Nile authentication
	 * Alternative to username/password
	 */
	apiKey?: string;
}
/**
 * SQLite connection configuration
 * Used for: sqlite (native)
 *
 * @example
 * ```typescript
 * // File-based SQLite
 * const config: SQLiteConnectionConfig = {
 *     filename: './data/app.db',
 *     mode: 'readwrite',
 * };
 *
 * // In-memory database
 * const config: SQLiteConnectionConfig = {
 *     filename: ':memory:',
 * };
 *
 * // With connection URL
 * const config: SQLiteConnectionConfig = {
 *     url: 'file:./data.db?mode=rw',
 * };
 * ```
 */
export interface SQLiteConnectionConfig extends BaseConnectionConfig {
	/**
	 * Path to database file
	 * Use ':memory:' for in-memory database
	 *
	 * @example './data/app.db'
	 * @example ':memory:'
	 */
	filename?: string;
	/**
	 * File open mode
	 * - 'readonly': Open for reading only
	 * - 'readwrite': Open for read/write (default)
	 * - 'create': Create if not exists (with readwrite)
	 *
	 * @default 'readwrite'
	 */
	mode?: "readonly" | "readwrite" | "create";
	/**
	 * Enable WAL (Write-Ahead Logging) mode
	 * Improves concurrent read performance
	 *
	 * @default true for file databases
	 */
	wal?: boolean;
	/**
	 * Busy timeout in milliseconds
	 * How long to wait for locks before returning SQLITE_BUSY
	 *
	 * @default 5000
	 */
	busyTimeout?: number;
	/**
	 * Enable foreign key enforcement
	 * @default true
	 */
	foreignKeys?: boolean;
	/**
	 * Enable strict mode for type checking
	 * @default false
	 */
	strictMode?: boolean;
	/**
	 * Cache size in pages (-N means N KiB)
	 * @default -2000 (2MB)
	 */
	cacheSize?: number;
}
/**
 * Turso/libSQL connection configuration
 * Used for: turso (edge SQLite)
 *
 * @example
 * ```typescript
 * // Turso cloud database
 * const config: TursoConnectionConfig = {
 *     url: 'libsql://mydb-username.turso.io',
 *     authToken: process.env.TURSO_AUTH_TOKEN,
 * };
 *
 * // With embedded replica
 * const config: TursoConnectionConfig = {
 *     url: 'libsql://mydb-username.turso.io',
 *     authToken: process.env.TURSO_AUTH_TOKEN,
 *     embedded: {
 *         replicaPath: './local-replica.db',
 *         syncInterval: 60000,
 *     },
 * };
 * ```
 */
export interface TursoConnectionConfig extends BaseConnectionConfig {
	/**
	 * libSQL/Turso database URL
	 * @example 'libsql://mydb-username.turso.io'
	 */
	url?: string;
	/**
	 * Authentication token for Turso
	 * Required for cloud databases
	 */
	authToken?: string;
	/**
	 * Embedded replica configuration
	 * Enables local caching with background sync
	 */
	embedded?: {
		/**
		 * Path to local replica database file
		 */
		replicaPath: string;
		/**
		 * Sync interval in milliseconds
		 * @default 60000 (1 minute)
		 */
		syncInterval?: number;
		/**
		 * Read from replica instead of remote
		 * @default true
		 */
		readReplica?: boolean;
	};
	/**
	 * Enable encryption at rest
	 * Requires encryption key
	 */
	encryption?: {
		key: string;
	};
}
/**
 * MySQL connection configuration
 * Used for: mysql, mariadb
 *
 * @example
 * ```typescript
 * // Standard MySQL
 * const config: MySQLConnectionConfig = {
 *     host: 'localhost',
 *     port: 3306,
 *     database: 'mydb',
 *     user: 'root',
 *     password: 'secret',
 * };
 *
 * // With connection URL
 * const config: MySQLConnectionConfig = {
 *     url: 'mysql://user:pass@localhost:3306/mydb',
 * };
 * ```
 */
export interface MySQLConnectionConfig extends BaseConnectionConfig {
	/** Database host */
	host?: string;
	/**
	 * Database port
	 * @default 3306
	 */
	port?: number;
	/** Database name */
	database?: string;
	/** Database user */
	user?: string;
	/** Database password */
	password?: string;
	/**
	 * SSL/TLS configuration
	 */
	ssl?: SSLMode;
	/**
	 * Character set for the connection
	 * @default 'utf8mb4'
	 */
	charset?: string;
	/**
	 * Timezone for the connection
	 * @default 'local'
	 */
	timezone?: string;
	/**
	 * Enable multiple statements in one query
	 * @default false (security)
	 */
	multipleStatements?: boolean;
	/**
	 * Date strings instead of Date objects
	 * @default false
	 */
	dateStrings?: boolean;
	/**
	 * Cast BIGINT to string instead of number
	 * Prevents precision loss for large numbers
	 * @default false
	 */
	bigNumberStrings?: boolean;
	/**
	 * Enable support for big numbers
	 * @default true
	 */
	supportBigNumbers?: boolean;
	/**
	 * Connection flags
	 */
	flags?: string[];
}
/**
 * PlanetScale-specific connection config (extends MySQL)
 * Adds Vitess/PlanetScale-specific options
 *
 * @example
 * ```typescript
 * const config: PlanetScaleConnectionConfig = {
 *     host: 'aws.connect.psdb.cloud',
 *     database: 'mydb',
 *     user: 'username',
 *     password: 'pscale_pw_...',
 *     // Optional branch
 *     branch: 'main',
 * };
 * ```
 */
export interface PlanetScaleConnectionConfig extends MySQLConnectionConfig {
	/**
	 * Database branch to connect to
	 * @default 'main'
	 */
	branch?: string;
	/**
	 * Use HTTP driver instead of MySQL protocol
	 * Enables edge function compatibility
	 * @default false
	 */
	useEdgeDriver?: boolean;
}
/**
 * Xata connection configuration
 * API-based connection using Xata SDK
 *
 * @example
 * ```typescript
 * const config: XataConnectionConfig = {
 *     apiKey: process.env.XATA_API_KEY,
 *     branch: 'main',
 *     workspace: 'my-workspace',
 *     database: 'my-database',
 * };
 *
 * // Or with database URL
 * const config: XataConnectionConfig = {
 *     databaseUrl: 'https://my-workspace.us-east-1.xata.sh/db/my-database',
 *     apiKey: process.env.XATA_API_KEY,
 * };
 * ```
 */
export interface XataConnectionConfig extends BaseConnectionConfig {
	/**
	 * Xata API key
	 * Required for authentication
	 */
	apiKey: string;
	/**
	 * Full database URL
	 * Alternative to workspace + database
	 */
	databaseUrl?: string;
	/**
	 * Xata workspace ID or slug
	 */
	workspace?: string;
	/**
	 * Database name within workspace
	 */
	database?: string;
	/**
	 * Database branch
	 * @default 'main'
	 */
	branch?: string;
	/**
	 * Region for the database
	 * @example 'us-east-1'
	 */
	region?: string;
	/**
	 * Enable consistency mode
	 * Stronger consistency but higher latency
	 * @default 'eventual'
	 */
	consistency?: "eventual" | "strong";
	/**
	 * Enable fallback to replica reads
	 * @default true
	 */
	fallbackBranch?: string;
}
/**
 * Map dialect name to its connection config type
 */
export type ConnectionConfigForDialect<D extends DialectName> = D extends "postgres" ? PostgresConnectionConfig : D extends "cockroachdb" ? CockroachDBConnectionConfig : D extends "nile" ? NileConnectionConfig : D extends "dsql" ? PostgresConnectionConfig : D extends "sqlite" ? SQLiteConnectionConfig : D extends "turso" ? TursoConnectionConfig : D extends "mysql" ? MySQLConnectionConfig : D extends "mariadb" ? MySQLConnectionConfig : D extends "planetscale" ? PlanetScaleConnectionConfig : D extends "xata" ? XataConnectionConfig : never;
/**
 * Union of all connection config types
 */
export type AnyConnectionConfig = PostgresConnectionConfig | CockroachDBConnectionConfig | NileConnectionConfig | SQLiteConnectionConfig | TursoConnectionConfig | MySQLConnectionConfig | PlanetScaleConnectionConfig | XataConnectionConfig;
/**
 * Type-safe PostgreSQL DEFAULT value helpers.
 *
 * Provides a comprehensive set of default value functions for column definitions.
 * All helpers return `DefaultValue` objects that generate proper SQL syntax.
 *
 * @example
 * ```typescript
 * import { DEFAULT } from './defaults';
 *
 * const table = defineTable('users', {
 *   id: uuid().primaryKey().default(DEFAULT.genRandomUuid()),
 *   createdAt: timestamptz().notNull().default(DEFAULT.now()),
 *   settings: jsonb().default(DEFAULT.emptyObject()),
 *   status: varchar(20).default(DEFAULT.string('active')),
 * });
 * ```
 *
 * @remarks
 * **General Dialect Support:**
 * | Category      | PostgreSQL | CockroachDB | Nile | DSQL | SQLite | MySQL |
 * |---------------|------------|-------------|------|------|--------|-------|
 * | UUID          | ✅         | ✅          | ✅   | ✅   | ❌     | ⚠️    |
 * | Date/Time     | ✅         | ✅          | ✅   | ✅   | ⚠️     | ✅    |
 * | Sequences     | ✅         | ✅          | ✅   | ❌   | ❌     | ❌    |
 * | JSON          | ✅         | ✅          | ✅   | ❌   | ⚠️     | ✅    |
 * | Arrays        | ✅         | ✅          | ✅   | ❌   | ❌     | ❌    |
 * | Ranges        | ✅         | ❌          | ✅   | ❌   | ❌     | ❌    |
 *
 * @module schema-definition/defaults
 * @since 1.0.0
 */
/**
 * Represents a SQL DEFAULT value expression.
 *
 * This interface is used to mark default values for type safety and
 * to carry the SQL representation.
 */
export interface DefaultValue {
	/** The SQL string for this default value */
	readonly $sql: string;
	/** Brand to identify as a default value */
	readonly $isDefault: true;
}
declare const EMPTY_OBJECT: unique symbol;
declare const EMPTY_ARRAY: unique symbol;
/**
 * Identity column generation options for GENERATED AS IDENTITY
 *
 * @see https://www.postgresql.org/docs/current/sql-createtable.html
 */
export interface IdentityOptions {
	/** Starting value for the sequence (default: 1) */
	start?: number;
	/** Increment between values (default: 1) */
	increment?: number;
	/** Minimum value for the sequence */
	minValue?: number;
	/** Maximum value for the sequence */
	maxValue?: number;
	/** Number of values to cache (default: 1) */
	cache?: number;
	/** Whether to cycle back to start after reaching max (default: false) */
	cycle?: boolean;
}
export interface ColumnConfig<T = unknown> {
	$type: string;
	$sqlType?: string;
	$tsType?: T;
	$nullable?: boolean;
	$default?: T | (() => T) | string | object | typeof EMPTY_OBJECT | typeof EMPTY_ARRAY | DefaultValue;
	$primaryKey?: boolean;
	$unique?: boolean;
	$references?: {
		table: string;
		column: string;
		onDelete?: string;
		onUpdate?: string;
	};
	$check?: string;
	$checkValues?: readonly string[];
	$generated?: {
		expression: string;
		stored?: boolean;
	};
	/** Identity column configuration (GENERATED AS IDENTITY) */
	$identity?: {
		always: boolean;
		options?: IdentityOptions;
	};
	$array?: boolean;
	$dimensions?: number;
	$length?: number;
	$precision?: number;
	$scale?: number;
	$withTimezone?: boolean;
	/** COLLATE clause for text columns */
	$collate?: string;
	$columnName?: string;
	$trackingId?: string;
}
/**
 * AST Type Definitions
 *
 * Type definitions for parsed PostgreSQL schema objects.
 * These are intermediate representations between pgsql-parser AST and TypeScript code generation.
 */
export interface ParsedColumn {
	/** SQL column name (from varchar('sql_name') or same as tsName if not specified) */
	name: string;
	/** TypeScript property name (the key in the columns object) */
	tsName: string;
	type: string;
	typeParams?: {
		precision?: number;
		scale?: number;
		length?: number;
	};
	isNullable: boolean;
	isPrimaryKey: boolean;
	isUnique: boolean;
	hasDefault: boolean;
	defaultValue?: string;
	isGenerated: boolean;
	generatedExpression?: string;
	generatedExpressionAst?: any;
	checkConstraint?: {
		name: string;
		expression: string;
		expressionAst?: any;
	};
	references?: {
		table: string;
		column: string;
		onDelete?: string;
		onUpdate?: string;
		match?: "SIMPLE" | "FULL";
		deferrable?: boolean;
		initiallyDeferred?: boolean;
	};
	isArray: boolean;
	arrayDimensions?: number;
	comment?: string;
	/** Tracking ID for rename detection in versioning */
	trackingId?: string;
}
export interface ParsedConstraint {
	name: string;
	type: "PRIMARY KEY" | "UNIQUE" | "FOREIGN KEY" | "CHECK" | "EXCLUDE";
	columns: string[];
	expression?: string;
	expressionAst?: any;
	comment?: string;
	references?: {
		table: string;
		columns: string[];
		onDelete?: string;
		onUpdate?: string;
		match?: "SIMPLE" | "FULL";
		deferrable?: boolean;
		initiallyDeferred?: boolean;
	};
	/** Tracking ID for rename detection in versioning */
	trackingId?: string;
}
export interface ParsedIndex {
	name: string;
	columns: string[];
	isUnique: boolean;
	method?: string;
	whereClause?: string;
	whereClauseAst?: any;
	includeColumns?: string[];
	opclass?: string;
	isExpression?: boolean;
	expressions?: string[];
	comment?: string;
	/** Tracking ID for rename detection in versioning */
	trackingId?: string;
}
export interface ParsedTable {
	name: string;
	schema?: string;
	columns: ParsedColumn[];
	constraints: ParsedConstraint[];
	indexes: ParsedIndex[];
	isPartitioned: boolean;
	partitionType?: "RANGE" | "LIST" | "HASH";
	partitionKey?: string[];
	partitionOf?: string;
	partitionBound?: string;
	inherits?: string[];
	comment?: string;
	childPartitions?: {
		name: string;
		partitionBound: string;
	}[];
	/** Tracking ID for rename detection in versioning */
	trackingId?: string;
}
export interface IndexStorageOptions {
	/** Fill factor (10-100). Lower values leave more space for updates. Default varies by index type. */
	fillfactor?: number;
	/** For GIN indexes: enable fast update technique */
	fastupdate?: boolean;
	/** For GIN indexes: pending list limit in KB */
	ginPendingListLimit?: number;
	/** For BRIN indexes: pages per range */
	pagesPerRange?: number;
	/** For BRIN indexes: enable auto-summarization */
	autosummarize?: boolean;
	/** Number of leaf pages to buffer for GiST indexes */
	buffering?: "auto" | "on" | "off";
}
export interface IndexDefinition {
	name: string;
	columns: string[];
	unique?: boolean;
	using?: "BTREE" | "HASH" | "GIN" | "GIST" | "BRIN" | "SPGIST";
	where?: string;
	isUnique?: boolean;
	/** Index storage options like fillfactor */
	with?: IndexStorageOptions;
	/** Tablespace for the index */
	tablespace?: string;
	/** Nulls ordering: first or last */
	nulls?: "first" | "last";
	/** Sort order */
	order?: "asc" | "desc";
	/** Include columns (covering index) */
	include?: string[];
	/** Expression for expression-based indexes */
	expression?: string;
	/**
	 * Generate CREATE INDEX IF NOT EXISTS instead of CREATE INDEX.
	 *
	 * When true, the generated SQL will be:
	 * `CREATE INDEX IF NOT EXISTS index_name ON table_name (...)`
	 *
	 * This makes index creation idempotent - if the index already exists,
	 * PostgreSQL will skip creation instead of throwing an error.
	 *
	 * Use cases:
	 * - Idempotent migrations that can be run multiple times safely
	 * - Manual schema management where you want to avoid errors on re-runs
	 * - Incremental schema updates in development environments
	 * - CI/CD pipelines where schema might already exist
	 *
	 * @default false
	 */
	ifNotExists?: boolean;
	/**
	 * Use ON ONLY clause for partitioned tables.
	 *
	 * When true, the generated SQL will be:
	 * `CREATE INDEX index_name ON ONLY table_name (...)`
	 *
	 * This creates an index on the parent partitioned table only, without
	 * automatically creating matching indexes on child partitions. Each
	 * partition must have its own index created separately.
	 *
	 * Use cases:
	 * - When you want different index configurations per partition
	 * - When partitions have different access patterns
	 * - When you want to control index creation timing per partition
	 * - For declarative partitioning with custom index strategies
	 * - When some partitions don't need certain indexes (e.g., archive partitions)
	 *
	 * @default false
	 * @see https://www.postgresql.org/docs/current/ddl-partitioning.html#DDL-PARTITIONING-DECLARATIVE-MAINTENANCE
	 */
	tableOnly?: boolean;
	/** Index comment/description */
	comment?: string;
	/** Tracking ID for rename detection */
	trackingId?: string;
	/**
	 * NULLS NOT DISTINCT for unique indexes (PostgreSQL 15+).
	 * When true, NULL values are considered equal (not distinct) in unique constraints.
	 * @default false - NULL values are considered distinct
	 */
	nullsNotDistinct?: boolean;
}
/**
 * Partition Types and Builders
 *
 * Provides type-safe, elegant API for PostgreSQL partitioning.
 * Supports LIST, RANGE, HASH and multi-level subpartitioning.
 */
export type PartitionType = "LIST" | "RANGE" | "HASH";
/**
 * Partition strategy definition
 */
export interface PartitionStrategyDef {
	readonly $type: PartitionType;
	readonly $column: string;
	readonly $modulus?: number;
	readonly $subpartition?: PartitionStrategyDef;
}
/**
 * Child partition definition
 */
export interface ChildPartitionDef {
	readonly $name: string;
	readonly $partitionType: "LIST" | "RANGE" | "HASH" | "DEFAULT";
	readonly $values?: string[];
	readonly $from?: string;
	readonly $to?: string;
	readonly $modulus?: number;
	readonly $remainder?: number;
	readonly $isDefault?: boolean;
}
export type IsSerialType<T extends string> = T extends "SERIAL" | "BIGSERIAL" | "SMALLSERIAL" | "SERIAL4" | "SERIAL2" | "SERIAL8" ? true : false;
export type HasDefault<C> = C extends {
	$default: undefined;
} ? false : C extends {
	$default: infer D;
} ? D extends undefined ? false : true : false;
export type HasGenerated<C> = C extends {
	$generated: undefined;
} ? false : C extends {
	$generated: infer G;
} ? G extends undefined ? false : true : false;
export type GetColumnType<C> = C extends {
	$type: infer T;
} ? T extends string ? T : string : string;
/**
 * Check if column is explicitly marked NOT NULL
 * - $nullable: false -> explicitly NOT NULL (via .notNull())
 * - $nullable: true -> explicitly nullable (via .nullable())
 * - $nullable: undefined -> implicitly nullable (PostgreSQL default)
 */
export type IsExplicitlyNotNull<C> = C extends {
	$nullable: false;
} ? true : false;
/**
 * Check if column is a PRIMARY KEY
 * PRIMARY KEY columns are implicitly NOT NULL in PostgreSQL
 */
export type IsPrimaryKey<C> = C extends {
	$primaryKey: true;
} ? true : false;
/**
 * Determine if a column is required for INSERT:
 * REQUIRED when: (explicitly NOT NULL or PRIMARY KEY) AND no default/generated value
 * OPTIONAL when: has default, is generated, is serial, or is nullable (explicit or implicit)
 */
export type IsRequiredForInsert<C> = HasDefault<C> extends true ? false : HasGenerated<C> extends true ? false : IsSerialType<GetColumnType<C>> extends true ? false : IsExplicitlyNotNull<C> extends true ? true : IsPrimaryKey<C> extends true ? true : false;
/**
 * Determine if a column is required for SELECT:
 * REQUIRED when: explicitly NOT NULL, has default, is generated, or is PRIMARY KEY
 * OPTIONAL when: nullable (no NOT NULL constraint)
 */
export type IsRequiredForSelect<C> = IsExplicitlyNotNull<C> extends true ? true : IsPrimaryKey<C> extends true ? true : HasDefault<C> extends true ? true : HasGenerated<C> extends true ? true : IsSerialType<GetColumnType<C>> extends true ? true : false;
export type Simplify<T> = {
	[K in keyof T]: T[K];
} & {};
/**
 * Check if a type is a symbol (including unique symbols)
 * Using conditional distribution to properly match unique symbol types
 */
export type IsSymbol<T> = T extends symbol ? true : false;
/**
 * Check if a type has internal marker properties (like DefaultValue or SqlExpression)
 */
export type HasInternalMarker<T> = T extends {
	$isDefault: true;
} ? true : T extends {
	$sql: string;
} ? true : false;
/**
 * Clean a column type by removing DefaultValue union members, symbols, and internal types
 * (symbols like EMPTY_OBJECT/EMPTY_ARRAY can leak into type inference from $default)
 * Uses conditional distribution to properly handle unique symbol types.
 */
export type CleanType<T> = T extends any ? IsSymbol<T> extends true ? never : HasInternalMarker<T> extends true ? never : T : never;
/**
 * Build SELECT type:
 * - All columns are ALWAYS present (no `?` optional marker)
 * - NOT NULL columns: `column: Type`
 * - Nullable columns: `column: Type | null`
 *
 * Note: Unlike INSERT where `?` means "can omit", SELECT always returns all columns.
 * The difference is whether the VALUE can be null, not whether the COLUMN is present.
 */
export type BuildSelectType<T extends Record<string, ColumnConfig>> = Simplify<{
	[K in keyof T as IsRequiredForSelect<T[K]> extends true ? K : never]: T[K] extends ColumnConfig<infer U> ? T[K] extends {
		$nullable: true;
	} ? CleanType<U> | null : CleanType<U> : unknown;
} & {
	[K in keyof T as IsRequiredForSelect<T[K]> extends true ? never : K]: T[K] extends ColumnConfig<infer U> ? CleanType<U> | null : unknown;
}>;
export type RequiredInsertKeys<T extends Record<string, ColumnConfig>> = {
	[K in keyof T]: IsRequiredForInsert<T[K]> extends true ? K : never;
}[keyof T];
export type OptionalInsertKeys<T extends Record<string, ColumnConfig>> = {
	[K in keyof T]: IsRequiredForInsert<T[K]> extends true ? never : K;
}[keyof T];
/**
 * Infer INSERT value type for a column:
 * - NOT NULL columns: `Type` (no null allowed)
 * - Nullable columns (explicit or implicit): `Type | null`
 */
export type InferInsertValue<C extends ColumnConfig> = C extends ColumnConfig<infer U> ? IsExplicitlyNotNull<C> extends true ? CleanType<U> : IsPrimaryKey<C> extends true ? CleanType<U> : CleanType<U> | null : unknown;
export type BuildInsertType<T extends Record<string, ColumnConfig>> = Simplify<{
	[K in RequiredInsertKeys<T>]: InferInsertValue<T[K]>;
} & {
	[K in OptionalInsertKeys<T>]?: InferInsertValue<T[K]>;
}>;
export interface TableDefinition<T extends Record<string, ColumnConfig>> {
	$name: string;
	$schema?: string;
	$columns: T;
	$primaryKey?: string[];
	$uniqueConstraints?: Array<{
		columns: string[];
		name?: string;
	}>;
	$checkConstraints?: Array<{
		expression: string;
		name?: string;
	}>;
	/** Table-level constraints (composite PKs, etc.) */
	$constraints?: ConstraintDef[];
	$foreignKeys?: Array<{
		columns: string[];
		references: {
			table: string;
			columns: string[];
		};
		onDelete?: string;
		onUpdate?: string;
		name?: string;
		/** Tracking ID for rename detection */
		trackingId?: string;
		/** Add constraint as NOT VALID (skip existing data validation) */
		notValid?: boolean;
	}>;
	$indexes?: IndexDefinition[];
	$inherits?: string[];
	$partitionBy?: PartitionStrategyDef;
	/** Child partition definitions */
	$partitions?: ChildPartitionDef[];
	$tablespace?: string;
	$withOptions?: Record<string, unknown>;
	/** Whether to use CREATE TABLE IF NOT EXISTS */
	$ifNotExists?: boolean;
	/** Tracking ID for rename detection */
	$trackingId?: string;
	/** Table comment/description */
	$comment?: string;
	/** Create a TEMPORARY table (session-scoped) */
	$temporary?: boolean;
	/** Create an UNLOGGED table (not crash-safe but faster) */
	$unlogged?: boolean;
	$inferSelect: BuildSelectType<T>;
	$inferInsert: BuildInsertType<T>;
	toSQL(): string;
	toCreateIndexSQL(): string[];
	/** Returns AST for schema diffing and migration generation */
	toAST(): ParsedTable;
}
/** Constraint definition result */
export interface ConstraintDef {
	readonly $type: "PRIMARY KEY" | "UNIQUE" | "EXCLUDE";
	readonly $name: string;
	readonly $columns: string[];
	readonly $expression?: string;
	/** Tracking ID for rename detection */
	readonly $trackingId?: string;
}
/**
 * Migration configuration
 */
export interface MigrationConfig {
	/**
	 * Directory for migration files
	 * @default './relq'
	 */
	directory?: string;
	/**
	 * Table name for tracking applied migrations
	 * @default '__relq_migrations__'
	 */
	tableName?: string;
	/**
	 * Schema name for migrations table
	 * @default 'public' (PostgreSQL), none for others
	 */
	schemaName?: string;
	/**
	 * Migration filename format
	 * @default 'timestamp'
	 */
	format?: "sequential" | "timestamp";
}
/**
 * Logging configuration
 */
export interface LoggingConfig {
	/**
	 * Log executed queries
	 * @default false
	 */
	queries?: boolean;
	/**
	 * Log query parameters
	 * @default false
	 */
	parameters?: boolean;
	/**
	 * Log query execution time
	 * @default false
	 */
	timing?: boolean;
	/**
	 * Log errors
	 * @default true
	 */
	errors?: boolean;
	/**
	 * Log level
	 * @default 'error'
	 */
	level?: "debug" | "info" | "warn" | "error" | "silent";
}
/**
 * Connection pool configuration
 */
export interface PoolConfig {
	/**
	 * Minimum pool size
	 * @default 0 (create on demand)
	 */
	min?: number;
	/**
	 * Maximum pool size
	 * @default 10 (traditional), 1 (serverless)
	 */
	max?: number;
	/**
	 * Idle timeout in milliseconds
	 * @default 30000
	 */
	idleTimeoutMs?: number;
	/**
	 * Connection timeout in milliseconds
	 * @default 5000
	 */
	connectionTimeoutMs?: number;
	/**
	 * Acquire timeout in milliseconds
	 * @default 60000
	 */
	acquireTimeoutMs?: number;
}
/**
 * Schema sync configuration
 */
export interface SyncConfig {
	/**
	 * Path to snapshot file
	 * @default '.relq/snapshot.json'
	 */
	snapshot?: string;
	/**
	 * Table patterns to ignore
	 * @example ['_temp_*', '__relq_*', 'pg_*']
	 */
	ignore?: string[];
	/**
	 * Backup directory
	 * @default '.relq/backups'
	 */
	backupDir?: string;
	/**
	 * Auto-generate migrations on diff
	 * @default true
	 */
	autoGenerate?: boolean;
	/**
	 * Auto-apply migrations (dangerous in production)
	 * @default false
	 */
	autoPush?: boolean;
}
/**
 * Studio configuration
 */
export interface StudioConfig {
	/**
	 * Studio theme
	 * @default 'github-dark'
	 */
	theme?: "github-dark" | "purple" | "blue" | "green" | "orange";
	/**
	 * Studio server port
	 * @default 3000
	 */
	port?: number;
	/**
	 * Open browser on start
	 * @default true
	 */
	openBrowser?: boolean;
	/**
	 * AI assistant configuration
	 */
	ai?: {
		provider?: "gemini" | "openai" | "anthropic";
		apiKey?: string;
		model?: string;
		autocomplete?: boolean;
		chat?: boolean;
	};
}
/**
 * Code generation configuration
 */
export interface GenerateConfig {
	/**
	 * Output directory for generated files
	 */
	outDir: string;
	/**
	 * Convert snake_case to camelCase
	 * @default true
	 */
	camelCase?: boolean;
	/**
	 * Include database functions
	 * @default false
	 */
	includeFunctions?: boolean;
	/**
	 * Include triggers
	 * @default false
	 */
	includeTriggers?: boolean;
	/**
	 * Render numeric as string
	 * @default false
	 */
	numericAsString?: boolean;
}
/**
 * Base configuration options shared by all dialects
 */
export interface BaseRelqConfig<TTables = Record<string, any>> {
	/**
	 * Schema configuration
	 * Can be a path to schema file or inline table definitions
	 */
	schema?: string | {
		tables?: TTables;
		directory?: string;
		defaultSchema?: string;
	};
	/** Migration settings */
	migrations?: MigrationConfig;
	/** Logging settings */
	logging?: LoggingConfig;
	/** Connection pool settings */
	pool?: PoolConfig;
	/** Schema sync settings */
	sync?: SyncConfig;
	/** Studio settings */
	studio?: StudioConfig;
	/** Code generation settings */
	generate?: GenerateConfig;
	/**
	 * Author name for commits
	 * @example 'John Doe'
	 */
	author?: string;
	/**
	 * Include database functions/procedures in schema generation
	 *
	 * @supported postgres, cockroachdb, nile, mysql, mariadb
	 * @default false
	 */
	includeFunctions?: boolean;
	/**
	 * Include triggers in schema generation
	 *
	 * @supported postgres, cockroachdb, nile, mysql, mariadb, sqlite, turso
	 * @default false
	 */
	includeTriggers?: boolean;
	/**
	 * Include views and materialized views in schema generation
	 *
	 * @supported postgres, cockroachdb, nile, mysql, mariadb, sqlite, turso
	 * @default false
	 */
	includeViews?: boolean;
	/**
	 * PostgreSQL extensions to enable
	 * @example ['uuid-ossp', 'pgvector']
	 */
	extensions?: string[];
}
/**
 * PostgreSQL configuration
 */
export interface PostgresRelqConfig<TTables = Record<string, any>> extends BaseRelqConfig<TTables> {
	dialect?: "postgres";
	connection?: PostgresConnectionConfig;
}
/**
 * CockroachDB configuration
 */
export interface CockroachDBRelqConfig<TTables = Record<string, any>> extends BaseRelqConfig<TTables> {
	dialect: "cockroachdb";
	connection?: CockroachDBConnectionConfig;
}
/**
 * Nile (multi-tenant PostgreSQL) configuration
 */
export interface NileRelqConfig<TTables = Record<string, any>> extends BaseRelqConfig<TTables> {
	dialect: "nile";
	connection?: NileConnectionConfig;
}
/**
 * AWS Aurora DSQL configuration
 */
export interface DsqlRelqConfig<TTables = Record<string, any>> extends BaseRelqConfig<TTables> {
	dialect: "dsql";
	connection?: PostgresConnectionConfig;
}
/**
 * SQLite configuration
 */
export interface SQLiteRelqConfig<TTables = Record<string, any>> extends BaseRelqConfig<TTables> {
	dialect: "sqlite";
	connection?: SQLiteConnectionConfig;
}
/**
 * Turso/libSQL configuration
 */
export interface TursoRelqConfig<TTables = Record<string, any>> extends BaseRelqConfig<TTables> {
	dialect: "turso";
	connection?: TursoConnectionConfig;
}
/**
 * MySQL configuration
 */
export interface MySQLRelqConfig<TTables = Record<string, any>> extends BaseRelqConfig<TTables> {
	dialect: "mysql";
	connection?: MySQLConnectionConfig;
}
/**
 * MariaDB configuration
 */
export interface MariaDBRelqConfig<TTables = Record<string, any>> extends BaseRelqConfig<TTables> {
	dialect: "mariadb";
	connection?: MySQLConnectionConfig;
}
/**
 * PlanetScale configuration
 */
export interface PlanetScaleRelqConfig<TTables = Record<string, any>> extends BaseRelqConfig<TTables> {
	dialect: "planetscale";
	connection?: PlanetScaleConnectionConfig;
}
/**
 * Xata configuration
 */
export interface XataRelqConfig<TTables = Record<string, any>> extends BaseRelqConfig<TTables> {
	dialect: "xata";
	connection?: XataConnectionConfig;
}
/**
 * Union of all dialect-specific configurations
 */
export type RelqConfig<TTables = Record<string, any>> = PostgresRelqConfig<TTables> | CockroachDBRelqConfig<TTables> | NileRelqConfig<TTables> | DsqlRelqConfig<TTables> | SQLiteRelqConfig<TTables> | TursoRelqConfig<TTables> | MySQLRelqConfig<TTables> | MariaDBRelqConfig<TTables> | PlanetScaleRelqConfig<TTables> | XataRelqConfig<TTables>;
/**
 * Get config type for a specific dialect
 */
export type RelqConfigForDialect<D extends DialectName, TTables = Record<string, any>> = D extends "postgres" ? PostgresRelqConfig<TTables> : D extends "cockroachdb" ? CockroachDBRelqConfig<TTables> : D extends "nile" ? NileRelqConfig<TTables> : D extends "dsql" ? DsqlRelqConfig<TTables> : D extends "sqlite" ? SQLiteRelqConfig<TTables> : D extends "turso" ? TursoRelqConfig<TTables> : D extends "mysql" ? MySQLRelqConfig<TTables> : D extends "mariadb" ? MariaDBRelqConfig<TTables> : D extends "planetscale" ? PlanetScaleRelqConfig<TTables> : D extends "xata" ? XataRelqConfig<TTables> : never;
/**
 * Define Relq configuration with full type safety
 *
 * The dialect determines which connection options are available.
 * TypeScript will provide autocompletion for dialect-specific options.
 *
 * @example
 * ```typescript
 * // PostgreSQL (default)
 * export default defineConfig({
 *     connection: {
 *         host: 'localhost',
 *         port: 5432,
 *         database: 'mydb',
 *     },
 * });
 *
 * // Explicit PostgreSQL
 * export default defineConfig({
 *     dialect: 'postgres',
 *     connection: {
 *         host: 'localhost',
 *         database: 'mydb',
 *         ssl: 'require',
 *     },
 * });
 *
 * // AWS Aurora DSQL
 * export default defineConfig({
 *     dialect: 'dsql',
 *     connection: {
 *         database: 'postgres',
 *         aws: {
 *             hostname: 'abc.dsql.us-east-1.on.aws',
 *             region: 'us-east-1',
 *         },
 *     },
 * });
 *
 * // SQLite
 * export default defineConfig({
 *     dialect: 'sqlite',
 *     connection: {
 *         filename: './data.db',
 *     },
 * });
 *
 * // Turso
 * export default defineConfig({
 *     dialect: 'turso',
 *     connection: {
 *         url: 'libsql://mydb.turso.io',
 *         authToken: process.env.TURSO_AUTH_TOKEN,
 *     },
 * });
 *
 * // MySQL
 * export default defineConfig({
 *     dialect: 'mysql',
 *     connection: {
 *         host: 'localhost',
 *         port: 3306,
 *         database: 'mydb',
 *     },
 * });
 * ```
 */
export declare function defineConfig<TTables extends Record<string, TableDefinition<Record<string, ColumnConfig>>> = Record<string, any>>(config: PostgresRelqConfig<TTables>): PostgresRelqConfig<TTables>;
export declare function defineConfig<TTables extends Record<string, TableDefinition<Record<string, ColumnConfig>>> = Record<string, any>>(config: CockroachDBRelqConfig<TTables>): CockroachDBRelqConfig<TTables>;
export declare function defineConfig<TTables extends Record<string, TableDefinition<Record<string, ColumnConfig>>> = Record<string, any>>(config: NileRelqConfig<TTables>): NileRelqConfig<TTables>;
export declare function defineConfig<TTables extends Record<string, TableDefinition<Record<string, ColumnConfig>>> = Record<string, any>>(config: DsqlRelqConfig<TTables>): DsqlRelqConfig<TTables>;
export declare function defineConfig<TTables extends Record<string, TableDefinition<Record<string, ColumnConfig>>> = Record<string, any>>(config: SQLiteRelqConfig<TTables>): SQLiteRelqConfig<TTables>;
export declare function defineConfig<TTables extends Record<string, TableDefinition<Record<string, ColumnConfig>>> = Record<string, any>>(config: TursoRelqConfig<TTables>): TursoRelqConfig<TTables>;
export declare function defineConfig<TTables extends Record<string, TableDefinition<Record<string, ColumnConfig>>> = Record<string, any>>(config: MySQLRelqConfig<TTables>): MySQLRelqConfig<TTables>;
export declare function defineConfig<TTables extends Record<string, TableDefinition<Record<string, ColumnConfig>>> = Record<string, any>>(config: MariaDBRelqConfig<TTables>): MariaDBRelqConfig<TTables>;
export declare function defineConfig<TTables extends Record<string, TableDefinition<Record<string, ColumnConfig>>> = Record<string, any>>(config: PlanetScaleRelqConfig<TTables>): PlanetScaleRelqConfig<TTables>;
export declare function defineConfig<TTables extends Record<string, TableDefinition<Record<string, ColumnConfig>>> = Record<string, any>>(config: XataRelqConfig<TTables>): XataRelqConfig<TTables>;
/**
 * Extract the dialect from a config object
 */
export type ExtractDialect<T extends RelqConfig> = T extends {
	dialect: infer D extends DialectName;
} ? D : "postgres";
/**
 * Check if config is for a specific dialect
 */
export declare function isDialect<D extends DialectName>(config: RelqConfig, dialect: D): config is RelqConfigForDialect<D>;
/**
 * Get the resolved dialect from config (defaults to 'postgres')
 */
export declare function getDialect(config: RelqConfig): DialectName;
/**
 * Result of parsing a connection URL
 */
export interface ParsedConnectionUrl {
	/** Detected or specified dialect */
	dialect: DialectName;
	/** Connection configuration extracted from URL */
	connection: AnyConnectionConfig;
	/** Original URL (sanitized - password hidden) */
	originalUrl: string;
	/** Whether dialect was auto-detected */
	dialectAutoDetected: boolean;
}
/**
 * Parse a database connection URL into connection configuration
 *
 * Supports all dialects with automatic detection:
 * - PostgreSQL: `postgresql://`, `postgres://`, `pg://`
 * - CockroachDB: `cockroachdb://`, `crdb://`
 * - MySQL: `mysql://`, `mysql2://`
 * - MariaDB: `mariadb://`
 * - SQLite: `file:`, `sqlite://`, `sqlite3://`
 * - Turso: `libsql://`, `turso://`, `wss://`
 * - Xata: Detected by hostname pattern
 *
 * @param url - Connection URL to parse
 * @param dialectHint - Optional dialect override (skips auto-detection)
 * @returns Parsed connection configuration with dialect
 *
 * @example
 * ```typescript
 * // PostgreSQL
 * const result = parseConnectionUrl('postgresql://user:pass@localhost:5432/mydb');
 * // { dialect: 'postgres', connection: { host: 'localhost', ... } }
 *
 * // Turso
 * const result = parseConnectionUrl('libsql://my-db.turso.io');
 * // { dialect: 'turso', connection: { url: 'libsql://...', ... } }
 *
 * // Auto-detect AWS DSQL from hostname
 * const result = parseConnectionUrl('postgresql://admin@abc.dsql.us-east-1.on.aws/postgres');
 * // { dialect: 'dsql', connection: { host: 'abc.dsql.us-east-1.on.aws', ... } }
 * ```
 */
export declare function parseConnectionUrl(url: string, dialectHint?: DialectName): ParsedConnectionUrl;
/**
 * Build a connection URL from config parameters
 *
 * @param config - Connection configuration
 * @param dialect - Database dialect
 * @returns Connection URL string
 *
 * @example
 * ```typescript
 * buildConnectionUrl({
 *     host: 'localhost',
 *     port: 5432,
 *     database: 'mydb',
 *     user: 'postgres',
 *     password: 'secret',
 * }, 'postgres');
 * // Returns: 'postgresql://postgres:secret@localhost:5432/mydb'
 * ```
 */
export declare function buildConnectionUrl(config: AnyConnectionConfig, dialect: DialectName): string;
/**
 * Extract database name from connection config
 */
export declare function getDatabaseName(config: AnyConnectionConfig, dialect: DialectName): string | undefined;
/**
 * Standard environment variable names for database configuration.
 * Relq checks these in order of precedence.
 */
export declare const ENV_VARS: {
	readonly DATABASE_URL: "DATABASE_URL";
	readonly POSTGRES_URL: "POSTGRES_URL";
	readonly POSTGRESQL_URL: "POSTGRESQL_URL";
	readonly PG_URL: "PG_URL";
	readonly MYSQL_URL: "MYSQL_URL";
	readonly SQLITE_URL: "SQLITE_URL";
	readonly TURSO_URL: "TURSO_URL";
	readonly LIBSQL_URL: "LIBSQL_URL";
	readonly XATA_DATABASE_URL: "XATA_DATABASE_URL";
	readonly RELQ_DIALECT: "RELQ_DIALECT";
	readonly PGHOST: "PGHOST";
	readonly PGPORT: "PGPORT";
	readonly PGDATABASE: "PGDATABASE";
	readonly PGUSER: "PGUSER";
	readonly PGPASSWORD: "PGPASSWORD";
	readonly PGSSLMODE: "PGSSLMODE";
	readonly MYSQL_HOST: "MYSQL_HOST";
	readonly MYSQL_PORT: "MYSQL_PORT";
	readonly MYSQL_DATABASE: "MYSQL_DATABASE";
	readonly MYSQL_USER: "MYSQL_USER";
	readonly MYSQL_PASSWORD: "MYSQL_PASSWORD";
	readonly SQLITE_DATABASE: "SQLITE_DATABASE";
	readonly SQLITE_FILENAME: "SQLITE_FILENAME";
	readonly TURSO_DATABASE_URL: "TURSO_DATABASE_URL";
	readonly TURSO_AUTH_TOKEN: "TURSO_AUTH_TOKEN";
	readonly LIBSQL_AUTH_TOKEN: "LIBSQL_AUTH_TOKEN";
	readonly XATA_API_KEY: "XATA_API_KEY";
	readonly XATA_BRANCH: "XATA_BRANCH";
	readonly AWS_DSQL_HOSTNAME: "AWS_DSQL_HOSTNAME";
	readonly AWS_DSQL_REGION: "AWS_DSQL_REGION";
	readonly AWS_ACCESS_KEY_ID: "AWS_ACCESS_KEY_ID";
	readonly AWS_SECRET_ACCESS_KEY: "AWS_SECRET_ACCESS_KEY";
	readonly AWS_SESSION_TOKEN: "AWS_SESSION_TOKEN";
	readonly AWS_REGION: "AWS_REGION";
	readonly COCKROACH_URL: "COCKROACH_URL";
	readonly COCKROACHDB_URL: "COCKROACHDB_URL";
	readonly NILE_URL: "NILE_URL";
	readonly NILE_API_KEY: "NILE_API_KEY";
	readonly PLANETSCALE_URL: "PLANETSCALE_URL";
	readonly PLANETSCALE_HOST: "PLANETSCALE_HOST";
};
/**
 * Result of loading configuration from environment
 */
export interface EnvConfigResult {
	/** Detected or specified dialect */
	dialect: DialectName;
	/** Connection configuration from environment */
	connection: AnyConnectionConfig;
	/** Environment variables that were used */
	usedVars: string[];
	/** Whether any configuration was found */
	found: boolean;
}
/**
 * Load database configuration from environment variables
 *
 * Checks environment variables in order of precedence:
 * 1. RELQ_DIALECT (explicit dialect override)
 * 2. DATABASE_URL (universal connection string)
 * 3. Dialect-specific URLs (POSTGRES_URL, MYSQL_URL, etc.)
 * 4. Individual connection parameters (PGHOST, MYSQL_HOST, etc.)
 * 5. AWS DSQL environment variables
 *
 * @param env - Environment object (defaults to process.env)
 * @returns Configuration from environment or empty if not found
 *
 * @example
 * ```typescript
 * // Load from process.env
 * const { dialect, connection, found } = loadEnvConfig();
 * if (found) {
 *     console.log(`Detected ${dialect} configuration`);
 * }
 *
 * // Load from custom env object
 * const config = loadEnvConfig({
 *     DATABASE_URL: 'postgresql://localhost/mydb',
 * });
 * ```
 */
export declare function loadEnvConfig(env?: Record<string, string | undefined>): EnvConfigResult;
/**
 * Check if any database configuration exists in environment
 *
 * @param env - Environment object
 * @returns true if any database config vars are set
 */
export declare function hasEnvConfig(env?: Record<string, string | undefined>): boolean;
/**
 * Get description of which env vars are being used
 * Useful for logging and debugging
 */
export declare function describeEnvConfig(env?: Record<string, string | undefined>): string;
/**
 * Legacy AWS DSQL config format (pre-1.0)
 * This format is deprecated but still supported with warnings.
 *
 * @deprecated Use the new format with `dialect: 'dsql'` and `connection.aws`
 */
export interface LegacyAwsConfig {
	hostname: string;
	region: string;
	accessKeyId?: string;
	secretAccessKey?: string;
	port?: number;
	user?: string;
	ssl?: boolean;
	useDefaultCredentials?: boolean;
	tokenExpiresIn?: number;
}
/**
 * Legacy connection config format (pre-1.0)
 * These fields were on the root config object.
 *
 * @deprecated Use `connection` object instead
 */
export interface LegacyConnectionFields {
	host?: string;
	port?: number;
	database?: string;
	user?: string;
	password?: string;
	url?: string;
	ssl?: boolean | string;
	aws?: LegacyAwsConfig;
}
/**
 * Legacy RelqConfig format that had connection fields at root level
 */
export interface LegacyRelqConfig extends LegacyConnectionFields {
	schema?: string | {
		tables?: any;
		directory?: string;
	};
	migrations?: any;
	logging?: any;
	pool?: any;
	sync?: any;
	studio?: any;
	generate?: any;
	author?: string;
	extensions?: string[];
}
/**
 * Migrate legacy configuration to new format
 *
 * Handles:
 * 1. Root-level connection fields → connection object
 * 2. Legacy AWS DSQL format → new dialect + connection.aws format
 * 3. Missing dialect field → detect from config
 *
 * @param config - Configuration object (may be legacy or new format)
 * @returns Migrated configuration in new format
 *
 * @example
 * ```typescript
 * // Legacy format
 * const legacy = {
 *     host: 'localhost',
 *     port: 5432,
 *     database: 'mydb',
 * };
 *
 * // Migrated to new format
 * const migrated = migrateLegacyConfig(legacy);
 * // {
 * //     dialect: 'postgres',
 * //     connection: { host: 'localhost', port: 5432, database: 'mydb' }
 * // }
 * ```
 */
export declare function migrateLegacyConfig(config: unknown): RelqConfig;
/**
 * Validation result for config
 */
export interface ConfigValidationResult {
	valid: boolean;
	errors: string[];
	warnings: string[];
	migratedConfig?: RelqConfig;
}
/**
 * Validate and optionally migrate configuration
 *
 * @param config - Configuration to validate
 * @param migrate - Whether to apply migration (default: true)
 * @returns Validation result with errors and migrated config
 */
export declare function validateAndMigrateConfig(config: unknown, migrate?: boolean): ConfigValidationResult;
/**
 * Detect if config uses legacy format
 *
 * @param config - Configuration to check
 * @returns true if config uses deprecated format
 */
export declare function isLegacyConfig(config: unknown): boolean;
/**
 * Get migration instructions for a legacy config
 */
export declare function getMigrationInstructions(config: unknown): string;
declare enum TypeId {
	BOOL = 16,
	BYTEA = 17,
	CHAR = 18,
	INT8 = 20,
	INT2 = 21,
	INT4 = 23,
	REGPROC = 24,
	TEXT = 25,
	OID = 26,
	TID = 27,
	XID = 28,
	CID = 29,
	JSON = 114,
	XML = 142,
	PG_NODE_TREE = 194,
	SMGR = 210,
	PATH = 602,
	POLYGON = 604,
	CIDR = 650,
	FLOAT4 = 700,
	FLOAT8 = 701,
	ABSTIME = 702,
	RELTIME = 703,
	TINTERVAL = 704,
	CIRCLE = 718,
	MACADDR8 = 774,
	MONEY = 790,
	MACADDR = 829,
	INET = 869,
	ACLITEM = 1033,
	BPCHAR = 1042,
	VARCHAR = 1043,
	DATE = 1082,
	TIME = 1083,
	TIMESTAMP = 1114,
	TIMESTAMPTZ = 1184,
	INTERVAL = 1186,
	TIMETZ = 1266,
	BIT = 1560,
	VARBIT = 1562,
	NUMERIC = 1700,
	REFCURSOR = 1790,
	REGPROCEDURE = 2202,
	REGOPER = 2203,
	REGOPERATOR = 2204,
	REGCLASS = 2205,
	REGTYPE = 2206,
	UUID = 2950,
	TXID_SNAPSHOT = 2970,
	PG_LSN = 3220,
	PG_NDISTINCT = 3361,
	PG_DEPENDENCIES = 3402,
	TSVECTOR = 3614,
	TSQUERY = 3615,
	GTSVECTOR = 3642,
	REGCONFIG = 3734,
	REGDICTIONARY = 3769,
	JSONB = 3802,
	REGNAMESPACE = 4089,
	REGROLE = 4096
}
export type TypeFormat = "text" | "binary";
declare function setTypeParser(id: TypeId, parseFn: ((value: string) => any)): void;
declare function setTypeParser(id: TypeId, format: TypeFormat, parseFn: (value: string) => any): void;
declare const getTypeParser: (id: TypeId, format?: TypeFormat) => any;
export declare type MessageName = "parseComplete" | "bindComplete" | "closeComplete" | "noData" | "portalSuspended" | "replicationStart" | "emptyQuery" | "copyDone" | "copyData" | "rowDescription" | "parameterDescription" | "parameterStatus" | "backendKeyData" | "notification" | "readyForQuery" | "commandComplete" | "dataRow" | "copyInResponse" | "copyOutResponse" | "authenticationOk" | "authenticationMD5Password" | "authenticationCleartextPassword" | "authenticationSASL" | "authenticationSASLContinue" | "authenticationSASLFinal" | "error" | "notice";
export interface BackendMessage {
	name: MessageName;
	length: number;
}
export interface NoticeOrError {
	message: string | undefined;
	severity: string | undefined;
	code: string | undefined;
	detail: string | undefined;
	hint: string | undefined;
	position: string | undefined;
	internalPosition: string | undefined;
	internalQuery: string | undefined;
	where: string | undefined;
	schema: string | undefined;
	table: string | undefined;
	column: string | undefined;
	dataType: string | undefined;
	constraint: string | undefined;
	file: string | undefined;
	line: string | undefined;
	routine: string | undefined;
}
declare class NoticeMessage implements BackendMessage, NoticeOrError {
	readonly length: number;
	readonly message: string | undefined;
	constructor(length: number, message: string | undefined);
	readonly name = "notice";
	severity: string | undefined;
	code: string | undefined;
	detail: string | undefined;
	hint: string | undefined;
	position: string | undefined;
	internalPosition: string | undefined;
	internalQuery: string | undefined;
	where: string | undefined;
	schema: string | undefined;
	table: string | undefined;
	column: string | undefined;
	dataType: string | undefined;
	constraint: string | undefined;
	file: string | undefined;
	line: string | undefined;
	routine: string | undefined;
}
export type QueryConfigValues<T> = T extends Array<infer U> ? T : never;
export interface ClientConfig {
	user?: string | undefined;
	database?: string | undefined;
	password?: string | (() => string | Promise<string>) | undefined;
	port?: number | undefined;
	host?: string | undefined;
	connectionString?: string | undefined;
	keepAlive?: boolean | undefined;
	stream?: () => stream.Duplex | undefined;
	statement_timeout?: false | number | undefined;
	ssl?: boolean | ConnectionOptions | undefined;
	query_timeout?: number | undefined;
	lock_timeout?: number | undefined;
	keepAliveInitialDelayMillis?: number | undefined;
	idle_in_transaction_session_timeout?: number | undefined;
	application_name?: string | undefined;
	fallback_application_name?: string | undefined;
	connectionTimeoutMillis?: number | undefined;
	types?: CustomTypesConfig | undefined;
	options?: string | undefined;
	client_encoding?: string | undefined;
}
export type ConnectionConfig = ClientConfig;
interface PoolConfig$1 extends ClientConfig {
	// properties from module 'pg-pool'
	max?: number | undefined;
	min?: number | undefined;
	idleTimeoutMillis?: number | undefined | null;
	log?: ((...messages: any[]) => void) | undefined;
	Promise?: PromiseConstructorLike | undefined;
	allowExitOnIdle?: boolean | undefined;
	maxUses?: number | undefined;
	maxLifetimeSeconds?: number | undefined;
	Client?: (new () => ClientBase) | undefined;
}
export interface QueryConfig<I = any[]> {
	name?: string | undefined;
	text: string;
	values?: QueryConfigValues<I>;
	types?: CustomTypesConfig | undefined;
}
export interface CustomTypesConfig {
	getTypeParser: typeof getTypeParser;
}
export interface Submittable {
	submit: (connection: Connection) => void;
}
export interface QueryArrayConfig<I = any[]> extends QueryConfig<I> {
	rowMode: "array";
}
export interface FieldDef {
	name: string;
	tableID: number;
	columnID: number;
	dataTypeID: number;
	dataTypeSize: number;
	dataTypeModifier: number;
	format: string;
}
export interface QueryResultBase {
	command: string;
	rowCount: number | null;
	oid: number;
	fields: FieldDef[];
}
export interface QueryResultRow {
	[column: string]: any;
}
export interface QueryResult<R extends QueryResultRow = any> extends QueryResultBase {
	rows: R[];
}
export interface QueryArrayResult<R extends any[] = any[]> extends QueryResultBase {
	rows: R[];
}
export interface Notification {
	processId: number;
	channel: string;
	payload?: string | undefined;
}
export interface QueryParse {
	name: string;
	text: string;
	types: string[];
}
export type ValueMapper = (param: any, index: number) => any;
export interface BindConfig {
	portal?: string | undefined;
	statement?: string | undefined;
	binary?: string | undefined;
	values?: Array<Buffer | null | undefined | string> | undefined;
	valueMapper?: ValueMapper | undefined;
}
export interface ExecuteConfig {
	portal?: string | undefined;
	rows?: string | undefined;
}
export interface MessageConfig {
	type: string;
	name?: string | undefined;
}
declare function escapeIdentifier(str: string): string;
declare function escapeLiteral(str: string): string;
declare class Connection extends events.EventEmitter {
	readonly stream: stream.Duplex;
	constructor(config?: ConnectionConfig);
	bind(config: BindConfig | null, more: boolean): void;
	execute(config: ExecuteConfig | null, more: boolean): void;
	parse(query: QueryParse, more: boolean): void;
	query(text: string): void;
	describe(msg: MessageConfig, more: boolean): void;
	close(msg: MessageConfig, more: boolean): void;
	flush(): void;
	sync(): void;
	end(): void;
}
declare class ClientBase extends events.EventEmitter {
	constructor(config?: string | ClientConfig);
	connect(): Promise<void>;
	connect(callback: (err: Error) => void): void;
	query<T extends Submittable>(queryStream: T): T;
	// tslint:disable:no-unnecessary-generics
	query<R extends any[] = any[], I = any[]>(queryConfig: QueryArrayConfig<I>, values?: QueryConfigValues<I>): Promise<QueryArrayResult<R>>;
	query<R extends QueryResultRow = any, I = any>(queryConfig: QueryConfig<I>): Promise<QueryResult<R>>;
	query<R extends QueryResultRow = any, I = any[]>(queryTextOrConfig: string | QueryConfig<I>, values?: QueryConfigValues<I>): Promise<QueryResult<R>>;
	query<R extends any[] = any[], I = any[]>(queryConfig: QueryArrayConfig<I>, callback: (err: Error, result: QueryArrayResult<R>) => void): void;
	query<R extends QueryResultRow = any, I = any[]>(queryTextOrConfig: string | QueryConfig<I>, callback: (err: Error, result: QueryResult<R>) => void): void;
	query<R extends QueryResultRow = any, I = any[]>(queryText: string, values: QueryConfigValues<I>, callback: (err: Error, result: QueryResult<R>) => void): void;
	// tslint:enable:no-unnecessary-generics
	copyFrom(queryText: string): stream.Writable;
	copyTo(queryText: string): stream.Readable;
	pauseDrain(): void;
	resumeDrain(): void;
	escapeIdentifier: typeof escapeIdentifier;
	escapeLiteral: typeof escapeLiteral;
	setTypeParser: typeof setTypeParser;
	getTypeParser: typeof getTypeParser;
	on<E extends "drain" | "error" | "notice" | "notification" | "end">(event: E, listener: E extends "drain" | "end" ? () => void : E extends "error" ? (err: Error) => void : E extends "notice" ? (notice: NoticeMessage) => void : (message: Notification) => void): this;
}
type AwsRegion$1 = "us-east-1" | "us-east-2" | "us-west-1" | "us-west-2" | "eu-west-1" | "eu-west-2" | "eu-west-3" | "eu-central-1" | "eu-central-2" | "eu-north-1" | "eu-south-1" | "eu-south-2" | "ap-east-1" | "ap-south-1" | "ap-south-2" | "ap-northeast-1" | "ap-northeast-2" | "ap-northeast-3" | "ap-southeast-1" | "ap-southeast-2" | "ap-southeast-3" | "ap-southeast-4" | "me-south-1" | "me-central-1" | "af-south-1" | "il-central-1" | "sa-east-1" | "ca-central-1" | "ca-west-1" | "us-gov-east-1" | "us-gov-west-1" | (string & {});
/**
 * AWS DSQL (Aurora Serverless) configuration
 * When provided, Relq automatically handles IAM token generation and caching
 *
 * @example
 * ```typescript
 * const db = new Relq(schema, {
 *     database: 'postgres',
 *     aws: {
 *         hostname: 'abc123.dsql.us-east-1.on.aws',
 *         region: 'us-east-1', // Autocomplete supported!
 *         accessKeyId: 'AKIA...',
 *         secretAccessKey: '...'
 *     }
 * });
 * ```
 */
export interface AwsDbConfig {
	/**
	 * DSQL cluster hostname
	 * @example "7btnrhwkzis7lsxg24cqdyzsm4.dsql.us-east-1.on.aws"
	 */
	hostname: string;
	/**
	 * AWS region with autocomplete support
	 * @example "us-east-1"
	 */
	region: AwsRegion$1;
	/**
	 * AWS Access Key ID
	 * Required unless useDefaultCredentials is true
	 */
	accessKeyId?: string;
	/**
	 * AWS Secret Access Key
	 * Required unless useDefaultCredentials is true
	 */
	secretAccessKey?: string;
	/**
	 * Database port (inherited from root config if not specified)
	 * @default 5432
	 */
	port?: number;
	/**
	 * Database user (inherited from root config if not specified)
	 * @default 'admin'
	 */
	user?: string;
	/**
	 * Enable SSL/TLS for connection
	 * @default true (DSQL typically requires SSL)
	 */
	ssl?: boolean;
	/**
	 * Use AWS default credential provider chain
	 * (env vars, IAM role, ~/.aws/credentials)
	 * @default false
	 */
	useDefaultCredentials?: boolean;
	/**
	 * Token expiration time in seconds
	 * @default 604800 (7 days)
	 */
	tokenExpiresIn?: number;
}
/**
 * Check if config uses AWS DSQL
 */
export declare function isAwsDsqlConfig(config: RelqConnectionConfig): boolean;
/**
 * Build pool config from RelqConnectionConfig, handling AWS DSQL
 */
export declare function buildPoolConfig(connection: RelqConnectionConfig): Promise<PoolConfig$1>;
export interface RelqMigrationConfig {
	directory: string;
	tableName?: string;
	schemaName?: string;
	format?: "sequential" | "timestamp";
}
export interface RelqTypeGenConfig {
	output: string;
	includeEnums?: boolean;
	includeRelations?: boolean;
	namingConvention?: "camelCase" | "PascalCase" | "snake_case";
}
export interface RelqLoggingConfig {
	queries?: boolean;
	parameters?: boolean;
	timing?: boolean;
	errors?: boolean;
	level?: "debug" | "info" | "warn" | "error";
}
export interface RelqCacheConfig {
	enabled?: boolean;
	strategy?: "lru" | "ttl" | "size";
	maxSize?: number;
	ttl?: number;
	maxMemory?: number;
}
export interface RelqConnectionConfig extends Omit<PoolConfig$1, "ssl"> {
	url?: string;
	ssl?: boolean | "require" | "prefer" | "allow" | "disable" | PoolConfig$1["ssl"];
	/**
	 * AWS DSQL configuration
	 * When provided, enables first-class AWS Aurora DSQL support
	 * with automatic IAM token generation and caching
	 */
	aws?: AwsDbConfig;
}
export interface RelqGenerateConfig {
	outDir: string;
	introspect?: boolean;
	/**
	 * Convert snake_case column names to camelCase in generated schema.
	 * When true: `customColorsDark: text('custom_colors_dark')`
	 * When false: `custom_colors_dark: text()`
	 * @default true
	 */
	camelCase?: boolean;
	/**
	 * Include database functions in generated schema.
	 * @default false
	 */
	includeFunctions?: boolean;
	/**
	 * Include triggers in generated schema.
	 * @default false
	 */
	includeTriggers?: boolean;
	/**
	 * Render numeric/decimal types as string instead of number.
	 * When true: `amount: numeric()` has type `string`
	 * When false: `amount: numeric()` has type `number` (default)
	 *
	 * Use string for large decimal values that exceed JavaScript's number precision.
	 * @default false
	 */
	numericAsString?: boolean;
}
export interface RelqSafetyConfig {
	warnOnDataLoss?: boolean;
	confirmDestructive?: boolean;
	backupBeforeMigrate?: boolean;
}
/**
 * Studio theme options
 * - 'github-dark': Clean, professional dark theme (default)
 * - 'purple': Relq brand purple theme
 * - 'blue': Ocean blue theme
 * - 'green': Forest green theme
 * - 'orange': Sunset orange theme
 */
export type StudioTheme = "github-dark" | "purple" | "blue" | "green" | "orange";
/**
 * AI provider configuration
 */
export interface RelqAIConfig {
	/**
	 * AI provider to use
	 * @default 'gemini'
	 */
	provider?: "gemini" | "openai" | "anthropic";
	/**
	 * API key for the AI provider
	 * Can also be set via GEMINI_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY env vars
	 */
	apiKey?: string;
	/**
	 * Model to use for completions
	 * @default 'gemini-2.0-flash' for Gemini
	 */
	model?: string;
	/**
	 * Enable AI-powered SQL autocomplete in the editor
	 * @default true
	 */
	autocomplete?: boolean;
	/**
	 * Enable AI chat assistant
	 * @default true
	 */
	chat?: boolean;
}
/**
 * Relq Studio configuration
 */
export interface RelqStudioConfig {
	/**
	 * Studio color theme
	 * @default 'github-dark'
	 */
	theme?: StudioTheme;
	/**
	 * Port for the studio server
	 * @default 3000
	 */
	port?: number;
	/**
	 * Open browser automatically when starting studio
	 * @default true
	 */
	openBrowser?: boolean;
	/**
	 * AI assistant configuration
	 * Enables AI-powered SQL autocomplete and chat
	 */
	ai?: RelqAIConfig;
}
/**
 * Git-like sync behavior configuration
 */
export interface RelqSyncConfig {
	/**
	 * Path to snapshot file for offline diff
	 * @default '.relq/snapshot.json'
	 */
	snapshot?: string;
	/**
	 * Table patterns to ignore (glob-style)
	 * @example ['_temp_*', '_relq_*', 'pg_*']
	 */
	ignore?: string[];
	/**
	 * Backup directory for schema.ts before operations
	 * @default '.relq/backups'
	 */
	backupDir?: string;
	/**
	 * Auto-generate migration when diff found during sync
	 * @default true
	 */
	autoGenerate?: boolean;
	/**
	 * Auto-apply migrations (dangerous in production)
	 * @default false
	 */
	autoPush?: boolean;
	/**
	 * Only pull if no conflicts (like --ff-only)
	 * @default false
	 */
	fastForwardOnly?: boolean;
	/**
	 * Create backup of schema.ts before pull
	 * @default true
	 */
	createBackup?: boolean;
}
export interface RelqSchemaConfig<TTables extends Record<string, TableDefinition<Record<string, ColumnConfig>>> = Record<string, TableDefinition<Record<string, ColumnConfig>>>> {
	tables?: TTables;
	directory?: string;
	defaultSchema?: string;
}
interface RelqConfig$1<TTables extends Record<string, TableDefinition<Record<string, ColumnConfig>>> = Record<string, TableDefinition<Record<string, ColumnConfig>>>> {
	/**
	 * Database dialect to use
	 * Auto-detected from connection URL if not specified
	 *
	 * @remarks
	 * Supported dialects:
	 * - PostgreSQL family: 'postgres', 'cockroachdb', 'nile', 'dsql'
	 * - MySQL family: 'mysql', 'mariadb', 'planetscale'
	 * - SQLite family: 'sqlite', 'turso'
	 * - Xata: 'xata'
	 *
	 * @default 'postgres' (or auto-detected from connection)
	 */
	dialect?: DialectName;
	connection?: RelqConnectionConfig;
	schema?: string | RelqSchemaConfig<TTables>;
	migrations?: RelqMigrationConfig;
	typeGeneration?: RelqTypeGenConfig;
	generate?: RelqGenerateConfig;
	safety?: RelqSafetyConfig;
	logging?: RelqLoggingConfig;
	cache?: RelqCacheConfig;
	pool?: {
		min?: number;
		max?: number;
		idleTimeoutMs?: number;
		connectionTimeoutMs?: number;
		acquireTimeoutMs?: number;
	};
	conventions?: {
		timestamps?: {
			createdAt?: string | false;
			updatedAt?: string | false;
			deletedAt?: string | false;
		};
		softDelete?: boolean;
		primaryKey?: string;
	};
	plugins?: RelqPlugin[];
	/**
	 * Git-like sync behavior configuration
	 */
	sync?: RelqSyncConfig;
	/**
	 * Relq Studio configuration
	 * Configure the visual database IDE
	 */
	studio?: RelqStudioConfig;
	extensions?: string[];
	/**
	 * Author name for schema commits
	 * Used when creating commits in _relq_commits table and .relq folder
	 * @example 'John Mathew'
	 */
	author?: string;
	/**
	 * Maximum number of commits to keep in history
	 * Old commits beyond this limit are automatically pruned
	 * @default 1000
	 */
	commitLimit?: number;
	/**
	 * Render numeric/decimal types as string instead of number.
	 * When true: `amount: numeric()` has type `string`
	 * When false: `amount: numeric()` has type `number` (default)
	 *
	 * Use string for large decimal values that exceed JavaScript's number precision.
	 * @default false
	 */
	numericAsString?: boolean;
	/**
	 * Include VIEWs and MATERIALIZED VIEWs in schema generation.
	 * @default false
	 */
	includeViews?: boolean;
	/**
	 * Include FOREIGN TABLEs (Foreign Data Wrapper) in schema generation.
	 * @default false
	 */
	includeFDW?: boolean;
	/**
	 * Include TRIGGERs in schema generation.
	 * @default false
	 */
	includeTriggers?: boolean;
	/**
	 * Include FUNCTIONs and PROCEDUREs in schema generation.
	 * @default false
	 */
	includeFunctions?: boolean;
}
export interface RelqPlugin {
	name: string;
	version?: string;
	hooks?: {
		beforeQuery?: (query: string, params: unknown[]) => {
			query: string;
			params: unknown[];
		} | void;
		afterQuery?: (result: unknown, query: string, params: unknown[]) => unknown | void;
		onError?: (error: Error, query: string, params: unknown[]) => void;
		onConnect?: () => void | Promise<void>;
		onDisconnect?: () => void | Promise<void>;
	};
}
export declare function loadConfig(startPath?: string): Promise<RelqConfig$1>;
export interface ConfigSearchResult {
	configPath: string;
	projectRoot: string;
}
export declare function mergeConfigs(...configs: Partial<RelqConfig$1>[]): RelqConfig$1;
export declare function validateConfig(config: RelqConfig$1): {
	valid: boolean;
	errors: string[];
};
interface Blob$1 extends BunConsumerConvenienceMethods {
	// We have to specify bytes again even though it comes from
	// BunConsumerConvenienceMethods, because inheritance in TypeScript is
	// slightly different from just "copying in the methods" (the difference is
	// related to how type parameters are resolved)
	bytes(): Promise<Uint8Array<ArrayBuffer>>;
	/**
	 * Consume the blob as a FormData instance
	 */
	formData(): Promise<FormData>;
	/**
	 * Consume the blob as an ArrayBuffer
	 */
	arrayBuffer(): Promise<ArrayBuffer>;
	/**
	 * Returns a readable stream of the blob's contents
	 */
	stream(): ReadableStream<Uint8Array<ArrayBuffer>>;
}

export {};
