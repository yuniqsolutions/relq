import format from "../utils/pg-format.js";
export class VacuumBuilder {
    tables = [];
    columns = new Map();
    options = {};
    constructor(tables) {
        if (tables) {
            this.tables = Array.isArray(tables) ? tables : [tables];
        }
    }
    full(enable = true) {
        this.options.full = enable;
        return this;
    }
    freeze(enable = true) {
        this.options.freeze = enable;
        return this;
    }
    verbose(enable = true) {
        this.options.verbose = enable;
        return this;
    }
    analyze(enable = true) {
        this.options.analyze = enable;
        return this;
    }
    disablePageSkipping(enable = true) {
        this.options.disablePageSkipping = enable;
        return this;
    }
    skipLocked(enable = true) {
        this.options.skipLocked = enable;
        return this;
    }
    indexCleanup(value = true) {
        this.options.indexCleanup = value;
        return this;
    }
    truncate(enable = true) {
        this.options.truncate = enable;
        return this;
    }
    parallel(workers) {
        this.options.parallel = workers;
        return this;
    }
    columnsFor(table, columns) {
        this.columns.set(table, columns);
        return this;
    }
    toString() {
        const parts = [];
        if (this.options.full) {
            parts.push('FULL');
        }
        if (this.options.freeze) {
            parts.push('FREEZE');
        }
        if (this.options.verbose) {
            parts.push('VERBOSE');
        }
        if (this.options.analyze) {
            parts.push('ANALYZE');
        }
        const optionsList = [];
        if (this.options.disablePageSkipping) {
            optionsList.push('DISABLE_PAGE_SKIPPING');
        }
        if (this.options.skipLocked) {
            optionsList.push('SKIP_LOCKED');
        }
        if (this.options.indexCleanup !== undefined) {
            const value = typeof this.options.indexCleanup === 'boolean'
                ? (this.options.indexCleanup ? 'ON' : 'OFF')
                : this.options.indexCleanup;
            optionsList.push(`INDEX_CLEANUP ${value}`);
        }
        if (this.options.truncate !== undefined) {
            optionsList.push(`TRUNCATE ${this.options.truncate ? 'ON' : 'OFF'}`);
        }
        if (this.options.parallel !== undefined) {
            optionsList.push(`PARALLEL ${this.options.parallel}`);
        }
        let sql = 'VACUUM';
        if (parts.length > 0) {
            sql += ' ' + parts.join(' ');
        }
        if (optionsList.length > 0) {
            sql += ` (${optionsList.join(', ')})`;
        }
        if (this.tables.length > 0) {
            const tableStrs = this.tables.map(table => {
                let tableStr = format.ident(table);
                if (this.columns.has(table)) {
                    const cols = this.columns.get(table);
                    tableStr += ` (${cols.map(c => format.ident(c)).join(', ')})`;
                }
                return tableStr;
            });
            sql += ' ' + tableStrs.join(', ');
        }
        return sql;
    }
}
export class AnalyzeBuilder {
    tables = [];
    columnsMap = new Map();
    verboseFlag = false;
    skipLockedFlag = false;
    constructor(tables) {
        if (tables) {
            this.tables = Array.isArray(tables) ? tables : [tables];
        }
    }
    verbose(enable = true) {
        this.verboseFlag = enable;
        return this;
    }
    skipLocked(enable = true) {
        this.skipLockedFlag = enable;
        return this;
    }
    columns(columns) {
        if (this.tables.length > 0) {
            this.columnsMap.set(this.tables[0], columns);
        }
        return this;
    }
    columnsFor(table, columns) {
        this.columnsMap.set(table, columns);
        return this;
    }
    toString() {
        let sql = 'ANALYZE';
        if (this.verboseFlag) {
            sql += ' VERBOSE';
        }
        const options = [];
        if (this.skipLockedFlag) {
            options.push('SKIP_LOCKED');
        }
        if (options.length > 0) {
            sql += ` (${options.join(', ')})`;
        }
        if (this.tables.length > 0) {
            const tableStrs = this.tables.map(table => {
                let tableStr = format.ident(table);
                if (this.columnsMap.has(table)) {
                    const cols = this.columnsMap.get(table);
                    tableStr += ` (${cols.map(c => format.ident(c)).join(', ')})`;
                }
                return tableStr;
            });
            sql += ' ' + tableStrs.join(', ');
        }
        return sql;
    }
}
