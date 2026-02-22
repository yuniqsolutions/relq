export function toCamelCase(str) {
    if (!str)
        return 'unknown';
    const cleaned = str.replace(/^[_0-9]+/, '');
    return cleaned
        .split('_')
        .map((word, i) => i === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');
}
export function toPascalCase(str) {
    if (!str)
        return 'Unknown';
    const cleaned = str.replace(/^[_0-9]+/, '');
    return cleaned
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');
}
export function escapeString(str) {
    return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}
export function escapeJsDocString(str) {
    return str.replace(/\*\//g, '*\\/').replace(/\n/g, '\n * ');
}
export function pluralize(word) {
    if (!word)
        return word;
    if (word.endsWith('s') || word.endsWith('x') || word.endsWith('z') ||
        word.endsWith('ch') || word.endsWith('sh')) {
        return word + 'es';
    }
    if (word.endsWith('y') && !['a', 'e', 'i', 'o', 'u'].includes(word[word.length - 2])) {
        return word.slice(0, -1) + 'ies';
    }
    return word + 's';
}
export function isBalanced(str) {
    let count = 0;
    for (const char of str) {
        if (char === '(')
            count++;
        if (char === ')')
            count--;
        if (count < 0)
            return false;
    }
    return count === 0;
}
export function getComparisonMethod(op) {
    switch (op) {
        case '>': return 'gt';
        case '>=': return 'gte';
        case '<': return 'lt';
        case '<=': return 'lte';
        case '=': return 'eq';
        case '<>':
        case '!=': return 'neq';
        default: return 'eq';
    }
}
