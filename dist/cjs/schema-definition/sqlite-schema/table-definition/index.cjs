"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sqliteTableToAST = exports.quoteSQLiteIdentifier = exports.generateSQLiteIndexSQL = exports.generateSQLiteCreateTableSQL = exports.sqliteTable = void 0;
__exportStar(require("./table-types.cjs"), exports);
var table_core_1 = require("./table-core.cjs");
Object.defineProperty(exports, "sqliteTable", { enumerable: true, get: function () { return table_core_1.sqliteTable; } });
var sql_generation_1 = require("./sql-generation.cjs");
Object.defineProperty(exports, "generateSQLiteCreateTableSQL", { enumerable: true, get: function () { return sql_generation_1.generateSQLiteCreateTableSQL; } });
Object.defineProperty(exports, "generateSQLiteIndexSQL", { enumerable: true, get: function () { return sql_generation_1.generateSQLiteIndexSQL; } });
Object.defineProperty(exports, "quoteSQLiteIdentifier", { enumerable: true, get: function () { return sql_generation_1.quoteSQLiteIdentifier; } });
var ast_generation_1 = require("./ast-generation.cjs");
Object.defineProperty(exports, "sqliteTableToAST", { enumerable: true, get: function () { return ast_generation_1.sqliteTableToAST; } });
