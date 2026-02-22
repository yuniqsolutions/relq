"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pgExtractSchemaColumns = exports.pgSerializeRow = exports.pgDeserializeRows = exports.pgDeserializeRow = exports.pgSerializeValue = exports.pgDeserializeValue = exports.pgTypeCoercion = void 0;
const type_coercion_1 = require("../../../utils/type-coercion.cjs");
Object.defineProperty(exports, "pgDeserializeValue", { enumerable: true, get: function () { return type_coercion_1.deserializeValue; } });
Object.defineProperty(exports, "pgSerializeValue", { enumerable: true, get: function () { return type_coercion_1.serializeValue; } });
Object.defineProperty(exports, "pgDeserializeRow", { enumerable: true, get: function () { return type_coercion_1.deserializeRow; } });
Object.defineProperty(exports, "pgDeserializeRows", { enumerable: true, get: function () { return type_coercion_1.deserializeRows; } });
Object.defineProperty(exports, "pgSerializeRow", { enumerable: true, get: function () { return type_coercion_1.serializeRow; } });
Object.defineProperty(exports, "pgExtractSchemaColumns", { enumerable: true, get: function () { return type_coercion_1.extractSchemaColumns; } });
exports.pgTypeCoercion = {
    deserializeValue: type_coercion_1.deserializeValue,
    serializeValue: type_coercion_1.serializeValue
};
