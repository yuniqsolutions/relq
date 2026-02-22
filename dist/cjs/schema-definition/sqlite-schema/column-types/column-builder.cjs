"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSQLiteColumn = createSQLiteColumn;
exports.createSQLiteColumnWithName = createSQLiteColumnWithName;
function createSQLiteColumn(type) {
    const config = { $type: type };
    const builder = {
        ...config,
        $sqlType: type,
        notNull() {
            config.$nullable = false;
            return Object.assign(this, { $nullable: false });
        },
        nullable() {
            config.$nullable = true;
            return Object.assign(this, { $nullable: true });
        },
        default(value) {
            config.$default = value;
            return Object.assign(this, { $default: value });
        },
        primaryKey() {
            config.$primaryKey = true;
            return Object.assign(this, { $primaryKey: true });
        },
        unique() {
            config.$unique = true;
            return Object.assign(this, { $unique: true });
        },
        references(table, column, options) {
            config.$references = { table, column, ...options };
            return Object.assign(this, { $references: config.$references });
        },
        check(name, values) {
            const expression = `${name} IN ('${values.join("', '")}')`;
            config.$checkName = name;
            config.$checkValues = values;
            config.$check = expression;
            return Object.assign(this, { $check: expression, $checkName: name, $checkValues: values });
        },
        checkNot(name, values) {
            const expression = `${name} NOT IN ('${values.join("', '")}')`;
            config.$checkNotName = name;
            config.$checkNotValues = values;
            config.$checkNot = expression;
            return Object.assign(this, { $checkNot: expression, $checkNotName: name, $checkNotValues: values });
        },
        $type() {
            return this;
        },
        autoincrement() {
            config.$autoincrement = true;
            return Object.assign(this, { $autoincrement: true });
        },
        collate(collation) {
            config.$collate = collation;
            return Object.assign(this, { $collate: collation });
        },
        comment(text) {
            config.$comment = text;
            return Object.assign(this, { $comment: text });
        },
        $id(trackingId) {
            config.$trackingId = trackingId;
            return Object.assign(this, { $trackingId: trackingId });
        },
    };
    return builder;
}
function createSQLiteColumnWithName(type, columnName) {
    const col = createSQLiteColumn(type);
    if (columnName) {
        col.$columnName = columnName;
    }
    return col;
}
