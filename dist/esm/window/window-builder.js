import format from "../utils/pg-format.js";
export class WindowBuilder {
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
            parts.push(`PARTITION BY ${this.partitionColumns.map(c => format.ident(c)).join(', ')}`);
        }
        if (this.orderColumns.length > 0) {
            parts.push(`ORDER BY ${this.orderColumns.map(o => `${format.ident(o.column)} ${o.direction}`).join(', ')}`);
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
        const def = defaultValue !== undefined ? `, ${format('%L', defaultValue)}` : '';
        return `LAG(${format.ident(column)}, ${offset}${def}) OVER (${this.toString()})`;
    }
    lead(column, offset = 1, defaultValue) {
        const def = defaultValue !== undefined ? `, ${format('%L', defaultValue)}` : '';
        return `LEAD(${format.ident(column)}, ${offset}${def}) OVER (${this.toString()})`;
    }
    firstValue(column) {
        return `FIRST_VALUE(${format.ident(column)}) OVER (${this.toString()})`;
    }
    lastValue(column) {
        return `LAST_VALUE(${format.ident(column)}) OVER (${this.toString()})`;
    }
    nthValue(column, n) {
        return `NTH_VALUE(${format.ident(column)}, ${n}) OVER (${this.toString()})`;
    }
}
