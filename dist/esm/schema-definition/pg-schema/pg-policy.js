function getTableName(table) {
    if (typeof table === 'string') {
        return table;
    }
    if (typeof table === 'object' && table !== null) {
        if ('$name' in table) {
            return table.$name;
        }
        if ('$tableName' in table) {
            return table.$tableName;
        }
        if ('name' in table) {
            return table.name;
        }
    }
    throw new Error('Invalid table reference in policy definition');
}
export function generatePolicySQL(config) {
    const { $policyName, $options, $commentText } = config;
    const { on, for: command = 'ALL', permissive = true, to, using, withCheck, comment, } = $options;
    const tableName = getTableName(on);
    const parts = [];
    parts.push(`CREATE POLICY "${$policyName}"`);
    parts.push(`\n    ON "${tableName}"`);
    if (!permissive) {
        parts.push('\n    AS RESTRICTIVE');
    }
    if (command !== 'ALL') {
        parts.push(`\n    FOR ${command}`);
    }
    if (to && to.length > 0) {
        parts.push(`\n    TO ${to.join(', ')}`);
    }
    if (using) {
        parts.push(`\n    USING (${using})`);
    }
    if (withCheck) {
        parts.push(`\n    WITH CHECK (${withCheck})`);
    }
    let sql = parts.join('');
    const commentText = $commentText || comment;
    if (commentText) {
        const escaped = commentText.replace(/'/g, "''");
        sql += `;\n\nCOMMENT ON POLICY "${$policyName}" ON "${tableName}" IS '${escaped}'`;
    }
    return sql;
}
export function dropPolicySQL(config, ifExists = true) {
    const { $policyName, $options } = config;
    const tableName = getTableName($options.on);
    return `DROP POLICY ${ifExists ? 'IF EXISTS ' : ''}"${$policyName}" ON "${tableName}"`;
}
export function enableRlsSQL(tableName) {
    return `ALTER TABLE "${tableName}" ENABLE ROW LEVEL SECURITY`;
}
export function forceRlsSQL(tableName) {
    return `ALTER TABLE "${tableName}" FORCE ROW LEVEL SECURITY`;
}
export function pgPolicy(name, options) {
    return {
        $policyName: name,
        $options: options,
        $type: 'policy',
        $trackingId: undefined,
        $commentText: options.comment,
        toAST() {
            const opts = this.$options;
            return {
                name: this.$policyName,
                table: getTableName(opts.on),
                command: opts.for || 'ALL',
                permissive: opts.permissive !== false,
                roles: opts.to || [],
                using: opts.using,
                withCheck: opts.withCheck,
                comment: this.$commentText,
                trackingId: this.$trackingId,
            };
        },
        $id(trackingId) {
            this.$trackingId = trackingId;
            return this;
        },
        $comment(comment) {
            this.$commentText = comment;
            return this;
        },
    };
}
export function isPolicyConfig(value) {
    return (typeof value === 'object' &&
        value !== null &&
        '$type' in value &&
        value.$type === 'policy');
}
