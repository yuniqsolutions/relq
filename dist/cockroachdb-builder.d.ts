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
 * Collection of type-safe DEFAULT value helpers.
 *
 * Use these helpers to set column default values with proper SQL generation.
 *
 * @example
 * ```typescript
 * // UUID defaults
 * id: uuid().default(DEFAULT.genRandomUuid())
 *
 * // Timestamp defaults
 * createdAt: timestamptz().default(DEFAULT.now())
 *
 * // JSON defaults
 * metadata: jsonb().default(DEFAULT.emptyObject())
 *
 * // Sequence defaults
 * seq: integer().default(DEFAULT.nextval('my_sequence'))
 * ```
 */
export declare const DEFAULT: {
	/**
	 * Generate random UUID v4 using built-in function (PostgreSQL 13+).
	 * @example id: uuid().default(DEFAULT.genRandomUuid())
	 */
	readonly genRandomUuid: () => DefaultValue;
	/**
	 * Generate UUID v4 using uuid-ossp extension.
	 * @example id: uuid().default(DEFAULT.uuidGenerateV4())
	 */
	readonly uuidGenerateV4: () => DefaultValue;
	/**
	 * Generate time-based UUID v1 using uuid-ossp extension.
	 * @example id: uuid().default(DEFAULT.uuidGenerateV1())
	 */
	readonly uuidGenerateV1: () => DefaultValue;
	/**
	 * Generate UUID v1 with random MAC address.
	 * @example id: uuid().default(DEFAULT.uuidGenerateV1mc())
	 */
	readonly uuidGenerateV1mc: () => DefaultValue;
	/**
	 * Get nil UUID (all zeros).
	 * @example id: uuid().default(DEFAULT.uuidNil())
	 */
	readonly uuidNil: () => DefaultValue;
	/**
	 * Current timestamp with timezone (transaction start time).
	 * @example createdAt: timestamptz().default(DEFAULT.now())
	 */
	readonly now: () => DefaultValue;
	/**
	 * Current timestamp (SQL standard).
	 * @example createdAt: timestamp().default(DEFAULT.currentTimestamp())
	 */
	readonly currentTimestamp: () => DefaultValue;
	/**
	 * Current date only.
	 * @example eventDate: date().default(DEFAULT.currentDate())
	 */
	readonly currentDate: () => DefaultValue;
	/**
	 * Current time only.
	 * @example logTime: time().default(DEFAULT.currentTime())
	 */
	readonly currentTime: () => DefaultValue;
	/**
	 * Local timestamp (without timezone conversion).
	 * @example localTime: timestamp().default(DEFAULT.localTimestamp())
	 */
	readonly localTimestamp: () => DefaultValue;
	/**
	 * Local time only (without timezone conversion).
	 * @example localTime: time().default(DEFAULT.localTime())
	 */
	readonly localTime: () => DefaultValue;
	/**
	 * Transaction start timestamp (same as NOW()).
	 * @example txTime: timestamptz().default(DEFAULT.transactionTimestamp())
	 */
	readonly transactionTimestamp: () => DefaultValue;
	/**
	 * Statement start timestamp.
	 * @example stmtTime: timestamptz().default(DEFAULT.statementTimestamp())
	 */
	readonly statementTimestamp: () => DefaultValue;
	/**
	 * Current wall-clock time (changes during statement execution).
	 * @example actualTime: timestamptz().default(DEFAULT.clockTimestamp())
	 */
	readonly clockTimestamp: () => DefaultValue;
	/**
	 * Current date and time as text (e.g., 'Wed Dec 17 01:37:32.375 2014 PST').
	 * @example timeText: text().default(DEFAULT.timeofday())
	 */
	readonly timeofday: () => DefaultValue;
	/**
	 * Create an interval literal.
	 * @param value - Interval string (e.g., '1 day', '2 hours', '30 minutes')
	 * @example duration: interval().default(DEFAULT.interval('1 hour'))
	 */
	readonly interval: (value: string) => DefaultValue;
	/**
	 * Current time as epoch milliseconds (BIGINT).
	 * Use with epoch() column type for JavaScript-friendly timestamps.
	 * @example createdAt: epoch().default(DEFAULT.epochNow())
	 */
	readonly epochNow: () => DefaultValue;
	/**
	 * Current time as epoch seconds (BIGINT).
	 * @example timestamp: bigint().default(DEFAULT.epochSeconds())
	 */
	readonly epochSeconds: () => DefaultValue;
	/**
	 * Current database user name.
	 * @example createdBy: varchar(100).default(DEFAULT.currentUser())
	 */
	readonly currentUser: () => DefaultValue;
	/**
	 * Session user name (user who connected).
	 * @example loggedUser: varchar(100).default(DEFAULT.sessionUser())
	 */
	readonly sessionUser: () => DefaultValue;
	/**
	 * Alias for CURRENT_USER.
	 * @example user: varchar(100).default(DEFAULT.user())
	 */
	readonly user: () => DefaultValue;
	/**
	 * Current schema name.
	 * @example schema: varchar(100).default(DEFAULT.currentSchema())
	 */
	readonly currentSchema: () => DefaultValue;
	/**
	 * Current database name.
	 * @example database: varchar(100).default(DEFAULT.currentDatabase())
	 */
	readonly currentDatabase: () => DefaultValue;
	/**
	 * Current catalog (same as database in PostgreSQL).
	 * @example catalog: varchar(100).default(DEFAULT.currentCatalog())
	 */
	readonly currentCatalog: () => DefaultValue;
	/**
	 * Client IP address.
	 * @example clientIp: inet().default(DEFAULT.inetClientAddr())
	 */
	readonly inetClientAddr: () => DefaultValue;
	/**
	 * Client port number.
	 * @example clientPort: integer().default(DEFAULT.inetClientPort())
	 */
	readonly inetClientPort: () => DefaultValue;
	/**
	 * Server IP address.
	 * @example serverIp: inet().default(DEFAULT.inetServerAddr())
	 */
	readonly inetServerAddr: () => DefaultValue;
	/**
	 * Server port number.
	 * @example serverPort: integer().default(DEFAULT.inetServerPort())
	 */
	readonly inetServerPort: () => DefaultValue;
	/**
	 * PostgreSQL backend process ID.
	 * @example pid: integer().default(DEFAULT.pgBackendPid())
	 */
	readonly pgBackendPid: () => DefaultValue;
	/**
	 * Get next value from a sequence.
	 * @param sequenceName - Name of the sequence
	 * @example orderId: integer().default(DEFAULT.nextval('order_id_seq'))
	 */
	readonly nextval: (sequenceName: string) => DefaultValue;
	/**
	 * Get current value of a sequence (must call nextval first in session).
	 * @param sequenceName - Name of the sequence
	 * @example lastOrderId: integer().default(DEFAULT.currval('order_id_seq'))
	 */
	readonly currval: (sequenceName: string) => DefaultValue;
	/**
	 * Get last value returned by nextval in current session.
	 * @example lastId: integer().default(DEFAULT.lastval())
	 */
	readonly lastval: () => DefaultValue;
	/**
	 * Random value between 0 and 1.
	 * @example seed: real().default(DEFAULT.random())
	 */
	readonly random: () => DefaultValue;
	/**
	 * Pi constant (3.14159...).
	 * @example piValue: doublePrecision().default(DEFAULT.pi())
	 */
	readonly pi: () => DefaultValue;
	/**
	 * Empty string literal.
	 * @example bio: text().default(DEFAULT.emptyString())
	 */
	readonly emptyString: () => DefaultValue;
	/**
	 * Empty JSONB object {}.
	 * @example metadata: jsonb().default(DEFAULT.emptyObject())
	 */
	readonly emptyObject: () => DefaultValue;
	/**
	 * Empty JSON object (not JSONB).
	 * @example data: json().default(DEFAULT.emptyJson())
	 */
	readonly emptyJson: () => DefaultValue;
	/**
	 * Empty JSONB object (alias for emptyObject).
	 * @example settings: jsonb().default(DEFAULT.emptyJsonb())
	 */
	readonly emptyJsonb: () => DefaultValue;
	/**
	 * Empty array literal.
	 * @example tags: text().array().default(DEFAULT.emptyArray())
	 */
	readonly emptyArray: () => DefaultValue;
	/**
	 * Empty typed array.
	 * @param type - Base type name (e.g., 'text', 'integer')
	 * @example ids: integer().array().default(DEFAULT.emptyArrayOf('integer'))
	 */
	readonly emptyArrayOf: (type: string) => DefaultValue;
	/**
	 * Boolean TRUE.
	 * @example isActive: boolean().default(DEFAULT.true())
	 */
	readonly true: () => DefaultValue;
	/**
	 * Boolean FALSE.
	 * @example isDeleted: boolean().default(DEFAULT.false())
	 */
	readonly false: () => DefaultValue;
	/**
	 * NULL value (explicit default).
	 * @example deletedAt: timestamptz().default(DEFAULT.null())
	 */
	readonly null: () => DefaultValue;
	/**
	 * Zero (0).
	 * @example count: integer().default(DEFAULT.zero())
	 */
	readonly zero: () => DefaultValue;
	/**
	 * One (1).
	 * @example version: integer().default(DEFAULT.one())
	 */
	readonly one: () => DefaultValue;
	/**
	 * Negative one (-1).
	 * @example sortOrder: integer().default(DEFAULT.negativeOne())
	 */
	readonly negativeOne: () => DefaultValue;
	/**
	 * Create a string literal default.
	 * @param value - String value (will be properly escaped)
	 * @example status: varchar(20).default(DEFAULT.string('active'))
	 */
	readonly string: (value: string) => DefaultValue;
	/**
	 * Create a numeric literal default.
	 * @param value - Number value
	 * @example rate: decimal(5,2).default(DEFAULT.number(0.05))
	 */
	readonly number: (value: number) => DefaultValue;
	/**
	 * Create an integer literal default.
	 * @param value - Integer value (will be floored)
	 * @example priority: integer().default(DEFAULT.integer(5))
	 */
	readonly integer: (value: number) => DefaultValue;
	/**
	 * Create a decimal literal with optional precision.
	 * @param value - Decimal value
	 * @param precision - Optional decimal places
	 * @example price: decimal(10,2).default(DEFAULT.decimal(0.00, 2))
	 */
	readonly decimal: (value: number, precision?: number) => DefaultValue;
	/**
	 * Create a type-cast literal.
	 * @param value - Value to cast
	 * @param type - Target SQL type
	 * @example customType: myDomain().default(DEFAULT.cast('value', 'my_domain'))
	 */
	readonly cast: (value: string | number, type: string) => DefaultValue;
	/**
	 * Empty tsvector (PostgreSQL only).
	 * @example searchVector: tsvector().default(DEFAULT.emptyTsvector())
	 */
	readonly emptyTsvector: () => DefaultValue;
	/**
	 * Point literal (PostgreSQL only).
	 * @param x - X coordinate
	 * @param y - Y coordinate
	 * @example location: point().default(DEFAULT.point(0, 0))
	 */
	readonly point: (x: number, y: number) => DefaultValue;
	/**
	 * INET address literal (PostgreSQL only).
	 * @param address - IP address string
	 * @example defaultIp: inet().default(DEFAULT.inet('0.0.0.0'))
	 */
	readonly inet: (address: string) => DefaultValue;
	/**
	 * CIDR network literal (PostgreSQL only).
	 * @param network - CIDR notation string
	 * @example defaultNetwork: cidr().default(DEFAULT.cidr('10.0.0.0/8'))
	 */
	readonly cidr: (network: string) => DefaultValue;
	/**
	 * MAC address literal (PostgreSQL only).
	 * @param address - MAC address string
	 * @example defaultMac: macaddr().default(DEFAULT.macaddr('00:00:00:00:00:00'))
	 */
	readonly macaddr: (address: string) => DefaultValue;
	/**
	 * Empty integer range (PostgreSQL only).
	 * @example range: int4range().default(DEFAULT.emptyInt4range())
	 */
	readonly emptyInt4range: () => DefaultValue;
	/**
	 * Empty bigint range (PostgreSQL only).
	 * @example range: int8range().default(DEFAULT.emptyInt8range())
	 */
	readonly emptyInt8range: () => DefaultValue;
	/**
	 * Empty numeric range (PostgreSQL only).
	 * @example range: numrange().default(DEFAULT.emptyNumrange())
	 */
	readonly emptyNumrange: () => DefaultValue;
	/**
	 * Empty timestamp range (PostgreSQL only).
	 * @example range: tsrange().default(DEFAULT.emptyTsrange())
	 */
	readonly emptyTsrange: () => DefaultValue;
	/**
	 * Empty timestamptz range (PostgreSQL only).
	 * @example range: tstzrange().default(DEFAULT.emptyTstzrange())
	 */
	readonly emptyTstzrange: () => DefaultValue;
	/**
	 * Empty date range (PostgreSQL only).
	 * @example range: daterange().default(DEFAULT.emptyDaterange())
	 */
	readonly emptyDaterange: () => DefaultValue;
	/**
	 * Empty hstore (PostgreSQL only, requires hstore extension).
	 * @example attrs: hstore().default(DEFAULT.emptyHstore())
	 */
	readonly emptyHstore: () => DefaultValue;
	/**
	 * Empty bytea (binary) value.
	 * @example data: bytea().default(DEFAULT.emptyBytea())
	 */
	readonly emptyBytea: () => DefaultValue;
	/**
	 * Money literal (PostgreSQL only).
	 * @param value - Money value
	 * @example price: money().default(DEFAULT.money(0))
	 */
	readonly money: (value: number | string) => DefaultValue;
	/**
	 * Zero money value (PostgreSQL only).
	 * @example total: money().default(DEFAULT.zeroMoney())
	 */
	readonly zeroMoney: () => DefaultValue;
};
export declare const EMPTY_OBJECT: unique symbol;
export declare const EMPTY_ARRAY: unique symbol;
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
/** Table column references for generated columns - each column becomes a ChainableExpr */
export type GeneratedTableRefs<T extends Record<string, ColumnConfig>> = {
	[K in keyof T]: ChainableExpr;
};
/** Chainable expression for fluent arithmetic operations */
export interface ChainableExpr extends GeneratedExpr {
	/** Add another value: col.add(otherCol) or col.add(5) */
	add(value: ChainableExpr | GeneratedExpr | number): ChainableExpr;
	/** Alias for add */
	plus(value: ChainableExpr | GeneratedExpr | number): ChainableExpr;
	/** Subtract another value: col.subtract(otherCol) or col.subtract(5) */
	subtract(value: ChainableExpr | GeneratedExpr | number): ChainableExpr;
	/** Alias for subtract */
	minus(value: ChainableExpr | GeneratedExpr | number): ChainableExpr;
	/** Multiply by another value: col.multiply(otherCol) or col.multiply(5) */
	multiply(value: ChainableExpr | GeneratedExpr | number): ChainableExpr;
	/** Alias for multiply */
	times(value: ChainableExpr | GeneratedExpr | number): ChainableExpr;
	/** Divide by another value: col.divide(otherCol) or col.divide(5) */
	divide(value: ChainableExpr | GeneratedExpr | number): ChainableExpr;
	/** Alias for divide */
	dividedBy(value: ChainableExpr | GeneratedExpr | number): ChainableExpr;
	/** Modulo operation: col.mod(5) */
	mod(value: ChainableExpr | GeneratedExpr | number): ChainableExpr;
	/** Concatenate strings: col.concat(otherCol, ' ', anotherCol) */
	concat(...args: (ChainableExpr | GeneratedExpr | string)[]): ChainableExpr;
}
/** SQL functions for generated column expressions */
export interface GeneratedFn {
	/**
	 * Call F directly on a column to start a chainable expression
	 * @example F(table.unitPrice).multiply(table.quantity)
	 */
	(col: ChainableExpr | GeneratedExpr): ChainableExpr;
	lower(col: ChainableExpr | GeneratedExpr): ChainableExpr;
	upper(col: ChainableExpr | GeneratedExpr): ChainableExpr;
	trim(col: ChainableExpr | GeneratedExpr): ChainableExpr;
	ltrim(col: ChainableExpr | GeneratedExpr): ChainableExpr;
	rtrim(col: ChainableExpr | GeneratedExpr): ChainableExpr;
	length(col: ChainableExpr | GeneratedExpr): ChainableExpr;
	substring(col: ChainableExpr | GeneratedExpr, start: number, length?: number): ChainableExpr;
	concat(...args: (ChainableExpr | GeneratedExpr | string)[]): ChainableExpr;
	replace(col: ChainableExpr | GeneratedExpr, from: string, to: string): ChainableExpr;
	left(col: ChainableExpr | GeneratedExpr, n: number): ChainableExpr;
	right(col: ChainableExpr | GeneratedExpr, n: number): ChainableExpr;
	abs(col: ChainableExpr | GeneratedExpr): ChainableExpr;
	ceil(col: ChainableExpr | GeneratedExpr): ChainableExpr;
	floor(col: ChainableExpr | GeneratedExpr): ChainableExpr;
	round(col: ChainableExpr | GeneratedExpr, decimals?: number): ChainableExpr;
	trunc(col: ChainableExpr | GeneratedExpr, decimals?: number): ChainableExpr;
	sign(col: ChainableExpr | GeneratedExpr): ChainableExpr;
	power(col: ChainableExpr | GeneratedExpr, exponent: number): ChainableExpr;
	sqrt(col: ChainableExpr | GeneratedExpr): ChainableExpr;
	exp(col: ChainableExpr | GeneratedExpr): ChainableExpr;
	ln(col: ChainableExpr | GeneratedExpr): ChainableExpr;
	log(col: ChainableExpr | GeneratedExpr, base?: number): ChainableExpr;
	greatest(...args: (ChainableExpr | GeneratedExpr | number)[]): ChainableExpr;
	least(...args: (ChainableExpr | GeneratedExpr | number)[]): ChainableExpr;
	add(a: ChainableExpr | GeneratedExpr | number, b: ChainableExpr | GeneratedExpr | number): ChainableExpr;
	subtract(a: ChainableExpr | GeneratedExpr | number, b: ChainableExpr | GeneratedExpr | number): ChainableExpr;
	multiply(a: ChainableExpr | GeneratedExpr | number, b: ChainableExpr | GeneratedExpr | number): ChainableExpr;
	divide(a: ChainableExpr | GeneratedExpr | number, b: ChainableExpr | GeneratedExpr | number): ChainableExpr;
	mod(a: ChainableExpr | GeneratedExpr | number, b: ChainableExpr | GeneratedExpr | number): ChainableExpr;
	asText(col: ChainableExpr | GeneratedExpr): ChainableExpr;
	asInteger(col: ChainableExpr | GeneratedExpr): ChainableExpr;
	asNumeric(col: ChainableExpr | GeneratedExpr): ChainableExpr;
	asBoolean(col: ChainableExpr | GeneratedExpr): ChainableExpr;
	asDate(col: ChainableExpr | GeneratedExpr): ChainableExpr;
	asTimestamp(col: ChainableExpr | GeneratedExpr): ChainableExpr;
	coalesce(...args: (ChainableExpr | GeneratedExpr | string | number | null)[]): ChainableExpr;
	nullif(col: ChainableExpr | GeneratedExpr, value: ChainableExpr | GeneratedExpr | string | number): ChainableExpr;
	ifNull(col: ChainableExpr | GeneratedExpr, defaultValue: ChainableExpr | GeneratedExpr | string | number): ChainableExpr;
	case(): CaseBuilder;
	jsonExtract(col: ChainableExpr | GeneratedExpr, path: string): ChainableExpr;
	jsonExtractText(col: ChainableExpr | GeneratedExpr, path: string): ChainableExpr;
	jsonbExtract(col: ChainableExpr | GeneratedExpr, path: string): ChainableExpr;
	jsonbExtractText(col: ChainableExpr | GeneratedExpr, path: string): ChainableExpr;
	jsonArrayLength(col: ChainableExpr | GeneratedExpr): ChainableExpr;
	extract(field: "year" | "month" | "day" | "hour" | "minute" | "second" | "dow" | "doy" | "week" | "quarter" | "epoch", col: ChainableExpr | GeneratedExpr): ChainableExpr;
	datePart(field: string, col: ChainableExpr | GeneratedExpr): ChainableExpr;
	age(col1: ChainableExpr | GeneratedExpr, col2: ChainableExpr | GeneratedExpr): ChainableExpr;
	/** Create tsvector from text using specified config (e.g., 'english', 'simple') */
	toTsvector(config: string, col: ChainableExpr | GeneratedExpr | string): ChainableExpr;
	/** Assign weight (A, B, C, or D) to tsvector for ranking */
	setweight(tsvector: ChainableExpr | GeneratedExpr, weight: "A" | "B" | "C" | "D"): ChainableExpr;
	/** Concatenate multiple tsvectors using || operator */
	tsvectorConcat(...vectors: (ChainableExpr | GeneratedExpr)[]): ChainableExpr;
	/** Generic concatenation using || operator (works for text, tsvector, arrays) */
	concat(...args: (ChainableExpr | GeneratedExpr | string)[]): ChainableExpr;
	/** Text-specific concatenation using || operator */
	textConcat(...args: (ChainableExpr | GeneratedExpr | string)[]): ChainableExpr;
	/** Create tsquery from text */
	toTsquery(config: string, col: ChainableExpr | GeneratedExpr | string): ChainableExpr;
	/** Create tsquery from plain text (handles spaces and punctuation) */
	plaintoTsquery(config: string, col: ChainableExpr | GeneratedExpr | string): ChainableExpr;
	/** Create tsquery from web-style search (handles OR, quotes, etc.) */
	websearchToTsquery(config: string, col: ChainableExpr | GeneratedExpr | string): ChainableExpr;
	similarity(col1: ChainableExpr | GeneratedExpr, col2: ChainableExpr | GeneratedExpr | string): ChainableExpr;
	point(x: ChainableExpr | GeneratedExpr | number, y: ChainableExpr | GeneratedExpr | number): ChainableExpr;
	arrayLength(col: ChainableExpr | GeneratedExpr, dim?: number): ChainableExpr;
	arrayPosition(arr: ChainableExpr | GeneratedExpr, elem: ChainableExpr | GeneratedExpr | string | number): ChainableExpr;
	md5(col: ChainableExpr | GeneratedExpr): ChainableExpr;
	sha256(col: ChainableExpr | GeneratedExpr): ChainableExpr;
	/** Reference a column by name (used when importing SQL schemas) */
	col(name: string, alias?: string): ChainableExpr;
	/** Pass raw SQL expression directly - use for complex expressions */
	raw(sql: string): ChainableExpr;
	/** Cast to any PostgreSQL type by name */
	cast(value: ChainableExpr | GeneratedExpr | string | number, typeName: string): ChainableExpr;
	/** Call any SQL function by name */
	func(name: string, ...args: (ChainableExpr | GeneratedExpr | string | number)[]): ChainableExpr;
	/** Embed raw SQL - use with caution */
	sql(expression: string): ChainableExpr;
	/** Apply an operator between two values */
	op(left: ChainableExpr | GeneratedExpr | string | number, operator: string, right: ChainableExpr | GeneratedExpr | string | number): ChainableExpr;
	setWeight(tsvector: ChainableExpr | GeneratedExpr, weight: string): ChainableExpr;
	asVarchar(col: ChainableExpr | GeneratedExpr): ChainableExpr;
	/** Concatenate text or tsvector values using || operator */
	textConcat(left: ChainableExpr | GeneratedExpr | string, right: ChainableExpr | GeneratedExpr | string): ChainableExpr;
	/** Full-text search match: tsvector @@ tsquery */
	tsMatch(left: ChainableExpr | GeneratedExpr, right: ChainableExpr | GeneratedExpr): ChainableExpr;
	/** Compare two values with a comparison operator */
	compare(left: ChainableExpr | GeneratedExpr | string | number, op: "=" | "<>" | "!=" | "<" | ">" | "<=" | ">=", right: ChainableExpr | GeneratedExpr | string | number): ChainableExpr;
	/** Apply regex match operator */
	regex(value: ChainableExpr | GeneratedExpr, op: "~" | "~*" | "!~" | "!~*", pattern: ChainableExpr | GeneratedExpr | string): ChainableExpr;
	/** Logical AND */
	and(...args: (ChainableExpr | GeneratedExpr)[]): ChainableExpr;
	/** Logical OR */
	or(...args: (ChainableExpr | GeneratedExpr)[]): ChainableExpr;
	/** Logical NOT */
	not(arg: ChainableExpr | GeneratedExpr): ChainableExpr;
	/** IS NULL check */
	isNull(col: ChainableExpr | GeneratedExpr): ChainableExpr;
	/** IS NOT NULL check */
	isNotNull(col: ChainableExpr | GeneratedExpr): ChainableExpr;
}
/** CASE expression builder */
export interface CaseBuilder {
	when(condition: ChainableExpr | GeneratedExpr | string, result: ChainableExpr | GeneratedExpr | string | number): CaseBuilder;
	else(result: ChainableExpr | GeneratedExpr | string | number): ChainableExpr;
	end(): ChainableExpr;
}
/** Expression result for generated columns */
export interface GeneratedExpr {
	readonly $sql: string;
	readonly $expr: true;
}
/**
 * Fluent chainable expression for generated columns.
 * Provides a readable, chainable API similar to index WHERE clauses.
 *
 * ## Basic Usage
 *
 * Access columns via the table parameter in generatedAlwaysAs:
 * ```typescript
 * generatedAlwaysAs(table =>
 *     table.firstName.concat(' ', table.lastName)
 * )
 * ```
 *
 * ## Chainable Methods
 *
 * ### Null Handling
 * - `.coalesce(fallback)` - Returns first non-null value
 * - `.nullif(value)` - Returns NULL if equal to value
 *
 * ### Type Casting
 * - `.asText()` - Cast to TEXT
 * - `.asInteger()` - Cast to INTEGER
 * - `.asVarchar()` - Cast to VARCHAR
 *
 * ### Text Functions
 * - `.lower()` - Convert to lowercase
 * - `.upper()` - Convert to uppercase
 * - `.trim()` - Remove whitespace
 * - `.concat(...parts)` - Concatenate with other values/columns
 * - `.substring(start, length?)` - Extract substring
 * - `.replace(from, to)` - Replace text
 * - `.length()` - Get string length
 *
 * ### Full-Text Search
 * - `.toTsvector(config)` - Create tsvector (e.g., 'english')
 * - `.setWeight(weight)` - Set weight A/B/C/D for ranking
 * - `.tsvConcat(other)` - Concatenate tsvectors (|| operator)
 *
 * ### JSON/JSONB
 * - `.jsonExtract(key)` - Extract JSON value (->)
 * - `.jsonExtractText(key)` - Extract as text (->>)
 *
 * ### Math
 * - `.add(n)`, `.subtract(n)`, `.multiply(n)`, `.divide(n)`
 * - `.abs()`, `.round(precision?)`, `.floor()`, `.ceil()`
 *
 * @example Full-text search vector
 * ```typescript
 * searchVector: tsvector().generatedAlwaysAs(table =>
 *     table.email.coalesce('').asText().toTsvector('english').setWeight('A')
 *         .tsvConcat(table.name.coalesce('').toTsvector('english').setWeight('B'))
 * )
 * ```
 *
 * @example Computed full name
 * ```typescript
 * fullName: text().generatedAlwaysAs(table =>
 *     table.firstName.concat(' ', table.lastName)
 * )
 * ```
 */
