"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.format = exports.convertCase = void 0;
var case_converter_1 = require("./case-converter.cjs");
Object.defineProperty(exports, "convertCase", { enumerable: true, get: function () { return case_converter_1.convertCase; } });
var pg_format_1 = require("../addon/pg-format/index.cjs");
Object.defineProperty(exports, "format", { enumerable: true, get: function () { return __importDefault(pg_format_1).default; } });
