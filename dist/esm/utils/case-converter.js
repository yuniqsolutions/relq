export function convertCase(str, type) {
    if (!str || typeof str !== 'string')
        return str;
    function toCamel(s) {
        return s.split(/[_\s-]+/).filter(segment => segment.length > 0).map((segment, index) => {
            if (index === 0)
                return segment.charAt(0).toLowerCase() + segment.slice(1).toLowerCase();
            return segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase();
        }).join('').replace(/'/g, '');
    }
    function toPascal(s) {
        return s.split(/[_\s-]+/).filter(segment => segment.length > 0).map(segment => {
            return segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase();
        }).join('').replace(/'/g, '');
    }
    function toSnake(s) {
        return s.split(/[_\s-]+/).filter(segment => segment.length > 0).map(segment => {
            return segment.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
        }).join('_').replace(/'/g, '');
    }
    switch (type) {
        case 'snake2camel':
            return /^[a-z0-9]+(_[a-z0-9]+)*$/.test(str)
                ? str.split('_').map((word, index) => index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)).join('')
                : str;
        case 'snake2pascal':
            return /^[a-z0-9]+(_[a-z0-9]+)*$/.test(str)
                ? str.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('')
                : str;
        case 'camel2snake':
            return /^[a-z][a-z0-9]*([A-Z][a-z0-9]*)*$/.test(str)
                ? str.replace(/([A-Z])/g, '_$1').toLowerCase()
                : str;
        case 'camel2pascal':
            return /^[a-z][a-z0-9]*([A-Z][a-z0-9]*)*$/.test(str)
                ? str.charAt(0).toUpperCase() + str.slice(1)
                : str;
        case 'pascal2snake':
            return /^[A-Z][a-z0-9]*([A-Z][a-z0-9]*)*$/.test(str)
                ? str.replace(/([A-Z])/g, (match, offset) => offset > 0 ? '_' + match : match).toLowerCase()
                : str;
        case 'pascal2camel':
            return /^[A-Z][a-z0-9]*([A-Z][a-z0-9]*)*$/.test(str)
                ? str.charAt(0).toLowerCase() + str.slice(1)
                : str;
        case '2camel':
            return toCamel(str);
        case '2pascal':
            return toPascal(str);
        case '2snake':
            return toSnake(str);
        default:
            return str;
    }
}