export interface FluentGenExpr extends GeneratedExpr {
	/** COALESCE - returns first non-null value */
	coalesce(fallback: FluentGenExpr | string | number): FluentGenExpr;
	/** NULLIF - returns NULL if equal to value */
	nullif(value: FluentGenExpr | string | number): FluentGenExpr;
	/** Cast to TEXT */
	asText(): FluentGenExpr;
	/** Cast to INTEGER */
	asInteger(): FluentGenExpr;
	/** Cast to VARCHAR */
	asVarchar(): FluentGenExpr;
	/** Cast to BIGINT */
	asBigint(): FluentGenExpr;
	/** Cast to SMALLINT */
	asSmallint(): FluentGenExpr;
	/** Cast to NUMERIC with optional precision and scale */
	asNumeric(precision?: number, scale?: number): FluentGenExpr;
	/** Cast to REAL (single precision float) */
	asReal(): FluentGenExpr;
	/** Cast to DOUBLE PRECISION */
	asDouble(): FluentGenExpr;
	/** Cast to BOOLEAN */
	asBool(): FluentGenExpr;
	/** Cast to DATE */
	asDate(): FluentGenExpr;
	/** Cast to TIME */
	asTime(): FluentGenExpr;
	/** Cast to TIMESTAMP */
	asTimestamp(): FluentGenExpr;
	/** Cast to TIMESTAMPTZ */
	asTimestamptz(): FluentGenExpr;
	/** Cast to INTERVAL */
	asInterval(): FluentGenExpr;
	/** Cast to UUID */
	asUuid(): FluentGenExpr;
	/** Cast to BYTEA */
	asBytea(): FluentGenExpr;
	/** Cast to JSON */
	asJson(): FluentGenExpr;
	/** Cast to JSONB */
	asJsonb(): FluentGenExpr;
	/** Cast to any PostgreSQL type */
	cast(typeName: string): FluentGenExpr;
	/** Convert to lowercase */
	lower(): FluentGenExpr;
	/** Convert to uppercase */
	upper(): FluentGenExpr;
	/** Remove leading/trailing whitespace */
	trim(): FluentGenExpr;
	/** Remove leading characters (default: whitespace) */
	ltrim(chars?: string): FluentGenExpr;
	/** Remove trailing characters (default: whitespace) */
	rtrim(chars?: string): FluentGenExpr;
	/** Remove leading and trailing characters (default: whitespace) */
	btrim(chars?: string): FluentGenExpr;
	/** Concatenate with other values using || operator */
	concat(...parts: (FluentGenExpr | string)[]): FluentGenExpr;
	/** Extract substring starting at position (1-indexed) */
	substring(start: number, length?: number): FluentGenExpr;
	/** Replace all occurrences of a string */
	replace(from: string, to: string): FluentGenExpr;
	/** Get string length in characters */
	length(): FluentGenExpr;
	/** Left pad to specified length */
	lpad(length: number, fill?: string): FluentGenExpr;
	/** Right pad to specified length */
	rpad(length: number, fill?: string): FluentGenExpr;
	/** Get leftmost n characters */
	left(n: number): FluentGenExpr;
	/** Get rightmost n characters */
	right(n: number): FluentGenExpr;
	/** Reverse the string */
	reverse(): FluentGenExpr;
	/** Repeat string n times */
	repeat(n: number): FluentGenExpr;
	/** Capitalize first letter of each word */
	initcap(): FluentGenExpr;
	/** Get ASCII code of first character */
	ascii(): FluentGenExpr;
	/** Get character from ASCII code */
	chr(): FluentGenExpr;
	/** Find position of substring (1-indexed, 0 if not found) */
	position(substring: string): FluentGenExpr;
	/** Overlay (replace) substring at position */
	overlay(replacement: string, start: number, length?: number): FluentGenExpr;
	/** Translate characters (like tr command) */
	translate(from: string, to: string): FluentGenExpr;
	/** Split string and return nth field (1-indexed) */
	splitPart(delimiter: string, field: number): FluentGenExpr;
	/** Replace using regular expression */
	regexpReplace(pattern: string, replacement: string, flags?: string): FluentGenExpr;
	/** Format string using sprintf-style format */
	format(formatStr: string, ...args: (FluentGenExpr | string | number)[]): FluentGenExpr;
	/** Quote as SQL identifier */
	quoteIdent(): FluentGenExpr;
	/** Quote as SQL literal */
	quoteLiteral(): FluentGenExpr;
	/** Quote as SQL literal or NULL */
	quoteNullable(): FluentGenExpr;
	/** Encode binary data to text (base64, hex, escape) */
	encode(format: "base64" | "hex" | "escape"): FluentGenExpr;
	/** Decode text to binary data */
	decode(format: "base64" | "hex" | "escape"): FluentGenExpr;
	/** Calculate MD5 hash */
	md5(): FluentGenExpr;
	/** Calculate SHA-256 hash */
	sha256(): FluentGenExpr;
	/** Calculate SHA-512 hash */
	sha512(): FluentGenExpr;
	/** Calculate hash using specified algorithm */
	digest(algorithm: string): FluentGenExpr;
	/** Add value */
	add(value: FluentGenExpr | number): FluentGenExpr;
	/** Alias for add */
	plus(value: FluentGenExpr | number): FluentGenExpr;
	/** Subtract value */
	subtract(value: FluentGenExpr | number): FluentGenExpr;
	/** Alias for subtract */
	minus(value: FluentGenExpr | number): FluentGenExpr;
	/** Multiply by value */
	multiply(value: FluentGenExpr | number): FluentGenExpr;
	/** Alias for multiply */
	times(value: FluentGenExpr | number): FluentGenExpr;
	/** Divide by value */
	divide(value: FluentGenExpr | number): FluentGenExpr;
	/** Alias for divide */
	dividedBy(value: FluentGenExpr | number): FluentGenExpr;
	/** Modulo (remainder) */
	mod(divisor: FluentGenExpr | number): FluentGenExpr;
	/** Power/exponentiation */
	power(exponent: FluentGenExpr | number): FluentGenExpr;
	/** Square root */
	sqrt(): FluentGenExpr;
	/** Cube root */
	cbrt(): FluentGenExpr;
	/** Absolute value */
	abs(): FluentGenExpr;
	/** Round to precision (default: 0 decimal places) */
	round(precision?: number): FluentGenExpr;
	/** Floor - largest integer not greater than */
	floor(): FluentGenExpr;
	/** Ceiling - smallest integer not less than */
	ceil(): FluentGenExpr;
	/** Truncate towards zero */
	trunc(scale?: number): FluentGenExpr;
	/** Sign: -1, 0, or 1 */
	sign(): FluentGenExpr;
	/** Exponential (e^x) */
	exp(): FluentGenExpr;
	/** Natural logarithm */
	ln(): FluentGenExpr;
	/** Logarithm with optional base (default: 10) */
	log(base?: number): FluentGenExpr;
	/** Base-10 logarithm */
	log10(): FluentGenExpr;
	/** Convert radians to degrees */
	degrees(): FluentGenExpr;
	/** Convert degrees to radians */
	radians(): FluentGenExpr;
	/** Sine */
	sin(): FluentGenExpr;
	/** Cosine */
	cos(): FluentGenExpr;
	/** Tangent */
	tan(): FluentGenExpr;
	/** Arc sine */
	asin(): FluentGenExpr;
	/** Arc cosine */
	acos(): FluentGenExpr;
	/** Arc tangent */
	atan(): FluentGenExpr;
	/** Arc tangent of y/x */
	atan2(x: FluentGenExpr | number): FluentGenExpr;
	/** Hyperbolic sine */
	sinh(): FluentGenExpr;
	/** Hyperbolic cosine */
	cosh(): FluentGenExpr;
	/** Hyperbolic tangent */
	tanh(): FluentGenExpr;
	/** Factorial (n!) */
	factorial(): FluentGenExpr;
	/** Greatest common divisor */
	gcd(other: FluentGenExpr | number): FluentGenExpr;
	/** Least common multiple */
	lcm(other: FluentGenExpr | number): FluentGenExpr;
	/** Width bucket for histograms */
	widthBucket(min: number, max: number, buckets: number): FluentGenExpr;
	/** Equal to */
	eq(value: FluentGenExpr | string | number | boolean | null): FluentGenExpr;
	/** Not equal to */
	ne(value: FluentGenExpr | string | number | boolean | null): FluentGenExpr;
	/** Greater than */
	gt(value: FluentGenExpr | string | number): FluentGenExpr;
	/** Greater than or equal to */
	gte(value: FluentGenExpr | string | number): FluentGenExpr;
	/** Less than */
	lt(value: FluentGenExpr | string | number): FluentGenExpr;
	/** Less than or equal to */
	lte(value: FluentGenExpr | string | number): FluentGenExpr;
	/** Between min and max (inclusive) */
	between(min: FluentGenExpr | number, max: FluentGenExpr | number): FluentGenExpr;
	/** Not between min and max */
	notBetween(min: FluentGenExpr | number, max: FluentGenExpr | number): FluentGenExpr;
	/** In list of values */
	in(...values: (FluentGenExpr | string | number)[]): FluentGenExpr;
	/** Not in list of values */
	notIn(...values: (FluentGenExpr | string | number)[]): FluentGenExpr;
	/** IS DISTINCT FROM (null-safe inequality) */
	isDistinctFrom(other: FluentGenExpr | string | number | null): FluentGenExpr;
	/** IS NOT DISTINCT FROM (null-safe equality) */
	isNotDistinctFrom(other: FluentGenExpr | string | number | null): FluentGenExpr;
	/** LIKE pattern match */
	like(pattern: string): FluentGenExpr;
	/** Case-insensitive LIKE */
	ilike(pattern: string): FluentGenExpr;
	/** SIMILAR TO regex pattern */
	similar(pattern: string): FluentGenExpr;
	/** POSIX regex match */
	matches(regex: string, flags?: string): FluentGenExpr;
	/** Greatest of multiple values */
	greatest(...values: (FluentGenExpr | string | number)[]): FluentGenExpr;
	/** Least of multiple values */
	least(...values: (FluentGenExpr | string | number)[]): FluentGenExpr;
	/** Logical AND with another expression */
	and(other: FluentGenExpr): FluentGenExpr;
	/** Logical OR with another expression */
	or(other: FluentGenExpr): FluentGenExpr;
	/** Logical NOT */
	not(): FluentGenExpr;
	/** IS NULL check */
	isNull(): FluentGenExpr;
	/** IS NOT NULL check */
	isNotNull(): FluentGenExpr;
	/** Extract JSON value by key (->) */
	jsonExtract(key: string | number): FluentGenExpr;
	/** Extract JSON value as text (->>) */
	jsonExtractText(key: string | number): FluentGenExpr;
	/** Extract JSONB value by key (->) */
	jsonbExtract(key: string | number): FluentGenExpr;
	/** Extract JSONB value as text (->>) */
	jsonbExtractText(key: string | number): FluentGenExpr;
	/** Extract by path (#>) */
	jsonbPath(path: string[]): FluentGenExpr;
	/** Extract by path as text (#>>) */
	jsonbPathText(path: string[]): FluentGenExpr;
	/** Get JSON value type */
	jsonTypeof(): FluentGenExpr;
	/** Get JSONB value type */
	jsonbTypeof(): FluentGenExpr;
	/** Get JSON array length */
	jsonArrayLength(): FluentGenExpr;
	/** Get JSONB array length */
	jsonbArrayLength(): FluentGenExpr;
	/** Get JSONB object keys */
	jsonbKeys(): FluentGenExpr;
	/** Pretty-print JSONB */
	jsonbPretty(): FluentGenExpr;
	/** Remove null values from JSONB */
	jsonbStripNulls(): FluentGenExpr;
	/** Convert to JSON */
	toJson(): FluentGenExpr;
	/** Convert to JSONB */
	toJsonb(): FluentGenExpr;
	/** Get array length (1-dimensional by default) */
	arrayLength(dimension?: number): FluentGenExpr;
	/** Get array element by index (1-indexed) */
	arrayGet(index: number): FluentGenExpr;
	/** Find position of element in array (1-indexed, NULL if not found) */
	arrayPosition(element: FluentGenExpr | string | number, start?: number): FluentGenExpr;
	/** Find all positions of element in array */
	arrayPositions(element: FluentGenExpr | string | number): FluentGenExpr;
	/** Get array dimensions as text */
	arrayDims(): FluentGenExpr;
	/** Get lower bound of array dimension */
	arrayLower(dimension?: number): FluentGenExpr;
	/** Get upper bound of array dimension */
	arrayUpper(dimension?: number): FluentGenExpr;
	/** Get number of array dimensions */
	arrayNDims(): FluentGenExpr;
	/** Convert array to string with delimiter */
	arrayToString(delimiter: string, nullString?: string): FluentGenExpr;
	/** Append element to array */
	arrayAppend(element: FluentGenExpr | string | number): FluentGenExpr;
	/** Prepend element to array */
	arrayPrepend(element: FluentGenExpr | string | number): FluentGenExpr;
	/** Concatenate two arrays */
	arrayCat(other: FluentGenExpr): FluentGenExpr;
	/** Remove all occurrences of element from array */
	arrayRemove(element: FluentGenExpr | string | number): FluentGenExpr;
	/** Replace all occurrences in array */
	arrayReplace(from: FluentGenExpr | string | number, to: FluentGenExpr | string | number): FluentGenExpr;
	/** Expand array to set of rows */
	unnest(): FluentGenExpr;
	/** Get total number of elements in array (all dimensions) */
	cardinality(): FluentGenExpr;
	/** Create tsvector with specified config (e.g., 'english') */
	toTsvector(config?: string): FluentGenExpr;
	/** Set weight for tsvector ranking (A/B/C/D) */
	setWeight(weight: "A" | "B" | "C" | "D"): FluentGenExpr;
	/** Concatenate tsvectors using || operator */
	tsvConcat(other: FluentGenExpr): FluentGenExpr;
	/** Create tsquery from text */
	toTsquery(config?: string): FluentGenExpr;
	/** Create tsquery from plain text (AND between words) */
	plainToTsquery(config?: string): FluentGenExpr;
	/** Create tsquery for phrase search */
	phraseToTsquery(config?: string): FluentGenExpr;
	/** Create tsquery from web-style search */
	websearchToTsquery(config?: string): FluentGenExpr;
	/** Remove positions and weights from tsvector */
	tsStrip(): FluentGenExpr;
	/** Get number of lexemes in tsvector */
	tsLength(): FluentGenExpr;
	/** Get number of nodes in tsquery */
	numNode(): FluentGenExpr;
	/** Get query tree as text */
	queryTree(): FluentGenExpr;
	/** Rank search results */
	tsRank(query: FluentGenExpr, normalization?: number): FluentGenExpr;
	/** Rank search results (cover density) */
	tsRankCd(query: FluentGenExpr, normalization?: number): FluentGenExpr;
	/** Generate search result headline */
	tsHeadline(query: FluentGenExpr, options?: string): FluentGenExpr;
	/** Rewrite tsquery */
	tsRewrite(target: FluentGenExpr, substitute: FluentGenExpr): FluentGenExpr;
	/** Filter tsvector by weights */
	tsFilter(weights: ("A" | "B" | "C" | "D")[]): FluentGenExpr;
	/** Delete lexemes from tsvector */
	tsDelete(lexemes: string[]): FluentGenExpr;
	/** Extract date/time field */
	extract(field: "year" | "month" | "day" | "hour" | "minute" | "second" | "epoch" | "dow" | "doy" | "week" | "quarter"): FluentGenExpr;
	/** Extract date/time field (alias for extract) */
	datePart(field: string): FluentGenExpr;
	/** Calculate age between two dates/timestamps */
	age(other?: FluentGenExpr): FluentGenExpr;
	/** Truncate to specified precision */
	dateTrunc(field: "year" | "quarter" | "month" | "week" | "day" | "hour" | "minute" | "second"): FluentGenExpr;
	/** Extract epoch (seconds since 1970-01-01) */
	epoch(): FluentGenExpr;
	/** Check if date/timestamp/interval is finite */
	isfinite(): FluentGenExpr;
	/** Start a CASE expression */
	case(): CaseBuilder;
	/** Simple if-then-else expression */
	ifThen(condition: FluentGenExpr, thenValue: FluentGenExpr | string | number, elseValue: FluentGenExpr | string | number): FluentGenExpr;
	/** Wrap expression in parentheses */
	parentheses(): FluentGenExpr;
	/** Call any PostgreSQL function */
	func(name: string, ...args: (FluentGenExpr | string | number)[]): FluentGenExpr;
	/** Apply custom operator */
	op(operator: string, right: FluentGenExpr | string | number): FluentGenExpr;
}
/** Table refs for fluent generated column expressions */
export type FluentGenTableRefs<T extends Record<string, ColumnConfig>> = {
	[K in keyof T]: FluentGenExpr;
};
export type ColumnBuilder<T, Config extends ColumnConfig<T> = ColumnConfig<T>> = Config & {
	notNull(): ColumnBuilder<T, Config & {
		$nullable: false;
	}>;
	nullable(): ColumnBuilder<T, Config & {
		$nullable: true;
	}>;
	default<V extends T | (() => T) | DefaultValue>(value: V): ColumnBuilder<T, Config & {
		$default: V;
	}>;
	primaryKey(): ColumnBuilder<T, Config & {
		$primaryKey: true;
	}>;
	unique(): ColumnBuilder<T, Config & {
		$unique: true;
	}>;
	references(table: string, column: string, options?: {
		onDelete?: string;
		onUpdate?: string;
	}): ColumnBuilder<T, Config>;
	/**
	 * Add CHECK constraint with enum-like values and explicit constraint name.
	 * Narrows the column type to the union of provided values for autocomplete.
	 * @param name - Constraint name (preserved for 1:1 SQL parity)
	 * @param values - Allowed string values array (literal types auto-inferred)
	 * @example
	 * .check('users_status_check', ['active', 'inactive', 'banned'])
	 * // Type becomes 'active' | 'inactive' | 'banned'
	 */
	check<const V extends readonly string[]>(name: string, values: V): ColumnBuilder<V[number], ColumnConfig<V[number]> & {
		$check: string;
		$checkName: string;
		$checkValues: V;
	}>;
	/**
	 * Add CHECK constraint that excludes specific values.
	 * @param name - Constraint name (preserved for 1:1 SQL parity)
	 * @param values - Disallowed string values array
	 * @example
	 * .checkNot('users_status_check', ['deleted', 'archived'])
	 * // Column cannot have these values
	 */
	checkNot<const V extends readonly string[]>(name: string, values: V): ColumnBuilder<T, Config & {
		$checkNot: string;
		$checkNotName: string;
		$checkNotValues: V;
	}>;
	/**
	 * Make this column an array type. Returns properly typed T[].
	 * @param dimensions - Number of dimensions (default: 1)
	 * @example
	 * tags: text().array() // text[] -> string[]
	 * matrix: integer().array(2) // integer[][] -> number[][]
	 * settings: jsonb<Settings>().array() // jsonb[] -> Settings[]
	 */
	array(dimensions?: number): ColumnBuilder<T[], ColumnConfig<T[]> & {
		$array: true;
	}>;
	/**
	 * Override the inferred TypeScript type for this column.
	 * Useful for branded types, custom type mappings, or narrowing types.
	 * @example
	 * // Branded type
	 * userId: text('user_id').$type<UserId>()
	 * // Override numeric string to number
	 * amount: numeric('amount').$type<number>()
	 * // Narrow to specific string literals
	 * status: text('status').$type<'active' | 'inactive'>()
	 */
	$type<U>(): ColumnBuilder<U, ColumnConfig<U>>;
	length(len: number): ColumnBuilder<T, Config & {
		$length: number;
	}>;
	precision(p: number): ColumnBuilder<T, Config & {
		$precision: number;
	}>;
	scale(s: number): ColumnBuilder<T, Config & {
		$scale: number;
	}>;
	withTimezone(): ColumnBuilder<T, Config & {
		$withTimezone: true;
	}>;
	dimensions(d: number): ColumnBuilder<T, Config & {
		$dimensions: number;
	}>;
	/**
	 * Add a comment/description to the column.
	 * This will be stored in the database schema and used for documentation.
	 * @param text - The comment text
	 * @example
	 * email: varchar(255).notNull().comment('User primary email address')
	 */
	comment(text: string): ColumnBuilder<T, Config & {
		$comment: string;
	}>;
	/**
	 * Set tracking ID for rename detection.
	 * This ID persists across column renames and allows detecting RENAME vs DROP+ADD.
	 * Auto-generated during pull/import if not present.
	 * @param trackingId - Unique tracking identifier (e.g., 'col_a1b2c3')
	 * @example
	 * userId: varchar('user_id').notNull().$id('col_abc123')
	 */
	$id(trackingId: string): ColumnBuilder<T, Config & {
		$trackingId: string;
	}>;
	/**
	 * Make this column GENERATED ALWAYS AS IDENTITY (PostgreSQL 10+).
	 *
	 * Creates an auto-incrementing column where values are ALWAYS generated by the database.
	 * Users cannot manually insert or update values in this column.
	 * This is the modern replacement for SERIAL types.
	 *
	 * @param options - Optional identity generation options
	 * @param options.start - Starting value (default: 1)
	 * @param options.increment - Increment between values (default: 1)
	 * @param options.minValue - Minimum value
	 * @param options.maxValue - Maximum value
	 * @param options.cache - Number of values to cache (default: 1)
	 * @param options.cycle - Allow cycling after maxValue (default: false)
	 * @returns ColumnBuilder with identity configured
	 *
	 * @example
	 * ```typescript
	 * // Basic usage - auto-incrementing bigint
	 * id: bigint().generatedAlwaysAsIdentity().primaryKey()
	 *
	 * // With options
	 * orderId: integer().generatedAlwaysAsIdentity({ start: 1000, increment: 1 })
	 *
	 * // Custom sequence behavior
	 * ticketNumber: smallint().generatedAlwaysAsIdentity({
	 *   start: 1,
	 *   increment: 1,
	 *   maxValue: 32767,
	 *   cycle: true
	 * })
	 * ```
	 *
	 * @remarks
	 * **Dialect Support:**
	 * | Dialect     | Support   | Notes                                    |
	 * |-------------|-----------|------------------------------------------|
	 * | PostgreSQL  | ✅ Full    | GENERATED ALWAYS AS IDENTITY (10+)       |
	 * | CockroachDB | ✅ Full    | Compatible                               |
	 * | Nile        | ✅ Full    | PostgreSQL 15 compatible                 |
	 * | AWS DSQL    | ✅ Full    | Supported                                |
	 * | SQLite      | ❌ None    | Use INTEGER PRIMARY KEY AUTOINCREMENT    |
	 * | Turso       | ❌ None    | Use INTEGER PRIMARY KEY AUTOINCREMENT    |
	 * | MySQL       | ❌ None    | Use AUTO_INCREMENT instead               |
	 * | MariaDB     | ❌ None    | Use AUTO_INCREMENT instead               |
	 * | PlanetScale | ❌ None    | Use AUTO_INCREMENT instead               |
	 * | Xata        | ❌ None    | Uses internal ID generation              |
	 *
	 * @since 1.0.0
	 * @see {@link generatedByDefaultAsIdentity} for allowing manual overrides
	 * @see {@link serial} for legacy SERIAL type
	 */
	generatedAlwaysAsIdentity(options?: IdentityOptions): ColumnBuilder<T, Config & {
		$identity: {
			always: true;
			options?: IdentityOptions;
		};
	}>;
	/**
	 * Make this column GENERATED BY DEFAULT AS IDENTITY (PostgreSQL 10+).
	 *
	 * Creates an auto-incrementing column where values are generated by DEFAULT.
	 * Users CAN manually insert or update values, overriding the sequence.
	 * This is similar to SERIAL behavior but with better standards compliance.
	 *
	 * @param options - Optional identity generation options
	 * @param options.start - Starting value (default: 1)
	 * @param options.increment - Increment between values (default: 1)
	 * @param options.minValue - Minimum value
	 * @param options.maxValue - Maximum value
	 * @param options.cache - Number of values to cache (default: 1)
	 * @param options.cycle - Allow cycling after maxValue (default: false)
	 * @returns ColumnBuilder with identity configured
	 *
	 * @example
	 * ```typescript
	 * // Basic usage - can be overridden with explicit values
	 * id: bigint().generatedByDefaultAsIdentity().primaryKey()
	 *
	 * // Allows: INSERT INTO table DEFAULT VALUES (uses sequence)
	 * // Allows: INSERT INTO table (id) VALUES (999) (uses explicit value)
	 * ```
	 *
	 * @remarks
	 * **Dialect Support:**
	 * | Dialect     | Support   | Notes                                    |
	 * |-------------|-----------|------------------------------------------|
	 * | PostgreSQL  | ✅ Full    | GENERATED BY DEFAULT AS IDENTITY (10+)   |
	 * | CockroachDB | ✅ Full    | Compatible                               |
	 * | Nile        | ✅ Full    | PostgreSQL 15 compatible                 |
	 * | AWS DSQL    | ✅ Full    | Supported                                |
	 * | SQLite      | ❌ None    | Use INTEGER PRIMARY KEY AUTOINCREMENT    |
	 * | Turso       | ❌ None    | Use INTEGER PRIMARY KEY AUTOINCREMENT    |
	 * | MySQL       | ❌ None    | Use AUTO_INCREMENT instead               |
	 * | MariaDB     | ❌ None    | Use AUTO_INCREMENT instead               |
	 * | PlanetScale | ❌ None    | Use AUTO_INCREMENT instead               |
	 * | Xata        | ❌ None    | Uses internal ID generation              |
	 *
	 * @since 1.0.0
	 * @see {@link generatedAlwaysAsIdentity} for strict auto-generation
	 * @see {@link serial} for legacy SERIAL type
	 */
	generatedByDefaultAsIdentity(options?: IdentityOptions): ColumnBuilder<T, Config & {
		$identity: {
			always: false;
			options?: IdentityOptions;
		};
	}>;
	/**
	 * Set the collation for this text column.
	 *
	 * Collation determines how text values are sorted and compared.
	 * Common use cases include case-insensitive sorting, locale-specific ordering,
	 * and LIKE pattern matching optimization.
	 *
	 * @param collation - The collation name
	 * @returns ColumnBuilder with collation configured
	 *
	 * @example
	 * ```typescript
	 * // Case-insensitive collation (PostgreSQL)
	 * name: varchar(100).collate('en_US.utf8')
	 *
	 * // Pattern operations optimization
	 * email: text().collate('C')
	 *
	 * // POSIX collation for byte-wise comparison
	 * code: varchar(50).collate('POSIX')
	 * ```
	 *
	 * @remarks
	 * **Dialect Support:**
	 * | Dialect     | Support   | Notes                                    |
	 * |-------------|-----------|------------------------------------------|
	 * | PostgreSQL  | ✅ Full    | Full COLLATE support                     |
	 * | CockroachDB | ✅ Full    | Compatible                               |
	 * | Nile        | ✅ Full    | PostgreSQL 15 compatible                 |
	 * | AWS DSQL    | ⚠️ Partial | Limited collation options                |
	 * | SQLite      | ⚠️ Partial | BINARY, NOCASE, RTRIM only              |
	 * | Turso       | ⚠️ Partial | BINARY, NOCASE, RTRIM only              |
	 * | MySQL       | ✅ Full    | Different collation names                |
	 * | MariaDB     | ✅ Full    | Different collation names                |
	 * | PlanetScale | ✅ Full    | Different collation names                |
	 * | Xata        | ❌ None    | Not applicable                           |
	 *
	 * @since 1.0.0
	 * @see https://www.postgresql.org/docs/current/collation.html
	 */
	collate(collation: string): ColumnBuilder<T, Config & {
		$collate: string;
	}>;
};
/** Create a fluent chainable expression for generated columns */
export declare function createFluentGenExpr(sql: string): FluentGenExpr;
/**
 * Creates an INTEGER column (4-byte signed integer, range -2147483648 to 2147483647).
 *
 * @param columnName - Optional database column name (defaults to property key)
 * @returns ColumnBuilder for INTEGER type
 *
 * @example
 * ```typescript
 * // Basic usage
 * age: integer('age'),
 *
 * // As primary key with auto-increment
 * id: serial('id').primaryKey(),
 *
 * // With type narrowing for specific ranges
 * level: integer<1 | 2 | 3>('level').check('valid_level', [1, 2, 3]),
 * ```
 *
 * @remarks
 * **Dialect Support:**
 * | Dialect     | Support | Notes                                    |
 * |-------------|---------|------------------------------------------|
 * | PostgreSQL  | ✅ Full  | Native 4-byte signed integer             |
 * | CockroachDB | ✅ Full  | Compatible                               |
 * | Nile        | ✅ Full  | PG15 compatible                          |
 * | AWS DSQL    | ✅ Full  | PG16 compatible                          |
 * | SQLite      | ⚠️ Affinity | INTEGER affinity (8-byte)             |
 * | MySQL       | ✅ Full  | Native INT                               |
 *
 * @since 1.0.0
 * @see {@link bigint} for 8-byte integers
 * @see {@link smallint} for 2-byte integers
 * @see {@link serial} for auto-incrementing integers
 */
export declare const integer: <T extends number = number>(columnName?: string) => ColumnBuilder<T, ColumnConfig<T>>;
/** Alias for {@link integer} */
export declare const int: <T extends number = number>(columnName?: string) => ColumnBuilder<T, ColumnConfig<T>>;
/** Alias for {@link integer} */
export declare const int4: <T extends number = number>(columnName?: string) => ColumnBuilder<T, ColumnConfig<T>>;
/**
 * Creates a SMALLINT column (2-byte signed integer, range -32768 to 32767).
 *
 * @param columnName - Optional database column name
 * @returns ColumnBuilder for SMALLINT type
 *
 * @example
 * ```typescript
 * priority: smallint('priority').notNull().default(0),
 * ```
 *
 * @remarks
 * **Dialect Support:**
 * | Dialect     | Support | Notes                                    |
 * |-------------|---------|------------------------------------------|
 * | PostgreSQL  | ✅ Full  | Native 2-byte signed integer             |
 * | CockroachDB | ✅ Full  | Compatible                               |
 * | Nile        | ✅ Full  | PG15 compatible                          |
 * | AWS DSQL    | ✅ Full  | PG16 compatible                          |
 * | SQLite      | ⚠️ Affinity | INTEGER affinity                      |
 * | MySQL       | ✅ Full  | Native SMALLINT                          |
 *
 * @since 1.0.0
 */
export declare const smallint: <T extends number = number>(columnName?: string) => ColumnBuilder<T, ColumnConfig<T>>;
/** Alias for {@link smallint} */
export declare const int2: <T extends number = number>(columnName?: string) => ColumnBuilder<T, ColumnConfig<T>>;
/**
 * Creates a BIGINT column (8-byte signed integer, range ±9.2 quintillion).
 *
 * @param columnName - Optional database column name
 * @returns ColumnBuilder for BIGINT type
 *
 * @example
 * ```typescript
 * // For large IDs (Twitter snowflakes, Discord IDs, etc.)
 * externalId: bigint('external_id').notNull(),
 *
 * // For epoch timestamps in milliseconds
 * createdAt: bigint('created_at').default(DEFAULT.epochNow()),
 * ```
 *
 * @remarks
 * **Dialect Support:**
 * | Dialect     | Support | Notes                                    |
 * |-------------|---------|------------------------------------------|
 * | PostgreSQL  | ✅ Full  | Native 8-byte signed integer             |
 * | CockroachDB | ✅ Full  | Compatible                               |
 * | Nile        | ✅ Full  | PG15 compatible                          |
 * | AWS DSQL    | ✅ Full  | PG16 compatible                          |
 * | SQLite      | ⚠️ Affinity | INTEGER affinity (already 8-byte)     |
 * | MySQL       | ✅ Full  | Native BIGINT                            |
 *
 * @since 1.0.0
 */
export declare const bigint: <T extends bigint = bigint>(columnName?: string) => ColumnBuilder<T, ColumnConfig<T>>;
/** Alias for {@link bigint} */
export declare const int8: <T extends bigint = bigint>(columnName?: string) => ColumnBuilder<T, ColumnConfig<T>>;
/**
 * Creates a SERIAL column (auto-incrementing 4-byte integer).
 *
 * SERIAL is shorthand for creating an INTEGER column with a sequence-based default.
 * For new schemas, consider using UUID with gen_random_uuid() for better
 * compatibility across distributed databases.
 *
 * @param columnName - Optional database column name
 * @returns ColumnBuilder for SERIAL type
 *
 * @example
 * ```typescript
 * id: serial('id').primaryKey(),
 * ```
 *
 * @remarks
 * **Dialect Support:**
 * | Dialect     | Support | Notes                                    |
 * |-------------|---------|------------------------------------------|
 * | PostgreSQL  | ✅ Full  | Sequence-based auto-increment            |
 * | CockroachDB | ⚠️ Partial | Uses unique_rowid(), non-sequential   |
 * | Nile        | ⚠️ Shared | Only on shared tables, not tenant     |
 * | AWS DSQL    | ❌ None  | Use UUID with gen_random_uuid()          |
 * | SQLite      | ⚠️ Affinity | INTEGER PRIMARY KEY for rowid       |
 * | MySQL       | ✅ Full  | AUTO_INCREMENT                           |
 *
 * @since 1.0.0
 * @see {@link uuid} for distributed-friendly primary keys
 */
export declare const serial: (columnName?: string) => ColumnBuilder<number, ColumnConfig<number>>;
/** Alias for {@link serial} */
export declare const serial4: (columnName?: string) => ColumnBuilder<number, ColumnConfig<number>>;
/**
 * Creates a SMALLSERIAL column (auto-incrementing 2-byte integer).
 *
 * @param columnName - Optional database column name
 * @returns ColumnBuilder for SMALLSERIAL type
 *
 * @remarks
 * **Dialect Support:**
 * | Dialect     | Support | Notes                                    |
 * |-------------|---------|------------------------------------------|
 * | PostgreSQL  | ✅ Full  | Sequence-based auto-increment            |
 * | CockroachDB | ⚠️ Partial | Uses unique_rowid()                   |
 * | Nile        | ⚠️ Shared | Only on shared tables                 |
 * | AWS DSQL    | ❌ None  | Use UUID                                 |
 * | SQLite      | ⚠️ Affinity | INTEGER PRIMARY KEY                  |
 * | MySQL       | ✅ Full  | SMALLINT AUTO_INCREMENT                  |
 *
 * @since 1.0.0
 */
export declare const smallserial: (columnName?: string) => ColumnBuilder<number, ColumnConfig<number>>;
/** Alias for {@link smallserial} */
export declare const serial2: (columnName?: string) => ColumnBuilder<number, ColumnConfig<number>>;
/**
 * Creates a BIGSERIAL column (auto-incrementing 8-byte integer).
 *
 * @param columnName - Optional database column name
 * @returns ColumnBuilder for BIGSERIAL type
 *
 * @remarks
 * **Dialect Support:**
 * | Dialect     | Support | Notes                                    |
 * |-------------|---------|------------------------------------------|
 * | PostgreSQL  | ✅ Full  | Sequence-based auto-increment            |
 * | CockroachDB | ⚠️ Partial | Uses unique_rowid()                   |
 * | Nile        | ⚠️ Shared | Only on shared tables                 |
 * | AWS DSQL    | ❌ None  | Use UUID                                 |
 * | SQLite      | ⚠️ Affinity | INTEGER PRIMARY KEY                  |
 * | MySQL       | ✅ Full  | BIGINT AUTO_INCREMENT                    |
 *
 * @since 1.0.0
 */
export declare const bigserial: (columnName?: string) => ColumnBuilder<bigint, ColumnConfig<bigint>>;
/** Alias for {@link bigserial} */
export declare const serial8: (columnName?: string) => ColumnBuilder<bigint, ColumnConfig<bigint>>;
/**
 * Creates an epoch timestamp column (BIGINT storing milliseconds since Unix epoch).
 *
 * This is a convenience type for storing timestamps as integers. Useful when
 * you need epoch-based timestamps for JavaScript Date interoperability.
 *
 * @param columnName - Optional database column name override
 * @returns ColumnBuilder for BIGINT type (with epoch semantics)
 *
 * @example
 * ```typescript
 * const table = defineTable('events', {
 *   createdAt: epoch().default(DEFAULT.epochNow()),
 *   updatedAt: epoch().default(DEFAULT.epochNow()),
 * });
 *
 * // Store: Date.now() or new Date().getTime()
 * // Retrieve: new Date(row.createdAt)
 * ```
 *
 * @remarks
 * **Dialect Support:**
 * | Dialect     | Support | Notes                                    |
 * |-------------|---------|------------------------------------------|
 * | PostgreSQL  | ✅ Full  | Uses BIGINT                              |
 * | CockroachDB | ✅ Full  | Uses BIGINT                              |
 * | Nile        | ✅ Full  | Uses BIGINT                              |
 * | AWS DSQL    | ✅ Full  | Uses BIGINT                              |
 * | SQLite      | ✅ Full  | Uses INTEGER (64-bit)                    |
 * | MySQL       | ✅ Full  | Uses BIGINT                              |
 *
 * @since 1.0.0
 * @see {@link timestamp} for native timestamp type
 * @see {@link timestamptz} for timezone-aware timestamps
 */
export declare const epoch: (columnName?: string) => ColumnBuilder<number, ColumnConfig<number>>;
/**
 * Creates a DECIMAL/NUMERIC column for exact numeric values.
 *
 * DECIMAL stores exact numeric values with user-specified precision and scale.
 * Essential for financial calculations where floating-point errors are unacceptable.
 *
 * @param columnNameOrOpts - Column name, precision, or options object
 * @param scale - Scale (digits after decimal point) when first arg is precision
 * @returns ColumnBuilder for DECIMAL type
 *
 * @example
 * ```typescript
 * const table = defineTable('products', {
 *   // Unlimited precision
 *   price: decimal('price'),
 *
 *   // Precision only (total digits)
 *   amount: decimal(10),
 *
 *   // Precision and scale
 *   rate: decimal(5, 2),  // DECIMAL(5,2) - up to 999.99
 *
 *   // Options object
 *   tax: decimal({ precision: 10, scale: 4 }),
 * });
 * ```
 *
 * @remarks
 * **Dialect Support:**
 * | Dialect     | Support | Notes                                    |
 * |-------------|---------|------------------------------------------|
 * | PostgreSQL  | ✅ Full  | Up to 131072 digits before, 16383 after  |
 * | CockroachDB | ✅ Full  | Same as PostgreSQL                       |
 * | Nile        | ✅ Full  | PG15 compatible                          |
 * | AWS DSQL    | ✅ Full  | PG16 compatible                          |
 * | SQLite      | ⚠️ REAL  | REAL affinity, not exact                 |
 * | MySQL       | ✅ Full  | DECIMAL(65, 30) max                      |
 *
 * @since 1.0.0
 * @see {@link real} for approximate single-precision floats
 * @see {@link doublePrecision} for approximate double-precision floats
 */
export declare const decimal: (columnNameOrOpts?: string | number | {
	precision?: number;
	scale?: number;
}, scale?: number) => ColumnBuilder<string | number>;
/** Alias for {@link decimal} - NUMERIC and DECIMAL are identical in PostgreSQL */
export declare const numeric: (columnNameOrOpts?: string | number | {
	precision?: number;
	scale?: number;
}, scale?: number) => ColumnBuilder<string | number>;
/**
 * Creates a REAL (single-precision floating-point) column.
 *
 * REAL is a 4-byte floating-point number with approximately 6 decimal digits
 * of precision. Use for scientific data where exact precision isn't critical.
 *
 * @param columnName - Optional database column name override
 * @returns ColumnBuilder for REAL type
 *
 * @example
 * ```typescript
 * const table = defineTable('sensors', {
 *   temperature: real('temperature'),  // 4-byte float
 *   humidity: real('humidity'),
 * });
 * ```
 *
 * @remarks
 * **Dialect Support:**
 * | Dialect     | Support | Notes                                    |
 * |-------------|---------|------------------------------------------|
 * | PostgreSQL  | ✅ Full  | IEEE 754 single precision                |
 * | CockroachDB | ✅ Full  | Compatible                               |
 * | Nile        | ✅ Full  | PG15 compatible                          |
 * | AWS DSQL    | ✅ Full  | PG16 compatible                          |
 * | SQLite      | ⚠️ REAL  | 8-byte double (no single precision)      |
 * | MySQL       | ✅ FLOAT | FLOAT type, similar precision            |
 *
 * **Warning:** Floating-point arithmetic can produce unexpected results.
 * For financial calculations, use {@link decimal} instead.
 *
 * @since 1.0.0
 * @see {@link doublePrecision} for double-precision floats
 * @see {@link decimal} for exact numeric values
 */
