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
/**
 * SQLite storage classes.
 *
 * @see https://www.sqlite.org/datatype3.html
 */
export type SQLiteStorageClass = "INTEGER" | "REAL" | "TEXT" | "BLOB" | "NUMERIC";
/**
 * Column configuration for SQLite schema definitions.
 *
 * Uses the same `$`-prefixed metadata convention as pg-schema ColumnConfig
 * for compatibility with CLI tools (AST, codegen, introspection).
 *
 * @remarks
 * Fields like `$array`, `$identity`, `$withTimezone` are intentionally absent
 * because SQLite does not support these features.
 */
export interface SQLiteColumnConfig<T = unknown> {
	/** SQL type string (e.g., 'INTEGER', 'TEXT', 'REAL') */
	$type: string;
	/** SQL type string stored separately (avoids shadowing by $type() method) */
	$sqlType?: string;
	/** TypeScript type marker for inference */
	$tsType?: T;
	/** Whether the column is nullable (false = NOT NULL) */
	$nullable?: boolean;
	/** Default value expression */
	$default?: T | (() => T) | string | object | DefaultValue;
	/** Whether this is a PRIMARY KEY column */
	$primaryKey?: boolean;
	/** Whether this is a UNIQUE column */
	$unique?: boolean;
	/** Foreign key reference */
	$references?: {
		table: string;
		column: string;
		onDelete?: string;
		onUpdate?: string;
	};
	/** CHECK constraint expression */
	$check?: string;
	/** CHECK constraint enum values (for type narrowing) */
	$checkValues?: readonly string[];
	/** CHECK constraint name */
	$checkName?: string;
	/** Generated column expression */
	$generated?: {
		expression: string;
		stored?: boolean;
	};
	/** VARCHAR/CHAR length (informational — SQLite ignores) */
	$length?: number;
	/** DECIMAL precision (informational — SQLite uses REAL affinity) */
	$precision?: number;
	/** DECIMAL scale (informational — SQLite uses REAL affinity) */
	$scale?: number;
	/** SQLite collation: 'BINARY', 'NOCASE', or 'RTRIM' */
	$collate?: string;
	/** Explicit database column name (overrides property key) */
	$columnName?: string;
	/** Tracking ID for rename detection during migrations */
	$trackingId?: string;
	/** Whether AUTOINCREMENT is enabled (INTEGER PRIMARY KEY only) */
	$autoincrement?: boolean;
	/** Column comment (stored in schema metadata, not in SQLite) */
	$comment?: string;
	/** Semantic mode for the column type */
	$mode?: string;
}
/**
 * Fluent column builder for SQLite columns.
 *
 * Supports chainable method calls for column configuration.
 * Methods that are not applicable to SQLite (arrays, identity, timezone)
 * are intentionally excluded.
 *
 * @template T - TypeScript type this column maps to
 * @template Config - Current column configuration state
 *
 * @example
 * ```typescript
 * // Basic usage
 * name: text().notNull(),
 *
 * // With autoincrement
 * id: integer().primaryKey().autoincrement(),
 *
 * // With check constraint for enum-like behavior
 * status: text().notNull().check('valid_status', ['active', 'inactive', 'banned']),
 * ```
 *
 * @remarks
 * **Dialect Support:**
 * | Dialect     | Builder          | Notes                               |
 * |-------------|------------------|-------------------------------------|
 * | SQLite      | `sqlite-builder` | This builder                        |
 * | Turso       | `sqlite-builder` | Same builder, Turso extends SQLite  |
 * | PostgreSQL  | `pg-builder`     | Use pg-schema ColumnBuilder instead |
 * | MySQL       | `mysql-builder`  | Use mysql-schema instead            |
 */
export type SQLiteColumnBuilder<T, Config extends SQLiteColumnConfig<T> = SQLiteColumnConfig<T>> = Config & {
	/**
	 * Mark column as NOT NULL.
	 * @example name: text().notNull()
	 */
	notNull(): SQLiteColumnBuilder<T, Config & {
		$nullable: false;
	}>;
	/**
	 * Mark column as explicitly nullable (default behavior).
	 * @example bio: text().nullable()
	 */
	nullable(): SQLiteColumnBuilder<T, Config & {
		$nullable: true;
	}>;
	/**
	 * Set column default value.
	 *
	 * SQLite supports:
	 * - Literal values: strings, numbers, blobs
	 * - SQL expressions wrapped in parentheses
	 * - `CURRENT_TIMESTAMP`, `CURRENT_DATE`, `CURRENT_TIME`
	 *
	 * @param value - Default value (literal or DefaultValue helper)
	 * @example
	 * ```typescript
	 * status: text().default('active'),
	 * count: integer().default(0),
	 * createdAt: text({ mode: 'timestamp' }).default(SQLITE_DEFAULT.currentTimestamp()),
	 * ```
	 */
	default<V extends T | (() => T) | DefaultValue>(value: V): SQLiteColumnBuilder<T, Config & {
		$default: V;
	}>;
	/**
	 * Mark column as PRIMARY KEY.
	 *
	 * For INTEGER PRIMARY KEY, the column becomes an alias for the rowid.
	 * Use `.autoincrement()` after `.primaryKey()` for monotonic IDs.
	 *
	 * @example id: integer().primaryKey()
	 */
	primaryKey(): SQLiteColumnBuilder<T, Config & {
		$primaryKey: true;
	}>;
	/**
	 * Mark column as UNIQUE.
	 * @example email: text().unique()
	 */
	unique(): SQLiteColumnBuilder<T, Config & {
		$unique: true;
	}>;
	/**
	 * Add a foreign key reference.
	 *
	 * **Important:** Foreign keys must be enabled per-connection with
	 * `PRAGMA foreign_keys = ON` (disabled by default in SQLite).
	 *
	 * @param table - Referenced table name
	 * @param column - Referenced column name
	 * @param options - Optional ON DELETE/ON UPDATE actions
	 * @example
	 * ```typescript
	 * userId: integer().references('users', 'id', { onDelete: 'CASCADE' }),
	 * ```
	 *
	 * @remarks
	 * SQLite supports all 5 referential actions:
	 * CASCADE, RESTRICT, NO ACTION, SET NULL, SET DEFAULT
	 */
	references(table: string, column: string, options?: {
		onDelete?: "CASCADE" | "RESTRICT" | "NO ACTION" | "SET NULL" | "SET DEFAULT";
		onUpdate?: "CASCADE" | "RESTRICT" | "NO ACTION" | "SET NULL" | "SET DEFAULT";
	}): SQLiteColumnBuilder<T, Config>;
	/**
	 * Add CHECK constraint with enum-like values.
	 *
	 * Narrows the TypeScript type to the union of provided values.
	 * This is the SQLite equivalent of PostgreSQL ENUM types.
	 *
	 * @param name - Constraint name
	 * @param values - Allowed string values
	 * @example
	 * ```typescript
	 * status: text().check('valid_status', ['active', 'inactive', 'banned']),
	 * // TypeScript type: 'active' | 'inactive' | 'banned'
	 * ```
	 */
	check<const V extends readonly string[]>(name: string, values: V): SQLiteColumnBuilder<V[number], SQLiteColumnConfig<V[number]> & {
		$check: string;
		$checkName: string;
		$checkValues: V;
	}>;
	/**
	 * Add CHECK constraint that excludes specific values.
	 * @param name - Constraint name
	 * @param values - Disallowed string values
	 */
	checkNot<const V extends readonly string[]>(name: string, values: V): SQLiteColumnBuilder<T, Config & {
		$checkNot: string;
		$checkNotName: string;
		$checkNotValues: V;
	}>;
	/**
	 * Override the inferred TypeScript type for this column.
	 *
	 * @example
	 * ```typescript
	 * userId: text().$type<UserId>()
	 * amount: text({ mode: 'json' }).$type<{ currency: string; value: number }>()
	 * ```
	 */
	$type<U>(): SQLiteColumnBuilder<U, SQLiteColumnConfig<U>>;
	/**
	 * Add AUTOINCREMENT modifier (INTEGER PRIMARY KEY only).
	 *
	 * AUTOINCREMENT guarantees monotonically increasing rowids.
	 * Without it, SQLite may reuse deleted rowid values.
	 *
	 * @example id: integer().primaryKey().autoincrement()
	 *
	 * @remarks
	 * **Performance note:** AUTOINCREMENT uses an internal `sqlite_sequence` table
	 * and is slightly slower than plain INTEGER PRIMARY KEY. Only use when
	 * monotonic ordering is required.
	 */
	autoincrement(): SQLiteColumnBuilder<T, Config & {
		$autoincrement: true;
	}>;
	/**
	 * Set SQLite collation for text comparison and sorting.
	 *
	 * SQLite supports only 3 built-in collations:
	 * - `'BINARY'` (default) — byte-by-byte comparison
	 * - `'NOCASE'` — case-insensitive for ASCII characters
	 * - `'RTRIM'` — ignores trailing spaces
	 *
	 * @param collation - One of the 3 SQLite collations
	 * @example email: text().collate('NOCASE')
	 */
	collate(collation: "BINARY" | "NOCASE" | "RTRIM"): SQLiteColumnBuilder<T, Config & {
		$collate: string;
	}>;
	/**
	 * Add column comment (stored in schema metadata, not in SQLite itself).
	 * @param text - Comment text
	 */
	comment(text: string): SQLiteColumnBuilder<T, Config & {
		$comment: string;
	}>;
	/**
	 * Set tracking ID for rename detection during migrations.
	 * @param trackingId - Unique tracking identifier
	 */
	$id(trackingId: string): SQLiteColumnBuilder<T, Config & {
		$trackingId: string;
	}>;
};
/**
 * Create a bare SQLite column builder with the given type string.
 *
 * @param type - SQL type string (e.g., 'INTEGER', 'TEXT')
 * @returns SQLiteColumnBuilder with chainable methods
 *
 * @internal
 */
export declare function createSQLiteColumn<T>(type: string): SQLiteColumnBuilder<T>;
/**
 * Create a SQLite column builder with an optional explicit column name.
 *
 * @param type - SQL type string
 * @param columnName - Optional database column name (overrides property key)
 * @returns SQLiteColumnBuilder with chainable methods
 *
 * @internal
 */
export declare function createSQLiteColumnWithName<T>(type: string, columnName?: string): SQLiteColumnBuilder<T>;
/**
 * Creates an INTEGER column for SQLite.
 *
 * SQLite INTEGER is a 64-bit signed integer (range -9223372036854775808 to
 * 9223372036854775807). Returns `SQLiteColumnBuilder<number>`.
 *
 * @param columnName - Optional explicit database column name (overrides the
 *   property key used in the table definition)
 * @returns SQLiteColumnBuilder typed as `number`
 *
 * @example
 * ```typescript
 * import { sqliteTable, integer, boolean, unixTimestamp } from 'relq/sqlite-builder';
 *
 * const users = sqliteTable('users', {
 *   id: integer().primaryKey().autoincrement(),
 *   age: integer(),
 *   score: integer('score'),
 *   isActive: boolean().notNull().default(false),
 *   createdAt: unixTimestamp().notNull(),
 * });
 * ```
 *
 * @remarks
 * **Dialect Support:**
 * | Dialect     | Support          | Notes                                  |
 * |-------------|------------------|----------------------------------------|
 * | SQLite      | ✅ Full           | Native 64-bit signed integer           |
 * | Turso       | ✅ Full           | Same as SQLite (libSQL)                |
 * | PostgreSQL  | ❌ Use pg-builder | Use `integer()` from pg-schema         |
 * | CockroachDB | ❌ Use pg-builder | Use `integer()` from pg-schema         |
 * | Nile        | ❌ Use pg-builder | Use `integer()` from pg-schema         |
 * | AWS DSQL    | ❌ Use pg-builder | Use `integer()` from pg-schema         |
 * | MySQL       | ❌ Use mysql-builder | Use mysql-schema integer builder     |
 * | Xata        | ❌ N/A           | Uses Xata SDK column types             |
 *
 * @since 1.1.0
 * @see {@link int} alias for integer
 * @see {@link int2} alias for integer (SQLite ignores declared width)
 * @see {@link bigint} for explicit bigint TypeScript mapping
 * @see boolean from numeric-type.ts for boolean semantics
 * @see unixTimestamp from temporal-types.ts for Unix epoch seconds
 * @see unixTimestampMs from temporal-types.ts for Unix epoch milliseconds
 */
