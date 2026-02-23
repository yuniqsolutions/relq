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
        if (joinType === 'RIGHT JOIN') {
            callback(conditionBuilder, leftProxy, rightProxy);
        }
        else {
            callback(conditionBuilder, rightProxy, leftProxy);
        }
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
                `Either provide a callback with explicit join conditions, or define the relationship in your relations config.`, { hint: `Use .join('${rightTableKey}', (on, ${rightTableKey}, source) => on.equal(${rightTableKey}.id, source.columnName))` });
        }
    }
    const selectedProps = conditionInternals.getSelectedColumns();
    let selectColumns;
    const toSnake = (s) => s.replace(/[A-Z]/g, l => `_${l.toLowerCase()}`);
    if (selectedProps && selectedProps.length > 0) {
        const rightColumns = rightTableDef?.$columns || rightTableDef;
        selectColumns = selectedProps.map(prop => {
            const columnDef = rightColumns?.[prop];
            const sqlName = columnDef?.$columnName || toSnake(prop);
            return { property: prop, sqlName };
        });
    }
    else if (rightTableDef) {
        const rightColumns = rightTableDef.$columns || rightTableDef;
        selectColumns = Object.entries(rightColumns)
            .filter(([_, colDef]) => colDef && typeof colDef === 'object' && '$type' in colDef)
            .map(([propName, colDef]) => ({
            property: propName,
            sqlName: colDef.$columnName || toSnake(propName),
        }));
    }
    const joinClause = {
        type: joinType,
        table: rightTableName,
        alias: rightAlias,
        schemaKey: rightTableKey,
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
    callback(conditionBuilder, rightProxy, leftProxy);
    const lateralSQL = buildLateralSubquery(rightTableName, rightAlias, conditionBuilder, rightTableDef);
    const lateralJoinType = joinType === 'LEFT JOIN' ? 'LEFT JOIN LATERAL' : 'JOIN LATERAL';
    const joinClause = {
        type: lateralJoinType,
        table: rightTableName,
        alias: rightAlias,
        schemaKey: rightTableKey,
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
    const innerJoins = internals.getInnerJoins();
    const hasInnerJoins = innerJoins.length > 0;
    const toSnake = (s) => s.replace(/[A-Z]/g, l => `_${l.toLowerCase()}`);
    if (selectedProps && selectedProps.length > 0) {
        const tableColumns = tableDef?.$columns || tableDef;
        const selectCols = selectedProps.map(prop => {
            const columnDef = tableColumns?.[prop];
            if (columnDef || !hasInnerJoins) {
                const sqlName = columnDef?.$columnName || toSnake(prop);
                return `"${alias}"."${sqlName}" AS "${prop}"`;
            }
            else {
                const sqlName = toSnake(prop);
                return `"${sqlName}" AS "${prop}"`;
            }
        }).join(', ');
        parts.push(selectCols);
    }
    else {
        parts.push(`"${alias}".*`);
    }
    parts.push(`FROM "${tableName}" AS "${alias}"`);
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
export function executeTypeSafeJoinManyThrough(ctx, joinType, targetTableOrAlias, junctionTableKey, callback) {
    const [targetKey, targetAlias] = Array.isArray(targetTableOrAlias)
        ? targetTableOrAlias
        : [targetTableOrAlias, targetTableOrAlias];
    const internal = ctx.relq[INTERNAL];
    const schema = internal.getSchema();
    const relations = internal.getRelations();
    if (!schema || !relations) {
        throw new RelqQueryError(`Cannot use { through } without schema and relations config.`, { hint: `Define relations in your schema to use the { through } pattern, or use the callback form of joinMany instead.` });
    }
    const leftTableDef = internal.getTableDef(ctx.schemaKey || ctx.tableName);
    const junctionTableDef = internal.getTableDef(junctionTableKey);
    const targetTableDef = internal.getTableDef(targetKey);
    const leftTableName = leftTableDef?.$name || ctx.tableName;
    const junctionTableName = junctionTableDef?.$name || junctionTableKey;
    const targetTableName = targetTableDef?.$name || targetKey;
    const leftAlias = ctx.builder.getTableIdentifier();
    const leftToJunction = resolveForeignKey(relations, schema, ctx.schemaKey || ctx.tableName, junctionTableKey);
    if (!leftToJunction) {
        throw new RelqQueryError(`Cannot resolve FK between "${ctx.schemaKey || ctx.tableName}" and junction table "${junctionTableKey}".`, { hint: `Define a foreign key relationship between these tables in your relations config, or use the callback form of joinMany instead.` });
    }
    const junctionToTarget = resolveForeignKey(relations, schema, junctionTableKey, targetKey);
    if (!junctionToTarget) {
        throw new RelqQueryError(`Cannot resolve FK between junction table "${junctionTableKey}" and target table "${targetKey}".`, { hint: `Define a foreign key relationship between these tables in your relations config, or use the callback form of joinMany instead.` });
    }
    const conditionBuilder = new JoinManyConditionBuilder();
    if (callback) {
        callback(conditionBuilder);
    }
    const lateralSQL = buildThroughLateralSubquery(junctionTableName, junctionTableKey, targetTableName, targetAlias, leftAlias, leftToJunction, junctionToTarget, conditionBuilder, targetTableDef);
    const lateralJoinType = joinType === 'LEFT JOIN' ? 'LEFT JOIN LATERAL' : 'JOIN LATERAL';
    const joinClause = {
        type: lateralJoinType,
        table: targetTableName,
        alias: targetAlias,
        schemaKey: targetKey,
        lateralSubquery: lateralSQL
    };
    ctx.builder.addStructuredJoin(joinClause);
}
function buildThroughLateralSubquery(junctionTableName, junctionAlias, targetTableName, targetAlias, leftAlias, leftToJunction, junctionToTarget, builder, targetTableDef) {
    const parts = [];
    const internals = builder[JOIN_INTERNAL];
    const toSnake = (s) => s.replace(/[A-Z]/g, l => `_${l.toLowerCase()}`);
    parts.push('(SELECT');
    parts.push(`COALESCE(jsonb_agg(row_to_json(sub.*)), '[]'::jsonb) AS ${targetAlias}`);
    parts.push('FROM (');
    parts.push('SELECT');
    const selectedProps = internals.getSelectedColumns();
    if (selectedProps && selectedProps.length > 0) {
        const tableColumns = targetTableDef?.$columns || targetTableDef;
        const selectCols = selectedProps.map(prop => {
            const columnDef = tableColumns?.[prop];
            const sqlName = columnDef?.$columnName || toSnake(prop);
            return `"${targetAlias}"."${sqlName}" AS "${prop}"`;
        }).join(', ');
        parts.push(selectCols);
    }
    else {
        parts.push(`"${targetAlias}".*`);
    }
    parts.push(`FROM "${junctionTableName}" AS "${junctionAlias}"`);
    parts.push(`JOIN "${targetTableName}" AS "${targetAlias}" ON "${junctionAlias}"."${junctionToTarget.fromColumn}" = "${targetAlias}"."${junctionToTarget.toColumn}"`);
    let whereSQL = `"${junctionAlias}"."${leftToJunction.toColumn}" = "${leftAlias}"."${leftToJunction.fromColumn}"`;
    const userWhereSQL = internals.toWhereSQL();
    if (userWhereSQL) {
        whereSQL += ` AND ${userWhereSQL}`;
    }
    parts.push(`WHERE ${whereSQL}`);
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
    parts.push(`) AS "${targetAlias}_lateral"`);
    return parts.join(' ');
}