export declare const real: (columnName?: string) => ColumnBuilder<number, ColumnConfig<number>>;
/** Alias for {@link real} */
export declare const float4: (columnName?: string) => ColumnBuilder<number, ColumnConfig<number>>;
/**
 * Creates a DOUBLE PRECISION (8-byte floating-point) column.
 *
 * Double precision provides approximately 15 decimal digits of precision.
 * Use for scientific calculations requiring higher precision than REAL.
 *
 * @param columnName - Optional database column name override
 * @returns ColumnBuilder for DOUBLE PRECISION type
 *
 * @example
 * ```typescript
 * const table = defineTable('calculations', {
 *   result: doublePrecision('result'),  // 8-byte float
 *   variance: doublePrecision('variance'),
 * });
 * ```
 *
 * @remarks
 * **Dialect Support:**
 * | Dialect     | Support | Notes                                    |
 * |-------------|---------|------------------------------------------|
 * | PostgreSQL  | ✅ Full  | IEEE 754 double precision                |
 * | CockroachDB | ✅ Full  | Compatible                               |
 * | Nile        | ✅ Full  | PG15 compatible                          |
 * | AWS DSQL    | ✅ Full  | PG16 compatible                          |
 * | SQLite      | ✅ REAL  | REAL is 8-byte double                    |
 * | MySQL       | ✅ DOUBLE | DOUBLE type                             |
 *
 * **Warning:** Floating-point arithmetic can produce unexpected results.
 * For financial calculations, use {@link decimal} instead.
 *
 * @since 1.0.0
 * @see {@link real} for single-precision floats
 * @see {@link decimal} for exact numeric values
 */
export declare const doublePrecision: (columnName?: string) => ColumnBuilder<number, ColumnConfig<number>>;
/** Alias for {@link doublePrecision} */
export declare const float8: (columnName?: string) => ColumnBuilder<number, ColumnConfig<number>>;
export interface VarcharOptions {
	length?: number;
}
/**
 * Creates a VARCHAR column with optional length constraint.
 *
 * VARCHAR stores variable-length character strings. Unlike TEXT, it can have
 * a maximum length constraint. In PostgreSQL, there's no performance difference
 * between VARCHAR(n), VARCHAR, and TEXT - use length constraints for data validation.
 *
 * @typeParam T - String literal union type for compile-time value checking
 * @param arg1 - Column name, length, or options object
 * @param arg2 - Options when first arg is column name
 * @returns ColumnBuilder for VARCHAR type
 *
 * @example
 * ```typescript
 * // Basic VARCHAR (unlimited length)
 * name: varchar('name'),
 *
 * // With length constraint
 * email: varchar('email').length(255).notNull().unique(),
 *
 * // Or with length in function call
 * email: varchar(255).notNull(),
 *
 * // With type narrowing for specific values
 * status: varchar<'active' | 'inactive' | 'banned'>('status')
 *   .check('valid_status', ['active', 'inactive', 'banned']),
 * ```
 *
 * @remarks
 * **Dialect Support:**
 * | Dialect     | Support | Notes                                    |
 * |-------------|---------|------------------------------------------|
 * | PostgreSQL  | ✅ Full  | Native VARCHAR, same perf as TEXT        |
 * | CockroachDB | ✅ Full  | Compatible                               |
 * | Nile        | ✅ Full  | PG15 compatible                          |
 * | AWS DSQL    | ✅ Full  | PG16 compatible                          |
 * | SQLite      | ⚠️ Affinity | TEXT affinity, length not enforced    |
 * | MySQL       | ✅ Full  | Native VARCHAR (max 65,535)              |
 *
 * @since 1.0.0
 * @see {@link text} for unlimited-length strings
 * @see {@link char} for fixed-length strings
 */
export declare function varchar<T extends string = string>(): ColumnBuilder<T>;
export declare function varchar<T extends string = string>(length: number): ColumnBuilder<T>;
export declare function varchar<T extends string = string>(options: VarcharOptions): ColumnBuilder<T>;
export declare function varchar<T extends string = string>(columnName: string): ColumnBuilder<T>;
export declare function varchar<T extends string = string>(columnName: string, options: VarcharOptions): ColumnBuilder<T>;
export declare const characterVarying: typeof varchar;
export interface CharOptions {
	length?: number;
}
export declare function char(): ColumnBuilder<string>;
export declare function char(length: number): ColumnBuilder<string>;
export declare function char(options: CharOptions): ColumnBuilder<string>;
export declare function char(columnName: string): ColumnBuilder<string>;
export declare function char(columnName: string, options: CharOptions): ColumnBuilder<string>;
export declare const character: typeof char;
/**
 * Creates a TEXT column for unlimited-length character strings.
 *
 * TEXT can store strings of any length (up to 1GB in PostgreSQL).
 * In PostgreSQL, there's no performance difference between TEXT and VARCHAR.
 *
 * @typeParam T - String literal union type for compile-time value checking
 * @param columnName - Optional database column name
 * @returns ColumnBuilder for TEXT type
 *
 * @example
 * ```typescript
 * // Basic TEXT column
 * content: text('content'),
 *
 * // For long-form content
 * description: text('description').notNull(),
 *
 * // With type narrowing
 * category: text<'blog' | 'news' | 'docs'>('category'),
 * ```
 *
 * @remarks
 * **Dialect Support:**
 * | Dialect     | Support | Notes                                    |
 * |-------------|---------|------------------------------------------|
 * | PostgreSQL  | ✅ Full  | Native TEXT (up to 1GB)                  |
 * | CockroachDB | ✅ Full  | Compatible                               |
 * | Nile        | ✅ Full  | PG15 compatible                          |
 * | AWS DSQL    | ✅ Full  | PG16 compatible                          |
 * | SQLite      | ✅ Full  | Native TEXT                              |
 * | MySQL       | ⚠️ Variants | TEXT (64KB), MEDIUMTEXT, LONGTEXT     |
 *
 * @since 1.0.0
 * @see {@link varchar} for length-constrained strings
 */
export declare const text: <T extends string = string>(columnName?: string) => ColumnBuilder<T, ColumnConfig<T>>;
/**
 * Creates a BYTEA column for binary data.
 *
 * BYTEA stores binary strings (byte arrays). Use for file content,
 * encrypted data, or any binary blob storage.
 *
 * @param columnName - Optional database column name
 * @returns ColumnBuilder for BYTEA type
 *
 * @remarks
 * **Dialect Support:**
 * | Dialect     | Support | Notes                                    |
 * |-------------|---------|------------------------------------------|
 * | PostgreSQL  | ✅ Full  | Native BYTEA                             |
 * | CockroachDB | ✅ Full  | Compatible (BYTES alias)                 |
 * | Nile        | ✅ Full  | PG15 compatible                          |
 * | AWS DSQL    | ✅ Full  | PG16 compatible                          |
 * | SQLite      | ✅ Full  | BLOB affinity                            |
 * | MySQL       | ✅ Full  | BLOB/VARBINARY                           |
 *
 * @since 1.0.0
 */
export declare const bytea: (columnName?: string) => ColumnBuilder<Buffer<ArrayBufferLike> | Uint8Array<ArrayBufferLike>, ColumnConfig<Buffer<ArrayBufferLike> | Uint8Array<ArrayBufferLike>>>;
export interface TimestampOptions {
	precision?: number;
	withTimezone?: boolean;
}
/**
 * Creates a TIMESTAMP column (without timezone).
 *
 * TIMESTAMP stores date and time without timezone information.
 * For most applications, prefer TIMESTAMPTZ to avoid timezone ambiguity.
 *
 * @param arg1 - Column name, precision (0-6), or options object
 * @param arg2 - Options when first arg is column name
 * @returns ColumnBuilder for TIMESTAMP type
 *
 * @example
 * ```typescript
 * // Basic timestamp
 * createdAt: timestamp('created_at'),
 *
 * // With precision (microseconds)
 * eventTime: timestamp(6),
 *
 * // With timezone
 * eventTime: timestamp({ withTimezone: true }),
 * ```
 *
 * @remarks
 * **Dialect Support:**
 * | Dialect     | Support | Notes                                    |
 * |-------------|---------|------------------------------------------|
 * | PostgreSQL  | ✅ Full  | Native TIMESTAMP (0-6 precision)         |
 * | CockroachDB | ✅ Full  | Compatible                               |
 * | Nile        | ✅ Full  | PG15 compatible                          |
 * | AWS DSQL    | ✅ Full  | PG16 compatible                          |
 * | SQLite      | ⚠️ Affinity | TEXT/REAL/INTEGER affinity            |
 * | MySQL       | ✅ Full  | Native TIMESTAMP (0-6 precision)         |
 *
 * @since 1.0.0
 * @see {@link timestamptz} for timezone-aware timestamps
 */
export declare function timestamp(): ColumnBuilder<Date>;
export declare function timestamp(precision: number): ColumnBuilder<Date>;
export declare function timestamp(options: TimestampOptions): ColumnBuilder<Date>;
export declare function timestamp(columnName: string): ColumnBuilder<Date>;
export declare function timestamp(columnName: string, options: TimestampOptions): ColumnBuilder<Date>;
/**
 * Creates a TIMESTAMPTZ column (timestamp with timezone).
 *
 * TIMESTAMPTZ stores date/time with timezone awareness. This is the recommended
 * type for most timestamp needs as it handles timezone conversions automatically.
 * The value is stored in UTC and converted to the session's timezone on retrieval.
 *
 * @param arg1 - Column name, precision (0-6), or options object
 * @param arg2 - Options when first arg is column name
 * @returns ColumnBuilder for TIMESTAMPTZ type
 *
 * @example
 * ```typescript
 * // Basic timestamptz (recommended for most use cases)
 * createdAt: timestamptz('created_at').default(DEFAULT.now()),
 *
 * // With precision
 * eventTime: timestamptz(3),  // millisecond precision
 *
 * // Common pattern for timestamps
 * createdAt: timestamptz('created_at').default(DEFAULT.now()).notNull(),
 * updatedAt: timestamptz('updated_at').default(DEFAULT.now()).notNull(),
 * ```
 *
 * @remarks
 * **Dialect Support:**
 * | Dialect     | Support | Notes                                    |
 * |-------------|---------|------------------------------------------|
 * | PostgreSQL  | ✅ Full  | Native TIMESTAMPTZ, stores in UTC        |
 * | CockroachDB | ✅ Full  | Compatible                               |
 * | Nile        | ✅ Full  | PG15 compatible                          |
 * | AWS DSQL    | ✅ Full  | PG16 compatible                          |
 * | SQLite      | ⚠️ Affinity | Use TEXT with ISO format              |
 * | MySQL       | ⚠️ Partial | TIMESTAMP with @@time_zone             |
 *
 * @since 1.0.0
 * @see {@link timestamp} for timezone-naive timestamps
 */
export declare function timestamptz(): ColumnBuilder<Date>;
export declare function timestamptz(precision: number): ColumnBuilder<Date>;
export declare function timestamptz(options: {
	precision?: number;
}): ColumnBuilder<Date>;
export declare function timestamptz(columnName: string): ColumnBuilder<Date>;
export declare function timestamptz(columnName: string, options: {
	precision?: number;
}): ColumnBuilder<Date>;
export declare const timestampWithTimeZone: typeof timestamptz;
/**
 * Creates a DATE column for calendar dates.
 *
 * DATE stores only the date portion (year, month, day) without any time component.
 * Uses 4 bytes of storage. Range: 4713 BC to 5874897 AD.
 *
 * @param columnName - Optional database column name override
 * @returns ColumnBuilder for DATE type
 *
 * @example
 * ```typescript
 * const table = defineTable('events', {
 *   eventDate: date('event_date').notNull(),
 *   birthDate: date('birth_date'),
 * });
 *
 * // Insert: '2024-01-15' or new Date()
 * // Query: WHERE event_date = '2024-01-15'
 * // Range: WHERE event_date BETWEEN '2024-01-01' AND '2024-12-31'
 * ```
 *
 * @remarks
 * **Dialect Support:**
 * | Dialect     | Support | Notes                                    |
 * |-------------|---------|------------------------------------------|
 * | PostgreSQL  | ✅ Full  | Native DATE type                         |
 * | CockroachDB | ✅ Full  | Compatible                               |
 * | Nile        | ✅ Full  | PG15 compatible                          |
 * | AWS DSQL    | ✅ Full  | PG16 compatible                          |
 * | SQLite      | ⚠️ Affinity | TEXT affinity, stored as ISO8601      |
 * | MySQL       | ✅ Full  | Native DATE type                         |
 *
 * @since 1.0.0
 * @see {@link timestamp} for date with time
 * @see {@link timestamptz} for timezone-aware date and time
 */
export declare const date: (columnName?: string) => ColumnBuilder<string | Date, ColumnConfig<string | Date>>;
export declare function time(columnName?: string, opts?: {
	precision?: number;
	withTimezone?: boolean;
}): ColumnBuilder<string>;
export declare function time(opts?: {
	precision?: number;
	withTimezone?: boolean;
}): ColumnBuilder<string>;
export declare function timetz(columnName?: string, opts?: {
	precision?: number;
}): ColumnBuilder<string>;
export declare function timetz(opts?: {
	precision?: number;
}): ColumnBuilder<string>;
export declare const timeWithTimeZone: typeof timetz;
export declare function interval(columnName?: string, fields?: string): ColumnBuilder<string>;
export declare function interval(fields?: string): ColumnBuilder<string>;
/**
 * Creates a BOOLEAN column for true/false values.
 *
 * @param columnName - Optional database column name
 * @returns ColumnBuilder for BOOLEAN type
 *
 * @example
 * ```typescript
 * isActive: boolean('is_active').notNull().default(true),
 * verified: boolean('verified').default(false),
 * ```
 *
 * @remarks
 * **Dialect Support:**
 * | Dialect     | Support | Notes                                    |
 * |-------------|---------|------------------------------------------|
 * | PostgreSQL  | ✅ Full  | Native BOOLEAN                           |
 * | CockroachDB | ✅ Full  | Compatible                               |
 * | Nile        | ✅ Full  | PG15 compatible                          |
 * | AWS DSQL    | ✅ Full  | PG16 compatible                          |
 * | SQLite      | ⚠️ Affinity | INTEGER (0/1)                         |
 * | MySQL       | ⚠️ Alias | TINYINT(1)                              |
 *
 * @since 1.0.0
 */
export declare const boolean: (columnName?: string) => ColumnBuilder<boolean, ColumnConfig<boolean>>;
/** Alias for {@link boolean} */
export declare const bool: (columnName?: string) => ColumnBuilder<boolean, ColumnConfig<boolean>>;
/**
 * Creates a CIDR column for IPv4/IPv6 network addresses with netmask.
 *
 * @param columnName - Optional database column name
 * @returns ColumnBuilder for CIDR type
 *
 * @example
 * ```typescript
 * subnet: cidr('subnet'),
 * // Value: '192.168.1.0/24'
 * ```
 *
 * @remarks
 * **Dialect Support:**
 * | Dialect     | Support | Notes                                    |
 * |-------------|---------|------------------------------------------|
 * | PostgreSQL  | ✅ Full  | Native network type                      |
 * | CockroachDB | ❌ None  | Use TEXT                                 |
 * | Nile        | ✅ Full  | PG15 compatible                          |
 * | AWS DSQL    | ❌ None  | Use TEXT                                 |
 * | SQLite      | ❌ None  | Use TEXT                                 |
 * | MySQL       | ❌ None  | Use VARCHAR                              |
 *
 * @since 1.0.0
 */
export declare const cidr: (columnName?: string) => ColumnBuilder<string, ColumnConfig<string>>;
/**
 * Creates an INET column for IPv4/IPv6 host addresses.
 *
 * @param columnName - Optional database column name
 * @returns ColumnBuilder for INET type
 *
 * @example
 * ```typescript
 * ipAddress: inet('ip_address'),
 * // Value: '192.168.1.1' or '192.168.1.1/24'
 * ```
 *
 * @remarks
 * **Dialect Support:**
 * | Dialect     | Support | Notes                                    |
 * |-------------|---------|------------------------------------------|
 * | PostgreSQL  | ✅ Full  | Native network type                      |
 * | CockroachDB | ✅ Full  | Compatible                               |
 * | Nile        | ✅ Full  | PG15 compatible                          |
 * | AWS DSQL    | ❌ None  | Use TEXT                                 |
 * | SQLite      | ❌ None  | Use TEXT                                 |
 * | MySQL       | ❌ None  | Use VARCHAR                              |
 *
 * @since 1.0.0
 */
export declare const inet: (columnName?: string) => ColumnBuilder<string, ColumnConfig<string>>;
/**
 * Creates a MACADDR column for MAC addresses (6 bytes).
 *
 * @remarks
 * **Dialect Support:** PostgreSQL ✅ | CockroachDB ❌ | Nile ✅ | DSQL ✅
 * @since 1.0.0
 */
export declare const macaddr: (columnName?: string) => ColumnBuilder<string, ColumnConfig<string>>;
/**
 * Creates a MACADDR8 column for EUI-64 MAC addresses (8 bytes).
 *
 * @remarks
 * **Dialect Support:** PostgreSQL ✅ | CockroachDB ❌ | Nile ✅ | DSQL ❌
 * @since 1.0.0
 */
export declare const macaddr8: (columnName?: string) => ColumnBuilder<string, ColumnConfig<string>>;
/**
 * Creates a BIT column for fixed-length bit strings.
 *
 * @param length - Number of bits (default: 1)
 * @returns ColumnBuilder for BIT type
 *
 * @remarks
 * **Dialect Support:**
 * | Dialect     | Support | Notes                                    |
 * |-------------|---------|------------------------------------------|
 * | PostgreSQL  | ✅ Full  | Native bit string                        |
 * | CockroachDB | ✅ Full  | Compatible                               |
 * | Nile        | ✅ Full  | PG15 compatible                          |
 * | AWS DSQL    | ✅ Full  | PG16 compatible                          |
 * | SQLite      | ❌ None  | Use INTEGER or TEXT                      |
 * | MySQL       | ✅ Full  | BIT(M) up to 64 bits                     |
 *
 * @since 1.0.0
 */
export declare const bit: (length?: number) => ColumnBuilder<string, ColumnConfig<string>>;
/**
 * Creates a BIT VARYING column for variable-length bit strings.
 *
 * @param length - Maximum number of bits (optional)
 * @returns ColumnBuilder for BIT VARYING type
 *
 * @remarks
 * **Dialect Support:** PostgreSQL ✅ | CockroachDB ✅ | Nile ✅ | DSQL ✅
 * @since 1.0.0
 */
export declare const bitVarying: (length?: number) => ColumnBuilder<string, ColumnConfig<string>>;
/** Alias for {@link bitVarying} */
export declare const varbit: (length?: number) => ColumnBuilder<string, ColumnConfig<string>>;
/**
 * Creates a TSVECTOR column for full-text search document vectors.
 *
 * TSVECTOR stores a sorted list of distinct lexemes (words) that have been
 * normalized for text search. Use with GIN indexes for fast full-text search.
 *
 * @param columnName - Optional database column name
 * @returns ColumnBuilder for TSVECTOR type
 *
 * @example
 * ```typescript
 * // Full-text search column
 * searchVector: tsvector('search_vector'),
 *
 * // With generated column for auto-updating
 * generatedAs: (t, As) => [
 *   As.on(t.searchVector).as(t.title.toTsvector('english'))
 * ],
 *
 * // With GIN index
 * index('idx_search').on(table.searchVector).using('GIN'),
 * ```
 *
 * @remarks
 * **Dialect Support:**
 * | Dialect     | Support | Notes                                    |
 * |-------------|---------|------------------------------------------|
 * | PostgreSQL  | ✅ Full  | Native FTS with GIN indexing             |
 * | CockroachDB | ✅ Full  | Compatible with inverted indexes         |
 * | Nile        | ✅ Full  | PG15 compatible                          |
 * | AWS DSQL    | ❌ None  | Use external search (OpenSearch)         |
 * | SQLite      | ❌ None  | Use FTS5 extension                       |
 * | MySQL       | ❌ None  | Use FULLTEXT indexes                     |
 *
 * @since 1.0.0
 * @see {@link tsquery} for search queries
 */
export declare const tsvector: (columnName?: string) => ColumnBuilder<string, ColumnConfig<string>>;
/**
 * Creates a TSQUERY column for full-text search queries.
 *
 * TSQUERY represents a text search query with operators like & (AND),
 * | (OR), ! (NOT), and <-> (followed by).
 *
 * @param columnName - Optional database column name
 * @returns ColumnBuilder for TSQUERY type
 *
 * @example
 * ```typescript
 * savedQuery: tsquery('saved_query'),
 * // Value: 'fat & (rat | cat)'
 * ```
 *
 * @remarks
 * **Dialect Support:**
 * | Dialect     | Support | Notes                                    |
 * |-------------|---------|------------------------------------------|
 * | PostgreSQL  | ✅ Full  | Native FTS query type                    |
 * | CockroachDB | ✅ Full  | Compatible                               |
 * | Nile        | ✅ Full  | PG15 compatible                          |
 * | AWS DSQL    | ❌ None  | Use external search                      |
 * | SQLite      | ❌ None  | Use FTS5 MATCH syntax                    |
 * | MySQL       | ❌ None  | Use MATCH...AGAINST syntax               |
 *
 * @since 1.0.0
 * @see {@link tsvector} for document vectors
 */
export declare const tsquery: (columnName?: string) => ColumnBuilder<string, ColumnConfig<string>>;
/**
 * Creates a UUID column for universally unique identifiers.
 *
 * UUID is the recommended primary key type for distributed systems and
 * multi-database deployments. Use with gen_random_uuid() for auto-generation.
 *
 * @param columnName - Optional database column name
 * @returns ColumnBuilder for UUID type
 *
 * @example
 * ```typescript
 * // Primary key with auto-generated UUID
 * id: uuid('id').default(DEFAULT.genRandomUuid()).primaryKey(),
 *
 * // Foreign key reference
 * userId: uuid('user_id').notNull().references(() => users.id),
 * ```
 *
 * @remarks
 * **Dialect Support:**
 * | Dialect     | Support | Notes                                    |
 * |-------------|---------|------------------------------------------|
 * | PostgreSQL  | ✅ Full  | Native UUID type                         |
 * | CockroachDB | ✅ Full  | Compatible, gen_random_uuid() supported  |
 * | Nile        | ✅ Full  | PG15 compatible                          |
 * | AWS DSQL    | ✅ Full  | Recommended for PKs over SERIAL          |
 * | SQLite      | ⚠️ TEXT | Use TEXT with manual UUID generation     |
 * | MySQL       | ⚠️ CHAR | CHAR(36) or BINARY(16)                   |
 *
 * @since 1.0.0
 * @see {@link DEFAULT.genRandomUuid} for auto-generated UUIDs
 */
export declare const uuid: (columnName?: string) => ColumnBuilder<string, ColumnConfig<string>>;
/**
 * Creates a JSON column for storing JSON data (text format).
 *
 * JSON stores data as text and parses it on each access.
 * For better performance and indexing, prefer JSONB.
 *
 * @typeParam T - TypeScript type for the JSON structure
 * @param columnName - Optional database column name
 * @returns ColumnBuilder for JSON type
 *
 * @example
 * ```typescript
 * // Basic JSON
 * metadata: json('metadata'),
 *
 * // Typed JSON
 * settings: json<UserSettings>('settings'),
 * ```
 *
 * @remarks
 * **Dialect Support:**
 * | Dialect     | Support | Notes                                    |
 * |-------------|---------|------------------------------------------|
 * | PostgreSQL  | ✅ Full  | Native JSON (text storage)               |
 * | CockroachDB | ✅ Full  | Compatible                               |
 * | Nile        | ✅ Full  | PG15 compatible                          |
 * | AWS DSQL    | ❌ Column | Store as TEXT, cast to json at query   |
 * | SQLite      | ⚠️ JSON1 | json1 extension, TEXT storage           |
 * | MySQL       | ⚠️ JSON | Native JSON type                        |
 *
 * @since 1.0.0
 * @see {@link jsonb} for binary JSON with better performance
 */
export declare const json: <T = unknown>(columnName?: string) => ColumnBuilder<T, ColumnConfig<T>>;
/**
 * Creates a JSONB column for storing JSON data (binary format).
 *
 * JSONB stores JSON in a decomposed binary format with faster access,
 * GIN indexing support, and deduplication. Preferred over JSON for most uses.
 *
 * @typeParam T - TypeScript type for the JSON structure
 * @param columnName - Optional database column name
 * @returns ColumnBuilder for JSONB type
 *
 * @example
 * ```typescript
 * // Basic JSONB
 * metadata: jsonb('metadata'),
 *
 * // Typed JSONB with default
 * settings: jsonb<UserSettings>('settings').default(DEFAULT.emptyJsonb()),
 *
 * // With GIN index for fast lookups
 * // (in indexes callback)
 * index('idx_metadata').on(table.metadata).using('GIN'),
 * ```
 *
 * @remarks
 * **Dialect Support:**
 * | Dialect     | Support | Notes                                    |
 * |-------------|---------|------------------------------------------|
 * | PostgreSQL  | ✅ Full  | Native JSONB with GIN indexing           |
 * | CockroachDB | ✅ Full  | Full JSONB with inverted indexes         |
 * | Nile        | ✅ Full  | PG15 compatible                          |
 * | AWS DSQL    | ❌ Column | Store as TEXT, cast: col::jsonb         |
 * | SQLite      | ⚠️ JSON1 | json1 extension, TEXT storage           |
 * | MySQL       | ⚠️ JSON | Native JSON, no binary variant          |
 *
 * @since 1.0.0
 * @see {@link json} for text-based JSON
 */
export declare const jsonb: <T = unknown>(columnName?: string) => ColumnBuilder<T, ColumnConfig<T>>;
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
export interface ParsedEnum {
	name: string;
	schema?: string;
	values: string[];
	/** Tracking ID for rename detection in versioning */
	trackingId?: string;
}
export interface ParsedDomain {
	name: string;
	schema?: string;
	baseType: string;
	notNull: boolean;
	defaultValue?: string;
	checkExpression?: string;
	checkName?: string;
	/** Tracking ID for rename detection in versioning */
	trackingId?: string;
}
export interface ParsedView {
	name: string;
	schema?: string;
	definition: string;
	isMaterialized: boolean;
	/** For materialized views: WITH DATA or WITH NO DATA */
	withData?: boolean;
	/** Tracking ID for rename detection in versioning */
	trackingId?: string;
}
export interface ParsedFunction {
	name: string;
	schema?: string;
	args: {
		name?: string;
		type: string;
		mode?: string;
		default?: string;
	}[];
	returnType: string;
	language: string;
	body: string;
	volatility?: "VOLATILE" | "STABLE" | "IMMUTABLE";
	isStrict: boolean;
	securityDefiner: boolean;
	/** Comment for the function */
	comment?: string;
	/** Tracking ID for rename detection in versioning */
	trackingId?: string;
}
export interface ParsedTrigger {
	name: string;
	table: string;
	timing: "BEFORE" | "AFTER" | "INSTEAD OF";
	events: ("INSERT" | "UPDATE" | "DELETE" | "TRUNCATE")[];
	forEach: "ROW" | "STATEMENT";
	functionName: string;
	whenClause?: string;
	isConstraint: boolean;
	deferrable?: boolean;
	initiallyDeferred?: boolean;
	/** Comment for the trigger */
	comment?: string;
	/** Tracking ID for rename detection in versioning */
	trackingId?: string;
}
export interface ParsedSequence {
	name: string;
	schema?: string;
	startValue?: number;
	increment?: number;
	minValue?: number;
	maxValue?: number;
	cache?: number;
	cycle: boolean;
	ownedBy?: {
		table: string;
		column: string;
	};
	/** Tracking ID for rename detection in versioning */
	trackingId?: string;
}
/**
 * Composite type (CREATE TYPE ... AS)
 */
export interface ParsedCompositeType {
	name: string;
	schema?: string;
	attributes: Array<{
		name: string;
		type: string;
		collation?: string;
	}>;
	/** Tracking ID for rename detection in versioning */
	trackingId?: string;
}
export interface DomainConfig<T> {
	/** Domain type name */
	$domainName: string;
	/** Base type */
	$baseType: string;
	/** Constraints */
	$constraints?: string[];
	/** Default value */
	$domainDefault?: T;
	/** Whether NULL is allowed */
	$notNull?: boolean;
	/** Collation */
	$collation?: string;
	/** Base ColumnBuilder for type inference */
	$columnBuilder?: ColumnBuilder<T>;
	$trackingId?: string;
	/** Returns AST for schema diffing and migration generation */
	toAST(): ParsedDomain;
	/** Set tracking ID for rename detection */
	$id(trackingId: string): DomainConfig<T>;
}
/**
 * Domain check condition - represents a CHECK constraint expression
 * Can be combined with .and() / .or() and optionally named with .as()
 */
export interface DomainCheckCondition {
	/** The SQL expression */
	$sql: string;
	/** Optional constraint name */
	$name?: string;
	/** JS validation function */
	$validate: (val: any) => boolean;
	/** Combine with AND */
	and(other: DomainCheckCondition): DomainCheckCondition;
	/** Combine with OR */
	or(other: DomainCheckCondition): DomainCheckCondition;
	/** Give the constraint a name */
	as(name: string): DomainCheckCondition;
}
/**
 * Domain VALUE expression - provides typed methods for domain check constraints
 * VALUE is the PostgreSQL keyword for the domain input value
 *
 * @example
 * // Check that percentage is between 0 and 100
 * (value) => [value.gte('0').and(value.lte('100'))]
 */
export interface DomainValueExpr<T> {
	/**
	 * Equals - SQL: `VALUE = n`
	 * @example value.eq('100') // VALUE = '100'
	 */
	eq(value: T | string): DomainCheckCondition;
	/**
	 * Not equals - SQL: `VALUE <> n`
	 * @example value.neq('0') // VALUE <> '0'
	 */
	neq(value: T | string): DomainCheckCondition;
	/**
	 * Greater than - SQL: `VALUE > n`
	 * @example value.gt('0') // VALUE > 0
	 */
	gt(value: T | string): DomainCheckCondition;
	/**
	 * Greater than or equal - SQL: `VALUE >= n`
	 * @example value.gte('0') // VALUE >= 0
	 */
	gte(value: T | string): DomainCheckCondition;
	/**
	 * Less than - SQL: `VALUE < n`
	 * @example value.lt('100') // VALUE < 100
	 */
	lt(value: T | string): DomainCheckCondition;
	/**
	 * Less than or equal - SQL: `VALUE <= n`
	 * @example value.lte('100') // VALUE <= 100
	 */
	lte(value: T | string): DomainCheckCondition;
	/**
	 * Between range - SQL: `VALUE BETWEEN min AND max`
	 * @example value.between('0', '100') // VALUE BETWEEN 0 AND 100
	 */
	between(min: T | string, max: T | string): DomainCheckCondition;
	/**
	 * In list - SQL: `VALUE IN (v1, v2, ...)`
	 * @example value.in(['active', 'pending']) // VALUE IN ('active', 'pending')
	 */
	in(values: (T | string)[]): DomainCheckCondition;
	/**
	 * Not in list - SQL: `VALUE NOT IN (v1, v2, ...)`
	 * @example value.notIn(['deleted', 'banned']) // VALUE NOT IN ('deleted', 'banned')
	 */
	notIn(values: (T | string)[]): DomainCheckCondition;
	/**
	 * Is null - SQL: `VALUE IS NULL`
	 */
	isNull(): DomainCheckCondition;
	/**
	 * Is not null - SQL: `VALUE IS NOT NULL`
	 */
	isNotNull(): DomainCheckCondition;
	/**
	 * Like pattern (case sensitive) - SQL: `VALUE LIKE 'pattern'`
	 * @example value.like('%@gmail.com') // VALUE LIKE '%@gmail.com'
	 */
	like(pattern: string): DomainCheckCondition;
	/**
	 * Not like pattern - SQL: `VALUE NOT LIKE 'pattern'`
	 * @example value.notLike('%..%') // VALUE NOT LIKE '%..%'
	 */
	notLike(pattern: string): DomainCheckCondition;
	/**
	 * Like pattern (case insensitive) - SQL: `VALUE ILIKE 'pattern'`
	 * @example value.ilike('%test%') // VALUE ILIKE '%test%'
	 */
	ilike(pattern: string): DomainCheckCondition;
	/**
	 * Not like pattern (case insensitive) - SQL: `VALUE NOT ILIKE 'pattern'`
	 * @example value.notIlike('%test%') // VALUE NOT ILIKE '%test%'
	 */
	notIlike(pattern: string): DomainCheckCondition;
	/**
	 * Regex match (case insensitive) - SQL: `VALUE ~* 'regex'`
	 * @example value.matches('^[a-z0-9]+$') // VALUE ~* '^[a-z0-9]+$'
	 */
	matches(regex: string): DomainCheckCondition;
	/**
	 * Regex match (case sensitive) - SQL: `VALUE ~ 'regex'`
	 * @example value.matchesCaseSensitive('^[A-Z]+$') // VALUE ~ '^[A-Z]+$'
	 */
	matchesCaseSensitive(regex: string): DomainCheckCondition;
	/**
	 * Length greater than - SQL: `LENGTH(VALUE) > n`
	 * @example value.lengthGt(5) // LENGTH(VALUE) > 5
	 */
	lengthGt(n: number): DomainCheckCondition;
	/**
	 * Length greater than or equal - SQL: `LENGTH(VALUE) >= n`
	 * @example value.lengthGte(1) // LENGTH(VALUE) >= 1
	 */
	lengthGte(n: number): DomainCheckCondition;
	/**
	 * Length less than - SQL: `LENGTH(VALUE) < n`
	 * @example value.lengthLt(256) // LENGTH(VALUE) < 256
	 */
	lengthLt(n: number): DomainCheckCondition;
	/**
	 * Length less than or equal - SQL: `LENGTH(VALUE) <= n`
	 * @example value.lengthLte(100) // LENGTH(VALUE) <= 100
	 */
	lengthLte(n: number): DomainCheckCondition;
	/**
	 * Length equals - SQL: `LENGTH(VALUE) = n`
	 * @example value.lengthEq(10) // LENGTH(VALUE) = 10
	 */
	lengthEq(n: number): DomainCheckCondition;
}
/**
 * Define a PostgreSQL domain type (constrained base type)
 * @param name - Domain type name
 * @param baseType - Base type as ColumnBuilder (e.g., integer(), text(), numeric().precision(5).scale(2))
 * @param checks - Optional callback to define CHECK constraints using typed DomainValueExpr
 * @example
 * // Simple domain with no constraints
 * export const emailDomain = pgDomain('email', citext());
 *
 * // Domain with check constraint
 * export const positiveDomain = pgDomain('positive_int',
 *     integer(),
 *     (value) => [value.gt(0)]
 * );
 *
 * // Domain with compound check and name
 * export const percentageDomain = pgDomain('percentage',
 *     numeric().precision(5).scale(2),
 *     (value) => [value.gte(0).and(value.lte(100)).as('valid_percentage')]
 * );
 *
 * // Use in table
 * email: emailDomain('email').notNull()
 */
