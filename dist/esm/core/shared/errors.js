import { RelqConfigError } from "../../errors/relq-errors.js";
export class RelqDialectError extends RelqConfigError {
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
