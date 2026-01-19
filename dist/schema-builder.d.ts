/**
 * Type-safe PostgreSQL DEFAULT value helpers
 * Covers all PostgreSQL default value types with 100% typed output
 */
export interface DefaultValue {
	readonly $sql: string;
	readonly $isDefault: true;
}
export declare const DEFAULT: {
	readonly genRandomUuid: () => DefaultValue;
	readonly uuidGenerateV4: () => DefaultValue;
	readonly uuidGenerateV1: () => DefaultValue;
	readonly uuidGenerateV1mc: () => DefaultValue;
	readonly uuidNil: () => DefaultValue;
	readonly now: () => DefaultValue;
	readonly currentTimestamp: () => DefaultValue;
	readonly currentDate: () => DefaultValue;
	readonly currentTime: () => DefaultValue;
	readonly localTimestamp: () => DefaultValue;
	readonly localTime: () => DefaultValue;
	readonly transactionTimestamp: () => DefaultValue;
	readonly statementTimestamp: () => DefaultValue;
	readonly clockTimestamp: () => DefaultValue;
	readonly timeofday: () => DefaultValue;
	readonly interval: (value: string) => DefaultValue;
	/** Current time as epoch milliseconds (BIGINT) - use with epoch() column */
	readonly epochNow: () => DefaultValue;
	/** Current time as epoch seconds (BIGINT) */
	readonly epochSeconds: () => DefaultValue;
	readonly currentUser: () => DefaultValue;
	readonly sessionUser: () => DefaultValue;
	readonly user: () => DefaultValue;
	readonly currentSchema: () => DefaultValue;
	readonly currentDatabase: () => DefaultValue;
	readonly currentCatalog: () => DefaultValue;
	readonly inetClientAddr: () => DefaultValue;
	readonly inetClientPort: () => DefaultValue;
	readonly inetServerAddr: () => DefaultValue;
	readonly inetServerPort: () => DefaultValue;
	readonly pgBackendPid: () => DefaultValue;
	readonly nextval: (sequenceName: string) => DefaultValue;
	readonly currval: (sequenceName: string) => DefaultValue;
	readonly lastval: () => DefaultValue;
	readonly random: () => DefaultValue;
	readonly pi: () => DefaultValue;
	readonly emptyString: () => DefaultValue;
	readonly emptyObject: () => DefaultValue;
	readonly emptyJson: () => DefaultValue;
	readonly emptyJsonb: () => DefaultValue;
	readonly emptyArray: () => DefaultValue;
	readonly emptyArrayOf: (type: string) => DefaultValue;
	readonly true: () => DefaultValue;
	readonly false: () => DefaultValue;
	readonly null: () => DefaultValue;
	readonly zero: () => DefaultValue;
	readonly one: () => DefaultValue;
	readonly negativeOne: () => DefaultValue;
	readonly string: (value: string) => DefaultValue;
	readonly number: (value: number) => DefaultValue;
	readonly integer: (value: number) => DefaultValue;
	readonly decimal: (value: number, precision?: number) => DefaultValue;
	readonly cast: (value: string | number, type: string) => DefaultValue;
	readonly emptyTsvector: () => DefaultValue;
	readonly point: (x: number, y: number) => DefaultValue;
	readonly inet: (address: string) => DefaultValue;
	readonly cidr: (network: string) => DefaultValue;
	readonly macaddr: (address: string) => DefaultValue;
	readonly emptyInt4range: () => DefaultValue;
	readonly emptyInt8range: () => DefaultValue;
	readonly emptyNumrange: () => DefaultValue;
	readonly emptyTsrange: () => DefaultValue;
	readonly emptyTstzrange: () => DefaultValue;
	readonly emptyDaterange: () => DefaultValue;
	readonly emptyHstore: () => DefaultValue;
	readonly emptyBytea: () => DefaultValue;
	readonly money: (value: number | string) => DefaultValue;
	readonly zeroMoney: () => DefaultValue;
};
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
export declare const EMPTY_OBJECT: unique symbol;
export declare const EMPTY_ARRAY: unique symbol;
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
};
/** Create a fluent chainable expression for generated columns */
export declare function createFluentGenExpr(sql: string): FluentGenExpr;
export declare const integer: <T extends number = number>(columnName?: string) => ColumnBuilder<T, ColumnConfig<T>>;
export declare const int: <T extends number = number>(columnName?: string) => ColumnBuilder<T, ColumnConfig<T>>;
export declare const int4: <T extends number = number>(columnName?: string) => ColumnBuilder<T, ColumnConfig<T>>;
export declare const smallint: <T extends number = number>(columnName?: string) => ColumnBuilder<T, ColumnConfig<T>>;
export declare const int2: <T extends number = number>(columnName?: string) => ColumnBuilder<T, ColumnConfig<T>>;
export declare const bigint: <T extends bigint = bigint>(columnName?: string) => ColumnBuilder<T, ColumnConfig<T>>;
export declare const int8: <T extends bigint = bigint>(columnName?: string) => ColumnBuilder<T, ColumnConfig<T>>;
export declare const serial: (columnName?: string) => ColumnBuilder<number, ColumnConfig<number>>;
export declare const serial4: (columnName?: string) => ColumnBuilder<number, ColumnConfig<number>>;
export declare const smallserial: (columnName?: string) => ColumnBuilder<number, ColumnConfig<number>>;
export declare const serial2: (columnName?: string) => ColumnBuilder<number, ColumnConfig<number>>;
export declare const bigserial: (columnName?: string) => ColumnBuilder<bigint, ColumnConfig<bigint>>;
export declare const serial8: (columnName?: string) => ColumnBuilder<bigint, ColumnConfig<bigint>>;
/**
 * Epoch timestamp column (BIGINT storing milliseconds since Unix epoch)
 * Use with DEFAULT.epochNow() for auto-generated timestamps
 *
 * @example
 * ```typescript
 * createdAt: epoch().default(DEFAULT.epochNow()),
 * updatedAt: epoch().default(DEFAULT.epochNow()),
 * ```
 */
