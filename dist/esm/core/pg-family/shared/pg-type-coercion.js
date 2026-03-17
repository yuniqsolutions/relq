import { deserializeValue, serializeValue, deserializeRow, deserializeRows, serializeRow, extractSchemaColumns } from "../../../utils/type-coercion.js";
export const pgTypeCoercion = {
    deserializeValue,
    serializeValue
};
export { deserializeValue as pgDeserializeValue, serializeValue as pgSerializeValue, deserializeRow as pgDeserializeRow, deserializeRows as pgDeserializeRows, serializeRow as pgSerializeRow, extractSchemaColumns as pgExtractSchemaColumns };
