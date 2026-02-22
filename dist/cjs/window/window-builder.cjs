"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WindowBuilder = void 0;
const pg_format_1 = __importDefault(require("../utils/pg-format.cjs"));
class WindowBuilder {
    partitionColumns = [];
    orderColumns = [];
    frameStart;
    frameEnd;
    frameMode;
    partitionBy(...columns) {
        this.partitionColumns.push(...columns);
        return this;
    }
    orderBy(column, direction = 'ASC') {
        this.orderColumns.push({ column, direction });
        return this;
    }
    rows(start, end) {
        this.frameMode = 'ROWS';
        this.frameStart = typeof start === 'number' ? `${start} PRECEDING` : start;
        this.frameEnd = end ? (typeof end === 'number' ? `${end} FOLLOWING` : end) : 'CURRENT ROW';
        return this;
    }
    range(start, end) {
        this.frameMode = 'RANGE';
        this.frameStart = typeof start === 'number' ? `${start} PRECEDING` : start;
        this.frameEnd = end ? (typeof end === 'number' ? `${end} FOLLOWING` : end) : 'CURRENT ROW';
        return this;
    }
    groups(start, end) {
        this.frameMode = 'GROUPS';
        this.frameStart = typeof start === 'number' ? `${start} PRECEDING` : start;
        this.frameEnd = end ? (typeof end === 'number' ? `${end} FOLLOWING` : end) : 'CURRENT ROW';
        return this;
    }
    toString() {
        const parts = [];
        if (this.partitionColumns.length > 0) {
            parts.push(`PARTITION BY ${this.partitionColumns.map(c => pg_format_1.default.ident(c)).join(', ')}`);
        }
        if (this.orderColumns.length > 0) {
            parts.push(`ORDER BY ${this.orderColumns.map(o => `${pg_format_1.default.ident(o.column)} ${o.direction}`).join(', ')}`);
        }
        if (this.frameMode && this.frameStart) {
            parts.push(`${this.frameMode} BETWEEN ${this.frameStart} AND ${this.frameEnd}`);
        }
        return parts.join(' ');
    }
    rowNumber() {
        return `ROW_NUMBER() OVER (${this.toString()})`;
    }
    rank() {
        return `RANK() OVER (${this.toString()})`;
    }
    denseRank() {
        return `DENSE_RANK() OVER (${this.toString()})`;
    }
    lag(column, offset = 1, defaultValue) {
        const def = defaultValue !== undefined ? `, ${(0, pg_format_1.default)('%L', defaultValue)}` : '';
        return `LAG(${pg_format_1.default.ident(column)}, ${offset}${def}) OVER (${this.toString()})`;
    }
    lead(column, offset = 1, defaultValue) {
        const def = defaultValue !== undefined ? `, ${(0, pg_format_1.default)('%L', defaultValue)}` : '';
        return `LEAD(${pg_format_1.default.ident(column)}, ${offset}${def}) OVER (${this.toString()})`;
    }
    firstValue(column) {
        return `FIRST_VALUE(${pg_format_1.default.ident(column)}) OVER (${this.toString()})`;
    }
    lastValue(column) {
        return `LAST_VALUE(${pg_format_1.default.ident(column)}) OVER (${this.toString()})`;
    }
    nthValue(column, n) {
        return `NTH_VALUE(${pg_format_1.default.ident(column)}, ${n}) OVER (${this.toString()})`;
    }
}
exports.WindowBuilder = WindowBuilder;
