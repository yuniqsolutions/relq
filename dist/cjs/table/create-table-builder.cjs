"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateTableBuilder = void 0;
const pg_format_1 = __importDefault(require("../utils/pg-format.cjs"));
const constraint_builder_1 = require("./constraint-builder.cjs");
const partition_builder_1 = require("./partition-builder.cjs");
const create_index_builder_1 = require("../indexing/create-index-builder.cjs");
const relq_errors_1 = require("../errors/relq-errors.cjs");
class CreateTableBuilder {
    tableName;
    columns = new Map();
    constraintBuilder = new constraint_builder_1.ConstraintBuilder();
    partitionBuilder;
    indexes = [];
    inheritsFrom = [];
    withOptions = {};
    tablespaceValue;
    ifNotExistsFlag = false;
    temporaryFlag = false;
    unloggedFlag = false;
    constructor(tableName) {
        this.tableName = tableName;
    }
    setColumns(columns) {
        Object.entries(columns).forEach(([name, def]) => {
            this.columns.set(name, def);
        });
        return this;
    }
    addColumn(name, definition) {
        this.columns.set(name, definition);
        return this;
    }
    addPrimaryKey(columns, name) {
        this.constraintBuilder.addPrimaryKey(columns, name);
        return this;
    }
    addForeignKey(config) {
        this.constraintBuilder.addForeignKey(config);
        return this;
    }
    addUnique(columns, name) {
        this.constraintBuilder.addUnique(columns, name);
        return this;
    }
    addCheck(condition, name) {
        this.constraintBuilder.addCheck(condition, name);
        return this;
    }
    addExclusion(constraint, using, name) {
        this.constraintBuilder.addExclusion(constraint, using, name);
        return this;
    }
    addIndex(name, callback) {
        const indexBuilder = new create_index_builder_1.CreateIndexBuilder(this.tableName, name);
        callback(indexBuilder);
        this.indexes.push({ name, builder: indexBuilder });
        return this;
    }
    partitionBy(strategy, columns) {
        this.partitionBuilder = new partition_builder_1.PartitionBuilder();
        const cols = Array.isArray(columns) ? columns : [columns];
        if (strategy === 'RANGE') {
            this.partitionBuilder.range(...cols);
        }
        else if (strategy === 'LIST') {
            this.partitionBuilder.list(cols[0]);
        }
        else {
            this.partitionBuilder.hash(cols[0]);
        }
        return this;
    }
    inherits(...parentTables) {
        this.inheritsFrom.push(...parentTables);
        return this;
    }
    with(options) {
        this.withOptions = { ...this.withOptions, ...options };
        return this;
    }
    tablespace(name) {
        this.tablespaceValue = name;
        return this;
    }
    ifNotExists() {
        this.ifNotExistsFlag = true;
        return this;
    }
    temporary() {
        this.temporaryFlag = true;
        return this;
    }
    unlogged() {
        this.unloggedFlag = true;
        return this;
    }
    fillfactor(percent) {
        this.withOptions.fillfactor = percent;
        return this;
    }
    parallelWorkers(count) {
        this.withOptions.parallel_workers = count;
        return this;
    }
    autovacuum(enabled, options) {
        this.withOptions.autovacuum_enabled = enabled;
        if (options) {
            if (options.vacuumThreshold !== undefined) {
                this.withOptions.autovacuum_vacuum_threshold = options.vacuumThreshold;
            }
            if (options.analyzeThreshold !== undefined) {
                this.withOptions.autovacuum_analyze_threshold = options.analyzeThreshold;
            }
            if (options.vacuumScaleFactor !== undefined) {
                this.withOptions.autovacuum_vacuum_scale_factor = options.vacuumScaleFactor;
            }
            if (options.analyzeScaleFactor !== undefined) {
                this.withOptions.autovacuum_analyze_scale_factor = options.analyzeScaleFactor;
            }
        }
        return this;
    }
    buildColumnSQL(name, def) {
        if (typeof def === 'string') {
            return `${pg_format_1.default.ident(name)} ${def}`;
        }
        let sql = pg_format_1.default.ident(name);
        sql += ` ${def.type}`;
        if (def.collation) {
            sql += ` COLLATE ${pg_format_1.default.ident(def.collation)}`;
        }
        if (def.nullable === false) {
            sql += ' NOT NULL';
        }
        else if (def.nullable === true) {
            sql += ' NULL';
        }
        if (def.default !== undefined) {
            if (typeof def.default === 'string' &&
                (def.default.toUpperCase().includes('NOW()') ||
                    def.default.toUpperCase().includes('CURRENT_'))) {
                sql += ` DEFAULT ${def.default}`;
            }
            else {
                sql += ` DEFAULT ${(0, pg_format_1.default)('%L', def.default)}`;
            }
        }
        if (def.generated) {
            sql += def.generated.always ? ' GENERATED ALWAYS' : ' GENERATED BY DEFAULT';
            sql += ` AS (${def.generated.expression}) STORED`;
        }
        if (def.identity) {
            sql += def.identity.always ? ' GENERATED ALWAYS AS IDENTITY' : ' GENERATED BY DEFAULT AS IDENTITY';
            const identityOpts = [];
            if (def.identity.start !== undefined)
                identityOpts.push(`START WITH ${def.identity.start}`);
            if (def.identity.increment !== undefined)
                identityOpts.push(`INCREMENT BY ${def.identity.increment}`);
            if (def.identity.minValue !== undefined)
                identityOpts.push(`MINVALUE ${def.identity.minValue}`);
            if (def.identity.maxValue !== undefined)
                identityOpts.push(`MAXVALUE ${def.identity.maxValue}`);
            if (def.identity.cycle)
                identityOpts.push('CYCLE');
            if (identityOpts.length > 0) {
                sql += ` (${identityOpts.join(' ')})`;
            }
        }
        if (def.primaryKey) {
            sql += ' PRIMARY KEY';
        }
        if (def.unique) {
            sql += ' UNIQUE';
        }
        if (def.check) {
            sql += ` CHECK (${def.check})`;
        }
        if (def.references) {
            sql += ` REFERENCES ${pg_format_1.default.ident(def.references.table)}(${pg_format_1.default.ident(def.references.column)})`;
            if (def.references.onDelete) {
                sql += ` ON DELETE ${def.references.onDelete}`;
            }
            if (def.references.onUpdate) {
                sql += ` ON UPDATE ${def.references.onUpdate}`;
            }
        }
        if (def.storage) {
            sql += ` STORAGE ${def.storage}`;
        }
        if (def.compression) {
            sql += ` COMPRESSION ${def.compression}`;
        }
        return sql;
    }
    toString() {
        if (this.columns.size === 0) {
            throw new relq_errors_1.RelqBuilderError('Table must have at least one column', { builder: 'CreateTableBuilder', missing: 'columns', hint: 'Use .setColumns() or .addColumn()' });
        }
        let sql = 'CREATE';
        if (this.temporaryFlag) {
            sql += ' TEMPORARY';
        }
        if (this.unloggedFlag) {
            sql += ' UNLOGGED';
        }
        sql += ' TABLE';
        if (this.ifNotExistsFlag) {
            sql += ' IF NOT EXISTS';
        }
        sql += ` ${pg_format_1.default.ident(this.tableName)}`;
        const columnDefs = [];
        this.columns.forEach((def, name) => {
            columnDefs.push(this.buildColumnSQL(name, def));
        });
        const constraints = this.constraintBuilder.buildAllConstraintsSQL();
        sql += ` (${[...columnDefs, ...constraints].join(', ')})`;
        if (this.inheritsFrom.length > 0) {
            sql += ` INHERITS (${this.inheritsFrom.map(t => pg_format_1.default.ident(t)).join(', ')})`;
        }
        if (this.partitionBuilder) {
            sql += this.partitionBuilder.buildPartitionBySQL();
        }
        if (Object.keys(this.withOptions).length > 0) {
            const options = Object.entries(this.withOptions)
                .map(([key, value]) => `${key} = ${typeof value === 'boolean' ? (value ? 'on' : 'off') : value}`)
                .join(', ');
            sql += ` WITH (${options})`;
        }
        if (this.tablespaceValue) {
            sql += ` TABLESPACE ${pg_format_1.default.ident(this.tablespaceValue)}`;
        }
        return sql;
    }
    getIndexSQL() {
        return this.indexes.map(({ builder }) => builder.toString());
    }
    toFullSQL() {
        return {
            table: this.toString(),
            indexes: this.getIndexSQL()
        };
    }
}
exports.CreateTableBuilder = CreateTableBuilder;
