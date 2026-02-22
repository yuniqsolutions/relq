import { SelectBuilder } from "../select/select-builder.js";
import { InsertBuilder } from "../insert/insert-builder.js";
import { UpdateBuilder } from "../update/update-builder.js";
import { DeleteBuilder } from "../delete/delete-builder.js";
import { CountBuilder } from "../count/count-builder.js";
import { RawQueryBuilder } from "../raw/raw-query-builder.js";
import { CreateIndexBuilder } from "../indexing/create-index-builder.js";
import { DropIndexBuilder, ReindexBuilder } from "../indexing/drop-index-builder.js";
import { CreateTableBuilder } from "../table/create-table-builder.js";
import { AlterTableBuilder, DropTableBuilder } from "../table/alter-table-builder.js";
import { CreatePartitionBuilder, AttachPartitionBuilder, DetachPartitionBuilder } from "../table/partition-builder.js";
import { CreateTriggerBuilder, DropTriggerBuilder } from "../trigger/create-trigger-builder.js";
import { CreateFunctionBuilder, DropFunctionBuilder } from "../function/create-function-builder.js";
import { CreateViewBuilder, DropViewBuilder, RefreshMaterializedViewBuilder } from "../view/create-view-builder.js";
import { CreateSchemaBuilder, DropSchemaBuilder, GrantBuilder, RevokeBuilder, CreateRoleBuilder, AlterRoleBuilder, DropRoleBuilder, SetRoleBuilder, ReassignOwnedBuilder, DropOwnedBuilder, DefaultPrivilegesBuilder } from "../schema/schema-builder.js";
import { TransactionBuilder, SavepointBuilder } from "../transaction/transaction-builder.js";
import { CTEBuilder } from "../cte/cte-builder.js";
import { WindowBuilder } from "../window/window-builder.js";
import { TruncateBuilder } from "../table/truncate-builder.js";
import { CreateSequenceBuilder, AlterSequenceBuilder, DropSequenceBuilder } from "../sequence/sequence-builder.js";
import { ExplainBuilder } from "../explain/explain-builder.js";
import { ListenBuilder, UnlistenBuilder, NotifyBuilder } from "../pubsub/listen-notify-builder.js";
import { VacuumBuilder, AnalyzeBuilder } from "../maintenance/vacuum-builder.js";
import { CopyToBuilder, CopyFromBuilder } from "../copy/copy-builder.js";
import format from "../utils/pg-format.js";
export class TypedSelectBuilder {
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
export class TypedInsertBuilder {
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
export class TypedUpdateBuilder {
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
export class TypedDeleteBuilder {
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
export class TypedCountBuilder {
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
export class QueryBuilder {
    tableName;
    constructor(tableName) {
        this.tableName = tableName;
    }
    select(columns) {
        const builder = new SelectBuilder(this.tableName, columns);
        return new TypedSelectBuilder(builder);
    }
    insert(data) {
        const builder = new InsertBuilder(this.tableName, data);
        return new TypedInsertBuilder(builder);
    }
    update(data) {
        const builder = new UpdateBuilder(this.tableName, data);
        return new TypedUpdateBuilder(builder);
    }
    delete() {
        const builder = new DeleteBuilder(this.tableName);
        return new TypedDeleteBuilder(builder);
    }
    count() {
        const builder = new CountBuilder(this.tableName);
        return new TypedCountBuilder(builder);
    }
    createTable() {
        return new CreateTableBuilder(this.tableName);
    }
    alterTable() {
        return new AlterTableBuilder(this.tableName);
    }
    dropTable() {
        return new DropTableBuilder(this.tableName);
    }
    createIndex(indexName) {
        return new CreateIndexBuilder(this.tableName, indexName);
    }
    dropIndex(indexName) {
        return new DropIndexBuilder(indexName);
    }
    reindex() {
        return new ReindexBuilder('TABLE', this.tableName);
    }
    raw(query, ...params) {
        return new RawQueryBuilder(query, params);
    }
    sql(query, ...params) {
        return new RawQueryBuilder(query, params);
    }
    truncate() {
        return new TruncateBuilder(this.tableName);
    }
    vacuum() {
        return new VacuumBuilder(this.tableName);
    }
    analyze() {
        return new AnalyzeBuilder(this.tableName);
    }
    copyTo() {
        return new CopyToBuilder(this.tableName);
    }
    copyFrom() {
        return new CopyFromBuilder(this.tableName);
    }
    static raw(query, ...params) {
        return new RawQueryBuilder(query, params);
    }
    static sql(query, ...params) {
        return new RawQueryBuilder(query, params);
    }
    static bulkInsert(tableName, columns, values) {
        const query = format('INSERT INTO %I (%I) VALUES %L', tableName, columns, values);
        return new RawQueryBuilder(query);
    }
    static bulkUpdate(tableName, updates, keyColumn) {
        const columns = Object.keys(updates[0]);
        const values = updates.map(update => Object.values(update));
        const valuesList = format('%L', values);
        const columnAliases = columns.map((_, idx) => `column${idx + 1}`).join(', ');
        const columnMappings = columns.map((col, idx) => format('%I = v.column%s', col, idx + 1)).join(', ');
        const query = format('UPDATE %I SET %s FROM (VALUES %s) AS v(%s) WHERE %I.%I = v.column1', tableName, columnMappings, valuesList, columnAliases, tableName, keyColumn);
        return new RawQueryBuilder(query);
    }
    static createTrigger(triggerName) {
        return new CreateTriggerBuilder(triggerName);
    }
    static dropTrigger(triggerName, tableName) {
        return new DropTriggerBuilder(triggerName, tableName);
    }
    static createFunction(functionName) {
        return new CreateFunctionBuilder(functionName);
    }
    static dropFunction(functionName, parameterTypes) {
        return new DropFunctionBuilder(functionName, parameterTypes);
    }
    static createPartition(partitionName, parentTable) {
        return new CreatePartitionBuilder(partitionName, parentTable);
    }
    static attachPartition(parentTable, partitionName) {
        return new AttachPartitionBuilder(parentTable, partitionName);
    }
    static detachPartition(parentTable, partitionName) {
        return new DetachPartitionBuilder(parentTable, partitionName);
    }
    static createView(viewName) {
        return new CreateViewBuilder(viewName);
    }
    static dropView(viewName, materialized) {
        return new DropViewBuilder(viewName, materialized);
    }
    static refreshMaterializedView(viewName) {
        return new RefreshMaterializedViewBuilder(viewName);
    }
    static createSchema(schemaName) {
        return new CreateSchemaBuilder(schemaName);
    }
    static dropSchema(schemaName) {
        return new DropSchemaBuilder(schemaName);
    }
    static grant() {
        return new GrantBuilder();
    }
    static revoke() {
        return new RevokeBuilder();
    }
    static transaction() {
        return new TransactionBuilder();
    }
    static savepoint(name) {
        return new SavepointBuilder(name);
    }
    static cte() {
        return new CTEBuilder();
    }
    static window() {
        return new WindowBuilder();
    }
    static reindex(target, name) {
        return new ReindexBuilder(target, name);
    }
    static truncate(tables) {
        return new TruncateBuilder(tables);
    }
    static createSequence(sequenceName) {
        return new CreateSequenceBuilder(sequenceName);
    }
    static alterSequence(sequenceName) {
        return new AlterSequenceBuilder(sequenceName);
    }
    static dropSequence(sequenceNames) {
        return new DropSequenceBuilder(sequenceNames);
    }
    static explain(query, options) {
        return new ExplainBuilder(query, options);
    }
    static listen(channel) {
        return new ListenBuilder(channel);
    }
    static unlisten(channel) {
        return new UnlistenBuilder(channel);
    }
    static notify(channel, payload) {
        return new NotifyBuilder(channel, payload);
    }
    static vacuum(tables) {
        return new VacuumBuilder(tables);
    }
    static analyze(tables) {
        return new AnalyzeBuilder(tables);
    }
    static copyTo(tableOrQuery) {
        return new CopyToBuilder(tableOrQuery);
    }
    static copyFrom(tableName) {
        return new CopyFromBuilder(tableName);
    }
    static createRole(roleName) {
        return new CreateRoleBuilder(roleName);
    }
    static alterRole(roleName) {
        return new AlterRoleBuilder(roleName);
    }
    static dropRole(roleNames) {
        return new DropRoleBuilder(roleNames);
    }
    static setRole() {
        return new SetRoleBuilder();
    }
    static reassignOwned() {
        return new ReassignOwnedBuilder();
    }
    static dropOwned() {
        return new DropOwnedBuilder();
    }
    static defaultPrivileges() {
        return new DefaultPrivilegesBuilder();
    }
}
export default function relq(tableName) {
    return new QueryBuilder(tableName);
}
export function relqFor() {
    return (tableName) => {
        return new QueryBuilder(tableName);
    };
}
export { relq };