export declare function pgDomain<T>(name: string, baseType: ColumnBuilder<T>, checks?: (value: DomainValueExpr<T>) => DomainCheckCondition[]): ((columnName?: string) => ColumnBuilder<T>) & DomainConfig<T>;
/**
 * Generate CREATE DOMAIN SQL
 */
export declare function generateDomainSQL<T>(domain: DomainConfig<T>): string;
export interface CompositeTypeConfig<T extends Record<string, ColumnConfig>> {
	/** Composite type name */
	$typeName: string;
	/** Fields/attributes of the composite type */
	$fields: T;
	/** Infer TypeScript type */
	$inferType: {
		[K in keyof T]: T[K] extends ColumnConfig<infer U> ? U : unknown;
	};
	$trackingId?: string;
	/** Returns AST for schema diffing and migration generation */
	toAST(): ParsedCompositeType;
	/** Set tracking ID for rename detection */
	$id(trackingId: string): CompositeTypeConfig<T>;
}
/**
 * Define a PostgreSQL composite type
 * @param name - Composite type name
 * @param fields - Object defining the composite type fields
 * @example
 * // Define composite type
 * export const addressType = pgComposite('address_type', {
 *     street: text(),
 *     city: text(),
 *     state: varchar().length(2),
 *     zip: varchar().length(10),
 *     country: varchar().length(2).default('US'),
 * });
 *
 * // Use in table
 * address: addressType('address')
 * addresses: addressType('addresses').array()
 *
 * // Get TypeScript type
 * type Address = typeof addressType.$inferType;
 */
export declare function pgComposite<T extends Record<string, ColumnConfig>>(name: string, fields: T): ((columnName?: string) => ColumnBuilder<{
	[K in keyof T]: T[K] extends ColumnConfig<infer U> ? U : unknown;
}>) & CompositeTypeConfig<T>;
/**
 * Generate CREATE TYPE ... AS SQL for composite type
 */
export declare function generateCompositeTypeSQL<T extends Record<string, ColumnConfig>>(composite: CompositeTypeConfig<T>): string;
/**
 * Create a column with a custom PostgreSQL type.
 * Only use this for types not covered by dedicated builders.
 *
 * Prefer: `pgEnum`, `pgDomain`, `pgComposite`, or the dedicated column type functions.
 *
 * @deprecated Long-term deprecation — this fallback will be removed once all
 * PostgreSQL types have dedicated builders. Migrate to the appropriate builder
 * when one becomes available for your type.
 *
 * @param typeName - The PostgreSQL type name
 * @param columnName - Optional explicit column name
 * @example
 * // Basic usage (for types without a dedicated builder)
 * data: customType('my_custom_type')
 * // With column name
 * data: customType<MyType>('my_custom_type', 'data_column')
 * // With chaining
 * data: customType('my_type').notNull().array()
 */
export declare const customType: <T = string>(typeName: string, columnName?: string) => ColumnBuilder<T, ColumnConfig<T>>;
/** SQL expression brand - marks a value as SQL expression for runtime detection */
export declare const SQL_BRAND: unique symbol;
export type SqlExpression<T> = T & {
	readonly [SQL_BRAND]: true;
	readonly $sql: string;
};
/**
 * Use gen_random_uuid() as default value for UUID columns
 * @returns SqlExpression<string> - compatible with uuid().default()
 */
export declare const genRandomUuid: () => SqlExpression<string>;
/**
 * Use NOW() as default value for timestamp columns
 * @returns SqlExpression<Date> - compatible with timestamp().default()
 */
export declare const now: () => SqlExpression<Date>;
/**
 * Use CURRENT_TIMESTAMP as default value for timestamp columns
 * @returns SqlExpression<Date> - compatible with timestamp().default()
 */
export declare const currentTimestamp: () => SqlExpression<Date>;
/**
 * Use CURRENT_DATE as default value for date columns
 * @returns SqlExpression<Date | string> - compatible with date().default()
 */
export declare const currentDate: () => SqlExpression<Date | string>;
/**
 * Empty JSON object '{}' as default value
 * Returns a typed marker that gets serialized to '{}' in SQL
 * @example jsonb<MyType>().default(emptyObject())
 */
export declare const emptyObject: <T = Record<string, unknown>>() => SqlExpression<T>;
/**
 * Empty JSON array '[]' as default value
 * Returns a typed marker that gets serialized to '[]' in SQL
 * @example tags: text().array().default(emptyArray())
 */
export declare const emptyArray: <T = unknown[]>() => SqlExpression<T>;
/**
 * SQL expression for default value
 * Returns a typed SqlExpression
 */
export declare function sql<T = unknown>(strings: TemplateStringsArray, ...values: unknown[]): SqlExpression<T>;
/**
 * Raw SQL expression wrapper
 */
export declare const raw: <T = unknown>(expression: string) => SqlExpression<T>;
export interface IndexDef {
	name: string;
	columns: string[];
	unique?: boolean;
	isUnique?: boolean;
	using?: string;
	method?: string;
	where?: string;
}
export interface IndexOnResult {
	name: string;
	columns: string[];
	unique(): IndexDef;
	using(method: "BTREE" | "HASH" | "GIN" | "GIST" | "BRIN" | "SPGIST"): IndexDef;
}
export declare const index: (name: string) => {
	name: string;
	on: (...columns: string[]) => IndexOnResult;
};
/**
 * Core SQL Expression Types & Helpers
 *
 * Provides the foundational types and factory functions used by all
 * sql-expressions sub-modules: SqlExpr, ColumnRef, OrderedColumnRef,
 * and their associated factory/helper functions.
 *
 * @module schema-definition/sql-expressions/sql-expr-core
 * @internal
 */
/** Represents a SQL expression that can be used in DDL */
export interface SqlExpr {
	/** The SQL string representation */
	readonly $sql: string;
	/** Brand to distinguish from plain strings */
	readonly $expr: true;
}
/** Column reference in expressions with ordering support */
export interface ColumnRef extends SqlExpr {
	readonly $column: string;
	/** Sort descending */
	desc(): OrderedColumnRef;
	/** Sort ascending (default) */
	asc(): OrderedColumnRef;
}
/** Column reference with ordering applied */
export interface OrderedColumnRef extends SqlExpr {
	readonly $column: string;
	/** NULLS LAST - nulls appear after all non-null values */
	nullsLast(): SqlExpr;
	/** NULLS FIRST - nulls appear before all non-null values */
	nullsFirst(): SqlExpr;
}
/** Extract the SQL string from a SqlExpr */
export declare function getSql(expression: SqlExpr): string;
/**
 * Base SQL function signatures: string, numeric, date/time, type casting, null handling.
 *
 * @see SqlFunctionsAdvanced for JSON, array, FTS, and other advanced functions
 * @see SqlFunctions for the composite interface
 */
export interface SqlFunctionsBase {
	/**
	 * Convert string to lowercase.
	 * @param col - Column or expression
	 * @example lower(col('email')) → LOWER("email")
	 */
	lower(col: ColumnRef | SqlExpr): SqlExpr;
	/**
	 * Convert string to uppercase.
	 * @param col - Column or expression
	 * @example upper(col('name')) → UPPER("name")
	 */
	upper(col: ColumnRef | SqlExpr): SqlExpr;
	/**
	 * Remove leading and trailing whitespace.
	 * @param col - Column or expression
	 * @example trim(col('input')) → TRIM("input")
	 */
	trim(col: ColumnRef | SqlExpr): SqlExpr;
	/**
	 * Remove leading whitespace.
	 * @param col - Column or expression
	 * @example ltrim(col('input')) → LTRIM("input")
	 */
	ltrim(col: ColumnRef | SqlExpr): SqlExpr;
	/**
	 * Remove trailing whitespace.
	 * @param col - Column or expression
	 * @example rtrim(col('input')) → RTRIM("input")
	 */
	rtrim(col: ColumnRef | SqlExpr): SqlExpr;
	/**
	 * Get string length in characters.
	 * @param col - Column or expression
	 * @example length(col('name')) → LENGTH("name")
	 */
	length(col: ColumnRef | SqlExpr): SqlExpr;
	/**
	 * Extract substring from a string.
	 * @param col - Column or expression
	 * @param start - Start position (1-indexed)
	 * @param length - Optional length of substring
	 * @example substring(col('name'), 1, 3) → SUBSTRING("name" FROM 1 FOR 3)
	 */
	substring(col: ColumnRef | SqlExpr, start: number, length?: number): SqlExpr;
	/**
	 * Concatenate multiple strings.
	 * @param args - Columns, expressions, or string literals to concatenate
	 * @example concat(col('first'), ' ', col('last')) → CONCAT("first", ' ', "last")
	 */
	concat(...args: (ColumnRef | SqlExpr | string)[]): SqlExpr;
	/**
	 * Replace all occurrences of a substring.
	 * @param col - Column or expression
	 * @param from - String to replace
	 * @param to - Replacement string
	 * @example replace(col('text'), 'old', 'new') → REPLACE("text", 'old', 'new')
	 */
	replace(col: ColumnRef | SqlExpr, from: string, to: string): SqlExpr;
	/**
	 * Get leftmost n characters of string.
	 * @param col - Column or expression
	 * @param n - Number of characters
	 * @example left(col('name'), 3) → LEFT("name", 3)
	 */
	left(col: ColumnRef | SqlExpr, n: number): SqlExpr;
	/**
	 * Get rightmost n characters of string.
	 * @param col - Column or expression
	 * @param n - Number of characters
	 * @example right(col('name'), 3) → RIGHT("name", 3)
	 */
	right(col: ColumnRef | SqlExpr, n: number): SqlExpr;
	/**
	 * Left-pad a string with a fill character to a specified length.
	 * @param col - Column or expression to pad
	 * @param length - Target length
	 * @param fill - Fill character (default: space)
	 * @example lpad(col('code'), 5, '0') → LPAD("code", 5, '0')
	 */
	lpad(col: ColumnRef | SqlExpr, length: number, fill?: string): SqlExpr;
	/**
	 * Right-pad a string with a fill character to a specified length.
	 * @param col - Column or expression to pad
	 * @param length - Target length
	 * @param fill - Fill character (default: space)
	 * @example rpad(col('name'), 10, '.') → RPAD("name", 10, '.')
	 */
	rpad(col: ColumnRef | SqlExpr, length: number, fill?: string): SqlExpr;
	/**
	 * Repeat a string a specified number of times.
	 * @param col - Column or expression to repeat
	 * @param times - Number of repetitions
	 * @example repeat(col('pattern'), 3) → REPEAT("pattern", 3)
	 */
	repeat(col: ColumnRef | SqlExpr, times: number): SqlExpr;
	/**
	 * Reverse a string.
	 * @param col - Column or expression to reverse
	 * @example reverse(col('name')) → REVERSE("name")
	 */
	reverse(col: ColumnRef | SqlExpr): SqlExpr;
	/**
	 * Find position of substring in string (1-indexed, 0 if not found).
	 * @param col - Column or expression to search in
	 * @param substring - Substring to find
	 * @example position(col('email'), '@') → POSITION('@' IN "email")
	 */
	position(col: ColumnRef | SqlExpr, substring: string): SqlExpr;
	/**
	 * Replace substring in string starting at position for length characters.
	 * @param col - Column or expression
	 * @param start - Start position (1-indexed)
	 * @param length - Number of characters to replace
	 * @param replacement - Replacement string
	 * @example overlay(col('name'), 1, 3, 'XXX') → OVERLAY("name" PLACING 'XXX' FROM 1 FOR 3)
	 */
	overlay(col: ColumnRef | SqlExpr, start: number, length: number, replacement: string): SqlExpr;
	/**
	 * Replace text matching a POSIX regular expression.
	 * @param col - Column or expression
	 * @param pattern - Regular expression pattern
	 * @param replacement - Replacement string (can use \1, \2 for captured groups)
	 * @param flags - Optional flags (g=global, i=case-insensitive)
	 * @example regexpReplace(col('phone'), '[^0-9]', '', 'g') → REGEXP_REPLACE("phone", '[^0-9]', '', 'g')
	 */
	regexpReplace(col: ColumnRef | SqlExpr, pattern: string, replacement: string, flags?: string): SqlExpr;
	/**
	 * Get absolute value.
	 * @param col - Column or expression
	 * @example abs(col('amount')) → ABS("amount")
	 */
	abs(col: ColumnRef | SqlExpr): SqlExpr;
	/**
	 * Round up to nearest integer.
	 * @param col - Column or expression
	 * @example ceil(col('price')) → CEIL("price")
	 */
	ceil(col: ColumnRef | SqlExpr): SqlExpr;
	/**
	 * Round down to nearest integer.
	 * @param col - Column or expression
	 * @example floor(col('price')) → FLOOR("price")
	 */
	floor(col: ColumnRef | SqlExpr): SqlExpr;
	/**
	 * Round to specified decimal places.
	 * @param col - Column or expression
	 * @param decimals - Number of decimal places (default: 0)
	 * @example round(col('price'), 2) → ROUND("price", 2)
	 */
	round(col: ColumnRef | SqlExpr, decimals?: number): SqlExpr;
	/**
	 * Truncate to specified decimal places (no rounding).
	 * @param col - Column or expression
	 * @param decimals - Number of decimal places (default: 0)
	 * @example trunc(col('value'), 2) → TRUNC("value", 2)
	 */
	trunc(col: ColumnRef | SqlExpr, decimals?: number): SqlExpr;
	/**
	 * Get remainder of division (modulo).
	 * @param col - Column or expression (dividend)
	 * @param divisor - Divisor
	 * @example mod(col('num'), 3) → MOD("num", 3)
	 */
	mod(col: ColumnRef | SqlExpr, divisor: number): SqlExpr;
	/**
	 * Raise to a power.
	 * @param col - Column or expression (base)
	 * @param exp - Exponent
	 * @example power(col('value'), 2) → POWER("value", 2)
	 */
	power(col: ColumnRef | SqlExpr, exp: number): SqlExpr;
	/**
	 * Get square root.
	 * @param col - Column or expression
	 * @example sqrt(col('variance')) → SQRT("variance")
	 */
	sqrt(col: ColumnRef | SqlExpr): SqlExpr;
	/**
	 * Logarithm with specified base.
	 * @param base - Logarithm base
	 * @param col - Column or expression
	 * @example log(10, col('value')) → LOG(10, "value")
	 */
	log(base: number, col: ColumnRef | SqlExpr): SqlExpr;
	/**
	 * Natural logarithm (base e).
	 * @param col - Column or expression
	 * @example ln(col('value')) → LN("value")
	 */
	ln(col: ColumnRef | SqlExpr): SqlExpr;
	/**
	 * Exponential function (e^x).
	 * @param col - Column or expression
	 * @example exp(col('value')) → EXP("value")
	 */
	exp(col: ColumnRef | SqlExpr): SqlExpr;
	/**
	 * Sign of a number (-1, 0, or 1).
	 * @param col - Column or expression
	 * @example sign(col('amount')) → SIGN("amount")
	 */
	sign(col: ColumnRef | SqlExpr): SqlExpr;
	/**
	 * Get current timestamp with timezone.
	 * @example now() → NOW()
	 */
	now(): SqlExpr;
	/**
	 * Get current date.
	 * @example currentDate() → CURRENT_DATE
	 */
	currentDate(): SqlExpr;
	/**
	 * Get current time.
	 * @example currentTime() → CURRENT_TIME
	 */
	currentTime(): SqlExpr;
	/**
	 * Get current timestamp.
	 * @example currentTimestamp() → CURRENT_TIMESTAMP
	 */
	currentTimestamp(): SqlExpr;
	/**
	 * Extract a date/time field from a timestamp.
	 * @param field - Field to extract (year, month, day, hour, minute, second, dow, doy, week, quarter)
	 * @param col - Timestamp column or expression
	 * @example extract('year', col('created_at')) → EXTRACT(YEAR FROM "created_at")
	 */
	extract(field: "year" | "month" | "day" | "hour" | "minute" | "second" | "dow" | "doy" | "week" | "quarter", col: ColumnRef | SqlExpr): SqlExpr;
	/**
	 * Extract a date/time field (PostgreSQL DATE_PART syntax).
	 * @param field - Field name as string
	 * @param col - Column or expression
	 * @example datePart('month', col('date')) → DATE_PART('month', "date")
	 */
	datePart(field: string, col: ColumnRef | SqlExpr): SqlExpr;
	/**
	 * Calculate age between dates/timestamps.
	 * @param col - End date (or single date to calculate age from current time)
	 * @param col2 - Optional start date
	 * @example age(col('created_at')) → AGE("created_at")
	 */
	age(col: ColumnRef | SqlExpr, col2?: ColumnRef | SqlExpr): SqlExpr;
	/**
	 * Truncate timestamp to specified precision.
	 * @param field - Precision (year, quarter, month, week, day, hour, minute, second)
	 * @param col - Column or expression
	 * @example dateTrunc('month', col('created_at')) → DATE_TRUNC('month', "created_at")
	 */
	dateTrunc(field: string, col: ColumnRef | SqlExpr): SqlExpr;
	/**
	 * Format a timestamp/date/time/interval as a string using a format pattern.
	 * @param col - Column or expression to format
	 * @param format - Format pattern (e.g., 'YYYY-MM-DD', 'HH24:MI:SS')
	 * @example toChar(col('created_at'), 'YYYY-MM-DD') → TO_CHAR("created_at", 'YYYY-MM-DD')
	 */
	toChar(col: ColumnRef | SqlExpr, format: string): SqlExpr;
	/**
	 * Parse a string to a timestamp using a format pattern.
	 * @param text - Text to parse (can be column or literal)
	 * @param format - Format pattern
	 * @example toTimestamp(col('date_str'), 'YYYY-MM-DD HH24:MI:SS') → TO_TIMESTAMP("date_str", 'YYYY-MM-DD HH24:MI:SS')
	 */
	toTimestamp(text: ColumnRef | SqlExpr | string, format: string): SqlExpr;
	/**
	 * Parse a string to a date using a format pattern.
	 * @param text - Text to parse (can be column or literal)
	 * @param format - Format pattern
	 * @example toDate(col('date_str'), 'YYYY-MM-DD') → TO_DATE("date_str", 'YYYY-MM-DD')
	 */
	toDate(text: ColumnRef | SqlExpr | string, format: string): SqlExpr;
	/**
	 * Create a date from year, month, day components.
	 * @param year - Year value
	 * @param month - Month value (1-12)
	 * @param day - Day value (1-31)
	 * @example makeDate(2024, 1, 15) → MAKE_DATE(2024, 1, 15)
	 */
	makeDate(year: number | ColumnRef | SqlExpr, month: number | ColumnRef | SqlExpr, day: number | ColumnRef | SqlExpr): SqlExpr;
	/**
	 * Create a timestamp from individual components.
	 * @param year - Year
	 * @param month - Month (1-12)
	 * @param day - Day (1-31)
	 * @param hour - Hour (0-23)
	 * @param minute - Minute (0-59)
	 * @param second - Second (0-59.999999)
	 * @example makeTimestamp(2024, 1, 15, 10, 30, 0) → MAKE_TIMESTAMP(2024, 1, 15, 10, 30, 0)
	 */
	makeTimestamp(year: number | ColumnRef | SqlExpr, month: number | ColumnRef | SqlExpr, day: number | ColumnRef | SqlExpr, hour: number | ColumnRef | SqlExpr, minute: number | ColumnRef | SqlExpr, second: number | ColumnRef | SqlExpr): SqlExpr;
	/**
	 * Bin timestamps into intervals (PostgreSQL 14+).
	 * @param stride - Interval stride (e.g., '15 minutes', '1 hour')
	 * @param source - Timestamp to bin
	 * @param origin - Optional origin timestamp
	 * @example dateBin('15 minutes', col('created_at')) → DATE_BIN('15 minutes', "created_at", TIMESTAMP '2001-01-01')
	 */
	dateBin(stride: string, source: ColumnRef | SqlExpr, origin?: ColumnRef | SqlExpr | string): SqlExpr;
	/**
	 * Cast to a specific type using CAST syntax.
	 * @param col - Column or expression
	 * @param type - Target SQL type (e.g., 'TEXT', 'INTEGER', 'NUMERIC')
	 * @example cast(col('id'), 'TEXT') → CAST("id" AS TEXT)
	 */
	cast(col: ColumnRef | SqlExpr, type: string): SqlExpr;
	/**
	 * Cast to TEXT type.
	 * @param col - Column or expression
	 * @example asText(col('id')) → ("id")::TEXT
	 */
	asText(col: ColumnRef | SqlExpr): SqlExpr;
	/**
	 * Cast to INTEGER type.
	 * @param col - Column or expression
	 * @example asInteger(col('amount')) → ("amount")::INTEGER
	 */
	asInteger(col: ColumnRef | SqlExpr): SqlExpr;
	/**
	 * Cast to NUMERIC type.
	 * @param col - Column or expression
	 * @example asNumeric(col('value')) → ("value")::NUMERIC
	 */
	asNumeric(col: ColumnRef | SqlExpr): SqlExpr;
	/**
	 * Cast to TIMESTAMP type.
	 * @param col - Column or expression
	 * @example asTimestamp(col('date_str')) → ("date_str")::TIMESTAMP
	 */
	asTimestamp(col: ColumnRef | SqlExpr): SqlExpr;
	/**
	 * Cast to DATE type.
	 * @param col - Column or expression
	 * @example asDate(col('timestamp')) → ("timestamp")::DATE
	 */
	asDate(col: ColumnRef | SqlExpr): SqlExpr;
	/**
	 * Return first non-null value from arguments.
	 * @param args - Values to check (columns, expressions, or literals)
	 * @example coalesce(col('nickname'), col('name'), 'Anonymous') → COALESCE("nickname", "name", 'Anonymous')
	 */
	coalesce(...args: (ColumnRef | SqlExpr | string | number | null)[]): SqlExpr;
	/**
	 * Return NULL if value equals specified value.
	 * @param col - Column or expression
	 * @param value - Value to compare
	 * @example nullif(col('amount'), 0) → NULLIF("amount", 0)
	 */
	nullif(col: ColumnRef | SqlExpr, value: string | number): SqlExpr;
	/**
	 * Return default value if column is NULL (alias for COALESCE with 2 args).
	 * @param col - Column or expression
	 * @param defaultValue - Default value if null
	 * @example ifNull(col('name'), 'Unknown') → COALESCE("name", 'Unknown')
	 */
	ifNull(col: ColumnRef | SqlExpr, defaultValue: string | number): SqlExpr;
}
/**
 * Advanced SQL function signatures: JSON, array, full-text search, trigram,
 * UUID, arithmetic operators, and raw SQL.
 *
 * @see SqlFunctionsBase for string, numeric, date/time, type casting, null handling
 * @see SqlFunctions for the composite interface
 */
export interface SqlFunctionsAdvanced {
	/**
	 * Extract JSON value at path (returns JSON).
	 * @param col - JSON column or expression
	 * @param path - Path to extract
	 * @example jsonExtract(col('data'), 'name') → "data"->'name'
	 */
	jsonExtract(col: ColumnRef | SqlExpr, path: string): SqlExpr;
	/**
	 * Extract JSON value at path as text.
	 * @param col - JSON column or expression
	 * @param path - Path to extract
	 * @example jsonExtractText(col('data'), 'name') → "data"->>'name'
	 */
	jsonExtractText(col: ColumnRef | SqlExpr, path: string): SqlExpr;
	/**
	 * Extract JSONB value at path (returns JSONB).
	 * @param col - JSONB column or expression
	 * @param path - Path to extract
	 * @example jsonbExtract(col('data'), 'name') → "data"->'name'
	 */
	jsonbExtract(col: ColumnRef | SqlExpr, path: string): SqlExpr;
	/**
	 * Extract JSONB value at path as text.
	 * @param col - JSONB column or expression
	 * @param path - Path to extract
	 * @example jsonbExtractText(col('data'), 'name') → "data"->>'name'
	 */
	jsonbExtractText(col: ColumnRef | SqlExpr, path: string): SqlExpr;
	/**
	 * Build a JSONB object from key-value pairs.
	 * @param pairs - Object with key-value pairs to convert to JSONB
	 * @example jsonbBuildObject({ name: col('name'), age: col('age') }) → JSONB_BUILD_OBJECT('name', "name", 'age', "age")
	 */
	jsonbBuildObject(pairs: Record<string, ColumnRef | SqlExpr | string | number | boolean | null>): SqlExpr;
	/**
	 * Build a JSONB array from values.
	 * @param values - Array of values to convert to JSONB array
	 * @example jsonbBuildArray(col('id'), col('name')) → JSONB_BUILD_ARRAY("id", "name")
	 */
	jsonbBuildArray(...values: (ColumnRef | SqlExpr | string | number | boolean | null)[]): SqlExpr;
	/**
	 * Remove all null values from a JSONB object recursively.
	 * @param col - JSONB column or expression
	 * @example jsonbStripNulls(col('data')) → JSONB_STRIP_NULLS("data")
	 */
	jsonbStripNulls(col: ColumnRef | SqlExpr): SqlExpr;
	/**
	 * Return the type of a JSONB value as a string.
	 * Returns: 'object', 'array', 'string', 'number', 'boolean', or 'null'
	 * @param col - JSONB column or expression
	 * @example jsonbTypeof(col('data')) → JSONB_TYPEOF("data")
	 */
	jsonbTypeof(col: ColumnRef | SqlExpr): SqlExpr;
	/**
	 * Get length of array dimension.
	 * @param col - Array column or expression
	 * @param dim - Dimension to measure (default: 1)
	 * @example arrayLength(col('tags'), 1) → ARRAY_LENGTH("tags", 1)
	 */
	arrayLength(col: ColumnRef | SqlExpr, dim?: number): SqlExpr;
	/**
	 * Expand array to set of rows.
	 * @param col - Array column or expression
	 * @example unnest(col('tags')) → UNNEST("tags")
	 */
	unnest(col: ColumnRef | SqlExpr): SqlExpr;
	/**
	 * Aggregate values into an array.
	 * @param col - Column to aggregate
	 * @example arrayAgg(col('tag')) → ARRAY_AGG("tag")
	 */
	arrayAgg(col: ColumnRef | SqlExpr): SqlExpr;
	/**
	 * Concatenate two arrays.
	 * @param arr1 - First array column or expression
	 * @param arr2 - Second array column or expression
	 * @example arrayCat(col('tags1'), col('tags2')) → ARRAY_CAT("tags1", "tags2")
	 */
	arrayCat(arr1: ColumnRef | SqlExpr, arr2: ColumnRef | SqlExpr): SqlExpr;
	/**
	 * Find position of element in array (1-indexed, NULL if not found).
	 * @param col - Array column or expression
	 * @param element - Element to find
	 * @example arrayPosition(col('tags'), 'urgent') → ARRAY_POSITION("tags", 'urgent')
	 */
	arrayPosition(col: ColumnRef | SqlExpr, element: string | number | boolean | ColumnRef | SqlExpr): SqlExpr;
	/**
	 * Replace all occurrences of an element in an array.
	 * @param col - Array column or expression
	 * @param oldElement - Element to replace
	 * @param newElement - Replacement element
	 * @example arrayReplace(col('tags'), 'old', 'new') → ARRAY_REPLACE("tags", 'old', 'new')
	 */
	arrayReplace(col: ColumnRef | SqlExpr, oldElement: string | number | boolean, newElement: string | number | boolean): SqlExpr;
	/**
	 * Create an array filled with a value.
	 * @param value - Value to fill with
	 * @param dimensions - Array dimensions (e.g., [3] for 3 elements, [2,3] for 2x3)
	 * @example arrayFill(0, [5]) → ARRAY_FILL(0, ARRAY[5])
	 */
	arrayFill(value: string | number | boolean | null, dimensions: number[]): SqlExpr;
	/**
	 * Convert text to tsvector for full-text search.
	 * @param config - Text search configuration (e.g., 'english', 'simple')
	 * @param col - Column or expression
	 * @example toTsvector('english', col('content')) → TO_TSVECTOR('english', "content")
	 */
	toTsvector(config: string, col: ColumnRef | SqlExpr): SqlExpr;
	/**
	 * Create tsquery from search text.
	 * @param config - Text search configuration
	 * @param query - Search query string
	 * @example toTsquery('english', 'cat & dog') → TO_TSQUERY('english', 'cat & dog')
	 */
	toTsquery(config: string, query: string): SqlExpr;
	/**
	 * Calculate trigram similarity between two strings.
	 * Requires pg_trgm extension.
	 * @param col1 - First string column or expression
	 * @param col2 - Second string column, expression, or literal
	 * @returns Value between 0 and 1 (1 = identical)
	 * @example similarity(col('name'), 'search') → SIMILARITY("name", 'search')
	 */
	similarity(col1: ColumnRef | SqlExpr, col2: ColumnRef | SqlExpr | string): SqlExpr;
	/**
	 * Generate a random UUID v4.
	 * Built-in in PostgreSQL 13+, requires pgcrypto in earlier versions.
	 * @example genRandomUuid() → GEN_RANDOM_UUID()
	 */
	genRandomUuid(): SqlExpr;
	/**
	 * Add two values.
	 * @param col - First operand
	 * @param value - Second operand
	 * @example add(col('price'), 10) → ("price" + 10)
	 */
	add(col: ColumnRef | SqlExpr, value: number | ColumnRef | SqlExpr): SqlExpr;
	/**
	 * Subtract two values.
	 * @param col - First operand
	 * @param value - Second operand
	 * @example subtract(col('total'), col('discount')) → ("total" - "discount")
	 */
	subtract(col: ColumnRef | SqlExpr, value: number | ColumnRef | SqlExpr): SqlExpr;
	/**
	 * Multiply two values.
	 * @param col - First operand
	 * @param value - Second operand
	 * @example multiply(col('qty'), col('price')) → ("qty" * "price")
	 */
	multiply(col: ColumnRef | SqlExpr, value: number | ColumnRef | SqlExpr): SqlExpr;
	/**
	 * Divide two values.
	 * @param col - Dividend
	 * @param value - Divisor
	 * @example divide(col('total'), col('count')) → ("total" / "count")
	 */
	divide(col: ColumnRef | SqlExpr, value: number | ColumnRef | SqlExpr): SqlExpr;
	/**
	 * Create a raw SQL expression (escape hatch for unsupported functions).
	 *
	 * **Warning:** Raw SQL bypasses type safety. Use sparingly and only when
	 * no typed alternative exists.
	 *
	 * @param sql - Raw SQL string
	 * @example raw('MY_CUSTOM_FUNCTION("col")') → MY_CUSTOM_FUNCTION("col")
	 */
	raw(sql: string): SqlExpr;
}
/**
 * Complete SQL functions interface combining base and advanced function sets.
 *
 * This is the primary interface used throughout the codebase. It extends
 * SqlFunctionsBase (string, numeric, date/time, type cast, null) and
 * SqlFunctionsAdvanced (JSON, array, FTS, trigram, UUID, arithmetic, raw).
 *
 * @example
 * ```typescript
 * import { sqlFunctions as F } from './sql-expressions';
 *
 * // Chain functions
 * F.lower(F.trim(col('email')))  // LOWER(TRIM("email"))
 *
 * // Use in expressions
 * F.concat(col('first_name'), ' ', col('last_name'))
 * ```
 */
export interface SqlFunctions extends SqlFunctionsBase, SqlFunctionsAdvanced {
}
/** SQL functions implementation */
export declare const sqlFunctions: SqlFunctions;
/** Expression builder for index expressions - extends SqlFunctions with col() */
export interface ExpressionBuilder extends SqlFunctions {
	/** Reference a column by name */
	col(name: string): ColumnRef;
}
/** Create an expression builder for index expressions */
export declare function createExpressionBuilder(): ExpressionBuilder;
/** Singleton expression builder */
export declare const expressionBuilder: ExpressionBuilder;
export interface WhereCondition extends SqlExpr {
	and(other: WhereCondition): WhereCondition;
	or(other: WhereCondition): WhereCondition;
}
export interface WhereBuilder<T extends Record<string, unknown>> {
	eq<K extends keyof T>(col: K, value: T[K]): WhereCondition;
	neq<K extends keyof T>(col: K, value: T[K]): WhereCondition;
	gt<K extends keyof T>(col: K, value: T[K]): WhereCondition;
	gte<K extends keyof T>(col: K, value: T[K]): WhereCondition;
	lt<K extends keyof T>(col: K, value: T[K]): WhereCondition;
	lte<K extends keyof T>(col: K, value: T[K]): WhereCondition;
	isNull<K extends keyof T>(col: K): WhereCondition;
	isNotNull<K extends keyof T>(col: K): WhereCondition;
	like<K extends keyof T>(col: K, pattern: string): WhereCondition;
	ilike<K extends keyof T>(col: K, pattern: string): WhereCondition;
	in<K extends keyof T>(col: K, values: T[K][]): WhereCondition;
	notIn<K extends keyof T>(col: K, values: T[K][]): WhereCondition;
	isTrue<K extends keyof T>(col: K): WhereCondition;
	isFalse<K extends keyof T>(col: K): WhereCondition;
	between<K extends keyof T>(col: K, min: T[K], max: T[K]): WhereCondition;
	raw(sql: string): WhereCondition;
	expr(expression: SqlExpr, op: "=" | "!=" | ">" | ">=" | "<" | "<=" | "IS NULL" | "IS NOT NULL", value?: unknown): WhereCondition;
}
/** Create a where builder for typed conditions */
export declare function createWhereBuilder<T extends Record<string, unknown>>(columnMap: Record<keyof T, string>): WhereBuilder<T>;
export interface GeneratedExprBuilder<T extends Record<string, unknown>> {
	/** Reference a column */
	col<K extends keyof T>(name: K): ColumnRef;
	/** SQL functions */
	fn: SqlFunctions;
	/** Arithmetic */
	add(a: ColumnRef | SqlExpr | number, b: ColumnRef | SqlExpr | number): SqlExpr;
	subtract(a: ColumnRef | SqlExpr | number, b: ColumnRef | SqlExpr | number): SqlExpr;
	multiply(a: ColumnRef | SqlExpr | number, b: ColumnRef | SqlExpr | number): SqlExpr;
	divide(a: ColumnRef | SqlExpr | number, b: ColumnRef | SqlExpr | number): SqlExpr;
	/** Concatenation with || */
	concat(...parts: (ColumnRef | SqlExpr | string)[]): SqlExpr;
}
/** Create a generated expression builder */
export declare function createGeneratedExprBuilder<T extends Record<string, unknown>>(columnMap: Record<keyof T, string>): GeneratedExprBuilder<T>;
/** Create column references for index building */
export declare function createTableColumnRefs<T extends Record<string, unknown>>(columns: T): {
	[K in keyof T]: ColumnRef;
};
/** Common PostgreSQL extensions */
export type PgExtension = "uuid-ossp" | "pgcrypto" | "pg_trgm" | "btree_gin" | "btree_gist" | "hstore" | "ltree" | "cube" | "earthdistance" | "citext" | "intarray" | "postgis" | "postgis_topology" | "fuzzystrmatch" | "unaccent" | "tablefunc" | "pg_stat_statements" | "plpgsql" | (string & {});
export interface PgExtensionsConfig {
	/** List of enabled extensions */
	extensions: readonly PgExtension[];
	/** Generate CREATE EXTENSION SQL */
	toSQL(): string[];
	/** Returns extension names for schema diffing */
	toAST(): string[];
}
/**
 * Define PostgreSQL extensions for your database
 * @example
 * export const extensions = pgExtensions('uuid-ossp', 'pgcrypto', 'pg_trgm', 'citext');
 */