export declare function integer(columnName?: string): SQLiteColumnBuilder<number>;
/**
 * Alias for {@link integer}.
 *
 * @param columnName - Optional explicit database column name
 * @returns SQLiteColumnBuilder typed as `number`
 *
 * @example
 * ```typescript
 * const users = sqliteTable('users', {
 *   age: int(),
 * });
 * ```
 *
 * @since 1.1.0
 * @see {@link integer} for full documentation
 */
export declare const int: typeof integer;
/**
 * Alias for {@link integer}.
 *
 * In PostgreSQL, `int2` maps to SMALLINT (2-byte). In SQLite there is no
 * distinction — all integer types share the same 64-bit INTEGER storage
 * class. This alias is provided for migration convenience when porting
 * schemas from PostgreSQL.
 *
 * @param columnName - Optional explicit database column name
 * @returns SQLiteColumnBuilder typed as `number`
 *
 * @example
 * ```typescript
 * const products = sqliteTable('products', {
 *   priority: int2().notNull().default(0),
 * });
 * ```
 *
 * @since 1.1.0
 * @see {@link integer} for full documentation
 * @see {@link bigint} for explicit bigint TypeScript mapping
 */
export declare const int2: typeof integer;
/**
 * Creates an INTEGER column with a TypeScript `bigint` mapping.
 *
 * SQLite INTEGER is already a 64-bit signed integer, so there is no
 * difference in storage between `integer()` and `bigint()`. The only
 * distinction is the TypeScript type: `bigint()` returns
 * `SQLiteColumnBuilder<bigint>` so values are typed as JavaScript `bigint`
 * rather than `number`.
 *
 * Use this when working with values that exceed JavaScript's safe integer
 * range (`Number.MAX_SAFE_INTEGER`, 2^53 - 1) such as Twitter/X snowflake
 * IDs, Discord IDs, or other large external identifiers.
 *
 * @param columnName - Optional explicit database column name
 * @returns SQLiteColumnBuilder typed as `bigint`
 *
 * @example
 * ```typescript
 * const externalIds = sqliteTable('external_ids', {
 *   twitterId: bigint('twitter_id').notNull(),
 *   id: bigint().primaryKey(),
 * });
 * ```
 *
 * @remarks
 * **Dialect Support:**
 * | Dialect     | Support          | Notes                                  |
 * |-------------|------------------|----------------------------------------|
 * | SQLite      | ✅ Full           | INTEGER is already 64-bit              |
 * | Turso       | ✅ Full           | Same as SQLite (libSQL)                |
 * | PostgreSQL  | ❌ Use pg-builder | Use `bigint()` from pg-schema          |
 * | CockroachDB | ❌ Use pg-builder | Use `bigint()` from pg-schema          |
 * | MySQL       | ❌ Use mysql-builder | Use mysql-schema bigint builder      |
 *
 * @since 1.1.0
 * @see {@link integer} for standard number-typed integers
 */
export declare function bigint(columnName?: string): SQLiteColumnBuilder<bigint>;
/**
 * Creates a TEXT column for SQLite.
 *
 * SQLite stores all TEXT values as variable-length UTF-8 strings.
 * Returns `SQLiteColumnBuilder<string>`.
 *
 * @param columnName - Optional explicit database column name
 * @returns SQLiteColumnBuilder typed as `string`
 *
 * @example
 * ```typescript
 * import { sqliteTable, integer, text, json, timestamp } from 'relq/sqlite-builder';
 *
 * const users = sqliteTable('users', {
 *   id: integer().primaryKey().autoincrement(),
 *   name: text().notNull(),
 *   email: text('email_address').notNull().unique(),
 *   bio: text(),
 *   metadata: json<{ tags: string[] }>(),
 *   createdAt: timestamp().notNull(),
 * });
 * ```
 *
 * @remarks
 * **Dialect Support:**
 * | Dialect     | Support      | Notes                                        |
 * |-------------|--------------|----------------------------------------------|
 * | SQLite      | ✅ Full       | Native TEXT storage class                     |
 * | Turso       | ✅ Full       | Same as SQLite (libSQL superset)              |
 * | PostgreSQL  | ✅ Full       | Use pg-schema `text()` for native PG TEXT     |
 * | CockroachDB | ✅ Full       | PG-compatible TEXT                            |
 * | MySQL       | ⚠️ Variants   | TEXT (64 KB), MEDIUMTEXT, LONGTEXT            |
 * | Xata        | ❌ None       | Uses SDK column definitions                   |
 *
 * @since 1.1.0
 * @see {@link varchar} for length-annotated TEXT columns
 * @see {@link char} for fixed-length TEXT columns
 * @see json from numeric-type.ts for JSON semantics
 * @see timestamp from temporal-types.ts for ISO-8601 datetime
 * @see date from temporal-types.ts for date strings
 * @see time from temporal-types.ts for time strings
 */
export declare function text(columnName?: string): SQLiteColumnBuilder<string>;
/**
 * Creates a TEXT column annotated with an optional length constraint.
 *
 * SQLite ignores length constraints entirely — all TEXT values are stored as
 * variable-length UTF-8 strings regardless of any declared length. The length
 * is still recorded in the column metadata for:
 * - Schema documentation and readability
 * - Portable migration generation (e.g., pushing to PostgreSQL)
 * - Validation tooling that may enforce length at the application layer
 *
 * @typeParam T - String literal union type for compile-time value checking
 * @param arg1 - Column name or numeric length
 * @param arg2 - Numeric length when `arg1` is a column name
 * @returns SQLiteColumnBuilder for TEXT type with `$length` metadata
 *
 * @example
 * ```typescript
 * import { varchar } from 'relq/sqlite-builder';
 *
 * const email = varchar(255).notNull().unique();
 * const slug = varchar('url_slug');
 * const title = varchar('page_title', 120).notNull();
 * ```
 *
 * @remarks
 * **Dialect Support:**
 * | Dialect     | Support        | Notes                                     |
 * |-------------|----------------|-------------------------------------------|
 * | SQLite      | ⚠️ Affinity     | TEXT affinity; length metadata only        |
 * | Turso       | ⚠️ Affinity     | Same as SQLite                             |
 * | PostgreSQL  | ✅ Full         | Native VARCHAR(n)                          |
 * | MySQL       | ✅ Full         | Native VARCHAR (max 65,535 bytes)          |
 *
 * @since 1.1.0
 * @see {@link text} for plain TEXT columns
 * @see {@link char} for fixed-length character columns
 */
export declare function varchar<T extends string = string>(): SQLiteColumnBuilder<T>;
export declare function varchar<T extends string = string>(length: number): SQLiteColumnBuilder<T>;
export declare function varchar<T extends string = string>(columnName: string): SQLiteColumnBuilder<T>;
export declare function varchar<T extends string = string>(columnName: string, length: number): SQLiteColumnBuilder<T>;
/**
 * Creates a TEXT column annotated as a fixed-length character type.
 *
 * In PostgreSQL, CHAR(n) pads values with spaces to exactly `n` characters.
 * SQLite does **not** enforce or pad — CHAR is treated identically to TEXT.
 * The length is preserved in column metadata for documentation and portability.
 *
 * @param arg1 - Column name or numeric length
 * @param arg2 - Numeric length when `arg1` is a column name
 * @returns SQLiteColumnBuilder for TEXT type with `$length` metadata
 *
 * @example
 * ```typescript
 * import { char } from 'relq/sqlite-builder';
 *
 * const countryCode = char(2).notNull();
 * const currency = char('currency_code', 3).notNull();
 * ```
 *
 * @remarks
 * **Dialect Support:**
 * | Dialect     | Support        | Notes                                     |
 * |-------------|----------------|-------------------------------------------|
 * | SQLite      | ⚠️ Affinity     | TEXT affinity; no padding, length ignored  |
 * | Turso       | ⚠️ Affinity     | Same as SQLite                             |
 * | PostgreSQL  | ✅ Full         | Native CHAR(n), space-padded               |
 * | MySQL       | ✅ Full         | Native CHAR(n), space-padded (max 255)     |
 *
 * @since 1.1.0
 * @see {@link varchar} for variable-length character columns
 * @see {@link text} for plain TEXT columns
 */
export declare function char(): SQLiteColumnBuilder<string>;
export declare function char(length: number): SQLiteColumnBuilder<string>;
export declare function char(columnName: string): SQLiteColumnBuilder<string>;
export declare function char(columnName: string, length: number): SQLiteColumnBuilder<string>;
/**
 * Creates a REAL column (8-byte IEEE 754 double-precision floating point).
 *
 * SQLite REAL is always 8-byte double precision. Unlike PostgreSQL, there is
 * no separate single-precision (4-byte) float in SQLite -- every floating
 * point value uses 8 bytes of storage.
 *
 * @param columnName - Optional explicit database column name. When omitted the
 *   object property key is used as the column name.
 * @returns A {@link SQLiteColumnBuilder} typed as `number`
 *
 * @example
 * ```typescript
 * import { defineSQLiteTable } from 'relq/sqlite';
 * import { real } from 'relq/sqlite/column-types';
 *
 * const sensors = defineSQLiteTable('sensors', {
 *   // Column name derived from property key
 *   temperature: real(),
 *
 *   // Explicit column name
 *   humidity: real('relative_humidity'),
 *
 *   // With modifiers
 *   pressure: real().notNull().default(0),
 * });
 * ```
 *
 * @remarks
 * **Dialect Support:**
 * | Dialect      | Support    | Notes                                      |
 * |--------------|------------|--------------------------------------------|
 * | SQLite       | ✅ Full     | 8-byte IEEE 754 double                     |
 * | Turso        | ✅ Full     | Same as SQLite                             |
 * | PostgreSQL   | ❌ None     | Use pg-schema `real()` (4-byte) instead    |
 * | CockroachDB  | ❌ None     | Use pg-schema `real()` instead             |
 * | Nile         | ❌ None     | Use pg-schema `real()` instead             |
 * | AWS DSQL     | ❌ None     | Use pg-schema `real()` instead             |
 * | MySQL        | ❌ None     | Use mysql-schema `float()` instead         |
 * | PlanetScale  | ❌ None     | Use mysql-schema `float()` instead         |
 * | Xata         | ❌ None     | Use Xata SDK float column                  |
 *
 * **Storage details:**
 * - SQLite stores REAL as an 8-byte IEEE 754 floating-point number.
 * - Approximate range: +/-1.7976931348623157E+308
 * - Approximate precision: 15-17 significant decimal digits.
 * - Integer values that fit in a 64-bit signed integer may be stored
 *   as INTEGER internally by SQLite for efficiency (type affinity).
 *
 * @since 1.1.0
 * @see {@link float} for an alias of this function
 * @see {@link double} for an alias of this function
 * @see {@link doublePrecision} for an alias of this function
 * @see {@link decimal} for a semantic precision/scale helper (still REAL)
 */