export declare const epoch: (columnName?: string) => ColumnBuilder<number, ColumnConfig<number>>;
export declare const decimal: (columnNameOrOpts?: string | number | {
	precision?: number;
	scale?: number;
}, scale?: number) => ColumnBuilder<string | number>;
export declare const numeric: (columnNameOrOpts?: string | number | {
	precision?: number;
	scale?: number;
}, scale?: number) => ColumnBuilder<string | number>;
export declare const real: (columnName?: string) => ColumnBuilder<number, ColumnConfig<number>>;
export declare const float4: (columnName?: string) => ColumnBuilder<number, ColumnConfig<number>>;
export declare const doublePrecision: (columnName?: string) => ColumnBuilder<number, ColumnConfig<number>>;
export declare const float8: (columnName?: string) => ColumnBuilder<number, ColumnConfig<number>>;
export declare const money: (columnName?: string) => ColumnBuilder<string, ColumnConfig<string>>;
export interface VarcharOptions {
	length?: number;
}
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
export declare const text: <T extends string = string>(columnName?: string) => ColumnBuilder<T, ColumnConfig<T>>;
export declare const bytea: (columnName?: string) => ColumnBuilder<Buffer<ArrayBufferLike> | Uint8Array<ArrayBufferLike>, ColumnConfig<Buffer<ArrayBufferLike> | Uint8Array<ArrayBufferLike>>>;
export interface TimestampOptions {
	precision?: number;
	withTimezone?: boolean;
}
export declare function timestamp(): ColumnBuilder<Date>;
export declare function timestamp(precision: number): ColumnBuilder<Date>;
export declare function timestamp(options: TimestampOptions): ColumnBuilder<Date>;
export declare function timestamp(columnName: string): ColumnBuilder<Date>;
export declare function timestamp(columnName: string, options: TimestampOptions): ColumnBuilder<Date>;
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
export declare const boolean: (columnName?: string) => ColumnBuilder<boolean, ColumnConfig<boolean>>;
export declare const bool: (columnName?: string) => ColumnBuilder<boolean, ColumnConfig<boolean>>;
export declare const point: (columnName?: string) => ColumnBuilder<{
	x: number;
	y: number;
}, ColumnConfig<{
	x: number;
	y: number;
}>>;
export declare const line: (columnName?: string) => ColumnBuilder<{
	a: number;
	b: number;
	c: number;
}, ColumnConfig<{
	a: number;
	b: number;
	c: number;
}>>;
export declare const lseg: (columnName?: string) => ColumnBuilder<[
	[
		number,
		number
	],
	[
		number,
		number
	]
], ColumnConfig<[
	[
		number,
		number
	],
	[
		number,
		number
	]
]>>;
export declare const box: (columnName?: string) => ColumnBuilder<[
	[
		number,
		number
	],
	[
		number,
		number
	]
], ColumnConfig<[
	[
		number,
		number
	],
	[
		number,
		number
	]
]>>;
export declare const path: (columnName?: string) => ColumnBuilder<{
	x: number;
	y: number;
}[], ColumnConfig<{
	x: number;
	y: number;
}[]>>;
export declare const polygon: (columnName?: string) => ColumnBuilder<{
	x: number;
	y: number;
}[], ColumnConfig<{
	x: number;
	y: number;
}[]>>;
export declare const circle: (columnName?: string) => ColumnBuilder<{
	x: number;
	y: number;
	r: number;
}, ColumnConfig<{
	x: number;
	y: number;
	r: number;
}>>;
export declare const cidr: (columnName?: string) => ColumnBuilder<string, ColumnConfig<string>>;
export declare const inet: (columnName?: string) => ColumnBuilder<string, ColumnConfig<string>>;
export declare const macaddr: (columnName?: string) => ColumnBuilder<string, ColumnConfig<string>>;
export declare const macaddr8: (columnName?: string) => ColumnBuilder<string, ColumnConfig<string>>;
export declare const bit: (length?: number) => ColumnBuilder<string, ColumnConfig<string>>;
export declare const bitVarying: (length?: number) => ColumnBuilder<string, ColumnConfig<string>>;
export declare const varbit: (length?: number) => ColumnBuilder<string, ColumnConfig<string>>;
export declare const tsvector: (columnName?: string) => ColumnBuilder<string, ColumnConfig<string>>;
export declare const tsquery: (columnName?: string) => ColumnBuilder<string, ColumnConfig<string>>;
export declare const uuid: (columnName?: string) => ColumnBuilder<string, ColumnConfig<string>>;
export declare const xml: (columnName?: string) => ColumnBuilder<string, ColumnConfig<string>>;
export declare const json: <T = unknown>(columnName?: string) => ColumnBuilder<T, ColumnConfig<T>>;
export declare const jsonb: <T = unknown>(columnName?: string) => ColumnBuilder<T, ColumnConfig<T>>;
export declare const int4range: () => ColumnBuilder<string, ColumnConfig<string>>;
export declare const int8range: () => ColumnBuilder<string, ColumnConfig<string>>;
export declare const numrange: () => ColumnBuilder<string, ColumnConfig<string>>;
export declare const tsrange: () => ColumnBuilder<string, ColumnConfig<string>>;
export declare const tstzrange: () => ColumnBuilder<string, ColumnConfig<string>>;
export declare const daterange: () => ColumnBuilder<string, ColumnConfig<string>>;
export declare const int4multirange: () => ColumnBuilder<string, ColumnConfig<string>>;
export declare const int8multirange: () => ColumnBuilder<string, ColumnConfig<string>>;
export declare const nummultirange: () => ColumnBuilder<string, ColumnConfig<string>>;
export declare const tsmultirange: () => ColumnBuilder<string, ColumnConfig<string>>;
export declare const tstzmultirange: () => ColumnBuilder<string, ColumnConfig<string>>;
export declare const datemultirange: () => ColumnBuilder<string, ColumnConfig<string>>;
export declare const oid: () => ColumnBuilder<number, ColumnConfig<number>>;
export declare const regclass: () => ColumnBuilder<string, ColumnConfig<string>>;
export declare const regproc: () => ColumnBuilder<string, ColumnConfig<string>>;
export declare const regtype: () => ColumnBuilder<string, ColumnConfig<string>>;
export declare const pgLsn: () => ColumnBuilder<string, ColumnConfig<string>>;
export declare const pgSnapshot: () => ColumnBuilder<string, ColumnConfig<string>>;
/**
 * Case-insensitive text type (requires citext extension)
 * @example
 * email: citext('email').notNull().unique()
 */
