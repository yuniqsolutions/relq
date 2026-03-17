"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateTrackingIds = validateTrackingIds;
exports.formatTrackingIdIssues = formatTrackingIdIssues;
const colors_1 = require("./colors.cjs");
function validateTrackingIds(schema) {
    const issues = [];
    const tableIds = new Map();
    for (const table of schema.tables) {
        if (table.partitionOf)
            continue;
        if (!table.trackingId) {
            issues.push({
                severity: 'error',
                kind: 'missing',
                entity: 'table',
                location: table.name,
                message: `Missing $id() on table "${table.name}".`,
            });
        }
        else {
            const existing = tableIds.get(table.trackingId);
            if (existing) {
                issues.push({
                    severity: 'error',
                    kind: 'duplicate',
                    entity: 'table',
                    location: table.name,
                    trackingId: table.trackingId,
                    message: `Duplicate $id("${table.trackingId}") — table "${table.name}" and "${existing}".`,
                });
            }
            else {
                tableIds.set(table.trackingId, table.name);
            }
        }
        const colIds = new Map();
        for (const col of table.columns) {
            if (!col.trackingId) {
                issues.push({
                    severity: 'error',
                    kind: 'missing',
                    entity: 'column',
                    location: `${table.name}.${col.name}`,
                    message: `Missing $id() on column "${table.name}.${col.name}".`,
                });
            }
            else {
                const existing = colIds.get(col.trackingId);
                if (existing) {
                    issues.push({
                        severity: 'error',
                        kind: 'duplicate',
                        entity: 'column',
                        location: `${table.name}.${col.name}`,
                        trackingId: col.trackingId,
                        message: `Duplicate $id("${col.trackingId}") — columns "${col.name}" and "${existing}" in table "${table.name}".`,
                    });
                }
                else {
                    colIds.set(col.trackingId, col.name);
                }
            }
        }
        const idxIds = new Map();
        for (const idx of table.indexes) {
            if (!idx.trackingId) {
                issues.push({
                    severity: 'error',
                    kind: 'missing',
                    entity: 'index',
                    location: `${table.name}.${idx.name}`,
                    message: `Missing $id() on index "${table.name}.${idx.name}".`,
                });
            }
            else {
                const existing = idxIds.get(idx.trackingId);
                if (existing) {
                    issues.push({
                        severity: 'error',
                        kind: 'duplicate',
                        entity: 'index',
                        location: `${table.name}.${idx.name}`,
                        trackingId: idx.trackingId,
                        message: `Duplicate $id("${idx.trackingId}") — indexes "${idx.name}" and "${existing}" in table "${table.name}".`,
                    });
                }
                else {
                    idxIds.set(idx.trackingId, idx.name);
                }
            }
        }
        const conIds = new Map();
        for (const con of table.constraints) {
            if (con.type === 'PRIMARY KEY' && !con.trackingId)
                continue;
            if (!con.trackingId) {
                issues.push({
                    severity: 'error',
                    kind: 'missing',
                    entity: 'constraint',
                    location: `${table.name}.${con.name}`,
                    message: `Missing $id() on constraint "${table.name}.${con.name}".`,
                });
            }
            else {
                if (colIds.has(con.trackingId))
                    continue;
                const existing = conIds.get(con.trackingId);
                if (existing) {
                    issues.push({
                        severity: 'error',
                        kind: 'duplicate',
                        entity: 'constraint',
                        location: `${table.name}.${con.name}`,
                        trackingId: con.trackingId,
                        message: `Duplicate $id("${con.trackingId}") — constraints "${con.name}" and "${existing}" in table "${table.name}".`,
                    });
                }
                else {
                    conIds.set(con.trackingId, con.name);
                }
            }
        }
    }
    return issues;
}
function formatTrackingIdIssues(issues) {
    if (issues.length === 0)
        return '';
    const missing = issues.filter(i => i.kind === 'missing');
    const duplicates = issues.filter(i => i.kind === 'duplicate');
    const lines = [];
    const total = issues.length;
    const label = total === 1 ? 'issue' : 'issues';
    lines.push(`${colors_1.colors.red('✖')}  ${colors_1.colors.bold(`Tracking ID ${label} (${total})`)}`);
    lines.push(colors_1.colors.dim('───────────────────────────────────'));
    if (duplicates.length > 0) {
        lines.push('');
        lines.push(`  ${colors_1.colors.red(`Duplicates (${duplicates.length})`)}`);
        lines.push('');
        const byTable = new Map();
        for (const d of duplicates) {
            const table = d.location.split('.')[0];
            if (!byTable.has(table))
                byTable.set(table, []);
            byTable.get(table).push(d);
        }
        for (const [table, tableIssues] of byTable) {
            lines.push(`  ${colors_1.colors.bold(table)}`);
            for (const d of tableIssues) {
                const name = d.location.includes('.') ? d.location.split('.').slice(1).join('.') : d.location;
                lines.push(`    ${colors_1.colors.red('✗')} ${d.entity} ${colors_1.colors.cyan(`"${name}"`)}  ${colors_1.colors.dim(`$id("${d.trackingId}")`)}`);
            }
        }
    }
    if (missing.length > 0) {
        lines.push('');
        lines.push(`  ${colors_1.colors.yellow(`Missing (${missing.length})`)}`);
        lines.push('');
        const byTable = new Map();
        for (const m of missing) {
            const table = m.location.split('.')[0];
            if (!byTable.has(table))
                byTable.set(table, []);
            byTable.get(table).push(m);
        }
        for (const [table, tableIssues] of byTable) {
            lines.push(`  ${colors_1.colors.bold(table)}`);
            for (const m of tableIssues) {
                const name = m.location.includes('.') ? m.location.split('.').slice(1).join('.') : m.location;
                lines.push(`    ${colors_1.colors.yellow('○')} ${m.entity} ${colors_1.colors.cyan(`"${name}"`)}`);
            }
        }
    }
    lines.push('');
    lines.push(colors_1.colors.dim('───────────────────────────────────'));
    lines.push(`  Run ${colors_1.colors.cyan('relq fix')} to auto-repair all issues.`);
    return lines.join('\n');
}
