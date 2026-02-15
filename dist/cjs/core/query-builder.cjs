"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryBuilder = exports.TypedCountBuilder = exports.TypedDeleteBuilder = exports.TypedUpdateBuilder = exports.TypedInsertBuilder = exports.TypedSelectBuilder = void 0;
exports.default = relq;
exports.relq = relq;
exports.relqFor = relqFor;
const select_builder_1 = require("../select/select-builder.cjs");
const insert_builder_1 = require("../insert/insert-builder.cjs");
const update_builder_1 = require("../update/update-builder.cjs");
const delete_builder_1 = require("../delete/delete-builder.cjs");
const count_builder_1 = require("../count/count-builder.cjs");
const raw_query_builder_1 = require("../raw/raw-query-builder.cjs");
const create_index_builder_1 = require("../indexing/create-index-builder.cjs");
const drop_index_builder_1 = require("../indexing/drop-index-builder.cjs");
const create_table_builder_1 = require("../table/create-table-builder.cjs");
const alter_table_builder_1 = require("../table/alter-table-builder.cjs");
const partition_builder_1 = require("../table/partition-builder.cjs");
const create_trigger_builder_1 = require("../trigger/create-trigger-builder.cjs");
const create_function_builder_1 = require("../function/create-function-builder.cjs");
const create_view_builder_1 = require("../view/create-view-builder.cjs");
const schema_builder_1 = require("../schema/schema-builder.cjs");
const transaction_builder_1 = require("../transaction/transaction-builder.cjs");
const cte_builder_1 = require("../cte/cte-builder.cjs");
const window_builder_1 = require("../window/window-builder.cjs");
const truncate_builder_1 = require("../table/truncate-builder.cjs");
const sequence_builder_1 = require("../sequence/sequence-builder.cjs");
const explain_builder_1 = require("../explain/explain-builder.cjs");
const listen_notify_builder_1 = require("../pubsub/listen-notify-builder.cjs");
const vacuum_builder_1 = require("../maintenance/vacuum-builder.cjs");
const copy_builder_1 = require("../copy/copy-builder.cjs");
const pg_format_1 = __importDefault(require("../utils/pg-format.cjs"));
class TypedSelectBuilder {
    builder;
    constructor(builder) {
        this.builder = builder;
    }
    where(callback) {
        this.builder.where(callback);
        return this;
    }
    orderBy(column, direction = 'ASC') {
        this.builder.orderBy(column, direction);
        return this;
    }
    orderAsc(column) {
        this.builder.orderAsc(column);
        return this;
    }
    orderDesc(column) {
        this.builder.orderDesc(column);
        return this;
    }
    limit(count) {
        this.builder.limit(count);
        return this;
    }
    offset(count) {
        this.builder.offset(count);
        return this;
    }
    groupBy(...columns) {
        this.builder.groupBy(...columns);
        return this;
    }
    having(callback) {
        this.builder.having(callback);
        return this;
    }
    distinct() {
        this.builder.distinct();
        return this;
    }
    distinctOn(...columns) {
        this.builder.distinctOn(...columns);
        return this;
    }
    join(table, condition) {
        this.builder.join(table, condition);
        return this;
    }
    leftJoin(table, condition) {
        this.builder.leftJoin(table, condition);
        return this;
    }
    rightJoin(table, condition) {
        this.builder.rightJoin(table, condition);
        return this;
    }
    innerJoin(table, condition) {
        this.builder.innerJoin(table, condition);
        return this;
    }
    forUpdate() {
        this.builder.forUpdate();
        return this;
    }
    forUpdateNoWait() {
        this.builder.forUpdateNoWait();
        return this;
    }
    forUpdateSkipLocked() {
        this.builder.forUpdateSkipLocked();
        return this;
    }
    forShare() {
        this.builder.forShare();
        return this;
    }
    union(query) {
        this.builder.union(query instanceof TypedSelectBuilder ? query.builder : query);
        return this;
    }
    unionAll(query) {
        this.builder.unionAll(query instanceof TypedSelectBuilder ? query.builder : query);
        return this;
    }
    intersect(query) {
        this.builder.intersect(query instanceof TypedSelectBuilder ? query.builder : query);
        return this;
    }
    except(query) {
        this.builder.except(query instanceof TypedSelectBuilder ? query.builder : query);
        return this;
    }
    toString() {
        return this.builder.toString();
    }
    getBuilder() {
        return this.builder;
    }
}
exports.TypedSelectBuilder = TypedSelectBuilder;
class TypedInsertBuilder {
    builder;
    constructor(builder) {
        this.builder = builder;
    }
    addRow(row) {
        this.builder.addRow(row);
        return this;
    }
    addRows(rows) {
        this.builder.addRows(rows);
        return this;
    }
    clear() {
        this.builder.clear();
        return this;
    }
    get total() {
        return this.builder.total;
    }
    _onConflict(columns, callback) {
        const cols = Array.isArray(columns) ? columns : [columns];
        this.builder._onConflict(cols, (conflictBuilder) => {
            callback(conflictBuilder);
        });
        return this;
    }
    returning(columns) {
        this.builder.returning([...columns]);
        return this;
    }
    toString() {
        return this.builder.toString();
    }
    getBuilder() {
        return this.builder;
    }
}
exports.TypedInsertBuilder = TypedInsertBuilder;
class TypedUpdateBuilder {
    builder;
    constructor(builder) {
        this.builder = builder;
    }
    where(callback) {
        this.builder.where(callback);
        return this;
    }
    returning(columns) {
        this.builder.returning([...columns]);
        return this;
    }
    toString() {
        return this.builder.toString();
    }
    getBuilder() {
        return this.builder;
    }
}
exports.TypedUpdateBuilder = TypedUpdateBuilder;
class TypedDeleteBuilder {
    builder;
    constructor(builder) {
        this.builder = builder;
    }
    where(callback) {
        this.builder.where(callback);
        return this;
    }
    returning(columns) {
        this.builder.returning([...columns]);
        return this;
    }
    toString() {
        return this.builder.toString();
    }
    getBuilder() {
        return this.builder;
    }
}
exports.TypedDeleteBuilder = TypedDeleteBuilder;
class TypedCountBuilder {
    builder;
    constructor(builder) {
        this.builder = builder;
    }
    where(callback) {
        this.builder.where(callback);
        return this;
    }
    toString() {
        return this.builder.toString();
    }
    getBuilder() {
        return this.builder;
    }
}
exports.TypedCountBuilder = TypedCountBuilder;
class QueryBuilder {
    tableName;
    constructor(tableName) {
        this.tableName = tableName;
    }
    select(columns) {
        const builder = new select_builder_1.SelectBuilder(this.tableName, columns);
        return new TypedSelectBuilder(builder);
    }
    insert(data) {
        const builder = new insert_builder_1.InsertBuilder(this.tableName, data);
        return new TypedInsertBuilder(builder);
    }
    update(data) {
        const builder = new update_builder_1.UpdateBuilder(this.tableName, data);
        return new TypedUpdateBuilder(builder);
    }
    delete() {
        const builder = new delete_builder_1.DeleteBuilder(this.tableName);
        return new TypedDeleteBuilder(builder);
    }
    count() {
        const builder = new count_builder_1.CountBuilder(this.tableName);
        return new TypedCountBuilder(builder);
    }
    createTable() {
        return new create_table_builder_1.CreateTableBuilder(this.tableName);
    }
    alterTable() {
        return new alter_table_builder_1.AlterTableBuilder(this.tableName);
    }
    dropTable() {
        return new alter_table_builder_1.DropTableBuilder(this.tableName);
    }
    createIndex(indexName) {
        return new create_index_builder_1.CreateIndexBuilder(this.tableName, indexName);
    }
    dropIndex(indexName) {
        return new drop_index_builder_1.DropIndexBuilder(indexName);
    }
    reindex() {
        return new drop_index_builder_1.ReindexBuilder('TABLE', this.tableName);
    }
    raw(query, ...params) {
        return new raw_query_builder_1.RawQueryBuilder(query, params);
    }
    sql(query, ...params) {
        return new raw_query_builder_1.RawQueryBuilder(query, params);
    }
    truncate() {
        return new truncate_builder_1.TruncateBuilder(this.tableName);
    }
    vacuum() {
        return new vacuum_builder_1.VacuumBuilder(this.tableName);
    }
    analyze() {
        return new vacuum_builder_1.AnalyzeBuilder(this.tableName);
    }
    copyTo() {
        return new copy_builder_1.CopyToBuilder(this.tableName);
    }
    copyFrom() {
        return new copy_builder_1.CopyFromBuilder(this.tableName);
    }
    static raw(query, ...params) {
        return new raw_query_builder_1.RawQueryBuilder(query, params);
    }
    static sql(query, ...params) {
        return new raw_query_builder_1.RawQueryBuilder(query, params);
    }
    static bulkInsert(tableName, columns, values) {
        const query = (0, pg_format_1.default)('INSERT INTO %I (%I) VALUES %L', tableName, columns, values);
        return new raw_query_builder_1.RawQueryBuilder(query);
    }
    static bulkUpdate(tableName, updates, keyColumn) {
        const columns = Object.keys(updates[0]);
        const values = updates.map(update => Object.values(update));
        const valuesList = (0, pg_format_1.default)('%L', values);
        const columnAliases = columns.map((_, idx) => `column${idx + 1}`).join(', ');
        const columnMappings = columns.map((col, idx) => (0, pg_format_1.default)('%I = v.column%s', col, idx + 1)).join(', ');
        const query = (0, pg_format_1.default)('UPDATE %I SET %s FROM (VALUES %s) AS v(%s) WHERE %I.%I = v.column1', tableName, columnMappings, valuesList, columnAliases, tableName, keyColumn);
        return new raw_query_builder_1.RawQueryBuilder(query);
    }
    static createTrigger(triggerName) {
        return new create_trigger_builder_1.CreateTriggerBuilder(triggerName);
    }
    static dropTrigger(triggerName, tableName) {
        return new create_trigger_builder_1.DropTriggerBuilder(triggerName, tableName);
    }
    static createFunction(functionName) {
        return new create_function_builder_1.CreateFunctionBuilder(functionName);
    }
    static dropFunction(functionName, parameterTypes) {
        return new create_function_builder_1.DropFunctionBuilder(functionName, parameterTypes);
    }
    static createPartition(partitionName, parentTable) {
        return new partition_builder_1.CreatePartitionBuilder(partitionName, parentTable);
    }
    static attachPartition(parentTable, partitionName) {
        return new partition_builder_1.AttachPartitionBuilder(parentTable, partitionName);
    }
    static detachPartition(parentTable, partitionName) {
        return new partition_builder_1.DetachPartitionBuilder(parentTable, partitionName);
    }
    static createView(viewName) {
        return new create_view_builder_1.CreateViewBuilder(viewName);
    }
    static dropView(viewName, materialized) {
        return new create_view_builder_1.DropViewBuilder(viewName, materialized);
    }
    static refreshMaterializedView(viewName) {
        return new create_view_builder_1.RefreshMaterializedViewBuilder(viewName);
    }
    static createSchema(schemaName) {
        return new schema_builder_1.CreateSchemaBuilder(schemaName);
    }
    static dropSchema(schemaName) {
        return new schema_builder_1.DropSchemaBuilder(schemaName);
    }
    static grant() {
        return new schema_builder_1.GrantBuilder();
    }
    static revoke() {
        return new schema_builder_1.RevokeBuilder();
    }
    static transaction() {
        return new transaction_builder_1.TransactionBuilder();
    }
    static savepoint(name) {
        return new transaction_builder_1.SavepointBuilder(name);
    }
    static cte() {
        return new cte_builder_1.CTEBuilder();
    }
    static window() {
        return new window_builder_1.WindowBuilder();
    }
    static reindex(target, name) {
        return new drop_index_builder_1.ReindexBuilder(target, name);
    }
    static truncate(tables) {
        return new truncate_builder_1.TruncateBuilder(tables);
    }
    static createSequence(sequenceName) {
        return new sequence_builder_1.CreateSequenceBuilder(sequenceName);
    }
    static alterSequence(sequenceName) {
        return new sequence_builder_1.AlterSequenceBuilder(sequenceName);
    }
    static dropSequence(sequenceNames) {
        return new sequence_builder_1.DropSequenceBuilder(sequenceNames);
    }
    static explain(query, options) {
        return new explain_builder_1.ExplainBuilder(query, options);
    }
    static listen(channel) {
        return new listen_notify_builder_1.ListenBuilder(channel);
    }
    static unlisten(channel) {
        return new listen_notify_builder_1.UnlistenBuilder(channel);
    }
    static notify(channel, payload) {
        return new listen_notify_builder_1.NotifyBuilder(channel, payload);
    }
    static vacuum(tables) {
        return new vacuum_builder_1.VacuumBuilder(tables);
    }
    static analyze(tables) {
        return new vacuum_builder_1.AnalyzeBuilder(tables);
    }
    static copyTo(tableOrQuery) {
        return new copy_builder_1.CopyToBuilder(tableOrQuery);
    }
    static copyFrom(tableName) {
        return new copy_builder_1.CopyFromBuilder(tableName);
    }
    static createRole(roleName) {
        return new schema_builder_1.CreateRoleBuilder(roleName);
    }
    static alterRole(roleName) {
        return new schema_builder_1.AlterRoleBuilder(roleName);
    }
    static dropRole(roleNames) {
        return new schema_builder_1.DropRoleBuilder(roleNames);
    }
    static setRole() {
        return new schema_builder_1.SetRoleBuilder();
    }
    static reassignOwned() {
        return new schema_builder_1.ReassignOwnedBuilder();
    }
    static dropOwned() {
        return new schema_builder_1.DropOwnedBuilder();
    }
    static defaultPrivileges() {
        return new schema_builder_1.DefaultPrivilegesBuilder();
    }
}
exports.QueryBuilder = QueryBuilder;
function relq(tableName) {
    return new QueryBuilder(tableName);
}
function relqFor() {
    return (tableName) => {
        return new QueryBuilder(tableName);
    };
}