export declare function real(): SQLiteColumnBuilder<number>;
export declare function real(columnName: string): SQLiteColumnBuilder<number>;
/**
 * Alias for {@link real}. Maps to REAL (8-byte double). In SQLite there is
 * no distinction between `float` and `double`.
 *
 * @param columnName - Optional explicit database column name
 * @returns A {@link SQLiteColumnBuilder} typed as `number`
 * @example temperature: float().notNull(),
 * @since 1.1.0
 * @see {@link real} for full documentation and dialect support table
 */
export declare const float: {
	(): SQLiteColumnBuilder<number>;
	(columnName: string): SQLiteColumnBuilder<number>;
};
/**
 * Alias for {@link real}. Maps to REAL (8-byte double). SQLite REAL is
 * already double precision, so `double` is identical to `real`.
 *
 * @param columnName - Optional explicit database column name
 * @returns A {@link SQLiteColumnBuilder} typed as `number`
 * @example magnitude: double().notNull(),
 * @since 1.1.0
 * @see {@link real} for full documentation and dialect support table
 */
export declare const double: {
	(): SQLiteColumnBuilder<number>;
	(columnName: string): SQLiteColumnBuilder<number>;
};
/**
 * Alias for {@link real}. Provided for PostgreSQL schema portability.
 * PostgreSQL `DOUBLE PRECISION` is 8-byte; SQLite `REAL` is also 8-byte.
 *
 * @param columnName - Optional explicit database column name
 * @returns A {@link SQLiteColumnBuilder} typed as `number`
 * @example variance: doublePrecision().notNull(),
 * @since 1.1.0
 * @see {@link real} for full documentation and dialect support table
 */
export declare const doublePrecision: {
	(): SQLiteColumnBuilder<number>;
	(columnName: string): SQLiteColumnBuilder<number>;
};
/**
 * Creates a REAL column with optional precision and scale metadata.
 *
 * **SQLite does not have an exact DECIMAL type.** Values declared as
 * `DECIMAL`, `NUMERIC`, or any type name containing those keywords receive
 * NUMERIC affinity, which SQLite may store as INTEGER or REAL depending on
 * the value. This function always emits `REAL` as the SQL type but
 * records `$precision` and `$scale` on the column config for documentation,
 * migration tooling, and cross-dialect schema comparison.
 *
 * If you need exact decimal arithmetic (e.g., for currency), store values
 * as INTEGER cents/minor-units instead.
 *
 * @param columnName - Optional explicit database column name
 * @param precision - Total number of significant digits (informational only)
 * @param scale - Digits after the decimal point (informational only)
 * @param options - Object with `precision` and `scale` fields
 * @returns A {@link SQLiteColumnBuilder} typed as `number`
 *
 * @example
 * ```typescript
 * import { defineSQLiteTable } from 'relq/sqlite';
 * import { decimal } from 'relq/sqlite/column-types';
 *
 * const products = defineSQLiteTable('products', {
 *   // No precision -- plain REAL
 *   score: decimal(),
 *
 *   // Precision only (informational)
 *   rating: decimal(5),
 *
 *   // Precision + scale (informational)
 *   price: decimal(10, 2),
 *
 *   // Explicit column name
 *   tax: decimal('tax_rate'),
 *
 *   // Column name + options
 *   rate: decimal('exchange_rate', { precision: 12, scale: 6 }),
 * });
 * ```
 *
 * @remarks
 * **Dialect Support:**
 * | Dialect      | Support       | Notes                                   |
 * |--------------|---------------|-----------------------------------------|
 * | SQLite       | ⚠️ Inexact     | Maps to REAL -- not exact decimal       |
 * | Turso        | ⚠️ Inexact     | Same as SQLite                          |
 * | PostgreSQL   | ❌ None        | Use pg-schema `decimal()` for exact     |
 * | CockroachDB  | ❌ None        | Use pg-schema `decimal()`               |
 * | Nile         | ❌ None        | Use pg-schema `decimal()`               |
 * | AWS DSQL     | ❌ None        | Use pg-schema `decimal()`               |
 * | MySQL        | ❌ None        | Use mysql-schema `decimal()` for exact  |
 * | PlanetScale  | ❌ None        | Use mysql-schema `decimal()`            |
 * | Xata         | ❌ None        | Use Xata SDK float column               |
 *
 * **Warning:** Because SQLite stores this as REAL (IEEE 754 double), values
 * like `0.1 + 0.2` will **not** equal `0.3` exactly. For financial data,
 * prefer storing amounts as INTEGER minor-units (e.g., cents).
 *
 * @since 1.1.0
 * @see {@link numeric} for an alias of this function
 * @see {@link real} for a plain REAL column without precision metadata
 */
export declare function decimal(): SQLiteColumnBuilder<number>;
export declare function decimal(precision: number): SQLiteColumnBuilder<number>;
export declare function decimal(precision: number, scale: number): SQLiteColumnBuilder<number>;
export declare function decimal(columnName: string): SQLiteColumnBuilder<number>;
export declare function decimal(columnName: string, options: {
	precision?: number;
	scale?: number;
}): SQLiteColumnBuilder<number>;
/**
 * Alias for {@link decimal}. Maps to REAL with optional informational
 * precision/scale metadata. Does **not** provide exact numeric storage.
 *
 * @returns A {@link SQLiteColumnBuilder} typed as `number`
 * @example score: numeric(5, 2).notNull(),
 * @since 1.1.0
 * @see {@link decimal} for full documentation and dialect support table
 */
export declare const numeric: {
	(): SQLiteColumnBuilder<number>;
	(precision: number): SQLiteColumnBuilder<number>;
	(precision: number, scale: number): SQLiteColumnBuilder<number>;
	(columnName: string): SQLiteColumnBuilder<number>;
	(columnName: string, options: {
		precision?: number;
		scale?: number;
	}): SQLiteColumnBuilder<number>;
};
/**
 * Creates a BLOB column for binary data storage in SQLite.
 *
 * BLOB (Binary Large Object) is one of the five SQLite storage classes and stores
 * arbitrary binary data exactly as input. Returns `SQLiteColumnBuilder<Buffer | Uint8Array>`.
 *
 * @param columnName - Optional explicit database column name
 * @returns SQLiteColumnBuilder typed as `Buffer | Uint8Array`
 *
 * @example
 * ```typescript
 * import { sqliteTable, integer, blob, jsonb } from 'relq/sqlite-builder';
 *
 * const files = sqliteTable('files', {
 *   id: integer().primaryKey().autoincrement(),
 *   avatar: blob().notNull(),
 *   attachment: blob('file_data'),
 *   metadata: jsonb<{ tags: string[] }>(),   // use jsonb() for typed JSON blobs
 * });
 * ```
 *
 * @remarks
 * **Dialect Support:**
 * | Dialect     | Support    | Notes                                       |
 * |-------------|------------|---------------------------------------------|
 * | SQLite      | ✅ Full     | Native BLOB storage class                   |
 * | Turso       | ✅ Full     | Same as SQLite (libSQL)                     |
 * | PostgreSQL  | ❌ None     | Use pg-schema `bytea()` for native BYTEA    |
 * | CockroachDB | ❌ None     | Use pg-schema `bytea()` / `bytes()` instead |
 * | MySQL       | ❌ None     | Use `binary()` / `varbinary()` instead      |
 * | Xata        | ❌ None     | Use Xata file attachments                   |
 *
 * @since 1.1.0
 * @see {@link bytea} for PostgreSQL-compatible naming alias
 * @see jsonb from numeric-type.ts for binary JSONB columns
 */
export declare function blob(columnName?: string): SQLiteColumnBuilder<Buffer | Uint8Array>;
/**
 * Alias for {@link blob} using PostgreSQL naming conventions.
 *
 * In PostgreSQL, `BYTEA` is the binary data type. This alias lets developers
 * who are familiar with PostgreSQL use the same name in SQLite schemas.
 * Creates a BLOB column typed as `Buffer | Uint8Array`.
 *
 * @param columnName - Optional database column name
 * @returns SQLiteColumnBuilder typed as `Buffer | Uint8Array`
 *
 * @example
 * ```typescript
 * import { bytea } from 'relq/sqlite-builder';
 *
 * // PostgreSQL-style naming in SQLite schema
 * fileContent: bytea('file_content').notNull(),
 * avatar: bytea(),
 * ```
 *
 * @remarks
 * **Dialect Support:**
 * | Dialect     | Support    | Notes                                       |
 * |-------------|------------|---------------------------------------------|
 * | SQLite      | ✅ Full     | Maps to BLOB storage class                  |
 * | Turso       | ✅ Full     | Same as SQLite (libSQL)                     |
 * | PostgreSQL  | ✅ Native   | Use pg-schema `bytea()` for native BYTEA    |
 * | CockroachDB | ✅ Native   | Use pg-schema `bytea()` for native BYTES    |
 *
 * @since 1.1.0
 * @see {@link blob} for the canonical BLOB column builder
 */
export declare function bytea(columnName?: string): SQLiteColumnBuilder<Buffer | Uint8Array>;
/**
 * Creates a column with NUMERIC type affinity.
 *
 * NUMERIC affinity is one of SQLite's 5 type affinities. When a value is inserted,
 * SQLite applies the following conversion rules in order:
 *
 * 1. If the value is NULL, it is stored as NULL.
 * 2. If the value looks like an integer (no decimal point, no exponent), store as INTEGER.
 * 3. If the value looks like a real number, store as REAL.
 * 4. If the value is a string that can be losslessly converted to INTEGER, store as INTEGER.
 * 5. If the value is a string that can be losslessly converted to REAL, store as REAL.
 * 6. Otherwise, store as TEXT.
 *
 * Because the runtime value may be any of INTEGER, REAL, or TEXT, the TypeScript
 * return type is `string | number` to cover all possible outcomes.
 *
 * @param columnName - Optional explicit database column name (defaults to the property key)
 * @returns SQLiteColumnBuilder typed as `string | number`
 *
 * @example
 * ```typescript
 * import { numeric } from 'relq/sqlite-schema';
 *
 * const measurements = defineSQLiteTable('measurements', {
 *   // Value could be stored as INTEGER, REAL, or TEXT depending on input
 *   reading: numeric('reading').notNull(),
 *
 *   // Without explicit column name (uses property key)
 *   score: numeric(),
 * });
 * ```
 *
 * @remarks
 * **Dialect Support:**
 * | Dialect     | Support    | Notes                                          |
 * |-------------|------------|------------------------------------------------|
 * | SQLite      | ✅ Native   | NUMERIC affinity, converts to INTEGER or REAL  |
 * | Turso       | ✅ Native   | Same as SQLite                                 |
 * | PostgreSQL  | ❌ None     | Use `numeric()` or `decimal()` from pg-schema  |
 * | CockroachDB | ❌ None     | Use pg-schema numeric types                    |
 * | Nile        | ❌ None     | Use pg-schema numeric types                    |
 * | AWS DSQL    | ❌ None     | Use pg-schema numeric types                    |
 * | MySQL       | ❌ None     | Use mysql-schema numeric types                 |
 * | PlanetScale | ❌ None     | Use mysql-schema numeric types                 |
 * | Xata        | ❌ None     | Uses SDK column types                          |
 *
 * **STRICT mode warning:** NUMERIC is NOT a valid type name in SQLite STRICT
 * tables. STRICT tables only allow INTEGER, REAL, TEXT, BLOB, and ANY. If you
 * need STRICT mode compatibility, use `integer()`, `real()`, or `text()` instead.
 *
 * @since 1.1.0
 * @see {@link boolean} for INTEGER columns with boolean semantics
 * @see {@link json} for TEXT columns storing JSON data
 * @see https://www.sqlite.org/datatype3.html#type_affinity
 */
