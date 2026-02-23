"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefreshMaterializedViewBuilder = exports.DropViewBuilder = exports.CreateViewBuilder = void 0;
const pg_format_1 = __importDefault(require("../utils/pg-format.cjs"));
const relq_errors_1 = require("../errors/relq-errors.cjs");
class CreateViewBuilder {
    viewName;
    query;
    materializedFlag = false;
    withDataFlag = true;
    columnsAlias;
    __checkOption;
    securityBarrierFlag = false;
    orReplaceFlag = false;
    ifNotExistsFlag = false;
    tablespaceValue;
    withOptions = {};
    constructor(viewName) {
        this.viewName = viewName;
    }
    as(query) {
        this.query = typeof query === 'string' ? query : query.toString();
        return this;
    }
    materialized() {
        this.materializedFlag = true;
        return this;
    }
    withData() {
        this.withDataFlag = true;
        return this;
    }
    withNoData() {
        this.withDataFlag = false;
        return this;
    }
    columns(...names) {
        this.columnsAlias = names;
        return this;
    }
    checkOption(level) {
        this.__checkOption = level;
        return this;
    }
    securityBarrier() {
        this.securityBarrierFlag = true;
        return this;
    }
    orReplace() {
        this.orReplaceFlag = true;
        return this;
    }
    ifNotExists() {
        this.ifNotExistsFlag = true;
        return this;
    }
    tablespace(name) {
        this.tablespaceValue = name;
        return this;
    }
    with(options) {
        this.withOptions = { ...this.withOptions, ...options };
        return this;
    }
    toString() {
        if (!this.query) {
            throw new relq_errors_1.RelqBuilderError('View query is required', {
                builder: 'CreateViewBuilder',
                missing: 'query',
                hint: 'Use .as() method to specify the view query'
            });
        }
        let sql = 'CREATE';
        if (this.orReplaceFlag && !this.materializedFlag) {
            sql += ' OR REPLACE';
        }
        if (this.materializedFlag) {
            sql += ' MATERIALIZED';
        }
        sql += ' VIEW';
        if (this.ifNotExistsFlag) {
            sql += ' IF NOT EXISTS';
        }
        sql += ` ${pg_format_1.default.ident(this.viewName)}`;
        if (this.columnsAlias && this.columnsAlias.length > 0) {
            sql += ` (${this.columnsAlias.map(c => pg_format_1.default.ident(c)).join(', ')})`;
        }
        if (!this.materializedFlag && Object.keys(this.withOptions).length > 0) {
            const opts = Object.entries(this.withOptions)
                .map(([k, v]) => `${k} = ${typeof v === 'boolean' ? (v ? 'true' : 'false') : v}`)
                .join(', ');
            sql += ` WITH (${opts})`;
        }
        if (this.tablespaceValue && this.materializedFlag) {
            sql += ` TABLESPACE ${pg_format_1.default.ident(this.tablespaceValue)}`;
        }
        sql += ` AS ${this.query}`;
        if (this.materializedFlag) {
            sql += this.withDataFlag ? ' WITH DATA' : ' WITH NO DATA';
        }
        if (!this.materializedFlag && this.__checkOption) {
            sql += ` WITH ${this.__checkOption} CHECK OPTION`;
        }
        return sql;
    }
}
exports.CreateViewBuilder = CreateViewBuilder;
class DropViewBuilder {
    viewName;
    materializedFlag = false;
    ifExistsFlag = false;
    cascadeFlag = false;
    constructor(viewName, materialized = false) {
        this.viewName = viewName;
        this.materializedFlag = materialized;
    }
    ifExists() {
        this.ifExistsFlag = true;
        return this;
    }
    cascade() {
        this.cascadeFlag = true;
        return this;
    }
    restrict() {
        this.cascadeFlag = false;
        return this;
    }
    toString() {
        let sql = 'DROP';
        if (this.materializedFlag) {
            sql += ' MATERIALIZED';
        }
        sql += ' VIEW';
        if (this.ifExistsFlag) {
            sql += ' IF EXISTS';
        }
        sql += ` ${pg_format_1.default.ident(this.viewName)}`;
        if (this.cascadeFlag) {
            sql += ' CASCADE';
        }
        return sql;
    }
}
exports.DropViewBuilder = DropViewBuilder;
class RefreshMaterializedViewBuilder {
    viewName;
    concurrentlyFlag = false;
    withDataFlag = true;
    constructor(viewName) {
        this.viewName = viewName;
    }
    concurrently() {
        this.concurrentlyFlag = true;
        return this;
    }
    withData() {
        this.withDataFlag = true;
        return this;
    }
    withNoData() {
        this.withDataFlag = false;
        return this;
    }
    toString() {
        let sql = 'REFRESH MATERIALIZED VIEW';
        if (this.concurrentlyFlag) {
            sql += ' CONCURRENTLY';
        }
        sql += ` ${pg_format_1.default.ident(this.viewName)}`;
        if (!this.withDataFlag) {
            sql += ' WITH NO DATA';
        }
        return sql;
    }
}
exports.RefreshMaterializedViewBuilder = RefreshMaterializedViewBuilder;
