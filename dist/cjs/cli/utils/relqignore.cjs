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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePattern = parsePattern;
exports.loadRelqignore = loadRelqignore;
exports.createDefaultRelqignore = createDefaultRelqignore;
exports.isIgnored = isIgnored;
exports.isTableIgnored = isTableIgnored;
exports.isColumnIgnored = isColumnIgnored;
exports.isIndexIgnored = isIndexIgnored;
exports.isConstraintIgnored = isConstraintIgnored;
exports.isTriggerIgnored = isTriggerIgnored;
exports.isEnumIgnored = isEnumIgnored;
exports.isDomainIgnored = isDomainIgnored;
exports.isSequenceIgnored = isSequenceIgnored;
exports.isCompositeTypeIgnored = isCompositeTypeIgnored;
exports.isFunctionIgnored = isFunctionIgnored;
exports.isViewIgnored = isViewIgnored;
exports.validateIgnoreDependencies = validateIgnoreDependencies;
exports.filterTables = filterTables;
exports.filterColumns = filterColumns;
exports.filterIndexes = filterIndexes;
exports.filterEnums = filterEnums;
exports.filterDomains = filterDomains;
exports.getIgnorePatterns = getIgnorePatterns;
exports.filterIgnored = filterIgnored;
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const REQUIRES_PARENT = [
    'COLUMN', 'INDEX', 'CONSTRAINT', 'CHECK', 'PRIMARY_KEY',
    'FOREIGN_KEY', 'EXCLUSION', 'PARTITION', 'TRIGGER'
];
const DEFAULT_PATTERNS = [
    'TABLE:_relq_*',
    'TABLE:__relq_*',
    'TABLE:_kuery_*',
    'TABLE:__kuery_*',
    'TABLE:pg_*',
    'TABLE:_temp_*',
    'TABLE:tmp_*',
];
function parsePattern(line) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
        return null;
    }
    let negated = false;
    let pattern = trimmed;
    if (pattern.startsWith('!')) {
        negated = true;
        pattern = pattern.slice(1);
    }
    const colonIndex = pattern.indexOf(':');
    if (colonIndex > 0) {
        const typeStr = pattern.slice(0, colonIndex).toUpperCase();
        const rest = pattern.slice(colonIndex + 1);
        const validTypes = [
            'TABLE', 'COLUMN', 'INDEX', 'CONSTRAINT', 'CHECK', 'PRIMARY_KEY',
            'FOREIGN_KEY', 'EXCLUSION', 'PARTITION', 'ENUM', 'DOMAIN', 'SEQUENCE',
            'COMPOSITE_TYPE', 'FUNCTION', 'PROCEDURE', 'TRIGGER', 'VIEW',
            'MATERIALIZED_VIEW', 'FOREIGN_TABLE', 'EXTENSION', 'COLLATION'
        ];
        if (validTypes.includes(typeStr)) {
            const type = typeStr;
            if (REQUIRES_PARENT.includes(type)) {
                const dotIndex = rest.indexOf('.');
                if (dotIndex > 0) {
                    return {
                        type,
                        parent: rest.slice(0, dotIndex),
                        pattern: rest.slice(dotIndex + 1),
                        negated,
                        raw: trimmed,
                    };
                }
                else {
                    console.warn(`Warning: ${type} pattern requires table name (e.g., ${type}:table_name.pattern)`);
                    return null;
                }
            }
            else {
                return {
                    type,
                    parent: null,
                    pattern: rest,
                    negated,
                    raw: trimmed,
                };
            }
        }
    }
    return {
        type: 'TABLE',
        parent: null,
        pattern,
        negated,
        raw: trimmed,
    };
}
function loadRelqignore(projectRoot = process.cwd()) {
    const ignorePath = path.join(projectRoot, '.relqignore');
    const patterns = [];
    for (const defaultPattern of DEFAULT_PATTERNS) {
        const parsed = parsePattern(defaultPattern);
        if (parsed)
            patterns.push(parsed);
    }
    if (fs.existsSync(ignorePath)) {
        const content = fs.readFileSync(ignorePath, 'utf-8');
        const lines = content.split('\n');
        for (const line of lines) {
            const parsed = parsePattern(line);
            if (parsed)
                patterns.push(parsed);
        }
    }
    return patterns;
}
function createDefaultRelqignore(projectRoot = process.cwd()) {
    const ignorePath = path.join(projectRoot, '.relqignore');
    if (fs.existsSync(ignorePath)) {
        return;
    }
    const content = `# Relq Ignore File
# Objects matching these patterns will be ignored in import/export/add/commit

# =============================================================================
# PATTERN FORMAT
# =============================================================================
# TYPE:pattern              - Match specific object type
# TYPE:table.pattern        - Match sub-objects (columns, indexes, etc.)
# pattern                   - Match tables (backward compatible)
# !pattern                  - Negate (un-ignore) a pattern

# =============================================================================
# TYPES
# =============================================================================
# TABLE, COLUMN, INDEX, CONSTRAINT, CHECK, PRIMARY_KEY, FOREIGN_KEY, EXCLUSION
# PARTITION, ENUM, DOMAIN, SEQUENCE, COMPOSITE_TYPE, FUNCTION, PROCEDURE
# TRIGGER, VIEW, MATERIALIZED_VIEW, FOREIGN_TABLE, EXTENSION, COLLATION

# =============================================================================
# DEFAULT PATTERNS (always applied)
# =============================================================================
# TABLE:_relq_*          - Relq internal tables
# TABLE:pg_*             - PostgreSQL system tables
# TABLE:_temp_*          - Temporary tables
# TABLE:tmp_*            - Temporary tables

# =============================================================================
# EXAMPLES
# =============================================================================

# Ignore specific tables
# TABLE:debug_*
# TABLE:test_*

# Ignore sensitive columns (table.column format required)
# COLUMN:users.password_hash
# COLUMN:*.api_key

# Ignore temporary indexes
# INDEX:*.idx_temp_*

# Ignore debug functions
# FUNCTION:debug_*

# Ignore internal triggers
# TRIGGER:audit_logs.*

# Ignore test enums
# ENUM:test_*
`;
    fs.writeFileSync(ignorePath, content, 'utf-8');
}
function matchGlob(name, pattern) {
    const regexPattern = pattern
        .replace(/[.+^${}()|[\]\\]/g, '\\$&')
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.');
    const regex = new RegExp(`^${regexPattern}$`, 'i');
    return regex.test(name);
}
function isIgnored(objectType, objectName, parentName, patterns) {
    let isIgnored = false;
    let matchedPattern;
    for (const pattern of patterns) {
        if (pattern.type !== null && pattern.type !== objectType) {
            continue;
        }
        if (pattern.parent !== null) {
            if (parentName === null || !matchGlob(parentName, pattern.parent)) {
                continue;
            }
        }
        if (matchGlob(objectName, pattern.pattern)) {
            if (pattern.negated) {
                isIgnored = false;
                matchedPattern = pattern;
            }
            else {
                isIgnored = true;
                matchedPattern = pattern;
            }
        }
    }
    return {
        ignored: isIgnored,
        pattern: matchedPattern,
        reason: matchedPattern ? `Matched pattern: ${matchedPattern.raw}` : undefined,
    };
}
function isTableIgnored(tableName, patterns) {
    return isIgnored('TABLE', tableName, null, patterns);
}
function isColumnIgnored(tableName, columnName, patterns) {
    return isIgnored('COLUMN', columnName, tableName, patterns);
}
function isIndexIgnored(tableName, indexName, patterns) {
    return isIgnored('INDEX', indexName, tableName, patterns);
}
function isConstraintIgnored(tableName, constraintName, patterns) {
    return isIgnored('CONSTRAINT', constraintName, tableName, patterns);
}
function isTriggerIgnored(tableName, triggerName, patterns) {
    return isIgnored('TRIGGER', triggerName, tableName, patterns);
}
function isEnumIgnored(enumName, patterns) {
    return isIgnored('ENUM', enumName, null, patterns);
}
function isDomainIgnored(domainName, patterns) {
    return isIgnored('DOMAIN', domainName, null, patterns);
}
function isSequenceIgnored(sequenceName, patterns) {
    return isIgnored('SEQUENCE', sequenceName, null, patterns);
}
function isCompositeTypeIgnored(typeName, patterns) {
    return isIgnored('COMPOSITE_TYPE', typeName, null, patterns);
}
function isFunctionIgnored(functionName, patterns) {
    return isIgnored('FUNCTION', functionName, null, patterns);
}
function isViewIgnored(viewName, patterns) {
    return isIgnored('VIEW', viewName, null, patterns);
}
function validateIgnoreDependencies(schema, patterns) {
    const errors = [];
    const ignoredEnums = new Set();
    const ignoredDomains = new Set();
    const ignoredSequences = new Set();
    const ignoredComposites = new Set();
    for (const e of schema.enums) {
        if (isEnumIgnored(e.name, patterns).ignored) {
            ignoredEnums.add(e.name.toLowerCase());
        }
    }
    for (const d of schema.domains) {
        if (isDomainIgnored(d.name, patterns).ignored) {
            ignoredDomains.add(d.name.toLowerCase());
        }
    }
    for (const s of schema.sequences) {
        if (isSequenceIgnored(s.name, patterns).ignored) {
            ignoredSequences.add(s.name.toLowerCase());
        }
    }
    for (const c of schema.compositeTypes) {
        if (isCompositeTypeIgnored(c.name, patterns).ignored) {
            ignoredComposites.add(c.name.toLowerCase());
        }
    }
    for (const table of schema.tables) {
        if (isTableIgnored(table.name, patterns).ignored) {
            continue;
        }
        for (const column of table.columns) {
            if (isColumnIgnored(table.name, column.name, patterns).ignored) {
                continue;
            }
            const typeLower = column.type.toLowerCase().replace(/\[\]$/, '');
            if (ignoredEnums.has(typeLower)) {
                errors.push({
                    type: 'ENUM',
                    name: column.type,
                    usedBy: { table: table.name, column: column.name },
                    message: `Column "${table.name}.${column.name}" uses ignored ENUM "${column.type}". Either un-ignore the ENUM or ignore this column.`,
                });
            }
            if (ignoredDomains.has(typeLower)) {
                errors.push({
                    type: 'DOMAIN',
                    name: column.type,
                    usedBy: { table: table.name, column: column.name },
                    message: `Column "${table.name}.${column.name}" uses ignored DOMAIN "${column.type}". Either un-ignore the DOMAIN or ignore this column.`,
                });
            }
            if (ignoredComposites.has(typeLower)) {
                errors.push({
                    type: 'COMPOSITE_TYPE',
                    name: column.type,
                    usedBy: { table: table.name, column: column.name },
                    message: `Column "${table.name}.${column.name}" uses ignored COMPOSITE_TYPE "${column.type}". Either un-ignore the type or ignore this column.`,
                });
            }
            if (column.default) {
                const seqMatch = column.default.match(/nextval\(['"]?([^'"()]+)['"]?/i);
                if (seqMatch) {
                    const seqName = seqMatch[1].toLowerCase().replace(/::regclass$/, '');
                    if (ignoredSequences.has(seqName)) {
                        errors.push({
                            type: 'SEQUENCE',
                            name: seqMatch[1],
                            usedBy: { table: table.name, column: column.name },
                            message: `Column "${table.name}.${column.name}" uses ignored SEQUENCE "${seqMatch[1]}". Either un-ignore the SEQUENCE or ignore this column.`,
                        });
                    }
                }
            }
        }
    }
    return errors;
}
function filterTables(tables, patterns) {
    return tables.filter(t => !isTableIgnored(t.name, patterns).ignored);
}
function filterColumns(tableName, columns, patterns) {
    return columns.filter(c => !isColumnIgnored(tableName, c.name, patterns).ignored);
}
function filterIndexes(tableName, indexes, patterns) {
    return indexes.filter(i => !isIndexIgnored(tableName, i.name, patterns).ignored);
}
function filterEnums(enums, patterns) {
    return enums.filter(e => !isEnumIgnored(e.name, patterns).ignored);
}
function filterDomains(domains, patterns) {
    return domains.filter(d => !isDomainIgnored(d.name, patterns).ignored);
}
function getIgnorePatterns(projectRoot = process.cwd()) {
    return loadRelqignore(projectRoot);
}
function filterIgnored(items, patterns) {
    return items.filter(item => !isTableIgnored(item.name, patterns).ignored);
}