export declare function pgExtensions<T extends readonly PgExtension[]>(...extensions: T): PgExtensionsConfig & {
	extensions: T;
};
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
export interface IndexBuilder {
	name: string;
	columns: string[];
	unique(): IndexBuilder;
	using(method: "BTREE" | "HASH" | "GIN" | "GIST" | "BRIN" | "SPGIST"): IndexBuilder;
	/** Partial index with typed WHERE callback */
	where<T extends Record<string, unknown>>(callback: (w: IndexWhereBuilder<T>) => WhereCondition): IndexBuilder;
	/** Partial index with string condition (legacy) */
	where(condition: string): IndexBuilder;
	with(options: IndexStorageOptions): IndexBuilder;
	tablespace(name: string): IndexBuilder;
	nullsFirst(): IndexBuilder;
	nullsLast(): IndexBuilder;
	asc(): IndexBuilder;
	desc(): IndexBuilder;
	include(...columns: string[]): IndexBuilder;
	/** Expression-based index with typed callback */
	on<T>(callback: (F: SqlFunctions) => SqlExpr): IndexBuilder;
	/** Expression-based index columns */
	on(...columns: string[]): IndexBuilder;
	/** Add a comment/description to the index */
	comment(text: string): IndexBuilder;
}
/** Where builder for index conditions */
export interface IndexWhereBuilder<T extends Record<string, unknown>> {
	/** Column reference */
	col(name: keyof T): ColumnExpr;
	/** Comparison operators */
	eq<K extends keyof T>(col: K, value: T[K]): WhereCondition;
	neq<K extends keyof T>(col: K, value: T[K]): WhereCondition;
	gt<K extends keyof T>(col: K, value: T[K]): WhereCondition;
	gte<K extends keyof T>(col: K, value: T[K]): WhereCondition;
	lt<K extends keyof T>(col: K, value: T[K]): WhereCondition;
	lte<K extends keyof T>(col: K, value: T[K]): WhereCondition;
	/** Null checks */
	isNull<K extends keyof T>(col: K): WhereCondition;
	isNotNull<K extends keyof T>(col: K): WhereCondition;
	/** Between */
	between<K extends keyof T>(col: K, min: T[K], max: T[K]): WhereCondition;
	/** SQL functions */
	fn: SqlFunctions;
	/** Date/time helpers */
	currentDate(): ColumnExpr;
	currentTimestamp(): ColumnExpr;
	now(): ColumnExpr;
	interval(value: string): SqlExpr;
}
/**
 * Column expression for use in index WHERE clauses and check constraints.
 *
 * Provides a fluent, chainable API for building type-safe SQL conditions.
 * All comparison methods return a {@link WhereCondition} which can be further
 * chained with `.and()` and `.or()` for compound conditions.
 *
 * ## Basic Usage
 *
 * In index definitions, access columns via the table parameter:
 * ```typescript
 * defineTable('users', { ... }, {
 *     indexes: [{
 *         columns: ['email'],
 *         where: table => table.isDeleted.eq(false)
 *     }]
 * })
 * ```
 *
 * ## Comparison Operators
 *
 * | Method | SQL | Example |
 * |--------|-----|---------|
 * | `.eq(value)` | `=` | `table.status.eq('active')` -> `"status" = 'active'` |
 * | `.neq(value)` | `!=` | `table.status.neq('deleted')` -> `"status" != 'deleted'` |
 * | `.ne(value)` | `!=` | Alias for `.neq()` |
 * | `.gt(value)` | `>` | `table.age.gt(18)` -> `"age" > 18` |
 * | `.gte(value)` | `>=` | `table.age.gte(21)` -> `"age" >= 21` |
 * | `.lt(value)` | `<` | `table.price.lt(100)` -> `"price" < 100` |
 * | `.lte(value)` | `<=` | `table.price.lte(50)` -> `"price" <= 50` |
 *
 * ## Null Checks
 *
 * | Method | SQL | Example |
 * |--------|-----|---------|
 * | `.isNull()` | `IS NULL` | `table.deletedAt.isNull()` -> `"deleted_at" IS NULL` |
 * | `.isNotNull()` | `IS NOT NULL` | `table.email.isNotNull()` -> `"email" IS NOT NULL` |
 *
 * ## Collection Operators
 *
 * | Method | SQL | Example |
 * |--------|-----|---------|
 * | `.in([...])` | `IN (...)` | `table.status.in(['a', 'b'])` -> `"status" IN ('a', 'b')` |
 * | `.notIn([...])` | `NOT IN (...)` | `table.type.notIn([1, 2])` -> `"type" NOT IN (1, 2)` |
 * | `.between(min, max)` | `BETWEEN ... AND ...` | `table.age.between(18, 65)` -> `"age" BETWEEN 18 AND 65` |
 *
 * ## Pattern Matching
 *
 * | Method | SQL | Example |
 * |--------|-----|---------|
 * | `.like(pattern)` | `LIKE` | `table.name.like('John%')` -> `"name" LIKE 'John%'` |
 * | `.ilike(pattern)` | `ILIKE` | `table.email.ilike('%@gmail%')` -> `"email" ILIKE '%@gmail%'` |
 *
 * ## Compound Conditions
 *
 * Chain conditions using `.and()` and `.or()`:
 *
 * ```typescript
 * // Simple AND: status = 'active' AND is_deleted = false
 * table.status.eq('active').and(table.isDeleted.eq(false))
 *
 * // Simple OR: role = 'admin' OR role = 'moderator'
 * table.role.eq('admin').or(table.role.eq('moderator'))
 *
 * // Complex: (a = 3 AND b = 7) OR (a = 9 AND b = 1)
 * table.a.eq(3).and(table.b.eq(7))
 *     .or(table.a.eq(9).and(table.b.eq(1)))
 * ```
 *
 * Each `.and()` and `.or()` wraps operands in parentheses for correct precedence.
 *
 * ## Arithmetic (for computed expressions)
 *
 * | Method | SQL | Example |
 * |--------|-----|---------|
 * | `.plus(n)` | `+` | `table.price.plus(tax)` -> `("price" + "tax")` |
 * | `.minus(n)` | `-` | `table.total.minus(5)` -> `("total" - 5)` |
 *
 * @example Partial index on active, non-deleted users
 * ```typescript
 * indexes: [{
 *     columns: ['email'],
 *     unique: true,
 *     where: table => table.status.eq('active').and(table.isDeleted.eq(false))
 * }]
 * ```
 *
 * @example Partial index with null check
 * ```typescript
 * indexes: [{
 *     columns: ['verified_at'],
 *     where: table => table.verifiedAt.isNotNull()
 * }]
 * ```
 */
export interface ColumnExpr extends SqlExpr {
	/** Equals: `column = value` */
	eq(value: unknown): WhereCondition;
	/** Not equals (alternative syntax): `column != value` */
	neq(value: unknown): WhereCondition;
	/** Not equals (SQL standard): `column <> value` */
	ne(value: unknown): WhereCondition;
	/** Greater than: `column > value` */
	gt(value: unknown): WhereCondition;
	/** Greater than or equal: `column >= value` */
	gte(value: unknown): WhereCondition;
	/** Less than: `column < value` */
	lt(value: unknown): WhereCondition;
	/** Less than or equal: `column <= value` */
	lte(value: unknown): WhereCondition;
	/** Is null: `column IS NULL` */
	isNull(): WhereCondition;
	/** Is not null: `column IS NOT NULL` */
	isNotNull(): WhereCondition;
	/** In list: `column IN (value1, value2, ...)` */
	in(values: unknown[]): WhereCondition;
	/** Not in list: `column NOT IN (value1, value2, ...)` */
	notIn(values: unknown[]): WhereCondition;
	/** Between range: `column BETWEEN min AND max` */
	between(min: unknown, max: unknown): WhereCondition;
	/** Like pattern (case-sensitive): `column LIKE pattern` */
	like(pattern: string): WhereCondition;
	/** Like pattern (case-insensitive): `column ILIKE pattern` */
	ilike(pattern: string): WhereCondition;
	/** Add value: `(column + value)` - returns ColumnExpr for chaining */
	plus(value: SqlExpr | number): ColumnExpr;
	/** Subtract value: `(column - value)` - returns ColumnExpr for chaining */
	minus(value: SqlExpr | number): ColumnExpr;
}
export type IndexInput = IndexDefinition | IndexBuilder | IndexBuilderChain | {
	name: string;
	columns: string[];
	unique?: boolean | (() => any);
	isUnique?: boolean;
	using?: string | ((method: any) => any);
	method?: string;
	where?: string | ((condition: any) => any);
	with?: IndexStorageOptions | ((options: any) => any);
	tablespace?: string | ((name: any) => any);
	nulls?: "first" | "last";
	order?: "asc" | "desc";
	include?: string[];
};
/** Index function factory - provides index() builder and SQL functions */
export interface IndexFactory {
	/** Create a named index */
	(name: string): IndexBuilderStart;
}
/** Starting point for index builder - must call .on() or .expression() first */
export interface IndexBuilderStart {
	/** Index on columns (use column names or table.columnName) */
	on(...columns: (string | SqlExpr)[]): IndexBuilderChain;
	/** Expression-based index with callback: .expression(exp => exp.lower(exp.col('email'))) */
	expression(callback: (exp: ExpressionBuilder) => SqlExpr): IndexBuilderChain;
}
/** Chainable index builder methods */
export interface IndexBuilderChain {
	name: string;
	columns: string[];
	unique(): IndexBuilderChain;
	using(method: "BTREE" | "HASH" | "GIN" | "GIST" | "BRIN" | "SPGIST"): IndexBuilderChain;
	/** Partial index with typed WHERE condition callback */
	where(condition: WhereCondition | ((w: IndexWhereBuilder<any>) => WhereCondition)): IndexBuilderChain;
	with(options: IndexStorageOptions): IndexBuilderChain;
	tablespace(name: string): IndexBuilderChain;
	nullsFirst(): IndexBuilderChain;
	nullsLast(): IndexBuilderChain;
	asc(): IndexBuilderChain;
	desc(): IndexBuilderChain;
	include(...columns: string[]): IndexBuilderChain;
	opclass(opclass: string): IndexBuilderChain;
	/**
	 * Mark unique constraint/index as NULLS NOT DISTINCT (PostgreSQL 15+).
	 *
	 * By default, PostgreSQL treats NULL values as distinct in unique constraints,
	 * allowing multiple rows with NULL values in unique columns. When NULLS NOT DISTINCT
	 * is specified, NULL values are considered equal (not distinct), so only one
	 * NULL value is allowed.
	 *
	 * @example
	 * ```typescript
	 * // Only allow one NULL email per user
	 * indexes: (table, index) => [
	 *     index('idx_users_email')
	 *         .on(table.email)
	 *         .unique()
	 *         .nullsNotDistinct(),
	 * ]
	 * ```
	 *
	 * Generated SQL:
	 * ```sql
	 * CREATE UNIQUE INDEX idx_users_email ON users (email) NULLS NOT DISTINCT;
	 * ```
	 *
	 * @remarks
	 * **Dialect Support:**
	 * | Dialect     | Support | Notes                                    |
	 * |-------------|---------|------------------------------------------|
	 * | PostgreSQL  | Full    | Requires PostgreSQL 15+                  |
	 * | CockroachDB | None    | Not supported                            |
	 * | Nile        | Full    | PostgreSQL 15 compatible                 |
	 * | AWS DSQL    | None    | Not supported                            |
	 * | SQLite      | None    | Not applicable                           |
	 * | MySQL       | None    | Not applicable                           |
	 *
	 * @returns The index builder chain for further method chaining
	 * @since 1.0.0
	 * @see https://www.postgresql.org/docs/15/sql-createindex.html
	 */
	nullsNotDistinct(): IndexBuilderChain;
	/**
	 * Generate CREATE INDEX IF NOT EXISTS instead of CREATE INDEX.
	 *
	 * This makes the index creation idempotent - if the index already exists,
	 * PostgreSQL will skip creation instead of throwing an error.
	 *
	 * @example
	 * ```typescript
	 * indexes: (table, index) => [
	 *     // Idempotent index - safe to run multiple times
	 *     index('idx_users_email')
	 *         .on(table.email)
	 *         .ifNotExists(),
	 * ]
	 * ```
	 *
	 * Generated SQL:
	 * ```sql
	 * CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
	 * ```
	 *
	 * **Use cases:**
	 * - **Idempotent migrations** - Migrations that can be run multiple times
	 *   without causing errors, useful for CI/CD pipelines
	 * - **Manual schema management** - When you want to manually run schema
	 *   scripts without tracking which statements have already been executed
	 * - **Development environments** - When databases may already have some
	 *   indexes and you want to apply incremental changes
	 * - **Multi-tenant systems** - When creating tenant-specific indexes that
	 *   may or may not exist
	 *
	 * **Important Notes:**
	 * - When the index already exists, PostgreSQL will NOT verify that the
	 *   existing index matches your definition (columns, type, options)
	 * - If you need to modify an existing index, you must DROP and recreate it
	 * - For schema validation, use `relq diff` to compare definitions
	 *
	 * @returns The index builder chain for further method chaining
	 */
	ifNotExists(): IndexBuilderChain;
	/**
	 * Use ON ONLY clause to create index on parent partitioned table only.
	 *
	 * When called, generates: `CREATE INDEX name ON ONLY table_name (...)`
	 *
	 * By default, when you create an index on a partitioned table, PostgreSQL
	 * automatically creates matching indexes on all child partitions. Using
	 * `tableOnly()` prevents this automatic propagation.
	 *
	 * @example
	 * ```typescript
	 * indexes: (table, index) => [
	 *     // Index only on parent table, not on partitions
	 *     index('idx_orders_date')
	 *         .on(table.orderDate)
	 *         .tableOnly(),
	 * ]
	 * ```
	 *
	 * Generated SQL:
	 * ```sql
	 * CREATE INDEX idx_orders_date ON ONLY orders (order_date);
	 * ```
	 *
	 * Use cases:
	 * - When you want different index configurations per partition
	 * - When partitions have vastly different access patterns
	 * - When you want to control index creation timing per partition
	 * - For declarative partitioning with custom index strategies
	 * - When some partitions don't need certain indexes (e.g., archive partitions)
	 *
	 * Without `tableOnly()`, PostgreSQL would:
	 * 1. Create the index on the parent table
	 * 2. Automatically create matching indexes on ALL child partitions
	 *
	 * With `tableOnly()`, you must manually create indexes on each partition:
	 * ```sql
	 * CREATE INDEX idx_orders_2024_date ON orders_2024 (order_date);
	 * CREATE INDEX idx_orders_2025_date ON orders_2025 (order_date);
	 * ```
	 *
	 * @returns The index builder chain for further method chaining
	 * @see https://www.postgresql.org/docs/current/ddl-partitioning.html#DDL-PARTITIONING-DECLARATIVE-MAINTENANCE
	 */
	tableOnly(): IndexBuilderChain;
	/** Add a comment/description to the index */
	comment(text: string): IndexBuilderChain;
	/**
	 * Set tracking ID for rename detection.
	 * This ID persists across index renames and allows detecting RENAME vs DROP+ADD.
	 * @param trackingId - Unique tracking identifier (e.g., 'idx_a1b2c3')
	 */
	$id(trackingId: string): IndexBuilderChain;
}
/**
 * Table refs for index WHERE clauses - each column is a ColumnExpr with comparison methods
 *
 * Used in: `indexes: (table, index) => [index('name').on(table.col).where(table.isActive.eq(true))]`
 *
 * @template T - Record of column names to ColumnConfig types
 */
export type IndexTableRefs<T extends Record<string, ColumnConfig>> = {
	[K in keyof T]: ColumnExpr;
};
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
 * Partition strategy builder - LIST
 */
export interface ListPartitionBuilder {
	readonly $type: "LIST";
	readonly $column: string;
	readonly $subpartition?: PartitionStrategyDef;
	/** Add subpartition strategy */
	sub(fn: (p: PartitionStrategyFactory) => PartitionStrategyDef): ListPartitionBuilder & {
		$subpartition: PartitionStrategyDef;
	};
}
/**
 * Partition strategy builder - RANGE
 */
export interface RangePartitionBuilder {
	readonly $type: "RANGE";
	readonly $column: string;
	readonly $subpartition?: PartitionStrategyDef;
	/** Add subpartition strategy */
	sub(fn: (p: PartitionStrategyFactory) => PartitionStrategyDef): RangePartitionBuilder & {
		$subpartition: PartitionStrategyDef;
	};
}
/**
 * Partition strategy builder - HASH (no subpartitioning allowed)
 */
export interface HashPartitionBuilder {
	readonly $type: "HASH";
	readonly $column: string;
	readonly $modulus: number;
}
/**
 * Factory for creating partition strategies
 */
