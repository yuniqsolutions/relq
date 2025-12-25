# Relq

**The Fully-Typed PostgreSQL ORM for TypeScript**

Relq is a complete, type-safe ORM for PostgreSQL that brings the full power of the database to TypeScript. With support for 100+ PostgreSQL types, advanced features like partitions, domains, composite types, generated columns, and a git-like CLI - all with zero runtime dependencies.

## Why Relq?

- **Complete Type Safety** - End-to-end TypeScript inference from schema to query results
- **Zero Runtime Dependencies** - Everything bundled, no external packages at runtime
- **Full PostgreSQL Support** - Every PostgreSQL feature you need, properly typed
- **Tree-Shakeable** - Import only what you use
- **Schema-First** - Define once, get types everywhere
- **Git-like CLI** - Familiar commands for schema management

## Installation

```bash
npm install relq
```

## Entry Points

```typescript
// Runtime - Client, queries, functions
import { Relq, F, Case, PG } from 'relq';

// Configuration
import { defineConfig, loadConfig } from 'relq/config';

// Schema Builder - Types, tables, DDL
import {
  defineTable,
  integer, text, uuid, jsonb, timestamp,
  pgEnum, pgDomain, pgComposite,
  one, many
} from 'relq/schema-builder';
```

## Quick Start

### 1. Define Your Schema

```typescript
// db/schema.ts
import {
  defineTable,
  uuid, text, timestamp, boolean, integer, jsonb,
  pgEnum
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

export const schema = { users, posts };
```

### 2. Connect

```typescript
import { Relq } from 'relq';
import { schema } from './schema';

const db = new Relq(schema, {
  host: 'localhost',
  database: 'myapp',
  user: 'postgres',
  password: 'secret'
});

// Or with connection URL
const db = new Relq(schema, {
  url: process.env.DATABASE_URL
});
```

### 3. Query with Full Type Safety

```typescript
// Types flow from schema to results
const users = await db.table.users
  .select(['id', 'email', 'status'])
  .where(q => q.equal('status', 'active'))
  .all();
// Type: { id: string; email: string; status: 'active' | 'inactive' | 'suspended' }[]

// Convenience methods
const user = await db.table.users.findById('uuid-here');
const user = await db.table.users.findOne({ email: 'test@example.com' });
```

## Column Types

Relq supports 100+ PostgreSQL types with proper TypeScript mapping:

### Numeric Types
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

### String Types
```typescript
text()                             // string
varchar(), char()                  // string
citext()                           // string (case-insensitive, requires extension)
```

### Date/Time Types
```typescript
timestamp()                        // Date
timestamptz(), timestampWithTimeZone()  // Date
date()                             // Date | string
time(), timetz()                   // string
interval()                         // string
```

### JSON Types
```typescript
json<T>()                          // T (typed JSON)
jsonb<T>()                         // T (typed JSONB)

// Example with type parameter
metadata: jsonb<{ theme: string; settings: Record<string, boolean> }>()
```

### Boolean & UUID
```typescript
boolean(), bool()                  // boolean
uuid()                             // string
```

### Array Types
```typescript
// Any column type can be an array
tags: text().array()               // string[]
matrix: integer().array(2)         // number[][] (2D array)
scores: numeric().array()          // string[]
```

### Geometric Types
```typescript
point()                            // { x: number; y: number }
line()                             // { a: number; b: number; c: number }
lseg()                             // [[number, number], [number, number]]
box()                              // [[number, number], [number, number]]
path()                             // Array<{ x: number; y: number }>
polygon()                          // Array<{ x: number; y: number }>
circle()                           // { x: number; y: number; r: number }
```

### Network Types
```typescript
inet()                             // string (IP address)
cidr()                             // string (IP network)
macaddr()                          // string
macaddr8()                         // string
```

### Range Types
```typescript
int4range(), int8range()           // string
numrange(), daterange()            // string
tsrange(), tstzrange()             // string
// Multi-range variants also available
```

### Full-Text Search
```typescript
tsvector()                         // string
tsquery()                          // string
```

### PostGIS (requires extension)
```typescript
geometry('location', 4326, 'POINT')     // GeoJSON
geography('area', 4326, 'POLYGON')      // GeoJSON
geoPoint('coords')                       // { x, y, srid }
box2d(), box3d()                        // string
```

