"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pgView = pgView;
exports.pgMaterializedView = pgMaterializedView;
exports.viewToSQL = viewToSQL;
exports.materializedViewToSQL = materializedViewToSQL;
exports.dropViewSQL = dropViewSQL;
exports.dropMaterializedViewSQL = dropMaterializedViewSQL;
exports.isViewConfig = isViewConfig;
exports.isMaterializedViewConfig = isMaterializedViewConfig;
function pgView(name, definition) {
    const trimmed = definition.trim();
    return {
        $type: 'view',
        $viewName: name,
        $definition: trimmed,
        $isMaterialized: false,
        $trackingId: undefined,
        $commentText: undefined,
        name,
        definition: trimmed,
        isMaterialized: false,
        toAST() {
            return {
                name: this.$viewName,
                definition: this.$definition,
                isMaterialized: false,
                comment: this.$commentText,
                trackingId: this.$trackingId,
            };
        },
        $id(trackingId) {
            this.$trackingId = trackingId;
            return this;
        },
        $comment(comment) {
            this.$commentText = comment;
            return this;
        },
    };
}
function pgMaterializedView(name, definition, options) {
    const trimmed = definition.trim();
    return {
        $type: 'materialized_view',
        $viewName: name,
        $definition: trimmed,
        $isMaterialized: true,
        $withData: options?.withData,
        $trackingId: undefined,
        $commentText: undefined,
        name,
        definition: trimmed,
        isMaterialized: true,
        withData: options?.withData,
        toAST() {
            return {
                name: this.$viewName,
                definition: this.$definition,
                isMaterialized: true,
                withData: this.$withData,
                comment: this.$commentText,
                trackingId: this.$trackingId,
            };
        },
        $id(trackingId) {
            this.$trackingId = trackingId;
            return this;
        },
        $comment(comment) {
            this.$commentText = comment;
            return this;
        },
    };
}
function viewToSQL(view) {
    const viewName = view.$viewName || view.name;
    const def = view.$definition || view.definition;
    let sql = `CREATE OR REPLACE VIEW "${viewName}" AS\n${def};`;
    if (view.$commentText) {
        const escaped = view.$commentText.replace(/'/g, "''");
        sql += `\n\nCOMMENT ON VIEW "${viewName}" IS '${escaped}';`;
    }
    return sql;
}
function materializedViewToSQL(view) {
    const viewName = view.$viewName || view.name;
    const def = view.$definition || view.definition;
    const withData = (view.$withData ?? view.withData) !== false ? ' WITH DATA' : ' WITH NO DATA';
    let sql = `CREATE MATERIALIZED VIEW IF NOT EXISTS "${viewName}" AS\n${def}${withData};`;
    if (view.$commentText) {
        const escaped = view.$commentText.replace(/'/g, "''");
        sql += `\n\nCOMMENT ON MATERIALIZED VIEW "${viewName}" IS '${escaped}';`;
    }
    return sql;
}
function dropViewSQL(view, ifExists = true) {
    const viewName = view.$viewName || view.name;
    return `DROP VIEW ${ifExists ? 'IF EXISTS ' : ''}"${viewName}"`;
}
function dropMaterializedViewSQL(view, ifExists = true) {
    const viewName = view.$viewName || view.name;
    return `DROP MATERIALIZED VIEW ${ifExists ? 'IF EXISTS ' : ''}"${viewName}"`;
}
function isViewConfig(value) {
    return (typeof value === 'object' &&
        value !== null &&
        '$type' in value &&
        value.$type === 'view');
}
function isMaterializedViewConfig(value) {
    return (typeof value === 'object' &&
        value !== null &&
        '$type' in value &&
        value.$type === 'materialized_view');
}
