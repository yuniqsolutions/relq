# Relq

**The Fully-Typed PostgreSQL ORM for TypeScript**

Relq is a complete, type-safe ORM for PostgreSQL that brings the full power of the database to TypeScript. With support for 100+ PostgreSQL types, advanced features like partitions, domains, composite types, generated columns, enums, triggers, functions, and a git-like CLI for schema management—all with zero runtime dependencies.

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
- [Schema Definition](#schema-definition)
- [Query API](#query-api)
- [SQL Functions](#sql-functions)
- [Condition Builders](#condition-builders)
- [Advanced Schema Features](#advanced-schema-features)
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

### Schema Management

- **Git-like CLI** — Familiar commands (`pull`, `push`, `diff`, `status`, `branch`, `merge`)
- **Automatic Migrations** — Generate migrations from schema changes
- **Database Introspection** — Generate TypeScript schema from existing databases
- **Tracking IDs** — Detect renames and moves, not just additions/deletions

### Advanced Features

- **Table Partitioning** — Range, list, and hash partitioning with typed definitions
- **Generated Columns** — Computed columns with expression builders
- **Domains & Composites** — Custom types with validation
- **Triggers & Functions** — Define and track database-side logic
- **Full-Text Search** — `tsvector`, `tsquery` with ranking functions
- **PostGIS Support** — Geometry and geography types for spatial data
- **AWS DSQL Support** — First-class support for Amazon Aurora DSQL

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
} from 'relq/schema-builder';

// Enums with full type inference
export const userStatus = pgEnum('user_status', ['active', 'inactive', 'suspended']);

// Tables with complete column typing
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

// Define relationships
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

const db = new Relq(schema, {
  host: 'localhost',
  port: 5432,
  database: 'myapp',
  user: 'postgres',
  password: 'secret',
  relations
});

// Types flow automatically from schema to results
const activeUsers = await db.table.users
  .select(['id', 'email', 'status'])
  .where(q => q.equal('status', 'active'))
  .orderBy('createdAt', 'DESC')
  .limit(10)
  .all();
// Type: { id: string; email: string; status: 'active' | 'inactive' | 'suspended' }[]

// Convenience methods
const user = await db.table.users.findById('uuid-here');
const user = await db.table.users.findOne({ email: 'test@example.com' });
```

---

## Entry Points

Relq provides three entry points for different use cases:

```typescript
// Runtime - Client, queries, functions
import { Relq, F, Case, PG } from 'relq';

// Configuration - CLI and project setup
import { defineConfig, loadConfig } from 'relq/config';

// Schema Builder - Types, tables, DDL definitions
import {
  defineTable,
  integer, text, uuid, jsonb, timestamp,
  pgEnum, pgDomain, pgComposite, pgTrigger, pgFunction,
  pgRelations, one, many
} from 'relq/schema-builder';
```

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
// Any column type can be an array
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
// Multi-range variants also available
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

// Specific columns
const emails = await db.table.users.select(['id', 'email']).all();

// With conditions
const active = await db.table.users
  .select(['id', 'email', 'name'])
  .where(q => q.equal('status', 'active'))
  .orderBy('createdAt', 'DESC')
  .limit(10)
  .all();

// Single record
const user = await db.table.users
  .select()
  .where(q => q.equal('id', userId))
  .get();

// With joins
const postsWithAuthors = await db.table.posts
  .select(['id', 'title'])
  .join('users', (on, posts, users) => on.equal(posts.authorId, users.id))
  .all();

// Distinct on (PostgreSQL-specific)
await db.table.logs
  .select()
  .distinctOn('userId')
  .orderBy('userId')
  .orderBy('createdAt', 'DESC')
  .all();

// Row locking
await db.table.jobs
  .select()
  .where(q => q.equal('status', 'pending'))
  .forUpdateSkipLocked()
  .limit(1)
  .get();
```

### INSERT

```typescript
// Single insert with returning
const user = await db.table.users
  .insert({ email: 'new@example.com', name: 'New User' })
  .returning(['id', 'createdAt'])
  .run();

// Bulk insert
await db.table.users
  .insert([
    { email: 'user1@example.com', name: 'User 1' },
    { email: 'user2@example.com', name: 'User 2' }
  ])
  .run();

// Upsert - ON CONFLICT DO UPDATE
await db.table.users
  .insert({ email: 'user@example.com', name: 'Updated' })
  .onConflict('email')
  .doUpdate({ name: 'Updated', updatedAt: PG.now() })
  .run();

// ON CONFLICT DO NOTHING
await db.table.users
  .insert({ email: 'user@example.com', name: 'New' })
  .onConflict('email')
  .doNothing()
  .run();
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
  .returning(['id', 'viewCount'])
  .run();

// Bulk update
await db.table.posts
  .update({ published: true })
  .where(q => q.in('id', postIds))
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

// Count with groups
const counts = await db.table.results.count()
  .group('all', q => q.equal('isDeleted', false))
  .group('new', q => q.equal('isRead', false).equal('isDeleted', false))
  .group('favorites', q => q.equal('favorite', true).equal('isDeleted', false))
  .where(q => q.equal('userId', userId))
  .get();
// Returns: { all: number, new: number, favorites: number }

// Multiple aggregations
const stats = await db.table.orders
  .aggregate()
  .count('id', 'totalOrders')
  .sum('amount', 'totalRevenue')
  .avg('amount', 'avgOrderValue')
  .min('amount', 'minOrder')
  .max('amount', 'maxOrder')
  .get();
```

### Pagination

```typescript
// Cursor-based (recommended for large datasets)
const page = await db.table.posts
  .select(['id', 'title', 'createdAt'])
  .paginate({ orderBy: ['createdAt', 'DESC'] })
  .paging({ perPage: 20, cursor: lastCursor });

// page.data - results
// page.pagination.next - cursor for next page
// page.pagination.hasNext - boolean

// Offset-based
const page = await db.table.posts
  .select(['id', 'title'])
  .paginate({ orderBy: ['createdAt', 'DESC'] })
  .offset({ perPage: 20, page: 2 });

// page.pagination.totalPages
// page.pagination.currentPage
// page.pagination.total
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
// AND (default - conditions chain)
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

## Advanced Schema Features

### Domains with Validation

```typescript
import { pgDomain, text, numeric } from 'relq/schema-builder';

export const emailDomain = pgDomain('email', text(), (value) => [
  value.matches('^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$')
]);

export const percentageDomain = pgDomain('percentage',
  numeric().precision(5).scale(2),
  (value) => [value.gte(0), value.lte(100)]
);

const employees = defineTable('employees', {
  email: emailDomain().notNull(),
  bonus: percentageDomain().default(0)
});
```

### Composite Types

```typescript
import { pgComposite, text, varchar, boolean } from 'relq/schema-builder';

export const addressType = pgComposite('address_type', {
  line1: text().notNull(),
  line2: text(),
  city: varchar().length(100).notNull(),
  country: varchar().length(100).notNull(),
  postalCode: varchar().length(20),
  verified: boolean().default(false)
});

const customers = defineTable('customers', {
  billingAddress: addressType(),
  shippingAddress: addressType()
});
```

### Generated Columns

```typescript
const orderItems = defineTable('order_items', {
  quantity: integer().notNull(),
  unitPrice: numeric().precision(10).scale(2).notNull(),
  discount: numeric().precision(5).scale(2).default(0),

  // Computed from other columns
  lineTotal: numeric().precision(12).scale(2).generatedAlwaysAs(
    (table, F) => F(table.unitPrice)
      .multiply(table.quantity)
      .multiply(F.subtract(1, F.divide(table.discount, 100)))
  ),

  // Full-text search vector
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
  eventType: text().notNull(),
  createdAt: timestamp('created_at').notNull()
}, {
  partitionBy: (table, p) => p.range(table.createdAt),
  partitions: (partition) => [
    partition('events_2024_q1').from('2024-01-01').to('2024-04-01'),
    partition('events_2024_q2').from('2024-04-01').to('2024-07-01'),
    partition('events_2024_q3').from('2024-07-01').to('2024-10-01'),
    partition('events_2024_q4').from('2024-10-01').to('2025-01-01'),
  ]
});

// List partitioning
const logs = defineTable('logs', {
  id: uuid().primaryKey(),
  level: text().notNull(),
  message: text()
}, {
  partitionBy: (table, p) => p.list(table.level),
  partitions: (partition) => [
    partition('logs_error').forValues('error', 'fatal'),
    partition('logs_warn').forValues('warn'),
    partition('logs_info').forValues('info', 'debug')
  ]
});

// Hash partitioning
const sessions = defineTable('sessions', {
  id: uuid().primaryKey(),
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
import { pgTrigger, pgFunction } from 'relq/schema-builder';

// Define a function
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

// Define a trigger using the function
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
  id: uuid().primaryKey(),
  title: text().notNull(),
  authorId: uuid('author_id').notNull(),
  tags: text().array(),
  metadata: jsonb(),
  published: boolean().default(false),
  createdAt: timestamp('created_at').default('now()')
}, {
  indexes: (table, index) => [
    // B-tree (default)
    index('posts_author_idx').on(table.authorId),

    // Composite with ordering
    index('posts_author_created_idx')
      .on(table.authorId, table.createdAt.desc()),

    // Partial index
    index('posts_published_idx')
      .on(table.createdAt)
      .where(table.published.eq(true)),

    // GIN for arrays
    index('posts_tags_idx').on(table.tags).using('gin'),

    // GIN for JSONB
    index('posts_metadata_idx').on(table.metadata).using('gin'),

    // Unique
    index('posts_slug_idx').on(table.slug).unique(),

    // Expression index
    index('posts_title_lower_idx')
      .on(F => F.lower(table.title))
  ]
});
```

---

## CLI Commands

Relq provides a comprehensive git-like CLI for schema management:

### Initialization & Status

```bash
relq init                    # Initialize a new Relq project
relq status                  # Show current schema status and pending changes
```

### Schema Operations

```bash
relq pull [--force]          # Pull schema from database
relq push [--dry-run]        # Push schema changes to database
relq diff [--sql]            # Show differences between local and remote schema
relq sync                    # Full bidirectional sync
relq introspect              # Generate TypeScript schema from existing database
```

### Change Management

```bash
relq add [files...]          # Stage schema changes
relq commit -m "message"     # Commit staged changes
relq reset [--hard]          # Unstage or reset changes
```

### Migration Commands

```bash
relq generate -m "message"   # Generate migration from changes
relq migrate [--up|--down]   # Run migrations
relq rollback [n]            # Rollback n migrations
relq log                     # View migration log
relq history                 # View full migration history
```

### Branching & Merging

```bash
relq branch [name]           # List or create branches
relq checkout <branch>       # Switch to a branch
relq merge <branch>          # Merge a branch into current
relq cherry-pick <commit>    # Apply specific commit
relq stash [pop|list|drop]   # Stash/unstash changes
```

### Remote Operations

```bash
relq remote [add|remove]     # Manage remote databases
relq fetch                   # Fetch remote schema without applying
relq tag <name>              # Tag current schema version
```

### Utilities

```bash
relq validate                # Validate schema definitions
relq export [--format=sql]   # Export schema as SQL
relq import <file>           # Import schema from file
relq resolve                 # Resolve merge conflicts
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
    format: 'timestamp'  // or 'sequential'
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

### Environment-Specific Configuration

```typescript
export default defineConfig({
  connection: process.env.NODE_ENV === 'production'
    ? { url: process.env.DATABASE_URL }
    : {
        host: 'localhost',
        database: 'myapp_dev',
        user: 'postgres',
        password: 'dev'
      }
});
```

### AWS DSQL Support

```typescript
import { Relq } from 'relq';

const db = new Relq(schema, {
  provider: 'aws-dsql',
  region: 'us-east-1',
  hostname: 'your-cluster.dsql.us-east-1.on.aws',
  // Uses AWS credentials from environment
});
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

## Error Handling

```typescript
import {
  RelqError,
  RelqConnectionError,
  RelqQueryError,
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
      console.error('Parameters:', error.parameters);
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