export declare const citext: (columnName?: string) => ColumnBuilder<string, ColumnConfig<string>>;
/**
 * Hierarchical tree-like data type (requires ltree extension)
 * @example
 * path: ltree('path').notNull()
 * // Values like 'root.parent.child'
 */
export declare const ltree: (columnName?: string) => ColumnBuilder<string, ColumnConfig<string>>;
/**
 * Label tree query type (requires ltree extension)
 * Used for querying ltree columns
 */
export declare const lquery: (columnName?: string) => ColumnBuilder<string, ColumnConfig<string>>;
/**
 * Label tree text query type (requires ltree extension)
 * Used for full-text-like queries on ltree
 */
export declare const ltxtquery: (columnName?: string) => ColumnBuilder<string, ColumnConfig<string>>;
/**
 * Key-value store type (requires hstore extension)
 * @example
 * metadata: hstore('metadata')
 * // Values like '"key1"=>"value1", "key2"=>"value2"'
 */
export declare const hstore: (columnName?: string) => ColumnBuilder<Record<string, string | null>, ColumnConfig<Record<string, string | null>>>;
/**
 * Cube data type for multi-dimensional points (requires cube extension)
 * @example
 * coordinates: cube('coordinates')
 */
export declare const cube: (columnName?: string) => ColumnBuilder<number[], ColumnConfig<number[]>>;
/**
 * Semantic version type (requires semver extension)
 * @example
 * version: semver('version').notNull()
 */
export declare const semver: (columnName?: string) => ColumnBuilder<string, ColumnConfig<string>>;
/** GeoJSON-compatible geometry type for PostGIS */
export interface GeoJsonGeometry {
	type: "Point" | "LineString" | "Polygon" | "MultiPoint" | "MultiLineString" | "MultiPolygon" | "GeometryCollection";
	coordinates: unknown;
	crs?: {
		type: string;
		properties: {
			name: string;
		};
	};
}
/**
 * PostGIS geometry type (requires PostGIS extension)
 * @param srid - Spatial Reference System Identifier (e.g., 4326 for WGS84)
 * @param geometryType - Specific geometry type (POINT, LINESTRING, POLYGON, etc.)
 * @example
 * location: geometry('location', 4326, 'POINT')
 * boundary: geometry('boundary', 4326, 'POLYGON')
 */
export declare const geometry: (columnName?: string, srid?: number, geometryType?: "POINT" | "LINESTRING" | "POLYGON" | "MULTIPOINT" | "MULTILINESTRING" | "MULTIPOLYGON" | "GEOMETRYCOLLECTION") => ColumnBuilder<GeoJsonGeometry, ColumnConfig<GeoJsonGeometry>>;
/**
 * PostGIS geography type for geodetic calculations (requires PostGIS extension)
 * Uses spherical math for accurate distance calculations on Earth
 * @param srid - Spatial Reference System Identifier (default: 4326 for WGS84)
 * @param geometryType - Specific geometry type
 * @example
 * location: geography('location', 4326, 'POINT')
 */
export declare const geography: (columnName?: string, srid?: number, geometryType?: "POINT" | "LINESTRING" | "POLYGON" | "MULTIPOINT" | "MULTILINESTRING" | "MULTIPOLYGON") => ColumnBuilder<GeoJsonGeometry, ColumnConfig<GeoJsonGeometry>>;
/**
 * PostGIS point type - shorthand for geometry point
 * @example
 * location: geoPoint('location') // GEOMETRY(POINT, 4326)
 */
export declare const geoPoint: (columnName?: string, srid?: number) => ColumnBuilder<{
	x: number;
	y: number;
	srid?: number;
}, ColumnConfig<{
	x: number;
	y: number;
	srid?: number;
}>>;
/**
 * PostGIS box2d type
 */
export declare const box2d: (columnName?: string) => ColumnBuilder<string, ColumnConfig<string>>;
/**
 * PostGIS box3d type
 */
