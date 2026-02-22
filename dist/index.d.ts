import events = require('events');
import { EventEmitter } from 'node:events';
import stream = require('stream');
import { ConnectionOptions } from 'tls';

/**
 * Represents a single database value that can be used in queries.
 * Supports all PostgreSQL-compatible data types including primitives,
 * dates, buffers, objects, and arrays.
 */
export type QueryValue = string | number | boolean | null | undefined | Date | Buffer | object | any[] | Record<string, any>;
/**
 * Array of QueryValue items for use in bulk operations like IN clauses
 */
export type QueryValueList = QueryValue[];
/**
 * Union type representing either a single value or array of values
 */
export type QueryValues = QueryValue | QueryValueList;
/**
 * Internal query condition interface representing a single WHERE/HAVING condition.
 * Used internally to build the final SQL condition string.
 * @internal
 */
export interface QueryCondition {
	/** The condition method type (e.g., 'equal', 'lessThan', 'in') */
	method: string;
	/** The database column name for the condition */
	column?: string;
	/** The values or nested conditions for this condition */
	values?: QueryValues | QueryCondition[];
}
/**
 * Case conversion types for column name transformations
 */
export type ConversionType = "snake2camel" | "snake2pascal" | "camel2snake" | "camel2pascal" | "pascal2snake" | "pascal2camel" | "2camel" | "2pascal" | "2snake";
/**
 * Index column definition with optional ordering and collation
 */
export type IndexColumn = string | {
	column: string;
	order?: "ASC" | "DESC";
	nulls?: "FIRST" | "LAST";
	collation?: string;
	opclass?: string;
};
/**
 * GIN operator class types for different data types
 */
export type GinOpClass = "jsonb_ops" | "jsonb_path_ops" | "array_ops" | "tsvector_ops";
/**
 * GiST operator class types
 */
export type GistOpClass = "inet_ops" | "circle_ops" | "point_ops" | "box_ops" | "polygon_ops" | "tsvector_ops" | "tsquery_ops";
/**
 * BLOOM index options (PostgreSQL extension)
 */
export interface BloomOptions {
	length?: number;
	col1?: number;
	col2?: number;
	col3?: number;
	col4?: number;
	col5?: number;
}
/**
 * Column definition for CREATE TABLE
 */
export interface ColumnDefinition {
	type: string;
	nullable?: boolean;
	default?: any;
	unique?: boolean;
	primaryKey?: boolean;
	check?: string;
	references?: {
		table: string;
		column: string;
		onDelete?: "CASCADE" | "SET NULL" | "SET DEFAULT" | "RESTRICT" | "NO ACTION";
		onUpdate?: "CASCADE" | "SET NULL" | "SET DEFAULT" | "RESTRICT" | "NO ACTION";
	};
	generated?: {
		always?: boolean;
		expression: string;
	};
	identity?: {
		always?: boolean;
		start?: number;
		increment?: number;
		minValue?: number;
		maxValue?: number;
		cycle?: boolean;
	};
	collation?: string;
	compression?: string;
	storage?: "PLAIN" | "EXTERNAL" | "EXTENDED" | "MAIN";
}
/**
 * Foreign key constraint configuration
 */
export interface ForeignKeyConfig {
	columns: string[];
	references: {
		table: string;
		columns: string[];
	};
	onDelete?: "CASCADE" | "SET NULL" | "SET DEFAULT" | "RESTRICT" | "NO ACTION";
	onUpdate?: "CASCADE" | "SET NULL" | "SET DEFAULT" | "RESTRICT" | "NO ACTION";
	deferrable?: boolean;
	initially?: "IMMEDIATE" | "DEFERRED";
	name?: string;
}
/**
 * Table storage and behavior options
 */
export interface TableOptions {
	fillfactor?: number;
	parallel_workers?: number;
	autovacuum_enabled?: boolean;
	autovacuum_vacuum_threshold?: number;
	autovacuum_analyze_threshold?: number;
	autovacuum_vacuum_scale_factor?: number;
	autovacuum_analyze_scale_factor?: number;
	toast_tuple_target?: number;
	autovacuum_vacuum_cost_delay?: number;
	autovacuum_vacuum_cost_limit?: number;
}
/**
 * Autovacuum configuration options
 */
export interface AutovacuumOptions {
	vacuumThreshold?: number;
	analyzeThreshold?: number;
	vacuumScaleFactor?: number;
	analyzeScaleFactor?: number;
	vacuumCostDelay?: number;
	vacuumCostLimit?: number;
}
/**
 * Trigger timing options
 */
export type TriggerTiming = "BEFORE" | "AFTER" | "INSTEAD OF";
/**
 * Trigger events
 */
export type TriggerEvent = "INSERT" | "UPDATE" | "DELETE" | "TRUNCATE";
/**
 * Trigger level (row or statement)
 */
export type TriggerLevel = "ROW" | "STATEMENT";
/**
 * Function parameter definition
 */
export interface FunctionParameter {
	name: string;
	type: string;
	default?: any;
	mode?: "IN" | "OUT" | "INOUT" | "VARIADIC";
}
/**
 * Function volatility categories
 */
export type FunctionVolatility = "IMMUTABLE" | "STABLE" | "VOLATILE";
/**
 * Function security levels
 */
export type FunctionSecurity = "DEFINER" | "INVOKER";
/**
 * Function parallel safety
 */
export type FunctionParallel = "SAFE" | "UNSAFE" | "RESTRICTED";
/**
 * Supported procedural languages
 */
export type FunctionLanguage = "plpgsql" | "sql" | "plpython3u" | "plperl" | "c";
/**
 * Partition strategy types
 */
export type PartitionStrategy = "RANGE" | "LIST" | "HASH";
/**
 * Partition boundary specification
 */
export interface PartitionBoundSpec {
	strategy: PartitionStrategy;
	specification: string;
}
/**
 * View check option levels
 */
export type ViewCheckOption = "LOCAL" | "CASCADED";
/**
 * Transaction isolation levels
 */
export type IsolationLevel = "READ UNCOMMITTED" | "READ COMMITTED" | "REPEATABLE READ" | "SERIALIZABLE";
/**
 * Transaction access modes
 */
export type TransactionMode = "READ WRITE" | "READ ONLY";
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
 * Exclude undefined from a type, only allowing null for nullable values.
 * Used in TypedConditionBuilder to prevent accidental undefined passing.
 *
 * - `string` → `string`
 * - `string | null` → `string | null`
 * - `string | undefined` → `string` (undefined excluded)
 * - `string | null | undefined` → `string | null`
 */
export type NonUndefined<T> = T extends undefined ? never : T;
/**
 * Condition-safe column value type.
 * Excludes undefined - use null for nullable values in SQL.
 */
export type ConditionValue<TTable, K extends ColumnName<TTable>> = NonUndefined<ColumnValue<TTable, K>>;
/**
 * Extract the element type from an array column.
 * - `string[]` → `string`
 * - `number[]` → `number`
 * - `T[]` → `T`
 * - Non-array → `never`
 */
export type ArrayElementType<TTable, K extends ColumnName<TTable>> = NonUndefined<ColumnValue<TTable, K>> extends (infer E)[] ? NonUndefined<E> : never;
/**
 * Extract JSONB/JSON column type for type-safe operations.
 * If schema defines typed JSON structure, operations will be type-safe.
 */
export type JsonColumnType<TTable, K extends ColumnName<TTable>> = NonUndefined<ColumnValue<TTable, K>> extends object ? NonUndefined<ColumnValue<TTable, K>> : Record<string, unknown>;
/**
 * Extract keys from a JSONB column type.
 * Returns string if type is unknown/any.
 */
export type JsonColumnKeys<TTable, K extends ColumnName<TTable>> = JsonColumnType<TTable, K> extends Record<string, unknown> ? string extends keyof JsonColumnType<TTable, K> ? string : keyof JsonColumnType<TTable, K> & string : string;
/** 2D Point as [x, y] tuple */
export type Point2D = readonly [
	number,
	number
];
/** 3D Point as [x, y, z] tuple */
export type Point3D = readonly [
	number,
	number,
	number
];
/** Line segment as two points */
export type LineSegment = readonly [
	Point2D,
	Point2D
];
/** Box as two corner points [lower-left, upper-right] */
export type Box = readonly [
	Point2D,
	Point2D
];
/** Path/Polygon as array of points */
export type Path = readonly Point2D[];
/** Circle as [center, radius] */
export type Circle = readonly [
	Point2D,
	number
];
/** Range bound type */
export type RangeBound = "inclusive" | "exclusive";
/** Range value with bounds specification */
export interface RangeValue<T> {
	start: T;
	end: T;
	/** Start bound - default 'inclusive' */
	startBound?: RangeBound;
	/** End bound - default 'exclusive' */
	endBound?: RangeBound;
}
/** Simple range as tuple [start, end] - assumes [inclusive, exclusive) */
export type RangeTuple<T> = readonly [
	T,
	T
];
/** Range input - either tuple or full specification */
export type RangeInput<T> = RangeTuple<T> | RangeValue<T>;
/** IPv4 address components */
export interface IPv4Address {
	octets: readonly [
		number,
		number,
		number,
		number
	];
	mask?: number;
}
/** Network address as string (CIDR notation) or structured */
export type NetworkAddress = string | IPv4Address;
/** GeoJSON Point */
export interface GeoPoint {
	type: "Point";
	coordinates: Point2D | Point3D;
}
/** GeoJSON LineString */
export interface GeoLineString {
	type: "LineString";
	coordinates: readonly Point2D[];
}
/** GeoJSON Polygon */
export interface GeoPolygon {
	type: "Polygon";
	coordinates: readonly (readonly Point2D[])[];
}
/** GeoJSON MultiPoint */
export interface GeoMultiPoint {
	type: "MultiPoint";
	coordinates: readonly Point2D[];
}
/** GeoJSON MultiLineString */
export interface GeoMultiLineString {
	type: "MultiLineString";
	coordinates: readonly (readonly Point2D[])[];
}
/** GeoJSON MultiPolygon */
export interface GeoMultiPolygon {
	type: "MultiPolygon";
	coordinates: readonly (readonly (readonly Point2D[])[])[];
}
/** Any GeoJSON geometry */
export type GeoJsonGeometry = GeoPoint | GeoLineString | GeoPolygon | GeoMultiPoint | GeoMultiLineString | GeoMultiPolygon;
/** PostGIS geometry input - GeoJSON or WKT string */
export type GeometryInput = GeoJsonGeometry | string;
/**
 * Type-safe condition builder that validates column names and value types
 * against the table schema.
 *
 * **Note:** `undefined` is not allowed as a value. Use `null` for nullable columns.
 * This prevents bugs where unset variables are accidentally passed to conditions.
 *
 * @template TTable - The table definition type for type checking
 *
 * @example
 * ```typescript
 * // Column names autocomplete and are validated
 * .where(q => q.equal('verified', true))     // ✅ Valid
 * .where(q => q.equal('invalid', true))      // ❌ Error: 'invalid' not a column
 * .where(q => q.equal('verified', 'text'))   // ❌ Error: should be boolean
 * .where(q => q.equal('name', undefined))    // ❌ Error: undefined not allowed
 * .where(q => q.equal('name', null))         // ✅ Valid for nullable columns
 * ```
 */
export interface TypedConditionBuilder<TTable = any> {
	/** Creates an equality condition with type-safe column and value */
	equal<K extends ColumnName<TTable>>(column: K, value: ConditionValue<TTable, K>): TypedConditionBuilder<TTable>;
	/** Creates a not-equal condition with type-safe column and value */
	notEqual<K extends ColumnName<TTable>>(column: K, value: ConditionValue<TTable, K>): TypedConditionBuilder<TTable>;
	/** Creates a less-than condition */
	lessThan<K extends ColumnName<TTable>>(column: K, value: ConditionValue<TTable, K>): TypedConditionBuilder<TTable>;
	/** Creates a less-than-or-equal condition */
	lessThanEqual<K extends ColumnName<TTable>>(column: K, value: ConditionValue<TTable, K>): TypedConditionBuilder<TTable>;
	/** Creates a greater-than condition */
	greaterThan<K extends ColumnName<TTable>>(column: K, value: ConditionValue<TTable, K>): TypedConditionBuilder<TTable>;
	/** Creates a greater-than-or-equal condition */
	greaterThanEqual<K extends ColumnName<TTable>>(column: K, value: ConditionValue<TTable, K>): TypedConditionBuilder<TTable>;
	/** Creates an IS NULL condition */
	isNull<K extends ColumnName<TTable>>(column: K): TypedConditionBuilder<TTable>;
	/** Creates an IS NOT NULL condition */
	isNotNull<K extends ColumnName<TTable>>(column: K): TypedConditionBuilder<TTable>;
	/** Creates a BETWEEN condition for range queries */
	between<K extends ColumnName<TTable>>(column: K, start: ConditionValue<TTable, K>, end: ConditionValue<TTable, K>): TypedConditionBuilder<TTable>;
	/** Creates a NOT BETWEEN condition */
	notBetween<K extends ColumnName<TTable>>(column: K, start: ConditionValue<TTable, K>, end: ConditionValue<TTable, K>): TypedConditionBuilder<TTable>;
	/**
	 * Creates a LIKE/ILIKE condition for prefix matching (value%).
	 * @param column - The column to check
	 * @param value - The prefix to match
	 * @param caseInsensitive - If true, uses ILIKE for case-insensitive matching (default: false)
	 */
	startsWith<K extends ColumnName<TTable>>(column: K, value: string, caseInsensitive?: boolean): TypedConditionBuilder<TTable>;
	/**
	 * Creates a NOT LIKE/ILIKE condition for prefix exclusion.
	 * @param column - The column to check
	 * @param value - The prefix to exclude
	 * @param caseInsensitive - If true, uses NOT ILIKE for case-insensitive matching (default: false)
	 */
	notStartsWith<K extends ColumnName<TTable>>(column: K, value: string, caseInsensitive?: boolean): TypedConditionBuilder<TTable>;
	/**
	 * Creates a LIKE/ILIKE condition for suffix matching (%value).
	 * @param column - The column to check
	 * @param value - The suffix to match
	 * @param caseInsensitive - If true, uses ILIKE for case-insensitive matching (default: false)
	 */
	endsWith<K extends ColumnName<TTable>>(column: K, value: string, caseInsensitive?: boolean): TypedConditionBuilder<TTable>;
	/**
	 * Creates a NOT LIKE/ILIKE condition for suffix exclusion.
	 * @param column - The column to check
	 * @param value - The suffix to exclude
	 * @param caseInsensitive - If true, uses NOT ILIKE for case-insensitive matching (default: false)
	 */
	notEndsWith<K extends ColumnName<TTable>>(column: K, value: string, caseInsensitive?: boolean): TypedConditionBuilder<TTable>;
	/**
	 * Creates a LIKE/ILIKE condition for substring matching (%value%).
	 * @param column - The column to check
	 * @param value - The substring to match
	 * @param caseInsensitive - If true, uses ILIKE for case-insensitive matching (default: false)
	 */
	contains<K extends ColumnName<TTable>>(column: K, value: string, caseInsensitive?: boolean): TypedConditionBuilder<TTable>;
	/**
	 * Creates a NOT LIKE/ILIKE condition for substring exclusion.
	 * @param column - The column to check
	 * @param value - The substring to exclude
	 * @param caseInsensitive - If true, uses NOT ILIKE for case-insensitive matching (default: false)
	 */
	notContains<K extends ColumnName<TTable>>(column: K, value: string, caseInsensitive?: boolean): TypedConditionBuilder<TTable>;
	/** Creates a LIKE condition with custom pattern */
	like<K extends ColumnName<TTable>>(column: K, pattern: string): TypedConditionBuilder<TTable>;
	/** Creates a NOT LIKE condition with custom pattern */
	notLike<K extends ColumnName<TTable>>(column: K, pattern: string): TypedConditionBuilder<TTable>;
	/** Creates a case-insensitive ILIKE condition (PostgreSQL) */
	ilike<K extends ColumnName<TTable>>(column: K, pattern: string): TypedConditionBuilder<TTable>;
	/** Creates a case-insensitive NOT ILIKE condition (PostgreSQL) */
	notIlike<K extends ColumnName<TTable>>(column: K, pattern: string): TypedConditionBuilder<TTable>;
	/** Creates a regex match condition using ~ operator (case-sensitive) */
	regex<K extends ColumnName<TTable>>(column: K, pattern: string): TypedConditionBuilder<TTable>;
	/** Creates a regex match condition using ~* operator (case-insensitive) */
	iregex<K extends ColumnName<TTable>>(column: K, pattern: string): TypedConditionBuilder<TTable>;
	/** Creates a negated regex condition using !~ operator (case-sensitive) */
	notRegex<K extends ColumnName<TTable>>(column: K, pattern: string): TypedConditionBuilder<TTable>;
	/** Creates a negated regex condition using !~* operator (case-insensitive) */
	notIregex<K extends ColumnName<TTable>>(column: K, pattern: string): TypedConditionBuilder<TTable>;
	/** Creates a SIMILAR TO condition (SQL standard regex) */
	similarTo<K extends ColumnName<TTable>>(column: K, pattern: string): TypedConditionBuilder<TTable>;
	/** Creates a NOT SIMILAR TO condition */
	notSimilarTo<K extends ColumnName<TTable>>(column: K, pattern: string): TypedConditionBuilder<TTable>;
	/** Creates an IS TRUE condition for boolean columns */
	isTrue<K extends ColumnName<TTable>>(column: K): TypedConditionBuilder<TTable>;
	/** Creates an IS FALSE condition for boolean columns */
	isFalse<K extends ColumnName<TTable>>(column: K): TypedConditionBuilder<TTable>;
	/** Creates an IS DISTINCT FROM condition (NULL-safe not-equal) */
	distinctFrom<K extends ColumnName<TTable>>(column: K, value: ConditionValue<TTable, K> | null): TypedConditionBuilder<TTable>;
	/** Creates an IS NOT DISTINCT FROM condition (NULL-safe equal) */
	notDistinctFrom<K extends ColumnName<TTable>>(column: K, value: ConditionValue<TTable, K> | null): TypedConditionBuilder<TTable>;
	/**
	 * Creates a temporal OVERLAPS condition for date/time ranges
	 * @example .overlaps(['start_date', '2024-01-01'], ['end_date', '2024-12-31'])
	 */
	overlaps<K extends ColumnName<TTable>>(start: [
		K,
		ConditionValue<TTable, K> | Date | string
	], end: [
		K,
		ConditionValue<TTable, K> | Date | string
	]): TypedConditionBuilder<TTable>;
	/** Alias for greaterThanEqual - creates a greater-than-or-equal condition */
	greaterThanOrEqual<K extends ColumnName<TTable>>(column: K, value: ConditionValue<TTable, K>): TypedConditionBuilder<TTable>;
	/** Alias for lessThanEqual - creates a less-than-or-equal condition */
	lessThanOrEqual<K extends ColumnName<TTable>>(column: K, value: ConditionValue<TTable, K>): TypedConditionBuilder<TTable>;
	/** Alias for isNotNull - creates an IS NOT NULL condition */
	notNull<K extends ColumnName<TTable>>(column: K): TypedConditionBuilder<TTable>;
	/** Creates an IN condition for array matching */
	in<K extends ColumnName<TTable>>(column: K, values: ConditionValue<TTable, K>[]): TypedConditionBuilder<TTable>;
	/** Creates a NOT IN condition for array exclusion */
	notIn<K extends ColumnName<TTable>>(column: K, values: ConditionValue<TTable, K>[]): TypedConditionBuilder<TTable>;
	/** Creates an EXISTS condition with subquery */
	exists(subquery: string): TypedConditionBuilder<TTable>;
	/** Creates a NOT EXISTS condition with subquery */
	notExists(subquery: string): TypedConditionBuilder<TTable>;
	/** Creates a full-text search condition */
	search<K extends ColumnName<TTable>>(column: K, value: string): TypedConditionBuilder<TTable>;
	/** Creates a negated full-text search condition */
	notSearch<K extends ColumnName<TTable>>(column: K, value: string): TypedConditionBuilder<TTable>;
	/** Groups conditions with OR logic */
	or(callback: (builder: TypedConditionBuilder<TTable>) => TypedConditionBuilder<TTable>): TypedConditionBuilder<TTable>;
	/** Groups conditions with AND logic */
	and(callback: (builder: TypedConditionBuilder<TTable>) => TypedConditionBuilder<TTable>): TypedConditionBuilder<TTable>;
	/** Negates a group of conditions with NOT logic */
	not(callback: (builder: TypedConditionBuilder<TTable>) => TypedConditionBuilder<TTable>): TypedConditionBuilder<TTable>;
	/** JSONB-specific operations with typed column names */
	readonly jsonb: TypedJsonbConditionBuilder<TTable>;
	/** JSON alias for jsonb - PostgreSQL json type uses same operations */
	readonly json: TypedJsonbConditionBuilder<TTable>;
	/** Array-specific operations with typed column names */
	readonly array: TypedArrayConditionBuilder<TTable>;
	/** Full-text search operations with typed column names */
	readonly fulltext: TypedFulltextConditionBuilder<TTable>;
	/** Range type operations with typed column names */
	readonly range: TypedRangeConditionBuilder<TTable>;
	/** Geometric type operations with typed column names */
	readonly geometric: TypedGeometricConditionBuilder<TTable>;
	/** Network type operations with typed column names */
	readonly network: TypedNetworkConditionBuilder<TTable>;
	/** PostGIS geographic/geometry operations with typed column names */
	readonly postgis: TypedPostgisConditionBuilder<TTable>;
}
/**
 * Typed JSONB condition builder with schema-inferred types
 * If schema defines typed JSON structure, keys are autocompleted and validated.
 */
export interface TypedJsonbConditionBuilder<TTable = any> {
	/** Check if JSONB contains value - infers type from column if typed */
	contains<K extends ColumnName<TTable>>(column: K, value: Partial<JsonColumnType<TTable, K>> | JsonColumnType<TTable, K>[]): TypedConditionBuilder<TTable>;
	/** Check if JSONB is contained by value */
	containedBy<K extends ColumnName<TTable>>(column: K, value: Partial<JsonColumnType<TTable, K>> | JsonColumnType<TTable, K>[]): TypedConditionBuilder<TTable>;
	/** Check if JSONB has key - infers valid keys from column type */
	hasKey<K extends ColumnName<TTable>>(column: K, key: JsonColumnKeys<TTable, K>): TypedConditionBuilder<TTable>;
	/** Check if JSONB has any of the keys */
	hasAnyKeys<K extends ColumnName<TTable>>(column: K, keys: JsonColumnKeys<TTable, K>[]): TypedConditionBuilder<TTable>;
	/** Check if JSONB has all keys */
	hasAllKeys<K extends ColumnName<TTable>>(column: K, keys: JsonColumnKeys<TTable, K>[]): TypedConditionBuilder<TTable>;
	/** Extract value at path */
	extract<K extends ColumnName<TTable>>(column: K, path: string[]): TypedConditionBuilder<TTable>;
	/** Extract text at path */
	extractText<K extends ColumnName<TTable>>(column: K, path: string[]): TypedConditionBuilder<TTable>;
	/** Get value at key - infers valid keys from column type */
	get<K extends ColumnName<TTable>>(column: K, key: JsonColumnKeys<TTable, K>): TypedConditionBuilder<TTable>;
	/** Get text at key - infers valid keys from column type */
	getText<K extends ColumnName<TTable>>(column: K, key: JsonColumnKeys<TTable, K>): TypedConditionBuilder<TTable>;
	/** Extract at path and compare equal */
	extractEqual<K extends ColumnName<TTable>>(column: K, path: string[], value: QueryValue): TypedConditionBuilder<TTable>;
	/** Extract at path and compare greater than */
	extractGreaterThan<K extends ColumnName<TTable>>(column: K, path: string[], value: QueryValue): TypedConditionBuilder<TTable>;
	/** Extract at path and compare less than */
	extractLessThan<K extends ColumnName<TTable>>(column: K, path: string[], value: QueryValue): TypedConditionBuilder<TTable>;
	/** Extract at path and check if in values */
	extractIn<K extends ColumnName<TTable>>(column: K, path: string[], values: QueryValueList): TypedConditionBuilder<TTable>;
}
/**
 * Typed Array condition builder with element type inference
 */
export interface TypedArrayConditionBuilder<TTable = any> {
	/** Array contains all values - infers element type from column */
	contains<K extends ColumnName<TTable>>(column: K, values: ArrayElementType<TTable, K>[]): TypedConditionBuilder<TTable>;
	/** Array is contained by values - infers element type from column */
	containedBy<K extends ColumnName<TTable>>(column: K, values: ArrayElementType<TTable, K>[]): TypedConditionBuilder<TTable>;
	/** Arrays have common elements - infers element type from column */
	overlaps<K extends ColumnName<TTable>>(column: K, values: ArrayElementType<TTable, K>[]): TypedConditionBuilder<TTable>;
	/** Arrays are identical - infers element type from column */
	equal<K extends ColumnName<TTable>>(column: K, values: ArrayElementType<TTable, K>[]): TypedConditionBuilder<TTable>;
	/** Arrays differ - infers element type from column */
	notEqual<K extends ColumnName<TTable>>(column: K, values: ArrayElementType<TTable, K>[]): TypedConditionBuilder<TTable>;
	/** Value matches any element - infers element type from column */
	any<K extends ColumnName<TTable>>(column: K, operator: string, value: ArrayElementType<TTable, K>): TypedConditionBuilder<TTable>;
	/** Value matches all elements - infers element type from column */
	all<K extends ColumnName<TTable>>(column: K, operator: string, value: ArrayElementType<TTable, K>): TypedConditionBuilder<TTable>;
	/** Array has specific length */
	length<K extends ColumnName<TTable>>(column: K, length: number): TypedConditionBuilder<TTable>;
	/** Array slice equals values - infers element type from column */
	slice<K extends ColumnName<TTable>>(column: K, start: number, end: number, values: ArrayElementType<TTable, K>[]): TypedConditionBuilder<TTable>;
	/** Element at index equals value - infers element type from column */
	atIndex<K extends ColumnName<TTable>>(column: K, index: number, value: ArrayElementType<TTable, K>): TypedConditionBuilder<TTable>;
	readonly string: TypedArrayStringConditionBuilder<TTable>;
	readonly numeric: TypedArrayNumericConditionBuilder<TTable>;
	readonly integer: TypedArrayNumericConditionBuilder<TTable>;
	readonly uuid: TypedArrayUuidConditionBuilder<TTable>;
	readonly date: TypedArrayDateConditionBuilder<TTable>;
	readonly timestamp: TypedArrayDateConditionBuilder<TTable>;
	readonly jsonb: TypedArrayJsonbConditionBuilder<TTable>;
}
/**
 * Typed Array String condition builder
 */
export interface TypedArrayStringConditionBuilder<TTable = any> {
	startsWith<K extends ColumnName<TTable>>(column: K, prefix: string): TypedConditionBuilder<TTable>;
	endsWith<K extends ColumnName<TTable>>(column: K, suffix: string): TypedConditionBuilder<TTable>;
	contains<K extends ColumnName<TTable>>(column: K, substring: string): TypedConditionBuilder<TTable>;
	matches<K extends ColumnName<TTable>>(column: K, pattern: string): TypedConditionBuilder<TTable>;
	imatches<K extends ColumnName<TTable>>(column: K, pattern: string): TypedConditionBuilder<TTable>;
	ilike<K extends ColumnName<TTable>>(column: K, pattern: string): TypedConditionBuilder<TTable>;
	allStartWith<K extends ColumnName<TTable>>(column: K, prefix: string): TypedConditionBuilder<TTable>;
	allEndWith<K extends ColumnName<TTable>>(column: K, suffix: string): TypedConditionBuilder<TTable>;
	allContain<K extends ColumnName<TTable>>(column: K, substring: string): TypedConditionBuilder<TTable>;
	lengthBetween<K extends ColumnName<TTable>>(column: K, min: number, max?: number): TypedConditionBuilder<TTable>;
	hasEmpty<K extends ColumnName<TTable>>(column: K): TypedConditionBuilder<TTable>;
	hasNonEmpty<K extends ColumnName<TTable>>(column: K): TypedConditionBuilder<TTable>;
	hasUppercase<K extends ColumnName<TTable>>(column: K): TypedConditionBuilder<TTable>;
	hasLowercase<K extends ColumnName<TTable>>(column: K): TypedConditionBuilder<TTable>;
	hasNumeric<K extends ColumnName<TTable>>(column: K): TypedConditionBuilder<TTable>;
	equals<K extends ColumnName<TTable>>(column: K, value: string): TypedConditionBuilder<TTable>;
	iequals<K extends ColumnName<TTable>>(column: K, value: string): TypedConditionBuilder<TTable>;
}
/**
 * Typed Array Numeric condition builder
 */
export interface TypedArrayNumericConditionBuilder<TTable = any> {
	greaterThan<K extends ColumnName<TTable>>(column: K, value: number): TypedConditionBuilder<TTable>;
	greaterThanOrEqual<K extends ColumnName<TTable>>(column: K, value: number): TypedConditionBuilder<TTable>;
	lessThan<K extends ColumnName<TTable>>(column: K, value: number): TypedConditionBuilder<TTable>;
	lessThanOrEqual<K extends ColumnName<TTable>>(column: K, value: number): TypedConditionBuilder<TTable>;
	between<K extends ColumnName<TTable>>(column: K, min: number, max: number): TypedConditionBuilder<TTable>;
	equals<K extends ColumnName<TTable>>(column: K, value: number): TypedConditionBuilder<TTable>;
}
/**
 * Typed Array UUID condition builder
 */
export interface TypedArrayUuidConditionBuilder<TTable = any> {
	allValid<K extends ColumnName<TTable>>(column: K): TypedConditionBuilder<TTable>;
	hasVersion<K extends ColumnName<TTable>>(column: K, version: 1 | 2 | 3 | 4 | 5): TypedConditionBuilder<TTable>;
	equals<K extends ColumnName<TTable>>(column: K, uuid: string): TypedConditionBuilder<TTable>;
}
/**
 * Typed Array Date condition builder
 */
export interface TypedArrayDateConditionBuilder<TTable = any> {
	before<K extends ColumnName<TTable>>(column: K, date: string | Date): TypedConditionBuilder<TTable>;
	after<K extends ColumnName<TTable>>(column: K, date: string | Date): TypedConditionBuilder<TTable>;
	between<K extends ColumnName<TTable>>(column: K, start: string | Date, end: string | Date): TypedConditionBuilder<TTable>;
	withinDays<K extends ColumnName<TTable>>(column: K, days: number): TypedConditionBuilder<TTable>;
	equals<K extends ColumnName<TTable>>(column: K, date: string | Date): TypedConditionBuilder<TTable>;
}
/**
 * Typed Array JSONB condition builder
 */
export interface TypedArrayJsonbConditionBuilder<TTable = any> {
	hasKey<K extends ColumnName<TTable>>(column: K, key: string): TypedConditionBuilder<TTable>;
	hasPath<K extends ColumnName<TTable>>(column: K, path: string): TypedConditionBuilder<TTable>;
	contains<K extends ColumnName<TTable>>(column: K, value: any): TypedConditionBuilder<TTable>;
	containedBy<K extends ColumnName<TTable>>(column: K, value: any): TypedConditionBuilder<TTable>;
	equals<K extends ColumnName<TTable>>(column: K, value: any): TypedConditionBuilder<TTable>;
	pathEquals<K extends ColumnName<TTable>>(column: K, path: string, value: any): TypedConditionBuilder<TTable>;
}
/**
 * Typed Fulltext condition builder
 */
export interface TypedFulltextConditionBuilder<TTable = any> {
	search<K extends ColumnName<TTable>>(column: K, query: string, config?: string): TypedConditionBuilder<TTable>;
	match<K extends ColumnName<TTable>>(column: K, query: string, config?: string): TypedConditionBuilder<TTable>;
	rank<K extends ColumnName<TTable>>(column: K, query: string, minRank?: number): TypedConditionBuilder<TTable>;
}
/**
 * Typed Range condition builder with tuple-based ranges
 * Use [start, end] tuples instead of string literals.
 *
 * @example
 * ```typescript
 * // Integer range
 * .where(q => q.range.contains('price_range', 50))
 * .where(q => q.range.overlaps('price_range', [10, 100]))
 *
 * // With bounds specification
 * .where(q => q.range.overlaps('dates', { start: 1, end: 10, startBound: 'inclusive', endBound: 'exclusive' }))
 * ```
 */
export interface TypedRangeConditionBuilder<TTable = any> {
	/** Check if range contains a single value */
	contains<K extends ColumnName<TTable>>(column: K, value: number | Date | string): TypedConditionBuilder<TTable>;
	/** Check if range is contained by another range - use [start, end] tuple */
	containedBy<K extends ColumnName<TTable>>(column: K, range: RangeInput<number> | RangeInput<Date> | RangeInput<string>): TypedConditionBuilder<TTable>;
	/** Check if ranges overlap - use [start, end] tuple */
	overlaps<K extends ColumnName<TTable>>(column: K, range: RangeInput<number> | RangeInput<Date> | RangeInput<string>): TypedConditionBuilder<TTable>;
	/** Check if range is strictly left of another - use [start, end] tuple */
	strictlyLeft<K extends ColumnName<TTable>>(column: K, range: RangeInput<number> | RangeInput<Date> | RangeInput<string>): TypedConditionBuilder<TTable>;
	/** Check if range is strictly right of another - use [start, end] tuple */
	strictlyRight<K extends ColumnName<TTable>>(column: K, range: RangeInput<number> | RangeInput<Date> | RangeInput<string>): TypedConditionBuilder<TTable>;
	/** Check if range is adjacent to another - use [start, end] tuple */
	adjacent<K extends ColumnName<TTable>>(column: K, range: RangeInput<number> | RangeInput<Date> | RangeInput<string>): TypedConditionBuilder<TTable>;
}
/** PostgreSQL geometric input - typed or string literal */
export type GeometricInput = Point2D | Box | LineSegment | Path | Circle | string;
/**
 * Typed Geometric condition builder using typed coordinates
 *
 * @example
 * ```typescript
 * // Point: [x, y]
 * .where(q => q.geometric.contains('area', [10, 20]))
 *
 * // Box: [[x1, y1], [x2, y2]]
 * .where(q => q.geometric.overlaps('bounds', [[0, 0], [100, 100]]))
 *
 * // Circle: [[centerX, centerY], radius]
 * .where(q => q.geometric.contains('region', [[50, 50], 25]))
 * ```
 */
export interface TypedGeometricConditionBuilder<TTable = any> {
	/** Geometry contains another */
	contains<K extends ColumnName<TTable>>(column: K, value: GeometricInput): TypedConditionBuilder<TTable>;
	/** Geometry is contained by another */
	containedBy<K extends ColumnName<TTable>>(column: K, value: GeometricInput): TypedConditionBuilder<TTable>;
	/** Geometries overlap */
	overlaps<K extends ColumnName<TTable>>(column: K, value: GeometricInput): TypedConditionBuilder<TTable>;
	/** Geometry is strictly left */
	strictlyLeft<K extends ColumnName<TTable>>(column: K, value: GeometricInput): TypedConditionBuilder<TTable>;
	/** Geometry is strictly right */
	strictlyRight<K extends ColumnName<TTable>>(column: K, value: GeometricInput): TypedConditionBuilder<TTable>;
	/** Geometry is below */
	below<K extends ColumnName<TTable>>(column: K, value: GeometricInput): TypedConditionBuilder<TTable>;
	/** Geometry is above */
	above<K extends ColumnName<TTable>>(column: K, value: GeometricInput): TypedConditionBuilder<TTable>;
	/** Geometries intersect */
	intersects<K extends ColumnName<TTable>>(column: K, value: GeometricInput): TypedConditionBuilder<TTable>;
	/** Line is horizontal */
	isHorizontal<K extends ColumnName<TTable>>(column: K): TypedConditionBuilder<TTable>;
	/** Line is vertical */
	isVertical<K extends ColumnName<TTable>>(column: K): TypedConditionBuilder<TTable>;
	/** Lines are parallel */
	isParallel<K extends ColumnName<TTable>>(column: K, value: LineSegment | string): TypedConditionBuilder<TTable>;
	/** Lines are perpendicular */
	isPerpendicular<K extends ColumnName<TTable>>(column: K, value: LineSegment | string): TypedConditionBuilder<TTable>;
	/** Geometries are the same */
	sameAs<K extends ColumnName<TTable>>(column: K, value: GeometricInput): TypedConditionBuilder<TTable>;
	/** Distance is less than max */
	distanceLessThan<K extends ColumnName<TTable>>(column: K, value: GeometricInput, maxDistance: number): TypedConditionBuilder<TTable>;
}
/**
 * Typed Network condition builder
 * Accepts CIDR strings or structured IPv4Address objects.
 *
 * @example
 * ```typescript
 * // CIDR string
 * .where(q => q.network.containedByOrEqual('ip', '192.168.0.0/16'))
 *
 * // Structured IPv4
 * .where(q => q.network.containedByOrEqual('ip', { octets: [192, 168, 0, 0], mask: 16 }))
 * ```
 */
export interface TypedNetworkConditionBuilder<TTable = any> {
	/** Strictly contained by network (<<) */
	containedByStrict<K extends ColumnName<TTable>>(column: K, value: NetworkAddress): TypedConditionBuilder<TTable>;
	/** Contained by or equal to network (<<=) */
	containedByOrEqual<K extends ColumnName<TTable>>(column: K, value: NetworkAddress): TypedConditionBuilder<TTable>;
	/** Strictly contains network (>>) */
	containsStrict<K extends ColumnName<TTable>>(column: K, value: NetworkAddress): TypedConditionBuilder<TTable>;
	/** Contains or equal to network (>>=) */
	containsOrEqual<K extends ColumnName<TTable>>(column: K, value: NetworkAddress): TypedConditionBuilder<TTable>;
	/** Networks overlap (&&) */
	overlaps<K extends ColumnName<TTable>>(column: K, value: NetworkAddress): TypedConditionBuilder<TTable>;
	/** Same address family */
	sameFamily<K extends ColumnName<TTable>>(column: K, value: NetworkAddress): TypedConditionBuilder<TTable>;
	/** Is IPv4 address */
	isIPv4<K extends ColumnName<TTable>>(column: K): TypedConditionBuilder<TTable>;
	/** Is IPv6 address */
	isIPv6<K extends ColumnName<TTable>>(column: K): TypedConditionBuilder<TTable>;
	/** Mask length equals */
	maskLengthEquals<K extends ColumnName<TTable>>(column: K, length: number): TypedConditionBuilder<TTable>;
	/** Host part equals */
	hostEquals<K extends ColumnName<TTable>>(column: K, value: string): TypedConditionBuilder<TTable>;
	/** Network part equals */
	networkEquals<K extends ColumnName<TTable>>(column: K, value: NetworkAddress): TypedConditionBuilder<TTable>;
	/** MAC address equals */
	macEquals<K extends ColumnName<TTable>>(column: K, value: string): TypedConditionBuilder<TTable>;
}
/**
 * Typed PostGIS condition builder for geometry/geography operations
 * Accepts GeoJSON objects or WKT strings.
 *
 * @example
 * ```typescript
 * // GeoJSON Point
 * .where(q => q.postgis.dwithin('location', { type: 'Point', coordinates: [-122.4194, 37.7749] }, 1000))
 *
 * // WKT string (still supported)
 * .where(q => q.postgis.contains('polygon', 'POINT(-122.4194 37.7749)'))
 *
 * // GeoJSON Polygon
 * .where(q => q.postgis.within('point', {
 *     type: 'Polygon',
 *     coordinates: [[[-122.5, 37.7], [-122.4, 37.7], [-122.4, 37.8], [-122.5, 37.8], [-122.5, 37.7]]]
 * }))
 * ```
 */
export interface TypedPostgisConditionBuilder<TTable = any> {
	/** ST_Contains - geometry A contains geometry B */
	contains<K extends ColumnName<TTable>>(column: K, geometry: GeometryInput): TypedConditionBuilder<TTable>;
	/** ST_Within - geometry A is within geometry B */
	within<K extends ColumnName<TTable>>(column: K, geometry: GeometryInput): TypedConditionBuilder<TTable>;
	/** ST_Intersects - geometries intersect */
	intersects<K extends ColumnName<TTable>>(column: K, geometry: GeometryInput): TypedConditionBuilder<TTable>;
	/** ST_Overlaps - geometries overlap */
	overlaps<K extends ColumnName<TTable>>(column: K, geometry: GeometryInput): TypedConditionBuilder<TTable>;
	/** ST_Crosses - geometries cross */
	crosses<K extends ColumnName<TTable>>(column: K, geometry: GeometryInput): TypedConditionBuilder<TTable>;
	/** ST_Touches - geometries touch */
	touches<K extends ColumnName<TTable>>(column: K, geometry: GeometryInput): TypedConditionBuilder<TTable>;
	/** ST_Disjoint - geometries are disjoint */
	disjoint<K extends ColumnName<TTable>>(column: K, geometry: GeometryInput): TypedConditionBuilder<TTable>;
	/** ST_Equals - geometries are equal */
	equals<K extends ColumnName<TTable>>(column: K, geometry: GeometryInput): TypedConditionBuilder<TTable>;
	/** ST_DWithin - geometry is within distance (indexed) */
	dwithin<K extends ColumnName<TTable>>(column: K, geometry: GeometryInput, distance: number): TypedConditionBuilder<TTable>;
	/** ST_Distance < value */
	distanceLessThan<K extends ColumnName<TTable>>(column: K, geometry: GeometryInput, distance: number): TypedConditionBuilder<TTable>;
	/** ST_Distance > value */
	distanceGreaterThan<K extends ColumnName<TTable>>(column: K, geometry: GeometryInput, distance: number): TypedConditionBuilder<TTable>;
	/** ST_CoveredBy - geometry A covered by geometry B */
	coveredBy<K extends ColumnName<TTable>>(column: K, geometry: GeometryInput): TypedConditionBuilder<TTable>;
	/** ST_Covers - geometry A covers geometry B */
	covers<K extends ColumnName<TTable>>(column: K, geometry: GeometryInput): TypedConditionBuilder<TTable>;
}
declare class ArrayStringUpdateBuilder {
	/**
	 * Replace entire array with new values
	 */
	set(values: string[]): string;
	/**
	 * Append element to end of array
	 */
	append(value: string): string;
	/**
	 * Prepend element to beginning of array
	 */
	prepend(value: string): string;
	/**
	 * Remove all occurrences of element from array
	 */
	remove(value: string): string;
	/**
	 * Concatenate with another array
	 */
	concat(values: string[]): string;
	private getContextColumn;
}
declare class ArrayNumericUpdateBuilder {
	set(values: number[]): string;
	append(value: number): string;
	prepend(value: number): string;
	remove(value: number): string;
	concat(values: number[]): string;
	private getContextColumn;
}
declare class ArrayBooleanUpdateBuilder {
	set(values: boolean[]): string;
	append(value: boolean): string;
	prepend(value: boolean): string;
	remove(value: boolean): string;
	concat(values: boolean[]): string;
	private getContextColumn;
}
declare class ArrayUuidUpdateBuilder {
	set(values: string[]): string;
	append(value: string): string;
	prepend(value: string): string;
	remove(value: string): string;
	concat(values: string[]): string;
	private getContextColumn;
}
declare class ArrayDateUpdateBuilder {
	set(values: Array<string | Date>): string;
	append(value: string | Date): string;
	prepend(value: string | Date): string;
	remove(value: string | Date): string;
	concat(values: Array<string | Date>): string;
	private getContextColumn;
}
/**
 * Strip internal metadata types (like DefaultValue) from type unions.
 * DefaultValue has { $sql: string; $isDefault: true }
 */
export type StripInternalTypes<T> = T extends {
	$isDefault: true;
} ? never : T extends object & {
	$sql: string;
} ? never : T;
type CleanType$1<T> = [
	StripInternalTypes<T>
] extends [
	never
] ? T : StripInternalTypes<T>;
/**
 * Get valid string keys from a type, with fallback to string if inference fails.
 * Handles union types and strips internal metadata.
 */
export type ValidKeys<T> = keyof CleanType$1<T> & string extends never ? string : keyof CleanType$1<T> & string;
/**
 * Extract primitive value type for JSONB comparison.
 * Converts complex types to their primitive equivalents for WHERE conditions.
 * Falls back to string | number | boolean for unknown types.
 */
export type JsonbPrimitive<T> = T extends string ? string : T extends number ? number : T extends boolean ? boolean : string | number | boolean;
declare class ArrayJsonbUpdateBuilder<T = unknown> {
	set(values: T[]): string;
	append(value: T): string;
	prepend(value: T): string;
	/**
	 * Remove exact JSONB object from array (must match exactly)
	 */
	remove(value: T): string;
	concat(values: T[]): string;
	/**
	 * Remove items from jsonb[] array where a field matches a value.
	 * Uses ARRAY() with unnest to filter elements.
	 *
	 * @param key - The object key to match against (autocompleted from T)
	 * @param value - The value to match for removal (type-checked against T[K])
	 * @returns SQL expression
	 *
	 * @example
	 * ```typescript
	 * // Remove tag with id = 'abc123'
	 * tags: (ops) => ops.array.jsonb.removeWhere('id', 'abc123')
	 * // SQL: ARRAY(SELECT elem FROM unnest(tags) AS elem WHERE elem->>'id' != 'abc123')
	 * ```
	 */
	removeWhere<K extends ValidKeys<T>>(key: K, value: K extends keyof CleanType$1<T> ? JsonbPrimitive<CleanType$1<T>[K]> : string | number | boolean): string;
	/**
	 * Remove items from jsonb[] array where multiple fields match.
	 * All conditions must match for an item to be removed (AND logic).
	 *
	 * @param conditions - Object with key-value pairs to match (keys autocompleted from T)
	 * @returns SQL expression
	 *
	 * @example
	 * ```typescript
	 * // Remove tag where id='abc' AND name='Test'
	 * tags: (ops) => ops.array.jsonb.removeWhereAll({ id: 'abc123', name: 'Test' })
	 * // SQL: ARRAY(SELECT elem FROM unnest(tags) AS elem WHERE NOT (elem->>'id' = 'abc123' AND elem->>'name' = 'Test'))
	 * ```
	 */
	removeWhereAll(conditions: Partial<{
		[K in ValidKeys<T>]: K extends keyof CleanType$1<T> ? JsonbPrimitive<CleanType$1<T>[K]> : string | number | boolean;
	}>): string;
	/**
	 * Keep only items from jsonb[] array where a field matches a value.
	 * Opposite of removeWhere - filters to keep matching items.
	 *
	 * @param key - The object key to match against (autocompleted from T)
	 * @param value - The value to match for keeping (type-checked against T[K])
	 * @returns SQL expression
	 *
	 * @example
	 * ```typescript
	 * // Keep only tags with color = '#ff0000'
	 * tags: (ops) => ops.array.jsonb.filterWhere('color', '#ff0000')
	 * // SQL: ARRAY(SELECT elem FROM unnest(tags) AS elem WHERE elem->>'color' = '#ff0000')
	 * ```
	 */
	filterWhere<K extends ValidKeys<T>>(key: K, value: K extends keyof CleanType$1<T> ? JsonbPrimitive<CleanType$1<T>[K]> : string | number | boolean): string;
	/**
	 * Update fields within items matching a condition.
	 * Updates the specified fields for all matching items in the array.
	 *
	 * @param matchKey - Key to match items by (autocompleted from T)
	 * @param matchValue - Value to match (type-checked against T[matchKey])
	 * @param updates - Object with fields to update (keys/values type-checked against T)
	 * @returns SQL expression
	 *
	 * @example
	 * ```typescript
	 * // Update color of tag with id='abc' to '#fff'
	 * tags: (ops) => ops.array.jsonb.updateWhere('id', 'abc123', { color: '#ffffff' })
	 * // SQL: ARRAY(SELECT CASE WHEN elem->>'id' = 'abc123' THEN jsonb_set(elem, '{color}', '"#ffffff"'::jsonb) ELSE elem END FROM unnest(tags) AS elem)
	 *
	 * // Update multiple fields
	 * tags: (ops) => ops.array.jsonb.updateWhere('id', 'abc123', { color: '#fff', name: 'Updated' })
	 * ```
	 */
	updateWhere<MK extends ValidKeys<T>>(matchKey: MK, matchValue: MK extends keyof CleanType$1<T> ? JsonbPrimitive<CleanType$1<T>[MK]> : string | number | boolean, updates: Partial<CleanType$1<T>>): string;
	private getContextColumn;
}
declare class ArrayUpdateBuilder<T = unknown> {
	private currentColumn;
	constructor(currentColumn: string);
	get string(): ArrayStringUpdateBuilder;
	get numeric(): ArrayNumericUpdateBuilder;
	get integer(): ArrayNumericUpdateBuilder;
	get boolean(): ArrayBooleanUpdateBuilder;
	get uuid(): ArrayUuidUpdateBuilder;
	get date(): ArrayDateUpdateBuilder;
	get timestamp(): ArrayDateUpdateBuilder;
	/**
	 * JSONB array operations for jsonb[] columns.
	 * Type T is used for key/value autocompletion and type-checking.
	 */
	get jsonb(): ArrayJsonbUpdateBuilder<T>;
}
type StripInternalTypes$1<T> = T extends {
	$isDefault: true;
} ? never : T extends object & {
	$sql: string;
} ? never : T;
type CleanType$2<T> = [
	StripInternalTypes$1<T>
] extends [
	never
] ? T : StripInternalTypes$1<T>;
/**
 * Extract element type from array type, cleaning internal metadata.
 * For `Tag[]` returns `Tag`, for non-arrays returns the type itself.
 */
export type ElementType<T> = T extends (infer E)[] ? CleanType$2<E> : CleanType$2<T>;
type ValidKeys$1<T> = keyof ElementType<T> & string extends never ? string : keyof ElementType<T> & string;
type JsonbPrimitive$1<T> = T extends string ? string : T extends number ? number : T extends boolean ? boolean : string | number | boolean;
/**
 * Valid JSON value types for JSONB fields.
 */
export type JsonValue = string | number | boolean | null | JsonValue[] | {
	[key: string]: JsonValue;
};
declare class JsonbArrayBuilder<T = unknown> {
	private currentColumn;
	constructor(currentColumn: string);
	/**
	 * Replace entire JSONB array with new values.
	 *
	 * @param values - Array of values to set (type-checked against T)
	 * @returns SQL expression for the UPDATE SET clause
	 *
	 * @example
	 * ```typescript
	 * tags: (ops) => ops.jsonb.array.set([
	 *   { id: '1', name: 'Tag1', color: '#fff' }
	 * ])
	 * // SQL: tags = '[{"id":"1","name":"Tag1","color":"#fff"}]'::jsonb
	 * ```
	 */
	set(values: T extends unknown[] ? T : T[]): string;
	/**
	 * Append a single item to end of array.
	 * Works even if column is NULL (creates array with single element).
	 *
	 * @param value - Item to append (type-checked against element type)
	 * @returns SQL expression
	 *
	 * @example
	 * ```typescript
	 * tags: (ops) => ops.jsonb.array.append({ id: '1', name: 'New Tag', color: '#fff' })
	 * // SQL: tags = COALESCE(tags, '[]'::jsonb) || '[{"id":"1",...}]'::jsonb
	 * ```
	 */
	append(value: ElementType<T>): string;
	/**
	 * Prepend a single item to beginning of array.
	 * Works even if column is NULL.
	 *
	 * @param value - Item to prepend (type-checked against element type)
	 * @returns SQL expression
	 *
	 * @example
	 * ```typescript
	 * tags: (ops) => ops.jsonb.array.prepend({ id: '1', name: 'First', color: '#fff' })
	 * // SQL: tags = '[{"id":"1",...}]'::jsonb || COALESCE(tags, '[]'::jsonb)
	 * ```
	 */
	prepend(value: ElementType<T>): string;
	/**
	 * Concatenate multiple items to end of array.
	 *
	 * @param values - Array of items to add (each type-checked)
	 * @returns SQL expression
	 *
	 * @example
	 * ```typescript
	 * tags: (ops) => ops.jsonb.array.concat([
	 *   { id: '1', name: 'Tag1', color: '#fff' },
	 *   { id: '2', name: 'Tag2', color: '#000' }
	 * ])
	 * // SQL: tags = COALESCE(tags, '[]'::jsonb) || '[...]'::jsonb
	 * ```
	 */
	concat(values: ElementType<T>[]): string;
	/**
	 * Insert item at specific index using jsonb_insert.
	 * Existing elements at and after index are shifted right.
	 *
	 * @param index - Zero-based index where to insert
	 * @param value - Item to insert (type-checked)
	 * @returns SQL expression
	 *
	 * @example
	 * ```typescript
	 * tags: (ops) => ops.jsonb.array.insertAt(1, { id: '2', name: 'Middle', color: '#ccc' })
	 * // SQL: tags = jsonb_insert(COALESCE(tags, '[]'::jsonb), '{1}', '{"id":"2",...}'::jsonb)
	 * ```
	 */
	insertAt(index: number, value: ElementType<T>): string;
	/**
	 * Remove item at specific index.
	 * Supports negative indices (-1 = last, -2 = second to last, etc.)
	 *
	 * @param index - Zero-based index to remove (negative counts from end)
	 * @returns SQL expression
	 *
	 * @example
	 * ```typescript
	 * tags: (ops) => ops.jsonb.array.removeAt(0)   // Remove first
	 * tags: (ops) => ops.jsonb.array.removeAt(-1)  // Remove last
	 * // SQL: tags = COALESCE(tags, '[]'::jsonb) - 0
	 * ```
	 */
	removeAt(index: number): string;
	/**
	 * Remove first item from array (like JavaScript Array.shift()).
	 *
	 * @returns SQL expression
	 *
	 * @example
	 * ```typescript
	 * tags: (ops) => ops.jsonb.array.shift()
	 * // SQL: tags = COALESCE(tags, '[]'::jsonb) - 0
	 * ```
	 */
	shift(): string;
	/**
	 * Remove last item from array (like JavaScript Array.pop()).
	 *
	 * @returns SQL expression
	 *
	 * @example
	 * ```typescript
	 * tags: (ops) => ops.jsonb.array.pop()
	 * // SQL: tags = COALESCE(tags, '[]'::jsonb) - -1
	 * ```
	 */
	pop(): string;
	/**
	 * Remove items where a field matches a value.
	 * Uses subquery with jsonb_array_elements to filter.
	 *
	 * @param key - Field name to match against (autocompleted from element type)
	 * @param value - Value to match for removal (type-checked)
	 * @returns SQL expression
	 *
	 * @example
	 * ```typescript
	 * // Remove tag with id = 'abc123'
	 * tags: (ops) => ops.jsonb.array.removeWhere('id', 'abc123')
	 * // SQL: tags = COALESCE((SELECT jsonb_agg(elem) FROM jsonb_array_elements(...)
	 * //            WHERE elem->>'id' != 'abc123'), '[]'::jsonb)
	 * ```
	 */
	removeWhere<K extends ValidKeys$1<T>>(key: K, value: K extends keyof ElementType<T> ? JsonbPrimitive$1<ElementType<T>[K]> : string | number | boolean): string;
	/**
	 * Remove items where multiple fields match (AND logic).
	 * All conditions must match for an item to be removed.
	 *
	 * @param conditions - Object with key-value pairs to match
	 * @returns SQL expression
	 *
	 * @example
	 * ```typescript
	 * // Remove tag where id='abc' AND name='Test'
	 * tags: (ops) => ops.jsonb.array.removeWhereAll({ id: 'abc123', name: 'Test' })
	 * // SQL: ... WHERE NOT (elem->>'id' = 'abc123' AND elem->>'name' = 'Test')
	 * ```
	 */
	removeWhereAll(conditions: Partial<{
		[K in ValidKeys$1<T>]: K extends keyof ElementType<T> ? JsonbPrimitive$1<ElementType<T>[K]> : string | number | boolean;
	}>): string;
	/**
	 * Keep only items where a field matches a value (opposite of removeWhere).
	 *
	 * @param key - Field name to match against (autocompleted)
	 * @param value - Value to match for keeping (type-checked)
	 * @returns SQL expression
	 *
	 * @example
	 * ```typescript
	 * // Keep only tags with color = '#ff0000'
	 * tags: (ops) => ops.jsonb.array.filter('color', '#ff0000')
	 * // SQL: ... WHERE elem->>'color' = '#ff0000'
	 * ```
	 */
	filter<K extends ValidKeys$1<T>>(key: K, value: K extends keyof ElementType<T> ? JsonbPrimitive$1<ElementType<T>[K]> : string | number | boolean): string;
	/**
	 * Keep only items where multiple fields match (AND logic).
	 *
	 * @param conditions - Object with key-value pairs to match
	 * @returns SQL expression
	 *
	 * @example
	 * ```typescript
	 * // Keep only active important tags
	 * tags: (ops) => ops.jsonb.array.filterAll({ active: true, important: true })
	 * ```
	 */
	filterAll(conditions: Partial<{
		[K in ValidKeys$1<T>]: K extends keyof ElementType<T> ? JsonbPrimitive$1<ElementType<T>[K]> : string | number | boolean;
	}>): string;
	/**
	 * Update item at specific index (replaces entire item).
	 *
	 * @param index - Zero-based index to update
	 * @param newValue - New value for the item (type-checked)
	 * @returns SQL expression
	 *
	 * @example
	 * ```typescript
	 * // Update first tag
	 * tags: (ops) => ops.jsonb.array.updateAt(0, { id: '1', name: 'Updated', color: '#000' })
	 * // SQL: tags = jsonb_set(COALESCE(tags, '[]'::jsonb), '{0}', '{"id":"1",...}'::jsonb)
	 * ```
	 */
	updateAt(index: number, newValue: ElementType<T>): string;
	/**
	 * Update specific fields of items matching a condition.
	 * Only specified fields are updated, other fields preserved.
	 *
	 * @param matchKey - Field to match items by (autocompleted)
	 * @param matchValue - Value to match (type-checked)
	 * @param updates - Object with fields to update
	 * @returns SQL expression
	 *
	 * @example
	 * ```typescript
	 * // Update color of tag with id='abc123'
	 * tags: (ops) => ops.jsonb.array.updateWhere('id', 'abc123', { color: '#ffffff' })
	 *
	 * // Update multiple fields
	 * tags: (ops) => ops.jsonb.array.updateWhere('id', 'abc123', { color: '#fff', name: 'Updated' })
	 * ```
	 */
	updateWhere<MK extends ValidKeys$1<T>>(matchKey: MK, matchValue: MK extends keyof ElementType<T> ? JsonbPrimitive$1<ElementType<T>[MK]> : string | number | boolean, updates: Partial<ElementType<T>>): string;
	/**
	 * Reverse array order.
	 *
	 * @returns SQL expression
	 *
	 * @example
	 * ```typescript
	 * tags: (ops) => ops.jsonb.array.reverse()
	 * // SQL: ... SELECT jsonb_agg(elem ORDER BY idx DESC) ...
	 * ```
	 */
	reverse(): string;
	/**
	 * Remove duplicate elements (keeps first occurrence).
	 * Compares entire objects for equality.
	 *
	 * @returns SQL expression
	 *
	 * @example
	 * ```typescript
	 * tags: (ops) => ops.jsonb.array.unique()
	 * // SQL: ... SELECT jsonb_agg(DISTINCT elem) ...
	 * ```
	 */
	unique(): string;
	/**
	 * Remove duplicates by specific field (keeps first occurrence).
	 * Useful when objects have unique IDs.
	 *
	 * @param key - Field to use for uniqueness check (autocompleted)
	 * @returns SQL expression
	 *
	 * @example
	 * ```typescript
	 * // Keep only first tag with each unique id
	 * tags: (ops) => ops.jsonb.array.uniqueBy('id')
	 * // SQL: ... SELECT DISTINCT ON (elem->>'id') elem ...
	 * ```
	 */
	uniqueBy<K extends ValidKeys$1<T>>(key: K): string;
	/**
	 * Sort array by a field.
	 *
	 * @param key - Field to sort by (autocompleted)
	 * @param direction - Sort direction: 'ASC' (default) or 'DESC'
	 * @returns SQL expression
	 *
	 * @example
	 * ```typescript
	 * // Sort tags by name ascending
	 * tags: (ops) => ops.jsonb.array.sortBy('name')
	 *
	 * // Sort by created date descending
	 * tags: (ops) => ops.jsonb.array.sortBy('createdAt', 'DESC')
	 * ```
	 */
	sortBy<K extends ValidKeys$1<T>>(key: K, direction?: "ASC" | "DESC"): string;
	/**
	 * Get slice of array (like JavaScript Array.slice()).
	 *
	 * @param start - Start index (inclusive, 0-based)
	 * @param end - End index (exclusive), undefined = to end
	 * @returns SQL expression
	 *
	 * @example
	 * ```typescript
	 * // Get items 2-4 (indices 1, 2, 3)
	 * tags: (ops) => ops.jsonb.array.slice(1, 4)
	 *
	 * // Get from index 2 to end
	 * tags: (ops) => ops.jsonb.array.slice(2)
	 * ```
	 */
	slice(start: number, end?: number): string;
	/**
	 * Take first N items from array.
	 *
	 * @param n - Number of items to take
	 * @returns SQL expression
	 *
	 * @example
	 * ```typescript
	 * // Keep only first 5 tags
	 * tags: (ops) => ops.jsonb.array.take(5)
	 * ```
	 */
	take(n: number): string;
	/**
	 * Skip first N items from array.
	 *
	 * @param n - Number of items to skip
	 * @returns SQL expression
	 *
	 * @example
	 * ```typescript
	 * // Remove first 3 tags
	 * tags: (ops) => ops.jsonb.array.skip(3)
	 * ```
	 */
	skip(n: number): string;
	/**
	 * Update a field in ALL items (map operation).
	 *
	 * @param key - Field to update in each item (autocompleted)
	 * @param value - New value for the field (type-checked)
	 * @returns SQL expression
	 *
	 * @example
	 * ```typescript
	 * // Set all tags to active
	 * tags: (ops) => ops.jsonb.array.mapSet('active', true)
	 *
	 * // Set all tags to same color
	 * tags: (ops) => ops.jsonb.array.mapSet('color', '#ffffff')
	 * ```
	 */
	mapSet<K extends ValidKeys$1<T>>(key: K, value: K extends keyof ElementType<T> ? ElementType<T>[K] : JsonValue): string;
	/**
	 * Increment a numeric field in ALL items.
	 *
	 * @param key - Numeric field to increment (autocompleted)
	 * @param amount - Amount to add (default: 1)
	 * @returns SQL expression
	 *
	 * @example
	 * ```typescript
	 * // Increment viewCount in all items
	 * items: (ops) => ops.jsonb.array.mapIncrement('viewCount')
	 *
	 * // Add 10 to all scores
	 * items: (ops) => ops.jsonb.array.mapIncrement('score', 10)
	 * ```
	 */
	mapIncrement<K extends ValidKeys$1<T>>(key: K, amount?: number): string;
	/**
	 * Decrement a numeric field in ALL items.
	 *
	 * @param key - Numeric field to decrement (autocompleted)
	 * @param amount - Amount to subtract (default: 1)
	 * @returns SQL expression
	 */
	mapDecrement<K extends ValidKeys$1<T>>(key: K, amount?: number): string;
}
declare class JsonbUpdateBuilder<T = unknown> {
	private currentColumn;
	private _array;
	constructor(currentColumn?: string);
	/**
	 * Access array operations for JSONB arrays.
	 *
	 * @example
	 * ```typescript
	 * tags: (ops) => ops.jsonb.array.append({ id: '1', name: 'Tag' })
	 * tags: (ops) => ops.jsonb.array.removeWhere('id', 'abc123')
	 * ```
	 */
	get array(): JsonbArrayBuilder<T>;
	/**
	 * Replace entire JSONB value.
	 *
	 * @param value - New value (type-checked against T)
	 * @returns SQL expression
	 *
	 * @example
	 * ```typescript
	 * settings: (ops) => ops.jsonb.set({ theme: 'dark', notifications: true })
	 * // SQL: settings = '{"theme":"dark","notifications":true}'::jsonb
	 * ```
	 */
	set(value: T): string;
	/**
	 * Set a field at a specific path within a JSONB object.
	 * Creates the path if it doesn't exist.
	 *
	 * @param path - Path to field (string for top-level, string[] for nested)
	 * @param value - Value to set
	 * @returns SQL expression
	 *
	 * @example
	 * ```typescript
	 * // Set top-level field
	 * settings: (ops) => ops.jsonb.setField('theme', 'dark')
	 * // SQL: settings = jsonb_set(COALESCE(settings, '{}'::jsonb), '{theme}', '"dark"'::jsonb, true)
	 *
	 * // Set nested field
	 * settings: (ops) => ops.jsonb.setField(['user', 'preferences', 'theme'], 'dark')
	 * // SQL: ... '{user,preferences,theme}' ...
	 * ```
	 */
	setField(path: string | string[], value: JsonValue): string;
	/**
	 * Remove a field from a JSONB object.
	 *
	 * @param key - Key to remove (string for single, string[] for nested path)
	 * @returns SQL expression
	 *
	 * @example
	 * ```typescript
	 * // Remove top-level field
	 * settings: (ops) => ops.jsonb.removeField('deprecated')
	 * // SQL: settings = COALESCE(settings, '{}'::jsonb) - 'deprecated'
	 *
	 * // Remove nested field
	 * settings: (ops) => ops.jsonb.removeField(['user', 'temp'])
	 * // SQL: settings = COALESCE(settings, '{}'::jsonb) #- '{user,temp}'
	 * ```
	 */
	removeField(key: string | string[]): string;
	/**
	 * Remove multiple fields from a JSONB object at once.
	 *
	 * @param keys - Array of keys to remove
	 * @returns SQL expression
	 *
	 * @example
	 * ```typescript
	 * settings: (ops) => ops.jsonb.removeFields(['temp', 'deprecated', 'old'])
	 * // SQL: settings = COALESCE(settings, '{}'::jsonb) - ARRAY['temp', 'deprecated', 'old']
	 * ```
	 */
	removeFields(keys: string[]): string;
	/**
	 * Merge/upsert fields into a JSONB object (shallow merge).
	 * Existing fields are overwritten, new fields are added.
	 *
	 * @param obj - Object with fields to merge
	 * @returns SQL expression
	 *
	 * @example
	 * ```typescript
	 * settings: (ops) => ops.jsonb.merge({ theme: 'dark', language: 'en' })
	 * // SQL: settings = COALESCE(settings, '{}'::jsonb) || '{"theme":"dark","language":"en"}'::jsonb
	 * ```
	 */
	merge(obj: Partial<T> | Record<string, JsonValue>): string;
	/**
	 * Deep merge - recursively merges nested objects instead of replacing them.
	 *
	 * @param obj - Object with fields to deep merge
	 * @returns SQL expression
	 *
	 * @example
	 * ```typescript
	 * // If settings = { user: { name: 'John', age: 30 } }
	 * settings: (ops) => ops.jsonb.deepMerge({ user: { age: 31 } })
	 * // Result: { user: { name: 'John', age: 31 } }
	 * // (shallow merge would replace entire 'user' object)
	 * ```
	 */
	deepMerge(obj: Partial<T> | Record<string, JsonValue>): string;
	/**
	 * Rename a field in the JSONB object.
	 *
	 * @param oldKey - Current field name
	 * @param newKey - New field name
	 * @returns SQL expression
	 *
	 * @example
	 * ```typescript
	 * settings: (ops) => ops.jsonb.renameField('oldName', 'newName')
	 * // Copies value to new key, then removes old key
	 * ```
	 */
	renameField(oldKey: string, newKey: string): string;
	/**
	 * Increment a numeric field.
	 *
	 * @param path - Path to numeric field (string or string[])
	 * @param amount - Amount to add (default: 1)
	 * @returns SQL expression
	 *
	 * @example
	 * ```typescript
	 * // Increment top-level field
	 * stats: (ops) => ops.jsonb.increment('views')
	 *
	 * // Increment nested field by 5
	 * stats: (ops) => ops.jsonb.increment(['metrics', 'clicks'], 5)
	 * ```
	 */
	increment(path: string | string[], amount?: number): string;
	/**
	 * Decrement a numeric field.
	 *
	 * @param path - Path to numeric field
	 * @param amount - Amount to subtract (default: 1)
	 * @returns SQL expression
	 */
	decrement(path: string | string[], amount?: number): string;
	/**
	 * Multiply a numeric field.
	 *
	 * @param path - Path to numeric field
	 * @param factor - Multiplication factor
	 * @returns SQL expression
	 *
	 * @example
	 * ```typescript
	 * stats: (ops) => ops.jsonb.multiply('price', 1.1) // 10% increase
	 * ```
	 */
	multiply(path: string | string[], factor: number): string;
	/**
	 * Toggle a boolean field.
	 *
	 * @param path - Path to boolean field
	 * @returns SQL expression
	 *
	 * @example
	 * ```typescript
	 * settings: (ops) => ops.jsonb.toggle('notifications')
	 * // true → false, false → true, null → true
	 * ```
	 */
	toggle(path: string | string[]): string;
	/**
	 * Set field to current timestamp.
	 *
	 * @param path - Path to timestamp field
	 * @returns SQL expression
	 *
	 * @example
	 * ```typescript
	 * metadata: (ops) => ops.jsonb.setTimestamp('updatedAt')
	 * // SQL: ... to_jsonb(NOW()) ...
	 * ```
	 */
	setTimestamp(path: string | string[]): string;
	/**
	 * Append to a string field.
	 *
	 * @param path - Path to string field
	 * @param suffix - String to append
	 * @returns SQL expression
	 *
	 * @example
	 * ```typescript
	 * data: (ops) => ops.jsonb.appendString('notes', ' - updated')
	 * ```
	 */
	appendString(path: string | string[], suffix: string): string;
	/**
	 * Prepend to a string field.
	 *
	 * @param path - Path to string field
	 * @param prefix - String to prepend
	 * @returns SQL expression
	 *
	 * @example
	 * ```typescript
	 * data: (ops) => ops.jsonb.prependString('title', 'URGENT: ')
	 * ```
	 */
	prependString(path: string | string[], prefix: string): string;
}
/**
 * Column mapping for selected columns in joins
 * Maps property name to SQL column name
 */
export interface ColumnMapping {
	/** TypeScript property name (used as JSON key) */
	property: string;
	/** SQL column name (used in query) */
	sqlName: string;
}
/**
 * Structured join clause for type-safe joins
 */
export interface JoinClause {
	/** Join type (JOIN, LEFT JOIN, etc.) */
	type: "JOIN" | "LEFT JOIN" | "RIGHT JOIN" | "INNER JOIN" | "FULL OUTER JOIN" | "CROSS JOIN" | "LEFT JOIN LATERAL" | "JOIN LATERAL";
	/** Table name (SQL name) */
	table: string;
	/** Alias for the table (may be same as table) */
	alias: string;
	/** Schema key (for looking up table definition) - may differ from table/alias */
	schemaKey?: string;
	/** ON clause SQL (without "ON" keyword) */
	onClause?: string;
	/** USING columns (alternative to ON) */
	usingColumns?: string[];
	/** For LATERAL joins - the full subquery */
	lateralSubquery?: string;
	/** Select columns with property-to-SQL name mapping */
	selectColumns?: ColumnMapping[];
}
export declare class SelectBuilder {
	private tableName;
	private tableAlias?;
	private selectColumns;
	private whereConditions;
	private havingConditions;
	private joinClauses;
	private structuredJoins;
	private groupByColumns;
	private orderByColumns;
	private limitValue?;
	private offsetValue?;
	private distinctOnColumns;
	private isDistinct;
	private lockingClause?;
	private unionQueries;
	private includeExpressions;
	private columnResolver?;
	constructor(tableName: string, columns?: string | Array<string | [
		string,
		string
	]>);
	/**
	 * Set a column resolver to transform column names (e.g., camelCase to snake_case).
	 * Used by ConnectedSelectBuilder to map TypeScript property names to SQL column names.
	 * @internal
	 */
	setColumnResolver(resolver: (column: string) => string): SelectBuilder;
	/**
	 * Transform column names in conditions using the column resolver.
	 * Recursively handles nested or/and conditions.
	 * @internal
	 */
	private transformConditionColumns;
	/**
	 * Set an alias for the main table.
	 * @internal Used by ConnectedSelectBuilder for self-joins
	 */
	setTableAlias(alias: string): SelectBuilder;
	/**
	 * Get the table name (or alias if set)
	 */
	getTableIdentifier(): string;
	distinct(): SelectBuilder;
	where(callback: (builder: TypedConditionBuilder<any>) => TypedConditionBuilder<any>): SelectBuilder;
	join(table: string, condition: string): SelectBuilder;
	leftJoin(table: string, condition: string): SelectBuilder;
	rightJoin(table: string, condition: string): SelectBuilder;
	innerJoin(table: string, condition: string): SelectBuilder;
	/**
	 * Add a raw join clause (for complex joins like LATERAL).
	 * The joinSQL should be a complete join clause.
	 *
	 * @param joinSQL - Complete join clause (e.g., "LEFT JOIN LATERAL (...) ON true")
	 * @internal
	 */
	addRawJoin(joinSQL: string): SelectBuilder;
	groupBy(...columns: string[]): SelectBuilder;
	having(callback: (builder: TypedConditionBuilder<any>) => TypedConditionBuilder<any>): SelectBuilder;
	orderBy(column: string, direction?: "ASC" | "DESC"): SelectBuilder;
	/**
	 * Order by with explicit NULLS FIRST or NULLS LAST placement.
	 * PostgreSQL-specific ordering control for NULL values.
	 *
	 * @param column - Column to order by
	 * @param direction - 'ASC' or 'DESC'
	 * @param nulls - 'FIRST' puts NULLs at the beginning, 'LAST' puts them at the end
	 *
	 * @example
	 * ```typescript
	 * // NULLs at end for ascending order (default PostgreSQL behavior for DESC)
	 * builder.orderByNulls('priority', 'ASC', 'LAST')
	 * // SQL: ORDER BY "priority" ASC NULLS LAST
	 *
	 * // NULLs at start for descending order
	 * builder.orderByNulls('created_at', 'DESC', 'FIRST')
	 * // SQL: ORDER BY "created_at" DESC NULLS FIRST
	 * ```
	 */
	orderByNulls(column: string, direction: "ASC" | "DESC", nulls: "FIRST" | "LAST"): SelectBuilder;
	orderAsc(column: string): SelectBuilder;
	orderDesc(column: string): SelectBuilder;
	limit(count: number): SelectBuilder;
	offset(count: number): SelectBuilder;
	/**
	 * Adds DISTINCT ON clause for selecting unique rows based on specified columns.
	 * PostgreSQL-specific feature.
	 *
	 * @param columns - Columns to determine uniqueness
	 * @returns The SelectBuilder instance for method chaining
	 *
	 * @example
	 * ```typescript
	 * relq('logs')
	 *   .select(['user_id', 'created_at', 'message'])
	 *   .distinctOn('user_id')
	 *   .orderBy('user_id')
	 *   .orderBy('created_at', 'DESC')
	 * // SQL: SELECT DISTINCT ON ("user_id") "user_id", "created_at", "message" FROM "logs" ORDER BY "user_id", "created_at" DESC
	 * ```
	 */
	distinctOn(...columns: string[]): SelectBuilder;
	/**
	 * Adds FOR UPDATE clause for row-level locking.
	 * Locks selected rows for update, preventing other transactions from modifying them.
	 *
	 * @returns The SelectBuilder instance for method chaining
	 *
	 * @example
	 * ```typescript
	 * relq('accounts')
	 *   .select(['id', 'balance'])
	 *   .where(q => q.equal('id', 123))
	 *   .forUpdate()
	 * // SQL: SELECT "id", "balance" FROM "accounts" WHERE "id" = 123 FOR UPDATE
	 * ```
	 */
	forUpdate(): SelectBuilder;
	/**
	 * Adds FOR UPDATE NOWAIT clause.
	 * Returns error immediately if row is locked by another transaction.
	 */
	forUpdateNoWait(): SelectBuilder;
	/**
	 * Adds FOR UPDATE SKIP LOCKED clause.
	 * Skips rows that are locked by other transactions.
	 */
	forUpdateSkipLocked(): SelectBuilder;
	/**
	 * Adds FOR SHARE clause for shared row-level locking.
	 * Allows other transactions to read but not modify locked rows.
	 */
	forShare(): SelectBuilder;
	/**
	 * Adds FOR SHARE NOWAIT clause.
	 */
	forShareNoWait(): SelectBuilder;
	/**
	 * Adds FOR SHARE SKIP LOCKED clause.
	 */
	forShareSkipLocked(): SelectBuilder;
	/**
	 * Combines this query with another using UNION.
	 * Removes duplicate rows.
	 *
	 * @param query - Another SelectBuilder or SQL string
	 * @returns The SelectBuilder instance for method chaining
	 *
	 * @example
	 * ```typescript
	 * relq('users').select(['email']).where(q => q.equal('active', true))
	 *   .union(relq('admins').select(['email']))
	 * // SQL: SELECT "email" FROM "users" WHERE "active" = true UNION SELECT "email" FROM "admins"
	 * ```
	 */
	union(query: SelectBuilder | string): SelectBuilder;
	/**
	 * Combines this query with another using UNION ALL.
	 * Keeps duplicate rows (faster than UNION).
	 */
	unionAll(query: SelectBuilder | string): SelectBuilder;
	/**
	 * Combines this query with another using INTERSECT.
	 * Returns only rows that appear in both queries.
	 */
	intersect(query: SelectBuilder | string): SelectBuilder;
	/**
	 * Combines this query with another using EXCEPT.
	 * Returns rows from first query that don't appear in second query.
	 */
	except(query: SelectBuilder | string): SelectBuilder;
	/**
	 * Adds FULL OUTER JOIN.
	 */
	fullOuterJoin(table: string, condition: string): SelectBuilder;
	/**
	 * Adds CROSS JOIN.
	 */
	crossJoin(table: string): SelectBuilder;
	/**
	 * Adds LATERAL JOIN.
	 * Allows subquery to reference columns from preceding FROM items.
	 *
	 * @example
	 * ```typescript
	 * relq('users')
	 *   .select(['users.id', 'recent.created_at'])
	 *   .lateralJoin('(SELECT created_at FROM posts WHERE user_id = users.id ORDER BY created_at DESC LIMIT 3) AS recent', true)
	 * ```
	 */
	lateralJoin(subquery: string, left?: boolean): SelectBuilder;
	/**
	 * Add a structured join clause.
	 * Used internally by ConnectedSelectBuilder for type-safe joins.
	 * @internal
	 */
	addStructuredJoin(join: JoinClause): SelectBuilder;
	/**
	 * Get all structured joins.
	 * @internal
	 */
	getStructuredJoins(): JoinClause[];
	/**
	 * Add a computed expression to the SELECT clause.
	 * Used by ConnectedSelectBuilder for `.include()` aggregates.
	 * @internal
	 */
	addIncludeExpression(alias: string, sql: string): SelectBuilder;
	/**
	 * Qualify column names in WHERE conditions with table reference.
	 * Used when joins are present to avoid ambiguous column references.
	 * @internal
	 */
	private qualifyWhereConditions;
	/**
	 * Build SQL for a structured join clause.
	 * @internal
	 */
	private buildStructuredJoinSQL;
	toString(): string;
	/**
	 * Add raw WHERE condition string
	 * Used internally for cursor-based pagination
	 * @internal
	 */
	whereRaw(condition: string): SelectBuilder;
	/**
	 * Generate COUNT query SQL
	 * Used for pagination to get total count
	 */
	toCountSQL(): string;
}
/**
 * Aggregate options for group()
 */
export interface GroupOptions {
	/** Use DISTINCT count on this column */
	distinct?: string;
	/** Use SUM on this column */
	sum?: string;
	/** Use AVG on this column */
	avg?: string;
	/** Use MIN on this column */
	min?: string;
	/** Use MAX on this column */
	max?: string;
}
/**
 * CountBuilder for aggregated counts with multiple named groups
 *
 * @template TTable - Table type for typed conditions (defaults to any)
 *
 * @example
 * ```typescript
 * const counts = await db.table('results').count()
 *     .group('all', q => q.equal('is_deleted', false))
 *     .group('new', q => q.equal('is_read', false).equal('is_deleted', false))
 *     .group('totalSpent', q => q.equal('verified', true), { sum: 'amount' })
 *     .where(q => q.equal('user_id', userId))
 *     .get()
 * // Returns: { all: 150, new: 25, totalSpent: 5000.50 }
 * ```
 */
export declare class CountBuilder<TTable = any> {
	private tableName;
	private countGroups;
	private whereConditions;
	constructor(tableName: string);
	/**
	 * Add a named count group with optional aggregate function
	 *
	 * @param name - Name for this count (becomes key in result object)
	 * @param callback - Condition builder for filtering
	 * @param options - Optional aggregate options (sum, avg, distinct, min, max)
	 *
	 * @example
	 * ```typescript
	 * .group('all', q => q.equal('is_deleted', false))
	 * .group('totalSpent', q => q.equal('verified', true), { sum: 'amount' })
	 * .group('uniqueEmails', q => q.equal('active', true), { distinct: 'email' })
	 * ```
	 */
	group(name: string, callback: (builder: TypedConditionBuilder<TTable>) => TypedConditionBuilder<TTable>, options?: GroupOptions): CountBuilder<TTable>;
	/**
	 * Add base WHERE conditions applied to all groups
	 *
	 * @example
	 * ```typescript
	 * .where(q => q.equal('user_id', userId))
	 * ```
	 */
	where(callback: (builder: TypedConditionBuilder<TTable>) => TypedConditionBuilder<TTable>): CountBuilder<TTable>;
	/**
	 * Build SQL query string
	 */
	toString(): string;
	private buildGroupSQL;
}
/**
 * Combined builder providing access to both array and jsonb update operations.
 *
 * @template T - The column type. Used to infer element types for type-safe operations.
 *   - For `jsonb<UserTag[]>` columns: T = UserTag[], ops.jsonb gets UserTag element type
 *   - For `jsonb<UserTag>().array()` columns: T = UserTag[], ops.array.jsonb gets UserTag element type
 */
export interface UpdateOperationsBuilder<T = unknown> {
	/** PostgreSQL native array operations (text[], integer[], jsonb[], etc.) */
	array: ArrayUpdateBuilder<T extends (infer E)[] ? E : T>;
	/** JSONB column containing array operations (for jsonb<T[]> columns) */
	jsonb: JsonbUpdateBuilder<T>;
}
/**
 * Callback type for update operations - receives combined builder with .array and .jsonb
 */
export type UpdateCallback = (builder: UpdateOperationsBuilder) => string;
/**
 * Update value can be a direct value or a callback for array/jsonb operations
 */
export type UpdateValue = QueryValue | UpdateCallback;
/**
 * Column type info returned by the type resolver
 */
export interface ColumnTypeInfo {
	/** Base PostgreSQL type (e.g., 'jsonb', 'text', 'integer') */
	type: string;
	/** Whether this is a PostgreSQL array type (text[], jsonb[], etc.) */
	isArray: boolean;
}
export declare class UpdateBuilder {
	tableName: string;
	updateData: Record<string, UpdateValue>;
	private whereConditions;
	private returningClause?;
	private _case;
	private _convertCase;
	private columnResolver?;
	private columnTypeResolver?;
	constructor(tableName: string, data: Record<string, UpdateValue>);
	/**
	 * Normalize data by converting undefined values to null.
	 * - { name: 'John' } → stays as { name: 'John' }
	 * - { name: 'John', country: undefined } → becomes { name: 'John', country: null }
	 * @internal
	 */
	private normalizeData;
	/**
	 * Set a column resolver function to transform property names to SQL column names.
	 * @internal Used by ConnectedUpdateBuilder for schema-aware column name mapping.
	 */
	setColumnResolver(resolver: (column: string) => string): UpdateBuilder;
	/**
	 * Set a column type resolver to get type info for proper value formatting.
	 * This allows distinguishing between jsonb (single value) vs jsonb[] (PostgreSQL array).
	 * @internal Used by ConnectedUpdateBuilder for schema-aware value serialization.
	 */
	setColumnTypeResolver(resolver: (column: string) => ColumnTypeInfo | undefined): UpdateBuilder;
	/**
	 * Resolve a column name using the column resolver or fallback to convertColumnName.
	 * @internal
	 */
	private resolveColumnName;
	/**
	 * Transform column names in conditions using the column resolver.
	 * Recursively handles nested or/and conditions.
	 * @internal
	 */
	private transformConditionColumns;
	convertCase(type: "keep-case" | "to-lower" | "to-upper"): UpdateBuilder;
	convertCase(type: "convert-case", conversionCase: ConversionType): UpdateBuilder;
	where(callback: (builder: TypedConditionBuilder<any>) => TypedConditionBuilder<any>): UpdateBuilder;
	/**
	 * RETURNING clause with simple column list
	 *
	 * @example
	 * ```typescript
	 * relq('users')
	 *   .update({ name: 'John' })
	 *   .where(q => q.equal('id', 1))
	 *   .returning(['id', 'name'])
	 * // SQL: UPDATE "users" SET "name" = 'John' WHERE "id" = 1 RETURNING "id", "name"
	 * ```
	 *
	 * @example Conditional RETURNING
	 * ```typescript
	 * relq('users')
	 *   .update({ name: 'John' })
	 *   .where(q => q.equal('id', 1))
	 *   .returning(someCondition ? null : ['id', 'name'])
	 * // If someCondition is true, no RETURNING clause is added
	 * ```
	 */
	returning(columns: string | string[] | null): UpdateBuilder;
	/**
	 * RETURNING clause with SELECT subquery
	 *
	 * @example
	 * ```typescript
	 * relq('users')
	 *   .update({ last_login: new Date() })
	 *   .where(q => q.equal('id', userId))
	 *   .returningSelect(select =>
	 *       select
	 *         .select(['id', 'email', 'last_login'])
	 *         .where(q => q.equal('id', userId))
	 *   )
	 * // SQL: UPDATE "users" SET "last_login" = ...
	 * //      RETURNING (SELECT "id", "email", "last_login" FROM "users" WHERE "id" = ...)
	 * ```
	 */
	returningSelect(callback: (builder: SelectBuilder) => SelectBuilder | null): UpdateBuilder;
	/**
	 * RETURNING clause with COUNT/aggregation subquery using json_build_object
	 *
	 * @example
	 * ```typescript
	 * relq('results')
	 *   .update({ is_read: true })
	 *   .where(q => q.equal('id', resultId))
	 *   .returningCount(count =>
	 *       count
	 *         .group('all', q => q.equal('user_id', userId))
	 *         .group('new', q => q.and(
	 *             b => b.equal('user_id', userId),
	 *             b => b.equal('is_read', false)
	 *         ))
	 *         .group('verified', q => q.and(
	 *             b => b.equal('user_id', userId),
	 *             b => b.equal('verified', true)
	 *         ))
	 *   )
	 * // SQL: UPDATE "results" SET "is_read" = true WHERE "id" = ...
	 * //      RETURNING (
	 * //        SELECT json_build_object(
	 * //          'all', COUNT(*) FILTER (WHERE "user_id" = ...),
	 * //          'new', COUNT(*) FILTER (WHERE "user_id" = ... AND "is_read" = false),
	 * //          'verified', COUNT(*) FILTER (WHERE "user_id" = ... AND "verified" = true)
	 * //        ) FROM "results"
	 * //      )
	 * ```
	 *
	 * @example Conditional RETURNING
	 * ```typescript
	 * relq('results')
	 *   .update({ is_read: true })
	 *   .where(q => q.equal('id', resultId))
	 *   .returningCount(count => someCondition ? null : count.group('total', q => q.equal('user_id', userId)))
	 * // If someCondition is true, no RETURNING clause is added
	 * ```
	 */
	returningCount(callback: (builder: CountBuilder) => CountBuilder | null): UpdateBuilder;
	private convertColumnName;
	/**
	 * Format a JavaScript array as a PostgreSQL array literal.
	 * Used for actual PostgreSQL array columns (text[], integer[], jsonb[], etc.)
	 */
	private formatPostgresArray;
	/**
	 * Format a JavaScript value as a single JSONB value.
	 * Used for jsonb columns that contain arrays or objects.
	 */
	private formatJsonbValue;
	/**
	 * Format an array value using schema type info.
	 * Schema is required for proper handling - defaults to JSONB if no schema.
	 */
	private formatArrayValueWithType;
	toString(): string;
	/**
	 * Parse COUNT columns from SELECT clause
	 * Example: "COUNT(*) FILTER (WHERE ...) AS "all", COUNT(*) AS "new""
	 * Returns: [{ name: 'all', expr: 'COUNT(*) FILTER (WHERE ...)' }, ...]
	 * @private
	 */
	private parseCountColumns;
	/**
	 * Parse a single column expression
	 * Example: 'COUNT(*) FILTER (WHERE ...) AS "name"'
	 * Returns: { name: 'name', expr: 'COUNT(*) FILTER (WHERE ...)' }
	 * @private
	 */
	private parseColumnExpr;
	/**
	 * Build RETURNING clause based on type
	 * @private
	 */
	private buildReturningClause;
}
/**
 * Column reference object returned by table proxy.
 * Contains all metadata needed to build SQL expressions.
 */
export interface ColumnRef<TTable = any, TColumn extends string = string, TType = any> {
	/** Original table name (SQL name) */
	readonly $table: string;
	/** Alias used in query (may differ from $table) */
	readonly $alias: string;
	/** TypeScript property name (camelCase) */
	readonly $column: TColumn;
	/** SQL column name (snake_case) */
	readonly $sqlColumn: string;
	/** Type marker for TypeScript inference (not used at runtime) */
	readonly $type: TType;
}
/**
 * Infer the TypeScript type from a ColumnConfig
 */
export type InferColumnType<T> = T extends ColumnConfig<infer U> ? U : T;
/**
 * Extract column names from a table type.
 * Handles TableDefinition, $inferSelect, and plain interfaces.
 * Priority: $inferSelect > $columns > TableDefinition > plain interface
 */
export type ExtractColumnNames<TTable> = TTable extends {
	$inferSelect: infer TSelect;
} ? keyof TSelect & string : TTable extends {
	$columns: infer TCols;
} ? keyof TCols & string : TTable extends TableDefinition<infer TCols> ? keyof TCols & string : keyof TTable & string;
/**
 * Extract the value type for a column from a table.
 * Priority: $inferSelect > $columns > TableDefinition > plain interface
 */
export type ExtractColumnType<TTable, K extends string> = TTable extends {
	$inferSelect: infer TSelect;
} ? K extends keyof TSelect ? TSelect[K] : any : TTable extends {
	$columns: infer TCols;
} ? K extends keyof TCols ? InferColumnType<TCols[K]> : any : TTable extends TableDefinition<infer TCols> ? K extends keyof TCols ? InferColumnType<TCols[K]> : any : K extends keyof TTable ? TTable[K] : any;
/**
 * TableProxy maps each column of a table to a ColumnRef.
 * Used in join callbacks for type-safe column references.
 *
 * Provides full IDE autocomplete for column names and type safety.
 */
export type TableProxy<TTable> = {
	readonly [K in ExtractColumnNames<TTable>]: ColumnRef<TTable, K, ExtractColumnType<TTable, K>>;
};
/**
 * Check if a type is a symbol (including unique symbols)
 */
export type IsSymbolType<T> = T extends symbol ? true : false;
/**
 * Check if a type has internal marker properties (like DefaultValue or SqlExpression)
 */
export type HasInternalMarkerProps<T> = T extends {
	$isDefault: true;
} ? true : T extends {
	$sql: string;
} ? true : false;
/**
 * Clean a type by removing symbols and internal marker types from unions
 * This is used to sanitize column types that may have internal types bleeding through
 */
export type CleanValueType<T> = T extends any ? IsSymbolType<T> extends true ? never : HasInternalMarkerProps<T> extends true ? never : T : never;
/**
 * Clean all properties of a record type by removing symbols from value types
 */
export type CleanRecordTypes<T> = {
	[K in keyof T]: CleanValueType<T[K]>;
};
type InferColumnType$1<T> = T extends ColumnConfig<infer U> ? CleanValueType<U> : T;
/**
 * Infer table row type from TableDefinition columns
 * Converts { id: ColumnConfig<string>, name: ColumnConfig<string> }
 * to { id: string; name: string }
 */
export type InferTableType<TColumns> = {
	[K in keyof TColumns]: InferColumnType$1<TColumns[K]>;
};
/**
 * Infer schema type from a record of TableDefinitions
 *
 * @example
 * ```typescript
 * const tables = {
 *     users: defineTable('users', { id: uuid(), name: varchar(100) }),
 *     posts: defineTable('posts', { id: uuid(), title: text() })
 * };
 * type Schema = InferSchemaFromTables<typeof tables>;
 * // { users: { id: string; name: string }; posts: { id: string; title: string } }
 * ```
 */
export type InferSchemaFromTables<TTables extends Record<string, TableDefinition<any>>> = {
	[K in keyof TTables]: TTables[K] extends {
		$inferSelect: infer TSelect;
	} ? TSelect : TTables[K] extends TableDefinition<infer Cols> ? InferTableType<Cols> : never;
};
/**
 * Extract table names from schema
 * If schema is 'any', allows any string (backward compatible)
 */
export type TableName<TSchema> = TSchema extends any ? string extends keyof TSchema ? string : keyof TSchema & string : never;
/**
 * Unwrap TableDefinition to get actual data type
 * TableDefinition<T> -> T's inferred select type
 * Plain interface -> use directly
 *
 * Priority order:
 * 1. $inferSelect - most reliable, pre-computed type
 * 2. $columns - direct column extraction
 * 3. Plain interface - use directly
 *
 * Note: We apply CleanRecordTypes to $inferSelect as a safety net
 */
export type UnwrapTableType<TTable> = TTable extends {
	$inferSelect: infer TSelect;
} ? CleanRecordTypes<TSelect> : TTable extends {
	$columns: infer TCols;
} ? TCols extends Record<string, ColumnConfig> ? {
	[K in keyof TCols]: InferColumnType$1<TCols[K]>;
} : TTable : TTable;
/**
 * Extract column names from a table
 * If table is 'any', allows any string (backward compatible)
 * If table is TableDefinition, extracts actual column names (not $name, $schema, etc.)
 */
export type ColumnName<TTable> = TTable extends {
	$inferSelect: infer TSelect;
} ? keyof TSelect & string : TTable extends {
	$columns: infer TCols;
} ? keyof TCols & string : string extends keyof TTable ? string : keyof TTable & string;
/**
 * Valid column name - excludes empty string '' and wildcard '*'
 * Used for type-safe SELECT column validation
 */
export type ValidColumnName<TTable> = Exclude<ColumnName<TTable>, "" | "*">;
/**
 * Column selection input with optional alias
 * Can be: 'column' | ['column', 'alias']
 * Excludes empty strings and wildcards
 */
export type ColumnSelection<TTable> = ValidColumnName<TTable> | readonly [
	ValidColumnName<TTable>,
	string
];
/**
 * Array of column selections (readonly for better inference)
 */
export type ColumnSelections<TTable> = readonly ColumnSelection<TTable>[];
/**
 * Non-empty array of column selections
 * Ensures at least one column is specified
 */
export type NonEmptyColumnSelections<TTable> = readonly [
	ColumnSelection<TTable>,
	...ColumnSelection<TTable>[]
];
/**
 * Get the value type for a specific column in a table
 */
export type ColumnValue<TTable, K extends ColumnName<TTable>> = TTable extends {
	$inferSelect: infer TSelect;
} ? K extends keyof TSelect ? TSelect[K] : any : any;
/**
 * Extract the result key from a column selection
 * 'column' → 'column'
 * ['column', 'alias'] → 'alias'
 */
export type GetResultKey<T> = T extends readonly [
	string,
	infer Alias extends string
] ? Alias : T extends string ? T : never;
/**
 * Extract the source column from a column selection
 * 'column' → 'column'
 * ['column', 'alias'] → 'column'
 */
export type GetSourceColumn<T> = T extends readonly [
	infer Col,
	string
] ? Col : T;
/**
 * Build result type from a single column selection
 */
export type SingleColumnResult<TTable, TCol> = GetSourceColumn<TCol> extends keyof TTable ? {
	[K in GetResultKey<TCol>]: TTable[GetSourceColumn<TCol>];
} : {
	[K in GetResultKey<TCol>]: any;
};
/**
 * Merge multiple result objects into one intersection type
 */
export type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;
/**
 * Build final result type from column selections
 * Automatically unwraps TableDefinition to get actual data type
 *
 * @example
 * ```typescript
 * type User = { id: string; name: string; age: number };
 * type Result = SelectResult<User, ['id', 'name']>;
 * // { id: string; name: string }
 *
 * type AliasedResult = SelectResult<User, [['id', 'user_id'], 'name']>;
 * // { user_id: string; name: string }
 * ```
 */
export type SelectResult<TTable, TColumns extends readonly any[]> = TColumns extends readonly [
] ? UnwrapTableType<TTable> : TColumns extends readonly (infer Col)[] ? UnionToIntersection<SingleColumnResult<UnwrapTableType<TTable>, Col>> : UnwrapTableType<TTable>;
/**
 * Infer insert data type
 * All fields are optional (as they may have defaults) but must match types
 * Automatically unwraps TableDefinition to get actual data type
 */
export type InsertData<TTable> = TTable extends {
	$inferInsert: infer TInsert;
} ? TInsert : TTable extends {
	$columns: any;
} ? Partial<UnwrapTableType<TTable>> : string extends keyof TTable ? Record<string, any> : Partial<TTable>;
/**
 * Require at least one property from a type
 * Prevents empty object {} from being valid
 */
export type AtLeastOne<T> = {
	[K in keyof T]: Pick<T, K> & Partial<Omit<T, K>>;
}[keyof T];
type UpdateCallback$1<TColumn = unknown> = (builder: UpdateOperationsBuilder<TColumn>) => string;
/**
 * Check if a type is an array or JSONB-like object (not a primitive)
 * Only these types should allow update callbacks
 *
 * Note: We explicitly exclude symbols, functions, and internal types
 * to prevent them from being treated as JSONB objects
 */
export type IsArrayOrJsonb<T> = T extends any[] ? true : T extends Date ? false : T extends symbol ? false : T extends (...args: any[]) => any ? false : T extends {
	$isDefault: true;
} ? false : T extends {
	$sql: string;
} ? false : T extends object ? true : false;
/**
 * Allow either direct value OR callback for array/jsonb properties only
 * Scalar fields (string, number, boolean) cannot use callbacks
 *
 * For callback properties, the column type is passed to UpdateOperationsBuilder
 * enabling type-safe key autocomplete and value type-checking.
 */
export type WithUpdateCallbacks<T> = {
	[K in keyof T]: IsArrayOrJsonb<T[K]> extends true ? T[K] | UpdateCallback$1<T[K]> : T[K];
};
/**
 * Infer update data type - requires at least one column
 * Automatically unwraps TableDefinition to get actual data type
 * Allows callback functions for array/jsonb operations
 *
 * Priority order for type extraction:
 * 1. $inferSelect - most reliable indicator of a TableDefinition
 * 2. $columns - direct column access
 * 3. Plain interface - use directly
 */
export type UpdateData<TTable> = TTable extends {
	$inferSelect: infer TSelect;
} ? AtLeastOne<WithUpdateCallbacks<CleanRecordTypes<TSelect>>> : TTable extends {
	$columns: infer TCols;
} ? TCols extends Record<string, ColumnConfig> ? AtLeastOne<WithUpdateCallbacks<{
	[K in keyof TCols]: InferColumnType$1<TCols[K]>;
}>> : Record<string, any> : string extends keyof TTable ? Record<string, any> : AtLeastOne<WithUpdateCallbacks<TTable>>;
/**
 * Check if schema is provided (not 'any')
 */
export type HasSchema<TSchema> = string extends keyof TSchema ? false : true;
/**
 * Make a type more readable in IDE tooltips
 */
export type Prettify<T> = {
	[K in keyof T]: T[K];
} & {};
interface ColumnRef$1 {
	readonly __type: "column_ref";
	readonly table: "EXCLUDED" | string;
	readonly column: string;
}
/**
 * Marker for SQL expression (result of helper functions)
 */
export interface SqlExpression {
	readonly __type: "sql_expression";
	readonly sql: string;
}
/**
 * SQL expression helpers for doUpdate
 * 100% TypeScript - no raw SQL allowed here (use db.raw() for raw queries)
 */
export interface SqlHelpers {
	/**
	 * Increment column by amount: column = column + amount
	 */
	increment(amount: number | bigint): SqlExpression;
	/**
	 * Add two values: a + b
	 */
	add(a: ColumnRef$1 | number | bigint, b: ColumnRef$1 | number | bigint): SqlExpression;
	/**
	 * Subtract: a - b
	 */
	subtract(a: ColumnRef$1 | number | bigint, b: ColumnRef$1 | number | bigint): SqlExpression;
	/**
	 * Multiply: a * b
	 */
	multiply(a: ColumnRef$1 | number | bigint, b: ColumnRef$1 | number | bigint): SqlExpression;
	/**
	 * Divide: a / b
	 */
	divide(a: ColumnRef$1 | number | bigint, b: ColumnRef$1 | number | bigint): SqlExpression;
	/**
	 * Modulo: a % b
	 */
	modulo(a: ColumnRef$1 | number | bigint, b: ColumnRef$1 | number | bigint): SqlExpression;
	/**
	 * COALESCE - return first non-null value
	 */
	coalesce(...values: (ColumnRef$1 | any)[]): SqlExpression;
	/**
	 * GREATEST - return largest value
	 */
	greatest(...values: (ColumnRef$1 | number | bigint)[]): SqlExpression;
	/**
	 * LEAST - return smallest value
	 */
	least(...values: (ColumnRef$1 | number | bigint)[]): SqlExpression;
	/**
	 * NULLIF - return NULL if a equals b
	 */
	nullif(a: ColumnRef$1 | any, b: ColumnRef$1 | any): SqlExpression;
	/**
	 * ABS - absolute value
	 */
	abs(value: ColumnRef$1 | number | bigint): SqlExpression;
	/**
	 * CEIL - ceiling
	 */
	ceil(value: ColumnRef$1 | number): SqlExpression;
	/**
	 * FLOOR - floor
	 */
	floor(value: ColumnRef$1 | number): SqlExpression;
	/**
	 * ROUND - round to nearest integer or decimal places
	 */
	round(value: ColumnRef$1 | number, decimals?: number): SqlExpression;
	/**
	 * CONCAT - concatenate strings
	 */
	concat(...values: (ColumnRef$1 | string)[]): SqlExpression;
	/**
	 * LOWER - lowercase string
	 */
	lower(value: ColumnRef$1 | string): SqlExpression;
	/**
	 * UPPER - uppercase string
	 */
	upper(value: ColumnRef$1 | string): SqlExpression;
	/**
	 * TRIM - remove leading/trailing whitespace
	 */
	trim(value: ColumnRef$1 | string): SqlExpression;
	/**
	 * NOW - current timestamp
	 */
	now(): SqlExpression;
	/**
	 * CURRENT_DATE - current date
	 */
	currentDate(): SqlExpression;
	/**
	 * CURRENT_TIMESTAMP - current timestamp with time zone
	 */
	currentTimestamp(): SqlExpression;
}
type UpdateValue$1<T, TTable> = T | ((excluded: TTable) => any) | ((excluded: TTable, sql: SqlHelpers) => any) | ((excluded: TTable, sql: SqlHelpers, row: TTable) => any);
/**
 * Update data with expression support
 */
export type ConflictUpdateData<TTable> = {
	[K in keyof TTable]?: UpdateValue$1<TTable[K], TTable>;
};
declare class ConflictBuilder<TTable = any> {
	private _action;
	private _updateData;
	private _whereClause?;
	private _tableName;
	constructor(tableName: string);
	/**
	 * DO NOTHING on conflict
	 */
	doNothing(): this;
	/**
	 * DO UPDATE SET ... on conflict
	 */
	doUpdate(values: ConflictUpdateData<TTable>): this;
	/**
	 * Add WHERE clause to the conflict update
	 * Only updates rows that match the condition
	 */
	where(condition: string): this;
	get action(): "nothing" | "update";
	get updateData(): Record<string, any>;
	get whereClause(): string | undefined;
	get tableName(): string;
}
interface ColumnTypeInfo$1 {
	/** Base PostgreSQL type (e.g., 'jsonb', 'text', 'integer') */
	type: string;
	/** Whether this is a PostgreSQL array type (text[], jsonb[], etc.) */
	isArray: boolean;
}
export declare class InsertBuilder {
	tableName: string;
	insertData: Record<string, QueryValue>[];
	private conflictColumns?;
	private conflictBuilder?;
	private returningClause?;
	private _case;
	private _convertCase;
	private originalColumns;
	private columnResolver?;
	private columnTypeResolver?;
	constructor(tableName: string, data: Record<string, QueryValue>);
	/**
	 * Normalize data by converting undefined values to null.
	 * - { name: 'John' } → stays as { name: 'John' }
	 * - { name: 'John', country: undefined } → becomes { name: 'John', country: null }
	 * @internal
	 */
	private normalizeData;
	/**
	 * Set a column resolver function to transform property names to SQL column names.
	 * @internal Used by ConnectedInsertBuilder for schema-aware column name mapping.
	 */
	setColumnResolver(resolver: (column: string) => string): InsertBuilder;
	/**
	 * Set a column type resolver to get type info for proper value formatting.
	 * This allows distinguishing between jsonb (single value) vs jsonb[] (PostgreSQL array).
	 * @internal Used by ConnectedInsertBuilder for schema-aware value serialization.
	 */
	setColumnTypeResolver(resolver: (column: string) => ColumnTypeInfo$1 | undefined): InsertBuilder;
	/**
	 * Resolve a column name using the column resolver or fallback to convertColumnName.
	 * @internal
	 */
	private resolveColumnName;
	convertCase(type: "keep-case" | "to-lower" | "to-upper"): InsertBuilder;
	convertCase(type: "convert-case", conversionCase: ConversionType): InsertBuilder;
	private validateColumns;
	addRow(row: Record<string, QueryValue>): InsertBuilder;
	addRows(rows: Record<string, QueryValue>[]): InsertBuilder;
	clear(): InsertBuilder;
	get total(): number;
	/**
	 * @internal Handle ON CONFLICT - used by ConnectedInsertBuilder
	 * Use .doNothing() or .doUpdate() for type-safe conflict handling
	 */
	_onConflict(columns: string | string[] | null, callback?: (builder: ConflictBuilder) => void): InsertBuilder;
	/**
	 * RETURNING clause with simple column list
	 *
	 * @example Conditional RETURNING
	 * ```typescript
	 * relq('users')
	 *   .insert({ name: 'John' })
	 *   .returning(someCondition ? null : ['id', 'name'])
	 * // If someCondition is true, no RETURNING clause is added
	 * ```
	 */
	returning(columns: string | string[] | null): InsertBuilder;
	/**
	 * RETURNING clause with SELECT subquery
	 */
	returningSelect(callback: (builder: SelectBuilder) => SelectBuilder | null): InsertBuilder;
	/**
	 * RETURNING clause with COUNT/aggregation subquery using json_build_object
	 */
	returningCount(callback: (builder: CountBuilder) => CountBuilder | null): InsertBuilder;
	private convertColumnName;
	/**
	 * Format a JavaScript array as a PostgreSQL array literal.
	 * Used for actual PostgreSQL array columns (text[], integer[], jsonb[], etc.)
	 */
	private formatPostgresArray;
	/**
	 * Format a JavaScript value as a single JSONB value.
	 * Used for jsonb columns that contain arrays or objects.
	 */
	private formatJsonbValue;
	private processRowValues;
	private buildConflictClause;
	toString(): string;
	/**
	 * Parse COUNT columns from SELECT clause
	 * Example: "COUNT(*) FILTER (WHERE ...) AS "all", COUNT(*) AS "new""
	 * Returns: [{ name: 'all', expr: 'COUNT(*) FILTER (WHERE ...)' }, ...]
	 * @private
	 */
	private parseCountColumns;
	/**
	 * Parse a single column expression
	 * Example: 'COUNT(*) FILTER (WHERE ...) AS "name"'
	 * Returns: { name: 'name', expr: 'COUNT(*) FILTER (WHERE ...)' }
	 * @private
	 */
	private parseColumnExpr;
	/**
	 * Build RETURNING clause based on type
	 * @private
	 */
	private buildReturningClause;
}
export declare class DeleteBuilder {
	private tableName;
	private whereConditions;
	private returningClause?;
	private columnResolver?;
	constructor(tableName: string);
	/**
	 * Set a column resolver function to transform property names to SQL column names.
	 * @internal Used by ConnectedDeleteBuilder for schema-aware column name mapping.
	 */
	setColumnResolver(resolver: (column: string) => string): DeleteBuilder;
	/**
	 * Resolve a column name using the column resolver or return as-is.
	 * @internal
	 */
	private resolveColumnName;
	/**
	 * Transform column names in conditions using the column resolver.
	 * Recursively handles nested or/and conditions.
	 * @internal
	 */
	private transformConditionColumns;
	where(callback: (builder: TypedConditionBuilder<any>) => TypedConditionBuilder<any>): DeleteBuilder;
	/**
	 * RETURNING clause with simple column list
	 *
	 * @example Conditional RETURNING
	 * ```typescript
	 * relq('users')
	 *   .delete()
	 *   .where(q => q.equal('id', 1))
	 *   .returning(someCondition ? null : ['id', 'name'])
	 * // If someCondition is true, no RETURNING clause is added
	 * ```
	 */
	returning(columns: string | string[] | null): DeleteBuilder;
	/**
	 * RETURNING clause with SELECT subquery
	 */
	returningSelect(callback: (builder: SelectBuilder) => SelectBuilder | null): DeleteBuilder;
	/**
	 * RETURNING clause with COUNT/aggregation subquery using json_build_object
	 */
	returningCount(callback: (builder: CountBuilder) => CountBuilder | null): DeleteBuilder;
	toString(): string;
	/**
	 * Parse COUNT columns from SELECT clause
	 * Example: "COUNT(*) FILTER (WHERE ...) AS "all", COUNT(*) AS "new""
	 * Returns: [{ name: 'all', expr: 'COUNT(*) FILTER (WHERE ...)' }, ...]
	 * @private
	 */
	private parseCountColumns;
	/**
	 * Parse a single column expression
	 * Example: 'COUNT(*) FILTER (WHERE ...) AS "name"'
	 * Returns: { name: 'name', expr: 'COUNT(*) FILTER (WHERE ...)' }
	 * @private
	 */
	private parseColumnExpr;
	/**
	 * Build RETURNING clause based on type
	 * @private
	 */
	private buildReturningClause;
}
export declare class RawQueryBuilder {
	private query;
	private params;
	constructor(query: string, params?: QueryValue[]);
	toString(): string;
}
/**
 * All PostgreSQL index types
 */
export type IndexType = "BTREE" | "HASH" | "GIN" | "GIST" | "BRIN" | "SPGIST" | "BLOOM";
/**
 * Index column definition with ordering and options
 */
export interface IndexColumnDef {
	column: string;
	order?: "ASC" | "DESC";
	nulls?: "FIRST" | "LAST";
	collation?: string;
	opclass?: string;
}
/**
 * Generic index storage parameters
 */
export interface BaseIndexOptions {
	fillfactor?: number;
	deduplicate_items?: boolean;
}
/**
 * GIN-specific index options
 */
export interface GinIndexOptions extends BaseIndexOptions {
	fastupdate?: boolean;
	gin_pending_list_limit?: number;
}
/**
 * BRIN-specific index options
 */
export interface BrinIndexOptions extends BaseIndexOptions {
	pages_per_range?: number;
	autosummarize?: boolean;
}
/**
 * GiST-specific index options
 */
export interface GistIndexOptions extends BaseIndexOptions {
	buffering?: "on" | "off" | "auto";
}
/**
 * Combined index options
 */
export type IndexOptions = BaseIndexOptions | GinIndexOptions | BrinIndexOptions | GistIndexOptions;
/**
 * Enterprise-grade CREATE INDEX builder supporting all PostgreSQL index types.
 * Provides a fluent API for creating indexes with full control over all PostgreSQL options.
 *
 * **Supported Index Types:**
 * - **BTREE** (default): Best for equality and range queries, supports sorting
 * - **HASH**: Fast equality lookups, no range queries
 * - **GIN** (Generalized Inverted Index): JSONB, arrays, full-text search
 * - **GiST** (Generalized Search Tree): Geometric types, full-text, custom types
 * - **BRIN** (Block Range Index): Very large tables with natural clustering
 * - **SP-GiST** (Space-Partitioned GiST): Non-balanced structures (points, ranges)
 * - **BLOOM**: Space-efficient, probabilistic (requires extension)
 *
 * @example
 * ```typescript
 * // Simple BTREE index
 * relq('users').createIndex('idx_email')
 *   .btree(['email'])
 *   .unique()
 *   .ifNotExists()
 *   .toString();
 * // Result: CREATE UNIQUE INDEX IF NOT EXISTS "idx_email" ON "users" ("email")
 *
 * // Multi-column index with DESC ordering
 * relq('results').createIndex('idx_results_pinned_created_at')
 *   .btree([
 *     { column: 'is_pinned', order: 'DESC' },
 *     { column: 'updated_at', order: 'DESC' }
 *   ])
 *   .toString();
 * // Result: CREATE INDEX "idx_results_pinned_created_at" ON "results" ("is_pinned" DESC, "updated_at" DESC)
 *
 * // GIN index for JSONB with operator class
 * relq('products').createIndex('idx_metadata')
 *   .gin(['metadata'], 'jsonb_path_ops')
 *   .where("status = 'active'")
 *   .concurrently()
 *   .toString();
 * // Result: CREATE INDEX CONCURRENTLY "idx_metadata" ON "products" USING GIN ("metadata" jsonb_path_ops) WHERE status = 'active'
 *
 * // BRIN index for time-series data
 * relq('logs').createIndex('idx_created_at')
 *   .brin(['created_at'], 128)
 *   .toString();
 * // Result: CREATE INDEX "idx_created_at" ON "logs" USING BRIN ("created_at") WITH (pages_per_range = 128)
 *
 * // Expression index
 * relq('users').createIndex('idx_lower_email')
 *   .btree([])
 *   .expression('LOWER(email)')
 *   .toString();
 * // Result: CREATE INDEX "idx_lower_email" ON "users" (LOWER(email))
 * ```
 */
export declare class CreateIndexBuilder {
	private tableName;
	private indexName;
	private indexType?;
	private columns;
	private expressionIndex?;
	private whereClause?;
	private includeColumns;
	private withOptions;
	private concurrentFlag;
	private ifNotExistsFlag;
	private uniqueFlag;
	private tablespaceValue?;
	private operatorClass?;
	/**
	 * Creates a new CreateIndexBuilder instance.
	 * @param tableName The table name to create the index on
	 * @param indexName The name of the index
	 * @internal Use QueryBuilder.createIndex() instead
	 */
	constructor(tableName: string, indexName: string);
	/**
	 * Creates a BTREE index (default type).
	 * Best for equality and range queries on scalar types. Supports ordering.
	 *
	 * @param columns Column definitions (can be strings or objects with ordering)
	 * @returns The CreateIndexBuilder instance for method chaining
	 *
	 * @example
	 * ```typescript
	 * // Simple single column
	 * .btree(['email'])
	 *
	 * // Multiple columns
	 * .btree(['last_name', 'first_name'])
	 *
	 * // With ordering and NULL handling
	 * .btree([
	 *   { column: 'created_at', order: 'DESC', nulls: 'LAST' },
	 *   { column: 'id', order: 'ASC' }
	 * ])
	 *
	 * // With collation
	 * .btree([{ column: 'name', collation: 'en_US' }])
	 * ```
	 */
	btree(columns: (string | IndexColumnDef)[]): CreateIndexBuilder;
	/**
	 * Creates a HASH index.
	 * Optimized for simple equality comparisons. Cannot be used for ordering or range queries.
	 *
	 * @param column Single column name (HASH indexes support only one column)
	 * @returns The CreateIndexBuilder instance for method chaining
	 *
	 * @example
	 * ```typescript
	 * .hash('user_id')
	 * // Result: CREATE INDEX ON table USING HASH ("user_id")
	 * ```
	 */
	hash(column: string): CreateIndexBuilder;
	/**
	 * Creates a GIN (Generalized Inverted Index) index.
	 * Perfect for JSONB, arrays, full-text search, and composite types.
	 *
	 * @param columns Column names to index
	 * @param opClass Optional operator class ('jsonb_ops', 'jsonb_path_ops', 'array_ops', 'tsvector_ops')
	 * @returns The CreateIndexBuilder instance for method chaining
	 *
	 * @example
	 * ```typescript
	 * // JSONB with default operator class
	 * .gin(['metadata'])
	 *
	 * // JSONB with path operator class (optimized for @>, @?, @@)
	 * .gin(['metadata'], 'jsonb_path_ops')
	 *
	 * // Array index
	 * .gin(['tags'], 'array_ops')
	 *
	 * // Full-text search
	 * .gin(['search_vector'], 'tsvector_ops')
	 * ```
	 */
	gin(columns: string[], opClass?: GinOpClass): CreateIndexBuilder;
	/**
	 * Creates a GiST (Generalized Search Tree) index.
	 * Used for geometric types, full-text search, and custom indexable types.
	 *
	 * @param columns Column names to index
	 * @param opClass Optional operator class
	 * @returns The CreateIndexBuilder instance for method chaining
	 *
	 * @example
	 * ```typescript
	 * // Geometric data
	 * .gist(['location'], 'point_ops')
	 *
	 * // IP address ranges
	 * .gist(['ip_range'], 'inet_ops')
	 *
	 * // Full-text search
	 * .gist(['search_vector'], 'tsvector_ops')
	 * ```
	 */
	gist(columns: string[], opClass?: GistOpClass): CreateIndexBuilder;
	/**
	 * Creates a BRIN (Block Range Index) index.
	 * Extremely space-efficient for very large tables with natural ordering (time-series, logs).
	 *
	 * @param columns Column names to index
	 * @param pagesPerRange Number of table pages per BRIN range (default: 128)
	 * @returns The CreateIndexBuilder instance for method chaining
	 *
	 * @example
	 * ```typescript
	 * // Default pages_per_range (128)
	 * .brin(['created_at'])
	 *
	 * // Custom range size for larger tables
	 * .brin(['timestamp'], 256)
	 *
	 * // With autosummarize
	 * .brin(['log_date']).with({ autosummarize: true })
	 * ```
	 */
	brin(columns: string[], pagesPerRange?: number): CreateIndexBuilder;
	/**
	 * Creates a SP-GiST (Space-Partitioned GiST) index.
	 * Designed for non-balanced data structures (quad-trees, k-d trees, radix trees).
	 *
	 * @param columns Column names to index
	 * @returns The CreateIndexBuilder instance for method chaining
	 *
	 * @example
	 * ```typescript
	 * // For phone numbers, IP addresses, or other partitionable data
	 * .spgist(['phone_number'])
	 *
	 * // For geometric points
	 * .spgist(['coordinates'])
	 * ```
	 */
	spgist(columns: string[]): CreateIndexBuilder;
	/**
	 * Creates a BLOOM index (requires bloom extension).
	 * Space-efficient probabilistic index for multi-column equality queries.
	 *
	 * @param columns Column names to index
	 * @param options BLOOM-specific options (length, col1-col5 bit counts)
	 * @returns The CreateIndexBuilder instance for method chaining
	 *
	 * @example
	 * ```typescript
	 * // Basic BLOOM index
	 * .bloom(['col1', 'col2', 'col3'])
	 *
	 * // With custom bit counts
	 * .bloom(['a', 'b', 'c'], { length: 80, col1: 2, col2: 2, col3: 4 })
	 * ```
	 */
	bloom(columns: string[], options?: BloomOptions): CreateIndexBuilder;
	/**
	 * Makes the index UNIQUE, enforcing uniqueness constraint.
	 * @returns The CreateIndexBuilder instance for method chaining
	 */
	unique(): CreateIndexBuilder;
	/**
	 * Creates a partial index with a WHERE clause.
	 * Only indexes rows that match the condition.
	 *
	 * @param condition SQL WHERE condition
	 * @returns The CreateIndexBuilder instance for method chaining
	 *
	 * @example
	 * ```typescript
	 * .where("status = 'active'")
	 * .where("deleted_at IS NULL")
	 * .where("amount > 100 AND currency = 'USD'")
	 * ```
	 */
	where(condition: string): CreateIndexBuilder;
	/**
	 * Alias for where() - creates a partial index.
	 */
	partial(condition: string): CreateIndexBuilder;
	/**
	 * Adds INCLUDE columns (PG11+).
	 * Non-key columns stored in the index for covering index scans.
	 *
	 * @param columns Column names to include
	 * @returns The CreateIndexBuilder instance for method chaining
	 *
	 * @example
	 * ```typescript
	 * .btree(['user_id']).include('email', 'created_at')
	 * // Index-only scans can retrieve email and created_at without table access
	 * ```
	 */
	include(...columns: string[]): CreateIndexBuilder;
	/**
	 * Sets storage parameters using WITH clause.
	 *
	 * @param options Storage parameter object
	 * @returns The CreateIndexBuilder instance for method chaining
	 *
	 * @example
	 * ```typescript
	 * .with({ fillfactor: 90 })
	 * .with({ fastupdate: false, gin_pending_list_limit: 4096 })
	 * ```
	 */
	with(options: IndexOptions): CreateIndexBuilder;
	/**
	 * Creates the index CONCURRENTLY without blocking writes.
	 * Takes longer but doesn't lock the table.
	 *
	 * @returns The CreateIndexBuilder instance for method chaining
	 */
	concurrently(): CreateIndexBuilder;
	/**
	 * Adds IF NOT EXISTS clause to avoid errors if index already exists.
	 * @returns The CreateIndexBuilder instance for method chaining
	 */
	ifNotExists(): CreateIndexBuilder;
	/**
	 * Specifies a tablespace for the index.
	 *
	 * @param name Tablespace name
	 * @returns The CreateIndexBuilder instance for method chaining
	 */
	tablespace(name: string): CreateIndexBuilder;
	/**
	 * Creates an expression index (also called functional index).
	 * Indexes the result of an expression rather than column values.
	 *
	 * @param expr SQL expression to index
	 * @returns The CreateIndexBuilder instance for method chaining
	 *
	 * @example
	 * ```typescript
	 * .expression('LOWER(email)')
	 * .expression('(data->>\'age\')::int')
	 * .expression('EXTRACT(year FROM created_at)')
	 * ```
	 */
	expression(expr: string): CreateIndexBuilder;
	/**
	 * Sets fill factor for the index (percentage of space used per page).
	 *
	 * @param percent Fill factor percentage (10-100)
	 * @returns The CreateIndexBuilder instance for method chaining
	 */
	fillfactor(percent: number): CreateIndexBuilder;
	/**
	 * Normalizes column definitions to IndexColumnDef format.
	 * @private
	 */
	private normalizeColumns;
	/**
	 * Formats a single column definition with ordering and options.
	 * @private
	 */
	private formatColumn;
	/**
	 * Builds the complete CREATE INDEX SQL statement.
	 * @returns The SQL statement string
	 */
	toString(): string;
}
export declare class DropIndexBuilder {
	private indexName;
	private ifExistsFlag;
	private cascadeFlag;
	private concurrentlyFlag;
	constructor(indexName: string);
	ifExists(): DropIndexBuilder;
	cascade(): DropIndexBuilder;
	restrict(): DropIndexBuilder;
	concurrently(): DropIndexBuilder;
	toString(): string;
}
export declare class ReindexBuilder {
	private target;
	private name;
	private concurrentlyFlag;
	private tablespaceValue?;
	private verboseFlag;
	constructor(target: "INDEX" | "TABLE" | "SCHEMA" | "DATABASE" | "SYSTEM", name: string);
	concurrently(): ReindexBuilder;
	tablespace(name: string): ReindexBuilder;
	verbose(): ReindexBuilder;
	toString(): string;
}
/**
 * Enterprise-grade CREATE TABLE builder with full PostgreSQL feature support.
 * Supports columns, constraints, indexes, partitioning, inheritance, and storage options.
 *
 * @example
 * ```typescript
 * // Complete example matching your requirements
 * const table = relq('results').createTable()
 *   .setColumns({
 *     id: 'BIGSERIAL PRIMARY KEY',
 *     user_id: {
 *       type: 'BIGINT',
 *       nullable: false,
 *       references: { table: 'users', column: 'id', onDelete: 'CASCADE' }
 *     },
 *     data: { type: 'JSONB', default: '{}' },
 *     tags: { type: 'TEXT[]', default: 'ARRAY[]::TEXT[]' },
 *     is_pinned: { type: 'BOOLEAN', default: false },
 *     updated_at: { type: 'TIMESTAMPTZ', default: 'NOW()' },
 *     created_at: { type: 'TIMESTAMPTZ', default: 'NOW()' }
 *   })
 *   .partitionBy('LIST', 'user_id')
 *   .addIndex('idx_updated_at', idx => idx.btree(['updated_at']).ifNotExists())
 *   .addIndex('idx_pinned', idx => idx.btree([
 *     { column: 'is_pinned', order: 'DESC' },
 *     { column: 'updated_at', order: 'DESC' }
 *   ]))
 *   .addIndex('idx_data', idx => idx.gin(['data'], 'jsonb_path_ops'))
 *   .addCheck('updated_at >= created_at', 'chk_dates')
 *   .with({ fillfactor: 90 })
 *   .ifNotExists()
 *   .toString();
 * ```
 */
export declare class CreateTableBuilder {
	private tableName;
	private columns;
	private constraintBuilder;
	private partitionBuilder?;
	private indexes;
	private inheritsFrom;
	private withOptions;
	private tablespaceValue?;
	private ifNotExistsFlag;
	private temporaryFlag;
	private unloggedFlag;
	constructor(tableName: string);
	/**
	 * Sets table columns with simple or detailed definitions.
	 *
	 * @param columns Column definitions
	 * @returns The CreateTableBuilder instance for method chaining
	 */
	setColumns(columns: Record<string, string | ColumnDefinition>): CreateTableBuilder;
	/**
	 * Adds a single column to the table.
	 *
	 * @param name Column name
	 * @param definition Column definition
	 * @returns The CreateTableBuilder instance for method chaining
	 */
	addColumn(name: string, definition: string | ColumnDefinition): CreateTableBuilder;
	/**
	 * Adds a PRIMARY KEY constraint.
	 */
	addPrimaryKey(columns: string[], name?: string): CreateTableBuilder;
	/**
	 * Adds a FOREIGN KEY constraint.
	 */
	addForeignKey(config: ForeignKeyConfig): CreateTableBuilder;
	/**
	 * Adds a UNIQUE constraint.
	 */
	addUnique(columns: string[], name?: string): CreateTableBuilder;
	/**
	 * Adds a CHECK constraint.
	 */
	addCheck(condition: string, name?: string): CreateTableBuilder;
	/**
	 * Adds an EXCLUSION constraint.
	 */
	addExclusion(constraint: string, using?: "GIST" | "SPGIST", name?: string): CreateTableBuilder;
	/**
	 * Adds an index to be created with the table.
	 *
	 * @param name Index name
	 * @param callback Function to configure the index
	 * @returns The CreateTableBuilder instance for method chaining
	 *
	 * @example
	 * ```typescript
	 * .addIndex('idx_email', idx => idx.btree(['email']).unique())
	 * .addIndex('idx_metadata', idx => idx.gin(['metadata'], 'jsonb_path_ops'))
	 * ```
	 */
	addIndex(name: string, callback: (builder: CreateIndexBuilder) => CreateIndexBuilder): CreateTableBuilder;
	/**
	 * Sets table partitioning strategy.
	 *
	 * @param strategy Partition strategy (RANGE, LIST, HASH)
	 * @param columns Column(s) to partition by
	 * @returns The CreateTableBuilder instance for method chaining
	 */
	partitionBy(strategy: "RANGE" | "LIST" | "HASH", columns: string | string[]): CreateTableBuilder;
	/**
	 * Sets table inheritance.
	 *
	 * @param parentTables Parent table names
	 * @returns The CreateTableBuilder instance for method chaining
	 */
	inherits(...parentTables: string[]): CreateTableBuilder;
	/**
	 * Sets table storage parameters.
	 *
	 * @param options Storage options
	 * @returns The CreateTableBuilder instance for method chaining
	 */
	with(options: TableOptions): CreateTableBuilder;
	/**
	 * Sets the tablespace for the table.
	 */
	tablespace(name: string): CreateTableBuilder;
	/**
	 * Adds IF NOT EXISTS clause.
	 */
	ifNotExists(): CreateTableBuilder;
	/**
	 * Creates a TEMPORARY table.
	 */
	temporary(): CreateTableBuilder;
	/**
	 * Creates an UNLOGGED table (faster but not crash-safe).
	 */
	unlogged(): CreateTableBuilder;
	/**
	 * Sets fill factor.
	 */
	fillfactor(percent: number): CreateTableBuilder;
	/**
	 * Sets parallel workers.
	 */
	parallelWorkers(count: number): CreateTableBuilder;
	/**
	 * Configures autovacuum settings.
	 */
	autovacuum(enabled: boolean, options?: AutovacuumOptions): CreateTableBuilder;
	/**
	 * Builds column definition SQL.
	 * @private
	 */
	private buildColumnSQL;
	/**
	 * Builds the complete CREATE TABLE SQL statement.
	 *
	 * @returns The SQL statement string
	 */
	toString(): string;
	/**
	 * Returns SQL for creating all indexes defined on this table.
	 * Call this after toString() to get index creation statements.
	 *
	 * @returns Array of CREATE INDEX SQL statements
	 */
	getIndexSQL(): string[];
	/**
	 * Returns complete SQL including table creation and all indexes.
	 *
	 * @returns Object with table SQL and index SQL array
	 */
	toFullSQL(): {
		table: string;
		indexes: string[];
	};
}
export declare class AlterTableBuilder {
	private tableName;
	private actions;
	constructor(tableName: string);
	addColumn(name: string, definition: string | ColumnDefinition, ifNotExists?: boolean): AlterTableBuilder;
	dropColumn(name: string, ifExists?: boolean, cascade?: boolean): AlterTableBuilder;
	renameColumn(oldName: string, newName: string): AlterTableBuilder;
	alterColumnType(name: string, newType: string, using?: string): AlterTableBuilder;
	setColumnDefault(name: string, defaultValue: any): AlterTableBuilder;
	dropColumnDefault(name: string): AlterTableBuilder;
	setColumnNotNull(name: string): AlterTableBuilder;
	dropColumnNotNull(name: string): AlterTableBuilder;
	addConstraint(name: string, constraint: string): AlterTableBuilder;
	dropConstraint(name: string, ifExists?: boolean, cascade?: boolean): AlterTableBuilder;
	renameTo(newName: string): AlterTableBuilder;
	setSchema(schemaName: string): AlterTableBuilder;
	setTablespace(tablespaceName: string): AlterTableBuilder;
	enableTrigger(triggerName: string): AlterTableBuilder;
	disableTrigger(triggerName: string): AlterTableBuilder;
	enableAllTriggers(): AlterTableBuilder;
	disableAllTriggers(): AlterTableBuilder;
	toString(): string;
}
export declare class DropTableBuilder {
	private tableName;
	private ifExistsFlag;
	private cascadeFlag;
	constructor(tableName: string);
	ifExists(): DropTableBuilder;
	cascade(): DropTableBuilder;
	restrict(): DropTableBuilder;
	toString(): string;
}
/**
 * Builder for table partitioning (RANGE, LIST, HASH).
 * Supports creating partitioned parent tables and managing partition children.
 *
 * **Partition Strategies:**
 * - **RANGE**: Partition by value ranges (dates, numbers) - e.g., monthly logs
 * - **LIST**: Partition by discrete value lists - e.g., by country, status
 * - **HASH**: Partition by hash of column - e.g., distribute evenly across partitions
 *
 * @example
 * ```typescript
 * // RANGE partitioning by date
 * const parent = relq('logs').createTable()
 *   .setColumns({ id: 'BIGSERIAL', created_at: 'DATE', data: 'JSONB' })
 *   .partitionBy('RANGE', 'created_at')
 *   .toString();
 *
 * // Create partition for specific range
 * const child = relq.createPartition('logs_2024_01', 'logs')
 *   .forValues('FROM (\'2024-01-01\') TO (\'2024-02-01\')')
 *   .toString();
 *
 * // LIST partitioning by status
 * const parent2 = relq('orders').createTable()
 *   .setColumns({ id: 'BIGSERIAL', status: 'TEXT', amount: 'NUMERIC' })
 *   .partitionBy('LIST', 'status')
 *   .toString();
 *
 * // HASH partitioning by user_id
 * const parent3 = relq('user_events').createTable()
 *   .setColumns({ id: 'BIGSERIAL', user_id: 'BIGINT' })
 *   .partitionBy('HASH', 'user_id')
 *   .toString();
 * ```
 */
export declare class PartitionBuilder {
	private strategy?;
	private columns;
	/**
	 * Sets RANGE partitioning strategy.
	 *
	 * @param columns Column names to partition by (usually 1, can be multiple)
	 * @returns The PartitionBuilder instance for method chaining
	 *
	 * @example
	 * ```typescript
	 * .range('created_at')
	 * .range('year', 'month')  // Multi-column
	 * ```
	 */
	range(...columns: string[]): PartitionBuilder;
	/**
	 * Sets LIST partitioning strategy.
	 *
	 * @param column Column name to partition by (single column only)
	 * @returns The PartitionBuilder instance for method chaining
	 *
	 * @example
	 * ```typescript
	 * .list('status')
	 * .list('country_code')
	 * ```
	 */
	list(column: string): PartitionBuilder;
	/**
	 * Sets HASH partitioning strategy.
	 *
	 * @param column Column name to partition by (single column only)
	 * @returns The PartitionBuilder instance for method chaining
	 *
	 * @example
	 * ```typescript
	 * .hash('user_id')
	 * .hash('customer_id')
	 * ```
	 */
	hash(column: string): PartitionBuilder;
	/**
	 * Gets the partition strategy.
	 * @internal Used by CreateTableBuilder
	 */
	getStrategy(): PartitionStrategy | undefined;
	/**
	 * Gets the partition columns.
	 * @internal Used by CreateTableBuilder
	 */
	getColumns(): string[];
	/**
	 * Builds the PARTITION BY clause.
	 * @internal Used by CreateTableBuilder
	 */
	buildPartitionBySQL(): string;
}
/**
 * Builder for creating partition child tables.
 * Used to create individual partitions of a partitioned table.
 *
 * @example
 * ```typescript
 * // RANGE partition
 * relq.createPartition('logs_2024_01', 'logs')
 *   .forValues('FROM (\'2024-01-01\') TO (\'2024-02-01\')')
 *   .toString();
 * // Result: CREATE TABLE "logs_2024_01" PARTITION OF "logs" FOR VALUES FROM ('2024-01-01') TO ('2024-02-01')
 *
 * // LIST partition
 * relq.createPartition('orders_pending', 'orders')
 *   .forValues('IN (\'pending\', \'processing\')')
 *   .toString();
 * // Result: CREATE TABLE "orders_pending" PARTITION OF "orders" FOR VALUES IN ('pending', 'processing')
 *
 * // HASH partition
 * relq.createPartition('events_0', 'user_events')
 *   .forValues('WITH (MODULUS 4, REMAINDER 0)')
 *   .toString();
 * // Result: CREATE TABLE "events_0" PARTITION OF "user_events" FOR VALUES WITH (MODULUS 4, REMAINDER 0)
 *
 * // With tablespace
 * relq.createPartition('logs_archive_2023', 'logs')
 *   .forValues('FROM (\'2023-01-01\') TO (\'2024-01-01\')')
 *   .tablespace('archive_space')
 *   .toString();
 * ```
 */
export declare class CreatePartitionBuilder {
	private partitionName;
	private parentTable;
	private forValuesClause?;
	private tablespaceValue?;
	private withOptions?;
	/**
	 * Creates a new CreatePartitionBuilder instance.
	 *
	 * @param partitionName Name of the partition table to create
	 * @param parentTable Name of the parent partitioned table
	 */
	constructor(partitionName: string, parentTable: string);
	/**
	 * Sets the FOR VALUES clause defining the partition bounds.
	 *
	 * @param specification Partition bound specification
	 * @returns The CreatePartitionBuilder instance for method chaining
	 *
	 * @example
	 * ```typescript
	 * // RANGE partitions
	 * .forValues('FROM (\'2024-01-01\') TO (\'2024-02-01\')')
	 * .forValues('FROM (0) TO (1000)')
	 * .forValues('FROM (MINVALUE) TO (0)')
	 * .forValues('FROM (1000) TO (MAXVALUE)')
	 *
	 * // LIST partitions
	 * .forValues('IN (\'US\', \'CA\', \'MX\')')
	 * .forValues('IN (\'active\', \'pending\')')
	 *
	 * // HASH partitions
	 * .forValues('WITH (MODULUS 4, REMAINDER 0)')
	 * .forValues('WITH (MODULUS 4, REMAINDER 1)')
	 *
	 * // DEFAULT partition (catches unmatched rows)
	 * .forValues('DEFAULT')
	 * ```
	 */
	forValues(specification: string): CreatePartitionBuilder;
	/**
	 * Sets the tablespace for the partition.
	 *
	 * @param name Tablespace name
	 * @returns The CreatePartitionBuilder instance for method chaining
	 */
	tablespace(name: string): CreatePartitionBuilder;
	/**
	 * Sets storage parameters for the partition.
	 *
	 * @param options Table storage options
	 * @returns The CreatePartitionBuilder instance for method chaining
	 */
	with(options: TableOptions): CreatePartitionBuilder;
	/**
	 * Builds the CREATE TABLE ... PARTITION OF statement.
	 *
	 * @returns The complete SQL statement
	 */
	toString(): string;
}
/**
 * Builder for ATTACH/DETACH partition operations.
 *
 * @example
 * ```typescript
 * // Attach existing table as partition
 * relq.attachPartition('logs', 'old_logs_2023')
 *   .forValues('FROM (\'2023-01-01\') TO (\'2024-01-01\')')
 *   .toString();
 * // Result: ALTER TABLE "logs" ATTACH PARTITION "old_logs_2023" FOR VALUES FROM ('2023-01-01') TO ('2024-01-01')
 *
 * // Detach partition
 * relq.detachPartition('logs', 'logs_2023')
 *   .concurrently()
 *   .toString();
 * // Result: ALTER TABLE "logs" DETACH PARTITION "logs_2023" CONCURRENTLY
 * ```
 */
export declare class AttachPartitionBuilder {
	private parentTable;
	private partitionName;
	private forValuesClause?;
	private concurrentFlag;
	constructor(parentTable: string, partitionName: string);
	/**
	 * Sets the FOR VALUES clause for ATTACH operation.
	 */
	forValues(specification: string): AttachPartitionBuilder;
	/**
	 * Builds the ATTACH PARTITION statement.
	 */
	toString(): string;
}
export declare class DetachPartitionBuilder {
	private parentTable;
	private partitionName;
	private concurrentFlag;
	private finalizeFlag;
	constructor(parentTable: string, partitionName: string);
	/**
	 * Detaches the partition concurrently (PG14+).
	 * Allows reads/writes to continue during detach.
	 */
	concurrently(): DetachPartitionBuilder;
	/**
	 * Finalizes a concurrent detach operation (PG14+).
	 */
	finalize(): DetachPartitionBuilder;
	/**
	 * Builds the DETACH PARTITION statement.
	 */
	toString(): string;
}
/**
 * Enterprise-grade CREATE TRIGGER builder supporting all PostgreSQL trigger features.
 * Provides a fluent API for creating triggers with complete control over timing, events, and conditions.
 *
 * **Trigger Features:**
 * - **Timing**: BEFORE, AFTER, INSTEAD OF
 * - **Events**: INSERT, UPDATE, DELETE, TRUNCATE
 * - **Level**: FOR EACH ROW, FOR EACH STATEMENT
 * - **Conditions**: WHEN clause, UPDATE OF specific columns
 * - **Referencing**: OLD TABLE, NEW TABLE (for transition tables)
 * - **Deferrable**: DEFERRABLE, INITIALLY DEFERRED/IMMEDIATE
 *
 * @example
 * ```typescript
 * // Basic AFTER INSERT trigger
 * relq.createTrigger('audit_insert')
 *   .on('users')
 *   .after('INSERT')
 *   .forEachRow()
 *   .execute('audit_user_changes()')
 *   .toString();
 * // Result: CREATE TRIGGER "audit_insert" AFTER INSERT ON "users" FOR EACH ROW EXECUTE FUNCTION audit_user_changes()
 *
 * // BEFORE UPDATE trigger with condition
 * relq.createTrigger('validate_email')
 *   .on('users')
 *   .before('UPDATE')
 *   .updateOf('email')
 *   .forEachRow()
 *   .when('NEW.email IS DISTINCT FROM OLD.email')
 *   .execute('validate_email_format()')
 *   .toString();
 *
 * // Complex trigger from your example
 * relq.createTrigger('create_user_partition_trigger')
 *   .on('users')
 *   .after('INSERT')
 *   .forEachRow()
 *   .execute('create_user_results_partition()')
 *   .toString();
 * // Result: CREATE TRIGGER "create_user_partition_trigger" AFTER INSERT ON "users" FOR EACH ROW EXECUTE FUNCTION create_user_results_partition()
 * ```
 */
export declare class CreateTriggerBuilder {
	private triggerName;
	private tableName?;
	private timing?;
	private events;
	private level;
	private whenCondition?;
	private functionCall?;
	private functionArgs;
	private updateOfColumns?;
	private referencingOld?;
	private referencingNew?;
	private deferrableFlag?;
	private initiallyValue?;
	private orReplaceFlag;
	/**
	 * Creates a new CreateTriggerBuilder instance.
	 *
	 * @param triggerName The name of the trigger to create
	 */
	constructor(triggerName: string);
	/**
	 * Specifies the table the trigger will be attached to.
	 *
	 * @param tableName The table name
	 * @returns The CreateTriggerBuilder instance for method chaining
	 */
	on(tableName: string): CreateTriggerBuilder;
	/**
	 * Sets the trigger to fire BEFORE the specified events.
	 *
	 * @param events One or more trigger events
	 * @returns The CreateTriggerBuilder instance for method chaining
	 *
	 * @example
	 * ```typescript
	 * .before('INSERT')
	 * .before('INSERT', 'UPDATE')
	 * .before('INSERT', 'UPDATE', 'DELETE')
	 * ```
	 */
	before(...events: TriggerEvent[]): CreateTriggerBuilder;
	/**
	 * Sets the trigger to fire AFTER the specified events.
	 *
	 * @param events One or more trigger events
	 * @returns The CreateTriggerBuilder instance for method chaining
	 *
	 * @example
	 * ```typescript
	 * .after('INSERT')
	 * .after('UPDATE', 'DELETE')
	 * ```
	 */
	after(...events: TriggerEvent[]): CreateTriggerBuilder;
	/**
	 * Sets the trigger to fire INSTEAD OF the specified events.
	 * Only valid on views, not tables.
	 *
	 * @param events One or more trigger events
	 * @returns The CreateTriggerBuilder instance for method chaining
	 *
	 * @example
	 * ```typescript
	 * .insteadOf('INSERT')
	 * .insteadOf('UPDATE', 'DELETE')
	 * ```
	 */
	insteadOf(...events: TriggerEvent[]): CreateTriggerBuilder;
	/**
	 * Sets the trigger to fire FOR EACH ROW (default).
	 * The trigger function is called once for each row affected.
	 *
	 * @returns The CreateTriggerBuilder instance for method chaining
	 */
	forEachRow(): CreateTriggerBuilder;
	/**
	 * Sets the trigger to fire FOR EACH STATEMENT.
	 * The trigger function is called once per statement, regardless of rows affected.
	 *
	 * @returns The CreateTriggerBuilder instance for method chaining
	 */
	forEachStatement(): CreateTriggerBuilder;
	/**
	 * Restricts the trigger to fire only when specific columns are updated.
	 * Only valid with UPDATE events.
	 *
	 * @param columns Column names to watch for updates
	 * @returns The CreateTriggerBuilder instance for method chaining
	 *
	 * @example
	 * ```typescript
	 * .before('UPDATE')
	 * .updateOf('email', 'phone')
	 * // Only fires when email or phone columns are updated
	 * ```
	 */
	updateOf(...columns: string[]): CreateTriggerBuilder;
	/**
	 * Adds a WHEN condition to restrict when the trigger fires.
	 * The condition can reference OLD and NEW row values.
	 *
	 * @param condition SQL boolean expression
	 * @returns The CreateTriggerBuilder instance for method chaining
	 *
	 * @example
	 * ```typescript
	 * .when('NEW.status = \'active\'')
	 * .when('NEW.amount > OLD.amount')
	 * .when('NEW.email IS DISTINCT FROM OLD.email')
	 * ```
	 */
	when(condition: string): CreateTriggerBuilder;
	/**
	 * Specifies REFERENCING clause for transition tables (PG10+).
	 * Allows statement-level triggers to reference OLD TABLE and NEW TABLE.
	 *
	 * @param oldTable Alias for OLD TABLE
	 * @param newTable Alias for NEW TABLE
	 * @returns The CreateTriggerBuilder instance for method chaining
	 *
	 * @example
	 * ```typescript
	 * .after('UPDATE')
	 * .forEachStatement()
	 * .referencing('old_data', 'new_data')
	 * // Can reference old_data and new_data in trigger function
	 * ```
	 */
	referencing(oldTable: string, newTable: string): CreateTriggerBuilder;
	/**
	 * Specifies the function to execute when the trigger fires.
	 *
	 * @param functionName Function name (with optional schema)
	 * @param args Optional arguments to pass to the function
	 * @returns The CreateTriggerBuilder instance for method chaining
	 *
	 * @example
	 * ```typescript
	 * .execute('audit_changes()')
	 * .execute('notify_update', 'users', 'email')
	 * .execute('public.process_order')
	 * ```
	 */
	execute(functionName: string, ...args: any[]): CreateTriggerBuilder;
	/**
	 * Makes the trigger deferrable.
	 * Allows the trigger to be deferred until the end of the transaction.
	 *
	 * @returns The CreateTriggerBuilder instance for method chaining
	 */
	deferrable(): CreateTriggerBuilder;
	/**
	 * Sets the trigger to be initially deferred.
	 * Only valid with deferrable triggers.
	 *
	 * @returns The CreateTriggerBuilder instance for method chaining
	 */
	initiallyDeferred(): CreateTriggerBuilder;
	/**
	 * Sets the trigger to be initially immediate (default).
	 * Only valid with deferrable triggers.
	 *
	 * @returns The CreateTriggerBuilder instance for method chaining
	 */
	initiallyImmediate(): CreateTriggerBuilder;
	/**
	 * Adds OR REPLACE clause to replace existing trigger.
	 * @returns The CreateTriggerBuilder instance for method chaining
	 */
	orReplace(): CreateTriggerBuilder;
	/**
	 * Builds the complete CREATE TRIGGER SQL statement.
	 *
	 * @returns The SQL statement string
	 *
	 * @example
	 * ```typescript
	 * const sql = relq.createTrigger('audit_changes')
	 *   .on('products')
	 *   .after('INSERT', 'UPDATE', 'DELETE')
	 *   .forEachRow()
	 *   .execute('audit_product_changes()')
	 *   .toString();
	 * // Result: CREATE TRIGGER "audit_changes" AFTER INSERT OR UPDATE OR DELETE ON "products" FOR EACH ROW EXECUTE FUNCTION audit_product_changes()
	 * ```
	 */
	toString(): string;
}
/**
 * Builder for DROP TRIGGER statement.
 *
 * @example
 * ```typescript
 * relq.dropTrigger('audit_changes', 'products')
 *   .ifExists()
 *   .cascade()
 *   .toString();
 * // Result: DROP TRIGGER IF EXISTS "audit_changes" ON "products" CASCADE
 * ```
 */
export declare class DropTriggerBuilder {
	private triggerName;
	private tableName;
	private ifExistsFlag;
	private cascadeFlag;
	constructor(triggerName: string, tableName: string);
	/**
	 * Adds IF EXISTS clause to avoid errors if trigger doesn't exist.
	 */
	ifExists(): DropTriggerBuilder;
	/**
	 * Adds CASCADE to automatically drop dependent objects.
	 */
	cascade(): DropTriggerBuilder;
	/**
	 * Adds RESTRICT to prevent dropping if dependent objects exist (default).
	 */
	restrict(): DropTriggerBuilder;
	/**
	 * Builds the DROP TRIGGER statement.
	 */
	toString(): string;
}
/**
 * Enterprise-grade CREATE FUNCTION builder supporting all PostgreSQL function features.
 * Supports PL/pgSQL, SQL, and other procedural languages with complete control over function behavior.
 *
 * **Function Features:**
 * - **Languages**: plpgsql, sql, plpython3u, plperl, c
 * - **Return Types**: scalar, SETOF, TABLE, TRIGGER
 * - **Volatility**: IMMUTABLE, STABLE, VOLATILE
 * - **Security**: DEFINER, INVOKER
 * - **Parallel Safety**: SAFE, UNSAFE, RESTRICTED
 * - **Performance Hints**: COST, ROWS, STRICT, LEAKPROOF
 *
 * @example
 * ```typescript
 * // Simple PL/pgSQL function
 * relq.createFunction('get_user_count')
 *   .returns('INTEGER')
 *   .language('plpgsql')
 *   .body('BEGIN RETURN (SELECT COUNT(*) FROM users); END;')
 *   .toString();
 *
 * // Trigger function from your example
 * relq.createFunction('create_user_results_partition')
 *   .returns('TRIGGER')
 *   .language('plpgsql')
 *   .securityDefiner()
 *   .body(`
 *     DECLARE
 *         partition_name TEXT;
 *     BEGIN
 *         partition_name := NEW.table_name;
 *         EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF results FOR VALUES IN (%L)',
 *                        partition_name, NEW.id);
 *         RETURN NEW;
 *     END;
 *   `)
 *   .orReplace()
 *   .toString();
 *
 * // Function with parameters
 * relq.createFunction('calculate_discount')
 *   .parameter('price', 'NUMERIC')
 *   .parameter('discount_percent', 'NUMERIC', 0)
 *   .returns('NUMERIC')
 *   .language('sql')
 *   .immutable()
 *   .body('SELECT price * (1 - discount_percent / 100.0)')
 *   .toString();
 * ```
 */
export declare class CreateFunctionBuilder {
	private functionName;
	private __parameters;
	private returnType?;
	private __returnsTable?;
	private __returnsSetOf?;
	private __language;
	private functionBody?;
	private volatility;
	private security;
	private __parallel;
	private costValue?;
	private rowsValue?;
	private strictFlag;
	private leakproofFlag;
	private orReplaceFlag;
	/**
	 * Creates a new CreateFunctionBuilder instance.
	 *
	 * @param functionName The name of the function to create
	 */
	constructor(functionName: string);
	/**
	 * Adds a parameter to the function.
	 *
	 * @param name Parameter name
	 * @param type PostgreSQL data type
	 * @param defaultValue Optional default value
	 * @param mode Parameter mode (IN, OUT, INOUT, VARIADIC)
	 * @returns The CreateFunctionBuilder instance for method chaining
	 *
	 * @example
	 * ```typescript
	 * .parameter('user_id', 'BIGINT')
	 * .parameter('email', 'TEXT', 'unknown@example.com')
	 * .parameter('amounts', 'NUMERIC[]', undefined, 'VARIADIC')
	 * ```
	 */
	parameter(name: string, type: string, defaultValue?: any, mode?: "IN" | "OUT" | "INOUT" | "VARIADIC"): CreateFunctionBuilder;
	/**
	 * Adds multiple parameters from an object.
	 *
	 * @param params Object mapping parameter names to types
	 * @returns The CreateFunctionBuilder instance for method chaining
	 *
	 * @example
	 * ```typescript
	 * .parameters({
	 *   user_id: 'BIGINT',
	 *   email: 'TEXT',
	 *   created_at: 'TIMESTAMPTZ'
	 * })
	 * ```
	 */
	parameters(params: Record<string, string>): CreateFunctionBuilder;
	/**
	 * Sets the function return type.
	 *
	 * @param type PostgreSQL data type or TRIGGER
	 * @returns The CreateFunctionBuilder instance for method chaining
	 *
	 * @example
	 * ```typescript
	 * .returns('INTEGER')
	 * .returns('JSONB')
	 * .returns('TRIGGER')
	 * .returns('void')
	 * ```
	 */
	returns(type: string): CreateFunctionBuilder;
	/**
	 * Sets the function to return a table with specified columns.
	 *
	 * @param columns Object mapping column names to types
	 * @returns The CreateFunctionBuilder instance for method chaining
	 *
	 * @example
	 * ```typescript
	 * .returnsTable({
	 *   user_id: 'BIGINT',
	 *   username: 'TEXT',
	 *   email: 'TEXT'
	 * })
	 * ```
	 */
	returnsTable(columns: Record<string, string>): CreateFunctionBuilder;
	/**
	 * Sets the function to return a set of the specified type.
	 *
	 * @param type PostgreSQL data type
	 * @returns The CreateFunctionBuilder instance for method chaining
	 *
	 * @example
	 * ```typescript
	 * .returnsSetOf('users')
	 * .returnsSetOf('INTEGER')
	 * ```
	 */
	returnsSetOf(type: string): CreateFunctionBuilder;
	/**
	 * Sets the procedural language for the function.
	 *
	 * @param lang Language name
	 * @returns The CreateFunctionBuilder instance for method chaining
	 *
	 * @example
	 * ```typescript
	 * .language('plpgsql')
	 * .language('sql')
	 * .language('plpython3u')
	 * ```
	 */
	language(lang: FunctionLanguage): CreateFunctionBuilder;
	/**
	 * Sets the function body (implementation).
	 *
	 * @param sql Function implementation SQL/PL code
	 * @returns The CreateFunctionBuilder instance for method chaining
	 *
	 * @example
	 * ```typescript
	 * .body('BEGIN RETURN (SELECT COUNT(*) FROM users); END;')
	 * .body('SELECT * FROM users WHERE id = user_id')
	 * .body(`
	 *   DECLARE
	 *     result INTEGER;
	 *   BEGIN
	 *     SELECT COUNT(*) INTO result FROM users;
	 *     RETURN result;
	 *   END;
	 * `)
	 * ```
	 */
	body(sql: string): CreateFunctionBuilder;
	/**
	 * Marks the function as IMMUTABLE.
	 * The function always returns the same result for the same arguments.
	 *
	 * @returns The CreateFunctionBuilder instance for method chaining
	 */
	immutable(): CreateFunctionBuilder;
	/**
	 * Marks the function as STABLE.
	 * The function cannot modify the database and returns consistent results within a single scan.
	 *
	 * @returns The CreateFunctionBuilder instance for method chaining
	 */
	stable(): CreateFunctionBuilder;
	/**
	 * Marks the function as VOLATILE (default).
	 * The function can do anything, including modifying the database.
	 *
	 * @returns The CreateFunctionBuilder instance for method chaining
	 */
	volatile(): CreateFunctionBuilder;
	/**
	 * Marks the function as SECURITY DEFINER.
	 * The function executes with privileges of the user who created it.
	 *
	 * @returns The CreateFunctionBuilder instance for method chaining
	 */
	securityDefiner(): CreateFunctionBuilder;
	/**
	 * Marks the function as SECURITY INVOKER (default).
	 * The function executes with privileges of the user who calls it.
	 *
	 * @returns The CreateFunctionBuilder instance for method chaining
	 */
	securityInvoker(): CreateFunctionBuilder;
	/**
	 * Sets the parallel safety level.
	 *
	 * @param safety Parallel safety level
	 * @returns The CreateFunctionBuilder instance for method chaining
	 */
	parallel(safety: FunctionParallel): CreateFunctionBuilder;
	/**
	 * Marks the function as STRICT (RETURNS NULL ON NULL INPUT).
	 * The function returns NULL if any argument is NULL.
	 *
	 * @returns The CreateFunctionBuilder instance for method chaining
	 */
	strict(): CreateFunctionBuilder;
	/**
	 * Marks the function as LEAKPROOF.
	 * The function has no side effects and reveals no information about its arguments.
	 *
	 * @returns The CreateFunctionBuilder instance for method chaining
	 */
	leakproof(): CreateFunctionBuilder;
	/**
	 * Sets the estimated execution cost.
	 *
	 * @param cost Estimated cost (in CPU units)
	 * @returns The CreateFunctionBuilder instance for method chaining
	 */
	cost(estimatedCost: number): CreateFunctionBuilder;
	/**
	 * Sets the estimated number of rows returned (for set-returning functions).
	 *
	 * @param rows Estimated number of rows
	 * @returns The CreateFunctionBuilder instance for method chaining
	 */
	rows(estimatedRows: number): CreateFunctionBuilder;
	/**
	 * Adds OR REPLACE clause to replace existing function.
	 *
	 * @returns The CreateFunctionBuilder instance for method chaining
	 */
	orReplace(): CreateFunctionBuilder;
	/**
	 * Builds the complete CREATE FUNCTION SQL statement.
	 *
	 * @returns The SQL statement string
	 */
	toString(): string;
}
/**
 * Builder for DROP FUNCTION statement.
 *
 * @example
 * ```typescript
 * relq.dropFunction('calculate_discount')
 *   .ifExists()
 *   .cascade()
 *   .toString();
 * // Result: DROP FUNCTION IF EXISTS "calculate_discount" CASCADE
 * ```
 */
export declare class DropFunctionBuilder {
	private functionName;
	private parameterTypes?;
	private ifExistsFlag;
	private cascadeFlag;
	constructor(functionName: string, parameterTypes?: string[]);
	/**
	 * Adds IF EXISTS clause.
	 */
	ifExists(): DropFunctionBuilder;
	/**
	 * Adds CASCADE clause.
	 */
	cascade(): DropFunctionBuilder;
	/**
	 * Builds the DROP FUNCTION statement.
	 */
	toString(): string;
}
export declare class CreateViewBuilder {
	private viewName;
	private query?;
	private materializedFlag;
	private withDataFlag;
	private columnsAlias?;
	private __checkOption?;
	private securityBarrierFlag;
	private orReplaceFlag;
	private ifNotExistsFlag;
	private tablespaceValue?;
	private withOptions;
	constructor(viewName: string);
	as(query: SelectBuilder | string): CreateViewBuilder;
	materialized(): CreateViewBuilder;
	withData(): CreateViewBuilder;
	withNoData(): CreateViewBuilder;
	columns(...names: string[]): CreateViewBuilder;
	checkOption(level: ViewCheckOption): CreateViewBuilder;
	securityBarrier(): CreateViewBuilder;
	orReplace(): CreateViewBuilder;
	ifNotExists(): CreateViewBuilder;
	tablespace(name: string): CreateViewBuilder;
	with(options: Record<string, any>): CreateViewBuilder;
	toString(): string;
}
export declare class DropViewBuilder {
	private viewName;
	private materializedFlag;
	private ifExistsFlag;
	private cascadeFlag;
	constructor(viewName: string, materialized?: boolean);
	ifExists(): DropViewBuilder;
	cascade(): DropViewBuilder;
	restrict(): DropViewBuilder;
	toString(): string;
}
export declare class RefreshMaterializedViewBuilder {
	private viewName;
	private concurrentlyFlag;
	private withDataFlag;
	constructor(viewName: string);
	concurrently(): RefreshMaterializedViewBuilder;
	withData(): RefreshMaterializedViewBuilder;
	withNoData(): RefreshMaterializedViewBuilder;
	toString(): string;
}
export declare class CreateSchemaBuilder {
	private schemaName;
	private ifNotExistsFlag;
	private authorizationUser?;
	constructor(schemaName: string);
	ifNotExists(): CreateSchemaBuilder;
	authorization(user: string): CreateSchemaBuilder;
	toString(): string;
}
export declare class DropSchemaBuilder {
	private schemaName;
	private ifExistsFlag;
	private cascadeFlag;
	constructor(schemaName: string);
	ifExists(): DropSchemaBuilder;
	cascade(): DropSchemaBuilder;
	restrict(): DropSchemaBuilder;
	toString(): string;
}
export type PrivilegeType = "SELECT" | "INSERT" | "UPDATE" | "DELETE" | "TRUNCATE" | "REFERENCES" | "TRIGGER" | "USAGE" | "CREATE" | "CONNECT" | "TEMPORARY" | "TEMP" | "EXECUTE" | "ALL" | "ALL PRIVILEGES";
export type ObjectType = "TABLE" | "SEQUENCE" | "FUNCTION" | "PROCEDURE" | "ROUTINE" | "DATABASE" | "SCHEMA" | "TABLESPACE" | "DOMAIN" | "TYPE" | "FOREIGN DATA WRAPPER" | "FOREIGN SERVER" | "LANGUAGE" | "LARGE OBJECT" | "PARAMETER";
export interface ColumnPrivilege {
	privilege: "SELECT" | "INSERT" | "UPDATE" | "REFERENCES";
	columns: string[];
}
export declare class GrantBuilder {
	private privileges;
	private columnPrivileges;
	private objectType?;
	private objectNames;
	private schemaName?;
	private allInSchema;
	private grantees;
	private withGrantOption;
	private grantedByRole?;
	private isRoleGrant;
	private roleNames;
	private withAdminOption;
	private withInheritOption?;
	private withSetOption?;
	grant(...privileges: (PrivilegeType | string)[]): GrantBuilder;
	select(...columns: string[]): GrantBuilder;
	insert(...columns: string[]): GrantBuilder;
	update(...columns: string[]): GrantBuilder;
	references(...columns: string[]): GrantBuilder;
	all(): GrantBuilder;
	onTable(...tableNames: string[]): GrantBuilder;
	onSequence(...sequenceNames: string[]): GrantBuilder;
	onFunction(...functionSignatures: string[]): GrantBuilder;
	onProcedure(...procedureSignatures: string[]): GrantBuilder;
	onDatabase(...databaseNames: string[]): GrantBuilder;
	onSchema(...schemaNames: string[]): GrantBuilder;
	onTablespace(...tablespaceNames: string[]): GrantBuilder;
	onDomain(...domainNames: string[]): GrantBuilder;
	onType(...typeNames: string[]): GrantBuilder;
	onLanguage(...languageNames: string[]): GrantBuilder;
	onForeignDataWrapper(...fdwNames: string[]): GrantBuilder;
	onForeignServer(...serverNames: string[]): GrantBuilder;
	onLargeObject(...oids: (string | number)[]): GrantBuilder;
	on(objectType: string, ...objectNames: string[]): GrantBuilder;
	onAllTablesInSchema(schemaName: string): GrantBuilder;
	onAllSequencesInSchema(schemaName: string): GrantBuilder;
	onAllFunctionsInSchema(schemaName: string): GrantBuilder;
	onAllProceduresInSchema(schemaName: string): GrantBuilder;
	onAllRoutinesInSchema(schemaName: string): GrantBuilder;
	to(...grantees: string[]): GrantBuilder;
	toPublic(): GrantBuilder;
	toCurrentUser(): GrantBuilder;
	toSessionUser(): GrantBuilder;
	toCurrentRole(): GrantBuilder;
	withGrant(): GrantBuilder;
	grantedBy(role: string): GrantBuilder;
	roles(...roleNames: string[]): GrantBuilder;
	withAdmin(): GrantBuilder;
	withInherit(value?: boolean): GrantBuilder;
	withSet(value?: boolean): GrantBuilder;
	toString(): string;
	private buildRoleGrant;
	private buildPrivilegeGrant;
	private buildPrivilegeList;
	private formatGrantees;
}
export declare class RevokeBuilder {
	private privileges;
	private columnPrivileges;
	private objectType?;
	private objectNames;
	private schemaName?;
	private allInSchema;
	private grantees;
	private cascadeFlag;
	private restrictFlag;
	private grantOptionFor;
	private adminOptionFor;
	private inheritOptionFor;
	private setOptionFor;
	private grantedByRole?;
	private isRoleRevoke;
	private roleNames;
	revoke(...privileges: (PrivilegeType | string)[]): RevokeBuilder;
	select(...columns: string[]): RevokeBuilder;
	insert(...columns: string[]): RevokeBuilder;
	update(...columns: string[]): RevokeBuilder;
	references(...columns: string[]): RevokeBuilder;
	all(): RevokeBuilder;
	onTable(...tableNames: string[]): RevokeBuilder;
	onSequence(...sequenceNames: string[]): RevokeBuilder;
	onFunction(...functionSignatures: string[]): RevokeBuilder;
	onProcedure(...procedureSignatures: string[]): RevokeBuilder;
	onDatabase(...databaseNames: string[]): RevokeBuilder;
	onSchema(...schemaNames: string[]): RevokeBuilder;
	onTablespace(...tablespaceNames: string[]): RevokeBuilder;
	onDomain(...domainNames: string[]): RevokeBuilder;
	onType(...typeNames: string[]): RevokeBuilder;
	onLanguage(...languageNames: string[]): RevokeBuilder;
	onForeignDataWrapper(...fdwNames: string[]): RevokeBuilder;
	onForeignServer(...serverNames: string[]): RevokeBuilder;
	onLargeObject(...oids: (string | number)[]): RevokeBuilder;
	on(objectType: string, ...objectNames: string[]): RevokeBuilder;
	onAllTablesInSchema(schemaName: string): RevokeBuilder;
	onAllSequencesInSchema(schemaName: string): RevokeBuilder;
	onAllFunctionsInSchema(schemaName: string): RevokeBuilder;
	onAllProceduresInSchema(schemaName: string): RevokeBuilder;
	onAllRoutinesInSchema(schemaName: string): RevokeBuilder;
	from(...grantees: string[]): RevokeBuilder;
	fromPublic(): RevokeBuilder;
	fromCurrentUser(): RevokeBuilder;
	fromSessionUser(): RevokeBuilder;
	fromCurrentRole(): RevokeBuilder;
	cascade(): RevokeBuilder;
	restrict(): RevokeBuilder;
	grantOption(): RevokeBuilder;
	adminOption(): RevokeBuilder;
	inheritOption(): RevokeBuilder;
	setOption(): RevokeBuilder;
	grantedBy(role: string): RevokeBuilder;
	roles(...roleNames: string[]): RevokeBuilder;
	toString(): string;
	private buildRoleRevoke;
	private buildPrivilegeRevoke;
	private buildPrivilegeList;
	private formatGrantees;
}
export interface RoleOptions {
	superuser?: boolean;
	createdb?: boolean;
	createrole?: boolean;
	inherit?: boolean;
	login?: boolean;
	replication?: boolean;
	bypassRls?: boolean;
	connectionLimit?: number;
	password?: string | null;
	validUntil?: string;
	inRole?: string[];
	role?: string[];
	admin?: string[];
}
export declare class CreateRoleBuilder {
	private roleName;
	private ifNotExistsFlag;
	private options;
	constructor(roleName: string);
	ifNotExists(): CreateRoleBuilder;
	superuser(value?: boolean): CreateRoleBuilder;
	createdb(value?: boolean): CreateRoleBuilder;
	createrole(value?: boolean): CreateRoleBuilder;
	inherit(value?: boolean): CreateRoleBuilder;
	login(value?: boolean): CreateRoleBuilder;
	replication(value?: boolean): CreateRoleBuilder;
	bypassRls(value?: boolean): CreateRoleBuilder;
	connectionLimit(limit: number): CreateRoleBuilder;
	password(pwd: string | null): CreateRoleBuilder;
	validUntil(timestamp: string): CreateRoleBuilder;
	inRole(...roles: string[]): CreateRoleBuilder;
	role(...roles: string[]): CreateRoleBuilder;
	admin(...roles: string[]): CreateRoleBuilder;
	toString(): string;
	private buildOptions;
}
export declare class AlterRoleBuilder {
	private roleName;
	private options;
	private renameToValue?;
	private setConfig;
	private resetConfig;
	private inDatabaseName?;
	constructor(roleName: string);
	superuser(value?: boolean): AlterRoleBuilder;
	createdb(value?: boolean): AlterRoleBuilder;
	createrole(value?: boolean): AlterRoleBuilder;
	inherit(value?: boolean): AlterRoleBuilder;
	login(value?: boolean): AlterRoleBuilder;
	replication(value?: boolean): AlterRoleBuilder;
	bypassRls(value?: boolean): AlterRoleBuilder;
	connectionLimit(limit: number): AlterRoleBuilder;
	password(pwd: string | null): AlterRoleBuilder;
	validUntil(timestamp: string): AlterRoleBuilder;
	renameTo(newName: string): AlterRoleBuilder;
	set(parameter: string, value: string): AlterRoleBuilder;
	setDefault(parameter: string): AlterRoleBuilder;
	reset(parameter: string): AlterRoleBuilder;
	resetAll(): AlterRoleBuilder;
	inDatabase(database: string): AlterRoleBuilder;
	toString(): string;
	private buildOptions;
}
export declare class DropRoleBuilder {
	private roleNames;
	private ifExistsFlag;
	constructor(roleNames: string | string[]);
	ifExists(): DropRoleBuilder;
	toString(): string;
}
export declare class SetRoleBuilder {
	private roleName?;
	private resetFlag;
	private localFlag;
	private sessionFlag;
	role(name: string): SetRoleBuilder;
	none(): SetRoleBuilder;
	reset(): SetRoleBuilder;
	local(): SetRoleBuilder;
	session(): SetRoleBuilder;
	toString(): string;
}
export declare class ReassignOwnedBuilder {
	private oldRoles;
	private newRole?;
	by(...roles: string[]): ReassignOwnedBuilder;
	to(role: string): ReassignOwnedBuilder;
	toString(): string;
}
export declare class DropOwnedBuilder {
	private roles;
	private cascadeFlag;
	private restrictFlag;
	by(...roles: string[]): DropOwnedBuilder;
	cascade(): DropOwnedBuilder;
	restrict(): DropOwnedBuilder;
	toString(): string;
}
export declare class DefaultPrivilegesBuilder {
	private forRoles;
	private inSchemas;
	private isGrant;
	private privileges;
	private targetType?;
	private grantees;
	private withGrantOption;
	private cascadeFlag;
	forRole(...roles: string[]): DefaultPrivilegesBuilder;
	inSchema(...schemas: string[]): DefaultPrivilegesBuilder;
	grant(...privileges: string[]): DefaultPrivilegesBuilder;
	revoke(...privileges: string[]): DefaultPrivilegesBuilder;
	onTables(): DefaultPrivilegesBuilder;
	onSequences(): DefaultPrivilegesBuilder;
	onFunctions(): DefaultPrivilegesBuilder;
	onRoutines(): DefaultPrivilegesBuilder;
	onTypes(): DefaultPrivilegesBuilder;
	onSchemas(): DefaultPrivilegesBuilder;
	to(...grantees: string[]): DefaultPrivilegesBuilder;
	from(...grantees: string[]): DefaultPrivilegesBuilder;
	withGrant(): DefaultPrivilegesBuilder;
	cascade(): DefaultPrivilegesBuilder;
	toString(): string;
	private formatGrantees;
}
export declare class TransactionBuilder {
	private isolationLevel?;
	private mode?;
	private __deferrable?;
	isolation(level: IsolationLevel): TransactionBuilder;
	readWrite(): TransactionBuilder;
	readOnly(): TransactionBuilder;
	deferrable(): TransactionBuilder;
	notDeferrable(): TransactionBuilder;
	begin(): string;
	commit(): string;
	rollback(): string;
	toString(): string;
}
export declare class SavepointBuilder {
	private savepointName;
	constructor(savepointName: string);
	create(): string;
	rollback(): string;
	release(): string;
	toString(): string;
}
export declare class CTEBuilder {
	private ctes;
	private recursiveFlag;
	with(name: string, query: SelectBuilder | string, columns?: string[]): CTEBuilder;
	withRecursive(name: string, query: string, columns?: string[]): CTEBuilder;
	withMaterialized(name: string, query: SelectBuilder | string, columns?: string[]): CTEBuilder;
	withNotMaterialized(name: string, query: SelectBuilder | string, columns?: string[]): CTEBuilder;
	select(columns?: string | string[]): SelectBuilder;
	insert(tableName: string, data: Record<string, any>): InsertBuilder;
	update(tableName: string, data: Record<string, any>): UpdateBuilder;
	delete(tableName: string): DeleteBuilder;
	buildCTEClause(): string;
	toString(mainQuery: string): string;
}
export declare class WindowBuilder {
	private partitionColumns;
	private orderColumns;
	private frameStart?;
	private frameEnd?;
	private frameMode?;
	partitionBy(...columns: string[]): WindowBuilder;
	orderBy(column: string, direction?: "ASC" | "DESC"): WindowBuilder;
	rows(start: string | number, end?: string | number): WindowBuilder;
	range(start: string | number, end?: string | number): WindowBuilder;
	groups(start: string | number, end?: string | number): WindowBuilder;
	toString(): string;
	rowNumber(): string;
	rank(): string;
	denseRank(): string;
	lag(column: string, offset?: number, defaultValue?: any): string;
	lead(column: string, offset?: number, defaultValue?: any): string;
	firstValue(column: string): string;
	lastValue(column: string): string;
	nthValue(column: string, n: number): string;
}
/**
 * TRUNCATE TABLE builder for PostgreSQL.
 * Provides fast deletion of all rows in a table with options for cascading and identity column reset.
 *
 * **Features:**
 * - Single or multiple table truncation
 * - CASCADE/RESTRICT options
 * - RESTART/CONTINUE IDENTITY for identity columns
 * - Transaction-safe or non-transactional modes
 *
 * @example
 * ```typescript
 * // Basic truncate
 * relq('users').truncate().toString();
 * // TRUNCATE TABLE "users"
 *
 * // Truncate with CASCADE
 * relq('users').truncate().cascade().toString();
 * // TRUNCATE TABLE "users" CASCADE
 *
 * // Truncate multiple tables
 * relq.truncate(['users', 'posts', 'comments']).restartIdentity().cascade().toString();
 * // TRUNCATE TABLE "users", "posts", "comments" RESTART IDENTITY CASCADE
 *
 * // Only if empty (will fail if table has data)
 * relq('logs').truncate().onlyIfEmpty().toString();
 * // TRUNCATE TABLE "logs" ONLY
 * ```
 */
export declare class TruncateBuilder {
	private tables;
	private cascadeFlag;
	private restrictFlag;
	private restartIdentityFlag;
	private continueIdentityFlag;
	private onlyFlag;
	/**
	 * Creates a new TruncateBuilder instance.
	 * @param tables Table name(s) to truncate
	 */
	constructor(tables: string | string[]);
	/**
	 * Adds CASCADE option.
	 * Automatically truncates tables that have foreign-key references to any of the named tables.
	 *
	 * @returns The TruncateBuilder instance for method chaining
	 *
	 * @example
	 * ```typescript
	 * relq('users').truncate().cascade()
	 * // TRUNCATE TABLE "users" CASCADE
	 * ```
	 */
	cascade(): TruncateBuilder;
	/**
	 * Adds RESTRICT option (default behavior).
	 * Refuses to truncate if any tables have foreign-key references from tables not listed.
	 *
	 * @returns The TruncateBuilder instance for method chaining
	 *
	 * @example
	 * ```typescript
	 * relq('users').truncate().restrict()
	 * // TRUNCATE TABLE "users" RESTRICT
	 * ```
	 */
	restrict(): TruncateBuilder;
	/**
	 * Adds RESTART IDENTITY option.
	 * Automatically restarts sequences owned by columns of the truncated table(s).
	 *
	 * @returns The TruncateBuilder instance for method chaining
	 *
	 * @example
	 * ```typescript
	 * relq('users').truncate().restartIdentity()
	 * // TRUNCATE TABLE "users" RESTART IDENTITY
	 * ```
	 */
	restartIdentity(): TruncateBuilder;
	/**
	 * Adds CONTINUE IDENTITY option (default behavior).
	 * Does not change the values of sequences.
	 *
	 * @returns The TruncateBuilder instance for method chaining
	 *
	 * @example
	 * ```typescript
	 * relq('users').truncate().continueIdentity()
	 * // TRUNCATE TABLE "users" CONTINUE IDENTITY
	 * ```
	 */
	continueIdentity(): TruncateBuilder;
	/**
	 * Adds ONLY keyword.
	 * Only the named table is truncated; child tables are not affected.
	 *
	 * @returns The TruncateBuilder instance for method chaining
	 *
	 * @example
	 * ```typescript
	 * relq('parent_table').truncate().only()
	 * // TRUNCATE TABLE ONLY "parent_table"
	 * ```
	 */
	only(): TruncateBuilder;
	/**
	 * Alias for only() method.
	 * Only truncates the specified table, not any child tables.
	 *
	 * @returns The TruncateBuilder instance for method chaining
	 */
	onlyIfEmpty(): TruncateBuilder;
	/**
	 * Adds additional table(s) to truncate.
	 *
	 * @param tables Additional table name(s)
	 * @returns The TruncateBuilder instance for method chaining
	 *
	 * @example
	 * ```typescript
	 * relq('users').truncate().addTable('posts').addTable('comments')
	 * // TRUNCATE TABLE "users", "posts", "comments"
	 * ```
	 */
	addTable(...tables: string[]): TruncateBuilder;
	/**
	 * Builds the complete TRUNCATE TABLE SQL statement.
	 *
	 * @returns The SQL statement string
	 *
	 * @example
	 * ```typescript
	 * relq('logs').truncate().restartIdentity().cascade().toString()
	 * // TRUNCATE TABLE "logs" RESTART IDENTITY CASCADE
	 * ```
	 */
	toString(): string;
}
/**
 * Sequence options for CREATE SEQUENCE and ALTER SEQUENCE.
 */
export interface SequenceOptions {
	/** Starting value of the sequence */
	start?: number;
	/** Increment value (can be negative for descending sequences) */
	increment?: number;
	/** Minimum value (defaults to 1 for ascending, MINVALUE of data type for descending) */
	minValue?: number;
	/** Maximum value (defaults to MAXVALUE of data type for ascending, -1 for descending) */
	maxValue?: number;
	/** Number of sequence numbers to preallocate and store in memory (default 1) */
	cache?: number;
	/** Whether the sequence cycles when reaching minValue or maxValue */
	cycle?: boolean;
	/** Owner table.column for DROP CASCADE behavior */
	ownedBy?: string;
	/** Data type: SMALLINT, INTEGER, BIGINT (default BIGINT) */
	as?: "SMALLINT" | "INTEGER" | "BIGINT";
}
/**
 * CREATE SEQUENCE builder for PostgreSQL.
 * Creates a new sequence generator for generating unique numeric identifiers.
 *
 * **Use Cases:**
 * - Custom ID generation
 * - Order numbers, invoice numbers
 * - Distributed ID generation
 * - Multi-tenant applications
 *
 * @example
 * ```typescript
 * // Basic sequence
 * relq.createSequence('user_id_seq').toString();
 * // CREATE SEQUENCE "user_id_seq"
 *
 * // Custom sequence with options
 * relq.createSequence('invoice_seq')
 *   .start(1000)
 *   .increment(1)
 *   .cache(20)
 *   .toString();
 * // CREATE SEQUENCE "invoice_seq" START WITH 1000 INCREMENT BY 1 CACHE 20
 *
 * // Descending sequence
 * relq.createSequence('countdown_seq')
 *   .start(100)
 *   .increment(-1)
 *   .minValue(1)
 *   .cycle()
 *   .toString();
 * // CREATE SEQUENCE "countdown_seq" START WITH 100 INCREMENT BY -1 MINVALUE 1 CYCLE
 * ```
 */
export declare class CreateSequenceBuilder {
	private sequenceName;
	private options;
	private ifNotExistsFlag;
	private temporaryFlag;
	private unloggedFlag;
	constructor(sequenceName: string);
	/**
	 * Adds IF NOT EXISTS clause.
	 * @returns The CreateSequenceBuilder instance for method chaining
	 */
	ifNotExists(): CreateSequenceBuilder;
	/**
	 * Creates a temporary sequence.
	 * The sequence is automatically dropped at the end of the session.
	 *
	 * @returns The CreateSequenceBuilder instance for method chaining
	 */
	temporary(): CreateSequenceBuilder;
	/**
	 * Creates an unlogged sequence (slightly faster, but not crash-safe).
	 * @returns The CreateSequenceBuilder instance for method chaining
	 */
	unlogged(): CreateSequenceBuilder;
	/**
	 * Sets the data type for the sequence values.
	 *
	 * @param type SMALLINT, INTEGER, or BIGINT
	 * @returns The CreateSequenceBuilder instance for method chaining
	 *
	 * @example
	 * ```typescript
	 * relq.createSequence('small_seq').as('SMALLINT')
	 * // CREATE SEQUENCE "small_seq" AS SMALLINT
	 * ```
	 */
	as(type: "SMALLINT" | "INTEGER" | "BIGINT"): CreateSequenceBuilder;
	/**
	 * Sets the starting value of the sequence.
	 *
	 * @param value Starting value (default 1 for ascending, -1 for descending)
	 * @returns The CreateSequenceBuilder instance for method chaining
	 */
	start(value: number): CreateSequenceBuilder;
	/**
	 * Sets the increment value.
	 *
	 * @param value Increment (positive for ascending, negative for descending)
	 * @returns The CreateSequenceBuilder instance for method chaining
	 */
	increment(value: number): CreateSequenceBuilder;
	/**
	 * Sets the minimum value.
	 *
	 * @param value Minimum value
	 * @returns The CreateSequenceBuilder instance for method chaining
	 */
	minValue(value: number): CreateSequenceBuilder;
	/**
	 * Sets the maximum value.
	 *
	 * @param value Maximum value
	 * @returns The CreateSequenceBuilder instance for method chaining
	 */
	maxValue(value: number): CreateSequenceBuilder;
	/**
	 * Removes the minimum value restriction.
	 * @returns The CreateSequenceBuilder instance for method chaining
	 */
	noMinValue(): CreateSequenceBuilder;
	/**
	 * Removes the maximum value restriction.
	 * @returns The CreateSequenceBuilder instance for method chaining
	 */
	noMaxValue(): CreateSequenceBuilder;
	/**
	 * Sets how many sequence numbers are preallocated in memory.
	 *
	 * @param count Number of values to cache (default 1)
	 * @returns The CreateSequenceBuilder instance for method chaining
	 */
	cache(count: number): CreateSequenceBuilder;
	/**
	 * Enables cycling: sequence wraps around when reaching max/min value.
	 * @returns The CreateSequenceBuilder instance for method chaining
	 */
	cycle(): CreateSequenceBuilder;
	/**
	 * Disables cycling: sequence returns error when reaching max/min value.
	 * @returns The CreateSequenceBuilder instance for method chaining
	 */
	noCycle(): CreateSequenceBuilder;
	/**
	 * Sets the owner of the sequence.
	 * If the owning table/column is dropped, the sequence is also dropped.
	 *
	 * @param tableColumn Table and column name (e.g., 'users.id')
	 * @returns The CreateSequenceBuilder instance for method chaining
	 *
	 * @example
	 * ```typescript
	 * relq.createSequence('user_id_seq').ownedBy('users.id')
	 * // CREATE SEQUENCE "user_id_seq" OWNED BY users.id
	 * ```
	 */
	ownedBy(tableColumn: string): CreateSequenceBuilder;
	/**
	 * Removes ownership from the sequence.
	 * @returns The CreateSequenceBuilder instance for method chaining
	 */
	ownedByNone(): CreateSequenceBuilder;
	toString(): string;
}
/**
 * ALTER SEQUENCE builder for PostgreSQL.
 * Modifies parameters of an existing sequence.
 *
 * @example
 * ```typescript
 * // Change increment
 * relq.alterSequence('user_id_seq').increment(5).toString();
 * // ALTER SEQUENCE "user_id_seq" INCREMENT BY 5
 *
 * // Restart sequence
 * relq.alterSequence('invoice_seq').restart(2000).toString();
 * // ALTER SEQUENCE "invoice_seq" RESTART WITH 2000
 *
 * // Multiple changes
 * relq.alterSequence('order_seq')
 *   .increment(10)
 *   .cache(50)
 *   .cycle()
 *   .toString();
 * // ALTER SEQUENCE "order_seq" INCREMENT BY 10 CACHE 50 CYCLE
 * ```
 */
export declare class AlterSequenceBuilder {
	private sequenceName;
	private options;
	private ifExistsFlag;
	constructor(sequenceName: string);
	/**
	 * Adds IF EXISTS clause.
	 * @returns The AlterSequenceBuilder instance for method chaining
	 */
	ifExists(): AlterSequenceBuilder;
	/**
	 * Restarts the sequence at the specified value.
	 *
	 * @param value Value to restart at (omit to restart at START value)
	 * @returns The AlterSequenceBuilder instance for method chaining
	 *
	 * @example
	 * ```typescript
	 * relq.alterSequence('user_id_seq').restart(5000)
	 * // ALTER SEQUENCE "user_id_seq" RESTART WITH 5000
	 * ```
	 */
	restart(value?: number): AlterSequenceBuilder;
	as(type: "SMALLINT" | "INTEGER" | "BIGINT"): AlterSequenceBuilder;
	start(value: number): AlterSequenceBuilder;
	increment(value: number): AlterSequenceBuilder;
	minValue(value: number): AlterSequenceBuilder;
	maxValue(value: number): AlterSequenceBuilder;
	noMinValue(): AlterSequenceBuilder;
	noMaxValue(): AlterSequenceBuilder;
	cache(count: number): AlterSequenceBuilder;
	cycle(): AlterSequenceBuilder;
	noCycle(): AlterSequenceBuilder;
	ownedBy(tableColumn: string): AlterSequenceBuilder;
	ownedByNone(): AlterSequenceBuilder;
	toString(): string;
}
/**
 * DROP SEQUENCE builder for PostgreSQL.
 *
 * @example
 * ```typescript
 * relq.dropSequence('user_id_seq').toString();
 * // DROP SEQUENCE "user_id_seq"
 *
 * relq.dropSequence('invoice_seq').ifExists().cascade().toString();
 * // DROP SEQUENCE IF EXISTS "invoice_seq" CASCADE
 * ```
 */
export declare class DropSequenceBuilder {
	private sequenceNames;
	private ifExistsFlag;
	private cascadeFlag;
	private restrictFlag;
	constructor(sequenceNames: string | string[]);
	ifExists(): DropSequenceBuilder;
	cascade(): DropSequenceBuilder;
	restrict(): DropSequenceBuilder;
	toString(): string;
}
/**
 * EXPLAIN options for query analysis.
 */
export interface ExplainOptions {
	/** Show actual execution times and row counts (requires running the query) */
	analyze?: boolean;
	/** Show verbose output with additional details */
	verbose?: boolean;
	/** Show costs estimate for each plan node */
	costs?: boolean;
	/** Show settings that affect query planning */
	settings?: boolean;
	/** Show buffer usage statistics (requires ANALYZE) */
	buffers?: boolean;
	/** Show timing information for each node (requires ANALYZE) */
	timing?: boolean;
	/** Show summary information (query planning/execution time) */
	summary?: boolean;
	/** Output format: text, xml, json, yaml */
	format?: "TEXT" | "XML" | "JSON" | "YAML";
	/** Show worker details in parallel queries */
	wal?: boolean;
}
/**
 * EXPLAIN builder for PostgreSQL query analysis.
 * Displays the execution plan chosen by the PostgreSQL query planner.
 *
 * **Use Cases:**
 * - Query optimization and performance tuning
 * - Index usage analysis
 * - Understanding query execution
 * - Identifying slow queries
 * - Debugging query performance issues
 *
 * @example
 * ```typescript
 * // Basic explain
 * relq('users').select(['*']).explain().toString();
 * // EXPLAIN SELECT * FROM "users"
 *
 * // Explain with analyze (actually runs the query)
 * relq('orders')
 *   .select(['id', 'total'])
 *   .where(q => q.greaterThan('total', 100))
 *   .explain({ analyze: true })
 *   .toString();
 * // EXPLAIN (ANALYZE) SELECT id, total FROM "orders" WHERE "total" > 100
 *
 * // Detailed analysis with JSON output
 * relq('products')
 *   .select(['id', 'name'])
 *   .join('categories', 'products.category_id = categories.id')
 *   .explain({
 *     analyze: true,
 *     verbose: true,
 *     buffers: true,
 *     format: 'JSON'
 *   })
 *   .toString();
 * // EXPLAIN (ANALYZE, VERBOSE, BUFFERS, FORMAT JSON) SELECT ...
 * ```
 */
export declare class ExplainBuilder {
	private query;
	private options;
	/**
	 * Creates a new ExplainBuilder instance.
	 * @param query The SQL query to explain
	 * @param options EXPLAIN options
	 */
	constructor(query: string, options?: ExplainOptions);
	/**
	 * Enables ANALYZE mode.
	 * Actually runs the query and shows real execution times and row counts.
	 *
	 * @param enable Enable analyze (default true)
	 * @returns The ExplainBuilder instance for method chaining
	 *
	 * @example
	 * ```typescript
	 * explainBuilder.analyze()
	 * // EXPLAIN (ANALYZE) ...
	 * ```
	 */
	analyze(enable?: boolean): ExplainBuilder;
	/**
	 * Enables VERBOSE mode.
	 * Shows additional information about the query plan.
	 *
	 * @param enable Enable verbose (default true)
	 * @returns The ExplainBuilder instance for method chaining
	 */
	verbose(enable?: boolean): ExplainBuilder;
	/**
	 * Controls cost display.
	 *
	 * @param enable Show costs (default true)
	 * @returns The ExplainBuilder instance for method chaining
	 */
	costs(enable?: boolean): ExplainBuilder;
	/**
	 * Shows relevant settings.
	 *
	 * @param enable Show settings (default true)
	 * @returns The ExplainBuilder instance for method chaining
	 */
	settings(enable?: boolean): ExplainBuilder;
	/**
	 * Shows buffer usage statistics (requires ANALYZE).
	 *
	 * @param enable Show buffers (default true)
	 * @returns The ExplainBuilder instance for method chaining
	 */
	buffers(enable?: boolean): ExplainBuilder;
	/**
	 * Shows timing information (requires ANALYZE).
	 *
	 * @param enable Show timing (default true)
	 * @returns The ExplainBuilder instance for method chaining
	 */
	timing(enable?: boolean): ExplainBuilder;
	/**
	 * Shows summary information.
	 *
	 * @param enable Show summary (default true)
	 * @returns The ExplainBuilder instance for method chaining
	 */
	summary(enable?: boolean): ExplainBuilder;
	/**
	 * Shows WAL (Write-Ahead Log) records information (requires ANALYZE).
	 *
	 * @param enable Show WAL info (default true)
	 * @returns The ExplainBuilder instance for method chaining
	 */
	wal(enable?: boolean): ExplainBuilder;
	/**
	 * Sets the output format.
	 *
	 * @param format Output format (TEXT, XML, JSON, YAML)
	 * @returns The ExplainBuilder instance for method chaining
	 *
	 * @example
	 * ```typescript
	 * explainBuilder.format('JSON')
	 * // EXPLAIN (FORMAT JSON) ...
	 * ```
	 */
	format(format: "TEXT" | "XML" | "JSON" | "YAML"): ExplainBuilder;
	/**
	 * Builds the complete EXPLAIN SQL statement.
	 *
	 * @returns The SQL statement string
	 */
	toString(): string;
}
/**
 * LISTEN builder for PostgreSQL pub/sub.
 * Registers the current session to listen for notifications on a channel.
 *
 * **Use Cases:**
 * - Real-time updates
 * - Event-driven architecture
 * - Inter-process communication
 * - Cache invalidation
 * - WebSocket broadcasting
 *
 * @example
 * ```typescript
 * // Listen to a channel
 * relq.listen('user_updates').toString();
 * // LISTEN "user_updates"
 *
 * // In your application
 * await db.raw('LISTEN user_updates').execute();
 * // Now you can receive notifications on this channel
 * ```
 */
export declare class ListenBuilder {
	private channelName;
	/**
	 * Creates a new ListenBuilder instance.
	 * @param channelName Channel name to listen on
	 */
	constructor(channelName: string);
	/**
	 * Builds the LISTEN SQL statement.
	 * @returns The SQL statement string
	 */
	toString(): string;
}
/**
 * UNLISTEN builder for PostgreSQL pub/sub.
 * Stops listening for notifications on a channel.
 *
 * @example
 * ```typescript
 * // Stop listening to specific channel
 * relq.unlisten('user_updates').toString();
 * // UNLISTEN "user_updates"
 *
 * // Stop listening to all channels
 * relq.unlisten('*').toString();
 * // UNLISTEN *
 * ```
 */
export declare class UnlistenBuilder {
	private channelName;
	/**
	 * Creates a new UnlistenBuilder instance.
	 * @param channelName Channel name to unlisten (use '*' for all channels)
	 */
	constructor(channelName?: string | "*");
	/**
	 * Unlistens from all channels.
	 * @returns The UnlistenBuilder instance for method chaining
	 */
	all(): UnlistenBuilder;
	/**
	 * Builds the UNLISTEN SQL statement.
	 * @returns The SQL statement string
	 */
	toString(): string;
}
/**
 * NOTIFY builder for PostgreSQL pub/sub.
 * Sends a notification to all sessions listening on a channel.
 *
 * @example
 * ```typescript
 * // Simple notification
 * relq.notify('user_updates').toString();
 * // NOTIFY "user_updates"
 *
 * // Notification with payload
 * relq.notify('user_updates', { userId: 123, action: 'created' }).toString();
 * // NOTIFY "user_updates", '{"userId":123,"action":"created"}'
 *
 * // String payload
 * relq.notify('cache_invalidate', 'users:123').toString();
 * // NOTIFY "cache_invalidate", 'users:123'
 * ```
 */
export declare class NotifyBuilder {
	private channelName;
	private payload?;
	/**
	 * Creates a new NotifyBuilder instance.
	 * @param channelName Channel name to notify
	 * @param payload Optional payload (string or object, max 8000 bytes)
	 */
	constructor(channelName: string, payload?: string | object);
	/**
	 * Sets the notification payload.
	 *
	 * @param payload Payload data (string or object, max 8000 bytes)
	 * @returns The NotifyBuilder instance for method chaining
	 *
	 * @example
	 * ```typescript
	 * relq.notify('events').payload({ type: 'user_login', userId: 456 })
	 * // NOTIFY "events", '{"type":"user_login","userId":456}'
	 * ```
	 */
	withPayload(payload: string | object): NotifyBuilder;
	/**
	 * Builds the NOTIFY SQL statement.
	 * @returns The SQL statement string
	 */
	toString(): string;
}
/**
 * Helper class for managing LISTEN/NOTIFY in Relq client.
 * Provides methods to listen, unlisten, and notify on channels.
 *
 * @example
 * ```typescript
 * // In your Relq client integration:
 * const db = new Relq({ database: 'mydb' });
 *
 * // Listen to channel
 * await db.listen('user_updates', (payload) => {
 *   console.log('Received:', payload);
 * });
 *
 * // Notify channel
 * await db.notify('user_updates', { userId: 123, action: 'created' });
 *
 * // Unlisten
 * await db.unlisten('user_updates');
 * ```
 */
export interface ListenNotifyManager {
	/**
	 * Listens to a channel and registers a callback for notifications.
	 *
	 * @param channel Channel name
	 * @param callback Function to call when notification is received
	 */
	listen(channel: string, callback: (payload?: string) => void): Promise<void>;
	/**
	 * Stops listening to a channel.
	 *
	 * @param channel Channel name (omit or use '*' for all channels)
	 */
	unlisten(channel?: string): Promise<void>;
	/**
	 * Sends a notification to a channel.
	 *
	 * @param channel Channel name
	 * @param payload Optional payload
	 */
	notify(channel: string, payload?: string | object): Promise<void>;
	/**
	 * Stops listening to all channels and cleans up.
	 */
	close(): Promise<void>;
}
/**
 * VACUUM options for table maintenance.
 */
export interface VacuumOptions {
	/** Perform a full vacuum (more thorough but slower) */
	full?: boolean;
	/** Freeze row versions to prevent transaction ID wraparound */
	freeze?: boolean;
	/** Show verbose progress information */
	verbose?: boolean;
	/** Also run ANALYZE after vacuuming */
	analyze?: boolean;
	/** Disable automatic index cleanup (for specific tables) */
	disablePageSkipping?: boolean;
	/** Skip pages that cannot be locked immediately */
	skipLocked?: boolean;
	/** Update visibility map aggressively */
	indexCleanup?: boolean | "AUTO" | "ON" | "OFF";
	/** Truncate empty pages at the end of table */
	truncate?: boolean;
	/** Parallel workers for vacuum (PG13+) */
	parallel?: number;
}
/**
 * VACUUM builder for PostgreSQL table maintenance.
 * Reclaims storage occupied by dead tuples and updates statistics.
 *
 * **Use Cases:**
 * - Regular table maintenance
 * - Reclaim disk space after bulk deletes/updates
 * - Prevent transaction ID wraparound
 * - Update planner statistics
 * - Improve query performance
 *
 * @example
 * ```typescript
 * // Basic vacuum
 * relq.vacuum().toString();
 * // VACUUM
 *
 * // Vacuum specific table
 * relq.vacuum('users').toString();
 * // VACUUM "users"
 *
 * // Vacuum with analyze
 * relq.vacuum('orders').analyze().toString();
 * // VACUUM ANALYZE "orders"
 *
 * // Full vacuum (reclaims all space)
 * relq.vacuum('logs').full().verbose().toString();
 * // VACUUM FULL VERBOSE "logs"
 *
 * // Vacuum multiple tables
 * relq.vacuum(['users', 'orders', 'products']).toString();
 * // VACUUM "users", "orders", "products"
 * ```
 */
export declare class VacuumBuilder {
	private tables;
	private columns;
	private options;
	/**
	 * Creates a new VacuumBuilder instance.
	 * @param tables Optional table name(s) to vacuum (vacuum all if omitted)
	 */
	constructor(tables?: string | string[]);
	/**
	 * Adds FULL option.
	 * Performs a more aggressive vacuum that reclaims more space but takes longer and locks tables.
	 *
	 * @param enable Enable full vacuum (default true)
	 * @returns The VacuumBuilder instance for method chaining
	 */
	full(enable?: boolean): VacuumBuilder;
	/**
	 * Adds FREEZE option.
	 * Aggressively freezes tuples to prevent transaction ID wraparound.
	 *
	 * @param enable Enable freeze (default true)
	 * @returns The VacuumBuilder instance for method chaining
	 */
	freeze(enable?: boolean): VacuumBuilder;
	/**
	 * Adds VERBOSE option.
	 * Shows detailed vacuum activity information.
	 *
	 * @param enable Enable verbose (default true)
	 * @returns The VacuumBuilder instance for method chaining
	 */
	verbose(enable?: boolean): VacuumBuilder;
	/**
	 * Adds ANALYZE option.
	 * Updates statistics used by the query planner.
	 *
	 * @param enable Enable analyze (default true)
	 * @returns The VacuumBuilder instance for method chaining
	 */
	analyze(enable?: boolean): VacuumBuilder;
	/**
	 * Adds DISABLE_PAGE_SKIPPING option.
	 * Disables page-skipping behavior for this vacuum operation.
	 *
	 * @param enable Enable disable page skipping (default true)
	 * @returns The VacuumBuilder instance for method chaining
	 */
	disablePageSkipping(enable?: boolean): VacuumBuilder;
	/**
	 * Adds SKIP_LOCKED option.
	 * Skips tables that cannot be immediately locked.
	 *
	 * @param enable Enable skip locked (default true)
	 * @returns The VacuumBuilder instance for method chaining
	 */
	skipLocked(enable?: boolean): VacuumBuilder;
	/**
	 * Sets INDEX_CLEANUP option.
	 * Controls whether to perform index cleanup.
	 *
	 * @param value AUTO, ON, OFF, or boolean
	 * @returns The VacuumBuilder instance for method chaining
	 */
	indexCleanup(value?: boolean | "AUTO" | "ON" | "OFF"): VacuumBuilder;
	/**
	 * Sets TRUNCATE option.
	 * Controls whether to truncate empty pages at end of table.
	 *
	 * @param enable Enable truncate (default true)
	 * @returns The VacuumBuilder instance for method chaining
	 */
	truncate(enable?: boolean): VacuumBuilder;
	/**
	 * Sets PARALLEL option (PostgreSQL 13+).
	 * Number of parallel workers to use.
	 *
	 * @param workers Number of parallel workers
	 * @returns The VacuumBuilder instance for method chaining
	 */
	parallel(workers: number): VacuumBuilder;
	/**
	 * Specifies columns to vacuum for a table (used with ANALYZE).
	 *
	 * @param table Table name
	 * @param columns Column names
	 * @returns The VacuumBuilder instance for method chaining
	 *
	 * @example
	 * ```typescript
	 * relq.vacuum('users').columns('users', ['email', 'created_at']).analyze()
	 * // VACUUM ANALYZE "users" (email, created_at)
	 * ```
	 */
	columnsFor(table: string, columns: string[]): VacuumBuilder;
	toString(): string;
}
/**
 * ANALYZE builder for PostgreSQL statistics update.
 * Updates statistics used by the query planner without vacuuming.
 *
 * @example
 * ```typescript
 * // Analyze all tables
 * relq.analyze().toString();
 * // ANALYZE
 *
 * // Analyze specific table
 * relq.analyze('orders').toString();
 * // ANALYZE "orders"
 *
 * // Analyze specific columns
 * relq.analyze('users').columns(['email', 'created_at']).toString();
 * // ANALYZE "users" (email, created_at)
 *
 * // Verbose analyze
 * relq.analyze('products').verbose().toString();
 * // ANALYZE VERBOSE "products"
 * ```
 */
export declare class AnalyzeBuilder {
	private tables;
	private columnsMap;
	private verboseFlag;
	private skipLockedFlag;
	/**
	 * Creates a new AnalyzeBuilder instance.
	 * @param tables Optional table name(s) to analyze
	 */
	constructor(tables?: string | string[]);
	/**
	 * Adds VERBOSE option.
	 * @param enable Enable verbose (default true)
	 * @returns The AnalyzeBuilder instance for method chaining
	 */
	verbose(enable?: boolean): AnalyzeBuilder;
	/**
	 * Adds SKIP_LOCKED option.
	 * @param enable Enable skip locked (default true)
	 * @returns The AnalyzeBuilder instance for method chaining
	 */
	skipLocked(enable?: boolean): AnalyzeBuilder;
	/**
	 * Specifies columns to analyze for the first table.
	 *
	 * @param columns Column names
	 * @returns The AnalyzeBuilder instance for method chaining
	 */
	columns(columns: string[]): AnalyzeBuilder;
	/**
	 * Specifies columns to analyze for a specific table.
	 *
	 * @param table Table name
	 * @param columns Column names
	 * @returns The AnalyzeBuilder instance for method chaining
	 */
	columnsFor(table: string, columns: string[]): AnalyzeBuilder;
	toString(): string;
}
export type CopyFormat = "TEXT" | "CSV" | "BINARY";
export type CopyDirection = "TO" | "FROM";
export interface CopyOptions {
	format?: CopyFormat;
	freeze?: boolean;
	delimiter?: string;
	null?: string;
	default?: string;
	header?: boolean | "MATCH";
	quote?: string;
	escape?: string;
	forceQuote?: string[] | "*";
	forceNotNull?: string[];
	forceNull?: string[];
	encoding?: string;
	onError?: "stop" | "ignore";
	logVerbosity?: "default" | "verbose";
}
export declare class CopyToBuilder {
	private tableName?;
	private queryString?;
	private columns;
	private destination;
	private options;
	constructor(source?: string);
	table(tableName: string): CopyToBuilder;
	query(sql: string): CopyToBuilder;
	only(...columnNames: string[]): CopyToBuilder;
	toStdout(): CopyToBuilder;
	toFile(filename: string): CopyToBuilder;
	toProgram(command: string): CopyToBuilder;
	csv(): CopyToBuilder;
	binary(): CopyToBuilder;
	text(): CopyToBuilder;
	withFormat(fmt: CopyFormat): CopyToBuilder;
	withHeader(value?: boolean | "MATCH"): CopyToBuilder;
	withDelimiter(delimiter: string): CopyToBuilder;
	withNull(nullString: string): CopyToBuilder;
	withQuote(quoteChar: string): CopyToBuilder;
	withEscape(escapeChar: string): CopyToBuilder;
	withEncoding(encoding: string): CopyToBuilder;
	forceQuote(columns: string[] | "*"): CopyToBuilder;
	toString(): string;
	private buildOptions;
}
export declare class CopyFromBuilder {
	private tableName;
	private columns;
	private source;
	private options;
	private whereClause?;
	constructor(tableName: string);
	only(...columnNames: string[]): CopyFromBuilder;
	fromStdin(): CopyFromBuilder;
	fromFile(filename: string): CopyFromBuilder;
	fromProgram(command: string): CopyFromBuilder;
	csv(): CopyFromBuilder;
	binary(): CopyFromBuilder;
	text(): CopyFromBuilder;
	withFormat(fmt: CopyFormat): CopyFromBuilder;
	withHeader(value?: boolean | "MATCH"): CopyFromBuilder;
	withDelimiter(delimiter: string): CopyFromBuilder;
	withNull(nullString: string): CopyFromBuilder;
	withDefault(defaultString: string): CopyFromBuilder;
	withQuote(quoteChar: string): CopyFromBuilder;
	withEscape(escapeChar: string): CopyFromBuilder;
	withEncoding(encoding: string): CopyFromBuilder;
	freeze(value?: boolean): CopyFromBuilder;
	forceNotNull(columns: string[]): CopyFromBuilder;
	forceNull(columns: string[]): CopyFromBuilder;
	onError(action: "stop" | "ignore"): CopyFromBuilder;
	logVerbosity(level: "default" | "verbose"): CopyFromBuilder;
	where(condition: string): CopyFromBuilder;
	toString(): string;
	private buildOptions;
}
/**
 * Type-safe SELECT builder wrapper
 * Provides column autocomplete and result type inference when TTable is provided
 */
export declare class TypedSelectBuilder<TTable = any, TColumns extends readonly any[] = any[]> {
	private builder;
	constructor(builder: SelectBuilder);
	/**
	 * Add WHERE clause with optional type-safe conditions
	 */
	where(callback: (builder: TypedConditionBuilder<TTable>) => any): this;
	/**
	 * Add ORDER BY clause
	 */
	orderBy(column: ColumnName<TTable>, direction?: "ASC" | "DESC"): this;
	orderAsc(column: ColumnName<TTable>): this;
	orderDesc(column: ColumnName<TTable>): this;
	limit(count: number): this;
	offset(count: number): this;
	groupBy(...columns: ColumnName<TTable>[]): this;
	having(callback: (builder: TypedConditionBuilder<TTable>) => any): this;
	distinct(): this;
	distinctOn(...columns: ColumnName<TTable>[]): this;
	join(table: string, condition: string): this;
	leftJoin(table: string, condition: string): this;
	rightJoin(table: string, condition: string): this;
	innerJoin(table: string, condition: string): this;
	forUpdate(): this;
	forUpdateNoWait(): this;
	forUpdateSkipLocked(): this;
	forShare(): this;
	union(query: TypedSelectBuilder<any, any> | SelectBuilder | string): this;
	unionAll(query: TypedSelectBuilder<any, any> | SelectBuilder | string): this;
	intersect(query: TypedSelectBuilder<any, any> | SelectBuilder | string): this;
	except(query: TypedSelectBuilder<any, any> | SelectBuilder | string): this;
	/**
	 * Build SQL string
	 */
	toString(): string;
	/**
	 * Get the underlying SelectBuilder for advanced usage
	 */
	getBuilder(): SelectBuilder;
}
/**
 * Extract insert type directly from TableDefinition or use InsertData fallback
 * This helps TypeScript eagerly evaluate the type for better autocomplete
 */
export type ExtractInsertType<T> = T extends {
	$inferInsert: infer I;
} ? I : InsertData<T>;
/**
 * Type-safe INSERT builder wrapper
 */
export declare class TypedInsertBuilder<TTable = any> {
	private builder;
	constructor(builder: InsertBuilder);
	/**
	 * Add another row to insert
	 * Enforces required fields based on schema (notNull/primaryKey without defaults)
	 */
	addRow(row: ExtractInsertType<TTable>): this;
	/**
	 * Add multiple rows to insert
	 * Enforces required fields based on schema (notNull/primaryKey without defaults)
	 */
	addRows(rows: ExtractInsertType<TTable>[]): this;
	/**
	 * Clear all rows
	 */
	clear(): this;
	/**
	 * Get total number of rows to insert
	 */
	get total(): number;
	/**
	 * @internal Used by doNothing/doUpdate methods
	 */
	_onConflict(columns: ColumnName<TTable> | ColumnName<TTable>[], callback: (builder: ConflictBuilder<TTable extends {
		$inferSelect: infer S;
	} ? S : TTable>) => void): this;
	returning<TColumns extends readonly ColumnName<TTable>[]>(columns: TColumns): this;
	toString(): string;
	getBuilder(): InsertBuilder;
}
/**
 * Type-safe UPDATE builder wrapper
 */
export declare class TypedUpdateBuilder<TTable = any> {
	private builder;
	constructor(builder: UpdateBuilder);
	where(callback: (builder: TypedConditionBuilder<TTable>) => any): this;
	returning<TColumns extends readonly ColumnName<TTable>[]>(columns: TColumns): this;
	toString(): string;
	getBuilder(): UpdateBuilder;
}
/**
 * Type-safe DELETE builder wrapper
 */
export declare class TypedDeleteBuilder<TTable = any> {
	private builder;
	constructor(builder: DeleteBuilder);
	where(callback: (builder: TypedConditionBuilder<TTable>) => any): this;
	returning<TColumns extends readonly ColumnName<TTable>[]>(columns: TColumns): this;
	toString(): string;
	getBuilder(): DeleteBuilder;
}
/**
 * Type-safe COUNT builder wrapper
 */
export declare class TypedCountBuilder<TTable = any> {
	private builder;
	constructor(builder: CountBuilder);
	where(callback: (builder: TypedConditionBuilder<TTable>) => any): this;
	toString(): string;
	getBuilder(): CountBuilder;
}
/**
 * Main QueryBuilder class with optional type safety
 *
 * @template TTable - Table schema type for column validation
 */
export declare class QueryBuilder<TTable = any> {
	private tableName;
	constructor(tableName: string);
	/**
	 * Creates a SELECT query
	 * When TTable is provided, columns are validated against the schema
	 *
	 * @example
	 * ```typescript
	 * // SELECT all
	 * relq<User>('users').select()
	 *
	 * // SELECT specific columns with autocomplete
	 * relq<User>('users').select(['id', 'name'])
	 *
	 * // SELECT with aliases
	 * relq<User>('users').select([['id', 'user_id'], 'name'])
	 * ```
	 */
	select(): TypedSelectBuilder<TTable, [
	]>;
	select<TColumns extends readonly ColumnSelection<TTable>[]>(columns: TColumns): TypedSelectBuilder<TTable, TColumns>;
	select(column: ColumnName<TTable>): TypedSelectBuilder<TTable, [
		string
	]>;
	/**
	 * Creates an INSERT query with type-safe data validation
	 *
	 * @example
	 * ```typescript
	 * relq<User>('users').insert({ name: 'John', age: 25 })
	 * // Error: relq<User>('users').insert({ name: 'John', age: '25' })
	 * ```
	 */
	insert(data: InsertData<TTable>): TypedInsertBuilder<TTable>;
	/**
	 * Creates an UPDATE query with type-safe data validation
	 */
	update(data: UpdateData<TTable>): TypedUpdateBuilder<TTable>;
	/**
	 * Creates a DELETE query
	 */
	delete(): TypedDeleteBuilder<TTable>;
	/**
	 * Creates a COUNT query
	 */
	count(): TypedCountBuilder<TTable>;
	createTable(): CreateTableBuilder;
	alterTable(): AlterTableBuilder;
	dropTable(): DropTableBuilder;
	createIndex(indexName: string): CreateIndexBuilder;
	dropIndex(indexName: string): DropIndexBuilder;
	reindex(): ReindexBuilder;
	raw(query: string, ...params: QueryValue[]): RawQueryBuilder;
	sql(query: string, ...params: QueryValue[]): RawQueryBuilder;
	/**
	 * Creates a TRUNCATE builder for fast table deletion.
	 */
	truncate(): TruncateBuilder;
	/**
	 * Creates a VACUUM builder for table maintenance.
	 */
	vacuum(): VacuumBuilder;
	/**
	 * Creates an ANALYZE builder for statistics update.
	 */
	analyze(): AnalyzeBuilder;
	/**
	 * Creates a COPY TO builder for exporting table data.
	 */
	copyTo(): CopyToBuilder;
	/**
	 * Creates a COPY FROM builder for importing data.
	 */
	copyFrom(): CopyFromBuilder;
	static raw(query: string, ...params: QueryValue[]): RawQueryBuilder;
	static sql(query: string, ...params: QueryValue[]): RawQueryBuilder;
	static bulkInsert(tableName: string, columns: string[], values: QueryValue[][]): RawQueryBuilder;
	static bulkUpdate(tableName: string, updates: Record<string, QueryValue>[], keyColumn: string): RawQueryBuilder;
	static createTrigger(triggerName: string): CreateTriggerBuilder;
	static dropTrigger(triggerName: string, tableName: string): DropTriggerBuilder;
	static createFunction(functionName: string): CreateFunctionBuilder;
	static dropFunction(functionName: string, parameterTypes?: string[]): DropFunctionBuilder;
	static createPartition(partitionName: string, parentTable: string): CreatePartitionBuilder;
	static attachPartition(parentTable: string, partitionName: string): AttachPartitionBuilder;
	static detachPartition(parentTable: string, partitionName: string): DetachPartitionBuilder;
	static createView(viewName: string): CreateViewBuilder;
	static dropView(viewName: string, materialized?: boolean): DropViewBuilder;
	static refreshMaterializedView(viewName: string): RefreshMaterializedViewBuilder;
	static createSchema(schemaName: string): CreateSchemaBuilder;
	static dropSchema(schemaName: string): DropSchemaBuilder;
	static grant(): GrantBuilder;
	static revoke(): RevokeBuilder;
	static transaction(): TransactionBuilder;
	static savepoint(name: string): SavepointBuilder;
	static cte(): CTEBuilder;
	static window(): WindowBuilder;
	static reindex(target: "INDEX" | "TABLE" | "SCHEMA" | "DATABASE" | "SYSTEM", name: string): ReindexBuilder;
	static truncate(tables: string | string[]): TruncateBuilder;
	static createSequence(sequenceName: string): CreateSequenceBuilder;
	static alterSequence(sequenceName: string): AlterSequenceBuilder;
	static dropSequence(sequenceNames: string | string[]): DropSequenceBuilder;
	static explain(query: string, options?: any): ExplainBuilder;
	static listen(channel: string): ListenBuilder;
	static unlisten(channel?: string): UnlistenBuilder;
	static notify(channel: string, payload?: string | object): NotifyBuilder;
	static vacuum(tables?: string | string[]): VacuumBuilder;
	static analyze(tables?: string | string[]): AnalyzeBuilder;
	static copyTo(tableOrQuery?: string): CopyToBuilder;
	static copyFrom(tableName: string): CopyFromBuilder;
	static createRole(roleName: string): CreateRoleBuilder;
	static alterRole(roleName: string): AlterRoleBuilder;
	static dropRole(roleNames: string | string[]): DropRoleBuilder;
	static setRole(): SetRoleBuilder;
	static reassignOwned(): ReassignOwnedBuilder;
	static dropOwned(): DropOwnedBuilder;
	static defaultPrivileges(): DefaultPrivilegesBuilder;
}
/**
 * Creates a type-safe query builder for a single table
 *
 * This is the primary browser-safe query builder. Pass a table type
 * to get column autocomplete, type-safe WHERE conditions, and
 * validated INSERT/UPDATE data.
 *
 * @template TTable - Table row type for column validation
 * @param tableName - Name of the table to query
 * @returns QueryBuilder instance with type safety
 *
 * @example
 * ```typescript
 * // Define your table type
 * interface User {
 *   id: string;
 *   name: string;
 *   email: string;
 *   age: number;
 * }
 *
 * // Full type safety - columns autocomplete!
 * relq<User>('users')
 *   .select(['id', 'name', 'email'])
 *   .where(q => q.equal('age', 25))  // 'age' must be number
 *   .orderBy('name')
 *   .toString();
 *
 * // Type-safe INSERT
 * relq<User>('users')
 *   .insert({ name: 'John', age: 30 })
 *   .toString();
 *
 * // Without type (backward compatible)
 * relq('users').select(['id']).toString();
 * ```
 *
 * @see relqFor - For multi-table schema with table name autocomplete
 */
export function relq<TTable = any>(tableName: string): QueryBuilder<TTable>;
/**
 * Creates a schema-aware query builder factory with table name autocomplete
 *
 * Use this when you have a **multi-table database schema** and want:
 * - Table name autocomplete (validates against schema keys)
 * - Automatic column type inference based on selected table
 * - Single schema definition for entire application
 *
 * **When to use `relqFor<Schema>()` vs `relq<Table>()`:**
 *
 * | Feature | `relq<Table>()` | `relqFor<Schema>()` |
 * |---------|------------------|----------------------|
 * | Table name autocomplete | ❌ | ✅ |
 * | Column autocomplete | ✅ | ✅ |
 * | Single schema for app | ❌ | ✅ |
 * | Simpler syntax | ✅ | ❌ (factory) |
 *
 * @template TSchema - Database schema with table names as keys
 * @returns Factory function that creates typed query builders
 *
 * @example
 * ```typescript
 * // Step 1: Define your database schema
 * interface MyDatabase {
 *   users: { id: string; name: string; age: number };
 *   posts: { id: string; title: string; user_id: string };
 *   comments: { id: string; text: string; post_id: string };
 * }
 *
 * // Step 2: Create a schema-aware factory (do this once)
 * const db = relqFor<MyDatabase>();
 *
 * // Step 3: Use it anywhere - table names autocomplete!
 * db('users')           // Autocompletes: 'users' | 'posts' | 'comments'
 *   .select(['id', 'name'])   // Columns from MyDatabase['users']
 *   .where(q => q.greaterThan('age', 18))
 *   .toString();
 *
 * db('posts')           // Switch tables - columns update automatically
 *   .select(['title'])  // Now autocompletes 'id' | 'title' | 'user_id'
 *   .toString();
 *
 * // ❌ TypeScript Error: 'invalid' is not a table name
 * db('invalid');
 * ```
 *
 * @see relq - For single table type without schema
 */
export declare function relqFor<TSchema>(): <TTableName extends keyof TSchema & string>(tableName: TTableName) => QueryBuilder<TSchema[TTableName]>;
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
export interface PoolOptions extends PoolConfig {
	max: number;
	maxUses: number;
	allowExitOnIdle: boolean;
	maxLifetimeSeconds: number;
	idleTimeoutMillis: number | null;
}
declare class Pool extends events.EventEmitter {
	/**
	 * Every field of the config object is entirely optional.
	 * The config passed to the pool is also passed to every client
	 * instance within the pool when the pool creates that client.
	 */
	constructor(config?: PoolConfig);
	readonly totalCount: number;
	readonly idleCount: number;
	readonly waitingCount: number;
	readonly expiredCount: number;
	readonly ending: boolean;
	readonly ended: boolean;
	options: PoolOptions;
	connect(): Promise<PoolClient>;
	connect(callback: (err: Error | undefined, client: PoolClient | undefined, done: (release?: any) => void) => void): void;
	end(): Promise<void>;
	end(callback: () => void): void;
	query<T extends Submittable>(queryStream: T): T;
	// tslint:disable:no-unnecessary-generics
	query<R extends any[] = any[], I = any[]>(queryConfig: QueryArrayConfig<I>, values?: QueryConfigValues<I>): Promise<QueryArrayResult<R>>;
	query<R extends QueryResultRow = any, I = any[]>(queryConfig: QueryConfig<I>): Promise<QueryResult<R>>;
	query<R extends QueryResultRow = any, I = any[]>(queryTextOrConfig: string | QueryConfig<I>, values?: QueryConfigValues<I>): Promise<QueryResult<R>>;
	query<R extends any[] = any[], I = any[]>(queryConfig: QueryArrayConfig<I>, callback: (err: Error, result: QueryArrayResult<R>) => void): void;
	query<R extends QueryResultRow = any, I = any[]>(queryTextOrConfig: string | QueryConfig<I>, callback: (err: Error, result: QueryResult<R>) => void): void;
	query<R extends QueryResultRow = any, I = any[]>(queryText: string, values: QueryConfigValues<I>, callback: (err: Error, result: QueryResult<R>) => void): void;
	// tslint:enable:no-unnecessary-generics
	on<K extends "error" | "release" | "connect" | "acquire" | "remove">(event: K, listener: K extends "error" | "release" ? (err: Error, client: PoolClient) => void : (client: PoolClient) => void): this;
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
declare class Client extends ClientBase {
	user?: string | undefined;
	database?: string | undefined;
	port: number;
	host: string;
	password?: string | undefined;
	ssl: boolean;
	readonly connection: Connection;
	constructor(config?: string | ClientConfig);
	end(): Promise<void>;
	end(callback: (err: Error) => void): void;
}
export interface PoolClient extends ClientBase {
	release(err?: Error | boolean): void;
}
/**
 * pgRelations Type Definitions - PostgreSQL Foreign Key Relations Types for Relq
 *
 * Contains all type definitions, interfaces, and type aliases used by the
 * pgRelations API: referential actions, match types, column references,
 * foreign key options, and relation definition types.
 *
 * @module schema-definition/pg-relations/relation-types
 */
/**
 * PostgreSQL referential actions for ON DELETE and ON UPDATE clauses.
 *
 * | Action | Behavior |
 * |--------|----------|
 * | `'NO ACTION'` | Default. Raises error if referenced rows exist. Checked at statement end. |
 * | `'RESTRICT'` | Like NO ACTION but checked immediately (cannot be deferred). |
 * | `'CASCADE'` | Deletes/updates child rows when parent is deleted/updated. |
 * | `'SET NULL'` | Sets FK columns to NULL when parent is deleted/updated. |
 * | `'SET DEFAULT'` | Sets FK columns to their default values when parent changes. |
 *
 * @example
 * ```typescript
 * // When an order is deleted, delete all order items
 * orderId: r.referenceTo.orders(t => ({ onDelete: 'CASCADE' }))
 *
 * // When a user is deleted, orphan their comments (set user_id to NULL)
 * userId: r.referenceTo.users(t => ({ onDelete: 'SET NULL' }))
 *
 * // Prevent deleting a category that has products
 * categoryId: r.referenceTo.categories(t => ({ onDelete: 'RESTRICT' }))
 * ```
 */
export type ReferentialAction = "NO ACTION" | "RESTRICT" | "CASCADE" | "SET NULL" | "SET DEFAULT";
/**
 * PostgreSQL MATCH types for foreign key constraints.
 *
 * | Match Type | Behavior |
 * |------------|----------|
 * | `'SIMPLE'` | Default. Any NULL in FK columns satisfies constraint. |
 * | `'FULL'` | All FK columns must be NULL together, or all must be non-NULL. |
 *
 * Note: MATCH PARTIAL is defined in SQL standard but not implemented in PostgreSQL.
 *
 * @example
 * ```typescript
 * // Composite FK where all columns must match or all be NULL
 * productWarehouse: r.referenceTo.inventory(t => ({
 *     columns: [r.orderItems.productId, r.orderItems.warehouseId],
 *     references: [t.productId, t.warehouseId],
 *     match: 'FULL',
 * }))
 * ```
 */
export type MatchType = "SIMPLE" | "FULL";
/**
 * Foreign key relation definition (runtime representation).
 * Stores all metadata about a REFERENCES constraint.
 */
export interface ForeignKeyRelationDef {
	/** Relation type marker */
	$type: "foreignKey";
	/** Target table name (SQL name) */
	$targetTable: string;
	/** Source column(s) on this table */
	$columns: Array<{
		table: string;
		column: string;
	}>;
	/** Target column(s) on referenced table (undefined = PK) */
	$references?: Array<{
		table: string;
		column: string;
	}>;
	/** ON DELETE action */
	$onDelete?: ReferentialAction;
	/** ON UPDATE action */
	$onUpdate?: ReferentialAction;
	/** MATCH type */
	$match?: MatchType;
	/** Explicit constraint name */
	$name?: string;
	/** DEFERRABLE flag */
	$deferrable?: boolean;
	/** INITIALLY DEFERRED flag */
	$initiallyDeferred?: boolean;
	/** Tracking ID for rename detection */
	$trackingId?: string;
	/** Comment for documentation */
	$comment?: string;
}
/** Relation definition type */
export type RelationDef = ForeignKeyRelationDef;
/** Table's relations - NEW: array of FK definitions */
export type TableRelationsArray = ForeignKeyRelationDef[];
/** Table's relations map (legacy format) */
export type TableRelations = Record<string, RelationDef>;
/** All relations for a schema - NEW: array per table */
export type SchemaRelationsArray = Record<string, TableRelationsArray>;
/** All relations for a schema (legacy) */
export type SchemaRelations = Record<string, TableRelations>;
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
export type SslConfig = boolean | {
	rejectUnauthorized?: boolean;
	ca?: string;
	key?: string;
	cert?: string;
};
interface PoolOptions$1 {
	/** Minimum number of connections in pool @default 0 */
	min?: number;
	/** Maximum number of connections in pool @default 10 (traditional), 1 (serverless) */
	max?: number;
	/** Maximum time (ms) a connection can be idle before being closed @default 30000 */
	idleTimeoutMillis?: number;
	/** Maximum time (ms) to wait for a connection from the pool @default 0 */
	connectionTimeoutMillis?: number;
	/** Maximum number of times a connection can be used @default 0 */
	maxUses?: number;
	/** Application name for connection identification */
	application_name?: string;
	/** SSL/TLS configuration */
	ssl?: SslConfig;
}
export interface ValidationOptions {
	/** Master switch for all validation @default true */
	enabled?: boolean;
	/** Validate string length against varchar/char limits @default true */
	validateLength?: boolean;
	/** Validate data types match schema column types @default true */
	validateTypes?: boolean;
	/** Validate JSONB data against JSON schema @default false */
	validateJsonSchema?: boolean;
	/** How to handle validation errors @default 'throw' */
	onError?: "throw" | "warn" | "log";
}
/**
 * Base configuration shared by all dialects.
 * All fields are optional - uses environment variables as fallback (like pg library).
 *
 * Environment variable fallbacks:
 * - database: PGDATABASE
 * - host: PGHOST
 * - port: PGPORT
 * - user: PGUSER
 * - password: PGPASSWORD
 *
 * @internal
 */
export interface RelqBaseConfig {
	/** Database name (falls back to PGDATABASE env var) */
	database?: string;
	/** Disable smart defaults and environment detection @default false */
	disableSmartDefaults?: boolean;
	/** Logging level @default 'info' */
	logLevel?: "silent" | "error" | "warn" | "info" | "debug";
	/** Data validation configuration */
	validation?: ValidationOptions;
	/** Author name for schema commits */
	author?: string;
	/** Maximum number of commits to keep @default 1000 */
	commitLimit?: number;
	/** Schema relations for type-safe joins */
	relations?: SchemaRelations | SchemaRelationsArray;
	/**
	 * Retry transient query failures (DNS, connection reset, timeout).
	 * Disabled by default. Set `true` for 3 retries, or pass options.
	 */
	retry?: boolean | RetryOptions;
}
/**
 * Configuration for automatic query retry on transient errors.
 */
export interface RetryOptions {
	/** Maximum number of retry attempts @default 3 */
	maxRetries?: number;
	/** Initial delay in ms before first retry (doubles each attempt) @default 250 */
	initialDelayMs?: number;
	/** Maximum delay in ms between retries @default 5000 */
	maxDelayMs?: number;
}
export interface PgConnectionFields {
	/** Database host @default 'localhost' */
	host?: string;
	/** Database port @default 5432 */
	port?: number;
	/** Database user */
	user?: string;
	/** Database password */
	password?: string;
	/** SSL/TLS configuration */
	ssl?: SslConfig;
	/** Connection string (alternative to individual params) */
	connectionString?: string;
	/** Enable connection pooling @default 'auto' */
	pooling?: boolean | "auto";
	/** Connection pool configuration */
	pool?: PoolOptions$1;
}
/**
 * PostgreSQL connection options
 *
 * @example
 * ```typescript
 * const db = new Relq(schema, 'postgres', {
 *     host: 'localhost',
 *     port: 5432,
 *     database: 'mydb',
 *     user: 'postgres',
 *     password: 'secret'
 * });
 * ```
 */
export interface PostgresOptions extends RelqBaseConfig, PgConnectionFields {
	aws?: never;
}
/**
 * Nile multi-tenant PostgreSQL options
 *
 * @example
 * ```typescript
 * const db = new Relq(schema, 'nile', {
 *     host: 'db.thenile.dev',
 *     database: 'mydb',
 *     user: 'user',
 *     password: 'secret'
 * });
 * ```
 */
export interface NileOptions extends RelqBaseConfig, PgConnectionFields {
	aws?: never;
}
/**
 * CockroachDB connection options
 *
 * @example
 * ```typescript
 * const db = new Relq(schema, 'cockroachdb', {
 *     host: 'free-tier.cockroachlabs.cloud',
 *     port: 26257,
 *     database: 'mydb',
 *     user: 'user',
 *     password: 'secret',
 *     ssl: true
 * });
 * ```
 */
export interface CockroachDBOptions extends RelqBaseConfig, PgConnectionFields {
	aws?: never;
}
/**
 * AWS Aurora DSQL connection options
 *
 * @example
 * ```typescript
 * const db = new Relq(schema, 'awsdsql', {
 *     database: 'postgres',
 *     aws: {
 *         hostname: 'cluster.dsql.us-east-1.on.aws',
 *         region: 'us-east-1',
 *         accessKeyId: 'AKIA...',
 *         secretAccessKey: '...'
 *     }
 * });
 * ```
 */
export interface DsqlOptions extends RelqBaseConfig {
	/** AWS DSQL configuration (required) */
	aws: AwsDbConfig;
	/** Enable connection pooling @default 'auto' */
	pooling?: boolean | "auto";
	/** Connection pool configuration */
	pool?: PoolOptions$1;
	/** SSL/TLS configuration */
	ssl?: SslConfig;
	/** Override host (usually derived from aws.hostname) */
	host?: string;
	/** Override port @default 5432 */
	port?: number;
	/** Override user (usually derived from aws.user) */
	user?: string;
	/** Password (usually auto-generated from IAM token) */
	password?: string;
	/** Connection string (not recommended with DSQL - use aws config) */
	connectionString?: string;
}
/**
 * SQLite connection options
 * @status Not yet implemented
 */
export interface SqliteOptions extends RelqBaseConfig {
	/** Path to SQLite database file */
	filename: string;
	/** Open mode: 'rwc' (read-write-create), 'rw' (read-write), 'ro' (read-only) */
	mode?: "rwc" | "rw" | "ro";
}
/**
 * Turso (LibSQL) connection options
 * @status Not yet implemented
 */
export interface TursoOptions extends RelqBaseConfig {
	/** Turso database URL */
	url: string;
	/** Auth token */
	authToken?: string;
}
/**
 * MySQL connection options
 * @status Not yet implemented
 */
export interface MysqlOptions extends RelqBaseConfig {
	/** Database host */
	host?: string;
	/** Database port @default 3306 */
	port?: number;
	/** Database user */
	user?: string;
	/** Database password */
	password?: string;
	/** SSL/TLS configuration */
	ssl?: SslConfig;
}
/**
 * MariaDB connection options
 * @status Not yet implemented
 */
export interface MariadbOptions extends RelqBaseConfig {
	/** Database host */
	host?: string;
	/** Database port @default 3306 */
	port?: number;
	/** Database user */
	user?: string;
	/** Database password */
	password?: string;
	/** SSL/TLS configuration */
	ssl?: SslConfig;
}
/**
 * PlanetScale connection options
 * @status Not yet implemented
 */
export interface PlanetscaleOptions extends RelqBaseConfig {
	/** Database host */
	host: string;
	/** Database username */
	username: string;
	/** Database password */
	password: string;
}
/**
 * Xata connection options
 * @status Not yet implemented
 */
export interface XataOptions extends RelqBaseConfig {
	/** Xata API key */
	apiKey: string;
	/** Xata branch @default 'main' */
	branch?: string;
}
/** @internal */
export interface PostgresConfig extends PostgresOptions {
	dialect?: "postgres" | "postgresql";
}
/** @internal */
export interface NileConfig extends NileOptions {
	dialect: "nile";
}
/** @internal */
export interface CockroachDBConfig extends CockroachDBOptions {
	dialect: "cockroachdb";
}
/** @internal */
export interface DsqlConfig extends DsqlOptions {
	dialect: "awsdsql";
}
/**
 * Relq database configuration - discriminated by `dialect`.
 *
 * Each dialect accepts only its own connection fields:
 * - `'postgres'` (default) - Standard host/port/user/password
 * - `'nile'` - Standard host/port/user/password
 * - `'cockroachdb'` - Standard host/port/user/password
 * - `'awsdsql'` - Requires `aws` config for IAM auth
 *
 * @example
 * ```typescript
 * // PostgreSQL (default)
 * const pgConfig: RelqConfig = {
 *     host: 'localhost',
 *     database: 'mydb',
 *     user: 'postgres',
 *     password: 'secret'
 * };
 *
 * // DSQL (requires aws)
 * const dsqlConfig: RelqConfig = {
 *     dialect: 'awsdsql',
 *     database: 'postgres',
 *     aws: {
 *         hostname: 'cluster.dsql.us-east-1.on.aws',
 *         region: 'us-east-1'
 *     }
 * };
 * ```
 */
export type RelqConfig = PostgresConfig | NileConfig | CockroachDBConfig | DsqlConfig;
/**
 * Unsubscribe function returned by `db.subscribe()`
 *
 * Call this function to stop listening to the channel and clean up resources.
 * If this was the last subscription on the channel, the UNLISTEN command is sent
 * and the listener connection may be closed.
 *
 * @returns Promise that resolves when unsubscribed
 *
 * @example
 * ```typescript
 * const unsub = await db.subscribe('my_channel', (data) => {
 *     console.log(data);
 * });
 *
 * // Later: stop listening
 * await unsub();
 * ```
 */
export type Unsubscribe = () => Promise<void>;
/**
 * Core shared types for the multi-dialect driver abstraction
 *
 * These interfaces define the contract that every dialect driver must implement.
 * They are NOT exposed to end users — users interact with Relq<TSchema>.
 *
 * @module core/shared/types
 * @internal
 */
/** PostgreSQL and PostgreSQL-compatible dialects */
export type PostgresDialect = "postgres" | "cockroachdb" | "nile" | "awsdsql";
/** SQLite family dialects */
export type SQLiteDialect = "sqlite" | "turso";
/** MySQL family dialects */
export type MySQLDialect = "mysql" | "mariadb" | "planetscale";
/** Xata */
export type XataDialect = "xata";
/** All supported dialect identifiers */
export type Dialect = PostgresDialect | SQLiteDialect | MySQLDialect | XataDialect;
/**
 * Capability flags for each driver.
 * Connected builders check these before generating or executing dialect-specific SQL.
 */
export interface DriverCapabilities {
	/** Supports RETURNING clause on INSERT/UPDATE/DELETE */
	returning: boolean;
	/** Supports LATERAL JOIN */
	lateral: boolean;
	/** Supports DISTINCT ON */
	distinctOn: boolean;
	/** Supports LISTEN/NOTIFY pub/sub */
	listenNotify: boolean;
	/** Supports connection pooling */
	pooling: boolean;
	/** Supports cursors for streaming */
	cursors: boolean;
	/** Supports JSONB type and operators */
	jsonb: boolean;
	/** Supports native array types */
	arrays: boolean;
	/** Supports range types */
	ranges: boolean;
	/** Supports full-text search (tsvector/tsquery or equivalent) */
	fullTextSearch: boolean;
	/** Supports ON CONFLICT / ON DUPLICATE KEY */
	upsert: boolean;
	/** Supports FOR UPDATE SKIP LOCKED */
	forUpdateSkipLocked: boolean;
	/** Supports window functions */
	windowFunctions: boolean;
	/** Supports CTEs (WITH ... AS) */
	cte: boolean;
	/** Supports recursive CTEs */
	recursiveCte: boolean;
	/** Supports EXPLAIN ANALYZE */
	explainAnalyze: boolean;
	/** Supports savepoints in transactions */
	savepoints: boolean;
	/** Supports CREATE TABLE AS SELECT */
	createTableAs: boolean;
	/** Supports materialized views */
	materializedViews: boolean;
	/** Supports stored procedures/functions */
	storedProcedures: boolean;
	/** Supports triggers */
	triggers: boolean;
	/** Supports sequences */
	sequences: boolean;
	/** Supports COPY TO/FROM */
	copy: boolean;
	/** Supports VACUUM */
	vacuum: boolean;
	/** Identifier quoting character: '"' for PG/SQLite, '`' for MySQL */
	identifierQuote: "\"" | "`";
	/** Parameter placeholder style */
	parameterStyle: "dollar" | "question" | "named";
}
interface ExplainOptions$1 {
	analyze?: boolean;
	verbose?: boolean;
	format?: "text" | "json" | "xml" | "yaml";
}
/**
 * SQL dialect interface.
 * Provides dialect-specific SQL generation hooks.
 * The base builders call these methods instead of hardcoding SQL syntax.
 * @internal
 */
export interface SqlDialect {
	/** Dialect identifier */
	readonly name: Dialect;
	/** Quote an identifier (table name, column name) */
	quoteIdentifier(name: string): string;
	/** Quote a string literal */
	quoteString(value: string): string;
	/** Format a boolean value */
	formatBoolean(value: boolean): string;
	/** Generate RETURNING clause (or throw if not supported) */
	returning(columns: string[]): string;
	/** Generate upsert clause */
	upsert(conflictColumns: string[], updateColumns: Record<string, unknown>): string;
	/** Generate DISTINCT ON clause (or throw if not supported) */
	distinctOn(columns: string[]): string;
	/** Generate LATERAL subquery wrapper */
	lateralSubquery(subquery: string, alias: string): string;
	/** Generate JSON aggregation expression */
	jsonAgg(expression: string, alias: string): string;
	/** Generate row-to-JSON conversion */
	rowToJson(alias: string): string;
	/** Generate EXPLAIN statement */
	explain(query: string, options: ExplainOptions$1): string;
	/** Generate type cast expression */
	typeCast(expression: string, targetType: string): string;
	/** Get the current timestamp expression */
	currentTimestamp(): string;
	/** Get the random UUID generation expression */
	randomUuid(): string;
	/** Check if a capability is supported */
	supports(capability: keyof DriverCapabilities): boolean;
	/**
	 * Transform a builder's output for this dialect.
	 * Called by toString() to apply final dialect-specific transformations.
	 * Most dialects return the SQL as-is. MySQL converts " to `.
	 */
	transformSql(sql: string): string;
}
/**
 * Standardized field/column metadata from any driver.
 */
export interface DriverFieldInfo {
	/** Column name as returned by DB */
	name: string;
	/** Database-specific type identifier */
	dataTypeID?: number;
	/** Human-readable type name */
	typeName?: string;
}
/**
 * Standardized query result from any driver.
 * Normalizes pg's QueryResult, better-sqlite3's result, mysql2's result.
 */
export interface DriverQueryResult {
	/** Result rows as plain objects */
	rows: Record<string, unknown>[];
	/** Number of affected rows (INSERT/UPDATE/DELETE) */
	rowCount: number | null;
	/** Command type (SELECT, INSERT, UPDATE, DELETE) */
	command: string;
	/** Column metadata */
	fields: DriverFieldInfo[];
}
/**
 * Environment detection utilities
 * Detects if Relq is running in serverless, traditional server, or edge runtime
 * @module utils/environment-detection
 */
export type RuntimeEnvironment = "serverless" | "traditional" | "edge";
export type ServerlessProvider = "vercel" | "aws-lambda" | "netlify" | "cloudflare" | "google-cloud" | "azure";
export interface EnvironmentInfo {
	/** Type of runtime environment */
	type: RuntimeEnvironment;
	/** Serverless provider (if serverless) */
	provider?: ServerlessProvider;
	/** Environment variables that were detected */
	detected: string[];
	/** Whether Node.js process object is available */
	hasProcess: boolean;
}
/**
 * Detect current runtime environment
 * Checks environment variables to determine serverless provider
 *
 * @returns Environment information
 *
 * @example
 * ```typescript
 * const env = detectEnvironment();
 * if (env.type === 'serverless') {
 *   console.log('Running on', env.provider);
 * }
 * ```
 */
export declare function detectEnvironment(): EnvironmentInfo;
/**
 * Check if running in serverless environment
 */
export declare function isServerless(): boolean;
/**
 * Check if running in traditional server environment
 */
export declare function isTraditional(): boolean;
/**
 * Check if running in edge runtime
 */
export declare function isEdge(): boolean;
/**
 * Get human-readable environment description
 */
export declare function getEnvironmentDescription(env: EnvironmentInfo): string;
declare class AggregateQueryBuilder {
	private tableName;
	private groupByColumns;
	private entries;
	private whereConditions;
	private havingConditions;
	private orderByColumns;
	private limitValue?;
	private offsetValue?;
	constructor(tableName: string);
	/**
	 * GROUP BY columns - determines the grouping for aggregates
	 */
	groupBy(...columns: string[]): this;
	/**
	 * COUNT(*) - Count all rows
	 */
	count(alias?: string): this;
	/**
	 * COUNT(column) - Count non-null values
	 */
	countColumn(column: string, alias?: string): this;
	/**
	 * COUNT(DISTINCT column) - Count distinct values
	 */
	countDistinct(column: string, alias?: string): this;
	/**
	 * SUM(column) - Sum of values
	 */
	sum(column: string, alias?: string, filter?: (builder: TypedConditionBuilder<any>) => TypedConditionBuilder<any>): this;
	/**
	 * AVG(column) - Average of values
	 */
	avg(column: string, alias?: string, filter?: (builder: TypedConditionBuilder<any>) => TypedConditionBuilder<any>): this;
	/**
	 * MIN(column) - Minimum value
	 */
	min(column: string, alias?: string): this;
	/**
	 * MAX(column) - Maximum value
	 */
	max(column: string, alias?: string): this;
	/**
	 * ARRAY_AGG(column) - Aggregate into array
	 */
	arrayAgg(column: string, alias?: string): this;
	/**
	 * STRING_AGG(column, delimiter) - Aggregate into delimited string
	 */
	stringAgg(column: string, delimiter?: string, alias?: string): this;
	/**
	 * JSON_AGG(column) - Aggregate into JSON array
	 */
	jsonAgg(column: string, alias?: string): this;
	/**
	 * JSONB_AGG(column) - Aggregate into JSONB array
	 */
	jsonbAgg(column: string, alias?: string): this;
	/**
	 * BOOL_AND(column) - True if all values are true
	 */
	boolAnd(column: string, alias?: string): this;
	/**
	 * BOOL_OR(column) - True if any value is true
	 */
	boolOr(column: string, alias?: string): this;
	/**
	 * Add WHERE conditions
	 */
	where(callback: (builder: TypedConditionBuilder<any>) => TypedConditionBuilder<any>): this;
	/**
	 * Add HAVING conditions
	 */
	having(callback: (builder: TypedConditionBuilder<any>) => TypedConditionBuilder<any>): this;
	/**
	 * ORDER BY
	 */
	orderBy(column: string, direction?: "ASC" | "DESC"): this;
	/**
	 * LIMIT
	 */
	limit(count: number): this;
	/**
	 * OFFSET
	 */
	offset(count: number): this;
	/**
	 * Get aliases that should be coerced to numbers
	 */
	getNumericAliases(): string[];
	/**
	 * Get GROUP BY columns (for result type tracking)
	 */
	getGroupByColumns(): string[];
	/**
	 * Build SQL query string
	 */
	toString(): string;
	private buildEntrySQL;
}
declare class ConnectedAggregateBuilder<TTable = any, TResult = {}> {
	private builder;
	private relq;
	private tableName;
	constructor(builder: AggregateQueryBuilder, relq: RelqBase, tableName: string);
	private mapColumn;
	groupBy<K extends ColumnName<TTable>>(...columns: K[]): ConnectedAggregateBuilder<TTable, TResult & Pick<TTable extends {
		$inferSelect: infer S;
	} ? S : Record<K, unknown>, K & keyof (TTable extends {
		$inferSelect: infer S;
	} ? S : Record<K, unknown>)>>;
	count<TAlias extends string = "count">(alias?: TAlias): ConnectedAggregateBuilder<TTable, TResult & Record<TAlias extends undefined ? "count" : TAlias, number>>;
	countColumn<K extends ColumnName<TTable>, TAlias extends string = K & string>(column: K, alias?: TAlias): ConnectedAggregateBuilder<TTable, TResult & Record<TAlias extends undefined ? K : TAlias, number>>;
	countDistinct<K extends ColumnName<TTable>, TAlias extends string = K & string>(column: K, alias?: TAlias): ConnectedAggregateBuilder<TTable, TResult & Record<TAlias extends undefined ? K : TAlias, number>>;
	sum<K extends ColumnName<TTable>, TAlias extends string = K & string>(column: K, alias?: TAlias): ConnectedAggregateBuilder<TTable, TResult & Record<TAlias extends undefined ? K : TAlias, number>>;
	avg<K extends ColumnName<TTable>, TAlias extends string = K & string>(column: K, alias?: TAlias): ConnectedAggregateBuilder<TTable, TResult & Record<TAlias extends undefined ? K : TAlias, number>>;
	min<K extends ColumnName<TTable>, TAlias extends string = K & string>(column: K, alias?: TAlias): ConnectedAggregateBuilder<TTable, TResult & Record<TAlias extends undefined ? K : TAlias, number>>;
	max<K extends ColumnName<TTable>, TAlias extends string = K & string>(column: K, alias?: TAlias): ConnectedAggregateBuilder<TTable, TResult & Record<TAlias extends undefined ? K : TAlias, number>>;
	arrayAgg<K extends ColumnName<TTable>, TAlias extends string = K & string>(column: K, alias?: TAlias): ConnectedAggregateBuilder<TTable, TResult & Record<TAlias extends undefined ? K : TAlias, any[]>>;
	stringAgg<K extends ColumnName<TTable>, TAlias extends string = K & string>(column: K, delimiter?: string, alias?: TAlias): ConnectedAggregateBuilder<TTable, TResult & Record<TAlias extends undefined ? K : TAlias, string>>;
	jsonAgg<K extends ColumnName<TTable>, TAlias extends string = K & string>(column: K, alias?: TAlias): ConnectedAggregateBuilder<TTable, TResult & Record<TAlias extends undefined ? K : TAlias, any[]>>;
	jsonbAgg<K extends ColumnName<TTable>, TAlias extends string = K & string>(column: K, alias?: TAlias): ConnectedAggregateBuilder<TTable, TResult & Record<TAlias extends undefined ? K : TAlias, any[]>>;
	boolAnd<K extends ColumnName<TTable>, TAlias extends string = K & string>(column: K, alias?: TAlias): ConnectedAggregateBuilder<TTable, TResult & Record<TAlias extends undefined ? K : TAlias, boolean>>;
	boolOr<K extends ColumnName<TTable>, TAlias extends string = K & string>(column: K, alias?: TAlias): ConnectedAggregateBuilder<TTable, TResult & Record<TAlias extends undefined ? K : TAlias, boolean>>;
	where(callback: (builder: TypedConditionBuilder<TTable>) => TypedConditionBuilder<TTable>): this;
	having(callback: (builder: TypedConditionBuilder<TTable>) => TypedConditionBuilder<TTable>): this;
	orderBy(column: ColumnName<TTable>, direction?: "ASC" | "DESC"): this;
	limit(count: number): this;
	offset(count: number): this;
	toString(): string;
	/**
	 * Execute and return all rows with typed result
	 */
	all(): Promise<TResult[]>;
	/**
	 * Execute and return single row with typed result
	 */
	get(): Promise<TResult | null>;
}
declare class ConnectedCTEBuilder<TSchema = any> {
	private relq;
	private ctes;
	constructor(relq: RelqBase<TSchema>);
	/**
	 * Add a named CTE
	 */
	with(name: string, query: {
		toString(): string;
	} | string): this;
	/**
	 * Add a MATERIALIZED CTE
	 */
	withMaterialized(name: string, query: {
		toString(): string;
	} | string): this;
	/**
	 * Execute final query that references the CTEs
	 */
	query<T = any>(sql: string): Promise<{
		data: T[];
		rowCount: number;
	}>;
	/**
	 * Execute final query and return all rows
	 */
	all<T = any>(sql: string): Promise<T[]>;
	/**
	 * Execute final query and return first row
	 */
	get<T = any>(sql: string): Promise<T | null>;
	/**
	 * Build the WITH clause
	 */
	private buildCTEClause;
	/**
	 * Get the generated SQL without executing
	 */
	toSQL(mainQuery: string): string;
}
/**
 * Pagination types for Relq select queries
 * Supports 2 modes: paging, offset
 */
/**
 * Available pagination modes
 */
export type PaginationMode = "paging" | "offset";
/**
 * Base pagination options shared by all modes
 */
export interface BasePaginationOptions {
	/** Pagination mode - required */
	mode: PaginationMode;
	/** Column(s) to order by with direction */
	orderBy?: Array<[
		string,
		"ASC" | "DESC"
	]> | [
		string,
		"ASC" | "DESC"
	];
	/** Whether to run COUNT query for total. Default: true for paging, false for offset */
	count?: boolean;
}
/**
 * Page-based pagination
 * Best for: Traditional UIs with page numbers
 */
export interface PagingOptions extends BasePaginationOptions {
	mode: "paging";
	/** Current page number (1-indexed) */
	page: number;
	/** Items per page */
	perPage: number;
}
/**
 * Offset-based pagination
 * Best for: Direct position control, infinite scroll
 */
export interface OffsetOptions extends BasePaginationOptions {
	mode: "offset";
	/** Starting position (0-indexed, like SQL OFFSET) */
	position: number;
	/** Number of items to fetch, or [min, max] for random */
	limit: number | [
		number,
		number
	];
}
/**
 * Combined pagination options (union type)
 */
export type PaginationOptions = PagingOptions | OffsetOptions;
/**
 * Metadata returned with all database operations
 * Contains information about the query execution
 */
export interface RelqMetadata {
	/** Number of rows affected by the query */
	rowCount: number | null;
	/** The SQL command that was executed (SELECT, INSERT, UPDATE, DELETE, etc.) */
	command: string;
	/** Query execution duration in milliseconds */
	duration: number;
	/** PostgreSQL field definitions (column information) */
	fields: FieldDef[];
}
/**
 * Result type for SELECT and RAW queries
 * Contains data array and metadata
 *
 * @template T - The type of each row in the result set
 *
 * @example
 * ```typescript
 * const result = await db.table('users').select(['id', 'name']).all();
 * // result: RelqResult<Array<{ id: any; name: any }>>
 * console.log(result.data); // [{ id: 1, name: 'John' }, ...]
 * console.log(result.metadata.rowCount); // 10
 * ```
 */
export interface RelqResult<T> {
	/** The query result data */
	data: T;
	/** Query execution metadata */
	metadata: RelqMetadata;
}
/**
 * Result type for COUNT queries
 * Contains count value and metadata
 *
 * @example
 * ```typescript
 * const result = await db.table('users').count().execute();
 * console.log(result.count); // 150
 * console.log(result.metadata.duration); // 12.5
 * ```
 */
export interface RelqCount {
	/** The count value */
	count: number;
	/** Query execution metadata */
	metadata: RelqMetadata;
}
/**
 * Result type for INSERT, UPDATE, DELETE operations
 * Contains success flag and metadata
 *
 * @example
 * ```typescript
 * const result = await db.table('users').update({ status: 'active' }).execute();
 * console.log(result.success); // true
 * console.log(result.metadata.rowCount); // 5 rows updated
 * ```
 */
export interface RelqRun {
	/** Whether the operation succeeded */
	success: boolean;
	/** Query execution metadata */
	metadata: RelqMetadata;
}
declare const JOIN_INTERNAL: unique symbol;
declare const JOIN_SETUP: unique symbol;
/**
 * Internal methods interface for JoinConditionBuilder
 * @internal
 */
export interface JoinConditionInternals {
	toSQL(): string;
	isUsingJoin(): boolean;
	getUsingColumns(): string[] | null;
	toUsingSQL(): string | null;
	getConditions(): JoinCondition[];
	getWhereConditions(): QueryCondition[];
	hasConditions(): boolean;
	hasWhereConditions(): boolean;
	getSelectedColumns(): string[] | null;
}
/**
 * Inner join spec for LATERAL subqueries
 * @internal
 */
export interface InnerJoinSpec {
	type: "JOIN" | "LEFT JOIN" | "INNER JOIN";
	table: string;
	alias: string;
	onClause: string;
}
/**
 * Extended internal methods interface for JoinManyConditionBuilder
 * @internal
 */
export interface JoinManyInternals extends JoinConditionInternals {
	toSelectSQL(tableAlias: string): string;
	toOrderBySQL(): string | null;
	toLimitSQL(): string | null;
	toOffsetSQL(): string | null;
	toWhereSQL(): string;
	getInnerJoins(): InnerJoinSpec[];
}
type Prettify$1<T> = {
	[K in keyof T]: T[K];
} & {};
/**
 * Extract only actual column names from a table type
 * Uses $inferSelect if available (Drizzle tables), otherwise keyof
 */
export type ColumnKeys<T> = T extends {
	$inferSelect: infer TSelect;
} ? keyof TSelect & string : keyof T & string;
/**
 * Pick columns from a table's row type
 * Handles both table definitions (with $inferSelect) and plain interfaces
 * Uses Prettify to flatten the type for better IDE display
 */
export type PickColumns<T, K extends string> = T extends {
	$inferSelect: infer TSelect;
} ? Prettify$1<Pick<TSelect, K & keyof TSelect>> : Prettify$1<Pick<T, K & keyof T>>;
/**
 * Types of join conditions supported
 */
export type JoinConditionType = "equal" | "notEqual" | "greaterThan" | "lessThan" | "greaterThanOrEqual" | "lessThanOrEqual" | "like" | "ilike" | "using" | "raw";
/**
 * A single join condition
 */
export interface JoinCondition {
	type: JoinConditionType;
	/** Left side column reference */
	left?: ColumnRef;
	/** Right side - can be column ref or literal value */
	right?: ColumnRef | unknown;
	/** SQL operator */
	operator?: string;
	/** Columns for USING clause */
	columns?: string[];
	/** Raw SQL string */
	raw?: string;
}
declare class JoinConditionBuilder<TLeft = any, TRight = any> {
	protected conditions: JoinCondition[];
	protected whereConditions: QueryCondition[];
	protected selectedColumns?: string[];
	/**
	 * Add equality condition: left = right
	 *
	 * @param left - Left column reference
	 * @param right - Right column reference or literal value
	 *
	 * @example
	 * on.equal(results.userId, users.id)
	 * on.equal(results.status, 'active')  // With literal
	 */
	equal(left: ColumnRef, right: ColumnRef | unknown): this;
	/**
	 * Add inequality condition: left != right
	 */
	notEqual(left: ColumnRef, right: ColumnRef | unknown): this;
	/**
	 * Add greater than condition: left > right
	 */
	greaterThan(left: ColumnRef, right: ColumnRef | unknown): this;
	/**
	 * Add less than condition: left < right
	 */
	lessThan(left: ColumnRef, right: ColumnRef | unknown): this;
	/**
	 * Add greater than or equal condition: left >= right
	 */
	greaterThanOrEqual(left: ColumnRef, right: ColumnRef | unknown): this;
	/**
	 * Add less than or equal condition: left <= right
	 */
	lessThanOrEqual(left: ColumnRef, right: ColumnRef | unknown): this;
	/**
	 * Add LIKE condition: left LIKE right
	 */
	like(left: ColumnRef, right: ColumnRef | string): this;
	/**
	 * Add case-insensitive LIKE condition: left ILIKE right
	 */
	ilike(left: ColumnRef, right: ColumnRef | string): this;
	/**
	 * Add USING clause for natural join on same-named columns.
	 * Provides autocomplete for columns that exist in both tables.
	 *
	 * @example
	 * on.using('userId', 'productId')
	 * // → USING ("userId", "productId")
	 */
	using(...columns: (ColumnKeys<TLeft> & ColumnKeys<TRight>)[]): this;
	/**
	 * Add WHERE conditions that filter the joined table.
	 * Provides FULL TypedConditionBuilder support including:
	 * - Basic: equal, notEqual, lessThan, greaterThan, between, in, notIn
	 * - String: like, ilike, startsWith, endsWith, contains
	 * - Regex: regex, iregex, similarTo
	 * - NULL-safe: distinctFrom, notDistinctFrom
	 * - Logical: or(), and(), not()
	 * - Namespaced: jsonb.*, array.*, fulltext.*, range.*, geometric.*, network.*, postgis.*
	 *
	 * @example
	 * on.equal(results.userId, users.id)
	 *   .where(q => q.equal('banned', false).isNull('deletedAt'))
	 *   .where(q => q.or(sub => sub.equal('role', 'admin').equal('role', 'moderator')))
	 *   .where(q => q.jsonb.hasKey('settings', 'notifications'))
	 */
	where(callback: (q: TypedConditionBuilder<TRight>) => TypedConditionBuilder<TRight>): this;
	/**
	 * Select specific columns from the joined table.
	 * If not called, all columns are selected.
	 * The return type narrows TRight to only the selected columns.
	 *
	 * @example
	 * on.equal(orders.userId, users.id)
	 *   .select(['id', 'name', 'email'])   // array syntax
	 * on.equal(orders.userId, users.id)
	 *   .select('id', 'name', 'email')     // spread syntax
	 */
	select<K extends ColumnKeys<TRight>>(columns: K[]): JoinConditionBuilder<TLeft, PickColumns<TRight, K>>;
	select<K extends ColumnKeys<TRight>>(...columns: K[]): JoinConditionBuilder<TLeft, PickColumns<TRight, K>>;
	/** @internal */
	get [JOIN_INTERNAL](): JoinConditionInternals;
	/**
	 * Generate the ON clause SQL.
	 * @internal
	 */
	private internalToSQL;
	/**
	 * Check if this is a USING join (no ON clause needed).
	 * @internal
	 */
	private internalIsUsingJoin;
	/**
	 * Get USING columns if this is a USING join.
	 * @internal
	 */
	private internalGetUsingColumns;
	/**
	 * Generate USING clause SQL.
	 * @internal
	 */
	private internalToUsingSQL;
	/**
	 * Format the right side of a comparison for SQL.
	 * @internal
	 */
	protected formatRightSide(right: ColumnRef | unknown): string;
}
/**
 * Sort direction for ORDER BY
 */
export type SortDirection = "ASC" | "DESC";
/**
 * Nulls handling in ORDER BY
 */
export type NullsPosition = "FIRST" | "LAST";
/**
 * Builder for LATERAL JOIN conditions with ordering and limiting.
 * Extends JoinConditionBuilder with array-specific features.
 *
 * @example
 * ```typescript
 * // In a joinMany callback:
 * on.equal(users.id, orders.userId)
 *   .where(q => q.equal('status', 'completed'))
 *   .orderBy('createdAt', 'DESC')
 *   .limit(10)
 *   .select(['id', 'total'])
 * ```
 */
/**
 * Callback for inner joins within LATERAL.
 * TResult defaults to TInner (full table) but narrows when `.select()` is called.
 */
export type InnerJoinCallback<TRight, TInner, TResult = TInner> = (on: JoinConditionBuilder<TRight, TInner>, inner: TableProxy<TInner>) => JoinConditionBuilder<TRight, TResult>;
/**
 * Proxy creator function type - set by ConnectedSelectBuilder
 * @internal
 */
export type ProxyCreator = (tableKey: string, alias: string) => {
	proxy: TableProxy<any>;
	tableName: string;
};
declare class JoinManyConditionBuilder<TSchema = any, TLeft = any, TRight = any, TRightKey extends string = string> extends JoinConditionBuilder<TLeft, TRight> {
	private orderSpecs;
	private limitValue?;
	private offsetValue?;
	private innerJoins;
	private proxyCreator?;
	private rightProxy?;
	/**
	 * Add ORDER BY clause for the LATERAL subquery.
	 * Provides autocomplete for column names from the joined table.
	 *
	 * @param column - Column name (with autocomplete)
	 * @param direction - Sort direction (ASC or DESC)
	 * @param nulls - NULLS FIRST or NULLS LAST (optional)
	 *
	 * @example
	 * on.orderBy('createdAt', 'DESC')
	 * on.orderBy('amount', 'DESC', 'LAST')
	 */
	orderBy(column: ColumnKeys<TRight>, direction?: SortDirection, nulls?: NullsPosition): this;
	/**
	 * Add LIMIT clause for the LATERAL subquery.
	 * Limits how many related rows are fetched per parent row.
	 *
	 * @param count - Maximum number of rows to return per parent
	 *
	 * @example
	 * on.limit(5)  // Get at most 5 related items per parent row
	 */
	limit(count: number): this;
	/**
	 * Add OFFSET clause for the LATERAL subquery.
	 * Skips rows before returning results.
	 *
	 * @param count - Number of rows to skip
	 *
	 * @example
	 * on.offset(10)  // Skip first 10 rows
	 * on.offset(10).limit(5)  // Skip 10, then take 5
	 */
	offset(count: number): this;
	/**
	 * Set the proxy creator function for inner joins.
	 * @internal
	 */
	get [JOIN_SETUP](): (creator: ProxyCreator, rightProxy: TableProxy<TRight>) => void;
	/**
	 * Add an inner JOIN within the LATERAL subquery.
	 * Allows joining additional tables in the subquery.
	 * Autocomplete excludes parent tables (left and right) already in scope.
	 *
	 * @param table - Table name (schema key) to join
	 * @param callback - Join callback receiving (on, innerTable)
	 *
	 * @example
	 * ```typescript
	 * db.table.users.select()
	 *   .joinMany('purchases', (on, users, purchases) =>
	 *     on.equal(users.id, purchases.userId)
	 *       .innerJoin('products', (on, products) =>
	 *         on.equal(purchases.productId, products.id)
	 *       )
	 *       .orderBy('createdAt', 'DESC')
	 *       .limit(5)
	 *   )
	 * // Generates:
	 * // JOIN LATERAL (SELECT ... FROM purchases JOIN products ON ... WHERE ...) ...
	 * ```
	 */
	innerJoin<TInnerKey extends Exclude<keyof TSchema & string, TRightKey>, TResult>(tableOrAlias: TInnerKey | [
		TInnerKey,
		string
	], callback: InnerJoinCallback<TRight, TSchema[TInnerKey], TResult>): JoinManyConditionBuilder<TSchema, TLeft, TResult, TRightKey>;
	/**
	 * Add a LEFT JOIN within the LATERAL subquery.
	 * Autocomplete excludes parent tables already in scope.
	 *
	 * @param table - Table name (schema key) to join
	 * @param callback - Join callback receiving (on, innerTable)
	 */
	leftInnerJoin<TInnerKey extends Exclude<keyof TSchema & string, TRightKey>, TResult>(tableOrAlias: TInnerKey | [
		TInnerKey,
		string
	], callback: InnerJoinCallback<TRight, TSchema[TInnerKey], TResult>): JoinManyConditionBuilder<TSchema, TLeft, TResult, TRightKey>;
	/**
	 * Add a raw inner JOIN with SQL string (no type safety).
	 * Use when you don't have schema access.
	 *
	 * @param table - SQL table name
	 * @param alias - Alias for the table
	 * @param onClause - Raw ON clause SQL
	 */
	innerJoinRaw(table: string, alias: string, onClause: string): this;
	/**
	 * Add a raw LEFT JOIN with SQL string (no type safety).
	 */
	leftInnerJoinRaw(table: string, alias: string, onClause: string): this;
	/**
	 * Select specific columns from the joined table.
	 * The return type narrows TRight to only the selected columns.
	 *
	 * @example
	 * on.select(['id', 'name'])   // array syntax
	 * on.select('id', 'name')     // spread syntax
	 */
	select<K extends ColumnKeys<TRight>>(columns: K[]): JoinManyConditionBuilder<TSchema, TLeft, PickColumns<TRight, K>, TRightKey>;
	select<K extends ColumnKeys<TRight>>(...columns: K[]): JoinManyConditionBuilder<TSchema, TLeft, PickColumns<TRight, K>, TRightKey>;
	/** @internal */
	get [JOIN_INTERNAL](): JoinManyInternals;
	/**
	 * Generate the ON clause SQL (inherited behavior).
	 * @internal
	 */
	private buildSQL;
	/**
	 * Generate the SELECT clause for the subquery.
	 * @internal
	 */
	private buildSelectSQL;
	/**
	 * Generate the ORDER BY clause for the subquery.
	 * @internal
	 */
	private buildOrderBySQL;
	/**
	 * Generate the LIMIT clause.
	 * @internal
	 */
	private buildLimitSQL;
	/**
	 * Generate the OFFSET clause.
	 * @internal
	 */
	private buildOffsetSQL;
}
/**
 * Type inference utilities for automatic TypeScript type detection from SQL columns
 * @module types/inference-types
 */
/**
 * Extract column name from column specification
 * Handles both simple columns ('id') and aliased columns (['user_id', 'id'])
 *
 * @example
 * ```typescript
 * type A = ExtractColumnName<'id'>;              // 'id'
 * type B = ExtractColumnName<['user_id', 'id']>; // 'id' (alias)
 * ```
 */
export type ExtractColumnName<T> = T extends [
	string,
	infer Alias extends string
] ? Alias : T extends string ? T : never;
/**
 * Convert column array to object type with all columns as keys
 * Maps each column to 'any' type (specific types can be overridden)
 *
 * @example
 * ```typescript
 * type A = ColumnsToObject<['id', 'name']>;
 * // Result: { id: any; name: any }
 *
 * type B = ColumnsToObject<['id', ['user_name', 'name']]>;
 * // Result: { id: any; name: any }
 * ```
 */
export type ColumnsToObject<T extends readonly (string | [
	string,
	string
])[]> = {
	[K in T[number] as ExtractColumnName<K>]: any;
};
/**
 * Infer result type from selected columns
 * This is the main type used for automatic type inference in SELECT queries
 *
 * @template TColumns - The array of selected columns
 *
 * @example
 * ```typescript
 * type Result = InferredResult<['id', 'name', 'email']>;
 * // Result: { id: any; name: any; email: any }
 *
 * type WithAlias = InferredResult<['id', ['user_name', 'name']]>;
 * // Result: { id: any; name: any }
 * ```
 */
export type InferredResult<TColumns extends readonly (string | [
	string,
	string
])[]> = ColumnsToObject<TColumns>;
/**
 * Type for column specification
 * Can be a simple string or a tuple of [column, alias]
 */
export type ColumnSpec = string | [
	string,
	string
];
/**
 * Type for array of column specifications
 */
export type ColumnArray = readonly ColumnSpec[];
/**
 * Helper type to ensure type safety when no columns are selected
 * Used as fallback when SELECT * or no columns specified
 */
export type UnknownRecord = Record<string, any>;
/**
 * Detect if a column specification contains an aggregate function
 * Matches patterns like: COUNT(*), SUM(price), AVG(score), etc.
 */
export type IsAggregateColumn<T extends string> = T extends `${string}(${string})` ? true : false;
/**
 * Extract aggregate function name from expression
 * Examples:
 * - "COUNT(*)" → "count"
 * - "SUM(price)" → "sum"
 * - "AVG(score)" → "avg"
 */
export type ExtractAggregateFunction<T extends string> = T extends `${infer Func}(${string})` ? Lowercase<Func> : never;
/**
 * Map aggregate functions to their return types
 */
export interface AggregateTypeMap {
	count: number;
	sum: number;
	avg: number;
	min: any;
	max: any;
	array_agg: any[];
	json_agg: any[];
	jsonb_agg: any[];
	string_agg: string;
	bool_and: boolean;
	bool_or: boolean;
}
/**
 * Infer the type of a column based on whether it's an aggregate
 * - If aggregate: return the aggregate function's type
 * - Otherwise: return any
 */
type InferColumnType$2<T extends string> = IsAggregateColumn<T> extends true ? ExtractAggregateFunction<T> extends keyof AggregateTypeMap ? AggregateTypeMap[ExtractAggregateFunction<T>] : any : any;
/**
 * Enhanced column-to-object mapping with aggregate type inference
 * Automatically detects aggregate functions and assigns proper types
 *
 * @example
 * ```typescript
 * type Result = ColumnsToObjectWithAggregates<[
 *   'user_id',
 *   ['COUNT(*)', 'total'],
 *   ['SUM(amount)', 'total_amount']
 * ]>;
 *
 * // Result: {
 * //   user_id: any;
 * //   total: number;
 * //   total_amount: number;
 * // }
 * ```
 */
export type ColumnsToObjectWithAggregates<T extends readonly (string | [
	string,
	string
])[]> = {
	[K in T[number] as ExtractColumnName<K>]: K extends [
		infer Col extends string,
		string
	] ? InferColumnType$2<Col> : K extends string ? InferColumnType$2<K> : any;
};
declare class ConnectedCountBuilder<TTable = any, TGroups extends Record<string, number> = {}> {
	private builder;
	private relq;
	private tableName;
	private groupNames;
	constructor(builder: CountBuilder, relq: RelqBase, tableName: string);
	/**
	 * Add a named count group with optional aggregate function
	 * Returns new builder with group name added to type
	 */
	group<TName extends string>(name: TName, callback: (builder: TypedConditionBuilder<TTable>) => TypedConditionBuilder<TTable>, options?: GroupOptions): ConnectedCountBuilder<TTable, TGroups & Record<TName, number>>;
	/**
	 * Add base WHERE conditions with column mapping
	 */
	where(callback: (builder: TypedConditionBuilder<TTable>) => TypedConditionBuilder<TTable>): this;
	/**
	 * Wrap condition builder to apply column mapping
	 */
	private wrapConditionBuilder;
	/**
	 * Get SQL string (always available)
	 */
	toString(): string;
	/**
	 * Execute COUNT query with full metadata
	 */
	execute(): Promise<RelqCount>;
	/**
	 * Execute COUNT and return result
	 * - If no groups: returns number (count)
	 * - If groups: returns typed object { groupName: value }
	 */
	get(): Promise<keyof TGroups extends never ? number : Prettify<TGroups>>;
}
declare class ReturningExecutor<TResult> {
	private builder;
	private relq;
	private tableName?;
	private schemaKey?;
	private columnMapping?;
	constructor(builder: {
		toString(): string;
	}, relq: RelqBase, tableName?: string | undefined, schemaKey?: string | undefined);
	/**
	 * Set up reverse column mapping (SQL name → TypeScript property name)
	 * @internal
	 */
	private setupColumnMapping;
	/**
	 * Transform a row's keys from SQL column names to TypeScript property names
	 * @internal
	 */
	private transformRow;
	/**
	 * Get SQL string
	 */
	toString(): string;
	/**
	 * Execute query and return the selected rows
	 * @param withMetadata - If true, returns { data, metadata }
	 */
	run(): Promise<TResult[]>;
	run(withMetadata: true): Promise<RelqResult<TResult[]>>;
}
declare class ConnectedDeleteBuilder<TTable = any> {
	private builder;
	private relq;
	private tableName?;
	private schemaKey?;
	constructor(builder: DeleteBuilder, relq: RelqBase, tableName?: string | undefined, schemaKey?: string | undefined);
	/**
	 * Set up column resolver to transform property names to SQL column names.
	 * Uses schema metadata ($columnName) to resolve column names.
	 * @internal
	 */
	private setupColumnResolver;
	where(callback: (builder: TypedConditionBuilder<TTable>) => TypedConditionBuilder<TTable>): this;
	/**
	 * Get SQL string (always available)
	 */
	toString(): string;
	/**
	 * Execute DELETE
	 * @param withMetadata - If true, returns { success, metadata }
	 */
	run(): Promise<number>;
	run(withMetadata: true): Promise<RelqRun>;
	/**
	 * Set RETURNING clause - returns executor with typed results.
	 * Use '*' to return all columns, or specify column names.
	 * Pass null to skip RETURNING clause (useful for conditional returning).
	 *
	 * **Dialect Support:**
	 * | Dialect     | Supported | Notes |
	 * |-------------|-----------|-------|
	 * | PostgreSQL  | ✅        | Native RETURNING support |
	 * | CockroachDB | ✅        | Native RETURNING support |
	 * | Nile        | ✅        | Native RETURNING support |
	 * | AWS DSQL    | ✅        | Native RETURNING support |
	 * | MySQL       | ❌        | No RETURNING support |
	 * | SQLite      | ✅        | Native RETURNING support (3.35+) |
	 *
	 * @param columns - '*' for all, column name(s), or null to skip
	 * @throws {RelqConfigError} If dialect doesn't support RETURNING
	 *
	 * @example
	 * ```typescript
	 * // Get deleted row data
	 * const deleted = await db.table.users.delete()
	 *   .where(q => q.equal('id', userId))
	 *   .returning('*')
	 *   .run()
	 * ```
	 */
	returning(columns: null): this;
	returning(columns: "*"): ReturningExecutor<TTable extends {
		$inferSelect: infer S;
	} ? S : TTable>;
	returning<K extends string & ColumnName<TTable>>(columns: K | K[]): ReturningExecutor<Prettify<Pick<TTable extends {
		$inferSelect: infer S;
	} ? S : TTable, K & keyof (TTable extends {
		$inferSelect: infer S;
	} ? S : TTable)>>>;
	returning<K extends string & ColumnName<TTable>>(columns: K[] | null): this | ReturningExecutor<Prettify<Pick<TTable extends {
		$inferSelect: infer S;
	} ? S : TTable, K & keyof (TTable extends {
		$inferSelect: infer S;
	} ? S : TTable)>>>;
}
export type InferSelect<T> = T extends {
	$inferSelect: infer S;
} ? S : T;
declare class ConnectedInsertBuilder<TTable = any> {
	private builder;
	private relq;
	private tableName?;
	private schemaKey?;
	constructor(builder: InsertBuilder, relq: RelqBase, tableName?: string | undefined, schemaKey?: string | undefined);
	/**
	 * Set up column resolver to transform property names to SQL column names.
	 * Uses schema metadata ($columnName) to resolve column names.
	 * @internal
	 */
	private setupColumnResolver;
	addRow(row: InsertData<TTable>): this;
	addRows(rows: InsertData<TTable>[]): this;
	clear(): this;
	get total(): number;
	/**
	 * ON CONFLICT DO NOTHING - skip insert if conflict occurs.
	 * The insert is silently skipped when a unique constraint violation occurs.
	 *
	 * **Dialect Support:**
	 * | Dialect     | Supported | Notes |
	 * |-------------|-----------|-------|
	 * | PostgreSQL  | ✅        | Native ON CONFLICT support |
	 * | CockroachDB | ✅        | Native ON CONFLICT support |
	 * | Nile        | ✅        | Native ON CONFLICT support |
	 * | AWS DSQL    | ✅        | Native ON CONFLICT support |
	 * | MySQL       | ⚠️        | Uses INSERT IGNORE (different semantics) |
	 * | SQLite      | ✅        | Native ON CONFLICT support |
	 *
	 * @param columns - Optional column(s) for conflict detection.
	 *   Omit to match any constraint (`ON CONFLICT DO NOTHING`).
	 *
	 * @example
	 * ```typescript
	 * // Any constraint conflict
	 * await db.table.users.insert({ email: 'test@example.com' })
	 *   .doNothing()
	 *   .run()
	 *
	 * // Single column conflict
	 * await db.table.users.insert({ email: 'test@example.com' })
	 *   .doNothing('email')
	 *   .run()
	 *
	 * // Multiple columns (composite unique constraint)
	 * await db.table.userRoles.insert({ userId, roleId })
	 *   .doNothing('userId', 'roleId')
	 *   .run()
	 * ```
	 */
	doNothing(): this;
	doNothing(columns: ColumnName<TTable>[]): this;
	doNothing(...columns: ColumnName<TTable>[]): this;
	/**
	 * ON CONFLICT DO UPDATE - update row if conflict occurs (UPSERT).
	 * 100% type-safe, no raw SQL needed.
	 *
	 * **Dialect Support:**
	 * | Dialect     | Supported | Notes |
	 * |-------------|-----------|-------|
	 * | PostgreSQL  | ✅        | Full EXCLUDED.* support |
	 * | CockroachDB | ✅        | Full EXCLUDED.* support |
	 * | Nile        | ✅        | Full EXCLUDED.* support |
	 * | AWS DSQL    | ✅        | Full EXCLUDED.* support |
	 * | MySQL       | ⚠️        | Uses ON DUPLICATE KEY UPDATE (different syntax) |
	 * | SQLite      | ✅        | Uses ON CONFLICT DO UPDATE |
	 *
	 * @param columns - Column(s) for conflict detection
	 * @param values - Values to update (static or expression functions)
	 * @param where - Optional type-safe where clause for conditional updates
	 *
	 * @example
	 * ```typescript
	 * // Static values
	 * .doUpdate('email', { status: 'updated' })
	 *
	 * // Expression functions - access EXCLUDED and current row values
	 * .doUpdate('email', {
	 *   balance: (excluded, sql) => sql.add(excluded.balance, 100),
	 *   count: (excluded, sql, row) => sql.increment(1),
	 *   value: (excluded, sql) => sql.coalesce(excluded.value, 0),
	 *   score: (excluded, sql, row) => sql.greatest(excluded.score, row.score)
	 * })
	 *
	 * // Multiple conflict columns
	 * .doUpdate(['email', 'tenantId'], { status: 'updated' })
	 *
	 * // With type-safe where clause
	 * .doUpdate('email', { balance: 100 }, q =>
	 *   q.notEqual('role', 'admin')
	 *    .in('status', ['active', 'pending'])
	 * )
	 * ```
	 */
	doUpdate(columns: ColumnName<TTable> | ColumnName<TTable>[], values: ConflictUpdateData<InferSelect<TTable>>, where?: (builder: TypedConditionBuilder<InferSelect<TTable>>) => TypedConditionBuilder<InferSelect<TTable>>): this;
	/**
	 * Get SQL string (always available)
	 */
	toString(): string;
	/**
	 * Execute the INSERT query
	 * @param withMetadata - If true, returns { rowCount, metadata }
	 */
	run(): Promise<number>;
	run(withMetadata: true): Promise<RelqRun>;
	/**
	 * Set RETURNING clause - returns executor with typed results.
	 * Use '*' to return all columns, or specify column names.
	 * Pass null to skip RETURNING clause (useful for conditional returning).
	 *
	 * **Dialect Support:**
	 * | Dialect     | Supported | Notes |
	 * |-------------|-----------|-------|
	 * | PostgreSQL  | ✅        | Native RETURNING support |
	 * | CockroachDB | ✅        | Native RETURNING support |
	 * | Nile        | ✅        | Native RETURNING support |
	 * | AWS DSQL    | ✅        | Native RETURNING support |
	 * | MySQL       | ❌        | Use LAST_INSERT_ID() instead |
	 * | SQLite      | ✅        | Native RETURNING support (3.35+) |
	 *
	 * @param columns - '*' for all, column name(s), or null to skip
	 * @throws {RelqConfigError} If dialect doesn't support RETURNING
	 *
	 * @example
	 * ```typescript
	 * // Return all columns
	 * const user = await db.table.users.insert({ name: 'John' })
	 *   .returning('*')
	 *   .run()
	 * // user has all columns from users table
	 *
	 * // Return specific columns
	 * const { id, createdAt } = await db.table.users.insert({ name: 'John' })
	 *   .returning(['id', 'createdAt'])
	 *   .run()
	 * ```
	 */
	returning(columns: null): this;
	returning(columns: "*"): ReturningExecutor<TTable extends {
		$inferSelect: infer S;
	} ? S : TTable>;
	returning<K extends string & ColumnName<TTable>>(columns: K | K[]): ReturningExecutor<Prettify<Pick<TTable extends {
		$inferSelect: infer S;
	} ? S : TTable, K & keyof (TTable extends {
		$inferSelect: infer S;
	} ? S : TTable)>>>;
	returning<K extends string & ColumnName<TTable>>(columns: K[] | null): this | ReturningExecutor<Prettify<Pick<TTable extends {
		$inferSelect: infer S;
	} ? S : TTable, K & keyof (TTable extends {
		$inferSelect: infer S;
	} ? S : TTable)>>>;
}
declare class InsertFromSelectBuilder {
	readonly tableName: string;
	private columns;
	private selectSQL;
	private returningColumns?;
	private columnResolver?;
	private conflictColumns?;
	private conflictAction?;
	private conflictUpdateData?;
	private conflictWhereClause?;
	constructor(tableName: string, columns: string[], selectSQL: string);
	/**
	 * Set a column resolver for property→SQL name transformation.
	 * @internal
	 */
	setColumnResolver(resolver: (column: string) => string): this;
	/**
	 * ON CONFLICT DO NOTHING — skip rows that conflict.
	 * @param columns - Optional conflict target columns. Omit to match any constraint.
	 */
	onConflictDoNothing(columns?: string | string[]): this;
	/**
	 * ON CONFLICT DO UPDATE — upsert rows that conflict.
	 * @param columns - Conflict target column(s)
	 * @param updateData - Columns to update on conflict
	 * @param whereClause - Optional raw WHERE clause for conditional update
	 */
	onConflictDoUpdate(columns: string | string[], updateData: Record<string, any>, whereClause?: string): this;
	/**
	 * Add RETURNING clause.
	 */
	returning(columns: string | string[] | null): this;
	private resolveColumnName;
	private buildConflictClause;
	toString(): string;
}
declare class ConnectedInsertFromSelectBuilder<TTable = any> {
	private builder;
	private relq;
	private tableName?;
	private schemaKey?;
	constructor(builder: InsertFromSelectBuilder, relq: RelqBase, tableName?: string | undefined, schemaKey?: string | undefined);
	private setupColumnResolver;
	/**
	 * ON CONFLICT DO NOTHING — skip rows that conflict.
	 * @param columns - Optional conflict target column(s). Omit to match any constraint.
	 */
	doNothing(): this;
	doNothing(columns: ColumnName<TTable>[]): this;
	doNothing(...columns: ColumnName<TTable>[]): this;
	/**
	 * ON CONFLICT DO UPDATE — upsert rows that conflict.
	 * @param columns - Conflict target column(s)
	 * @param updateData - Columns to update on conflict
	 */
	doUpdate(columns: ColumnName<TTable> | ColumnName<TTable>[], updateData: Partial<Record<ColumnName<TTable> & string, any>>): this;
	toString(): string;
	/** Execute the INSERT ... SELECT query */
	run(): Promise<number>;
	run(withMetadata: true): Promise<RelqRun>;
	/**
	 * Set RETURNING clause — returns executor with typed results.
	 */
	returning(columns: null): this;
	returning(columns: "*"): ReturningExecutor<TTable extends {
		$inferSelect: infer S;
	} ? S : TTable>;
	returning<K extends string & ColumnName<TTable>>(columns: K | K[]): ReturningExecutor<Prettify<Pick<TTable extends {
		$inferSelect: infer S;
	} ? S : TTable, K & keyof (TTable extends {
		$inferSelect: infer S;
	} ? S : TTable)>>>;
	returning<K extends string & ColumnName<TTable>>(columns: K[] | null): this | ReturningExecutor<Prettify<Pick<TTable extends {
		$inferSelect: infer S;
	} ? S : TTable, K & keyof (TTable extends {
		$inferSelect: infer S;
	} ? S : TTable)>>>;
}
declare class ConnectedUpdateBuilder<TTable = any> {
	private builder;
	private relq;
	private tableName?;
	private schemaKey?;
	constructor(builder: UpdateBuilder, relq: RelqBase, tableName?: string | undefined, schemaKey?: string | undefined);
	/**
	 * Set up column resolver to transform property names to SQL column names.
	 * Uses schema metadata ($columnName) to resolve column names.
	 * @internal
	 */
	private setupColumnResolver;
	where(callback: (builder: TypedConditionBuilder<TTable>) => TypedConditionBuilder<TTable>): this;
	/**
	 * Get SQL string (always available)
	 */
	toString(): string;
	/**
	 * Execute UPDATE
	 * @param withMetadata - If true, returns { success, metadata }
	 */
	run(): Promise<number>;
	run(withMetadata: true): Promise<RelqRun>;
	/**
	 * Set RETURNING clause - returns executor with typed results.
	 * Use '*' to return all columns, or specify column names.
	 * Pass null to skip RETURNING clause (useful for conditional returning).
	 *
	 * **Dialect Support:**
	 * | Dialect     | Supported | Notes |
	 * |-------------|-----------|-------|
	 * | PostgreSQL  | ✅        | Native RETURNING support |
	 * | CockroachDB | ✅        | Native RETURNING support |
	 * | Nile        | ✅        | Native RETURNING support |
	 * | AWS DSQL    | ✅        | Native RETURNING support |
	 * | MySQL       | ❌        | No RETURNING support |
	 * | SQLite      | ✅        | Native RETURNING support (3.35+) |
	 *
	 * @param columns - '*' for all, column name(s), or null to skip
	 * @throws {RelqConfigError} If dialect doesn't support RETURNING
	 *
	 * @example
	 * ```typescript
	 * // Return updated row
	 * const user = await db.table.users.update({ score: 100 })
	 *   .where(q => q.equal('id', userId))
	 *   .returning('*')
	 *   .run()
	 * ```
	 */
	returning(columns: null): this;
	returning(columns: "*"): ReturningExecutor<TTable extends {
		$inferSelect: infer S;
	} ? S : TTable>;
	returning<K extends string & ColumnName<TTable>>(columns: K | K[]): ReturningExecutor<Prettify<Pick<TTable extends {
		$inferSelect: infer S;
	} ? S : TTable, K & keyof (TTable extends {
		$inferSelect: infer S;
	} ? S : TTable)>>>;
	returning<K extends string & ColumnName<TTable>>(columns: K[] | null): this | ReturningExecutor<Prettify<Pick<TTable extends {
		$inferSelect: infer S;
	} ? S : TTable, K & keyof (TTable extends {
		$inferSelect: infer S;
	} ? S : TTable)>>>;
}
declare class PaginateBuilder<TSchema, TTable, T> {
	private relq;
	private tableName;
	private columns?;
	private whereClause?;
	private orderByClause?;
	constructor(relq: RelqBase<TSchema>, tableName: string, columns?: string[] | undefined, whereClause?: ((q: TypedConditionBuilder<TTable>) => TypedConditionBuilder<TTable>) | undefined, orderByClause?: ([
		ColumnName<TTable>,
		"ASC" | "DESC"
	] | Array<[
		ColumnName<TTable>,
		"ASC" | "DESC"
	]>) | undefined);
	/**
	 * Execute with paging mode (page-based pagination)
	 *
	 * @example
	 * ```typescript
	 * const result = await db.table.users.paginate({...}).paging({ page: 1, perPage: 20 })
	 * result.pagination.page       // number
	 * result.pagination.totalPages // number
	 * ```
	 */
	paging(options: {
		/** Page number (1-indexed) */
		page?: number;
		/** Items per page (required) */
		perPage: number;
		/** Get total count (default: true for paging) */
		count?: boolean;
	}): Promise<PagingPaginatedResult<T>>;
	/**
	 * Execute with offset mode (position-based pagination)
	 *
	 * @example
	 * ```typescript
	 * const result = await db.table.users.paginate({...}).offset({ position: 0, limit: 50 })
	 * // Or with random limit
	 * const result = await db.table.users.paginate({...}).offset({ position: 0, shuffleLimit: [10, 50] })
	 * ```
	 */
	offset(options: ({
		/** Starting position */
		position?: number;
		/** Fixed limit */
		limit: number;
		shuffleLimit?: never;
		/** Get total count (default: false for offset) */
		count?: boolean;
	} | {
		/** Starting position */
		position?: number;
		limit?: never;
		/** Random limit between [min, max] */
		shuffleLimit: [
			number,
			number
		];
		/** Get total count (default: false for offset) */
		count?: boolean;
	})): Promise<OffsetPaginatedResult<T>>;
}
declare class ConnectedQueryBuilder<TSchema = any, TTable = any> {
	private tableName;
	private relq;
	/** Schema key (camelCase) - used for join callback params */
	private schemaKey?;
	constructor(tableName: string, relq: RelqBase<TSchema>, 
	/** Schema key (camelCase) - used for join callback params */
	schemaKey?: string | undefined);
	/** @internal */
	private get ctx();
	select(): ConnectedSelectBuilder<TSchema, TTable, [
	]>;
	select<TColumns extends NonEmptyColumnSelections<TTable>>(columns: TColumns): ConnectedSelectBuilder<TSchema, TTable, TColumns>;
	select<TColumn extends ValidColumnName<TTable>>(column: TColumn): ConnectedSelectBuilder<TSchema, TTable, readonly [
		TColumn
	]>;
	select<TColumns extends [
		ValidColumnName<TTable>,
		ValidColumnName<TTable>,
		...ValidColumnName<TTable>[]
	]>(...columns: TColumns): ConnectedSelectBuilder<TSchema, TTable, TColumns>;
	/** Creates an INSERT query with type-safe data validation */
	insert(data: InsertData<TTable>): ConnectedInsertBuilder<TTable>;
	/** Creates an UPDATE query with type-safe data validation */
	update(data: UpdateData<TTable>): ConnectedUpdateBuilder<TTable>;
	/** Creates a DELETE query */
	delete(): ConnectedDeleteBuilder<TTable>;
	/** Creates a COUNT query */
	count(): ConnectedCountBuilder<TTable, {}>;
	/** Creates a standalone AGGREGATE query */
	aggregate(): ConnectedAggregateBuilder<TTable>;
	/** Find a record by its primary key */
	findById<T = TTable extends {
		$inferSelect: infer S;
	} ? S : any>(id: string | number): Promise<T | null>;
	/** Find first record matching filter object */
	findOne<T = TTable extends {
		$inferSelect: infer S;
	} ? S : any>(filter: Partial<TTable extends {
		$inferInsert: infer I;
	} ? I : Record<string, any>>): Promise<T | null>;
	/** Find all records matching filter object */
	findMany<T = TTable extends {
		$inferSelect: infer S;
	} ? S : any>(filter: Partial<TTable extends {
		$inferInsert: infer I;
	} ? I : Record<string, any>>): Promise<T[]>;
	/** Check if any records exist matching filter */
	exists(filter: Partial<TTable extends {
		$inferInsert: infer I;
	} ? I : Record<string, any>>): Promise<boolean>;
	/** Insert or update a record (upsert) */
	upsert<T = TTable extends {
		$inferSelect: infer S;
	} ? S : any>(options: {
		where: Partial<TTable extends {
			$inferInsert: infer I;
		} ? I : Record<string, any>>;
		create: TTable extends {
			$inferInsert: infer I;
		} ? I : Record<string, any>;
		update: Partial<TTable extends {
			$inferInsert: infer I;
		} ? I : Record<string, any>>;
	}): Promise<T>;
	/**
	 * Insert multiple records at once.
	 * Returns a ConnectedInsertBuilder so you can chain
	 * `.doNothing()`, `.doUpdate()`, `.returning()`, and `.run()`.
	 *
	 * @example
	 * ```typescript
	 * // Standard insert (returns row count)
	 * await db.table.users.insertMany([...]).run()
	 *
	 * // With conflict resolution
	 * await db.table.users.insertMany([...]).doNothing('email').run()
	 *
	 * // With RETURNING
	 * const users = await db.table.users.insertMany([...]).returning('*').run()
	 * ```
	 */
	insertMany(rows: Array<TTable extends {
		$inferInsert: infer I;
	} ? I : Record<string, any>>): Omit<ConnectedInsertBuilder<TTable>, "addRow" | "addRows" | "clear" | "total">;
	/**
	 * INSERT INTO ... SELECT — insert rows from a SELECT query.
	 * Returns a builder so you can chain `.doNothing()`, `.doUpdate()`,
	 * `.returning()`, and `.run()`.
	 *
	 * @param columns - Target columns to insert into
	 * @param selectCallback - Callback receiving schema tables, returns a select query
	 *
	 * @example
	 * ```typescript
	 * // Archive inactive users
	 * await db.table.archivedUsers.insertFrom(
	 *     ['name', 'email', 'createdAt'],
	 *     t => t.users.select('name', 'email', 'createdAt')
	 *       .where(q => q.equal('status', 'inactive'))
	 * ).run()
	 *
	 * // With conflict resolution
	 * await db.table.archive.insertFrom(
	 *     ['email'],
	 *     t => t.users.select('email')
	 * ).doNothing('email').run()
	 *
	 * // With RETURNING
	 * const rows = await db.table.archive.insertFrom(
	 *     ['name', 'email'],
	 *     t => t.users.select('name', 'email')
	 * ).returning('*').run()
	 * ```
	 */
	insertFrom(columns: ColumnName<TTable>[], selectCallback: (t: {
		[K in keyof TSchema & string]: ConnectedQueryBuilder<TSchema, TSchema[K]>;
	}) => {
		toString(): string;
	}): ConnectedInsertFromSelectBuilder<TTable>;
	/** Advanced paginate with multiple modes and type-safe column selection */
	paginate<T = TTable extends {
		$inferSelect: infer S;
	} ? S : Record<string, unknown>>(options?: {
		columns?: ColumnName<TTable>[];
		where?: (q: TypedConditionBuilder<TTable>) => TypedConditionBuilder<TTable>;
		orderBy?: [
			ColumnName<TTable>,
			"ASC" | "DESC"
		] | Array<[
			ColumnName<TTable>,
			"ASC" | "DESC"
		]>;
	}): PaginateBuilder<TSchema, TTable, T>;
	/**
	 * Create a parent record with nested related records in a transaction.
	 * Automatically resolves FK relationships and sets FK values on children.
	 *
	 * Requires `relations` config for FK auto-resolution.
	 *
	 * @param options - `data` for the parent row, plus relation keys with child data
	 * @returns The inserted parent row
	 *
	 * @example
	 * ```typescript
	 * // Create user with posts and profile in one transaction
	 * const user = await db.table.users.createWith({
	 *     data: { name: 'John', email: 'john@example.com' },
	 *     with: {
	 *         posts: [
	 *             { title: 'Hello', content: 'World' },
	 *             { title: 'Second', content: 'Post' }
	 *         ],
	 *         profile: { bio: 'Developer' }
	 *     }
	 * })
	 * // Inserts: user → posts with userId set → profile with userId set
	 * ```
	 */
	createWith<T = TTable extends {
		$inferSelect: infer S;
	} ? S : any>(options: {
		data: TTable extends {
			$inferInsert: infer I;
		} ? I : Record<string, any>;
		with: Record<string, Record<string, any> | Record<string, any>[]>;
	}): Promise<T>;
	/** Soft delete a record (set deleted_at timestamp) */
	softDelete<T = TTable extends {
		$inferSelect: infer S;
	} ? S : any>(filter: Partial<TTable extends {
		$inferInsert: infer I;
	} ? I : Record<string, any>>): Promise<T | null>;
	/** Restore a soft-deleted record (clear deleted_at) */
	restore<T = TTable extends {
		$inferSelect: infer S;
	} ? S : any>(filter: Partial<TTable extends {
		$inferInsert: infer I;
	} ? I : Record<string, any>>): Promise<T | null>;
}
type Simplify$1<T> = {
	[K in keyof T]: T[K];
} & {};
/**
 * Helper type: Infer result type from schema and columns
 * - If schema provided and columns specified → use schema types
 * - If no schema → use InferredResult (columns with 'any' types)
 * - If no columns (SELECT *) → use $inferSelect from table definition
 */
export type InferResultType<TSchema, TTable, TColumns> = TColumns extends [
] ? TTable extends {
	$inferSelect: infer TSelect;
} ? TSelect : TTable : string extends keyof TSchema ? TColumns extends readonly (string | [
	string,
	string
])[] ? ColumnsToObjectWithAggregates<TColumns> : any : TTable extends {
	$inferSelect: infer TSelect;
} ? TColumns extends readonly string[] ? Simplify$1<Pick<TSelect, Extract<TColumns[number], keyof TSelect>>> : TSelect : SelectResult<TTable, TColumns extends readonly any[] ? TColumns : [
]>;
/**
 * Join callback function type for join/innerJoin/leftJoin.
 * The joined table proxy comes FIRST for natural DX:
 * when you write `.join('orders', ...)`, `orders` is what you think about first.
 *
 * @param on - The condition builder for ON clause
 * @param joined - Table proxy for the joined table (the one in .join('tableName'))
 * @param source - Table proxy for the source table (the one .join() is called on)
 *
 * @example
 * ```typescript
 * db.table.users.select()
 *   .join('orders', (on, orders, users) =>
 *     on.equal(orders.userId, users.id)
 *       .select(['id', 'total'])
 *   )
 * ```
 */
export type JoinCallback<TLeft, TRight, TResult = TRight> = (on: JoinConditionBuilder<TLeft, TRight>, joined: TableProxy<TRight>, source: TableProxy<TLeft>) => JoinConditionBuilder<TLeft, TResult>;
/**
 * Right join callback — reversed parameter order from JoinCallback.
 * For rightJoin, the source table comes first since the right (joined) table
 * is the primary table in a RIGHT JOIN.
 *
 * @param on - The condition builder for ON clause
 * @param source - Table proxy for the source table
 * @param joined - Table proxy for the joined (right/primary) table
 *
 * @example
 * ```typescript
 * db.table.users.select()
 *   .rightJoin('orders', (on, users, orders) =>
 *     on.equal(users.id, orders.userId)
 *   )
 * ```
 */
export type RightJoinCallback<TLeft, TRight, TResult = TRight> = (on: JoinConditionBuilder<TLeft, TRight>, source: TableProxy<TLeft>, joined: TableProxy<TRight>) => JoinConditionBuilder<TLeft, TResult>;
/**
 * JoinMany callback function type for LATERAL subqueries.
 * Same parameter order as JoinCallback: joined table first, source second.
 *
 * @param on - The condition builder for LATERAL subquery
 * @param joined - Table proxy for the joined table
 * @param source - Table proxy for the source (outer) table
 *
 * @example
 * ```typescript
 * // Get top 5 orders per user
 * db.table.users.select()
 *   .joinMany('orders', (on, orders, users) =>
 *     on.equal(orders.userId, users.id)
 *       .where(q => q.equal('status', 'completed'))
 *       .orderBy(orders.createdAt, 'DESC')
 *       .limit(5)
 *   )
 * ```
 */
export type JoinManyCallback<TSchema, TLeft, TRight, TRightKey extends string, TResult = TRight> = (on: JoinManyConditionBuilder<TSchema, TLeft, TRight, TRightKey>, joined: TableProxy<TRight>, source: TableProxy<TLeft>) => JoinManyConditionBuilder<TSchema, TLeft, TResult, TRightKey>;
/**
 * JoinMany through callback - for `{ through }` junction table pattern.
 * Only receives the condition builder (no table proxies needed)
 * since FK auto-resolves both join conditions.
 *
 * Used purely for shaping: `.where()`, `.orderBy()`, `.limit()`, `.select()`
 *
 * @example
 * ```typescript
 * db.table.items.select()
 *   .leftJoinMany('labels', { through: 'itemLabels' }, on =>
 *     on.where(q => q.equal('active', true))
 *       .orderBy('name', 'ASC')
 *       .limit(10)
 *       .select('id', 'name', 'color')
 *   )
 * ```
 */
export type JoinManyThroughCallback<TSchema, TLeft, TRight, TRightKey extends string, TResult = TRight> = (on: JoinManyConditionBuilder<TSchema, TLeft, TRight, TRightKey>) => JoinManyConditionBuilder<TSchema, TLeft, TResult, TRightKey>;
/**
 * Internal interface for query builders
 * This interface exposes execution methods that are hidden from the public API
 * @internal
 */
export interface RelqInternal {
	executeSelect<T = any>(sql: string, tableName?: string): Promise<RelqResult<T[]>>;
	executeSelectOne<T = any>(sql: string, tableName?: string): Promise<RelqResult<T | null>>;
	executeCount(sql: string): Promise<RelqCount>;
	executeRun(sql: string): Promise<RelqRun>;
	executeQuery(sql: string): Promise<{
		result: DriverQueryResult;
		duration: number;
	}>;
	transformToDbColumns(tableName: string, data: Record<string, any>): Record<string, any>;
	transformFromDbColumns(tableName: string, data: Record<string, any>): Record<string, any>;
	transformResultsFromDb<T>(tableName: string, rows: any[]): T[];
	hasColumnMapping(): boolean;
	/** Get a client for cursor operations. Returns { client, release } - must call release() when done */
	getClientForCursor(): Promise<{
		client: any;
		release: () => void;
	}>;
	/** Validate data against schema constraints */
	validateData(tableName: string, data: Record<string, unknown>, operation: "insert" | "update"): void;
	/** Configuration for debug and other settings */
	config?: RelqConfig;
	/** Get the schema object for type-safe joins */
	getSchema(): Record<string, any> | undefined;
	/** Get the relations object for FK auto-resolution */
	getRelations(): SchemaRelations | SchemaRelationsArray | undefined;
	/** Get table definition by schema key */
	getTableDef(tableKey: string): TableDefinition<any> | undefined;
}
/**
 * @internal Base paging pagination (always present)
 */
export type PagingBase = {
	page: number;
	perPage: number;
	total: number;
	totalPages: number;
};
/**
 * @internal Paging with next
 */
export type PagingHasNext<T> = {
	hasNext: true;
	nextPage: number;
	loadNext: () => Promise<PagingPaginatedResult<T>>;
};
/**
 * @internal Paging without next
 */
export type PagingNoNext = {
	hasNext: false;
};
/**
 * @internal Paging with prev
 */
export type PagingHasPrev<T> = {
	hasPrev: true;
	prevPage: number;
	loadPrev: () => Promise<PagingPaginatedResult<T>>;
};
/**
 * @internal Paging without prev
 */
export type PagingNoPrev = {
	hasPrev: false;
};
/**
 * Paging mode pagination result - discriminated union
 */
export type PagingPaginatedResult<T> = {
	data: T[];
	pagination: PagingBase & (PagingHasNext<T> | PagingNoNext) & (PagingHasPrev<T> | PagingNoPrev);
};
/**
 * @internal Base offset pagination (always present)
 */
export type OffsetBase = {
	position: number;
	limit: number;
	total: number;
};
/**
 * @internal Offset with more
 */
export type OffsetHasMore<T> = {
	hasMore: true;
	nextPos: number;
	loadNext: () => Promise<OffsetPaginatedResult<T>>;
};
/**
 * @internal Offset without more
 */
export type OffsetNoMore = {
	hasMore: false;
};
/**
 * @internal Offset with prev
 */
export type OffsetHasPrev<T> = {
	hasPrev: true;
	prevPos: number;
	loadPrev: () => Promise<OffsetPaginatedResult<T>>;
};
/**
 * @internal Offset without prev
 */
export type OffsetNoPrev = {
	hasPrev: false;
};
/**
 * Offset mode pagination result - discriminated union
 */
export type OffsetPaginatedResult<T> = {
	data: T[];
	pagination: OffsetBase & (OffsetHasMore<T> | OffsetNoMore) & (OffsetHasPrev<T> | OffsetNoPrev);
};
/**
 * Unified pagination result type (for generic use)
 */
export type PaginatedResult<T> = PagingPaginatedResult<T> | OffsetPaginatedResult<T>;
/**
 * TableAccessor type - callable function with table properties
 * Enables both db.table('users') and db.table.users syntax
 */
export type TableAccessor<TSchema, TRelq> = {
	<TTable extends keyof TSchema & string>(tableName: TTable): ConnectedQueryBuilder<TSchema, TSchema[TTable]>;
} & {
	[K in keyof TSchema & string]: ConnectedQueryBuilder<TSchema, TSchema[K]>;
};
declare class SqlExpression$1<T = any> {
	/** The raw SQL string for this expression */
	readonly sql: string;
	/** @internal Brand to distinguish from plain objects */
	readonly _isSqlExpression: true;
	constructor(
	/** The raw SQL string for this expression */
	sql: string);
}
declare class AggregateFunctions {
	/**
	 * COUNT - count rows or non-null values.
	 *
	 * @param ref - Optional column reference. If omitted, uses COUNT(*)
	 * @returns SqlExpression<number>
	 *
	 * @example
	 * ```typescript
	 * a.count()              // COUNT(*)
	 * a.count(t.items.id)    // COUNT("items"."id")
	 * ```
	 */
	count(ref?: ColumnRef): SqlExpression$1<number>;
	/**
	 * COUNT DISTINCT - count unique non-null values.
	 *
	 * @param ref - Column reference to count distinct values of
	 * @returns SqlExpression<number>
	 *
	 * @example
	 * ```typescript
	 * a.countDistinct(t.orders.userId)  // COUNT(DISTINCT "orders"."user_id")
	 * ```
	 */
	countDistinct(ref: ColumnRef): SqlExpression$1<number>;
	/**
	 * SUM - sum numeric values.
	 *
	 * @param ref - Column reference to sum
	 * @returns SqlExpression<number>
	 *
	 * @example
	 * ```typescript
	 * a.sum(t.orders.amount)  // SUM("orders"."amount")
	 * ```
	 */
	sum(ref: ColumnRef): SqlExpression$1<number>;
	/**
	 * AVG - average numeric values.
	 *
	 * @param ref - Column reference to average
	 * @returns SqlExpression<number>
	 *
	 * @example
	 * ```typescript
	 * a.avg(t.reviews.score)  // AVG("reviews"."score")
	 * ```
	 */
	avg(ref: ColumnRef): SqlExpression$1<number>;
	/**
	 * MIN - minimum value. Return type matches the column type.
	 *
	 * @param ref - Column reference
	 * @returns SqlExpression<T> where T is the column's type
	 *
	 * @example
	 * ```typescript
	 * a.min(t.orders.amount)     // MIN("orders"."amount") → number
	 * a.min(t.orders.createdAt)  // MIN("orders"."created_at") → Date
	 * ```
	 */
	min<T>(ref: ColumnRef<any, string, T>): SqlExpression$1<T>;
	/**
	 * MAX - maximum value. Return type matches the column type.
	 *
	 * @param ref - Column reference
	 * @returns SqlExpression<T> where T is the column's type
	 *
	 * @example
	 * ```typescript
	 * a.max(t.orders.amount)     // MAX("orders"."amount") → number
	 * a.max(t.orders.createdAt)  // MAX("orders"."created_at") → Date
	 * ```
	 */
	max<T>(ref: ColumnRef<any, string, T>): SqlExpression$1<T>;
	/**
	 * Raw SQL expression with explicit type.
	 * Escape hatch for any SQL expression not covered by built-in methods.
	 *
	 * @param sql - Raw SQL string
	 * @returns SqlExpression<T>
	 *
	 * @example
	 * ```typescript
	 * a.raw<number>('EXTRACT(YEAR FROM "orders"."created_at")')
	 * a.raw<string>(`CONCAT("users"."first_name", ' ', "users"."last_name")`)
	 * ```
	 */
	raw<T = any>(sql: string): SqlExpression$1<T>;
}
type Prettify$2<T> = {
	[K in keyof T]: T[K];
} & {};
/**
 * Helper type to extract row type from a table definition.
 * Supports schemas with `$inferSelect` or `$columns` metadata.
 */
export type InferRowType<TTable> = TTable extends {
	$inferSelect: infer TSelect;
} ? Prettify$2<TSelect> : TTable extends {
	$columns: infer TCols;
} ? Prettify$2<{
	[K in keyof TCols]: any;
}> : TTable;
/**
 * Create a nested join result type: `{ [alias]: JoinedTableType }`.
 * Used for INNER JOIN and RIGHT JOIN where the joined row is always present.
 */
export type NestedJoin<TAlias extends string, TJoinedTable> = {
	[K in TAlias]: InferRowType<TJoinedTable>;
};
/**
 * Create a nested LEFT JOIN result type: `{ [alias]: JoinedTableType | null }`.
 * The joined row may be null when no match is found.
 */
export type NestedLeftJoin<TAlias extends string, TJoinedTable> = {
	[K in TAlias]: InferRowType<TJoinedTable> | null;
};
/**
 * Create a nested JOIN MANY result type: `{ [alias]: JoinedTableType[] }`.
 * Used for one-to-many joins via LATERAL subqueries.
 */
export type NestedJoinMany<TAlias extends string, TJoinedTable> = {
	[K in TAlias]: InferRowType<TJoinedTable>[];
};
/**
 * Infer result types from an `.include()` callback return value.
 * Extracts the phantom type `T` from each `SqlExpression<T>`.
 *
 * @example
 * ```typescript
 * // Given: { itemCount: SqlExpression<number>, lastOrder: SqlExpression<Date> }
 * // Produces: { itemCount: number, lastOrder: Date }
 * ```
 */
export type InferIncludeResult<T extends Record<string, SqlExpression$1<any>>> = {
	[K in keyof T]: T[K] extends SqlExpression$1<infer U> ? U : any;
};
declare class ConnectedSelectBuilder<TSchema = any, TTable = any, TColumns extends readonly any[] = any, TJoined = {}> {
	private builder;
	private relq;
	private tableName;
	private columns?;
	/** Schema key (camelCase) - used for join callback params */
	private schemaKey?;
	constructor(builder: SelectBuilder, relq: RelqBase<TSchema>, tableName: string, columns?: (string | Array<string | [
		string,
		string
	]>) | undefined, 
	/** Schema key (camelCase) - used for join callback params */
	schemaKey?: string | undefined);
	/** @internal */
	private get joinCtx();
	/** @internal */
	private get paginationCtx();
	/**
	 * Set up column resolver to transform property names to SQL column names.
	 * Uses schema metadata to resolve column names.
	 * @internal
	 */
	private setupColumnResolver;
	/**
	 * Transform nested join results from DB column names to schema property names.
	 * Uses schema metadata to resolve column names for each joined table.
	 * @internal
	 */
	private transformJoinResults;
	/**
	 * Transform a single nested object using the column mapping.
	 * @internal
	 */
	private transformNestedObject;
	/**
	 * Coerce a JSON-serialized value back to its proper JS type.
	 * row_to_json() serializes timestamps as strings and bigints as numbers.
	 * @internal
	 */
	private coerceValue;
	where(callback: (q: TypedConditionBuilder<TTable>) => TypedConditionBuilder<TTable>): this;
	orderBy(column: ColumnName<TTable>, direction?: "ASC" | "DESC"): this;
	/**
	 * Order by with explicit NULLS FIRST or NULLS LAST placement.
	 * PostgreSQL-specific ordering control for NULL values.
	 *
	 * @param column - Column to order by (type-safe)
	 * @param direction - 'ASC' or 'DESC'
	 * @param nulls - 'FIRST' puts NULLs at the beginning, 'LAST' puts them at the end
	 *
	 * @example
	 * ```typescript
	 * // NULLs at end for ascending order
	 * db.table.users.select()
	 *   .orderByNulls('deletedAt', 'ASC', 'LAST')
	 *   .all()
	 * // SQL: ORDER BY "deleted_at" ASC NULLS LAST
	 *
	 * // NULLs at start for descending order
	 * db.table.posts.select()
	 *   .orderByNulls('publishedAt', 'DESC', 'FIRST')
	 *   .all()
	 * // SQL: ORDER BY "published_at" DESC NULLS FIRST
	 * ```
	 */
	orderByNulls(column: ColumnName<TTable>, direction: "ASC" | "DESC", nulls: "FIRST" | "LAST"): this;
	limit(count: number): this;
	offset(count: number): this;
	groupBy(...columns: ColumnName<TTable>[]): this;
	having(callback: any): this;
	/**
	 * Add computed columns (aggregates, expressions) to the result.
	 * Uses a callback with aggregate functions and table proxies.
	 *
	 * The callback receives:
	 * - `a` — Aggregate/expression builder (count, sum, avg, min, max, raw)
	 * - `t` — Table proxy map for all schema tables (source + joined)
	 *
	 * Results are merged flat into the row type alongside `.select()` columns.
	 * Requires `.groupBy()` on non-aggregate columns when using aggregate functions.
	 *
	 * @example
	 * ```typescript
	 * // Count items per folder
	 * db.table.folders.select('id', 'name')
	 *   .include((a, t) => ({
	 *     itemCount: a.count(t.items.id),
	 *   }))
	 *   .leftJoin('items')
	 *   .groupBy('id')
	 *   .all()
	 * // Result: { id: string, name: string, itemCount: number }[]
	 *
	 * // Multiple aggregates
	 * db.table.users.select('id', 'name')
	 *   .include((a, t) => ({
	 *     orderCount: a.count(t.orders.id),
	 *     totalSpent: a.sum(t.orders.amount),
	 *     lastOrder: a.max(t.orders.createdAt),
	 *   }))
	 *   .leftJoin('orders')
	 *   .groupBy('id')
	 *   .all()
	 *
	 * // Raw SQL expression
	 * db.table.users.select('id')
	 *   .include((a) => ({
	 *     year: a.raw<number>('EXTRACT(YEAR FROM NOW())'),
	 *   }))
	 *   .all()
	 * ```
	 */
	include<TInclude extends Record<string, SqlExpression$1<any>>>(callback: (a: AggregateFunctions, t: {
		[K in keyof TSchema & string]: TableProxy<TSchema[K]>;
	}) => TInclude): ConnectedSelectBuilder<TSchema, TTable, TColumns, TJoined & InferIncludeResult<TInclude>>;
	/**
	 * Type-safe INNER JOIN.
	 *
	 * Can be called with or without a callback:
	 * - Without callback: Auto-resolves FK from relations config
	 * - With callback: Explicit join conditions
	 *
	 * @example
	 * ```typescript
	 * // Auto FK detection (requires relations config)
	 * db.table.orders.select()
	 *   .join('users')  // Auto-detects orders.userId → users.id
	 * // Result: { ...order, users: { id, name, ... } }
	 *
	 * // With explicit callback — joined table first, source second
	 * db.table.orders.select()
	 *   .join('users', (on, users, orders) =>
	 *     on.equal(users.id, orders.userId)
	 *   )
	 *
	 * // With alias
	 * db.table.orders.select()
	 *   .join(['users', 'user'], (on, user, orders) =>
	 *     on.equal(user.id, orders.userId)
	 *   )
	 * // Result: { ...order, user: { id, name, ... } }
	 * ```
	 */
	join<TRightKey extends keyof TSchema & string, TAlias extends string>(tableAndAlias: [
		TRightKey,
		TAlias
	]): ConnectedSelectBuilder<TSchema, TTable, TColumns, TJoined & NestedJoin<TAlias, TSchema[TRightKey]>>;
	join<TRightKey extends keyof TSchema & string>(table: TRightKey): ConnectedSelectBuilder<TSchema, TTable, TColumns, TJoined & NestedJoin<TRightKey, TSchema[TRightKey]>>;
	join<TRightKey extends keyof TSchema & string, TAlias extends string, TResult>(tableAndAlias: [
		TRightKey,
		TAlias
	], callback: JoinCallback<TTable, TSchema[TRightKey], TResult>): ConnectedSelectBuilder<TSchema, TTable, TColumns, TJoined & NestedJoin<TAlias, TResult>>;
	join<TRightKey extends keyof TSchema & string, TResult>(table: TRightKey, callback: JoinCallback<TTable, TSchema[TRightKey], TResult>): ConnectedSelectBuilder<TSchema, TTable, TColumns, TJoined & NestedJoin<TRightKey, TResult>>;
	/**
	 * Type-safe LEFT JOIN.
	 * Joined table may be null if no match found.
	 *
	 * @example
	 * ```typescript
	 * // Auto FK detection
	 * db.table.orders.select()
	 *   .leftJoin('users')
	 * // Result: { ...order, users: { ... } | null }
	 *
	 * // With callback — joined table first, source second
	 * db.table.orders.select()
	 *   .leftJoin(['users', 'user'], (on, user, orders) =>
	 *     on.equal(user.id, orders.userId)
	 *   )
	 * ```
	 */
	leftJoin<TRightKey extends keyof TSchema & string, TAlias extends string>(tableAndAlias: [
		TRightKey,
		TAlias
	]): ConnectedSelectBuilder<TSchema, TTable, TColumns, TJoined & NestedLeftJoin<TAlias, TSchema[TRightKey]>>;
	leftJoin<TRightKey extends keyof TSchema & string>(table: TRightKey): ConnectedSelectBuilder<TSchema, TTable, TColumns, TJoined & NestedLeftJoin<TRightKey, TSchema[TRightKey]>>;
	leftJoin<TRightKey extends keyof TSchema & string, TAlias extends string, TResult>(tableAndAlias: [
		TRightKey,
		TAlias
	], callback: JoinCallback<TTable, TSchema[TRightKey], TResult>): ConnectedSelectBuilder<TSchema, TTable, TColumns, TJoined & NestedLeftJoin<TAlias, TResult>>;
	leftJoin<TRightKey extends keyof TSchema & string, TResult>(table: TRightKey, callback: JoinCallback<TTable, TSchema[TRightKey], TResult>): ConnectedSelectBuilder<TSchema, TTable, TColumns, TJoined & NestedLeftJoin<TRightKey, TResult>>;
	/**
	 * Type-safe RIGHT JOIN.
	 * Callback order is (on, source, joined) — reversed from join/leftJoin
	 * because in a RIGHT JOIN the joined table is the primary table.
	 *
	 * @example
	 * ```typescript
	 * db.table.orders.select()
	 *   .rightJoin('users', (on, orders, users) =>
	 *     on.equal(orders.userId, users.id)
	 *   )
	 * ```
	 */
	rightJoin<TRightKey extends keyof TSchema & string, TAlias extends string>(tableAndAlias: [
		TRightKey,
		TAlias
	]): ConnectedSelectBuilder<TSchema, TTable, TColumns, TJoined & NestedJoin<TAlias, TSchema[TRightKey]>>;
	rightJoin<TRightKey extends keyof TSchema & string>(table: TRightKey): ConnectedSelectBuilder<TSchema, TTable, TColumns, TJoined & NestedJoin<TRightKey, TSchema[TRightKey]>>;
	rightJoin<TRightKey extends keyof TSchema & string, TAlias extends string>(tableAndAlias: [
		TRightKey,
		TAlias
	], callback: RightJoinCallback<TTable, TSchema[TRightKey]>): ConnectedSelectBuilder<TSchema, TTable, TColumns, TJoined & NestedJoin<TAlias, TSchema[TRightKey]>>;
	rightJoin<TRightKey extends keyof TSchema & string>(table: TRightKey, callback: RightJoinCallback<TTable, TSchema[TRightKey]>): ConnectedSelectBuilder<TSchema, TTable, TColumns, TJoined & NestedJoin<TRightKey, TSchema[TRightKey]>>;
	/**
	 * Type-safe INNER JOIN (alias for join()).
	 */
	innerJoin<TRightKey extends keyof TSchema & string, TAlias extends string>(tableAndAlias: [
		TRightKey,
		TAlias
	]): ConnectedSelectBuilder<TSchema, TTable, TColumns, TJoined & NestedJoin<TAlias, TSchema[TRightKey]>>;
	innerJoin<TRightKey extends keyof TSchema & string>(table: TRightKey): ConnectedSelectBuilder<TSchema, TTable, TColumns, TJoined & NestedJoin<TRightKey, TSchema[TRightKey]>>;
	innerJoin<TRightKey extends keyof TSchema & string, TAlias extends string>(tableAndAlias: [
		TRightKey,
		TAlias
	], callback: JoinCallback<TTable, TSchema[TRightKey]>): ConnectedSelectBuilder<TSchema, TTable, TColumns, TJoined & NestedJoin<TAlias, TSchema[TRightKey]>>;
	innerJoin<TRightKey extends keyof TSchema & string>(table: TRightKey, callback: JoinCallback<TTable, TSchema[TRightKey]>): ConnectedSelectBuilder<TSchema, TTable, TColumns, TJoined & NestedJoin<TRightKey, TSchema[TRightKey]>>;
	/**
	 * Join a subquery as a derived table.
	 * Useful for complex queries that need to be joined.
	 *
	 * @param alias - Alias for the subquery result
	 * @param subquery - SQL string or builder with toString()
	 * @param onClause - ON clause SQL string
	 *
	 * @example
	 * ```typescript
	 * // Join a subquery with payments
	 * db.table.users.select()
	 *   .joinSubquery(
	 *     'recent_orders',
	 *     db.table.orders.select().join('payments', (on, p, o) =>
	 *       on.equal(p.orderId, o.id)
	 *     ),
	 *     `"recent_orders"."user_id" = "users"."id"`
	 *   )
	 *
	 * // Or with raw SQL
	 * db.table.users.select()
	 *   .joinSubquery(
	 *     'stats',
	 *     `SELECT user_id, COUNT(*) as order_count FROM orders GROUP BY user_id`,
	 *     `"stats"."user_id" = "users"."id"`
	 *   )
	 * ```
	 */
	joinSubquery<TAlias extends string>(alias: TAlias, subquery: {
		toString(): string;
	} | string, onClause: string): ConnectedSelectBuilder<TSchema, TTable, TColumns, TJoined & {
		[K in TAlias]: Record<string, unknown>;
	}>;
	/**
	 * Left join a subquery as a derived table.
	 * Returns null for the subquery result if no match found.
	 *
	 * @param alias - Alias for the subquery result
	 * @param subquery - SQL string or builder with toString()
	 * @param onClause - ON clause SQL string
	 */
	leftJoinSubquery<TAlias extends string>(alias: TAlias, subquery: {
		toString(): string;
	} | string, onClause: string): ConnectedSelectBuilder<TSchema, TTable, TColumns, TJoined & {
		[K in TAlias]: Record<string, unknown> | null;
	}>;
	/**
	 * Type-safe one-to-many JOIN using LATERAL subquery.
	 * Returns an array of related rows for each parent row.
	 *
	 * Uses PostgreSQL LATERAL to efficiently fetch related rows with
	 * ordering and limiting per parent row.
	 *
	 * **Dialect Support:**
	 * | Dialect     | Supported | Notes |
	 * |-------------|-----------|-------|
	 * | PostgreSQL  | ✅        | Native LATERAL support |
	 * | CockroachDB | ✅        | Native LATERAL support |
	 * | Nile        | ✅        | Native LATERAL support |
	 * | AWS DSQL    | ❌        | Use separate queries |
	 * | MySQL       | ❌        | Use separate queries |
	 * | SQLite      | ❌        | Use separate queries |
	 *
	 * @param tableOrAlias - Table name or [tableName, alias] tuple
	 * @param callback - Join condition callback: `(on, joined, source) => on.equal(...)`
	 * @throws {RelqConfigError} If dialect doesn't support LATERAL joins
	 *
	 * @example
	 * ```typescript
	 * // Get top 5 orders per user — joined table first, source second
	 * db.table.users.select()
	 *   .joinMany('orders', (on, orders, users) =>
	 *     on.equal(orders.userId, users.id)
	 *       .where(q => q.equal('status', 'completed'))
	 *       .orderBy('createdAt', 'DESC')
	 *       .limit(5)
	 *   )
	 *   .all()
	 * // Result: Array<{ ...User, orders: Order[] }>
	 *
	 * // With alias
	 * db.table.users.select()
	 *   .joinMany(['orders', 'recentOrders'], (on, orders, users) =>
	 *     on.equal(orders.userId, users.id)
	 *       .orderBy('createdAt', 'DESC')
	 *       .limit(3)
	 *   )
	 * // Result: Array<{ ...User, recentOrders: Order[] }>
	 * ```
	 */
	joinMany<TRightKey extends keyof TSchema & string, TAlias extends string, TResult>(tableAndAlias: [
		TRightKey,
		TAlias
	], options: {
		through: keyof TSchema & string;
	}, callback: JoinManyThroughCallback<TSchema, TTable, TSchema[TRightKey], TRightKey, TResult>): ConnectedSelectBuilder<TSchema, TTable, TColumns, TJoined & NestedJoinMany<TAlias, TResult>>;
	joinMany<TRightKey extends keyof TSchema & string, TResult>(table: TRightKey, options: {
		through: keyof TSchema & string;
	}, callback: JoinManyThroughCallback<TSchema, TTable, TSchema[TRightKey], TRightKey, TResult>): ConnectedSelectBuilder<TSchema, TTable, TColumns, TJoined & NestedJoinMany<TRightKey, TResult>>;
	joinMany<TRightKey extends keyof TSchema & string, TAlias extends string>(tableAndAlias: [
		TRightKey,
		TAlias
	], options: {
		through: keyof TSchema & string;
	}): ConnectedSelectBuilder<TSchema, TTable, TColumns, TJoined & NestedJoinMany<TAlias, TSchema[TRightKey]>>;
	joinMany<TRightKey extends keyof TSchema & string>(table: TRightKey, options: {
		through: keyof TSchema & string;
	}): ConnectedSelectBuilder<TSchema, TTable, TColumns, TJoined & NestedJoinMany<TRightKey, TSchema[TRightKey]>>;
	joinMany<TRightKey extends keyof TSchema & string, TAlias extends string, TResult>(tableAndAlias: [
		TRightKey,
		TAlias
	], callback: JoinManyCallback<TSchema, TTable, TSchema[TRightKey], TRightKey, TResult>): ConnectedSelectBuilder<TSchema, TTable, TColumns, TJoined & NestedJoinMany<TAlias, TResult>>;
	joinMany<TRightKey extends keyof TSchema & string, TResult>(table: TRightKey, callback: JoinManyCallback<TSchema, TTable, TSchema[TRightKey], TRightKey, TResult>): ConnectedSelectBuilder<TSchema, TTable, TColumns, TJoined & NestedJoinMany<TRightKey, TResult>>;
	/**
	 * Type-safe one-to-many LEFT JOIN using LATERAL subquery.
	 * Returns an array of related rows (empty array if no matches).
	 *
	 * **Dialect Support:**
	 * | Dialect     | Supported | Notes |
	 * |-------------|-----------|-------|
	 * | PostgreSQL  | ✅        | Native LATERAL support |
	 * | CockroachDB | ✅        | Native LATERAL support |
	 * | Nile        | ✅        | Native LATERAL support |
	 * | AWS DSQL    | ❌        | Use separate queries |
	 * | MySQL       | ❌        | Use separate queries |
	 * | SQLite      | ❌        | Use separate queries |
	 *
	 * @param tableOrAlias - Table name or [tableName, alias] tuple
	 * @param callback - Join condition callback: `(on, joined, source) => on.equal(...)`
	 * @throws {RelqConfigError} If dialect doesn't support LATERAL joins
	 *
	 * @example
	 * ```typescript
	 * // Get all users with their orders (empty array if no orders)
	 * db.table.users.select()
	 *   .leftJoinMany('orders', (on, orders, users) =>
	 *     on.equal(orders.userId, users.id)
	 *       .where(q => q.equal('status', 'completed'))
	 *   )
	 *   .all()
	 * // Result: Array<{ ...User, orders: Order[] }>
	 * // orders is [] if user has no matching orders
	 * ```
	 */
	leftJoinMany<TRightKey extends keyof TSchema & string, TAlias extends string, TResult>(tableAndAlias: [
		TRightKey,
		TAlias
	], options: {
		through: keyof TSchema & string;
	}, callback: JoinManyThroughCallback<TSchema, TTable, TSchema[TRightKey], TRightKey, TResult>): ConnectedSelectBuilder<TSchema, TTable, TColumns, TJoined & NestedJoinMany<TAlias, TResult>>;
	leftJoinMany<TRightKey extends keyof TSchema & string, TResult>(table: TRightKey, options: {
		through: keyof TSchema & string;
	}, callback: JoinManyThroughCallback<TSchema, TTable, TSchema[TRightKey], TRightKey, TResult>): ConnectedSelectBuilder<TSchema, TTable, TColumns, TJoined & NestedJoinMany<TRightKey, TResult>>;
	leftJoinMany<TRightKey extends keyof TSchema & string, TAlias extends string>(tableAndAlias: [
		TRightKey,
		TAlias
	], options: {
		through: keyof TSchema & string;
	}): ConnectedSelectBuilder<TSchema, TTable, TColumns, TJoined & NestedJoinMany<TAlias, TSchema[TRightKey]>>;
	leftJoinMany<TRightKey extends keyof TSchema & string>(table: TRightKey, options: {
		through: keyof TSchema & string;
	}): ConnectedSelectBuilder<TSchema, TTable, TColumns, TJoined & NestedJoinMany<TRightKey, TSchema[TRightKey]>>;
	leftJoinMany<TRightKey extends keyof TSchema & string, TAlias extends string, TResult>(tableAndAlias: [
		TRightKey,
		TAlias
	], callback: JoinManyCallback<TSchema, TTable, TSchema[TRightKey], TRightKey, TResult>): ConnectedSelectBuilder<TSchema, TTable, TColumns, TJoined & NestedJoinMany<TAlias, TResult>>;
	leftJoinMany<TRightKey extends keyof TSchema & string, TResult>(table: TRightKey, callback: JoinManyCallback<TSchema, TTable, TSchema[TRightKey], TRightKey, TResult>): ConnectedSelectBuilder<TSchema, TTable, TColumns, TJoined & NestedJoinMany<TRightKey, TResult>>;
	/**
	 * Load a related table using auto-FK resolution (many-to-one / one-to-one).
	 * Sugar for `.leftJoin(table)` — auto-detects the FK and joins.
	 * Result is a nullable nested object (LEFT JOIN semantics).
	 *
	 * Requires `relations` config to be set on the Relq instance.
	 *
	 * @param table - Schema key of the related table
	 * @returns Builder with nested join type `{ [table]: T | null }`
	 *
	 * @example
	 * ```typescript
	 * // Load the user for each order (orders.userId → users.id)
	 * db.table.orders.select('id', 'total')
	 *   .with('users')
	 *   .all()
	 * // Result: { id, total, users: { id, name, ... } | null }[]
	 *
	 * // Chain multiple relations
	 * db.table.orders.select('id')
	 *   .with('users')
	 *   .with('products')
	 *   .all()
	 * ```
	 */
	with<TRightKey extends keyof TSchema & string>(table: TRightKey): ConnectedSelectBuilder<TSchema, TTable, TColumns, TJoined & NestedLeftJoin<TRightKey, TSchema[TRightKey]>>;
	/**
	 * Load related rows using auto-FK resolution (one-to-many).
	 * Sugar for `.leftJoinMany(table, callback)` — auto-detects FK and
	 * builds a LATERAL subquery. Result is an array of related rows.
	 *
	 * Requires `relations` config to be set on the Relq instance.
	 * Supports `{ through }` for many-to-many via junction table.
	 *
	 * @param table - Schema key of the related table
	 * @param options - Optional `{ through: 'junctionTable' }` for M:N
	 * @returns Builder with nested array type `{ [table]: T[] }`
	 *
	 * @example
	 * ```typescript
	 * // Load orders for each user (one-to-many)
	 * db.table.users.select('id', 'name')
	 *   .withMany('orders')
	 *   .all()
	 * // Result: { id, name, orders: { id, total, ... }[] }[]
	 *
	 * // Many-to-many through junction table
	 * db.table.users.select('id', 'name')
	 *   .withMany('tags', { through: 'userTags' })
	 *   .all()
	 * // Result: { id, name, tags: { id, label, ... }[] }[]
	 * ```
	 */
	withMany<TRightKey extends keyof TSchema & string>(table: TRightKey, options: {
		through: keyof TSchema & string;
	}): ConnectedSelectBuilder<TSchema, TTable, TColumns, TJoined & NestedJoinMany<TRightKey, TSchema[TRightKey]>>;
	withMany<TRightKey extends keyof TSchema & string>(table: TRightKey): ConnectedSelectBuilder<TSchema, TTable, TColumns, TJoined & NestedJoinMany<TRightKey, TSchema[TRightKey]>>;
	distinct(): this;
	/**
	 * DISTINCT ON - select unique rows by specified columns.
	 * Returns only the first row for each distinct combination of columns.
	 *
	 * **Dialect Support:**
	 * | Dialect     | Supported | Notes |
	 * |-------------|-----------|-------|
	 * | PostgreSQL  | ✅        | Native support |
	 * | CockroachDB | ✅        | Native support |
	 * | Nile        | ✅        | Native support |
	 * | AWS DSQL    | ❌        | Use GROUP BY instead |
	 * | MySQL       | ❌        | Use GROUP BY instead |
	 * | SQLite      | ❌        | Use GROUP BY instead |
	 *
	 * @param columns - Columns to select distinct on (must be first in ORDER BY)
	 * @throws {RelqConfigError} If dialect doesn't support DISTINCT ON
	 *
	 * @example
	 * ```typescript
	 * // Get latest log per user
	 * db.table.logs.select()
	 *     .distinctOn('userId')
	 *     .orderBy('userId')
	 *     .orderBy('createdAt', 'DESC')
	 *     .all()
	 * // SQL: SELECT DISTINCT ON ("user_id") * FROM "logs" ORDER BY "user_id", "created_at" DESC
	 * ```
	 */
	distinctOn(...columns: string[]): this;
	/**
	 * UNION - combine with another query (removes duplicates)
	 */
	union(query: {
		toString(): string;
	} | string): this;
	/**
	 * UNION ALL - combine with another query (keeps duplicates)
	 */
	unionAll(query: {
		toString(): string;
	} | string): this;
	/**
	 * INTERSECT - return rows that appear in both queries
	 */
	intersect(query: {
		toString(): string;
	} | string): this;
	/**
	 * EXCEPT - return rows from first query not in second
	 */
	except(query: {
		toString(): string;
	} | string): this;
	/**
	 * FOR UPDATE - lock rows for update
	 */
	forUpdate(): this;
	/**
	 * FOR UPDATE SKIP LOCKED - skip locked rows (job queue pattern).
	 * Essential for implementing efficient work queues.
	 *
	 * **Dialect Support:**
	 * | Dialect     | Supported | Notes |
	 * |-------------|-----------|-------|
	 * | PostgreSQL  | ✅        | Native support |
	 * | CockroachDB | ✅        | Native support |
	 * | Nile        | ✅        | Native support |
	 * | AWS DSQL    | ❌        | Use FOR UPDATE only |
	 * | MySQL       | ✅        | Native support (8.0+) |
	 * | SQLite      | ❌        | No row locking |
	 *
	 * @throws {RelqConfigError} If dialect doesn't support SKIP LOCKED
	 *
	 * @example
	 * ```typescript
	 * // Job queue pattern - claim next available job
	 * const job = await db.table.jobs.select()
	 *   .where(q => q.equal('status', 'pending'))
	 *   .orderBy('createdAt')
	 *   .limit(1)
	 *   .forUpdateSkipLocked()
	 *   .get()
	 * ```
	 */
	forUpdateSkipLocked(): this;
	/**
	 * FOR SHARE - shared lock (allow reads, block writes)
	 */
	forShare(): this;
	/**
	 * Get SQL string (always available)
	 */
	toString(): string;
	/**
	 * Execute query and return all rows
	 * @param withMetadata - If true, returns { data, metadata }
	 * @param asRequired - If true, all fields are required (removes optional)
	 */
	all(): Promise<Prettify$2<InferResultType<TSchema, TTable, TColumns> & TJoined>[]>;
	all(withMetadata: true): Promise<{
		data: Prettify$2<InferResultType<TSchema, TTable, TColumns> & TJoined>[];
		metadata: RelqMetadata;
	}>;
	all<R extends boolean>(withMetadata: true, asRequired: R): Promise<{
		data: Prettify$2<R extends true ? Required<InferResultType<TSchema, TTable, TColumns> & TJoined> : InferResultType<TSchema, TTable, TColumns> & TJoined>[];
		metadata: RelqMetadata;
	}>;
	/**
	 * Execute query and return single row
	 * Automatically adds LIMIT 1
	 * @param withMetadata - If true, returns { data, metadata }
	 * @param asRequired - If true, all fields are required (removes optional)
	 */
	get(): Promise<Prettify$2<InferResultType<TSchema, TTable, TColumns> & TJoined> | null>;
	get(withMetadata: true): Promise<{
		data: Prettify$2<InferResultType<TSchema, TTable, TColumns> & TJoined> | null;
		metadata: RelqMetadata;
	}>;
	get<R extends boolean>(withMetadata: true, asRequired: R): Promise<{
		data: Prettify$2<R extends true ? Required<InferResultType<TSchema, TTable, TColumns> & TJoined> : InferResultType<TSchema, TTable, TColumns> & TJoined> | null;
		metadata: RelqMetadata;
	}>;
	/**
	 * Execute query and return single column value
	 */
	value<T = any>(column: string): Promise<T | null>;
	/**
	 * Iterate through query results row-by-row using PostgreSQL cursors.
	 * Efficient for large datasets as it doesn't load all data into memory.
	 *
	 * **Dialect Support:**
	 * | Dialect     | Supported | Notes |
	 * |-------------|-----------|-------|
	 * | PostgreSQL  | ✅        | Native cursor support |
	 * | CockroachDB | ✅        | Native cursor support |
	 * | Nile        | ✅        | Native cursor support |
	 * | AWS DSQL    | ❌        | Use pagination() instead |
	 * | MySQL       | ❌        | Use pagination() instead |
	 * | SQLite      | ❌        | Use pagination() instead |
	 *
	 * @param callback - Async function called for each row. Return `false` to stop iteration.
	 * @param options - Optional configuration
	 * @param options.batchSize - Number of rows to fetch per batch (default: 100)
	 * @throws {RelqConfigError} If dialect doesn't support cursors
	 *
	 * @example
	 * ```typescript
	 * // Process all unverified users
	 * await db.table.users.select('email', 'userId')
	 *     .where(q => q.equal('verified', false))
	 *     .each(async (row) => {
	 *         await sendVerificationEmail(row.email);
	 *     });
	 *
	 * // Stop early with false return
	 * await db.table.logs.select()
	 *     .each(async (row, index) => {
	 *         if (index >= 1000) return false; // Stop after 1000
	 *         processLog(row);
	 *     }, { batchSize: 50 });
	 * ```
	 */
	each<T = InferResultType<TSchema, TTable, TColumns> & TJoined>(callback: (row: T, index: number) => void | false | Promise<void | false>, options?: {
		batchSize?: number;
	}): Promise<void>;
	/**
	 * Execute query with pagination support
	 * Supports 2 modes: paging, offset
	 *
	 * @example Paging mode (default) - Traditional page-based
	 * ```typescript
	 * const result = await db.table('users')
	 *   .select()
	 *   .pagination({
	 *     page: 2,
	 *     perPage: 20,
	 *     orderBy: [['createdAt', 'DESC'], ['id', 'ASC']]
	 *   });
	 * // result.pagination: { page, perPage, total, totalPages, hasNext, hasPrev }
	 * ```
	 *
	 * @example Offset mode - Direct position control
	 * ```typescript
	 * const result = await db.table('users')
	 *   .select()
	 *   .pagination({
	 *     mode: 'offset',
	 *     position: 100,
	 *     limit: 20,  // or [10, 30] for random
	 *     orderBy: [['createdAt', 'DESC']]
	 *   });
	 * // result.pagination: { position, limit, hasMore, hasPrev, nextPos, prevPos, total? }
	 * ```
	 */
	pagination<T = InferResultType<TSchema, TTable, TColumns> & TJoined>(options: PaginationOptions): Promise<PaginatedResult<T>>;
}
declare class ConnectedTransactionBuilder {
	private relq;
	constructor(relq: RelqBase);
	private builder;
	/**
	 * Get SQL string (always available)
	 */
	toString(): string;
	/**
	 * Begin transaction
	 */
	begin(): Promise<RelqRun>;
	/**
	 * Commit transaction
	 */
	commit(): Promise<RelqRun>;
	/**
	 * Rollback transaction
	 */
	rollback(): Promise<RelqRun>;
	/**
	 * Set isolation level
	 */
	isolationLevel(level: "READ UNCOMMITTED" | "READ COMMITTED" | "REPEATABLE READ" | "SERIALIZABLE"): this;
	/**
	 * Set transaction as read only
	 */
	readOnly(): this;
	/**
	 * Set transaction as read write
	 */
	readWrite(): this;
	/**
	 * Set transaction as deferrable
	 */
	deferrable(): this;
}
declare class ConnectedRawQueryBuilder {
	private query;
	private params;
	private relq;
	private builder;
	constructor(query: string, params: QueryValue[], relq: RelqBase);
	/**
	 * Convert MySQL-style ? placeholders to PostgreSQL $1, $2, etc.
	 * @private
	 */
	private convertPlaceholders;
	/**
	 * Execute raw query and return all rows
	 * Use for SELECT queries that return multiple rows
	 *
	 * @example
	 * ```typescript
	 * const result = await db.raw('SELECT * FROM users WHERE age > $1', 25).all();
	 * // or with ? placeholders:
	 * const result = await db.raw('SELECT * FROM users WHERE age > ?', 25).all();
	 * // result.data: T[]
	 * ```
	 */
	all<T = any>(): Promise<RelqResult<T[]>>;
	/**
	 * Execute raw query and return single row
	 * Use for SELECT queries that return one row
	 *
	 * @example
	 * ```typescript
	 * const result = await db.raw('SELECT * FROM users WHERE id = $1', 123).get();
	 * // result.data: T | null
	 * ```
	 */
	get<T = any>(): Promise<RelqResult<T | null>>;
	/**
	 * Execute raw query and return first N rows
	 * @param count - Number of rows to return
	 *
	 * @example
	 * ```typescript
	 * const result = await db.raw('SELECT * FROM users ORDER BY created_at DESC').getMany(5);
	 * // result.data: T[] (max 5 rows)
	 * ```
	 */
	getMany<T = any>(count: number): Promise<RelqResult<T[]>>;
	/**
	 * Execute raw query for INSERT/UPDATE/DELETE (non-SELECT queries)
	 * Use for queries that don't return data
	 *
	 * @example
	 * ```typescript
	 * // INSERT
	 * const result = await db.raw('INSERT INTO users (name) VALUES ($1)', 'John').run();
	 * // result.success: true
	 * // result.metadata.rowCount: 1
	 *
	 * // UPDATE
	 * const result = await db.raw('UPDATE users SET age = ? WHERE id = ?', 30, '123').run();
	 * // result.metadata.rowCount: number of rows updated
	 *
	 * // DELETE
	 * const result = await db.raw('DELETE FROM users WHERE id = $1', '123').run();
	 * // result.metadata.rowCount: number of rows deleted
	 * ```
	 */
	run(): Promise<RelqRun>;
	/**
	 * Execute COUNT query and return the count
	 *
	 * @example
	 * ```typescript
	 * const result = await db.raw('SELECT COUNT(*) FROM users WHERE active = $1', true).count();
	 * // result.count: number
	 * ```
	 */
	count(): Promise<RelqCount>;
}
declare const INTERNAL: unique symbol;
/**
 * Marker interface for scalar subquery results.
 * Contains type information and SQL generation capability.
 */
export interface ScalarResult<T> {
	/** Marker to identify scalar results */
	readonly $scalar: true;
	/** Type marker for TypeScript inference (not used at runtime) */
	readonly $type: T;
	/** Generate SQL for this scalar subquery */
	toSQL(): string;
	/** Get bound parameters for this subquery */
	getParams(): unknown[];
}
/**
 * ScalarQueryBuilder interface for building scalar subqueries.
 * Provides filtering and terminal aggregate methods.
 */
export interface ScalarQueryBuilder<TTable> {
	/**
	 * Add WHERE conditions to the scalar subquery
	 */
	where(callback: (q: TypedConditionBuilder<TTable>) => TypedConditionBuilder<TTable>): this;
	/**
	 * Count rows matching the conditions
	 * @returns ScalarResult<number>
	 */
	count(): ScalarResult<number>;
	/**
	 * Sum a numeric column
	 * @param column - Column to sum (must be numeric)
	 * @returns ScalarResult<number>
	 */
	sum<K extends ColumnName<TTable>>(column: K): ScalarResult<number>;
	/**
	 * Average of a numeric column
	 * @param column - Column to average (must be numeric)
	 * @returns ScalarResult<number>
	 */
	avg<K extends ColumnName<TTable>>(column: K): ScalarResult<number>;
	/**
	 * Minimum value of a column
	 * @param column - Column to get minimum
	 * @returns ScalarResult of the column's type
	 */
	min<K extends ColumnName<TTable>>(column: K): ScalarResult<TTable extends {
		$inferSelect: infer S;
	} ? K extends keyof S ? S[K] : any : any>;
	/**
	 * Maximum value of a column
	 * @param column - Column to get maximum
	 * @returns ScalarResult of the column's type
	 */
	max<K extends ColumnName<TTable>>(column: K): ScalarResult<TTable extends {
		$inferSelect: infer S;
	} ? K extends keyof S ? S[K] : any : any>;
	/**
	 * Pick a single value from the first row
	 * @param column - Column to pick
	 * @returns ScalarResult of the column's type (nullable)
	 */
	pick<K extends ColumnName<TTable>>(column: K): ScalarResult<(TTable extends {
		$inferSelect: infer S;
	} ? K extends keyof S ? S[K] : any : any) | null>;
	/**
	 * Check if any rows exist
	 * @returns ScalarResult<boolean>
	 */
	exists(): ScalarResult<boolean>;
}
/**
 * ScalarTableAccessor provides access to tables for scalar subqueries.
 * Each property is a ScalarQueryBuilder for that table.
 *
 * @example
 * ```typescript
 * // In scalar callback:
 * q => q.orders.where(w => w.equal('status', 'active')).count()
 * //     ^^^^^^
 * //     This is ScalarTableAccessor providing .orders
 * ```
 */
export type ScalarTableAccessor<TSchema> = {
	readonly [K in keyof TSchema & string]: ScalarQueryBuilder<TSchema[K]>;
};
/**
 * Callback function type for scalar definitions.
 * Takes a table accessor and returns a ScalarResult.
 */
export type ScalarCallback<TSchema, TResult> = (tables: ScalarTableAccessor<TSchema>) => ScalarResult<TResult>;
/**
 * Infer result type from an object of scalar callbacks.
 *
 * @example
 * ```typescript
 * type Input = {
 *   count: (q: ScalarTableAccessor<Schema>) => ScalarResult<number>;
 *   name: (q: ScalarTableAccessor<Schema>) => ScalarResult<string | null>;
 * };
 * type Result = InferScalars<Input>;
 * // { count: number; name: string | null }
 * ```
 */
export type InferScalars<T extends Record<string, ScalarCallback<any, any>>> = Prettify<{
	[K in keyof T]: T[K] extends ScalarCallback<any, infer R> ? R : never;
}>;
/**
 * Type for the scalar definitions object passed to db.scalar()
 */
export type ScalarDefinitions<TSchema> = Record<string, ScalarCallback<TSchema, any>>;
/**
 * Executor function type for running queries
 */
export type QueryExecutor = (sql: string) => Promise<{
	data: any;
	metadata: RelqMetadata;
}>;
/**
 * Column resolver getter type
 */
export type ColumnResolverGetter = (tableName: string) => ((column: string) => string) | undefined;
declare class ScalarSelectBuilder<TSchema, TScalars extends Record<string, ScalarCallback<TSchema, any>>> {
	private readonly executeQuery;
	private readonly scalarResults;
	constructor(scalars: TScalars, schema: TSchema, executeQuery: QueryExecutor, getColumnResolver?: ColumnResolverGetter);
	/**
	 * Generate the SQL for this scalar select
	 */
	toString(): string;
	/**
	 * Execute the query and return the result
	 * @param withMetadata - If true, returns { data, metadata } instead of just data
	 */
	get(withMetadata?: false): Promise<InferScalars<TScalars>>;
	get(withMetadata: true): Promise<RelqResult<InferScalars<TScalars>>>;
	/**
	 * Transform result values to correct types
	 */
	private transformResult;
}
declare class ConnectedScalarSelectBuilder<TSchema, TScalars extends Record<string, ScalarCallback<TSchema, any>>> extends ScalarSelectBuilder<TSchema, TScalars> {
	constructor(scalars: TScalars, schema: TSchema, internal: {
		executeSelectOne: (sql: string) => Promise<{
			data: any;
			metadata: RelqMetadata;
		}>;
		hasColumnMapping: () => boolean;
		transformToDbColumns: (tableName: string, data: Record<string, any>) => Record<string, any>;
	});
}
/**
 * Column name mapping utilities
 * Handles camelCase (dev code) ↔ snake_case (database) mapping
 *
 * Extracted from relq-client.ts lines 245-362
 *
 * @module core/shared/column-mapping
 * @internal
 */
/**
 * Per-table column mapping data
 */
export interface TableColumnMapping {
	propToDb: Map<string, string>;
	dbToProp: Map<string, string>;
	propToType: Map<string, string>;
	propToCheckValues: Map<string, readonly string[]>;
	propToValidate: Map<string, (val: any) => boolean>;
	propToFields: Map<string, Record<string, any>>;
}
/**
 * Map of DB table name → column mapping
 */
export type ColumnMappings = Map<string, TableColumnMapping>;
/**
 * Abstract base class for all Relq dialect clients.
 *
 * Provides the full public API surface that users interact with.
 * Dialect-specific behavior is delegated to abstract methods implemented
 * by each dialect class (RelqPostgres, RelqNile, RelqSqlite, etc.).
 *
 * @template TSchema - Database schema for type safety
 */
export declare abstract class RelqBase<TSchema = any> {
	/** Dialect identifier */
	abstract readonly dialect: Dialect;
	/** What SQL features this dialect supports */
	abstract readonly capabilities: DriverCapabilities;
	/** SQL generation hooks (quoting, RETURNING, upsert syntax, etc.) */
	abstract readonly sqlDialect: SqlDialect;
	/** Load driver module and create connection (called on first query) */
	protected abstract _initialize(): Promise<void>;
	/** Execute raw SQL and return normalized result */
	protected abstract _query(sql: string): Promise<DriverQueryResult>;
	/** Get a dedicated client for cursors/transactions */
	protected abstract _acquireClient(): Promise<{
		client: any;
		release: () => void;
	}>;
	/** Close all connections and cleanup */
	protected abstract _close(): Promise<void>;
	protected config: RelqConfig;
	protected schema?: TSchema;
	protected readonly emitter: EventEmitter<any>;
	private readonly _defaultErrorHandler;
	protected columnMappings: ColumnMappings;
	protected initialized: boolean;
	protected initPromise?: Promise<void>;
	protected _isClosed: boolean;
	constructor(schema: TSchema, config: RelqConfig);
	/**
	 * Ensure the driver is initialized before executing queries.
	 * Called automatically on first query.
	 * @internal
	 */
	protected ensureInitialized(): Promise<void>;
	/** @internal */
	private _transformToDbColumns;
	/** @internal */
	private _transformFromDbColumns;
	/** @internal */
	private _transformResultsFromDb;
	/** @internal */
	private _hasColumnMapping;
	/** @internal */
	private _validateData;
	/** @internal */
	private _getSchema;
	/** @internal */
	private _getRelations;
	/** @internal */
	private _getTableDef;
	/**
	 * Internal accessor for query builders.
	 * Uses Symbol key to be completely hidden from autocomplete.
	 * @internal - DO NOT USE DIRECTLY
	 */
	get [INTERNAL](): RelqInternal;
	/** @internal */
	protected _executeQuery(sql: string): Promise<{
		result: DriverQueryResult;
		duration: number;
	}>;
	/** @internal */
	private buildMetadata;
	/** @internal */
	private _executeSelect;
	/** @internal */
	private _executeSelectOne;
	/** @internal */
	private _executeCount;
	/** @internal */
	private _executeRun;
	/**
	 * Table accessor - both callable and has table properties
	 *
	 * @example
	 * ```typescript
	 * db.table('users').select().all()
	 * db.table.users.select().all()
	 * ```
	 */
	get table(): TableAccessor<TSchema, this>;
	/**
	 * Execute raw SQL query
	 */
	raw(query: string, ...params: QueryValue[]): ConnectedRawQueryBuilder;
	/**
	 * Create a transaction builder
	 */
	transaction(): ConnectedTransactionBuilder;
	/**
	 * Start a CTE (Common Table Expression) query
	 */
	with(name: string, query: {
		toString(): string;
	} | string): ConnectedCTEBuilder<TSchema>;
	/**
	 * Create Table As Select
	 */
	ctAs(tableName: string, query: {
		toString(): string;
	} | string, options?: {
		temporary?: boolean;
		ifNotExists?: boolean;
	}): Promise<void>;
	/**
	 * Execute EXPLAIN on a query for performance analysis
	 */
	explain(query: {
		toString(): string;
	} | string, options?: {
		analyze?: boolean;
		verbose?: boolean;
		format?: "text" | "json" | "xml" | "yaml";
	}): Promise<string | object[]>;
	/**
	 * Execute multiple scalar subqueries in a single SELECT statement
	 */
	scalar<T extends Record<string, ScalarCallback<TSchema, any>>>(scalars: T): ConnectedScalarSelectBuilder<TSchema, T>;
	/**
	 * Create a standalone condition builder for a specific table
	 */
	where<TTable extends keyof TSchema & string>(_tableName: TTable): TypedConditionBuilder<TSchema[TTable]>;
	on(event: string, listener: (...args: any[]) => void): this;
	once(event: string, listener: (...args: any[]) => void): this;
	off(event: string, listener: (...args: any[]) => void): this;
	/**
	 * Close database connection(s)
	 */
	close(): Promise<void>;
	get closed(): boolean;
}
declare abstract class PgBase<TSchema = any> extends RelqBase<TSchema> {
	readonly sqlDialect: SqlDialect;
	protected pool?: Pool;
	protected client?: Client;
	protected usePooling: boolean;
	protected clientConnected: boolean;
	protected connectPromise?: Promise<void>;
	protected environment: EnvironmentInfo;
	protected poolErrorHandler?: (err: Error) => void;
	protected poolConnectHandler?: () => void;
	protected poolRemoveHandler?: () => void;
	constructor(schema: TSchema, config: RelqConfig);
	protected _initialize(): Promise<void>;
	protected _query(sql: string): Promise<DriverQueryResult>;
	protected _acquireClient(): Promise<{
		client: any;
		release: () => void;
	}>;
	protected _close(): Promise<void>;
	/** Convert pg QueryResult to DriverQueryResult */
	protected toDriverResult(result: QueryResult): DriverQueryResult;
	protected determinePoolingStrategy(config: RelqConfig): boolean;
	protected validateConfiguration(): void;
	protected logEnvironmentInfo(): void;
	protected setupPoolErrorHandling(): void;
	protected ensureClientConnection(): Promise<void>;
	protected recreateClient(): Promise<void>;
}
/**
 * Full PostgreSQL Relq client.
 *
 * Returned when `dialect` is `'postgres'` or omitted (default).
 * Config is optional - falls back to environment variables.
 *
 * Environment variable fallbacks (in priority order):
 * 1. DATABASE_URL - Full connection string
 * 2. DATABASE_HOST, DATABASE_PORT, DATABASE_USER, DATABASE_PASSWORD, DATABASE_NAME
 * 3. PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE
 *
 * @example
 * ```typescript
 * // Using environment variables (no config needed)
 * const db = new RelqPostgres(schema);
 *
 * // With explicit config
 * const db = new RelqPostgres(schema, {
 *     host: 'localhost',
 *     database: 'mydb',
 *     user: 'postgres',
 *     password: 'secret'
 * });
 *
 * // Using connection string
 * const db = new RelqPostgres(schema, {
 *     connectionString: 'postgresql://user:pass@localhost:5432/mydb'
 * });
 * ```
 */
export declare class RelqPostgres<TSchema = any> extends PgBase<TSchema> {
	readonly dialect: Dialect;
	readonly capabilities: DriverCapabilities;
	private listener;
	constructor(schema: TSchema, config?: PostgresOptions | PostgresConfig);
	/**
	 * Subscribe to a PostgreSQL NOTIFY channel
	 */
	subscribe<T = any>(channel: string, callback: (payload: T) => void): Promise<Unsubscribe>;
	/**
	 * Close PostgreSQL connections including listener.
	 */
	protected _close(): Promise<void>;
}
/**
 * Nile multi-tenant PostgreSQL client.
 *
 * Returned when `dialect` is `'nile'`.
 * Config is optional - falls back to environment variables.
 *
 * Environment variable fallbacks (in priority order):
 * 1. DATABASE_URL - Full connection string
 * 2. DATABASE_HOST, DATABASE_PORT, DATABASE_USER, DATABASE_PASSWORD, DATABASE_NAME
 * 3. PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE
 *
 * @example
 * ```typescript
 * // Using environment variables (no config needed)
 * const db = new RelqNile(schema);
 *
 * // With explicit config
 * const db = new RelqNile(schema, {
 *     host: 'db.thenile.dev',
 *     database: 'mydb',
 *     user: 'user',
 *     password: 'secret'
 * });
 *
 * // Set tenant context
 * await db.setTenant('tenant-123');
 * const users = await db.table.users.select().all();
 * await db.clearTenant();
 *
 * // Or use withTenant for scoped queries
 * const orders = await db.withTenant('tenant-456', async () => {
 *     return db.table.orders.select().all();
 * });
 * ```
 */
export declare class RelqNile<TSchema = any> extends PgBase<TSchema> {
	readonly dialect: Dialect;
	readonly capabilities: DriverCapabilities;
	private tenantCtx;
	constructor(schema: TSchema, config?: NileOptions | NileConfig);
	/** Bound query function for tenant context SQL execution. */
	private get queryFn();
	/**
	 * Set the current tenant context.
	 * All subsequent queries will be scoped to this tenant.
	 */
	setTenant(tenantId: string): Promise<void>;
	/**
	 * Clear the current tenant context.
	 * Subsequent queries will not be scoped to any tenant.
	 */
	clearTenant(): Promise<void>;
	/**
	 * Get the current tenant ID, or null if not set.
	 */
	getTenantContext(): string | null;
	/**
	 * Execute a callback within a tenant scope.
	 * Sets the tenant before the callback and restores the previous
	 * tenant context after (even if the callback throws).
	 */
	withTenant<T>(tenantId: string, callback: () => Promise<T>): Promise<T>;
}
/**
 * AWS Aurora DSQL client.
 *
 * Returned when `dialect` is `'dsql'` or `'awsdsql'`.
 * Config is optional - falls back to AWS environment variables.
 * Automatically handles IAM token generation for authentication.
 *
 * Environment variable fallbacks:
 * - AWS_ACCESS_KEY_ID - AWS access key
 * - AWS_SECRET_ACCESS_KEY - AWS secret key
 * - AWS_DATABASE_HOST - DSQL cluster hostname
 * - AWS_REGION or AWS_DEFAULT_REGION - AWS region
 * - AWS_DATABASE_NAME - Database name (defaults to 'postgres')
 *
 * @example
 * ```typescript
 * // Using environment variables (no config needed)
 * const db = new RelqDsql(schema);
 *
 * // With explicit config
 * const db = new RelqDsql(schema, {
 *     aws: {
 *         hostname: 'cluster-id.dsql.us-east-1.on.aws',
 *         region: 'us-east-1'
 *     },
 *     database: 'postgres'
 * });
 * ```
 */
export declare class RelqDsql<TSchema = any> extends PgBase<TSchema> {
	readonly dialect: Dialect;
	readonly capabilities: DriverCapabilities;
	constructor(schema: TSchema, config?: Partial<DsqlOptions> | DsqlConfig);
}
/**
 * CockroachDB client.
 *
 * Returned when `dialect` is `'cockroachdb'`.
 * Config is optional - falls back to environment variables.
 *
 * Environment variable fallbacks (in priority order):
 * 1. DATABASE_URL - Full connection string
 * 2. DATABASE_HOST, DATABASE_PORT, DATABASE_USER, DATABASE_PASSWORD, DATABASE_NAME
 * 3. PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE
 *
 * @example
 * ```typescript
 * // Using environment variables (no config needed)
 * const db = new RelqCockroachDB(schema);
 *
 * // With explicit config
 * const db = new RelqCockroachDB(schema, {
 *     host: 'free-tier.gcp-us-central1.cockroachlabs.cloud',
 *     port: 26257,
 *     database: 'mydb',
 *     user: 'user',
 *     password: 'secret',
 *     ssl: true
 * });
 * ```
 */
export declare class RelqCockroachDB<TSchema = any> extends PgBase<TSchema> {
	readonly dialect: Dialect;
	readonly capabilities: DriverCapabilities;
	constructor(schema: TSchema, config?: CockroachDBOptions | CockroachDBConfig);
}
/**
 * Main Relq client class.
 *
 * @example
 * ```typescript
 * // PostgreSQL
 * const db = new Relq(schema, 'postgres', {
 *     host: 'localhost',
 *     database: 'mydb',
 *     user: 'postgres',
 *     password: 'secret'
 * });
 * db.subscribe('channel', cb); // ✅ Works
 *
 * // Nile
 * const nileDb = new Relq(schema, 'nile', {
 *     host: 'db.thenile.dev',
 *     database: 'mydb',
 *     user: 'user',
 *     password: 'secret'
 * });
 * nileDb.setTenant('tenant-123'); // ✅ Works
 * nileDb.subscribe('channel', cb); // ❌ TypeScript error
 *
 * // AWS DSQL
 * const dsqlDb = new Relq(schema, 'awsdsql', {
 *     database: 'postgres',
 *     aws: {
 *         hostname: 'cluster.dsql.us-east-1.on.aws',
 *         region: 'us-east-1'
 *     }
 * });
 *
 * // CockroachDB
 * const crdb = new Relq(schema, 'cockroachdb', {
 *     host: 'free-tier.cockroachlabs.cloud',
 *     port: 26257,
 *     database: 'mydb',
 *     ssl: true
 * });
 * ```
 */
export interface RelqConstructor {
	/** PostgreSQL with env vars */
	new <TSchema = any>(schema: TSchema, dialect: "postgres"): RelqPostgres<TSchema>;
	/** Nile with env vars */
	new <TSchema = any>(schema: TSchema, dialect: "nile"): RelqNile<TSchema>;
	/** CockroachDB with env vars */
	new <TSchema = any>(schema: TSchema, dialect: "cockroachdb"): RelqCockroachDB<TSchema>;
	/** AWS DSQL with env vars */
	new <TSchema = any>(schema: TSchema, dialect: "awsdsql"): RelqDsql<TSchema>;
	/**
	 * PostgreSQL - Full feature support including LISTEN/NOTIFY
	 *
	 * Environment variable fallbacks (in priority order):
	 * 1. DATABASE_URL - Full connection string
	 * 2. DATABASE_HOST, DATABASE_PORT, DATABASE_USER, DATABASE_PASSWORD, DATABASE_NAME
	 * 3. PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE
	 */
	new <TSchema = any>(schema: TSchema, dialect: "postgres", options: PostgresOptions): RelqPostgres<TSchema>;
	/**
	 * Nile - Multi-tenant PostgreSQL (no LISTEN/NOTIFY)
	 *
	 * Environment variable fallbacks (in priority order):
	 * 1. DATABASE_URL - Full connection string
	 * 2. DATABASE_HOST, DATABASE_PORT, DATABASE_USER, DATABASE_PASSWORD, DATABASE_NAME
	 * 3. PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE
	 */
	new <TSchema = any>(schema: TSchema, dialect: "nile", options: NileOptions): RelqNile<TSchema>;
	/**
	 * CockroachDB - Distributed SQL (no LISTEN/NOTIFY, no ranges)
	 *
	 * Environment variable fallbacks (in priority order):
	 * 1. DATABASE_URL - Full connection string
	 * 2. DATABASE_HOST, DATABASE_PORT, DATABASE_USER, DATABASE_PASSWORD, DATABASE_NAME
	 * 3. PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE
	 */
	new <TSchema = any>(schema: TSchema, dialect: "cockroachdb", options: CockroachDBOptions): RelqCockroachDB<TSchema>;
	/**
	 * AWS Aurora DSQL - Serverless PostgreSQL (no LISTEN/NOTIFY, no triggers)
	 *
	 * Environment variable fallbacks:
	 * - AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
	 * - AWS_DATABASE_HOST, AWS_REGION or AWS_DEFAULT_REGION
	 * - AWS_DATABASE_NAME (defaults to 'postgres')
	 */
	new <TSchema = any>(schema: TSchema, dialect: "awsdsql", options: DsqlOptions): RelqDsql<TSchema>;
	/** SQLite - Local file-based database @status Coming soon */
	new <TSchema = any>(schema: TSchema, dialect: "sqlite", options: SqliteOptions): never;
	/** Turso (LibSQL) - Edge SQLite @status Coming soon */
	new <TSchema = any>(schema: TSchema, dialect: "turso", options: TursoOptions): never;
	/** MySQL @status Coming soon */
	new <TSchema = any>(schema: TSchema, dialect: "mysql", options: MysqlOptions): never;
	/** MariaDB @status Coming soon */
	new <TSchema = any>(schema: TSchema, dialect: "mariadb", options: MariadbOptions): never;
	/** PlanetScale @status Coming soon */
	new <TSchema = any>(schema: TSchema, dialect: "planetscale", options: PlanetscaleOptions): never;
	/** Xata @status Coming soon */
	new <TSchema = any>(schema: TSchema, dialect: "xata", options: XataOptions): never;
}
export declare const Relq: RelqConstructor;
/**
 * Type inference for aggregate functions, COUNT queries, and GROUP BY operations
 * @module types/aggregate-types
 */
/**
 * Aggregate function result types
 * Maps SQL aggregate functions to their TypeScript return types
 */
export interface AggregateResultTypes {
	COUNT: number;
	SUM: number;
	AVG: number;
	MIN: any;
	MAX: any;
	ARRAY_AGG: any[];
	JSON_AGG: any[];
	JSONB_AGG: any[];
	STRING_AGG: string;
	BOOL_AND: boolean;
	BOOL_OR: boolean;
	BIT_AND: number;
	BIT_OR: number;
}
/**
 * Extract aggregate function name from SQL expression
 * Examples:
 * - "COUNT(*)" → "COUNT"
 * - "SUM(price)" → "SUM"
 * - "AVG(score)" → "AVG"
 */
export type ExtractAggregateName<T extends string> = T extends `${infer Func}(${string})` ? Uppercase<Func> extends keyof AggregateResultTypes ? Uppercase<Func> : never : never;
/**
 * Infer return type from aggregate function
 *
 * @example
 * ```typescript
 * type A = AggregateReturnType<'COUNT(*)'>;     // number
 * type B = AggregateReturnType<'SUM(price)'>;   // number
 * type C = AggregateReturnType<'AVG(score)'>;   // number
 * ```
 */
export type AggregateReturnType<T extends string> = ExtractAggregateName<T> extends keyof AggregateResultTypes ? AggregateResultTypes[ExtractAggregateName<T>] : any;
/**
 * Column specification for GROUP BY queries
 * Can include both regular columns and aggregate functions
 *
 * Examples:
 * - "user_id" → regular column
 * - "COUNT(*)" → aggregate function
 * - ["COUNT(*)", "total"] → aggregate with alias
 */
export type GroupByColumn = string | [
	string,
	string
];
/**
 * Extract column name or alias from GroupBy column spec
 */
export type ExtractGroupByName<T extends GroupByColumn> = T extends [
	string,
	infer Alias extends string
] ? Alias : T extends string ? T : never;
/**
 * Determine if a column spec is an aggregate function
 */
export type IsAggregate<T extends string> = T extends `${string}(${string})` ? true : false;
/**
 * Infer the type of a single column in a GROUP BY result
 * - If it's an aggregate function, infer the aggregate return type
 * - Otherwise, treat as regular column (any)
 */
export type InferGroupByColumnType<T extends string> = IsAggregate<T> extends true ? AggregateReturnType<T> : any;
/**
 * Build result type for GROUP BY query with aggregates
 *
 * @example
 * ```typescript
 * type Result = GroupByResult<[
 *   'user_id',
 *   ['COUNT(*)', 'total'],
 *   ['SUM(amount)', 'total_amount']
 * ]>;
 *
 * // Result: {
 * //   user_id: any;
 * //   total: number;
 * //   total_amount: number;
 * // }
 * ```
 */
export type GroupByResult<T extends readonly GroupByColumn[]> = {
	[K in T[number] as ExtractGroupByName<K>]: K extends [
		infer Expr extends string,
		string
	] ? InferGroupByColumnType<Expr> : K extends string ? InferGroupByColumnType<K> : any;
};
/**
 * Type for simple COUNT query result
 * Always returns a single number
 */
export interface CountResult {
	count: number;
}
/**
 * Type for COUNT with GROUP BY
 * Returns array of objects with grouping columns and count
 *
 * @example
 * ```typescript
 * // COUNT(*) GROUP BY status
 * type Result = CountGroupByResult<['status', 'count']>;
 * // Result: Array<{ status: any; count: number }>
 * ```
 */
export type CountGroupByResult<TColumns extends readonly string[]> = Array<{
	[K in TColumns[number]]: K extends "count" ? number : any;
}>;
/**
 * Helper type for common aggregate patterns
 */
export type CommonAggregates = {
	/** Total count of rows */
	count: number;
	/** Sum of numeric column */
	sum: number;
	/** Average of numeric column */
	avg: number;
	/** Minimum value */
	min: any;
	/** Maximum value */
	max: any;
	/** Array of values */
	array_agg: any[];
	/** JSON array of values */
	json_agg: any[];
	/** Concatenated string */
	string_agg: string;
};
/**
 * Type-safe aggregate builder interface
 * Provides methods for common aggregate operations with proper return types
 */
export interface TypedAggregateBuilder {
	/** COUNT(*) or COUNT(column) → number */
	count(column?: string): number;
	/** SUM(column) → number */
	sum(column: string): number;
	/** AVG(column) → number */
	avg(column: string): number;
	/** MIN(column) → any */
	min(column: string): any;
	/** MAX(column) → any */
	max(column: string): any;
	/** ARRAY_AGG(column) → any[] */
	arrayAgg(column: string): any[];
	/** JSON_AGG(column) → any[] */
	jsonAgg(column: string): any[];
	/** STRING_AGG(column, separator) → string */
	stringAgg(column: string, separator: string): string;
}
/**
 * Complex query result with mixed columns and aggregates
 *
 * @example
 * ```typescript
 * type Result = MixedQueryResult<
 *   ['user_id', 'status'],           // Regular columns
 *   ['COUNT(*)', 'SUM(amount)']      // Aggregates
 * >;
 *
 * // Result: {
 * //   user_id: any;
 * //   status: any;
 * //   count: number;
 * //   sum: number;
 * // }
 * ```
 */
export type MixedQueryResult<TColumns extends readonly string[], TAggregates extends readonly string[]> = {
	[K in TColumns[number]]: any;
} & {
	[K in TAggregates[number] as Lowercase<ExtractAggregateName<K>>]: AggregateReturnType<K>;
};
/**
 * Custom error classes for Relq
 * Provides detailed error information for database operations
 * @module errors/relq-errors
 */
/**
 * Setup global error handler for clean Relq error display
 * Call this once at the entry point of your application
 *
 * @example
 * ```typescript
 * import { setupErrorHandler } from 'relq';
 *
 * setupErrorHandler(); // Clean error output without source code preview
 * ```
 */
export declare function setupErrorHandler(): void;
/**
 * Base error class for all Relq errors
 * Extends native Error with additional context
 */
export declare class RelqError extends Error {
	name: string;
	readonly cause?: Error;
	readonly timestamp: Date;
	constructor(message: string, cause?: Error);
	/**
	 * Override in subclasses to add specific properties to inspect output
	 * @internal
	 */
	protected _getInspectProps(): Record<string, any>;
	toJSON(): {
		name: string;
		message: string;
		cause: string | undefined;
		timestamp: string;
		stack: string | undefined;
	};
}
/**
 * Database connection errors
 * Thrown when connection to PostgreSQL fails
 *
 * @example
 * ```typescript
 * try {
 *   await db.table('users').select(['*']).all();
 * } catch (error) {
 *   if (error instanceof RelqConnectionError) {
 *     console.error('Connection failed:', error.code);
 *     // Handle connection-specific errors
 *   }
 * }
 * ```
 */
export declare class RelqConnectionError extends RelqError {
	name: string;
	readonly code?: string;
	readonly host?: string;
	readonly port?: number;
	constructor(message: string, options?: {
		cause?: Error;
		code?: string;
		host?: string;
		port?: number;
	});
	protected _getInspectProps(): Record<string, any>;
	toJSON(): {
		code: string | undefined;
		host: string | undefined;
		port: number | undefined;
		name: string;
		message: string;
		cause: string | undefined;
		timestamp: string;
		stack: string | undefined;
	};
}
/**
 * Query execution errors
 * Thrown when SQL query execution fails
 *
 * @example
 * ```typescript
 * try {
 *   await db.table('users').insert({ invalid_field: 123 }).execute();
 * } catch (error) {
 *   if (error instanceof RelqQueryError) {
 *     console.error('Query failed:', error.sql);
 *     console.error('PostgreSQL code:', error.code);
 *   }
 * }
 * ```
 */
export declare class RelqQueryError extends RelqError {
	name: string;
	readonly sql?: string;
	readonly code?: string;
	readonly detail?: string;
	readonly hint?: string;
	constructor(message: string, options?: {
		cause?: Error;
		sql?: string;
		code?: string;
		detail?: string;
		hint?: string;
	});
	protected _getInspectProps(): Record<string, any>;
	toJSON(): {
		sql: string | undefined;
		code: string | undefined;
		detail: string | undefined;
		hint: string | undefined;
		name: string;
		message: string;
		cause: string | undefined;
		timestamp: string;
		stack: string | undefined;
	};
}
/**
 * Transaction errors
 * Thrown when transaction operations fail
 *
 * @example
 * ```typescript
 * const tx = db.transaction();
 * try {
 *   await tx.begin();
 *   // ... queries
 *   await tx.commit();
 * } catch (error) {
 *   if (error instanceof RelqTransactionError) {
 *     console.error('Transaction failed:', error.operation);
 *     await tx.rollback();
 *   }
 * }
 * ```
 */
export declare class RelqTransactionError extends RelqError {
	name: string;
	readonly operation: "BEGIN" | "COMMIT" | "ROLLBACK" | "SAVEPOINT";
	readonly transactionState?: string;
	constructor(message: string, operation: "BEGIN" | "COMMIT" | "ROLLBACK" | "SAVEPOINT", options?: {
		cause?: Error;
		transactionState?: string;
	});
	protected _getInspectProps(): Record<string, any>;
	toJSON(): {
		operation: "BEGIN" | "COMMIT" | "ROLLBACK" | "SAVEPOINT";
		transactionState: string | undefined;
		name: string;
		message: string;
		cause: string | undefined;
		timestamp: string;
		stack: string | undefined;
	};
}
/**
 * Configuration errors
 * Thrown when Relq configuration is invalid
 *
 * @example
 * ```typescript
 * try {
 *   const db = new Relq({ database: '' }); // Empty database name
 * } catch (error) {
 *   if (error instanceof RelqConfigError) {
 *     console.error('Invalid config:', error.field);
 *   }
 * }
 * ```
 */
export declare class RelqConfigError extends RelqError {
	name: string;
	readonly field?: string;
	readonly value?: any;
	constructor(message: string, options?: {
		field?: string;
		value?: any;
	});
	protected _getInspectProps(): Record<string, any>;
	toJSON(): {
		field: string | undefined;
		value: any;
		name: string;
		message: string;
		cause: string | undefined;
		timestamp: string;
		stack: string | undefined;
	};
}
/**
 * Timeout errors
 * Thrown when query or connection times out
 *
 * @example
 * ```typescript
 * try {
 *   await db.table('large_table').select(['*']).all();
 * } catch (error) {
 *   if (error instanceof RelqTimeoutError) {
 *     console.error('Query timed out after', error.timeout, 'ms');
 *   }
 * }
 * ```
 */
export declare class RelqTimeoutError extends RelqError {
	name: string;
	readonly timeout: number;
	readonly operation: "query" | "connection";
	constructor(message: string, timeout: number, operation: "query" | "connection", cause?: Error);
	protected _getInspectProps(): Record<string, any>;
	toJSON(): {
		timeout: number;
		operation: "query" | "connection";
		name: string;
		message: string;
		cause: string | undefined;
		timestamp: string;
		stack: string | undefined;
	};
}
/**
 * Pool errors
 * Thrown when connection pool operations fail
 *
 * @example
 * ```typescript
 * try {
 *   await db.table('users').select(['*']).all();
 * } catch (error) {
 *   if (error instanceof RelqPoolError) {
 *     console.error('Pool exhausted:', error.activeConnections);
 *   }
 * }
 * ```
 */
export declare class RelqPoolError extends RelqError {
	name: string;
	readonly poolSize?: number;
	readonly activeConnections?: number;
	readonly waitingClients?: number;
	constructor(message: string, options?: {
		cause?: Error;
		poolSize?: number;
		activeConnections?: number;
		waitingClients?: number;
	});
	protected _getInspectProps(): Record<string, any>;
	toJSON(): {
		poolSize: number | undefined;
		activeConnections: number | undefined;
		waitingClients: number | undefined;
		name: string;
		message: string;
		cause: string | undefined;
		timestamp: string;
		stack: string | undefined;
	};
}
/**
 * Environment errors
 * Thrown when Relq is used in unsupported environment
 *
 * @example
 * ```typescript
 * try {
 *   // Running in Cloudflare Workers
 *   const db = new Relq({ database: 'mydb' });
 * } catch (error) {
 *   if (error instanceof RelqEnvironmentError) {
 *     console.error('Unsupported:', error.environment);
 *   }
 * }
 * ```
 */
export declare class RelqEnvironmentError extends RelqError {
	name: string;
	readonly environment: string;
	readonly reason?: string;
	constructor(message: string, environment: string, reason?: string);
	protected _getInspectProps(): Record<string, any>;
	toJSON(): {
		environment: string;
		reason: string | undefined;
		name: string;
		message: string;
		cause: string | undefined;
		timestamp: string;
		stack: string | undefined;
	};
}
/**
 * Builder validation errors
 * Thrown when SQL builder configuration is invalid or incomplete
 *
 * @example
 * ```typescript
 * try {
 *   relq('users').createView('user_emails').toString(); // Missing .as()
 * } catch (error) {
 *   if (error instanceof RelqBuilderError) {
 *     console.error('Builder error:', error.builder);
 *     console.error('Missing:', error.missing);
 *   }
 * }
 * ```
 */
export declare class RelqBuilderError extends RelqError {
	name: string;
	readonly builder?: string;
	readonly missing?: string;
	readonly hint?: string;
	constructor(message: string, options?: {
		builder?: string;
		missing?: string;
		hint?: string;
	});
	protected _getInspectProps(): Record<string, any>;
	toJSON(): {
		builder: string | undefined;
		missing: string | undefined;
		hint: string | undefined;
		name: string;
		message: string;
		cause: string | undefined;
		timestamp: string;
		stack: string | undefined;
	};
}
/**
 * Type guard to check if error is a Relq error
 */
export declare function isRelqError(error: unknown): error is RelqError;
/**
 * Type guard to check if error is a connection error
 */
export declare function isRelqConnectionError(error: unknown): error is RelqConnectionError;
/**
 * Type guard to check if error is a query error
 */
export declare function isRelqQueryError(error: unknown): error is RelqQueryError;
/**
 * Type guard to check if error is a builder error
 */
export declare function isRelqBuilderError(error: unknown): error is RelqBuilderError;
/**
 * Helper to wrap unknown errors as RelqError
 */
export declare function wrapError(error: unknown, context?: string): RelqError;
/**
 * Parse PostgreSQL error and create appropriate Relq error
 */
export declare function parsePostgresError(error: any, sql?: string): RelqError;
export interface SmartPoolConfig {
	/** Minimum connections to keep in pool */
	min: number;
	/** Maximum connections allowed in pool */
	max: number;
	/** Time (ms) before closing idle connections */
	idleTimeoutMillis: number;
	/** Time (ms) to wait for available connection */
	connectionTimeoutMillis: number;
	/** Human-readable recommendation message */
	recommendation?: string;
}
/**
 * Get smart pool defaults based on detected environment
 *
 * Default strategy:
 * - Always use Pool (never raw Client)
 * - min: 0 for all environments (lazy connections)
 * - Serverless/edge: max 1 (single connection per invocation)
 * - Traditional: max 10 (scale under load)
 *
 * @returns Optimal pool configuration for current environment
 */
export declare function getSmartPoolDefaults(): SmartPoolConfig;
/**
 * Validation result for pool configuration
 */
export interface PoolValidation {
	/** Whether configuration is valid */
	valid: boolean;
	/** Warning messages (non-fatal issues) */
	warnings: string[];
	/** Error messages (fatal issues) */
	errors: string[];
}
/**
 * Validate pool configuration against environment
 * Provides warnings for suboptimal settings
 *
 * @param config - Pool configuration to validate
 * @param env - Environment information
 * @returns Validation result with warnings/errors
 *
 * @example
 * ```typescript
 * const validation = validatePoolConfig({ min: 2, max: 10 }, env);
 * if (!validation.valid) {
 *   console.error('Invalid config:', validation.errors);
 * }
 * ```
 */
export declare function validatePoolConfig(config: Partial<SmartPoolConfig>, env: EnvironmentInfo): PoolValidation;
/**
 * Merge user config with smart defaults
 * User config takes precedence over defaults
 *
 * @param userConfig - User-provided pool configuration
 * @returns Complete pool configuration
 *
 * @example
 * ```typescript
 * const config = mergeWithDefaults({ max: 20 });
 * // Returns: { min: 0, max: 20, idleTimeoutMillis: 30000, ... }
 * ```
 */
export declare function mergeWithDefaults(userConfig?: Partial<SmartPoolConfig>): SmartPoolConfig;
/**
 * Format pool configuration for logging
 */
export declare function formatPoolConfig(config: SmartPoolConfig): string;
/**
 * Constraint types supported by PostgreSQL
 */
export type ConstraintType = "PRIMARY KEY" | "FOREIGN KEY" | "UNIQUE" | "CHECK" | "EXCLUSION";
/**
 * Internal constraint definition
 */
export interface ConstraintDefinition {
	type: ConstraintType;
	name?: string;
	columns?: string[];
	definition?: string;
	references?: {
		table: string;
		columns: string[];
	};
	onDelete?: string;
	onUpdate?: string;
	deferrable?: boolean;
	initially?: "IMMEDIATE" | "DEFERRED";
	using?: string;
}
/**
 * Builder for table constraints (PRIMARY KEY, FOREIGN KEY, UNIQUE, CHECK, EXCLUSION).
 * Used internally by CreateTableBuilder to add constraints to table definitions.
 *
 * @example
 * ```typescript
 * // Primary key
 * .addPrimaryKey(['id'], 'pk_users')
 *
 * // Foreign key
 * .addForeignKey({
 *   columns: ['user_id'],
 *   references: { table: 'users', columns: ['id'] },
 *   onDelete: 'CASCADE'
 * })
 *
 * // Unique constraint
 * .addUnique(['email'], 'uq_email')
 *
 * // Check constraint
 * .addCheck('age >= 18', 'chk_adult')
 *
 * // Exclusion constraint
 * .addExclusion('daterange(start_date, end_date, \'[)\') WITH &&', 'GIST')
 * ```
 */
export declare class ConstraintBuilder {
	private constraints;
	/**
	 * Adds a PRIMARY KEY constraint.
	 *
	 * @param columns Column names for the primary key
	 * @param name Optional constraint name
	 * @returns The ConstraintBuilder instance for method chaining
	 *
	 * @example
	 * ```typescript
	 * .addPrimaryKey(['id'])
	 * .addPrimaryKey(['user_id', 'project_id'], 'pk_user_project')
	 * ```
	 */
	addPrimaryKey(columns: string[], name?: string): ConstraintBuilder;
	/**
	 * Adds a FOREIGN KEY constraint.
	 *
	 * @param config Foreign key configuration
	 * @returns The ConstraintBuilder instance for method chaining
	 *
	 * @example
	 * ```typescript
	 * .addForeignKey({
	 *   columns: ['user_id'],
	 *   references: { table: 'users', columns: ['id'] },
	 *   onDelete: 'CASCADE',
	 *   onUpdate: 'CASCADE',
	 *   deferrable: true,
	 *   initially: 'DEFERRED',
	 *   name: 'fk_user'
	 * })
	 * ```
	 */
	addForeignKey(config: ForeignKeyConfig): ConstraintBuilder;
	/**
	 * Adds a UNIQUE constraint.
	 *
	 * @param columns Column names that must be unique
	 * @param name Optional constraint name
	 * @returns The ConstraintBuilder instance for method chaining
	 *
	 * @example
	 * ```typescript
	 * .addUnique(['email'])
	 * .addUnique(['company_id', 'slug'], 'uq_company_slug')
	 * ```
	 */
	addUnique(columns: string[], name?: string): ConstraintBuilder;
	/**
	 * Adds a CHECK constraint.
	 *
	 * @param condition SQL condition expression
	 * @param name Optional constraint name
	 * @returns The ConstraintBuilder instance for method chaining
	 *
	 * @example
	 * ```typescript
	 * .addCheck('age >= 18', 'chk_adult')
	 * .addCheck('price > 0', 'chk_positive_price')
	 * .addCheck('start_date < end_date', 'chk_date_order')
	 * ```
	 */
	addCheck(condition: string, name?: string): ConstraintBuilder;
	/**
	 * Adds an EXCLUSION constraint using specified index method.
	 * Ensures that if any two rows are compared on the specified expression/columns,
	 * not all comparisons will return true.
	 *
	 * @param constraint Exclusion constraint definition
	 * @param using Index method (GIST or SPGIST)
	 * @param name Optional constraint name
	 * @returns The ConstraintBuilder instance for method chaining
	 *
	 * @example
	 * ```typescript
	 * // Prevent overlapping date ranges
	 * .addExclusion(
	 *   'daterange(start_date, end_date, \'[)\') WITH &&',
	 *   'GIST',
	 *   'excl_no_overlap'
	 * )
	 *
	 * // Prevent duplicate room bookings at same time
	 * .addExclusion(
	 *   'room_id WITH =, tsrange(start_time, end_time) WITH &&',
	 *   'GIST'
	 * )
	 * ```
	 */
	addExclusion(constraint: string, using?: "GIST" | "SPGIST", name?: string): ConstraintBuilder;
	/**
	 * Returns all collected constraints.
	 * @internal Used by CreateTableBuilder
	 */
	getConstraints(): ConstraintDefinition[];
	/**
	 * Builds SQL for a single constraint.
	 * @internal Used by CreateTableBuilder
	 */
	static buildConstraintSQL(constraint: ConstraintDefinition): string;
	/**
	 * Builds SQL for all constraints.
	 * @internal Used by CreateTableBuilder
	 */
	buildAllConstraintsSQL(): string[];
}
/**
 * Tagged Template Literal for SQL
 *
 * Provides a `sql` tagged template for writing raw SQL with automatic
 * parameter escaping. Interpolated values are properly escaped using
 * pg-format to prevent SQL injection.
 *
 * @module raw/sql-template
 *
 * @example
 * ```typescript
 * import { sql } from 'relq';
 *
 * // Basic parameterized query
 * const query = sql`SELECT * FROM users WHERE id = ${userId}`;
 *
 * // Multiple parameters
 * const query = sql`
 *   SELECT * FROM orders
 *   WHERE user_id = ${userId}
 *   AND status = ${status}
 *   AND total > ${minTotal}
 * `;
 *
 * // With identifiers (table/column names use %I via sql.id())
 * const query = sql`SELECT * FROM ${sql.id('users')} WHERE ${sql.id('email')} = ${email}`;
 *
 * // Use in WHERE conditions
 * db.table.users.select()
 *   .whereRaw(sql`age > ${minAge} AND created_at < ${cutoffDate}`)
 *   .all()
 *
 * // Compose queries
 * const condition = sql`status = ${status}`;
 * const query = sql`SELECT * FROM users WHERE ${condition}`;
 * ```
 */
/**
 * Result of a `sql` tagged template. Holds the rendered SQL string.
 * Implements `toString()` so it can be used anywhere a string is expected.
 */
export declare class SqlFragment {
	/** The rendered, parameterized SQL string */
	readonly text: string;
	/** @internal Brand for type identification */
	readonly _isSqlFragment: true;
	constructor(
	/** The rendered, parameterized SQL string */
	text: string);
	toString(): string;
}
declare function sqlIdentifier(name: string): SqlFragment;
declare function sqlRaw(text: string): SqlFragment;
/**
 * Tagged template literal for SQL queries.
 *
 * Interpolated values are automatically escaped:
 * - Strings → single-quoted and escaped
 * - Numbers → literal numbers
 * - Booleans → true/false
 * - null/undefined → NULL
 * - Dates → ISO string, single-quoted
 * - Arrays → PostgreSQL array literal
 * - SqlFragment → inlined as-is (for composing queries)
 * - Objects → JSON, single-quoted with ::jsonb cast
 */
export declare function sql(strings: TemplateStringsArray, ...values: any[]): SqlFragment;
export declare namespace sql {
	var id: typeof sqlIdentifier;
	var raw: typeof sqlRaw;
	var fragment: typeof sqlRaw;
}
export type CacheStrategy = "lru" | "ttl" | "size" | "none";
export interface CacheEntry<T = unknown> {
	value: T;
	createdAt: number;
	accessedAt: number;
	accessCount: number;
	size: number;
}
export interface CacheOptions {
	strategy: CacheStrategy;
	maxSize?: number;
	maxItems?: number;
	ttl?: number;
	onEvict?: (key: string, entry: CacheEntry) => void;
	keyGenerator?: (query: string, params?: unknown[]) => string;
}
export interface CacheStats {
	hits: number;
	misses: number;
	evictions: number;
	size: number;
	itemCount: number;
	hitRate: number;
}
export declare class QueryCache<T = unknown> {
	private cache;
	private options;
	private stats;
	constructor(options?: Partial<CacheOptions>);
	private defaultKeyGenerator;
	generateKey(query: string, params?: unknown[]): string;
	get(key: string): T | undefined;
	set(key: string, value: T): void;
	has(key: string): boolean;
	delete(key: string): boolean;
	clear(): void;
	invalidateByPattern(pattern: RegExp): number;
	invalidateByTable(tableName: string): number;
	getStats(): CacheStats;
	resetStats(): void;
	keys(): string[];
	values(): T[];
	entries(): Array<[
		string,
		CacheEntry<T>
	]>;
	private evictIfNeeded;
	private evictOne;
	private estimateSize;
}
export declare class CacheKeyBuilder {
	private parts;
	table(name: string): CacheKeyBuilder;
	operation(op: "select" | "insert" | "update" | "delete" | "count"): CacheKeyBuilder;
	columns(...cols: string[]): CacheKeyBuilder;
	where(condition: string): CacheKeyBuilder;
	orderBy(order: string): CacheKeyBuilder;
	limit(n: number): CacheKeyBuilder;
	offset(n: number): CacheKeyBuilder;
	params(...values: unknown[]): CacheKeyBuilder;
	custom(key: string, value: string): CacheKeyBuilder;
	build(): string;
	static from(query: string, params?: unknown[]): string;
	private static simpleHash;
}
export interface CachedQueryOptions {
	cache: QueryCache;
	ttl?: number;
	keyPrefix?: string;
	invalidateOn?: string[];
}
export declare function createQueryCacheMiddleware(options: CachedQueryOptions): {
	beforeQuery: (query: string, params?: unknown[]) => {
		cached: boolean;
		value?: unknown;
		key: string;
	};
	afterQuery: (key: string, result: unknown) => void;
	afterMutation: (tableName: string) => void;
};
export declare function withCache<T>(cache: QueryCache<T>, key: string, fn: () => T | Promise<T>, ttl?: number): T | Promise<T>;
export declare function createTableCache<T = unknown>(tableName: string, options?: Partial<CacheOptions>): QueryCache<T> & {
	table: string;
};
export declare function convertCase(str: string, type: ConversionType): string;
declare function quoteIdent(value: any): string;
declare function quoteLiteral(value: any): string;
declare function quoteString(value: any): string;
declare function config(cfg?: {
	pattern?: {
		ident?: string;
		literal?: string;
		string?: string;
	};
}): void;
declare function formatWithArray(fmt: string, parameters: any[]): string;
export declare function format(fmt: string, ...args: any[]): string;
export declare namespace format {
	var ident: typeof quoteIdent;
	var literal: typeof quoteLiteral;
	var string: typeof quoteString;
	var withArray: typeof formatWithArray;
	var config: typeof config;
}
/**
 * PostgreSQL Built-in Constants and Special Values
 * Use these for INSERT/UPDATE operations to get autocomplete for database functions.
 *
 * @module constants/pg-values
 *
 * @example
 * ```typescript
 * import { PgValue } from './relq';
 *
 * // Using in INSERT
 * relq('users').insert({
 *   email: 'user@example.com',
 *   created_at: PgValue.NOW,
 *   updated_at: PgValue.CURRENT_TIMESTAMP,
 *   id: PgValue.gen_random_uuid()
 * })
 *
 * // Using in UPDATE
 * relq('posts').update({
 *   updated_at: PgValue.NOW,
 *   version: PgValue.DEFAULT  // Use column default value
 * }).where(q => q.equal('id', 123))
 * ```
 */
/**
 * Wrapper class for raw SQL expressions in INSERT/UPDATE operations.
 * Prevents values from being quoted/escaped.
 */
export declare class RawValue {
	readonly value: string;
	constructor(value: string);
	toString(): string;
}
/**
 * PostgreSQL Built-in Values and Functions
 * Provides autocomplete for commonly used database functions and constants.
 *
 * **Categories:**
 * - Date/Time: NOW, CURRENT_TIMESTAMP, CURRENT_DATE, etc.
 * - UUID: gen_random_uuid()
 * - Sequences: nextval(), currval()
 * - Special: DEFAULT, NULL
 */
export declare class PgValue {
	/**
	 * Current timestamp with timezone.
	 * Alias for CURRENT_TIMESTAMP.
	 *
	 * **Usage:** Set created_at/updated_at columns
	 *
	 * @example
	 * ```typescript
	 * relq('logs').insert({ message: 'Log entry', created_at: PgValue.NOW })
	 * // SQL: INSERT INTO "logs" ("message", "created_at") VALUES ('Log entry', NOW())
	 * ```
	 */
	static readonly NOW: RawValue;
	/**
	 * Current timestamp with timezone (transaction start time).
	 * Same as NOW() within a transaction.
	 *
	 * @example
	 * ```typescript
	 * relq('events').insert({ event: 'login', timestamp: PgValue.CURRENT_TIMESTAMP })
	 * ```
	 */
	static readonly CURRENT_TIMESTAMP: RawValue;
	/**
	 * Current date (no time component).
	 *
	 * @example
	 * ```typescript
	 * relq('daily_stats').insert({ date: PgValue.CURRENT_DATE, views: 100 })
	 * ```
	 */
	static readonly CURRENT_DATE: RawValue;
	/**
	 * Current time with timezone (no date component).
	 */
	static readonly CURRENT_TIME: RawValue;
	/**
	 * Local timestamp without timezone.
	 */
	static readonly LOCALTIMESTAMP: RawValue;
	/**
	 * Local time without timezone.
	 */
	static readonly LOCALTIME: RawValue;
	/**
	 * Transaction start timestamp.
	 * More precise name for CURRENT_TIMESTAMP.
	 */
	static readonly TRANSACTION_TIMESTAMP: RawValue;
	/**
	 * Statement start timestamp (changes between statements).
	 */
	static readonly STATEMENT_TIMESTAMP: RawValue;
	/**
	 * Current clock timestamp (changes during statement execution).
	 */
	static readonly CLOCK_TIMESTAMP: RawValue;
	/**
	 * Generates a random UUID (version 4).
	 * Requires pgcrypto extension: CREATE EXTENSION IF NOT EXISTS pgcrypto;
	 *
	 * **Usage:** Auto-generate UUID primary keys
	 *
	 * @example
	 * ```typescript
	 * relq('users').insert({
	 *   id: PgValue.gen_random_uuid(),
	 *   email: 'user@example.com'
	 * })
	 * // SQL: INSERT INTO "users" ("id", "email") VALUES (gen_random_uuid(), 'user@example.com')
	 * ```
	 */
	static gen_random_uuid(): RawValue;
	/**
	 * Generates a UUID version 1 (time-based).
	 * Requires uuid-ossp extension: CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
	 */
	static uuid_generate_v1(): RawValue;
	/**
	 * Generates a UUID version 4 (random).
	 * Requires uuid-ossp extension.
	 */
	static uuid_generate_v4(): RawValue;
	/**
	 * Gets next value from a sequence.
	 *
	 * @param sequenceName - Name of the sequence
	 * @returns RawValue
	 *
	 * @example
	 * ```typescript
	 * relq('orders').insert({
	 *   order_number: PgValue.nextval('order_seq'),
	 *   customer_id: 123
	 * })
	 * // SQL: INSERT INTO "orders" ("order_number", "customer_id") VALUES (nextval('order_seq'), 123)
	 * ```
	 */
	static nextval(sequenceName: string): RawValue;
	/**
	 * Gets current value from a sequence (must be called after nextval in session).
	 */
	static currval(sequenceName: string): RawValue;
	/**
	 * Gets last value returned by nextval in the current session.
	 */
	static lastval(): RawValue;
	/**
	 * Sets sequence to specific value.
	 */
	static setval(sequenceName: string, value: number): RawValue;
	/**
	 * Uses the column's DEFAULT value.
	 *
	 * **Usage:** Explicitly use default when updating
	 *
	 * @example
	 * ```typescript
	 * relq('users').update({ status: 'active', updated_at: PgValue.DEFAULT })
	 * // SQL: UPDATE "users" SET "status" = 'active', "updated_at" = DEFAULT
	 * ```
	 */
	static readonly DEFAULT: RawValue;
	/**
	 * Explicit NULL value.
	 *
	 * @example
	 * ```typescript
	 * relq('users').update({ deleted_at: PgValue.NULL })
	 * ```
	 */
	static readonly NULL: RawValue;
	/**
	 * Boolean TRUE.
	 */
	static readonly TRUE: RawValue;
	/**
	 * Boolean FALSE.
	 */
	static readonly FALSE: RawValue;
	/**
	 * Creates an empty array.
	 * Useful when you want to explicitly set an empty array vs NULL.
	 */
	static readonly EMPTY_ARRAY: RawValue;
	/**
	 * Creates an empty JSONB object.
	 */
	static readonly EMPTY_JSONB_OBJECT: RawValue;
	/**
	 * Creates an empty JSONB array.
	 */
	static readonly EMPTY_JSONB_ARRAY: RawValue;
	/**
	 * Creates a custom raw SQL value.
	 * Use this when you need a database function not covered by the constants above.
	 *
	 * @param sql - Raw SQL expression
	 * @returns RawValue
	 *
	 * @example
	 * ```typescript
	 * relq('stats').insert({
	 *   random_score: PgValue.raw('random() * 100'),
	 *   rounded_value: PgValue.raw('round(amount, 2)')
	 * })
	 * ```
	 */
	static raw(sql: string): RawValue;
	/**
	 * Creates array constructor from values.
	 *
	 * @param values - Array of values
	 * @param type - Optional array type (default: text)
	 * @returns RawValue
	 *
	 * @example
	 * ```typescript
	 * relq('posts').insert({
	 *   tags: PgValue.array(['typescript', 'nodejs'], 'text')
	 * })
	 * // SQL: INSERT INTO "posts" ("tags") VALUES (ARRAY['typescript','nodejs']::text[])
	 * ```
	 */
	static array(values: any[], type?: string): RawValue;
	/**
	 * Creates JSONB value from any JavaScript value (object, array, primitive).
	 * Use this when inserting into a `jsonb` column that contains an array,
	 * to prevent the ORM from treating it as a PostgreSQL array type.
	 *
	 * @param value - Any value to convert to JSONB (object, array, string, number, etc.)
	 * @returns RawValue
	 *
	 * @example
	 * ```typescript
	 * // JSONB object
	 * relq('users').insert({
	 *   metadata: PgValue.jsonb({ theme: 'dark', lang: 'en' })
	 * })
	 *
	 * // JSONB array (NOT a PostgreSQL array!)
	 * relq('items').insert({
	 *   content: PgValue.jsonb([{ type: 'text', value: 'Hello' }])
	 * })
	 * // SQL: INSERT INTO "items" ("content") VALUES ('[{"type":"text","value":"Hello"}]'::jsonb)
	 * ```
	 */
	static jsonb(value: any): RawValue;
	/**
	 * Casts value to specific type.
	 *
	 * @param value - Value to cast
	 * @param type - PostgreSQL type name
	 * @returns RawValue
	 *
	 * @example
	 * ```typescript
	 * PgValue.cast('123', 'integer')  // '123'::integer
	 * PgValue.cast('2024-01-01', 'date')  // '2024-01-01'::date
	 * ```
	 */
	static cast(value: any, type: string): RawValue;
}
export declare const PG: typeof PgValue;
/**
 * SQL Functions Builder - Comprehensive PostgreSQL function support
 * Provides fluent API for all PostgreSQL built-in functions in SELECT, WHERE, and other clauses.
 *
 * @module functions/sql-functions
 */
/**
 * Base class for SQL function expressions.
 * All functions return this type for consistent chaining and aliasing.
 */
export declare class SqlFunction {
	readonly expression: string;
	constructor(expression: string);
	/**
	 * Adds an alias to the function expression using AS.
	 * @param alias - The column alias name
	 * @returns A string in format "expression AS alias"
	 */
	as(alias: string): string;
	/**
	 * Returns the raw SQL expression.
	 */
	toString(): string;
}
/**
 * String manipulation functions for PostgreSQL.
 * Provides all string operations including concatenation, case conversion, pattern matching, etc.
 *
 * @example
 * ```typescript
 * import { F } from 'relq/pg-builder';
 *
 * relq('users').select([
 *   'id',
 *   F.concat('first_name', ' ', 'last_name').as('full_name'),
 *   F.upper('email').as('email_upper'),
 *   F.substring('bio', 1, 100).as('bio_preview')
 * ])
 * ```
 */
export declare class StringFunctions {
	/**
	 * Concatenates multiple values into a single string.
	 *
	 * @param values - Values to concatenate (columns, literals, or expressions)
	 * @returns SqlFunction
	 *
	 * @example
	 * ```typescript
	 * F.concat('first_name', ' ', 'last_name')
	 * // SQL: concat("first_name", ' ', "last_name")
	 *
	 * F.concat('Hello, ', 'username', '!')
	 * // SQL: concat('Hello, ', "username", '!')
	 * ```
	 */
	static concat(...values: any[]): SqlFunction;
	/**
	 * Concatenates values with a separator. NULL values are ignored.
	 *
	 * @param separator - Separator string
	 * @param values - Values to concatenate
	 * @returns SqlFunction
	 *
	 * @example
	 * ```typescript
	 * F.concat_ws(', ', 'city', 'state', 'country')
	 * // SQL: concat_ws(', ', "city", "state", "country")
	 * ```
	 */
	static concat_ws(separator: string, ...values: any[]): SqlFunction;
	/**
	 * Converts string to lowercase.
	 *
	 * @param value - Column name or expression
	 * @returns SqlFunction
	 */
	static lower(value: string): SqlFunction;
	/**
	 * Converts string to uppercase.
	 *
	 * @param value - Column name or expression
	 * @returns SqlFunction
	 */
	static upper(value: string): SqlFunction;
	/**
	 * Capitalizes the first letter of each word.
	 *
	 * @param value - Column name or expression
	 * @returns SqlFunction
	 */
	static initcap(value: string): SqlFunction;
	/**
	 * Extracts substring from a string.
	 *
	 * @param str - String column or expression
	 * @param start - Starting position (1-indexed)
	 * @param length - Optional length
	 * @returns SqlFunction
	 *
	 * @example
	 * ```typescript
	 * F.substring('email', 1, 5)  // First 5 characters
	 * F.substring('name', 3)      // From position 3 to end
	 * ```
	 */
	static substring(str: string, start: number, length?: number): SqlFunction;
	/**
	 * Alias for substring.
	 */
	static substr(str: string, start: number, length?: number): SqlFunction;
	/**
	 * Returns the length of the string in characters.
	 *
	 * @param value - Column name or expression
	 * @returns SqlFunction
	 */
	static strLength(value: string): SqlFunction;
	/**
	 * Returns the number of characters in the string.
	 * Alias for length().
	 */
	static char_length(value: string): SqlFunction;
	/**
	 * Returns the number of bytes in the string.
	 */
	static octet_length(value: string): SqlFunction;
	/**
	 * Returns the number of bits in the string.
	 */
	static bit_length(value: string): SqlFunction;
	/**
	 * Removes leading, trailing, or both spaces (or specified characters).
	 *
	 * @param str - String to trim
	 * @param chars - Optional characters to remove (default: space)
	 * @param side - 'both' (default), 'leading', or 'trailing'
	 * @returns SqlFunction
	 */
	static trim(str: string, chars?: string, side?: "both" | "leading" | "trailing"): SqlFunction;
	/**
	 * Removes leading spaces (or specified characters).
	 */
	static ltrim(str: string, chars?: string): SqlFunction;
	/**
	 * Removes trailing spaces (or specified characters).
	 */
	static rtrim(str: string, chars?: string): SqlFunction;
	/**
	 * Removes leading and trailing spaces (or specified characters).
	 * Alias for trim().
	 */
	static btrim(str: string, chars?: string): SqlFunction;
	/**
	 * Finds the position of substring in string (1-indexed, 0 if not found).
	 *
	 * @param substring - Substring to find
	 * @param str - String to search in
	 * @returns SqlFunction
	 */
	static position(substring: string, str: string): SqlFunction;
	/**
	 * Alias for position() using strpos function.
	 */
	static strpos(str: string, substring: string): SqlFunction;
	/**
	 * Replaces all occurrences of a substring.
	 *
	 * @param str - Source string
	 * @param from - Substring to replace
	 * @param to - Replacement string
	 * @returns SqlFunction
	 */
	static replace(str: string, from: string, to: string): SqlFunction;
	/**
	 * Replaces characters using translation map.
	 *
	 * @param str - Source string
	 * @param from - Characters to replace
	 * @param to - Replacement characters
	 * @returns SqlFunction
	 */
	static translate(str: string, from: string, to: string): SqlFunction;
	/**
	 * Repeats string n times.
	 *
	 * @param str - String to repeat
	 * @param n - Number of repetitions
	 * @returns SqlFunction
	 */
	static repeat(str: string, n: number): SqlFunction;
	/**
	 * Pads string on the left to specified length.
	 *
	 * @param str - String to pad
	 * @param length - Target length
	 * @param fill - Fill character (default: space)
	 * @returns SqlFunction
	 */
	static lpad(str: string, length: number, fill?: string): SqlFunction;
	/**
	 * Pads string on the right to specified length.
	 *
	 * @param str - String to pad
	 * @param length - Target length
	 * @param fill - Fill character (default: space)
	 * @returns SqlFunction
	 */
	static rpad(str: string, length: number, fill?: string): SqlFunction;
	/**
	 * Reverses the string.
	 */
	static reverse(str: string): SqlFunction;
	/**
	 * Splits string by delimiter and returns nth part (1-indexed).
	 *
	 * @param str - String to split
	 * @param delimiter - Delimiter
	 * @param position - Position of part to return (1-indexed)
	 * @returns SqlFunction
	 */
	static split_part(str: string, delimiter: string, position: number): SqlFunction;
	/**
	 * Matches string against regex pattern and returns first match.
	 *
	 * @param str - String to search
	 * @param pattern - Regular expression pattern
	 * @param flags - Optional regex flags (e.g., 'i' for case-insensitive)
	 * @returns SqlFunction
	 */
	static regexp_match(str: string, pattern: string, flags?: string): SqlFunction;
	/**
	 * Matches string against regex pattern and returns all matches.
	 */
	static regexp_matches(str: string, pattern: string, flags?: string): SqlFunction;
	/**
	 * Replaces substring(s) matching regex pattern.
	 *
	 * @param str - Source string
	 * @param pattern - Regular expression pattern
	 * @param replacement - Replacement string
	 * @param flags - Optional regex flags (e.g., 'g' for global)
	 * @returns SqlFunction
	 */
	static regexp_replace(str: string, pattern: string, replacement: string, flags?: string): SqlFunction;
	/**
	 * Splits string by regex pattern into array.
	 */
	static regexp_split_to_array(str: string, pattern: string, flags?: string): SqlFunction;
	/**
	 * Splits string by regex pattern into rows.
	 */
	static regexp_split_to_table(str: string, pattern: string, flags?: string): SqlFunction;
	/**
	 * Encodes binary data to text representation.
	 *
	 * @param data - Column containing binary data
	 * @param format - Encoding format: 'base64', 'hex', 'escape'
	 * @returns SqlFunction
	 */
	static encode(data: string, fmt: "base64" | "hex" | "escape"): SqlFunction;
	/**
	 * Decodes text to binary data.
	 *
	 * @param data - Column containing encoded text
	 * @param format - Decoding format: 'base64', 'hex', 'escape'
	 * @returns SqlFunction
	 */
	static decode(data: string, fmt: "base64" | "hex" | "escape"): SqlFunction;
	/**
	 * Computes MD5 hash of string.
	 */
	static md5(str: string): SqlFunction;
	/**
	 * Converts string to ASCII representation.
	 */
	static ascii(str: string): SqlFunction;
	/**
	 * Converts ASCII code to character.
	 */
	static chr(code: number): SqlFunction;
	/**
	 * Converts number to hexadecimal string.
	 */
	static to_hex(num: string | number): SqlFunction;
	/**
	 * Left-pads string with zeros to specified width.
	 */
	static lpad_zero(str: string, width: number): SqlFunction;
	/**
	 * Formats string using sprintf-style format.
	 *
	 * @param formatStr - Format string with placeholders
	 * @param values - Values to substitute
	 * @returns SqlFunction
	 */
	static format(formatStr: string, ...values: any[]): SqlFunction;
	/**
	 * Quotes string as SQL identifier (adds double quotes).
	 */
	static quote_ident(str: string): SqlFunction;
	/**
	 * Quotes value as SQL literal.
	 */
	static quote_literal(str: string): SqlFunction;
	/**
	 * Quotes value as SQL literal, returns NULL for NULL input.
	 */
	static quote_nullable(str: string): SqlFunction;
}
/**
 * Date and time manipulation functions for PostgreSQL.
 *
 * @example
 * ```typescript
 * relq('events').select([
 *   F.date_trunc('month', 'created_at').as('month'),
 *   F.extract('year', 'created_at').as('year'),
 *   F.age('updated_at', 'created_at').as('duration')
 * ])
 * ```
 */
export declare class DateTimeFunctions {
	/**
	 * Returns current date and time with timezone.
	 */
	static now(): SqlFunction;
	/**
	 * Returns current date.
	 */
	static current_date(): SqlFunction;
	/**
	 * Returns current time with timezone.
	 */
	static current_time(): SqlFunction;
	/**
	 * Returns current timestamp with timezone.
	 */
	static current_timestamp(): SqlFunction;
	/**
	 * Returns transaction start time.
	 */
	static transaction_timestamp(): SqlFunction;
	/**
	 * Returns statement start time.
	 */
	static statement_timestamp(): SqlFunction;
	/**
	 * Returns current clock time (changes during statement execution).
	 */
	static clock_timestamp(): SqlFunction;
	/**
	 * Returns current date and time without timezone.
	 */
	static localtimestamp(): SqlFunction;
	/**
	 * Truncates timestamp to specified precision.
	 *
	 * @param field - Precision: 'microseconds', 'milliseconds', 'second', 'minute', 'hour', 'day', 'week', 'month', 'quarter', 'year', 'decade', 'century', 'millennium'
	 * @param source - Timestamp column or expression
	 * @returns SqlFunction
	 *
	 * @example
	 * ```typescript
	 * F.date_trunc('month', 'created_at')  // Truncate to start of month
	 * F.date_trunc('day', 'updated_at')    // Truncate to start of day
	 * ```
	 */
	static date_trunc(field: string, source: string): SqlFunction;
	/**
	 * Extracts subfield from date/time value.
	 *
	 * @param field - Field to extract: 'century', 'day', 'decade', 'dow' (day of week), 'doy' (day of year), 'epoch', 'hour', 'isodow', 'isoyear', 'microseconds', 'millennium', 'milliseconds', 'minute', 'month', 'quarter', 'second', 'timezone', 'timezone_hour', 'timezone_minute', 'week', 'year'
	 * @param source - Date/time column
	 * @returns SqlFunction
	 *
	 * @example
	 * ```typescript
	 * F.extract('year', 'created_at')   // Extract year
	 * F.extract('month', 'updated_at')  // Extract month
	 * F.extract('epoch', 'timestamp')   // Convert to Unix timestamp
	 * ```
	 */
	static extract(field: string, source: string): SqlFunction;
	/**
	 * Alias for extract() using date_part function.
	 */
	static date_part(field: string, source: string): SqlFunction;
	/**
	 * Calculates age between two timestamps or between timestamp and now.
	 *
	 * @param timestamp1 - End timestamp (or column name)
	 * @param timestamp2 - Optional start timestamp
	 * @returns SqlFunction
	 *
	 * @example
	 * ```typescript
	 * F.age('updated_at')                    // Age from now
	 * F.age('completed_at', 'started_at')    // Duration between two timestamps
	 * ```
	 */
	static age(timestamp1: string, timestamp2?: string): SqlFunction;
	/**
	 * Constructs date from year, month, day.
	 */
	static make_date(year: number | string, month: number | string, day: number | string): SqlFunction;
	/**
	 * Constructs time from hour, minute, second.
	 */
	static make_time(hour: number | string, min: number | string, sec: number | string): SqlFunction;
	/**
	 * Constructs timestamp from components.
	 */
	static make_timestamp(year: number | string, month: number | string, day: number | string, hour: number | string, min: number | string, sec: number | string): SqlFunction;
	/**
	 * Constructs interval from components.
	 *
	 * @param years - Years
	 * @param months - Months
	 * @param weeks - Weeks
	 * @param days - Days
	 * @param hours - Hours
	 * @param mins - Minutes
	 * @param secs - Seconds
	 * @returns SqlFunction
	 */
	static make_interval(years?: number, months?: number, weeks?: number, days?: number, hours?: number, mins?: number, secs?: number): SqlFunction;
	/**
	 * Converts Unix timestamp (seconds since epoch) to timestamp.
	 */
	static to_timestamp(unixTimestamp: number | string): SqlFunction;
	/**
	 * Converts string to timestamp using format.
	 *
	 * @param text - String to parse
	 * @param format - Format pattern
	 * @returns SqlFunction
	 */
	static to_timestamp_format(text: string, formatPattern: string): SqlFunction;
	/**
	 * Converts string to date using format.
	 */
	static to_date(text: string, formatPattern: string): SqlFunction;
	/**
	 * Formats timestamp as string using pattern.
	 *
	 * @param timestamp - Timestamp column
	 * @param format - Format pattern (e.g., 'YYYY-MM-DD', 'HH24:MI:SS')
	 * @returns SqlFunction
	 */
	static to_char(timestamp: string, formatPattern: string): SqlFunction;
	/**
	 * Converts timestamp to different timezone.
	 *
	 * @param timestamp - Timestamp column
	 * @param timezone - Target timezone (e.g., 'UTC', 'America/New_York')
	 * @returns SqlFunction
	 */
	static timezone(timestamp: string, timezone: string): SqlFunction;
	/**
	 * Adjusts interval to standard format (30-day months).
	 */
	static justify_days(interval: string): SqlFunction;
	/**
	 * Adjusts interval to standard format (24-hour days).
	 */
	static justify_hours(interval: string): SqlFunction;
	/**
	 * Adjusts interval using both justify_days and justify_hours.
	 */
	static justify_interval(interval: string): SqlFunction;
	/**
	 * Checks if date is finite (not infinity).
	 */
	static isfinite(date: string): SqlFunction;
}
/**
 * Mathematical and numeric functions for PostgreSQL.
 *
 * @example
 * ```typescript
 * relq('orders').select([
 *   F.round('amount', 2).as('rounded_amount'),
 *   F.abs('balance').as('absolute_balance'),
 *   F.ceil('price').as('ceiling_price')
 * ])
 * ```
 */
export declare class MathFunctions {
	/**
	 * Absolute value.
	 */
	static abs(x: string | number): SqlFunction;
	/**
	 * Sign of the value (-1, 0, or 1).
	 */
	static sign(x: string | number): SqlFunction;
	/**
	 * Rounds to nearest integer (ceiling).
	 */
	static ceil(x: string | number): SqlFunction;
	/**
	 * Alias for ceil.
	 */
	static ceiling(x: string | number): SqlFunction;
	/**
	 * Rounds down to nearest integer (floor).
	 */
	static floor(x: string | number): SqlFunction;
	/**
	 * Rounds to specified decimal places.
	 *
	 * @param x - Number to round
	 * @param decimals - Number of decimal places (default: 0)
	 * @returns SqlFunction
	 */
	static round(x: string | number, decimals?: number): SqlFunction;
	/**
	 * Truncates to specified decimal places (no rounding).
	 */
	static trunc(x: string | number, decimals?: number): SqlFunction;
	/**
	 * Modulo (remainder of division).
	 */
	static mod(dividend: string | number, divisor: number): SqlFunction;
	/**
	 * Integer division (quotient).
	 */
	static div(dividend: string | number, divisor: number): SqlFunction;
	/**
	 * Raises x to the power of y.
	 */
	static power(x: string | number, y: number): SqlFunction;
	/**
	 * Square root.
	 */
	static sqrt(x: string | number): SqlFunction;
	/**
	 * Cube root.
	 */
	static cbrt(x: string | number): SqlFunction;
	/**
	 * Exponential (e^x).
	 */
	static exp(x: string | number): SqlFunction;
	/**
	 * Natural logarithm.
	 */
	static ln(x: string | number): SqlFunction;
	/**
	 * Logarithm to base 10.
	 */
	static log10(x: string | number): SqlFunction;
	/**
	 * Logarithm to arbitrary base.
	 */
	static log(base: number, x: string | number): SqlFunction;
	/**
	 * Pi constant (3.14159...).
	 */
	static pi(): SqlFunction;
	/**
	 * Converts radians to degrees.
	 */
	static degrees(radians: string | number): SqlFunction;
	/**
	 * Converts degrees to radians.
	 */
	static radians(degrees: string | number): SqlFunction;
	/**
	 * Sine (input in radians).
	 */
	static sin(x: string | number): SqlFunction;
	/**
	 * Cosine (input in radians).
	 */
	static cos(x: string | number): SqlFunction;
	/**
	 * Tangent (input in radians).
	 */
	static tan(x: string | number): SqlFunction;
	/**
	 * Arcsine (result in radians).
	 */
	static asin(x: string | number): SqlFunction;
	/**
	 * Arccosine (result in radians).
	 */
	static acos(x: string | number): SqlFunction;
	/**
	 * Arctangent (result in radians).
	 */
	static atan(x: string | number): SqlFunction;
	/**
	 * Arctangent of y/x (result in radians).
	 */
	static atan2(y: string | number, x: string | number): SqlFunction;
	/**
	 * Random value between 0.0 and 1.0.
	 */
	static random(): SqlFunction;
	/**
	 * Sets seed for random number generator (0.0 to 1.0).
	 */
	static setseed(seed: number): SqlFunction;
	/**
	 * Greatest common divisor.
	 */
	static gcd(a: string | number, b: string | number): SqlFunction;
	/**
	 * Least common multiple.
	 */
	static lcm(a: string | number, b: string | number): SqlFunction;
	/**
	 * Factorial.
	 */
	static factorial(n: string | number): SqlFunction;
	/**
	 * Returns greatest (maximum) of values.
	 */
	static greatest(...values: any[]): SqlFunction;
	/**
	 * Returns least (minimum) of values.
	 */
	static least(...values: any[]): SqlFunction;
	/**
	 * Computes histogram bucket number.
	 *
	 * @param operand - Value to bucket
	 * @param min - Minimum bound
	 * @param max - Maximum bound
	 * @param count - Number of buckets
	 * @returns SqlFunction
	 */
	static width_bucket(operand: string | number, min: number, max: number, count: number): SqlFunction;
}
/**
 * PostgreSQL array manipulation functions.
 *
 * @example
 * ```typescript
 * relq('posts').select([
 *   F.array_length('tags', 1).as('tag_count'),
 *   F.array_agg('category_id').as('categories'),
 *   F.unnest('email_list').as('email')
 * ])
 * ```
 */
export declare class ArrayFunctions {
	/**
	 * Returns the length of the requested array dimension.
	 *
	 * @param array - Array column name
	 * @param dimension - Dimension number (1-based)
	 * @returns SqlFunction
	 */
	static array_length(array: string, dimension?: number): SqlFunction;
	/**
	 * Appends an element to the end of an array.
	 */
	static array_append(array: string, element: any): SqlFunction;
	/**
	 * Prepends an element to the beginning of an array.
	 */
	static array_prepend(element: any, array: string): SqlFunction;
	/**
	 * Concatenates two arrays.
	 */
	static array_cat(array1: string, array2: string): SqlFunction;
	/**
	 * Removes all occurrences of an element from an array.
	 */
	static array_remove(array: string, element: any): SqlFunction;
	/**
	 * Replaces all occurrences of an element with another element.
	 */
	static array_replace(array: string, from: any, to: any): SqlFunction;
	/**
	 * Returns the first position of an element in an array (1-indexed, NULL if not found).
	 */
	static array_position(array: string, element: any): SqlFunction;
	/**
	 * Returns all positions of an element in an array.
	 */
	static array_positions(array: string, element: any): SqlFunction;
	/**
	 * Returns the array dimensions as text.
	 */
	static array_dims(array: string): SqlFunction;
	/**
	 * Returns the lower bound of an array dimension.
	 */
	static array_lower(array: string, dimension: number): SqlFunction;
	/**
	 * Returns the upper bound of an array dimension.
	 */
	static array_upper(array: string, dimension: number): SqlFunction;
	/**
	 * Returns the total number of elements in an array.
	 */
	static cardinality(array: string): SqlFunction;
	/**
	 * Converts array to string with delimiter.
	 *
	 * @param array - Array column
	 * @param delimiter - Delimiter string
	 * @param nullString - Optional string to represent NULL values
	 * @returns SqlFunction
	 */
	static array_to_string(array: string, delimiter: string, nullString?: string): SqlFunction;
	/**
	 * Converts string to array using delimiter.
	 *
	 * @param str - String to split
	 * @param delimiter - Delimiter string
	 * @param nullString - Optional string that should be converted to NULL
	 * @returns SqlFunction
	 */
	static string_to_array(str: string, delimiter: string, nullString?: string): SqlFunction;
	/**
	 * Expands an array to a set of rows.
	 * Used in FROM clause or as a lateral join.
	 *
	 * @param array - Array column or expression
	 * @returns SqlFunction
	 */
	static unnest(array: string): SqlFunction;
	/**
	 * Creates an array filled with a value.
	 *
	 * @param value - Value to fill
	 * @param dimensions - Array dimensions
	 * @returns SqlFunction
	 */
	static array_fill(value: any, dimensions: number[]): SqlFunction;
	/**
	 * Aggregates values into an array.
	 * Use in SELECT with GROUP BY.
	 *
	 * @param expression - Column or expression to aggregate
	 * @returns SqlFunction
	 *
	 * @example
	 * ```typescript
	 * relq('orders')
	 *   .select(['customer_id', F.array_agg('product_id').as('products')])
	 *   .groupBy('customer_id')
	 * ```
	 */
	static array_agg(expression: string): SqlFunction;
	/**
	 * Aggregates values into an array with ORDER BY.
	 */
	static array_agg_order(expression: string, orderBy: string, direction?: "ASC" | "DESC"): SqlFunction;
}
/**
 * JSONB manipulation and construction functions.
 *
 * @example
 * ```typescript
 * relq('data').select([
 *   F.jsonb_array_length('items').as('item_count'),
 *   F.jsonb_object_keys('metadata').as('keys'),
 *   F.jsonb_build_object('id', 'user_id', 'name', 'username').as('user_obj')
 * ])
 * ```
 */
export declare class JsonbFunctions {
	/**
	 * Returns the number of elements in the top-level JSON array.
	 */
	static jsonb_array_length(jsonb: string): SqlFunction;
	/**
	 * Expands JSONB object to key-value pairs (returns setof record).
	 */
	static jsonb_each(jsonb: string): SqlFunction;
	/**
	 * Expands JSONB object to key-value pairs with text values.
	 */
	static jsonb_each_text(jsonb: string): SqlFunction;
	/**
	 * Returns set of keys from top-level JSONB object.
	 */
	static jsonb_object_keys(jsonb: string): SqlFunction;
	/**
	 * Expands JSONB array to set of JSONB values.
	 */
	static jsonb_array_elements(jsonb: string): SqlFunction;
	/**
	 * Expands JSONB array to set of text values.
	 */
	static jsonb_array_elements_text(jsonb: string): SqlFunction;
	/**
	 * Returns the type of the top-level JSON value as text.
	 * Possible values: 'object', 'array', 'string', 'number', 'boolean', 'null'
	 */
	static jsonb_typeof(jsonb: string): SqlFunction;
	/**
	 * Removes all object fields with null values from JSONB.
	 * Operates recursively.
	 */
	static jsonb_strip_nulls(jsonb: string): SqlFunction;
	/**
	 * Formats JSONB as indented JSON text.
	 */
	static jsonb_pretty(jsonb: string): SqlFunction;
	/**
	 * Sets or replaces value at specified path.
	 *
	 * @param target - JSONB column
	 * @param path - Path array
	 * @param newValue - New value to set
	 * @param createMissing - Whether to create missing keys (default: true)
	 * @returns SqlFunction
	 */
	static jsonb_set(target: string, path: string[], newValue: any, createMissing?: boolean): SqlFunction;
	/**
	 * Inserts value at specified path. Returns error if path already exists.
	 */
	static jsonb_insert(target: string, path: string[], newValue: any, insertAfter?: boolean): SqlFunction;
	/**
	 * Builds JSONB object from alternating key-value pairs.
	 *
	 * @param keyValuePairs - Alternating keys and values
	 * @returns SqlFunction
	 *
	 * @example
	 * ```typescript
	 * F.jsonb_build_object('id', 'user_id', 'name', 'username', 'age', 25)
	 * // SQL: jsonb_build_object('id', "user_id", 'name', "username", 'age', 25)
	 * ```
	 */
	static jsonb_build_object(...keyValuePairs: any[]): SqlFunction;
	/**
	 * Builds JSONB array from variadic arguments.
	 */
	static jsonb_build_array(...values: any[]): SqlFunction;
	/**
	 * Converts JSONB to text.
	 */
	static jsonb_to_text(jsonb: string): SqlFunction;
	/**
	 * Converts text to JSONB.
	 */
	static text_to_jsonb(text: string): SqlFunction;
	/**
	 * Aggregates values into JSONB array.
	 */
	static jsonb_agg(expression: string): SqlFunction;
	/**
	 * Aggregates key-value pairs into JSONB object.
	 *
	 * @param keys - Column for keys
	 * @param values - Column for values
	 * @returns SqlFunction
	 */
	static jsonb_object_agg(keys: string, values: string): SqlFunction;
}
/**
 * SQL aggregate functions for GROUP BY queries.
 *
 * @example
 * ```typescript
 * relq('orders')
 *   .select([
 *     'customer_id',
 *     F.count('*').as('order_count'),
 *     F.sum('amount').as('total_amount'),
 *     F.avg('amount').as('avg_amount'),
 *     F.string_agg('product_name', ', ').as('products')
 *   ])
 *   .groupBy('customer_id')
 * ```
 */
declare class AggregateFunctions$1 {
	/**
	 * Counts rows.
	 *
	 * @param expression - Column name or '*' for all rows
	 * @returns SqlFunction
	 */
	static count(expression?: string): SqlFunction;
	/**
	 * Counts distinct values.
	 */
	static count_distinct(expression: string): SqlFunction;
	/**
	 * Sums numeric values.
	 */
	static sum(expression: string): SqlFunction;
	/**
	 * Calculates average of numeric values.
	 */
	static avg(expression: string): SqlFunction;
	/**
	 * Finds minimum value.
	 */
	static min(expression: string): SqlFunction;
	/**
	 * Finds maximum value.
	 */
	static max(expression: string): SqlFunction;
	/**
	 * Concatenates strings with delimiter.
	 *
	 * @param expression - Column to aggregate
	 * @param delimiter - Separator string
	 * @returns SqlFunction
	 */
	static string_agg(expression: string, delimiter: string): SqlFunction;
	/**
	 * Concatenates strings with delimiter and ordering.
	 */
	static string_agg_order(expression: string, delimiter: string, orderBy: string, direction?: "ASC" | "DESC"): SqlFunction;
	/**
	 * Returns true if all input values are true.
	 */
	static bool_and(expression: string): SqlFunction;
	/**
	 * Returns true if any input value is true.
	 */
	static bool_or(expression: string): SqlFunction;
	/**
	 * Alias for bool_and. Returns true if all values are true.
	 */
	static every(expression: string): SqlFunction;
	/**
	 * Bitwise AND of all non-null input values.
	 */
	static bit_and(expression: string): SqlFunction;
	/**
	 * Bitwise OR of all non-null input values.
	 */
	static bit_or(expression: string): SqlFunction;
	/**
	 * Population standard deviation.
	 */
	static stddev_pop(expression: string): SqlFunction;
	/**
	 * Sample standard deviation.
	 */
	static stddev_samp(expression: string): SqlFunction;
	/**
	 * Alias for stddev_samp.
	 */
	static stddev(expression: string): SqlFunction;
	/**
	 * Population variance.
	 */
	static var_pop(expression: string): SqlFunction;
	/**
	 * Sample variance.
	 */
	static var_samp(expression: string): SqlFunction;
	/**
	 * Alias for var_samp.
	 */
	static variance(expression: string): SqlFunction;
	/**
	 * Correlation coefficient.
	 */
	static corr(y: string, x: string): SqlFunction;
	/**
	 * Population covariance.
	 */
	static covar_pop(y: string, x: string): SqlFunction;
	/**
	 * Sample covariance.
	 */
	static covar_samp(y: string, x: string): SqlFunction;
	/**
	 * Continuous percentile (interpolates).
	 *
	 * @param percentile - Percentile value (0-1)
	 * @param expression - Column to compute percentile for
	 * @returns SqlFunction
	 */
	static percentile_cont(percentile: number, expression: string): SqlFunction;
	/**
	 * Discrete percentile (returns actual value from dataset).
	 */
	static percentile_disc(percentile: number, expression: string): SqlFunction;
	/**
	 * Returns most frequent value (mode).
	 */
	static mode(expression: string): SqlFunction;
}
/**
 * Conditional expression functions (COALESCE, NULLIF, etc.).
 *
 * @example
 * ```typescript
 * relq('users').select([
 *   F.coalesce('nickname', 'username', 'email').as('display_name'),
 *   F.nullif('status', 'unknown').as('clean_status')
 * ])
 * ```
 */
export declare class ConditionalFunctions {
	/**
	 * Returns first non-null value from list.
	 *
	 * @param values - Values to check (column names or literals)
	 * @returns SqlFunction
	 */
	static coalesce(...values: any[]): SqlFunction;
	/**
	 * Returns NULL if two values are equal, otherwise returns first value.
	 *
	 * @param value1 - First value
	 * @param value2 - Second value
	 * @returns SqlFunction
	 */
	static nullif(value1: string | number, value2: string | number): SqlFunction;
}
declare class GeometricFunctions {
	/**
	 * Computes the area of a geometric object (box, circle, path, polygon).
	 *
	 * @param column - The geometric column name
	 * @returns SqlFunction representing area(column)
	 *
	 * @example
	 * ```typescript
	 * F.geometric.area('building_footprint')
	 * // SQL: area("building_footprint")
	 * ```
	 */
	static area(column: string): SqlFunction;
	/**
	 * Computes the center point of a geometric object.
	 *
	 * @param column - The geometric column name
	 * @returns SqlFunction representing center(column)
	 *
	 * @example
	 * ```typescript
	 * F.geometric.center('bounding_box')
	 * // SQL: center("bounding_box")
	 * ```
	 */
	static center(column: string): SqlFunction;
	/**
	 * Computes the diameter of a circle.
	 *
	 * @param column - The circle column name
	 * @returns SqlFunction representing diameter(column)
	 *
	 * @example
	 * ```typescript
	 * F.geometric.diameter('coverage_area')
	 * // SQL: diameter("coverage_area")
	 * ```
	 */
	static diameter(column: string): SqlFunction;
	/**
	 * Computes the vertical size (height) of a box.
	 *
	 * @param column - The box column name
	 * @returns SqlFunction representing height(column)
	 *
	 * @example
	 * ```typescript
	 * F.geometric.height('bounding_box')
	 * // SQL: height("bounding_box")
	 * ```
	 */
	static height(column: string): SqlFunction;
	/**
	 * Computes the horizontal size (width) of a box.
	 *
	 * @param column - The box column name
	 * @returns SqlFunction representing width(column)
	 *
	 * @example
	 * ```typescript
	 * F.geometric.width('bounding_box')
	 * // SQL: width("bounding_box")
	 * ```
	 */
	static width(column: string): SqlFunction;
	/**
	 * Computes the length of a geometric object (lseg, path).
	 *
	 * @param column - The geometric column name
	 * @returns SqlFunction representing length(column)
	 *
	 * @example
	 * ```typescript
	 * F.geometric.geoLength('route_path')
	 * // SQL: length("route_path")
	 * ```
	 */
	static geoLength(column: string): SqlFunction;
	/**
	 * Returns the number of points in a path or polygon.
	 *
	 * @param column - The path or polygon column name
	 * @returns SqlFunction representing npoints(column)
	 *
	 * @example
	 * ```typescript
	 * F.geometric.npoints('polygon_boundary')
	 * // SQL: npoints("polygon_boundary")
	 * ```
	 */
	static npoints(column: string): SqlFunction;
	/**
	 * Tests if a path is closed.
	 *
	 * @param column - The path column name
	 * @returns SqlFunction representing isclosed(column)
	 *
	 * @example
	 * ```typescript
	 * F.geometric.isclosed('route')
	 * // SQL: isclosed("route")
	 * ```
	 */
	static isclosed(column: string): SqlFunction;
	/**
	 * Tests if a path is open.
	 *
	 * @param column - The path column name
	 * @returns SqlFunction representing isopen(column)
	 *
	 * @example
	 * ```typescript
	 * F.geometric.isopen('route')
	 * // SQL: isopen("route")
	 * ```
	 */
	static isopen(column: string): SqlFunction;
	/**
	 * Converts an open path to a closed path.
	 *
	 * @param column - The path column name
	 * @returns SqlFunction representing pclose(column)
	 *
	 * @example
	 * ```typescript
	 * F.geometric.pclose('open_route')
	 * // SQL: pclose("open_route")
	 * ```
	 */
	static pclose(column: string): SqlFunction;
	/**
	 * Converts a closed path to an open path.
	 *
	 * @param column - The path column name
	 * @returns SqlFunction representing popen(column)
	 *
	 * @example
	 * ```typescript
	 * F.geometric.popen('closed_route')
	 * // SQL: popen("closed_route")
	 * ```
	 */
	static popen(column: string): SqlFunction;
	/**
	 * Returns the radius of a circle.
	 *
	 * @param column - The circle column name
	 * @returns SqlFunction representing radius(column)
	 *
	 * @example
	 * ```typescript
	 * F.geometric.radius('coverage_circle')
	 * // SQL: radius("coverage_circle")
	 * ```
	 */
	static radius(column: string): SqlFunction;
	/**
	 * Computes the slope of a line segment between two points.
	 *
	 * @param point1 - First point column or value
	 * @param point2 - Second point column or value
	 * @returns SqlFunction representing slope(point1, point2)
	 *
	 * @example
	 * ```typescript
	 * F.geometric.slope('start_point', 'end_point')
	 * // SQL: slope("start_point", "end_point")
	 * ```
	 */
	static slope(point1: string, point2: string): SqlFunction;
	/**
	 * Computes the distance between two geometric objects.
	 *
	 * @param column - The geometric column name
	 * @param value - The value to measure distance to
	 * @returns SqlFunction representing column <-> value
	 *
	 * @example
	 * ```typescript
	 * F.geometric.distance('location', '(0,0)')
	 * // SQL: "location" <-> '(0,0)'
	 * ```
	 */
	static distance(column: string, value: string): SqlFunction;
	/**
	 * Converts a geometric object to a box.
	 *
	 * @param column - The geometric column name
	 * @returns SqlFunction representing box(column)
	 *
	 * @example
	 * ```typescript
	 * F.geometric.toBox('circle_column')
	 * // SQL: box("circle_column")
	 * ```
	 */
	static toBox(column: string): SqlFunction;
	/**
	 * Converts a geometric object to a circle.
	 *
	 * @param column - The geometric column name
	 * @returns SqlFunction representing circle(column)
	 *
	 * @example
	 * ```typescript
	 * F.geometric.toCircle('box_column')
	 * // SQL: circle("box_column")
	 * ```
	 */
	static toCircle(column: string): SqlFunction;
	/**
	 * Converts two points to a line.
	 *
	 * @param point1 - First point column or value
	 * @param point2 - Second point column or value
	 * @returns SqlFunction representing line(point1, point2)
	 *
	 * @example
	 * ```typescript
	 * F.geometric.toLine('start_point', 'end_point')
	 * // SQL: line("start_point", "end_point")
	 * ```
	 */
	static toLine(point1: string, point2: string): SqlFunction;
	/**
	 * Converts two points to a line segment.
	 *
	 * @param point1 - First point column or value
	 * @param point2 - Second point column or value
	 * @returns SqlFunction representing lseg(point1, point2)
	 *
	 * @example
	 * ```typescript
	 * F.geometric.toLseg('start_point', 'end_point')
	 * // SQL: lseg("start_point", "end_point")
	 * ```
	 */
	static toLseg(point1: string, point2: string): SqlFunction;
	/**
	 * Converts a polygon to a path.
	 *
	 * @param column - The polygon column name
	 * @returns SqlFunction representing path(column)
	 *
	 * @example
	 * ```typescript
	 * F.geometric.toPath('polygon_column')
	 * // SQL: path("polygon_column")
	 * ```
	 */
	static toPath(column: string): SqlFunction;
	/**
	 * Extracts the center point of a geometric object.
	 *
	 * @param column - The geometric column name
	 * @returns SqlFunction representing point(column)
	 *
	 * @example
	 * ```typescript
	 * F.geometric.toPoint('box_column')
	 * // SQL: point("box_column")
	 * ```
	 */
	static toPoint(column: string): SqlFunction;
	/**
	 * Converts a geometric object to a polygon.
	 *
	 * @param column - The geometric column name
	 * @returns SqlFunction representing polygon(column)
	 *
	 * @example
	 * ```typescript
	 * F.geometric.toPolygon('path_column')
	 * // SQL: polygon("path_column")
	 * ```
	 */
	static toPolygon(column: string): SqlFunction;
	/**
	 * Creates a point from x and y coordinates.
	 *
	 * @param x - X coordinate (column name or number)
	 * @param y - Y coordinate (column name or number)
	 * @returns SqlFunction representing point(x, y)
	 *
	 * @example
	 * ```typescript
	 * F.geometric.point('longitude', 'latitude')
	 * // SQL: point("longitude", "latitude")
	 *
	 * F.geometric.point(10, 20)
	 * // SQL: point(10, 20)
	 * ```
	 */
	static point(x: string | number, y: string | number): SqlFunction;
	/**
	 * Creates a box from two corner points.
	 *
	 * @param point1 - First corner (column name or point value)
	 * @param point2 - Second corner (column name or point value)
	 * @returns SqlFunction representing box(point1, point2)
	 *
	 * @example
	 * ```typescript
	 * F.geometric.box('corner1', 'corner2')
	 * // SQL: box("corner1", "corner2")
	 * ```
	 */
	static box(point1: string, point2: string): SqlFunction;
	/**
	 * Creates a circle from center point and radius.
	 *
	 * @param center - Center point (column name or point value)
	 * @param radius - Radius value
	 * @returns SqlFunction representing circle(center, radius)
	 *
	 * @example
	 * ```typescript
	 * F.geometric.circle('center_point', 10)
	 * // SQL: circle("center_point", 10)
	 * ```
	 */
	static circle(center: string, radius: number): SqlFunction;
	/**
	 * Translates (moves) a geometric object by a point offset.
	 *
	 * @param column - The geometric column name
	 * @param offset - The point offset to add
	 * @returns SqlFunction representing column + offset
	 *
	 * @example
	 * ```typescript
	 * F.geometric.translate('location', '(10,20)')
	 * // SQL: "location" + point '(10,20)'
	 * ```
	 */
	static translate(column: string, offset: string): SqlFunction;
	/**
	 * Scales a geometric object by a point factor.
	 *
	 * @param column - The geometric column name
	 * @param factor - The point scale factor
	 * @returns SqlFunction representing column * factor
	 *
	 * @example
	 * ```typescript
	 * F.geometric.scale('shape', '(2,2)')
	 * // SQL: "shape" * point '(2,2)'
	 * ```
	 */
	static scale(column: string, factor: string): SqlFunction;
	/**
	 * Rotates a geometric object around the origin by a point (interpreted as complex number).
	 *
	 * @param column - The geometric column name
	 * @param rotation - The rotation point (complex number representation)
	 * @returns SqlFunction representing column / rotation
	 *
	 * @example
	 * ```typescript
	 * // Rotate 90 degrees (using complex number i = (0,1))
	 * F.geometric.rotate('shape', '(0,1)')
	 * // SQL: "shape" / point '(0,1)'
	 * ```
	 */
	static rotate(column: string, rotation: string): SqlFunction;
	/**
	 * Computes the intersection point of two lines.
	 *
	 * @param line1 - First line column
	 * @param line2 - Second line column
	 * @returns SqlFunction representing line1 # line2
	 *
	 * @example
	 * ```typescript
	 * F.geometric.intersection('line_a', 'line_b')
	 * // SQL: "line_a" # "line_b"
	 * ```
	 */
	static intersection(line1: string, line2: string): SqlFunction;
	/**
	 * Computes the closest point on a line segment to a point.
	 *
	 * @param lseg - The line segment column
	 * @param point - The point to find closest point to
	 * @returns SqlFunction representing lseg ## point
	 *
	 * @example
	 * ```typescript
	 * F.geometric.closestPoint('segment', 'target_point')
	 * // SQL: "segment" ## "target_point"
	 * ```
	 */
	static closestPoint(lseg: string, point: string): SqlFunction;
	/**
	 * Computes the bounding box of a geometric object.
	 *
	 * @param column - The geometric column name
	 * @returns SqlFunction representing bound_box(column, column)
	 *
	 * @example
	 * ```typescript
	 * F.geometric.boundingBox('polygon_column')
	 * // SQL: box("polygon_column")
	 * ```
	 */
	static boundingBox(column: string): SqlFunction;
}
declare class NetworkFunctions {
	/**
	 * Returns abbreviated text representation of inet or cidr.
	 *
	 * @param column - The inet/cidr column name
	 * @returns SqlFunction representing abbrev(column)
	 *
	 * @example
	 * ```typescript
	 * F.network.abbrev('ip_address')
	 * // SQL: abbrev("ip_address")
	 * // Result: '10.1.0.0/16' (removes host bits for cidr)
	 * ```
	 */
	static abbrev(column: string): SqlFunction;
	/**
	 * Returns the broadcast address for a network.
	 *
	 * @param column - The inet column name
	 * @returns SqlFunction representing broadcast(column)
	 *
	 * @example
	 * ```typescript
	 * F.network.broadcast('ip_address')
	 * // SQL: broadcast("ip_address")
	 * // Result: '192.168.1.255/24' for '192.168.1.5/24'
	 * ```
	 */
	static broadcast(column: string): SqlFunction;
	/**
	 * Returns the address family: 4 for IPv4, 6 for IPv6.
	 *
	 * @param column - The inet/cidr column name
	 * @returns SqlFunction representing family(column)
	 *
	 * @example
	 * ```typescript
	 * F.network.family('ip_address')
	 * // SQL: family("ip_address")
	 * // Result: 4 for IPv4, 6 for IPv6
	 * ```
	 */
	static family(column: string): SqlFunction;
	/**
	 * Returns the host part of an inet address as text.
	 *
	 * @param column - The inet column name
	 * @returns SqlFunction representing host(column)
	 *
	 * @example
	 * ```typescript
	 * F.network.host('ip_address')
	 * // SQL: host("ip_address")
	 * // Result: '192.168.1.5' for '192.168.1.5/24'
	 * ```
	 */
	static host(column: string): SqlFunction;
	/**
	 * Returns the host mask for a network address.
	 *
	 * @param column - The inet column name
	 * @returns SqlFunction representing hostmask(column)
	 *
	 * @example
	 * ```typescript
	 * F.network.hostmask('ip_address')
	 * // SQL: hostmask("ip_address")
	 * // Result: '0.0.0.255' for a /24 network
	 * ```
	 */
	static hostmask(column: string): SqlFunction;
	/**
	 * Returns the smallest network that contains both addresses.
	 *
	 * @param column1 - First inet column
	 * @param column2 - Second inet column or value
	 * @returns SqlFunction representing inet_merge(column1, column2)
	 *
	 * @example
	 * ```typescript
	 * F.network.inetMerge('ip1', 'ip2')
	 * // SQL: inet_merge("ip1", "ip2")
	 * ```
	 */
	static inetMerge(column1: string, column2: string): SqlFunction;
	/**
	 * Returns the smallest network that contains the column and a literal value.
	 *
	 * @param column - The inet column
	 * @param value - The inet value to merge with
	 * @returns SqlFunction representing inet_merge(column, value)
	 *
	 * @example
	 * ```typescript
	 * F.network.inetMergeValue('ip_address', '192.168.2.0/24')
	 * // SQL: inet_merge("ip_address", inet '192.168.2.0/24')
	 * ```
	 */
	static inetMergeValue(column: string, value: string): SqlFunction;
	/**
	 * Tests if two addresses are in the same IP family.
	 *
	 * @param column1 - First inet column
	 * @param column2 - Second inet column
	 * @returns SqlFunction representing inet_same_family(column1, column2)
	 *
	 * @example
	 * ```typescript
	 * F.network.inetSameFamily('ip1', 'ip2')
	 * // SQL: inet_same_family("ip1", "ip2")
	 * ```
	 */
	static inetSameFamily(column1: string, column2: string): SqlFunction;
	/**
	 * Returns the netmask length.
	 *
	 * @param column - The inet/cidr column name
	 * @returns SqlFunction representing masklen(column)
	 *
	 * @example
	 * ```typescript
	 * F.network.masklen('ip_address')
	 * // SQL: masklen("ip_address")
	 * // Result: 24 for '/24' network
	 * ```
	 */
	static masklen(column: string): SqlFunction;
	/**
	 * Returns the netmask for a network address.
	 *
	 * @param column - The inet column name
	 * @returns SqlFunction representing netmask(column)
	 *
	 * @example
	 * ```typescript
	 * F.network.netmask('ip_address')
	 * // SQL: netmask("ip_address")
	 * // Result: '255.255.255.0' for a /24 network
	 * ```
	 */
	static netmask(column: string): SqlFunction;
	/**
	 * Returns the network part of an address.
	 *
	 * @param column - The inet column name
	 * @returns SqlFunction representing network(column)
	 *
	 * @example
	 * ```typescript
	 * F.network.network('ip_address')
	 * // SQL: network("ip_address")
	 * // Result: '192.168.1.0/24' for '192.168.1.5/24'
	 * ```
	 */
	static network(column: string): SqlFunction;
	/**
	 * Sets the netmask length for an inet address.
	 *
	 * @param column - The inet column name
	 * @param length - The new netmask length
	 * @returns SqlFunction representing set_masklen(column, length)
	 *
	 * @example
	 * ```typescript
	 * F.network.setMasklen('ip_address', 16)
	 * // SQL: set_masklen("ip_address", 16)
	 * ```
	 */
	static setMasklen(column: string, length: number): SqlFunction;
	/**
	 * Sets the netmask length for a cidr address.
	 *
	 * @param column - The cidr column name
	 * @param length - The new netmask length
	 * @returns SqlFunction representing set_masklen(column, length)
	 *
	 * @example
	 * ```typescript
	 * F.network.setCidrMasklen('network_cidr', 8)
	 * // SQL: set_masklen("network_cidr", 8)
	 * ```
	 */
	static setCidrMasklen(column: string, length: number): SqlFunction;
	/**
	 * Returns the text representation of an inet or cidr.
	 *
	 * @param column - The inet/cidr column name
	 * @returns SqlFunction representing text(column)
	 *
	 * @example
	 * ```typescript
	 * F.network.text('ip_address')
	 * // SQL: text("ip_address")
	 * ```
	 */
	static text(column: string): SqlFunction;
	/**
	 * Sets the last 3 bytes of a macaddr to zero (OUI extraction).
	 *
	 * @param column - The macaddr column name
	 * @returns SqlFunction representing trunc(column)
	 *
	 * @example
	 * ```typescript
	 * F.network.trunc('mac_address')
	 * // SQL: trunc("mac_address")
	 * // Result: '08:00:2b:00:00:00' for '08:00:2b:01:02:03'
	 * ```
	 */
	static trunc(column: string): SqlFunction;
	/**
	 * Converts macaddr to macaddr8 (EUI-64 format).
	 *
	 * @param column - The macaddr column name
	 * @returns SqlFunction representing macaddr8(column)
	 *
	 * @example
	 * ```typescript
	 * F.network.macaddr8('mac_address')
	 * // SQL: macaddr8("mac_address")
	 * ```
	 */
	static macaddr8(column: string): SqlFunction;
	/**
	 * Performs bitwise NOT on an inet address.
	 *
	 * @param column - The inet column name
	 * @returns SqlFunction representing ~column
	 *
	 * @example
	 * ```typescript
	 * F.network.bitwiseNot('ip_address')
	 * // SQL: ~ "ip_address"
	 * ```
	 */
	static bitwiseNot(column: string): SqlFunction;
	/**
	 * Performs bitwise AND between two inet addresses.
	 *
	 * @param column - The inet column name
	 * @param value - The inet value to AND with
	 * @returns SqlFunction representing column & value
	 *
	 * @example
	 * ```typescript
	 * F.network.bitwiseAnd('ip_address', '255.255.255.0')
	 * // SQL: "ip_address" & inet '255.255.255.0'
	 * ```
	 */
	static bitwiseAnd(column: string, value: string): SqlFunction;
	/**
	 * Performs bitwise OR between two inet addresses.
	 *
	 * @param column - The inet column name
	 * @param value - The inet value to OR with
	 * @returns SqlFunction representing column | value
	 *
	 * @example
	 * ```typescript
	 * F.network.bitwiseOr('ip_address', '0.0.0.255')
	 * // SQL: "ip_address" | inet '0.0.0.255'
	 * ```
	 */
	static bitwiseOr(column: string, value: string): SqlFunction;
	/**
	 * Adds an integer to an inet address.
	 *
	 * @param column - The inet column name
	 * @param offset - The integer to add
	 * @returns SqlFunction representing column + offset
	 *
	 * @example
	 * ```typescript
	 * F.network.add('ip_address', 10)
	 * // SQL: "ip_address" + 10
	 * ```
	 */
	static add(column: string, offset: number): SqlFunction;
	/**
	 * Subtracts an integer from an inet address.
	 *
	 * @param column - The inet column name
	 * @param offset - The integer to subtract
	 * @returns SqlFunction representing column - offset
	 *
	 * @example
	 * ```typescript
	 * F.network.subtract('ip_address', 10)
	 * // SQL: "ip_address" - 10
	 * ```
	 */
	static subtract(column: string, offset: number): SqlFunction;
	/**
	 * Calculates the difference between two inet addresses.
	 *
	 * @param column1 - First inet column
	 * @param column2 - Second inet column
	 * @returns SqlFunction representing column1 - column2
	 *
	 * @example
	 * ```typescript
	 * F.network.difference('ip_end', 'ip_start')
	 * // SQL: "ip_end" - "ip_start"
	 * ```
	 */
	static difference(column1: string, column2: string): SqlFunction;
	/**
	 * Creates an inet value from a text representation.
	 *
	 * @param value - The IP address string
	 * @returns SqlFunction representing inet 'value'
	 *
	 * @example
	 * ```typescript
	 * F.network.inet('192.168.1.1/24')
	 * // SQL: inet '192.168.1.1/24'
	 * ```
	 */
	static inet(value: string): SqlFunction;
	/**
	 * Creates a cidr value from a text representation.
	 *
	 * @param value - The CIDR network string
	 * @returns SqlFunction representing cidr 'value'
	 *
	 * @example
	 * ```typescript
	 * F.network.cidr('192.168.1.0/24')
	 * // SQL: cidr '192.168.1.0/24'
	 * ```
	 */
	static cidr(value: string): SqlFunction;
	/**
	 * Creates a macaddr value from a text representation.
	 *
	 * @param value - The MAC address string
	 * @returns SqlFunction representing macaddr 'value'
	 *
	 * @example
	 * ```typescript
	 * F.network.macaddr('08:00:2b:01:02:03')
	 * // SQL: macaddr '08:00:2b:01:02:03'
	 * ```
	 */
	static macaddr(value: string): SqlFunction;
}
/**
 * Main Functions namespace (F) providing access to all PostgreSQL functions.
 *
 * This is the primary export for using SQL functions in queries.
 * All function categories are available as static methods on this class.
 */
export declare class F {
	/** Concatenates multiple values */
	static concat: typeof StringFunctions.concat;
	/** Concatenates values with separator */
	static concat_ws: typeof StringFunctions.concat_ws;
	/** Converts to lowercase */
	static lower: typeof StringFunctions.lower;
	/** Converts to uppercase */
	static upper: typeof StringFunctions.upper;
	/** Capitalizes first letter of each word */
	static initcap: typeof StringFunctions.initcap;
	/** Extracts substring */
	static substring: typeof StringFunctions.substring;
	/** Alias for substring */
	static substr: typeof StringFunctions.substr;
	/** String length in characters */
	static strLength: number;
	/** String length in characters */
	static char_length: typeof StringFunctions.char_length;
	/** String length in bytes */
	static octet_length: typeof StringFunctions.octet_length;
	/** String length in bits */
	static bit_length: typeof StringFunctions.bit_length;
	/** Trims whitespace or specified characters */
	static trim: typeof StringFunctions.trim;
	/** Trims leading characters */
	static ltrim: typeof StringFunctions.ltrim;
	/** Trims trailing characters */
	static rtrim: typeof StringFunctions.rtrim;
	/** Trims both ends */
	static btrim: typeof StringFunctions.btrim;
	/** Finds substring position */
	static position: typeof StringFunctions.position;
	/** Finds substring position */
	static strpos: typeof StringFunctions.strpos;
	/** Replaces substring */
	static replace: typeof StringFunctions.replace;
	/** Translates characters */
	static translate: typeof StringFunctions.translate;
	/** Repeats string n times */
	static repeat: typeof StringFunctions.repeat;
	/** Pads string on left */
	static lpad: typeof StringFunctions.lpad;
	/** Pads string on right */
	static rpad: typeof StringFunctions.rpad;
	/** Reverses string */
	static reverse: typeof StringFunctions.reverse;
	/** Splits string and returns part */
	static split_part: typeof StringFunctions.split_part;
	/** Regex match (first) */
	static regexp_match: typeof StringFunctions.regexp_match;
	/** Regex match (all) */
	static regexp_matches: typeof StringFunctions.regexp_matches;
	/** Regex replace */
	static regexp_replace: typeof StringFunctions.regexp_replace;
	/** Regex split to array */
	static regexp_split_to_array: typeof StringFunctions.regexp_split_to_array;
	/** Regex split to rows */
	static regexp_split_to_table: typeof StringFunctions.regexp_split_to_table;
	/** Encode binary to text */
	static encode: typeof StringFunctions.encode;
	/** Decode text to binary */
	static decode: typeof StringFunctions.decode;
	/** MD5 hash */
	static md5: typeof StringFunctions.md5;
	/** ASCII code */
	static ascii: typeof StringFunctions.ascii;
	/** Character from ASCII */
	static chr: typeof StringFunctions.chr;
	/** Number to hex */
	static to_hex: typeof StringFunctions.to_hex;
	/** Left-pad with zeros */
	static lpad_zero: typeof StringFunctions.lpad_zero;
	/** Format string */
	static format: typeof StringFunctions.format;
	/** Quote identifier */
	static quote_ident: typeof StringFunctions.quote_ident;
	/** Quote literal */
	static quote_literal: typeof StringFunctions.quote_literal;
	/** Quote nullable */
	static quote_nullable: typeof StringFunctions.quote_nullable;
	/** Current timestamp with timezone */
	static now: typeof DateTimeFunctions.now;
	/** Current date */
	static current_date: typeof DateTimeFunctions.current_date;
	/** Current time */
	static current_time: typeof DateTimeFunctions.current_time;
	/** Current timestamp */
	static current_timestamp: typeof DateTimeFunctions.current_timestamp;
	/** Transaction timestamp */
	static transaction_timestamp: typeof DateTimeFunctions.transaction_timestamp;
	/** Statement timestamp */
	static statement_timestamp: typeof DateTimeFunctions.statement_timestamp;
	/** Clock timestamp */
	static clock_timestamp: typeof DateTimeFunctions.clock_timestamp;
	/** Local timestamp */
	static localtimestamp: typeof DateTimeFunctions.localtimestamp;
	/** Truncate timestamp */
	static date_trunc: typeof DateTimeFunctions.date_trunc;
	/** Extract date/time component */
	static extract: typeof DateTimeFunctions.extract;
	/** Extract date part */
	static date_part: typeof DateTimeFunctions.date_part;
	/** Calculate age/duration */
	static age: typeof DateTimeFunctions.age;
	/** Make date from components */
	static make_date: typeof DateTimeFunctions.make_date;
	/** Make time from components */
	static make_time: typeof DateTimeFunctions.make_time;
	/** Make timestamp from components */
	static make_timestamp: typeof DateTimeFunctions.make_timestamp;
	/** Make interval from components */
	static make_interval: typeof DateTimeFunctions.make_interval;
	/** Unix timestamp to timestamp */
	static to_timestamp: typeof DateTimeFunctions.to_timestamp;
	/** String to timestamp with format */
	static to_timestamp_format: typeof DateTimeFunctions.to_timestamp_format;
	/** String to date with format */
	static to_date: typeof DateTimeFunctions.to_date;
	/** Format timestamp as string */
	static to_char: typeof DateTimeFunctions.to_char;
	/** Convert timezone */
	static timezone: typeof DateTimeFunctions.timezone;
	/** Justify days in interval */
	static justify_days: typeof DateTimeFunctions.justify_days;
	/** Justify hours in interval */
	static justify_hours: typeof DateTimeFunctions.justify_hours;
	/** Justify interval */
	static justify_interval: typeof DateTimeFunctions.justify_interval;
	/** Check if date is finite */
	static isfinite: typeof DateTimeFunctions.isfinite;
	/** Absolute value */
	static abs: typeof MathFunctions.abs;
	/** Sign (-1, 0, 1) */
	static sign: typeof MathFunctions.sign;
	/** Ceiling */
	static ceil: typeof MathFunctions.ceil;
	/** Ceiling */
	static ceiling: typeof MathFunctions.ceiling;
	/** Floor */
	static floor: typeof MathFunctions.floor;
	/** Round */
	static round: typeof MathFunctions.round;
	/** Truncate */
	static trunc: typeof MathFunctions.trunc;
	/** Modulo */
	static mod: typeof MathFunctions.mod;
	/** Integer division */
	static div: typeof MathFunctions.div;
	/** Power */
	static power: typeof MathFunctions.power;
	/** Square root */
	static sqrt: typeof MathFunctions.sqrt;
	/** Cube root */
	static cbrt: typeof MathFunctions.cbrt;
	/** Exponential */
	static exp: typeof MathFunctions.exp;
	/** Natural logarithm */
	static ln: typeof MathFunctions.ln;
	/** Base-10 logarithm */
	static log10: typeof MathFunctions.log10;
	/** Logarithm with base */
	static log: typeof MathFunctions.log;
	/** Pi constant */
	static pi: typeof MathFunctions.pi;
	/** Radians to degrees */
	static degrees: typeof MathFunctions.degrees;
	/** Degrees to radians */
	static radians: typeof MathFunctions.radians;
	/** Sine */
	static sin: typeof MathFunctions.sin;
	/** Cosine */
	static cos: typeof MathFunctions.cos;
	/** Tangent */
	static tan: typeof MathFunctions.tan;
	/** Arcsine */
	static asin: typeof MathFunctions.asin;
	/** Arccosine */
	static acos: typeof MathFunctions.acos;
	/** Arctangent */
	static atan: typeof MathFunctions.atan;
	/** Arctangent of y/x */
	static atan2: typeof MathFunctions.atan2;
	/** Random number */
	static random: typeof MathFunctions.random;
	/** Set random seed */
	static setseed: typeof MathFunctions.setseed;
	/** Greatest common divisor */
	static gcd: typeof MathFunctions.gcd;
	/** Least common multiple */
	static lcm: typeof MathFunctions.lcm;
	/** Factorial */
	static factorial: typeof MathFunctions.factorial;
	/** Greatest value */
	static greatest: typeof MathFunctions.greatest;
	/** Least value */
	static least: typeof MathFunctions.least;
	/** Histogram bucket */
	static width_bucket: typeof MathFunctions.width_bucket;
	/** Array length */
	static array_length: typeof ArrayFunctions.array_length;
	/** Append to array */
	static array_append: typeof ArrayFunctions.array_append;
	/** Prepend to array */
	static array_prepend: typeof ArrayFunctions.array_prepend;
	/** Concatenate arrays */
	static array_cat: typeof ArrayFunctions.array_cat;
	/** Remove from array */
	static array_remove: typeof ArrayFunctions.array_remove;
	/** Replace in array */
	static array_replace: typeof ArrayFunctions.array_replace;
	/** Find position in array */
	static array_position: typeof ArrayFunctions.array_position;
	/** Find all positions in array */
	static array_positions: typeof ArrayFunctions.array_positions;
	/** Array dimensions */
	static array_dims: typeof ArrayFunctions.array_dims;
	/** Array lower bound */
	static array_lower: typeof ArrayFunctions.array_lower;
	/** Array upper bound */
	static array_upper: typeof ArrayFunctions.array_upper;
	/** Array cardinality */
	static cardinality: typeof ArrayFunctions.cardinality;
	/** Array to string */
	static array_to_string: typeof ArrayFunctions.array_to_string;
	/** String to array */
	static string_to_array: typeof ArrayFunctions.string_to_array;
	/** Unnest array to rows */
	static unnest: typeof ArrayFunctions.unnest;
	/** Fill array with value */
	static array_fill: typeof ArrayFunctions.array_fill;
	/** Aggregate to array */
	static array_agg: typeof ArrayFunctions.array_agg;
	/** Aggregate to array with order */
	static array_agg_order: typeof ArrayFunctions.array_agg_order;
	/** JSONB array length */
	static jsonb_array_length: typeof JsonbFunctions.jsonb_array_length;
	/** JSONB each (key-value pairs) */
	static jsonb_each: typeof JsonbFunctions.jsonb_each;
	/** JSONB each as text */
	static jsonb_each_text: typeof JsonbFunctions.jsonb_each_text;
	/** JSONB object keys */
	static jsonb_object_keys: typeof JsonbFunctions.jsonb_object_keys;
	/** JSONB array elements */
	static jsonb_array_elements: typeof JsonbFunctions.jsonb_array_elements;
	/** JSONB array elements as text */
	static jsonb_array_elements_text: typeof JsonbFunctions.jsonb_array_elements_text;
	/** JSONB typeof */
	static jsonb_typeof: typeof JsonbFunctions.jsonb_typeof;
	/** JSONB strip nulls */
	static jsonb_strip_nulls: typeof JsonbFunctions.jsonb_strip_nulls;
	/** JSONB pretty print */
	static jsonb_pretty: typeof JsonbFunctions.jsonb_pretty;
	/** JSONB set value */
	static jsonb_set: typeof JsonbFunctions.jsonb_set;
	/** JSONB insert value */
	static jsonb_insert: typeof JsonbFunctions.jsonb_insert;
	/** Build JSONB object */
	static jsonb_build_object: typeof JsonbFunctions.jsonb_build_object;
	/** Build JSONB array */
	static jsonb_build_array: typeof JsonbFunctions.jsonb_build_array;
	/** JSONB to text */
	static jsonb_to_text: typeof JsonbFunctions.jsonb_to_text;
	/** Text to JSONB */
	static text_to_jsonb: typeof JsonbFunctions.text_to_jsonb;
	/** Aggregate to JSONB array */
	static jsonb_agg: typeof JsonbFunctions.jsonb_agg;
	/** Aggregate to JSONB object */
	static jsonb_object_agg: typeof JsonbFunctions.jsonb_object_agg;
	/** Count rows */
	static count: typeof AggregateFunctions$1.count;
	/** Count distinct */
	static count_distinct: typeof AggregateFunctions$1.count_distinct;
	/** Sum values */
	static sum: typeof AggregateFunctions$1.sum;
	/** Average values */
	static avg: typeof AggregateFunctions$1.avg;
	/** Minimum value */
	static min: typeof AggregateFunctions$1.min;
	/** Maximum value */
	static max: typeof AggregateFunctions$1.max;
	/** String aggregate */
	static string_agg: typeof AggregateFunctions$1.string_agg;
	/** String aggregate with order */
	static string_agg_order: typeof AggregateFunctions$1.string_agg_order;
	/** Boolean AND aggregate */
	static bool_and: typeof AggregateFunctions$1.bool_and;
	/** Boolean OR aggregate */
	static bool_or: typeof AggregateFunctions$1.bool_or;
	/** Every (alias for bool_and) */
	static every: typeof AggregateFunctions$1.every;
	/** Bitwise AND aggregate */
	static bit_and: typeof AggregateFunctions$1.bit_and;
	/** Bitwise OR aggregate */
	static bit_or: typeof AggregateFunctions$1.bit_or;
	/** Population standard deviation */
	static stddev_pop: typeof AggregateFunctions$1.stddev_pop;
	/** Sample standard deviation */
	static stddev_samp: typeof AggregateFunctions$1.stddev_samp;
	/** Standard deviation */
	static stddev: typeof AggregateFunctions$1.stddev;
	/** Population variance */
	static var_pop: typeof AggregateFunctions$1.var_pop;
	/** Sample variance */
	static var_samp: typeof AggregateFunctions$1.var_samp;
	/** Variance */
	static variance: typeof AggregateFunctions$1.variance;
	/** Correlation */
	static corr: typeof AggregateFunctions$1.corr;
	/** Population covariance */
	static covar_pop: typeof AggregateFunctions$1.covar_pop;
	/** Sample covariance */
	static covar_samp: typeof AggregateFunctions$1.covar_samp;
	/** Continuous percentile */
	static percentile_cont: typeof AggregateFunctions$1.percentile_cont;
	/** Discrete percentile */
	static percentile_disc: typeof AggregateFunctions$1.percentile_disc;
	/** Mode (most frequent value) */
	static mode: typeof AggregateFunctions$1.mode;
	/** Coalesce (first non-null) */
	static coalesce: typeof ConditionalFunctions.coalesce;
	/** Null if equal */
	static nullif: typeof ConditionalFunctions.nullif;
	/** Geometric functions namespace */
	static geometric: typeof GeometricFunctions;
	/** Network functions namespace for inet, cidr, macaddr, macaddr8 */
	static network: typeof NetworkFunctions;
}
/**
 * CASE Expression Builder
 * Provides fluent API for building SQL CASE WHEN expressions.
 *
 * @module functions/case-builder
 */
/**
 * Builder for SQL CASE WHEN expressions.
 * Supports both simple and searched CASE formats.
 *
 * @example
 * ```typescript
 * // Searched CASE (with conditions)
 * relq('users').select([
 *   'id',
 *   Case()
 *     .when('age < 18', 'minor')
 *     .when('age < 65', 'adult')
 *     .else('senior')
 *     .as('age_group')
 * ])
 * // SQL: CASE WHEN age < 18 THEN 'minor' WHEN age < 65 THEN 'adult' ELSE 'senior' END AS "age_group"
 *
 * // Simple CASE (with expression)
 * Case('status')
 *   .when('active', 1)
 *   .when('pending', 0)
 *   .else(-1)
 *   .as('status_code')
 * // SQL: CASE "status" WHEN 'active' THEN 1 WHEN 'pending' THEN 0 ELSE -1 END AS "status_code"
 *
 * // Nested conditions
 * Case()
 *   .when('balance > 1000 AND status = \'premium\'', '🌟 VIP')
 *   .when('balance > 500', '⭐ Premium')
 *   .when('balance > 0', '✅ Active')
 *   .else('❌ Inactive')
 *   .as('account_status')
 * ```
 */
export declare class CaseBuilder {
	private expression?;
	private whenClauses;
	private elseResult?;
	/**
	 * Creates a new CASE expression builder.
	 *
	 * @param expression - Optional column/expression for simple CASE format
	 *
	 * @example
	 * ```typescript
	 * // Searched CASE
	 * new CaseBuilder()
	 *
	 * // Simple CASE
	 * new CaseBuilder('status')
	 * ```
	 */
	constructor(expression?: string);
	/**
	 * Adds a WHEN clause to the CASE expression.
	 *
	 * @param condition - For searched CASE: boolean condition (e.g., 'age > 18')
	 *                    For simple CASE: value to match against expression
	 * @param result - Result value when condition is true
	 * @returns The CaseBuilder instance for method chaining
	 *
	 * @example
	 * ```typescript
	 * // Searched CASE
	 * .when('age >= 18', 'adult')
	 * .when('age >= 13', 'teen')
	 * .when('age >= 0', 'child')
	 *
	 * // Simple CASE
	 * .when('active', 1)
	 * .when('pending', 0)
	 * .when('inactive', -1)
	 * ```
	 */
	when(condition: string | number | boolean, result: any): CaseBuilder;
	/**
	 * Sets the ELSE clause (default result when no WHEN conditions match).
	 *
	 * @param result - Default result value
	 * @returns The CaseBuilder instance for method chaining
	 *
	 * @example
	 * ```typescript
	 * .else('unknown')
	 * .else(null)
	 * .else(0)
	 * ```
	 */
	else(result: any): CaseBuilder;
	/**
	 * Builds the complete CASE expression as SQL string.
	 *
	 * @returns SQL CASE expression
	 */
	build(): string;
	/**
	 * Adds an alias to the CASE expression using AS.
	 *
	 * @param alias - Column alias name
	 * @returns SQL with alias
	 *
	 * @example
	 * ```typescript
	 * Case().when('age >= 18', 'adult').else('minor').as('age_group')
	 * // Result: CASE WHEN age >= 18 THEN 'adult' ELSE 'minor' END AS "age_group"
	 * ```
	 */
	as(alias: string): string;
	/**
	 * Returns the SQL string representation.
	 */
	toString(): string;
	/**
	 * Formats a value for SQL output.
	 * Handles columns, literals, and special values.
	 * @private
	 */
	private formatValue;
}
/**
 * Factory function to create a new CASE expression builder.
 * Provides cleaner syntax than using 'new CaseBuilder()'.
 *
 * @param expression - Optional column/expression for simple CASE format
 * @returns A new CaseBuilder instance
 *
 * @example
 * ```typescript
 * import { Case } from 'relq/pg-builder';
 *
 * // Searched CASE
 * Case()
 *   .when('status = \'active\'', 'Active')
 *   .when('status = \'pending\'', 'Pending')
 *   .else('Inactive')
 *
 * // Simple CASE
 * Case('priority')
 *   .when('high', 1)
 *   .when('medium', 2)
 *   .when('low', 3)
 *   .else(99)
 * ```
 */
export declare function Case(expression?: string): CaseBuilder;
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

export {
	AggregateFunctions$1 as AggregateFunctions,
	InferColumnType$2 as InferColumnType,
	Relq as RelqClient,
	relq as default,
};

export {};
