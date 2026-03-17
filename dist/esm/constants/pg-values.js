export class RawValue {
    value;
    constructor(value) {
        this.value = value;
    }
    toString() {
        return this.value;
    }
}
export class PgValue {
    static NOW = new RawValue('NOW()');
    static CURRENT_TIMESTAMP = new RawValue('CURRENT_TIMESTAMP');
    static CURRENT_DATE = new RawValue('CURRENT_DATE');
    static CURRENT_TIME = new RawValue('CURRENT_TIME');
    static LOCALTIMESTAMP = new RawValue('LOCALTIMESTAMP');
    static LOCALTIME = new RawValue('LOCALTIME');
    static TRANSACTION_TIMESTAMP = new RawValue('transaction_timestamp()');
    static STATEMENT_TIMESTAMP = new RawValue('statement_timestamp()');
    static CLOCK_TIMESTAMP = new RawValue('clock_timestamp()');
    static gen_random_uuid() {
        return new RawValue('gen_random_uuid()');
    }
    static uuid_generate_v1() {
        return new RawValue('uuid_generate_v1()');
    }
    static uuid_generate_v4() {
        return new RawValue('uuid_generate_v4()');
    }
    static nextval(sequenceName) {
        return new RawValue(`nextval('${sequenceName}')`);
    }
    static currval(sequenceName) {
        return new RawValue(`currval('${sequenceName}')`);
    }
    static lastval() {
        return new RawValue('lastval()');
    }
    static setval(sequenceName, value) {
        return new RawValue(`setval('${sequenceName}', ${value})`);
    }
    static DEFAULT = new RawValue('DEFAULT');
    static NULL = new RawValue('NULL');
    static TRUE = new RawValue('TRUE');
    static FALSE = new RawValue('FALSE');
    static EMPTY_ARRAY = new RawValue('ARRAY[]::text[]');
    static EMPTY_JSONB_OBJECT = new RawValue("'{}'::jsonb");
    static EMPTY_JSONB_ARRAY = new RawValue("'[]'::jsonb");
    static raw(sql) {
        return new RawValue(sql);
    }
    static array(values, type = 'text') {
        const formatted = values.map(v => `'${String(v).replace(/'/g, "''")}'`).join(',');
        return new RawValue(`ARRAY[${formatted}]::${type}[]`);
    }
    static jsonb(value) {
        const json = JSON.stringify(value).replace(/'/g, "''");
        return new RawValue(`'${json}'::jsonb`);
    }
    static cast(value, type) {
        const escaped = String(value).replace(/'/g, "''");
        return new RawValue(`'${escaped}'::${type}`);
    }
}
export const PG = PgValue;
