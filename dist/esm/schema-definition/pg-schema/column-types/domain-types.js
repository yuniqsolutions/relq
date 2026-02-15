import { createColumnWithName } from "./column-builder.js";
function createDomainCheckCondition(sql, validate, name) {
    return {
        $sql: sql,
        $name: name,
        $validate: validate,
        and(other) {
            return createDomainCheckCondition(`(${this.$sql}) AND (${other.$sql})`, (val) => this.$validate(val) && other.$validate(val), this.$name || other.$name);
        },
        or(other) {
            return createDomainCheckCondition(`(${this.$sql}) OR (${other.$sql})`, (val) => this.$validate(val) || other.$validate(val), this.$name || other.$name);
        },
        as(constraintName) {
            return createDomainCheckCondition(this.$sql, this.$validate, constraintName);
        },
    };
}
function formatDomainValue(val) {
    if (val === null)
        return 'NULL';
    if (typeof val === 'number')
        return String(val);
    if (typeof val === 'boolean')
        return val ? 'TRUE' : 'FALSE';
    if (typeof val === 'string')
        return `'${val.replace(/'/g, "''")}'`;
    return String(val);
}
function createDomainValueExpr() {
    return {
        eq(value) {
            return createDomainCheckCondition(`VALUE = ${formatDomainValue(value)}`, (val) => val === value);
        },
        neq(value) {
            return createDomainCheckCondition(`VALUE <> ${formatDomainValue(value)}`, (val) => val !== value);
        },
        gt(value) {
            return createDomainCheckCondition(`VALUE > ${formatDomainValue(value)}`, (val) => val > value);
        },
        gte(value) {
            return createDomainCheckCondition(`VALUE >= ${formatDomainValue(value)}`, (val) => val >= value);
        },
        lt(value) {
            return createDomainCheckCondition(`VALUE < ${formatDomainValue(value)}`, (val) => val < value);
        },
        lte(value) {
            return createDomainCheckCondition(`VALUE <= ${formatDomainValue(value)}`, (val) => val <= value);
        },
        between(min, max) {
            return createDomainCheckCondition(`${formatDomainValue(min)} AND ${formatDomainValue(max)}`, (val) => val >= min && val <= max);
        },
        in(values) {
            const formatted = values.map(formatDomainValue).join(', ');
            return createDomainCheckCondition(`VALUE IN (${formatted})`, (val) => values.includes(val));
        },
        notIn(values) {
            const formatted = values.map(formatDomainValue).join(', ');
            return createDomainCheckCondition(`VALUE NOT IN (${formatted})`, (val) => !values.includes(val));
        },
        isNull() {
            return createDomainCheckCondition(`VALUE IS NULL`, (val) => val === null);
        },
        isNotNull() {
            return createDomainCheckCondition(`VALUE IS NOT NULL`, (val) => val !== null);
        },
        like(pattern) {
            try {
                const regex = new RegExp('^' + pattern.replace(/%/g, '.*').replace(/_/g, '.') + '$');
                return createDomainCheckCondition(`VALUE LIKE ${formatDomainValue(pattern)}`, (val) => typeof val === 'string' && regex.test(val));
            }
            catch (e) {
                throw new Error(`[Relq] Invalid LIKE pattern in domain: "${pattern}". ${e instanceof Error ? e.message : String(e)}`);
            }
        },
        notLike(pattern) {
            try {
                const regex = new RegExp('^' + pattern.replace(/%/g, '.*').replace(/_/g, '.') + '$');
                return createDomainCheckCondition(`VALUE NOT LIKE ${formatDomainValue(pattern)}`, (val) => typeof val === 'string' && !regex.test(val));
            }
            catch (e) {
                throw new Error(`[Relq] Invalid NOT LIKE pattern in domain: "${pattern}". ${e instanceof Error ? e.message : String(e)}`);
            }
        },
        ilike(pattern) {
            try {
                const regex = new RegExp('^' + pattern.replace(/%/g, '.*').replace(/_/g, '.') + '$', 'i');
                return createDomainCheckCondition(`VALUE ILIKE ${formatDomainValue(pattern)}`, (val) => typeof val === 'string' && regex.test(val));
            }
            catch (e) {
                throw new Error(`[Relq] Invalid ILIKE pattern in domain: "${pattern}". ${e instanceof Error ? e.message : String(e)}`);
            }
        },
        notIlike(pattern) {
            try {
                const regex = new RegExp('^' + pattern.replace(/%/g, '.*').replace(/_/g, '.') + '$', 'i');
                return createDomainCheckCondition(`VALUE NOT ILIKE ${formatDomainValue(pattern)}`, (val) => typeof val === 'string' && !regex.test(val));
            }
            catch (e) {
                throw new Error(`[Relq] Invalid NOT ILIKE pattern in domain: "${pattern}". ${e instanceof Error ? e.message : String(e)}`);
            }
        },
        matches(regex) {
            try {
                const re = new RegExp(regex, 'i');
                return createDomainCheckCondition(`VALUE ~* ${formatDomainValue(regex)}`, (val) => typeof val === 'string' && re.test(val));
            }
            catch (e) {
                throw new Error(`[Relq] Invalid regex pattern in domain matches(): "${regex}". Tip: Use double backslashes (\\\\d instead of \\d) in string literals. ${e instanceof Error ? e.message : String(e)}`);
            }
        },
        matchesCaseSensitive(regex) {
            try {
                const re = new RegExp(regex);
                return createDomainCheckCondition(`VALUE ~ ${formatDomainValue(regex)}`, (val) => typeof val === 'string' && re.test(val));
            }
            catch (e) {
                throw new Error(`[Relq] Invalid regex pattern in domain matchesCaseSensitive(): "${regex}". Tip: Use double backslashes (\\\\d instead of \\d) in string literals. ${e instanceof Error ? e.message : String(e)}`);
            }
        },
        lengthGt(n) {
            return createDomainCheckCondition(`LENGTH(VALUE) > ${n}`, (val) => typeof val === 'string' && val.length > n);
        },
        lengthGte(n) {
            return createDomainCheckCondition(`LENGTH(VALUE) >= ${n}`, (val) => typeof val === 'string' && val.length >= n);
        },
        lengthLt(n) {
            return createDomainCheckCondition(`LENGTH(VALUE) < ${n}`, (val) => typeof val === 'string' && val.length < n);
        },
        lengthLte(n) {
            return createDomainCheckCondition(`LENGTH(VALUE) <= ${n}`, (val) => typeof val === 'string' && val.length <= n);
        },
        lengthEq(n) {
            return createDomainCheckCondition(`LENGTH(VALUE) = ${n}`, (val) => typeof val === 'string' && val.length === n);
        },
    };
}
export function pgDomain(name, baseType, checks) {
    const bt = baseType;
    const baseTypeStr = bt.$sqlType || (typeof bt.$type === 'string' ? bt.$type : null) || 'TEXT';
    const constraints = [];
    let validateFn;
    if (checks) {
        const valueExpr = createDomainValueExpr();
        const conditions = checks(valueExpr);
        for (const cond of conditions) {
            if (cond.$name) {
                constraints.push(`CONSTRAINT ${cond.$name} CHECK (${cond.$sql})`);
            }
            else {
                constraints.push(`CHECK (${cond.$sql})`);
            }
            const currentValidate = cond.$validate;
            if (!validateFn) {
                validateFn = currentValidate;
            }
            else {
                const prev = validateFn;
                validateFn = (val) => prev(val) && currentValidate(val);
            }
        }
    }
    const notNull = bt?.$nullable === false;
    const defaultValue = bt?.$default;
    const domainFn = (columnName) => {
        const col = createColumnWithName(name, columnName);
        if (validateFn) {
            col.$validate = validateFn;
        }
        return col;
    };
    let checkExpression;
    let checkName;
    if (constraints.length > 0) {
        const firstConstraint = constraints[0];
        const namedMatch = firstConstraint.match(/^CONSTRAINT\s+(\w+)\s+CHECK\s*\((.+)\)$/i);
        const unnamedMatch = firstConstraint.match(/^CHECK\s*\((.+)\)$/i);
        if (namedMatch) {
            checkName = namedMatch[1];
            checkExpression = namedMatch[2];
        }
        else if (unnamedMatch) {
            checkExpression = unnamedMatch[1];
        }
    }
    const domainConfig = {
        $domainName: name,
        $baseType: baseTypeStr,
        $constraints: constraints.length > 0 ? constraints : undefined,
        $domainDefault: defaultValue,
        $notNull: notNull,
        $columnBuilder: baseType,
        $validate: validateFn,
        $trackingId: undefined,
        toAST() {
            return {
                name: domainConfig.$domainName,
                baseType: domainConfig.$baseType,
                notNull: domainConfig.$notNull ?? false,
                defaultValue: domainConfig.$domainDefault !== undefined
                    ? String(domainConfig.$domainDefault)
                    : undefined,
                checkExpression,
                checkName,
                trackingId: domainConfig.$trackingId,
            };
        },
        $id(trackingId) {
            domainConfig.$trackingId = trackingId;
            return domainFn;
        },
    };
    Object.assign(domainFn, domainConfig);
    return domainFn;
}
export function generateDomainSQL(domain) {
    let sql = `CREATE DOMAIN "${domain.$domainName}" AS ${domain.$baseType}`;
    if (domain.$collation) {
        sql += ` COLLATE "${domain.$collation}"`;
    }
    if (domain.$domainDefault !== undefined) {
        sql += ` DEFAULT ${typeof domain.$domainDefault === 'string' ? `'${domain.$domainDefault}'` : domain.$domainDefault}`;
    }
    if (domain.$constraints) {
        sql += ' ' + domain.$constraints.join(' ');
    }
    return sql + ';';
}