### Extension Types
```typescript
ltree()                            // string (hierarchical labels)
hstore()                           // Record<string, string | null>
cube()                             // number[]
semver()                           // string
```

## Query API

### Select
```typescript
// All columns
const users = await db.table.users.select().all();

// Specific columns
const emails = await db.table.users
  .select(['id', 'email'])
  .all();

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
  .one();

// With joins
const postsWithAuthors = await db.table.posts
  .select(['posts.id', 'posts.title', 'users.name'])
  .leftJoin('users', 'users.id = posts.author_id')
  .all();

// Distinct
await db.table.users.select(['status']).distinct().all();

// Distinct on (PostgreSQL-specific)
await db.table.logs
  .select()
  .distinctOn('userId')
  .orderBy('userId')
  .orderBy('createdAt', 'DESC')
  .all();

// Locking
await db.table.jobs
  .select()
  .where(q => q.equal('status', 'pending'))
  .forUpdateSkipLocked()
  .limit(1)
  .one();
```

### Insert
```typescript
// Single insert with returning
const user = await db.table.users
  .insert({ email: 'new@example.com', name: 'New User' })
  .returning(['id', 'createdAt'])
  .one();

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

### Update
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
  .one();

// Bulk update
await db.table.posts
  .update({ published: true })
  .where(q => q.in('id', postIds))
  .run();
```

### Delete
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
  .all();
```

### Aggregations
```typescript
// Count
const count = await db.table.users
  .count()
  .where(q => q.equal('status', 'active'))
  .run();

// Count with group by
const byStatus = await db.table.users
  .count()
  .groupBy('status')
  .run();

// Multiple aggregations
const stats = await db.table.orders
  .aggregate()
  .count('id', 'totalOrders')
  .sum('amount', 'totalRevenue')
  .avg('amount', 'avgOrderValue')
  .min('amount', 'minOrder')
  .max('amount', 'maxOrder')
  .one();
```

### Pagination
```typescript
// Cursor-based (recommended)
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

## Condition Builders

### Basic Comparisons
```typescript
.where(q => q.equal('status', 'active'))
.where(q => q.notEqual('role', 'guest'))
.where(q => q.greaterThan('age', 18))
.where(q => q.greaterThanEqual('score', 100))
.where(q => q.lessThan('price', 50))
.where(q => q.lessThanEqual('quantity', 10))
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
.where(q => q.array.date.after('dates', '2024-01-01'))
```

### Full-Text Search
```typescript
.where(q => q.fulltext.search('content', 'typescript tutorial'))
.where(q => q.fulltext.match('title', 'node & express'))
.where(q => q.fulltext.rank('body', 'search terms', 0.1))
```

### Range Conditions
```typescript
.where(q => q.range.contains('dateRange', '2024-06-15'))
.where(q => q.range.containedBy('priceRange', '[0, 1000]'))
.where(q => q.range.overlaps('availability', '[2024-01-01, 2024-12-31]'))
```

### Geometric Conditions
```typescript
.where(q => q.geometric.contains('area', '(0,0),(10,10)'))
.where(q => q.geometric.overlaps('region', box))
.where(q => q.geometric.distanceLessThan('location', '(5,5)', 10))
```

### Network Conditions
```typescript
.where(q => q.network.containsOrEqual('subnet', '192.168.1.0/24'))
.where(q => q.network.isIPv4('address'))
.where(q => q.network.isIPv6('address'))
```

## Advanced Schema Features

### Domains with Validation
```typescript
import { pgDomain, text, numeric } from 'relq/schema-builder';

// Email domain with pattern validation
export const emailDomain = pgDomain('email', text(), (value) => [
  value.matches('^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$')
]);

// Percentage domain with range validation
export const percentageDomain = pgDomain('percentage',
  numeric().precision(5).scale(2),
  (value) => [value.gte(0), value.lte(100)]
);

// Use in tables
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

  // Using SQL functions
  searchVector: tsvector().generatedAlwaysAs(
    (table, F) => F.toTsvector('english', table.description)
  ),

  // String concatenation
  fullName: text().generatedAlwaysAs(
    (table, F) => F.concat(table.firstName, ' ', table.lastName)
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

### Check Constraints
```typescript
const products = defineTable('products', {
  price: numeric().precision(10).scale(2).notNull(),
  salePrice: numeric().precision(10).scale(2),
  stockQuantity: integer().default(0)
}, {
  checkConstraints: (table, check) => [
    check.constraint('price_positive', table.price.gt(0)),
    check.constraint('sale_price_valid',
      table.salePrice.isNull().or(table.salePrice.lte(table.price))
    ),
    check.constraint('stock_non_negative', table.stockQuantity.gte(0))
  ]
});
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
      .on(F => F.lower(table.title)),

    // With storage options
    index('posts_search_idx')
      .on(table.searchVector)
      .using('gin')
      .with({ fastupdate: false })
  ]
});
```

### Relations
```typescript
import { one, many, manyToMany } from 'relq/schema-builder';

