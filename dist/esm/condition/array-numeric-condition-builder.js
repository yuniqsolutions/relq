export class ArrayNumericConditionBuilder {
    parent;
    constructor(parent) {
        this.parent = parent;
    }
    greaterThan(column, value) {
        this.parent.conditions.push({
            method: 'array_numeric_greater_than',
            column,
            values: { value }
        });
        return this.parent;
    }
    greaterThanOrEqual(column, value) {
        this.parent.conditions.push({
            method: 'array_numeric_greater_than_or_equal',
            column,
            values: { value }
        });
        return this.parent;
    }
    lessThan(column, value) {
        this.parent.conditions.push({
            method: 'array_numeric_less_than',
            column,
            values: { value }
        });
        return this.parent;
    }
    lessThanOrEqual(column, value) {
        this.parent.conditions.push({
            method: 'array_numeric_less_than_or_equal',
            column,
            values: { value }
        });
        return this.parent;
    }
    between(column, min, max) {
        this.parent.conditions.push({
            method: 'array_numeric_between',
            column,
            values: { min, max }
        });
        return this.parent;
    }
    allGreaterThan(column, value) {
        this.parent.conditions.push({
            method: 'array_numeric_all_greater_than',
            column,
            values: { value }
        });
        return this.parent;
    }
    allLessThan(column, value) {
        this.parent.conditions.push({
            method: 'array_numeric_all_less_than',
            column,
            values: { value }
        });
        return this.parent;
    }
    allBetween(column, min, max) {
        this.parent.conditions.push({
            method: 'array_numeric_all_between',
            column,
            values: { min, max }
        });
        return this.parent;
    }
    sumEquals(column, target) {
        this.parent.conditions.push({
            method: 'array_numeric_sum_equals',
            column,
            values: { target }
        });
        return this.parent;
    }
    sumGreaterThan(column, target) {
        this.parent.conditions.push({
            method: 'array_numeric_sum_greater_than',
            column,
            values: { target }
        });
        return this.parent;
    }
    sumLessThan(column, target) {
        this.parent.conditions.push({
            method: 'array_numeric_sum_less_than',
            column,
            values: { target }
        });
        return this.parent;
    }
    avgEquals(column, target) {
        this.parent.conditions.push({
            method: 'array_numeric_avg_equals',
            column,
            values: { target }
        });
        return this.parent;
    }
    avgGreaterThan(column, target) {
        this.parent.conditions.push({
            method: 'array_numeric_avg_greater_than',
            column,
            values: { target }
        });
        return this.parent;
    }
    avgLessThan(column, target) {
        this.parent.conditions.push({
            method: 'array_numeric_avg_less_than',
            column,
            values: { target }
        });
        return this.parent;
    }
    maxEquals(column, target) {
        this.parent.conditions.push({
            method: 'array_numeric_max_equals',
            column,
            values: { target }
        });
        return this.parent;
    }
    minEquals(column, target) {
        this.parent.conditions.push({
            method: 'array_numeric_min_equals',
            column,
            values: { target }
        });
        return this.parent;
    }
    equals(column, value) {
        this.parent.conditions.push({
            method: 'array_numeric_equals',
            column,
            values: { value }
        });
        return this.parent;
    }
    hasEven(column) {
        this.parent.conditions.push({
            method: 'array_numeric_has_even',
            column,
            values: {}
        });
        return this.parent;
    }
    hasOdd(column) {
        this.parent.conditions.push({
            method: 'array_numeric_has_odd',
            column,
            values: {}
        });
        return this.parent;
    }
    hasPositive(column) {
        this.parent.conditions.push({
            method: 'array_numeric_has_positive',
            column,
            values: {}
        });
        return this.parent;
    }
    hasNegative(column) {
        this.parent.conditions.push({
            method: 'array_numeric_has_negative',
            column,
            values: {}
        });
        return this.parent;
    }
    hasZero(column) {
        this.parent.conditions.push({
            method: 'array_numeric_has_zero',
            column,
            values: {}
        });
        return this.parent;
    }
}
