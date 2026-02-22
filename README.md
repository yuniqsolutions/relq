# Relq

**The Fully-Typed PostgreSQL ORM for TypeScript**

Relq is a complete, type-safe ORM for PostgreSQL that brings the full power of the database to TypeScript. With support for 100+ PostgreSQL types, advanced features like partitions, domains, composite types, generated columns, enums, triggers, functions, and a CLI for schema management — all with zero runtime dependencies.

[![npm version](https://img.shields.io/npm/v/relq.svg)](https://www.npmjs.com/package/relq)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-22+-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-12+-blue.svg)](https://www.postgresql.org/)

---

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Entry Points](#entry-points)
- [Multi-Dialect Support](#multi-dialect-support)
- [Schema Definition](#schema-definition)
- [Query API](#query-api)
- [Joins](#joins)
- [Relation Loading](#relation-loading)
- [Computed Columns](#computed-columns)
- [Convenience Methods](#convenience-methods)
- [Raw SQL](#raw-sql)
- [SQL Functions](#sql-functions)
- [Condition Builders](#condition-builders)
- [Pagination](#pagination)
- [Transactions](#transactions)
- [Advanced Schema Features](#advanced-schema-features)
- [DDL Builders](#ddl-builders)
- [CLI Commands](#cli-commands)
- [Configuration](#configuration)
- [Error Handling](#error-handling)
- [Requirements](#requirements)

---

## Features

### Core Capabilities

- **Complete Type Safety** — End-to-end TypeScript inference from schema definition to query results
- **Zero Runtime Dependencies** — Everything bundled, no external packages needed at runtime
- **Full PostgreSQL Support** — 100+ column types, all properly typed
- **Tree-Shakeable** — Import only what you use for optimal bundle size
- **Schema-First Design** — Define once, get types everywhere

### Multi-Dialect Support

- **PostgreSQL** — Full native support
- **CockroachDB** — Dedicated client with CockroachDB-compatible feature set
- **Nile** — Multi-tenant PostgreSQL with `setTenant()` / `withTenant()`
- **AWS DSQL** — Amazon Aurora DSQL with AWS credential support

### Query Features

- **Relation Loading** — `.with()` and `.withMany()` for auto-FK joins without writing join conditions
- **Computed Columns** — `.include()` for inline aggregates and expressions
- **One-to-Many Joins** — LATERAL subqueries via `.joinMany()` / `.leftJoinMany()`
- **Many-to-Many** — Junction table support via `{ through: 'table' }`
- **Tagged Template SQL** — `` sql`SELECT * FROM users WHERE id = ${id}` `` with auto-escaping
- **Nested Creates** — `.createWith()` inserts parent + children in a single transaction
- **INSERT FROM SELECT** — `.insertFrom()` with type-safe callback
- **Cursor Iteration** — `.each()` for memory-efficient row-by-row processing
- **Conflict Handling** — `.doUpdate()` / `.doNothing()` with EXCLUDED column access

### Schema Management

- **CLI** — Commands for `pull`, `push`, `diff`, `generate`, `migrate`, `rollback`, `sync`
- **Database Introspection** — Generate TypeScript schema from existing databases
- **Tracking IDs** — Detect renames and moves, not just additions/deletions

### Advanced Features

- **Table Partitioning** — Range, list, and hash partitioning with typed definitions
- **Generated Columns** — Computed columns with expression builders
- **Domains & Composites** — Custom types with validation
- **Triggers & Functions** — Define and track database-side logic
- **Full-Text Search** — `tsvector`, `tsquery` with ranking functions
- **PostGIS Support** — Geometry and geography types for spatial data
- **CTE** — Common Table Expressions for recursive and complex queries
- **Window Functions** — `OVER`, `PARTITION BY`, `ROW_NUMBER()`, etc.
- **LISTEN/NOTIFY** — Real-time pub/sub
- **COPY** — Bulk import/export with `COPY TO` / `COPY FROM`
- **Query Cache** — Built-in caching with TTL and invalidation strategies
- **EXPLAIN** — Query analysis and optimization

---

## Installation

```bash
npm install relq
# or
bun add relq
```

---

## Quick Start

### 1. Define Your Schema

```typescript
// db/schema.ts
import {
  defineTable,
  uuid, text, timestamp, boolean, integer, jsonb,
  pgEnum, pgRelations
} from 'relq/pg-builder';

export const userStatus = pgEnum('user_status', ['active', 'inactive', 'suspended']);

export const users = defineTable('users', {
  id: uuid().primaryKey().default('gen_random_uuid()'),
  email: text().notNull().unique(),
  name: text().notNull(),
  status: userStatus().default('active'),
  metadata: jsonb<{ theme?: string; locale?: string }>(),
  createdAt: timestamp('created_at').default('now()'),
});

export const posts = defineTable('posts', {
  id: uuid().primaryKey().default('gen_random_uuid()'),
  title: text().notNull(),
  content: text(),
  authorId: uuid('author_id').notNull().references('users', 'id'),
  published: boolean().default(false),
  viewCount: integer('view_count').default(0),
  createdAt: timestamp('created_at').default('now()'),
});

export const relations = pgRelations({
  users: { posts: { type: 'many', table: 'posts', foreignKey: 'authorId' } },
  posts: { author: { type: 'one', table: 'users', foreignKey: 'authorId' } }
});

export const schema = { users, posts };
```

### 2. Connect and Query

```typescript
import { Relq } from 'relq';
import { schema, relations } from './db/schema';

const db = new Relq(schema, 'postgres', {
  host: 'localhost',
  port: 5432,
  database: 'myapp',
  user: 'postgres',
  password: 'secret',
  relations
});

// Types flow automatically from schema to results
const activeUsers = await db.table.users
  .select('id', 'email', 'status')
  .where(q => q.equal('status', 'active'))
  .orderBy('createdAt', 'DESC')
  .limit(10)
  .all();
// Type: { id: string; email: string; status: 'active' | 'inactive' | 'suspended' }[]

// Convenience methods
const user = await db.table.users.findById('uuid-here');
const found = await db.table.users.findOne({ email: 'test@example.com' });
```

---

## Entry Points

```typescript
// Runtime — Client, queries, functions
import { Relq, F, Case, PG, sql, SqlFragment } from 'relq';

// Dialect clients (direct usage)
import { RelqPostgres, RelqNile, RelqDsql, RelqCockroachDB } from 'relq';

// Configuration — CLI and project setup
import { defineConfig, loadConfig } from 'relq/config';

// Schema Builder — PostgreSQL (full)
import { defineTable, uuid, text, pgEnum, pgRelations } from 'relq/pg-builder';

// Schema Builder — Dialect-specific (compile-time safety)
import { defineTable } from 'relq/cockroachdb-builder';
import { defineTable } from 'relq/nile-builder';
import { defineTable } from 'relq/dsql-builder';
```

---

## Multi-Dialect Support

Relq supports 4 PostgreSQL-family dialects. Each dialect client only exposes methods it supports, enforced at both compile time and runtime.

```typescript
// PostgreSQL — full feature set including subscribe()
const db = new Relq(schema, 'postgres', { host, database, user, password });

// CockroachDB — no geometric types, no ranges, no full-text
const db = new Relq(schema, 'cockroachdb', { host, database, user, password });

// Nile — multi-tenant PostgreSQL
const db = new Relq(schema, 'nile', { host, database, user, password });
await db.setTenant(tenantId);

// AWS DSQL — no subscribe, no triggers, no sequences, no LATERAL
const db = new Relq(schema, 'awsdsql', { database, aws: { region, hostname } });
```

Dialect-specific schema builders prevent using unsupported types at compile time:

```typescript
// Using CockroachDB builder — geometric types won't be available
import { defineTable, text, uuid, jsonb } from 'relq/cockroachdb-builder';
// point(), line(), money() — not exported, compile error if used
```

### Capability Matrix

| Feature | PostgreSQL | CockroachDB | Nile | AWS DSQL |
|---------|-----------|-------------|------|----------|
| RETURNING | Yes | Yes | Yes | Yes |
| LATERAL JOIN | Yes | Yes | Yes | No |
| DISTINCT ON | Yes | Yes | Yes | No |
| FOR UPDATE SKIP LOCKED | Yes | Yes | Yes | No |
| Cursors | Yes | Yes | Yes | No |
| LISTEN/NOTIFY | Yes | No | No | No |
| Multi-tenant | No | No | Yes | No |

---

## Schema Definition

### Column Types

Relq supports 100+ PostgreSQL types with proper TypeScript mapping:

#### Numeric Types
```typescript
integer(), int(), int4()           // number
smallint(), int2()                 // number
bigint(), int8()                   // bigint
serial(), serial4()                // number (auto-increment)
bigserial(), serial8()             // bigint (auto-increment)
numeric(), decimal()               // string (precise decimals)
real(), float4()                   // number
doublePrecision(), float8()        // number
money()                            // string
```

#### String Types
```typescript
text()                             // string
varchar(), char()                  // string
citext()                           // string (case-insensitive)
```

#### Date/Time Types
```typescript
timestamp()                        // Date
timestamptz()                      // Date (with timezone)
date()                             // Date | string
time(), timetz()                   // string
interval()                         // string
```

#### JSON Types
```typescript
json<T>()                          // T (typed JSON)
jsonb<T>()                         // T (typed JSONB)

// Example with type parameter
metadata: jsonb<{ theme: string; settings: Record<string, boolean> }>()
```

#### Boolean & UUID
```typescript
boolean(), bool()                  // boolean
uuid()                             // string
```

#### Array Types
```typescript
tags: text().array()               // string[]
matrix: integer().array(2)         // number[][] (2D array)
scores: numeric().array()          // string[]
```

#### Geometric Types
```typescript
point()                            // { x: number; y: number }
line()                             // { a: number; b: number; c: number }
lseg()                             // [[number, number], [number, number]]
box()                              // [[number, number], [number, number]]
path()                             // Array<{ x: number; y: number }>
polygon()                          // Array<{ x: number; y: number }>
circle()                           // { x: number; y: number; r: number }
```

#### Network Types
```typescript
inet()                             // string (IP address)
cidr()                             // string (IP network)
macaddr(), macaddr8()              // string
```

#### Range Types
```typescript
int4range(), int8range()           // string
numrange(), daterange()            // string
tsrange(), tstzrange()             // string
```

#### Full-Text Search
```typescript
tsvector()                         // string
tsquery()                          // string
```

#### PostGIS (requires extension)
```typescript
geometry('location', 4326, 'POINT')     // GeoJSON
geography('area', 4326, 'POLYGON')      // GeoJSON
geoPoint('coords')                       // { x, y, srid }
box2d(), box3d()                        // string
```

#### Extension Types
```typescript
ltree()                            // string (hierarchical labels)
hstore()                           // Record<string, string | null>
cube()                             // number[]
semver()                           // string
```

---

## Query API

### SELECT

```typescript
// All columns
const users = await db.table.users.select().all();

// Specific columns — array or variadic
const emails = await db.table.users.select(['id', 'email']).all();
const emails = await db.table.users.select('id', 'email').all();

// With conditions, ordering, limit
const active = await db.table.users
  .select('id', 'email', 'name')
  .where(q => q.equal('status', 'active'))
  .orderBy('createdAt', 'DESC')
  .limit(10)
  .all();

// Single record (auto LIMIT 1)
const user = await db.table.users
  .select()
  .where(q => q.equal('id', userId))
  .get();

// NULLS FIRST / NULLS LAST ordering
await db.table.users.select()
  .orderByNulls('deletedAt', 'ASC', 'LAST')
  .all();

// Distinct on (PostgreSQL-specific)
await db.table.logs.select()
  .distinctOn('userId')
  .orderBy('userId')
  .orderBy('createdAt', 'DESC')
  .all();

// Set operations
const query1 = db.table.users.select('id', 'email').where(q => q.equal('status', 'active'));
const query2 = db.table.users.select('id', 'email').where(q => q.equal('role', 'admin'));
await query1.union(query2).all();
// Also: unionAll, intersect, except

// Row locking
await db.table.jobs.select()
  .where(q => q.equal('status', 'pending'))
  .forUpdateSkipLocked()
  .limit(1)
  .get();
// Also: forUpdate(), forShare()
```

### INSERT

```typescript
// Single insert with returning
const user = await db.table.users
  .insert({ email: 'new@example.com', name: 'New User' })
  .returning('*')
  .run();

// Multi-row insert
await db.table.users
  .insert({ email: 'user1@example.com', name: 'User 1' })
  .addRow({ email: 'user2@example.com', name: 'User 2' })
  .run();

// ON CONFLICT DO UPDATE (upsert) — with EXCLUDED column access
await db.table.users
  .insert({ email: 'user@example.com', name: 'New' })
  .doUpdate('email', {
    name: (excluded, sql) => excluded.name,             // Use EXCLUDED value
    score: (excluded, sql, row) => sql.greatest(excluded.score, row.score),
  })
  .run();

// ON CONFLICT DO NOTHING
await db.table.users
  .insert({ email: 'user@example.com', name: 'New' })
  .doNothing('email')
  .run();

// INSERT FROM SELECT — callback receives schema tables
const count = await db.table.archivedUsers.insertFrom(
  ['name', 'email', 'createdAt'],
  t => t.users.select('name', 'email', 'createdAt')
    .where(q => q.equal('status', 'inactive'))
);
```

### UPDATE

```typescript
// Basic update
await db.table.users
  .update({ status: 'inactive' })
  .where(q => q.equal('id', userId))
  .run();

// With returning
const updated = await db.table.posts
  .update({ viewCount: F.increment('viewCount', 1) })
  .where(q => q.equal('id', postId))
  .returning('*')
  .run();
```

### DELETE

```typescript
// Delete with condition
await db.table.users
  .delete()
  .where(q => q.equal('id', userId))
  .run();

// With returning
const deleted = await db.table.posts
  .delete()
  .where(q => q.equal('authorId', userId))
  .returning(['id', 'title'])
  .run();
```

### Aggregations

```typescript
// Count
const count = await db.table.users
  .count()
  .where(q => q.equal('status', 'active'))
  .get();

// Named count groups
const counts = await db.table.results.count()
  .group('all', q => q.equal('isDeleted', false))
  .group('new', q => q.equal('isRead', false).equal('isDeleted', false))
  .group('favorites', q => q.equal('favorite', true).equal('isDeleted', false))
  .where(q => q.equal('userId', userId))
  .get();
// Returns: { all: number, new: number, favorites: number }

// Multiple aggregation functions
const stats = await db.table.orders.aggregate()
  .count('id', 'totalOrders')
  .sum('amount', 'totalRevenue')
  .avg('amount', 'avgOrderValue')
  .min('amount', 'minOrder')
  .max('amount', 'maxOrder')
  .get();
```

---

## Joins

### Type-Safe Joins

Join callbacks receive `(on, joined, source)` — the joined table is always the second parameter.

```typescript
// INNER JOIN — auto FK detection (requires relations config)
const postsWithAuthors = await db.table.posts.select()
  .join('users')
  .all();
// Result: { ...post, users: { id, name, ... } }[]

// INNER JOIN — explicit callback
const postsWithAuthors = await db.table.posts.select('id', 'title')
  .join('users', (on, users, posts) =>
    on.equal(users.id, posts.authorId)
  )
  .all();

// LEFT JOIN — joined table may be null
await db.table.orders.select()
  .leftJoin('users')
  .all();
// Result: { ...order, users: { ... } | null }[]

// With alias
await db.table.orders.select()
  .join(['users', 'customer'], (on, customer, orders) =>
    on.equal(customer.id, orders.userId)
  )
  .all();
// Result: { ...order, customer: { ... } }[]

// RIGHT JOIN
await db.table.orders.select()
  .rightJoin('users', (on, orders, users) =>
    on.equal(orders.userId, users.id)
  )
  .all();
```

### One-to-Many Joins (LATERAL)

```typescript
// Get top 5 orders per user
await db.table.users.select()
  .joinMany('orders', (on, orders, users) =>
    on.equal(orders.userId, users.id)
      .orderBy('createdAt', 'DESC')
      .limit(5)
  )
  .all();
// Result: { ...user, orders: Order[] }[]

// LEFT JOIN — empty array if no matches
await db.table.users.select()
  .leftJoinMany('orders', (on, orders, users) =>
    on.equal(orders.userId, users.id)
  )
  .all();

// Many-to-many through junction table
await db.table.posts.select()
  .leftJoinMany('labels', { through: 'itemLabels' }, on =>
    on.select('id', 'name', 'color')
  )
  .all();

// Subquery join
await db.table.users.select()
  .joinSubquery(
    'stats',
    'SELECT user_id, COUNT(*) as order_count FROM orders GROUP BY user_id',
    '"stats"."user_id" = "users"."id"'
  )
  .all();
```

---

## Relation Loading

Sugar methods for common join patterns. No callback needed — FK is auto-detected from `relations` config.

### `.with()` — Many-to-One / One-to-One

```typescript
// Load the user for each order
await db.table.orders.select('id', 'total')
  .with('users')
  .all();
// Result: { id, total, users: { id, name, ... } | null }[]

// Chain multiple relations
await db.table.orders.select('id')
  .with('users')
  .with('products')
  .all();
```

### `.withMany()` — One-to-Many

```typescript
// Load all orders for each user
await db.table.users.select('id', 'name')
  .withMany('orders')
  .all();
// Result: { id, name, orders: { id, total, ... }[] }[]

// Many-to-many through junction table
await db.table.users.select('id', 'name')
  .withMany('tags', { through: 'userTags' })
  .all();
// Result: { id, name, tags: { id, label, ... }[] }[]
```

---

## Computed Columns

Add aggregate functions and expressions to query results with `.include()`.

```typescript
// Count items per folder
const folders = await db.table.folders.select('id', 'name')
  .include((a, t) => ({
    itemCount: a.count(t.items.id),
  }))
  .leftJoin('items')
  .groupBy('id')
  .all();
// Result: { id: string, name: string, itemCount: number }[]

// Multiple aggregates with table references
const users = await db.table.users.select('id', 'name')
  .include((a, t) => ({
    orderCount: a.count(t.orders.id),
    totalSpent: a.sum(t.orders.amount),
    lastOrder: a.max(t.orders.createdAt),
  }))
  .leftJoin('orders')
  .groupBy('id')
  .all();

// Raw SQL expressions
db.table.users.select('id')
  .include((a) => ({
    year: a.raw<number>('EXTRACT(YEAR FROM NOW())'),
  }))
  .all();
```

The callback receives `(a, t)` where `a` provides aggregate functions (`count`, `sum`, `avg`, `min`, `max`, `raw`) and `t` provides type-safe table proxies for referencing columns across joined tables.

---

## Convenience Methods

Quick operations without building full queries.

```typescript
// Find by primary key (auto-detects PK column from schema)
const user = await db.table.users.findById('uuid-here');

// Find first matching record
const user = await db.table.users.findOne({ email: 'test@example.com' });

// Find all matching records
const admins = await db.table.users.findMany({ role: 'admin' });

// Check existence
const exists = await db.table.users.exists({ email: 'test@example.com' });

// Upsert — insert or update
const user = await db.table.users.upsert({
  where: { email: 'user@example.com' },
  create: { email: 'user@example.com', name: 'New User' },
  update: { name: 'Updated Name' },
});

// Bulk insert with RETURNING *
const created = await db.table.users.insertMany([
  { email: 'a@example.com', name: 'A' },
  { email: 'b@example.com', name: 'B' },
]);

// INSERT FROM SELECT
const count = await db.table.archivedUsers.insertFrom(
  ['name', 'email', 'createdAt'],
  t => t.users.select('name', 'email', 'createdAt')
    .where(q => q.equal('status', 'inactive'))
);

// Nested create — parent + children in one transaction
const user = await db.table.users.createWith({
  data: { name: 'John', email: 'john@example.com' },
  with: {
    posts: [
      { title: 'Hello', content: 'World' },
      { title: 'Second', content: 'Post' },
    ],
    profile: { bio: 'Developer' },
  }
});
// Inserts: user -> posts with userId set -> profile with userId set

// Soft delete (sets deleted_at to now)
await db.table.users.softDelete({ id: userId });

// Restore soft-deleted record (clears deleted_at)
await db.table.users.restore({ id: userId });
```

---

## Raw SQL

### Tagged Template Literal

The `sql` tagged template auto-escapes interpolated values to prevent SQL injection.

```typescript
import { sql } from 'relq';

// Values are auto-escaped
const query = sql`SELECT * FROM users WHERE id = ${userId}`;

// Multiple parameters
const query = sql`
  SELECT * FROM orders
  WHERE user_id = ${userId}
  AND status = ${status}
  AND total > ${minTotal}
`;

// Identifiers (table/column names)
const query = sql`SELECT * FROM ${sql.id('users')} WHERE ${sql.id('email')} = ${email}`;

// Raw SQL (no escaping — use only with trusted input)
const query = sql`SELECT * FROM users ${sql.raw('ORDER BY id DESC')}`;

// Composable fragments
const condition = sql`status = ${status}`;
const query = sql`SELECT * FROM users WHERE ${condition}`;
```

**Type handling:**
- Strings -> single-quoted and escaped
- Numbers -> literal
- Booleans -> `true` / `false`
- `null` / `undefined` -> `NULL`
- Dates -> ISO string, single-quoted
- Arrays -> parenthesized list `(val1, val2)`
- Objects -> JSON string with `::jsonb` cast
- `SqlFragment` -> inlined as-is (for composition)

### Raw Query Builder

```typescript
import { RawQueryBuilder } from 'relq';

const builder = new RawQueryBuilder('SELECT * FROM users WHERE status = %L', 'active');
const sql = builder.toString();
```

---

## SQL Functions

```typescript
import { F, Case, PG } from 'relq';

// String Functions
F.lower('email'), F.upper('name')
F.concat('first', ' ', 'last')
F.substring('text', 1, 10)
F.trim('value'), F.ltrim('value'), F.rtrim('value')
F.length('text'), F.replace('text', 'old', 'new')

// Date/Time Functions
F.now(), F.currentDate(), F.currentTimestamp()
F.extract('year', 'created_at')
F.dateTrunc('month', 'created_at')
F.age('birth_date')

// Math Functions
F.abs('value'), F.ceil('value'), F.floor('value')
F.round('price', 2), F.trunc('value', 2)
F.power('base', 2), F.sqrt('value')
F.greatest('a', 'b', 'c'), F.least('a', 'b', 'c')

// Aggregate Functions
F.count('id'), F.sum('amount'), F.avg('rating')
F.min('price'), F.max('price')
F.arrayAgg('tag'), F.stringAgg('name', ', ')

// JSONB Functions
F.jsonbSet('data', ['key'], 'value')
F.jsonbExtract('data', 'key')
F.jsonbArrayLength('items')

// Array Functions
F.arrayAppend('tags', 'new')
F.arrayRemove('tags', 'old')
F.arrayLength('items', 1)
F.unnest('tags')

// Conditional (CASE)
Case()
  .when(F.gt('price', 100), 'expensive')
  .when(F.gt('price', 50), 'moderate')
  .else('cheap')
  .end()

// PostgreSQL Values
PG.now()          // NOW()
PG.currentDate()  // CURRENT_DATE
PG.currentUser()  // CURRENT_USER
PG.null()         // NULL
PG.true()         // TRUE
PG.false()        // FALSE
```

---

## Condition Builders

### Basic Comparisons
```typescript
.where(q => q.equal('status', 'active'))
.where(q => q.notEqual('role', 'guest'))
.where(q => q.greaterThan('age', 18))
.where(q => q.lessThan('price', 50))
.where(q => q.between('createdAt', startDate, endDate))
```

### Null Checks
```typescript
.where(q => q.isNull('deletedAt'))
.where(q => q.isNotNull('verifiedAt'))
```

### String Matching
```typescript
.where(q => q.startsWith('email', 'admin@'))
.where(q => q.endsWith('email', '@company.com'))
.where(q => q.contains('name', 'john'))
.where(q => q.like('email', '%@%.%'))
.where(q => q.ilike('name', '%JOHN%'))  // case-insensitive
```

### Lists
```typescript
.where(q => q.in('status', ['active', 'pending']))
.where(q => q.notIn('role', ['banned', 'deleted']))
```

### Logical Operators
```typescript
// AND (default — conditions chain)
.where(q => q
  .equal('status', 'active')
  .greaterThan('age', 18)
)

// OR
.where(q => q
  .equal('status', 'active')
  .or(sub => sub
    .equal('role', 'admin')
    .equal('role', 'moderator')
  )
)
```

### JSONB Conditions
```typescript
.where(q => q.jsonb.contains('metadata', { role: 'admin' }))
.where(q => q.jsonb.containedBy('tags', ['a', 'b', 'c']))
.where(q => q.jsonb.hasKey('settings', 'theme'))
.where(q => q.jsonb.hasAnyKeys('data', ['key1', 'key2']))
.where(q => q.jsonb.hasAllKeys('config', ['host', 'port']))
.where(q => q.jsonb.extractEqual('data', ['user', 'id'], userId))
```

### Array Conditions
```typescript
.where(q => q.array.contains('tags', ['typescript']))
.where(q => q.array.containedBy('roles', ['admin', 'user', 'guest']))
.where(q => q.array.overlaps('categories', ['tech', 'news']))
.where(q => q.array.length('items', 5))

// Typed array conditions
.where(q => q.array.string.startsWith('emails', 'admin@'))
.where(q => q.array.numeric.greaterThan('scores', 90))
```

### Full-Text Search
```typescript
.where(q => q.fulltext.search('content', 'typescript tutorial'))
.where(q => q.fulltext.match('title', 'node & express'))
.where(q => q.fulltext.rank('body', 'search terms', 0.1))
```

### Range & Geometric Conditions
```typescript
.where(q => q.range.contains('dateRange', '2024-06-15'))
.where(q => q.range.overlaps('availability', '[2024-01-01, 2024-12-31]'))
.where(q => q.geometric.distanceLessThan('location', '(5,5)', 10))
```

---

## Pagination

### Paginate Builder

```typescript
// Cursor-based (recommended for large datasets)
const page = await db.table.posts
  .paginate({ orderBy: ['createdAt', 'DESC'] })
  .paging({ perPage: 20, cursor: lastCursor });

// page.data            — results
// page.pagination.next — cursor for next page
// page.pagination.hasNext

// Offset-based
const page = await db.table.posts
  .paginate({ orderBy: ['createdAt', 'DESC'] })
  .offset({ perPage: 20, page: 2 });

// page.pagination.totalPages
// page.pagination.currentPage
// page.pagination.total
```

### Cursor Iteration

Process large result sets row by row using PostgreSQL cursors. Memory-efficient — rows are fetched in batches.

```typescript
await db.table.users.select('email')
  .where(q => q.equal('verified', false))
  .each(async (row) => {
    await sendVerificationEmail(row.email);
  });

// Stop early
await db.table.logs.select()
  .each(async (row, index) => {
    if (index >= 1000) return false;
    processLog(row);
  }, { batchSize: 50 });
```

---

## Transactions

```typescript
// Basic transaction
const result = await db.transaction(async (tx) => {
  const user = await tx.table.users
    .insert({ email: 'new@example.com', name: 'User' })
    .returning(['id'])
    .run();

  await tx.table.posts
    .insert({ title: 'First Post', authorId: user.id })
    .run();

  return user;
});

// With savepoints
await db.transaction(async (tx) => {
  await tx.table.users.insert({ ... }).run();

  try {
    await tx.savepoint('optional', async (sp) => {
      await sp.table.posts.insert({ ... }).run();
    });
  } catch (e) {
    // Savepoint rolled back, transaction continues
  }

  await tx.table.logs.insert({ ... }).run();
});

// With isolation level
await db.transaction({ isolation: 'SERIALIZABLE' }, async (tx) => {
  // ...
});
```

---

## Advanced Schema Features

### Domains with Validation

```typescript
import { pgDomain, text, numeric } from 'relq/pg-builder';

export const emailDomain = pgDomain('email', text(), (value) => [
  value.matches('^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$')
]);

export const percentageDomain = pgDomain('percentage',
  numeric().precision(5).scale(2),
  (value) => [value.gte(0), value.lte(100)]
);
```

### Composite Types

```typescript
import { pgComposite, text, varchar, boolean } from 'relq/pg-builder';

export const addressType = pgComposite('address_type', {
  line1: text().notNull(),
  line2: text(),
  city: varchar().length(100).notNull(),
  country: varchar().length(100).notNull(),
  postalCode: varchar().length(20),
  verified: boolean().default(false)
});
```

### Generated Columns

```typescript
const orderItems = defineTable('order_items', {
  quantity: integer().notNull(),
  unitPrice: numeric().precision(10).scale(2).notNull(),
  discount: numeric().precision(5).scale(2).default(0),
  lineTotal: numeric().precision(12).scale(2).generatedAlwaysAs(
    (table, F) => F(table.unitPrice)
      .multiply(table.quantity)
      .multiply(F.subtract(1, F.divide(table.discount, 100)))
  ),
  searchVector: tsvector().generatedAlwaysAs(
    (table, F) => F.toTsvector('english', table.description)
  )
});
```

### Table Partitioning

```typescript
// Range partitioning
const events = defineTable('events', {
  id: uuid().primaryKey(),
  createdAt: timestamp('created_at').notNull()
}, {
  partitionBy: (table, p) => p.range(table.createdAt),
  partitions: (partition) => [
    partition('events_2024_q1').from('2024-01-01').to('2024-04-01'),
    partition('events_2024_q2').from('2024-04-01').to('2024-07-01'),
  ]
});

// List partitioning
const logs = defineTable('logs', {
  level: text().notNull(),
  message: text()
}, {
  partitionBy: (table, p) => p.list(table.level),
  partitions: (partition) => [
    partition('logs_error').forValues('error', 'fatal'),
    partition('logs_info').forValues('info', 'debug')
  ]
});

// Hash partitioning
const sessions = defineTable('sessions', {
  userId: uuid('user_id').notNull()
}, {
  partitionBy: (table, p) => p.hash(table.userId),
  partitions: (partition) => [
    partition('sessions_0').modulus(4).remainder(0),
    partition('sessions_1').modulus(4).remainder(1),
    partition('sessions_2').modulus(4).remainder(2),
    partition('sessions_3').modulus(4).remainder(3),
  ]
});
```

### Triggers and Functions

```typescript
import { pgTrigger, pgFunction } from 'relq/pg-builder';

export const updateUpdatedAt = pgFunction('update_updated_at_column', {
  returns: 'trigger',
  language: 'plpgsql',
  body: `
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
  `,
  volatility: 'VOLATILE',
}).$id('func123');

export const usersUpdatedAt = pgTrigger('users_updated_at', {
  on: schema.users,
  before: 'UPDATE',
  forEach: 'ROW',
  execute: updateUpdatedAt,
}).$id('trig456');
```

### Indexes

```typescript
const posts = defineTable('posts', {
  title: text().notNull(),
  authorId: uuid('author_id').notNull(),
  tags: text().array(),
  metadata: jsonb(),
  published: boolean().default(false),
}, {
  indexes: (table, index) => [
    index('posts_author_idx').on(table.authorId),
    index('posts_author_created_idx')
      .on(table.authorId, table.createdAt.desc()),
    index('posts_published_idx')
      .on(table.createdAt)
      .where(table.published.eq(true)),
    index('posts_tags_idx').on(table.tags).using('gin'),
    index('posts_metadata_idx').on(table.metadata).using('gin'),
    index('posts_slug_idx').on(table.slug).unique(),
    index('posts_title_lower_idx')
      .on(F => F.lower(table.title))
  ]
});
```

---

## DDL Builders

Relq includes builders for all PostgreSQL DDL operations:

```typescript
import {
  // Tables
  CreateTableBuilder, AlterTableBuilder, TruncateBuilder,
  // Indexes
  CreateIndexBuilder, DropIndexBuilder, ReindexBuilder,
  // Views
  CreateViewBuilder, DropViewBuilder, RefreshMaterializedViewBuilder,
  // Functions & Triggers
  CreateFunctionBuilder, DropFunctionBuilder,
  CreateTriggerBuilder, DropTriggerBuilder,
  // Schemas & Roles
  CreateSchemaBuilder, DropSchemaBuilder,
  GrantBuilder, RevokeBuilder, DefaultPrivilegesBuilder,
  CreateRoleBuilder, AlterRoleBuilder, DropRoleBuilder,
  // Sequences
  CreateSequenceBuilder, AlterSequenceBuilder, DropSequenceBuilder,
  // Partitions
  PartitionBuilder, CreatePartitionBuilder,
  AttachPartitionBuilder, DetachPartitionBuilder,
  // CTE, Window, COPY
  CTEBuilder, WindowBuilder,
  CopyToBuilder, CopyFromBuilder,
  // EXPLAIN, Maintenance
  ExplainBuilder, VacuumBuilder, AnalyzeBuilder,
  // Pub/Sub
  ListenBuilder, UnlistenBuilder, NotifyBuilder,
} from 'relq';
```

---

## CLI Commands

```bash
relq init              # Initialize a new Relq project
relq status            # Show current schema state
relq diff [--sql]      # Show schema differences
relq pull [--force]    # Pull schema from database
relq push [--dry-run]  # Push schema changes to database
relq generate -m "msg" # Generate migration from changes
relq migrate           # Apply pending migrations
relq rollback [n]      # Rollback n migrations
relq sync              # Pull + Push in one command
relq import <file>     # Import SQL file to schema
relq export            # Export schema to SQL file
relq validate          # Check schema for errors
relq seed              # Seed database from SQL files
relq introspect        # Parse SQL DDL to defineTable() code
```

---

## Configuration

```typescript
// relq.config.ts
import { defineConfig } from 'relq/config';

export default defineConfig({
  connection: {
    host: process.env.DB_HOST,
    port: 5432,
    database: 'myapp',
    user: 'postgres',
    password: process.env.DB_PASSWORD,
    // Or use connection string
    // url: process.env.DATABASE_URL
  },
  schema: './db/schema.ts',
  migrations: {
    directory: './db/migrations',
    tableName: '_relq_migrations',
    format: 'timestamp'
  },
  generate: {
    outDir: './db/generated',
    camelCase: true
  },
  safety: {
    warnOnDataLoss: true,
    confirmDestructive: true
  }
});
```

### AWS DSQL

```typescript
const db = new Relq(schema, 'awsdsql', {
  database: 'postgres',
  aws: {
    region: 'us-east-1',
    hostname: 'your-cluster.dsql.us-east-1.on.aws',
  }
});
```

---

## Error Handling

```typescript
import {
  RelqError,
  RelqConnectionError,
  RelqQueryError,
  RelqTransactionError,
  RelqConfigError,
  RelqTimeoutError,
  RelqPoolError,
  RelqBuilderError,
  isRelqError
} from 'relq';

try {
  await db.table.users.insert({ ... }).run();
} catch (error) {
  if (isRelqError(error)) {
    if (error instanceof RelqConnectionError) {
      console.error('Connection failed:', error.message);
    } else if (error instanceof RelqQueryError) {
      console.error('Query failed:', error.message);
      console.error('SQL:', error.sql);
    }
  }
}
```

---

## Requirements

- **Node.js** 22+ or **Bun** 1.0+
- **PostgreSQL** 12+
- **TypeScript** 5.0+

---

## License

MIT

---

## Links

- [GitHub](https://github.com/yuniqsolutions/relq)
- [npm](https://www.npmjs.com/package/relq)

---

<p align="center">
  <strong>Built with TypeScript for TypeScript developers</strong>
</p>