export interface PartitionStrategyFactory {
	/** List partition on column */
	list(column: {
		$columnName?: string;
		name?: string;
	} | string): ListPartitionBuilder;
	/** Range partition on column */
	range(column: {
		$columnName?: string;
		name?: string;
	} | string): RangePartitionBuilder;
	/** Hash partition on column with modulus */
	hash(column: {
		$columnName?: string;
		name?: string;
	} | string, modulus: number): HashPartitionBuilder;
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
/**
 * Partition child builder
 */
export interface PartitionChildBuilder {
	readonly $name: string;
	/** LIST partition - for values (string or array) */
	in(values: string | string[]): ChildPartitionDef;
	/** RANGE partition - from value */
	from(value: string | number | Date): RangePartitionFromBuilder;
	/** HASH partition - remainder */
	remainder(value: number): ChildPartitionDef;
	/** DEFAULT partition */
	default(): ChildPartitionDef;
}
/**
 * RANGE from builder - needs to()
 */
export interface RangePartitionFromBuilder {
	/** RANGE partition - to value */
	to(value: string | number | Date): ChildPartitionDef;
}
/**
 * Partition strategy factory - passed to partitionBy callback
 */
export declare const partitionStrategyFactory: PartitionStrategyFactory;
/**
 * Generate partition strategy SQL (PARTITION BY clause)
 */
export declare function generatePartitionBySQL(strategy: PartitionStrategyDef): string;
/**
 * Generate child partition SQL
 */
export declare function generateChildPartitionSQL(parentTable: string, child: ChildPartitionDef, subpartitionStrategy?: PartitionStrategyDef): string;
export type PartitionByCallback<T> = (table: T, p: PartitionStrategyFactory) => PartitionStrategyDef;
/** Factory function for creating partition children */
export type PartitionFactory = (name: string) => PartitionChildBuilder;
export type PartitionsCallback = (partitionFn: PartitionFactory) => ChildPartitionDef[];
/**
 * Dialect Support Types
 *
 * Type definitions and interfaces for PostgreSQL-family dialect feature sets.
 * Used by dialect feature constants and utility functions.
 *
 * @module
 */
/**
 * PostgreSQL-family dialects supported by the schema definition layer
 */
export type PgDialect = "postgres" | "cockroachdb" | "nile" | "dsql";
/**
 * Column type categories for grouping support patterns
 */
export type TypeCategory = "numeric" | "character" | "binary" | "datetime" | "boolean" | "geometric" | "network" | "bitstring" | "textsearch" | "uuid" | "xml" | "json" | "array" | "range" | "monetary" | "objectid" | "composite" | "enum";
/**
 * Index method types
 */
export type IndexMethod = "btree" | "hash" | "gist" | "spgist" | "gin" | "brin";
/**
 * Comprehensive feature set definition for a PostgreSQL-family dialect
 */
export interface DialectFeatureSet {
	/** Dialect identifier */
	readonly dialect: PgDialect;
	/** Human-readable dialect name */
	readonly name: string;
	/** Set of fully supported column types (uppercase) */
	readonly supportedTypes: ReadonlySet<string>;
	/** Set of unsupported column types with reasons */
	readonly unsupportedTypes: ReadonlyMap<string, UnsupportedTypeInfo>;
	/** Alternative type mappings for unsupported types */
	readonly typeAlternatives: ReadonlyMap<string, string>;
	/** Supported index methods */
	readonly supportedIndexMethods: ReadonlySet<IndexMethod>;
	/** Schema object support flags */
	readonly supports: {
		/** Foreign key constraints */
		foreignKeys: boolean;
		/** Deferrable foreign key constraints */
		deferrableForeignKeys: boolean;
		/** Trigger definitions */
		triggers: boolean;
		/** Stored functions/procedures */
		functions: boolean;
		/** Sequences */
		sequences: boolean;
		/** Table partitioning */
		partitioning: boolean;
		/** Materialized views */
		materializedViews: boolean;
		/** Exclusion constraints */
		exclusionConstraints: boolean;
		/** Array columns */
		arrayColumns: boolean;
		/** Generated columns (STORED) */
		generatedColumns: boolean;
		/** IDENTITY columns */
		identityColumns: boolean;
		/** UNLOGGED tables */
		unloggedTables: boolean;
		/** TEMPORARY tables */
		temporaryTables: boolean;
		/** Table inheritance */
		tableInheritance: boolean;
		/** LISTEN/NOTIFY */
		listenNotify: boolean;
		/** Advisory locks */
		advisoryLocks: boolean;
		/** Row-level security */
		rowLevelSecurity: boolean;
		/** Custom domains */
		domains: boolean;
		/** Custom composite types */
		compositeTypes: boolean;
		/** Custom enum types */
		enumTypes: boolean;
		/** Extensions */
		extensions: boolean;
		/** NULLS NOT DISTINCT in unique constraints */
		nullsNotDistinct: boolean;
		/** NOT VALID constraint option */
		notValidConstraints: boolean;
	};
	/** Dialect-specific restrictions and notes */
	readonly restrictions: readonly string[];
	/** Documentation URL */
	readonly docsUrl: string;
}
/**
 * Information about an unsupported type
 */
export interface UnsupportedTypeInfo {
	/** Reason the type is not supported */
	reason: string;
	/** Suggested alternative */
	alternative?: string;
	/** Documentation reference */
	docsUrl?: string;
}
/**
 * CockroachDB feature set
 */
export declare const COCKROACHDB_FEATURES: DialectFeatureSet;
/**
 * Map of all dialect feature sets
 */
export declare const DIALECT_FEATURES: ReadonlyMap<PgDialect, DialectFeatureSet>;
/**
 * Get feature set for a specific dialect
 *
 * @param dialect - The target dialect
 * @returns The feature set for the dialect
 *
 * @example
 * ```typescript
 * const features = getDialectFeatures('cockroachdb');
 * if (!features.supports.triggers) {
 *   console.warn('Triggers not supported');
 * }
 * ```
 */
export declare function getDialectFeatures(dialect: PgDialect): DialectFeatureSet;
/**
 * Result of validating a column type against a dialect
 */
export interface TypeValidationResult {
	/** Whether the type is supported */
	supported: boolean;
	/** The original type name */
	type: string;
	/** The target dialect */
	dialect: PgDialect;
	/** Reason if not supported */
	reason?: string;
	/** Suggested alternative type */
	alternative?: string;
	/** Documentation URL */
	docsUrl?: string;
}
/**
 * Validate a column type for a specific dialect
 *
 * @param type - The column type to validate
 * @param dialect - The target dialect
 * @returns Validation result
 *
 * @example
 * ```typescript
 * const result = validateColumnType('GEOMETRY', 'dsql');
 * if (!result.supported) {
 *   console.log(`${result.type} not supported: ${result.reason}`);
 *   console.log(`Alternative: ${result.alternative}`);
 * }
 * ```
 */
export declare function validateColumnType(type: string, dialect: PgDialect): TypeValidationResult;
/**
 * Validate multiple column types at once
 *
 * @param types - Array of column types to validate
 * @param dialect - Target dialect
 * @returns Array of validation results for unsupported types
 */
export declare function validateColumnTypes(types: string[], dialect: PgDialect): TypeValidationResult[];
/**
 * Validate an index method for a specific dialect
 *
 * @param method - The index method (btree, hash, gin, etc.)
 * @param dialect - Target dialect
 * @returns Whether the method is supported
 */
export declare function isIndexMethodSupported(method: IndexMethod, dialect: PgDialect): boolean;
/**
 * Get supported index methods for a dialect
 *
 * @param dialect - Target dialect
 * @returns Set of supported index methods
 */
export declare function getSupportedIndexMethods(dialect: PgDialect): ReadonlySet<IndexMethod>;
/**
 * Check if a specific feature is supported by a dialect
 *
 * @param feature - Feature key from DialectFeatureSet.supports
 * @param dialect - Target dialect
 * @returns Whether the feature is supported
 *
 * @example
 * ```typescript
 * if (!isFeatureSupported('triggers', 'dsql')) {
 *   console.warn('Triggers not supported in DSQL');
 * }
 * ```
 */
export declare function isFeatureSupported(feature: keyof DialectFeatureSet["supports"], dialect: PgDialect): boolean;
/**
 * Get all unsupported features for a dialect compared to PostgreSQL
 *
 * @param dialect - Target dialect
 * @returns Array of unsupported feature names
 */
export declare function getUnsupportedFeatures(dialect: PgDialect): string[];
/**
 * Compare features between two dialects
 *
 * @param dialect1 - First dialect
 * @param dialect2 - Second dialect
 * @returns Features that differ between the dialects
 */
export declare function compareDialectFeatures(dialect1: PgDialect, dialect2: PgDialect): {
	onlyIn1: string[];
	onlyIn2: string[];
	bothSupport: string[];
	neitherSupport: string[];
};
/**
 * Get the most restrictive feature set (intersection of all dialects)
 * Useful for writing portable schemas
 */
export declare function getPortableFeatureSet(): {
	supportedTypes: ReadonlySet<string>;
	supportedIndexMethods: ReadonlySet<IndexMethod>;
	supports: Record<keyof DialectFeatureSet["supports"], boolean>;
};
type GeneratedTableRefs$1<T extends Record<string, ColumnConfig>> = {
	[K in keyof T]: FluentGenExpr & {
		__columnName: string;
	};
};
/**
 * Generated column definition result.
 *
 * Represents the resolved output of a generated column expression builder chain.
 * This is the final product of `As.on(column).as(expression)` and contains all
 * the information needed to produce the SQL `GENERATED ALWAYS AS (expr) STORED` clause.
 *
 * @example
 * ```typescript
 * // The result of:
 * // As.on(t.fullName).as(t.firstName.concat(' ', t.lastName))
 * // produces:
 * {
 *     $column: 'full_name',
 *     $expression: '"first_name" || \' \' || "last_name"',
 *     $stored: true,
 * }
 * ```
 *
 * @since 1.0.0
 */
export interface GeneratedAsDef {
	/** Target column name (the column that will be GENERATED ALWAYS AS) */
	readonly $column: string;
	/** Generated expression SQL (the expression inside GENERATED ALWAYS AS (...)) */
	readonly $expression: string;
	/** Whether the column is stored (always true for PostgreSQL GENERATED ALWAYS AS) */
	readonly $stored: boolean;
	/** Tracking ID for rename detection across schema migrations */
	readonly $trackingId?: string;
}
/**
 * Builder chain for generated column expressions.
 *
 * Created by `GeneratedAsFactory.on(column)`, this provides the `.as()` method
 * to set the expression that will compute the generated column's value.
 *
 * @example
 * ```typescript
 * // As.on(t.fullName) returns a GeneratedAsBuilderChain
 * // .as(expression) completes the chain and returns GeneratedAsDef
 * As.on(t.fullName).as(t.firstName.concat(' ', t.lastName))
 * ```
 *
 * @since 1.0.0
 * @see {@link GeneratedAsFactory} for creating builder chains
 * @see {@link GeneratedAsDef} for the final definition result
 */
export interface GeneratedAsBuilderChain {
	/**
	 * Set the expression for the generated column.
	 *
	 * @param expression - A FluentGenExpr or GeneratedExpr representing the SQL expression.
	 *   Built using the table column refs provided in the generatedAs callback.
	 * @returns The finalized generated column definition
	 *
	 * @example
	 * ```typescript
	 * // Concatenation expression
	 * As.on(t.fullName).as(t.firstName.concat(' ', t.lastName))
	 *
	 * // Full-text search vector
	 * As.on(t.searchVector).as(
	 *     t.email.coalesce('').toTsvector('english').setWeight('A')
	 * )
	 *
	 * // Arithmetic expression
	 * As.on(t.totalPrice).as(t.unitPrice.multiply(t.quantity))
	 * ```
	 */
	as(expression: FluentGenExpr | GeneratedExpr): GeneratedAsDef;
}
/**
 * Factory for creating generated column definitions.
 *
 * Provided as the second parameter (`As`) in the `generatedAs` callback.
 * Use `.on(column)` to target a column, then `.as(expression)` to define
 * what expression generates its value.
 *
 * @example
 * ```typescript
 * generatedAs: (t, As) => [
 *     // Simple concatenation
 *     As.on(t.fullName).as(t.firstName.concat(' ', t.lastName)),
 *
 *     // Full-text search vector with weighted components
 *     As.on(t.searchVector).as(
 *         t.title.coalesce('').toTsvector('english').setWeight('A')
 *     ),
 *
 *     // Computed numeric value
 *     As.on(t.discountedPrice).as(
 *         t.price.multiply(t.discountFactor)
 *     ),
 * ]
 * ```
 *
 * @remarks
 * **Dialect Support:**
 * | Dialect     | Support    | Notes                                    |
 * |-------------|------------|------------------------------------------|
 * | PostgreSQL  | ✅ Full     | GENERATED ALWAYS AS ... STORED           |
 * | CockroachDB | ✅ Full     | Compatible syntax                        |
 * | Nile        | ⚠️ Partial  | Check generated column support           |
 * | AWS DSQL    | ⚠️ Partial  | Check generated column support           |
 * | SQLite      | ✅ Full     | Both STORED and VIRTUAL supported        |
 * | MySQL       | ✅ Full     | Both STORED and VIRTUAL supported        |
 *
 * @since 1.0.0
 * @see {@link GeneratedAsBuilderChain} for the builder chain after `.on()`
 * @see {@link GeneratedAsDef} for the final definition result
 */
export interface GeneratedAsFactory {
	/**
	 * Define a generated column expression for the target column.
	 *
	 * @param column - A column reference from the table refs (must have `__columnName`).
	 *   This is the column that will have `GENERATED ALWAYS AS (expr) STORED`.
	 * @returns A builder chain with `.as()` to set the expression
	 *
	 * @example
	 * ```typescript
	 * // Target the fullName column
	 * As.on(t.fullName) // returns GeneratedAsBuilderChain
	 * ```
	 */
	on(column: FluentGenExpr & {
		__columnName: string;
	}): GeneratedAsBuilderChain;
}
/**
 * Callback type for the `generatedAs` table option.
 *
 * The callback receives typed table column references and a factory for creating
 * generated column definitions. It must return an array of {@link GeneratedAsDef}
 * objects representing all generated columns for the table.
 *
 * @template T - Record of column names to ColumnConfig types
 *
 * @example
 * ```typescript
 * const users = defineTable('users', {
 *     firstName: varchar(100).notNull(),
 *     lastName: varchar(100).notNull(),
 *     fullName: text(),
 *     email: varchar(255).notNull(),
 *     searchVector: tsvector(),
 * }, {
 *     generatedAs: (t, As) => [
 *         // Concatenate first and last name
 *         As.on(t.fullName).as(t.firstName.concat(' ', t.lastName)),
 *
 *         // Build search vector from email
 *         As.on(t.searchVector).as(
 *             t.email.coalesce('').toTsvector('english').setWeight('A')
 *         ),
 *     ],
 * });
 * ```
 *
 * @param table - Typed column references where each column is a {@link FluentGenExpr}
 *   with chainable expression methods and a `__columnName` property
 * @param As - Factory for creating generated column definitions via `.on(col).as(expr)`
 * @returns Array of generated column definitions
 *
 * @since 1.0.0
 * @see {@link GeneratedTableRefs} for the table parameter type
 * @see {@link GeneratedAsFactory} for the factory parameter type
 * @see {@link GeneratedAsDef} for the individual definition result type
 */
export type GeneratedAsCallback<T extends Record<string, ColumnConfig>> = (table: GeneratedTableRefs$1<T>, As: GeneratedAsFactory) => GeneratedAsDef[];
type ColumnRef$1 = string & {
	__columnRef: true;
};
export type ColumnRefs<T extends Record<string, ColumnConfig>> = {
	[K in keyof T]: ColumnRef$1;
};
export interface TableConfig<T extends Record<string, ColumnConfig>> {
	columns: T;
	schema?: string;
	primaryKey?: string[];
	uniqueConstraints?: Array<{
		columns: string[];
		name?: string;
	}>;
	/**
	 * Table-level constraints with typed callback API (composite primary keys, etc.)
	 * @example
	 * constraints: (table, constraint) => [
	 *     constraint.primaryKey(table.id, table.userId),
	 *     constraint.unique({ name: 'uq_email_date', columns: [table.email, table.date] }),
	 * ]
	 */
	constraints?: ((table: ColumnRefs<T>, constraint: ConstraintBuilder<T>) => ConstraintDef[]);
	/**
	 * CHECK constraints with typed callback API
	 * @example
	 * checkConstraints: (table, check) => [
	 *     check.constraint('positive_amount', table.amount.gte(0)),
	 *     check.constraint('valid_range', table.minValue.lte(table.maxValue)),
	 *     check.constraint('email_format', table.email.isNotNull().and(table.email.asText().length().gte(5))),
	 * ]
	 */
	checkConstraints?: ((table: CheckTableRefs<T>, check: CheckConstraintBuilder<T>) => CheckConstraintDef[]);
	foreignKeys?: Array<{
		columns: string[];
		references: {
			table: string;
			columns: string[];
		};
		onDelete?: "CASCADE" | "SET NULL" | "SET DEFAULT" | "RESTRICT" | "NO ACTION";
		onUpdate?: "CASCADE" | "SET NULL" | "SET DEFAULT" | "RESTRICT" | "NO ACTION";
		name?: string;
		/** Tracking ID for rename detection */
		trackingId?: string;
		/**
		 * Add constraint as NOT VALID (PostgreSQL).
		 *
		 * When true, the constraint is added without validating existing data.
		 * This is useful for zero-downtime migrations where you want to:
		 * 1. Add the constraint as NOT VALID (fast, no table scan)
		 * 2. Validate it later with ALTER TABLE ... VALIDATE CONSTRAINT
		 *
		 * The constraint will still be enforced for new/updated rows.
		 *
		 * @example
		 * ```typescript
		 * foreignKeys: [{
		 *     columns: ['user_id'],
		 *     references: { table: 'users', columns: ['id'] },
		 *     notValid: true, // Add constraint without full table scan
		 * }]
		 * ```
		 *
		 * @remarks
		 * **Dialect Support:**
		 * | Dialect     | Support | Notes                                    |
		 * |-------------|---------|------------------------------------------|
		 * | PostgreSQL  | ✅ Full  | NOT VALID supported                      |
		 * | CockroachDB | ❌ None  | Not supported                            |
		 * | Nile        | ⚠️ Partial | Check support                            |
		 * | AWS DSQL    | ❌ None  | Not supported                            |
		 * | SQLite      | ❌ None  | Not applicable                           |
		 * | MySQL       | ❌ None  | Not applicable                           |
		 *
		 * @default false
		 */
		notValid?: boolean;
	}>;
	/** Index definitions - use (table, index, F) => [index('name').on(table.email).where(table.isActive.eq(true))] */
	indexes?: IndexInput[] | ((table: IndexTableRefs<T>, index: IndexFactory, F: SqlFunctions) => IndexInput[]);
	/**
	 * Generated column expressions with typed callback API.
	 * Uses builder pattern for type-safe column targeting and tracking ID support.
	 * @example
	 * generatedAs: (t, As) => [
	 *     As.on(t.fullName).as(t.firstName.concat(' ', t.lastName)),
	 *     As.on(t.searchVector).as(t.email.coalesce('').toTsvector('english').setWeight('A'))
	 * ]
	 */
	generatedAs?: GeneratedAsCallback<T>;
	inherits?: string[];
	/** Partition strategy - use (table, p) => p.list(table.col) / p.range(table.col) / p.hash(table.col, modulus) */
	partitionBy?: (table: ColumnRefs<T>, p: PartitionStrategyFactory) => PartitionStrategyDef;
	/** Child partition definitions - use (partition) => [partition('name').in([...]), ...] */
	partitions?: (partition: PartitionFactory) => ChildPartitionDef[];
	tablespace?: string;
	withOptions?: Record<string, unknown>;
	/**
	 * Generate CREATE TABLE IF NOT EXISTS instead of CREATE TABLE.
	 *
	 * When `ifNotExists: true`, the generated SQL will be:
	 * `CREATE TABLE IF NOT EXISTS table_name (...)`
	 *
	 * This makes table creation idempotent - if the table already exists,
	 * PostgreSQL will skip creation instead of throwing an error.
	 *
	 * **Use Cases:**
	 * - **Idempotent migrations** - Migrations that can be run multiple times
	 *   without causing errors, useful for CI/CD pipelines
	 * - **Manual schema management** - When you want to manually run schema
	 *   scripts without tracking which statements have already been executed
	 * - **Development environments** - When databases may already have some
	 *   tables and you want to apply incremental changes
	 * - **Multi-tenant systems** - When creating tenant-specific tables that
	 *   may or may not exist
	 * - **Bootstrap scripts** - Initial setup scripts that might run on
	 *   existing databases
	 *
	 * **Example:**
	 * ```typescript
	 * export const users = defineTable('users', {
	 *     id: uuid().primaryKey().default('gen_random_uuid()'),
	 *     email: varchar(255).notNull(),
	 * }, {
	 *     ifNotExists: true,  // Safe to run multiple times
	 * });
	 * ```
	 *
	 * **Generated SQL:**
	 * ```sql
	 * CREATE TABLE IF NOT EXISTS users (
	 *     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	 *     email VARCHAR(255) NOT NULL
	 * );
	 * ```
	 *
	 * **Important Notes:**
	 * - When `ifNotExists: true` and the table already exists, PostgreSQL
	 *   will NOT verify that the existing table matches your schema
	 * - Column differences, missing columns, or type mismatches are NOT detected
	 * - For schema validation, use proper migration tools or `relq diff`
	 * - The existing table's structure may differ from your definition
	 *
	 * @default false - Standard CREATE TABLE that throws if table exists
	 */
	ifNotExists?: boolean;
	/**
	 * Table comment/description.
	 * This will be stored in the database schema and used for documentation.
	 * @example
	 * defineTable('users', { ... }, { comment: 'Stores user account information' })
	 */
	comment?: string;
	/**
	 * Tracking ID for rename detection.
	 * Auto-generated during pull/import if not present.
	 * @example 't1a2b3'
	 */
	$trackingId?: string;
	/**
	 * Create a TEMPORARY table.
	 *
	 * Temporary tables are automatically dropped at the end of a session
	 * (or at the end of the current transaction if ON COMMIT DROP is used).
	 * They are only visible to the session that created them.
	 *
	 * @example
	 * ```typescript
	 * const tempUsers = defineTable('temp_users', {
	 *     id: serial().primaryKey(),
	 *     email: varchar(255),
	 * }, {
	 *     temporary: true,
	 * });
	 * ```
	 *
	 * Generated SQL:
	 * ```sql
	 * CREATE TEMPORARY TABLE temp_users (
	 *     id SERIAL PRIMARY KEY,
	 *     email VARCHAR(255)
	 * );
	 * ```
	 *
	 * @remarks
	 * **Dialect Support:**
	 * | Dialect     | Support | Notes                                    |
	 * |-------------|---------|------------------------------------------|
	 * | PostgreSQL  | ✅ Full  | Full TEMPORARY TABLE support             |
	 * | CockroachDB | ✅ Full  | Compatible                               |
	 * | Nile        | ⚠️ Partial | Check session handling                   |
	 * | AWS DSQL    | ❌ None  | Not supported in serverless              |
	 * | SQLite      | ✅ Full  | TEMP keyword supported                   |
	 * | MySQL       | ✅ Full  | TEMPORARY TABLE supported                |
	 *
	 * @default false
	 */
	temporary?: boolean;
	/**
	 * Create an UNLOGGED table.
	 *
	 * Unlogged tables are not written to the write-ahead log (WAL), which makes
	 * them considerably faster than regular tables. However, they are not crash-safe:
	 * an unlogged table is automatically truncated after a crash or unclean shutdown.
	 *
	 * Use cases:
	 * - Temporary staging tables for ETL processes
	 * - Cache tables that can be rebuilt from source data
	 * - Session-specific working tables
	 * - Performance-critical tables where data loss is acceptable
	 *
	 * @example
	 * ```typescript
	 * const sessionCache = defineTable('session_cache', {
	 *     key: varchar(255).primaryKey(),
	 *     value: jsonb(),
	 *     expiresAt: timestamp(),
	 * }, {
	 *     unlogged: true,
	 * });
	 * ```
	 *
	 * Generated SQL:
	 * ```sql
	 * CREATE UNLOGGED TABLE session_cache (
	 *     key VARCHAR(255) PRIMARY KEY,
	 *     value JSONB,
	 *     expires_at TIMESTAMP
	 * );
	 * ```
	 *
	 * @remarks
	 * **Dialect Support:**
	 * | Dialect     | Support | Notes                                    |
	 * |-------------|---------|------------------------------------------|
	 * | PostgreSQL  | ✅ Full  | Full UNLOGGED TABLE support              |
	 * | CockroachDB | ❌ None  | Not supported                            |
	 * | Nile        | ⚠️ Partial | Check support                            |
	 * | AWS DSQL    | ❌ None  | Not supported in serverless              |
	 * | SQLite      | ❌ None  | Not applicable                           |
	 * | MySQL       | ❌ None  | Not applicable                           |
	 *
	 * @default false
	 */
	unlogged?: boolean;
	/**
	 * Validate table definition against a specific dialect.
	 *
	 * When provided, the table will be validated against the dialect's
	 * feature set at definition time. If validation fails, warnings are
	 * logged to the console (in development) or errors are thrown (in strict mode).
	 *
	 * This is useful for:
	 * - Catching dialect incompatibilities early in development
	 * - Ensuring schemas are portable across different databases
	 * - Validating before pushing to a specific database target
	 *
	 * @example
	 * ```typescript
	 * const users = defineTable('users', {
	 *     id: uuid().primaryKey(),
	 *     settings: jsonb<Settings>(), // DSQL: stored as TEXT
	 * }, {
	 *     dialect: 'dsql', // Will warn about JSONB limitations
	 * });
	 * ```
	 *
	 * @remarks
	 * Validation modes:
	 * - If not specified: No validation performed (default)
	 * - If specified: Validates and logs warnings to console
	 * - With `dialectStrict: true`: Throws error on validation failures
	 *
	 * @see {@link validateSchemaForDialect} for full schema validation
	 */
	dialect?: PgDialect;
	/**
	 * When true, throw an error if dialect validation fails.
	 * Only applies when `dialect` is specified.
	 *
	 * @default false - Only log warnings
	 */
	dialectStrict?: boolean;
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
export type InferSelectType<T extends TableDefinition<any>> = T["$inferSelect"];
export type InferInsertType<T extends TableDefinition<any>> = T["$inferInsert"];
export type InferUpdateType<T extends TableDefinition<any>> = Partial<T["$inferInsert"]>;
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
/**
 * Check expression for use in CHECK constraints.
 * Provides typed methods for building SQL constraint conditions.
 *
 * @template T - The TypeScript type of the column value (e.g., `number` for integer columns)
 *
 * @example
 * // In checkConstraints callback
 * checkConstraints: (table, check) => [
 *     check.constraint('positive_level', table.level.gte(1)),
 *     check.constraint('valid_range', table.amount.between(0, 100))
 * ]
 *
 * @remarks
 * **Dialect Support:**
 * | Dialect      | Support  | Notes                          |
 * |--------------|----------|--------------------------------|
 * | PostgreSQL   | ✅ Full  | Native CHECK constraint        |
 * | CockroachDB  | ✅ Full  | Compatible                     |
 * | Nile         | ✅ Full  | Compatible                     |
 * | AWS DSQL     | ✅ Full  | Compatible                     |
 * | SQLite       | ✅ Full  | CHECK supported                |
 * | MySQL        | ✅ Full  | CHECK supported (8.0.16+)      |
 *
 * @since 1.0.0
 */
export interface CheckExpr<T = unknown> extends SqlExpr {
	/** Greater than or equal - SQL: `column >= value` */
	gte(value: T | CheckExpr<T> | number): WhereCondition;
	/** Less than or equal - SQL: `column <= value` */
	lte(value: T | CheckExpr<T> | number): WhereCondition;
	/** Greater than - SQL: `column > value` */
	gt(value: T | CheckExpr<T> | number): WhereCondition;
	/** Less than - SQL: `column < value` */
	lt(value: T | CheckExpr<T> | number): WhereCondition;
	/** Equals - SQL: `column = value` */
	eq(value: T | CheckExpr<T>): WhereCondition;
	/** Not equals - SQL: `column <> value` */
	neq(value: T | CheckExpr<T>): WhereCondition;
	/** Not equals (alias for neq) - SQL: `column <> value` */
	ne(value: T | CheckExpr<T>): WhereCondition;
	/** Is null - SQL: `column IS NULL` */
	isNull(): WhereCondition;
	/** Is not null - SQL: `column IS NOT NULL` */
	isNotNull(): WhereCondition;
	/** In list - SQL: `column IN (v1, v2, ...)` */
	in(values: (T | CheckExpr<T>)[]): WhereCondition;
	/** Not in list - SQL: `column NOT IN (v1, v2, ...)` */
	notIn(values: (T | CheckExpr<T>)[]): WhereCondition;
	/** Between range (inclusive) - SQL: `column BETWEEN min AND max` */
	between(min: T | CheckExpr<T> | number, max: T | CheckExpr<T> | number): WhereCondition;
	/** Like pattern (case sensitive) - SQL: `column LIKE 'pattern'` */
	like(pattern: string): WhereCondition;
	/** Like pattern (case insensitive) - SQL: `column ILIKE 'pattern'` */
	ilike(pattern: string): WhereCondition;
	/** Regex match (case sensitive) - SQL: `column ~ 'regex'` */
	matches(pattern: string): WhereCondition;
	/** Regex match (case insensitive) - SQL: `column ~* 'regex'` */
	matchesInsensitive(pattern: string): WhereCondition;
	/** Add to expression - SQL: `column + value` */
	plus(value: CheckExpr<T> | number): CheckExpr<T>;
	/** Subtract from expression - SQL: `column - value` */
	minus(value: CheckExpr<T> | number): CheckExpr<T>;
	/** Multiply expression - SQL: `column * value` */
	times(value: CheckExpr<T> | number): CheckExpr<T>;
	/** Divide expression - SQL: `column / value` */
	dividedBy(value: CheckExpr<T> | number): CheckExpr<T>;
	/** Get string length - SQL: `LENGTH(column)` */
	length(): CheckExpr<number>;
	/** Cast to text - SQL: `column::text` */
	asText(): CheckExpr<string>;
	/** Absolute value - SQL: `ABS(column)` */
	abs(): CheckExpr<number>;
}
/** Check constraint definition */
export interface CheckConstraintDef {
	name: string;
	expression: string;
}
/** Check constraint builder for typed constraint expressions */
export interface CheckConstraintBuilder<T extends Record<string, unknown>> {
	/** Reference a column */
	col(name: keyof T): CheckExpr;
	/** Create a named check constraint */
	constraint(name: string, condition: WhereCondition): CheckConstraintDef;
	/** Create a raw SQL expression condition */
	raw(expression: string): WhereCondition;
}
/** Options for constraints (name is optional - auto-generated if not provided) */
export interface ConstraintOptions {
	name?: string;
	columns: ColumnRef$1[];
}
/**
 * Constraint builder for table-level constraints (composite PKs, etc.)
 *
 * @template T - Record of column names to ColumnConfig types
 *
 * @example
 * constraints: (table, constraint) => [
 *     constraint.primaryKey(table.id, table.userId),
 *     constraint.unique({ name: 'uq_email_tenant', columns: [table.email, table.tenantId] }),
 *     constraint.exclude('excl_overlap', 'USING gist (range WITH &&)'),
 * ]
 *
 * @remarks
 * **Dialect Support:**
 * | Dialect      | Support  | Notes                          |
 * |--------------|----------|--------------------------------|
 * | PostgreSQL   | ✅ Full  | All constraint types           |
 * | CockroachDB  | ✅ Full  | Compatible                     |
 * | Nile         | ✅ Full  | Compatible                     |
 * | AWS DSQL     | ⚠️ Partial | No EXCLUDE constraints        |
 * | SQLite       | ⚠️ Partial | No EXCLUDE constraints        |
 * | MySQL        | ⚠️ Partial | No EXCLUDE constraints        |
 *
 * @since 1.0.0
 */
export interface ConstraintBuilder<T extends Record<string, ColumnConfig>> {
	/**
	 * Define composite primary key constraint
	 * @example
	 * // Without name (auto-generates name):
	 * constraint.primaryKey(table.id, table.userId)
	 *
	 * // With name:
	 * constraint.primaryKey({ name: 'pk_results', columns: [table.id, table.userId] })
	 */
	primaryKey(...columns: ColumnRef$1[]): ConstraintDef;
	primaryKey(options: ConstraintOptions): ConstraintDef;
	/**
	 * Define unique constraint across multiple columns
	 * @example
	 * // Without name (auto-generates name):
	 * constraint.unique(table.email, table.tenantId)
	 *
	 * // With name:
	 * constraint.unique({ name: 'uq_email_tenant', columns: [table.email, table.tenantId] })
	 */
	unique(...columns: ColumnRef$1[]): ConstraintDef;
	unique(options: ConstraintOptions): ConstraintDef;
	/** Define exclusion constraint with raw SQL expression */
	exclude(name: string, expression: string): ConstraintDef;
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
 * Table refs for check constraints - each column is a typed CheckExpr.
 * The type is inferred from the column's ColumnConfig type parameter.
 *
 * @template T - Record of column names to ColumnConfig types
 *
 * @example
 * // If table has: { level: ColumnConfig<number>, name: ColumnConfig<string> }
 * // Then CheckTableRefs will be:
 * // { level: CheckExpr<number>, name: CheckExpr<string> }
 */
export type CheckTableRefs<T extends Record<string, ColumnConfig>> = {
	[K in keyof T]: T[K] extends ColumnConfig<infer U> ? CheckExpr<U> : CheckExpr<unknown>;
};
/**
 * Define a PostgreSQL table with full type inference for SELECT, INSERT, and UPDATE operations.
 *
 * This is the primary factory function for creating table definitions. It takes a table name,
 * column definitions, and optional configuration (indexes, constraints, partitions, etc.)
 * and returns a fully typed TableDefinition object.
 *
 * @template T - Record of column names to ColumnConfig types, inferred from the columns parameter
 *
 * @param name - The SQL table name (will be quoted in generated SQL)
 * @param columns - Column definitions created using column type functions (e.g., varchar(), integer())
 * @param options - Optional table configuration including indexes, constraints, partitions, etc.
 *
 * @returns A fully typed TableDefinition with inferred SELECT, INSERT, and UPDATE types
 *
 * @example
 * ```typescript
 * // Basic table
 * export const users = defineTable('users', {
 *     id: uuid().primaryKey().default('gen_random_uuid()'),
 *     email: varchar(255).notNull(),
 *     name: text(),
 *     createdAt: timestamp().notNull().default('NOW()'),
 * });
 *
 * // With indexes, constraints, and partitions
 * export const orders = defineTable('orders', {
 *     id: serial().primaryKey(),
 *     userId: uuid().notNull(),
 *     total: decimal(10, 2).notNull(),
 *     status: varchar(20).notNull().default('pending'),
 * }, {
 *     indexes: (table, index) => [
 *         index('idx_orders_user').on(table.userId),
 *         index('idx_orders_status').on(table.status).where(table.status.neq('archived')),
 *     ],
 *     foreignKeys: [{
 *         columns: ['userId'],
 *         references: { table: 'users', columns: ['id'] },
 *         onDelete: 'CASCADE',
 *     }],
 * });
 * ```
 *
 * @remarks
 * **Dialect Support:**
 * | Dialect     | Support | Notes                                    |
 * |-------------|---------|------------------------------------------|
 * | PostgreSQL  | Full    | Full support                             |
 * | CockroachDB | Full    | Compatible                               |
 * | Nile        | Full    | Compatible                               |
 * | AWS DSQL    | Partial | Some features unsupported                |
 * | SQLite      | None    | Use sqlite-schema instead                |
 * | MySQL       | None    | Use mysql-schema instead                 |
 *
 * @since 1.0.0
 */
export declare function defineTable<T extends Record<string, ColumnConfig>>(name: string, columns: T, options?: Partial<Omit<TableConfig<T>, "columns">>): TableDefinition<T>;
interface ParsedColumn$1 {
	name: string;
	type: string;
	nullable: boolean;
	primaryKey: boolean;
	unique: boolean;
	default?: string;
	references?: {
		table: string;
		column: string;
		onDelete?: string;
		onUpdate?: string;
	};
	check?: string;
	generated?: {
		expression: string;
		stored: boolean;
	};
	array: boolean;
	arrayDimensions: number;
}
interface ParsedTable$1 {
	name: string;
	schema?: string;
	columns: ParsedColumn$1[];
	primaryKey?: string[];
	uniqueConstraints: Array<{
		columns: string[];
		name?: string;
	}>;
	checkConstraints: Array<{
		expression: string;
		name?: string;
	}>;
	foreignKeys: Array<{
		columns: string[];
		references: {
			table: string;
			columns: string[];
		};
		onDelete?: string;
		onUpdate?: string;
		name?: string;
	}>;
}
export declare function parseCreateTable(sql: string): ParsedTable$1;
export declare function generateSchemaCode(table: ParsedTable$1, options: {
	exportName?: string;
	importPath: string;
}): string;
export declare function introspectSQL(sql: string, importPath: string): {
	parsed: ParsedTable$1;
	code: string;
};
export declare function introspectMultiple(sql: string, importPath: string): Array<{
	parsed: ParsedTable$1;
	code: string;
}>;
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
 * Column reference with table and column metadata for relations.
 * Used internally by the builder to track column references.
 */
export interface RelationColumnRef<TTableName extends string = string, TColumnName extends string = string> {
	/** SQL table name */
	$table: TTableName;
	/** SQL column name */
	$column: TColumnName;
	/** Schema key (TypeScript property name) */
	$schemaKey?: string;
}
/**
 * Options for foreign key constraints (both single-column and composite).
 *
 * NEW API: `columns` is REQUIRED as a string literal with autocomplete.
 *
 * Single-column FK (inline):
 * ```typescript
 * r.referenceTo.users(t => ({
 *     columns: 'userId',      // Required - autocomplete shows column names
 *     onDelete: 'CASCADE',
 * }))
 * ```
 *
 * Composite FK (table-level constraint):
 * ```typescript
 * r.referenceTo.inventory(t => ({
 *     columns: ['productId', 'warehouseId'],  // 2+ columns
 *     references: [t.productId, t.warehouseId],  // Required for composite
 *     onDelete: 'CASCADE',
 *     match: 'FULL',
 * }))
 * ```
 */
export interface ForeignKeyOptions<TSourceColumnNames extends string = string, TTargetColumns extends Record<string, RelationColumnRef> = Record<string, RelationColumnRef>> {
	/**
	 * Source column(s) on THIS table (REQUIRED).
	 *
	 * Autocomplete provides available column names:
	 * - Single column: `columns: 'userId'`
	 * - Composite: `columns: ['productId', 'warehouseId']`
	 *
	 * Single column (1) = inline FK in CREATE TABLE
	 * Multiple columns (2+) = table-level FOREIGN KEY constraint
	 */
	columns: TSourceColumnNames | TSourceColumnNames[];
	/**
	 * Target column(s) on the referenced table.
	 *
	 * Single column FK:
	 * - Optional: omit to reference PRIMARY KEY
	 * - Explicit: `references: t.email` (must be UNIQUE or PK)
	 *
	 * Composite FK (2+ columns):
	 * - REQUIRED: must match columns count
	 * - `references: [t.col1, t.col2]`
	 */
	references?: TTargetColumns[keyof TTargetColumns] | TTargetColumns[keyof TTargetColumns][];
	/** Action when referenced row is deleted */
	onDelete?: ReferentialAction;
	/** Action when referenced column value is updated */
	onUpdate?: ReferentialAction;
	/** MATCH type (only valid for composite FK with 2+ columns) */
	match?: MatchType;
	/** Explicit constraint name (optional - auto-generated if omitted) */
	name?: string;
	/** Whether constraint can be deferred to transaction end */
	deferrable?: boolean;
	/** Whether deferred constraints start in deferred mode */
	initiallyDeferred?: boolean;
	/** Tracking ID for rename detection */
	trackingId?: string;
	/** Comment for documentation */
	comment?: string;
}
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
 * Target table column accessor.
 * Provides autocomplete for target table's columns.
 */
export type TargetTableColumns<TTable extends TableDefinition<any>> = {
	[K in keyof TTable["$columns"]]: RelationColumnRef<TTable["$name"], K & string>;
};
/**
 * Callback function type for referenceTo builder.
 * Receives target table columns and returns FK options with source column autocomplete.
 */
export type ReferenceToCallback<TSourceColumnNames extends string, TTargetTable extends TableDefinition<any>> = (t: TargetTableColumns<TTargetTable>) => ForeignKeyOptions<TSourceColumnNames, TargetTableColumns<TTargetTable>>;
/**
 * The referenceTo builder - provides target table selection with autocomplete.
 *
 * @example
 * ```typescript
 * // r.referenceTo.users gives autocomplete for users table
 * r.referenceTo.users(t => ({
 *     columns: 'userId',  // Autocomplete shows source table column names
 *     references: t.id,   // Autocomplete shows target table columns
 *     onDelete: 'CASCADE',
 * }))
 * ```
 */
export type ReferenceToBuilder<TSchema extends Record<string, TableDefinition<any>>, TSourceColumnNames extends string = string> = {
	[K in keyof TSchema]: (callback: ReferenceToCallback<TSourceColumnNames, TSchema[K]>) => ForeignKeyRelationDef;
};
/**
 * Full relation builder passed to pgRelations callback.
 *
 * `r` only exposes `referenceTo` - use it to define FK relations.
 *
 * @example
 * ```typescript
 * pgRelations(schema, (tables) => ({
 *     posts: tables.posts((r) => [
 *         r.referenceTo.users(t => ({
 *             columns: 'userId',  // String literal with autocomplete
 *             references: t.id,   // Target column ref
 *             onDelete: 'CASCADE',
 *         })),
 *     ]),
 * }))
 * ```
 */
export interface FullRelationBuilder<TSchema extends Record<string, TableDefinition<any>>, TCurrentTable extends TableDefinition<any> = TableDefinition<any>> {
	/**
	 * Define a foreign key reference to another table.
	 * `columns` field autocompletes with source table column names as string literals.
	 */
	referenceTo: ReferenceToBuilder<TSchema, keyof TCurrentTable["$columns"] & string>;
}
/**
 * Define PostgreSQL foreign key relations between tables.
 *
 * Creates a type-safe relations object that mirrors PostgreSQL REFERENCES constraints
 * exactly, including ON DELETE, ON UPDATE, MATCH, and DEFERRABLE options.
 *
 * NEW API: Each table returns an ARRAY of FK definitions, and `columns` is REQUIRED.
 *
 * @param schema - The schema object containing all table definitions
 * @param builder - Callback receiving the relation builder for each table
 * @returns The relations object with full FK metadata
 *
 * @example Single-column FK (inline)
 * ```typescript
 * export const relations = pgRelations(schema, (tables) => ({
 *     posts: tables.posts((r) => [
 *         r.referenceTo.users(t => ({
 *             columns: 'userId',  // REQUIRED - string literal with autocomplete
 *             onDelete: 'CASCADE',
 *         })),
 *     ]),
 * }));
 * ```
 *
 * @example FK to non-PK column
 * ```typescript
 * orders: tables.orders((r) => [
 *     r.referenceTo.users(t => ({
 *         columns: 'userEmail',
 *         references: t.email,  // Explicit target column
 *         onDelete: 'SET NULL',
 *     })),
 * ]),
 * ```
 *
 * @example Composite FK (2+ columns = table-level constraint)
 * ```typescript
 * orderItems: tables.orderItems((r) => [
 *     r.referenceTo.inventory(t => ({
 *         columns: ['productId', 'warehouseId'],  // 2+ columns
 *         references: [t.productId, t.warehouseId],  // REQUIRED for composite
 *         onDelete: 'CASCADE',
 *         match: 'FULL',
 *     })),
 * ]),
 * ```
 */
export declare function pgRelations<TSchema extends Record<string, TableDefinition<any>>>(schema: TSchema, builder: (tables: {
	[K in keyof TSchema]: (defineRelations: (r: FullRelationBuilder<TSchema, TSchema[K]>) => TableRelationsArray) => TableRelationsArray;
}) => SchemaRelationsArray): SchemaRelationsArray;
/**
 * Simplified pgRelations API - direct table -> relations mapping.
 *
 * @example
 * ```typescript
 * export const relations = defineRelations(schema, {
 *     posts: (r) => ({
 *         userId: r.referenceTo.users(t => ({ onDelete: 'CASCADE' })),
 *     }),
 *     comments: (r) => ({
 *         postId: r.referenceTo.posts(t => ({ onDelete: 'CASCADE' })),
 *         userId: r.referenceTo.users(t => ({ onDelete: 'SET NULL' })),
 *     }),
 * });
 * ```
 */
export declare function defineRelations<TSchema extends Record<string, TableDefinition<any>>, TRelations extends {
	[K in keyof TSchema]?: (r: FullRelationBuilder<TSchema, TSchema[K]>) => TableRelations;
}>(schema: TSchema, relationDefs: TRelations): SchemaRelations;
type Simplify$1<T> = {
	[K in keyof T]: T[K];
} & {};
/**
 * Helper type to derive DatabaseSchema type from a schema const object.
 *
 * Produces a clean, readable type showing just table names mapped to their columns:
 * ```typescript
 * {
 *     users: { id: string; email: string; createdAt: Date; ... };
 *     posts: { id: string; title: string; content: string; ... };
 *     ...
 * }
 * ```
 *
 * @example
 * ```typescript
 * // In db/schema.ts
 * export const schema = defineSchema({ users, posts, comments });
 * export type DatabaseSchema = typeof schema;
 *
 * // Or use the type directly:
 * export type DatabaseSchema = RelqDatabaseSchema<typeof schema>;
 * ```
 */
export type RelqDatabaseSchema<TSchema extends Record<string, TableDefinition<any>>> = Simplify$1<{
	[K in keyof TSchema]: Simplify$1<TSchema[K]["$inferSelect"]>;
}>;
/**
 * Helper function to define a schema with simplified types.
 *
 * This function is an identity function at runtime, but at the type level
 * it forces TypeScript to eagerly evaluate and simplify the schema types,
 * resulting in cleaner hover tooltips and autocomplete.
 *
 * @example
 * ```typescript
 * // Instead of:
 * export const schema = { users, posts, comments } as const;
 * export type DatabaseSchema = RelqDatabaseSchema<typeof schema>;
 *
 * // Use:
 * export const schema = defineSchema({ users, posts, comments });
 * export type DatabaseSchema = typeof schema;
 * ```
 */
export declare function defineSchema<T extends Record<string, TableDefinition<any>>>(schema: T): RelqDatabaseSchema<T>;
/**
 * Convert action code from pgsql-parser to ReferentialAction string.
 *
 * @internal Used by code generator
 */
export declare function actionCodeToString(code: string): ReferentialAction;
/**
 * Convert ReferentialAction to action code for pgsql-parser.
 *
 * @internal Used for SQL generation
 */
export declare function stringToActionCode(action: ReferentialAction): string;
/**
 * Convert match code from pgsql-parser to MatchType string.
 *
 * @internal Used by code generator
 */
export declare function matchCodeToString(code: string): MatchType;
/**
 * Generate SQL REFERENCES clause from a ForeignKeyRelationDef.
 *
 * @example
 * ```typescript
 * const sql = generateReferencesSQL(relationDef, 'user_id');
 * // "user_id uuid REFERENCES users(id) ON DELETE CASCADE"
 * ```
 */
export declare function generateReferencesSQL(relation: ForeignKeyRelationDef, columnName: string, columnType?: string): string;
export interface PgEnumConfig<T extends readonly string[]> {
	/** Enum type name in PostgreSQL */
	$enumName: string;
	/** Allowed values */
	$enumValues: T;
	$trackingId?: string;
	/** Creates a column using this enum type */
	(columnName?: string): ColumnBuilder<T[number]> & {
		$enumName: string;
		$id(trackingId: string): ColumnBuilder<T[number]>;
	};
	/** Infer TypeScript type from enum */
	$inferEnum: T[number];
	/** Get enum values array */
	values: T;
	/** Get enum type name */
	name: string;
	/** Check if value is valid enum member (type guard) */
	includes(value: unknown): value is T[number];
	/** Returns AST for schema diffing and migration generation */
	toAST(): ParsedEnum;
	/** Set tracking ID for rename detection */
	$id(trackingId: string): PgEnumConfig<T>;
}
/**
 * Create a PostgreSQL ENUM type
 *
 * @param name - PostgreSQL enum type name
 * @param values - Array of allowed values (literal types are automatically inferred)
 * @returns Enum config with column builder and helpers
 *
 * @example
 * ```typescript
 * export const roleEnum = pgEnum('user_role', ['admin', 'user', 'guest']);
 *
 * // In table definition
 * role: roleEnum('role').notNull().default('user'),
 *
 * // TypeScript type
 * type Role = typeof roleEnum.$inferEnum; // 'admin' | 'user' | 'guest'
 * ```
 */
export declare function pgEnum<const T extends readonly string[]>(name: string, values: T): PgEnumConfig<T>;
/**
 * Generate CREATE TYPE SQL for enum
 */
export declare function generateEnumSQL(name: string, values: readonly string[]): string;
/**
 * Generate DROP TYPE SQL for enum
 */
export declare function dropEnumSQL(name: string): string;
/**
 * Generate ALTER TYPE ADD VALUE SQL for adding new enum value
 */
export declare function addEnumValueSQL(enumName: string, newValue: string, position?: {
	before?: string;
	after?: string;
}): string;
type FunctionVolatility = "VOLATILE" | "STABLE" | "IMMUTABLE";
export type FunctionParallel = "UNSAFE" | "RESTRICTED" | "SAFE";
type FunctionSecurity = "INVOKER" | "DEFINER";
/** Common PostgreSQL function languages */
type FunctionLanguage = "plpgsql" | "sql" | "plpython3u" | "plperl" | "pltcl" | (string & {});
/** Common PostgreSQL return types with autocomplete support */
type FunctionReturnType = "trigger" | "void" | "integer" | "bigint" | "smallint" | "numeric" | "real" | "double precision" | "text" | "varchar" | "char" | "name" | "boolean" | "timestamp" | "timestamptz" | "timestamp with time zone" | "timestamp without time zone" | "date" | "time" | "timetz" | "interval" | "bytea" | "uuid" | "json" | "jsonb" | "text[]" | "integer[]" | "uuid[]" | "jsonb[]" | "record" | "SETOF record" | (string & {});
export interface FunctionArgument {
	/** Argument name */
	name: string;
	/** PostgreSQL type */
	type: string;
	/** Argument mode: IN (default), OUT, INOUT, VARIADIC */
	mode?: "IN" | "OUT" | "INOUT" | "VARIADIC";
	/** Default value (SQL expression) */
	default?: string;
}
interface FunctionOptions {
	/** Function arguments */
	args?: FunctionArgument[];
	/** Return type (e.g., 'integer', 'trigger', 'SETOF uuid', 'TABLE(...)') */
	returns: FunctionReturnType;
	/** Language (default: 'plpgsql') */
	language?: FunctionLanguage;
	/** Volatility category */
	volatility?: FunctionVolatility;
	/** Parallel safety */
	parallel?: FunctionParallel;
	/** Security context */
	security?: FunctionSecurity;
	/** Is function STRICT (returns NULL if any arg is NULL) */
	strict?: boolean;
	/** Is function LEAKPROOF */
	leakproof?: boolean;
	/** Estimated execution cost */
	cost?: number;
	/** Estimated number of rows returned (for SETOF/TABLE) */
	rows?: number;
	/** SET configuration parameters */
	setConfig?: Record<string, string>;
	/**
	 * Function body - the inner statements only.
	 *
	 * **IMPORTANT:** Do NOT include BEGIN/END or DECLARE blocks.
	 * These will be auto-wrapped for plpgsql functions.
	 *
	 * For complex functions with DECLARE blocks, use `raw` instead.
	 *
	 * @example
	 * ```typescript
	 * // ✓ Correct - just the statements
	 * body: `NEW.updated_at = NOW(); RETURN NEW;`
	 *
	 * // ✗ Wrong - don't include BEGIN/END
	 * body: `BEGIN NEW.updated_at = NOW(); RETURN NEW; END;`
	 * ```
	 *
	 * @throws Error if BEGIN or DECLARE is detected in the body
	 */
	body?: string;
	/**
	 * Raw SQL body for complex functions.
	 *
	 * Use this for functions that need DECLARE blocks or custom structure.
	 * The content is used as-is (no auto-wrapping).
	 *
	 * @example
	 * ```typescript
	 * raw: `
	 * DECLARE
	 *     v_count INTEGER;
	 * BEGIN
	 *     SELECT COUNT(*) INTO v_count FROM users;
	 *     RETURN v_count;
	 * END;
	 * `
	 * ```
	 */
	raw?: string;
	/**
	 * Comment for the function (versioned with the schema)
	 * Will be applied via COMMENT ON FUNCTION
	 */
	comment?: string;
}
export interface FunctionConfig {
	/** Function name */
	$functionName: string;
	/** Full configuration */
	$options: FunctionOptions;
	/** Marker for function type */
	$type: "function";
	$trackingId?: string;
	$commentText?: string;
	/** Returns AST for schema diffing and migration generation */
	toAST(): ParsedFunction;
	/** Set tracking ID for rename detection */
	$id(trackingId: string): FunctionConfig;
	/** Set comment for the function (chainable) */
	$comment(comment: string): FunctionConfig;
}
/**
 * Generate SQL for a function definition
 */
export declare function generateFunctionSQL(config: FunctionConfig): string;
/**
 * Generate DROP FUNCTION SQL
 */
export declare function dropFunctionSQL(config: FunctionConfig, ifExists?: boolean): string;
/**
 * Define a PostgreSQL function for use in schema definitions
 *
 * @example
 * ```typescript
 * // Simple trigger function
 * export const updateTimestamp = pgFunction('update_timestamp', {
 *     returns: 'TRIGGER',
 *     language: 'plpgsql',
 *     body: `
 *         NEW.updated_at = NOW();
 *         RETURN NEW;
 *     `
 * });
 *
 * // Function with arguments
 * export const calculateTotal = pgFunction('calculate_total', {
 *     args: [
 *         { name: 'base_amount', type: 'NUMERIC' },
 *         { name: 'tax_rate', type: 'NUMERIC', default: '0.1' }
 *     ],
 *     returns: 'NUMERIC',
 *     language: 'plpgsql',
 *     volatility: 'STABLE',
 *     body: `
 *         RETURN base_amount * (1 + tax_rate);
 *     `
 * });
 *
 * // Complex function with raw SQL
 * export const auditChanges = pgFunction('audit_changes', {
 *     returns: 'TRIGGER',
 *     language: 'plpgsql',
 *     raw: `
 * DECLARE
 *     payload JSONB;
 * BEGIN
 *     IF TG_OP = 'INSERT' THEN
 *         payload := to_jsonb(NEW);
 *     ELSIF TG_OP = 'UPDATE' THEN
 *         payload := jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW));
 *     ELSIF TG_OP = 'DELETE' THEN
 *         payload := to_jsonb(OLD);
 *     END IF;
 *
 *     INSERT INTO audit_log (table_name, operation, data)
 *     VALUES (TG_TABLE_NAME, TG_OP, payload);
 *
 *     RETURN COALESCE(NEW, OLD);
 * END;
 *     `
 * });
 * ```
 */
export declare function pgFunction(name: string, options: FunctionOptions): FunctionConfig;
/**
 * Check if a value is a FunctionConfig
 */
export declare function isFunctionConfig(value: unknown): value is FunctionConfig;
export interface SequenceOptions {
	/** Data type: smallint, integer (default), or bigint */
	as?: "smallint" | "integer" | "bigint";
	/** Starting value */
	start?: number;
	/** Increment by (can be negative for descending) */
	increment?: number;
	/** Minimum value (null for type default) */
	minValue?: number | null;
	/** Maximum value (null for type default) */
	maxValue?: number | null;
	/** Number of values to cache */
	cache?: number;
	/** Whether sequence wraps around at limits */
	cycle?: boolean;
	/** Owner table.column (e.g., 'users.id') */
	ownedBy?: string;
}
export interface SequenceConfig {
	readonly $type: "sequence";
	readonly name: string;
	readonly options: SequenceOptions;
	$trackingId?: string;
	/** Returns AST for schema diffing and migration generation */
	toAST(): ParsedSequence;
}
/**
 * Define a PostgreSQL sequence
 *
 * @example
 * ```ts
 * // Simple sequence
 * export const orderSeq = pgSequence('order_seq');
 *
 * // Sequence with options
 * export const invoiceSeq = pgSequence('invoice_seq', {
 *     start: 1000,
 *     increment: 1,
 *     cache: 10,
 * });
 *
 * // Cyclic sequence
 * export const rotatingSeq = pgSequence('rotating_seq', {
 *     start: 1,
 *     maxValue: 100,
 *     cycle: true,
 * });
 *
 * // Owned sequence
 * export const userIdSeq = pgSequence('user_id_seq', {
 *     ownedBy: 'users.id',
 * });
 * ```
 */
export declare function pgSequence(name: string, options?: SequenceOptions): SequenceConfig;
/**
 * Generate CREATE SEQUENCE SQL from a SequenceConfig
 */
export declare function generateSequenceSQL(seq: SequenceConfig): string;
/**
 * Generate DROP SEQUENCE SQL
 */
export declare function dropSequenceSQL(seq: SequenceConfig): string;
/**
 * Type guard to check if a value is a SequenceConfig
 */
export declare function isSequenceConfig(value: unknown): value is SequenceConfig;
export interface ViewConfig {
	$type: "view";
	name: string;
	definition: string;
	isMaterialized: false;
	$trackingId?: string;
	/** Returns AST for schema diffing and migration generation */
	toAST(): ParsedView;
}
export interface MaterializedViewConfig {
	$type: "materialized_view";
	name: string;
	definition: string;
	isMaterialized: true;
	withData?: boolean;
	$trackingId?: string;
	/** Returns AST for schema diffing and migration generation */
	toAST(): ParsedView;
}
/**
 * Define a PostgreSQL view
 *
 * @example
 * export const activeUsers = pgView('active_users', `
 *     SELECT id, name, email FROM users WHERE status = 'active'
 * `)
 */
export declare function pgView(name: string, definition: string): ViewConfig;
/**
 * Define a PostgreSQL materialized view
 *
 * @example
 * export const userStats = pgMaterializedView('user_stats', `
 *     SELECT user_id, COUNT(*) as order_count, SUM(total) as total_spent
 *     FROM orders
 *     GROUP BY user_id
 * `)
 */
export declare function pgMaterializedView(name: string, definition: string, options?: {
	withData?: boolean;
}): MaterializedViewConfig;
/**
 * Generate CREATE VIEW SQL
 */
export declare function viewToSQL(view: ViewConfig): string;
/**
 * Generate CREATE MATERIALIZED VIEW SQL
 */
export declare function materializedViewToSQL(view: MaterializedViewConfig): string;
export type TriggerEvent = "INSERT" | "UPDATE" | "DELETE" | "TRUNCATE";
export type TriggerLevel = "ROW" | "STATEMENT";
export interface TriggerOptions<TTable = unknown> {
	/**
	 * Table the trigger is attached to
	 * Can be a TableDefinition for type safety or a string
	 */
	on: TTable | string;
	/**
	 * BEFORE timing with events
	 * Use this OR after/insteadOf, not multiple
	 */
	before?: TriggerEvent | TriggerEvent[];
	/**
	 * AFTER timing with events
	 */
	after?: TriggerEvent | TriggerEvent[];
	/**
	 * INSTEAD OF timing with events (for views only)
	 */
	insteadOf?: TriggerEvent | TriggerEvent[];
	/**
	 * UPDATE OF specific columns (only valid with UPDATE event)
	 */
	updateOf?: string[];
	/**
	 * FOR EACH ROW or FOR EACH STATEMENT (default: 'ROW')
	 */
	forEach?: TriggerLevel;
	/**
	 * WHEN condition (SQL expression)
	 * Can reference OLD and NEW
	 */
	when?: string;
	/**
	 * REFERENCING clause for transition tables (PG10+)
	 */
	referencing?: {
		oldTable?: string;
		newTable?: string;
	};
	/**
	 * CONSTRAINT trigger (deferrable)
	 */
	constraint?: boolean;
	/**
	 * DEFERRABLE (only for constraint triggers)
	 */
	deferrable?: boolean;
	/**
	 * INITIALLY DEFERRED or INITIALLY IMMEDIATE
	 */
	initially?: "DEFERRED" | "IMMEDIATE";
	/**
	 * Function to execute
	 * Can be a FunctionConfig for type safety or a string
	 */
	execute: FunctionConfig | string;
	/**
	 * Arguments to pass to the function
	 */
	executeArgs?: string[];
	/**
	 * Comment for the trigger (versioned with the schema)
	 * Will be applied via COMMENT ON TRIGGER
	 */
	comment?: string;
}
export interface TriggerConfig<TTable = unknown> {
	/** Trigger name */
	$triggerName: string;
	/** Full configuration */
	$options: TriggerOptions<TTable>;
	/** Marker for trigger type */
	$type: "trigger";
	$trackingId?: string;
	$commentText?: string;
	/** Returns AST for schema diffing and migration generation */
	toAST(): ParsedTrigger;
	/** Set tracking ID for rename detection */
	$id(trackingId: string): TriggerConfig<TTable>;
	/** Set comment for the trigger (chainable) */
	$comment(comment: string): TriggerConfig<TTable>;
}
/**
 * Severity level for validation issues
 */
export type ValidationSeverity = "error" | "warning" | "info";
/**
 * A single validation issue
 */
export interface ValidationIssue {
	/** Severity of the issue */
	severity: ValidationSeverity;
	/** Issue code for programmatic handling */
	code: string;
	/** Human-readable message */
	message: string;
	/** Location of the issue (table.column, trigger name, etc.) */
	location?: string;
	/** Suggested fix or alternative */
	suggestion?: string;
	/** Documentation reference */
	docsUrl?: string;
}
/**
 * Result of schema validation
 */
export interface ValidationResult {
	/** Whether the schema is valid for the target dialect */
	valid: boolean;
	/** Target dialect that was validated against */
	dialect: PgDialect;
	/** Error-level issues (schema will not work) */
	errors: ValidationIssue[];
	/** Warning-level issues (schema may work but has concerns) */
	warnings: ValidationIssue[];
	/** Informational notes */
	info: ValidationIssue[];
	/** Summary statistics */
	summary: {
		tablesChecked: number;
		columnsChecked: number;
		indexesChecked: number;
		triggersChecked: number;
		functionsChecked: number;
		sequencesChecked: number;
		viewsChecked: number;
	};
}
/**
 * Schema objects to validate
 */
export interface SchemaInput {
	/** Tables to validate */
	tables?: Record<string, TableDefinition<any>>;
	/** Triggers to validate */
	triggers?: Record<string, TriggerConfig>;
	/** Functions to validate */
	functions?: Record<string, FunctionConfig>;
	/** Sequences to validate */
	sequences?: Record<string, SequenceConfig>;
	/** Views to validate */
	views?: Record<string, ViewConfig>;
	/** Materialized views to validate */
	materializedViews?: Record<string, MaterializedViewConfig>;
}
/**
 * Options for schema validation
 */
export interface ValidationOptions {
	/** Target dialect to validate against */
	dialect: PgDialect;
	/** Whether to include informational messages (default: false) */
	includeInfo?: boolean;
	/** Whether to check for portability across all dialects (default: false) */
	checkPortability?: boolean;
	/** Custom type mappings to allow (for extension types, etc.) */
	allowedCustomTypes?: string[];
}
/**
 * Validate a schema against a specific PostgreSQL-family dialect
 *
 * @param schema - Schema objects to validate
 * @param options - Validation options including target dialect
 * @returns Validation result with errors, warnings, and info
 *
 * @example
 * ```typescript
 * const result = validateSchemaForDialect(
 *   { tables: { users, posts } },
 *   { dialect: 'dsql' }
 * );
 *
 * if (result.errors.length > 0) {
 *   console.error('Errors:', result.errors);
 * }
 * ```
 */
export declare function validateSchemaForDialect(schema: SchemaInput, options: ValidationOptions): ValidationResult;
/**
 * Validate a single table against a dialect
 *
 * @param table - Table definition to validate
 * @param dialect - Target dialect
 * @returns Validation result
 */
export declare function validateTableForDialect(table: TableDefinition<any>, dialect: PgDialect): ValidationResult;
/**
 * Quick check if a column type is supported by a dialect
 *
 * @param columnType - SQL column type (e.g., 'JSONB', 'GEOMETRY')
 * @param dialect - Target dialect
 * @returns Whether the type is supported
 */
export declare function isColumnTypeSupported(columnType: string, dialect: PgDialect): boolean;
/**
 * Get all unsupported features used in a schema
 *
 * @param schema - Schema to analyze
 * @param dialect - Target dialect
 * @returns List of unsupported features
 */
export declare function getSchemaUnsupportedFeatures(schema: SchemaInput, dialect: PgDialect): string[];
/**
 * Format validation result as a human-readable report
 *
 * @param result - Validation result
 * @returns Formatted string report
 */
export declare function formatValidationReport(result: ValidationResult): string;
/**
 * SQL Tagged Template Literal
 *
 * Use with VS Code extension "Inline SQL by qufiwefefwoyn" for PostgreSQL syntax highlighting.
 *
 * @example
 * ```typescript
 * import { sql } from 'relq/pg-builder';
 *
 * const query = sql`
 *     SELECT * FROM users
 *     WHERE id = ${userId}
 * `;
 * ```
 */
export interface SQLTemplate {
	/** The raw SQL string with placeholders */
	readonly text: string;
	/** The values to be interpolated */
	readonly values: readonly unknown[];
	/** Get the final SQL string (for debugging) */
	toString(): string;
	/** Get parameterized query format ($1, $2, etc.) */
	toParameterized(): {
		text: string;
		values: unknown[];
	};
}
type FunctionReturnType$1 = "trigger" | "void" | "integer" | "bigint" | "smallint" | "real" | "double precision" | "numeric" | "text" | "varchar" | "char" | "boolean" | "json" | "jsonb" | "uuid" | "timestamp" | "timestamptz" | "date" | "time" | "timetz" | "interval" | "bytea" | "record" | "setof record" | (string & {});
type FunctionLanguage$1 = "plpgsql" | "sql" | "plv8" | "plpython3u" | "plperl" | (string & {});
type FunctionType = "function" | "procedure";
type FunctionVolatility$1 = "volatile" | "stable" | "immutable";
type FunctionSecurity$1 = "invoker" | "definer";
export interface FunctionParameter {
	name: string;
	type: string;
	mode?: "in" | "out" | "inout" | "variadic";
	default?: string;
}
interface FunctionOptions$1 {
	/** Function name */
	name: string;
	/** Return type with autocomplete */
	returns: FunctionReturnType$1;
	/** Language with autocomplete */
	language: FunctionLanguage$1;
	/** Function or procedure */
	as?: FunctionType;
	/** Function parameters */
	parameters?: FunctionParameter[];
	/** Function body (use sql template) */
	body: SQLTemplate | string;
	/** Volatility setting */
	volatility?: FunctionVolatility$1;
	/** Security setting */
	security?: FunctionSecurity$1;
	/** Schema to create in */
	schema?: string;
	/** Replace if exists */
	orReplace?: boolean;
	/** Cost estimate */
	cost?: number;
	/** Rows estimate (for set-returning functions) */
	rows?: number;
	/** Parallel safety */
	parallel?: "unsafe" | "restricted" | "safe";
}
export interface FunctionDefinition {
	/** Function name */
	readonly name: string;
	/** Full function configuration */
	readonly options: Readonly<FunctionOptions$1>;
	/** Generate CREATE FUNCTION SQL */
	toSQL(): string;
	/** Generate DROP FUNCTION SQL */
	toDropSQL(): string;
}
/**
 * Create a PostgreSQL function definition.
 *
 * @param options Function configuration
 * @returns Function definition with SQL generation
 */
export declare function createFunction(options: FunctionOptions$1): FunctionDefinition;
/**
 * CockroachDB Schema Validation Error Codes
 *
 * Complete registry of error codes, warning codes, and informational messages
 * for CockroachDB dialect schema validation. Each code maps to a specific
 * incompatibility or behavioral difference from PostgreSQL.
 *
 * @module cockroachdb-schema/errors
 *
 * @remarks
 * **Code ranges:**
 * | Range         | Category                          |
 * |---------------|-----------------------------------|
 * | CRDB_E001–E032 | Blocked column types             |
 * | CRDB_E100–E104 | Blocked constraints              |
 * | CRDB_E200–E204 | Blocked index types/features     |
 * | CRDB_E300–E312 | Blocked table features           |
 * | CRDB_E400–E401 | Blocked domain/composite types   |
 * | CRDB_E500–E505 | Blocked trigger features         |
 * | CRDB_E600–E609 | Blocked PL/pgSQL constructs      |
 * | CRDB_E700–E703 | Multi-region validation errors   |
 * | CRDB_E710–E711 | TTL validation errors            |
 * | CRDB_E720–E730 | Hash-sharded / PK errors         |
 * | CRDB_W001–W003 | SERIAL warnings                  |
 * | CRDB_W010–W011 | NULL ordering warnings           |
 * | CRDB_W020–W021 | Float/integer behavior warnings  |
 * | CRDB_W030      | Sequence cache warning           |
 * | CRDB_W040      | CONCURRENTLY warning             |
 * | CRDB_W500      | TG_ARGV indexing warning         |
 * | CRDB_W710      | TTL + REGIONAL BY ROW warning    |
 * | CRDB_W720–W721 | Hash-sharded bucket warnings     |
 * | CRDB_I600      | Language recommendation          |
 *
 * @since 1.1.0
 */
/**
 * Severity level for a CockroachDB validation message.
 *
 * - `error`: Schema will not compile or push. Must be fixed.
 * - `warning`: Schema will work but may have unexpected behavior.
 * - `info`: Best practice recommendation.
 *
 * @since 1.1.0
 */
export type CrdbValidationSeverity = "error" | "warning" | "info";
/**
 * A single CockroachDB schema validation message.
 *
 * @example
 * ```typescript
 * const msg: CrdbValidationMessage = {
 *   code: 'CRDB_E001',
 *   severity: 'error',
 *   message: 'MONEY type is not supported in CockroachDB.',
 *   alternative: 'Use numeric({ precision: 19, scale: 4 }) instead.',
 *   category: 'Numeric',
 *   documentationUrl: 'https://www.cockroachlabs.com/docs/stable/data-types',
 * };
 * ```
 *
 * @since 1.1.0
 */
export interface CrdbValidationMessage {
	/** Error/warning code (e.g. 'CRDB_E001') */
	readonly code: string;
	/** Severity level */
	readonly severity: CrdbValidationSeverity;
	/** Human-readable description of the issue */
	readonly message: string;
	/** Suggested alternative or fix */
	readonly alternative?: string;
	/** Feature category (e.g. 'Numeric', 'Geometric', 'Constraint') */
	readonly category: string;
	/** Table name where the issue was found */
	tableName?: string;
	/** Column name where the issue was found */
	columnName?: string;
	/** Index name where the issue was found */
	indexName?: string;
	/** Function name where the issue was found */
	functionName?: string;
	/** Trigger name where the issue was found */
	triggerName?: string;
	/** Link to CockroachDB documentation */
	readonly documentationUrl?: string;
}
/**
 * Result of validating a schema against CockroachDB rules.
 *
 * @example
 * ```typescript
 * const result = validateForCockroachDB(schema);
 * if (result.hasErrors) {
 *   for (const err of result.errors) {
 *     console.error(`[${err.code}] ${err.message}`);
 *   }
 * }
 * ```
 *
 * @since 1.1.0
 */
export interface CrdbValidationResult {
	/** All error-level messages (blocking) */
	readonly errors: CrdbValidationMessage[];
	/** All warning-level messages (advisory) */
	readonly warnings: CrdbValidationMessage[];
	/** All info-level messages (best practices) */
	readonly info: CrdbValidationMessage[];
	/** True if there are any error-level messages */
	readonly hasErrors: boolean;
	/** True if there are any warning-level messages */
	readonly hasWarnings: boolean;
	/** Total count of all messages */
	readonly totalIssues: number;
}
/**
 * Create a CrdbValidationResult from a list of messages.
 *
 * @param messages - All validation messages collected
 * @returns Structured validation result
 *
 * @since 1.1.0
 */
declare function createValidationResult(messages: CrdbValidationMessage[]): CrdbValidationResult;
/**
 * Error code entry for the CockroachDB error registry.
 *
 * @since 1.1.0
 */
export interface CrdbErrorDef {
	readonly code: string;
	readonly severity: CrdbValidationSeverity;
	readonly message: string;
	readonly alternative: string;
	readonly category: string;
	readonly documentationUrl: string;
}
/**
 * Complete registry of all CockroachDB validation error codes.
 *
 * @remarks
 * Each entry documents a PostgreSQL feature that is blocked, unsupported,
 * or behaves differently on CockroachDB. Error codes are stable across
 * versions and should be used for programmatic error handling.
 *
 * @example
 * ```typescript
 * import { CRDB_ERRORS } from 'relq/cockroachdb-builder';
 *
 * const err = CRDB_ERRORS['CRDB_E001'];
 * console.log(err.message);      // 'MONEY type is not supported in CockroachDB.'
 * console.log(err.alternative);  // 'Use numeric({ precision: 19, scale: 4 }).'
 * ```
 *
 * @since 1.1.0
 */
export declare const CRDB_ERRORS: Record<string, CrdbErrorDef>;
/**
 * Warning-level validation codes for CockroachDB.
 *
 * Warnings indicate features that work but have behavioral differences
 * from PostgreSQL, or cases where a different approach is recommended.
 *
 * @since 1.1.0
 */
export declare const CRDB_WARNINGS: Record<string, CrdbErrorDef>;
/**
 * Informational messages for CockroachDB best practices.
 *
 * @since 1.1.0
 */
export declare const CRDB_INFO: Record<string, CrdbErrorDef>;
/**
 * Get a validation error/warning/info definition by code.
 *
 * @param code - The CRDB error code (e.g. 'CRDB_E001')
 * @returns The error definition, or undefined if code is unknown
 *
 * @example
 * ```typescript
 * const def = lookupErrorCode('CRDB_E001');
 * // { code: 'CRDB_E001', severity: 'error', message: 'MONEY type...', ... }
 * ```
 *
 * @since 1.1.0
 */
export declare function lookupErrorCode(code: string): CrdbErrorDef | undefined;
/**
 * Create a CrdbValidationMessage from an error code with optional location info.
 *
 * @param code - The CRDB error code
 * @param location - Optional location context (table, column, index, etc.)
 * @returns A fully populated validation message
 *
 * @example
 * ```typescript
 * const msg = createMessage('CRDB_E001', { tableName: 'products', columnName: 'price' });
 * // { code: 'CRDB_E001', severity: 'error', message: 'MONEY type...', tableName: 'products', ... }
 * ```
 *
 * @since 1.1.0
 */
declare function createMessage(code: string, location?: {
	tableName?: string;
	columnName?: string;
	indexName?: string;
	functionName?: string;
	triggerName?: string;
}): CrdbValidationMessage;
/**
 * Format a validation message for CLI output.
 *
 * @param msg - The validation message to format
 * @returns Multi-line formatted string
 *
 * @example
 * ```typescript
 * const formatted = formatMessage(msg);
 * // [CRDB_E001] Column 'products.price' uses MONEY type...
 * //   Alternative: Use numeric({ precision: 19, scale: 4 }).
 * ```
 *
 * @since 1.1.0
 */
declare function formatMessage(msg: CrdbValidationMessage): string;
/**
 * Format a complete validation result for CLI output.
 *
 * @param result - The validation result to format
 * @returns Multi-line formatted string matching the CLI output spec
 *
 * @since 1.1.0
 */
declare function formatValidationResult(result: CrdbValidationResult): string;
/**
 * CockroachDB Type Compatibility Mappings
 *
 * Maps every pg-schema column type to its CockroachDB compatibility status.
 * Each entry includes the support level, error code, and recommended alternative.
 *
 * @module cockroachdb-schema/type-mappings
 *
 * @since 1.1.0
 */
/**
 * CockroachDB support status for a PostgreSQL column type.
 *
 * - `supported`: Works identically to PostgreSQL.
 * - `behavioral-difference`: Works but has different behavior.
 * - `warning`: Works but is not recommended for CockroachDB.
 * - `unsupported`: Not available on CockroachDB.
 *
 * @since 1.1.0
 */
export type CrdbTypeStatus = "supported" | "behavioral-difference" | "warning" | "unsupported";
/**
 * A type compatibility mapping entry.
 *
 * @since 1.1.0
 */
export interface CrdbTypeMapping {
	/** The PostgreSQL SQL type name (uppercase) */
	readonly pgType: string;
	/** CockroachDB support status */
	readonly status: CrdbTypeStatus;
	/** CRDB error/warning code (undefined if fully supported) */
	readonly errorCode?: string;
	/** Recommended alternative when unsupported */
	readonly alternative?: string;
	/** Type category for grouping */
	readonly category: string;
	/** Short note about behavioral differences */
	readonly note?: string;
}
/**
 * Complete mapping of every pg-schema type to CockroachDB status.
 *
 * Keys are lowercase SQL type names. Use {@link getTypeMapping} for
 * case-insensitive lookup.
 *
 * @example
 * ```typescript
 * import { CRDB_TYPE_MAP } from 'relq/cockroachdb-builder';
 *
 * const moneyMapping = CRDB_TYPE_MAP['money'];
 * // { pgType: 'MONEY', status: 'unsupported', errorCode: 'CRDB_E001', ... }
 * ```
 *
 * @since 1.1.0
 */
export declare const CRDB_TYPE_MAP: Record<string, CrdbTypeMapping>;
/**
 * Get the CockroachDB type mapping for a SQL type name.
 *
 * Performs case-insensitive lookup and handles parameterized types
 * (e.g. `VARCHAR(255)` → matches `varchar`).
 *
 * @param sqlType - The SQL type name (e.g. 'MONEY', 'varchar(255)', 'TIMESTAMP WITH TIME ZONE')
 * @returns The type mapping, or undefined if the type is not in the registry
 *
 * @example
 * ```typescript
 * const m = getTypeMapping('MONEY');
 * // { pgType: 'MONEY', status: 'unsupported', errorCode: 'CRDB_E001', ... }
 *
 * const m2 = getTypeMapping('VARCHAR(255)');
 * // { pgType: 'VARCHAR', status: 'supported', ... }
 * ```
 *
 * @since 1.1.0
 */
declare function getTypeMapping(sqlType: string): CrdbTypeMapping | undefined;
/**
 * Check if a SQL type is supported on CockroachDB.
 *
 * @param sqlType - The SQL type name
 * @returns true if the type is supported (including with warnings/behavioral differences)
 *
 * @since 1.1.0
 */
declare function isTypeSupported(sqlType: string): boolean;
/**
 * Get all unsupported types grouped by category.
 *
 * @returns Map of category → unsupported type entries
 *
 * @since 1.1.0
 */
export declare function getUnsupportedTypesByCategory(): Map<string, CrdbTypeMapping[]>;
/**
 * Get all types that have behavioral differences from PostgreSQL.
 *
 * @returns Array of type mappings with behavioral differences or warnings
 *
 * @since 1.1.0
 */
export declare function getTypesWithDifferences(): CrdbTypeMapping[];
/**
 * Validate a column type for CockroachDB compatibility.
 *
 * @param sqlType - The SQL type string (e.g. 'MONEY', 'VARCHAR(255)', 'INT4RANGE')
 * @param tableName - Optional table name for error context
 * @param columnName - Optional column name for error context
 * @returns Array of validation messages (empty if type is fully supported)
 *
 * @example
 * ```typescript
 * const msgs = validateColumnType('MONEY', 'products', 'price');
 * // [{ code: 'CRDB_E001', message: 'MONEY type is not supported...', tableName: 'products', columnName: 'price' }]
 *
 * const msgs2 = validateColumnType('SERIAL', 'users', 'id');
 * // [{ code: 'CRDB_W001', severity: 'warning', message: 'SERIAL columns use unique_rowid()...' }]
 *
 * const msgs3 = validateColumnType('INTEGER');
 * // [] (fully supported)
 * ```
 *
 * @since 1.1.0
 */
declare function validateColumnType$1(sqlType: string, tableName?: string, columnName?: string): CrdbValidationMessage[];
/**
 * Validate multiple column types at once.
 *
 * @param columns - Array of { sqlType, tableName, columnName } entries
 * @returns All validation messages across all columns
 *
 * @example
 * ```typescript
 * const msgs = validateColumnTypes([
 *   { sqlType: 'MONEY', tableName: 'products', columnName: 'price' },
 *   { sqlType: 'INT4RANGE', tableName: 'bookings', columnName: 'period' },
 *   { sqlType: 'TEXT', tableName: 'users', columnName: 'name' },
 * ]);
 * // Returns messages for MONEY and INT4RANGE; TEXT produces no messages
 * ```
 *
 * @since 1.1.0
 */
declare function validateColumnTypes$1(columns: Array<{
	sqlType: string;
	tableName?: string;
	columnName?: string;
}>): CrdbValidationMessage[];
/**
 * Check if a specific column type is supported on CockroachDB.
 *
 * @param sqlType - The SQL type string
 * @returns Object with support status and optional alternative
 *
 * @example
 * ```typescript
 * const result = checkTypeSupport('MONEY');
 * // { supported: false, status: 'unsupported', alternative: 'numeric(...)' }
 *
 * const result2 = checkTypeSupport('INTEGER');
 * // { supported: true, status: 'supported' }
 *
 * const result3 = checkTypeSupport('SERIAL');
 * // { supported: true, status: 'warning', note: 'Uses unique_rowid()...' }
 * ```
 *
 * @since 1.1.0
 */
export declare function checkTypeSupport(sqlType: string): {
	supported: boolean;
	status: CrdbTypeMapping["status"] | "unknown";
	alternative?: string;
	note?: string;
	errorCode?: string;
};
/**
 * Get the recommended CockroachDB alternative for an unsupported type.
 *
 * @param sqlType - The unsupported SQL type
 * @returns The alternative recommendation, or null if type is supported
 *
 * @example
 * ```typescript
 * getAlternative('MONEY');    // 'numeric({ precision: 19, scale: 4 })'
 * getAlternative('INT4RANGE'); // 'Two integer() columns (lower, upper)'
 * getAlternative('TEXT');      // null (type is supported)
 * ```
 *
 * @since 1.1.0
 */
declare function getAlternative(sqlType: string): string | null;
/**
 * Get all blocked (unsupported) type names.
 *
 * @returns Array of uppercase SQL type names that are blocked
 *
 * @since 1.1.0
 */
export declare function getBlockedTypes(): string[];
/**
 * Get all warning-level type names (types that work but differ from PostgreSQL).
 *
 * @returns Array of uppercase SQL type names with warnings
 *
 * @since 1.1.0
 */
export declare function getWarningTypes(): string[];
/**
 * Constraint definition to validate.
 *
 * @since 1.1.0
 */
interface ConstraintInput {
	/** Constraint type */
	readonly type: "primary_key" | "unique" | "foreign_key" | "check" | "exclusion";
	/** Optional constraint name */
	readonly name?: string;
	/** Whether the constraint is deferrable */
	readonly deferrable?: boolean;
	/** Whether the constraint is initially deferred */
	readonly initiallyDeferred?: boolean;
	/** FK match type */
	readonly matchType?: "simple" | "full" | "partial";
	/** FK ON DELETE action */
	readonly onDelete?: "cascade" | "set null" | "set default" | "restrict" | "no action";
	/** FK ON UPDATE action */
	readonly onUpdate?: "cascade" | "set null" | "set default" | "restrict" | "no action";
	/** Whether the constraint is NOT ENFORCED (PG 17+) */
	readonly notEnforced?: boolean;
}
/**
 * Validate a constraint definition for CockroachDB compatibility.
 *
 * @param constraint - The constraint to validate
 * @param tableName - Table where the constraint is defined
 * @returns Array of validation messages (empty if fully compatible)
 *
 * @example
 * ```typescript
 * // EXCLUSION constraint → error
 * validateConstraint({ type: 'exclusion' }, 'bookings');
 * // [{ code: 'CRDB_E100', ... }]
 *
 * // DEFERRABLE FK → error
 * validateConstraint({ type: 'foreign_key', deferrable: true }, 'orders');
 * // [{ code: 'CRDB_E101', ... }]
 *
 * // Normal FK → no errors
 * validateConstraint({ type: 'foreign_key', onDelete: 'cascade' }, 'orders');
 * // []
 * ```
 *
 * @since 1.1.0
 */
declare function validateConstraint(constraint: ConstraintInput, tableName?: string): CrdbValidationMessage[];
/**
 * Validate multiple constraints at once.
 *
 * @param constraints - Array of constraints with table context
 * @returns All validation messages
 *
 * @since 1.1.0
 */
declare function validateConstraints(constraints: Array<{
	constraint: ConstraintInput;
	tableName?: string;
}>): CrdbValidationMessage[];
/**
 * Check if a constraint type is supported on CockroachDB.
 *
 * @param constraintType - The constraint type to check
 * @returns true if the constraint type is supported
 *
 * @since 1.1.0
 */
export declare function isConstraintTypeSupported(constraintType: ConstraintInput["type"]): boolean;
/**
 * List of constraint features blocked on CockroachDB.
 *
 * @since 1.1.0
 */
export declare const BLOCKED_CONSTRAINT_FEATURES: readonly [
	"EXCLUSION constraints",
	"DEFERRABLE modifier",
	"INITIALLY DEFERRED modifier",
	"MATCH PARTIAL (FK)",
	"NOT ENFORCED (PG 17+)"
];
/**
 * Trigger definition to validate.
 *
 * @since 1.1.0
 */
interface TriggerInput {
	/** Trigger name */
	readonly name?: string;
	/** Trigger timing */
	readonly timing?: "before" | "after" | "instead_of";
	/** Events that fire the trigger */
	readonly events?: Array<"insert" | "update" | "delete" | "truncate">;
	/** Columns specified with UPDATE OF */
	readonly updateOfColumns?: string[];
	/** FOR EACH ROW or FOR EACH STATEMENT */
	readonly forEach?: "row" | "statement";
	/** WHEN condition */
	readonly when?: string;
	/** Transition tables (REFERENCING OLD TABLE AS / NEW TABLE AS) */
	readonly referencingOldTable?: string;
	readonly referencingNewTable?: string;
	/** Whether this is a constraint trigger */
	readonly isConstraintTrigger?: boolean;
	/** Whether DROP should use CASCADE */
	readonly dropCascade?: boolean;
	/** The function body (for TG_ARGV scan) */
	readonly functionBody?: string;
}
/**
 * Validate a trigger definition for CockroachDB compatibility.
 *
 * @param trigger - The trigger definition to validate
 * @param tableName - Table where the trigger is defined
 * @returns Array of validation messages (empty if fully compatible)
 *
 * @example
 * ```typescript
 * // UPDATE OF columns → error
 * validateTrigger({ events: ['update'], updateOfColumns: ['name', 'email'] }, 'users');
 * // [{ code: 'CRDB_E500', ... }]
 *
 * // TRUNCATE event → error
 * validateTrigger({ events: ['truncate'] }, 'logs');
 * // [{ code: 'CRDB_E501', ... }]
 *
 * // Normal AFTER INSERT trigger → no errors
 * validateTrigger({ timing: 'after', events: ['insert'], forEach: 'row' }, 'users');
 * // []
 * ```
 *
 * @since 1.1.0
 */
declare function validateTrigger(trigger: TriggerInput, tableName?: string): CrdbValidationMessage[];
/**
 * Validate multiple trigger definitions at once.
 *
 * @param triggers - Array of trigger definitions with table context
 * @returns All validation messages
 *
 * @since 1.1.0
 */
declare function validateTriggers(triggers: Array<{
	trigger: TriggerInput;
	tableName?: string;
}>): CrdbValidationMessage[];
/**
 * List of trigger features blocked on CockroachDB.
 *
 * @since 1.1.0
 */
export declare const BLOCKED_TRIGGER_FEATURES: readonly [
	"UPDATE OF <column_list>",
	"TRUNCATE event",
	"REFERENCING OLD TABLE AS (transition tables)",
	"REFERENCING NEW TABLE AS (transition tables)",
	"CREATE CONSTRAINT TRIGGER",
	"DROP TRIGGER CASCADE"
];
/**
 * Function definition to validate.
 *
 * @since 1.1.0
 */
interface FunctionInput {
	/** Function name */
	readonly name?: string;
	/** Function language */
	readonly language?: "sql" | "plpgsql" | string;
	/** Function body text */
	readonly body?: string;
}
/**
 * Validate a function definition for CockroachDB compatibility.
 *
 * Scans the function body for unsupported PL/pgSQL constructs and
 * recommends LANGUAGE SQL when plpgsql is used.
 *
 * @param fn - The function definition to validate
 * @returns Array of validation messages (empty if fully compatible)
 *
 * @example
 * ```typescript
 * // Function with %TYPE → error
 * validateFunction({
 *   name: 'get_user',
 *   language: 'plpgsql',
 *   body: 'DECLARE v_name users.name%TYPE; BEGIN ...',
 * });
 * // [{ code: 'CRDB_E600', ... }, { code: 'CRDB_I600', ... }]
 *
 * // SQL function → no errors
 * validateFunction({
 *   name: 'add_one',
 *   language: 'sql',
 *   body: 'SELECT $1 + 1',
 * });
 * // []
 * ```
 *
 * @since 1.1.0
 */
declare function validateFunction(fn: FunctionInput): CrdbValidationMessage[];
/**
 * Validate multiple function definitions at once.
 *
 * @param functions - Array of function definitions
 * @returns All validation messages
 *
 * @since 1.1.0
 */
declare function validateFunctions(functions: FunctionInput[]): CrdbValidationMessage[];
/**
 * Scan a PL/pgSQL function body for unsupported constructs.
 *
 * Lower-level API that only checks the body text without
 * considering the language setting.
 *
 * @param body - The function body text
 * @param functionName - Optional function name for error context
 * @returns Array of error-level validation messages for blocked constructs
 *
 * @since 1.1.0
 */
export declare function scanFunctionBody(body: string, functionName?: string): CrdbValidationMessage[];
/**
 * List of PL/pgSQL constructs blocked in CockroachDB.
 *
 * @since 1.1.0
 */
export declare const BLOCKED_PLPGSQL_CONSTRUCTS: readonly [
	"%TYPE variable declaration",
	"%ROWTYPE variable declaration",
	"Ordinal parameters ($1, $2, ...)",
	"PERFORM statement",
	"EXECUTE ... INTO",
	"GET DIAGNOSTICS",
	"CASE statement (PL/pgSQL control flow)",
	"RETURN QUERY",
	"Nested BEGIN/EXCEPTION blocks",
	"FOR/FOREACH loops over queries"
];
/**
 * Index methods supported by CockroachDB.
 *
 * @since 1.1.0
 */
export type CrdbIndexMethod = "btree" | "hash" | "gin" | "gist" | "inverted";
/**
 * Index methods blocked on CockroachDB.
 *
 * @since 1.1.0
 */
export type CrdbBlockedIndexMethod = "spgist" | "brin";
/**
 * All PostgreSQL index methods for reference.
 *
 * @since 1.1.0
 */
export type PgIndexMethod = CrdbIndexMethod | CrdbBlockedIndexMethod;
/**
 * Configuration for a CockroachDB hash-sharded index.
 *
 * Hash-sharded indexes distribute sequential key writes across the cluster
 * by prepending a computed hash shard column.
 *
 * @example
 * ```typescript
 * const config: HashShardedConfig = {
 *   bucketCount: 8,
 * };
 * // Generates: CREATE INDEX idx ON t (col) USING HASH WITH (bucket_count = 8)
 * ```
 *
 * @since 1.1.0
 */
export interface HashShardedConfig {
	/**
	 * Number of hash buckets to distribute writes across.
	 *
	 * Must be at least 2. Recommended range: 8–64.
	 * Values above 256 may reduce scan performance.
	 *
	 * @default Uses cluster setting `sql.defaults.default_hash_sharded_index_bucket_count` (default 16)
	 */
	bucketCount?: number;
}
/**
 * CockroachDB-specific index options.
 *
 * @since 1.1.0
 */
export interface CrdbIndexOptions {
	/**
	 * Enable hash-sharding for sequential key distribution.
	 *
	 * @example
	 * ```typescript
	 * { hashSharded: { bucketCount: 8 } }
	 * ```
	 */
	hashSharded?: HashShardedConfig;
	/**
	 * Columns to STORE in the index (CockroachDB syntax for covering indexes).
	 * Equivalent to PostgreSQL's INCLUDE clause.
	 *
	 * @example
	 * ```typescript
	 * { storing: ['name', 'email'] }
	 * // Generates: ... STORING (name, email)
	 * ```
	 */
	storing?: string[];
}
/**
 * Index definition to validate for CockroachDB.
 *
 * @since 1.1.0
 */
interface IndexInput$1 {
	/** Index name */
	readonly name?: string;
	/** Index method */
	readonly method?: string;
	/** Columns in the index */
	readonly columns?: string[];
	/** INCLUDE columns (will be transformed to STORING) */
	readonly includeColumns?: string[];
	/** Whether CONCURRENTLY was specified */
	readonly concurrently?: boolean;
	/** Hash-sharded configuration */
	readonly hashSharded?: HashShardedConfig;
	/** Custom operator class (may be blocked) */
	readonly operatorClass?: string;
	/** Column ordering without explicit NULLS */
	readonly missingNullsSpec?: boolean;
}
/**
 * Validate an index definition for CockroachDB compatibility.
 *
 * @param index - The index definition to validate
 * @param tableName - Table where the index is defined
 * @returns Array of validation messages
 *
 * @example
 * ```typescript
 * // SP-GiST index → error
 * validateIndex({ method: 'spgist' }, 'locations');
 * // [{ code: 'CRDB_E200', ... }]
 *
 * // Hash-sharded with valid bucket count → no errors
 * validateIndex({ hashSharded: { bucketCount: 8 } }, 'events');
 * // []
 *
 * // CONCURRENTLY → warning
 * validateIndex({ concurrently: true }, 'users');
 * // [{ code: 'CRDB_W040', ... }]
 * ```
 *
 * @since 1.1.0
 */
declare function validateIndex(index: IndexInput$1, tableName?: string): CrdbValidationMessage[];
/**
 * Validate hash-sharded index configuration.
 *
 * @param config - The hash-sharded configuration
 * @param location - Error location context
 * @returns Array of validation messages
 *
 * @since 1.1.0
 */
export declare function validateHashSharded(config: HashShardedConfig, location?: {
	tableName?: string;
	indexName?: string;
}): CrdbValidationMessage[];
/**
 * Transform INCLUDE columns to STORING for CockroachDB SQL generation.
 *
 * @param includeColumns - Columns from PostgreSQL INCLUDE clause
 * @returns SQL fragment with STORING syntax
 *
 * @example
 * ```typescript
 * transformIncludeToStoring(['name', 'email']);
 * // 'STORING (name, email)'
 * ```
 *
 * @since 1.1.0
 */
export declare function transformIncludeToStoring(includeColumns: string[]): string;
/**
 * Generate hash-sharded index SQL fragment.
 *
 * @param config - Hash-sharded configuration
 * @returns SQL fragment for the hash-sharded clause
 *
 * @example
 * ```typescript
 * generateHashShardedSQL({ bucketCount: 8 });
 * // 'USING HASH WITH (bucket_count = 8)'
 *
 * generateHashShardedSQL({});
 * // 'USING HASH'
 * ```
 *
 * @since 1.1.0
 */
export declare function generateHashShardedSQL(config: HashShardedConfig): string;
/**
 * Check if an index method is supported on CockroachDB.
 *
 * @param method - The index method name
 * @returns true if supported
 *
 * @since 1.1.0
 */
export declare function isCrdbIndexMethodSupported(method: string): boolean;
/**
 * List of blocked index methods on CockroachDB.
 *
 * @since 1.1.0
 */
export declare const BLOCKED_INDEX_METHODS: readonly [
	"spgist",
	"brin"
];
/**
 * Supported index methods on CockroachDB.
 *
 * @since 1.1.0
 */
export declare const SUPPORTED_INDEX_METHODS: readonly CrdbIndexMethod[];
/**
 * CockroachDB table locality — REGIONAL BY TABLE.
 *
 * All data for the table lives in a single home region.
 *
 * @example
 * ```typescript
 * const locality: CrdbRegionalByTable = {
 *   type: 'regional-by-table',
 *   region: 'us-east1',
 * };
 * ```
 *
 * @since 1.1.0
 */
export interface CrdbRegionalByTable {
	readonly type: "regional-by-table";
	/**
	 * Home region for the table. If omitted, uses the database primary region.
	 */
	readonly region?: string;
}
/**
 * CockroachDB table locality — REGIONAL BY ROW.
 *
 * Each row is homed in a specific region based on a region column.
 * CockroachDB adds a hidden `crdb_region` column (or uses a custom one).
 *
 * @example
 * ```typescript
 * const locality: CrdbRegionalByRow = {
 *   type: 'regional-by-row',
 * };
 *
 * // With custom region column:
 * const locality: CrdbRegionalByRow = {
 *   type: 'regional-by-row',
 *   column: 'user_region',
 * };
 * ```
 *
 * @since 1.1.0
 */
export interface CrdbRegionalByRow {
	readonly type: "regional-by-row";
	/**
	 * Custom region column name. If omitted, CockroachDB uses the hidden
	 * `crdb_region` column (automatically added).
	 */
	readonly column?: string;
}
/**
 * CockroachDB table locality — GLOBAL.
 *
 * Provides low-latency reads from all regions using non-blocking transactions.
 * Writes are slower (must propagate globally).
 * Best for read-heavy reference data (countries, currencies, settings).
 *
 * @example
 * ```typescript
 * const locality: CrdbGlobal = { type: 'global' };
 * ```
 *
 * @since 1.1.0
 */
export interface CrdbGlobal {
	readonly type: "global";
}
/**
 * CockroachDB table locality configuration.
 *
 * @example
 * ```typescript
 * import type { CrdbTableLocality } from 'relq/cockroachdb-builder';
 *
 * // Regional by table (default):
 * const loc1: CrdbTableLocality = { type: 'regional-by-table', region: 'us-east1' };
 *
 * // Regional by row (per-row geo-partitioning):
 * const loc2: CrdbTableLocality = { type: 'regional-by-row' };
 *
 * // Global (low-latency reads everywhere):
 * const loc3: CrdbTableLocality = { type: 'global' };
 * ```
 *
 * @since 1.1.0
 */
export type CrdbTableLocality = CrdbRegionalByTable | CrdbRegionalByRow | CrdbGlobal;
/**
 * CockroachDB database survival goal.
 *
 * - `zone`: Survives loss of one availability zone (default). Requires 3+ zones.
 * - `region`: Survives loss of an entire region. Requires 3+ regions.
 *
 * @since 1.1.0
 */
export type CrdbSurvivalGoal = "zone" | "region";
/**
 * CockroachDB database-level multi-region configuration.
 *
 * @example
 * ```typescript
 * const dbConfig: CrdbDatabaseConfig = {
 *   regions: ['us-east1', 'us-west1', 'eu-west1'],
 *   primaryRegion: 'us-east1',
 *   survivalGoal: 'region',
 *   superRegions: {
 *     europe: ['eu-west1', 'eu-central1'],
 *     americas: ['us-east1', 'us-west1'],
 *   },
 * };
 * ```
 *
 * @since 1.1.0
 */
export interface CrdbDatabaseConfig {
	/** Regions to add to the database */
	readonly regions?: string[];
	/** Primary region for the database */
	readonly primaryRegion?: string;
	/** Survivability goal */
	readonly survivalGoal?: CrdbSurvivalGoal;
	/** Super region definitions (name → region list) */
	readonly superRegions?: Record<string, string[]>;
}
/**
 * Generate ALTER TABLE SQL for setting table locality.
 *
 * @param tableName - The table name
 * @param locality - The locality configuration
 * @returns SQL string for ALTER TABLE SET LOCALITY
 *
 * @example
 * ```typescript
 * generateLocalitySQL('users', { type: 'regional-by-table', region: 'us-east1' });
 * // "ALTER TABLE users SET LOCALITY REGIONAL BY TABLE IN 'us-east1'"
 *
 * generateLocalitySQL('orders', { type: 'regional-by-row' });
 * // 'ALTER TABLE orders SET LOCALITY REGIONAL BY ROW'
 *
 * generateLocalitySQL('countries', { type: 'global' });
 * // 'ALTER TABLE countries SET LOCALITY GLOBAL'
 * ```
 *
 * @since 1.1.0
 */
export declare function generateLocalitySQL(tableName: string, locality: CrdbTableLocality): string;
/**
 * Generate ALTER DATABASE SQL for multi-region configuration.
 *
 * @param dbName - The database name
 * @param config - The database configuration
 * @returns Array of SQL statements to apply
 *
 * @example
 * ```typescript
 * generateDatabaseConfigSQL('mydb', {
 *   regions: ['us-east1', 'us-west1', 'eu-west1'],
 *   primaryRegion: 'us-east1',
 *   survivalGoal: 'region',
 * });
 * // [
 * //   "ALTER DATABASE mydb PRIMARY REGION 'us-east1'",
 * //   "ALTER DATABASE mydb ADD REGION 'us-west1'",
 * //   "ALTER DATABASE mydb ADD REGION 'eu-west1'",
 * //   'ALTER DATABASE mydb SURVIVE REGION FAILURE',
 * // ]
 * ```
 *
 * @since 1.1.0
 */
export declare function generateDatabaseConfigSQL(dbName: string, config: CrdbDatabaseConfig): string[];
/**
 * Validate a locality configuration against CockroachDB rules.
 *
 * @param locality - The locality configuration
 * @param databaseConfig - Optional database-level config for cross-validation
 * @param tableName - Table name for error context
 * @returns Array of validation messages
 *
 * @example
 * ```typescript
 * // REGIONAL BY ROW without multi-region DB → error
 * validateLocality(
 *   { type: 'regional-by-row' },
 *   undefined, // no database config
 *   'orders'
 * );
 * // [{ code: 'CRDB_E700', ... }]
 * ```
 *
 * @since 1.1.0
 */
export declare function validateLocality(locality: CrdbTableLocality, databaseConfig?: CrdbDatabaseConfig, tableName?: string): CrdbValidationMessage[];
/**
 * Validate database-level multi-region configuration.
 *
 * @param config - The database configuration
 * @returns Array of validation messages
 *
 * @since 1.1.0
 */
export declare function validateDatabaseConfig(config: CrdbDatabaseConfig): CrdbValidationMessage[];
/**
 * CockroachDB Zone Configuration
 *
 * Types and SQL generation for CockroachDB zone configurations,
 * which control data placement and replication. Zone configs replace
 * PostgreSQL's TABLESPACE concept.
 *
 * @module cockroachdb-schema/zone-config
 *
 * @since 1.1.0
 */
/**
 * CockroachDB zone configuration for a table, index, or database.
 *
 * @example
 * ```typescript
 * const config: CrdbZoneConfig = {
 *   numReplicas: 5,
 *   constraints: { 'us-east1': 2, 'us-west1': 2, 'eu-west1': 1 },
 *   leasePreferences: ['us-east1'],
 *   gcTtlSeconds: 3600,
 * };
 * ```
 *
 * @since 1.1.0
 */
export interface CrdbZoneConfig {
	/**
	 * Number of replicas for ranges in this zone.
	 * @default 3
	 */
	numReplicas?: number;
	/**
	 * Replication constraints. Can be:
	 * - A record mapping locality → replica count
	 * - An array of required localities
	 *
	 * @example
	 * ```typescript
	 * // Distribute 5 replicas: 2 in us-east1, 2 in us-west1, 1 in eu-west1
	 * constraints: { 'us-east1': 2, 'us-west1': 2, 'eu-west1': 1 }
	 *
	 * // Require SSD storage
	 * constraints: ['+ssd']
	 *
	 * // Prohibit a specific region
	 * constraints: ['-us-west2']
	 * ```
	 */
	constraints?: Record<string, number> | string[];
	/**
	 * Preferred leaseholder localities.
	 * The leaseholder serves reads and coordinates writes.
	 *
	 * @example
	 * ```typescript
	 * leasePreferences: ['us-east1']
	 * ```
	 */
	leasePreferences?: string[];
	/**
	 * MVCC garbage collection interval in seconds.
	 * @default 14400 (4 hours)
	 */
	gcTtlSeconds?: number;
	/**
	 * Minimum range size in bytes.
	 * @default 134217728 (128MB)
	 */
	rangeMinBytes?: number;
	/**
	 * Maximum range size in bytes.
	 * @default 536870912 (512MB)
	 */
	rangeMaxBytes?: number;
}
/**
 * Generate ALTER TABLE CONFIGURE ZONE SQL.
 *
 * @param tableName - The table name
 * @param config - The zone configuration
 * @returns SQL string for CONFIGURE ZONE
 *
 * @example
 * ```typescript
 * generateTableZoneSQL('users', {
 *   numReplicas: 5,
 *   constraints: { 'us-east1': 2, 'us-west1': 2, 'eu-west1': 1 },
 *   leasePreferences: ['us-east1'],
 * });
 * // "ALTER TABLE users CONFIGURE ZONE USING num_replicas = 5, ..."
 * ```
 *
 * @since 1.1.0
 */
export declare function generateTableZoneSQL(tableName: string, config: CrdbZoneConfig): string;
/**
 * Generate ALTER INDEX CONFIGURE ZONE SQL.
 *
 * @param tableName - The table name
 * @param indexName - The index name
 * @param config - The zone configuration
 * @returns SQL string for CONFIGURE ZONE on an index
 *
 * @since 1.1.0
 */
export declare function generateIndexZoneSQL(tableName: string, indexName: string, config: CrdbZoneConfig): string;
/**
 * Generate ALTER DATABASE CONFIGURE ZONE SQL.
 *
 * @param dbName - The database name
 * @param config - The zone configuration
 * @returns SQL string for database-level zone config
 *
 * @since 1.1.0
 */
export declare function generateDatabaseZoneSQL(dbName: string, config: CrdbZoneConfig): string;
/**
 * Validate a zone configuration.
 *
 * @param config - The zone configuration to validate
 * @returns Array of validation error messages (empty if valid)
 *
 * @since 1.1.0
 */
export declare function validateZoneConfig(config: CrdbZoneConfig): string[];
/**
 * CockroachDB row-level TTL configuration for a table.
 *
 * @example
 * ```typescript
 * const ttl: CrdbTTLConfig = {
 *   expirationExpression: "created_at + INTERVAL '30 days'",
 *   jobCron: '0 * * * *',       // Every hour
 *   deleteBatchSize: 100,
 *   deleteRateLimit: 1000,       // Max 1000 deletes/sec/node
 * };
 * ```
 *
 * @since 1.1.0
 */
export interface CrdbTTLConfig {
	/**
	 * SQL expression that evaluates to the expiration timestamp.
	 * When `now() >= expirationExpression`, the row is eligible for deletion.
	 *
	 * @example
	 * ```typescript
	 * expirationExpression: "created_at + INTERVAL '30 days'"
	 * expirationExpression: "expires_at"
	 * expirationExpression: "updated_at + INTERVAL '90 days'"
	 * ```
	 */
	expirationExpression: string;
	/**
	 * Cron schedule for the TTL deletion job.
	 * @default '@hourly'
	 *
	 * @example
	 * ```typescript
	 * jobCron: '0 * * * *'   // Every hour
	 * jobCron: '0 0 * * *'   // Daily at midnight
	 * jobCron: '@daily'       // Daily
	 * ```
	 */
	jobCron?: string;
	/**
	 * Number of rows to select per batch during deletion.
	 * @default 500
	 */
	selectBatchSize?: number;
	/**
	 * Number of rows to delete per batch.
	 * @default 100
	 */
	deleteBatchSize?: number;
	/**
	 * Maximum number of deletes per second per node.
	 * 0 means unlimited.
	 * @default 0
	 */
	deleteRateLimit?: number;
	/**
	 * Whether to pause the TTL job.
	 * @default false
	 */
	pause?: boolean;
	/**
	 * Whether to suppress changefeed DELETE messages when TTL deletes rows.
	 * @default false
	 */
	disableChangefeedReplication?: boolean;
	/**
	 * Whether to label TTL metrics by table name for monitoring.
	 * @default false
	 */
	labelMetrics?: boolean;
	/**
	 * Polling interval for row statistics (e.g. '10m', '1h').
	 * @default '10m'
	 */
	rowStatsPollInterval?: string;
}
/**
 * Generate CREATE TABLE ... WITH TTL storage parameters.
 *
 * @param config - The TTL configuration
 * @returns SQL fragment for the WITH clause (storage parameters)
 *
 * @example
 * ```typescript
 * generateTTLStorageParams({
 *   expirationExpression: "created_at + INTERVAL '30 days'",
 *   jobCron: '0 * * * *',
 *   deleteBatchSize: 100,
 * });
 * // "ttl_expiration_expression = 'created_at + INTERVAL ''30 days''', ttl_job_cron = '0 * * * *', ttl_delete_batch_size = 100"
 * ```
 *
 * @since 1.1.0
 */
export declare function generateTTLStorageParams(config: CrdbTTLConfig): string;
/**
 * Generate ALTER TABLE SET (...) SQL for adding TTL to an existing table.
 *
 * @param tableName - The table name
 * @param config - The TTL configuration
 * @returns SQL string
 *
 * @example
 * ```typescript
 * generateAlterTableTTL('events', {
 *   expirationExpression: "created_at + INTERVAL '30 days'",
 *   jobCron: '0 0 * * *',
 * });
 * // "ALTER TABLE events SET (ttl_expiration_expression = ..., ttl_job_cron = ...)"
 * ```
 *
 * @since 1.1.0
 */
export declare function generateAlterTableTTL(tableName: string, config: CrdbTTLConfig): string;
/**
 * Generate ALTER TABLE RESET (...) SQL to remove TTL from a table.
 *
 * @param tableName - The table name
 * @returns SQL string
 *
 * @since 1.1.0
 */
export declare function generateRemoveTTL(tableName: string): string;
/**
 * Validate a TTL configuration.
 *
 * @param config - The TTL configuration to validate
 * @param tableName - Table name for error context
 * @returns Array of validation messages
 *
 * @example
 * ```typescript
 * // Missing expirationExpression → error
 * validateTTL({ expirationExpression: '' }, 'events');
 * // [{ code: 'CRDB_E710', ... }]
 * ```
 *
 * @since 1.1.0
 */
export declare function validateTTL(config: CrdbTTLConfig, tableName?: string): CrdbValidationMessage[];
/**
 * CockroachDB Schema Builder
 *
 * Exports only CockroachDB-compatible column types, table definitions,
 * and schema features. Unsupported PostgreSQL features are intentionally
 * NOT exported to provide compile-time safety.
 *
 * @module relq/cockroachdb-builder
 *
 * @example
 * ```typescript
 * import { defineTable, text, integer, uuid, jsonb, genRandomUuid } from 'relq/cockroachdb-builder';
 *
 * export const users = defineTable('users', {
 *   id: uuid().primaryKey().default(genRandomUuid()),
 *   name: text().notNull(),
 *   age: integer(),
 *   metadata: jsonb(),
 * });
 * ```
 *
 * @remarks
 * **Not available in this builder (use `relq/pg-builder` instead):**
 * - Geometric types (POINT, LINE, LSEG, BOX, PATH, POLYGON, CIRCLE)
 * - MONEY type (use DECIMAL(19,4))
 * - XML type (use TEXT)
 * - Range/Multirange types
 * - Object identifier types (OID, REGCLASS, etc.)
 * - pgvector types (VECTOR, HALFVEC, SPARSEVEC)
 * - PostGIS types (GEOMETRY, GEOGRAPHY)
 * - Extension types (CITEXT, LTREE, HSTORE, CUBE, SEMVER)
 * - Triggers (pgTrigger)
 * - DEFERRABLE foreign keys
 *
 * @since 1.1.0
 */
/**
 * CockroachDB dialect identifier.
 *
 * Use this when configuring Relq to target CockroachDB.
 *
 * @example
 * ```typescript
 * import { DIALECT } from 'relq/cockroachdb-builder';
 * console.log(DIALECT); // 'cockroachdb'
 * ```
 */
export declare const DIALECT: "cockroachdb";
/**
 * Validate a schema specifically for CockroachDB compatibility.
 *
 * Convenience wrapper around `validateSchemaForDialect` pre-configured
 * for the CockroachDB dialect.
 *
 * @param schema - The schema to validate
 * @returns Validation result with CockroachDB-specific errors and suggestions
 *
 * @example
 * ```typescript
 * import { validateForCockroachDB } from 'relq/cockroachdb-builder';
 *
 * const result = validateForCockroachDB(mySchema);
 * if (!result.valid) {
 *   result.errors.forEach(e => console.error(e.message));
 * }
 * ```
 *
 * @since 1.1.0
 */
export declare function validateForCockroachDB(schema: SchemaInput): ValidationResult;
/**
 * Check if a column type is supported on CockroachDB.
 *
 * @param sqlType - The SQL type string (e.g., 'VECTOR', 'MONEY', 'INTEGER')
 * @returns Type validation result with support status and alternatives
 *
 * @example
 * ```typescript
 * import { isSupportedType } from 'relq/cockroachdb-builder';
 *
 * const result = isSupportedType('MONEY');
 * // { supported: false, reason: 'MONEY type not supported', alternative: 'Use DECIMAL(19,4) for monetary values' }
 *
 * const result2 = isSupportedType('JSONB');
 * // { supported: true }
 * ```
 *
 * @since 1.1.0
 */
export declare function isSupportedType(sqlType: string): TypeValidationResult;
/**
 * Features NOT supported on CockroachDB.
 *
 * This constant documents all PostgreSQL features that are unavailable
 * when using CockroachDB. Use it for runtime checks or documentation.
 *
 * @example
 * ```typescript
 * import { UNSUPPORTED_FEATURES } from 'relq/cockroachdb-builder';
 *
 * console.log(UNSUPPORTED_FEATURES.columnTypes);
 * // ['MONEY', 'XML', 'POINT', 'LINE', ...]
 *
 * console.log(UNSUPPORTED_FEATURES.indexMethods);
 * // ['gist', 'spgist', 'brin']
 * ```
 *
 * @since 1.1.0
 */
export declare const UNSUPPORTED_FEATURES: {
	/** Column types not available on CockroachDB */
	readonly columnTypes: readonly [
		"MONEY",
		"XML",
		"POINT",
		"LINE",
		"LSEG",
		"BOX",
		"PATH",
		"POLYGON",
		"CIRCLE",
		"INT4RANGE",
		"INT8RANGE",
		"NUMRANGE",
		"TSRANGE",
		"TSTZRANGE",
		"DATERANGE",
		"INT4MULTIRANGE",
		"INT8MULTIRANGE",
		"NUMMULTIRANGE",
		"TSMULTIRANGE",
		"TSTZMULTIRANGE",
		"DATEMULTIRANGE",
		"OID",
		"REGCLASS",
		"REGPROC",
		"REGTYPE",
		"REGNAMESPACE",
		"REGROLE",
		"PG_LSN",
		"PG_SNAPSHOT",
		"VECTOR",
		"HALFVEC",
		"SPARSEVEC",
		"GEOMETRY",
		"GEOGRAPHY",
		"CITEXT",
		"LTREE",
		"LQUERY",
		"LTXTQUERY",
		"HSTORE",
		"CUBE",
		"SEMVER"
	];
	/** Index methods not available on CockroachDB */
	readonly indexMethods: readonly [
		"gist",
		"spgist",
		"brin"
	];
	/** Schema features not available on CockroachDB */
	readonly schemaFeatures: readonly [
		"triggers",
		"deferrableForeignKeys",
		"tableInheritance",
		"listenNotify"
	];
	/** Alternatives for unsupported types */
	readonly alternatives: {
		readonly MONEY: "Use decimal(19, 4) for monetary values";
		readonly XML: "Use text() to store XML data";
		readonly POINT: "Use jsonb() to store geometric data as GeoJSON";
		readonly VECTOR: "Use jsonb() or text() to store embeddings (no native vector similarity search)";
		readonly GEOMETRY: "CockroachDB has native spatial types with different syntax";
		readonly CITEXT: "Use text() with LOWER() in queries or case-insensitive collation";
		readonly LTREE: "Use text() with application-level path handling";
		readonly HSTORE: "Use jsonb() instead";
		readonly CUBE: "Use jsonb() or array of float8";
	};
};

export {
	ConstraintInput as CrdbConstraintInput,
	FunctionInput as CrdbFunctionInput,
	FunctionLanguage as PgFunctionLanguage,
	FunctionLanguage$1 as DDLFunctionLanguage,
	FunctionOptions as PgFunctionOptions,
	FunctionReturnType as PgFunctionReturnType,
	FunctionReturnType$1 as DDLFunctionReturnType,
	FunctionSecurity as PgFunctionSecurity,
	FunctionSecurity$1 as DDLFunctionSecurity,
	FunctionType as DDLFunctionType,
	FunctionVolatility as PgFunctionVolatility,
	FunctionVolatility$1 as DDLFunctionVolatility,
	IndexInput$1 as CrdbIndexInput,
	ParsedColumn$1 as ParsedColumn,
	ParsedTable$1 as ParsedTable,
	TriggerInput as CrdbTriggerInput,
	createMessage as createCrdbMessage,
	createValidationResult as createCrdbValidationResult,
	formatMessage as formatCrdbMessage,
	formatValidationResult as formatCrdbValidationResult,
	getAlternative as getCrdbAlternative,
	getTypeMapping as getCrdbTypeMapping,
	isTypeSupported as isCrdbTypeSupported,
	validateColumnType$1 as validateCrdbColumnType,
	validateColumnTypes$1 as validateCrdbColumnTypes,
	validateConstraint as validateCrdbConstraint,
	validateConstraints as validateCrdbConstraints,
	validateFunction as validateCrdbFunction,
	validateFunctions as validateCrdbFunctions,
	validateIndex as validateCrdbIndex,
	validateTrigger as validateCrdbTrigger,
	validateTriggers as validateCrdbTriggers,
};

export {};