export declare const numericAffinity: (columnName?: string) => SQLiteColumnBuilder<string | number>;
/**
 * Creates an INTEGER column with boolean semantics.
 *
 * SQLite has no native BOOLEAN type. This convenience builder creates an INTEGER
 * column and sets `$mode: 'boolean'` so the ORM maps values between the database
 * representation (0 and 1) and the TypeScript type (`boolean`).
 *
 * - On write: `true` is stored as `1`, `false` is stored as `0`.
 * - On read: `0` is mapped to `false`, any non-zero integer to `true`.
 *
 * @param columnName - Optional explicit database column name (defaults to the property key)
 * @returns SQLiteColumnBuilder typed as `boolean`
 *
 * @example
 * ```typescript
 * import { boolean } from 'relq/sqlite-schema';
 *
 * const users = defineSQLiteTable('users', {
 *   // Stored as INTEGER 0/1, typed as boolean in TypeScript
 *   isActive: boolean('is_active').notNull().default(true),
 *
 *   // Without explicit column name
 *   emailVerified: boolean().default(false),
 * });
 *
 * // Insert usage
 * await db.insert(users).values({ isActive: true }); // stores 1
 *
 * // Select usage
 * const user = await db.select().from(users);
 * console.log(user.isActive); // true (boolean, not 1)
 * ```
 *
 * @remarks
 * **Dialect Support:**
 * | Dialect     | Support      | Notes                                      |
 * |-------------|--------------|-------------------------------------------|
 * | SQLite      | ✅ Emulated   | INTEGER 0/1 with boolean mapping          |
 * | Turso       | ✅ Emulated   | Same as SQLite                            |
 * | PostgreSQL  | ❌ None       | Use pg-schema `boolean()` (native BOOL)   |
 * | CockroachDB | ❌ None       | Use pg-schema `boolean()`                 |
 * | Nile        | ❌ None       | Use pg-schema `boolean()`                 |
 * | AWS DSQL    | ❌ None       | Use pg-schema `boolean()`                 |
 * | MySQL       | ❌ None       | Use mysql-schema `boolean()` (TINYINT(1)) |
 * | PlanetScale | ❌ None       | Use mysql-schema `boolean()`              |
 * | Xata        | ❌ None       | Uses SDK bool column type                 |
 *
 * **Note:** SQLite treats any non-zero integer as truthy. The ORM normalizes
 * reads to strict `true`/`false`, but raw SQL queries may return `0`/`1`.
 *
 * @since 1.1.0
 * @see {@link https://www.sqlite.org/datatype3.html} for SQLite type affinity rules
 */
export declare function boolean(columnName?: string): SQLiteColumnBuilder<boolean>;
/**
 * Creates a TEXT column for storing UUID strings.
 *
 * SQLite has no native UUID type. This builder creates a TEXT column suitable
 * for storing UUID values as 36-character hyphenated strings (e.g.,
 * `'550e8400-e29b-41d4-a716-446655440000'`).
 *
 * For generating UUIDs within SQLite, use the expression:
 * ```sql
 * lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' ||
 *   substr(hex(randomblob(2)),2) || '-' ||
 *   substr('89ab', abs(random()) % 4 + 1, 1) ||
 *   substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6)))
 * ```
 * Or more simply (non-standard format): `lower(hex(randomblob(16)))`
 *
 * @param columnName - Optional explicit database column name (defaults to the property key)
 * @returns SQLiteColumnBuilder typed as `string`
 *
 * @example
 * ```typescript
 * import { uuid } from 'relq/sqlite-schema';
 *
 * const users = defineSQLiteTable('users', {
 *   // UUID primary key
 *   id: uuid('id').primaryKey().notNull(),
 *
 *   // Foreign key referencing a UUID column
 *   orgId: uuid('org_id').references('organizations', 'id'),
 * });
 * ```
 *
 * @remarks
 * **Dialect Support:**
 * | Dialect     | Support      | Notes                                      |
 * |-------------|--------------|-------------------------------------------|
 * | SQLite      | ✅ TEXT       | Stored as 36-char TEXT string              |
 * | Turso       | ✅ TEXT       | Same as SQLite                            |
 * | PostgreSQL  | ❌ None       | Use pg-schema `uuid()` (native UUID type) |
 * | CockroachDB | ❌ None       | Use pg-schema `uuid()`                    |
 * | Nile        | ❌ None       | Use pg-schema `uuid()`                    |
 * | AWS DSQL    | ❌ None       | Use pg-schema `uuid()`                    |
 * | MySQL       | ❌ None       | Use mysql-schema `varchar(36)`            |
 * | PlanetScale | ❌ None       | Use mysql-schema `varchar(36)`            |
 * | Xata        | ❌ None       | Uses SDK string column type               |
 *
 * **Performance tip:** For UUID primary keys in SQLite, consider storing as
 * a 16-byte BLOB instead of TEXT for reduced storage and faster comparisons.
 * Use `blob()` with a custom `$type<string>()` override if needed.
 *
 * @since 1.1.0
 * @see {@link json} for JSON data stored as TEXT
 */
export declare const uuid: (columnName?: string) => SQLiteColumnBuilder<string>;
/**
 * Creates a TEXT column with JSON mode for storing structured data.
 *
 * This is a convenience builder equivalent to `text({ mode: 'json' })`. The
 * column stores JSON-encoded strings in a TEXT field, and the ORM automatically
 * serializes/deserializes between the JSON string and the TypeScript type `T`.
 *
 * SQLite 3.38.0+ provides `json_valid()` for validation and a suite of JSON
 * functions (`json_extract()`, `json_set()`, `json_array()`, etc.) that operate
 * directly on JSON text.
 *
 * @template T - The TypeScript type of the deserialized JSON value. Defaults to `unknown`.
 * @param columnName - Optional explicit database column name (defaults to the property key)
 * @returns SQLiteColumnBuilder typed as `T`
 *
 * @example
 * ```typescript
 * import { json } from 'relq/sqlite-schema';
 *
 * interface UserPreferences {
 *   theme: 'light' | 'dark';
 *   locale: string;
 *   notifications: boolean;
 * }
 *
 * const users = defineSQLiteTable('users', {
 *   // Typed JSON column
 *   preferences: json<UserPreferences>('preferences')
 *     .notNull()
 *     .default({ theme: 'light', locale: 'en', notifications: true }),
 *
 *   // Untyped JSON (defaults to unknown)
 *   metadata: json('metadata'),
 * });
 *
 * // Query with json_extract in raw SQL:
 * // SELECT json_extract(preferences, '$.theme') FROM users
 * ```
 *
 * @remarks
 * **Dialect Support:**
 * | Dialect     | Support      | Notes                                         |
 * |-------------|--------------|-----------------------------------------------|
 * | SQLite      | ✅ TEXT       | JSON1 extension (bundled since 3.38.0)        |
 * | Turso       | ✅ TEXT       | Same as SQLite, JSON1 always available        |
 * | PostgreSQL  | ❌ None       | Use pg-schema `json()` or `jsonb()`           |
 * | CockroachDB | ❌ None       | Use pg-schema `jsonb()`                       |
 * | Nile        | ❌ None       | Use pg-schema `jsonb()`                       |
 * | AWS DSQL    | ❌ None       | Use pg-schema `jsonb()`                       |
 * | MySQL       | ❌ None       | Use mysql-schema `json()` (native JSON type)  |
 * | PlanetScale | ❌ None       | Use mysql-schema `json()`                     |
 * | Xata        | ❌ None       | Uses SDK JSON column type                     |
 *
 * **Validation:** Use `CHECK(json_valid(column_name))` to enforce valid JSON at
 * the database level (requires SQLite 3.38.0+).
 *
 * @since 1.1.0
 * @see {@link jsonb} for binary JSON storage (SQLite 3.45+)
 * @see {@link https://www.sqlite.org/json1.html} for SQLite JSON functions
 */
export declare function json<T = unknown>(columnName?: string): SQLiteColumnBuilder<T>;
/**
 * Creates a BLOB column with binary JSON (JSONB) mode.
 *
 * SQLite 3.45.0+ introduced a binary JSON representation (JSONB) that stores
 * JSON in a more compact binary format within a BLOB column. This is more
 * efficient for large JSON documents because SQLite does not need to re-parse
 * the JSON text on every access.
 *
 * - On write: the ORM serializes the value to a JSON string, then SQLite
 *   converts it to JSONB internally via `jsonb()`.
 * - On read: SQLite converts JSONB back to a JSON text string, and the ORM
 *   deserializes it to type `T`.
 *
 * @template T - The TypeScript type of the deserialized JSON value. Defaults to `unknown`.
 * @param columnName - Optional explicit database column name (defaults to the property key)
 * @returns SQLiteColumnBuilder typed as `T`
 *
 * @example
 * ```typescript
 * import { jsonb } from 'relq/sqlite-schema';
 *
 * interface AuditLog {
 *   action: string;
 *   changes: Record<string, unknown>;
 *   timestamp: number;
 * }
 *
 * const events = defineSQLiteTable('events', {
 *   // Binary JSON for large documents
 *   payload: jsonb<AuditLog>('payload').notNull(),
 *
 *   // Untyped JSONB (defaults to unknown)
 *   rawData: jsonb('raw_data'),
 * });
 * ```
 *
 * @remarks
 * **Dialect Support:**
 * | Dialect     | Support      | Notes                                         |
 * |-------------|--------------|-----------------------------------------------|
 * | SQLite      | ✅ BLOB       | Requires SQLite 3.45.0+ (2024-01-15)         |
 * | Turso       | ✅ BLOB       | Requires libsql with JSONB support            |
 * | PostgreSQL  | ❌ None       | Use pg-schema `jsonb()` (native JSONB type)   |
 * | CockroachDB | ❌ None       | Use pg-schema `jsonb()`                       |
 * | Nile        | ❌ None       | Use pg-schema `jsonb()`                       |
 * | AWS DSQL    | ❌ None       | Use pg-schema `jsonb()`                       |
 * | MySQL       | ❌ None       | Use mysql-schema `json()` (binary internally) |
 * | PlanetScale | ❌ None       | Use mysql-schema `json()`                     |
 * | Xata        | ❌ None       | Uses SDK JSON column type                     |
 *
 * **Version requirement:** SQLite 3.45.0 or later is required. Using JSONB
 * functions on older versions will produce a runtime error. Check your SQLite
 * version with `SELECT sqlite_version()`.
 *
 * **When to use JSONB over JSON:**
 * - Large JSON documents (JSONB avoids repeated parsing)
 * - Frequent reads with `json_extract()` on JSONB columns
 * - Storage size is slightly smaller for JSONB
 *
 * **When to use JSON (TEXT) instead:**
 * - Need human-readable storage (BLOB is opaque)
 * - Must support SQLite versions older than 3.45.0
 * - Document size is small (parsing overhead is negligible)
 *
 * @since 1.1.0
 * @see {@link json} for text-based JSON storage (all SQLite versions)
 * @see {@link https://www.sqlite.org/jsonb.html} for SQLite JSONB documentation
 */
