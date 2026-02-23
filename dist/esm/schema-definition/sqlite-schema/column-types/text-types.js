import { createSQLiteColumnWithName } from "./column-builder.js";
export function text(columnName) {
    return createSQLiteColumnWithName('TEXT', columnName);
}
export function varchar(arg1, arg2) {
    let columnName;
    let length;
    if (arg1 === undefined) {
    }
    else if (typeof arg1 === 'number') {
        length = arg1;
    }
    else {
        columnName = arg1;
        if (arg2 !== undefined)
            length = arg2;
    }
    const col = createSQLiteColumnWithName('TEXT', columnName);
    if (length !== undefined) {
        col.$length = length;
    }
    return col;
}
export function char(arg1, arg2) {
    let columnName;
    let length;
    if (arg1 === undefined) {
        length = 1;
    }
    else if (typeof arg1 === 'number') {
        length = arg1;
    }
    else {
        columnName = arg1;
        length = arg2 ?? 1;
    }
    const col = createSQLiteColumnWithName('TEXT', columnName);
    col.$length = length;
    return col;
}
