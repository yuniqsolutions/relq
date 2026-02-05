import { createTableProxy } from "../../select/table-proxy.js";
import { JoinConditionBuilder } from "../../select/join-condition-builder.js";
import { JOIN_INTERNAL, JOIN_SETUP } from "../../select/join-internals.js";
import { JoinManyConditionBuilder } from "../../select/join-many-condition-builder.js";
import { RelqQueryError } from "../../errors/relq-errors.js";
import { resolveForeignKey } from "../../utils/fk-resolver.js";
import { INTERNAL } from "./methods.js";
export function executeTypeSafeJoin(ctx, joinType, tableOrAlias, callback) {
    const [rightTableKey, rightAlias] = Array.isArray(tableOrAlias)
        ? tableOrAlias
        : [tableOrAlias, tableOrAlias];
    const internal = ctx.relq[INTERNAL];
    const schema = internal.getSchema();
    const relations = internal.getRelations();
    const leftTableDef = internal.getTableDef(ctx.schemaKey || ctx.tableName);
    const rightTableDef = internal.getTableDef(rightTableKey);
    const leftTableName = leftTableDef?.$name || ctx.tableName;
    const rightTableName = rightTableDef?.$name || rightTableKey;
    const leftAlias = ctx.builder.getTableIdentifier();
    const leftProxy = createTableProxy(leftTableName, leftAlias, leftTableDef);
    const rightProxy = createTableProxy(rightTableName, rightAlias, rightTableDef);
    const conditionBuilder = new JoinConditionBuilder();
    if (callback) {
        callback(conditionBuilder, leftProxy, rightProxy);
    }
    const conditionInternals = conditionBuilder[JOIN_INTERNAL];
    if (!conditionInternals.hasConditions() && schema && relations) {
        const fkResolution = resolveForeignKey(relations, schema, ctx.schemaKey || ctx.tableName, rightTableKey);
        if (fkResolution) {
            const leftCol = leftProxy[fkResolution.fromColumn];
            const rightCol = rightProxy[fkResolution.toColumn];
            conditionBuilder.equal(leftCol, rightCol);
        }
        else {
            throw new RelqQueryError(`Cannot auto-resolve FK relationship between "${ctx.schemaKey || ctx.tableName}" and "${rightTableKey}". ` +
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
export function executeTypeSafeJoinMany(ctx, joinType, tableOrAlias, callback) {
    const [rightTableKey, rightAlias] = Array.isArray(tableOrAlias)
        ? tableOrAlias
        : [tableOrAlias, tableOrAlias];
    const internal = ctx.relq[INTERNAL];
    const leftTableDef = internal.getTableDef(ctx.schemaKey || ctx.tableName);
    const rightTableDef = internal.getTableDef(rightTableKey);
    const leftTableName = leftTableDef?.$name || ctx.tableName;
    const rightTableName = rightTableDef?.$name || rightTableKey;
    const leftAlias = ctx.builder.getTableIdentifier();
    const leftProxy = createTableProxy(leftTableName, leftAlias, leftTableDef);
    const rightProxy = createTableProxy(rightTableName, rightAlias, rightTableDef);
    const conditionBuilder = new JoinManyConditionBuilder();
    const proxyCreator = (tableKey, alias) => {
        const tableDef = internal.getTableDef(tableKey);
        const sqlTableName = tableDef?.$name || tableKey;
        return {
            proxy: createTableProxy(sqlTableName, alias, tableDef),
            tableName: sqlTableName
        };
    };
    conditionBuilder[JOIN_SETUP](proxyCreator, rightProxy);
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
    const internals = builder[JOIN_INTERNAL];
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
