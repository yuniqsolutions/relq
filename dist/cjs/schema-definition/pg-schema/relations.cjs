"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.one = one;
exports.many = many;
exports.manyToMany = manyToMany;
exports.defineRelations = defineRelations;
exports.getJoinCondition = getJoinCondition;
exports.generateJoinSQL = generateJoinSQL;
let deprecationWarningShown = false;
function showDeprecationWarning(functionName) {
    if (!deprecationWarningShown && typeof console !== 'undefined') {
        console.warn(`[Relq Deprecation Warning] The "${functionName}" function from "relations.ts" is deprecated. ` +
            `Please migrate to the new "pgRelations" API from "pg-relations.ts". ` +
            `See documentation for migration guide.`);
        deprecationWarningShown = true;
    }
}
function one(from, to, options) {
    showDeprecationWarning('one');
    const foreignKey = options?.foreignKey || `${to.$name}_id`;
    const references = options?.references || findPrimaryKey(to) || 'id';
    return {
        $type: 'one',
        $from: from,
        $to: to,
        $foreignKey: foreignKey,
        $references: references,
    };
}
function many(from, to, options) {
    showDeprecationWarning('many');
    const foreignKey = options?.foreignKey || `${from.$name}_id`;
    const references = options?.references || findPrimaryKey(from) || 'id';
    return {
        $type: 'many',
        $from: from,
        $to: to,
        $foreignKey: foreignKey,
        $references: references,
    };
}
function manyToMany(from, to, through, options) {
    showDeprecationWarning('manyToMany');
    const fromKey = options?.fromKey || findPrimaryKey(from) || 'id';
    const toKey = options?.toKey || findPrimaryKey(to) || 'id';
    const throughFromKey = options?.throughFromKey || `${from.$name}_id`;
    const throughToKey = options?.throughToKey || `${to.$name}_id`;
    return {
        $type: 'manyToMany',
        $from: from,
        $to: to,
        $foreignKey: fromKey,
        $references: toKey,
        $through: through,
        $throughFromKey: throughFromKey,
        $throughToKey: throughToKey,
    };
}
function findPrimaryKey(table) {
    if (table.$primaryKey && table.$primaryKey.length === 1) {
        return table.$primaryKey[0];
    }
    for (const [colName, colConfig] of Object.entries(table.$columns)) {
        if (colConfig.$primaryKey) {
            return colName;
        }
    }
    return undefined;
}
function defineRelations(config) {
    showDeprecationWarning('defineRelations');
    return {
        tables: config.tables,
        relations: config.relations(config.tables),
    };
}
function getJoinCondition(relation) {
    if (relation.$type === 'manyToMany' && relation.$through) {
        return {
            type: 'manyToMany',
            from: { table: relation.$from.$name, column: relation.$foreignKey },
            to: { table: relation.$to.$name, column: relation.$references },
            through: {
                table: relation.$through.$name,
                fromColumn: relation.$throughFromKey,
                toColumn: relation.$throughToKey,
            },
        };
    }
    return {
        type: relation.$type,
        from: { table: relation.$from.$name, column: relation.$foreignKey },
        to: { table: relation.$to.$name, column: relation.$references },
    };
}
function generateJoinSQL(relation, fromAlias, toAlias) {
    const from = fromAlias || relation.$from.$name;
    const to = toAlias || relation.$to.$name;
    if (relation.$type === 'manyToMany' && relation.$through) {
        const throughTable = relation.$through.$name;
        const throughAlias = `${throughTable}_join`;
        return [
            `JOIN "${throughTable}" AS "${throughAlias}" ON "${from}"."${relation.$foreignKey}" = "${throughAlias}"."${relation.$throughFromKey}"`,
            `JOIN "${relation.$to.$name}" AS "${to}" ON "${throughAlias}"."${relation.$throughToKey}" = "${to}"."${relation.$references}"`,
        ].join('\n');
    }
    if (relation.$type === 'one') {
        return `JOIN "${relation.$to.$name}" AS "${to}" ON "${from}"."${relation.$foreignKey}" = "${to}"."${relation.$references}"`;
    }
    return `JOIN "${relation.$to.$name}" AS "${to}" ON "${to}"."${relation.$foreignKey}" = "${from}"."${relation.$references}"`;
}