export declare function jsonb<T = unknown>(columnName?: string): SQLiteColumnBuilder<T>;
/**
 * Creates a TEXT column storing ISO-8601 datetime strings, typed as `Date`.
 *
 * Stores values like `'2026-01-29 12:00:00'` in a TEXT column.
 * The TypeScript type is `Date` — the ORM handles conversion between
 * `Date` objects and ISO-8601 strings.
 *
 * @param columnName - Optional explicit database column name
 * @returns SQLiteColumnBuilder typed as `Date`
 *
 * @example
 * ```typescript
 * import { sqliteTable, integer, text, timestamp, SQLITE_DEFAULT } from 'relq/sqlite-builder';
 *
 * export const users = sqliteTable('users', {
 *   id: integer().primaryKey().autoincrement(),
 *   createdAt: timestamp().notNull().default(SQLITE_DEFAULT.currentTimestamp()),
 *   updatedAt: timestamp(),
 *   deletedAt: timestamp(),
 * });
 * ```
 *
 * @remarks
 * **Storage:** TEXT column, ISO-8601 format (`'YYYY-MM-DD HH:MM:SS'`)
 *
 * **Dialect Support:**
 * | Dialect     | Support    | Notes                                    |
 * |-------------|------------|------------------------------------------|
 * | SQLite      | ✅ Full     | TEXT with ISO-8601 strings               |
 * | Turso       | ✅ Full     | Same as SQLite (libSQL)                  |
 * | PostgreSQL  | ❌ None     | Use pg-schema `timestamp()` (native)     |
 * | MySQL       | ❌ None     | Use mysql-schema `datetime()`            |
 *
 * @since 1.1.0
 * @see {@link unixTimestamp} for integer-based Unix epoch seconds
 * @see {@link unixTimestampMs} for integer-based Unix epoch milliseconds
 * @see {@link date} for date-only strings
 * @see {@link time} for time-only strings
 */
export declare function timestamp(columnName?: string): SQLiteColumnBuilder<Date>;
/**
 * Creates a TEXT column storing ISO-8601 date strings, typed as `Date`.
 *
 * Stores values like `'2026-01-29'` in a TEXT column.
 * The TypeScript type is `Date` — the ORM handles conversion.
 *
 * @param columnName - Optional explicit database column name
 * @returns SQLiteColumnBuilder typed as `Date`
 *
 * @example
 * ```typescript
 * import { sqliteTable, integer, date, SQLITE_DEFAULT } from 'relq/sqlite-builder';
 *
 * export const events = sqliteTable('events', {
 *   id: integer().primaryKey().autoincrement(),
 *   eventDate: date().notNull(),
 *   registrationDeadline: date('registration_deadline'),
 * });
 * ```
 *
 * @remarks
 * **Storage:** TEXT column, ISO-8601 date format (`'YYYY-MM-DD'`)
 *
 * **Dialect Support:**
 * | Dialect     | Support    | Notes                                    |
 * |-------------|------------|------------------------------------------|
 * | SQLite      | ✅ Full     | TEXT with ISO-8601 date strings          |
 * | Turso       | ✅ Full     | Same as SQLite (libSQL)                  |
 * | PostgreSQL  | ❌ None     | Use pg-schema `date()` (native DATE)     |
 * | MySQL       | ❌ None     | Use mysql-schema `date()` (native DATE)  |
 *
 * @since 1.1.0
 * @see {@link timestamp} for full datetime strings
 * @see {@link time} for time-only strings
 */
export declare function date(columnName?: string): SQLiteColumnBuilder<Date>;
/**
 * Creates a TEXT column storing ISO-8601 time strings, typed as `string`.
 *
 * Stores values like `'14:30:00'` in a TEXT column.
 * Typed as `string` (not `Date`) because JavaScript `Date` always
 * carries a date component — a bare time string is more practical.
 *
 * @param columnName - Optional explicit database column name
 * @returns SQLiteColumnBuilder typed as `string`
 *
 * @example
 * ```typescript
 * import { sqliteTable, integer, time } from 'relq/sqlite-builder';
 *
 * export const schedules = sqliteTable('schedules', {
 *   id: integer().primaryKey().autoincrement(),
 *   startTime: time().notNull(),
 *   endTime: time('end_time').notNull(),
 * });
 * ```
 *
 * @remarks
 * **Storage:** TEXT column, ISO-8601 time format (`'HH:MM:SS'`)
 *
 * **Dialect Support:**
 * | Dialect     | Support    | Notes                                    |
 * |-------------|------------|------------------------------------------|
 * | SQLite      | ✅ Full     | TEXT with ISO-8601 time strings          |
 * | Turso       | ✅ Full     | Same as SQLite (libSQL)                  |
 * | PostgreSQL  | ❌ None     | Use pg-schema `time()` (native TIME)     |
 * | MySQL       | ❌ None     | Use mysql-schema `time()` (native TIME)  |
 *
 * @since 1.1.0
 * @see {@link timestamp} for full datetime strings
 * @see {@link date} for date-only strings
 */
export declare function time(columnName?: string): SQLiteColumnBuilder<string>;
/**
 * Creates an INTEGER column storing Unix epoch seconds, typed as `Date`.
 *
 * Stores the number of seconds since 1970-01-01 00:00:00 UTC as an integer.
 * The TypeScript type is `Date` — the ORM converts via `new Date(value * 1000)`.
 *
 * @param columnName - Optional explicit database column name
 * @returns SQLiteColumnBuilder typed as `Date`
 *
 * @example
 * ```typescript
 * import { sqliteTable, integer, unixTimestamp, SQLITE_DEFAULT } from 'relq/sqlite-builder';
 *
 * export const sessions = sqliteTable('sessions', {
 *   id: integer().primaryKey().autoincrement(),
 *   createdAt: unixTimestamp().notNull().default(SQLITE_DEFAULT.unixEpoch()),
 *   expiresAt: unixTimestamp('expires_at').notNull(),
 * });
 * ```
 *
 * @remarks
 * **Storage:** INTEGER column, Unix epoch seconds
 * **Conversion:** `Date → Math.floor(date.getTime() / 1000)` / `value → new Date(value * 1000)`
 *
 * **Dialect Support:**
 * | Dialect     | Support    | Notes                                    |
 * |-------------|------------|------------------------------------------|
 * | SQLite      | ✅ Full     | INTEGER with Unix epoch seconds          |
 * | Turso       | ✅ Full     | Same as SQLite (libSQL)                  |
 * | PostgreSQL  | ❌ None     | Use pg-schema `timestamp()` (native)     |
 * | MySQL       | ❌ None     | Use mysql-schema `timestamp()` (native)  |
 *
 * @since 1.1.0
 * @see {@link unixTimestampMs} for millisecond precision
 * @see {@link timestamp} for text-based ISO-8601 timestamps
 */
export declare function unixTimestamp(columnName?: string): SQLiteColumnBuilder<Date>;
/**
 * Creates an INTEGER column storing Unix epoch milliseconds, typed as `Date`.
 *
 * Stores the number of milliseconds since 1970-01-01 00:00:00 UTC as an integer.
 * The TypeScript type is `Date` — the ORM converts via `new Date(value)`.
 *
 * This matches JavaScript's native `Date.getTime()` resolution directly,
 * making it the most natural integer representation for JS/TS applications.
 *
 * @param columnName - Optional explicit database column name
 * @returns SQLiteColumnBuilder typed as `Date`
 *
 * @example
 * ```typescript
 * import { sqliteTable, integer, unixTimestampMs, SQLITE_DEFAULT } from 'relq/sqlite-builder';
 *
 * export const logs = sqliteTable('logs', {
 *   id: integer().primaryKey().autoincrement(),
 *   recordedAt: unixTimestampMs().notNull().default(SQLITE_DEFAULT.unixEpochMs()),
 *   processedAt: unixTimestampMs('processed_at'),
 * });
 * ```
 *
 * @remarks
 * **Storage:** INTEGER column, Unix epoch milliseconds
 * **Conversion:** `Date → date.getTime()` / `value → new Date(value)`
 *
 * **Dialect Support:**
 * | Dialect     | Support    | Notes                                    |
 * |-------------|------------|------------------------------------------|
 * | SQLite      | ✅ Full     | INTEGER with Unix epoch milliseconds     |
 * | Turso       | ✅ Full     | Same as SQLite (libSQL)                  |
 * | PostgreSQL  | ❌ None     | Use pg-schema `timestamp()` (native)     |
 * | MySQL       | ❌ None     | Use mysql-schema `timestamp()` (native)  |
 *
 * @since 1.1.0
 * @see {@link unixTimestamp} for second precision
 * @see {@link timestamp} for text-based ISO-8601 timestamps
 */
export declare function unixTimestampMs(columnName?: string): SQLiteColumnBuilder<Date>;
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
/**
 * Definition for a SQLite index.
 *
 * SQLite supports B-tree indexes only (no GIN, GiST, BRIN, etc.).
 * Partial indexes (WHERE clause) are supported since SQLite 3.8.0.
 *
 * @example
 * ```typescript
 * const idx: SQLiteIndexDefinition = {
 *     name: 'idx_users_email',
 *     columns: [
 *         { name: 'email', direction: 'ASC' },
 *     ],
 *     unique: true,
 * };
 * ```
 *
 * @remarks
 * **Dialect Support:**
 * | Dialect     | Support | Notes                                    |
 * |-------------|---------|------------------------------------------|
 * | SQLite      | Full    | B-tree indexes only                      |
 * | Turso       | Full    | Same as SQLite                           |
 * | PostgreSQL  | N/A     | Use pg-schema IndexDefinition instead    |
 * | MySQL       | N/A     | Use mysql-schema instead                 |
 *
 * @since 1.1.0
 */
export interface SQLiteIndexDefinition {
	/** Index name. Auto-generated if not provided in sqliteTable(). */
	name: string;
	/**
	 * Columns included in the index.
	 * Each column can optionally specify a sort direction or be an expression.
	 */
	columns: Array<{
		/** Column name */
		name: string;
		/** Sort direction for this column in the index (default: ASC) */
		direction?: "ASC" | "DESC";
		/** Raw SQL expression instead of column name (e.g., 'lower(email)') */
		expression?: string;
	}>;
	/** Whether this is a UNIQUE index */
	unique?: boolean;
	/**
	 * Partial index WHERE clause.
	 * Only rows matching this condition are included in the index.
	 *
	 * @example 'is_active = 1'
	 * @see https://www.sqlite.org/partialindex.html
	 */
	where?: string;
	/** Use CREATE INDEX IF NOT EXISTS */
	ifNotExists?: boolean;
}
/**
 * Foreign key constraint definition for SQLite tables.
 *
 * SQLite supports all five referential actions and DEFERRABLE constraints.
 * Foreign keys must be enabled per-connection with `PRAGMA foreign_keys = ON`.
 *
 * @example
 * ```typescript
 * const fk: SQLiteForeignKeyDef = {
 *     columns: ['user_id'],
 *     references: { table: 'users', columns: ['id'] },
 *     onDelete: 'CASCADE',
 *     deferrable: true,
 *     initiallyDeferred: true,
 * };
 * ```
 *
 * @remarks
 * **Important:** Foreign keys are disabled by default in SQLite. Run
 * `PRAGMA foreign_keys = ON` at the start of each connection.
 *
 * @since 1.1.0
 */
export interface SQLiteForeignKeyDef {
	/** Local columns that form the foreign key */
	columns: string[];
	/** Referenced table and columns */
	references: {
		table: string;
		columns: string[];
	};
	/** Action on referenced row deletion */
	onDelete?: "CASCADE" | "RESTRICT" | "NO ACTION" | "SET NULL" | "SET DEFAULT";
	/** Action on referenced row update */
	onUpdate?: "CASCADE" | "RESTRICT" | "NO ACTION" | "SET NULL" | "SET DEFAULT";
	/**
	 * Whether the constraint is deferrable.
	 * When true, constraint checking can be postponed until transaction commit.
	 */
	deferrable?: boolean;
	/**
	 * Whether the constraint is initially deferred.
	 * Only applies when `deferrable` is true.
	 * When true, the constraint is not checked until COMMIT.
	 */
	initiallyDeferred?: boolean;
	/** Optional constraint name (used in schema metadata, not in SQLite DDL) */
	name?: string;
}
/**
 * Configuration accepted by {@link sqliteTable} for creating SQLite table definitions.
 *
 * This is the options interface passed as the third argument to `sqliteTable()`.
 * It covers all SQLite-specific table features including STRICT mode,
 * WITHOUT ROWID, composite constraints, and indexes.
 *
 * @template T - Record of column names to SQLiteColumnConfig
 *
 * @example
 * ```typescript
 * // STRICT table with composite primary key
 * const config: SQLiteTableConfig<typeof cols> = {
 *     $name: 'user_roles',
 *     $columns: cols,
 *     $primaryKey: ['user_id', 'role_id'],
 *     $strict: true,
 * };
 * ```
 *
 * @since 1.1.0
 */
