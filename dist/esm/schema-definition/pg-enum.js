export function pgEnum(name, values) {
    const config = function (columnName) {
        const col = {
            $type: name,
            $enumName: name,
            $checkValues: values,
        };
        if (columnName) {
            col.$columnName = columnName;
        }
        return Object.assign(col, {
            notNull() {
                col.$nullable = false;
                return Object.assign(this, { $nullable: false });
            },
            nullable() {
                col.$nullable = true;
                return Object.assign(this, { $nullable: true });
            },
            default(value) {
                col.$default = value;
                return Object.assign(this, { $default: value });
            },
            primaryKey() {
                col.$primaryKey = true;
                return Object.assign(this, { $primaryKey: true });
            },
            unique() {
                col.$unique = true;
                return Object.assign(this, { $unique: true });
            },
            array() {
                col.$array = true;
                col.$type = `${name}[]`;
                return Object.assign(this, { $array: true, $type: `${name}[]` });
            },
        });
    };
    Object.defineProperties(config, {
        $enumName: { value: name, enumerable: true },
        $enumValues: { value: values, enumerable: true },
        $inferEnum: { value: undefined },
        values: { value: values, enumerable: true },
        name: { value: name, enumerable: true },
        includes: {
            value: (value) => {
                return typeof value === 'string' && values.includes(value);
            },
            enumerable: true,
        },
        toAST: {
            value: function () {
                return {
                    name: this.$enumName,
                    values: [...this.$enumValues],
                    trackingId: this.$trackingId,
                };
            },
            enumerable: true,
        },
    });
    return config;
}
export function generateEnumSQL(name, values) {
    const escapedValues = values.map(v => `'${v.replace(/'/g, "''")}'`).join(', ');
    return `CREATE TYPE "${name}" AS ENUM (${escapedValues});`;
}
export function dropEnumSQL(name) {
    return `DROP TYPE IF EXISTS "${name}" CASCADE;`;
}
export function addEnumValueSQL(enumName, newValue, position) {
    let sql = `ALTER TYPE "${enumName}" ADD VALUE '${newValue.replace(/'/g, "''")}'`;
    if (position?.before) {
        sql += ` BEFORE '${position.before.replace(/'/g, "''")}'`;
    }
    else if (position?.after) {
        sql += ` AFTER '${position.after.replace(/'/g, "''")}'`;
    }
    return sql + ';';
}
