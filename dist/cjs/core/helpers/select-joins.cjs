"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeTypeSafeJoin = executeTypeSafeJoin;
exports.executeTypeSafeJoinMany = executeTypeSafeJoinMany;
const table_proxy_1 = require("../../select/table-proxy.cjs");
const join_condition_builder_1 = require("../../select/join-condition-builder.cjs");
const join_internals_1 = require("../../select/join-internals.cjs");
const join_many_condition_builder_1 = require("../../select/join-many-condition-builder.cjs");
const relq_errors_1 = require("../../errors/relq-errors.cjs");
const fk_resolver_1 = require("../../utils/fk-resolver.cjs");
const methods_1 = require("./methods.cjs");
function executeTypeSafeJoin(ctx, joinType, tableOrAlias, callback) {
    const [rightTableKey, rightAlias] = Array.isArray(tableOrAlias)
        ? tableOrAlias
        : [tableOrAlias, tableOrAlias];
    const internal = ctx.relq[methods_1.INTERNAL];
    const schema = internal.getSchema();
    const relations = internal.getRelations();
    const leftTableDef = internal.getTableDef(ctx.schemaKey || ctx.tableName);
    const rightTableDef = internal.getTableDef(rightTableKey);
    const leftTableName = leftTableDef?.$name || ctx.tableName;
    const rightTableName = rightTableDef?.$name || rightTableKey;
    const leftAlias = ctx.builder.getTableIdentifier();
    const leftProxy = (0, table_proxy_1.createTableProxy)(leftTableName, leftAlias, leftTableDef);
    const rightProxy = (0, table_proxy_1.createTableProxy)(rightTableName, rightAlias, rightTableDef);
    const conditionBuilder = new join_condition_builder_1.JoinConditionBuilder();
    if (callback) {
        callback(conditionBuilder, leftProxy, rightProxy);
    }
    const conditionInternals = conditionBuilder[join_internals_1.JOIN_INTERNAL];
    if (!conditionInternals.hasConditions() && schema && relations) {
        const fkResolution = (0, fk_resolver_1.resolveForeignKey)(relations, schema, ctx.schemaKey || ctx.tableName, rightTableKey);
        if (fkResolution) {
            const leftCol = leftProxy[fkResolution.fromColumn];
            const rightCol = rightProxy[fkResolution.toColumn];
            conditionBuilder.equal(leftCol, rightCol);
        }
        else {
            throw new relq_errors_1.RelqQueryError(`Cannot auto-resolve FK relationship between "${ctx.schemaKey || ctx.tableName}" and "${rightTableKey}". ` +
                `Either provide a callback with explicit join conditions, or define the relationship in your relations config.`, { hint: `Use .join('${rightTableKey}', (on, left, right) => on.equal(left.columnName, right.id))` });
        }
    }
    const selectedProps = conditionInternals.getSelectedColumns();
    let selectColumns;
    if (selectedProps && selectedProps.length > 0) {
        const rightColumns = rightTableDef?.$columns || rightTableDef;
        selectColumns = selectedProps.map(prop => {
            const columnDef = rightColumns?.[prop];
            const sqlName = columnDef?.$columnName || prop;
            return { property: prop, sqlName };
        });
    }
    const joinClause = {
        type: joinType,
        table: rightTableName,
        alias: rightAlias,
        onClause: conditionInternals.toSQL() || undefined,
        usingColumns: conditionInternals.getUsingColumns() || undefined,
        selectColumns
    };
    ctx.builder.addStructuredJoin(joinClause);
}
function executeTypeSafeJoinMany(ctx, joinType, tableOrAlias, callback) {
    const [rightTableKey, rightAlias] = Array.isArray(tableOrAlias)
        ? tableOrAlias
        : [tableOrAlias, tableOrAlias];
    const internal = ctx.relq[methods_1.INTERNAL];
    const leftTableDef = internal.getTableDef(ctx.schemaKey || ctx.tableName);
    const rightTableDef = internal.getTableDef(rightTableKey);
    const leftTableName = leftTableDef?.$name || ctx.tableName;
    const rightTableName = rightTableDef?.$name || rightTableKey;
    const leftAlias = ctx.builder.getTableIdentifier();
    const leftProxy = (0, table_proxy_1.createTableProxy)(leftTableName, leftAlias, leftTableDef);
    const rightProxy = (0, table_proxy_1.createTableProxy)(rightTableName, rightAlias, rightTableDef);
    const conditionBuilder = new join_many_condition_builder_1.JoinManyConditionBuilder();
    const proxyCreator = (tableKey, alias) => {
        const tableDef = internal.getTableDef(tableKey);
        const sqlTableName = tableDef?.$name || tableKey;
        return {
            proxy: (0, table_proxy_1.createTableProxy)(sqlTableName, alias, tableDef),
            tableName: sqlTableName
        };
    };
    conditionBuilder[join_internals_1.JOIN_SETUP](proxyCreator, rightProxy);
    callback(conditionBuilder, leftProxy, rightProxy);
    const lateralSQL = buildLateralSubquery(rightTableName, rightAlias, conditionBuilder, rightTableDef);
    const lateralJoinType = joinType === 'LEFT JOIN' ? 'LEFT JOIN LATERAL' : 'JOIN LATERAL';
    const joinClause = {
        type: lateralJoinType,
        table: rightTableName,
        alias: rightAlias,
        lateralSubquery: lateralSQL
    };
    ctx.builder.addStructuredJoin(joinClause);
}
function buildLateralSubquery(tableName, alias, builder, tableDef) {
    const parts = [];
    parts.push('(SELECT');
    parts.push(`COALESCE(jsonb_agg(row_to_json(sub.*)), '[]'::jsonb) AS ${alias}`);
    parts.push('FROM (');
    const internals = builder[join_internals_1.JOIN_INTERNAL];
    parts.push('SELECT');
    const selectedProps = internals.getSelectedColumns();
    if (selectedProps && selectedProps.length > 0) {
        const tableColumns = tableDef?.$columns || tableDef;
        const selectCols = selectedProps.map(prop => {
            const columnDef = tableColumns?.[prop];
            const sqlName = columnDef?.$columnName || prop;
            return `"${alias}"."${sqlName}" AS "${prop}"`;
        }).join(', ');
        parts.push(selectCols);
    }
    else {
        parts.push(`"${alias}".*`);
    }
    parts.push(`FROM "${tableName}" AS "${alias}"`);
    const innerJoins = internals.getInnerJoins();
    for (const join of innerJoins) {
        parts.push(`${join.type} "${join.table}" AS "${join.alias}" ON ${join.onClause}`);
    }
    const whereSQL = internals.toWhereSQL();
    if (whereSQL) {
        parts.push(`WHERE ${whereSQL}`);
    }
    const orderBySQL = internals.toOrderBySQL();
    if (orderBySQL) {
        parts.push(`ORDER BY ${orderBySQL}`);
    }
    const limitSQL = internals.toLimitSQL();
    if (limitSQL) {
        parts.push(limitSQL);
    }
    const offsetSQL = internals.toOffsetSQL();
    if (offsetSQL) {
        parts.push(offsetSQL);
    }
    parts.push(') sub');
    parts.push(`) AS "${alias}_lateral"`);
    return parts.join(' ');
}
