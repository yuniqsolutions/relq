const isColorSupported = process.stdout.isTTY && !process.env.NO_COLOR;
function wrap(code, reset) {
    return (s) => isColorSupported ? `\x1b[${code}m${s}\x1b[${reset}m` : s;
}
export const colors = {
    red: wrap('31', '0'),
    green: wrap('32', '0'),
    yellow: wrap('33', '0'),
    blue: wrap('34', '0'),
    magenta: wrap('35', '0'),
    cyan: wrap('36', '0'),
    white: wrap('37', '0'),
    gray: wrap('90', '0'),
    bold: wrap('1', '0'),
    dim: wrap('2', '0'),
    muted: wrap('90', '0'),
    strikethrough: wrap('9', '29'),
};
