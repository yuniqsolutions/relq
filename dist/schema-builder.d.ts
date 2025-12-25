export declare const EMPTY_OBJECT: unique symbol;
export declare const EMPTY_ARRAY: unique symbol;
export interface ColumnConfig<T = unknown> {
	$type: string;
	$sqlType?: string;
	$tsType?: T;
	$nullable?: boolean;
	$default?: T | (() => T) | string | object | typeof EMPTY_OBJECT | typeof EMPTY_ARRAY;
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
	toTsvector(config: string, col: ChainableExpr | GeneratedExpr): ChainableExpr;
	similarity(col1: ChainableExpr | GeneratedExpr, col2: ChainableExpr | GeneratedExpr | string): ChainableExpr;
	point(x: ChainableExpr | GeneratedExpr | number, y: ChainableExpr | GeneratedExpr | number): ChainableExpr;
	arrayLength(col: ChainableExpr | GeneratedExpr, dim?: number): ChainableExpr;
	arrayPosition(arr: ChainableExpr | GeneratedExpr, elem: ChainableExpr | GeneratedExpr | string | number): ChainableExpr;
	md5(col: ChainableExpr | GeneratedExpr): ChainableExpr;
	sha256(col: ChainableExpr | GeneratedExpr): ChainableExpr;
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
export type ColumnBuilder<T, Config extends ColumnConfig<T> = ColumnConfig<T>> = Config & {
	notNull(): ColumnBuilder<T, Config & {
		$nullable: false;
	}>;
	nullable(): ColumnBuilder<T, Config & {
		$nullable: true;
	}>;
	default<V extends T | (() => T)>(value: V): ColumnBuilder<T, Config & {
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
	 * Add CHECK constraint with enum-like values.
	 * Narrows the column type to the union of provided values.
	 * @param values - Allowed string values
	 * @example
	 * .check('active', 'inactive', 'banned')
	 * // Type becomes 'active' | 'inactive' | 'banned'
	 */
	check<V extends string>(...values: V[]): ColumnBuilder<V, ColumnConfig<V> & {
		$check: string;
		$checkValues: readonly V[];
	}>;
	/**
	 * Add CHECK constraint that excludes specific values.
	 * Narrows the column type to exclude provided values.
	 * @param values - Disallowed string values
	 * @example
	 * .checkNot('deleted', 'archived')
	 * // Column cannot have these values
	 */
	checkNot<V extends string>(...values: V[]): ColumnBuilder<T, Config & {
		$checkNot: string;
		$checkNotValues: readonly V[];
	}>;
	/** @deprecated Use generatedAlwaysAs with callback instead */
	generatedAs(expression: string, stored?: boolean): ColumnBuilder<T, Config & {
		$generated: {
			expression: string;
			stored?: boolean;
		};
	}>;
	/**
	 * GENERATED ALWAYS AS computed column with typed expression builder
	 * @param callback - Expression builder callback: (table, F) => F.subtract(table.quantityOnHand, table.quantityReserved)
	 * @param options - { stored: true } for STORED (default), { stored: false } for VIRTUAL
	 * @example
	 * // Arithmetic with sibling columns
	 * quantityAvailable: integer().generatedAlwaysAs(
	 *     (table, F) => F.subtract(table.quantityOnHand, table.quantityReserved)
	 * )
	 *
	 * // With SQL function
	 * emailLower: text().generatedAlwaysAs(
	 *     (table, F) => F.lower(table.email)
	 * )
	 *
	 * // String concatenation
	 * fullName: text().generatedAlwaysAs(
	 *     (table, F) => F.concat(table.firstName, ' ', table.lastName)
	 * )
	 */
	generatedAlwaysAs<Cols extends Record<string, ColumnConfig>>(callback: (table: GeneratedTableRefs<Cols>, F: GeneratedFn) => GeneratedExpr, options?: {
		stored?: boolean;
	}): ColumnBuilder<T, Config & {
		$generated: {
			expression: string;
			stored?: boolean;
		};
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
};
export declare const integer: (columnName?: string) => ColumnBuilder<number, ColumnConfig<number>>;
export declare const int: (columnName?: string) => ColumnBuilder<number, ColumnConfig<number>>;
export declare const int4: (columnName?: string) => ColumnBuilder<number, ColumnConfig<number>>;
export declare const smallint: (columnName?: string) => ColumnBuilder<number, ColumnConfig<number>>;
export declare const int2: (columnName?: string) => ColumnBuilder<number, ColumnConfig<number>>;
export declare const bigint: (columnName?: string) => ColumnBuilder<bigint, ColumnConfig<bigint>>;
export declare const int8: (columnName?: string) => ColumnBuilder<bigint, ColumnConfig<bigint>>;
export declare const serial: (columnName?: string) => ColumnBuilder<number, ColumnConfig<number>>;
export declare const serial4: (columnName?: string) => ColumnBuilder<number, ColumnConfig<number>>;
export declare const smallserial: (columnName?: string) => ColumnBuilder<number, ColumnConfig<number>>;
export declare const serial2: (columnName?: string) => ColumnBuilder<number, ColumnConfig<number>>;
export declare const bigserial: (columnName?: string) => ColumnBuilder<bigint, ColumnConfig<bigint>>;
export declare const serial8: (columnName?: string) => ColumnBuilder<bigint, ColumnConfig<bigint>>;
export declare const decimal: (columnNameOrOpts?: string | number | {
	precision?: number;
	scale?: number;
}, scale?: number) => ColumnBuilder<string>;
export declare const numeric: (columnNameOrOpts?: string | number | {
	precision?: number;
	scale?: number;
}, scale?: number) => ColumnBuilder<string>;
export declare const real: (columnName?: string) => ColumnBuilder<number, ColumnConfig<number>>;
export declare const float4: (columnName?: string) => ColumnBuilder<number, ColumnConfig<number>>;
export declare const doublePrecision: (columnName?: string) => ColumnBuilder<number, ColumnConfig<number>>;
export declare const float8: (columnName?: string) => ColumnBuilder<number, ColumnConfig<number>>;
export declare const money: (columnName?: string) => ColumnBuilder<string, ColumnConfig<string>>;
export interface VarcharOptions {
	length?: number;
}
export declare function varchar(): ColumnBuilder<string>;
export declare function varchar(length: number): ColumnBuilder<string>;
export declare function varchar(options: VarcharOptions): ColumnBuilder<string>;
export declare function varchar(columnName: string): ColumnBuilder<string>;
export declare function varchar(columnName: string, options: VarcharOptions): ColumnBuilder<string>;
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
export declare const text: (columnName?: string) => ColumnBuilder<string, ColumnConfig<string>>;
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
export declare const enumType: <T extends string>(name: string, values: readonly T[], columnName?: string) => ColumnConfig<T> & {
	notNull(): ColumnBuilder<T, ColumnConfig<T> & {
		$nullable: false;
	}>;
	nullable(): ColumnBuilder<T, ColumnConfig<T> & {
		$nullable: true;
	}>;
	default<V extends T | (() => T)>(value: V): ColumnBuilder<T, ColumnConfig<T> & {
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
	 * Add CHECK constraint with enum-like values.
	 * Narrows the column type to the union of provided values.
	 * @param values - Allowed string values
	 * @example
	 * .check('active', 'inactive', 'banned')
	 * // Type becomes 'active' | 'inactive' | 'banned'
	 */
	check<V extends string>(...values: V[]): ColumnBuilder<V, ColumnConfig<V> & {
		$check: string;
		$checkValues: readonly V[];
	}>;
	/**
	 * Add CHECK constraint that excludes specific values.
	 * Narrows the column type to exclude provided values.
	 * @param values - Disallowed string values
	 * @example
	 * .checkNot('deleted', 'archived')
	 * // Column cannot have these values
	 */
	checkNot<V extends string>(...values: V[]): ColumnBuilder<T, ColumnConfig<T> & {
		$checkNot: string;
		$checkNotValues: readonly V[];
	}>;
	/** @deprecated Use generatedAlwaysAs with callback instead */
	generatedAs(expression: string, stored?: boolean): ColumnBuilder<T, ColumnConfig<T> & {
		$generated: {
			expression: string;
			stored?: boolean;
		};
	}>;
	/**
	 * GENERATED ALWAYS AS computed column with typed expression builder
	 * @param callback - Expression builder callback: (table, F) => F.subtract(table.quantityOnHand, table.quantityReserved)
	 * @param options - { stored: true } for STORED (default), { stored: false } for VIRTUAL
	 * @example
	 * // Arithmetic with sibling columns
	 * quantityAvailable: integer().generatedAlwaysAs(
	 *     (table, F) => F.subtract(table.quantityOnHand, table.quantityReserved)
	 * )
	 *
	 * // With SQL function
	 * emailLower: text().generatedAlwaysAs(
	 *     (table, F) => F.lower(table.email)
	 * )
	 *
	 * // String concatenation
	 * fullName: text().generatedAlwaysAs(
	 *     (table, F) => F.concat(table.firstName, ' ', table.lastName)
	 * )
	 */
	generatedAlwaysAs<Cols extends Record<string, ColumnConfig>>(callback: (table: GeneratedTableRefs<Cols>, F: GeneratedFn) => GeneratedExpr, options?: {
		stored?: boolean;
	}): ColumnBuilder<T, ColumnConfig<T> & {
		$generated: {
			expression: string;
			stored?: boolean;
		};
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
} & {
	$enumValues: readonly T[];
};
/** @deprecated Use pgComposite() instead for better type inference */
export declare const compositeType: <T>(typeName: string, columnName?: string) => ColumnBuilder<T, ColumnConfig<T>>;
declare const SQL_BRAND: unique symbol;
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
}
/** Column expression for use in where conditions */
export interface ColumnExpr extends SqlExpr {
	eq(value: unknown): WhereCondition;
	neq(value: unknown): WhereCondition;
	gt(value: unknown): WhereCondition;
	gte(value: unknown): WhereCondition;
	lt(value: unknown): WhereCondition;
	lte(value: unknown): WhereCondition;
	isNull(): WhereCondition;
	isNotNull(): WhereCondition;
	in(values: unknown[]): WhereCondition;
	notIn(values: unknown[]): WhereCondition;
	between(min: unknown, max: unknown): WhereCondition;
	like(pattern: string): WhereCondition;
	ilike(pattern: string): WhereCondition;
	/** Add interval to column: col.plus(interval('30 days')) */
	plus(value: SqlExpr | number): ColumnExpr;
	/** Subtract interval from column: col.minus(interval('1 hour')) */
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
	}>;
	/** Index definitions - use (table, index, F) => [index('name').on(F.lower(table.email))] */
	indexes?: IndexInput[] | ((table: ColumnRefs<T>, index: IndexFactory, F: SqlFunctions) => IndexInput[]);
	inherits?: string[];
	/** Partition strategy - use (table, p) => p.list(table.col) / p.range(table.col) / p.hash(table.col, modulus) */
	partitionBy?: (table: ColumnRefs<T>, p: PartitionStrategyFactory) => PartitionStrategyDef;
	/** Child partition definitions - use (partition) => [partition('name').in([...]), ...] */
	partitions?: (partition: PartitionFactory) => ChildPartitionDef[];
	tablespace?: string;
	withOptions?: Record<string, unknown>;
}
type ColumnRef$1 = string & {
	__columnRef: true;
};
export type ColumnRefs<T extends Record<string, ColumnConfig>> = {
	[K in keyof T]: ColumnRef$1;
};
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
/**
 * Build SELECT type with smart required/optional:
 * - Required: NOT NULL, PRIMARY KEY, has DEFAULT/GENERATED columns
 * - Optional: Nullable columns without constraints
 */
export type BuildSelectType<T extends Record<string, ColumnConfig>> = {
	[K in keyof T as IsRequiredForSelect<T[K]> extends true ? K : never]: T[K] extends ColumnConfig<infer U> ? T[K] extends {
		$nullable: true;
	} ? U | null : U : unknown;
} & {
	[K in keyof T as IsRequiredForSelect<T[K]> extends true ? never : K]?: T[K] extends ColumnConfig<infer U> ? U | null : unknown;
};
export type RequiredInsertKeys<T extends Record<string, ColumnConfig>> = {
	[K in keyof T]: IsRequiredForInsert<T[K]> extends true ? K : never;
}[keyof T];
export type OptionalInsertKeys<T extends Record<string, ColumnConfig>> = {
	[K in keyof T]: IsRequiredForInsert<T[K]> extends true ? never : K;
}[keyof T];
export type InferInsertValue<C extends ColumnConfig> = C extends ColumnConfig<infer U> ? C extends {
	$nullable: true;
} ? U | null : U : unknown;
export type Simplify<T> = {
	[K in keyof T]: T[K];
} & {};
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
	$foreignKeys?: Array<{
		columns: string[];
		references: {
			table: string;
			columns: string[];
		};
		onDelete?: string;
		onUpdate?: string;
		name?: string;
	}>;
	$indexes?: IndexDefinition[];
	$inherits?: string[];
	$partitionBy?: PartitionStrategyDef;
	$tablespace?: string;
	$withOptions?: Record<string, unknown>;
	$inferSelect: BuildSelectType<T>;
	$inferInsert: BuildInsertType<T>;
	toSQL(): string;
	toCreateIndexSQL(): string[];
}
export declare function defineTable<T extends Record<string, ColumnConfig>>(name: string, columns: T, options?: Partial<Omit<TableConfig<T>, "columns">>): TableDefinition<T>;
export interface ParsedColumn {
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
export interface ParsedTable {
	name: string;
	schema?: string;
	columns: ParsedColumn[];
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
export declare function parseCreateTable(sql: string): ParsedTable;
export declare function generateSchemaCode(table: ParsedTable, options?: {
	exportName?: string;
}): string;
export declare function introspectSQL(sql: string): {
	parsed: ParsedTable;
	code: string;
};
export declare function introspectMultiple(sql: string): Array<{
	parsed: ParsedTable;
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
export interface PgEnumConfig<T extends readonly string[]> {
	/** Enum type name in PostgreSQL */
	$enumName: string;
	/** Allowed values */
	$enumValues: T;
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
/**
 * PostgreSQL Function Definition for Schema Builder
 *
 * Provides type-safe function definitions that can be used in schema.ts
 * and referenced by triggers.
 */
export type FunctionVolatility = "VOLATILE" | "STABLE" | "IMMUTABLE";
export type FunctionParallel = "UNSAFE" | "RESTRICTED" | "SAFE";
export type FunctionSecurity = "INVOKER" | "DEFINER";
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
	/** Return type (e.g., 'INTEGER', 'TRIGGER', 'SETOF UUID', 'TABLE(...)') */
	returns: string;
	/** Language (default: 'plpgsql') */
	language?: string;
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
	 * Function body (between $$ and $$)
	 * Use this for simple/medium complexity functions
	 */
	body?: string;
	/**
	 * Raw SQL body for complex functions
	 * This is the complete body content between $$ and $$
	 * including DECLARE block if needed
	 */
	raw?: string;
}
export interface FunctionConfig {
	/** Function name */
	$functionName: string;
	/** Full configuration */
	$options: FunctionOptions;
	/** Marker for function type */
	$type: "function";
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
	 * FOR EACH ROW (default: true for row-level trigger)
	 */
	forEachRow?: boolean;
	/**
	 * FOR EACH STATEMENT
	 */
	forEachStatement?: boolean;
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
}
export interface TriggerConfig<TTable = unknown> {
	/** Trigger name */
	$triggerName: string;
	/** Full configuration */
	$options: TriggerOptions<TTable>;
	/** Marker for trigger type */
	$type: "trigger";
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
 *     forEachRow: true,
 *     execute: updateTimestampFunc
 * });
 *
 * // AFTER trigger on multiple events
 * export const trgAudit = pgTrigger('trg_audit', {
 *     on: ordersTable,
 *     after: ['INSERT', 'UPDATE', 'DELETE'],
 *     forEachRow: true,
 *     execute: auditChangesFunc
 * });
 *
 * // Trigger with WHEN condition
 * export const trgStatusChange = pgTrigger('trg_status_change', {
 *     on: usersTable,
 *     after: 'UPDATE',
 *     updateOf: ['status'],
 *     forEachRow: true,
 *     when: 'OLD.status IS DISTINCT FROM NEW.status',
 *     execute: notifyStatusChangeFunc
 * });
 *
 * // Statement-level trigger with transition tables
 * export const trgBulkUpdate = pgTrigger('trg_bulk_update', {
 *     on: productsTable,
 *     after: 'UPDATE',
 *     forEachStatement: true,
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
 *     forEachRow: true,
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
 *     forEachRow: true,
 *     execute: validateOrderFunc
 * });
 * ```
 */
export declare function pgTrigger<TTable = unknown>(name: string, options: TriggerOptions<TTable>): TriggerConfig<TTable>;
/**
 * Check if a value is a TriggerConfig
 */
export declare function isTriggerConfig(value: unknown): value is TriggerConfig;
/**
 * PostgreSQL Sequence Definition for Schema Builder
 *
 * Provides type-safe sequence definitions that can be used in schema.ts
 * and referenced by column defaults.
 */
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
export type FunctionReturnType = "trigger" | "void" | "integer" | "bigint" | "smallint" | "real" | "double precision" | "numeric" | "text" | "varchar" | "char" | "boolean" | "json" | "jsonb" | "uuid" | "timestamp" | "timestamptz" | "date" | "time" | "timetz" | "interval" | "bytea" | "record" | "setof record" | (string & {});
export type FunctionLanguage = "plpgsql" | "sql" | "plv8" | "plpython3u" | "plperl" | (string & {});
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
	returns: FunctionReturnType;
	/** Language with autocomplete */
	language: FunctionLanguage;
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
	FunctionOptions$1 as FunctionOptions,
	FunctionSecurity$1 as FunctionSecurity,
	FunctionVolatility$1 as FunctionVolatility,
};

export {};
