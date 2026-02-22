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
exports.SQLITE_DEFAULT = exports.quoteSQLiteIdentifier = exports.generateSQLiteIndexSQL = exports.generateSQLiteCreateTableSQL = exports.sqliteTable = void 0;
__exportStar(require("./column-types/index.cjs"), exports);
var table_definition_1 = require("./table-definition/index.cjs");
Object.defineProperty(exports, "sqliteTable", { enumerable: true, get: function () { return table_definition_1.sqliteTable; } });
var table_definition_2 = require("./table-definition/index.cjs");
Object.defineProperty(exports, "generateSQLiteCreateTableSQL", { enumerable: true, get: function () { return table_definition_2.generateSQLiteCreateTableSQL; } });
Object.defineProperty(exports, "generateSQLiteIndexSQL", { enumerable: true, get: function () { return table_definition_2.generateSQLiteIndexSQL; } });
Object.defineProperty(exports, "quoteSQLiteIdentifier", { enumerable: true, get: function () { return table_definition_2.quoteSQLiteIdentifier; } });
var defaults_1 = require("./defaults.cjs");
Object.defineProperty(exports, "SQLITE_DEFAULT", { enumerable: true, get: function () { return defaults_1.SQLITE_DEFAULT; } });
