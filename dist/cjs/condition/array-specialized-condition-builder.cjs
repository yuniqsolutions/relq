"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Jsonb = exports.Date = exports.Uuid = exports.ArrayJsonbConditionBuilder = exports.ArrayDateConditionBuilder = exports.ArrayUuidConditionBuilder = void 0;
class ArrayUuidConditionBuilder {
    parent;
    constructor(parent) {
        this.parent = parent;
    }
    allValid(column) {
        this.parent.conditions.push({
            method: 'array_uuid_all_valid',
            column,
            values: {}
        });
        return this.parent;
    }
    hasVersion(column, version) {
        this.parent.conditions.push({
            method: 'array_uuid_has_version',
            column,
            values: { version }
        });
        return this.parent;
    }
    equals(column, uuid) {
        this.parent.conditions.push({
            method: 'array_uuid_equals',
            column,
            values: { uuid }
        });
        return this.parent;
    }
}
exports.ArrayUuidConditionBuilder = ArrayUuidConditionBuilder;
exports.Uuid = ArrayUuidConditionBuilder;
class ArrayDateConditionBuilder {
    parent;
    constructor(parent) {
        this.parent = parent;
    }
    before(column, date) {
        this.parent.conditions.push({
            method: 'array_date_before',
            column,
            values: { date: date instanceof Date ? date.toISOString() : date }
        });
        return this.parent;
    }
    after(column, date) {
        this.parent.conditions.push({
            method: 'array_date_after',
            column,
            values: { date: date instanceof Date ? date.toISOString() : date }
        });
        return this.parent;
    }
    between(column, start, end) {
        this.parent.conditions.push({
            method: 'array_date_between',
            column,
            values: {
                start: start instanceof Date ? start.toISOString() : start,
                end: end instanceof Date ? end.toISOString() : end
            }
        });
        return this.parent;
    }
    withinDays(column, days) {
        this.parent.conditions.push({
            method: 'array_date_within_days',
            column,
            values: { days }
        });
        return this.parent;
    }
    equals(column, date) {
        this.parent.conditions.push({
            method: 'array_date_equals',
            column,
            values: { date: date instanceof Date ? date.toISOString() : date }
        });
        return this.parent;
    }
    hasToday(column) {
        this.parent.conditions.push({
            method: 'array_date_has_today',
            column,
            values: {}
        });
        return this.parent;
    }
    hasPast(column) {
        this.parent.conditions.push({
            method: 'array_date_has_past',
            column,
            values: {}
        });
        return this.parent;
    }
    hasFuture(column) {
        this.parent.conditions.push({
            method: 'array_date_has_future',
            column,
            values: {}
        });
        return this.parent;
    }
    hasThisWeek(column) {
        this.parent.conditions.push({
            method: 'array_date_has_this_week',
            column,
            values: {}
        });
        return this.parent;
    }
    hasThisMonth(column) {
        this.parent.conditions.push({
            method: 'array_date_has_this_month',
            column,
            values: {}
        });
        return this.parent;
    }
    hasThisYear(column) {
        this.parent.conditions.push({
            method: 'array_date_has_this_year',
            column,
            values: {}
        });
        return this.parent;
    }
}
exports.ArrayDateConditionBuilder = ArrayDateConditionBuilder;
exports.Date = ArrayDateConditionBuilder;
class ArrayJsonbConditionBuilder {
    parent;
    constructor(parent) {
        this.parent = parent;
    }
    hasKey(column, key) {
        this.parent.conditions.push({
            method: 'array_jsonb_has_key',
            column,
            values: { key }
        });
        return this.parent;
    }
    hasPath(column, path) {
        this.parent.conditions.push({
            method: 'array_jsonb_has_path',
            column,
            values: { path }
        });
        return this.parent;
    }
    contains(column, value) {
        this.parent.conditions.push({
            method: 'array_jsonb_contains',
            column,
            values: { value }
        });
        return this.parent;
    }
    containedBy(column, value) {
        this.parent.conditions.push({
            method: 'array_jsonb_contained_by',
            column,
            values: { value }
        });
        return this.parent;
    }
    equals(column, value) {
        this.parent.conditions.push({
            method: 'array_jsonb_equals',
            column,
            values: { value }
        });
        return this.parent;
    }
    pathEquals(column, path, value) {
        this.parent.conditions.push({
            method: 'array_jsonb_path_equals',
            column,
            values: { path, value }
        });
        return this.parent;
    }
    hasObject(column) {
        this.parent.conditions.push({
            method: 'array_jsonb_has_object',
            column,
            values: {}
        });
        return this.parent;
    }
    hasArray(column) {
        this.parent.conditions.push({
            method: 'array_jsonb_has_array',
            column,
            values: {}
        });
        return this.parent;
    }
}
exports.ArrayJsonbConditionBuilder = ArrayJsonbConditionBuilder;
exports.Jsonb = ArrayJsonbConditionBuilder;
