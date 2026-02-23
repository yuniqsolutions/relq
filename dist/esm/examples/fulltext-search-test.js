import relq from "../index.js";
const alterTableSQL = relq('results')
    .alterTable()
    .addColumn('search_vector', {
    type: 'tsvector',
    generated: {
        always: true,
        expression: `
                setweight(to_tsvector('english', coalesce(email, '')), 'A') ||
                setweight(to_tsvector('english', coalesce(ip_address, '')), 'B') ||
                setweight(to_tsvector('english', coalesce(country, '')), 'C') ||
                setweight(to_tsvector('english', coalesce(city, '')), 'C') ||
                setweight(to_tsvector('english', coalesce(device, '')), 'D') ||
                setweight(to_tsvector('english', coalesce(browser, '')), 'D')
            `.trim()
    }
}, true)
    .toString();
console.log('=== ALTER TABLE ===');
console.log(alterTableSQL);
console.log('');
const createIndexSQL = relq('results')
    .createIndex('idx_results_search_gin')
    .gin(['search_vector'], 'tsvector_ops')
    .where("user_id IS NOT NULL AND is_deleted = FALSE")
    .ifNotExists()
    .toString();
console.log('=== CREATE INDEX ===');
console.log(createIndexSQL);
console.log('');
const searchQuery = relq('results')
    .select([
    'id',
    'email',
    'ip_address',
    'country',
    'city',
    'device',
    'browser',
    'is_pinned',
    'updated_at'
])
    .where(q => q
    .equal('user_id', 'abc')
    .equal('is_deleted', false)
    .fulltext.search('search_vector', 'john@gmail'))
    .orderBy('is_pinned', 'DESC')
    .orderBy('updated_at', 'DESC')
    .toString();
console.log('=== SELECT QUERY ===');
console.log(searchQuery);
console.log('');
console.log('=== ADDITIONAL EXAMPLES ===\n');
const sortIndexSQL = relq('results')
    .createIndex('idx_results_sort')
    .btree([
    { column: 'is_pinned', order: 'DESC' },
    { column: 'updated_at', order: 'DESC' }
])
    .where("is_deleted = FALSE")
    .ifNotExists()
    .toString();
console.log('1. Multi-column sort index:');
console.log(sortIndexSQL);
console.log('');
const userIndexSQL = relq('results')
    .createIndex('idx_results_user_deleted')
    .btree(['user_id', 'is_deleted'])
    .ifNotExists()
    .toString();
console.log('2. User + deleted filter index:');
console.log(userIndexSQL);
console.log('');
const rankedSearchQuery = relq('results')
    .select(['id', 'email', 'country'])
    .where(q => q
    .equal('user_id', 'abc')
    .equal('is_deleted', false)
    .fulltext.rank('search_vector', 'california', 0.1))
    .toString();
console.log('3. Search with minimum rank threshold:');
console.log(rankedSearchQuery);
console.log('');
const alterWithIdentitySQL = relq('users')
    .alterTable()
    .addColumn('sequence_id', {
    type: 'integer',
    generated: {
        always: false,
        expression: 'nextval(\'user_seq\'::regclass)'
    }
})
    .toString();
console.log('4. Generated column with BY DEFAULT:');
console.log(alterWithIdentitySQL);
console.log('');
const multipleActionsSQL = relq('results')
    .alterTable()
    .addColumn('search_vector', {
    type: 'tsvector',
    generated: {
        always: true,
        expression: `to_tsvector('english', coalesce(email, ''))`
    }
})
    .addColumn('full_name', {
    type: 'text',
    generated: {
        always: true,
        expression: `coalesce(first_name, '') || ' ' || coalesce(last_name, '')`
    }
})
    .toString();
console.log('5. Multiple generated columns:');
console.log(multipleActionsSQL);
console.log('');
console.log('✅ All examples generated successfully!');