export interface SQLiteTableConfig<T extends Record<string, SQLiteColumnConfig> = Record<string, SQLiteColumnConfig>> {
	/** SQL table name */
	$name: string;
	/** Column definitions */
	$columns: T;
	/**
	 * Composite primary key column names.
	 * Use this for multi-column primary keys. For single-column PKs,
	 * prefer the `.primaryKey()` chain on the column definition.
	 */
	$primaryKey?: string[];
	/**
	 * Table-level UNIQUE constraints (composite or named).
	 * For single-column UNIQUE, prefer `.unique()` on the column.
	 */
	$uniqueConstraints?: Array<{
		columns: string[];
		name?: string;
	}>;
	/**
	 * Table-level CHECK constraints.
	 * For column-level CHECK, prefer `.check()` on the column builder.
	 */
	$checkConstraints?: Array<{
		expression: string;
		name?: string;
	}>;
	/**
	 * Table-level foreign key constraints (composite or named).
	 * For single-column FKs, prefer `.references()` on the column builder.
	 */
	$foreignKeys?: SQLiteForeignKeyDef[];
	/** Index definitions for the table */
	$indexes?: SQLiteIndexDefinition[];
	/**
	 * Create a STRICT table (SQLite 3.37+).
	 *
	 * STRICT tables enforce column type checking at runtime. Without STRICT,
	 * SQLite allows any value in any column regardless of declared type.
	 * With STRICT, only values matching the column's type affinity are accepted.
	 *
	 * Allowed STRICT types: INTEGER, REAL, TEXT, BLOB, ANY
	 *
	 * @see https://www.sqlite.org/stricttables.html
	 * @default false
	 */
	$strict?: boolean;
	/**
	 * Create a WITHOUT ROWID table.
	 *
	 * WITHOUT ROWID tables use a clustered index on the PRIMARY KEY
	 * instead of the implicit rowid. This is beneficial for:
	 * - Tables with non-integer primary keys
	 * - Tables where the PK is the only index needed
	 * - Tables with small rows (saves 8 bytes per row from rowid)
	 *
	 * **Restrictions:**
	 * - Must have an explicit PRIMARY KEY
	 * - Cannot use AUTOINCREMENT
	 * - Cannot use the rowid alias
	 *
	 * @see https://www.sqlite.org/withoutrowid.html
	 * @default false
	 */
	$withoutRowid?: boolean;
	/**
	 * Create a TEMPORARY (TEMP) table.
	 * Temporary tables are only visible to the connection that created them
	 * and are automatically dropped when the connection closes.
	 *
	 * @default false
	 */
	$temporary?: boolean;
	/**
	 * Use CREATE TABLE IF NOT EXISTS.
	 * When true, the table creation is idempotent.
	 *
	 * @default false
	 */
	$ifNotExists?: boolean;
	/**
	 * Tracking ID for rename detection during migrations.
	 * Auto-generated during pull/import if not present.
	 *
	 * @example 't1a2b3'
	 */
	$trackingId?: string;
	/**
	 * Table comment/description.
	 * Stored in schema metadata only (SQLite has no native COMMENT support).
	 */
	$comment?: string;
}
/**
 * The fully-resolved table definition returned by {@link sqliteTable}.
 *
 * Extends SQLiteTableConfig with inferred SELECT/INSERT types and
 * a `toSQL()` method for generating the CREATE TABLE DDL.
 *
 * @template T - Record of column names to SQLiteColumnConfig
 *
 * @example
 * ```typescript
 * const users = sqliteTable('users', { ... });
 *
 * // Type inference
 * type UserSelect = typeof users.$inferSelect;
 * type UserInsert = typeof users.$inferInsert;
 *
 * // SQL generation
 * const ddl = users.toSQL();
 * ```
 *
 * @since 1.1.0
 */
export interface SQLiteTableDefinition<T extends Record<string, SQLiteColumnConfig> = Record<string, SQLiteColumnConfig>> extends SQLiteTableConfig<T> {
	/** Inferred TypeScript type for SELECT results */
	$inferSelect: SQLiteBuildSelectType<T>;
	/** Inferred TypeScript type for INSERT values */
	$inferInsert: SQLiteBuildInsertType<T>;
	/**
	 * Generate the CREATE TABLE SQL statement.
	 * @returns Complete SQLite CREATE TABLE DDL string
	 */
	toSQL(): string;
	/**
	 * Generate CREATE INDEX SQL statements for all indexes.
	 * @returns Array of CREATE INDEX DDL strings
	 */
	toCreateIndexSQL(): string[];
	/**
	 * Convert this table definition to the shared ParsedTable AST format.
	 *
	 * The AST is consumed by CLI tools (diff, generate, migrate, pull, push, etc.)
	 * for uniform schema comparison and migration generation across all dialects.
	 *
	 * @returns ParsedTable AST node
	 */
	toAST(): ParsedTable;
}
/**
 * Determine if a SQLite column has a default value.
 * Columns with defaults are optional in INSERT operations.
 */
export type SQLiteHasDefault<C> = C extends {
	$default: undefined;
} ? false : C extends {
	$default: infer D;
} ? D extends undefined ? false : true : false;
/**
 * Determine if a SQLite column has a generated expression.
 * Generated columns cannot be inserted into directly.
 */
export type SQLiteHasGenerated<C> = C extends {
	$generated: undefined;
} ? false : C extends {
	$generated: infer G;
} ? G extends undefined ? false : true : false;
/**
 * Determine if a SQLite column uses AUTOINCREMENT.
 * AUTOINCREMENT columns are optional in INSERT operations.
 */
export type SQLiteIsAutoincrement<C> = C extends {
	$autoincrement: true;
} ? true : false;
/**
 * Determine if a column is explicitly NOT NULL.
 * - `$nullable: false` means explicitly NOT NULL (via `.notNull()`)
 * - `$nullable: true` or `undefined` means nullable
 */
export type SQLiteIsNotNull<C> = C extends {
	$nullable: false;
} ? true : false;
/**
 * Determine if a column is a PRIMARY KEY.
 * PRIMARY KEY columns are implicitly NOT NULL.
 */
export type SQLiteIsPrimaryKey<C> = C extends {
	$primaryKey: true;
} ? true : false;
/**
 * Determine if a column is required in SELECT results.
 * Required when: NOT NULL, PRIMARY KEY, has DEFAULT, has GENERATED, or AUTOINCREMENT
 */
export type SQLiteIsRequiredForSelect<C> = SQLiteIsNotNull<C> extends true ? true : SQLiteIsPrimaryKey<C> extends true ? true : SQLiteHasDefault<C> extends true ? true : SQLiteHasGenerated<C> extends true ? true : SQLiteIsAutoincrement<C> extends true ? true : false;
/**
 * Determine if a column is required for INSERT.
 * Required when: (NOT NULL or PRIMARY KEY) AND no default/generated/autoincrement.
 */
export type SQLiteIsRequiredForInsert<C> = SQLiteHasDefault<C> extends true ? false : SQLiteHasGenerated<C> extends true ? false : SQLiteIsAutoincrement<C> extends true ? false : SQLiteIsNotNull<C> extends true ? true : SQLiteIsPrimaryKey<C> extends true ? true : false;
/**
 * Build the SELECT result type for a SQLite table.
 *
 * - Required columns (NOT NULL, PK, DEFAULT, GENERATED, AUTOINCREMENT) are non-optional
 * - Nullable columns without guarantees are optional and include `| null`
 *
 * @template T - Record of column names to SQLiteColumnConfig
 *
 * @example
 * ```typescript
 * // Given: { id: integer().primaryKey(), name: text() }
 * // Result: { id: number; name?: string | null }
 * ```
 *
 * @since 1.1.0
 */
export type SQLiteBuildSelectType<T extends Record<string, SQLiteColumnConfig>> = Simplify<{
	[K in keyof T as SQLiteIsRequiredForSelect<T[K]> extends true ? K : never]: T[K] extends SQLiteColumnConfig<infer U> ? T[K] extends {
		$nullable: true;
	} ? U | null : U : unknown;
} & {
	[K in keyof T as SQLiteIsRequiredForSelect<T[K]> extends true ? never : K]?: T[K] extends SQLiteColumnConfig<infer U> ? U | null : unknown;
}>;
/** Keys that are required in INSERT */
export type SQLiteRequiredInsertKeys<T extends Record<string, SQLiteColumnConfig>> = {
	[K in keyof T]: SQLiteIsRequiredForInsert<T[K]> extends true ? K : never;
}[keyof T];
/** Keys that are optional in INSERT */
export type SQLiteOptionalInsertKeys<T extends Record<string, SQLiteColumnConfig>> = {
	[K in keyof T]: SQLiteIsRequiredForInsert<T[K]> extends true ? never : K;
}[keyof T];
/** Infer the value type for a column in INSERT operations */
export type SQLiteInferInsertValue<C extends SQLiteColumnConfig> = C extends SQLiteColumnConfig<infer U> ? C extends {
	$nullable: true;
} ? U | null : U : unknown;
/**
 * Build the INSERT value type for a SQLite table.
 *
 * - Required columns (NOT NULL without DEFAULT/AUTOINCREMENT) are mandatory
 * - Optional columns (nullable, has DEFAULT, AUTOINCREMENT, GENERATED) are optional
 *
 * @template T - Record of column names to SQLiteColumnConfig
 *
 * @example
 * ```typescript
 * // Given: { id: integer().primaryKey().autoincrement(), name: text().notNull() }
 * // Result: { id?: number; name: string }
 * ```
 *
 * @since 1.1.0
 */
export type SQLiteBuildInsertType<T extends Record<string, SQLiteColumnConfig>> = Simplify<{
	[K in SQLiteRequiredInsertKeys<T>]: SQLiteInferInsertValue<T[K]>;
} & {
	[K in SQLiteOptionalInsertKeys<T>]?: SQLiteInferInsertValue<T[K]>;
}>;
/**
 * Infer the SELECT type from a SQLiteTableDefinition.
 * @template T - A SQLiteTableDefinition instance
 */
export type SQLiteInferSelectType<T extends SQLiteTableDefinition<any>> = T["$inferSelect"];
/**
 * Infer the INSERT type from a SQLiteTableDefinition.
 * @template T - A SQLiteTableDefinition instance
 */
export type SQLiteInferInsertType<T extends SQLiteTableDefinition<any>> = T["$inferInsert"];
/**
 * Infer the UPDATE type from a SQLiteTableDefinition.
 * All fields are optional (partial update).
 * @template T - A SQLiteTableDefinition instance
 */
