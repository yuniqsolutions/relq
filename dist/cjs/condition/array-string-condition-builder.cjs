"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArrayStringConditionBuilder = void 0;
class ArrayStringConditionBuilder {
    parent;
    constructor(parent) {
        this.parent = parent;
    }
    startsWith(column, prefix) {
        this.parent.conditions.push({
            method: 'array_string_starts_with',
            column,
            values: { prefix }
        });
        return this.parent;
    }
    endsWith(column, suffix) {
        this.parent.conditions.push({
            method: 'array_string_ends_with',
            column,
            values: { suffix }
        });
        return this.parent;
    }
    contains(column, substring) {
        this.parent.conditions.push({
            method: 'array_string_contains',
            column,
            values: { substring }
        });
        return this.parent;
    }
    matches(column, pattern) {
        this.parent.conditions.push({
            method: 'array_string_matches',
            column,
            values: { pattern }
        });
        return this.parent;
    }
    imatches(column, pattern) {
        this.parent.conditions.push({
            method: 'array_string_imatches',
            column,
            values: { pattern }
        });
        return this.parent;
    }
    ilike(column, pattern) {
        this.parent.conditions.push({
            method: 'array_string_ilike',
            column,
            values: { pattern }
        });
        return this.parent;
    }
    allStartWith(column, prefix) {
        this.parent.conditions.push({
            method: 'array_string_all_start_with',
            column,
            values: { prefix }
        });
        return this.parent;
    }
    allEndWith(column, suffix) {
        this.parent.conditions.push({
            method: 'array_string_all_end_with',
            column,
            values: { suffix }
        });
        return this.parent;
    }
    allContain(column, substring) {
        this.parent.conditions.push({
            method: 'array_string_all_contain',
            column,
            values: { substring }
        });
        return this.parent;
    }
    lengthBetween(column, min, max) {
        this.parent.conditions.push({
            method: 'array_string_length_between',
            column,
            values: { min, max }
        });
        return this.parent;
    }
    hasEmpty(column) {
        this.parent.conditions.push({
            method: 'array_string_has_empty',
            column,
            values: {}
        });
        return this.parent;
    }
    hasNonEmpty(column) {
        this.parent.conditions.push({
            method: 'array_string_has_non_empty',
            column,
            values: {}
        });
        return this.parent;
    }
    hasUppercase(column) {
        this.parent.conditions.push({
            method: 'array_string_has_uppercase',
            column,
            values: {}
        });
        return this.parent;
    }
    hasLowercase(column) {
        this.parent.conditions.push({
            method: 'array_string_has_lowercase',
            column,
            values: {}
        });
        return this.parent;
    }
    hasNumeric(column) {
        this.parent.conditions.push({
            method: 'array_string_has_numeric',
            column,
            values: {}
        });
        return this.parent;
    }
    equals(column, value) {
        this.parent.conditions.push({
            method: 'array_string_equals',
            column,
            values: { value }
        });
        return this.parent;
    }
    iequals(column, value) {
        this.parent.conditions.push({
            method: 'array_string_iequals',
            column,
            values: { value }
        });
        return this.parent;
    }
}
exports.ArrayStringConditionBuilder = ArrayStringConditionBuilder;