export const users = defineTable('users', {
  id: uuid().primaryKey(),
  email: text().notNull().unique()
}, {
  relations: {
    posts: many('posts', { foreignKey: 'authorId' }),
    profile: one('profiles', { foreignKey: 'userId' })
  }
});

export const posts = defineTable('posts', {
  id: uuid().primaryKey(),
  authorId: uuid('author_id').references('users', 'id')
}, {
  relations: {
    author: one('users', { foreignKey: 'authorId' }),
    tags: manyToMany('tags', {
      through: 'post_tags',
      foreignKey: 'postId',
      otherKey: 'tagId'
    })
  }
});
```

## SQL Functions

```typescript
import { F, Case, PG } from 'relq';

// String
F.lower('email'), F.upper('name')
F.concat('first', ' ', 'last')
F.substring('text', 1, 10)
F.trim('value'), F.ltrim('value'), F.rtrim('value')
F.length('text'), F.replace('text', 'old', 'new')

// Date/Time
F.now(), F.currentDate(), F.currentTimestamp()
F.extract('year', 'created_at')
F.dateTrunc('month', 'created_at')
F.age('birth_date')

// Math
F.abs('value'), F.ceil('value'), F.floor('value')
F.round('price', 2), F.trunc('value', 2)
F.power('base', 2), F.sqrt('value')
F.greatest('a', 'b', 'c'), F.least('a', 'b', 'c')

// Aggregates
F.count('id'), F.sum('amount'), F.avg('rating')
F.min('price'), F.max('price')
F.arrayAgg('tag'), F.stringAgg('name', ', ')

// JSONB
F.jsonbSet('data', ['key'], 'value')
F.jsonbExtract('data', 'key')
F.jsonbArrayLength('items')

// Arrays
F.arrayAppend('tags', 'new')
F.arrayRemove('tags', 'old')
F.arrayLength('items', 1)
F.unnest('tags')

// Conditional
Case()
  .when(F.gt('price', 100), 'expensive')
  .when(F.gt('price', 50), 'moderate')
  .else('cheap')
  .end()

// PostgreSQL values
PG.now()          // NOW()
PG.currentDate()  // CURRENT_DATE
PG.currentUser()  // CURRENT_USER
PG.null()         // NULL
PG.true()         // TRUE
PG.false()        // FALSE
```

## Transactions

```typescript
// Basic transaction
const result = await db.transaction(async (tx) => {
  const user = await tx.table.users
    .insert({ email: 'new@example.com', name: 'User' })
    .returning(['id'])
    .one();

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
```

## CLI Commands

```bash
relq init                    # Initialize project
relq status                  # Show pending changes
relq diff [--sql]            # Show differences
relq pull [--force]          # Pull from database
relq generate -m "message"   # Create migration
relq push [--dry-run]        # Apply migrations
relq log / relq history     # View history
relq rollback [n]            # Rollback migrations
relq sync                    # Full sync
relq introspect              # Generate schema from DB
```

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
    password: process.env.DB_PASSWORD
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

## Error Handling

```typescript
import { RelqError, RelqConnectionError, RelqQueryError, isRelqError } from 'relq';

try {
  await db.table.users.insert({ ... }).run();
} catch (error) {
  if (isRelqError(error)) {
    if (error instanceof RelqConnectionError) {
      // Connection issues
    } else if (error instanceof RelqQueryError) {
      console.error('SQL:', error.sql);
    }
  }
}
```

## Requirements

- Node.js 18+ or Bun 1.0+
- PostgreSQL 12+
- TypeScript 5.0+

## License

MIT

## Links

- [GitHub](https://github.com/yuniqsolutions/relq)
- [npm](https://www.npmjs.com/package/relq)
