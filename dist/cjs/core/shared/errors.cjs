"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelqDialectError = void 0;
const relq_errors_1 = require("../../errors/relq-errors.cjs");
class RelqDialectError extends relq_errors_1.RelqConfigError {
    dialect;
    suggestion;
    constructor(message, dialect, suggestion) {
        super(`${message}\n` +
            `  Dialect: ${dialect}\n` +
            (suggestion ? `  Suggestion: ${suggestion}` : ''));
        this.name = 'RelqDialectError';
        this.dialect = dialect;
        this.suggestion = suggestion;
    }
}
exports.RelqDialectError = RelqDialectError;