export type SQLiteInferUpdateType<T extends SQLiteTableDefinition<any>> = Partial<T["$inferInsert"]>;
/** Simplify a type for cleaner hover information in editors */
export type Simplify<T> = {
	[K in keyof T]: T[K];
} & {};
/**
 * Define a SQLite table with full type inference for SELECT and INSERT operations.
 *
 * This is the primary factory function for creating SQLite table definitions.
 * It is the SQLite equivalent of the pg-schema `defineTable()` function,
 * simplified to support only SQLite-compatible features.
 *
 * @template T - Record of column names to SQLiteColumnConfig types, inferred from columns
 *
 * @param name - The SQL table name
 * @param columns - Column definitions created using SQLite column type functions
 *   (e.g., `integer()`, `text()`, `real()`, `blob()`)
 * @param options - Optional table configuration: constraints, indexes, STRICT, WITHOUT ROWID
 *
 * @returns A fully typed SQLiteTableDefinition with inferred SELECT and INSERT types
 *
 * @example
 * ```typescript
 * import { sqliteTable } from 'relq/sqlite-schema';
 * import { integer, text, real, blob } from 'relq/sqlite-schema/column-types';
 *
 * // Basic table
 * export const users = sqliteTable('users', {
 *     id: integer().primaryKey().autoincrement(),
 *     email: text().notNull().unique(),
 *     name: text(),
 *     createdAt: text({ mode: 'timestamp' }).notNull().default('CURRENT_TIMESTAMP'),
 * });
 *
 * // STRICT table (SQLite 3.37+) -- enforces type checking
 * export const products = sqliteTable('products', {
 *     id: integer().primaryKey(),
 *     name: text().notNull(),
 *     price: real().notNull(),
 *     data: blob(),
 * }, {
 *     strict: true,
 * });
 *
 * // WITHOUT ROWID table with composite primary key
 * export const userRoles = sqliteTable('user_roles', {
 *     userId: integer().notNull(),
 *     roleId: integer().notNull(),
 *     assignedAt: text({ mode: 'timestamp' }).notNull().default('CURRENT_TIMESTAMP'),
 * }, {
 *     primaryKey: ['userId', 'roleId'],
 *     withoutRowid: true,
 *     foreignKeys: [
 *         {
 *             columns: ['userId'],
 *             references: { table: 'users', columns: ['id'] },
 *             onDelete: 'CASCADE',
 *         },
 *         {
 *             columns: ['roleId'],
 *             references: { table: 'roles', columns: ['id'] },
 *             onDelete: 'CASCADE',
 *         },
 *     ],
 * });
 *
 * // Table with indexes and check constraints
 * export const orders = sqliteTable('orders', {
 *     id: integer().primaryKey().autoincrement(),
 *     userId: integer().notNull().references('users', 'id', { onDelete: 'CASCADE' }),
 *     total: real().notNull(),
 *     status: text().notNull().check('valid_status', ['pending', 'shipped', 'delivered']),
 * }, {
 *     indexes: [
 *         { name: 'idx_orders_user', columns: [{ name: 'userId' }] },
 *         { name: 'idx_orders_status', columns: [{ name: 'status' }], where: "status != 'delivered'" },
 *     ],
 *     checkConstraints: [
 *         { expression: 'total >= 0', name: 'positive_total' },
 *     ],
 * });
 *
 * // Type inference usage
 * type UserSelect = typeof users.$inferSelect;
 * // { id: number; email: string; name?: string | null; createdAt: Date }
 *
 * type UserInsert = typeof users.$inferInsert;
 * // { id?: number; email: string; name?: string | null; createdAt?: Date }
 * ```
 *
 * @remarks
 * **Dialect Support:**
 * | Dialect     | Support | Notes                                    |
 * |-------------|---------|------------------------------------------|
 * | SQLite      | Full    | Native support                           |
 * | Turso       | Full    | Compatible (libsql extends SQLite)       |
 * | PostgreSQL  | None    | Use pg-schema defineTable() instead      |
 * | CockroachDB | None    | Use pg-schema defineTable() instead      |
 * | Nile        | None    | Use pg-schema defineTable() instead      |
 * | AWS DSQL    | None    | Use pg-schema defineTable() instead      |
 * | MySQL       | None    | Use mysql-schema instead                 |
 * | PlanetScale | None    | Use mysql-schema instead                 |
 * | Xata        | None    | Use xata-schema instead                  |
 *
 * @throws {Error} When AUTOINCREMENT is used without INTEGER PRIMARY KEY
 * @throws {Error} When WITHOUT ROWID is used without an explicit PRIMARY KEY
 *
 * @since 1.1.0
 * @see {@link SQLiteTableDefinition} for the returned type
 * @see {@link generateSQLiteCreateTableSQL} for SQL generation details
 */
export declare function sqliteTable<T extends Record<string, SQLiteColumnConfig>>(name: string, columns: T, options?: {
	/** Composite primary key columns */
	primaryKey?: string[];
	/** Table-level UNIQUE constraints */
	uniqueConstraints?: SQLiteTableConfig<T>["$uniqueConstraints"];
	/** Table-level CHECK constraints */
	checkConstraints?: SQLiteTableConfig<T>["$checkConstraints"];
	/** Table-level foreign key constraints */
	foreignKeys?: SQLiteForeignKeyDef[];
	/** Index definitions */
	indexes?: SQLiteIndexDefinition[];
	/**
	 * Create a STRICT table (SQLite 3.37+).
	 * Enforces column type checking at runtime.
	 * @default false
	 */
	strict?: boolean;
	/**
	 * Create a WITHOUT ROWID table.
	 * Requires an explicit PRIMARY KEY. Cannot use AUTOINCREMENT.
	 * @default false
	 */
	withoutRowid?: boolean;
	/**
	 * Create a TEMPORARY table.
	 * Only visible to the current connection, dropped on close.
	 * @default false
	 */
	temporary?: boolean;
	/** Use CREATE TABLE IF NOT EXISTS */
	ifNotExists?: boolean;
	/** Table description (schema metadata only) */
	comment?: string;
	/** Tracking ID for rename detection during migrations */
	$trackingId?: string;
}): SQLiteTableDefinition<T>;
/**
 * Quote a SQLite identifier with double quotes.
 *
 * Escapes embedded double quotes by doubling them.
 *
 * @param name - Identifier to quote
 * @returns Quoted identifier string
 *
 * @example
 * ```typescript
 * quoteSQLiteIdentifier('users')       // → '"users"'
 * quoteSQLiteIdentifier('my "table"')  // → '"my ""table"""'
 * ```
 *
 * @since 1.1.0
 */
export declare function quoteSQLiteIdentifier(name: string): string;
/**
 * Generate a complete CREATE TABLE SQL statement from a SQLite table config.
 *
 * Handles all SQLite-specific features:
 * - Column definitions with types, constraints, defaults
 * - AUTOINCREMENT on INTEGER PRIMARY KEY
 * - Table-level composite PK, UNIQUE, CHECK, FOREIGN KEY constraints
 * - STRICT and WITHOUT ROWID table modifiers
 * - TEMPORARY tables
 * - IF NOT EXISTS
 * - Generated columns (VIRTUAL/STORED)
 *
 * @param config - SQLite table configuration (from sqliteTable())
 * @returns Complete CREATE TABLE SQL string
 *
 * @example
 * ```typescript
 * const sql = generateSQLiteCreateTableSQL({
 *     $name: 'users',
 *     $columns: {
 *         id: integer().primaryKey().autoincrement(),
 *         name: text().notNull(),
 *     },
 *     $strict: true,
 * });
 * // → CREATE TABLE "users" (\n  "id" INTEGER PRIMARY KEY AUTOINCREMENT, ...
 * ```
 *
 * @since 1.1.0
 */
export declare function generateSQLiteCreateTableSQL(config: SQLiteTableConfig): string;
/**
 * Generate CREATE INDEX SQL statements for all indexes in a table config.
 *
 * @param config - SQLite table configuration with `$indexes`
 * @returns Array of CREATE INDEX SQL strings (empty if no indexes defined)
 *
 * @example
 * ```typescript
 * const indexes = generateSQLiteIndexSQL({
 *     $name: 'users',
 *     $columns: { ... },
 *     $indexes: [
 *         { name: 'idx_email', columns: [{ name: 'email' }], unique: true },
 *         { name: 'idx_active', columns: [{ name: 'status' }], where: "status = 'active'" },
 *     ],
 * });
 * // → ['CREATE UNIQUE INDEX "idx_email" ON "users" ("email");', ...]
 * ```
 *
 * @since 1.1.0
 */
export declare function generateSQLiteIndexSQL(config: SQLiteTableConfig): string[];
/**
 * Collection of type-safe SQLite DEFAULT value helpers.
 *
 * Use these helpers to set column default values with proper SQLite SQL generation.
 * All expressions use SQLite-native syntax and functions.
 *
 * @example
 * ```typescript
 * // Timestamp defaults
 * createdAt: text().default(SQLITE_DEFAULT.currentTimestamp())
 *
 * // UUID defaults (randomblob-based)
 * id: text().default(SQLITE_DEFAULT.uuid())
 *
 * // JSON defaults
 * metadata: text().default(SQLITE_DEFAULT.emptyObject())
 *
 * // Boolean defaults (0/1)
 * isActive: integer().default(SQLITE_DEFAULT.true())
 * ```
 */