export declare const box3d: (columnName?: string) => ColumnBuilder<string, ColumnConfig<string>>;
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
 * Create a column with a custom PostgreSQL type
 * @param typeName - The PostgreSQL type name
 * @param columnName - Optional explicit column name
 * @example
 * // Basic usage
 * data: customType('my_custom_type')
 * // With column name
 * data: customType<MyType>('my_custom_type', 'data_column')
 * // With chaining
 * data: customType('my_type').notNull().array()
 */
export declare const customType: <T = string>(typeName: string, columnName?: string) => ColumnBuilder<T, ColumnConfig<T>>;
export declare const enumType: <T extends string>(name: string | {
	name: string;
	values: readonly T[];
}, values?: readonly T[], columnName?: string) => ColumnConfig<T> & {
	notNull(): ColumnBuilder<T, ColumnConfig<T> & {
		$nullable: false;
	}>;
	nullable(): ColumnBuilder<T, ColumnConfig<T> & {
		$nullable: true;
	}>;
	default<V extends DefaultValue | T | (() => T)>(value: V): ColumnBuilder<T, ColumnConfig<T> & {
		$default: V;
	}>;
	primaryKey(): ColumnBuilder<T, ColumnConfig<T> & {
		$primaryKey: true;
	}>;
	unique(): ColumnBuilder<T, ColumnConfig<T> & {
		$unique: true;
	}>;
	references(table: string, column: string, options?: {
		onDelete?: string;
		onUpdate?: string;
	}): ColumnBuilder<T, ColumnConfig<T>>;
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
	checkNot<const V extends readonly string[]>(name: string, values: V): ColumnBuilder<T, ColumnConfig<T> & {
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
	length(len: number): ColumnBuilder<T, ColumnConfig<T> & {
		$length: number;
	}>;
	precision(p: number): ColumnBuilder<T, ColumnConfig<T> & {
		$precision: number;
	}>;
	scale(s: number): ColumnBuilder<T, ColumnConfig<T> & {
		$scale: number;
	}>;
	withTimezone(): ColumnBuilder<T, ColumnConfig<T> & {
		$withTimezone: true;
	}>;
	dimensions(d: number): ColumnBuilder<T, ColumnConfig<T> & {
		$dimensions: number;
	}>;
	/**
	 * Add a comment/description to the column.
	 * This will be stored in the database schema and used for documentation.
	 * @param text - The comment text
	 * @example
	 * email: varchar(255).notNull().comment('User primary email address')
	 */
	comment(text: string): ColumnBuilder<T, ColumnConfig<T> & {
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
	$id(trackingId: string): ColumnBuilder<T, ColumnConfig<T> & {
		$trackingId: string;
	}>;
} & {
	$enumValues: readonly T[];
};
/**
 * Create a column that references a domain type
 * @param domainDef - The domain definition from pgDomain() or just the domain name
 * @param columnName - Optional explicit column name
 * @example
 * // With domain definition
 * email: domainType(emailDomain)
 * // With domain name
 * email: domainType('email_domain')
 */
export declare const domainType: <T = string>(domainDef: string | {
	$domainName: string;
}, columnName?: string) => ColumnBuilder<T, ColumnConfig<T>>;
/** @deprecated Use pgComposite() instead for better type inference */
export declare const compositeType: <T>(typeName: string, columnName?: string) => ColumnBuilder<T, ColumnConfig<T>>;
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
 * Use uuid_generate_v4() as default value for UUID columns
 * @returns SqlExpression<string> - compatible with uuid().default()
 */
export declare const uuidV4: () => SqlExpression<string>;
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
 * SQL Expression Builders for DDL
 * Provides fully typed SQL functions for use in indexes, generated columns, etc.
 * NO raw SQL strings - everything is typed and composable.
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
export interface SqlFunctions {
	lower(col: ColumnRef | SqlExpr): SqlExpr;
	upper(col: ColumnRef | SqlExpr): SqlExpr;
	trim(col: ColumnRef | SqlExpr): SqlExpr;
	ltrim(col: ColumnRef | SqlExpr): SqlExpr;
	rtrim(col: ColumnRef | SqlExpr): SqlExpr;
	length(col: ColumnRef | SqlExpr): SqlExpr;
	substring(col: ColumnRef | SqlExpr, start: number, length?: number): SqlExpr;
	concat(...args: (ColumnRef | SqlExpr | string)[]): SqlExpr;
	replace(col: ColumnRef | SqlExpr, from: string, to: string): SqlExpr;
	left(col: ColumnRef | SqlExpr, n: number): SqlExpr;
	right(col: ColumnRef | SqlExpr, n: number): SqlExpr;
	abs(col: ColumnRef | SqlExpr): SqlExpr;
	ceil(col: ColumnRef | SqlExpr): SqlExpr;
	floor(col: ColumnRef | SqlExpr): SqlExpr;
	round(col: ColumnRef | SqlExpr, decimals?: number): SqlExpr;
	trunc(col: ColumnRef | SqlExpr, decimals?: number): SqlExpr;
	mod(col: ColumnRef | SqlExpr, divisor: number): SqlExpr;
	power(col: ColumnRef | SqlExpr, exp: number): SqlExpr;
	sqrt(col: ColumnRef | SqlExpr): SqlExpr;
	now(): SqlExpr;
	currentDate(): SqlExpr;
	currentTime(): SqlExpr;
	currentTimestamp(): SqlExpr;
	extract(field: "year" | "month" | "day" | "hour" | "minute" | "second" | "dow" | "doy" | "week" | "quarter", col: ColumnRef | SqlExpr): SqlExpr;
	datePart(field: string, col: ColumnRef | SqlExpr): SqlExpr;
	age(col: ColumnRef | SqlExpr, col2?: ColumnRef | SqlExpr): SqlExpr;
	dateTrunc(field: string, col: ColumnRef | SqlExpr): SqlExpr;
	cast(col: ColumnRef | SqlExpr, type: string): SqlExpr;
	asText(col: ColumnRef | SqlExpr): SqlExpr;
	asInteger(col: ColumnRef | SqlExpr): SqlExpr;
	asNumeric(col: ColumnRef | SqlExpr): SqlExpr;
	asTimestamp(col: ColumnRef | SqlExpr): SqlExpr;
	asDate(col: ColumnRef | SqlExpr): SqlExpr;
	coalesce(...args: (ColumnRef | SqlExpr | string | number | null)[]): SqlExpr;
	nullif(col: ColumnRef | SqlExpr, value: string | number): SqlExpr;
	ifNull(col: ColumnRef | SqlExpr, defaultValue: string | number): SqlExpr;
	jsonExtract(col: ColumnRef | SqlExpr, path: string): SqlExpr;
	jsonExtractText(col: ColumnRef | SqlExpr, path: string): SqlExpr;
	jsonbExtract(col: ColumnRef | SqlExpr, path: string): SqlExpr;
	jsonbExtractText(col: ColumnRef | SqlExpr, path: string): SqlExpr;
	arrayLength(col: ColumnRef | SqlExpr, dim?: number): SqlExpr;
	unnest(col: ColumnRef | SqlExpr): SqlExpr;
	arrayAgg(col: ColumnRef | SqlExpr): SqlExpr;
	toTsvector(config: string, col: ColumnRef | SqlExpr): SqlExpr;
	toTsquery(config: string, query: string): SqlExpr;
	similarity(col1: ColumnRef | SqlExpr, col2: ColumnRef | SqlExpr | string): SqlExpr;
	genRandomUuid(): SqlExpr;
	add(col: ColumnRef | SqlExpr, value: number | ColumnRef | SqlExpr): SqlExpr;
	subtract(col: ColumnRef | SqlExpr, value: number | ColumnRef | SqlExpr): SqlExpr;
	multiply(col: ColumnRef | SqlExpr, value: number | ColumnRef | SqlExpr): SqlExpr;
	divide(col: ColumnRef | SqlExpr, value: number | ColumnRef | SqlExpr): SqlExpr;
	raw(sql: string): SqlExpr;
}
/** SQL functions implementation */
export declare const sqlFunctions: SqlFunctions;
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
export declare function getSql(expr: SqlExpr): string;
/** Expression builder for index expressions - extends SqlFunctions with col() */
export interface ExpressionBuilder extends SqlFunctions {
	/** Reference a column by name */
	col(name: string): ColumnRef;
}
/** Create an expression builder for index expressions */
export declare function createExpressionBuilder(): ExpressionBuilder;
/** Singleton expression builder */
export declare const expressionBuilder: ExpressionBuilder;
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
/** Check constraint expression with column access and comparison methods */
/**
 * Check expression for use in CHECK constraints
 * Provides typed methods for building SQL constraint conditions
 *
 * @template T - The TypeScript type of the column value (e.g., `number` for integer columns)
 *
 * @example
 * // In checkConstraints callback
 * checkConstraints: (table, check) => [
 *     check.constraint('positive_level', table.level.gte(1)),
 *     check.constraint('valid_range', table.amount.between(0, 100))
 * ]
 */
export interface CheckExpr<T = unknown> extends SqlExpr {
	/**
	 * Greater than or equal - SQL: `column >= value`
	 * @example table.level.gte(1) // level >= 1
	 */
	gte(value: T | CheckExpr<T> | number): WhereCondition;
	/**
	 * Less than or equal - SQL: `column <= value`
	 * @example table.age.lte(100) // age <= 100
	 */
	lte(value: T | CheckExpr<T> | number): WhereCondition;
	/**
	 * Greater than - SQL: `column > value`
	 * @example table.count.gt(0) // count > 0
	 */
	gt(value: T | CheckExpr<T> | number): WhereCondition;
	/**
	 * Less than - SQL: `column < value`
	 * @example table.priority.lt(10) // priority < 10
	 */
	lt(value: T | CheckExpr<T> | number): WhereCondition;
	/**
	 * Equals - SQL: `column = value`
	 * @example table.status.eq('active') // status = 'active'
	 */
	eq(value: T | CheckExpr<T>): WhereCondition;
	/**
	 * Not equals - SQL: `column <> value`
	 * @example table.role.neq('banned') // role <> 'banned'
	 */
	neq(value: T | CheckExpr<T>): WhereCondition;
	/**
	 * Not equals (alias for neq) - SQL: `column <> value`
	 * @example table.role.ne('banned') // role <> 'banned'
	 */
	ne(value: T | CheckExpr<T>): WhereCondition;
	/**
	 * Is null - SQL: `column IS NULL`
	 * @example table.deletedAt.isNull() // deleted_at IS NULL
	 */
	isNull(): WhereCondition;
	/**
	 * Is not null - SQL: `column IS NOT NULL`
	 * @example table.email.isNotNull() // email IS NOT NULL
	 */
	isNotNull(): WhereCondition;
	/**
	 * In list - SQL: `column IN (v1, v2, ...)`
	 * @example table.status.in(['active', 'pending']) // status IN ('active', 'pending')
	 */
	in(values: (T | CheckExpr<T>)[]): WhereCondition;
	/**
	 * Not in list - SQL: `column NOT IN (v1, v2, ...)`
	 * @example table.role.notIn(['banned', 'deleted']) // role NOT IN ('banned', 'deleted')
	 */
	notIn(values: (T | CheckExpr<T>)[]): WhereCondition;
	/**
	 * Between range (inclusive) - SQL: `column BETWEEN min AND max`
	 * @example table.percentage.between(0, 100) // percentage BETWEEN 0 AND 100
	 */
	between(min: T | CheckExpr<T> | number, max: T | CheckExpr<T> | number): WhereCondition;
	/**
	 * Like pattern (case sensitive) - SQL: `column LIKE 'pattern'`
	 * @example table.email.like('%@gmail.com') // email LIKE '%@gmail.com'
	 */
	like(pattern: string): WhereCondition;
	/**
	 * Like pattern (case insensitive) - SQL: `column ILIKE 'pattern'`
	 * @example table.name.ilike('%test%') // name ILIKE '%test%'
	 */
	ilike(pattern: string): WhereCondition;
	/**
	 * Regex match (case sensitive) - SQL: `column ~ 'regex'`
	 * @example table.code.matches('^[A-Z]{3}$') // code ~ '^[A-Z]{3}$'
	 */
	matches(pattern: string): WhereCondition;
	/**
	 * Regex match (case insensitive) - SQL: `column ~* 'regex'`
	 * @example table.slug.matchesInsensitive('^[a-z0-9-]+$') // slug ~* '^[a-z0-9-]+$'
	 */
	matchesInsensitive(pattern: string): WhereCondition;
	/**
	 * Add to expression - SQL: `column + value`
	 * @example table.quantity.plus(1) // quantity + 1
	 */
	plus(value: CheckExpr<T> | number): CheckExpr<T>;
	/**
	 * Subtract from expression - SQL: `column - value`
	 * @example table.stock.minus(reserved) // stock - reserved
	 */
	minus(value: CheckExpr<T> | number): CheckExpr<T>;
	/**
	 * Multiply expression - SQL: `column * value`
	 * @example table.price.times(quantity) // price * quantity
	 */
	times(value: CheckExpr<T> | number): CheckExpr<T>;
	/**
	 * Divide expression - SQL: `column / value`
	 * @example table.total.dividedBy(count) // total / count
	 */
	dividedBy(value: CheckExpr<T> | number): CheckExpr<T>;
	/**
	 * Get string length - SQL: `LENGTH(column)`
	 * @example table.email.length().gte(5) // LENGTH(email) >= 5
	 */
	length(): CheckExpr<number>;
	/**
	 * Cast to text - SQL: `column::text`
	 * @example table.id.asText() // id::text
	 */
	asText(): CheckExpr<string>;
	/**
	 * Absolute value - SQL: `ABS(column)`
	 * @example table.balance.abs().lte(1000) // ABS(balance) <= 1000
	 */
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
 * | `.eq(value)` | `=` | `table.status.eq('active')` → `"status" = 'active'` |
 * | `.neq(value)` | `!=` | `table.status.neq('deleted')` → `"status" != 'deleted'` |
 * | `.ne(value)` | `!=` | Alias for `.neq()` |
 * | `.gt(value)` | `>` | `table.age.gt(18)` → `"age" > 18` |
 * | `.gte(value)` | `>=` | `table.age.gte(21)` → `"age" >= 21` |
 * | `.lt(value)` | `<` | `table.price.lt(100)` → `"price" < 100` |
 * | `.lte(value)` | `<=` | `table.price.lte(50)` → `"price" <= 50` |
 *
 * ## Null Checks
 *
 * | Method | SQL | Example |
 * |--------|-----|---------|
 * | `.isNull()` | `IS NULL` | `table.deletedAt.isNull()` → `"deleted_at" IS NULL` |
 * | `.isNotNull()` | `IS NOT NULL` | `table.email.isNotNull()` → `"email" IS NOT NULL` |
 *
 * ## Collection Operators
 *
 * | Method | SQL | Example |
 * |--------|-----|---------|
 * | `.in([...])` | `IN (...)` | `table.status.in(['a', 'b'])` → `"status" IN ('a', 'b')` |
 * | `.notIn([...])` | `NOT IN (...)` | `table.type.notIn([1, 2])` → `"type" NOT IN (1, 2)` |
 * | `.between(min, max)` | `BETWEEN ... AND ...` | `table.age.between(18, 65)` → `"age" BETWEEN 18 AND 65` |
 *
 * ## Pattern Matching
 *
 * | Method | SQL | Example |
 * |--------|-----|---------|
 * | `.like(pattern)` | `LIKE` | `table.name.like('John%')` → `"name" LIKE 'John%'` |
 * | `.ilike(pattern)` | `ILIKE` | `table.email.ilike('%@gmail%')` → `"email" ILIKE '%@gmail%'` |
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
 * | `.plus(n)` | `+` | `table.price.plus(tax)` → `("price" + "tax")` |
 * | `.minus(n)` | `-` | `table.total.minus(5)` → `("total" - 5)` |
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
/** Options for constraints (name is optional - auto-generated if not provided) */
export interface ConstraintOptions {
	name?: string;
	columns: ColumnRef$1[];
}
/** Constraint builder for table-level constraints (composite PKs, etc.) */
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
}
type ColumnRef$1 = string & {
	__columnRef: true;
};
export type ColumnRefs<T extends Record<string, ColumnConfig>> = {
	[K in keyof T]: ColumnRef$1;
};
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
 * Table refs for generated columns - each column becomes a FluentGenExpr with full chainable methods
 * @template T - Record of column names to ColumnConfig types
 * @example
 * // Usage in generatedAs callback:
 * generatedAs: (t, As) => [
 *     As.on(t.fullName).as(t.firstName.concat(' ', t.lastName)),
 *     As.on(t.searchVector).as(t.email.coalesce('').toTsvector('english').setWeight('A'))
 * ]
 */
export type GeneratedTableRefs<T extends Record<string, ColumnConfig>> = {
	[K in keyof T]: FluentGenExpr & {
		__columnName: string;
	};
};
/**
 * Generated column definition result
 */
export interface GeneratedAsDef {
	/** Target column name */
	readonly $column: string;
	/** Generated expression SQL */
	readonly $expression: string;
	/** Whether the column is stored (always true for PostgreSQL GENERATED ALWAYS AS) */
	readonly $stored: boolean;
	/** Tracking ID for rename detection */
	readonly $trackingId?: string;
}
/**
 * Builder chain for generated column expressions
 */
export interface GeneratedAsBuilderChain {
	/** Set the expression for the generated column */
	as(expression: FluentGenExpr | GeneratedExpr): GeneratedAsDef;
}
/**
 * Factory for creating generated column definitions
 */
export interface GeneratedAsFactory {
	/** Define a generated column expression for the target column */
	on(column: FluentGenExpr & {
		__columnName: string;
	}): GeneratedAsBuilderChain;
}
/**
 * Callback type for generatedAs option.
 * The callback receives table refs and a factory to create generated column definitions.
 * @template T - Record of column names to ColumnConfig types
 * @example
 * generatedAs: (t, As) => [
 *     As.on(t.fullName).as(t.firstName.concat(' ', t.lastName)),
 *     As.on(t.searchVector).as(t.email.coalesce('').toTsvector('english'))
 * ]
 */
export type GeneratedAsCallback<T extends Record<string, ColumnConfig>> = (table: GeneratedTableRefs<T>, As: GeneratedAsFactory) => GeneratedAsDef[];
/**
 * Table refs for check constraints - each column is a typed CheckExpr
 * The type is inferred from the column's ColumnConfig type parameter
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
export type InferSelectType<T extends TableDefinition<any>> = T["$inferSelect"];
export type InferInsertType<T extends TableDefinition<any>> = T["$inferInsert"];
export type InferUpdateType<T extends TableDefinition<any>> = Partial<T["$inferInsert"]>;
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
export declare function generateSchemaCode(table: ParsedTable$1, options?: {
	exportName?: string;
}): string;
export declare function introspectSQL(sql: string): {
	parsed: ParsedTable$1;
	code: string;
};
export declare function introspectMultiple(sql: string): Array<{
	parsed: ParsedTable$1;
	code: string;
}>;
export interface RelationConfig {
	from: string;
	to: string;
	through?: string;
	foreignKey?: string;
	references?: string;
}
export interface Relation<TFrom extends TableDefinition<Record<string, ColumnConfig>> = TableDefinition<Record<string, ColumnConfig>>, TTo extends TableDefinition<Record<string, ColumnConfig>> = TableDefinition<Record<string, ColumnConfig>>, TType extends "one" | "many" | "manyToMany" = "one" | "many" | "manyToMany"> {
	$type: TType;
	$from: TFrom;
	$to: TTo;
	$foreignKey: string;
	$references: string;
	$through?: TableDefinition<Record<string, ColumnConfig>>;
	$throughFromKey?: string;
	$throughToKey?: string;
}
export interface OneRelation<TFrom extends TableDefinition<Record<string, ColumnConfig>>, TTo extends TableDefinition<Record<string, ColumnConfig>>> extends Relation<TFrom, TTo, "one"> {
	$type: "one";
}
export interface ManyRelation<TFrom extends TableDefinition<Record<string, ColumnConfig>>, TTo extends TableDefinition<Record<string, ColumnConfig>>> extends Relation<TFrom, TTo, "many"> {
	$type: "many";
}
export interface ManyToManyRelation<TFrom extends TableDefinition<Record<string, ColumnConfig>>, TTo extends TableDefinition<Record<string, ColumnConfig>>, TThrough extends TableDefinition<Record<string, ColumnConfig>>> extends Relation<TFrom, TTo, "manyToMany"> {
	$type: "manyToMany";
	$through: TThrough;
	$throughFromKey: string;
	$throughToKey: string;
}
export declare function one<TFrom extends TableDefinition<Record<string, ColumnConfig>>, TTo extends TableDefinition<Record<string, ColumnConfig>>>(from: TFrom, to: TTo, options?: {
	foreignKey?: string;
	references?: string;
}): OneRelation<TFrom, TTo>;
export declare function many<TFrom extends TableDefinition<Record<string, ColumnConfig>>, TTo extends TableDefinition<Record<string, ColumnConfig>>>(from: TFrom, to: TTo, options?: {
	foreignKey?: string;
	references?: string;
}): ManyRelation<TFrom, TTo>;
export declare function manyToMany<TFrom extends TableDefinition<Record<string, ColumnConfig>>, TTo extends TableDefinition<Record<string, ColumnConfig>>, TThrough extends TableDefinition<Record<string, ColumnConfig>>>(from: TFrom, to: TTo, through: TThrough, options?: {
	fromKey?: string;
	toKey?: string;
	throughFromKey?: string;
	throughToKey?: string;
}): ManyToManyRelation<TFrom, TTo, TThrough>;
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
 * Simplified pgRelations API - direct table → relations mapping.
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
export type FunctionVolatility = "VOLATILE" | "STABLE" | "IMMUTABLE";
export type FunctionParallel = "UNSAFE" | "RESTRICTED" | "SAFE";
export type FunctionSecurity = "INVOKER" | "DEFINER";
/** Common PostgreSQL function languages */
export type FunctionLanguage = "plpgsql" | "sql" | "plpython3u" | "plperl" | "pltcl" | (string & {});
/** Common PostgreSQL return types with autocomplete support */
export type FunctionReturnType = "trigger" | "void" | "integer" | "bigint" | "smallint" | "numeric" | "real" | "double precision" | "text" | "varchar" | "char" | "name" | "boolean" | "timestamp" | "timestamptz" | "timestamp with time zone" | "timestamp without time zone" | "date" | "time" | "timetz" | "interval" | "bytea" | "uuid" | "json" | "jsonb" | "text[]" | "integer[]" | "uuid[]" | "jsonb[]" | "record" | "SETOF record" | (string & {});
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
export interface FunctionOptions {
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
export type TriggerTiming = "BEFORE" | "AFTER" | "INSTEAD OF";
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
 * Generate SQL for a trigger definition
 */
export declare function generateTriggerSQL(config: TriggerConfig): string;
/**
 * Generate DROP TRIGGER SQL
 */
export declare function dropTriggerSQL(config: TriggerConfig, ifExists?: boolean): string;
/**
 * Define a PostgreSQL trigger for use in schema definitions
 *
 * @example
 * ```typescript
 * // Simple BEFORE UPDATE trigger
 * export const trgUpdateTimestamp = pgTrigger('trg_update_timestamp', {
 *     on: usersTable,
 *     before: 'UPDATE',
 *     forEach: 'ROW',
 *     execute: updateTimestampFunc
 * });
 *
 * // AFTER trigger on multiple events
 * export const trgAudit = pgTrigger('trg_audit', {
 *     on: ordersTable,
 *     after: ['INSERT', 'UPDATE', 'DELETE'],
 *     forEach: 'ROW',
 *     execute: auditChangesFunc
 * });
 *
 * // Trigger with WHEN condition
 * export const trgStatusChange = pgTrigger('trg_status_change', {
 *     on: usersTable,
 *     after: 'UPDATE',
 *     updateOf: ['status'],
 *     forEach: 'ROW',
 *     when: 'OLD.status IS DISTINCT FROM NEW.status',
 *     execute: notifyStatusChangeFunc
 * });
 *
 * // Statement-level trigger with transition tables
 * export const trgBulkUpdate = pgTrigger('trg_bulk_update', {
 *     on: productsTable,
 *     after: 'UPDATE',
 *     forEach: 'STATEMENT',
 *     referencing: {
 *         oldTable: 'old_products',
 *         newTable: 'new_products'
 *     },
 *     execute: processBulkUpdateFunc
 * });
 *
 * // INSTEAD OF trigger for views
 * export const trgViewInsert = pgTrigger('trg_view_insert', {
 *     on: 'users_view',
 *     insteadOf: 'INSERT',
 *     forEach: 'ROW',
 *     execute: handleViewInsertFunc
 * });
 *
 * // Constraint trigger (deferrable)
 * export const trgConstraint = pgTrigger('trg_constraint', {
 *     on: ordersTable,
 *     after: 'INSERT',
 *     constraint: true,
 *     deferrable: true,
 *     initially: 'DEFERRED',
 *     forEach: 'ROW',
 *     execute: validateOrderFunc
 * });
 * ```
 */
export declare function pgTrigger<TTable = unknown>(name: string, options: TriggerOptions<TTable>): TriggerConfig<TTable>;
/**
 * Check if a value is a TriggerConfig
 */
export declare function isTriggerConfig(value: unknown): value is TriggerConfig;
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
	readonly _type: "sequence";
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
	_type: "view";
	name: string;
	definition: string;
	isMaterialized: false;
	$trackingId?: string;
	/** Returns AST for schema diffing and migration generation */
	toAST(): ParsedView;
}
export interface MaterializedViewConfig {
	_type: "materialized_view";
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
/**
 * SQL Tagged Template Literal
 *
 * Use with VS Code extension "Inline SQL by qufiwefefwoyn" for PostgreSQL syntax highlighting.
 *
 * @example
 * ```typescript
 * import { sql } from 'relq/schema-builder';
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
/**
 * Tagged template literal for SQL queries.
 * Works with "Inline SQL" VS Code extension for syntax highlighting.
 */
export declare function sql(strings: TemplateStringsArray, ...values: unknown[]): SQLTemplate;
export declare namespace sql {
	var raw: (value: string) => {
		__raw: string;
	};
	var id: (identifier: string) => {
		__raw: string;
	};
	var literal: (value: string | number | boolean | null) => {
		__raw: string;
	};
}
type FunctionReturnType$1 = "trigger" | "void" | "integer" | "bigint" | "smallint" | "real" | "double precision" | "numeric" | "text" | "varchar" | "char" | "boolean" | "json" | "jsonb" | "uuid" | "timestamp" | "timestamptz" | "date" | "time" | "timetz" | "interval" | "bytea" | "record" | "setof record" | (string & {});
type FunctionLanguage$1 = "plpgsql" | "sql" | "plv8" | "plpython3u" | "plperl" | (string & {});
export type FunctionType = "function" | "procedure";
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

export {
	FunctionLanguage$1 as FunctionLanguage,
	FunctionOptions$1 as FunctionOptions,
	FunctionReturnType$1 as FunctionReturnType,
	FunctionSecurity$1 as FunctionSecurity,
	FunctionVolatility$1 as FunctionVolatility,
	ParsedColumn$1 as ParsedColumn,
	ParsedTable$1 as ParsedTable,
};

export {};
