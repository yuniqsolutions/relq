"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pgView = pgView;
exports.pgMaterializedView = pgMaterializedView;
exports.viewToSQL = viewToSQL;
exports.materializedViewToSQL = materializedViewToSQL;
function pgView(name, definition) {
    return {
        $type: 'view',
        name,
        definition: definition.trim(),
        isMaterialized: false,
        toAST() {
            return {
                name: this.name,
                definition: this.definition,
                isMaterialized: false,
                trackingId: this.$trackingId,
            };
        },
    };
}
function pgMaterializedView(name, definition, options) {
    return {
        $type: 'materialized_view',
        name,
        definition: definition.trim(),
        isMaterialized: true,
        withData: options?.withData,
        toAST() {
            return {
                name: this.name,
                definition: this.definition,
                isMaterialized: true,
                withData: this.withData,
                trackingId: this.$trackingId,
            };
        },
    };
}
function viewToSQL(view) {
    return `CREATE OR REPLACE VIEW "${view.name}" AS\n${view.definition};`;
}
function materializedViewToSQL(view) {
    const withData = view.withData !== false ? ' WITH DATA' : ' WITH NO DATA';
    return `CREATE MATERIALIZED VIEW IF NOT EXISTS "${view.name}" AS\n${view.definition}${withData};`;
}
