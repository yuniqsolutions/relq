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
 */
export type ElementType<T> = T extends (infer E)[] ? CleanType$2<E> : CleanType$2<T>;
type ValidKeys$1<T> = keyof ElementType<T> & string extends never ? string : keyof ElementType<T> & string;
type JsonbPrimitive$1<T> = T extends string ? string : T extends number ? number : T extends boolean ? boolean : string | number | boolean;
declare class JsonbUpdateBuilder<T = unknown> {
	private currentColumn;
	constructor(currentColumn?: string);
	/**
	 * Replace entire JSONB array with new values
	 *
	 * @param values - Array of values to set (typed as T)
	 * @returns SQL expression
	 *
	 * @example
	 * ```typescript
	 * tags: (ops) => ops.jsonb.set([{ id: '1', name: 'Tag1', color: '#fff' }])
	 * // SQL: tags = '[{"id":"1","name":"Tag1","color":"#fff"}]'::jsonb
	 * ```
	 */
	set(values: T extends any[] ? T : T[]): string;
	/**
	 * Append a single item to end of JSONB array using || operator
	 *
	 * @param value - Item to append (typed as element of T)
	 * @returns SQL expression
	 *
	 * @example
	 * ```typescript
	 * tags: (ops) => ops.jsonb.append({ id: '1', name: 'New Tag', color: '#fff' })
	 * // SQL: tags = tags || '[{"id":"1","name":"New Tag","color":"#fff"}]'::jsonb
	 * ```
	 */
	append(value: ElementType<T>): string;
	/**
	 * Prepend a single item to beginning of JSONB array
	 *
	 * @param value - Item to prepend (typed as element of T)
	 * @returns SQL expression
	 *
	 * @example
	 * ```typescript
	 * tags: (ops) => ops.jsonb.prepend({ id: '1', name: 'First Tag', color: '#fff' })
	 * // SQL: tags = '[{"id":"1","name":"First Tag","color":"#fff"}]'::jsonb || tags
	 * ```
	 */
	prepend(value: ElementType<T>): string;
	/**
	 * Concatenate multiple items to end of JSONB array
	 *
	 * @param values - Array of items to add (typed as elements of T)
	 * @returns SQL expression
	 *
	 * @example
	 * ```typescript
	 * tags: (ops) => ops.jsonb.concat([
	 *   { id: '1', name: 'Tag1', color: '#fff' },
	 *   { id: '2', name: 'Tag2', color: '#000' }
	 * ])
	 * // SQL: tags = tags || '[...]'::jsonb
	 * ```
	 */
	concat(values: ElementType<T>[]): string;
	/**
	 * Remove item at specific index from JSONB array using - operator
	 *
	 * @param index - Zero-based index to remove (negative indices work from end: -1 = last)
	 * @returns SQL expression
	 *
	 * @example
	 * ```typescript
	 * tags: (ops) => ops.jsonb.removeAt(0)   // Remove first
	 * tags: (ops) => ops.jsonb.removeAt(-1)  // Remove last
	 * // SQL: tags = tags - 0
	 * ```
	 */
	removeAt(index: number): string;
	/**
	 * Remove items from JSONB array where a field matches a value.
	 * Uses subquery with jsonb_array_elements to filter.
	 *
	 * @param key - The object key to match against (autocompleted from element type)
	 * @param value - The value to match for removal (type-checked)
	 * @returns SQL expression
	 *
	 * @example
	 * ```typescript
	 * // Remove tag with id = 'abc123'
	 * tags: (ops) => ops.jsonb.removeWhere('id', 'abc123')
	 * // SQL: tags = COALESCE((SELECT jsonb_agg(elem) FROM jsonb_array_elements(tags) elem WHERE elem->>'id' != 'abc123'), '[]'::jsonb)
	 * ```
	 */
	removeWhere<K extends ValidKeys$1<T>>(key: K, value: K extends keyof ElementType<T> ? JsonbPrimitive$1<ElementType<T>[K]> : string | number | boolean): string;
	/**
	 * Remove items from JSONB array where multiple fields match.
	 * All conditions must match for an item to be removed (AND logic).
	 *
	 * @param conditions - Object with key-value pairs to match (keys autocompleted from element type)
	 * @returns SQL expression
	 *
	 * @example
	 * ```typescript
	 * // Remove tag where id='abc' AND name='Test'
	 * tags: (ops) => ops.jsonb.removeWhereAll({ id: 'abc123', name: 'Test' })
	 * // SQL: tags = COALESCE((SELECT jsonb_agg(elem) FROM jsonb_array_elements(tags) elem
	 * //            WHERE NOT (elem->>'id' = 'abc123' AND elem->>'name' = 'Test')), '[]'::jsonb)
	 * ```
	 */
	removeWhereAll(conditions: Partial<{
		[K in ValidKeys$1<T>]: K extends keyof ElementType<T> ? JsonbPrimitive$1<ElementType<T>[K]> : string | number | boolean;
	}>): string;
	/**
	 * Keep only items from JSONB array where a field matches a value.
	 * Opposite of removeWhere - filters to keep matching items.
	 *
	 * @param key - The object key to match against (autocompleted from element type)
	 * @param value - The value to match for keeping (type-checked)
	 * @returns SQL expression
	 *
	 * @example
	 * ```typescript
	 * // Keep only tags with color = '#ff0000'
	 * tags: (ops) => ops.jsonb.filterWhere('color', '#ff0000')
	 * // SQL: tags = COALESCE((SELECT jsonb_agg(elem) FROM jsonb_array_elements(tags) elem WHERE elem->>'color' = '#ff0000'), '[]'::jsonb)
	 * ```
	 */
	filterWhere<K extends ValidKeys$1<T>>(key: K, value: K extends keyof ElementType<T> ? JsonbPrimitive$1<ElementType<T>[K]> : string | number | boolean): string;
	/**
	 * Update a specific item in the JSONB array by index.
	 * Replaces the entire item at that index.
	 *
	 * @param index - Zero-based index to update
	 * @param newValue - New value for the item (typed as element of T)
	 * @returns SQL expression
	 *
	 * @example
	 * ```typescript
	 * // Update first tag
	 * tags: (ops) => ops.jsonb.updateAt(0, { id: '1', name: 'Updated', color: '#000' })
	 * // SQL: tags = jsonb_set(tags, '{0}', '{"id":"1","name":"Updated","color":"#000"}'::jsonb)
	 * ```
	 */
	updateAt(index: number, newValue: ElementType<T>): string;
	/**
	 * Update fields within items matching a condition.
	 * Updates the specified fields for all matching items.
	 *
	 * @param matchKey - Key to match items by (autocompleted from element type)
	 * @param matchValue - Value to match (type-checked)
	 * @param updates - Object with fields to update (keys/values type-checked against element type)
	 * @returns SQL expression
	 *
	 * @example
	 * ```typescript
	 * // Update color of tag with id='abc' to '#fff'
	 * tags: (ops) => ops.jsonb.updateWhere('id', 'abc123', { color: '#ffffff' })
	 * // SQL: COALESCE((SELECT jsonb_agg(CASE WHEN elem->>'id' = 'abc123'
	 * //        THEN jsonb_set(elem, '{color}', '"#ffffff"'::jsonb)
	 * //        ELSE elem END) FROM jsonb_array_elements(tags) elem), '[]'::jsonb)
	 *
	 * // Update multiple fields
	 * tags: (ops) => ops.jsonb.updateWhere('id', 'abc123', { color: '#fff', name: 'Updated' })
	 * ```
	 */
	updateWhere<MK extends ValidKeys$1<T>>(matchKey: MK, matchValue: MK extends keyof ElementType<T> ? JsonbPrimitive$1<ElementType<T>[MK]> : string | number | boolean, updates: Partial<ElementType<T>>): string;
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
export declare class UpdateBuilder {
	tableName: string;
	updateData: Record<string, UpdateValue>;
	private whereConditions;
	private returningClause?;
	private _case;
	private _convertCase;
	private columnResolver?;
	constructor(tableName: string, data: Record<string, UpdateValue>);
	/**
	 * Set a column resolver function to transform property names to SQL column names.
	 * @internal Used by ConnectedUpdateBuilder for schema-aware column name mapping.
	 */
	setColumnResolver(resolver: (column: string) => string): UpdateBuilder;
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
	 * Format array value with automatic type detection
	 * Uses array.every() to verify homogeneous arrays
	 */
	private formatArrayValue;
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
 */
export type ExtractColumnNames<TTable> = TTable extends TableDefinition<infer TCols> ? keyof TCols & string : TTable extends {
	$inferSelect: infer TSelect;
} ? keyof TSelect & string : TTable extends {
	$columns: infer TCols;
} ? keyof TCols & string : keyof TTable & string;
/**
 * Extract the value type for a column from a table.
 */
export type ExtractColumnType<TTable, K extends string> = TTable extends TableDefinition<infer TCols> ? K extends keyof TCols ? InferColumnType<TCols[K]> : any : TTable extends {
	$inferSelect: infer TSelect;
} ? K extends keyof TSelect ? TSelect[K] : any : TTable extends {
	$columns: infer TCols;
} ? K extends keyof TCols ? InferColumnType<TCols[K]> : any : K extends keyof TTable ? TTable[K] : any;
/**
 * TableProxy maps each column of a table to a ColumnRef.
 * Used in join callbacks for type-safe column references.
 *
 * Provides full IDE autocomplete for column names and type safety.
 */
export type TableProxy<TTable> = {
	readonly [K in ExtractColumnNames<TTable>]: ColumnRef<TTable, K, ExtractColumnType<TTable, K>>;
};
type InferColumnType$1<T> = T extends ColumnConfig<infer U> ? U : T;
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
	[K in keyof TTables]: TTables[K] extends TableDefinition<infer Cols> ? InferTableType<Cols> : never;
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
 */
export type UnwrapTableType<TTable> = TTable extends TableDefinition<infer TCols> ? {
	[K in keyof TCols]: InferColumnType$1<TCols[K]>;
} : TTable extends {
	$inferSelect: infer TSelect;
} ? TSelect : TTable;
/**
 * Extract column names from a table
 * If table is 'any', allows any string (backward compatible)
 * If table is TableDefinition, extracts actual column names (not $name, $schema, etc.)
 */
export type ColumnName<TTable> = TTable extends any ? TTable extends TableDefinition<infer TCols> ? keyof TCols & string : TTable extends {
	$inferSelect: infer TSelect;
} ? keyof TSelect & string : string extends keyof TTable ? string : keyof TTable & string : never;
/**
 * Column selection input with optional alias
 * Can be: 'column' | ['column', 'alias']
 */
export type ColumnSelection<TTable> = ColumnName<TTable> | readonly [
	ColumnName<TTable>,
	string
];
/**
 * Array of column selections (readonly for better inference)
 */
export type ColumnSelections<TTable> = readonly ColumnSelection<TTable>[];
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
export type InsertData<TTable> = TTable extends TableDefinition<any> ? TTable extends {
	$inferInsert: infer TInsert;
} ? TInsert : Partial<UnwrapTableType<TTable>> : TTable extends any ? string extends keyof TTable ? Record<string, any> : Partial<TTable> : never;
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
 */
export type IsArrayOrJsonb<T> = T extends any[] ? true : T extends Date ? false : T extends object ? true : false;
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
 */
export type UpdateData<TTable> = TTable extends TableDefinition<any> ? AtLeastOne<WithUpdateCallbacks<UnwrapTableType<TTable>>> : TTable extends any ? string extends keyof TTable ? Record<string, any> : AtLeastOne<WithUpdateCallbacks<TTable>> : never;
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
	 * COALESCE - return first non-null value
	 */
	coalesce(...values: (ColumnRef$1 | any)[]): SqlExpression;
	/**
	 * Raw SQL expression (escape hatch)
	 */
	raw(sql: string): SqlExpression;
	/**
	 * GREATEST - return largest value
	 */
	greatest(...values: (ColumnRef$1 | number | bigint)[]): SqlExpression;
	/**
	 * LEAST - return smallest value
	 */
	least(...values: (ColumnRef$1 | number | bigint)[]): SqlExpression;
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
	constructor(tableName: string, data: Record<string, QueryValue>);
	/**
	 * Set a column resolver function to transform property names to SQL column names.
	 * @internal Used by ConnectedInsertBuilder for schema-aware column name mapping.
	 */
	setColumnResolver(resolver: (column: string) => string): InsertBuilder;
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
	 * Handle ON CONFLICT with callback-based builder
	 * @param columns - Column(s) for conflict detection
	 * @param callback - Callback that receives ConflictBuilder
	 */
	onConflict(columns: string | string[], callback?: (builder: ConflictBuilder) => void): InsertBuilder;
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
	private formatArrayValue;
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
	onConflict(columns: ColumnName<TTable> | ColumnName<TTable>[], callback: (builder: ConflictBuilder<TTable extends {
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
declare class Buffer$1 extends Uint8Array {
	length: number;
	write(string: string, offset?: number, length?: number, encoding?: string): number;
	toString(encoding?: string, start?: number, end?: number): string;
	toJSON(): {
		type: "Buffer";
		data: any[];
	};
	equals(otherBuffer: Buffer$1): boolean;
	compare(otherBuffer: Uint8Array, targetStart?: number, targetEnd?: number, sourceStart?: number, sourceEnd?: number): number;
	copy(targetBuffer: Buffer$1, targetStart?: number, sourceStart?: number, sourceEnd?: number): number;
	slice(start?: number, end?: number): Buffer$1;
	writeUIntLE(value: number, offset: number, byteLength: number, noAssert?: boolean): number;
	writeUIntBE(value: number, offset: number, byteLength: number, noAssert?: boolean): number;
	writeIntLE(value: number, offset: number, byteLength: number, noAssert?: boolean): number;
	writeIntBE(value: number, offset: number, byteLength: number, noAssert?: boolean): number;
	readUIntLE(offset: number, byteLength: number, noAssert?: boolean): number;
	readUIntBE(offset: number, byteLength: number, noAssert?: boolean): number;
	readIntLE(offset: number, byteLength: number, noAssert?: boolean): number;
	readIntBE(offset: number, byteLength: number, noAssert?: boolean): number;
	readUInt8(offset: number, noAssert?: boolean): number;
	readUInt16LE(offset: number, noAssert?: boolean): number;
	readUInt16BE(offset: number, noAssert?: boolean): number;
	readUInt32LE(offset: number, noAssert?: boolean): number;
	readUInt32BE(offset: number, noAssert?: boolean): number;
	readBigUInt64LE(offset: number): BigInt;
	readBigUInt64BE(offset: number): BigInt;
	readInt8(offset: number, noAssert?: boolean): number;
	readInt16LE(offset: number, noAssert?: boolean): number;
	readInt16BE(offset: number, noAssert?: boolean): number;
	readInt32LE(offset: number, noAssert?: boolean): number;
	readInt32BE(offset: number, noAssert?: boolean): number;
	readBigInt64LE(offset: number): BigInt;
	readBigInt64BE(offset: number): BigInt;
	readFloatLE(offset: number, noAssert?: boolean): number;
	readFloatBE(offset: number, noAssert?: boolean): number;
	readDoubleLE(offset: number, noAssert?: boolean): number;
	readDoubleBE(offset: number, noAssert?: boolean): number;
	reverse(): this;
	swap16(): Buffer$1;
	swap32(): Buffer$1;
	swap64(): Buffer$1;
	writeUInt8(value: number, offset: number, noAssert?: boolean): number;
	writeUInt16LE(value: number, offset: number, noAssert?: boolean): number;
	writeUInt16BE(value: number, offset: number, noAssert?: boolean): number;
	writeUInt32LE(value: number, offset: number, noAssert?: boolean): number;
	writeUInt32BE(value: number, offset: number, noAssert?: boolean): number;
	writeBigUInt64LE(value: number, offset: number): BigInt;
	writeBigUInt64BE(value: number, offset: number): BigInt;
	writeInt8(value: number, offset: number, noAssert?: boolean): number;
	writeInt16LE(value: number, offset: number, noAssert?: boolean): number;
	writeInt16BE(value: number, offset: number, noAssert?: boolean): number;
	writeInt32LE(value: number, offset: number, noAssert?: boolean): number;
	writeInt32BE(value: number, offset: number, noAssert?: boolean): number;
	writeBigInt64LE(value: number, offset: number): BigInt;
	writeBigInt64BE(value: number, offset: number): BigInt;
	writeFloatLE(value: number, offset: number, noAssert?: boolean): number;
	writeFloatBE(value: number, offset: number, noAssert?: boolean): number;
	writeDoubleLE(value: number, offset: number, noAssert?: boolean): number;
	writeDoubleBE(value: number, offset: number, noAssert?: boolean): number;
	fill(value: any, offset?: number, end?: number): this;
	indexOf(value: string | number | Buffer$1, byteOffset?: number, encoding?: string): number;
	lastIndexOf(value: string | number | Buffer$1, byteOffset?: number, encoding?: string): number;
	includes(value: string | number | Buffer$1, byteOffset?: number, encoding?: string): boolean;
	/**
	 * Allocates a new buffer containing the given {str}.
	 *
	 * @param str String to store in buffer.
	 * @param encoding encoding to use, optional.  Default is 'utf8'
	 */
	constructor(str: string, encoding?: string);
	/**
	 * Allocates a new buffer of {size} octets.
	 *
	 * @param size count of octets to allocate.
	 */
	constructor(size: number);
	/**
	 * Allocates a new buffer containing the given {array} of octets.
	 *
	 * @param array The octets to store.
	 */
	constructor(array: Uint8Array);
	/**
	 * Produces a Buffer backed by the same allocated memory as
	 * the given {ArrayBuffer}.
	 *
	 *
	 * @param arrayBuffer The ArrayBuffer with which to share memory.
	 */
	constructor(arrayBuffer: ArrayBuffer);
	/**
	 * Allocates a new buffer containing the given {array} of octets.
	 *
	 * @param array The octets to store.
	 */
	constructor(array: any[]);
	/**
	 * Copies the passed {buffer} data onto a new {Buffer} instance.
	 *
	 * @param buffer The buffer to copy.
	 */
	constructor(buffer: Buffer$1);
	prototype: Buffer$1;
	/**
	 * Allocates a new Buffer using an {array} of octets.
	 *
	 * @param array
	 */
	static from(array: any[]): Buffer$1;
	/**
	 * When passed a reference to the .buffer property of a TypedArray instance,
	 * the newly created Buffer will share the same allocated memory as the TypedArray.
	 * The optional {byteOffset} and {length} arguments specify a memory range
	 * within the {arrayBuffer} that will be shared by the Buffer.
	 *
	 * @param arrayBuffer The .buffer property of a TypedArray or a new ArrayBuffer()
	 * @param byteOffset
	 * @param length
	 */
	static from(arrayBuffer: ArrayBuffer, byteOffset?: number, length?: number): Buffer$1;
	/**
	 * Copies the passed {buffer} data onto a new Buffer instance.
	 *
	 * @param buffer
	 */
	static from(buffer: Buffer$1 | Uint8Array): Buffer$1;
	/**
	 * Creates a new Buffer containing the given JavaScript string {str}.
	 * If provided, the {encoding} parameter identifies the character encoding.
	 * If not provided, {encoding} defaults to 'utf8'.
	 *
	 * @param str
	 */
	static from(str: string, encoding?: string): Buffer$1;
	/**
	 * Returns true if {obj} is a Buffer
	 *
	 * @param obj object to test.
	 */
	static isBuffer(obj: any): obj is Buffer$1;
	/**
	 * Returns true if {encoding} is a valid encoding argument.
	 * Valid string encodings in Node 0.12: 'ascii'|'utf8'|'utf16le'|'ucs2'(alias of 'utf16le')|'base64'|'binary'(deprecated)|'hex'
	 *
	 * @param encoding string to test.
	 */
	static isEncoding(encoding: string): boolean;
	/**
	 * Gives the actual byte length of a string. encoding defaults to 'utf8'.
	 * This is not the same as String.prototype.length since that returns the number of characters in a string.
	 *
	 * @param string string to test.
	 * @param encoding encoding used to evaluate (defaults to 'utf8')
	 */
	static byteLength(string: string, encoding?: string): number;
	/**
	 * Returns a buffer which is the result of concatenating all the buffers in the list together.
	 *
	 * If the list has no items, or if the totalLength is 0, then it returns a zero-length buffer.
	 * If the list has exactly one item, then the first item of the list is returned.
	 * If the list has more than one item, then a new Buffer is created.
	 *
	 * @param list An array of Buffer objects to concatenate
	 * @param totalLength Total length of the buffers when concatenated.
	 *   If totalLength is not provided, it is read from the buffers in the list. However, this adds an additional loop to the function, so it is faster to provide the length explicitly.
	 */
	static concat(list: Uint8Array[], totalLength?: number): Buffer$1;
	/**
	 * The same as buf1.compare(buf2).
	 */
	static compare(buf1: Uint8Array, buf2: Uint8Array): number;
	/**
	 * Allocates a new buffer of {size} octets.
	 *
	 * @param size count of octets to allocate.
	 * @param fill if specified, buffer will be initialized by calling buf.fill(fill).
	 *    If parameter is omitted, buffer will be filled with zeros.
	 * @param encoding encoding used for call to buf.fill while initializing
	 */
	static alloc(size: number, fill?: string | Buffer$1 | number, encoding?: string): Buffer$1;
	/**
	 * Allocates a new buffer of {size} octets, leaving memory not initialized, so the contents
	 * of the newly created Buffer are unknown and may contain sensitive data.
	 *
	 * @param size count of octets to allocate
	 */
	static allocUnsafe(size: number): Buffer$1;
	/**
	 * Allocates a new non-pooled buffer of {size} octets, leaving memory not initialized, so the contents
	 * of the newly created Buffer are unknown and may contain sensitive data.
	 *
	 * @param size count of octets to allocate
	 */
	static allocUnsafeSlow(size: number): Buffer$1;
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
	/** DEFERRABLE flag */
	$deferrable?: boolean;
	/** INITIALLY DEFERRED flag */
	$initiallyDeferred?: boolean;
	/** Tracking ID for rename detection */
	$trackingId?: string;
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
/**
 * Relq database configuration
 * Supports both pooled and single connection modes
 *
 * @example
 * ```typescript
 * // With connection pooling (default)
 * const db = new Relq({
 *   host: 'localhost',
 *   port: 5432,
 *   database: 'mydb',
 *   user: 'postgres',
 *   password: 'secret',
 *   pooling: true,
 *   pool: {
 *     min: 2,
 *     max: 10
 *   }
 * });
 *
 * // Without pooling
 * const db = new Relq({
 *   host: 'localhost',
 *   database: 'mydb',
 *   pooling: false
 * });
 * ```
 */
export interface RelqConfig {
	/** Database host (default: localhost) */
	host?: string;
	/** Database port (default: 5432) */
	port?: number;
	/** Database name */
	database: string;
	/** Database user */
	user?: string;
	/** Database password */
	password?: string;
	/**
	 * Enable connection pooling
	 * - true: Enable pooling (default for traditional servers)
	 * - false: Single connection mode (default for serverless)
	 * - 'auto': Auto-detect environment (recommended)
	 * @default 'auto'
	 */
	pooling?: boolean | "auto";
	/**
	 * SSL/TLS configuration
	 * Applied to both pool and single connection modes
	 */
	ssl?: boolean | {
		rejectUnauthorized?: boolean;
		ca?: string;
		key?: string;
		cert?: string;
	};
	/**
	 * Connection pool configuration
	 * Only used when pooling is true
	 */
	pool?: {
		/**
		 * Minimum number of connections in pool
		 * @default 0 (connections created on demand)
		 */
		min?: number;
		/**
		 * Maximum number of connections in pool
		 * @default 10 (traditional), 1 (serverless)
		 */
		max?: number;
		/**
		 * Maximum time (ms) a connection can be idle before being closed
		 * @default 30000
		 */
		idleTimeoutMillis?: number;
		/**
		 * Maximum time (ms) to wait for a connection from the pool
		 * @default 0 (no timeout)
		 */
		connectionTimeoutMillis?: number;
		/**
		 * Maximum time (ms) a connection can be checked out before being forcibly returned
		 * @default 0 (no timeout)
		 */
		maxUses?: number;
		/**
		 * Application name for connection identification in PostgreSQL
		 */
		application_name?: string;
		/**
		 * SSL/TLS configuration
		 */
		ssl?: boolean | {
			rejectUnauthorized?: boolean;
			ca?: string;
			key?: string;
			cert?: string;
		};
	};
	/**
	 * Connection string (alternative to individual connection params)
	 * Format: postgresql://user:password@host:port/database
	 *
	 * @example
	 * ```typescript
	 * const db = new Relq({
	 *   connectionString: 'postgresql://user:pass@localhost:5432/mydb'
	 * });
	 * ```
	 */
	connectionString?: string;
	/**
	 * Database dialect (reserved for future use)
	 * Currently only PostgreSQL is supported
	 * @default 'postgresql'
	 */
	dialect?: "postgresql";
	/**
	 * Disable smart defaults and environment detection
	 * When true, uses explicit configuration only
	 * @default false
	 */
	disableSmartDefaults?: boolean;
	/**
	 * Logging level for Relq operations
	 * - 'silent': No logs
	 * - 'error': Only errors
	 * - 'warn': Errors and warnings
	 * - 'info': Errors, warnings, and info (environment detection)
	 * - 'debug': All logs including pool stats
	 * @default 'info'
	 */
	logLevel?: "silent" | "error" | "warn" | "info" | "debug";
	/**
	 * Data validation configuration for insert/update operations
	 * Validates data at runtime against schema constraints
	 *
	 * @example
	 * ```typescript
	 * const db = new Relq(schema, {
	 *     database: 'mydb',
	 *     validation: {
	 *         enabled: true,
	 *         validateLength: true,
	 *         validateTypes: true,
	 *         validateJsonSchema: false,
	 *         onError: 'throw'
	 *     }
	 * });
	 * ```
	 */
	validation?: {
		/**
		 * Master switch for all validation
		 * @default true
		 */
		enabled?: boolean;
		/**
		 * Validate string length against varchar/char limits from schema
		 * e.g., varchar(100) will reject strings longer than 100 chars
		 * @default true
		 */
		validateLength?: boolean;
		/**
		 * Validate data types match schema column types
		 * e.g., number for integer columns, string for varchar columns
		 * @default true
		 */
		validateTypes?: boolean;
		/**
		 * Validate JSONB column data against JSON schema if defined
		 * Requires schema to have JSON schema definitions
		 * @default false (disabled by default)
		 */
		validateJsonSchema?: boolean;
		/**
		 * How to handle validation errors
		 * - 'throw': Throw error immediately (default)
		 * - 'warn': Log warning but continue
		 * - 'log': Log info message and continue
		 * @default 'throw'
		 */
		onError?: "throw" | "warn" | "log";
	};
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
	 * AWS DSQL configuration
	 * When provided, enables first-class AWS Aurora DSQL support
	 * with automatic IAM token generation and caching
	 *
	 * @example
	 * ```typescript
	 * const db = new Relq(schema, {
	 *     database: 'postgres',
	 *     aws: {
	 *         hostname: 'abc123.dsql.us-east-1.on.aws',
	 *         region: 'us-east-1', // Autocomplete!
	 *         accessKeyId: 'AKIA...',
	 *         secretAccessKey: '...'
	 *     }
	 * });
	 * ```
	 */
	aws?: AwsDbConfig;
	/**
	 * Schema relations for type-safe joins
	 * Enables auto-detection of join conditions based on foreign key relationships
	 *
	 * @example
	 * ```typescript
	 * import { schema, relations } from './db/schema';
	 *
	 * const db = new Relq(schema, {
	 *     database: 'mydb',
	 *     relations,  // Enable type-safe joins with FK auto-resolution
	 * });
	 *
	 * // Now joins can auto-detect the condition:
	 * db.table.orders.select()
	 *   .join('users', ({ on, orders, users }) =>
	 *     on.equal(orders.userId, users.id)
	 *   )
	 * ```
	 */
	relations?: SchemaRelations | SchemaRelationsArray;
}
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
	constructor(builder: AggregateQueryBuilder, relq: Relq, tableName: string);
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
	constructor(relq: Relq<TSchema>);
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
type ColumnValue$1<T, K extends ColumnKeys<T>> = T extends {
	$inferSelect: infer TSelect;
} ? K extends keyof TSelect ? TSelect[K] : unknown : K extends keyof T ? T[K] : unknown;
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
/**
 * Type-safe condition builder for join WHERE clauses
 */
export interface TypedJoinWhereBuilder<T> {
	equal<K extends ColumnKeys<T>>(column: K, value: ColumnValue$1<T, K>): this;
	notEqual<K extends ColumnKeys<T>>(column: K, value: ColumnValue$1<T, K>): this;
	greaterThan<K extends ColumnKeys<T>>(column: K, value: ColumnValue$1<T, K>): this;
	lessThan<K extends ColumnKeys<T>>(column: K, value: ColumnValue$1<T, K>): this;
	greaterThanOrEqual<K extends ColumnKeys<T>>(column: K, value: ColumnValue$1<T, K>): this;
	lessThanOrEqual<K extends ColumnKeys<T>>(column: K, value: ColumnValue$1<T, K>): this;
	in<K extends ColumnKeys<T>>(column: K, values: ColumnValue$1<T, K>[]): this;
	notIn<K extends ColumnKeys<T>>(column: K, values: ColumnValue$1<T, K>[]): this;
	isNull<K extends ColumnKeys<T>>(column: K): this;
	notNull<K extends ColumnKeys<T>>(column: K): this;
	like<K extends ColumnKeys<T>>(column: K, pattern: string): this;
	ilike<K extends ColumnKeys<T>>(column: K, pattern: string): this;
	between<K extends ColumnKeys<T>>(column: K, start: ColumnValue$1<T, K>, end: ColumnValue$1<T, K>): this;
	and(callback: (q: TypedJoinWhereBuilder<T>) => TypedJoinWhereBuilder<T>): this;
	or(callback: (q: TypedJoinWhereBuilder<T>) => TypedJoinWhereBuilder<T>): this;
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
	 * Provides type-safe column autocomplete for the RIGHT (joined) table.
	 *
	 * @example
	 * on.equal(results.userId, users.id)
	 *   .where(q => q.equal('banned', false).isNull('deletedAt'))
	 */
	where(callback: (q: TypedJoinWhereBuilder<TRight>) => TypedJoinWhereBuilder<TRight>): this;
	/**
	 * Select specific columns from the joined table.
	 * If not called or called with '*', all columns are selected.
	 * The return type narrows TRight to only the selected columns.
	 *
	 * @param columns - Array of column names to select, or '*' for all columns
	 *
	 * @example
	 * on.equal(orders.userId, users.id)
	 *   .select(['id', 'name', 'email'])
	 * on.select('*')  // Select all (default)
	 */
	select<K extends ColumnKeys<TRight>>(columns: K[] | "*"): JoinConditionBuilder<TLeft, PickColumns<TRight, K>>;
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
 * Callback for inner joins within LATERAL
 */
export type InnerJoinCallback<TRight, TInner> = (on: JoinConditionBuilder<TRight, TInner>, inner: TableProxy<TInner>) => JoinConditionBuilder<TRight, TInner>;
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
	innerJoin<TInnerKey extends Exclude<keyof TSchema & string, TRightKey>>(table: TInnerKey, callback: InnerJoinCallback<TRight, TSchema[TInnerKey]>): this;
	/**
	 * Add a LEFT JOIN within the LATERAL subquery.
	 * Autocomplete excludes parent tables already in scope.
	 *
	 * @param table - Table name (schema key) to join
	 * @param callback - Join callback receiving (on, innerTable)
	 */
	leftInnerJoin<TInnerKey extends Exclude<keyof TSchema & string, TRightKey>>(table: TInnerKey, callback: InnerJoinCallback<TRight, TSchema[TInnerKey]>): this;
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
	 * @param columns - Array of column names to select, or '*' for all columns
	 */
	select<K extends ColumnKeys<TRight>>(columns: K[] | "*"): JoinManyConditionBuilder<TSchema, TLeft, PickColumns<TRight, K>, TRightKey>;
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
	constructor(builder: CountBuilder, relq: Relq, tableName: string);
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
	}, relq: Relq, tableName?: string | undefined, schemaKey?: string | undefined);
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
	constructor(builder: DeleteBuilder, relq: Relq, tableName?: string | undefined, schemaKey?: string | undefined);
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
	 * Set RETURNING clause - returns executor with typed run()
	 * Use '*' to return all columns, or specify column names
	 * Pass null to skip RETURNING clause (useful for conditional returning)
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
declare class ConnectedInsertBuilder<TTable = any> {
	private builder;
	private relq;
	private tableName?;
	private schemaKey?;
	constructor(builder: InsertBuilder, relq: Relq, tableName?: string | undefined, schemaKey?: string | undefined);
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
	 * Handle ON CONFLICT with callback-based builder
	 * @param columns - Column(s) for conflict detection
	 * @param callback - Callback that configures conflict resolution (doNothing, doUpdate, where)
	 * @example
	 * ```typescript
	 * .onConflict('userId', c => c.doNothing())
	 * .onConflict('userId', c => c.doUpdate({ balance: 100 }))
	 * .onConflict('userId', c => c.doUpdate({
	 *   balance: (excluded, sql, row) => sql.add(row.balance, excluded.balance)
	 * }))
	 * ```
	 */
	onConflict(columns: ColumnName<TTable> | ColumnName<TTable>[], callback: (builder: ConflictBuilder<TTable extends {
		$inferSelect: infer S;
	} ? S : TTable>) => void): this;
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
	 * Set RETURNING clause - returns executor with typed run()
	 * Use '*' to return all columns, or specify column names
	 * Pass null to skip RETURNING clause (useful for conditional returning)
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
	constructor(builder: UpdateBuilder, relq: Relq, tableName?: string | undefined, schemaKey?: string | undefined);
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
	 * Set RETURNING clause - returns executor with typed run()
	 * Use '*' to return all columns, or specify column names
	 * Pass null to skip RETURNING clause (useful for conditional returning)
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
	constructor(relq: Relq<TSchema>, tableName: string, columns?: string[] | undefined, whereClause?: ((q: TypedConditionBuilder<TTable>) => TypedConditionBuilder<TTable>) | undefined, orderByClause?: ([
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
	constructor(tableName: string, relq: Relq<TSchema>, 
	/** Schema key (camelCase) - used for join callback params */
	schemaKey?: string | undefined);
	select(): ConnectedSelectBuilder<TSchema, TTable, [
	]>;
	select<TColumns extends readonly ColumnSelection<TTable>[]>(columns: TColumns): ConnectedSelectBuilder<TSchema, TTable, TColumns>;
	select(column: ColumnName<TTable>): ConnectedSelectBuilder<TSchema, TTable, [
		string
	]>;
	/**
	 * Creates an INSERT query with type-safe data validation
	 */
	insert(data: InsertData<TTable>): ConnectedInsertBuilder<TTable>;
	/**
	 * Creates an UPDATE query with type-safe data validation
	 */
	update(data: UpdateData<TTable>): ConnectedUpdateBuilder<TTable>;
	/**
	 * Creates a DELETE query
	 */
	delete(): ConnectedDeleteBuilder<TTable>;
	/**
	 * Creates a COUNT query
	 */
	count(): ConnectedCountBuilder<TTable, {}>;
	/**
	 * Creates a standalone AGGREGATE query
	 *
	 * @example
	 * ```typescript
	 * db.table('orders').aggregate()
	 *     .groupBy('customerId')
	 *     .count('totalCount')
	 *     .sum('amount', 'totalSpent')
	 *     .where(q => q.equal('active', true))
	 *     .all()
	 * ```
	 */
	aggregate(): ConnectedAggregateBuilder<TTable>;
	/**
	 * Find a record by its primary key
	 * Automatically detects primary key column(s) from schema
	 *
	 * @param id - Primary key value (string or number)
	 * @example
	 * ```typescript
	 * const user = await db.table.users.findById(123)
	 * const post = await db.table.posts.findById('uuid-string')
	 * ```
	 */
	findById<T = TTable extends {
		$inferSelect: infer S;
	} ? S : any>(id: string | number): Promise<T | null>;
	/**
	 * Find first record matching filter object
	 *
	 * @param filter - Object with column-value pairs (equality match)
	 * @example
	 * ```typescript
	 * const user = await db.table.users.findOne({ email: 'test@email.com' })
	 * ```
	 */
	findOne<T = TTable extends {
		$inferSelect: infer S;
	} ? S : any>(filter: Partial<TTable extends {
		$inferInsert: infer I;
	} ? I : Record<string, any>>): Promise<T | null>;
	/**
	 * Find all records matching filter object
	 *
	 * @param filter - Object with column-value pairs (equality match)
	 * @example
	 * ```typescript
	 * const admins = await db.table.users.findMany({ role: 'admin' })
	 * ```
	 */
	findMany<T = TTable extends {
		$inferSelect: infer S;
	} ? S : any>(filter: Partial<TTable extends {
		$inferInsert: infer I;
	} ? I : Record<string, any>>): Promise<T[]>;
	/**
	 * Check if any records exist matching filter
	 *
	 * @param filter - Object with column-value pairs
	 * @returns boolean - true if at least one record exists
	 * @example
	 * ```typescript
	 * const exists = await db.table.users.exists({ email: 'test@email.com' })
	 * ```
	 */
	exists(filter: Partial<TTable extends {
		$inferInsert: infer I;
	} ? I : Record<string, any>>): Promise<boolean>;
	/**
	 * Insert or update a record (upsert)
	 *
	 * @example
	 * ```typescript
	 * const user = await db.table.users.upsert({
	 *     where: { email: 'test@email.com' },
	 *     create: { email: 'test@email.com', name: 'New' },
	 *     update: { name: 'Updated' }
	 * })
	 * ```
	 */
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
	 * Insert multiple records at once
	 *
	 * @example
	 * ```typescript
	 * const users = await db.table.users.insertMany([
	 *     { email: 'a@a.com', name: 'A' },
	 *     { email: 'b@b.com', name: 'B' }
	 * ])
	 * ```
	 */
	insertMany<T = TTable extends {
		$inferSelect: infer S;
	} ? S : any>(rows: Array<TTable extends {
		$inferInsert: infer I;
	} ? I : Record<string, any>>): Promise<T[]>;
	/**
	 * Advanced paginate with multiple modes and type-safe column selection
	 *
	 * @example Paging mode
	 * ```typescript
	 * const result = await db.table.users.paginate({
	 *     columns: ['id', 'name', 'email'],
	 *     where: q => q.equal('active', true),
	 *     orderBy: ['createdAt', 'DESC']
	 * }).paging({ page: 1, perPage: 20 })
	 * ```
	 *
	 * @example Offset mode with shuffleLimit
	 * ```typescript
	 * const result = await db.table.users.paginate({
	 *     columns: ['id', 'name'],
	 *     orderBy: ['id', 'ASC']
	 * }).offset({ position: 0, shuffleLimit: [10, 50] })
	 * ```
	 */
	paginate<T = TTable extends {
		$inferSelect: infer S;
	} ? S : Record<string, unknown>>(options?: {
		/** Columns to select */
		columns?: ColumnName<TTable>[];
		/** Where clause */
		where?: (q: TypedConditionBuilder<TTable>) => TypedConditionBuilder<TTable>;
		/** Order by columns */
		orderBy?: [
			ColumnName<TTable>,
			"ASC" | "DESC"
		] | Array<[
			ColumnName<TTable>,
			"ASC" | "DESC"
		]>;
	}): PaginateBuilder<TSchema, TTable, T>;
	/**
	 * Soft delete a record (set deleted_at timestamp)
	 *
	 * @example
	 * ```typescript
	 * await db.table.users.softDelete({ id: 123 })
	 * ```
	 */
	softDelete<T = TTable extends {
		$inferSelect: infer S;
	} ? S : any>(filter: Partial<TTable extends {
		$inferInsert: infer I;
	} ? I : Record<string, any>>): Promise<T | null>;
	/**
	 * Restore a soft-deleted record (clear deleted_at)
	 *
	 * @example
	 * ```typescript
	 * await db.table.users.restore({ id: 123 })
	 * ```
	 */
	restore<T = TTable extends {
		$inferSelect: infer S;
	} ? S : any>(filter: Partial<TTable extends {
		$inferInsert: infer I;
	} ? I : Record<string, any>>): Promise<T | null>;
	/**
	 * Get primary key column name from schema
	 * @internal
	 */
	private getPrimaryKeyColumn;
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
 * Join callback function type with positional parameters for better type inference.
 * TResult allows the callback to return a narrowed type (e.g., after .select())
 *
 * @param on - The condition builder for ON clause
 * @param left - Table proxy for the left (current) table
 * @param right - Table proxy for the right (joined) table
 *
 * @example
 * ```typescript
 * // Positional params provide better autocomplete and type inference
 * .join('users', (on, orders, users) =>
 *   on.equal(orders.userId, users.id)
 *     .select(['id', 'name'])  // Narrows result to only these columns
 * )
 * ```
 */
export type JoinCallback<TLeft, TRight, TResult = TRight> = (on: JoinConditionBuilder<TLeft, TRight>, left: TableProxy<TLeft>, right: TableProxy<TRight>) => JoinConditionBuilder<TLeft, TResult>;
/**
 * JoinMany callback function type for LATERAL subqueries.
 * Provides additional orderBy, limit, offset capabilities.
 * Includes schema for type-safe inner joins with autocomplete.
 * TResult allows the callback to return a narrowed type (e.g., after .select())
 *
 * @param on - The condition builder for LATERAL subquery
 * @param left - Table proxy for the left (current/outer) table
 * @param right - Table proxy for the right (joined/inner) table
 *
 * @example
 * ```typescript
 * // Get top 5 orders per user
 * .joinMany('orders', (on, users, orders) =>
 *   on.equal(users.id, orders.userId)
 *     .where(q => q.equal('status', 'completed'))
 *     .orderBy(orders.createdAt, 'DESC')
 *     .limit(5)
 * )
 * ```
 */
export type JoinManyCallback<TSchema, TLeft, TRight, TRightKey extends string, TResult = TRight> = (on: JoinManyConditionBuilder<TSchema, TLeft, TRight, TRightKey>, left: TableProxy<TLeft>, right: TableProxy<TRight>) => JoinManyConditionBuilder<TSchema, TLeft, TResult, TRightKey>;
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
		result: QueryResult;
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
type Prettify$2<T> = {
	[K in keyof T]: T[K];
} & {};
/**
 * Helper type to extract row type from a table definition
 */
export type InferRowType<TTable> = TTable extends {
	$inferSelect: infer TSelect;
} ? Prettify$2<TSelect> : TTable extends {
	$columns: infer TCols;
} ? Prettify$2<{
	[K in keyof TCols]: any;
}> : TTable;
/**
 * Create a nested join result: { [alias]: JoinedTableType }
 */
export type NestedJoin<TAlias extends string, TJoinedTable> = {
	[K in TAlias]: InferRowType<TJoinedTable>;
};
/**
 * Create a nested LEFT JOIN result: { [alias]: JoinedTableType | null }
 */
export type NestedLeftJoin<TAlias extends string, TJoinedTable> = {
	[K in TAlias]: InferRowType<TJoinedTable> | null;
};
/**
 * Create a nested JOIN MANY result: { [alias]: JoinedTableType[] }
 * Used for one-to-many joins via LATERAL subqueries.
 */
export type NestedJoinMany<TAlias extends string, TJoinedTable> = {
	[K in TAlias]: InferRowType<TJoinedTable>[];
};
declare class ConnectedSelectBuilder<TSchema = any, TTable = any, TColumns extends readonly any[] = any, TJoined = {}> {
	private builder;
	private relq;
	private tableName;
	private columns?;
	/** Schema key (camelCase) - used for join callback params */
	private schemaKey?;
	constructor(builder: SelectBuilder, relq: Relq<TSchema>, tableName: string, columns?: (string | Array<string | [
		string,
		string
	]>) | undefined, 
	/** Schema key (camelCase) - used for join callback params */
	schemaKey?: string | undefined);
	/**
	 * Set up column resolver to transform property names to SQL column names.
	 * Uses schema metadata to resolve column names.
	 * @internal
	 */
	private setupColumnResolver;
	where(callback: (q: TypedConditionBuilder<TTable>) => TypedConditionBuilder<TTable>): this;
	orderBy(column: ColumnName<TTable>, direction?: "ASC" | "DESC"): this;
	limit(count: number): this;
	offset(count: number): this;
	groupBy(...columns: ColumnName<TTable>[]): this;
	having(callback: any): this;
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
	 * // With explicit callback
	 * db.table.orders.select()
	 *   .join('users', (on, orders, users) =>
	 *     on.equal(orders.userId, users.id)
	 *   )
	 *
	 * // With alias
	 * db.table.orders.select()
	 *   .join(['users', 'user'], (on, orders, user) =>
	 *     on.equal(orders.userId, user.id)
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
	 * // With callback
	 * db.table.orders.select()
	 *   .leftJoin(['users', 'user'], (on, orders, user) =>
	 *     on.equal(orders.userId, user.id)
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
	 *
	 * @example
	 * ```typescript
	 * db.table.orders.select()
	 *   .rightJoin('users')
	 * // Result: { ...order, users: { ... } }
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
	], callback: JoinCallback<TTable, TSchema[TRightKey]>): ConnectedSelectBuilder<TSchema, TTable, TColumns, TJoined & NestedJoin<TAlias, TSchema[TRightKey]>>;
	rightJoin<TRightKey extends keyof TSchema & string>(table: TRightKey, callback: JoinCallback<TTable, TSchema[TRightKey]>): ConnectedSelectBuilder<TSchema, TTable, TColumns, TJoined & NestedJoin<TRightKey, TSchema[TRightKey]>>;
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
	 *     db.table.orders.select().join('payments', (on, o, p) =>
	 *       on.equal(o.id, p.orderId)
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
	 * @example
	 * ```typescript
	 * // Get top 5 orders per user
	 * db.table.users.select()
	 *   .joinMany('orders', (on, users, orders) =>
	 *     on.equal(users.id, orders.userId)
	 *       .where(q => q.equal('status', 'completed'))
	 *       .orderBy(orders.createdAt, 'DESC')
	 *       .limit(5)
	 *   )
	 *   .all()
	 * // Result: Array<{ ...User, orders: Order[] }>
	 *
	 * // With alias
	 * db.table.users.select()
	 *   .joinMany(['orders', 'recentOrders'], (on, users, orders) =>
	 *     on.equal(users.id, orders.userId)
	 *       .orderBy(orders.createdAt, 'DESC')
	 *       .limit(3)
	 *   )
	 * // Result: Array<{ ...User, recentOrders: Order[] }>
	 * ```
	 */
	joinMany<TRightKey extends keyof TSchema & string, TAlias extends string, TResult>(tableAndAlias: [
		TRightKey,
		TAlias
	], callback: JoinManyCallback<TSchema, TTable, TSchema[TRightKey], TRightKey, TResult>): ConnectedSelectBuilder<TSchema, TTable, TColumns, TJoined & NestedJoinMany<TAlias, TResult>>;
	joinMany<TRightKey extends keyof TSchema & string, TResult>(table: TRightKey, callback: JoinManyCallback<TSchema, TTable, TSchema[TRightKey], TRightKey, TResult>): ConnectedSelectBuilder<TSchema, TTable, TColumns, TJoined & NestedJoinMany<TRightKey, TResult>>;
	/**
	 * Type-safe one-to-many LEFT JOIN using LATERAL subquery.
	 * Returns an array of related rows (empty array if no matches).
	 *
	 * @example
	 * ```typescript
	 * // Get all users with their orders (empty array if no orders)
	 * db.table.users.select()
	 *   .leftJoinMany('orders', (on, users, orders) =>
	 *     on.equal(users.id, orders.userId)
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
	], callback: JoinManyCallback<TSchema, TTable, TSchema[TRightKey], TRightKey, TResult>): ConnectedSelectBuilder<TSchema, TTable, TColumns, TJoined & NestedJoinMany<TAlias, TResult>>;
	leftJoinMany<TRightKey extends keyof TSchema & string, TResult>(table: TRightKey, callback: JoinManyCallback<TSchema, TTable, TSchema[TRightKey], TRightKey, TResult>): ConnectedSelectBuilder<TSchema, TTable, TColumns, TJoined & NestedJoinMany<TRightKey, TResult>>;
	/**
	 * Internal method to add a type-safe LATERAL join for one-to-many relationships.
	 * @internal
	 */
	private addTypeSafeJoinMany;
	/**
	 * Build the LATERAL subquery SQL for joinMany.
	 * @internal
	 */
	private buildLateralSubquery;
	/**
	 * Internal method to add a type-safe join.
	 * @internal
	 */
	private addTypeSafeJoin;
	distinct(): this;
	/**
	 * DISTINCT ON - select unique rows by specified columns
	 * PostgreSQL-specific feature
	 *
	 * @example
	 * ```typescript
	 * db.table.logs.select()
	 *     .distinctOn('userId')
	 *     .orderBy('userId')
	 *     .orderBy('createdAt', 'DESC')
	 *     .all()
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
	 * FOR UPDATE SKIP LOCKED - skip locked rows (job queue pattern)
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
	 * Iterate through query results row-by-row using PostgreSQL cursors
	 * Efficient for large datasets as it doesn't load all data into memory
	 *
	 * @param callback - Async function called for each row
	 * @param options - Optional configuration
	 * @param options.batchSize - Number of rows to fetch per batch (default: 100)
	 *
	 * @example
	 * ```typescript
	 * await db.table('results')
	 *     .select(['email', 'userId'])
	 *     .where(q => q.equal('verified', false))
	 *     .each(async (row) => {
	 *         console.log(row.email);
	 *     });
	 *
	 * // With custom batch size
	 * await db.table('results')
	 *     .select(['email'])
	 *     .each(async (row) => { ... }, { batchSize: 50 });
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
	 * @example Cursor mode - Efficient infinite scroll
	 * ```typescript
	 * const result = await db.table('users')
	 *   .select()
	 *   .pagination({
	 *     mode: 'cursor',
	 *     limit: 20,
	 *     cursor: 'abc123',
	 *     orderBy: [['createdAt', 'DESC']]
	 *   });
	 * // result.pagination: { limit, hasMore, nextCursor, prevCursor, total? }
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
	constructor(relq: Relq);
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
	constructor(query: string, params: QueryValue[], relq: Relq);
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
 * Main Relq client class with connection management
 * Supports both pooled and single connection modes
 *
 * @template TSchema - Optional database schema for type safety (defaults to 'any' for backward compatibility)
 *
 * @example
 * ```typescript
 * // Without schema (backward compatible - no type safety)
 * const db1 = new Relq({
 *   host: 'localhost',
 *   database: 'mydb',
 *   user: 'postgres',
 *   password: 'secret'
 * });
 *
 * // With schema (100% type safety)
 * interface MyDatabase {
 *   users: {
 *     id: string;
 *     name: string;
 *     email: string;
 *     age: number;
 *   };
 *   posts: {
 *     id: string;
 *     user_id: string;
 *     title: string;
 *   };
 * }
 *
 * const db2 = new Relq<MyDatabase>({ ... });
 *
 * // Now with full type safety:
 * const users = await db2.table('users')  // ✅ Only 'users' | 'posts' allowed
 *   .select(['id', 'name'])  // ✅ Only valid columns autocomplete
 *   .where(q => q.equal('age', 25))  // ✅ Type-checked: age is number
 *   .all();
 * // Type: RelqResult<{ id: string; name: string }[]>
 *
 * // Close connection when done
 * await db.close();
 * ```
 */
export declare class Relq<TSchema = any> {
	private pool?;
	private client?;
	private config;
	private usePooling;
	private initialized;
	private initPromise?;
	private isClosed;
	private environment;
	private poolErrorHandler?;
	private poolConnectHandler?;
	private poolRemoveHandler?;
	private listener;
	private readonly emitter;
	/**
	 * Column name mapping for a table
	 * Maps dev property names ↔ DB column names and stores column types
	 */
	private columnMappings;
	/**
	 * Original schema definition (if provided)
	 */
	private schema?;
	/**
	 * Create a new Relq client with schema-based column mapping
	 *
	 * @param schema - Schema definition with column mappings (e.g., from db/schema.ts)
	 * @param config - Database connection configuration
	 *
	 * @example
	 * ```typescript
	 * import { schema } from './db/schema';
	 *
	 * const db = new Relq(schema, {
	 *     host: 'localhost',
	 *     database: 'mydb',
	 *     user: 'postgres',
	 *     password: 'secret'
	 * });
	 *
	 * // Column mapping is automatic!
	 * // Schema: productId: uuid('product_id')
	 * // Dev uses: { productId: '...' }
	 * // Relq sends: { product_id: '...' } to DB
	 * ```
	 */
	constructor(schema: TSchema, config: RelqConfig);
	/**
	 * Build column name mappings from schema
	 * @private
	 */
	private buildColumnMappings;
	/**
	 * Transform object keys from dev property names to DB column names
	 * Also applies type serialization (e.g., bigint -> string)
	 * Used for INSERT/UPDATE operations
	 * @internal
	 */
	private _transformToDbColumns;
	/**
	 * Transform object keys from DB column names to dev property names
	 * Also applies type coercion (e.g., string -> bigint, string -> Date)
	 * Used for SELECT results
	 * @internal
	 */
	private _transformFromDbColumns;
	/**
	 * Transform an array of results from DB column names to dev property names
	 * @internal
	 */
	private _transformResultsFromDb;
	/**
	 * Check if schema-based column mapping is available
	 */
	private _hasColumnMapping;
	/**
	 * Validate data against schema constraints before insert/update
	 * @internal
	 */
	private _validateData;
	/**
	 * Validate recursive composite type fields
	 * @private
	 */
	private _validateComposite;
	/**
	 * Get a client for cursor operations
	 * For pooled connections, acquires a client from pool
	 * For single client, returns the existing client
	 * @internal
	 */
	private _getClientForCursor;
	/**
	 * Internal accessor for query builders
	 * Uses Symbol key to be completely hidden from autocomplete
	 * @internal - DO NOT USE DIRECTLY
	 */
	get [INTERNAL](): RelqInternal;
	/**
	 * Get the schema object
	 * @internal
	 */
	private _getSchema;
	/**
	 * Get the relations object for FK auto-resolution
	 * @internal
	 */
	private _getRelations;
	/**
	 * Get table definition by schema key
	 * @internal
	 */
	private _getTableDef;
	/**
	 * Determine if pooling should be enabled
	 * @private
	 */
	private determinePoolingStrategy;
	/**
	 * Validate configuration and show warnings
	 * @private
	 */
	private validateConfiguration;
	/**
	 * Log environment detection information
	 * @private
	 */
	private logEnvironmentInfo;
	/**
	 * Initialize database connection
	 * Lazy-loads pg module to support tree shaking
	 * @private
	 */
	private initialize;
	/**
	 * Setup error handling for connection pool
	 *
	 * Critical: The 'error' event handler prevents the app from crashing
	 * when idle connections timeout or network errors occur.
	 *
	 * Common errors:
	 * - ETIMEDOUT: Network timeout on idle connection
	 * - ECONNRESET: Connection reset by peer
	 * - ENOTFOUND: Database host not found
	 *
	 * The pool will automatically remove bad connections and create new ones.
	 *
	 * @private
	 */
	private setupPoolErrorHandling;
	/**
	 * Connect to database (internal - called automatically on first query)
	 * @internal
	 */
	private connect;
	/**
	 * Subscribe to a PostgreSQL NOTIFY channel
	 *
	 * Returns an unsubscribe function that can be called to stop listening.
	 *
	 * @param channel - Channel name to listen to
	 * @param callback - Function called when notification is received
	 * @returns Unsubscribe function
	 *
	 * @example
	 * ```typescript
	 * // Subscribe to notifications
	 * const unsub = await db.subscribe('my_channel', (data) => {
	 *     console.log('Received:', data);
	 * });
	 *
	 * // Later: unsubscribe
	 * await unsub();
	 * ```
	 */
	subscribe<T = any>(channel: string, callback: (payload: T) => void): Promise<Unsubscribe>;
	/**
	 * Close database connection(s)
	 * For pooled connections, this closes all connections in the pool
	 *
	 * Note: Connections are also automatically closed on process exit,
	 * but it's recommended to call this explicitly when done.
	 */
	close(): Promise<void>;
	/**
	 * Check if connection is closed
	 */
	get closed(): boolean;
	/**
	 * Register an event listener
	 *
	 * Available events:
	 * - `connect` - When a connection is established
	 * - `error` - When an error occurs
	 * - `end` - When connection ends
	 * - `notice` - PostgreSQL NOTICE messages
	 * - `notification` - LISTEN/NOTIFY messages
	 * - `acquire` - Pool: when client acquired from pool
	 * - `remove` - Pool: when client removed from pool
	 *
	 * @example
	 * ```typescript
	 * db.on('error', (err) => console.error('DB Error:', err));
	 * db.on('notice', (msg) => console.log('Notice:', msg));
	 * ```
	 */
	on(event: string, listener: (...args: any[]) => void): this;
	/**
	 * Register a one-time event listener
	 */
	once(event: string, listener: (...args: any[]) => void): this;
	/**
	 * Remove an event listener
	 */
	off(event: string, listener: (...args: any[]) => void): this;
	/**
	 * Execute raw SQL query with metadata
	 * @internal - Used by query builders, not part of public API
	 */
	/** @internal */
	protected _executeQuery(sql: string): Promise<{
		result: QueryResult;
		duration: number;
	}>;
	/**
	 * Build metadata from query result
	 * @private
	 */
	private buildMetadata;
	/**
	 * Execute SELECT query and return all rows
	 * @param tableName - Optional table name for column mapping
	 * @internal - Used by query builders, not part of public API
	 */
	private _executeSelect;
	/**
	 * Execute SELECT query and return single row
	 * @param tableName - Optional table name for column mapping
	 * @internal - Used by query builders, not part of public API
	 */
	private _executeSelectOne;
	/**
	 * Execute COUNT query
	 * @internal - Used by query builders, not part of public API
	 */
	private _executeCount;
	/**
	 * Execute INSERT/UPDATE/DELETE query
	 * @internal - Used by query builders, not part of public API
	 */
	private _executeRun;
	/**
	 * Table accessor - both callable and has table properties
	 *
	 * @example
	 * ```typescript
	 * // Callable with autocomplete
	 * db.table('users').select().all()
	 *
	 * // Property access with autocomplete
	 * db.table.users.select().all()
	 * ```
	 */
	get table(): TableAccessor<TSchema, this>;
	/**
	 * Execute raw SQL query
	 *
	 * @example
	 * ```typescript
	 * const result = await db.raw('SELECT * FROM users WHERE id = $1', 1).all();
	 * ```
	 */
	raw(query: string, ...params: QueryValue[]): ConnectedRawQueryBuilder;
	/**
	 * Create a transaction builder with execution context
	 *
	 * @example
	 * ```typescript
	 * await db.transaction().begin();
	 * // ... execute queries
	 * await db.transaction().commit();
	 * ```
	 */
	transaction(): ConnectedTransactionBuilder;
	/**
	 * Start a CTE (Common Table Expression) query with named subqueries
	 *
	 * @param name - Name of the CTE
	 * @param query - Query builder or SQL string for the CTE
	 * @returns ConnectedCTEBuilder for chaining
	 *
	 * @example
	 * ```typescript
	 * const result = await db.with('active_users',
	 *     db.table.users.select().where(q => q.equal('active', true))
	 * )
	 * .with('recent_orders',
	 *     db.table.orders.select().where(q => q.greaterThan('createdAt', someDate))
	 * )
	 * .query('SELECT * FROM active_users JOIN recent_orders ON ...')
	 * .all()
	 * ```
	 */
	with(name: string, query: {
		toString(): string;
	} | string): ConnectedCTEBuilder<TSchema>;
	/**
	 * Create Table As Select - creates a new table from a query result
	 *
	 * @param tableName - Name of the new table to create
	 * @param query - Query builder or SQL string for the data
	 * @param options - Optional settings (temporary, ifNotExists)
	 *
	 * @example
	 * ```typescript
	 * await db.ctAs('active_users',
	 *     db.table.users.select(['id', 'name']).where(q => q.equal('active', true))
	 * )
	 *
	 * await db.ctAs('monthly_summary',
	 *     db.table.orders.select().aggregate()
	 *         .groupBy('month')
	 *         .sum('amount', 'totalAmount')
	 *         .count('orderCount'),
	 *     { temporary: true }
	 * )
	 * ```
	 */
	ctAs(tableName: string, query: {
		toString(): string;
	} | string, options?: {
		temporary?: boolean;
		ifNotExists?: boolean;
	}): Promise<void>;
	/**
	 * Execute EXPLAIN on a query for performance analysis
	 *
	 * @example
	 * ```typescript
	 * const plan = await db.explain(db.table.users.select())
	 * const analyzed = await db.explain(db.table.users.select(), { analyze: true })
	 * ```
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
	 *
	 * Use this for aggregating values from multiple tables without a base table.
	 * Each callback receives a table accessor and must return a scalar result
	 * (count, sum, avg, min, max, pick, or exists).
	 *
	 * @example
	 * ```typescript
	 * const stats = await db.scalar({
	 *   licenseCount: q => q.licenses.where(w => w.equal('productId', id)).count(),
	 *   totalSpent: q => q.orders.where(w => w.equal('customerId', id)).sum('amount'),
	 *   lastOrder: q => q.orders.where(w => w.equal('customerId', id)).max('createdAt'),
	 *   hasSubscription: q => q.subscriptions.where(w => w.equal('userId', id)).exists(),
	 * }).get();
	 *
	 * // Type: { licenseCount: number, totalSpent: number, lastOrder: Date, hasSubscription: boolean }
	 * ```
	 */
	scalar<T extends Record<string, ScalarCallback<TSchema, any>>>(scalars: T): ConnectedScalarSelectBuilder<TSchema, T>;
	/**
	 * Create a standalone condition builder for a specific table
	 *
	 * Returns a TypedConditionBuilder with full type safety and autocompletion
	 * for the specified table's columns. Useful for creating reusable conditions
	 * or building complex WHERE clauses independently.
	 *
	 * @template TTable - Table name from schema (auto-inferred)
	 * @param _tableName - Table name for type inference (not used at runtime)
	 * @returns TypedConditionBuilder with column autocompletion
	 *
	 * @example
	 * ```typescript
	 * // Create a reusable condition builder
	 * const conditions = db.where('users');
	 * conditions.equal('status', 'active').greaterThan('age', 18);
	 *
	 * // Use with query
	 * const query = db.table.users.select()
	 *     .where(() => conditions);
	 * ```
	 */
	where<TTable extends keyof TSchema & string>(_tableName: TTable): TypedConditionBuilder<TSchema[TTable]>;
}
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
		operation: "connection" | "query";
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
 * - Pooling is OFF by default (user must opt-in)
 * - min: 0 for all environments (most balanced)
 * - Connections created on demand
 * - No wasted resources when idle
 *
 * @returns Optimal pool configuration for current environment
 */
export declare function getSmartPoolDefaults(): SmartPoolConfig & {
	pool?: boolean;
};
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
/**
 * Configuration interface for format pattern customization
 */
export interface FormatConfig {
	pattern?: {
		ident?: string;
		literal?: string;
		string?: string;
		simple?: string;
	};
}
/**
 * Supported value types for PostgreSQL formatting
 */
export type PostgreSQLValue = string | number | boolean | Date | Buffer$1 | object | null | undefined;
/**
 * Array of PostgreSQL values
 */
export type PostgreSQLArray = PostgreSQLValue[];
declare function quoteIdent(value: PostgreSQLValue): string;
declare function quoteLiteral(value: PostgreSQLValue): string;
declare function quoteString(value: PostgreSQLValue): string;
declare function formatWithArray(fmt: string, parameters: PostgreSQLArray): string;
/**
 * Main format function for PostgreSQL queries
 * Supports placeholders: %I (identifier), %L (literal), %s (string), ? (simple literal)
 * Also supports positional parameters like %1$I, %2$L, etc.
 * @param fmt - Format string with placeholders
 * @param args - Variable arguments to substitute into placeholders
 * @returns Formatted PostgreSQL query string
 * @example
 * format('SELECT %I FROM %I WHERE %I = %L', 'name', 'users', 'id', 123)
 * // Returns: SELECT "name" FROM "users" WHERE "id" = '123'
 * @example
 * format('SELECT * FROM users WHERE id = ? AND name = ?', 123, 'John')
 * // Returns: SELECT * FROM users WHERE id = '123' AND name = 'John'
 */
export declare function format(fmt: string, ...args: PostgreSQLValue[]): string;
export declare namespace format {
	var config: (cfg?: FormatConfig) => void;
	var ident: typeof quoteIdent;
	var literal: typeof quoteLiteral;
	var string: typeof quoteString;
	var withArray: typeof formatWithArray;
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
	 * Creates JSONB value from object.
	 *
	 * @param obj - Object to convert to JSONB
	 * @returns RawValue
	 *
	 * @example
	 * ```typescript
	 * relq('users').insert({
	 *   metadata: PgValue.jsonb({ theme: 'dark', lang: 'en' })
	 * })
	 * ```
	 */
	static jsonb(obj: any): RawValue;
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
 * import { F } from 'relq/schema-builder';
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
export declare class AggregateFunctions {
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
	static count: typeof AggregateFunctions.count;
	/** Count distinct */
	static count_distinct: typeof AggregateFunctions.count_distinct;
	/** Sum values */
	static sum: typeof AggregateFunctions.sum;
	/** Average values */
	static avg: typeof AggregateFunctions.avg;
	/** Minimum value */
	static min: typeof AggregateFunctions.min;
	/** Maximum value */
	static max: typeof AggregateFunctions.max;
	/** String aggregate */
	static string_agg: typeof AggregateFunctions.string_agg;
	/** String aggregate with order */
	static string_agg_order: typeof AggregateFunctions.string_agg_order;
	/** Boolean AND aggregate */
	static bool_and: typeof AggregateFunctions.bool_and;
	/** Boolean OR aggregate */
	static bool_or: typeof AggregateFunctions.bool_or;
	/** Every (alias for bool_and) */
	static every: typeof AggregateFunctions.every;
	/** Bitwise AND aggregate */
	static bit_and: typeof AggregateFunctions.bit_and;
	/** Bitwise OR aggregate */
	static bit_or: typeof AggregateFunctions.bit_or;
	/** Population standard deviation */
	static stddev_pop: typeof AggregateFunctions.stddev_pop;
	/** Sample standard deviation */
	static stddev_samp: typeof AggregateFunctions.stddev_samp;
	/** Standard deviation */
	static stddev: typeof AggregateFunctions.stddev;
	/** Population variance */
	static var_pop: typeof AggregateFunctions.var_pop;
	/** Sample variance */
	static var_samp: typeof AggregateFunctions.var_samp;
	/** Variance */
	static variance: typeof AggregateFunctions.variance;
	/** Correlation */
	static corr: typeof AggregateFunctions.corr;
	/** Population covariance */
	static covar_pop: typeof AggregateFunctions.covar_pop;
	/** Sample covariance */
	static covar_samp: typeof AggregateFunctions.covar_samp;
	/** Continuous percentile */
	static percentile_cont: typeof AggregateFunctions.percentile_cont;
	/** Discrete percentile */
	static percentile_disc: typeof AggregateFunctions.percentile_disc;
	/** Mode (most frequent value) */
	static mode: typeof AggregateFunctions.mode;
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
 * import { Case } from 'relq/schema-builder';
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

export {
	InferColumnType$2 as InferColumnType,
	Relq as RelqClient,
	relq as default,
};

export {};
