import events = require('events');
import stream = require('stream');
import { ConnectionOptions } from 'tls';

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
export interface PoolConfig extends ClientConfig {
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
/**
 * Type-safe PostgreSQL DEFAULT value helpers
 * Covers all PostgreSQL default value types with 100% typed output
 */
export interface DefaultValue {
	readonly $sql: string;
	readonly $isDefault: true;
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
declare const EMPTY_OBJECT: unique symbol;
declare const EMPTY_ARRAY: unique symbol;
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
	$array?: boolean;
	$dimensions?: number;
	$length?: number;
	$precision?: number;
	$scale?: number;
	$withTimezone?: boolean;
	$columnName?: string;
	$trackingId?: string;
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
 * - $nullable: false → explicitly NOT NULL (via .notNull())
 * - $nullable: true → explicitly nullable (via .nullable())
 * - $nullable: undefined → implicitly nullable (PostgreSQL default)
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
 * Clean a column type by removing DefaultValue union members and symbols
 * (symbols like EMPTY_OBJECT/EMPTY_ARRAY can leak into type inference from $default)
 */
export type CleanType<T> = Exclude<T, DefaultValue | (object & DefaultValue) | symbol>;
/**
 * Build SELECT type with smart required/optional:
 * - Required: NOT NULL, PRIMARY KEY, has DEFAULT/GENERATED columns
 * - Optional: Nullable columns without constraints
 */
export type BuildSelectType<T extends Record<string, ColumnConfig>> = Simplify<{
	[K in keyof T as IsRequiredForSelect<T[K]> extends true ? K : never]: T[K] extends ColumnConfig<infer U> ? T[K] extends {
		$nullable: true;
	} ? CleanType<U> | null : CleanType<U> : unknown;
} & {
	[K in keyof T as IsRequiredForSelect<T[K]> extends true ? never : K]?: T[K] extends ColumnConfig<infer U> ? CleanType<U> | null : unknown;
}>;
export type RequiredInsertKeys<T extends Record<string, ColumnConfig>> = {
	[K in keyof T]: IsRequiredForInsert<T[K]> extends true ? K : never;
}[keyof T];
export type OptionalInsertKeys<T extends Record<string, ColumnConfig>> = {
	[K in keyof T]: IsRequiredForInsert<T[K]> extends true ? never : K;
}[keyof T];
export type InferInsertValue<C extends ColumnConfig> = C extends ColumnConfig<infer U> ? C extends {
	$nullable: true;
} ? U | null : U : unknown;
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
	$inferSelect: BuildSelectType<T>;
	$inferInsert: BuildInsertType<T>;
	toSQL(): string;
	toCreateIndexSQL(): string[];
	/** Returns AST for schema diffing and migration generation */
	toAST(): ParsedTable;
}
/**
 * AWS regions with autocomplete support
 * Includes all standard AWS regions that may support DSQL
 */
export type AwsRegion = "us-east-1" | "us-east-2" | "us-west-1" | "us-west-2" | "eu-west-1" | "eu-west-2" | "eu-west-3" | "eu-central-1" | "eu-central-2" | "eu-north-1" | "eu-south-1" | "eu-south-2" | "ap-east-1" | "ap-south-1" | "ap-south-2" | "ap-northeast-1" | "ap-northeast-2" | "ap-northeast-3" | "ap-southeast-1" | "ap-southeast-2" | "ap-southeast-3" | "ap-southeast-4" | "me-south-1" | "me-central-1" | "af-south-1" | "il-central-1" | "sa-east-1" | "ca-central-1" | "ca-west-1" | "us-gov-east-1" | "us-gov-west-1" | (string & {});
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
	region: AwsRegion;
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
export declare function buildPoolConfig(connection: RelqConnectionConfig): Promise<PoolConfig>;
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
export interface RelqConnectionConfig extends Omit<PoolConfig, "ssl"> {
	url?: string;
	ssl?: boolean | "require" | "prefer" | "allow" | "disable" | PoolConfig["ssl"];
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
export interface RelqConfig<TTables extends Record<string, TableDefinition<Record<string, ColumnConfig>>> = Record<string, TableDefinition<Record<string, ColumnConfig>>>> {
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
export declare function defineConfig<TTables extends Record<string, TableDefinition<Record<string, ColumnConfig>>> = Record<string, TableDefinition<Record<string, ColumnConfig>>>>(config: RelqConfig<TTables>): RelqConfig<TTables>;
export declare function loadConfig(startPath?: string): Promise<RelqConfig>;
export declare function parseConnectionUrl(url: string): RelqConnectionConfig;
export declare function mergeConfigs(...configs: Partial<RelqConfig>[]): RelqConfig;
export declare function validateConfig(config: RelqConfig): {
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