export declare const SQLITE_DEFAULT: {
	/**
	 * Current timestamp as an ISO-8601 string.
	 *
	 * @returns DefaultValue producing `CURRENT_TIMESTAMP`
	 *
	 * @example
	 * ```typescript
	 * createdAt: text().notNull().default(SQLITE_DEFAULT.currentTimestamp())
	 * ```
	 *
	 * @remarks Generates SQL: `DEFAULT CURRENT_TIMESTAMP`
	 * Produces a string like `'2026-01-29 12:00:00'` in UTC.
	 */
	readonly currentTimestamp: () => DefaultValue;
	/**
	 * Current date as an ISO-8601 date string.
	 *
	 * @returns DefaultValue producing `CURRENT_DATE`
	 *
	 * @example
	 * ```typescript
	 * eventDate: text().notNull().default(SQLITE_DEFAULT.currentDate())
	 * ```
	 *
	 * @remarks Generates SQL: `DEFAULT CURRENT_DATE`
	 * Produces a string like `'2026-01-29'` in UTC.
	 */
	readonly currentDate: () => DefaultValue;
	/**
	 * Current time as an ISO-8601 time string.
	 *
	 * @returns DefaultValue producing `CURRENT_TIME`
	 *
	 * @example
	 * ```typescript
	 * logTime: text().notNull().default(SQLITE_DEFAULT.currentTime())
	 * ```
	 *
	 * @remarks Generates SQL: `DEFAULT CURRENT_TIME`
	 * Produces a string like `'12:00:00'` in UTC.
	 */
	readonly currentTime: () => DefaultValue;
	/**
	 * Current datetime with an optional modifier.
	 *
	 * Uses SQLite's `datetime()` function which returns an ISO-8601 datetime string.
	 *
	 * @param modifier - Optional SQLite date modifier (e.g., `'localtime'`, `'+1 day'`, `'-30 minutes'`)
	 * @returns DefaultValue producing a `datetime('now')` or `datetime('now', modifier)` expression
	 *
	 * @example
	 * ```typescript
	 * // Current UTC datetime
	 * createdAt: text().default(SQLITE_DEFAULT.datetime())
	 *
	 * // Local time
	 * localCreatedAt: text().default(SQLITE_DEFAULT.datetime('localtime'))
	 *
	 * // One hour from now
	 * expiresAt: text().default(SQLITE_DEFAULT.datetime('+1 hour'))
	 * ```
	 *
	 * @remarks Generates SQL: `DEFAULT (datetime('now'))` or `DEFAULT (datetime('now', 'localtime'))`
	 */
	readonly datetime: (modifier?: string) => DefaultValue;
	/**
	 * Current date with an optional modifier.
	 *
	 * Uses SQLite's `date()` function which returns an ISO-8601 date string.
	 *
	 * @param modifier - Optional SQLite date modifier (e.g., `'localtime'`, `'+1 day'`, `'start of month'`)
	 * @returns DefaultValue producing a `date('now')` or `date('now', modifier)` expression
	 *
	 * @example
	 * ```typescript
	 * // Current UTC date
	 * today: text().default(SQLITE_DEFAULT.date())
	 *
	 * // Start of current month
	 * monthStart: text().default(SQLITE_DEFAULT.date('start of month'))
	 * ```
	 *
	 * @remarks Generates SQL: `DEFAULT (date('now'))` or `DEFAULT (date('now', 'start of month'))`
	 */
	readonly date: (modifier?: string) => DefaultValue;
	/**
	 * Current time with an optional modifier.
	 *
	 * Uses SQLite's `time()` function which returns an ISO-8601 time string.
	 *
	 * @param modifier - Optional SQLite time modifier (e.g., `'localtime'`, `'+2 hours'`)
	 * @returns DefaultValue producing a `time('now')` or `time('now', modifier)` expression
	 *
	 * @example
	 * ```typescript
	 * // Current UTC time
	 * logTime: text().default(SQLITE_DEFAULT.time())
	 *
	 * // Local time
	 * localTime: text().default(SQLITE_DEFAULT.time('localtime'))
	 * ```
	 *
	 * @remarks Generates SQL: `DEFAULT (time('now'))` or `DEFAULT (time('now', 'localtime'))`
	 */
	readonly time: (modifier?: string) => DefaultValue;
	/**
	 * Current Julian day number.
	 *
	 * Returns the number of days since the Julian epoch (noon on November 24, 4714 B.C.)
	 * as a floating-point value. Useful for precise date arithmetic.
	 *
	 * @returns DefaultValue producing a `julianday('now')` expression
	 *
	 * @example
	 * ```typescript
	 * julianDate: real().default(SQLITE_DEFAULT.julianDay())
	 * ```
	 *
	 * @remarks Generates SQL: `DEFAULT (julianday('now'))`
	 */
	readonly julianDay: () => DefaultValue;
	/**
	 * Current Unix epoch in seconds.
	 *
	 * Returns the number of seconds since 1970-01-01 00:00:00 UTC as an integer.
	 * Ideal for `integer({ mode: 'timestamp' })` columns.
	 *
	 * @returns DefaultValue producing a `unixepoch('now')` expression
	 *
	 * @example
	 * ```typescript
	 * createdAt: integer().default(SQLITE_DEFAULT.unixEpoch())
	 * ```
	 *
	 * @remarks Generates SQL: `DEFAULT (unixepoch('now'))`
	 * Requires SQLite 3.38.0+ (2022-02-22).
	 */
	readonly unixEpoch: () => DefaultValue;
	/**
	 * Current Unix epoch in milliseconds.
	 *
	 * Returns the number of milliseconds since 1970-01-01 00:00:00 UTC.
	 * Useful for JavaScript-friendly timestamps.
	 *
	 * @returns DefaultValue producing a `unixepoch('now') * 1000` expression
	 *
	 * @example
	 * ```typescript
	 * createdAtMs: integer().default(SQLITE_DEFAULT.unixEpochMs())
	 * ```
	 *
	 * @remarks Generates SQL: `DEFAULT (unixepoch('now') * 1000)`
	 * Requires SQLite 3.38.0+ (2022-02-22).
	 */
	readonly unixEpochMs: () => DefaultValue;
	/**
	 * Generate a random UUID v4 string.
	 *
	 * SQLite has no native UUID type or function. This assembles a valid UUID v4
	 * from `randomblob()` with the correct version (4) and variant bits (RFC 4122).
	 *
	 * @returns DefaultValue producing a UUID v4 expression using randomblob and hex
	 *
	 * @example
	 * ```typescript
	 * id: text().primaryKey().default(SQLITE_DEFAULT.uuid())
	 * ```
	 *
	 * @remarks Generates SQL:
	 * ```sql
	 * DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4'
	 *   || substr(lower(hex(randomblob(2))),2) || '-'
	 *   || substr('89ab',abs(random()) % 4 + 1, 1)
	 *   || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))))
	 * ```
	 * Produces a string like `'a1b2c3d4-e5f6-4a7b-8c9d-e0f1a2b3c4d5'`.
	 */
	readonly uuid: () => DefaultValue;
	/**
	 * Generate a random hex string of the specified byte length.
	 *
	 * Uses `randomblob()` and `hex()` to produce a lowercase hex string.
	 *
	 * @param bytes - Number of random bytes (output string length is bytes * 2)
	 * @returns DefaultValue producing a random hex expression
	 *
	 * @example
	 * ```typescript
	 * // 16-byte (32-char) random token
	 * token: text().default(SQLITE_DEFAULT.randomHex(16))
	 *
	 * // 8-byte (16-char) short ID
	 * shortId: text().default(SQLITE_DEFAULT.randomHex(8))
	 * ```
	 *
	 * @remarks Generates SQL: `DEFAULT (lower(hex(randomblob(16))))`
	 */
	readonly randomHex: (bytes: number) => DefaultValue;
	/**
	 * Random floating-point value between 0 and 1.
	 *
	 * SQLite's `random()` returns a signed 64-bit integer. This normalizes
	 * it to a float in the range [0, 1) by dividing by the maximum value.
	 *
	 * @returns DefaultValue producing a normalized random float expression
	 *
	 * @example
	 * ```typescript
	 * seed: real().default(SQLITE_DEFAULT.random())
	 * ```
	 *
	 * @remarks Generates SQL: `DEFAULT (abs(random()) / 9223372036854775807.0)`
	 */
	readonly random: () => DefaultValue;
	/**
	 * Random integer between 0 (inclusive) and max (exclusive).
	 *
	 * Uses modular arithmetic on SQLite's `random()` to produce a bounded integer.
	 *
	 * @param max - Upper bound (exclusive)
	 * @returns DefaultValue producing a bounded random integer expression
	 *
	 * @example
	 * ```typescript
	 * // Random integer 0-99
	 * shard: integer().default(SQLITE_DEFAULT.randomInt(100))
	 * ```
	 *
	 * @remarks Generates SQL: `DEFAULT (abs(random()) % 100)`
	 */
	readonly randomInt: (max: number) => DefaultValue;
	/**
	 * Empty JSON object `{}` as a TEXT default.
	 *
	 * @returns DefaultValue producing an empty JSON object string
	 *
	 * @example
	 * ```typescript
	 * metadata: text().default(SQLITE_DEFAULT.emptyObject())
	 * ```
	 *
	 * @remarks Generates SQL: `DEFAULT '{}'`
	 * SQLite stores JSON as plain TEXT. No `::jsonb` cast is used.
	 */
	readonly emptyObject: () => DefaultValue;
	/**
	 * Empty JSON array `[]` as a TEXT default.
	 *
	 * @returns DefaultValue producing an empty JSON array string
	 *
	 * @example
	 * ```typescript
	 * tags: text().default(SQLITE_DEFAULT.emptyArray())
	 * ```
	 *
	 * @remarks Generates SQL: `DEFAULT '[]'`
	 * SQLite stores JSON as plain TEXT. No `::jsonb` cast is used.
	 */
	readonly emptyArray: () => DefaultValue;
	/**
	 * Arbitrary JSON string as a TEXT default.
	 *
	 * Single quotes in the value are escaped by doubling them.
	 *
	 * @param value - JSON string value (e.g., `'{"key": "value"}'`)
	 * @returns DefaultValue producing an escaped JSON string literal
	 *
	 * @example
	 * ```typescript
	 * config: text().default(SQLITE_DEFAULT.json('{"theme": "dark"}'))
	 * ```
	 *
	 * @remarks Generates SQL: `DEFAULT '{"theme": "dark"}'`
	 */
	readonly json: (value: string) => DefaultValue;
	/**
	 * Boolean TRUE stored as integer 1.
	 *
	 * SQLite has no native boolean type. TRUE is conventionally stored as 1.
	 *
	 * @returns DefaultValue producing integer `1`
	 *
	 * @example
	 * ```typescript
	 * isActive: integer().default(SQLITE_DEFAULT.true())
	 * ```
	 *
	 * @remarks Generates SQL: `DEFAULT 1`
	 */
	readonly true: () => DefaultValue;
	/**
	 * Boolean FALSE stored as integer 0.
	 *
	 * SQLite has no native boolean type. FALSE is conventionally stored as 0.
	 *
	 * @returns DefaultValue producing integer `0`
	 *
	 * @example
	 * ```typescript
	 * isDeleted: integer().default(SQLITE_DEFAULT.false())
	 * ```
	 *
	 * @remarks Generates SQL: `DEFAULT 0`
	 */
	readonly false: () => DefaultValue;
	/**
	 * Explicit NULL default.
	 *
	 * @returns DefaultValue producing `NULL`
	 *
	 * @example
	 * ```typescript
	 * deletedAt: text().default(SQLITE_DEFAULT.null())
	 * ```
	 *
	 * @remarks Generates SQL: `DEFAULT NULL`
	 */
	readonly null: () => DefaultValue;
	/**
	 * Zero (0).
	 *
	 * @returns DefaultValue producing `0`
	 *
	 * @example
	 * ```typescript
	 * count: integer().default(SQLITE_DEFAULT.zero())
	 * ```
	 *
	 * @remarks Generates SQL: `DEFAULT 0`
	 */
	readonly zero: () => DefaultValue;
	/**
	 * One (1).
	 *
	 * @returns DefaultValue producing `1`
	 *
	 * @example
	 * ```typescript
	 * version: integer().default(SQLITE_DEFAULT.one())
	 * ```
	 *
	 * @remarks Generates SQL: `DEFAULT 1`
	 */
	readonly one: () => DefaultValue;
	/**
	 * Negative one (-1).
	 *
	 * @returns DefaultValue producing `-1`
	 *
	 * @example
	 * ```typescript
	 * sortOrder: integer().default(SQLITE_DEFAULT.negativeOne())
	 * ```
	 *
	 * @remarks Generates SQL: `DEFAULT -1`
	 */
	readonly negativeOne: () => DefaultValue;
	/**
	 * Create a string literal default with proper escaping.
	 *
	 * Single quotes in the value are escaped by doubling them, which is the
	 * standard SQL escaping mechanism used by SQLite.
	 *
	 * @param value - String value to use as the default
	 * @returns DefaultValue producing a properly escaped string literal
	 *
	 * @example
	 * ```typescript
	 * status: text().default(SQLITE_DEFAULT.string('active'))
	 *
	 * // Handles quotes
	 * note: text().default(SQLITE_DEFAULT.string("it's working"))
	 * ```
	 *
	 * @remarks Generates SQL: `DEFAULT 'active'` or `DEFAULT 'it''s working'`
	 */
	readonly string: (value: string) => DefaultValue;
	/**
	 * Empty string literal.
	 *
	 * @returns DefaultValue producing an empty string `''`
	 *
	 * @example
	 * ```typescript
	 * bio: text().default(SQLITE_DEFAULT.emptyString())
	 * ```
	 *
	 * @remarks Generates SQL: `DEFAULT ''`
	 */
	readonly emptyString: () => DefaultValue;
	/**
	 * Create a numeric literal default.
	 *
	 * @param value - Number value (integer or floating-point)
	 * @returns DefaultValue producing the number as a literal
	 *
	 * @example
	 * ```typescript
	 * rate: real().default(SQLITE_DEFAULT.number(0.05))
	 * ```
	 *
	 * @remarks Generates SQL: `DEFAULT 0.05`
	 */
	readonly number: (value: number) => DefaultValue;
	/**
	 * Create an integer literal default.
	 *
	 * The value is floored to ensure it is a whole number.
	 *
	 * @param value - Number value (will be floored to an integer)
	 * @returns DefaultValue producing the floored integer as a literal
	 *
	 * @example
	 * ```typescript
	 * priority: integer().default(SQLITE_DEFAULT.integer(5))
	 * ```
	 *
	 * @remarks Generates SQL: `DEFAULT 5`
	 */
	readonly integer: (value: number) => DefaultValue;
};

export {};
